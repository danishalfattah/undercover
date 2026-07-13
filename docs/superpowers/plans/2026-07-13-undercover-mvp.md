# Undercover PWA Fase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Fase 1 MVP of Undercover — an offline-first, zero-backend, mobile-first PWA party game — per `docs/superpowers/specs/2026-07-13-undercover-mvp-design.md`.

**Architecture:** Next.js App Router static export (`output: 'export'`), Tailwind CSS v4 for styling, Zustand for a single in-memory game store, Serwist for the PWA service worker/manifest. Single-page app: one `app/page.tsx` switches between 8 screen components based on `GameState.status`. Pure game logic (role allocation, win conditions, scoring, tie-break) lives in a dependency-free `lib/gameLogic.ts`, unit-tested with Vitest.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript 5, Tailwind CSS 4, Zustand 5.0.14, Serwist 9.5.11 (`serwist` + `@serwist/next`), Vitest 4.1.10 + @vitejs/plugin-react 6.0.3.

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime and dev dependencies**

Run:
```bash
npm install zustand@5.0.14 serwist@9.5.11 @serwist/next@9.5.11
npm install -D vitest@4.1.10 @vitejs/plugin-react@6.0.3
```

Expected: `package.json` gains `zustand`, `serwist`, `@serwist/next` under `dependencies`, and `vitest`, `@vitejs/plugin-react` under `devDependencies`. `package-lock.json` updates.

- [ ] **Step 2: Add a `test` script**

Modify `package.json` scripts block to:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: Verify install**

Run: `npm run test -- --version 2>&1 | head -5` (or `npx vitest --version`)
Expected: prints a vitest version number, no errors.

---

## Task 2: Core types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// lib/types.ts

export type Role = 'CIVILIAN' | 'UNDERCOVER' | 'MR_WHITE';

export type WordCategory =
  | 'Umum'
  | 'Makanan'
  | 'Minuman'
  | 'Hewan'
  | 'Tempat'
  | 'Profesi'
  | 'Objek'
  | 'Olahraga';

export type WordPair = {
  civilian: string;
  undercover: string;
  category: WordCategory;
};

export type Player = {
  id: string;
  name: string;
  role: Role;
  secretWord: string | null; // null for Mr. White
  isAlive: boolean;
  score: number; // cumulative across rounds in this session
  turnOrder: number;
};

export type GameStatus =
  | 'SETUP'
  | 'REVEAL'
  | 'DESCRIPTION'
  | 'VOTING'
  | 'ELIMINATION'
  | 'MR_WHITE_GUESS'
  | 'ROUND_RESULT'
  | 'FINISHED';

export type RoleConfig = {
  civilianCount: number;
  undercoverCount: number;
  mrWhiteCount: number;
};

export type GameConfig = RoleConfig & {
  category: WordCategory | 'Acak';
};

export type WinnerSide = 'CIVILIAN' | 'IMPOSTOR' | 'MR_WHITE_GUESS' | null;

