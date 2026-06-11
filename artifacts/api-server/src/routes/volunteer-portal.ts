import { Router } from "express";
import { db } from "@workspace/db";
import {
  volUsersTable,
  volTrainingResourcesTable,
  volTrainingProgressTable,
  volWaiversTable,
  volWaiverSignaturesTable,
  volServiceHoursTable,
  volEventsTable,
  volEventRegistrationsTable,
  volMessagesTable,
} from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { verifyVolToken } from "./volunteer-auth";

const router = Router();

// Auth middleware
function requireVolAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const payload = verifyVolToken(token);
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }
  req.volUser = payload;
  next();
}

// ── Training ────────────────────────────────────────────────────────────────

router.get("/volunteers/training", requireVolAuth, async (req: any, res) => {
  const resources = await db.select().from(volTrainingResourcesTable).orderBy(volTrainingResourcesTable.sortOrder);

  const progress = await db.select().from(volTrainingProgressTable)
    .where(eq(volTrainingProgressTable.volunteerId, req.volUser.sub));

  const completedIds = new Set(progress.map(p => p.resourceId));

  res.json(resources.map(r => ({
    ...r,
    completed: completedIds.has(r.id),
    completedAt: progress.find(p => p.resourceId === r.id)?.completedAt?.toISOString() ?? null,
  })));
});

router.post("/volunteers/training/:id/complete", requireVolAuth, async (req: any, res) => {
  const resourceId = parseInt(req.params.id as string);
  const { score } = req.body;

  const existing = await db.select().from(volTrainingProgressTable)
    .where(and(eq(volTrainingProgressTable.volunteerId, req.volUser.sub), eq(volTrainingProgressTable.resourceId, resourceId)))
    .limit(1);

  if (existing.length > 0) {
    res.json({ already: true });
    return;
  }

  await db.insert(volTrainingProgressTable).values({
    volunteerId: req.volUser.sub,
    resourceId,
    score: score ?? null,
  });

  res.json({ ok: true });
});

// ── Waivers ──────────────────────────────────────────────────────────────────

router.get("/volunteers/waivers", requireVolAuth, async (req: any, res) => {
  const waivers = await db.select().from(volWaiversTable);
  const signatures = await db.select().from(volWaiverSignaturesTable)
    .where(eq(volWaiverSignaturesTable.volunteerId, req.volUser.sub));

  const signedIds = new Set(signatures.map(s => s.waiverId));

  res.json(waivers.map(w => ({
    ...w,
    signed: signedIds.has(w.id),
    signedAt: signatures.find(s => s.waiverId === w.id)?.signedAt?.toISOString() ?? null,
  })));
});

router.post("/volunteers/waivers/:id/sign", requireVolAuth, async (req: any, res) => {
  const waiverId = parseInt(req.params.id as string);
  const { signatureData } = req.body;

  const existing = await db.select().from(volWaiverSignaturesTable)
    .where(and(eq(volWaiverSignaturesTable.volunteerId, req.volUser.sub), eq(volWaiverSignaturesTable.waiverId, waiverId)))
    .limit(1);

  if (existing.length > 0) {
    res.json({ already: true });
    return;
  }

  await db.insert(volWaiverSignaturesTable).values({
    volunteerId: req.volUser.sub,
    waiverId,
    ipAddress: req.ip ?? null,
    signatureData: signatureData ?? null,
  });

  res.json({ ok: true });
});

// ── Service Hours ────────────────────────────────────────────────────────────

router.get("/volunteers/hours", requireVolAuth, async (req: any, res) => {
  const isCoordinator = req.volUser.role === "coordinator";
  const hours = await db.select().from(volServiceHoursTable)
    .where(isCoordinator ? undefined : eq(volServiceHoursTable.volunteerId, req.volUser.sub))
    .orderBy(desc(volServiceHoursTable.serviceDate));

  res.json(hours.map(h => ({
    ...h,
    serviceDate: h.serviceDate.toISOString(),
    createdAt: h.createdAt.toISOString(),
  })));
});

router.post("/volunteers/hours", requireVolAuth, async (req: any, res) => {
  const { description, hours, serviceDate, eventId } = req.body;
  if (!description || !hours || !serviceDate) {
    res.status(400).json({ error: "description, hours, and serviceDate required" });
    return;
  }

  const [entry] = await db.insert(volServiceHoursTable).values({
    volunteerId: req.volUser.sub,
    eventId: eventId ?? null,
    description,
    hours: parseFloat(hours),
    serviceDate: new Date(serviceDate),
    status: "pending",
  }).returning();

  res.status(201).json({ ...entry, serviceDate: entry.serviceDate.toISOString(), createdAt: entry.createdAt.toISOString() });
});

