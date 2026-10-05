import { COINS, type CoinId } from '../data/coins';
import { MINER_TYPES, type MinerType } from '../data/miners';

interface Props {
  coin: CoinId;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Text badge for a coin. Not an official logo: just the symbol on a colored disc,
 * so KAS (green) and ZKAS (purple) read apart at a glance.
 */
export function CoinBadge({ coin, size = 'md' }: Props) {
  return (
    <span className={`coin-badge coin-${coin} size-${size}`} aria-label={COINS[coin].symbol}>
      {COINS[coin].symbol}
    </span>
  );
}

const TYPE_TEXT: Record<MinerType, string> = {
  kas: 'KAS',
  zkas: 'ZKAS',
  dual: 'DUAL',
};

/** Miner type pill: 🟢 KAS, 🟣 ZKAS or ⚡ DUAL. */
export function MinerTypeBadge({ type }: { type: MinerType }) {
  return (
    <span className={`type-badge type-${type}`} title={MINER_TYPES[type].produces}>
      <span aria-hidden="true">{MINER_TYPES[type].marker} </span>
      {TYPE_TEXT[type]}
    </span>
  );
}
