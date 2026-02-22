# executors/agent_executor.py
"""
AgentExecutor - Multi-agent system executor with modular architecture.

Uses dependency injection to delegate to specialized components for:
- State management and checkpointing
- Tool execution and management  
- Human intervention handling
- LLM reasoning and step execution
- Workflow orchestration

This refactored version is significantly smaller and more maintainable
than the original monolith.
"""
from typing import List, Dict, Any
from executors.base import BaseExecutor, JobData, JobResult
from core.events import events
from core.agents.universal_agent.agent import agent
from repositories.messages import message_repository
from repositories.process_threads import process_thread_repository
from repositories.conversations import conversation_repository
from core.logging import worker_logger
from langgraph.types import Command
from langchain.messages import HumanMessage, AIMessage, AIMessageChunk
import uuid

class AgentExecutor(BaseExecutor):
    """Refactored executor for agent-based jobs using modular components."""
    
    def __init__(self):
        self.agent_name = "agent_executor"
        worker_logger.info(f"Initializing {self.agent_name}")
        
    async def execute(self, job_data: JobData) -> JobResult:
        """Execute an agent job using modular component architecture."""
        job_id = job_data["id"]
        resource_scope_id = job_data.get("resource_scope_id")
        inputs = job_data.get("input", {})
        
        worker_logger.info_job(job_id, "AgentExecutor: Starting agent job")
        
        # Extract job parameters (camelCase from API, convert to snake_case for DB)
        agent_profile_id = inputs.get("agentProfileId")
        thread_id = inputs.get("threadId")
        initial_message = inputs.get("initialMessage")
        is_resume = inputs.get("isResume", False)
        resolution_payload = inputs.get("resolutionPayload")
        conversation_id = inputs.get("conversationId")

        message_id: str = str(uuid.uuid4())
        if not agent_profile_id:
            raise ValueError("agentProfileId is required in job input")
        
        if not resource_scope_id:
            raise ValueError("resourceScopeId is required in job input")
        
        if not conversation_id:
            raise ValueError("conversationId is required in job input")
        
        if not thread_id:
            process_thread = await process_thread_repository.create_thread(str(uuid.uuid4()), agent_profile_id, resource_scope_id)
            thread_id = process_thread["id"]

        # Fetch conversation from database
        conversation = await conversation_repository.get_conversation(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        agent_input = None

        if not is_resume:
            raw_messages = await message_repository.get_messages(conversation_id)
            messages = []
            for msg in raw_messages:
                if msg["sender_id"] == agent_profile_id:
                    messages.append(AIMessage(content=msg["content"]))
                else:
                    messages.append(HumanMessage(content=msg["content"]))

            print(messages)
            agent_input = {"messages": messages}
        else:
            resolution_payload = inputs.get("resolutionPayload")
            if resolution_payload:
                agent_input = Command(resume=resolution_payload) 
            else:
                agent_input = None 


        config = {"configurable": {"thread_id": thread_id}}
        full_response: List[str] = []
        channel: str = f"conversation:{conversation_id}:messages"

        try:
            async for message_chunk, metadata in agent.astream(
                agent_input,
                config=config, 
                stream_mode="messages" 
            ):
                if message_chunk.content:
                    await events.publish_message(
                        channel, 
                        conversation_id, 
                        agent_profile_id,
                        message_id,
                        content=message_chunk.content, 
                        is_delta=True
                    )
                    full_response.append(message_chunk.content)

            result_text: str = "".join(full_response)
            
            # Send final completion message
            await events.publish_message(
                channel, 
                conversation_id, 
                agent_profile_id,
                message_id,
                content=result_text, 
                is_delta=False, 
                is_complete=True
            )






            

            
            await message_repository.insert_message({
                "id": message_id,
                "sender_id": agent_profile_id,
                "conversation_id": conversation_id,
                "content": result_text,
                "role": "assistant"
            })

            return {
                "status": "completed",
                "result": {
                    "text": result_text, 
                    "conversationId": conversation_id, 
                    "messageId": message_id
                }
            }

        # Validate required parameters
        except Exception as e:
            worker_logger.error(f"Error creating process thread: {e}", exception=e)
            