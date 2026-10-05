import { describe, expect, it } from 'vitest';
import { MINERS, MINER_TYPES, getMinerDefinition } from '../data/miners';
import { ECONOMY, LEVEL_XP } from '../data/economy';
import { MINIGAME } from '../data/minigame';
import {
  DAY_MS,
  farmSplit,
  minerHashrate,
  minerProduction,
  minerUpgradeCost,
  playerLevel,
  productionBetween,
  productionPerSecond,
  resourcesBetween,
  slotUnlockCost,
  totalHashrate,
} from './economy';
import { migrateLegacySave, normalizeState, profileKey, sortedProfiles, upsertProfile } from './profiles';
import { applyAction, createInitialState, minigamePlaysLeft } from './reducer';
import { CATCH_LINE, createCatch, moveLane, stepCatch, type CatchState } from './blockCatch';
import type { GameState, OwnedMiner } from './types';

const T0 = new Date(2026, 4, 10, 12, 0, 0).getTime();

function fresh(): GameState {
  return createInitialState('tester', T0);
}

describe('economy', () => {
  it('computes hashrate with per-level gain', () => {
    const basic = MINERS[0];
    expect(minerHashrate(basic, 1)).toBe(basic.hashrate);
    expect(minerHashrate(basic, 3)).toBeCloseTo(basic.hashrate * 1.5);
  });

  it('upgrade cost grows and stops at max level', () => {
    const basic = MINERS[0];
    expect(minerUpgradeCost(basic, 1)).toBe(basic.upgradeBaseCost);
    expect(minerUpgradeCost(basic, 2)!).toBeGreaterThan(minerUpgradeCost(basic, 1)!);
    expect(minerUpgradeCost(basic, basic.maxLevel)).toBeNull();
  });

  it('maps XP to levels using LEVEL_XP thresholds', () => {
    expect(playerLevel(0)).toBe(1);
    expect(playerLevel(LEVEL_XP[1])).toBe(2);
    expect(playerLevel(LEVEL_XP[1] - 1)).toBe(1);
    expect(playerLevel(1e9)).toBe(LEVEL_XP.length);
  });

  it('only placed miners produce', () => {
    const state = fresh();
    expect(totalHashrate(state.miners)).toBeCloseTo(1 + 6); // basic KAS (1 TH) + ZKAS Miner I (6 TH)
    const inventoryOnly = state.miners.map((m) => ({ ...m, slot: null }));
    expect(totalHashrate(inventoryOnly)).toBe(0);
    expect(productionPerSecond(inventoryOnly)).toBe(0);
  });

  it('caps offline production', () => {
    const state = fresh();
    const cap = ECONOMY.offlineCapHours * 3600 * 1000;
    const short = productionBetween(state.miners, 0, 1000);
    const capped = productionBetween(state.miners, 0, cap * 10);
    const atCap = productionBetween(state.miners, 0, cap);
    expect(short).toBeGreaterThan(0);
    expect(capped).toBeCloseTo(atCap);
  });

  it('slot unlock cost increases until the farm is full', () => {
    const first = slotUnlockCost(ECONOMY.farm.startingSlots)!;
    const second = slotUnlockCost(ECONOMY.farm.startingSlots + 1)!;
    expect(second).toBeGreaterThan(first);
    expect(slotUnlockCost(ECONOMY.farm.maxSlots)).toBeNull();
  });
});

