'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CalendarDays, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface MonthlySummary {
    month: string
    total_amount: number
    transaction_count: number
    total_paid: number
    total_pending: number
}

export default function HistoryPage() {
    const router = useRouter()
    const supabase = createClient()
    const [history, setHistory] = useState<MonthlySummary[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // Fetch from view v_monthly_summary
            const { data, error } = await supabase
                .from('v_monthly_summary')
                .select('*')
                .order('month', { ascending: false })
                .limit(12) // Last 12 months

            if (data) {
                // Ensure date is string for consistent handling
                const formattedData = data.map(item => ({
                    ...item,
                    month: item.month // Postgres returns ISO string for timestamp
                }))
                setHistory(formattedData)
            }
            setIsLoading(false)
        }

        fetchHistory()
    }, [router, supabase])

    const goToMonth = (monthIso: string) => {
        const date = new Date(monthIso)
        const monthStr = format(date, 'yyyy-MM')
        router.push(`/dashboard?month=${monthStr}`)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="px-5 pt-12 pb-24">
            <header className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white mb-4 text-sm flex items-center gap-1"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Volver
                </button>
                <h1 className="text-2xl font-bold text-white">Historial de Gastos</h1>
            </header>

            <div className="space-y-4">
                {history.length > 0 ? (
                    history.map((item, index) => {
                        const date = new Date(item.month)
                        const monthName = format(date, 'MMMM yyyy', { locale: es })
                        const isCurrentMonth = new Date().getMonth() === date.getMonth() &&
                            new Date().getFullYear() === date.getFullYear()

                        return (
                            <motion.div
                                key={item.month}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => goToMonth(item.month)}
                                className={`
                                    relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all active:scale-95
                                    ${isCurrentMonth
                                        ? 'bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30'
                                        : 'glass-panel hover:bg-white/10'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center
                                            ${isCurrentMonth ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'}
                                        `}>
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium capitalize text-lg">
                                                {monthName}
                                            </h3>
                                            <p className="text-gray-500 text-xs">
                                                {item.transaction_count} movimientos
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                </div>

                                <div className="mt-4 flex items-end justify-between">
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Total Gastado</p>
                                        <p className="text-2xl font-bold text-white">
                                            {new Intl.NumberFormat('es-ES', {
                                                style: 'currency',
                                                currency: 'EUR'
                                            }).format(item.total_amount)}
                                        </p>
                                    </div>

                                    {/* Simple Trend Indicator (mock logic for now) */}
                                    {/* Ideally compare with previous month */}
                                </div>
                            </motion.div>
                        )
                    })
                ) : (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                        <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h3 className="text-white font-medium mb-1">Sin historial</h3>
                        <p className="text-gray-400 text-sm">Aún no hay registros mensuales completos.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
