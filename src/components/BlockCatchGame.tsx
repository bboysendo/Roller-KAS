import { useEffect, useRef, useState } from 'react';
import { ECONOMY } from '../data/economy';
import { MINIGAME } from '../data/minigame';
import { createCatch, moveLane, stepCatch, type CatchState } from '../game/blockCatch';
import { drawCatch, VIEW_HEIGHT, VIEW_WIDTH } from '../game/blockCatchRender';
import { minigamePlaysLeft } from '../game/reducer';
import { dispatch, useGame } from '../services/gameStore';
import { formatInt } from '../utils/format';

type Phase = 'start' | 'playing' | 'result';

interface Summary {
  score: number;
  caught: number;
  roll: number;
  xp: number;
}

/** Start screen, live round and result screen for Block Catch. */
export function BlockCatchGame() {
  const state = useGame();
  const [phase, setPhase] = useState<Phase>('start');
  const [hud, setHud] = useState<CatchState>(() => createCatch());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<CatchState>(createCatch());

  const playsLeft = state ? minigamePlaysLeft(state, Date.now()) : 0;

  function start() {
    const result = dispatch({ type: 'minigame-start' });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    gameRef.current = createCatch();
    setHud(gameRef.current);
    setPhase('playing');
  }

  // Keyboard lane control while playing. Arrows and A/D; no key repeat, so each press is one move.
  useEffect(() => {
    if (phase !== 'playing') return;
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      let dir: -1 | 1 | 0 = 0;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') dir = -1;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') dir = 1;
      if (dir === 0) return;
      e.preventDefault();
      gameRef.current = moveLane(gameRef.current, dir);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // Fixed-timestep-ish loop: dt is clamped so a background tab cannot skip the round.
  useEffect(() => {
    if (phase !== 'playing') return;
    let frame = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const next = stepCatch(gameRef.current, dt, Math.random);
      gameRef.current = next;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) drawCatch(ctx, next);
      setHud(next);

      if (next.status === 'over') {
        dispatch({ type: 'minigame-reward', score: next.score });
        setSummary({
          score: next.score,
          caught: next.caught,
          roll: Math.floor(next.score * MINIGAME.rollPerPoint),
          xp: next.score * ECONOMY.xp.perMinigamePoint,
        });
        setPhase('result');
        return;
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // Initial frame so the canvas is never blank when the round starts.
  useEffect(() => {
    if (phase !== 'playing') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawCatch(ctx, gameRef.current);
  }, [phase]);

  function move(dir: -1 | 1) {
    gameRef.current = moveLane(gameRef.current, dir);
  }

  if (phase === 'start') {
    return (
      <section className="card arcade-panel">
        <h2 className="arcade-title">{MINIGAME.name}</h2>
        <p className="muted">{MINIGAME.description}</p>
        <ul className="rules">
          <li>Move with ← → or A / D (or the on-screen buttons).</li>
          <li>Catch <span className="accent">KAS</span> blocks: +{MINIGAME.pointsPerBlock} points each.</li>
          <li>Avoid red glitches: you lose one of your {MINIGAME.lives} lives.</li>
          <li>Round lasts {MINIGAME.durationSeconds} seconds. Each point is worth {MINIGAME.rollPerPoint} ROLL.</li>
        </ul>
        <div className="arcade-meta">
          Plays left today: <strong>{playsLeft}</strong> / {MINIGAME.dailyPlays}
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-large" onClick={start} disabled={playsLeft <= 0}>
          {playsLeft > 0 ? 'Start round' : 'No plays left'}
        </button>
      </section>
    );
  }

  if (phase === 'result' && summary) {
    return (
      <section className="card arcade-panel">
        <h2 className="arcade-title">{hud.lives <= 0 ? 'GAME OVER' : 'TIME UP'}</h2>
        <div className="result-grid">
          <div>
            <div className="stat-label">Score</div>
            <div className="stat-value accent">{formatInt(summary.score)}</div>
          </div>
          <div>
            <div className="stat-label">Caught</div>
            <div className="stat-value">{summary.caught}</div>
          </div>
          <div>
            <div className="stat-label">ROLL earned</div>
            <div className="stat-value accent-cyan">+{formatInt(summary.roll)}</div>
          </div>
          <div>
            <div className="stat-label">XP earned</div>
            <div className="stat-value accent-amber">+{formatInt(summary.xp)}</div>
          </div>
        </div>
        <div className="arcade-actions">
          <button className="btn btn-primary" onClick={start} disabled={playsLeft <= 0}>
            {playsLeft > 0 ? `Play again (${playsLeft} left)` : 'No plays left today'}
          </button>
          <button className="btn btn-ghost" onClick={() => setPhase('start')}>
            Back
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="arcade-play">
      <div className="hud">
        <div>
          <span className="stat-label">Time</span>
          <strong className="hud-value">{Math.ceil(hud.remaining)}s</strong>
        </div>
        <div>
          <span className="stat-label">Score</span>
          <strong className="hud-value accent">{formatInt(hud.score)}</strong>
        </div>
        <div>
          <span className="stat-label">Lives</span>
          <strong className="hud-value accent-amber">{'♥'.repeat(hud.lives) || '—'}</strong>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="arcade-canvas"
        width={VIEW_WIDTH * 2}
        height={VIEW_HEIGHT * 2}
        aria-label="Block Catch playfield"
      />
      <div className="touch-controls">
        <button className="btn" onPointerDown={() => move(-1)} aria-label="Move left">
          ←
        </button>
        <button className="btn" onPointerDown={() => move(1)} aria-label="Move right">
          →
        </button>
      </div>
    </section>
  );
}
