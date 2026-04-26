from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from typing import List, Dict, Any
import json
from core.logging import log
from core.agents.utils.types.mcp import LoadedMCP, AvailableMCP

SYSTEM_PROMPT = """Your Agent User ID: {agent_user_id}

You are an autonomous headless agent with access to internal tools and external mcps. 
You will not be communicating with the clients directly. You will be provided events and it is your responsibility to plan, and act based on the events you receive.

It is crucial you remember that you are operating in a headless mode. The users will not see your raw text response. This means that you must use the appropriate tools to communicate. Consider non tool call turns to be invisible to the user and use it ONLY to summarise your work.

Your general workflow can be summarized in the following: 
1. Reading: Read the incoming event(s) carefully. Think about the broad expectation of these events. Define the goal and consider what would be an appropriate success criteria.
    - Important: As you work, new events can stream in. It is very important to adjust your goal as you see new events.
2. Planning: Plan your next step that would take you closer to your goal. 
    - Consider what you need next: mcps to load, skills to load?
    - Important: You should almost always consider responding in some manner. The user can't see your response unless you use tools to respond.
    - Consider if you have achieved your goal? If yes, then proceed to Step 4.
3. Act: Use tools you have available and follow your plan. After acting, return to Step 2.
4. Summarize: Summarize what happened, what you did, what was achieved, consider what went wrong and what was difficult. Keep your summary brief and accurate. 
    - Important: To resolve your task, you will need to stop calling tools. Simply generate a summary as outlined above.

# Working with Tools and MCPs
The vast majority of the tools you will use will be accessible through loaded MCPs. These MCPs provide domain specific tool belts for you. 
You will see what MCPs you can load under the Available MCPs section. These are configured for you to load, and can be loaded with the load_mcp tool. Once loaded, the tools will become availble to you to use.
IMPORTANT: Unless an MCP is loaded, it is impossible to call the tools it would provide.

# Working with Skills
Skills define instructions and guides for you to use. They don't provide tools, or other resources, they only provide instructions. 
You will see what Skills you can load under the Available skills section. These are configured for you to load, and can be loaded with the load_skill tool. Don't load skills without an actual need for them. Load them with intent and purpose in mind.

Rules:
- Only call tools that are directly relevant to the event
- Do not call the same tool twice with the same arguments
- Do not explore unrelated resources
- When the event is handled, simply summarise what you did with text.
"""

