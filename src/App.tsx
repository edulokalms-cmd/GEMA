import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LogoutConfirmModal } from './components/common/LogoutConfirmModal';

// Course and Discussion components
import { CourseManagementView } from './components/courses/CourseManagementView';
import { StudentCoursesView } from './components/courses/StudentCoursesView';
import { DiscussionForumView } from './components/forum/DiscussionForumView';

// Mahasiswa components
import { StudentDashboard } from './components/mahasiswa/StudentDashboard';
import { MaterialListView } from './components/mahasiswa/MaterialListView';
import { MaterialDetailView } from './components/mahasiswa/MaterialDetailView';
import { StudentQuizListView } from './components/mahasiswa/StudentQuizListView';
import { QuizPlayerView } from './components/mahasiswa/QuizPlayerView';
import { MyProgressView } from './components/mahasiswa/MyProgressView';
import { MyBadgesView } from './components/mahasiswa/MyBadgesView';
import { StudentProfileView } from './components/mahasiswa/StudentProfileView';

// Dosen components
import { DosenDashboard } from './components/dosen/DosenDashboard';
import { MaterialManagement } from './components/dosen/MaterialManagement';
import { QuizManagement } from './components/dosen/QuizManagement';
import { StudentProgressView } from './components/dosen/StudentProgressView';
import { BadgeManagement } from './components/dosen/BadgeManagement';
import { DosenProfileView } from './components/dosen/DosenProfileView';

// Admin components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagement } from './components/admin/UserManagement';
import { SystemSettingsView } from './components/admin/SystemSettingsView';
import { AdminProfileView } from './components/admin/AdminProfileView';
import { DatabaseBackupView } from './components/admin/DatabaseBackupView';
import { DepartmentManagementView } from './components/admin/DepartmentManagementView';
import { ClassManagementView } from './components/admin/ClassManagementView';

// Presensi, Penilaian, and Tugas components
import { AttendanceManagement } from './components/presensi/AttendanceManagement';
import { StudentAttendanceView } from './components/presensi/StudentAttendanceView';
import { AcademicGradesManagement } from './components/penilaian/AcademicGradesManagement';
import { StudentGradeTranscriptView } from './components/penilaian/StudentGradeTranscriptView';
import { AssignmentManagement } from './components/tugas/AssignmentManagement';
import { StudentAssignmentView } from './components/tugas/StudentAssignmentView';

