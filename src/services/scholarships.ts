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
  }): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        student_id: params.studentId,
        scholarship_id: params.scholarshipId,
        package_tier: params.packageTier,
        status: 'personal_info',
        sop_draft_number: 0,
      })
      .select('*, scholarship:scholarships(*)')
      .single();
    if (error) throw error;
    return data as Application;
  },

  async getStudentApplications(studentId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*, scholarship:scholarships(*), consultant:users(*), documents(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Application[];
  },

  async getApplicationById(id: string): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .select('*, scholarship:scholarships(*), consultant:users(*), documents(*)')
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
        application_id: params.applicationId,
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
    const { error } = await supabase
      .from('applications')
      .update({ 
        sop_content: content, 
        updated_at: new Date().toISOString(),
        sop_draft_number: supabase.rpc('increment_sop_draft') // Assuming an increment function exists or we handle manually
      })
      .eq('id', applicationId);
    if (error) throw error;
  },

  async getSOPFeedback(content: string): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    // This would ideally call a Gemini/Vertex AI endpoint
    // Mocking a sophisticated response for now
    await new Promise(r => setTimeout(r, 2000));
    
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 100) {
      return {
        score: 45,
        feedback: "Your SOP is quite short. A strong Statement of Purpose should typically be between 500-800 words.",
        suggestions: ["Expand on your academic motivations", "Describe specific research interests", "Link your future goals to this scholarship"]
      };
    }

    return {
      score: 82,
      feedback: "Great start! You've clearly articulated your background and passion. However, your connection to the specific host country could be stronger.",
      suggestions: [
        "Include more specific details about the university's research facilities",
        "Clarify how you will contribute to the campus community",
        "Proofread for more formal academic transitions"
      ]
    };
  },

  async getRecommendedScholarships(userId: string): Promise<Scholarship[]> {
    // Simple matching logic: match by user's grade level and generic 'All' levels
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return [];

    const { data: scholarships, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('is_active', true)
      .contains('degree_levels', [user.grade_level?.toLowerCase() || 'undergraduate'])
      .limit(5);

    if (error) throw error;
    return scholarships as Scholarship[];
  },
};
