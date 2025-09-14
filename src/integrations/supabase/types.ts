export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assessment_methodologies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          version: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          version?: string | null
        }
        Relationships: []
      }
      assessment_outcomes: {
        Row: {
          actual_outcome: string | null
          assessor_notes: string | null
          created_at: string | null
          defect_type: string | null
          environmental_factors: Json | null
          follow_up_months: number | null
          id: number
          initial_severity: number | null
          intervention_applied: string | null
          tree_species_id: string | null
        }
        Insert: {
          actual_outcome?: string | null
          assessor_notes?: string | null
          created_at?: string | null
          defect_type?: string | null
          environmental_factors?: Json | null
          follow_up_months?: number | null
          id: number
          initial_severity?: number | null
          intervention_applied?: string | null
          tree_species_id?: string | null
        }
        Update: {
          actual_outcome?: string | null
          assessor_notes?: string | null
          created_at?: string | null
          defect_type?: string | null
          environmental_factors?: Json | null
          follow_up_months?: number | null
          id?: number
          initial_severity?: number | null
          intervention_applied?: string | null
          tree_species_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_outcomes_tree_species_id_fkey"
            columns: ["tree_species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_outcomes_tree_species_id_fkey"
            columns: ["tree_species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "assessment_outcomes_tree_species_id_fkey"
            columns: ["tree_species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "assessment_outcomes_tree_species_id_fkey"
            columns: ["tree_species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_validations: {
        Row: {
          assessment_id: string
          created_at: string
          credits_earned: number | null
          id: string
          methodology_id: string
          updated_at: string
          validated_at: string | null
          validation_notes: string | null
          validation_status: string
          validator_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          credits_earned?: number | null
          id?: string
          methodology_id: string
          updated_at?: string
          validated_at?: string | null
          validation_notes?: string | null
          validation_status?: string
          validator_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          credits_earned?: number | null
          id?: string
          methodology_id?: string
          updated_at?: string
          validated_at?: string | null
          validation_notes?: string | null
          validation_status?: string
          validator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_validations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_validations_methodology_id_fkey"
            columns: ["methodology_id"]
            isOneToOne: false
            referencedRelation: "assessment_methodologies"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_views: {
        Row: {
          configuration: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          methodology: string
          name: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          methodology: string
          name: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          methodology?: string
          name?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          assessment_date: string
          assessment_method: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"] | null
          assessor_id: string | null
          consequence_rating: Database["public"]["Enums"]["risk_rating"] | null
          created_at: string | null
          follow_up_date: string | null
          id: string
          methodology_id: string | null
          notes: string | null
          overall_condition: string | null
          probability_of_failure:
            | Database["public"]["Enums"]["risk_rating"]
            | null
          recommendations: string | null
          risk_rating: Database["public"]["Enums"]["risk_rating"] | null
          status: Database["public"]["Enums"]["assessment_status"] | null
          tree_id: string | null
          updated_at: string | null
          validation_requested: boolean | null
          validation_type: string | null
          weather_conditions: string | null
        }
        Insert: {
          assessment_date?: string
          assessment_method?: string | null
          assessment_type?:
            | Database["public"]["Enums"]["assessment_type"]
            | null
          assessor_id?: string | null
          consequence_rating?: Database["public"]["Enums"]["risk_rating"] | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          methodology_id?: string | null
          notes?: string | null
          overall_condition?: string | null
          probability_of_failure?:
            | Database["public"]["Enums"]["risk_rating"]
            | null
          recommendations?: string | null
          risk_rating?: Database["public"]["Enums"]["risk_rating"] | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          tree_id?: string | null
          updated_at?: string | null
          validation_requested?: boolean | null
          validation_type?: string | null
          weather_conditions?: string | null
        }
        Update: {
          assessment_date?: string
          assessment_method?: string | null
          assessment_type?:
            | Database["public"]["Enums"]["assessment_type"]
            | null
          assessor_id?: string | null
          consequence_rating?: Database["public"]["Enums"]["risk_rating"] | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          methodology_id?: string | null
          notes?: string | null
          overall_condition?: string | null
          probability_of_failure?:
            | Database["public"]["Enums"]["risk_rating"]
            | null
          recommendations?: string | null
          risk_rating?: Database["public"]["Enums"]["risk_rating"] | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          tree_id?: string | null
          updated_at?: string | null
          validation_requested?: boolean | null
          validation_type?: string | null
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_methodology_id_fkey"
            columns: ["methodology_id"]
            isOneToOne: false
            referencedRelation: "assessment_methodologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          id: number
          record_id: string | null
          table_name: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: number
          record_id?: string | null
          table_name: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: number
          record_id?: string | null
          table_name?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          attempt_time: string
          email: string
          id: number
          ip_address: unknown | null
          success: boolean | null
        }
        Insert: {
          attempt_time?: string
          email: string
          id?: number
          ip_address?: unknown | null
          success?: boolean | null
        }
        Update: {
          attempt_time?: string
          email?: string
          id?: number
          ip_address?: unknown | null
          success?: boolean | null
        }
        Relationships: []
      }
      climate_zones: {
        Row: {
          code: string
          country_id: string
          id: string
          name: string | null
          scheme: string
        }
        Insert: {
          code: string
          country_id: string
          id: string
          name?: string | null
          scheme: string
        }
        Update: {
          code?: string
          country_id?: string
          id?: string
          name?: string | null
          scheme?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_zones_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          is_active: boolean | null
          name: string
          price_usd: number
        }
        Insert: {
          created_at?: string | null
          credits: number
          id?: string
          is_active?: boolean | null
          name: string
          price_usd: number
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price_usd?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          assessment_type: Database["public"]["Enums"]["assessment_type"] | null
          created_at: string
          description: string
          id: string
          related_assessment_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          assessment_type?:
            | Database["public"]["Enums"]["assessment_type"]
            | null
          created_at?: string
          description: string
          id?: string
          related_assessment_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          assessment_type?:
            | Database["public"]["Enums"]["assessment_type"]
            | null
          created_at?: string
          description?: string
          id?: string
          related_assessment_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_related_assessment_id_fkey"
            columns: ["related_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      defects: {
        Row: {
          category: Database["public"]["Enums"]["defect_category"]
          development: string | null
          field_indicators: string[] | null
          id: string
          mechanics_effect: string | null
          name: string
          notes: string | null
          qtra_guidance: Json | null
        }
        Insert: {
          category: Database["public"]["Enums"]["defect_category"]
          development?: string | null
          field_indicators?: string[] | null
          id: string
          mechanics_effect?: string | null
          name: string
          notes?: string | null
          qtra_guidance?: Json | null
        }
        Update: {
          category?: Database["public"]["Enums"]["defect_category"]
          development?: string | null
          field_indicators?: string[] | null
          id?: string
          mechanics_effect?: string | null
          name?: string
          notes?: string | null
          qtra_guidance?: Json | null
        }
        Relationships: []
      }
      expert_reviews: {
        Row: {
          assessment_id: string | null
          completed_at: string | null
          created_at: string | null
          custom_price_usd: number | null
          expert_notes: string | null
          id: string
          location_description: string
          preferred_expert_id: string | null
          requester_id: string
          scheduled_date: string | null
          status: string | null
          urgency_level: string | null
        }
        Insert: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          custom_price_usd?: number | null
          expert_notes?: string | null
          id?: string
          location_description: string
          preferred_expert_id?: string | null
          requester_id: string
          scheduled_date?: string | null
          status?: string | null
          urgency_level?: string | null
        }
        Update: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          custom_price_usd?: number | null
          expert_notes?: string | null
          id?: string
          location_description?: string
          preferred_expert_id?: string | null
          requester_id?: string
          scheduled_date?: string | null
          status?: string | null
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_reviews_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          description: string | null
          group_name: Database["public"]["Enums"]["feature_group"]
          id: string
          label: string
        }
        Insert: {
          description?: string | null
          group_name: Database["public"]["Enums"]["feature_group"]
          id: string
          label: string
        }
        Update: {
          description?: string | null
          group_name?: Database["public"]["Enums"]["feature_group"]
          id?: string
          label?: string
        }
        Relationships: []
      }
      fungi: {
        Row: {
          colonization:
            | Database["public"]["Enums"]["colonization_route"][]
            | null
          common_names: string[] | null
          created_at: string | null
          decay: Database["public"]["Enums"]["decay_type"] | null
          id: string
          notes: string | null
          scientific_name: string
          source_id: string | null
          src_lang: string | null
          structural_effect_en: string | null
          structural_effect_src: string | null
          typical_tissue: Database["public"]["Enums"]["tissue_pref"][] | null
        }
        Insert: {
          colonization?:
            | Database["public"]["Enums"]["colonization_route"][]
            | null
          common_names?: string[] | null
          created_at?: string | null
          decay?: Database["public"]["Enums"]["decay_type"] | null
          id: string
          notes?: string | null
          scientific_name: string
          source_id?: string | null
          src_lang?: string | null
          structural_effect_en?: string | null
          structural_effect_src?: string | null
          typical_tissue?: Database["public"]["Enums"]["tissue_pref"][] | null
        }
        Update: {
          colonization?:
            | Database["public"]["Enums"]["colonization_route"][]
            | null
          common_names?: string[] | null
          created_at?: string | null
          decay?: Database["public"]["Enums"]["decay_type"] | null
          id?: string
          notes?: string | null
          scientific_name?: string
          source_id?: string | null
          src_lang?: string | null
          structural_effect_en?: string | null
          structural_effect_src?: string | null
          typical_tissue?: Database["public"]["Enums"]["tissue_pref"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "fungi_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      fungus_defect_links: {
        Row: {
          defect_id: string
          fungus_id: string
          rationale_en: string | null
        }
        Insert: {
          defect_id: string
          fungus_id: string
          rationale_en?: string | null
        }
        Update: {
          defect_id?: string
          fungus_id?: string
          rationale_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fungus_defect_links_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_defect_links_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["defect_id"]
          },
          {
            foreignKeyName: "fungus_defect_links_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "fungi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_defect_links_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "v_fungus_with_mgmt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_defect_links_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["fungus_id"]
          },
        ]
      }
      fungus_hosts: {
        Row: {
          evidence_en: string | null
          evidence_src: string | null
          frequency: Database["public"]["Enums"]["host_freq"] | null
          fungus_id: string
          species_id: string
          src_lang: string | null
        }
        Insert: {
          evidence_en?: string | null
          evidence_src?: string | null
          frequency?: Database["public"]["Enums"]["host_freq"] | null
          fungus_id: string
          species_id: string
          src_lang?: string | null
        }
        Update: {
          evidence_en?: string | null
          evidence_src?: string | null
          frequency?: Database["public"]["Enums"]["host_freq"] | null
          fungus_id?: string
          species_id?: string
          src_lang?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fungus_hosts_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "fungi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_hosts_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "v_fungus_with_mgmt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_hosts_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["fungus_id"]
          },
          {
            foreignKeyName: "fungus_hosts_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_hosts_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "fungus_hosts_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "fungus_hosts_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      fungus_management: {
        Row: {
          action_en: string | null
          action_src: string | null
          conditions_en: string | null
          conditions_src: string | null
          follow_up_en: string | null
          follow_up_src: string | null
          fungus_id: string | null
          id: number
          mtype: Database["public"]["Enums"]["mitigation_type"] | null
          source_id: string | null
          src_lang: string | null
          timing_en: string | null
          timing_src: string | null
        }
        Insert: {
          action_en?: string | null
          action_src?: string | null
          conditions_en?: string | null
          conditions_src?: string | null
          follow_up_en?: string | null
          follow_up_src?: string | null
          fungus_id?: string | null
          id?: number
          mtype?: Database["public"]["Enums"]["mitigation_type"] | null
          source_id?: string | null
          src_lang?: string | null
          timing_en?: string | null
          timing_src?: string | null
        }
        Update: {
          action_en?: string | null
          action_src?: string | null
          conditions_en?: string | null
          conditions_src?: string | null
          follow_up_en?: string | null
          follow_up_src?: string | null
          fungus_id?: string | null
          id?: number
          mtype?: Database["public"]["Enums"]["mitigation_type"] | null
          source_id?: string | null
          src_lang?: string | null
          timing_en?: string | null
          timing_src?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fungus_management_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "fungi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_management_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "v_fungus_with_mgmt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_management_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["fungus_id"]
          },
          {
            foreignKeyName: "fungus_management_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      fungus_signs: {
        Row: {
          fungus_id: string | null
          id: number
          location: Database["public"]["Enums"]["tissue_pref"] | null
          photo_media_id: number | null
          season_hint: string | null
          sign_en: string | null
          sign_src: string | null
        }
        Insert: {
          fungus_id?: string | null
          id?: number
          location?: Database["public"]["Enums"]["tissue_pref"] | null
          photo_media_id?: number | null
          season_hint?: string | null
          sign_en?: string | null
          sign_src?: string | null
        }
        Update: {
          fungus_id?: string | null
          id?: number
          location?: Database["public"]["Enums"]["tissue_pref"] | null
          photo_media_id?: number | null
          season_hint?: string | null
          sign_en?: string | null
          sign_src?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fungus_signs_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "fungi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_signs_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "v_fungus_with_mgmt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fungus_signs_fungus_id_fkey"
            columns: ["fungus_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["fungus_id"]
          },
          {
            foreignKeyName: "fungus_signs_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary: {
        Row: {
          definition: string | null
          lang: string | null
          synonyms: string[] | null
          term: string
        }
        Insert: {
          definition?: string | null
          lang?: string | null
          synonyms?: string[] | null
          term: string
        }
        Update: {
          definition?: string | null
          lang?: string | null
          synonyms?: string[] | null
          term?: string
        }
        Relationships: []
      }
      kb_chunks: {
        Row: {
          content: string
          content_en: string | null
          content_sha256: string | null
          created_at: string | null
          defect_ids: string[] | null
          embedding: string | null
          id: number
          image_ids: number[] | null
          lang: string | null
          meta: Json | null
          pages: string | null
          source_id: string
          species_ids: string[] | null
          src_content: string | null
          src_lang: string | null
        }
        Insert: {
          content: string
          content_en?: string | null
          content_sha256?: string | null
          created_at?: string | null
          defect_ids?: string[] | null
          embedding?: string | null
          id?: number
          image_ids?: number[] | null
          lang?: string | null
          meta?: Json | null
          pages?: string | null
          source_id: string
          species_ids?: string[] | null
          src_content?: string | null
          src_lang?: string | null
        }
        Update: {
          content?: string
          content_en?: string | null
          content_sha256?: string | null
          created_at?: string | null
          defect_ids?: string[] | null
          embedding?: string | null
          id?: number
          image_ids?: number[] | null
          lang?: string | null
          meta?: Json | null
          pages?: string | null
          source_id?: string
          species_ids?: string[] | null
          src_content?: string | null
          src_lang?: string | null
        }
        Relationships: []
      }
      kb_feedback: {
        Row: {
          chunk_id: number | null
          created_at: string | null
          id: number
          notes: string | null
          verdict: string | null
        }
        Insert: {
          chunk_id?: number | null
          created_at?: string | null
          id?: number
          notes?: string | null
          verdict?: string | null
        }
        Update: {
          chunk_id?: number | null
          created_at?: string | null
          id?: number
          notes?: string | null
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_feedback_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "kb_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: number
          meta: Json | null
          page: number | null
          source_id: string
          uri: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: number
          meta?: Json | null
          page?: number | null
          source_id: string
          uri?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: number
          meta?: Json | null
          page?: number | null
          source_id?: string
          uri?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_images_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_sources: {
        Row: {
          authors: string[] | null
          created_at: string | null
          id: string
          isbn: string | null
          kind: string | null
          lang: string | null
          meta: Json | null
          notes: string | null
          publisher: string | null
          rights: string | null
          title: string
          url: string | null
          year: number | null
        }
        Insert: {
          authors?: string[] | null
          created_at?: string | null
          id: string
          isbn?: string | null
          kind?: string | null
          lang?: string | null
          meta?: Json | null
          notes?: string | null
          publisher?: string | null
          rights?: string | null
          title: string
          url?: string | null
          year?: number | null
        }
        Update: {
          authors?: string[] | null
          created_at?: string | null
          id?: string
          isbn?: string | null
          kind?: string | null
          lang?: string | null
          meta?: Json | null
          notes?: string | null
          publisher?: string | null
          rights?: string | null
          title?: string
          url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      media: {
        Row: {
          caption: string | null
          defect_ids: string[] | null
          id: number
          page: string | null
          rights: string | null
          source_id: string | null
          species_ids: string[] | null
          uri: string
        }
        Insert: {
          caption?: string | null
          defect_ids?: string[] | null
          id?: number
          page?: string | null
          rights?: string | null
          source_id?: string | null
          species_ids?: string[] | null
          uri: string
        }
        Update: {
          caption?: string | null
          defect_ids?: string[] | null
          id?: number
          page?: string | null
          rights?: string | null
          source_id?: string | null
          species_ids?: string[] | null
          uri?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      mitigations: {
        Row: {
          action: string
          action_en: string | null
          action_src: string | null
          conditions: string | null
          conditions_en: string | null
          conditions_src: string | null
          defect_id: string | null
          follow_up: string | null
          follow_up_en: string | null
          follow_up_src: string | null
          id: number
          mtype: Database["public"]["Enums"]["mitigation_type"]
          species_id: string | null
          src_lang: string | null
          timing: string | null
          timing_en: string | null
          timing_src: string | null
        }
        Insert: {
          action: string
          action_en?: string | null
          action_src?: string | null
          conditions?: string | null
          conditions_en?: string | null
          conditions_src?: string | null
          defect_id?: string | null
          follow_up?: string | null
          follow_up_en?: string | null
          follow_up_src?: string | null
          id?: number
          mtype: Database["public"]["Enums"]["mitigation_type"]
          species_id?: string | null
          src_lang?: string | null
          timing?: string | null
          timing_en?: string | null
          timing_src?: string | null
        }
        Update: {
          action?: string
          action_en?: string | null
          action_src?: string | null
          conditions?: string | null
          conditions_en?: string | null
          conditions_src?: string | null
          defect_id?: string | null
          follow_up?: string | null
          follow_up_en?: string | null
          follow_up_src?: string | null
          id?: number
          mtype?: Database["public"]["Enums"]["mitigation_type"]
          species_id?: string | null
          src_lang?: string | null
          timing?: string | null
          timing_en?: string | null
          timing_src?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mitigations_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitigations_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["defect_id"]
          },
          {
            foreignKeyName: "mitigations_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitigations_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "mitigations_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "mitigations_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      page_suggestions: {
        Row: {
          applied_at: string | null
          confidence_score: number | null
          created_at: string
          id: string
          notes: string | null
          page_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_data: Json
          suggestion_type: Database["public"]["Enums"]["suggestion_type"]
          target_table: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          page_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_data: Json
          suggestion_type: Database["public"]["Enums"]["suggestion_type"]
          target_table: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          page_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_data?: Json
          suggestion_type?: Database["public"]["Enums"]["suggestion_type"]
          target_table?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_suggestions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "queue_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_queue: {
        Row: {
          batch_name: string
          completed_at: string | null
          created_at: string
          current_file: string | null
          current_page: number | null
          current_phase: string | null
          current_stage: string | null
          error_message: string | null
          estimated_completion: string | null
          id: string
          processed_pages: number
          processing_speed: number | null
          progress_percentage: number
          source_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["processing_status"]
          total_pages: number
          updated_at: string
        }
        Insert: {
          batch_name: string
          completed_at?: string | null
          created_at?: string
          current_file?: string | null
          current_page?: number | null
          current_phase?: string | null
          current_stage?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          id?: string
          processed_pages?: number
          processing_speed?: number | null
          progress_percentage?: number
          source_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["processing_status"]
          total_pages?: number
          updated_at?: string
        }
        Update: {
          batch_name?: string
          completed_at?: string | null
          created_at?: string
          current_file?: string | null
          current_page?: number | null
          current_phase?: string | null
          current_stage?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          id?: string
          processed_pages?: number
          processing_speed?: number | null
          progress_percentage?: number
          source_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["processing_status"]
          total_pages?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      queue_pages: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_text: string | null
          figures_extracted: Json | null
          id: string
          ocr_confidence: number | null
          page_number: number
          phase1_completed_at: string | null
          phase2_completed_at: string | null
          phase3_completed_at: string | null
          processed_at: string | null
          queue_id: string
          status: Database["public"]["Enums"]["processing_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_text?: string | null
          figures_extracted?: Json | null
          id?: string
          ocr_confidence?: number | null
          page_number: number
          phase1_completed_at?: string | null
          phase2_completed_at?: string | null
          phase3_completed_at?: string | null
          processed_at?: string | null
          queue_id: string
          status?: Database["public"]["Enums"]["processing_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_text?: string | null
          figures_extracted?: Json | null
          id?: string
          ocr_confidence?: number | null
          page_number?: number
          phase1_completed_at?: string | null
          phase2_completed_at?: string | null
          phase3_completed_at?: string | null
          processed_at?: string | null
          queue_id?: string
          status?: Database["public"]["Enums"]["processing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_pages_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "processing_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          aliases: string[] | null
          common_names: string[] | null
          family: string | null
          genus: string | null
          id: string
          notes: string | null
          regions: string[] | null
          scientific_name: string
        }
        Insert: {
          aliases?: string[] | null
          common_names?: string[] | null
          family?: string | null
          genus?: string | null
          id: string
          notes?: string | null
          regions?: string[] | null
          scientific_name: string
        }
        Update: {
          aliases?: string[] | null
          common_names?: string[] | null
          family?: string | null
          genus?: string | null
          id?: string
          notes?: string | null
          regions?: string[] | null
          scientific_name?: string
        }
        Relationships: []
      }
      species_defects: {
        Row: {
          defect_id: string
          likelihood: Database["public"]["Enums"]["likelihood"] | null
          notes: string | null
          species_id: string
        }
        Insert: {
          defect_id: string
          likelihood?: Database["public"]["Enums"]["likelihood"] | null
          notes?: string | null
          species_id: string
        }
        Update: {
          defect_id?: string
          likelihood?: Database["public"]["Enums"]["likelihood"] | null
          notes?: string | null
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_defects_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_defects_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["defect_id"]
          },
          {
            foreignKeyName: "species_defects_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_defects_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_defects_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_defects_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      species_ecology: {
        Row: {
          allergenicity: number | null
          invasiveness_risk: number | null
          native_regions: string[] | null
          notes: string | null
          pollinator_value: number | null
          source_id: string | null
          species_id: string
          wildlife_value: number | null
        }
        Insert: {
          allergenicity?: number | null
          invasiveness_risk?: number | null
          native_regions?: string[] | null
          notes?: string | null
          pollinator_value?: number | null
          source_id?: string | null
          species_id: string
          wildlife_value?: number | null
        }
        Update: {
          allergenicity?: number | null
          invasiveness_risk?: number | null
          native_regions?: string[] | null
          notes?: string | null
          pollinator_value?: number | null
          source_id?: string | null
          species_id?: string
          wildlife_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "species_ecology_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_ecology_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_ecology_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_ecology_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_ecology_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      species_features: {
        Row: {
          detail: string | null
          detail_en: string | null
          detail_src: string | null
          evidence: string | null
          evidence_en: string | null
          evidence_src: string | null
          feature_id: string
          pages: string | null
          season_hint: string | null
          source_id: string | null
          species_id: string
          src_lang: string | null
        }
        Insert: {
          detail?: string | null
          detail_en?: string | null
          detail_src?: string | null
          evidence?: string | null
          evidence_en?: string | null
          evidence_src?: string | null
          feature_id: string
          pages?: string | null
          season_hint?: string | null
          source_id?: string | null
          species_id: string
          src_lang?: string | null
        }
        Update: {
          detail?: string | null
          detail_en?: string | null
          detail_src?: string | null
          evidence?: string | null
          evidence_en?: string | null
          evidence_src?: string | null
          feature_id?: string
          pages?: string | null
          season_hint?: string | null
          source_id?: string | null
          species_id?: string
          src_lang?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "species_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_features_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_features_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_features_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_features_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_features_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      species_growth: {
        Row: {
          brittle_wood: boolean | null
          crown_form: Database["public"]["Enums"]["crown_form"] | null
          growth_rate: Database["public"]["Enums"]["growth_rate"] | null
          lifespan_years: number | null
          litter_heavy: boolean | null
          maintenance: Database["public"]["Enums"]["maintenance_level"] | null
          mature_height_m: number | null
          mature_spread_m: number | null
          notes: string | null
          source_id: string | null
          species_id: string
          sucker_prone: boolean | null
        }
        Insert: {
          brittle_wood?: boolean | null
          crown_form?: Database["public"]["Enums"]["crown_form"] | null
          growth_rate?: Database["public"]["Enums"]["growth_rate"] | null
          lifespan_years?: number | null
          litter_heavy?: boolean | null
          maintenance?: Database["public"]["Enums"]["maintenance_level"] | null
          mature_height_m?: number | null
          mature_spread_m?: number | null
          notes?: string | null
          source_id?: string | null
          species_id: string
          sucker_prone?: boolean | null
        }
        Update: {
          brittle_wood?: boolean | null
          crown_form?: Database["public"]["Enums"]["crown_form"] | null
          growth_rate?: Database["public"]["Enums"]["growth_rate"] | null
          lifespan_years?: number | null
          litter_heavy?: boolean | null
          maintenance?: Database["public"]["Enums"]["maintenance_level"] | null
          mature_height_m?: number | null
          mature_spread_m?: number | null
          notes?: string | null
          source_id?: string | null
          species_id?: string
          sucker_prone?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "species_growth_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_growth_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_growth_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_growth_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_growth_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      species_life_expectancy_profile: {
        Row: {
          climate_zone_id: string | null
          context: Database["public"]["Enums"]["life_ctx"]
          country_id: string | null
          created_at: string
          expected_years_max: number | null
          expected_years_min: number | null
          expected_years_typical: number | null
          id: number
          juvenile_years: number | null
          mature_years: number | null
          notes: string | null
          senescent_years: number | null
          source_id: string | null
          species_id: string
          updated_at: string
        }
        Insert: {
          climate_zone_id?: string | null
          context: Database["public"]["Enums"]["life_ctx"]
          country_id?: string | null
          created_at?: string
          expected_years_max?: number | null
          expected_years_min?: number | null
          expected_years_typical?: number | null
          id?: number
          juvenile_years?: number | null
          mature_years?: number | null
          notes?: string | null
          senescent_years?: number | null
          source_id?: string | null
          species_id: string
          updated_at?: string
        }
        Update: {
          climate_zone_id?: string | null
          context?: Database["public"]["Enums"]["life_ctx"]
          country_id?: string | null
          created_at?: string
          expected_years_max?: number | null
          expected_years_min?: number | null
          expected_years_typical?: number | null
          id?: number
          juvenile_years?: number | null
          mature_years?: number | null
          notes?: string | null
          senescent_years?: number | null
          source_id?: string | null
          species_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_life_expectancy_profile_climate_zone_id_fkey"
            columns: ["climate_zone_id"]
            isOneToOne: false
            referencedRelation: "climate_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_life_expectancy_profile_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_life_expectancy_profile_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_life_expectancy_profile_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_life_expectancy_profile_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_life_expectancy_profile_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_life_expectancy_profile_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      species_origin_climate: {
        Row: {
          drought_legacy_resilience: number | null
          hardiness_max: number | null
          hardiness_min: number | null
          heat_tolerance: number | null
          notes: string | null
          provenance: string | null
          source_id: string | null
          species_id: string
          sweden_zones: number[] | null
          urban_heat_island_tolerance: number | null
        }
        Insert: {
          drought_legacy_resilience?: number | null
          hardiness_max?: number | null
          hardiness_min?: number | null
          heat_tolerance?: number | null
          notes?: string | null
          provenance?: string | null
          source_id?: string | null
          species_id: string
          sweden_zones?: number[] | null
          urban_heat_island_tolerance?: number | null
        }
        Update: {
          drought_legacy_resilience?: number | null
          hardiness_max?: number | null
          hardiness_min?: number | null
          heat_tolerance?: number | null
          notes?: string | null
          provenance?: string | null
          source_id?: string | null
          species_id?: string
          sweden_zones?: number[] | null
          urban_heat_island_tolerance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "species_origin_climate_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_origin_climate_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_origin_climate_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_origin_climate_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_origin_climate_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      species_site_traits: {
        Row: {
          compaction_tolerance: number | null
          deicing_salt_tolerance: number | null
          drought_tolerance: number | null
          notes: string | null
          pollution_tolerance: number | null
          root_space_need_m3: number | null
          salt_spray_tolerance: number | null
          shade_tolerance: number | null
          soil_ph_pref_high: number | null
          soil_ph_pref_low: number | null
          source_id: string | null
          species_id: string
          waterlogging_tolerance: number | null
          wind_tolerance: number | null
        }
        Insert: {
          compaction_tolerance?: number | null
          deicing_salt_tolerance?: number | null
          drought_tolerance?: number | null
          notes?: string | null
          pollution_tolerance?: number | null
          root_space_need_m3?: number | null
          salt_spray_tolerance?: number | null
          shade_tolerance?: number | null
          soil_ph_pref_high?: number | null
          soil_ph_pref_low?: number | null
          source_id?: string | null
          species_id: string
          waterlogging_tolerance?: number | null
          wind_tolerance?: number | null
        }
        Update: {
          compaction_tolerance?: number | null
          deicing_salt_tolerance?: number | null
          drought_tolerance?: number | null
          notes?: string | null
          pollution_tolerance?: number | null
          root_space_need_m3?: number | null
          salt_spray_tolerance?: number | null
          shade_tolerance?: number | null
          soil_ph_pref_high?: number | null
          soil_ph_pref_low?: number | null
          source_id?: string | null
          species_id?: string
          waterlogging_tolerance?: number | null
          wind_tolerance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "species_site_traits_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_site_traits_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_site_traits_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_site_traits_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_site_traits_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      species_swedish_regs: {
        Row: {
          biotope_protected: boolean | null
          cultural_heritage_value: string | null
          environmental_classification: string | null
          municipal_guidelines: Json | null
          protected_status: string | null
          removal_permit_required: boolean | null
          replacement_ratio: number | null
          species_id: string
        }
        Insert: {
          biotope_protected?: boolean | null
          cultural_heritage_value?: string | null
          environmental_classification?: string | null
          municipal_guidelines?: Json | null
          protected_status?: string | null
          removal_permit_required?: boolean | null
          replacement_ratio?: number | null
          species_id: string
        }
        Update: {
          biotope_protected?: boolean | null
          cultural_heritage_value?: string | null
          environmental_classification?: string | null
          municipal_guidelines?: Json | null
          protected_status?: string | null
          removal_permit_required?: boolean | null
          replacement_ratio?: number | null
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_swedish_regs_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_swedish_regs_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_swedish_regs_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_swedish_regs_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      species_tags: {
        Row: {
          species_id: string
          tag_id: string
        }
        Insert: {
          species_id: string
          tag_id: string
        }
        Update: {
          species_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_tags_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_tags_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_tags_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_tags_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      species_use_cases: {
        Row: {
          notes: string | null
          source_id: string | null
          species_id: string
          suitability: number
          sweden_site_category: string | null
          use_case_id: string
        }
        Insert: {
          notes?: string | null
          source_id?: string | null
          species_id: string
          suitability: number
          sweden_site_category?: string | null
          use_case_id: string
        }
        Update: {
          notes?: string | null
          source_id?: string | null
          species_id?: string
          suitability?: number
          sweden_site_category?: string | null
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_use_cases_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_use_cases_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_use_cases_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_use_cases_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "species_use_cases_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_use_cases_sweden_site_category_fkey"
            columns: ["sweden_site_category"]
            isOneToOne: false
            referencedRelation: "sweden_site_categories"
            referencedColumns: ["category"]
          },
          {
            foreignKeyName: "species_use_cases_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      sweden_climate_zones: {
        Row: {
          description: string | null
          growing_season_days: number | null
          hardiness_notes: string | null
          temperature_range: string | null
          typical_cities: string[] | null
          zone_name: string | null
          zone_number: number
        }
        Insert: {
          description?: string | null
          growing_season_days?: number | null
          hardiness_notes?: string | null
          temperature_range?: string | null
          typical_cities?: string[] | null
          zone_name?: string | null
          zone_number: number
        }
        Update: {
          description?: string | null
          growing_season_days?: number | null
          hardiness_notes?: string | null
          temperature_range?: string | null
          typical_cities?: string[] | null
          zone_name?: string | null
          zone_number?: number
        }
        Relationships: []
      }
      sweden_site_categories: {
        Row: {
          category: string
          description: string | null
          name: string | null
          recommendation_priority: number | null
        }
        Insert: {
          category: string
          description?: string | null
          name?: string | null
          recommendation_priority?: number | null
        }
        Update: {
          category?: string
          description?: string | null
          name?: string | null
          recommendation_priority?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          label: string
        }
        Insert: {
          id: string
          label: string
        }
        Update: {
          id?: string
          label?: string
        }
        Relationships: []
      }
      tree_defects: {
        Row: {
          affects_structure: boolean | null
          assessment_id: string | null
          created_at: string | null
          defect_id: string | null
          description: string | null
          extent_percentage: number | null
          id: string
          location_on_tree: string | null
          severity_rating: number | null
        }
        Insert: {
          affects_structure?: boolean | null
          assessment_id?: string | null
          created_at?: string | null
          defect_id?: string | null
          description?: string | null
          extent_percentage?: number | null
          id?: string
          location_on_tree?: string | null
          severity_rating?: number | null
        }
        Update: {
          affects_structure?: boolean | null
          assessment_id?: string | null
          created_at?: string | null
          defect_id?: string | null
          description?: string | null
          extent_percentage?: number | null
          id?: string
          location_on_tree?: string | null
          severity_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_defects_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_defects_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_defects_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["defect_id"]
          },
        ]
      }
      tree_neighbors: {
        Row: {
          created_at: string | null
          distance_m: number | null
          id: string
          influence_notes: string | null
          neighbor_tree_id: string | null
          primary_tree_id: string | null
          relationship_type: string | null
        }
        Insert: {
          created_at?: string | null
          distance_m?: number | null
          id?: string
          influence_notes?: string | null
          neighbor_tree_id?: string | null
          primary_tree_id?: string | null
          relationship_type?: string | null
        }
        Update: {
          created_at?: string | null
          distance_m?: number | null
          id?: string
          influence_notes?: string | null
          neighbor_tree_id?: string | null
          primary_tree_id?: string | null
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_neighbors_neighbor_tree_id_fkey"
            columns: ["neighbor_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_neighbors_primary_tree_id_fkey"
            columns: ["primary_tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_photos: {
        Row: {
          assessment_id: string | null
          caption: string | null
          created_at: string | null
          file_path: string
          id: string
          photo_type: string | null
          taken_at: string | null
          tree_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          assessment_id?: string | null
          caption?: string | null
          created_at?: string | null
          file_path: string
          id?: string
          photo_type?: string | null
          taken_at?: string | null
          tree_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          assessment_id?: string | null
          caption?: string | null
          created_at?: string | null
          file_path?: string
          id?: string
          photo_type?: string | null
          taken_at?: string | null
          tree_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_photos_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_photos_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_targets: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          description: string | null
          distance_m: number | null
          id: string
          occupancy_frequency: string | null
          target_type: Database["public"]["Enums"]["target_type"]
          value_rating: number | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          description?: string | null
          distance_m?: number | null
          id?: string
          occupancy_frequency?: string | null
          target_type: Database["public"]["Enums"]["target_type"]
          value_rating?: number | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          description?: string | null
          distance_m?: number | null
          id?: string
          occupancy_frequency?: string | null
          target_type?: Database["public"]["Enums"]["target_type"]
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_targets_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      trees: {
        Row: {
          age_estimate: number | null
          created_at: string | null
          created_by: string | null
          crown_spread_m: number | null
          dbh_cm: number | null
          height_m: number | null
          id: string
          lat: number | null
          latitude: number | null
          lng: number | null
          location_description: string | null
          longitude: number | null
          notes: string | null
          ownership: string | null
          protected_status: boolean | null
          site_conditions: string | null
          species_id: string | null
          tree_number: string | null
          updated_at: string | null
        }
        Insert: {
          age_estimate?: number | null
          created_at?: string | null
          created_by?: string | null
          crown_spread_m?: number | null
          dbh_cm?: number | null
          height_m?: number | null
          id?: string
          lat?: number | null
          latitude?: number | null
          lng?: number | null
          location_description?: string | null
          longitude?: number | null
          notes?: string | null
          ownership?: string | null
          protected_status?: boolean | null
          site_conditions?: string | null
          species_id?: string | null
          tree_number?: string | null
          updated_at?: string | null
        }
        Update: {
          age_estimate?: number | null
          created_at?: string | null
          created_by?: string | null
          crown_spread_m?: number | null
          dbh_cm?: number | null
          height_m?: number | null
          id?: string
          lat?: number | null
          latitude?: number | null
          lng?: number | null
          location_description?: string | null
          longitude?: number | null
          notes?: string | null
          ownership?: string | null
          protected_status?: boolean | null
          site_conditions?: string | null
          species_id?: string | null
          tree_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trees_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_defect_species_mitigations"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "trees_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_fungi"
            referencedColumns: ["species_id"]
          },
          {
            foreignKeyName: "trees_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "v_species_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      use_cases: {
        Row: {
          id: string
          label: string
        }
        Insert: {
          id: string
          label: string
        }
        Update: {
          id?: string
          label?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_public_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_defect_species_mitigations: {
        Row: {
          action: string | null
          conditions_en: string | null
          defect_id: string | null
          defect_name: string | null
          follow_up_en: string | null
          likelihood: Database["public"]["Enums"]["likelihood"] | null
          scientific_name: string | null
          species_id: string | null
          timing_en: string | null
        }
        Relationships: []
      }
      v_fungus_with_mgmt: {
        Row: {
          action_en: string | null
          common_names: string[] | null
          conditions_en: string | null
          decay: Database["public"]["Enums"]["decay_type"] | null
          follow_up_en: string | null
          id: string | null
          scientific_name: string | null
          structural_effect_en: string | null
          timing_en: string | null
        }
        Relationships: []
      }
      v_species_fungi: {
        Row: {
          evidence_en: string | null
          frequency: Database["public"]["Enums"]["host_freq"] | null
          fungus_id: string | null
          fungus_name: string | null
          scientific_name: string | null
          species_id: string | null
        }
        Relationships: []
      }
      v_species_profile: {
        Row: {
          allergenicity: number | null
          common_names: string[] | null
          drought_tolerance: number | null
          family: string | null
          genus: string | null
          growth_rate: Database["public"]["Enums"]["growth_rate"] | null
          id: string | null
          lifespan_years: number | null
          mature_height_m: number | null
          mature_spread_m: number | null
          pollinator_value: number | null
          pollution_tolerance: number | null
          scientific_name: string | null
          shade_tolerance: number | null
          wildlife_value: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_enum_value_if_not_exists: {
        Args: { enum_type: string; new_value: string }
        Returns: undefined
      }
      audit_admin_profile_access: {
        Args: { target_email: string; target_profile_id: string }
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      cleanup_old_auth_attempts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_root_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_assessor_profile: {
        Args: { profile_user_id: string }
        Returns: {
          display_name: string
          id: string
        }[]
      }
      get_trees_with_location_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          age_estimate: number
          created_at: string
          created_by: string
          crown_spread_m: number
          dbh_cm: number
          height_m: number
          id: string
          latitude: number
          location_description: string
          longitude: number
          notes: string
          ownership: string
          protected_status: boolean
          site_conditions: string
          species_id: string
          tree_number: string
          updated_at: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_sensitive_operation: {
        Args: {
          additional_details?: Json
          operation_type: string
          target_id?: string
          target_table: string
        }
        Returns: undefined
      }
      qtra_arborist_has_assessment_access: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      recommend_species_for_site: {
        Args: {
          max_height_m?: number
          min_height_m?: number
          min_root_space_m3?: number
          min_shade?: unknown
          use_case?: string
          want_compaction?: unknown
          want_drought?: unknown
          want_pollution?: unknown
          want_salt?: unknown
        }
        Returns: {
          height_m: number
          notes: string
          scientific_name: string
          score: number
          species_id: string
          spread_m: number
        }[]
      }
      resolve_life_expectancy_profile: {
        Args: {
          p_climate_zone_id?: string
          p_country_id?: string
          p_species_id: string
        }
        Returns: {
          climate_zone_id: string | null
          context: Database["public"]["Enums"]["life_ctx"]
          country_id: string | null
          created_at: string
          expected_years_max: number | null
          expected_years_min: number | null
          expected_years_typical: number | null
          id: number
          juvenile_years: number | null
          mature_years: number | null
          notes: string | null
          senescent_years: number | null
          source_id: string | null
          species_id: string
          updated_at: string
        }
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "qtra_arborist"
        | "certified_arborist"
        | "user"
        | "pro_user"
        | "traq_arborist"
      assessment_status: "draft" | "completed" | "reviewed" | "archived"
      assessment_type:
        | "basic_ai"
        | "detailed_ai"
        | "qtra_validation"
        | "traq_validation"
        | "dual_validation"
        | "expert_manual"
      colonization_route:
        | "wound"
        | "root_contact"
        | "airborne_spores"
        | "pruning_wound"
        | "insect_vector"
        | "other"
      crown_form:
        | "columnar"
        | "narrow"
        | "oval"
        | "round"
        | "vase"
        | "spreading"
        | "weeping"
        | "irregular"
        | "conical"
        | "pyramidal"
        | "compact_pyramidal"
        | "broad_pyramidal"
        | "narrow_pyramidal"
        | "regular_pyramidal"
      decay_type:
        | "brown_rot"
        | "white_rot"
        | "soft_rot"
        | "stain"
        | "mold"
        | "blue_stain"
        | "unknown"
      defect_category:
        | "root"
        | "buttress"
        | "stem"
        | "union"
        | "branch"
        | "canopy"
        | "wound_decay"
        | "pathogen"
        | "site"
      feature_group:
        | "leaf"
        | "needle"
        | "bud"
        | "bark"
        | "twig"
        | "fruit"
        | "flower"
        | "habit"
        | "site"
        | "season"
        | "other"
      growth_rate:
        | "slow"
        | "moderate"
        | "fast"
        | "medium"
        | "very_slow"
        | "very_fast"
      host_freq: "rare" | "occasional" | "common" | "very_common" | "unknown"
      life_ctx: "GLOBAL" | "COUNTRY" | "ZONE"
      likelihood: "low" | "medium" | "high" | "unknown"
      maintenance_level: "low" | "medium" | "high"
      mitigation_type:
        | "prune"
        | "reduce_load"
        | "support"
        | "monitor"
        | "remove"
        | "treat_pathogen"
        | "site_protect"
        | "target_manage"
      processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "error"
        | "paused"
      risk_rating: "very_low" | "low" | "moderate" | "high" | "very_high"
      suggestion_type:
        | "species"
        | "defect"
        | "fungus"
        | "mitigation"
        | "feature"
        | "other"
      target_type:
        | "people"
        | "property"
        | "infrastructure"
        | "vehicle"
        | "other"
      tissue_pref:
        | "root"
        | "buttress"
        | "basal_stem"
        | "stem"
        | "branch"
        | "sapwood"
        | "heartwood"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "qtra_arborist",
        "certified_arborist",
        "user",
        "pro_user",
        "traq_arborist",
      ],
      assessment_status: ["draft", "completed", "reviewed", "archived"],
      assessment_type: [
        "basic_ai",
        "detailed_ai",
        "qtra_validation",
        "traq_validation",
        "dual_validation",
        "expert_manual",
      ],
      colonization_route: [
        "wound",
        "root_contact",
        "airborne_spores",
        "pruning_wound",
        "insect_vector",
        "other",
      ],
      crown_form: [
        "columnar",
        "narrow",
        "oval",
        "round",
        "vase",
        "spreading",
        "weeping",
        "irregular",
        "conical",
        "pyramidal",
        "compact_pyramidal",
        "broad_pyramidal",
        "narrow_pyramidal",
        "regular_pyramidal",
      ],
      decay_type: [
        "brown_rot",
        "white_rot",
        "soft_rot",
        "stain",
        "mold",
        "blue_stain",
        "unknown",
      ],
      defect_category: [
        "root",
        "buttress",
        "stem",
        "union",
        "branch",
        "canopy",
        "wound_decay",
        "pathogen",
        "site",
      ],
      feature_group: [
        "leaf",
        "needle",
        "bud",
        "bark",
        "twig",
        "fruit",
        "flower",
        "habit",
        "site",
        "season",
        "other",
      ],
      growth_rate: [
        "slow",
        "moderate",
        "fast",
        "medium",
        "very_slow",
        "very_fast",
      ],
      host_freq: ["rare", "occasional", "common", "very_common", "unknown"],
      life_ctx: ["GLOBAL", "COUNTRY", "ZONE"],
      likelihood: ["low", "medium", "high", "unknown"],
      maintenance_level: ["low", "medium", "high"],
      mitigation_type: [
        "prune",
        "reduce_load",
        "support",
        "monitor",
        "remove",
        "treat_pathogen",
        "site_protect",
        "target_manage",
      ],
      processing_status: [
        "pending",
        "processing",
        "completed",
        "error",
        "paused",
      ],
      risk_rating: ["very_low", "low", "moderate", "high", "very_high"],
      suggestion_type: [
        "species",
        "defect",
        "fungus",
        "mitigation",
        "feature",
        "other",
      ],
      target_type: ["people", "property", "infrastructure", "vehicle", "other"],
      tissue_pref: [
        "root",
        "buttress",
        "basal_stem",
        "stem",
        "branch",
        "sapwood",
        "heartwood",
        "other",
      ],
    },
  },
} as const
