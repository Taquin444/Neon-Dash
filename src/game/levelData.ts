import {
  CharacterDef,
  PowerUpDef,
  LevelConfig,
  Platform,
  Obstacle,
  Collectible,
  PowerUpType,
  WeaponDef,
  CapeDef,
  VehicleDef,
  VehicleId,
  GadgetDef,
  GadgetId,
} from '../types/game';

export const WEAPONS: WeaponDef[] = [
  {
    id: 'katana',
    name: 'Cyber Katana',
    type: 'melee',
    requiredLevel: 1,
    cost: 0,
    damage: 30,
    fireRate: 0.35,
    description: 'High-frequency photon blade. Slices nearby drones with sweeping arcs.',
    color: '#00f5d4',
    icon: '🗡️',
  },
  {
    id: 'plasma_blaster',
    name: 'Plasma Blaster',
    type: 'ranged',
    requiredLevel: 3,
    cost: 400,
    damage: 45,
    fireRate: 0.25,
    description: 'Rapid-fire cyber pistol discharging concentrated cyan plasma bolts.',
    color: '#38bdf8',
    icon: '🔫',
  },
  {
    id: 'dual_blasters',
    name: 'Dual Photon Pistols',
    type: 'ranged',
    requiredLevel: 5,
    cost: 950,
    damage: 65,
    fireRate: 0.18,
    description: 'Akimbo overclocked energy pistols that fire dual laser bursts.',
    color: '#fee440',
    icon: '⚡',
  },
  {
    id: 'railgun',
    name: 'Hyper Railgun',
    type: 'energy',
    requiredLevel: 7,
    cost: 1600,
    damage: 120,
    fireRate: 0.45,
    description: 'Heavy electromagnetic beam cannon that pierces through multiple obstacles.',
    color: '#f72585',
    icon: '💥',
  },
  {
    id: 'void_scythe',
    name: 'Quantum Void Scythe',
    type: 'energy',
    requiredLevel: 10,
    cost: 2800,
    damage: 180,
    fireRate: 0.28,
    description: 'Legendary void relic that tears through space-time with lethal crescents.',
    color: '#a855f7',
    icon: '✨',
  },
];

export const CAPES: CapeDef[] = [
  {
    id: 'starter_scarf',
    name: 'Holo-Runner Scarf',
    requiredLevel: 1,
    cost: 0,
    description: 'Standard cybernetic wind ribbon for novice neon runners.',
    perk: 'Standard Aerodynamics',
    color: '#f72585',
    trailColor: 'rgba(247, 37, 133, 0.4)',
    icon: '🧣',
  },
  {
    id: 'flux_cape',
    name: 'Neon Flux Cape',
    requiredLevel: 4,
    cost: 600,
    description: 'Charged kinetic fabric. Grants +10% dash duration and speed.',
    perk: '+10% Dash Duration',
    color: '#00f5d4',
    trailColor: 'rgba(0, 245, 212, 0.5)',
    icon: '⚡',
  },
  {
    id: 'shadow_cloak',
    name: 'Shadow Void Cloak',
    requiredLevel: 7,
    cost: 1300,
    description: 'Obsidian phase cloak emitting stealth void particles.',
    perk: '+15% Invulnerability Time',
    color: '#ff0054',
    trailColor: 'rgba(255, 0, 84, 0.6)',
    icon: '🦇',
  },
  {
    id: 'quantum_wings',
    name: 'Celestial Quantum Wings',
    requiredLevel: 10,
    cost: 2500,
    description: 'Unlocks at Level 10! Legendary cosmic light wings with zero-G glider trails.',
    perk: '+20% Glide & Double Jump Float',
    color: '#fbbf24',
    trailColor: 'rgba(251, 191, 36, 0.7)',
    icon: '🪽',
  },
];

