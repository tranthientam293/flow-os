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
      tasks: {
        Row: { created_at: string; done: boolean; due_date: string | null; id: string; priority: number; title: string; updated_at: string; user_id: string }
        Insert: { created_at?: string; done?: boolean; due_date?: string | null; id?: string; priority?: number; title: string; updated_at?: string; user_id?: string }
        Update: { created_at?: string; done?: boolean; due_date?: string | null; id?: string; priority?: number; title?: string; updated_at?: string; user_id?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicTables = Database["public"]["Tables"]

export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"]
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"]
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"]
