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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`hero-card card-pad-lg ${className}`}
        >
            {/* Subtle background flair */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative stack">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <p className="text-h2">
                        {title}
                    </p>
                    {subtitle && (
                        <span className="text-meta bg-surface-3 px-2 py-0.5 rounded-md">
                            {subtitle}
                        </span>
                    )}
                </div>

                {/* Main Amount */}
                <div className="flex items-baseline gap-2">
                    <span className="text-hero tabular-nums">
                        {formatCurrency(amount)}
                    </span>
                    <span className="text-h2 text-tertiary font-normal">
                        {currency}
                    </span>
                </div>

                {/* Trend Section (Optional - kept for compatibility) */}
                {trendValue && trend !== 'neutral' && (
                    <div className={`
                        flex items-center gap-1 text-sub
                        ${trend === 'up' ? 'amount-neg' : 'amount-pos'}
                    `}>
                        {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{trendValue}</span>
                    </div>
                )}

                {/* Breakdown Toggle */}
                {hasBreakdown && (
                    <div className="mt-2">
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="flex items-center gap-2 text-meta hover:text-primary transition-colors py-2 w-full border-t border-black/5"
                        >
                            {showBreakdown ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    <span>Ocultar desglose</span>
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    <span>Ver desglose</span>
                                </>
                            )}
                        </button>

                        <motion.div
                            initial={false}
                            animate={{
                                height: showBreakdown ? 'auto' : 0,
                                opacity: showBreakdown ? 1 : 0
                            }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 stack text-sm">
                                {/* Variable */}
                                <div className="flex justify-between items-center">
                                    <span className="text-secondary flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Variables
                                    </span>
                                    <span className="amount tabular-nums">{formatCurrency(breakdown.variable)} €</span>
                                </div>
                                {/* Fixed */}
                                <div className="flex justify-between items-center">
                                    <span className="text-secondary flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Fijos
                                    </span>
                                    <span className="amount tabular-nums">{formatCurrency(breakdown.fixed)} €</span>
                                </div>
                                {/* Provision */}
                                <div className="flex justify-between items-center">
                                    <span className="text-secondary flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Provisión
                                    </span>
                                    <span className="amount tabular-nums">{formatCurrency(breakdown.provision)} €</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
