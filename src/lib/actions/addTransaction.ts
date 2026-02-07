'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface AddTransactionResult {
    success: boolean
    error?: string
    transactionId?: string
}

export async function addTransaction(formData: FormData): Promise<AddTransactionResult> {
    try {
        const supabase = await createClient()

        // 1. Validate user session
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'No autorizado. Inicia sesión de nuevo.' }
        }

        // 2. Get user's family_id
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.family_id) {
            return { success: false, error: 'No se encontró tu familia. Completa el onboarding.' }
        }

        // 3. Parse form data
        const amountStr = formData.get('amount') as string
        const categoryId = formData.get('category_id') as string
        const description = formData.get('description') as string | null
        const dateStr = formData.get('date') as string

        // Validate amount
        const amount = parseFloat(amountStr.replace(',', '.'))
        if (isNaN(amount) || amount <= 0) {
            return { success: false, error: 'Introduce un importe válido.' }
        }

        // Validate category
        if (!categoryId) {
            return { success: false, error: 'Selecciona una categoría.' }
        }

        // Parse date (default to today)
        const date = dateStr ? new Date(dateStr) : new Date()
        const dateFormatted = date.toISOString().split('T')[0]

        // 4. Insert transaction
        const { data: transaction, error: insertError } = await supabase
            .from('transactions')
            .insert({
                family_id: profile.family_id,
                user_id: user.id,
                category_id: categoryId,
                amount: amount,
                date: dateFormatted,
                description: description?.trim() || null,
                status: 'paid',
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('Insert error details:', insertError)
            return {
                success: false,
                error: `Error Supabase: ${insertError.message} (${insertError.code})`
            }
        }

        // 5. Revalidate dashboard to show updated data
        revalidatePath('/dashboard')

        return {
            success: true,
            transactionId: transaction.id
        }

    } catch (error: any) {
        console.error('addTransaction UNEXPECTED error:', error)
        return {
            success: false,
            error: `Error inesperado: ${error.message || JSON.stringify(error)}`
        }
    }
}
