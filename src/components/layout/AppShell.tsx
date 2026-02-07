'use client'

import { DrawerProvider, useDrawer } from '@/context'
import { BottomNav, FloatingActionMenu, SideNav } from '@/components/navigation'
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
            <SideNav />

            {/* Main content with bottom padding for nav */}
            <main className="pb-24 md:pb-0 md:pl-64 transition-all duration-300">
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
