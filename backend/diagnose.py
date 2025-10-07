import os
import sys
from dotenv import load_dotenv

# --- TEST 1: ENVIRONMENT AND LIBRARY VERSION ---
print("="*50)
print("🔬 STEP 1: CHECKING PYTHON ENVIRONMENT AND LIBRARY")
print("="*50)

try:
    # This will show us EXACTLY which Python interpreter is being used.
    # It MUST be the one inside your 'venv' folder.
    print(f"🐍 Python Executable: {sys.executable}")

    import google.generativeai as genai
    # This will print the exact version of the library we are using.
    print(f"✅ Successfully imported 'google.generativeai'")
    if hasattr(genai, '__version__'):
        print(f"   Library Version: {genai.__version__}")
    else:
        print("   Warning: Could not determine library version.")

except ImportError as e:
    print(f"❌ CRITICAL FAILURE: Could not import the 'google.generativeai' library.")
    print(f"   Error: {e}")
    print(f"   Please ensure your venv is active and you have run 'pip install -r requirements.txt'")
    sys.exit(1) # Stop the script if the library isn't even installed.

# --- TEST 2: API KEY LOADING ---
print("\n" + "="*50)
print("🔑 STEP 2: CHECKING API KEY")
print("="*50)

load_dotenv()
api_key = os.environ.get("GOOGLE_API_KEY")

if api_key:
    # Print a redacted version of the key to confirm it's being loaded.
    print(f"✅ API Key loaded successfully from .env file.")
    print(f"   Key starts with: {api_key[:4]}... and ends with: ...{api_key[-4:]}")
else:
    print(f"❌ CRITICAL FAILURE: Could not find GOOGLE_API_KEY in your .env file.")
    print(f"   Please ensure the .env file exists in the 'backend' directory and contains your key.")
    sys.exit(1)

# --- TEST 3: THE DIRECT API CALL ---
print("\n" + "="*50)
print("🌐 STEP 3: ATTEMPTING DIRECT API CALL TO LIST MODELS")
print("="*50)

try:
    print("   Configuring API key...")
    genai.configure(api_key=api_key)

    print("   Requesting list of available models from Google...")
    
    # This is the simplest possible API call. If this fails, the problem is 100%
    # related to the key or the Google Cloud project, not our application code.
    found_gemini_pro = False
    for m in genai.list_models():
        # We are looking for models that support 'generateContent'
        if 'generateContent' in m.supported_generation_methods:
            print(f"   - Found model: {m.name}")
            if m.name == 'models/gemini-pro':
                found_gemini_pro = True
    
    print("\n" + "-"*50)
    if found_gemini_pro:
        print("✅ SUCCESS! Your API key and Google Cloud project are configured correctly.")
        print("   The 'gemini-pro' model is available and ready to use.")
    else:
        print("⚠️  WARNING: The API call succeeded, but 'gemini-pro' was not found in the list.")
        print("   Your project might have access to other models, but our code expects 'gemini-pro'.")

except Exception as e:
    print(f"❌ TEST FAILED. The direct API call to Google failed.")
    print("\n--- ERROR DETAILS ---")
    print(f"{e}")
    print("---------------------")
    print("\nThis confirms the problem is with your API Key or Google Cloud Project setup.")
    print("Please follow the 'Grand Solution' steps to fix it.")