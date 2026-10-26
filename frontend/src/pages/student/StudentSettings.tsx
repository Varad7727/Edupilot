import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Shield,
  LogOut,
  Bell,
  Eye,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studentApi } from '../../api';

export default function StudentSettings() {
  const { user, logout } = useAuth();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [examAlerts, setExamAlerts] = useState(true);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['student-dashboard-settings'],
    queryFn: async () => {
      const res = await studentApi.getDashboard();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const studentProfile = dashboard?.profile;

  return (
    <div className="px-6 sm:px-10 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="section-label">Account &amp; Preferences</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
          Student Settings
        </h2>
        <div className="mt-2 amber-line w-12" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
          <p style={{ color: 'var(--brand-earth)' }}>Loading profile details…</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Student Profile Information ─────────────────────────── */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                style={{ backgroundColor: 'rgba(247, 165, 27, 0.15)', color: 'var(--brand-amber)' }}
              >
                <User size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                  Profile Information
                </h3>
                <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.65 }}>
                  Verified student credentials
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(98, 65, 51, 0.1)', backgroundColor: 'var(--brand-white)' }}>
                <p className="section-label text-xs mb-1">Full Name</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--brand-cherry)' }}>
                  {studentProfile?.fullName || user?.name || 'Registered Student'}
                </p>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(98, 65, 51, 0.1)', backgroundColor: 'var(--brand-white)' }}>
                <p className="section-label text-xs mb-1">Email Address</p>
                <div className="flex items-center gap-2">
                  <Mail size={13} style={{ color: 'var(--brand-amber)' }} />
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--brand-cherry)' }}>
                    {studentProfile?.email || user?.email}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(98, 65, 51, 0.1)', backgroundColor: 'var(--brand-white)' }}>
                <p className="section-label text-xs mb-1">Joined Date</p>
                <div className="flex items-center gap-2">
                  <Calendar size={13} style={{ color: 'var(--brand-amber)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--brand-cherry)' }}>
                    {studentProfile?.joinedAt
                      ? new Date(studentProfile.joinedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Active Member'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(98, 65, 51, 0.1)', backgroundColor: 'var(--brand-white)' }}>
                <p className="section-label text-xs mb-1">Role &amp; Status</p>
                <div className="flex items-center gap-2">
                  <Shield size={13} style={{ color: 'var(--brand-amber)' }} />
                  <span className="badge-published uppercase tracking-wider text-xs">
                    {user?.role || 'Student'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs mt-4" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
              Student profile data is synchronized with your enrollment records.
            </p>
          </div>

          {/* ── Learning & Interface Preferences ─────────────────────── */}
          <form onSubmit={handleSavePreferences} className="card">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                style={{ backgroundColor: 'rgba(125, 24, 48, 0.1)', color: 'var(--brand-burgundy)' }}
              >
                <Eye size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                  Workspace &amp; Examination Preferences
                </h3>
                <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.65 }}>
                  Customize your learning environment
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl border cursor-pointer hover:bg-amber-50/20 transition-colors" style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}>
                <div className="flex items-center gap-3">
                  <Bell size={16} style={{ color: 'var(--brand-amber)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--brand-cherry)' }}>
                      Assessment Deadline Reminders
                    </p>
                    <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
                      Show alerts for pending DPPs before deadlines expire
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={examAlerts}
                  onChange={(e) => setExamAlerts(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border cursor-pointer hover:bg-amber-50/20 transition-colors" style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}>
                <div className="flex items-center gap-3">
                  <Eye size={16} style={{ color: 'var(--brand-amber)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--brand-cherry)' }}>
                      Reduced Motion Interface
                    </p>
                    <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
                      Minimize animated transitions during assessment reading
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between">
              {savedFeedback ? (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-xs font-semibold"
                  style={{ color: 'var(--brand-amber)' }}
                >
                  <CheckCircle size={14} /> Preferences saved locally
                </motion.div>
              ) : <div />}
              <button type="submit" className="btn-amber text-xs px-5 py-2.5">
                Save Preferences
              </button>
            </div>
          </form>

          {/* ── Session & Security ──────────────────────────────────── */}
          <div className="card">
            <h3 className="font-display font-bold text-base mb-2" style={{ color: 'var(--brand-cherry)' }}>
              Session Management
            </h3>
            <p className="text-xs mb-5" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
              Securely sign out of this device. Your progress on saved assessment answers is maintained on the server.
            </p>

            <button
              onClick={() => logout()}
              className="btn-outline flex items-center gap-2 text-xs px-5 py-2.5"
              style={{ borderColor: 'var(--brand-crimson)', color: 'var(--brand-crimson)' }}
            >
              <LogOut size={14} /> Sign out from AMIT ACADEMY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
