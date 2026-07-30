// ─── USER ────────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'parent' | 'tutor' | 'admin';

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  // Canonical single role — one identity per account (Student | Tutor | Parent | Admin).
  role: UserRole;
  /** @deprecated Legacy multi-persona fields, retained until dropped in phase 2. */
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
}

// ─── TUTOR ─────────────────────────────────────────────────────────────────
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
  target_departments?: string[];
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
  | 'offer_received';

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
