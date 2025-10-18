"""
Security analysis package for automation workflows
Extends existing security analysis for different platforms
"""

from .n8n_security_rules import N8nSecurityRules
from .workflow_analyzer import WorkflowAnalyzer

__all__ = [
    'N8nSecurityRules',
    'WorkflowAnalyzer'
]

