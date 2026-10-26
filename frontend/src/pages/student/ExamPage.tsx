import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Flag,
  Send,
} from 'lucide-react';
import { attemptApi } from '../../api';
import type { PublicQuestion, AttemptMode } from '../../types';
import 'katex/dist/katex.min.css';

// ── Math rendering (KaTeX) ────────────────────────────────────────────────────
function MathText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    import('katex').then((katex) => {
      try {
        // Render inline math between $ $ and display math between $$ $$
        const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
        ref.current!.innerHTML = parts
          .map((part) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
              return katex.default.renderToString(part.slice(2, -2), {
                displayMode: true,
                throwOnError: false,
              });
            }
            if (part.startsWith('$') && part.endsWith('$')) {
              return katex.default.renderToString(part.slice(1, -1), {
                displayMode: false,
                throwOnError: false,
              });
            }
            return part;
          })
          .join('');
      } catch {
        ref.current!.innerText = text;
      }
    });
  }, [text]);
  return <span ref={ref}>{text}</span>;
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function Timer({
  deadline,
  onExpired,
}: {
  deadline: string | null;
  onExpired: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const target = new Date(deadline).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setRemaining(diff);
      if (diff === 0) onExpired();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  if (remaining === null) return null;

  const totalSecs = Math.floor(remaining / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const formatted = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const isUrgent = totalSecs < 300; // < 5 minutes

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold"
      style={{
        backgroundColor: isUrgent ? 'rgba(181,45,54,0.15)' : 'rgba(247,165,27,0.15)',
        color: isUrgent ? 'var(--brand-crimson)' : 'var(--brand-amber)',
      }}
    >
      <Clock size={13} />
      {formatted}
    </div>
  );
}

// ── Question Palette ──────────────────────────────────────────────────────────
type QuestionState = 'not-visited' | 'visited' | 'answered' | 'review';

function Palette({
  questions,
  current,
  states,
  onGo,
}: {
  questions: PublicQuestion[];
  current: number;
  states: Map<string, QuestionState>;
  onGo: (idx: number) => void;
}) {
  const stateStyle = (qid: string, idx: number): React.CSSProperties => {
    if (idx === current) return { backgroundColor: 'var(--brand-amber)', color: 'var(--brand-cherry)' };
    const s = states.get(qid) ?? 'not-visited';
    switch (s) {
      case 'answered': return { backgroundColor: 'rgba(247,165,27,0.25)', color: 'var(--brand-earth)' };
      case 'review': return { backgroundColor: 'rgba(125,24,48,0.2)', color: 'var(--brand-burgundy)' };
      case 'visited': return { backgroundColor: 'rgba(98,65,51,0.1)', color: 'var(--brand-earth)' };
      default: return { backgroundColor: 'transparent', border: '1px solid rgba(227,221,211,0.2)', color: 'rgba(227,221,211,0.5)' };
    }
  };

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(227,221,211,0.08)' }}
    >
      <p className="section-label mb-3" style={{ color: 'rgba(227,221,211,0.5)' }}>
        Question Palette
      </p>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.questionId}
            onClick={() => onGo(i)}
            className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
            style={stateStyle(q.questionId, i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-xs" style={{ color: 'rgba(227,221,211,0.4)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(247,165,27,0.25)' }} />
          Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(125,24,48,0.2)' }} />
          Review
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(98,65,51,0.1)' }} />
          Visited
        </span>
      </div>
    </div>
  );
}

// ── Main Exam Page ────────────────────────────────────────────────────────────
export default function ExamPage() {
  const { dppId, mode } = useParams<{ dppId: string; mode: string }>();
  const navigate = useNavigate();
  const examMode = (mode?.toUpperCase() ?? 'PRACTICE') as AttemptMode;

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerMap, setAnswerMap] = useState<
    Map<string, { selectedOptions: string[]; numericalAnswer: number | null; markedForReview: boolean; visited: boolean }>
  >(new Map());
  const [qStates, setQStates] = useState<Map<string, QuestionState>>(new Map());
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [startError, setStartError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const saveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start attempt
  const startMutation = useMutation({
    mutationFn: () => attemptApi.start(dppId!, examMode),
    onSuccess: (res) => {
      const { attemptId: aId, questions: qs, deadline: dl } = res.data.data;
      setAttemptId(aId);
      setQuestions(qs);
      setDeadline(dl);
      const initMap = new Map(qs.map((q) => [
        q.questionId,
        { selectedOptions: [], numericalAnswer: null, markedForReview: false, visited: false },
      ]));
      setAnswerMap(initMap);
      setQStates(new Map(qs.map((q) => [q.questionId, 'not-visited' as QuestionState])));
      setStarted(true);
    },
    onError: (err: import('axios').AxiosError<{ message: string }>) => {
      setStartError(err.response?.data?.message ?? 'Could not start attempt.');
    },
  });

  const currentQ = questions[currentIdx];

  // Mark visited on navigation
  useEffect(() => {
    if (!currentQ) return;
    setQStates((prev) => {
      const next = new Map(prev);
      if (next.get(currentQ.questionId) === 'not-visited') {
        next.set(currentQ.questionId, 'visited');
      }
      return next;
    });
    setAnswerMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(currentQ.questionId);
      if (cur) next.set(currentQ.questionId, { ...cur, visited: true });
      return next;
    });
  }, [currentIdx, currentQ]);

  // Debounced save answer
  const saveAnswer = useCallback(
    (qid: string, payload: object) => {
      if (!attemptId) return;
      if (saveDebounce.current) clearTimeout(saveDebounce.current);
      saveDebounce.current = setTimeout(async () => {
        try {
          await attemptApi.saveAnswer(attemptId, { questionId: qid, ...payload } as Parameters<typeof attemptApi.saveAnswer>[1]);
        } catch { /* silent, we keep local state */ }
      }, 400);
    },
    [attemptId]
  );

  const selectOption = (key: string) => {
    if (!currentQ) return;
    setAnswerMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(currentQ.questionId) ?? { selectedOptions: [], numericalAnswer: null, markedForReview: false, visited: true };
      let selected = [...cur.selectedOptions];
      if (currentQ.questionType === 'SINGLE_CORRECT') {
        selected = selected[0] === key ? [] : [key];
      } else {
        selected = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
      }
      const updated = { ...cur, selectedOptions: selected, visited: true };
      next.set(currentQ.questionId, updated);
      // Update state
      setQStates((ps) => {
        const ns = new Map(ps);
        ns.set(currentQ.questionId, selected.length > 0 ? 'answered' : 'visited');
        return ns;
      });
      saveAnswer(currentQ.questionId, { selectedOptions: selected, markedForReview: cur.markedForReview, visited: true });
      return next;
    });
  };

  const setNumerical = (val: string) => {
    if (!currentQ) return;
    const num = val === '' ? null : parseFloat(val);
    setAnswerMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(currentQ.questionId) ?? { selectedOptions: [], numericalAnswer: null, markedForReview: false, visited: true };
      const updated = { ...cur, numericalAnswer: Number.isNaN(num) ? null : num, visited: true };
      next.set(currentQ.questionId, updated);
      setQStates((ps) => {
        const ns = new Map(ps);
        ns.set(currentQ.questionId, num !== null && !Number.isNaN(num) ? 'answered' : 'visited');
        return ns;
      });
      saveAnswer(currentQ.questionId, { numericalAnswer: num, markedForReview: cur.markedForReview, visited: true });
      return next;
    });
  };

  const toggleReview = () => {
    if (!currentQ) return;
    setAnswerMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(currentQ.questionId);
      if (!cur) return prev;
      const updated = { ...cur, markedForReview: !cur.markedForReview };
      next.set(currentQ.questionId, updated);
      setQStates((ps) => {
        const ns = new Map(ps);
        ns.set(currentQ.questionId, updated.markedForReview ? 'review' : (updated.selectedOptions.length > 0 || updated.numericalAnswer !== null ? 'answered' : 'visited'));
        return ns;
      });
      saveAnswer(currentQ.questionId, { ...updated });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    setIsSubmitting(true);
    try {
      await attemptApi.submit(attemptId);
      navigate(`/student/results/${attemptId}`);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleExpired = useCallback(() => {
    if (attemptId) {
      attemptApi.submit(attemptId).catch(() => {});
      navigate(`/student/results/${attemptId}`);
    }
  }, [attemptId, navigate]);

  // ── Pre-start screen ─────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--brand-cherry)' }}>
        <motion.div
          className="max-w-md w-full mx-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(247,165,27,0.15)' }}>
            <Clock size={28} style={{ color: 'var(--brand-amber)' }} />
          </div>
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--brand-ivory)' }}>
            Ready to begin?
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'rgba(227,221,211,0.6)' }}>
            Mode: <strong style={{ color: 'var(--brand-amber)' }}>{examMode}</strong>
            {examMode === 'EXAM' && ' · Timer will start immediately.'}
          </p>
          {startError && (
            <p className="mt-4 text-sm" style={{ color: 'var(--brand-crimson)' }}>
              {startError}
            </p>
          )}
          <div className="flex gap-3 justify-center mt-8">
            <button
              onClick={() => navigate(-1)}
              className="btn-outline"
              style={{ borderColor: 'rgba(227,221,211,0.2)', color: 'var(--brand-ivory)' }}
            >
              Go Back
            </button>
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="btn-amber flex items-center gap-2"
            >
              {startMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Start {examMode === 'EXAM' ? 'Exam' : 'Practice'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Active Exam ──────────────────────────────────────────────────────────
  const cur = currentQ ? (answerMap.get(currentQ.questionId) ?? { selectedOptions: [], numericalAnswer: null, markedForReview: false, visited: false }) : null;
  const answeredCount = [...qStates.values()].filter((s) => s === 'answered').length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: 'var(--brand-cherry)', color: 'var(--brand-ivory)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="lg:w-72 xl:w-80 flex-shrink-0 p-5 border-r" style={{ borderColor: 'rgba(227,221,211,0.06)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="section-label" style={{ color: 'rgba(247,165,27,0.6)' }}>
              {examMode === 'EXAM' ? 'Examination' : 'Practice'}
            </p>
            <p className="font-display font-bold text-sm" style={{ color: 'var(--brand-ivory)' }}>
              {questions.length} Questions
            </p>
          </div>
          {examMode === 'EXAM' && deadline && (
            <Timer deadline={deadline} onExpired={handleExpired} />
          )}
        </div>

        <Palette questions={questions} current={currentIdx} states={qStates} onGo={setCurrentIdx} />

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(227,221,211,0.45)' }}>
            <span>Answered</span>
            <span>{answeredCount} / {questions.length}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(227,221,211,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--brand-amber)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => setSubmitConfirm(true)}
          disabled={isSubmitting}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors"
          style={{ backgroundColor: 'var(--brand-amber)', color: 'var(--brand-cherry)' }}
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Submit {examMode === 'EXAM' ? 'Exam' : 'Practice'}
        </button>
      </aside>

      {/* ── Question Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {currentQ && cur && (
            <motion.div
              key={currentQ.questionId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="flex-1 p-6 sm:p-10 flex flex-col"
            >
              {/* Q number and meta */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: 'rgba(247,165,27,0.15)', color: 'var(--brand-amber)' }}
                >
                  {currentIdx + 1}
                </div>
                <span className="text-xs" style={{ color: 'rgba(227,221,211,0.4)' }}>
                  {currentQ.questionType.replace('_', ' ')} ·
                  +{currentQ.marks} / {currentQ.negativeMarks}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {currentQ.topicTags.map((t) => (
                    <span key={t} className="badge-published" style={{ backgroundColor: 'rgba(247,165,27,0.12)', color: 'var(--brand-gold)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Question image */}
              {currentQ.image?.url && (
                <img
                  src={currentQ.image.url}
                  alt={currentQ.image.altText || 'Question diagram'}
                  className="rounded-xl mb-6 max-h-64 object-contain bg-white/5"
                />
              )}

              {/* Question text */}
              <p className="text-base leading-relaxed mb-8 flex-1" style={{ color: 'var(--brand-ivory)' }}>
                <MathText text={currentQ.questionText} />
              </p>

              {/* Options / Numerical */}
              {currentQ.questionType === 'NUMERICAL' ? (
                <div className="max-w-xs">
                  <label className="section-label mb-3 block" style={{ color: 'rgba(227,221,211,0.5)' }}>
                    Enter numerical answer
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={cur.numericalAnswer ?? ''}
                    onChange={(e) => setNumerical(e.target.value)}
                    className="w-full bg-white/5 border rounded-xl px-4 py-3 text-lg font-mono text-center outline-none focus:border-amber-400"
                    style={{ borderColor: 'rgba(227,221,211,0.1)', color: 'var(--brand-ivory)' }}
                    placeholder="0"
                  />
                </div>
              ) : (
                <div className="space-y-2.5 max-w-2xl">
                  {currentQ.options.map((opt) => {
                    const selected = cur.selectedOptions.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        onClick={() => selectOption(opt.key)}
                        className="w-full flex items-start gap-4 px-5 py-4 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor: selected
                            ? 'rgba(247,165,27,0.18)'
                            : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${selected ? 'var(--brand-amber)' : 'rgba(227,221,211,0.08)'}`,
                          color: 'var(--brand-ivory)',
                        }}
                      >
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: selected ? 'var(--brand-amber)' : 'rgba(227,221,211,0.08)',
                            color: selected ? 'var(--brand-cherry)' : 'rgba(227,221,211,0.5)',
                          }}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1 text-sm leading-relaxed">
                          <MathText text={opt.text} />
                        </span>
                        {selected && <CheckCircle2 size={16} style={{ color: 'var(--brand-amber)', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center gap-3 mt-10">
                <button
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 transition-colors"
                  style={{ backgroundColor: 'rgba(227,221,211,0.08)', color: 'var(--brand-ivory)' }}
                >
                  <ChevronLeft size={15} /> Prev
                </button>

                <button
                  onClick={toggleReview}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: cur.markedForReview ? 'rgba(125,24,48,0.3)' : 'rgba(227,221,211,0.08)',
                    color: cur.markedForReview ? 'var(--brand-crimson)' : 'rgba(227,221,211,0.6)',
                  }}
                >
                  <Flag size={13} />
                  {cur.markedForReview ? 'Marked' : 'Review'}
                </button>

                <button
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIdx === questions.length - 1}
                  className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 transition-colors"
                  style={{ backgroundColor: 'var(--brand-amber)', color: 'var(--brand-cherry)' }}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Submit confirmation modal ─────────────────────────────────── */}
      <AnimatePresence>
        {submitConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-2xl p-8 max-w-sm w-full mx-4"
              style={{ backgroundColor: 'var(--brand-cherry)', border: '1px solid rgba(247,165,27,0.2)' }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <AlertCircle size={28} className="mb-4" style={{ color: 'var(--brand-amber)' }} />
              <h3 className="font-display text-lg font-bold" style={{ color: 'var(--brand-ivory)' }}>
                Submit {examMode === 'EXAM' ? 'Exam' : 'Practice'}?
              </h3>
              <p className="mt-2 text-sm" style={{ color: 'rgba(227,221,211,0.6)' }}>
                {answeredCount} of {questions.length} answered.
                {examMode === 'EXAM' && ' This action cannot be undone.'}
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSubmitConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'rgba(227,221,211,0.08)', color: 'var(--brand-ivory)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setSubmitConfirm(false); handleSubmit(); }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--brand-amber)', color: 'var(--brand-cherry)' }}
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  Confirm Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
