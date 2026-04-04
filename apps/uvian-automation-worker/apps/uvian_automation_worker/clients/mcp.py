from typing import List, Dict, Any, Optional
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain_core.tools import BaseTool
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
import time
import jwt as pyjwt


class MCPServer:
    def __init__(
        self,
        mcp_id: str,
        url: str,
        auth_method: str,
        auth_secret: str | None,
        jwt_secret: str | None = None,
        name: str | None = None,
    ):
        self._mcp_id = mcp_id
        self._url = url
        self._auth_method = auth_method
        self._auth_secret = auth_secret
        self._jwt_secret = jwt_secret
        self._tools: List[BaseTool] | None = None
        self._tool_metadata: List[Dict[str, Any]] | None = None
        self._name = name or mcp_id

    @property
    def mcp_id(self) -> str:
        return self._mcp_id

    @property
    def name(self) -> str:
        return self._name

    def _build_connection_config(self) -> dict:
        return {
            "transport": "streamable_http",
            "url": self._url,
            "headers": self._build_headers(),
        }

    async def get_tools(self) -> List[BaseTool]:
        """Load tools using a new session per call (stateless, legacy behavior)."""
        if self._tools is not None:
            return self._tools
        config = {"uvian-hub": self._build_connection_config()}
        client = MultiServerMCPClient(config)
        self._tools = await client.get_tools()
        return self._tools

    async def get_tools_from_session(self, session: ClientSession) -> List[BaseTool]:
        """Load tools from an existing persistent session.

        Tools created this way will reuse the same session for all invocations,
        enabling stateful MCP servers.
        """
        return await load_mcp_tools(session)

    async def get_tool_metadata(self) -> List[Dict[str, Any]]:
        """Fetch raw tool metadata from the MCP server without creating LangChain wrappers."""
        if self._tool_metadata is not None:
            return self._tool_metadata
        config = {"uvian-hub": self._build_connection_config()}
        client = MultiServerMCPClient(config)
        async with client.session("uvian-hub") as session:
            result = await session.list_tools()
            self._tool_metadata = [
                {
                    "name": tool.name,
                    "description": tool.description or "",
                    "inputSchema": tool.inputSchema,
                }
                for tool in result.tools
            ]
        return self._tool_metadata

    def get_tool_descriptions(self, tools: List[BaseTool] | None = None) -> List[Dict[str, str]]:
        if tools is None:
            tools = []
        return [
            {"name": tool.name, "description": tool.description or ""}
            for tool in tools
        ]

    def _build_headers(self) -> dict:
        if self._auth_method == "none" or not self._auth_secret:
            return {}
        if self._auth_method == "bearer":
            return {"Authorization": f"Bearer {self._auth_secret}"}
        if self._auth_method == "api_key":
            return {"X-API-Key": self._auth_secret}
        if self._auth_method == "jwt":
            if not self._jwt_secret:
                return {}
            payload = {"sub": "agent", "exp": int(time.time()) + 3600}
            token = pyjwt.encode(payload, self._jwt_secret, algorithm="HS256")
            return {"Authorization": f"Bearer {token}"}
        return {}


class PersistentMCPClient:
    """Manages long-lived MCP sessions for stateful tool execution.

    Unlike the default behavior where a new session is created per tool call,
    this keeps sessions alive for the entire agent run, enabling stateful MCPs
    (conversation context, auth sessions, subscriptions).
    """

    def __init__(self):
        self._sessions: Dict[str, ClientSession] = {}
        self._generators: Dict[str, Any] = {}

    async def connect(self, mcp_id: str, server: MCPServer) -> ClientSession:
        """Open a persistent connection to an MCP server and return the session."""
        if mcp_id in self._sessions:
            return self._sessions[mcp_id]

        headers = server._build_headers()
        gen = streamablehttp_client(
            url=server._url,
            headers=headers,
        )
        read_stream, write_stream, get_session_id = await gen.__aenter__()

        session = ClientSession(read_stream, write_stream)
        await session.initialize()

        self._sessions[mcp_id] = session
        self._generators[mcp_id] = gen
        return session

    async def load_tools(self, mcp_id: str, server: MCPServer) -> List[BaseTool]:
        """Load tools from a persistent session, creating the connection if needed."""
        session = await self.connect(mcp_id, server)
        return await server.get_tools_from_session(session)

    async def get_tool_metadata(self, mcp_id: str, server: MCPServer) -> List[Dict[str, Any]]:
        """Fetch tool metadata using the persistent session."""
        session = await self.connect(mcp_id, server)
        result = await session.list_tools()
        return [
            {
                "name": tool.name,
                "description": tool.description or "",
                "inputSchema": tool.inputSchema,
            }
            for tool in result.tools
        ]

    async def close(self):
        """Close all persistent sessions and clean up transport generators."""
        for mcp_id, gen in self._generators.items():
            try:
                await gen.__aexit__(None, None, None)
            except Exception:
                pass

        self._sessions.clear()
        self._generators.clear()


