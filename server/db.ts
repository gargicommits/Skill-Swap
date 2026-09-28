import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  UserRole,
  VerificationStatus,
  SPPU_SUBJECTS,
  SPPUSubject,
  SafeUser,
  SeniorProfile,
  StudentProfile,
  LiveSession,
  AcademicNote,
  PYQPaper,
  CreditTransaction,
  FeedbackRecord,
  ReportItem,
  NotificationItem,
  AdminAuditLog,
} from '../src/types/index';

export interface UserRecord extends SafeUser {
  passwordHash: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  seniorProfiles: Record<string, SeniorProfile>;
  studentProfiles: Record<string, StudentProfile>;
  liveSessions: LiveSession[];
  notes: AcademicNote[];
  pyqPapers: PYQPaper[];
  creditTransactions: CreditTransaction[];
  feedback: FeedbackRecord[];
  reports: ReportItem[];
  notifications: NotificationItem[];
  auditLogs: AdminAuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory active database copy backed by file persistence
let db: DatabaseSchema;

/**
 * Sanitize user object.
 * When isSelfOrAdmin is FALSE (e.g. for peer profiles, search, leaderboards),
 * highly private ERP numbers and mobile numbers are completely stripped.
 */
export function sanitizeUser(user: UserRecord, isSelfOrAdmin = false): SafeUser {
  const { passwordHash, ...safe } = user;
  if (!isSelfOrAdmin) {
    delete safe.erp;
    delete safe.mobileNumber;
    delete safe.email;
  }
  return {
    ...safe,
    seniorProfile: db?.seniorProfiles?.[user.id]
      ? {
          ...db.seniorProfiles[user.id],
          certificateUrl: isSelfOrAdmin ? db.seniorProfiles[user.id].certificateUrl : '',
        }
      : undefined,
    studentProfile: db?.studentProfiles?.[user.id],
  };
}

export function sanitizePublicUser(user: UserRecord): SafeUser {
  return sanitizeUser(user, false);
}

export function sanitizeSelfUser(user: UserRecord): SafeUser {
  return sanitizeUser(user, true);
}

// Helper to save database to disk
export function persistDatabase(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database to file:', err);
  }
}

// Authorized College ERP Registry
// College has not provided official college emails; ERP is the sole verified institutional ID.
export const COLLEGE_AUTHORIZED_ERPS = new Set<string>([
  '25511566', // Explicit test ERP from college specification
  '25511501',
  '25511502',
  '25511510',
  '25511520',
  '25511530',
  '25511540',
  '25511550',
  '25511560',
  '25511570',
  '25511580',
  '25511590',
  'SCOA09',
  'SCOA11',
  'SCOA20',
  'SCOA21',
  'SCOE2101',
  'SCOE2105',
  'SCOE2112',
  'SCOE2240',
  'SCOE2241',
  'SCOE2242',
  'SCOE2250',
  'SCOE2401',
  'SCOE2415',
  'SCOE2420',
  'SCOE2425',
  'SCOE2430',
  'SCOE2435',
  'SCOE2440',
  'SCOE2450',
  'SCOE2499',
]);

/**
 * Validates whether an ERP number belongs to an enrolled student of our college.
 * Prevents public unverified access.
 */
export function isAuthorizedCollegeStudent(erp: string): boolean {
  if (!erp || typeof erp !== 'string') return false;
  const upper = erp.trim().toUpperCase();

  // 1. Direct match with registered college ERP roster
  if (COLLEGE_AUTHORIZED_ERPS.has(upper)) return true;

  // 2. 8-digit numeric college ERP pattern (2024-2026 batches e.g. 25511000 - 25599999)
  if (/^2[3-6]\d{6}$/.test(upper)) return true;

  // 3. College department roll format: SCOE/SCOA prefix followed by batch digits
  if (/^SCO[EA]\d{2,6}$/i.test(upper)) return true;

  return false;
}

export function validateMobileNumber(mobile: string): boolean {
  if (!mobile || typeof mobile !== 'string') return false;
  const clean = mobile.replace(/[\s\-\+]/g, '');
  // Standard 10-digit Indian mobile number
  return /^[6-9]\d{9}$/.test(clean);
}

