;a# Product Requirement Document (PRD)
## Undercover — Web Party Game (PWA, Next.js)

| | |
|---|---|
| **Status** | Draft v3.0 (Fully Offline / No Backend) |
| **Jenis Aplikasi** | Progressive Web App (PWA) |
| **Mode Bermain** | Pass & Play — satu perangkat digilir |
| **Ketergantungan Server** | Tidak ada. Tidak terhubung ke database atau server manapun. |
| **Bahasa Aplikasi** | Bahasa Indonesia |
| **Referensi Benchmark** | Undercover: Game Pesta Kata (Yanstar Studio) |

---

## 1. Ringkasan Eksekutif

### 1.1. Latar Belakang
Undercover adalah game deduksi sosial berbasis kata: sekelompok pemain menerima kata rahasia yang mirip namun tidak identik, lalu saling mendeskripsikan katanya secara bergiliran untuk menebak siapa "penyusup" di antara mereka. Game ini populer sebagai *icebreaker* saat kumpul teman, keluarga, kantor, maupun kampus.

Proyek ini adalah adaptasi web dari konsep tersebut menjadi **PWA yang sepenuhnya berjalan di satu perangkat** — dibuka lewat browser, bisa di-*install* ke home screen, dan **berjalan 100% offline tanpa terhubung ke server atau database manapun**. Perangkat digilir antar pemain (Pass & Play).

### 1.2. Prinsip Desain Inti
- **Zero backend.** Tidak ada Supabase, tidak ada API, tidak ada koneksi keluar. Semua logika berjalan di sisi klien.
- **Bank kata statis.** Pasangan kata di-*bundle* sebagai file dalam aplikasi.
- **State di memori.** Seluruh kondisi permainan hidup di state klien selama sesi; opsional disimpan lokal di perangkat (localStorage) untuk skor & kata custom.
- **Offline-first.** Setelah dibuka sekali, aplikasi bisa dimainkan tanpa internet sama sekali.

### 1.3. Masalah yang Diselesaikan
- Game party sejenis mengharuskan unduh aplikasi native (friksi tinggi untuk pemain dadakan).
- Banyak alternatif web terasa berat, tidak mobile-first, dan tidak terasa seperti aplikasi.
- Ketergantungan server/DB membuat setup dan biaya jadi rumit untuk game yang esensinya kasual.

### 1.4. Objektif Terukur
| Kode | Objektif | Indikator Keberhasilan (target awal) |
|---|---|---|
| OBJ-1 | Aksesibilitas tanpa friksi | Time-to-first-game < 30 detik dari buka link |
| OBJ-2 | Performa mobile | Lighthouse Performance ≥ 90, LCP < 2,5s di 4G |
| OBJ-3 | Kelayakan PWA offline | Lighthouse PWA installable ✓, game berjalan penuh tanpa internet |
| OBJ-4 | Retensi sesi | ≥ 3 ronde rata-rata per sesi (didukung sistem ranking) |
| OBJ-5 | Anti-intip | 0 kebocoran kata rahasia antar pemain saat perangkat digilir |

---

## 2. Target Pengguna & Persona

### 2.1. Persona
- **Host / Pemandu (P1):** Orang yang memegang & mengatur perangkat, membuat setup, dan memandu jalannya permainan untuk teman-temannya. Butuh setup cepat dan alur yang jelas untuk dipandu.
- **Pemain (P2):** Menerima perangkat saat gilirannya untuk melihat kata, ikut deskripsi & voting. Butuh instruksi jelas dan kata rahasia yang aman dari intipan.
- **Pemain Kompetitif (P3):** Termotivasi oleh skor & ranking kumulatif antar ronde.

### 2.2. User Stories Kunci
- Sebagai **Host**, saya ingin mengatur jumlah pemain dan komposisi peran secara cepat.
- Sebagai **Host**, saya ingin dipandu langkah demi langkah agar tidak bingung saat menggilir perangkat.
- Sebagai **Pemain**, saya ingin menahan kartu untuk melihat kata rahasia agar tidak terlihat pemain lain.
- Sebagai **Pemain**, saya ingin tahu urutan giliran bicara agar permainan tertib.
- Sebagai **Pemain**, saya ingin ikut menentukan siapa yang dieliminasi saat voting.
- Sebagai **Mr. White**, saat tereliminasi saya ingin kesempatan menebak kata Civilian.
- Sebagai **Pemain Kompetitif**, saya ingin melihat ranking setelah tiap ronde.

