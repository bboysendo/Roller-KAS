// Pure profile helpers: saved players keyed by username. No storage access here,
// so the login/logout rules can be unit tested. Storage lives in services/storage.ts.

import { getMinerDefinition } from '../data/miners';
import type { GameState } from './types';

/** Profile key: usernames are case-insensitive for login. */
export function profileKey(username: string): string {
  return username.trim().toLowerCase();
}

export type Profiles = Record<string, GameState>;

/** Returns a copy of `profiles` with `state` stored under its username. */
export function upsertProfile(profiles: Profiles, state: GameState): Profiles {
  return { ...profiles, [profileKey(state.username)]: state };
}

/**
 * Brings a save from an older version up to the current shape:
 * - simulated KAS / ZKAS balances and totals default to 0;
 * - a save with no ZKAS-producing miner (zkas or dual) receives a ZKAS Miner I in the farm,
 *   or in the inventory when the farm has no free slot, so every player can use both coins.
 * Idempotent: a normalized save is returned unchanged.
 */
export function normalizeState(raw: GameState): GameState {
  const state: GameState = {
    ...raw,
    kas: typeof raw.kas === 'number' ? raw.kas : 0,
    zkas: typeof raw.zkas === 'number' ? raw.zkas : 0,
    stats: {
      ...raw.stats,
      kasMined: raw.stats.kasMined ?? 0,
      zkasMined: raw.stats.zkasMined ?? 0,
    },
  };

  const producesZkas = state.miners.some((m) => {
    const def = getMinerDefinition(m.defId);
    return def !== undefined && (def.type === 'zkas' || def.type === 'dual');
  });
  if (producesZkas) return state;

  const usedSlots = new Set(state.miners.map((m) => m.slot));
  let slot: number | null = null;
  for (let i = 0; i < state.unlockedSlots; i++) {
    if (!usedSlots.has(i)) {
      slot = i;
      break;
    }
  }
  return {
    ...state,
    miners: [
      ...state.miners,
      { instanceId: `starter-zkas-${profileKey(state.username)}`, defId: 'zkas-miner-1', level: 1, slot },
    ],
  };
}

/**
 * Adds the legacy single-save (`roller-kas.save.v1`) to the profiles if it is not there yet.
 * Existing profiles always win, so this is safe to run on every load.
 */
export function migrateLegacySave(profiles: Profiles, legacy: GameState | null): Profiles {
  if (!legacy) return profiles;
  const key = profileKey(legacy.username);
  if (profiles[key]) return profiles;
  return { ...profiles, [key]: legacy };
}

/** Saved profiles, most recently played first. */
export function sortedProfiles(profiles: Profiles): GameState[] {
  return Object.values(profiles).sort((a, b) => b.lastTickAt - a.lastTickAt);
}