describe('reducer', () => {
  it('starts with a KAS miner and a ZKAS miner, both placed, and the starting ROLL', () => {
    const state = fresh();
    expect(state.roll).toBe(100);
    expect(state.miners).toHaveLength(2);
    expect(state.miners.find((m) => m.defId === 'basic-miner')?.slot).not.toBeNull();
    expect(state.miners.find((m) => m.defId === 'zkas-miner-1')?.slot).not.toBeNull();
    const split = farmSplit(state.miners);
    expect(split.kas.hashrate).toBeGreaterThan(0);
    expect(split.zkas.hashrate).toBeGreaterThan(0);
    expect(state.kas).toBe(0);
    expect(state.zkas).toBe(0);
  });

  it('tick adds production over elapsed time', () => {
    const state = fresh();
    const { state: next } = applyAction(state, { type: 'tick', now: T0 + 60_000 });
    expect(next.roll).toBeCloseTo(state.roll + productionBetween(state.miners, T0, T0 + 60_000));
    expect(next.lastTickAt).toBe(T0 + 60_000);
  });

  it('tick accrues simulated KAS and ZKAS alongside ROLL', () => {
    const state = fresh();
    const { state: next } = applyAction(state, { type: 'tick', now: T0 + 100_000 });
    const expected = farmSplit(state.miners);
    expect(next.kas).toBeCloseTo(expected.kas.perSecond * 100);
    expect(next.zkas).toBeCloseTo(expected.zkas.perSecond * 100);
    expect(next.kas).toBeGreaterThan(0);
    expect(next.zkas).toBeGreaterThan(0);
    expect(next.stats.kasMined).toBeCloseTo(next.kas);
    expect(next.stats.zkasMined).toBeCloseTo(next.zkas);
    expect(resourcesBetween(state.miners, T0, T0 + 100_000).kas).toBeCloseTo(next.kas);
  });

  it('buying a miner costs ROLL, gives XP and places it in the first free slot', () => {
    const state = { ...fresh(), roll: 1000, xp: LEVEL_XP[1] };
    const { state: next, result } = applyAction(state, { type: 'buy-miner', defId: 'kas-miner-1' });
    expect(result.ok).toBe(true);
    expect(next.roll).toBe(1000 - MINERS[1].price);
    expect(next.xp).toBe(LEVEL_XP[1] + ECONOMY.xp.perMinerBought);
    expect(next.miners.find((m) => m.defId === 'kas-miner-1')?.slot).toBe(2); // slots 0 and 1 are taken at start
  });

  it('rejects buying without enough ROLL or below the required level', () => {
    const poor = fresh();
    expect(applyAction(poor, { type: 'buy-miner', defId: 'basic-miner' }).result.ok).toBe(true);
    expect(applyAction(poor, { type: 'buy-miner', defId: 'kas-miner-1' }).result.ok).toBe(false);
    const locked = { ...fresh(), roll: 1e9 };
    expect(applyAction(locked, { type: 'buy-miner', defId: 'asic-x2' }).result.ok).toBe(false);
  });

  it('refuses to place a miner in an occupied or locked slot', () => {
    const state = fresh();
    const second = { ...state, miners: [...state.miners, { instanceId: 'x', defId: 'basic-miner', level: 1, slot: null }] };
    expect(applyAction(second, { type: 'place-miner', instanceId: 'x', slot: 0 }).result.ok).toBe(false);
    expect(applyAction(second, { type: 'place-miner', instanceId: 'x', slot: 99 }).result.ok).toBe(false);
    expect(applyAction(second, { type: 'place-miner', instanceId: 'x', slot: 2 }).result.ok).toBe(true);
  });

  it('upgrades a miner and raises its hashrate', () => {
    const state = { ...fresh(), roll: 10_000 };
    const id = state.miners[0].instanceId;
    const { state: next } = applyAction(state, { type: 'upgrade-miner', instanceId: id });
    expect(next.miners[0].level).toBe(2);
    expect(totalHashrate(next.miners)).toBeGreaterThan(totalHashrate(state.miners));
  });

  it('daily bonus: once per day, streak continues within 48h and resets after', () => {
    const state = fresh();
    const day1 = applyAction(state, { type: 'claim-daily', now: T0 });
    expect(day1.result.ok).toBe(true);
    expect(day1.state.dailyStreak).toBe(1);

    const tooSoon = applyAction(day1.state, { type: 'claim-daily', now: T0 + DAY_MS / 2 });
    expect(tooSoon.result.ok).toBe(false);

    const day2 = applyAction(day1.state, { type: 'claim-daily', now: T0 + DAY_MS + 60_000 });
    expect(day2.state.dailyStreak).toBe(2);

    const late = applyAction(day2.state, { type: 'claim-daily', now: T0 + 5 * DAY_MS });
    expect(late.state.dailyStreak).toBe(1);
  });

  it('minigame plays are limited per day', () => {
    let state = fresh();
    for (let i = 0; i < MINIGAME.dailyPlays; i++) {
      state = applyAction(state, { type: 'minigame-start', now: T0 }).state;
    }
    expect(minigamePlaysLeft(state, T0)).toBe(0);
    expect(applyAction(state, { type: 'minigame-start', now: T0 }).result.ok).toBe(false);
    expect(minigamePlaysLeft(state, T0 + DAY_MS)).toBe(MINIGAME.dailyPlays);
  });

  it('minigame reward converts score to ROLL and XP', () => {
    const state = fresh();
    const { state: next } = applyAction(state, { type: 'minigame-reward', score: 200 });
    expect(next.roll).toBe(state.roll + 200 * MINIGAME.rollPerPoint);
    expect(next.xp).toBe(200 * ECONOMY.xp.perMinigamePoint);
    expect(next.stats.bestMinigameScore).toBe(200);
  });

  it('rejects an empty username', () => {
    expect(applyAction(fresh(), { type: 'set-username', username: '   ' }).result.ok).toBe(false);
  });
});

