// Mock implementations of the service contracts. Local data only, no network, no money.

import { MOCK_PLAYERS } from '../../data/leaderboard';
import { farmSplit } from '../../game/economy';
import type { GameState } from '../../game/types';
import type {
  LeaderboardEntry,
  LeaderboardService,
  MiningService,
  MiningSummary,
  RewardEntry,
  RewardService,
  WalletService,
  WalletStatus,
} from '../types';

const STORAGE_KEY = 'roller-kas.wallet.mock';

export class MockWalletService implements WalletService {
  getStatus(): WalletStatus {
    try {
      const address = localStorage.getItem(STORAGE_KEY);
      return { connected: !!address, address, network: 'mock' };
    } catch {
      return { connected: false, address: null, network: 'mock' };
    }
  }

  async connect(): Promise<WalletStatus> {
    const address = 'kaspa:mock' + Math.random().toString(36).slice(2, 10);
    try {
      localStorage.setItem(STORAGE_KEY, address);
    } catch {
      // Storage unavailable: the mock session just lasts until reload.
    }
    return { connected: true, address, network: 'mock' };
  }

  async disconnect(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up.
    }
  }
}

export class MockMiningService implements MiningService {
  summarize(state: GameState): MiningSummary {
    const split = farmSplit(state.miners);
    return {
      totalHashrate: split.totalHashrate,
      minersOwned: state.miners.length,
      minersPlaced: state.miners.filter((m) => m.slot !== null).length,
      rollPerSecond: split.rollPerSecond,
      kas: { hashrate: split.kas.hashrate, percent: split.kas.percent, perSecond: split.kas.perSecond },
      zkas: { hashrate: split.zkas.hashrate, percent: split.zkas.percent, perSecond: split.zkas.perSecond },
    };
  }
}

export class MockRewardService implements RewardService {
  private ledger: RewardEntry[] = [];

  record(entry: RewardEntry): void {
    this.ledger = [...this.ledger, entry];
  }

  history(): RewardEntry[] {
    return this.ledger;
  }
}

export class MockLeaderboardService implements LeaderboardService {
  async top(limit: number, current: { name: string; hashrate: number; level: number } | null): Promise<LeaderboardEntry[]> {
    const rows = MOCK_PLAYERS.map((p) => ({
      id: p.id,
      name: p.name,
      hashrate: p.hashrate,
      level: p.level,
      isCurrentPlayer: false,
    }));
    if (current) {
      rows.push({
        id: 'you',
        name: current.name,
        hashrate: Math.round(current.hashrate * 10) / 10,
        level: current.level,
        isCurrentPlayer: true,
      });
    }
    rows.sort((a, b) => b.hashrate - a.hashrate);
    return rows.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));
  }
}
