'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2, Mail, Lock } from 'lucide-react'

function LoginContent() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error

            // Redirigir a la URL de redirect o al dashboard por defecto
            const redirectUrl = searchParams.get('redirect') || '/dashboard'
            router.push(redirectUrl)
            router.refresh()
        } catch (error: unknown) {
            console.error(error)
            const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-dark relative overflow-hidden">

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-brand-primary rounded-2xl inline-flex items-center justify-center mb-6 shadow-lg">
                        <span className="text-white text-3xl font-bold">✨</span>
                    </div>
                    <h1 className="text-h1 mb-2">Family Fin</h1>
                    <p className="text-body">Gestiona las finanzas de tu familia</p>
                </div>

                <div className="glass-panel">
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="field-group">
                            <label className="text-label">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input input-icon"
                                    placeholder="tu@email.com"
                                    required
                                />
                                <Mail className="input-icon-glyph" />
                            </div>
                        </div>

                        <div className="field-group">
                            <label className="text-label">Contraseña</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input input-icon"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="input-icon-glyph" />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-500/20 text-success' : 'bg-red-500/20 text-error'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full shadow-lg"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar sesión'}
                            </button>
                        </div>
                    </form>

                    {/* Link to Signup */}
                    <div className="auth-footer">
                        <Link
                            href={(() => {
                                const redirect = searchParams.get('redirect')
                                if (redirect?.includes('invite=')) {
                                    const inviteMatch = redirect.match(/invite=([A-Z0-9]+)/i)
                                    if (inviteMatch) return `/signup?invite=${inviteMatch[1]}`
                                }
                                return '/signup'
                            })()}
                            className="text-meta hover:text-primary transition-colors"
                        >
                            ¿No tienes cuenta? <span className="text-brand-primary">Regístrate</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-dvh flex items-center justify-center bg-gradient-dark">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
