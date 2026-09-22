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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      event_timeline: {
        Row: {
          created_at: string
          event_id: string
          id: string
          label: string
          occurred_at: string
          tone: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          label: string
          occurred_at?: string
          tone?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          label?: string
          occurred_at?: string
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_timeline_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          city: string
          created_at: string
          description: string
          first_reported_at: string
          freshness_score: number
          id: string
          independent_sources: number
          last_updated_at: string
          latitude: number
          location_name: string
          longitude: number
          share_count: number
          title: string
          truth_state: Database["public"]["Enums"]["truth_state"]
        }
        Insert: {
          category?: string
          city: string
          created_at?: string
          description?: string
          first_reported_at?: string
          freshness_score?: number
          id?: string
          independent_sources?: number
          last_updated_at?: string
          latitude: number
          location_name: string
          longitude: number
          share_count?: number
          title: string
          truth_state?: Database["public"]["Enums"]["truth_state"]
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          description?: string
          first_reported_at?: string
          freshness_score?: number
          id?: string
          independent_sources?: number
          last_updated_at?: string
          latitude?: number
          location_name?: string
          longitude?: number
          share_count?: number
          title?: string
          truth_state?: Database["public"]["Enums"]["truth_state"]
        }
        Relationships: []
      }
      evidence: {
        Row: {
          analysis: string
          contradicts_claim: boolean
          created_at: string
          event_id: string
          excluded: boolean
          exclusion_reason: string | null
          id: string
          independence_signals: Json
          kind: Database["public"]["Enums"]["evidence_kind"]
          report_id: string | null
          source_id: string | null
          supports_claim: boolean
        }
        Insert: {
          analysis?: string
          contradicts_claim?: boolean
          created_at?: string
          event_id: string
          excluded?: boolean
          exclusion_reason?: string | null
          id?: string
          independence_signals?: Json
          kind?: Database["public"]["Enums"]["evidence_kind"]
          report_id?: string | null
          source_id?: string | null
          supports_claim?: boolean
        }
        Update: {
          analysis?: string
          contradicts_claim?: boolean
          created_at?: string
          event_id?: string
          excluded?: boolean
          exclusion_reason?: string | null
          id?: string
          independence_signals?: Json
          kind?: Database["public"]["Enums"]["evidence_kind"]
          report_id?: string | null
          source_id?: string | null
          supports_claim?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "evidence_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_users: {
        Row: {
          city: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          ai_analysis: Json
          channel: string
          content: string
          created_at: string
          event_id: string | null
          extracted_claim: string | null
          id: string
          is_duplicate_of: string | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          media: Json
          source_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json
          channel?: string
          content: string
          created_at?: string
          event_id?: string | null
          extracted_claim?: string | null
          id?: string
          is_duplicate_of?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          media?: Json
          source_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json
          channel?: string
          content?: string
          created_at?: string
          event_id?: string | null
          extracted_claim?: string | null
          id?: string
          is_duplicate_of?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          media?: Json
          source_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_is_duplicate_of_fkey"
            columns: ["is_duplicate_of"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pulse_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          history: Json
          id: string
          kind: Database["public"]["Enums"]["source_kind"]
          label: string
          reliability: number
          verification_signals: Json
        }
        Insert: {
          created_at?: string
          history?: Json
          id?: string
          kind?: Database["public"]["Enums"]["source_kind"]
          label: string
          reliability?: number
          verification_signals?: Json
        }
        Update: {
          created_at?: string
          history?: Json
          id?: string
          kind?: Database["public"]["Enums"]["source_kind"]
          label?: string
          reliability?: number
          verification_signals?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      evidence_kind:
        | "text_report"
        | "image"
        | "video"
        | "audio"
        | "official_statement"
        | "media_report"
        | "sensor"
      source_kind:
        | "anonymous"
        | "eyewitness"
        | "official"
        | "broadcast"
        | "social"
        | "unknown"
      truth_state:
        | "early_signal"
        | "corroborated"
        | "confirmed"
        | "disputed"
        | "false"
        | "expired"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      evidence_kind: [
        "text_report",
        "image",
        "video",
        "audio",
        "official_statement",
        "media_report",
        "sensor",
      ],
      source_kind: [
        "anonymous",
        "eyewitness",
        "official",
        "broadcast",
        "social",
        "unknown",
      ],
      truth_state: [
        "early_signal",
        "corroborated",
        "confirmed",
        "disputed",
        "false",
        "expired",
      ],
    },
  },
} as const
