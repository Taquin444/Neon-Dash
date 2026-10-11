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
  VehicleId,
  GadgetId,
} from '../types/game';
import { SpriteRenderer } from './spriteRenderer';
import { CHARACTERS, STAGES, POWER_UPS, generateLevelElements, WEAPONS, VEHICLES, GADGETS } from './levelData';
import { soundManager } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number) => void;
  onCoinsUpdate: (coins: number) => void;
  onHealthUpdate: (health: number) => void;
  onProgressUpdate: (progress: number) => void;
  onPowerUpActive: (powerUps: { type: PowerUpType; timeLeft: number }[]) => void;
  onGameOver: (finalScore: number, coinsEarned: number, xpEarned: number) => void;
  onStageClear: (finalScore: number, coinsEarned: number, xpEarned: number) => void;
  onVehicleMountChange?: (mounted: boolean, vehicleId: VehicleId) => void;
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

  // Boss (Stage 5)
  private hasBoss: boolean = false;
  private bossHealth: number = 1500;
  private bossMaxHealth: number = 1500;
  private bossX: number = 650;
  private bossY: number = 200;
  private bossAttackTimer: number = 0;

  // Player State
  public charId: CharacterId = 'ninja';
  public equippedWeapon: WeaponId = 'katana';
  public equippedCape: CapeId = 'starter_scarf';
  public equippedVehicle: VehicleId = 'none';
  public equippedGadget: GadgetId = 'combat_drone';
  public isVehicleMounted: boolean = false;
  public medCrossUsed: boolean = false;
  public droneFireCooldown: number = 0;
  public droneIsFiring: boolean = false;
  public droneFireTimer: number = 0;
  public jetpackThrusting: boolean = false;
  public x: number = 100;
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
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
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
    vehicle: VehicleId = 'none',
    gadget: GadgetId = 'combat_drone'
  ) {
    const safeStageNum = Number.isFinite(stageNum)
      ? Math.max(1, Math.min(STAGES.length, Math.floor(stageNum)))
      : 1;
    this.currentStage = safeStageNum;
    this.charId = character;
    this.equippedWeapon = weapon;
    this.equippedCape = cape;
    this.equippedVehicle = vehicle;
    this.equippedGadget = gadget;
    this.isVehicleMounted = vehicle !== 'none';
    this.medCrossUsed = false;
    this.droneFireCooldown = 0.6;
    this.droneIsFiring = false;
    this.jetpackThrusting = false;
    this.isMultiplayer = isMultiplayer;
    if (powerUpLevels) this.powerUpLevels = powerUpLevels;

    const stageConfig = STAGES[safeStageNum - 1] || STAGES[0];
    this.trackLength = stageConfig.trackLength;
    this.gravity = stageConfig.gravity;
    this.baseScrollSpeed = stageConfig.baseSpeed;
    this.hasBoss = Boolean(stageConfig.bossPresent);
    this.bossMaxHealth = stageConfig.bossHealth || 1500;
    this.bossHealth = this.bossMaxHealth;

    // Generate Level elements
    const elements = generateLevelElements(safeStageNum);
    this.platforms = elements.platforms;
    this.obstacles = elements.obstacles;
    this.collectibles = elements.collectibles;
    this.projectiles = [];
    this.particles = [];
    this.remotePlayers.clear();
    this.isPaused = false;
    this.isFinished = false;

    // Reset Player
    this.x = 80;
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
    this.isDashing = false;
    this.isShooting = false;
    this.isHurt = false;
    this.isInvincible = false;
    this.isFinished = false;
    this.activePowerUps.clear();
    this.animTimer = 0;

    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onCoinsUpdate(this.coinsCollected);
    this.callbacks.onHealthUpdate(this.health);
    this.callbacks.onProgressUpdate(0);
    this.callbacks.onPowerUpActive([]);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    soundManager.startMusic();
    this.loop(performance.now());
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.stopMusic();
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      soundManager.stopMusic();
    } else {
      soundManager.startMusic();
      this.lastTime = performance.now();
    }
  }

  // Input Handlers
  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
      this.triggerJump();
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      this.triggerSlide();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') {
      this.triggerDash();
    }
    if (e.code === 'KeyK' || e.code === 'KeyF') {
      this.triggerShoot();
    }
    if (e.code === 'KeyE' || e.code === 'KeyQ') {
      this.triggerInventoryPowerup();
    }
    if (e.code === 'KeyV') {
      this.toggleVehicleMount();
    }
  };

  public toggleVehicleMount() {
    if (this.equippedVehicle && this.equippedVehicle !== 'none') {
      this.isVehicleMounted = !this.isVehicleMounted;
      soundManager.playPowerUp();
      this.spawnDashShockwave();
      if (this.callbacks.onVehicleMountChange) {
        this.callbacks.onVehicleMountChange(this.isVehicleMounted, this.equippedVehicle);
      }
    }
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
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
    if (this.shootCooldown <= 0) {
      this.isShooting = true;
      const wpn = WEAPONS.find((w) => w.id === this.equippedWeapon) || WEAPONS[0];
      this.shootTimer = 0.2;
      this.shootCooldown = wpn.fireRate;
      soundManager.playLaser();

      const dir = this.facing === 'left' ? -1 : 1;
      const startX = this.x + dir * 25;
      const startY = this.y - 35;

      const isTriple = this.activePowerUps.has('triple_blaster');
      if (isTriple) {
        this.projectiles.push(
          { id: Math.random().toString(), x: startX, y: startY - 10, vx: dir * 750, vy: -50, radius: 5, color: '#f72585', fromPlayer: true, lifetime: 1.5 },
          { id: Math.random().toString(), x: startX, y: startY, vx: dir * 750, vy: 0, radius: 5, color: wpn.color, fromPlayer: true, lifetime: 1.5 },
          { id: Math.random().toString(), x: startX, y: startY + 10, vx: dir * 750, vy: 50, radius: 5, color: '#fee440', fromPlayer: true, lifetime: 1.5 }
        );
      } else if (this.equippedWeapon === 'dual_blasters') {
        this.projectiles.push(
          { id: Math.random().toString(), x: startX, y: startY - 6, vx: dir * 820, vy: 0, radius: 5, color: wpn.color, fromPlayer: true, lifetime: 1.5 },
          { id: Math.random().toString(), x: startX, y: startY + 6, vx: dir * 820, vy: 0, radius: 5, color: wpn.color, fromPlayer: true, lifetime: 1.5 }
        );
      } else if (this.equippedWeapon === 'railgun') {
        this.projectiles.push({
          id: Math.random().toString(),
          x: startX,
          y: startY,
          vx: dir * 1150,
          vy: 0,
          radius: 7,
          color: wpn.color,
          fromPlayer: true,
          lifetime: 1.2,
        });
      } else if (this.equippedWeapon === 'void_scythe') {
        this.projectiles.push({
          id: Math.random().toString(),
          x: startX,
          y: startY,
          vx: dir * 700,
          vy: 0,
          radius: 12,
          color: wpn.color,
          fromPlayer: true,
          lifetime: 1.5,
        });
      } else {
        this.projectiles.push({
          id: Math.random().toString(),
          x: startX,
          y: startY,
          vx: dir * 720,
          vy: 0,
          radius: 6,
          color: wpn.color,
          fromPlayer: true,
          lifetime: 1.5,
        });
      }
    }
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

    // Vehicle Speed Multiplier
    if (this.isVehicleMounted && this.equippedVehicle !== 'none') {
      const vDef = VEHICLES.find((v) => v.id === this.equippedVehicle);
      if (vDef) speed *= vDef.speedMultiplier;
    }

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
    let moveDir = 1; // Default auto-run forward
    const leftPressed = this.keys['KeyA'] || this.keys['ArrowLeft'] || this.touchInput.left;
    const rightPressed = this.keys['KeyD'] || this.keys['ArrowRight'] || this.touchInput.right;
    const jumpHeld = this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp'] || this.touchInput.jump;

    if (leftPressed) {
      this.vx = -speed * 0.45;
      this.facing = 'left';
    } else if (rightPressed) {
      this.vx = speed * 1.25;
      this.facing = 'right';
    } else {
      this.vx = speed;
      this.facing = 'right';
    }

    // Spaceship VTOL Aerial Flight & Jetpack Upward Boost
    if (this.isVehicleMounted && this.equippedVehicle === 'spaceship' && jumpHeld) {
      this.vy = -340; // Continuous smooth VTOL ascent
      this.spawnJetpackParticles();
    } else if ((this.equippedGadget === 'quantum_jetpack' || this.activePowerUps.has('hyper_jetpack')) && jumpHeld) {
      this.vy = -380;
      this.jetpackThrusting = true;
      this.spawnJetpackParticles();
    } else {
      this.jetpackThrusting = false;
    }

    // Spaceship Auto-Cannons (Shooting twin plasma bolts forward)
    if (this.isVehicleMounted && this.equippedVehicle === 'spaceship') {
      if (this.shootCooldown <= 0) {
        this.shootCooldown = 0.42;
        this.projectiles.push({
          id: Math.random().toString(),
          x: this.x + (this.facing === 'right' ? 38 : -38),
          y: this.y - 14,
          vx: (this.facing === 'right' ? 1 : -1) * 880,
          vy: 0,
          radius: 5,
          color: '#38bdf8',
          fromPlayer: true,
          lifetime: 1.4,
        });
        soundManager.playLaser();
      }
    }

    // Tactical Combat Drone Autonomous Defense Laser
    if (this.equippedGadget === 'combat_drone') {
      this.droneFireCooldown -= dt;
      if (this.droneFireCooldown <= 0) {
        const targetObs = this.obstacles.find(
          (o) => o.active && o.x > this.x && o.x < this.x + 440
        );
        if (targetObs) {
          this.droneFireCooldown = 1.4;
          this.droneIsFiring = true;
          this.droneFireTimer = 0.22;
          soundManager.playLaser();
          this.projectiles.push({
            id: Math.random().toString(),
            x: this.x + (this.facing === 'right' ? -35 : 35),
            y: this.y - 48,
            vx: (this.facing === 'right' ? 1 : -1) * 820,
            vy: (targetObs.y + targetObs.height / 2 - (this.y - 48)) * 0.7,
            radius: 4,
            color: '#00f5d4',
            fromPlayer: true,
            lifetime: 1.2,
          });
        }
      }
    }
    if (this.droneIsFiring) {
      this.droneFireTimer -= dt;
      if (this.droneFireTimer <= 0) this.droneIsFiring = false;
    }

    // 4. Gravity & Vertical Physics (Hoverbike floats with lower effective gravity)
    const gravMult = (this.isVehicleMounted && this.equippedVehicle === 'hoverbike') ? 0.78 : 1.0;
    this.vy += this.gravity * gravMult * effectiveDt;
    this.x += this.vx * effectiveDt;
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
        this.triggerScreenShake(14, 0.42, '#ef4444');
        this.handlePlayerHurt(45);
        this.y = 360;
        this.vy = -200;
        this.x = Math.max(80, this.x - 120);
      }
    }

    // 6. Camera Follows Player smoothly
    this.cameraX = this.x - 180;
    if (this.cameraX < 0) this.cameraX = 0;

    // 7. Progress & Score Calculation
    this.progress = Math.min(100, Math.floor((this.x / this.trackLength) * 100));
    this.callbacks.onProgressUpdate(this.progress);

    // Score accumulates over distance
    const scoreDelta = Math.floor(this.vx * effectiveDt * 0.1);
    if (scoreDelta > 0) {
      this.score += scoreDelta * (this.activePowerUps.has('quantum_nova') ? 2 : 1);
      this.callbacks.onScoreUpdate(this.score);
    }

    // 8. Obstacles Collision & Patrol Logic
    const isRamVehicle =
      this.isVehicleMounted &&
      (this.equippedVehicle === 'cyber_car' || this.equippedVehicle === 'cyber_truck');

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
        // If dashing with Sonic Turbo, Quantum Nova, or Ramming Vehicle: shatter obstacle!
        if (
          this.activePowerUps.has('quantum_nova') ||
          this.isDashing ||
          this.activePowerUps.has('speed_dash') ||
          isRamVehicle
        ) {
          obs.active = false;
          soundManager.playObstacleExplosion();
          this.score += 250;
          this.triggerScreenShake(10, 0.3, isRamVehicle ? '#00f5d4' : '#ff0054');
          this.spawnObstacleExplosion(
            obs.x + obs.width / 2,
            obs.y + obs.height / 2,
            true,
            isRamVehicle ? '#00f5d4' : '#ff0054',
            obs.type
          );
        } else {
          // Take damage & dramatic impact collision!
          obs.active = false;
          soundManager.playObstacleExplosion();
          this.triggerScreenShake(16, 0.45, '#ef4444');
          this.spawnObstacleExplosion(
            obs.x + obs.width / 2,
            obs.y + obs.height / 2,
            false,
            '#ef4444',
            obs.type
          );
          this.handlePlayerHurt(20);
        }
      }
    }

    // 9. Collectibles (Coins, Gems, PowerUps) & Magnet Logic
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

    // 10. Projectiles Update & Collision
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.lifetime -= dt;

      // Check hit against drones / obstacles
      if (proj.fromPlayer) {
        for (const obs of this.obstacles) {
          if (!obs.active) continue;
          if (
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

        // Check hit against Boss (Stage 5)
        if (this.hasBoss && this.bossHealth > 0) {
          const bossDist = Math.abs(proj.x - (this.cameraX + this.bossX));
          if (bossDist < 60 && Math.abs(proj.y - this.bossY) < 60) {
            this.bossHealth -= 35;
            proj.lifetime = 0;
            soundManager.playObstacleExplosion();
            this.triggerScreenShake(8, 0.22, '#f72585');
            this.spawnObstacleExplosion(proj.x, proj.y, true, '#f72585');
            if (this.bossHealth <= 0) {
              this.score += 5000;
              this.triggerScreenShake(24, 0.85, '#fee440');
              this.spawnObstacleExplosion(this.cameraX + this.bossX, this.bossY, true, '#fee440');
            }
          }
        }
      }

      if (proj.lifetime <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 11. Boss Logic (Stage 5 Glitch Overlord)
    if (this.hasBoss && this.bossHealth > 0) {
      this.bossAttackTimer += dt;
      this.bossY = 180 + Math.sin(this.animTimer * 2) * 50;

      // Boss fires homing energy orbs every 2.4s
      if (this.bossAttackTimer > 2.2) {
        this.bossAttackTimer = 0;
        this.projectiles.push({
          id: Math.random().toString(),
          x: this.cameraX + this.bossX - 30,
          y: this.bossY,
          vx: -380,
          vy: (this.y - 30 - this.bossY) * 0.8,
          radius: 8,
          color: '#ff0054',
          fromPlayer: false,
          lifetime: 2.5,
        });
      }
    }

    // 12. Particles Update (Physics, Gravity, Expansion & Spin)
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

    // 13. Stage Completion (Finish Line)
    if (this.x >= this.trackLength && !this.isFinished) {
      this.isFinished = true;
      soundManager.playVictory();
      this.score += 2000;
      this.xpEarned += 350;
      this.callbacks.onScoreUpdate(this.score);
      this.callbacks.onStageClear(this.score, this.coinsCollected, this.xpEarned);
    }

    // 14. Network State Sync & AI Rival Simulation (Multiplayer)
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
    if (this.isInvincible || this.activePowerUps.has('quantum_nova')) return;

    // Plasma shield absorbs hit!
    if (this.activePowerUps.has('plasma_shield')) {
      this.activePowerUps.delete('plasma_shield');
      soundManager.playObstacleExplosion();
      this.isInvincible = true;
      this.invincibleTimer = 1.0;
      this.triggerScreenShake(9, 0.28, '#38bdf8');
      this.spawnObstacleExplosion(this.x, this.y - 25, true, '#38bdf8');
      return;
    }

    // Damage should never stop the run. Keep at least 1 HP so a collision
    // cannot unexpectedly trigger game-over and halt the whole animation loop.
    this.health = Math.max(1, this.health - Math.max(0, damage));
    this.isHurt = true;
    this.hurtTimer = 0.35;
    this.isInvincible = true;
    this.invincibleTimer = 1.5;
    this.triggerScreenShake(14, 0.42, '#ef4444');
    soundManager.playHit();
    this.callbacks.onHealthUpdate(this.health);

    // This runner is designed to continue after obstacle hits. The health bar
    // bottoms out at 1 HP; only explicit stage completion/game UI should change
    // the run state. Preserve the one-time med-cross revive as a bonus effect.
    if (this.health <= 1 && this.equippedGadget === 'med_cross' && !this.medCrossUsed) {
      this.medCrossUsed = true;
      this.health = 50;
      this.isInvincible = true;
      this.invincibleTimer = 3.5;
      soundManager.playPowerUp();
      this.spawnEmeraldNanoHealPulse();
      this.callbacks.onHealthUpdate(this.health);
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

    // 5. Draw Obstacles & Boss
    this.renderObstacles();

    // 6. Draw Remote Multiplayer Opponents
    this.renderRemotePlayers();

    // 7. Draw Local Player (Mounted in Vehicle or On-Foot)
    if (this.isVehicleMounted && this.equippedVehicle !== 'none') {
      SpriteRenderer.renderVehicle(
        ctx,
        this.x,
        this.y,
        this.equippedVehicle,
        this.charId,
        this.animTimer,
        this.isDashing || Math.abs(this.vx) > this.baseScrollSpeed * 1.3,
        this.facing,
        !this.isGrounded,
        this.equippedCape
      );
    } else {
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
    }

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

    // 9. Draw Finish Line Gate
    this.renderFinishLine();

    ctx.restore(); // Restore Camera translation

    // 10. Boss Health Bar (HUD-level)
    if (this.hasBoss && this.bossHealth > 0) {
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

    // Boss (Stage 5 Glitch Overlord)
    if (this.hasBoss && this.bossHealth > 0) {
      const bx = this.cameraX + this.bossX;
      const by = this.bossY;

      ctx.save();
      ctx.translate(bx, by);

      // Glitch Aura
      ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, 50 + Math.sin(this.animTimer * 10) * 6, 0, Math.PI * 2);
      ctx.fill();

      // Main Boss Core
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.rect(-36, -36, 72, 72);
      ctx.fill();
      ctx.stroke();

      // Core Eye
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

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
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFinishLine() {
    const ctx = this.ctx;
    const fx = this.trackLength;
    const fy = 380;

    // Glowing Holographic Gate
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 18;
    ctx.strokeRect(fx - 10, fy - 140, 20, 140);
    ctx.shadowBlur = 0;

    // Checkered banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', fx, fy - 150);
  }

  private renderBossHealthBar() {
    const ctx = this.ctx;
    const barW = 340;
    const barH = 14;
    const bx = (this.virtualWidth - barW) / 2;
    const by = 24;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW, barH, 4);
    ctx.fill();
    ctx.stroke();

    const pct = Math.max(0, this.bossHealth / this.bossMaxHealth);
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(bx + 2, by + 2, (barW - 4) * pct, barH - 4, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('GLITCH OVERLORD (BOSS)', this.virtualWidth / 2, by - 6);
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
}
