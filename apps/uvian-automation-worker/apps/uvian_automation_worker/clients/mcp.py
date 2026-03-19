from typing import List
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
    ):
        self._mcp_id = mcp_id
        self._url = url
        self._auth_method = auth_method
        self._auth_secret = auth_secret
        self._jwt_secret = jwt_secret
        self._tools: List[BaseTool] | None = None

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


async def create_mcp_registry(mcp_configs: list) -> List[BaseTool]:
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
        )
        tools.extend(await server.get_tools())
    return tools
