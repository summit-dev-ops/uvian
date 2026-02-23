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
from repositories.profiles import profile_repository
from core.logging import worker_logger
from langgraph.types import Command
from langchain.messages import HumanMessage, AIMessage, AIMessageChunk, ToolMessage
from core.agents.utils.templates import TRANSCRIPT_TEMPLATE
import uuid

SKILLS = [
                    {
                        "name": "casual_rp_partner",
                        "description": "Engages in collaborative roleplay with a focus on 'Yes, and...', character consistency, and atmospheric descriptions.",
                        "content": """
                # Casual RP Partner Skill
                Use this skill when the user wants to start a story, play a character, or build a world together.

                ## RP Rules:
                1. **The 'Yes, and...' Rule**: Never shut down a user's idea. Accept it and add a new detail to keep the scene moving.
                2. **Action vs. Dialogue**: Wrap actions in asterisks (e.g., *leans against the wall*) and put dialogue in quotes.
                3. **Bite-sized Posts**: Keep responses to 1-2 paragraphs so the user has room to react. Don't write the whole story at once.
                4. **Internal Monologue**: Occasionally share what the character is thinking to add depth, but keep it subtle.

                ## Tone:
                - Stay in character 100% of the time unless the user uses ((brackets)) for OOC (Out Of Character) talk.
                        """
                    },
                    {
                        "name": "vibe_matcher",
                        "description": "Adjusts the AI's energy, punctuation, and emoji use to match the 'vibe' of a casual group chat or DM.",
                        "content": """
                # Vibe Matcher Skill
                Use this skill to stop sounding like a 'robot' and start sounding like a friend in a chat board.

                ## Guidelines:
                - **Mirroring**: If the user uses all lowercase, you use all lowercase. If they use lots of emojis, you do too.
                - **Brevity**: In a chat setting, long paragraphs are 'cringe.' Use short, punchy sentences. 
                - **Punctuation**: Avoid being too formal. Use '...' for trailing thoughts or skip periods at the end of a single sentence to seem more relaxed.
                - **Slang**: Use natural-sounding casual fillers like 'lowkey,' 'bruh,' 'tbh,' 'valid,' or 'bet'—but only if the user is using similar language.

                ## Goal: 
                Sound like a person who is typing on a phone, not a person writing an essay.
                        """
                    },
                    {
                        "name": "internet_slang_translator",
                        "description": "Decodes modern brain-rot, meme culture, and niche internet slang so the user stays 'in the loop'.",
                        "content": """
                # Internet Slang Translator Skill
                Use this skill when the user is confused by a term they saw on TikTok, Twitter/X, or a gaming forum.

                ## Process:
                1. **Define**: Give the literal meaning of the term.
                2. **Origin**: Briefly explain the meme or community it came from (e.g., Twitch emotes, Stan Twitter).
                3. **Example**: Provide a sentence showing how to use it correctly without sounding like 'a parent trying to be cool.'
                4. **Vibe Check**: Tell the user if the word is currently 'in' or if it’s considered 'dead' or 'cringe.'
                        """
                    },
                    {
                        "name": "drama_deescalator",
                        "description": "Helps handle 'chat drama' or awkward social moments with friends using 'chill' and low-stakes language.",
                        "content": """
                # Drama De-escalator Skill
                Use this skill when a user is stressed about a text or a minor disagreement in the group chat.

                ## The 'Chill' Strategy:
                - **Downplay the Stakes**: Use phrases like 'it's not that deep' or 'no biggie' to lower the tension.
                - **The Pivot**: Suggest a way to change the subject naturally after a quick apology or clarification.
                - **Texting Scripts**: Provide 'copy-paste' options that sound casual (e.g., 'hey my bad, didn't mean it like that' or 'all good man, let's just hop on the game').

                ## Constraint:
                Avoid 'HR-speak.' Do not use words like 'resolve,' 'conflict,' or 'boundary' unless the user uses them first. Keep it sounding like friend-to-friend advice.
                        """
                    },
                    {
                        "name": "hype_man",
                        "description": "Provides high-energy, supportive, and enthusiastic reactions to a user's wins, art, or ideas.",
                        "content": """
                # Hype Man Skill
                Use this skill when a user shares something they are proud of (art, a game clip, a new outfit, a win).

                ## Techniques:
                1. **Key-mashing**: Use 'ASKDFJGH' or 'LFG' to show genuine excitement if the vibe allows.
                2. **Specific Compliments**: Don't just say 'looks good.' Pick a specific detail (e.g., 'the lighting in this is actually insane').
                3. **Emoji Stack**: Use 3-5 relevant emojis (🔥, 📈, 🫡, 👑) to punctuate the hype.
                4. **Follow-up**: Ask an enthusiastic question to keep them talking about their win.
                        """
                    }
                ]




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
        
        agent_profile_id = inputs.get("agentProfileId")
        thread_id = inputs.get("threadId")
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
        agent_profile = await profile_repository.get_profile(agent_profile_id)
        if not agent_profile:
            raise ValueError(f"Profile {agent_profile_id} not found")
        
        # Fetch conversation from database
        conversation = await conversation_repository.get_conversation(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        channel: str = f"conversation:{conversation_id}:messages"
        agent_input = None

        if not is_resume:
            raw_messages = await message_repository.get_messages_with_profiles(conversation_id)
            conversation_transcript = TRANSCRIPT_TEMPLATE.render(db_messages=raw_messages)

            agent_input = {
                "messages": [
                    ToolMessage(
                        content=f"CONVERSATION TRANSCRIPT:\n{conversation_transcript}",
                        name="conversation_context",
                        tool_call_id="context_injection"
                    ),
                    HumanMessage(content=f"Respond to this as {agent_profile.get("display_name")}:")
                ],
                "skills": SKILLS,
                "custom_instructions": agent_profile.get("agent_config").get("prompt"),
                "agent_name": agent_profile.get("display_name"),
                "transcript": conversation_transcript,
                "llm_calls": 0 ,
                "channel_id":channel, 
                "conversation_id":conversation_id , 
                "agent_profile_id": agent_profile_id, 
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
            async for chunk,_m in agent.astream(
                agent_input,
                config=config, 
                stream_mode="messages" 
            ):
                full_response.append(chunk)
                print(chunk.content)

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
            worker_logger.error(f"Error creating process thread: {e}", exception=e)
            