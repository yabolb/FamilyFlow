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
        <div className="screen pt-8 px-gutter">
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

            <div className="stack-lg">
                {/* Header */}
                <header>
                    <p className="text-sub">Configuración</p>
                    <h1 className="text-h1 mt-1">Tu perfil</h1>
                </header>

                {/* User Card */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="surface card-pad-md flex items-center gap-4"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 text-xl font-bold text-white">
                        {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user.full_name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-h2 truncate">{user.full_name}</h2>
                            {user.is_family_admin && (
                                <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-body text-secondary truncate">{user.email}</p>
                    </div>
                </motion.section>

                {/* Family Section */}
                <section className="stack">
                    <h3 className="text-h2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-tertiary" />
                        {family.name}
                    </h3>

                    {/* Invite Card */}
                    <div className="surface card-pad-md stack">
                        <div className="flex items-center gap-3">
                            <UserPlus className="w-5 h-5 text-brand-primary" />
                            <h4 className="text-body font-medium">Invitar a la familia</h4>
                        </div>

                        <div className="surface-2 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-meta uppercase tracking-wide mb-1">Código</p>
                                <p className="text-2xl font-mono font-bold tracking-[0.2em] tabular-nums">
                                    {family.invite_code}
                                </p>
                            </div>
                            <button
                                onClick={copyInviteCode}
                                className="p-3 rounded-xl hover:bg-white/5 transition-all active:scale-95 text-secondary hover:text-white"
                            >
                                {codeCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        <button
                            onClick={copyInviteLink}
                            className="btn btn-ghost w-full justify-center text-sm"
                        >
                            {linkCopied ? (
                                <> <Check className="w-4 h-4" /> ¡Enlace copiado! </>
                            ) : (
                                <> <Link2 className="w-4 h-4" /> Copiar enlace de invitación </>
                            )}
                        </button>
                    </div>

                    {/* Members List */}
                    <div className="surface">
                        {members.map((member) => (
                            <div key={member.id} className="list-row px-4 last:border-0">
                                <div className="list-left">
                                    <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 text-secondary font-medium">
                                        {member.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            member.full_name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="list-content">
                                        <div className="flex items-center gap-2">
                                            <p className="text-body font-medium">{member.full_name}</p>
                                            {member.is_family_admin && <Crown className="w-3 h-3 text-yellow-400" />}
                                            {member.id === user.id && <span className="text-meta">(Tú)</span>}
                                        </div>
                                        <p className="text-meta">{member.email}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Theme & Logout */}
                <section className="stack">
                    <h3 className="text-h2">Ajustes</h3>

                    <div className="surface p-2 grid grid-cols-3 gap-2">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setThemePreference(option.value as ThemePreference)}
                                className={`flex flex-col items-center justify-center gap-2 py-3 rounded-lg transition-all text-sm font-medium ${theme === option.value
                                    ? 'bg-brand-primary text-white shadow-md'
                                    : 'text-secondary hover:bg-surface-3 hover:text-white'
                                    }`}
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost text-error hover:bg-error/10 w-full justify-center mt-4"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar sesión
                    </button>
                </section>
            </div>
        </div>
    )
}