export const VEHICLES: VehicleDef[] = [
  {
    id: 'hoverbike',
    name: 'Neon Pulse Hoverbike',
    tagline: 'High-Tech Anti-Grav Cruiser',
    requiredLevel: 2,
    cost: 500,
    speedMultiplier: 1.25,
    jumpBoost: 1.35,
    ramPower: false,
    vtolFlight: false,
    description: 'Aerodynamic hover-cycle with hubless cyan energy wheels, dynamic jet thruster, and smooth levitation gliding.',
    perk: '+25% Cruise Speed & Low Gravity Float',
    primaryColor: '#00f5d4',
    glowColor: '#00bbf9',
    icon: '🏍️',
  },
  {
    id: 'cyber_car',
    name: 'Apex Neon Interceptor',
    tagline: 'Twin-Turbo Kinetic Ram-Racer',
    requiredLevel: 5,
    cost: 1400,
    speedMultiplier: 1.35,
    jumpBoost: 1.0,
    ramPower: true,
    vtolFlight: false,
    description: 'Low-slung cyberpunk supercar with vibrant neon underglow, dual exhaust flames, and kinetic ram-barrier that shatters obstacles.',
    perk: 'Obstacle Ramming & Ground Turbo (+35% Speed)',
    primaryColor: '#f72585',
    glowColor: '#7209b7',
    icon: '🏎️',
  },
  {
    id: 'spaceship',
    name: 'Quantum Sky-Striker',
    tagline: 'Aerodyne VTOL Star-Fighter',
    requiredLevel: 8,
    cost: 2600,
    speedMultiplier: 1.28,
    jumpBoost: 1.5,
    ramPower: false,
    vtolFlight: true,
    description: 'Futuristic VTOL hover starship with glowing plasma delta wings. Hold Jump to engage vertical thrusters and fly freely over all hazards!',
    perk: 'Infinite VTOL Flight & Twin Plasma Blasters',
    primaryColor: '#38bdf8',
    glowColor: '#a855f7',
    icon: '🚀',
  },
  {
    id: 'cyber_truck',
    name: 'Titan Heavy War-Rig',
    tagline: 'Fortified Multi-Tread Juggernaut',
    requiredLevel: 11,
    cost: 4200,
    speedMultiplier: 1.15,
    jumpBoost: 0.95,
    ramPower: true,
    vtolFlight: false,
    description: 'Armored multi-wheel cyber assault truck with heavy ram plow and roof-mounted sensor beacon. Completely pulverizes light hazards and spikes!',
    perk: 'Heavy Armor Plating & Ground Smash Barrier',
    primaryColor: '#fee440',
    glowColor: '#f59e0b',
    icon: '🚛',
  },
];

export const GADGETS: GadgetDef[] = [
  {
    id: 'combat_drone',
    name: 'Tactical Combat Drone',
    requiredLevel: 2,
    cost: 450,
    category: 'offensive',
    description: 'Companion drone flying beside you. Automatically locks onto upcoming obstacles, drones, and boss orbs, firing cyan laser bursts!',
    perk: 'Auto-Targeting Laser Sentry (1.4s fire rate)',
    color: '#00f5d4',
    icon: '🛸',
  },
  {
    id: 'quantum_jetpack',
    name: 'Quantum Jetpack',
    requiredLevel: 4,
    cost: 900,
    category: 'mobility',
    description: 'Twin-cylinder back thruster with animated plasma plumes. Holding Jump in mid-air activates rocket flight to soar above all obstacles!',
    perk: 'Mid-Air Rocket Flight & Double Jump Thruster',
    color: '#ff5400',
    icon: '🎒',
  },
  {
    id: 'med_cross',
    name: 'Nano-Med Revive Core',
    requiredLevel: 6,
    cost: 1500,
    category: 'survival',
    description: 'Holographic medical drone emitting nano-repair auras. Automatically triggers an emergency defibrillator pulse upon fatal hit, restoring 50 HP + 3s shield!',
    perk: 'Emergency Revive Wave (+50 HP once per run)',
    color: '#22c55e',
    icon: '➕',
  },
  {
    id: 'sprint_boots',
    name: 'Hyper Sprint Boots',
    requiredLevel: 8,
    cost: 2100,
    category: 'mobility',
    description: 'High-frequency cybernetic greaves with cyan circuits. Accelerates base movement, reduces dash cooldown, and leaves glowing sonic afterimages!',
    perk: '+22% Base Speed, Fast Dash & Ghosting Trails',
    color: '#38bdf8',
    icon: '🥾',
  },
  {
    id: 'graviton_magnet',
    name: 'Graviton Attractor Core',
    requiredLevel: 3,
    cost: 750,
    category: 'utility',
    description: 'Floating magnetic flux orb that draws in all coins, power-up capsules, and gems from a 400px radius with electric arc pulses!',
    perk: 'Massive 400px Coin & Capsule Vacuum',
    color: '#fee440',
    icon: '🧲',
  },
];

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  500,    // Level 2
  1200,   // Level 3
  2200,   // Level 4
  3500,   // Level 5
  5100,   // Level 6
  7000,   // Level 7
  9200,   // Level 8
  11800,  // Level 9
  15000,  // Level 10
  19000,  // Level 11
  24000,  // Level 12
  30000,  // Level 13
  37000,  // Level 14
  45000,  // Level 15
];

