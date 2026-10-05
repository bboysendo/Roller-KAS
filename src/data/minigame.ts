// Config for the "Block Catch" minigame. Tune here, the engine reads these values.

export const MINIGAME = {
  id: 'block-catch',
  name: 'Block Catch',
  description: 'Catch the KAS blocks, dodge the glitches. Time is short.',
  durationSeconds: 30,
  lives: 3,
  lanes: 3,
  /** Blocks that fall per second at the start and at the end of the timer. */
  spawnIntervalStart: 0.8,
  spawnIntervalEnd: 0.4,
  /** Fall speed in lanes-units per second (1 = one full screen height). */
  fallSpeedStart: 0.45,
  fallSpeedEnd: 0.8,
  /** Chance a spawned block is a glitch (must be avoided). */
  glitchChance: 0.3,
  /** Points for a caught KAS block. */
  pointsPerBlock: 10,
  /** ROLL reward per point scored. */
  rollPerPoint: 0.5,
  /** Plays allowed per day. */
  dailyPlays: 5,
} as const;
