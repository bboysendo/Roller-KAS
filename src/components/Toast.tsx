import { useEffect } from 'react';
import { dismissNotice, useNotice } from '../services/gameStore';

const AUTO_HIDE_MS = 2600;

export function Toast() {
  const notice = useNotice();

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismissNotice, AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;
  return (
    <div key={notice.id} className={`toast ${notice.ok ? 'toast-ok' : 'toast-error'}`} role="status">
      {notice.text}
    </div>
  );
}