router.patch("/volunteers/hours/:id", requireVolAuth, async (req: any, res) => {
  if (req.volUser.role !== "coordinator") {
    res.status(403).json({ error: "Only coordinators can approve hours" });
    return;
  }
  const id = parseInt(req.params.id as string);
  const { status, reviewNotes } = req.body;

  const [updated] = await db.update(volServiceHoursTable)
    .set({ status, reviewNotes: reviewNotes ?? null, reviewedById: req.volUser.sub })
    .where(eq(volServiceHoursTable.id, id))
    .returning();

  res.json({ ...updated, serviceDate: updated.serviceDate.toISOString(), createdAt: updated.createdAt.toISOString() });
});

// ── Events ───────────────────────────────────────────────────────────────────

router.get("/volunteers/events", requireVolAuth, async (req: any, res) => {
  const events = await db.select().from(volEventsTable).orderBy(volEventsTable.startTime);

  const myRegs = await db.select().from(volEventRegistrationsTable)
    .where(eq(volEventRegistrationsTable.volunteerId, req.volUser.sub));

  const registeredIds = new Set(myRegs.filter(r => r.status !== "cancelled").map(r => r.eventId));

  const counts = await db
    .select({ eventId: volEventRegistrationsTable.eventId, count: sql<number>`COUNT(*)` })
    .from(volEventRegistrationsTable)
    .where(sql`${volEventRegistrationsTable.status} != 'cancelled'`)
    .groupBy(volEventRegistrationsTable.eventId);
  const countMap = new Map(counts.map(c => [c.eventId, Number(c.count)]));

  res.json(events.map(e => ({
    ...e,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    createdAt: e.createdAt.toISOString(),
    registered: registeredIds.has(e.id),
    registrationCount: countMap.get(e.id) ?? 0,
  })));
});

router.post("/volunteers/events", requireVolAuth, async (req: any, res) => {
  if (req.volUser.role !== "coordinator") {
    res.status(403).json({ error: "Only coordinators can create events" });
    return;
  }
  const { title, description, location, startTime, endTime, maxVolunteers, category } = req.body;
  if (!title || !startTime || !endTime) {
    res.status(400).json({ error: "title, startTime, endTime required" });
    return;
  }

  const [event] = await db.insert(volEventsTable).values({
    title, description: description ?? null, location: location ?? null,
    startTime: new Date(startTime), endTime: new Date(endTime),
    maxVolunteers: maxVolunteers ?? null, coordinatorId: req.volUser.sub,
    category: category ?? null,
  }).returning();

  res.status(201).json({ ...event, startTime: event.startTime.toISOString(), endTime: event.endTime.toISOString(), createdAt: event.createdAt.toISOString() });
});

router.patch("/volunteers/events/:id", requireVolAuth, async (req: any, res) => {
  if (req.volUser.role !== "coordinator") {
    res.status(403).json({ error: "Only coordinators can update events" });
    return;
  }
  const eventId = parseInt(req.params.id as string);
  const { title, description, location, startTime, endTime, maxVolunteers, category, status } = req.body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (location !== undefined) updates.location = location;
  if (startTime !== undefined) updates.startTime = new Date(startTime);
  if (endTime !== undefined) updates.endTime = new Date(endTime);
  if (maxVolunteers !== undefined) updates.maxVolunteers = maxVolunteers;
  if (category !== undefined) updates.category = category;
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [event] = await db.update(volEventsTable).set(updates)
    .where(eq(volEventsTable.id, eventId)).returning();

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json({ ...event, startTime: event.startTime.toISOString(), endTime: event.endTime.toISOString(), createdAt: event.createdAt.toISOString() });
});

router.delete("/volunteers/events/:id", requireVolAuth, async (req: any, res) => {
  if (req.volUser.role !== "coordinator") {
    res.status(403).json({ error: "Only coordinators can delete events" });
    return;
  }
  const eventId = parseInt(req.params.id as string);
  await db.delete(volEventsTable).where(eq(volEventsTable.id, eventId));
  res.json({ ok: true });
});

router.get("/volunteers/events/:id/registrations", requireVolAuth, async (req: any, res) => {
  if (req.volUser.role !== "coordinator") {
    res.status(403).json({ error: "Only coordinators can view registrations" });
    return;
  }
  const eventId = parseInt(req.params.id as string);
  const rows = await db
    .select({
      id: volEventRegistrationsTable.id,
      volunteerId: volEventRegistrationsTable.volunteerId,
      name: volUsersTable.name,
      email: volUsersTable.email,
      avatarInitials: volUsersTable.avatarInitials,
      status: volEventRegistrationsTable.status,
      registeredAt: volEventRegistrationsTable.registeredAt,
    })
    .from(volEventRegistrationsTable)
    .innerJoin(volUsersTable, eq(volEventRegistrationsTable.volunteerId, volUsersTable.id))
    .where(and(eq(volEventRegistrationsTable.eventId, eventId), sql`${volEventRegistrationsTable.status} != 'cancelled'`))
    .orderBy(volEventRegistrationsTable.registeredAt);

  res.json(rows.map(r => ({ ...r, registeredAt: r.registeredAt.toISOString() })));
});

