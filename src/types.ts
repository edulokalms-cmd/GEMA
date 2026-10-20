export type UserRole = 'admin' | 'dosen' | 'mahasiswa';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  student_id?: string; // NIM for mahasiswa
  nidn?: string; // NIDN for dosen / admin
  nip?: string; // NIP for dosen / admin
  class_name?: string; // Kelas mahasiswa (e.g. BIO-2A, BIO-2B)
  department?: string; // Program Studi (e.g. Biologi, Pendidikan Biologi)
  avatar?: string;
  created_at: string;
}

export interface MaterialAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'presentation' | 'image' | 'spreadsheet' | 'link';
  url: string;
  size?: string;
}

export interface Material {
  id: string;
  course_id?: string;
  title: string;
  category: string;
  description: string;
  content: string;
  learning_objectives: string[];
  estimated_time: string;
  order_number: number;
  created_at: string;
  attachments?: MaterialAttachment[];
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'matching'
  | 'short_answer'
  | 'essay'
  | 'case_study';

export interface MatchingPair {
  id: string;
  premise: string;
  target: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  type?: QuestionType;
  question: string;
  case_context?: string; // Skenario kasus
  // Options for single_choice / multiple_choice / case_study
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  // Matching pairs
  matching_pairs?: MatchingPair[];
  matching_available_targets?: string[];
  // Answers (masked on student quiz take)
  correct_answer?: string; // 'a'|'b'|'c'|'d' or 'true'|'false'
  correct_answers_multi?: string[]; // ['a', 'c']
  correct_short_answers?: string[]; // ['ssd', 'solid state drive']
  essay_rubric_keywords?: string[]; // keywords for essay auto-eval
  essay_sample_answer?: string; // model answer for review
  explanation: string;
}

export interface Quiz {
  id: string;
  course_id?: string;
  material_id: string;
  material_title?: string;
  title: string;
  description: string;
  points: number;
  question_count?: number;
  questions?: Question[];
  created_at: string;
}

export interface MaterialProgress {
  id: string;
  user_id: string;
  material_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
}

export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  quiz_title?: string;
  material_title?: string;
  score: number;
  correct_count: number;
  total_questions: number;
  points_earned: number;
  answers: Record<string, any>;
  completed_at: string;
}

export type BadgeConditionType = 
  | 'first_material'
  | 'first_quiz'
  | 'materials_count'
  | 'quiz_perfect'
  | 'points_threshold'
  | 'all_materials';

export interface Badge {
  id: string;
  name: string;
  description: string;
  requirement: string;
  icon: string;
  condition_type: BadgeConditionType;
  condition_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge?: Badge;
  earned_at: string;
}

export interface PointRecord {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  created_at: string;
}

export interface SystemActivity {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  detail: string;
  created_at: string;
}

export interface CourseProgressSummary {
  course_id: string;
  course_name: string;
  course_code?: string;
  total_materials: number;
  completed_materials: number;
  materials_progress_percent: number;
  total_quizzes: number;
  completed_quizzes: number;
  quizzes_progress_percent: number;
  average_quiz_score: number;
  overall_progress_percent: number;
  status: 'not_started' | 'in_progress' | 'completed';
  next_material_title?: string;
  next_material_id?: string;
}

export interface StudentStats {
  total_points: number;
  level: {
    level: number;
    title: string;
    nextThreshold: number;
    prevThreshold: number;
    progressPercent: number;
  };
  total_materials: number;
  completed_materials: number;
  materials_progress_percent: number;
  total_quizzes_taken: number;
  average_quiz_score: number;
  earned_badges_count: number;
  recent_activities: PointRecord[];
  next_material?: Material;
  courses_progress?: CourseProgressSummary[];
}

export interface StudentProgressSummary {
  user: User;
  total_points: number;
  level: string;
  completed_materials_count: number;
  total_materials_count: number;
  progress_percent: number;
  average_quiz_score: number;
  quizzes_taken_count: number;
  badges_count: number;
  last_activity: string;
}

export interface DegreeConfig {
  code: string;
  name: string;
  level?: string;
  is_active: boolean;
  description?: string;
  is_default?: boolean;
}

