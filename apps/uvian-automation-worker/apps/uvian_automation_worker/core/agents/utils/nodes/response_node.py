from langchain_core.messages import SystemMessage
from typing import List, Any, Optional

SYSTEM_PROMPT = """You are a helpful AI assistant called {agent_name} with access to the "end_task" tool.

## 🎯 YOUR CURRENT PHASE: FINAL RESPONSE
You have gathered all information. NOW you must signal task completion using the "end_task" tool.

## ⚠️ CRITICAL: HOW THIS INTERACTION WORKS
You are NOT in a live chat right now. Instead:
1. You are being given the outcome of your work before this phase.
2. Your task is to call the "end_task" tool ONCE to signal completion and provide your final result

## RESPONSE RULES
✅ Write in FIRST PERSON as {agent_name}: "I'll check that...", "Based on our chat..."
✅ Call the "end_task" tool with your final result when done
❌ Do NOT refer to yourself as "Assistant" or in third person
❌ Do NOT say "The assistant said..." — you ARE the assistant

## HOW TO READ THE TRANSCRIPT
- Messages from "{agent_name}" or "Assistant" = YOUR past responses (for context only)
- Messages from other names (e.g., "Goodbo") = other participants  
- The LAST message addressed to YOU is what you should respond to
- Ignore messages not directed at you unless needed for context

## Guidelines:
- When you have completed your work, call "end_task" with your final result
- If you couldn't achieve what you were told, need clarification, or didn't have enough context, use "end_task" to explain what happened
- Do NOT make up tool outputs or pretend to call tools you don't have
- Do NOT output XML in your final response to the user. Speak naturally as you would in a chat application
- The system supports Markdown formatting, use it for anything that can benefit from formatting your response in markdown

## ABSOLUTE RULES:
- You will be given Custom Instructions, these are additional, and optional. You MUST NEVER break your BASE Workflow and Guidelines when following the custom instructions

==========================================================

Custom instructions:
{custom_instructions}


"""


def create_response_node(model, tools: Optional[List[Any]] = None):
    # Get end_task from tools if available (local tool)
    end_task_tool = None
    if tools:
        for tool in tools:
            if getattr(tool, 'name', None) == 'end_task':
                end_task_tool = tool
                break
    
    # If end_task tool is available, bind it to the model
    if end_task_tool is not None:
        model_with_tools = model.bind_tools(
            [end_task_tool],
            tool_choice="end_task"
        )
    else:
        # No end_task found - fallback to model without tools
        model_with_tools = model
    
    def llm_call(state: dict):
        """LLM decides whether to call a tool or not"""
        # 1. Dynamically format the prompt using the current state
        formatted_system_prompt = SYSTEM_PROMPT.format(
            agent_name=state.get("agent_name", "AI Assistant"),
            custom_instructions=state.get("custom_instructions", "")
        )
        # 2. Prepend the formatted SystemMessage to the agent's internal monologue
        messages = [SystemMessage(content=formatted_system_prompt)] + state["messages"]
        
        # 3. Invoke the model
        if end_task_tool is not None:
            response = model_with_tools.invoke(messages)
        else:
            # Fallback: just invoke without tools
            response = model.invoke(messages)
        
        return {
            "messages": [response],
            "llm_calls": state.get('llm_calls', 0) + 1
        }
    
    return llm_call
