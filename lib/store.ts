import { create } from 'zustand';
import type { GameState, GameConfig, WordCategory, WinnerSide, SessionHistoryEntry } from './types';
import {
  buildRound,
  assignTurnOrder,
  checkWinner,
  calculateScores,
  validateComposition,
} from './gameLogic';
import { WORD_PAIRS } from './words';
import { appendHistoryEntry, clearActiveSession } from './persistence';

type InitGameInput = {
  names: string[];
  config: GameConfig;
};

type GameActions = {
  initGame: (input: InitGameInput) => boolean;
  pickRevealCard: (cardIndex: number) => void;
  goToVoting: () => void;
  eliminatePlayer: (id: string) => void;
  acknowledgeElimination: () => void;
  resolveTie: (candidateIds: string[]) => void;
  randomTieBreak: () => void;
  submitMrWhiteGuess: (guess: string) => void;
  acknowledgeMrWhiteGuess: () => void;
  skipRound: () => void;
  startNewRound: () => void;
  resetToHome: () => void;
  finishSession: () => void;
  resumeSession: (saved: GameState) => void;
};

function wordKey(civilian: string, undercover: string): string {
  return `${civilian}|${undercover}`;
}

function pickWordPair(category: WordCategory | 'Acak', usedWordKeys: string[]) {
  const pool = category === 'Acak' ? WORD_PAIRS : WORD_PAIRS.filter((w) => w.category === category);
  const effectivePool = pool.length > 0 ? pool : WORD_PAIRS.filter((w) => w.category === 'Umum');

  const usedSet = new Set(usedWordKeys);
  const unusedPool = effectivePool.filter((w) => !usedSet.has(wordKey(w.civilian, w.undercover)));
  // If this category's pool is exhausted this session, silently allow repeats again.
  const finalPool = unusedPool.length > 0 ? unusedPool : effectivePool;

  const chosen = finalPool[Math.floor(Math.random() * finalPool.length)];
  return { civilian: chosen.civilian, undercover: chosen.undercover, category: chosen.category };
}

function initialState(): GameState {
  return {
    status: 'SETUP',
    roundNumber: 0,
    wordPair: null,
    players: [],
    seatOrder: [],
    revealCards: [],
    revealPickIndex: 0,
    eliminationCandidates: [],
    config: { civilianCount: 0, undercoverCount: 0, mrWhiteCount: 0, category: 'Acak' },
    lastEliminatedId: null,
    lastEliminatedSeatIndex: null,
    winner: null,
    mrWhiteGuessResult: null,
    usedWordKeys: [],
  };
}

/**
 * Set up a fresh round's reveal deck + placeholder players for the given seat
 * order, excluding word pairs already used this session where possible.
 */
function setupRound(seatOrder: string[], config: GameConfig, usedWordKeys: string[]) {
  const pickedWordPair = pickWordPair(config.category, usedWordKeys);
  const round = buildRound(seatOrder, config, {
    civilian: pickedWordPair.civilian,
    undercover: pickedWordPair.undercover,
    category: pickedWordPair.category as WordCategory,
  });
  // Persist the word pair using the final civilian/undercover assignment
  // (buildRound may have swapped sides per FR-08), so Mr. White's guess is
  // checked against the word Civilians actually hold.
  const wordPair = {
    civilian: round.civilianWord,
    undercover: round.undercoverWord,
    category: pickedWordPair.category,
  };
  // Record the key from the pre-swap pair so a pair counts as "used" regardless
  // of which side ends up held by Civilian this round.
  const newUsedWordKeys = [...usedWordKeys, wordKey(pickedWordPair.civilian, pickedWordPair.undercover)];
  return { players: round.players, revealCards: round.revealCards, wordPair, usedWordKeys: newUsedWordKeys };
}

/**
 * Resolve win condition after an elimination is acknowledged. When the game
 * continues, speaking order resumes right after the eliminated player's seat.
 */