export interface SystemSettings {
  campus_name: string;
  course_name: string;
  course_code?: string;
  semester: string;
  academic_year: string;
  lecturer_name?: string;
  app_logo?: string;
  material_point: number;
  quiz_base_point: number;
  quiz_correct_point: number;
  category_bonus_point?: number;
  active_course_id?: string;
  grade_weights: {
    attendance: number; // 15
    participation: number; // 15
    assignment: number; // 20
    uts: number; // 25
    uas: number; // 25
  };
  grade_components?: GradeComponentConfig[];
  available_degrees?: DegreeConfig[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  academic_year: string;
  sks: number;
  department?: string;
  department_id?: string;
  lecturer_id?: string;
  lecturer_name: string;
  lecturer_ids?: string[];
  enrolled_classes?: string[];
  enrolled_student_ids?: string[];
  description: string;
  color?: string;
  icon?: string;
  enrolled_students_count?: number;
  created_at?: string;
}

export interface CourseGroup {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  leader_id?: string;
  leader_name?: string;
  member_ids: string[];
  created_at: string;
  updated_at?: string;
}

export interface CourseStudentInfo {
  id: string;
  name: string;
  student_id?: string;
  class_name?: string;
  email?: string;
  avatar?: string;
  group_id?: string;
  group_name?: string;
  is_leader?: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  degree: 'S1' | 'D4' | 'S2' | 'D3' | string;
  faculty: string;
  head_name?: string;
  head_id?: string;
  head_nidn?: string;
  accreditation?: 'Unggul' | 'A' | 'Baik Sekali' | 'B' | 'Baik' | string;
  description?: string;
  created_at?: string;
  classes_count?: number;
  students_count?: number;
  lecturers_count?: number;
  courses_count?: number;
}

export interface AcademicClass {
  id: string;
  name: string;
  department_id?: string;
  department_name: string;
  academic_year: string;
  semester: number | string;
  advisor_id?: string;
  advisor_name?: string;
  capacity?: number;
  description?: string;
  created_at?: string;
  student_count?: number;
  courses_count?: number;
}

export type DiscussionCategory =
  | 'Materi Perkuliahan'
  | 'Tanya Dosen'
  | 'Tugas & Praktikum'
  | 'Diskusi Bebas'
  | 'Pengumuman';

export interface DiscussionComment {
  id: string;
  thread_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  avatar?: string;
  content: string;
  created_at: string;
  likes: number;
  liked_by: string[];
  is_endorsed?: boolean;
}

export interface DiscussionThread {
  id: string;
  course_id: string;
  course_name?: string;
  meeting_number?: number;
  title: string;
  content: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  avatar?: string;
  category: DiscussionCategory;
  created_at: string;
  is_pinned?: boolean;
  comments_count: number;
  likes: number;
  liked_by: string[];
  tags?: string[];
  comments?: DiscussionComment[];
}

export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa';

export interface AttendanceRecord {
  id: string;
  meeting_number: number;
  meeting_topic: string;
  date: string;
  user_id: string;
  student_name?: string;
  student_id?: string;
  class_name?: string;
  status: AttendanceStatus;
  notes?: string;
  updated_at: string;
}

export interface AttendanceSummary {
  user_id: string;
  student_name: string;
  student_id: string;
  class_name: string;
  total_meetings: number;
  hadir_count: number;
  izin_count: number;
  sakit_count: number;
  alpa_count: number;
  attendance_percent: number;
}

export interface Assignment {
  id: string;
  course_id?: string;
  meeting_number: number;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  submissions_count?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  student_name?: string;
  student_id?: string;
  class_name?: string;
  content: string;
  score?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
}

export type GradeComponentSource =
  | 'attendance'
  | 'participation'
  | 'assignment'
  | 'quiz'
  | 'uts'
  | 'uas'
  | 'manual';

export interface GradeComponentConfig {
  id: string;
  name: string;
  weight: number;
  source_type: GradeComponentSource;
  description?: string;
  is_default?: boolean;
}

export interface StudentGradeComponentDetail {
  id: string;
  name: string;
  weight: number;
  source_type: GradeComponentSource;
  raw_score: number;
  weighted_score: number;
  description?: string;
}

export interface StudentAcademicGrade {
  user_id: string;
  student_name: string;
  student_id: string;
  class_name: string;
  attendance_score: number;
  participation_score: number;
  assignment_score: number;
  uts_score: number;
  uas_score: number;
  weighted_attendance: number;
  weighted_participation: number;
  weighted_assignment: number;
  weighted_uts: number;
  weighted_uas: number;
  final_score: number;
  grade_letter: string;
  grade_point: number;
  status: 'LULUS' | 'TIDAK LULUS';
  components_detail?: StudentGradeComponentDetail[];
  custom_scores?: Record<string, number>;
}

export interface DatabaseStats {
  size_bytes: number;
  size_formatted: string;
  last_modified: string;
  total_users: number;
  users_by_role: {
    admin: number;
    dosen: number;
    mahasiswa: number;
  };
  total_courses: number;
  total_materials: number;
  total_quizzes: number;
  total_questions: number;
  total_attendances: number;
  total_assignments: number;
  total_submissions: number;
  total_discussions: number;
  total_comments: number;
  total_grades: number;
  total_classes?: number;
  total_departments?: number;
}

export interface DatabaseSnapshot {
  id: string;
  filename: string;
  label?: string;
  created_at: string;
  created_by?: string;
  size_formatted: string;
  size_bytes: number;
  total_users: number;
  total_courses: number;
  total_materials: number;
  is_safety_backup?: boolean;
}

export interface CloudDatabaseStatus {
  provider: string;
  is_connected: boolean;
  project_id: string;
  database_id: string;
  last_synced: string | null;
  last_error: string | null;
}
