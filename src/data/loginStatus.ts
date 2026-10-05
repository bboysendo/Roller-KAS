// Bottom status bar on the login screen. These are DEMO values for the look of the cover,
// not live network data: nothing here is connected to Kaspa or to any server.

export const LOGIN_STATUS = {
  demoBadge: 'DEMO',
  miningHash: '1.25 MH/s',
  blocksFound: 27,
  network: 10,
} as const;

/** Optional art. Drop the PNGs in public/images/ and they appear; if missing, the slot stays empty. */
export const LOGIN_ART = {
  hero: 'images/hero.png',
  mineCart: 'images/mine-cart.png',
} as const;
