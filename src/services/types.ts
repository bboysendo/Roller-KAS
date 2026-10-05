// Service contracts. The MVP uses mock/local implementations (see ./mock).
// A future Kaspa backend implements these same interfaces; the UI never imports the mocks directly.

import type { GameState } from '../game/types';

// ---- Wallet ---------------------------------------------------------------

export interface WalletStatus {
  connected: boolean;
  address: string | null;
  /** 'mock' for the MVP; later e.g. 'kaspa-testnet-10' / 'kaspa-mainnet'. */
  network: string;
}

export interface WalletService {
  getStatus(): WalletStatus;
  connect(): Promise<WalletStatus>;
  disconnect(): Promise<void>;
}

// ---- Mining ---------------------------------------------------------------

export interface MiningSummary {
  totalHashrate: number;
  minersOwned: number;
  minersPlaced: number;
  /** ROLL produced per second (internal currency). */
  rollPerSecond: number;
  /** KAS lane: hashrate, share of the farm, and simulated KAS/s. */
  kas: { hashrate: number; percent: number; perSecond: number };
  /** ZKAS lane: hashrate, share of the farm, and simulated ZKAS/s. */
  zkas: { hashrate: number; percent: number; perSecond: number };
}

export interface MiningService {
  summarize(state: GameState): MiningSummary;
}

// ---- Rewards --------------------------------------------------------------

export type RewardSource = 'daily' | 'minigame';

export interface RewardEntry {
  source: RewardSource;
  amount: number;
  at: number;
}

/** Ledger of rewards granted. Later this becomes on-chain reward pools. */
export interface RewardService {
  record(entry: RewardEntry): void;
  history(): RewardEntry[];
}

// ---- Leaderboard ----------------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  hashrate: number;
  level: number;
  isCurrentPlayer: boolean;
}

export interface LeaderboardService {
  top(limit: number, current: { name: string; hashrate: number; level: number } | null): Promise<LeaderboardEntry[]>;
}
