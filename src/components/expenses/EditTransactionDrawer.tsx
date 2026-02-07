'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Check, Trash2 } from 'lucide-react'
import { updateTransaction, deleteTransaction, createCategory } from '@/lib/actions'
import { getCategories, groupCategoriesByType, type CategoryGroup } from '@/lib/data'
import type { Category, Transaction } from '@/types'
import { Plus } from 'lucide-react'

interface EditTransactionDrawerProps {
    isOpen: boolean
    onClose: () => void
    transaction: (Transaction & { category?: Category | null }) | null
}

export default function EditTransactionDrawer({ isOpen, onClose, transaction }: EditTransactionDrawerProps) {
    const [amount, setAmount] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isDeleting, startDeleteTransition] = useTransition()

    // Categories state
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [showAllCategories, setShowAllCategories] = useState(false)
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        const result = await createCategory({
            name: newCategoryName.trim(),
            icon: '📦', // Default icon
            type: 'variable'
        })

        if (result.success && result.category) {
            setAllCategories(prev => [...prev, result.category!])
            setSelectedCategory(result.category)
            setIsCreatingCategory(false)
            setNewCategoryName('')
        } else {
            setError(result.error || 'Error al crear la categoría')
        }
    }

    const amountInputRef = useRef<HTMLInputElement>(null)

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true)
            try {
                const categories = await getCategories()
                setAllCategories(categories)
                const groups = groupCategoriesByType(categories, 'variable')
                setCategoryGroups(groups)
            } catch (err) {
                console.error('Error loading categories:', err)
            } finally {
                setLoadingCategories(false)
            }
        }

        fetchCategories()
    }, [])

    // Update groups when showAllCategories changes
    useEffect(() => {
        const groups = groupCategoriesByType(allCategories, showAllCategories ? 'all' : 'variable')
        setCategoryGroups(groups)
    }, [showAllCategories, allCategories])

    // Load transaction data when drawer opens
    useEffect(() => {
        if (isOpen && transaction) {
            setAmount(transaction.amount.toString().replace('.', ','))
            setSelectedCategory(transaction.category || null)
            setDescription(transaction.description || '')
            // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
            const d = new Date(transaction.date)
            // Adjust to local timezone for the input value
            const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
            setDate(localIso)

            setTimeout(() => {
                amountInputRef.current?.focus()
            }, 300)
        }
    }, [isOpen, transaction])

    // Reset form when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setAmount('')
                setSelectedCategory(null)
                setDescription('')
                setDate('')
                setError('')
                setShowSuccess(false)
            }, 300)
        }
    }, [isOpen])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Allow only numbers and one decimal separator
        const sanitized = value.replace(/[^0-9.,]/g, '')
        // Replace multiple separators with single
        const parts = sanitized.split(/[.,]/)
        if (parts.length > 2) return
        setAmount(sanitized)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!transaction) return
        setError('')

        if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
            setError('Introduce un importe válido')
            return
        }

        if (!selectedCategory) {
            setError('Selecciona una categoría')
            return
        }

        const formData = new FormData()
        formData.set('id', transaction.id)
        formData.set('amount', amount)
        formData.set('category_id', selectedCategory.id)
        formData.set('description', description)
        formData.set('date', new Date(date).toISOString())

        startTransition(async () => {
            const result = await updateTransaction(formData)

            if (result.success) {
                setShowSuccess(true)
                setTimeout(() => {
                    onClose()
                }, 800)
            } else {
                setError(result.error || 'Error al actualizar')
            }
        })
    }

    const handleDelete = () => {
        if (!transaction) return
        if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return

        startDeleteTransition(async () => {
            const result = await deleteTransaction(transaction.id)
            if (result.success) {
                onClose()
            } else {
                setError(result.error || 'Error al eliminar')
            }
        })
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 
                       bg-zinc-900 rounded-t-3xl 
                       max-h-[90dvh] overflow-hidden
                       shadow-2xl shadow-black/50
                       border-t border-white/10"
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4">
                            <h2 className="text-xl font-semibold text-white">Editar gasto</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="px-6 pb-8 overflow-y-auto max-h-[calc(90dvh-5rem)]">
                            {/* Amount Input */}
                            <div className="mb-8">
                                <div className="flex items-center justify-center gap-2">
                                    <input
                                        ref={amountInputRef}
                                        type="text"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="0,00"
                                        className="text-5xl font-bold text-white text-center 
                               bg-transparent border-none outline-none
                               w-full max-w-xs
                               placeholder:text-gray-600"
                                    />
                                    <span className="text-3xl text-gray-400 font-medium">€</span>
                                </div>
                            </div>

                            {/* Category Selector */}
                            {loadingCategories ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                </div>
                            ) : (
                                <div className="mb-6">
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
                                                            className={`
                                flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl
                                transition-all duration-150
                                ${isSelected
                                                                    ? 'bg-blue-500/20 ring-2 ring-blue-500 scale-105'
                                                                    : 'bg-white/5 hover:bg-white/10'
                                                                }
                              `}
                                                        >
                                                            <span className="text-xl">{category.icon}</span>
                                                            <span className={`text-[10px] text-center leading-tight ${isSelected ? 'text-blue-300' : 'text-gray-500'}`}>
                                                                {category.name.split('/')[0]}
                                                            </span>
                                                        </button>
                                                    )
                                                })}

                                                {/* Add New Category Button */}
                                                {!isCreatingCategory ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCreatingCategory(true)}
                                                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 transition-all"
                                                    >
                                                        <Plus className="w-5 h-5 text-gray-400" />
                                                        <span className="text-[10px] text-gray-500">Nueva</span>
                                                    </button>
                                                ) : (
                                                    <div className="col-span-2 flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-blue-500/50">
                                                        <input
                                                            type="text"
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            placeholder="Nombre..."
                                                            autoFocus
                                                            className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-gray-600"
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
                                                            className="p-1.5 bg-blue-500 rounded-lg"
                                                            disabled={!newCategoryName.trim()}
                                                        >
                                                            <Plus className="w-3.5 h-3.5 text-white" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {!showAllCategories && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllCategories(true)}
                                            className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                        >
                                            + Ver todas las categorías
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Date Input */}
                            <div className="mb-6">
                                <label htmlFor="date" className="text-sm font-medium text-gray-400 block mb-2">
                                    Fecha
                                </label>
                                <input
                                    id="date"
                                    type="datetime-local"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                             text-white placeholder:text-gray-600
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                             transition-all"
                                />
                            </div>

                            {/* Description Input */}
                            <div className="mb-6">
                                <label htmlFor="description" className="text-sm font-medium text-gray-400 block mb-2">
                                    Concepto (opcional)
                                </label>
                                <input
                                    id="description"
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ej: Compra semanal"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                             text-white placeholder:text-gray-600
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                             transition-all"
                                />
                            </div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
                                    >
                                        <p className="text-red-400 text-sm text-center">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isPending || showSuccess || loadingCategories || isDeleting}
                                    className={`
                  w-full py-4 rounded-xl font-semibold text-lg
                  flex items-center justify-center gap-2
                  transition-all duration-200
                  ${showSuccess
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                                        }
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : showSuccess ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            ¡Guardado!
                                        </>
                                    ) : (
                                        'Actualizar gasto'
                                    )}
                                </button>

                                {/* Delete Button */}
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isPending || isDeleting}
                                    className="w-full py-3 rounded-xl font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                    Eliminar gasto
                                </button>
                            </div>

                            {/* Bottom safe area */}
                            <div className="h-safe-area-bottom" />
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
