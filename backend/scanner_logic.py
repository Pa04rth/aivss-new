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

load_dotenv()

@dataclass
class Risk:
    file_path: str; line_number: int; risk_type: str; severity: str; message: str; suggestion: str; source: str

class StaticRiskDetector(ast.NodeVisitor):
    CRITICAL_CALLS = {'eval', 'exec', 'os.system', 'os.remove'}
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.risks: List[Risk] = []

    def visit_Call(self, node: ast.Call):
        func_name = self._get_function_name(node)
        if func_name in self.CRITICAL_CALLS:
            self.risks.append(Risk(
                file_path=os.path.basename(self.file_path),
                line_number=node.lineno,
                risk_type='Code Execution Vulnerability',
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
        print(f"❌ Failed to parse AI response for key '{expected_key}': {e}")
        return [] if expected_key != "workflow" else {}

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
    The JSON object must contain a single key "findings", which is a list of objects. Each object must have keys: "title", "description", "impact", "implementation_guide", "priority", "severity".
    If you find NO vulnerabilities of this class, respond with: {"findings": []}.
    """
    
    specialist_prompts = [
        {"name": "Code Execution", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Command Injection & Arbitrary Code Execution.**", "key": "findings"},
        {"name": "Data & Files", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Data Leakage, SSRF, & Insecure File Handling.**", "key": "findings"},
        {"name": "Authorization", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Authorization, IDOR, and trust boundaries.**", "key": "findings"},
        {"name": "Resilience", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Error Handling, Logging, & Resilience.**", "key": "findings"},
        {"name": "Workflow", "prompt": "You are a system architect. Analyze this Python code. Respond with a JSON object in a ```json ... ``` block with a key 'workflow' containing: 'systemOverview' (a paragraph summary), 'nodes' (list of {'id', 'label', 'type', 'description'}), and 'connections' (list of {'source', 'target', 'label'}).", "key": "workflow"}
    ]

    contextual_findings = []
    workflow_analysis = {}
    
    with ThreadPoolExecutor(max_workers=len(specialist_prompts)) as executor:
        futures = {executor.submit(run_ai_specialist, p["prompt"], code, api_key, p["key"]): p["name"] for p in specialist_prompts}
        for future in futures:
            specialist_name = futures[future]
            try:
                result = future.result()
                if specialist_name == "Workflow": workflow_analysis = result
                else: contextual_findings.extend(result)
                print(f"   ✅ Specialist '{specialist_name}' completed.")
            except Exception as e:
                print(f"   ❌ Specialist '{specialist_name}' failed: {e}")

    return {"contextualFindings": contextual_findings, "workflowAnalysis": workflow_analysis}

def create_annotated_code(code: str, static_findings: List[Dict], ai_findings: List[Dict]) -> str:
    lines = code.splitlines()
    ai_summary = ["# AI Security Analysis Summary", "# Generated by AutoHardener Security Scanner", "# Recommendations:"]
    for i, finding in enumerate(ai_findings, 1):
        ai_summary.append(f"# {i}. {finding['title']}: {finding['description']}")
    ai_summary.append("# End AI Summary\n")
    
    for finding in sorted(static_findings, key=lambda x: x['line_number'], reverse=True):
        line_idx = finding['line_number'] - 1
        if 0 <= line_idx < len(lines):
            indent = len(lines[line_idx]) - len(lines[line_idx].lstrip())
            comment = " " * indent + f"# STATIC FINDING: {finding['message']}"
            lines.insert(line_idx, comment)
            
    return "\n".join(ai_summary + lines)

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
        annotated_code_str = create_annotated_code(code, static_findings, contextual_findings)
        
        frameworks = {"Crew": code.count("Crew"), "Task": code.count("Task"), "Agent": code.count("Agent"), "tools": 0, "CrewAI": 0}
        
        workflow = ai_analysis_results.get("workflowAnalysis", {})
        workflow['frameworks'] = frameworks

        all_risks = contextual_findings + static_findings

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
            "annotatedCode": {os.path.basename(file_path): annotated_code_str},
            "risks_count": len(all_risks),
            "constraints_count": len(contextual_findings),
            "message": f"Successfully analyzed {os.path.basename(file_path)}",
            "risks": all_risks, # Add full risks list for scoring
        }
        print("✅ Full scan complete.")
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "success": False, "file_path": os.path.basename(file_path)}