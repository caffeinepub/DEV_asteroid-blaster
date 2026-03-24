# Snake Game

## Current State
The project has an existing Asteroid Blaster game with a React frontend and Motoko backend with a leaderboard.

## Requested Changes (Diff)

### Add
- Classic Snake game playable in the browser using Canvas API
- Score tracking (increases as snake eats food)
- High score saved in localStorage
- Game over screen with restart button
- Keyboard controls (arrow keys / WASD)
- On-screen control buttons for mobile
- Speed increases as the snake grows

### Modify
- Replace the entire App.tsx UI with the Snake game

### Remove
- Previous Asteroid Blaster game UI and components

## Implementation Plan
1. Replace App.tsx with a Snake game component
2. Implement Canvas-based game loop using requestAnimationFrame
3. Handle keyboard input for direction changes
4. Track score and high score (localStorage)
5. Add start screen, game over screen, and restart
6. Add mobile touch/button controls
