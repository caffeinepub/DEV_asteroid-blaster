import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSubmitScore, useTopScores } from "../hooks/useQueries";

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
  stars: Star[];
  nextId: number;
  keys: Set<string>;
  shootCooldown: number;
  levelTransition: boolean;
  levelTimer: number;
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
    return {
      id: id + i,
      pos: { ...pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      life: 0.6 + Math.random() * 0.8,
      maxLife: 0.6 + Math.random() * 0.8,
      color:
        EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
      size: 1.5 + Math.random() * 2.5,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AsteroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [phase, setPhase] = useState<"start" | "playing" | "gameover">("start");
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const { data: topScores } = useTopScores();
  const { mutate: submitScore } = useSubmitScore();

  const initGame = useCallback((w: number, h: number, lvl = 1) => {
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
      stars: makeStars(w, h),
      nextId,
      keys: new Set(),
      shootCooldown: 0,
      levelTransition: false,
      levelTimer: 0,
    };
    setPhase("playing");
    setSubmitted(false);
    setPlayerName("");
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initGame(canvas.width, canvas.height, 1);
  }, [initGame]);

  // ─── Update logic ────────────────────────────────────────────────────────────
  const update = useCallback((dt: number) => {
    const gs = gsRef.current;
    if (!gs || gs.phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const { keys, ship } = gs;

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

    gs.shootCooldown -= dt;
    if (
      (keys.has(" ") || keys.has("z") || keys.has("Z")) &&
      gs.shootCooldown <= 0
    ) {
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
          scoreGain += SCORE_MAP[a.size];

          const count = a.size === "large" ? 20 : a.size === "medium" ? 14 : 8;
          const newParticles = makeExplosion(gs.nextId, a.pos, count);
          gs.nextId += count;
          gs.particles.push(...newParticles);

          if (a.size === "large") {
            for (let i = 0; i < 2; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 80 + Math.random() * 40;
              newAsteroids.push(
                makeAsteroid(gs.nextId++, "medium", a.pos, {
                  x: Math.cos(angle) * speed,
                  y: Math.sin(angle) * speed,
                }),
              );
            }
          } else if (a.size === "medium") {
            for (let i = 0; i < 2; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 110 + Math.random() * 60;
              newAsteroids.push(
                makeAsteroid(gs.nextId++, "small", a.pos, {
                  x: Math.cos(angle) * speed,
                  y: Math.sin(angle) * speed,
                }),
              );
            }
          }
          break;
        }
      }
    }

    if (scoreGain > 0) {
      gs.score += scoreGain;
    }

    gs.bullets = gs.bullets.filter((b) => !bulletsToRemove.has(b.id));
    gs.asteroids = gs.asteroids
      .filter((a) => !asteroidsToRemove.has(a.id))
      .concat(newAsteroids);

    if (ship.invincible <= 0) {
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
          gs.lives -= 1;
          if (gs.lives <= 0) {
            gs.phase = "gameover";
            setFinalScore(gs.score);
            setPhase("gameover");
          } else {
            gs.ship = initialShip(w, h);
          }
          break;
        }
      }
    }

    if (gs.asteroids.length === 0 && !gs.levelTransition) {
      gs.levelTransition = true;
      gs.levelTimer = 2.5;
    }
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const gs = gsRef.current;
    if (!canvas || !gs) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#020611";
    ctx.fillRect(0, 0, w, h);

    for (const s of gs.stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${s.brightness})`;
      ctx.fill();
    }

    if (gs.phase === "playing" || gs.phase === "gameover") {
      for (const p of gs.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

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

      for (const b of gs.bullets) {
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffee44";
        ctx.shadowColor = "#ffee44";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const { ship } = gs;
      const visible =
        ship.invincible <= 0 || Math.floor(ship.flashTimer / 4) % 2 === 0;
      if (visible && gs.phase === "playing") {
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        ctx.rotate(ship.angle);

        if (ship.thrusting) {
          ctx.beginPath();
          ctx.moveTo(-SHIP_SIZE * 0.8, -SHIP_SIZE * 0.4);
          ctx.lineTo(-SHIP_SIZE * 1.4 - Math.random() * 10, 0);
          ctx.lineTo(-SHIP_SIZE * 0.8, SHIP_SIZE * 0.4);
          ctx.strokeStyle = `rgba(255, ${100 + Math.floor(Math.random() * 155)}, 0, 0.9)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

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

      ctx.shadowBlur = 0;
      ctx.font = "bold 18px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#00e5ff";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE  ${String(gs.score).padStart(6, "0")}`, 20, 36);
      ctx.textAlign = "right";
      ctx.fillText(`LEVEL ${gs.level}`, w - 20, 36);

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
      stars: makeStars(canvas.width, canvas.height),
      nextId: 1,
      keys: new Set(),
      shootCooldown: 0,
      levelTransition: false,
      levelTimer: 0,
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
  }, [initGame]);

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
                A SPACE SHOOTER
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
