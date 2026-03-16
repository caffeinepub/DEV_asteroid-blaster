import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSubmitScore, useTopScores } from "../hooks/useQueries";

// ─── Audio Manager ───────────────────────────────────────────────────────────

class AudioManager {
  private ctx: AudioContext | null = null;
  private thrustNode: { osc: OscillatorNode; gain: GainNode } | null = null;
  private ufoNode: {
    osc: OscillatorNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
    masterGain: GainNode;
  } | null = null;

  private getCtx(): AudioContext | null {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  shoot() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  explodeLarge() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.4);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      source.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      source.start();
      source.stop(ctx.currentTime + 0.4);
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumble.type = "sawtooth";
      rumble.frequency.setValueAtTime(60, ctx.currentTime);
      rumble.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.4);
      rumbleGain.gain.setValueAtTime(0.25, ctx.currentTime);
      rumbleGain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.4,
      );
      rumble.connect(rumbleGain);
      rumbleGain.connect(ctx.destination);
      rumble.start();
      rumble.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  explodeSmall() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.2);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      source.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  startThrust() {
    if (this.thrustNode) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      this.thrustNode = { osc, gain };
    } catch {}
  }

  stopThrust() {
    if (!this.thrustNode) return;
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const { osc, gain } = this.thrustNode;
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
    this.thrustNode = null;
  }

  startUfo() {
    if (this.ufoNode) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const masterGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(8, ctx.currentTime);
      lfoGain.gain.setValueAtTime(80, ctx.currentTime);
      masterGain.gain.setValueAtTime(0.09, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(masterGain);
      masterGain.connect(ctx.destination);
      lfo.start();
      osc.start();
      this.ufoNode = { osc, lfo, lfoGain, masterGain };
    } catch {}
  }

  stopUfo() {
    if (!this.ufoNode) return;
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const { osc, lfo, masterGain } = this.ufoNode;
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.stop(ctx.currentTime + 0.12);
      lfo.stop(ctx.currentTime + 0.12);
    } catch {}
    this.ufoNode = null;
  }

  powerupCollect() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const freqs = [523, 659, 784];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(
          0.12,
          ctx.currentTime + i * 0.08 + 0.01,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.08 + 0.1,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.12);
      });
    } catch {}
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Vec2 = { x: number; y: number };

type Ship = {
  pos: Vec2;
  vel: Vec2;
  angle: number;
  thrusting: boolean;
  invincible: number;
  flashTimer: number;
};

type Asteroid = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  size: "large" | "medium" | "small";
  radius: number;
  angle: number;
  spin: number;
  shape: Vec2[];
};

type Bullet = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  life: number;
};

type Particle = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type DebrisLine = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  angle: number;
  spin: number;
  length: number;
  life: number;
  maxLife: number;
  color: string;
};

type UFO = {
  pos: Vec2;
  vel: Vec2;
  size: "large" | "small";
  radius: number;
  shootTimer: number;
  waveOffset: number;
  waveAmplitude: number;
  bullets: Bullet[];
};

type PowerUp = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  type: "shield" | "spread";
  life: number;
};

type Shockwave = {
  pos: Vec2;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
};

type NebulaBlob = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  r: number;
  g: number;
  b: number;
};

type Star = { x: number; y: number; r: number; brightness: number };

type GameState = {
  phase: "start" | "playing" | "gameover";
  score: number;
  lives: number;
  level: number;
  ship: Ship;
  asteroids: Asteroid[];
  bullets: Bullet[];
  particles: Particle[];
  debrisLines: DebrisLine[];
  stars: Star[];
  nebulas: NebulaBlob[];
  nextId: number;
  keys: Set<string>;
  shootCooldown: number;
  levelTransition: boolean;
  levelTimer: number;
  ufo: UFO | null;
  ufoTimer: number;
  powerUps: PowerUp[];
  shieldActive: number;
  spreadShotActive: number;
  combo: number;
  comboTimer: number;
  screenShake: number;
  shockwave: Shockwave | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SHIP_SIZE = 18;
const SHIP_SPEED = 220;
const SHIP_ROTATE_SPEED = 3.5;
const SHIP_FRICTION = 0.985;
const BULLET_SPEED = 520;
const BULLET_LIFE = 1.2;
const SHOOT_COOLDOWN = 0.22;
const INVINCIBILITY_TIME = 180;
const ASTEROID_RADII = { large: 48, medium: 28, small: 14 };
const SCORE_MAP = { small: 100, medium: 50, large: 20 };
const STAR_COUNT = 160;
const POWERUP_CHANCE = 0.1;
const POWERUP_LIFE = 8;
const SHIELD_DURATION = 5;
const SPREAD_DURATION = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomShape(radius: number, sides: number): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const r = radius * (0.75 + Math.random() * 0.45);
    pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return pts;
}

function makeAsteroid(
  id: number,
  size: "large" | "medium" | "small",
  pos: Vec2,
  vel?: Vec2,
): Asteroid {
  const radius = ASTEROID_RADII[size];
  const speed =
    size === "large"
      ? 45 + Math.random() * 30
      : size === "medium"
        ? 70 + Math.random() * 40
        : 100 + Math.random() * 60;
  const angle = Math.random() * Math.PI * 2;
  return {
    id,
    pos: { ...pos },
    vel: vel ?? { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
    size,
    radius,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.2,
    shape: randomShape(radius, 9 + Math.floor(Math.random() * 4)),
  };
}

function spawnAsteroidsForLevel(
  level: number,
  w: number,
  h: number,
  nextId: number,
): { asteroids: Asteroid[]; nextId: number } {
  const count = 3 + level;
  const asteroids: Asteroid[] = [];
  let id = nextId;
  for (let i = 0; i < count; i++) {
    const edge = Math.floor(Math.random() * 4);
    let x: number;
    let y: number;
    if (edge === 0) {
      x = Math.random() * w;
      y = -60;
    } else if (edge === 1) {
      x = w + 60;
      y = Math.random() * h;
    } else if (edge === 2) {
      x = Math.random() * w;
      y = h + 60;
    } else {
      x = -60;
      y = Math.random() * h;
    }
    asteroids.push(makeAsteroid(id++, "large", { x, y }));
  }
  return { asteroids, nextId: id };
}

function makeStars(w: number, h: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.5 + 0.3,
    brightness: 0.4 + Math.random() * 0.6,
  }));
}

