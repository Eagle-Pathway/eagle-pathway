// ─── USER ────────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'parent' | 'tutor' | 'admin';

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  // Canonical single role — one identity per account (Student | Tutor | Parent | Admin).
  role: UserRole;
  /** @deprecated Legacy multi-persona fields. Read role via getUserRole(); dropped in phase 2. */
  roles?: UserRole[];
  /** @deprecated Use `role`. */
  active_role?: UserRole;
  avatar_url?: string;
  grade_level?: string;
  city?: string;
  created_at: string;
  academic_summary?: string;
  career_goals?: string;
  interested_subjects?: string[];
  gpa?: number;
  gpa_max?: number;
  target_countries?: string[];
  has_ielts?: boolean;
  is_english_medium?: boolean;
  target_degree_level?: string;
  has_extracurriculars?: boolean;
  target_departments?: string[];
  referral_code?: string;
  signup_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  first_landing_url?: string;

  // Tutor-specific profile fields (stored on users table)
  living_address?: string;
  university_name?: string;
  telegram_username?: string;
  cgpa?: string;
  teaching_experience?: string;

  // Parent-specific profile fields (stored on users table)
  children_count?: number;
  children_grades?: string[];
  preferred_tutor_gender?: string;
  preferred_session_format?: string;
}

// ─── TUTOR ───────────────────────────────────────────────────────────────────
export interface Tutor {
  id: string;
  user_id: string;
  bio: string;
  subjects: string[];
  grade_levels: string[];
  hourly_rate: number;
  rating: number;
  total_reviews: number;
  total_sessions: number;
  response_rate: number;
  is_online: boolean;
  is_in_person: boolean;
  location?: string;
  education: string;
  availability: Record<string, string[]>;
  is_verified: boolean;
  user?: User;
}

export interface TutorReview {
  id: string;
  tutor_id: string;
  student_id: string;
  rating: number;
  comment: string;
  created_at: string;
  student?: User;
}

// ─── BOOKING ─────────────────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type SessionType = 'online' | 'in_person';

export interface Booking {
  id: string;
  student_id: string;
  tutor_id: string;
  subject: string;
  session_date: string;
  session_time: string;
  duration_hours: number;
  session_type: SessionType;
  status: BookingStatus;
  notes?: string;
  total_amount: number;
  platform_fee: number;
  zoom_link?: string;
  location?: string;
  created_at: string;
  tutor?: Tutor;
  student?: User;
}

