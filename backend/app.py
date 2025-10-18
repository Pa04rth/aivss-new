from flask import Flask, request, jsonify, send_from_directory
import os
import json
from datetime import datetime
import threading
import time
import tempfile
import uuid
from dotenv import load_dotenv
from scanner_logic import run_scan_on_file

# Import new n8n functionality
from api.n8n_routes import n8n_bp
from api.auth_routes import auth_bp
from database.connection_manager import DatabaseManager, ScanResultManager
from middleware.auth import require_auth, get_current_user

# Load environment variables
load_dotenv()
app = Flask(__name__, static_folder='dist', static_url_path='')

# Register blueprints
app.register_blueprint(n8n_bp)
app.register_blueprint(auth_bp)

# Initialize database and managers
db_manager = DatabaseManager()
scan_result_manager = ScanResultManager()

# Global variables to store scan results and history (DEPRECATED - will be removed)
latest_results = {}
scan_history = []
scan_counter = 0

def send_results_to_webapp(results):
    """Stores scan results and assigns a scan ID."""
    global latest_results, scan_history, scan_counter
    try:
        results['timestamp'] = datetime.now().isoformat()
        results['scan_id'] = scan_counter # Assign the ID
        scan_counter += 1
        
        print(f"🔍 [DEBUG] Storing results for scan_id {results['scan_id']}")
        print(f"🔍 [DEBUG] Results keys: {list(results.keys())}")
        print(f"🔍 [DEBUG] Has contextualFindings: {'contextualFindings' in results}")
        print(f"🔍 [DEBUG] Has staticFindings: {'staticFindings' in results}")
        print(f"🔍 [DEBUG] Has aivssAnalysis: {'aivssAnalysis' in results}")
        print(f"🔍 [DEBUG] Has aarsAnalysis: {'aarsAnalysis' in results}")
        if 'contextualFindings' in results:
            print(f"🔍 [DEBUG] Contextual findings count: {len(results.get('contextualFindings', []))}")
        if 'staticFindings' in results:
            print(f"🔍 [DEBUG] Static findings count: {len(results.get('staticFindings', []))}")
        
        latest_results = results
        scan_history.append(results)
        if len(scan_history) > 10:
            scan_history.pop(0)
            
        print(f"✅ Results for scan_id {results['scan_id']} stored in web app")
        
    except Exception as e:
        print(f"⚠️ Error storing results in web app: {e}")

@app.route('/')
def serve_react_app():
    """Serve the React app"""
    return send_from_directory('dist', 'index.html')

