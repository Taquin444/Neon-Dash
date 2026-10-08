import React, { useState } from 'react';
import { PowerUpType, RemotePlayer, VehicleId, GadgetId } from '../types/game';
import { Volume2, VolumeX, Pause, Heart, Coins, Trophy, Smile, Car, Bot } from 'lucide-react';
import { POWER_UPS, VEHICLES, GADGETS } from '../game/levelData';

interface GameHUDProps {
  score: number;
  coins: number;
  health: number;
  progress: number;
  stageName: string;
  stageNumber: number;
  activePowerUps: { type: PowerUpType; timeLeft: number }[];
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  isMultiplayer: boolean;
  remotePlayers: RemotePlayer[];
  onSendEmote?: (emote: string) => void;
  equippedVehicle?: VehicleId;
  equippedGadget?: GadgetId;
  isVehicleMounted?: boolean;
  onToggleVehicleMount?: () => void;
}

const EMOTES = ['🔥', '💨', '😈', '👑', '⚡', 'GG'];

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  coins,
  health,
  progress,
  stageName,
  stageNumber,
  activePowerUps,
  isMuted,
  onToggleMute,
  onPause,
  isMultiplayer,
  remotePlayers,
  onSendEmote,
  equippedVehicle,
  equippedGadget,
  isVehicleMounted,
  onToggleVehicleMount,
}) => {
  const [showEmotePicker, setShowEmotePicker] = useState(false);

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none select-none z-20 p-3 sm:p-4 font-sans">
      {/* Top Bar: Stats, Stage, Audio & Pause Controls */}
      <div className="flex justify-between items-start gap-3">
        {/* Left: Health & Score */}
        <div className="flex flex-col gap-2">
          {/* Health Bar */}
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto shadow-md">
            <Heart className={`w-4 h-4 ${health < 30 ? 'text-red-500 animate-ping' : 'text-rose-400'}`} />
            <div className="w-24 sm:w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  health > 50
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    : health > 25
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-300 min-w-[28px]">
              {health}%
            </span>
          </div>

          {/* Score & Coins Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 pointer-events-auto">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-cyan-300">
                {score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 pointer-events-auto">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono font-bold text-amber-300">
                {coins}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Stage Header & Vehicle/Gadget Status */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="bg-slate-950/80 backdrop-blur-md px-4 py-1 rounded-lg border border-cyan-500/30 text-center">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              STAGE {stageNumber}
            </span>
            <p className="text-xs font-bold text-white tracking-wide">
              {stageName}
            </p>
          </div>

          {/* Vehicle & Gadget Status Pills */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {equippedVehicle && equippedVehicle !== 'none' && (
              <button
                onClick={onToggleVehicleMount}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer backdrop-blur-md shadow-sm ${
                  isVehicleMounted
                    ? 'bg-teal-950/90 text-teal-300 border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle Vehicle Mount (Key: V)"
              >
                <span>{VEHICLES.find((v) => v.id === equippedVehicle)?.icon || '🏎️'}</span>
                <span>{isVehicleMounted ? 'MOUNTED [V]' : 'MOUNT [V]'}</span>
              </button>
            )}

            {equippedGadget && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-emerald-300 backdrop-blur-md shadow-sm">
                <span>{GADGETS.find((g) => g.id === equippedGadget)?.icon || '🛸'}</span>
                <span className="hidden sm:inline">
                  {GADGETS.find((g) => g.id === equippedGadget)?.name.split(' ')[0] || 'GADGET'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Audio & Pause & Emote triggers */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {isMultiplayer && (
            <div className="relative">
              <button
                onClick={() => setShowEmotePicker(!showEmotePicker)}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-amber-300 backdrop-blur-md transition-colors cursor-pointer shadow-md"
                title="Send Emote"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Emote dropdown picker */}
              {showEmotePicker && (
                <div className="absolute right-0 top-11 flex gap-1.5 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50">
                  {EMOTES.map((emo) => (
                    <button
                      key={emo}
                      onClick={() => {
                        onSendEmote?.(emo);
                        setShowEmotePicker(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 backdrop-blur-md transition-colors cursor-pointer shadow-md"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onPause}
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 backdrop-blur-md transition-colors cursor-pointer shadow-md"
            title="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Track Bar (With Local Player & Multiplayer Opponent Markers) */}
      <div className="mt-3 max-w-md mx-auto pointer-events-auto">
        <div className="relative w-full h-2 bg-slate-950/80 rounded-full border border-slate-800 overflow-visible backdrop-blur-md">
          {/* Track Progress Fill */}
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />

          {/* Local Player Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_8px_#00f5d4] transition-all duration-150 flex items-center justify-center text-[8px] font-bold text-slate-950"
            style={{ left: `${progress}%` }}
          >
            YOU
          </div>

          {/* Opponent Markers in Multiplayer */}
          {isMultiplayer &&
            remotePlayers.map((rp) => (
              <div
                key={rp.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-fuchsia-500 border border-white shadow-[0_0_6px_#f72585] transition-all duration-200"
                style={{ left: `${rp.progress}%` }}
                title={`${rp.name}: ${rp.progress}%`}
              />
            ))}
        </div>
      </div>

      {/* Active Power-Ups Badges */}
      {activePowerUps.length > 0 && (
        <div className="mt-3 flex items-center gap-2 pointer-events-auto overflow-x-auto pb-1">
          {activePowerUps.map((pu) => {
            const def = POWER_UPS.find((p) => p.id === pu.type);
            if (!def) return null;
            return (
              <div
                key={pu.type}
                className="flex items-center gap-1.5 bg-slate-900/90 border border-cyan-400/50 px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(0,245,212,0.3)] animate-pulse"
              >
                <span className="text-sm">{def.icon}</span>
                <span className="text-[10px] font-mono font-bold text-cyan-300">
                  {def.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {pu.timeLeft.toFixed(1)}s
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
