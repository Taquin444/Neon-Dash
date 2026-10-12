import { SpriteAction, CharacterId, WeaponId, CapeId, GadgetId } from '../types/game';

export interface CharacterColorPalette {
  body: string;
  suit: string;
  armor: string;
  glow: string;
  accent: string;
  hair: string;
  weapon: string;
}

export const PALETTES: Record<CharacterId, CharacterColorPalette> = {
  ninja: {
    body: '#00f5d4',
    suit: '#0f172a',
    armor: '#00bbf9',
    glow: '#00f5d4',
    accent: '#f72585',
    hair: '#f72585',
    weapon: '#4cc9f0',
  },
  cat: {
    body: '#f472b6',
    suit: '#1e1b4b',
    armor: '#f43f5e',
    glow: '#f472b6',
    accent: '#ec4899',
    hair: '#fbcfe8',
    weapon: '#fb7185',
  },
  firefox: {
    body: '#f97316',
    suit: '#18181b',
    armor: '#ea580c',
    glow: '#fee440',
    accent: '#f59e0b',
    hair: '#ffedd5',
    weapon: '#f97316',
  },
  robot: {
    body: '#22c55e',
    suit: '#0f172a',
    armor: '#10b981',
    glow: '#22c55e',
    accent: '#06b6d4',
    hair: '#10b981',
    weapon: '#22c55e',
  },
  shadow: {
    body: '#a855f7',
    suit: '#09090b',
    armor: '#7c3aed',
    glow: '#c084fc',
    accent: '#d946ef',
    hair: '#e879f9',
    weapon: '#a855f7',
  },
  bunny: {
    body: '#38bdf8',
    suit: '#0f172a',
    armor: '#0284c7',
    glow: '#38bdf8',
    accent: '#38bdf8',
    hair: '#bae6fd',
    weapon: '#0ea5e9',
  },
  punk: {
    body: '#fee440',
    suit: '#1e1b4b',
    armor: '#7209b7',
    glow: '#fee440',
    accent: '#f72585',
    hair: '#fee440',
    weapon: '#3a86ff',
  },
  valkyrie: {
    body: '#ffffff',
    suit: '#18181b',
    armor: '#e0e7ff',
    glow: '#38bdf8',
    accent: '#fbbf24',
    hair: '#fbbf24',
    weapon: '#60a5fa',
  },
  ronin: {
    body: '#ff0054',
    suit: '#09090b',
    armor: '#27272a',
    glow: '#ff0054',
    accent: '#9e0059',
    hair: '#ff5400',
    weapon: '#ff0054',
  },
};

export class SpriteRenderer {
  private static ninjaSpriteImage: HTMLImageElement | null = null;

  private static getNinjaSpriteImage(): HTMLImageElement | null {
    if (typeof Image === 'undefined') return null;

    if (!this.ninjaSpriteImage) {
      const image = new Image();
      image.src = new URL('../assets/neon-ninja-sprite.png', import.meta.url).href;
      this.ninjaSpriteImage = image;
    }

    return this.ninjaSpriteImage;
  }

