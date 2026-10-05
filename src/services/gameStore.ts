// App store: holds the signed-in player, applies reducer actions, persists progress per profile
// and notifies React. Actions that need the clock get `now` injected here, so components
// never call Date.now() themselves.
//
// Login/logout: logging out only ends the session. The profile (progress) stays in storage,
// and logging in again with the same username restores it.

import { useSyncExternalStore } from 'react';
import { applyAction, createInitialState } from '../game/reducer';
import { profileKey, sortedProfiles, upsertProfile, type Profiles } from '../game/profiles';
import type { ActionResult, GameAction, GameState } from '../game/types';
import { rewardService } from './index';
import { getSessionUsername, loadProfiles, setSessionUsername, writeProfiles } from './storage';

/** Action as components write it: `now` is filled in by the store. */
export type StoreAction = GameAction extends infer A ? (A extends { now: number } ? Omit<A, 'now'> : A) : never;

export interface Notice {
  id: number;
  ok: boolean;
  text: string;
}

type Listener = () => void;

const USERNAME_MAX = 16;

let state: GameState | null = null;
let profiles: Profiles = {};
let notice: Notice | null = null;
let noticeSeq = 0;
const stateListeners = new Set<Listener>();
const noticeListeners = new Set<Listener>();

function emit(set: Set<Listener>) {
  set.forEach((l) => l());
}

function notify(ok: boolean, text: string) {
  if (!text) return;
  notice = { id: ++noticeSeq, ok, text };
  emit(noticeListeners);
}

/** Saves the current player's progress under their profile. */
function persist() {
  if (!state) return;
  profiles = upsertProfile(profiles, state);
  writeProfiles(profiles);
}

function init() {
  profiles = loadProfiles();
  const session = getSessionUsername();
  if (!session) return;
  const saved = profiles[profileKey(session)];
  if (!saved) {
    setSessionUsername(null);
    return;
  }
  // Offline production is applied through a regular tick (capped in economy.ts).
  state = applyAction(saved, { type: 'tick', now: Date.now() }).state;
  persist();
}
init();

export function getState(): GameState | null {
  return state;
}

/** Profiles saved in this browser, for the login screen. */
export function getSavedProfiles(): GameState[] {
  return sortedProfiles(profiles);
}

/** Signs in with a username. Restores the saved progress if the profile exists, otherwise creates it. */
export function login(rawUsername: string): ActionResult {
  const username = rawUsername.trim().slice(0, USERNAME_MAX);
  if (!username) return { ok: false, message: 'Pick a username first.' };

  const now = Date.now();
  const existing = profiles[profileKey(username)];
  if (existing) {
    state = applyAction(existing, { type: 'tick', now }).state;
  } else {
    state = createInitialState(username, now);
  }
  setSessionUsername(state.username);
  persist();
  emit(stateListeners);

  const message = existing ? `Welcome back, ${state.username}. Progress restored.` : `Welcome, ${state.username}.`;
  notify(true, message);
  return { ok: true, message };
}

/** Ends the session. Progress stays saved and can be recovered by logging in again. */
export function logout(): void {
  if (!state) return;
  const name = state.username;
  persist();
  setSessionUsername(null);
  state = null;
  emit(stateListeners);
  notify(true, `Logged out. ${name}'s progress is saved.`);
}

export function dispatch(action: StoreAction): ActionResult {
  const now = Date.now();
  const full = { ...action, now } as GameAction;

  if (state === null) return { ok: false, message: 'Log in first.' };

  const before = state;
  const next = applyAction(state, full);
  if (next.state !== state) {
    state = next.state;
    persist();
    emit(stateListeners);
  }

  // Ticks are silent; everything else gets a toast.
  if (action.type !== 'tick') notify(next.result.ok, next.result.message);

  // Reward ledger: only the sources that are real grants (not passive production).
  if (next.result.ok && (action.type === 'claim-daily' || action.type === 'minigame-reward')) {
    const amount = next.state.roll - before.roll;
    rewardService.record({ source: action.type === 'claim-daily' ? 'daily' : 'minigame', amount, at: now });
  }

  return next.result;
}

export function dismissNotice() {
  notice = null;
  emit(noticeListeners);
}

function subscribeState(listener: Listener) {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

function subscribeNotice(listener: Listener) {
  noticeListeners.add(listener);
  return () => noticeListeners.delete(listener);
}

export function useGame(): GameState | null {
  return useSyncExternalStore(subscribeState, getState, getState);
}

export function useNotice(): Notice | null {
  return useSyncExternalStore(
    subscribeNotice,
    () => notice,
    () => notice,
  );
}
