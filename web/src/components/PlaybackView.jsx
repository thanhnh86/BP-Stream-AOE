import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { Calendar, Play, Clock } from 'lucide-react';

const PlaybackView = () => {
    const [replays, setReplays] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        // Fetch metadata.json from worker/data
        fetch('/api/v1/metadata')
            .then(res => res.json())
            .then(data => {
                setReplays(data);
                const dates = Object.keys(data);
                if (dates.length > 0) setSelectedDate(dates[0]);
            })
            .catch(err => console.error("Error fetching replays:", err));
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6 bg-slate-900 min-h-screen">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Video Player */}
                <div className="flex-[2] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                    {selectedDate && replays[selectedDate] ? (
                        <VideoPlayer url={`/replays/${replays[selectedDate].file}`} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            No video selected
                        </div>
                    )}
                </div>

                {/* Right: Netflix-style sidebar */}
                <div className="flex-1 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar size={24} />
                        Lịch sử Livestream
                    </h2>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide">
                        {Object.entries(replays).sort((a,b) => b[0].localeCompare(a[0])).map(([date, meta]) => (
                            <div 
                                key={date}
                                onClick={() => setSelectedDate(date)}
                                className={`flex gap-4 p-3 rounded-lg cursor-pointer transition-all border ${
                                    selectedDate === date 
                                    ? 'bg-blue-600/20 border-blue-500 shadow-lg' 
                                    : 'bg-slate-800 border-transparent hover:bg-slate-700'
                                }`}
                            >
                                <div className="w-24 h-14 bg-gray-900 rounded flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <Play size={20} className="text-white relative z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm">{date}</div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                        <Clock size={12} />
                                        {meta.duration_minutes} phút
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaybackView;
