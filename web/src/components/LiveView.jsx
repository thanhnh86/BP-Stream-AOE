import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { Shield, Edit2, Check, X, Activity, Wifi, WifiOff, Users, Trophy } from 'lucide-react';

const LiveView = ({ darkMode }) => {
  const [playerNames, setPlayerNames] = useState({});
  const [activeStreams, setActiveStreams] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const team1Ids = ['team1-1', 'team1-2', 'team1-3', 'team1-4'];
  const team2Ids = ['team2-1', 'team2-2', 'team2-3', 'team2-4'];

  useEffect(() => {
    fetch('/api/v1/players')
      .then(res => res.json())
      .then(data => setPlayerNames(data))
      .catch(err => console.error('Error fetching player names:', err));

    const checkStatus = () => {
      fetch('/srs/api/v1/streams/')
        .then(res => res.json())
        .then(data => {
          if (data && data.code === 0 && data.streams) {
            const streamMap = {};
            data.streams.forEach(s => {
              if (s.publish && s.publish.active) {
                streamMap[s.name] = s.app;
              }
            });
            setActiveStreams(streamMap);
          } else {
            setActiveStreams({});
          }
        })
        .catch(err => {
          console.error('SRS API check failed:', err);
        });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveName = (id) => {
    const newNames = { ...playerNames, [id]: editValue };
    setPlayerNames(newNames);
    fetch('/api/v1/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNames),
    });
    setEditingId(null);
  };

  const renderTeam = (ids, name, colorClass, accentColor) => (
    <div className="flex-1 flex flex-col gap-5">
      <div className={`relative overflow-hidden p-4 rounded-2xl border shadow-2xl transition-all duration-500 ${colorClass} ${darkMode ? 'border-white/10' : 'border-black/5 shadow-lg'
        }`}>
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 translate-x-4 -translate-y-4">
          <Shield size={120} strokeWidth={1.5} />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter text-white">{name}</h2>
              <div className="flex items-center gap-2">
                <Users size={12} className="text-white/60" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">4 Thành viên</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 backdrop-blur-md rounded-full border transition-colors duration-500 ${darkMode ? 'bg-black/20 border-white/10' : 'bg-white/20 border-white/30'
            }`}>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              {ids.filter(id => !!activeStreams[id]).length} / {ids.length} Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ids.map((id) => {
          const isOnline = !!activeStreams[id];
          const playerName = playerNames[id] || id;
          const appName = activeStreams[id] || 'live';

          return (
            <div key={id} className={`group relative backdrop-blur-sm p-3 rounded-2xl border transition-all duration-500 overflow-hidden ${darkMode
              ? `${isOnline ? 'border-blue-500/30' : 'border-white/5 hover:border-white/10'} bg-slate-900/40`
              : `${isOnline ? 'border-blue-400 bg-white' : 'border-slate-200 hover:border-blue-300 bg-white shadow-sm'}`
              }`}>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    {isOnline && <div className="absolute inset-0 bg-green-500 blur-sm animate-pulse opacity-50" />}
                    <div className={`relative w-2.5 h-2.5 rounded-full z-10 ${isOnline ? 'bg-green-500' : darkMode ? 'bg-slate-700' : 'bg-slate-400'}`} />
                  </div>

                  {editingId === id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <input
                        autoFocus
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border outline-none w-32 focus:ring-2 focus:ring-blue-500/20 transition-colors ${darkMode ? 'bg-slate-800 text-white border-blue-500/50' : 'bg-slate-50 text-slate-900 border-blue-300'
                          }`}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveName(id)}
                      />
                      <button onClick={() => saveName(id)} className="p-1 text-green-500 hover:bg-green-400/10 rounded-md transition-colors"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-red-500 hover:bg-red-400/10 rounded-md transition-colors"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/name">
                      <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${isOnline ? (darkMode ? 'text-white' : 'text-slate-950') : (darkMode ? 'text-slate-400' : 'text-black')}`}>
                        {playerName}
                      </span>
                      <button
                        onClick={() => { setEditingId(id); setEditValue(playerName); }}
                        className={`opacity-0 group-hover/name:opacity-100 p-1 transition-all transform scale-90 hover:scale-100 ${darkMode ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'
                          }`}
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className={`px-2 py-0.5 rounded-md border transition-colors ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <span className={`text-[9px] font-black font-mono uppercase tracking-tighter ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{id}</span>
                </div>
              </div>

              {/* Video/Placeholder Container */}
              <div className={`aspect-video rounded-xl overflow-hidden ring-1 relative shadow-inner group-hover:shadow-2xl transition-all duration-500 ${darkMode ? 'ring-white/5 bg-slate-950/80' : 'ring-slate-200 bg-slate-50'
                }`}>
                {isOnline ? (
                  <VideoPlayer url={`/${appName}/${id}.m3u8`} />
                ) : (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br transition-all duration-500 ${darkMode ? 'from-slate-900 to-slate-950' : 'from-slate-100 to-slate-200'
                    }`}>
                    <div className="relative">
                      <Activity size={48} strokeWidth={1} className={darkMode ? 'text-slate-800/80' : 'text-slate-300'} />
                      <WifiOff size={20} className={`absolute -bottom-1 -right-1 ${darkMode ? 'text-slate-700' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>Mất tín hiệu</span>
                      <div className={`w-8 h-0.5 mt-1 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-300'}`}>
                        <div className="w-1/2 h-full bg-blue-500/50 animate-shimmer" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlay Badge */}
                {isOnline && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded-md shadow-lg animate-pulse-soft">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">LIVE</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-12">
      {/* Intro Section */}
      <div
        className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${darkMode
          ? "bg-slate-900/60 border border-white/10"
          : "bg-white border border-slate-200 shadow-xl shadow-slate-200/50"
          }`}
      >
        <div className="flex flex-col md:flex-row items-center min-h-[220px] px-6 md:px-10 py-6 gap-8">

          {/* TEXT */}
          <div className="md:w-[40%] space-y-5 flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <h2
                className={`text-xl md:text-2xl font-black font-outfit uppercase tracking-tight leading-tight ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                Hệ thống theo dõi các trận đấu AOE đỉnh cao của  <br />
                <span className="text-blue-600">Best Price</span>
              </h2>
            </div>

            <p
              className={`text-xs md:text-sm font-medium leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Nền tảng thi đấu chính thức của{" "}
              <span className="font-bold text-blue-500/80">
                Best Price Travel
              </span>
              . Hội tụ tinh hoa chiến thuật và tinh thần đồng đội của tập thể công ty.
            </p>
          </div>

          {/* IMAGE */}
          <div className="md:w-[60%] flex justify-end">
            <div className="w-full relative overflow-hidden rounded-xl group">

              {/* Overlay */}
              <div
                className={`absolute inset-y-0 left-0 z-10 hidden md:block w-32 ${darkMode
                  ? "bg-gradient-to-r from-slate-950 to-transparent"
                  : "bg-gradient-to-r from-white to-transparent"
                  }`}
              />

              <img
                src="/aoe_banner_final.png"
                alt="AOE Best Price Branding"
                className="w-full aspect-[21/9] md:aspect-[3/1] object-cover object-[center_35%] shadow-2xl transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10">
        {renderTeam(team1Ids, 'Team 01', 'bg-gradient-to-br from-blue-600 to-blue-800', 'blue')}
        {renderTeam(team2Ids, 'Team 02', 'bg-gradient-to-br from-red-600 to-red-800', 'red')}
      </div>

      {/* Network Diagnostics */}
      <div className={`backdrop-blur-md border rounded-2xl p-6 shadow-xl transition-all duration-500 ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'
        }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <Wifi size={18} className="text-blue-500" />
          </div>
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>Chẩn đoán hệ thống</h3>
            <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>Luồng dữ liệu SRS Backend</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {Object.keys(activeStreams).length > 0 ? (
            Object.keys(activeStreams).map(name => (
              <div key={name} className={`group flex items-center gap-2 pl-2 pr-3 py-1.5 border rounded-xl transition-colors ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className={`text-[11px] font-bold font-mono italic ${darkMode ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                  {name} <span className="text-slate-400 mx-1">•</span> <span className="text-slate-500 font-normal not-italic">{activeStreams[name]}</span>
                </span>
              </div>
            ))
          ) : (
            <div className={`flex items-center gap-3 p-4 w-full rounded-xl border border-dashed transition-all duration-500 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <p className={`text-xs font-medium italic ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>Đang đợi tín hiệu phát sóng...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveView;
