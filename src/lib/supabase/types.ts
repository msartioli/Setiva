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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      accounts: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          icon: string
          id: string
          initial_balance_cents: number
          initial_balance_date: string
          institution_id: string | null
          kind: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          initial_balance_cents?: number
          initial_balance_date?: string
          institution_id?: string | null
          kind: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          initial_balance_cents?: number
          initial_balance_date?: string
          institution_id?: string | null
          kind?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string
          created_at: string
          id: string
          limit_cents: number
          period_month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          limit_cents: number
          period_month: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          limit_cents?: number
          period_month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      card_installments: {
        Row: {
          amount_cents: number
          card_purchase_id: string
          created_at: string
          id: string
          installment_number: number
          invoice_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          card_purchase_id: string
          created_at?: string
          id?: string
          installment_number: number
          invoice_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          card_purchase_id?: string
          created_at?: string
          id?: string
          installment_number?: number
          invoice_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_installments_card_purchase_id_fkey"
            columns: ["card_purchase_id"]
            isOneToOne: false
            referencedRelation: "card_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "card_invoice_totals"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "card_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "card_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invoices: {
        Row: {
          card_id: string
          closing_date: string
          created_at: string
          due_date: string
          id: string
          paid_amount_cents: number
          reference_month: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          closing_date: string
          created_at?: string
          due_date: string
          id?: string
          paid_amount_cents?: number
          reference_month: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          closing_date?: string
          created_at?: string
          due_date?: string
          id?: string
          paid_amount_cents?: number
          reference_month?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_invoices_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_payments: {
        Row: {
          account_id: string
          amount_cents: number
          created_at: string
          id: string
          idempotency_key: string | null
          invoice_id: string
          paid_at: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          invoice_id: string
          paid_at: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          invoice_id?: string
          paid_at?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "card_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "card_invoice_totals"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "card_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "card_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_purchases: {
        Row: {
          canceled_at: string | null
          card_id: string
          category_id: string | null
          created_at: string
          description: string
          id: string
          idempotency_key: string | null
          installments_count: number
          purchase_date: string
          total_amount_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          card_id: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          idempotency_key?: string | null
          installments_count?: number
          purchase_date: string
          total_amount_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          card_id?: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          idempotency_key?: string | null
          installments_count?: number
          purchase_date?: string
          total_amount_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_purchases_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_purchases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          archived_at: string | null
          closing_day: number
          color: string
          created_at: string
          default_payment_account_id: string | null
          due_day: number
          id: string
          institution_id: string | null
          limit_cents: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          closing_day: number
          color?: string
          created_at?: string
          default_payment_account_id?: string | null
          due_day: number
          id?: string
          institution_id?: string | null
          limit_cents?: number
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          closing_day?: number
          color?: string
          created_at?: string
          default_payment_account_id?: string | null
          due_day?: number
          id?: string
          institution_id?: string | null
          limit_cents?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_default_payment_account_id_fkey"
            columns: ["default_payment_account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "cards_default_payment_account_id_fkey"
            columns: ["default_payment_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          icon: string
          id: string
          kind: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          kind: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          accepted_at: string
          document_type: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document_type: string
          id?: string
          user_id?: string
          version: string
        }
        Update: {
          accepted_at?: string
          document_type?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          account_id: string | null
          amount_cents: number
          created_at: string
          debt_id: string
          id: string
          idempotency_key: string | null
          payment_date: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount_cents: number
          created_at?: string
          debt_id: string
          id?: string
          idempotency_key?: string | null
          payment_date: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount_cents?: number
          created_at?: string
          debt_id?: string
          id?: string
          idempotency_key?: string | null
          payment_date?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "debt_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          archived_at: string | null
          created_at: string
          current_balance_cents: number
          id: string
          installments_paid: number
          installments_total: number | null
          known_charges_cents: number
          name: string
          next_due_date: string | null
          principal_cents: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          current_balance_cents: number
          id?: string
          installments_paid?: number
          installments_total?: number | null
          known_charges_cents?: number
          name: string
          next_due_date?: string | null
          principal_cents: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          current_balance_cents?: number
          id?: string
          installments_paid?: number
          installments_total?: number | null
          known_charges_cents?: number
          name?: string
          next_due_date?: string | null
          principal_cents?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_contributions: {
        Row: {
          amount_cents: number
          contribution_date: string
          created_at: string
          goal_id: string
          id: string
          kind: string
          transfer_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          contribution_date: string
          created_at?: string
          goal_id: string
          id?: string
          kind?: string
          transfer_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          contribution_date?: string
          created_at?: string
          goal_id?: string
          id?: string
          kind?: string
          transfer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          archived_at: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          linked_account_id: string | null
          name: string
          reserved_cents: number
          status: string
          target_cents: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          linked_account_id?: string | null
          name: string
          reserved_cents?: number
          status?: string
          target_cents: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          linked_account_id?: string | null
          name?: string
          reserved_cents?: number
          status?: string
          target_cents?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "goals_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          account_id: string | null
          column_mapping: Json
          confirmed_at: string | null
          created_at: string
          duplicate_count: number
          id: string
          reverted_at: string | null
          row_count: number
          source_filename: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          column_mapping?: Json
          confirmed_at?: string | null
          created_at?: string
          duplicate_count?: number
          id?: string
          reverted_at?: string | null
          row_count?: number
          source_filename?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          account_id?: string | null
          column_mapping?: Json
          confirmed_at?: string | null
          created_at?: string
          duplicate_count?: number
          id?: string
          reverted_at?: string | null
          row_count?: number
          source_filename?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "import_batches_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          brand_color: string | null
          created_at: string
          icon: string
          id: string
          kind: string
          name: string
          short_name: string | null
          sort_order: number
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          icon?: string
          id?: string
          kind?: string
          name: string
          short_name?: string | null
          sort_order?: number
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          icon?: string
          id?: string
          kind?: string
          name?: string
          short_name?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          budget_limit_enabled: boolean
          created_at: string
          due_soon_days_before: number
          due_soon_enabled: boolean
          goal_milestone_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_limit_enabled?: boolean
          created_at?: string
          due_soon_days_before?: number
          due_soon_enabled?: boolean
          goal_milestone_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          budget_limit_enabled?: boolean
          created_at?: string
          due_soon_days_before?: number
          due_soon_enabled?: boolean
          goal_milestone_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_state: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          draft: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          draft?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          draft?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          animations_enabled: boolean
          avatar_family: string | null
          avatar_seed: string | null
          avatar_style: string | null
          avatar_url: string | null
          created_at: string
          currency: string
          density: string
          display_name: string
          first_day_of_week: number
          guided_tour_completed_at: string | null
          hide_values: boolean
          mascot_enabled: boolean
          nickname: string | null
          onboarding_completed_at: string | null
          show_cents: boolean
          theme: Database["public"]["Enums"]["app_theme"]
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          animations_enabled?: boolean
          avatar_family?: string | null
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_url?: string | null
          created_at?: string
          currency?: string
          density?: string
          display_name?: string
          first_day_of_week?: number
          guided_tour_completed_at?: string | null
          hide_values?: boolean
          mascot_enabled?: boolean
          nickname?: string | null
          onboarding_completed_at?: string | null
          show_cents?: boolean
          theme?: Database["public"]["Enums"]["app_theme"]
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          animations_enabled?: boolean
          avatar_family?: string | null
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_url?: string | null
          created_at?: string
          currency?: string
          density?: string
          display_name?: string
          first_day_of_week?: number
          guided_tour_completed_at?: string | null
          hide_values?: boolean
          mascot_enabled?: boolean
          nickname?: string | null
          onboarding_completed_at?: string | null
          show_cents?: boolean
          theme?: Database["public"]["Enums"]["app_theme"]
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurrence_occurrences: {
        Row: {
          amount_cents: number
          created_at: string
          due_date: string
          id: string
          is_estimate: boolean
          recurrence_id: string
          skipped_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          due_date: string
          id?: string
          is_estimate?: boolean
          recurrence_id: string
          skipped_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_date?: string
          id?: string
          is_estimate?: boolean
          recurrence_id?: string
          skipped_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrence_occurrences_recurrence_id_fkey"
            columns: ["recurrence_id"]
            isOneToOne: false
            referencedRelation: "recurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_occurrences_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrences: {
        Row: {
          account_id: string | null
          amount_cents: number
          anchor_day: number | null
          archived_at: string | null
          auto_effectuate: boolean
          category_id: string | null
          created_at: string
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_estimate: boolean
          kind: string
          start_date: string
          updated_at: string
          user_id: string
          weekday: number | null
        }
        Insert: {
          account_id?: string | null
          amount_cents: number
          anchor_day?: number | null
          archived_at?: string | null
          auto_effectuate?: boolean
          category_id?: string | null
          created_at?: string
          description: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_estimate?: boolean
          kind: string
          start_date: string
          updated_at?: string
          user_id?: string
          weekday?: number | null
        }
        Update: {
          account_id?: string | null
          amount_cents?: number
          anchor_day?: number | null
          archived_at?: string | null
          auto_effectuate?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_estimate?: boolean
          kind?: string
          start_date?: string
          updated_at?: string
          user_id?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recurrences_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "recurrences_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrences_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount_cents: number
          card_installment_id: string | null
          category_id: string | null
          competence_date: string
          created_at: string
          description: string
          effective_at: string | null
          id: string
          idempotency_key: string | null
          import_batch_id: string | null
          import_duplicate_of: string | null
          import_duplicate_reviewed: boolean
          origin: string
          recurrence_occurrence_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transfer_id: string | null
          transfer_leg: Database["public"]["Enums"]["transfer_direction"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          card_installment_id?: string | null
          category_id?: string | null
          competence_date: string
          created_at?: string
          description?: string
          effective_at?: string | null
          id?: string
          idempotency_key?: string | null
          import_batch_id?: string | null
          import_duplicate_of?: string | null
          import_duplicate_reviewed?: boolean
          origin?: string
          recurrence_occurrence_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transfer_id?: string | null
          transfer_leg?:
            | Database["public"]["Enums"]["transfer_direction"]
            | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          card_installment_id?: string | null
          category_id?: string | null
          competence_date?: string
          created_at?: string
          description?: string
          effective_at?: string | null
          id?: string
          idempotency_key?: string | null
          import_batch_id?: string | null
          import_duplicate_of?: string | null
          import_duplicate_reviewed?: boolean
          origin?: string
          recurrence_occurrence_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transfer_id?: string | null
          transfer_leg?:
            | Database["public"]["Enums"]["transfer_direction"]
            | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_installment_fk"
            columns: ["card_installment_id"]
            isOneToOne: false
            referencedRelation: "card_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_batch_fk"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_duplicate_of_fkey"
            columns: ["import_duplicate_of"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurrence_occurrence_fk"
            columns: ["recurrence_occurrence_id"]
            isOneToOne: false
            referencedRelation: "recurrence_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          from_account_id: string
          id: string
          idempotency_key: string | null
          to_account_id: string
          transfer_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description?: string
          from_account_id: string
          id?: string
          idempotency_key?: string | null
          to_account_id: string
          transfer_date: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          from_account_id?: string
          id?: string
          idempotency_key?: string | null
          to_account_id?: string
          transfer_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "account_realized_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      account_realized_balances: {
        Row: {
          account_id: string | null
          balance_cents: number | null
          user_id: string | null
        }
        Relationships: []
      }
      budget_progress: {
        Row: {
          budget_id: string | null
          category_id: string | null
          limit_cents: number | null
          period_month: string | null
          spent_cents: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invoice_totals: {
        Row: {
          card_id: string | null
          closing_date: string | null
          due_date: string | null
          invoice_id: string | null
          paid_amount_cents: number | null
          reference_month: string | null
          status: string | null
          total_cents: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_invoices_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      upcoming_commitments: {
        Row: {
          amount_cents: number | null
          card_id: string | null
          description: string | null
          due_date: string | null
          id: string | null
          is_estimate: boolean | null
          kind: string | null
          source: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_goal_contribution: {
        Args: {
          p_amount_cents: number
          p_contribution_date: string
          p_from_account_id?: string
          p_goal_id: string
          p_idempotency_key?: string
          p_kind?: string
        }
        Returns: {
          amount_cents: number
          contribution_date: string
          created_at: string
          goal_id: string
          id: string
          kind: string
          transfer_id: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "goal_contributions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_card_purchase: {
        Args: { p_purchase_id: string }
        Returns: undefined
      }
      clamp_day_to_month: {
        Args: { p_day: number; p_month: number; p_year: number }
        Returns: string
      }
      complete_onboarding: {
        Args: never
        Returns: {
          completed_at: string | null
          created_at: string
          current_step: number
          draft: Json
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "onboarding_state"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_card_purchase: {
        Args: {
          p_card_id: string
          p_category_id: string
          p_description: string
          p_idempotency_key?: string
          p_installments_count: number
          p_purchase_date: string
          p_total_amount_cents: number
        }
        Returns: {
          canceled_at: string | null
          card_id: string
          category_id: string | null
          created_at: string
          description: string
          id: string
          idempotency_key: string | null
          installments_count: number
          purchase_date: string
          total_amount_cents: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "card_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_transfer: {
        Args: {
          p_amount_cents: number
          p_description?: string
          p_from_account_id: string
          p_idempotency_key?: string
          p_status?: Database["public"]["Enums"]["transaction_status"]
          p_to_account_id: string
          p_transfer_date: string
        }
        Returns: {
          amount_cents: number
          created_at: string
          description: string
          from_account_id: string
          id: string
          idempotency_key: string | null
          to_account_id: string
          transfer_date: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_transfer: { Args: { p_transfer_id: string }; Returns: undefined }
      edit_transfer: {
        Args: {
          p_amount_cents: number
          p_description?: string
          p_transfer_date: string
          p_transfer_id: string
        }
        Returns: {
          amount_cents: number
          created_at: string
          description: string
          from_account_id: string
          id: string
          idempotency_key: string | null
          to_account_id: string
          transfer_date: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      effectuate_recurrence_occurrence: {
        Args: {
          p_account_id: string
          p_amount_cents?: number
          p_effective_date?: string
          p_occurrence_id: string
        }
        Returns: {
          amount_cents: number
          created_at: string
          due_date: string
          id: string
          is_estimate: boolean
          recurrence_id: string
          skipped_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "recurrence_occurrences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_card_invoice: {
        Args: { p_card_id: string; p_reference_month: string }
        Returns: {
          card_id: string
          closing_date: string
          created_at: string
          due_date: string
          id: string
          paid_amount_cents: number
          reference_month: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "card_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      materialize_recurrence_occurrences: {
        Args: { p_horizon_end: string }
        Returns: number
      }
      pay_card_invoice: {
        Args: {
          p_account_id: string
          p_amount_cents: number
          p_idempotency_key?: string
          p_invoice_id: string
          p_payment_date: string
        }
        Returns: {
          card_id: string
          closing_date: string
          created_at: string
          due_date: string
          id: string
          paid_amount_cents: number
          reference_month: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "card_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      recurrence_due_date_for_month: {
        Args: {
          p_recurrence: Database["public"]["Tables"]["recurrences"]["Row"]
          p_reference_month: string
        }
        Returns: string
      }
      refund_card_installment: {
        Args: { p_installment_id: string }
        Returns: undefined
      }
      register_debt_payment: {
        Args: {
          p_account_id: string
          p_amount_cents: number
          p_debt_id: string
          p_idempotency_key?: string
          p_payment_date: string
        }
        Returns: {
          archived_at: string | null
          created_at: string
          current_balance_cents: number
          id: string
          installments_paid: number
          installments_total: number | null
          known_charges_cents: number
          name: string
          next_due_date: string | null
          principal_cents: number
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "debts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_goal_contribution: {
        Args: { p_contribution_id: string }
        Returns: undefined
      }
      reverse_import_batch: { Args: { p_batch_id: string }; Returns: undefined }
      skip_recurrence_occurrence: {
        Args: { p_occurrence_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_theme: "light" | "dark" | "system"
      transaction_status: "pending" | "completed"
      transaction_type: "income" | "expense" | "transfer"
      transfer_direction: "out" | "in"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_theme: ["light", "dark", "system"],
      transaction_status: ["pending", "completed"],
      transaction_type: ["income", "expense", "transfer"],
      transfer_direction: ["out", "in"],
    },
  },
} as const

