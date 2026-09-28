import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, ShieldCheck, Mail, GraduationCap, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { SPPU_SUBJECTS, SPPUSubject } from '../types';

export const UserProfile: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [skillsStr, setSkillsStr] = useState((currentUser?.skills || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'SENIOR') {
      setMessage('Profile updated successfully.');
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const skills = skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.updateSeniorProfile({
        bio,
        skills,
      });
      setMessage('Senior profile updated successfully.');
      await refreshUser();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">User Account & Academic Profile</h1>
        <p className="text-slate-500 text-xs mt-1">
          Your college records, verification status, and platform identity.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header Profile Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100">
          <img
            src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=profile'}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {currentUser.verificationStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {currentUser.department} • {currentUser.year} • Section {currentUser.section}
            </p>
          </div>
        </div>

        {/* College Immutable Credentials */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Institutional Identifiers (Protected)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                College ERP Number
              </span>
              <span className="text-sm font-mono font-bold text-slate-900">{currentUser.erp}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Registered Mobile (Verified)
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 truncate block">
                {currentUser.mobileNumber || '—'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Credit Balance</span>
              <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {currentUser.creditBalance} Credits
              </span>
            </div>
          </div>
        </div>

        {/* Editable fields for Senior */}
        {currentUser.role === 'SENIOR' && (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Senior Mentorship Profile
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mentor Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your teaching style, SGPA achievements, or subject advice..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Skills & Strengths (comma-separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="e.g. Calculus, Python, Mechanics, Circuit Analysis"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