export function calculatePlayerLevel(totalXp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || (currentThreshold + 6000);
  const currentXp = Math.max(0, totalXp - currentThreshold);
  const neededXp = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, Math.floor((currentXp / neededXp) * 100));

  return {
    level,
    currentXp,
    nextLevelXp: neededXp,
    progressPercent,
  };
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'ninja',
    name: 'Cyber Ninja',
    title: 'Default Hero • Cyber Shinobi',
    primaryColor: '#00f5d4',
    secondaryColor: '#0f172a',
    accentColor: '#f72585',
    description: 'High-agility cybernetic assassin with spiky cyber hair, glowing visor, and scarf.',
    perk: 'Double Jump + 15% Air Agility',
    speedMultiplier: 1.05,
    jumpMultiplier: 1.15,
    specialAbility: 'Shadow Step',
    unlocked: true,
    cost: 0,
    colorVariants: [
      { name: 'Cyan Neon', primary: '#00f5d4', accent: '#f72585', glow: '#00f5d4' },
      { name: 'Crimson Red', primary: '#ef4444', accent: '#fee440', glow: '#ef4444' },
      { name: 'Void Violet', primary: '#a855f7', accent: '#ec4899', glow: '#c084fc' },
      { name: 'Matrix Green', primary: '#22c55e', accent: '#06b6d4', glow: '#22c55e' },
      { name: 'Cyber Gold', primary: '#eab308', accent: '#f97316', glow: '#eab308' },
    ],
  },
  {
    id: 'cat',
    name: 'Cat Runner',
    title: 'Feline Parkour Prodigy',
    primaryColor: '#f472b6',
    secondaryColor: '#ffffff',
    accentColor: '#ec4899',
    description: 'Adorable cat hoodie runner with pointed feline ears, cute screen visor, and animated tail.',
    perk: 'Low Friction Pounce Slide (+20% Slide Speed)',
    speedMultiplier: 1.08,
    jumpMultiplier: 1.12,
    specialAbility: 'Feline Reflexes',
    unlocked: false,
    cost: 350,
    colorVariants: [
      { name: 'Sakura Pink', primary: '#f472b6', accent: '#ec4899', glow: '#f472b6' },
      { name: 'Ocean Cyan', primary: '#38bdf8', accent: '#0284c7', glow: '#38bdf8' },
      { name: 'Amethyst Violet', primary: '#c084fc', accent: '#7e22ce', glow: '#c084fc' },
      { name: 'Sunset Peach', primary: '#fb923c', accent: '#ea580c', glow: '#fb923c' },
      { name: 'Neon Lime', primary: '#4ade80', accent: '#16a34a', glow: '#4ade80' },
    ],
  },
  {
    id: 'firefox',
    name: 'Fire Fox',
    title: 'Blazing Kitsune Striker',
    primaryColor: '#f97316',
    secondaryColor: '#18181b',
    accentColor: '#fee440',
    description: 'Fierce Kitsune fox with blazing flame ears, fiery hair, and a burning bushy tail.',
    perk: 'Blazing Dash Burn (Destroys Ground Obstacles)',
    speedMultiplier: 1.12,
    jumpMultiplier: 1.05,
    specialAbility: 'Meteor Rush',
    unlocked: false,
    cost: 750,
    colorVariants: [
      { name: 'Blaze Orange', primary: '#f97316', accent: '#fee440', glow: '#f97316' },
      { name: 'Blue Flame', primary: '#06b6d4', accent: '#38bdf8', glow: '#06b6d4' },
      { name: 'Purple Hellfire', primary: '#a855f7', accent: '#d946ef', glow: '#a855f7' },
      { name: 'Jade Fire', primary: '#22c55e', accent: '#86efac', glow: '#22c55e' },
      { name: 'Solar Gold', primary: '#eab308', accent: '#fef08a', glow: '#eab308' },
    ],
  },
  {
    id: 'robot',
    name: 'Robot',
    title: 'Next-Gen Android Sentry',
    primaryColor: '#22c55e',
    secondaryColor: '#ffffff',
    accentColor: '#10b981',
    description: 'Futuristic android with curved antenna ears, rounded digital display eyes, and kinetic core.',
    perk: 'Passive Kinetic Shield + 25% Coin Magnet Range',
    speedMultiplier: 1.02,
    jumpMultiplier: 1.18,
    specialAbility: 'Aegis Protocol',
    unlocked: false,
    cost: 1200,
    colorVariants: [
      { name: 'Emerald Mech', primary: '#22c55e', accent: '#10b981', glow: '#22c55e' },
      { name: 'Cyber Droid', primary: '#06b6d4', accent: '#3b82f6', glow: '#06b6d4' },
      { name: 'Plasma Unit', primary: '#8b5cf6', accent: '#6366f1', glow: '#8b5cf6' },
      { name: 'Ruby Core', primary: '#ef4444', accent: '#dc2626', glow: '#ef4444' },
      { name: 'Gold Prime', primary: '#f59e0b', accent: '#d97706', glow: '#f59e0b' },
    ],
  },
  {
    id: 'shadow',
    name: 'Shadow Spirit',
    title: 'Spectral Void Phantom',
    primaryColor: '#a855f7',
    secondaryColor: '#09090b',
    accentColor: '#d946ef',
    description: 'Ethereal floating phantom with billowing wavy ghost flame hair and dark void mist.',
    perk: 'Void Phase Dash (+20% Invulnerability Duration)',
    speedMultiplier: 1.15,
    jumpMultiplier: 1.1,
    specialAbility: 'Phase Shift',
    unlocked: false,
    cost: 1800,
    colorVariants: [
      { name: 'Void Violet', primary: '#a855f7', accent: '#d946ef', glow: '#c084fc' },
      { name: 'Abyssal Blue', primary: '#0ea5e9', accent: '#38bdf8', glow: '#0ea5e9' },
      { name: 'Blood Wraith', primary: '#dc2626', accent: '#f87171', glow: '#dc2626' },
      { name: 'Phantom Green', primary: '#16a34a', accent: '#4ade80', glow: '#16a34a' },
      { name: 'Silver Specter', primary: '#94a3b8', accent: '#e2e8f0', glow: '#cbd5e1' },
    ],
  },
  {
    id: 'bunny',
    name: 'Bunny Bolt',
    title: 'Supersonic Lightning Hare',
    primaryColor: '#38bdf8',
    secondaryColor: '#ffffff',
    accentColor: '#0284c7',
    description: 'High-speed cyber rabbit with long aerodynamic ears, lightning tail, and electric speed trails.',
    perk: 'Supersonic Jump Height + Instant Air Recovery',
    speedMultiplier: 1.18,
    jumpMultiplier: 1.25,
    specialAbility: 'Lightning Leap',
    unlocked: false,
    cost: 2400,
    colorVariants: [
      { name: 'Electric Cyan', primary: '#38bdf8', accent: '#0284c7', glow: '#38bdf8' },
      { name: 'Sugar Pink', primary: '#f472b6', accent: '#db2777', glow: '#f472b6' },
      { name: 'Neon Purple', primary: '#a855f7', accent: '#7c3aed', glow: '#a855f7' },
      { name: 'Golden Hare', primary: '#fbbf24', accent: '#d97706', glow: '#fbbf24' },
      { name: 'Midnight Shadow', primary: '#334155', accent: '#0284c7', glow: '#38bdf8' },
    ],
  },
  {
    id: 'punk',
    name: 'Cyber Punk',
    title: 'Neon Rebel Disruptor',
    primaryColor: '#fee440',
    secondaryColor: '#1e1b4b',
    accentColor: '#f72585',
    description: 'Electric rebel rocker with blazing neon mohawk, studded cyber jacket, and sonic blast boost.',
    perk: 'Hyper Burst (+15% Dash Speed & Shorter Cooldown)',
    speedMultiplier: 1.15,
    jumpMultiplier: 1.12,
    specialAbility: 'Overdrive Dash',
    unlocked: false,
    cost: 3000,
    colorVariants: [
      { name: 'Acid Neon', primary: '#fee440', accent: '#f72585', glow: '#fee440' },
      { name: 'Ultra Violet', primary: '#a855f7', accent: '#06b6d4', glow: '#a855f7' },
      { name: 'Hot Magenta', primary: '#ec4899', accent: '#3b82f6', glow: '#ec4899' },
      { name: 'Electric Cyan', primary: '#06b6d4', accent: '#eab308', glow: '#06b6d4' },
      { name: 'Toxic Lime', primary: '#84cc16', accent: '#d946ef', glow: '#84cc16' },
    ],
  },
  {
    id: 'valkyrie',
    name: 'Valkyrie Mech',
    title: 'Celestial Winged Commander',
    primaryColor: '#ffffff',
    secondaryColor: '#18181b',
    accentColor: '#fbbf24',
    description: 'Divine cyber warrior equipped with gilded winged crest, titanium chassis, and solar thrusters.',
    perk: 'Aero Glider (Hold Jump for +25% Air Float)',
    speedMultiplier: 1.10,
    jumpMultiplier: 1.28,
    specialAbility: 'Aegis Wings',
    unlocked: false,
    cost: 3800,
    colorVariants: [
      { name: 'Solar Angel', primary: '#ffffff', accent: '#fbbf24', glow: '#38bdf8' },
      { name: 'Dark Seraph', primary: '#0f172a', accent: '#ef4444', glow: '#dc2626' },
      { name: 'Aether Blue', primary: '#e0f2fe', accent: '#0284c7', glow: '#38bdf8' },
      { name: 'Rose Gold', primary: '#ffe4e6', accent: '#f43f5e', glow: '#fb7185' },
      { name: 'Emerald Sentinel', primary: '#f0fdf4', accent: '#16a34a', glow: '#22c55e' },
    ],
  },
  {
    id: 'ronin',
    name: 'Red Ronin',
    title: 'Crimson Plasma Blade Master',
    primaryColor: '#ff0054',
    secondaryColor: '#09090b',
    accentColor: '#ff5400',
    description: 'Master swordsman crowned with cyber kasa hat, lethal crimson aura, and razor-sharp photon edge.',
    perk: 'Blade Mastery (+25% Slash Damage & Double Coin Chance)',
    speedMultiplier: 1.22,
    jumpMultiplier: 1.18,
    specialAbility: 'Crimson Slash',
    unlocked: false,
    cost: 4500,
    colorVariants: [
      { name: 'Blood Crimson', primary: '#ff0054', accent: '#ff5400', glow: '#ff0054' },
      { name: 'Shadow Obsidian', primary: '#18181b', accent: '#ef4444', glow: '#f97316' },
      { name: 'Phantom Azure', primary: '#0284c7', accent: '#38bdf8', glow: '#06b6d4' },
      { name: 'Imperial Jade', primary: '#059669', accent: '#34d399', glow: '#10b981' },
      { name: 'Golden Sovereign', primary: '#d97706', accent: '#fbbf24', glow: '#f59e0b' },
    ],
  },
];

