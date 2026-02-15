'use client'

import { format, addMonths, subMonths, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MonthPicker() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get current month from URL or default to today
    const currentMonthParam = searchParams.get('month')
    const currentDate = currentMonthParam
        ? new Date(currentMonthParam + '-01T00:00:00')
        : new Date()

    const today = new Date()
    const isCurrentMonth = isSameMonth(currentDate, today)

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = direction === 'next'
            ? addMonths(currentDate, 1)
            : subMonths(currentDate, 1)

        const monthStr = format(newDate, 'yyyy-MM')
        router.push(`?month=${monthStr}`)
    }

    const resetToToday = () => {
        router.push('/dashboard')
    }

    // Capitalize first letter of month
    const monthName = format(currentDate, 'MMMM yyyy', { locale: es })
    const formattedDate = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    return (
        <div className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center gap-4 bg-surface-2 rounded-full p-1 pl-4 pr-1 shadow-sm border border-black/6">
                <span className="text-primary font-medium capitalize text-sm min-w-[100px] text-center">
                    {formattedDate}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-1.5 rounded-full hover:bg-black/5 text-secondary hover:text-primary transition-colors"
                        aria-label="Mes anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-1.5 rounded-full hover:bg-black/5 text-secondary hover:text-primary transition-colors"
                        aria-label="Mes siguiente"
                        disabled={isSameMonth(currentDate, addMonths(today, 12))} // Optional: limit future
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isCurrentMonth && (
                <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={resetToToday}
                    className="flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-primary-hover transition-colors bg-brand-primary/10 px-3 py-1 rounded-full"
                >
                    <RotateCcw className="w-3 h-3" />
                    Volver al presente
                </motion.button>
            )}
        </div>
    )
}
