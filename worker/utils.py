import json
import os
import threading
import subprocess
from config import LOG_FILE

meta_lock = threading.Lock()
recordings_lock = threading.Lock()

def get_recordings():
    if os.path.exists(LOG_FILE):
        with recordings_lock:
            try:
                with open(LOG_FILE, 'r') as f:
                    return json.load(f)
            except Exception:
                return {}
    return {}

def save_recordings(data):
    with recordings_lock:
        with open(LOG_FILE, 'w') as f:
            json.dump(data, f, indent=4)

def delete_recordings_by_date(date_str):
    with recordings_lock:
        if os.path.exists(LOG_FILE):
            try:
                with open(LOG_FILE, 'r') as f:
                    data = json.load(f)
                if date_str in data:
                    del data[date_str]
                    with open(LOG_FILE, 'w') as f:
                        json.dump(data, f, indent=4)
            except Exception as e:
                print(f"Error cleaning up recordings for {date_str}: {e}")

def save_meta(meta_file, meta):
    with meta_lock:
        with open(meta_file, 'w') as f:
            json.dump(meta, f, indent=4)

def update_meta_field(meta, meta_file, date_str, **kwargs):
    with meta_lock:
        for k, v in kwargs.items():
            meta[date_str][k] = v
        with open(meta_file, 'w') as f:
            json.dump(meta, f, indent=4)

def run_ffmpeg(cmd, timeout=3600):
    try:
        result = subprocess.run(
            cmd, check=True, timeout=timeout,
            capture_output=True, text=True
        )
        return True, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    except subprocess.TimeoutExpired:
        return False, "Timeout"

def get_duration(file_path):
    try:
        out = subprocess.check_output([
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ], stderr=subprocess.DEVNULL).decode().strip()
        return float(out)
    except Exception:
        return 0.0

def convert_flv_to_ts(flv_path, ts_path):
    return run_ffmpeg([
        'ffmpeg', '-y',
        '-fflags', '+genpts+igndts+discardcorrupt',
        '-err_detect', 'ignore_err',
        '-analyzeduration', '100M',
        '-probesize', '100M',
        '-i', flv_path,
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-f', 'mpegts',
        ts_path
    ])
