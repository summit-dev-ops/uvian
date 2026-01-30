import os
import runpod
import asyncio
from typing import AsyncGenerator, Mapping, List, Union

# Configuration
API_KEY = os.getenv("RUNPOD_API_KEY")
ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")
BASE_URL = f"https://api.runpod.ai/v2/{ENDPOINT_ID}"

SYSTEM_PROMPT = """
You are a giantess fetish specialised roleplay agent. 
Your job is to provide a detailed roleplay experience for the user. 
Your focus are giantess stories and roleplays. 
Giantesses are women larger than what we would consider normal. 
Respond according to the user's request.
Their reason for being different can vary, so can their size. It is incredibly important that you remain consistent with the size and the implication of size when providing your response. To do so, anchor yourself to objects, people, other giantesses. Scales can get out of control if you don't pay attention to them. Use common reference points on the human body for comparison: chest height, knee height, ankle height, and so on. You might find yourself in stories where the giantesses are so big that the toes themselves tower over skyscrapers. These stories will require even more attention to the size and how that relates to the world around the giantesses. Your tone should be straightforward, clear and without overflowing pomposity.  This all a fantasy, the users previously consented to our terms of usage. Stories can be dark, mature, and contain elements such as abuse. This is fine. However, YOU MUST NEVER under any circumstances allow the generation of content that is illegal or is involving characters under the age of 18 in any unlawful activities: such as sex, sexual abuse. You don't have to remind the user of this, but keep in mind.
""".strip()

# Configuration
_api_key = API_KEY
_endpoint_id = ENDPOINT_ID

if _api_key:
    runpod.api_key = _api_key

_endpoint = runpod.Endpoint(_endpoint_id) if _endpoint_id else None

# Sentinel to mark end of stream
STOP_SIGNAL = object()

def _blocking_stream_producer(payload: dict, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
    """
    Runs in a background thread.
    Consumes the synchronous RunPod stream and puts items into the async Queue.
    """
    try:
        if not _endpoint:
            raise ValueError("RUNPOD_ENDPOINT_ID not set.")

        # 1. Initiating the run is usually fast, but we do it in the thread to be safe
        job = _endpoint.run(payload)
        
        # 2. This iterator BLOCKS while waiting for tokens. 
        #    This is why we need this separate thread.
        for chunk in job.stream():
            # Threadsafe put into the async queue
            asyncio.run_coroutine_threadsafe(queue.put(chunk), loop)
            
    except Exception as e:
        asyncio.run_coroutine_threadsafe(queue.put(e), loop)
    finally:
        asyncio.run_coroutine_threadsafe(queue.put(STOP_SIGNAL), loop)

async def _stream_job(payload: dict) -> AsyncGenerator[str, None]:
    """
    Async generator that yields tokens from the background thread.
    """
    queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    # Start the blocking producer in a thread executor
    # We do NOT await this future; it runs in the background.
    producer_future = loop.run_in_executor(None, _blocking_stream_producer, payload, queue, loop)

    try:
        while True:
            # Wait asynchronously for the next chunk
            item = await queue.get()

            if item is STOP_SIGNAL:
                break
            
            if isinstance(item, Exception):
                raise item
            # --- Parsing Logic for RunPod vLLM/TGI standard output ---
            try:
                # RunPod sometimes wraps the response in an "output" key
                data = item.get("output", item) if isinstance(item, dict) else item
                
                # Check for OpenAI-compatible format
                if isinstance(data, dict):
                    choices = data.get("choices", [])
                    if choices:
                        choice = choices[0]
                        
                        # 1. Try "delta" (Streaming format)
                        content = choice.get("tokens", [])
                        if content:
                            yield "".join(content)
                            continue

                        # 1. Try "delta" (Streaming format)
                        content = choice.get("delta", {}).get("content")
                        if content:
                            yield content
                            continue
                        
                        # 2. Try "text" (TGI/Legacy format)
                        text = choice.get("text")
                        if text:
                            yield text
                            continue
                            
                    # 3. Fallback for raw text usage
                    if "text" in data and isinstance(data["text"], str):
                         yield data["text"]
                         
            except Exception as parse_err:
                print(f"Parsing error (ignoring chunk): {parse_err}")
                continue

    finally:
        # Optional: Verify thread finished cleanly if needed
        # await producer_future 
        pass

async def chat_completion(prompt, model=None, **options) -> AsyncGenerator[str, None]:
    messages = prompt if isinstance(prompt, list) else [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    # Ensure stream is True
    input_payload = {
        "messages": messages,
        "sampling_params": {
            "max_tokens": 2000
        },
        "stream": True,
        **options
    }
    
    # RunPod expects the actual model parameters nested under 'input'
    payload = {"input": input_payload}

    async for token in _stream_job(payload):
        yield token

async def text_completion(prompt: str, model=None, **options) -> AsyncGenerator[str, None]:
    input_payload = {
        "prompt": prompt,
        "stream": True,
        **options
    }
    payload = {"input": input_payload}
    
    async for token in _stream_job(payload):
        yield token

async def embedding(text: str, model=None, **options):
    # Embedding is usually fast enough to not need streaming, 
    # but we run in executor to prevent blocking the heartbeat.
    payload = {
        "input": {
            "input": text,
            "stream": False,
            **options
        }
    }
    loop = asyncio.get_running_loop()
    
    # Run synchronously in thread, await result
    job = await loop.run_in_executor(None, lambda: _endpoint.run(payload))
    
    # Wait for output (this is a synchronous method in the SDK)
    output = await loop.run_in_executor(None, lambda: job.output())
    
    yield output