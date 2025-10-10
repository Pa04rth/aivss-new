"""
AIVSS Analysis Module
====================

This module provides comprehensive AIVSS (AI Vulnerability Scoring System) analysis
by determining the 22 parameters required for the AIVSS Calculator API and
integrating with the scoring system.

The module includes:
- AARS factor assessment (10 AI-specific risk factors)
- CVSS v4.0 parameter mapping (11 traditional security metrics)
- Threat multiplier determination (1 environmental factor)
- AIVSS Calculator API integration
"""

import os
import json
import requests
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AIVSSParameters:
    """Data structure for all 22 AIVSS parameters"""
    # CVSS v4.0 Base Metrics (11 parameters)
    AV: str  # Attack Vector: N, A, L, P
    AC: str  # Attack Complexity: L, H
    AT: str  # Attack Requirements: N, P
    PR: str  # Privileges Required: N, L, H
    UI: str  # User Interaction: N, P, A
    VC: str  # Vulnerable System Confidentiality: H, L, N
    VI: str  # Vulnerable System Integrity: H, L, N
    VA: str  # Vulnerable System Availability: H, L, N
    SC: str  # Subsequent System Confidentiality: H, L, N
    SI: str  # Subsequent System Integrity: H, L, N
    SA: str  # Subsequent System Availability: H, L, N
    
    # AARS Factors (10 parameters)
    autonomy_of_action: float  # 0.0, 0.5, 1.0
    tool_use: float
    memory_use: float
    dynamic_identity: float
    multi_agent_interactions: float
    non_determinism: float
    self_modification: float
    goal_driven_planning: float
    contextual_awareness: float
    opacity_and_reflexivity: float
    
    # Threat Multiplier (1 parameter)
    threatMultiplier: float  # 1.0, 0.97, 0.91

@dataclass
class AIVSSResult:
    """Result structure from AIVSS Calculator API"""
    aivssScore: float
    aarsScore: float
    cvssScore: float
    cvssVectorString: str
    aivssVectorString: str
    reportUrl: str

