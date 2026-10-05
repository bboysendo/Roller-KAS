import { describe, expect, it } from 'vitest';
import { getSavedProfiles, getState, login, logout, dispatch } from './gameStore';

// Node has no localStorage: storage calls fail soft, so this exercises the store logic only.
// Persistence across page reloads is covered by the storage guards, not by this test.

describe('login / logout keeps progress', () => {
  it('logging out ends the session but keeps the profile, and login restores it', () => {
    const first = login('Session Tester');
    expect(first.ok).toBe(true);
    expect(getState()?.username).toBe('Session Tester');

    const rollBefore = getState()!.roll;
    dispatch({ type: 'minigame-reward', score: 120 });
    const rollAfterGame = getState()!.roll;
    expect(rollAfterGame).toBeGreaterThan(rollBefore);

    logout();
    expect(getState()).toBeNull();
    expect(getSavedProfiles().some((p) => p.username === 'Session Tester')).toBe(true);

    const back = login('session tester');
    expect(back.message).toContain('Progress restored');
    expect(getState()?.roll).toBeCloseTo(rollAfterGame);
    expect(getState()?.stats.minigamesPlayed).toBe(1);
  });

  it('dispatch is refused while logged out', () => {
    logout();
    expect(dispatch({ type: 'tick' }).ok).toBe(false);
  });

  it('rejects an empty username', () => {
    expect(login('   ').ok).toBe(false);
  });
});