---

## 3. Ruang Lingkup & Fase Rilis

### 3.1. Fase 1 — MVP: Game Lengkap (Offline PWA)
Seluruh permainan pada satu perangkat yang digilir.
- Setup jumlah pemain, nama, dan komposisi peran (dengan rekomendasi otomatis).
- Distribusi peran & kata (Fisher-Yates), reveal per pemain (hold-to-reveal + serah perangkat).
- Fase deskripsi (indikator urutan giliran), voting, eliminasi, cek kondisi menang.
- Mekanik tebakan Mr. White.
- Ranking kumulatif antar ronde.
- **Installable & berjalan 100% offline.**

### 3.2. Fase 2 — Penyempurnaan Lokal *(nice-to-have)*
- **Persistensi lokal (localStorage/IndexedDB):** simpan riwayat skor, statistik sederhana, dan preferensi tanpa server.
- **Bank kata custom:** pemain menambah/mengedit pasangan kata sendiri, tersimpan di perangkat.
- **Pemilihan kategori & tingkat kesulitan.**
- Tema tampilan (mis. mode gelap).

### 3.3. Di Luar Lingkup (Out of Scope)
- **Mode online / multi-perangkat** (dibuang secara sadar — game ini murni satu perangkat).
- Akun, login, ranking global, cloud sync.
- Voice/mic, chat, terjemahan.
- Segala bentuk backend, database eksternal, atau koneksi jaringan saat bermain.

---

## 4. Arsitektur & Tech Stack

### 4.1. Stack
| Lapisan | Teknologi | Catatan |
|---|---|---|
| Framework | **Next.js (App Router)** | Bisa di-*export* statis; tidak butuh server runtime |
| Styling | **Tailwind CSS** | Mobile-first, minimalis, konsisten |
| State Management | **Zustand** | Seluruh state game di memori; ringan tanpa boilerplate |
| PWA Layer | **Serwist** (`@serwist/next`) | Service worker + manifest; precache aset & bank kata |
| Persistensi (opsional, Fase 2) | **localStorage / IndexedDB** | Lokal di perangkat; untuk skor & kata custom |

**Tidak dipakai:** Supabase, PostgreSQL, Prisma, atau ORM/DB apa pun. Bank kata adalah file statis yang di-*bundle*, bukan tabel database.

### 4.2. Arsitektur
```
Browser (PWA terpasang)
   ├─ Zustand Store ............. seluruh state game (in-memory)
   ├─ words.ts (statis) ......... bank pasangan kata, di-bundle
   ├─ Service Worker (Serwist) .. precache aset + bank kata → offline penuh
   └─ localStorage (opsional) ... skor kumulatif, kata custom, preferensi

   Tidak ada koneksi keluar. Tidak ada request jaringan saat bermain.
```

Karena tidak ada state antar-perangkat, aplikasi bisa di-deploy sebagai **static site** (mis. Vercel/GitHub Pages) — hosting hanya menyajikan file; tidak ada logika server.

---

## 5. Kebutuhan Fungsional

### 5.1. Setup Permainan
- **FR-01 Jumlah Pemain:** Host memilih jumlah pemain (3–20).
- **FR-02 Nama Pemain:** Input nama tiap pemain (maks. 12 karakter); bila dikosongkan, default `Pemain 1..N`.
- **FR-03 Komposisi Peran:** Host mengatur jumlah Undercover & Mr. White. Sistem memberi **rekomendasi otomatis** sesuai jumlah pemain (§7.1) dan memvalidasi `penyusup < civilian`.
- **FR-04 Kategori (opsional):** Host dapat memilih kategori kata; default "Acak/Umum".
- **FR-05 Mulai:** Tombol Start aktif hanya bila konfigurasi valid.

