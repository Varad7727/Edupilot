import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Layers,
  ChevronRight,
  Loader2,
  FileSearch,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentApi, courseApi } from '../../api';
import type { Course } from '../../types';

export default function StudentLearning() {
  const queryClient = useQueryClient();

  // 1. Enrolled courses
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['student-enrollments'],
    queryFn: async () => {
      const res = await studentApi.getEnrollments();
      return res.data.data;
    },
    staleTime: 30_000,
  });

  // 2. Full curriculum overview
  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res = await studentApi.getDashboard();
      return res.data.data;
    },
    staleTime: 30_000,
  });

  // 3. All available courses
  const { data: allCoursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const res = await courseApi.getAll();
      return res.data?.data || (Array.isArray(res.data) ? res.data : []);
    },
    staleTime: 60_000,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => studentApi.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['all-courses'] });
    },
  });

  const isLoading = loadingEnrollments || loadingDashboard || loadingCourses;
  const enrolledCoursesList = dashboard?.enrolledCourses || [];
  const enrolledCourseIds = new Set(enrolledCoursesList.map((c) => c._id));
  const courseOverview = dashboard?.courseOverview || [];
  const allCourses = (allCoursesData || []) as Course[];

  return (
    <div className="px-6 sm:px-10 py-10 space-y-10 max-w-6xl">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-label">Academic Curriculum</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
            Curriculum &amp; Syllabus
          </h2>
          <div className="mt-2 amber-line w-14" />
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="badge-published text-[11px]">
            {enrolledCoursesList.length} Active {enrolledCoursesList.length === 1 ? 'Batch' : 'Batches'}
          </span>
          <span>·</span>
          <span>{dashboard?.summary?.chapters || 0} Units Accessible</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-16 justify-center card">
          <Loader2 size={20} className="animate-spin text-amber-500" />
          <p className="text-xs" style={{ color: 'var(--brand-earth)' }}>
            Loading your academic learning tracks…
          </p>
        </div>
      )}

      {/* ── If not enrolled in any course ────────────────────────────── */}
      {!isLoading && enrolledCoursesList.length === 0 && (
        <div className="card p-10 text-center border-dashed">
          <FileSearch size={40} className="mx-auto mb-4 opacity-30 text-amber-800" />
          <h3 className="font-display text-xl font-bold text-stone-900">
            No Active Course Enrolled
          </h3>
          <p className="mt-2 text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
            Select a targeted JEE preparation batch below to unlock subjects, chapter syllabus,
            detailed derivations, and practice DPPs.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {allCourses.map((course) => {
              const isPending = enrollMutation.isPending && enrollMutation.variables === course._id;
              return (
                <div
                  key={course._id}
                  className="card p-5 flex flex-col justify-between hover:border-amber-300 transition-colors"
                >
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      {course.code}
                    </span>
                    <h4 className="font-display font-bold text-base text-stone-900 mt-2">
                      {course.name}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      {course.description || `JEE Class ${course.classLevel} full syllabus track.`}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(98, 65, 51, 0.08)' }}>
                    <span className="text-xs font-semibold text-stone-500">
                      Class Level: <strong>{course.classLevel}</strong>
                    </span>
                    <button
                      onClick={() => enrollMutation.mutate(course._id)}
                      disabled={isPending}
                      className="btn-amber text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-sm"
                    >
                      {isPending && <Loader2 size={12} className="animate-spin" />}
                      <span>Enroll in Batch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Enrolled Course Overviews ─────────────────────────── */}
      {!isLoading && courseOverview.length > 0 && (
        <div className="space-y-8">
          {courseOverview.map((course, ci) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.06 }}
              className="rounded-2xl border overflow-hidden bg-white shadow-sm"
              style={{ borderColor: 'rgba(98,65,51,0.12)' }}
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
                    <h3 className="font-display text-lg font-bold text-white">
                      {course.name}
                    </h3>
                  </div>
                  <p className="text-xs mt-1 text-stone-300">
                    Class {course.classLevel} JEE Track
                    {course.description && ` · ${course.description}`}
                  </p>
                </div>

                <span className="badge-published text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 self-start sm:self-center">
                  <CheckCircle2 size={11} className="inline mr-1" /> Active Enrollment
                </span>
              </div>

              {/* Subjects & Chapter Sections */}
              {(course.subjects || []).map((subject) => {
                const subjectChapters = subject.chapters || [];
                return (
                  <div
                    key={subject._id}
                    className="border-t"
                    style={{ borderColor: 'rgba(98,65,51,0.08)' }}
                  >
                    {/* Subject Header */}
                    <div
                      className="px-6 py-3.5 flex items-center justify-between gap-3"
                      style={{ backgroundColor: 'rgba(247,165,27,0.05)' }}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} style={{ color: 'var(--brand-amber)' }} />
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--brand-burgundy)' }}>
                          {subject.name} ({subject.code})
                        </h4>
                      </div>
                      <span className="badge-draft text-[10px]">
                        {subjectChapters.length} {subjectChapters.length === 1 ? 'Chapter' : 'Chapters'}
                      </span>
                    </div>

                    {/* Chapters List */}
                    {subjectChapters.length === 0 ? (
                      <div className="px-6 py-4 text-xs text-stone-400 italic">
                        Curriculum syllabus for {subject.name} is currently being scheduled by faculty.
                      </div>
                    ) : (
                      <div className="divide-y divide-amber-900/10">
                        {subjectChapters.map((chapter) => {
                          const lessonsCount = chapter.lessons ? chapter.lessons.length : 0;
                          const resourcesCount = chapter.resources ? chapter.resources.length : 0;

                          return (
                            <Link
                              key={chapter._id}
                              to={`/student/learning/chapter/${chapter._id}`}
                              className="flex items-center gap-4 px-6 py-4 group transition-colors hover:bg-amber-50/70"
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                style={{
                                  backgroundColor: 'rgba(125, 24, 48, 0.1)',
                                  color: 'var(--brand-burgundy)',
                                }}
                              >
                                #{chapter.order}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-stone-900 group-hover:text-amber-700 transition-colors truncate">
                                    {chapter.title}
                                  </p>
                                  {resourcesCount > 0 && (
                                    <span className="badge-published text-[10px] flex items-center gap-1">
                                      <FileText size={10} /> {resourcesCount} {resourcesCount === 1 ? 'Note' : 'Notes'}
                                    </span>
                                  )}
                                </div>
                                {chapter.description && (
                                  <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">
                                    {chapter.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-stone-500">
                                <span>
                                  {lessonsCount} {lessonsCount === 1 ? 'lesson' : 'lessons'}
                                </span>
                                <Layers size={13} className="opacity-40" />
                                <ChevronRight
                                  size={14}
                                  className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-amber-600"
                                />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {course.subjects.length === 0 && (
                <p className="px-6 py-5 text-xs text-stone-500 italic">
                  No subjects listed for this course yet.
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Additional Batches Catalog (Always accessible) ───────────── */}
      {!isLoading && enrolledCoursesList.length > 0 && (
        <div className="pt-6 border-t" style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}>
          <div className="flex items-baseline justify-between gap-3 mb-6">
            <div>
              <p className="section-label">Course Directory</p>
              <h3 className="mt-1 font-display text-xl font-bold text-stone-900">
                All Available Preparation Batches
              </h3>
            </div>
            <span className="text-xs text-stone-500">Enroll in additional tracks anytime</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCourses.map((c) => {
              const isEnrolled = enrolledCourseIds.has(c._id);
              const isPending = enrollMutation.isPending && enrollMutation.variables === c._id;

              return (
                <div
                  key={c._id}
                  className="card p-5 flex flex-col justify-between"
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

                    <h4 className="font-display font-bold text-base text-stone-900">
                      {c.name}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {c.description || `JEE Class ${c.classLevel} complete syllabus course.`}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(98, 65, 51, 0.08)' }}>
                    <span className="text-xs font-semibold text-stone-500">
                      Class Level: <strong>{c.classLevel}</strong>
                    </span>

                    {isEnrolled ? (
                      <span className="text-xs font-bold text-stone-500">
                        Enrolled
                      </span>
                    ) : (
                      <button
                        onClick={() => enrollMutation.mutate(c._id)}
                        disabled={isPending}
                        className="btn-amber text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm"
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
      )}
    </div>
  );
}
