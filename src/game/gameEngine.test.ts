import assert from 'node:assert/strict';
import { test } from 'node:test';
import { soundManager } from '../audio/soundManager';
import type { GameEngineCallbacks } from './gameEngine';
import { GameEngine } from './gameEngine';
import { STAGES, WAVES_PER_STAGE } from './levelData';
import type { CombatEnemy, Projectile } from '../types/game';

interface TestEvents {
  health: number[];
  waves: { wave: number; remaining: number; progress: number }[];
  gameOvers: number;
  stageClears: number;
}

interface GameEngineInternals {
  enemies: CombatEnemy[];
  projectiles: Projectile[];
  platforms: unknown[];
  obstacles: unknown[];
  collectibles: unknown[];
  keys: Record<string, boolean>;
  gravity: number;
  waveTransitionActive: boolean;
  waveTransitionTimer: number;
  bossActive: boolean;
  bossHealth: number;
  bossMaxHealth: number;
  bossY: number;
  update: (dt: number) => void;
  advanceWave: (dt: number) => void;
}

const fakeWindow = {
  devicePixelRatio: 1,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  setInterval: globalThis.setInterval.bind(globalThis),
  clearInterval: globalThis.clearInterval.bind(globalThis),
};

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: fakeWindow,
});

soundManager.setMuted(true);

function createEngine(stage = 1) {
  const events: TestEvents = {
    health: [],
    waves: [],
    gameOvers: 0,
    stageClears: 0,
  };
  const callbacks: GameEngineCallbacks = {
    onScoreUpdate: () => undefined,
    onCoinsUpdate: () => undefined,
    onHealthUpdate: (health) => events.health.push(health),
    onProgressUpdate: () => undefined,
    onWaveUpdate: (wave, remaining, progress) => {
      events.waves.push({ wave, remaining, progress });
    },
    onPowerUpActive: () => undefined,
    onGameOver: () => {
      events.gameOvers += 1;
    },
    onStageClear: () => {
      events.stageClears += 1;
    },
  };
  const canvas = {
    getContext: () => ({}) as CanvasRenderingContext2D,
    parentElement: null,
    style: {},
    width: 800,
    height: 450,
  } as unknown as HTMLCanvasElement;
  const engine = new GameEngine(canvas, callbacks);
  engine.initStage(stage);

  return { engine, state: engine as unknown as GameEngineInternals, events };
}

function advanceToWave(
  engine: GameEngine,
  state: GameEngineInternals,
  targetWave: number
) {
  while (engine.currentWave < targetWave) {
    state.enemies = [];
    state.advanceWave(0.01);
    state.advanceWave(1);
  }
}

test('every stage has five increasingly populated waves, with bosses only in sectors 5 and 10', () => {
  assert.equal(WAVES_PER_STAGE, 5);

  for (let stage = 1; stage <= STAGES.length; stage += 1) {
    const { engine, state } = createEngine(stage);
    try {
      const enemyCounts = [state.enemies.length];
      for (let wave = 2; wave <= WAVES_PER_STAGE; wave += 1) {
        state.enemies = [];
        state.advanceWave(0.01);
        state.advanceWave(1);
        enemyCounts.push(state.enemies.length);
      }

      for (let i = 1; i < enemyCounts.length; i += 1) {
        assert.ok(enemyCounts[i] > enemyCounts[i - 1], `wave ${i + 1} should add hostiles`);
      }
      assert.equal(
        engine.currentWave,
        WAVES_PER_STAGE,
        `stage ${stage} should reach the final wave`
      );
      assert.equal(state.bossActive, false, 'bosses should not overlap the fifth NPC wave');
      assert.equal(state.bossMaxHealth, stage === 10 ? 7500 : stage === 5 ? 1500 : 1000);

      if (stage === 5 || stage === 10) {
        state.enemies = [];
        state.advanceWave(1 / 60);
        state.advanceWave(1);
        assert.equal(state.bossActive, true, 'the boss should enter after wave five is cleared');
      }
    } finally {
      engine.destroy();
    }
  }

  assert.equal(STAGES[4].bossPresent, true);
  assert.equal(STAGES[9].bossPresent, true);
  assert.equal(STAGES[9].bossHealth, (STAGES[4].bossHealth || 0) * 5);
  assert.equal(STAGES.filter((stage) => stage.bossPresent).length, 2);
});

test('movement and firing require deliberate player input', () => {
  const { engine, state } = createEngine();
  try {
    state.platforms = [];
    state.obstacles = [];
    state.collectibles = [];
    state.keys = {};

    const startX = engine.x;
    state.update(1 / 60);
    assert.equal(engine.x, startX, 'the player should not run automatically');
    assert.equal(state.projectiles.filter((projectile) => projectile.fromPlayer).length, 0);

    state.keys.KeyD = true;
    state.update(1 / 60);
    assert.ok(engine.x > startX, 'holding right should move the player');
    assert.equal(state.projectiles.filter((projectile) => projectile.fromPlayer).length, 0);

    state.keys.KeyK = true;
    state.update(1 / 60);
    assert.ok(
      state.projectiles.some((projectile) => projectile.fromPlayer),
      'holding the fire key should create a player projectile'
    );
  } finally {
    engine.destroy();
  }
});

