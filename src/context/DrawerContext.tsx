'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DrawerContextType {
    isExpenseDrawerOpen: boolean
    openExpenseDrawer: () => void
    closeExpenseDrawer: () => void
    toggleExpenseDrawer: () => void
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined)

export function DrawerProvider({ children }: { children: ReactNode }) {
    const [isExpenseDrawerOpen, setIsExpenseDrawerOpen] = useState(false)

    const openExpenseDrawer = useCallback(() => {
        setIsExpenseDrawerOpen(true)
    }, [])

    const closeExpenseDrawer = useCallback(() => {
        setIsExpenseDrawerOpen(false)
    }, [])

    const toggleExpenseDrawer = useCallback(() => {
        setIsExpenseDrawerOpen(prev => !prev)
    }, [])

    return (
        <DrawerContext.Provider
            value={{
                isExpenseDrawerOpen,
                openExpenseDrawer,
                closeExpenseDrawer,
                toggleExpenseDrawer
            }}
        >
            {children}
        </DrawerContext.Provider>
    )
}

export function useDrawer() {
    const context = useContext(DrawerContext)
    if (context === undefined) {
        throw new Error('useDrawer must be used within a DrawerProvider')
    }
    return context
}
