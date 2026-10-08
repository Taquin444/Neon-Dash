import React, { useState } from 'react';
import { MultiplayerRoom, CharacterDef } from '../types/game';
import { CHARACTERS, STAGES } from '../game/levelData';
import { Users, Copy, Check, Share2, Play, ArrowLeft, X, Shield, Swords } from 'lucide-react';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: MultiplayerRoom | null;
  yourId: string | null;
  onCreateRoom: (stage: number) => void;
  onJoinRoom: (code: string) => void;
  onQuickMatch: () => void;
  onSetReady: (ready: boolean) => void;
  onStartMatch: (stage: number) => void;
  onLeaveRoom: () => void;
  errorMsg: string | null;
  countdown: number | null;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  room,
  yourId,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onSetReady,
  onStartMatch,
  onLeaveRoom,
  errorMsg,
  countdown,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [selectedStage, setSelectedStage] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const isHost = room && yourId ? room.hostId === yourId : false;
  const currentParticipant = room?.players.find((p) => p.id === yourId);

  const getInviteLink = () => {
    if (!room) return '';
    return `${window.location.origin}${window.location.pathname}?room=${room.code}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (!room) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join my Neon Dash Race!',
          text: `Compete against me in Neon Dash Cyber Runner! Room code: ${room.code}`,
          url: getInviteLink(),
        });
      } else {
        handleCopyLink();
      }
    } catch {
      // ignore abort
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 text-white shadow-[0_0_60px_rgba(0,245,212,0.25)]">
        {/* Close Button */}
        <button
          onClick={() => {
            if (room) onLeaveRoom();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
              VERSUS MULTIPLAYER
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Live Real-Time Head-to-Head Cyber Racing
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center">
            <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-2">
              MATCH STARTING IN
            </p>
            <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 animate-ping">
              {countdown}
            </div>
            <p className="text-xs text-slate-400 mt-4">Get ready to race!</p>
          </div>
        )}

        {!room ? (
          /* Main Matchmaking Screen */
          <div className="space-y-4">
            {/* Quick Match Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Quick Matchmaking</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant matchup with waiting cyber racers
                </p>
              </div>
              <button
                onClick={onQuickMatch}
                className="py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,245,212,0.4)] cursor-pointer"
              >
                FIND MATCH
              </button>
            </div>

            {/* Create Custom Room */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Create Private Lobby</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate a room code and invite friends
                  </p>
                </div>
              </div>

              {/* Stage Select */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  RACE TRACK (STAGE)
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  {STAGES.map((s) => (
                    <option key={s.stage} value={s.stage}>
                      Stage {s.stage}: {s.name} ({s.trackLength}m)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => onCreateRoom(selectedStage)}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 transition-all cursor-pointer"
              >
                CREATE ROOM
              </button>
            </div>

            {/* Join Room by Code */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-1">Join by Room Code</h3>
              <p className="text-xs text-slate-400 mb-3">
                Enter your friend's 5-character lobby code
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="CODE (e.g. AB12X)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-center uppercase tracking-widest font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <button
                  disabled={joinCodeInput.length < 3}
                  onClick={() => onJoinRoom(joinCodeInput)}
                  className="py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Room Lobby View */
          <div className="space-y-4">
            {/* Room Code & Social Invite Bar */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  ROOM CODE
                </p>
                <p className="text-2xl font-black font-mono tracking-widest text-white">
                  {room.code}
                </p>
              </div>

              {/* Invite Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      COPIED!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-cyan-400" />
                      COPY LINK
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-fuchsia-950/60 hover:bg-fuchsia-900/80 text-xs font-mono text-fuchsia-200 border border-fuchsia-500/40 cursor-pointer transition-colors"
                >
                  <Share2 className="w-4 h-4 text-fuchsia-400" />
                  INVITE FRIENDS
                </button>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1">
                <span>RACERS IN LOBBY ({room.players.length}/4)</span>
                <span>STATUS</span>
              </div>

              {room.players.map((p) => {
                const char = CHARACTERS.find((c) => c.name === p.character) || CHARACTERS[0];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: `${char.primaryColor}22`, color: char.primaryColor }}
                      >
                        {char.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{p.name}</span>
                          {p.id === room.hostId && (
                            <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800">
                              HOST
                            </span>
                          )}
                          {p.id === yourId && (
                            <span className="text-[9px] font-mono bg-fuchsia-950 text-fuchsia-400 px-1.5 py-0.5 rounded border border-fuchsia-800">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {p.character}
                        </span>
                      </div>
                    </div>

                    <div>
                      {p.ready ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3" /> READY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                          WAITING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lobby Action Controls */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={onLeaveRoom}
                className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 cursor-pointer"
              >
                LEAVE
              </button>

              {isHost ? (
                <button
                  onClick={() => onStartMatch(room.stage)}
                  disabled={room.players.length < 1}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-fuchsia-400 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,245,212,0.4)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  START RACE ({room.players.length} RACERS)
                </button>
              ) : (
                <button
                  onClick={() => onSetReady(!currentParticipant?.ready)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    currentParticipant?.ready
                      ? 'bg-amber-400 hover:bg-amber-300'
                      : 'bg-emerald-400 hover:bg-emerald-300'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {currentParticipant?.ready ? 'CANCEL READY' : 'SET READY'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
