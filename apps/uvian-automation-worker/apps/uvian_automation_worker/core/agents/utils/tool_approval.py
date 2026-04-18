from typing import Dict, Any, List, Callable, Awaitable
from langchain_core.messages import ToolMessage
from langgraph.types import Command

from core.logging import log


AsyncToolCallWrapper = Callable[
    [Any, Callable[[Any], Awaitable[ToolMessage | Command]]],
    Awaitable[ToolMessage | Command],
]


def _match_hook(hooks: List[Dict[str, Any]], tool_name: str, tool_args: Dict) -> Dict | None:
    """Match tool against hook trigger_json - extendible pattern matching.
    
    Currently supports:
    - tool_name_prefix: Match tool name starting with pattern (e.g., "http_*" matches "http_get")
    
    Future extendible for:
    - tool_args: Match specific tool arguments
    - exact_match: Full tool name match
    - regex: Regex pattern matching
    """
    if not hooks:
        return None
    
    for hook in hooks:
        trigger = hook.get("trigger_json", {})
        trigger_type = trigger.get("type")
        
        if trigger_type == "tool_name_prefix":
            pattern = trigger.get("pattern", "")
            if pattern.endswith("*"):
                prefix = pattern[:-1]
            else:
                prefix = pattern
            
            if tool_name.startswith(prefix):
                return hook
        
        # Future extendible patterns:
        # if trigger_type == "tool_args":
        #     path = trigger.get("path", "")
        #     expected = trigger.get("equals")
        #     actual = _get_nested(tool_args, path)
        #     if actual == expected:
        #         return hook
    
    return None


async def create_tool_approval_wrapper(
    hooks: List[Dict[str, Any]],
    create_ticket_fn: Callable[[str, str, str, str | None], Awaitable[str]],
) -> AsyncToolCallWrapper:
    """Create tool call wrapper that intercepts tools matching hooks.
    
    Args:
        hooks: List of hook definitions with trigger_json and action
        create_ticket_fn: Async function to create approval ticket
        
    Returns:
        AsyncToolCallWrapper that intercepts matching tool calls
    """
    
    async def handler(request, execute):
        tool_call = request.tool_call
        tool_name = tool_call.get("name", "")
        tool_args = tool_call.get("args", {})
        tool_call_id = tool_call.get("id", "")
        
        thread_id = request.state.get("thread_id", "")
        
        matched_hook = _match_hook(hooks, tool_name, tool_args)
        
        if not matched_hook:
            return await execute(request)
        
        action = matched_hook.get("action", "interrupt")
        
        if action == "interrupt":
            hook_name = matched_hook.get("name", "unknown")
            
            try:
                ticket_id = await create_ticket_fn(
                    thread_id=thread_id,
                    tool_name=tool_name,
                    tool_call_id=tool_call_id,
                    reason=f"Tool '{tool_name}' requires approval per hook: {hook_name}",
                )
            except Exception as e:
                log.error(
                    "tool_approval_ticket_creation_failed",
                    tool_name=tool_name,
                    error=str(e),
                )
                return await execute(request)
            
            log.info(
                "tool_approval_intercepted",
                tool_name=tool_name,
                ticket_id=ticket_id,
                hook=hook_name,
            )
            
            pending_info = {
                "ticket_id": ticket_id,
                "tool_name": tool_name,
                "hook_name": hook_name,
            }
            
            return Command(
                update={
                    "pending_tool_approval": pending_info,
                },
                messages=[
                    ToolMessage(
                        content=f"Tool approval pending. Ticket created: {ticket_id}",
                        tool_call_id=tool_call_id,
                    )
                ],
            )
        
        if action == "block":
            return ToolMessage(
                content=f"Tool '{tool_name}' is blocked by policy: {matched_hook.get('name')}",
                tool_call_id=tool_call_id,
                status="error",
            )
        
        return await execute(request)
    
    return handler