'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export interface ExpensesByCategory {
    category: string
    icon: string
    total: number
    count: number
}

export async function getUserExpensesContext(): Promise<{
    expenses: ExpensesByCategory[]
    totalThisMonth: number
    json: string
}> {
    const supabase = await createClient()
    const now = new Date()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { expenses: [], totalThisMonth: 0, json: '[]' }

    const { data: userData } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single()

    if (!userData?.family_id) return { expenses: [], totalThisMonth: 0, json: '[]' }

    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    const { data: transactions } = await supabase
        .from('transactions')
        .select(`
            amount,
            category:categories(name, icon)
        `)
        .eq('family_id', userData.family_id)
        .gte('date', monthStart)
        .lte('date', monthEnd)

    type TxResult = {
        amount: number
        category: { name: string; icon: string } | null
    }

    const txs = (transactions || []) as unknown as TxResult[]

    // Group by category
    const map = new Map<string, { icon: string; total: number; count: number }>()
    let totalThisMonth = 0

    txs.forEach(tx => {
        const name = tx.category?.name || 'Sin categoría'
        const icon = tx.category?.icon || '📦'
        const amount = Number(tx.amount)
        totalThisMonth += amount

        const current = map.get(name) || { icon, total: 0, count: 0 }
        map.set(name, {
            icon,
            total: current.total + amount,
            count: current.count + 1,
        })
    })

    const expenses: ExpensesByCategory[] = Array.from(map.entries())
        .map(([category, data]) => ({
            category,
            icon: data.icon,
            total: Math.round(data.total * 100) / 100,
            count: data.count,
        }))
        .sort((a, b) => b.total - a.total)

    const json = JSON.stringify(expenses, null, 2)
    return { expenses, totalThisMonth: Math.round(totalThisMonth * 100) / 100, json }
}
