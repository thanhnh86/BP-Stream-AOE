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
    recordings = get_recordings()
    
    meta_file = os.path.join(DATA_DIR, 'metadata.json')
    meta = {}
    if os.path.exists(meta_file):
        with open(meta_file, 'r') as f:
            meta = json.load(f)

    for date, files in recordings.items():
        if date not in meta or meta[date].get('status') != 'completed':
            meta[date] = meta.get(date, {
                "streams": {},
                "status": "recording"
            })
    
    return jsonify(meta)

@app.route('/api/v1/dvr', methods=['POST'])
def on_dvr():
    data = request.json
    print(f"Received hook: {data}")
    if not data or data.get('action') != 'on_dvr':
        return "Invalid hook", 400

    file_path = data.get('file')
    if not file_path:
        return "No file in payload", 400

    if 'objs/nginx/html/dvr' in file_path:
        file_path = file_path.split('objs/nginx/html/dvr')[-1].lstrip('/')
        file_path = os.path.join(DATA_DIR, file_path)
    
    file_path = os.path.normpath(file_path)
    stream_id = data.get('stream')
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
    threading.Thread(target=do_merge, args=(date_str,)).start()
    return jsonify({"status": "Merging started", "date": date_str})

def run_ffmpeg(cmd, timeout=3600):
    """Chạy FFmpeg và trả về (success, stderr)"""
    try:
        result = subprocess.run(
            cmd,
            check=True,
            timeout=timeout,
            capture_output=True,
            text=True
        )
        return True, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    except subprocess.TimeoutExpired:
        return False, "Timeout"

def do_merge(date_str):
    recordings = get_recordings()
    if date_str not in recordings:
        print(f"No recordings found for date: {date_str}")
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
            try:
                meta = json.load(f)
            except:
                meta = {}
            
    if date_str not in meta:
        meta[date_str] = {"streams": {}, "status": "processing"}
    else:
        meta[date_str]["status"] = "processing"
        if "streams" not in meta[date_str]:
            meta[date_str]["streams"] = {}

    with open(meta_file, 'w') as f:
        json.dump(meta, f, indent=4)

    total_streams = len(stream_recordings)

    for i, (s_id, files) in enumerate(stream_recordings.items()):
        if not files:
            continue
        
        machine_progress_start = int((i / total_streams) * 100)
        machine_progress_step = int(100 / total_streams)

        replay_dir = os.path.join(DATA_DIR, 'replays', date_str, s_id)
        os.makedirs(replay_dir, exist_ok=True)

        # Chỉ ghi segment tồn tại thực sự trên disk
        valid_files = [f for f in files if os.path.exists(f)]
        if not valid_files:
            print(f"WARNING: Không có segment hợp lệ cho stream {s_id}, bỏ qua.")
            meta[date_str]["streams"][s_id] = {"error": "Không tìm thấy segment nào trên disk"}
            with open(meta_file, 'w') as f:
                json.dump(meta, f, indent=4)
            continue

        skipped = len(files) - len(valid_files)
        if skipped > 0:
            print(f"WARNING: Bỏ qua {skipped} segment không tồn tại của stream {s_id}")

        list_file = os.path.join(replay_dir, 'segments.txt')
        with open(list_file, 'w') as f:
            for file in valid_files:
                f.write(f"file '{file}'\n")

        mp4_output = os.path.join(replay_dir, 'summary.mp4')
        hls_output = os.path.join(replay_dir, 'index.m3u8')
        
        try:
            # --- Bước 1: Tạo MP4 ---
            meta[date_str]["progress_text"] = f"Đang xử lý máy {s_id} ({i+1}/{total_streams}: Nối video)..."
            meta[date_str]["progress_percent"] = machine_progress_start + int(machine_progress_step * 0.1)
            with open(meta_file, 'w') as f:
                json.dump(meta, f, indent=4)

            # Flags dùng chung cho input — xử lý QSV/FMO và NAL unit lỗi
            input_flags = [
                'ffmpeg', '-y',
                '-fflags', '+genpts+igndts+discardcorrupt',
                '-err_detect', 'ignore_err',   # Không crash khi gặp FMO / NAL lỗi
                '-analyzeduration', '100M',    # Đọc nhiều hơn trước khi xử lý
                '-probesize', '100M',
                '-f', 'concat', '-safe', '0', '-i', list_file,
            ]

            # Output flags dùng chung
            output_flags = [
                '-movflags', '+faststart',
                '-max_muxing_queue_size', '9999',
                mp4_output
            ]

            # Thử 1: Transcode đầy đủ — fix FMO, artifact, seek
            success, stderr = run_ffmpeg(input_flags + [
                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',  # Đảm bảo resolution hợp lệ
                '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
            ] + output_flags)

            if not success:
                print(f"Transcode đầy đủ thất bại cho {s_id}:\n{stderr}\n→ Thử stream copy...")

                # Thử 2: Fallback stream copy — nhanh hơn nhưng không fix được FMO
                success, stderr = run_ffmpeg(input_flags + [
                    '-c', 'copy',
                ] + output_flags)

                if success:
                    print(f"WARNING: {s_id} dùng stream copy, video có thể có artifact nhỏ")
                else:
                    raise RuntimeError(f"Cả transcode và stream copy đều thất bại:\n{stderr}")

            # --- Bước 2: Tạo HLS từ MP4 đã xử lý ---
            meta[date_str]["progress_text"] = f"Đang tạo HLS {s_id} ({i+1}/{total_streams})..."
            meta[date_str]["progress_percent"] = machine_progress_start + int(machine_progress_step * 0.7)
            with open(meta_file, 'w') as f:
                json.dump(meta, f, indent=4)

            success, stderr = run_ffmpeg([
                'ffmpeg', '-y',
                '-i', mp4_output,
                '-c:v', 'copy',
                '-c:a', 'copy',
                '-bsf:v', 'h264_mp4toannexb',
                '-hls_time', '5',
                '-hls_list_size', '0',
                '-hls_segment_filename', os.path.join(replay_dir, 'segment_%d.ts'),
                hls_output
            ])

            if not success:
                raise RuntimeError(f"Tạo HLS thất bại:\n{stderr}")

            # --- Lấy duration ---
            duration_raw = subprocess.check_output([
                'ffprobe', '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                mp4_output
            ]).decode().strip()
            duration = float(duration_raw)

            meta[date_str]["streams"][s_id] = {
                "mp4": f"replays/{date_str}/{s_id}/summary.mp4",
                "hls": f"replays/{date_str}/{s_id}/index.m3u8",
                "duration_minutes": round(duration / 60, 2),
                "file": f"replays/{date_str}/{s_id}/index.m3u8"
            }

            if os.path.exists(list_file):
                os.remove(list_file)

            print(f"Hoàn thành stream {s_id}: {round(duration / 60, 2)} phút")

        except Exception as e:
            print(f"Lỗi khi xử lý {s_id}: {e}")
            meta[date_str]["streams"][s_id] = {"error": str(e)}
            meta[date_str]["progress_text"] = f"Lỗi tại máy {s_id}: {str(e)}"
            with open(meta_file, 'w') as f:
                json.dump(meta, f, indent=4)
            # Tiếp tục xử lý các stream còn lại
            continue

    meta[date_str]["status"] = "completed"
    meta[date_str]["progress_percent"] = 100
    meta[date_str]["progress_text"] = "Đã hoàn thành tổng hợp toàn bộ."
    with open(meta_file, 'w') as f:
        json.dump(meta, f, indent=4)
    
    print(f"Merge hoàn tất cho ngày {date_str}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)