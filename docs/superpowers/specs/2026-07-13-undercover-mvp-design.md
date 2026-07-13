# Design: Undercover PWA — Fase 1 MVP

**Status:** Approved
**Date:** 2026-07-13
**Source:** `PRD-Undercover-PWA.md`

## Ringkasan

Implementasi Fase 1 (MVP) dari PRD Undercover: game party pass-and-play, 100%
offline, zero backend, dibangun sebagai PWA installable dengan Next.js
(static export), Tailwind CSS, Zustand, dan Serwist. Mobile-first.

Fase 2 (persistensi localStorage, kata custom, tema gelap, voting digital)
**tidak** termasuk dalam scope ini.

## Keputusan Desain (deviasi/klarifikasi dari PRD)

- **Voting:** verbal + tandai manual oleh pemegang perangkat (alur default
  PRD §5.3 Fase C), bukan voting digital gilir HP. Field `votes` dari model
  data §9.2 PRD tidak dipakai karena sistem tidak mencatat vote individual.
- **Skema skor (§7.4):** baris "Bonus voting tepat (+1/ronde)" **dihapus**
  karena butuh tracking vote per-pemain yang tidak ada di alur verbal. Baris
  skor lain tetap sesuai PRD.
- **Voting ulang saat seri:** layar Voting ditampilkan ulang, tapi kandidat
  dibatasi hanya ke pemain yang seri. Bila seri lagi, tombol "Pilih Acak"
  muncul (host-triggered random tie-break).
- **Routing:** single-page app — satu `page.tsx` yang me-render screen
  berbeda berdasarkan `GameState.status`, tanpa URL routing terpisah per
  screen. Konsisten dengan PRD §11 yang menyatakan refresh/tab tertutup
  memang menghilangkan state di Fase 1 (tidak perlu URL persistence).
- **Bank kata:** diperluas dari 30 seed PRD menjadi 100+ pasangan Bahasa
  Indonesia, kategori & prinsip "dekat tapi berbeda" mengikuti §FR-13.
- **Ikon PWA:** karena belum ada aset desain final, dipakai ikon placeholder
  sederhana (192px & 512px + maskable) agar manifest valid dan installable;
  bisa diganti kapan saja tanpa mengubah kode.

## Arsitektur & Stack

Sesuai PRD §4.1: Next.js App Router (`output: 'export'`, static site, no
server runtime), Tailwind CSS v4, Zustand (in-memory state), Serwist
(`@serwist/next`) untuk service worker + manifest, precache seluruh app
shell untuk offline penuh.

**Catatan build:** Serwist membutuhkan webpack config (dikonfirmasi dari
`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`).
Build produksi (`next build`) harus tidak memakai Turbopack agar plugin
Serwist berjalan.

Tidak dipakai: Supabase, database, ORM, API routes, server actions.

## Struktur Folder

```
app/
  layout.tsx          — root layout, metadata
  page.tsx             — Home screen, single entry point SPA
  manifest.ts          — PWA manifest (name, icons, display: standalone)
  sw.ts                — Serwist service worker entry
  globals.css
lib/
  words.ts              — bank kata statis (100+ pasangan)
  types.ts              — Role, Player, GameState, WordPair, dll
  store.ts              — Zustand store (state + actions game)
  gameLogic.ts           — Fisher-Yates, alokasi peran, cek menang, skor
components/
  screens/
    HomeScreen.tsx
    SetupScreen.tsx
    RevealScreen.tsx
    DescriptionScreen.tsx
    VotingScreen.tsx
    EliminationScreen.tsx
    MrWhiteGuessScreen.tsx
    RoundResultScreen.tsx
  ui/                    — Button, Card, dll (reusable, target sentuh ≥44px)
public/
  icons/                 — icon-192.png, icon-512.png, icon-maskable.png
```

## State Management (Zustand)

Satu store `useGameStore` menampung `GameState` (status, roundNumber,
wordPair, players, currentTurnIndex, revealIndex, eliminationCandidates,
config) sesuai model §9.2 PRD (minus field `votes`).

Actions:
- `initGame(config)` — validasi komposisi (§7.1: `undercover+mrWhite <
  civilian`, `total >= 3`), ambil word pair acak, alokasi peran Fisher-Yates
  (FR-07), randomisasi sisi kata (FR-08), status → `REVEAL`
- `confirmRevealed()` — maju revealIndex, atau → `DESCRIPTION` bila selesai
- `nextTurn()` — maju giliran deskripsi; urutan giliran diacak sekali di
  awal fase dengan Mr. White tidak di posisi pertama (§7.3)
- `eliminatePlayer(id)` — proses eliminasi, ungkap peran, deteksi seri
- `resolveTie(candidateIds)` — masuk voting ulang dengan kandidat terbatas
- `randomTieBreak()` — pilih acak dari kandidat seri
- `submitMrWhiteGuess(word)` — cocokkan dengan kata Civilian ronde ini
- `startNewRound()` — reset role/kata/status, pertahankan nama pemain & skor
  kumulatif (§5.4 FR-11)
