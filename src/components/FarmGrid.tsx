import { ECONOMY } from '../data/economy';
import { getMinerDefinition } from '../data/miners';
import { slotUnlockCost } from '../game/economy';
import type { OwnedMiner } from '../game/types';
import { formatInt } from '../utils/format';
import { MinerCard } from './MinerCard';

interface Props {
  unlockedSlots: number;
  miners: OwnedMiner[];
  roll: number;
  onPlace: (instanceId: string, slot: number) => void;
  onRemove: (instanceId: string) => void;
  onUpgrade: (instanceId: string) => void;
  onUnlockSlot: () => void;
}

/** The farm: a grid of slots. Empty slots get a picker over the inventory miners. */
export function FarmGrid({ unlockedSlots, miners, roll, onPlace, onRemove, onUpgrade, onUnlockSlot }: Props) {
  const inventory = miners.filter((m) => m.slot === null);
  const unlockCost = slotUnlockCost(unlockedSlots);
  const slots = Array.from({ length: ECONOMY.farm.maxSlots }, (_, i) => i);

  return (
    <section className="farm">
      <div className="farm-grid">
        {slots.map((slot) => {
          if (slot >= unlockedSlots) {
            const isNext = slot === unlockedSlots;
            return (
              <div key={slot} className="slot slot-locked">
                <span className="slot-label">LOCKED</span>
                {isNext && unlockCost !== null && (
                  <button className="btn btn-small" disabled={roll < unlockCost} onClick={onUnlockSlot}>
                    Unlock · {formatInt(unlockCost)} ROLL
                  </button>
                )}
              </div>
            );
          }

          const miner = miners.find((m) => m.slot === slot);
          if (miner) {
            return (
              <div key={slot} className="slot slot-filled">
                <MinerCard miner={miner} roll={roll} onUpgrade={onUpgrade} onRemove={onRemove} />
              </div>
            );
          }

          return (
            <div key={slot} className="slot slot-empty">
              <span className="slot-label">EMPTY</span>
              {inventory.length > 0 ? (
                <select
                  className="input input-small"
                  aria-label={`Place a miner in slot ${slot + 1}`}
                  value=""
                  onChange={(e) => e.target.value && onPlace(e.target.value, slot)}
                >
                  <option value="">Place miner…</option>
                  {inventory.map((m) => (
                    <option key={m.instanceId} value={m.instanceId}>
                      {getMinerDefinition(m.defId)?.name ?? 'Miner'} (LV {m.level})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="slot-hint">Buy a miner</span>
              )}
            </div>
          );
        })}
      </div>

      {inventory.length > 0 && (
        <div className="inventory">
          <h3 className="section-title">Inventory</h3>
          <p className="muted">Miners in storage do not produce ROLL until placed in a slot.</p>
          <div className="inventory-grid">
            {inventory.map((m) => (
              <MinerCard key={m.instanceId} miner={m} roll={roll} onUpgrade={onUpgrade} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
