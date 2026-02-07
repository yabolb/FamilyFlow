'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle, TrendingDown } from 'lucide-react'

interface QuickStatsProps {
    totalTransactions: number
    pendingCount: number
    paidCount: number
}

export default function QuickStats({
    totalTransactions,
    pendingCount,
    paidCount
}: QuickStatsProps) {
    const stats = [
        {
            icon: TrendingDown,
            label: 'Gastos',
            value: totalTransactions,
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
        },
        {
            icon: Clock,
            label: 'Pendientes',
            value: pendingCount,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10',
        },
        {
            icon: CheckCircle,
            label: 'Pagados',
            value: paidCount,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
    ]

    return (
        <div className="kpi-grid">
            {stats.map((stat, index) => {
                const Icon = stat.icon

                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="surface-2 p-4 flex flex-col items-center justify-center gap-2"
                    >
                        <span className={`text-h2 tabular-nums ${stat.color}`}>
                            {stat.value}
                        </span>
                        <div className="flex items-center gap-1.5 text-meta">
                            <Icon className={`w-3.5 h-3.5 ${stat.color} opacity-80`} />
                            {stat.label}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
