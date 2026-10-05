import { DAY_MS, dailyAvailableAt, dailyBonusAmount } from '../game/economy';
import type { GameState } from '../game/types';
import { dispatch } from '../services/gameStore';
import { formatCountdown, formatInt } from '../utils/format';
import { useNow } from '../utils/useNow';

interface Props {
  state: GameState;
}

/** Once-a-day ROLL bonus. The streak continues if the previous claim was under 48h ago (same rule as the reducer). */
export function DailyBonusCard({ state }: Props) {
  const now = useNow(1000);
  const availableAt = dailyAvailableAt(state);
  const ready = availableAt === null || now >= availableAt;

  const continues = state.lastDailyClaimAt !== null && now - state.lastDailyClaimAt < 2 * DAY_MS;
  const nextStreak = continues ? state.dailyStreak + 1 : 1;
  const amount = dailyBonusAmount(nextStreak);

  return (
    <div className="card daily-card">
      <div className="daily-head">
        <h3 className="section-title">Daily bonus</h3>
        <span className="pill">Streak {state.dailyStreak}</span>
      </div>
      <p className="muted">
        Claim every 24h. Claim within 48h to keep the streak. Day {nextStreak} pays{' '}
        <strong className="accent-cyan">{formatInt(amount)} ROLL</strong>.
      </p>
      <button className="btn btn-primary" disabled={!ready} onClick={() => dispatch({ type: 'claim-daily' })}>
        {ready || availableAt === null ? 'Claim bonus' : `Next in ${formatCountdown(availableAt - now)}`}
      </button>
    </div>
  );
}
