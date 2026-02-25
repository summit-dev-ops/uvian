from langchain_openai import ChatOpenAI
from core.config import RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID

MODEL_NAME="NousResearch/Hermes-4-70B-FP8"

base_assistant_model = ChatOpenAI(
    model=MODEL_NAME,
    stream_usage=True,
    temperature=0.6,
    base_url=f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/openai/v1",
    api_key=RUNPOD_API_KEY,
)