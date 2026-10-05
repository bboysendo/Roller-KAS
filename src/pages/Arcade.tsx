import { BlockCatchGame } from '../components/BlockCatchGame';

/** Arcade hub. Add new minigames as components here and register them in data/minigame.ts. */
export function Arcade() {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Earn ROLL</p>
          <h1>Arcade</h1>
        </div>
      </header>
      <BlockCatchGame />
    </div>
  );
}
