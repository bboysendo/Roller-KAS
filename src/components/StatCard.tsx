import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  icon?: string;
  hint?: string;
  accent?: 'green' | 'cyan' | 'amber' | 'purple';
}

export function StatCard({ label, value, icon, hint, accent = 'green' }: Props) {
  return (
    <div className={`card stat-card accent-${accent}`}>
      <div className="stat-label">
        {icon && <span aria-hidden="true">{icon} </span>}
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