describe('miner types', () => {
  it('every miner is kas, zkas or dual, and all three types exist', () => {
    for (const m of MINERS) expect(['kas', 'zkas', 'dual']).toContain(m.type);
    expect(MINERS.some((m) => m.type === 'kas')).toBe(true);
    expect(MINERS.some((m) => m.type === 'zkas')).toBe(true);
    expect(MINERS.some((m) => m.type === 'dual')).toBe(true);
  });

  it('a KAS miner produces only KAS, a ZKAS miner only ZKAS, a dual miner both', () => {
    const kas = minerProduction(getMinerDefinition('kas-miner-1')!, 1);
    expect(kas.kasPerSecond).toBeGreaterThan(0);
    expect(kas.zkasPerSecond).toBe(0);

    const zkas = minerProduction(getMinerDefinition('zkas-miner-1')!, 1);
    expect(zkas.zkasPerSecond).toBeGreaterThan(0);
    expect(zkas.kasPerSecond).toBe(0);

    const dual = minerProduction(getMinerDefinition('dual-miner-1')!, 1);
    expect(dual.kasPerSecond).toBeGreaterThan(0);
    expect(dual.zkasPerSecond).toBeGreaterThan(0);
  });

  it('miner type info matches the produced coins', () => {
    expect(MINER_TYPES.kas.kasShare + MINER_TYPES.kas.zkasShare).toBe(1);
    expect(MINER_TYPES.zkas.kasShare + MINER_TYPES.zkas.zkasShare).toBe(1);
    expect(MINER_TYPES.dual.kasShare + MINER_TYPES.dual.zkasShare).toBe(1);
  });
});

