# Hướng dẫn cho Agent mới — sontinhgame

Đọc file này **trước khi sửa code**. Mục tiêu: làm đúng từ đầu, **hạn chế sửa vòng 2**.

Chi tiết dài hơn: [docs/AGENT_BRIEF.md](docs/AGENT_BRIEF.md)

---

## Dự án là gì?

- **H5 mini-game** *Son Tinh / Choosing a Son-in-Law* — Phaser 3 + Vite, portrait **375×812**.
- Thể loại: **rhythm tap** (nốt rơi về vòng vàng) + **flood survival** (nước dâng, giữ núi trên nước).
- Scene: `BootScene` → `MenuScene` → `HowToPlayScene` | `GameScene` → `GameOverScene` (launch chồng `GameScene`).

---

## Quy tắc vàng

1. **Một nguồn sự thật** — tham số gameplay trong `src/data/balance.json` + `levelConfig`; không hardcode thời gian/level trong UI nếu đã có trong balance.
2. **Logic tách khỏi Phaser** — `GameController` / `GameState` / `RhythmEngine`; scene chỉ render + input.
3. **Không commit** trừ khi user yêu cầu.
4. **Scope tối thiểu** — không refactor lan man khi user chỉ báo một bug.
5. Sau thay đổi lớn: chạy `npm run build`.

---

## Âm thanh (đã từng lỗi nặng)

- Controller: `src/audio/BgmController.js`, mute: `src/audio/audioPreferences.js`.
- **3 lớp:** music (`_sound`), ambient (`rain`), one-shot (`ngochoa`).
- **Mute/unmute = chỉ đổi volume** — không `stopAll` + replay track khi toggle mute.
- `GameOverScene` **launch** trên `GameScene` → gọi `stopUnderlyingSceneAudio()` trước khi phát nhạc mới.
- Phase L2+ thắng: `victory` → delay → `ngochoa` one-shot; ngochoa phải **fade/stop** victory, không duck mãi.
- Test bắt buộc: toggle mute nhiều lần trên màn thắng L2; không chồng track.

---

## UI & depth

| Depth | Dùng cho |
|-------|----------|
| 0–15 | Gameplay, lane, HUD |
| 80+ | Modal: `LegendSummaryView`, `LeaderboardOverlayView`, pause |
| 60+ | Mute trên `GameOverScene` |

- Panel leaderboard / legend: **overlay fullscreen**, không expand inline giữa nút menu.
- **Một nút mute** mỗi màn; ẩn HUD mute khi game kết thúc.

---

## Nốt rhythm & màu (đừng nhầm phe)

| Màu / loại | Phe | Hành vi |
|------------|-----|---------|
| Vàng `earth` | Sơn Tinh | Tap — nâng núi |
| Nâu `wood` | Sơn Tinh | Tap — bonus +2 gap |
| Cam `fire` | Sơn Tinh | Tap — +1 gap |
| Tím `hold` | Sơn Tinh | Tap + **giữ ngón** (`pointerup` / Space up) |
| Xanh `poison` (X) | Thủy Tinh | **Không tap** |
| Thanh S/T dưới vòng | — | Đỏ = Sơn %, Xanh = Thủy % (không phải màu nốt) |
| Cá xanh `monster_fish` | Thủy Tinh | Trang trí invasion, không tap |

- Cập nhật `HowToPlayScene` khi thêm/sửa loại nốt.
- Field trong `balance.json` phải có code tương ứng (vd. `holdGapPerSecond`).

---

## Level & flow

- `gameLevel` 1 | 2 | 3 — config trong `balance.json` → `levels`.
- L1 thắng → defiance YES/NO; L2 thắng → submission scroll + finale; L3 = max.
- Thời gian: L1 **90s**, L2/L3 **120s** (`sessionDuration` trong level config).
- Content truyện: `src/data/content/` (`legend.json`, `poem-ngochoa.json`), render qua `contentRender.js`.

---

## File quan trọng

```
src/GameScene.js          — gameplay UI, lane, balance bar, input hold
src/GameOverScene.js      — routing thắng/thua theo level
src/core/GameController.js
src/core/RhythmEngine.js
src/audio/BgmController.js
src/MenuScene.js
src/ui/LegendSummaryView.js
src/ui/LeaderboardOverlayView.js
src/data/balance.json
src/data/audio.json
docs/truyenthuyet_TT.txt   — nguồn truyện gốc
```

---

## Checklist trước khi coi task xong

- [ ] How to Play khớp mechanics thực tế
- [ ] Audio: mute, overlay scene, one-shot ngochoa
- [ ] Modal không bị nút che
- [ ] `npm run build` pass
- [ ] Một vòng: menu → L2 win → mute → TOP RUNS → legend

---

## Khi làm game tương tự từ đầu

Thiết kế trước: **bảng note types**, **audio phase machine**, **UI depth convention**, **shared guide constants**. Viết How to Play **sau** khi mechanics chạy — hoặc sinh text từ cùng file config với `balance.json`.
