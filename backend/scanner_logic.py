import os
import json
import re
import ast
import yaml
from concurrent.futures import ThreadPoolExecutor
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List, Dict
from dataclasses import dataclass, asdict

load_dotenv()

# --- Data Structures & Static Analysis (Correct as-is) ---
@dataclass
class Risk:
    file_path: str; line_number: int; risk_type: str; severity: str; message: str; suggestion: str; source: str
class StaticRiskDetector(ast.NodeVisitor):
    CRITICAL_CALLS = {'eval', 'exec', 'os.system'}
    def __init__(self, file_path: str): self.file_path = file_path; self.risks: List[Risk] = []
    def visit_Call(self, node: ast.Call):
        func_name = self._get_function_name(node)
        if func_name in self.CRITICAL_CALLS:
            self.risks.append(Risk(self.file_path, node.lineno, 'Code Execution', 'critical', f'Critical: Use of dangerous function `{func_name}` detected.', f'Replace `{func_name}` with safer alternatives.', 'static'))
        self.generic_visit(node)
    def _get_function_name(self, node: ast.Call) -> str:
        if isinstance(node.func, ast.Name): return node.func.id
        elif isinstance(node.func, ast.Attribute): return node.func.attr
        return ""

def repair_json(text: str) -> str:
    match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', text, re.DOTALL)
    if match: return match.group(1)
    return text

def parse_response(raw_output: str) -> List[Dict]:
    try:
        repaired = repair_json(raw_output)
        data = json.loads(repaired)
        return data.get("findings", [])
    except (json.JSONDecodeError, ValueError) as e:
        print(f"❌ Failed to parse AI response: {e}")
        return []

# --- The Multi-Prompt Orchestrator ---

def run_ai_specialist(specialist_prompt: str, code: str) -> List[Dict]:
    """Runs a single, specialized prompt against the Gemini API."""
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        full_prompt = f"{specialist_prompt}\n\nAnalyze the following Python code:\n```python\n{code}\n```"
        response = model.generate_content(full_prompt)
        return parse_response(response.text)
    except Exception as e:
        print(f"❌ AI specialist call failed: {e}")
        return []

def get_ai_analysis(code: str) -> Dict:
    """Orchestrates the 'Team of Specialists' to run in parallel."""
    print("🧠 Orchestrating AI 'Team of Specialists' analysis...")
    
    base_prompt = """
    You are a world-class cybersecurity expert. Analyze the provided Python code ONLY for the specific vulnerability class mentioned below.
    If you find one or more vulnerabilities of this specific class, respond with a JSON object in a ```json ... ``` block.
    The JSON object must contain a single key "findings", which is a list of objects. Each object in the list must have the following keys:
    - "title": A short, descriptive title of the vulnerability.
    - "description": A concise paragraph explaining the vulnerability in the context of the code.
    - "impact": A paragraph explaining the business and security impact if exploited.
    - "implementation_guide": A detailed, multi-line string containing a complete, commented code example for the fix. Use markdown for code blocks.
    - "priority": A string: "high", "medium", or "low".
    - "severity": A string: "critical", "medium", or "low".
    If you find NO vulnerabilities of this class, respond with an empty JSON object: {}.
    """
    
    specialist_prompts = [
        {"name": "Command Injection", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Command Injection & Arbitrary Code Execution.** Focus on risks from `os.system`, `eval`, `exec`, `subprocess` with `shell=True`, etc."},
        {"name": "Data Leakage", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Data Leakage & Insecure File Handling.** Focus on risks from hardcoded secrets, insecure file I/O (`open`, `os.remove`), path traversal, and unencrypted network calls (`requests`)."},
        {"name": "Authorization", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Authorization & IDOR.** Focus on how user identity is used. Does the code improperly trust user-supplied IDs to perform actions?"},
        {"name": "Resilience", "prompt": f"{base_prompt}\n**VULNERABILITY CLASS: Error Handling & Resilience.** Focus on missing `try...except` blocks, information disclosure through verbose errors, and potential for Denial of Service attacks."},
        {"name": "Workflow", "prompt": "You are a system architect. Analyze the provided Python code and describe its workflow. Respond with a JSON object in a ```json ... ``` block. The object must contain a key 'workflow' with the following keys: 'systemOverview' (a paragraph summary), 'nodes' (a list of objects with 'id', 'label', 'type'), and 'connections' (a list of objects with 'source', 'target', 'label')."}
    ]

    contextual_findings = []
    workflow_analysis = {}
    
    with ThreadPoolExecutor(max_workers=len(specialist_prompts)) as executor:
        futures = {executor.submit(run_ai_specialist, p["prompt"], code): p["name"] for p in specialist_prompts}
        for future in futures:
            specialist_name = futures[future]
            try:
                result = future.result()
                if specialist_name == "Workflow":
                    workflow_analysis = result.get("workflow", {}) if result else {}
                else:
                    contextual_findings.extend(result)
                print(f"   ✅ Specialist '{specialist_name}' completed.")
            except Exception as e:
                print(f"   ❌ Specialist '{specialist_name}' failed: {e}")

    return {
        "contextualFindings": contextual_findings,
        "workflowAnalysis": workflow_analysis,
    }

# --- The Main Orchestrator Function ---

def run_scan_on_file(file_path: str) -> dict:
    try:
        print(f"🔍 Starting full scan on: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f: code = f.read()

        # --- Run Analyses in Parallel ---
        with ThreadPoolExecutor(max_workers=2) as executor:
            static_future = executor.submit(lambda: [asdict(r) for r in StaticRiskDetector(file_path).visit(ast.parse(code)) or []])
            ai_future = executor.submit(get_ai_analysis, code)
            
            static_findings = static_future.result()
            print(f"   Found {len(static_findings)} static risk patterns.")
            
            ai_analysis_results = ai_future.result()

        if not ai_analysis_results:
            return {"error": "Failed to get analysis from AI.", "success": False, "file_path": os.path.basename(file_path)}

        # --- Aggregate and Format the Final Report ---
        print("📋 Assembling final report...")
        contextual_findings = ai_analysis_results.get("contextualFindings", [])
        all_risks = contextual_findings + static_findings
        
        # Simple annotation logic (can be improved)
        annotated_code = f"# AI Security Analysis Summary\n# {len(contextual_findings)} recommendations found.\n\n" + code

        result = {
            "success": True,
            "scanName": f"{os.path.basename(file_path)} Scan", # Default name
            "totalFiles": 1,
            "linesOfCode": len(code.splitlines()),
            "contextualFindings": contextual_findings,
            "staticFindings": static_findings,
            "workflowAnalysis": ai_analysis_results.get("workflowAnalysis", {}),
            "annotatedCode": {os.path.basename(file_path): annotated_code},
            "message": f"Successfully analyzed {os.path.basename(file_path)}",
            # Add other top-level fields for the header
            "risks_count": len(all_risks),
        }
        print("✅ Full scan complete.")
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "success": False, "file_path": file_path}