describe('farm split (KAS / ZKAS hashrate and production)', () => {
  const placed = (defId: string, slot: number, level = 1): OwnedMiner => ({ instanceId: `${defId}-${slot}`, defId, level, slot });

  it('a KAS-only farm has no ZKAS hashrate or production', () => {
    const split = farmSplit([placed('kas-miner-1', 0)]);
    expect(split.kas.hashrate).toBeCloseTo(5);
    expect(split.zkas.hashrate).toBe(0);
    expect(split.zkas.perSecond).toBe(0);
    expect(split.zkas.percent).toBe(0);
    expect(split.kas.percent).toBeCloseTo(100);
  });

  it('60 TH/s of KAS mining produces 0.30 KAS/s', () => {
    // 4 x KAS Miner II (15 TH/s each)
    const miners = [0, 1, 2, 3].map((slot) => placed('kas-miner-2', slot));
    const split = farmSplit(miners);
    expect(split.kas.hashrate).toBeCloseTo(60);
    expect(split.kas.perSecond).toBeCloseTo(0.3);
  });

  it('a ZKAS-only farm produces only ZKAS', () => {
    const split = farmSplit([placed('zkas-miner-2', 0)]);
    expect(split.zkas.hashrate).toBeCloseTo(15);
    expect(split.zkas.perSecond).toBeCloseTo(0.075);
    expect(split.kas.hashrate).toBe(0);
    expect(split.kas.perSecond).toBe(0);
  });

  it('a dual miner splits its hashrate 50/50 and produces both coins', () => {
    const split = farmSplit([placed('dual-miner-1', 0)]);
    expect(split.kas.hashrate).toBeCloseTo(10);
    expect(split.zkas.hashrate).toBeCloseTo(10);
    expect(split.kas.perSecond).toBeCloseTo(0.05);
    expect(split.zkas.perSecond).toBeCloseTo(0.05);
  });

  it('KAS + ZKAS hashrate equals the farm total, percentages add up, inventory is ignored', () => {
    const miners = [placed('kas-miner-1', 0), placed('zkas-miner-1', 1), placed('asic-x1', 2), { ...placed('kas-miner-2', 3), slot: null }];
    const split = farmSplit(miners);
    expect(split.kas.hashrate + split.zkas.hashrate).toBeCloseTo(totalHashrate(miners));
    expect(split.totalHashrate).toBeCloseTo(totalHashrate(miners));
    expect(split.kas.percent + split.zkas.percent).toBeCloseTo(100);
    expect(split.rollPerSecond).toBeCloseTo(productionPerSecond(miners));
  });

  it('an empty farm reports zero everywhere', () => {
    const split = farmSplit([]);
    expect(split.totalHashrate).toBe(0);
    expect(split.kas.percent).toBe(0);
    expect(split.zkas.percent).toBe(0);
  });
});

describe('block catch', () => {
  const never: () => number = () => 0.99; // no glitches, always the same lane spawn

  it('starts running with full time and lives', () => {
    const s = createCatch();
    expect(s.status).toBe('running');
    expect(s.remaining).toBe(MINIGAME.durationSeconds);
    expect(s.lives).toBe(MINIGAME.lives);
  });

  it('catching a KAS block in the player lane scores points', () => {
    let s: CatchState = { ...createCatch(), blocks: [{ id: 1, lane: 1, y: CATCH_LINE - 0.01, kind: 'kas' }], lane: 1, spawnTimer: 99 };
    s = stepCatch(s, 0.05, never);
    expect(s.score).toBe(MINIGAME.pointsPerBlock);
    expect(s.caught).toBe(1);
    expect(s.blocks).toHaveLength(0);
  });

  it('a glitch in the player lane costs a life', () => {
    let s: CatchState = { ...createCatch(), blocks: [{ id: 1, lane: 1, y: CATCH_LINE - 0.01, kind: 'glitch' }], lane: 1, spawnTimer: 99 };
    s = stepCatch(s, 0.05, never);
    expect(s.lives).toBe(MINIGAME.lives - 1);
    expect(s.score).toBe(0);
  });

  it('blocks in other lanes are ignored', () => {
    let s: CatchState = { ...createCatch(), blocks: [{ id: 1, lane: 0, y: CATCH_LINE - 0.01, kind: 'glitch' }], lane: 2, spawnTimer: 99 };
    s = stepCatch(s, 0.05, never);
    expect(s.lives).toBe(MINIGAME.lives);
  });

  it('ends when time runs out', () => {
    let s = createCatch();
    s = stepCatch(s, MINIGAME.durationSeconds + 1, never);
    expect(s.status).toBe('over');
  });

  it('ends when lives reach zero', () => {
    let s: CatchState = { ...createCatch(), lives: 1, blocks: [{ id: 1, lane: 1, y: CATCH_LINE - 0.01, kind: 'glitch' }], lane: 1, spawnTimer: 99 };
    s = stepCatch(s, 0.05, never);
    expect(s.status).toBe('over');
    expect(s.lives).toBe(0);
  });

  it('clamps the lane to the board', () => {
    let s = createCatch();
    for (let i = 0; i < 10; i++) s = moveLane(s, -1);
    expect(s.lane).toBe(0);
    for (let i = 0; i < 10; i++) s = moveLane(s, 1);
    expect(s.lane).toBe(MINIGAME.lanes - 1);
  });
});

