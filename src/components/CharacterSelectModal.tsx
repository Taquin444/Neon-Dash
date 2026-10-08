import React from 'react';
import { CharacterDef, CharacterId } from '../types/game';
import { CHARACTERS } from '../game/levelData';
import { soundManager } from '../audio/soundManager';
import { Check, Lock, Zap, Shield, Sparkles, X, Coins } from 'lucide-react';

interface CharacterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: CharacterId;
  unlockedCharacters: CharacterId[];
  userCoins: number;
  onSelectCharacter: (id: CharacterId) => void;
  onUnlockCharacter: (id: CharacterId, cost: number) => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  isOpen,
  onClose,
  selectedId,
  unlockedCharacters,
  userCoins,
  onSelectCharacter,
  onUnlockCharacter,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 text-white shadow-[0_0_50px_rgba(0,245,212,0.2)] max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-fuchsia-400">
                CYBER RUNNERS
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Select your cybernetic champion & unique perks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-300">
              {userCoins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 overflow-y-auto pr-1">
          {CHARACTERS.map((char) => {
            const isUnlocked = unlockedCharacters.includes(char.id) || char.cost === 0;
            const isSelected = selectedId === char.id;
            const canAfford = userCoins >= char.cost;

            return (
              <div
                key={char.id}
                className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,245,212,0.2)]'
                    : isUnlocked
                    ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md"
                        style={{
                          backgroundColor: `${char.primaryColor}25`,
                          border: `1.5px solid ${char.primaryColor}`,
                          color: char.primaryColor,
                        }}
                      >
                        {char.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{char.name}</h3>
                        <p className="text-[10px] text-cyan-400 font-mono">{char.title}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-mono bg-cyan-400 text-slate-950 font-bold px-2 py-0.5 rounded-full shadow-sm">
                        EQUIPPED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    {char.description}
                  </p>

                  {/* Perk Badge */}
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg mb-3">
                    <p className="text-[10px] font-mono text-fuchsia-400 uppercase tracking-wider mb-0.5">
                      SIGNATURE PERK
                    </p>
                    <p className="text-xs text-slate-200 font-semibold">{char.perk}</p>
                  </div>

                  {/* Attributes */}
                  <div className="space-y-1.5 mb-4 text-[11px] font-mono">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>RUN SPEED:</span>
                      <span className="text-cyan-300">{(char.speedMultiplier * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>JUMP FORCE:</span>
                      <span className="text-cyan-300">{(char.jumpMultiplier * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div>
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        soundManager.playJump();
                        onSelectCharacter(char.id);
                      }}
                      disabled={isSelected}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-800 text-slate-400 cursor-default'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,245,212,0.3)]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> CURRENT HERO
                        </>
                      ) : (
                        'SELECT RUNNER'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        soundManager.playPowerUp();
                        onUnlockCharacter(char.id, char.cost);
                      }}
                      disabled={!canAfford}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      UNLOCK ({char.cost.toLocaleString()} COINS)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
