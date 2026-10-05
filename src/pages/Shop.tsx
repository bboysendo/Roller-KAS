import { MinerTypeBadge } from '../components/CoinBadge';
import { MINER_TYPES, MINERS, type MinerDefinition, type MinerType } from '../data/miners';
import { minerProduction, playerLevel } from '../game/economy';
import { dispatch, useGame } from '../services/gameStore';
import { formatHashrate, formatInt, formatResource } from '../utils/format';

const SECTIONS: MinerType[] = ['kas', 'zkas', 'dual'];

/** Miner shop, grouped by type: KAS miners, ZKAS miners, dual miners. Unlocks are gated by player level. */
export function Shop() {
  const state = useGame();
  if (!state) return null;
  const level = playerLevel(state.xp);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Hardware</p>
          <h1>Miners</h1>
          <p className="muted">Buy miners with ROLL, then place them in your farm. Balance: {formatInt(state.roll)} ROLL.</p>
        </div>
      </header>

      {SECTIONS.map((type) => {
        const defs = MINERS.filter((d) => d.type === type);
        return (
          <section key={type} className="shop-section" aria-label={MINER_TYPES[type].label}>
            <div className="shop-section-head">
              <MinerTypeBadge type={type} />
              <h2 className="section-title">{MINER_TYPES[type].label}</h2>
              <span className="muted">{MINER_TYPES[type].produces}</span>
            </div>
            <div className="shop-grid">
              {defs.map((def) => (
                <ShopCard key={def.id} def={def} level={level} roll={state.roll} owned={state.miners.filter((m) => m.defId === def.id).length} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface CardProps {
  def: MinerDefinition;
  level: number;
  roll: number;
  owned: number;
}

function ShopCard({ def, level, roll, owned }: CardProps) {
  const locked = level < def.requiredPlayerLevel;
  const cannotAfford = roll < def.price;
  const prod = minerProduction(def, 1);
  const max = minerProduction(def, def.maxLevel);
  return (
    <article className={`card shop-card tier-${def.tier}${locked ? ' is-locked' : ''}`}>
      <div className="miner-head">
        <span className="miner-tier">TIER {def.tier}</span>
        {owned > 0 && <span className="pill pill-small">Owned ×{owned}</span>}
      </div>
      <h3 className="miner-name">{def.name}</h3>
      <p className="muted">{def.description}</p>
      <dl className="miner-stats">
        <div>
          <dt>Hashrate</dt>
          <dd>{formatHashrate(prod.hashrate)}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{formatInt(def.price)} ROLL</dd>
        </div>
        {prod.kasPerSecond > 0 && (
          <div>
            <dt>KAS production</dt>
            <dd className="accent">{formatResource(prod.kasPerSecond)}/s</dd>
          </div>
        )}
        {prod.zkasPerSecond > 0 && (
          <div>
            <dt>ZKAS production</dt>
            <dd className="accent-zkas">{formatResource(prod.zkasPerSecond)}/s</dd>
          </div>
        )}
        <div>
          <dt>Upgrades to</dt>
          <dd>
            {formatHashrate(max.hashrate)} (LV {def.maxLevel})
          </dd>
        </div>
        <div>
          <dt>Requires</dt>
          <dd>Level {def.requiredPlayerLevel}</dd>
        </div>
      </dl>
      <button
        className="btn btn-primary btn-block"
        disabled={locked || cannotAfford}
        onClick={() => dispatch({ type: 'buy-miner', defId: def.id })}
      >
        {locked ? `Locked · LV ${def.requiredPlayerLevel}` : `Buy · ${formatInt(def.price)} ROLL`}
      </button>
    </article>
  );
}
