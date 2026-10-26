import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Library,
  Clock,
  Calendar,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { dppApi, chapterApi } from '../../api';
import type { DPP, QuestionType, QuestionDifficulty, QuestionSubject } from '../../types';

export default function TeacherDPPs() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeDppId, setActiveDppId] = useState<string | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [formError, setFormError] = useState('');

  // DPP creation form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [deadline, setDeadline] = useState('');

  // Question builder form
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('SINGLE_CORRECT');
  const [qDifficulty, setQDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [qSubject, setQSubject] = useState<QuestionSubject>('PHYSICS');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [multiCorrect, setMultiCorrect] = useState<string[]>(['A']);
  const [numericalAnswer, setNumericalAnswer] = useState<number>(0);
  const [numericalTolerance, setNumericalTolerance] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [correctMarks, setCorrectMarks] = useState<number>(4);
  const [incorrectMarks, setIncorrectMarks] = useState<number>(-1);

  // Fetch chapters for selection
  const { data: chapters } = useQuery({
    queryKey: ['teacher-chapters-for-dpp'],
    queryFn: async () => {
      const res = await chapterApi.getAll();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  // Fetch DPPs
  const { data: dppsData, isLoading } = useQuery({
    queryKey: ['teacher-dpps-list'],
    queryFn: async () => {
      const res = await dppApi.getAll();
      return res.data.data.dpps;
    },
    staleTime: 30_000,
  });

  const dpps = dppsData || [];

  // Fetch single detailed DPP when expanded
  const { data: activeDppDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['teacher-dpp-detail', activeDppId],
    queryFn: async () => {
      if (!activeDppId) return null;
      const res = await dppApi.getById(activeDppId);
      return res.data.data.dpp;
    },
    enabled: !!activeDppId,
  });

  // Mutations
  const createDppMutation = useMutation({
    mutationFn: (data: Parameters<typeof dppApi.create>[0]) => dppApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-dpps-list'] });
      setShowCreateModal(false);
      resetDppForm();
    },
    onError: (err: import('axios').AxiosError<{ message: string }>) => {
      setFormError(err.response?.data?.message || 'Failed to create DPP.');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => dppApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-dpps-list'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dpp-detail', activeDppId] });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: ({ dppId, payload }: { dppId: string; payload: object }) =>
      dppApi.addQuestion(dppId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-dpps-list'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dpp-detail', activeDppId] });
      setShowAddQuestionModal(false);
      resetQuestionForm();
    },
    onError: (err: import('axios').AxiosError<{ message: string }>) => {
      setFormError(err.response?.data?.message || 'Failed to add question.');
    },
  });

  const removeQuestionMutation = useMutation({
    mutationFn: ({ dppId, questionId }: { dppId: string; questionId: string }) =>
      dppApi.removeQuestion(dppId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-dpps-list'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dpp-detail', activeDppId] });
    },
  });

  const resetDppForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setChapterId(chapters?.[0]?._id || '');
    setDurationMinutes(60);
    setDeadline('');
    setFormError('');
  };

  const resetQuestionForm = () => {
    setQText('');
    setQType('SINGLE_CORRECT');
    setQDifficulty('MEDIUM');
    const activeDpp = dpps.find((d) => d._id === activeDppId);
    const cId = typeof activeDpp?.chapterId === 'object' ? activeDpp.chapterId._id : activeDpp?.chapterId;
    const chapter = chapters?.find((c) => c._id === cId);
    const subName = typeof chapter?.subjectId === 'object' ? chapter.subjectId.name.toUpperCase() : '';
    if (subName.includes('CHEM')) setQSubject('CHEMISTRY');
    else if (subName.includes('MATH')) setQSubject('MATHEMATICS');
    else setQSubject('PHYSICS');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
    setMultiCorrect(['A']);
    setNumericalAnswer(0);
    setNumericalTolerance(0);
    setExplanation('');
    setCorrectMarks(4);
    setIncorrectMarks(-1);
    setFormError('');
  };

  const handleCreateDpp = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!chapterId) {
      setFormError('Please select a chapter.');
      return;
    }

    if (!deadline || new Date(deadline) <= new Date()) {
      setFormError('Deadline must be a valid future date.');
      return;
    }

    createDppMutation.mutate({
      title,
      description,
      instructions,
      chapterId,
      durationMinutes,
      deadline: new Date(deadline).toISOString(),
    });
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activeDppId) return;

    let optionsPayload: { key: string; text: string }[] = [];
    let correctOptionsPayload: string[] = [];

    if (qType !== 'NUMERICAL') {
      if (!optionA || !optionB || !optionC || !optionD) {
        setFormError('All 4 options (A, B, C, D) are required.');
        return;
      }
      optionsPayload = [
        { key: 'A', text: optionA },
        { key: 'B', text: optionB },
        { key: 'C', text: optionC },
        { key: 'D', text: optionD },
      ];

      correctOptionsPayload = qType === 'SINGLE_CORRECT' ? [correctOption] : multiCorrect;
    }

    const payload = {
      questionText: qText,
      questionType: qType,
      difficulty: qDifficulty,
      subject: qSubject,
      options: optionsPayload,
      correctOptions: correctOptionsPayload,
      numericalAnswer: qType === 'NUMERICAL' ? numericalAnswer : undefined,
      numericalTolerance: qType === 'NUMERICAL' ? numericalTolerance : 0,
      explanation,
      marking: {
        correctMarks,
        incorrectMarks,
        unattemptedMarks: 0,
      },
    };

    addQuestionMutation.mutate({ dppId: activeDppId, payload });
  };

  return (
    <div className="px-6 sm:px-10 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="section-label">Assessment Authoring</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
            DPP &amp; Question Bank
          </h2>
          <div className="mt-2 amber-line w-12" />
        </div>
        <button
          onClick={() => {
            resetDppForm();
            setShowCreateModal(true);
          }}
          className="btn-amber inline-flex items-center gap-2 text-xs"
        >
          <Plus size={14} /> Create DPP
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
          <p style={{ color: 'var(--brand-earth)' }}>Loading DPP portfolio…</p>
        </div>
      ) : dpps.length === 0 ? (
        <div className="text-center py-20 card">
          <Library size={36} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--brand-burgundy)' }} />
          <h3 className="font-display text-lg font-bold" style={{ color: 'var(--brand-cherry)' }}>
            No Assessments Created Yet
          </h3>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
            Build timed Daily Practice Problems with real JEE marking schemes and numerical tolerance.
          </p>
          <button
            onClick={() => {
              resetDppForm();
              setShowCreateModal(true);
            }}
            className="btn-amber inline-flex items-center gap-2 text-xs mt-5"
          >
            <Plus size={14} /> Create First DPP
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {dpps.map((dpp) => {
            const isExpanded = activeDppId === dpp._id;
            const chapterObj = typeof dpp.chapterId === 'object' ? dpp.chapterId : null;
            return (
              <div
                key={dpp._id}
                className="card overflow-hidden border transition-all"
                style={{ borderColor: isExpanded ? 'var(--brand-amber)' : 'rgba(98,65,51,0.1)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                        {dpp.title}
                      </h4>
                      <span className={dpp.status === 'published' ? 'badge-published' : 'badge-draft'}>
                        {dpp.status}
                      </span>
                    </div>
                    {dpp.description && (
                      <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
                        {dpp.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px]" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
                      {chapterObj && <span>Chapter: <strong>{chapterObj.title}</strong></span>}
                      <span className="flex items-center gap-1"><Clock size={11} /> {dpp.durationMinutes} min</span>
                      <span>Questions: <strong>{dpp.questions.length}</strong></span>
                      <span>Total Marks: <strong>{dpp.totalMarks}</strong></span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> Due {new Date(dpp.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {dpp.status === 'draft' && (
                      <button
                        onClick={() => publishMutation.mutate(dpp._id)}
                        disabled={publishMutation.isPending}
                        className="btn-amber text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        <Send size={12} /> Publish
                      </button>
                    )}
                    <button
                      onClick={() => setActiveDppId(isExpanded ? null : dpp._id)}
                      className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      {isExpanded ? <>Hide Questions <ChevronUp size={13} /></> : <>Manage Questions ({dpp.questions.length}) <ChevronDown size={13} /></>}
                    </button>
                  </div>
                </div>

                {/* ── Expanded Question Management Panel ─────────────────── */}
                {isExpanded && (
                  <div className="border-t p-5 bg-amber-50/20" style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="section-label text-xs">Questions in this DPP</p>
                      {dpp.status === 'draft' && (
                        <button
                          onClick={() => {
                            resetQuestionForm();
                            setShowAddQuestionModal(true);
                          }}
                          className="btn-amber text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Question
                        </button>
                      )}
                    </div>

                    {loadingDetail ? (
                      <div className="py-6 flex justify-center">
                        <Loader2 size={16} className="animate-spin text-amber-600" />
                      </div>
                    ) : !activeDppDetail?.questions || activeDppDetail.questions.length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: 'var(--brand-earth)', opacity: 0.6 }}>
                        No questions added yet. Click "Add Question" to construct this assessment.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activeDppDetail.questions.map((item, idx) => {
                          const q = typeof item.questionId === 'object' ? item.questionId : null;
                          return (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl border bg-white flex items-start justify-between gap-3 text-xs"
                              style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}
                            >
                              <div className="flex items-start gap-3">
                                <span className="font-display font-bold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
                                  Q{item.order}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-800 line-clamp-2">
                                    {q?.questionText || 'Question item'}
                                  </p>
                                  <div className="flex gap-2 mt-1 text-[11px] text-gray-500">
                                    <span>Type: <strong>{q?.questionType}</strong></span>
                                    <span>Diff: <strong>{q?.difficulty}</strong></span>
                                    <span>Marks: +{q?.marking?.correctMarks ?? 4} / {q?.marking?.incorrectMarks ?? -1}</span>
                                  </div>
                                </div>
                              </div>

                              {dpp.status === 'draft' && q?._id && (
                                <button
                                  onClick={() => removeQuestionMutation.mutate({ dppId: dpp._id, questionId: q._id })}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Remove question"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create DPP Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--brand-white)' }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg" style={{ color: 'var(--brand-cherry)' }}>
                  Create New DPP Assessment
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-black/5 text-gray-500">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDpp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Select Chapter
                  </label>
                  <select
                    className="input-field text-sm"
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    required
                  >
                    <option value="">Select Chapter…</option>
                    {chapters?.map((ch) => (
                      <option key={ch._id} value={ch._id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Assessment Title (2 - 150 chars)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. DPP-01: Kinematics & 2D Motion"
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Description
                  </label>
                  <textarea
                    className="input-field text-sm h-16 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description for students…"
                    maxLength={2000}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={600}
                      className="input-field text-sm"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Deadline (Future Date/Time)
                    </label>
                    <input
                      type="datetime-local"
                      className="input-field text-sm"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--brand-crimson)' }}>
                    <AlertCircle size={14} />
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline text-xs px-4 py-2">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createDppMutation.isPending}
                    className="btn-amber text-xs px-5 py-2 flex items-center gap-2"
                  >
                    {createDppMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                    Create DPP
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Question Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showAddQuestionModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--brand-white)' }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg" style={{ color: 'var(--brand-cherry)' }}>
                  Add Question to DPP
                </h3>
                <button onClick={() => setShowAddQuestionModal(false)} className="p-1 rounded-lg hover:bg-black/5 text-gray-500">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Question Type
                    </label>
                    <select
                      className="input-field text-xs"
                      value={qType}
                      onChange={(e) => setQType(e.target.value as QuestionType)}
                    >
                      <option value="SINGLE_CORRECT">Single Correct</option>
                      <option value="MULTIPLE_CORRECT">Multiple Correct</option>
                      <option value="NUMERICAL">Numerical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Difficulty
                    </label>
                    <select
                      className="input-field text-xs"
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value as QuestionDifficulty)}
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Subject
                    </label>
                    <select
                      className="input-field text-xs"
                      value={qSubject}
                      onChange={(e) => setQSubject(e.target.value as QuestionSubject)}
                    >
                      <option value="PHYSICS">Physics</option>
                      <option value="CHEMISTRY">Chemistry</option>
                      <option value="MATHEMATICS">Mathematics</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Question Statement (Supports KaTeX $...$)
                  </label>
                  <textarea
                    className="input-field text-sm h-24 resize-none font-mono"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="A particle travels with velocity $v(t) = 3t^2 + 2t$ m/s..."
                    required
                  />
                </div>

                {qType !== 'NUMERICAL' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold" style={{ color: 'var(--brand-earth)' }}>
                      Options &amp; Correct Answer
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-amber-700 w-4">A:</span>
                        <input
                          type="text"
                          className="input-field text-xs py-1.5"
                          placeholder="Option A text"
                          value={optionA}
                          onChange={(e) => setOptionA(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-amber-700 w-4">B:</span>
                        <input
                          type="text"
                          className="input-field text-xs py-1.5"
                          placeholder="Option B text"
                          value={optionB}
                          onChange={(e) => setOptionB(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-amber-700 w-4">C:</span>
                        <input
                          type="text"
                          className="input-field text-xs py-1.5"
                          placeholder="Option C text"
                          value={optionC}
                          onChange={(e) => setOptionC(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-amber-700 w-4">D:</span>
                        <input
                          type="text"
                          className="input-field text-xs py-1.5"
                          placeholder="Option D text"
                          value={optionD}
                          onChange={(e) => setOptionD(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                        Select Correct Option{qType === 'MULTIPLE_CORRECT' ? '(s)' : ''}
                      </label>
                      {qType === 'SINGLE_CORRECT' ? (
                        <div className="flex gap-4">
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <label key={opt} className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input
                                type="radio"
                                name="correctOpt"
                                value={opt}
                                checked={correctOption === opt}
                                onChange={() => setCorrectOption(opt)}
                                className="accent-amber-600"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <label key={opt} className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={multiCorrect.includes(opt)}
                                onChange={(e) => {
                                  if (e.target.checked) setMultiCorrect([...multiCorrect, opt]);
                                  else setMultiCorrect(multiCorrect.filter((x) => x !== opt));
                                }}
                                className="accent-amber-600"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                        Expected Numerical Answer
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="input-field text-sm"
                        value={numericalAnswer}
                        onChange={(e) => setNumericalAnswer(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                        Tolerance (±)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        className="input-field text-sm"
                        value={numericalTolerance}
                        onChange={(e) => setNumericalTolerance(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Correct Marks
                    </label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={correctMarks}
                      onChange={(e) => setCorrectMarks(parseInt(e.target.value) || 4)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Negative Marks
                    </label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={incorrectMarks}
                      onChange={(e) => setIncorrectMarks(parseInt(e.target.value) || -1)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Detailed Explanation (Optional)
                  </label>
                  <textarea
                    className="input-field text-sm h-16 resize-none"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Step-by-step mathematical reasoning…"
                  />
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--brand-crimson)' }}>
                    <AlertCircle size={14} />
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}>
                  <button type="button" onClick={() => setShowAddQuestionModal(false)} className="btn-outline text-xs px-4 py-2">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addQuestionMutation.isPending}
                    className="btn-amber text-xs px-5 py-2 flex items-center gap-2"
                  >
                    {addQuestionMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                    Add Question
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
