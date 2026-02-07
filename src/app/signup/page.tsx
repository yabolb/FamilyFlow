'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2, Mail, Lock, User, UserPlus, Sparkles } from 'lucide-react'

function SignupContent() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    const inviteCode = searchParams.get('invite')
    const hasInvite = Boolean(inviteCode)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        if (!fullName.trim()) {
            setMessage({ type: 'error', text: 'Por favor, introduce tu nombre' })
            setIsLoading(false)
            return
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
            setIsLoading(false)
            return
        }

        try {
            // 1. Create auth user (Trigger handle_new_user will create profile and join family if invite code is valid)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        invite_code: inviteCode // Pass invite code to metadata for trigger
                    }
                }
            })

            if (authError) throw authError

            if (!authData.user) {
                throw new Error('Error al crear la cuenta')
            }

            // 2. Redirect to onboarding
            // If trigger worked, user will already be in family -> onboarding will redirect to dashboard
            // If trigger didn't find family (invalid code), user will land on onboarding with invite param
            const redirectUrl = inviteCode
                ? `/onboarding?invite=${inviteCode}`
                : '/onboarding'

            router.push(redirectUrl)
            router.refresh()

        } catch (error: unknown) {
            console.error(error)
            let errorMessage = 'Error al crear la cuenta'

            if (error instanceof Error) {
                if (error.message.includes('already registered')) {
                    errorMessage = 'Este email ya está registrado. ¿Quieres iniciar sesión?'
                } else if (error.message.includes('security purposes') || error.message.includes('rate limit')) {
                    errorMessage = 'Has intentado registrarte demasiadas veces. Por favor espera 1 minuto.'
                } else {
                    errorMessage = error.message
                }
            }

            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setIsLoading(false)
        }
    }

    // Build login link preserving invite code
    const loginHref = inviteCode
        ? `/login?redirect=/onboarding?invite=${inviteCode}`
        : '/login'

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-dark relative overflow-hidden">
            {/* Background Shapes */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Crear cuenta</h1>
                    <p className="text-gray-400">
                        {hasInvite
                            ? 'Te han invitado a unirte a una familia'
                            : 'Gestiona las finanzas de tu familia'
                        }
                    </p>
                </div>

                {/* Invite Banner */}
                {hasInvite && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3"
                    >
                        <UserPlus className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <div>
                            <p className="text-green-300 text-sm font-medium">Invitación activa</p>
                            <p className="text-green-400/70 text-xs">
                                Código: <span className="font-mono font-bold">{inviteCode}</span>
                            </p>
                        </div>
                    </motion.div>
                )}

                <div className="glass-panel p-6 md:p-8">
                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Nombre completo</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="input pl-10"
                                    placeholder="Tu nombre"
                                    required
                                    autoFocus
                                />
                                <User className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-10"
                                    placeholder="tu@email.com"
                                    required
                                />
                                <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Contraseña</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10"
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                />
                                <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                            </div>
                        </div>

                        {/* Error/Success Message */}
                        {message && (
                            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success'
                                ? 'bg-green-500/20 text-green-200'
                                : 'bg-red-500/20 text-red-200'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full shadow-lg shadow-blue-500/20"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Crear cuenta'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <Link
                            href={loginHref}
                            className="text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            ¿Ya tienes cuenta? <span className="text-blue-400">Inicia sesión</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-dvh flex items-center justify-center bg-gradient-dark">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    )
}
