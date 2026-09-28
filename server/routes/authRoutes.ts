import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  findUserByErp,
  findUserByMobile,
  findUserByIdentifier,
  getDb,
  persistDatabase,
  sanitizeSelfUser,
  sanitizeUser,
  isAuthorizedCollegeStudent,
  validateMobileNumber,
  UserRecord,
} from '../db.js';
import {
  generateToken,
  checkRateLimit,
  authenticate,
  AuthenticatedRequest,
  generateVerificationToken,
  verifyVerificationToken,
} from '../auth.js';
import { SPPU_SUBJECTS, SPPUSubject, SeniorProfile, StudentProfile } from '../../src/types/index.js';

export const authRouter = Router();

const OTP_SECRET = process.env.OTP_SECRET || 'skillswap_otp_hmac_secret_2026';

interface OtpRecord {
  hash: string;
  expiresAt: number;
  attemptsRemaining: number;
  erp: string;
  mobileNumber: string;
  purpose: string;
}

// In-memory secure OTP store
const otpStore = new Map<string, OtpRecord>();

function getOtpKey(erp: string, mobileNumber: string, purpose: string): string {
  return `${erp.trim().toUpperCase()}:${mobileNumber.replace(/[\s\-\+]/g, '')}:${purpose}`;
}

function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', OTP_SECRET).update(otp.trim()).digest('hex');
}

// 0. Send Mobile OTP for ERP + Mobile Verification
authRouter.post('/otp/send', (req, res: Response) => {
  const { erp, mobileNumber, purpose } = req.body;

  if (!erp || !mobileNumber) {
    res.status(400).json({ error: 'ERP number and Mobile number are required.' });
    return;
  }

  const cleanErp = erp.trim().toUpperCase();
  const cleanMobile = mobileNumber.replace(/[\s\-\+]/g, '');

  // 1. College-Only Verification: Validate ERP belongs to college
  if (!isAuthorizedCollegeStudent(cleanErp)) {
    res.status(400).json({
      error:
        'ERP Verification Failed: The entered ERP number is not recognized in the official college database registry. Only verified students of our college are authorized to access the system.',
    });
    return;
  }

  // 2. Validate 10-digit mobile number format
  if (!validateMobileNumber(cleanMobile)) {
    res.status(400).json({
      error: 'Please enter a valid 10-digit mobile number (e.g., 9822012345).',
    });
    return;
  }

  // 3. For registration purposes, ensure ERP & Mobile are not already registered
  if (purpose === 'REGISTRATION_STUDENT' || purpose === 'REGISTRATION_SENIOR') {
    if (findUserByErp(cleanErp)) {
      res.status(409).json({
        error: 'ERP Verification Failed: An account is already registered with this ERP number. Each college ERP is unique.',
      });
      return;
    }
    if (findUserByMobile(cleanMobile)) {
      res.status(409).json({
        error: 'Mobile Number Verification Failed: An account is already registered with this mobile number.',
      });
      return;
    }
  }

  // 4. Rate Limiting: Max 3 OTP requests per 5 minutes per ERP/Mobile
  const rateKey = `otp_send:${cleanErp}:${cleanMobile}`;
  const rateLimit = checkRateLimit(rateKey, 3, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.status(429).json({
      error: 'Too many OTP requests. Please wait 5 minutes before requesting a new OTP.',
    });
    return;
  }

  // 5. Generate secure 6-digit numeric OTP
  // In our sandbox environment without a third-party SMS vendor, we generate the OTP and return devOtpHint for testing
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  const key = getOtpKey(cleanErp, cleanMobile, purpose || 'REGISTRATION_STUDENT');

  otpStore.set(key, {
    hash: hashOtp(otpCode),
    expiresAt,
    attemptsRemaining: 3,
    erp: cleanErp,
    mobileNumber: cleanMobile,
    purpose: purpose || 'REGISTRATION_STUDENT',
  });

  const maskedPhone = cleanMobile.slice(0, 2) + '******' + cleanMobile.slice(-2);

  res.json({
    success: true,
    message: `OTP sent successfully to mobile number +91 ${maskedPhone}. It is valid for 5 minutes.`,
    expiresInSeconds: 300,
    devOtpHint: otpCode, // Provided for instant evaluation/testing without telco delay
  });
});

