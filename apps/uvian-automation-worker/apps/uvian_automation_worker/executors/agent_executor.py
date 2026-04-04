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
from typing import List, Any
from executors.base import BaseExecutor, JobData, JobResult
from executors.triggers import TriggerRegistry
from core.agents.universal_agent.agent import build_agent
from core.agents.utils.mcp_mapping import get_mcps_for_event
from core.agents.utils.skill_mapping import get_skills_for_event
from clients.mcp import create_mcp_registry, build_mcp_registry
from clients.auth import get_agent_secrets
from clients.config import get_agent_skills
from repositories.process_threads import process_thread_repository
from core.logging import worker_logger
from langgraph.types import Command
from langchain.messages import HumanMessage
from langchain_core.messages import ToolMessage
from core.agents.utils.tools.base_tools import flatten_skill_content
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
                metadata=None
            )
            
            if not created_thread:
                worker_logger.warning_job(job_id, "Failed to create thread in DB, continuing with in-memory thread")
        
        worker_logger.info_job(job_id, f"Thread ID: {thread_id}, Agent ID: {agent_user_id}")
        
        worker_logger.info_job(job_id, "Loading agent secrets from automation-api...")
        secrets = await get_agent_secrets(agent_user_id)
        worker_logger.info_job(job_id, str(secrets))
        llm_config = {}
        if secrets.get("llms"):
            default_llm = next(
                (al for al in secrets["llms"] if al.get("is_default")),
                secrets["llms"][0],
            )
            if default_llm and default_llm.get("llms"):
                llm = default_llm["llms"]
                llm_config = {
                    "model_name": llm.get("model_name"),
                    "base_url": llm.get("base_url"),
                    "api_key": llm.get("api_key"),
                    "temperature": llm.get("temperature"),
                }

        all_mcp_configs = secrets.get("mcps", [])
        preloaded_mcp_configs = get_mcps_for_event(event_type, all_mcp_configs)
        
        mcp_tools = []
        if preloaded_mcp_configs:
            worker_logger.info_job(job_id, f"Pre-loading MCP tools for event: {[c.get('id') for c in preloaded_mcp_configs]}")
            mcp_tools = await create_mcp_registry(preloaded_mcp_configs)
            worker_logger.info_job(job_id, f"Pre-loaded {len(mcp_tools)} MCP tools")

        mcp_registry = None
        available_mcps = []
        if all_mcp_configs:
            worker_logger.info_job(job_id, "Building MCP registry for on-demand loading...")
            mcp_registry = await build_mcp_registry(all_mcp_configs)
            
            worker_logger.info_job(job_id, "Fetching tool metadata from MCP servers...")
            for mcp_id in mcp_registry._servers:
                await mcp_registry.ensure_metadata_loaded(mcp_id)
            
            available_mcps = mcp_registry.get_rich_catalog()
            worker_logger.info_job(job_id, f"Available MCPs: {[m['name'] for m in available_mcps]}")

        worker_logger.info_job(job_id, "Loading agent skills from automation-api...")
        all_skills = await get_agent_skills(agent_user_id)
        preloaded_skills = get_skills_for_event(event_type, all_skills)
        worker_logger.info_job(job_id, f"Loaded {len(all_skills)} skills, {len(preloaded_skills)} match event: {[s.get('name') for s in preloaded_skills]}")

        channel: str = f"conversation:{conversation_id}:messages" if conversation_id else f"agent:{agent_user_id}:messages"
        agent_input = None
        if not is_resume:
            initial_messages = []
            for skill in preloaded_skills:
                content = skill.get("content", {})
                if isinstance(content, dict):
                    formatted_content = flatten_skill_content(content)
                elif isinstance(content, str):
                    formatted_content = content
                else:
                    formatted_content = str(content)
                initial_messages.append(
                    ToolMessage(
                        f"Loaded skill: {skill['name']}\n\n{formatted_content}",
                        tool_call_id=f"preload-{skill['name']}",
                    )
                )
            initial_messages.append(HumanMessage(content=message_content))

            agent_input = {
                "messages": initial_messages,
                "skills": preloaded_skills,
                "custom_instructions": "",
                "agent_name": "Agent",
                "loaded_skills": [s.get("name") for s in preloaded_skills],
                "loaded_mcps": [],
                "available_mcps": available_mcps,
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


        config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 100}
        if mcp_registry:
            config["configurable"]["mcp_registry"] = mcp_registry

        full_response: List[Any] = []
        try:
            worker_logger.info_job(job_id, f"Starting agent with config: {config}")
            worker_logger.info_job(job_id, f"Agent input: {str(agent_input)[:500]}...")
            agent = build_agent(mcp_tools, llm_config, mcp_registry=mcp_registry)
            async for chunk,_m in agent.astream(
                agent_input,
                config=config, 
                stream_mode="messages" 
            ):
                full_response.append(chunk)
            
            worker_logger.info_job(job_id, f"Agent completed with {len(full_response)} response chunks")

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
            
