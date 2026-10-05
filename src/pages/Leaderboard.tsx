import { LeaderboardTable } from '../components/LeaderboardTable';
import { playerLevel } from '../game/economy';
import { miningService } from '../services';
import { useGame } from '../services/gameStore';

export function Leaderboard() {
  const state = useGame();
  const current = state
    ? {
        name: state.username,
        hashrate: miningService.summarize(state).totalHashrate,
        level: playerLevel(state.xp),
      }
    : null;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Season</p>
          <h1>Leaderboard</h1>
          <p className="muted">Ranked by total hashrate. Your row is highlighted.</p>
        </div>
      </header>
      <LeaderboardTable current={current} />
    </div>
  );
}
