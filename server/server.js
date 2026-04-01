import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const RECORD_DIR = process.env.RECORD_DIR || '/usr/local/srs/objs/nginx/html/record';
const LIVE_DIR = process.env.LIVE_DIR || '/usr/local/srs/objs/nginx/html/live';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/record', express.static(RECORD_DIR));
app.use('/live', express.static(LIVE_DIR));

const NAMES_FILE = path.join(RECORD_DIR, 'machine_names.json');

// Get custom machine names
app.get('/api/machine-names', (req, res) => {
    if (!fs.existsSync(NAMES_FILE)) {
        return res.json({});
    }
    try {
        const data = fs.readFileSync(NAMES_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read names' });
    }
});

// Save custom machine names
app.post('/api/machine-names', (req, res) => {
    try {
        const names = req.body;
        fs.writeFileSync(NAMES_FILE, JSON.stringify(names, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save names' });
    }
});

// Proxy for SRS Status to avoid mixed content
app.get('/api/srs-streams', async (req, res) => {
    try {
        const response = await fetch('http://192.168.9.214:1985/api/v1/streams');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'SRS API not reachable' });
    }
});

// Helper to scan for recordings (MP4 and HLS)
app.get('/api/recordings/:machineId', (req, res) => {
    const { machineId } = req.params;
    const machinePathMp4 = path.join(RECORD_DIR, 'live', machineId);
    const machinePathHls = path.join(RECORD_DIR, 'live_hls', 'live', machineId);

    // Get all dates from MP4 directory as source of truth for "days with activity"
    if (!fs.existsSync(machinePathMp4)) {
        return res.json([]);
    }

    try {
        const dates = fs.readdirSync(machinePathMp4).filter(d => fs.statSync(path.join(machinePathMp4, d)).isDirectory());
        const recordings = dates.map(date => {
            const datePathMp4 = path.join(machinePathMp4, date);
            const mp4Files = fs.readdirSync(datePathMp4)
                .filter(f => f.endsWith('.mp4'))
                .sort();
            
            const playlistMp4 = mp4Files.map(f => `/record/live/${machineId}/${date}/${f}`);
            
            // Check if daily HLS playlist exists for this date
            const hlsFile = path.join(machinePathHls, `${date}.m3u8`);
            const hasHls = fs.existsSync(hlsFile);
            
            return {
                id: date,
                date,
                title: `Video cả ngày ${date}`,
                time: `Sáng - Tối`,
                // Prefer the HLS playlist for a single-timeline experience
                url: hasHls ? `/record/live_hls/live/${machineId}/${date}.m3u8` : playlistMp4[0],
                playlist: playlistMp4,
                hasHls: hasHls
            };
        }).filter(r => r.playlist.length > 0 || r.hasHls);

        res.json(recordings.sort((a,b) => b.date.localeCompare(a.date)));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to scan recordings' });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});
