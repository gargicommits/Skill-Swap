import { Router, Response } from 'express';
import {
  calculatePopularityScore,
  findUserById,
  getDb,
  persistDatabase,
} from '../db.js';
import {
  authenticate,
  AuthenticatedRequest,
  optionalAuth,
  requireApprovedSenior,
} from '../auth.js';
import {
  AcademicNote,
  LiveSession,
  PYQPaper,
  ReportItem,
  SPPU_SUBJECTS,
  SPPUSubject,
} from '../../src/types/index.js';

export const learningRouter = Router();

// 1. Get the 10 SPPU First-Year Subjects with metadata & stats
learningRouter.get('/subjects', (_req, res: Response) => {
  const db = getDb();
  const subjectsData = SPPU_SUBJECTS.map((subject) => {
    const notesCount = db.notes.filter((n) => n.subject === subject).length;
    const pyqsCount = db.pyqPapers.filter((p) => p.subject === subject).length;
    const sessionsCount = db.liveSessions.filter(
      (s) => s.subject === subject && s.status !== 'CANCELLED'
    ).length;
    const mentorsCount = Object.values(db.seniorProfiles).filter((prof) => {
      const u = findUserById(prof.userId);
      return (
        u &&
        u.role === 'SENIOR' &&
        u.verificationStatus === 'APPROVED' &&
        !u.isSuspended &&
        prof.teachingSubjects.includes(subject)
      );
    }).length;

    return {
      name: subject,
      notesCount,
      pyqsCount,
      sessionsCount,
      mentorsCount,
    };
  });

  res.json({ subjects: subjectsData });
});

// 2. Notes Section
learningRouter.get('/notes', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { subject, unit, search, department } = req.query;
  const db = getDb();

  let notes = [...db.notes];

  if (subject && typeof subject === 'string' && subject !== 'ALL') {
    notes = notes.filter((n) => n.subject === subject);
  }

  if (unit && !isNaN(Number(unit))) {
    notes = notes.filter((n) => n.unit === Number(unit));
  }

  if (department && typeof department === 'string' && department !== 'ALL') {
    notes = notes.filter((n) => n.department.toLowerCase().includes(department.toLowerCase()));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.topic.toLowerCase().includes(q) ||
        n.uploaderName.toLowerCase().includes(q)
    );
  }

  // Sort by latest
  notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ notes });
});

learningRouter.post('/notes/:id/view', (req, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const note = db.notes.find((n) => n.id === id);
  if (note) {
    note.viewsCount = (note.viewsCount || 0) + 1;
    persistDatabase();
  }
  res.json({ success: true, viewsCount: note?.viewsCount });
});

learningRouter.post('/notes/:id/download', (req, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const note = db.notes.find((n) => n.id === id);
  if (note) {
    note.downloadsCount = (note.downloadsCount || 0) + 1;
    persistDatabase();
  }
  res.json({ success: true, downloadsCount: note?.downloadsCount });
});

