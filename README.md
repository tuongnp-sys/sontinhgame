# Choosing a Son-in-Law (Son Tinh)

H5 mini-game — rhythm tap + flood survival. **Phaser 3** + **Vite**, portrait mobile (375×812).

## Local development

```bash
npm install
npm run dev
```

Production preview:

```bash
npm run build
npm run preview
```

## Assets (before sharing)

Copy into `public/` (see README files in each folder):

- `public/audio/` — MP3/M4A per `src/data/audio.json`
- `public/images/sontinh_ngochoa.png` — optional victory art

Game runs without them (procedural SFX / sprite fallback).

## Deploy

Push to GitHub → Vercel auto-builds from `main`.

Full steps: **[docs/DEPLOY.md](docs/DEPLOY.md)**

| Setting | Value |
|---------|--------|
| Build | `npm run build` |
| Output | `dist` |

## Docs

- [AGENTS.md](AGENTS.md) — notes for AI / contributors
- [docs/AGENT_BRIEF.md](docs/AGENT_BRIEF.md) — architecture detail
