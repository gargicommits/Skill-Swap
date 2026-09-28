import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LiveSession, SPPU_SUBJECTS, SPPUSubject } from '../types';
import {
  Video,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ExternalLink,
  Plus,
  Sparkles,
  Star,
  X,
  AlertCircle,
  Lock,
  Flag,
} from 'lucide-react';

interface LiveSessionsSectionProps {
  onAwardCredits: (seniorId: string, seniorName: string, sessionId?: string, sessionTitle?: string) => void;
  onReport: (sessionId: string, title: string) => void;
}

export const LiveSessionsSection: React.FC<LiveSessionsSectionProps> = ({
  onAwardCredits,
  onReport,
}) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [formSubject, setFormSubject] = useState<SPPUSubject>(SPPU_SUBJECTS[0]);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formLink, setFormLink] = useState<string>('https://meet.google.com/sppu-peer-live');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Feedback Modal State
  const [feedbackSession, setFeedbackSession] = useState<LiveSession | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLiveSessions({
        subject: selectedSubject || undefined,
        status: selectedStatus || undefined,
      });
      setSessions(res.sessions);
    } catch (err: any) {
      console.error('Failed to load live sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedSubject, selectedStatus]);

  const handleRegister = async (sessionId: string) => {
    if (!currentUser) {
      alert('Please log in with your student account to register for this session.');
      return;
    }
    try {
      const res = await api.registerSession(sessionId);
      alert(res.message);
      await fetchSessions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAttend = async (sessionId: string) => {
    try {
      const res = await api.attendSession(sessionId);
      alert(res.message);
      await fetchSessions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) {
      setScheduleError('Please fill in session title and date.');
      return;
    }

    setIsSubmitting(true);
    setScheduleError(null);

    try {
      await api.createLiveSession({
        subject: formSubject,
        title: formTitle.trim(),
        description: formDesc.trim(),
        scheduledAt: new Date(formDate).toISOString(),
        durationMinutes: formDuration,
        maxParticipants: formCapacity,
        meetingLink: formLink.trim(),
      });

      setShowScheduleModal(false);
      setFormTitle('');
      setFormDesc('');
      await fetchSessions();
    } catch (err: any) {
      setScheduleError(err.message || 'Failed to schedule session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSession) return;

    setIsSubmittingFeedback(true);
    try {
      await api.submitFeedback(feedbackSession.id, {
        rating: feedbackRating,
        comment: feedbackComment.trim() || 'Great session!',
      });
      alert('Thank you! Your feedback has been recorded.');
      setFeedbackSession(null);
      setFeedbackComment('');
      await fetchSessions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const isApprovedSenior =
    currentUser?.role === 'SENIOR' && currentUser?.verificationStatus === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Video className="w-4 h-4 text-emerald-600" />
            <span>Interactive Peer Mentorship</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Peer Learning Workshops
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Real-time interactive group sessions conducted by approved seniors. Meeting links are secured and only visible to registered students.
          </p>
        </div>

        {isApprovedSenior && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Live Workshop</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Subject Filter (10 SPPU Subjects) */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 min-w-48"
          >
            <option value="">All 10 SPPU Subjects</option>
            {SPPU_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">All Sessions</option>
            <option value="SCHEDULED">Upcoming Scheduled</option>
            <option value="COMPLETED">Completed Workshops</option>
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading live peer workshops...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Workshops Scheduled</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Check back later or ask a senior mentor in the Find Seniors section to schedule a session.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const isRegistered = currentUser && session.registeredStudentIds?.includes(currentUser.id);
            const isAttended = currentUser && session.attendedStudentIds?.includes(currentUser.id);
            const isHost = currentUser && session.mentorId === currentUser.id;

            return (
              <div
                key={session.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg truncate">
                      {session.subject}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        session.status === 'SCHEDULED'
                          ? 'bg-blue-100 text-blue-800'
                          : session.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-2">
                    {session.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {session.description || 'Interactive problem-solving & SPPU previous year question breakdown.'}
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(session.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.durationMinutes}m)</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-slate-600">
                      <span className="truncate">
                        Host: <strong className="text-slate-800">{session.mentorName}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{session.registeredStudentIds?.length || 0} / {session.maxParticipants}</span>
                      </span>
                    </div>
                  </div>

                  {/* Security Rule Protected Link */}
                  <div className="mt-3">
                    {isRegistered || isHost ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                        <span className="font-semibold truncate">
                          Meeting Link: {session.meetingLink || 'Available in session'}
                        </span>
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ml-2"
                        >
                          <span>Join</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Meeting link unlocks upon registration</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    {session.status === 'SCHEDULED' && !isHost && (
                      <button
                        onClick={() => handleRegister(session.id)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                          isRegistered
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRegistered ? 'Registered (Click to cancel)' : 'Register for Free'}</span>
                      </button>
                    )}

                    {isRegistered && !isAttended && (
                      <button
                        onClick={() => handleAttend(session.id)}
                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-bold transition-colors"
                        title="Confirm you attended this session"
                      >
                        Mark Attended
                      </button>
                    )}

                    {/* Give Credit Trigger */}
                    {!isHost && (
                      <button
                        onClick={() =>
                          onAwardCredits(
                            session.mentorId,
                            session.mentorName,
                            session.id,
                            session.title
                          )
                        }
                        className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        title="Give Credit to Senior"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Give Credit</span>
                      </button>
                    )}

                    <button
                      onClick={() => onReport(session.id, session.title)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Report Session"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Feedback button if attended */}
                  {isAttended && (
                    <button
                      onClick={() => setFeedbackSession(session)}
                      className="w-full py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 text-purple-600" />
                      <span>Leave Session Feedback & Rating</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Live Workshop Modal (Approved Seniors only) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-emerald-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-white" />
                <h3 className="font-bold text-lg">Schedule SPPU Peer Workshop</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-full hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              {scheduleError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              {/* Subject: Strictly 10 SPPU engineering subjects */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  SPPU Subject (Strict 10 Curriculum Subjects) *
                </label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value as SPPUSubject)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {SPPU_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Workshop Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maths 1: Unit 3 Differential Calculus Marathon & Doubt Solving"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Session Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What topics will be covered? Formulas, previous year questions, or derivations?"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                    <option value={120}>120 Minutes (2 Hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Secure Meeting Link (Google Meet / Zoom) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/..."
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  🔒 Note: Protected by backend authorization. Unregistered students cannot view this link.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm Workshop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-purple-700 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Rate & Review Workshop</h3>
              <button onClick={() => setFeedbackSession(null)} className="p-1 rounded-full hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Workshop Title:</p>
                <p className="text-sm font-bold text-slate-900">{feedbackSession.title}</p>
                <p className="text-xs text-slate-600">Conducted by: {feedbackSession.mentorName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`p-2 rounded-lg transition-colors ${
                        feedbackRating >= star ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{feedbackRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Your Comment / Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="How did the senior explain the concepts? Were doubts resolved?"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackSession(null)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
