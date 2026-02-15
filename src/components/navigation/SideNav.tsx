'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { NAV_ITEMS } from './constants'

export default function SideNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed left-0 top-0 bottom-0 z-40 w-64 bg-surface-1 border-r border-black/5 hidden md:flex flex-col pt-8 pb-8 px-4 h-screen">
            <div className="mb-12 px-4">
                <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent block">
                    Family Fin
                </Link>
            </div>

            <div className="flex-1 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                                ${isActive
                                    ? 'text-primary font-medium bg-surface-2'
                                    : 'text-secondary hover:text-primary hover:bg-surface-2'
                                }
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeSideNav"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                />
                            )}
                            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-primary' : 'text-current group-hover:text-primary'}`} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </div>

            <div className="mt-auto px-4 pt-6 border-t border-black/5">
                <p className="text-xs text-secondary opacity-50">
                    v2.0 &copy; 2026
                </p>
            </div>
        </nav>
    )
}
