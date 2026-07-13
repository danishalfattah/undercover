import { create } from 'zustand';
import type { GameState, GameConfig, WordCategory, WinnerSide } from './types';
import {
  allocateRoles,
  assignTurnOrder,
  checkWinner,
  calculateScores,
  validateComposition,
} from './gameLogic';
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
  acknowledgeElimination: () => void;
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

/** Resolve win condition after an elimination is acknowledged. */
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
