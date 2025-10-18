"""
n8n API endpoints for Flask backend
Handles OAuth authentication, workflow management, and analysis
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime
import logging
import os
from urllib.parse import urlencode

from database.connection_manager import CredentialManager, ScanResultManager
from platforms.base_platform import PlatformManager
from security.workflow_analyzer import WorkflowAnalyzer

logger = logging.getLogger(__name__)

# Create Blueprint
n8n_bp = Blueprint('n8n', __name__, url_prefix='/api/n8n')

# Initialize managers
credential_manager = CredentialManager()
scan_result_manager = ScanResultManager()
platform_manager = PlatformManager(credential_manager)
workflow_analyzer = WorkflowAnalyzer()

# n8n OAuth configuration
N8N_CLIENT_ID = os.getenv('N8N_CLIENT_ID', 'your_n8n_client_id')
N8N_CLIENT_SECRET = os.getenv('N8N_CLIENT_SECRET', 'your_n8n_client_secret')
N8N_REDIRECT_URI = os.getenv('N8N_REDIRECT_URI', 'http://localhost:3000/api/n8n/callback')
N8N_AUTH_URL = os.getenv('N8N_AUTH_URL', 'https://app.n8n.cloud/oauth/authorize')
N8N_TOKEN_URL = os.getenv('N8N_TOKEN_URL', 'https://app.n8n.cloud/oauth/token')

@n8n_bp.route('/auth-url', methods=['GET'])
def get_auth_url():
    """Get n8n OAuth authorization URL"""
    try:
        # For now, use a temporary user ID (will be replaced with actual user auth)
        temp_user_id = request.args.get('user_id', 1)
        
        # Store user ID in session for callback
        session['temp_user_id'] = temp_user_id
        
        # Build OAuth URL
        params = {
            'client_id': N8N_CLIENT_ID,
            'redirect_uri': N8N_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'workflow:read workflow:write',
            'state': f'n8n_auth_{temp_user_id}'
        }
        
        auth_url = f"{N8N_AUTH_URL}?{urlencode(params)}"
        
        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'message': 'Redirect user to this URL for OAuth authentication'
        })
        
    except Exception as e:
        logger.error(f"Error generating auth URL: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@n8n_bp.route('/callback', methods=['GET'])
def oauth_callback():
    """Handle OAuth callback from n8n"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        if error:
            return jsonify({
                'success': False,
                'error': f'OAuth error: {error}'
            }), 400
        
        if not code:
            return jsonify({
                'success': False,
                'error': 'No authorization code received'
            }), 400
        
        # Extract user ID from state
        if not state or not state.startswith('n8n_auth_'):
            return jsonify({
                'success': False,
                'error': 'Invalid state parameter'
            }), 400
        
        user_id = int(state.split('_')[2])
        
        # Exchange code for tokens
        token_data = {
            'grant_type': 'authorization_code',
            'client_id': N8N_CLIENT_ID,
            'client_secret': N8N_CLIENT_SECRET,
            'redirect_uri': N8N_REDIRECT_URI,
            'code': code
        }
        
        import requests
        response = requests.post(N8N_TOKEN_URL, data=token_data)
        
        if response.status_code != 200:
            return jsonify({
                'success': False,
                'error': f'Token exchange failed: {response.text}'
            }), 400
        
        tokens = response.json()
        
        # Store connection
        connection_id = credential_manager.store_connection(
            user_id=user_id,
            platform_type='n8n',
            credentials=tokens,
            instance_url=None,  # n8n Cloud
            instance_name='n8n Cloud'
        )
        
        return jsonify({
            'success': True,
            'connection_id': connection_id,
            'message': 'Successfully connected to n8n'
        })
        
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@n8n_bp.route('/connections', methods=['GET'])
def get_connections():
    """Get user's n8n connections"""
    try:
        user_id = request.args.get('user_id', 1)  # Temporary user ID
        
        connections = credential_manager.get_user_connections(user_id, 'n8n')
        
        # Format connections for frontend
        formatted_connections = []
        for conn in connections:
            formatted_connections.append({
                'id': conn['id'],
                'platform_type': conn['platform_type'],
                'instance_name': conn['platform_instance_name'],
                'instance_url': conn['platform_instance_url'],
                'connection_status': conn['connection_status'],
                'created_at': conn['created_at'].isoformat() if conn['created_at'] else None,
                'last_sync_at': conn['last_sync_at'].isoformat() if conn['last_sync_at'] else None
            })
        
        return jsonify({
            'success': True,
            'connections': formatted_connections
        })
        
    except Exception as e:
        logger.error(f"Error getting connections: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@n8n_bp.route('/workflows', methods=['GET'])
def get_workflows():
    """Get workflows from n8n connection"""
    try:
        connection_id = request.args.get('connection_id')
        if not connection_id:
            return jsonify({
                'success': False,
                'error': 'Connection ID required'
            }), 400
        
        # Get platform client
        client = platform_manager.get_platform_client(int(connection_id))
        if not client:
            return jsonify({
                'success': False,
                'error': 'Invalid connection or client not available'
            }), 400
        
        # Fetch workflows
        workflows = client.get_workflows()
        
        return jsonify({
            'success': True,
            'workflows': workflows,
            'total_count': len(workflows)
        })
        
    except Exception as e:
        logger.error(f"Error getting workflows: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@n8n_bp.route('/workflow/<workflow_id>', methods=['GET'])
def get_workflow_details(workflow_id):
    """Get detailed workflow information"""
    try:
        connection_id = request.args.get('connection_id')
        if not connection_id:
            return jsonify({
                'success': False,
                'error': 'Connection ID required'
            }), 400
        
        # Get platform client
        client = platform_manager.get_platform_client(int(connection_id))
        if not client:
            return jsonify({
                'success': False,
                'error': 'Invalid connection or client not available'
            }), 400
        
        # Fetch workflow details
        workflow_details = client.get_workflow_details(workflow_id)
        
        if not workflow_details:
            return jsonify({
                'success': False,
                'error': 'Workflow not found'
            }), 404
        
        return jsonify({
            'success': True,
            'workflow': workflow_details
        })
        
    except Exception as e:
        logger.error(f"Error getting workflow details: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@n8n_bp.route('/analyze', methods=['POST'])
def analyze_workflow():
    """Analyze workflow for security issues"""
    try:
        data = request.get_json()
        connection_id = data.get('connection_id')
        workflow_id = data.get('workflow_id')
        user_id = data.get('user_id', 1)  # Temporary user ID
        
        if not connection_id or not workflow_id:
            return jsonify({
                'success': False,
                'error': 'Connection ID and Workflow ID required'
            }), 400
        
        # Get platform client
        client = platform_manager.get_platform_client(int(connection_id))
        if not client:
            return jsonify({
                'success': False,
                'error': 'Invalid connection or client not available'
            }), 400
        
        # Fetch workflow details
        workflow_data = client.get_workflow_details(workflow_id)
        if not workflow_data:
            return jsonify({
                'success': False,
                'error': 'Workflow not found'
            }), 404
        
        # Run security analysis
        analysis_result = workflow_analyzer.analyze_workflow(workflow_data, 'n8n')
        
        # Generate security report
        security_report = workflow_analyzer.generate_security_report(analysis_result)
        
        # Store scan result
        scan_data = {
            'scanName': f"n8n Workflow Analysis: {workflow_data.get('name', 'Unnamed')}",
            'scanCreated': datetime.utcnow().isoformat(),
            'scanCompleted': datetime.utcnow().isoformat(),
            'totalFiles': 1,
            'linesOfCode': len(workflow_data.get('nodes', [])),
            'workflow_id': workflow_id,
            'workflow_name': workflow_data.get('name', 'Unnamed'),
            'platform': 'n8n',
            'risks': analysis_result.get('staticFindings', []) + analysis_result.get('contextualFindings', []),
            'risks_count': analysis_result.get('totalRisks', 0),
            'constraints_count': len(analysis_result.get('contextualFindings', [])),
            'contextualFindings': analysis_result.get('contextualFindings', []),
            'staticFindings': analysis_result.get('staticFindings', []),
            'workflowAnalysis': analysis_result.get('workflowAnalysis', {}),
            'aarsAnalysis': analysis_result.get('aarsAnalysis', {}),
            'aivssAnalysis': analysis_result.get('aivssAnalysis', {}),
            'securitySummary': analysis_result.get('securitySummary', {}),
            'platformSpecific': analysis_result.get('platformSpecific', {}),
            'message': f"Successfully analyzed n8n workflow: {workflow_data.get('name', 'Unnamed')}"
        }
        
        scan_id = scan_result_manager.store_scan_result(
            user_id=user_id,
            scan_data=scan_data,
            connection_id=int(connection_id)
        )
        
        return jsonify({
            'success': True,
            'scan_id': scan_id,
            'analysis_result': analysis_result,
            'security_report': security_report,
            'message': 'Workflow analysis completed successfully'
        })
        
    except Exception as e:
        logger.error(f"Error analyzing workflow: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@n8n_bp.route('/disconnect', methods=['POST'])
def disconnect():
    """Disconnect n8n connection"""
    try:
        data = request.get_json()
        connection_id = data.get('connection_id')
        
        if not connection_id:
            return jsonify({
                'success': False,
                'error': 'Connection ID required'
            }), 400
        
        # Delete connection
        success = credential_manager.delete_connection(int(connection_id))
        
        if success:
            # Remove from platform manager cache
            if int(connection_id) in platform_manager.platform_clients:
                del platform_manager.platform_clients[int(connection_id)]
            
            return jsonify({
                'success': True,
                'message': 'Successfully disconnected from n8n'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to disconnect'
            }), 500
        
    except Exception as e:
        logger.error(f"Error disconnecting: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@n8n_bp.route('/test-connection', methods=['POST'])
def test_connection():
    """Test n8n connection"""
    try:
        data = request.get_json()
        connection_id = data.get('connection_id')
        
        if not connection_id:
            return jsonify({
                'success': False,
                'error': 'Connection ID required'
            }), 400
        
        # Get platform client
        client = platform_manager.get_platform_client(int(connection_id))
        if not client:
            return jsonify({
                'success': False,
                'error': 'Invalid connection or client not available'
            }), 400
        
        # Test connection
        is_connected = client.test_connection()
        
        return jsonify({
            'success': True,
            'connected': is_connected,
            'message': 'Connection test completed'
        })
        
    except Exception as e:
        logger.error(f"Error testing connection: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@n8n_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get n8n workflow statistics"""
    try:
        connection_id = request.args.get('connection_id')
        if not connection_id:
            return jsonify({
                'success': False,
                'error': 'Connection ID required'
            }), 400
        
        # Get platform client
        client = platform_manager.get_platform_client(int(connection_id))
        if not client:
            return jsonify({
                'success': False,
                'error': 'Invalid connection or client not available'
            }), 400
        
        # Get statistics
        stats = client.get_workflow_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


