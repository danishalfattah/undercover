# Design: Undercover Gameplay Upgrade

**Status:** Approved
**Date:** 2026-07-14
**Builds on:** `2026-07-13-undercover-mvp-design.md` (Fase 1 MVP, already shipped)

## Ringkasan

Empat perubahan gameplay pada MVP yang sudah jalan, mendekatkan alur ke
game Undercover original:

1. Hapus fase deskripsi bergiliran (tombol "Berikutnya" per pemain).
2. Tambah tombol "Skip Ronde" yang mengakhiri ronde tanpa mempengaruhi skor.
3. Bank kata dibatasi hanya pasangan 1-kata (buang semua yang mengandung spasi).
4. Reveal kata pakai grid kartu: tiap pemain (urut Setup) bergiliran memilih
   satu kartu tertutup acak untuk melihat peran/katanya.

## Keputusan Desain (hasil brainstorming)

- **Fase deskripsi → SPEAKING_ORDER (info saja).** Fase tidak dihapus total;
  diganti satu layar yang menampilkan daftar urutan bicara (seat order,
  Mr. White tidak pertama — logika `assignTurnOrder` tetap dipakai) sebagai
  panduan verbal, dengan satu tombol "Lanjut ke Voting". Tidak ada tombol
  "Berikutnya" per pemain.
- **Skip Ronde = akhiri ronde tanpa pemenang & tanpa poin.** Muncul di layar
  SPEAKING_ORDER dan VOTING. Konfirmasi dulu, lalu ke ROUND_RESULT dengan
  `winner = null` dan `lastRoundPoints = 0` untuk semua; skor kumulatif tidak
  berubah. Papan peringkat tetap tampil apa adanya.
- **Bank kata 1-kata.** Buang semua pasangan di mana `civilian` ATAU
  `undercover` mengandung spasi. Dari 133 pasangan tersisa 82. Tidak menambah
  pasangan baru (bisa ditambah nanti bila terasa cepat berulang).
- **Reveal grid kartu.** Grid X kartu tertutup polos (X = jumlah pemain).
  Tiap pemain, urut Setup, memilih satu kartu tertutup acak → reveal → tutup
  manual → giliran berikutnya. Kartu hanya alat reveal: peran/kata baru
  menempel ke nama pemain saat dia memilih kartu (bukan pra-assigned ke nama).
- **Nama pemain tetap dipakai** untuk voting & leaderboard. Urutan giliran
  memilih kartu = urutan Setup (seat order).

## State Machine Baru

```
SETUP → REVEAL (grid kartu) → SPEAKING_ORDER → VOTING
VOTING ─(seri)→ VOTING (kandidat terbatas)
VOTING ─(hasil)→ ELIMINATION → (MR_WHITE_GUESS?) → cek menang
SPEAKING_ORDER ─(skip)→ ROUND_RESULT (winner null, no score)
VOTING ─(skip)→ ROUND_RESULT (winner null, no score)
cek menang → ada pemenang: ROUND_RESULT | belum: SPEAKING_ORDER
ROUND_RESULT → (Ronde Baru) REVEAL | Selesai
```

Perubahan `GameStatus`: `'DESCRIPTION'` → `'SPEAKING_ORDER'`.

## Model Data

### Deck kartu reveal (state baru)

Saat `initGame`/`startNewRound`, buat deck peran teracak yang BELUM
ditempel ke nama:

```ts
type RevealCard = {
  index: number;          // posisi kartu di grid (stabil)
  role: Role;
  secretWord: string | null;
  takenByPlayerId: string | null;  // null = belum diambil
};
```

`GameState` bertambah:

```ts
revealCards: RevealCard[];       // deck kartu ronde ini
revealPickIndex: number;         // pemain ke-berapa (urut Setup) yang sedang giliran memilih
```

`Player.role` / `Player.secretWord` diisi saat pemain memilih kartu (di
`pickRevealCard`), bukan lagi saat `allocateRoles`. `allocateRoles` tetap
menghasilkan pasangan peran+kata teracak (Fisher-Yates + FR-08 side-swap),
tapi outputnya kini mengisi `revealCards`, bukan langsung `players`.

