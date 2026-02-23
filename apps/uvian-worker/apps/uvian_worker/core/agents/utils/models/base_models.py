from langchain_openai import ChatOpenAI
from core.config import RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID

MODEL_NAME="jiangchengchengNLP/llama3.3-70B-instruct-abliterated-awq"

base_assistant_model = ChatOpenAI(
    model=MODEL_NAME,
    stream_usage=True,
    temperature=0.1,
    base_url=f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/openai/v1",
    api_key=RUNPOD_API_KEY,
)