// Database types for FamilyFlow
// Generated based on Supabase schema

export type CategoryType = 'fixed' | 'variable' | 'both'
export type ExpenseFrequency = 'monthly' | 'annual'
export type TransactionStatus = 'paid' | 'pending'

export interface Family {
    id: string
    name: string
    invite_code: string
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    email: string
    full_name: string
    family_id: string | null
    avatar_url: string | null
    is_family_admin: boolean
    created_at: string
    updated_at: string
}

export interface Category {
    id: string
    name: string
    icon: string
    type: CategoryType
    family_id: string | null
    is_system: boolean
    sort_order: number
    created_at: string
}

export interface ExpenseTemplate {
    id: string
    family_id: string
    title: string
    amount: number
    frequency: ExpenseFrequency
    due_day: number | null
    category_id: string | null
    is_active: boolean
    notes: string | null
    created_at: string
    updated_at: string
}

export interface Transaction {
    id: string
    family_id: string
    user_id: string
    category_id: string | null
    template_id: string | null
    amount: number
    description: string | null
    date: string
    status: TransactionStatus
    is_prorated: boolean
    created_at: string
    updated_at: string
}

// Extended types with relations
export interface TransactionWithCategory extends Transaction {
    category?: Category
}

export interface TransactionWithUser extends Transaction {
    user?: User
}

export interface FullTransaction extends Transaction {
    category?: Category
    user?: User
}
