'use client';

import { useEffect, useMemo, useState } from 'react';

export type BenefitChecklistItem = {
  id: string;
  title: string;
  description?: string;
  active: boolean;
  /** ISO string; si está, se muestra un countdown en vivo. */
  expiresAt?: string | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days}D ${pad2(hours)}:${pad2(minutes)},${pad2(seconds)}`;
}

export function BenefitsChecklist({
  items,
}: {
  items: BenefitChecklistItem[];
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    return items.map((it) => {
      const expiresAtMs =
        typeof it.expiresAt === 'string' ? Date.parse(it.expiresAt) : NaN;
      const showTimer = it.active && Number.isFinite(expiresAtMs);
      const remaining = showTimer ? formatRemaining(expiresAtMs - now) : null;
      return { ...it, remaining };
    });
  }, [items, now]);

  return (
    <div className="space-y-5">
      {rows.map((it) => (
        <div key={it.id} className="border-b border-border pb-5 last:border-b-0 last:pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-primary text-lg font-extrabold leading-tight">
                {it.title}
              </p>
              {it.description ? (
                <p className="mt-1 text-primary/80 text-sm leading-snug">
                  {it.description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-end gap-2">
              <p className="text-primary/80 text-xs font-semibold">
                {it.active ? 'Activo' : 'Inactivo'}
              </p>
              <div
                className="h-7 w-7 rounded-md border border-border bg-background/20 grid place-items-center"
                aria-hidden
              >
                {it.active ? (
                  <span className="text-primary text-lg leading-none">✓</span>
                ) : null}
              </div>
            </div>
          </div>

          {it.remaining ? (
            <div className="mt-3 flex items-center gap-2 text-primary/80">
              <span aria-hidden>🕒</span>
              <span className="text-sm font-semibold">{it.remaining}</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

