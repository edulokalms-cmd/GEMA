import {
  User,
  Material,
  Quiz,
  Badge,
  StudentStats,
  StudentProgressSummary,
  SystemActivity,
  SystemSettings,
  AttendanceRecord,
  AttendanceSummary,
  StudentAcademicGrade,
  Assignment,
  AssignmentSubmission,
  Course,
  CourseGroup,
  CourseStudentInfo,
  DiscussionThread,
  DiscussionComment,
  DatabaseStats,
  DatabaseSnapshot,
  CloudDatabaseStatus,
  GradeComponentConfig,
  Department,
  AcademicClass,
  DegreeConfig,
} from '../types';

const TOKEN_KEY = 'gemabio_auth_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Terjadi kesalahan pada server.' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (identifier: string, password: string) =>
      fetchApi<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }),
    demoLogin: (role?: string, userId?: string) =>
      fetchApi<{ token: string; user: User }>('/api/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role, userId }),
      }),
    getMe: () => fetchApi<User>('/api/auth/me'),
    resetData: () => fetchApi<{ message: string }>('/api/reset-data', { method: 'POST' }),
  },
  materials: {
    getAll: (courseId?: string) =>
      fetchApi<Material[]>(
        courseId && courseId !== 'all'
          ? `/api/materials?course_id=${encodeURIComponent(courseId)}`
          : '/api/materials'
      ),
    getById: (id: string) => fetchApi<Material & { status: string; completed_at?: string; quiz?: any }>('/api/materials/' + id),
    create: (data: Partial<Material>) =>
      fetchApi<Material>('/api/materials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Material>) =>
      fetchApi<Material>('/api/materials/' + id, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<{ message: string }>('/api/materials/' + id, { method: 'DELETE' }),
    complete: (id: string) =>
      fetchApi<{
        success: boolean;
        progress?: any;
        points_awarded: number;
        category_bonus_awarded: boolean;
        new_badges: string[];
        total_points: number;
        level: any;
      }>('/api/materials/' + id + '/complete', { method: 'POST' }),
  },
  quizzes: {
    getAll: (courseId?: string) =>
      fetchApi<Quiz[]>(
        courseId && courseId !== 'all'
          ? `/api/quizzes?course_id=${encodeURIComponent(courseId)}`
          : '/api/quizzes'
      ),
    getById: (id: string) =>
      fetchApi<Quiz & { previous_result?: any }>('/api/quizzes/' + id),
    submit: (id: string, answers: Record<string, any>) =>
      fetchApi<{
        result: any;
        feedback: Array<{
          id: string;
          type?: string;
          question: string;
          user_answer: any;
          correct_answer: any;
          is_correct: boolean;
          earned_ratio?: number;
          explanation: string;
          detail_feedback?: string;
        }>;
        points_earned: number;
        new_badges: string[];
        total_points: number;
        level: any;
      }>('/api/quizzes/' + id + '/submit', {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
    create: (data: any) =>
      fetchApi<Quiz>('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi<Quiz>('/api/quizzes/' + id, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<{ message: string }>('/api/quizzes/' + id, { method: 'DELETE' }),
  },
  badges: {
    getAll: () => fetchApi<Array<Badge & { is_earned: boolean; earned_at: string | null }>>('/api/badges'),
    create: (data: Partial<Badge>) =>
      fetchApi<Badge>('/api/badges', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  progress: {
    getMy: (courseId?: string) =>
      fetchApi<StudentStats>(`/api/progress/my${courseId ? `?course_id=${courseId}` : ''}`),
    getStudentsOverview: () => fetchApi<StudentProgressSummary[]>('/api/students/overview'),
    getStudentDetails: (id: string) => fetchApi<any>('/api/students/' + id + '/details'),
  },
  admin: {
    getDashboard: () =>
      fetchApi<{
        totalUsers: number;
        totalStudents: number;
        totalLecturers: number;
        totalMaterials: number;
        totalQuizzes: number;
        recentActivities: SystemActivity[];
      }>('/api/admin/dashboard'),
  },
  dosen: {
    getDashboard: () =>
      fetchApi<{
        totalStudents: number;
        totalMaterials: number;
        totalQuizzes: number;
        avgStudentProgress: number;
        avgQuizScore: number;
        totalActivities: number;
        recentActivities: SystemActivity[];
      }>('/api/dosen/dashboard'),
  },
  users: {
    getAll: (role?: string, courseId?: string) => {
      const q = new URLSearchParams();
      if (role) q.set('role', role);
      if (courseId && courseId !== 'all') q.set('course_id', courseId);
      const str = q.toString();
      return fetchApi<User[]>(`/api/users${str ? `?${str}` : ''}`);
    },
    create: (data: any) =>
      fetchApi<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi<User>('/api/users/' + id, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<{ message: string }>('/api/users/' + id, { method: 'DELETE' }),
    resetPassword: (id: string, newPassword?: string) =>
      fetchApi<{
        success: boolean;
        message: string;
        default_password: string;
        user: User;
      }>('/api/users/' + id + '/reset-password', {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      }),
    import: (users: any[]) =>
      fetchApi<{ success: boolean; imported: number; errors: string[] }>('/api/users/import', {
        method: 'POST',
        body: JSON.stringify({ users }),
      }),
    deleteBatch: (userIds: string[]) =>
      fetchApi<{ message: string; deleted_count: number }>('/api/users/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ user_ids: userIds }),
      }),
  },
  settings: {
    get: () => fetchApi<SystemSettings>('/api/settings'),
    update: (data: Partial<SystemSettings>) =>
      fetchApi<SystemSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getDegrees: () => fetchApi<DegreeConfig[]>('/api/settings/degrees'),
    saveDegrees: (degrees: DegreeConfig[]) =>
      fetchApi<DegreeConfig[]>('/api/settings/degrees', {
        method: 'PUT',
        body: JSON.stringify({ degrees }),
      }),
  },
  attendance: {
    getAll: (meetingNumber?: number) =>
      fetchApi<AttendanceRecord[]>(`/api/attendance${meetingNumber ? `?meeting=${meetingNumber}` : ''}`),
    getSummary: () => fetchApi<AttendanceSummary[]>('/api/attendance/summary'),
    getMy: () =>
      fetchApi<{ records: AttendanceRecord[]; summary: AttendanceSummary }>('/api/attendance/my'),
    saveBatch: (data: {
      meeting_number: number;
      meeting_topic: string;
      date: string;
      records: Array<{ user_id: string; status: string; notes?: string }>;
    }) =>
      fetchApi<{ message: string; count: number }>('/api/attendance/batch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  grades: {
    getAcademicSummary: () => fetchApi<StudentAcademicGrade[]>('/api/grades/academic'),
    getMyGrade: () => fetchApi<StudentAcademicGrade>('/api/grades/my'),
    getComponents: () => fetchApi<GradeComponentConfig[]>('/api/grades/components'),
    getComponentsDetail: () =>
      fetchApi<{
        standard_components: GradeComponentConfig[];
        standard_weights: Record<string, number>;
        components: GradeComponentConfig[];
        is_customized: boolean;
        lecturer_name?: string;
      }>('/api/grades/components?detail=true'),
    updateComponents: (components: GradeComponentConfig[]) =>
      fetchApi<{ message: string; components: GradeComponentConfig[]; is_customized?: boolean }>('/api/grades/components', {
        method: 'PUT',
        body: JSON.stringify({ components }),
      }),
    resetComponents: () =>
      fetchApi<{ message: string; components: GradeComponentConfig[] }>('/api/grades/components/reset', {
        method: 'POST',
      }),
    updateGrade: (data: {
      user_id: string;
      uts_score?: number;
      uas_score?: number;
      assignment_score?: number;
      component_scores?: Record<string, number>;
      notes?: string;
    }) =>
      fetchApi<StudentAcademicGrade>('/api/grades/academic/update', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  assignments: {
    getAll: () => fetchApi<Assignment[]>('/api/assignments'),
    create: (data: Partial<Assignment>) =>
      fetchApi<Assignment>('/api/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMySubmissions: () => fetchApi<AssignmentSubmission[]>('/api/assignments/my-submissions'),
    getSubmissions: (assignmentId: string) =>
      fetchApi<AssignmentSubmission[]>(`/api/assignments/${assignmentId}/submissions`),
    submit: (assignmentId: string, content: string) =>
      fetchApi<AssignmentSubmission>(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    gradeSubmission: (submissionId: string, score: number, feedback: string) =>
      fetchApi<AssignmentSubmission>(`/api/assignments/submissions/${submissionId}/grade`, {
        method: 'POST',
        body: JSON.stringify({ score, feedback }),
      }),
    update: (id: string, data: Partial<Assignment>) =>
      fetchApi<Assignment>(`/api/assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ message: string }>(`/api/assignments/${id}`, {
        method: 'DELETE',
      }),
    deleteSubmission: (submissionId: string) =>
      fetchApi<{ message: string }>(`/api/assignments/submissions/${submissionId}`, {
        method: 'DELETE',
      }),
  },
  activities: {
    getAll: () => fetchApi<SystemActivity[]>('/api/activities'),
  },
  courses: {
    getAll: () => fetchApi<Course[]>('/api/courses'),
    getById: (id: string) => fetchApi<Course>(`/api/courses/${id}`),
    create: (data: Partial<Course>) =>
      fetchApi<Course>('/api/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Course>) =>
      fetchApi<Course>(`/api/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ message: string }>(`/api/courses/${id}`, {
        method: 'DELETE',
      }),
    getStudents: (courseId: string) =>
      fetchApi<{
        course: Course;
        students: CourseStudentInfo[];
        groups: CourseGroup[];
      }>(`/api/courses/${courseId}/students`),
    getGroups: (courseId: string) => fetchApi<CourseGroup[]>(`/api/courses/${courseId}/groups`),
    createGroup: (courseId: string, data: { name: string; description?: string; member_ids?: string[]; leader_id?: string }) =>
      fetchApi<CourseGroup>(`/api/courses/${courseId}/groups`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateGroup: (courseId: string, groupId: string, data: Partial<CourseGroup>) =>
      fetchApi<CourseGroup>(`/api/courses/${courseId}/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteGroup: (courseId: string, groupId: string) =>
      fetchApi<{ message: string }>(`/api/courses/${courseId}/groups/${groupId}`, {
        method: 'DELETE',
      }),
    autoGenerateGroups: (courseId: string, data: { group_count: number; prefix?: string; randomize?: boolean; reset_existing?: boolean }) =>
      fetchApi<{ message: string; groups: CourseGroup[] }>(`/api/courses/${courseId}/groups/auto-generate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  discussions: {
    getAll: (params?: { course_id?: string; category?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.course_id) q.set('course_id', params.course_id);
      if (params?.category) q.set('category', params.category);
      if (params?.search) q.set('search', params.search);
      const str = q.toString();
      return fetchApi<DiscussionThread[]>(`/api/discussions${str ? `?${str}` : ''}`);
    },
    getById: (id: string) => fetchApi<DiscussionThread>(`/api/discussions/${id}`),
    create: (data: {
      course_id: string;
      title: string;
      content: string;
      category: string;
      meeting_number?: number;
      tags?: string[];
    }) =>
      fetchApi<DiscussionThread>('/api/discussions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addComment: (threadId: string, content: string) =>
      fetchApi<DiscussionComment>(`/api/discussions/${threadId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    toggleLikeThread: (threadId: string) =>
      fetchApi<{ likes: number; liked: boolean }>(`/api/discussions/${threadId}/like`, {
        method: 'POST',
      }),
    toggleLike: (threadId: string) =>
      fetchApi<{ likes: number; liked: boolean }>(`/api/discussions/${threadId}/like`, {
        method: 'POST',
      }),
    toggleLikeComment: (threadId: string, commentId: string) =>
      fetchApi<{ likes: number; liked: boolean }>(`/api/discussions/${threadId}/comments/${commentId}/like`, {
        method: 'POST',
      }),
    toggleCommentLike: (threadId: string, commentId: string) =>
      fetchApi<{ likes: number; liked: boolean }>(`/api/discussions/${threadId}/comments/${commentId}/like`, {
        method: 'POST',
      }),
    togglePin: (threadId: string) =>
      fetchApi<{ is_pinned: boolean }>(`/api/discussions/${threadId}/pin`, {
        method: 'PATCH',
      }),
    toggleEndorseComment: (threadId: string, commentId: string) =>
      fetchApi<{ is_endorsed: boolean }>(`/api/discussions/${threadId}/comments/${commentId}/endorse`, {
        method: 'PATCH',
      }),
    toggleCommentEndorse: (threadId: string, commentId: string) =>
      fetchApi<{ is_endorsed: boolean }>(`/api/discussions/${threadId}/comments/${commentId}/endorse`, {
        method: 'PATCH',
      }),
    awardPoint: (
      threadId: string,
      targetUserIdOrData: string | { target_user_id: string; points: number; reason?: string },
      points?: number,
      reason?: string
    ) => {
      const payload =
        typeof targetUserIdOrData === 'object'
          ? targetUserIdOrData
          : { target_user_id: targetUserIdOrData, points, reason };
      return fetchApi<{ message: string; points_awarded: number }>(
        `/api/discussions/${threadId}/award-point`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
    },
    deleteThread: (id: string) =>
      fetchApi<{ message: string }>(`/api/discussions/${id}`, {
        method: 'DELETE',
      }),
    deleteComment: (threadId: string, commentId: string) =>
      fetchApi<{ message: string }>(`/api/discussions/${threadId}/comments/${commentId}`, {
        method: 'DELETE',
      }),
  },
  database: {
    getStats: () => fetchApi<DatabaseStats>('/api/database/stats'),
    exportData: () => fetchApi<any>('/api/database/export'),
    getSnapshots: () => fetchApi<DatabaseSnapshot[]>('/api/database/snapshots'),
    createSnapshot: (label?: string) =>
      fetchApi<{ message: string; snapshot: DatabaseSnapshot }>('/api/database/snapshot', {
        method: 'POST',
        body: JSON.stringify({ label }),
      }),
    restoreSnapshot: (id: string) =>
      fetchApi<{ message: string; stats?: any }>('/api/database/restore/snapshot/' + id, {
        method: 'POST',
      }),
    restoreUpload: (backupData: any) =>
      fetchApi<{ message: string; stats?: any }>('/api/database/restore/upload', {
        method: 'POST',
        body: JSON.stringify({ backup_data: backupData }),
      }),
    deleteSnapshot: (id: string) =>
      fetchApi<{ message: string }>('/api/database/snapshots/' + id, {
        method: 'DELETE',
      }),
    resetFactory: () =>
      fetchApi<{ message: string }>('/api/database/reset-factory', {
        method: 'POST',
      }),
    getCloudStatus: () => fetchApi<CloudDatabaseStatus>('/api/database/cloud-status'),
    syncCloud: () =>
      fetchApi<{ message: string; status: CloudDatabaseStatus }>('/api/database/cloud-sync', {
        method: 'POST',
      }),
  },
  departments: {
    getAll: () => fetchApi<Department[]>('/api/departments'),
    getById: (id: string) => fetchApi<Department>('/api/departments/' + id),
    create: (data: Partial<Department>) =>
      fetchApi<Department>('/api/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Department>) =>
      fetchApi<Department>('/api/departments/' + id, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ message: string }>('/api/departments/' + id, {
        method: 'DELETE',
      }),
  },
  classes: {
    getAll: () => fetchApi<AcademicClass[]>('/api/classes'),
    getById: (id: string) => fetchApi<AcademicClass>('/api/classes/' + id),
    create: (data: Partial<AcademicClass>) =>
      fetchApi<AcademicClass>('/api/classes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<AcademicClass>) =>
      fetchApi<AcademicClass>('/api/classes/' + id, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ message: string }>('/api/classes/' + id, {
        method: 'DELETE',
      }),
  },
};