function makeNebulas(w: number, h: number): NebulaBlob[] {
  const palettes = [
    { r: 120, g: 40, b: 180 },
    { r: 20, g: 60, b: 180 },
    { r: 0, g: 160, b: 180 },
  ];
  return palettes.map((c, i) => ({
    x: w * (0.2 + i * 0.3),
    y: h * (0.3 + Math.random() * 0.4),
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    radius: Math.min(w, h) * (0.35 + Math.random() * 0.2),
    r: c.r,
    g: c.g,
    b: c.b,
  }));
}

function initialShip(w: number, h: number): Ship {
  return {
    pos: { x: w / 2, y: h / 2 },
    vel: { x: 0, y: 0 },
    angle: -Math.PI / 2,
    thrusting: false,
    invincible: INVINCIBILITY_TIME,
    flashTimer: 0,
  };
}

function circleCollide(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy < (ar + br) * (ar + br);
}

function wrap(v: Vec2, w: number, h: number): Vec2 {
  let { x, y } = v;
  if (x < -80) x += w + 160;
  else if (x > w + 80) x -= w + 160;
  if (y < -80) y += h + 160;
  else if (y > h + 80) y -= h + 160;
  return { x, y };
}

const EXPLOSION_COLORS = [
  "#00e5ff",
  "#ffffff",
  "#ffeb3b",
  "#ff7043",
  "#e040fb",
];

function makeExplosion(id: number, pos: Vec2, count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 180;
    const life = 0.6 + Math.random() * 0.8;
    return {
      id: id + i,
      pos: { ...pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      life,
      maxLife: life,
      color:
        EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
      size: 1.5 + Math.random() * 2.5,
    };
  });
}

