# Math Tug of War

An interactive two-team math game built with React + Vite.
Players race to solve arithmetic problems, and each correct answer pulls the rope toward their side.

## Gameplay

- Two teams compete at the same time on separate keypads.
- Each correct answer pulls the rope by one step.
- The game ends when:
   - one team reaches the knockout threshold, or
   - the timer runs out.
- If time runs out, the rope position decides the winner.
- Difficulty and time limit can be configured before each round.

## Features

- Real-time tug-of-war visualization with motion effects.
- Independent input panels for both teams.
- Start screen with:
   - difficulty selection (easy / medium / hard),
   - time limit selection.
- Scoreboard, round timer, and game-over summary.
- Synthesized sound effects and background music with mute toggle.
- Persisted difficulty setting via localStorage.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (animation)
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

Default dev server config uses port 3000 and host 0.0.0.0.

## Build and Preview

```bash
npm run build
npm run preview
```

## Available Scripts

- `npm run dev` - start Vite dev server.
- `npm run build` - create production build in `dist`.
- `npm run preview` - preview production build locally.
- `npm run lint` - run TypeScript type-check (`tsc --noEmit`).
- `npm run clean` - remove `dist` folder.
- `npm run pake:build` - package app with Pake (local file target).
- `npm run pake:linux` - build Linux packages with Pake.

## Project Structure

```text
.
|- src/
|  |- App.tsx       # Game logic and UI
|  |- main.tsx      # App entry
|  |- index.css     # Tailwind import
|- index.html
|- vite.config.ts
|- tsconfig.json
|- package.json
|- metadata.json
```

## Notes

- A `GEMINI_API_KEY` define exists in `vite.config.ts` for compatibility with AI Studio templates, but this game does not currently require an API key for local play.
