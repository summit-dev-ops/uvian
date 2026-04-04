from typing import Dict


MCP_USAGE_GUIDANCE: Dict[str, str] = {
    "discord": (
        "Discord server management. Use for all Discord interactions: "
        "sending messages to channels or DMs, reading channel history, "
        "getting user/guild/channel/thread info, and viewing reactions."
    ),
    "uvian hub": (
        "Core Uvian platform operations. Use for managing messages, "
        "conversations, tickets, posts, notes, assets, spaces, and jobs "
        "within the Uvian platform."
    ),
    "uvian intake": (
        "Secure encrypted form system. Use when the user wants to share "
        "secrets, fill out forms, or create encrypted intake sessions. "
        "Handles RSA keypair generation, form creation, submission management, "
        "and encryption/decryption of sensitive data."
    ),
    "uvian automation": (
        "Automation workflow management. Use for managing automation jobs, "
        "triggers, and workflow configurations."
    ),
    "uvian scheduler": (
        "Scheduled task management. Use when the user wants reminders, "
        "scheduled messages, delayed tasks, or anything that should happen "
        "at a specific time in the future."
    ),
}


def get_usage_guidance(mcp_name: str) -> str:
    """Get usage guidance for an MCP by name (case-insensitive)."""
    return MCP_USAGE_GUIDANCE.get(mcp_name.lower(), "")
