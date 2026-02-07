'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Zap, Calendar, X } from 'lucide-react'
import { useDrawer } from '@/context'

export default function FloatingActionMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const { openExpenseDrawer, openFixedDrawer } = useDrawer()

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

    return (
        <div className="fixed bottom-24 md:bottom-8 right-6 z-50" ref={menuRef}>
            <div className="relative flex flex-col items-center">
                {/* Sub-buttons */}
                <AnimatePresence>
                    {isOpen && (
                        <div className="flex flex-col items-center gap-4 mb-4">
                            {actions.map((action, index) => (
                                <motion.div
                                    key={action.label}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30,
                                        delay: (actions.length - index - 1) * 0.05
                                    }}
                                    className="flex items-center gap-3 self-end"
                                >
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-md border border-white/10 shadow-xl uppercase tracking-wider">
                                        {action.label}
                                    </span>
                                    <button
                                        onClick={action.onClick}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl backdrop-blur-md border border-white/20 transition-transform active:scale-95 ${action.color}/80 hover:${action.color}`}
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
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors
            ${isOpen
                            ? 'bg-zinc-800 border border-white/10 shadow-black/50'
                            : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/40'
                        }`}
                >
                    <Plus className="w-6 h-6" />
                </motion.button>
            </div>

            {/* Backdrop for mobile to catch clicks outside more easily */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 -z-10 bg-black/5 backdrop-blur-[2px]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
