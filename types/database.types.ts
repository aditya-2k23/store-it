export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          created_at: string;
          file_id: string | null;
          folder_id: string | null;
          id: string;
          metadata: Json | null;
          user_id: string | null;
          workspace_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          file_id?: string | null;
          folder_id?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
          workspace_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          file_id?: string | null;
          folder_id?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_metadata: {
        Row: {
          created_at: string;
          embedding: string | null;
          embedding_model: string | null;
          error_message: string | null;
          file_id: string;
          id: string;
          processed_at: string | null;
          processing_status: string;
          summary: string | null;
          tags: string[] | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          embedding?: string | null;
          embedding_model?: string | null;
          error_message?: string | null;
          file_id: string;
          id?: string;
          processed_at?: string | null;
          processing_status?: string;
          summary?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          embedding?: string | null;
          embedding_model?: string | null;
          error_message?: string | null;
          file_id?: string;
          id?: string;
          processed_at?: string | null;
          processing_status?: string;
          summary?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_metadata_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: true;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      direct_file_shares: {
        Row: {
          created_at: string;
          file_id: string;
          id: string;
          permission: string;
          shared_by: string;
          shared_with_email: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          file_id: string;
          id?: string;
          permission: string;
          shared_by: string;
          shared_with_email: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          file_id?: string;
          id?: string;
          permission?: string;
          shared_by?: string;
          shared_with_email?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "direct_file_shares_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "direct_file_shares_shared_by_fkey";
            columns: ["shared_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_files: {
        Row: {
          created_at: string;
          file_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          file_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          file_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_files_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorite_files_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      file_versions: {
        Row: {
          checksum: string | null;
          created_at: string;
          extension: string | null;
          file_id: string;
          id: string;
          mime_type: string | null;
          size: number;
          storage_key: string;
          uploaded_by: string | null;
          version_number: number;
        };
        Insert: {
          checksum?: string | null;
          created_at?: string;
          extension?: string | null;
          file_id: string;
          id?: string;
          mime_type?: string | null;
          size: number;
          storage_key: string;
          uploaded_by?: string | null;
          version_number: number;
        };
        Update: {
          checksum?: string | null;
          created_at?: string;
          extension?: string | null;
          file_id?: string;
          id?: string;
          mime_type?: string | null;
          size?: number;
          storage_key?: string;
          uploaded_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "file_versions_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "file_versions_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          extension: string | null;
          folder_id: string | null;
          id: string;
          is_trashed: boolean;
          last_accessed_at: string | null;
          mime_type: string | null;
          name: string;
          original_name: string;
          owner_id: string | null;
          preview_status: string;
          search_tsv: unknown;
          size: number;
          storage_key: string;
          thumbnail_key: string | null;
          trashed_at: string | null;
          type: string;
          updated_at: string;
          virus_scan_status: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          extension?: string | null;
          folder_id?: string | null;
          id?: string;
          is_trashed?: boolean;
          last_accessed_at?: string | null;
          mime_type?: string | null;
          name: string;
          original_name: string;
          owner_id?: string | null;
          preview_status?: string;
          search_tsv?: unknown;
          size: number;
          storage_key: string;
          thumbnail_key?: string | null;
          trashed_at?: string | null;
          type: string;
          updated_at?: string;
          virus_scan_status?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          extension?: string | null;
          folder_id?: string | null;
          id?: string;
          is_trashed?: boolean;
          last_accessed_at?: string | null;
          mime_type?: string | null;
          name?: string;
          original_name?: string;
          owner_id?: string | null;
          preview_status?: string;
          search_tsv?: unknown;
          size?: number;
          storage_key?: string;
          thumbnail_key?: string | null;
          trashed_at?: string | null;
          type?: string;
          updated_at?: string;
          virus_scan_status?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      folders: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          depth: number;
          id: string;
          is_trashed: boolean;
          name: string;
          parent_folder_id: string | null;
          path: string | null;
          search_tsv: unknown;
          trashed_at: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          depth?: number;
          id?: string;
          is_trashed?: boolean;
          name: string;
          parent_folder_id?: string | null;
          path?: string | null;
          search_tsv?: unknown;
          trashed_at?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          depth?: number;
          id?: string;
          is_trashed?: boolean;
          name?: string;
          parent_folder_id?: string | null;
          path?: string | null;
          search_tsv?: unknown;
          trashed_at?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "folders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "folders_parent_folder_id_fkey";
            columns: ["parent_folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "folders_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      public_file_links: {
        Row: {
          allow_download: boolean;
          created_at: string;
          expires_at: string | null;
          file_id: string;
          id: string;
          password_hash: string | null;
          token: string;
          updated_at: string;
        };
        Insert: {
          allow_download?: boolean;
          created_at?: string;
          expires_at?: string | null;
          file_id: string;
          id?: string;
          password_hash?: string | null;
          token: string;
          updated_at?: string;
        };
        Update: {
          allow_download?: boolean;
          created_at?: string;
          expires_at?: string | null;
          file_id?: string;
          id?: string;
          password_hash?: string | null;
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_file_links_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          clerk_id: string;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          plan: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          clerk_id: string;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id?: string;
          plan?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          clerk_id?: string;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          plan?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          joined_at: string;
          role: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          id?: string;
          joined_at?: string;
          role: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          clerk_org_id: string | null;
          created_at: string;
          id: string;
          name: string;
          owner_id: string | null;
          storage_limit: number;
          storage_used: number;
          type: string;
          updated_at: string;
        };
        Insert: {
          clerk_org_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          owner_id?: string | null;
          storage_limit?: number;
          storage_used?: number;
          type: string;
          updated_at?: string;
        };
        Update: {
          clerk_org_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string | null;
          storage_limit?: number;
          storage_used?: number;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
