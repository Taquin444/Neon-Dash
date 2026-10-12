/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/gameEngine';
import { LoadingScreen } from './components/LoadingScreen';
import { GameHUD } from './components/GameHUD';
import { TouchControls } from './components/TouchControls';
import { AuthModal } from './components/AuthModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { UpgradeShopModal } from './components/UpgradeShopModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { LoginPage } from './components/LoginPage';
import { STAGES, CHARACTERS, calculatePlayerLevel } from './game/levelData';
import { soundManager } from './audio/soundManager';
import {
  PlayerStats,
  CharacterId,
  PowerUpType,
  MultiplayerRoom,
  RemotePlayer,
  WeaponId,
  CapeId,
} from './types/game';
import {
  Play,
  Users,
  Trophy,
  Zap,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Swords,
  ChevronRight,
  Shield,
  Award,
  Bot,
  LogOut,
} from 'lucide-react';

const INITIAL_STATS: PlayerStats = {
  username: 'CyberPilot',
  isLoggedIn: false, // Prompts user to log in / register or play as guest
  playerLevel: 1,
  xp: 0,
  xpToNextLevel: 500,
  coins: 250,
  highScore: 0,
  maxStageUnlocked: 1,
  multiplayerWins: 0,
  multiplayerRaces: 0,
  selectedCharacter: 'ninja',
  unlockedCharacters: ['ninja'],
  equippedWeapon: 'katana',
  unlockedWeapons: ['katana'],
  equippedCape: 'starter_scarf',
  unlockedCapes: ['starter_scarf'],
  equippedGadget: 'combat_drone',
  unlockedGadgets: ['combat_drone'],
  powerUpLevels: {
    speed_dash: 1,
    plasma_shield: 1,
    coin_magnet: 1,
    triple_blaster: 1,
    chrono_warp: 1,
    hyper_jetpack: 1,
    quantum_nova: 1,
  },
};

