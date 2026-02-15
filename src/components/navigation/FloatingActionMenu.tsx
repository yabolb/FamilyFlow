'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Zap, Calendar } from 'lucide-react'
import { useDrawer } from '@/context'

export default function FloatingActionMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const { openExpenseDrawer, openFixedDrawer, isExpenseDrawerOpen, isFixedDrawerOpen } = useDrawer()

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const toggleMenu = () => setIsOpen(!isOpen)

    const handleAction = (action: () => void) => {
        setIsOpen(false)
        action()
    }

    const actions = [
        {
            label: 'Gasto Fijo',
            icon: Calendar,
            color: 'bg-purple-500',
            onClick: () => handleAction(openFixedDrawer),
        },
        {
            label: 'Gasto Variable',
            icon: Zap,
            color: 'bg-amber-500',
            onClick: () => handleAction(openExpenseDrawer),
        },
    ]

    // Conditionally hide the menu if any drawer is open
    // Placed strictly after all hooks to avoid Runtime Error
    if (isExpenseDrawerOpen || isFixedDrawerOpen) return null

    return (
        <div className="fixed bottom-[36px] left-1/2 -translate-x-1/2 z-[60] transition-all" ref={menuRef}>
            <div className="relative flex flex-col items-center">
                {/* Sub-buttons */}
                <AnimatePresence>
                    {isOpen && (
                        <div className="absolute bottom-[80px] flex flex-col items-center gap-4 mb-2 w-max">
                            {actions.map((action, index) => (
                                <motion.div
                                    key={action.label}
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30,
                                        delay: (actions.length - index - 1) * 0.05
                                    }}
                                    className="flex items-center gap-3 self-center"
                                >
                                    <span className="surface-2 text-primary text-[10px] font-medium px-3 py-1.5 border border-white/20 shadow-lg uppercase tracking-wider rounded-lg">
                                        {action.label}
                                    </span>
                                    <button
                                        onClick={action.onClick}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl backdrop-blur-md border border-white/20 transition-transform active:scale-95 ${action.color}`}
                                    >
                                        <action.icon className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {/* Main Button */}
                <motion.button
                    onClick={toggleMenu}
                    whileTap={{ scale: 0.9 }}
                    animate={{ rotate: isOpen ? 135 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={`fab-center transition-colors relative
            ${isOpen
                            ? 'bg-surface-3 border border-gray-200 text-secondary'
                            : 'bg-brand-primary text-white border-4 border-[hsl(var(--surface-1))]'
                        }`}
                >
                    <Plus className="w-8 h-8" strokeWidth={2.5} />
                </motion.button>
            </div>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 -z-10 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
