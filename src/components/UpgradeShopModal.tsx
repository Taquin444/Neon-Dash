import React, { useState } from 'react';
import { PowerUpType, WeaponId, CapeId, VehicleId, GadgetId, PlayerStats } from '../types/game';
import { POWER_UPS, WEAPONS, CAPES, VEHICLES, GADGETS } from '../game/levelData';
import { soundManager } from '../audio/soundManager';
import {
  Shield,
  Zap,
  ArrowUp,
  Coins,
  X,
  Check,
  Lock,
  Swords,
  Sparkles,
  Car,
  Bot,
} from 'lucide-react';

interface UpgradeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onUpgradePowerUp: (type: PowerUpType, cost: number) => void;
  onPurchaseWeapon: (id: WeaponId, cost: number) => void;
  onEquipWeapon: (id: WeaponId) => void;
  onPurchaseCape: (id: CapeId, cost: number) => void;
  onEquipCape: (id: CapeId) => void;
  onPurchaseVehicle?: (id: VehicleId, cost: number) => void;
  onEquipVehicle?: (id: VehicleId) => void;
  onPurchaseGadget?: (id: GadgetId, cost: number) => void;
  onEquipGadget?: (id: GadgetId) => void;
  initialTab?: 'weapons' | 'capes' | 'vehicles' | 'gadgets' | 'powerups';
}