### 5.2. Distribusi Peran (Game Core Logic)
- **FR-06 Ambil Pasangan Kata:** Sistem memilih satu pasangan kata acak dari bank kata (mis. Civilian: "Kopi", Undercover: "Teh").
- **FR-07 Alokasi Peran (Fisher-Yates):** Peran diacak merata:
  - **Civilian** → Kata A.
  - **Undercover** → Kata B (mirip tapi berbeda).
  - **Mr. White** → tanpa kata, ditampilkan simbol `^^`.
- **FR-08 Randomisasi Sisi Kata:** Sistem mengacak kata mana (A/B) yang jadi milik Civilian tiap ronde agar tidak terbaca polanya.

### 5.3. Siklus Permainan (Game Loop)

**Fase A — Reveal Kata (Serah Perangkat)**
- Untuk tiap pemain berurutan: layar menampilkan "Serahkan perangkat ke **[Nama]**" + tombol konfirmasi "Saya [Nama]".
- Setelah konfirmasi, muncul kartu **tertutup**. Pemain **tekan-tahan** (hold-to-reveal) untuk melihat kata; lepas → tertutup lagi.
- Tombol "Sudah, sembunyikan & lanjut" → kembali ke layar serah perangkat untuk pemain berikutnya.
- Kata tidak pernah tampil otomatis (mencegah *screen peeking*).

**Fase B — Deskripsi Bergiliran**
- Sistem mengacak urutan bicara (Mr. White diusahakan tidak pertama — §7.3).
- Layar menampilkan urutan giliran dan penanda "Giliran: **[Nama]**".
- Deskripsi diucapkan verbal oleh pemain; aplikasi hanya menandai urutan. Tombol "Berikutnya" untuk maju giliran, lalu "Lanjut ke Voting".

**Fase C — Voting**
- Layar menampilkan kartu nama pemain yang masih hidup.
- **Alur default (cepat):** kelompok voting verbal (angkat tangan), lalu pemegang perangkat menandai pemain yang dieliminasi.
- **Alur alternatif (voting rahasia digital):** perangkat digilir; tiap pemain memilih di layar, pilihan disembunyikan dari pemain berikutnya; hasil dihitung otomatis. *(Fase 2, opsional.)*

**Fase D — Eliminasi & Cek Menang**
- Pemain terpilih tereliminasi; **peran aslinya diungkap** ke semua pemain.
- **Seri (tie):** voting ulang di antara kandidat seri; bila tetap seri → acak (opsi Host).
- **Mr. White tereliminasi:** permainan dijeda; Mr. White diberi satu kesempatan mengetik tebakan kata Civilian. Benar → Mr. White menang instan. Salah → lanjut.
- Cek kondisi menang (§7.2). Bila belum ada pemenang, lanjut ronde deskripsi berikutnya dengan pemain tersisa.

### 5.4. Sistem Skor & Ranking
- **FR-09 Skor per Ronde:** Di akhir permainan, sistem menghitung skor (§7.4) dan menampilkan ranking kumulatif.
- **FR-10 Papan Peringkat:** Urutan pemain berdasarkan total poin lintas ronde dalam satu sesi.
- **FR-11 Ronde Baru:** Host dapat memulai ronde baru dengan pemain yang sama; skor terakumulasi (mendorong sesi lebih panjang — OBJ-4).

### 5.5. Bank Kata (Sumber Data Statis)
- **FR-12 Kategori:** Kata dikelompokkan (Umum, Makanan, Minuman, Hewan, Tempat, Profesi, Objek, Olahraga).
- **FR-13 Kualitas Pasangan:** Tiap pasangan harus "dekat tapi berbeda" agar deskripsi bisa tumpang tindih namun tetap bisa dibedakan (baik: Kopi/Teh; buruk: Kopi/Pesawat).
- **FR-14 Kata Custom (Fase 2):** Pemain dapat menambah pasangan kata sendiri yang disimpan lokal di perangkat.
- Seed awal Bahasa Indonesia tersedia di Lampiran A.

---

## 6. Alur Layar (Screen Flow)

