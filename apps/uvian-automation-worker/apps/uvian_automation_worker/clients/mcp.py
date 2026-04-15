from typing import List, Dict, Any, Optional
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


class PersistentMCPClient:
    """Manages persistent connections to multiple MCP servers.

    Opens long-lived sessions that persist across tool invocations, enabling
    stateful MCP servers (conversation context, auth sessions, subscriptions).
    Safely manages background async tasks using AsyncExitStack.
    """

    def __init__(self):
        self._connections: Dict[str, dict] = {}
        self._names: Dict[str, str] = {}
        self._name_to_id: Dict[str, str] = {}
        self._sessions: Dict[str, ClientSession] = {}
        self._tool_cache: Dict[str, List[BaseTool]] = {}
        self._metadata_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._usage_guidance: Dict[str, str] = {}
        self.exit_stack = AsyncExitStack()

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
                id, url, auth_method, _auth_secret, _jwt_secret, name, usage_guidance
        """
        for cfg in mcp_configs:
            if not cfg.get("url"):
                continue
            self.add_server(
                mcp_id=cfg.get("id", ""),
                url=cfg["url"],
                auth_method=cfg.get("auth_method", "bearer"),
                auth_secret=cfg.get("_auth_secret"),
                jwt_secret=cfg.get("_jwt_secret"),
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
                await asyncio.wait_for(self.connect(mcp_id_or_name), timeout=15)
            except asyncio.TimeoutError:
                log.warning("mcp_connection_timeout", mcp_id=mcp_id_or_name)
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

    async def connect(self, mcp_id: str) -> ClientSession:
        """Dynamically open a persistent connection to a single registered server.
        
        Accepts either the server's UUID (mcp_id) or its friendly name."""
        resolved_id = mcp_id
        if mcp_id not in self._connections and mcp_id in self._name_to_id:
            resolved_id = self._name_to_id[mcp_id]
        
        if resolved_id in self._sessions:
            return self._sessions[resolved_id]

        if resolved_id not in self._connections:
            raise ValueError(f"MCP server '{mcp_id}' is not registered.")

        connection = self._connections[resolved_id]
        gen = create_session(connection)
        session = await self.exit_stack.enter_async_context(gen)

        self._sessions[resolved_id] = session
        return session

    async def connect_all(self):
        """Connect to all servers sequentially. Must be sequential because
        AsyncExitStack requires enter_async_context() and aclose() to run
        in the same task context."""
        for mcp_id in self._connections:
            try:
                await asyncio.wait_for(self.connect(mcp_id), timeout=15)
            except asyncio.TimeoutError:
                log.warning("mcp_connection_timeout", mcp_id=mcp_id)
            except Exception as e:
                log.warning("mcp_connect_failed", mcp_id=mcp_id, error=str(e))

    async def load_tools(self, mcp_id: str) -> List[BaseTool]:
        """Load tools from a specific server. Will lazily connect if not already connected."""
        resolved_id = mcp_id
        if mcp_id not in self._connections and mcp_id in self._name_to_id:
            resolved_id = self._name_to_id[mcp_id]
        
        if resolved_id in self._tool_cache:
            return self._tool_cache[resolved_id]

        session = await self.connect(resolved_id)

        tools = await load_mcp_tools(session)
        self._tool_cache[resolved_id] = tools
        return tools

    async def get_tool_metadata(self, mcp_id: str) -> List[Dict[str, Any]]:
        """Fetch tool metadata from a specific server. Lazily connects if needed."""
        resolved_id = mcp_id
        if mcp_id not in self._connections and mcp_id in self._name_to_id:
            resolved_id = self._name_to_id[mcp_id]
        
        if resolved_id in self._metadata_cache:
            return self._metadata_cache[resolved_id]

        session = await self.connect(resolved_id)

        result = await session.list_tools()
        metadata = [
            {
                "name": tool.name,
                "description": tool.description or "",
                "inputSchema": tool.inputSchema,
            }
            for tool in result.tools
        ]
        self._metadata_cache[resolved_id] = metadata
        return metadata

    async def fetch_all_metadata(self):
        """Fetch metadata sequentially. Must be sequential because
        AsyncExitStack requires all session operations in the same task."""
        for mcp_id in self._connections:
            try:
                await asyncio.wait_for(self.get_tool_metadata(mcp_id), timeout=10)
            except asyncio.TimeoutError:
                log.warning("mcp_metadata_timeout", mcp_id=mcp_id)
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

    async def get_all_tools(self) -> Dict[str, List[BaseTool]]:
        """Load and return tools from all loaded MCPs.
        
        Returns a dict mapping mcp_id to list of tools for each server."""
        return dict(self._tool_cache)

    async def get_all_metadata(self) -> Dict[str, List[Dict[str, Any]]]:
        """Fetch and return metadata from all MCPs.
        
        Returns a dict mapping mcp_id to list of tool metadata for each server."""
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
        """Load tools from an MCP server by its friendly name.
        
        Convenience method that resolves a friendly name to mcp_id."""
        if mcp_name in self._name_to_id:
            mcp_id = self._name_to_id[mcp_name]
        elif mcp_name in self._connections:
            mcp_id = mcp_name
        else:
            raise ValueError(f"MCP server '{mcp_name}' is not registered.")
        return await self.load_tools(mcp_id)

    async def get_metadata_by_name(self, mcp_name: str) -> List[Dict[str, Any]]:
        """Fetch metadata from an MCP server by its friendly name.
        
        Convenience method that resolves a friendly name to mcp_id."""
        if mcp_name in self._name_to_id:
            mcp_id = self._name_to_id[mcp_name]
        elif mcp_name in self._connections:
            mcp_id = mcp_name
        else:
            raise ValueError(f"MCP server '{mcp_name}' is not registered.")
        return await self.get_tool_metadata(mcp_id)

    async def close(self):
        """Safely close all persistent sessions and anyio background tasks."""
        await self.exit_stack.aclose()
        self._sessions.clear()
        self._tool_cache.clear()
        self._metadata_cache.clear()


class MCPRegistry:
    """Thin wrapper around PersistentMCPClient for agent framework compatibility."""

    def __init__(self, client: Optional[PersistentMCPClient] = None):
        self._client = client

    async def get_tools_for_mcp(self, mcp_id: str) -> List[BaseTool]:
        if not self._client:
            return []
        return await self._client.load_tools(mcp_id)

    async def get_all_tools(self) -> Dict[str, List[BaseTool]]:
        if not self._client:
            return {}
        return await self._client.get_all_tools()
    
    async def close(self):
        if self._client:
            await self._client.close()


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
            cfg.get("_auth_secret"),
            cfg.get("_jwt_secret"),
        )
        client = MultiServerMCPClient({"uvian-hub": config})
        tools.extend(await client.get_tools())
    return tools


async def build_mcp_registry(mcp_configs: list, persistent_client: Optional[PersistentMCPClient] = None) -> MCPRegistry:
    """Build an MCPRegistry from a list of MCP configs."""
    return MCPRegistry(client=persistent_client)
