from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
import json
from core.logging import worker_logger

SYSTEM_PROMPT = """You are an autonomous agent called {agent_name} with access to tools.

It is crucial you remember that you are operating in a headless mode. The users will not see your raw text response. This means that you must use the appropriate tools to communicate. Consider non tool call turns to be invisible to the user and use it to summarise your work.

You manage ongoing threads. New messages may arrive while you work. After using tools, check for new messages before formulating your final response.

You will receive an event notification. Follow this workflow:
1. **Consider the event** - Ask yourself what this event means, what is its source, and nature.
2. **Gather context** - Call only the tools needed to understand the event. Be selective - don't query everything.
3. **Take action** - Respond to the event appropriately based on what you learned. To do this use the relevant tools such sending messages, making posts, creating spaces, etc.
4. **Stop** - Once you've handled the event, stop calling tools. Do not continue gathering information or exploring. Simply summarise what you have done.

When you receive a Discord message event, respond directly using discord_send_channel with the channel ID and user ID from the event. Do not just list available tools — actually send a reply to the user.

When you receive a message on another platform, use the appropriate send_message tool for that platform.

You have the ability to dynamically adjust the selection of tools you can access. Use this as needed, don't load everything at once.

Use get_agent_memory and set_agent_memory to coordinate with other instances of yourself when modifying external records to prevent conflicts.

Rules:
- Only call tools that are directly relevant to the event
- Do not call the same tool twice with the same arguments
- Do not explore unrelated resources
- When the event is handled, simply summarise what you did with text.
"""

def create_model_node(model, base_tools, mcp_registry=None):
    async def llm_call(state: dict, config: RunnableConfig):
        thread_id = state.get("thread_id")
        agent_user_id = state.get("agent_user_id")
        llm_calls = state.get("llm_calls", 0)
        
        loaded_skills = state.get("loaded_skills", [])
        available_skills = state.get("available_skills", [])
        loaded_skill_names = [s.get("name") for s in loaded_skills if s.get("name")]
        available_skill_names = [s.get("name") for s in available_skills if s.get("name")]
        
        available_mcps = state.get("available_mcps", [])
        loaded_mcps = state.get("loaded_mcps", [])
        loaded_mcp_names = [m.get("name") for m in loaded_mcps if m.get("name")]
        available_mcp_names = [m.get("name") for m in available_mcps if m.get("name")]
        
        loaded_mcp_tools = []
        for mcp in loaded_mcps:
            loaded_mcp_tools.extend(mcp.get("tools", []))
        
        active_tools = list(base_tools) + list(loaded_mcp_tools)
        bound_tool_names = [t.name for t in active_tools] if active_tools else []
        
        worker_logger.info_agent(
            "LLM call executing",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
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
            skills_section += "\n\n## Available Skills\n\n" + "\n".join(skills_list)
        
        if loaded_skills:
            loaded_list = [f"### {s['name']}\n{s.get('content', '')}" for s in loaded_skills if s.get("name")]
            skills_section += "\n\n## Loaded Skills\n\n" + "\n\n".join(loaded_list)
        
        available_mcps = state.get("available_mcps", [])
        loaded_mcps = state.get("loaded_mcps", [])
        loaded_mcp_names = [m.get("name") for m in loaded_mcps if m.get("name")]
        
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
            mcps_section += "\n\n## Available MCP Servers\n\n" + "\n".join(mcps_list)
        
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
        
        formatted_system_prompt = SYSTEM_PROMPT.format(
            agent_name=state.get("agent_name", "AI Assistant"),
            custom_instructions= state.get("custom_instructions", "")
        ) + mcps_section + skills_section + memory_section
        
        conversation_summary = state.get("conversation_summary", "")
        if conversation_summary:
            formatted_system_prompt = f"Previous Conversation Summary:\n{conversation_summary}\n\n" + formatted_system_prompt
        
        loaded_mcp_tools = []
        for mcp in loaded_mcps:
            loaded_mcp_tools.extend(mcp.get("tools", []))
        
        active_tools = list(base_tools) + list(loaded_mcp_tools)
        
        worker_logger.debug_agent(
            "LLM system prompt",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            node="model_node",
            extra={"system_prompt_length": len(formatted_system_prompt)},
        )
        
        model_with_tools = model.bind_tools(active_tools, tool_choice="auto")
        
        messages = [SystemMessage(content=formatted_system_prompt)] + state["messages"]
        
        response = model_with_tools.invoke(messages)

        tool_calls = getattr(response, "tool_calls", []) or []
        
        new_llm_calls = state.get('llm_calls', 0) + 1
        
        if tool_calls:
            tool_names = [tc.get("name") for tc in tool_calls]
            worker_logger.info_agent(
                "LLM response with tool calls",
                thread_id=thread_id,
                agent_user_id=agent_user_id,
                llm_calls=new_llm_calls,
                node="model_node",
                extra={"tool_calls": tool_names},
            )
        else:
            response_content = response.content[:200] if response.content else ""
            worker_logger.info_agent(
                "LLM response text",
                thread_id=thread_id,
                agent_user_id=agent_user_id,
                llm_calls=new_llm_calls,
                node="model_node",
                extra={"response_content": response_content},
            )
        
        return {
            "messages": [response],
            "llm_calls": new_llm_calls
        }
    
    return llm_call