// Initial seed data builder
function createSeedData(): DatabaseSchema {
  const defaultSalt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('Admin@SCOA2026', defaultSalt);
  const userPasswordHash = bcrypt.hashSync('Student@123', defaultSalt);
  const seniorPasswordHash = bcrypt.hashSync('Senior@123', defaultSalt);

  // 4 Authorized college administrators
  const adminUsers: UserRecord[] = [
    {
      id: 'admin-1',
      erp: 'SCOA09',
      mobileNumber: '9822010001',
      name: 'Anchal Singh',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      department: 'Computer Engineering',
      year: 'Final Year (BE)',
      section: 'A',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 1000,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'admin-2',
      erp: 'SCOA11',
      mobileNumber: '9822010002',
      name: 'Gargi Bhothre',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      department: 'Computer Engineering',
      year: 'Final Year (BE)',
      section: 'A',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 1000,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'admin-3',
      erp: 'SCOA20',
      mobileNumber: '9822010003',
      name: 'Shreya Ashtaker',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      department: 'Computer Engineering',
      year: 'Final Year (BE)',
      section: 'B',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 1000,
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'admin-4',
      erp: 'SCOA21',
      mobileNumber: '9822010004',
      name: 'Shravani Deshmukh',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      department: 'Computer Engineering',
      year: 'Final Year (BE)',
      section: 'B',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 1000,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
  ];

  // Senior Mentors
  const seniorUsers: UserRecord[] = [
    {
      id: 'senior-1',
      erp: 'SCOE2101',
      mobileNumber: '9822020001',
      name: 'Rohan Sharma',
      passwordHash: seniorPasswordHash,
      role: 'SENIOR',
      department: 'Computer Engineering',
      year: 'Third Year (TE)',
      section: 'A',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 65,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-01T08:30:00.000Z',
    },
    {
      id: 'senior-2',
      erp: 'SCOE2105',
      mobileNumber: '9822020002',
      name: 'Priya Patil',
      passwordHash: seniorPasswordHash,
      role: 'SENIOR',
      department: 'Information Technology',
      year: 'Final Year (BE)',
      section: 'B',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 90,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-02T11:20:00.000Z',
    },
    {
      id: 'senior-3',
      erp: 'SCOE2112',
      mobileNumber: '9822020003',
      name: 'Aditya Kulkarni',
      passwordHash: seniorPasswordHash,
      role: 'SENIOR',
      department: 'Mechanical Engineering',
      year: 'Third Year (TE)',
      section: 'A',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 40,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-03T09:15:00.000Z',
    },
    {
      id: 'senior-4',
      erp: 'SCOE2240',
      mobileNumber: '9822020004',
      name: 'Tanmay Joshi',
      passwordHash: seniorPasswordHash,
      role: 'SENIOR',
      department: 'AI & Data Science',
      year: 'Second Year (SE)',
      section: 'C',
      verificationStatus: 'PENDING',
      isSuspended: false,
      creditBalance: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-03-01T14:10:00.000Z',
    },
  ];

  // Junior Students
  const studentUsers: UserRecord[] = [
    {
      id: 'student-1',
      erp: 'SCOE2401',
      mobileNumber: '9822030001',
      name: 'Aryan Mehta',
      passwordHash: userPasswordHash,
      role: 'STUDENT',
      department: 'Computer Engineering',
      year: 'First Year (FE)',
      section: 'A',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 50,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-15T12:00:00.000Z',
    },
    {
      id: 'student-2',
      erp: 'SCOE2415',
      mobileNumber: '9822030002',
      name: 'Sneha Shinde',
      passwordHash: userPasswordHash,
      role: 'STUDENT',
      department: 'Information Technology',
      year: 'First Year (FE)',
      section: 'B',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 40,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-18T10:15:00.000Z',
    },
    {
      id: 'student-3',
      erp: '25511566',
      mobileNumber: '9822030003',
      name: 'Kavya Verma',
      passwordHash: userPasswordHash,
      role: 'STUDENT',
      department: 'Computer Engineering',
      year: 'First Year (FE)',
      section: 'C',
      verificationStatus: 'APPROVED',
      isSuspended: false,
      creditBalance: 50,
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-20T10:00:00.000Z',
    },
  ];

  const seniorProfiles: Record<string, SeniorProfile> = {
    'senior-1': {
      userId: 'senior-1',
      bio: 'TE Computer Engg student, SGPA 9.6. Passionate about helping juniors crack SPPU FE Maths 1 and C/PPS fundamentals with solved PYQ tricks.',
      skills: ['C Programming', 'Linear Algebra', 'Algorithms', 'Debugging'],
      teachingSubjects: [
        'Mathematics 1',
        'Fundamentals of Programming Languages (FPL)',
        'Programming for Problem Solving (PPS)',
      ],
      certificateUrl: '/mock_certificates/rohan_fe_clearance.pdf',
      certificateFileName: 'Rohan_SPPU_FE_Marksheet_9.6_SGPA.pdf',
      certificateStatus: 'APPROVED',
      studentsHelped: 18,
      totalCreditsEarned: 65,
      popularityScore: 88,
      rating: 4.9,
      ratingCount: 14,
    },
    'senior-2': {
      userId: 'senior-2',
      bio: 'Final Year IT. Topper in Basic Electrical Engineering (BEE) and Basic Electronics (BXE). Step-by-step circuit solver and unit crash courses.',
      skills: ['Circuit Analysis', 'AC/DC Machines', 'Electronics', 'Formula Sheets'],
      teachingSubjects: [
        'Basic Electrical Engineering (BEE)',
        'Basic Electronics Engineering (BXE)',
        'Mathematics 2',
      ],
      certificateUrl: '/mock_certificates/priya_fe_clearance.pdf',
      certificateFileName: 'Priya_Patil_SPPU_FE_Marksheet.pdf',
      certificateStatus: 'APPROVED',
      studentsHelped: 24,
      totalCreditsEarned: 90,
      popularityScore: 94,
      rating: 5.0,
      ratingCount: 19,
    },
    'senior-3': {
      userId: 'senior-3',
      bio: 'TE Mechanical student. Scored 48/50 in Engineering Graphics and Mechanics In-Sem. Master 3D isometric & orthographic drawing step by step.',
      skills: ['AutoCAD', 'Isometric Projection', 'Force Systems', 'Centroids'],
      teachingSubjects: [
        'Engineering Graphics',
        'Engineering Mechanics',
        'Physics',
      ],
      certificateUrl: '/mock_certificates/aditya_fe_clearance.pdf',
      certificateFileName: 'Aditya_Kulkarni_FE_GradeCard.pdf',
      certificateStatus: 'APPROVED',
      studentsHelped: 11,
      totalCreditsEarned: 40,
      popularityScore: 75,
      rating: 4.7,
      ratingCount: 9,
    },
    'senior-4': {
      userId: 'senior-4',
      bio: 'SE AI&DS student. Cleared FE with First Class Distinction. Eager to conduct doubt sessions on Chemistry and FPL Python.',
      skills: ['Python', 'Engineering Chemistry', 'Data Structures'],
      teachingSubjects: [
        'Chemistry',
        'Fundamentals of Programming Languages (FPL)',
      ],
      certificateUrl: '/mock_certificates/tanmay_fe_proof.pdf',
      certificateFileName: 'Tanmay_FE_Result_SPPU_2025.pdf',
      certificateStatus: 'PENDING',
      studentsHelped: 0,
      totalCreditsEarned: 0,
      popularityScore: 30,
      rating: 5.0,
      ratingCount: 0,
    },
  };

  const studentProfiles: Record<string, StudentProfile> = {
    'student-1': {
      userId: 'student-1',
      savedNotes: ['note-1', 'note-2'],
      registeredSessions: ['session-1'],
      learningGoals: ['Clear Maths 1 In-Sem with >25 marks', 'Master C pointers'],
    },
    'student-2': {
      userId: 'student-2',
      savedNotes: ['note-3'],
      registeredSessions: ['session-1'],
      learningGoals: ['Understand BEE Superposition Theorem', 'Prepare for SPPU 2025 Pattern 60 Marks End-Sem'],
    },
    'student-3': {
      userId: 'student-3',
      savedNotes: ['note-1'],
      registeredSessions: [],
      learningGoals: ['Score 55+ in 60-marks SPPU End-Sem', 'Solve PPS past papers'],
    },
  };

  // Fixed 10 SPPU Subjects Academic Notes
  const notes: AcademicNote[] = [
    {
      id: 'note-1',
      title: 'Matrices & Linear Differential Equations Hand-Crafted Formula Guide',
      subject: 'Mathematics 1',
      unit: 1,
      topic: 'Rank of Matrix, Linear Equations & Eigen Values',
      department: 'First Year Engineering',
      year: 'FE 2026',
      fileType: 'PDF',
      fileUrl: '/notes/maths1_matrices_eigen.pdf',
      fileSize: '3.4 MB',
      uploadedBy: 'senior-1',
      uploaderName: 'Rohan Sharma',
      uploaderRole: 'SENIOR',
      downloadsCount: 142,
      viewsCount: 420,
      createdAt: '2026-02-10T14:00:00.000Z',
    },
    {
      id: 'note-2',
      title: 'DC Circuits: Kirchhoff Laws, Mesh & Nodal Solved PYQs',
      subject: 'Basic Electrical Engineering (BEE)',
      unit: 2,
      topic: 'DC Network Theorems & Superposition',
      department: 'First Year Engineering',
      year: 'FE 2026',
      fileType: 'PDF',
      fileUrl: '/notes/bee_dc_circuits_theorems.pdf',
      fileSize: '4.8 MB',
      uploadedBy: 'senior-2',
      uploaderName: 'Priya Patil',
      uploaderRole: 'SENIOR',
      downloadsCount: 188,
      viewsCount: 512,
      createdAt: '2026-02-14T09:30:00.000Z',
    },
    {
      id: 'note-3',
      title: 'Orthographic Projections & First Angle Method Guide',
      subject: 'Engineering Graphics',
      unit: 3,
      topic: 'Lines, Planes and 3D Solids Projections',
      department: 'First Year Engineering',
      year: 'FE 2026',
      fileType: 'PDF',
      fileUrl: '/notes/eg_orthographic_handwritten.pdf',
      fileSize: '6.1 MB',
      uploadedBy: 'senior-3',
      uploaderName: 'Aditya Kulkarni',
      uploaderRole: 'SENIOR',
      downloadsCount: 95,
      viewsCount: 310,
      createdAt: '2026-02-20T16:45:00.000Z',
    },
    {
      id: 'note-4',
      title: 'Pointers, Dynamic Memory & Structures in C Crash Summary',
      subject: 'Programming for Problem Solving (PPS)',
      unit: 4,
      topic: 'Pointers and Modular Functions in C',
      department: 'First Year Engineering',
      year: 'FE 2026',
      fileType: 'PDF',
      fileUrl: '/notes/pps_pointers_structures.pdf',
      fileSize: '2.9 MB',
      uploadedBy: 'senior-1',
      uploaderName: 'Rohan Sharma',
      uploaderRole: 'SENIOR',
      downloadsCount: 164,
      viewsCount: 490,
      createdAt: '2026-02-25T11:00:00.000Z',
    },
    {
      id: 'note-5',
      title: 'Water Technology, Hardness Calculations & EDTA Method',
      subject: 'Chemistry',
      unit: 1,
      topic: 'Water Quality, Hardness & Boiler Troubles',
      department: 'First Year Engineering',
      year: 'FE 2026',
      fileType: 'PDF',
      fileUrl: '/notes/chemistry_water_tech.pdf',
      fileSize: '3.1 MB',
      uploadedBy: 'admin-1',
      uploaderName: 'Anchal Singh',
      uploaderRole: 'ADMIN',
      downloadsCount: 110,
      viewsCount: 280,
      createdAt: '2026-02-28T10:00:00.000Z',
    },
    {
      id: 'note-6',
      title: 'Semiconductor Diodes, BJT & Operational Amplifiers (Op-Amp)',
      subject: 'Basic Electronics Engineering (BXE)',
      unit: 3,
      topic: 'Op-Amp Inverting, Non-Inverting & Applications',
      department: 'First Year Engineering',
      year: 'FE 2026',
      fileType: 'PDF',
      fileUrl: '/notes/bxe_diodes_opamp.pdf',
      fileSize: '4.2 MB',
      uploadedBy: 'senior-2',
      uploaderName: 'Priya Patil',
      uploaderRole: 'SENIOR',
      downloadsCount: 88,
      viewsCount: 245,
      createdAt: '2026-03-02T12:00:00.000Z',
    },
  ];

  // 2025 Pattern — 60 Marks Question Papers & Question Banks for the 10 SPPU Subjects
  const pyqPapers: PYQPaper[] = [
    // --- 2025 Pattern (60 Marks) Question Papers ---
    {
      id: 'qp-2025-01',
      type: 'QUESTION_PAPER',
      title: 'Mathematics 1 — 2025 Pattern 60 Marks Model Question Paper',
      subject: 'Mathematics 1',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'End-Sem Exam',
      department: 'FE All Branches',
      fileUrl: '/pyqs/maths1_2025_60marks_endsem.pdf',
      fileName: 'SPPU_FE_Maths1_2025_Pattern_60Marks_Official.pdf',
      fileSize: '1.4 MB',
      uploadedBy: 'Anchal Singh (Admin)',
      uploaderId: 'admin-1',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 420,
      createdAt: '2026-01-20T10:00:00.000Z',
    },
    {
      id: 'qp-2025-02',
      type: 'QUESTION_PAPER',
      title: 'Basic Electrical Engineering (BEE) — 2025 Pattern 60 Marks Paper',
      subject: 'Basic Electrical Engineering (BEE)',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'End-Sem Exam',
      department: 'FE All Branches',
      fileUrl: '/pyqs/bee_2025_60marks.pdf',
      fileName: 'SPPU_FE_BEE_2025_Pattern_60Marks.pdf',
      fileSize: '1.1 MB',
      uploadedBy: 'Gargi Bhothre (Admin)',
      uploaderId: 'admin-2',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 310,
      createdAt: '2026-01-22T10:00:00.000Z',
    },
    {
      id: 'qp-2025-03',
      type: 'QUESTION_PAPER',
      title: 'Engineering Graphics — 2025 Pattern 60 Marks In-Sem & Prelim Paper',
      subject: 'Engineering Graphics',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'In-Sem Exam',
      department: 'FE All Branches',
      fileUrl: '/pyqs/eg_2025_60marks_insem.pdf',
      fileName: 'SPPU_FE_EG_2025_Pattern_60Marks_InSem.pdf',
      fileSize: '2.5 MB',
      uploadedBy: 'Shreya Ashtaker (Admin)',
      uploaderId: 'admin-3',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: false,
      downloadsCount: 265,
      createdAt: '2026-01-25T11:00:00.000Z',
    },
    {
      id: 'qp-2025-04',
      type: 'QUESTION_PAPER',
      title: 'Chemistry — 2025 Pattern 60 Marks End-Sem Paper',
      subject: 'Chemistry',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'End-Sem Exam',
      department: 'FE All Branches',
      fileUrl: '/pyqs/chem_2025_60marks.pdf',
      fileName: 'SPPU_FE_Chemistry_2025_Pattern_60Marks.pdf',
      fileSize: '1.2 MB',
      uploadedBy: 'Shravani Deshmukh (Admin)',
      uploaderId: 'admin-4',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 195,
      createdAt: '2026-02-01T11:00:00.000Z',
    },
    {
      id: 'qp-2025-05',
      type: 'QUESTION_PAPER',
      title: 'Programming for Problem Solving (PPS) — 2025 Pattern 60 Marks Paper',
      subject: 'Programming for Problem Solving (PPS)',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'End-Sem Exam',
      department: 'FE All Branches',
      fileUrl: '/pyqs/pps_2025_60marks.pdf',
      fileName: 'SPPU_FE_PPS_2025_Pattern_60Marks.pdf',
      fileSize: '1.6 MB',
      uploadedBy: 'Rohan Sharma (Senior)',
      uploaderId: 'senior-1',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 380,
      createdAt: '2026-02-05T15:00:00.000Z',
    },
    {
      id: 'qp-2025-06',
      type: 'QUESTION_PAPER',
      title: 'Physics — 2025 Pattern 60 Marks In-Sem Question Paper',
      subject: 'Physics',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'In-Sem Exam',
      department: 'FE All Branches',
      fileUrl: '/pyqs/physics_2025_60marks.pdf',
      fileName: 'SPPU_FE_Physics_2025_Pattern_60Marks.pdf',
      fileSize: '0.9 MB',
      uploadedBy: 'Priya Patil (Senior)',
      uploaderId: 'senior-2',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: false,
      downloadsCount: 175,
      createdAt: '2026-02-12T09:30:00.000Z',
    },
    {
      id: 'qp-2025-07',
      type: 'QUESTION_PAPER',
      title: 'Mathematics 2 — 2025 Pattern 60 Marks Model Question Paper',
      subject: 'Mathematics 2',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'Model Paper',
      department: 'FE All Branches',
      fileUrl: '/pyqs/maths2_2025_60marks.pdf',
      fileName: 'SPPU_FE_Maths2_2025_Pattern_60Marks_Model.pdf',
      fileSize: '1.5 MB',
      uploadedBy: 'Anchal Singh (Admin)',
      uploaderId: 'admin-1',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 290,
      createdAt: '2026-02-15T10:00:00.000Z',
    },
    {
      id: 'qp-2025-08',
      type: 'QUESTION_PAPER',
      title: 'Basic Electronics Engineering (BXE) — 2025 Pattern 60 Marks Paper',
      subject: 'Basic Electronics Engineering (BXE)',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'End-Sem Exam',
      department: 'FE All Branches',
      fileUrl: '/pyqs/bxe_2025_60marks.pdf',
      fileName: 'SPPU_FE_BXE_2025_Pattern_60Marks.pdf',
      fileSize: '1.3 MB',
      uploadedBy: 'Priya Patil (Senior)',
      uploaderId: 'senior-2',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 220,
      createdAt: '2026-02-18T14:00:00.000Z',
    },
    {
      id: 'qp-2025-09',
      type: 'QUESTION_PAPER',
      title: 'Engineering Mechanics — 2025 Pattern 60 Marks End-Sem Paper',
      subject: 'Engineering Mechanics',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'End-Sem Exam',
      department: 'FE All Branches',
      fileUrl: '/pyqs/mechanics_2025_60marks.pdf',
      fileName: 'SPPU_FE_Mechanics_2025_Pattern_60Marks.pdf',
      fileSize: '2.1 MB',
      uploadedBy: 'Aditya Kulkarni (Senior)',
      uploaderId: 'senior-3',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: false,
      downloadsCount: 210,
      createdAt: '2026-02-22T16:00:00.000Z',
    },
    {
      id: 'qp-2025-10',
      type: 'QUESTION_PAPER',
      title: 'Fundamentals of Programming Languages (FPL) — 2025 Pattern 60 Marks',
      subject: 'Fundamentals of Programming Languages (FPL)',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'Unit Test',
      department: 'FE All Branches',
      fileUrl: '/pyqs/fpl_2025_60marks.pdf',
      fileName: 'SPPU_FE_FPL_2025_Pattern_60Marks.pdf',
      fileSize: '1.1 MB',
      uploadedBy: 'Rohan Sharma (Senior)',
      uploaderId: 'senior-1',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 160,
      createdAt: '2026-02-25T11:00:00.000Z',
    },

    // --- 2025 Pattern (60 Marks) Question Banks ---
    {
      id: 'qb-2025-01',
      type: 'QUESTION_BANK',
      title: 'Comprehensive Question Bank: Mathematics 1 (All Units 1-6)',
      subject: 'Mathematics 1',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/maths1_2025_bank_60marks.pdf',
      fileName: 'SPPU_Maths1_Question_Bank_2025_Pattern_60Marks.pdf',
      fileSize: '4.2 MB',
      uploadedBy: 'Anchal Singh (Admin)',
      uploaderId: 'admin-1',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 580,
      createdAt: '2026-01-28T09:00:00.000Z',
    },
    {
      id: 'qb-2025-02',
      type: 'QUESTION_BANK',
      title: 'BEE 60 Marks Curated Question Bank with Numerical Solutions',
      subject: 'Basic Electrical Engineering (BEE)',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/bee_2025_bank_60marks.pdf',
      fileName: 'SPPU_BEE_Question_Bank_2025_Pattern_60Marks.pdf',
      fileSize: '3.8 MB',
      uploadedBy: 'Priya Patil (Senior)',
      uploaderId: 'senior-2',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 460,
      createdAt: '2026-02-02T10:00:00.000Z',
    },
    {
      id: 'qb-2025-03',
      type: 'QUESTION_BANK',
      title: 'Chemistry 60-Marks High-Frequency Question Bank & Formulae',
      subject: 'Chemistry',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/chem_2025_bank_60marks.pdf',
      fileName: 'SPPU_Chemistry_Question_Bank_2025_Pattern.pdf',
      fileSize: '2.9 MB',
      uploadedBy: 'Gargi Bhothre (Admin)',
      uploaderId: 'admin-2',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 390,
      createdAt: '2026-02-04T12:00:00.000Z',
    },
    {
      id: 'qb-2025-04',
      type: 'QUESTION_BANK',
      title: 'Engineering Graphics Step-by-Step Problem Bank (2025 Pattern)',
      subject: 'Engineering Graphics',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/eg_2025_bank_60marks.pdf',
      fileName: 'SPPU_EG_Question_Bank_2025_Pattern.pdf',
      fileSize: '5.6 MB',
      uploadedBy: 'Aditya Kulkarni (Senior)',
      uploaderId: 'senior-3',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: false,
      downloadsCount: 340,
      createdAt: '2026-02-08T15:00:00.000Z',
    },
    {
      id: 'qb-2025-05',
      type: 'QUESTION_BANK',
      title: 'PPS C Programming Problem Bank & Output Tracing Questions',
      subject: 'Programming for Problem Solving (PPS)',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/pps_2025_bank_60marks.pdf',
      fileName: 'SPPU_PPS_Question_Bank_2025_Pattern_60Marks.pdf',
      fileSize: '3.1 MB',
      uploadedBy: 'Rohan Sharma (Senior)',
      uploaderId: 'senior-1',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 520,
      createdAt: '2026-02-12T16:00:00.000Z',
    },
    {
      id: 'qb-2025-06',
      type: 'QUESTION_BANK',
      title: 'Engineering Mechanics 60 Marks Solved Equilibrium & Friction Bank',
      subject: 'Engineering Mechanics',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/mech_2025_bank_60marks.pdf',
      fileName: 'SPPU_Mechanics_Question_Bank_2025_Pattern.pdf',
      fileSize: '4.5 MB',
      uploadedBy: 'Shreya Ashtaker (Admin)',
      uploaderId: 'admin-3',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 295,
      createdAt: '2026-02-16T11:00:00.000Z',
    },
    {
      id: 'qb-2025-07',
      type: 'QUESTION_BANK',
      title: 'Physics Optics, Quantum & Lasers 60 Marks Question Bank',
      subject: 'Physics',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/physics_2025_bank_60marks.pdf',
      fileName: 'SPPU_Physics_Question_Bank_2025_Pattern.pdf',
      fileSize: '2.8 MB',
      uploadedBy: 'Shravani Deshmukh (Admin)',
      uploaderId: 'admin-4',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: false,
      downloadsCount: 240,
      createdAt: '2026-02-20T14:00:00.000Z',
    },
    {
      id: 'qb-2025-08',
      type: 'QUESTION_BANK',
      title: 'Mathematics 2 Integral Calculus & Fourier Series Question Bank',
      subject: 'Mathematics 2',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/maths2_2025_bank_60marks.pdf',
      fileName: 'SPPU_Maths2_Question_Bank_2025_Pattern.pdf',
      fileSize: '3.9 MB',
      uploadedBy: 'Anchal Singh (Admin)',
      uploaderId: 'admin-1',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 370,
      createdAt: '2026-02-24T10:00:00.000Z',
    },
    {
      id: 'qb-2025-09',
      type: 'QUESTION_BANK',
      title: 'BXE Electronic Devices & Transducers Question Bank (60 Marks)',
      subject: 'Basic Electronics Engineering (BXE)',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 2',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/bxe_2025_bank_60marks.pdf',
      fileName: 'SPPU_BXE_Question_Bank_2025_Pattern.pdf',
      fileSize: '3.2 MB',
      uploadedBy: 'Priya Patil (Senior)',
      uploaderId: 'senior-2',
      uploaderRole: 'SENIOR',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 280,
      createdAt: '2026-02-26T15:00:00.000Z',
    },
    {
      id: 'qb-2025-10',
      type: 'QUESTION_BANK',
      title: 'FPL Algorithms, Flowcharts & Python Scripts Bank',
      subject: 'Fundamentals of Programming Languages (FPL)',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'Question Bank',
      department: 'FE All Branches',
      fileUrl: '/qb/fpl_2025_bank_60marks.pdf',
      fileName: 'SPPU_FPL_Question_Bank_2025_Pattern.pdf',
      fileSize: '2.1 MB',
      uploadedBy: 'Gargi Bhothre (Admin)',
      uploaderId: 'admin-2',
      uploaderRole: 'ADMIN',
      status: 'PUBLISHED',
      hasSolutions: true,
      downloadsCount: 230,
      createdAt: '2026-02-27T16:00:00.000Z',
    },

    // --- Sample Pending Senior Upload to demonstrate Admin Moderation Flow ---
    {
      id: 'qp-pending-01',
      type: 'QUESTION_PAPER',
      title: 'Mathematics 1 — 2025 Pattern Prelim Paper (Solved by Senior)',
      subject: 'Mathematics 1',
      academicYear: '2024-25',
      pattern: '2025 Pattern',
      totalMarks: 60,
      semester: 'Semester 1',
      examType: 'Prelim Exam',
      department: 'First Year Engineering',
      fileUrl: '/pyqs/maths1_senior_prelim_2025.pdf',
      fileName: 'Maths1_FE_Prelim_2025_Pattern_Handwritten_Solution.pdf',
      fileSize: '3.6 MB',
      uploadedBy: 'Rohan Sharma (Senior)',
      uploaderId: 'senior-1',
      uploaderRole: 'SENIOR',
      status: 'PENDING_REVIEW',
      moderationComment: 'Awaiting administrator verification for syllabus accuracy.',
      hasSolutions: true,
      downloadsCount: 0,
      createdAt: '2026-03-01T12:00:00.000Z',
    },
  ];

  const liveSessions: LiveSession[] = [
    {
      id: 'session-1',
      mentorId: 'senior-1',
      mentorName: 'Rohan Sharma',
      mentorDepartment: 'Computer Engineering',
      mentorYear: 'TE',
      title: 'Conquer SPPU Maths 1: 2025 Pattern 60 Marks Strategy & Tricks',
      subject: 'Mathematics 1',
      description:
        'Live problem solving for SPPU 2025 Pattern 60-mark papers. Matrix diagonalization, Eigen vectors, and how to avoid calculation pitfalls.',
      scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      durationMinutes: 60,
      meetingLink: 'https://meet.google.com/ssb-math-peer',
      maxParticipants: 35,
      registeredUserIds: ['student-1', 'student-2'],
      attendedUserIds: [],
      status: 'SCHEDULED',
      createdAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'session-2',
      mentorId: 'senior-2',
      mentorName: 'Priya Patil',
      mentorDepartment: 'Information Technology',
      mentorYear: 'BE',
      title: 'BEE Superposition & Thevenin Theorem Numerical Workshop',
      subject: 'Basic Electrical Engineering (BEE)',
      description:
        'Step-by-step breakdown of 2025 Pattern numerical problems. Master circuit analysis with zero confusion.',
      scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      durationMinutes: 75,
      meetingLink: 'https://meet.google.com/ssb-bee-live',
      maxParticipants: 40,
      registeredUserIds: ['student-1'],
      attendedUserIds: [],
      status: 'SCHEDULED',
      createdAt: '2026-03-02T11:00:00.000Z',
    },
    {
      id: 'session-3',
      mentorId: 'senior-3',
      mentorName: 'Aditya Kulkarni',
      mentorDepartment: 'Mechanical Engineering',
      mentorYear: 'TE',
      title: 'Engineering Graphics: Orthographic Projections Live Drawing Demo',
      subject: 'Engineering Graphics',
      description:
        'Live CAD and sheet drafting demo showing 1st Angle vs 3rd Angle projections for 60-mark exam preparation.',
      scheduledAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      durationMinutes: 90,
      meetingLink: 'https://meet.google.com/ssb-eg-demo',
      maxParticipants: 30,
      registeredUserIds: ['student-1', 'student-2'],
      attendedUserIds: ['student-1'],
      status: 'COMPLETED',
      createdAt: '2026-02-28T09:00:00.000Z',
    },
  ];

  const creditTransactions: CreditTransaction[] = [
    {
      id: 'tx-1',
      fromUserId: 'student-1',
      fromUserName: 'Aryan Mehta',
      toUserId: 'senior-1',
      toUserName: 'Rohan Sharma',
      amount: 15,
      sessionId: 'session-3',
      reason: 'Excellent guidance on Maths 1 linear algebra tricks!',
      createdAt: '2026-02-28T12:00:00.000Z',
    },
    {
      id: 'tx-2',
      fromUserId: 'student-2',
      fromUserName: 'Sneha Shinde',
      toUserId: 'senior-2',
      toUserName: 'Priya Patil',
      amount: 20,
      sessionId: undefined,
      reason: 'Amazing help with BEE solved question bank for 2025 pattern.',
      createdAt: '2026-03-01T15:30:00.000Z',
    },
  ];

  const feedback: FeedbackRecord[] = [
    {
      id: 'fb-1',
      sessionId: 'session-3',
      mentorId: 'senior-3',
      studentId: 'student-1',
      studentName: 'Aryan Mehta',
      rating: 5,
      comment: 'Very patient explanation of isometric views. Highly recommended mentor!',
      createdAt: '2026-02-28T12:30:00.000Z',
    },
  ];

  const reports: ReportItem[] = [];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'senior-1',
      title: 'Credits Received',
      message: 'Aryan Mehta awarded you 15 learning credits for your peer mentorship!',
      type: 'CREDIT',
      isRead: false,
      createdAt: '2026-02-28T12:00:00.000Z',
    },
    {
      id: 'notif-2',
      userId: 'student-1',
      title: 'Upcoming Live Session',
      message: 'Maths 1 2025 Pattern live session starts in 2 days.',
      type: 'SESSION',
      isRead: true,
      createdAt: '2026-03-01T10:05:00.000Z',
    },
  ];

  const auditLogs: AdminAuditLog[] = [
    {
      id: 'log-1',
      adminId: 'admin-1',
      adminName: 'Anchal Singh',
      action: 'APPROVE_SENIOR',
      targetType: 'USER',
      targetId: 'senior-1',
      details: 'Approved senior mentor Rohan Sharma after validating FE First-Year Marksheet.',
      timestamp: '2026-02-01T09:00:00.000Z',
    },
    {
      id: 'log-2',
      adminId: 'admin-2',
      adminName: 'Gargi Bhothre',
      action: 'APPROVE_SENIOR',
      targetType: 'USER',
      targetId: 'senior-2',
      details: 'Approved senior mentor Priya Patil after validating FE IT Marksheet.',
      timestamp: '2026-02-02T12:00:00.000Z',
    },
  ];

  return {
    users: [...adminUsers, ...seniorUsers, ...studentUsers],
    seniorProfiles,
    studentProfiles,
    liveSessions,
    notes,
    pyqPapers,
    creditTransactions,
    feedback,
    reports,
    notifications,
    auditLogs,
  };
}

