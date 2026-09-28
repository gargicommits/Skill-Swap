import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreditTransaction } from '../types';
import { Sparkles, Trophy, History, Send, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSeniorId?: string;
  preselectedSeniorName?: string;
  sessionId?: string;
  sessionTitle?: string;
}

export const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  preselectedSeniorId,
  preselectedSeniorName,
  sessionId,
  sessionTitle,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'award' | 'history' | 'leaderboard'>('award');

  // Award State
  const [seniorsList, setSeniorsList] = useState<{ id: string; name: string; department: string }[]>([]);
  const [selectedSeniorId, setSelectedSeniorId] = useState<string>(preselectedSeniorId || '');
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History & Leaderboard State
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  useEffect(() => {
    if (preselectedSeniorId) {
      setSelectedSeniorId(preselectedSeniorId);
    }
  }, [preselectedSeniorId]);

  useEffect(() => {
    if (isOpen) {
      loadSeniors();
      if (activeTab === 'history') loadHistory();
      if (activeTab === 'leaderboard') loadLeaderboard();
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, activeTab]);

  const loadSeniors = async () => {
    try {
      const data = await api.discoverSeniors();
      setSeniorsList(
        data.seniors.map((s) => ({
          id: s.id,
          name: s.name,
          department: s.department,
        }))
      );
      if (!selectedSeniorId && data.seniors.length > 0) {
        setSelectedSeniorId(data.seniors[0].id);
      }
    } catch {
      // ignore
    }
  };

  const loadHistory = async () => {
    setIsLoadingData(true);
    try {
      const res = await api.getCreditHistory();
      setHistory(res.transactions);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadLeaderboard = async () => {
    setIsLoadingData(true);
    try {
      const res = await api.getCreditLeaderboard();
      setLeaderboard(res.leaderboard);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSendCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage('Please log in to award credits.');
      return;
    }

    if (!selectedSeniorId) {
      setErrorMessage('Please select a senior mentor.');
      return;
    }

    if (selectedSeniorId === currentUser.id) {
      setErrorMessage('Security Rule: You cannot transfer credits to yourself.');
      return;
    }

    if (amount <= 0 || amount > currentUser.creditBalance) {
      setErrorMessage(`Insufficient credit balance. You have ${currentUser.creditBalance} credits.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.giveCredit({
        toUserId: selectedSeniorId,
        amount,
        sessionId: sessionId || undefined,
        reason:
          reason ||
          (sessionTitle ? `Attended live session: "${sessionTitle}"` : 'Outstanding peer learning mentorship'),
      });

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSuccessMessage(res.message);
      setReason('');
      await refreshUser();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to transfer credits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header with Philosophy */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Peer Recognition Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold">Skill Swap Credit System</h2>
          <p className="text-blue-100 text-sm mt-1">
            &ldquo;Learn → Appreciate → Give Credit → Help Seniors Grow&rdquo;
          </p>

          {/* Current balance badge */}
          {currentUser && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold">
              <span>Your Available Balance:</span>
              <span className="text-amber-300 font-bold text-sm">
                {currentUser.creditBalance} Credits
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-sm">
          <button
            onClick={() => setActiveTab('award')}
            className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'award'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Award Credit</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transaction Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'leaderboard'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Top Mentors</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">{successMessage}</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  The senior mentor has been credited and notified.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: AWARD CREDIT */}
          {activeTab === 'award' && (
            <form onSubmit={handleSendCredit} className="space-y-4">
              {!currentUser && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>Please sign in with your student credentials to award credits.</span>
                </div>
              )}

              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Recipient Senior Mentor
                </label>
                {preselectedSeniorName ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium flex items-center justify-between">
                    <span>{preselectedSeniorName}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      ✓ Verified Senior
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedSeniorId}
                    onChange={(e) => setSelectedSeniorId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select an approved senior mentor...</option>
                    {seniorsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Linked Session Info */}
              {sessionTitle && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                  <span className="font-semibold">Associated Session:</span> {sessionTitle}
                </div>
              )}

              {/* Amount Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Credit Amount
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[5, 10, 15, 20].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${
                        amount === val
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {val} Credits
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">Custom amount:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-24 p-1.5 border border-slate-300 rounded text-sm text-center font-bold"
                  />
                  <span className="text-xs text-slate-400">(Max 50 per transfer)</span>
                </div>
              </div>

              {/* Reason / Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Appreciation Message / Reason
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Cleared my doubts on SPPU Maths 1 Eigenvalues; great explanation!"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !currentUser}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {isSubmitting
                      ? 'Processing Transfer...'
                      : `Transfer ${amount} Credits to Senior`}
                  </span>
                </button>
                <p className="text-center text-xs text-slate-400 mt-2">
                  Transactions are logged permanently on the college server ledger.
                </p>
              </div>
            </form>
          )}

          {/* TAB 2: TRANSACTION LEDGER */}
          {activeTab === 'history' && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {isLoadingData ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Loading secure transaction logs...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No credit transactions recorded yet.
                </div>
              ) : (
                history.map((tx) => {
                  const isSender = tx.fromUserId === currentUser?.id;
                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              isSender
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isSender ? 'Sent' : 'Received'}
                          </span>
                          <span>
                            {isSender ? `To: ${tx.toUserName}` : `From: ${tx.fromUserName}`}
                          </span>
                        </div>
                        <p className="text-slate-600">{tx.reason}</p>
                        <p className="text-slate-400 text-[10px]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-bold shrink-0 ${
                          isSender ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {isSender ? `-${tx.amount}` : `+${tx.amount}`} Credits
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {isLoadingData ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Loading mentor rankings...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No verified mentors ranked yet.
                </div>
              ) : (
                leaderboard.map((mentor, idx) => (
                  <div
                    key={mentor.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-900 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{mentor.name}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                            ✓ Verified
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs">
                          {mentor.department} • {mentor.studentsHelped} Students Guided
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-blue-700 font-bold text-sm">
                        {mentor.totalCredits} Credits
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        ★ {mentor.rating} ({mentor.ratingCount})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
