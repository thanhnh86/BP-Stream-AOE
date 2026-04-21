import os
import sys
import json
import time
from datetime import datetime, timedelta

# Add parent dir to sys.path to import services and config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import DATA_DIR
from services.video_service import merge_hls_to_mp4, cleanup_replay_files
from services.youtube_service import YouTubeService
from utils import meta_lock, safe_save_json

# Paths
SECRETS_PATH = os.path.join(DATA_DIR, 'youtube_secrets.json')
TOKEN_PATH = os.path.join(DATA_DIR, 'youtube_token.pickle')

def get_nights_older_than(days=7):
    """
    Returns a list of date strings in metadata.json that are older than `days`.
    """
    meta_file = os.path.join(DATA_DIR, 'metadata.json')
    if not os.path.exists(meta_file):
        return []

    with meta_lock:
        try:
            with open(meta_file, 'r') as f:
                meta = json.load(f)
        except Exception:
            return []

    eligible_dates = []
    cutoff_date = datetime.now() - timedelta(days=days)

    for date_str in meta.keys():
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            if date_obj < cutoff_date:
                eligible_dates.append(date_str)
        except ValueError:
            continue
    
    return eligible_dates

def run_sync():
    print(f"\n[{datetime.now()}] --- Bắt đầu tiến trình YouTube Sync hàng đêm ---")
    
    # 1. Check for auth token
    if not os.path.exists(TOKEN_PATH):
        print(f"✗ ERROR: YouTube token không tồn tại tại {TOKEN_PATH}.")
        print("Vui lòng chạy script youtube_auth_helper.py để tạo token trước.")
        return

    try:
        yt = YouTubeService(SECRETS_PATH, TOKEN_PATH)
    except Exception as e:
        print(f"✗ ERROR: Không thể khởi tạo YouTube Service: {e}")
        return

    # 2. Find eligible dates (> 7 days)
    eligible_dates = get_nights_older_than(7)
    if not eligible_dates:
        print("✓ Không có bản ghi nào cũ hơn 7 ngày cần xử lý.")
        return

    print(f"-> Tìm thấy {len(eligible_dates)} ngày cần chuyển đổi: {eligible_dates}")

    meta_file = os.path.join(DATA_DIR, 'metadata.json')
    with meta_lock:
        with open(meta_file, 'r') as f:
            meta = json.load(f)

    for date_str in sorted(eligible_dates):
        print(f"\n--- Xử lý ngày: {date_str} ---")
        streams = meta.get(date_str, {}).get('streams', {})
        
        for s_id, s_info in streams.items():
            # Skip if already uploaded or no HLS
            if s_info.get('youtube_url') or not s_info.get('hls'):
                continue

            print(f"  > Đang xử lý stream: {s_id} ({s_info.get('display_name', 'Unknown')})")
            
            # Paths
            hls_rel_path = s_info['hls'] # e.g., "replays/2026-04-14/stream_1/index.m3u8"
            hls_abs_path = os.path.join(DATA_DIR, hls_rel_path)
            
            output_mp4 = os.path.join(DATA_DIR, 'replays', date_str, s_id, 'full_match.mp4')
            
            # 3. Create MP4
            print(f"    - Đang ghép nối HLS sang MP4...")
            success, err = merge_hls_to_mp4(hls_abs_path, output_mp4)
            if not success:
                print(f"    ✗ Lỗi: {err}")
                continue
            
            # 4. Upload to YouTube
            title = f"AOE Replay | {s_info.get('display_name', s_id)} | {date_str}"
            description = (
                f"Bản ghi trận đấu AOE\n"
                f"Ngày thi đấu: {date_str}\n"
                f"Người chơi: {s_info.get('display_name', s_id)}\n"
                f"Thời lượng: {s_info.get('duration_minutes')} phút\n\n"
                f"Tự động upload bởi AOE Livestream System."
            )
            
            print(f"    - Đang upload lên YouTube (Unlisted)...")
            try:
                video_id = yt.upload_video(
                    file_path=output_mp4,
                    title=title,
                    description=description,
                    privacy_status="unlisted"
                )
                
                if video_id:
                    # 5. Update Metadata
                    s_info['youtube_url'] = f"https://www.youtube.com/watch?v={video_id}"
                    s_info['youtube_id'] = video_id
                    s_info['hls'] = None # Mark as removed local
                    
                    # 6. Cleanup
                    print(f"    - Upload thành công. Đang xoá file local...")
                    if os.path.exists(output_mp4):
                        os.remove(output_mp4)
                    cleanup_replay_files(date_str, s_id)
                
            except Exception as e:
                print(f"    ✗ Lỗi upload: {e}")
                if os.path.exists(output_mp4):
                    os.remove(output_mp4)
                continue

    # Save final metadata updates
    with meta_lock:
        safe_save_json(meta_file, meta)
    
    print(f"\n--- Hoàn tất tiến trình YouTube Sync ---")

if __name__ == "__main__":
    run_sync()
