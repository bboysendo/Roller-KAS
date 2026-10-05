// Local persistence (localStorage). Every access is guarded: private mode or blocked storage
// must never crash the game, it just starts without saved progress.
//
// Three keys:
// - PROFILES_KEY: every player's progress (survives logout).
// - SESSION_KEY: which profile is signed in right now (cleared on logout).
// - LEGACY_SAVE_KEY: the single save of the first MVP. Read once to migrate, never deleted.

import { migrateLegacySave, normalizeState, type Profiles } from '../game/profiles';
import type { GameState } from '../game/types';

export const PROFILES_KEY = 'roller-kas.profiles.v1';
export const SESSION_KEY = 'roller-kas.session.v1';
export const LEGACY_SAVE_KEY = 'roller-kas.save.v1';

function isGameState(value: unknown): value is GameState {
  const v = value as GameState | null;
  return !!v && v.version === 1 && typeof v.username === 'string' && Array.isArray(v.miners);
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadProfiles(): Profiles {
  const raw = readJson(PROFILES_KEY);
  const profiles: Profiles = {};
  if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (isGameState(value)) profiles[key] = normalizeState(value);
    }
  }
  const legacy = readJson(LEGACY_SAVE_KEY);
  return migrateLegacySave(profiles, isGameState(legacy) ? normalizeState(legacy) : null);
}

export function writeProfiles(profiles: Profiles): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // Quota or disabled storage: progress will not persist this session.
  }
}

export function getSessionUsername(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setSessionUsername(username: string | null): void {
  try {
    if (username === null) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, username);
  } catch {
    // Without storage the session only lasts until reload.
  }
}
