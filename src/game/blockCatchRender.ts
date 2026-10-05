// Canvas drawing for Block Catch. Reads state only, never changes it.
// Logical size is fixed; the canvas is scaled by CSS.

import { MINIGAME } from '../data/minigame';
import { CATCH_LINE, type CatchState } from './blockCatch';

export const VIEW_WIDTH = 300;
export const VIEW_HEIGHT = 380;

const COLORS = {
  bg: '#060a08',
  grid: 'rgba(57, 255, 136, 0.08)',
  lane: 'rgba(57, 255, 136, 0.18)',
  catchLine: '#39ff88',
  paddle: '#39ff88',
  kas: '#39ff88',
  kasText: '#04110a',
  glitch: '#ff4d6d',
  glitchStripe: 'rgba(0, 0, 0, 0.35)',
  hitFlash: 'rgba(255, 77, 109, 0.22)',
};

const BLOCK_W = 70;
const BLOCK_H = 34;

function laneCenter(lane: number): number {
  const laneWidth = VIEW_WIDTH / MINIGAME.lanes;
  return laneWidth * lane + laneWidth / 2;
}

export function drawCatch(ctx: CanvasRenderingContext2D, state: CatchState): void {
  ctx.save();
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Background grid.
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW_WIDTH; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, VIEW_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= VIEW_HEIGHT; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(VIEW_WIDTH, y + 0.5);
    ctx.stroke();
  }

  // Lane separators.
  ctx.strokeStyle = COLORS.lane;
  for (let lane = 1; lane < MINIGAME.lanes; lane++) {
    const x = (VIEW_WIDTH / MINIGAME.lanes) * lane;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, VIEW_HEIGHT);
    ctx.stroke();
  }

  // Catch line.
  const catchY = CATCH_LINE * VIEW_HEIGHT;
  ctx.fillStyle = COLORS.catchLine;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, catchY, VIEW_WIDTH, 2);
  ctx.globalAlpha = 1;

  // Falling blocks.
  ctx.font = 'bold 12px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const block of state.blocks) {
    const x = laneCenter(block.lane) - BLOCK_W / 2;
    const y = block.y * VIEW_HEIGHT - BLOCK_H / 2;
    if (block.kind === 'kas') {
      ctx.fillStyle = COLORS.kas;
      roundRect(ctx, x, y, BLOCK_W, BLOCK_H, 6);
      ctx.fill();
      ctx.fillStyle = COLORS.kasText;
      ctx.fillText('KAS', laneCenter(block.lane), y + BLOCK_H / 2 + 1);
    } else {
      ctx.fillStyle = COLORS.glitch;
      roundRect(ctx, x, y, BLOCK_W, BLOCK_H, 6);
      ctx.fill();
      ctx.fillStyle = COLORS.glitchStripe;
      for (let s = 0; s < BLOCK_W; s += 10) ctx.fillRect(x + s, y, 4, BLOCK_H);
    }
  }

  // Player paddle.
  const paddleY = VIEW_HEIGHT * 0.93;
  const paddleX = laneCenter(state.lane) - BLOCK_W / 2;
  ctx.fillStyle = COLORS.paddle;
  roundRect(ctx, paddleX, paddleY, BLOCK_W, 12, 6);
  ctx.fill();

  // Hit flash after a glitch.
  if (state.hitFlash > 0) {
    ctx.fillStyle = COLORS.hitFlash;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