### Alur pengambilan kartu

- `players` dibuat di urutan seat order dengan `role`/`secretWord` sementara
  kosong (placeholder). `revealPickIndex` mulai 0.
- Pemain ke-`revealPickIndex` (urut seat) memilih `cardIndex` yang
  `takenByPlayerId === null`:
  - Set `card.takenByPlayerId = player.id`.
  - Salin `card.role` & `card.secretWord` ke player tersebut.
  - Naikkan `revealPickIndex`.
- Ketika `revealPickIndex >= players.length` (semua sudah memilih):
  panggil `assignTurnOrder(players)` untuk seat-order speaking order, lalu
  `status = 'SPEAKING_ORDER'`.

## Screens

- **RevealScreen (ubah total).** Header "Giliran mengambil kartu: [Nama urut
  Setup]". Grid `revealCards`: kartu `takenByPlayerId === null` tampil
  tertutup & bisa ditap; yang sudah diambil tampil redup + checkmark, tidak
  bisa ditap. Saat ditap: tampilkan kata (atau "Mr. White") + tombol
  "Tutup & Lanjut" yang memanggil `pickRevealCard` lalu kembali ke grid untuk
  pemain berikutnya. Kata tidak pernah tampil otomatis (§8.4 anti-intip
  tetap terjaga).
- **SpeakingOrderScreen (baru, gantikan DescriptionScreen).** Daftar urutan
  bicara pemain hidup (sort `turnOrder`), tombol "Lanjut ke Voting", tombol
  "Skip Ronde" (secondary).
- **VotingScreen (tambah).** Tambah tombol "Skip Ronde" (secondary) di
  samping/atas tombol Eliminasi.
- **DescriptionScreen dihapus** (`components/screens/DescriptionScreen.tsx`).

## Store Actions

- `pickRevealCard(cardIndex: number)` — assign kartu ke pemain giliran saat
  ini, majukan `revealPickIndex`, transisi ke SPEAKING_ORDER bila semua sudah.
- `skipRound()` — set semua `lastRoundPoints = 0`, `winner = null`,
  `status = 'ROUND_RESULT'`, skor kumulatif tidak diubah.
- `confirmRevealed` / `nextTurn` (lama) dihapus/diganti sesuai alur baru.
  `nextTurn` tidak lagi diperlukan karena tidak ada giliran deskripsi.

## Bank Kata

`lib/words.ts`: hapus 51 pasangan yang mengandung spasi, sisakan 82 pasangan
1-kata. Struktur `WordPair` tidak berubah.

## Edge Cases

| Kasus | Penanganan |
|---|---|
| Pemain tap kartu yang sudah diambil | Kartu non-interaktif (disabled), tidak ada aksi |
| Skip di SPEAKING_ORDER atau VOTING | Konfirmasi → ROUND_RESULT, skor tak berubah, winner null |
| Ronde baru setelah skip | `startNewRound` normal: deck baru, kata baru, skor tetap |
| Kategori kata terlalu sedikit pasangan 1-kata | Sama seperti sebelumnya: fallback ke pool "Umum"/semua |

## Testing

- `npx tsc --noEmit` + `npx eslint .` wajib hijau.
- Playwright (browser sungguhan, viewport mobile):
  - Reveal grid: 4-5 pemain tiap giliran ambil 1 kartu; verifikasi semua
    pemain akhirnya punya peran, jumlah tiap peran sesuai komposisi, kartu
    terpakai tidak bisa dipilih ulang.
  - Skip Ronde dari SPEAKING_ORDER & dari VOTING: verifikasi skor kumulatif
    tidak berubah dan winner label tidak muncul.
  - Alur lengkap tetap jalan: reveal → speaking order → voting → eliminasi →
    (Mr. White guess) → menang → papan peringkat (+delta poin).
  - Bank kata: assert semua kata yang muncul tidak mengandung spasi.

## Out of Scope

Tidak menyentuh: PWA/offline, deployment, persistensi localStorage, kata
custom, voting digital, tema gelap. Skema skor §7.4 (minus bonus voting)
tetap sama.
