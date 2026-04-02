import React, { useState, useEffect } from 'react';
import LiveView from './components/LiveView';
import PlaybackView from './components/PlaybackView';
import { Radio, History, LayoutDashboard, Settings, Info, Sun, Moon } from 'lucide-react';

function App() {
  const [tab, setTab] = useState('live');
  const [darkMode, setDarkMode] = useState(false);

  // Sync theme with document class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-blue-500/30 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-opacity duration-1000 ${darkMode ? 'bg-blue-600/10 opacity-100' : 'bg-blue-400/5 opacity-50'
          }`} />
        <div className={`absolute top-[20%] -right-[5%] w-[30%] h-[50%] blur-[100px] rounded-full transition-opacity duration-1000 ${darkMode ? 'bg-indigo-600/5 opacity-100' : 'bg-indigo-400/5 opacity-50'
          }`} />
      </div>

      {/* Header */}
      <header className={`flex items-center justify-between px-6 md:px-10 py-5 backdrop-blur-xl border-b sticky top-0 z-50 transition-all duration-500 ${darkMode ? 'bg-slate-950/70 border-white/5' : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
            <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl shadow-blue-500/20">
              <Radio size={24} className="text-white animate-pulse" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className={`text-2xl font-black font-outfit uppercase tracking-tight transition-all duration-500 subpixel-antialiased`}>
              <span className={darkMode ? 'bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent' : 'text-slate-900'}>
                BESTPRICE
              </span>
              <span className={`ml-1.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>AOE LIVESTREAM</span>
            </h1>
          </div>
        </div>

        <nav className={`flex items-center gap-1.5 p-1.5 rounded-2xl border ring-1 ring-black/5 shadow-inner transition-all duration-500 ${darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
          <button
            onClick={() => setTab('live')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${tab === 'live'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]'
              : darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
          >
            <Radio size={16} />
            TRỰC TIẾP
          </button>
          <button
            onClick={() => setTab('playback')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${tab === 'playback'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]'
              : darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
          >
            <History size={16} />
            PHÁT LẠI
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 transition-all duration-300 rounded-lg border ${darkMode
              ? 'text-yellow-400 bg-white/5 border-white/5 hover:bg-white/10'
              : 'text-indigo-600 bg-slate-100 border-slate-200 hover:bg-slate-200'
              }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className={`p-2 transition-colors rounded-lg ${darkMode ? 'text-slate-500 hover:text-white bg-white/5 hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}>
            <Settings size={20} />
          </button>

        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 transition-all duration-500 ease-in-out">
        {tab === 'live' ? <LiveView darkMode={darkMode} /> : <PlaybackView darkMode={darkMode} />}
      </main>

      {/* Footer */}
      <footer className={`py-12 px-6 border-t mt-12 backdrop-blur-sm transition-all duration-500 ${darkMode ? 'bg-slate-950/50 border-white/5' : 'bg-slate-50/80 border-slate-200'
        }`}>
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
          <p className={`text-xs font-medium tracking-widest transition-colors duration-500 uppercase ${darkMode ? 'text-slate-500' : 'text-slate-600 text-slate-900/60'
            }`}>
            &copy; 2026 <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>BESTPRICE STREAMING</span> ARCHITECTURE. DESIGNED FOR <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>BESTPRICE AOE TOURNAMENT</span>.
          </p>
          <div className="flex items-center gap-8">
            <div className={`w-12 h-[1px] ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/10 shadow-blue-900/10 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
            <div className={`w-12 h-[1px] ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`} />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