// Initialize database
export function initDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      // Ensure all arrays and objects are present
      if (!db.users || !Array.isArray(db.users)) {
        db = createSeedData();
        persistDatabase();
      }
    } catch (e) {
      console.warn('Corrupt database file, resetting to seed data:', e);
      db = createSeedData();
      persistDatabase();
    }
  } else {
    db = createSeedData();
    persistDatabase();
  }
  return db;
}

// Export database accessors
export function getDb(): DatabaseSchema {
  if (!db) {
    initDatabase();
  }
  return db;
}

export function findUserByErp(erp: string): UserRecord | undefined {
  if (!erp) return undefined;
  return getDb().users.find((u) => u.erp && u.erp.toUpperCase() === erp.trim().toUpperCase());
}

export function findUserByMobile(mobile: string): UserRecord | undefined {
  if (!mobile) return undefined;
  const clean = mobile.replace(/[\s\-\+]/g, '');
  return getDb().users.find((u) => u.mobileNumber && u.mobileNumber.replace(/[\s\-\+]/g, '') === clean);
}

export function findUserByIdentifier(identifier: string): UserRecord | undefined {
  if (!identifier) return undefined;
  const trimmed = identifier.trim();
  // Check by ERP first, then by mobile
  const byErp = findUserByErp(trimmed);
  if (byErp) return byErp;
  return findUserByMobile(trimmed);
}

export function findUserById(id: string): UserRecord | undefined {
  return getDb().users.find((u) => u.id === id);
}

export function validateErpFormat(erp: string): boolean {
  if (!erp || typeof erp !== 'string') return false;
  return isAuthorizedCollegeStudent(erp);
}

// Calculate Senior Popularity Score
export function calculatePopularityScore(
  credits: number,
  studentsHelped: number,
  rating: number,
  ratingCount: number
): number {
  const creditFactor = Math.min(credits * 0.8, 40);
  const studentsFactor = Math.min(studentsHelped * 1.5, 30);
  const ratingFactor = ((rating || 5) / 5) * 20;
  const countFactor = Math.min(ratingCount * 1.0, 10);
  return Math.min(100, Math.round(creditFactor + studentsFactor + ratingFactor + countFactor));
}
