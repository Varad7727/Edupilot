import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api';
import type { DPP } from '../../types';

function DPPCard({ dpp }: { dpp: DPP }) {
  const deadline = new Date(dpp.deadline);
  const isExpired = deadline < new Date();

  return (
    <motion.div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'rgba(98,65,51,0.1)' }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div
        className="px-6 py-5"
        style={{ backgroundColor: 'var(--brand-ivory)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display font-bold text-base leading-tight" style={{ color: 'var(--brand-cherry)' }}>
              {dpp.title}
            </p>
            {dpp.description && (
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
                {dpp.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            {isExpired ? (
              <span className="badge-crimson">Expired</span>
            ) : (
              <span className="badge-published">Active</span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
          <span className="flex items-center gap-1.5">
            <FileText size={11} />
            {(dpp.questionCount ?? dpp.questions?.length ?? 0)} question{(dpp.questionCount ?? dpp.questions?.length ?? 0) !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            {dpp.durationMinutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen size={11} />
            {dpp.totalMarks} marks
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={11} />
            Due {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        className="px-6 py-4 flex items-center gap-3 border-t"
        style={{ borderColor: 'rgba(98,65,51,0.07)' }}
      >
        <Link
          to={`/student/exam/${dpp._id}/PRACTICE`}
          className="btn-amber text-sm"
          style={{ padding: '0.5rem 1.25rem' }}
        >
          Practice Mode
        </Link>
        <Link
          to={`/student/exam/${dpp._id}/EXAM`}
          className="btn-outline text-sm"
          style={{ padding: '0.5rem 1.25rem' }}
        >
          Exam Mode
        </Link>
      </div>
    </motion.div>
  );
}

export default function StudentPractice() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-dpps'],
    queryFn: async () => {
      const res = await studentApi.getDpps();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  return (
    <div className="px-6 sm:px-10 py-10">
      <div className="mb-8">
        <p className="section-label">Daily Practice Problems</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
          Practice &amp; DPPs
        </h2>
        <div className="mt-2 amber-line w-12" />
        <p className="mt-3 text-sm" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
          Attempt DPPs in Practice mode to see explanations, or in Exam mode for a timed challenge.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
          <p style={{ color: 'var(--brand-earth)' }}>Loading DPPs…</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <AlertCircle size={24} style={{ color: 'var(--brand-crimson)' }} />
          <p className="font-semibold" style={{ color: 'var(--brand-cherry)' }}>Could not load DPPs</p>
          <p className="text-sm" style={{ color: 'var(--brand-earth)' }}>
            Ensure you are enrolled in a course and the backend is running.
          </p>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="text-center py-20">
          <FileText size={36} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--brand-burgundy)' }} />
          <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--brand-cherry)' }}>
            No DPPs available yet
          </h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--brand-earth)' }}>
            Your teacher hasn't published any DPPs for your enrolled courses.
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.map((dpp, i) => (
            <motion.div
              key={dpp._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <DPPCard dpp={dpp} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
