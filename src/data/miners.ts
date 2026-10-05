// Miner catalog. Names, hashrates and prices are PROVISIONAL.
// Change them here; the UI and services read from this file only.
//
// Every miner has a TYPE:
//   kas   -> produces only simulated KAS
//   zkas  -> produces only simulated ZKAS
//   dual  -> produces simulated KAS and ZKAS at the same time (its hashrate is split 50/50)
// Production rates per TH/s live in data/economy.ts (ECONOMY.simulated).

export type MinerType = 'kas' | 'zkas' | 'dual';

export interface MinerTypeInfo {
  label: string;
  /** Short line shown in the shop and on the miner card. */
  produces: string;
  /** Share of this miner's hashrate that counts toward KAS (the rest counts toward ZKAS). */
  kasShare: number;
  zkasShare: number;
  marker: string;
}

export const MINER_TYPES: Record<MinerType, MinerTypeInfo> = {
  kas: { label: 'KAS MINER', produces: 'Produces KAS', kasShare: 1, zkasShare: 0, marker: '🟢' },
  zkas: { label: 'ZKAS MINER', produces: 'Produces ZKAS', kasShare: 0, zkasShare: 1, marker: '🟣' },
  dual: { label: 'DUAL MINER', produces: 'Produces KAS + ZKAS', kasShare: 0.5, zkasShare: 0.5, marker: '⚡' },
};

export interface MinerDefinition {
  id: string;
  name: string;
  type: MinerType;
  /** Base hashrate in TH/s at level 1. */
  hashrate: number;
  /** Price in ROLL to buy the miner. */
  price: number;
  /** Cost in ROLL of upgrading from level 1 to level 2. */
  upgradeBaseCost: number;
  /** Each following level costs previous cost * this multiplier. */
  upgradeCostMultiplier: number;
  /** Hashrate gained per level, as a fraction of base hashrate (0.25 = +25% per level). */
  hashrateGainPerLevel: number;
  maxLevel: number;
  /** Minimum player level required to buy this miner. */
  requiredPlayerLevel: number;
  /** Visual tier, used for colors. */
  tier: 1 | 2 | 3 | 4 | 5;
  description: string;
}

export const MINERS: MinerDefinition[] = [
  {
    id: 'basic-miner',
    name: 'Basic KAS Miner',
    type: 'kas',
    hashrate: 1,
    price: 50,
    upgradeBaseCost: 40,
    upgradeCostMultiplier: 1.6,
    hashrateGainPerLevel: 0.25,
    maxLevel: 10,
    requiredPlayerLevel: 1,
    tier: 1,
    description: 'A cheap rig to get started on KAS.',
  },
  {
    id: 'kas-miner-1',
    name: 'KAS Miner I',
    type: 'kas',
    hashrate: 5,
    price: 300,
    upgradeBaseCost: 250,
    upgradeCostMultiplier: 1.6,
    hashrateGainPerLevel: 0.25,
    maxLevel: 10,
    requiredPlayerLevel: 2,
    tier: 2,
    description: 'Reliable mid-range KAS hashing.',
  },
  {
    id: 'zkas-miner-1',
    name: 'ZKAS Miner I',
    type: 'zkas',
    hashrate: 6,
    price: 420,
    upgradeBaseCost: 320,
    upgradeCostMultiplier: 1.6,
    hashrateGainPerLevel: 0.25,
    maxLevel: 10,
    requiredPlayerLevel: 2,
    tier: 2,
    description: 'Dedicated ZKAS rig with a fast proof pipeline.',
  },
  {
    id: 'kas-miner-2',
    name: 'KAS Miner II',
    type: 'kas',
    hashrate: 15,
    price: 1200,
    upgradeBaseCost: 900,
    upgradeCostMultiplier: 1.7,
    hashrateGainPerLevel: 0.25,
    maxLevel: 10,
    requiredPlayerLevel: 4,
    tier: 3,
    description: 'Dual-chip KAS upgrade with better efficiency.',
  },
  {
    id: 'zkas-miner-2',
    name: 'ZKAS Miner II',
    type: 'zkas',
    hashrate: 15,
    price: 1300,
    upgradeBaseCost: 950,
    upgradeCostMultiplier: 1.7,
    hashrateGainPerLevel: 0.25,
    maxLevel: 10,
    requiredPlayerLevel: 4,
    tier: 3,
    description: 'Second-generation ZKAS rig.',
  },
  {
    id: 'dual-miner-1',
    name: 'Dual Miner',
    type: 'dual',
    hashrate: 20,
    price: 1600,
    upgradeBaseCost: 1200,
    upgradeCostMultiplier: 1.7,
    hashrateGainPerLevel: 0.25,
    maxLevel: 10,
    requiredPlayerLevel: 4,
    tier: 3,
    description: 'Mines KAS and ZKAS at the same time, half the hashrate each.',
  },
  {
    id: 'asic-x1',
    name: 'ASIC X1',
    type: 'dual',
    hashrate: 50,
    price: 5000,
    upgradeBaseCost: 3500,
    upgradeCostMultiplier: 1.7,
    hashrateGainPerLevel: 0.2,
    maxLevel: 10,
    requiredPlayerLevel: 6,
    tier: 4,
    description: 'Dual-algorithm ASIC. Serious hashrate for both coins.',
  },
  {
    id: 'asic-x2',
    name: 'ASIC X2',
    type: 'dual',
    hashrate: 150,
    price: 18000,
    upgradeBaseCost: 12000,
    upgradeCostMultiplier: 1.8,
    hashrateGainPerLevel: 0.2,
    maxLevel: 10,
    requiredPlayerLevel: 9,
    tier: 5,
    description: 'Top-tier dual ASIC for the elite farms.',
  },
];

export function getMinerDefinition(id: string): MinerDefinition | undefined {
  return MINERS.find((m) => m.id === id);
}
