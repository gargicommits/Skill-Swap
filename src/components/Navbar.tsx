import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Bell,
  LogOut,
  User,
  Search,
  BookOpen,
  FileText,
  Video,
  ShieldAlert,
  Menu,
  X,
  Check,
} from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (view?: 'login' | 'student-register' | 'senior-register') => void;
  onOpenCredits: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenCredits,
}) => {
  const { currentUser, logout, notifications, unreadCount, refreshNotifications } = useAuth();
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      await refreshNotifications();
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await refreshNotifications();
    } catch {
      // ignore
    }
  };

  // Build role-specific navigation tabs
  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { id: 'landing', label: 'Home' },
        { id: 'seniors', label: 'Find Seniors', icon: Search },
        { id: 'notes', label: 'Notes', icon: BookOpen },
        { id: 'pyqs', label: 'PYQs', icon: FileText },
        { id: 'sessions', label: 'Live Sessions', icon: Video },
      ];
    }

    if (currentUser.role === 'ADMIN') {
      return [
        { id: 'admin-dashboard', label: 'Admin Desk' },
        { id: 'admin-verifications', label: 'Senior Approvals' },
        { id: 'admin-users', label: 'Users & Roles' },
        { id: 'admin-content', label: 'Content' },
        { id: 'admin-reports', label: 'Reports' },
        { id: 'admin-audit', label: 'Audit Logs' },
        { id: 'notes', label: 'Notes Hub' },
        { id: 'pyqs', label: 'PYQ Hub' },
        { id: 'sessions', label: 'Sessions' },
      ];
    }

    if (currentUser.role === 'SENIOR') {
      return [
        { id: 'senior-dashboard', label: 'Mentor Dashboard' },
        { id: 'seniors', label: 'Discover Peers' },
        { id: 'notes', label: 'SPPU Notes' },
        { id: 'pyqs', label: 'PYQ Papers' },
        { id: 'sessions', label: 'Live Sessions' },
        { id: 'profile', label: 'My Teaching Profile' },
      ];
    }

    // Default: STUDENT
    return [
      { id: 'student-dashboard', label: 'Dashboard' },
      { id: 'seniors', label: 'Find a Senior' },
      { id: 'notes', label: 'Notes' },
      { id: 'pyqs', label: 'Previous Year Papers' },
      { id: 'sessions', label: 'Live Sessions' },
      { id: 'profile', label: 'My Profile' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => {
              if (currentUser?.role === 'ADMIN') onSelectTab('admin-dashboard');
              else if (currentUser?.role === 'SENIOR') onSelectTab('senior-dashboard');
              else if (currentUser?.role === 'STUDENT') onSelectTab('student-dashboard');
              else onSelectTab('landing');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Skill Swap <span className="text-blue-600">Buddy</span>
                </span>
                <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  SPPU
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5">
                College Peer-Learning System
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  currentTab === link.id
                    ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2.5">
            {/* Credit Balance Counter (Students & Seniors) */}
            {currentUser && (
              <button
                onClick={onOpenCredits}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full text-xs font-bold text-amber-900 transition-colors shadow-2xs"
                title="View Credit Balance & Award Credits"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>{currentUser.creditBalance}</span>
                <span className="hidden sm:inline text-[11px] text-amber-700 font-normal">
                  Credits
                </span>
              </button>
            )}

            {/* Notifications Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-xs">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded text-[10px]">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-blue-300 hover:text-white underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition-colors ${
                              !n.isRead ? 'bg-blue-50/60 font-medium' : 'bg-white text-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-slate-900">{n.title}</p>
                              {!n.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="text-blue-600 hover:text-blue-800 p-0.5"
                                  title="Mark as read"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                      <span>{currentUser.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      {currentUser.role === 'ADMIN' && '🛡️ Administrator'}
                      {currentUser.role === 'SENIOR' && '⭐ Senior Mentor'}
                      {currentUser.role === 'STUDENT' && '🎓 FE Student'}
                    </div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-lg mb-1">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                        <span>ERP:</span>
                        <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {currentUser.erp}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Status:</span>
                        <span
                          className={`font-semibold ${
                            currentUser.verificationStatus === 'APPROVED'
                              ? 'text-emerald-700'
                              : currentUser.verificationStatus === 'PENDING'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {currentUser.verificationStatus}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSelectTab('profile');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>My Profile & Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenCredits();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Credit History & Leaderboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('student-register')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onSelectTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  currentTab === link.id
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
