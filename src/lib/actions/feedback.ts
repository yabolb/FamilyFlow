'use server'

import { createClient } from '@/lib/supabase/server'

export interface FeedbackResult {
    success: boolean
    error?: string
}

export interface FeedbackEligibility {
    shouldShow: boolean
    hasResponded: boolean
    transactionCount: number
}

/**
 * Check if the user is eligible to see the feedback prompt.
 * Rules:
 * - Show after 3rd transaction (both variable + fixed completed)
 * - If dismissed without responding, show again at 5th transaction
 * - If already responded, never auto-show (but allow via profile button)
 */
export async function checkFeedbackEligibility(): Promise<FeedbackEligibility> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { shouldShow: false, hasResponded: false, transactionCount: 0 }
    }

    // Get user's family_id
    const { data: profile } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single()

    if (!profile?.family_id) {
        return { shouldShow: false, hasResponded: false, transactionCount: 0 }
    }

    // Check if user has already provided feedback
    const { data: existingFeedback } = await supabase
        .from('user_feedback')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

    const hasResponded = (existingFeedback && existingFeedback.length > 0) || false

    // Count user's total transactions
    const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const total = transactionCount ?? 0

    return {
        shouldShow: !hasResponded && total >= 3,
        hasResponded,
        transactionCount: total,
    }
}

/**
 * Submit user feedback to the database.
 */
export async function submitFeedback(
    valorPrincipal: string,
    comentario?: string
): Promise<FeedbackResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'No autorizado' }
    }

    const { data: profile } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single()

    if (!profile?.family_id) {
        return { success: false, error: 'No se encontró familia' }
    }

    const { error } = await supabase
        .from('user_feedback')
        .insert({
            user_id: user.id,
            family_id: profile.family_id,
            valor_principal: valorPrincipal,
            comentario: comentario?.trim() || null,
        })

    if (error) {
        console.error('Error saving feedback:', error)
        return { success: false, error: 'Error al guardar. Inténtalo de nuevo.' }
    }

    return { success: true }
}