export const POWER_UPS: PowerUpDef[] = [
  {
    id: 'speed_dash',
    name: 'Sonic Turbo',
    icon: '⚡',
    color: '#00f5d4',
    description: 'Propels you forward at supersonic speeds, shattering light obstacles.',
    duration: 5,
    levelRequired: 1,
    upgradeCost: 200,
  },
  {
    id: 'plasma_shield',
    name: 'Plasma Aegis',
    icon: '🛡️',
    color: '#38bdf8',
    description: 'Generates an energy barrier absorbing 1 hazard collision.',
    duration: 12,
    levelRequired: 1,
    upgradeCost: 250,
  },
  {
    id: 'coin_magnet',
    name: 'Flux Magnet',
    icon: '🧲',
    color: '#fee440',
    description: 'Draws all nearby energy coins and gems directly to your runner.',
    duration: 8,
    levelRequired: 2,
    upgradeCost: 350,
  },
  {
    id: 'triple_blaster',
    name: 'Pulse Cannon',
    icon: '🔫',
    color: '#f72585',
    description: 'Rapidly discharges triple plasma lasers to vaporize enemy drones.',
    duration: 8,
    levelRequired: 2,
    upgradeCost: 450,
  },
  {
    id: 'chrono_warp',
    name: 'Chrono Warp',
    icon: '⏳',
    color: '#a855f7',
    description: 'Slows down time and world hazards by 50% for pinpoint reflex dodging.',
    duration: 6,
    levelRequired: 3,
    upgradeCost: 600,
  },
  {
    id: 'hyper_jetpack',
    name: 'Aero Thruster',
    icon: '🚀',
    color: '#ff5400',
    description: 'Grants continuous vertical flight thrusters to soar over hazards.',
    duration: 6,
    levelRequired: 4,
    upgradeCost: 800,
  },
  {
    id: 'quantum_nova',
    name: 'Quantum Nova',
    icon: '⭐',
    color: '#ec4899',
    description: 'Pure invincibility! Annihilates all obstacles in your path and doubles score.',
    duration: 7,
    levelRequired: 5,
    upgradeCost: 1200,
  },
];

