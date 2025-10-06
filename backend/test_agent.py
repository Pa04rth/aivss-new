# backend/test_agent.py
import os

def simple_agent(user_command: str):
    """
    A simple agent that executes a user command.
    This is a dangerous pattern.
    """
    print(f"Executing command: {user_command}")
    os.system(user_command) # This is a critical security risk

if __name__ == "__main__":
    simple_agent("echo 'Hello from the agent!'")