import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Library,
  Plus,
  Loader2,
  Users,
  Award,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { chapterApi, lessonApi, dppApi, teacherApi } from '../../api';

function StudioStat({ label, value, sublabel }: { label: string; value: number | string; sublabel?: string }) {
  return (
    <div className="card text-center p-5">
      <p className="font-display font-bold text-3xl" style={{ color: 'var(--brand-burgundy)' }}>
        {value}
      </p>
      <p className="text-xs font-semibold mt-1" style={{ color: 'var(--brand-cherry)' }}>
        {label}
      </p>
      {sublabel && (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}

export default function TeacherHome() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const res = await teacherApi.getProfile();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const { data: chaptersData, isLoading: loadingChapters } = useQuery({
    queryKey: ['teacher-chapters'],
    queryFn: async () => {
      const res = await chapterApi.getAll();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const { data: lessonsData, isLoading: loadingLessons } = useQuery({
    queryKey: ['teacher-lessons-summary'],
    queryFn: async () => {
      const res = await lessonApi.getAll({ limit: 100 });
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const { data: dppsData, isLoading: loadingDpps } = useQuery({
    queryKey: ['teacher-dpps-summary'],
    queryFn: async () => {
      const res = await dppApi.getAll();
      return res.data.data.dpps;
    },
    staleTime: 60_000,
  });

  // Real student progress and performance on teacher's DPPs
  const { data: studentProgressRes, isLoading: loadingAttempts } = useQuery({
    queryKey: ['teacher-student-attempts'],
    queryFn: async () => {
      const res = await dppApi.getStudentAttempts();
      return res.data;
    },
    staleTime: 30_000,
  });

  const isLoading = loadingChapters || loadingLessons || loadingDpps;
  const teacherName = profile ? `${profile.firstName} ${profile.lastName}` : (user?.name || 'Educator');

  const publishedChapters = chaptersData?.filter((c) => c.status === 'published').length || 0;
  const totalChapters = chaptersData?.length || 0;

  const publishedLessons = lessonsData?.filter((l) => l.status === 'published').length || 0;
  const totalLessons = lessonsData?.length || 0;

  const publishedDPPs = dppsData?.filter((d) => d.status === 'published').length || 0;
  const totalDPPs = dppsData?.length || 0;

  const attempts = studentProgressRes?.data || [];
  const analytics = studentProgressRes?.analytics || {
    totalAttempts: 0,
    avgScore: 0,
    avgAccuracy: 0,
    uniqueStudents: 0,
  };

  return (
    <div>
      {/* ── Studio Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 sm:px-10 py-12 sm:py-16"
        style={{ backgroundColor: 'var(--brand-burgundy)' }}
      >
        <div className="relative z-10 max-w-3xl">
          <motion.p
            className="section-label"
            style={{ color: 'var(--brand-gold)' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Academic Workspace
          </motion.p>
          <motion.h1
            className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--brand-ivory)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            Your teaching studio.
          </motion.h1>
          <motion.div
            className="mt-3 amber-line w-16"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: 'left' }}
            transition={{ delay: 0.15 }}
          />
          <motion.p
            className="mt-4 text-sm leading-relaxed"
            style={{ color: 'rgba(227,221,211,0.75)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome, {teacherName}. Craft rigorous lessons, orchestrate chapter progressions, author competitive JEE assessments, and monitor live student performance.
          </motion.p>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/teacher/chapters" className="btn-amber inline-flex items-center gap-2 text-xs">
              <Plus size={14} /> New Chapter
            </Link>
            <Link to="/teacher/lessons" className="btn-amber inline-flex items-center gap-2 text-xs">
              <Plus size={14} /> Author Lesson
            </Link>
            <Link
              to="/teacher/dpps"
              className="btn-outline inline-flex items-center gap-2 text-xs"
              style={{ borderColor: 'var(--brand-gold)', color: 'var(--brand-ivory)' }}
            >
              <Plus size={14} /> Create DPP
            </Link>
          </div>
        </div>
      </section>

      {/* ── Studio Statistics & Overview ─────────────────────────────── */}
      <section className="px-6 sm:px-10 py-10">
        <div className="flex items-baseline gap-3 mb-6">
          <p className="section-label">Curriculum Intelligence</p>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(98,65,51,0.08)' }} />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 py-12 justify-center">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
            <p style={{ color: 'var(--brand-earth)' }}>Loading teaching portfolio…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StudioStat label="Chapters" value={totalChapters} sublabel={`${publishedChapters} published`} />
            <StudioStat label="Lessons" value={totalLessons} sublabel={`${publishedLessons} published`} />
            <StudioStat label="DPP Assessments" value={totalDPPs} sublabel={`${publishedDPPs} published`} />
            <StudioStat label="Review Pending" value={totalDPPs - publishedDPPs + (totalLessons - publishedLessons)} sublabel="Draft materials" />
          </div>
        )}

        {/* ── Student Progress & Cohort Activity ───────────────────────── */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between gap-3 mb-6">
            <div>
              <p className="section-label">Student Performance</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
                Cohort Progress &amp; DPP Attempts
              </h2>
            </div>
            <div className="flex-1 h-px ml-4 hidden sm:block" style={{ backgroundColor: 'rgba(98,65,51,0.08)' }} />
          </div>

          {loadingAttempts ? (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 size={18} className="animate-spin text-amber-500" />
              <p className="text-xs" style={{ color: 'var(--brand-earth)' }}>Retrieving student assessment attempts…</p>
            </div>
          ) : (
            <>
              {/* Aggregate Student Analytics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="card p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                    <Users size={14} /> Active Students
                  </div>
                  <p className="font-display font-bold text-2xl" style={{ color: 'var(--brand-burgundy)' }}>
                    {analytics.uniqueStudents}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Tested on your DPPs</p>
                </div>

                <div className="card p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                    <CheckCircle size={14} /> Total Submissions
                  </div>
                  <p className="font-display font-bold text-2xl" style={{ color: 'var(--brand-burgundy)' }}>
                    {analytics.totalAttempts}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Completed assessments</p>
                </div>

                <div className="card p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                    <Award size={14} /> Avg. Accuracy
                  </div>
                  <p className="font-display font-bold text-2xl" style={{ color: 'var(--brand-burgundy)' }}>
                    {analytics.avgAccuracy}%
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Cohort overall accuracy</p>
                </div>

                <div className="card p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                    <BarChart3 size={14} /> Average Score
                  </div>
                  <p className="font-display font-bold text-2xl" style={{ color: 'var(--brand-burgundy)' }}>
                    {analytics.avgScore}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Per submitted attempt</p>
                </div>
              </div>

              {/* Student Attempts Table / Cards */}
              {attempts.length === 0 ? (
                <div className="card p-8 text-center border border-dashed" style={{ borderColor: 'rgba(98, 65, 51, 0.2)' }}>
                  <Users size={32} className="mx-auto mb-3 opacity-25 text-amber-800" />
                  <h4 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                    No Student Submissions Yet
                  </h4>
                  <p className="text-xs mt-1.5 max-w-md mx-auto" style={{ color: 'var(--brand-earth)', opacity: 0.8 }}>
                    When enrolled students practice or take exams on your published DPPs, their full scores, question accuracy %, and completion times will automatically be tracked here.
                  </p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'rgba(98, 65, 51, 0.1)', backgroundColor: 'rgba(227, 221, 211, 0.3)' }}>
                          <th className="py-3 px-4 font-semibold text-stone-800">Student</th>
                          <th className="py-3 px-4 font-semibold text-stone-800">DPP Assessment</th>
                          <th className="py-3 px-4 font-semibold text-stone-800">Mode</th>
                          <th className="py-3 px-4 font-semibold text-stone-800">Score</th>
                          <th className="py-3 px-4 font-semibold text-stone-800">Accuracy</th>
                          <th className="py-3 px-4 font-semibold text-stone-800">Time Taken</th>
                          <th className="py-3 px-4 font-semibold text-stone-800">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'rgba(98, 65, 51, 0.06)' }}>
                        {attempts.map((attempt) => {
                          const studentName = attempt.student
                            ? `${attempt.student.firstName} ${attempt.student.lastName}`
                            : 'Student';
                          const minutes = Math.floor((attempt.timeTakenSeconds || 0) / 60);
                          const seconds = (attempt.timeTakenSeconds || 0) % 60;
                          const submittedDate = attempt.submittedAt
                            ? new Date(attempt.submittedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—';

                          return (
                            <tr key={attempt._id} className="hover:bg-amber-500/5 transition-colors">
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-stone-900">{studentName}</p>
                                <p className="text-[11px] text-stone-500 truncate max-w-[160px]">
                                  {attempt.student?.email}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-stone-800">
                                {attempt.dpp?.title || 'DPP Test'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    attempt.mode === 'EXAM'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {attempt.mode}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-stone-900">{attempt.score}</span>
                                <span className="text-stone-500"> / {attempt.maxScore || attempt.dpp?.totalMarks || 0}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-14 h-2 bg-stone-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(100, Math.max(0, attempt.accuracy || 0))}%`,
                                        backgroundColor:
                                          (attempt.accuracy || 0) >= 75
                                            ? '#15803d'
                                            : (attempt.accuracy || 0) >= 50
                                            ? 'var(--brand-amber)'
                                            : 'var(--brand-crimson)',
                                      }}
                                    />
                                  </div>
                                  <span className="font-semibold text-stone-800">{attempt.accuracy || 0}%</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-stone-600">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} className="opacity-60" />
                                  {minutes}m {seconds}s
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-stone-600">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} className="opacity-60" />
                                  {submittedDate}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Curriculum Modules ─────────────────────────────────────── */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={18} style={{ color: 'var(--brand-amber)' }} />
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                  Chapter Structure
                </h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--brand-earth)', opacity: 0.75 }}>
                Organize your curriculum across subjects with sequential order controls, titles, study notes upload, and publication states.
              </p>
            </div>
            <Link
              to="/teacher/chapters"
              className="mt-6 text-xs font-semibold flex items-center justify-between group"
              style={{ color: 'var(--brand-burgundy)' }}
            >
              Manage Chapters
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} style={{ color: 'var(--brand-amber)' }} />
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                  Lesson Authoring
                </h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--brand-earth)', opacity: 0.75 }}>
                Draft in-depth content with prerequisite graphs, learning outcomes, estimated duration, and media attachments.
              </p>
            </div>
            <Link
              to="/teacher/lessons"
              className="mt-6 text-xs font-semibold flex items-center justify-between group"
              style={{ color: 'var(--brand-burgundy)' }}
            >
              Open Lesson Studio
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Library size={18} style={{ color: 'var(--brand-amber)' }} />
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                  DPP &amp; Question Bank
                </h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--brand-earth)', opacity: 0.75 }}>
                Construct timed examinations with single correct, multiple correct, and numerical questions matching JEE marking schemes.
              </p>
            </div>
            <Link
              to="/teacher/dpps"
              className="mt-6 text-xs font-semibold flex items-center justify-between group"
              style={{ color: 'var(--brand-burgundy)' }}
            >
              Launch Assessment Builder
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
