import { Home, User, CalendarDays } from 'lucide-react'

export interface NavItem {
    href: string
    icon: React.ElementType
    label: string
}

export const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', icon: Home, label: 'Inicio' },
    { href: '/dashboard/recurrentes', icon: CalendarDays, label: 'Fijos' },
    { href: '/dashboard/perfil', icon: User, label: 'Perfil' },
]
