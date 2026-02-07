import {
    Home,
    Zap,
    Wifi,
    Droplets,
    Building,
    ShoppingCart,
    Car,
    Utensils,
    Heart,
    Shirt,
    Gift,
    Users,
    Plane,
    Gamepad2,
    GraduationCap,
    Shield,
    Wallet,
    MoreHorizontal,
    type LucideIcon
} from 'lucide-react'

export interface CategoryItem {
    id: string
    name: string
    icon: LucideIcon
    emoji: string
    group: 'housing' | 'daily'
}

// These map to the categories in the database
// IDs should match your Supabase categories table
export const EXPENSE_CATEGORIES: CategoryItem[] = [
    // Vivienda (Housing)
    { id: 'rent', name: 'Alquiler/Hipoteca', icon: Home, emoji: '🏠', group: 'housing' },
    { id: 'electricity', name: 'Luz', icon: Zap, emoji: '⚡', group: 'housing' },
    { id: 'water', name: 'Agua', icon: Droplets, emoji: '💧', group: 'housing' },
    { id: 'gas', name: 'Gas', icon: Building, emoji: '🔥', group: 'housing' },
    { id: 'internet', name: 'Internet/Móvil', icon: Wifi, emoji: '📱', group: 'housing' },
    { id: 'insurance', name: 'Seguros', icon: Shield, emoji: '🛡️', group: 'housing' },

    // Vida Diaria (Daily Life)
    { id: 'groceries', name: 'Supermercado', icon: ShoppingCart, emoji: '🛒', group: 'daily' },
    { id: 'transport', name: 'Transporte', icon: Car, emoji: '🚗', group: 'daily' },
    { id: 'dining', name: 'Restaurantes', icon: Utensils, emoji: '🍽️', group: 'daily' },
    { id: 'health', name: 'Salud', icon: Heart, emoji: '❤️', group: 'daily' },
    { id: 'clothing', name: 'Ropa', icon: Shirt, emoji: '👕', group: 'daily' },
    { id: 'gifts', name: 'Regalos', icon: Gift, emoji: '🎁', group: 'daily' },
    { id: 'kids', name: 'Niños', icon: Users, emoji: '👶', group: 'daily' },
    { id: 'travel', name: 'Viajes', icon: Plane, emoji: '✈️', group: 'daily' },
    { id: 'entertainment', name: 'Ocio', icon: Gamepad2, emoji: '🎮', group: 'daily' },
    { id: 'education', name: 'Educación', icon: GraduationCap, emoji: '📚', group: 'daily' },
    { id: 'subscriptions', name: 'Suscripciones', icon: Wallet, emoji: '💳', group: 'daily' },
    { id: 'other', name: 'Otros', icon: MoreHorizontal, emoji: '📦', group: 'daily' },
]

export const HOUSING_CATEGORIES = EXPENSE_CATEGORIES.filter(c => c.group === 'housing')
export const DAILY_CATEGORIES = EXPENSE_CATEGORIES.filter(c => c.group === 'daily')
