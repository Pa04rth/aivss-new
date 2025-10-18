"""
Abstract base class for all automation platforms
Supports n8n, Zapier, Make.com and future platforms
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BasePlatform(ABC):
    """Abstract base class for all automation platforms"""
    
    def __init__(self, credentials: Dict[str, Any], instance_url: str = None):
        """
        Initialize platform client
        
        Args:
            credentials: OAuth credentials (access_token, refresh_token, etc.)
            instance_url: Platform instance URL (for self-hosted instances)
        """
        self.credentials = credentials
        self.instance_url = instance_url
        self.platform_name = self.get_platform_name()
        self.api_base_url = self.get_api_base_url()
        
        logger.info(f"Initialized {self.platform_name} client")
    
    @abstractmethod
    def get_platform_name(self) -> str:
        """Return platform name (n8n, zapier, make)"""
        pass
    
    @abstractmethod
    def get_api_base_url(self) -> str:
        """Return API base URL for the platform"""
        pass
    
    @abstractmethod
    def authenticate(self) -> bool:
        """Authenticate with platform using stored credentials"""
        pass
    
    @abstractmethod
    def refresh_token(self) -> Optional[Dict[str, Any]]:
        """Refresh OAuth token if needed"""
        pass
    
    @abstractmethod
    def get_workflows(self) -> List[Dict[str, Any]]:
        """Fetch all workflows from platform"""
        pass
    
    @abstractmethod
    def get_workflow_details(self, workflow_id: str) -> Dict[str, Any]:
        """Get detailed workflow JSON"""
        pass
    
    @abstractmethod
    def test_connection(self) -> bool:
        """Test if connection to platform is working"""
        pass
    
    def get_workflow_count(self) -> int:
        """Get total number of workflows"""
        try:
            workflows = self.get_workflows()
            return len(workflows)
        except Exception as e:
            logger.error(f"Failed to get workflow count: {e}")
            return 0
    
    def get_platform_info(self) -> Dict[str, Any]:
        """Get platform information"""
        return {
            'platform_name': self.platform_name,
            'api_base_url': self.api_base_url,
            'instance_url': self.instance_url,
            'workflow_count': self.get_workflow_count(),
            'connection_status': 'active' if self.test_connection() else 'inactive',
            'last_checked': datetime.utcnow().isoformat()
        }

class PlatformFactory:
    """Factory for creating platform clients"""
    
    @staticmethod
    def create_platform(platform_type: str, credentials: Dict[str, Any], 
                       instance_url: str = None) -> BasePlatform:
        """
        Create platform client based on type
        
        Args:
            platform_type: Platform type (n8n, zapier, make)
            credentials: OAuth credentials
            instance_url: Platform instance URL
            
        Returns:
            Platform client instance
        """
        if platform_type.lower() == 'n8n':
            from .n8n_client import N8nClient
            return N8nClient(credentials, instance_url)
        elif platform_type.lower() == 'zapier':
            from .zapier_client import ZapierClient
            return ZapierClient(credentials, instance_url)
        elif platform_type.lower() == 'make':
            from .make_client import MakeClient
            return MakeClient(credentials, instance_url)
        else:
            raise ValueError(f"Unsupported platform type: {platform_type}")

class PlatformManager:
    """Manages multiple platform connections"""
    
    def __init__(self, credential_manager):
        self.credential_manager = credential_manager
        self.platform_clients = {}
    
    def get_platform_client(self, connection_id: int) -> Optional[BasePlatform]:
        """Get platform client for a connection"""
        if connection_id in self.platform_clients:
            return self.platform_clients[connection_id]
        
        # Get connection details
        connection = self.credential_manager.get_connection(connection_id)
        if not connection:
            return None
        
        try:
            # Create platform client
            client = PlatformFactory.create_platform(
                platform_type=connection['platform_type'],
                credentials=connection['credentials'],
                instance_url=connection['platform_instance_url']
            )
            
            # Cache the client
            self.platform_clients[connection_id] = client
            return client
            
        except Exception as e:
            logger.error(f"Failed to create platform client for connection {connection_id}: {e}")
            return None
    
    def refresh_all_tokens(self, user_id: int) -> Dict[str, bool]:
        """Refresh tokens for all user connections"""
        results = {}
        connections = self.credential_manager.get_user_connections(user_id)
        
        for connection in connections:
            connection_id = connection['id']
            try:
                client = self.get_platform_client(connection_id)
                if client:
                    new_tokens = client.refresh_token()
                    if new_tokens:
                        success = self.credential_manager.update_connection_tokens(
                            connection_id, new_tokens
                        )
                        results[connection_id] = success
                    else:
                        results[connection_id] = False
                else:
                    results[connection_id] = False
            except Exception as e:
                logger.error(f"Failed to refresh token for connection {connection_id}: {e}")
                results[connection_id] = False
        
        return results
    
    def test_all_connections(self, user_id: int) -> Dict[str, bool]:
        """Test all user connections"""
        results = {}
        connections = self.credential_manager.get_user_connections(user_id)
        
        for connection in connections:
            connection_id = connection['id']
            try:
                client = self.get_platform_client(connection_id)
                if client:
                    results[connection_id] = client.test_connection()
                else:
                    results[connection_id] = False
            except Exception as e:
                logger.error(f"Failed to test connection {connection_id}: {e}")
                results[connection_id] = False
        
        return results


