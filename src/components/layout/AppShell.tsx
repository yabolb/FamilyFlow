'use client'

import { DrawerProvider, useDrawer } from '@/context'
import { BottomNav, FloatingActionMenu } from '@/components/navigation'
import { AddExpenseDrawer, AddFixedExpenseDrawer } from '@/components/expenses'

function AppShellContent({ children }: { children: React.ReactNode }) {
    const {
        isExpenseDrawerOpen,
        closeExpenseDrawer,
        isFixedDrawerOpen,
        closeFixedDrawer
    } = useDrawer()

    return (
        <>
            {/* Main content with bottom padding for nav */}
            <main className="pb-24">
                {children}
            </main>

            {/* Global Floating Action Menu (Variable & Fixed) */}
            <FloatingActionMenu />
            <BottomNav />

            {/* Global Drawers */}
            <AddExpenseDrawer
                isOpen={isExpenseDrawerOpen}
                onClose={closeExpenseDrawer}
            />

            <AddFixedExpenseDrawer
                isOpen={isFixedDrawerOpen}
                onClose={closeFixedDrawer}
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
