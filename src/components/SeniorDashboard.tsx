import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck,
  Award,
  Sparkles,
  Users,
  Star,
  Video,
  BookOpen,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { SPPU_SUBJECTS } from '../types';

interface SeniorDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenCredits: () => void;
}

export const SeniorDashboard: React.FC<SeniorDashboardProps> = ({ onNavigate, onOpenCredits }) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getSeniorDashboardStats();
        setStats(res);
      } catch (err) {
        console.error('Failed to load senior dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const isApproved = currentUser?.verificationStatus === 'APPROVED';
  const isPending = currentUser?.verificationStatus === 'PENDING';
  const isRejected = currentUser?.verificationStatus === 'REJECTED';
  const isReupload = currentUser?.verificationStatus === 'REUPLOAD_REQUESTED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Verification Status Alert Banner */}
      {isPending && (
        <div className="p-6 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-400/60 rounded-3xl text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-amber-950">
                  Verification Pending Admin Review
                </h3>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Pending Status
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                Your First-Year engineering pass mark sheet has been submitted for verification. An authorized
                college administrator (Anchal Singh, Gargi Bhothre, Shreya Ashtaker, or Shravani Deshmukh) is
                evaluating your credentials. Live session scheduling and notes uploading will unlock upon approval.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono bg-white/80 border border-amber-300 px-3 py-1.5 rounded-xl text-amber-900 shrink-0">
            ERP: {currentUser?.erp}
          </div>
        </div>
      )}

      {isApproved && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified SPPU Senior Mentor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Mentor Portal: {currentUser?.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Guide junior FE students through challenging SPPU syllabus units, conduct live doubt-solving sessions, and earn merit credits.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('sessions')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Video className="w-4 h-4" />
              <span>Schedule Workshop</span>
            </button>
            <button
              onClick={() => onNavigate('notes')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>
            <button
              onClick={() => onNavigate('pyqs')}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Award className="w-4 h-4" />
              <span>Upload PYQ / Bank</span>
            </button>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-900 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base text-red-900">Senior Application Rejected</h3>
            <p className="text-xs text-red-700 mt-1">
              Reason: {currentUser?.rejectionReason || 'FE clearance certificate could not be confirmed.'}
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Credits Earned</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600">
            {stats?.profile?.totalCreditsEarned ?? currentUser?.creditBalance ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Awarded by grateful juniors</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Students Helped</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">
            {stats?.profile?.studentsHelped ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Attendees & doubt learners</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Popularity Score</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-blue-700">
            {stats?.profile?.popularityScore ?? 50}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dynamic algorithmic rank</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Rating & Feedback</span>
            <Star className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold text-purple-700">
            ★ {stats?.profile?.rating ?? '5.0'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.profile?.ratingCount ?? 0} Verified Student Reviews
          </p>
        </div>
      </div>

      {/* Teaching Subjects & Hosted Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approved Teaching Subjects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Your FE Teaching Subjects</h3>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              {stats?.profile?.teachingSubjects?.length || 0} Subjects
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Syllabus subjects from the 10 SPPU engineering courses you are authorized to mentor:
          </p>

          <div className="space-y-2">
            {stats?.profile?.teachingSubjects?.map((sub: string) => (
              <div
                key={sub}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between"
              >
                <span>{sub}</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                  ✓ Verified
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* My Live Workshops */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-600" />
              <span>Workshops Conducted by You</span>
            </h3>
            {isApproved && (
              <button
                onClick={() => onNavigate('sessions')}
                className="text-xs text-emerald-700 font-bold hover:underline"
              >
                + Schedule New
              </button>
            )}
          </div>

          <div className="space-y-3">
            {!stats?.mySessions || stats.mySessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {isApproved
                  ? 'You have not scheduled any workshops yet. Click "Schedule Workshop" to invite students.'
                  : 'Workshops will be enabled once an admin verifies your 1st-year marksheet.'}
              </p>
            ) : (
              stats.mySessions.map((s: any) => (
                <div
                  key={s.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{s.title}</span>
                      <span className="px-2 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                        {s.subject}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1 flex items-center gap-3">
                      <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                      <span>• {s.registeredStudentIds?.length || 0} Registered</span>
                      <span>• {s.attendedStudentIds?.length || 0} Attended</span>
                    </div>
                  </div>

                  <a
                    href={s.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 self-start sm:self-auto shrink-0"
                  >
                    <span>Launch Meet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
