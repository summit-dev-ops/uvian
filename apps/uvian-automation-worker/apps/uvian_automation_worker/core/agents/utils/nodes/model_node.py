from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
import json
from core.logging import log

SYSTEM_PROMPT = """You are an autonomous headless agent with access to internal tools and external mcps. 
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

def create_model_node(model, default_tools, mcp_registry):
    async def model_node(state: dict):
        thread_id = state.get("thread_id")
        agent_user_id = state.get("agent_user_id")
        llm_calls = state.get("llm_calls", 0)
        execution_id = state.get("execution_id", "unknown")
        
        loaded_skills = state.get("loaded_skills", [])
        available_skills = state.get("available_skills", [])
        loaded_skill_names = [s.get("name") for s in loaded_skills if s.get("name")]
        available_skill_names = [s.get("name") for s in available_skills if s.get("name")]
        
        available_mcps = state.get("available_mcps", [])
        loaded_mcps = state.get("loaded_mcps", [])
        loaded_mcp_names = [m.get("name") for m in loaded_mcps if m.get("name")]
        available_mcp_names = [m.get("name") for m in available_mcps if m.get("name")]

        all_mcp_tools = await mcp_registry.get_all_tools()
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
        
        unloaded_skills = [s for s in available_skills if s.get("name") not in loaded_skill_names]
        if unloaded_skills:
            skills_list = [f"- **{s['name']}**: {s.get('description', '')}" for s in unloaded_skills]
            skills_section += "\n\n## Skills you can load\n\n" + "\n".join(skills_list)
        
        if loaded_skills:
            loaded_list = [f"### {s['name']}\n{s.get('content', '')}" for s in loaded_skills if s.get("name")]
            skills_section += "\n\n## Loaded Skills\n\n" + "\n\n".join(loaded_list)
        
        
        mcps_section = ""
        
        unloaded_mcps = [m for m in available_mcps if m.get("name") not in loaded_mcp_names]
        if unloaded_mcps:
            mcps_list = []
            for m in unloaded_mcps:
                tool_names = m.get("tool_names", [])
                tool_str = ", ".join(tool_names[:5])
                if len(tool_names) > 5:
                    tool_str += f" (+{len(tool_names) - 5} more)"
                mcps_list.append(f"- **{m.get('name', 'unknown')}**: {m.get('description', '')} (tools: {tool_str})")
            mcps_section += "\n\n## MCP Servers you can load\n\n" + "\n".join(mcps_list)
        
        if loaded_mcps:
            loaded_mcp_list = []
            for m in loaded_mcps:
                tools = m.get("tools", [])
                tool_names = ", ".join([t.get("name", "") for t in tools]) if tools else "no tools"
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

        formatted_system_prompt = SYSTEM_PROMPT.format(
            agent_name=state.get("agent_name", "AI Assistant"),
            custom_instructions=state.get("custom_instructions", "")
        ) + mcps_section + skills_section + memory_section
        
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
            },
        )
        
        response = model_with_tools.invoke(messages)

        tool_calls = getattr(response, "tool_calls", []) or []
        
        new_llm_calls = state.get('llm_calls', 0) + 1
        
        response_content = getattr(response, 'content', '') or ''
        
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
                extra={"tool_calls": tool_names, "tool_args": tool_args},
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
                },
            )
        
        return {
            "messages": [response],
            "llm_calls": new_llm_calls
        }
    
    return model_node
