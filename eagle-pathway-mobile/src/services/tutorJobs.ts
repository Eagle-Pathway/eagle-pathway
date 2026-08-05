import { supabase } from './supabase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import type { TutorJobPost, TutorJobApplication, TutorApplication } from '../types';

const SIGNED_URL_TTL = 60 * 60;
const STORAGE_BUCKET = 'tutor-documents';

async function uploadToTutorBucket(
  userId: string,
  fileUri: string,
  fileName: string,
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
  const fileExt = fileName.split('.').pop() || 'jpg';
  const filePath = `${userId}/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, decode(base64), {
      contentType: fileExt === 'pdf' ? 'application/pdf' : 'image/jpeg',
      upsert: true,
    });
  if (uploadError) throw new Error('Upload failed: ' + uploadError.message);

  return filePath;
}

async function createSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) throw new Error('Failed to generate document URL');
  return data.signedUrl;
}

export const tutorJobsService = {
  async pickDocument(): Promise<DocumentPicker.DocumentPickerResult> {
    return await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
  },

  // ── Tutor Applications (Profile Verification) ──

  async getTutorApplication(tutorId: string): Promise<TutorApplication | null> {
    const { data, error } = await supabase
      .from('tutor_applications')
      .select('*')
      .eq('tutor_id', tutorId)
      .maybeSingle();
    if (error) throw error;
    return data as TutorApplication | null;
  },

  async createTutorApplication(params: {
    tutorId: string;
    educationStatus: string;
    livingAddress: string;
    universityName: string;
    phoneNumber: string;
    telegramUsername: string;
    cgpa: string;
    grade10Uri?: string;
    grade10Name?: string;
    grade12Uri?: string;
    grade12Name?: string;
    transcriptUri?: string;
    transcriptName?: string;
  }): Promise<TutorApplication> {
    const uploadIfNeeded = async (uri?: string, name?: string) => {
      if (!uri || !name) return null;
      return uploadToTutorBucket(params.tutorId, uri, name);
    };
    const [grade10Path, grade12Path, transcriptPath] = await Promise.all([
      uploadIfNeeded(params.grade10Uri, params.grade10Name),
      uploadIfNeeded(params.grade12Uri, params.grade12Name),
      uploadIfNeeded(params.transcriptUri, params.transcriptName),
    ]);

    const { data, error } = await supabase
      .from('tutor_applications')
      .insert({
        tutor_id: params.tutorId,
        status: 'pending',
        grade10_result_url: grade10Path,
        grade12_result_url: grade12Path,
        transcript_url: transcriptPath,
        university_name: params.universityName,
        living_address: params.livingAddress,
        phone_number: params.phoneNumber,
        telegram_username: params.telegramUsername.replace('@', ''),
        cgpa: params.cgpa,
      })
      .select()
      .single();
    if (error) throw error;
    return data as TutorApplication;
  },

  async getDocumentSignedUrl(path: string): Promise<string> {
    return createSignedUrl(path);
  },

  // ── Tutor Job Posts ──

  async getOpenJobs(): Promise<TutorJobPost[]> {
    const { data, error } = await supabase
      .from('tutor_job_posts')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as TutorJobPost[];
  },

  async getJobById(jobId: string): Promise<TutorJobPost> {
    const { data, error } = await supabase
      .from('tutor_job_posts')
      .select('*')
      .eq('id', jobId)
      .single();
    if (error) throw error;
    return data as TutorJobPost;
  },

  // ── Tutor Job Applications ──

  async hasApplied(jobPostId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tutor_job_applications')
      .select('id')
      .eq('job_post_id', jobPostId)
      .eq('applicant_id', userId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async getUserApplications(userId: string): Promise<TutorJobApplication[]> {
    const { data, error } = await supabase
      .from('tutor_job_applications')
      .select('*, job_post:tutor_job_posts(*)')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as TutorJobApplication[];
  },

  async getApplicationById(appId: string): Promise<TutorJobApplication> {
    const { data, error } = await supabase
      .from('tutor_job_applications')
      .select('*, job_post:tutor_job_posts(*)')
      .eq('id', appId)
      .single();
    if (error) throw error;
    return data as TutorJobApplication;
  },

  async applyForJob(params: {
    jobPostId: string;
    applicantId: string;
    educationStatus: string;
    livingAddress: string;
    universityName: string;
    phoneNumber: string;
    telegramUsername: string;
    cgpa: string;
    grade10Uri?: string;
    grade10Name?: string;
    grade12Uri?: string;
    grade12Name?: string;
    transcriptUri?: string;
    transcriptName?: string;
    existingGrade10Url?: string;
    existingGrade12Url?: string;
    existingTranscriptUrl?: string;
  }): Promise<TutorJobApplication> {
    let grade10Url = params.existingGrade10Url;
    let grade12Url = params.existingGrade12Url;
    let transcriptUrl = params.existingTranscriptUrl;

    const uploads: Promise<string | undefined>[] = [];
    if (params.grade10Uri && params.grade10Name) {
      uploads.push(uploadToTutorBucket(params.applicantId, params.grade10Uri, params.grade10Name).then(p => { grade10Url = p; return p; }));
    }
    if (params.grade12Uri && params.grade12Name) {
      uploads.push(uploadToTutorBucket(params.applicantId, params.grade12Uri, params.grade12Name).then(p => { grade12Url = p; return p; }));
    }
    if (params.transcriptUri && params.transcriptName) {
      uploads.push(uploadToTutorBucket(params.applicantId, params.transcriptUri, params.transcriptName).then(p => { transcriptUrl = p; return p; }));
    }
    await Promise.all(uploads);

    const { data, error } = await supabase
      .from('tutor_job_applications')
      .insert({
        job_post_id: params.jobPostId,
        applicant_id: params.applicantId,
        status: 'pending',
        education_status: params.educationStatus,
        living_address: params.livingAddress,
        university_name: params.universityName,
        phone_number: params.phoneNumber,
        telegram_username: params.telegramUsername.replace('@', ''),
        cgpa: params.cgpa,
        grade10_result_url: grade10Url || null,
        grade12_result_url: grade12Url || null,
        transcript_url: transcriptUrl || null,
        policy_agreed: true,
        policy_agreed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as TutorJobApplication;
  },

  // ── Profile Completion & Approval Check ──

  getTutorProfileMissingFields(
    user?: any | null,
    tutorApp?: TutorApplication | null
  ): string[] {
    const missing: string[] = [];
    const name = user?.full_name;
    const phone = user?.phone_number || user?.phone || tutorApp?.phone_number;
    const address = user?.living_address || user?.sub_city || tutorApp?.living_address;
    const uni = user?.university_name || tutorApp?.university_name;
    const cgpa = user?.cgpa || tutorApp?.cgpa;
    const tg = user?.telegram_username || user?.telegram_handle || tutorApp?.telegram_username;

    if (!name) missing.push('Full Name');
    if (!phone) missing.push('Phone Number');
    if (!address) missing.push('Residence Address');
    if (!uni) missing.push('University Name');
    if (!cgpa) missing.push('CGPA');
    if (!tg) missing.push('Telegram Username');

    return missing;
  },

  getTutorApprovalStatus(
    user?: any | null,
    tutorApp?: TutorApplication | null
  ): { 
    canApply: boolean; 
    missingFields: string[]; 
    status: 'can_apply' | 'missing_fields' | 'pending_approval' | 'rejected'; 
    reason: string 
  } {
    const missing = this.getTutorProfileMissingFields(user, tutorApp);

    if (missing.length > 0) {
      return {
        canApply: false,
        missingFields: missing,
        status: 'missing_fields',
        reason: `Please fill in your missing profile info: ${missing.join(', ')}`,
      };
    }

    if (tutorApp?.status === 'rejected') {
      return {
        canApply: false,
        missingFields: [],
        status: 'rejected',
        reason: 'Your tutor application was rejected by admin. Please contact support.',
      };
    }

    if (tutorApp?.status === 'pending') {
      return {
        canApply: false,
        missingFields: [],
        status: 'pending_approval',
        reason: 'Your profile is complete, but your tutor account is currently pending admin review. You will be notified once approved.',
      };
    }

    const role = (user?.role || user?.user_metadata?.role || '').toLowerCase();
    const isApproved = tutorApp?.status === 'approved' || user?.is_verified === true || role === 'tutor';

    if (isApproved) {
      return {
        canApply: true,
        missingFields: [],
        status: 'can_apply',
        reason: 'Your account is approved! You can apply for jobs immediately.',
      };
    }

    return {
      canApply: false,
      missingFields: [],
      status: 'pending_approval',
      reason: 'Your tutor profile application is under review by admin.',
    };
  },

  isJobProfileComplete(
    user?: any | null,
    tutorApp?: TutorApplication | null
  ): boolean {
    const status = this.getTutorApprovalStatus(user, tutorApp);
    return status.canApply;
  },
};
