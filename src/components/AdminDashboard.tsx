import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  AdminAuditLog,
  PlatformStats,
  ReportItem,
  SafeUser,
} from '../types';
import {
  Shield,
  Users,
  Award,
  Clock,
  BookOpen,
  FileText,
  Video,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Eye,
  Search,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  initialSubTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialSubTab = 'verifications' }) => {
  const { currentUser } = useAuth();
  const [currentSubTab, setCurrentSubTab] = useState<string>(initialSubTab);

  // Stats
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  // Senior Verifications
  const [pendingSeniors, setPendingSeniors] = useState<any[]>([]);
  const [selectedPendingSenior, setSelectedPendingSenior] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [reuploadReason, setReuploadReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showReuploadModal, setShowReuploadModal] = useState<boolean>(false);

  // Certificate Preview Modal
  const [previewCertSenior, setPreviewCertSenior] = useState<any | null>(null);

  // Users
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');

  // Content
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [allPYQs, setAllPYQs] = useState<any[]>([]);
  const [pendingUploads, setPendingUploads] = useState<any[]>([]);

  // Reports
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoadingStats(true);
    try {
      const [statsRes, pendingRes, usersRes, notesRes, pyqsRes, uploadsRes, reportsRes, auditRes] =
        await Promise.all([
          api.getAdminStats(),
          api.getPendingSeniors(),
          api.getAllUsers(),
          api.getNotes(),
          api.getPYQs(),
          api.getPendingUploads(),
          api.getReports(),
          api.getAuditLogs(),
        ]);

      setStats(statsRes.stats);
      setPendingSeniors(pendingRes.pending);
      setUsers(usersRes.users);
      setAllNotes(notesRes.notes);
      setAllPYQs(pyqsRes.papers);
      setPendingUploads(uploadsRes.pendingUploads || []);
      setReports(reportsRes.reports);
      setAuditLogs(auditRes.auditLogs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleApproveUpload = async (id: string) => {
    try {
      const res = await api.approveUpload(id);
      setActionSuccess(res.message);
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectUpload = async (id: string) => {
    const reason = prompt('Enter rejection reason for senior mentor:') || 'Content does not match SPPU 2025 syllabus pattern';
    try {
      const res = await api.rejectUpload(id, reason);
      setActionSuccess(res.message);
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveSenior = async (id: string) => {
    try {
      const res = await api.approveSenior(id);
      setActionSuccess(res.message);
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectSenior = async () => {
    if (!selectedPendingSenior) return;
    try {
      const res = await api.rejectSenior(selectedPendingSenior.id, rejectionReason);
      setActionSuccess(res.message);
      setShowRejectModal(false);
      setSelectedPendingSenior(null);
      setRejectionReason('');
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRequestReupload = async () => {
    if (!selectedPendingSenior) return;
    try {
      const res = await api.requestSeniorReupload(selectedPendingSenior.id, reuploadReason);
      setActionSuccess(res.message);
      setShowReuploadModal(false);
      setSelectedPendingSenior(null);
      setReuploadReason('');
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleSuspend = async (user: SafeUser) => {
    try {
      if (user.isSuspended) {
        await api.unsuspendUser(user.id);
        setActionSuccess(`Account for ${user.name} restored.`);
      } else {
        const reason = prompt(`Enter suspension reason for ${user.name}:`) || 'Violation of academic code of conduct';
        await api.suspendUser(user.id, reason);
        setActionSuccess(`Account for ${user.name} suspended.`);
      }
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteNote = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove note: "${title}"?`)) return;
    try {
      await api.deleteNote(id);
      setActionSuccess(`Note deleted.`);
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePYQ = async (id: string) => {
    if (!confirm(`Are you sure you want to remove this PYQ paper?`)) return;
    try {
      await api.deletePYQ(id);
      setActionSuccess(`PYQ Paper removed.`);
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;
    try {
      await api.resolveReport(selectedReport.id, resolutionNote);
      setActionSuccess(`Report resolved successfully.`);
      setSelectedReport(null);
      setResolutionNote('');
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.erp.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.mobileNumber && u.mobileNumber.includes(userSearch));
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Identity Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/40 text-purple-300 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Authorized College Administrator Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Administrator: {currentUser?.name}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            ERP: <span className="font-mono text-purple-300 font-bold">{currentUser?.erp}</span> • Institutional
            Role: Head College Platform Administrator
          </p>
        </div>

        {/* Pending approvals badge */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Pending Approvals
            </span>
            <span className="text-2xl font-black text-amber-400">
              {stats?.pendingApprovals || 0}
            </span>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Open Reports</span>
            <span className="text-2xl font-black text-red-400">{stats?.totalReports || 0}</span>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 10 Platform Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Students</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats?.totalStudents || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Seniors</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.totalSeniors || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Users</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.activeUsers || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Suspended</span>
          <p className="text-2xl font-black text-red-600 mt-1">{stats?.suspendedUsers || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Notes Published</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.totalNotes || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">PYQ Question Papers</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{stats?.totalPYQs || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Live Workshops</span>
          <p className="text-2xl font-black text-teal-600 mt-1">{stats?.totalLiveSessions || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Credit Ledger Tx</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.totalCreditTransactions || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Pending Reviews</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{stats?.pendingApprovals || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Disciplinary Open</span>
          <p className="text-2xl font-black text-red-500 mt-1">{stats?.totalReports || 0}</p>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setCurrentSubTab('verifications')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            currentSubTab === 'verifications'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Senior Verifications Queue ({pendingSeniors.length})</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('users')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            currentSubTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Roles</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('content')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            currentSubTab === 'content'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>
            Content Moderation {pendingUploads.length > 0 && `(${pendingUploads.length} Pending)`}
          </span>
        </button>

        <button
          onClick={() => setCurrentSubTab('reports')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            currentSubTab === 'reports'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Disciplinary Reports ({reports.filter((r) => r.status === 'OPEN').length})</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('audit')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            currentSubTab === 'audit'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>System Audit Logs</span>
        </button>
      </div>

      {/* SUBTAB 1: SENIOR VERIFICATIONS QUEUE */}
      {currentSubTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Pending Senior Marksheet Verifications
            </h3>
            <span className="text-xs text-slate-500">
              Only verified FE-cleared students can teach. Check mark-sheets before approving.
            </span>
          </div>

          {pendingSeniors.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-lg font-bold text-slate-900">All Senior Applications Verified!</h4>
              <p className="text-xs text-slate-500">There are no pending senior verifications at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSeniors.map((senior) => (
                <div
                  key={senior.id}
                  className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900">{senior.name}</h4>
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          ERP: {senior.erp}
                        </span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Pending Verification
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {senior.email} • {senior.department} • {senior.year} • Section {senior.section}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setPreviewCertSenior(senior)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Marksheet</span>
                      </button>

                      <button
                        onClick={() => handleApproveSenior(senior.id)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Senior</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPendingSenior(senior);
                          setShowRejectModal(true);
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPendingSenior(senior);
                          setShowReuploadModal(true);
                        }}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Re-upload</span>
                      </button>
                    </div>
                  </div>

                  {/* Teaching Subjects Applied For */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                      Applied SPPU FE Teaching Subjects ({senior.teachingSubjects?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {senior.teachingSubjects?.map((sub: string) => (
                        <span
                          key={sub}
                          className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs font-semibold"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {senior.bio && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      &ldquo;{senior.bio}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: USER ACCOUNTS & ROLES */}
      {currentSubTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">College Users Database</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search ERP, name, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Junior Students</option>
                <option value="SENIOR">Senior Mentors</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">User / ERP</th>
                  <th className="p-3">Mobile Number</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{u.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{u.erp}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-mono">{u.mobileNumber || '—'}</td>
                    <td className="p-3 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'SENIOR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.department}</td>
                    <td className="p-3 font-semibold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          u.verificationStatus === 'APPROVED'
                            ? 'text-emerald-700 font-bold'
                            : u.verificationStatus === 'PENDING'
                            ? 'text-amber-700 font-bold'
                            : 'text-red-700 font-bold'
                        }`}
                      >
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.isSuspended ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleSuspend(u)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                            u.isSuspended
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CONTENT MODERATION */}
      {currentSubTab === 'content' && (
        <div className="space-y-6">
          {/* Senior Upload Moderation Queue */}
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <span>Senior Upload Moderation Queue ({pendingUploads.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Senior uploads must be verified by an administrator before becoming visible to first-year students.
                </p>
              </div>
            </div>

            {pendingUploads.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500">
                ✓ No pending senior uploads. All materials are approved or published.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUploads.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          {paper.subject}
                        </span>
                        <span className="font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                          {paper.pattern || '2025 Pattern'} • {paper.totalMarks || 60} Marks
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {paper.type === 'QUESTION_BANK' ? 'Question Bank' : 'Question Paper'}
                        </span>
                        {paper.hasSolutions && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            ✓ Solutions Included
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{paper.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Uploaded by: <strong>{paper.uploadedBy}</strong> • {paper.academicYear} ({paper.semester} {paper.examType})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveUpload(paper.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                      >
                        Approve & Publish (+10 Credits)
                      </button>
                      <button
                        onClick={() => handleRejectUpload(paper.id)}
                        className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes Moderation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Notes Moderation ({allNotes.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {allNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{note.title}</p>
                    <p className="text-slate-500 text-[11px]">
                      {note.subject} (Unit {note.unit}) • By {note.uploaderName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id, note.title)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PYQs Moderation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">PYQ Papers ({allPYQs.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {allPYQs.map((pyq) => (
                <div
                  key={pyq.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{pyq.subject}</p>
                    <p className="text-slate-500 text-[11px]">
                      {pyq.academicYear} • {pyq.examType} ({pyq.semester})
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePYQ(pyq.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                    title="Delete PYQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SUBTAB 4: DISCIPLINARY REPORTS */}
      {currentSubTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Student Disciplinary Reports</h3>
          <p className="text-xs text-slate-500">
            Reports submitted by students regarding content accuracy, fake accounts, or platform misuse.
          </p>

          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No reports filed.</p>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Report on: {r.targetTitle} ({r.targetType})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'OPEN'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p className="text-slate-700">
                    <strong className="text-slate-800">Category:</strong> {r.category}
                  </p>
                  <p className="text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                    {r.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Filed by: {r.reporterName} ({r.reporterErp}) • {new Date(r.createdAt).toLocaleString()}
                    </span>

                    {r.status === 'OPEN' && (
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                      >
                        Resolve Report
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 5: SYSTEM AUDIT LOGS */}
      {currentSubTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Administrative Audit Trail</h3>
            <span className="text-xs text-slate-400 font-mono">Immutable Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Administrator</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {log.adminName} ({log.adminErp})
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{log.target}</td>
                    <td className="p-3 text-slate-500 font-sans text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CERTIFICATE INSPECTION MODAL */}
      {previewCertSenior && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">First-Year Marksheet Verification</h3>
              </div>
              <button onClick={() => setPreviewCertSenior(null)} className="p-1 rounded hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <p>
                  <strong className="text-slate-800">Applicant:</strong> {previewCertSenior.name} (
                  {previewCertSenior.erp})
                </p>
                <p>
                  <strong className="text-slate-800">Department:</strong> {previewCertSenior.department}
                </p>
                <p>
                  <strong className="text-slate-800">File:</strong> {previewCertSenior.certificateFileName}
                </p>
              </div>

              {/* Simulated Marksheet Preview */}
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2 bg-slate-50">
                <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">
                  SPPU First-Year Grade Statement (Sem 1 & 2)
                </h4>
                <p className="text-xs text-slate-500">
                  Clearance confirmed for SPPU 2019 / 2024 Engineering syllabus with passing credits.
                </p>
                <div className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Status: Ready for Approval
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleApproveSenior(previewCertSenior.id);
                    setPreviewCertSenior(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                >
                  Approve Senior Now
                </button>
                <button
                  onClick={() => setPreviewCertSenior(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPendingSenior && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-red-600">Reject Senior Application</h3>
            <p className="text-xs text-slate-600">
              Provide a reason for rejecting {selectedPendingSenior.name}&apos;s senior mentor application.
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Could not verify passing grade for Applied Mathematics 1 from document..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSenior}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reupload Modal */}
      {showReuploadModal && selectedPendingSenior && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-amber-700">Request Document Re-upload</h3>
            <p className="text-xs text-slate-600">
              Specify why the uploaded marksheet requires re-submission for {selectedPendingSenior.name}.
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Image was blurry; please upload clear PDF of official marksheet."
              value={reuploadReason}
              onChange={(e) => setReuploadReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowReuploadModal(false)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReupload}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Resolve Disciplinary Report</h3>
            <p className="text-xs text-slate-600">
              Enter admin findings and resolution notes for report on &ldquo;{selectedReport.targetTitle}&rdquo;.
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Content reviewed and verified compliant. Closed without sanctions."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveReport}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