export type GameState = {
  status: GameStatus;
  roundNumber: number;
  wordPair: { civilian: string; undercover: string; category: string } | null;
  players: Player[];
  currentTurnIndex: number;
  revealIndex: number;
  eliminationCandidates: string[]; // player ids tied in the last vote; empty = no tie in progress
  config: GameConfig;
  lastEliminatedId: string | null;
  winner: WinnerSide;
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (file has no consumers yet, so this only checks syntax).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add core game types"
```

---

## Task 3: Word bank

**Files:**
- Create: `lib/words.ts`
- Test: `lib/words.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/words.test.ts
import { describe, it, expect } from 'vitest';
import { WORD_PAIRS } from './words';

describe('WORD_PAIRS', () => {
  it('has at least 100 pairs', () => {
    expect(WORD_PAIRS.length).toBeGreaterThanOrEqual(100);
  });

  it('every pair has distinct non-empty civilian/undercover words', () => {
    for (const pair of WORD_PAIRS) {
      expect(pair.civilian.trim().length).toBeGreaterThan(0);
      expect(pair.undercover.trim().length).toBeGreaterThan(0);
      expect(pair.civilian.toLowerCase()).not.toBe(pair.undercover.toLowerCase());
    }
  });

  it('every pair has a valid category', () => {
    const validCategories = new Set([
      'Umum', 'Makanan', 'Minuman', 'Hewan', 'Tempat', 'Profesi', 'Objek', 'Olahraga',
    ]);
    for (const pair of WORD_PAIRS) {
      expect(validCategories.has(pair.category)).toBe(true);
    }
  });

  it('has no exact duplicate pairs', () => {
    const seen = new Set<string>();
    for (const pair of WORD_PAIRS) {
      const key = `${pair.civilian.toLowerCase()}|${pair.undercover.toLowerCase()}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/words.test.ts`
Expected: FAIL — `lib/words.ts` does not exist / `WORD_PAIRS` not found.

- [ ] **Step 3: Write the word bank**

Create `lib/words.ts` with the `WordPair` import and a `WORD_PAIRS` array of **at least 100 unique pairs** across all 8 categories, each pair "close but different" (per FR-13). Start with the 30 PRD seed pairs, then add ~75 more original Indonesian pairs maintaining the same style. Full content:

```typescript
// lib/words.ts
import type { WordPair } from './types';

export const WORD_PAIRS: WordPair[] = [
  // Minuman
  { civilian: 'Kopi', undercover: 'Teh', category: 'Minuman' },
  { civilian: 'Es Teh', undercover: 'Es Jeruk', category: 'Minuman' },
  { civilian: 'Susu', undercover: 'Susu Kedelai', category: 'Minuman' },
  { civilian: 'Jus Alpukat', undercover: 'Jus Mangga', category: 'Minuman' },
  { civilian: 'Air Mineral', undercover: 'Air Soda', category: 'Minuman' },
  { civilian: 'Teh Tarik', undercover: 'Kopi Susu', category: 'Minuman' },
  { civilian: 'Cokelat Panas', undercover: 'Kopi Susu Panas', category: 'Minuman' },
  { civilian: 'Es Kelapa Muda', undercover: 'Es Cincau', category: 'Minuman' },
  { civilian: 'Wedang Jahe', undercover: 'Bandrek', category: 'Minuman' },
  { civilian: 'Soda Gembira', undercover: 'Es Krim Soda', category: 'Minuman' },

  // Makanan
  { civilian: 'Nasi Goreng', undercover: 'Mie Goreng', category: 'Makanan' },
  { civilian: 'Bakso', undercover: 'Mie Ayam', category: 'Makanan' },
  { civilian: 'Rendang', undercover: 'Gulai', category: 'Makanan' },
  { civilian: 'Sate', undercover: 'Tongseng', category: 'Makanan' },
  { civilian: 'Es Krim', undercover: 'Es Puter', category: 'Makanan' },
  { civilian: 'Apel', undercover: 'Pir', category: 'Makanan' },
  { civilian: 'Jeruk', undercover: 'Lemon', category: 'Makanan' },
  { civilian: 'Nasi Padang', undercover: 'Nasi Uduk', category: 'Makanan' },
  { civilian: 'Soto Ayam', undercover: 'Sop Ayam', category: 'Makanan' },
  { civilian: 'Gado-Gado', undercover: 'Pecel', category: 'Makanan' },
  { civilian: 'Martabak Manis', undercover: 'Martabak Telur', category: 'Makanan' },
  { civilian: 'Roti Bakar', undercover: 'Roti Panggang', category: 'Makanan' },
  { civilian: 'Keripik Singkong', undercover: 'Keripik Pisang', category: 'Makanan' },
  { civilian: 'Kerupuk', undercover: 'Rempeyek', category: 'Makanan' },
  { civilian: 'Donat', undercover: 'Bolu', category: 'Makanan' },
  { civilian: 'Pisang Goreng', undercover: 'Tempe Goreng', category: 'Makanan' },
  { civilian: 'Rawon', undercover: 'Semur', category: 'Makanan' },
  { civilian: 'Nasi Kuning', undercover: 'Nasi Kebuli', category: 'Makanan' },
  { civilian: 'Batagor', undercover: 'Siomay', category: 'Makanan' },
  { civilian: 'Lontong Sayur', undercover: 'Ketupat Sayur', category: 'Makanan' },
  { civilian: 'Ayam Geprek', undercover: 'Ayam Penyet', category: 'Makanan' },
  { civilian: 'Semangka', undercover: 'Melon', category: 'Makanan' },
  { civilian: 'Mangga', undercover: 'Pepaya', category: 'Makanan' },
  { civilian: 'Rambutan', undercover: 'Kelengkeng', category: 'Makanan' },
  { civilian: 'Durian', undercover: 'Nangka', category: 'Makanan' },
  { civilian: 'Telur Dadar', undercover: 'Telur Ceplok', category: 'Makanan' },
  { civilian: 'Tahu Goreng', undercover: 'Tempe Goreng', category: 'Makanan' },
  { civilian: 'Sambal Terasi', undercover: 'Sambal Matah', category: 'Makanan' },
  { civilian: 'Kue Lapis', undercover: 'Kue Lumpur', category: 'Makanan' },
  { civilian: 'Cendol', undercover: 'Es Dawet', category: 'Makanan' },
  { civilian: 'Nasi Liwet', undercover: 'Nasi Bakar', category: 'Makanan' },

  // Hewan
  { civilian: 'Kucing', undercover: 'Anjing', category: 'Hewan' },
  { civilian: 'Ayam', undercover: 'Bebek', category: 'Hewan' },
  { civilian: 'Harimau', undercover: 'Singa', category: 'Hewan' },
  { civilian: 'Kambing', undercover: 'Domba', category: 'Hewan' },
  { civilian: 'Sapi', undercover: 'Kerbau', category: 'Hewan' },
  { civilian: 'Ular', undercover: 'Belut', category: 'Hewan' },
  { civilian: 'Burung Merpati', undercover: 'Burung Dara', category: 'Hewan' },
  { civilian: 'Kelinci', undercover: 'Marmut', category: 'Hewan' },
  { civilian: 'Gajah', undercover: 'Badak', category: 'Hewan' },
  { civilian: 'Buaya', undercover: 'Komodo', category: 'Hewan' },
  { civilian: 'Kupu-Kupu', undercover: 'Ngengat', category: 'Hewan' },
  { civilian: 'Semut', undercover: 'Rayap', category: 'Hewan' },
  { civilian: 'Ikan Lele', undercover: 'Ikan Gabus', category: 'Hewan' },
  { civilian: 'Udang', undercover: 'Kepiting', category: 'Hewan' },
  { civilian: 'Merpati', undercover: 'Elang', category: 'Hewan' },
  { civilian: 'Monyet', undercover: 'Orangutan', category: 'Hewan' },
  { civilian: 'Kura-Kura', undercover: 'Penyu', category: 'Hewan' },
  { civilian: 'Katak', undercover: 'Kodok', category: 'Hewan' },

  // Tempat
  { civilian: 'Pantai', undercover: 'Danau', category: 'Tempat' },
  { civilian: 'Gunung', undercover: 'Bukit', category: 'Tempat' },
  { civilian: 'Sekolah', undercover: 'Kampus', category: 'Tempat' },
  { civilian: 'Pasar', undercover: 'Mall', category: 'Tempat' },
  { civilian: 'Perpustakaan', undercover: 'Toko Buku', category: 'Tempat' },
  { civilian: 'Rumah Sakit', undercover: 'Puskesmas', category: 'Tempat' },
  { civilian: 'Bandara', undercover: 'Stasiun', category: 'Tempat' },
  { civilian: 'Kebun Binatang', undercover: 'Taman Safari', category: 'Tempat' },
  { civilian: 'Warung', undercover: 'Restoran', category: 'Tempat' },
  { civilian: 'Masjid', undercover: 'Musala', category: 'Tempat' },
  { civilian: 'Sawah', undercover: 'Ladang', category: 'Tempat' },
  { civilian: 'Hutan', undercover: 'Kebun', category: 'Tempat' },
  { civilian: 'Kolam Renang', undercover: 'Pemandian Air Panas', category: 'Tempat' },
  { civilian: 'Bioskop', undercover: 'Teater', category: 'Tempat' },
  { civilian: 'Apartemen', undercover: 'Kos-Kosan', category: 'Tempat' },

  // Profesi
  { civilian: 'Dokter', undercover: 'Perawat', category: 'Profesi' },
  { civilian: 'Polisi', undercover: 'Tentara', category: 'Profesi' },
  { civilian: 'Guru', undercover: 'Dosen', category: 'Profesi' },
  { civilian: 'Koki', undercover: 'Baker', category: 'Profesi' },
  { civilian: 'Petani', undercover: 'Nelayan', category: 'Profesi' },
  { civilian: 'Pilot', undercover: 'Masinis', category: 'Profesi' },
  { civilian: 'Wartawan', undercover: 'Fotografer', category: 'Profesi' },
  { civilian: 'Pengacara', undercover: 'Hakim', category: 'Profesi' },
  { civilian: 'Arsitek', undercover: 'Insinyur Sipil', category: 'Profesi' },
  { civilian: 'Penyanyi', undercover: 'Musisi', category: 'Profesi' },
  { civilian: 'Satpam', undercover: 'Petugas Parkir', category: 'Profesi' },
  { civilian: 'Kasir', undercover: 'Pelayan', category: 'Profesi' },

  // Objek
  { civilian: 'Sepeda', undercover: 'Motor', category: 'Objek' },
  { civilian: 'Bus', undercover: 'Kereta', category: 'Objek' },
  { civilian: 'Laptop', undercover: 'Komputer', category: 'Objek' },
  { civilian: 'Handphone', undercover: 'Tablet', category: 'Objek' },
  { civilian: 'Payung', undercover: 'Jas Hujan', category: 'Objek' },
  { civilian: 'Gitar', undercover: 'Ukulele', category: 'Objek' },
  { civilian: 'Sepatu', undercover: 'Sandal', category: 'Objek' },
  { civilian: 'Kacamata', undercover: 'Kacamata Hitam', category: 'Objek' },
  { civilian: 'Dompet', undercover: 'Tas', category: 'Objek' },
  { civilian: 'Jam Tangan', undercover: 'Jam Dinding', category: 'Objek' },
  { civilian: 'Pensil', undercover: 'Pulpen', category: 'Objek' },
  { civilian: 'Buku Tulis', undercover: 'Buku Gambar', category: 'Objek' },
  { civilian: 'Kipas Angin', undercover: 'AC', category: 'Objek' },
  { civilian: 'Kulkas', undercover: 'Freezer', category: 'Objek' },
  { civilian: 'Sapu', undercover: 'Pel', category: 'Objek' },
  { civilian: 'Bantal', undercover: 'Guling', category: 'Objek' },
  { civilian: 'Selimut', undercover: 'Sarung', category: 'Objek' },
  { civilian: 'Cangkir', undercover: 'Gelas', category: 'Objek' },
  { civilian: 'Piring', undercover: 'Mangkuk', category: 'Objek' },
  { civilian: 'Sendok', undercover: 'Garpu', category: 'Objek' },
  { civilian: 'Kompor Gas', undercover: 'Kompor Listrik', category: 'Objek' },
  { civilian: 'Ember', undercover: 'Baskom', category: 'Objek' },
  { civilian: 'Koper', undercover: 'Ransel', category: 'Objek' },
  { civilian: 'Kalkulator', undercover: 'Sempoa', category: 'Objek' },
  { civilian: 'Radio', undercover: 'Televisi', category: 'Objek' },

  // Olahraga
  { civilian: 'Sepak Bola', undercover: 'Futsal', category: 'Olahraga' },
  { civilian: 'Bulu Tangkis', undercover: 'Tenis', category: 'Olahraga' },
  { civilian: 'Basket', undercover: 'Voli', category: 'Olahraga' },
  { civilian: 'Renang', undercover: 'Selam', category: 'Olahraga' },
  { civilian: 'Lari', undercover: 'Jalan Cepat', category: 'Olahraga' },
  { civilian: 'Panjat Tebing', undercover: 'Panjat Pinang', category: 'Olahraga' },
  { civilian: 'Tinju', undercover: 'Pencak Silat', category: 'Olahraga' },
  { civilian: 'Bersepeda', undercover: 'Bersepeda Gunung', category: 'Olahraga' },
  { civilian: 'Golf', undercover: 'Mini Golf', category: 'Olahraga' },
  { civilian: 'Panahan', undercover: 'Menembak', category: 'Olahraga' },

  // Umum
  { civilian: 'Hujan', undercover: 'Salju', category: 'Umum' },
  { civilian: 'Matahari', undercover: 'Bulan', category: 'Umum' },
  { civilian: 'Pagi', undercover: 'Sore', category: 'Umum' },
  { civilian: 'Musim Panas', undercover: 'Musim Kemarau', category: 'Umum' },
  { civilian: 'Pelangi', undercover: 'Aurora', category: 'Umum' },
  { civilian: 'Api', undercover: 'Petir', category: 'Umum' },
  { civilian: 'Angin', undercover: 'Badai', category: 'Umum' },
  { civilian: 'Gempa', undercover: 'Tsunami', category: 'Umum' },
  { civilian: 'Bendera', undercover: 'Pita', category: 'Umum' },
  { civilian: 'Lampu Merah', undercover: 'Lampu Kuning', category: 'Umum' },
  { civilian: 'Ulang Tahun', undercover: 'Pernikahan', category: 'Umum' },
  { civilian: 'Liburan', undercover: 'Cuti', category: 'Umum' },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/words.test.ts`
Expected: PASS (4/4 tests). If the count test fails, add more pairs to reach 100+ — count the array length first with `node -e "console.log(require('./lib/words.ts'))"` is not viable for `.ts`; instead rely on the Vitest failure message which reports actual vs expected count, and top up any category with additional close-but-different Indonesian pairs until it passes.

- [ ] **Step 5: Commit**

```bash
git add lib/words.ts lib/words.test.ts
git commit -m "feat: add 100+ word pair bank"
```

---

## Task 4: Game logic — role composition & validation

**Files:**
- Create: `lib/gameLogic.ts`
- Test: `lib/gameLogic.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/gameLogic.test.ts
import { describe, it, expect } from 'vitest';
import { recommendComposition, validateComposition } from './gameLogic';

describe('recommendComposition', () => {
  it('matches the PRD table for known player counts', () => {
    expect(recommendComposition(3)).toEqual({ civilianCount: 2, undercoverCount: 1, mrWhiteCount: 0 });
    expect(recommendComposition(5)).toEqual({ civilianCount: 3, undercoverCount: 1, mrWhiteCount: 1 });
    expect(recommendComposition(8)).toEqual({ civilianCount: 5, undercoverCount: 2, mrWhiteCount: 1 });
    expect(recommendComposition(10)).toEqual({ civilianCount: 6, undercoverCount: 3, mrWhiteCount: 1 });
  });

  it('always satisfies undercover+mrWhite < civilian for 3..20 players', () => {
    for (let n = 3; n <= 20; n++) {
      const c = recommendComposition(n);
      expect(c.civilianCount + c.undercoverCount + c.mrWhiteCount).toBe(n);
      expect(c.undercoverCount + c.mrWhiteCount).toBeLessThan(c.civilianCount);
    }
  });
});

describe('validateComposition', () => {
  it('rejects fewer than 3 total players', () => {
    const result = validateComposition({ civilianCount: 1, undercoverCount: 1, mrWhiteCount: 0 }, 2);
    expect(result.valid).toBe(false);
  });

  it('rejects when impostors are not fewer than civilians', () => {
    const result = validateComposition({ civilianCount: 2, undercoverCount: 2, mrWhiteCount: 0 }, 4);
    expect(result.valid).toBe(false);
  });

  it('rejects when counts do not sum to total players', () => {
    const result = validateComposition({ civilianCount: 3, undercoverCount: 1, mrWhiteCount: 0 }, 5);
    expect(result.valid).toBe(false);
  });

  it('accepts a valid composition', () => {
    const result = validateComposition({ civilianCount: 3, undercoverCount: 1, mrWhiteCount: 1 }, 5);
    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/gameLogic.test.ts`
Expected: FAIL — `lib/gameLogic.ts` does not exist.

- [ ] **Step 3: Implement composition logic**

```typescript
// lib/gameLogic.ts
import type { RoleConfig } from './types';

/** PRD §7.1 recommended composition table, extended by formula for 11-20. */
export function recommendComposition(totalPlayers: number): RoleConfig {
  const table: Record<number, RoleConfig> = {
    3: { civilianCount: 2, undercoverCount: 1, mrWhiteCount: 0 },
    4: { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 0 },
    5: { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 1 },
    6: { civilianCount: 4, undercoverCount: 1, mrWhiteCount: 1 },
    7: { civilianCount: 4, undercoverCount: 2, mrWhiteCount: 1 },
    8: { civilianCount: 5, undercoverCount: 2, mrWhiteCount: 1 },
    9: { civilianCount: 6, undercoverCount: 2, mrWhiteCount: 1 },
    10: { civilianCount: 6, undercoverCount: 3, mrWhiteCount: 1 },
  };

  if (table[totalPlayers]) {
    return table[totalPlayers];
  }

  // 11-20: undercoverCount scales, mrWhiteCount fixed at 1, civilian takes the rest.
  let undercoverCount: number;
  let mrWhiteCount = 1;
  if (totalPlayers <= 12) {
    undercoverCount = 3;
  } else if (totalPlayers <= 15) {
    undercoverCount = 3;
    mrWhiteCount = totalPlayers >= 14 ? 2 : 1;
  } else {
    undercoverCount = 4;
    mrWhiteCount = totalPlayers >= 18 ? 2 : 1;
  }
  const civilianCount = totalPlayers - undercoverCount - mrWhiteCount;
  return { civilianCount, undercoverCount, mrWhiteCount };
}

export type CompositionValidation = { valid: true } | { valid: false; reason: string };

/** PRD §7.1 validation: undercover+mrWhite < civilian, total >= 3, counts sum to total. */
export function validateComposition(config: RoleConfig, totalPlayers: number): CompositionValidation {
  if (totalPlayers < 3) {
    return { valid: false, reason: 'Jumlah pemain minimal 3 orang' };
  }
  const sum = config.civilianCount + config.undercoverCount + config.mrWhiteCount;
  if (sum !== totalPlayers) {
    return { valid: false, reason: 'Jumlah komposisi peran harus sama dengan jumlah pemain' };
  }
  if (config.undercoverCount + config.mrWhiteCount >= config.civilianCount) {
    return { valid: false, reason: 'Jumlah penyusup harus lebih sedikit daripada Civilian' };
  }
  return { valid: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/gameLogic.test.ts`
Expected: PASS (all `recommendComposition`/`validateComposition` tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/gameLogic.ts lib/gameLogic.test.ts
git commit -m "feat: add role composition recommendation and validation"
```

---

## Task 5: Game logic — role allocation (Fisher-Yates)

**Files:**
- Modify: `lib/gameLogic.ts`
- Modify: `lib/gameLogic.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/gameLogic.test.ts`:

```typescript
import { allocateRoles } from './gameLogic';
import type { WordPair } from './types';

describe('allocateRoles', () => {
  const wordPair: WordPair = { civilian: 'Kopi', undercover: 'Teh', category: 'Minuman' };
  const names = ['Ani', 'Budi', 'Citra', 'Dedi', 'Eka'];
  const config = { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 1 };

  it('assigns exactly the configured count of each role', () => {
    const players = allocateRoles(names, config, wordPair);
    expect(players.filter((p) => p.role === 'CIVILIAN')).toHaveLength(3);
    expect(players.filter((p) => p.role === 'UNDERCOVER')).toHaveLength(1);
    expect(players.filter((p) => p.role === 'MR_WHITE')).toHaveLength(1);
  });

  it('gives civilians and undercovers a secret word, and Mr. White null', () => {
    const players = allocateRoles(names, config, wordPair);
    for (const p of players) {
      if (p.role === 'CIVILIAN') expect(['Kopi', 'Teh']).toContain(p.secretWord);
      if (p.role === 'UNDERCOVER') expect(['Kopi', 'Teh']).toContain(p.secretWord);
      if (p.role === 'MR_WHITE') expect(p.secretWord).toBeNull();
    }
  });

  it('gives all civilians the same word, distinct from all undercovers word', () => {
    const players = allocateRoles(names, config, wordPair);
    const civilianWords = new Set(players.filter((p) => p.role === 'CIVILIAN').map((p) => p.secretWord));
    const undercoverWords = new Set(players.filter((p) => p.role === 'UNDERCOVER').map((p) => p.secretWord));
    expect(civilianWords.size).toBe(1);
    expect(undercoverWords.size).toBe(1);
    expect([...civilianWords][0]).not.toBe([...undercoverWords][0]);
  });

  it('preserves player names and starts everyone alive with score 0', () => {
    const players = allocateRoles(names, config, wordPair);
    expect(players.map((p) => p.name).sort()).toEqual([...names].sort());
    for (const p of players) {
      expect(p.isAlive).toBe(true);
      expect(p.score).toBe(0);
    }
  });

  it('produces varied allocations across many runs (not always the same order)', () => {
    const allocations = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const players = allocateRoles(names, config, wordPair);
      const roleOrder = players.map((p) => `${p.name}:${p.role}`).join(',');
      allocations.add(roleOrder);
    }
    expect(allocations.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/gameLogic.test.ts`
Expected: FAIL — `allocateRoles` is not exported.

- [ ] **Step 3: Implement allocation with Fisher-Yates shuffle**

Append to `lib/gameLogic.ts`:

```typescript
import type { Player, RoleConfig, WordPair, Role } from './types';

/** In-place Fisher-Yates shuffle; returns the same array for convenience. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `player-${Date.now()}-${idCounter}`;
}

/**
 * FR-07/FR-08: allocate roles via Fisher-Yates and randomize which of the
 * two words (civilian/undercover) goes to which role each round.
 */
export function allocateRoles(names: string[], config: RoleConfig, wordPair: WordPair): Player[] {
  const roles: Role[] = [
    ...Array(config.civilianCount).fill('CIVILIAN'),
    ...Array(config.undercoverCount).fill('UNDERCOVER'),
    ...Array(config.mrWhiteCount).fill('MR_WHITE'),
  ];
  const shuffledRoles = shuffle(roles);
  const shuffledNames = shuffle(names);

  // FR-08: randomize which word is "civilian's" word for this round.
  const swapSides = Math.random() < 0.5;
  const civilianWord = swapSides ? wordPair.undercover : wordPair.civilian;
  const undercoverWord = swapSides ? wordPair.civilian : wordPair.undercover;

  return shuffledNames.map((name, index) => {
    const role = shuffledRoles[index];
    const secretWord = role === 'CIVILIAN' ? civilianWord : role === 'UNDERCOVER' ? undercoverWord : null;
    return {
      id: nextId(),
      name,
      role,
      secretWord,
      isAlive: true,
      score: 0,
      turnOrder: 0, // assigned later in Task 6
    };
  });
}
```

Note: the test asserts civilian/undercover words come from `{Kopi, Teh}` regardless of the random side-swap, so it stays correct either way.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/gameLogic.test.ts`
Expected: PASS (all allocation tests green; the "varied allocations" test may rarely flake with astronomically low probability — if it fails, rerun once to confirm it's not a bug).

- [ ] **Step 5: Commit**

```bash
git add lib/gameLogic.ts lib/gameLogic.test.ts
git commit -m "feat: add Fisher-Yates role allocation"
```

---

## Task 6: Game logic — turn order, win conditions, scoring, tie-break

**Files:**
- Modify: `lib/gameLogic.ts`
- Modify: `lib/gameLogic.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `lib/gameLogic.test.ts`:

```typescript
import { assignTurnOrder, checkWinner, calculateScores, findTiedCandidates } from './gameLogic';
import type { Player } from './types';

function makePlayer(overrides: Partial<Player>): Player {
  return {
    id: overrides.id ?? 'p1',
    name: overrides.name ?? 'Test',
    role: overrides.role ?? 'CIVILIAN',
    secretWord: overrides.secretWord ?? 'Kopi',
    isAlive: overrides.isAlive ?? true,
    score: overrides.score ?? 0,
    turnOrder: overrides.turnOrder ?? 0,
  };
}

describe('assignTurnOrder', () => {
  it('assigns turnOrder 0..n-1 to all players', () => {
    const players = [makePlayer({ id: 'a' }), makePlayer({ id: 'b' }), makePlayer({ id: 'c' })];
    const ordered = assignTurnOrder(players);
    expect(ordered.map((p) => p.turnOrder).sort((x, y) => x - y)).toEqual([0, 1, 2]);
  });

  it('never places Mr. White first when more than one player exists', () => {
    for (let i = 0; i < 30; i++) {
      const players = [
        makePlayer({ id: 'a', role: 'MR_WHITE' }),
        makePlayer({ id: 'b', role: 'CIVILIAN' }),
        makePlayer({ id: 'c', role: 'CIVILIAN' }),
      ];
      const ordered = assignTurnOrder(players);
      const first = ordered.find((p) => p.turnOrder === 0);
      expect(first?.role).not.toBe('MR_WHITE');
    }
  });
});

describe('checkWinner', () => {
  it('declares Civilian winner when all impostors are eliminated', () => {
    const players = [
      makePlayer({ id: 'a', role: 'CIVILIAN', isAlive: true }),
      makePlayer({ id: 'b', role: 'CIVILIAN', isAlive: true }),
      makePlayer({ id: 'c', role: 'UNDERCOVER', isAlive: false }),
      makePlayer({ id: 'd', role: 'MR_WHITE', isAlive: false }),
    ];
    expect(checkWinner(players)).toBe('CIVILIAN');
  });

  it('declares impostor winner when impostors >= alive civilians', () => {
    const players = [
      makePlayer({ id: 'a', role: 'CIVILIAN', isAlive: true }),
      makePlayer({ id: 'b', role: 'UNDERCOVER', isAlive: true }),
      makePlayer({ id: 'c', role: 'CIVILIAN', isAlive: false }),
    ];
    expect(checkWinner(players)).toBe('IMPOSTOR');
  });

  it('returns null when no win condition is met yet', () => {
    const players = [
      makePlayer({ id: 'a', role: 'CIVILIAN', isAlive: true }),
      makePlayer({ id: 'b', role: 'CIVILIAN', isAlive: true }),
      makePlayer({ id: 'c', role: 'UNDERCOVER', isAlive: true }),
    ];
    expect(checkWinner(players)).toBeNull();
  });
});

describe('findTiedCandidates', () => {
  it('returns empty array when there is a single max vote count', () => {
    const result = findTiedCandidates([{ id: 'a', votes: 3 }, { id: 'b', votes: 1 }]);
    expect(result).toEqual([]);
  });

  it('returns all ids sharing the max vote count when tied', () => {
    const result = findTiedCandidates([{ id: 'a', votes: 2 }, { id: 'b', votes: 2 }, { id: 'c', votes: 1 }]);
    expect(result.sort()).toEqual(['a', 'b']);
  });
});

describe('calculateScores', () => {
  it('awards +2 to each civilian when Civilian wins', () => {
    const players = [
      makePlayer({ id: 'a', role: 'CIVILIAN', isAlive: true, score: 0 }),
      makePlayer({ id: 'b', role: 'UNDERCOVER', isAlive: false, score: 0 }),
    ];
    const scored = calculateScores(players, 'CIVILIAN', false);
    expect(scored.find((p) => p.id === 'a')?.score).toBe(2);
    expect(scored.find((p) => p.id === 'b')?.score).toBe(0);
  });

  it('awards +10 to surviving undercovers when impostors win', () => {
    const players = [
      makePlayer({ id: 'a', role: 'UNDERCOVER', isAlive: true, score: 0 }),
      makePlayer({ id: 'b', role: 'MR_WHITE', isAlive: true, score: 0 }),
      makePlayer({ id: 'c', role: 'CIVILIAN', isAlive: false, score: 0 }),
    ];
    const scored = calculateScores(players, 'IMPOSTOR', false);
    expect(scored.find((p) => p.id === 'a')?.score).toBe(10);
    expect(scored.find((p) => p.id === 'b')?.score).toBe(6);
  });

  it('awards +6 to Mr. White on a correct guess win, preserving prior score', () => {
    const players = [
      makePlayer({ id: 'a', role: 'MR_WHITE', isAlive: false, score: 4 }),
      makePlayer({ id: 'b', role: 'CIVILIAN', isAlive: true, score: 1 }),
    ];
    const scored = calculateScores(players, 'MR_WHITE_GUESS', true);
    expect(scored.find((p) => p.id === 'a')?.score).toBe(10);
    expect(scored.find((p) => p.id === 'b')?.score).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/gameLogic.test.ts`
Expected: FAIL — `assignTurnOrder`, `checkWinner`, `calculateScores`, `findTiedCandidates` not exported.

- [ ] **Step 3: Implement the remaining logic**

Append to `lib/gameLogic.ts`:

```typescript
import type { WinnerSide } from './types';

/** §7.3: randomize speaking order; Mr. White never goes first (when others exist). */
export function assignTurnOrder(players: Player[]): Player[] {
  let shuffled = shuffle(players);
  if (players.length > 1) {
    while (shuffled[0].role === 'MR_WHITE') {
      shuffled = shuffle(players);
    }
  }
  return shuffled.map((p, index) => ({ ...p, turnOrder: index }));
}

/** §7.2 win conditions. Returns null if the game should continue. */
export function checkWinner(players: Player[]): 'CIVILIAN' | 'IMPOSTOR' | null {
  const aliveCivilians = players.filter((p) => p.role === 'CIVILIAN' && p.isAlive).length;
  const aliveImpostors = players.filter((p) => p.role !== 'CIVILIAN' && p.isAlive).length;

  if (aliveImpostors === 0) {
    return 'CIVILIAN';
  }
  if (aliveImpostors >= aliveCivilians) {
    return 'IMPOSTOR';
  }
  return null;
}

/** §11: detect a tie among the top-voted candidates. Empty array = no tie. */
export function findTiedCandidates(voteCounts: { id: string; votes: number }[]): string[] {
  if (voteCounts.length === 0) return [];
  const max = Math.max(...voteCounts.map((v) => v.votes));
  const tied = voteCounts.filter((v) => v.votes === max);
  return tied.length > 1 ? tied.map((v) => v.id) : [];
}

/**
 * §7.4 scoring (bonus-voting row omitted per design decision).
 * `winner` is the side that won; `mrWhiteGuessedCorrectly` covers the
 * instant-win-by-guess case, which also pays out the impostor-side bonus.
 */
export function calculateScores(
  players: Player[],
  winner: WinnerSide,
  mrWhiteGuessedCorrectly: boolean
): Player[] {
  return players.map((p) => {
    let delta = 0;
    if (winner === 'CIVILIAN' && p.role === 'CIVILIAN') {
      delta = 2;
    } else if (winner === 'IMPOSTOR') {
      if (p.role === 'UNDERCOVER' && p.isAlive) delta = 10;
      if (p.role === 'MR_WHITE' && p.isAlive) delta = 6;
    } else if (winner === 'MR_WHITE_GUESS' && mrWhiteGuessedCorrectly && p.role === 'MR_WHITE') {
      delta = 6;
    }
    return { ...p, score: p.score + delta };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/gameLogic.test.ts`
Expected: PASS — all tests in the file green (composition, allocation, turn order, win conditions, tie-break, scoring).

- [ ] **Step 5: Commit**

```bash
git add lib/gameLogic.ts lib/gameLogic.test.ts
git commit -m "feat: add turn order, win conditions, tie-break, and scoring logic"
```

---

## Task 7: Zustand store

**Files:**
- Create: `lib/store.ts`
- Test: `lib/store.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './store';

function getState() {
  return useGameStore.getState();
}

beforeEach(() => {
  getState().resetToHome();
});

describe('initGame', () => {
  it('rejects invalid composition and stays in SETUP', () => {
    const ok = getState().initGame({
      names: ['A', 'B', 'C', 'D'],
      config: { civilianCount: 2, undercoverCount: 2, mrWhiteCount: 0, category: 'Acak' },
    });
    expect(ok).toBe(false);
    expect(getState().status).toBe('SETUP');
  });

  it('starts a valid game in REVEAL status with players allocated', () => {
    const ok = getState().initGame({
      names: ['A', 'B', 'C', 'D', 'E'],
      config: { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 1, category: 'Acak' },
    });
    expect(ok).toBe(true);
    const state = getState();
    expect(state.status).toBe('REVEAL');
    expect(state.players).toHaveLength(5);
    expect(state.revealIndex).toBe(0);
    expect(state.roundNumber).toBe(1);
  });
});

describe('reveal flow', () => {
  beforeEach(() => {
    getState().initGame({
      names: ['A', 'B', 'C'],
      config: { civilianCount: 2, undercoverCount: 1, mrWhiteCount: 0, category: 'Acak' },
    });
  });

  it('advances revealIndex on confirmRevealed, then moves to DESCRIPTION after the last player', () => {
    expect(getState().status).toBe('REVEAL');
    getState().confirmRevealed();
    expect(getState().revealIndex).toBe(1);
    expect(getState().status).toBe('REVEAL');
    getState().confirmRevealed();
    expect(getState().revealIndex).toBe(2);
    getState().confirmRevealed();
    expect(getState().status).toBe('DESCRIPTION');
  });
});

describe('description flow', () => {
  beforeEach(() => {
    getState().initGame({
      names: ['A', 'B', 'C'],
      config: { civilianCount: 2, undercoverCount: 1, mrWhiteCount: 0, category: 'Acak' },
    });
    getState().confirmRevealed();
    getState().confirmRevealed();
    getState().confirmRevealed();
  });

  it('advances turn on nextTurn, then moves to VOTING after the last turn', () => {
    expect(getState().status).toBe('DESCRIPTION');
    expect(getState().currentTurnIndex).toBe(0);
    getState().nextTurn();
    expect(getState().currentTurnIndex).toBe(1);
    getState().nextTurn();
    expect(getState().currentTurnIndex).toBe(2);
    getState().nextTurn();
    expect(getState().status).toBe('VOTING');
  });
});

describe('elimination flow', () => {
  it('eliminates a non-Mr.-White player and checks winner directly', () => {
    getState().initGame({
      names: ['A', 'B', 'C', 'D'],
      config: { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 0, category: 'Acak' },
    });
    for (let i = 0; i < 5; i++) getState().confirmRevealed();
    for (let i = 0; i < 5; i++) getState().nextTurn();
    const undercover = getState().players.find((p) => p.role === 'UNDERCOVER')!;
    getState().eliminatePlayer(undercover.id);
    const state = getState();
    expect(state.players.find((p) => p.id === undercover.id)?.isAlive).toBe(false);
    expect(state.status).toBe('ROUND_RESULT');
    expect(state.winner).toBe('CIVILIAN');
  });

  it('routes to MR_WHITE_GUESS when Mr. White is eliminated', () => {
    getState().initGame({
      names: ['A', 'B', 'C', 'D', 'E'],
      config: { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 1, category: 'Acak' },
    });
    for (let i = 0; i < 6; i++) getState().confirmRevealed();
    for (let i = 0; i < 6; i++) getState().nextTurn();
    const mrWhite = getState().players.find((p) => p.role === 'MR_WHITE')!;
    getState().eliminatePlayer(mrWhite.id);
    expect(getState().status).toBe('MR_WHITE_GUESS');
  });
});

describe('submitMrWhiteGuess', () => {
  it('finishes the game with MR_WHITE_GUESS winner on a correct guess', () => {
    getState().initGame({
      names: ['A', 'B', 'C', 'D', 'E'],
      config: { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 1, category: 'Acak' },
    });
    for (let i = 0; i < 6; i++) getState().confirmRevealed();
    for (let i = 0; i < 6; i++) getState().nextTurn();
    const mrWhite = getState().players.find((p) => p.role === 'MR_WHITE')!;
    getState().eliminatePlayer(mrWhite.id);
    const civilianWord = getState().wordPair!.civilian;
    getState().submitMrWhiteGuess(civilianWord);
    expect(getState().status).toBe('FINISHED');
    expect(getState().winner).toBe('MR_WHITE_GUESS');
  });
});

describe('startNewRound', () => {
  it('keeps player names and cumulative score but resets round state', () => {
    getState().initGame({
      names: ['A', 'B', 'C'],
      config: { civilianCount: 2, undercoverCount: 1, mrWhiteCount: 0, category: 'Acak' },
    });
    for (let i = 0; i < 4; i++) getState().confirmRevealed();
    for (let i = 0; i < 4; i++) getState().nextTurn();
    const undercover = getState().players.find((p) => p.role === 'UNDERCOVER')!;
    getState().eliminatePlayer(undercover.id);
    const scoresAfterRound1 = getState().players.map((p) => ({ name: p.name, score: p.score }));

    getState().startNewRound();
    const state = getState();
    expect(state.status).toBe('REVEAL');
    expect(state.roundNumber).toBe(2);
    expect(state.players.every((p) => p.isAlive)).toBe(true);
    expect(state.players.map((p) => ({ name: p.name, score: p.score })).sort((a, b) => a.name.localeCompare(b.name)))
      .toEqual(scoresAfterRound1.sort((a, b) => a.name.localeCompare(b.name)));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/store.test.ts`
Expected: FAIL — `lib/store.ts` does not exist.

- [ ] **Step 3: Implement the store**

```typescript
// lib/store.ts
import { create } from 'zustand';
import type { GameState, GameConfig, WordCategory, WinnerSide } from './types';
import {
  allocateRoles,
  assignTurnOrder,
  checkWinner,
  calculateScores,
  findTiedCandidates,
} from './gameLogic';
import { validateComposition } from './gameLogic';
import { WORD_PAIRS } from './words';

type InitGameInput = {
  names: string[];
  config: GameConfig;
};

type GameActions = {
  initGame: (input: InitGameInput) => boolean;
  confirmRevealed: () => void;
  nextTurn: () => void;
  eliminatePlayer: (id: string) => void;
  resolveTie: (candidateIds: string[]) => void;
  randomTieBreak: () => void;
  submitMrWhiteGuess: (guess: string) => void;
  startNewRound: () => void;
  resetToHome: () => void;
};

function pickWordPair(category: WordCategory | 'Acak') {
  const pool = category === 'Acak' ? WORD_PAIRS : WORD_PAIRS.filter((w) => w.category === category);
  const effectivePool = pool.length > 0 ? pool : WORD_PAIRS.filter((w) => w.category === 'Umum');
  const chosen = effectivePool[Math.floor(Math.random() * effectivePool.length)];
  return { civilian: chosen.civilian, undercover: chosen.undercover, category: chosen.category };
}

function initialState(): GameState {
  return {
    status: 'SETUP',
    roundNumber: 0,
    wordPair: null,
    players: [],
    currentTurnIndex: 0,
    revealIndex: 0,
    eliminationCandidates: [],
    config: { civilianCount: 0, undercoverCount: 0, mrWhiteCount: 0, category: 'Acak' },
    lastEliminatedId: null,
    winner: null,
  };
}

/** Resolve win condition after an elimination; mutates status/winner/players via scoring. */
function resolveAfterElimination(
  players: GameState['players'],
  mrWhiteGuessedCorrectly: boolean
): { status: GameState['status']; winner: WinnerSide; players: GameState['players'] } {
  const winnerSide = checkWinner(players);
  if (winnerSide === null) {
    return { status: 'DESCRIPTION', winner: null, players };
  }
  const scoredPlayers = calculateScores(players, winnerSide, mrWhiteGuessedCorrectly);
  return { status: 'ROUND_RESULT', winner: winnerSide, players: scoredPlayers };
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState(),

  initGame: ({ names, config }) => {
    const validation = validateComposition(config, names.length);
    if (!validation.valid) {
      return false;
    }
    const wordPair = pickWordPair(config.category);
    const players = assignTurnOrder(
      allocateRoles(names, config, {
        civilian: wordPair.civilian,
        undercover: wordPair.undercover,
        category: wordPair.category as WordCategory,
      })
    );
    set({
      status: 'REVEAL',
      roundNumber: 1,
      wordPair,
      players,
      currentTurnIndex: 0,
      revealIndex: 0,
      eliminationCandidates: [],
      config,
      lastEliminatedId: null,
      winner: null,
    });
    return true;
  },

  confirmRevealed: () => {
    const { revealIndex, players } = get();
    const nextIndex = revealIndex + 1;
    if (nextIndex >= players.length) {
      set({ status: 'DESCRIPTION', revealIndex: nextIndex, currentTurnIndex: 0 });
    } else {
      set({ revealIndex: nextIndex });
    }
  },

  nextTurn: () => {
    const { currentTurnIndex, players } = get();
    const aliveCount = players.filter((p) => p.isAlive).length;
    const nextIndex = currentTurnIndex + 1;
    if (nextIndex >= aliveCount) {
      set({ status: 'VOTING', currentTurnIndex: nextIndex });
    } else {
      set({ currentTurnIndex: nextIndex });
    }
  },

  eliminatePlayer: (id) => {
    const { players } = get();
    const updatedPlayers = players.map((p) => (p.id === id ? { ...p, isAlive: false } : p));
    const eliminated = players.find((p) => p.id === id);

    if (eliminated?.role === 'MR_WHITE') {
      set({ players: updatedPlayers, status: 'MR_WHITE_GUESS', lastEliminatedId: id, eliminationCandidates: [] });
      return;
    }

    const resolved = resolveAfterElimination(updatedPlayers, false);
    set({
      players: resolved.players,
      status: resolved.status,
      winner: resolved.winner,
      lastEliminatedId: id,
      eliminationCandidates: [],
      currentTurnIndex: 0,
    });
  },

  resolveTie: (candidateIds) => {
    set({ eliminationCandidates: candidateIds, status: 'VOTING' });
  },

  randomTieBreak: () => {
    const { eliminationCandidates } = get();
    if (eliminationCandidates.length === 0) return;
    const chosenId = eliminationCandidates[Math.floor(Math.random() * eliminationCandidates.length)];
    get().eliminatePlayer(chosenId);
  },

  submitMrWhiteGuess: (guess) => {
    const { wordPair, players } = get();
    const correct = wordPair !== null && guess.trim().toLowerCase() === wordPair.civilian.trim().toLowerCase();
    if (correct) {
      const scoredPlayers = calculateScores(players, 'MR_WHITE_GUESS', true);
      set({ status: 'FINISHED', winner: 'MR_WHITE_GUESS', players: scoredPlayers });
      return;
    }
    const resolved = resolveAfterElimination(players, false);
    set({
      players: resolved.players,
      status: resolved.status,
      winner: resolved.winner,
      currentTurnIndex: 0,
    });
  },

  startNewRound: () => {
    const { players, config, roundNumber } = get();
    const names = players.map((p) => p.name);
    const scoresByName = new Map(players.map((p) => [p.name, p.score]));
    const wordPair = pickWordPair(config.category);
    const freshPlayers = assignTurnOrder(
      allocateRoles(names, config, {
        civilian: wordPair.civilian,
        undercover: wordPair.undercover,
        category: wordPair.category as WordCategory,
      })
    ).map((p) => ({ ...p, score: scoresByName.get(p.name) ?? 0 }));

    set({
      status: 'REVEAL',
      roundNumber: roundNumber + 1,
      wordPair,
      players: freshPlayers,
      currentTurnIndex: 0,
      revealIndex: 0,
      eliminationCandidates: [],
      lastEliminatedId: null,
      winner: null,
    });
  },

  resetToHome: () => {
    set(initialState());
  },
}));
```

Also export `findTiedCandidates` usage is left to the VotingScreen component (Task 12), which will call it with vote counts derived from host taps — the store's `resolveTie`/`randomTieBreak` actions handle the resulting state transitions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/store.test.ts`
Expected: PASS — all store flow tests green.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: PASS — all test files (`words.test.ts`, `gameLogic.test.ts`, `store.test.ts`) green.

- [ ] **Step 6: Commit**

```bash
git add lib/store.ts lib/store.test.ts
git commit -m "feat: add Zustand game store with full round lifecycle"
```

---

## Task 8: Tailwind theme tokens & base layout

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace globals.css with the game palette**

Replace the full contents of `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #f8fafc; /* slate-50 */
  --foreground: #0f172a; /* slate-900 */
  --color-card: #ffffff;
  --color-accent: #059669; /* emerald-600 */
  --color-accent-2: #4f46e5; /* indigo-600 */
  --color-danger: #dc2626; /* red-600 */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--color-card);
  --color-accent: var(--color-accent);
  --color-accent-2: var(--color-accent-2);
  --color-danger: var(--color-danger);
}

html, body {
  height: 100%;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
```

- [ ] **Step 2: Simplify layout.tsx (drop Geist fonts, set Indonesian metadata)**

Replace the full contents of `app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Undercover",
  description: "Game deduksi sosial pass-and-play, 100% offline.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-[100dvh] flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify dev server renders without error**

Run: `npm run dev` in the background, then check `curl -s http://localhost:3000 | head -20` (or open browser).
Expected: page loads with default `app/page.tsx` content (still boilerplate at this point, but no build errors). Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: apply Undercover theme tokens and Indonesian metadata to layout"
```

---

## Task 9: Reusable UI primitives

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/PlayerList.tsx`

- [ ] **Step 1: Create Button**

```tsx
// components/ui/Button.tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white active:bg-emerald-700",
  secondary: "bg-white text-foreground border border-slate-300 active:bg-slate-100",
  danger: "bg-danger text-white active:bg-red-700",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-[44px] w-full rounded-xl px-5 py-3 text-base font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Create Card**

```tsx
// components/ui/Card.tsx
import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-card border border-slate-200 p-5 shadow-sm ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Create PlayerList**

```tsx
// components/ui/PlayerList.tsx
import type { Player } from "@/lib/types";

type PlayerListProps = {
  players: Player[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
};

export function PlayerList({ players, onSelect, selectedId }: PlayerListProps) {
  return (
    <ul className="flex flex-col gap-2" role="list">
      {players.map((player) => (
        <li key={player.id}>
          <button
            type="button"
            aria-pressed={selectedId === player.id}
            onClick={() => onSelect?.(player.id)}
            disabled={!onSelect}
            className={`min-h-[44px] w-full rounded-xl border px-4 py-3 text-left text-base font-medium transition-colors ${
              selectedId === player.id
                ? "border-accent-2 bg-indigo-50 text-accent-2"
                : "border-slate-200 bg-white text-foreground"
            } disabled:opacity-100`}
          >
            {player.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Button.tsx components/ui/Card.tsx components/ui/PlayerList.tsx
git commit -m "feat: add reusable Button, Card, and PlayerList UI primitives"
```

---

## Task 10: HomeScreen and SetupScreen

**Files:**
- Create: `components/screens/HomeScreen.tsx`
- Create: `components/screens/SetupScreen.tsx`

- [ ] **Step 1: Create HomeScreen**

```tsx
// components/screens/HomeScreen.tsx
import { Button } from "@/components/ui/Button";

type HomeScreenProps = {
  onStart: () => void;
};

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Undercover</h1>
        <p className="mt-2 text-slate-500">Game deduksi kata, satu perangkat digilir.</p>
      </div>
      <div className="w-full max-w-xs">
        <Button onClick={onStart}>Main</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SetupScreen**

```tsx
// components/screens/SetupScreen.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { recommendComposition, validateComposition } from "@/lib/gameLogic";
import type { GameConfig, RoleConfig, WordCategory } from "@/lib/types";

const CATEGORIES: (WordCategory | "Acak")[] = [
  "Acak",
  "Umum",
  "Makanan",
  "Minuman",
  "Hewan",
  "Tempat",
  "Profesi",
  "Objek",
  "Olahraga",
];

type SetupScreenProps = {
  onStart: (names: string[], config: GameConfig) => boolean;
};

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(5);
  const [names, setNames] = useState<string[]>(Array(5).fill(""));
  const [composition, setComposition] = useState<RoleConfig>(recommendComposition(5));
  const [category, setCategory] = useState<WordCategory | "Acak">("Acak");
  const [error, setError] = useState<string | null>(null);

  function updatePlayerCount(next: number) {
    const clamped = Math.max(3, Math.min(20, next));
    setPlayerCount(clamped);
    setNames((prev) => {
      const copy = [...prev];
      copy.length = clamped;
      return copy.map((n) => n ?? "");
    });
    setComposition(recommendComposition(clamped));
  }

  const validation = useMemo(
    () => validateComposition(composition, playerCount),
    [composition, playerCount]
  );

  function handleStart() {
    const resolvedNames = names.map((n, i) => (n.trim() ? n.trim().slice(0, 12) : `Pemain ${i + 1}`));
    const config: GameConfig = { ...composition, category };
    const ok = onStart(resolvedNames, config);
    if (!ok) {
      setError("Konfigurasi tidak valid. Periksa kembali komposisi peran.");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Setup Permainan</h2>

      <Card className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-600">Jumlah Pemain</label>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="w-12"
            onClick={() => updatePlayerCount(playerCount - 1)}
            aria-label="Kurangi jumlah pemain"
          >
            −
          </Button>
          <span className="min-w-[3ch] text-center text-xl font-semibold">{playerCount}</span>
          <Button
            variant="secondary"
            className="w-12"
            onClick={() => updatePlayerCount(playerCount + 1)}
            aria-label="Tambah jumlah pemain"
          >
            +
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600">Nama Pemain</label>
        {names.map((name, index) => (
          <input
            key={index}
            value={name}
            maxLength={12}
            placeholder={`Pemain ${index + 1}`}
            onChange={(e) => {
              const copy = [...names];
              copy[index] = e.target.value;
              setNames(copy);
            }}
            className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-base"
          />
        ))}
      </Card>

      <Card className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-600">Komposisi Peran</label>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-semibold">{composition.civilianCount}</div>
            <div className="text-slate-500">Civilian</div>
          </div>
          <div>
            <div className="font-semibold">{composition.undercoverCount}</div>
            <div className="text-slate-500">Undercover</div>
          </div>
          <div>
            <div className="font-semibold">{composition.mrWhiteCount}</div>
            <div className="text-slate-500">Mr. White</div>
          </div>
        </div>
        {!validation.valid && (
          <p className="text-sm text-danger" role="alert">
            {validation.reason}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600" htmlFor="category">
          Kategori
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as WordCategory | "Acak")}
          className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-base"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Card>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-auto pt-2">
        <Button onClick={handleStart} disabled={!validation.valid}>
          Mulai
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/screens/HomeScreen.tsx components/screens/SetupScreen.tsx
git commit -m "feat: add Home and Setup screens"
```

---

## Task 11: RevealScreen and DescriptionScreen

**Files:**
- Create: `components/screens/RevealScreen.tsx`
- Create: `components/screens/DescriptionScreen.tsx`

- [ ] **Step 1: Create RevealScreen**

```tsx
// components/screens/RevealScreen.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Player } from "@/lib/types";

type RevealScreenProps = {
  players: Player[];
  revealIndex: number;
  onConfirmRevealed: () => void;
};

export function RevealScreen({ players, revealIndex, onConfirmRevealed }: RevealScreenProps) {
  const [handedOff, setHandedOff] = useState(false);
  const [holding, setHolding] = useState(false);
  const player = players[revealIndex];

  if (!player) return null;

  function handleNext() {
    setHandedOff(false);
    setHolding(false);
    onConfirmRevealed();
  }

  if (!handedOff) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-slate-500">Serahkan perangkat ke</p>
        <h2 className="text-3xl font-bold">{player.name}</h2>
        <div className="w-full max-w-xs">
          <Button onClick={() => setHandedOff(true)}>Saya {player.name}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-slate-500">Tekan dan tahan kartu untuk melihat kata</p>
      <Card
        className="flex h-56 w-full max-w-xs select-none items-center justify-center text-2xl font-bold"
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
      >
        {holding ? (player.secretWord ?? "^^") : "•••••"}
      </Card>
      <div className="w-full max-w-xs">
        <Button onClick={handleNext}>Sudah, sembunyikan &amp; lanjut</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create DescriptionScreen**

```tsx
// components/screens/DescriptionScreen.tsx
import { Button } from "@/components/ui/Button";
import type { Player } from "@/lib/types";

type DescriptionScreenProps = {
  players: Player[];
  currentTurnIndex: number;
  onNextTurn: () => void;
};

export function DescriptionScreen({ players, currentTurnIndex, onNextTurn }: DescriptionScreenProps) {
  const alivePlayers = players.filter((p) => p.isAlive).sort((a, b) => a.turnOrder - b.turnOrder);
  const currentPlayer = alivePlayers[currentTurnIndex];
  const isLastTurn = currentTurnIndex === alivePlayers.length - 1;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <h2 className="text-2xl font-bold">Fase Deskripsi</h2>
      <ol className="flex flex-col gap-2">
        {alivePlayers.map((p, index) => (
          <li
            key={p.id}
            className={`min-h-[44px] flex items-center rounded-xl border px-4 text-base ${
              index === currentTurnIndex
                ? "border-accent-2 bg-indigo-50 font-semibold text-accent-2"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {index + 1}. {p.name}
          </li>
        ))}
      </ol>
      {currentPlayer && (
        <p className="text-center text-lg">
          Giliran: <span className="font-bold">{currentPlayer.name}</span>
        </p>
      )}
      <div className="mt-auto">
        <Button onClick={onNextTurn}>{isLastTurn ? "Lanjut ke Voting" : "Berikutnya"}</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/screens/RevealScreen.tsx components/screens/DescriptionScreen.tsx
git commit -m "feat: add Reveal and Description screens"
```

---

## Task 12: VotingScreen, EliminationScreen, MrWhiteGuessScreen

**Files:**
- Create: `components/screens/VotingScreen.tsx`
- Create: `components/screens/EliminationScreen.tsx`
- Create: `components/screens/MrWhiteGuessScreen.tsx`

- [ ] **Step 1: Create VotingScreen**

```tsx
// components/screens/VotingScreen.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlayerList } from "@/components/ui/PlayerList";
import type { Player } from "@/lib/types";

type VotingScreenProps = {
  players: Player[];
  eliminationCandidates: string[];
  onEliminate: (id: string) => void;
  onRandomTieBreak: () => void;
};

export function VotingScreen({
  players,
  eliminationCandidates,
  onEliminate,
  onRandomTieBreak,
}: VotingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isTieBreak = eliminationCandidates.length > 0;
  const votablePlayers = isTieBreak
    ? players.filter((p) => eliminationCandidates.includes(p.id))
    : players.filter((p) => p.isAlive);

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-8">
      <h2 className="text-2xl font-bold">{isTieBreak ? "Voting Ulang (Seri)" : "Voting"}</h2>
      <p className="text-slate-500">Pilih pemain yang dieliminasi berdasarkan hasil voting kelompok.</p>
      <PlayerList players={votablePlayers} onSelect={setSelectedId} selectedId={selectedId} />
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={() => selectedId && onEliminate(selectedId)} disabled={!selectedId}>
          Eliminasi
        </Button>
        {isTieBreak && (
          <Button variant="secondary" onClick={onRandomTieBreak}>
            Pilih Acak
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create EliminationScreen**

```tsx
// components/screens/EliminationScreen.tsx
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Player, Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  CIVILIAN: "Civilian",
  UNDERCOVER: "Undercover",
  MR_WHITE: "Mr. White",
};

type EliminationScreenProps = {
  players: Player[];
  lastEliminatedId: string | null;
  onContinue: () => void;
};

export function EliminationScreen({ players, lastEliminatedId, onContinue }: EliminationScreenProps) {
  const eliminated = players.find((p) => p.id === lastEliminatedId);
  if (!eliminated) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-slate-500">Pemain tereliminasi</p>
      <h2 className="text-3xl font-bold">{eliminated.name}</h2>
      <Card className="w-full max-w-xs">
        <p className="text-sm text-slate-500">Perannya adalah</p>
        <p className="text-2xl font-bold text-accent-2">{ROLE_LABEL[eliminated.role]}</p>
      </Card>
      <div className="w-full max-w-xs">
        <Button onClick={onContinue}>Lanjut</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create MrWhiteGuessScreen**

```tsx
// components/screens/MrWhiteGuessScreen.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Player } from "@/lib/types";

type MrWhiteGuessScreenProps = {
  mrWhite: Player | undefined;
  onSubmitGuess: (guess: string) => void;
};

export function MrWhiteGuessScreen({ mrWhite, onSubmitGuess }: MrWhiteGuessScreenProps) {
  const [guess, setGuess] = useState("");

  if (!mrWhite) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-slate-500">{mrWhite.name} tereliminasi sebagai Mr. White</p>
      <h2 className="text-2xl font-bold">Tebak kata Civilian!</h2>
      <input
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Tulis tebakan..."
        className="min-h-[44px] w-full max-w-xs rounded-xl border border-slate-300 px-4 text-center text-lg"
      />
      <div className="w-full max-w-xs">
        <Button onClick={() => onSubmitGuess(guess)} disabled={!guess.trim()}>
          Kirim Tebakan
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/screens/VotingScreen.tsx components/screens/EliminationScreen.tsx components/screens/MrWhiteGuessScreen.tsx
git commit -m "feat: add Voting, Elimination, and Mr. White Guess screens"
```

---

## Task 13: RoundResultScreen

**Files:**
- Create: `components/screens/RoundResultScreen.tsx`

- [ ] **Step 1: Create RoundResultScreen**

```tsx
// components/screens/RoundResultScreen.tsx
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Player, WinnerSide } from "@/lib/types";

const WINNER_LABEL: Record<NonNullable<WinnerSide>, string> = {
  CIVILIAN: "Civilian Menang!",
  IMPOSTOR: "Penyusup Menang!",
  MR_WHITE_GUESS: "Mr. White Menang!",
};

type RoundResultScreenProps = {
  players: Player[];
  winner: WinnerSide;
  onNewRound: () => void;
  onFinish: () => void;
};

export function RoundResultScreen({ players, winner, onNewRound, onFinish }: RoundResultScreenProps) {
  const ranking = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <h2 className="text-center text-2xl font-bold">{winner ? WINNER_LABEL[winner] : "Ronde Selesai"}</h2>
      <Card className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-500">Papan Peringkat</p>
        <ol className="flex flex-col gap-2">
          {ranking.map((p, index) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>
                {index + 1}. {p.name}
              </span>
              <span className="font-semibold">{p.score} pts</span>
            </li>
          ))}
        </ol>
      </Card>
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={onNewRound}>Ronde Baru</Button>
        <Button variant="secondary" onClick={onFinish}>
          Selesai
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/screens/RoundResultScreen.tsx
git commit -m "feat: add Round Result screen with ranking"
```

---

## Task 14: Wire up app/page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace page.tsx to switch on game status**

Replace the full contents of `app/page.tsx`:

```tsx
"use client";

import { useGameStore } from "@/lib/store";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { SetupScreen } from "@/components/screens/SetupScreen";
import { RevealScreen } from "@/components/screens/RevealScreen";
import { DescriptionScreen } from "@/components/screens/DescriptionScreen";
import { VotingScreen } from "@/components/screens/VotingScreen";
import { EliminationScreen } from "@/components/screens/EliminationScreen";
import { MrWhiteGuessScreen } from "@/components/screens/MrWhiteGuessScreen";
import { RoundResultScreen } from "@/components/screens/RoundResultScreen";

export default function Page() {
  const state = useGameStore();

  switch (state.status) {
    case "SETUP":
      if (state.roundNumber === 0 && state.players.length === 0) {
        return (
          <HomeScreen
            onStart={() => {
              /* SetupScreen is shown directly once we flip a local flag */
            }}
          />
        );
      }
      return <SetupScreen onStart={(names, config) => state.initGame({ names, config })} />;

    case "REVEAL":
      return (
        <RevealScreen
          players={state.players}
          revealIndex={state.revealIndex}
          onConfirmRevealed={state.confirmRevealed}
        />
      );

    case "DESCRIPTION":
      return (
        <DescriptionScreen
          players={state.players}
          currentTurnIndex={state.currentTurnIndex}
          onNextTurn={state.nextTurn}
        />
      );

    case "VOTING":
      return (
        <VotingScreen
          players={state.players}
          eliminationCandidates={state.eliminationCandidates}
          onEliminate={state.eliminatePlayer}
          onRandomTieBreak={state.randomTieBreak}
        />
      );

    case "ELIMINATION":
      return (
        <EliminationScreen
          players={state.players}
          lastEliminatedId={state.lastEliminatedId}
          onContinue={() => {}}
        />
      );

    case "MR_WHITE_GUESS":
      return (
        <MrWhiteGuessScreen
          mrWhite={state.players.find((p) => p.id === state.lastEliminatedId)}
          onSubmitGuess={state.submitMrWhiteGuess}
        />
      );

    case "ROUND_RESULT":
    case "FINISHED":
      return (
        <RoundResultScreen
          players={state.players}
          winner={state.winner}
          onNewRound={state.startNewRound}
          onFinish={state.resetToHome}
        />
      );

    default:
      return null;
  }
}
```

This first pass has a gap: `HomeScreen`'s "Main" button has no way to reach `SetupScreen` because both map to `status === 'SETUP'`. Fix this in Step 2.

- [ ] **Step 2: Add a local "showSetup" flag to distinguish Home from Setup within SETUP status**

Replace `app/page.tsx` entirely with this corrected version:

```tsx
"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { SetupScreen } from "@/components/screens/SetupScreen";
import { RevealScreen } from "@/components/screens/RevealScreen";
import { DescriptionScreen } from "@/components/screens/DescriptionScreen";
import { VotingScreen } from "@/components/screens/VotingScreen";
import { EliminationScreen } from "@/components/screens/EliminationScreen";
import { MrWhiteGuessScreen } from "@/components/screens/MrWhiteGuessScreen";
import { RoundResultScreen } from "@/components/screens/RoundResultScreen";

export default function Page() {
  const state = useGameStore();
  const [showSetup, setShowSetup] = useState(false);

  switch (state.status) {
    case "SETUP":
      if (!showSetup) {
        return <HomeScreen onStart={() => setShowSetup(true)} />;
      }
      return (
        <SetupScreen
          onStart={(names, config) => {
            const ok = state.initGame({ names, config });
            if (ok) setShowSetup(false);
            return ok;
          }}
        />
      );

    case "REVEAL":
      return (
        <RevealScreen
          players={state.players}
          revealIndex={state.revealIndex}
          onConfirmRevealed={state.confirmRevealed}
        />
      );

    case "DESCRIPTION":
      return (
        <DescriptionScreen
          players={state.players}
          currentTurnIndex={state.currentTurnIndex}
          onNextTurn={state.nextTurn}
        />
      );

    case "VOTING":
      return (
        <VotingScreen
          players={state.players}
          eliminationCandidates={state.eliminationCandidates}
          onEliminate={state.eliminatePlayer}
          onRandomTieBreak={state.randomTieBreak}
        />
      );

    case "MR_WHITE_GUESS":
      return (
        <MrWhiteGuessScreen
          mrWhite={state.players.find((p) => p.id === state.lastEliminatedId)}
          onSubmitGuess={state.submitMrWhiteGuess}
        />
      );

    case "ROUND_RESULT":
    case "FINISHED":
      return (
        <RoundResultScreen
          players={state.players}
          winner={state.winner}
          onNewRound={state.startNewRound}
          onFinish={() => {
            state.resetToHome();
            setShowSetup(false);
          }}
        />
      );

    default:
      return null;
  }
}
```

Note the `ELIMINATION` case was removed: per the store implementation in Task 7, `eliminatePlayer` transitions directly to `MR_WHITE_GUESS` or `ROUND_RESULT` — the store never sets `status: 'ELIMINATION'` as a distinct pause state, since role reveal happens inline within `VotingScreen`'s result. To honor the spec's explicit "Eliminasi (ungkap peran)" screen (§6, §10), add it back properly: see Step 3.

- [ ] **Step 3: Add the elimination reveal as a real pause state**

The spec requires an explicit `EliminationScreen` step between voting and the next phase (§5.3 Fase D: "peran aslinya diungkap ke semua pemain"). Modify `lib/store.ts`'s `eliminatePlayer` action so it stops at `ELIMINATION` first, and add a new `acknowledgeElimination` action that performs the follow-up transition.

In `lib/store.ts`, update the `GameActions` type:

```typescript
type GameActions = {
  initGame: (input: InitGameInput) => boolean;
  confirmRevealed: () => void;
  nextTurn: () => void;
  eliminatePlayer: (id: string) => void;
  acknowledgeElimination: () => void;
  resolveTie: (candidateIds: string[]) => void;
  randomTieBreak: () => void;
  submitMrWhiteGuess: (guess: string) => void;
  startNewRound: () => void;
  resetToHome: () => void;
};
```

Replace the `eliminatePlayer` action body with:

```typescript
  eliminatePlayer: (id) => {
    const { players } = get();
    const updatedPlayers = players.map((p) => (p.id === id ? { ...p, isAlive: false } : p));
    set({
      players: updatedPlayers,
      status: 'ELIMINATION',
      lastEliminatedId: id,
      eliminationCandidates: [],
    });
  },

  acknowledgeElimination: () => {
    const { players, lastEliminatedId } = get();
    const eliminated = players.find((p) => p.id === lastEliminatedId);

    if (eliminated?.role === 'MR_WHITE') {
      set({ status: 'MR_WHITE_GUESS' });
      return;
    }

    const resolved = resolveAfterElimination(players, false);
    set({
      players: resolved.players,
      status: resolved.status,
      winner: resolved.winner,
      currentTurnIndex: 0,
    });
  },
```

Update `lib/store.test.ts`'s elimination-flow tests to call `acknowledgeElimination()` after `eliminatePlayer()`:

```typescript
describe('elimination flow', () => {
  it('eliminates a non-Mr.-White player and checks winner directly', () => {
    getState().initGame({
      names: ['A', 'B', 'C', 'D'],
      config: { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 0, category: 'Acak' },
    });
    for (let i = 0; i < 5; i++) getState().confirmRevealed();
    for (let i = 0; i < 5; i++) getState().nextTurn();
    const undercover = getState().players.find((p) => p.role === 'UNDERCOVER')!;
    getState().eliminatePlayer(undercover.id);
    expect(getState().status).toBe('ELIMINATION');
    getState().acknowledgeElimination();
    const state = getState();
    expect(state.players.find((p) => p.id === undercover.id)?.isAlive).toBe(false);
    expect(state.status).toBe('ROUND_RESULT');
    expect(state.winner).toBe('CIVILIAN');
  });

  it('routes to MR_WHITE_GUESS when Mr. White is eliminated', () => {
    getState().initGame({
      names: ['A', 'B', 'C', 'D', 'E'],
      config: { civilianCount: 3, undercoverCount: 1, mrWhiteCount: 1, category: 'Acak' },
    });
    for (let i = 0; i < 6; i++) getState().confirmRevealed();
    for (let i = 0; i < 6; i++) getState().nextTurn();
    const mrWhite = getState().players.find((p) => p.role === 'MR_WHITE')!;
    getState().eliminatePlayer(mrWhite.id);
    expect(getState().status).toBe('ELIMINATION');
    getState().acknowledgeElimination();
    expect(getState().status).toBe('MR_WHITE_GUESS');
  });
});
```

And update the two other tests that call `eliminatePlayer` directly (`submitMrWhiteGuess` describe block and `startNewRound` describe block) to also call `getState().acknowledgeElimination();` immediately after each `getState().eliminatePlayer(...)` call.

Run: `npx vitest run lib/store.test.ts`
Expected: PASS after the edits.

- [ ] **Step 4: Restore the ELIMINATION case in app/page.tsx**

In `app/page.tsx`, add this case above `case "MR_WHITE_GUESS":`:

```tsx
    case "ELIMINATION":
      return (
        <EliminationScreen
          players={state.players}
          lastEliminatedId={state.lastEliminatedId}
          onContinue={state.acknowledgeElimination}
        />
      );

```

And add the import at the top alongside the other screen imports:

```tsx
import { EliminationScreen } from "@/components/screens/EliminationScreen";
```

- [ ] **Step 5: Run full test suite and typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: all tests PASS, no type errors.

- [ ] **Step 6: Manual verification in dev server**

Run: `npm run dev` (background). Open `http://localhost:3000` in a browser resized to a mobile viewport (~375px wide). Play through: Home → Main → Setup (3 players, default names, valid composition) → Start → Reveal each player (hold-to-reveal works) → Description (step through all turns) → Voting (select a player) → Elimination (role revealed) → repeat until a winner → Round Result → Ronde Baru (score persists) → Selesai (returns Home). Confirm no console errors and layout looks correct on mobile width. Stop the dev server when done.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx lib/store.ts lib/store.test.ts
git commit -m "feat: wire up single-page app screen router with elimination pause state"
```

---

## Task 15: PWA manifest and icons

**Files:**
- Create: `app/manifest.ts`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-maskable-512.png`
- Create: `scripts/generate-icons.mjs`

- [ ] **Step 1: Generate placeholder PNG icons programmatically**

Since no design assets exist yet, generate simple solid-color placeholder icons using the `canvas`-free approach of writing raw PNGs is complex — instead use Node's built-in ability to shell out to a tiny inline SVG-to-PNG is also complex without deps. Simplest dependency-free approach: create minimal valid PNGs via a small script using the `zlib` module (Node built-in) to hand-encode a solid-color square.

Create `scripts/generate-icons.mjs`:

```javascript
// scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/** Generates a flat solid-color square PNG with a centered darker circle, RGBA. */
function generateIcon(size, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk("IHDR", ihdrData);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.32;

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const inCircle = dx * dx + dy * dy <= radius * radius;
      const px = rowStart + 1 + x * 4;
      if (inCircle) {
        raw[px] = 255;
        raw[px + 1] = 255;
        raw[px + 2] = 255;
      } else {
        raw[px] = r;
        raw[px + 1] = g;
        raw[px + 2] = b;
      }
      raw[px + 3] = 255;
    }
  }

  const idat = chunk("IDAT", deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", generateIcon(192, [5, 150, 105]));
writeFileSync("public/icons/icon-512.png", generateIcon(512, [5, 150, 105]));
writeFileSync("public/icons/icon-maskable-512.png", generateIcon(512, [5, 150, 105]));

console.log("Generated placeholder icons in public/icons/");
```

- [ ] **Step 2: Run the script**

Run: `node scripts/generate-icons.mjs`
Expected: prints "Generated placeholder icons in public/icons/"; files `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png` exist.

Verify: `node -e "const fs=require('fs'); console.log(fs.statSync('public/icons/icon-192.png').size, fs.statSync('public/icons/icon-512.png').size)"`
Expected: both sizes are non-zero byte counts.

- [ ] **Step 3: Create the manifest route**

```typescript
// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Undercover",
    short_name: "Undercover",
    description: "Game deduksi sosial pass-and-play, 100% offline.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#059669",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

- [ ] **Step 4: Point layout.tsx's manifest link at the generated route**

In `app/layout.tsx`, change the metadata `manifest` field from `/manifest.webmanifest` to `/manifest.webmanifest` — Next.js's `app/manifest.ts` file convention automatically serves at `/manifest.webmanifest`, so this value is already correct; no edit needed. Confirm by checking the file convention doc reference if unsure:

Run: `grep -r "manifest.webmanifest" node_modules/next/dist/docs/01-app/03-api-reference/04-file-conventions/metadata/manifest.md 2>/dev/null | head -3`
Expected: confirms the served path is `/manifest.webmanifest`.

- [ ] **Step 5: Verify manifest builds correctly**

Run: `npm run dev` (background), then `curl -s http://localhost:3000/manifest.webmanifest`
Expected: JSON output with `"name":"Undercover"` and the three icons. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add app/manifest.ts public/icons scripts/generate-icons.mjs
git commit -m "feat: add PWA manifest with generated placeholder icons"
```

---

## Task 16: Serwist service worker and static export config

**Files:**
- Create: `app/sw.ts`
- Modify: `next.config.ts`
- Modify: `tsconfig.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create the Serwist service worker entry**

```typescript
// app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

- [ ] **Step 2: Configure next.config.ts with Serwist and static export**

```typescript
// next.config.ts
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  output: "export",
};

export default withSerwist(nextConfig);
```

- [ ] **Step 3: Add serwist types to tsconfig include if needed**

Run: `npx tsc --noEmit`
Expected: no errors. If `WorkerGlobalScope`/`ServiceWorkerGlobalScope` types are not found, add `"lib": ["dom", "dom.iterable", "esnext", "webworker"]` is not needed since `app/sw.ts` is excluded from the main app type-check scope by Next's convention — if an error does appear referencing `app/sw.ts`, add this to `tsconfig.json`'s `exclude` array: `"app/sw.ts"`. Otherwise leave tsconfig.json unchanged.

- [ ] **Step 4: Ignore generated service worker artifacts**

Append to `.gitignore`:

```
# Serwist generated files
/public/sw.js
/public/swe-worker*.js
```

- [ ] **Step 5: Run a production build (not dev — Serwist generates the SW at build time)**

Run: `npm run build`
Expected: build completes successfully, prints the static export summary, and creates `public/sw.js` plus an `out/` directory containing the exported site. If the build fails because Turbopack is used by default, add `"build": "next build --no-turbopack"` — first check whether the error mentions Turbopack incompatibility before changing the script:

If build fails with a Turbopack/webpack-plugin related error, modify `package.json`:
```json
{
  "scripts": {
    "build": "next build --no-turbopack"
  }
}
```
Then re-run `npm run build` and confirm it succeeds.

- [ ] **Step 6: Verify offline assets are present**

Run: `ls out/sw.js out/manifest.webmanifest out/icons/icon-192.png`
Expected: all three paths exist under `out/`.

- [ ] **Step 7: Commit**

```bash
git add app/sw.ts next.config.ts .gitignore package.json
git commit -m "feat: configure Serwist service worker and static export"
```

---

## Task 17: Final end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

Run: `npm run test`
Expected: all test files PASS (words, gameLogic, store).

- [ ] **Step 2: Run typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no type errors; lint passes with no errors (warnings acceptable if pre-existing from `create-next-app` defaults).

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: succeeds, `out/` directory populated.

- [ ] **Step 4: Serve the static export and manually verify offline behavior**

Run: `npx serve out -l 4173` (or any static file server) in the background.
Open `http://localhost:4173` in a browser at mobile viewport width. Play one full round end-to-end (Setup → Reveal → Description → Voting → Elimination → Round Result → Ronde Baru → Selesai). Then, using browser devtools, switch to offline mode (Network tab → Offline) and reload the page — confirm the app still loads and is playable, verifying OBJ-3 ("game berjalan penuh tanpa internet"). Stop the static server when done.

- [ ] **Step 5: Verify installability**

In Chrome devtools, open the Application tab → Manifest, confirm no errors are shown and the manifest fields (name, icons, display: standalone) are all populated correctly, verifying OBJ-3's "installable" criterion.

- [ ] **Step 6: No commit needed for this task** (verification only — if any issues are found, file them as new tasks or fix inline and commit those specific fixes)

---

## Plan Self-Review Notes

- **Spec coverage:** All PRD Fase 1 requirements (FR-01 through FR-14 relevant items, §5.3 game loop phases A-D, §7 balancing/scoring/win conditions, §8 non-functional PWA/offline/anti-peek/accessibility touch targets, §9 data model, §10 state machine, §11 edge cases) map to tasks 2–17. Fase 2 items are explicitly out of scope per the design spec.
- **Voting bonus removal:** confirmed `calculateScores` (Task 6) has no bonus-voting branch, matching the design decision.
- **Tie handling:** `findTiedCandidates` (Task 6) + `resolveTie`/`randomTieBreak` (Task 7) + VotingScreen's candidate-filtering (Task 12) together implement the "voting ulang dengan kandidat terbatas, lalu pilih acak" decision. Note: the plan does not wire an automatic call to `findTiedCandidates`/`resolveTie` from a vote-counting UI, because the chosen voting mode is host-tap-to-eliminate (no vote counts are captured) — ties in this mode are a host judgment call the host would resolve by re-running the verbal vote and tapping again. `resolveTie`/`randomTieBreak` remain available in the store for a host-triggered "Ada seri" affordance; if a dedicated "Tandai Seri" host action is wanted in the UI, that would be a follow-up task in a next planning round.
- **Type consistency:** `Player`, `GameState`, `GameConfig`, `RoleConfig`, `WordPair`, `WinnerSide` are defined once in `lib/types.ts` (Task 2) and reused verbatim across `gameLogic.ts`, `store.ts`, and all screen component props — verified no renamed duplicates.
- **Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code or exact commands with expected output.
