import os
import json
import re
import ast
from concurrent.futures import ThreadPoolExecutor
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List, Dict
from dataclasses import dataclass, asdict
from datetime import datetime
from aivss_analyzer import analyze_aivss

load_dotenv()

# --- Data Structures & Static Analysis ---
@dataclass
class Risk:
    file_path: str; line_number: int; risk_type: str; severity: str; message: str; suggestion: str; source: str

class StaticRiskDetector(ast.NodeVisitor):
    CRITICAL_CALLS = {'eval', 'exec', 'os.system', 'os.remove', 'shutil.rmtree'}
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.risks: List[Risk] = []

    def visit_Call(self, node: ast.Call):
        func_name = self._get_function_name(node)
        if func_name in self.CRITICAL_CALLS:
            self.risks.append(Risk(
                file_path=os.path.basename(self.file_path),
                line_number=node.lineno,
                risk_type=f'Code Execution Vulnerability ({func_name})',
                severity='critical',
                message=f'Critical: Use of dangerous function `{func_name}` detected.',
                suggestion=f'Replace `{func_name}` with safer alternatives.',
                source='static'
            ))
        self.generic_visit(node)
        return self.risks

    def _get_function_name(self, node: ast.Call) -> str:
        if isinstance(node.func, ast.Name): return node.func.id
        elif isinstance(node.func, ast.Attribute): return node.func.attr
        return ""

# --- Helper Functions ---
def repair_json(text: str) -> str:
    match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', text, re.DOTALL)
    if match: return match.group(1).strip()
    return text

def parse_ai_response(raw_output: str, expected_key: str):
    try:
        repaired = repair_json(raw_output)
        data = json.loads(repaired)
        return data.get(expected_key, []) if expected_key != "workflow" else data.get(expected_key, {})
    except (json.JSONDecodeError, ValueError) as e:
        print(f"❌ Failed to parse AI response for key '{expected_key}': {e}\nRaw Response:\n{raw_output}")
        return [] if expected_key != "workflow" else {}

# --- The Multi-Prompt Orchestrator ---

def run_ai_specialist(specialist_prompt: str, code: str, api_key: str, expected_key: str):
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-pro')
        full_prompt = f"{specialist_prompt}\n\nAnalyze the following Python code:\n```python\n{code}\n```"
        response = model.generate_content(full_prompt)
        return parse_ai_response(response.text, expected_key)
    except Exception as e:
        raise e

