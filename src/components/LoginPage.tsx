import React, { useState } from 'react';
import { PlayerStats, CharacterId } from '../types/game';
import { CHARACTERS } from '../game/levelData';
import { soundManager } from '../audio/soundManager';
import { LogIn, UserPlus, KeyRound, User, ShieldCheck, AlertCircle, Sparkles, Swords, Zap, ArrowRight, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (stats: PlayerStats) => void;
  initialStats: PlayerStats;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  initialStats,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedChar, setSelectedChar] = useState<CharacterId>('ninja');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both your pilot callsign and security passcode.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      soundManager.playVictory();
      setSuccessMsg(`Welcome back, Pilot ${cleanUser}! Loading cloud save...`);

      const loadedStats: PlayerStats = {
        ...initialStats,
        ...data.profile,
        username: cleanUser,
        isLoggedIn: true,
      };

      try {
        localStorage.setItem('neon_dash_player_stats', JSON.stringify(loadedStats));
      } catch {
        // ignore
      }

      setTimeout(() => {
        onLoginSuccess(loadedStats);
      }, 600);
    } catch {
      setErrorMsg('Could not connect to auth server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (cleanUser.length < 3) {
      setErrorMsg('Callsign must be at least 3 characters.');
      return;
    }
    if (cleanPass.length < 4) {
      setErrorMsg('Passcode must be at least 4 characters.');
      return;
    }
    if (cleanPass !== confirmPassword.trim()) {
      setErrorMsg('Passcodes do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const newPlayerStats: PlayerStats = {
      ...initialStats,
      username: cleanUser,
      isLoggedIn: true,
      selectedCharacter: selectedChar,
      unlockedCharacters: [selectedChar],
      coins: 300, // Starter bonus!
      highScore: 0,
      maxStageUnlocked: 1,
      multiplayerWins: 0,
      multiplayerRaces: 0,
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password: cleanPass,
          initialData: newPlayerStats,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      soundManager.playPowerUp();
      setSuccessMsg(`Pilot ${cleanUser} registered! Loading cyber grid...`);

      const registeredStats: PlayerStats = {
        ...newPlayerStats,
        ...data.profile,
        username: cleanUser,
        isLoggedIn: true,
      };

      try {
        localStorage.setItem('neon_dash_player_stats', JSON.stringify(registeredStats));
      } catch {
        // ignore
      }

      setTimeout(() => {
        onLoginSuccess(registeredStats);
      }, 600);
    } catch {
      setErrorMsg('Could not reach registration server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    soundManager.playJump();
    const guestName = 'Racer_' + Math.floor(1000 + Math.random() * 9000);
    const guestStats: PlayerStats = {
      ...initialStats,
      username: guestName,
      isLoggedIn: true,
    };
    try {
      localStorage.setItem('neon_dash_player_stats', JSON.stringify(guestStats));
    } catch {
      // ignore
    }
    onLoginSuccess(guestStats);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 overflow-y-auto">
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 245, 212, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(247, 37, 133, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-cyan-500/50 rounded-3xl p-6 sm:p-8 text-white shadow-[0_0_80px_rgba(0,245,212,0.35)] backdrop-blur-xl">
        {/* Neon Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-fuchsia-500 flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(0,245,212,0.6)] mb-3 animate-pulse">
            <Swords className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-fuchsia-400">
            NEON DASH
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-widest mt-1">
            CYBER MULTIPLAYER RUNNER • PILOT AUTH
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> PILOT LOGIN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> CREATE IDENTITY
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Container */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
                PILOT CALLSIGN
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={18}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. CyberNinja, VoltRider"
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none font-mono tracking-wide transition-colors"
                  required
                />
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
                SECURITY PASSCODE
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none font-mono tracking-wide transition-colors"
                  required
                />
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-400 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,245,212,0.4)] disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'ENTER CYBER RUNWAY'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-fuchsia-400 uppercase tracking-widest mb-1.5">
                CHOOSE PILOT CALLSIGN
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={18}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Unique pilot name"
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-fuchsia-400 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none font-mono tracking-wide transition-colors"
                  required
                />
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-fuchsia-400 uppercase tracking-widest mb-1.5">
                  SECURITY PASSCODE
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 4 chars"
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-fuchsia-400 uppercase tracking-widest mb-1.5">
                  CONFIRM PASSCODE
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat code"
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Starter Character Select */}
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                SELECT STARTER AVATAR
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CHARACTERS.slice(0, 3).map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedChar(char.id)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedChar === char.id
                        ? 'bg-fuchsia-950/60 border-fuchsia-400 shadow-[0_0_12px_rgba(247,37,133,0.3)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center font-bold text-xs mb-1"
                      style={{ backgroundColor: `${char.primaryColor}25`, color: char.primaryColor }}
                    >
                      {char.name[0]}
                    </div>
                    <p className="text-[10px] font-bold truncate text-white">{char.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-fuchsia-400 to-pink-400 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(247,37,133,0.4)] disabled:opacity-50"
            >
              {loading ? 'REGISTERING...' : 'REGISTER & CLAIM 300 COINS'}
              <Sparkles className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Guest Play Divider */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 mb-2">
            Want to test-drive without saving to cloud?
          </p>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            PLAY AS GUEST PILOT
          </button>
        </div>
      </div>
    </div>
  );
};
