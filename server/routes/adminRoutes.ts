import { Router, Response } from 'express';
import {
  calculatePopularityScore,
  findUserById,
  getDb,
  persistDatabase,
  sanitizeUser,
} from '../db.js';
import {
  authenticate,
  AuthenticatedRequest,
  requireAdmin,
} from '../auth.js';
import { AdminAuditLog, PlatformStats } from '../../src/types/index.js';

export const adminRouter = Router();

// Protect ALL admin routes with authenticate + requireAdmin
adminRouter.use(authenticate, requireAdmin);

// Helper to record audit log
function recordAuditLog(
  adminName: string,
  adminErp: string,
  action: string,
  target: string,
  details: string
) {
  const db = getDb();
  const log: AdminAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminName,
    adminErp,
    action,
    target,
    details,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  persistDatabase();
}

// 1. Admin Dashboard Statistics & Overview
adminRouter.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();

  const students = db.users.filter((u) => u.role === 'STUDENT');
  const seniors = db.users.filter((u) => u.role === 'SENIOR');
  const pendingApprovals = seniors.filter((s) => s.verificationStatus === 'PENDING').length;
  const pendingUploads = db.pyqPapers.filter((p) => p.status === 'PENDING_REVIEW').length;
  const activeUsers = db.users.filter((u) => !u.isSuspended).length;
  const suspendedUsers = db.users.filter((u) => u.isSuspended).length;

  const stats: PlatformStats = {
    totalStudents: students.length,
    totalSeniors: seniors.length,
    pendingApprovals,
    pendingUploads,
    activeUsers,
    suspendedUsers,
    totalNotes: db.notes.length,
    totalPYQs: db.pyqPapers.length,
    totalLiveSessions: db.liveSessions.length,
    totalCreditTransactions: db.creditTransactions.length,
    totalReports: db.reports.filter((r) => r.status === 'OPEN').length,
  };

  res.json({
    stats,
    currentAdmin: {
      name: req.user!.name,
      erp: req.user!.erp,
      mobileNumber: req.user!.mobileNumber,
    },
  });
});

// 2b. Pending Senior Uploads Moderation List
adminRouter.get('/uploads/pending', (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const pendingUploads = db.pyqPapers.filter((p) => p.status === 'PENDING_REVIEW');
  res.json({ pendingUploads });
});