function resolveAfterElimination(
  players: GameState['players'],
  eliminatedSeatIndex: number | null,
  mrWhiteGuessedCorrectly: boolean
): { status: GameState['status']; winner: WinnerSide; players: GameState['players'] } {
  const winnerSide = checkWinner(players);
  if (winnerSide === null) {
    const reordered = assignTurnOrder(players, eliminatedSeatIndex ?? undefined);
    return { status: 'SPEAKING_ORDER', winner: null, players: reordered };
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
    const { players, revealCards, wordPair, usedWordKeys } = setupRound(names, config, []);
    set({
      status: 'REVEAL',
      roundNumber: 1,
      wordPair,
      players,
      seatOrder: names,
      revealCards,
      revealPickIndex: 0,
      eliminationCandidates: [],
      config,
      lastEliminatedId: null,
      lastEliminatedSeatIndex: null,
      winner: null,
      mrWhiteGuessResult: null,
      usedWordKeys,
    });
    return true;
  },

  pickRevealCard: (cardIndex) => {
    const { revealCards, revealPickIndex, players } = get();
    const card = revealCards[cardIndex];
    if (!card || card.takenByPlayerId !== null) return;

    const player = players[revealPickIndex];
    if (!player) return;

    const updatedCards = revealCards.map((c) =>
      c.index === cardIndex ? { ...c, takenByPlayerId: player.id } : c
    );
    const updatedPlayers = players.map((p) =>
      p.id === player.id ? { ...p, role: card.role, secretWord: card.secretWord } : p
    );
    const nextPickIndex = revealPickIndex + 1;

    if (nextPickIndex >= players.length) {
      // Everyone has picked: assign seat-based speaking order (Mr. White not first).
      set({
        revealCards: updatedCards,
        players: assignTurnOrder(updatedPlayers),
        revealPickIndex: nextPickIndex,
        status: 'SPEAKING_ORDER',
      });
    } else {
      set({
        revealCards: updatedCards,
        players: updatedPlayers,
        revealPickIndex: nextPickIndex,
      });
    }
  },

  goToVoting: () => {
    set({ status: 'VOTING' });
  },

  eliminatePlayer: (id) => {
    const { players } = get();
    const eliminated = players.find((p) => p.id === id);
    const updatedPlayers = players.map((p) => (p.id === id ? { ...p, isAlive: false } : p));
    set({
      players: updatedPlayers,
      status: 'ELIMINATION',
      lastEliminatedId: id,
      lastEliminatedSeatIndex: eliminated?.seatIndex ?? null,
      eliminationCandidates: [],
    });
  },

  acknowledgeElimination: () => {
    const { players, lastEliminatedId, lastEliminatedSeatIndex } = get();
    const eliminated = players.find((p) => p.id === lastEliminatedId);

    if (eliminated?.role === 'MR_WHITE') {
      set({ status: 'MR_WHITE_GUESS' });
      return;
    }

    const resolved = resolveAfterElimination(players, lastEliminatedSeatIndex, false);
    set({
      players: resolved.players,
      status: resolved.status,
      winner: resolved.winner,
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
      set({
        status: 'FINISHED',
        winner: 'MR_WHITE_GUESS',
        players: scoredPlayers,
        mrWhiteGuessResult: { guess, correct: true },
      });
      return;
    }

    // Wrong guess: show the result first, defer the win-check transition to acknowledgeMrWhiteGuess.
    set({ mrWhiteGuessResult: { guess, correct: false } });
  },

  acknowledgeMrWhiteGuess: () => {
    const { players, lastEliminatedSeatIndex } = get();
    const resolved = resolveAfterElimination(players, lastEliminatedSeatIndex, false);
    set({
      players: resolved.players,
      status: resolved.status,
      winner: resolved.winner,
      mrWhiteGuessResult: null,
    });
  },

  skipRound: () => {
    const { players } = get();
    // End the round with no winner and no score change.
    set({
      players: players.map((p) => ({ ...p, lastRoundPoints: 0 })),
      status: 'ROUND_RESULT',
      winner: null,
      mrWhiteGuessResult: null,
      eliminationCandidates: [],
    });
  },

  startNewRound: () => {
    const { players, seatOrder, config, roundNumber, usedWordKeys } = get();
    const scoresByName = new Map(players.map((p) => [p.name, p.score]));
    const { players: freshPlayers, revealCards, wordPair, usedWordKeys: nextUsedWordKeys } =
      setupRound(seatOrder, config, usedWordKeys);
    const scoredPlayers = freshPlayers.map((p) => ({
      ...p,
      score: scoresByName.get(p.name) ?? 0,
    }));

    set({
      status: 'REVEAL',
      roundNumber: roundNumber + 1,
      wordPair,
      players: scoredPlayers,
      revealCards,
      revealPickIndex: 0,
      eliminationCandidates: [],
      lastEliminatedId: null,
      lastEliminatedSeatIndex: null,
      winner: null,
      mrWhiteGuessResult: null,
      usedWordKeys: nextUsedWordKeys,
    });
  },

  resetToHome: () => {
    set(initialState());
  },

  finishSession: () => {
    const { players, seatOrder, roundNumber } = get();
    if (seatOrder.length > 0) {
      const finalLeaderboard = [...players]
        .sort((a, b) => b.score - a.score)
        .map((p) => ({ name: p.name, score: p.score }));
      const entry: SessionHistoryEntry = {
        id: `history-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        timestamp: Date.now(),
        playerNames: seatOrder,
        finalLeaderboard,
        roundsPlayed: roundNumber,
      };
      appendHistoryEntry(entry);
    }
    clearActiveSession();
    set(initialState());
  },

  resumeSession: (saved) => {
    set(saved);
  },
}));
