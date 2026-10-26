import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, BookOpen, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';
import { AxiosError } from 'axios';

type Tab = 'login' | 'register';

function AbstractOrbit() {
  return (
    <svg
      viewBox="0 0 500 500"
      className="absolute inset-0 w-full h-full opacity-10"
      aria-hidden="true"
    >
      <circle cx="250" cy="250" r="200" fill="none" stroke="#F7A51B" strokeWidth="0.5" />
      <circle cx="250" cy="250" r="140" fill="none" stroke="#E1B270" strokeWidth="0.5" />
      <circle cx="250" cy="250" r="80" fill="none" stroke="#F7A51B" strokeWidth="0.5" />
      <ellipse cx="250" cy="250" rx="200" ry="80" fill="none" stroke="#E1B270" strokeWidth="0.5" transform="rotate(30 250 250)" />
      <ellipse cx="250" cy="250" rx="200" ry="80" fill="none" stroke="#F7A51B" strokeWidth="0.5" transform="rotate(60 250 250)" />
      <circle cx="450" cy="250" r="6" fill="#F7A51B" opacity="0.6" />
      <circle cx="50" cy="250" r="4" fill="#E1B270" opacity="0.6" />
      <circle cx="350" cy="100" r="5" fill="#F7A51B" opacity="0.5" />
      <path d="M250,50 Q350,150 450,250" stroke="#E1B270" strokeWidth="0.5" fill="none" />
      <path d="M50,250 Q150,350 250,450" stroke="#F7A51B" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

export default function AuthPage() {
  const [role, setRole] = useState<Role>('student');
  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (tab === 'login') {
        await login(role, form.email, form.password);
      } else {
        await register(role, form.firstName, form.lastName, form.email, form.password);
      }
      const destination = from || (role === 'student' ? '/student' : '/teacher');
      navigate(destination, { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left Panel: Brand Visual ─────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 lg:w-1/2 xl:w-2/5 flex flex-col justify-between p-10 overflow-hidden"
        style={{ backgroundColor: 'var(--brand-burgundy)' }}
      >
        <AbstractOrbit />

        {/* Ambient gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 80%, rgba(247,165,27,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Wordmark */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-label" style={{ color: 'rgba(227,221,211,0.6)' }}>
              AI-Powered JEE Preparation
            </p>
            <h1
              className="mt-2 font-display text-4xl xl:text-5xl font-bold tracking-tight"
              style={{ color: 'var(--brand-ivory)' }}
            >
              AMIT ACADEMY
            </h1>
            <div className="mt-3 amber-line w-16" />
            <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(227,221,211,0.7)' }}>
              Learn with purpose.<br />
              Master with confidence.
            </p>
          </motion.div>
        </div>

        {/* Feature highlights */}
        <motion.div
          className="relative z-10 space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {[
            { icon: BookOpen, label: 'Structured curriculum', desc: 'Chapter-by-chapter JEE coverage' },
            { icon: GraduationCap, label: 'Daily Practice Problems', desc: 'Timed exam and practice modes' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4">
              <div
                className="flex-shrink-0 p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(247,165,27,0.15)' }}
              >
                <Icon size={18} style={{ color: 'var(--brand-amber)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--brand-ivory)' }}>
                  {label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(227,221,211,0.6)' }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <p className="relative z-10 text-xs" style={{ color: 'rgba(227,221,211,0.35)' }}>
          © {new Date().getFullYear()} Amit Academy
        </p>
      </div>

      {/* ── Right Panel: Auth Form ─────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-12"
        style={{ backgroundColor: 'var(--brand-white)' }}
      >
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* Role selector */}
          <div className="mb-8">
            <p className="section-label mb-3">Sign in as</p>
            <div
              className="inline-flex rounded-xl p-1"
              style={{ backgroundColor: 'var(--brand-ivory)' }}
            >
              {(['student', 'teacher'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setError(''); }}
                  className="px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
                  style={{
                    backgroundColor: role === r ? 'var(--brand-burgundy)' : 'transparent',
                    color: role === r ? 'var(--brand-ivory)' : 'var(--brand-earth)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Tab */}
          <div className="flex border-b mb-8" style={{ borderColor: 'rgba(98,65,51,0.15)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className="pb-3 pr-6 text-sm font-semibold capitalize transition-colors relative"
                style={{
                  color: tab === t ? 'var(--brand-burgundy)' : 'var(--brand-earth)',
                  opacity: tab === t ? 1 : 0.5,
                }}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
                {tab === t && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-6 h-0.5"
                    style={{ backgroundColor: 'var(--brand-amber)' }}
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={`${role}-${tab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {tab === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--brand-earth)' }}>
                      First name
                    </label>
                    <input
                      className="input-field"
                      value={form.firstName}
                      onChange={update('firstName')}
                      placeholder="Ravi"
                      minLength={4}
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--brand-earth)' }}>
                      Last name
                    </label>
                    <input
                      className="input-field"
                      value={form.lastName}
                      onChange={update('lastName')}
                      placeholder="Sharma"
                      minLength={2}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--brand-earth)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--brand-earth)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-11"
                    value={form.password}
                    onChange={update('password')}
                    placeholder={tab === 'register' ? 'At least 6 characters' : '••••••••'}
                    minLength={6}
                    required
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium"
                  style={{ color: 'var(--brand-crimson)' }}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-amber w-full flex items-center justify-center gap-2 mt-2"
                style={{ padding: '0.875rem' }}
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="mt-6 text-xs text-center" style={{ color: 'rgba(98,65,51,0.4)' }}>
            By continuing, you agree to AMIT ACADEMY's terms of service.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
