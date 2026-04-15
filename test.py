import json
import os
from unittest.mock import patch, MagicMock

# Create mock files
os.makedirs("data", exist_ok=True)
with open("data/recordings.json", "w") as f:
    json.dump({
        "2024-04-01": [{"stream": "s1", "file": "data/1.flv"}],
        "2024-04-02": [{"stream": "s1", "file": "data/2.flv"}],
        "2024-04-03": [{"stream": "s1", "file": "data/3.flv"}],
        "2024-04-04": [{"stream": "s1", "file": "data/4.flv"}],
        "2024-04-05": [{"stream": "s1", "file": "data/5.flv"}],
    }, f)

with open("data/metadata.json", "w") as f:
    json.dump({
        "2024-04-01": {"status": "completed", "streams": {"s1": {}}},
        "2024-04-02": {"status": "completed", "streams": {"s1": {}}},
    }, f)

# Fake config
import sys
sys.path.insert(0, './worker')

with patch('worker.config.DATA_DIR', os.path.abspath('data')), patch('worker.config.LOG_FILE', os.path.abspath('data/recordings.json')):
    from worker.services.video_service import do_merge, process_one_stream, cleanup_old_recordings
    from worker.utils import get_recordings
    with patch('worker.services.video_service.ThreadPoolExecutor') as mock_pool:
        # Mocking the ThreadPoolExecutor to just run process_one_stream synchronously
        def submit(func, *args, **kwargs):
            future = MagicMock()
            future.result.return_value = (args[0], True, None)
            func(*args, **kwargs)
            return future
        mock_pool.return_value.__enter__.return_value.submit = submit
        
        with patch('worker.services.video_service.run_ffmpeg', return_value=(True, "")):
            do_merge("2024-04-04")
            
    print("Recordings after:", get_recordings().keys())
    with open("data/metadata.json") as f:
        print("Metadata after:", list(json.load(f).keys()))

