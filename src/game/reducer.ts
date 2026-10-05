// Pure state transitions. `applyAction` never touches storage, React or the clock:
// the caller passes `now`. Services and the store wrap it.

import { ECONOMY } from '../data/economy';
import { MINIGAME } from '../data/minigame';
import { getMinerDefinition } from '../data/miners';
import {
  DAY_MS,
  dailyAvailableAt,
  dailyBonusAmount,
  localDay,
  minerUpgradeCost,
  playerLevel,
  productionBetween,
  resourcesBetween,
  slotUnlockCost,
} from './economy';
import type { ActionResult, GameAction, GameState, OwnedMiner } from './types';

export const START_ROLL = 100;

function newId(): string {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * New players start with one KAS miner and one ZKAS miner, both placed, so both
 * simulated coins produce from the first second.
 */
export function createInitialState(username: string, now: number): GameState {
  return {
    version: 1,
    username,
    roll: START_ROLL,
    kas: 0,
    zkas: 0,
    xp: 0,
    miners: [
      { instanceId: newId(), defId: 'basic-miner', level: 1, slot: 0 },
      { instanceId: newId(), defId: 'zkas-miner-1', level: 1, slot: 1 },
    ],
    unlockedSlots: ECONOMY.farm.startingSlots,
    lastTickAt: now,
    lastDailyClaimAt: null,
    dailyStreak: 0,
    minigame: { day: localDay(now), playsToday: 0 },
    stats: {
      minigamesPlayed: 0,
      bestMinigameScore: 0,
      minersBought: 0,
      upgradesBought: 0,
      rollEarned: 0,
      kasMined: 0,
      zkasMined: 0,
    },
  };
}

/** Minigame plays left today (resets when the local day changes). */
export function minigamePlaysLeft(state: GameState, now: number): number {
  const used = state.minigame.day === localDay(now) ? state.minigame.playsToday : 0;
  return Math.max(0, MINIGAME.dailyPlays - used);
}

const ok = (message: string): ActionResult => ({ ok: true, message });
const fail = (message: string): ActionResult => ({ ok: false, message });

function findMiner(state: GameState, instanceId: string): OwnedMiner | undefined {
  return state.miners.find((m) => m.instanceId === instanceId);
}

function firstFreeSlot(state: GameState): number | null {
  for (let slot = 0; slot < state.unlockedSlots; slot++) {
    if (!state.miners.some((m) => m.slot === slot)) return slot;
  }
  return null;
}

/** Applies one action. Returns the new state (same reference when rejected) and a message for the UI. */
export function applyAction(state: GameState, action: GameAction): { state: GameState; result: ActionResult } {
  switch (action.type) {
    case 'set-username': {
      const username = action.username.trim().slice(0, 16);
      if (!username) return { state, result: fail('Pick a username first.') };
      return { state: { ...state, username }, result: ok('Welcome, ' + username + '.') };
    }

    case 'tick': {
      const earned = productionBetween(state.miners, state.lastTickAt, action.now);
      const mined = resourcesBetween(state.miners, state.lastTickAt, action.now);
      return {
        state: {
          ...state,
          roll: state.roll + earned,
          kas: state.kas + mined.kas,
          zkas: state.zkas + mined.zkas,
          stats: {
            ...state.stats,
            rollEarned: state.stats.rollEarned + earned,
            kasMined: state.stats.kasMined + mined.kas,
            zkasMined: state.stats.zkasMined + mined.zkas,
          },
          lastTickAt: Math.max(state.lastTickAt, action.now),
        },
        result: ok(''),
      };
    }

    case 'buy-miner': {
      const def = getMinerDefinition(action.defId);
      if (!def) return { state, result: fail('Unknown miner.') };
      if (playerLevel(state.xp) < def.requiredPlayerLevel) {
        return { state, result: fail(`Requires player level ${def.requiredPlayerLevel}.`) };
      }
      if (state.roll < def.price) return { state, result: fail('Not enough ROLL.') };
      const slot = firstFreeSlot(state);
      const miner: OwnedMiner = { instanceId: newId(), defId: def.id, level: 1, slot };
      return {
        state: {
          ...state,
          roll: state.roll - def.price,
          xp: state.xp + ECONOMY.xp.perMinerBought,
          miners: [...state.miners, miner],
          stats: { ...state.stats, minersBought: state.stats.minersBought + 1 },
        },
        result: ok(`${def.name} acquired${slot === null ? ' (in inventory, farm is full)' : ''}.`),
      };
    }

    case 'place-miner': {
      const miner = findMiner(state, action.instanceId);
      if (!miner) return { state, result: fail('Miner not found.') };
      if (action.slot < 0 || action.slot >= state.unlockedSlots) return { state, result: fail('That slot is locked.') };
      if (state.miners.some((m) => m.slot === action.slot && m.instanceId !== miner.instanceId)) {
        return { state, result: fail('That slot is occupied.') };
      }
      return {
        state: {
          ...state,
          miners: state.miners.map((m) => (m.instanceId === miner.instanceId ? { ...m, slot: action.slot } : m)),
        },
        result: ok('Miner placed.'),
      };
    }

    case 'remove-miner': {
      const miner = findMiner(state, action.instanceId);
      if (!miner) return { state, result: fail('Miner not found.') };
      return {
        state: {
          ...state,
          miners: state.miners.map((m) => (m.instanceId === miner.instanceId ? { ...m, slot: null } : m)),
        },
        result: ok('Miner moved to inventory.'),
      };
    }

    case 'upgrade-miner': {
      const miner = findMiner(state, action.instanceId);
      const def = miner && getMinerDefinition(miner.defId);
      if (!miner || !def) return { state, result: fail('Miner not found.') };
      const cost = minerUpgradeCost(def, miner.level);
      if (cost === null) return { state, result: fail('Already at max level.') };
      if (state.roll < cost) return { state, result: fail('Not enough ROLL.') };
      return {
        state: {
          ...state,
          roll: state.roll - cost,
          xp: state.xp + ECONOMY.xp.perUpgrade,
          miners: state.miners.map((m) =>
            m.instanceId === miner.instanceId ? { ...m, level: m.level + 1 } : m,
          ),
          stats: { ...state.stats, upgradesBought: state.stats.upgradesBought + 1 },
        },
        result: ok(`${def.name} upgraded to level ${miner.level + 1}.`),
      };
    }

    case 'unlock-slot': {
      const cost = slotUnlockCost(state.unlockedSlots);
      if (cost === null) return { state, result: fail('Farm is already at max size.') };
      if (state.roll < cost) return { state, result: fail('Not enough ROLL.') };
      return {
        state: {
          ...state,
          roll: state.roll - cost,
          xp: state.xp + ECONOMY.xp.perSlotUnlocked,
          unlockedSlots: state.unlockedSlots + 1,
        },
        result: ok('New farm slot unlocked.'),
      };
    }

    case 'claim-daily': {
      const available = dailyAvailableAt(state);
      if (available !== null && action.now < available) {
        return { state, result: fail('Daily bonus not ready yet.') };
      }
      // Streak continues if the previous claim was less than 48h ago.
      const continues = state.lastDailyClaimAt !== null && action.now - state.lastDailyClaimAt < 2 * DAY_MS;
      const streak = continues ? state.dailyStreak + 1 : 1;
      const amount = dailyBonusAmount(streak);
      return {
        state: {
          ...state,
          roll: state.roll + amount,
          stats: { ...state.stats, rollEarned: state.stats.rollEarned + amount },
          lastDailyClaimAt: action.now,
          dailyStreak: streak,
        },
        result: ok(`+${amount} ROLL daily bonus (day ${streak}).`),
      };
    }

    case 'minigame-start': {
      if (minigamePlaysLeft(state, action.now) <= 0) {
        return { state, result: fail('No plays left today. Come back tomorrow.') };
      }
      const day = localDay(action.now);
      const used = state.minigame.day === day ? state.minigame.playsToday : 0;
      return {
        state: { ...state, minigame: { day, playsToday: used + 1 } },
        result: ok(''),
      };
    }

    case 'minigame-reward': {
      const score = Math.max(0, Math.floor(action.score));
      const reward = Math.floor(score * MINIGAME.rollPerPoint);
      return {
        state: {
          ...state,
          roll: state.roll + reward,
          xp: state.xp + score * ECONOMY.xp.perMinigamePoint,
          stats: {
            ...state.stats,
            minigamesPlayed: state.stats.minigamesPlayed + 1,
            bestMinigameScore: Math.max(state.stats.bestMinigameScore, score),
            rollEarned: state.stats.rollEarned + reward,
          },
        },
        result: ok(`+${reward} ROLL from Block Catch.`),
      };
    }

    case 'reset': {
      return { state: createInitialState(state.username, action.now), result: ok('Save reset.') };
    }
  }
}
