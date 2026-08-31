import { supabase } from './supabase';
import { Scholarship, Application, PackageTier, Document, DocumentType, User } from '../types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCHOLARSHIPS_CACHE_KEY = 'eagle_scholarships_offline_cache_v1';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
const SOP_AI_API_URL = process.env.EXPO_PUBLIC_EAGLE_AI_API_URL;

interface SOPFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
  inline_comments?: SOPInlineComment[];
}

interface SOPInlineComment {
  paragraph_index: number;
  quote: string;
  severity: 'strength' | 'suggestion' | 'critical';
  comment: string;
  suggested_revision?: string;
}

async function withSignedDocumentUrl(document: Document): Promise<Document> {
  const path = document.file_path || (!document.file_url?.startsWith('http') ? document.file_url : undefined);
  if (!path) return document;

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return document;
  return { ...document, file_path: path, file_url: data.signedUrl };
}

async function withSignedApplicationDocuments(application: Application): Promise<Application> {
  if (!application.documents?.length) return application;
  const documents = await Promise.all(application.documents.map(withSignedDocumentUrl));
  return { ...application, documents };
}

async function requestSOPAI<T>(body: Record<string, unknown>): Promise<T | null> {
  if (!SOP_AI_API_URL) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const response = await fetch(SOP_AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `SOP AI request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const scholarshipsService = {
  async getScholarships(filters?: {
    degreeLevel?: string;
    fundingType?: string;
    search?: string;
  }): Promise<Scholarship[]> {
    const searchTerm = filters?.search?.trim();

    try {
      if (searchTerm && typeof supabase.rpc === 'function') {
        const { data, error } = await supabase.rpc('search_scholarships', {
          p_query: searchTerm,
          p_limit: 50,
        });

        if (!error && data) return data as Scholarship[];
        console.warn('Scholarship search RPC unavailable, falling back to basic search:', error?.message);
      }

      let query = supabase
        .from('scholarships')
        .select('*')
        .eq('is_active', true);

      if (searchTerm) {
        const search = `%${searchTerm}%`;
        if (typeof query.or === 'function') {
          query = query.or(
            [
              `name.ilike.${search}`,
              `organization.ilike.${search}`,
              `country.ilike.${search}`,
              `description.ilike.${search}`,
            ].join(','),
          );
        } else {
          query = query.ilike('name', search);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Save to local offline cache if this was a general list fetch (no search filter)
      if (!searchTerm && data && Array.isArray(data)) {
        AsyncStorage.setItem(SCHOLARSHIPS_CACHE_KEY, JSON.stringify(data)).catch(() => {});
      }

      return data as Scholarship[];
    } catch (networkError: any) {
      // Offline fallback: Attempt to serve from local AsyncStorage cache
      try {
        const cachedRaw = await AsyncStorage.getItem(SCHOLARSHIPS_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as Scholarship[];
          if (Array.isArray(cached) && cached.length > 0) {
            if (searchTerm) {
              const lower = searchTerm.toLowerCase();
              return cached.filter(
                (s) =>
                  s.name?.toLowerCase().includes(lower) ||
                  s.organization?.toLowerCase().includes(lower) ||
                  s.country?.toLowerCase().includes(lower)
              );
            }
            return cached;
          }
        }
      } catch (cacheErr) {
        console.warn('[ScholarshipsService] Cache fallback error:', cacheErr);
      }
      throw networkError;
    }
  },

  async getOpenScholarshipsCount(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const { count, error } = await supabase
      .from('scholarships')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('deadline', today);
    if (error) throw error;
    return count ?? 0;
  },

  async getScholarshipById(id: string): Promise<Scholarship> {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Scholarship;
  },

  async createApplication(params: {
    studentId: string;
    scholarshipId: string;
    packageTier: PackageTier;
    sopContent?: string;
  }): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        student_id: params.studentId,
        scholarship_id: params.scholarshipId,
        package_tier: params.packageTier,
        status: 'submitted',
        sop_content: params.sopContent || null,
        sop_draft_number: 0,
      })
      .select('*, scholarship:scholarships(*)')
      .single();
    if (error) throw error;

    await supabase
      .from('documents')
      .update({ application_id: data.id })
      .eq('user_id', params.studentId)
      .is('application_id', null);

    return data as Application;
  },

  async getStudentApplications(studentId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*, scholarship:scholarships(*), consultant:users!applications_consultant_id_fkey(*), documents(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all((data as Application[]).map(withSignedApplicationDocuments));
  },

  async getApplicationById(id: string): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .select('*, scholarship:scholarships(*), consultant:users!applications_consultant_id_fkey(*), documents(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return withSignedApplicationDocuments(data as Application);
  },

  async updateApplicationStatus(id: string, status: Application['status']): Promise<void> {
    const { error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async uploadDocument(params: {
    userId: string;
    applicationId?: string;
    documentType: DocumentType;
    fileUri: string;
    fileName: string;
  }): Promise<Document> {
    const filePath = `${params.userId}/${params.documentType}/${Date.now()}_${params.fileName}`;
    const contentType = params.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

    // Read file as base64 (works with content:// URIs, unlike fetch + blob)
    const base64 = await FileSystem.readAsStringAsync(params.fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const fileBytes = decode(base64);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBytes, {
        contentType,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
    if (signedError) throw signedError;

    // Save document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: params.userId,
        application_id: params.applicationId || null,
        document_type: params.documentType,
        file_name: params.fileName,
        file_path: filePath,
        file_url: signedData.signedUrl,
        file_size: Math.round(base64.length * 0.75),
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data as Document;
  },

  async deleteDocument(doc: { id: string; file_path?: string | null }): Promise<void> {
    // Best-effort storage cleanup; the row deletion is what matters for the vault.
    if (doc.file_path) {
      await supabase.storage.from('documents').remove([doc.file_path]).catch(() => {});
    }
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) throw error;
  },

  async getUserDocuments(userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return Promise.all((data as Document[]).map(withSignedDocumentUrl));
  },

  async pickDocument(): Promise<DocumentPicker.DocumentPickerResult> {
    return await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
  },
  async updateSOPContent(applicationId: string, content: string): Promise<void> {
    const { error } = await supabase.rpc('increment_sop_draft', { 
      application_id: applicationId, 
      new_content: content 
    });
    if (error) throw error;
  },

  async getSOPFeedback(content: string, scholarshipId?: string, studentId?: string): Promise<SOPFeedback> {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    
    let scholarship: Scholarship | null = null;
    let student: User | null = null;
    
    if (scholarshipId) {
       const { data } = await supabase.from('scholarships').select('*').eq('id', scholarshipId).single();
       scholarship = data;
    }
    if (studentId) {
       const { data } = await supabase.from('users').select('*').eq('id', studentId).single();
       student = data;
    }

    try {
      const remoteReview = await requestSOPAI<SOPFeedback>({
        action: 'review',
        content,
        scholarship,
        student,
      });

      if (remoteReview) {
        if (scholarshipId && studentId) {
          await supabase
            .from('applications')
            .update({
              ai_feedback: {
                ...remoteReview,
                last_reviewed_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq('student_id', studentId)
            .eq('scholarship_id', scholarshipId);
        }

        return remoteReview;
      }
    } catch (error) {
      console.warn('Remote SOP AI unavailable, using local fallback:', error);
    }

    await new Promise(r => setTimeout(r, 600));

    if (wordCount < 150) {
      return {
        score: 35,
        feedback: "Your essay is critically short. Top-tier scholarships look for depth and personal narrative that 150 words cannot capture.",
        suggestions: [
          "Expand on your community involvement 🌍",
          "Clearly link your past academic achievements to the scholarship's mission",
          "Aim for at least 500 words to show serious commitment"
        ]
      };
    }

    const hasSpecificMatch = scholarship && scholarship.fields_of_study?.some(f => 
      content.toLowerCase().includes(f.toLowerCase()) || 
      (student?.academic_summary?.toLowerCase().includes(f.toLowerCase()))
    );

    if (!hasSpecificMatch && scholarship) {
      return {
        score: 65,
        feedback: "Your writing is good, but it lacks specific alignment with the scholarship's focus areas.",
        suggestions: [
          `Explicitly mention how your goals align with ${scholarship.organization}'s vision`,
          "Use keywords related to your field of study more proactively",
          "Ensure your academic summary reflects the requirements mentioned in the scholarship description"
        ]
      };
    }

    return {
      score: 88,
      feedback: "Highly Competitive! You've successfully integrated your personal goals with the scholarship's requirements. The narrative is compelling and professional.",
      suggestions: [
        "Include a more specific example of a leadership challenge you've overcome",
        "Refine the transition between your academic history and future career goals",
        "Excellent match—proceed to final proofreading"
      ]
    };
  },

  async getRecommendedScholarships(userId: string): Promise<(Scholarship & { matchScore?: number; matchReason?: string })[]> {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return [];

    const { data: scholarships, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const scored = (scholarships as Scholarship[]).map(sch => {
      let score = 30; // Base score
      const reasons: string[] = [];

      // 1. Degree Level Match (Weight: 35)
      const userLevel = (user.grade_level || '').toLowerCase();
      const schLevels = (sch.degree_levels || []).map(l => l.toLowerCase());
      if (schLevels.includes(userLevel) || schLevels.includes('all')) {
        score += 35;
      } else {
        score -= 25; // Penalty for wrong level
      }

      // 2. Target Degree Level Match (Weight: 15)
      const targetDegree = (user.target_degree_level || '').toLowerCase();
      const degreeMap: Record<string, string> = { bsc: 'undergraduate', msc: 'masters', phd: 'phd' };
      const mappedTarget = degreeMap[targetDegree] || targetDegree;
      if (schLevels.includes(mappedTarget) || schLevels.includes('all')) {
        score += 15;
        reasons.push(`Matches your target ${user.target_degree_level} degree`);
      }

      // 3. Field of Study Match (Weight: 20)
      const userInterests = [
        ...(user.interested_subjects || []),
        ...(user.academic_summary?.split(' ') || []),
        ...(user.career_goals?.split(' ') || [])
      ].map(s => s.toLowerCase());
      const schFields = (sch.fields_of_study || []).map(f => f.toLowerCase());
      const interestMatches = schFields.filter(f =>
        userInterests.some(ui => ui.includes(f) || f.includes(ui)) || f === 'any'
      );
      if (interestMatches.length > 0) {
        score += 20;
        reasons.push(`Matches your interest in ${interestMatches[0] === 'any' ? 'multiple fields' : interestMatches[0]}`);
      }

      // 4. Department Match (Weight: 15)
      if (sch.target_departments && user.target_departments) {
        const deptOverlap = sch.target_departments.filter(d =>
          d === 'Any' || user.target_departments!.includes(d)
        );
        if (deptOverlap.length > 0) {
          score += 15;
          reasons.push(`Open for ${deptOverlap[0] === 'Any' ? 'all departments' : deptOverlap[0]}`);
        }
      } else {
        score += 5; // Neutral if not specified
      }

      // 5. English Proficiency (Weight: 10)
      if (sch.requires_ielts) {
        if (user.has_ielts) {
          score += 10;
          reasons.push('You meet the IELTS requirement');
        } else if (sch.accepts_english_medium && user.is_english_medium) {
          score += 6;
          reasons.push('Your English medium background qualifies');
        } else {
          score -= 15; // Hard disqualifier
        }
      } else if (sch.accepts_english_medium && user.is_english_medium) {
        score += 5;
      }

      // 6. GPA Match (Weight: 10)
      if (sch.min_gpa) {
        if (user.gpa && user.gpa >= sch.min_gpa) {
          score += 10;
          reasons.push('You meet the GPA requirements');
        } else if (user.gpa && user.gpa < sch.min_gpa) {
          score -= 10;
        }
      } else {
        score += 5;
      }

      // 7. Extracurriculars boost (Weight: 5)
      if (user.has_extracurriculars) score += 5;

      // 8. Country Preference (Weight: 5)
      if (user.target_countries?.includes(sch.country)) {
        score += 5;
        reasons.push(`Located in ${sch.country} (your preference)`);
      }

      // 9. Deadline urgency (small awareness boost)
      const daysToDeadline = sch.deadline
        ? (new Date(sch.deadline).getTime() - Date.now()) / (1000 * 3600 * 24)
        : 100;
      if (daysToDeadline > 0 && daysToDeadline < 30) score += 5;

      return {
        ...sch,
        matchScore: Math.min(Math.max(score, 0), 99),
        matchReason: reasons[0] || `${user.grade_level || 'General'} Academic Fit`,
      };
    });

    return scored
      .filter(s => (s.matchScore || 0) > 55)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 10);
  },

  async generateMagicSOP(student: User, scholarship?: Partial<Scholarship> | null): Promise<string> {
    try {
      const remoteDraft = await requestSOPAI<{ draft: string }>({
        action: 'draft',
        student,
        scholarship: scholarship as Scholarship,
      });

      if (remoteDraft?.draft) return remoteDraft.draft;
    } catch (error) {
      console.warn('Remote SOP draft unavailable, using local fallback:', error);
    }
    
    await new Promise(r => setTimeout(r, 800));

    const name = student?.full_name || 'Applicant';
    const gradeLevel = student?.grade_level || 'Undergraduate';
    const gpaStr = student?.gpa ? `${student.gpa}${student.gpa_max ? `/${student.gpa_max}` : ''}` : '3.5';
    const subjects = (student?.interested_subjects && student.interested_subjects.length > 0)
      ? student.interested_subjects.join(', ')
      : (student?.target_departments && student.target_departments.length > 0)
      ? student.target_departments.join(', ')
      : 'Academic Excellence & Innovation';
    const targetDegree = student?.target_degree_level || 'Degree Program';
    const targetCountry = (student?.target_countries && student.target_countries.length > 0)
      ? student.target_countries.join(', ')
      : scholarship?.country || 'International Studies';

    const scholarshipTitle = scholarship?.name || 'Academic Scholarship Program';
    const orgName = scholarship?.organization || 'Scholarship Committee';
    const summary = student?.academic_summary 
      ? `My academic highlights: "${student.academic_summary}".`
      : `Throughout my academic journey, I have maintained high standards of academic rigor, curiosity, and proactive engagement.`;

    const goals = student?.career_goals
      ? `My long-term ambition is: "${student.career_goals}".`
      : `My long-term goal is to leverage my skills to create meaningful social and economic impact in my community.`;

    return `STATEMENT OF PURPOSE (INSPIRATIONAL STARTER OUTLINE)

1. INTRODUCTION & MOTIVATION
My name is ${name}. As a ${gradeLevel} student (GPA: ${gpaStr}) aspiring to pursue a ${targetDegree} in ${subjects}, I am writing to express my strong commitment to applying for the ${scholarshipTitle} with ${orgName}.

2. ACADEMIC BACKGROUND & QUALIFICATIONS
${summary} My focus on ${subjects} has provided me with a strong foundation to excel in advanced studies.

3. ALIGNMENT WITH SCHOLARSHIP VISION
${scholarship?.description ? `The core mission—${scholarship.description.slice(0, 110)}...—directly aligns with my commitment to personal and professional development.` : `This opportunity represents a major stepping stone for my academic journey.`}

4. FUTURE GOALS & COMMUNITY IMPACT
${goals} Studying in ${targetCountry} will give me the global perspective and advanced skills needed to achieve this vision.

5. CONCLUSION
Thank you for reviewing my application. I look forward to contributing to the scholar community.

Sincerely,
${name}`;
  },

  /**
   * Unified query to fetch user application history.
   */
  async getUserApplications(userId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*, scholarship:scholarships(*), documents(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user applications:', error.message);
      return [];
    }

    const applications = data as Application[];
    return Promise.all(applications.map(withSignedApplicationDocuments));
  },
};





