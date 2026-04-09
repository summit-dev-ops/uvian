# executors/agent_executor.py
"""
AgentExecutor - Multi-agent system executor with modular architecture.

Uses the EventLoader composable module for unified event processing:
- Event-to-message transformation via EventTransformerRegistry
- Skill loading based on event types
- MCP loading (filter + connect + load tools) based on event types

Used by both initial event processing and thread-wakeup (inbox) processing.
"""
from typing import List, Any
from datetime import datetime, timezone
from executors.base import BaseExecutor, JobData, JobResult
from core.agents.universal_agent.agent import build_agent
from core.agents.utils.loader import prepare_for_events, prepare_for_inbox_events
from clients.mcp import PersistentMCPClient, MCPRegistry
from clients.auth import get_agent_secrets
from clients.config import get_agent_skills
from repositories.process_threads import process_thread_repository
from core.logging import worker_logger
from langgraph.types import Command
from langchain_core.messages import HumanMessage
import uuid


class AgentExecutor(BaseExecutor):
    
    async def execute(self, job_data: JobData) -> JobResult:
        job_id = job_data["id"]
        inputs = job_data.get("input", {})
        
        job_type = job_data.get("type")
        input_type = inputs.get("inputType")
        
        if job_type == "thread-wakeup":
            return await self._execute_thread_wakeup(job_data, inputs)
        
        if input_type != "event":
            raise ValueError(f"AgentExecutor only handles 'event' inputType or 'thread-wakeup' job type, got: {input_type}")
        
        event_type = inputs.get("eventType")
        if not event_type:
            raise ValueError("eventType is required in job input")
        
        agent_user_id = inputs.get("agentId") or inputs.get("agent_user_id") or job_data.get("agent_id")
        if not agent_user_id:
            raise ValueError("agentId is required in job input")
        
        conversation_id = inputs.get("context", {}).get("conversationId")
        resource = inputs.get("resource", {})
        resource_id = resource.get("id")
        if not conversation_id and resource.get("type") == "conversation":
            conversation_id = resource_id
        
        thread_id = inputs.get("threadId")
        is_resume = inputs.get("isResume", False)
        
        if not thread_id:
            thread_id = str(uuid.uuid4())
            created_thread = await process_thread_repository.create_thread(
                thread_id=thread_id,
                agent_profile_id=agent_user_id,
                metadata=None
            )
        
        secrets = await get_agent_secrets(agent_user_id)
        
        llm_config = {}
        if secrets.get("llms"):
            default_llm = next(
                (al for al in secrets["llms"] if al.get("is_default")),
                secrets["llms"][0],
            )
            if default_llm and default_llm.get("llms"):
                llm = default_llm["llms"]
                llm_config = {
                    "model_name": llm.get("model_name"),
                    "base_url": llm.get("base_url"),
                    "api_key": llm.get("api_key"),
                    "temperature": llm.get("temperature"),
                }
        
        all_mcp_configs = secrets.get("mcps", [])
        all_skills = await get_agent_skills(agent_user_id)
        
        mcp_tools = []
        mcp_registry = None
        available_mcps = []
        agent_input = None
        
        from core.agents.utils.mcp_mapping import get_mcps_for_event
        
        relevant_mcp_configs = get_mcps_for_event(event_type, all_mcp_configs)
        
        async with PersistentMCPClient() as persistent_client:
            if relevant_mcp_configs:
                for cfg in relevant_mcp_configs:
                    if cfg.get("url"):
                        persistent_client.add_server(
                            mcp_id=cfg["id"],
                            url=cfg["url"],
                            auth_method=cfg.get("auth_method", "bearer"),
                            auth_secret=cfg.get("_auth_secret"),
                            jwt_secret=cfg.get("_jwt_secret"),
                            name=cfg.get("name"),
                        )
                
                await persistent_client.connect_all()
                await persistent_client.fetch_all_metadata()
                available_mcps = persistent_client.get_rich_catalog()
                mcp_registry = MCPRegistry(client=persistent_client)
            
            if not is_resume:
                event_message, mcp_tools, matched_skills, matched_mcp_names = await prepare_for_events(
                    event_type=event_type,
                    event_data=inputs,
                    skills=all_skills,
                    mcp_configs=relevant_mcp_configs,
                    persistent_client=persistent_client,
                )
                
                current_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
                message_content = event_message.content
                if "{current_time}" in message_content:
                    message_content = message_content.replace("{current_time}", current_time)
                else:
                    message_content += f"\nCurrent Time: {current_time}"
                
                available_skills = [
                    {"name": s.get("name"), "description": s.get("description", "")}
                    for s in all_skills if s.get("name")
                ]
                
                loaded_skills = [
                    {"name": s.get("name"), "description": s.get("description", ""), "content": s.get("content", "")}
                    for s in matched_skills if s.get("name")
                ]
                
                available_mcps_data = persistent_client.get_rich_catalog() if relevant_mcp_configs else []
                available_mcps = [
                    {"name": m.get("name"), "description": m.get("description", ""), 
                     "tool_names": [t.get("name") for t in m.get("tools", [])]}
                    for m in available_mcps_data
                ]
                
                loaded_mcps = []
                if matched_mcp_names:
                    for mcp in available_mcps_data:
                        if mcp.get("name") in matched_mcp_names:
                            loaded_mcps.append({
                                "name": mcp.get("name"),
                                "description": mcp.get("description", ""),
                                "tools": mcp.get("tools", [])
                            })
                
                initial_messages = [HumanMessage(content=message_content)]
                
                channel = f"conversation:{conversation_id}:messages" if conversation_id else f"agent:{agent_user_id}:messages"
                
                agent_input = {
                    "messages": initial_messages,
                    "available_skills": available_skills,
                    "loaded_skills": loaded_skills,
                    "available_mcps": available_mcps,
                    "loaded_mcps": loaded_mcps,
                    "custom_instructions": "",
                    "agent_name": "Agent",
                    "llm_calls": 0,
                    "channel_id": channel,
                    "conversation_id": conversation_id or "",
                    "agent_user_id": agent_user_id,
                    "thread_id": thread_id,
                    "message_id": str(uuid.uuid4()),
                    "event_type": event_type,
                    "event_metadata": {},
                }
            else:
                resolution_payload = inputs.get("resolutionPayload")
                if resolution_payload:
                    agent_input = Command(resume=resolution_payload)
                else:
                    agent_input = None
            
            config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 100}
            if mcp_registry:
                config["configurable"]["mcp_registry"] = mcp_registry
            
            full_response: List[Any] = []
            try:
                agent = build_agent(mcp_tools, llm_config, mcp_registry=mcp_registry)
                async for chunk, _m in agent.astream(
                    agent_input,
                    config=config,
                    stream_mode="messages",
                ):
                    full_response.append(chunk)

                return {
                    "status": "completed",
                    "result": {
                        "event_type": event_type,
                        "conversationId": conversation_id,
                        "resourceId": resource_id,
                    },
                }
            except Exception as e:
                return {
                    "status": "failed",
                    "result": {
                        "error": str(e),
                        "event_type": event_type,
                    },
                }
    
    async def _execute_thread_wakeup(self, job_data: JobData, inputs: dict) -> JobResult:
        job_id = job_data["id"]
        thread_id = inputs.get("threadId")
        agent_user_id = inputs.get("agentId")
        
        if not thread_id or not agent_user_id:
            raise ValueError("threadId and agentId are required for thread-wakeup jobs")
        
        secrets = await get_agent_secrets(agent_user_id)
        
        llm_config = {}
        if secrets.get("llms"):
            default_llm = next(
                (al for al in secrets["llms"] if al.get("is_default")),
                secrets["llms"][0],
            )
            if default_llm and default_llm.get("llms"):
                llm = default_llm["llms"]
                llm_config = {
                    "model_name": llm.get("model_name"),
                    "base_url": llm.get("base_url"),
                    "api_key": llm.get("api_key"),
                    "temperature": llm.get("temperature"),
                }
        
        all_mcp_configs = secrets.get("mcps", [])
        all_skills = await get_agent_skills(agent_user_id)
        
        mcp_tools = []
        mcp_registry = None
        available_mcps = []
        
        from repositories.thread_inbox import thread_inbox_repository
        pending_messages = await thread_inbox_repository.fetch_pending_messages(thread_id)
        
        from core.agents.utils.mcp_mapping import get_mcps_for_event
        event_types = list(set(msg["event_type"] for msg in pending_messages)) if pending_messages else []
        
        relevant_mcp_configs = []
        for event_type in event_types:
            relevant_mcp_configs.extend(get_mcps_for_event(event_type, all_mcp_configs))
        
        from collections import defaultdict
        seen = {}
        unique_mcp_configs = []
        for cfg in relevant_mcp_configs:
            mcp_id = cfg.get("id", "")
            if mcp_id and mcp_id not in seen:
                seen[mcp_id] = True
                unique_mcp_configs.append(cfg)
        relevant_mcp_configs = unique_mcp_configs
        
        async with PersistentMCPClient() as persistent_client:
            if relevant_mcp_configs:
                for cfg in relevant_mcp_configs:
                    if cfg.get("url"):
                        persistent_client.add_server(
                            mcp_id=cfg["id"],
                            url=cfg["url"],
                            auth_method=cfg.get("auth_method", "bearer"),
                            auth_secret=cfg.get("_auth_secret"),
                            jwt_secret=cfg.get("_jwt_secret"),
                            name=cfg.get("name"),
                        )
                
                await persistent_client.connect_all()
                await persistent_client.fetch_all_metadata()
            available_mcps_catalog = persistent_client.get_rich_catalog() if relevant_mcp_configs else []
            mcp_registry = MCPRegistry(client=persistent_client)
            
            human_messages, mcp_tools, matched_skills, matched_mcp_names, processed_ids = await prepare_for_inbox_events(
                pending_messages=pending_messages,
                skills=all_skills,
                mcp_configs=relevant_mcp_configs,
                persistent_client=persistent_client,
            )
            
            if processed_ids:
                await thread_inbox_repository.mark_processed(processed_ids)
            
            available_skills = [
                {"name": s.get("name"), "description": s.get("description", "")}
                for s in all_skills if s.get("name")
            ]
            
            loaded_skills = [
                {"name": s.get("name"), "description": s.get("description", ""), "content": s.get("content", "")}
                for s in matched_skills if s.get("name")
            ]
            
            available_mcps = [
                {"name": m.get("name"), "description": m.get("description", ""), 
                 "tool_names": [t.get("name") for t in m.get("tools", [])]}
                for m in available_mcps_catalog
            ]
            
            loaded_mcps = []
            for mcp in available_mcps_catalog:
                if mcp.get("name") in matched_mcp_names:
                    loaded_mcps.append({
                        "name": mcp.get("name"),
                        "description": mcp.get("description", ""),
                        "tools": mcp.get("tools", [])
                    })
            
            channel = f"agent:{agent_user_id}:messages"
            agent_input = {
                "messages": human_messages,
                "available_skills": available_skills,
                "loaded_skills": loaded_skills,
                "available_mcps": available_mcps,
                "loaded_mcps": loaded_mcps,
                "custom_instructions": "",
                "agent_name": "Agent",
                "llm_calls": 0,
                "channel_id": channel,
                "conversation_id": "",
                "agent_user_id": agent_user_id,
                "thread_id": thread_id,
                "message_id": str(uuid.uuid4()),
                "event_metadata": {},
            }
            
            config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 100}
            if mcp_registry:
                config["configurable"]["mcp_registry"] = mcp_registry
            
            full_response: List[Any] = []
            try:
                agent = build_agent(mcp_tools, llm_config, mcp_registry=mcp_registry)
                async for chunk, _m in agent.astream(
                    agent_input,
                    config=config,
                    stream_mode="messages",
                ):
                    full_response.append(chunk)

                return {
                    "status": "completed",
                    "result": {
                        "thread_id": thread_id,
                        "agent_id": agent_user_id,
                    },
                }
            except Exception as e:
                return {
                    "status": "failed",
                    "result": {
                        "error": str(e),
                        "thread_id": thread_id,
                    },
                }