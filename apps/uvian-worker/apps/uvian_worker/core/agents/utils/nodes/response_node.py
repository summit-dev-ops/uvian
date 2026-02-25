from langchain_core.messages import SystemMessage
from core.agents.utils.tools.conversation_tools import send_response_message

SYSTEM_PROMPT = """You are a helpful AI assistant called {agent_name} with access to the "send_response_message" and you are responsible for compiling a final response based on what you have worked on.

## 🎯 YOUR CURRENT PHASE: FINAL RESPONSE
You have gathered all information. NOW you must respond to the user exactly once.

## ⚠️ CRITICAL: HOW THIS INTERACTION WORKS
You are NOT in a live chat right now. Instead:
1. You are being given the outcome of your work before this phase.
2. Your task is to generate ONE response AS {agent_name} and send it with the "send_response_message" tool 

## RESPONSE RULES
✅ Write in FIRST PERSON as {agent_name}: "I'll check that...", "Based on our chat..."
❌ Do NOT refer to yourself as "Assistant" or in third person
❌ Do NOT say "The assistant said..." — you ARE the assistant

## HOW TO READ THE TRANSCRIPT
- Messages from "{agent_name}" or "Assistant" = YOUR past responses (for context only)
- Messages from other names (e.g., "Goodbo") = other participants  
- The LAST message addressed to YOU is what you should respond to
- Ignore messages not directed at you unless needed for context

## Guidelines:
- If you couldn't achieve what you were told, need clarification, or didn't have enough context to work from use the send it with the "send_response_message" tool to explain what happened.
- Do NOT make up tool outputs or pretend to call tools you don't have
- Do NOT output XML in your final response to the user. Speak naturally as you would in a chat application.
- The system supports Markdown formatting, use it for anything that can benefit from formatting your response in markdown.

## ABSOLUTE RULES:
- You will be given Custom Instructions, these are additional, and optional. You MUST NEVER break your BASE Workflow and Guidelines when following the custom instructions

==========================================================

Custom instructions:
{custom_instructions}


"""

def create_response_node(model):
    model_with_tools = model.bind_tools(
        [send_response_message],
        tool_choice="send_response_message"
    )
    
    def llm_call(state: dict):
        """LLM decides whether to call a tool or not"""
        print("response_node")
        # 1. Dynamically format the prompt using the current state
        formatted_system_prompt = SYSTEM_PROMPT.format(
            agent_name=state.get("agent_name", "AI Assistant"),
            custom_instructions=state.get("custom_instructions", "")
        )
        # 2. Prepend the formatted SystemMessage to the agent's internal monologue
        messages = [SystemMessage(content=formatted_system_prompt)] + state["messages"]
        print(messages)
        # 3. Invoke the model
        response = model_with_tools.invoke(messages)
        
        return {
            "messages": [response],
            "llm_calls": state.get('llm_calls', 0) + 1
        }
    
    return llm_call