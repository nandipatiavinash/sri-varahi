// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate authoritatively with: npm run db:types (requires supabase CLI + running project).
export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          currency: string;
          edit_window_hours: number;
          timezone: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['businesses']['Row']>;
        Update: Partial<Database['public']['Tables']['businesses']['Row']>;
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          mobile: string | null;
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['employees']['Row']>;
        Update: Partial<Database['public']['Tables']['employees']['Row']>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          category: string;
          default_purchase_price: number;
          default_selling_price: number;
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['products']['Row']>;
        Update: Partial<Database['public']['Tables']['products']['Row']>;
        Relationships: [];
      };
      bills: {
        Row: {
          id: string;
          business_id: string;
          bill_number: string;
          bill_date: string;
          customer_name: string;
          customer_mobile: string | null;
          employee_id: string | null;
          subtotal: number;
          discount: number;
          grand_total: number;
          gross_profit: number;
          paid_amount: number;
          balance_due: number;
          status: 'paid' | 'partial' | 'credit' | 'voided';
          notes: string | null;
          voided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['bills']['Row']>;
        Update: Partial<Database['public']['Tables']['bills']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'bills_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          }
        ];
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          quantity: number;
          purchase_price: number;
          selling_price: number;
          line_profit: number;
          line_total: number;
        };
        Insert: Partial<Database['public']['Tables']['bill_items']['Row']>;
        Update: Partial<Database['public']['Tables']['bill_items']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'bill_items_bill_id_fkey';
            columns: ['bill_id'];
            isOneToOne: false;
            referencedRelation: 'bills';
            referencedColumns: ['id'];
          }
        ];
      };
      payment_splits: {
        Row: {
          id: string;
          bill_id: string;
          method: 'cash' | 'upi' | 'bank' | 'credit' | 'advance';
          amount: number;
        };
        Insert: Partial<Database['public']['Tables']['payment_splits']['Row']>;
        Update: Partial<Database['public']['Tables']['payment_splits']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'payment_splits_bill_id_fkey';
            columns: ['bill_id'];
            isOneToOne: false;
            referencedRelation: 'bills';
            referencedColumns: ['id'];
          }
        ];
      };
      advance_orders: {
        Row: {
          id: string;
          business_id: string;
          customer_name: string;
          customer_mobile: string | null;
          advance_amount: number;
          expected_delivery_date: string | null;
          notes: string | null;
          status: 'pending' | 'completed' | 'cancelled';
          converted_bill_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['advance_orders']['Row']>;
        Update: Partial<Database['public']['Tables']['advance_orders']['Row']>;
        Relationships: [];
      };
      credit_payments: {
        Row: {
          id: string;
          bill_id: string;
          amount: number;
          method: 'cash' | 'upi' | 'bank';
          paid_at: string;
          notes: string | null;
        };
        Insert: Partial<Database['public']['Tables']['credit_payments']['Row']>;
        Update: Partial<Database['public']['Tables']['credit_payments']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'credit_payments_bill_id_fkey';
            columns: ['bill_id'];
            isOneToOne: false;
            referencedRelation: 'bills';
            referencedColumns: ['id'];
          }
        ];
      };
      expenses: {
        Row: {
          id: string;
          business_id: string;
          date: string;
          category: string;
          amount: number;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['expenses']['Row']>;
        Update: Partial<Database['public']['Tables']['expenses']['Row']>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          business_id: string;
          entity_type: string;
          entity_id: string;
          action: 'created' | 'updated' | 'voided' | 'deleted';
          detail: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['activity_log']['Row']>;
        Update: Partial<Database['public']['Tables']['activity_log']['Row']>;
        Relationships: [];
      };
    };
    Views: {
      v_daily_summary: {
        Row: {
          business_id: string;
          day: string;
          bill_count: number;
          total_sales: number;
          total_profit: number;
          total_collected: number;
          total_outstanding: number;
        };
        Relationships: [];
      };
      v_monthly_summary: {
        Row: {
          business_id: string;
          month: string;
          bill_count: number;
          total_sales: number;
          total_profit: number;
          total_collected: number;
          total_outstanding: number;
        };
        Relationships: [];
      };
      v_employee_performance: {
        Row: {
          business_id: string;
          employee_id: string;
          employee_name: string;
          bill_count: number;
          total_sales: number;
          total_profit: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
