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
      cart_sessions: {
        Row: {
          ab_variant_id: string | null
          abandoned: boolean | null
          abandoned_at: string | null
          cart_items: Json
          cart_total: number
          checkout_completed: boolean | null
          checkout_started: boolean | null
          created_at: string
          id: string
          recovered: boolean | null
          recovered_at: string | null
          recovery_email_2_sent_at: string | null
          recovery_email_sent_at: string | null
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ab_variant_id?: string | null
          abandoned?: boolean | null
          abandoned_at?: string | null
          cart_items?: Json
          cart_total?: number
          checkout_completed?: boolean | null
          checkout_started?: boolean | null
          created_at?: string
          id?: string
          recovered?: boolean | null
          recovered_at?: string | null
          recovery_email_2_sent_at?: string | null
          recovery_email_sent_at?: string | null
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ab_variant_id?: string | null
          abandoned?: boolean | null
          abandoned_at?: string | null
          cart_items?: Json
          cart_total?: number
          checkout_completed?: boolean | null
          checkout_started?: boolean | null
          created_at?: string
          id?: string
          recovered?: boolean | null
          recovered_at?: string | null
          recovery_email_2_sent_at?: string | null
          recovery_email_sent_at?: string | null
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_sessions_ab_variant_id_fkey"
            columns: ["ab_variant_id"]
            isOneToOne: false
            referencedRelation: "email_ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_test_variants: {
        Row: {
          conversions: number
          created_at: string
          discount_code: string
          discount_percent: number
          emails_clicked: number
          emails_opened: number
          emails_sent: number
          id: string
          name: string
          subject_line: string
          test_id: string
          weight: number
        }
        Insert: {
          conversions?: number
          created_at?: string
          discount_code: string
          discount_percent?: number
          emails_clicked?: number
          emails_opened?: number
          emails_sent?: number
          id?: string
          name: string
          subject_line: string
          test_id: string
          weight?: number
        }
        Update: {
          conversions?: number
          created_at?: string
          discount_code?: string
          discount_percent?: number
          emails_clicked?: number
          emails_opened?: number
          emails_sent?: number
          id?: string
          name?: string
          subject_line?: string
          test_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_test_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "email_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_tests: {
        Row: {
          created_at: string
          email_type: string
          id: string
          name: string
          status: Database["public"]["Enums"]["ab_test_status"]
          updated_at: string
          winning_variant_id: string | null
        }
        Insert: {
          created_at?: string
          email_type?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["ab_test_status"]
          updated_at?: string
          winning_variant_id?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["ab_test_status"]
          updated_at?: string
          winning_variant_id?: string | null
        }
        Relationships: []
      }
      email_tracking_events: {
        Row: {
          cart_session_id: string | null
          created_at: string
          email_id: string
          event_type: string
          id: string
          properties: Json | null
          recipient_email: string | null
        }
        Insert: {
          cart_session_id?: string | null
          created_at?: string
          email_id: string
          event_type: string
          id?: string
          properties?: Json | null
          recipient_email?: string | null
        }
        Update: {
          cart_session_id?: string | null
          created_at?: string
          email_id?: string
          event_type?: string
          id?: string
          properties?: Json | null
          recipient_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_events_cart_session_id_fkey"
            columns: ["cart_session_id"]
            isOneToOne: false
            referencedRelation: "cart_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      offer_experiment_assignments: {
        Row: {
          assigned_at: string
          experiment_id: string
          id: string
          session_id: string | null
          user_id: string | null
          variant_id: string
        }
        Insert: {
          assigned_at?: string
          experiment_id: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          variant_id: string
        }
        Update: {
          assigned_at?: string
          experiment_id?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_experiment_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "offer_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_experiment_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "offer_experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_experiment_conversions: {
        Row: {
          conversion_type: string
          conversion_value: number | null
          converted_at: string
          experiment_id: string
          id: string
          order_id: string | null
          properties: Json | null
          session_id: string | null
          user_id: string | null
          variant_id: string
        }
        Insert: {
          conversion_type: string
          conversion_value?: number | null
          converted_at?: string
          experiment_id: string
          id?: string
          order_id?: string | null
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
          variant_id: string
        }
        Update: {
          conversion_type?: string
          conversion_value?: number | null
          converted_at?: string
          experiment_id?: string
          id?: string
          order_id?: string | null
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_experiment_conversions_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "offer_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_experiment_conversions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "offer_experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_experiment_exposures: {
        Row: {
          context: Json | null
          experiment_id: string
          exposed_at: string
          id: string
          offer_id: string | null
          session_id: string | null
          user_id: string | null
          variant_id: string
        }
        Insert: {
          context?: Json | null
          experiment_id: string
          exposed_at?: string
          id?: string
          offer_id?: string | null
          session_id?: string | null
          user_id?: string | null
          variant_id: string
        }
        Update: {
          context?: Json | null
          experiment_id?: string
          exposed_at?: string
          id?: string
          offer_id?: string | null
          session_id?: string | null
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_experiment_exposures_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "offer_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_experiment_exposures_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "offer_experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_experiment_variants: {
        Row: {
          created_at: string
          description: string | null
          experiment_id: string
          id: string
          is_control: boolean
          name: string
          offer_ids: string[]
          weight: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          experiment_id: string
          id?: string
          is_control?: boolean
          name: string
          offer_ids?: string[]
          weight?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          experiment_id?: string
          id?: string
          is_control?: boolean
          name?: string
          offer_ids?: string[]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_experiment_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "offer_experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_experiments: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["offer_experiment_status"]
          traffic_percent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_experiment_status"]
          traffic_percent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_experiment_status"]
          traffic_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      offer_versions: {
        Row: {
          benefit_config: Json
          caps_config: Json | null
          created_at: string
          created_by: string | null
          effective_from: string
          effective_until: string | null
          id: string
          offer_id: string
          qualifying_filters: Json | null
          version_number: number
        }
        Insert: {
          benefit_config?: Json
          caps_config?: Json | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          offer_id: string
          qualifying_filters?: Json | null
          version_number?: number
        }
        Update: {
          benefit_config?: Json
          caps_config?: Json | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          offer_id?: string
          qualifying_filters?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_versions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          campaign_id: string | null
          channels: string[] | null
          created_at: string
          current_version_id: string | null
          description: string | null
          funded_by: Database["public"]["Enums"]["funded_by"]
          id: string
          marketing_text: string | null
          max_uses_per_user: number | null
          max_uses_total: number | null
          name: string
          offer_scope: Database["public"]["Enums"]["offer_scope"]
          offer_type: Database["public"]["Enums"]["offer_type"]
          order_types: string[] | null
          priority: number
          regions: string[] | null
          stack_group: string | null
          stacking_policy: Database["public"]["Enums"]["stacking_policy"]
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          campaign_id?: string | null
          channels?: string[] | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          funded_by?: Database["public"]["Enums"]["funded_by"]
          id?: string
          marketing_text?: string | null
          max_uses_per_user?: number | null
          max_uses_total?: number | null
          name: string
          offer_scope?: Database["public"]["Enums"]["offer_scope"]
          offer_type: Database["public"]["Enums"]["offer_type"]
          order_types?: string[] | null
          priority?: number
          regions?: string[] | null
          stack_group?: string | null
          stacking_policy?: Database["public"]["Enums"]["stacking_policy"]
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          campaign_id?: string | null
          channels?: string[] | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          funded_by?: Database["public"]["Enums"]["funded_by"]
          id?: string
          marketing_text?: string | null
          max_uses_per_user?: number | null
          max_uses_total?: number | null
          name?: string
          offer_scope?: Database["public"]["Enums"]["offer_scope"]
          offer_type?: Database["public"]["Enums"]["offer_type"]
          order_types?: string[] | null
          priority?: number
          regions?: string[] | null
          stack_group?: string | null
          stacking_policy?: Database["public"]["Enums"]["stacking_policy"]
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "offer_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          properties: Json | null
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          properties?: Json | null
          quantity?: number
          total_price: number
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          properties?: Json | null
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          checkout_completed_at: string | null
          checkout_started_at: string | null
          created_at: string
          delivered_at: string | null
          discount_amount: number
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          properties: Json | null
          refunded_at: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_cost: number
          shipping_email: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_pincode: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          checkout_completed_at?: string | null
          checkout_started_at?: string | null
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          properties?: Json | null
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number
          shipping_email?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_pincode?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          checkout_completed_at?: string | null
          checkout_started_at?: string | null
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          properties?: Json | null
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number
          shipping_email?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_pincode?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recovery_email_settings: {
        Row: {
          abandonment_threshold_minutes: number
          created_at: string
          enabled: boolean
          first_email_discount_code: string
          first_email_discount_percent: number
          id: string
          second_email_delay_hours: number
          second_email_discount_code: string
          second_email_discount_percent: number
          updated_at: string
        }
        Insert: {
          abandonment_threshold_minutes?: number
          created_at?: string
          enabled?: boolean
          first_email_discount_code?: string
          first_email_discount_percent?: number
          id?: string
          second_email_delay_hours?: number
          second_email_discount_code?: string
          second_email_discount_percent?: number
          updated_at?: string
        }
        Update: {
          abandonment_threshold_minutes?: number
          created_at?: string
          enabled?: boolean
          first_email_discount_code?: string
          first_email_discount_percent?: number
          id?: string
          second_email_delay_hours?: number
          second_email_discount_code?: string
          second_email_discount_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      rule_groups: {
        Row: {
          created_at: string
          id: string
          logic: Database["public"]["Enums"]["rule_group_logic"]
          offer_version_id: string
          parent_group_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          logic?: Database["public"]["Enums"]["rule_group_logic"]
          offer_version_id: string
          parent_group_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          logic?: Database["public"]["Enums"]["rule_group_logic"]
          offer_version_id?: string
          parent_group_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "rule_groups_offer_version_id_fkey"
            columns: ["offer_version_id"]
            isOneToOne: false
            referencedRelation: "offer_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_groups_parent_group_id_fkey"
            columns: ["parent_group_id"]
            isOneToOne: false
            referencedRelation: "rule_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          created_at: string
          field_path: string
          id: string
          operator: Database["public"]["Enums"]["rule_operator"]
          rule_group_id: string
          sort_order: number
          value: Json
        }
        Insert: {
          created_at?: string
          field_path: string
          id?: string
          operator: Database["public"]["Enums"]["rule_operator"]
          rule_group_id: string
          sort_order?: number
          value: Json
        }
        Update: {
          created_at?: string
          field_path?: string
          id?: string
          operator?: Database["public"]["Enums"]["rule_operator"]
          rule_group_id?: string
          sort_order?: number
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rules_rule_group_id_fkey"
            columns: ["rule_group_id"]
            isOneToOne: false
            referencedRelation: "rule_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ab_test_status: "active" | "paused" | "completed"
      funded_by: "platform" | "brand"
      offer_experiment_status:
        | "draft"
        | "running"
        | "paused"
        | "completed"
        | "archived"
      offer_scope: "item" | "category" | "brand" | "cart" | "user"
      offer_status: "draft" | "active" | "paused" | "expired" | "archived"
      offer_type:
        | "percent_discount"
        | "flat_discount"
        | "free_item"
        | "tiered_discount"
        | "price_override"
        | "cashback"
        | "loyalty_points"
        | "buy_x_get_y"
        | "mix_and_match"
        | "cheapest_item"
        | "free_gift"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      rule_group_logic: "all" | "any"
      rule_operator:
        | "eq"
        | "neq"
        | "gt"
        | "gte"
        | "lt"
        | "lte"
        | "in"
        | "not_in"
        | "exists"
        | "between"
        | "matches"
      stacking_policy: "stackable" | "exclusive" | "stack_group"
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
      ab_test_status: ["active", "paused", "completed"],
      funded_by: ["platform", "brand"],
      offer_experiment_status: [
        "draft",
        "running",
        "paused",
        "completed",
        "archived",
      ],
      offer_scope: ["item", "category", "brand", "cart", "user"],
      offer_status: ["draft", "active", "paused", "expired", "archived"],
      offer_type: [
        "percent_discount",
        "flat_discount",
        "free_item",
        "tiered_discount",
        "price_override",
        "cashback",
        "loyalty_points",
        "buy_x_get_y",
        "mix_and_match",
        "cheapest_item",
        "free_gift",
      ],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      rule_group_logic: ["all", "any"],
      rule_operator: [
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "in",
        "not_in",
        "exists",
        "between",
        "matches",
      ],
      stacking_policy: ["stackable", "exclusive", "stack_group"],
    },
  },
} as const
