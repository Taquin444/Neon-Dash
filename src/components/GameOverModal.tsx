import React from 'react';
import { RotateCcw, Home, Skull, Trophy, Coins } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  coins: number;
  xpEarned?: number;
  stageNumber: number;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  coins,
  xpEarned = 0,
  stageNumber,
  onRetry,
  onHome,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-900 border border-red-500/40 rounded-2xl p-6 text-white text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/60 mx-auto flex items-center justify-center text-red-400 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
          <Skull className="w-8 h-8 animate-pulse" />
        </div>

        <h2 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500">
          SIGNAL TERMINATED
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Sector 0{stageNumber} Breach Failed
        </p>

        {/* Stats card */}
        <div className="grid grid-cols-3 gap-2 my-5">
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase font-mono">Score</span>
            </div>
            <p className="text-sm font-bold text-white font-mono">{score.toLocaleString()}</p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase font-mono">Coins</span>
            </div>
            <p className="text-sm font-bold text-amber-300 font-mono">+{coins}</p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-fuchsia-400 mb-1">
              <span className="text-xs">⚡</span>
              <span className="text-[9px] uppercase font-mono">XP</span>
            </div>
            <p className="text-sm font-bold text-fuchsia-300 font-mono">+{xpEarned}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => {
              soundManager.playJump();
              onRetry();
            }}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,245,212,0.4)]"
          >
            <RotateCcw className="w-4 h-4" />
            RETRY STAGE
          </button>

          <button
            onClick={onHome}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};
