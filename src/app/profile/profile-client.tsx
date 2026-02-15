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



    return (
        <div className="px-5 pt-12">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-tertiary" />
                    <p className="text-tertiary text-sm">Configuración</p>
                </div>
                <h1 className="text-h1">Tu perfil</h1>
            </header>

            {/* User Card */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
            >
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
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
                                <h2 className="text-xl font-semibold text-primary truncate">{user.full_name}</h2>
                                {user.is_family_admin && (
                                    <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                )}
                            </div>
                            <p className="text-secondary text-sm truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Family Section */}
            <section className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" />
                    {family.name}
                </h3>

                {/* Invite Code */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-4 mb-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary text-sm">Código de invitación</p>
                            <p className="text-xl font-mono font-bold text-primary tracking-widest mt-1">
                                {family.invite_code}
                            </p>
                        </div>
                        <button
                            onClick={copyInviteCode}
                            className="p-3 rounded-xl bg-surface-3 hover:bg-black/5 transition-colors"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-400" />
                            ) : (
                                <Copy className="w-5 h-5 text-secondary" />
                            )}
                        </button>
                    </div>
                    <p className="text-tertiary text-xs mt-3">
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
                            className="flex items-center gap-3 p-4 rounded-xl bg-surface-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0">
                                {member.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-sm font-semibold text-secondary">
                                        {member.full_name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-primary font-medium truncate">{member.full_name}</p>
                                    {member.is_family_admin && (
                                        <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                                    )}
                                    {member.id === user.id && (
                                        <span className="text-xs text-tertiary">(Tú)</span>
                                    )}
                                </div>
                                <p className="text-tertiary text-sm truncate">{member.email}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Settings */}
            <section className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Ajustes</h3>

                <div className="space-y-2">

                    {/* Logout */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        onClick={handleLogout}
                        className="w-full p-4 rounded-xl bg-surface-3 flex items-center gap-4 text-error hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="flex-1 text-left">Cerrar sesión</span>
                        <ChevronRight className="w-5 h-5 text-tertiary" />
                    </motion.button>
                </div>
            </section>
        </div>
    )
}
