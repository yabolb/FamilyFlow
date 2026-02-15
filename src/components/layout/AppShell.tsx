'use client'

import { DrawerProvider, useDrawer } from '@/context'
import { BottomNav, FloatingActionMenu } from '@/components/navigation'
import { AddExpenseDrawer, AddFixedExpenseDrawer } from '@/components/expenses'
import { FeedbackWidget } from '@/components/feedback'

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
            <main className="pb-28 transition-all duration-300">
                {children}
            </main>

            {/* Global Floating Action Menu (Variable & Fixed) */}
            <FloatingActionMenu />
            <BottomNav />

            {/* Feedback Widget — appears on all screens when eligible */}
            <FeedbackWidget />

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
