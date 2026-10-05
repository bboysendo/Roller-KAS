// Pure economy formulas. Every number comes from data/ — nothing is hardcoded here.

import { ECONOMY, LEVEL_XP } from '../data/economy';
import { getMinerDefinition, MINER_TYPES, type MinerDefinition } from '../data/miners';
import type { GameState, OwnedMiner } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Hashrate (TH/s) of a miner at a given level. */
export function minerHashrate(def: MinerDefinition, level: number): number {
  return def.hashrate * (1 + def.hashrateGainPerLevel * (level - 1));
}

/** Production of one miner at a given level, per second. */
export interface MinerProduction {
  hashrate: number;
  kasPerSecond: number;
  zkasPerSecond: number;
  rollPerSecond: number;
}

export function minerProduction(def: MinerDefinition, level: number): MinerProduction {
  const hashrate = minerHashrate(def, level);
  const info = MINER_TYPES[def.type];
  return {
    hashrate,
    kasPerSecond: hashrate * info.kasShare * ECONOMY.simulated.kasPerThPerSecond,
    zkasPerSecond: hashrate * info.zkasShare * ECONOMY.simulated.zkasPerThPerSecond,
    rollPerSecond: hashrate * ECONOMY.rollPerThPerSecond,
  };
}

/** ROLL cost to go from `level` to `level + 1`. Returns null at max level. */
export function minerUpgradeCost(def: MinerDefinition, level: number): number | null {
  if (level >= def.maxLevel) return null;
  return Math.round(def.upgradeBaseCost * Math.pow(def.upgradeCostMultiplier, level - 1));
}

/** Cost of unlocking the next farm slot. Returns null when the farm is full. */
export function slotUnlockCost(unlockedSlots: number): number | null {
  if (unlockedSlots >= ECONOMY.farm.maxSlots) return null;
  const extra = unlockedSlots - ECONOMY.farm.startingSlots;
  return Math.round(ECONOMY.farm.slotUnlockBaseCost * Math.pow(ECONOMY.farm.slotUnlockMultiplier, extra));
}

/** Level (1-based) reached with the given total XP. */
export function playerLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) level = i + 1;
  }
  return level;
}

/** Progress toward the next level, 0..1. Returns 1 at the last defined level. */
export function levelProgress(xp: number): { level: number; current: number; next: number | null; ratio: number } {
  const level = playerLevel(xp);
  const current = LEVEL_XP[level - 1];
  const next = LEVEL_XP[level] ?? null;
  if (next === null) return { level, current, next, ratio: 1 };
  return { level, current, next, ratio: (xp - current) / (next - current) };
}

/** Placed miners only (inventory miners produce nothing). Yields each placed miner's definition and level. */
function placedMiners(miners: OwnedMiner[]): { def: MinerDefinition; level: number }[] {
  const out: { def: MinerDefinition; level: number }[] = [];
  for (const m of miners) {
    if (m.slot === null) continue;
    const def = getMinerDefinition(m.defId);
    if (def) out.push({ def, level: m.level });
  }
  return out;
}

/** Hashrate of miners currently placed in the farm. */
export function totalHashrate(miners: OwnedMiner[]): number {
  return placedMiners(miners).reduce((sum, p) => sum + minerHashrate(p.def, p.level), 0);
}

export interface CoinLane {
  /** Hashrate (TH/s) assigned to this coin. Dual miners contribute their share. */
  hashrate: number;
  /** Share of the farm hashrate, 0..100. */
  percent: number;
  /** Simulated production of this coin per second (KAS/s or ZKAS/s). */
  perSecond: number;
}

export interface FarmSplit {
  totalHashrate: number;
  kas: CoinLane;
  zkas: CoinLane;
  /** ROLL produced per second by the whole farm (unchanged economy). */
  rollPerSecond: number;
}

/**
 * Splits the placed farm into KAS and ZKAS hashrate and production.
 * KAS miners count fully for KAS, ZKAS miners for ZKAS, dual miners split by MINER_TYPES.dual.
 * The total hashrate is always kas.hashrate + zkas.hashrate (no double counting).
 */
export function farmSplit(miners: OwnedMiner[]): FarmSplit {
  let kasHr = 0;
  let zkasHr = 0;
  let kasPs = 0;
  let zkasPs = 0;
  let rollPs = 0;
  for (const { def, level } of placedMiners(miners)) {
    const p = minerProduction(def, level);
    kasHr += p.hashrate * MINER_TYPES[def.type].kasShare;
    zkasHr += p.hashrate * MINER_TYPES[def.type].zkasShare;
    kasPs += p.kasPerSecond;
    zkasPs += p.zkasPerSecond;
    rollPs += p.rollPerSecond;
  }
  const total = kasHr + zkasHr;
  const pct = (hr: number) => (total > 0 ? (hr / total) * 100 : 0);
  return {
    totalHashrate: total,
    kas: { hashrate: kasHr, percent: pct(kasHr), perSecond: kasPs },
    zkas: { hashrate: zkasHr, percent: pct(zkasHr), perSecond: zkasPs },
    rollPerSecond: rollPs,
  };
}

/** ROLL produced per second by the whole farm. */
export function productionPerSecond(miners: OwnedMiner[]): number {
  return farmSplit(miners).rollPerSecond;
}

/** Seconds elapsed between two timestamps, capped at the offline limit. */
function cappedSeconds(fromMs: number, toMs: number): number {
  const elapsedSec = Math.max(0, toMs - fromMs) / 1000;
  return Math.min(elapsedSec, ECONOMY.offlineCapHours * 3600);
}

/** ROLL earned by the farm between two timestamps, offline cap included. */
export function productionBetween(miners: OwnedMiner[], fromMs: number, toMs: number): number {
  return productionPerSecond(miners) * cappedSeconds(fromMs, toMs);
}

/** Simulated KAS and ZKAS mined by the farm between two timestamps, offline cap included. */
export function resourcesBetween(miners: OwnedMiner[], fromMs: number, toMs: number): { kas: number; zkas: number } {
  const split = farmSplit(miners);
  const sec = cappedSeconds(fromMs, toMs);
  return { kas: split.kas.perSecond * sec, zkas: split.zkas.perSecond * sec };
}

/** Daily bonus amount for the streak day that is about to be claimed. */
export function dailyBonusAmount(streakDay: number): number {
  const { baseRoll, perStreakDayRoll, streakCap } = ECONOMY.dailyBonus;
  return baseRoll + perStreakDayRoll * (Math.min(streakDay, streakCap) - 1);
}

/** Next daily claim time, or null if it can be claimed now. */
export function dailyAvailableAt(state: Pick<GameState, 'lastDailyClaimAt'>): number | null {
  if (state.lastDailyClaimAt === null) return null;
  return state.lastDailyClaimAt + DAY_MS;
}

/** Returns the local calendar day (YYYY-MM-DD) for a timestamp. */
export function localDay(now: number): string {
  const d = new Date(now);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
