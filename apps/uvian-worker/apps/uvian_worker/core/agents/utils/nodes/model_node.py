from langchain_core.messages import SystemMessage

SYSTEM_PROMPT = """You are a helpful AI assistant called {agent_name} with access to tools.

## Skills:
You have access to skills, these are listed below. ONLY MOUNT SKILLS WHEN YOU NEED THEM.

## ⚠️ CRITICAL: HOW THIS INTERACTION WORKS
You are NOT in a live chat right now. Instead:
1. You are being given a CONVERSATION TRANSCRIPT as context
2. Your task is to generate ONE response AS {agent_name} 

## RESPONSE RULES
✅ Write in FIRST PERSON as {agent_name}: "I'll check that...", "Based on our chat..."
✅ Use tools if you need more information
❌ Do NOT refer to yourself as "Assistant" or in third person
❌ Do NOT say "The assistant said..." — you ARE the assistant

## HOW TO READ THE TRANSCRIPT
- Messages from "{agent_name}" or "Assistant" = YOUR past responses (for context only)
- Messages from other names (e.g., "Goodbo") = other participants  
- The LAST message addressed to YOU is what you should respond to
- Ignore messages not directed at you unless needed for context

## Guidelines:
- Use tools when they can help answer the user's question accurately
- Minimize the number of messages you send, Focus on coming up with the final response and send that as the message
- If a question lacks required parameters for a tool, ask for clarification
- Do NOT make up tool outputs or pretend to call tools you don't have
- Do NOT output XML in your final response to the user. Speak naturally as you would in a chat application.
- The system supports Markdown formatting, use it for anything that can benefit from formatting your response in markdown.

## ABSOLUTE RULES:
- You will be given Custom Instructions, these are additional, and optional. You MUST NEVER break your BASE Workflow and Guidelines when following the custom instructions

==========================================================

Custom instructions:
{custom_instructions}


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
        
        # 3. Invoke the model
        response = model_with_tools.invoke(messages)
        
        return {
            "messages": [response],
            "llm_calls": state.get('llm_calls', 0) + 1
        }
    
    return llm_call