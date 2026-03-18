# Simple Website

## Current State
The project is an Asteroid Blaster arcade game with a canvas-based game component, score submission, and a leaderboard backed by Motoko APIs (getTopScores, submitScore).

## Requested Changes (Diff)

### Add
- A clean, simple multi-section website with hero, about/features, and footer sections
- Navigation bar with smooth scroll links
- Contact/CTA section

### Modify
- Replace AsteroidsGame component with a simple website layout in App.tsx

### Remove
- The game canvas and all game logic from the frontend

## Implementation Plan
1. Rewrite App.tsx to render a simple website layout
2. Create a clean landing page with: navbar, hero section, features/about section, CTA section, footer
3. Keep the existing backend as-is (no backend changes needed)
