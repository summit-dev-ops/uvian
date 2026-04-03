from typing import List, Dict, Any


EVENT_PREFIX_TO_MCP_IDS: Dict[str, List[str]] = {
    "com.uvian.discord.": ["discord"],
    "message.": ["uvian-hub"],
    "conversation.": ["uvian-hub"],
    "ticket.": ["uvian-hub"],
    "post.": ["uvian-hub"],
    "note.": ["uvian-hub"],
    "asset.": ["uvian-hub"],
    "space.": ["uvian-hub"],
    "job.": ["uvian-hub"],
}


def get_mcps_for_event(event_type: str, all_mcp_configs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter MCP configs to only those relevant for the given event type.

    Falls back to returning all MCP configs if no mapping exists.
    """
    matched_mcp_ids: List[str] = []
    for prefix, mcp_ids in EVENT_PREFIX_TO_MCP_IDS.items():
        if event_type.startswith(prefix):
            matched_mcp_ids.extend(mcp_ids)

    if not matched_mcp_ids:
        return all_mcp_configs

    seen = set()
    unique_mcp_ids = []
    for mcp_id in matched_mcp_ids:
        if mcp_id not in seen:
            seen.add(mcp_id)
            unique_mcp_ids.append(mcp_id)

    return [cfg for cfg in all_mcp_configs if cfg.get("id") in unique_mcp_ids]
