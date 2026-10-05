// Domain types for the player's save. Pure data, no React, no storage.

export interface OwnedMiner {
  instanceId: string;
  /** Id of the MinerDefinition in data/miners.ts. */
  defId: string;
  level: number;
  /** Farm slot index, or null when the miner sits in the inventory. */
  slot: number | null;
}

export interface PlayerStats {
  minigamesPlayed: number;
  bestMinigameScore: number;
  minersBought: number;
  upgradesBought: number;
  rollEarned: number;
  /** Simulated KAS and ZKAS mined in total (never converted to ROLL). */
  kasMined: number;
  zkasMined: number;
}

export interface GameState {
  version: 1;
  username: string;
  roll: number;
  /** Simulated KAS balance. Internal resource of the MVP, not a real token. */
  kas: number;
  /** Simulated ZKAS balance. Internal resource of the MVP, not a real token. */
  zkas: number;
  xp: number;
  miners: OwnedMiner[];
  unlockedSlots: number;
  /** Timestamp (ms) of the last production tick. */
  lastTickAt: number;
  lastDailyClaimAt: number | null;
  dailyStreak: number;
  minigame: {
    /** Local date (YYYY-MM-DD) the daily counter refers to. */
    day: string;
    playsToday: number;
  };
  stats: PlayerStats;
}

export type GameAction =
  | { type: 'set-username'; username: string }
  | { type: 'tick'; now: number }
  | { type: 'buy-miner'; defId: string }
  | { type: 'place-miner'; instanceId: string; slot: number }
  | { type: 'remove-miner'; instanceId: string }
  | { type: 'upgrade-miner'; instanceId: string }
  | { type: 'unlock-slot' }
  | { type: 'claim-daily'; now: number }
  | { type: 'minigame-start'; now: number }
  | { type: 'minigame-reward'; score: number }
  | { type: 'reset'; now: number };

export interface ActionResult {
  ok: boolean;
  message: string;
}
