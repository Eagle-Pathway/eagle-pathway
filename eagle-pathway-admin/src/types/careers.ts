export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
export type ExperienceLevel = 'Entry Level' | 'Mid-Level' | 'Senior' | 'Lead';
export type ApplicationStatus = 'pending' | 'reviewing' | 'interviewed' | 'offered' | 'rejected';

export interface Career {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  salary_range?: string | null;
  deadline?: string | null;
  summary: string;
  description?: string | null;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  is_active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  applications_count?: number;
}

export interface CareerFormData {
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  salary_range?: string;
  deadline?: string;
  summary: string;
  description?: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  is_active: boolean;
  featured: boolean;
}

export interface JobApplication {
  id: string;
  career_id?: string | null;
  job_title: string;
  full_name: string;
  email: string;
  phone: string;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  resume_url?: string | null;
  cover_letter?: string | null;
  status: ApplicationStatus;
  notes?: string | null;
  created_at: string;
  career?: {
    id: string;
    title: string;
    department: string;
  } | null;
}

