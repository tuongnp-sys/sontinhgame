# Deploy — GitHub + Vercel

Hướng dẫn đưa game lên mạng cho bạn bè test trên điện thoại.

## 1. Chuẩn bị asset (khuyến nghị)

Đặt file vào `public/` trước khi push:

```
public/audio/bgm_menu.mp3
public/audio/bgm_gameplay.mp3
public/audio/bgm_victory.mp3
public/audio/bgm_defeat.mp3
public/audio/vox_ngochoa.mp3
public/audio/sfx_rain_loop.m4a   (Level 2+)
public/images/sontinh_ngochoa.png
```

Thiếu file → game vẫn chạy nhưng im lặng / dùng sprite mặc định.

## 2. Push GitHub (lần đầu)

Tạo repo trống trên https://github.com/new (ví dụ `sontinhgame`).

PowerShell:

```powershell
cd d:\sontinhgame
git init
git add .
git status
git commit -m "Initial commit: Son Tinh H5 game"
git branch -M main
git remote add origin https://github.com/TEN_BAN/sontinhgame.git
git push -u origin main
```

Thay `TEN_BAN` bằng username GitHub của bạn.

## 3. Vercel

1. Đăng nhập https://vercel.com bằng GitHub.
2. **Add New → Project** → import repo `sontinhgame`.
3. Vercel đọc `vercel.json` — giữ mặc định:
   - Build: `npm run build`
   - Output: `dist`
4. **Deploy**.

URL dạng `https://sontinhgame-xxx.vercel.app` — gửi cho bạn bè.

## 4. Cập nhật sau này

```powershell
git add .
git commit -m "Mô tả thay đổi"
git push
```

Vercel tự build lại mỗi lần push `main`.

## 5. Kiểm tra trước khi push

```powershell
npm run build
npm run preview
```

Mở http://localhost:4180 — giống bản production.

## 6. Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|-------------|------------|
| Build fail trên Vercel | Xem **Deployments → Build Logs**; chạy `npm run build` local |
| Không có nhạc online | File `public/audio/*.mp3` chưa được commit |
| Màn trắng | F12 → Console; thường do thiếu `npm run build` thành công |
| `git push` bị từ chối | `git pull origin main --rebase` rồi push lại |

## 7. File cấu hình deploy

- `.gitignore` — bỏ `node_modules/`, `dist/`, `.env`
- `vercel.json` — build command + cache header cho assets
