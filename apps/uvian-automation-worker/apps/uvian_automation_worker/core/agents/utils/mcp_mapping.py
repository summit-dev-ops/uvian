from typing import List, Dict, Any


EVENT_PREFIX_TO_MCP_NAMES: Dict[str, List[str]] = {
    "com.uvian.discord.": ["discord"],
    "message.": ["uvian hub"],
    "conversation.": ["uvian hub"],
    "ticket.": ["uvian hub"],
    "post.": ["uvian hub"],
    "note.": ["uvian hub"],
    "asset.": ["uvian hub"],
    "space.": ["uvian hub"],
    "job.": ["uvian hub"],
}


def get_mcps_for_event(event_type: str, all_mcp_configs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter MCP configs to only those relevant for the given event type.

    Matches by MCP name (case-insensitive) against a hardcoded event-to-MCP mapping.
    Falls back to returning all MCP configs if no mapping exists.
    """
    matched_mcp_names: List[str] = []
    for prefix, mcp_names in EVENT_PREFIX_TO_MCP_NAMES.items():
        if event_type.startswith(prefix):
            matched_mcp_names.extend(mcp_names)

    if not matched_mcp_names:
        return all_mcp_configs

    seen = set()
    unique_mcp_names = []
    for name in matched_mcp_names:
        if name not in seen:
            seen.add(name)
            unique_mcp_names.append(name)

    return [cfg for cfg in all_mcp_configs if cfg.get("name", "").lower() in unique_mcp_names]
