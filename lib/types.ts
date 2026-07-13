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
  lastRoundPoints: number; // points gained in the most recently finished round
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

export type MrWhiteGuessResult = {
  guess: string;
  correct: boolean;
};

export type GameState = {
  status: GameStatus;
  roundNumber: number;
  wordPair: { civilian: string; undercover: string; category: string } | null;
  players: Player[];
  /** Physical seating order (names, as entered in Setup) — fixed for the whole session. */
  seatOrder: string[];
  currentTurnIndex: number;
  revealIndex: number;
  eliminationCandidates: string[]; // player ids tied in the last vote; empty = no tie in progress
  config: GameConfig;
  lastEliminatedId: string | null;
  winner: WinnerSide;
  mrWhiteGuessResult: MrWhiteGuessResult | null;
};
