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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_name: string
          event_type: string
          id: string
          page_path: string | null
          properties: Json | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_name: string
          event_type: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_name?: string
          event_type?: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_page_views: {
        Row: {
          created_at: string
          exited_at: string | null
          id: string
          page_path: string
          page_title: string | null
          referrer: string | null
          scroll_depth_percent: number | null
          session_id: string
          time_on_page_ms: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          exited_at?: string | null
          id?: string
          page_path: string
          page_title?: string | null
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id: string
          time_on_page_ms?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          exited_at?: string | null
          id?: string
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string
          time_on_page_ms?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_performance: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          metric_name: string
          metric_type: string
          page_path: string | null
          properties: Json | null
          resource_url: string | null
          session_id: string
          start_time: string | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          metric_name: string
          metric_type: string
          page_path?: string | null
          properties?: Json | null
          resource_url?: string | null
          session_id: string
          start_time?: string | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          metric_name?: string
          metric_type?: string
          page_path?: string | null
          properties?: Json | null
          resource_url?: string | null
          session_id?: string
          start_time?: string | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_product_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          price: number | null
          product_id: string
          properties: Json | null
          quantity: number | null
          session_id: string
          source_page: string | null
          source_section: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          price?: number | null
          product_id: string
          properties?: Json | null
          quantity?: number | null
          session_id: string
          source_page?: string | null
          source_section?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          price?: number | null
          product_id?: string
          properties?: Json | null
          quantity?: number | null
          session_id?: string
          source_page?: string | null
          source_section?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      analytics_search_events: {
        Row: {
          clicked_result_id: string | null
          clicked_result_position: number | null
          created_at: string
          filters_applied: Json | null
          id: string
          query: string
          results_count: number | null
          search_type: string | null
          session_id: string
          time_to_click_ms: number | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          clicked_result_position?: number | null
          created_at?: string
          filters_applied?: Json | null
          id?: string
          query: string
          results_count?: number | null
          search_type?: string | null
          session_id: string
          time_to_click_ms?: number | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          clicked_result_position?: number | null
          created_at?: string
          filters_applied?: Json | null
          id?: string
          query?: string
          results_count?: number | null
          search_type?: string | null
          session_id?: string
          time_to_click_ms?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          device_type: string | null
          events_count: number | null
          id: string
          is_bounce: boolean | null
          landing_page: string | null
          last_activity_at: string
          os: string | null
          page_views_count: number | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          started_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          device_type?: string | null
          events_count?: number | null
          id: string
          is_bounce?: boolean | null
          landing_page?: string | null
          last_activity_at?: string
          os?: string | null
          page_views_count?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          started_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          device_type?: string | null
          events_count?: number | null
          id?: string
          is_bounce?: boolean | null
          landing_page?: string | null
          last_activity_at?: string
          os?: string | null
          page_views_count?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          started_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      list_items: {
        Row: {
          added_at: string
          id: string
          list_id: string
          product_id: string
          variant_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          list_id: string
          product_id: string
          variant_id: string
        }
        Update: {
          added_at?: string
          id?: string
          list_id?: string
          product_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          id: string
          is_wishlist: boolean
          name: string
          share_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_wishlist?: boolean
          name: string
          share_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_wishlist?: boolean
          name?: string
          share_token?: string | null
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
