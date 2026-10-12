export type SpriteAction = 
  | 'idle' 
  | 'run' 
  | 'jump' 
  | 'fall' 
  | 'dash' 
  | 'slide' 
  | 'shoot' 
  | 'hurt' 
  | 'victory';

export type CharacterId = 
  | 'ninja' 
  | 'cat' 
  | 'firefox' 
  | 'robot' 
  | 'shadow' 
  | 'bunny' 
  | 'punk' 
  | 'valkyrie' 
  | 'ronin';

export interface ColorVariantDef {
  name: string;
  primary: string;
  accent: string;
  glow: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
  perk: string;
  speedMultiplier: number;
  jumpMultiplier: number;
  specialAbility: string;
  unlocked: boolean;
  cost: number;
  colorVariants?: ColorVariantDef[];
}

export type PowerUpType = 
  | 'speed_dash'
  | 'plasma_shield'
  | 'coin_magnet'
  | 'triple_blaster'
  | 'chrono_warp'
  | 'hyper_jetpack'
  | 'quantum_nova';

export interface PowerUpDef {
  id: PowerUpType;
  name: string;
  icon: string;
  color: string;
  description: string;
  duration: number; // in seconds
  levelRequired: number;
  upgradeCost: number;
}

export type WeaponId = 'katana' | 'plasma_blaster' | 'dual_blasters' | 'railgun' | 'void_scythe';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  type: 'melee' | 'ranged' | 'energy';
  requiredLevel: number;
  cost: number;
  damage: number;
  fireRate: number;
  description: string;
  color: string;
  icon: string;
}

export type CapeId = 'starter_scarf' | 'flux_cape' | 'shadow_cloak' | 'quantum_wings';

export interface CapeDef {
  id: CapeId;
  name: string;
  requiredLevel: number;
  cost: number;
  description: string;
  perk: string;
  color: string;
  trailColor: string;
  icon: string;
}

export type GadgetId = 'combat_drone' | 'quantum_jetpack' | 'med_cross' | 'sprint_boots' | 'graviton_magnet';

export interface GadgetDef {
  id: GadgetId;
  name: string;
  requiredLevel: number;
  cost: number;
  description: string;
  perk: string;
  color: string;
  icon: string;
  category: 'offensive' | 'mobility' | 'survival' | 'utility';
}

export interface PlayerStats {
  username: string;
  isLoggedIn?: boolean;
  playerLevel: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  highScore: number;
  maxStageUnlocked: number;
  multiplayerWins: number;
  multiplayerRaces: number;
  selectedCharacter: CharacterId;
  colorVariantIndex?: number;
  unlockedCharacters: CharacterId[];
  equippedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  equippedCape: CapeId;
  unlockedCapes: CapeId[];
  equippedGadget?: GadgetId;
  unlockedGadgets?: GadgetId[];
  powerUpLevels: Record<PowerUpType, number>;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'laser_fence' | 'drone' | 'falling_block' | 'fire_jet' | 'boss_orb';
  active: boolean;
  health?: number;
  patrolY?: { min: number; max: number; speed: number; dir: number };
  laserState?: { timer: number; interval: number; active: boolean };
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'floating' | 'crumbling' | 'spring' | 'moving';
  crumbleTimer?: number;
  crumbled?: boolean;
  moveOffset?: number;
  moveSpeed?: number;
  moveRange?: number;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'coin' | 'gem' | 'powerup';
  powerUpType?: PowerUpType;
  collected: boolean;
  animOffset?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  fromPlayer: boolean;
  lifetime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'line' | 'ring' | 'shard';
  rotation?: number;
  vRotation?: number;
  gravity?: number;
  growth?: number;
  lineWidth?: number;
  text?: string;
}

export interface LevelConfig {
  stage: number;
  name: string;
  subtitle: string;
  trackLength: number; // in game world units
  bgTheme: 'cyber_metropolis' | 'circuit_grid' | 'magma_reactor' | 'orbital_apex' | 'quantum_void';
  baseSpeed: number;
  gravity: number;
  bossPresent?: boolean;
  bossHealth?: number;
  bossName?: string;
  isExtremeBoss?: boolean;
}

export interface RemotePlayer {
  id: string;
  name: string;
  character: string;
  ready?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  progress: number;
  spriteState: SpriteAction;
  facing: 'left' | 'right';
  health: number;
  score: number;
  finished: boolean;
  finishTime?: number;
  activePowerups: string[];
}

export interface MultiplayerRoom {
  code: string;
  hostId: string;
  stage: number;
  status: 'waiting' | 'countdown' | 'racing' | 'ended';
  players: RemotePlayer[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  character: string;
  score: number;
  stage: number;
  wins: number;
  date: string;
}
