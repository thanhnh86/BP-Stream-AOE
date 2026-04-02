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

@app.route('/api/v1/players', methods=['GET'])
def get_players():
    players_file = os.path.join(DATA_DIR, 'players.json')
    if os.path.exists(players_file):
        with open(players_file, 'r') as f:
            return jsonify(json.load(f))
    return jsonify({})

@app.route('/api/v1/players', methods=['POST'])
def save_players():
    data = request.json
    players_file = os.path.join(DATA_DIR, 'players.json')
    with open(players_file, 'w') as f:
        json.dump(data, f, indent=4)
    return jsonify({"status": "Players saved"}), 200

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
            meta[date] = meta.get(date, {
                "streams": {},
                "status": "recording"
            })
    
    return jsonify(meta)

@app.route('/api/v1/dvr', methods=['POST'])
def on_dvr():
    # SRS sends: { "action": "on_dvr", "client_id": "...", "vhost": "...", "app": "...", "stream": "...", "file": "..." }
    data = request.json
    print(f"Received hook: {data}")
    if not data or data.get('action') != 'on_dvr':
        return "Invalid hook", 400

    file_path = data.get('file')
    if not file_path:
        return "No file in payload", 400

    # Handle SRS file path normalization
    # If the path contains the dvr directory portion, strip everything before it and map to DATA_DIR
    if 'objs/nginx/html/dvr' in file_path:
        file_path = file_path.split('objs/nginx/html/dvr')[-1].lstrip('/')
        file_path = os.path.join(DATA_DIR, file_path)
    
    # Ensure no leading slash issues and normalize path
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
    return "0", 200

@app.route('/api/v1/debug', methods=['POST'])
def debug_hook():
    data = request.json
    print(f"DEBUG HOOK: {data}")
    return "0", 200

@app.route('/api/v1/merge/<date_str>', methods=['POST'])
def merge_date(date_str):
    # Trigger merging for a specific date
    threading.Thread(target=do_merge, args=(date_str,)).start()
    return jsonify({"status": "Merging started", "date": date_str})

def do_merge(date_str):
    recordings = get_recordings()
    if date_str not in recordings:
        return
    
    # Group by stream
    stream_recordings = {}
    for r in recordings[date_str]:
        s_id = r['stream']
        if s_id not in stream_recordings:
            stream_recordings[s_id] = []
        stream_recordings[s_id].append(r['file'])
    
    meta_file = os.path.join(DATA_DIR, 'metadata.json')
    meta = {}
    if os.path.exists(meta_file):
        with open(meta_file, 'r') as f:
            meta = json.load(f)
            
    if date_str not in meta:
        meta[date_str] = {"streams": {}, "status": "processing"}
    else:
        if "streams" not in meta[date_str]:
            meta[date_str]["streams"] = {}

    for s_id, files in stream_recordings.items():
        if not files: continue
        
        list_file = os.path.join(DATA_DIR, f'list_{date_str}_{s_id}.txt')
        with open(list_file, 'w') as f:
            for file in files:
                f.write(f"file '{file}'\n")

        output_file_name = f'summary_{date_str}_{s_id}.mp4'
        output_file_path = os.path.join(DATA_DIR, output_file_name)
        
        cmd = [
            'ffmpeg', '-f', 'concat', '-safe', '0', 
            '-i', list_file, '-c', 'copy', '-y', output_file_path
        ]
        
        try:
            subprocess.run(cmd, check=True)
            duration_cmd = [
                'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1', output_file_path
            ]
            duration = float(subprocess.check_output(duration_cmd).decode().strip())
            
            meta[date_str]["streams"][s_id] = {
                "file": output_file_name,
                "duration_minutes": round(duration / 60, 2)
            }
            # Clean up list file
            if os.path.exists(list_file):
                os.remove(list_file)
        except Exception as e:
            print(f"Error merging {date_str} for stream {s_id}: {e}")

    meta[date_str]["status"] = "completed"
    with open(meta_file, 'w') as f:
        json.dump(meta, f, indent=4)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
