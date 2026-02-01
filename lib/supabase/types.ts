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
      profiles: {
        Row: {
          id: string
          role: 'customer' | 'agency_staff' | 'admin'
          full_name: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'customer' | 'agency_staff' | 'admin'
          full_name?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'customer' | 'agency_staff' | 'admin'
          full_name?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_sessions: {
        Row: {
          id: string
          session_token: string
          customer_phone: string | null
          customer_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_token: string
          customer_phone?: string | null
          customer_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_token?: string
          customer_phone?: string | null
          customer_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          session_id: string
          status: 'active' | 'ended'
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          status?: 'active' | 'ended'
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          status?: 'active' | 'ended'
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          content_masked: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          content_masked?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          content_masked?: string | null
          created_at?: string
        }
      }
      conversation_summaries: {
        Row: {
          id: string
          conversation_id: string
          summary: string
          category: string | null
          keywords: string[] | null
          sentiment: 'positive' | 'neutral' | 'negative' | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          summary: string
          category?: string | null
          keywords?: string[] | null
          sentiment?: 'positive' | 'neutral' | 'negative' | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          summary?: string
          category?: string | null
          keywords?: string[] | null
          sentiment?: 'positive' | 'neutral' | 'negative' | null
          created_at?: string
        }
      }
      purchase_predictions: {
        Row: {
          id: string
          session_id: string
          prediction_type: string
          probability_score: number
          confidence: 'low' | 'medium' | 'high' | null
          reasoning: string | null
          recommended_actions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          prediction_type: string
          probability_score: number
          confidence?: 'low' | 'medium' | 'high' | null
          reasoning?: string | null
          recommended_actions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          prediction_type?: string
          probability_score?: number
          confidence?: 'low' | 'medium' | 'high' | null
          reasoning?: string | null
          recommended_actions?: Json | null
          created_at?: string
        }
      }
      knowledge_base: {
        Row: {
          id: string
          content: string
          embedding: number[] | null
          document_type: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          embedding?: number[] | null
          document_type?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          embedding?: number[] | null
          document_type?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
  }
}
