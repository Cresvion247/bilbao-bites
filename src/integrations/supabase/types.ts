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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_en: string
          name_es: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_es: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_es?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string
          delivery_zone_id: string | null
          id: string
          label: string | null
          postcode: string | null
          user_id: string
        }
        Insert: {
          address_line: string
          city?: string
          created_at?: string
          delivery_zone_id?: string | null
          id?: string
          label?: string | null
          postcode?: string | null
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string
          delivery_zone_id?: string | null
          id?: string
          label?: string | null
          postcode?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string
          delivery_fee: number
          estimated_minutes: number
          id: string
          is_enabled: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          estimated_minutes?: number
          id?: string
          is_enabled?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          estimated_minutes?: number
          id?: string
          is_enabled?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      modifier_groups: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          max_select: number
          min_select: number
          name_en: string
          name_es: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_select?: number
          min_select?: number
          name_en: string
          name_es: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_select?: number
          min_select?: number
          name_en?: string
          name_es?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      modifiers: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_available: boolean
          is_default: boolean
          linked_product_id: string | null
          name_en: string
          name_es: string
          price_delta: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_available?: boolean
          is_default?: boolean
          linked_product_id?: string | null
          name_en: string
          name_es: string
          price_delta?: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_available?: boolean
          is_default?: boolean
          linked_product_id?: string | null
          name_en?: string
          name_es?: string
          price_delta?: number
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifiers_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_contacts: {
        Row: {
          address_line: string | null
          city: string
          created_at: string
          customer_name: string
          email: string
          order_id: string
          phone: string
          postcode: string | null
          user_id: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string
          created_at?: string
          customer_name: string
          email: string
          order_id: string
          phone: string
          postcode?: string | null
          user_id?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string
          created_at?: string
          customer_name?: string
          email?: string
          order_id?: string
          phone?: string
          postcode?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_contacts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          modifiers: Json
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          special_instructions: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          modifiers?: Json
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          special_instructions?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          modifiers?: Json
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          special_instructions?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_fee: number
          delivery_zone_id: string | null
          fulfilment: Database["public"]["Enums"]["fulfilment_type"]
          id: string
          notes: string | null
          order_number: number
          payment_provider: string
          payment_reference: string | null
          payment_status: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          delivery_zone_id?: string | null
          fulfilment?: Database["public"]["Enums"]["fulfilment_type"]
          id?: string
          notes?: string | null
          order_number?: number
          payment_provider?: string
          payment_reference?: string | null
          payment_status?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          delivery_zone_id?: string | null
          fulfilment?: Database["public"]["Enums"]["fulfilment_type"]
          id?: string
          notes?: string | null
          order_number?: number
          payment_provider?: string
          payment_reference?: string | null
          payment_status?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifier_groups: {
        Row: {
          group_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          group_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          group_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description_en: string | null
          description_es: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_curry: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          name_en: string
          name_es: string
          price: number
          slug: string
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description_en?: string | null
          description_es?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_curry?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          name_en: string
          name_es: string
          price: number
          slug: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description_en?: string | null
          description_es?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_curry?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          name_en?: string
          name_es?: string
          price?: number
          slug?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_settings: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          opening_hours: Json
          payment_provider: string
          restaurant_name: string
          singleton: boolean
          tax_rate: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          opening_hours?: Json
          payment_provider?: string
          restaurant_name?: string
          singleton?: boolean
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          opening_hours?: Json
          payment_provider?: string
          restaurant_name?: string
          singleton?: boolean
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "kitchen"
      fulfilment_type: "delivery" | "collection"
      order_status:
        | "new"
        | "accepted"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled"
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
      app_role: ["admin", "kitchen"],
      fulfilment_type: ["delivery", "collection"],
      order_status: [
        "new",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