export interface TutorAgreement {
  id: string;
  booking_id?: string;
  tutor_id: string;
  student_id: string;
  responsibilities: string;
  tutor_signed: boolean;
  tutor_signed_at?: string;
  parent_signed: boolean;
  parent_signed_at?: string;
  status: 'pending' | 'active' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface TutorSessionLog {
  id: string;
  booking_id?: string;
  tutor_id: string;
  student_id: string;
  start_time: string;
  end_time?: string;
  tutor_start_confirmed: boolean;
  student_start_confirmed: boolean;
  student_start_confirmed_at?: string;
  tutor_end_confirmed: boolean;
  tutor_end_confirmed_at?: string;
  student_end_confirmed: boolean;
  student_end_confirmed_at?: string;
  duration_minutes: number;
  hourly_rate: number;
  total_calculated_amount: number;
  status: 'active' | 'completed' | 'disputed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── SCHOLARSHIP ─────────────────────────────────────────────────────────────
export type DegreeLevel = 'undergraduate' | 'masters' | 'phd' | 'all';
export type FundingType = 'fully_funded' | 'partial' | 'stipend_only';

export interface Scholarship {
  id: string;
  name: string;
  organization: string;
  country: string;
  country_flag: string;
  degree_levels: DegreeLevel[];
  funding_type: FundingType;
  funding_details: string;
  description: string;
  requirements: string[];
  benefits: Record<string, string>;
  deadline: string;
  fields_of_study?: string[];
  min_gpa?: number;
  min_gpa_max?: number;
  eagle_success_rate?: number;
  website_url?: string;
  image_url?: string;
  is_active: boolean;
  source_url?: string;
  source_status?: 'verified' | 'unverified' | 'stale' | 'broken';
  verified_at?: string;
  verified_by?: string;
  stale_reason?: string;
  created_at: string;
  
  // Complexity fields
  requires_ielts?: boolean;
  accepts_english_medium?: boolean;
  target_departments?: string[]; // ["Computer Science", "Engineering", "Business", "Any"]
  recommendation_letters_count?: number;
}

// ─── APPLICATION ─────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'draft'
  | 'personal_info'
  | 'documents'
  | 'sop'
  | 'submitted'
  | 'interview'
  | 'accepted'
  | 'rejected';

export type PackageTier = 'basic' | 'standard' | 'premium';

export interface Application {
  id: string;
  student_id: string;
  scholarship_id: string;
  consultant_id?: string;
  package_tier: PackageTier;
  status: ApplicationStatus;
  sop_content?: string;
  sop_draft_number: number;
  ai_feedback?: {
    score: number;
    feedback: string;
    suggestions: string[];
    last_reviewed_at: string;
  };
  consultant_feedback?: string;
  notes?: string;
  submitted_at?: string;
  result_at?: string;
  created_at: string;
  updated_at: string;
  scholarship?: Scholarship;
  consultant?: User;
  documents?: Document[];
}

// ─── DOCUMENT ────────────────────────────────────────────────────────────────
export type DocumentType =
  | 'degree_certificate'
  | 'transcript'
  | 'passport'
  | 'cv'
  | 'ielts_certificate'
  | 'reference_letter'
  | 'sop'
  | 'other';

export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface Document {
  id: string;
  user_id: string;
  application_id?: string;
  document_type: DocumentType;
  file_name: string;
  file_path?: string;
  file_url: string;
  file_size: number;
  status: DocumentStatus;
  reviewer_notes?: string;
  uploaded_at: string;
}

// ─── NOTIFICATION ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'session_reminder'
  | 'booking_confirmed'
  | 'scholarship_alert'
  | 'document_approved'
  | 'document_rejected'
  | 'sop_reviewed'
  | 'application_update'
  | 'offer_received'
  | 'tutor_job_alert'
  | 'tutor_application_update'
  | 'booking_request'
  | 'booking_update';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ─── TASK ────────────────────────────────────────────────────────────────────
export type TaskStatus = 'pending' | 'completed' | 'overdue';
export type TaskType = 'document' | 'sop' | 'payment' | 'session' | 'other';

export interface StudentTask {
  id: string;
  student_id: string;
  application_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: TaskStatus;
  type: TaskType;
  created_at: string;
}

// ─── FINANCE ─────────────────────────────────────────────────────────────────
export interface PayoutRequest {
  id: string;
  tutor_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
}

// ─── NAVIGATION TYPES ─────────────────────────────────────────────────────────
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
};

// ─── TUTOR JOB POST ──────────────────────────────────────────────────────────
export type TutorJobStatus = 'open' | 'closed';
export type GenderPreference = 'male' | 'female' | 'both';

export interface TutorJobPost {
  id: string;
  created_at: string;
  updated_at: string;
  posted_by: string;
  place: string;
  grade: string;
  subjects: string[];
  session_hours: number;
  days_per_week: number;
  start_time: string;
  hourly_rate: number;
  gender_preference: GenderPreference;
  status: TutorJobStatus;
  notification_sent?: boolean;
  posted_by_user?: User;
}

// ─── TUTOR JOB APPLICATION ───────────────────────────────────────────────────
export type TutorJobApplicationStatus = 'pending' | 'contacted' | 'hired' | 'rejected';

export interface TutorJobApplication {
  id: string;
  created_at: string;
  updated_at: string;
  job_post_id: string;
  applicant_id: string;
  status: TutorJobApplicationStatus;
  education_status?: string;
  living_address?: string;
  university_name?: string;
  phone_number?: string;
  telegram_username?: string;
  cgpa?: string;
  grade10_result_url?: string;
  grade12_result_url?: string;
  transcript_url?: string;
  policy_agreed?: boolean;
  policy_agreed_at?: string;
  job_post?: TutorJobPost;
  applicant?: User;
}

// ─── TUTOR APPLICATION (Profile Verification) ────────────────────────────────
export type TutorApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface TutorApplication {
  id: string;
  created_at: string;
  updated_at: string;
  tutor_id: string;
  status: TutorApplicationStatus;
  rejection_reason?: string;
  rejection_reason_category?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  grade10_result_url?: string;
  grade12_result_url?: string;
  transcript_url?: string;
  education_status?: string;
  university_name?: string;
  living_address?: string;
  phone_number?: string;
  telegram_username?: string;
  cgpa?: string;
  tutor?: User;
}

export type AuthStackParamList = {
  splash: undefined;
  signup: undefined;
  otp: { phone: string };
};

export type TabParamList = {
  home: undefined;
  tutors: undefined;
  scholarships: undefined;
  bookings: undefined;
  profile: undefined;
};

export type TutorStackParamList = {
  tutors: undefined;
  'tutor-profile': { tutorId: string };
  booking: { tutorId: string };
};

export type ScholarshipStackParamList = {
  scholarships: undefined;
  'scholarship-detail': { scholarshipId: string };
  packages: { scholarshipId: string };
  apply: { scholarshipId: string; packageTier: PackageTier };
};

export type ProfileStackParamList = {
  profile: undefined;
  progress: undefined;
  documents: undefined;
  tracker: undefined;
  notifications: undefined;
  settings: undefined;
  'tutor-jobs': undefined;
  'tutor-job-detail': { jobId: string };
  'apply-job': { jobId: string };
  'my-applications': undefined;
  'application-detail': { applicationId: string };
};