export const UpgradeShopModal: React.FC<UpgradeShopModalProps> = ({
  isOpen,
  onClose,
  stats,
  onUpgradePowerUp,
  onPurchaseWeapon,
  onEquipWeapon,
  onPurchaseCape,
  onEquipCape,
  onPurchaseVehicle,
  onEquipVehicle,
  onPurchaseGadget,
  onEquipGadget,
  initialTab = 'weapons',
}) => {
  const [activeTab, setActiveTab] = useState<'weapons' | 'capes' | 'vehicles' | 'gadgets' | 'powerups'>(initialTab);

  if (!isOpen) return null;

  const playerLevel = stats.playerLevel || 1;
  const userCoins = stats.coins;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 text-white shadow-[0_0_60px_rgba(0,245,212,0.25)] max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Swords className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-fuchsia-400">
                  CYBER ARMORY & TECH HANGAR
                </h2>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-md border border-cyan-700">
                  PILOT LVL {playerLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Level milestones unlock Weapons, Capes, Vehicles & Gadgets
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

        {/* Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('weapons')}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'weapons'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3 h-3" />
            <span className="truncate">WEAPONS</span>
          </button>
          <button
            onClick={() => setActiveTab('capes')}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'capes'
                ? 'bg-fuchsia-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span className="truncate">CAPES</span>
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'vehicles'
                ? 'bg-teal-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3 h-3" />
            <span className="truncate">VEHICLES</span>
          </button>
          <button
            onClick={() => setActiveTab('gadgets')}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'gadgets'
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span className="truncate">GADGETS</span>
          </button>
          <button
            onClick={() => setActiveTab('powerups')}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'powerups'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span className="truncate">POWER-UPS</span>
          </button>
        </div>

        {/* Tab 1: WEAPONS */}
        {activeTab === 'weapons' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {WEAPONS.map((wpn) => {
              const isLevelReached = playerLevel >= wpn.requiredLevel;
              const isUnlocked = stats.unlockedWeapons?.includes(wpn.id) || wpn.cost === 0;
              const isEquipped = stats.equippedWeapon === wpn.id;
              const canAfford = userCoins >= wpn.cost;

              return (
                <div
                  key={wpn.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,245,212,0.2)]'
                      : isLevelReached
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-950/40 border-slate-900 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md border"
                      style={{
                        backgroundColor: `${wpn.color}15`,
                        borderColor: isLevelReached ? `${wpn.color}60` : '#475569',
                      }}
                    >
                      {isLevelReached ? wpn.icon : <Lock className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{wpn.name}</h3>
                        {!isLevelReached ? (
                          <span className="text-[10px] font-mono bg-red-950/80 text-red-400 border border-red-800 px-1.5 py-0.5 rounded">
                            REQ LVL {wpn.requiredLevel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-slate-800 text-cyan-400 border border-slate-700 px-1.5 py-0.5 rounded">
                            {wpn.type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                        {wpn.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-cyan-300 mt-1">
                        <span>DMG: {wpn.damage}</span>
                        <span>•</span>
                        <span>FIRE RATE: {(1 / wpn.fireRate).toFixed(1)}/s</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {!isLevelReached ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-500 border border-slate-800">
                          <Lock className="w-3.5 h-3.5" /> LVL {wpn.requiredLevel}
                        </span>
                        <p className="text-[9px] text-red-400 font-mono mt-1">
                          Need {wpn.requiredLevel - playerLevel} more level(s)
                        </p>
                      </div>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => {
                          soundManager.playJump();
                          onEquipWeapon(wpn.id);
                        }}
                        disabled={isEquipped}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </>
                        ) : (
                          'EQUIP'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          soundManager.playPowerUp();
                          onPurchaseWeapon(wpn.id, wpn.cost);
                        }}
                        disabled={!canAfford}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-sm'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        {wpn.cost.toLocaleString()} C
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: CAPES & CLOAKS (Levels 1 - 10) */}
        {activeTab === 'capes' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {CAPES.map((cape) => {
              const isLevelReached = playerLevel >= cape.requiredLevel;
              const isUnlocked = stats.unlockedCapes?.includes(cape.id) || cape.cost === 0;
              const isEquipped = stats.equippedCape === cape.id;
              const canAfford = userCoins >= cape.cost;

              return (
                <div
                  key={cape.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'bg-fuchsia-950/40 border-fuchsia-400 shadow-[0_0_15px_rgba(247,37,133,0.2)]'
                      : isLevelReached
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-950/40 border-slate-900 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md border"
                      style={{
                        backgroundColor: `${cape.color}15`,
                        borderColor: isLevelReached ? `${cape.color}60` : '#475569',
                      }}
                    >
                      {isLevelReached ? cape.icon : <Lock className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{cape.name}</h3>
                        {!isLevelReached ? (
                          <span className="text-[10px] font-mono bg-red-950/80 text-red-400 border border-red-800 px-1.5 py-0.5 rounded">
                            REQ LVL {cape.requiredLevel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 px-1.5 py-0.5 rounded">
                            {cape.perk}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                        {cape.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    {!isLevelReached ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-500 border border-slate-800">
                          <Lock className="w-3.5 h-3.5" /> LVL {cape.requiredLevel}
                        </span>
                        <p className="text-[9px] text-red-400 font-mono mt-1">
                          Need {cape.requiredLevel - playerLevel} more level(s)
                        </p>
                      </div>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => {
                          soundManager.playJump();
                          onEquipCape(cape.id);
                        }}
                        disabled={isEquipped}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : 'bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 shadow-sm'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </>
                        ) : (
                          'EQUIP'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          soundManager.playPowerUp();
                          onPurchaseCape(cape.id, cape.cost);
                        }}
                        disabled={!canAfford}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-sm'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        {cape.cost.toLocaleString()} C
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: VEHICLES (CYBER GARAGE) */}
        {activeTab === 'vehicles' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {VEHICLES.map((veh) => {
              const isLevelReached = playerLevel >= veh.requiredLevel;
              const isUnlocked = stats.unlockedVehicles?.includes(veh.id);
              const isEquipped = stats.equippedVehicle === veh.id;
              const canAfford = userCoins >= veh.cost;

              return (
                <div
                  key={veh.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'bg-teal-950/40 border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                      : isLevelReached
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-950/40 border-slate-900 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border"
                      style={{
                        backgroundColor: `${veh.primaryColor}15`,
                        borderColor: isLevelReached ? `${veh.primaryColor}60` : '#475569',
                      }}
                    >
                      {isLevelReached ? veh.icon : <Lock className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{veh.name}</h3>
                        {!isLevelReached ? (
                          <span className="text-[10px] font-mono bg-red-950/80 text-red-400 border border-red-800 px-1.5 py-0.5 rounded">
                            REQ LVL {veh.requiredLevel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.5 rounded">
                            {veh.tagline}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                        {veh.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-teal-300 mt-1">
                        <span>SPEED: {Math.round((veh.speedMultiplier - 1) * 100)}%</span>
                        <span>•</span>
                        <span>PERK: {veh.perk}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {!isLevelReached ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-500 border border-slate-800">
                          <Lock className="w-3.5 h-3.5" /> LVL {veh.requiredLevel}
                        </span>
                        <p className="text-[9px] text-red-400 font-mono mt-1">
                          Need {veh.requiredLevel - playerLevel} more level(s)
                        </p>
                      </div>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => {
                          soundManager.playJump();
                          if (onEquipVehicle) onEquipVehicle(veh.id);
                        }}
                        disabled={isEquipped}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-sm'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </>
                        ) : (
                          'EQUIP'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          soundManager.playPowerUp();
                          if (onPurchaseVehicle) onPurchaseVehicle(veh.id, veh.cost);
                        }}
                        disabled={!canAfford}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-sm'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        {veh.cost.toLocaleString()} C
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: GADGETS (CYBER TECH LAB) */}
        {activeTab === 'gadgets' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {GADGETS.map((gad) => {
              const isLevelReached = playerLevel >= gad.requiredLevel;
              const isUnlocked = stats.unlockedGadgets?.includes(gad.id);
              const isEquipped = stats.equippedGadget === gad.id;
              const canAfford = userCoins >= gad.cost;

              return (
                <div
                  key={gad.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                      : isLevelReached
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-950/40 border-slate-900 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border"
                      style={{
                        backgroundColor: `${gad.color}15`,
                        borderColor: isLevelReached ? `${gad.color}60` : '#475569',
                      }}
                    >
                      {isLevelReached ? gad.icon : <Lock className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{gad.name}</h3>
                        {!isLevelReached ? (
                          <span className="text-[10px] font-mono bg-red-950/80 text-red-400 border border-red-800 px-1.5 py-0.5 rounded">
                            REQ LVL {gad.requiredLevel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded capitalize">
                            {gad.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                        {gad.description}
                      </p>
                      <p className="text-[10px] font-mono text-emerald-300 mt-1">
                        PERK: {gad.perk}
                      </p>
                    </div>
                  </div>

                  <div>
                    {!isLevelReached ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-500 border border-slate-800">
                          <Lock className="w-3.5 h-3.5" /> LVL {gad.requiredLevel}
                        </span>
                        <p className="text-[9px] text-red-400 font-mono mt-1">
                          Need {gad.requiredLevel - playerLevel} more level(s)
                        </p>
                      </div>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => {
                          soundManager.playJump();
                          if (onEquipGadget) onEquipGadget(gad.id);
                        }}
                        disabled={isEquipped}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-sm'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </>
                        ) : (
                          'EQUIP'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          soundManager.playPowerUp();
                          if (onPurchaseGadget) onPurchaseGadget(gad.id, gad.cost);
                        }}
                        disabled={!canAfford}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-sm'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        {gad.cost.toLocaleString()} C
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 5: POWER-UPS */}
        {activeTab === 'powerups' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {POWER_UPS.map((pu) => {
              const currentLvl = stats.powerUpLevels[pu.id] || 1;
              const isMaxLvl = currentLvl >= 5;
              const upgradeCost = pu.upgradeCost * currentLvl;
              const canAfford = userCoins >= upgradeCost;
              const currentDuration = pu.duration + (currentLvl - 1) * 1.5;

              return (
                <div
                  key={pu.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md border"
                      style={{
                        backgroundColor: `${pu.color}15`,
                        borderColor: `${pu.color}55`,
                      }}
                    >
                      {pu.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{pu.name}</h3>
                        <span className="text-[10px] font-mono bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700">
                          LVL {currentLvl}/5
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                        {pu.description}
                      </p>
                      <p className="text-[10px] font-mono text-cyan-300 mt-1">
                        Duration: {currentDuration.toFixed(1)}s {!isMaxLvl && `(Next: ${(currentDuration + 1.5).toFixed(1)}s)`}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isMaxLvl ? (
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> MAXED
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          soundManager.playPowerUp();
                          onUpgradePowerUp(pu.id, upgradeCost);
                        }}
                        disabled={!canAfford}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-slate-950 hover:brightness-110 shadow-sm'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        {upgradeCost} C
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
