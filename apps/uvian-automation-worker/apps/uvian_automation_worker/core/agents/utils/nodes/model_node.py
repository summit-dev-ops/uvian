from langchain_core.messages import SystemMessage

SYSTEM_PROMPT = """You are an autonomous agent called {agent_name} with access to tools.

The user will inform you about some event that has occured, such as a new message has been sent to a conversation you are part of or a new post has been added to a space you are a member of. 
Your task is to use your tools to fetch the relevant data and then proceed to react to the event you have been informed of. You have an end_task tool that you should call when you have finished working.
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