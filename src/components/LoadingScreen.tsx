import React, { useState, useEffect } from 'react';
import { soundManager } from '../audio/soundManager';
import { Zap, Play, Shield, Crosshair } from 'lucide-react';

interface LoadingScreenProps {
  onStart: () => void;
}

const TIPS = [
  'Move manually with A / D or the arrow keys. Release both directions to stop.',
  'Hold K / F or hold the touch fire button to shoot; shots aim toward the nearest hostile.',
  'Clear all five waves, then defeat the Stage 5 mini-boss or the 5× Stage 10 Colossus.',
  'Double jump with Space / W to dodge incoming hostile fire and reach elevated routes.',
  'Slide with S / Down under laser gates, or dash with Shift / J through danger.',
  'Upgrade weapons in the Cyber Armory to cut down the Stage 10 boss faster.',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onStart }) => {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 2800);

    const loadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(loadInterval);
          setIsReady(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15 + 8);
      });
    }, 120);

    return () => {
      clearInterval(tipInterval);
      clearInterval(loadInterval);
    };
  }, []);

  const handleStartGame = () => {
    soundManager.playJump();
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 text-white select-none px-6 py-10 overflow-hidden font-sans">
      {/* Background Cyber Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 245, 212, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 245, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 text-center mt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 text-xs tracking-wider uppercase font-mono">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          Neural Link Online
        </div>
      </div>

      {/* Central Hero Branding */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md my-auto">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl border-2 border-cyan-400/60 bg-slate-900/90 flex items-center justify-center shadow-[0_0_40px_rgba(0,245,212,0.4)]">
            <Zap className="w-12 h-12 text-cyan-400 animate-bounce" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-30 blur-lg -z-10" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-fuchsia-500 drop-shadow-md">
          NEON DASH
        </h1>
        <p className="text-sm font-mono tracking-widest text-slate-400 mt-2 uppercase">
          Manual Neon Combat • Five Waves Per Sector
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-xs text-slate-300">
          <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
            <Crosshair className="w-3 h-3 text-cyan-400" /> Manual Combat
          </span>
          <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
            <Shield className="w-3 h-3 text-fuchsia-400" /> Power-Up Arsenal
          </span>
          <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
            <Zap className="w-3 h-3 text-amber-400" /> 5 Waves / Stage
          </span>
        </div>
      </div>

      {/* Bottom Loading Progress or Start Button */}
      <div className="relative z-10 w-full max-w-sm mb-4 flex flex-col items-center">
        {!isReady ? (
          <div className="w-full">
            <div className="flex justify-between items-center text-xs font-mono text-cyan-400 mb-2">
              <span>INITIALIZING SYSTEM...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-fuchsia-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={handleStartGame}
            className="w-full py-4 px-6 rounded-xl font-black text-lg tracking-wider uppercase text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-400 shadow-[0_0_30px_rgba(0,245,212,0.6)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            ENTER THE MATRIX
          </button>
        )}

        {/* Tip Box */}
        <div className="mt-6 text-center min-h-[3rem] px-4">
          <p className="text-xs text-slate-400 font-sans italic transition-opacity duration-300">
            "{TIPS[tipIndex]}"
          </p>
        </div>
      </div>
    </div>
  );
};
