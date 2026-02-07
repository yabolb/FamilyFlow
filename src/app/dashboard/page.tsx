import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KPICard, TransactionList, QuickStats, MonthPicker } from '@/components/dashboard'
import type { Transaction, Category, User as UserType, Family, ExpenseTemplate } from '@/types'
import { startOfMonth, endOfMonth, format, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface TransactionWithCategory extends Transaction {
    category?: Category | null
}

interface ProfileWithFamily extends UserType {
    family: Family
}

interface DashboardPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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

    // =========================================================================
    // DATE HANDLING
    // =========================================================================

    // Resolve searchParams promise (Next.js 15+)
    const params = await searchParams
    const monthParam = typeof params?.month === 'string' ? params.month : undefined

    const now = new Date()
    const selectedDate = monthParam ? new Date(monthParam + '-01T00:00:00') : now

    // Validate date
    const isValidDate = !isNaN(selectedDate.getTime())
    const targetDate = isValidDate ? selectedDate : now

    const startDate = startOfMonth(targetDate)
    const endDate = endOfMonth(targetDate)

    // Format for DB queries
    // Adjust to local date strings to match database 'YYYY-MM-DD'
    const startDateStr = format(startDate, 'yyyy-MM-dd')
    const endDateStr = format(endDate, 'yyyy-MM-dd')

    const isCurrentMonth = isSameMonth(targetDate, now)

    // =========================================================================
    // FETCH ALL DATA IN PARALLEL
    // =========================================================================

    const queries = [
        // 1. Get transactions for selected month
        supabase
            .from('transactions')
            .select(`
        *,
        category:categories(*)
      `)
            .eq('family_id', profile.family_id)
            .gte('date', startDateStr)
            .lte('date', endDateStr)
            .order('date', { ascending: false }),
    ]

    // Only fetch templates if we are in current or future month
    // For past months, we rely entirely on recorded transactions
    const shouldFetchTemplates = isCurrentMonth || targetDate > now

    if (shouldFetchTemplates) {
        queries.push(
            // 2. Get active expense templates (fixed expenses)
            supabase
                .from('expense_templates')
                .select(`
            *,
            category:categories(id, name, icon)
          `)
                .eq('family_id', profile.family_id)
                .eq('is_active', true)
        )
    }

    const results = await Promise.all(queries)
    const transactionsResult = results[0]
    const templatesResult = shouldFetchTemplates ? results[1] : { data: [] }

    const typedTransactions = (transactionsResult.data ?? []) as unknown as TransactionWithCategory[]
    const templates = (templatesResult.data ?? []) as unknown as (ExpenseTemplate & { category?: Category })[]

    // =========================================================================
    // CALCULATE TOTALS
    // =========================================================================

    // 1. Total Variable: Sum of transactions with type 'variable' OR no type (legacy)
    // We assume mostly variable if not explicitly fixed
    // BUT we need to be careful not to double count if we have fixed transactions

    // Strategy:
    // - Calculate Real Spend from transactions (both fixed and variable)
    // - Calculate Projected Spend from templates (only for current/future)

    // Separate transactions by category type
    const fixedTransactions = typedTransactions.filter(t => t.category?.type === 'fixed')
    const variableTransactions = typedTransactions.filter(t => t.category?.type !== 'fixed') // variable or both or null

    const totalRealFixed = fixedTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalVariable = variableTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

    // 2. Projected Fixed Monthly (from templates)
    const monthlyTemplates = templates.filter(t => t.frequency === 'monthly')
    const totalProjectedFixed = monthlyTemplates.reduce((sum, t) => sum + Number(t.amount), 0)

    // 3. Projected Annual Provision
    const annualTemplates = templates.filter(t => t.frequency === 'annual')
    const totalAnnualRaw = annualTemplates.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalAnnualProvision = totalAnnualRaw / 12

    // Final Total Calculation
    let totalFixed = 0

    if (isCurrentMonth) {
        // HYBRID APPROACH FOR CURRENT MONTH:
        // We want: Real Paid Fixed + Remaining Pending Fixed
        // If templates generate pending transactions, then 'totalRealFixed' includes both paid and pending.
        // So 'totalRealFixed' is likely the correct number if generation happened.
        // IF generation didn't happen, totalRealFixed might be 0.
        // Fallback: If totalRealFixed is significantly less than totalProjectedFixed, maybe use projected?
        // Safer: Use totalRealFixed + (any templates that don't have a matching transaction?) -> Too complex.

        // SIMPLE APPROACH for now:
        // Use totalRealFixed + totalProjectedFixed? No, double counting.

        // Let's stick to the previous implementation logic but refined:
        // Previous logic summed ALL transactions + ALL templates. That was definitely double counting if transactions existed.

        // NEW LOGIC:
        // Total = Variable Transactions + MAX(Real Fixed, Projected Fixed) + Annual Provision
        // This is a heuristic. If real fixed is low (beginning of month), use projected.
        // If real fixed is high (maybe extra expenses), use real.

        // Actually, if transactions are generated as 'pending', their amount should match projected.
        // So totalRealFixed should be ~= totalProjectedFixed.
        // So we can just use totalRealFixed if > 0.

        if (totalRealFixed > 0) {
            totalFixed = totalRealFixed
        } else {
            totalFixed = totalProjectedFixed
        }
    } else if (targetDate > now) {
        // Future: Use projection
        totalFixed = totalProjectedFixed
    } else {
        // Past: Use real
        totalFixed = totalRealFixed
    }

    const totalSpent = totalVariable + totalFixed + (isCurrentMonth || targetDate > now ? totalAnnualProvision : 0)

    // Current month name for display
    const currentMonthName = format(targetDate, 'MMMM', { locale: es })

    // Stats
    const pendingTransactions = typedTransactions.filter(t => t.status === 'pending')
    const paidTransactions = typedTransactions.filter(t => t.status === 'paid')

    return (
        <div className="px-5 pt-12 pb-24">
            {/* Header */}
            <header className="mb-8">
                <p className="text-gray-500 text-sm">
                    {format(now, "EEEE, d 'de' MMMM", { locale: es })}
                </p>
                <h1 className="text-2xl font-bold text-white mt-1">
                    Hola, {typedProfile.full_name.split(' ')[0]} 👋
                </h1>
            </header>

            {/* Month Picker */}
            <MonthPicker />

            {/* Main KPI Card */}
            <section className="mb-6">
                <KPICard
                    title={`Gasto en ${currentMonthName}`}
                    amount={totalSpent}
                    subtitle={typedProfile.family.name}
                    breakdown={{
                        variable: totalVariable,
                        fixed: totalFixed,
                        provision: (isCurrentMonth || targetDate > now) ? totalAnnualProvision : 0,
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

            {/* Transactions List */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">
                        {isCurrentMonth ? 'Últimos movimientos' : `Movimientos de ${currentMonthName}`}
                    </h2>
                </div>

                {typedTransactions.length > 0 ? (
                    <TransactionList
                        transactions={typedTransactions}
                    />
                ) : (
                    <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-gray-400">No hay movimientos en este periodo</p>
                    </div>
                )}
            </section>
        </div>
    )
}
