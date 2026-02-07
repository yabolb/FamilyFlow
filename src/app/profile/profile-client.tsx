'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Users,
    Copy,
    Check,
    LogOut,
    Crown,
    ChevronRight,
    Moon,
    Sun,
    Settings
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

export default function ProfileClient({ user, family, members }: ProfileClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [copied, setCopied] = useState(false)
    const [isDark, setIsDark] = useState(true)

    const copyInviteCode = async () => {
        try {
            await navigator.clipboard.writeText(family.invite_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            console.error('Failed to copy')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const toggleDarkMode = () => {
        setIsDark(!isDark)
        document.documentElement.classList.toggle('dark')
    }

    return (
        <div className="px-5 pt-12">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <p className="text-gray-500 text-sm">Configuración</p>
                </div>
                <h1 className="text-2xl font-bold text-white">Tu perfil</h1>
            </header>

            {/* User Card */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
            >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
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

                {/* Invite Code */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Código de invitación</p>
                            <p className="text-xl font-mono font-bold text-white tracking-widest mt-1">
                                {family.invite_code}
                            </p>
                        </div>
                        <button
                            onClick={copyInviteCode}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-400" />
                            ) : (
                                <Copy className="w-5 h-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-3">
                        Comparte este código para añadir miembros a tu familia
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

            {/* Settings */}
            <section className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Ajustes</h3>

                <div className="space-y-2">
                    {/* Dark Mode Toggle */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={toggleDarkMode}
                        className="w-full p-4 rounded-xl bg-white/5 flex items-center gap-4 hover:bg-white/8 transition-colors"
                    >
                        {isDark ? (
                            <Moon className="w-5 h-5 text-blue-400" />
                        ) : (
                            <Sun className="w-5 h-5 text-yellow-400" />
                        )}
                        <span className="text-white flex-1 text-left">Modo oscuro</span>
                        <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isDark ? 'bg-blue-500' : 'bg-gray-600'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isDark ? 'translate-x-5' : ''}`} />
                        </div>
                    </motion.button>

                    {/* Logout */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        onClick={handleLogout}
                        className="w-full p-4 rounded-xl bg-white/5 flex items-center gap-4 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="flex-1 text-left">Cerrar sesión</span>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </motion.button>
                </div>
            </section>
        </div>
    )
}
