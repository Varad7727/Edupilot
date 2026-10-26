import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BrandEntrance } from './components/BrandEntrance';

// Layouts
import { StudentLayout } from './layouts/StudentLayout';
import { TeacherLayout } from './layouts/TeacherLayout';

// Pages
import AuthPage from './pages/AuthPage';

// Student Pages
import StudentHome from './pages/student/StudentHome';
import StudentLearning from './pages/student/StudentLearning';
import ChapterView from './pages/student/ChapterView';
import StudentPractice from './pages/student/StudentPractice';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';
import StudentResults from './pages/student/StudentResults';
import StudentSettings from './pages/student/StudentSettings';

// Teacher Pages
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherChapters from './pages/teacher/TeacherChapters';
import TeacherLessons from './pages/teacher/TeacherLessons';
import TeacherDPPs from './pages/teacher/TeacherDPPs';
import TeacherSettings from './pages/teacher/TeacherSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={user.role === 'student' ? '/student' : '/teacher'} replace />;
}

export default function App() {
  const [entranceDone, setEntranceDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandEntrance onComplete={() => setEntranceDone(true)} />
        <BrowserRouter>
          <Routes>
            {/* Root */}
            <Route path="/" element={<RootRedirect />} />

            {/* Auth */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Standalone Exam Environment (distraction-free, no sidebar) */}
            <Route
              path="/student/exam/:dppId/:mode"
              element={
                <ProtectedRoute role="student">
                  <ExamPage />
                </ProtectedRoute>
              }
            />

            {/* Student Application */}
            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <StudentLayout>
                    <StudentHome />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/learning"
              element={
                <ProtectedRoute role="student">
                  <StudentLayout>
                    <StudentLearning />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/learning/chapter/:chapterId"
              element={
                <ProtectedRoute role="student">
                  <StudentLayout>
                    <ChapterView />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/practice"
              element={
                <ProtectedRoute role="student">
                  <StudentLayout>
                    <StudentPractice />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results"
              element={
                <ProtectedRoute role="student">
                  <StudentLayout>
                    <StudentResults />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results/:attemptId"
              element={
                <ProtectedRoute role="student">
                  <StudentLayout>
                    <ResultPage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/settings"
              element={
                <ProtectedRoute role="student">
                  <StudentLayout>
                    <StudentSettings />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />

            {/* Teacher Studio Application */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherLayout>
                    <TeacherHome />
                  </TeacherLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/chapters"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherLayout>
                    <TeacherChapters />
                  </TeacherLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/lessons"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherLayout>
                    <TeacherLessons />
                  </TeacherLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/dpps"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherLayout>
                    <TeacherDPPs />
                  </TeacherLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/settings"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherLayout>
                    <TeacherSettings />
                  </TeacherLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
