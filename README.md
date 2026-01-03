# EfbiSave - Facebook Video Downloader

Frontend sederhana untuk mengunduh video Facebook dengan UI/UX terinspirasi dari SnapSave. Project ini **tanpa build step** dan siap dipublikasikan ke GitHub Pages.

## Fitur

- Layout sederhana: brand kiri, menu hamburger kanan, hero title & subtitle.
- Input URL Facebook + tombol paste clipboard.
- Validasi URL Facebook (fb.watch, reels, videos).
- State lengkap: empty, loading, error, dan hasil format video.
- Mode demo (mock) + mode real untuk API resolver milik Anda.

## Struktur

```
/
├─ index.html
├─ styles.css
├─ app.js
└─ README.md
```

## Deploy ke GitHub Pages

1. Push repo ke GitHub.
2. Buka **Settings → Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih branch utama dan folder **root** (`/`).
5. Simpan. Tunggu beberapa saat sampai link Pages aktif.

Semua path sudah relatif, jadi tidak perlu konfigurasi tambahan.

## Mengaktifkan Mode REAL (backend resolver)

Secara default aplikasi berjalan di mode **DEMO** (mock). Jika ingin resolver sungguhan:

1. Buka `app.js`.
2. Ubah konfigurasi:

```js
const MODE = "REAL";
const API_BASE = "https://domain-anda.com/api";
```

Endpoint yang dibutuhkan:

```
GET /resolve?url=<facebook_url>
```

Response JSON minimal:

```json
{
  "title": "Judul video",
  "formats": [
    { "quality": "720p", "note": "HD · 28 MB", "url": "https://..." }
  ]
}
```

> Catatan: karena kebijakan CORS dari Facebook, diperlukan backend/serverless milik Anda (Cloudflare Workers, Vercel, Netlify, dll) untuk melakukan fetching/resolve video.

## Catatan Legal

EfbiSave hanya untuk konten yang memiliki izin. Patuhi Terms of Service Facebook dan hukum hak cipta di wilayah Anda.
