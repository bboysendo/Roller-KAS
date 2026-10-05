// Fictitious leaderboard players. Used by the mock leaderboard service only.

export interface MockPlayer {
  id: string;
  name: string;
  hashrate: number;
  level: number;
}

export const MOCK_PLAYERS: MockPlayer[] = [
  { id: 'p-001', name: 'NeonMiner', hashrate: 412, level: 14 },
  { id: 'p-002', name: 'DAGRunner', hashrate: 368, level: 13 },
  { id: 'p-003', name: 'KHeavyRig', hashrate: 297, level: 12 },
  { id: 'p-004', name: 'GhostHash', hashrate: 251, level: 11 },
  { id: 'p-005', name: 'BlockSurfer', hashrate: 203, level: 10 },
  { id: 'p-006', name: 'VoltCore', hashrate: 176, level: 9 },
  { id: 'p-007', name: 'SiliconSage', hashrate: 139, level: 8 },
  { id: 'p-008', name: 'PulseFarm', hashrate: 102, level: 7 },
  { id: 'p-009', name: 'ZeroLatency', hashrate: 77, level: 6 },
  { id: 'p-010', name: 'CyanNode', hashrate: 48, level: 5 },
  { id: 'p-011', name: 'ByteBaron', hashrate: 31, level: 4 },
  { id: 'p-012', name: 'RookRig', hashrate: 16, level: 3 },
];