// 2c. Approve Senior Upload
adminRouter.post('/uploads/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const paper = db.pyqPapers.find((p) => p.id === id);

  if (!paper) {
    res.status(404).json({ error: 'Academic upload not found.' });
    return;
  }

  paper.status = 'PUBLISHED';
  paper.moderationComment = undefined;

  // Reward Senior with 10 platform credits for high-quality verified content!
  if (paper.uploaderId) {
    const uploader = findUserById(paper.uploaderId);
    if (uploader) {
      uploader.creditBalance = (uploader.creditBalance || 0) + 10;
      db.notifications.push({
        id: `notif-${Date.now()}-upload-approved`,
        userId: paper.uploaderId,
        title: 'Academic Content Approved & Published! 📚',
        message: `Your upload "${paper.title}" for ${paper.subject} (${paper.pattern || '2025 Pattern'}) has been approved by Admin ${req.user!.name}. You earned 10 credits!`,
        type: 'SUCCESS',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'APPROVE_UPLOAD',
    `Paper: ${paper.title}`,
    `Approved and published to student repository for subject ${paper.subject}`
  );

  persistDatabase();

  res.json({
    message: 'Academic paper approved and published successfully!',
    paper,
  });
});

// 2d. Reject Senior Upload
adminRouter.post('/uploads/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = getDb();
  const paper = db.pyqPapers.find((p) => p.id === id);

  if (!paper) {
    res.status(404).json({ error: 'Academic upload not found.' });
    return;
  }

  const comment = reason?.trim() || 'Content does not meet the SPPU 2025 Pattern or syllabus standards.';
  paper.status = 'REJECTED';
  paper.moderationComment = comment;

  if (paper.uploaderId) {
    db.notifications.push({
      id: `notif-${Date.now()}-upload-rejected`,
      userId: paper.uploaderId,
      title: 'Academic Upload Needs Revision',
      message: `Your upload "${paper.title}" was not approved by administration. Reason: ${comment}`,
      type: 'WARNING',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'REJECT_UPLOAD',
    `Paper: ${paper.title}`,
    `Rejected upload. Reason: ${comment}`
  );

  persistDatabase();

  res.json({
    message: 'Upload rejected with moderation feedback.',
    paper,
  });
});

// 2. Pending Senior Verifications List
adminRouter.get('/seniors/pending', (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();

  const pending = db.users
    .filter((u) => u.role === 'SENIOR' && u.verificationStatus === 'PENDING')
    .map((u) => {
      const profile = db.seniorProfiles[u.id];
      return {
        id: u.id,
        erp: u.erp,
        name: u.name,
        email: u.email,
        department: u.department,
        year: u.year,
        section: u.section,
        createdAt: u.createdAt,
        verificationStatus: u.verificationStatus,
        teachingSubjects: profile?.teachingSubjects || [],
        skills: profile?.skills || [],
        bio: profile?.bio || '',
        certificateFileName: profile?.certificateFileName || 'Uploaded_Marksheet.pdf',
        certificateUrl: profile?.certificateUrl || '',
      };
    });

  res.json({ pending });
});

// 3. Senior Verification Actions: Approve, Reject, Request Re-upload, Suspend
adminRouter.post('/seniors/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const user = findUserById(id);

  if (!user || user.role !== 'SENIOR') {
    res.status(404).json({ error: 'Senior user not found.' });
    return;
  }

  user.verificationStatus = 'APPROVED';
  user.rejectionReason = undefined;

  const profile = db.seniorProfiles[id];
  if (profile) {
    profile.certificateStatus = 'APPROVED';
    profile.popularityScore = calculatePopularityScore(
      profile.totalCreditsEarned,
      profile.studentsHelped,
      profile.rating,
      profile.ratingCount
    );
  }

  // Add notification to Senior
  db.notifications.push({
    id: `notif-${Date.now()}-approved`,
    userId: user.id,
    title: 'Senior Verification Approved! 🎉',
    message: `Congratulations! Your 1st year marksheet and senior mentor application have been verified by Admin ${req.user!.name}. You can now schedule live sessions and upload notes.`,
    type: 'SUCCESS',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Audit Log
  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'APPROVE_SENIOR',
    `${user.name} (${user.erp})`,
    `Approved First-Year mark sheet and verified teaching eligibility for subjects: ${profile?.teachingSubjects.join(', ')}`
  );

  res.json({
    message: `Senior mentor ${user.name} approved successfully!`,
    user: sanitizeUser(user),
  });
});

adminRouter.post('/seniors/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = getDb();
  const user = findUserById(id);

  if (!user || user.role !== 'SENIOR') {
    res.status(404).json({ error: 'Senior user not found.' });
    return;
  }

  const rejectionReason = reason?.trim() || 'First-year pass clearance could not be verified from uploaded documents.';
  user.verificationStatus = 'REJECTED';
  user.rejectionReason = rejectionReason;

  const profile = db.seniorProfiles[id];
  if (profile) {
    profile.certificateStatus = 'REJECTED';
  }

  db.notifications.push({
    id: `notif-${Date.now()}-rejected`,
    userId: user.id,
    title: 'Senior Application Update',
    message: `Your Senior Mentor application was not approved. Reason: ${rejectionReason}`,
    type: 'WARNING',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'REJECT_SENIOR',
    `${user.name} (${user.erp})`,
    `Application rejected. Reason: ${rejectionReason}`
  );

  res.json({
    message: `Senior mentor application rejected.`,
    user: sanitizeUser(user),
  });
});

adminRouter.post('/seniors/:id/request-reupload', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = getDb();
  const user = findUserById(id);

  if (!user || user.role !== 'SENIOR') {
    res.status(404).json({ error: 'Senior user not found.' });
    return;
  }

  const msg = reason?.trim() || 'Uploaded certificate was blurry or incomplete. Please upload an official SPPU marksheet or gazette copy.';
  user.verificationStatus = 'REUPLOAD_REQUESTED';
  user.rejectionReason = msg;

  const profile = db.seniorProfiles[id];
  if (profile) profile.certificateStatus = 'REUPLOAD_REQUESTED';

  db.notifications.push({
    id: `notif-${Date.now()}-reupload`,
    userId: user.id,
    title: 'Certificate Re-upload Requested',
    message: `Admin ${req.user!.name} requested a re-upload of your FE clearance certificate: ${msg}`,
    type: 'WARNING',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'REQUEST_REUPLOAD',
    `${user.name} (${user.erp})`,
    `Requested re-upload: ${msg}`
  );

  res.json({
    message: 'Re-upload notification sent to senior mentor.',
    user: sanitizeUser(user),
  });
});

// 4. User Account Management (Suspend / Unsuspend)
adminRouter.get('/users', (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const users = db.users.map((u) => sanitizeUser(u));
  res.json({ users });
});

adminRouter.post('/users/:id/suspend', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = findUserById(id);

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  // Prevent suspending another admin
  if (user.role === 'ADMIN') {
    res.status(403).json({ error: 'Administrative accounts cannot be suspended directly.' });
    return;
  }

  user.isSuspended = true;

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'SUSPEND_USER',
    `${user.name} (${user.erp}, Role: ${user.role})`,
    `Reason: ${reason || 'Violation of college academic guidelines'}`
  );

  res.json({
    message: `Account for ${user.name} has been suspended.`,
    user: sanitizeUser(user),
  });
});

adminRouter.post('/users/:id/unsuspend', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = findUserById(id);

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  user.isSuspended = false;

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'UNSUSPEND_USER',
    `${user.name} (${user.erp})`,
    'Account unsuspended by administration review.'
  );

  res.json({
    message: `Account for ${user.name} has been restored to active status.`,
    user: sanitizeUser(user),
  });
});

