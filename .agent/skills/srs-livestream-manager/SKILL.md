---
name: srs-livestream-manager
description: Manage and maintain the SRS-based AOE Livestream system for BestPrice. Use this skill when requested to modify stream configurations (srs.conf), update the video processing worker, adjust the React-based dashboard dashboard, or troubleshoot recording and playback issues.
---

# SRS Livestream Manager

A skill for managing the AOE Streaming stack at BestPrice.

## Overview

The system consists of:
1. **SRS Server**: Core streaming engine (HLS + DVR).
2. **Worker**: Python/FFmpeg service for daily video merging.
3. **Dashboard**: React interface for Live (8 players) and Playback (Daily replays).
4. **Nginx**: Serving the frontend and proxying HLS/API request.

## Common Tasks

### Modifying Stream Keys
The system is configured for 8 players: `team1-1` to `team1-4` and `team2-1` to `team2-4`.
- To add more keys, update `LiveView.jsx` and `srs.conf` if specific logic is needed.

### Adjusting HLS Performance
To reduce latency, modify `srs.conf`:
- `hls_fragment`: Decrease (e.g., 1s instead of 2s).
- `hls_window`: Increase for more buffer.

### Managing Playback Logic
The worker merges files based on the `on_dvr` hook.
- Data is stored in the Docker volume `srs_data` mapped to `/data` in containers.
- Replays are served by Nginx via the `/replays/` location.
- Metadata for the Netflix-style gallery is in `metadata.json`.

## Directory Structure
- `/srs.conf`: SRS server config.
- `/docker-compose.yml`: Service orchestration.
- `/worker/`: Video processing logic.
- `/web/`: React Dashboard frontend.
- `/scripts/`: Operational scripts.

## Operations
- Deploy/Restart: `docker compose up -d --build`.
- Check Logs: `docker compose logs -f srs` or `docker compose logs -f worker`.
