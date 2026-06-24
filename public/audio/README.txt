Son Tinh — Audio folder
========================

Copy your MP3 files into THIS folder using EXACT filenames below.
After adding files, refresh the game (npm run dev / npm run preview).

Required filenames (case-sensitive on some servers):
------------------------------------------------------
  bgm_menu.mp3       Menu + How to Play background (loop)
  bgm_gameplay.mp3   In-game background (loop)
  bgm_victory.mp3    Son Tinh wins — end screen
  bgm_defeat.mp3     Son Tinh loses — end screen
  vox_ngochoa.mp3    Ngoc Hoa poem voiceover on victory (optional)

Notes:
------
- If a file is missing, the game still runs (procedural SFX / silent BGM).
- Recommended: MP3, 44.1 kHz. Loop menu + gameplay; one-shot for victory/defeat/voice.
- Poem text (no audio): docs/ngochoa.txt

Config reference: src/data/audio.json
