import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Clock,
  Award,
  CheckCircle2,
  Compass,
  ArrowRight,
  BarChart2,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { studentApi, courseApi } from '../../api';
import type { Course, DPP } from '../../types';

// ── Cinematic Orbital Trajectory SVG ──────────────────────────────────────────
function TrajectoryBg() {
  return (
    <svg
      viewBox="0 0 1000 360"
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <motion.path
        d="M-50,220 Q250,40 550,160 T1050,90"
        stroke="#F7A51B"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
      <motion.path
        d="M-50,280 Q200,120 480,220 T1100,160"
        stroke="#E1B270"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, ease: 'easeInOut', delay: 0.2 }}
      />
      <circle cx="550" cy="160" r="5" fill="#F7A51B" />
      <circle cx="250" cy="100" r="3.5" fill="#E1B270" />
      <circle cx="850" cy="120" r="4.5" fill="#F7A51B" />
    </svg>
  );
}

export default function StudentHome() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Scholar';

  // 1. Student Dashboard Data (Course overview, profile, summary)
  const {
    data: dashboard,
    isLoading: loadingDashboard,
    isError: errorDashboard,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res = await studentApi.getDashboard();
      return res.data?.data;
    },
    staleTime: 30_000,
  });

  // 2. All Available Courses (To always browse & show catalog)
  const { data: allCoursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const res = await courseApi.getAll();
      return res.data?.data || (Array.isArray(res.data) ? res.data : []);
    },
    staleTime: 60_000,
  });

  // 3. DPP Practice Tests
  const { data: dppsData } = useQuery({
    queryKey: ['student-dpps-home'],
    queryFn: async () => {
      const res = await studentApi.getDpps();
      return res.data?.data || [];
    },
    staleTime: 60_000,
  });

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => studentApi.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['all-courses'] });
    },
  });

  const enrolledCourseIds = new Set(
    (dashboard?.enrolledCourses || []).map((c) => c._id)
  );

  const allCourses = (allCoursesData || []) as Course[];
  const dpps = (dppsData || []) as DPP[];
  const enrolledCourses = dashboard?.enrolledCourses || [];
  const courseOverview = dashboard?.courseOverview || [];
  const summary = dashboard?.summary || {
    enrolledCourses: enrolledCourses.length,
    subjects: 0,
    chapters: 0,
    lessons: 0,
    dppAttempts: 0,
  };

  // Find the first actionable lesson to highlight in "Continue Learning"
  let nextLessonUnit: {
    courseName: string;
    subjectName: string;
    chapterTitle: string;
    chapterId: string;
    lessonTitle: string;
    duration: number;
    difficulty: string;
  } | null = null;

  for (const course of courseOverview) {
    for (const subject of course.subjects || []) {
      for (const chapter of subject.chapters || []) {
        if (chapter.lessons && chapter.lessons.length > 0) {
          const l = chapter.lessons[0];
          nextLessonUnit = {
            courseName: course.name,
            subjectName: subject.name,
            chapterTitle: chapter.title,
            chapterId: chapter._id,
            lessonTitle: l.title,
            duration: l.estimatedDuration || 30,
            difficulty: l.difficulty || 'intermediate',
          };
          break;
        }
      }
      if (nextLessonUnit) break;
    }
    if (nextLessonUnit) break;
  }

  return (
    <div className="space-y-10 pb-16">
      {/* ── Brand Hero Header ────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 sm:px-10 py-14 sm:py-18 text-white select-none"
        style={{ backgroundColor: 'var(--brand-cherry)' }}
      >
        <TrajectoryBg />

        <div className="relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: 'rgba(247, 165, 27, 0.15)',
                color: 'var(--brand-amber)',
                border: '1px solid rgba(247, 165, 27, 0.3)',
              }}
            >
              JEE Advanced Track · 2026–27
            </span>
            <span className="text-xs text-stone-400">AMIT ACADEMY Portal</span>
          </motion.div>

          <motion.h1
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
            style={{ color: 'var(--brand-ivory)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            Mastery in motion.<br />
            Welcome back, <span style={{ color: 'var(--brand-amber)' }}>{firstName}</span>.
          </motion.h1>

          <motion.div
            className="mt-3 amber-line w-20"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: 'left' }}
            transition={{ delay: 0.15 }}
          />

          <motion.p
            className="mt-4 text-sm sm:text-base leading-relaxed max-w-2xl"
            style={{ color: 'rgba(227, 221, 211, 0.8)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            "Learn with purpose. Master with confidence." Seamlessly navigate your JEE curriculum,
            strengthen conceptual derivations, and solve targeted DPP assessments.
          </motion.p>

          {/* Quick Stat Counter Cards */}
          <motion.div
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="p-3.5 rounded-xl border" style={{ borderColor: 'rgba(227, 221, 211, 0.12)', backgroundColor: 'rgba(125, 24, 48, 0.2)' }}>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <GraduationCap size={14} />
                <span>Enrolled</span>
              </div>
              <p className="mt-1 font-display font-bold text-2xl" style={{ color: 'var(--brand-ivory)' }}>
                {summary.enrolledCourses}
              </p>
              <p className="text-[11px] text-stone-400">Active Batches</p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ borderColor: 'rgba(227, 221, 211, 0.12)', backgroundColor: 'rgba(125, 24, 48, 0.2)' }}>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <BookOpen size={14} />
                <span>Curriculum</span>
              </div>
              <p className="mt-1 font-display font-bold text-2xl" style={{ color: 'var(--brand-ivory)' }}>
                {summary.chapters}
              </p>
              <p className="text-[11px] text-stone-400">Chapters Open</p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ borderColor: 'rgba(227, 221, 211, 0.12)', backgroundColor: 'rgba(125, 24, 48, 0.2)' }}>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Layers size={14} />
                <span>Lessons</span>
              </div>
              <p className="mt-1 font-display font-bold text-2xl" style={{ color: 'var(--brand-ivory)' }}>
                {summary.lessons}
              </p>
              <p className="text-[11px] text-stone-400">Study Modules</p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ borderColor: 'rgba(227, 221, 211, 0.12)', backgroundColor: 'rgba(125, 24, 48, 0.2)' }}>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <FileText size={14} />
                <span>Practice</span>
              </div>
              <p className="mt-1 font-display font-bold text-2xl" style={{ color: 'var(--brand-ivory)' }}>
                {summary.dppAttempts ?? 0}
              </p>
              <p className="text-[11px] text-stone-400">DPPs Completed</p>
            </div>
          </motion.div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/student/learning" className="btn-amber inline-flex items-center gap-2 text-xs">
              <BookOpen size={14} /> My Learning
            </Link>
            <Link
              to="/student/practice"
              className="btn-outline inline-flex items-center gap-2 text-xs"
              style={{ borderColor: 'var(--brand-gold)', color: 'var(--brand-ivory)' }}
            >
              <FileText size={14} /> Practice DPPs
            </Link>
            <Link
              to="/student/results"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 text-stone-300 hover:text-amber-400 transition-colors"
            >
              <BarChart2 size={14} /> Score Analytics →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main Dashboard Body ──────────────────────────────────────── */}
      <div className="px-6 sm:px-10 space-y-10">
        {/* Loading Spinner */}
        {loadingDashboard && (
          <div className="flex items-center justify-center py-12 gap-3 card">
            <Loader2 size={20} className="animate-spin text-amber-500" />
            <p className="text-xs font-medium" style={{ color: 'var(--brand-earth)' }}>
              Synchronizing student academic profile…
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {errorDashboard && (
          <div className="card p-6 border-red-200 bg-red-50/50 flex items-start gap-4">
            <AlertCircle size={22} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-display font-bold text-sm text-red-900">
                Could not synchronize dashboard
              </h4>
              <p className="text-xs text-red-700 mt-1">
                Unable to load your live dashboard feed. Click retry below to reconnect with the server.
              </p>
              <button
                onClick={() => refetchDashboard()}
                className="btn-amber text-xs px-3 py-1.5 mt-3"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* ── Spotlight / Resume Learning Unit ────────────────────────── */}
        {nextLessonUnit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 relative overflow-hidden"
            style={{
              backgroundColor: 'var(--brand-white)',
              border: '1.5px solid rgba(247, 165, 27, 0.4)',
              boxShadow: '0 4px 20px -2px rgba(125, 24, 48, 0.08)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="badge-published text-[10px] flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-600" /> Up Next in Your Trajectory
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    {nextLessonUnit.subjectName}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-stone-900 leading-tight">
                  {nextLessonUnit.lessonTitle}
                </h3>
                <p className="text-xs text-stone-600">
                  Chapter: <strong>{nextLessonUnit.chapterTitle}</strong> · {nextLessonUnit.courseName}
                </p>

                <div className="flex items-center gap-4 text-xs text-stone-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-amber-600" />
                    {nextLessonUnit.duration} min study
                  </span>
                  <span className="capitalize font-medium text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded text-[10px]">
                    {nextLessonUnit.difficulty}
                  </span>
                </div>
              </div>

              <Link
                to={`/student/learning/chapter/${nextLessonUnit.chapterId}`}
                className="btn-amber inline-flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-6 self-start md:self-center flex-shrink-0"
              >
                <span>Enter Lesson</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Enrolled Academic Tracks ───────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-6">
            <div>
              <p className="section-label">Academic Curriculum</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
                Enrolled Course Tracks
              </h2>
            </div>
            <Link
              to="/student/learning"
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: 'var(--brand-burgundy)' }}
            >
              Full Syllabus Map →
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="card p-8 text-center border-dashed">
              <Compass size={36} className="mx-auto mb-3 opacity-30 text-amber-800" />
              <h4 className="font-display font-bold text-base text-stone-900">
                You are not enrolled in any JEE batches yet
              </h4>
              <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                Explore our curated Class 11 and Class 12 preparation tracks below and enroll in one click.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {courseOverview.map((course) => (
                <div
                  key={course._id}
                  className="rounded-2xl border overflow-hidden bg-white shadow-sm"
                  style={{ borderColor: 'rgba(98, 65, 51, 0.12)' }}
                >
                  {/* Course Header Banner */}
                  <div
                    className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ backgroundColor: 'var(--brand-burgundy)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-stone-900">
                          {course.code}
                        </span>
                        <h3 className="font-display font-bold text-base text-white">
                          {course.name}
                        </h3>
                      </div>
                      <p className="text-xs mt-1 text-stone-300">
                        Class {course.classLevel} JEE Preparation Track
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="badge-published text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        <CheckCircle2 size={11} className="inline mr-1" /> Enrolled
                      </span>
                      <Link
                        to="/student/learning"
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        Open Course →
                      </Link>
                    </div>
                  </div>

                  {/* Subject Grid inside Course */}
                  <div className="p-6 grid sm:grid-cols-3 gap-4 bg-stone-50/50">
                    {(course.subjects || []).map((subject) => {
                      const subjectChapters = subject.chapters || [];
                      return (
                        <div
                          key={subject._id}
                          className="p-4 rounded-xl border bg-white flex flex-col justify-between"
                          style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-xs" style={{ color: 'var(--brand-burgundy)' }}>
                                {subject.name}
                              </span>
                              <span className="badge-draft text-[10px]">
                                {subjectChapters.length} {subjectChapters.length === 1 ? 'Unit' : 'Units'}
                              </span>
                            </div>

                            {subjectChapters.length === 0 ? (
                              <p className="text-[11px] text-stone-400 italic py-2">
                                Syllabus being populated
                              </p>
                            ) : (
                              <div className="space-y-1.5 mt-2">
                                {subjectChapters.slice(0, 3).map((ch, idx) => (
                                  <Link
                                    key={ch._id}
                                    to={`/student/learning/chapter/${ch._id}`}
                                    className="flex items-center justify-between p-1.5 rounded hover:bg-amber-50 text-xs text-stone-700 transition-colors group"
                                  >
                                    <span className="truncate pr-2 font-medium">
                                      #{idx + 1} {ch.title}
                                    </span>
                                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-amber-600 transition-opacity" />
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>

                          <Link
                            to="/student/learning"
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 mt-4 inline-flex items-center gap-1 pt-2 border-t border-stone-100"
                          >
                            Explore Subject →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Explore & Enroll in More Courses Catalog ─────────────────── */}
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-6">
            <div>
              <p className="section-label">Course Catalog</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
                Available JEE Preparation Batches
              </h2>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              1-click enrollment with full syllabus access
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allCourses.map((c) => {
              const isEnrolled = enrolledCourseIds.has(c._id);
              const isPending = enrollMutation.isPending && enrollMutation.variables === c._id;

              return (
                <div
                  key={c._id}
                  className="card p-5 flex flex-col justify-between hover:border-amber-300 transition-colors"
                  style={{
                    backgroundColor: isEnrolled ? 'rgba(247, 165, 27, 0.03)' : 'var(--brand-white)',
                    borderColor: isEnrolled ? 'rgba(247, 165, 27, 0.3)' : 'rgba(98, 65, 51, 0.1)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {c.code}
                      </span>
                      {isEnrolled && (
                        <span className="badge-published text-[10px]">
                          ✓ Enrolled &amp; Active
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-base text-stone-900 mt-1">
                      {c.name}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {c.description || `Comprehensive JEE preparation curriculum designed for Class ${c.classLevel}.`}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(98, 65, 51, 0.08)' }}>
                    <span className="text-xs font-semibold text-stone-500">
                      Class Level: <strong>{c.classLevel}</strong>
                    </span>

                    {isEnrolled ? (
                      <Link
                        to="/student/learning"
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                      >
                        Study Unit →
                      </Link>
                    ) : (
                      <button
                        onClick={() => enrollMutation.mutate(c._id)}
                        disabled={isPending}
                        className="btn-amber text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-sm"
                      >
                        {isPending && <Loader2 size={12} className="animate-spin" />}
                        <span>Enroll Now</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Daily Practice Problems Launchpad ───────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-6">
            <div>
              <p className="section-label">Assessment Studio</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
                Daily Practice Problems (DPP)
              </h2>
            </div>
            <Link
              to="/student/practice"
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: 'var(--brand-burgundy)' }}
            >
              All DPPs ({dpps.length}) →
            </Link>
          </div>

          {dpps.length === 0 ? (
            <div className="card p-6 text-center text-xs text-stone-500">
              No daily practice problems published for your units today. Check back after your next chapter lesson!
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dpps.slice(0, 3).map((dpp) => (
                <div
                  key={dpp._id}
                  className="card p-5 flex flex-col justify-between hover:border-amber-300 transition-colors"
                >
                  <div>
                    <span className="badge-published text-[10px]">Active DPP</span>
                    <h4 className="font-display font-bold text-sm text-stone-900 mt-2">
                      {dpp.title}
                    </h4>
                    {dpp.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                        {dpp.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-3">
                      <span>{dpp.questionCount ?? dpp.questions?.length ?? 0} questions</span>
                      <span>·</span>
                      <span>{dpp.durationMinutes}m duration</span>
                      <span>·</span>
                      <span>{dpp.totalMarks} marks</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'rgba(98, 65, 51, 0.08)' }}>
                    <Link
                      to={`/student/exam/${dpp._id}/PRACTICE`}
                      className="btn-amber text-xs py-1.5 px-3 flex-1 text-center"
                    >
                      Practice Mode
                    </Link>
                    <Link
                      to={`/student/exam/${dpp._id}/EXAM`}
                      className="btn-outline text-xs py-1.5 px-3 flex-1 text-center"
                    >
                      Timed Exam
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
