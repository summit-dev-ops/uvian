# executors/agent_executor.py
"""
AgentExecutor - Simplified agent startup executor.

Responsibilities:
- Fetch agent secrets (LLM config, MCP configs, skills)
- Register all MCP configs with PersistentMCPClient (but don't connect)
- Build initial config for agent (available_skills, available_mcps)
- Pass control to agent graph where sync_node handles event processing

The sync_node (in agent graph) handles:
- Fetching pending messages
- Transforming events to messages
- Connecting MCPs based on event types
- Loading skills based on event types
- Fetching agent memory
"""
from typing import Optional, Dict
from executors.base import BaseExecutor, JobData, JobResult
from core.agents.universal_agent.agent import build_agent
from clients.mcp import PersistentMCPClient, MCPRegistry
from clients.auth import get_agent_secrets
from clients.config import get_agent_skills, get_agent_hooks
from core.agents.utils.memory.base_memory import PostgresAsyncCheckpointer
from core.agents.utils.memory.selective_checkpointer import SelectiveCheckpointer
from core.logging import log
import uuid


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
        print(secrets)
        
        llm_config = {}
        if secrets.get("llms"):
            default_llm = next(
                (al for al in secrets["llms"] if al.get("is_default")),
                secrets["llms"][0],
            )
            if default_llm and default_llm.get("type"):
                llm = default_llm
                additional_config = llm.get("config", {})
                llm_config = {
                    "type": llm.get("type"),
                    "model": llm.get("model_name"),
                    "base_url": llm.get("base_url"),
                    "api_key": llm.get("api_key"),
                    "temperature": llm.get("temperature", 0.6),
                    "max_tokens": llm.get("max_tokens"),
                    "requests_per_second": additional_config.get("requests_per_second"),
                    "streaming": additional_config.get("streaming", True),
                    "stream_usage": additional_config.get("stream_usage", True),
                }
        
        all_mcp_configs = secrets.get("mcps", [])
        all_skills = await get_agent_skills(agent_user_id)
        
        available_skills = [
            {"name": s.get("name"), "description": s.get("description", "")}
            for s in all_skills if s.get("name")
        ]
        
        available_mcps = [
            {
                "id": cfg.get("id"),
                "name": cfg.get("name", ""),
                "description": cfg.get("usage_guidance", ""),
            }
            for cfg in all_mcp_configs if cfg.get("name")
        ]

        all_hooks = await get_agent_hooks(agent_user_id)
        hooks_by_id: dict = {}
        for h in all_hooks:
            hook_id = h.get("hook_id") or h.get("id")
            if not hook_id or not h.get("name"):
                continue
            if hook_id not in hooks_by_id:
                hooks_by_id[hook_id] = {
                    "id": hook_id,
                    "name": h.get("name"),
                    "trigger_json": h.get("trigger_json") or h.get("triggerJson"),
                    "action": h.get("action"),
                    "effects": [],
                }
            for effect in h.get("effects", []):
                effect_type = effect.get("effect_type") or effect.get("effectType")
                effect_id = effect.get("effect_id") or effect.get("effectId")
                if effect_type and effect_id:
                    hooks_by_id[hook_id]["effects"].append({
                        "effect_type": effect_type,
                        "effect_id": effect_id,
                    })
        available_hooks = list(hooks_by_id.values())
        log.debug(
            "agent_executor_hooks_loaded",
            agent_user_id=agent_user_id,
            thread_id=thread_id,
            hooks_count=len(available_hooks),
            hooks=[{
                "id": h.get("id"),
                "name": h.get("name"),
                "patterns": h.get("trigger_json", {}).get("patterns", []),
                "effects": h.get("effects", []),
            } for h in available_hooks],
        )

        base_checkpointer = PostgresAsyncCheckpointer()
        checkpointer = SelectiveCheckpointer(
            base_checkpointer,
            exclude_keys=["agent_memory"]
        )
            
        async with PersistentMCPClient() as persistent_client:
            persistent_client.register_all(all_mcp_configs)
            mcp_registry = MCPRegistry(client=persistent_client)
            
            channel = f"agent:{agent_user_id}:messages"
            agent_input = {
                "messages": [],
                "available_skills": available_skills,
                "loaded_skills": [],
                "available_mcps": available_mcps,
                "loaded_mcps": [],
                "available_hooks": available_hooks,
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
            
            config = {
                "configurable": {
                    "thread_id": thread_id,
                    "all_mcp_configs": all_mcp_configs,
                    "all_skills": all_skills,
                    "available_hooks": available_hooks,
                },
                "recursion_limit": 100
            }

            try:
                agent = await build_agent(
                    llm_config,
                    mcp_registry,
                    checkpointer=checkpointer,
                    hooks=available_hooks,
                )
                async for part in agent.astream(
                    agent_input,
                    config=config,
                    stream_mode=["values","messages"],
                ):
                    pass

                return {
                    "status": "completed",
                    "result": {
                        "thread_id": thread_id,
                        "agent_id": agent_user_id,
                    },
                }
            except Exception as e:
                print(e)
                return {
                    "status": "failed",
                    "result": {
                        "error": str(e),
                        "thread_id": thread_id,
                    },
                }
            finally:
                await mcp_registry.close()