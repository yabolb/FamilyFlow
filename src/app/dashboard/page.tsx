import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KPICard, TransactionList, QuickStats } from '@/components/dashboard'
import type { Transaction, Category, User as UserType, Family, ExpenseTemplate } from '@/types'

interface TransactionWithCategory extends Transaction {
    category?: Category | null
}

interface ProfileWithFamily extends UserType {
    family: Family
}

export default async function DashboardPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile with family
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
      *,
      family:families(*)
    `)
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.family_id) {
        redirect('/onboarding')
    }

    const typedProfile = profile as unknown as ProfileWithFamily

    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0]

    // =========================================================================
    // FETCH ALL DATA IN PARALLEL
    // =========================================================================

    const [transactionsResult, templatesResult] = await Promise.all([
        // 1. Get transactions for current month (variables)
        supabase
            .from('transactions')
            .select(`
        *,
        category:categories(*)
      `)
            .eq('family_id', profile.family_id)
            .gte('date', startOfMonthStr)
            .order('date', { ascending: false }),

        // 2. Get expense templates (fixed expenses)
        supabase
            .from('expense_templates')
            .select(`
        *,
        category:categories(id, name, icon)
      `)
            .eq('family_id', profile.family_id)
            .eq('is_active', true)
    ])

    const typedTransactions = (transactionsResult.data ?? []) as unknown as TransactionWithCategory[]
    const templates = (templatesResult.data ?? []) as unknown as (ExpenseTemplate & { category?: Category })[]

    // =========================================================================
    // CALCULATE TOTALS
    // =========================================================================

    // 1. Total Variable: Sum of all transactions this month
    const totalVariable = typedTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

    // 2. Total Fixed Monthly: Sum of monthly expense_templates
    const monthlyTemplates = templates.filter(t => t.frequency === 'monthly')
    const totalFixedMonthly = monthlyTemplates.reduce((sum, t) => sum + Number(t.amount), 0)

    // 3. Total Annual Provision: Sum of annual templates / 12
    const annualTemplates = templates.filter(t => t.frequency === 'annual')
    const totalAnnualRaw = annualTemplates.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalAnnualProvision = totalAnnualRaw / 12

    // 4. Grand Total
    const totalSpent = totalVariable + totalFixedMonthly + totalAnnualProvision

    // Transaction stats
    const pendingTransactions = typedTransactions.filter(t => t.status === 'pending')
    const paidTransactions = typedTransactions.filter(t => t.status === 'paid')

    // Current month name
    const currentMonth = new Intl.DateTimeFormat('es-ES', {
        month: 'long',
    }).format(now)

    return (
        <div className="px-5 pt-12">
            {/* Header */}
            <header className="mb-8">
                <p className="text-gray-500 text-sm">
                    {new Intl.DateTimeFormat('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    }).format(now)}
                </p>
                <h1 className="text-2xl font-bold text-white mt-1">
                    Hola, {typedProfile.full_name.split(' ')[0]} 👋
                </h1>
            </header>

            {/* Main KPI Card */}
            <section className="mb-6">
                <KPICard
                    title={`Gasto en ${currentMonth}`}
                    amount={totalSpent}
                    subtitle={typedProfile.family.name}
                    breakdown={{
                        variable: totalVariable,
                        fixed: totalFixedMonthly,
                        provision: totalAnnualProvision,
                    }}
                />
            </section>

            {/* Quick Stats */}
            <section className="mb-8">
                <QuickStats
                    totalTransactions={typedTransactions.length}
                    pendingCount={pendingTransactions.length}
                    paidCount={paidTransactions.length}
                />
            </section>

            {/* Recent Transactions */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">
                        Últimos movimientos
                    </h2>
                    {typedTransactions.length > 0 && (
                        <button className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">
                            Ver todos
                        </button>
                    )}
                </div>

                <TransactionList
                    transactions={typedTransactions.slice(0, 5)}
                />
            </section>
        </div>
    )
}
