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
from executors.base import BaseExecutor, JobData, JobResult
from core.agents.universal_agent.agent import build_agent
from core.agents.utils.loader import prepare_for_inbox_events
from clients.mcp import PersistentMCPClient, MCPRegistry
from clients.auth import get_agent_secrets
from clients.config import get_agent_skills
from core.logging import log
import uuid
import json


class AgentExecutor(BaseExecutor):
    
    async def execute(self, job_data: JobData) -> JobResult:
        inputs = job_data.get("input", {})
        
        job_type = job_data.get("type")
        input_type = inputs.get("inputType")
        
        if job_type == "thread-wakeup":
            return await self._execute_thread_wakeup(job_data, inputs)
        
        raise ValueError(f"AgentExecutor only handles 'thread-wakeup' job type, got: {input_type}")
    
    async def _execute_thread_wakeup(self, job_data: JobData, inputs: dict) -> JobResult:
        job_id = job_data["id"]
        thread_id = inputs.get("threadId")
        agent_user_id = inputs.get("agentId")
        
        if not thread_id or not agent_user_id:
            raise ValueError("threadId and agentId are required for thread-wakeup jobs")
        
        execution_id = str(uuid.uuid4())
        log.info(
            "agent_execution_start",
            execution_id=execution_id,
            job_id=job_id,
            thread_id=thread_id,
            agent_user_id=agent_user_id,
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
        
        from repositories.thread_inbox import thread_inbox_repository
        pending_messages = await thread_inbox_repository.fetch_pending_messages(thread_id)
        
        from core.agents.utils.mcp_mapping import get_mcps_for_event
        event_types = list(set(msg["event_type"] for msg in pending_messages)) if pending_messages else []
        
        relevant_mcp_configs = []
        
        if event_types:
            # Load MCPs matching event types or marked as default
            for event_type in event_types:
                matched = get_mcps_for_event(event_type, all_mcp_configs)
                relevant_mcp_configs.extend(matched)
        else:
            # No specific events - still load default MCPs
            for cfg in all_mcp_configs:
                if cfg.get("is_default"):
                    relevant_mcp_configs.append(cfg)
        
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
                            usage_guidance=cfg.get("usage_guidance"),
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
                {
                    "name": cfg.get("name", ""),
                    "description": cfg.get("usage_guidance", ""),
                    "tool_names": [
                        t.get("name") for m in available_mcps_catalog
                        if m.get("name") == cfg.get("name")
                        for t in m.get("tools", [])
                    ] if any(m.get("name") == cfg.get("name") for m in available_mcps_catalog) else []
                }
                for cfg in all_mcp_configs if cfg.get("name")
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
                "execution_id": execution_id,
            }
            
            config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 100}
            if mcp_registry:
                config["configurable"]["mcp_registry"] = mcp_registry
            
            full_response: List[Any] = []
            final_response = {}
            try:
                agent = build_agent(mcp_tools, llm_config, mcp_registry=mcp_registry)
                async for part in agent.astream(
                    agent_input,
                    config=config,
                    stream_mode=["values","messages"],
                ):
                    full_response.append(part)
                    final_response = part

                log.info(
                        "agent_execution_final_messages",
                        execution_id=execution_id,
                        thread_id=thread_id,
                        agent_user_id=agent_user_id,
                        final_messages=json.dumps(final_response, indent=2), # Pretty print the messages
                    )

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