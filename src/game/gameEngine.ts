import {
  SpriteAction,
  CharacterId,
  PowerUpType,
  Platform,
  Obstacle,
  Collectible,
  Projectile,
  Particle,
  RemotePlayer,
  WeaponId,
  CapeId,
  GadgetId,
  CombatEnemy,
} from '../types/game';
import { SpriteRenderer } from './spriteRenderer';
import { CHARACTERS, STAGES, POWER_UPS, WAVES_PER_STAGE, generateLevelElements, WEAPONS, GADGETS } from './levelData';
import { soundManager } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number) => void;
  onCoinsUpdate: (coins: number) => void;
  onHealthUpdate: (health: number) => void;
  onProgressUpdate: (progress: number) => void;
  onWaveUpdate: (wave: number, enemiesRemaining: number, progress: number) => void;
  onPowerUpActive: (powerUps: { type: PowerUpType; timeLeft: number }[]) => void;
  onGameOver: (finalScore: number, coinsEarned: number, xpEarned: number) => void;
  onStageClear: (finalScore: number, coinsEarned: number, xpEarned: number) => void;
  onSendState?: (state: any) => void;
  onUsePowerup?: (powerup: PowerUpType) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Viewport & Scale
  public readonly virtualWidth = 800;
  public readonly virtualHeight = 450;
  private scale: number = 1;

  // Game Loop
  private animationFrameId: number | null = null;
  private stageClearTimeout: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Stage Config
  public currentStage: number = 1;
  private trackLength: number = 3000;
  private gravity: number = 1200;
  private baseScrollSpeed: number = 380;
  private platforms: Platform[] = [];
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private enemies: CombatEnemy[] = [];

  // Campaign combat: five escalating waves per stage, with bosses only on 5 and 10.
  public currentWave: number = 1;
  private waveTransitionTimer: number = 0;
  private waveTransitionActive: boolean = false;
  private totalStageEnemies: number = 0;
  private defeatedStageEnemies: number = 0;

  // Boss System (Stage 5 mini-boss and Stage 10 extreme boss)
  private hasBoss: boolean = false;
  private bossActive: boolean = false;
  private bossHealth: number = 1500;
  private bossMaxHealth: number = 1500;
  private bossName: string = 'Cyber Sentinel';
  private isExtremeBoss: boolean = false;
  private bossX: number = 650;
  private bossY: number = 200;
  private bossAttackTimer: number = 0;

  // Player State
  public charId: CharacterId = 'ninja';
  public equippedWeapon: WeaponId = 'katana';
  public equippedCape: CapeId = 'starter_scarf';
  public equippedGadget: GadgetId = 'combat_drone';
  public isDead: boolean = false;
  public medCrossUsed: boolean = false;
  public droneIsFiring: boolean = false;
  public jetpackThrusting: boolean = false;
  public x: number = 180;
  public y: number = 380;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 36;
  public height: number = 56;
  public isGrounded: boolean = false;
  public doubleJumpAvailable: boolean = true;
  public isSliding: boolean = false;
  public slideTimer: number = 0;
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashCooldown: number = 0;
  public isShooting: boolean = false;
  public shootTimer: number = 0;
  public shootCooldown: number = 0;
  public isHurt: boolean = false;
  public hurtTimer: number = 0;
  public isInvincible: boolean = false;
  public invincibleTimer: number = 0;
  public health: number = 100;
  public score: number = 0;
  public coinsCollected: number = 0;
  public xpEarned: number = 0;
  public progress: number = 0;
  public facing: 'left' | 'right' = 'right';
  public animTimer: number = 0;
  public isFinished: boolean = false;

  // Power-Ups Active
  private activePowerUps: Map<PowerUpType, number> = new Map(); // Type -> Remaining Time
  private powerUpLevels: Record<PowerUpType, number> = {
    speed_dash: 1,
    plasma_shield: 1,
    coin_magnet: 1,
    triple_blaster: 1,
    chrono_warp: 1,
    hyper_jetpack: 1,
    quantum_nova: 1,
  };

  // Remote Multiplayer Opponents
  public remotePlayers: Map<string, RemotePlayer> = new Map();
  public isMultiplayer: boolean = false;
  private lastNetworkSyncTime: number = 0;

  // Inputs
  private keys: Record<string, boolean> = {};
  public touchInput = {
    left: false,
    right: false,
    jump: false,
    slide: false,
    dash: false,
    attack: false,
    powerup: false,
  };

  // Camera scroll & Impact Screen Shake
  public cameraX: number = 0;
  public screenShakeTimer: number = 0;
  public screenShakeDuration: number = 0;
  public screenShakeIntensity: number = 0;
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;
  public impactFlashAlpha: number = 0;
  public impactFlashColor: string = '#ff0055';

  public triggerScreenShake(intensity: number = 12, duration: number = 0.35, flashColor?: string) {
    this.screenShakeIntensity = Math.max(
      this.screenShakeIntensity * (this.screenShakeTimer / (this.screenShakeDuration || 1)),
      intensity
    );
    this.screenShakeDuration = duration;
    this.screenShakeTimer = duration;
    if (flashColor) {
      this.impactFlashColor = flashColor;
      this.impactFlashAlpha = 1.0;
    }
  }

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
  }

  public handleResize = () => {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    // Scale mapping virtual 800x450 into container
    const scaleX = (rect.width * dpr) / this.virtualWidth;
    const scaleY = (rect.height * dpr) / this.virtualHeight;
    this.scale = Math.min(scaleX, scaleY);
  };

  public initStage(
    stageNum: number,
    character: CharacterId = 'ninja',
    isMultiplayer: boolean = false,
    powerUpLevels?: Record<PowerUpType, number>,
    weapon: WeaponId = 'katana',
    cape: CapeId = 'starter_scarf',
    gadget: GadgetId = 'combat_drone'
  ) {
    const safeStageNum = Number.isFinite(stageNum)
      ? Math.max(1, Math.min(STAGES.length, Math.floor(stageNum)))
      : 1;
    this.currentStage = safeStageNum;
    this.charId = character;
    this.equippedWeapon = weapon;
    this.equippedCape = cape;
    this.equippedGadget = gadget;
    this.medCrossUsed = false;
    this.droneIsFiring = false;
    this.jetpackThrusting = false;
    this.isMultiplayer = isMultiplayer;
    if (powerUpLevels) this.powerUpLevels = powerUpLevels;

    const stageConfig = STAGES[safeStageNum - 1] || STAGES[0];
    this.trackLength = stageConfig.trackLength;
    this.gravity = stageConfig.gravity;
    this.baseScrollSpeed = stageConfig.baseSpeed;
    this.hasBoss = Boolean(stageConfig.bossPresent);
    this.bossActive = false;
    this.bossMaxHealth = stageConfig.bossHealth || 1000;
    this.bossHealth = this.bossMaxHealth;
    this.bossY = 190;
    this.bossName = stageConfig.bossName || `Sector 0${safeStageNum} Boss`;
    this.isExtremeBoss = Boolean(stageConfig.isExtremeBoss);
    this.bossAttackTimer = 0;
    this.currentWave = 1;
    this.waveTransitionTimer = 0;
    this.waveTransitionActive = false;
    this.defeatedStageEnemies = 0;
    this.totalStageEnemies = Array.from({ length: WAVES_PER_STAGE }, (_, index) =>
      this.getEnemyCountForWave(index + 1)
    ).reduce((total, count) => total + count, this.hasBoss ? 1 : 0);

    // Generate Level elements
    const elements = generateLevelElements(safeStageNum);
    this.platforms = elements.platforms;
    this.obstacles = elements.obstacles;
    this.collectibles = elements.collectibles;
    this.projectiles = [];
    this.particles = [];
    this.enemies = [];
    this.remotePlayers.clear();
    this.isPaused = false;
    this.isFinished = false;
    this.isDead = false;
    this.keys = {};
    this.touchInput = {
      left: false,
      right: false,
      jump: false,
      slide: false,
      dash: false,
      attack: false,
      powerup: false,
    };

    // Reset Player
    this.x = 180;
    this.y = 360;
    this.vx = 0;
    this.vy = 0;
    this.health = 100;
    this.score = 0;
    this.coinsCollected = 0;
    this.xpEarned = 0;
    this.progress = 0;
    this.cameraX = 0;
    this.isGrounded = false;
    this.doubleJumpAvailable = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.isShooting = false;
    this.shootTimer = 0;
    this.shootCooldown = 0;
    this.isHurt = false;
    this.hurtTimer = 0;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.activePowerUps.clear();
    this.animTimer = 0;

    this.startWave(1);

    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onCoinsUpdate(this.coinsCollected);
    this.callbacks.onHealthUpdate(this.health);
    this.callbacks.onProgressUpdate(0);
    this.callbacks.onPowerUpActive([]);
  }

  private getEnemyCountForWave(wave: number): number {
    // Every wave adds another attacker; later sectors also start with more enemies.
    return 1 + wave + Math.floor((this.currentStage - 1) / 4);
  }

  private startWave(wave: number) {
    this.currentWave = wave;
    this.waveTransitionActive = false;
    this.waveTransitionTimer = 0;
    // Bosses enter after wave five is cleared, so the showdown has its own beat.
    this.bossActive = false;
    this.bossAttackTimer = 0;

    const enemyCount = this.getEnemyCountForWave(wave);
    const attackInterval = Math.max(1.6, 3.2 - this.currentStage * 0.1 - wave * 0.08);
    const hoverHeights = [145, 220, 295];
    this.enemies = Array.from({ length: enemyCount }, (_, index) => {
      const maxHealth = 52 + this.currentStage * 8 + wave * 8;
      const archetype = (['scout', 'striker', 'brute'] as const)[
        (index + wave + this.currentStage) % 3
      ];
      const baseY = hoverHeights[(index + wave) % hoverHeights.length];
      return {
        id: `stage_${this.currentStage}_wave_${wave}_enemy_${index}`,
        archetype,
        x: this.x + 245 + (index % 4) * 42 + Math.floor(index / 4) * 18,
        y: baseY,
        baseY,
        width: archetype === 'brute' ? 48 : 40,
        height: archetype === 'brute' ? 38 : 32,
        health: maxHealth,
        maxHealth,
        attackCooldown: 0.55 + Math.random() * attackInterval,
        attackInterval,
        moveSpeed: 22 + this.currentStage * 1.5 + wave * 3,
        phase: Math.random() * Math.PI * 2,
        active: true,
      };
    });

    this.updateWaveTelemetry();
    this.spawnFloatingText(`WAVE ${wave} / ${WAVES_PER_STAGE}`, this.x + 280, 110, '#00f5d4');
  }

  private getEnemiesRemaining(): number {
    const npcs = this.enemies.reduce((count, enemy) => count + (enemy.active ? 1 : 0), 0);
    return npcs + (this.bossActive && this.bossHealth > 0 ? 1 : 0);
  }

  private updateWaveTelemetry() {
    this.progress = this.totalStageEnemies > 0
      ? Math.min(100, Math.floor((this.defeatedStageEnemies / this.totalStageEnemies) * 100))
      : 0;
    const remaining = this.getEnemiesRemaining();
    this.callbacks.onProgressUpdate(this.progress);
    this.callbacks.onWaveUpdate(this.currentWave, remaining, this.progress);
  }

  private defeatEnemy(enemy: CombatEnemy) {
    if (!enemy.active) return;
    enemy.active = false;
    this.defeatedStageEnemies++;
    this.score += 300 + this.currentStage * 65 + this.currentWave * 45;
    this.coinsCollected += 1 + Math.floor((this.currentStage - 1) / 4);
    this.xpEarned += 35 + this.currentStage * 8;
    soundManager.playObstacleExplosion();
    this.triggerScreenShake(7, 0.2, '#00f5d4');
    this.spawnObstacleExplosion(enemy.x, enemy.y, true, '#00f5d4');
    this.spawnFloatingText('HOSTILE DOWN', enemy.x, enemy.y - 28, '#00f5d4');
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onCoinsUpdate(this.coinsCollected);
    this.updateWaveTelemetry();
  }

  private advanceWave(dt: number) {
    if (this.isFinished || this.isDead) return;

    if (this.waveTransitionActive) {
      this.waveTransitionTimer -= dt;
      if (this.waveTransitionTimer <= 0) {
        if (this.currentWave >= WAVES_PER_STAGE) {
          if (this.hasBoss && !this.bossActive && this.bossHealth > 0) {
            this.bossActive = true;
            this.bossAttackTimer = 0;
            this.waveTransitionActive = false;
            this.waveTransitionTimer = 0;
            this.triggerScreenShake(12, 0.35, '#f72585');
            this.spawnFloatingText(
              this.isExtremeBoss ? 'OMEGA COLOSSUS INCOMING!' : `${this.bossName.toUpperCase()} INCOMING!`,
              this.getBossWorldX(),
              this.bossY - 70,
              '#f72585'
            );
            this.updateWaveTelemetry();
          } else {
            this.completeStage();
          }
        } else {
          this.startWave(this.currentWave + 1);
        }
      }
      return;
    }

    if (this.getEnemiesRemaining() === 0) {
      // Clear both teams' lingering shots before either the next wave or boss phase.
      this.projectiles = [];

      if (this.currentWave >= WAVES_PER_STAGE && (!this.hasBoss || this.bossActive)) {
        this.spawnFloatingText(
          this.hasBoss ? 'FINAL BOSS DEFEATED' : 'SECTOR CLEARED',
          this.x + 180,
          150,
          '#fee440'
        );
        this.completeStage();
        return;
      }

      this.waveTransitionActive = true;
      this.waveTransitionTimer = 0.9;
      this.spawnFloatingText(
        this.currentWave === WAVES_PER_STAGE
          ? 'FIVE WAVES CLEARED'
          : `WAVE ${this.currentWave} CLEARED`,
        this.x + 180,
        150,
        '#fee440'
      );
      this.updateWaveTelemetry();
    }
  }

  private completeStage() {
    if (this.isFinished || this.isDead) return;
    this.isFinished = true;
    this.vx = 0;
    this.score += this.isExtremeBoss ? 35000 : this.hasBoss ? 12000 : 5000;
    this.xpEarned += this.isExtremeBoss ? 1600 : this.hasBoss ? 600 : 350;
    soundManager.playVictory();
    this.triggerScreenShake(this.isExtremeBoss ? 24 : 16, 0.7, '#fee440');
    this.callbacks.onScoreUpdate(this.score);
    this.updateWaveTelemetry();

    this.stageClearTimeout = window.setTimeout(() => {
      this.stageClearTimeout = null;
      if (!this.isRunning || this.isDead) return;
      this.stop();
      this.callbacks.onStageClear(this.score, this.coinsCollected, this.xpEarned);
    }, 850);
  }

  private getBossWorldX(): number {
    return this.cameraX + this.bossX;
  }

  public start() {
    if (this.stageClearTimeout !== null) {
      window.clearTimeout(this.stageClearTimeout);
      this.stageClearTimeout = null;
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = true;
    this.isFinished = false;
    this.isDead = false;
    this.lastTime = performance.now();
    soundManager.startMusic();
    this.loop(performance.now());
  }

  public stop() {
    this.isRunning = false;
    const stageClearPending = this.stageClearTimeout !== null;
    if (this.stageClearTimeout !== null) {
      window.clearTimeout(this.stageClearTimeout);
      this.stageClearTimeout = null;
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.stopMusic();

    // A player who exits during the short victory presentation has still earned
    // the clear; cancelling its timer must not discard campaign rewards.
    if (stageClearPending && this.isFinished && !this.isDead) {
      this.callbacks.onStageClear(this.score, this.coinsCollected, this.xpEarned);
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.handleWindowBlur();
      soundManager.stopMusic();
    } else {
      soundManager.startMusic();
      this.lastTime = performance.now();
    }
  }

  // Input Handlers
  private handleKeyDown = (e: KeyboardEvent) => {
    const wasPressed = this.keys[e.code];
    this.keys[e.code] = true;
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();

    if (!wasPressed && (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space')) {
      this.triggerJump();
    }
    if (!wasPressed && (e.code === 'KeyS' || e.code === 'ArrowDown')) {
      this.triggerSlide();
    }
    if (!wasPressed && (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ')) {
      this.triggerDash();
    }
    if (!wasPressed && (e.code === 'KeyK' || e.code === 'KeyF')) {
      this.triggerShoot();
    }
    if (!wasPressed && (e.code === 'KeyE' || e.code === 'KeyQ')) {
      this.triggerInventoryPowerup();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleWindowBlur = () => {
    this.keys = {};
    this.touchInput.left = false;
    this.touchInput.right = false;
    this.touchInput.jump = false;
    this.touchInput.slide = false;
    this.touchInput.dash = false;
    this.touchInput.attack = false;
    this.touchInput.powerup = false;
  };

  public triggerJump() {
    if (this.isSliding) {
      this.isSliding = false;
    }

    const charDef = CHARACTERS.find((c) => c.id === this.charId) || CHARACTERS[0];
    const jumpForce = -520 * charDef.jumpMultiplier;

    if (this.isGrounded) {
      this.vy = jumpForce;
      this.isGrounded = false;
      this.doubleJumpAvailable = true;
      soundManager.playJump();
      this.spawnJumpParticles();
    } else if (this.doubleJumpAvailable) {
      this.vy = jumpForce * 0.92;
      this.doubleJumpAvailable = false;
      soundManager.playDoubleJump();
      this.spawnJumpParticles();
    }
  }

  public triggerSlide() {
    if (this.isGrounded && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = 0.55; // slide duration in seconds
      soundManager.playSlide();
    }
  }

  public triggerDash() {
    if (this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = 0.28;
      this.dashCooldown = 1.2;
      soundManager.playDash();
      this.spawnDashShockwave();
    }
  }

  public triggerShoot() {
    if (this.shootCooldown > 0 || this.waveTransitionActive || this.isFinished || this.isDead) return;

    this.isShooting = true;
    const weapon = WEAPONS.find((w) => w.id === this.equippedWeapon) || WEAPONS[0];
    this.shootTimer = 0.2;
    this.shootCooldown = weapon.fireRate;
    soundManager.playLaser();

    const direction = this.facing === 'left' ? -1 : 1;
    const startX = this.x + direction * 25;
    const startY = this.y - 35;
    const makeShot = (
      offsetY: number,
      spreadY: number,
      speed: number,
      radius: number,
      color: string
    ): Projectile => {
      const shotY = startY + offsetY;
      const target = this.findAimTarget(direction, startX);
      let shotVy = spreadY;
      if (target) {
        const distanceX = Math.abs(target.x - startX);
        const flightTime = Math.max(0.12, distanceX / speed);
        shotVy += Math.max(-speed * 0.7, Math.min(speed * 0.7, (target.y - shotY) / flightTime));
      }
      return {
        id: Math.random().toString(),
        x: startX,
        y: shotY,
        // Inherit the pilot's movement so shots maintain their full relative range while running.
        vx: this.vx + direction * speed,
        vy: shotVy,
        radius,
        color,
        fromPlayer: true,
        // Long enough to cross the arena and hit the boss from the starting line.
        lifetime: 4,
      };
    };

    if (this.activePowerUps.has('triple_blaster')) {
      this.projectiles.push(
        makeShot(-10, -50, 750, 5, '#f72585'),
        makeShot(0, 0, 750, 5, weapon.color),
        makeShot(10, 50, 750, 5, '#fee440')
      );
    } else if (this.equippedWeapon === 'dual_blasters') {
      this.projectiles.push(
        makeShot(-6, 0, 820, 5, weapon.color),
        makeShot(6, 0, 820, 5, weapon.color)
      );
    } else if (this.equippedWeapon === 'railgun') {
      this.projectiles.push(makeShot(0, 0, 1450, 7, weapon.color));
    } else if (this.equippedWeapon === 'void_scythe') {
      this.projectiles.push(makeShot(0, 0, 700, 12, weapon.color));
    } else {
      this.projectiles.push(makeShot(0, 0, 720, 6, weapon.color));
    }
  }

  private findAimTarget(direction: number, startX: number): { x: number; y: number } | null {
    const targets: { x: number; y: number }[] = this.enemies
      .filter((enemy) => enemy.active)
      .map((enemy) => ({ x: enemy.x, y: enemy.y }));
    if (this.bossActive && this.bossHealth > 0) {
      targets.push({ x: this.getBossWorldX(), y: this.bossY });
    }

    return targets
      .filter((target) => {
        const distance = (target.x - startX) * direction;
        return distance > 0 && distance <= 3200;
      })
      .sort((a, b) => Math.abs(a.x - startX) - Math.abs(b.x - startX))[0] || null;
  }

  public activatePowerUp(type: PowerUpType) {
    const def = POWER_UPS.find((p) => p.id === type);
    if (!def) return;

    const level = this.powerUpLevels[type] || 1;
    const duration = def.duration + (level - 1) * 1.5;

    this.activePowerUps.set(type, duration);
    soundManager.playPowerUp();

    if (this.callbacks.onUsePowerup) {
      this.callbacks.onUsePowerup(type);
    }

    // Sparkles
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: this.x,
        y: this.y - 28,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        radius: 3 + Math.random() * 3,
        color: def.color,
        alpha: 1,
        decay: 1.2,
      });
    }
  }

  public triggerInventoryPowerup() {
    // If not currently having speed dash, trigger it
    if (!this.activePowerUps.has('speed_dash')) {
      this.activatePowerUp('speed_dash');
    } else if (!this.activePowerUps.has('triple_blaster')) {
      this.activatePowerUp('triple_blaster');
    } else {
      this.activatePowerUp('plasma_shield');
    }
  }

  // Main Loop
  private loop = (time: number) => {
    if (!this.isRunning) {
      this.animationFrameId = null;
      return;
    }

    // Always schedule the next frame, even if a collision/effect throws once.
    // Without this guard, an exception during update/render can silently kill
    // requestAnimationFrame and make the entire game appear frozen.
    try {
      const rawDt = (time - this.lastTime) / 1000;
      const dt = Math.max(0, Math.min(Number.isFinite(rawDt) ? rawDt : 0, 0.05));
      this.lastTime = time;

      if (!this.isPaused) {
        this.update(dt);
      }
      this.render();
    } catch (error) {
      // Skip the broken frame, report the real error, and keep the loop alive.
      console.error('[Neon-Dash] Recovered from a game-frame error:', error);
      this.lastTime = time;
    } finally {
      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(this.loop);
      } else {
        this.animationFrameId = null;
      }
    }
  };

  private update(dt: number) {
    this.animTimer += dt;

    // 0. Screen Shake & Impact Flash Decay
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= dt;
      const progress = Math.max(0, this.screenShakeTimer / (this.screenShakeDuration || 0.35));
      const currentIntensity = this.screenShakeIntensity * progress;
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      if (this.screenShakeTimer <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
    if (this.impactFlashAlpha > 0) {
      this.impactFlashAlpha = Math.max(0, this.impactFlashAlpha - dt * 3.8);
    }

    // Keep victory presentation moving, but stop post-clear movement and scoring.
    if (this.isFinished || this.isDead) {
      this.vx = 0;
      return;
    }

    // Time warp slow-down modifier
    const timeScale = this.activePowerUps.has('chrono_warp') ? 0.55 : 1.0;
    const effectiveDt = dt * timeScale;

    // 1. Process Active PowerUps Timers
    const activeList: { type: PowerUpType; timeLeft: number }[] = [];
    this.activePowerUps.forEach((timeLeft, type) => {
      const remaining = timeLeft - dt;
      if (remaining <= 0) {
        this.activePowerUps.delete(type);
      } else {
        this.activePowerUps.set(type, remaining);
        activeList.push({ type, timeLeft: remaining });
      }
    });
    this.callbacks.onPowerUpActive(activeList);

    // 2. Dash & Cooldown Timers
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    if (this.isShooting) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.isShooting = false;
      }
    }

    if (this.isHurt) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
      }
    }

    if (this.isInvincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
      }
    }

    // 3. Movement & Horizontal Physics
    const charDef = CHARACTERS.find((c) => c.id === this.charId) || CHARACTERS[0];
    let speed = this.baseScrollSpeed * charDef.speedMultiplier;

    // Sprint Boots Speed Multiplier & Dash Cooldown Reduction
    if (this.equippedGadget === 'sprint_boots') {
      speed *= 1.22;
      if (this.dashCooldown > 0.6) this.dashCooldown = 0.6;
      if (Math.random() < 0.3) this.spawnGhostingParticles();
    }

    if (this.activePowerUps.has('speed_dash') || this.isDashing) {
      speed *= 1.65;
    }

    // Directional control (A/D or Left/Right or Touch)
    const leftPressed = this.keys['KeyA'] || this.keys['ArrowLeft'] || this.touchInput.left;
    const rightPressed = this.keys['KeyD'] || this.keys['ArrowRight'] || this.touchInput.right;
    const jumpHeld = this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp'] || this.touchInput.jump;

    // Movement is entirely pilot-controlled; releasing both directions stops the runner.
    if (leftPressed && !rightPressed) {
      this.vx = -speed;
      this.facing = 'left';
    } else if (rightPressed && !leftPressed) {
      this.vx = speed;
      this.facing = 'right';
    } else {
      this.vx = 0;
    }

    // Hold K / F (or the touch fire button) to keep firing manually.
    const fireHeld = this.keys['KeyK'] || this.keys['KeyF'] || this.touchInput.attack;
    if (fireHeld && !this.waveTransitionActive && this.shootCooldown <= 0) {
      this.triggerShoot();
    }

    // Jetpack Upward Boost
    if ((this.equippedGadget === 'quantum_jetpack' || this.activePowerUps.has('hyper_jetpack')) && jumpHeld) {
      this.vy = -380;
      this.jetpackThrusting = true;
      this.spawnJetpackParticles();
    } else {
      this.jetpackThrusting = false;
    }

    this.droneIsFiring = false;

    // 4. Gravity & Vertical Physics
    this.vy += this.gravity * effectiveDt;
    this.x = Math.max(this.width / 2 + 12, this.x + this.vx * effectiveDt);
    this.y += this.vy * effectiveDt;

    // 5. Collision with Platforms
    this.isGrounded = false;
    const playerFeet = this.y;
    const playerHead = this.y - (this.isSliding ? 28 : this.height);
    const playerLeft = this.x - this.width / 2;
    const playerRight = this.x + this.width / 2;

    for (const plat of this.platforms) {
      // Check horizontal overlap
      if (playerRight > plat.x && playerLeft < plat.x + plat.width) {
        // Landing on top of platform
        if (this.vy >= 0 && playerFeet >= plat.y && playerFeet - this.vy * effectiveDt <= plat.y + 16) {
          this.y = plat.y;
          this.vy = 0;
          this.isGrounded = true;
          this.doubleJumpAvailable = true;

          // Crumbling platforms
          if (plat.type === 'crumbling') {
            plat.crumbleTimer = (plat.crumbleTimer || 0) + dt;
            if (plat.crumbleTimer > 0.4) {
              plat.crumbled = true;
              plat.y += 300 * dt; // drops down
            }
          }
          break;
        }
      }
    }

    // Fall into pit check (with Nano-Med Revive Core check)
    if (this.y > 480) {
      if (this.equippedGadget === 'med_cross' && !this.medCrossUsed) {
        this.medCrossUsed = true;
        this.health = 50;
        this.y = 360;
        this.vy = -340;
        this.isInvincible = true;
        this.invincibleTimer = 3.5;
        this.triggerScreenShake(12, 0.35, '#22c55e');
        soundManager.playPowerUp();
        this.spawnEmeraldNanoHealPulse();
        this.callbacks.onHealthUpdate(this.health);
      } else {
        this.triggerScreenShake(12, 0.35, '#ef4444');
        this.handlePlayerHurt(25);
        this.y = 360;
        this.vy = -260;
        this.x = Math.max(80, this.x - 90);
        this.isInvincible = true;
        this.invincibleTimer = 2.0;
      }
    }

    // 6. Camera Follows Player smoothly
    this.cameraX = this.x - 180;
    if (this.cameraX < 0) this.cameraX = 0;

    // 7. Campaign progress is earned by clearing enemy waves, not by distance.

    // Score accumulates while the pilot deliberately advances.
    const scoreDelta = Math.floor(this.vx * effectiveDt * 0.1);
    if (scoreDelta > 0) {
      this.score += scoreDelta * (this.activePowerUps.has('quantum_nova') ? 2 : 1);
      this.callbacks.onScoreUpdate(this.score);
    }

    // 8. Obstacles Collision & Patrol Logic
    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      // Patrol movement for drones
      if (obs.type === 'drone' && obs.patrolY) {
        obs.y += obs.patrolY.speed * obs.patrolY.dir;
        if (obs.y > obs.patrolY.max) obs.patrolY.dir = -1;
        if (obs.y < obs.patrolY.min) obs.patrolY.dir = 1;
      }

      // Check collision with player
      const obsRight = obs.x + obs.width;
      const obsLeft = obs.x;
      const obsTop = obs.y;
      const obsBottom = obs.y + obs.height;

      // Laser fence: player can slide underneath if low enough!
      if (obs.type === 'laser_fence' && this.isSliding) {
        // Safe slide beneath!
        continue;
      }

      if (
        playerRight > obsLeft &&
        playerLeft < obsRight &&
        playerFeet > obsTop &&
        playerHead < obsBottom
      ) {
        // If dashing with Sonic Turbo or Quantum Nova: shatter obstacle!
        if (
          this.activePowerUps.has('quantum_nova') ||
          this.isDashing ||
          this.activePowerUps.has('speed_dash')
        ) {
          obs.active = false;
          soundManager.playObstacleExplosion();
          this.score += 250;
          this.triggerScreenShake(10, 0.3, '#00f5d4');
          this.spawnObstacleExplosion(
            obs.x + obs.width / 2,
            obs.y + obs.height / 2,
            true,
            '#00f5d4',
            obs.type
          );
        } else if (!this.isInvincible && !this.isDead && !this.isFinished) {
          // Take real damage from hazard!
          if (obs.type === 'drone') {
            obs.active = false; // Drone is destroyed on collision
          }
          soundManager.playObstacleExplosion();
          this.triggerScreenShake(16, 0.45, '#ef4444');
          this.spawnObstacleExplosion(
            obs.x + obs.width / 2,
            obs.y + obs.height / 2,
            false,
            '#ef4444',
            obs.type
          );

          // Apply specific calibrated damage
          let damage = 15;
          if (obs.type === 'spike') {
            damage = 15;
            this.vy = -340; // Knock the pilot upward so the spike can be cleared.
          } else if (obs.type === 'laser_fence') {
            damage = 18;
            this.vx *= 0.7;
          } else if (obs.type === 'fire_jet') {
            damage = 18;
          } else if (obs.type === 'drone') {
            damage = 15;
          }
          this.handlePlayerHurt(damage);
        }
      }
    }

    // 9. Hostile NPCs pursue the pilot, fire aimed shots, and must all be eliminated.
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const directionToPlayer = this.x >= enemy.x ? 1 : -1;
      if (Math.abs(this.x - enemy.x) > 150) {
        enemy.x += directionToPlayer * enemy.moveSpeed * effectiveDt;
      }
      enemy.y = enemy.baseY + Math.sin(this.animTimer * 2.2 + enemy.phase) * 18;
      enemy.attackCooldown -= dt;

      const enemyLeft = enemy.x - enemy.width / 2;
      const enemyRight = enemy.x + enemy.width / 2;
      const enemyTop = enemy.y - enemy.height / 2;
      const enemyBottom = enemy.y + enemy.height / 2;
      if (
        playerRight > enemyLeft &&
        playerLeft < enemyRight &&
        playerFeet > enemyTop &&
        playerHead < enemyBottom &&
        !this.isInvincible &&
        !this.isDead &&
        !this.isFinished
      ) {
        this.handlePlayerHurt(16 + Math.floor(this.currentStage * 0.6));
        enemy.x -= directionToPlayer * 48;
      }

      if (enemy.attackCooldown <= 0 && !this.isDead && !this.isFinished) {
        enemy.attackCooldown = enemy.attackInterval * (0.85 + Math.random() * 0.3);
        const shotSpeed = 300 + this.currentStage * 14 + this.currentWave * 10;
        const shotDirection = this.x >= enemy.x ? 1 : -1;
        const targetDistance = Math.max(80, Math.abs(this.x - enemy.x));
        const flightTime = targetDistance / shotSpeed;
        const aimVy = ((this.y - 28) - enemy.y) / flightTime;
        const damage = 8 + Math.floor(this.currentStage * 0.6) + Math.floor(this.currentWave * 0.5);
        this.projectiles.push({
          id: Math.random().toString(),
          x: enemy.x,
          y: enemy.y,
          vx: shotDirection * shotSpeed,
          vy: Math.max(-250, Math.min(250, aimVy)),
          radius: this.currentStage >= 7 ? 7 : 6,
          color: enemy.archetype === 'brute' ? '#fb7185' : '#ff0054',
          fromPlayer: false,
          lifetime: 3,
          damage,
        });
      }
    }

    // 10. Collectibles (Coins, Gems, PowerUps) & Magnet Logic
    const magnetActive = this.activePowerUps.has('coin_magnet') || this.equippedGadget === 'graviton_magnet';
    const magnetRadius = (this.equippedGadget === 'graviton_magnet' || charDef.id === 'ronin') ? 420 : 240;

    for (const col of this.collectibles) {
      if (col.collected) continue;

      // Magnet pull
      if (magnetActive) {
        const dx = this.x - col.x;
        const dy = (this.y - 25) - col.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.001 && dist < magnetRadius) {
          col.x += (dx / dist) * 480 * dt;
          col.y += (dy / dist) * 480 * dt;
        }
      }

      // Pickup collision
      const colRadius = 18;
      const dx = this.x - col.x;
      const dy = (this.y - 25) - col.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < colRadius + 22) {
        col.collected = true;
        if (col.type === 'coin') {
          this.coinsCollected += 1;
          this.xpEarned += 15;
          this.score += 50;
          soundManager.playCoin();
          this.callbacks.onCoinsUpdate(this.coinsCollected);
          this.callbacks.onScoreUpdate(this.score);
        } else if (col.type === 'gem') {
          this.coinsCollected += 5;
          this.xpEarned += 45;
          this.score += 250;
          soundManager.playCoin();
          this.callbacks.onCoinsUpdate(this.coinsCollected);
          this.callbacks.onScoreUpdate(this.score);
        } else if (col.type === 'powerup' && col.powerUpType) {
          this.activatePowerUp(col.powerUpType);
        }
      }
    }

    // 11. Manually-fired shots damage wave NPCs, hazards, and the active boss.
    const weapon = WEAPONS.find((item) => item.id === this.equippedWeapon) || WEAPONS[0];
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.lifetime -= dt;

      if (proj.fromPlayer && proj.lifetime > 0) {
        const targetEnemy = this.enemies.find((enemy) =>
          enemy.active &&
          Math.abs(proj.x - enemy.x) < enemy.width / 2 + proj.radius &&
          Math.abs(proj.y - enemy.y) < enemy.height / 2 + proj.radius
        );

        if (targetEnemy) {
          targetEnemy.health -= weapon.damage;
          proj.lifetime = 0;
          this.triggerScreenShake(4, 0.12, '#00f5d4');
          this.spawnObstacleExplosion(proj.x, proj.y, true, '#00f5d4');
          if (targetEnemy.health <= 0) this.defeatEnemy(targetEnemy);
        } else {
          for (const obs of this.obstacles) {
            if (
              obs.active &&
              proj.x > obs.x &&
              proj.x < obs.x + obs.width &&
              proj.y > obs.y &&
              proj.y < obs.y + obs.height
            ) {
              obs.active = false;
              proj.lifetime = 0;
              this.score += 150;
              soundManager.playObstacleExplosion();
              this.triggerScreenShake(6, 0.2, '#00f5d4');
              this.spawnObstacleExplosion(
                obs.x + obs.width / 2,
                obs.y + obs.height / 2,
                true,
                '#00f5d4',
                obs.type
              );
              break;
            }
          }
        }

        if (proj.lifetime > 0 && this.bossActive && this.bossHealth > 0) {
          const bossActualX = this.getBossWorldX();
          const hitRadius = this.isExtremeBoss ? 100 : 76;
          if (
            Math.abs(proj.x - bossActualX) < hitRadius &&
            Math.abs(proj.y - this.bossY) < hitRadius
          ) {
            this.bossHealth = Math.max(0, this.bossHealth - weapon.damage);
            proj.lifetime = 0;
            soundManager.playObstacleExplosion();
            this.triggerScreenShake(this.isExtremeBoss ? 8 : 5, 0.18, '#f72585');
            this.spawnObstacleExplosion(proj.x, proj.y, true, this.isExtremeBoss ? '#fee440' : '#f72585');
            if (this.bossHealth === 0) {
              this.defeatedStageEnemies++;
              this.score += this.isExtremeBoss ? 35000 : 12000;
              this.coinsCollected += this.isExtremeBoss ? 400 : 150;
              this.xpEarned += this.isExtremeBoss ? 1600 : 600;
              soundManager.playVictory();
              this.triggerScreenShake(this.isExtremeBoss ? 30 : 20, 0.9, '#fee440');
              this.spawnObstacleExplosion(bossActualX, this.bossY, true, '#fee440');
              this.spawnExplosion(bossActualX, this.bossY, '#ec4899');
              this.spawnFloatingText(
                this.isExtremeBoss ? 'OMEGA COLOSSUS DEFEATED!' : `${this.bossName.toUpperCase()} DEFEATED!`,
                bossActualX,
                this.bossY - 45,
                '#fee440'
              );
              this.callbacks.onScoreUpdate(this.score);
              this.callbacks.onCoinsUpdate(this.coinsCollected);
              this.updateWaveTelemetry();
            }
          }
        }
      } else if (!proj.fromPlayer && proj.lifetime > 0) {
        // NPC and boss shots are dangerous; jump, move, or dash to evade them.
        const dx = Math.abs(proj.x - this.x);
        const dy = Math.abs(proj.y - (this.y - 28));
        if (dx < 26 && dy < 32 && !this.isInvincible && !this.isDead && !this.isFinished) {
          proj.lifetime = 0;
          this.triggerScreenShake(10, 0.28, '#ff0054');
          soundManager.playObstacleExplosion();
          this.spawnObstacleExplosion(proj.x, proj.y, false, '#ff0054');
          this.handlePlayerHurt(proj.damage ?? (this.isExtremeBoss ? 18 : 14));
        }
      }

      if (proj.lifetime <= 0) this.projectiles.splice(i, 1);
    }

    this.enemies = this.enemies.filter((enemy) => enemy.active);

    // 12. Boss Logic (Only after all five waves on Stage 5 and Stage 10)
    if (this.bossActive && this.bossHealth > 0) {
      this.bossAttackTimer += dt;
      const hoverSpeed = this.isExtremeBoss ? 3.4 : 2.0;
      const hoverAmp = this.isExtremeBoss ? 70 : 45;
      this.bossY = 190 + Math.sin(this.animTimer * hoverSpeed) * hoverAmp;

      // The Stage 10 Colossus has five times the Stage 5 health and a much denser volley.
      const attackInterval = this.isExtremeBoss ? 1.6 : 2.2;
      if (this.bossAttackTimer > attackInterval) {
        this.bossAttackTimer = 0;
        const bossActualX = this.getBossWorldX();
        const direction = this.x >= bossActualX ? 1 : -1;
        const speed = this.isExtremeBoss ? 500 : 390;
        const damage = this.isExtremeBoss ? 18 : 14;
        soundManager.playShoot();

        if (this.isExtremeBoss) {
          [-0.3, 0, 0.3].forEach((angleOffset) => {
            const y = this.bossY + angleOffset * 40;
            const flightTime = Math.max(0.12, Math.abs(this.x - bossActualX) / speed);
            const aimVy = ((this.y - 30) - y) / flightTime;
            this.projectiles.push({
              id: Math.random().toString(),
              x: bossActualX - direction * 40,
              y,
              vx: direction * speed,
              vy: Math.max(-220, Math.min(220, aimVy + Math.sin(angleOffset) * 150)),
              radius: 9,
              color: '#f72585',
              fromPlayer: false,
              lifetime: 3,
              damage,
            });
          });
          this.triggerScreenShake(7, 0.2, '#f72585');
        } else {
          const flightTime = Math.max(0.12, Math.abs(this.x - bossActualX) / speed);
          this.projectiles.push({
            id: Math.random().toString(),
            x: bossActualX - direction * 30,
            y: this.bossY,
            vx: direction * speed,
            vy: ((this.y - 30) - this.bossY) / flightTime,
            radius: 8,
            color: '#ff0054',
            fromPlayer: false,
            lifetime: 3,
            damage,
          });
        }
      }
    }

    // 13. Particles Update (Physics, Gravity, Expansion & Spin)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      if (p.growth) {
        p.radius += p.growth * dt;
      }
      if (p.vRotation && p.rotation !== undefined) {
        p.rotation += p.vRotation * dt;
      }
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 14. A stage can only be cleared by defeating every hostile in all five waves.
    this.advanceWave(dt);

    // 15. Network State Sync & AI Rival Simulation (Multiplayer)
    if (this.isMultiplayer) {
      // Simulate smart AI runner if bot rival present
      this.remotePlayers.forEach((rp) => {
        if (rp.id.startsWith('bot_')) {
          const targetSpeed = this.baseScrollSpeed * (0.96 + Math.sin(this.animTimer * 0.7) * 0.1);
          rp.x += targetSpeed * effectiveDt;
          rp.progress = Math.min(100, Math.floor((rp.x / this.trackLength) * 100));

          // Look ahead for obstacles to jump or slide
          let shouldJump = false;
          let shouldSlide = false;
          for (const obs of this.obstacles) {
            if (obs.active && obs.x > rp.x && obs.x < rp.x + 130) {
              if (obs.type === 'laser_fence') shouldSlide = true;
              else shouldJump = true;
              break;
            }
          }

          if (shouldSlide) {
            rp.spriteState = 'slide';
            rp.y = 380;
          } else if (shouldJump) {
            rp.spriteState = 'jump';
            rp.y = 310;
          } else {
            rp.spriteState = 'run';
            rp.y = 380;
          }

          if (rp.progress >= 100 && !rp.finished) {
            rp.finished = true;
            rp.finishTime = Date.now();
          }
        }
      });

      if (this.callbacks.onSendState) {
        const now = performance.now();
        if (now - this.lastNetworkSyncTime > 45) { // ~22 updates/sec
          this.lastNetworkSyncTime = now;
          this.callbacks.onSendState({
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            progress: this.progress,
            spriteState: this.getCurrentSpriteAction(),
            facing: this.facing,
            health: this.health,
            score: this.score,
            activePowerups: Array.from(this.activePowerUps.keys()),
          });
        }
      }
    }
  }

  private handlePlayerHurt(damage: number) {
    if (this.isInvincible || this.activePowerUps.has('quantum_nova') || this.isDead || this.isFinished) return;

    // Plasma shield absorbs hit!
    if (this.activePowerUps.has('plasma_shield')) {
      this.activePowerUps.delete('plasma_shield');
      soundManager.playObstacleExplosion();
      this.isInvincible = true;
      this.invincibleTimer = 1.5;
      this.triggerScreenShake(9, 0.28, '#38bdf8');
      this.spawnObstacleExplosion(this.x, this.y - 25, true, '#38bdf8');
      this.spawnFloatingText('SHIELD DEFLECT!', this.x, this.y - 45, '#38bdf8');
      return;
    }

    const actualDmg = Math.max(0, damage);
    this.health = Math.max(0, this.health - actualDmg);
    this.isHurt = true;
    this.hurtTimer = 0.35;
    this.isInvincible = true;
    this.invincibleTimer = 1.6;
    this.triggerScreenShake(12, 0.35, '#ef4444');
    soundManager.playHit();
    this.spawnFloatingText(`-${actualDmg} HP`, this.x, this.y - 40, '#ff0054');
    this.callbacks.onHealthUpdate(this.health);

    // Emergency Revive if Nano-Med Revive Core is equipped
    if (this.health <= 0 && this.equippedGadget === 'med_cross' && !this.medCrossUsed) {
      this.medCrossUsed = true;
      this.health = 50;
      this.isInvincible = true;
      this.invincibleTimer = 3.5;
      soundManager.playPowerUp();
      this.spawnEmeraldNanoHealPulse();
      this.callbacks.onHealthUpdate(this.health);
      return;
    }

    // Health reached 0: Real Game Over
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.stop();
      soundManager.playGameOver();
      this.callbacks.onGameOver(this.score, this.coinsCollected, this.xpEarned);
    }
  }

  public spawnEmeraldNanoHealPulse() {
    for (let i = 0; i < 30; i++) {
      const angle = (i * Math.PI * 2) / 30;
      this.particles.push({
        x: this.x,
        y: this.y - 28,
        vx: Math.cos(angle) * (140 + Math.random() * 80),
        vy: Math.sin(angle) * (140 + Math.random() * 80),
        radius: 3.5 + Math.random() * 3,
        color: '#22c55e',
        alpha: 1,
        decay: 0.9,
      });
    }
  }

  public spawnGhostingParticles() {
    this.particles.push({
      x: this.x - (this.facing === 'right' ? 18 : -18),
      y: this.y - 24,
      vx: -(this.vx * 0.12),
      vy: (Math.random() - 0.5) * 15,
      radius: 4,
      color: '#38bdf8',
      alpha: 0.55,
      decay: 2.8,
    });
  }

  public getCurrentSpriteAction(): SpriteAction {
    if (this.isFinished) return 'victory';
    if (this.isHurt) return 'hurt';
    if (this.isSliding) return 'slide';
    if (this.isDashing) return 'dash';
    if (this.isShooting) return 'shoot';
    if (!this.isGrounded) {
      return this.vy < -50 ? 'jump' : 'fall';
    }
    if (Math.abs(this.vx) > 30) return 'run';
    return 'idle';
  }

  // --- RENDERING ---
  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Clear Screen
    ctx.fillStyle = '#090a15';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Center game viewport inside canvas container
    const offsetX = (this.canvas.width - this.virtualWidth * this.scale) / 2;
    const offsetY = (this.canvas.height - this.virtualHeight * this.scale) / 2;
    ctx.translate(offsetX, offsetY);
    ctx.scale(this.scale, this.scale);

    // Clip to virtual playfield
    ctx.beginPath();
    ctx.rect(0, 0, this.virtualWidth, this.virtualHeight);
    ctx.clip();

    // 1. Draw Parallax Background
    this.renderParallaxBackground();

    // 2. Translate by Camera Scroll
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 3. Draw Platforms
    this.renderPlatforms();

    // 4. Draw Collectibles
    this.renderCollectibles();

    // 5. Draw wave hostiles, environmental hazards, and the active boss.
    this.renderCombatEnemies();
    this.renderObstacles();

    // 6. Draw Remote Multiplayer Opponents
    this.renderRemotePlayers();

    // 7. Draw Local Player On-Foot
    const spriteAction = this.getCurrentSpriteAction();
    SpriteRenderer.drawSprite(
      ctx,
      this.x,
      this.y,
      spriteAction,
      this.facing,
      this.charId,
      this.animTimer,
      this.isInvincible,
      1,
      this.equippedWeapon,
      this.equippedCape
    );

    // Render Equipped Companion Gadget (Combat Drone, Nano-Med Cross, Jetpack, Boots, Magnet)
    if (this.equippedGadget) {
      SpriteRenderer.renderGadgetCompanion(
        ctx,
        this.x,
        this.y,
        this.equippedGadget,
        this.animTimer,
        this.jetpackThrusting,
        this.droneIsFiring,
        this.facing
      );
    }

    // Draw Plasma Shield Bubble around player if active
    if (this.activePowerUps.has('plasma_shield')) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 26, 32 + Math.sin(this.animTimer * 10) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Draw Projectiles & Particles
    this.renderProjectiles();
    this.renderParticles();

    ctx.restore(); // Restore Camera translation

    // Show a boss bar only during the dedicated post-wave boss encounter.
    if (this.bossActive && this.bossHealth > 0) {
      this.renderBossHealthBar();
    }

    ctx.restore(); // Restore Scale
  }

  private renderParallaxBackground() {
    const ctx = this.ctx;
    const stage = STAGES[this.currentStage - 1] || STAGES[0];
    const theme = stage.bgTheme;

    // Sky Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.virtualHeight);
    if (theme === 'magma_reactor') {
      grad.addColorStop(0, '#1c070c');
      grad.addColorStop(1, '#3b0d11');
    } else if (theme === 'orbital_apex') {
      grad.addColorStop(0, '#030712');
      grad.addColorStop(1, '#0f172a');
    } else if (theme === 'quantum_void') {
      grad.addColorStop(0, '#180728');
      grad.addColorStop(1, '#2e1065');
    } else {
      // Metropolis / Circuit Grid
      grad.addColorStop(0, '#0a0d1a');
      grad.addColorStop(1, '#1e1b4b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // Far Layer: Cyber Skyline (Parallax factor 0.1)
    const farOffset = (this.cameraX * 0.1) % 400;
    ctx.fillStyle = 'rgba(20, 24, 45, 0.6)';
    for (let i = -1; i < 5; i++) {
      const bX = i * 200 - farOffset;
      const bH = 180 + Math.sin(i * 99) * 60;
      ctx.fillRect(bX, this.virtualHeight - bH, 140, bH);

      // Windows
      ctx.fillStyle = 'rgba(0, 245, 212, 0.2)';
      for (let wy = this.virtualHeight - bH + 20; wy < this.virtualHeight - 40; wy += 22) {
        for (let wx = bX + 15; wx < bX + 120; wx += 25) {
          ctx.fillRect(wx, wy, 8, 12);
        }
      }
      ctx.fillStyle = 'rgba(20, 24, 45, 0.6)';
    }

    // Mid Layer: Neon grid & fly-by traffic (Parallax factor 0.3)
    const midOffset = (this.cameraX * 0.3) % 300;
    ctx.strokeStyle = 'rgba(114, 9, 183, 0.3)';
    ctx.lineWidth = 1;
    for (let x = -midOffset; x < this.virtualWidth; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 260);
      ctx.lineTo(x, 380);
      ctx.stroke();
    }
  }

  private renderPlatforms() {
    const ctx = this.ctx;
    for (const plat of this.platforms) {
      if (plat.crumbled) continue;

      // Platform Base
      if (plat.type === 'ground') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Neon Top Edge
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 8;
        ctx.fillRect(plat.x, plat.y, plat.width, 4);
        ctx.shadowBlur = 0;

        // Grid lines inside ground
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let gx = plat.x; gx < plat.x + plat.width; gx += 40) {
          ctx.beginPath();
          ctx.moveTo(gx, plat.y + 4);
          ctx.lineTo(gx, plat.y + plat.height);
          ctx.stroke();
        }
      } else {
        // Floating / Crumbling platform
        const col = plat.type === 'crumbling' ? '#ff0054' : '#38bdf8';
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 4);
        ctx.fill();

        // Neon outline
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.shadowColor = col;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }

  private renderCollectibles() {
    const ctx = this.ctx;
    for (const col of this.collectibles) {
      if (col.collected) continue;

      const floatY = col.y + Math.sin(this.animTimer * 5 + col.x) * 4;

      if (col.type === 'coin') {
        // Rotating Gold Coin
        const spin = Math.cos(this.animTimer * 6 + col.x * 0.1);
        ctx.save();
        ctx.translate(col.x, floatY);
        ctx.scale(Math.abs(spin) || 0.1, 1);
        ctx.fillStyle = '#fee440';
        ctx.shadowColor = '#fee440';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (col.type === 'gem') {
        // Cyan Diamond Gem
        ctx.save();
        ctx.translate(col.x, floatY);
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 12);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (col.type === 'powerup' && col.powerUpType) {
        // Power-Up Capsule
        const def = POWER_UPS.find((p) => p.id === col.powerUpType);
        const color = def ? def.color : '#ec4899';

        ctx.save();
        ctx.translate(col.x, floatY);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Icon
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def?.icon || '⚡', 0, 1);
        ctx.restore();
      }
    }
  }

  private renderCombatEnemies() {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const color = enemy.archetype === 'brute'
        ? '#fb7185'
        : enemy.archetype === 'striker'
        ? '#f97316'
        : '#ff0054';
      const bob = Math.sin(this.animTimer * 5 + enemy.phase) * 2;
      const healthRatio = Math.max(0, enemy.health / enemy.maxHealth);

      ctx.save();
      ctx.translate(enemy.x, enemy.y + bob);
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height, 8);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = enemy.archetype === 'brute' ? 3 : 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Twin thrusters and a bright targeting eye identify these as hostile NPCs.
      ctx.fillStyle = color;
      ctx.fillRect(-enemy.width / 2 - 5, -7, 6, 14);
      ctx.fillRect(enemy.width / 2 - 1, -7, 6, 14);
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(3, -2, enemy.archetype === 'brute' ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(-enemy.width / 2, -enemy.height / 2 - 9, enemy.width, 4);
      ctx.fillStyle = color;
      ctx.fillRect(-enemy.width / 2, -enemy.height / 2 - 9, enemy.width * healthRatio, 4);
      ctx.restore();
    }
  }

  private renderObstacles() {
    const ctx = this.ctx;
    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      if (obs.type === 'spike') {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'laser_fence') {
        // High Laser Fence (slide underneath)
        ctx.strokeStyle = '#f72585';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#f72585';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Warning emitter nodes
        ctx.fillStyle = '#fee440';
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y, 5, 0, Math.PI * 2);
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'drone') {
        // Flying Drone Sentry
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
        ctx.fill();

        // Red Sensor Eye
        ctx.fillStyle = '#ff0054';
        ctx.shadowColor = '#ff0054';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'fire_jet') {
        // Thermal Flame Jet
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + Math.random() * 8);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Only stages 5 and 10 reveal their boss after all five waves are cleared.
    if (this.bossActive && this.bossHealth > 0) {
      const bx = this.getBossWorldX();
      const by = this.bossY;

      ctx.save();
      ctx.translate(bx, by);

      if (this.isExtremeBoss) {
        // --- STAGE 10: OMEGA CYBER COLOSSUS (EXTREME BOSS) ---
        // 1. Apocalyptic Pulse Aura
        const pulse = Math.sin(this.animTimer * 6) * 12;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 90 + pulse);
        grad.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
        grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 95 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 2. Rotating Outer Plasma Ring with 8 Cyber Spikes
        ctx.save();
        ctx.rotate(this.animTimer * 1.5);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, 62, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8;
          const sx = Math.cos(ang) * 62;
          const sy = Math.sin(ang) * 62;
          const ex = Math.cos(ang) * 82;
          const ey = Math.sin(ang) * 82;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
        ctx.restore();

        // 3. Counter-rotating inner Void Hexagon
        ctx.save();
        ctx.rotate(-this.animTimer * 2.2);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6;
          const hx = Math.cos(a) * 44;
          const hy = Math.sin(a) * 44;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // 4. Heavy Armored Core Chassis
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#fee440';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#fee440';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.rect(-38, -38, 76, 76);
        ctx.fill();
        ctx.stroke();

        // 5. Blazing Extreme Core Eye
        ctx.fillStyle = '#ff0054';
        ctx.shadowColor = '#ff0054';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fee440';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // --- STAGE 5: GLITCH OVERLORD MINI-BOSS ---
        // Rotating Energy Ring
        ctx.save();
        ctx.rotate(this.animTimer * 1.8);
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Main Drone Chassis
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.rect(-28, -28, 56, 56);
        ctx.fill();
        ctx.stroke();

        // Core Eye
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderRemotePlayers() {
    const ctx = this.ctx;
    this.remotePlayers.forEach((player) => {
      // Find matching character
      const charDef = CHARACTERS.find((c) => c.name === player.character) || CHARACTERS[1];
      const charId = charDef.id;

      // Draw Nametag above head
      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(player.name, player.x, player.y - 66);

      // Ping / Progress marker
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${player.progress}%`, player.x, player.y - 78);
      ctx.restore();

      // Render Opponent Sprite!
      SpriteRenderer.drawSprite(
        ctx,
        player.x,
        player.y,
        player.spriteState || 'run',
        player.facing || 'right',
        charId,
        this.animTimer,
        false
      );
    });
  }

  private renderProjectiles() {
    const ctx = this.ctx;
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      if (p.text) {
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderBossHealthBar() {
    const ctx = this.ctx;
    const barW = this.isExtremeBoss ? 420 : 340;
    const barH = this.isExtremeBoss ? 16 : 13;
    const bx = (this.virtualWidth - barW) / 2;
    // Place it beneath the wave objective so the active boss health stays readable.
    const by = 136;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = this.isExtremeBoss ? '#fee440' : '#f43f5e';
    ctx.lineWidth = this.isExtremeBoss ? 3 : 2;
    ctx.shadowColor = this.isExtremeBoss ? '#fee440' : '#f43f5e';
    ctx.shadowBlur = this.isExtremeBoss ? 12 : 6;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW, barH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    const pct = Math.max(0, this.bossHealth / this.bossMaxHealth);
    ctx.fillStyle = this.isExtremeBoss ? '#ff0054' : '#f43f5e';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(bx + 2, by + 2, (barW - 4) * pct, barH - 4, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = this.isExtremeBoss ? '#fee440' : '#ffffff';
    ctx.textAlign = 'center';
    const label = this.isExtremeBoss
      ? `☠️ ${this.bossName} [${Math.ceil(this.bossHealth)} / ${this.bossMaxHealth}] ☠️`
      : `⚔️ ${this.bossName} [${Math.ceil(this.bossHealth)} / ${this.bossMaxHealth}]`;
    ctx.fillText(label, this.virtualWidth / 2, by - 6);
  }

  // Particle Spawners
  private spawnJumpParticles() {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.x + (Math.random() - 0.5) * 20,
        y: this.y,
        vx: (Math.random() - 0.5) * 80,
        vy: 40 + Math.random() * 60,
        radius: 2 + Math.random() * 3,
        color: '#00f5d4',
        alpha: 1,
        decay: 1.8,
      });
    }
  }

  private spawnJetpackParticles() {
    this.particles.push({
      x: this.x + (Math.random() - 0.5) * 12,
      y: this.y,
      vx: (Math.random() - 0.5) * 40,
      vy: 120 + Math.random() * 80,
      radius: 3 + Math.random() * 3,
      color: '#ff5400',
      alpha: 1,
      decay: 2.2,
    });
  }

  private spawnDashShockwave() {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: this.x - 20,
        y: this.y - 25 + (Math.random() - 0.5) * 30,
        vx: -180 - Math.random() * 120,
        vy: (Math.random() - 0.5) * 60,
        radius: 3 + Math.random() * 4,
        color: '#38bdf8',
        alpha: 1,
        decay: 2.0,
      });
    }
  }

  private spawnExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 250,
        vy: (Math.random() - 0.5) * 250,
        radius: 3 + Math.random() * 4,
        color,
        alpha: 1,
        decay: 1.5,
      });
    }
  }

  private spawnObstacleExplosion(x: number, y: number, isSuccess: boolean = true, color: string = '#ff0054', _type?: string) {
    const count = isSuccess ? 20 : 12;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 320,
        vy: (Math.random() - 0.5) * 320,
        radius: 3 + Math.random() * 5,
        color,
        alpha: 1,
        decay: 1.8,
        shape: Math.random() > 0.5 ? 'shard' : 'circle',
      });
    }
  }

  public spawnFloatingText(text: string, x: number, y: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: -75,
      radius: 0,
      color,
      alpha: 1,
      decay: 0.85,
      text,
    });
  }
}
