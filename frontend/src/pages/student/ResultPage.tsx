import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Target,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { attemptApi } from '../../api';
import type { Attempt, ReviewItem } from '../../types';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

function ScoreRing({ accuracy }: { accuracy: number }) {
  const data = [{ value: accuracy, fill: 'var(--brand-amber)' }];
  return (
    <div className="relative w-32 h-32">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="60%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'rgba(98,65,51,0.1)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-xl font-bold" style={{ color: 'var(--brand-cherry)' }}>
          {accuracy.toFixed(0)}%
        </p>
        <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>accuracy</p>
      </div>
    </div>
  );
}

function ReviewCard({ item, index }: { item: ReviewItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'rgba(98,65,51,0.1)' }}
    >
      <div
        className="px-5 py-4"
        style={{ backgroundColor: 'var(--brand-ivory)' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {item.attempted
              ? item.isCorrect
                ? <CheckCircle2 size={18} style={{ color: 'var(--brand-amber)' }} />
                : <XCircle size={18} style={{ color: 'var(--brand-crimson)' }} />
              : <MinusCircle size={18} style={{ color: 'var(--brand-earth)', opacity: 0.4 }} />}
          </div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-cherry)' }}>
              {item.questionText}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
              <span>Marks: <strong style={{ color: item.marks >= 0 ? 'var(--brand-amber)' : 'var(--brand-crimson)' }}>{item.marks >= 0 ? '+' : ''}{item.marks}</strong></span>
              {!item.attempted && <span className="badge-draft">Not attempted</span>}
            </div>
          </div>
        </div>

        {/* Options */}
        {item.options && item.options.length > 0 && (
          <div className="mt-4 space-y-1.5 ml-7">
            {item.options.map((opt) => {
              const isCorrect = Array.isArray(item.correctAnswer) && item.correctAnswer.includes(opt.key);
              const isSelected = item.selectedOptions?.includes(opt.key);
              return (
                <div
                  key={opt.key}
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: isCorrect
                      ? 'rgba(247,165,27,0.12)'
                      : isSelected
                        ? 'rgba(181,45,54,0.08)'
                        : 'transparent',
                    color: 'var(--brand-earth)',
                  }}
                >
                  <span className="font-semibold w-4">{opt.key}</span>
                  <span>{opt.text}</span>
                  {isCorrect && <span className="ml-auto" style={{ color: 'var(--brand-amber)' }}>✓ Correct</span>}
                  {isSelected && !isCorrect && <span className="ml-auto" style={{ color: 'var(--brand-crimson)' }}>✗ Your answer</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Explanation */}
        {item.explanation && (
          <div
            className="mt-4 px-4 py-3 rounded-xl text-sm leading-relaxed ml-7"
            style={{ backgroundColor: 'rgba(247,165,27,0.07)', color: 'var(--brand-earth)' }}
          >
            <strong style={{ color: 'var(--brand-amber)' }}>Explanation: </strong>
            {item.explanation}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: async () => {
      const res = await attemptApi.getResult(attemptId!);
      return res.data.data as Attempt & { review?: ReviewItem[] };
    },
    enabled: !!attemptId,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
        <p style={{ color: 'var(--brand-earth)' }}>Loading results…</p>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="flex flex-col items-center py-24 gap-3 text-center">
        <AlertCircle size={24} style={{ color: 'var(--brand-crimson)' }} />
        <p className="font-semibold" style={{ color: 'var(--brand-cherry)' }}>Could not load result</p>
        <Link to="/student/results" className="btn-amber text-sm">View All Results</Link>
      </div>
    );
  }

  const minutes = Math.floor(result.timeTakenSeconds / 60);
  const seconds = result.timeTakenSeconds % 60;

  return (
    <div className="px-6 sm:px-10 py-10 max-w-3xl">
      <Link
        to="/student/results"
        className="inline-flex items-center gap-2 text-sm mb-8"
        style={{ color: 'var(--brand-earth)' }}
      >
        <ArrowLeft size={15} />
        All Results
      </Link>

      {/* Result Hero */}
      <motion.div
        className="rounded-3xl overflow-hidden mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: 'var(--brand-cherry)' }}
      >
        <div className="px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div>
            <p className="section-label" style={{ color: 'rgba(247,165,27,0.6)' }}>
              {result.mode === 'EXAM' ? 'Examination' : 'Practice'} Result
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--brand-ivory)' }}>
              {typeof result.dpp === 'object' ? result.dpp.title : 'DPP Result'}
            </h2>
            <div className="mt-3 amber-line w-12" />

            {/* Score */}
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold" style={{ color: 'var(--brand-amber)' }}>
                {result.score}
              </span>
              <span className="text-lg font-medium" style={{ color: 'rgba(227,221,211,0.5)' }}>
                / {result.maxScore}
              </span>
            </div>
          </div>
          <div className="sm:ml-auto">
            <ScoreRing accuracy={result.accuracy} />
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-3 border-t"
          style={{ borderColor: 'rgba(227,221,211,0.06)' }}
        >
          <div className="px-6 py-4 text-center">
            <p className="font-bold text-xl" style={{ color: '#4ade80' }}>{result.correctCount}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(227,221,211,0.45)' }}>Correct</p>
          </div>
          <div className="px-6 py-4 text-center border-x" style={{ borderColor: 'rgba(227,221,211,0.06)' }}>
            <p className="font-bold text-xl" style={{ color: 'var(--brand-crimson)' }}>{result.incorrectCount}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(227,221,211,0.45)' }}>Wrong</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="font-bold text-xl" style={{ color: 'rgba(227,221,211,0.5)' }}>{result.unansweredCount}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(227,221,211,0.45)' }}>Skipped</p>
          </div>
        </div>
      </motion.div>

      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        <div className="card flex items-center gap-3">
          <Clock size={16} style={{ color: 'var(--brand-amber)' }} />
          <div>
            <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>Time Taken</p>
            <p className="font-semibold text-sm" style={{ color: 'var(--brand-cherry)' }}>
              {minutes}m {seconds}s
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <Target size={16} style={{ color: 'var(--brand-amber)' }} />
          <div>
            <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>Mode</p>
            <p className="font-semibold text-sm" style={{ color: 'var(--brand-cherry)' }}>
              {result.mode}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <TrendingUp size={16} style={{ color: 'var(--brand-amber)' }} />
          <div>
            <p className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>Status</p>
            <p className="font-semibold text-sm" style={{ color: 'var(--brand-cherry)' }}>
              {result.status}
            </p>
          </div>
        </div>
      </div>

      {/* Topic Report */}
      {result.topicReport.length > 0 && (
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-4">
            <p className="section-label">Topic Breakdown</p>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(98,65,51,0.08)' }} />
          </div>
          <div className="space-y-2.5">
            {result.topicReport.map((topic) => (
              <div key={topic.topic} className="card py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--brand-cherry)' }}>
                    {topic.topic}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
                    {topic.correct}/{topic.total} correct
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(98,65,51,0.08)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(topic.correct / topic.total) * 100}%`,
                      backgroundColor: 'var(--brand-amber)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review (only in PRACTICE mode) */}
      {result.mode === 'PRACTICE' && result.review && result.review.length > 0 && (
        <div>
          <div className="flex items-baseline gap-3 mb-4">
            <p className="section-label">Detailed Review</p>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(98,65,51,0.08)' }} />
          </div>
          <div className="space-y-4">
            {result.review.map((item, i) => (
              <ReviewCard key={item.questionId} item={item} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-3 mt-10">
        <Link to="/student/practice" className="btn-amber">
          Practice More
        </Link>
        <Link to="/student" className="btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
