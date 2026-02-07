import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths, format, getDaysInMonth } from 'date-fns'

interface IntelligenceData {
    variable: {
        current: number
        previous: number
        percentage: number
    }
    topCategory: {
        name: string
        amount: number
        icon: string
    } | null
    monthlyProjection: number
    fixedTotal: number
    annualProvision: number
    savingProposal: {
        category: string
        amount: number
    } | null
}

export async function getFamilyIntelligence(familyId: string): Promise<IntelligenceData> {
    const supabase = await createClient()
    const now = new Date()
    const lastMonth = subMonths(now, 1)

    // 1. Get transactions for current month
    const currentStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const currentEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    const { data: currentTransactions } = await supabase
        .from('transactions')
        .select(`
            amount,
            category:categories(id, name, type, icon)
        `)
        .eq('family_id', familyId)
        .gte('date', currentStart)
        .lte('date', currentEnd)

    // 2. Get transactions for previous month (up to same day)
    const prevStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd')
    const prevEndDay = Math.min(now.getDate(), getDaysInMonth(lastMonth))
    const prevEnd = format(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), prevEndDay), 'yyyy-MM-dd')

    const { data: prevTransactions } = await supabase
        .from('transactions')
        .select(`
            amount,
            category:categories(id, name, type)
        `)
        .eq('family_id', familyId)
        .gte('date', prevStart)
        .lte('date', prevEnd)

    // 3. Get Fixed Expenses (Templates)
    const { data: templates } = await supabase
        .from('expense_templates')
        .select('amount, frequency, is_active')
        .eq('family_id', familyId)
        .eq('is_active', true)


    // --- CALCULATIONS ---

    // Define partial types for query results
    type TransactionResult = {
        amount: number
        category: {
            id: string
            name: string
            type: string
            icon?: string
        } | null
    }

    const currTrans = (currentTransactions || []) as unknown as TransactionResult[]
    const prevTrans = (prevTransactions || []) as unknown as TransactionResult[]
    const fixedTemplates = (templates || []) as unknown as { amount: number, frequency: string, is_active: boolean }[]

    // Filter Variable Transactions
    const currentVarTrans = currTrans.filter(t => t.category?.type !== 'fixed')
    const prevVarTrans = prevTrans.filter(t => t.category?.type !== 'fixed')

    const currentTotalVar = currentVarTrans.reduce((sum, t) => sum + Number(t.amount), 0)
    const prevTotalVar = prevVarTrans.reduce((sum, t) => sum + Number(t.amount), 0)

    // Top Category
    const categoryMap = new Map<string, { amount: number, icon: string }>()
    currentVarTrans.forEach(t => {
        const name = t.category?.name || 'Varios'
        const icon = t.category?.icon || '📦'
        const current = categoryMap.get(name) || { amount: 0, icon }
        categoryMap.set(name, { amount: current.amount + Number(t.amount), icon })
    })

    let topCategory: { name: string; amount: number; icon: string } | null = null
    let maxAmount = 0
    for (const [key, val] of categoryMap) {
        if (val.amount > maxAmount) {
            maxAmount = val.amount
            topCategory = { name: key, amount: val.amount, icon: val.icon }
        }
    }

    // Fixed & Annual Provision
    const monthlyFixed = fixedTemplates
        .filter(t => t.frequency === 'monthly')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const annualTotal = fixedTemplates
        .filter(t => t.frequency === 'annual')
        .reduce((sum, t) => sum + Number(t.amount), 0)
    const annualProvision = annualTotal / 12

    // Projection (Linear)
    const daysInMonth = getDaysInMonth(now)
    const dayOfMonth = now.getDate()
    const dailyAvg = dayOfMonth > 0 ? currentTotalVar / dayOfMonth : 0
    const projectedVariable = dailyAvg * daysInMonth
    const totalProjected = projectedVariable + monthlyFixed + annualProvision

    // Saving Proposal (Mock logic: 10% of top category)
    const savingProposal = topCategory ? {
        category: topCategory.name,
        amount: topCategory.amount * 0.10
    } : null

    return {
        variable: {
            current: currentTotalVar,
            previous: prevTotalVar,
            percentage: prevTotalVar > 0 ? ((currentTotalVar - prevTotalVar) / prevTotalVar) * 100 : 0
        },
        topCategory,
        monthlyProjection: totalProjected,
        fixedTotal: monthlyFixed,
        annualProvision,
        savingProposal
    }
}
