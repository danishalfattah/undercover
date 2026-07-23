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
  /** Fixed physical seating position (index into seatOrder) — never changes within a round. */
  seatIndex: number;
  turnOrder: number;
};

export type GameStatus =
  | 'SETUP'
  | 'REVEAL'
  | 'SPEAKING_ORDER'
  | 'VOTING'
  | 'ELIMINATION'
  | 'MR_WHITE_GUESS'
  | 'ROUND_RESULT'
  | 'FINISHED';

/** A face-down card in the reveal grid; role/word is fixed, owner assigned when picked. */
export type RevealCard = {
  index: number;
  role: Role;
  secretWord: string | null;
  takenByPlayerId: string | null;
};

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
  /** Face-down reveal deck for the current round (roles shuffled, owners unassigned). */
  revealCards: RevealCard[];
  /** Which player (by seat order) is currently picking a reveal card. */
  revealPickIndex: number;
  eliminationCandidates: string[]; // player ids tied in the last vote; empty = no tie in progress
  config: GameConfig;
  lastEliminatedId: string | null;
  /** Seat position of the most recently eliminated player, used to resume speaking order after them. */
  lastEliminatedSeatIndex: number | null;
  winner: WinnerSide;
  mrWhiteGuessResult: MrWhiteGuessResult | null;
  /** Keys ("civilian|undercover") of word pairs already used this session (across "Ronde Baru"). Reset on initGame/finishSession. */
  usedWordKeys: string[];
};

export type SessionHistoryEntry = {
  id: string;
  timestamp: number;
  playerNames: string[];
  finalLeaderboard: { name: string; score: number }[]; // sorted desc by score
  roundsPlayed: number;
};

/** Version-controlled wrapper for a GameState snapshot persisted to localStorage. */
export type PersistedSessionSnapshot = {
  schemaVersion: 1;
  savedAt: number;
  state: GameState;
};

/** Version-controlled wrapper for the persisted session history list. */
export type PersistedHistory = {
  schemaVersion: 1;
  entries: SessionHistoryEntry[];
};
