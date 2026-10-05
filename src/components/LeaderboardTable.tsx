import { useEffect, useState } from 'react';
import { leaderboardService } from '../services';
import type { LeaderboardEntry } from '../services/types';
import { formatHashrate } from '../utils/format';

interface Props {
  current: { name: string; hashrate: number; level: number } | null;
}

/** Ranked table; the current player's row is highlighted. Mock data via the leaderboard service. */
export function LeaderboardTable({ current }: Props) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Re-query when the player's own numbers change so their row stays current.
  const key = current ? `${current.name}|${current.hashrate}|${current.level}` : 'none';
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    leaderboardService.top(20, current).then((result) => {
      if (cancelled) return;
      setRows(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [key]); // `key` encodes every field of `current` the query uses.

  return (
    <div className="card table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Player</th>
            <th scope="col" className="num">
              Hashrate
            </th>
            <th scope="col" className="num">
              Level
            </th>
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                Loading…
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className={row.isCurrentPlayer ? 'row-you' : undefined}>
              <td>
                <span className={`rank rank-${row.rank <= 3 ? row.rank : 'n'}`}>#{row.rank}</span>
              </td>
              <td>
                {row.name}
                {row.isCurrentPlayer && <span className="pill pill-small">YOU</span>}
              </td>
              <td className="num">{formatHashrate(row.hashrate)}</td>
              <td className="num">{row.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted table-note">Fictitious players. Not connected to any backend yet.</p>
    </div>
  );
}
