import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Edit2,
  Archive,
  Loader2,
  AlertCircle,
  Send,
  X,
  FileText,
  Upload,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { chapterApi, courseApi, uploadApi, lessonApi } from '../../api';
import type { Chapter, LessonResource } from '../../types';

function ChapterLessonsAccordion({ chapterId }: { chapterId: string }) {
  const { data: lessonsRes, isLoading } = useQuery({
    queryKey: ['chapter-lessons-list', chapterId],
    queryFn: async () => {
      const res = await lessonApi.getAll({ chapterId, limit: 50 });
      return res.data?.data || [];
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-xs" style={{ color: 'var(--brand-earth)' }}>
        <Loader2 size={14} className="animate-spin text-amber-500" />
        <span>Loading chapter lessons…</span>
      </div>
    );
  }

  const lessons = lessonsRes || [];

  return (
    <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'rgba(98, 65, 51, 0.1)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-burgundy)' }}>
          Curriculum Lessons ({lessons.length})
        </p>
        <Link
          to={`/teacher/lessons?chapterId=${chapterId}`}
          className="text-xs font-semibold hover:underline inline-flex items-center gap-1"
          style={{ color: 'var(--brand-amber)' }}
        >
          <Plus size={12} /> Add Lesson to Chapter
        </Link>
      </div>

      {lessons.length === 0 ? (
        <p className="text-xs italic py-2" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
          No lessons created for this chapter yet. Click "Add Lesson" to build this unit.
        </p>
      ) : (
        <div className="grid gap-2">
          {lessons.map((lesson) => (
            <div
              key={lesson._id}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs"
              style={{ backgroundColor: 'rgba(227, 221, 211, 0.35)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px]"
                  style={{ backgroundColor: 'rgba(125, 24, 48, 0.1)', color: 'var(--brand-burgundy)' }}
                >
                  {lesson.order}
                </span>
                <div>
                  <span className="font-semibold text-stone-900">{lesson.title}</span>
                  <span className="ml-2 opacity-60">({lesson.estimatedDuration}m)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lesson.resources && lesson.resources.length > 0 && (
                  <span className="badge-draft text-[10px]">
                    {lesson.resources.length} {lesson.resources.length === 1 ? 'doc' : 'docs'}
                  </span>
                )}
                <span className={lesson.status === 'published' ? 'badge-published text-[10px]' : 'badge-draft text-[10px]'}>
                  {lesson.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherChapters() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formError, setFormError] = useState('');
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [attachedResources, setAttachedResources] = useState<LessonResource[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load teacher chapters
  const { data: chapters, isLoading } = useQuery({
    queryKey: ['teacher-chapters'],
    queryFn: async () => {
      const res = await chapterApi.getAll();
      return res.data.data;
    },
    staleTime: 30_000,
  });

  // Load courses to discover subjects
  const { data: courses } = useQuery({
    queryKey: ['all-courses-for-teacher'],
    queryFn: async () => {
      const res = await courseApi.getAll();
      return res.data?.data || (Array.isArray(res.data) ? res.data : []);
    },
    staleTime: 120_000,
  });

  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Auto-select first course when courses load
  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0]._id);
    }
  }, [courses, selectedCourseId]);

  // Load subjects for selected course
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-by-course', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const res = await courseApi.getSubjectsByCourse(selectedCourseId);
      return res.data?.subject || (res.data as any)?.data || [];
    },
    enabled: !!selectedCourseId,
  });

  // Auto-select first subject when subjects load
  useEffect(() => {
    if (subjectsData && subjectsData.length > 0 && !subjectId) {
      setSubjectId(subjectsData[0]._id);
    }
  }, [subjectsData, subjectId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      subjectId: string;
      order: number;
      status: 'draft' | 'published';
      resources: LessonResource[];
    }) => {
      const res = await chapterApi.create({
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        order: data.order,
        resources: data.resources,
      });
      // If teacher requested it published, update status immediately
      if (data.status === 'published' && res.data?.data?._id) {
        await chapterApi.update(res.data.data._id, { status: 'published' });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-chapters'] });
      closeModal();
    },
    onError: (err: import('axios').AxiosError<{ message: string }>) => {
      setFormError(err.response?.data?.message || 'Failed to create chapter.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Chapter> }) =>
      chapterApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-chapters'] });
      closeModal();
    },
    onError: (err: import('axios').AxiosError<{ message: string }>) => {
      setFormError(err.response?.data?.message || 'Failed to update chapter.');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => chapterApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-chapters'] });
    },
  });

  const openCreateModal = () => {
    setEditingChapter(null);
    setTitle('');
    setDescription('');
    if (courses && courses.length > 0) {
      setSelectedCourseId(courses[0]._id);
    }
    setOrder((chapters?.length || 0) + 1);
    setStatus('published');
    setAttachedResources([]);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (c: Chapter) => {
    setEditingChapter(c);
    setTitle(c.title);
    setDescription(c.description || '');
    const sId = typeof c.subjectId === 'object' ? c.subjectId._id : c.subjectId;
    setSubjectId(sId);
    setOrder(c.order);
    setStatus(c.status);
    setAttachedResources(c.resources || []);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingChapter(null);
    setAttachedResources([]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (editingChapter) {
      updateMutation.mutate({
        id: editingChapter._id,
        data: { title, description, order, status, resources: attachedResources },
      });
    } else {
      if (!subjectId) {
        setFormError('Please select a subject.');
        return;
      }
      createMutation.mutate({
        title,
        description,
        subjectId,
        order,
        status,
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
            Chapters
          </h2>
          <div className="mt-2 amber-line w-12" />
        </div>
        <button onClick={openCreateModal} className="btn-amber inline-flex items-center gap-2 text-xs">
          <Plus size={14} /> New Chapter
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-amber)' }} />
          <p style={{ color: 'var(--brand-earth)' }}>Loading chapters…</p>
        </div>
      ) : !chapters || chapters.length === 0 ? (
        <div className="text-center py-20 card">
          <BookOpen size={36} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--brand-burgundy)' }} />
          <h3 className="font-display text-lg font-bold" style={{ color: 'var(--brand-cherry)' }}>
            No Chapters Created
          </h3>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
            Start building your curriculum hierarchy by creating your first subject chapter.
          </p>
          <button onClick={openCreateModal} className="btn-amber inline-flex items-center gap-2 text-xs mt-5">
            <Plus size={14} /> Create Chapter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const subjectObj = typeof chapter.subjectId === 'object' ? chapter.subjectId : null;
            const isExpanded = expandedChapterId === chapter._id;

            return (
              <motion.div
                key={chapter._id}
                className="card p-5 hover:border-amber-300 transition-colors"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs flex-shrink-0"
                      style={{ backgroundColor: 'rgba(125, 24, 48, 0.1)', color: 'var(--brand-burgundy)' }}
                    >
                      {chapter.order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-base" style={{ color: 'var(--brand-cherry)' }}>
                          {chapter.title}
                        </h4>
                        <span className={chapter.status === 'published' ? 'badge-published' : 'badge-draft'}>
                          {chapter.status}
                        </span>
                      </div>
                      {chapter.description && (
                        <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--brand-earth)', opacity: 0.7 }}>
                          {chapter.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {subjectObj && (
                          <span className="text-[11px] font-semibold" style={{ color: 'var(--brand-amber)' }}>
                            {subjectObj.name} ({subjectObj.code})
                          </span>
                        )}
                        {chapter.resources && chapter.resources.length > 0 && (
                          <span className="text-[11px] font-medium flex items-center gap-1 text-stone-600">
                            <FileText size={12} className="text-amber-600" />
                            {chapter.resources.length} {chapter.resources.length === 1 ? 'Note attached' : 'Notes attached'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setExpandedChapterId(isExpanded ? null : chapter._id)}
                      className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      style={{ borderColor: 'rgba(98, 65, 51, 0.2)', color: 'var(--brand-cherry)' }}
                    >
                      <BookOpen size={13} />
                      <span>Lessons</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {chapter.status === 'draft' ? (
                      <button
                        onClick={() => updateMutation.mutate({ id: chapter._id, data: { status: 'published' } })}
                        disabled={updateMutation.isPending}
                        className="p-2 rounded-lg hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                        style={{ color: 'var(--brand-amber)' }}
                        title="Make visible to students"
                      >
                        <Send size={13} /> Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => updateMutation.mutate({ id: chapter._id, data: { status: 'draft' } })}
                        disabled={updateMutation.isPending}
                        className="p-2 rounded-lg hover:bg-gray-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                        style={{ color: 'var(--brand-earth)' }}
                        title="Hide from students"
                      >
                        Unpublish
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(chapter)}
                      className="p-2 rounded-lg hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--brand-earth)' }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Archive chapter "${chapter.title}"?`)) {
                          archiveMutation.mutate(chapter._id);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--brand-crimson)' }}
                    >
                      <Archive size={13} />
                    </button>
                  </div>
                </div>

                {/* Attached Chapter Notes / Resources */}
                {chapter.resources && chapter.resources.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: 'rgba(98, 65, 51, 0.08)' }}>
                    {chapter.resources.map((resItem) => (
                      <a
                        key={resItem._id || resItem.fileId}
                        href={resItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
                      >
                        <FileText size={12} className="text-amber-700" />
                        <span className="truncate max-w-[180px]">{resItem.title}</span>
                        <ExternalLink size={10} className="opacity-60" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Expandable Lessons Accordion */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <ChapterLessonsAccordion chapterId={chapter._id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Chapter Creation / Edit Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--brand-white)' }}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg" style={{ color: 'var(--brand-cherry)' }}>
                  {editingChapter ? 'Edit Chapter' : 'Create New Chapter'}
                </h3>
                <button onClick={closeModal} className="p-1 rounded-lg hover:bg-black/5 text-gray-500">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Course & Subject Selection (Only on create) */}
                {!editingChapter && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                        Target Course
                      </label>
                      <select
                        className="input-field text-sm"
                        value={selectedCourseId}
                        onChange={(e) => {
                          setSelectedCourseId(e.target.value);
                          setSubjectId('');
                        }}
                        required
                      >
                        <option value="">Select Course…</option>
                        {courses?.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                        Subject
                      </label>
                      <select
                        className="input-field text-sm"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        required
                        disabled={!selectedCourseId}
                      >
                        <option value="">Select Subject…</option>
                        {subjectsData?.map((s: any) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Chapter Title (2 - 150 chars)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Rotational Dynamics"
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
                    className="input-field text-sm h-20 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the topics covered in this chapter…"
                    maxLength={2000}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      Initial Status
                    </label>
                    <select
                      className="input-field text-sm"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                    >
                      <option value="published">Published (Visible to students)</option>
                      <option value="draft">Draft (Work in progress)</option>
                    </select>
                  </div>
                </div>

                {/* Chapter Study Notes & PDF Upload */}
                <div className="p-4 rounded-xl border border-dashed" style={{ borderColor: 'rgba(98, 65, 51, 0.2)' }}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--brand-earth)' }}>
                    Upload Chapter Study Notes / Reference PDF
                  </label>
                  <p className="text-[11px] mb-2 text-stone-500">
                    Attach formula sheets, chapter revision notes, or summary handouts for your students.
                  </p>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--brand-amber)' }}>
                      <Loader2 size={12} className="animate-spin" /> Uploading note asset…
                    </div>
                  )}

                  {/* Attached Resources Preview List */}
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
                    {editingChapter ? 'Save Changes' : 'Create Chapter'}
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
