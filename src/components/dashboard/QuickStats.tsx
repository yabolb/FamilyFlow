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
        <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => {
                const Icon = stat.icon

                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center"
                    >
                        <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                            <Icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-white font-semibold text-lg">
                            {stat.value}
                        </p>
                        <p className="text-gray-500 text-xs">
                            {stat.label}
                        </p>
                    </motion.div>
                )
            })}
        </div>
    )
}
