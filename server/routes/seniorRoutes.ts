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
  requireRole,
} from '../auth.js';
import { SPPU_SUBJECTS, SPPUSubject } from '../../src/types/index.js';

export const seniorRouter = Router();

// 1. Discover Seniors (Public with optional auth)
// IMPORTANT: ERP numbers and private details are NOT exposed!
seniorRouter.get('/discover', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { subject, department, search, sortBy } = req.query;
  const db = getDb();

  // Only approved seniors are discoverable for teaching/learning
  let seniors = db.users
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
        verificationStatus: u.verificationStatus,
        bio: profile.bio,
        skills: profile.skills,
        teachingSubjects: profile.teachingSubjects,
        studentsHelped: profile.studentsHelped,
        totalCreditsEarned: profile.totalCreditsEarned,
        popularityScore: profile.popularityScore,
        rating: profile.rating,
        ratingCount: profile.ratingCount,
      };
    });

  // Filter by SPPU Subject
  if (subject && typeof subject === 'string' && subject !== 'ALL') {
    seniors = seniors.filter((s) => s.teachingSubjects.includes(subject as SPPUSubject));
  }

  // Filter by Department
  if (department && typeof department === 'string' && department !== 'ALL') {
    seniors = seniors.filter((s) => s.department.toLowerCase().includes(department.toLowerCase()));
  }

  // Text search in name, skills, or bio
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    seniors = seniors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.skills.some((skill) => skill.toLowerCase().includes(q)) ||
        s.bio.toLowerCase().includes(q)
    );
  }

  // Sort
  if (sortBy === 'credits') {
    seniors.sort((a, b) => b.totalCreditsEarned - a.totalCreditsEarned);
  } else if (sortBy === 'rating') {
    seniors.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
  } else if (sortBy === 'helped') {
    seniors.sort((a, b) => b.studentsHelped - a.studentsHelped);
  } else {
    // Default: popularity score
    seniors.sort((a, b) => b.popularityScore - a.popularityScore);
  }

  res.json({
    total: seniors.length,
    seniors,
  });
});

// 2. Get Senior Detailed Profile
seniorRouter.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const user = findUserById(id);

  if (!user || user.role !== 'SENIOR') {
    res.status(404).json({ error: 'Senior mentor not found.' });
    return;
  }

  const profile = db.seniorProfiles[id] || {
    userId: id,
    bio: '',
    skills: [],
    teachingSubjects: [],
    certificateUrl: '',
    certificateFileName: '',
    certificateStatus: user.verificationStatus,
    studentsHelped: 0,
    totalCreditsEarned: 0,
    popularityScore: 50,
    rating: 5.0,
    ratingCount: 0,
  };

  // Scheduled Sessions
  const sessions = db.liveSessions
    .filter((s) => s.mentorId === id && s.status !== 'CANCELLED')
    .map((s) => ({
      id: s.id,
      title: s.title,
      subject: s.subject,
      description: s.description,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      maxParticipants: s.maxParticipants,
      registeredCount: s.registeredUserIds.length,
      status: s.status,
    }));

  // Feedback received
  const feedbacks = db.feedback
    .filter((f) => f.mentorId === id)
    .map((f) => ({
      id: f.id,
      studentName: f.studentName,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.createdAt,
    }));

  // Safe public object - ERP is strictly omitted
  const safeProfile = {
    id: user.id,
    name: user.name,
    department: user.department,
    year: user.year,
    section: user.section,
    avatarUrl: user.avatarUrl,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt,
    bio: profile.bio,
    skills: profile.skills,
    teachingSubjects: profile.teachingSubjects,
    studentsHelped: profile.studentsHelped,
    totalCreditsEarned: profile.totalCreditsEarned,
    popularityScore: profile.popularityScore,
    rating: profile.rating,
    ratingCount: profile.ratingCount,
    sessions,
    feedback: feedbacks,
  };

  res.json(safeProfile);
});

// 3. Senior Dashboard Stats & Overview (Authenticated as Senior)
seniorRouter.get('/dashboard/stats', authenticate, requireRole('SENIOR'), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const db = getDb();
  const user = req.user!;
  const profile = db.seniorProfiles[userId];

  if (!profile) {
    res.status(404).json({ error: 'Senior profile record missing.' });
    return;
  }

  // Calculate profile completion
  let completionPoints = 20; // base
  if (profile.bio && profile.bio.length > 20) completionPoints += 20;
  if (profile.skills && profile.skills.length >= 2) completionPoints += 20;
  if (profile.teachingSubjects && profile.teachingSubjects.length >= 1) completionPoints += 20;
  if (profile.certificateUrl) completionPoints += 20;

  const mySessions = db.liveSessions.filter((s) => s.mentorId === userId);
  const myNotes = db.notes.filter((n) => n.uploadedBy === userId);
  const myFeedback = db.feedback.filter((f) => f.mentorId === userId);
  const myEarnings = db.creditTransactions.filter((tx) => tx.toUserId === userId);

  res.json({
    verificationStatus: user.verificationStatus,
    rejectionReason: user.rejectionReason,
    profileCompletion: completionPoints,
    teachingSubjects: profile.teachingSubjects,
    skills: profile.skills,
    bio: profile.bio,
    studentsHelped: profile.studentsHelped,
    totalCreditsEarned: profile.totalCreditsEarned,
    popularityScore: profile.popularityScore,
    rating: profile.rating,
    ratingCount: profile.ratingCount,
    totalSessions: mySessions.length,
    upcomingSessions: mySessions.filter((s) => s.status === 'SCHEDULED'),
    totalNotesUploaded: myNotes.length,
    notes: myNotes,
    recentFeedback: myFeedback.slice(-5).reverse(),
    creditTransactions: myEarnings.slice(-10).reverse(),
  });
});

// 4. Update Teaching Profile (Authenticated Senior)
seniorRouter.put('/profile/update', authenticate, requireRole('SENIOR'), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { bio, skills, teachingSubjects, avatarUrl } = req.body;
  const db = getDb();

  const profile = db.seniorProfiles[userId];
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  // Validate teaching subjects: strictly from the 10 SPPU engineering subjects
  if (teachingSubjects) {
    if (!Array.isArray(teachingSubjects) || teachingSubjects.length === 0) {
      res.status(400).json({ error: 'Please select at least one teaching subject.' });
      return;
    }

    const invalid = teachingSubjects.filter(
      (s: string) => !SPPU_SUBJECTS.includes(s as SPPUSubject)
    );
    if (invalid.length > 0) {
      res.status(400).json({
        error: `Invalid subjects: ${invalid.join(', ')}. Subjects must strictly belong to the 10 SPPU FE engineering curriculum.`,
      });
      return;
    }
    profile.teachingSubjects = teachingSubjects as SPPUSubject[];
  }

  if (bio !== undefined) profile.bio = String(bio).trim();
  if (skills !== undefined) {
    profile.skills = Array.isArray(skills)
      ? skills
      : String(skills).split(',').map((s) => s.trim()).filter(Boolean);
  }

  if (avatarUrl) {
    const user = findUserById(userId);
    if (user) user.avatarUrl = avatarUrl;
  }

  persistDatabase();

  res.json({
    message: 'Profile updated successfully!',
    profile,
  });
});
