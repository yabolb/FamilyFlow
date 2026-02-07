'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    Copy,
    Check,
    LogOut,
    Crown,
    Moon,
    Sun,
    Monitor,
    Link2,
    UserPlus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as UserType, Family } from '@/types'

interface Member {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    is_family_admin: boolean
}

interface ProfileClientProps {
    user: UserType
    family: Family
    members: Member[]
}

type ThemePreference = 'dark' | 'light' | 'system'

export default function ProfileClient({ user, family, members }: ProfileClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [codeCopied, setCodeCopied] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)
    const [theme, setTheme] = useState<ThemePreference>('dark')
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as ThemePreference | null
        if (savedTheme) {
            setTheme(savedTheme)
            applyTheme(savedTheme)
        }
    }, [])

    const applyTheme = (newTheme: ThemePreference) => {
        if (newTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.classList.toggle('dark', prefersDark)
        } else {
            document.documentElement.classList.toggle('dark', newTheme === 'dark')
        }
    }

    const setThemePreference = (newTheme: ThemePreference) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        applyTheme(newTheme)
    }

    const displayToast = (message: string) => {
        setToastMessage(message)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
    }

    const copyInviteCode = async () => {
        try {
            await navigator.clipboard.writeText(family.invite_code)
            setCodeCopied(true)
            displayToast('Código copiado al portapapeles')
            setTimeout(() => setCodeCopied(false), 2000)
        } catch {
            console.error('Failed to copy')
        }
    }

    const copyInviteLink = async () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const inviteUrl = `${baseUrl}/onboarding?invite=${family.invite_code}`
        try {
            await navigator.clipboard.writeText(inviteUrl)
            setLinkCopied(true)
            displayToast('¡Enlace de invitación copiado!')
            setTimeout(() => setLinkCopied(false), 2000)
        } catch {
            console.error('Failed to copy')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const themeOptions: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
        { value: 'dark', label: 'Oscuro', icon: <Moon className="w-4 h-4" /> },
        { value: 'light', label: 'Claro', icon: <Sun className="w-4 h-4" /> },
        { value: 'system', label: 'Sistema', icon: <Monitor className="w-4 h-4" /> },
    ]

    return (
        <div className="px-5 pt-12 pb-24">
            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 
                                   bg-green-500/90 backdrop-blur-sm text-white 
                                   px-5 py-3 rounded-full shadow-lg
                                   flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="mb-8">
                <p className="text-gray-500 text-sm">Configuración</p>
                <h1 className="text-2xl font-bold text-white mt-1">Tu perfil</h1>
            </header>

            {/* User Card */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
            >
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                            {user.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-white">
                                    {user.full_name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold text-white truncate">{user.full_name}</h2>
                                {user.is_family_admin && (
                                    <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                )}
                            </div>
                            <p className="text-gray-400 text-sm truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Family Section */}
            <section className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    {family.name}
                </h3>

                {/* Invite Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-5 mb-4"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <UserPlus className="w-5 h-5 text-blue-400" />
                        <h4 className="text-white font-medium">Invitar a la familia</h4>
                    </div>

                    {/* Invite Code Display */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 mb-4">
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Código</p>
                            <p className="text-2xl font-mono font-bold text-white tracking-[0.3em]">
                                {family.invite_code}
                            </p>
                        </div>
                        <button
                            onClick={copyInviteCode}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95"
                        >
                            {codeCopied ? (
                                <Check className="w-5 h-5 text-green-400" />
                            ) : (
                                <Copy className="w-5 h-5 text-gray-400" />
                            )}
                        </button>
                    </div>

                    {/* Copy Link Button */}
                    <button
                        onClick={copyInviteLink}
                        className="w-full py-3 px-4 rounded-xl bg-blue-500/20 border border-blue-500/30
                                   text-blue-400 font-medium text-sm
                                   flex items-center justify-center gap-2
                                   hover:bg-blue-500/30 transition-all active:scale-[0.98]"
                    >
                        {linkCopied ? (
                            <>
                                <Check className="w-4 h-4" />
                                ¡Enlace copiado!
                            </>
                        ) : (
                            <>
                                <Link2 className="w-4 h-4" />
                                Copiar enlace de invitación
                            </>
                        )}
                    </button>

                    <p className="text-gray-500 text-xs text-center mt-3">
                        Comparte este enlace para añadir miembros a tu familia
                    </p>
                </motion.div>

                {/* Members List */}
                <div className="space-y-2">
                    {members.map((member, index) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-white/5"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                {member.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-sm font-semibold text-gray-400">
                                        {member.full_name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-medium truncate">{member.full_name}</p>
                                    {member.is_family_admin && (
                                        <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                                    )}
                                    {member.id === user.id && (
                                        <span className="text-xs text-gray-500">(Tú)</span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-sm truncate">{member.email}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Theme Selector */}
            <section className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Apariencia</h3>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-2"
                >
                    <div className="grid grid-cols-3 gap-2">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setThemePreference(option.value)}
                                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl transition-all ${theme === option.value
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {option.icon}
                                <span className="text-xs font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Logout */}
            <section>
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    onClick={handleLogout}
                    className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20
                               flex items-center justify-center gap-3 
                               text-red-400 font-medium
                               hover:bg-red-500/20 transition-all active:scale-[0.98]"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar sesión
                </motion.button>
            </section>
        </div>
    )
}
