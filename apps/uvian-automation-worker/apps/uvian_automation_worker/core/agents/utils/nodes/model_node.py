from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from core.logging import worker_logger
import json

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
        active_tools = list(base_tools)
        
        model_with_tools = model.bind_tools(active_tools, tool_choice="auto")
        
        skills = state.get("skills", [])
        loaded_skills = state.get("loaded_skills", [])
        skills_section = ""
        if skills:
            skills_list = [f"- **{s['name']}**: {s['description']}" for s in skills if s.get("name") not in loaded_skills]
            skills_section = "\n\n## Available Skills\n\n" + "\n".join(skills_list)
        
        formatted_system_prompt = SYSTEM_PROMPT.format(
            agent_name=state.get("agent_name", "AI Assistant"),
            custom_instructions=state.get("custom_instructions", "")
        ) + skills_section
        messages = [SystemMessage(content=formatted_system_prompt)] + state["messages"]
        
        # Log all messages in state for debugging
        worker_logger.info(f"[model_node] State messages count: {len(state.get('messages', []))}")
        for i, msg in enumerate(state.get('messages', [])):
            msg_preview = msg.content[:200] if hasattr(msg, 'content') else str(msg)[:200]
            msg_type = getattr(msg, 'type', 'unknown')
            worker_logger.info(f"[model_node] Message {i}: type={msg_type}, content={msg_preview}...")
        
        last_user_msg = ""
        for msg in reversed(messages):
            if hasattr(msg, "type") and msg.type == "human":
                last_user_msg = msg.content[:200]
                break
        worker_logger.info(f"[model_node] LLM call #{state.get('llm_calls', 0) + 1}: last_message={last_user_msg[:100]}...")
        worker_logger.info(f"[model_node] Tools available: {[t.name for t in active_tools]}")
        
        response = model_with_tools.invoke(messages)

        tool_calls = getattr(response, "tool_calls", []) or []
        
        # Log the full response content
        response_content = response.content if hasattr(response, 'content') else str(response)
        worker_logger.info(f"[model_node] === LLM RESPONSE START ===")
        worker_logger.info(f"[model_node] Response content: {response_content[:500] if response_content else 'EMPTY'}")
        worker_logger.info(f"[model_node] Response type: {type(response)}")
        worker_logger.info(f"[model_node] Tool calls: {len(tool_calls)}")
        for tc in tool_calls:
            worker_logger.info(f"[model_node] Tool call: {tc.get('name')} args={str(tc.get('args', {}))[:200]}")
        worker_logger.info(f"[model_node] === LLM RESPONSE END ===")

        return {
            "messages": [response],
            "llm_calls": state.get('llm_calls', 0) + 1
        }
    
    return llm_call
