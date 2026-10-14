import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth";
import { isDbUnavailableError, listDemoAdminNotifications, listDemoNotifications, markDemoNotificationRead } from "../lib/demo";

const router: Router = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    targetType: n.targetType,
    targetId: n.targetId,
    isRead: n.isRead,
    scheduledAt: n.scheduledAt?.toISOString() ?? null,
    sentAt: n.sentAt?.toISOString() ?? null,
    createdBy: n.createdBy,
    createdAt: n.createdAt?.toISOString(),
  };
}

router.get("/v1/notifications", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const notifications = await db.select().from(notificationsTable);
    const sorted = notifications
      .filter(n => n.targetType === "ALL" || n.createdBy === current.id)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

    res.json(sorted.map(formatNotification));
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.json(listDemoNotifications(current));
  }
});

router.put("/v1/notifications/:notificationId/read", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.notificationId) ? req.params.notificationId[0] : req.params.notificationId);
  try {
    const [n] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id)).returning();
    if (!n) { res.status(404).json({ message: "Notification not found" }); return; }
    res.json(formatNotification(n));
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    const notification = markDemoNotificationRead(id);
    if (!notification) { res.status(404).json({ message: "Notification not found" }); return; }
    res.json(notification);
  }
});

router.delete("/v1/notifications/:notificationId", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.notificationId) ? req.params.notificationId[0] : req.params.notificationId);
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.sendStatus(204);
});

router.post("/v1/admin/notifications", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { title, message, targetType, targetId } = req.body;
  if (!title || !message || !targetType) {
    res.status(400).json({ message: "title, message, and targetType required" }); return;
  }

  const [n] = await db.insert(notificationsTable).values({
    title,
    message,
    targetType,
    targetId: targetId ?? null,
    isRead: false,
    sentAt: new Date(),
    createdBy: current.id,
  }).returning();

  res.status(201).json(formatNotification(n));
});

router.get("/v1/admin/notifications", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  try {
    const all = await db.select().from(notificationsTable);
    res.json(all.map(formatNotification));
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.json(listDemoAdminNotifications());
  }
});

export default router;
