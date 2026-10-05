import { useEffect, useRef, useState } from 'react';
import { walletService } from '../services';
import type { WalletStatus } from '../services/types';
import { logout, useGame } from '../services/gameStore';
import { playerLevel } from '../game/economy';
import type { PageId } from '../App';
import { Wordmark } from './Wordmark';

const NAV: { id: PageId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'farm', label: 'Farm' },
  { id: 'shop', label: 'Miners' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'leaderboard', label: 'Leaderboard' },
];

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

export function TopBar({ page, onNavigate }: Props) {
  const state = useGame();
  const [wallet, setWallet] = useState<WalletStatus>(() => walletService.getStatus());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setWallet(walletService.getStatus()), []);

  // Close the user menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function toggleWallet() {
    if (wallet.connected) {
      await walletService.disconnect();
      setWallet({ connected: false, address: null, network: 'mock' });
    } else {
      setWallet(await walletService.connect());
    }
  }

  return (
    <header className="topbar">
      <div className="brand" onClick={() => onNavigate('dashboard')} role="button" tabIndex={0}>
        <span className="brand-mark" aria-hidden="true" />
        <Wordmark />
      </div>

      <nav className="nav" aria-label="Main">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-link${page === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={page === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="topbar-right">
        {state && (
          <div className="user-menu" ref={menuRef}>
            <button
              className="pill user-chip"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              LV {playerLevel(state.xp)} · {state.username} <span aria-hidden="true">▾</span>
            </button>
            {menuOpen && (
              <div className="user-menu-panel card" role="menu">
                <p className="stat-label">Signed in as</p>
                <p className="user-menu-name">{state.username}</p>
                <button
                  className="btn btn-small btn-block"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Log out
                </button>
                <p className="stat-hint">Your progress is saved and comes back when you log in again.</p>
              </div>
            )}
          </div>
        )}
        <button className={`btn btn-ghost btn-small${wallet.connected ? ' is-on' : ''}`} onClick={toggleWallet}>
          {wallet.connected ? `● ${wallet.address?.slice(0, 12)}…` : 'Connect wallet (mock)'}
        </button>
      </div>
    </header>
  );
}
