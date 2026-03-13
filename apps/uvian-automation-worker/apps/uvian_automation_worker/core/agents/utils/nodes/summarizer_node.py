from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage
from core.agents.utils.state import MessagesState

def create_summarize_node(model, agent_name: str):
    def summarize_node(state: MessagesState):
        messages = state["messages"]
        print("summarize_node")
        # Separate: keep recent, summarize old
        RECENT_TO_KEEP = 6  # Last 3 exchanges (user+ai)
        
        system_msgs = [m for m in messages if isinstance(m, SystemMessage)]
        other_msgs = [m for m in messages if not isinstance(m, SystemMessage)]
        
        recent = other_msgs[-RECENT_TO_KEEP:] if len(other_msgs) > RECENT_TO_KEEP else other_msgs
        old = other_msgs[:-RECENT_TO_KEEP] if len(other_msgs) > RECENT_TO_KEEP else []
        
        if not old:
            # Nothing to summarize
            return {"messages": messages}
        
        # Generate summary
        old_text = "\n".join([f"{m.type.upper()}: {m.content}" for m in old])
        summary_prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are {agent_name}. Summarize this conversation history CONCISELY.
            
Focus on:
- Topics discussed (not verbatim data)
- User requests and your responses
- Key decisions or information shared

Output format:
"Previously: [2-4 sentence summary]"

Keep under 150 words."""),
            ("human", "Conversation history to summarize:\n{old_text}"),
        ])
        
        summary_response = model.invoke(
            summary_prompt.format_messages(old_text=old_text)
        )
        
        # Create new message list: system + summary + recent
        summary_message = SystemMessage(
            content=f"CONVERSATION SUMMARY:\n{summary_response.content}",
            name="context_summary"
        )
        
        new_messages = system_msgs + [summary_message] + recent
        
        print(f"✓ Summarized {len(old)} messages → {len(new_messages)} total messages")
        return {"messages": new_messages}
    
    return summarize_node