export const STAGES: LevelConfig[] = [
  {
    stage: 1,
    name: 'Neon Metropolis',
    subtitle: 'Sector 01 - The Grid Runway',
    trackLength: 3000,
    bgTheme: 'cyber_metropolis',
    baseSpeed: 380,
    gravity: 1200,
  },
  {
    stage: 2,
    name: 'Data Highway',
    subtitle: 'Sector 02 - Overdrive Expressway',
    trackLength: 3800,
    bgTheme: 'circuit_grid',
    baseSpeed: 430,
    gravity: 1250,
  },
  {
    stage: 3,
    name: 'Magma Reactor',
    subtitle: 'Sector 03 - Thermal Core Outpost',
    trackLength: 4600,
    bgTheme: 'magma_reactor',
    baseSpeed: 480,
    gravity: 1300,
  },
  {
    stage: 4,
    name: 'Orbital Spire',
    subtitle: 'Sector 04 - Zero-G Ascent',
    trackLength: 5400,
    bgTheme: 'orbital_apex',
    baseSpeed: 520,
    gravity: 1050, // Low gravity float!
  },
  {
    stage: 5,
    name: 'Quantum Void',
    subtitle: 'Final Sector - Boss Glitch Overlord',
    trackLength: 6200,
    bgTheme: 'quantum_void',
    baseSpeed: 560,
    gravity: 1350,
    bossPresent: true,
    bossHealth: 1500,
  },
];

