# Repository Guidelines

## Project Structure & Module Organization
This is a React + Vite project.

- `src/` application code.
- `src/components/` UI components (`GameShell`, `SetupModal`, `StaticUiPieces`).
- `src/hooks/` runtime bootstrapping and state hooks.
- `src/lib/` pure game/runtime utilities.
- `src/styles/` CSS (`arqon.css`, `audio-panel.css`).
- `public/` static assets (game scripts, media, audio, flags).

Tests are colocated with code using `*.test.jsx` / `*.test.js` and runtime-focused `*.runtime.test.jsx`.

## Build, Test, and Development Commands
- `npm run dev` start local Vite dev server.
- `npm run build` create production build.
- `npm run preview` serve built output locally.
- `npm test` run Vitest once in CI mode.

Example:
```bash
npm run dev -- --host 127.0.0.1 --port 4174
```

## Coding Style & Naming Conventions
- Language: modern ES modules (`import`/`export`), React function components.
- Match existing style: 2-space indentation, semicolons, single quotes.
- Components/hooks: `PascalCase` for components, `camelCase` for hooks/utilities.
- Keep IDs/class names used by legacy scripts stable (for example `#languageSelector`, `#ropeContainer`).
- Prefer small, focused modules in `src/lib` for logic that can be unit-tested.

## Testing Guidelines
- Framework: Vitest + Testing Library (`jsdom` environment).
- Add/update tests for behavior changes in components, hooks, and game logic.
- Test file naming:
  - Unit/component: `*.test.jsx` / `*.test.js`
  - Runtime integration bridge: `*.runtime.test.jsx`
- Run `npm test` before opening a PR.

## Commit & Pull Request Guidelines
This workspace snapshot currently has no `.git` history available, so follow this default:

- Commits: use Conventional Commits (for example `feat: add zh locale toggle`, `fix: normalize zh-CN locale`).
- Keep commits scoped and reversible.
- PRs should include:
  - short problem/solution summary,
  - changed paths,
  - test evidence (`npm test` output),
  - screenshots/GIFs for UI or animation changes.