test('the inter-wave pause clears old shots and blocks firing until the next wave begins', () => {
  const { engine, state } = createEngine();
  try {
    state.enemies = [];
    state.projectiles = [
      {
        id: 'old-player-shot',
        x: engine.x,
        y: engine.y,
        vx: 700,
        vy: 0,
        radius: 6,
        color: '#00f5d4',
        fromPlayer: true,
        lifetime: 4,
      },
      {
        id: 'old-hostile-shot',
        x: engine.x,
        y: engine.y,
        vx: -300,
        vy: 0,
        radius: 6,
        color: '#ff0054',
        fromPlayer: false,
        lifetime: 3,
      },
    ];

    state.advanceWave(1 / 60);
    assert.equal(state.waveTransitionActive, true);
    assert.equal(state.projectiles.length, 0);

    engine.touchInput.attack = true;
    engine.shootCooldown = 0;
    engine.triggerShoot();
    state.update(1 / 60);
    assert.equal(state.projectiles.length, 0, 'shots should not start during the breather');

    state.advanceWave(1);
    assert.equal(engine.currentWave, 2);
    assert.equal(state.waveTransitionActive, false);
  } finally {
    engine.destroy();
  }
});

test('manual shots can reach and damage the Stage 5 boss', () => {
  const { engine, state } = createEngine(5);
  try {
    advanceToWave(engine, state, WAVES_PER_STAGE);
    state.enemies = [];
    state.advanceWave(1 / 60);
    state.advanceWave(1);
    state.projectiles = [];
    state.platforms = [];
    state.obstacles = [];
    state.collectibles = [];
    state.gravity = 0;
    assert.equal(state.bossActive, true);
    state.bossHealth = 1500;
    state.bossY = 190;
    engine.x = 180;
    engine.y = 225;
    engine.vx = 0;
    engine.vy = 0;
    engine.cameraX = 0;

    engine.triggerShoot();
    const shot = state.projectiles.find((projectile) => projectile.fromPlayer);
    assert.ok(shot);
    assert.ok(shot.lifetime * Math.abs(shot.vx) >= 445, 'shot lifetime covers boss distance');

    for (let frame = 0; frame < 40 && state.bossHealth === 1500; frame += 1) {
      state.update(0.025);
    }
    assert.ok(state.bossHealth < 1500, 'a manual shot should hit the distant boss');
  } finally {
    engine.destroy();
  }
});

test('living NPCs aim hostile shots at the player and deal damage on a hit', () => {
  const { engine, state } = createEngine();
  try {
    state.platforms = [];
    state.obstacles = [];
    state.collectibles = [];
    state.gravity = 0;
    engine.y = 300;
    const enemy = state.enemies[0];
    enemy.x = engine.x + 245;
    enemy.baseY = engine.y - 28;
    enemy.y = enemy.baseY;
    enemy.phase = 0;
    enemy.attackCooldown = 0;

    state.update(1 / 60);

    const hostileShot = state.projectiles.find((projectile) => !projectile.fromPlayer);
    assert.ok(hostileShot);
    assert.ok(hostileShot.vx < 0, 'an NPC to the right should fire left toward the player');
    assert.ok((hostileShot.damage || 0) > 0);

    for (let frame = 0; frame < 60 && engine.health === 100; frame += 1) {
      state.update(0.02);
    }
    assert.ok(engine.health < 100, 'the aimed hostile projectile should damage the player');
  } finally {
    engine.destroy();
  }
});

test('hostile projectiles can reduce player health to zero and end the run', () => {
  const { engine, state, events } = createEngine();
  try {
    state.platforms = [];
    state.obstacles = [];
    state.collectibles = [];
    state.enemies = [];
    state.gravity = 0;
    engine.health = 10;
    state.projectiles = [
      {
        id: 'lethal-hostile-shot',
        x: engine.x,
        y: engine.y - 28,
        vx: 0,
        vy: 0,
        radius: 6,
        color: '#ff0054',
        fromPlayer: false,
        lifetime: 1,
        damage: 20,
      },
    ];

    state.update(1 / 60);
    assert.equal(engine.health, 0);
    assert.equal(engine.isDead, true);
    assert.equal(events.gameOvers, 1);
    assert.ok(events.health.includes(0));
  } finally {
    engine.destroy();
  }
});

test('a regular sector clears only after the fifth wave is eliminated', () => {
  const { engine, state, events } = createEngine(1);
  try {
    advanceToWave(engine, state, WAVES_PER_STAGE);
    state.enemies = [];

    state.advanceWave(1 / 60);
    assert.equal(state.waveTransitionActive, false);
    assert.equal(engine.isFinished, true);

    const clearX = engine.x;
    const clearScore = engine.score;
    state.keys.KeyD = true;
    state.update(0.1);
    assert.equal(engine.x, clearX, 'the pilot should stop moving during the victory beat');
    assert.equal(engine.score, clearScore, 'score should not keep increasing after clear');

    engine.stop();
    assert.equal(events.stageClears, 1, 'aborting during the victory beat should still save the clear');
  } finally {
    engine.destroy();
  }
});

test('a boss stage cannot clear before its boss is defeated', () => {
  const { engine, state } = createEngine(5);
  try {
    advanceToWave(engine, state, WAVES_PER_STAGE);
    state.enemies = [];

    state.advanceWave(1 / 60);
    assert.equal(state.waveTransitionActive, true);
    assert.equal(state.bossActive, false);
    assert.equal(engine.isFinished, false);

    state.advanceWave(1);
    assert.equal(state.bossActive, true, 'the separate boss encounter should begin after wave five');
    assert.equal(engine.isFinished, false);

    state.bossHealth = 0;
    state.advanceWave(1 / 60);
    assert.equal(state.waveTransitionActive, false);
    assert.equal(engine.isFinished, true, 'the stage should finish immediately when the boss falls');
  } finally {
    engine.destroy();
  }
});
