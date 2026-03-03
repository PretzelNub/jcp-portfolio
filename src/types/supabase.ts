export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      candidate_profile: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string | null
          title: string | null
          target_titles: string[] | null
          target_company_stages: string[] | null
          elevator_pitch: string | null
          career_narrative: string | null
          looking_for: string | null
          not_looking_for: string | null
          management_style: string | null
          work_style: string | null
          salary_min: number | null
          salary_max: number | null
          availability_status: string | null
          availability_date: string | null
          location: string | null
          remote_preference: string | null
          github_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email?: string | null
          title?: string | null
          target_titles?: string[] | null
          target_company_stages?: string[] | null
          elevator_pitch?: string | null
          career_narrative?: string | null
          looking_for?: string | null
          not_looking_for?: string | null
          management_style?: string | null
          work_style?: string | null
          salary_min?: number | null
          salary_max?: number | null
          availability_status?: string | null
          availability_date?: string | null
          location?: string | null
          remote_preference?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string | null
          title?: string | null
          target_titles?: string[] | null
          target_company_stages?: string[] | null
          elevator_pitch?: string | null
          career_narrative?: string | null
          looking_for?: string | null
          not_looking_for?: string | null
          management_style?: string | null
          work_style?: string | null
          salary_min?: number | null
          salary_max?: number | null
          availability_status?: string | null
          availability_date?: string | null
          location?: string | null
          remote_preference?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
        }
      }
      experiences: {
        Row: {
          id: string
          candidate_id: string | null
          created_at: string
          company_name: string
          title: string
          title_progression: string | null
          start_date: string | null
          end_date: string | null
          is_current: boolean | null
          bullet_points: string[] | null
          why_joined: string | null
          why_left: string | null
          actual_contributions: string | null
          proudest_achievement: string | null
          would_do_differently: string | null
          challenges_faced: string | null
          lessons_learned: string | null
          manager_would_say: string | null
          reports_would_say: string | null
          quantified_impact: Json | null
          display_order: number | null
        }
        Insert: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          company_name: string
          title: string
          title_progression?: string | null
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean | null
          bullet_points?: string[] | null
          why_joined?: string | null
          why_left?: string | null
          actual_contributions?: string | null
          proudest_achievement?: string | null
          would_do_differently?: string | null
          challenges_faced?: string | null
          lessons_learned?: string | null
          manager_would_say?: string | null
          reports_would_say?: string | null
          quantified_impact?: Json | null
          display_order?: number | null
        }
        Update: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          company_name?: string
          title?: string
          title_progression?: string | null
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean | null
          bullet_points?: string[] | null
          why_joined?: string | null
          why_left?: string | null
          actual_contributions?: string | null
          proudest_achievement?: string | null
          would_do_differently?: string | null
          challenges_faced?: string | null
          lessons_learned?: string | null
          manager_would_say?: string | null
          reports_would_say?: string | null
          quantified_impact?: Json | null
          display_order?: number | null
        }
      }
      skills: {
        Row: {
          id: string
          candidate_id: string | null
          created_at: string
          skill_name: string
          category: 'strong' | 'moderate' | 'gap' | null
          self_rating: number | null
          evidence: string | null
          honest_notes: string | null
          years_experience: number | null
          last_used: string | null
        }
        Insert: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          skill_name: string
          category?: 'strong' | 'moderate' | 'gap' | null
          self_rating?: number | null
          evidence?: string | null
          honest_notes?: string | null
          years_experience?: number | null
          last_used?: string | null
        }
        Update: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          skill_name?: string
          category?: 'strong' | 'moderate' | 'gap' | null
          self_rating?: number | null
          evidence?: string | null
          honest_notes?: string | null
          years_experience?: number | null
          last_used?: string | null
        }
      }
      gaps_weaknesses: {
        Row: {
          id: string
          candidate_id: string | null
          created_at: string
          gap_type: 'skill' | 'experience' | 'environment' | 'role_type' | null
          description: string | null
          why_its_a_gap: string | null
          interest_in_learning: boolean | null
        }
        Insert: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          gap_type?: 'skill' | 'experience' | 'environment' | 'role_type' | null
          description?: string | null
          why_its_a_gap?: string | null
          interest_in_learning?: boolean | null
        }
        Update: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          gap_type?: 'skill' | 'experience' | 'environment' | 'role_type' | null
          description?: string | null
          why_its_a_gap?: string | null
          interest_in_learning?: boolean | null
        }
      }
      values_culture: {
        Row: {
          id: string
          candidate_id: string | null
          created_at: string
          must_haves: string[] | null
          dealbreakers: string[] | null
          management_style_preferences: string | null
          team_size_preferences: string | null
          how_handle_conflict: string | null
          how_handle_ambiguity: string | null
          how_handle_failure: string | null
        }
        Insert: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          must_haves?: string[] | null
          dealbreakers?: string[] | null
          management_style_preferences?: string | null
          team_size_preferences?: string | null
          how_handle_conflict?: string | null
          how_handle_ambiguity?: string | null
          how_handle_failure?: string | null
        }
        Update: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          must_haves?: string[] | null
          dealbreakers?: string[] | null
          management_style_preferences?: string | null
          team_size_preferences?: string | null
          how_handle_conflict?: string | null
          how_handle_ambiguity?: string | null
          how_handle_failure?: string | null
        }
      }
      faq_responses: {
        Row: {
          id: string
          candidate_id: string | null
          created_at: string
          question: string
          answer: string
          is_common_question: boolean | null
        }
        Insert: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          question: string
          answer: string
          is_common_question?: boolean | null
        }
        Update: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          question?: string
          answer?: string
          is_common_question?: boolean | null
        }
      }
      ai_instructions: {
        Row: {
          id: string
          candidate_id: string | null
          created_at: string
          instruction_type: 'honesty' | 'tone' | 'boundaries' | null
          instruction: string
          priority: number | null
        }
        Insert: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          instruction_type?: 'honesty' | 'tone' | 'boundaries' | null
          instruction: string
          priority?: number | null
        }
        Update: {
          id?: string
          candidate_id?: string | null
          created_at?: string
          instruction_type?: 'honesty' | 'tone' | 'boundaries' | null
          instruction?: string
          priority?: number | null
        }
      }
    }
    Views: {
      candidate_profile_public: {
        Row: {
          name: string
          title: string | null
          elevator_pitch: string | null
          career_narrative: string | null
          looking_for: string | null
          location: string | null
          remote_preference: string | null
          linkedin_url: string | null
          github_url: string | null
          twitter_url: string | null
        }
      }
      skills_public: {
        Row: {
          skill_name: string
          category: 'strong' | 'moderate' | 'gap' | null
          self_rating: number | null
        }
      }
      experiences_public: {
        Row: {
          company_name: string
          title: string
          title_progression: string | null
          start_date: string | null
          end_date: string | null
          is_current: boolean | null
          bullet_points: string[] | null
          display_order: number | null
        }
      }
    }
  }
}
