import React from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  BookOpen,
  FileText,
  Video,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  Users,
} from 'lucide-react';
import { SPPU_SUBJECTS } from '../types';

interface LandingPageProps {
  onStartLearning: () => void;
  onBecomeSenior: () => void;
  onExploreNotes: () => void;
  onExploreSeniors: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartLearning,
  onBecomeSenior,
  onExploreNotes,
  onExploreSeniors,
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official College Peer-Learning Network • SPPU FE Syllabus</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Learn from Seniors.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Share Knowledge.
            </span>{' '}
            Grow Together.
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            Skill Swap Buddy is a secure, role-verified academic platform connecting junior first-year
            students with verified senior mentors for curated notes, solved PYQs, live problem-solving,
            and merit-based credit rewards.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartLearning}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 text-sm"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onBecomeSenior}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Become a Senior Mentor</span>
            </button>
          </div>

          {/* Verification Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ Verified Student</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ Verified Senior</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>✓ Admin Verified (SCOA)</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>🔒 ERP Identifier Protection</span>
            </span>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            Built for Academic Excellence
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Security & Trust First, then Peer Learning
          </h3>
          <p className="text-slate-600 text-sm mt-2">
            No random unverified accounts. Every senior undergoes administrative scrutiny of their 1st-year
            clearance record.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Strict Senior Verification</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Seniors must submit their official first-year marksheet. Platform administrators manually
              verify credentials before granting teaching privileges.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Credit-Based Recognition</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              &ldquo;Learn → Appreciate → Give Credit → Help Seniors Grow&rdquo;. Juniors reward seniors for
              mentorship. Immutable server transactions prevent fraud.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Video className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Live Peer Workshops</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Interactive Google Meet sessions scheduled by seniors. Meeting links remain secure and are
              only revealed to registered college attendees.
            </p>
          </div>
        </div>
      </section>

      {/* FIXED 10 SPPU FIRST-YEAR ENGINEERING SUBJECTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <span>Standardized Academic Policy</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                10 Fixed SPPU First-Year Engineering Subjects
              </h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xl">
                Seniors can only register, teach, and upload content strictly across these 10 university
                curriculum subjects for maximum academic focus.
              </p>
            </div>
            <button
              onClick={onExploreSeniors}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
            >
              Browse Mentors for these Subjects →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SPPU_SUBJECTS.map((subject, index) => (
              <div
                key={subject}
                className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl hover:border-blue-500/50 transition-colors group"
              >
                <span className="text-[11px] font-mono text-blue-400 font-bold block mb-1">
                  Subject 0{index + 1}
                </span>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                  {subject}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick CTAs for Academic Resources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Handwritten & Unit-Wise Notes</h4>
            <p className="text-slate-600 text-sm">
              Access unit 1 to 6 chapter summaries, numerical shortcuts, and formula cheatsheets prepared by
              high-SGPA senior toppers.
            </p>
            <button
              onClick={onExploreNotes}
              className="font-bold text-xs text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Explore Notes Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/80 rounded-2xl p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Previous Year Papers (PYQs)</h4>
            <p className="text-slate-600 text-sm">
              Filter by Academic Year (2023-24, 2022-23), Semester, and In-Sem / End-Sem exam categories for
              SPPU examination prep.
            </p>
            <button
              onClick={onExploreNotes}
              className="font-bold text-xs text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Access Solved PYQs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
