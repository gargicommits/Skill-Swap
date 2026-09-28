import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  GraduationCap,
  Sparkles,
  Search,
  BookOpen,
  FileText,
  Video,
  User,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Star,
  Award,
} from 'lucide-react';
import { SPPU_SUBJECTS } from '../types';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenCredits: () => void;
  onAwardCredits: (seniorId: string, seniorName: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenCredits,
  onAwardCredits,
}) => {
  const { currentUser } = useAuth();
  const [topSeniors, setTopSeniors] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [seniorsRes, sessionsRes, notesRes] = await Promise.all([
          api.discoverSeniors({ sortBy: 'popularity' }),
          api.getLiveSessions({ status: 'SCHEDULED' }),
          api.getNotes(),
        ]);
        setTopSeniors(seniorsRes.seniors.slice(0, 3));
        setUpcomingSessions(sessionsRes.sessions.slice(0, 2));
        setRecentNotes(notesRes.notes.slice(0, 3));
      } catch (err) {
        console.error('Failed to load student dashboard feeds:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-300 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified FE Student • {currentUser?.department || 'First Year'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'Junior Student'}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Connect with verified seniors to ace your SPPU First-Year Engineering subjects, prepare for
              In-Sem & End-Sem exams, and reward your mentors with credits.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-2xl flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Your Learning Credits
              </span>
              <div className="flex items-center gap-1.5 text-2xl font-black text-amber-300">
                <Sparkles className="w-6 h-6 fill-amber-400" />
                <span>{currentUser?.creditBalance || 0}</span>
              </div>
            </div>
            <button
              onClick={onOpenCredits}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              Give Credit
            </button>
          </div>
        </div>
      </div>

      {/* 6 Core Functional Navigation Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Academic Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div
            onClick={() => onNavigate('seniors')}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
              Find Senior Mentors
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Browse verified seniors by SPPU subject (Maths 1, Physics, Chemistry, PPS) and check ratings.
            </p>
            <div className="mt-3 text-xs font-bold text-blue-600 flex items-center gap-1">
              <span>Explore Mentors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onNavigate('notes')}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
              Handwritten Notes
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unit-wise handwritten derivations, formulas, and cheatsheets uploaded by top-ranking seniors.
            </p>
            <div className="mt-3 text-xs font-bold text-indigo-600 flex items-center gap-1">
              <span>Access Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => onNavigate('pyqs')}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-600 transition-colors">
              SPPU Question Papers & Banks
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Official SPPU papers including the revised 2025 Pattern (60 Marks), In-Sem, and Unit Question Banks.
            </p>
            <div className="mt-3 text-xs font-bold text-purple-600 flex items-center gap-1">
              <span>View Solved PYQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => onNavigate('sessions')}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
              Live Peer Workshops
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Register for interactive Google Meet problem-solving workshops led by verified seniors.
            </p>
            <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>View Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 5 */}
          <div
            onClick={onOpenCredits}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
              Skill Swap Credit System
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              &ldquo;Learn → Appreciate → Give Credit → Help Seniors Grow&rdquo;. Reward your mentors with credits.
            </p>
            <div className="mt-3 text-xs font-bold text-amber-600 flex items-center gap-1">
              <span>Award Credits & Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 6 */}
          <div
            onClick={() => onNavigate('profile')}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
              Student Profile & ERP
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              View your registered college credentials, verified department, and personal learning goals.
            </p>
            <div className="mt-3 text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>View Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Mentors & Upcoming Workshops Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Senior Mentors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Recommended Senior Mentors</span>
            </h3>
            <button
              onClick={() => onNavigate('seniors')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              View All Mentors →
            </button>
          </div>

          <div className="space-y-3">
            {topSeniors.map((senior) => (
              <div
                key={senior.id}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={senior.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=senior'}
                    alt={senior.name}
                    className="w-10 h-10 rounded-xl bg-slate-200 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900 text-xs truncate">{senior.name}</p>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        ✓ Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {senior.department} • {senior.teachingSubjects?.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" />
                    {senior.totalCredits}
                  </span>
                  <button
                    onClick={() => onAwardCredits(senior.id, senior.name)}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-100"
                  >
                    Award
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Live Workshops */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Upcoming Live Workshops</span>
            </h3>
            <button
              onClick={() => onNavigate('sessions')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              View Schedule →
            </button>
          </div>

          <div className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No upcoming workshops scheduled.</p>
            ) : (
              upcomingSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">{s.title}</span>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                      {s.subject}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Host: {s.mentorName}</span>
                    <span>{new Date(s.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