// 0b. Verify Mobile OTP
authRouter.post('/otp/verify', (req, res: Response) => {
  const { erp, mobileNumber, otp, purpose } = req.body;

  if (!erp || !mobileNumber || !otp) {
    res.status(400).json({ error: 'ERP number, mobile number, and OTP are required.' });
    return;
  }

  const cleanErp = erp.trim().toUpperCase();
  const cleanMobile = mobileNumber.replace(/[\s\-\+]/g, '');
  const key = getOtpKey(cleanErp, cleanMobile, purpose || 'REGISTRATION_STUDENT');
  const record = otpStore.get(key);

  if (!record) {
    res.status(400).json({
      error: 'No active OTP request found. Please request a new OTP.',
    });
    return;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    res.status(400).json({
      error: 'OTP has expired. Please request a new OTP.',
    });
    return;
  }

  if (record.attemptsRemaining <= 0) {
    otpStore.delete(key);
    res.status(429).json({
      error: 'Too many incorrect attempts. This OTP has been invalidated for security. Please request a new OTP.',
    });
    return;
  }

  const candidateHash = hashOtp(otp);
  if (candidateHash !== record.hash) {
    record.attemptsRemaining -= 1;
    res.status(400).json({
      error: `Invalid OTP. ${record.attemptsRemaining} attempt(s) remaining.`,
      attemptsRemaining: record.attemptsRemaining,
    });
    return;
  }

  // OTP verified successfully
  otpStore.delete(key);

  // Generate signed verification token valid for 15 minutes to complete registration
  const verificationToken = generateVerificationToken(
    cleanErp,
    cleanMobile,
    purpose || 'REGISTRATION_STUDENT'
  );

  res.json({
    verified: true,
    message: 'Mobile number verified successfully!',
    verificationToken,
  });
});

