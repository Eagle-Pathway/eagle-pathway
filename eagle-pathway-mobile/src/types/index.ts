// ─── USER & DOMAIN TYPES ──────────────────────────────────────────────────
export type UserRole = 'student' | 'parent' | 'tutor' | 'admin' | 'archived';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type VerificationStatus = 'pending_verification' | 'verified' | 'manual_review' | 'rejected';

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
export type EligibleNationalitiesMode = 'all' | 'specific_countries' | 'regions' | 'developing_countries' | 'other';
export type RequiredPreviousDegree = 'high_school' | 'bachelors' | 'masters' | 'phd' | 'other' | 'any';
export type CurrentStudentStatus = 'graduated' | 'final_year' | 'enrolled' | 'any';
export type GpaRequirementType = 'min_gpa' | 'min_percentage' | 'min_class' | 'none' | 'other';
export type WorkExpRequiredType = 'yes' | 'no' | 'preferred';
export type WorkExpAfterDegreeType = 'bachelors' | 'masters' | 'any';
export type AgeRequirementType = 'none' | 'min_age' | 'max_age' | 'range';
export type AgeReferencePoint = 'deadline' | 'programme_start' | 'other';
export type EnglishMediumAcceptedPolicy = 'yes' | 'no' | 'conditional';
export type CoverageType = 'full' | 'partial' | 'none';
export type ApplicationOpenStatus = 'open' | 'upcoming' | 'closed' | 'expected';
export type ApplicationMethodType = 'university_portal' | 'scholarship_portal' | 'email' | 'other';
export type VerificationStatusType = 'draft' | 'submitted' | 'under_review' | 'needs_info' | 'verified' | 'published' | 'rejected' | 'expired';

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
  
  // 1. Nationalities & Geography
  eligible_nationalities_mode?: EligibleNationalitiesMode;
  eligible_countries?: string[];
  eligible_regions?: string[];

  // 2. Degree Requirements & Status
  required_previous_degree?: RequiredPreviousDegree;
  current_student_status?: CurrentStudentStatus;

  // 3. Granular Field Taxonomy
  broad_field?: string;
  specific_field?: string;
  related_fields?: string[];

  // 4. GPA Requirements
  gpa_requirement_type?: GpaRequirementType;
  min_percentage?: number;
  min_class_honors?: string;

  // 5. Work Experience Rules
  work_exp_required?: WorkExpRequiredType;
  work_exp_min_years?: number;
  work_exp_after_degree?: WorkExpAfterDegreeType;
  work_exp_sectors?: string[];

  // 6. Age Rules
  age_requirement_type?: AgeRequirementType;
  min_age?: number;
  max_age?: number;
  age_reference_point?: AgeReferencePoint;

  // 7. Language Requirements
  english_test_required?: boolean;
  requires_ielts?: boolean;
  ielts_min?: number;
  toefl_ibt_min?: number;
  pte_min?: number;
  duolingo_min?: number;
  cambridge_min?: string;
  other_language_req?: string;
  accepts_english_medium?: boolean;
  english_medium_accepted?: EnglishMediumAcceptedPolicy;

  // 8. Granular Funding & Benefits
  tuition_coverage?: CoverageType;
  stipend_provided?: boolean;
  stipend_monthly_amount?: number;
  stipend_currency?: string;
  accommodation_coverage?: CoverageType;
  meals_coverage?: CoverageType;
  travel_allowance?: boolean;
  travel_allowance_amount?: number;
  health_insurance_covered?: boolean;
  application_fee_covered?: boolean;

  // 9. Application Information
  application_status?: ApplicationOpenStatus;
  intake_period?: string;
  program_duration?: string;
  application_method?: ApplicationMethodType;
  application_url?: string;

  // 10. Structured Document Checklist
  requires_cv?: boolean;
  requires_motivation_letter?: boolean;
  requires_recommendation_letter?: boolean;
  recommendation_letters_count?: number;
  requires_transcript?: boolean;
  requires_degree_certificate?: boolean;
  requires_passport?: boolean;
  requires_writing_sample?: boolean;
  requires_portfolio?: boolean;
  requires_research_proposal?: boolean;
  requires_work_certificate?: boolean;
  other_required_docs?: string[];
  target_departments?: string[];

  // 11. Verification Lifecycle & Provenance
  verification_status?: VerificationStatusType;
  submitted_by_user_id?: string;
  submitted_by_email?: string;
  submission_notes?: string;
  is_community_submission?: boolean;
  last_verified_at?: string;
  verified_by_user_id?: string;
  deadline_verified?: boolean;
  eligibility_verified?: boolean;
  application_link_verified?: boolean;
  confidence_score?: number;
  admin_internal_notes?: string;
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
  file_name?: string;
  file_path?: string;
  file_url: string;
  cloud_url?: string;
  text_content?: string;
  file_size?: number;
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
  mode?: string;
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
