// Composition root: the single place where mock services are chosen.
// To go on-chain later, swap these instances for real implementations.

import { MockLeaderboardService, MockMiningService, MockRewardService, MockWalletService } from './mock/mockServices';

export const walletService = new MockWalletService();
export const miningService = new MockMiningService();
export const rewardService = new MockRewardService();
export const leaderboardService = new MockLeaderboardService();
