export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          organization_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      patients: {
        Row: {
          id: string;
          organization_id: string | null;
          mrn: string | null;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          gender: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          medical_history: Json;
          allergies: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['patients']['Insert']>;
      };
      studies: {
        Row: {
          id: string;
          organization_id: string | null;
          patient_id: string;
          assigned_radiologist_id: string | null;
          equipment_id: string | null;
          study_uid: string | null;
          accession_number: string | null;
          modality: string | null;
          body_part: string | null;
          description: string | null;
          status: string;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['studies']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['studies']['Insert']>;
      };
      images: {
        Row: {
          id: string;
          study_id: string;
          storage_path: string;
          sop_instance_uid: string | null;
          series_uid: string | null;
          instance_number: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['images']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['images']['Insert']>;
      };
      ai_analysis: {
        Row: {
          id: string;
          image_id: string | null;
          study_id: string | null;
          model_name: string | null;
          findings: Json;
          confidence: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_analysis']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['ai_analysis']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          study_id: string;
          author_id: string | null;
          content: string | null;
          template_id: string | null;
          findings: Json;
          impression: string | null;
          status: string;
          signed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
    };
  };
}
