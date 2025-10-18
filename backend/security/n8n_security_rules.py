"""
n8n-specific security analysis rules
Extends the existing security analysis engine for workflow analysis
"""

from typing import Dict, List, Any
import re
import logging

logger = logging.getLogger(__name__)

class N8nSecurityRules:
    """n8n-specific security analysis rules"""
    
    def __init__(self):
        self.critical_patterns = [
            'eval', 'exec', 'system', 'shell', 'command',
            'sql', 'database', 'query', 'injection'
        ]
        
        self.high_risk_patterns = [
            'http://', 'ftp://', 'unencrypted', 'password', 'secret',
            'key', 'token', 'credential', 'auth'
        ]
        
        self.medium_risk_patterns = [
            'file', 'upload', 'download', 'delete', 'remove',
            'write', 'create', 'modify'
        ]
    
    def analyze_static_patterns(self, workflow_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze n8n workflow for security patterns"""
        findings = []
        
        try:
            # Check for credential exposure
            findings.extend(self.check_credential_exposure(workflow_data))
            
            # Check for insecure connections
            findings.extend(self.check_insecure_connections(workflow_data))
            
            # Check for data exposure
            findings.extend(self.check_data_exposure(workflow_data))
            
            # Check for missing error handling
            findings.extend(self.check_error_handling(workflow_data))
            
            # Check for dangerous node configurations
            findings.extend(self.check_dangerous_nodes(workflow_data))
            
            # Check for workflow complexity risks
            findings.extend(self.check_workflow_complexity(workflow_data))
            
            logger.info(f"n8n static analysis found {len(findings)} issues")
            
        except Exception as e:
            logger.error(f"Error in n8n static analysis: {e}")
            findings.append({
                'node_id': 'analysis_error',
                'node_name': 'Analysis Error',
                'severity': 'medium',
                'type': 'analysis_error',
                'message': f'Static analysis failed: {str(e)}',
                'suggestion': 'Review workflow manually for security issues'
            })
        
        return findings
    
    def check_credential_exposure(self, workflow_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for exposed credentials in workflow"""
        findings = []
        nodes = workflow_data.get('nodes', [])
        
        for node in nodes:
            node_id = node.get('id', 'unknown')
            node_name = node.get('name', 'Unnamed Node')
            node_type = node.get('type', '')
            
            # Check parameters for hardcoded credentials
            parameters = node.get('parameters', {})
            for param_name, param_value in parameters.items():
                if isinstance(param_value, str):
                    # Check for potential passwords/secrets
                    if any(keyword in param_name.lower() for keyword in ['password', 'secret', 'key', 'token', 'credential']):
                        if len(param_value) > 5:  # Likely not empty
                            findings.append({
                                'node_id': node_id,
                                'node_name': node_name,
                                'severity': 'high',
                                'type': 'credential_exposure',
                                'message': f'Potential credential exposure in {node_name} parameter "{param_name}"',
                                'suggestion': 'Use n8n credential system instead of hardcoded values',
                                'node_type': node_type,
                                'parameter': param_name
                            })
            
            # Check credentials object
            credentials = node.get('credentials', {})
            for cred_name, cred_value in credentials.items():
                if isinstance(cred_value, str) and len(cred_value) > 10:
                    findings.append({
                        'node_id': node_id,
                        'node_name': node_name,
                        'severity': 'critical',
                        'type': 'hardcoded_credential',
                        'message': f'Hardcoded credential detected in {node_name}',
                        'suggestion': 'Use n8n credential system for secure storage',
                        'node_type': node_type,
                        'credential_name': cred_name
                    })
        
        return findings
    
    def check_insecure_connections(self, workflow_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for HTTP vs HTTPS usage"""
        findings = []
        nodes = workflow_data.get('nodes', [])
        
        for node in nodes:
            node_id = node.get('id', 'unknown')
            node_name = node.get('name', 'Unnamed Node')
            node_type = node.get('type', '')
            
            # Check HTTP Request nodes
            if 'httpRequest' in node_type.lower():
                parameters = node.get('parameters', {})
                url = parameters.get('url', '')
                
                if url.startswith('http://') and not url.startswith('http://localhost'):
                    findings.append({
                        'node_id': node_id,
                        'node_name': node_name,
                        'severity': 'medium',
                        'type': 'insecure_connection',
                        'message': f'HTTP connection detected in {node_name}',
                        'suggestion': 'Use HTTPS for secure data transmission',
                        'node_type': node_type,
                        'url': url
                    })
            
            # Check Webhook nodes
            elif 'webhook' in node_type.lower():
                parameters = node.get('parameters', {})
                webhook_url = parameters.get('webhookUrl', '')
                
                if webhook_url.startswith('http://'):
                    findings.append({
                        'node_id': node_id,
                        'node_name': node_name,
                        'severity': 'high',
                        'type': 'insecure_webhook',
                        'message': f'Insecure webhook URL in {node_name}',
                        'suggestion': 'Use HTTPS webhook URLs for security',
                        'node_type': node_type,
                        'webhook_url': webhook_url
                    })
        
        return findings
    
    def check_data_exposure(self, workflow_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for potential data exposure"""
        findings = []
        nodes = workflow_data.get('nodes', [])
        
        for node in nodes:
            node_id = node.get('id', 'unknown')
            node_name = node.get('name', 'Unnamed Node')
            node_type = node.get('type', '')
            
            # Check for sensitive data in node names/descriptions
            sensitive_keywords = ['password', 'secret', 'key', 'token', 'ssn', 'credit', 'card', 'bank']
            
            if any(keyword in node_name.lower() for keyword in sensitive_keywords):
                findings.append({
                    'node_id': node_id,
                    'node_name': node_name,
                    'severity': 'low',
                    'type': 'sensitive_naming',
                    'message': f'Node name suggests sensitive data handling: {node_name}',
                    'suggestion': 'Use generic names and handle sensitive data securely',
                    'node_type': node_type
                })
            
            # Check for data logging
            parameters = node.get('parameters', {})
            if 'logData' in parameters and parameters['logData']:
                findings.append({
                    'node_id': node_id,
                    'node_name': node_name,
                    'severity': 'medium',
                    'type': 'data_logging',
                    'message': f'Data logging enabled in {node_name}',
                    'suggestion': 'Disable data logging for sensitive operations',
                    'node_type': node_type
                })
        
        return findings
    
    def check_error_handling(self, workflow_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for missing error handling"""
        findings = []
        nodes = workflow_data.get('nodes', [])
        connections = workflow_data.get('connections', {})
        
        # Check for nodes without error handling
        for node in nodes:
            node_id = node.get('id', 'unknown')
            node_name = node.get('name', 'Unnamed Node')
            node_type = node.get('type', '')
            
            # Check if node has error handling
            has_error_connection = False
            if node_id in connections:
                for connection in connections[node_id]:
                    if connection.get('type') == 'error':
                        has_error_connection = True
                        break
            
            # Critical nodes should have error handling
            critical_node_types = ['httpRequest', 'webhook', 'database', 'file', 'email']
            if any(critical_type in node_type.lower() for critical_type in critical_node_types):
                if not has_error_connection:
                    findings.append({
                        'node_id': node_id,
                        'node_name': node_name,
                        'severity': 'medium',
                        'type': 'missing_error_handling',
                        'message': f'Critical node {node_name} lacks error handling',
                        'suggestion': 'Add error handling connections for robust workflows',
                        'node_type': node_type
                    })
        
        return findings
    
    def check_dangerous_nodes(self, workflow_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for dangerous node configurations"""
        findings = []
        nodes = workflow_data.get('nodes', [])
        
        for node in nodes:
            node_id = node.get('id', 'unknown')
            node_name = node.get('name', 'Unnamed Node')
            node_type = node.get('type', '')
            
            # Check for Code nodes with dangerous operations
            if 'code' in node_type.lower():
                parameters = node.get('parameters', {})
                code = parameters.get('jsCode', '')
                
                dangerous_functions = ['eval', 'exec', 'system', 'shell', 'spawn', 'execFile']
                for func in dangerous_functions:
                    if func in code:
                        findings.append({
                            'node_id': node_id,
                            'node_name': node_name,
                            'severity': 'critical',
                            'type': 'dangerous_code',
                            'message': f'Dangerous function "{func}" detected in Code node {node_name}',
                            'suggestion': f'Avoid using {func} for security reasons',
                            'node_type': node_type,
                            'dangerous_function': func
                        })
            
            # Check for File nodes with dangerous operations
            elif 'file' in node_type.lower():
                parameters = node.get('parameters', {})
                operation = parameters.get('operation', '')
                
                dangerous_operations = ['delete', 'remove', 'truncate']
                if operation in dangerous_operations:
                    findings.append({
                        'node_id': node_id,
                        'node_name': node_name,
                        'severity': 'high',
                        'type': 'dangerous_file_operation',
                        'message': f'Dangerous file operation "{operation}" in {node_name}',
                        'suggestion': 'Add proper validation and error handling for file operations',
                        'node_type': node_type,
                        'operation': operation
                    })
        
        return findings
    
    def check_workflow_complexity(self, workflow_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for workflow complexity risks"""
        findings = []
        
        nodes = workflow_data.get('nodes', [])
        connections = workflow_data.get('connections', {})
        
        # Check for excessive complexity
        if len(nodes) > 50:
            findings.append({
                'node_id': 'workflow_complexity',
                'node_name': 'Workflow Complexity',
                'severity': 'low',
                'type': 'excessive_complexity',
                'message': f'Workflow has {len(nodes)} nodes, which may be difficult to maintain',
                'suggestion': 'Consider breaking down into smaller, focused workflows',
                'node_count': len(nodes)
            })
        
        # Check for circular dependencies
        circular_deps = self.detect_circular_dependencies(nodes, connections)
        if circular_deps:
            findings.append({
                'node_id': 'circular_dependency',
                'node_name': 'Circular Dependency',
                'severity': 'medium',
                'type': 'circular_dependency',
                'message': f'Circular dependencies detected: {circular_deps}',
                'suggestion': 'Remove circular dependencies to prevent infinite loops',
                'circular_paths': circular_deps
            })
        
        # Check for orphaned nodes
        orphaned_nodes = self.detect_orphaned_nodes(nodes, connections)
        if orphaned_nodes:
            findings.append({
                'node_id': 'orphaned_nodes',
                'node_name': 'Orphaned Nodes',
                'severity': 'low',
                'type': 'orphaned_nodes',
                'message': f'Orphaned nodes detected: {orphaned_nodes}',
                'suggestion': 'Connect or remove unused nodes',
                'orphaned_node_ids': orphaned_nodes
            })
        
        return findings
    
    def detect_circular_dependencies(self, nodes: List[Dict], connections: Dict) -> List[List[str]]:
        """Detect circular dependencies in workflow"""
        # Build adjacency list
        graph = {}
        for node in nodes:
            graph[node['id']] = []
        
        for node_id, connection_list in connections.items():
            for connection in connection_list:
                target_node = connection.get('node')
                if target_node in graph:
                    graph[node_id].append(target_node)
        
        # DFS to detect cycles
        visited = set()
        rec_stack = set()
        cycles = []
        
        def dfs(node, path):
            if node in rec_stack:
                # Found a cycle
                cycle_start = path.index(node)
                cycles.append(path[cycle_start:] + [node])
                return
            
            if node in visited:
                return
            
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in graph.get(node, []):
                dfs(neighbor, path + [node])
            
            rec_stack.remove(node)
        
        for node_id in graph:
            if node_id not in visited:
                dfs(node_id, [])
        
        return cycles
    
    def detect_orphaned_nodes(self, nodes: List[Dict], connections: Dict) -> List[str]:
        """Detect nodes that are not connected to the workflow"""
        connected_nodes = set()
        
        # Add nodes that have outgoing connections
        connected_nodes.update(connections.keys())
        
        # Add nodes that are targets of connections
        for connection_list in connections.values():
            for connection in connection_list:
                connected_nodes.add(connection.get('node'))
        
        # Find orphaned nodes
        all_node_ids = {node['id'] for node in nodes}
        orphaned = all_node_ids - connected_nodes
        
        return list(orphaned)
    
    def get_security_summary(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get security summary for workflow"""
        findings = self.analyze_static_patterns(workflow_data)
        
        severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        type_counts = {}
        
        for finding in findings:
            severity = finding.get('severity', 'low')
            finding_type = finding.get('type', 'unknown')
            
            severity_counts[severity] += 1
            type_counts[finding_type] = type_counts.get(finding_type, 0) + 1
        
        return {
            'total_findings': len(findings),
            'severity_breakdown': severity_counts,
            'type_breakdown': type_counts,
            'risk_score': self.calculate_risk_score(findings),
            'recommendations': self.get_recommendations(findings)
        }
    
    def calculate_risk_score(self, findings: List[Dict[str, Any]]) -> float:
        """Calculate overall risk score (0-100)"""
        if not findings:
            return 0.0
        
        score = 0
        for finding in findings:
            severity = finding.get('severity', 'low')
            if severity == 'critical':
                score += 25
            elif severity == 'high':
                score += 15
            elif severity == 'medium':
                score += 8
            elif severity == 'low':
                score += 3
        
        return min(score, 100.0)
    
    def get_recommendations(self, findings: List[Dict[str, Any]]) -> List[str]:
        """Get prioritized recommendations based on findings"""
        recommendations = []
        
        # Group findings by type
        type_groups = {}
        for finding in findings:
            finding_type = finding.get('type', 'unknown')
            if finding_type not in type_groups:
                type_groups[finding_type] = []
            type_groups[finding_type].append(finding)
        
        # Generate recommendations based on severity and frequency
        for finding_type, type_findings in type_groups.items():
            if finding_type == 'credential_exposure':
                recommendations.append("🔐 Implement proper credential management using n8n's credential system")
            elif finding_type == 'insecure_connection':
                recommendations.append("🔒 Upgrade all HTTP connections to HTTPS")
            elif finding_type == 'missing_error_handling':
                recommendations.append("⚠️ Add comprehensive error handling to critical nodes")
            elif finding_type == 'dangerous_code':
                recommendations.append("🚨 Remove or replace dangerous code functions")
            elif finding_type == 'circular_dependency':
                recommendations.append("🔄 Resolve circular dependencies to prevent infinite loops")
        
        return recommendations


