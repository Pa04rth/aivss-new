"""
n8n platform client implementation
Handles OAuth authentication and workflow management
"""

import requests
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from urllib.parse import urljoin, urlparse

from .base_platform import BasePlatform

logger = logging.getLogger(__name__)

class N8nClient(BasePlatform):
    """n8n platform client"""
    
    def __init__(self, credentials: Dict[str, Any], instance_url: str = None):
        """
        Initialize n8n client
        
        Args:
            credentials: OAuth credentials
            instance_url: n8n instance URL (default: n8n.cloud)
        """
        super().__init__(credentials, instance_url)
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f"Bearer {self.credentials.get('access_token', '')}",
            'Content-Type': 'application/json'
        })
    
    def get_platform_name(self) -> str:
        """Return platform name"""
        return "n8n"
    
    def get_api_base_url(self) -> str:
        """Return API base URL"""
        if self.instance_url:
            # Self-hosted n8n instance
            parsed_url = urlparse(self.instance_url)
            return f"{parsed_url.scheme}://{parsed_url.netloc}/api/v1"
        else:
            # n8n Cloud
            return "https://api.n8n.cloud/api/v1"
    
    def authenticate(self) -> bool:
        """Test authentication with n8n"""
        try:
            response = self.session.get(f"{self.api_base_url}/workflows")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"n8n authentication failed: {e}")
            return False
    
    def refresh_token(self) -> Optional[Dict[str, Any]]:
        """Refresh OAuth token"""
        try:
            refresh_token = self.credentials.get('refresh_token')
            if not refresh_token:
                logger.warning("No refresh token available")
                return None
            
            # Determine OAuth endpoint
            if self.instance_url:
                # Self-hosted instance
                oauth_url = f"{self.instance_url}/oauth/refresh"
            else:
                # n8n Cloud
                oauth_url = "https://api.n8n.cloud/oauth/refresh"
            
            response = requests.post(oauth_url, data={
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'client_id': self.credentials.get('client_id', ''),
                'client_secret': self.credentials.get('client_secret', '')
            })
            
            if response.status_code == 200:
                token_data = response.json()
                logger.info("Successfully refreshed n8n token")
                return token_data
            else:
                logger.error(f"Token refresh failed: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to refresh n8n token: {e}")
            return None
    
    def get_workflows(self) -> List[Dict[str, Any]]:
        """Fetch all workflows from n8n"""
        try:
            response = self.session.get(f"{self.api_base_url}/workflows")
            
            if response.status_code == 200:
                workflows_data = response.json()
                workflows = workflows_data.get('data', [])
                
                # Format workflows for our system
                formatted_workflows = []
                for workflow in workflows:
                    formatted_workflows.append({
                        'id': workflow.get('id'),
                        'name': workflow.get('name', 'Unnamed Workflow'),
                        'active': workflow.get('active', False),
                        'created_at': workflow.get('createdAt'),
                        'updated_at': workflow.get('updatedAt'),
                        'nodes_count': len(workflow.get('nodes', [])),
                        'connections_count': len(workflow.get('connections', {})),
                        'tags': workflow.get('tags', []),
                        'description': workflow.get('description', '')
                    })
                
                logger.info(f"Retrieved {len(formatted_workflows)} workflows from n8n")
                return formatted_workflows
            else:
                logger.error(f"Failed to fetch workflows: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching n8n workflows: {e}")
            return []
    
    def get_workflow_details(self, workflow_id: str) -> Dict[str, Any]:
        """Get detailed workflow JSON"""
        try:
            response = self.session.get(f"{self.api_base_url}/workflows/{workflow_id}")
            
            if response.status_code == 200:
                workflow_data = response.json()
                
                # Extract key information
                workflow_details = {
                    'id': workflow_data.get('id'),
                    'name': workflow_data.get('name', 'Unnamed Workflow'),
                    'active': workflow_data.get('active', False),
                    'nodes': workflow_data.get('nodes', []),
                    'connections': workflow_data.get('connections', {}),
                    'settings': workflow_data.get('settings', {}),
                    'static_data': workflow_data.get('staticData', {}),
                    'created_at': workflow_data.get('createdAt'),
                    'updated_at': workflow_data.get('updatedAt'),
                    'tags': workflow_data.get('tags', []),
                    'description': workflow_data.get('description', ''),
                    'raw_data': workflow_data  # Keep original for analysis
                }
                
                logger.info(f"Retrieved workflow details for {workflow_id}")
                return workflow_details
            else:
                logger.error(f"Failed to fetch workflow {workflow_id}: {response.status_code}")
                return {}
                
        except Exception as e:
            logger.error(f"Error fetching workflow {workflow_id}: {e}")
            return {}
    
    def test_connection(self) -> bool:
        """Test connection to n8n"""
        return self.authenticate()
    
    def get_workflow_statistics(self) -> Dict[str, Any]:
        """Get workflow statistics"""
        try:
            workflows = self.get_workflows()
            
            total_workflows = len(workflows)
            active_workflows = len([w for w in workflows if w.get('active', False)])
            total_nodes = sum(w.get('nodes_count', 0) for w in workflows)
            total_connections = sum(w.get('connections_count', 0) for w in workflows)
            
            # Analyze node types
            node_types = {}
            for workflow in workflows:
                details = self.get_workflow_details(workflow['id'])
                for node in details.get('nodes', []):
                    node_type = node.get('type', 'unknown')
                    node_types[node_type] = node_types.get(node_type, 0) + 1
            
            return {
                'total_workflows': total_workflows,
                'active_workflows': active_workflows,
                'inactive_workflows': total_workflows - active_workflows,
                'total_nodes': total_nodes,
                'total_connections': total_connections,
                'node_types': node_types,
                'average_nodes_per_workflow': total_nodes / total_workflows if total_workflows > 0 else 0,
                'average_connections_per_workflow': total_connections / total_workflows if total_workflows > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting workflow statistics: {e}")
            return {}
    
    def validate_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate workflow structure"""
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'node_count': 0,
            'connection_count': 0
        }
        
        try:
            nodes = workflow_data.get('nodes', [])
            connections = workflow_data.get('connections', {})
            
            validation_result['node_count'] = len(nodes)
            validation_result['connection_count'] = len(connections)
            
            # Check for required fields
            if not nodes:
                validation_result['errors'].append("Workflow has no nodes")
                validation_result['valid'] = False
            
            # Check for disconnected nodes
            connected_nodes = set()
            for connection_list in connections.values():
                for connection in connection_list:
                    connected_nodes.add(connection.get('node'))
            
            for node in nodes:
                node_id = node.get('id')
                if node_id not in connected_nodes and len(nodes) > 1:
                    validation_result['warnings'].append(f"Node '{node.get('name', node_id)}' is not connected")
            
            # Check for common issues
            for node in nodes:
                node_type = node.get('type', '')
                
                # Check for HTTP Request nodes without HTTPS
                if 'httpRequest' in node_type:
                    parameters = node.get('parameters', {})
                    url = parameters.get('url', '')
                    if url.startswith('http://') and not url.startswith('http://localhost'):
                        validation_result['warnings'].append(f"HTTP Request node uses insecure HTTP: {url}")
                
                # Check for credential usage
                credentials = node.get('credentials', {})
                if credentials:
                    for cred_name, cred_value in credentials.items():
                        if isinstance(cred_value, str) and len(cred_value) > 10:
                            validation_result['warnings'].append(f"Potential hardcoded credential in node '{node.get('name')}'")
            
            logger.info(f"Workflow validation completed: {len(validation_result['errors'])} errors, {len(validation_result['warnings'])} warnings")
            
        except Exception as e:
            logger.error(f"Error validating workflow: {e}")
            validation_result['valid'] = False
            validation_result['errors'].append(f"Validation error: {str(e)}")
        
        return validation_result


