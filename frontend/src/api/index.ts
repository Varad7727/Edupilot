import api from './client';
import type {
  AuthResponse,
  StudentDashboard,
  Course,
  Subject,
  Chapter,
  Lesson,
  DPP,
  Attempt,
  StartAttemptResponse,
  Enrollment,
  Teacher,
  ApiResponse,
  PaginatedResponse,
  LessonResource,
} from '../types';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  registerStudent: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => api.post<AuthResponse>('/auth/student/register', data),

  loginStudent: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/student/login', data),

  logoutStudent: () => api.post('/auth/student/logout'),

  registerTeacher: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => api.post<AuthResponse>('/auth/teacher/register', data),

  loginTeacher: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/teacher/login', data),

  logoutTeacher: () => api.post('/auth/teacher/logout'),
};

// ── Courses (public) ──────────────────────────────────────────────────────────

export const courseApi = {
  getAll: () => api.get<{ message?: string; status: string; data: Course[] }>('/courses'),
  getById: (courseId: string) => api.get<{ status: string; data: Course }>(`/courses/${courseId}`),
  getSubjectsByCourse: (courseId: string) =>
    api.get<{ status: string; count: number; subject: Subject[] }>(`/courses/${courseId}/subjects`),
  getSubjectById: (subjectId: string) =>
    api.get<{ status: string; subject: Subject }>(`/courses/subjects/${subjectId}`),
};

// ── Student ───────────────────────────────────────────────────────────────────

export const studentApi = {
  getDashboard: () =>
    api.get<ApiResponse<StudentDashboard>>('/students/dashboard'),

  enroll: (courseId: string) =>
    api.post<ApiResponse<Enrollment>>('/students/enrollments', { courseId }),

  getEnrollments: () =>
    api.get<{ status: string; count: number; data: Enrollment[] }>(
      '/students/enrollments'
    ),

  getChaptersBySubject: (subjectId: string) =>
    api.get<{ status: string; count: number; data: Chapter[] }>(
      `/students/chapters/subject/${subjectId}`
    ),

  getLessonsByChapter: (chapterId: string) =>
    api.get<{ status: string; count: number; data: Lesson[] }>(
      `/students/lessons/chapter/${chapterId}`
    ),

  getDpps: () =>
    api.get<{ count: number; data: DPP[] }>('/students/dpps'),
};

// ── Student DPP Attempts ──────────────────────────────────────────────────────

export const attemptApi = {
  start: (dppId: string, mode: 'PRACTICE' | 'EXAM') =>
    api.post<StartAttemptResponse>(`/students/dpps/${dppId}/attempts`, {
      mode,
    }),

  saveAnswer: (
    attemptId: string,
    payload: {
      questionId: string;
      selectedOptions?: string[];
      numericalAnswer?: number | null;
      markedForReview?: boolean;
      visited?: boolean;
    }
  ) => api.patch(`/students/dpps/attempts/${attemptId}/answers`, payload),

  submit: (attemptId: string) =>
    api.post(`/students/dpps/attempts/${attemptId}/submit`),

  getResult: (attemptId: string) =>
    api.get<{ data: Attempt }>(`/students/dpps/attempts/${attemptId}`),

  getMyAttempts: () =>
    api.get<{ count: number; data: Attempt[] }>('/students/dpps/attempts'),
};

// ── Teacher Profile ───────────────────────────────────────────────────────────

export const teacherApi = {
  getProfile: () => api.get<ApiResponse<Teacher>>('/teachers/me'),

  updateProfile: (data: Partial<Pick<Teacher, 'firstName' | 'lastName' | 'email'> & { password: string }>) =>
    api.patch<ApiResponse<Teacher>>('/teachers/update', data),
};

// ── Teacher Chapters ──────────────────────────────────────────────────────────

export const chapterApi = {
  create: (data: {
    title: string;
    description?: string;
    subjectId: string;
    order: number;
    resources?: LessonResource[];
  }) => api.post<ApiResponse<Chapter>>('/teachers/chapters', data),

  getAll: () =>
    api.get<{ status: string; count: number; data: Chapter[] }>(
      '/teachers/chapters'
    ),

  getById: (chapterId: string) =>
    api.get<ApiResponse<Chapter>>(`/teachers/chapters/${chapterId}`),

  update: (
    chapterId: string,
    data: Partial<{
      title: string;
      description: string;
      order: number;
      status: 'draft' | 'published';
      resources: LessonResource[];
    }>
  ) => api.patch<ApiResponse<Chapter>>(`/teachers/chapters/${chapterId}`, data),

  archive: (chapterId: string) =>
    api.delete<ApiResponse<Chapter>>(`/teachers/chapters/${chapterId}`),
};