class MCPRegistry:
    """Manages MCP server connections with lazy per-MCP tool loading."""

    def __init__(self, persistent_client: Optional[PersistentMCPClient] = None):
        self._servers: Dict[str, MCPServer] = {}
        self._tool_cache: Dict[str, List[BaseTool]] = {}
        self._metadata_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._persistent_client = persistent_client

    def register_server(self, server: MCPServer) -> None:
        self._servers[server.mcp_id] = server

    async def ensure_tools_loaded(self, mcp_id: str) -> List[BaseTool]:
        if mcp_id in self._tool_cache:
            return self._tool_cache[mcp_id]
        server = self._servers.get(mcp_id)
        if not server:
            return []
        if self._persistent_client:
            tools = await self._persistent_client.load_tools(mcp_id, server)
        else:
            tools = await server.get_tools()
        self._tool_cache[mcp_id] = tools
        return tools

    async def get_tools_for_mcp(self, mcp_id: str) -> List[BaseTool]:
        return await self.ensure_tools_loaded(mcp_id)

    async def ensure_metadata_loaded(self, mcp_id: str) -> List[Dict[str, Any]]:
        if mcp_id in self._metadata_cache:
            return self._metadata_cache[mcp_id]
        server = self._servers.get(mcp_id)
        if not server:
            return []
        if self._persistent_client:
            metadata = await self._persistent_client.get_tool_metadata(mcp_id, server)
        else:
            metadata = await server.get_tool_metadata()
        self._metadata_cache[mcp_id] = metadata
        return metadata

    async def get_tool_metadata_for_mcp(self, mcp_id: str) -> List[Dict[str, Any]]:
        return await self.ensure_metadata_loaded(mcp_id)

    async def list_all_mcps(self) -> List[Dict[str, Any]]:
        result = []
        for mcp_id, server in self._servers.items():
            metadata = self._metadata_cache.get(mcp_id, [])
            result.append({
                "id": mcp_id,
                "name": server.name,
                "tools": server.get_tool_descriptions(self._tool_cache.get(mcp_id, [])),
                "tool_metadata": metadata,
            })
        return result

    def get_condensed_catalog(self) -> List[Dict[str, Any]]:
        result = []
        for mcp_id, server in self._servers.items():
            metadata = self._metadata_cache.get(mcp_id, [])
            tool_names = [t["name"] for t in metadata]
            result.append({
                "id": mcp_id,
                "name": server.name,
                "tool_count": len(metadata),
                "tool_names": tool_names,
                "description": f"{server.name} MCP server",
            })
        return result

    def get_rich_catalog(self) -> List[Dict[str, Any]]:
        """Get catalog with tool names, descriptions, and usage guidance."""
        from core.agents.utils.mcp_catalog import get_usage_guidance
        result = []
        for mcp_id, server in self._servers.items():
            metadata = self._metadata_cache.get(mcp_id, [])
            tool_descriptions = [
                f"{t['name']}: {t['description']}" if t.get('description') else t['name']
                for t in metadata
            ]
            usage = get_usage_guidance(server.name)
            result.append({
                "id": mcp_id,
                "name": server.name,
                "tool_count": len(metadata),
                "tool_descriptions": tool_descriptions,
                "usage_guidance": usage,
            })
        return result

    async def close(self):
        """Close all persistent sessions."""
        if self._persistent_client:
            await self._persistent_client.close()


async def create_mcp_registry(mcp_configs: list) -> List[BaseTool]:
    """Legacy function: loads ALL tools from ALL MCP configs.

    Kept for backward compatibility. Prefer using MCPRegistry directly.
    """
    tools = []
    for cfg in mcp_configs:
        if not cfg.get("url"):
            continue
        server = MCPServer(
            mcp_id=cfg["id"],
            url=cfg["url"],
            auth_method=cfg.get("auth_method", "bearer"),
            auth_secret=cfg.get("_auth_secret"),
            jwt_secret=cfg.get("_jwt_secret"),
            name=cfg.get("name"),
        )
        tools.extend(await server.get_tools())
    return tools


async def build_mcp_registry(mcp_configs: list, persistent_client: Optional[PersistentMCPClient] = None) -> MCPRegistry:
    """Build an MCPRegistry from a list of MCP configs.

    Registers all servers but does NOT load tools eagerly.
    If a persistent_client is provided, tools will be loaded from persistent sessions.
    """
    registry = MCPRegistry(persistent_client=persistent_client)
    for cfg in mcp_configs:
        if not cfg.get("url"):
            continue
        server = MCPServer(
            mcp_id=cfg["id"],
            url=cfg["url"],
            auth_method=cfg.get("auth_method", "bearer"),
            auth_secret=cfg.get("_auth_secret"),
            jwt_secret=cfg.get("_jwt_secret"),
            name=cfg.get("name"),
        )
        registry.register_server(server)
    return registry
