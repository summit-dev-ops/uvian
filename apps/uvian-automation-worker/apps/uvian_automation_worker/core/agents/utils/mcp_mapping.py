from typing import List, Dict, Any


def get_mcps_for_event(event_type: str, all_mcp_configs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter MCP configs to those relevant for the given event type.

    First checks MCP config's auto_load_events field (database-driven).
    Falls back to returning all MCP configs if no configs have auto_load_events set
    (backwards compatibility for existing MCP configs).
    """
    has_auto_load = any(cfg.get("auto_load_events") for cfg in all_mcp_configs)
    
    if not has_auto_load:
        return all_mcp_configs
    
    matched = []
    for cfg in all_mcp_configs:
        auto_load_events = cfg.get("auto_load_events", [])
        for pattern in auto_load_events:
            if event_type == pattern or event_type.startswith(pattern):
                matched.append(cfg)
                break
    return matched
