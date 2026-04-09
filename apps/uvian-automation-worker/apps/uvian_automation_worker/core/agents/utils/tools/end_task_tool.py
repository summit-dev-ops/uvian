from langchain.tools import tool


@tool
def end_task(result: str = None) -> str:
    """Signal that the task is complete and provide final results.
    
    Call this tool when you have completed the assigned task. Pass your
    final result or summary as the 'result' parameter.
    
    Args:
        result: Optional final result or summary of work completed
    """
    return {"status": "completed", "result": result}
