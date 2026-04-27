from typing import List, Dict, Any, Optional, TYPE_CHECKING
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain_mcp_adapters.sessions import create_session
from langchain_core.tools import BaseTool
from mcp import ClientSession
import time
import jwt as pyjwt
import asyncio
from contextlib import AsyncExitStack
from core.logging import log

if TYPE_CHECKING:
    from mcp.types import ListToolsResult


def _build_headers(auth_method: str, auth_secret: str | None, jwt_secret: str | None = None) -> dict:
    if auth_method == "none" or not auth_secret:
        return {}
    if auth_method == "bearer":
        return {"Authorization": f"Bearer {auth_secret}"}
    if auth_method == "api_key":
        return {"X-API-Key": auth_secret}
    if auth_method == "jwt":
        if not jwt_secret:
            return {}
        payload = {"sub": "agent", "exp": int(time.time()) + 3600}
        token = pyjwt.encode(payload, jwt_secret, algorithm="HS256")
        return {"Authorization": f"Bearer {token}"}
    return {}


def _build_connection_config(url: str, auth_method: str, auth_secret: str | None, jwt_secret: str | None = None) -> dict:
    return {
        "transport": "streamable_http",
        "url": url,
        "headers": _build_headers(auth_method, auth_secret, jwt_secret),
    }


class ManagedMCPConnection:
    """Single MCP connection running in its own dedicated task.
    
    This prevents cross-task cancel scope errors by ensuring that
    AsyncExitStack is created and exited in the same task.
    """

    def __init__(self, mcp_id: str, config: dict):
        self.mcp_id = mcp_id
        self.config = config
        self._session: ClientSession | None = None
        self._task: asyncio.Task | None = None
        self._ready_event = asyncio.Event()
        self._stop_event = asyncio.Event()
        self._error: Exception | None = None
        self._lock = asyncio.Lock()

    async def connect(self, timeout: float = 15.0) -> ClientSession:
        """Start connection in dedicated task and wait for ready.
        
        Args:
            timeout: Seconds to wait for connection to be ready
            
        Returns:
            ClientSession connected to MCP server
            
        Raises:
            asyncio.TimeoutError: If connection doesn't ready within timeout
            Exception: If connection fails
        """
        if self._session is not None:
            return self._session

        async with self._lock:
            # Double-check after acquiring lock
            if self._session is not None:
                return self._session
                
            if self._task is not None and not self._task.done():
                # Wait for existing task to be ready
                await asyncio.wait_for(self._ready_event.wait(), timeout=timeout)
                if self._error:
                    raise self._error
                return self._session

            # Start new connection task
            self._ready_event = asyncio.Event()
            self._stop_event = asyncio.Event()
            self._error = None
            
            self._task = asyncio.create_task(self._run_connection())
            
            try:
                await asyncio.wait_for(self._ready_event.wait(), timeout=timeout)
            except asyncio.TimeoutError:
                await self._force_close()
                raise

            if self._error:
                raise self._error

            return self._session

    async def _run_connection(self):
        """Main connection loop - runs in its own task with its own AsyncExitStack."""
        exit_stack = AsyncExitStack()
        try:
            # Create session in the same task
            gen = create_session(self.config)
            if hasattr(gen, '__aenter__'):
                # It's an async context manager
                read, write = await gen.__aenter__()
            else:
                # It's an async generator
                read, write, _ = await gen.__anext__()

            self._session = await exit_stack.enter_async_context(
                ClientSession(read, write)
            )
            
            # Signal that we're ready
            self._ready_event.set()

            # Wait for stop signal in the same task
            try:
                await self._stop_event.wait()
            except asyncio.CancelledError:
                log.debug("mcp_connection_task_cancelled", mcp_id=self.mcp_id)

        except Exception as e:
            log.error("mcp_connection_error", mcp_id=self.mcp_id, error=str(e))
            self._error = e
            self._ready_event.set()
        finally:
            # Clean up in the SAME task - this is the key!
            await exit_stack.aclose()
            self._session = None

    async def _force_close(self):
        """Force close even if task is stuck."""
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._session = None

    async def close(self, timeout: float = 5.0):
        """Signal stop and wait for task to complete."""
        if self._task is None:
            return

        self._stop_event.set()

        if not self._task.done():
            try:
                await asyncio.wait_for(self._task, timeout=timeout)
            except asyncio.TimeoutError:
                log.warning("mcp_connection_close_timeout", mcp_id=self.mcp_id)
                await self._force_close()
            except asyncio.CancelledError:
                await self._force_close()

        self._task = None
        self._session = None

    async def get_session(self) -> ClientSession:
        """Get current session.
        
        Raises:
            RuntimeError: If not connected
        """
        if self._session is None:
            raise RuntimeError(f"MCP connection '{self.mcp_id}' is not connected")
        return self._session

    async def is_connected(self) -> bool:
        """Check if connection is active."""
        return self._session is not None and (self._task is None or not self._task.done())


