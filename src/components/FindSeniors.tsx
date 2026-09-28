import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SPPU_SUBJECTS, SPPUSubject } from '../types';
import {
  Search,
  Filter,
  Award,
  Sparkles,
  Star,
  Users,
  Calendar,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  X,
  Send,
  Flag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FindSeniorsProps {
  onAwardCredits: (seniorId: string, seniorName: string) => void;
  onReport: (seniorId: string, seniorName: string) => void;
}

export const FindSeniors: React.FC<FindSeniorsProps> = ({ onAwardCredits, onReport }) => {
  const { currentUser } = useAuth();
  const [seniors, setSeniors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity');

  // Senior Detail Modal
  const [activeSenior, setActiveSenior] = useState<any | null>(null);

  const fetchSeniors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.discoverSeniors({
        subject: selectedSubject || undefined,
        department: selectedDept || undefined,
        search: searchQuery || undefined,
        sortBy,
      });
      setSeniors(res.seniors);
    } catch (err: any) {
      setError(err.message || 'Failed to load senior mentors.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeniors();
  }, [selectedSubject, selectedDept, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSeniors();
  };

  const openSeniorDetails = async (id: string) => {
    try {
      const data = await api.getSeniorProfile(id);
      setActiveSenior(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verified Peer Mentors Network</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Senior Mentors for SPPU First-Year
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-2xl">
          Connect with vetted 2nd, 3rd, and 4th-year students who cleared SPPU FE exams with top marks.
          Learn concepts, get doubt clearance, and reward them with credits.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search mentor by name, skill (e.g. Python, Calculus), or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 10 SPPU Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All 10 SPPU Subjects</option>
              {SPPU_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Departments</option>
              <option value="Computer Engineering">Computer Engg</option>
              <option value="Information Technology">Information Tech</option>
              <option value="AI & Data Science">AI & Data Science</option>
              <option value="Electronics & Telecom">EnTC</option>
              <option value="Mechanical Engineering">Mechanical</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="popularity">Sort by: Popularity Score</option>
              <option value="credits">Sort by: Total Credits</option>
              <option value="rating">Sort by: Star Rating</option>
              <option value="students">Sort by: Students Helped</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Subject Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Filter:</span>
          {SPPU_SUBJECTS.slice(0, 5).map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(selectedSubject === subject ? '' : subject)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                selectedSubject === subject
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {subject}
            </button>
          ))}
          {selectedSubject && (
            <button
              onClick={() => setSelectedSubject('')}
              className="text-[11px] text-red-600 hover:underline font-semibold ml-2"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Seniors Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Searching verified senior mentors across departments...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          {error}
        </div>
      ) : seniors.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Verified Seniors Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            No mentors match the selected subject or department filters. Try clearing filters or searching
            by subject name.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seniors.map((senior) => (
            <div
              key={senior.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Info */}
                <div className="flex items-start gap-3">
                  <img
                    src={senior.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=senior'}
                    alt={senior.name}
                    className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 truncate">{senior.name}</h3>
                      <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {senior.department} • {senior.year}
                    </p>
                  </div>
                </div>

                {/* Popularity & Metrics Row */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Popularity
                    </span>
                    <span className="text-sm font-extrabold text-blue-700">
                      {senior.popularityScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Credits
                    </span>
                    <span className="text-sm font-extrabold text-amber-600 flex items-center justify-center gap-0.5">
                      <Sparkles className="w-3 h-3" />
                      {senior.totalCredits}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Guided
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      {senior.studentsHelped}
                    </span>
                  </div>
                </div>

                {/* Bio snippet */}
                {senior.bio && (
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    &ldquo;{senior.bio}&rdquo;
                  </p>
                )}

                {/* Teaching Subjects (Strict 10 SPPU Subjects) */}
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Teaches ({senior.teachingSubjects?.length || 0} FE Subjects):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {senior.teachingSubjects?.map((sub: string) => (
                      <span
                        key={sub}
                        className="bg-blue-50 text-blue-800 border border-blue-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => openSeniorDetails(senior.id)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onAwardCredits(senior.id, senior.name)}
                  className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                  title="Award Credits to Senior"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Award</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Senior Profile Detail Modal */}
      {activeSenior && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white relative">
              <button
                onClick={() => setActiveSenior(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <img
                  src={activeSenior.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=senior'}
                  alt={activeSenior.name}
                  className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/30 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{activeSenior.name}</h2>
                    <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Senior
                    </span>
                  </div>
                  <p className="text-blue-100 text-xs mt-0.5">
                    {activeSenior.department} • {activeSenior.year} • Div {activeSenior.section}
                  </p>
                  <p className="text-blue-200 text-xs mt-1 font-mono">
                    College ERP: {activeSenior.erp}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-center border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Popularity</span>
                  <p className="text-base font-extrabold text-blue-700">{activeSenior.popularityScore}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Credits</span>
                  <p className="text-base font-extrabold text-amber-600">{activeSenior.totalCreditsEarned}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Students Helped</span>
                  <p className="text-base font-extrabold text-emerald-600">{activeSenior.studentsHelped}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Rating</span>
                  <p className="text-base font-extrabold text-purple-700">
                    ★ {activeSenior.rating} ({activeSenior.ratingCount})
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">About Mentor</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {activeSenior.bio || 'Experienced senior mentor ready to guide juniors.'}
                </p>
              </div>

              {/* Teaching Subjects */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  SPPU First-Year Teaching Subjects
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeSenior.teachingSubjects?.map((sub: string) => (
                    <span
                      key={sub}
                      className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills */}
              {activeSenior.skills?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Skills & Strengths
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSenior.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduled Live Sessions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Live Workshops by {activeSenior.name}
                </h4>
                {activeSenior.liveSessions?.length === 0 ? (
                  <p className="text-xs text-slate-400">No scheduled sessions at this moment.</p>
                ) : (
                  <div className="space-y-2">
                    {activeSenior.liveSessions?.map((s: any) => (
                      <div
                        key={s.id}
                        className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{s.title}</p>
                          <p className="text-slate-500">
                            {s.subject} • {new Date(s.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.status === 'SCHEDULED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Feedback */}
              {activeSenior.feedbackList?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Recent Junior Feedback
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {activeSenior.feedbackList.map((fb: any) => (
                      <div key={fb.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{fb.studentName}</span>
                          <span className="text-amber-600 font-bold">★ {fb.rating} / 5</span>
                        </div>
                        <p className="text-slate-600">{fb.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const s = activeSenior;
                  setActiveSenior(null);
                  onReport(s.id, s.name);
                }}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Mentor</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSenior(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const s = activeSenior;
                    setActiveSenior(null);
                    onAwardCredits(s.id, s.name);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Award Credits</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
