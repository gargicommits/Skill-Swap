import { Router, Response } from 'express';
import {
  calculatePopularityScore,
  findUserById,
  getDb,
  persistDatabase,
} from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { CreditTransaction } from '../../src/types/index.js';

export const creditRouter = Router();

// 1. Give Credit - Strictly Validated Server-Side
creditRouter.post('/give', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { toUserId, amount, sessionId, reason } = req.body;
  const fromUser = req.user!;
  const fromUserId = fromUser.id;

  // 1. Self-credit prevention
  if (fromUserId === toUserId) {
    res.status(400).json({ error: 'Security violation: You cannot give credits to yourself.' });
    return;
  }

  // 2. Validate amount
  const creditAmount = Number(amount);
  if (isNaN(creditAmount) || creditAmount <= 0 || !Number.isInteger(creditAmount)) {
    res.status(400).json({ error: 'Credit amount must be a positive whole number.' });
    return;
  }

  if (creditAmount > 50) {
    res.status(400).json({ error: 'Maximum credit transfer allowed per transaction is 50.' });
    return;
  }

  // 3. Balance verification
  if (fromUser.creditBalance < creditAmount) {
    res.status(400).json({
      error: `Insufficient credit balance. You have ${fromUser.creditBalance} credits available.`,
    });
    return;
  }

  const db = getDb();
  // 4. Verify recipient exists and is eligible
  const targetUser = findUserById(toUserId);
  if (!targetUser) {
    res.status(404).json({ error: 'Senior recipient account not found.' });
    return;
  }

  if (targetUser.role !== 'SENIOR' && targetUser.role !== 'ADMIN') {
    res.status(400).json({ error: 'Credits can only be awarded to Senior mentors or instructors.' });
    return;
  }

  if (targetUser.role === 'SENIOR' && targetUser.verificationStatus !== 'APPROVED') {
    res.status(400).json({ error: 'Senior account is not verified. Cannot award credits.' });
    return;
  }

  // 5. Prevent duplicate credits for the same session
  if (sessionId) {
    const existingTx = db.creditTransactions.find(
      (tx) => tx.fromUserId === fromUserId && tx.toUserId === toUserId && tx.sessionId === sessionId
    );
    if (existingTx) {
      res.status(400).json({
        error: 'You have already awarded credits for this live session.',
      });
      return;
    }
  }

  // 6. Execute atomic balance transfer & immutable ledger recording
  fromUser.creditBalance -= creditAmount;
  targetUser.creditBalance += creditAmount;

  const targetProfile = db.seniorProfiles[toUserId];
  if (targetProfile) {
    targetProfile.totalCreditsEarned += creditAmount;
    targetProfile.popularityScore = calculatePopularityScore(
      targetProfile.totalCreditsEarned,
      targetProfile.studentsHelped,
      targetProfile.rating,
      targetProfile.ratingCount
    );
  }

  const transaction: CreditTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fromUserId,
    fromUserName: fromUser.name,
    toUserId,
    toUserName: targetUser.name,
    amount: creditAmount,
    sessionId: sessionId || undefined,
    reason: reason?.trim() || 'Appreciation for peer-learning and mentorship',
    createdAt: new Date().toISOString(),
  };

  db.creditTransactions.unshift(transaction);

  // Notify recipient
  db.notifications.push({
    id: `notif-${Date.now()}-credit`,
    userId: toUserId,
    title: 'Credits Received!',
    message: `${fromUser.name} awarded you ${creditAmount} credits for your mentorship: "${transaction.reason}".`,
    type: 'CREDIT',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  persistDatabase();

  res.json({
    message: `Successfully transferred ${creditAmount} credits to ${targetUser.name}!`,
    newBalance: fromUser.creditBalance,
    transaction,
  });
});

// 2. User Credit Transaction History
creditRouter.get('/history', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const db = getDb();

  const transactions = db.creditTransactions.filter(
    (tx) => tx.fromUserId === userId || tx.toUserId === userId
  );

  res.json({
    currentBalance: req.user!.creditBalance,
    totalTransactions: transactions.length,
    transactions,
  });
});

// 3. Credit & Mentorship Leaderboard
creditRouter.get('/leaderboard', (_req, res: Response) => {
  const db = getDb();

  const leaderboard = db.users
    .filter((u) => u.role === 'SENIOR' && u.verificationStatus === 'APPROVED' && !u.isSuspended)
    .map((u) => {
      const profile = db.seniorProfiles[u.id] || {
        userId: u.id,
        bio: '',
        skills: [],
        teachingSubjects: [],
        certificateUrl: '',
        certificateFileName: '',
        certificateStatus: 'APPROVED',
        studentsHelped: 0,
        totalCreditsEarned: 0,
        popularityScore: 50,
        rating: 5.0,
        ratingCount: 0,
      };

      return {
        id: u.id,
        name: u.name,
        department: u.department,
        year: u.year,
        avatarUrl: u.avatarUrl,
        teachingSubjects: profile.teachingSubjects,
        totalCredits: profile.totalCreditsEarned,
        studentsHelped: profile.studentsHelped,
        popularityScore: profile.popularityScore,
        rating: profile.rating,
        ratingCount: profile.ratingCount,
      };
    })
    .sort((a, b) => b.totalCredits - a.totalCredits || b.popularityScore - a.popularityScore);

  res.json({ leaderboard });
});
