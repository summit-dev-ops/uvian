from langchain.tools import tool, ToolRuntime
from core.logging import worker_logger


@tool
def end_task(result: str = None) -> str:
    """Signal that the task is complete and provide final results.
    
    Call this tool when you have completed the assigned task. Pass your
    final result or summary as the 'result' parameter.
    
    Args:
        result: Optional final result or summary of work completed
    """
    worker_logger.info(f"[end_task] Called with result: {str(result)[:200]}...")
    return {"status": "completed", "result": result}