// Upload Notes - ONLY Approved Seniors and Admins
learningRouter.post(
  '/notes/upload',
  authenticate,
  requireApprovedSenior,
  (req: AuthenticatedRequest, res: Response) => {
    const { title, subject, unit, topic, department, year, fileType, fileUrl, fileSize } = req.body;

    if (!title || !subject || !unit || !topic) {
      res.status(400).json({ error: 'Title, Subject, Unit, and Topic are required.' });
      return;
    }

    // Validate subject is strictly one of the 10 SPPU subjects
    if (!SPPU_SUBJECTS.includes(subject as SPPUSubject)) {
      res.status(400).json({
        error: `Subject must be one of the 10 SPPU First-Year subjects. Got "${subject}".`,
      });
      return;
    }

    const unitNum = Number(unit);
    if (isNaN(unitNum) || unitNum < 1 || unitNum > 6) {
      res.status(400).json({ error: 'Unit must be a number between 1 and 6.' });
      return;
    }

    // Security check: restrict dangerous file extensions
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.vbs', '.js', '.py', '.php'];
    if (fileUrl && dangerousExtensions.some((ext) => fileUrl.toLowerCase().endsWith(ext))) {
      res.status(400).json({ error: 'Executable scripts and binaries are strictly prohibited.' });
      return;
    }

    const db = getDb();
    const newNote: AcademicNote = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      subject: subject as SPPUSubject,
      unit: unitNum,
      topic: topic.trim(),
      department: department?.trim() || req.user!.department,
      year: year?.trim() || 'FE 2026',
      fileType: fileType || 'PDF',
      fileUrl: fileUrl || `/notes/mock_${subject.replace(/\s+/g, '_').toLowerCase()}.pdf`,
      fileSize: fileSize || '2.4 MB',
      uploadedBy: req.user!.id,
      uploaderName: req.user!.name,
      uploaderRole: req.user!.role,
      downloadsCount: 0,
      viewsCount: 1,
      createdAt: new Date().toISOString(),
    };

    db.notes.unshift(newNote);

    // Notify all students
    const students = db.users.filter((u) => u.role === 'STUDENT');
    for (const student of students.slice(0, 10)) {
      db.notifications.push({
        id: `notif-${Date.now()}-${student.id}`,
        userId: student.id,
        title: 'New Study Notes Added',
        message: `${newNote.uploaderName} uploaded "${newNote.title}" for ${newNote.subject}.`,
        type: 'INFO',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    persistDatabase();

    res.status(201).json({
      message: 'Notes uploaded successfully!',
      note: newNote,
    });
  }
);

// 3. Academic Question Papers & Question Banks (2025 Pattern & 60 Marks Support)
learningRouter.get('/pyqs', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { subject, academicYear, pattern, totalMarks, semester, examType, type, search } = req.query;
  const db = getDb();
  const currentUser = req.user;
  const isAdmin = currentUser?.role === 'ADMIN';

  let papers = [...db.pyqPapers];

  // Moderation filter:
  // Public/Students only see PUBLISHED papers.
  // Admins see all.
  // Seniors see PUBLISHED papers plus their own pending/rejected uploads.
  papers = papers.filter((p) => {
    if (isAdmin) return true;
    if (p.status === 'PUBLISHED' || !p.status) return true;
    if (currentUser && p.uploaderId === currentUser.id) return true;
    return false;
  });

  // Filter by Type (QUESTION_PAPER vs QUESTION_BANK)
  if (type && typeof type === 'string' && type !== 'ALL') {
    papers = papers.filter((p) => (p.type || 'QUESTION_PAPER') === type);
  }

  // Filter by SPPU Subject
  if (subject && typeof subject === 'string' && subject !== 'ALL') {
    papers = papers.filter((p) => p.subject === subject);
  }

  // Filter by Pattern (e.g., "2025 Pattern")
  if (pattern && typeof pattern === 'string' && pattern !== 'ALL') {
    papers = papers.filter((p) => p.pattern === pattern);
  }

  // Filter by Total Marks (e.g., 60)
  if (totalMarks && !isNaN(Number(totalMarks))) {
    papers = papers.filter((p) => Number(p.totalMarks) === Number(totalMarks));
  }

  // Filter by Academic Year
  if (academicYear && typeof academicYear === 'string' && academicYear !== 'ALL') {
    papers = papers.filter((p) => p.academicYear === academicYear);
  }

  // Filter by Semester
  if (semester && typeof semester === 'string' && semester !== 'ALL') {
    papers = papers.filter((p) => p.semester === semester);
  }

  // Filter by Exam Type
  if (examType && typeof examType === 'string' && examType !== 'ALL') {
    papers = papers.filter((p) => p.examType === examType);
  }

  // Search keyword in subject, title, fileName
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    papers = papers.filter(
      (p) =>
        p.subject.toLowerCase().includes(q) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.fileName && p.fileName.toLowerCase().includes(q))
    );
  }

  papers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ papers });
});

learningRouter.post('/pyqs/:id/download', (req, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const paper = db.pyqPapers.find((p) => p.id === id);
  if (paper) {
    paper.downloadsCount = (paper.downloadsCount || 0) + 1;
    persistDatabase();
  }
  res.json({ success: true, downloadsCount: paper?.downloadsCount });
});

