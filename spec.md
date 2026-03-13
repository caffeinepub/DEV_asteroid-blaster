# Asteroid Blaster

## Current State
New project with no existing frontend or backend logic.

## Requested Changes (Diff)

### Add
- A fun 2D arcade space shooter game built on HTML Canvas
- Player controls a spaceship that can rotate and shoot
- Asteroids spawn from edges and drift across the screen
- Shooting asteroids splits large ones into smaller ones
- Score tracking, lives system, and level progression
- Game over and restart flow
- Sound-free but visually polished with particle effects on explosions
- Keyboard controls: arrow keys to rotate/thrust, spacebar to shoot
- Mobile touch controls: on-screen buttons

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Create a single-page React app with a Canvas-based game component
2. Implement game loop using requestAnimationFrame
3. Player ship: rotation, thrust with inertia, screen wrap-around
4. Bullets: fired from ship tip, limited to ~5 on screen
5. Asteroids: 3 sizes (large/medium/small), random velocity, screen wrap
6. Collision detection: bullet-asteroid, ship-asteroid
7. Particle explosion effects on asteroid destruction
8. Score: +20/50/100 for small/medium/large asteroids
9. Lives: start with 3, brief invincibility after death
10. Level up: increase asteroid count each wave
11. UI overlay: score, lives, level, game over/start screen
12. Touch controls for mobile