router.post("/volunteers/events/:id/register", requireVolAuth, async (req: any, res) => {
  const eventId = parseInt(req.params.id as string);

  const [event] = await db.select().from(volEventsTable).where(eq(volEventsTable.id, eventId)).limit(1);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.status !== "upcoming" && event.status !== "active") {
    res.status(409).json({ error: "Registration is closed for this event" });
    return;
  }

  const existing = await db.select().from(volEventRegistrationsTable)
    .where(and(eq(volEventRegistrationsTable.volunteerId, req.volUser.sub), eq(volEventRegistrationsTable.eventId, eventId)))
    .limit(1);

  if (existing.length > 0 && existing[0].status !== "cancelled") {
    res.json({ already: true });
    return;
  }

  // Capacity check (excludes the current user's cancelled row, which we may revive)
  if (event.maxVolunteers != null) {
    const [{ count } = { count: 0 }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(volEventRegistrationsTable)
      .where(and(eq(volEventRegistrationsTable.eventId, eventId), sql`${volEventRegistrationsTable.status} != 'cancelled'`));
    if (Number(count) >= event.maxVolunteers) {
      res.status(409).json({ error: "This event is full" });
      return;
    }
  }

  if (existing.length > 0) {
    await db.update(volEventRegistrationsTable).set({ status: "registered" })
      .where(eq(volEventRegistrationsTable.id, existing[0].id));
    res.json({ ok: true });
    return;
  }

  await db.insert(volEventRegistrationsTable).values({ volunteerId: req.volUser.sub, eventId });
  res.json({ ok: true });
});

router.delete("/volunteers/events/:id/register", requireVolAuth, async (req: any, res) => {
  const eventId = parseInt(req.params.id as string);
  await db.update(volEventRegistrationsTable).set({ status: "cancelled" })
    .where(and(eq(volEventRegistrationsTable.volunteerId, req.volUser.sub), eq(volEventRegistrationsTable.eventId, eventId)));
  res.json({ ok: true });
});

// ── Messages ─────────────────────────────────────────────────────────────────

