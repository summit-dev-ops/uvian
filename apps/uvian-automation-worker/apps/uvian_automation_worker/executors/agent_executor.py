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
from typing import List, Dict, Any, Optional
from executors.base import BaseExecutor, JobData, JobResult
from executors.triggers import TriggerRegistry
from core.events import events
from core.agents.universal_agent.agent import build_agent
from clients.mcp import create_mcp_registry
from repositories.process_threads import process_thread_repository
from repositories.profiles import profile_repository
from core.logging import worker_logger
from core.config import UVIAN_MCP_LIST
from langgraph.types import Command
from langchain.messages import HumanMessage
import uuid


class AgentExecutor(BaseExecutor):
    """Refactored executor for agent-based jobs using modular components."""
    
    def __init__(self):
        self.agent_name = "agent_executor"
        worker_logger.info(f"Initializing {self.agent_name}")
        
    async def execute(self, job_data: JobData) -> JobResult:
        """Execute an agent job using modular component architecture."""
        job_id = job_data["id"]
        inputs = job_data.get("input", {})
        
        worker_logger.info_job(job_id, "AgentExecutor: Starting agent job")
        
        # Check inputType - only handle 'event' type
        input_type = inputs.get("inputType")
        if input_type != "event":
            raise ValueError(f"AgentExecutor only handles 'event' inputType, got: {input_type}")
        
        # Extract event data from standardized structure
        event_type = inputs.get("eventType")
        if not event_type:
            raise ValueError("eventType is required in job input")
        
        worker_logger.info_job(job_id, f"Processing event: {event_type}")
        
        # Get agent info from standardized structure
        agent_user_id = inputs.get("agentId")
        if not agent_user_id:
            # Fallback to legacy location
            agent_user_id = inputs.get("agent_user_id") or job_data.get("agent_id")
        
        if not agent_user_id:
            raise ValueError("agentId is required in job input")
        
        # Create trigger message from standardized event data
        worker_logger.info_job(job_id, f"Deriving message from trigger for event: {event_type}")
        trigger_message = TriggerRegistry.create_message(event_type, inputs)
        
        if trigger_message:
            message_content = trigger_message.content
            event_metadata = trigger_message.metadata
            worker_logger.info_job(job_id, f"Trigger message derived: {message_content[:100]}...")
        else:
            worker_logger.warning_job(job_id, f"No trigger found for event type: {event_type}")
            message_content = f"Event received: {event_type}"
            event_metadata = {}
        
        # Extract context from standardized structure
        context = inputs.get("context", {})
        conversation_id = context.get("conversationId")
        resource = inputs.get("resource", {})
        resource_id = resource.get("id")
        
        # If no conversationId, derive from resource type
        if not conversation_id and resource.get("type") == "conversation":
            conversation_id = resource_id
        
        # Get optional fields
        thread_id = inputs.get("threadId")
        is_resume = inputs.get("isResume", False)
        resolution_payload = inputs.get("resolutionPayload")

        # Create or use existing thread
        if not thread_id:
            worker_logger.info_job(job_id, "Creating new thread for agent execution")
            thread_id = str(uuid.uuid4())
            
            created_thread = await process_thread_repository.create_thread(
                thread_id=thread_id,
                agent_profile_id=agent_user_id,
                resource_scope_id=None
            )
            
            if not created_thread:
                worker_logger.warning_job(job_id, "Failed to create thread in DB, continuing with in-memory thread")
        
        worker_logger.info_job(job_id, "Loading MCP tools...")

        mcp_list = UVIAN_MCP_LIST.split(",")
        mcp_registry = create_mcp_registry()
        mcp_tools = await mcp_registry.get_tools(
            mcp_names=mcp_list,
            auth_context={"agent_user_id": agent_user_id}
        )

        channel: str = f"conversation:{conversation_id}:messages" if conversation_id else f"agent:{agent_user_id}:messages"
        agent_input = None
        if not is_resume:
            agent_input = {
                "messages": [
                    HumanMessage(content=message_content)
                ],
                "skills": [],
                "custom_instructions": "",
                "agent_name": "Agent",
                "loaded_skills": [],
                "llm_calls": 0,
                "channel_id": channel,
                "conversation_id": conversation_id,
                "agent_user_id": agent_user_id,
                "message_id": str(uuid.uuid4()),
                "event_type": event_type,
                "event_metadata": event_metadata,
            }
        else:
            resolution_payload = inputs.get("resolutionPayload")
            if resolution_payload:
                agent_input = Command(resume=resolution_payload) 
            else:
                agent_input = None 


        config = {"configurable": {"thread_id": thread_id}}
        full_response: List[Any] = []
        try:
            agent = build_agent(mcp_tools)
            async for chunk,_m in agent.astream(
                agent_input,
                config=config, 
                stream_mode="messages" 
            ):
                full_response.append(chunk)

            return {
                "status": "completed",
                "result": {
                    "event_type": event_type,
                    "conversationId": conversation_id,
                    "resourceId": resource_id,
                }
            }

        except Exception as e:
            worker_logger.error(f"Error executing agent: {e}", exception=e)
            return {
                "status": "failed",
                "result": {
                    "error": str(e),
                    "event_type": event_type,
                }
            }
            