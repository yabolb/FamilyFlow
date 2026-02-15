'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, TrendingUp, TrendingDown, AlertTriangle, PiggyBank,
    Send, Camera, X, Bot, User, Loader2, Zap, Minus
} from 'lucide-react'
import { chatWithGemini, type ChatMessage } from '@/lib/actions/chatWithGemini'
import { analyzeBill } from '@/lib/actions/analyzeBill'
import type { MarketData } from '@/lib/actions/getMarketData'

interface IntelligenceClientProps {
    data: {
        variable: {
            current: number
            previous: number
            percentage: number
        }
        topCategory: {
            name: string
            amount: number
            icon: string
        } | null
        monthlyProjection: number
        fixedTotal: number
        annualProvision: number
        savingProposal: {
            category: string
            amount: number
        } | null
    }
    marketData: MarketData
}

interface UIMessage {
    id: string
    role: 'user' | 'model' | 'system'
    content: string
    timestamp: Date
}

export default function InteligenciaClient({ data, marketData }: IntelligenceClientProps) {
    const [messages, setMessages] = useState<UIMessage[]>([
        {
            id: 'welcome',
            role: 'model',
            content: '¡Hola! 👋 Soy tu asesor financiero de Family Fin. Tengo acceso a tus gastos de este mes y datos del mercado energético. ¿En qué te puedo ayudar? 💡',
            timestamp: new Date(),
        },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showBillUpload, setShowBillUpload] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            style: 'currency',
            currency: 'EUR'
        }).format(value)
    }

    const {
        monthlyProjection,
        fixedTotal,
        annualProvision,
        variable,
        topCategory,
        savingProposal
    } = data

    const variableProjected = monthlyProjection - fixedTotal - annualProvision
    const total = monthlyProjection || 1
    const pctVariable = (variableProjected / total) * 100
    const pctFixed = (fixedTotal / total) * 100
    const pctProvision = (annualProvision / total) * 100

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    const handleSend = async () => {
        const text = input.trim()
        if (!text || isLoading) return

        const userMsg: UIMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            // Build chat history for Gemini
            const chatHistory: ChatMessage[] = messages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role as 'user' | 'model', content: m.content }))
            chatHistory.push({ role: 'user', content: text })

            const result = await chatWithGemini(chatHistory)

            if (result.success) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    content: result.reply,
                    timestamp: new Date(),
                }])
            } else {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'system',
                    content: `❌ Error: ${result.error}`,
                    timestamp: new Date(),
                }])
            }
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: '❌ Error de conexión con el asesor IA.',
                timestamp: new Date(),
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsAnalyzing(true)
        setShowBillUpload(false)

        // Show user message with file info
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            content: `📷 Analizando factura: ${file.name}`,
            timestamp: new Date(),
        }])

        try {
            const formData = new FormData()
            formData.append('image', file)

            const result = await analyzeBill(formData)

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: result.success
                    ? `📋 **Análisis de Factura**\n\n${result.analysis}`
                    : `❌ Error al analizar: ${result.error}`,
                timestamp: new Date(),
            }])
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: '❌ Error al analizar la factura.',
                timestamp: new Date(),
            }])
        } finally {
            setIsAnalyzing(false)
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Market trend data
    const { electricity } = marketData
    const TrendIcon = electricity.trend === 'cheap' ? TrendingDown
        : electricity.trend === 'expensive' ? TrendingUp
            : Minus
    const trendColor = electricity.trend === 'cheap' ? 'text-success'
        : electricity.trend === 'expensive' ? 'text-error'
            : 'text-secondary'
    const trendBg = electricity.trend === 'cheap' ? 'bg-emerald-500/10'
        : electricity.trend === 'expensive' ? 'bg-red-500/10'
            : 'bg-gray-500/10'
    const trendLabel = electricity.trend === 'cheap' ? 'Barato hoy'
        : electricity.trend === 'expensive' ? 'Caro hoy'
            : 'Precio medio'

    // Simple markdown-like rendering for bold and lists
    const renderMarkdown = (text: string) => {
        const lines = text.split('\n')
        return lines.map((line, i) => {
            // Bold
            let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Bullet lists
            if (processed.startsWith('- ') || processed.startsWith('* ')) {
                processed = `<span class="ml-2">• ${processed.slice(2)}</span>`
            }
            // Numbered lists
            const numberedMatch = processed.match(/^(\d+)\.\s(.*)/)
            if (numberedMatch) {
                processed = `<span class="ml-2">${numberedMatch[1]}. ${numberedMatch[2]}</span>`
            }

            return (
                <span key={i}>
                    <span dangerouslySetInnerHTML={{ __html: processed }} />
                    {i < lines.length - 1 && <br />}
                </span>
            )
        })
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                    <h1 className="text-h1">Inteligencia</h1>
                    <p className="text-body text-sm">Análisis IA + Mercado en tiempo real</p>
                </div>
            </div>

            <div className="px-6 flex flex-col gap-3">

                {/* ───────── MARKET WIDGET ───────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="surface p-5 relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-warning" />
                            <h3 className="text-sub font-medium">Precio Luz Hoy (PVPC)</h3>
                        </div>
                        {electricity.isEstimated && (
                            <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
                                Estimado
                            </span>
                        )}
                    </div>

                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-bold text-primary">
                            {electricity.price.toFixed(4)}
                        </span>
                        <span className="text-secondary text-sm mb-1">{electricity.unit}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${trendBg}`}>
                            <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                            <span className={`text-xs font-medium ${trendColor}`}>{trendLabel}</span>
                        </div>
                        <span className="text-tertiary text-xs">vs media 0.15 €/kWh</span>
                    </div>
                </motion.div>

                {/* ───────── PROJECTION CARD ───────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="surface p-5 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24" />
                    </div>

                    <h3 className="text-sub mb-2">Proyección Mensual</h3>
                    <p className="text-body mb-4 pr-8 relative z-10">
                        Al ritmo actual de gasto variable, cerraréis el mes con un total aproximado de:
                    </p>
                    <div className="text-4xl font-bold text-primary relative z-10">
                        {formatCurrency(monthlyProjection)}
                    </div>
                    <div className="mt-2 text-sm text-meta flex items-center gap-2">
                        {variable.percentage > 0 ? (
                            <span className="text-error">+{variable.percentage.toFixed(1)}% vs mes anterior</span>
                        ) : (
                            <span className="text-success">{variable.percentage.toFixed(1)}% vs mes anterior</span>
                        )}
                    </div>
                </motion.div>

                {/* ───────── COMPOSITION BAR ───────── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="surface-2 p-5"
                >
                    <h3 className="text-sub mb-4">Composición Estimada</h3>

                    <div className="h-4 w-full bg-black/5 rounded-full overflow-hidden flex mb-4">
                        <div className="bg-brand-primary h-full" style={{ width: `${pctVariable}%` }} />
                        <div className="bg-violet-500 h-full" style={{ width: `${pctFixed}%` }} />
                        <div className="bg-emerald-500 h-full" style={{ width: `${pctProvision}%` }} />
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-brand-primary" />
                                <span className="text-secondary">Variables estimados</span>
                            </div>
                            <span className="font-medium text-primary">{formatCurrency(variableProjected)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-violet-500" />
                                <span className="text-secondary">Gastos Fijos</span>
                            </div>
                            <span className="font-medium text-primary">{formatCurrency(fixedTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-secondary">Reservas Anuales</span>
                            </div>
                            <span className="font-medium text-primary">{formatCurrency(annualProvision)}</span>
                        </div>
                    </div>
                </motion.div>

                {/* ───────── TOP CATEGORY ───────── */}
                {topCategory && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="surface-2 p-5 border-l-4 border-l-brand-primary"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-2xl flex-shrink-0 text-brand-primary">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-primary font-medium mb-1">Categoría Principal</h3>
                                <p className="text-body text-sm mb-2">
                                    <span className="text-primary font-semibold">{topCategory.name}</span> es donde más estáis gastando este mes ({formatCurrency(topCategory.amount)}).
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ───────── SAVING PROPOSAL ───────── */}
                {savingProposal && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="surface-2 p-5 border-l-4 border-l-emerald-500"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl flex-shrink-0 text-emerald-500">
                                <PiggyBank className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-primary font-medium mb-1">Propuesta de Ahorro</h3>
                                <p className="text-body text-sm">
                                    Si reducís un <span className="text-emerald-600 font-bold">10%</span> en {savingProposal.category}, podríais ahorrar <span className="text-emerald-600 font-bold">{formatCurrency(savingProposal.amount)}</span> este mes.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════
                    GEMINI CHAT SECTION
                ═══════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="surface p-0 overflow-hidden mt-2"
                >
                    {/* Chat Header */}
                    <div className="px-5 py-4 border-b border-black/5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-violet-500 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-primary font-semibold text-sm">Asesor Financiero IA</h3>
                            <p className="text-tertiary text-xs">Powered by Gemini · Datos en tiempo real</p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="h-80 overflow-y-auto px-4 py-4 space-y-3 bg-surface-3/50">
                        <AnimatePresence>
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role !== 'user' && (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-primary to-violet-500 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-brand-primary text-white rounded-br-md'
                                            : msg.role === 'system'
                                                ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                                                : 'bg-white text-primary shadow-sm border border-black/5 rounded-bl-md'
                                            }`}
                                    >
                                        {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 ml-2 mt-0.5">
                                            <User className="w-4 h-4 text-secondary" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Loading indicator */}
                        {(isLoading || isAnalyzing) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-primary to-violet-500 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-black/5 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                                    <span className="text-sm text-secondary">
                                        {isAnalyzing ? 'Analizando factura...' : 'Gemini está pensando...'}
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-black/5 bg-white">
                        {/* Bill upload button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBillUpload}
                            className="hidden"
                        />

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading || isAnalyzing}
                                className="p-2.5 rounded-xl bg-surface-3 text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-colors disabled:opacity-50"
                                title="Analizar factura (foto)"
                            >
                                <Camera className="w-5 h-5" />
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Pregunta sobre tus gastos..."
                                    disabled={isLoading || isAnalyzing}
                                    className="w-full px-4 py-2.5 rounded-xl bg-surface-3 text-primary text-sm
                                        placeholder:text-tertiary border border-transparent
                                        focus:outline-none focus:border-brand-primary/30 focus:bg-white
                                        transition-all disabled:opacity-50"
                                />
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading || isAnalyzing}
                                className="p-2.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover
                                    transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    )
}
