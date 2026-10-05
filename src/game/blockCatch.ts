// Block Catch: pure minigame engine. No DOM, no timers: the caller feeds `dt` (seconds)
// and a random source, and gets back the next state. Tuning lives in data/minigame.ts.

import { MINIGAME } from '../data/minigame';

/** Vertical position where blocks can be caught (0 = top, 1 = bottom). */
export const CATCH_LINE = 0.86;

export type BlockKind = 'kas' | 'glitch';

export interface FallingBlock {
  id: number;
  lane: number;
  /** 0 at the top, 1 at the bottom. */
  y: number;
  kind: BlockKind;
}

export interface CatchState {
  status: 'running' | 'over';
  remaining: number;
  score: number;
  lives: number;
  lane: number;
  blocks: FallingBlock[];
  spawnTimer: number;
  nextId: number;
  caught: number;
  /** Set for one step after a glitch hit, so the UI can flash. */
  hitFlash: number;
}

export type Random = () => number;

export function createCatch(): CatchState {
  return {
    status: 'running',
    remaining: MINIGAME.durationSeconds,
    score: 0,
    lives: MINIGAME.lives,
    lane: Math.floor(MINIGAME.lanes / 2),
    blocks: [],
    spawnTimer: 0.5,
    nextId: 1,
    caught: 0,
    hitFlash: 0,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Progress through the round, 0 at start, 1 at the end. */
export function roundProgress(state: Pick<CatchState, 'remaining'>): number {
  return Math.min(1, Math.max(0, 1 - state.remaining / MINIGAME.durationSeconds));
}

export function moveLane(state: CatchState, direction: -1 | 1): CatchState {
  if (state.status !== 'running') return state;
  const lane = Math.min(MINIGAME.lanes - 1, Math.max(0, state.lane + direction));
  return lane === state.lane ? state : { ...state, lane };
}

/** Advances the simulation by `dt` seconds. */
export function stepCatch(state: CatchState, dt: number, random: Random): CatchState {
  if (state.status !== 'running') return state;

  const remaining = Math.max(0, state.remaining - dt);
  const progress = roundProgress({ remaining });
  const fallSpeed = lerp(MINIGAME.fallSpeedStart, MINIGAME.fallSpeedEnd, progress);
  const spawnInterval = lerp(MINIGAME.spawnIntervalStart, MINIGAME.spawnIntervalEnd, progress);

  let { score, lives, caught, nextId, spawnTimer } = state;
  let blocks = state.blocks.map((b) => ({ ...b, y: b.y + fallSpeed * dt }));
  let hitFlash = Math.max(0, state.hitFlash - dt);

  // Resolve blocks that reached the catch line in the player's lane.
  const remainingBlocks: FallingBlock[] = [];
  for (const block of blocks) {
    const reached = block.y >= CATCH_LINE;
    if (!reached) {
      remainingBlocks.push(block);
      continue;
    }
    if (block.lane === state.lane) {
      if (block.kind === 'kas') {
        score += MINIGAME.pointsPerBlock;
        caught += 1;
      } else {
        lives -= 1;
        hitFlash = 0.35;
      }
    }
    // Reached the line: removed either way (caught or passed).
  }
  blocks = remainingBlocks.filter((b) => b.y < 1.05);

  // Spawn.
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTimer = spawnInterval;
    // Avoid stacking blocks in one lane: prefer a lane whose top is clear.
    const clearLanes = Array.from({ length: MINIGAME.lanes }, (_, i) => i).filter(
      (lane) => !blocks.some((b) => b.lane === lane && b.y < 0.25),
    );
    if (clearLanes.length > 0) {
      const lane = clearLanes[Math.floor(random() * clearLanes.length)];
      const kind: BlockKind = random() < MINIGAME.glitchChance ? 'glitch' : 'kas';
      blocks.push({ id: nextId, lane, y: 0, kind });
      nextId += 1;
    }
  }

  const over = remaining <= 0 || lives <= 0;
  return {
    ...state,
    status: over ? 'over' : 'running',
    remaining,
    score,
    lives: Math.max(0, lives),
    caught,
    blocks,
    spawnTimer,
    nextId,
    hitFlash,
  };
}
