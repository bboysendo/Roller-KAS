import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Dashboard } from './pages/Dashboard';
import { Farm } from './pages/Farm';
import { Shop } from './pages/Shop';
import { LoginScreen } from './components/LoginScreen';
import { dispatch, login } from './services/gameStore';

// Functional render check: the real pages, rendered from the real store state of a new player.
// Node has no DOM, so this checks the markup the browser would show on first paint.

describe('login scene', () => {
  it('shows the brand, the KAS + ZKAS pair, the login field and the status bar', () => {
    const html = renderToStaticMarkup(<LoginScreen />);
    expect(html).toContain('ROLLER');
    expect(html).toContain('KAS + ZKAS MINING');
    expect(html).toContain('Mine KAS. Mine ZKAS.');
    expect(html).toContain('Log in with a username');
    expect(html).toContain('MINING HASH');
    expect(html).toContain('BLOCKS FOUND');
    expect(html).toContain('scene-coins-art'); // coin row art (falls back to text cards if the file is missing)
    expect(html).toContain('scene-hero-art');
  });
});

describe('UI for KAS and ZKAS mining', () => {
  login('UiTester');

  it('dashboard shows KAS, ZKAS and total hashrate with simulated production', () => {
    const html = renderToStaticMarkup(<Dashboard onNavigate={() => {}} />);
    expect(html).toContain('KAS HASHRATE');
    expect(html).toContain('ZKAS HASHRATE');
    expect(html).toContain('TOTAL HASHRATE');
    // New player: basic KAS miner (1 TH/s) and ZKAS Miner I (6 TH/s), both placed.
    expect(html).toContain('1.0 TH/s');
    expect(html).toContain('6.0 TH/s');
    expect(html).toContain('0.005 KAS/s');
    expect(html).toContain('0.030 ZKAS/s');
    expect(html).toContain('7.0 TH/s'); // total
    expect(html).not.toContain('No miners yet');
  });

  it('farm shows the KAS / ZKAS allocation and each miner type badge', () => {
    const html = renderToStaticMarkup(<Farm />);
    expect(html).toContain('Farm allocation');
    expect(html).toContain('KAS · 14%');
    expect(html).toContain('ZKAS · 86%');
    expect(html).toContain('KAS');
    expect(html).toContain('ZKAS');
  });

  it('shop lists the three miner types with what they produce', () => {
    const html = renderToStaticMarkup(<Shop />);
    expect(html).toContain('KAS MINER');
    expect(html).toContain('ZKAS MINER');
    expect(html).toContain('DUAL MINER');
    expect(html).toContain('Produces KAS');
    expect(html).toContain('Produces ZKAS');
    expect(html).toContain('Produces KAS + ZKAS');
  });

  it('a locked dual miner is refused and the farm numbers stay the same', () => {
    // Dual Miner needs player level 4; a new player is level 1, so the purchase must be refused.
    const result = dispatch({ type: 'buy-miner', defId: 'dual-miner-1' });
    expect(result.ok).toBe(false);
    const html = renderToStaticMarkup(<Dashboard onNavigate={() => {}} />);
    expect(html).toContain('7.0 TH/s');
  });
});
