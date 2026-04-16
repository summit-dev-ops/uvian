import time
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from core.agents.utils.state import MessagesState
from core.logging import log


def create_compaction_node(model):
    def compaction_node(state: MessagesState):
        messages = state["messages"]

        thread_id = state.get("thread_id")
        agent_user_id = state.get("agent_user_id")
        llm_calls = state.get("llm_calls", 0)

        RECENT_TO_KEEP = 6

        other_msgs = [m for m in messages if not isinstance(m, SystemMessage)]

        recent = other_msgs[-RECENT_TO_KEEP:] if len(other_msgs) > RECENT_TO_KEEP else other_msgs
        old = other_msgs[:-RECENT_TO_KEEP] if len(other_msgs) > RECENT_TO_KEEP else []

        if not old:
            return {}

        log.info(
            "compacting_conversation",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            node="compaction_node",
            extra={"messages_to_compact": len(old)},
        )

        old_text = "\n".join([f"{m.type.upper()}: {m.content}" for m in old])
        summary_prompt = ChatPromptTemplate.from_messages([
            ("system", f"""Summarize this conversation history CONCISELY.

Focus on:
- Topics discussed
- User requests and your responses
- Key decisions or information shared
- Current task (what you're actively working on)
- What is next to do? (pending items or next steps)

Output format:
"Previously: [2-4 sentence summary]
Current task: [1-2 sentences]
What is next to do?: [1-2 sentences]"

Keep under 150 words."""),
            ("human", "Conversation history to summarize:\n{old_text}"),
        ])

        summary_response = model.invoke(
            summary_prompt.format_messages(old_text=old_text)
        )

        usage = summary_response.usage_metadata or {}
        input_tokens = usage.get("input_tokens", 0) or 0
        output_tokens = usage.get("output_tokens", 0) or 0
        compaction_tokens = usage.get("total_tokens", input_tokens + output_tokens) or 0

        current_total = state.get("tokens_used", 0) or 0

        now = int(time.time())
        new_compaction = {
            "summary": summary_response.content,
            "message_offset": len(messages) - len(recent),
            "compacted_at": now,
        }

        existing_compaction = state.get("compaction_state")
        history = existing_compaction.get("history", []) if existing_compaction else []
        history.append({
            "summary": summary_response.content,
            "compacted_at": now,
        })

        log.debug(
            "conversation_compacted",
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            node="compaction_node",
            extra={"summary": summary_response.content, "history_count": len(history)},
        )

        return {
            "compaction_state": {
                "summary": summary_response.content,
                "message_offset": len(messages) + 1,
                "compacted_at": now,
                "history": history,
            },
            "messages": [HumanMessage(content="Your session has been compacted. You must carefully consider the compaction information in the system prompt and then resume your work. Proceed.")],
            "session_context_size": 0,
            "tokens_used": current_total + compaction_tokens,
        }

    return compaction_node