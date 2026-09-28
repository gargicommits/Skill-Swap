import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AcademicNote, SPPU_SUBJECTS, SPPUSubject } from '../types';
import {
  BookOpen,
  Search,
  Download,
  Eye,
  Plus,
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
  Flag,
} from 'lucide-react';

interface NotesSectionProps {
  onReport: (noteId: string, title: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ onReport }) => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<AcademicNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadSubject, setUploadSubject] = useState<SPPUSubject>(SPPU_SUBJECTS[0]);
  const [uploadUnit, setUploadUnit] = useState<number>(1);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadDesc, setUploadDesc] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Note Viewer Modal
  const [activeNote, setActiveNote] = useState<AcademicNote | null>(null);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotes({
        subject: selectedSubject || undefined,
        unit: selectedUnit ? Number(selectedUnit) : undefined,
        search: searchQuery || undefined,
      });
      setNotes(res.notes);
    } catch (err: any) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedSubject, selectedUnit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes();
  };

  const handleViewNote = async (note: AcademicNote) => {
    setActiveNote(note);
    try {
      await api.viewNote(note.id);
      // update local view count
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, viewsCount: n.viewsCount + 1 } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleDownloadNote = async (note: AcademicNote) => {
    try {
      await api.downloadNote(note.id);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, downloadsCount: n.downloadsCount + 1 } : n))
      );
      // trigger simulated browser download
      const element = document.createElement('a');
      const file = new Blob([`Skill Swap Buddy - SPPU Note: ${note.title}\nSubject: ${note.subject}\nUnit: ${note.unit}\nVerified Uploader: ${note.uploaderName}\n\nContents:\n${note.description || 'Verified college study material.'}`], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = note.fileName || `${note.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch {
      // ignore
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setUploadError('Please provide a title for this note.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await api.uploadNote({
        title: uploadTitle.trim(),
        subject: uploadSubject,
        unit: uploadUnit,
        description: uploadDesc.trim(),
        fileName: uploadFileName || `${uploadTitle.replace(/\s+/g, '_')}.pdf`,
        fileSize: '3.4 MB',
      });

      setShowUploadModal(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadFileName('');
      await fetchNotes();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload =
    currentUser?.role === 'ADMIN' ||
    (currentUser?.role === 'SENIOR' && currentUser?.verificationStatus === 'APPROVED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Academic Resource Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            SPPU First-Year Academic Notes
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Handwritten formulas, chapter derivations, and unit-wise question banks uploaded by senior toppers.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Notes</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by note title or topic (e.g., Eigenvalues, Thermodynamics)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 10 SPPU Subjects Dropdown */}
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

            {/* Unit Filter */}
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Units (1 - 6)</option>
              {[1, 2, 3, 4, 5, 6].map((u) => (
                <option key={u} value={u}>
                  Unit 0{u}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Quick Subject Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1 self-center">Popular Subjects:</span>
          {SPPU_SUBJECTS.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(selectedSubject === s ? '' : s)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                selectedSubject === s
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
          {selectedSubject && (
            <button
              onClick={() => setSelectedSubject('')}
              className="text-[11px] text-red-600 hover:underline font-semibold ml-2"
            >
              Clear Subject
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading verified SPPU academic notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Notes Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            No notes have been uploaded for the selected filter yet. Verified seniors can upload notes anytime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg truncate">
                    {note.subject}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md shrink-0">
                    Unit 0{note.unit}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-2 mt-1">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {note.description || 'Comprehensive handwritten notes and solved exercises.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 truncate">
                    <span className="font-semibold text-slate-700 truncate">{note.uploaderName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </span>
                  <span>{note.fileSize}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1" title="Views">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{note.viewsCount}</span>
                  </span>
                  <span className="flex items-center gap-1" title="Downloads">
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>{note.downloadsCount}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleViewNote(note)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    title="Preview Note"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadNote(note)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => onReport(note.id, note.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    title="Report Note"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Preview Modal */}
      {activeNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 p-5 text-white flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-blue-400">
                  {activeNote.subject} • Unit {activeNote.unit}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{activeNote.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uploaded by {activeNote.uploaderName} • {activeNote.fileSize}
                </p>
              </div>
              <button
                onClick={() => setActiveNote(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Summary & Highlights</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeNote.description || 'Comprehensive unit study material including formulas, diagrams, and past SPPU exam derivations.'}
                </p>
              </div>

              {/* Simulated PDF Reader view */}
              <div className="border border-slate-200 rounded-xl p-6 bg-slate-100 text-center space-y-3">
                <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">{activeNote.fileName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified SPPU Curriculum Material • Ready for Download
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadNote(activeNote)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document ({activeNote.fileSize})</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveNote(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-300"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Note Modal (For Approved Seniors & Admins) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-blue-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-white" />
                <h3 className="font-bold text-lg">Upload SPPU Academic Notes</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Subject: Strictly restricted to the 10 SPPU engineering subjects */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  SPPU First-Year Subject *
                </label>
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value as SPPUSubject)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  {SPPU_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Unit Number *
                  </label>
                  <select
                    value={uploadUnit}
                    onChange={(e) => setUploadUnit(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map((u) => (
                      <option key={u} value={u}>
                        Unit 0{u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maths1_Unit1_Matrices.pdf"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 1 Matrices & System of Linear Equations handwritten derivation"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Topic Description & Formulas Included
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention key topics covered, solved university questions..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                Notice: Uploaded material must adhere strictly to academic integrity guidelines. Notes are verified by college administrators.
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
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Publish Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
