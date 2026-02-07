'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'

interface NavItem {
    href: string
    icon: React.ElementType
    label: string
}

const navItems: NavItem[] = [
    { href: '/dashboard', icon: Home, label: 'Inicio' },
    { href: '/dashboard/recurrentes', icon: CalendarDays, label: 'Fijos' },
    { href: '/dashboard/perfil', icon: User, label: 'Perfil' },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-6">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-16 h-full"
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    y: isActive ? -2 : 0,
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="relative"
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -inset-2 bg-blue-500/20 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}

                                <Icon
                                    className={`relative w-6 h-6 transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-gray-500'
                                        }`}
                                />
                            </motion.div>

                            <span className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-gray-500'
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
