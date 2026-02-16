'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, Check, MessageCircleHeart } from 'lucide-react'
import { checkFeedbackEligibility, submitFeedback } from '@/lib/actions/feedback'

type FeedbackStep = 'options' | 'comment' | 'success'
type DisplayMode = 'hidden' | 'button' | 'modal'

const FEEDBACK_OPTIONS = [
    { key: 'rapidez', icon: '⚡', label: 'La rapidez al anotar' },
    { key: 'gastos_fijos', icon: '📅', label: 'Ver los gastos fijos' },
    { key: 'compartir', icon: '👥', label: 'Compartir con mi pareja' },
]

const DISMISSED_KEY = 'ff_feedback_dismissed'
const DISMISS_THRESHOLD = 5

export default function FeedbackWidget() {
    const [displayMode, setDisplayMode] = useState<DisplayMode>('hidden')
    const [step, setStep] = useState<FeedbackStep>('options')
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [comment, setComment] = useState('')
    const [isPending, startTransition] = useTransition()
    const [hasResponded, setHasResponded] = useState(false)

    // Check eligibility on mount
    useEffect(() => {
        const check = async () => {
            try {
                const eligibility = await checkFeedbackEligibility()

                // User already gave feedback → show button in top-right
                if (eligibility.hasResponded) {
                    setHasResponded(true)
                    setDisplayMode('button')
                    return
                }

                // Check localStorage for dismissals
                const dismissed = localStorage.getItem(DISMISSED_KEY)

                if (dismissed) {
                    // Was dismissed — only show again after DISMISS_THRESHOLD
                    if (eligibility.transactionCount >= DISMISS_THRESHOLD) {
                        setDisplayMode('button')
                    }
                    return
                }

                // Not dismissed, not responded — auto-open modal on first eligibility
                if (eligibility.shouldShow) {
                    setDisplayMode('modal')
                }
            } catch {
                // Silently fail — feedback is not critical
            }
        }

        check()
    }, [])

    const openModal = useCallback(() => {
        setDisplayMode('modal')
        setStep('options')
        setSelectedOption(null)
        setComment('')
    }, [])

    const closeModal = useCallback(() => {
        if (!hasResponded && step === 'options') {
            // User dismissed without responding
            localStorage.setItem(DISMISSED_KEY, 'true')
        }
        setDisplayMode(hasResponded ? 'button' : 'hidden')
    }, [hasResponded, step])

    const handleOptionSelect = (key: string) => {
        setSelectedOption(key)
        setStep('comment')
    }

    const handleSubmit = () => {
        if (!selectedOption) return

        startTransition(async () => {
            const result = await submitFeedback(selectedOption, comment)
            if (result.success) {
                setStep('success')
                setHasResponded(true)
                setTimeout(() => {
                    setDisplayMode('button')
                }, 2000)
            }
        })
    }



    // Nothing to show
    if (displayMode === 'hidden') return null

    return (
        <>
            {/* Floating Feedback Button — top-right pill, visible on all screens */}
            <AnimatePresence>
                {displayMode === 'button' && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={openModal}
                        className="feedback-trigger"
                        aria-label="Danos tu feedback"
                        id="feedback-trigger-btn"
                    >
                        <MessageCircleHeart className="w-4 h-4" />
                        <span>Feedback</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {displayMode === 'modal' && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="backdrop"
                            style={{ zIndex: 100 }}
                            onClick={closeModal}
                        />

                        {/* Modal Panel — centered via flexbox wrapper */}
                        <div className="feedback-modal-wrapper">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                                className="feedback-modal"
                            >
                                {/* Close button */}
                                <button
                                    onClick={closeModal}
                                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                                    aria-label="Cerrar"
                                >
                                    <X className="w-4 h-4 text-tertiary" />
                                </button>

                                <AnimatePresence mode="wait">
                                    {/* Step 1: Options */}
                                    {step === 'options' && (
                                        <motion.div
                                            key="options"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="space-y-5"
                                        >
                                            {/* Subtle decorative emoji */}
                                            <div className="text-center">
                                                <span className="text-2xl">💬</span>
                                            </div>

                                            <h3 className="text-h2 text-center leading-snug" style={{ fontSize: '17px' }}>
                                                ¿Qué es lo que más te ha facilitado la vida hoy en FamilyFin?
                                            </h3>

                                            <div className="space-y-2.5">
                                                {FEEDBACK_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.key}
                                                        onClick={() => handleOptionSelect(option.key)}
                                                        className="feedback-option"
                                                    >
                                                        <span className="text-lg">{option.icon}</span>
                                                        <span className="text-label" style={{ color: 'hsl(var(--text-primary))' }}>
                                                            {option.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 2: Comment (Progressive Disclosure) */}
                                    {step === 'comment' && (
                                        <motion.div
                                            key="comment"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            {/* Selected option pill */}
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-sm bg-surface-3 px-3 py-1 rounded-full text-secondary">
                                                    {FEEDBACK_OPTIONS.find(o => o.key === selectedOption)?.icon}{' '}
                                                    {FEEDBACK_OPTIONS.find(o => o.key === selectedOption)?.label}
                                                </span>
                                            </div>

                                            <p className="text-body text-center text-sm leading-relaxed">
                                                ¡Gracias! Si tuvieras una varita mágica 🪄, ¿qué es lo único que cambiarías para que la app fuera perfecta?
                                            </p>

                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Cuéntanos tu idea..."
                                                className="input"
                                                style={{
                                                    minHeight: '100px',
                                                    resize: 'none',
                                                    fontSize: '15px',
                                                    lineHeight: '1.5',
                                                }}
                                                autoFocus
                                            />

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isPending}
                                                    className="btn btn-primary flex-1"
                                                    style={{ padding: '12px 16px', fontSize: '14px' }}
                                                >
                                                    {isPending ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            Enviar
                                                            <Send className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Success */}
                                    {step === 'success' && (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center py-4 space-y-3"
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                                                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10"
                                            >
                                                <Check className="w-7 h-7 text-success" />
                                            </motion.div>
                                            <p className="text-h2" style={{ fontSize: '17px' }}>
                                                ¡Gracias por tu feedback!
                                            </p>
                                            <p className="text-meta">
                                                Construimos FamilyFin contigo 💜
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