// 1. Student / Junior User Registration
// Required: Full Name, ERP Number, Mobile Number, Password, Department, Year, Section + OTP Verification
// NO email required!
authRouter.post('/register/student', (req, res: Response) => {
  const {
    erp,
    mobileNumber,
    verificationToken,
    name,
    password,
    confirmPassword,
    department,
    year,
    section,
    interests,
    learningGoals,
  } = req.body;

  // 1. Input validations
  if (!erp || !mobileNumber || !name || !password || !confirmPassword || !department || !year || !section) {
    res.status(400).json({
      error: 'All registration fields (Full Name, ERP Number, Mobile Number, Password, Department, Year, Section) are required.',
    });
    return;
  }

  const cleanErp = erp.trim().toUpperCase();
  const cleanMobile = mobileNumber.replace(/[\s\-\+]/g, '');

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  // 2. Validate College ERP
  if (!isAuthorizedCollegeStudent(cleanErp)) {
    res.status(400).json({
      error:
        'ERP Verification Failed: The entered ERP number is not recognized in the official college database registry. Only verified college students may register.',
    });
    return;
  }

  // 3. Validate Mobile Number
  if (!validateMobileNumber(cleanMobile)) {
    res.status(400).json({ error: 'Invalid 10-digit mobile number.' });
    return;
  }

  // 4. Verify OTP Token
  if (!verificationToken || !verifyVerificationToken(verificationToken, cleanErp, cleanMobile, 'REGISTRATION_STUDENT')) {
    res.status(400).json({
      error: 'Mobile OTP verification is required. Please verify your mobile number with the OTP before completing registration.',
    });
    return;
  }

  // 5. Unique constraints
  if (findUserByErp(cleanErp)) {
    res.status(409).json({ error: 'ERP Verification Failed: An account with this ERP number already exists.' });
    return;
  }

  if (findUserByMobile(cleanMobile)) {
    res.status(409).json({ error: 'An account with this mobile number already exists.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = `student-${Date.now()}`;

  const newStudent: UserRecord = {
    id: userId,
    erp: cleanErp,
    mobileNumber: cleanMobile,
    name: name.trim(),
    passwordHash,
    role: 'STUDENT',
    department: department.trim(),
    year: year.trim() || 'First Year (FE)',
    section: section.trim().toUpperCase(),
    verificationStatus: 'APPROVED',
    isSuspended: false,
    creditBalance: 50, // Initial welcome learning credits to reward seniors
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
    createdAt: new Date().toISOString(),
  };

  const studentProfile: StudentProfile = {
    userId,
    interests: Array.isArray(interests) ? interests : ['SPPU FE Subjects', 'Engineering Fundamentals'],
    learningGoals: learningGoals || 'Prepare for SPPU 2025 Pattern 60 Marks In-Sem and End-Sem exams.',
  };

  const db = getDb();
  db.users.push(newStudent);
  db.studentProfiles[userId] = studentProfile;

  // Add welcome notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    title: 'Welcome to Skill Swap Buddy!',
    message: 'Your student account has been created via college ERP & mobile verification. You have 50 initial learning credits!',
    type: 'SUCCESS',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  persistDatabase();

  const token = generateToken(userId);
  res.status(201).json({
    message: 'Registration successful! Welcome to Skill Swap Buddy.',
    user: sanitizeSelfUser(newStudent),
    token,
  });
});

// 2. Senior / Mentor Registration (STRICT VERIFICATION)
// Required: ERP + Mobile Number + OTP + Full Name + Department + Current Year + Section + Subjects + 1st Year Pass Proof
// Status: PENDING ADMIN VERIFICATION
// NO email required!
authRouter.post('/register/senior', (req, res: Response) => {
  const {
    erp,
    mobileNumber,
    verificationToken,
    name,
    password,
    confirmPassword,
    department,
    year,
    section,
    bio,
    skills,
    teachingSubjects,
    certificateFileName,
    certificateUrl,
  } = req.body;

  // 1. Validations
  if (!erp || !mobileNumber || !name || !password || !confirmPassword || !department || !year || !section) {
    res.status(400).json({ error: 'All core fields are required for Senior registration.' });
    return;
  }

  const cleanErp = erp.trim().toUpperCase();
  const cleanMobile = mobileNumber.replace(/[\s\-\+]/g, '');

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  // 2. College ERP check
  if (!isAuthorizedCollegeStudent(cleanErp)) {
    res.status(400).json({
      error:
        'ERP Verification Failed: The entered ERP number is not recognized in the official college database registry.',
    });
    return;
  }

  // 3. Mobile Number check
  if (!validateMobileNumber(cleanMobile)) {
    res.status(400).json({ error: 'Invalid 10-digit mobile number.' });
    return;
  }

  // 4. Verify OTP Token
  if (!verificationToken || !verifyVerificationToken(verificationToken, cleanErp, cleanMobile, 'REGISTRATION_SENIOR')) {
    res.status(400).json({
      error: 'Mobile OTP verification is required. Please verify your mobile number with the OTP before completing senior registration.',
    });
    return;
  }

  // 5. Unique constraints
  if (findUserByErp(cleanErp)) {
    res.status(409).json({ error: 'ERP Verification Failed: An account with this ERP number already exists.' });
    return;
  }

  if (findUserByMobile(cleanMobile)) {
    res.status(409).json({ error: 'An account with this mobile number already exists.' });
    return;
  }

  // 6. Senior Subject Validation: Must only pick from the 10 SPPU first-year subjects
  if (!Array.isArray(teachingSubjects) || teachingSubjects.length === 0) {
    res.status(400).json({
      error: 'Please select at least one teaching subject from the 10 SPPU First-Year subjects.',
    });
    return;
  }

  const invalidSubjects = teachingSubjects.filter(
    (subj: string) => !SPPU_SUBJECTS.includes(subj as SPPUSubject)
  );
  if (invalidSubjects.length > 0) {
    res.status(400).json({
      error: `Invalid teaching subjects: ${invalidSubjects.join(', ')}. Must be strictly from the 10 SPPU engineering subjects.`,
    });
    return;
  }

  // 7. Certificate / 1st Year Clearance Proof validation
  if (!certificateFileName) {
    res.status(400).json({
      error: 'First-year pass certificate or marksheet proof is mandatory for senior verification.',
    });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = `senior-${Date.now()}`;

  // Senior accounts are STRICTLY PENDING initially
  const newSenior: UserRecord = {
    id: userId,
    erp: cleanErp,
    mobileNumber: cleanMobile,
    name: name.trim(),
    passwordHash,
    role: 'SENIOR',
    department: department.trim(),
    year: year.trim() || 'Second Year (SE)',
    section: section.trim().toUpperCase(),
    verificationStatus: 'PENDING', // PENDING ADMIN VERIFICATION
    isSuspended: false,
    creditBalance: 0,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
    createdAt: new Date().toISOString(),
  };

  const parsedSkills = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : ['SPPU Engineering Prep'];

  const seniorProfile: SeniorProfile = {
    userId,
    bio: bio || `Senior mentor in ${department}. Verified FE clearance.`,
    skills: parsedSkills,
    teachingSubjects: teachingSubjects as SPPUSubject[],
    certificateUrl: certificateUrl || '/mock_certificates/uploaded_proof.pdf',
    certificateFileName: certificateFileName || 'first_year_clearance_proof.pdf',
    certificateStatus: 'PENDING',
    studentsHelped: 0,
    totalCreditsEarned: 0,
    popularityScore: 50,
    rating: 5.0,
    ratingCount: 0,
  };

  const db = getDb();
  db.users.push(newSenior);
  db.seniorProfiles[userId] = seniorProfile;

  // Add notification to all authorized admins
  const admins = db.users.filter((u) => u.role === 'ADMIN');
  for (const admin of admins) {
    db.notifications.push({
      id: `notif-${Date.now()}-${admin.id}`,
      userId: admin.id,
      title: 'New Senior Verification Request',
      message: `${name} (${department} - ${year}) submitted First-Year clearance proof for admin verification.`,
      type: 'WARNING',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Notification for senior
  db.notifications.push({
    id: `notif-${Date.now()}-self`,
    userId,
    title: 'Application Submitted (Pending Admin Review)',
    message: 'Your Senior Mentor application and 1st year marksheet have been submitted. An authorized college admin will verify your credentials shortly.',
    type: 'INFO',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  persistDatabase();

  const token = generateToken(userId);
  res.status(201).json({
    message:
      'Senior registration submitted successfully! Your account is currently PENDING ADMIN VERIFICATION.',
    user: sanitizeSelfUser(newSenior),
    token,
  });
});

// 3. Universal College Login (ERP Number or Mobile Number + Password)
// NO email required!
authRouter.post('/login', (req, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ error: 'ERP Number or Mobile Number and Password are required.' });
    return;
  }

  // Rate Limiting check: 5 attempts per minute per identifier/IP
  const ipKey = req.ip || req.socket.remoteAddress || 'ip';
  const rateLimitResult = checkRateLimit(`login:${identifier.trim()}:${ipKey}`, 5, 60000);
  if (!rateLimitResult.allowed) {
    res.status(429).json({
      error: 'Too many login attempts. Please wait 1 minute before trying again.',
    });
    return;
  }

  const trimmed = identifier.trim();
  const user = findUserByIdentifier(trimmed);

  if (!user) {
    res.status(401).json({
      error: 'Invalid credentials. Please check your ERP number or registered mobile number.',
    });
    return;
  }

  // Verify password
  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      error: 'Invalid password. Please check your credentials.',
    });
    return;
  }

  // Check account suspension
  if (user.isSuspended) {
    res.status(403).json({
      error: 'Your account has been suspended by the administration. Reason: disciplinary review.',
    });
    return;
  }

  const token = generateToken(user.id);
  res.json({
    message: 'Login successful',
    user: sanitizeSelfUser(user),
    token,
  });
});

// 4. Get Current Authenticated User & Notifications Count
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const db = getDb();
  const unreadNotifs = db.notifications.filter((n) => n.userId === req.user?.id && !n.isRead).length;

  res.json({
    user: sanitizeSelfUser(req.user),
    unreadNotificationsCount: unreadNotifs,
  });
});

// 5. Logout endpoint
authRouter.post('/logout', authenticate, (_req, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});
