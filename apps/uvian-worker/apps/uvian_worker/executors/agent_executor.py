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
        resource_scope_id = job_data.get("resource_scope_id")
        inputs = job_data.get("input", {})
        
        worker_logger.info_job(job_id, "AgentExecutor: Starting agent job")
        
        agent_user_id = inputs.get("agent_user_id")
        thread_id = inputs.get("threadId")
        is_resume = inputs.get("isResume", False)
        resolution_payload = inputs.get("resolutionPayload")
        conversation_id = inputs.get("conversationId")

        message_id: str = str(uuid.uuid4())
        if not agent_user_id:
            raise ValueError("agent_user_id is required in job input")
        
        if not resource_scope_id:
            raise ValueError("resourceScopeId is required in job input")
        
        if not conversation_id:
            raise ValueError("conversationId is required in job input")
        
        if not thread_id:
            process_thread = await process_thread_repository.create_thread(str(uuid.uuid4()), agent_profile_id, resource_scope_id)
            thread_id = process_thread["id"]

        worker_logger.info_job(job_id, "Loading MCP tools...")

        mcp_list = UVIAN_MCP_LIST.split(",")
        mcp_registry = create_mcp_registry()
        mcp_tools = await mcp_registry.get_tools(
            mcp_names=mcp_list,
            auth_context={"agent_user_id": agent_user_id}
        )

        channel: str = f"conversation:{conversation_id}:messages"
        agent_input = None

        if not is_resume:
            agent_input = {
                "messages": [
                    HumanMessage(content=f"Hi!")
                ],
                "skills": [],
                "custom_instructions": "",
                "agent_name": "Test",
                "loaded_skills": [],
                "llm_calls": 0,
                "channel_id": channel,
                "conversation_id": conversation_id,
                "agent_user_id": agent_user_id,
                "message_id": message_id,
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
                # print(chunk)

            # print(full_response)
            return {
                "status": "completed",
                "result": {
                    "conversationId": conversation_id, 
                    "messageId": message_id
                }
            }

        # Validate required parameters
        except Exception as e:
            worker_logger.error(f"Error executing agent: {e}", exception=e)
            return {
                "status": "failed",
                "error": str(e)
            }
            