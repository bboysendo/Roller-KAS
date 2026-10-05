import { DailyBonusCard } from '../components/DailyBonusCard';
import { LevelBar } from '../components/LevelBar';
import { StatCard } from '../components/StatCard';
import { CoinBadge } from '../components/CoinBadge';
import { COINS, type CoinId } from '../data/coins';
import { farmSplit, playerLevel } from '../game/economy';
import { minigamePlaysLeft } from '../game/reducer';
import { useGame } from '../services/gameStore';
import { formatHashrate, formatInt, formatResource, formatRoll } from '../utils/format';
import { useAnimatedNumber } from '../utils/useAnimatedNumber';
import { useNow } from '../utils/useNow';
import type { PageId } from '../App';

interface Props {
  onNavigate: (page: PageId) => void;
}

export function Dashboard({ onNavigate }: Props) {
  const state = useGame();
  const now = useNow(1000);
  const roll = useAnimatedNumber(state?.roll ?? 0);
  const kasBalance = useAnimatedNumber(state?.kas ?? 0);
  const zkasBalance = useAnimatedNumber(state?.zkas ?? 0);

  if (!state) return null;

  const split = farmSplit(state.miners);
  const minersPlaced = state.miners.filter((m) => m.slot !== null).length;
  const level = playerLevel(state.xp);
  const playsLeft = minigamePlaysLeft(state, now);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Command center</p>
          <h1>
            Welcome back, <span className="accent">{state.username}</span>
          </h1>
        </div>
      </header>

      <section className="mining-banner" aria-label="KAS and ZKAS mining">
        <div className="mining-banner-title">
          <span className="mining-banner-icon" aria-hidden="true">
            ⛏️
          </span>
          <div>
            <p className="eyebrow">Mining</p>
            <h2>
              KAS <span className="accent-cyan">+</span> ZKAS
            </h2>
          </div>
        </div>
        <div className="mining-banner-coins">
          <CoinBadge coin="kas" />
          <CoinBadge coin="zkas" />
        </div>
      </section>

      <div className="lane-grid">
        <LaneCard
          coin="kas"
          hashrate={split.kas.hashrate}
          percent={split.kas.percent}
          perSecond={split.kas.perSecond}
        />
        <LaneCard
          coin="zkas"
          hashrate={split.zkas.hashrate}
          percent={split.zkas.percent}
          perSecond={split.zkas.perSecond}
        />
        <div className="card lane-card lane-total">
          <div className="lane-head">
            <span className="lane-title">TOTAL HASHRATE</span>
            <span className="pill pill-small">{minersPlaced} placed</span>
          </div>
          <div className="lane-value">{formatHashrate(split.totalHashrate)}</div>
          <div className="lane-meta">
            <span>{formatRoll(roll)} ROLL</span>
            <span className="muted">{split.rollPerSecond.toFixed(2)} ROLL/s</span>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="KAS SIMULATED" icon="🟢" value={formatResource(kasBalance)} accent="green" hint="Internal resource, not a real token" />
        <StatCard label="ZKAS SIMULATED" icon="🟣" value={formatResource(zkasBalance)} accent="purple" hint="Internal resource, not a real token" />
        <StatCard label="ROLL" icon="🪙" value={formatRoll(roll)} accent="cyan" hint="Fictitious, no real value" />
        <StatCard label="MINERS" icon="⛏️" value={state.miners.length} hint={`${minersPlaced} placed in farm`} />
        <StatCard label="LEVEL" value={level} accent="amber" hint={`${formatInt(state.xp)} XP total`} />
        <StatCard label="RESOURCES" icon="🧩" value={`${playsLeft} plays`} accent="cyan" hint={`Farm slots ${state.unlockedSlots}`} />
      </div>

      <div className="split">
        <div className="card">
          <LevelBar xp={state.xp} />
          <div className="quick-actions">
            <button className="btn" onClick={() => onNavigate('farm')}>
              Manage farm
            </button>
            <button className="btn" onClick={() => onNavigate('shop')}>
              Buy miners
            </button>
            <button className="btn btn-primary" onClick={() => onNavigate('arcade')}>
              Play Block Catch
            </button>
          </div>
        </div>
        <DailyBonusCard state={state} />
      </div>
    </div>
  );
}

interface LaneProps {
  coin: CoinId;
  hashrate: number;
  percent: number;
  perSecond: number;
}

/** One coin lane: hashrate, share of the farm, and the simulated production of that coin. */
function LaneCard({ coin, hashrate, percent, perSecond }: LaneProps) {
  const info = COINS[coin];
  const pct = Math.round(percent);
  return (
    <div className={`card lane-card lane-${coin}`}>
      <div className="lane-head">
        <span className="lane-title">
          <span aria-hidden="true">{info.marker} </span>
          {info.hashrateLabel}
        </span>
        <span className="pill pill-small">{pct}% of farm</span>
      </div>
      <div className="lane-value">{formatHashrate(hashrate)}</div>
      <div className="lane-meta">
        <span className={coin === 'kas' ? 'accent' : 'accent-zkas'}>
          {formatResource(perSecond)} {info.unit} simulated
        </span>
        <span className="muted">{hashrate > 0 ? 'Active' : 'No miners yet'}</span>
      </div>
      <div className="progress progress-thin" aria-hidden="true">
        <div className={`progress-fill lane-fill-${coin}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