```
Home
  └─ [Main] → Setup (jumlah pemain → nama → komposisi peran → kategori)
        → Ronde:
             Reveal (gilir perangkat, hold-to-reveal)
             → Deskripsi (urutan giliran)
             → Voting (tandai tereliminasi)
             → Eliminasi (ungkap peran) → (Mr. White Guess?)
             → Cek Menang
        → Hasil Ronde + Ranking
        → [Ronde Baru | Selesai → Home]
```

---

## 7. Aturan Main & Balancing

### 7.1. Komposisi Peran per Jumlah Pemain
Aturan wajib: **jumlah penyusup (Undercover + Mr. White) harus lebih sedikit daripada Civilian di awal.** Rekomendasi default (Host boleh menyesuaikan dalam batas aman):

| Total Pemain | Civilian | Undercover | Mr. White |
|:---:|:---:|:---:|:---:|
| 3 | 2 | 1 | 0 |
| 4 | 3 | 1 | 0 |
| 5 | 3 | 1 | 1 |
| 6 | 4 | 1 | 1 |
| 7 | 4 | 2 | 1 |
| 8 | 5 | 2 | 1 |
| 9 | 6 | 2 | 1 |
| 10 | 6 | 3 | 1 |
| 11–12 | sisanya | 3 | 1 |
| 13–15 | sisanya | 3–4 | 1–2 |
| 16–20 | sisanya | 4–5 | 1–2 |

Validasi sistem: `undercover + mrWhite < civilian` **dan** `total ≥ 3`.

### 7.2. Kondisi Menang
- **Civilian menang:** seluruh Undercover **dan** Mr. White telah tereliminasi.
- **Penyusup (Undercover/Mr. White) menang:** jumlah penyusup tersisa **≥** jumlah Civilian yang hidup.
- **Mr. White menang instan:** saat tereliminasi, berhasil menebak kata Civilian dengan benar.

### 7.3. Balancing
- Mr. White sebaiknya **tidak** mendapat giliran deskripsi pertama (agar tidak buta total). Sistem menempatkannya di urutan tengah/akhir secara acak.
- Kata Undercover harus punya irisan makna dengan Civilian — bukan sinonim persis, bukan pula tak berhubungan.

### 7.4. Skema Skor (dapat di-tuning)
| Kejadian | Poin |
|---|:---:|
| Civilian di tim yang menang | +2 |
| Undercover bertahan sampai menang | +10 |
| Mr. White menebak kata dengan benar | +6 |
| Mr. White bertahan sampai penyusup menang | +6 |
| Bonus voting tepat (memilih penyusup yang benar) | +1 / ronde |
| Pemain tereliminasi | 0 |

> Angka bersifat awal dan wajib divalidasi lewat playtest — penyusup diberi poin lebih besar karena posisinya lebih sulit.

---

## 8. Kebutuhan Non-Fungsional

### 8.1. UI/UX Aesthetics
- Desain bersih & minimalis; hindari animasi berlebihan yang mengganggu jalannya permainan.
- Palet warna nyaman & terdesaturasi (mis. slate sebagai netral, emerald & indigo sebagai aksen). Kontras memenuhi WCAG AA.
- Komponen game (kartu, tombol vote, timer) *thumb-friendly* (target sentuh ≥ 44px).

### 8.2. Responsivitas & Layout
- Optimal di layar smartphone (lebar ≥ 360px).
- Gunakan viewport dinamis (`dvh`/`svh`) agar layout tidak bergeser saat address bar mobile muncul/hilang.
- Orientasi utama portrait; layout tidak boleh "pecah" di perangkat kecil.

### 8.3. PWA & Offline
- **Manifest:** `name`, `short_name`, ikon (192px & 512px termasuk maskable), `theme_color`, `background_color`, `display: standalone`, `orientation: portrait`.
- **Service Worker (Serwist):** precache seluruh aset + bank kata agar game berjalan penuh **tanpa internet**.
- **Installable:** memenuhi kriteria PWA agar muncul prompt "Tambahkan ke Layar Utama".
- Strategi cache: seluruh aset → cache-first (app-shell). Tidak ada data jaringan runtime.

