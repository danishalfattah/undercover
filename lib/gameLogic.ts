import type { Player, RoleConfig, WordPair, Role, WinnerSide, RevealCard } from './types';

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

export type BuildRoundResult = {
  /** Placeholder players in seat order; role/secretWord filled when they pick a card. */
  players: Player[];
  /** Shuffled face-down deck the players draw from. */
  revealCards: RevealCard[];
  /** Final word held by Civilian this round, after FR-08 side randomization. */
  civilianWord: string;
  /** Final word held by Undercover this round, after FR-08 side randomization. */
  undercoverWord: string;
};

/**
 * FR-07/FR-08: build the round's reveal deck (roles shuffled via Fisher-Yates,
 * civilian/undercover word side randomized) plus placeholder players in seat
 * order. Roles are NOT bound to names here — each player binds a role when
 * they pick a face-down card during REVEAL.
 *
 * `names` is expected in seating order (the order entered in Setup); that
 * order is preserved in the returned players for pick-turn and speaking order.
 */
export function buildRound(names: string[], config: RoleConfig, wordPair: WordPair): BuildRoundResult {
  const roles: Role[] = [
    ...Array(config.civilianCount).fill('CIVILIAN'),
    ...Array(config.undercoverCount).fill('UNDERCOVER'),
    ...Array(config.mrWhiteCount).fill('MR_WHITE'),
  ];
  const shuffledRoles = shuffle(roles);

  // FR-08: randomize which word is "civilian's" word for this round.
  const swapSides = Math.random() < 0.5;
  const civilianWord = swapSides ? wordPair.undercover : wordPair.civilian;
  const undercoverWord = swapSides ? wordPair.civilian : wordPair.undercover;

  const revealCards: RevealCard[] = shuffledRoles.map((role, index) => ({
    index,
    role,
    secretWord: role === 'CIVILIAN' ? civilianWord : role === 'UNDERCOVER' ? undercoverWord : null,
    takenByPlayerId: null,
  }));

  const players: Player[] = names.map((name, seatIndex) => ({
    id: nextId(),
    name,
    role: 'CIVILIAN', // placeholder; real role assigned on card pick
    secretWord: null,
    isAlive: true,
    score: 0,
    lastRoundPoints: 0,
    seatIndex,
    turnOrder: 0, // assigned by assignTurnOrder after all cards picked
  }));

  return { players, revealCards, civilianWord, undercoverWord };
}

/**
 * §7.3: speaking order follows physical seating (the order players appear
 * in, e.g. Bagas -> Alia -> Farah -> Danish). Players who are no longer
 * alive are skipped, but the relative seating order among survivors is
 * preserved.
 *
 * - When `afterSeatIndex` is omitted (start of a fresh round, everyone
 *   alive), the start seat is randomized among non-Mr.-White players so
 *   Mr. White never speaks first.
 * - When `afterSeatIndex` is given (resuming after an elimination mid-round,
 *   e.g. Bagas-Alia-Farah-Danish with Farah eliminated), speaking order
 *   resumes from the next surviving seat after it: Danish -> Bagas -> Alia.
 */
export function assignTurnOrder(players: Player[], afterSeatIndex?: number): Player[] {
  const alive = [...players].filter((p) => p.isAlive).sort((a, b) => a.seatIndex - b.seatIndex);

  let rotatedAlive: Player[];
  if (afterSeatIndex === undefined) {
    const nonMrWhiteIndices = alive
      .map((p, i) => (p.role === 'MR_WHITE' ? -1 : i))
      .filter((i) => i !== -1);
    const startIndex =
      alive.length > 1 && nonMrWhiteIndices.length > 0
        ? nonMrWhiteIndices[Math.floor(Math.random() * nonMrWhiteIndices.length)]
        : 0;
    rotatedAlive = [...alive.slice(startIndex), ...alive.slice(0, startIndex)];
  } else {
    const startIndex = alive.findIndex((p) => p.seatIndex > afterSeatIndex);
    const resumeFrom = startIndex === -1 ? 0 : startIndex;
    rotatedAlive = [...alive.slice(resumeFrom), ...alive.slice(0, resumeFrom)];
  }

  const turnOrderById = new Map(rotatedAlive.map((p, index) => [p.id, index]));

  return players.map((p) => ({
    ...p,
    turnOrder: turnOrderById.get(p.id) ?? p.turnOrder,
  }));
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
    return { ...p, score: p.score + delta, lastRoundPoints: delta };
  });
}