// ── Teacher Lessons ───────────────────────────────────────────────────────────

export const lessonApi = {
  create: (data: {
    title: string;
    description: string;
    chapterId: string;
    order: number;
    estimatedDuration?: number;
    difficulty?: string;
    learningObjectives?: string[];
    topics?: string[];
    tags?: string[];
    prerequisites?: string[];
    resources?: LessonResource[];
    aiContext?: object;
  }) => api.post<ApiResponse<Lesson>>('/teachers/lessons', data),

  getAll: (params?: {
    chapterId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<Lesson>>('/teachers/lessons', { params }),

  getByChapter: (chapterId: string) =>
    api.get<{ status: string; count: number; data: Lesson[] }>(
      `/teachers/lessons/chapter/${chapterId}`
    ),

  getById: (lessonId: string) =>
    api.get<ApiResponse<Lesson>>(`/teachers/lessons/${lessonId}`),

  update: (lessonId: string, data: Partial<Lesson>) =>
    api.patch<ApiResponse<Lesson>>(`/teachers/lessons/${lessonId}`, data),

  publish: (lessonId: string) =>
    api.patch<ApiResponse<Lesson>>(`/teachers/lessons/${lessonId}/publish`),

  unpublish: (lessonId: string) =>
    api.patch<ApiResponse<Lesson>>(`/teachers/lessons/${lessonId}/unpublish`),

  archive: (lessonId: string) =>
    api.delete<ApiResponse<Lesson>>(`/teachers/lessons/${lessonId}`),
};

// ── Teacher DPPs ──────────────────────────────────────────────────────────────

export const dppApi = {
  create: (data: {
    title: string;
    description?: string;
    instructions?: string;
    chapterId: string;
    durationMinutes: number;
    deadline: string;
    questions?: Array<{ questionId: string; order: number }>;
    creationMethod?: string;
  }) => api.post<ApiResponse<{ dpp: DPP }>>('/teachers/dpps', data),

  getAll: () =>
    api.get<{ status: string; results: number; data: { dpps: DPP[] } }>(
      '/teachers/dpps'
    ),

  getById: (dppId: string) =>
    api.get<ApiResponse<{ dpp: DPP }>>(`/teachers/dpps/${dppId}`),

  update: (dppId: string, data: Partial<DPP>) =>
    api.patch<ApiResponse<{ dpp: DPP }>>(`/teachers/dpps/${dppId}`, data),

  addQuestion: (dppId: string, questionData: object) =>
    api.post(`/teachers/dpps/${dppId}/questions`, questionData),

  updateQuestion: (dppId: string, questionId: string, data: object) =>
    api.patch(`/teachers/dpps/${dppId}/questions/${questionId}`, data),

  removeQuestion: (dppId: string, questionId: string) =>
    api.delete(`/teachers/dpps/${dppId}/questions/${questionId}`),

  reorderQuestions: (dppId: string, questions: Array<{ questionId: string; order: number }>) =>
    api.patch(`/teachers/dpps/${dppId}/questions/reorder`, { questions }),

  publish: (dppId: string) =>
    api.patch(`/teachers/dpps/${dppId}/publish`),

  getStudentAttempts: () =>
    api.get<{
      status: string;
      count: number;
      analytics: {
        totalAttempts: number;
        avgScore: number;
        avgAccuracy: number;
        uniqueStudents: number;
      };
      data: Array<{
        _id: string;
        student: { _id: string; firstName: string; lastName: string; email: string };
        dpp: { _id: string; title: string; totalMarks: number; durationMinutes?: number };
        mode: 'PRACTICE' | 'EXAM';
        score: number;
        maxScore: number;
        accuracy: number;
        correctCount: number;
        incorrectCount: number;
        unansweredCount: number;
        timeTakenSeconds: number;
        submittedAt: string;
      }>;
    }>('/teachers/dpps/analytics/attempts'),
};

// ── Uploads ───────────────────────────────────────────────────────────────────

export const uploadApi = {
  uploadPdf: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/teachers/uploads/pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/teachers/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
