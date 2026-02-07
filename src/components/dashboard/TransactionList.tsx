'use client'

import { motion } from 'framer-motion'
import { Package } from 'lucide-react'
import type { Transaction, Category } from '@/types'

interface TransactionWithCategory extends Transaction {
    category?: Category | null
}

interface TransactionListProps {
    transactions: TransactionWithCategory[]
    showEmpty?: boolean
}

export default function TransactionList({
    transactions,
    showEmpty = true
}: TransactionListProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Hoy'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer'
        }

        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'short',
        }).format(date)
    }

    if (transactions.length === 0 && showEmpty) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 px-6"
            >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 text-center font-medium">
                    Aún no hay gastos registrados
                </p>
                <p className="text-gray-600 text-sm text-center mt-1">
                    Pulsa el botón + para añadir tu primer gasto
                </p>
            </motion.div>
        )
    }

    return (
        <div className="space-y-2">
            {transactions.map((transaction, index) => (
                <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                >
                    {/* Category Icon */}
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
                        {transaction.category?.icon ?? '📦'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                            {transaction.description ?? transaction.category?.name ?? 'Sin categoría'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-500 text-sm">
                                {formatDate(transaction.date)}
                            </span>
                            {transaction.status === 'pending' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/20 text-yellow-400 rounded">
                                    Pendiente
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                        <p className="text-red-400 font-semibold">
                            -{formatCurrency(transaction.amount)} €
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
