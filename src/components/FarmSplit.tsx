import type { FarmSplit as FarmSplitData } from '../game/economy';
import { COINS } from '../data/coins';
import { formatHashrate, formatResource } from '../utils/format';

interface Props {
  split: FarmSplitData;
}

/** Share of the farm hashrate going to KAS vs ZKAS, with the simulated production of each. */
export function FarmSplit({ split }: Props) {
  const { kas, zkas } = split;
  const empty = split.totalHashrate === 0;
  const kasPct = Math.round(kas.percent);
  const zkasPct = Math.round(zkas.percent);

  return (
    <section className="card farm-split" aria-label="Farm allocation">
      <div className="farm-split-head">
        <h3 className="section-title">Farm allocation</h3>
        <span className="muted">{formatHashrate(split.totalHashrate)} total</span>
      </div>

      <div className="split-bar" role="img" aria-label={empty ? 'No miners placed' : `KAS ${kasPct}%, ZKAS ${zkasPct}%`}>
        {!empty && <div className="split-kas" style={{ width: `${kas.percent}%` }} />}
        {!empty && <div className="split-zkas" style={{ width: `${zkas.percent}%` }} />}
      </div>

      {empty ? (
        <p className="muted">No miners placed. Place a miner in a slot to start mining.</p>
      ) : (
        <div className="split-legend">
          <div className="legend-item legend-kas">
            <span className="legend-title">
              {COINS.kas.marker} {COINS.kas.symbol} · {kasPct}%
            </span>
            <span>{formatHashrate(kas.hashrate)}</span>
            <span className="muted">
              {formatResource(kas.perSecond)} {COINS.kas.unit} simulated
            </span>
          </div>
          <div className="legend-item legend-zkas">
            <span className="legend-title">
              {COINS.zkas.marker} {COINS.zkas.symbol} · {zkasPct}%
            </span>
            <span>{formatHashrate(zkas.hashrate)}</span>
            <span className="muted">
              {formatResource(zkas.perSecond)} {COINS.zkas.unit} simulated
            </span>
          </div>
        </div>
      )}

      <p className="muted split-note">
        KAS miners count for KAS, ZKAS miners for ZKAS, and dual miners split their hashrate 50/50.
      </p>
    </section>
  );
}
