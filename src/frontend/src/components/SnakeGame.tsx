import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const GRID = 20;
const CELL = 20;
const CANVAS_SIZE = GRID * CELL;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };
type GameState = "idle" | "playing" | "dead";

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
  return food;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    snake: Point[];
    dir: Direction;
    nextDir: Direction;
    food: Point;
    score: number;
    gameState: GameState;
    lastTime: number;
    speed: number;
  }>({
    snake: [{ x: 10, y: 10 }],
    dir: "RIGHT",
    nextDir: "RIGHT",
    food: { x: 15, y: 10 },
    score: 0,
    gameState: "idle",
    lastTime: 0,
    speed: INITIAL_SPEED,
  });

  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number.parseInt(localStorage.getItem("snake-high-score") ?? "0", 10);
  });
  const [gameState, setGameState] = useState<GameState>("idle");
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // Background
    ctx.fillStyle = "#0a0f0a";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid dots
    ctx.fillStyle = "rgba(74,222,128,0.06)";
    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        ctx.beginPath();
        ctx.arc(gx * CELL + CELL / 2, gy * CELL + CELL / 2, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Food — glowing red dot
    const fx = s.food.x * CELL + CELL / 2;
    const fy = s.food.y * CELL + CELL / 2;
    const foodGrad = ctx.createRadialGradient(fx, fy, 1, fx, fy, CELL / 2);
    foodGrad.addColorStop(0, "#ff4444");
    foodGrad.addColorStop(0.5, "#ff2020");
    foodGrad.addColorStop(1, "transparent");
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#ff4444";
    ctx.fillStyle = foodGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    s.snake.forEach((seg, i) => {
      const px = seg.x * CELL;
      const py = seg.y * CELL;
      const isHead = i === 0;
      const alpha = isHead ? 1 : Math.max(0.3, 1 - (i / s.snake.length) * 0.7);

      if (isHead) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#4ade80";
      }

      const segGrad = ctx.createLinearGradient(px, py, px + CELL, py + CELL);
      segGrad.addColorStop(0, `rgba(134,239,172,${alpha})`);
      segGrad.addColorStop(1, `rgba(74,222,128,${alpha * 0.8})`);

      ctx.fillStyle = segGrad;
      const r = isHead ? 5 : 3;
      const p = 1;
      ctx.beginPath();
      ctx.roundRect(px + p, py + p, CELL - p * 2, CELL - p * 2, r);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      const s = stateRef.current;
      if (s.gameState !== "playing") return;

      rafRef.current = requestAnimationFrame(tick);

      const delta = timestamp - s.lastTime;
      if (delta < s.speed) {
        draw();
        return;
      }
      s.lastTime = timestamp;

      // Move
      s.dir = s.nextDir;
      const head = s.snake[0];
      const next: Point = { x: head.x, y: head.y };
      if (s.dir === "UP") next.y -= 1;
      if (s.dir === "DOWN") next.y += 1;
      if (s.dir === "LEFT") next.x -= 1;
      if (s.dir === "RIGHT") next.x += 1;

      // Wall collision
      if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) {
        s.gameState = "dead";
        const final = s.score;
        if (final > highScore) {
          localStorage.setItem("snake-high-score", String(final));
          setHighScore(final);
        }
        setGameState("dead");
        draw();
        return;
      }

      // Self collision
      if (s.snake.some((seg) => seg.x === next.x && seg.y === next.y)) {
        s.gameState = "dead";
        const final = s.score;
        if (final > highScore) {
          localStorage.setItem("snake-high-score", String(final));
          setHighScore(final);
        }
        setGameState("dead");
        draw();
        return;
      }

      const ateFood = next.x === s.food.x && next.y === s.food.y;
      const newSnake = [next, ...s.snake];
      if (!ateFood) newSnake.pop();

      s.snake = newSnake;

      if (ateFood) {
        s.score += 10;
        s.food = randomFood(s.snake);
        s.speed = Math.max(
          MIN_SPEED,
          INITIAL_SPEED - Math.floor(s.score / 50) * 10,
        );
        setDisplayScore(s.score);
      }

      draw();
    },
    [draw, highScore],
  );

  const startGame = useCallback(() => {
    const s = stateRef.current;
    const startSnake = [{ x: 10, y: 10 }];
    s.snake = startSnake;
    s.dir = "RIGHT";
    s.nextDir = "RIGHT";
    s.food = randomFood(startSnake);
    s.score = 0;
    s.gameState = "playing";
    s.lastTime = 0;
    s.speed = INITIAL_SPEED;
    setDisplayScore(0);
    setGameState("playing");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const map: Record<string, Direction> = {
        ArrowUp: "UP",
        w: "UP",
        W: "UP",
        ArrowDown: "DOWN",
        s: "DOWN",
        S: "DOWN",
        ArrowLeft: "LEFT",
        a: "LEFT",
        A: "LEFT",
        ArrowRight: "RIGHT",
        d: "RIGHT",
        D: "RIGHT",
      };
      const newDir = map[e.key];
      if (!newDir) return;

      // Prevent reversing
      const opposite: Record<Direction, Direction> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };
      if (newDir !== opposite[s.dir]) {
        s.nextDir = newDir;
      }

      if (s.gameState === "idle" || s.gameState === "dead") {
        // Any key starts or restarts
        e.preventDefault();
        startGame();
        return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [startGame]);

  // Cleanup
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  const handleDpad = (dir: Direction) => {
    const s = stateRef.current;
    const opposite: Record<Direction, Direction> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    };
    if (dir !== opposite[s.dir]) {
      s.nextDir = dir;
    }
    if (s.gameState === "idle" || s.gameState === "dead") {
      startGame();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h1
            className="text-3xl font-bold font-display tracking-widest text-primary"
            style={{ textShadow: "0 0 20px oklch(0.78 0.22 145 / 0.6)" }}
          >
            SNAKE
          </h1>
          <div className="flex gap-4 text-sm font-mono">
            <div className="text-right">
              <div className="text-muted-foreground text-xs uppercase tracking-wider">
                Score
              </div>
              <div
                className="text-foreground font-bold text-lg leading-tight"
                data-ocid="game.score"
              >
                {displayScore}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs uppercase tracking-wider">
                Best
              </div>
              <div
                className="text-primary font-bold text-lg leading-tight"
                data-ocid="game.high_score"
              >
                {highScore}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas card */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            boxShadow:
              "0 0 0 1px oklch(0.78 0.22 145 / 0.2), 0 0 40px oklch(0.78 0.22 145 / 0.1), 0 4px 32px oklch(0.05 0.01 145 / 0.8)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="block w-full"
            style={{ imageRendering: "pixelated" }}
          />

          {/* Overlay screens */}
          <AnimatePresence>
            {gameState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
                data-ocid="game.panel"
              >
                <div className="text-center px-6">
                  <p
                    className="text-primary text-4xl font-bold font-display tracking-widest mb-2"
                    style={{
                      textShadow: "0 0 20px oklch(0.78 0.22 145 / 0.8)",
                    }}
                  >
                    SNAKE
                  </p>
                  <p className="text-foreground/70 text-sm mb-6">
                    Classic arcade game
                  </p>
                  <div className="text-foreground/50 text-xs font-mono space-y-1 mb-8">
                    <p>↑ ↓ ← → or W A S D</p>
                    <p>Eat food to grow and score</p>
                    <p>Avoid walls and yourself</p>
                  </div>
                  <Button
                    onClick={startGame}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-widest px-8"
                    style={{ boxShadow: "0 0 16px oklch(0.78 0.22 145 / 0.5)" }}
                    data-ocid="game.primary_button"
                  >
                    PLAY
                  </Button>
                </div>
              </motion.div>
            )}

            {gameState === "dead" && (
              <motion.div
                key="dead"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm"
                data-ocid="game.modal"
              >
                <div className="text-center px-6">
                  <p
                    className="text-destructive text-2xl font-bold font-display tracking-widest mb-1"
                    style={{ textShadow: "0 0 16px oklch(0.58 0.22 27 / 0.8)" }}
                  >
                    GAME OVER
                  </p>
                  <p className="text-foreground/60 text-sm font-mono mb-1">
                    Score
                  </p>
                  <p
                    className="text-primary text-5xl font-bold font-mono mb-1"
                    style={{
                      textShadow: "0 0 20px oklch(0.78 0.22 145 / 0.7)",
                    }}
                    data-ocid="game.success_state"
                  >
                    {displayScore}
                  </p>
                  {displayScore >= highScore && displayScore > 0 && (
                    <p className="text-yellow-400 text-xs font-mono mb-4 animate-pulse">
                      ✦ New High Score! ✦
                    </p>
                  )}
                  {(displayScore < highScore || displayScore === 0) && (
                    <p className="text-muted-foreground text-xs font-mono mb-4">
                      Best: {highScore}
                    </p>
                  )}
                  <Button
                    onClick={startGame}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-widest px-8"
                    style={{ boxShadow: "0 0 16px oklch(0.78 0.22 145 / 0.5)" }}
                    data-ocid="game.confirm_button"
                  >
                    PLAY AGAIN
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* D-Pad for mobile */}
        <div
          className="mt-6 flex flex-col items-center gap-1 md:hidden"
          data-ocid="game.panel"
        >
          <Button
            variant="outline"
            size="icon"
            className="border-primary/40 text-primary hover:bg-primary/10"
            onPointerDown={() => handleDpad("UP")}
            data-ocid="game.button"
          >
            ▲
          </Button>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="border-primary/40 text-primary hover:bg-primary/10"
              onPointerDown={() => handleDpad("LEFT")}
              data-ocid="game.secondary_button"
            >
              ◀
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-primary/40 text-primary hover:bg-primary/10"
              onPointerDown={() => handleDpad("DOWN")}
              data-ocid="game.toggle"
            >
              ▼
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-primary/40 text-primary hover:bg-primary/10"
              onPointerDown={() => handleDpad("RIGHT")}
              data-ocid="game.link"
            >
              ▶
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground/40 text-xs mt-6 font-mono">
          © {new Date().getFullYear()} · Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
