from typing import List, Dict, Any
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.tools import BaseTool
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
        self._name = name or mcp_id

    @property
    def mcp_id(self) -> str:
        return self._mcp_id

    @property
    def name(self) -> str:
        return self._name

    async def get_tools(self) -> List[BaseTool]:
        if self._tools is not None:
            return self._tools
        config = {
            "uvian-hub": {
                "transport": "http",
                "url": self._url,
                "headers": self._build_headers(),
            }
        }
        client = MultiServerMCPClient(config)
        self._tools = await client.get_tools()
        return self._tools

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


class MCPRegistry:
    """Manages MCP server connections with lazy per-MCP tool loading."""

    def __init__(self):
        self._servers: Dict[str, MCPServer] = {}
        self._tool_cache: Dict[str, List[BaseTool]] = {}

    def register_server(self, server: MCPServer) -> None:
        self._servers[server.mcp_id] = server

    async def ensure_tools_loaded(self, mcp_id: str) -> List[BaseTool]:
        if mcp_id in self._tool_cache:
            return self._tool_cache[mcp_id]
        server = self._servers.get(mcp_id)
        if not server:
            return []
        tools = await server.get_tools()
        self._tool_cache[mcp_id] = tools
        return tools

    async def get_tools_for_mcp(self, mcp_id: str) -> List[BaseTool]:
        return await self.ensure_tools_loaded(mcp_id)

    async def list_all_mcps(self) -> List[Dict[str, Any]]:
        result = []
        for mcp_id, server in self._servers.items():
            tools = self._tool_cache.get(mcp_id, [])
            result.append({
                "id": mcp_id,
                "name": server.name,
                "tools": server.get_tool_descriptions(tools),
            })
        return result

    def get_condensed_catalog(self) -> List[Dict[str, Any]]:
        result = []
        for mcp_id, server in self._servers.items():
            tools = self._tool_cache.get(mcp_id, [])
            tool_count = len(tools)
            result.append({
                "id": mcp_id,
                "name": server.name,
                "tool_count": tool_count,
                "description": f"{server.name} MCP server",
            })
        return result


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


async def build_mcp_registry(mcp_configs: list) -> MCPRegistry:
    """Build an MCPRegistry from a list of MCP configs.

    Registers all servers but does NOT load tools eagerly.
    """
    registry = MCPRegistry()
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
