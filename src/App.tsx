import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DemoSwitcher } from './components/DemoSwitcher';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { SeniorDashboard } from './components/SeniorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { FindSeniors } from './components/FindSeniors';
import { NotesSection } from './components/NotesSection';
import { PYQSection } from './components/PYQSection';
import { LiveSessionsSection } from './components/LiveSessionsSection';
import { UserProfile } from './components/UserProfile';
import { CreditModal } from './components/CreditModal';
import { AuthModals } from './components/AuthModals';
import { ReportModal } from './components/ReportModal';
import { GraduationCap, ShieldCheck, Heart, Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'student-register' | 'senior-register'>('login');

  const [creditModalOpen, setCreditModalOpen] = useState<boolean>(false);
  const [creditSeniorId, setCreditSeniorId] = useState<string | undefined>();
  const [creditSeniorName, setCreditSeniorName] = useState<string | undefined>();
  const [creditSessionId, setCreditSessionId] = useState<string | undefined>();
  const [creditSessionTitle, setCreditSessionTitle] = useState<string | undefined>();

  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportTargetType, setReportTargetType] = useState<'SENIOR' | 'NOTE' | 'SESSION' | 'OTHER'>('SENIOR');
  const [reportTargetId, setReportTargetId] = useState<string>('');
  const [reportTargetTitle, setReportTargetTitle] = useState<string>('');

  // Synchronize default tab on auth state change
  useEffect(() => {
    if (!currentUser) {
      if (currentTab.includes('dashboard') || currentTab.includes('admin') || currentTab === 'profile') {
        setCurrentTab('landing');
      }
    } else {
      if (currentTab === 'landing') {
        if (currentUser.role === 'ADMIN') setCurrentTab('admin-dashboard');
        else if (currentUser.role === 'SENIOR') setCurrentTab('senior-dashboard');
        else setCurrentTab('student-dashboard');
      }
    }
  }, [currentUser]);

  const handleOpenAuth = (view: 'login' | 'student-register' | 'senior-register' = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const handleOpenCreditModal = (
    seniorId?: string,
    seniorName?: string,
    sessionId?: string,
    sessionTitle?: string
  ) => {
    setCreditSeniorId(seniorId);
    setCreditSeniorName(seniorName);
    setCreditSessionId(sessionId);
    setCreditSessionTitle(sessionTitle);
    setCreditModalOpen(true);
  };

  const handleOpenReport = (type: 'SENIOR' | 'NOTE' | 'SESSION' | 'OTHER', id: string, title: string) => {
    setReportTargetType(type);
    setReportTargetId(id);
    setReportTargetTitle(title);
    setReportModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4">
        <GraduationCap className="w-12 h-12 text-blue-400 animate-bounce" />
        <h2 className="text-lg font-bold">Skill Swap Buddy System</h2>
        <p className="text-xs text-slate-400">Verifying secure college session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Demo Switcher for Evaluation */}
      <DemoSwitcher />

      {/* Main Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        onOpenCredits={() => handleOpenCreditModal()}
      />

      {/* Primary Page Content */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onStartLearning={() => {
              if (currentUser) {
                setCurrentTab(currentUser.role === 'ADMIN' ? 'admin-dashboard' : currentUser.role === 'SENIOR' ? 'senior-dashboard' : 'student-dashboard');
              } else {
                handleOpenAuth('student-register');
              }
            }}
            onBecomeSenior={() => {
              if (currentUser) {
                setCurrentTab(currentUser.role === 'ADMIN' ? 'admin-dashboard' : 'senior-dashboard');
              } else {
                handleOpenAuth('senior-register');
              }
            }}
            onExploreNotes={() => setCurrentTab('notes')}
            onExploreSeniors={() => setCurrentTab('seniors')}
          />
        )}

        {currentTab === 'student-dashboard' && (
          <StudentDashboard
            onNavigate={setCurrentTab}
            onOpenCredits={() => handleOpenCreditModal()}
            onAwardCredits={(id, name) => handleOpenCreditModal(id, name)}
          />
        )}

        {currentTab === 'senior-dashboard' && (
          <SeniorDashboard
            onNavigate={setCurrentTab}
            onOpenCredits={() => handleOpenCreditModal()}
          />
        )}

        {/* Admin Views */}
        {(currentTab === 'admin-dashboard' ||
          currentTab === 'admin-verifications' ||
          currentTab === 'admin-users' ||
          currentTab === 'admin-content' ||
          currentTab === 'admin-reports' ||
          currentTab === 'admin-audit') && (
          <AdminDashboard
            initialSubTab={
              currentTab === 'admin-verifications'
                ? 'verifications'
                : currentTab === 'admin-users'
                ? 'users'
                : currentTab === 'admin-content'
                ? 'content'
                : currentTab === 'admin-reports'
                ? 'reports'
                : currentTab === 'admin-audit'
                ? 'audit'
                : 'verifications'
            }
          />
        )}

        {/* Shared Academic Resource Views */}
        {currentTab === 'seniors' && (
          <FindSeniors
            onAwardCredits={(id, name) => handleOpenCreditModal(id, name)}
            onReport={(id, name) => handleOpenReport('SENIOR', id, name)}
          />
        )}

        {currentTab === 'notes' && (
          <NotesSection
            onReport={(id, title) => handleOpenReport('NOTE', id, title)}
          />
        )}

        {currentTab === 'pyqs' && (
          <PYQSection
            onReport={(id, title) => handleOpenReport('NOTE', id, title)}
          />
        )}

        {currentTab === 'sessions' && (
          <LiveSessionsSection
            onAwardCredits={(seniorId, seniorName, sessId, sessTitle) =>
              handleOpenCreditModal(seniorId, seniorName, sessId, sessTitle)
            }
            onReport={(id, title) => handleOpenReport('SESSION', id, title)}
          />
        )}

        {currentTab === 'profile' && <UserProfile />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">
                Skill Swap Buddy System
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-semibold">
                Savitribai Phule Pune University (SPPU)
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-600">Platform Security:</span>
              <span className="font-semibold text-emerald-700">✓ Role-Based Access Control</span>
              <span className="font-semibold text-blue-700">✓ 10 SPPU Engineering Subjects</span>
              <span className="font-semibold text-purple-700">✓ 4 Authorized Admins</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>
              Designed strictly for verified college students and senior peer mentors.
              Credit recognition ledger: &ldquo;Learn → Appreciate → Give Credit → Help Seniors Grow&rdquo;.
            </p>
            <p className="flex items-center gap-1">
              <span>Admin Desk: Anchal Singh, Gargi Bhothre, Shreya Ashtaker, Shravani Deshmukh</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModals
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
      />

      <CreditModal
        isOpen={creditModalOpen}
        onClose={() => {
          setCreditModalOpen(false);
          setCreditSeniorId(undefined);
          setCreditSeniorName(undefined);
          setCreditSessionId(undefined);
          setCreditSessionTitle(undefined);
        }}
        preselectedSeniorId={creditSeniorId}
        preselectedSeniorName={creditSeniorName}
        sessionId={creditSessionId}
        sessionTitle={creditSessionTitle}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType={reportTargetType}
        targetId={reportTargetId}
        targetTitle={reportTargetTitle}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
