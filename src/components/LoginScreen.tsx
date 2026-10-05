import { useState, type FormEvent } from 'react';
import { BRAND, COINS } from '../data/coins';
import { LOGIN_ART, LOGIN_STATUS } from '../data/loginStatus';
import { playerLevel } from '../game/economy';
import { getSavedProfiles, login } from '../services/gameStore';
import { CoinBadge } from './CoinBadge';

/** Public asset URL. BASE_URL is './' in the Vite config, so this works from any folder. */
function art(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

/**
 * Arcade cover shown before login: hero on the left, title and KAS / ZKAS cards with the
 * mine cart between them, username login, and a status bar. Local profiles only: no password,
 * no wallet. Logging out returns here; logging back in restores progress.
 */
export function LoginScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Without hero.png the scene switches to one centered column instead of an empty left half.
  const [heroMissing, setHeroMissing] = useState(false);
  const [coinArtMissing, setCoinArtMissing] = useState(false);
  const profiles = getSavedProfiles();

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = login(name);
    if (!result.ok) setError(result.message);
  }

  return (
    <div className="scene">
      <div className="scene-glow" aria-hidden="true" />

      <div className={`scene-main${heroMissing ? ' is-solo' : ''}`}>
        {!heroMissing && (
          <div className="scene-hero" aria-hidden="true">
            <img
              className="scene-hero-art"
              src={art(LOGIN_ART.hero)}
              alt=""
              onError={() => setHeroMissing(true)}
            />
          </div>
        )}

        <div className="scene-content">
          <p className="scene-banner">WELCOME, MINER</p>
          <p className="scene-kicker">MINING ARCADE</p>
          <h1 className="scene-title">
            ROLLER <span className="accent">KAS</span>
          </h1>
          <p className="scene-tag">{BRAND.tagline}</p>
          <p className="scene-line">{BRAND.arcadeLine}</p>

          <div className="scene-coins" role="img" aria-label="KAS and ZKAS, partner coins of the same ecosystem">
            {!coinArtMissing ? (
              <img
                className="scene-coins-art"
                src={art(LOGIN_ART.mineCart)}
                alt=""
                onError={() => setCoinArtMissing(true)}
              />
            ) : (
              <>
                <div className="coin-card coin-card-kas">
                  <CoinBadge coin="kas" size="sm" />
                  <span className="coin-card-label">{COINS.kas.symbol}</span>
                </div>
                <span className="coin-handshake" aria-hidden="true">
                  🤝
                </span>
                <div className="coin-card coin-card-zkas">
                  <CoinBadge coin="zkas" size="sm" />
                  <span className="coin-card-label">{COINS.zkas.symbol}</span>
                </div>
              </>
            )}
          </div>

          <form onSubmit={submit} className="scene-login">
            <label htmlFor="username">Log in with a username</label>
            <div className="scene-login-row">
              <input
                id="username"
                className="input"
                value={name}
                maxLength={16}
                autoFocus
                autoComplete="username"
                placeholder="e.g. NeonMiner"
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
              />
              <button className="btn btn-primary" type="submit">
                Enter
              </button>
            </div>
            {error && <p className="form-error">{error}</p>}
          </form>

          {profiles.length > 0 && (
            <div className="saved-profiles">
              <p className="scene-saved-label">SAVED ON THIS DEVICE</p>
              <div className="saved-profiles-list">
                {profiles.map((p) => (
                  <button key={p.username} className="profile-chip" onClick={() => setName(p.username)}>
                    {p.username} · LV {playerLevel(p.xp)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="scene-fineprint">
            ROLL is a fictitious in-game currency with no real value. KAS and ZKAS are simulated resources. Prototype build: progress is saved in this browser only.
          </p>
        </div>
      </div>

      <footer className="scene-status" aria-label="Demo status">
        <span className="scene-status-badge">{LOGIN_STATUS.demoBadge}</span>
        <span>
          MINING HASH <strong className="accent">{LOGIN_STATUS.miningHash}</strong>
        </span>
        <span>
          BLOCKS FOUND <strong className="accent">{LOGIN_STATUS.blocksFound}</strong>
        </span>
        <span>
          NETWORK <strong className="accent">{LOGIN_STATUS.network}</strong>
        </span>
      </footer>
    </div>
  );
}
