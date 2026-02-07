'use client'

import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDrawer } from '@/context'

export default function FloatingActionButton() {
    const { openExpenseDrawer } = useDrawer()

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.3
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openExpenseDrawer}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full 
                 bg-gradient-to-br from-blue-500 to-blue-600
                 shadow-lg shadow-blue-500/40
                 flex items-center justify-center
                 border border-blue-400/30
                 transition-shadow duration-200
                 hover:shadow-xl hover:shadow-blue-500/50
                 active:shadow-md
                 safe-area-right"
            aria-label="Añadir gasto"
        >
            <Plus className="w-7 h-7 text-white stroke-[2.5]" />

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl -z-10" />
        </motion.button>
    )
}
