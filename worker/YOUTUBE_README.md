# YouTube Archival & Sync Guide

Tài liệu này hướng dẫn cách cấu hình và quản lý tính năng tự động upload video lên YouTube cho hệ thống AOE Livestream.

## 1. Cấu hình Google Cloud Project & API
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo Project mới và Enable **YouTube Data API v3**.
3. Tạo **OAuth 2.0 Client ID** (loại Desktop App).
4. Tải file JSON bí mật về và đổi tên thành `youtube_secrets.json`.
5. Đặt file này vào thư mục `data/` của worker (thư mục chứa `metadata.json`).

## 2. Xác thực OAuth2 (Hành động một lần)
Do chạy trong môi trường Docker/Headless, bạn cần chạy script helper để lấy Token xác thực:

1. Chạy lệnh sau (trên máy có Python3):
   ```bash
   cd worker
   python3 scripts/youtube_auth_helper.py --secrets ../data/youtube_secrets.json --token ../data/youtube_token.pickle
   ```
2. Làm theo hướng dẫn trên terminal để đăng nhập YouTube và cấp quyền.
3. Sau khi xong, file `youtube_token.pickle` sẽ được tạo trong thư mục `data/`.

## 3. Quản lý đồng bộ (Sync)

### Kích hoạt thủ công (Manual Trigger)
Bạn có thể kích hoạt quá trình quét và upload ngay lập tức bằng lệnh HTTP:

- **Đồng bộ tự động (Các ngày > 7 ngày)**:
```bash
curl -X POST http://localhost:5001/api/v1/youtube/sync
```

- **Đồng bộ ngày cụ thể**:
```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"date": "2026-04-14"}' \
     http://localhost:5001/api/v1/youtube/sync
```

### Thiết lập tự động (Cron Job)
Phù hợp cho Docker, chạy hàng đêm vào lúc 2:00 AM:
```bash
# Thêm vào crontab -e của máy host
0 2 * * * curl -X POST http://localhost:5001/api/v1/youtube/sync >> /your/path/to/data/youtube_sync.log 2>&1
```

## 4. Cơ chế hoạt động
- **Lọc**: Hệ thống tìm các bản ghi có ngày cũ hơn 7 ngày so với hiện tại.
- **Convert**: Tự động ghép các segment HLS (`.ts`) thành file `.mp4` (lossless remux).
- **Upload**: Tải lên YouTube ở chế độ **Unlisted** (không công khai).
- **Cleanup**: Sau khi upload thành công, hệ thống sẽ xoá toàn bộ file video local để giải phóng bộ nhớ HDD.
- **UI**: Dashboard sẽ tự động hiển thị trình phát YouTube thay thế cho trình phát local.

---
**Lưu ý**: Hạn mức (Quota) của YouTube API mặc định là 10,000 đơn vị/ngày (khoảng 6-10 video). Nếu số lượng trận đấu vượt quá hạn mức, hệ thống sẽ tiếp tục upload vào ngày hôm sau.
