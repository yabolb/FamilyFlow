'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, PiggyBank } from 'lucide-react'

interface IntelligenceClientProps {
    data: {
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
}

export default function InteligenciaClient({ data }: IntelligenceClientProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            style: 'currency',
            currency: 'EUR'
        }).format(value)
    }

    const {
        monthlyProjection,
        fixedTotal,
        annualProvision,
        variable,
        topCategory,
        savingProposal
    } = data

    // Calculate percentages for the bar (based on projection)
    // Variable Projection part = Total Projected - Fixed - Provision
    const variableProjected = monthlyProjection - fixedTotal - annualProvision

    // Safety check for division by zero
    const total = monthlyProjection || 1

    // We want to show the COMPOSITION of the projected month
    const pctVariable = (variableProjected / total) * 100
    const pctFixed = (fixedTotal / total) * 100
    const pctProvision = (annualProvision / total) * 100

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                    <h1 className="text-h1">Inteligencia</h1>
                    <p className="text-body text-sm">Análisis y predicciones</p>
                </div>
            </div>

            <div className="px-6 flex flex-col gap-3">

                {/* 1. Prediction Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="surface p-5 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24" />
                    </div>

                    <h3 className="text-sub mb-2">Proyección Mensual</h3>
                    <p className="text-body mb-4 pr-8 relative z-10">
                        Al ritmo actual de gasto variable, cerraréis el mes con un total aproximado de:
                    </p>
                    <div className="text-4xl font-bold text-white relative z-10">
                        {formatCurrency(monthlyProjection)}
                    </div>
                    <div className="mt-2 text-sm text-meta flex items-center gap-2">
                        {variable.percentage > 0 ? (
                            <span className="text-red-400">+{variable.percentage.toFixed(1)}% vs mes anterior</span>
                        ) : (
                            <span className="text-green-400">{variable.percentage.toFixed(1)}% vs mes anterior</span>
                        )}
                    </div>
                </motion.div>

                {/* 2. Composition Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="surface-2 p-5"
                >
                    <h3 className="text-sub mb-4">Composición Estimada</h3>

                    {/* Bar */}
                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex mb-4">
                        {/* Variable */}
                        <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${pctVariable}%` }}
                        />
                        {/* Fixed */}
                        <div
                            className="bg-violet-500 h-full"
                            style={{ width: `${pctFixed}%` }}
                        />
                        {/* Provision */}
                        <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${pctProvision}%` }}
                        />
                    </div>

                    {/* Legend */}
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-gray-400">Variables estimados</span>
                            </div>
                            <span className="font-medium text-white">{formatCurrency(variableProjected)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-violet-500" />
                                <span className="text-gray-400">Gastos Fijos</span>
                            </div>
                            <span className="font-medium text-white">{formatCurrency(fixedTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-gray-400">Reservas Anuales</span>
                            </div>
                            <span className="font-medium text-white">{formatCurrency(annualProvision)}</span>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Alert / Top Category */}
                {topCategory && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="surface-2 p-5 border-l-4 border-l-brand-primary"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-2xl flex-shrink-0 text-brand-primary">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Categoría Principal</h3>
                                <p className="text-body text-sm mb-2">
                                    <span className="text-white font-semibold">{topCategory.name}</span> es donde más estáis gastando este mes ({formatCurrency(topCategory.amount)}).
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 4. Saving Proposal */}
                {savingProposal && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="surface-2 p-5 border-l-4 border-l-emerald-500"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl flex-shrink-0 text-emerald-500">
                                <PiggyBank className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Propuesta de Ahorro</h3>
                                <p className="text-body text-sm">
                                    Si reducís un <span className="text-emerald-400 font-bold">10%</span> en {savingProposal.category}, podríais ahorrar <span className="text-emerald-400 font-bold">{formatCurrency(savingProposal.amount)}</span> este mes.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    )
}
