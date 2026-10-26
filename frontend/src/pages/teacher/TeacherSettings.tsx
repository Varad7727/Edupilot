import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Calendar,
  Shield,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherApi } from '../../api';

export default function TeacherSettings() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['teacher-settings-profile'],
    queryFn: async () => {
      const res = await teacherApi.getProfile();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof teacherApi.updateProfile>[0]) => teacherApi.updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-settings-profile'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      setPassword('');
      setFeedback({ type: 'success', message: 'Teacher profile updated successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: import('axios').AxiosError<{ message: string }>) => {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload: { firstName?: string; lastName?: string; email?: string; password?: string } = {};

    if (firstName.trim() && firstName !== profile?.firstName) payload.firstName = firstName.trim();
    if (lastName.trim() && lastName !== profile?.lastName) payload.lastName = lastName.trim();
    if (email.trim() && email !== profile?.email) payload.email = email.trim();
    if (password.trim()) payload.password = password.trim();

    if (Object.keys(payload).length === 0) {
      setFeedback({ type: 'error', message: 'No changes detected to update.' });
      return;
    }

    updateMutation.mutate(payload as Parameters<typeof teacherApi.updateProfile>[0]);
  };

  return (
    <div className="px-6 sm:px-10 py-10 max-w-3xl">
      <div className="mb-8">
        <p className="section-label">Instructor Profile &amp; Security</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
          Teacher Settings
        </h2>
        <div className="mt-2 amber-line w-12" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
          <p style={{ color: 'var(--brand-earth)' }}>Loading instructor credentials…</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Profile Update Form ──────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="card">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                style={{ backgroundColor: 'rgba(125, 24, 48, 0.1)', color: 'var(--brand-burgundy)' }}
              >
                <User size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                  Academic Credentials
                </h3>
                <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.65 }}>
                  Update your educator identity displayed on authored materials
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    First Name (min 4 chars)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    minLength={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Last Name (min 2 chars)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    minLength={2}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="input-field text-sm pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                  New Password (min 8 chars, leave blank to keep current)
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    className="input-field text-sm pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 text-xs font-semibold mt-4 ${
                  feedback.type === 'success' ? 'text-amber-700' : 'text-crimson-600'
                }`}
                style={{ color: feedback.type === 'success' ? 'var(--brand-amber)' : 'var(--brand-crimson)' }}
              >
                {feedback.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {feedback.message}
              </motion.div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-amber text-xs px-5 py-2.5 flex items-center gap-2"
              >
                {updateMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>

          {/* ── Session & Security ──────────────────────────────────── */}
          <div className="card">
            <h3 className="font-display font-bold text-base mb-2" style={{ color: 'var(--brand-cherry)' }}>
              Teacher Session Management
            </h3>
            <p className="text-xs mb-5" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
              Securely sign out of your teaching studio. Authored drafts and published chapters remain safely stored on the server.
            </p>

            <button
              onClick={() => logout()}
              className="btn-outline flex items-center gap-2 text-xs px-5 py-2.5"
              style={{ borderColor: 'var(--brand-crimson)', color: 'var(--brand-crimson)' }}
            >
              <LogOut size={14} /> Sign out from Teaching Studio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
