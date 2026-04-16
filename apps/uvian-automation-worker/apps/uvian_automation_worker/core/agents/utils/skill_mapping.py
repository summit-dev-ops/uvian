from typing import List, Dict, Any


def get_skills_for_event(event_type: str, all_skills: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter skills whose autoLoadEvents match the event type.

    Supports both exact match and prefix matching.
    e.g. pattern "message." matches "message.created", "message.updated"
    e.g. pattern "com.uvian.ticket.created" matches only that exact event
    """
    matched = []
    for skill in all_skills:
        for pattern in skill.get("autoLoadEvents", []):
            if event_type == pattern or event_type.startswith(pattern):
                matched.append(skill)
                break
    return matched
