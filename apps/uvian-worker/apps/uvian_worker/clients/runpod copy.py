import runpod
import asyncio
from typing import AsyncGenerator
from core.config import RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID

# Configuration
if RUNPOD_API_KEY:
    runpod.api_key = RUNPOD_API_KEY

_endpoint = runpod.Endpoint(RUNPOD_ENDPOINT_ID) if RUNPOD_ENDPOINT_ID else None
STOP_SIGNAL = object()

def _blocking_stream_producer(payload: dict, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
    """
    Runs in a background thread. Consumes the synchronous RunPod stream.
    """
    try:
        if not _endpoint:
            raise ValueError("RUNPOD_ENDPOINT_ID not set.")

        job = _endpoint.run(payload)
        for chunk in job.stream():
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
    loop.run_in_executor(None, _blocking_stream_producer, payload, queue, loop)

    while True:
        item = await queue.get()
        if item is STOP_SIGNAL:
            break
        if isinstance(item, Exception):
            raise item
        
        try:
            # Parsing Logic for RunPod vLLM/TGI
            data = item.get("output", item) if isinstance(item, dict) else item
            
            if isinstance(data, dict):
                choices = data.get("choices", [])
                if choices:
                    choice = choices[0]
                    # Streaming format
                    content = choice.get("tokens", [])
                    if content:
                        yield "".join(content)
                        continue
                    # Delta format
                    content = choice.get("delta", {}).get("content")
                    if content:
                        yield content
                        continue
                    # Text format
                    text = choice.get("text")
                    if text:
                        yield text
                        continue
            
            if "text" in data and isinstance(data["text"], str):
                 yield data["text"]
                 
        except Exception as parse_err:
            print(f"Parsing error (ignoring chunk): {parse_err}")
            continue

async def chat_completion(messages: list, model=None, **options) -> AsyncGenerator[str, None]:
    input_payload = {
        "messages": messages,
        "sampling_params": {
            "max_tokens": 2000
        },
        "stream": True,
        **options
    }
    # RunPod expects actual model parameters nested under 'input'
    payload = {"input": input_payload}

    async for token in _stream_job(payload):
        yield token
