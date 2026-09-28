import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PYQPaper, SPPU_SUBJECTS, SPPUSubject } from '../types';
import {
  FileText,
  Search,
  Download,
  Calendar,
  CheckCircle2,
  Plus,
  X,
  AlertCircle,
  Clock,
  Flag,
  Sparkles,
  BookOpen,
  Filter,
  CheckSquare,
  ShieldAlert,
} from 'lucide-react';

interface PYQSectionProps {
  onReport: (pyqId: string, title: string) => void;
}

export const PYQSection: React.FC<PYQSectionProps> = ({ onReport }) => {
  const { currentUser } = useAuth();
  const [papers, setPapers] = useState<PYQPaper[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<'ALL' | '2025_PATTERN' | 'QUESTION_BANK' | 'MY_UPLOADS'>('ALL');

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const [selectedMarks, setSelectedMarks] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSem, setSelectedSem] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadType, setUploadType] = useState<'QUESTION_PAPER' | 'QUESTION_BANK'>('QUESTION_PAPER');
  const [uploadSubject, setUploadSubject] = useState<SPPUSubject>(SPPU_SUBJECTS[0]);
  const [uploadPattern, setUploadPattern] = useState<string>('2025 Pattern');
  const [uploadTotalMarks, setUploadTotalMarks] = useState<number>(60);
  const [uploadYear, setUploadYear] = useState<string>('2024-25');
  const [uploadSem, setUploadSem] = useState<'Sem 1' | 'Sem 2'>('Sem 1');
  const [uploadExamType, setUploadExamType] = useState<'In-Sem' | 'End-Sem'>('End-Sem');
  const [uploadHasSol, setUploadHasSol] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchPYQs = async () => {
    setIsLoading(true);
    try {
      let patternParam = selectedPattern || undefined;
      let marksParam = selectedMarks ? Number(selectedMarks) : undefined;
      let typeParam: string | undefined = undefined;

      if (activeTab === '2025_PATTERN') {
        patternParam = '2025 Pattern';
        marksParam = 60;
      } else if (activeTab === 'QUESTION_BANK') {
        typeParam = 'QUESTION_BANK';
      }

      const res = await api.getPYQs({
        subject: selectedSubject || undefined,
        pattern: patternParam,
        totalMarks: marksParam,
        academicYear: selectedYear || undefined,
        semester: selectedSem || undefined,
        examType: selectedExamType || undefined,
        type: typeParam,
        search: searchQuery || undefined,
      });

      let loaded = res.papers;
      if (activeTab === 'MY_UPLOADS' && currentUser) {
        loaded = loaded.filter((p) => p.uploaderId === currentUser.id);
      }

      setPapers(loaded);
    } catch (err: any) {
      console.error('Failed to fetch PYQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPYQs();
  }, [
    selectedSubject,
    selectedPattern,
    selectedMarks,
    selectedYear,
    selectedSem,
    selectedExamType,
    activeTab,
  ]);

  const handleDownloadPYQ = async (pyq: PYQPaper) => {
    try {
      await api.downloadPYQ(pyq.id);
      setPapers((prev) =>
        prev.map((p) => (p.id === pyq.id ? { ...p, downloadsCount: (p.downloadsCount || 0) + 1 } : p))
      );

      // Download content
      const element = document.createElement('a');
      const file = new Blob(
        [
          `Savitribai Phule Pune University (SPPU)\nFirst-Year Engineering Examination — ${pyq.title || pyq.subject}\n` +
          `Pattern: ${pyq.pattern || '2025 Pattern'} | Total Marks: ${pyq.totalMarks || 60} Marks\n` +
          `Subject: ${pyq.subject} | Semester: ${pyq.semester}\n` +
          `Academic Year: ${pyq.academicYear} | Exam: ${pyq.examType}\n` +
          `Uploader: ${pyq.uploadedBy} | Status: ${pyq.status || 'PUBLISHED'}\n` +
          `Model Solutions Included: ${pyq.hasSolutions ? 'YES' : 'NO'}\n\n` +
          `============================================================\n` +
          `SECTION 1: Official Question Bank & Exam Breakdown\n` +
          `All 6 Units tailored to the revised SPPU First-Year Curriculum.\n` +
          `============================================================\n`
        ],
        { type: 'text/plain' }
      );
      element.href = URL.createObjectURL(file);
      element.download = pyq.fileName || `SPPU_${pyq.subject.replace(/\s+/g, '_')}_${pyq.pattern || '2025'}_60M.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch {
      // ignore
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await api.uploadPYQ({
        title: uploadTitle || `${uploadSubject} — ${uploadPattern} ${uploadTotalMarks} Marks (${uploadExamType})`,
        type: uploadType,
        subject: uploadSubject,
        academicYear: uploadYear,
        pattern: uploadPattern,
        totalMarks: Number(uploadTotalMarks),
        semester: uploadSem,
        examType: uploadExamType,
        hasSolutions: uploadHasSol,
        fileName: `${uploadSubject.replace(/\s+/g, '_')}_${uploadPattern.replace(/\s+/g, '')}_${uploadTotalMarks}M.pdf`,
        fileSize: uploadType === 'QUESTION_BANK' ? '5.4 MB' : '3.2 MB',
      });

      setStatusMessage(res.message);
      setShowUploadModal(false);
      setUploadTitle('');
      await fetchPYQs();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload question paper.');
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload =
    currentUser?.role === 'ADMIN' ||
    (currentUser?.role === 'SENIOR' && currentUser?.verificationStatus === 'APPROVED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>SPPU First-Year Academic Repository</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Question Papers & Question Banks
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Official Savitribai Phule Pune University First-Year Engineering examination papers, including the latest <strong className="text-purple-700">2025 Pattern (60 Marks)</strong> and unit-wise Question Banks.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => {
              setUploadError(null);
              setShowUploadModal(true);
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Paper / Question Bank</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Academic Papers
        </button>
        <button
          onClick={() => setActiveTab('2025_PATTERN')}
          className={`px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === '2025_PATTERN'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>2025 Pattern (60 Marks)</span>
        </button>
        <button
          onClick={() => setActiveTab('QUESTION_BANK')}
          className={`px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'QUESTION_BANK'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Question Banks</span>
        </button>
        {(currentUser?.role === 'SENIOR' || currentUser?.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('MY_UPLOADS')}
            className={`px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'MY_UPLOADS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            My Uploads ({papers.filter((p) => p.uploaderId === currentUser?.id).length})
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
          <Filter className="w-4 h-4 text-purple-600" />
          <span>Filter Academic Material</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Subject Filter (10 SPPU Subjects) */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All 10 SPPU Subjects</option>
              {SPPU_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Curriculum Pattern</label>
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Patterns</option>
              <option value="2025 Pattern">2025 Pattern (New)</option>
              <option value="2019 Pattern">2019 Pattern</option>
            </select>
          </div>

          {/* Total Marks Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Total Marks</label>
            <select
              value={selectedMarks}
              onChange={(e) => setSelectedMarks(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Marks</option>
              <option value="60">60 Marks (2025 Pattern)</option>
              <option value="70">70 Marks (2019 End-Sem)</option>
              <option value="30">30 Marks (In-Sem)</option>
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Semester</label>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Semesters</option>
              <option value="Sem 1">Semester 1</option>
              <option value="Sem 2">Semester 2</option>
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Exam Type</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Types</option>
              <option value="End-Sem">End-Sem</option>
              <option value="In-Sem">In-Sem</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
          <input
            type="text"
            placeholder="Search by subject, title, unit or topic (e.g. Linear Algebra, 2025 Pattern, BEE)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchPYQs();
            }}
            className="w-full pl-9 pr-24 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={fetchPYQs}
            className="absolute right-2 top-2.5 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* PYQ Papers Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Fetching SPPU examination question papers...
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Question Papers or Banks Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your pattern, marks, or subject filters to find available papers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((pyq) => {
            const is2025Pattern = pyq.pattern === '2025 Pattern' || pyq.totalMarks === 60;
            const isQuestionBank = pyq.type === 'QUESTION_BANK';

            return (
              <div
                key={pyq.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  is2025Pattern
                    ? 'border-purple-300 ring-1 ring-purple-100'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg truncate">
                      {pyq.subject}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isQuestionBank ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                          Question Bank
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pyq.examType === 'End-Sem'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {pyq.examType}
                        </span>
                      )}

                      {/* Moderation Status (for Seniors & Admins) */}
                      {pyq.status && pyq.status !== 'PUBLISHED' && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            pyq.status === 'PENDING_REVIEW'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-red-100 text-red-900 border border-red-300'
                          }`}
                        >
                          {pyq.status === 'PENDING_REVIEW' ? 'Pending Review' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Pattern Highlight */}
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-2 mt-1 mb-2">
                    {pyq.title || `${pyq.subject} (${pyq.academicYear})`}
                  </h4>

                  {/* 2025 Pattern 60-Marks Highlight Tag */}
                  {is2025Pattern && (
                    <div className="mb-3 px-2.5 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg flex items-center justify-between text-[11px] text-purple-900 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        2025 Pattern
                      </span>
                      <span className="bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                        60 Marks
                      </span>
                    </div>
                  )}

                  {/* Details table */}
                  <div className="space-y-1 mt-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pattern & Marks:</span>
                      <span className="font-semibold text-slate-800">
                        {pyq.pattern || '2025 Pattern'} • {pyq.totalMarks || 60} Marks
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Academic Year:</span>
                      <span className="font-semibold text-slate-800">{pyq.academicYear}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Term:</span>
                      <span className="font-semibold text-slate-800">{pyq.semester}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Solutions:</span>
                      <span
                        className={`font-bold text-xs ${
                          pyq.hasSolutions ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        {pyq.hasSolutions ? '✓ Solved Answers' : 'Questions Only'}
                      </span>
                    </div>
                  </div>

                  {pyq.moderationComment && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                      <strong>Moderation Note:</strong> {pyq.moderationComment}
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[160px]">Uploaded by {pyq.uploadedBy}</span>
                    <span>{pyq.fileSize}</span>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Download className="w-3.5 h-3.5" />
                    <span>{pyq.downloadsCount || 0} downloads</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPYQ(pyq)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => onReport(pyq.id, `${pyq.subject} (${pyq.pattern || '2025'})`)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Report Paper"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload PYQ / Question Bank Modal (Senior Moderation Flow) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-purple-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <h3 className="font-bold text-lg">Upload Academic Paper / Question Bank</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {uploadError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {currentUser?.role === 'SENIOR' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Quality Moderation Policy:</strong>
                    Senior uploads enter <strong>Pending Admin Review</strong> before appearing in the public repository for students.
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SPPU 2025 Pattern 60 Marks Engineering Mathematics 1 Model Paper"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Type: Question Paper vs Question Bank */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Document Type *
                  </label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                  >
                    <option value="QUESTION_PAPER">Question Paper</option>
                    <option value="QUESTION_BANK">Question Bank (Unit-wise)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Subject (Strict 10 SPPU Subjects) *
                  </label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value as SPPUSubject)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                  >
                    {SPPU_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pattern & Marks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Pattern *
                  </label>
                  <select
                    value={uploadPattern}
                    onChange={(e) => {
                      const pat = e.target.value;
                      setUploadPattern(pat);
                      if (pat === '2025 Pattern') {
                        setUploadTotalMarks(60);
                      } else {
                        setUploadTotalMarks(70);
                      }
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                  >
                    <option value="2025 Pattern">2025 Pattern (New)</option>
                    <option value="2019 Pattern">2019 Pattern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Total Marks *
                  </label>
                  <select
                    value={uploadTotalMarks}
                    onChange={(e) => setUploadTotalMarks(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                  >
                    <option value={60}>60 Marks (2025 Pattern)</option>
                    <option value={70}>70 Marks (End-Sem 2019)</option>
                    <option value={30}>30 Marks (In-Sem)</option>
                  </select>
                </div>
              </div>

              {/* Academic Year & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2023-24">2023-24</option>
                    <option value="2022-23">2022-23</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Semester *
                  </label>
                  <select
                    value={uploadSem}
                    onChange={(e) => setUploadSem(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Sem 1">Semester 1</option>
                    <option value="Sem 2">Semester 2</option>
                  </select>
                </div>
              </div>

              {/* Exam Type & Solution Checkbox */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Exam Category *
                  </label>
                  <select
                    value={uploadExamType}
                    onChange={(e) => setUploadExamType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="End-Sem">End-Sem</option>
                    <option value="In-Sem">In-Sem</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={uploadHasSol}
                      onChange={(e) => setUploadHasSol(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Includes Solved Answers</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Submitting...' : currentUser?.role === 'ADMIN' ? 'Publish Immediately' : 'Submit for Admin Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
