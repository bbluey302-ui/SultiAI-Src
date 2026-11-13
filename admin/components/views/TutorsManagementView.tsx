import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Search, CheckCircle2, XCircle, Clock, 
  ExternalLink, ShieldCheck, AlertCircle, RefreshCw, UserCheck, 
  Sparkles, DollarSign, MapPin, User, ChevronRight, Filter
} from 'lucide-react';
import { 
  Tutor, TutorApplicationStatus, getAllTutors, 
  approveTutorApplication, rejectTutorApplication, 
  seedDemoApplicantIfNeeded 
} from '@/src/data/tutorsData';
import { LinkedInIcon } from '@/src/components/tutor/LinkedInIcon';
import { useAdminAuth } from '../AdminAuthContext';
import { sounds } from '@/src/utils/soundEffects';

export function TutorsManagementView() {
  const { adminUser } = useAdminAuth();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filterStatus, setFilterStatus] = useState<TutorApplicationStatus | 'all'>('pending_review');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionModalTutor, setRejectionModalTutor] = useState<Tutor | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Incomplete Bisaya teaching credentials or profile details');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadTutors = () => {
    setTutors(getAllTutors());
  };

  useEffect(() => {
    loadTutors();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const pendingCount = tutors.filter(t => t.status === 'pending_review').length;
  const approvedCount = tutors.filter(t => t.status === 'approved').length;
  const rejectedCount = tutors.filter(t => t.status === 'rejected').length;

  const handleApprove = (tutor: Tutor) => {
    sounds.playFanfare();
    const reviewerName = adminUser?.fullName || 'Academic Admin';
    const success = approveTutorApplication(tutor.id, reviewerName, 'Verified language proficiency & credentials');
    if (success) {
      loadTutors();
      showToast(`✓ Approved ${tutor.name}! Profile is now live in the public Tutor Hub.`);
    }
  };

  const handleOpenRejectModal = (tutor: Tutor) => {
    sounds.playTap();
    setRejectionModalTutor(tutor);
  };

  const handleConfirmReject = () => {
    if (!rejectionModalTutor) return;
    sounds.playTap();
    const reviewerName = adminUser?.fullName || 'Academic Admin';
    const success = rejectTutorApplication(rejectionModalTutor.id, reviewerName, rejectionReason);
    if (success) {
      loadTutors();
      showToast(`Application for ${rejectionModalTutor.name} was rejected.`);
      setRejectionModalTutor(null);
    }
  };

  const handleSeedDemoApplicant = () => {
    sounds.playTap();
    seedDemoApplicantIfNeeded();
    loadTutors();
    showToast('Demo applicant created for immediate testing!');
  };

  const filtered = tutors.filter((tutor) => {
    if (filterStatus !== 'all' && tutor.status !== filterStatus) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = tutor.name.toLowerCase().includes(q);
      const matchTitle = tutor.title.toLowerCase().includes(q);
      const matchLoc = tutor.location.toLowerCase().includes(q);
      const matchLang = tutor.languageLabel.toLowerCase().includes(q);
      return matchName || matchTitle || matchLoc || matchLang;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xl border border-stone-700 dark:border-stone-200 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#11222D] p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white font-display">
                Tutor Applications & Vetting Board
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Admin review pipeline: Review teaching credentials, LinkedIn profiles, and approve for public Tutor Hub.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSeedDemoApplicant}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Create a pending applicant to test the approval pipeline"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Test Applicant</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              loadTutors();
            }}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={() => setFilterStatus('pending_review')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'pending_review'
              ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-[#11222D] border-stone-200 dark:border-white/10 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Pending Review</span>
            </span>
            <span className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">
              {pendingCount}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Applicants awaiting credential and background check
          </p>
        </button>

        <button
          onClick={() => setFilterStatus('approved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'approved'
              ? 'bg-teal-500/10 border-teal-500/40 ring-2 ring-teal-500/20'
              : 'bg-white dark:bg-[#11222D] border-stone-200 dark:border-white/10 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Approved & Live</span>
            </span>
            <span className="text-xl font-mono font-black text-teal-600 dark:text-teal-400">
              {approvedCount}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Active in public Learn Dashboard Tutor Directory
          </p>
        </button>

        <button
          onClick={() => setFilterStatus('rejected')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'rejected'
              ? 'bg-rose-500/10 border-rose-500/40 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-[#11222D] border-stone-200 dark:border-white/10 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              <span>Rejected / Incomplete</span>
            </span>
            <span className="text-xl font-mono font-black text-rose-600 dark:text-rose-400">
              {rejectedCount}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Did not meet language coaching criteria
          </p>
        </button>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#11222D] p-3 rounded-2xl border border-stone-200 dark:border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tutor name, title, dialect..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer whitespace-nowrap transition-colors ${
              filterStatus === 'all'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            All Tutors ({tutors.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending_review')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer whitespace-nowrap transition-colors ${
              filterStatus === 'pending_review'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer whitespace-nowrap transition-colors ${
              filterStatus === 'approved'
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer whitespace-nowrap transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Applicants List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#11222D] rounded-3xl border border-stone-200 dark:border-white/10 space-y-3">
            <div className="text-3xl">📋</div>
            <h4 className="font-display font-black text-sm text-stone-900 dark:text-white">
              No tutors found in this view
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              {filterStatus === 'pending_review' 
                ? 'All incoming tutor applications have been processed!' 
                : 'Try clearing the search or changing status filter.'}
            </p>
            {filterStatus === 'pending_review' && (
              <button
                onClick={handleSeedDemoApplicant}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Test Applicant</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((tutor) => {
            const isPending = tutor.status === 'pending_review';
            const isApproved = tutor.status === 'approved';
            const isRejected = tutor.status === 'rejected';

            return (
              <div
                key={tutor.id}
                className={`p-5 rounded-3xl border transition-all space-y-4 bg-white dark:bg-[#11222D] ${
                  isPending
                    ? 'border-amber-300/80 dark:border-amber-500/30 shadow-sm ring-1 ring-amber-400/20'
                    : 'border-stone-200 dark:border-white/10'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-display font-black flex items-center justify-center text-base shrink-0 shadow-xs">
                      {tutor.avatarInitials}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-black text-base text-stone-900 dark:text-white">
                          {tutor.name}
                        </h3>

                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        )}

                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved (Public)</span>
                          </span>
                        )}

                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}

                        {tutor.academicVetted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            <span>SultiAI Vetted</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                        {tutor.title}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>{tutor.location}</span>
                        </span>
                        <span>•</span>
                        <span>{tutor.languageLabel}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-stone-800 dark:text-stone-200">₱{tutor.hourlyRatePhp}/hr</span>
                        <span>•</span>
                        <span>{tutor.experienceYears} yrs exp</span>
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn Profile link with clear external indicator */}
                  <div className="shrink-0 flex items-center gap-2">
                    <a
                      href={tutor.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] dark:text-blue-300 border border-[#0A66C2]/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Inspect applicant's LinkedIn Profile"
                    >
                      <LinkedInIcon className="w-3.5 h-3.5 fill-current" />
                      <span>Inspect LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Bio text */}
                <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/60 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Teaching Background & Introduction
                  </span>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {tutor.bio}
                  </p>
                </div>

                {/* Specialties tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-stone-400 font-medium">Specialties:</span>
                  {tutor.specialties.map(spec => (
                    <span key={spec} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-medium border border-stone-200/50 dark:border-white/5">
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Review Audit trail (if reviewed) */}
                {(tutor.approvedAt || tutor.reviewNotes) && (
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100/70 dark:bg-stone-800/70 p-2.5 rounded-xl flex items-center justify-between">
                    <span>
                      Reviewer: <strong>{tutor.reviewedBy || 'Academic Admin'}</strong>
                      {tutor.reviewNotes && ` · Notes: "${tutor.reviewNotes}"`}
                    </span>
                    {tutor.approvedAt && (
                      <span className="font-mono text-[10px] text-stone-400">
                        Approved: {new Date(tutor.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 border-t border-stone-100 dark:border-white/5 flex flex-wrap items-center justify-end gap-2.5">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleOpenRejectModal(tutor)}
                        className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Application</span>
                      </button>

                      <button
                        onClick={() => handleApprove(tutor)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Publish to Tutor Hub</span>
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => handleOpenRejectModal(tutor)}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 text-stone-500 hover:text-rose-600 text-xs font-medium cursor-pointer"
                    >
                      Suspend / Revoke Approval
                    </button>
                  )}

                  {isRejected && (
                    <button
                      onClick={() => handleApprove(tutor)}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Reconsider & Approve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectionModalTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#11222D] rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-stone-200 dark:border-white/10">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-display font-black text-base text-stone-900 dark:text-white">
                Reject Tutor Application
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              Provide feedback for <strong>{rejectionModalTutor.name}</strong> regarding why their application was not approved.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                Reason / Feedback Note
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRejectionModalTutor(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
