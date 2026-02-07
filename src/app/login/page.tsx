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
            {/* Background Shapes */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <span className="text-white text-3xl font-bold">✨</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">FamilyFlow</h1>
                    <p className="text-gray-400">Gestiona las finanzas de tu familia</p>
                </div>

                <div className="glass-panel p-6 md:p-8">
                    <form onSubmit={handleLogin} className="space-y-4">
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

                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Contraseña</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full shadow-lg shadow-blue-500/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar sesión'}
                        </button>
                    </form>

                    {/* Link to Signup */}
                    <div className="mt-6 text-center">
                        <Link
                            href={(() => {
                                const redirect = searchParams.get('redirect')
                                if (redirect?.includes('invite=')) {
                                    const inviteMatch = redirect.match(/invite=([A-Z0-9]+)/i)
                                    if (inviteMatch) return `/signup?invite=${inviteMatch[1]}`
                                }
                                return '/signup'
                            })()}
                            className="text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            ¿No tienes cuenta? <span className="text-blue-400">Regístrate</span>
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
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
