import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { calculatePlayerLevel, WEAPONS, CAPES } from '../game/levelData';
import { User, Trophy, Coins, Zap, X, Check, ShieldCheck, Sparkles, LogIn, Lock, Award, CloudDownload } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  stats,
  onUpdateStats,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'progress'>('account');
  const [usernameInput, setUsernameInput] = useState(stats.username);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  if (!isOpen) return null;

  const levelInfo = calculatePlayerLevel(stats.xp);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = usernameInput.trim() || 'CyberRunner';
    const updated: PlayerStats = {
      ...stats,
      username: cleanName,
      isLoggedIn: true,
      playerLevel: levelInfo.level,
    };
    onUpdateStats(updated);

    try {
      localStorage.setItem('neon_dash_player_stats', JSON.stringify(updated));
      await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanName,
          data: updated,
        }),
      });
      setStatusMessage('Progress synced & Logged in!');
    } catch {
      setStatusMessage('Saved locally in browser!');
    }

    soundManager.playPowerUp();
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 900);
  };

  const handleLoadCloudProfile = async () => {
    const cleanName = usernameInput.trim();
    if (!cleanName) return;

    setIsLoadingProfile(true);
    setStatusMessage('Syncing data from server...');

    try {
      const res = await fetch(`/api/profile/${cleanName.toLowerCase()}`);
      const data = await res.json();
      if (data?.profile) {
        const loaded: PlayerStats = {
          ...stats,
          ...data.profile,
          username: cleanName,
          isLoggedIn: true,
        };
        onUpdateStats(loaded);
        localStorage.setItem('neon_dash_player_stats', JSON.stringify(loaded));
        soundManager.playVictory();
        setStatusMessage(`Welcome back, ${cleanName}! Progress restored.`);
      } else {
        setStatusMessage(`No existing cloud save found for ${cleanName}. Created new pilot!`);
      }
    } catch {
      setStatusMessage('Could not reach cloud server. Using local save.');
    } finally {
      setIsLoadingProfile(false);
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 text-white shadow-[0_0_60px_rgba(0,245,212,0.25)] max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-600 flex items-center justify-center text-slate-950 shadow-md">
            <User className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                PILOT TERMINAL
              </h2>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-700">
                LVL {levelInfo.level}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Account Login & Level Milestones (Levels 1 - 10+)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'account'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> LOG IN & STATS
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'progress'
                ? 'bg-fuchsia-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> LEVEL PROGRESSION
          </button>
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-cyan-400" />
            {statusMessage}
          </div>
        )}

        {/* Tab 1: Account Login & Summary */}
        {activeTab === 'account' ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Level & XP Banner */}
            <div className="bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-500/30 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    PILOT RANK
                  </span>
                  <p className="text-base font-black text-white">
                    LEVEL {levelInfo.level} CYBER RUNNER
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-fuchsia-400 font-bold">
                    {levelInfo.currentXp} / {levelInfo.nextLevelXp} XP
                  </span>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full transition-all duration-300"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                {levelInfo.progressPercent}% to Level {levelInfo.level + 1} • Earn XP by clearing enemy waves, collecting coins, and defeating bosses!
              </p>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Energy Coins</p>
                  <p className="text-base font-bold text-amber-300">{stats.coins.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                <Trophy className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">High Score</p>
                  <p className="text-base font-bold text-cyan-300">{stats.highScore.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                <Zap className="w-5 h-5 text-fuchsia-400" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Sector Cleared</p>
                  <p className="text-base font-bold text-fuchsia-300">Sector 0{stats.maxStageUnlocked}</p>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Versus Wins</p>
                  <p className="text-base font-bold text-emerald-300">{stats.multiplayerWins} W</p>
                </div>
              </div>
            </div>

            {/* Login / Save Form */}
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-cyan-400 mb-1">
                  CALLSIGN (USERNAME)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={16}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter pilot callsign"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono tracking-wider"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleLoadCloudProfile}
                    disabled={isLoadingProfile}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Load Profile from Cloud"
                  >
                    <CloudDownload className="w-4 h-4 text-cyan-400" />
                    SYNC
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-slate-950 bg-gradient-to-r from-cyan-400 to-fuchsia-400 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,245,212,0.4)]"
              >
                <Check className="w-4 h-4" />
                SAVE & LOG IN AS PILOT
              </button>
            </form>
          </div>
        ) : (
          /* Tab 2: Level Progression Roadmap (Levels 1 - 10+) */
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <p className="text-xs text-slate-400 font-mono mb-2">
              Unlock weapons and capes as your pilot level advances from Level 1 to 10+:
            </p>

            {/* Level Milestones List */}
            <div className="space-y-2">
              {[
                { lvl: 1, title: 'Level 1: Novice Runner', reward: 'Cyber Katana & Holo-Runner Scarf', unlocked: levelInfo.level >= 1 },
                { lvl: 3, title: 'Level 3: Cyber Infiltrator', reward: 'Plasma Blaster Unlocked', unlocked: levelInfo.level >= 3 },
                { lvl: 4, title: 'Level 4: Speed Specialist', reward: 'Neon Flux Cape Unlocked (+10% Dash)', unlocked: levelInfo.level >= 4 },
                { lvl: 5, title: 'Level 5: Overdrive Ranger', reward: 'Dual Photon Pistols Unlocked', unlocked: levelInfo.level >= 5 },
                { lvl: 7, title: 'Level 7: Stealth Enforcer', reward: 'Hyper Railgun & Shadow Void Cloak Unlocked', unlocked: levelInfo.level >= 7 },
                { lvl: 10, title: 'Level 10: Cosmic Ascendant', reward: 'Celestial Quantum Wings & Void Scythe Unlocked!', unlocked: levelInfo.level >= 10 },
              ].map((m) => (
                <div
                  key={m.lvl}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    m.unlocked
                      ? 'bg-slate-950/80 border-cyan-500/40'
                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        m.unlocked
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {m.lvl}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${m.unlocked ? 'text-white' : 'text-slate-400'}`}>
                        {m.title}
                      </h4>
                      <p className="text-[11px] text-cyan-300 font-mono">
                        {m.reward}
                      </p>
                    </div>
                  </div>

                  <div>
                    {m.unlocked ? (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> UNLOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> LVL {m.lvl} REQ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
