from typing import Dict, Any, Optional
from clients.mcp import PersistentMCPClient
from core.logging import log
import asyncio

def create_cleanup_node(mcp_client: Optional[PersistentMCPClient] = None):
    async def cleanup_node(state: Dict[str, Any]) -> Dict[str, Any]:
        """Cleanup node - gracefully closes MCP connections at end of graph.
        
        Uses asyncio.get_running_loop() to ensure we close in the same event loop context.
        """
        if mcp_client:
            try:
                loop = asyncio.get_running_loop()
                try:
                    await asyncio.wait_for(mcp_client.close(), timeout=5.0)
                    log.info("cleanup_node_mcp_closed", node="cleanup_node")
                except asyncio.TimeoutError:
                    log.warning("cleanup_node_mcp_close_timeout", node="cleanup_node")
                except RuntimeError as e:
                    if "cancel scope" in str(e):
                        log.warning("cleanup_node_mcp_cancel_scope_skipped", error=str(e))
                    else:
                        raise
            except Exception as e:
                log.warning("cleanup_node_mcp_close_error", error=str(e), node="cleanup_node")
        
        return {}
    
    return cleanup_node