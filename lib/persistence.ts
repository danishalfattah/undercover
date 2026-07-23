import type { GameState, PersistedSessionSnapshot, PersistedHistory, SessionHistoryEntry } from './types';

const SESSION_KEY = 'undercover:active-session';
const HISTORY_KEY = 'undercover:history';
const SCHEMA_VERSION = 1;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function saveActiveSession(state: GameState): void {
  if (!isBrowser()) return;
  try {
    const snapshot: PersistedSessionSnapshot = { schemaVersion: SCHEMA_VERSION, savedAt: Date.now(), state };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage unavailable (private mode / quota / disabled) — silently no-op.
  }
}

export function loadActiveSession(): GameState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSessionSnapshot>;
    if (parsed.schemaVersion !== SCHEMA_VERSION || !parsed.state || typeof parsed.state !== 'object') {
      return null;
    }
    // Minimal shape guard — enough to prevent a crash on render, not full runtime validation.
    const s = parsed.state as GameState;
    if (typeof s.status !== 'string' || !Array.isArray(s.players) || !Array.isArray(s.seatOrder)) {
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // no-op
  }
}

export function loadHistory(): SessionHistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PersistedHistory>;
    if (parsed.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.entries)) return [];
    return parsed.entries;
  } catch {
    return [];
  }
}

export function appendHistoryEntry(entry: SessionHistoryEntry): void {
  if (!isBrowser()) return;
  try {
    const existing = loadHistory();
    const updated: PersistedHistory = { schemaVersion: SCHEMA_VERSION, entries: [entry, ...existing] };
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // no-op
  }
}
