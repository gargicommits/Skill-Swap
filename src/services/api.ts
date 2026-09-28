import {
  AcademicNote,
  AdminAuditLog,
  AuthResponse,
  CreditTransaction,
  FeedbackRecord,
  LiveSession,
  NotificationItem,
  PlatformStats,
  PYQPaper,
  ReportItem,
  SafeUser,
  SPPUSubject,
} from '../types';

const TOKEN_KEY = 'skill_swap_buddy_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred while processing your request.');
  }

  return data;
}

export const api = {
  // Auth: ERP + Mobile + OTP
  sendOtp: (payload: { erp: string; mobileNumber: string; purpose?: string }) =>
    apiRequest<{ success: boolean; message: string; expiresInSeconds: number; devOtpHint?: string }>(
      '/api/auth/otp/send',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  verifyOtp: (payload: { erp: string; mobileNumber: string; otp: string; purpose?: string }) =>
    apiRequest<{ verified: boolean; message: string; verificationToken: string }>(
      '/api/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  registerStudent: (payload: any) =>
    apiRequest<AuthResponse>('/api/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerSenior: (payload: any) =>
    apiRequest<AuthResponse>('/api/auth/register/senior', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (credentials: { identifier: string; password: string }) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () =>
    apiRequest<{ user: SafeUser; unreadNotificationsCount: number }>('/api/auth/me'),

  logout: () =>
    apiRequest<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  // Seniors
  discoverSeniors: (params?: { subject?: string; department?: string; search?: string; sortBy?: string }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.set('subject', params.subject);
    if (params?.department) query.set('department', params.department);
    if (params?.search) query.set('search', params.search);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    return apiRequest<{ total: number; seniors: any[] }>(`/api/seniors/discover?${query.toString()}`);
  },

  getSeniorProfile: (id: string) => apiRequest<any>(`/api/seniors/${id}`),

  getSeniorDashboardStats: () => apiRequest<any>('/api/seniors/dashboard/stats'),

  updateSeniorProfile: (payload: { bio?: string; skills?: string[]; teachingSubjects?: SPPUSubject[]; avatarUrl?: string }) =>
    apiRequest<{ message: string; profile: any }>('/api/seniors/profile/update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Learning & Academic
  getSubjects: () => apiRequest<{ subjects: { name: SPPUSubject; notesCount: number; pyqsCount: number; sessionsCount: number; mentorsCount: number }[] }>('/api/learning/subjects'),

  getNotes: (params?: { subject?: string; unit?: number; search?: string; department?: string }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.set('subject', params.subject);
    if (params?.unit) query.set('unit', params.unit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.department) query.set('department', params.department);
    return apiRequest<{ notes: AcademicNote[] }>(`/api/learning/notes?${query.toString()}`);
  },

  viewNote: (id: string) =>
    apiRequest<{ success: boolean; viewsCount: number }>(`/api/learning/notes/${id}/view`, {
      method: 'POST',
    }),

  downloadNote: (id: string) =>
    apiRequest<{ success: boolean; downloadsCount: number }>(`/api/learning/notes/${id}/download`, {
      method: 'POST',
    }),

  uploadNote: (payload: Partial<AcademicNote>) =>
    apiRequest<{ message: string; note: AcademicNote }>('/api/learning/notes/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPYQs: (params?: {
    subject?: string;
    academicYear?: string;
    pattern?: string;
    totalMarks?: number;
    semester?: string;
    examType?: string;
    type?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.set('subject', params.subject);
    if (params?.academicYear) query.set('academicYear', params.academicYear);
    if (params?.pattern) query.set('pattern', params.pattern);
    if (params?.totalMarks) query.set('totalMarks', params.totalMarks.toString());
    if (params?.semester) query.set('semester', params.semester);
    if (params?.examType) query.set('examType', params.examType);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    return apiRequest<{ papers: PYQPaper[] }>(`/api/learning/pyqs?${query.toString()}`);
  },

  downloadPYQ: (id: string) =>
    apiRequest<{ success: boolean; downloadsCount: number }>(`/api/learning/pyqs/${id}/download`, {
      method: 'POST',
    }),

  uploadPYQ: (payload: Partial<PYQPaper>) =>
    apiRequest<{ message: string; pyq: PYQPaper }>('/api/learning/pyqs/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getLiveSessions: (params?: { subject?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.set('subject', params.subject);
    if (params?.status) query.set('status', params.status);
    return apiRequest<{ sessions: LiveSession[] }>(`/api/learning/sessions?${query.toString()}`);
  },

  createLiveSession: (payload: Partial<LiveSession>) =>
    apiRequest<{ message: string; session: LiveSession }>('/api/learning/sessions/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerSession: (id: string) =>
    apiRequest<{ message: string; meetingLink?: string; registered: boolean }>(
      `/api/learning/sessions/${id}/register`,
      { method: 'POST' }
    ),

  attendSession: (id: string) =>
    apiRequest<{ message: string; attended: boolean }>(`/api/learning/sessions/${id}/attend`, {
      method: 'POST',
    }),

  submitFeedback: (sessionId: string, payload: { rating: number; comment: string }) =>
    apiRequest<{ message: string; feedback: FeedbackRecord }>(
      `/api/learning/sessions/${sessionId}/feedback`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  submitReport: (payload: { targetType: string; targetId: string; targetTitle: string; category: string; description: string }) =>
    apiRequest<{ message: string; reportId: string }>('/api/learning/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Credits
  giveCredit: (payload: { toUserId: string; amount: number; sessionId?: string; reason?: string }) =>
    apiRequest<{ message: string; newBalance: number; transaction: CreditTransaction }>('/api/credits/give', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCreditHistory: () =>
    apiRequest<{ currentBalance: number; totalTransactions: number; transactions: CreditTransaction[] }>(
      '/api/credits/history'
    ),

  getCreditLeaderboard: () =>
    apiRequest<{ leaderboard: any[] }>('/api/credits/leaderboard'),

  // Notifications
  getNotifications: () =>
    apiRequest<{ notifications: NotificationItem[] }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllNotificationsRead: () =>
    apiRequest<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    }),

  // Admin Operations
  getAdminStats: () =>
    apiRequest<{ stats: PlatformStats; currentAdmin: { name: string; erp: string; email: string } }>(
      '/api/admin/stats'
    ),

  getPendingSeniors: () =>
    apiRequest<{ pending: any[] }>('/api/admin/seniors/pending'),

  getPendingUploads: () =>
    apiRequest<{ pendingUploads: PYQPaper[] }>('/api/admin/uploads/pending'),

  approveUpload: (id: string) =>
    apiRequest<{ message: string; paper: PYQPaper }>(`/api/admin/uploads/${id}/approve`, {
      method: 'POST',
    }),

  rejectUpload: (id: string, reason: string) =>
    apiRequest<{ message: string; paper: PYQPaper }>(`/api/admin/uploads/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  approveSenior: (id: string) =>
    apiRequest<{ message: string; user: SafeUser }>(`/api/admin/seniors/${id}/approve`, {
      method: 'POST',
    }),

  rejectSenior: (id: string, reason: string) =>
    apiRequest<{ message: string; user: SafeUser }>(`/api/admin/seniors/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  requestSeniorReupload: (id: string, reason: string) =>
    apiRequest<{ message: string; user: SafeUser }>(`/api/admin/seniors/${id}/request-reupload`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getAllUsers: () => apiRequest<{ users: SafeUser[] }>('/api/admin/users'),

  suspendUser: (id: string, reason?: string) =>
    apiRequest<{ message: string; user: SafeUser }>(`/api/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  unsuspendUser: (id: string) =>
    apiRequest<{ message: string; user: SafeUser }>(`/api/admin/users/${id}/unsuspend`, {
      method: 'POST',
    }),

  deleteNote: (id: string) =>
    apiRequest<{ message: string }>(`/api/admin/notes/${id}`, {
      method: 'DELETE',
    }),

  deletePYQ: (id: string) =>
    apiRequest<{ message: string }>(`/api/admin/pyqs/${id}`, {
      method: 'DELETE',
    }),

  cancelSession: (id: string, reason?: string) =>
    apiRequest<{ message: string }>(`/api/admin/sessions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getReports: () => apiRequest<{ reports: ReportItem[] }>('/api/admin/reports'),

  resolveReport: (id: string, resolutionNote: string, actionTaken?: string) =>
    apiRequest<{ message: string; report: ReportItem }>(`/api/admin/reports/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNote, actionTaken }),
    }),

  getAuditLogs: () => apiRequest<{ auditLogs: AdminAuditLog[] }>('/api/admin/audit-logs'),
};
