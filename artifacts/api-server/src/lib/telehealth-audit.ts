import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import type { Request } from "express";

export async function logAudit(
  action: string,
  options: {
    userId?: number | null;
    resourceType?: string;
    resourceId?: string | number;
    details?: string;
    req?: Request;
  } = {}
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      userId: options.userId ?? null,
      action,
      resourceType: options.resourceType ?? null,
      resourceId: options.resourceId != null ? String(options.resourceId) : null,
      ipAddress: options.req
        ? (options.req.headers["x-forwarded-for"] as string)?.split(",")[0] ??
          options.req.socket.remoteAddress ??
          null
        : null,
      userAgent: options.req ? (options.req.headers["user-agent"] ?? null) : null,
      details: options.details ?? null,
    });
  } catch {
    // Audit log failures must never crash the main request
  }
}