/**
 * Procedurally generates track elements (platforms, obstacles, coins, powerups) for a given level.
 */
export function generateLevelElements(stageNum: number): {
  platforms: Platform[];
  obstacles: Obstacle[];
  collectibles: Collectible[];
} {
  const safeStageNum = Number.isFinite(stageNum)
    ? Math.max(1, Math.min(STAGES.length, Math.floor(stageNum)))
    : 1;
  const stage = STAGES[safeStageNum - 1] ?? STAGES[0];
  const length = Math.max(1800, stage.trackLength);
  const groundY = 380;
  const platforms: Platform[] = [];
  const obstacles: Obstacle[] = [];
  const collectibles: Collectible[] = [];

  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  let currentX = 0;
  let segmentIndex = 0;

  // Ground segments intentionally overlap slightly. This guarantees a continuous
  // running surface and prevents random gaps from making a stage impossible.
  while (currentX < length) {
    const segmentWidth = Math.min(Math.floor(rand(420, 601)), length - currentX);
    if (segmentWidth <= 0) break;

    platforms.push({
      x: currentX,
      y: groundY,
      width: segmentWidth + 2,
      height: 70,
      type: 'ground',
    });

    // Floating route / optional coin reward.
    if (segmentWidth >= 300 && Math.random() < 0.48) {
      const floatW = Math.min(Math.floor(rand(120, 191)), segmentWidth - 40);
      const floatX = currentX + rand(20, Math.max(21, segmentWidth - floatW - 20));
      const floatY = groundY - Math.floor(rand(75, 136));
      let type: Platform['type'] = 'floating';
      if (safeStageNum >= 3 && Math.random() < 0.18) type = 'crumbling';
      else if (Math.random() < 0.18) type = 'moving';

      platforms.push({
        x: floatX, y: floatY, width: floatW, height: 18, type,
        crumbleTimer: 0, moveOffset: 0, moveSpeed: 1.5, moveRange: 40,
      });

      for (let i = 0; i < 3; i++) {
        collectibles.push({
          id: `coin_float_${safeStageNum}_${segmentIndex}_${i}`,
          x: floatX + 20 + i * 32,
          y: floatY - 25,
          type: 'coin',
          collected: false,
        });
      }
    }

    // Obstacles only spawn on wide ground sections and away from the start.
    if (currentX > 450 && segmentWidth >= 330 && Math.random() < Math.min(0.28 + safeStageNum * 0.035, 0.46)) {
      const obstacleX = currentX + rand(130, Math.max(131, segmentWidth - 75));
      const roll = Math.random();
      if (safeStageNum >= 2 && roll < 0.30) {
        obstacles.push({
          id: `laser_${safeStageNum}_${segmentIndex}`, x: obstacleX,
          y: groundY - 55, width: 32, height: 35,
          type: 'laser_fence', active: true,
        });
      } else if (safeStageNum >= 3 && roll < 0.50) {
        obstacles.push({
          id: `fire_${safeStageNum}_${segmentIndex}`, x: obstacleX,
          y: groundY - 40, width: 36, height: 40,
          type: 'fire_jet', active: true,
        });
      } else {
        obstacles.push({
          id: `spike_${safeStageNum}_${segmentIndex}`, x: obstacleX,
          y: groundY - 26, width: 38, height: 26,
          type: 'spike', active: true,
        });
      }
    }

    // Flying drones start in Stage 2.
    if (safeStageNum >= 2 && currentX > 650 && segmentWidth >= 340 && Math.random() < 0.28) {
      const minY = groundY - 140;
      const maxY = groundY - 75;
      obstacles.push({
        id: `drone_${safeStageNum}_${segmentIndex}`,
        x: currentX + rand(170, Math.max(171, segmentWidth - 60)),
        y: rand(minY, maxY), width: 34, height: 28,
        type: 'drone', active: true, health: 2,
        patrolY: { min: minY, max: maxY, speed: 1.2 + safeStageNum * 0.2, dir: 1 },
      });
    }

    // Coins stay within their ground segment.
    if (segmentWidth >= 220 && Math.random() < 0.52) {
      for (let i = 0; i < 4; i++) {
        const coinX = currentX + 50 + i * 32;
        if (coinX < currentX + segmentWidth - 10) {
          collectibles.push({
            id: `coin_ground_${safeStageNum}_${segmentIndex}_${i}`,
            x: coinX, y: groundY - 24, type: 'coin', collected: false,
          });
        }
      }
    }

    if (segmentWidth >= 250 && Math.random() < 0.2) {
      collectibles.push({
        id: `gem_${safeStageNum}_${segmentIndex}`,
        x: currentX + segmentWidth / 2,
        y: groundY - 65,
        type: 'gem', collected: false,
      });
    }

    if (safeStageNum >= 2 && currentX > 400 && currentX < length - 400 && Math.random() < 0.2) {
      const powerUps: PowerUpType[] = ['speed_dash', 'plasma_shield', 'coin_magnet', 'triple_blaster'];
      if (safeStageNum >= 3) powerUps.push('chrono_warp');
      if (safeStageNum >= 4) powerUps.push('hyper_jetpack');
      if (safeStageNum >= 5) powerUps.push('quantum_nova');
      collectibles.push({
        id: `powerup_${safeStageNum}_${segmentIndex}`,
        x: currentX + segmentWidth * 0.65,
        y: groundY - 55,
        type: 'powerup',
        powerUpType: powerUps[Math.floor(Math.random() * powerUps.length)],
        collected: false,
      });
    }

    currentX += segmentWidth;
    segmentIndex++;
  }

  // Ensure a safe start and a solid finish runway, even if generation changes later.
  platforms.push({ x: 0, y: groundY, width: 720, height: 70, type: 'ground' });
  platforms.push({ x: Math.max(0, length - 500), y: groundY, width: 650, height: 70, type: 'ground' });

  return { platforms, obstacles, collectibles };
}
