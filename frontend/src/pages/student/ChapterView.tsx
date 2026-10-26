import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  FileText,
  Image,
  Clock,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { studentApi } from '../../api';
import type { LessonResource } from '../../types';

const RESOURCE_ICONS = {
  pdf: FileText,
  video: Play,
  image: Image,
};

function ResourceItem({ resource }: { resource: LessonResource }) {
  const Icon = RESOURCE_ICONS[resource.type] ?? FileText;
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border transition-all group hover:border-amber-300"
      style={{ borderColor: 'rgba(98,65,51,0.1)' }}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: 'rgba(247,165,27,0.12)' }}
      >
        <Icon size={16} style={{ color: 'var(--brand-amber)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--brand-cherry)' }}>
          {resource.title}
        </p>
        <p className="text-xs capitalize" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
          {resource.type}
        </p>
      </div>
      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--brand-amber)' }}>
        Open →
      </span>
    </a>
  );
}

export default function ChapterView() {
  const { chapterId } = useParams<{ chapterId: string }>();

  // Get student dashboard to resolve chapter title and course context
  const { data: dashboard } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res = await studentApi.getDashboard();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const currentChapter = dashboard?.courseOverview
    ?.flatMap((c) => c.subjects || [])
    ?.flatMap((s) => s.chapters || [])
    ?.find((ch) => ch._id === chapterId);

  const { data: lessons, isLoading, isError, error } = useQuery({
    queryKey: ['student-lessons', chapterId],
    queryFn: async () => {
      const res = await studentApi.getLessonsByChapter(chapterId!);
      return res.data.data;
    },
    enabled: !!chapterId,
    staleTime: 60_000,
  });

  const errorMessage = (error as import('axios').AxiosError<{ message: string }>)?.response?.data?.message;

  return (
    <div className="px-6 sm:px-10 py-10 max-w-3xl">
      <Link
        to="/student/learning"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: 'var(--brand-earth)' }}
      >
        <ArrowLeft size={15} />
        Back to Learning
      </Link>

      <div className="mb-8">
        <p className="section-label">Chapter</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
          {currentChapter?.title || 'Chapter Lessons'}
        </h2>
        {currentChapter?.description && (
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--brand-earth)', opacity: 0.75 }}>
            {currentChapter.description}
          </p>
        )}

        {currentChapter?.resources && currentChapter.resources.length > 0 && (
          <div className="mt-4 p-4 rounded-xl border bg-amber-50/60" style={{ borderColor: 'rgba(247,165,27,0.3)' }}>
            <p className="section-label mb-2" style={{ color: 'var(--brand-burgundy)' }}>
              Chapter Study Notes &amp; Handouts
            </p>
            <div className="grid gap-2">
              {currentChapter.resources.map((r) => (
                <ResourceItem key={r._id || r.fileId} resource={r} />
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 amber-line w-12" />
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-12 justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
          <p style={{ color: 'var(--brand-earth)' }}>Loading lessons…</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center py-12 gap-3 text-center card">
          <AlertCircle size={24} style={{ color: 'var(--brand-crimson)' }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--brand-cherry)' }}>
            {errorMessage || 'Could not load lessons'}
          </p>
          <p className="text-xs max-w-sm" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
            This chapter may not be published yet, or you need to be enrolled in the corresponding course.
          </p>
          <Link to="/student/learning" className="btn-amber text-xs px-4 py-2 mt-2">
            View All Courses &amp; Enroll
          </Link>
        </div>
      )}

      {lessons && lessons.length === 0 && (
        <div className="text-center py-12 card">
          <BookOpen size={36} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--brand-burgundy)' }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--brand-cherry)' }}>No lessons published yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
            Check back soon when your educator publishes lesson modules for this chapter.
          </p>
        </div>
      )}

      {lessons && lessons.length > 0 && (
        <div className="space-y-4">
          {lessons.map((lesson, idx) => (
            <motion.div
              key={lesson._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'rgba(98,65,51,0.1)' }}
            >
              {/* Lesson header */}
              <div className="px-6 py-5" style={{ backgroundColor: 'var(--brand-ivory)' }}>
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: 'rgba(125,24,48,0.1)',
                      color: 'var(--brand-burgundy)',
                    }}
                  >
                    {lesson.order || idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {lesson.estimatedDuration > 0 && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
                          <Clock size={11} />
                          {lesson.estimatedDuration} min
                        </span>
                      )}
                      <span
                        className="text-xs font-medium capitalize"
                        style={{ color: 'var(--brand-earth)', opacity: 0.6 }}
                      >
                        {lesson.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                {lesson.topics && lesson.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 ml-13">
                    {lesson.topics.map((t) => (
                      <span key={t} className="badge-published">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Resources */}
              {lesson.resources && lesson.resources.length > 0 && (
                <div className="px-6 py-4 space-y-2 border-t" style={{ borderColor: 'rgba(98,65,51,0.07)' }}>
                  <p className="section-label mb-3">Study Resources</p>
                  {lesson.resources.map((r) => (
                    <ResourceItem key={r._id} resource={r} />
                  ))}
                </div>
              )}

              {(!lesson.resources || lesson.resources.length === 0) && (
                <div className="px-6 py-3 border-t" style={{ borderColor: 'rgba(98,65,51,0.07)' }}>
                  <p className="text-xs" style={{ color: 'rgba(98,65,51,0.45)' }}>
                    No media resources attached to this lesson yet.
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