describe('profiles (login / logout) and save upgrades', () => {
  it('profile keys are case-insensitive and trimmed', () => {
    expect(profileKey('  NeonMiner ')).toBe('neonminer');
    expect(profileKey('neonminer')).toBe(profileKey('NEONMINER'));
  });

  it('upsert keeps other profiles and replaces the same player', () => {
    const a = createInitialState('Alice', T0);
    const b = createInitialState('Bob', T0);
    let profiles = upsertProfile({}, a);
    profiles = upsertProfile(profiles, b);
    const aPlayed = { ...a, roll: 999 };
    profiles = upsertProfile(profiles, aPlayed);
    expect(Object.keys(profiles).sort()).toEqual(['alice', 'bob']);
    expect(profiles.alice.roll).toBe(999);
  });

  it('migrating the legacy single save never overwrites an existing profile', () => {
    const legacy = { ...createInitialState('Legacy', T0), roll: 5 };
    const migrated = migrateLegacySave({}, legacy);
    expect(migrated.legacy.roll).toBe(5);

    const existing = { ...createInitialState('Legacy', T0), roll: 777 };
    const kept = migrateLegacySave({ legacy: existing }, legacy);
    expect(kept.legacy.roll).toBe(777);
    expect(migrateLegacySave({}, null)).toEqual({});
  });

  it('login list is most recently played first', () => {
    const old = { ...createInitialState('Old', T0), lastTickAt: T0 };
    const recent = { ...createInitialState('Recent', T0), lastTickAt: T0 + DAY_MS };
    expect(sortedProfiles({ old, recent }).map((p) => p.username)).toEqual(['Recent', 'Old']);
  });

  it('a fresh save is already normalized and stays unchanged', () => {
    const state = fresh();
    expect(normalizeState(state)).toEqual(state);
  });

  it('an older save without ZKAS miners gets a ZKAS Miner I and zeroed KAS/ZKAS balances', () => {
    // Shape of a save from the previous version: only KAS-type miners, no kas/zkas fields.
    const legacy = {
      ...fresh(),
      miners: [{ instanceId: 'old-basic', defId: 'basic-miner', level: 3, slot: 0 }],
      stats: { minigamesPlayed: 2, bestMinigameScore: 40, minersBought: 1, upgradesBought: 0, rollEarned: 90 },
    } as unknown as GameState;
    delete (legacy as Partial<GameState>).kas;
    delete (legacy as Partial<GameState>).zkas;

    const upgraded = normalizeState(legacy);
    expect(upgraded.kas).toBe(0);
    expect(upgraded.zkas).toBe(0);
    expect(upgraded.stats.kasMined).toBe(0);
    expect(upgraded.miners.some((m) => m.defId === 'zkas-miner-1')).toBe(true);
    expect(upgraded.miners.find((m) => m.defId === 'basic-miner')?.level).toBe(3); // progress kept
    expect(farmSplit(upgraded.miners).zkas.hashrate).toBeGreaterThan(0);

    // Running the upgrade again changes nothing.
    expect(normalizeState(upgraded)).toEqual(upgraded);
  });
});
