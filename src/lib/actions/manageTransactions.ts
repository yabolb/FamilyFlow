'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionSchema = z.object({
    id: z.string().uuid(),
    amount: z.string().transform((val) => parseFloat(val.replace(',', '.'))),
    category_id: z.string().uuid(),
    description: z.string().optional(),
    date: z.string().datetime(),
})

export async function deleteTransaction(transactionId: string) {
    const supabase = await createClient()
    const {

        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'User not authenticated' }
    }

    try {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', user.id)

        if (error) throw error

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/historial')

        return { success: true }
    } catch (error) {
        console.error('Error deleting transaction:', error)
        return { success: false, error: 'Error deleting transaction' }
    }
}

export async function updateTransaction(formData: FormData) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'User not authenticated' }
    }

    const rawData = {
        id: formData.get('id'),
        amount: formData.get('amount'),
        category_id: formData.get('category_id'),
        description: formData.get('description'),
        date: formData.get('date'),
    }

    try {
        const validatedData = transactionSchema.parse(rawData)

        const { error } = await supabase
            .from('transactions')
            .update({
                amount: validatedData.amount,
                category_id: validatedData.category_id,
                description: validatedData.description,
                date: validatedData.date,
            })
            .eq('id', validatedData.id)
            .eq('user_id', user.id)

        if (error) throw error

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/historial')

        return { success: true }
    } catch (error) {
        console.error('Error updating transaction:', error)
        return { success: false, error: 'Error updating transaction' }
    }
}
