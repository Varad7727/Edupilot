import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileText,
  Edit2,
  Archive,
  Loader2,
  AlertCircle,
  Clock,
  Send,
  X,
  Search,
  ExternalLink,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { lessonApi, chapterApi, uploadApi } from '../../api';
import type { Lesson, LessonResource } from '../../types';

export default function TeacherLessons() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialChapterParam = searchParams.get('chapterId') || '';

  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [filterChapter, setFilterChapter] = useState(initialChapterParam);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [topicsInput, setTopicsInput] = useState('');
  const [learningObjectivesInput, setLearningObjectivesInput] = useState('');
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>([]);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [attachedResources, setAttachedResources] = useState<LessonResource[]>([]);

  // Fetch chapters for selection
  const { data: chapters } = useQuery({
    queryKey: ['teacher-chapters-for-lessons'],
    queryFn: async () => {
      const res = await chapterApi.getAll();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  // Fetch teacher lessons
  const { data: lessonsResponse, isLoading } = useQuery({
    queryKey: ['teacher-lessons-list', filterChapter, search],
    queryFn: async () => {
      const res = await lessonApi.getAll({
        chapterId: filterChapter || undefined,
        search: search || undefined,
        limit: 50,
      });
      return res.data;
    },
    staleTime: 30_000,
  });

  const lessons = lessonsResponse?.data || [];

  // When chapterId changes in authoring modal, fetch all existing lessons in that chapter
  const { data: chapterLessonsRes } = useQuery({
    queryKey: ['existing-lessons-by-chapter', chapterId],
    queryFn: async () => {
      if (!chapterId) return [];
      const res = await lessonApi.getAll({ chapterId, limit: 100 });
      return res.data?.data || [];
    },
    enabled: !!chapterId,
    staleTime: 10_000,
  });

  const existingChapterLessons = chapterLessonsRes || [];

  // Auto-set next sequence order when picking chapter in create mode
  useEffect(() => {
    if (!editingLesson && chapterId && existingChapterLessons.length > 0) {
      setOrder(existingChapterLessons.length + 1);
    }
  }, [chapterId, existingChapterLessons.length, editingLesson]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof lessonApi.create>[0]) => lessonApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lessons-list'] });
      queryClient.invalidateQueries({ queryKey: ['existing-lessons-by-chapter'] });
      closeModal();
    },
    onError: (err: import('axios').AxiosError<{ message: string }>) => {
      setFormError(err.response?.data?.message || 'Failed to create lesson.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lesson> }) => lessonApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lessons-list'] });
      queryClient.invalidateQueries({ queryKey: ['existing-lessons-by-chapter'] });
      closeModal();
    },
    onError: (err: import('axios').AxiosError<{ message: string }>) => {
      setFormError(err.response?.data?.message || 'Failed to update lesson.');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => lessonApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lessons-list'] });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => lessonApi.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lessons-list'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => lessonApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lessons-list'] });
    },
  });

  const openCreateModal = () => {
    setEditingLesson(null);
    setTitle('');
    setDescription('');
    const targetChapter = filterChapter || chapters?.[0]?._id || '';
    setChapterId(targetChapter);
    setOrder(lessons.length + 1);
    setEstimatedDuration(30);
    setDifficulty('intermediate');
    setTopicsInput('');
    setLearningObjectivesInput('');
    setSelectedPrerequisites([]);
    setAttachedResources([]);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (l: Lesson) => {
    setEditingLesson(l);
    setTitle(l.title);
    setDescription(l.description || '');
    const cId = typeof l.chapterId === 'object' ? l.chapterId._id : l.chapterId;
    setChapterId(cId);
    setOrder(l.order);
    setEstimatedDuration(l.estimatedDuration || 30);
    setDifficulty(l.difficulty || 'intermediate');
    setTopicsInput(l.topics?.join(', ') || '');
    setLearningObjectivesInput(l.learningObjectives?.join(', ') || '');
    const prereqIds = (l.prerequisites || []).map((p: any) => (typeof p === 'object' ? p._id : p));
    setSelectedPrerequisites(prereqIds);
    setAttachedResources(l.resources || []);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    setAttachedResources([]);
    setSelectedPrerequisites([]);
    setFormError('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFormError('');
    try {
      let res;
      let type: 'pdf' | 'image' = 'pdf';
      if (file.type.includes('pdf')) {
        res = await uploadApi.uploadPdf(file);
        type = 'pdf';
      } else {
        res = await uploadApi.uploadImage(file);
        type = 'image';
      }
      const fileData = res.data?.data?.file;
      if (fileData) {
        const newResource: LessonResource = {
          _id: fileData.fileId || Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          type,
          url: fileData.url,
          fileId: fileData.fileId,
          filePath: fileData.filePath || '',
          mimeType: fileData.fileType || file.type || 'application/pdf',
          size: fileData.size || file.size,
          uploadedAt: new Date().toISOString(),
        };
        setAttachedResources((prev) => [...prev, newResource]);
      }
    } catch (err: unknown) {
      const axiosErr = err as import('axios').AxiosError<{ message: string }>;
      setFormError(axiosErr.response?.data?.message || 'File upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeResource = (index: number) => {
    setAttachedResources((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePrerequisite = (id: string) => {
    setSelectedPrerequisites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const topics = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const learningObjectives = learningObjectivesInput
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (editingLesson) {
      updateMutation.mutate({
        id: editingLesson._id,
        data: {
          title,
          description,
          order,
          estimatedDuration,
          difficulty,
          topics,
          learningObjectives,
          prerequisites: selectedPrerequisites,
          resources: attachedResources,
        },
      });
    } else {
      if (!chapterId) {
        setFormError('Please select a chapter.');
        return;
      }
      createMutation.mutate({
        title,
        description,
        chapterId,
        order,
        estimatedDuration,
        difficulty,
        topics,
        learningObjectives,
        prerequisites: selectedPrerequisites,
        resources: attachedResources,
      });
    }
  };

  return (
    <div className="px-6 sm:px-10 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="section-label">Curriculum Management</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-cherry)' }}>
            Lesson Studio
          </h2>
          <div className="mt-2 amber-line w-12" />
        </div>
        <button onClick={openCreateModal} className="btn-amber inline-flex items-center gap-2 text-xs">
          <Plus size={14} /> Author Lesson
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input-field text-xs pl-9"
            placeholder="Search lessons by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-field text-xs w-full sm:w-64"
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
        >
          <option value="">All Chapters</option>
          {chapters?.map((ch) => (
            <option key={ch._id} value={ch._id}>
              {ch.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
          <p style={{ color: 'var(--brand-earth)' }}>Loading lessons…</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 card">
          <FileText size={36} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--brand-burgundy)' }} />
          <h3 className="font-display text-lg font-bold" style={{ color: 'var(--brand-cherry)' }}>
            No Lessons Found
          </h3>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
            {filterChapter
              ? 'No lessons created in this chapter yet. Author the first lesson!'
              : 'Draft your first curriculum lesson with learning objectives, formula notes, and duration.'}
          </p>
          <button onClick={openCreateModal} className="btn-amber inline-flex items-center gap-2 text-xs mt-5">
            <Plus size={14} /> Author Lesson
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const chapterObj = typeof lesson.chapterId === 'object' ? lesson.chapterId : null;
            return (
              <motion.div
                key={lesson._id}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-amber-300 transition-colors"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: 'rgba(247, 165, 27, 0.15)', color: 'var(--brand-amber)' }}
                  >
                    {lesson.order}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                        {lesson.title}
                      </h4>
                      <span className={lesson.status === 'published' ? 'badge-published' : 'badge-draft'}>
                        {lesson.status}
                      </span>
                    </div>
                    {lesson.description && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--brand-earth)', opacity: 0.75 }}>
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
                      {chapterObj && <span>Chapter: <strong>{chapterObj.title}</strong></span>}
                      <span>Duration: <strong>{lesson.estimatedDuration}m</strong></span>
                      <span className="capitalize">Level: <strong>{lesson.difficulty}</strong></span>
                      {lesson.topics && lesson.topics.length > 0 && (
                        <span>Topics: {lesson.topics.join(', ')}</span>
                      )}
                    </div>

                    {/* Attached Resources */}
                    {lesson.resources && lesson.resources.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {lesson.resources.map((r) => (
                          <a
                            key={r._id || r.fileId}
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-900 hover:bg-amber-100 transition-colors"
                          >
                            <FileText size={11} className="text-amber-700" />
                            <span className="truncate max-w-[150px]">{r.title}</span>
                            <ExternalLink size={9} className="opacity-60" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {lesson.status === 'draft' ? (
                    <button
                      onClick={() => publishMutation.mutate(lesson._id)}
                      disabled={publishMutation.isPending}
                      className="p-2 rounded-lg hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--brand-amber)' }}
                    >
                      <Send size={13} /> Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => unpublishMutation.mutate(lesson._id)}
                      disabled={unpublishMutation.isPending}
                      className="p-2 rounded-lg hover:bg-gray-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--brand-earth)' }}
                    >
                      Unpublish
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(lesson)}
                    className="p-2 rounded-lg hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                    style={{ color: 'var(--brand-earth)' }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Archive lesson "${lesson.title}"?`)) {
                        archiveMutation.mutate(lesson._id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                    style={{ color: 'var(--brand-crimson)' }}
                  >
                    <Archive size={13} /> Archive
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Lesson Authoring Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--brand-white)' }}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg" style={{ color: 'var(--brand-cherry)' }}>
                  {editingLesson ? 'Edit Lesson' : 'Author New Lesson'}
                </h3>
                <button onClick={closeModal} className="p-1 rounded-lg hover:bg-black/5 text-gray-500">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingLesson && (
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Associated Chapter
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
                )}

                {/* Chapter Existing Lessons Reference */}
                {chapterId && existingChapterLessons.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                      Existing Lessons in this Chapter ({existingChapterLessons.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {existingChapterLessons.map((exL) => (
                        <span
                          key={exL._id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[11px] text-stone-700 border border-stone-200 shadow-sm"
                        >
                          <span className="font-bold text-amber-700">#{exL.order}</span>
                          <span className="truncate max-w-[130px]">{exL.title}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Lesson Title (3 - 150 chars)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Moment of Inertia & Parallel Axis Theorem"
                    minLength={3}
                    maxLength={150}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Detailed Lesson Description
                  </label>
                  <textarea
                    className="input-field text-sm h-24 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed explanation, formula derivations, and concept walkthrough…"
                    maxLength={2000}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Sequence Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="input-field text-sm"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Est. Duration (min)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="input-field text-sm"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Difficulty
                    </label>
                    <select
                      className="input-field text-sm"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Topics (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={topicsInput}
                    onChange={(e) => setTopicsInput(e.target.value)}
                    placeholder="Moment of Inertia, Radius of Gyration, JEE Main"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Learning Objectives (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={learningObjectivesInput}
                    onChange={(e) => setLearningObjectivesInput(e.target.value)}
                    placeholder="Calculate I for standard bodies, Apply perpendicular axis theorem"
                  />
                </div>

                {/* Prerequisites Multi-Select (if existing lessons available) */}
                {existingChapterLessons.filter((l) => l._id !== editingLesson?._id).length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                      Prerequisites (select earlier lessons students must complete first)
                    </label>
                    <div className="p-2.5 rounded-xl border max-h-32 overflow-y-auto space-y-1.5" style={{ borderColor: 'rgba(98, 65, 51, 0.15)' }}>
                      {existingChapterLessons
                        .filter((l) => l._id !== editingLesson?._id)
                        .map((l) => {
                          const isChecked = selectedPrerequisites.includes(l._id);
                          return (
                            <button
                              key={l._id}
                              type="button"
                              onClick={() => togglePrerequisite(l._id)}
                              className="flex items-center gap-2 w-full text-left text-xs p-1.5 rounded hover:bg-black/5"
                            >
                              {isChecked ? (
                                <CheckSquare size={14} className="text-amber-600 flex-shrink-0" />
                              ) : (
                                <Square size={14} className="text-stone-400 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                #{l.order} {l.title}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Media Resource Upload */}
                <div className="p-4 rounded-xl border border-dashed" style={{ borderColor: 'rgba(98, 65, 51, 0.2)' }}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Attach Media Asset (PDF Notes, Formula Derivation, or Diagram)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--brand-amber)' }}>
                      <Loader2 size={12} className="animate-spin" /> Uploading to ImageKit media storage…
                    </div>
                  )}

                  {/* Attached Resources List */}
                  {attachedResources.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                        Attached Documents ({attachedResources.length})
                      </p>
                      {attachedResources.map((resItem, idx) => (
                        <div
                          key={resItem.fileId || idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={14} className="text-amber-700 flex-shrink-0" />
                            <span className="font-medium text-stone-800 truncate">{resItem.title}</span>
                            {resItem.size && (
                              <span className="text-[10px] text-stone-500 flex-shrink-0">
                                ({Math.round(resItem.size / 1024)} KB)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeResource(idx)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove attachment"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-xs font-semibold mt-2" style={{ color: 'var(--brand-crimson)' }}>
                    <AlertCircle size={14} />
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}>
                  <button type="button" onClick={closeModal} className="btn-outline text-xs px-4 py-2">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || uploading}
                    className="btn-amber text-xs px-5 py-2 flex items-center gap-2"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 size={13} className="animate-spin" />
                    )}
                    {editingLesson ? 'Save Changes' : 'Create Lesson'}
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
