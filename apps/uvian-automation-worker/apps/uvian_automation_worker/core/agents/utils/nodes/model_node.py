from langchain_core.messages import SystemMessage
from core.logging import worker_logger
import json

SYSTEM_PROMPT = """You are an autonomous agent called {agent_name} with access to tools.

You will receive an event notification. Follow this workflow:

1. **Gather context** - Call only the tools needed to understand the event. Be selective - don't query everything.
2. **Take action** - Respond to the event appropriately based on what you learned. To do this use the relevant tools such sending messages, making posts, creating spaces, etc.
3. **Stop** - Once you've handled the event, stop calling tools. Do not continue gathering information or exploring.

Rules:
- Only call tools that are directly relevant to the event
- Do not call the same tool twice with the same arguments
- Do not explore unrelated resources
- When the event is handled, simply summarise what you did with text.
- You must always respond, with an appropriate tool, the user can't see your outputs unless you call approiate tool, such as sending messages, creating posts, etc.
- Events will come from a variety of sources, each source has its own collection of tools, you need to choose the correct ones.
"""

def create_model_node(model, tools):
    # Bind the tools to the LLM once
    model_with_tools = model.bind_tools(tools, tool_choice="auto")

    def llm_call(state: dict):
        """LLM decides whether to call a tool or not"""
        
        skills = state.get("skills", [])
        loaded_skills = state.get("loaded_skills", [])
        skills_section = ""
        if skills:
            skills_list = [f"- **{s['name']}**: {s['description']}" for s in skills if not s in loaded_skills]
            skills_section = "\n\n## Available Skills\n\n" + "\n".join(skills_list)
        
        # 1. Dynamically format the prompt using the current state
        formatted_system_prompt = SYSTEM_PROMPT.format(
            agent_name=state.get("agent_name", "AI Assistant"),
            custom_instructions=state.get("custom_instructions", "")
        ) + skills_section
        # 2. Prepend the formatted SystemMessage to the agent's internal monologue
        messages = [SystemMessage(content=formatted_system_prompt)] + state["messages"]
        
        # Log the LLM call
        last_user_msg = ""
        for msg in reversed(messages):
            if hasattr(msg, "type") and msg.type == "human":
                last_user_msg = msg.content[:200]
                break
        worker_logger.info(f"[model_node] LLM call #{state.get('llm_calls', 0) + 1}: last_message={last_user_msg[:100]}...")
        worker_logger.info(f"[model_node] Tools available: {[t.name for t in tools]}")
        
        # 3. Invoke the model
        response = model_with_tools.invoke(messages)

        # Log the response
        tool_calls = getattr(response, "tool_calls", []) or []
        response_preview = response.content[:200] if hasattr(response, "content") else "no content"
        worker_logger.info(f"[model_node] LLM response: content={response_preview}... tool_calls={len(tool_calls)}")
        if tool_calls:
            for tc in tool_calls:
                worker_logger.info(f"[model_node] Tool call: {tc.get('name')} args={str(tc.get('args', {}))[:200]}")

        return {
            "messages": [response],
            "llm_calls": state.get('llm_calls', 0) + 1
        }
    
    return llm_call