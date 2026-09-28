import { Router, Response } from 'express';
import { getDb, persistDatabase } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';

export const notificationRouter = Router();

// Get current user's notifications
notificationRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const db = getDb();
  const notifications = db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ notifications });
});

// Mark notification as read
notificationRouter.post('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const db = getDb();
  const notif = db.notifications.find((n) => n.id === id && n.userId === userId);

  if (notif) {
    notif.isRead = true;
    persistDatabase();
  }

  res.json({ success: true });
});

// Mark all as read
notificationRouter.post('/read-all', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const db = getDb();
  db.notifications.forEach((n) => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  persistDatabase();

  res.json({ success: true });
});
