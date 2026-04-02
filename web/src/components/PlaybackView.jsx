import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { Calendar, Play, Clock, Monitor, Archive, Filter, ChevronRight, HardDrive, AlertCircle } from 'lucide-react';

const PlaybackView = ({ darkMode }) => {
    const [replays, setReplays] = useState({});
    const [playerNames, setPlayerNames] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStream, setSelectedStream] = useState(null);

    useEffect(() => {
        fetch('/api/v1/metadata')
            .then(res => res.json())
            .then(data => {
                setReplays(data);
                const dates = Object.keys(data).sort((a, b) => b.localeCompare(a));
                if (dates.length > 0) {
                    setSelectedDate(dates[0]);
                    const streams = data[dates[0]].streams || {};
                    const streamIds = Object.keys(streams);
                    if (streamIds.length > 0) setSelectedStream(streamIds[0]);
                }
            })
            .catch(err => console.error("Error fetching replays:", err));

        fetch('/api/v1/players')
            .then(res => res.json())
            .then(data => setPlayerNames(data))
            .catch(err => console.error('Error fetching player names:', err));
    }, []);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        const streams = replays[date].streams || {};
        const streamIds = Object.keys(streams);
        if (streamIds.length > 0) {
            setSelectedStream(streamIds[0]);
        } else {
            setSelectedStream(null);
        }
    };

    const currentVideo = (selectedDate && selectedStream && replays[selectedDate]?.streams?.[selectedStream]) 
        ? replays[selectedDate].streams[selectedStream] 
        : null;

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
            <div className="flex flex-col xl:flex-row gap-10">
                {/* Main Player Area */}
                <div className="flex-1 space-y-6">
                    <div className="relative group">
                        <div className={`absolute -inset-1 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 ${
                            darkMode ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20' : 'bg-gradient-to-r from-blue-400/20 to-indigo-400/20'
                        }`}></div>
                        <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl border transition-all duration-500 ${
                            darkMode ? 'bg-black border-white/5 ring-1 ring-white/10' : 'bg-slate-200 border-slate-300 ring-1 ring-slate-100'
                        }`}>
                            {currentVideo ? (
                                <VideoPlayer url={`/replays/${currentVideo.file}`} />
                            ) : (
                                <div className={`w-full h-full flex flex-col items-center justify-center gap-6 transition-colors duration-500 ${
                                    darkMode ? 'text-slate-700 bg-slate-950/50' : 'text-slate-400 bg-slate-50'
                                }`}>
                                    <div className={`p-6 rounded-full border transition-all duration-500 ${
                                        darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <Monitor size={64} strokeWidth={1} className={darkMode ? 'opacity-40' : 'opacity-20'} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-40">Đang đợi lựa chọn</p>
                                        <p className="text-[10px] font-medium mt-2">Chọn ngày và máy để bắt đầu phát lại</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {currentVideo ? (
                        <div className={`p-8 backdrop-blur-md rounded-3xl border shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all duration-500 ${
                            darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'
                        }`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 rounded-2xl border transition-colors ${
                                        darkMode ? 'bg-blue-600/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                                    }`}>
                                        <Monitor size={32} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className={`text-2xl font-black font-outfit uppercase tracking-tight transition-colors ${
                                                darkMode ? 'text-white' : 'text-slate-900'
                                            }`}>
                                                {playerNames[selectedStream] || selectedStream}
                                            </h3>
                                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-tighter border transition-colors ${
                                                darkMode ? 'bg-white/5 text-slate-500 border-white/5' : 'bg-slate-100 text-slate-400 border-slate-200'
                                            }`}>{selectedStream}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <p className={`text-xs font-bold flex items-center gap-2 uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                <Calendar size={14} className="text-blue-500/60" /> {selectedDate}
                                            </p>
                                            <div className={`w-1 h-1 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
                                            <p className={`text-xs font-bold flex items-center gap-2 uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                <Clock size={14} className="text-blue-500/60" /> {currentVideo.duration_minutes} PHÚT
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${
                                        darkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                    }`}>
                                        Tải Log
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-8 rounded-3xl border flex items-center gap-4 transition-all duration-500 ${
                            darkMode ? 'bg-blue-600/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'
                        }`}>
                            <AlertCircle className="text-blue-500" size={20} />
                            <p className={`text-sm font-medium italic ${darkMode ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                                Chọn một bản ghi từ danh sách lưu trữ để xem dữ liệu trận đấu và hiệu suất người chơi.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Area: Control Panel */}
                <div className="w-full xl:w-96 space-y-8">
                    {/* Date Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Archive size={16} className="text-blue-500/50" /> BẢN GHI LƯU TRỮ
                            </h2>
                            <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>{Object.keys(replays).length} NGÀY</span>
                        </div>
                        <div className="flex flex-col gap-2.5 max-h-[35vh] overflow-y-auto pr-3 scrollbar-thin">
                            {Object.entries(replays).sort((a, b) => b[0].localeCompare(a[0])).map(([date, meta]) => (
                                <div key={date} className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleDateChange(date)}
                                        className={`group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border ${
                                            selectedDate === date 
                                            ? 'bg-blue-600 text-white border-blue-400 shadow-xl shadow-blue-900/40 scale-[1.02]' 
                                            : darkMode 
                                                ? 'bg-slate-900/40 border-white/5 hover:border-white/10 text-slate-400' 
                                                : 'bg-white border-slate-200 hover:border-blue-300 text-slate-500 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${selectedDate === date ? 'bg-white/20' : (darkMode ? 'bg-white/5' : 'bg-slate-100')}`}>
                                                <Calendar size={14} />
                                            </div>
                                            <span className="font-bold text-sm tracking-tight">{date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {meta.status === 'processing' && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-md border border-yellow-500/20">
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Đang gộp</span>
                                                    <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                                                </div>
                                            )}
                                            <ChevronRight size={16} className={`transition-transform duration-300 ${selectedDate === date ? 'rotate-90' : 'opacity-20 group-hover:opacity-100'}`} />
                                        </div>
                                    </button>
                                    
                                    {selectedDate === date && meta.status !== 'completed' && (
                                        <button 
                                            onClick={() => {
                                                fetch(`/api/v1/merge/${date}`, { method: 'POST' });
                                                alert('Đã bắt đầu quá trình gộp video...');
                                            }}
                                            className="mx-2 mb-2 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-black text-emerald-400 rounded-xl border border-emerald-500/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2 group/btn"
                                        >
                                            <HardDrive size={12} className="group-hover/btn:scale-110 transition-transform" />
                                            Gộp Video Ngày Này
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Machine Selection */}
                    {selectedDate && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-6 duration-500">
                            <div className="flex items-center justify-between px-1">
                                <h2 className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    <Filter size={16} className="text-blue-500/50" /> CÁC MÁY THI ĐẤU
                                </h2>
                                <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>{Object.keys(replays[selectedDate].streams || {}).length} MÁY</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 max-h-[45vh] overflow-y-auto pr-3 scrollbar-thin">
                                {Object.entries(replays[selectedDate].streams || {}).map(([s_id, meta]) => (
                                    <button
                                        key={s_id}
                                        onClick={() => setSelectedStream(s_id)}
                                        className={`group relative flex flex-col p-4 rounded-2xl transition-all duration-300 border ${
                                            selectedStream === s_id 
                                            ? 'bg-blue-600 text-white border-blue-400 shadow-2xl scale-[1.02]' 
                                            : darkMode 
                                                ? 'bg-slate-900/40 border-white/5 hover:border-white/10 text-slate-400' 
                                                : 'bg-white border-slate-200 hover:border-blue-300 text-slate-500 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center w-full mb-2">
                                            <span className={`font-black font-outfit uppercase tracking-tight text-sm ${selectedStream === s_id ? 'text-white' : (darkMode ? 'text-white' : 'text-slate-900')}`}>
                                                {playerNames[s_id] || s_id}
                                            </span>
                                            <span className={`text-[9px] font-black font-mono uppercase tracking-tighter ${selectedStream === s_id ? 'text-blue-200' : 'text-slate-600'}`}>{s_id}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${selectedStream === s_id ? 'text-blue-100' : 'text-slate-500'}`}>
                                                <Clock size={12} className={selectedStream === s_id ? 'text-white' : 'text-blue-500/60'} />
                                                {meta.duration_minutes} PHÚT
                                            </div>
                                            <div className={`w-1 h-1 rounded-full ${selectedStream === s_id ? 'bg-blue-200' : (darkMode ? 'bg-slate-800' : 'bg-slate-300')}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedStream === s_id ? 'text-blue-100' : 'text-slate-600'}`}>Đã lưu</span>
                                        </div>
                                        {selectedStream === s_id && (
                                            <div className="absolute right-4 bottom-4 p-1 bg-white rounded-full text-blue-600 shadow-lg">
                                                <Play size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {Object.keys(replays[selectedDate].streams || {}).length === 0 && (
                                    <div className={`p-10 text-center rounded-3xl border border-dashed transition-colors ${
                                        darkMode ? 'bg-slate-900/20 border-white/5' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        <div className="flex justify-center mb-4">
                                            <Archive size={32} className={darkMode ? 'text-slate-800' : 'text-slate-300'} />
                                        </div>
                                        <p className={`text-xs font-bold uppercase tracking-widest italic ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>Không có bản ghi</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaybackView;
