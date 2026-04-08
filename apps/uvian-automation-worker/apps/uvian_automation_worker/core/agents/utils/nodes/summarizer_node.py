from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage
from core.agents.utils.state import MessagesState, MESSAGES_REPLACE
from core.logging import worker_logger

def create_summarize_node(model, agent_name: str):
    def summarize_node(state: MessagesState):
        messages = state["messages"]
        worker_logger.info(f"[summarize_node] ENTER (messages={len(messages)})")
        
        # Separate: keep recent, summarize old
        RECENT_TO_KEEP = 6  # Last 3 exchanges (user+ai)
        
        other_msgs = [m for m in messages if not isinstance(m, SystemMessage)]
        
        recent = other_msgs[-RECENT_TO_KEEP:] if len(other_msgs) > RECENT_TO_KEEP else other_msgs
        old = other_msgs[:-RECENT_TO_KEEP] if len(other_msgs) > RECENT_TO_KEEP else []
        
        if not old:
            # Nothing to summarize
            worker_logger.info(f"[summarize_node] No old messages to summarize")
            return {"messages": messages}
        
        worker_logger.info(f"[summarize_node] Summarizing {len(old)} messages, keeping {len(recent)} recent")
        
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
        
        new_messages = recent
        
        worker_logger.info(f"[summarize_node] EXIT: summarized {len(old)} → {len(new_messages)} messages")
        
        # Replace messages using special marker for our custom reducer, store summary in state
        return {
            "messages": [SystemMessage(content=MESSAGES_REPLACE)] + new_messages,
            "conversation_summary": summary_response.content
        }
    
    return summarize_node