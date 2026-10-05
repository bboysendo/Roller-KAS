import { FarmGrid } from '../components/FarmGrid';
import { FarmSplit } from '../components/FarmSplit';
import { farmSplit } from '../game/economy';
import { dispatch, useGame } from '../services/gameStore';
import { miningService } from '../services';
import { formatHashrate } from '../utils/format';

export function Farm() {
  const state = useGame();
  if (!state) return null;
  const summary = miningService.summarize(state);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Your facility</p>
          <h1>Mining farm</h1>
          <p className="muted">
            {summary.minersPlaced} miners running · {formatHashrate(summary.totalHashrate)} · {summary.rollPerSecond.toFixed(2)} ROLL/s
          </p>
        </div>
      </header>

      <FarmSplit split={farmSplit(state.miners)} />

      <FarmGrid
        unlockedSlots={state.unlockedSlots}
        miners={state.miners}
        roll={state.roll}
        onPlace={(instanceId, slot) => dispatch({ type: 'place-miner', instanceId, slot })}
        onRemove={(instanceId) => dispatch({ type: 'remove-miner', instanceId })}
        onUpgrade={(instanceId) => dispatch({ type: 'upgrade-miner', instanceId })}
        onUnlockSlot={() => dispatch({ type: 'unlock-slot' })}
      />
    </div>
  );
}