router.get("/volunteers/messages", requireVolAuth, async (req: any, res) => {
  const msgs = await db.select().from(volMessagesTable)
    .where(sql`${volMessagesTable.senderId} = ${req.volUser.sub} OR ${volMessagesTable.recipientId} = ${req.volUser.sub}`)
    .orderBy(volMessagesTable.createdAt);

  res.json(msgs.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.post("/volunteers/messages", requireVolAuth, async (req: any, res) => {
  const { recipientId, content } = req.body;
  if (!recipientId || !content) {
    res.status(400).json({ error: "recipientId and content required" });
    return;
  }

  const [msg] = await db.insert(volMessagesTable).values({
    senderId: req.volUser.sub,
    recipientId: parseInt(recipientId),
    content,
  }).returning();

  res.status(201).json({ ...msg, createdAt: msg.createdAt.toISOString() });
});

// ── Impact Metrics ────────────────────────────────────────────────────────────

router.get("/volunteers/impact", requireVolAuth, async (req: any, res) => {
  const isCoordinator = req.volUser.role === "coordinator";
  const userId = req.volUser.sub;

  const hoursQuery = isCoordinator
    ? db.select({ total: sql<number>`COALESCE(SUM(${volServiceHoursTable.hours}), 0)` }).from(volServiceHoursTable).where(eq(volServiceHoursTable.status, "approved"))
    : db.select({ total: sql<number>`COALESCE(SUM(${volServiceHoursTable.hours}), 0)` }).from(volServiceHoursTable).where(and(eq(volServiceHoursTable.volunteerId, userId), eq(volServiceHoursTable.status, "approved")));

  const eventsQuery = isCoordinator
    ? db.select({ count: sql<number>`COUNT(*)` }).from(volEventRegistrationsTable).where(eq(volEventRegistrationsTable.status, "attended"))
    : db.select({ count: sql<number>`COUNT(*)` }).from(volEventRegistrationsTable).where(and(eq(volEventRegistrationsTable.volunteerId, userId), eq(volEventRegistrationsTable.status, "attended")));

  const [hoursResult, eventsResult] = await Promise.all([hoursQuery, eventsQuery]);

  const activeVolunteers = isCoordinator
    ? await db.select({ count: sql<number>`COUNT(*)` }).from(volUsersTable).where(eq(volUsersTable.status, "active"))
    : null;

  res.json({
    approvedHours: Number(hoursResult[0]?.total ?? 0),
    eventsAttended: Number(eventsResult[0]?.count ?? 0),
    ...(activeVolunteers ? { activeVolunteers: Number(activeVolunteers[0]?.count ?? 0) } : {}),
  });
});

// ── Coordinators list (for messaging) ────────────────────────────────────────

router.get("/volunteers/coordinators", requireVolAuth, async (req: any, res) => {
  const coordinators = await db.select({
    id: volUsersTable.id, name: volUsersTable.name, email: volUsersTable.email,
    role: volUsersTable.role, avatarInitials: volUsersTable.avatarInitials,
  }).from(volUsersTable).where(eq(volUsersTable.role, "coordinator"));
  res.json(coordinators);
});

// ── Coordinator-only: List all volunteers ─────────────────────────────────────

router.get("/volunteers/coordinator/volunteers", requireVolAuth, async (req: any, res) => {
  if (req.volUser.role !== "coordinator") {
    res.status(403).json({ error: "Coordinator access required" });
    return;
  }

  const volunteers = await db.select({
    id: volUsersTable.id,
    name: volUsersTable.name,
    email: volUsersTable.email,
    role: volUsersTable.role,
    status: volUsersTable.status,
    phone: volUsersTable.phone,
    skills: volUsersTable.skills,
    availability: volUsersTable.availability,
    avatarInitials: volUsersTable.avatarInitials,
    createdAt: volUsersTable.createdAt,
  }).from(volUsersTable).orderBy(desc(volUsersTable.createdAt));

  // Attach approved hour totals per volunteer
  const hourTotals = await db
    .select({
      volunteerId: volServiceHoursTable.volunteerId,
      total: sql<number>`COALESCE(SUM(${volServiceHoursTable.hours}), 0)`,
    })
    .from(volServiceHoursTable)
    .where(eq(volServiceHoursTable.status, "approved"))
    .groupBy(volServiceHoursTable.volunteerId);

  const hoursMap = new Map(hourTotals.map(h => [h.volunteerId, Number(h.total)]));

  res.json(volunteers.map(v => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    approvedHours: hoursMap.get(v.id) ?? 0,
  })));
});

// ── Coordinator-only: Update volunteer status ─────────────────────────────────

router.patch("/volunteers/coordinator/volunteers/:id", requireVolAuth, async (req: any, res) => {
  if (req.volUser.role !== "coordinator") {
    res.status(403).json({ error: "Coordinator access required" });
    return;
  }

  const id = parseInt(req.params.id as string);
  const { status } = req.body;

  if (!["pending", "active", "inactive"].includes(status)) {
    res.status(400).json({ error: "status must be pending, active, or inactive" });
    return;
  }

  const [updated] = await db
    .update(volUsersTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(volUsersTable.id, id))
    .returning({
      id: volUsersTable.id,
      name: volUsersTable.name,
      email: volUsersTable.email,
      status: volUsersTable.status,
    });

  if (!updated) {
    res.status(404).json({ error: "Volunteer not found" });
    return;
  }

  res.json(updated);
});

// ── Coordinator-only: All hours (with volunteer name) ─────────────────────────

router.get("/volunteers/coordinator/hours", requireVolAuth, async (req: any, res) => {
  if (req.volUser.role !== "coordinator") {
    res.status(403).json({ error: "Coordinator access required" });
    return;
  }

  const hours = await db
    .select({
      id: volServiceHoursTable.id,
      volunteerId: volServiceHoursTable.volunteerId,
      volunteerName: volUsersTable.name,
      volunteerInitials: volUsersTable.avatarInitials,
      description: volServiceHoursTable.description,
      hours: volServiceHoursTable.hours,
      serviceDate: volServiceHoursTable.serviceDate,
      status: volServiceHoursTable.status,
      reviewNotes: volServiceHoursTable.reviewNotes,
      createdAt: volServiceHoursTable.createdAt,
    })
    .from(volServiceHoursTable)
    .leftJoin(volUsersTable, eq(volServiceHoursTable.volunteerId, volUsersTable.id))
    .orderBy(desc(volServiceHoursTable.createdAt));

  res.json(hours.map(h => ({
    ...h,
    serviceDate: h.serviceDate.toISOString(),
    createdAt: h.createdAt.toISOString(),
  })));
});

export default router;
