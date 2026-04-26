"""Sync node - synchronizes agent state at start of each iteration.

This node runs at the start of each loop iteration (after checkpoint restoration)
and handles:
- Fetching pending messages from thread inbox
- Transforming events to HumanMessages
- Loading MCPs based on event types + loaded_mcps from state
- Loading skills based on event types
- Fetching agent memory from remote storage

Single code path - always returns the same structure regardless of whether
there are pending messages or not.
"""
from typing import Dict, Any, List, Set
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from clients.mcp import PersistentMCPClient
from repositories.thread_inbox import thread_inbox_repository
from repositories.agent_memory import agent_memory_repository
from core.agents.utils.loader import transform_event, get_hooks_for_event
from core.agents.utils.types.mcp import LoadedMCP, AvailableMCP, MCPServerConfig
from core.logging import log


def create_sync_node(mcp_client: PersistentMCPClient):
    async def sync_node(state: Dict[str, Any], config: RunnableConfig) -> Dict[str, Any]:
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

        # ============================================
        # COMMON SETUP
        # ============================================
        pending_messages = await thread_inbox_repository.fetch_pending_messages(thread_id)
        memory_result = await _fetch_agent_memory(state)

        all_mcp_configs: List[MCPServerConfig] = config.get("configurable", {}).get("all_mcp_configs", [])
        all_skills = config.get("configurable", {}).get("all_skills", [])
        all_hooks = config.get("configurable", {}).get("available_hooks", [])

        # ============================================
        # DETERMINE MCPs TO LOAD
        # ============================================
        state_mcp_names = _get_mcp_names_from_state(state.get("loaded_mcps", []))
        event_mcp_configs = _get_mcp_configs_from_events(pending_messages, all_hooks, all_mcp_configs)
        state_mcp_configs = _get_mcp_configs_by_names(state_mcp_names, all_mcp_configs)

        mcp_configs_to_load = _deduplicate_configs(event_mcp_configs + state_mcp_configs)

        # ============================================
        # CONNECT AND LOAD MCPs
        # ============================================
        connected_mcp_names: List[str] = []
        loaded_mcps_entries: List[LoadedMCP] = []
        failed_mcp_ids: List[str] = []

        if mcp_client:
            for cfg in mcp_configs_to_load:
                mcp_id = cfg.get("id")
                if not mcp_id:
                    continue

                try:
                    await mcp_client.connect(mcp_id)
                    connected_mcp_names.append(cfg.get("name", mcp_id))
                except Exception as e:
                    log.warning("mcp_connect_failed", mcp_id=mcp_id, error=str(e), node="sync_node")
                    failed_mcp_ids.append(mcp_id)
                    continue

                try:
                    raw_tools = await mcp_client.load_tools_for_mcp(mcp_id)
                    tools = [{"name": t.name, "description": t.description or ""} for t in raw_tools]
                    loaded_mcps_entries.append({
                        "name": cfg.get("name", mcp_id),
                        "description": cfg.get("usage_guidance", ""),
                        "tools": tools
                    })
                except Exception as e:
                    log.warning("mcp_load_tools_failed", mcp_id=mcp_id, error=str(e), node="sync_node")
                    failed_mcp_ids.append(mcp_id)

            if connected_mcp_names:
                await mcp_client.fetch_all_metadata()

        # ============================================
        # PROCESS MESSAGES
        # ============================================
        new_messages: List[HumanMessage] = []
        processed_ids: List[str] = []
        pending_tool_approval_cleared = False
        event_types: List[str] = []

        for msg_data in pending_messages:
            event_type = msg_data["event_type"]
            payload = msg_data["payload"]
            message_id = msg_data["id"]
            event_types.append(event_type)

            if event_type == "com.uvian.ticket.ticket_resolved":
                if payload.get("approvalStatus") == "approved":
                    pending_tool_approval_cleared = True
                    log.info(
                        "tool_approval_resolved",
                        ticket_id=payload.get("ticketId"),
                        tool_name=payload.get("toolName"),
                        node="sync_node",
                    )

            event_message = transform_event(event_type, payload, agent_user_id)
            new_messages.append(event_message if event_message else HumanMessage(content=f"Event received: {event_type}"))
            processed_ids.append(message_id)

        if processed_ids:
            await thread_inbox_repository.mark_processed(processed_ids)

        # ============================================
        # LOAD SKILLS
        # ============================================
        loaded_skills = state.get("loaded_skills", [])
        new_skills = _get_skills_from_events(pending_messages, all_hooks, all_skills, loaded_skills)

        expected_tool_calls = _get_expected_tool_calls_from_events(pending_messages, all_hooks)

        # ============================================
        # BUILD RESULT
        # ============================================
        available_mcps = _build_available_mcps(all_mcp_configs, failed_mcp_ids)

        log.info(
            "sync_node_complete",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            execution_id=execution_id,
            node="sync_node",
            extra={
                "messages_added": len(new_messages),
                "event_types": event_types,
                "new_skills_loaded": [s.get("name") for s in new_skills],
                "new_mcps_loaded": [m.get("name") for m in loaded_mcps_entries],
                "failed_mcps": failed_mcp_ids,
                "connected_mcps": connected_mcp_names,
                "expected_tool_calls": [e.get("pattern") for e in expected_tool_calls],
            },
        )

        result = {
            "messages": new_messages,
            "loaded_skills": new_skills,
            "loaded_mcps": loaded_mcps_entries,
            "available_mcps": available_mcps,
            "expected_tool_calls": expected_tool_calls,
            **memory_result
        }

        if pending_tool_approval_cleared:
            result["pending_tool_approval"] = None

        return result

    return sync_node


