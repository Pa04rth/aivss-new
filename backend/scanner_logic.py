import os
import json
import re
import ast
import yaml
import faiss
from sentence_transformers import SentenceTransformer
from google import genai
from dotenv import load_dotenv
from typing import List, Dict
from dataclasses import dataclass, asdict
from pathlib import Path

load_dotenv()

@dataclass
class Risk:
    file_path: str
    line_number: int
    risk_type: str
    severity: str
    message: str
    suggestion: str
    source: str

class StaticRiskDetector(ast.NodeVisitor):
    CRITICAL_CALLS = {'eval', 'exec', 'compile', 'subprocess.call', 'os.system', 'os.remove', 'shutil.rmtree'}
    MEDIUM_RISK_PATTERNS = {'bind_tools', 'tools_by_name', 'open'}
    LOW_RISK_PATTERNS = {'requests.get', 'urllib.request'}
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.risks: List[Risk] = []

    def visit_Call(self, node: ast.Call):
        line_no = getattr(node, 'lineno', 0)
        func_name = self._get_function_name(node)
        if func_name: self._check_risk_patterns(func_name, line_no)
        self.generic_visit(node)

    def _get_function_name(self, node: ast.Call) -> str:
        if isinstance(node.func, ast.Name): return node.func.id
        elif isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name): return f"{node.func.value.id}.{node.func.attr}"
            return node.func.attr
        return ""

    def _check_risk_patterns(self, func_name: str, line_no: int):
        if func_name in self.CRITICAL_CALLS:
            self.risks.append(Risk(self.file_path, line_no, 'critical_security', 'critical', f'🚨 Critical: {func_name}() detected', 'Review usage, validate inputs, or use safer alternatives.', 'static'))
        elif any(p in func_name for p in self.MEDIUM_RISK_PATTERNS):
            pattern = next(p for p in self.MEDIUM_RISK_PATTERNS if p in func_name)
            self.risks.append(Risk(self.file_path, line_no, 'medium_security', 'medium', f'⚠️ Medium risk: {pattern} usage', 'Ensure inputs are sanitized and paths are validated.', 'static'))
        elif any(p in func_name for p in self.LOW_RISK_PATTERNS):
            pattern = next(p for p in self.LOW_RISK_PATTERNS if p in func_name)
            self.risks.append(Risk(self.file_path, line_no, 'low_security', 'low', f'ℹ️ Low risk: {pattern} usage', 'Ensure secure protocols (HTTPS) and validate URLs.', 'static'))

def extract_metadata_from_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f: code = f.read()
    agent_card = {"name": os.path.basename(filepath).replace('.py', ''), "description": f"AI agent from {filepath}"}
    tool_schema = {"tools": "Various tools and functions defined in the agent"}
    return agent_card, tool_schema, code

def repair_json(text: str) -> str:
    match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', text)
    if match: text = match.group(1)
    start, end = text.find('{'), text.rfind('}')
    if start != -1 and end != -1: return text[start:end+1]
    return text

def parse_guardrail_response(raw_output: str) -> dict:
    try:
        repaired = repair_json(raw_output)
        return json.loads(repaired)
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}")
        raise ValueError("Could not parse JSON from Gemini's response")

def get_guardrails(agent_data, tool_data, routing_logic, retrieved_context=""):
    print("🧠 Calling Google Gemini for AI-powered analysis...")
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")

    # Correct, modern initialization
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro-latest')
    
    user_prompt = f"""
    You are a security auditor for AI agents. Your task is to perform a comprehensive security analysis on the provided Python code and return your findings in a structured JSON format.

    **Phase 1: Comprehension**
    First, understand the provided agent's code (`routing_logic`). Analyze its purpose, structure, user inputs, and how it handles data and external tools.

    **Phase 2: Security Recommendations**
    Based on your analysis, identify vulnerabilities and suggest mitigations. Focus on:
    - **Prompt Injection:** Lack of input sanitization, overly broad prompts, agents with excessive permissions.
    - **Tool Misuse:** Unsafe execution of tools, binding to unvalidated external services.
    - **Sensitive Code Execution:** Use of `eval()`, `exec()`, `os.system()` without strict validation.
    - **Data Leakage:** Unsafe file operations (`open()`, `os.remove()`) or network requests.

    **JSON Response Format:**
    You MUST respond with ONLY a single, valid JSON object inside ```json ... ``` code fences. Do not add any text before or after the JSON block.

    ```json
    {{
      "constraints": [
        {{
          "description": "Brief description of a recommended security constraint.",
          "severity": "critical|medium|low"
        }}
      ],
      "risks": [
        {{
          "description": "Brief description of an identified risk.",
          "severity": "critical|medium|low",
          "impact": "Brief description of the potential impact if exploited."
        }}
      ],
      "hardened_code": [
        "# A clear comment explaining the security fix.",
        "def suggested_secure_function():",
        "    # Example of hardened code",
        "    return 'safe output'"
      ]
    }}
    ```

    **Analysis Context:**
    Agent Metadata: {agent_data}
    Tool Schema: {tool_data}
    Relevant Security Threats (from OWASP): {retrieved_context}

    **Agent Code to Analyze:**
    ```python
    {routing_logic}
    ```
    """
    
    try:
        response = model.generate_content(user_prompt)
        print("✅ Received analysis from Gemini.")
        return parse_guardrail_response(response.text)
    except Exception as e:
        print(f"❌ Gemini API call failed: {e}")
        return None

def run_scan_on_file(file_path: str) -> dict:
    try:
        print(f"🔍 Starting full scan on: {file_path}")
        print("📊 Phase 1: Running static pattern detection...")
        detector = StaticRiskDetector(file_path)
        with open(file_path, 'r', encoding='utf-8') as f: tree = ast.parse(f.read())
        detector.visit(tree)
        static_risks = [asdict(risk) for risk in detector.risks]
        print(f"   Found {len(static_risks)} static risk patterns.")

        agent_card, tool_schema, routing_logic = extract_metadata_from_file(file_path)
        retrieved_context = "Context about prompt injection and insecure tool use."
        ai_results = get_guardrails(json.dumps(agent_card), json.dumps(tool_schema), routing_logic, retrieved_context)
        
        if not ai_results: return {"error": "Failed to get analysis from AI.", "success": False, "file_path": os.path.basename(file_path)}
        
        print("📋 Phase 3: Combining static and AI analysis results...")
        all_risks = ai_results.get("risks", []) + static_risks
        
        result = {
            "success": True,
            "file_path": os.path.basename(file_path),
            "constraints_count": len(ai_results.get("constraints", [])),
            "risks_count": len(all_risks),
            "constraints": ai_results.get("constraints", []),
            "risks": all_risks,
            "hardened_code": ai_results.get("hardened_code", []),
            "message": f"Successfully analyzed {os.path.basename(file_path)}"
        }
        print("✅ Full scan complete.")
        return result
        
    except Exception as e:
        print(f"❌ Top-level scanner error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "success": False, "file_path": file_path}