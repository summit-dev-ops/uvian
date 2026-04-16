from typing import Dict, Any, Optional
from clients.mcp import MCPRegistry
from core.logging import log

def create_cleanup_node(mcp_registry: Optional[MCPRegistry] = None):
    async def cleanup_node(state: Dict[str, Any]) -> Dict[str, Any]:
        """Cleanup node - gracefully closes MCP connections at end of graph.
        
        Runs inside LangGraph's task context to avoid cross-task cancel scope error.
        """
        if mcp_registry:
            try:
                await mcp_registry.close()
                log.info("cleanup_node_mcp_closed", node="cleanup_node")
            except RuntimeError as e:
                if "cancel scope" in str(e):
                    log.warning("cleanup_node_mcp_cancel_scope_skipped", error=str(e))
                else:
                    raise
        
        return {}
    
    return cleanup_node