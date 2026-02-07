import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KPICard, TransactionList, QuickStats } from '@/components/dashboard'
import type { Transaction, Category, User as UserType, Family } from '@/types'

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

    // Get transactions for current month
    const { data: transactions } = await supabase
        .from('transactions')
        .select(`
      *,
      category:categories(*)
    `)
        .eq('family_id', profile.family_id)
        .gte('date', startOfMonthStr)
        .order('date', { ascending: false })
        .limit(10)

    const typedTransactions = (transactions ?? []) as unknown as TransactionWithCategory[]

    // Calculate stats
    const totalSpent = typedTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
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