// 5. Content Moderation: Delete Notes, Papers, Cancel Sessions
adminRouter.delete('/notes/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const index = db.notes.findIndex((n) => n.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Note not found.' });
    return;
  }

  const removed = db.notes.splice(index, 1)[0];

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'DELETE_NOTE',
    `Note: ${removed.title}`,
    `Subject: ${removed.subject}, Uploader: ${removed.uploaderName}`
  );

  res.json({ message: 'Note deleted by administrator.' });
});

adminRouter.delete('/pyqs/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const index = db.pyqPapers.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'PYQ paper not found.' });
    return;
  }

  const removed = db.pyqPapers.splice(index, 1)[0];

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'DELETE_PYQ',
    `PYQ: ${removed.subject} (${removed.academicYear} ${removed.examType})`,
    'Removed by administrator.'
  );

  res.json({ message: 'PYQ paper removed.' });
});

adminRouter.post('/sessions/:id/cancel', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = getDb();
  const session = db.liveSessions.find((s) => s.id === id);

  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }

  session.status = 'CANCELLED';

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'CANCEL_SESSION',
    `Session: ${session.title}`,
    `Reason: ${reason || 'Administrative cancellation'}`
  );

  res.json({ message: 'Live session cancelled by administrator.' });
});

// 6. Reports Management
adminRouter.get('/reports', (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  res.json({ reports: db.reports });
});

adminRouter.post('/reports/:id/resolve', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { resolutionNote, actionTaken } = req.body;
  const db = getDb();
  const report = db.reports.find((r) => r.id === id);

  if (!report) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  report.status = 'RESOLVED';
  report.resolvedBy = `${req.user!.name} (${req.user!.erp})`;
  report.resolutionNote = resolutionNote || 'Investigated and resolved by admin.';

  recordAuditLog(
    req.user!.name,
    req.user!.erp,
    'RESOLVE_REPORT',
    `Report ${report.id} on ${report.targetTitle}`,
    `Action: ${actionTaken || 'Resolved'}, Note: ${report.resolutionNote}`
  );

  res.json({ message: 'Report resolved successfully.', report });
});

// 7. Audit Logs View
adminRouter.get('/audit-logs', (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  res.json({ auditLogs: db.auditLogs });
});
