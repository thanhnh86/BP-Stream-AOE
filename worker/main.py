from flask import Flask, request, jsonify
import os
import subprocess
from datetime import datetime
import json
import threading

app = Flask(__name__)
DATA_DIR = os.environ.get('DATA_DIR', '/data')
LOG_FILE = os.path.join(DATA_DIR, 'recordings.json')

def get_recordings():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_recordings(data):
    with open(LOG_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/api/v1/metadata', methods=['GET'])
def get_metadata():
    date_str = datetime.now().strftime('%Y-%m-%d')
    recordings = get_recordings()
    
    meta_file = os.path.join(DATA_DIR, 'metadata.json')
    meta = {}
    if os.path.exists(meta_file):
        with open(meta_file, 'r') as f:
            meta = json.load(f)

    # For any date in recordings but not in meta, or to update current day's status:
    for date, files in recordings.items():
        if date not in meta or meta[date].get('status') != 'completed':
            # Count total duration in recordings for this date? 
            # We don't have individual file durations yet without probe.
            # But let's assume we update some info.
            meta[date] = meta.get(date, {
                "file": f"summary_{date}.mp4",
                "duration_minutes": 0,
                "status": "recording"
            })
            # Actually, let's just use existing metadata if available.
    
    return jsonify(meta)

@app.route('/api/v1/dvr', methods=['POST'])
def on_dvr():
    # SRS sends: { "action": "on_dvr", "client_id": "...", "ip": "...", "vhost": "...", "app": "...", "stream": "...", "cwd": "...", "file": "..." }
    data = request.json
    if not data or data.get('action') != 'on_dvr':
        return "Invalid hook", 400

    file_path = data.get('file')
    # Map SRS internal path to worker volume path (only dvr subfolder is mounted)
    if file_path.startswith('/usr/local/srs/objs/nginx/html/dvr'):
        file_path = file_path.replace('/usr/local/srs/objs/nginx/html/dvr', DATA_DIR)
    # Ensure no leading slash issues if DATA_DIR doesn't end with slash
    file_path = os.path.normpath(file_path)
    
    stream_id = data.get('stream')
    
    # Get current date
    date_str = datetime.now().strftime('%Y-%m-%d')
    
    recordings = get_recordings()
    if date_str not in recordings:
        recordings[date_str] = []
    
    recordings[date_str].append({
        "stream": stream_id,
        "file": file_path,
        "timestamp": datetime.now().isoformat()
    })
    
    save_recordings(recordings)
    return "OK", 200

@app.route('/api/v1/merge/<date_str>', methods=['POST'])
def merge_date(date_str):
    # Trigger merging for a specific date
    threading.Thread(target=do_merge, args=(date_str,)).start()
    return jsonify({"status": "Merging started", "date": date_str})

def do_merge(date_str):
    recordings = get_recordings()
    if date_str not in recordings:
        return
    
    files = [r['file'] for r in recordings[date_str]]
    if not files:
        return

    # Create concat list for ffmpeg
    list_file = os.path.join(DATA_DIR, f'list_{date_str}.txt')
    with open(list_file, 'w') as f:
        for file in files:
            # Files are relative to SRS root or absolute. 
            # In our setup they are in /data/...
            f.write(f"file '{file}'\n")

    output_file = os.path.join(DATA_DIR, f'summary_{date_str}.mp4')
    
    # Run ffmpeg concat
    # ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
    cmd = [
        'ffmpeg', '-f', 'concat', '-safe', '0', 
        '-i', list_file, '-c', 'copy', '-y', output_file
    ]
    
    try:
        subprocess.run(cmd, check=True)
        # Calculate duration
        duration_cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', output_file
        ]
        duration = float(subprocess.check_output(duration_cmd).decode().strip())
        
        # Update metadata
        meta_file = os.path.join(DATA_DIR, 'metadata.json')
        meta = {}
        if os.path.exists(meta_file):
            with open(meta_file, 'r') as f:
                meta = json.load(f)
        
        meta[date_str] = {
            "file": f"summary_{date_str}.mp4",
            "duration_minutes": round(duration / 60, 2),
            "status": "completed"
        }
        with open(meta_file, 'w') as f:
            json.dump(meta, f, indent=4)
            
    except Exception as e:
        print(f"Error merging {date_str}: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
