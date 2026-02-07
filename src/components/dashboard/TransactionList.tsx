'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package } from 'lucide-react'
import type { Transaction, Category } from '@/types'
import { EditTransactionDrawer } from '@/components/expenses'

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
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

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

    const handleTransactionClick = (transaction: TransactionWithCategory) => {
        setSelectedTransaction(transaction)
        setIsEditDrawerOpen(true)
    }

    const handleCloseDrawer = () => {
        setIsEditDrawerOpen(false)
        setTimeout(() => setSelectedTransaction(null), 300)
    }

    if (transactions.length === 0 && showEmpty) {
        return (
            <div className="surface p-8 text-center stack">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-secondary">
                    <Package className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-body font-medium">No hay movimientos</p>
                    <p className="text-meta mt-1">Añade tu primer gasto</p>
                </div>
            </div>
        )
    }

    const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()

        // If dates are different, sort by date descending
        if (dateA !== dateB) {
            return dateB - dateA
        }

        // If dates are same, sort by creation time descending (newest created first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return (
        <>
            <div className="list">
                {sortedTransactions.map((transaction, index) => {
                    const isPending = transaction.status === 'pending'
                    const catIcon = transaction.category?.icon ?? '📦'
                    const displayTitle = transaction.description || transaction.category?.name || 'Sin categoría'

                    return (
                        <div
                            className="list-row cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
                            key={transaction.id}
                            onClick={() => handleTransactionClick(transaction)}
                        >
                            {/* Left Side: Icon + Title/Meta */}
                            <div className="list-left pointer-events-none">
                                <div className="list-icon text-xl">
                                    {catIcon}
                                </div>
                                <div className="list-content">
                                    <p className="text-body font-medium truncate max-w-[180px]">
                                        {displayTitle}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-meta">
                                            {formatDate(transaction.date)}
                                        </span>
                                        {isPending && (
                                            <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                Pendiente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Amount */}
                            <div className={`amount tabular-nums ${isPending ? 'text-tertiary opacity-70' : 'text-primary'}`}>
                                -{formatCurrency(transaction.amount)} €
                            </div>
                        </div>
                    )
                })}
            </div>

            <EditTransactionDrawer
                isOpen={isEditDrawerOpen}
                onClose={handleCloseDrawer}
                transaction={selectedTransaction}
            />
        </>
    )
}
