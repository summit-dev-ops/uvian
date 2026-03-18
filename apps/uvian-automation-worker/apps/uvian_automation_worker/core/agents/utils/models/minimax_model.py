from langchain_openai import ChatOpenAI
from core.config import MINIMAX_API_KEY

MODEL_NAME = "nemotron-3-super-free"

minimax_model = ChatOpenAI(
    model=MODEL_NAME,
    stream_usage=True,
    temperature=0.6,
    base_url="https://opencode.ai/zen/v1",
    api_key=MINIMAX_API_KEY,
)
