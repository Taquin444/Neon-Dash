import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { Trophy, Medal, RotateCcw, X, Crown, Flame, Swords } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'score' | 'wins'>('score');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data?.leaderboard) {
        setEntries(data.leaderboard);
      }
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    if (filter === 'wins') {
      return (b.wins || 0) - (a.wins || 0);
    }
    return b.score - a.score;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 text-white shadow-[0_0_50px_rgba(0,245,212,0.2)] max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-400">
                CYBER LEADERBOARD
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Top Speed Demons & Versus Champions
              </p>
            </div>
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh Scores"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('score')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filter === 'score'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> HIGHEST SCORES
          </button>
          <button
            onClick={() => setFilter('wins')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              filter === 'wins'
                ? 'bg-fuchsia-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> VERSUS WINS
          </button>
        </div>

        {/* Leaderboard Table List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sortedEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              {loading ? 'CALCULATING GLOBAL RANKS...' : 'NO RECORDS YET. BE THE FIRST!'}
            </div>
          ) : (
            sortedEntries.map((item, idx) => {
              const isCurrentUser = item.name.toLowerCase() === currentUsername.toLowerCase();
              return (
                <div
                  key={item.id || idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_15px_rgba(0,245,212,0.15)]'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="w-8 flex items-center justify-center font-black font-mono">
                      {idx === 0 ? (
                        <Crown className="w-5 h-5 text-amber-400" />
                      ) : idx === 1 ? (
                        <Medal className="w-5 h-5 text-slate-300" />
                      ) : idx === 2 ? (
                        <Medal className="w-5 h-5 text-amber-600" />
                      ) : (
                        <span className="text-xs text-slate-500">#{idx + 1}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isCurrentUser ? 'text-cyan-300' : 'text-white'}`}>
                          {item.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{item.character}</span>
                        <span>•</span>
                        <span>Stage {item.stage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Stat */}
                  <div className="text-right">
                    {filter === 'score' ? (
                      <div>
                        <p className="text-sm font-black font-mono text-cyan-400">
                          {item.score.toLocaleString()} PTS
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.wins} Wins
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-black font-mono text-fuchsia-400">
                          {item.wins} WINS
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.score.toLocaleString()} Pts
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