- `resetToHome()` — bersihkan seluruh state, kembali ke SETUP

Skor dihitung sekali saat `status` masuk `FINISHED`, sesuai tabel §7.4
(minus bonus voting), dijumlahkan ke `player.score`.

## State Machine

Mengikuti §10 PRD persis, dengan catatan VOTING yang bisa loop ke dirinya
sendiri saat ada seri:

```
SETUP → REVEAL → DESCRIPTION → VOTING
VOTING ─(seri)→ VOTING (kandidat terbatas)
VOTING ─(hasil final)→ ELIMINATION
ELIMINATION
   ├─ Mr. White → MR_WHITE_GUESS → (benar: FINISHED) | (salah: cek menang)
   └─ lainnya → cek menang
cek menang
   ├─ ada pemenang → ROUND_RESULT → (ronde baru) DESCRIPTION | FINISHED
   └─ belum → DESCRIPTION
```

## Screens (Mobile-First, Single Page)

`app/page.tsx` men-switch komponen berdasarkan `status` dari store. Semua
target sentuh ≥44px, viewport `dvh`/`svh`, palet slate (netral) + emerald +
indigo (aksen), kontras WCAG AA, animasi minimal (§8.1).

1. **HomeScreen** — judul, tombol "Main"
2. **SetupScreen** — jumlah pemain (3–20, stepper), nama tiap pemain (maks
   12 karakter, default `Pemain N` bila kosong — FR-02), komposisi peran
   dengan rekomendasi otomatis dari tabel §7.1 (bisa di-override host dalam
   batas validasi), pilihan kategori (default "Acak/Umum"), tombol Start
   disabled sampai valid (FR-05)
3. **RevealScreen** — "Serahkan ke [Nama]" + konfirmasi "Saya [Nama]" →
   kartu tertutup, hold-to-reveal (pointer down/up) → "Sudah, sembunyikan &
   lanjut" (§8.4 anti-intip: kata tidak pernah tampil otomatis)
4. **DescriptionScreen** — urutan giliran, "Giliran: [Nama]", tombol
   "Berikutnya" → "Lanjut ke Voting" di akhir urutan
5. **VotingScreen** — kartu nama pemain hidup, host tap 1 nama; bila
   sebelumnya seri, hanya kandidat seri yang tampil + tombol "Pilih Acak"
6. **EliminationScreen** — ungkap peran yang dieliminasi; auto-alir ke
   MrWhiteGuessScreen bila itu Mr. White, atau langsung cek menang
7. **MrWhiteGuessScreen** — input tebakan kata Civilian, cek benar/salah
8. **RoundResultScreen** — pemenang ronde, ranking kumulatif (FR-10),
   tombol "Ronde Baru" (FR-11) / "Selesai → Home"

## PWA & Offline

- `app/manifest.ts`: name "Undercover", short_name, icons 192px/512px +
  maskable, `display: standalone`, `orientation: portrait`, theme_color &
  background_color dari palet
- `@serwist/next` di `next.config.ts` dengan `output: 'export'`
- `app/sw.ts`: precache seluruh app shell (cache-first, tidak ada network
  runtime — §8.3)
- Ikon: placeholder sederhana dibuat sebagai bagian dari implementasi ini

## Bank Kata

`lib/words.ts` — 100+ pasangan `WordPair` (civilian, undercover, category)
Bahasa Indonesia, kategori sesuai §5.5 FR-12 (Umum, Makanan, Minuman, Hewan,
Tempat, Profesi, Objek, Olahraga), prinsip "dekat tapi berbeda" (FR-13).

## Edge Cases (§11 PRD)

Semua ditangani sesuai tabel PRD: pemain <3 → Start disabled; komposisi
invalid → ditolak + rekomendasi; seri → voting ulang lalu acak; semua
penyusup tereliminasi → langsung cek menang Civilian; kategori kosong →
fallback "Umum" + peringatan; nama kosong → default `Pemain N`; refresh
mid-game → state hilang (diterima, sesuai keputusan di atas, tanpa
konfirmasi exit khusus di Fase 1).

## Testing

Unit test (Vitest) untuk `lib/gameLogic.ts`:
- Alokasi peran Fisher-Yates merata & sesuai komposisi
- Validasi komposisi (§7.1 tabel rekomendasi + batas `undercover+mrWhite <
  civilian`, `total >= 3`)
- Kondisi menang (§7.2): Civilian menang, penyusup menang, Mr. White menang
  instan via tebakan benar
- Skema skor (§7.4, minus bonus voting)
- Tie-break: deteksi seri, voting ulang, random tie-break

UI diverifikasi manual via dev server dengan viewport mobile (bukan hanya
lint/typecheck), menjalankan alur end-to-end minimal 3 ronde untuk
memvalidasi OBJ-4.

## Out of Scope (eksplisit)

Sesuai PRD §3.3 dan keputusan scope: mode online/multi-perangkat, akun/
login, localStorage/persistensi, kata custom, tema gelap, voting digital
gilir HP, voice/chat/terjemahan, analytics.