function makeDebrisLines(id: number, pos: Vec2, count: number): DebrisLine[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 160;
    const life = 0.4 + Math.random() * 0.6;
    return {
      id: id + i,
      pos: { ...pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 7,
      length: 8 + Math.random() * 18,
      life,
      maxLife: life,
      color:
        EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AsteroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const audioRef = useRef<AudioManager | null>(null);
  const prevThrustRef = useRef(false);
  const prevUfoRef = useRef(false);

  const getAudio = useCallback((): AudioManager => {
    if (!audioRef.current) audioRef.current = new AudioManager();
    return audioRef.current;
  }, []);

  const [phase, setPhase] = useState<"start" | "playing" | "gameover">("start");
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const { data: topScores } = useTopScores();
  const { mutate: submitScore } = useSubmitScore();

  const initGame = useCallback(
    (w: number, h: number, lvl = 1) => {
      const audio = getAudio();
      audio.stopThrust();
      audio.stopUfo();
      prevThrustRef.current = false;
      prevUfoRef.current = false;
      const ship = initialShip(w, h);
      const { asteroids, nextId } = spawnAsteroidsForLevel(lvl, w, h, 1);
      gsRef.current = {
        phase: "playing",
        score: 0,
        lives: 3,
        level: lvl,
        ship,
        asteroids,
        bullets: [],
        particles: [],
        debrisLines: [],
        stars: makeStars(w, h),
        nebulas: makeNebulas(w, h),
        nextId,
        keys: new Set(),
        shootCooldown: 0,
        levelTransition: false,
        levelTimer: 0,
        ufo: null,
        ufoTimer: 15 + Math.random() * 10,
        powerUps: [],
        shieldActive: 0,
        spreadShotActive: 0,
        combo: 1,
        comboTimer: 0,
        screenShake: 0,
        shockwave: null,
      };
      setPhase("playing");
      setSubmitted(false);
      setPlayerName("");
    },
    [getAudio],
  );

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initGame(canvas.width, canvas.height, 1);
  }, [initGame]);

  // ─── Hyperspace ──────────────────────────────────────────────────────────────
  const doHyperspace = useCallback(() => {
    const gs = gsRef.current;
    if (!gs || gs.phase !== "playing" || gs.levelTransition) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const audio = getAudio();

    // 25% chance of death
    if (Math.random() < 0.25) {
      const newParticles = makeExplosion(gs.nextId, gs.ship.pos, 24);
      gs.nextId += 24;
      gs.particles.push(...newParticles);
      gs.screenShake = 0.35;
      audio.explodeLarge();
      gs.lives -= 1;
      if (gs.lives <= 0) {
        gs.phase = "gameover";
        setFinalScore(gs.score);
        setPhase("gameover");
      } else {
        gs.ship = initialShip(w, h);
      }
    } else {
      gs.ship.pos = {
        x: 40 + Math.random() * (w - 80),
        y: 40 + Math.random() * (h - 80),
      };
      gs.ship.vel = { x: 0, y: 0 };
      gs.ship.invincible = 60;
      gs.ship.flashTimer = 0;
    }
  }, [getAudio]);

  // ─── Update logic ────────────────────────────────────────────────────────────
  const update = useCallback(
    (dt: number) => {
      const gs = gsRef.current;
      if (!gs || gs.phase !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const { keys, ship } = gs;
      const audio = getAudio();

      if (gs.levelTransition) {
        gs.levelTimer -= dt;
        if (gs.levelTimer <= 0) {
          gs.levelTransition = false;
          const nextLvl = gs.level + 1;
          gs.level = nextLvl;
          const { asteroids, nextId } = spawnAsteroidsForLevel(
            nextLvl,
            w,
            h,
            gs.nextId,
          );
          gs.asteroids = asteroids;
          gs.nextId = nextId;
          gs.ship = initialShip(w, h);
          // Reset UFO timer for new level
          gs.ufoTimer = 15 + Math.random() * 10;
        }
        // Update shockwave even during transition
        if (gs.shockwave) {
          gs.shockwave.radius +=
            (gs.shockwave.maxRadius / gs.shockwave.maxLife) * dt;
          gs.shockwave.life -= dt;
          if (gs.shockwave.life <= 0) gs.shockwave = null;
        }
        return;
      }

      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) {
        ship.angle -= SHIP_ROTATE_SPEED * dt;
      }
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) {
        ship.angle += SHIP_ROTATE_SPEED * dt;
      }

      ship.thrusting = keys.has("ArrowUp") || keys.has("w") || keys.has("W");
      if (ship.thrusting) {
        ship.vel.x += Math.cos(ship.angle) * SHIP_SPEED * dt;
        ship.vel.y += Math.sin(ship.angle) * SHIP_SPEED * dt;
      }

      // Thrust sound
      if (ship.thrusting && !prevThrustRef.current) audio.startThrust();
      if (!ship.thrusting && prevThrustRef.current) audio.stopThrust();
      prevThrustRef.current = ship.thrusting;

      ship.vel.x *= SHIP_FRICTION ** (dt * 60);
      ship.vel.y *= SHIP_FRICTION ** (dt * 60);

      const spd = Math.sqrt(ship.vel.x ** 2 + ship.vel.y ** 2);
      if (spd > 500) {
        ship.vel.x = (ship.vel.x / spd) * 500;
        ship.vel.y = (ship.vel.y / spd) * 500;
      }

      ship.pos.x += ship.vel.x * dt;
      ship.pos.y += ship.vel.y * dt;
      ship.pos = wrap(ship.pos, w, h);

      if (ship.invincible > 0) {
        ship.invincible -= dt * 60;
        ship.flashTimer += dt * 60;
      }

      // Active power-up timers
      if (gs.shieldActive > 0) gs.shieldActive -= dt;
      if (gs.spreadShotActive > 0) gs.spreadShotActive -= dt;

      // Combo timer decay
      if (gs.comboTimer > 0) {
        gs.comboTimer -= dt;
        if (gs.comboTimer <= 0) {
          gs.combo = 1;
          gs.comboTimer = 0;
        }
      }

      // Screen shake decay
      if (gs.screenShake > 0) gs.screenShake -= dt;

      // Shockwave update
      if (gs.shockwave) {
        gs.shockwave.radius +=
          (gs.shockwave.maxRadius / gs.shockwave.maxLife) * dt;
        gs.shockwave.life -= dt;
        if (gs.shockwave.life <= 0) gs.shockwave = null;
      }

      // Nebula drift
      for (const nb of gs.nebulas) {
        nb.x += nb.vx;
        nb.y += nb.vy;
        // Bounce gently off edges
        if (nb.x < -nb.radius * 0.5 || nb.x > w + nb.radius * 0.5) nb.vx *= -1;
        if (nb.y < -nb.radius * 0.5 || nb.y > h + nb.radius * 0.5) nb.vy *= -1;
      }

      gs.shootCooldown -= dt;
      const wantShoot = keys.has(" ") || keys.has("z") || keys.has("Z");
      if (wantShoot && gs.shootCooldown <= 0) {
        if (gs.spreadShotActive > 0) {
          // 3-bullet spread
          for (const spread of [-0.26, 0, 0.26]) {
            const a = ship.angle + spread;
            gs.bullets.push({
              id: gs.nextId++,
              pos: {
                x: ship.pos.x + Math.cos(ship.angle) * SHIP_SIZE,
                y: ship.pos.y + Math.sin(ship.angle) * SHIP_SIZE,
              },
              vel: {
                x: ship.vel.x + Math.cos(a) * BULLET_SPEED,
                y: ship.vel.y + Math.sin(a) * BULLET_SPEED,
              },
              life: BULLET_LIFE,
            });
          }
        } else {
          gs.bullets.push({
            id: gs.nextId++,
            pos: {
              x: ship.pos.x + Math.cos(ship.angle) * SHIP_SIZE,
              y: ship.pos.y + Math.sin(ship.angle) * SHIP_SIZE,
            },
            vel: {
              x: ship.vel.x + Math.cos(ship.angle) * BULLET_SPEED,
              y: ship.vel.y + Math.sin(ship.angle) * BULLET_SPEED,
            },
            life: BULLET_LIFE,
          });
        }
        audio.shoot();
        gs.shootCooldown = SHOOT_COOLDOWN;
      }

      gs.bullets = gs.bullets.filter((b) => b.life > 0);
      for (const b of gs.bullets) {
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        b.pos = wrap(b.pos, w, h);
        b.life -= dt;
      }

      for (const a of gs.asteroids) {
        a.pos.x += a.vel.x * dt;
        a.pos.y += a.vel.y * dt;
        a.pos = wrap(a.pos, w, h);
        a.angle += a.spin * dt;
      }

      gs.particles = gs.particles.filter((p) => p.life > 0);
      for (const p of gs.particles) {
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        p.vel.x *= 0.97;
        p.vel.y *= 0.97;
        p.life -= dt;
      }

      gs.debrisLines = gs.debrisLines.filter((d) => d.life > 0);
      for (const d of gs.debrisLines) {
        d.pos.x += d.vel.x * dt;
        d.pos.y += d.vel.y * dt;
        d.vel.x *= 0.95;
        d.vel.y *= 0.95;
        d.angle += d.spin * dt;
        d.life -= dt;
      }

      // Power-ups drift & despawn
      gs.powerUps = gs.powerUps.filter((pu) => pu.life > 0);
      for (const pu of gs.powerUps) {
        pu.pos.x += pu.vel.x * dt;
        pu.pos.y += pu.vel.y * dt;
        pu.pos = wrap(pu.pos, w, h);
        pu.life -= dt;
      }

      // UFO logic
      if (gs.level >= 2 && !gs.ufo && !gs.levelTransition) {
        gs.ufoTimer -= dt;
        if (gs.ufoTimer <= 0) {
          const isSmall = gs.level >= 4 && Math.random() > 0.5;
          const radius = isSmall ? 14 : 24;
          const fromLeft = Math.random() > 0.5;
          gs.ufo = {
            pos: {
              x: fromLeft ? -radius * 2 : w + radius * 2,
              y: h * 0.2 + Math.random() * h * 0.6,
            },
            vel: {
              x: fromLeft ? (isSmall ? 130 : 80) : -(isSmall ? 130 : 80),
              y: 0,
            },
            size: isSmall ? "small" : "large",
            radius,
            shootTimer: 2 + Math.random() * 2,
            waveOffset: Math.random() * Math.PI * 2,
            waveAmplitude: isSmall ? 50 : 35,
            bullets: [],
          };
          audio.startUfo();
          gs.ufoTimer = 15 + Math.random() * 10;
        }
      }

      if (gs.ufo) {
        const ufo = gs.ufo;
        ufo.waveOffset += dt * 2;
        ufo.pos.x += ufo.vel.x * dt;
        ufo.pos.y += Math.sin(ufo.waveOffset) * ufo.waveAmplitude * dt;
        // Vertical wrap
        if (ufo.pos.y < -ufo.radius) ufo.pos.y += h + ufo.radius * 2;
        if (ufo.pos.y > h + ufo.radius) ufo.pos.y -= h + ufo.radius * 2;

        // Despawn if off-screen horizontally
        const offScreen =
          (ufo.vel.x > 0 && ufo.pos.x > w + ufo.radius * 3) ||
          (ufo.vel.x < 0 && ufo.pos.x < -ufo.radius * 3);
        if (offScreen) {
          audio.stopUfo();
          gs.ufo = null;
        } else {
          // UFO shoot at player
          ufo.shootTimer -= dt;
          if (ufo.shootTimer <= 0) {
            const dx = ship.pos.x - ufo.pos.x;
            const dy = ship.pos.y - ufo.pos.y;
            const baseAngle = Math.atan2(dy, dx);
            const spread =
              ufo.size === "small"
                ? (Math.random() - 0.5) * 0.15
                : (Math.random() - 0.5) * 1.1;
            const angle = baseAngle + spread;
            ufo.bullets.push({
              id: gs.nextId++,
              pos: { ...ufo.pos },
              vel: { x: Math.cos(angle) * 280, y: Math.sin(angle) * 280 },
              life: BULLET_LIFE * 1.5,
            });
            ufo.shootTimer =
              ufo.size === "small" ? 2 + Math.random() * 2 : 3 + Math.random();
          }
          // Update UFO bullets
          ufo.bullets = ufo.bullets.filter((b) => b.life > 0);
          for (const b of ufo.bullets) {
            b.pos.x += b.vel.x * dt;
            b.pos.y += b.vel.y * dt;
            b.pos = wrap(b.pos, w, h);
            b.life -= dt;
          }
        }
      }

      // UFO sound state sync
      if (gs.ufo && !prevUfoRef.current) prevUfoRef.current = true;
      if (!gs.ufo && prevUfoRef.current) {
        prevUfoRef.current = false;
      }

      // ─── Collision: player bullets vs asteroids ───────────────────────────
      const bulletsToRemove = new Set<number>();
      const asteroidsToRemove = new Set<number>();
      const newAsteroids: Asteroid[] = [];
      let scoreGain = 0;

      for (const b of gs.bullets) {
        for (const a of gs.asteroids) {
          if (asteroidsToRemove.has(a.id)) continue;
          if (circleCollide(b.pos.x, b.pos.y, 4, a.pos.x, a.pos.y, a.radius)) {
            bulletsToRemove.add(b.id);
            asteroidsToRemove.add(a.id);

            const baseScore = SCORE_MAP[a.size];
            scoreGain += baseScore * gs.combo;
            gs.combo = Math.min(gs.combo + 1, 4);
            gs.comboTimer = 2;

            // Sound
            if (a.size === "large") {
              audio.explodeLarge();
              gs.screenShake = 0.3;
            } else {
              audio.explodeSmall();
              if (a.size === "medium")
                gs.screenShake = Math.max(gs.screenShake, 0.15);
            }

            // Particles
            const count =
              a.size === "large" ? 18 : a.size === "medium" ? 12 : 7;
            gs.particles.push(...makeExplosion(gs.nextId, a.pos, count));
            gs.nextId += count;

            // Debris lines for large/medium
            if (a.size === "large" || a.size === "medium") {
              const lineCount = a.size === "large" ? 7 : 4;
              gs.debrisLines.push(
                ...makeDebrisLines(gs.nextId, a.pos, lineCount),
              );
              gs.nextId += lineCount;
            }

            // Split asteroids
            if (a.size === "large") {
              for (let i = 0; i < 2; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd2 = 80 + Math.random() * 40;
                newAsteroids.push(
                  makeAsteroid(gs.nextId++, "medium", a.pos, {
                    x: Math.cos(ang) * spd2,
                    y: Math.sin(ang) * spd2,
                  }),
                );
              }
            } else if (a.size === "medium") {
              for (let i = 0; i < 2; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd2 = 110 + Math.random() * 60;
                newAsteroids.push(
                  makeAsteroid(gs.nextId++, "small", a.pos, {
                    x: Math.cos(ang) * spd2,
                    y: Math.sin(ang) * spd2,
                  }),
                );
              }
            }

            // Power-up drop 10% chance
            if (Math.random() < POWERUP_CHANCE) {
              const ang = Math.random() * Math.PI * 2;
              gs.powerUps.push({
                id: gs.nextId++,
                pos: { ...a.pos },
                vel: { x: Math.cos(ang) * 30, y: Math.sin(ang) * 30 },
                type: Math.random() < 0.5 ? "shield" : "spread",
                life: POWERUP_LIFE,
              });
            }
            break;
          }
        }
      }

      if (scoreGain > 0) gs.score += scoreGain;

      gs.bullets = gs.bullets.filter((b) => !bulletsToRemove.has(b.id));
      gs.asteroids = gs.asteroids
        .filter((a) => !asteroidsToRemove.has(a.id))
        .concat(newAsteroids);

      // ─── Collision: player bullets vs UFO ────────────────────────────────
      if (gs.ufo) {
        const currentUfo = gs.ufo;
        let ufoHit = false;
        for (const b of gs.bullets) {
          if (ufoHit) break;
          if (
            circleCollide(
              b.pos.x,
              b.pos.y,
              4,
              currentUfo.pos.x,
              currentUfo.pos.y,
              currentUfo.radius,
            )
          ) {
            bulletsToRemove.add(b.id);
            const ufoScore =
              (currentUfo.size === "small" ? 1000 : 200) * gs.combo;
            gs.score += ufoScore;
            gs.combo = Math.min(gs.combo + 1, 4);
            gs.comboTimer = 2;
            gs.particles.push(...makeExplosion(gs.nextId, currentUfo.pos, 20));
            gs.nextId += 20;
            gs.debrisLines.push(
              ...makeDebrisLines(gs.nextId, currentUfo.pos, 6),
            );
            gs.nextId += 6;
            gs.screenShake = 0.35;
            audio.explodeLarge();
            audio.stopUfo();
            gs.ufo = null;
            prevUfoRef.current = false;
            ufoHit = true;
          }
        }
        gs.bullets = gs.bullets.filter((b) => !bulletsToRemove.has(b.id));
      }

      // ─── Collision: UFO bullets vs player ────────────────────────────────
      if (gs.ufo && ship.invincible <= 0 && gs.shieldActive <= 0) {
        for (const b of gs.ufo.bullets) {
          if (
            circleCollide(
              b.pos.x,
              b.pos.y,
              4,
              ship.pos.x,
              ship.pos.y,
              SHIP_SIZE * 0.7,
            )
          ) {
            b.life = 0;
            const newParticles = makeExplosion(gs.nextId, ship.pos, 24);
            gs.nextId += 24;
            gs.particles.push(...newParticles);
            gs.screenShake = 0.4;
            audio.explodeLarge();
            gs.lives -= 1;
            if (gs.lives <= 0) {
              gs.phase = "gameover";
              setFinalScore(gs.score);
              setPhase("gameover");
              audio.stopThrust();
              audio.stopUfo();
            } else {
              gs.ship = initialShip(w, h);
            }
            break;
          }
        }
      }

      // ─── Collision: ship vs asteroids ────────────────────────────────────
      if (ship.invincible <= 0 && gs.shieldActive <= 0) {
        for (const a of gs.asteroids) {
          if (
            circleCollide(
              ship.pos.x,
              ship.pos.y,
              SHIP_SIZE * 0.7,
              a.pos.x,
              a.pos.y,
              a.radius * 0.85,
            )
          ) {
            const newParticles = makeExplosion(gs.nextId, ship.pos, 24);
            gs.nextId += 24;
            gs.particles.push(...newParticles);
            gs.screenShake = 0.4;
            audio.explodeLarge();
            gs.lives -= 1;
            if (gs.lives <= 0) {
              gs.phase = "gameover";
              setFinalScore(gs.score);
              setPhase("gameover");
              audio.stopThrust();
              audio.stopUfo();
            } else {
              gs.ship = initialShip(w, h);
            }
            break;
          }
        }
      }

      // ─── Collision: ship vs power-ups ─────────────────────────────────────
      const puToRemove = new Set<number>();
      for (const pu of gs.powerUps) {
        if (
          circleCollide(
            ship.pos.x,
            ship.pos.y,
            SHIP_SIZE,
            pu.pos.x,
            pu.pos.y,
            10,
          )
        ) {
          puToRemove.add(pu.id);
          if (pu.type === "shield") gs.shieldActive = SHIELD_DURATION;
          else gs.spreadShotActive = SPREAD_DURATION;
          audio.powerupCollect();
        }
      }
      gs.powerUps = gs.powerUps.filter((pu) => !puToRemove.has(pu.id));

      // ─── Level complete ──────────────────────────────────────────────────
      if (gs.asteroids.length === 0 && !gs.levelTransition) {
        gs.levelTransition = true;
        gs.levelTimer = 2.5;
        gs.shockwave = {
          pos: { x: w / 2, y: h / 2 },
          radius: 0,
          maxRadius: Math.sqrt(w * w + h * h) * 0.6,
          life: 1.8,
          maxLife: 1.8,
        };
        // Kill UFO on level clear
        if (gs.ufo) {
          audio.stopUfo();
          gs.ufo = null;
          prevUfoRef.current = false;
        }
      }
    },
    [getAudio],
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const gs = gsRef.current;
    if (!canvas || !gs) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const now = performance.now();

    // Background
    ctx.fillStyle = "#020611";
    ctx.fillRect(0, 0, w, h);

    // ── Nebula blobs ─────────────────────────────────────────────────────────
    for (const nb of gs.nebulas) {
      const grad = ctx.createRadialGradient(
        nb.x,
        nb.y,
        0,
        nb.x,
        nb.y,
        nb.radius,
      );
      grad.addColorStop(0, `rgba(${nb.r},${nb.g},${nb.b},0.13)`);
      grad.addColorStop(0.5, `rgba(${nb.r},${nb.g},${nb.b},0.06)`);
      grad.addColorStop(1, `rgba(${nb.r},${nb.g},${nb.b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(nb.x, nb.y, nb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Stars ─────────────────────────────────────────────────────────────────
    for (const s of gs.stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${s.brightness})`;
      ctx.fill();
    }

    if (gs.phase === "playing" || gs.phase === "gameover") {
      // ── Screen shake transform ───────────────────────────────────────────
      const shakeAmt = Math.max(0, gs.screenShake);
      const shakeX = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 10 : 0;
      const shakeY = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 10 : 0;
      ctx.save();
      if (shakeAmt > 0) ctx.translate(shakeX, shakeY);

      // ── Shockwave ────────────────────────────────────────────────────────
      if (gs.shockwave) {
        const swAlpha = Math.max(
          0,
          (gs.shockwave.life / gs.shockwave.maxLife) * 0.7,
        );
        ctx.beginPath();
        ctx.arc(
          gs.shockwave.pos.x,
          gs.shockwave.pos.y,
          gs.shockwave.radius,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = `rgba(0, 229, 255, ${swAlpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Particles ────────────────────────────────────────────────────────
      for (const p of gs.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Debris lines ─────────────────────────────────────────────────────
      for (const d of gs.debrisLines) {
        const alpha = Math.max(0, d.life / d.maxLife);
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(d.pos.x, d.pos.y);
        ctx.rotate(d.angle);
        ctx.beginPath();
        ctx.moveTo(-d.length / 2, 0);
        ctx.lineTo(d.length / 2, 0);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ── Asteroids ────────────────────────────────────────────────────────
      for (const a of gs.asteroids) {
        ctx.save();
        ctx.translate(a.pos.x, a.pos.y);
        ctx.rotate(a.angle);
        ctx.beginPath();
        for (let i = 0; i < a.shape.length; i++) {
          const pt = a.shape[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(180, 190, 210, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "rgba(50, 60, 80, 0.3)";
        ctx.fill();
        ctx.restore();
      }

      // ── Player bullets ───────────────────────────────────────────────────
      for (const b of gs.bullets) {
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffee44";
        ctx.shadowColor = "#ffee44";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── UFO ──────────────────────────────────────────────────────────────
      if (gs.ufo) {
        const ufo = gs.ufo;
        // UFO bullets
        for (const b of ufo.bullets) {
          ctx.beginPath();
          ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#ff5555";
          ctx.shadowColor = "#ff5555";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        // Saucer shape
        ctx.save();
        ctx.translate(ufo.pos.x, ufo.pos.y);
        const r = ufo.radius;
        // Body ellipse
        ctx.beginPath();
        ctx.ellipse(0, 2, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(80, 80, 100, 0.6)";
        ctx.shadowColor = ufo.size === "small" ? "#ff5555" : "#ffaa00";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.strokeStyle = ufo.size === "small" ? "#ff5555" : "#ffaa00";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Dome
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.12, r * 0.55, r * 0.42, 0, Math.PI, 0);
        ctx.fillStyle = "rgba(60, 100, 140, 0.7)";
        ctx.fill();
        ctx.strokeStyle = ufo.size === "small" ? "#ff8888" : "#ffcc44";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Rim
        ctx.beginPath();
        ctx.ellipse(0, 2, r, r * 0.18, 0, 0, Math.PI * 2);
        ctx.strokeStyle = ufo.size === "small" ? "#ff5555" : "#ffaa00";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── Power-ups ────────────────────────────────────────────────────────
      for (const pu of gs.powerUps) {
        const alpha = Math.min(1, pu.life / 1.5);
        const color = pu.type === "shield" ? "#00e5ff" : "#ffee44";
        const pulse = 1 + Math.sin(now / 200) * 0.18;
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(pu.pos.x, pu.pos.y);
        // Glow orb
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12 * pulse);
        grad.addColorStop(0, `${color}55`);
        grad.addColorStop(1, `${color}00`);
        ctx.beginPath();
        ctx.arc(0, 0, 12 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Ring
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        // Letter
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pu.type === "shield" ? "S" : "3", 0, 0);
        ctx.textBaseline = "alphabetic";
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // ── Ship ─────────────────────────────────────────────────────────────
      const { ship } = gs;
      const visible =
        ship.invincible <= 0 || Math.floor(ship.flashTimer / 4) % 2 === 0;
      if (visible && gs.phase === "playing") {
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        ctx.rotate(ship.angle);

        // Shield aura
        if (gs.shieldActive > 0) {
          const shieldAlpha = 0.28 + Math.sin(now / 80) * 0.15;
          ctx.beginPath();
          ctx.arc(0, 0, SHIP_SIZE * 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 229, 255, ${shieldAlpha})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#00e5ff";
          ctx.shadowBlur = 20;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Thrust flame
        if (ship.thrusting) {
          const spd2 = Math.sqrt(ship.vel.x ** 2 + ship.vel.y ** 2);
          const flameLen = SHIP_SIZE * 0.9 + (spd2 / 500) * SHIP_SIZE * 0.9;
          const flameSpread = (Math.random() - 0.5) * ((10 * Math.PI) / 180);
          ctx.save();
          ctx.rotate(flameSpread);
          const flameGrad = ctx.createLinearGradient(
            -SHIP_SIZE * 0.8,
            0,
            -SHIP_SIZE * 0.8 - flameLen,
            0,
          );
          flameGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
          flameGrad.addColorStop(0.25, "rgba(255, 200, 60, 0.9)");
          flameGrad.addColorStop(0.7, "rgba(255, 80, 10, 0.6)");
          flameGrad.addColorStop(1, "rgba(255, 30, 0, 0)");
          ctx.beginPath();
          ctx.moveTo(-SHIP_SIZE * 0.75, -SHIP_SIZE * 0.38);
          ctx.lineTo(-SHIP_SIZE * 0.8 - flameLen, 0);
          ctx.lineTo(-SHIP_SIZE * 0.75, SHIP_SIZE * 0.38);
          ctx.fillStyle = flameGrad;
          ctx.fill();
          ctx.restore();
        }

        // Ship body
        ctx.beginPath();
        ctx.moveTo(SHIP_SIZE, 0);
        ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.55);
        ctx.lineTo(-SHIP_SIZE * 0.4, 0);
        ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.55);
        ctx.closePath();
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      ctx.restore(); // end screen shake

      // ── HUD ──────────────────────────────────────────────────────────────
      ctx.shadowBlur = 0;
      ctx.font = "bold 18px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#00e5ff";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE  ${String(gs.score).padStart(6, "0")}`, 20, 36);
      ctx.textAlign = "right";
      ctx.fillText(`LEVEL ${gs.level}`, w - 20, 36);

      // Lives
      for (let i = 0; i < gs.lives; i++) {
        const lx = 20 + i * 28;
        const ly = 58;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(-Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Combo display
      if (gs.combo > 1) {
        const comboAlpha = Math.min(1, gs.comboTimer / 0.6);
        ctx.globalAlpha = comboAlpha;
        ctx.font = "bold 28px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#ffee44";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ffee44";
        ctx.shadowBlur = 22;
        ctx.fillText(`${gs.combo}× COMBO`, w / 2, 46);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // Power-up timer bars (top-right)
      let barY = 58;
      ctx.font = "10px 'JetBrains Mono', monospace";
      if (gs.shieldActive > 0) {
        const prog = gs.shieldActive / SHIELD_DURATION;
        ctx.fillStyle = "rgba(0, 229, 255, 0.2)";
        ctx.fillRect(w - 124, barY, 104, 8);
        ctx.fillStyle = "#00e5ff";
        ctx.fillRect(w - 124, barY, 104 * prog, 8);
        ctx.fillStyle = "rgba(0, 229, 255, 0.7)";
        ctx.textAlign = "right";
        ctx.fillText("SHIELD", w - 128, barY + 8);
        barY += 18;
      }
      if (gs.spreadShotActive > 0) {
        const prog = gs.spreadShotActive / SPREAD_DURATION;
        ctx.fillStyle = "rgba(255, 238, 68, 0.2)";
        ctx.fillRect(w - 124, barY, 104, 8);
        ctx.fillStyle = "#ffee44";
        ctx.fillRect(w - 124, barY, 104 * prog, 8);
        ctx.fillStyle = "rgba(255, 238, 68, 0.7)";
        ctx.textAlign = "right";
        ctx.fillText("SPREAD", w - 128, barY + 8);
      }

      // Hyperspace hint
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(0, 229, 255, 0.25)";
      ctx.textAlign = "center";
      ctx.fillText("[H] HYPERSPACE", w / 2, h - 44);

      if (gs.levelTransition) {
        ctx.globalAlpha = 0.85;
        ctx.font = "bold 36px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#00e5ff";
        ctx.textAlign = "center";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 20;
        ctx.fillText(`LEVEL ${gs.level + 1}`, w / 2, h / 2 - 10);
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.fillStyle = "rgba(150, 200, 255, 0.9)";
        ctx.fillText("GET READY", w / 2, h / 2 + 24);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }
  }, []);

  // ─── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (gsRef.current) {
        gsRef.current.stars = makeStars(canvas.width, canvas.height);
        gsRef.current.nebulas = makeNebulas(canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    gsRef.current = {
      phase: "start",
      score: 0,
      lives: 3,
      level: 1,
      ship: initialShip(canvas.width, canvas.height),
      asteroids: [],
      bullets: [],
      particles: [],
      debrisLines: [],
      stars: makeStars(canvas.width, canvas.height),
      nebulas: makeNebulas(canvas.width, canvas.height),
      nextId: 1,
      keys: new Set(),
      shootCooldown: 0,
      levelTransition: false,
      levelTimer: 0,
      ufo: null,
      ufoTimer: 20,
      powerUps: [],
      shieldActive: 0,
      spreadShotActive: 0,
      combo: 1,
      comboTimer: 0,
      screenShake: 0,
      shockwave: null,
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;
      update(dt);
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      audioRef.current?.stopThrust();
      audioRef.current?.stopUfo();
    };
  }, [update, render]);

  // ─── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const gs = gsRef.current;
      if (!gs) return;
      gs.keys.add(e.key);
      if (e.key === " ") e.preventDefault();
      if ((e.key === " " || e.key === "Enter") && gs.phase === "start") {
        const canvas = canvasRef.current;
        if (canvas) initGame(canvas.width, canvas.height, 1);
      }
      if ((e.key === "h" || e.key === "H") && gs.phase === "playing") {
        doHyperspace();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      gsRef.current?.keys.delete(e.key);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [initGame, doHyperspace]);

  const holdKey = useCallback((key: string, active: boolean) => {
    const gs = gsRef.current;
    if (!gs) return;
    if (active) gs.keys.add(key);
    else gs.keys.delete(key);
  }, []);

  const handleSubmit = () => {
    if (!playerName.trim()) return;
    submitScore({
      playerName: playerName.trim().slice(0, 12),
      score: finalScore,
    });
    setSubmitted(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020611]">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* ── Start Screen ── */}
      <AnimatePresence>
        {phase === "start" && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center"
            >
              <h1
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.3em",
                  color: "#00e5ff",
                  fontSize: "clamp(2.5rem, 8vw, 6rem)",
                  textShadow: "0 0 30px #00e5ff, 0 0 60px rgba(0,229,255,0.4)",
                  fontWeight: 700,
                }}
              >
                ASTEROIDS
              </h1>
              <p
                style={{
                  color: "rgba(150,200,255,0.7)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.9rem",
                  marginTop: "0.5rem",
                  letterSpacing: "0.2em",
                }}
              >
                BLASTER DELUXE
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 grid grid-cols-2 gap-x-12 gap-y-2 text-sm"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(160,210,230,0.8)",
              }}
            >
              <span>← → / A D</span>
              <span style={{ color: "rgba(200,230,255,0.6)" }}>Rotate</span>
              <span>↑ / W</span>
              <span style={{ color: "rgba(200,230,255,0.6)" }}>Thrust</span>
              <span>SPACE / Z</span>
              <span style={{ color: "rgba(200,230,255,0.6)" }}>Fire</span>
              <span>H</span>
              <span style={{ color: "rgba(200,230,255,0.6)" }}>Hyperspace</span>
            </motion.div>

            <motion.p
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
              className="mt-10 text-base tracking-widest"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "#00e5ff",
              }}
            >
              PRESS SPACE TO START
            </motion.p>

            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              data-ocid="leaderboard.toggle"
              className="pointer-events-auto mt-8 px-4 py-1.5 text-xs tracking-widest border border-cyan-800 rounded text-cyan-400 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              onClick={() => setShowLeaderboard((v) => !v)}
            >
              {showLeaderboard ? "HIDE" : "SHOW"} LEADERBOARD
            </motion.button>

            <AnimatePresence>
              {showLeaderboard && (
                <motion.div
                  key="lb"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="pointer-events-auto mt-4 w-72 border border-cyan-900 rounded-sm overflow-hidden"
                  style={{
                    background: "rgba(2,6,20,0.85)",
                    backdropFilter: "blur(8px)",
                  }}
                  data-ocid="leaderboard.panel"
                >
                  <div
                    className="px-4 py-2 border-b border-cyan-900 text-xs tracking-widest"
                    style={{
                      color: "#00e5ff",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    TOP SCORES
                  </div>
                  {!topScores || topScores.length === 0 ? (
                    <div
                      className="px-4 py-3 text-xs text-center"
                      style={{
                        color: "rgba(150,180,200,0.5)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      data-ocid="leaderboard.empty_state"
                    >
                      No scores yet. Be the first!
                    </div>
                  ) : (
                    <div>
                      {topScores.slice(0, 10).map((s, i) => (
                        <div
                          key={`${s.playerName}-${i}`}
                          className="flex justify-between px-4 py-1.5 text-xs"
                          data-ocid={`leaderboard.item.${i + 1}`}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            borderBottom: "1px solid rgba(0,100,120,0.2)",
                          }}
                        >
                          <span
                            style={{
                              color:
                                i === 0 ? "#ffee44" : "rgba(150,200,220,0.7)",
                            }}
                          >
                            {i + 1}. {s.playerName}
                          </span>
                          <span
                            style={{
                              color:
                                i === 0 ? "#ffee44" : "rgba(200,230,255,0.8)",
                            }}
                          >
                            {Number(s.score).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Game Over Screen ── */}
      <AnimatePresence>
        {phase === "gameover" && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-sm mx-4 border border-cyan-800 rounded-sm"
              style={{
                background: "rgba(2,6,20,0.92)",
                backdropFilter: "blur(10px)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
              data-ocid="gameover.panel"
            >
              <div className="px-6 py-5 text-center border-b border-cyan-900">
                <h2
                  style={{
                    color: "#ff4444",
                    fontSize: "2rem",
                    fontWeight: 700,
                    letterSpacing: "0.3em",
                    textShadow: "0 0 20px #ff4444",
                  }}
                >
                  GAME OVER
                </h2>
                <p
                  style={{
                    color: "rgba(150,200,255,0.7)",
                    fontSize: "0.75rem",
                    marginTop: "4px",
                    letterSpacing: "0.15em",
                  }}
                >
                  FINAL SCORE
                </p>
                <p
                  style={{
                    color: "#ffee44",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    textShadow: "0 0 15px #ffee44",
                    marginTop: "4px",
                  }}
                >
                  {finalScore.toLocaleString()}
                </p>
              </div>

              {!submitted ? (
                <div className="px-6 py-4">
                  <p
                    className="text-xs mb-2"
                    style={{
                      color: "rgba(150,200,220,0.7)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    ENTER YOUR NAME
                  </p>
                  <input
                    data-ocid="gameover.input"
                    className="w-full px-3 py-2 text-sm rounded-sm border border-cyan-800 bg-transparent outline-none focus:border-cyan-400 transition-colors"
                    style={{
                      color: "#00e5ff",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.1em",
                    }}
                    placeholder="PLAYER ONE"
                    maxLength={12}
                    value={playerName}
                    onChange={(e) =>
                      setPlayerName(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmit();
                      e.stopPropagation();
                    }}
                  />
                  <button
                    type="button"
                    data-ocid="gameover.submit_button"
                    className="mt-2 w-full py-2 text-xs tracking-widest rounded-sm border border-cyan-700 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-500 transition-all"
                    onClick={handleSubmit}
                  >
                    SUBMIT SCORE
                  </button>
                </div>
              ) : (
                <div
                  className="px-6 py-4 text-center text-xs"
                  style={{
                    color: "rgba(0,229,255,0.8)",
                    letterSpacing: "0.1em",
                  }}
                  data-ocid="gameover.success_state"
                >
                  ✓ SCORE SUBMITTED
                </div>
              )}

              <div className="px-6 pb-5">
                <button
                  type="button"
                  data-ocid="gameover.primary_button"
                  className="w-full py-2.5 text-sm tracking-widest rounded-sm font-bold transition-all"
                  style={{
                    background: "rgba(0,180,210,0.15)",
                    border: "1px solid #00e5ff",
                    color: "#00e5ff",
                    fontFamily: "'JetBrains Mono', monospace",
                    textShadow: "0 0 10px #00e5ff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,180,210,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,180,210,0.15)";
                  }}
                  onClick={startGame}
                >
                  PLAY AGAIN
                </button>
              </div>

              {topScores && topScores.length > 0 && (
                <div className="border-t border-cyan-900 px-6 pb-4">
                  <p
                    className="text-xs pt-3 mb-2 tracking-widest"
                    style={{ color: "rgba(0,229,255,0.6)" }}
                  >
                    TOP SCORES
                  </p>
                  {topScores.slice(0, 5).map((s, i) => (
                    <div
                      key={`go-${s.playerName}-${i}`}
                      className="flex justify-between text-xs py-0.5"
                      data-ocid={`gameover.leaderboard.item.${i + 1}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <span
                        style={{
                          color: i === 0 ? "#ffee44" : "rgba(150,200,220,0.7)",
                        }}
                      >
                        {i + 1}. {s.playerName}
                      </span>
                      <span
                        style={{
                          color: i === 0 ? "#ffee44" : "rgba(200,230,255,0.8)",
                        }}
                      >
                        {Number(s.score).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Touch Controls ── */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6 pointer-events-none md:hidden">
        <div className="flex gap-3 pointer-events-auto">
          <button
            type="button"
            data-ocid="controls.rotate_left.button"
            className="w-14 h-14 rounded-full border-2 border-cyan-700 text-cyan-400 text-xl active:bg-cyan-900/40 transition-colors select-none"
            style={{
              background: "rgba(0,30,50,0.7)",
              backdropFilter: "blur(4px)",
              fontFamily: "monospace",
            }}
            onTouchStart={() => holdKey("ArrowLeft", true)}
            onTouchEnd={() => holdKey("ArrowLeft", false)}
            onMouseDown={() => holdKey("ArrowLeft", true)}
            onMouseUp={() => holdKey("ArrowLeft", false)}
          >
            ◁
          </button>
          <button
            type="button"
            data-ocid="controls.rotate_right.button"
            className="w-14 h-14 rounded-full border-2 border-cyan-700 text-cyan-400 text-xl active:bg-cyan-900/40 transition-colors select-none"
            style={{
              background: "rgba(0,30,50,0.7)",
              backdropFilter: "blur(4px)",
              fontFamily: "monospace",
            }}
            onTouchStart={() => holdKey("ArrowRight", true)}
            onTouchEnd={() => holdKey("ArrowRight", false)}
            onMouseDown={() => holdKey("ArrowRight", true)}
            onMouseUp={() => holdKey("ArrowRight", false)}
          >
            ▷
          </button>
        </div>
        <div className="flex gap-3 pointer-events-auto">
          <button
            type="button"
            data-ocid="controls.thrust.button"
            className="w-14 h-14 rounded-full border-2 border-cyan-700 text-cyan-400 text-xl active:bg-cyan-900/40 transition-colors select-none"
            style={{
              background: "rgba(0,30,50,0.7)",
              backdropFilter: "blur(4px)",
              fontFamily: "monospace",
            }}
            onTouchStart={() => holdKey("ArrowUp", true)}
            onTouchEnd={() => holdKey("ArrowUp", false)}
            onMouseDown={() => holdKey("ArrowUp", true)}
            onMouseUp={() => holdKey("ArrowUp", false)}
          >
            △
          </button>
          <button
            type="button"
            data-ocid="controls.fire.button"
            className="w-14 h-14 rounded-full border-2 border-yellow-500 text-yellow-400 text-lg font-bold active:bg-yellow-900/40 transition-colors select-none"
            style={{
              background: "rgba(20,15,0,0.7)",
              backdropFilter: "blur(4px)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            onTouchStart={() => holdKey(" ", true)}
            onTouchEnd={() => holdKey(" ", false)}
            onMouseDown={() => holdKey(" ", true)}
            onMouseUp={() => holdKey(" ", false)}
          >
            FIRE
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-2 left-0 right-0 text-center text-xs pointer-events-none"
        style={{
          color: "rgba(80,120,150,0.4)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto hover:text-cyan-600 transition-colors"
          style={{ color: "rgba(80,120,150,0.4)" }}
        >
          Built with ♥ using caffeine.ai
        </a>
      </div>
    </div>
  );
}
