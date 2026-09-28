export type UserRole = 'STUDENT' | 'SENIOR' | 'ADMIN';

export type VerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REUPLOAD_REQUESTED'
  | 'SUSPENDED';

export const SPPU_SUBJECTS = [
  'Mathematics 1',
  'Chemistry',
  'Basic Electrical Engineering (BEE)',
  'Engineering Graphics',
  'Fundamentals of Programming Languages (FPL)',
  'Mathematics 2',
  'Physics',
  'Basic Electronics Engineering (BXE)',
  'Engineering Mechanics',
  'Programming for Problem Solving (PPS)',
] as const;

export type SPPUSubject = (typeof SPPU_SUBJECTS)[number];

export type AcademicMaterialType = 'QUESTION_PAPER' | 'QUESTION_BANK';

export interface SafeUser {
  id: string;
  erp?: string; // Private institutional ID, strictly withheld from public profiles & search
  mobileNumber?: string; // Private mobile number, verified via OTP, never exposed publicly
  name: string;
  email?: string; // Deprecated: College has not provided official emails
  role: UserRole;
  department: string;
  year: string;
  section: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  isSuspended: boolean;
  creditBalance: number;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  createdAt: string;
  seniorProfile?: SeniorProfile;
  studentProfile?: StudentProfile;
}

export interface SeniorProfile {
  userId: string;
  bio: string;
  skills: string[];
  teachingSubjects: SPPUSubject[];
  certificateUrl: string;
  certificateFileName: string;
  certificateStatus: VerificationStatus;
  studentsHelped: number;
  totalCreditsEarned: number;
  popularityScore: number;
  rating: number;
  ratingCount: number;
}

export interface StudentProfile {
  userId: string;
  interests?: string[];
  learningGoals?: string | string[];
  savedNotes?: string[];
  registeredSessions?: string[];
}

export interface LiveSession {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorDepartment: string;
  mentorYear: string;
  title: string;
  subject: SPPUSubject;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string; // Hidden unless user is registered or is creator/admin
  hasJoined?: boolean;
  maxParticipants: number;
  registeredUserIds: string[];
  attendedUserIds: string[];
  registeredStudentIds?: string[];
  attendedStudentIds?: string[];
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface AcademicNote {
  id: string;
  title: string;
  subject: SPPUSubject;
  unit: number; // 1 - 6
  topic: string;
  description?: string;
  department: string;
  year: string;
  fileType: string;
  fileUrl: string;
  fileName?: string;
  fileSize: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderRole: UserRole;
  downloadsCount: number;
  viewsCount: number;
  createdAt: string;
}

export interface PYQPaper {
  id: string;
  type: AcademicMaterialType; // 'QUESTION_PAPER' | 'QUESTION_BANK'
  title?: string;
  subject: SPPUSubject;
  academicYear: string;
  pattern: string; // "2025 Pattern"
  totalMarks: number; // 60
  semester: string; // "Semester 1" | "Semester 2"
  examType: string; // "In-Sem Exam" | "End-Sem Exam" | "Model Paper" | "Unit Test" | "Prelim Exam" | "Question Bank"
  department?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize: string;
  uploadedBy?: string; // Display string, e.g. "Rohan Sharma (Senior)" - NO ERP or phone
  uploaderId?: string;
  uploaderRole?: UserRole;
  status: 'PUBLISHED' | 'PENDING_REVIEW' | 'REJECTED';
  moderationComment?: string;
  hasSolutions?: boolean;
  downloadsCount: number;
  createdAt: string;
}

export interface SendOtpRequest {
  erp: string;
  mobileNumber: string;
  purpose: 'REGISTRATION_STUDENT' | 'REGISTRATION_SENIOR' | 'LOGIN';
}

export interface VerifyOtpRequest {
  erp: string;
  mobileNumber: string;
  otp: string;
  purpose: 'REGISTRATION_STUDENT' | 'REGISTRATION_SENIOR' | 'LOGIN';
}

export interface CreditTransaction {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  sessionId?: string;
  reason: string;
  createdAt: string;
}

export interface FeedbackRecord {
  id: string;
  sessionId?: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'SENIOR' | 'NOTE' | 'SESSION' | 'OTHER';
  targetId: string;
  targetTitle: string;
  category:
    | 'Inappropriate content'
    | 'Fake senior'
    | 'Misuse'
    | 'Spam'
    | 'Harassment'
    | 'Incorrect educational material';
  description: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolvedBy?: string;
  resolutionNote?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CREDIT' | 'SESSION';
  isRead: boolean;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId?: string;
  adminName: string;
  adminErp?: string;
  action: string;
  target?: string;
  targetId?: string;
  targetType?: string;
  details: string;
  timestamp: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export interface PlatformStats {
  totalStudents: number;
  totalSeniors: number;
  pendingApprovals: number;
  pendingUploads?: number;
  activeUsers: number;
  suspendedUsers: number;
  totalNotes: number;
  totalPYQs: number;
  totalLiveSessions: number;
  totalCreditTransactions: number;
  totalReports: number;
}