### 8.4. Keamanan / Anti-Intip
Karena tidak ada jaringan, satu-satunya risiko adalah **intipan fisik** saat perangkat digilir. Mitigasi:
- Kata tidak pernah tampil otomatis; wajib **hold-to-reveal**.
- Langkah "serah perangkat" eksplisit sebelum tiap reveal, dengan konfirmasi identitas.
- Setelah reveal, kartu langsung tertutup sebelum boleh dioper.

> Tidak ada permukaan kebocoran via network tab / inspect element karena kata rahasia tidak pernah dikirim ke mana pun — hanya ada di memori perangkat.

### 8.5. Aksesibilitas
- Label ARIA pada tombol utama; indikator giliran terbaca screen reader; status tidak hanya mengandalkan warna (mis. giliran ditandai teks + warna).

---

## 9. Model Data (Tanpa Database)

### 9.1. Bank Kata — File Statis
```ts
// words.ts — di-bundle bersama aplikasi, tidak ada koneksi eksternal
export type WordPair = {
  civilian: string;
  undercover: string;
  category: 'Umum' | 'Makanan' | 'Minuman' | 'Hewan'
          | 'Tempat' | 'Profesi' | 'Objek' | 'Olahraga';
  difficulty?: 1 | 2 | 3; // 1=mudah, 2=sedang, 3=sulit
};

export const WORD_PAIRS: WordPair[] = [
  { civilian: 'Kopi', undercover: 'Teh', category: 'Minuman' },
  { civilian: 'Nasi Goreng', undercover: 'Mie Goreng', category: 'Makanan' },
  // ... (lihat Lampiran A)
];
```

### 9.2. State Permainan — Zustand (in-memory)
```ts
type Role = 'CIVILIAN' | 'UNDERCOVER' | 'MR_WHITE';

type Player = {
  id: string;
  name: string;
  role: Role;
  secretWord: string | null;  // null untuk Mr. White
  isAlive: boolean;
  score: number;              // kumulatif lintas ronde dalam sesi
  turnOrder: number;
};

type GameState = {
  status: 'SETUP' | 'REVEAL' | 'DESCRIPTION' | 'VOTING'
        | 'ELIMINATION' | 'MR_WHITE_GUESS' | 'ROUND_RESULT' | 'FINISHED';
  roundNumber: number;
  wordPair: { civilian: string; undercover: string; category: string };
  players: Player[];
  currentTurnIndex: number;
  revealIndex: number;                 // pemain ke-berapa yang sedang reveal
  votes: Record<string, string>;       // voterId -> targetId (bila voting digital)
  config: { undercoverCount: number; mrWhiteCount: number; category: string };
};
```

### 9.3. Persistensi Lokal (Opsional, Fase 2)
```ts
// disimpan di localStorage/IndexedDB — tetap lokal di perangkat, tanpa server
type LocalStore = {
  customWordPairs: WordPair[];   // kata buatan pemain
  sessionHistory: { date: string; ranking: { name: string; score: number }[] }[];
  preferences: { theme: 'light' | 'dark'; defaultCategory: string };
};
```

---

## 10. State Machine (Alur Teknis Ronde)

```
SETUP ──(mulai)──▶ REVEAL
REVEAL ──(semua pemain sudah lihat kata)──▶ DESCRIPTION
DESCRIPTION ──(semua giliran selesai)──▶ VOTING
VOTING ──(hasil ditentukan)──▶ ELIMINATION
ELIMINATION
   ├─ tereliminasi = Mr. White ──▶ MR_WHITE_GUESS
   │        ├─ tebakan benar ──▶ FINISHED (Mr. White menang)
   │        └─ tebakan salah ──▶ [cek menang]
   └─ selain Mr. White ──▶ [cek menang]

[cek menang]
   ├─ ada pemenang ──▶ ROUND_RESULT ──▶ (ronde baru) DESCRIPTION | FINISHED
   └─ belum ──▶ DESCRIPTION (ronde deskripsi berikutnya)
```

---

## 11. Edge Cases & Penanganan

