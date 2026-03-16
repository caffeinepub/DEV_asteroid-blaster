# Asteroid Blaster

## Current State
Fully functional Asteroids game with:
- Ship movement, shooting, asteroid splitting
- Particle explosions, lives system, level progression
- Leaderboard (submit/view top scores)
- Mobile touch controls
- Start/game-over screens with animations

## Requested Changes (Diff)

### Add
- **Screen shake**: brief camera shake on ship hit and large asteroid destruction
- **Sound effects**: Web Audio API synthesized sounds (shoot, explosion, thrust, UFO, power-up)
- **UFO enemy**: flying saucer that appears starting level 2, moves across screen and shoots at player. Small UFO = 1000pts, Large UFO = 200pts
- **Power-ups**: dropped randomly when asteroids are destroyed (10% chance)
  - Shield (blue orb): 5 seconds of invincibility with visible shield bubble
  - Spread Shot (yellow orb): fires 3 bullets in spread for 10 seconds
- **Combo multiplier**: destroying asteroids in quick succession (within 2s) builds a 2x/3x/4x multiplier shown on screen
- **Hyperspace jump**: pressing H teleports ship to random position (with risk of appearing inside asteroid)
- **Animated nebula background**: subtle colored cloud layers rendered in canvas for depth

### Modify
- Thrust exhaust flame: make it more dynamic with varying length/color
- Explosion particles: add debris lines (not just dots) for large asteroids
- HUD: show active power-up timers, combo multiplier
- Level transition: more dramatic with expanding ring effect

### Remove
- Nothing removed

## Implementation Plan
1. Add UFO type, spawn logic (every ~15-25 seconds starting level 2), movement, and shooting AI
2. Add PowerUp type, drop logic, collection detection, and effect application (shield bubble render, spread shot logic)
3. Implement combo system: track last kill time, increment multiplier, display on HUD
4. Implement screen shake: offset canvas context transform briefly on impacts
5. Add Web Audio API sound manager: synthesize shoot (short beep), explosion (noise burst), thrust (low oscillator), UFO (warbling tone), powerup (ascending tone)
6. Add nebula background: 2-3 large radial gradients slowly drifting, rendered before stars
7. Add hyperspace: H key teleports ship
8. Update HUD rendering for combo multiplier and power-up timers
9. Improve thrust flame and add debris line particles
