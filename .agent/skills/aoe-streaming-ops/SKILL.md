---
name: aoe-streaming-ops
description: Manage, deploy, and debug the AOE streaming project (SRS and Node.js Web App) on the remote server 192.168.9.214. Use this skill whenever the user asks to check stream status, restart the streaming server, deploy new code to the host, or debug HLS video playback issues on the live streaming system.
---

# AOE Streaming Ops

This skill provides standard operating procedures for managing the `bp-stream-aoe` project, which consists of an SRS (Simple Realtime Server) and a Node.js Express web application for Age of Empires (AOE) live streams and VODs.

## Remote Server Environment

- **Host IP:** 192.168.9.214
- **SSH Username:** `test`
- **SSH Password:** `123456`
- **URL:** `aoe.bpg.vn`
- **Authentication Method:** Use `sshpass` or `expect` scripts if running non-interactive SSH commands. For example:
  ```bash
  expect -c 'spawn ssh -o StrictHostKeyChecking=no test@192.168.9.214 "echo 123456 | sudo -S docker ps -a"; expect "*?assword:*"; send "123456\r"; expect eof'
  ```

## Docker Containers Stack

The project runs using Docker on the remote host via `docker-compose.yml`.
There are two main containers:
1. `srs_aoe` (Image: `ossrs/srs:5`): Handles RTMP ingests and generates HLS playlists/segments.
2. `web_aoe` (Image: customized Node.js `playback-web`): Exposes the web UI and APIs on port 3000. It reads from the shared volumes mapped to SRS output.

## Storage Paths on Host

Volumes mapped into containers:
- `/home/playback/record`: Stores VOD recordings (legacy MP4 chunks or new HLS day-based directories).
- `/home/playback/live`: Stores temporary active live streams.

## Common Operations

### 1. Checking Service Health
To check if the containers are running smoothly, SSH into the host and run:
```bash
echo "123456" | sudo -S docker ps -a
```
You should see both `srs_aoe` and `web_aoe` with `Up` status.

### 2. Debugging HLS / VOD Playback Issues
If users report "Problem encountered with playlist" or blank screen:
- Check if `.m3u8` playlists and `.ts` segments exist in `/home/playback/record/` on the remote server:
  ```bash
  echo "123456" | sudo -S ls -la /home/playback/record/
  ```
- Check the Node.js API response for `/api/recordings/:machineId` to verify the backend is correctly reading the directory structure. Be aware that the new HLS scanning logic looks for an `index.m3u8` inside a `YYYY-MM-DD` directory.

### 3. Deploying Server/Web Changes
If you modify `server/server.js` or the React frontend `src/`:
1. Rebuild the frontend locally if needed (`npm run build`).
2. Sync the updated files (`server/server.js`, `dist/`, etc.) to the remote host (e.g., using `scp` or `rsync`).
3. On the remote host, restart the web container:
   ```bash
   echo "123456" | sudo -S docker restart web_aoe
   ```

### 4. Updating SRS Configuration
If you change `srs.conf`:
1. Use `scp` to push the new `srs.conf` to the remote project directory.
2. Restart the SRS container:
   ```bash
   echo "123456" | sudo -S docker restart srs_aoe
   ```
3. Check the logs for `ConfigInvalid` or other initialization failures:
   ```bash
   echo "123456" | sudo -S docker logs --tail 50 srs_aoe
   ```

### 5. Fetching Active Streams API Output
You can hit the SRS API to see active streams directly:
```bash
curl http://192.168.9.214:1985/api/v1/streams
```

## Important Limitations
- The `test` user requires `sudo` (and thus the password) for `docker` commands.
- For lengthy operations, consider transferring a bash script to the host and executing it, instead of running extremely complex `expect` one-liners.
