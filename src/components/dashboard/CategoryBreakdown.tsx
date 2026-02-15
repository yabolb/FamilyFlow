'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CategorySpend {
    name: string
    icon: string
    total: number
}

interface CategoryBreakdownProps {
    categories: CategorySpend[]
}

const MAX_VISIBLE = 3

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
    const [showAll, setShowAll] = useState(false)

    if (categories.length === 0) return null

    const maxSpend = categories[0]?.total ?? 1
    const visible = showAll ? categories : categories.slice(0, MAX_VISIBLE)
    const hasMore = categories.length > MAX_VISIBLE

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)

    return (
        <section>
            <h2 className="text-h2 mb-4">Gasto por categoría</h2>
            <div className="surface card-pad stack">
                {visible.map((cat) => {
                    const pct = Math.max((cat.total / maxSpend) * 100, 4)
                    return (
                        <div key={cat.name} className="flex items-center gap-3">
                            {/* Icon */}
                            <span className="text-lg w-8 text-center flex-shrink-0">{cat.icon}</span>

                            {/* Name + Bar */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-sm font-medium text-primary truncate">{cat.name}</span>
                                    <span className="text-sm tabular-nums text-secondary ml-2 flex-shrink-0">
                                        {formatCurrency(cat.total)} €
                                    </span>
                                </div>
                                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-primary rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Show more / less */}
                {hasMore && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center justify-center gap-1 text-meta hover:text-primary transition-colors pt-2 w-full border-t border-black/5"
                    >
                        {showAll ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                <span>Ocultar</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                <span>Ver todas ({categories.length})</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </section>
    )
}
