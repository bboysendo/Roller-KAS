// Economy tuning. ROLL is a fictitious in-game currency with NO real value.
// Every number here is provisional and meant to be tweaked.

export const ECONOMY = {
  /** ROLL produced per second by 1 TH/s of effective hashrate. */
  rollPerThPerSecond: 0.05,

  /**
   * Simulated KAS / ZKAS production per TH/s of the matching lane per second.
   * 60 TH/s of KAS mining = 0.30 KAS/s. These are internal resources only: never real tokens,
   * never converted to ROLL.
   */
  simulated: {
    kasPerThPerSecond: 0.005,
    zkasPerThPerSecond: 0.005,
  },

  /** Offline mining is capped to this many hours of production. */
  offlineCapHours: 8,

  /** Farm slots: start count, maximum, and price of each extra slot. */
  farm: {
    startingSlots: 4,
    maxSlots: 12,
    /** Cost of unlocking the next slot = base * multiplier^(unlockedExtra). */
    slotUnlockBaseCost: 150,
    slotUnlockMultiplier: 1.5,
  },

  /** Daily bonus, claimable once every 24h. */
  dailyBonus: {
    baseRoll: 200,
    /** Extra ROLL per consecutive day claimed, capped by streakCap. */
    perStreakDayRoll: 50,
    streakCap: 7,
  },

  /** XP rewards for player actions. */
  xp: {
    perRollSpent: 0.1,
    perMinerBought: 50,
    perUpgrade: 25,
    perSlotUnlocked: 75,
    perMinigamePoint: 2,
  },
} as const;

/** Level thresholds: index 0 = level 1. Level N requires LEVEL_XP[N-1] total XP. */
export const LEVEL_XP: number[] = [
  0, // Level 1
  1000, // Level 2
  2500, // Level 3
  4500, // Level 4
  7000, // Level 5
  10000, // Level 6
  14000, // Level 7
  19000, // Level 8
  25000, // Level 9
  32000, // Level 10
  40000, // Level 11
  50000, // Level 12
  62000, // Level 13
  76000, // Level 14
  92000, // Level 15
];
