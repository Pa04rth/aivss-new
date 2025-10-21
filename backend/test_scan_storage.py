from app import app
from scanner_logic import run_scan_on_file
import tempfile
import os
from database.connection_manager import ScanResultManager

# Create test file
f = tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False)
f.write('print("Hello World")\n')
f.close()

# Run scan
result = run_scan_on_file(f.name)
result['user_id'] = 'parth.22440@knit.ac.in'
result['timestamp'] = '2024-01-01T00:00:00'

# Store in database
sm = ScanResultManager()
scan_id = sm.store_scan_result('parth.22440@knit.ac.in', result)
print('Stored scan ID:', scan_id)

# Check if stored
user_scans = sm.get_user_scan_results('parth.22440@knit.ac.in', limit=5)
print('User scans count:', len(user_scans))

# Cleanup
os.unlink(f.name)
