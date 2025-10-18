"""
Enhanced workflow security analyzer
Extends existing security analysis for automation platforms
"""

from typing import Dict, List, Any
import json
import logging
from datetime import datetime

from .n8n_security_rules import N8nSecurityRules
# Future: from .zapier_security_rules import ZapierSecurityRules
# Future: from .make_security_rules import MakeSecurityRules

logger = logging.getLogger(__name__)

class WorkflowAnalyzer:
    """Unified workflow security analyzer"""
    
    def __init__(self):
        self.rules_engines = {
            'n8n': N8nSecurityRules(),
            # Future: 'zapier': ZapierSecurityRules(),
            # Future: 'make': MakeSecurityRules()
        }
    
    def analyze_workflow(self, workflow_data: Dict[str, Any], platform: str) -> Dict[str, Any]:
        """Analyze workflow using platform-specific rules + AI analysis"""
        
        logger.info(f"Starting workflow analysis for {platform}")
        
        # Get platform-specific rules
        rules_engine = self.rules_engines.get(platform)
        if not rules_engine:
            raise ValueError(f"Unsupported platform: {platform}")
        
        # Run static analysis
        static_findings = rules_engine.analyze_static_patterns(workflow_data)
        
        # Convert workflow to text for AI analysis
        workflow_text = self.convert_workflow_to_text(workflow_data, platform)
        
        # Run AI-powered analysis (reuse existing AI analysis)
        ai_analysis = self.run_ai_analysis(workflow_text, platform)
        
        # Get security summary
        security_summary = rules_engine.get_security_summary(workflow_data)
        
        # Combine results
        result = {
            'platform': platform,
            'workflow_id': workflow_data.get('id'),
            'workflow_name': workflow_data.get('name', 'Unnamed Workflow'),
            'staticFindings': static_findings,
            'contextualFindings': ai_analysis.get('contextualFindings', []),
            'workflowAnalysis': ai_analysis.get('workflowAnalysis', {}),
            'aarsAnalysis': ai_analysis.get('aarsAnalysis', {}),
            'aivssAnalysis': ai_analysis.get('aivssAnalysis', {}),
            'securitySummary': security_summary,
            'totalRisks': len(static_findings) + len(ai_analysis.get('contextualFindings', [])),
            'analysisTimestamp': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Workflow analysis completed: {result['totalRisks']} total risks found")
        return result
    
    def convert_workflow_to_text(self, workflow_data: Dict[str, Any], platform: str) -> str:
        """Convert workflow data to text format for AI analysis"""
        
        if platform == 'n8n':
            return self.convert_n8n_workflow_to_text(workflow_data)
        elif platform == 'zapier':
            return self.convert_zapier_workflow_to_text(workflow_data)
        elif platform == 'make':
            return self.convert_make_workflow_to_text(workflow_data)
        else:
            return json.dumps(workflow_data, indent=2)
    
    def convert_n8n_workflow_to_text(self, workflow_data: Dict[str, Any]) -> str:
        """Convert n8n workflow to text format"""
        text_parts = []
        
        # Workflow metadata
        text_parts.append(f"n8n Workflow: {workflow_data.get('name', 'Unnamed')}")
        text_parts.append(f"Description: {workflow_data.get('description', 'No description')}")
        text_parts.append(f"Active: {workflow_data.get('active', False)}")
        text_parts.append("")
        
        # Nodes analysis
        nodes = workflow_data.get('nodes', [])
        text_parts.append(f"Total Nodes: {len(nodes)}")
        text_parts.append("")
        
        for i, node in enumerate(nodes, 1):
            node_name = node.get('name', f'Node {i}')
            node_type = node.get('type', 'unknown')
            text_parts.append(f"Node {i}: {node_name} (Type: {node_type})")
            
            # Add parameters that might contain security-relevant information
            parameters = node.get('parameters', {})
            if parameters:
                text_parts.append("  Parameters:")
                for param_name, param_value in parameters.items():
                    if isinstance(param_value, str) and len(param_value) < 200:
                        text_parts.append(f"    {param_name}: {param_value}")
                    elif isinstance(param_value, (dict, list)):
                        text_parts.append(f"    {param_name}: {json.dumps(param_value, indent=4)}")
            
            # Add credentials info
            credentials = node.get('credentials', {})
            if credentials:
                text_parts.append("  Credentials:")
                for cred_name in credentials.keys():
                    text_parts.append(f"    {cred_name}: [CREDENTIAL]")
            
            text_parts.append("")
        
        # Connections analysis
        connections = workflow_data.get('connections', {})
        text_parts.append(f"Total Connections: {len(connections)}")
        text_parts.append("")
        
        for source_node, connection_list in connections.items():
            for connection in connection_list:
                target_node = connection.get('node', 'unknown')
                connection_type = connection.get('type', 'main')
                text_parts.append(f"Connection: {source_node} -> {target_node} (Type: {connection_type})")
        
        text_parts.append("")
        
        # Settings analysis
        settings = workflow_data.get('settings', {})
        if settings:
            text_parts.append("Workflow Settings:")
            text_parts.append(json.dumps(settings, indent=2))
        
        return "\n".join(text_parts)
    
    def convert_zapier_workflow_to_text(self, workflow_data: Dict[str, Any]) -> str:
        """Convert Zapier workflow to text format (future implementation)"""
        # Placeholder for future Zapier implementation
        return json.dumps(workflow_data, indent=2)
    
    def convert_make_workflow_to_text(self, workflow_data: Dict[str, Any]) -> str:
        """Convert Make.com workflow to text format (future implementation)"""
        # Placeholder for future Make.com implementation
        return json.dumps(workflow_data, indent=2)
    
    def run_ai_analysis(self, workflow_text: str, platform: str) -> Dict[str, Any]:
        """Reuse existing AI analysis engine with platform-specific prompts"""
        
        # Import the existing AI analysis function
        try:
            from scanner_logic import get_ai_analysis
            return get_ai_analysis(workflow_text)
        except ImportError:
            logger.error("Failed to import existing AI analysis function")
            return {
                'contextualFindings': [],
                'workflowAnalysis': {},
                'aarsAnalysis': {},
                'aivssAnalysis': {}
            }
    
    def get_platform_specific_analysis(self, workflow_data: Dict[str, Any], platform: str) -> Dict[str, Any]:
        """Get platform-specific analysis insights"""
        
        if platform == 'n8n':
            return self.get_n8n_specific_analysis(workflow_data)
        elif platform == 'zapier':
            return self.get_zapier_specific_analysis(workflow_data)
        elif platform == 'make':
            return self.get_make_specific_analysis(workflow_data)
        else:
            return {}
    
    def get_n8n_specific_analysis(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get n8n-specific analysis insights"""
        nodes = workflow_data.get('nodes', [])
        connections = workflow_data.get('connections', {})
        
        # Analyze node types
        node_types = {}
        for node in nodes:
            node_type = node.get('type', 'unknown')
            node_types[node_type] = node_types.get(node_type, 0) + 1
        
        # Analyze external integrations
        external_integrations = []
        for node in nodes:
            node_type = node.get('type', '')
            if any(integration in node_type.lower() for integration in ['http', 'webhook', 'api', 'rest']):
                external_integrations.append({
                    'node_name': node.get('name', 'Unnamed'),
                    'node_type': node_type,
                    'parameters': node.get('parameters', {})
                })
        
        # Analyze data flow complexity
        data_flow_complexity = len(connections)
        
        return {
            'node_types': node_types,
            'external_integrations': external_integrations,
            'data_flow_complexity': data_flow_complexity,
            'total_nodes': len(nodes),
            'total_connections': len(connections),
            'workflow_complexity_score': self.calculate_workflow_complexity_score(nodes, connections)
        }
    
    def get_zapier_specific_analysis(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get Zapier-specific analysis insights (future implementation)"""
        return {}
    
    def get_make_specific_analysis(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get Make.com-specific analysis insights (future implementation)"""
        return {}
    
    def calculate_workflow_complexity_score(self, nodes: List[Dict], connections: Dict) -> float:
        """Calculate workflow complexity score (0-100)"""
        if not nodes:
            return 0.0
        
        # Base score from node count
        node_score = min(len(nodes) * 2, 50)
        
        # Additional score from connection complexity
        connection_score = min(len(connections) * 1.5, 30)
        
        # Additional score from node type diversity
        node_types = set(node.get('type', 'unknown') for node in nodes)
        diversity_score = min(len(node_types) * 2, 20)
        
        return min(node_score + connection_score + diversity_score, 100.0)
    
    def generate_security_report(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive security report"""
        
        platform = analysis_result.get('platform', 'unknown')
        workflow_name = analysis_result.get('workflow_name', 'Unnamed Workflow')
        
        # Extract findings
        static_findings = analysis_result.get('staticFindings', [])
        contextual_findings = analysis_result.get('contextualFindings', [])
        security_summary = analysis_result.get('securitySummary', {})
        
        # Calculate risk metrics
        total_risks = len(static_findings) + len(contextual_findings)
        critical_risks = len([f for f in static_findings + contextual_findings if f.get('severity') == 'critical'])
        high_risks = len([f for f in static_findings + contextual_findings if f.get('severity') == 'high'])
        medium_risks = len([f for f in static_findings + contextual_findings if f.get('severity') == 'medium'])
        low_risks = len([f for f in static_findings + contextual_findings if f.get('severity') == 'low'])
        
        # Generate recommendations
        recommendations = self.generate_recommendations(static_findings, contextual_findings)
        
        return {
            'workflow_info': {
                'platform': platform,
                'workflow_name': workflow_name,
                'workflow_id': analysis_result.get('workflow_id'),
                'analysis_timestamp': analysis_result.get('analysisTimestamp')
            },
            'risk_metrics': {
                'total_risks': total_risks,
                'critical_risks': critical_risks,
                'high_risks': high_risks,
                'medium_risks': medium_risks,
                'low_risks': low_risks,
                'risk_score': security_summary.get('risk_score', 0),
                'complexity_score': analysis_result.get('platformSpecific', {}).get('workflow_complexity_score', 0)
            },
            'findings': {
                'static_findings': static_findings,
                'contextual_findings': contextual_findings,
                'security_summary': security_summary
            },
            'analysis_results': {
                'workflow_analysis': analysis_result.get('workflowAnalysis', {}),
                'aars_analysis': analysis_result.get('aarsAnalysis', {}),
                'aivss_analysis': analysis_result.get('aivssAnalysis', {})
            },
            'recommendations': recommendations,
            'platform_specific': analysis_result.get('platformSpecific', {})
        }
    
    def generate_recommendations(self, static_findings: List[Dict], contextual_findings: List[Dict]) -> List[Dict[str, Any]]:
        """Generate prioritized recommendations based on findings"""
        recommendations = []
        
        # Group findings by type and severity
        finding_groups = {}
        for finding in static_findings + contextual_findings:
            finding_type = finding.get('type', 'unknown')
            severity = finding.get('severity', 'low')
            
            if finding_type not in finding_groups:
                finding_groups[finding_type] = {'critical': [], 'high': [], 'medium': [], 'low': []}
            
            finding_groups[finding_type][severity].append(finding)
        
        # Generate recommendations based on severity and frequency
        for finding_type, severity_groups in finding_groups.items():
            total_findings = sum(len(findings) for findings in severity_groups.values())
            
            if total_findings == 0:
                continue
            
            # Determine priority based on highest severity
            priority = 'low'
            if severity_groups['critical']:
                priority = 'critical'
            elif severity_groups['high']:
                priority = 'high'
            elif severity_groups['medium']:
                priority = 'medium'
            
            # Generate recommendation based on type
            recommendation = self.get_recommendation_for_type(finding_type, priority, total_findings)
            if recommendation:
                recommendations.append(recommendation)
        
        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda x: priority_order.get(x.get('priority', 'low'), 3))
        
        return recommendations
    
    def get_recommendation_for_type(self, finding_type: str, priority: str, count: int) -> Dict[str, Any]:
        """Get recommendation for specific finding type"""
        
        recommendations_map = {
            'credential_exposure': {
                'title': 'Secure Credential Management',
                'description': f'Found {count} credential exposure issues. Implement proper credential management.',
                'action': 'Use platform credential system instead of hardcoded values',
                'priority': priority
            },
            'insecure_connection': {
                'title': 'Upgrade to Secure Connections',
                'description': f'Found {count} insecure HTTP connections. Upgrade to HTTPS.',
                'action': 'Replace all HTTP URLs with HTTPS equivalents',
                'priority': priority
            },
            'missing_error_handling': {
                'title': 'Implement Error Handling',
                'description': f'Found {count} nodes without proper error handling.',
                'action': 'Add error handling connections to critical nodes',
                'priority': priority
            },
            'dangerous_code': {
                'title': 'Remove Dangerous Code',
                'description': f'Found {count} instances of dangerous code functions.',
                'action': 'Remove or replace dangerous functions like eval(), exec()',
                'priority': priority
            },
            'circular_dependency': {
                'title': 'Resolve Circular Dependencies',
                'description': f'Found {count} circular dependencies that could cause infinite loops.',
                'action': 'Restructure workflow to eliminate circular dependencies',
                'priority': priority
            }
        }
        
        return recommendations_map.get(finding_type, {
            'title': f'Address {finding_type.replace("_", " ").title()}',
            'description': f'Found {count} issues of type {finding_type}.',
            'action': 'Review and address these issues',
            'priority': priority
        })