  /** Draw the dedicated transparent Neon Ninja art with lightweight action motion. */
  private static renderNinjaSprite(
    ctx: CanvasRenderingContext2D,
    action: SpriteAction,
    animTimer: number
  ): boolean {
    const image = this.getNinjaSpriteImage();
    if (!image?.complete || image.naturalWidth === 0) return false;

    let width = 108;
    let height = 69;
    let bob = 0;
    let rotation = 0;

    switch (action) {
      case 'idle':
        bob = Math.sin(animTimer * 4) * 1.4;
        break;
      case 'run': {
        const stride = animTimer * 14;
        bob = Math.abs(Math.sin(stride)) * 2.5;
        rotation = Math.sin(stride) * 0.025;
        break;
      }
      case 'jump':
        bob = -3;
        rotation = -0.06;
        break;
      case 'fall':
        bob = 2;
        rotation = 0.06;
        break;
      case 'dash':
        width = 116;
        rotation = 0.08;
        break;
      case 'slide':
        width = 98;
        height = 56;
        break;
      case 'hurt':
        rotation = -0.12;
        break;
      default:
        break;
    }

    const left = -width / 2;
    const top = -height + bob;
    ctx.save();

    if (action === 'victory') {
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, -34, 37, 31, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (rotation) ctx.rotate(rotation);
    ctx.drawImage(image, left, top, width, height);

    if (action === 'hurt') {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255, 0, 84, 0.42)';
      ctx.fillRect(left, top, width, height);
      ctx.restore();
    } else if (action === 'shoot') {
      const pulse = 3 + Math.sin(animTimer * 42) * 1.2;
      ctx.fillStyle = '#00f5d4';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(48, -28, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    return true;
  }

  /**
   * Draws the animated player or multiplayer opponent sprite on the 2D canvas.
   */
  public static drawSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: SpriteAction,
    facing: 'left' | 'right',
    charId: CharacterId = 'ninja',
    animTimer: number = 0,
    isInvincible: boolean = false,
    scale: number = 1,
    weaponId: WeaponId = 'katana',
    capeId: CapeId = 'starter_scarf'
  ) {
    const palette = { ...(PALETTES[charId] || PALETTES.ninja) };

    // Apply cape colors
    if (capeId === 'flux_cape') {
      palette.accent = '#00f5d4';
    } else if (capeId === 'shadow_cloak') {
      palette.accent = '#ff0054';
    } else if (capeId === 'quantum_wings') {
      palette.accent = '#fbbf24';
    }

    // Apply weapon colors
    if (weaponId === 'plasma_blaster') palette.weapon = '#38bdf8';
    else if (weaponId === 'dual_blasters') palette.weapon = '#fee440';
    else if (weaponId === 'railgun') palette.weapon = '#f72585';
    else if (weaponId === 'void_scythe') palette.weapon = '#a855f7';

    ctx.save();
    ctx.translate(x, y);

    // Flip horizontally if facing left
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    // Invincibility or Hurt blinking
    if (isInvincible && Math.floor(animTimer * 15) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Afterimage or aura if dashing
    if (action === 'dash') {
      ctx.shadowColor = palette.glow;
      ctx.shadowBlur = 18;
    }

    // The default ninja has a dedicated transparent sprite; keep procedural
    // character rendering as a fallback and for every other gear combination.
    if (
      charId === 'ninja' &&
      weaponId === 'katana' &&
      capeId === 'starter_scarf' &&
      this.renderNinjaSprite(ctx, action, animTimer)
    ) {
      ctx.restore();
      return;
    }

    switch (action) {
      case 'idle':
        this.renderIdle(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      case 'run':
        this.renderRun(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      case 'jump':
        this.renderJump(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      case 'fall':
        this.renderFall(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      case 'dash':
        this.renderDash(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      case 'slide':
        this.renderSlide(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      case 'shoot':
        this.renderShoot(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      case 'hurt':
        this.renderHurt(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      case 'victory':
        this.renderVictory(ctx, palette, charId, animTimer, weaponId, capeId);
        break;
      default:
        this.renderIdle(ctx, palette, charId, animTimer, weaponId, capeId);
    }

    ctx.restore();
  }

  // --- RENDER CHARACTER TAIL / BACK FEATURE ---
  private static renderTailOrBack(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    baseX: number,
    baseY: number,
    isAerodynamic: boolean = false
  ) {
    ctx.save();

    if (charId === 'cat') {
      // Swishing playful cat tail
      const tailWave = Math.sin(t * 8) * (isAerodynamic ? 6 : 12);
      ctx.strokeStyle = p.body;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(baseX - 14, baseY - 6 + tailWave, baseX - 20, baseY - 18 + tailWave * 1.5);
      ctx.quadraticCurveTo(baseX - 22, baseY - 24 + tailWave, baseX - 18, baseY - 26 + tailWave);
      ctx.stroke();

      // White tip of the cat tail
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(baseX - 18, baseY - 26 + tailWave, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (charId === 'firefox') {
      // Big fluffy burning fox tail
      const flameWave = Math.sin(t * 10) * 8;
      ctx.save();
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(baseX - 18, baseY - 12 + flameWave, baseX - 28, baseY - 22 + flameWave);
      ctx.quadraticCurveTo(baseX - 20, baseY - 32 + flameWave, baseX - 8, baseY - 16);
      ctx.closePath();
      ctx.fill();

      // Burning golden flame tip
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(baseX - 18, baseY - 14 + flameWave);
      ctx.lineTo(baseX - 30, baseY - 24 + flameWave);
      ctx.lineTo(baseX - 20, baseY - 28 + flameWave);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (charId === 'bunny') {
      // Fluffy round bunny puff tail
      const bounce = Math.sin(t * 14) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(baseX - 4, baseY - 2 + bounce, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.arc(baseX - 4, baseY - 2 + bounce, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (charId === 'shadow') {
      // Trailing void mist particles
      ctx.save();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
      const mistOffset = Math.sin(t * 12) * 5;
      ctx.beginPath();
      ctx.arc(baseX - 10, baseY - 8 + mistOffset, 8, 0, Math.PI * 2);
      ctx.arc(baseX - 20, baseY - 14 + mistOffset * 1.4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (charId === 'robot') {
      // Robot micro-thruster exhaust vent
      ctx.fillStyle = '#475569';
      ctx.fillRect(baseX - 5, baseY - 6, 6, 8);
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(baseX - 2, baseY - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (charId === 'ronin') {
      // Sheathed dual Katana scabbards across back
      ctx.save();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(baseX + 4, baseY - 18);
      ctx.lineTo(baseX - 16, baseY - 4);
      ctx.stroke();

      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(baseX + 6, baseY - 20);
      ctx.lineTo(baseX + 9, baseY - 23);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // --- RENDER CHARACTER HEAD GEAR / EARS / HAIR / VISOR ---
  private static renderHeadFeatures(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    hx: number,
    hy: number
  ) {
    ctx.save();

    // 1. Base Helmet / Head shape
    ctx.fillStyle = p.armor;
    ctx.beginPath();
    ctx.roundRect(hx - 10, hy - 16, 20, 16, 4);
    ctx.fill();

    // 2. Character-specific ears, horns, or hairstyle
    if (charId === 'cat') {
      // Cute pointy cat ears
      const earTwitch = Math.sin(t * 5) * 1;
      // Left ear
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.moveTo(hx - 9, hy - 16);
      ctx.lineTo(hx - 12, hy - 25 + earTwitch);
      ctx.lineTo(hx - 4, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Left inner ear
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 16);
      ctx.lineTo(hx - 10, hy - 22 + earTwitch);
      ctx.lineTo(hx - 5, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Right ear
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.moveTo(hx + 4, hy - 16);
      ctx.lineTo(hx + 10, hy - 25);
      ctx.lineTo(hx + 9, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Right inner ear
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(hx + 5, hy - 16);
      ctx.lineTo(hx + 8, hy - 22);
      ctx.lineTo(hx + 8, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Visor with cute glowing cat face
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 6;
      ctx.fillRect(hx, hy - 10, 8, 4);

      // Whisker decals
      ctx.strokeStyle = p.glow;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + 1, hy - 5);
      ctx.lineTo(hx + 8, hy - 5);
      ctx.stroke();
    } else if (charId === 'firefox') {
      // Kitsune Fox Ears with flame tips
      const flame = Math.sin(t * 12) * 2;
      // Front ear
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 16);
      ctx.lineTo(hx - 10, hy - 27 + flame);
      ctx.lineTo(hx - 2, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Back ear
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.moveTo(hx + 2, hy - 16);
      ctx.lineTo(hx + 8, hy - 27);
      ctx.lineTo(hx + 9, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Fiery inner glow
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(hx - 7, hy - 16);
      ctx.lineTo(hx - 9, hy - 23 + flame);
      ctx.lineTo(hx - 3, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Visor
      ctx.fillStyle = p.glow;
      ctx.fillRect(hx - 1, hy - 10, 9, 3.5);
    } else if (charId === 'bunny') {
      // Long aerodynamic rabbit ears
      const earFlop = Math.sin(t * 10) * 3;
      // Left tall ear
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.roundRect(hx - 9, hy - 32 + earFlop, 5, 18, 3);
      ctx.fill();

      // Left inner ear
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(hx - 8, hy - 30 + earFlop, 3, 14, 2);
      ctx.fill();

      // Right tall ear (tilted slightly back)
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.roundRect(hx + 3, hy - 30, 5, 16, 3);
      ctx.fill();

      // Visor
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 6;
      ctx.fillRect(hx, hy - 10, 8, 4);
    } else if (charId === 'robot') {
      // Android Antenna & Cyclops Optic
      ctx.fillStyle = '#64748b';
      ctx.fillRect(hx - 2, hy - 24, 3, 9);
      // LED bulb
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(hx - 0.5, hy - 25, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Round Cyclops Eye Visor
      ctx.fillStyle = p.glow;
      ctx.beginPath();
      ctx.arc(hx + 3, hy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (charId === 'shadow') {
      // Spectral horn flames and floating hair
      const wave = Math.sin(t * 8) * 3;
      ctx.fillStyle = p.accent;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy - 16);
      ctx.quadraticCurveTo(hx - 14, hy - 26 + wave, hx - 8, hy - 30 + wave);
      ctx.lineTo(hx - 2, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Glowing twin phantom eye visor
      ctx.fillStyle = p.glow;
      ctx.fillRect(hx, hy - 10, 4, 3);
      ctx.fillRect(hx + 5, hy - 10, 4, 3);
    } else if (charId === 'punk') {
      // Tall jagged neon mohawk
      ctx.fillStyle = p.hair;
      ctx.shadowColor = p.hair;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 16);
      ctx.lineTo(hx - 6, hy - 28);
      ctx.lineTo(hx - 2, hy - 18);
      ctx.lineTo(hx + 2, hy - 26);
      ctx.lineTo(hx + 6, hy - 18);
      ctx.lineTo(hx + 8, hy - 24);
      ctx.lineTo(hx + 9, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Cyber Shades Visor
      ctx.fillStyle = p.glow;
      ctx.fillRect(hx - 2, hy - 10, 10, 4);
    } else if (charId === 'valkyrie') {
      // Celestial Winged Crown
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 16);
      ctx.lineTo(hx - 14, hy - 26);
      ctx.lineTo(hx - 6, hy - 20);
      ctx.lineTo(hx, hy - 27);
      ctx.lineTo(hx + 6, hy - 20);
      ctx.lineTo(hx + 10, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Golden visor
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 8;
      ctx.fillRect(hx, hy - 10, 8, 3.5);
    } else if (charId === 'ronin') {
      // Cyber Kasa Hat & Topknot
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(hx - 16, hy - 16);
      ctx.lineTo(hx, hy - 25);
      ctx.lineTo(hx + 16, hy - 16);
      ctx.closePath();
      ctx.fill();

      // Neon trim on hat
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx - 16, hy - 16);
      ctx.lineTo(hx + 16, hy - 16);
      ctx.stroke();

      // Slit visor underneath hat shadow
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 8;
      ctx.fillRect(hx - 1, hy - 9, 9, 2.5);
    } else {
      // Cyber Ninja spiky cyber hair and headband
      ctx.fillStyle = p.hair;
      ctx.fillRect(hx - 6, hy - 19, 12, 4);
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 16);
      ctx.lineTo(hx - 14, hy - 22);
      ctx.lineTo(hx - 6, hy - 18);
      ctx.closePath();
      ctx.fill();

      // Visor
      ctx.fillStyle = p.glow;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 6;
      ctx.fillRect(hx - 1, hy - 10, 10, 4);
    }

    ctx.restore();
  }

  // --- RENDER CAPE OR WINGS ---
  private static renderCapeOrWings(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    capeId: CapeId,
    t: number,
    baseX: number,
    baseY: number,
    intensity: number = 1
  ) {
    ctx.save();
    const wave = Math.sin(t * 8) * (4 * intensity);

    if (capeId === 'quantum_wings') {
      // Celestial radiant photon wings
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(baseX - 22, baseY - 24 + wave, baseX - 34, baseY - 16 + wave * 1.5);
      ctx.quadraticCurveTo(baseX - 18, baseY - 10, baseX, baseY + 6);
      ctx.closePath();
      ctx.fill();

      // Wing feathers detail
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(baseX - 8, baseY - 6);
      ctx.lineTo(baseX - 26, baseY - 12 + wave);
      ctx.stroke();
    } else if (capeId === 'shadow_cloak') {
      // Dark flowing shadow cloak
      ctx.fillStyle = p.accent;
      ctx.shadowColor = '#ff0054';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(baseX - 24, baseY + 2 + wave, baseX - 32, baseY + 14 + wave * 1.2);
      ctx.quadraticCurveTo(baseX - 18, baseY + 18, baseX, baseY + 8);
      ctx.closePath();
      ctx.fill();
    } else {
      // Standard or Flux Cape ribbon
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(baseX - 22, baseY + 4 + wave, baseX - 30, baseY + 12 + wave * 1.4);
      ctx.quadraticCurveTo(baseX - 20, baseY + 16, baseX, baseY + 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // --- 1. IDLE STATE ---
  private static renderIdle(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    const breathe = Math.sin(t * 4) * 2;

    // Tail / Back
    this.renderTailOrBack(ctx, p, charId, t, -8, -26 + breathe, false);

    // Cape / Scarf
    this.renderCapeOrWings(ctx, p, capeId, t, -6, -40 + breathe, 0.8);

    // Legs / Boots
    ctx.fillStyle = p.suit;
    ctx.fillRect(-10, -22, 7, 22);
    ctx.fillRect(3, -22, 7, 22);

    ctx.fillStyle = p.armor;
    ctx.fillRect(-12, -8, 9, 8);
    ctx.fillRect(3, -8, 9, 8);

    // Torso / Suit
    ctx.fillStyle = p.suit;
    ctx.fillRect(-12, -42 + breathe, 24, 22);

    // Chest Armor & Core
    ctx.fillStyle = p.armor;
    ctx.fillRect(-9, -40 + breathe, 18, 14);

    ctx.fillStyle = p.glow;
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -32 + breathe, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Arms
    ctx.fillStyle = p.armor;
    ctx.fillRect(-15, -39 + breathe, 4, 16);
    ctx.fillRect(11, -39 + breathe, 4, 16);

    // Weapon sheathed on side
    if (weaponId === 'katana' || weaponId === 'void_scythe') {
      ctx.save();
      ctx.strokeStyle = p.weapon;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, -26 + breathe);
      ctx.lineTo(-14, -14 + breathe);
      ctx.stroke();
      ctx.restore();
    }

    // Head
    this.renderHeadFeatures(ctx, p, charId, t, 0, -40 + breathe);
  }

  // --- 2. RUN STATE (Dynamic 8-step cycle) ---
  private static renderRun(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    const cycle = (t * 14) % (Math.PI * 2);
    const legSwing = Math.sin(cycle);
    const bob = Math.abs(Math.sin(cycle)) * 4;
    const armSwing = -legSwing;

    // Running dust particles
    if (Math.random() < 0.25) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(-14 + Math.random() * 4, -2, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tail / Back Feature
    this.renderTailOrBack(ctx, p, charId, t, -10, -28 + bob, true);

    // Cape trailing horizontally
    this.renderCapeOrWings(ctx, p, capeId, t * 1.5, -6, -42 + bob, 1.6);

    ctx.save();
    ctx.rotate(0.12); // Forward lean

    // Back Leg
    ctx.save();
    ctx.translate(0, -22 + bob);
    ctx.rotate(-legSwing * 0.7);
    ctx.fillStyle = p.suit;
    ctx.fillRect(-4, 0, 7, 22);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-5, 14, 9, 8);
    ctx.restore();

    // Torso
    ctx.fillStyle = p.suit;
    ctx.fillRect(-12, -44 + bob, 24, 24);

    ctx.fillStyle = p.armor;
    ctx.fillRect(-9, -42 + bob, 18, 16);

    // Core Reactor
    ctx.fillStyle = p.glow;
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -33 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Front Leg
    ctx.save();
    ctx.translate(0, -22 + bob);
    ctx.rotate(legSwing * 0.7);
    ctx.fillStyle = p.suit;
    ctx.fillRect(-3, 0, 7, 22);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-4, 14, 9, 8);
    ctx.restore();

    // Arms
    ctx.save();
    ctx.translate(-8, -38 + bob);
    ctx.rotate(-armSwing * 0.6);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-2, 0, 5, 16);
    ctx.restore();

    ctx.save();
    ctx.translate(8, -38 + bob);
    ctx.rotate(armSwing * 0.6);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-2, 0, 5, 16);
    ctx.restore();

    // Head
    this.renderHeadFeatures(ctx, p, charId, t, 1, -41 + bob);

    ctx.restore();
  }

  // --- 3. JUMP STATE (Aerial Tuck) ---
  private static renderJump(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    // Jet thruster flames under boots
    const flameH = 8 + Math.random() * 8;
    ctx.fillStyle = p.glow;
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-7, -8 + flameH);
    ctx.lineTo(-4, -8);
    ctx.moveTo(4, -8);
    ctx.lineTo(7, -8 + flameH);
    ctx.lineTo(10, -8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Tail
    this.renderTailOrBack(ctx, p, charId, t, -10, -28, true);

    // Cape trailing down
    this.renderCapeOrWings(ctx, p, capeId, t, -6, -42, 1.2);

    // Tucked Legs
    ctx.fillStyle = p.suit;
    ctx.fillRect(-10, -26, 7, 16);
    ctx.fillRect(3, -26, 7, 16);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-12, -12, 9, 7);
    ctx.fillRect(3, -12, 9, 7);

    // Torso
    ctx.fillStyle = p.suit;
    ctx.fillRect(-11, -44, 22, 20);

    ctx.fillStyle = p.armor;
    ctx.fillRect(-8, -42, 16, 13);
    ctx.fillStyle = p.glow;
    ctx.beginPath();
    ctx.arc(0, -34, 3, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.fillStyle = p.armor;
    ctx.fillRect(-15, -46, 5, 14);
    ctx.fillRect(10, -48, 5, 14);

    // Head
    this.renderHeadFeatures(ctx, p, charId, t, 1, -42);
  }

  // --- 4. FALL STATE ---
  private static renderFall(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    // Tail
    this.renderTailOrBack(ctx, p, charId, t, -8, -26, false);

    // Cape fluttering up
    ctx.save();
    ctx.fillStyle = p.accent;
    const wave = Math.sin(t * 16) * 5;
    ctx.beginPath();
    ctx.moveTo(-6, -42);
    ctx.quadraticCurveTo(-18, -60 + wave, -24, -75);
    ctx.lineTo(-18, -75);
    ctx.quadraticCurveTo(-12, -56, -4, -40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Legs
    ctx.fillStyle = p.suit;
    ctx.fillRect(-10, -22, 6, 20);
    ctx.fillRect(4, -22, 6, 20);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-11, -4, 8, 8);
    ctx.fillRect(3, -4, 8, 8);

    // Torso
    ctx.fillStyle = p.suit;
    ctx.fillRect(-11, -43, 22, 22);

    ctx.fillStyle = p.armor;
    ctx.fillRect(-8, -41, 16, 14);

    // Arms outstretched
    ctx.fillStyle = p.armor;
    ctx.fillRect(-17, -40, 6, 15);
    ctx.fillRect(11, -40, 6, 15);

    // Head
    this.renderHeadFeatures(ctx, p, charId, t, 1, -39);
  }

  // --- 5. DASH / BOOST STATE ---
  private static renderDash(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    // Speed Trails
    ctx.save();
    ctx.strokeStyle = p.glow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-40, -25);
    ctx.lineTo(-15, -25);
    ctx.moveTo(-35, -15);
    ctx.lineTo(-10, -15);
    ctx.stroke();
    ctx.restore();

    // Tail
    this.renderTailOrBack(ctx, p, charId, t, -12, -24, true);

    // Cape trailing flat
    ctx.fillStyle = p.accent;
    ctx.fillRect(-35, -26, 25, 6);

    ctx.save();
    ctx.rotate(0.35); // Heavy forward supersonic tilt

    // Torso & Legs
    ctx.fillStyle = p.suit;
    ctx.fillRect(-22, -32, 34, 18);

    ctx.fillStyle = p.armor;
    ctx.fillRect(-18, -30, 26, 14);

    ctx.fillStyle = p.suit;
    ctx.fillRect(-32, -28, 14, 10);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-38, -26, 8, 8);

    // Extended Forward Arm
    ctx.fillStyle = p.armor;
    ctx.fillRect(8, -28, 18, 6);

    // Head
    this.renderHeadFeatures(ctx, p, charId, t, 4, -22);

    ctx.restore();
  }

  // --- 6. SLIDE STATE ---
  private static renderSlide(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    // Ground Friction Sparks
    ctx.fillStyle = p.glow;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(-20 - Math.random() * 15, -1 - Math.random() * 3, 3, 3);
    }

    // Tail
    this.renderTailOrBack(ctx, p, charId, t, -18, -14, true);

    // Flattened crouch pose
    ctx.fillStyle = p.suit;
    ctx.fillRect(-20, -16, 38, 14);

    ctx.fillStyle = p.armor;
    ctx.fillRect(-16, -18, 28, 12);

    // Sliding Leg extended forward
    ctx.fillStyle = p.suit;
    ctx.fillRect(14, -12, 16, 8);
    ctx.fillStyle = p.armor;
    ctx.fillRect(26, -10, 8, 8);

    // Head lowered
    this.renderHeadFeatures(ctx, p, charId, t, 4, -8);
  }

  // --- 7. SHOOT / ATTACK STATE ---
  private static renderShoot(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    this.renderRun(ctx, p, charId, t, weaponId, capeId);

    // Weapon Muzzle Flare
    ctx.save();
    ctx.translate(18, -38);
    ctx.fillStyle = p.weapon;
    ctx.shadowColor = p.weapon;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(4, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Weapon Barrel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-4, -3, 8, 6);
    ctx.restore();
  }

  // --- 8. HURT STATE ---
  private static renderHurt(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    ctx.save();
    ctx.rotate(-0.25); // Knocked back

    // Red tint flash
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-14, -44, 28, 44);

    // Visor glitch
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -48, 14, 4);

    ctx.restore();
  }

  // --- 9. VICTORY STATE ---
  private static renderVictory(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    weaponId: WeaponId,
    capeId: CapeId
  ) {
    const cheer = Math.sin(t * 8) * 3;

    // Victory Aura ring
    ctx.save();
    ctx.strokeStyle = p.glow;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(0, -35, 26, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Tail
    this.renderTailOrBack(ctx, p, charId, t, -8, -26, false);

    // Legs
    ctx.fillStyle = p.suit;
    ctx.fillRect(-10, -22, 7, 22);
    ctx.fillRect(3, -22, 7, 22);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-12, -8, 9, 8);
    ctx.fillRect(3, -8, 9, 8);

    // Torso
    ctx.fillStyle = p.suit;
    ctx.fillRect(-12, -44, 24, 24);
    ctx.fillStyle = p.armor;
    ctx.fillRect(-9, -42, 18, 16);

    // Raised Victory V-arms
    ctx.fillStyle = p.armor;
    ctx.fillRect(-18, -56 + cheer, 5, 18);
    ctx.fillRect(13, -56 + cheer, 5, 18);

    // Head
    this.renderHeadFeatures(ctx, p, charId, t, 0, -42);
  }

  // ==========================================
  // --- VEHICLES & MOUNTED SPRITE RENDERING ---
  // ==========================================

  public static renderVehicle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    vehicleId?: string,
    charId: CharacterId = 'ninja',
    animTimer: number = 0,
    isBoosting: boolean = false,
    facing: 'left' | 'right' = 'right',
    isAirborne: boolean = false,
    capeId: CapeId = 'starter_scarf'
  ) {
    if (!vehicleId || vehicleId === 'none') return;

    ctx.save();
    ctx.translate(x, y);

    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    const palette = { ...(PALETTES[charId] || PALETTES.ninja) };

    switch (vehicleId) {
      case 'hoverbike':
        this.renderHoverbike(ctx, palette, charId, animTimer, isBoosting, isAirborne, capeId);
        break;
      case 'cyber_car':
        this.renderCyberCar(ctx, palette, charId, animTimer, isBoosting, isAirborne, capeId);
        break;
      case 'spaceship':
        this.renderSpaceship(ctx, palette, charId, animTimer, isBoosting, isAirborne, capeId);
        break;
      case 'cyber_truck':
        this.renderCyberTruck(ctx, palette, charId, animTimer, isBoosting, isAirborne, capeId);
        break;
    }

    ctx.restore();
  }

  // 1. NEON PULSE HOVERBIKE
  private static renderHoverbike(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    boosting: boolean,
    airborne: boolean,
    capeId: CapeId
  ) {
    const hoverY = airborne ? -12 : Math.sin(t * 14) * 3 - 6;
    const tilt = airborne ? -0.12 : Math.sin(t * 10) * 0.03;

    ctx.save();
    ctx.translate(0, hoverY);
    ctx.rotate(tilt);

    // Ground levitation underglow
    ctx.save();
    ctx.fillStyle = boosting ? 'rgba(247, 37, 133, 0.35)' : 'rgba(0, 245, 212, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 46, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Rear Jet Thruster Fire
    const flameLen = boosting ? 36 + Math.sin(t * 40) * 12 : 20 + Math.sin(t * 30) * 6;
    ctx.save();
    ctx.fillStyle = boosting ? '#f72585' : '#00f5d4';
    ctx.shadowColor = boosting ? '#f72585' : '#00f5d4';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(-42, 6);
    ctx.lineTo(-42 - flameLen, 9);
    ctx.lineTo(-42, 13);
    ctx.closePath();
    ctx.fill();

    // Inner core flame
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-42, 7.5);
    ctx.lineTo(-42 - flameLen * 0.55, 9.5);
    ctx.lineTo(-42, 11.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Rear Hubless Wheel
    this.renderHublessWheel(ctx, -30, 8, 14, t * 16, boosting ? '#f72585' : '#00f5d4');

    // Front Hubless Wheel
    this.renderHublessWheel(ctx, 32, 8, 14, t * 16, '#00f5d4');

    // Bike Chassis (Aerodynamic Cyber Frame)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-36, 12);
    ctx.lineTo(-24, -2);
    ctx.lineTo(8, -8);
    ctx.lineTo(34, 0);
    ctx.lineTo(40, 10);
    ctx.lineTo(20, 16);
    ctx.lineTo(-26, 16);
    ctx.closePath();
    ctx.fill();

    // Cyber Body Plating & Decals
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(6, -6);
    ctx.lineTo(26, 0);
    ctx.lineTo(12, 8);
    ctx.lineTo(-12, 8);
    ctx.closePath();
    ctx.fill();

    // Glowing Neon Circuit Accent Line
    ctx.strokeStyle = boosting ? '#f72585' : '#00f5d4';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = boosting ? '#f72585' : '#00f5d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-32, 8);
    ctx.lineTo(-14, 2);
    ctx.lineTo(12, -4);
    ctx.lineTo(32, 4);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Windshield visor
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(14, -8);
    ctx.lineTo(28, -20);
    ctx.lineTo(34, -8);
    ctx.closePath();
    ctx.fill();

    // Handlebars
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, -4);
    ctx.lineTo(16, -14);
    ctx.lineTo(20, -14);
    ctx.stroke();

    // --- Pilot Crouched on Hoverbike ---
    // Billowing Scarf / Cape
    this.renderCapeOrWings(ctx, p, capeId, t, -12, -26, 1.4);

    // Torso (Leaning forward aggressively)
    ctx.fillStyle = p.suit;
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.lineTo(4, -18);
    ctx.lineTo(8, -8);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = p.armor;
    ctx.fillRect(-10, -18, 14, 10);

    // Legs gripping bike
    ctx.fillStyle = p.suit;
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(-2, 8);
    ctx.lineTo(6, 8);
    ctx.lineTo(0, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.armor;
    ctx.fillRect(0, 6, 8, 4);

    // Arms reaching to handlebars
    ctx.fillStyle = p.armor;
    ctx.beginPath();
    ctx.moveTo(2, -14);
    ctx.lineTo(16, -13);
    ctx.lineTo(18, -10);
    ctx.lineTo(4, -8);
    ctx.closePath();
    ctx.fill();

    // Pilot Head (lowered aerodynamic tuck)
    this.renderHeadFeatures(ctx, p, charId, t, 6, -18);

    ctx.restore();
  }

  // 2. APEX NEON INTERCEPTOR (CYBER SPORTS CAR)
  private static renderCyberCar(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    boosting: boolean,
    airborne: boolean,
    capeId: CapeId
  ) {
    const carY = airborne ? -14 : Math.sin(t * 18) * 1.5 - 4;

    ctx.save();
    ctx.translate(0, carY);

    // Neon Underglow Aura illuminating the pavement
    ctx.save();
    ctx.fillStyle = boosting ? 'rgba(247, 37, 133, 0.45)' : 'rgba(114, 9, 183, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 58, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Twin Exhaust Flames
    const exhaustLen = boosting ? 40 + Math.sin(t * 50) * 14 : 22 + Math.sin(t * 35) * 8;
    ctx.save();
    ctx.fillStyle = '#ff5400';
    ctx.shadowColor = '#fee440';
    ctx.shadowBlur = 12;
    // Lower exhaust
    ctx.beginPath();
    ctx.moveTo(-46, 10);
    ctx.lineTo(-46 - exhaustLen, 12);
    ctx.lineTo(-46, 14);
    ctx.closePath();
    ctx.fill();
    // Upper exhaust
    ctx.beginPath();
    ctx.moveTo(-46, 3);
    ctx.lineTo(-46 - exhaustLen * 0.9, 5);
    ctx.lineTo(-46, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Wheels (4-wheel cyber low profile, 2 visible in profile)
    this.renderCarWheel(ctx, -32, 12, 13, t * 18, '#f72585');
    this.renderCarWheel(ctx, 34, 12, 13, t * 18, '#00f5d4');

    // Supercar Lower Skirt & Diffuser
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-44, 12, 88, 6);

    // Main Sleek Aerodynamic Body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-46, 12);
    ctx.lineTo(-46, 0);
    ctx.lineTo(-24, -4);
    ctx.lineTo(-10, -18); // windshield base to roof
    ctx.lineTo(14, -18); // roof
    ctx.lineTo(34, -4);  // hood
    ctx.lineTo(52, 4);   // front nose splitter
    ctx.lineTo(52, 12);
    ctx.closePath();
    ctx.fill();

    // High Rear Spoiler Wing
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(-48, -14);
    ctx.lineTo(-32, -14);
    ctx.lineTo(-34, -10);
    ctx.lineTo(-48, -10);
    ctx.closePath();
    ctx.fill();
    // Spoiler struts
    ctx.fillStyle = '#475569';
    ctx.fillRect(-44, -10, 3, 10);
    ctx.fillRect(-36, -10, 3, 8);

    // Side Accent Panels & Body Lines
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-20, 2);
    ctx.lineTo(24, 0);
    ctx.lineTo(38, 8);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fill();

    // Glowing Neon Cyber Striping
    ctx.strokeStyle = boosting ? '#fee440' : '#f72585';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = boosting ? '#fee440' : '#f72585';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-44, 2);
    ctx.lineTo(-22, -2);
    ctx.lineTo(26, -2);
    ctx.lineTo(50, 6);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cockpit Tinted Glass Canopy
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-8, -16);
    ctx.lineTo(12, -16);
    ctx.lineTo(26, -4);
    ctx.lineTo(-16, -4);
    ctx.closePath();
    ctx.fill();

    // Front Headlight Projection
    ctx.fillStyle = '#00f5d4';
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 8;
    ctx.fillRect(46, 3, 6, 4);
    ctx.shadowBlur = 0;

    // Kinetic Ram Bumper Shield on Front
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(52, 8, 8, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Pilot silhouette visible in cockpit
    ctx.save();
    ctx.fillStyle = p.suit;
    ctx.beginPath();
    ctx.arc(2, -10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.glow;
    ctx.fillRect(4, -11, 4, 2);
    ctx.restore();

    ctx.restore();
  }

  // 3. QUANTUM SKY-STRIKER (VTOL SPACESHIP)
  private static renderSpaceship(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    boosting: boolean,
    airborne: boolean,
    capeId: CapeId
  ) {
    const shipY = -18 + Math.sin(t * 10) * 5;
    const tilt = airborne ? -0.15 : Math.sin(t * 8) * 0.05;

    ctx.save();
    ctx.translate(0, shipY);
    ctx.rotate(tilt);

    // Rear Main Ion Thruster Flame
    const ionLen = boosting ? 45 + Math.sin(t * 45) * 15 : 28 + Math.sin(t * 30) * 8;
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-40, -4);
    ctx.lineTo(-40 - ionLen, 0);
    ctx.lineTo(-40, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-40, -2);
    ctx.lineTo(-40 - ionLen * 0.55, 0);
    ctx.lineTo(-40, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Bottom VTOL Lift Jets firing downwards
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-16, 10);
    ctx.lineTo(-14, 26 + Math.sin(t * 30) * 6);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(14, 10);
    ctx.lineTo(16, 26 + Math.sin(t * 30) * 6);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Swept-Back Delta Wings (Bottom/Far Layer)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(-28, -2);
    ctx.lineTo(-12, 18);
    ctx.lineTo(16, 14);
    ctx.lineTo(8, -2);
    ctx.closePath();
    ctx.fill();

    // Plasma Wingtip Stabilizers
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillRect(-14, 16, 16, 3);
    ctx.shadowBlur = 0;

    // Main Aerodyne Fuselage
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-38, 2);
    ctx.lineTo(-24, -10);
    ctx.lineTo(10, -12);
    ctx.lineTo(44, -2); // nose tip
    ctx.lineTo(44, 4);
    ctx.lineTo(12, 10);
    ctx.lineTo(-38, 6);
    ctx.closePath();
    ctx.fill();

    // Metallic Titanium Plating
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-20, -6);
    ctx.lineTo(8, -8);
    ctx.lineTo(28, 0);
    ctx.lineTo(6, 6);
    ctx.lineTo(-16, 4);
    ctx.closePath();
    ctx.fill();

    // Neon Circuit Trim
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(4, -4);
    ctx.lineTo(38, 0);
    ctx.stroke();

    // Twin Plasma Laser Cannons under Nose
    ctx.fillStyle = '#f72585';
    ctx.fillRect(32, 5, 14, 3);
    ctx.fillRect(32, 9, 14, 3);
    ctx.fillStyle = '#fee440';
    ctx.shadowColor = '#fee440';
    ctx.shadowBlur = 8;
    ctx.fillRect(44, 5, 4, 3);
    ctx.fillRect(44, 9, 4, 3);
    ctx.shadowBlur = 0;

    // Cockpit Glass Canopy
    ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-2, -14);
    ctx.lineTo(20, -12);
    ctx.lineTo(26, -2);
    ctx.lineTo(2, -2);
    ctx.closePath();
    ctx.fill();

    // Pilot visible in cockpit
    ctx.save();
    ctx.fillStyle = p.suit;
    ctx.beginPath();
    ctx.arc(10, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.glow;
    ctx.fillRect(12, -7, 4, 2);
    ctx.restore();

    ctx.restore();
  }

  // 4. TITAN HEAVY WAR-RIG (CYBER TRUCK)
  private static renderCyberTruck(
    ctx: CanvasRenderingContext2D,
    p: CharacterColorPalette,
    charId: CharacterId,
    t: number,
    boosting: boolean,
    airborne: boolean,
    capeId: CapeId
  ) {
    const truckY = airborne ? -10 : Math.sin(t * 16) * 1.5 - 2;

    ctx.save();
    ctx.translate(0, truckY);

    // Ground shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 56, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6 Armored High-Traction Wheels (3 in profile)
    this.renderCarWheel(ctx, -34, 14, 13, t * 16, '#fee440');
    this.renderCarWheel(ctx, -10, 14, 13, t * 16, '#fee440');
    this.renderCarWheel(ctx, 32, 14, 13, t * 16, '#fee440');

    // Heavy Fortified Chassis
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-46, -4, 92, 18);

    // Armored Cab & Cargo Vault
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-46, -4);
    ctx.lineTo(-46, -24);
    ctx.lineTo(8, -24);
    ctx.lineTo(24, -8); // Windshield slope
    ctx.lineTo(46, -8); // Extended heavy hood
    ctx.lineTo(46, 12);
    ctx.lineTo(-46, 12);
    ctx.closePath();
    ctx.fill();

    // Hazard Stripes on Lower Side
    ctx.fillStyle = '#fee440';
    for (let hx = -40; hx < 36; hx += 16) {
      ctx.beginPath();
      ctx.moveTo(hx, 6);
      ctx.lineTo(hx + 6, 0);
      ctx.lineTo(hx + 11, 0);
      ctx.lineTo(hx + 5, 6);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy Front Ram Plow / Bumper
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(46, -8);
    ctx.lineTo(54, -2);
    ctx.lineTo(54, 16);
    ctx.lineTo(44, 16);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fee440';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(52, 0);
    ctx.lineTo(52, 14);
    ctx.stroke();

    // Reinforced Fortified Windshield
    ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.beginPath();
    ctx.moveTo(10, -20);
    ctx.lineTo(20, -10);
    ctx.lineTo(8, -10);
    ctx.closePath();
    ctx.fill();

    // Roof-Mounted Rotating Sensor Beacon
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -28, 12, 4);
    const beaconCol = Math.sin(t * 12) > 0 ? '#ef4444' : '#fee440';
    ctx.fillStyle = beaconCol;
    ctx.shadowColor = beaconCol;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -30, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Twin Smoke Stacks
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-38, -32, 5, 16);
    ctx.fillRect(-30, -32, 5, 16);

    ctx.restore();
  }

  // Wheel Rendering Helpers
  private static renderHublessWheel(
    ctx: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    radius: number,
    spin: number,
    glowCol: string
  ) {
    ctx.save();
    ctx.translate(wx, wy);

    // Glowing Neon Ring
    ctx.strokeStyle = glowCol;
    ctx.lineWidth = 3;
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner rim
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Hubless Hollow Center Hole
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Rotating energy spokes
    ctx.strokeStyle = glowCol;
    ctx.lineWidth = 1.5;
    for (let a = 0; a < 3; a++) {
      const angle = spin + (a * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (radius * 0.55), Math.sin(angle) * (radius * 0.55));
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static renderCarWheel(
    ctx: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    radius: number,
    spin: number,
    rimCol: string
  ) {
    ctx.save();
    ctx.translate(wx, wy);

    // Outer Tire
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner Alloy Rim
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Neon Rim Edge
    ctx.strokeStyle = rimCol;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = rimCol;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Spinning Spokes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    for (let a = 0; a < 4; a++) {
      const angle = spin + (a * Math.PI * 2) / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (radius - 4), Math.sin(angle) * (radius - 4));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================
  // --- GADGET COMPANIONS & EQUIPMENT RENDERING ---
  // ==========================================

  public static renderGadgetCompanion(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    gadgetId?: GadgetId,
    animTimer: number = 0,
    isThrusting: boolean = false,
    isFiring: boolean = false,
    facing: 'left' | 'right' = 'right'
  ) {
    if (!gadgetId) return;

    ctx.save();

    if (gadgetId === 'combat_drone') {
      const droneX = playerX + (facing === 'right' ? -46 : 46);
      const droneY = playerY - 48 + Math.sin(animTimer * 6) * 6;
      this.renderCombatDrone(ctx, droneX, droneY, animTimer, isFiring, facing);
    } else if (gadgetId === 'med_cross') {
      const crossX = playerX + (facing === 'right' ? -38 : 38);
      const crossY = playerY - 42 + Math.sin(animTimer * 5) * 5;
      this.renderNanoMedCross(ctx, crossX, crossY, animTimer);
    } else if (gadgetId === 'quantum_jetpack') {
      this.renderJetpack(ctx, playerX, playerY, animTimer, isThrusting, facing);
    } else if (gadgetId === 'sprint_boots') {
      this.renderSprintBoots(ctx, playerX, playerY, animTimer, isThrusting, facing);
    } else if (gadgetId === 'graviton_magnet') {
      const magX = playerX + (facing === 'right' ? -36 : 36);
      const magY = playerY - 36 + Math.sin(animTimer * 7) * 4;
      this.renderGravitonMagnet(ctx, magX, magY, animTimer);
    }

    ctx.restore();
  }

  // 1. TACTICAL COMBAT DRONE
  public static renderCombatDrone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    t: number,
    firing: boolean,
    facing: 'left' | 'right'
  ) {
    ctx.save();
    ctx.translate(x, y);
    if (facing === 'left') ctx.scale(-1, 1);

    // Rotating Anti-Grav Ring
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 6 + Math.sin(t * 12) * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Drone Core Body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Central Glowing Sensor Eye
    ctx.fillStyle = '#f72585';
    ctx.shadowColor = '#f72585';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(3, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Laser Turret underneath
    ctx.fillStyle = '#475569';
    ctx.fillRect(2, 6, 8, 3);

    // Firing Muzzle Flash & Laser Beam
    if (firing) {
      ctx.fillStyle = '#00f5d4';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(12, 7.5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Laser trace beam pointing forward-down
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, 7.5);
      ctx.lineTo(70, 18);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // 2. NANO-MED REVIVE CROSS
  public static renderNanoMedCross(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    t: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Orbiting Holographic Data Ring
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 18, t * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Radiating Emerald Aura
    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 16 + Math.sin(t * 8) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Glowing Holographic Medical Cross
    ctx.save();
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 14;

    // Vertical bar
    ctx.fillRect(-3.5, -11, 7, 22);
    // Horizontal bar
    ctx.fillRect(-11, -3.5, 22, 7);

    // Bright White Core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -9, 4, 18);
    ctx.fillRect(-9, -2, 18, 4);

    ctx.restore();

    ctx.restore();
  }

  // 3. QUANTUM JETPACK (BACKPACK MOUNT)
  public static renderJetpack(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    t: number,
    thrusting: boolean,
    facing: 'left' | 'right'
  ) {
    ctx.save();
    ctx.translate(x, y);
    if (facing === 'left') ctx.scale(-1, 1);

    // Jetpack position on player's back
    const jx = -14;
    const jy = -34;

    // Twin Cylinders
    ctx.fillStyle = '#334155';
    ctx.fillRect(jx - 4, jy, 6, 16);
    ctx.fillRect(jx + 3, jy, 6, 16);

    ctx.fillStyle = '#475569';
    ctx.fillRect(jx - 3, jy + 2, 4, 12);
    ctx.fillRect(jx + 4, jy + 2, 4, 12);

    // Nozzles
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(jx - 5, jy + 16, 8, 4);
    ctx.fillRect(jx + 2, jy + 16, 8, 4);

    // Thrust flames when boosting
    if (thrusting) {
      const flameH = 22 + Math.sin(t * 40) * 8;
      ctx.fillStyle = '#ff5400';
      ctx.shadowColor = '#fee440';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(jx - 5, jy + 20);
      ctx.lineTo(jx - 1, jy + 20 + flameH);
      ctx.lineTo(jx + 3, jy + 20);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(jx + 2, jy + 20);
      ctx.lineTo(jx + 6, jy + 20 + flameH);
      ctx.lineTo(jx + 10, jy + 20);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // 4. HYPER SPRINT BOOTS
  public static renderSprintBoots(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    t: number,
    isMoving: boolean,
    facing: 'left' | 'right'
  ) {
    ctx.save();
    ctx.translate(x, y);
    if (facing === 'left') ctx.scale(-1, 1);

    // Electric cyan arcs around boots
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(-4, -2);
    ctx.lineTo(-12, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(10, -2);
    ctx.lineTo(2, 0);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // 5. GRAVITON ATTRACTOR MAGNET
  public static renderGravitonMagnet(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    t: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Orbiting electromagnetic field wave
    ctx.strokeStyle = 'rgba(254, 228, 64, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + Math.sin(t * 10) * 4, 0, Math.PI * 2);
    ctx.stroke();

    // Magnet Horseshoe / Core
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 10, Math.PI, 0, false);
    ctx.lineTo(10, 8);
    ctx.lineTo(5, 8);
    ctx.lineTo(5, 0);
    ctx.arc(0, 0, 5, 0, Math.PI, true);
    ctx.lineTo(-5, 8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();

    // Magnet Poles (Silver tips)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-10, 4, 5, 4);
    ctx.fillRect(5, 4, 5, 4);

    // Electric sparks
    ctx.strokeStyle = '#fee440';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(2, 6);
    ctx.stroke();

    ctx.restore();
  }
}
