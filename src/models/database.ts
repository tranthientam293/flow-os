export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_storage: {
        Row: { app_id: string; key: string; updated_at: string; user_id: string; value: Json }
        Insert: { app_id: string; key: string; updated_at?: string; user_id?: string; value: Json }
        Update: { app_id?: string; key?: string; updated_at?: string; user_id?: string; value?: Json }
        Relationships: []
      }
      installed_apps: {
        Row: { app_id: string; installed_at: string; position: number; user_id: string }
        Insert: { app_id: string; installed_at?: string; position?: number; user_id?: string }
        Update: { app_id?: string; installed_at?: string; position?: number; user_id?: string }
        Relationships: []
      }
      notes: {
        Row: { body: string; created_at: string; id: string; pinned: boolean; title: string; updated_at: string; user_id: string }
        Insert: { body?: string; created_at?: string; id?: string; pinned?: boolean; title?: string; updated_at?: string; user_id?: string }
        Update: { body?: string; created_at?: string; id?: string; pinned?: boolean; title?: string; updated_at?: string; user_id?: string }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; display_name: string | null; id: string; updated_at: string }
        Insert: { avatar_url?: string | null; created_at?: string; display_name?: string | null; id: string; updated_at?: string }
        Update: { avatar_url?: string | null; created_at?: string; display_name?: string | null; id?: string; updated_at?: string }
        Relationships: []
      }
      roster_branches: {
        Row: { address: string | null; archived_at: string | null; center_id: string; code: string; color: string; created_at: string; id: string; name: string; updated_at: string }
        Insert: { address?: string | null; archived_at?: string | null; center_id: string; code: string; color?: string; created_at?: string; id?: string; name: string; updated_at?: string }
        Update: { address?: string | null; archived_at?: string | null; center_id?: string; code?: string; color?: string; created_at?: string; id?: string; name?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "roster_branches_center_id_fkey"; columns: ["center_id"]; isOneToOne: false; referencedRelation: "roster_centers"; referencedColumns: ["id"] },
        ]
      }
      roster_centers: {
        Row: { closes_at: string; created_at: string; created_by: string | null; default_session_min: number; id: string; name: string; opens_at: string; past_edit_days: number; timezone: string; updated_at: string; week_start: number }
        Insert: { closes_at?: string; created_at?: string; created_by?: string | null; default_session_min?: number; id?: string; name: string; opens_at?: string; past_edit_days?: number; timezone?: string; updated_at?: string; week_start?: number }
        Update: { closes_at?: string; created_at?: string; created_by?: string | null; default_session_min?: number; id?: string; name?: string; opens_at?: string; past_edit_days?: number; timezone?: string; updated_at?: string; week_start?: number }
        Relationships: []
      }
      roster_member_branches: {
        Row: { branch_id: string; center_id: string; created_at: string; member_id: string }
        Insert: { branch_id: string; center_id: string; created_at?: string; member_id: string }
        Update: { branch_id?: string; center_id?: string; created_at?: string; member_id?: string }
        Relationships: [
          { foreignKeyName: "roster_member_branches_center_id_branch_id_fkey"; columns: ["center_id", "branch_id"]; isOneToOne: false; referencedRelation: "roster_branches"; referencedColumns: ["center_id", "id"] },
          { foreignKeyName: "roster_member_branches_center_id_member_id_fkey"; columns: ["center_id", "member_id"]; isOneToOne: false; referencedRelation: "roster_members"; referencedColumns: ["center_id", "id"] },
        ]
      }
      roster_member_session_types: {
        Row: { center_id: string; created_at: string; hourly_rate: number | null; member_id: string; session_type_id: string }
        Insert: { center_id: string; created_at?: string; hourly_rate?: number | null; member_id: string; session_type_id: string }
        Update: { center_id?: string; created_at?: string; hourly_rate?: number | null; member_id?: string; session_type_id?: string }
        Relationships: [
          { foreignKeyName: "roster_member_session_types_center_id_member_id_fkey"; columns: ["center_id", "member_id"]; isOneToOne: false; referencedRelation: "roster_members"; referencedColumns: ["center_id", "id"] },
          { foreignKeyName: "roster_member_session_types_center_id_session_type_id_fkey"; columns: ["center_id", "session_type_id"]; isOneToOne: false; referencedRelation: "roster_session_types"; referencedColumns: ["center_id", "id"] },
        ]
      }
      roster_members: {
        Row: { also_trainer: boolean; any_branch: boolean; center_id: string; color: string; created_at: string; deactivated_at: string | null; display_name: string; email: string; id: string; phone: string | null; role: string; status: string; updated_at: string; user_id: string | null }
        Insert: { also_trainer?: boolean; any_branch?: boolean; center_id: string; color?: string; created_at?: string; deactivated_at?: string | null; display_name: string; email: string; id?: string; phone?: string | null; role?: string; status?: string; updated_at?: string; user_id?: string | null }
        Update: { also_trainer?: boolean; any_branch?: boolean; center_id?: string; color?: string; created_at?: string; deactivated_at?: string | null; display_name?: string; email?: string; id?: string; phone?: string | null; role?: string; status?: string; updated_at?: string; user_id?: string | null }
        Relationships: [
          { foreignKeyName: "roster_members_center_id_fkey"; columns: ["center_id"]; isOneToOne: false; referencedRelation: "roster_centers"; referencedColumns: ["id"] },
        ]
      }
      roster_session_events: {
        Row: { action: string; actor_id: string | null; center_id: string; created_at: string; id: string; session_id: string }
        Insert: { action: string; actor_id?: string | null; center_id: string; created_at?: string; id?: string; session_id: string }
        Update: { action?: string; actor_id?: string | null; center_id?: string; created_at?: string; id?: string; session_id?: string }
        Relationships: [
          { foreignKeyName: "roster_session_events_center_id_fkey"; columns: ["center_id"]; isOneToOne: false; referencedRelation: "roster_centers"; referencedColumns: ["id"] },
          { foreignKeyName: "roster_session_events_session_id_fkey"; columns: ["session_id"]; isOneToOne: false; referencedRelation: "roster_sessions"; referencedColumns: ["id"] },
        ]
      }
      roster_session_fees: {
        Row: { amount: number; center_id: string; created_at: string; id: string; label: string; session_id: string }
        Insert: { amount: number; center_id: string; created_at?: string; id?: string; label: string; session_id: string }
        Update: { amount?: number; center_id?: string; created_at?: string; id?: string; label?: string; session_id?: string }
        Relationships: [
          { foreignKeyName: "roster_session_fees_center_id_fkey"; columns: ["center_id"]; isOneToOne: false; referencedRelation: "roster_centers"; referencedColumns: ["id"] },
          { foreignKeyName: "roster_session_fees_session_id_fkey"; columns: ["session_id"]; isOneToOne: false; referencedRelation: "roster_sessions"; referencedColumns: ["id"] },
        ]
      }
      roster_session_types: {
        Row: { center_id: string; created_at: string; default_hourly_rate: number | null; id: string; name: string }
        Insert: { center_id: string; created_at?: string; default_hourly_rate?: number | null; id?: string; name: string }
        Update: { center_id?: string; created_at?: string; default_hourly_rate?: number | null; id?: string; name?: string }
        Relationships: [
          { foreignKeyName: "roster_session_types_center_id_fkey"; columns: ["center_id"]; isOneToOne: false; referencedRelation: "roster_centers"; referencedColumns: ["id"] },
        ]
      }
      roster_sessions: {
        Row: { branch_id: string; center_id: string; completed_at: string | null; created_at: string; created_by: string | null; ends_at: string; id: string; member_id: string; note: string | null; salary: number | null; session_type_id: string | null; starts_at: string; status: string; title: string | null; updated_at: string; updated_by: string | null }
        Insert: { branch_id: string; center_id: string; completed_at?: string | null; created_at?: string; created_by?: string | null; ends_at: string; id?: string; member_id: string; note?: string | null; salary?: number | null; session_type_id?: string | null; starts_at: string; status?: string; title?: string | null; updated_at?: string; updated_by?: string | null }
        Update: { branch_id?: string; center_id?: string; completed_at?: string | null; created_at?: string; created_by?: string | null; ends_at?: string; id?: string; member_id?: string; note?: string | null; salary?: number | null; session_type_id?: string | null; starts_at?: string; status?: string; title?: string | null; updated_at?: string; updated_by?: string | null }
        Relationships: [
          { foreignKeyName: "roster_sessions_center_id_branch_id_fkey"; columns: ["center_id", "branch_id"]; isOneToOne: false; referencedRelation: "roster_branches"; referencedColumns: ["center_id", "id"] },
          { foreignKeyName: "roster_sessions_center_id_fkey"; columns: ["center_id"]; isOneToOne: false; referencedRelation: "roster_centers"; referencedColumns: ["id"] },
          { foreignKeyName: "roster_sessions_center_id_member_id_fkey"; columns: ["center_id", "member_id"]; isOneToOne: false; referencedRelation: "roster_members"; referencedColumns: ["center_id", "id"] },
          { foreignKeyName: "roster_sessions_center_id_session_type_id_fkey"; columns: ["center_id", "session_type_id"]; isOneToOne: false; referencedRelation: "roster_session_types"; referencedColumns: ["center_id", "id"] },
        ]
      }
      tasks: {
        Row: { created_at: string; done: boolean; due_date: string | null; id: string; priority: number; title: string; updated_at: string; user_id: string }
        Insert: { created_at?: string; done?: boolean; due_date?: string | null; id?: string; priority?: number; title: string; updated_at?: string; user_id?: string }
        Update: { created_at?: string; done?: boolean; due_date?: string | null; id?: string; priority?: number; title?: string; updated_at?: string; user_id?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      roster_can_book: { Args: { p_branch_id: string; p_member_id: string }; Returns: boolean }
      roster_claim_invite: { Args: { p_member_id: string }; Returns: string }
      roster_create_center: {
        Args: { p_color: string; p_display_name: string; p_name: string; p_timezone: string }
        Returns: string
      }
      roster_in_current_month: { Args: { p_center_id: string; p_ts: string }; Returns: boolean }
      roster_is_owner: { Args: { p_center_id: string }; Returns: boolean }
      roster_leave_center: { Args: { p_center_id: string }; Returns: undefined }
      roster_member_directory: {
        Args: { p_center_id: string }
        Returns: { also_trainer: boolean; center_id: string; color: string; display_name: string; id: string; role: string; status: string; user_id: string | null }[]
      }
      roster_member_id: { Args: { p_center_id: string }; Returns: string }
      roster_pending_invites: {
        Args: never
        Returns: { center_id: string; center_name: string; display_name: string; member_id: string }[]
      }
      roster_trainer_can_edit: { Args: { p_center_id: string; p_starts_at: string }; Returns: boolean }
      roster_checkout_session: {
        Args: { p_fees?: { label: string; amount: number }[]; p_salary?: number | null; p_session_id: string }
        Returns: undefined
      }
      roster_reopen_session: { Args: { p_session_id: string }; Returns: undefined }
      roster_update_my_profile: {
        Args: { p_center_id: string; p_color: string; p_display_name: string; p_phone: string }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicTables = Database["public"]["Tables"]

export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"]
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"]
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"]
