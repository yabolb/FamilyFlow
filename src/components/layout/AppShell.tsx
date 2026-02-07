'use client'

import { DrawerProvider, useDrawer } from '@/context'
import { BottomNav, FloatingActionButton } from '@/components/navigation'
import { AddExpenseDrawer } from '@/components/expenses'

function AppShellContent({ children }: { children: React.ReactNode }) {
    const { isExpenseDrawerOpen, closeExpenseDrawer } = useDrawer()

    return (
        <>
            {/* Main content with bottom padding for nav */}
            <main className="pb-24">
                {children}
            </main>

            {/* Fixed navigation elements */}
            <FloatingActionButton />
            <BottomNav />

            {/* Expense Drawer */}
            <AddExpenseDrawer
                isOpen={isExpenseDrawerOpen}
                onClose={closeExpenseDrawer}
            />
        </>
    )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <DrawerProvider>
            <div className="min-h-dvh bg-gradient-mesh">
                <AppShellContent>
                    {children}
                </AppShellContent>
            </div>
        </DrawerProvider>
    )
}
