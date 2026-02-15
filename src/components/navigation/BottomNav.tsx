'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { NAV_ITEMS } from './constants'

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="bottom-nav md:hidden">
            {/* Left Items */}
            <div className="flex gap-1">
                {NAV_ITEMS.slice(0, 2).map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <motion.div
                                initial={false}
                                animate={{ scale: isActive ? 1.1 : 1 }}
                                className="relative"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -inset-2 bg-brand-primary opacity-10 rounded-xl"
                                    />
                                )}
                                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                            </motion.div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>

            {/* Spacer for FAB */}
            <div className="w-16" />

            {/* Right Items */}
            <div className="flex gap-1">
                {NAV_ITEMS.slice(2).map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <motion.div
                                initial={false}
                                animate={{ scale: isActive ? 1.1 : 1 }}
                                className="relative"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -inset-2 bg-brand-primary opacity-10 rounded-xl"
                                    />
                                )}
                                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                            </motion.div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
