// ── Authentication ───────────────────────────────────────────────────────────

export type Role = 'student' | 'teacher';

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token?: string;
}

// ── Courses / Subjects ───────────────────────────────────────────────────────

export interface Course {
  _id: string;
  name: string;
  code: string;
  description: string;
  classLevel: string;
  isActive: boolean;
  enrolledAt?: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  courseId: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

// ── Chapters / Lessons ───────────────────────────────────────────────────────

export interface Chapter {
  _id: string;
  title: string;
  description: string;
  subjectId: string | Subject;
  createdBy?: string;
  order: number;
  status: 'draft' | 'published';
  resources?: LessonResource[];
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonResource {
  _id: string;
  title: string;
  type: 'pdf' | 'video' | 'image';
  url: string;
  fileId: string;
  filePath: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  chapterId: string | Chapter;
  createdBy?: string;
  order: number;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  topics: string[];
  tags: string[];
  prerequisites: string[];
  status: 'draft' | 'published';
  publishedAt: string | null;
  isArchived: boolean;
  resources: LessonResource[];
  aiProcessing?: { status: string };
  createdAt?: string;
  updatedAt?: string;
}

// ── DPP / Questions ──────────────────────────────────────────────────────────

export type QuestionType = 'SINGLE_CORRECT' | 'MULTIPLE_CORRECT' | 'NUMERICAL';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionSubject = 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS';

export interface QuestionOption {
  text: string;
  key: string;
}

export interface QuestionImage {
  url: string;
  fileId: string;
  filePath: string;
  altText: string;
}

export interface MarkingScheme {
  correctMarks: number;
  incorrectMarks: number;
  unattemptedMarks: number;
  partialMarkingRules: Array<{ selectedOptions: string[]; marks: number }>;
}

export interface Question {
  _id: string;
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  correctOptions: string[];
  numericalAnswer?: number;
  numericalTolerance?: number;
  explanation: string;
  image?: QuestionImage;
  difficulty: QuestionDifficulty;
  subject: QuestionSubject;
  chapterId: string;
  topicTags: string[];
  marking: MarkingScheme;
  createdBy?: string;
  isActive: boolean;
}

export interface DPPQuestion {
  questionId: string | Question;
  order: number;
}

export interface DPP {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  chapterId: string | Chapter;
  questions: DPPQuestion[];
  questionCount?: number;
  durationMinutes: number;
  deadline: string;
  totalMarks: number;
  creationMethod: 'MANUAL' | 'PDF' | 'IMAGE' | 'MIXED';
  status: 'draft' | 'published';
  createdBy?: string;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Attempt ──────────────────────────────────────────────────────────────────

export type AttemptMode = 'PRACTICE' | 'EXAM';
export type AttemptStatus = 'IN_PROGRESS' | 'FINALIZING' | 'SUBMITTED' | 'AUTO_SUBMITTED';

export interface AttemptAnswer {
  questionId: string;
  selectedOptions: string[];
  numericalAnswer: number | null;
  markedForReview: boolean;
  visited: boolean;
}

export interface TopicReport {
  topic: string;
  total: number;
  correct: number;
  incorrect: number;
  marks: number;
}

export interface ReviewItem {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  selectedOptions: string[];
  numericalAnswer: number | null;
  attempted: boolean;
  isCorrect: boolean;
  marks: number;
  correctAnswer: string[] | number;
  explanation: string;
}

export interface Attempt {
  _id: string;
  student: string;
  dpp: string | Pick<DPP, '_id' | 'title' | 'durationMinutes'>;
  mode: AttemptMode;
  status: AttemptStatus;
  answers: AttemptAnswer[];
  startedAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracy: number;
  topicReport: TopicReport[];
}

export interface StartAttemptResponse {
  message: string;
  data: {
    attemptId: string;
    mode: AttemptMode;
    startedAt: string;
    durationMinutes: number | null;
    deadline: string | null;
    questions: PublicQuestion[];
  };
}

export interface PublicQuestion {
  questionId: string;
  number: number;
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  image?: QuestionImage;
  difficulty: QuestionDifficulty;
  topicTags: string[];
  marks: number;
  negativeMarks: number;
}

// ── Teacher Profile ───────────────────────────────────────────────────────────

export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'teacher';
  createdAt?: string;
}

// ── Enrollment ────────────────────────────────────────────────────────────────

export interface Enrollment {
  enrollmentId: string;
  enrolledAt: string;
  course: Course;
}

// ── Dashboard Data ────────────────────────────────────────────────────────────

export interface StudentDashboard {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    joinedAt: string;
  };
  summary: {
    enrolledCourses: number;
    subjects: number;
    chapters: number;
    lessons: number;
    dppAttempts?: number;
  };
  enrolledCourses: Course[];
  courseOverview: CourseOverview[];
  recentAttempts?: Attempt[];
}

export interface CourseOverview extends Course {
  subjects: SubjectOverview[];
}

export interface SubjectOverview extends Subject {
  chapters: ChapterOverview[];
}

export interface ChapterOverview extends Chapter {
  lessons: Lesson[];
}

// ── API Response Wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status?: 'success' | 'failed';
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  status: 'success' | 'failed';
  count: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface ApiError {
  message: string;
  status?: string;
  errors?: string[];
}
