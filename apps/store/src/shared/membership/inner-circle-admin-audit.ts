import { INNER_CIRCLE_METADATA } from "./inner-circle";

const MAX_ENTRIES = 25;

export type InnerCircleAuditEntry = {
  at: string;
  actorId?: string;
  action: string;
  detail?: string;
};

function readAuditArray(meta: Record<string, unknown>): InnerCircleAuditEntry[] {
  const v = meta[INNER_CIRCLE_METADATA.adminAuditLog];
  if (Array.isArray(v)) {
    return v.filter(Boolean) as InnerCircleAuditEntry[];
  }
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      return Array.isArray(p) ? (p as InnerCircleAuditEntry[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function appendInnerCircleAdminAudit(
  meta: Record<string, unknown>,
  entry: InnerCircleAuditEntry,
): Record<string, unknown> {
  const prev = readAuditArray(meta);
  const next = [...prev, entry].slice(-MAX_ENTRIES);
  return {
    ...meta,
    [INNER_CIRCLE_METADATA.adminAuditLog]: JSON.stringify(next),
  };
}

export function parseInnerCircleAdminAudit(
  meta: Record<string, unknown> | null | undefined,
): InnerCircleAuditEntry[] {
  if (!meta) return [];
  return readAuditArray(meta);
}
