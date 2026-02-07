'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Home, UserPlus, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type OnboardingStep = 'loading' | 'choose' | 'create' | 'join'
type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState<OnboardingStep>('loading')
    const [familyName, setFamilyName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [state, setState] = useState<LoadingState>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const [userId, setUserId] = useState<string | null>(null)

    const supabase = createClient()

    // Check auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUserId(user.id)

            // Check if user already has a family
            const { data: profile } = await supabase
                .from('users')
                .select('family_id')
                .eq('id', user.id)
                .single()

            if (profile?.family_id) {
                router.push('/dashboard')
                return
            }

            setStep('choose')
        }

        checkAuth()
    }, [supabase, router])

    const ensureUserProfile = async (userId: string, email: string) => {
        // Check if profile exists
        const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single()

        if (!existingProfile) {
            // Create profile if trigger didn't work
            const { error } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    email: email,
                    full_name: email.split('@')[0],
                    family_id: null,
                    is_family_admin: false
                })

            if (error && error.code !== '23505') { // Ignore duplicate key error
                throw error
            }
        }
    }

    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!familyName.trim() || !userId) return

        setState('loading')
        setErrorMessage('')

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // Ensure user profile exists
            await ensureUserProfile(user.id, user.email!)

            // Create family
            const { data: family, error: familyError } = await supabase
                .from('families')
                .insert({ name: familyName.trim() })
                .select()
                .single()

            if (familyError) throw familyError

            // Update user with family_id and make them admin
            const { error: userError } = await supabase
                .from('users')
                .update({
                    family_id: family.id,
                    is_family_admin: true
                })
                .eq('id', user.id)

            if (userError) throw userError

            setState('success')

            // Redirect to dashboard
            setTimeout(() => {
                router.push('/dashboard')
            }, 1000)

        } catch (error: unknown) {
            console.error('Create family error:', JSON.stringify(error, null, 2))
            setState('error')
            // Handle Supabase error format
            if (error && typeof error === 'object' && 'message' in error) {
                setErrorMessage((error as { message: string }).message)
            } else if (error instanceof Error) {
                setErrorMessage(error.message)
            } else {
                setErrorMessage('Error al crear la familia. Verifica los permisos.')
            }
        }
    }

    const handleJoinFamily = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!inviteCode.trim() || !userId) return

        setState('loading')
        setErrorMessage('')

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // Ensure user profile exists
            await ensureUserProfile(user.id, user.email!)

            // Find family by invite code
            const { data: family, error: familyError } = await supabase
                .from('families')
                .select('id, name')
                .eq('invite_code', inviteCode.trim().toUpperCase())
                .single()

            if (familyError || !family) {
                setState('error')
                setErrorMessage('Código de invitación no válido')
                return
            }

            // Update user with family_id
            const { error: userError } = await supabase
                .from('users')
                .update({ family_id: family.id })
                .eq('id', user.id)

            if (userError) throw userError

            setState('success')

            // Redirect to dashboard
            setTimeout(() => {
                router.push('/dashboard')
            }, 1000)

        } catch (error) {
            console.error('Join family error:', error)
            setState('error')
            setErrorMessage(error instanceof Error ? error.message : 'Error al unirse a la familia')
        }
    }

    // Loading state
    if (step === 'loading') {
        return (
            <div className="min-h-dvh bg-gradient-mesh flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-dvh bg-gradient-mesh flex flex-col items-center justify-center p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
            >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">¡Bienvenido a FamilyFlow!</h1>
                <p className="text-gray-400 text-sm">Configura tu espacio familiar</p>
            </motion.div>

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full max-w-sm"
            >
                <div className="glass-panel p-8">
                    <AnimatePresence mode="wait">
                        {/* Step: Choose */}
                        {step === 'choose' && (
                            <motion.div
                                key="choose"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <h2 className="text-lg font-semibold text-white text-center mb-6">
                                    ¿Cómo quieres empezar?
                                </h2>

                                <button
                                    onClick={() => setStep('create')}
                                    className="w-full p-4 glass-card flex items-center gap-4 hover:bg-white/10 transition-colors text-left"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Home className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Crear mi familia</p>
                                        <p className="text-gray-400 text-sm">Soy el primero en registrarme</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-500" />
                                </button>

                                <button
                                    onClick={() => setStep('join')}
                                    className="w-full p-4 glass-card flex items-center gap-4 hover:bg-white/10 transition-colors text-left"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <UserPlus className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Unirme a una familia</p>
                                        <p className="text-gray-400 text-sm">Tengo un código de invitación</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-500" />
                                </button>
                            </motion.div>
                        )}

                        {/* Step: Create Family */}
                        {step === 'create' && (
                            <motion.form
                                key="create"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleCreateFamily}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('choose'); setState('idle'); setErrorMessage(''); }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                                    </button>
                                    <h2 className="text-lg font-semibold text-white">
                                        Crear mi familia
                                    </h2>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="familyName" className="text-sm text-gray-300">
                                        Nombre de tu familia
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            id="familyName"
                                            type="text"
                                            value={familyName}
                                            onChange={(e) => setFamilyName(e.target.value)}
                                            placeholder="Familia García"
                                            className="input pl-11"
                                            required
                                            disabled={state === 'loading' || state === 'success'}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Error Message */}
                                <AnimatePresence>
                                    {state === 'error' && errorMessage && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-red-400 text-sm text-center"
                                        >
                                            {errorMessage}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={state === 'loading' || state === 'success' || !familyName.trim()}
                                    className="btn btn-primary w-full"
                                >
                                    {state === 'loading' ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creando...
                                        </>
                                    ) : state === 'success' ? (
                                        <>
                                            ✓ ¡Familia creada!
                                        </>
                                    ) : (
                                        <>
                                            Crear familia y empezar
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}

                        {/* Step: Join Family */}
                        {step === 'join' && (
                            <motion.form
                                key="join"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleJoinFamily}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('choose'); setState('idle'); setErrorMessage(''); }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                                    </button>
                                    <h2 className="text-lg font-semibold text-white">
                                        Unirme a una familia
                                    </h2>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="inviteCode" className="text-sm text-gray-300">
                                        Código de invitación
                                    </label>
                                    <input
                                        id="inviteCode"
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        placeholder="ABCD1234"
                                        className="input text-center text-xl tracking-widest font-mono uppercase"
                                        maxLength={8}
                                        required
                                        disabled={state === 'loading' || state === 'success'}
                                        autoFocus
                                    />
                                    <p className="text-gray-500 text-xs text-center">
                                        Pide el código al administrador de tu familia
                                    </p>
                                </div>

                                {/* Error Message */}
                                <AnimatePresence>
                                    {state === 'error' && errorMessage && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-red-400 text-sm text-center"
                                        >
                                            {errorMessage}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={state === 'loading' || state === 'success' || inviteCode.length < 8}
                                    className="btn btn-success w-full"
                                >
                                    {state === 'loading' ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Buscando...
                                        </>
                                    ) : state === 'success' ? (
                                        <>
                                            ✓ ¡Bienvenido!
                                        </>
                                    ) : (
                                        <>
                                            Unirme
                                            <UserPlus className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
