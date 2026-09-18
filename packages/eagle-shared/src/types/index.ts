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
  country: string; // Study Destination Country
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
  
  // 1. Nationalities & Geographic Eligibility
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

// ─── MATCH REPORT ────────────────────────────────────────────────────────────
export interface MatchCriterionResult {
  criterion: 'nationality' | 'degree_level' | 'previous_degree' | 'gpa' | 'work_experience' | 'age' | 'language';
  label: string;
  status: 'met' | 'unmet' | 'unknown';
  detail: string;
  isBlocker: boolean;
  actionRoute?: string;
}

export interface SoftMatchFactor {
  factor: 'field_alignment' | 'destination' | 'funding_fit' | 'semantic_interests' | 'document_readiness';
  name: string;
  score: number; // 0 - 100
  weight: number; // percentage
  note: string;
}

export interface ScholarshipMatchReport {
  scholarshipId: string;
  eligibilityStatus: 'eligible' | 'potentially_eligible' | 'not_eligible';
  overallScore: number; // 0 - 100
  hardCriteria: MatchCriterionResult[];
  softFactors: SoftMatchFactor[];
  summaryBadges: { text: string; type: 'success' | 'warning' | 'error' | 'info' }[];
  blockerCount: number;
  gapCount: number;
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

// ─── SUCCESS STORY ──────────────────────────────────────────────────────────
export interface SuccessStory {
  id: string;
  student_name: string;
  scholarship_name: string;
  scholarship_id?: string | null;
  country?: string | null;
  country_flag?: string | null;
  year?: number | null;
  quote: string;
  story?: string | null;
  avatar_url?: string | null;
  screenshot_url?: string | null;
  video_url?: string | null;
  telegram_voice_url?: string | null;
  is_published?: boolean;
  created_at: string;
}

