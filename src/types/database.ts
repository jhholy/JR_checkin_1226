export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          check_in_date: string
          check_in_time: string | null
          class_type: Database["public"]["Enums"]["class_type"]
          created_at: string | null
          id: string
          is_extra: boolean | null
          member_id: string | null
        }
        Insert: {
          check_in_date?: string
          check_in_time?: string | null
          class_type: Database["public"]["Enums"]["class_type"]
          created_at?: string | null
          id?: string
          is_extra?: boolean | null
          member_id?: string | null
        }
        Update: {
          check_in_date?: string
          check_in_time?: string | null
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string | null
          id?: string
          is_extra?: boolean | null
          member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedule: {
        Row: {
          class_type: Database["public"]["Enums"]["class_type"]
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          class_type: Database["public"]["Enums"]["class_type"]
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      debug_logs: {
        Row: {
          details: Json | null
          function_name: string
          id: number
          member_id: string | null
          message: string
          timestamp: string | null
        }
        Insert: {
          details?: Json | null
          function_name: string
          id?: number
          member_id?: string | null
          message: string
          timestamp?: string | null
        }
        Update: {
          details?: Json | null
          function_name?: string
          id?: number
          member_id?: string | null
          message?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          created_at: string | null
          daily_check_ins: number | null
          email: string | null
          extra_check_ins: number
          id: string
          is_new_member: boolean | null
          last_check_in_date: string | null
          membership: Database["public"]["Enums"]["membership_type"] | null
          membership_expiry: string | null
          name: string
          phone: string | null
          remaining_classes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_check_ins?: number | null
          email?: string | null
          extra_check_ins?: number
          id?: string
          is_new_member?: boolean | null
          last_check_in_date?: string | null
          membership?: Database["public"]["Enums"]["membership_type"] | null
          membership_expiry?: string | null
          name: string
          phone?: string | null
          remaining_classes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_check_ins?: number | null
          email?: string | null
          extra_check_ins?: number
          id?: string
          is_new_member?: boolean | null
          last_check_in_date?: string | null
          membership?: Database["public"]["Enums"]["membership_type"] | null
          membership_expiry?: string | null
          name?: string
          phone?: string | null
          remaining_classes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_new_member: {
        Args: {
          p_name: string
          p_email: string
          p_class_type: Database["public"]["Enums"]["class_type"]
        }
        Returns: Json
      }
      find_member_for_checkin: {
        Args: {
          p_name: string
          p_email?: string
        }
        Returns: {
          member_id: string
          is_new: boolean
          needs_email: boolean
        }[]
      }
      merge_new_members: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      register_new_member: {
        Args: {
          p_name: string
          p_email: string
          p_class_type: Database["public"]["Enums"]["class_type"]
        }
        Returns: Json
      }
      search_members: {
        Args: {
          search_query: string
        }
        Returns: {
          id: string
          name: string
          email: string
          phone: string
          membership: Database["public"]["Enums"]["membership_type"]
          remaining_classes: number
          membership_expiry: string
          extra_check_ins: number
          is_new_member: boolean
          created_at: string
          updated_at: string
          daily_check_ins: number
          last_check_in_date: string
        }[]
      }
      validate_member_name: {
        Args: {
          p_name: string
          p_email?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      class_type: "morning" | "evening"
      membership_type:
        | "single_class"
        | "two_classes"
        | "ten_classes"
        | "single_monthly"
        | "double_monthly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export interface NewMemberFormData {
    name: string;
    email: string;
    classType: Database['public']['Enums']['class_type'];
}

export interface DatabaseError {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
}

export interface MemberSearchResult {
    member_id: string | null;
    is_new: boolean;
    needs_email: boolean;
}

export interface RegisterResult {
    success: boolean;
    message: string;
}

