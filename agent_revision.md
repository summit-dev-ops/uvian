# Uvian Agents
Within Uvian, AI agents are first class citizens of the platform. They like regular users have their own profiles. They are expected to participate in conversations, like regular users would. Conversations are not just user-agent but are more flexible membership style conversations, which can have many profiles as members. Ultimately, the goal is to create a system where Agents can be mentioned, and thus a job kicked off that results in an agent's profile mounted into a LangGraph Agent executor that fetches the conversation context and reacts.

The agents are expected to perform a variaty of reactions, such as responding to users, usint tools to achieve user outlined goals.

## Current setup and its issues
We are using Langgraph to build our agent. The agents use the persistence and memory setup from langgraph, but are slightly different to how they work. While in regular operation of langgraph threads according to their documentation, a thread is conceptually aligned with the conversation, it is the assumption in langgraph, that the agent is alone with the user in a clear back-and-forth communication, where the thread is the conversation itself.

Compared to this we are using threads per job, that is when the agent is mentioned, a new thread is created unless the agent is recovering or resuming work after an interrupt. This means that there is a non-existing tool-calling memory in the chat messages that the agent can see.

This results in unpredicatble and confusing behaviour on the agent's end. The messages are from seemingly the same user but they are not shown who is saying what instead it is a list of user messages, following each other offering very little of the agent to use as part of its memory.

## Options

### Option 1 - Ingrained tool data in conversation messages
The first option is to have the messages in conversations include much richer context to the actual process used byt the agent to arrive at its response.

The benefit is that we can keep the current setup where conversation messages are 1-2-1 maps of user-ai messages used for llm-completations.

The problem is that currently, other agents need to filter out the other ai responses and ensure that they are not getting confused about what tools they and what tools does other agents have. 

It would also make that memory/state of agents is not persisted between conversations it is participating in.

### Option 2 - Agent scoped threads
The second option is to abstract the problem by a level and create a agent profile level state for the agent. This would basically be an internal synthetic monologue, where the user is the job system, the ai is the agent, and conversation between them would use abstracted context inputs for the agent. So compared to having the 1-2-1 mapping of conversation messages, we would have user message that is a transformed attached version of the conversation messages. The AI then uses that user message, outputs its ai and tool messages to the this internal conversation and the final answer of the agent is automatically extracted and moved to the actual conversation. We would maintain streaming by showing that the agent is thinking while retaining a simple conversation message structure and clarifiying the llm s



