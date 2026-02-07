import { Home, User, CalendarDays, Sparkles } from 'lucide-react'

export interface NavItem {
    href: string
    icon: React.ElementType
    label: string
}

export const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', icon: Home, label: 'Inicio' },
    { href: '/dashboard/recurrentes', icon: CalendarDays, label: 'Fijos' },
    { href: '/dashboard/inteligencia', icon: Sparkles, label: 'Inteligencia' },
    { href: '/dashboard/perfil', icon: User, label: 'Perfil' },
]