def get_ai_analysis(code: str) -> Dict:
    print("🧠 Orchestrating AI 'Team of Specialists' analysis...")
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ CRITICAL: GOOGLE_API_KEY not found. AI analysis will be skipped.")
        return {"contextualFindings": [], "workflowAnalysis": {}}

    base_prompt = """
    You are a world-class cybersecurity expert. Analyze the provided Python code ONLY for the specific vulnerability class mentioned below.
    If you find one or more vulnerabilities of this specific class, respond with a JSON object in a ```json ... ``` block.
    The JSON object MUST contain a single key "findings", which is a list of objects. Each object MUST have keys: "title", "description", "impact", "implementation_guide", "priority", and "severity".
    If you find NO vulnerabilities of this class, respond with: {"findings": []}.
    """
    
    specialist_prompts = [
        {"name": "Threat Hunter", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Direct & Critical Exploits.** Focus on immediate, high-impact vulnerabilities like Code Injection, Command Injection, Path Traversal, and SSRF.", "key": "findings"},
        {"name": "Authorization Expert", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Authorization Flaws.** Focus on how user identity is trusted. Look for Insecure Direct Object Reference (IDOR) or Authorization Bypass vulnerabilities.", "key": "findings"},
        {"name": "Input Validator", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Taint Analysis & Input Validation.** Trace user-controlled inputs to sensitive functions ('sinks'). Identify any path where 'tainted' data is used without sanitization.", "key": "findings"},
        {"name": "Resilience Engineer", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Error Handling & Resilience.** Focus on missing `try...except` blocks, information disclosure via verbose errors, and potential for Denial of Service.", "key": "findings"},
        {"name": "Workflow Architect", "prompt": "You are a system architect. Analyze this Python code. Respond with a JSON object in a ```json ... ``` block with a key 'workflow' containing: 'systemOverview' (a paragraph summary), 'nodes' (list of {'id', 'label', 'type', 'description'}), and 'connections' (list of {'source', 'target', 'label'}).", "key": "workflow"},
        {"name": "AARS Assessor", "prompt": """You are an AI Agent Risk Assessment specialist. Analyze the provided Python code for AI-specific risk factors. Respond with a JSON object in a ```json ... ``` block with a key 'aars_analysis' containing detailed assessment of the 10 AARS factors:

1. autonomy_of_action: Agent's ability to act without human intervention (0.0=none, 0.5=limited, 1.0=full)
2. tool_use: Agent's capability to use external tools (0.0=none, 0.5=limited, 1.0=extensive)
3. memory_use: Agent's use of persistent memory (0.0=none, 0.5=temporary, 1.0=persistent)
4. dynamic_identity: Agent's ability to change roles/permissions (0.0=static, 0.5=limited, 1.0=dynamic)
5. multi_agent_interactions: Agent's coordination with other agents (0.0=none, 0.5=basic, 1.0=complex)
6. non_determinism: Unpredictability of agent behavior (0.0=deterministic, 0.5=somewhat, 1.0=highly)
7. self_modification: Agent's potential to alter its own code (0.0=none, 0.5=config, 1.0=code)
8. goal_driven_planning: Agent's capacity to create/execute plans (0.0=none, 0.5=simple, 1.0=complex)
9. contextual_awareness: Agent's sensitivity to environment (0.0=none, 0.5=basic, 1.0=advanced)
10. opacity_and_reflexivity: "Black box" nature of reasoning (0.0=transparent, 0.5=somewhat, 1.0=opaque)

For each factor, provide: "value" (0.0/0.5/1.0), "reasoning" (explanation), and "confidence" (0.0-1.0).""", "key": "aars_analysis"}
    ]

    contextual_findings = []
    workflow_analysis = {}
    aars_analysis = {}
    
    with ThreadPoolExecutor(max_workers=len(specialist_prompts)) as executor:
        futures = {executor.submit(run_ai_specialist, p["prompt"], code, api_key, p["key"]): p["name"] for p in specialist_prompts}
        for future in futures:
            specialist_name = futures[future]
            try:
                result = future.result()
                if specialist_name == "Workflow Architect":
                    workflow_analysis = result
                elif specialist_name == "AARS Assessor":
                    aars_analysis = result
                else:
                    contextual_findings.extend(result)
                print(f"   ✅ Specialist '{specialist_name}' completed.")
            except Exception as e:
                print(f"   ❌ Specialist '{specialist_name}' failed: {e}")

    return {"contextualFindings": contextual_findings, "workflowAnalysis": workflow_analysis, "aarsAnalysis": aars_analysis}

def create_annotated_code(code: str, static_findings: List[Dict], ai_findings: List[Dict]) -> str:
    lines = code.splitlines()
    ai_summary = ["# AI Security Analysis Summary", "# Generated by AutoHardener Security Scanner", "# Recommendations:"]
    for i, finding in enumerate(ai_findings, 1):
        # Format the complex implementation guide into a more readable comment block
        guide_lines = finding.get('implementation_guide', 'No guide available.').split('\n')
        formatted_guide = '\n# '.join(guide_lines)
        ai_summary.append(f"# {i}. {{'title': '{finding.get('title')}', 'description': '{finding.get('description')}', 'implementation_guide': '{formatted_guide}', 'priority': '{finding.get('priority')}'}}")
    ai_summary.append("# End Hardened Code")
    
    for finding in sorted(static_findings, key=lambda x: x['line_number'], reverse=True):
        line_idx = finding['line_number'] - 1
        if 0 <= line_idx < len(lines):
            indent = len(lines[line_idx]) - len(lines[line_idx].lstrip())
            comment = " " * indent + f"# {finding['message']} # 💡 {finding['suggestion']}"
            lines.insert(line_idx + 1, comment) # Insert comment after the line
            
    return "\n".join(ai_summary + [""] + lines)

# --- The Main Orchestrator Function ---

def run_scan_on_file(file_path: str) -> dict:
    try:
        start_time = datetime.now()
        print(f"🔍 Starting full scan on: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f: code = f.read()

        detector = StaticRiskDetector(file_path)
        static_findings_raw = detector.visit(ast.parse(code))
        static_findings = [asdict(r) for r in static_findings_raw] if static_findings_raw else []
        print(f"   Found {len(static_findings)} static risk patterns.")

        ai_analysis_results = get_ai_analysis(code)
        
        if not ai_analysis_results:
            return {"error": "Failed to get analysis from AI.", "success": False, "file_path": os.path.basename(file_path)}

        print("📋 Assembling final report...")
        contextual_findings = ai_analysis_results.get("contextualFindings", [])
        workflow_analysis = ai_analysis_results.get("workflowAnalysis", {})
        aars_analysis = ai_analysis_results.get("aarsAnalysis", {})
        
        annotated_code_str = create_annotated_code(code, static_findings, contextual_findings)
        
        frameworks = {"Crew": code.count("Crew"), "Task": code.count("Task"), "Agent": code.count("Agent"), "tools": 0, "CrewAI": 0}
        
        workflow = workflow_analysis
        workflow['frameworks'] = frameworks

        # Combine all findings for the main 'risks' array used by the dashboard
        all_risks = contextual_findings + static_findings

        # Perform AIVSS Analysis
        print("🎯 Performing AIVSS analysis...")
        aivss_results = analyze_aivss(code, contextual_findings, workflow_analysis)
        
        if not aivss_results.get("success", False):
            print(f"⚠️ AIVSS analysis failed: {aivss_results.get('error', 'Unknown error')}")
            aivss_results = {"success": False, "message": "AIVSS analysis unavailable"}

        result = {
            "success": True,
            "scanName": f"{os.path.basename(file_path)} Scan",
            "scanCreated": start_time.isoformat(),
            "scanCompleted": datetime.now().isoformat(),
            "totalFiles": 1,
            "linesOfCode": len(code.splitlines()),
            "contextualFindings": contextual_findings,
            "staticFindings": static_findings,
            "workflowAnalysis": workflow,
            "aarsAnalysis": aars_analysis,
            "aivssAnalysis": aivss_results,
            "annotatedCode": {os.path.basename(file_path): annotated_code_str},
            "risks_count": len(all_risks),
            "constraints_count": len(contextual_findings), # This is an approximation
            "message": f"Successfully analyzed {os.path.basename(file_path)}",
            "risks": all_risks, 
        }
        
        print(f"🔍 [DEBUG] Scanner: Generated result with keys: {list(result.keys())}")
        print(f"🔍 [DEBUG] Scanner: Has contextualFindings: {bool(result.get('contextualFindings'))}")
        print(f"🔍 [DEBUG] Scanner: Has staticFindings: {bool(result.get('staticFindings'))}")
        print(f"🔍 [DEBUG] Scanner: Has aivssAnalysis: {bool(result.get('aivssAnalysis'))}")
        print(f"🔍 [DEBUG] Scanner: Has aarsAnalysis: {bool(result.get('aarsAnalysis'))}")
        print(f"🔍 [DEBUG] Scanner: Contextual findings count: {len(result.get('contextualFindings', []))}")
        print(f"🔍 [DEBUG] Scanner: Static findings count: {len(result.get('staticFindings', []))}")
        if result.get('aivssAnalysis'):
            print(f"🔍 [DEBUG] Scanner: AIVSS analysis success: {result['aivssAnalysis'].get('success', False)}")
        if result.get('aarsAnalysis'):
            print(f"🔍 [DEBUG] Scanner: AARS analysis keys: {list(result['aarsAnalysis'].keys()) if isinstance(result['aarsAnalysis'], dict) else 'Not a dict'}")
        print("✅ Full scan complete.")
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "success": False, "file_path": os.path.basename(file_path)}