@app.route('/api/scan', methods=['POST'])
@require_auth
def receive_scan_results():
    """Receive scan results from MCP server"""
    try:
        data = request.get_json()
        user_info = get_current_user()
        
        if not user_info:
            return jsonify({"status": "error", "message": "User not authenticated"}), 401
        
        # Add timestamp and user info
        data['timestamp'] = datetime.now().isoformat()
        data['user_id'] = user_info['user_id']
        
        # Store in database
        scan_id = scan_result_manager.store_scan_result(
            user_id=user_info['user_id'],
            scan_data=data
        )
        
        data['scan_id'] = scan_id
        
        print(f"Received scan results for user {user_info['user_id']}: {data.get('file_path', 'Unknown file')}")
        return jsonify({"status": "success", "message": "Results received", "scan_id": scan_id})
        
    except Exception as e:
        print(f"❌ Error receiving scan results: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/results')
@require_auth
def get_latest_results():
    """Get the latest scan results for the authenticated user"""
    try:
        user_info = get_current_user()
        if not user_info:
            return jsonify({"success": False, "message": "User not authenticated"}), 401
        
        # Get latest scan for user
        user_scans = scan_result_manager.get_user_scan_results(user_info['user_id'], limit=1)
        
        if not user_scans:
            return jsonify({"success": False, "message": "No scan results available yet."})
        
        latest_scan = user_scans[0]
        print(f"🔍 [DEBUG] Returning latest scan for user {user_info['user_id']}: {latest_scan.get('scan_id', 'N/A')}")
        
        return jsonify(latest_scan)
        
    except Exception as e:
        print(f"❌ Error getting latest results: {e}")
        return jsonify({"success": False, "message": "Failed to fetch results"}), 500

@app.route('/api/history')
@require_auth
def get_scan_history():
    """Get scan history for the authenticated user"""
    try:
        user_info = get_current_user()
        if not user_info:
            return jsonify({"error": "User not authenticated"}), 401
        
        # Get user's scan history
        user_scans = scan_result_manager.get_user_scan_results(user_info['user_id'], limit=50)
        
        print(f"🔍 [DEBUG] Returning {len(user_scans)} scans for user {user_info['user_id']}")
        return jsonify(user_scans)
        
    except Exception as e:
        print(f"❌ Error getting scan history: {e}")
        return jsonify({"error": "Failed to fetch scan history"}), 500



@app.route('/api/clear', methods=['GET'])
def clear_results():
    """Clear all results"""
    global latest_results, scan_history
    latest_results = {}
    scan_history = []
    return jsonify({"status": "success", "message": "Results cleared"})

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files for React app or fallback to index.html for React routing"""
    # Check if the path is for a static asset (has a file extension)
    if '.' in path and not path.startswith('api/'):
        try:
            return send_from_directory('dist', path)
        except:
            pass
    
    # For all other routes, serve the React app (index.html)
    # This allows React Router to handle client-side routing
    return send_from_directory('dist', 'index.html')



@app.route('/api/scan-from-upload', methods=['POST'])
@require_auth
def scan_from_upload():
    """Receives a file from the frontend, saves it temporarily, and scans it."""
    try:
        user_info = get_current_user()
        if not user_info:
            return jsonify({"status": "error", "message": "User not authenticated"}), 401
        
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "No file part in the request"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file"}), 400

        if file and file.filename.endswith('.py'):
            # Create a temporary directory to securely store the uploaded file
            with tempfile.TemporaryDirectory() as temp_dir:
                # Use a secure filename and save the file
                filename = str(uuid.uuid4()) + ".py"
                temp_filepath = os.path.join(temp_dir, filename)
                file.save(temp_filepath)

                print(f"File saved temporarily to: {temp_filepath}")
                
                scan_result = run_scan_on_file(temp_filepath)

                # Use original filename for user-facing display
                if "file_path" in scan_result:
                    scan_result["file_path"] = file.filename

                # Add user info and timestamp
                scan_result['timestamp'] = datetime.now().isoformat()
                scan_result['user_id'] = user_info['user_id']
                
                # Store in database
                scan_id = scan_result_manager.store_scan_result(
                    user_id=user_info['user_id'],
                    scan_data=scan_result
                )
                
                scan_result['scan_id'] = scan_id
                
                return jsonify({
                    "status": "success",
                    "message": "File received and scan initiated.",
                    "scan_id": scan_id
                })

        return jsonify({"status": "error", "message": "Invalid file type. Only .py files are accepted."}), 400

    except Exception as e:
        print(f"❌ Error during file upload and scan: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/history/<int:scan_id>')
@require_auth
def get_scan_by_id(scan_id):
    """Get a specific scan from history by its ID for the authenticated user."""
    try:
        user_info = get_current_user()
        if not user_info:
            return jsonify({"error": "User not authenticated"}), 401
        
        # Get specific scan for user
        scan = scan_result_manager.get_scan_by_id(scan_id, user_info['user_id'])
        
        if not scan:
            return jsonify({"error": "Scan not found"}), 404
        
        print(f"🔍 [DEBUG] Found scan {scan_id} for user {user_info['user_id']}")
        return jsonify(scan)
        
    except Exception as e:
        print(f"❌ Error getting scan by ID: {e}")
        return jsonify({"error": "Failed to fetch scan"}), 500

if __name__ == '__main__':
    # Create dist directory if it doesn't exist
    os.makedirs('dist', exist_ok=True)
    
    print("🚀 Starting MCP Scanner Web App...")
    print("📊 Dashboard will be available at: http://localhost:5001")
    print("📡 API endpoint for results: http://localhost:5001/api/scan")
    
    app.run(debug=False, host='0.0.0.0', port=5001) 