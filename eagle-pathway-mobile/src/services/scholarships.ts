import { supabase } from './supabase';
import { Scholarship, Application, PackageTier, Document, DocumentType } from '../types';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

export const scholarshipsService = {
  async getScholarships(filters?: {
    degreeLevel?: string;
    fundingType?: string;
    search?: string;
  }): Promise<Scholarship[]> {
    let query = supabase
      .from('scholarships')
      .select('*')
      .eq('is_active', true);

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query.order('deadline', { ascending: true });
    if (error) throw error;
    return data as Scholarship[];
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
    return data as Application[];
  },

  async getApplicationById(id: string): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .select('*, scholarship:scholarships(*), consultant:users!applications_consultant_id_fkey(*), documents(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Application;
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
    // Get blob from file URI
    const response = await fetch(params.fileUri);
    const blob = await response.blob();

    const filePath = `${params.userId}/${params.documentType}/${Date.now()}_${params.fileName}`;
    const contentType = params.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, blob, {
        contentType,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Save document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: params.userId,
        application_id: params.applicationId || null,
        document_type: params.documentType,
        file_name: params.fileName,
        file_url: publicUrl,
        file_size: blob.size || 0,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data as Document;
  },

  async getUserDocuments(userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data as Document[];
  },

  async pickDocument(): Promise<DocumentPicker.DocumentPickerResult> {
    return await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
  },
  async updateSOPContent(applicationId: string, content: string): Promise<void> {
    // First, fetch current draft number to increment safely client-side
    const { data: current } = await supabase
      .from('applications')
      .select('sop_draft_number')
      .eq('id', applicationId)
      .single();

    const nextDraft = ((current?.sop_draft_number) ?? 0) + 1;

    const { error } = await supabase
      .from('applications')
      .update({ 
        sop_content: content,
        sop_draft_number: nextDraft,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);
    if (error) throw error;
  },

  async getSOPFeedback(content: string, scholarshipId?: string, studentId?: string): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    // In a real prod environment, this calls a Supabase Edge Function that invokes Gemini Pro
    // Simulation logic based on content quality and profile alignment
    await new Promise(r => setTimeout(r, 1500));
    
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    
    // Fetch scholarship and student context for better feedback
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

    // AI Logic Simulation
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
    // Advanced matching logic: semantic search simulation
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return [];

    const { data: scholarships, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const userInterests = [
      ...(user.interested_subjects || []),
      ...(user.academic_summary?.split(' ') || []),
      ...(user.career_goals?.split(' ') || [])
    ].map(s => s.toLowerCase());

    const scored = (scholarships as Scholarship[]).map(sch => {
      let score = 50; // Base score
      let reasons: string[] = [];

      // 1. Degree Level Match
      if (sch.degree_levels.includes(user.grade_level?.toLowerCase() as any) || sch.degree_levels.includes('all')) {
        score += 20;
        reasons.push(`${user.grade_level} Level Match`);
      }

      // 2. Field of Study / Interest Match
      const matches = sch.fields_of_study?.filter(f => 
        userInterests.some(ui => ui.includes(f.toLowerCase()) || f.toLowerCase().includes(ui))
      );
      
      if (matches && matches.length > 0) {
        score += 25;
        reasons.push(`Alignment with your interest in ${matches[0]}`);
      }

      // 3. Location / Diversity
      if (user.city && sch.description.toLowerCase().includes(user.city.toLowerCase())) {
        score += 5;
        reasons.push(`Local Opportunities`);
      }

      return {
        ...sch,
        matchScore: Math.min(score, 99),
        matchReason: reasons[0] || 'Good Academic Fit'
      };
    });

    return scored
      .filter(s => (s.matchScore || 0) > 60)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 6);
  },
};
