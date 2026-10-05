import { useEffect, useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Toast } from './components/Toast';
import { TopBar } from './components/TopBar';
import { Arcade } from './pages/Arcade';
import { Dashboard } from './pages/Dashboard';
import { Farm } from './pages/Farm';
import { Leaderboard } from './pages/Leaderboard';
import { Shop } from './pages/Shop';
import { dispatch, useGame } from './services/gameStore';

export type PageId = 'dashboard' | 'farm' | 'shop' | 'arcade' | 'leaderboard';

const PAGES: PageId[] = ['dashboard', 'farm', 'shop', 'arcade', 'leaderboard'];

function pageFromHash(): PageId {
  const id = window.location.hash.replace(/^#\/?/, '') as PageId;
  return PAGES.includes(id) ? id : 'dashboard';
}

export function App() {
  const state = useGame();
  const [page, setPage] = useState<PageId>(pageFromHash);

  // Hash routing: refresh keeps the page, back/forward work, no router dependency.
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function navigate(next: PageId) {
    window.location.hash = `#/${next}`;
    setPage(next);
    window.scrollTo({ top: 0 });
  }

  // Production ticker: one tick per second while a player is signed in.
  const signedIn = state !== null;
  useEffect(() => {
    if (!signedIn) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(id);
  }, [signedIn]);

  if (!state) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  return (
    <div className="app">
      <TopBar page={page} onNavigate={navigate} />
      <main className="main">
        {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {page === 'farm' && <Farm />}
        {page === 'shop' && <Shop />}
        {page === 'arcade' && <Arcade />}
        {page === 'leaderboard' && <Leaderboard />}
      </main>
      <footer className="footer">
        <span>ROLL is a fictitious in-game currency with no real value. Prototype build, all data is local.</span>
        <button
          className="link-button"
          onClick={() => {
            if (window.confirm('Reset this player\'s progress? Your username stays, the farm and ROLL start over.')) {
              dispatch({ type: 'reset' });
            }
          }}
        >
          Reset save
        </button>
      </footer>
      <Toast />
    </div>
  );
}