| Kasus | Penanganan |
|---|---|
| Jumlah pemain < 3 | Tombol Start dinonaktifkan + pesan validasi |
| Komposisi penyusup ≥ civilian | Ditolak validasi; beri rekomendasi otomatis |
| Voting seri | Voting ulang di antara kandidat seri; bila tetap → acak (opsi Host) |
| Semua penyusup tereliminasi dalam satu ronde | Langsung ke kondisi menang Civilian |
| Kategori terpilih terlalu sedikit pasangannya | Fallback ke "Umum" + peringatan |
| Refresh / tab tertutup di tengah game | State di memori hilang → tampilkan konfirmasi sebelum keluar; (Fase 2: auto-save state ke localStorage agar bisa dipulihkan) |
| Nama pemain kosong | Isi default `Pemain N` |

---

## 12. Metrik Keberhasilan

- **Aktivasi:** % pengunjung yang menyelesaikan minimal 1 ronde.
- **Kedalaman sesi:** rata-rata ronde per sesi (target ≥ 3).
- **Instalasi PWA:** jumlah event `appinstalled`.
- **Performa:** Lighthouse Performance & PWA score, Core Web Vitals (LCP, INP, CLS).
- *(Bila ingin analitik, gunakan yang privacy-friendly & tetap tidak mengirim data personal. Bisa juga tanpa analitik sama sekali sesuai semangat zero-backend.)*

---

## 13. Roadmap & Prioritas

| Prioritas | Item | Fase |
|:---:|---|:---:|
| P0 | Game core loop lengkap (reveal → deskripsi → voting → eliminasi → menang) | 1 |
| P0 | Mekanik Mr. White + kondisi menang lengkap | 1 |
| P0 | PWA installable + offline penuh | 1 |
| P1 | Sistem skor & ranking antar ronde | 1 |
| P1 | Bank kata berkategori (seed Indonesia) | 1 |
| P2 | Persistensi lokal (skor & riwayat via localStorage) | 2 |
| P2 | Bank kata custom buatan pemain | 2 |
| P2 | Voting rahasia digital (gilir perangkat) | 2 |
| P3 | Tema gelap & preferensi | 2 |

---

## Lampiran A — Seed Pasangan Kata (Bahasa Indonesia)

| Civilian | Undercover | Kategori |
|---|---|---|
| Kopi | Teh | Minuman |
| Nasi Goreng | Mie Goreng | Makanan |
| Bakso | Mie Ayam | Makanan |
| Rendang | Gulai | Makanan |
| Sate | Tongseng | Makanan |
| Es Krim | Es Puter | Makanan |
| Kucing | Anjing | Hewan |
| Ayam | Bebek | Hewan |
| Harimau | Singa | Hewan |
| Pantai | Danau | Tempat |
| Gunung | Bukit | Tempat |
| Sekolah | Kampus | Tempat |
| Pasar | Mall | Tempat |
| Dokter | Perawat | Profesi |
| Polisi | Tentara | Profesi |
| Guru | Dosen | Profesi |
| Sepeda | Motor | Objek |
| Bus | Kereta | Objek |
| Laptop | Komputer | Objek |
| Handphone | Tablet | Objek |
| Payung | Jas Hujan | Objek |
| Gitar | Ukulele | Objek |
| Sepatu | Sandal | Objek |
| Sepak Bola | Futsal | Olahraga |
| Bulu Tangkis | Tenis | Olahraga |
| Basket | Voli | Olahraga |
| Hujan | Salju | Umum |
| Matahari | Bulan | Umum |
| Apel | Pir | Makanan |
| Jeruk | Lemon | Makanan |

> Untuk produksi, targetkan minimal 100–150 pasangan agar tidak cepat berulang; jaga tiap pasangan tetap "dekat tapi berbeda".

## Lampiran B — Glosarium
- **Civilian:** warga sipil, menerima kata mayoritas.
- **Undercover:** penyusup, menerima kata mirip namun berbeda.
- **Mr. White:** penyusup tanpa kata; menang bila menebak kata Civilian saat tereliminasi.
- **Pass & Play:** mode satu perangkat yang diedarkan bergiliran antar pemain.
- **Hold-to-reveal:** kata hanya terlihat selama kartu ditekan-tahan.
- **Zero backend:** tidak ada server/database; semua berjalan di perangkat.
