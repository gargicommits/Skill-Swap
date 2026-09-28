import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, GraduationCap, Award, Clock, UserCheck } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { currentUser, quickLoginDemo, isLoading } = useAuth();

  return (
    <div className="bg-slate-900 text-white text-xs border-b border-slate-800 px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium text-slate-300">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-white">College Demo Quick-Switch:</span>
          <span className="hidden md:inline text-slate-400">
            Click any profile to test RBAC & features instantly:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Junior Student */}
          <button
            onClick={() => quickLoginDemo('student')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              currentUser?.erp === 'SCOE2401'
                ? 'bg-blue-600 text-white font-semibold ring-1 ring-blue-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Login as Aryan Mehta (FE Junior Student, SCOE2401)"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            <span>Student (Aryan)</span>
          </button>

          {/* Approved Senior Mentor */}
          <button
            onClick={() => quickLoginDemo('senior-approved')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              currentUser?.erp === 'SCOE2101'
                ? 'bg-emerald-600 text-white font-semibold ring-1 ring-emerald-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Login as Rohan Sharma (Approved TE Senior Mentor, SCOE2101)"
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approved Senior (Rohan)</span>
          </button>

          {/* Pending Senior Mentor */}
          <button
            onClick={() => quickLoginDemo('senior-pending')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              currentUser?.erp === 'SCOE2240'
                ? 'bg-amber-600 text-white font-semibold ring-1 ring-amber-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Login as Tanmay Joshi (Pending Verification Senior, SCOE2240)"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Senior (Tanmay)</span>
          </button>

          {/* Authorized Admin 1: Anchal Singh */}
          <button
            onClick={() => quickLoginDemo('admin-anchal')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              currentUser?.erp === 'SCOA09'
                ? 'bg-purple-600 text-white font-semibold ring-1 ring-purple-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Login as Admin 1: Anchal Singh (SCOA09)"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin (Anchal - SCOA09)</span>
          </button>

          {/* Authorized Admin 2: Gargi Bhothre */}
          <button
            onClick={() => quickLoginDemo('admin-gargi')}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              currentUser?.erp === 'SCOA11'
                ? 'bg-purple-600 text-white font-semibold ring-1 ring-purple-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Login as Admin 2: Gargi Bhothre (SCOA11)"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin (Gargi)</span>
          </button>

          {/* Admin 3 & 4 dropdown/selector for space */}
          <div className="relative group inline-block">
            <button className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1">
              <span>More Admins ▾</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded shadow-lg py-1 hidden group-hover:block z-50">
              <button
                onClick={() => quickLoginDemo('admin-shreya')}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-700 flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Shreya Ashtaker (SCOA20)</span>
              </button>
              <button
                onClick={() => quickLoginDemo('admin-shravani')}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-700 flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Shravani Deshmukh (SCOA21)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