export default function App() {
  // Screens & Modals
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [upgradeShopTab, setUpgradeShopTab] = useState<'weapons' | 'capes' | 'gadgets' | 'powerups'>('weapons');

  // Stats & Progress
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem('neon_dash_player_stats');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_STATS;
  });

  // Game telemetry
  const [currentStage, setCurrentStage] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [health, setHealth] = useState(100);
  const [progress, setProgress] = useState(0);
  const [waveNumber, setWaveNumber] = useState(1);
  const [enemiesRemaining, setEnemiesRemaining] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<{ type: PowerUpType; timeLeft: number }[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Floating emotes
  const [floatingEmotes, setFloatingEmotes] = useState<{ id: string; text: string; sender: string }[]>([]);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [levelUpAlert, setLevelUpAlert] = useState<{ level: number; message: string } | null>(null);

  // Multiplayer WebSocket State
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [room, setRoom] = useState<MultiplayerRoom | null>(null);
  const [yourId, setYourId] = useState<string | null>(null);
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const [matchCountdown, setMatchCountdown] = useState<number | null>(null);
  const [isMultiplayerMatch, setIsMultiplayerMatch] = useState(false);

  // Canvas & Engine Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Mutable refs for engine callbacks to prevent recreation/freezing
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const currentStageRef = useRef(currentStage);
  currentStageRef.current = currentStage;
  const wsRef = useRef(ws);
  wsRef.current = ws;
  const isMultiplayerMatchRef = useRef(isMultiplayerMatch);
  isMultiplayerMatchRef.current = isMultiplayerMatch;

  // Save Stats Helper
  const saveStats = (newStats: PlayerStats) => {
    setStats(newStats);
    statsRef.current = newStats;
    try {
      localStorage.setItem('neon_dash_player_stats', JSON.stringify(newStats));
      fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newStats.username, data: newStats }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  // Submit Score Helper
  const submitScore = (finalScore: number, finalStage: number, isWin: boolean = false) => {
    const currentS = statsRef.current;
    const updatedWins = currentS.multiplayerWins + (isWin ? 1 : 0);
    const updatedHighScore = Math.max(currentS.highScore, finalScore);
    const updatedStage = Math.max(currentS.maxStageUnlocked, finalStage);

    const updated = {
      ...currentS,
      highScore: updatedHighScore,
      maxStageUnlocked: updatedStage,
      multiplayerWins: updatedWins,
    };
    saveStats(updated);

    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: currentS.username,
        character: CHARACTERS.find((c) => c.id === currentS.selectedCharacter)?.name || 'Neon Ninja',
        score: updatedHighScore,
        stage: updatedStage,
        wins: updatedWins,
      }),
    }).catch(() => {});
  };

  // Initialize Game Engine (Instantiated once to avoid freeze or desync)
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onScoreUpdate: (s) => setScore(s),
      onCoinsUpdate: (c) => setCoins(c),
      onHealthUpdate: (h) => setHealth(h),
      onProgressUpdate: (p) => setProgress(p),
      onWaveUpdate: (wave, remaining, stageProgress) => {
        setWaveNumber(wave);
        setEnemiesRemaining(remaining);
        setProgress(stageProgress);
      },
      onPowerUpActive: (list) => setActivePowerUps(list),
      onGameOver: (finalScore, finalCoins, xpEarned) => {
        setIsPlaying(false);
        setShowGameOverModal(true);
        setLastXpEarned(xpEarned || 50);

        const currentS = statsRef.current;
        const stageNow = currentStageRef.current;
        const newTotalCoins = currentS.coins + finalCoins;
        const newTotalXp = (currentS.xp || 0) + (xpEarned || 50);
        const levelData = calculatePlayerLevel(newTotalXp);
        const didLevelUp = levelData.level > (currentS.playerLevel || 1);

        const updated: PlayerStats = {
          ...currentS,
          coins: newTotalCoins,
          xp: newTotalXp,
          playerLevel: levelData.level,
        };
        saveStats(updated);
        submitScore(finalScore, stageNow, false);

        if (didLevelUp) {
          soundManager.playVictory();
          setLevelUpAlert({
            level: levelData.level,
            message: `Reached Level ${levelData.level}! Check Cyber Armory for newly unlocked weapons & power-ups.`,
          });
          setTimeout(() => setLevelUpAlert(null), 4500);
        }
      },
      onStageClear: (finalScore, finalCoins, xpEarned) => {
        setIsPlaying(false);
        setShowVictoryModal(true);
        setLastXpEarned(xpEarned || 350);

        const currentS = statsRef.current;
        const stageNow = currentStageRef.current;
        const newTotalCoins = currentS.coins + finalCoins + 100; // 100 stage clear bonus
        const nextStage = Math.min(STAGES.length, stageNow + 1);
        const updatedMaxStage = Math.max(currentS.maxStageUnlocked, nextStage);
        const newTotalXp = (currentS.xp || 0) + (xpEarned || 350);
        const levelData = calculatePlayerLevel(newTotalXp);
        const didLevelUp = levelData.level > (currentS.playerLevel || 1);

        const updated: PlayerStats = {
          ...currentS,
          coins: newTotalCoins,
          maxStageUnlocked: updatedMaxStage,
          xp: newTotalXp,
          playerLevel: levelData.level,
        };
        saveStats(updated);
        submitScore(finalScore, stageNow, isMultiplayerMatchRef.current);

        if (didLevelUp) {
          soundManager.playVictory();
          setLevelUpAlert({
            level: levelData.level,
            message: `Reached Level ${levelData.level}! Check Cyber Armory for newly unlocked weapons & power-ups.`,
          });
          setTimeout(() => setLevelUpAlert(null), 4500);
        }

        // Notify multiplayer opponents when the five-wave combat challenge is cleared.
        const socket = wsRef.current;
        if (isMultiplayerMatchRef.current && socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'PLAYER_FINISH',
            payload: { finishTime: Date.now() },
          }));
        }
      },
      onSendState: (statePayload) => {
        const socket = wsRef.current;
        if (socket && socket.readyState === WebSocket.OPEN && isMultiplayerMatchRef.current) {
          socket.send(JSON.stringify({
            type: 'UPDATE_STATE',
            payload: statePayload,
          }));
        }
      },
      onUsePowerup: (powerupType) => {
        const socket = wsRef.current;
        if (socket && socket.readyState === WebSocket.OPEN && isMultiplayerMatchRef.current) {
          socket.send(JSON.stringify({
            type: 'USE_POWERUP',
            payload: { powerup: powerupType },
          }));
        }
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // WebSocket Setup
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
    const socketUrl = envWsUrl || `${protocol}//${window.location.host}`;
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(socketUrl);
      setWs(socket);

      socket.onopen = () => {
        // Check for URL room parameter: ?room=XYZ
        const params = new URLSearchParams(window.location.search);
        const roomCode = params.get('room');
        if (roomCode && socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'JOIN_ROOM',
            payload: {
              code: roomCode,
              name: stats.username,
              character: CHARACTERS.find((c) => c.id === stats.selectedCharacter)?.name || 'Neon Ninja',
            },
          }));
          setShowMultiplayerModal(true);
        }
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, payload } = msg;

          switch (type) {
            case 'ROOM_CREATED':
            case 'ROOM_JOINED': {
              setRoom(payload.room);
              setYourId(payload.yourId);
              setMultiplayerError(null);
              break;
            }

            case 'ROOM_UPDATE': {
              setRoom(payload.room);
              break;
            }

            case 'ERROR': {
              setMultiplayerError(payload.message);
              break;
            }

            case 'MATCH_COUNTDOWN': {
              setMatchCountdown(payload.seconds);
              let remaining = payload.seconds;
              const cdInterval = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                  clearInterval(cdInterval);
                  setMatchCountdown(null);
                } else {
                  setMatchCountdown(remaining);
                }
              }, 1000);
              break;
            }

            case 'MATCH_STARTED': {
              setRoom(payload.room);
              setMatchCountdown(null);
              setShowMultiplayerModal(false);
              setIsMultiplayerMatch(true);
              startRace(payload.room.stage || 1, true);
              break;
            }

            case 'PLAYER_MOVED': {
              if (engineRef.current) {
                engineRef.current.remotePlayers.set(payload.id, payload);
              }
              break;
            }

            case 'POWERUP_TRIGGERED': {
              // Combat effect triggered by rival
              soundManager.playDash();
              break;
            }

            case 'PLAYER_FINISHED': {
              setRoom(payload.room);
              break;
            }

            case 'MATCH_ENDED': {
              setRoom(payload.room);
              break;
            }

            case 'EMOTE_RECEIVED': {
              const id = Math.random().toString();
              setFloatingEmotes((prev) => [
                ...prev.slice(-3),
                { id, text: payload.emote, sender: payload.playerId },
              ]);
              setTimeout(() => {
                setFloatingEmotes((prev) => prev.filter((e) => e.id !== id));
              }, 2500);
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.warn('WS message handling error:', err);
        }
      };

      socket.onerror = () => {
        // silent fallback
      };
    } catch (err) {
      console.warn('WebSocket connection init failed:', err);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [stats.username, stats.selectedCharacter]);

  // Start Race Action
  const startRace = (stageNum: number, isMultiplayer: boolean = false) => {
    const validStage = Math.max(1, Math.min(STAGES.length, stageNum));
    setCurrentStage(validStage);
    setIsPlaying(true);
    setIsPaused(false);
    setShowGameOverModal(false);
    setShowVictoryModal(false);
    setIsMultiplayerMatch(isMultiplayer);

    if (engineRef.current) {
      engineRef.current.initStage(
        validStage,
        stats.selectedCharacter,
        isMultiplayer,
        stats.powerUpLevels,
        stats.equippedWeapon || 'katana',
        stats.equippedCape || 'starter_scarf',
        stats.equippedGadget || 'combat_drone'
      );
      engineRef.current.start();
    }
  };

  // Touch Control Dispatcher
  const touchInputHandlers = {
    left: (active: boolean) => {
      if (engineRef.current) engineRef.current.touchInput.left = active;
    },
    right: (active: boolean) => {
      if (engineRef.current) engineRef.current.touchInput.right = active;
    },
    jump: () => {
      if (engineRef.current) engineRef.current.triggerJump();
    },
    slide: () => {
      if (engineRef.current) engineRef.current.triggerSlide();
    },
    dash: () => {
      if (engineRef.current) engineRef.current.triggerDash();
    },
    attack: (active: boolean) => {
      if (!engineRef.current) return;
      engineRef.current.touchInput.attack = active;
      if (active) engineRef.current.triggerShoot();
    },
    powerup: () => {
      if (engineRef.current) engineRef.current.triggerInventoryPowerup();
    },
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  // Pause / Resume
  const handleTogglePause = () => {
    if (!isPlaying) return;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (engineRef.current) {
      engineRef.current.setPaused(nextPaused);
    }
  };

  const handleLogout = () => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN && room) {
      socket.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    }
    engineRef.current?.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setIsMultiplayerMatch(false);
    setRoom(null);
    setYourId(null);
    setShowAuthModal(false);
    setShowLeaderboardModal(false);
    setShowMultiplayerModal(false);
    setShowCharacterModal(false);
    setShowUpgradeModal(false);
    setShowGameOverModal(false);
    setShowVictoryModal(false);

    const loggedOut = { ...statsRef.current, isLoggedIn: false };
    setStats(loggedOut);
    statsRef.current = loggedOut;
    try {
      localStorage.setItem('neon_dash_player_stats', JSON.stringify(loggedOut));
    } catch {
      // Keep logout available even if browser storage is blocked.
    }
  };

  // Multiplayer Actions
  const handleCreateRoom = (stage: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        payload: {
          stage,
          name: stats.username,
          character: CHARACTERS.find((c) => c.id === stats.selectedCharacter)?.name || 'Neon Ninja',
        },
      }));
    } else {
      // Local Room Fallback
      const fakeCode = 'CYBER' + Math.floor(10 + Math.random() * 89);
      const myId = 'local_player';
      const localRoom: MultiplayerRoom = {
        code: fakeCode,
        hostId: myId,
        stage,
        status: 'waiting',
        players: [
          {
            id: myId,
            name: stats.username,
            character: CHARACTERS.find((c) => c.id === stats.selectedCharacter)?.name || 'Neon Ninja',
            ready: true,
            x: 50,
            y: 0,
            vx: 0,
            vy: 0,
            progress: 0,
            spriteState: 'idle',
            facing: 'right',
            health: 100,
            score: 0,
            finished: false,
            activePowerups: [],
          },
        ],
      };
      setRoom(localRoom);
      setYourId(myId);
    }
  };

  const handleJoinRoom = (code: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          code,
          name: stats.username,
          character: CHARACTERS.find((c) => c.id === stats.selectedCharacter)?.name || 'Neon Ninja',
        },
      }));
    } else {
      // Join fallback
      handleQuickMatch();
    }
  };

  const handleQuickMatch = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'QUICK_MATCH',
        payload: {
          stage: 1,
          name: stats.username,
          character: CHARACTERS.find((c) => c.id === stats.selectedCharacter)?.name || 'Neon Ninja',
        },
      }));
    } else {
      // Quick Match Fallback with rival racer
      const rivalHero = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      const rivalName = 'GlitchRider_' + Math.floor(10 + Math.random() * 89);
      const myId = 'local_player';
      const botId = 'bot_rival';

      const botPlayer: RemotePlayer = {
        id: botId,
        name: rivalName,
        character: rivalHero.name,
        ready: true,
        x: 50,
        y: 380,
        vx: 380,
        vy: 0,
        progress: 0,
        spriteState: 'run',
        facing: 'right',
        health: 100,
        score: 0,
        finished: false,
        activePowerups: [],
      };

      const localRoom: MultiplayerRoom = {
        code: 'RACE' + Math.floor(10 + Math.random() * 89),
        hostId: myId,
        stage: 1,
        status: 'countdown',
        players: [
          {
            id: myId,
            name: stats.username,
            character: CHARACTERS.find((c) => c.id === stats.selectedCharacter)?.name || 'Neon Ninja',
            ready: true,
            x: 50,
            y: 0,
            vx: 0,
            vy: 0,
            progress: 0,
            spriteState: 'idle',
            facing: 'right',
            health: 100,
            score: 0,
            finished: false,
            activePowerups: [],
          },
          botPlayer,
        ],
      };

      setRoom(localRoom);
      setYourId(myId);
      setMatchCountdown(3);

      let count = 3;
      const cd = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(cd);
          setMatchCountdown(null);
          setShowMultiplayerModal(false);
          setIsMultiplayerMatch(true);
          startRace(1, true);
          if (engineRef.current) {
            engineRef.current.remotePlayers.set(botId, botPlayer);
          }
        } else {
          setMatchCountdown(count);
        }
      }, 1000);
    }
  };

  const handleSetReady = (ready: boolean) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'SET_READY',
        payload: { ready },
      }));
    } else if (room && yourId) {
      const updated = {
        ...room,
        players: room.players.map((p) => (p.id === yourId ? { ...p, ready } : p)),
      };
      setRoom(updated);
    }
  };

  const handleStartMatch = (stage: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'START_MATCH',
        payload: { stage },
      }));
    } else {
      // Local start match with rival
      const botId = 'bot_rival';
      const botPlayer: RemotePlayer = {
        id: botId,
        name: 'Valkyrie99',
        character: 'Valkyrie Mecha',
        ready: true,
        x: 50,
        y: 380,
        vx: 380,
        vy: 0,
        progress: 0,
        spriteState: 'run',
        facing: 'right',
        health: 100,
        score: 0,
        finished: false,
        activePowerups: [],
      };

      setMatchCountdown(3);
      let count = 3;
      const cd = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(cd);
          setMatchCountdown(null);
          setShowMultiplayerModal(false);
          setIsMultiplayerMatch(true);
          startRace(stage, true);
          if (engineRef.current) {
            engineRef.current.remotePlayers.set(botId, botPlayer);
          }
        } else {
          setMatchCountdown(count);
        }
      }, 1000);
    }
  };

  const handleLeaveRoom = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    }
    setRoom(null);
    setYourId(null);
    setIsMultiplayerMatch(false);
  };

  const handleSendEmote = (emote: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'SEND_EMOTE',
        payload: { emote },
      }));
    }
  };

  const activeStageConfig = STAGES[currentStage - 1] || STAGES[0];
  const activeHero = CHARACTERS.find((c) => c.id === stats.selectedCharacter) || CHARACTERS[0];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans text-white select-none">
      {/* 1. Loading Screen */}
      {isLoading && <LoadingScreen onStart={() => setIsLoading(false)} />}

      {/* 2. Main Game Canvas */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* 3. Floating Emotes */}
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        {floatingEmotes.map((e) => (
          <div
            key={e.id}
            className="text-6xl animate-bounce drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
          >
            {e.text}
          </div>
        ))}
      </div>

      {/* 0. Dedicated Pilot Login / Identification Page */}
      {!stats.isLoggedIn && (
        <LoginPage
          onLoginSuccess={(newStats) => {
            saveStats(newStats);
          }}
          initialStats={INITIAL_STATS}
          guestStats={stats}
        />
      )}

      {/* 4. Active In-Game Heads-Up Display & Touch Controls */}
      {isPlaying ? (
        <>
          <GameHUD
            score={score}
            coins={coins}
            health={health}
            progress={progress}
            stageName={activeStageConfig.name}
            stageNumber={currentStage}
            waveNumber={waveNumber}
            enemiesRemaining={enemiesRemaining}
            activePowerUps={activePowerUps}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={handleTogglePause}
            isMultiplayer={isMultiplayerMatch}
            onSendEmote={handleSendEmote}
            equippedGadget={stats.equippedGadget}
          />
          <TouchControls onInput={touchInputHandlers} />
        </>
      ) : (
        /* 5. Main Menu / Cyber Command Hub */
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm pointer-events-auto">
          {/* Top Bar: Profile & Currency */}
          <div className="flex justify-between items-center">
            {/* Player Profile Quick Card */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-2 sm:px-3 rounded-2xl cursor-pointer transition-all shadow-md group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner"
                  style={{
                    backgroundColor: `${activeHero.primaryColor}25`,
                    border: `1.5px solid ${activeHero.primaryColor}`,
                    color: activeHero.primaryColor,
                  }}
                >
                  {activeHero.name[0]}
                </div>
                <div className="text-left pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                      {stats.username}
                    </span>
                    <span className="text-[9px] font-mono bg-fuchsia-950 text-fuchsia-400 px-1.5 py-0.5 rounded border border-fuchsia-800 font-bold">
                      LVL {stats.playerLevel || 1}
                    </span>
                    <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1 py-0.2 rounded border border-cyan-800 font-bold">
                      STAGE {stats.maxStageUnlocked}/10
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {stats.multiplayerWins} W • High: {stats.highScore.toLocaleString()}
                  </p>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                aria-label="Log out"
                title="Log out and return to pilot sign-in"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LOG OUT</span>
              </button>
            </div>

            {/* Currency & Audio */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-md">
                <span className="text-amber-400 font-black text-sm">⚡</span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {stats.coins.toLocaleString()} COINS
                </span>
              </div>

              <button
                onClick={handleToggleMute}
                className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer shadow-md transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Central Hero Branding & Quick Launch */}
          <div className="my-auto max-w-lg mx-auto text-center py-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 text-xs tracking-wider uppercase font-mono mb-3">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              FIVE-WAVE COMBAT CAMPAIGN • MANUAL CONTROLS
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(0,245,212,0.3)]">
              NEON DASH
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-mono mt-2 max-w-md mx-auto">
              Clear five escalating enemy waves in every sector. Stage 5 ends with a separate mini-boss duel; Stage 10 closes on the 5× Colossus. Move and fire manually—there is no finish line.
            </p>

            {/* Launch Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              {/* Solo Campaign Play */}
              <button
                onClick={() => startRace(currentStage, false)}
                className={`w-full sm:w-auto py-4 px-8 rounded-2xl font-black text-sm tracking-wider uppercase text-slate-950 shadow-[0_0_30px_rgba(0,245,212,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer ${
                  currentStage === 10
                    ? 'bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 shadow-[0_0_35px_rgba(251,191,36,0.6)]'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-400'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                {currentStage === 10
                  ? 'CLEAR 5 WAVES • FACE 5X BOSS'
                  : currentStage === 5
                    ? 'CLEAR 5 WAVES • MINI-BOSS NEXT'
                    : `CLEAR STAGE ${currentStage} • 5 WAVES`}
              </button>

              {/* Competitive Multiplayer Versus */}
              <button
                onClick={() => setShowMultiplayerModal(true)}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl font-black text-sm tracking-wider uppercase text-white bg-slate-900 hover:bg-slate-800 border-2 border-fuchsia-500/50 shadow-[0_0_25px_rgba(247,37,133,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Swords className="w-5 h-5 text-fuchsia-400" />
                VERSUS MULTIPLAYER
              </button>
            </div>
          </div>

          {/* Bottom Navigation & Stage Carousel */}
          <div className="space-y-4">
            {/* Stage Selector Grid - All 10 Stages */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl backdrop-blur-md max-w-2xl mx-auto">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                  SELECT SECTOR (1 - 10)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {stats.maxStageUnlocked}/10 Unlocked
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {STAGES.map((s) => {
                  const isUnlocked = s.stage <= stats.maxStageUnlocked;
                  const isSelected = s.stage === currentStage;
                  return (
                    <button
                      key={s.stage}
                      disabled={!isUnlocked}
                      onClick={() => {
                        soundManager.playJump();
                        setCurrentStage(s.stage);
                      }}
                      className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                        isSelected
                          ? s.isExtremeBoss
                            ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                            : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                          : isUnlocked
                          ? s.isExtremeBoss
                            ? 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/50'
                            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border-slate-800'
                          : 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="text-xs font-black font-mono">
                        {s.stage === 10 ? 'S10 ★' : `S0${s.stage}`}
                      </span>
                      <span className="text-[8px] truncate max-w-full px-0.5 uppercase font-mono font-bold">
                        {isUnlocked
                          ? s.isExtremeBoss
                            ? '5X BOSS'
                            : s.bossPresent
                            ? 'MINI BOSS'
                            : '5 WAVES'
                          : 'LOCKED'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Bar: Heroes, Armory (Weapons), Power-Ups, Leaderboard */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
              <button
                onClick={() => setShowCharacterModal(true)}
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                HEROES ({CHARACTERS.length})
              </button>

              <button
                onClick={() => {
                  setUpgradeShopTab('weapons');
                  setShowUpgradeModal(true);
                }}
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Swords className="w-4 h-4 text-fuchsia-400" />
                WEAPONS & ARMORY
              </button>

              <button
                onClick={() => {
                  setUpgradeShopTab('powerups');
                  setShowUpgradeModal(true);
                }}
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                POWER-UPS
              </button>

              <button
                onClick={() => setShowLeaderboardModal(true)}
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                LEADERBOARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 text-white text-center max-w-xs w-full shadow-[0_0_50px_rgba(0,245,212,0.3)]">
            <h2 className="text-xl font-black tracking-wide text-cyan-400 mb-1">
              SYSTEM PAUSED
            </h2>
            <p className="text-xs text-slate-400 font-mono mb-5">
              Sector 0{currentStage}: {activeStageConfig.name}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleTogglePause}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                RESUME RUN
              </button>
              <button
                onClick={() => startRace(currentStage, isMultiplayerMatch)}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                RESTART SECTOR
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setIsPaused(false);
                  if (engineRef.current) engineRef.current.stop();
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white bg-transparent transition-colors cursor-pointer"
              >
                ABORT TO MENU
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                LOG OUT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        stats={stats}
        onUpdateStats={saveStats}
      />

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUsername={stats.username}
      />

      <MultiplayerModal
        isOpen={showMultiplayerModal}
        onClose={() => setShowMultiplayerModal(false)}
        room={room}
        yourId={yourId}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onQuickMatch={handleQuickMatch}
        onSetReady={handleSetReady}
        onStartMatch={handleStartMatch}
        onLeaveRoom={handleLeaveRoom}
        errorMsg={multiplayerError}
        countdown={matchCountdown}
      />

      <CharacterSelectModal
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        selectedId={stats.selectedCharacter}
        unlockedCharacters={stats.unlockedCharacters}
        userCoins={stats.coins}
        onSelectCharacter={(id) => saveStats({ ...stats, selectedCharacter: id })}
        onUnlockCharacter={(id, cost) => {
          saveStats({
            ...stats,
            coins: stats.coins - cost,
            unlockedCharacters: [...stats.unlockedCharacters, id],
            selectedCharacter: id,
          });
        }}
      />

      <UpgradeShopModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        stats={stats}
        initialTab={upgradeShopTab}
        onUpgradePowerUp={(type, cost) => {
          saveStats({
            ...stats,
            coins: stats.coins - cost,
            powerUpLevels: {
              ...stats.powerUpLevels,
              [type]: (stats.powerUpLevels[type] || 1) + 1,
            },
          });
        }}
        onPurchaseWeapon={(id, cost) => {
          saveStats({
            ...stats,
            coins: stats.coins - cost,
            unlockedWeapons: [...(stats.unlockedWeapons || ['katana']), id],
            equippedWeapon: id,
          });
        }}
        onEquipWeapon={(id) => {
          saveStats({
            ...stats,
            equippedWeapon: id,
          });
        }}
        onPurchaseCape={(id, cost) => {
          saveStats({
            ...stats,
            coins: stats.coins - cost,
            unlockedCapes: [...(stats.unlockedCapes || ['starter_scarf']), id],
            equippedCape: id,
          });
        }}
        onEquipCape={(id) => {
          saveStats({
            ...stats,
            equippedCape: id,
          });
        }}

        onPurchaseGadget={(id, cost) => {
          saveStats({
            ...stats,
            coins: stats.coins - cost,
            unlockedGadgets: [...(stats.unlockedGadgets || ['combat_drone']), id],
            equippedGadget: id,
          });
        }}
        onEquipGadget={(id) => {
          saveStats({
            ...stats,
            equippedGadget: id,
          });
        }}
      />

      <GameOverModal
        isOpen={showGameOverModal}
        score={score}
        coins={coins}
        xpEarned={lastXpEarned}
        stageNumber={currentStage}
        onRetry={() => startRace(currentStage, isMultiplayerMatch)}
        onHome={() => {
          setShowGameOverModal(false);
          setIsPlaying(false);
        }}
      />

      <VictoryModal
        isOpen={showVictoryModal}
        score={score}
        coins={coins}
        xpEarned={lastXpEarned}
        stageNumber={currentStage}
        hasNextStage={currentStage < STAGES.length}
        isMultiplayer={isMultiplayerMatch}
        onNextStage={() => startRace(currentStage + 1, false)}
        onReplay={() => startRace(currentStage, isMultiplayerMatch)}
        onHome={() => {
          setShowVictoryModal(false);
          setIsPlaying(false);
        }}
      />

      {/* Level Up Notification Banner */}
      {levelUpAlert && (
        <div className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 border-2 border-cyan-400 p-4 rounded-2xl shadow-[0_0_40px_rgba(0,245,212,0.6)] flex items-center gap-3.5 max-w-md pointer-events-auto backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              LVL {levelUpAlert.level}
            </div>
            <div>
              <h3 className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-400">
                LEVEL UP ACHIEVED!
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {levelUpAlert.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
