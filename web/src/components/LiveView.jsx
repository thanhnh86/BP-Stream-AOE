import React from 'react';
import VideoPlayer from './VideoPlayer';
import { Users, Shield } from 'lucide-react';

const LiveView = () => {
  const teams = {
    team1: ['team1-1', 'team1-2', 'team1-3', 'team1-4'],
    team2: ['team2-1', 'team2-2', 'team2-3', 'team2-4'],
  };

  const renderTeam = (teamId, name, color) => (
    <div className="flex-1 space-y-4">
      <div className={`flex items-center gap-2 p-3 ${color} rounded-t-lg border-b-2 border-white/10`}>
        <Shield size={20} className="text-white" />
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">{name}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {teams[teamId].map((id) => (
          <div key={id} className="relative group">
            <div className="aspect-video">
              <VideoPlayer url={`/__defaultApp__/${id}.m3u8`} />
            </div>
            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 bg-slate-900 min-h-screen">
      {renderTeam('team1', 'Team 1 (Blue)', 'bg-blue-600')}
      {renderTeam('team2', 'Team 2 (Red)', 'bg-red-600')}
    </div>
  );
};

export default LiveView;
