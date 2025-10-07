# backend/test_agents/vulnerable_api_agent.py
import requests
import os

# INSECURE: API key is hardcoded directly in the source file.
API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

def query_external_service(user_query: str):
    """
    Queries an external service using a hardcoded API key and user input.
    """
    # INSECURE: The URL is constructed with user input without validation.
    # This is a vector for Server-Side Request Forgery (SSRF).
    url = f"http://api.internal-service.com/data?query={user_query}"
    
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    # INSECURE: The request is made over HTTP, not HTTPS.
    response = requests.get(url, headers=headers)
    
    return response.text