class PersistentMCPClient:
    """Manages persistent connections to multiple MCP servers.

    Opens long-lived sessions that persist across tool invocations, enabling
    stateful MCP servers (conversation context, auth sessions, subscriptions).
    
    Uses task isolation per connection to prevent cross-task cancel scope errors
    when LangGraph resumes from checkpoints or cleanup runs in different tasks.
    """

    def __init__(self):
        self._connections: Dict[str, dict] = {}
        self._names: Dict[str, str] = {}
        self._name_to_id: Dict[str, str] = {}
        self._managed: Dict[str, ManagedMCPConnection] = {}
        self._tool_cache: Dict[str, List[BaseTool]] = {}
        self._metadata_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._usage_guidance: Dict[str, str] = {}
        self._lock = asyncio.Lock()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    def register_all(self, mcp_configs: list):
        """Register all MCP server configurations without connecting.

        Allows all MCPs to be known to the client for dynamic loading later,
        while only connecting the subset needed for the current run.

        Args:
            mcp_configs: List of MCP configuration dicts with keys like:
                id, url, auth_method, auth_secret, jwt_secret, name, usage_guidance
        """
        for cfg in mcp_configs:
            if not cfg.get("url"):
                continue
            self.add_server(
                mcp_id=cfg.get("id", ""),
                url=cfg["url"],
                auth_method=cfg.get("auth_method", "bearer"),
                auth_secret=cfg.get("auth_secret"),
                jwt_secret=cfg.get("jwt_secret"),
                name=cfg.get("name"),
                usage_guidance=cfg.get("usage_guidance"),
            )

    async def connect_and_load(self, mcp_ids_or_names: list[str]):
        """Connect to specific MCP servers and fetch their metadata.

        Accepts MCP IDs or friendly names. Only connects the requested subset,
        enabling lazy loading of MCPs not needed at initialization.

        Args:
            mcp_ids_or_names: List of MCP IDs or friendly names to connect
        """
        for mcp_id_or_name in mcp_ids_or_names:
            try:
                async with asyncio.timeout(15):
                    await self.connect(mcp_id_or_name)
            except asyncio.TimeoutError:
                log.warning("mcp_connection_timeout", mcp_id=mcp_id_or_name)
            except asyncio.CancelledError:
                log.warning("mcp_connection_cancelled", mcp_id=mcp_id_or_name)
                raise
            except Exception as e:
                log.warning("mcp_connect_failed", mcp_id=mcp_id_or_name, error=str(e))

        await self.fetch_all_metadata()

    def add_server(self, mcp_id: str, url: str, auth_method: str, auth_secret: str | None, jwt_secret: str | None = None, name: str | None = None, usage_guidance: str | None = None):
        """Register an MCP server configuration. Does NOT connect yet."""
        self._connections[mcp_id] = _build_connection_config(url, auth_method, auth_secret, jwt_secret)
        self._names[mcp_id] = name or mcp_id
        if name:
            self._name_to_id[name] = mcp_id
        if usage_guidance:
            self._usage_guidance[mcp_id] = usage_guidance

    def _resolve_mcp_id(self, mcp_id_or_name: str) -> str:
        """Resolve a name or ID to the actual MCP ID."""
        if mcp_id_or_name in self._connections:
            return mcp_id_or_name
        if mcp_id_or_name in self._name_to_id:
            return self._name_to_id[mcp_id_or_name]
        return mcp_id_or_name

    async def connect(self, mcp_id: str) -> ClientSession:
        """Dynamically open a persistent connection to a single registered server.
        
        Accepts either the server's UUID (mcp_id) or its friendly name."""
        resolved_id = self._resolve_mcp_id(mcp_id)
        
        if resolved_id not in self._connections:
            raise ValueError(f"MCP server '{mcp_id}' is not registered.")

        # Get or create managed connection
        if resolved_id not in self._managed:
            config = self._connections[resolved_id]
            self._managed[resolved_id] = ManagedMCPConnection(resolved_id, config)

        connection = self._managed[resolved_id]
        return await connection.connect()

    async def connect_all(self):
        """Connect to all servers sequentially."""
        for mcp_id in self._connections:
            try:
                async with asyncio.timeout(15):
                    await self.connect(mcp_id)
            except asyncio.TimeoutError:
                log.warning("mcp_connection_timeout", mcp_id=mcp_id)
            except asyncio.CancelledError:
                log.warning("mcp_connection_cancelled", mcp_id=mcp_id)
                raise
            except Exception as e:
                log.warning("mcp_connect_failed", mcp_id=mcp_id, error=str(e))

    async def load_tools_for_mcp(self, mcp_id: str) -> List[BaseTool]:
        """Load tools from a specific server. Will lazily connect if not already connected.
        
        Idempotent - returns cached tools if already loaded."""
        resolved_id = self._resolve_mcp_id(mcp_id)
        
        if resolved_id in self._tool_cache:
            return self._tool_cache[resolved_id]

        session = await self.connect(resolved_id)

        tools = await load_mcp_tools(session)
        self._tool_cache[resolved_id] = tools
        return tools

    async def load_tools(self, mcp_id: str) -> List[BaseTool]:
        return await self.load_tools_for_mcp(mcp_id)

    async def get_tool_metadata(self, mcp_id: str) -> List[Dict[str, Any]]:
        """Fetch tool metadata from a specific server. Lazily connects if needed."""
        resolved_id = self._resolve_mcp_id(mcp_id)
        
        if resolved_id in self._metadata_cache:
            return self._metadata_cache[resolved_id]

        # Get tools (which triggers connect + load if needed)
        tools = await self.load_tools_for_mcp(resolved_id)
        
        metadata = [
            {
                "name": tool.name,
                "description": tool.description or "",
                "inputSchema": tool.inputSchema,
            }
            for tool in tools
        ]
        self._metadata_cache[resolved_id] = metadata
        return metadata

    async def fetch_all_metadata(self):
        """Fetch metadata sequentially."""
        for mcp_id in self._connections:
            try:
                async with asyncio.timeout(10):
                    await self.get_tool_metadata(mcp_id)
            except asyncio.TimeoutError:
                log.warning("mcp_metadata_timeout", mcp_id=mcp_id)
            except asyncio.CancelledError:
                log.warning("mcp_metadata_cancelled", mcp_id=mcp_id)
                raise
            except Exception as e:
                log.warning("mcp_fetch_metadata_failed", mcp_id=mcp_id, error=str(e))

    def get_rich_catalog(self) -> List[Dict[str, Any]]:
        """Get catalog of all servers with tool info and usage guidance."""
        result = []
        for mcp_id in self._connections:
            metadata = self._metadata_cache.get(mcp_id, [])
            tool_descriptions = [
                f"{t['name']}: {t['description']}" if t.get('description') else t['name']
                for t in metadata
            ]
            usage = self._usage_guidance.get(mcp_id, "")
            result.append({
                "id": mcp_id,
                "name": self._names.get(mcp_id, mcp_id),
                "tool_count": len(metadata),
                "tool_descriptions": tool_descriptions,
                "usage_guidance": usage,
            })
        return result

    def get_loaded_tools(self) -> Dict[str, List[BaseTool]]:
        """Return all tools that have been loaded into the cache.
        
        Returns a dict mapping mcp_id to list of tools for each server."""
        return dict(self._tool_cache)

    async def get_all_tools(self) -> Dict[str, List[BaseTool]]:
        return await self.get_loaded_tools()

    async def get_tools_for_mcp(self, mcp_id: str) -> List[BaseTool]:
        return await self.load_tools_for_mcp(mcp_id)

    async def get_all_metadata(self) -> Dict[str, List[Dict[str, Any]]]:
        """Fetch and return metadata from all MCPs."""
        result = {}
        for mcp_id in self._connections:
            try:
                metadata = await self.get_tool_metadata(mcp_id)
                result[mcp_id] = metadata
            except Exception as e:
                log.warning("mcp_get_metadata_failed", mcp_id=mcp_id, error=str(e))
                result[mcp_id] = []
        return result

    async def get_tools_by_name(self, mcp_name: str) -> List[BaseTool]:
        """Load tools from an MCP server by its friendly name."""
        if mcp_name in self._name_to_id:
            mcp_id = self._name_to_id[mcp_name]
        elif mcp_name in self._connections:
            mcp_id = mcp_name
        else:
            raise ValueError(f"MCP server '{mcp_name}' is not registered.")
        return await self.load_tools(mcp_id)

    async def get_metadata_by_name(self, mcp_name: str) -> List[Dict[str, Any]]:
        """Fetch metadata from an MCP server by its friendly name."""
        if mcp_name in self._name_to_id:
            mcp_id = self._name_to_id[mcp_name]
        elif mcp_name in self._connections:
            mcp_id = mcp_name
        else:
            raise ValueError(f"MCP server '{mcp_name}' is not registered.")
        return await self.get_tool_metadata(mcp_id)

    async def close(self):
        """Safely close all persistent connections and tasks."""
        close_tasks = []
        
        for mcp_id, connection in self._managed.items():
            close_tasks.append(asyncio.create_task(connection.close()))
        
        if close_tasks:
            # Wait for all connections to close
            done, pending = await asyncio.wait(close_tasks, timeout=10.0)
            
            # Force close any that timed out
            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        self._managed.clear()
        self._tool_cache.clear()
        self._metadata_cache.clear()


async def create_mcp_registry(mcp_configs: list) -> List[BaseTool]:
    """Legacy function: loads ALL tools from ALL MCP configs.

    Kept for backward compatibility. Prefer using PersistentMCPClient directly.
    """
    tools = []
    for cfg in mcp_configs:
        if not cfg.get("url"):
            continue
        config = _build_connection_config(
            cfg["url"],
            cfg.get("auth_method", "bearer"),
            cfg.get("auth_secret"),
            cfg.get("jwt_secret"),
        )
        client = MultiServerMCPClient({"uvian-hub": config})
        tools.extend(await client.get_tools())
    return tools