def create_model_node(model, default_tools, mcp_client):
    async def model_node(state: dict):
        thread_id = state.get("thread_id")
        agent_user_id = state.get("agent_user_id")
        llm_calls = state.get("llm_calls", 0)
        execution_id = state.get("execution_id", "unknown")
        
        loaded_skills = state.get("loaded_skills", [])
        available_skills = state.get("available_skills", [])
        loaded_skill_names = [s.get("name") for s in loaded_skills if isinstance(s, dict) and s.get("name")]
        available_skill_names = [s.get("name") for s in available_skills if isinstance(s, dict) and s.get("name")]
        
        # Handle both string names and dict entries
        available_mcps: List[AvailableMCP] = state.get("available_mcps", [])
        loaded_mcps: List[LoadedMCP] = state.get("loaded_mcps", [])
        loaded_mcp_names: List[str] = []
        for m in loaded_mcps:
            if isinstance(m, dict) and m.get("name"):
                loaded_mcp_names.append(m.get("name"))
            elif isinstance(m, str):
                loaded_mcp_names.append(m)
        available_mcp_names = [m.get("name") for m in available_mcps if isinstance(m, dict) and m.get("name")]

        all_mcp_tools = await mcp_client.get_loaded_tools()
        active_tools = list(default_tools) + [tool for tools in all_mcp_tools.values() for tool in tools]
        bound_tool_names = [t.name for t in active_tools] if active_tools else []
        
        log.info(
            "llm_call_executing",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            execution_id=execution_id,
            node="model_node",
            extra={
                "available_skills": available_skill_names,
                "loaded_skills": loaded_skill_names,
                "available_mcps": available_mcp_names,
                "loaded_mcps": loaded_mcp_names,
                "bound_tools": bound_tool_names,
                "message_count": len(state.get("messages", [])),
            },
        )
        
        skills_section = ""
        
        unloaded_skills = [s for s in available_skills if isinstance(s, dict) and s.get("name") not in loaded_skill_names]
        if unloaded_skills:
            skills_list = [f"- **{s.get('name', 'unknown')}**: {s.get('description', '')}" for s in unloaded_skills if isinstance(s, dict)]
            skills_section += "\n\n## Skills you can load\n\n" + "\n".join(skills_list)
        
        if loaded_skills:
            loaded_list = [f"### {s.get('name', 'unknown')}\n{s.get('content', '')}" for s in loaded_skills if isinstance(s, dict) and s.get("name")]
            skills_section += "\n## Loaded Skills\n\n" + "\n\n".join(loaded_list)
        
        
        mcps_section = ""
        
        unloaded_mcps = [m for m in available_mcps if isinstance(m, dict) and m.get("name") not in loaded_mcp_names]
        if unloaded_mcps:
            mcps_list = []
            for m in unloaded_mcps:
                if not isinstance(m, dict):
                    continue
                tool_names = m.get("tool_names", [])
                tool_str = ", ".join(tool_names[:5])
                if len(tool_names) > 5:
                    tool_str += f" (+{len(tool_names) - 5} more)"
                mcps_list.append(f"- **{m.get('name', 'unknown')}**: {m.get('description', '')} (tools: {tool_str})")
            mcps_section += "\n\n## MCP Servers you can load\n\n" + "\n".join(mcps_list)
        
        if loaded_mcps:
            loaded_mcp_list = []
            for m in loaded_mcps:
                if not isinstance(m, dict):
                    continue
                tools = m.get("tools", [])
                tool_names = ", ".join([t.get("name", "") for t in tools if isinstance(t, dict)]) if tools else "no tools"
                loaded_mcp_list.append(f"### {m.get('name', 'unknown')}\n{m.get('description', '')}\nAvailable tools: {tool_names}")
            mcps_section += "\n\n## Loaded MCP Servers\n\n" + "\n\n".join(loaded_mcp_list)
        
        # Format agent memory into system prompt
        agent_memory = state.get("agent_memory", {})
        memory_section = ""
        if agent_memory:
            memory_lines = ["## Agent Memory"]
            for key, value in agent_memory.items():
                memory_lines.append(f"### {key}")
                memory_lines.append(json.dumps(value, indent=2))
            memory_section = "\n\n" + "\n".join(memory_lines)

        # Check for compaction state - prepend summary to system prompt, slice messages
        compaction_state = state.get("compaction_state", {})
        summary = compaction_state.get("summary", "")
        message_offset = compaction_state.get("message_offset", 0)

        if summary and message_offset > 0:
            memory_section = "\n\n## Previous Conversation\n" + summary + memory_section
            visible_messages = state["messages"][message_offset:]
        else:
            visible_messages = state["messages"]

        # Expected tool calls section
        expectations_section = ""
        expected_tool_calls = state.get("expected_tool_calls", [])
        if expected_tool_calls:
            expected_lines = []
            for e in expected_tool_calls:
                pattern = e.get("pattern", "")
                source_hook = e.get("source_hook", "unknown")
                if pattern:
                    expected_lines.append(f"- **{pattern}** (Required by hook: {source_hook})")
            if expected_lines:
                expectations_section = "\n\n## Expected Actions\n" + "\n".join(expected_lines)
        
        max_context_size = state.get("max_context_size")
        session_context_size = state.get("session_context_size", 0)
        tokens_used = state.get("tokens_used", 0)
        
        context_section = ""
        if max_context_size:
            remaining = max(max_context_size - session_context_size, 0)
            context_section = f"\n\n## Context Information\n- Current session tokens: {session_context_size}\n- Total tokens used: {tokens_used}\n- Maximum context size: {max_context_size}\n- Remaining: {remaining}"

        formatted_system_prompt = SYSTEM_PROMPT.format(
            agent_name=state.get("agent_name", "AI Assistant"),
            agent_user_id=state.get("agent_user_id", "unknown"),
            custom_instructions=state.get("custom_instructions", ""),
        ) + context_section + mcps_section + skills_section + memory_section + expectations_section
        
        model_with_tools = model.bind_tools(active_tools, tool_choice="auto")
        
        messages = [SystemMessage(content=formatted_system_prompt)] + visible_messages
        
        log.info(
            "llm_invoking",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            execution_id=execution_id,
            node="model_node",
            extra={
                "total_messages": len(messages),
                "system_prompt_length": len(formatted_system_prompt),
                "state_messages_count": len(state.get("messages", [])),
                "visible_messages_count": len(visible_messages),
                "compaction_offset": message_offset if compaction_state else 0,
                "last_message_type": messages[-1].type if messages else "none",
                "last_message_content": str(messages[-1].content)[:200] if messages else "none",
                "session_context_size": session_context_size,
                "max_context_size": max_context_size,
                "remaining_context": max(max_context_size - session_context_size, 0) if max_context_size else None,
            },
        )
        
        response = model_with_tools.invoke(messages)

        tool_calls = getattr(response, "tool_calls", []) or []

        new_llm_calls = state.get('llm_calls', 0) + 1

        response_content = getattr(response, 'content', '') or ''

        usage = response.usage_metadata or {}
        input_tokens = usage.get("input_tokens", 0) or 0
        output_tokens = usage.get("output_tokens", 0) or 0
        total_tokens = usage.get("total_tokens", input_tokens + output_tokens)

        current_session = state.get("session_context_size", 0) or 0
        current_total = state.get("tokens_used", 0) or 0

        if tool_calls:
            tool_names = [tc.get("name") for tc in tool_calls]
            tool_args = {tc.get("name"): str(tc.get("args", {}))[:200] for tc in tool_calls}
            log.info(
                "llm_response_with_tool_calls",
                thread_id=thread_id,
                agent_user_id=agent_user_id,
                llm_calls=new_llm_calls,
                execution_id=execution_id,
                node="model_node",
                extra={
                    "tool_calls": tool_names,
                    "tool_args": tool_args,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": total_tokens,
                },
            )
        else:
            log.info(
                "llm_response_text",
                thread_id=thread_id,
                agent_user_id=agent_user_id,
                llm_calls=new_llm_calls,
                execution_id=execution_id,
                node="model_node",
                extra={
                    "response_content": response_content[:500] if response_content else "(empty)",
                    "response_type": type(response).__name__,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": total_tokens,
                },
            )

        return {
            "messages": [response],
            "llm_calls": new_llm_calls,
            "session_context_size": current_session + total_tokens,
            "tokens_used": current_total + total_tokens,
        }
    
    return model_node
