def do_merge(date_str):
    recordings = get_recordings()
    if date_str not in recordings:
        print(f"No recordings found for date: {date_str}")
        return
    
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
        if not files: continue
        
        machine_progress_start = int((i / total_streams) * 100)
        machine_progress_step = int(100 / total_streams)

        replay_dir = os.path.join(DATA_DIR, 'replays', date_str, s_id)
        os.makedirs(replay_dir, exist_ok=True)

        list_file = os.path.join(replay_dir, 'segments.txt')
        with open(list_file, 'w') as f:
            for file in files:
                if os.path.exists(file):
                    f.write(f"file '{file}'\n")
                else:
                    print(f"WARNING: Segment không tồn tại, bỏ qua: {file}")

        mp4_output = os.path.join(replay_dir, 'summary.mp4')
        hls_output = os.path.join(replay_dir, 'index.m3u8')
        
        try:
            meta[date_str]["progress_text"] = f"Đang xử lý máy {s_id} ({i+1}/{total_streams}: Nối video)..."
            meta[date_str]["progress_percent"] = machine_progress_start + int(machine_progress_step * 0.1)
            with open(meta_file, 'w') as f: json.dump(meta, f, indent=4)

            # Base input flags để xử lý stream lỗi, FMO, NAL unit thiếu
            input_flags = [
                'ffmpeg', '-y',
                '-fflags', '+genpts+igndts+discardcorrupt',
                '-err_detect', 'ignore_err',          # Bỏ qua lỗi decode thay vì crash
                '-analyzeduration', '100M',            # Tăng thời gian phân tích stream
                '-probesize', '100M',
                '-f', 'concat', '-safe', '0', '-i', list_file,
            ]

            # --- Thử 1: Transcode đầy đủ (chất lượng tốt nhất) ---
            # Thêm -vf để filter lại frame, giúp recover sau FMO error
            success = False
            try:
                subprocess.run(input_flags + [
                    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',  # Đảm bảo resolution hợp lệ
                    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
                    '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
                    '-movflags', '+faststart',
                    '-max_muxing_queue_size', '9999',
                    mp4_output
                ], check=True, timeout=3600)
                success = True
            except subprocess.CalledProcessError as e:
                print(f"Transcode đầy đủ thất bại cho {s_id}, thử copy stream: {e}")

            # --- Thử 2: Fallback - copy stream không transcode ---
            # Hữu ích khi FMO chặn hoàn toàn việc decode nhưng mux vẫn hoạt động
            if not success:
                try:
                    subprocess.run(input_flags + [
                        '-c', 'copy',
                        '-movflags', '+faststart',
                        '-max_muxing_queue_size', '9999',
                        mp4_output
                    ], check=True, timeout=3600)
                    success = True
                    print(f"WARNING: {s_id} dùng stream copy, video có thể có artifact")
                except subprocess.CalledProcessError as e:
                    print(f"Stream copy cũng thất bại cho {s_id}: {e}")

            if not success:
                raise RuntimeError(f"Không thể xử lý stream {s_id} bằng bất kỳ phương pháp nào")

            # Bước 2: HLS từ MP4 đã xử lý
            meta[date_str]["progress_text"] = f"Đang tạo HLS {s_id} ({i+1}/{total_streams})..."
            meta[date_str]["progress_percent"] = machine_progress_start + int(machine_progress_step * 0.7)
            with open(meta_file, 'w') as f: json.dump(meta, f, indent=4)

            subprocess.run([
                'ffmpeg', '-y',
                '-i', mp4_output,
                '-c:v', 'copy', 
                '-c:a', 'copy', 
                '-bsf:v', 'h264_mp4toannexb',
                '-hls_time', '5', 
                '-hls_list_size', '0', 
                '-hls_segment_filename', os.path.join(replay_dir, 'segment_%d.ts'),
                hls_output
            ], check=True, timeout=3600)

            duration_cmd = [
                'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1', mp4_output
            ]
            duration = float(subprocess.check_output(duration_cmd).decode().strip())
            
            meta[date_str]["streams"][s_id] = {
                "mp4": f"replays/{date_str}/{s_id}/summary.mp4",
                "hls": f"replays/{date_str}/{s_id}/index.m3u8",
                "duration_minutes": round(duration / 60, 2),
                "file": f"replays/{date_str}/{s_id}/index.m3u8"
            }
            
            if os.path.exists(list_file):
                os.remove(list_file)

        except Exception as e:
            print(f"Lỗi khi xử lý {s_id}: {e}")
            meta[date_str]["streams"][s_id] = {"error": str(e)}
            meta[date_str]["progress_text"] = f"Lỗi tại máy {s_id}: {str(e)}"
            with open(meta_file, 'w') as f: json.dump(meta, f, indent=4)
            # Tiếp tục xử lý các stream còn lại thay vì dừng hẳn
            continue

    meta[date_str]["status"] = "completed"
    meta[date_str]["progress_percent"] = 100
    meta[date_str]["progress_text"] = "Đã hoàn thành tổng hợp toàn bộ."
    with open(meta_file, 'w') as f:
        json.dump(meta, f, indent=4)