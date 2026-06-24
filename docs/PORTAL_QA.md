# MangoRus — Portal QA Checklist

## Package

```bash
npm run package:itch
npm run package:gamepix
npm run package:crazygames   # loose files → packages/crazygames-upload/
npm run package:poki
```

## Verify bundle

- [ ] `index.html` at root
- [ ] Relative paths (`./assets/...`)
- [ ] Forward slashes in ZIP (`tar -a -cf`)
- [ ] All in-game text in English
- [ ] Audio files local in `public/assets/audio/` (no CDN)
- [ ] File count < 1000 (itch)
- [ ] Size < 50 MB (CrazyGames Basic)

## Preview

```bash
npm run build:portal && npm run preview
```

| Platform | URL |
|----------|-----|
| Local | http://localhost:4173/ |
| Poki | http://localhost:4173/?platform=poki |
| CrazyGames | http://localhost:4173/?platform=crazygames |
| GamePix | http://localhost:4173/?platform=gamepix |

## Audio (portal-critical)

- [ ] **Silent on menu boot** — no music before Start tap
- [ ] Music starts after Start / Resume gesture
- [ ] Music pauses on: pause overlay, ad, tab hidden
- [ ] MP3 missing → Web Audio fallback (no crash)
- [ ] Thunder SFX one-shot only (not looped)
- [ ] Zigzag lightning visible during rain; distant thunder quieter when dry
- [ ] Thunder on rain start (first flash when shower begins)

## Gameplay QA

- [ ] Boot: no crash
- [ ] SDK loading hooks (console mock on local OK)
- [ ] **First Start: NO ad**
- [ ] How to Play screen (English)
- [ ] Pause → Resume works; `gameplayStart`/`gameplayStop` wired
- [ ] **Stop → confirm → summary → Main Menu: NO ad**
- [ ] Stop does NOT set `hasCompletedRun` (next Start from menu = no ad)
- [ ] **Play Again after Game Over → ad hook** (mock on local)
- [ ] Mute toggle in pause menu
- [ ] Zone banners at mango thresholds; storm music in rain zones
- [ ] Rainbow after rain; sun/clouds; lightning during storm rain
- [ ] Tall canopy telegraph (▲)
- [ ] **GamePix:** SDK script in built `index.html`; `updateScore`/`updateLevel`; `ping` only on game over; tab pause uses `suspendLoop` + deduped `gameStop`/`gameAction`; see **`docs/GAMEPIX_INTEGRATION.md`**
- [ ] **Poki:** SDK in `index.html`; deduped gameplay events; `commercialBreak` Play Again only; `rewardedBreak` on Watch Ad; see **`docs/POKI_INTEGRATION.md`**
- [ ] High score = mangoes; leaderboard persists
- [ ] Mobile + desktop, both orientations
- [ ] No blocking console errors

## Submit order

1. itch.io (public)
2. GamePix (ZIP)
3. CrazyGames (drag-drop `crazygames-upload/` files, NOT ZIP)
4. Poki (ZIP + `packages/POKI-UPLOAD.md`)
