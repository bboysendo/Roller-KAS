// Coin branding config. Labels and short names only: no official logos are bundled.
// KAS and ZKAS are simulated resources inside the MVP. They are NOT real tokens and cannot be
// converted to or from ROLL.

export type CoinId = 'kas' | 'zkas';

export interface CoinDefinition {
  id: CoinId;
  /** Short symbol shown on badges. */
  symbol: string;
  /** Label used on the dashboard, e.g. "KAS HASHRATE". */
  hashrateLabel: string;
  /** Label used for the mining lane, e.g. "KAS MINING". */
  miningLabel: string;
  /** Unit used for the simulated production, e.g. "KAS/s". */
  unit: string;
  /** Marker emoji used in the UI. */
  marker: string;
}

export const COINS: Record<CoinId, CoinDefinition> = {
  kas: {
    id: 'kas',
    symbol: 'KAS',
    hashrateLabel: 'KAS HASHRATE',
    miningLabel: 'KAS MINING',
    unit: 'KAS/s',
    marker: '🟢',
  },
  zkas: {
    id: 'zkas',
    symbol: 'ZKAS',
    hashrateLabel: 'ZKAS HASHRATE',
    miningLabel: 'ZKAS MINING',
    unit: 'ZKAS/s',
    marker: '🟣',
  },
};

export const BRAND = {
  name: 'ROLLER KAS',
  tagline: 'KAS + ZKAS MINING',
  arcadeLine: 'Mine KAS. Mine ZKAS.',
} as const;