# ============================================
# HELPER FUNCTIONS
# ============================================

def _get_mcp_names_from_state(loaded_mcps: List[LoadedMCP]) -> Set[str]:
    """Extract MCP names from state entries (handles both dict and string formats)."""
    names: Set[str] = set()
    for m in loaded_mcps:
        if isinstance(m, dict) and m.get("name"):
            names.add(m.get("name"))
        elif isinstance(m, str):
            names.add(m)
    return names


def _get_mcp_configs_by_names(names: Set[str], all_configs: List[MCPServerConfig]) -> List[MCPServerConfig]:
    """Get MCP configs by names from all available configs."""
    return [c for c in all_configs if c.get("name") in names]


def _get_mcp_configs_from_events(
    pending_messages: List[Dict[str, Any]],
    all_hooks: List[Dict[str, Any]],
    all_mcp_configs: List[MCPServerConfig]
) -> List[MCPServerConfig]:
    """Determine MCP configs to load based on event types (via hooks)."""
    if not pending_messages:
        return []

    event_types = list(set(msg["event_type"] for msg in pending_messages))

    mcp_ids_to_load: Set[str] = set()
    for event_type in event_types:
        hooks_result = get_hooks_for_event(event_type, all_hooks)
        for effect in hooks_result.get("load_mcp", []):
            effect_id = effect.get("effect_id")
            if effect_id:
                mcp_ids_to_load.add(effect_id)

    return [c for c in all_mcp_configs if c.get("id") in mcp_ids_to_load]


def _deduplicate_configs(configs: List[MCPServerConfig]) -> List[MCPServerConfig]:
    """Deduplicate MCP configs by ID."""
    seen: Set[str] = set()
    result: List[MCPServerConfig] = []
    for cfg in configs:
        mcp_id = cfg.get("id")
        if mcp_id and mcp_id not in seen:
            seen.add(mcp_id)
            result.append(cfg)
    return result


def _get_skills_from_events(
    pending_messages: List[Dict[str, Any]],
    all_hooks: List[Dict[str, Any]],
    all_skills: List[Dict[str, Any]],
    loaded_skills: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Determine skills to load based on event types (via hooks), filtering already-loaded."""
    if not pending_messages:
        return []

    loaded_skill_names = {s.get("name") for s in loaded_skills if isinstance(s, dict) and s.get("name")}

    event_types = list(set(msg["event_type"] for msg in pending_messages))

    skill_ids_to_load: Set[str] = set()
    for event_type in event_types:
        hooks_result = get_hooks_for_event(event_type, all_hooks)
        for effect in hooks_result.get("load_skill", []):
            effect_id = effect.get("effect_id")
            if effect_id:
                skill_ids_to_load.add(effect_id)

    return [
        s for s in all_skills
        if s.get("id") in skill_ids_to_load and s.get("name") not in loaded_skill_names
    ]


def _get_expected_tool_calls_from_events(
    pending_messages: List[Dict[str, Any]],
    all_hooks: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Get expected tool calls from hooks based on event types."""
    if not pending_messages:
        return []

    event_types = list(set(msg["event_type"] for msg in pending_messages))

    expected: List[Dict[str, Any]] = []
    seen: Set[str] = set()

    for event_type in event_types:
        hooks_result = get_hooks_for_event(event_type, all_hooks)
        for effect in hooks_result.get("expected_tool_calls", []):
            pattern = effect.get("pattern")
            if pattern and pattern not in seen:
                seen.add(pattern)
                expected.append({
                    "pattern": pattern,
                    "source_hook": effect.get("source_hook", "unknown"),
                    "event_type": event_type,
                })

    return expected


def _build_available_mcps(
    all_configs: List[MCPServerConfig],
    failed_mcp_ids: List[str]
) -> List[AvailableMCP]:
    """Build available_mcps list, excluding failed MCPs."""
    return [
        {
            "id": cfg.get("id"),
            "name": cfg.get("name", ""),
            "description": cfg.get("usage_guidance", ""),
            "tool_names": []
        }
        for cfg in all_configs
        if cfg.get("name") and cfg.get("id") not in failed_mcp_ids
    ]


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