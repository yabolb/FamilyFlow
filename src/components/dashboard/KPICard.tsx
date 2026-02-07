'use client'

import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface BreakdownData {
    variable: number
    fixed: number
    provision: number
}

interface KPICardProps {
    title: string
    amount: number
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    currency?: string
    className?: string
    breakdown?: BreakdownData
}

export default function KPICard({
    title,
    amount,
    subtitle,
    trend = 'neutral',
    trendValue,
    currency = '€',
    className = '',
    breakdown,
}: KPICardProps) {
    const [showBreakdown, setShowBreakdown] = useState(false)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const hasBreakdown = breakdown && (breakdown.variable > 0 || breakdown.fixed > 0 || breakdown.provision > 0)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`
        relative overflow-hidden
        bg-white/5 backdrop-blur-xl 
        border border-white/10 
        rounded-2xl p-6
        ${className}
      `}
        >
            {/* Background gradient decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
                {/* Title */}
                <p className="text-gray-400 text-sm font-medium mb-1">
                    {title}
                </p>

                {/* Amount */}
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white tracking-tight">
                        {formatCurrency(amount)}
                    </span>
                    <span className="text-xl text-gray-400 font-medium">
                        {currency}
                    </span>
                </div>

                {/* Subtitle and Trend */}
                <div className="flex items-center justify-between mt-3">
                    {subtitle && (
                        <p className="text-gray-500 text-sm">
                            {subtitle}
                        </p>
                    )}

                    {trendValue && trend !== 'neutral' && (
                        <div className={`
              flex items-center gap-1 text-sm font-medium
              ${trend === 'up' ? 'text-red-400' : 'text-green-400'}
            `}>
                            {trend === 'up' ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                {/* Breakdown Toggle */}
                {hasBreakdown && (
                    <>
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="flex items-center gap-1 mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {showBreakdown ? (
                                <>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                    Ocultar desglose
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    Ver desglose
                                </>
                            )}
                        </button>

                        {/* Breakdown Details */}
                        <motion.div
                            initial={false}
                            animate={{
                                height: showBreakdown ? 'auto' : 0,
                                opacity: showBreakdown ? 1 : 0
                            }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                {/* Variables */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                        <span className="text-gray-400 text-sm">Variables</span>
                                    </div>
                                    <span className="text-white text-sm font-medium">
                                        {formatCurrency(breakdown.variable)} €
                                    </span>
                                </div>

                                {/* Fijos Mensuales */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                                        <span className="text-gray-400 text-sm">Fijos</span>
                                    </div>
                                    <span className="text-white text-sm font-medium">
                                        {formatCurrency(breakdown.fixed)} €
                                    </span>
                                </div>

                                {/* Provisión Anual */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span className="text-gray-400 text-sm">Provisión Anual</span>
                                    </div>
                                    <span className="text-white text-sm font-medium">
                                        {formatCurrency(breakdown.provision)} €
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </motion.div>
    )
}
