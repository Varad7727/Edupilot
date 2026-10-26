import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, FileText, Clock, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { attemptApi } from '../../api';
import type { Attempt } from '../../types';

function AttemptRow({ attempt, idx }: { attempt: Attempt; idx: number }) {
  const dpp = attempt.dpp as { _id: string; title: string } | string;
  const title = typeof dpp === 'object' ? dpp.title : 'DPP';
  const dppId = typeof dpp === 'object' ? dpp._id : dpp;
  const date = new Date(attempt.submittedAt ?? attempt.startedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="card flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ padding: '1rem 1.5rem' }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--brand-cherry)' }}>
          {title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Target size={10} />
            {attempt.mode}
          </span>
          <span className={attempt.status === 'SUBMITTED' ? '' : 'badge-crimson'}>
            {attempt.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="text-center">
          <p className="font-bold text-lg font-display" style={{ color: 'var(--brand-amber)' }}>
            {attempt.score}<span className="text-xs font-normal opacity-50">/{attempt.maxScore}</span>
          </p>
          <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.5 }}>score</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-lg font-display" style={{ color: 'var(--brand-cherry)' }}>
            {attempt.accuracy.toFixed(0)}%
          </p>
          <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.5 }}>accuracy</p>
        </div>
        <Link
          to={`/student/results/${attempt._id}`}
          className="btn-amber text-xs"
          style={{ padding: '0.4rem 0.875rem' }}
        >
          View
        </Link>
      </div>
    </motion.div>
  );
}

export default function StudentResults() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: async () => {
      const res = await attemptApi.getMyAttempts();
      return res.data.data;
    },
    staleTime: 30_000,
  });

  return (
    <div className="px-6 sm:px-10 py-10">
      <div className="mb-8">
        <p className="section-label">History</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
          Results &amp; Attempts
        </h2>
        <div className="mt-2 amber-line w-12" />
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
          <p style={{ color: 'var(--brand-earth)' }}>Loading results…</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <AlertCircle size={24} style={{ color: 'var(--brand-crimson)' }} />
          <p className="font-semibold" style={{ color: 'var(--brand-cherry)' }}>Could not load results</p>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="text-center py-20">
          <FileText size={36} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--brand-burgundy)' }} />
          <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--brand-cherry)' }}>
            No attempts yet
          </h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--brand-earth)' }}>
            Complete a DPP to see your results here.
          </p>
          <Link to="/student/practice" className="btn-amber inline-flex mt-6">Practice Now</Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((attempt, i) => (
            <AttemptRow key={attempt._id} attempt={attempt} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}
