import type { Player, RoleConfig, WordPair, Role, WinnerSide } from './types';

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

  // 11-20: undercoverCount scales, mrWhiteCount fixed at 1-2, civilian takes the rest.
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

/**
 * Validation (relaxed from PRD §7.1's strict "<" per host preference):
 * undercover+mrWhite <= civilian, total >= 3, counts sum to total.
 */
export function validateComposition(config: RoleConfig, totalPlayers: number): CompositionValidation {
  if (totalPlayers < 3) {
    return { valid: false, reason: 'Jumlah pemain minimal 3 orang' };
  }
  const sum = config.civilianCount + config.undercoverCount + config.mrWhiteCount;
  if (sum !== totalPlayers) {
    return { valid: false, reason: 'Jumlah komposisi peran harus sama dengan jumlah pemain' };
  }
  if (config.undercoverCount + config.mrWhiteCount > config.civilianCount) {
    return { valid: false, reason: 'Jumlah penyusup tidak boleh lebih banyak daripada Civilian' };
  }
  return { valid: true };
}

/** In-place Fisher-Yates shuffle; returns a new shuffled array. */
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
      turnOrder: 0, // assigned by assignTurnOrder
    };
  });
}

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
 * instant-win-by-guess case.
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
