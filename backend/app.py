from flask import Flask, request, jsonify, send_from_directory
import os
import json
from datetime import datetime
import threading
import time
import tempfile
import uuid
from scanner_logic import run_scan_on_file
app = Flask(__name__, static_folder='dist', static_url_path='')

# Global variables to store scan results and history
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
        
        latest_results = results
        scan_history.append(results)
        if len(scan_history) > 10:
            scan_history.pop(0)
            
        print(f"Results for scan_id {results['scan_id']} stored in web app")
        
    except Exception as e:
        print(f"⚠️ Error storing results in web app: {e}")

@app.route('/')
def serve_react_app():
    """Serve the React app"""
    return send_from_directory('dist', 'index.html')

@app.route('/api/scan', methods=['POST'])
def receive_scan_results():
    """Receive scan results from MCP server"""
    global latest_results, scan_history, scan_counter
    
    try:
        data = request.get_json()
        
        # Add timestamp and scan ID
        data['timestamp'] = datetime.now().isoformat()
        data['scan_id'] = scan_counter
        scan_counter += 1
        
        # Store as latest results
        latest_results = data
        
        # Add to history
        scan_history.append(data)
        
        # Keep only last 10 scans in history
        if len(scan_history) > 10:
            scan_history.pop(0)
            
        print(f"Received scan results: {data.get('file_path', 'Unknown file')}")
        return jsonify({"status": "success", "message": "Results received"})
        
    except Exception as e:
        print(f"❌ Error receiving scan results: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/results')
def get_latest_results():
    """Get the latest scan results"""
    if not latest_results:
        # If there are no results, return a structured "not found" response
        return jsonify({"success": False, "message": "No scan results available yet."})
    else:
        # If there are results, return them as before
        return jsonify(latest_results)

@app.route('/api/history')
def get_scan_history():
    """Get scan history"""
    return jsonify(scan_history)

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


def run_scan(file_path: str) -> dict:
    # This function will eventually contain the logic from server.py's autoharden_agent
    # For now, we simulate it.
    print(f"Simulating scan for: {file_path}")
    # In the real implementation, this will call the actual scanner
    # and get a result dictionary.
    pass # We will replace this in the next step

@app.route('/api/scan-from-upload', methods=['POST'])
def scan_from_upload():
    """Receives a file from the frontend, saves it temporarily, and scans it."""
    try:
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

                # --- THIS IS WHERE WE WILL CALL OUR SCANNER ---
                # For now, we'll just send a dummy result
                # In the next step, we'll replace this with the real scanner call
                # dummy_result = {
                #     "success": True,
                #     "file_path": file.filename, # Show original filename to user
                #     "constraints_count": 2,
                #     "risks_count": 1,
                #     "constraints": [{"description": "Dummy constraint 1", "severity": "low"}],
                #     "risks": [{"description": "Dummy critical risk", "severity": "critical", "impact": "High"}],
                #     "hardened_code": ["# Dummy hardened code"],
                #     "message": f"Successfully analyzed uploaded file {file.filename}"
                # }

                # # Use our existing function to store the results
                # send_results_to_webapp(dummy_result)
                
                scan_result = run_scan_on_file(temp_filepath)

                # Use original filename for user-facing display
                if "file_path" in scan_result:
                    scan_result["file_path"] = file.filename

                # Use our existing function to store the results
                send_results_to_webapp(scan_result)
                
                return jsonify({
                        "status": "success",
                        "message": "File received and scan initiated.",
                        "scan_id": scan_result.get("scan_id") # <-- ADD THIS LINE
                    })

        return jsonify({"status": "error", "message": "Invalid file type. Only .py files are accepted."}), 400

    except Exception as e:
        print(f"❌ Error during file upload and scan: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/history/<int:scan_id>')
def get_scan_by_id(scan_id):
    """Get a specific scan from history by its ID."""
    scan = next((s for s in scan_history if s.get('scan_id') == scan_id), None)
    if scan:
        return jsonify(scan)
    else:
        return jsonify({"error": "Scan not found"}), 404

if __name__ == '__main__':
    # Create dist directory if it doesn't exist
    os.makedirs('dist', exist_ok=True)
    
    print("🚀 Starting MCP Scanner Web App...")
    print("📊 Dashboard will be available at: http://localhost:5001")
    print("📡 API endpoint for results: http://localhost:5001/api/scan")
    
    app.run(debug=False, host='0.0.0.0', port=5001) 