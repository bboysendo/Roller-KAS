import { getMinerDefinition } from '../data/miners';
import { minerProduction, minerUpgradeCost } from '../game/economy';
import type { OwnedMiner } from '../game/types';
import { formatHashrate, formatInt, formatResource } from '../utils/format';
import { MinerTypeBadge } from './CoinBadge';

interface Props {
  miner: OwnedMiner;
  roll: number;
  onUpgrade: (instanceId: string) => void;
  onRemove?: (instanceId: string) => void;
}

const TIER_NAMES = ['', 'Entry', 'Standard', 'Advanced', 'Pro', 'Elite'];

/** One owned miner: stats, status and the upgrade button. */
export function MinerCard({ miner, roll, onUpgrade, onRemove }: Props) {
  const def = getMinerDefinition(miner.defId);
  if (!def) return null;

  const mining = miner.slot !== null;
  const prod = minerProduction(def, miner.level);
  const hashrate = prod.hashrate;
  const cost = minerUpgradeCost(def, miner.level);
  const canUpgrade = cost !== null && roll >= cost;

  return (
    <article className={`miner-card tier-${def.tier}${mining ? ' is-mining' : ''}`}>
      <div className="miner-head">
        <span className="miner-tier">
          {TIER_NAMES[def.tier]} <MinerTypeBadge type={def.type} />
        </span>
        <span className={`status ${mining ? 'status-mining' : 'status-idle'}`}>
          <span className="status-dot" aria-hidden="true" />
          {mining ? 'MINING' : 'IDLE'}
        </span>
      </div>

      <h3 className="miner-name">{def.name}</h3>

      <dl className="miner-stats">
        <div>
          <dt>Hashrate</dt>
          <dd>{formatHashrate(hashrate)}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>
            {miner.level}
            <span className="muted"> / {def.maxLevel}</span>
          </dd>
        </div>
        {prod.kasPerSecond > 0 && (
          <div>
            <dt>KAS</dt>
            <dd className="accent">{formatResource(prod.kasPerSecond)}/s</dd>
          </div>
        )}
        {prod.zkasPerSecond > 0 && (
          <div>
            <dt>ZKAS</dt>
            <dd className="accent-zkas">{formatResource(prod.zkasPerSecond)}/s</dd>
          </div>
        )}
      </dl>

      <div className="progress progress-thin" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${(miner.level / def.maxLevel) * 100}%` }} />
      </div>

      <div className="miner-actions">
        <button
          className="btn btn-small"
          disabled={!canUpgrade}
          onClick={() => onUpgrade(miner.instanceId)}
          title={cost === null ? 'Max level' : canUpgrade ? '' : 'Not enough ROLL'}
        >
          {cost === null ? 'MAX LEVEL' : `Upgrade · ${formatInt(cost)} ROLL`}
        </button>
        {onRemove && mining && (
          <button className="btn btn-ghost btn-small" onClick={() => onRemove(miner.instanceId)}>
            Store
          </button>
        )}
      </div>
    </article>
  );
}
