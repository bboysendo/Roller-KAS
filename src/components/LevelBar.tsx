import { levelProgress } from '../game/economy';
import { formatInt } from '../utils/format';

interface Props {
  xp: number;
}

export function LevelBar({ xp }: Props) {
  const { level, current, next, ratio } = levelProgress(xp);
  const percent = Math.round(ratio * 100);
  return (
    <div className="level-bar">
      <div className="level-bar-head">
        <span>
          LEVEL <strong className="accent">{level}</strong>
        </span>
        <span className="muted">
          {next === null ? 'MAX LEVEL' : `${formatInt(xp)} / ${formatInt(next)} XP`}
        </span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      {next !== null && (
        <div className="stat-hint">{formatInt(next - xp)} XP to level {level + 1} (from {formatInt(current)})</div>
      )}
    </div>
  );
}
