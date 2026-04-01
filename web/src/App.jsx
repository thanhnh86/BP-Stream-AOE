import React, { useState } from 'react';
import LiveView from './components/LiveView';
import PlaybackView from './components/PlaybackView';
import { Radio, History, LayoutDashboard } from 'lucide-react';

function App() {
  const [tab, setTab] = useState('live');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Radio size={24} className="text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              BestPrice AOE Stream
            </h1>
            <p className="text-xs text-slate-400 font-mono">Live Monitoring Dashboard</p>
          </div>
        </div>

        <nav className="flex gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          <button 
            onClick={() => setTab('live')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              tab === 'live' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={18} />
            Live
          </button>
          <button 
            onClick={() => setTab('playback')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              tab === 'playback' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History size={18} />
            Xem lại
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="transition-all duration-300">
        {tab === 'live' ? <LiveView /> : <PlaybackView />}
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        &copy; 2026 BestPrice AOE Tournament System. Powered by SRS.
      </footer>
    </div>
  );
}

export default App;
