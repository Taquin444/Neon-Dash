import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap, Crosshair, Sparkles } from 'lucide-react';

interface TouchControlsProps {
  onInput: {
    left: (active: boolean) => void;
    right: (active: boolean) => void;
    jump: () => void;
    slide: () => void;
    dash: () => void;
    attack: () => void;
    powerup: () => void;
  };
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInput,
}) => {
  const triggerHaptic = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(18);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none z-30 pb-3 px-3 flex justify-between items-end">
      {/* Left Thumb Cluster: Steering Directionals */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic();
            onInput.left(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput.left(false);
          }}
          onMouseDown={() => {
            triggerHaptic();
            onInput.left(true);
          }}
          onMouseUp={() => onInput.left(false)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/80 active:bg-cyan-500/40 border-2 border-slate-700/80 active:border-cyan-400 flex items-center justify-center text-cyan-300 backdrop-blur-md shadow-lg active:scale-95 transition-all touch-none cursor-pointer"
          aria-label="Steer Left"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic();
            onInput.right(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput.right(false);
          }}
          onMouseDown={() => {
            triggerHaptic();
            onInput.right(true);
          }}
          onMouseUp={() => onInput.right(false)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/80 active:bg-cyan-500/40 border-2 border-slate-700/80 active:border-cyan-400 flex items-center justify-center text-cyan-300 backdrop-blur-md shadow-lg active:scale-95 transition-all touch-none cursor-pointer"
          aria-label="Steer Right"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Right Thumb Cluster: Combat & Agility Action Buttons */}
      <div className="flex items-end gap-2.5 pointer-events-auto">
        {/* Secondary Actions column: Shoot & Dash & Powerup */}
        <div className="flex flex-col gap-2 items-center">

          {/* Power-up button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic();
              onInput.powerup();
            }}
            onMouseDown={() => {
              triggerHaptic();
              onInput.powerup();
            }}
            className="w-11 h-11 rounded-xl bg-purple-950/80 active:bg-purple-600/50 border border-purple-400/60 flex items-center justify-center text-purple-300 backdrop-blur-md shadow-md active:scale-90 transition-all touch-none cursor-pointer"
            aria-label="Use Power-Up"
          >
            <Sparkles className="w-5 h-5 text-purple-300" />
          </button>

          {/* Shoot Blaster */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic();
              onInput.attack();
            }}
            onMouseDown={() => {
              triggerHaptic();
              onInput.attack();
            }}
            className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-emerald-500/40 border border-emerald-500/60 flex items-center justify-center text-emerald-300 backdrop-blur-md shadow-md active:scale-95 transition-all touch-none cursor-pointer"
            aria-label="Fire Blaster"
          >
            <Crosshair className="w-6 h-6" />
          </button>

          {/* Dash Turbo */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic();
              onInput.dash();
            }}
            onMouseDown={() => {
              triggerHaptic();
              onInput.dash();
            }}
            className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-amber-500/40 border border-amber-500/60 flex items-center justify-center text-amber-300 backdrop-blur-md shadow-md active:scale-95 transition-all touch-none cursor-pointer"
            aria-label="Dash Turbo"
          >
            <Zap className="w-6 h-6" />
          </button>
        </div>

        {/* Primary Action buttons: Jump & Slide */}
        <div className="flex flex-col gap-2.5 items-center">
          {/* Jump Button (Dominant) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic();
              onInput.jump();
            }}
            onMouseDown={() => {
              triggerHaptic();
              onInput.jump();
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 active:from-cyan-400 active:to-teal-200 border-2 border-cyan-200/50 flex flex-col items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(0,245,212,0.4)] active:scale-90 transition-all touch-none cursor-pointer"
            aria-label="Jump"
          >
            <ArrowUp className="w-8 h-8 stroke-[3]" />
            <span className="text-[10px] tracking-wider -mt-1 font-mono">JUMP</span>
          </button>

          {/* Slide / Duck Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic();
              onInput.slide();
            }}
            onMouseDown={() => {
              triggerHaptic();
              onInput.slide();
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/90 active:bg-fuchsia-600/40 border-2 border-fuchsia-500/70 flex flex-col items-center justify-center text-fuchsia-300 shadow-md active:scale-95 transition-all touch-none cursor-pointer"
            aria-label="Slide"
          >
            <ArrowDown className="w-6 h-6 stroke-[3]" />
            <span className="text-[9px] tracking-wider font-mono">SLIDE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
