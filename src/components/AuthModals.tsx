import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SPPU_SUBJECTS, SPPUSubject } from '../types';
import {
  Lock,
  Phone,
  User,
  GraduationCap,
  Award,
  ShieldCheck,
  AlertCircle,
  FileText,
  UploadCloud,
  X,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Send,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'student-register' | 'senior-register';
}

export const AuthModals: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login',
}) => {
  const { login, registerStudent, registerSenior, isLoading } = useAuth();
  const [view, setView] = useState<'login' | 'student-register' | 'senior-register'>(initialView);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login Form (ERP Number or Mobile Number + Password)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // OTP State for Student
  const [studentOtpSent, setStudentOtpSent] = useState(false);
  const [studentOtpVerified, setStudentOtpVerified] = useState(false);
  const [studentOtp, setStudentOtp] = useState('');
  const [studentDevOtpHint, setStudentDevOtpHint] = useState<string | null>(null);
  const [studentVerificationToken, setStudentVerificationToken] = useState('');
  const [isSendingStudentOtp, setIsSendingStudentOtp] = useState(false);
  const [isVerifyingStudentOtp, setIsVerifyingStudentOtp] = useState(false);

  // Student Form
  const [studentForm, setStudentForm] = useState({
    erp: '',
    mobileNumber: '',
    name: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Engineering',
    year: 'First Year (FE)',
    section: 'A',
    learningGoals: '',
  });

  // OTP State for Senior
  const [seniorOtpSent, setSeniorOtpSent] = useState(false);
  const [seniorOtpVerified, setSeniorOtpVerified] = useState(false);
  const [seniorOtp, setSeniorOtp] = useState('');
  const [seniorDevOtpHint, setSeniorDevOtpHint] = useState<string | null>(null);
  const [seniorVerificationToken, setSeniorVerificationToken] = useState('');
  const [isSendingSeniorOtp, setIsSendingSeniorOtp] = useState(false);
  const [isVerifyingSeniorOtp, setIsVerifyingSeniorOtp] = useState(false);

  // Senior Form
  const [seniorForm, setSeniorForm] = useState({
    erp: '',
    mobileNumber: '',
    name: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Engineering',
    year: 'Second Year (SE)',
    section: 'A',
    bio: '',
    skills: '',
    teachingSubjects: [] as SPPUSubject[],
    certificateFileName: '',
    certificateUrl: '',
  });

  if (!isOpen) return null;

  const resetAllErrors = () => {
    setError(null);
    setSuccess(null);
  };

  // 1. Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllErrors();
    try {
      await login(loginIdentifier, loginPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  // 2. Student OTP Flow
  const handleSendStudentOtp = async () => {
    if (!studentForm.erp.trim()) {
      setError('Please enter your college ERP number first.');
      return;
    }
    if (!studentForm.mobileNumber.trim()) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    resetAllErrors();
    setIsSendingStudentOtp(true);
    try {
      const res = await api.sendOtp({
        erp: studentForm.erp.trim(),
        mobileNumber: studentForm.mobileNumber.trim(),
        purpose: 'REGISTRATION_STUDENT',
      });
      setStudentOtpSent(true);
      if (res.devOtpHint) {
        setStudentDevOtpHint(res.devOtpHint);
        setStudentOtp(res.devOtpHint); // Auto-fill for instant test convenience
      }
      setSuccess(`OTP sent to +91 ${studentForm.mobileNumber.slice(-4).padStart(10, '•')}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsSendingStudentOtp(false);
    }
  };

  const handleVerifyStudentOtp = async () => {
    if (!studentOtp.trim()) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    resetAllErrors();
    setIsVerifyingStudentOtp(true);
    try {
      const res = await api.verifyOtp({
        erp: studentForm.erp.trim(),
        mobileNumber: studentForm.mobileNumber.trim(),
        otp: studentOtp.trim(),
        purpose: 'REGISTRATION_STUDENT',
      });
      setStudentOtpVerified(true);
      setStudentVerificationToken(res.verificationToken);
      setSuccess('Mobile number & College ERP successfully verified! Proceed with password creation.');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setIsVerifyingStudentOtp(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllErrors();

    if (!studentOtpVerified || !studentVerificationToken) {
      setError('Please complete mobile OTP verification first.');
      return;
    }

    if (studentForm.password !== studentForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (studentForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await registerStudent({
        ...studentForm,
        verificationToken: studentVerificationToken,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  // 3. Senior OTP Flow
  const handleSendSeniorOtp = async () => {
    if (!seniorForm.erp.trim()) {
      setError('Please enter your college ERP number first.');
      return;
    }
    if (!seniorForm.mobileNumber.trim()) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    resetAllErrors();
    setIsSendingSeniorOtp(true);
    try {
      const res = await api.sendOtp({
        erp: seniorForm.erp.trim(),
        mobileNumber: seniorForm.mobileNumber.trim(),
        purpose: 'REGISTRATION_SENIOR',
      });
      setSeniorOtpSent(true);
      if (res.devOtpHint) {
        setSeniorDevOtpHint(res.devOtpHint);
        setSeniorOtp(res.devOtpHint);
      }
      setSuccess(`OTP sent to +91 ${seniorForm.mobileNumber.slice(-4).padStart(10, '•')}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsSendingSeniorOtp(false);
    }
  };

  const handleVerifySeniorOtp = async () => {
    if (!seniorOtp.trim()) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    resetAllErrors();
    setIsVerifyingSeniorOtp(true);
    try {
      const res = await api.verifyOtp({
        erp: seniorForm.erp.trim(),
        mobileNumber: seniorForm.mobileNumber.trim(),
        otp: seniorOtp.trim(),
        purpose: 'REGISTRATION_SENIOR',
      });
      setSeniorOtpVerified(true);
      setSeniorVerificationToken(res.verificationToken);
      setSuccess('Mobile number & College ERP verified! Complete senior academic profile.');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setIsVerifyingSeniorOtp(false);
    }
  };

  const toggleTeachingSubject = (subject: SPPUSubject) => {
    setSeniorForm((prev) => {
      const exists = prev.teachingSubjects.includes(subject);
      const updated = exists
        ? prev.teachingSubjects.filter((s) => s !== subject)
        : [...prev.teachingSubjects, subject];
      return { ...prev, teachingSubjects: updated };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload an official PDF or JPG/PNG image of your First-Year pass mark-sheet.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('File size must be under 8MB.');
      return;
    }

    setError(null);
    setSeniorForm((prev) => ({
      ...prev,
      certificateFileName: file.name,
      certificateUrl: `/mock_certificates/${file.name}`,
    }));
  };

  const handleSeniorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllErrors();

    if (!seniorOtpVerified || !seniorVerificationToken) {
      setError('Please complete mobile OTP verification before submitting senior registration.');
      return;
    }

    if (seniorForm.password !== seniorForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (seniorForm.teachingSubjects.length === 0) {
      setError('Please select at least one teaching subject from the 10 SPPU First-Year subjects.');
      return;
    }

    if (!seniorForm.certificateFileName) {
      setError('First-Year Pass Certificate / Mark-sheet upload is required for senior verification.');
      return;
    }

    try {
      await registerSenior({
        ...seniorForm,
        verificationToken: seniorVerificationToken,
      });
      setSuccess('Senior Mentor registration submitted! Status: PENDING ADMIN VERIFICATION.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Senior registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Verified College Portal (ERP + Mobile)
            </span>
          </div>

          <h2 className="text-xl font-bold">
            {view === 'login' && 'College Account Sign In'}
            {view === 'student-register' && 'Student (Junior) Registration'}
            {view === 'senior-register' && 'Senior Mentor Registration'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {view === 'login' && 'Sign in using your College ERP Number or Mobile Number'}
            {view === 'student-register' && 'ERP + Mobile OTP verification for verified college students'}
            {view === 'senior-register' && 'ERP + Mobile OTP + First-Year pass proof verification'}
          </p>

          {/* View Switcher Tabs */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setView('login');
                resetAllErrors();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                view === 'login' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setView('student-register');
                resetAllErrors();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                view === 'student-register' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Student (Junior)
            </button>
            <button
              type="button"
              onClick={() => {
                setView('senior-register');
                resetAllErrors();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                view === 'senior-register' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Senior Mentor
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* VIEW 1: UNIVERSAL COLLEGE LOGIN (ERP or Mobile Number) */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  ERP Number or Mobile Number
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 25511566 or 9822010001 or SCOE2401"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  College email is not required. Use your institutional ERP or registered mobile number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Quick Test Credentials:</p>
                <p>• Student: <span className="font-mono text-slate-700">25511566</span> (or <span className="font-mono text-slate-700">SCOE2401</span>) / <span className="font-mono">Student@123</span></p>
                <p>• Senior: <span className="font-mono text-slate-700">SCOE2101</span> / <span className="font-mono">Senior@123</span></p>
                <p>• Admin: <span className="font-mono text-slate-700">SCOA09</span> / <span className="font-mono">Admin@SCOA2026</span></p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In with College ERP'}
              </button>
            </form>
          )}

          {/* VIEW 2: STUDENT REGISTRATION (ERP + MOBILE + OTP) */}
          {view === 'student-register' && (
            <form onSubmit={handleStudentRegister} className="space-y-4">
              {/* Step 1: ERP & Mobile Verification */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Step 1: Institutional Verification
                  </span>
                  {studentOtpVerified && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      College ERP Number *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={studentOtpVerified}
                      placeholder="e.g. 25511566 or SCOE2420"
                      value={studentForm.erp}
                      onChange={(e) => setStudentForm({ ...studentForm, erp: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-sm uppercase font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        disabled={studentOtpVerified}
                        maxLength={10}
                        placeholder="10-digit mobile"
                        value={studentForm.mobileNumber}
                        onChange={(e) => setStudentForm({ ...studentForm, mobileNumber: e.target.value.replace(/\D/g, '') })}
                        className="w-full p-2 border border-slate-300 rounded text-sm font-mono disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {!studentOtpVerified && (
                  <div>
                    {!studentOtpSent ? (
                      <button
                        type="button"
                        onClick={handleSendStudentOtp}
                        disabled={isSendingStudentOtp || !studentForm.erp || !studentForm.mobileNumber}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isSendingStudentOtp ? 'Validating College ERP...' : 'Send Mobile Verification OTP'}
                      </button>
                    ) : (
                      <div className="space-y-2 pt-1 border-t border-slate-200">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={studentOtp}
                            onChange={(e) => setStudentOtp(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 p-2 border border-blue-400 rounded text-sm text-center font-mono tracking-widest font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyStudentOtp}
                            disabled={isVerifyingStudentOtp || studentOtp.length < 6}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {isVerifyingStudentOtp ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>

                        {studentDevOtpHint && (
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800 flex items-center justify-between">
                            <span>Demo/Test Code: <strong>{studentDevOtpHint}</strong></span>
                            <button
                              type="button"
                              onClick={handleSendStudentOtp}
                              className="text-emerald-700 underline hover:text-emerald-900 text-[11px]"
                            >
                              Resend
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Account & Profile Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditi Kulkarni"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
                    <select
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="Computer Engineering">Computer</option>
                      <option value="Information Technology">IT</option>
                      <option value="AI & Data Science">AI & DS</option>
                      <option value="Electronics & Telecom">EnTC</option>
                      <option value="Mechanical Engineering">Mechanical</option>
                      <option value="Civil Engineering">Civil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                    <input
                      type="text"
                      readOnly
                      value="First Year (FE)"
                      className="w-full p-2 border border-slate-200 rounded text-xs bg-slate-50 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Section *</label>
                    <select
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="A">Div A</option>
                      <option value="B">Div B</option>
                      <option value="C">Div C</option>
                      <option value="D">Div D</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={studentForm.confirmPassword}
                      onChange={(e) => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Primary Learning Goal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Master SPPU 2025 Pattern 60 Marks Maths 1 & BEE End-Sem"
                    value={studentForm.learningGoals}
                    onChange={(e) => setStudentForm({ ...studentForm, learningGoals: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                ✓ Student accounts are automatically provisioned with 50 initial learning credits upon OTP verification.
              </div>

              <button
                type="submit"
                disabled={isLoading || !studentOtpVerified}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating Student Account...' : 'Complete Student Registration'}
              </button>
            </form>
          )}

          {/* VIEW 3: SENIOR REGISTRATION (ERP + MOBILE + OTP + 1st YEAR PASS PROOF) */}
          {view === 'senior-register' && (
            <form onSubmit={handleSeniorRegister} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Admin Verification Required:</span> Seniors register via College ERP + Mobile OTP.
                  Account status will be <span className="font-bold text-amber-900">PENDING ADMIN VERIFICATION</span> until an authorized college admin verifies your First-Year pass certificate.
                </div>
              </div>

              {/* Step 1: Institutional ERP + Mobile Verification */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Step 1: Institutional Verification
                  </span>
                  {seniorOtpVerified && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      College ERP Number *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={seniorOtpVerified}
                      placeholder="e.g. SCOE2180"
                      value={seniorForm.erp}
                      onChange={(e) => setSeniorForm({ ...seniorForm, erp: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-sm uppercase font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      disabled={seniorOtpVerified}
                      maxLength={10}
                      placeholder="10-digit mobile"
                      value={seniorForm.mobileNumber}
                      onChange={(e) => setSeniorForm({ ...seniorForm, mobileNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-2 border border-slate-300 rounded text-sm font-mono disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {!seniorOtpVerified && (
                  <div>
                    {!seniorOtpSent ? (
                      <button
                        type="button"
                        onClick={handleSendSeniorOtp}
                        disabled={isSendingSeniorOtp || !seniorForm.erp || !seniorForm.mobileNumber}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isSendingSeniorOtp ? 'Validating College ERP...' : 'Send Mobile Verification OTP'}
                      </button>
                    ) : (
                      <div className="space-y-2 pt-1 border-t border-slate-200">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={seniorOtp}
                            onChange={(e) => setSeniorOtp(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 p-2 border border-blue-400 rounded text-sm text-center font-mono tracking-widest font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleVerifySeniorOtp}
                            disabled={isVerifyingSeniorOtp || seniorOtp.length < 6}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {isVerifyingSeniorOtp ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>

                        {seniorDevOtpHint && (
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800 flex items-center justify-between">
                            <span>Demo/Test Code: <strong>{seniorDevOtpHint}</strong></span>
                            <button
                              type="button"
                              onClick={handleSendSeniorOtp}
                              className="text-emerald-700 underline hover:text-emerald-900 text-[11px]"
                            >
                              Resend
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Senior Academic & Teaching Credentials */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Omkar Joshi"
                    value={seniorForm.name}
                    onChange={(e) => setSeniorForm({ ...seniorForm, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
                    <select
                      value={seniorForm.department}
                      onChange={(e) => setSeniorForm({ ...seniorForm, department: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="Computer Engineering">Computer</option>
                      <option value="Information Technology">IT</option>
                      <option value="AI & Data Science">AI & DS</option>
                      <option value="Electronics & Telecom">EnTC</option>
                      <option value="Mechanical Engineering">Mechanical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Current Year *</label>
                    <select
                      value={seniorForm.year}
                      onChange={(e) => setSeniorForm({ ...seniorForm, year: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="Second Year (SE)">SE (2nd Yr)</option>
                      <option value="Third Year (TE)">TE (3rd Yr)</option>
                      <option value="Final Year (BE)">BE (4th Yr)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Section *</label>
                    <select
                      value={seniorForm.section}
                      onChange={(e) => setSeniorForm({ ...seniorForm, section: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="A">Div A</option>
                      <option value="B">Div B</option>
                      <option value="C">Div C</option>
                      <option value="D">Div D</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={seniorForm.password}
                      onChange={(e) => setSeniorForm({ ...seniorForm, password: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={seniorForm.confirmPassword}
                      onChange={(e) => setSeniorForm({ ...seniorForm, confirmPassword: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </div>

                {/* Teaching Subjects - Strictly from the 10 SPPU Subjects */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Subjects You Want to Teach *
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">
                      {seniorForm.teachingSubjects.length} selected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Select from the official 10 SPPU First-Year engineering subjects:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {SPPU_SUBJECTS.map((subject) => {
                      const isSelected = seniorForm.teachingSubjects.includes(subject);
                      return (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => toggleTeachingSubject(subject)}
                          className={`text-left text-xs p-1.5 rounded border transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-medium'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate pr-1">{subject}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1st Year Clearance Proof Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First-Year Pass Certificate / Marksheet Proof *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-3 text-center transition-colors bg-slate-50">
                    <input
                      type="file"
                      id="feCertificateUpload"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="feCertificateUpload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                      <span className="text-xs font-medium text-blue-600 hover:underline">
                        Click to upload FE Marksheet
                      </span>
                      <span className="text-[11px] text-slate-400">PDF, JPG or PNG (Max 8MB)</span>
                    </label>

                    {seniorForm.certificateFileName && (
                      <div className="mt-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium truncate max-w-xs">{seniorForm.certificateFileName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Senior Bio / Experience</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Cleared FE with 9.5 SGPA. Topper in Maths 1 & BEE. Looking to help juniors solve 2025 pattern 60-mark papers."
                    value={seniorForm.bio}
                    onChange={(e) => setSeniorForm({ ...seniorForm, bio: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !seniorOtpVerified || !seniorForm.certificateFileName}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Submitting Application...' : 'Submit Senior Registration (Pending Verification)'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
