'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Repeat, CalendarDays, Trash2, ToggleLeft, ToggleRight
} from 'lucide-react'
import {
    deleteFixedExpense,
    toggleFixedExpense
} from '@/lib/actions'
import { getCategories, groupCategoriesByType, type CategoryGroup } from '@/lib/data'
import type { ExpenseTemplate, Category } from '@/types'

interface RecurrentesClientProps {
    initialTemplates: (ExpenseTemplate & { category?: Category | null })[]
}

type TabType = 'monthly' | 'annual'

export default function RecurrentesClient({ initialTemplates }: RecurrentesClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>('monthly')
    const [templates, setTemplates] = useState(initialTemplates)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Filter templates by frequency and sort by created_at
    const monthlyTemplates = templates
        .filter(t => t.frequency === 'monthly')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const annualTemplates = templates
        .filter(t => t.frequency === 'annual')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const displayedTemplates = activeTab === 'monthly' ? monthlyTemplates : annualTemplates

    // Calculate totals
    const monthlyTotal = monthlyTemplates
        .filter(t => t.is_active)
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const annualTotal = annualTemplates
        .filter(t => t.is_active)
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const monthlyProvision = annualTotal / 12

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    // Update local state when initialTemplates change (e.g. from router.refresh())
    useEffect(() => {
        setTemplates(initialTemplates)
    }, [initialTemplates])

    const handleDelete = (templateId: string) => {
        if (!confirm('¿Eliminar este gasto fijo?')) return

        startTransition(async () => {
            const result = await deleteFixedExpense(templateId)
            if (result.success) {
                setTemplates(prev => prev.filter(t => t.id !== templateId))
            }
        })
    }

    const handleToggle = (templateId: string, currentState: boolean) => {
        startTransition(async () => {
            const result = await toggleFixedExpense(templateId, !currentState)
            if (result.success) {
                setTemplates(prev => prev.map(t =>
                    t.id === templateId ? { ...t, is_active: !currentState } : t
                ))
            }
        })
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <h1 className="text-h1 mb-2">Gastos Fijos</h1>
                <p className="text-sub">
                    Configura tus gastos recurrentes mensuales y anuales
                </p>
            </div>

            {/* Summary Cards */}
            <div className="px-6 mb-6 grid grid-cols-2 gap-3">
                <div className="glass-card p-4">
                    <p className="text-meta mb-1">Fijos Mensuales</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(monthlyTotal)} €</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-meta mb-1">Provisión Anual/mes</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(monthlyProvision)} €</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-4">
                <div className="flex bg-surface-3 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('monthly')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'monthly'
                            ? 'bg-brand-primary text-white shadow-md'
                            : 'text-secondary hover:text-primary hover:bg-white/60'
                            }`}
                    >
                        <Repeat className="w-4 h-4" />
                        Mensuales ({monthlyTemplates.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('annual')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'annual'
                            ? 'bg-brand-primary text-white shadow-md'
                            : 'text-secondary hover:text-primary hover:bg-white/60'
                            }`}
                    >
                        <CalendarDays className="w-4 h-4" />
                        Anuales ({annualTemplates.length})
                    </button>
                </div>
            </div>

            {/* Templates List */}
            <div className="px-6 space-y-3">
                <AnimatePresence mode="popLayout">
                    {displayedTemplates.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-3 flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-tertiary" />
                            </div>
                            <p className="text-secondary">
                                No hay gastos {activeTab === 'monthly' ? 'mensuales' : 'anuales'} configurados
                            </p>
                            <p className="text-tertiary text-sm mt-1">
                                Pulsa el botón + para añadir uno
                            </p>
                        </motion.div>
                    ) : (
                        displayedTemplates.map((template, index) => (
                            <motion.div
                                key={template.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.05 }}
                                className={`glass-card p-4 ${!template.is_active ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Category Icon */}
                                    <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center text-2xl flex-shrink-0">
                                        {template.category?.icon || '📋'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-primary font-medium truncate">{template.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-tertiary text-sm">
                                                {template.frequency === 'monthly'
                                                    ? `Día ${template.due_day}`
                                                    : `${template.due_day}/${template.due_month}`
                                                }
                                            </span>
                                            <span className="text-tertiary">•</span>
                                            <span className="text-tertiary text-sm">
                                                {template.category?.name || 'Sin categoría'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-primary font-semibold">
                                            {formatCurrency(Number(template.amount))} €
                                        </p>
                                        {template.frequency === 'annual' && (
                                            <p className="text-tertiary text-xs">
                                                {formatCurrency(Number(template.amount) / 12)} €/mes
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-black/5">
                                    <button
                                        onClick={() => handleToggle(template.id, template.is_active || false)}
                                        disabled={isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                                text-secondary hover:text-primary hover:bg-black/5 transition-colors"
                                    >
                                        {template.is_active ? (
                                            <>
                                                <ToggleRight className="w-4 h-4 text-green-400" />
                                                Activo
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="w-4 h-4" />
                                                Pausado
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        disabled={isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                                text-error hover:text-red-600 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}