import { api } from './services/api';
import { LeaderboardView } from './components/common/LeaderboardView';
import { AuditLogView } from './components/admin/AuditLogView';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sub-view drilldown states
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [studentPoints, setStudentPoints] = useState<number | undefined>(undefined);

  // Fetch student points for Navbar
  const refreshStudentStats = async () => {
    if (user && user.role === 'mahasiswa') {
      try {
        const stats = await api.progress.getMy();
        setStudentPoints(stats.total_points);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (user && user.role === 'mahasiswa') {
      refreshStudentStats();
    }
    // Reset view drilldowns on tab change or user switch
    setActiveMaterialId(null);
    setActiveQuizId(null);
    setCurrentTab('dashboard');
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black mx-auto animate-bounce">
            GB
          </div>
          <p className="text-sm font-semibold text-slate-600">Memuat GEMA BIO...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Handle drilldown navigations
  const handleSelectMaterial = (matId?: string) => {
    if (matId) setActiveMaterialId(matId);
    setCurrentTab('materials');
  };

  const handleSelectQuiz = (qId?: string) => {
    if (qId) setActiveQuizId(qId);
    setCurrentTab('quizzes');
  };

  // Render view based on role and tab
  const renderView = () => {
    // 1. Mahasiswa Views
    if (user.role === 'mahasiswa') {
      if (currentTab === 'dashboard') {
        return (
          <StudentDashboard
            onNavigateToMaterial={(id) => {
              if (id) {
                setActiveMaterialId(id);
                setCurrentTab('materials');
              } else {
                setCurrentTab('materials');
              }
            }}
            onNavigateToQuiz={(id) => {
              if (id) {
                setActiveQuizId(id);
                setCurrentTab('quizzes');
              } else {
                setCurrentTab('quizzes');
              }
            }}
            onNavigateTab={setCurrentTab}
          />
        );
      }

      if (currentTab === 'materials') {
        if (activeMaterialId) {
          return (
            <MaterialDetailView
              materialId={activeMaterialId}
              onBack={() => setActiveMaterialId(null)}
              onStartQuiz={(qId) => {
                setActiveQuizId(qId);
                setCurrentTab('quizzes');
              }}
              onRefreshStats={refreshStudentStats}
            />
          );
        }
        return (
          <MaterialListView
            onSelectMaterial={handleSelectMaterial}
            onSelectQuiz={handleSelectQuiz}
          />
        );
      }

      if (currentTab === 'quizzes') {
        if (activeQuizId) {
          return (
            <QuizPlayerView
              quizId={activeQuizId}
              onBack={() => setActiveQuizId(null)}
              onViewProgress={() => {
                setActiveQuizId(null);
                setCurrentTab('progress');
              }}
              onRefreshStats={refreshStudentStats}
            />
          );
        }
        return <StudentQuizListView onSelectQuiz={handleSelectQuiz} />;
      }

      if (currentTab === 'courses') {
        return <StudentCoursesView onNavigateTab={setCurrentTab} />;
      }

      if (currentTab === 'discussions') {
        return <DiscussionForumView />;
      }

      if (currentTab === 'tugas') {
        return <StudentAssignmentView />;
      }

      if (currentTab === 'presensi') {
        return <StudentAttendanceView />;
      }

      if (currentTab === 'penilaian') {
        return <StudentGradeTranscriptView />;
      }

      if (currentTab === 'progress') {
        return (
          <MyProgressView
            onNavigateToBadges={() => setCurrentTab('badges')}
            onNavigateToMaterials={() => {
              setActiveMaterialId(null);
              setCurrentTab('materials');
            }}
          />
        );
      }

      if (currentTab === 'badges') {
        return <MyBadgesView />;
      }

      if (currentTab === 'leaderboard') {
        return <LeaderboardView />;
      }

      if (currentTab === 'profile') {
        return <StudentProfileView />;
      }

      return (
        <StudentDashboard
          onNavigateToMaterial={handleSelectMaterial}
          onNavigateToQuiz={handleSelectQuiz}
          onNavigateTab={setCurrentTab}
        />
      );
    }

    // 2. Dosen Views
    if (user.role === 'dosen') {
      if (currentTab === 'dashboard') {
        return <DosenDashboard onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'courses') {
        return <CourseManagementView onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'discussions') {
        return <DiscussionForumView />;
      }
      if (currentTab === 'presensi') {
        return <AttendanceManagement />;
      }
      if (currentTab === 'tugas') {
        return <AssignmentManagement />;
      }
      if (currentTab === 'penilaian') {
        return <AcademicGradesManagement />;
      }
      if (currentTab === 'materials') {
        return <MaterialManagement />;
      }
      if (currentTab === 'quizzes') {
        return <QuizManagement />;
      }
      if (currentTab === 'classes') {
        return <ClassManagementView onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'departments') {
        return <DepartmentManagementView onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'students') {
        return <UserManagement />;
      }
      if (currentTab === 'student_progress') {
        return <StudentProgressView />;
      }
      if (currentTab === 'badges') {
        return <BadgeManagement />;
      }
      if (currentTab === 'leaderboard') {
        return <LeaderboardView />;
      }
      if (currentTab === 'audit_log') {
        return <AuditLogView />;
      }
      if (currentTab === 'settings') {
        return <SystemSettingsView onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'profile') {
        return <DosenProfileView />;
      }
      return <DosenDashboard onNavigateTab={setCurrentTab} />;
    }

    // 3. Admin Views
    if (user.role === 'admin') {
      if (currentTab === 'dashboard') {
        return <AdminDashboard onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'departments') {
        return <DepartmentManagementView onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'classes') {
        return <ClassManagementView onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'courses') {
        return <CourseManagementView onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'discussions') {
        return <DiscussionForumView />;
      }
      if (currentTab === 'presensi') {
        return <AttendanceManagement />;
      }
      if (currentTab === 'tugas') {
        return <AssignmentManagement />;
      }
      if (currentTab === 'penilaian') {
        return <AcademicGradesManagement />;
      }
      if (currentTab === 'users') {
        return <UserManagement />;
      }
      if (currentTab === 'materials') {
        return <MaterialManagement />;
      }
      if (currentTab === 'quizzes') {
        return <QuizManagement />;
      }
      if (currentTab === 'student_progress') {
        return <StudentProgressView />;
      }
      if (currentTab === 'badges') {
        return <BadgeManagement />;
      }
      if (currentTab === 'leaderboard') {
        return <LeaderboardView />;
      }
      if (currentTab === 'audit_log') {
        return <AuditLogView />;
      }
      if (currentTab === 'settings') {
        return <SystemSettingsView onNavigateTab={setCurrentTab} />;
      }
      if (currentTab === 'database') {
        return <DatabaseBackupView />;
      }
      if (currentTab === 'profile') {
        return <AdminProfileView />;
      }
      return <AdminDashboard onNavigateTab={setCurrentTab} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        totalPoints={studentPoints}
        onRequestLogout={() => setShowLogoutConfirm(true)}
        onNavigateToProfile={() => setCurrentTab('profile')}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setActiveMaterialId(null);
            setActiveQuizId(null);
            setCurrentTab(tab);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onRequestLogout={() => setShowLogoutConfirm(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        userName={user?.name}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CourseProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </CourseProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
