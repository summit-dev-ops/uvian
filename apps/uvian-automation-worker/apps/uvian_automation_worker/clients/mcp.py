from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.tools import BaseTool
from core.config import UVIAN_MCP_LIST, UVIAN_MCP_URL
from clients.auth import get_agent_api_key, exchange_for_jwt


class MCPServer(ABC):
    """Base class for MCP server implementations."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """MCP server identifier."""
        pass
    
    @property
    def requires_auth(self) -> bool:
        return True
    
    @abstractmethod
    async def initialize(self, auth_context: dict) -> dict:
        """Initialize MCP with auth context.
        
        Returns:
            dict: Auth tokens/credentials to use for this MCP
        """
        pass
    
    @abstractmethod
    async def create_instance(self, auth_tokens: dict) -> List[BaseTool]:
        """Create MCP client with auth tokens."""
        pass


class IntegratedMCPServer(MCPServer):
    """Integrated MCP server (e.g., uvian-hub)."""
    
    def __init__(self, url: str):
        self._url = url
    
    @property
    def name(self) -> str:
        return "integrated"
    
    async def initialize(self, auth_context: dict) -> dict:
        agent_user_id = auth_context.get("agent_user_id")
        if not agent_user_id:
            raise ValueError("agent_user_id required in auth_context")
        
        api_key = await get_agent_api_key(agent_user_id)
        jwt_token = await exchange_for_jwt(api_key)
        
        return {"jwt": jwt_token}
    
    async def create_instance(self, auth_tokens: dict) -> List[BaseTool]:
        jwt = auth_tokens.get("jwt")
        if not jwt:
            raise ValueError("JWT token required")
        
        client = MCPClient(jwt_token=jwt, url=self._url)
        return await client.get_tools()


class ExternalMCPServer(MCPServer):
    """External MCP server (for future use)."""
    
    def __init__(self, url: str, auth_type: str):
        self._url = url
        self._auth_type = auth_type
    
    @property
    def name(self) -> str:
        return "external"
    
    async def initialize(self, auth_context: dict) -> dict:
        raise NotImplementedError("External MCP not yet supported")
    
    async def create_instance(self, auth_tokens: dict) -> List[BaseTool]:
        raise NotImplementedError("External MCP not yet supported")


class MCPClient:
    """Internal MCP client wrapper."""
    
    def __init__(self, jwt_token: str, url: str):
        self.jwt_token = jwt_token
        self.url = url
        self._tools: Optional[List[BaseTool]] = None
        self._client: Optional[MultiServerMCPClient] = None
    
    def _get_mcp_config(self) -> dict:
        return {
            "uvian-hub": {
                "transport": "http",
                "url": self.url,
                "headers": {
                    "Authorization": f"Bearer {self.jwt_token}"
                }
            }
        }
    
    async def get_tools(self) -> List[BaseTool]:
        if self._tools is not None:
            return self._tools
        
        config = self._get_mcp_config()
        self._client = MultiServerMCPClient(config)
        self._tools = await self._client.get_tools()
        
        return self._tools


class MCPServerRegistry:
    """Registry for MCP server implementations."""
    
    def __init__(self):
        self._servers: Dict[str, MCPServer] = {}
    
    def register(self, mcp_name: str, server: MCPServer):
        self._servers[mcp_name] = server
    
    async def get_tools(self, mcp_names: List[str], auth_context: dict) -> List[BaseTool]:
        all_tools = []
        
        for name in mcp_names:
            if name not in self._servers:
                raise ValueError(f"Unknown MCP: {name}")
            
            server = self._servers[name]
            
            auth_tokens = await server.initialize(auth_context)
            tools = await server.create_instance(auth_tokens)
            all_tools.extend(tools)
        
        return all_tools


def create_mcp_registry() -> MCPServerRegistry:
    """Create and initialize MCP registry based on config."""
    registry = MCPServerRegistry()
    
    mcp_list = UVIAN_MCP_LIST.split(",")
    
    for mcp_name in mcp_list:
        mcp_name = mcp_name.strip()
        if mcp_name == "uvian-hub-mcp":
            registry.register(mcp_name, IntegratedMCPServer(UVIAN_MCP_URL))
        else:
            raise ValueError(f"Unsupported MCP: {mcp_name}")
    
    return registry
