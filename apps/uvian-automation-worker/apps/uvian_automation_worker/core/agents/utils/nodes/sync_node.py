"""Sync node - synchronizes agent state at start of each iteration.

This node runs at the start of each loop iteration (after checkpoint restoration)
and handles:
- Fetching pending messages from thread inbox
- Transforming events to HumanMessages
- Loading MCPs based on event types (connecting + loading tools)
- Loading skills based on event types
- Fetching agent memory from remote storage

This consolidates logic previously spread across:
- executor (initial event processing)
- fetch_inbox_node (message fetching, skill loading)
- fetch_agent_memory_node (memory fetching)
"""
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from repositories.thread_inbox import thread_inbox_repository
from repositories.agent_memory import agent_memory_repository
from core.agents.utils.loader import transform_event, filter_skills
from core.agents.utils.mcp_mapping import get_mcps_for_event
from core.logging import log


def create_sync_node(mcp_registry):
    async def sync_node(state: Dict[str, Any], config: RunnableConfig) -> Dict[str, Any]:
        """Synchronize agent state at start of each iteration.
        
        This node runs after checkpoint restoration and:
        1. Fetches pending messages from thread inbox
        2. Transforms events to HumanMessages
        3. Connects MCPs based on event types (or defaults if no events)
        4. Loads skills based on event types
        5. Fetches agent memory
        
        The checkpoint already contains previously-loaded MCPs/skills.
        This node adds NEW ones based on current events. LangGraph's operator.add
        merges checkpoint state with these updates.
        
        Args:
            state: Current agent state
            config: RunnableConfig with mcp_registry, all_mcp_configs, all_skills
            
        Returns:
            Dictionary with updates for:
            - messages: New HumanMessages from pending events
            - loaded_skills: NEW skills to load (filtered from already-loaded)
            - loaded_mcps: NEW MCPs to load (filtered from already-loaded)
            - available_mcps: Updated available MCPs (removes failed ones)
            - agent_memory: Memory fetched from remote storage
        """
        thread_id = state.get("thread_id")
        agent_user_id = state.get("agent_user_id")
        llm_calls = state.get("llm_calls", 0)
        execution_id = state.get("execution_id", "unknown")
        
        log.info(
            "sync_node_start",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            execution_id=execution_id,
            node="sync_node",
        )
        
        pending_messages = await thread_inbox_repository.fetch_pending_messages(thread_id)
        
        if not pending_messages:
            log.debug(
                "sync_node_no_pending_messages",
                thread_id=thread_id,
                agent_user_id=agent_user_id,
                llm_calls=llm_calls,
                execution_id=execution_id,
                node="sync_node",
            )
            memory_result = await _fetch_agent_memory(state)
            all_mcp_configs = config.get("configurable", {}).get("all_mcp_configs", [])
            available_mcps = [
                {
                    "id": cfg.get("id"),
                    "name": cfg.get("name", ""),
                    "description": cfg.get("usage_guidance", ""),
                    "tool_names": []
                }
                for cfg in all_mcp_configs if cfg.get("name")
            ]
            return {
                "available_mcps": available_mcps,
                **memory_result
            }
        
        unique_event_types = list(set(msg["event_type"] for msg in pending_messages))
        
        all_mcp_configs = config.get("configurable", {}).get("all_mcp_configs", [])
        all_skills = config.get("configurable", {}).get("all_skills", [])
        
        relevant_mcp_configs = []
        if unique_event_types:
            for event_type in unique_event_types:
                matched = get_mcps_for_event(event_type, all_mcp_configs)
                relevant_mcp_configs.extend(matched)
        else:
            for cfg in all_mcp_configs:
                if cfg.get("is_default"):
                    relevant_mcp_configs.append(cfg)
        
        seen = {}
        unique_mcp_configs = []
        for cfg in relevant_mcp_configs:
            mcp_id = cfg.get("id", "")
            if mcp_id and mcp_id not in seen:
                seen[mcp_id] = True
                unique_mcp_configs.append(cfg)
        relevant_mcp_configs = unique_mcp_configs
        
        loaded_mcps = state.get("loaded_mcps", [])
        loaded_mcp_names = {m.get("name") for m in loaded_mcps if isinstance(m, dict) and m.get("name")}
        
        for mcp_name in loaded_mcp_names:
            mcp_config = next(
                (cfg for cfg in all_mcp_configs if cfg.get("name") == mcp_name),
                None
            )
            if mcp_config and mcp_config not in relevant_mcp_configs:
                relevant_mcp_configs.append(mcp_config)
        
        connected_mcp_names = []
        failed_mcp_names = []
        
        if mcp_registry:
            mcp_ids_to_connect = [cfg.get("id") for cfg in relevant_mcp_configs if cfg.get("id")]
            
            for mcp_id in mcp_ids_to_connect:
                try:
                    await mcp_registry.connect(mcp_id)
                    mcp_name = next(
                        (cfg.get("name") for cfg in relevant_mcp_configs if cfg.get("id") == mcp_id),
                        mcp_id
                    )
                    connected_mcp_names.append(mcp_name)
                except Exception as e:
                    log.warning("mcp_connect_failed", mcp_id=mcp_id, error=str(e), node="sync_node")
                    failed_mcp_names.append(mcp_id)
            
            if connected_mcp_names:
                await mcp_registry.fetch_all_metadata()
            
            # Ensure tools are loaded for all connected MCPs (not just new ones)
            # This populates the tool cache in PersistentMCPClient so get_all_tools() works
            for mcp_name in connected_mcp_names:
                mcp_info = next(
                    (cfg for cfg in relevant_mcp_configs if cfg.get("name") == mcp_name),
                    None
                )
                if mcp_info:
                    await mcp_registry.get_tools_for_mcp(mcp_info.get("id"))
        
        available_mcps = [
            {
                "id": cfg.get("id"),
                "name": cfg.get("name", ""),
                "description": cfg.get("usage_guidance", ""),
                "tool_names": []
            }
            for cfg in all_mcp_configs
            if cfg.get("name") and cfg.get("id") not in failed_mcp_names
        ]
        
        matched_skills = filter_skills(unique_event_types, all_skills)
        
        loaded_skills = state.get("loaded_skills", [])
        loaded_skill_names = {s.get("name") for s in loaded_skills if isinstance(s, dict) and s.get("name")}
        
        new_skills = []
        for skill in matched_skills:
            skill_name = skill.get("name", "")
            if skill_name and skill_name not in loaded_skill_names:
                new_skills.append({
                    "name": skill_name,
                    "description": skill.get("description", ""),
                    "content": skill.get("content", "")
                })
        
        new_mcps = []
        if mcp_registry:
            for mcp_name in connected_mcp_names:
                if mcp_name not in loaded_mcp_names:
                    mcp_info = next(
                        (cfg for cfg in relevant_mcp_configs if cfg.get("name") == mcp_name),
                        None
                    )
                    if mcp_info:
                        raw_tools = await mcp_registry.get_tools_for_mcp(mcp_info.get("id"))
                        tools = [
                            {"name": t.name, "description": t.description or ""}
                            for t in raw_tools
                        ]
                        new_mcps.append({
                            "name": mcp_name,
                            "description": mcp_info.get("description", ""),
                            "tools": tools
                        })
        
        new_messages: List[HumanMessage] = []
        processed_ids: List[str] = []
        
        for msg_data in pending_messages:
            event_type = msg_data["event_type"]
            payload = msg_data["payload"]
            message_id = msg_data["id"]
            
            event_message = transform_event(event_type, payload)
            
            if event_message:
                new_messages.append(event_message)
            else:
                new_messages.append(HumanMessage(content=f"Event received: {event_type}"))
            
            processed_ids.append(message_id)
        
        if processed_ids:
            await thread_inbox_repository.mark_processed(processed_ids)
        
        memory_result = await _fetch_agent_memory(state)
        
        log.info(
            "sync_node_complete",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            execution_id=execution_id,
            node="sync_node",
            extra={
                "messages_added": len(new_messages),
                "event_types": unique_event_types,
                "new_skills_loaded": [s.get("name") for s in new_skills],
                "new_mcps_loaded": [m.get("name") for m in new_mcps],
                "failed_mcps": failed_mcp_names,
                "connected_mcps": connected_mcp_names,
            },
        )
        
        return {
            "messages": new_messages,
            "loaded_skills": new_skills,
            "loaded_mcps": new_mcps,
            "available_mcps": available_mcps,
            **memory_result
        }
    
    return sync_node


async def _fetch_agent_memory(state: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch agent memory from remote storage."""
    thread_id = state.get("thread_id")
    agent_user_id = state.get("agent_user_id")
    llm_calls = state.get("llm_calls", 0)
    execution_id = state.get("execution_id", "unknown")
    
    if not agent_user_id:
        return {"agent_memory": {}}
    
    memory = await agent_memory_repository.get_all_memory(agent_user_id)
    
    log.debug(
        "agent_memory_fetched",
        thread_id=thread_id,
        agent_user_id=agent_user_id,
        llm_calls=llm_calls,
        execution_id=execution_id,
        node="sync_node",
        extra={"memory_keys": list(memory.keys()) if memory else []},
    )
    
    return {"agent_memory": memory}