// Upload Academic Paper / Question Bank (Senior Moderation Flow)
learningRouter.post(
  '/pyqs/upload',
  authenticate,
  requireApprovedSenior,
  (req: AuthenticatedRequest, res: Response) => {
    const {
      title,
      type,
      subject,
      academicYear,
      pattern,
      totalMarks,
      semester,
      examType,
      department,
      fileName,
      fileUrl,
      fileSize,
      hasSolutions,
    } = req.body;

    if (!subject || !academicYear || !semester || !examType) {
      res.status(400).json({ error: 'Subject, Academic Year, Semester, and Exam Type are required.' });
      return;
    }

    if (!SPPU_SUBJECTS.includes(subject as SPPUSubject)) {
      res.status(400).json({
        error: `Subject must be one of the 10 SPPU First-Year engineering subjects.`,
      });
      return;
    }

    const isAdmin = req.user!.role === 'ADMIN';
    // Admin uploads are immediately PUBLISHED; Senior uploads require Admin Review
    const initialStatus = isAdmin ? 'PUBLISHED' : 'PENDING_REVIEW';
    const moderationComment = isAdmin
      ? undefined
      : 'Submitted by Senior Mentor. Pending administrator quality & syllabus verification.';

    const db = getDb();
    const paperTitle =
      title ||
      `${subject} — ${pattern || '2025 Pattern'} ${totalMarks || 60} Marks ${examType}`;

    const newPYQ: PYQPaper = {
      id: `${type === 'QUESTION_BANK' ? 'qb' : 'qp'}-${Date.now()}`,
      type: type === 'QUESTION_BANK' ? 'QUESTION_BANK' : 'QUESTION_PAPER',
      title: paperTitle,
      subject: subject as SPPUSubject,
      academicYear: academicYear.trim(),
      pattern: pattern?.trim() || '2025 Pattern',
      totalMarks: Number(totalMarks) || 60,
      semester,
      examType,
      department: department?.trim() || 'FE All Branches',
      fileUrl: fileUrl || `/pyqs/${subject.replace(/\s+/g, '_').toLowerCase()}.pdf`,
      fileName: fileName || `${subject.replace(/\s+/g, '_')}_${pattern || '2025'}_60Marks.pdf`,
      fileSize: fileSize || '2.4 MB',
      uploadedBy: `${req.user!.name} (${isAdmin ? 'Admin' : 'Senior'})`,
      uploaderId: req.user!.id,
      uploaderRole: req.user!.role,
      status: initialStatus,
      moderationComment,
      hasSolutions: Boolean(hasSolutions),
      downloadsCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.pyqPapers.unshift(newPYQ);

    // Notify admins if uploaded by a Senior
    if (!isAdmin) {
      const admins = db.users.filter((u) => u.role === 'ADMIN');
      for (const admin of admins) {
        db.notifications.push({
          id: `notif-${Date.now()}-${admin.id}`,
          userId: admin.id,
          title: 'New Senior Content Moderation Request',
          message: `${req.user!.name} submitted a new ${newPYQ.type === 'QUESTION_BANK' ? 'Question Bank' : 'Question Paper'} for "${subject}" (${newPYQ.pattern} - ${newPYQ.totalMarks} Marks) awaiting your review.`,
          type: 'WARNING',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    persistDatabase();

    res.status(201).json({
      message: isAdmin
        ? 'Paper published directly to student repository!'
        : 'Paper submitted successfully! It will be visible to students once reviewed and approved by college administrators.',
      pyq: newPYQ,
    });
  }
);

// 4. Live Sessions System
learningRouter.get('/sessions', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { subject, status } = req.query;
  const db = getDb();
  const currentUserId = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  let sessions = [...db.liveSessions];

  if (subject && typeof subject === 'string' && subject !== 'ALL') {
    sessions = sessions.filter((s) => s.subject === subject);
  }

  if (status && typeof status === 'string' && status !== 'ALL') {
    sessions = sessions.filter((s) => s.status === status);
  }

  // Security Rule: Meeting links MUST NOT be publicly exposed before appropriate access conditions are met
  const safeSessions = sessions.map((s) => {
    const isRegistered = currentUserId && s.registeredUserIds.includes(currentUserId);
    const isMentor = currentUserId === s.mentorId;
    const canSeeMeetingLink = Boolean(isAdmin || isMentor || isRegistered);

    return {
      ...s,
      meetingLink: canSeeMeetingLink ? s.meetingLink : undefined,
      hasJoined: Boolean(isRegistered),
      hasAttended: Boolean(currentUserId && s.attendedUserIds.includes(currentUserId)),
    };
  });

  res.json({ sessions: safeSessions });
});

// Create Live Session - Approved Seniors Only
learningRouter.post(
  '/sessions/create',
  authenticate,
  requireApprovedSenior,
  (req: AuthenticatedRequest, res: Response) => {
    const { title, subject, description, scheduledAt, durationMinutes, meetingLink, maxParticipants } =
      req.body;

    if (!title || !subject || !scheduledAt || !meetingLink) {
      res.status(400).json({ error: 'Title, Subject, Date/Time, and Meeting Link are required.' });
      return;
    }

    if (!SPPU_SUBJECTS.includes(subject as SPPUSubject)) {
      res.status(400).json({
        error: `Subject must be one of the 10 SPPU First-Year engineering subjects.`,
      });
      return;
    }

    // Verify scheduledAt is valid date
    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Invalid scheduled date/time.' });
      return;
    }

    const db = getDb();
    const newSession: LiveSession = {
      id: `session-${Date.now()}`,
      mentorId: req.user!.id,
      mentorName: req.user!.name,
      mentorDepartment: req.user!.department,
      mentorYear: req.user!.year,
      title: title.trim(),
      subject: subject as SPPUSubject,
      description: description?.trim() || 'Peer learning workshop for SPPU first year engineers.',
      scheduledAt: parsedDate.toISOString(),
      durationMinutes: Number(durationMinutes) || 60,
      meetingLink: meetingLink.trim(),
      maxParticipants: Number(maxParticipants) || 30,
      registeredUserIds: [],
      attendedUserIds: [],
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };

    db.liveSessions.unshift(newSession);

    // Add notification for students
    const students = db.users.filter((u) => u.role === 'STUDENT');
    for (const student of students.slice(0, 15)) {
      db.notifications.push({
        id: `notif-${Date.now()}-${student.id}`,
        userId: student.id,
        title: 'New Live Session Scheduled',
        message: `${newSession.mentorName} scheduled a live session on ${newSession.subject}: "${newSession.title}".`,
        type: 'INFO',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    persistDatabase();

    res.status(201).json({
      message: 'Live session scheduled successfully!',
      session: newSession,
    });
  }
);

// Register / RSVP for Live Session
learningRouter.post('/sessions/:id/register', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const db = getDb();

  const session = db.liveSessions.find((s) => s.id === id);
  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }

  if (session.status === 'CANCELLED' || session.status === 'COMPLETED') {
    res.status(400).json({ error: `Cannot register for a ${session.status.toLowerCase()} session.` });
    return;
  }

  if (session.registeredUserIds.includes(userId)) {
    res.json({
      message: 'You are already registered for this session.',
      meetingLink: session.meetingLink,
      registered: true,
    });
    return;
  }

  if (session.registeredUserIds.length >= session.maxParticipants) {
    res.status(400).json({ error: 'This session has reached maximum capacity.' });
    return;
  }

  session.registeredUserIds.push(userId);

  // Notify Mentor
  db.notifications.push({
    id: `notif-${Date.now()}-reg`,
    userId: session.mentorId,
    title: 'New Student Registered',
    message: `${req.user!.name} registered for your session: "${session.title}".`,
    type: 'INFO',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  persistDatabase();

  res.json({
    message: 'Registered successfully! You can now access the live meeting link.',
    meetingLink: session.meetingLink,
    registered: true,
  });
});

// Mark Attendance
learningRouter.post('/sessions/:id/attend', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const db = getDb();

  const session = db.liveSessions.find((s) => s.id === id);
  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }

  if (!session.registeredUserIds.includes(userId)) {
    session.registeredUserIds.push(userId);
  }

  if (!session.attendedUserIds.includes(userId)) {
    session.attendedUserIds.push(userId);

    // Increment mentor's studentsHelped
    const mentorProfile = db.seniorProfiles[session.mentorId];
    if (mentorProfile) {
      mentorProfile.studentsHelped += 1;
      mentorProfile.popularityScore = calculatePopularityScore(
        mentorProfile.totalCreditsEarned,
        mentorProfile.studentsHelped,
        mentorProfile.rating,
        mentorProfile.ratingCount
      );
    }
  }

  persistDatabase();

  res.json({
    message: 'Attendance marked! You are now eligible to review the mentor and award credits.',
    attended: true,
  });
});

// Submit Feedback & Rating after session
learningRouter.post('/sessions/:id/feedback', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user!.id;
  const db = getDb();

  const session = db.liveSessions.find((s) => s.id === id);
  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    return;
  }

  // Prevent duplicate feedback for same student & session
  const existing = db.feedback.find((f) => f.sessionId === id && f.studentId === userId);
  if (existing) {
    existing.rating = numRating;
    existing.comment = comment?.trim() || existing.comment;
    persistDatabase();
    res.json({ message: 'Feedback updated successfully!' });
    return;
  }

  const newFeedback = {
    id: `fb-${Date.now()}`,
    sessionId: id,
    mentorId: session.mentorId,
    studentId: userId,
    studentName: req.user!.name,
    rating: numRating,
    comment: comment?.trim() || 'Great session! Very helpful.',
    createdAt: new Date().toISOString(),
  };

  db.feedback.push(newFeedback);

  // Update Senior Profile ratings and popularity
  const mentorProfile = db.seniorProfiles[session.mentorId];
  if (mentorProfile) {
    const mentorFeedbacks = db.feedback.filter((f) => f.mentorId === session.mentorId);
    const avg = mentorFeedbacks.reduce((acc, curr) => acc + curr.rating, 0) / mentorFeedbacks.length;
    mentorProfile.rating = Math.round(avg * 10) / 10;
    mentorProfile.ratingCount = mentorFeedbacks.length;
    mentorProfile.popularityScore = calculatePopularityScore(
      mentorProfile.totalCreditsEarned,
      mentorProfile.studentsHelped,
      mentorProfile.rating,
      mentorProfile.ratingCount
    );
  }

  // Notify mentor
  db.notifications.push({
    id: `notif-${Date.now()}-fb`,
    userId: session.mentorId,
    title: 'New Student Review Received',
    message: `${req.user!.name} rated your session ${numRating} stars: "${newFeedback.comment}"`,
    type: 'SUCCESS',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  persistDatabase();

  res.status(201).json({
    message: 'Thank you! Your feedback has been recorded.',
    feedback: newFeedback,
  });
});

// 5. Submit Report
learningRouter.post('/reports', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { targetType, targetId, targetTitle, category, description } = req.body;

  if (!targetType || !targetId || !category || !description) {
    res.status(400).json({ error: 'Target, Category, and Description are required.' });
    return;
  }

  const db = getDb();
  const newReport: ReportItem = {
    id: `rep-${Date.now()}`,
    reporterId: req.user!.id,
    reporterName: req.user!.name,
    targetType,
    targetId,
    targetTitle: targetTitle || 'Target item',
    category,
    description: description.trim(),
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  db.reports.unshift(newReport);

  // Notify admins
  const admins = db.users.filter((u) => u.role === 'ADMIN');
  for (const admin of admins) {
    db.notifications.push({
      id: `notif-${Date.now()}-${admin.id}`,
      userId: admin.id,
      title: 'New Disciplinary Report',
      message: `${newReport.reporterName} reported "${newReport.targetTitle}" for ${newReport.category}.`,
      type: 'WARNING',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  persistDatabase();

  res.status(201).json({
    message: 'Report submitted. Platform administrators will review and take appropriate action.',
    reportId: newReport.id,
  });
});
