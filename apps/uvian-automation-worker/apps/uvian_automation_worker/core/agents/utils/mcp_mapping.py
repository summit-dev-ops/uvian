from typing import List, Dict, Any


def get_mcps_for_event(event_type: str, all_mcp_configs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter MCP configs to those relevant for the given event type.

    Includes MCPs that:
    1. Have matching auto_load_events for the event type
    2. Are marked as is_default=True (always loaded)

    If no configs have auto_load_events or is_default set, returns empty list.
    """
    has_any_loading_config = any(
        cfg.get("auto_load_events") or cfg.get("is_default")
        for cfg in all_mcp_configs
    )

    if not has_any_loading_config:
        return []

    matched = []
    seen_ids = set()

    for cfg in all_mcp_configs:
        cfg_id = cfg.get("id", "")

        # Always include default MCPs
        if cfg.get("is_default"):
            if cfg_id and cfg_id not in seen_ids:
                seen_ids.add(cfg_id)
                matched.append(cfg)
            continue

        # Include MCPs with matching auto_load_events
        auto_load_events = cfg.get("auto_load_events", [])
        for pattern in auto_load_events:
            if event_type == pattern or event_type.startswith(pattern):
                if cfg_id and cfg_id not in seen_ids:
                    seen_ids.add(cfg_id)
                    matched.append(cfg)
                break

    return matched
