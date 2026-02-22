import runpod
import asyncio
from typing import AsyncGenerator
from core.config import RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID
import time
import requests
from openai import OpenAI

MODEL_NAME="readyart/strawberrylemonade-l3-70b-v1.0-awq"
MODEL_NAME="jiangchengchengNLP/llama3.3-70B-instruct-abliterated-awq"
# Initialize the client pointing to RunPod
client = OpenAI(
    api_key=RUNPOD_API_KEY,
    base_url=f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/openai/v1",
)

async def chat_completion(messages, tools=None, model_name=MODEL_NAME):
    # This now uses the NATIVE vLLM tool-calling logic
    response = client.chat.completions.create(
        model=model_name,
        messages=messages,
        tools=tools,
        tool_choice= "auto",
        stream=True,
    )
    
    for chunk in response:
        delta = chunk.choices[0].delta
        if delta.tool_calls:
            yield {"type": "tool_call", "data": delta.tool_calls}
            
        elif delta.content:
            yield {"type": "content", "data": delta.content}
