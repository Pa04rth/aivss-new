# backend/test_agents/complex_agent_with_eval.py
import json

def calculate(math_expression: str):
    """
    A calculator agent that uses eval to compute mathematical expressions.
    Extremely dangerous.
    """
    # INSECURE: eval() can execute arbitrary code. An attacker could pass
    # '__import__("os").system("rm -rf /")' as the expression.
    result = eval(math_expression)
    return result

def process_data(user_data: str):
    """
    Processes user data which is expected to be a JSON string
    containing a mathematical expression.
    """
    data = json.loads(user_data)
    expression = data.get("expression")
    
    if expression:
        # The output of one function is used in another, creating a chain.
        calculation_result = calculate(expression)
        return {"status": "success", "result": calculation_result}
    else:
        return {"status": "error", "message": "No expression found"}