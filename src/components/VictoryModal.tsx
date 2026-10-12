import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Coins, ArrowRight, RotateCcw, Home, Crown } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface VictoryModalProps {
  isOpen: boolean;
  score: number;
  coins: number;
  xpEarned?: number;
  stageNumber: number;
  hasNextStage: boolean;
  isMultiplayer: boolean;
  onNextStage: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  score,
  coins,
  xpEarned = 350,
  stageNumber,
  hasNextStage,
  isMultiplayer,
  onNextStage,
  onReplay,
  onHome,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f5d4', '#f72585', '#fee440', '#38bdf8'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-900 border border-cyan-400/50 rounded-2xl p-6 text-white text-center shadow-[0_0_60px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 mx-auto flex items-center justify-center text-slate-950 mb-4 shadow-[0_0_30px_rgba(0,245,212,0.5)]">
          {isMultiplayer ? (
            <Crown className="w-9 h-9 stroke-[2.5]" />
          ) : (
            <Trophy className="w-8 h-8 stroke-[2.5]" />
          )}
        </div>

        <h2 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-fuchsia-400">
          {stageNumber === 10
            ? '5X FINAL BOSS DEFEATED!'
            : stageNumber === 5
            ? 'MINI-BOSS DEFEATED!'
            : isMultiplayer
            ? 'COMBAT VICTORY!'
            : 'STAGE CLEARED!'}
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          {stageNumber === 10
            ? 'All five waves cleared. The Omega Colossus is down.'
            : stageNumber === 5
            ? 'All five waves cleared. Glitch Overlord Prime is down.'
            : `All five waves cleared in Sector 0${stageNumber}.`}
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
          {hasNextStage && !isMultiplayer ? (
            <button
              onClick={() => {
                soundManager.playJump();
                onNextStage();
              }}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-400 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,245,212,0.4)]"
            >
              NEXT STAGE (STAGE {stageNumber + 1})
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playJump();
                onReplay();
              }}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,245,212,0.4)]"
            >
              <RotateCcw className="w-4 h-4" />
              FIGHT AGAIN
            </button>
          )}

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
