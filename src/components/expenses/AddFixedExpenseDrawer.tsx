'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addFixedExpense, createCategory } from '@/lib/actions'
import { getCategories, groupCategoriesByType, type CategoryGroup } from '@/lib/data'
import type { Category, ExpenseTemplate } from '@/types'
import { Plus, X, Loader2, Check, Repeat, CalendarDays, ChevronDown } from 'lucide-react'
import { getEmojiForCategory } from '@/lib/emoji-mapper'
import dynamic from 'next/dynamic'

// Dynamically import EmojiPicker
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface AddFixedExpenseDrawerProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (template: ExpenseTemplate & { category?: Category | null }) => void
    defaultFrequency?: 'monthly' | 'annual'
}

export function AddFixedExpenseDrawer({
    isOpen,
    onClose,
    onSuccess,
    defaultFrequency = 'monthly'
}: AddFixedExpenseDrawerProps) {
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [frequency, setFrequency] = useState<'monthly' | 'annual'>(defaultFrequency)
    const [dueDay, setDueDay] = useState(1)
    const [dueMonth, setDueMonth] = useState(1)
    const [error, setError] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Categories
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [showAllCategories, setShowAllCategories] = useState(false)
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    // Emoji state
    const [newCategoryEmoji, setNewCategoryEmoji] = useState('📦')
    const [isManualEmoji, setIsManualEmoji] = useState(false)
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

    // Auto-update emoji from name
    useEffect(() => {
        if (!isManualEmoji && newCategoryName.trim()) {
            setNewCategoryEmoji(getEmojiForCategory(newCategoryName))
        } else if (!newCategoryName.trim() && !isManualEmoji) {
            setNewCategoryEmoji('📦')
        }
    }, [newCategoryName, isManualEmoji])

    // Reset emoji state when creation closes
    useEffect(() => {
        if (!isCreatingCategory) {
            setIsManualEmoji(false)
            setNewCategoryEmoji('📦')
            setIsEmojiPickerOpen(false)
            setNewCategoryName('')
        }
    }, [isCreatingCategory])

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        const icon = newCategoryEmoji

        const result = await createCategory({
            name: newCategoryName.trim(),
            icon: icon,
            type: 'fixed'
        })

        if (result.success && result.category) {
            setAllCategories(prev => [result.category!, ...prev])
            setSelectedCategory(result.category)
            setIsCreatingCategory(false)
            setNewCategoryName('')
        } else {
            setError(result.error || 'Error al crear la categoría')
        }
    }

    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true)
            const categories = await getCategories()
            setAllCategories(categories)
            const groups = groupCategoriesByType(categories, 'fixed')
            setCategoryGroups(groups)
            setLoadingCategories(false)
        }
        fetchCategories()
    }, [])

    // Update groups when showAllCategories changes
    useEffect(() => {
        const groups = groupCategoriesByType(allCategories, showAllCategories ? 'all' : 'fixed')
        setCategoryGroups(groups)
    }, [showAllCategories, allCategories])

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setFrequency(defaultFrequency)
        }
    }, [isOpen, defaultFrequency])

    // Reset form when closing
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setName('')
                setAmount('')
                setSelectedCategory(null)
                setDueDay(1)
                setDueMonth(1)
                setError('')
                setShowSuccess(false)
                setIsCreatingCategory(false)
                // Emoji states reset via useEffect [isCreatingCategory]
            }, 300)
        }
    }, [isOpen])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.,]/g, '')
        const parts = value.split(/[.,]/)
        if (parts.length > 2) return
        setAmount(value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const amountNum = parseFloat(amount.replace(',', '.'))

        if (!name.trim()) {
            setError('Introduce un nombre para el gasto')
            return
        }

        if (!amountNum || amountNum <= 0) {
            setError('Introduce un importe válido')
            return
        }

        let categoryId = selectedCategory?.id

        if (!categoryId && newCategoryName.trim()) {
            const icon = newCategoryEmoji
            const result = await createCategory({
                name: newCategoryName.trim(),
                icon: icon,
                type: 'fixed'
            })
            if (result.success && result.category) {
                categoryId = result.category.id
                setAllCategories(prev => [result.category!, ...prev])
                setSelectedCategory(result.category)
                setIsCreatingCategory(false)
                setNewCategoryName('')
            } else {
                setError(result.error || 'Error al crear la categoría')
                return
            }
        }

        if (!categoryId) {
            setError('Selecciona una categoría')
            return
        }

        startTransition(async () => {
            const result = await addFixedExpense({
                name: name.trim(),
                amount: amountNum,
                categoryId: categoryId!,
                frequency,
                dueDay,
                dueMonth: frequency === 'annual' ? dueMonth : undefined,
            })

            if (result.success) {
                setShowSuccess(true)

                if (onSuccess) {
                    const newTemplate: ExpenseTemplate & { category?: Category | null } = {
                        id: result.templateId!,
                        family_id: '',
                        name: name.trim(),
                        amount: amountNum,
                        category_id: categoryId!,
                        frequency,
                        due_day: dueDay,
                        due_month: frequency === 'annual' ? dueMonth : null,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        category: selectedCategory || allCategories.find(c => c.id === categoryId),
                    }
                    setTimeout(() => onSuccess(newTemplate), 600)
                } else {
                    setTimeout(onClose, 600)
                }
            } else {
                setError(result.error || 'Error al guardar')
            }
        })
    }

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[70]                        bg-surface-2 rounded-t-[24px] 
                       max-h-[90dvh] overflow-hidden
                       shadow-2xl shadow-black/10
                       border-t border-black/5"
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="sheet-handle" />
                        </div>

                        <div className="flex items-center justify-between px-gutter pb-4">
                            <h2 className="text-h2">Nuevo gasto fijo</h2>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
                                <X className="w-5 h-5 text-tertiary" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-gutter pb-8 overflow-y-auto max-h-[calc(90dvh-5rem)] stack-lg">
                            <div>
                                <label className="text-label block mb-2">
                                    Nombre del gasto
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Alquiler, Seguro Coche..."
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="text-label block mb-2">
                                    Importe
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="0,00"
                                        className="input text-2xl font-semibold"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary text-xl">€</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-label block mb-2">
                                    Frecuencia
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFrequency('monthly')}
                                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${frequency === 'monthly'
                                            ? 'bg-brand-primary text-white'
                                            : 'bg-surface-3 text-secondary hover:bg-black/5'
                                            }`}
                                    >
                                        <Repeat className="w-4 h-4" />
                                        Mensual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFrequency('annual')}
                                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${frequency === 'annual'
                                            ? 'bg-brand-primary text-white'
                                            : 'bg-surface-3 text-secondary hover:bg-black/5'
                                            }`}
                                    >
                                        <CalendarDays className="w-4 h-4" />
                                        Anual
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-label block mb-2">
                                    {frequency === 'monthly' ? 'Día del mes' : 'Fecha de vencimiento'}
                                </label>
                                <div className={`grid gap-2 ${frequency === 'annual' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    <div className="relative">
                                        <select
                                            value={dueDay}
                                            onChange={(e) => setDueDay(parseInt(e.target.value))}
                                            className="input appearance-none cursor-pointer"
                                        >
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <option key={day} value={day} className="bg-surface-2">
                                                    Día {day}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
                                    </div>

                                    {frequency === 'annual' && (
                                        <div className="relative">
                                            <select
                                                value={dueMonth}
                                                onChange={(e) => setDueMonth(parseInt(e.target.value))}
                                                className="input appearance-none cursor-pointer"
                                            >
                                                {months.map((month, i) => (
                                                    <option key={i} value={i + 1} className="bg-surface-2">
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-label block mb-2">
                                    Categoría
                                </label>
                                {loadingCategories ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {categoryGroups.map((group) => (
                                            <div key={group.title} className="mb-4">
                                                <div className="grid grid-cols-4 gap-2">
                                                    {group.categories.map((category) => {
                                                        const isSelected = selectedCategory?.id === category.id
                                                        return (
                                                            <button
                                                                key={category.id}
                                                                type="button"
                                                                onClick={() => setSelectedCategory(category)}
                                                                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl
                                          transition-all duration-150
                                          ${isSelected
                                                                        ? 'bg-brand-primary/10 opacity-100 ring-2 ring-brand-primary'
                                                                        : 'bg-surface-3 hover:bg-black/5'
                                                                    }`}
                                                            >
                                                                <span className="text-lg">{category.icon}</span>
                                                                <span className={`text-[9px] text-center leading-tight ${isSelected ? 'text-brand-primary' : 'text-tertiary'}`}>
                                                                    {category.name.split('/')[0]}
                                                                </span>
                                                            </button>
                                                        )
                                                    })}

                                                    {!isCreatingCategory ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCreatingCategory(true)}
                                                            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-surface-3 border border-dashed border-black/10 hover:bg-black/5 transition-all"
                                                        >
                                                            <Plus className="w-5 h-5 text-tertiary" />
                                                            <span className="text-[10px] text-tertiary">Nueva</span>
                                                        </button>
                                                    ) : (
                                                        <div className="col-span-4 flex items-center gap-2 bg-surface-3 p-2 rounded-xl border border-brand-primary/50">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                                                className="text-xl p-1 hover:bg-black/5 rounded transition-colors"
                                                                title="Cambiar emoji"
                                                            >
                                                                {newCategoryEmoji}
                                                            </button>

                                                            <input
                                                                type="text"
                                                                value={newCategoryName}
                                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                                placeholder="Nombre..."
                                                                autoFocus
                                                                className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-tertiary"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault()
                                                                        handleCreateCategory()
                                                                    }
                                                                    if (e.key === 'Escape') setIsCreatingCategory(false)
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleCreateCategory}
                                                                className="p-1.5 bg-brand-primary rounded-lg"
                                                                disabled={!newCategoryName.trim()}
                                                            >
                                                                <Plus className="w-3.5 h-3.5 text-white" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Full Emoji Picker — rendered outside the grid for full width */}
                                                {isCreatingCategory && isEmojiPickerOpen && (
                                                    <div className="mt-2 rounded-xl overflow-hidden border border-black/5">
                                                        <EmojiPicker
                                                            onEmojiClick={(emojiData) => {
                                                                setNewCategoryEmoji(emojiData.emoji)
                                                                setIsManualEmoji(true)
                                                                setIsEmojiPickerOpen(false)
                                                            }}
                                                            width="100%"
                                                            height={320}
                                                            previewConfig={{ showPreview: false }}
                                                            searchDisabled={false}
                                                            skinTonesDisabled={true}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {!showAllCategories && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllCategories(true)}
                                                className="w-full py-2 text-xs text-brand-primary hover:text-brand-primary-hover font-medium transition-colors"
                                            >
                                                + Ver todas las categorías
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 p-3 surface border border-red-500/30"
                                    >
                                        <p className="text-error text-sm text-center">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={isPending || showSuccess}
                                className={`btn w-full text-lg
                            ${showSuccess
                                        ? 'btn-success'
                                        : 'btn-primary'
                                    }
                            disabled:opacity-70`}
                            >
                                {isPending ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                                ) : showSuccess ? (
                                    <><Check className="w-5 h-5" /> ¡Guardado!</>
                                ) : (
                                    'Guardar gasto fijo'
                                )}
                            </button>

                            <div className="h-safe-area-bottom" />
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