class AIVSSAnalyzer:
    """Main AIVSS analysis orchestrator"""
    
    def __init__(self, api_base_url: str = "https://api.aivss.parthsohaney.online"):
        self.api_base_url = api_base_url
        self.api_endpoint = f"{api_base_url}/api/calculate"
        
    def analyze_findings_to_cvss_parameters(self, findings: List[Dict]) -> Dict[str, str]:
        """
        Map security findings to CVSS v4.0 parameters
        
        Args:
            findings: List of security findings from AI analysis
            
        Returns:
            Dictionary of CVSS parameters
        """
        logger.info("🔍 Mapping findings to CVSS v4.0 parameters...")
        
        # Initialize with default values (most conservative)
        cvss_params = {
            "AV": "N",  # Network (most accessible)
            "AC": "L",  # Low complexity
            "AT": "N",  # No special requirements
            "PR": "N",  # No privileges required
            "UI": "N",  # No user interaction
            "VC": "N",  # No confidentiality impact
            "VI": "N",  # No integrity impact
            "VA": "N",  # No availability impact
            "SC": "N",  # No subsequent confidentiality impact
            "SI": "N",  # No subsequent integrity impact
            "SA": "N"   # No subsequent availability impact
        }
        
        # Analyze findings to determine parameters
        for finding in findings:
            severity = finding.get('severity', 'low').lower()
            title = finding.get('title', '').lower()
            description = finding.get('description', '').lower()
            
            # Attack Vector (AV) - How can the attacker reach the vulnerability?
            if any(keyword in title + description for keyword in ['network', 'api', 'http', 'web', 'remote']):
                cvss_params["AV"] = "N"  # Network
            elif any(keyword in title + description for keyword in ['local', 'file', 'process']):
                cvss_params["AV"] = "L"  # Local
            elif any(keyword in title + description for keyword in ['adjacent', 'lan', 'same network']):
                cvss_params["AV"] = "A"  # Adjacent
            
            # Attack Complexity (AC) - How complex is the attack?
            if any(keyword in title + description for keyword in ['complex', 'difficult', 'requires', 'multiple']):
                cvss_params["AC"] = "H"  # High complexity
            else:
                cvss_params["AC"] = "L"  # Low complexity
            
            # Attack Requirements (AT) - Are special requirements needed?
            if any(keyword in title + description for keyword in ['privilege', 'admin', 'root', 'special']):
                cvss_params["AT"] = "P"  # Present
            else:
                cvss_params["AT"] = "N"  # None
            
            # Privileges Required (PR) - What privileges does the attacker need?
            if any(keyword in title + description for keyword in ['admin', 'root', 'elevated']):
                cvss_params["PR"] = "H"  # High privileges
            elif any(keyword in title + description for keyword in ['user', 'authenticated']):
                cvss_params["PR"] = "L"  # Low privileges
            else:
                cvss_params["PR"] = "N"  # No privileges
            
            # User Interaction (UI) - Does the attack require user interaction?
            # Based on API testing, valid values are 'N' and 'R'
            if any(keyword in title + description for keyword in ['user', 'click', 'interaction', 'manual']):
                cvss_params["UI"] = "R"  # Required user interaction
            else:
                cvss_params["UI"] = "N"  # No user interaction
            
            # Impact on Vulnerable System (VC, VI, VA)
            if severity in ['critical', 'high']:
                if any(keyword in title + description for keyword in ['data', 'information', 'confidential', 'secret']):
                    cvss_params["VC"] = "H"  # High confidentiality impact
                if any(keyword in title + description for keyword in ['modify', 'change', 'corrupt', 'integrity']):
                    cvss_params["VI"] = "H"  # High integrity impact
                if any(keyword in title + description for keyword in ['crash', 'denial', 'dos', 'availability']):
                    cvss_params["VA"] = "H"  # High availability impact
            
            # Impact on Subsequent Systems (SC, SI, SA)
            # For AI systems, we assume potential impact on connected systems
            if any(keyword in title + description for keyword in ['network', 'connected', 'downstream', 'subsequent']):
                if cvss_params["VC"] == "H":
                    cvss_params["SC"] = "H"
                if cvss_params["VI"] == "H":
                    cvss_params["SI"] = "H"
                if cvss_params["VA"] == "H":
                    cvss_params["SA"] = "H"
        
        logger.info(f"✅ CVSS parameters determined: {cvss_params}")
        return cvss_params
    
    def assess_aars_factors(self, code: str, findings: List[Dict], workflow_analysis: Dict) -> Dict[str, float]:
        """
        Assess the 10 AARS (AI Agent Risk Score) factors
        
        Args:
            code: The source code to analyze
            findings: Security findings from analysis
            workflow_analysis: Workflow analysis results
            
        Returns:
            Dictionary of AARS factors with values 0.0, 0.5, or 1.0
        """
        logger.info("🤖 Assessing AARS factors...")
        
        # Initialize with default values (lowest risk)
        aars_factors = {
            "autonomy_of_action": 0.0,
            "tool_use": 0.0,
            "memory_use": 0.0,
            "dynamic_identity": 0.0,
            "multi_agent_interactions": 0.0,
            "non_determinism": 0.0,
            "self_modification": 0.0,
            "goal_driven_planning": 0.0,
            "contextual_awareness": 0.0,
            "opacity_and_reflexivity": 0.0
        }
        
        code_lower = code.lower()
        
        # 1. Autonomy of Action - Agent's ability to act without human intervention
        if any(keyword in code_lower for keyword in ['autonomous', 'self.execute', 'auto.run', 'independent']):
            aars_factors["autonomy_of_action"] = 1.0
        elif any(keyword in code_lower for keyword in ['scheduled', 'cron', 'timer', 'periodic']):
            aars_factors["autonomy_of_action"] = 0.5
        
        # 2. Tool Use - Agent's capability to use external tools
        if any(keyword in code_lower for keyword in ['tool', 'api', 'request', 'http', 'external']):
            aars_factors["tool_use"] = 1.0
        elif any(keyword in code_lower for keyword in ['file', 'system', 'os.']):
            aars_factors["tool_use"] = 0.5
        
        # 3. Memory Use - Agent's use of persistent memory
        if any(keyword in code_lower for keyword in ['memory', 'cache', 'store', 'persist', 'database']):
            aars_factors["memory_use"] = 1.0
        elif any(keyword in code_lower for keyword in ['session', 'state', 'variable']):
            aars_factors["memory_use"] = 0.5
        
        # 4. Dynamic Identity - Agent's ability to change roles or permissions
        if any(keyword in code_lower for keyword in ['role', 'permission', 'identity', 'auth', 'token']):
            aars_factors["dynamic_identity"] = 1.0
        elif any(keyword in code_lower for keyword in ['user', 'session', 'context']):
            aars_factors["dynamic_identity"] = 0.5
        
        # 5. Multi-Agent Interactions - Agent's ability to coordinate with other agents
        if any(keyword in code_lower for keyword in ['agent', 'multi', 'coordinate', 'collaborate', 'crew']):
            aars_factors["multi_agent_interactions"] = 1.0
        elif any(keyword in code_lower for keyword in ['team', 'group', 'network']):
            aars_factors["multi_agent_interactions"] = 0.5
        
        # 6. Non-Determinism - The unpredictability of the agent's behavior
        if any(keyword in code_lower for keyword in ['random', 'stochastic', 'probabilistic', 'uncertain']):
            aars_factors["non_determinism"] = 1.0
        elif any(keyword in code_lower for keyword in ['conditional', 'if', 'else', 'switch']):
            aars_factors["non_determinism"] = 0.5
        
        # 7. Self-Modification - Agent's potential to alter its own code
        if any(keyword in code_lower for keyword in ['eval', 'exec', 'compile', 'modify', 'update']):
            aars_factors["self_modification"] = 1.0
        elif any(keyword in code_lower for keyword in ['config', 'parameter', 'setting']):
            aars_factors["self_modification"] = 0.5
        
        # 8. Goal-Driven Planning - Agent's capacity to create and execute plans
        if any(keyword in code_lower for keyword in ['plan', 'goal', 'objective', 'strategy', 'task']):
            aars_factors["goal_driven_planning"] = 1.0
        elif any(keyword in code_lower for keyword in ['step', 'process', 'workflow']):
            aars_factors["goal_driven_planning"] = 0.5
        
        # 9. Contextual Awareness - Agent's sensitivity to its environment
        if any(keyword in code_lower for keyword in ['context', 'environment', 'surrounding', 'aware']):
            aars_factors["contextual_awareness"] = 1.0
        elif any(keyword in code_lower for keyword in ['input', 'sensor', 'detect']):
            aars_factors["contextual_awareness"] = 0.5
        
        # 10. Opacity and Reflexivity - The "black box" nature of the agent's reasoning
        if any(keyword in code_lower for keyword in ['ai', 'model', 'neural', 'ml', 'blackbox']):
            aars_factors["opacity_and_reflexivity"] = 1.0
        elif any(keyword in code_lower for keyword in ['algorithm', 'logic', 'reasoning']):
            aars_factors["opacity_and_reflexivity"] = 0.5
        
        logger.info(f"✅ AARS factors assessed: {aars_factors}")
        return aars_factors
    
    def determine_threat_multiplier(self, findings: List[Dict]) -> float:
        """
        Determine the threat multiplier based on environmental context
        
        Args:
            findings: Security findings from analysis
            
        Returns:
            Threat multiplier value (1.0, 0.97, or 0.91)
        """
        logger.info("🎯 Determining threat multiplier...")
        
        # Check for actively exploited vulnerabilities
        for finding in findings:
            title = finding.get('title', '').lower()
            description = finding.get('description', '').lower()
            
            # Actively exploited (1.0)
            if any(keyword in title + description for keyword in ['exploited', 'active', 'in.wild', 'cve']):
                logger.info("✅ Threat multiplier: 1.0 (Actively Exploited)")
                return 1.0
            
            # Proof of Concept (0.97)
            if any(keyword in title + description for keyword in ['poc', 'proof', 'concept', 'demonstrated']):
                logger.info("✅ Threat multiplier: 0.97 (Proof of Concept)")
                return 0.97
        
        # Default to unreported (0.91)
        logger.info("✅ Threat multiplier: 0.91 (Unreported)")
        return 0.91
    
    def call_aivss_calculator_api(self, parameters: AIVSSParameters) -> Optional[AIVSSResult]:
        """
        Call the AIVSS Calculator API with the determined parameters
        
        Args:
            parameters: AIVSSParameters object with all 22 parameters
            
        Returns:
            AIVSSResult object or None if API call fails
        """
        logger.info("📡 Calling AIVSS Calculator API...")
        
        try:
            # Convert parameters to query string
            params = {
                # CVSS v4.0 parameters
                "AV": parameters.AV,
                "AC": parameters.AC,
                "AT": parameters.AT,
                "PR": parameters.PR,
                "UI": parameters.UI,
                "VC": parameters.VC,
                "VI": parameters.VI,
                "VA": parameters.VA,
                "SC": parameters.SC,
                "SI": parameters.SI,
                "SA": parameters.SA,
                
                # AARS factors
                "autonomy_of_action": parameters.autonomy_of_action,
                "tool_use": parameters.tool_use,
                "memory_use": parameters.memory_use,
                "dynamic_identity": parameters.dynamic_identity,
                "multi_agent_interactions": parameters.multi_agent_interactions,
                "non_determinism": parameters.non_determinism,
                "self_modification": parameters.self_modification,
                "goal_driven_planning": parameters.goal_driven_planning,
                "contextual_awareness": parameters.contextual_awareness,
                "opacity_and_reflexivity": parameters.opacity_and_reflexivity,
                
                # Threat multiplier
                "threatMultiplier": parameters.threatMultiplier
            }
            
            # Make API call
            response = requests.get(self.api_endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            # Parse response
            result_data = response.json()
            
            aivss_result = AIVSSResult(
                aivssScore=result_data.get("aivssScore", 0.0),
                aarsScore=result_data.get("aarsScore", 0.0),
                cvssScore=result_data.get("cvssScore", 0.0),
                cvssVectorString=result_data.get("cvssVectorString", ""),
                aivssVectorString=result_data.get("aivssVectorString", ""),
                reportUrl=result_data.get("reportUrl", "")
            )
            
            logger.info(f"✅ AIVSS API call successful. Score: {aivss_result.aivssScore}")
            return aivss_result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ AIVSS API call failed: {e}")
            return None
        except (KeyError, ValueError) as e:
            logger.error(f"❌ AIVSS API response parsing failed: {e}")
            return None
    
    def perform_comprehensive_aivss_analysis(self, code: str, findings: List[Dict], 
                                           workflow_analysis: Dict) -> Dict[str, Any]:
        """
        Perform comprehensive AIVSS analysis
        
        Args:
            code: Source code to analyze
            findings: Security findings from AI analysis
            workflow_analysis: Workflow analysis results
            
        Returns:
            Dictionary containing AIVSS analysis results
        """
        logger.info("🚀 Starting comprehensive AIVSS analysis...")
        
        try:
            # Step 1: Determine CVSS parameters
            cvss_params = self.analyze_findings_to_cvss_parameters(findings)
            
            # Step 2: Assess AARS factors
            aars_factors = self.assess_aars_factors(code, findings, workflow_analysis)
            
            # Step 3: Determine threat multiplier
            threat_multiplier = self.determine_threat_multiplier(findings)
            
            # Step 4: Create AIVSS parameters object
            aivss_params = AIVSSParameters(
                # CVSS parameters
                AV=cvss_params["AV"],
                AC=cvss_params["AC"],
                AT=cvss_params["AT"],
                PR=cvss_params["PR"],
                UI=cvss_params["UI"],
                VC=cvss_params["VC"],
                VI=cvss_params["VI"],
                VA=cvss_params["VA"],
                SC=cvss_params["SC"],
                SI=cvss_params["SI"],
                SA=cvss_params["SA"],
                
                # AARS factors
                autonomy_of_action=aars_factors["autonomy_of_action"],
                tool_use=aars_factors["tool_use"],
                memory_use=aars_factors["memory_use"],
                dynamic_identity=aars_factors["dynamic_identity"],
                multi_agent_interactions=aars_factors["multi_agent_interactions"],
                non_determinism=aars_factors["non_determinism"],
                self_modification=aars_factors["self_modification"],
                goal_driven_planning=aars_factors["goal_driven_planning"],
                contextual_awareness=aars_factors["contextual_awareness"],
                opacity_and_reflexivity=aars_factors["opacity_and_reflexivity"],
                
                # Threat multiplier
                threatMultiplier=threat_multiplier
            )
            
            # Step 5: Call AIVSS Calculator API
            aivss_result = self.call_aivss_calculator_api(aivss_params)
            
            # Step 6: Compile results
            analysis_results = {
                "success": True,
                "timestamp": datetime.now().isoformat(),
                "parameters": {
                    "cvss": cvss_params,
                    "aars": aars_factors,
                    "threatMultiplier": threat_multiplier
                },
                "scores": {
                    "aivssScore": aivss_result.aivssScore if aivss_result else None,
                    "aarsScore": aivss_result.aarsScore if aivss_result else None,
                    "cvssScore": aivss_result.cvssScore if aivss_result else None,
                    "cvssVectorString": aivss_result.cvssVectorString if aivss_result else "",
                    "aivssVectorString": aivss_result.aivssVectorString if aivss_result else "",
                    "reportUrl": aivss_result.reportUrl if aivss_result else ""
                },
                "apiCallSuccessful": aivss_result is not None,
                "message": "AIVSS analysis completed successfully" if aivss_result else "AIVSS analysis completed but API call failed"
            }
            
            logger.info("✅ Comprehensive AIVSS analysis completed")
            return analysis_results
            
        except Exception as e:
            logger.error(f"❌ AIVSS analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "message": "AIVSS analysis failed"
            }

# Convenience function for easy integration
def analyze_aivss(code: str, findings: List[Dict], workflow_analysis: Dict, 
                 api_base_url: str = "http://localhost:3001") -> Dict[str, Any]:
    """
    Convenience function to perform AIVSS analysis
    
    Args:
        code: Source code to analyze
        findings: Security findings from AI analysis
        workflow_analysis: Workflow analysis results
        api_base_url: Base URL for AIVSS Calculator API
        
    Returns:
        Dictionary containing AIVSS analysis results
    """
    analyzer = AIVSSAnalyzer(api_base_url)
    return analyzer.perform_comprehensive_aivss_analysis(code, findings, workflow_analysis)
