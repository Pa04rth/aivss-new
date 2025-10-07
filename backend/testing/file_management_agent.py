# backend/test_agents/file_management_agent.py
import os

def delete_user_file(username: str, filename: str):
    """
    Deletes a specific file from a user's directory.
    This is highly vulnerable to path traversal.
    """
    # INSECURE: Path is constructed directly from user input.
    # An attacker could provide a filename like '../../etc/passwd'
    # to delete critical system files.
    file_path = os.path.join("/var/data/users", username, filename)
    
    print(f"Attempting to delete: {file_path}")
    
    # INSECURE: os.remove is a dangerous operation when used with unvalidated input.
    os.remove(file_path)
    
    return f"File {filename} deleted."