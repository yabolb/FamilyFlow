'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { getUserExpensesContext } from './getUserExpensesContext'
import { getMarketData } from './getMarketData'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export interface ChatMessage {
    role: 'user' | 'model' | 'system'
    content: string
}

export async function chatWithGemini(messages: ChatMessage[]): Promise<{
    success: boolean
    reply: string
    error?: string
}> {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            return { success: false, reply: '', error: 'GOOGLE_API_KEY no configurada' }
        }

        // Gather context in parallel
        const [expensesCtx, marketData] = await Promise.all([
            getUserExpensesContext(),
            getMarketData(),
        ])

        const systemPrompt = `Eres el Asesor Financiero de Family Fin, una app de gestión de gastos familiares.

REGLAS:
1. Tienes acceso a los gastos REALES del usuario de este mes:
${expensesCtx.json}
Total gastado este mes: ${expensesCtx.totalThisMonth}€

2. El precio de la luz HOY en España (PVPC) es: ${marketData.electricity.price} ${marketData.electricity.unit}${marketData.electricity.isEstimated ? ' (estimado)' : ' (dato real ESIOS)'}.
Tendencia: ${marketData.electricity.trend === 'cheap' ? 'BARATO respecto a la media' : marketData.electricity.trend === 'expensive' ? 'CARO respecto a la media' : 'En la media'}.

3. Tu misión es ayudar a ahorrar. Si ves gastos altos en luz, compáralos con el precio de mercado. Si preguntan por ofertas de internet, sugiere precios competitivos actuales en España (ej. Digi ~25€, O2 ~30€, Pepephone ~28€).

4. Sé breve, directo y usa emojis. Responde siempre en español.

5. Si te preguntan algo que no tiene nada que ver con finanzas o gastos, responde amablemente que eres un asesor financiero y redirige la conversación.

6. Formatea las respuestas con markdown simple (negritas, listas, etc.) para mejor legibilidad.`

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: systemPrompt,
        })

        // Convert our message format to Gemini format
        // Gemini requires history to start with 'user' role, so strip any leading 'model' messages
        let history = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: m.content }],
            }))

        // Strip leading 'model' messages (e.g. the welcome greeting) — Gemini requires first = 'user'
        while (history.length > 0 && history[0].role === 'model') {
            history.shift()
        }

        // Last message is the user's current message
        const lastMessage = history.pop()
        if (!lastMessage) {
            return { success: false, reply: '', error: 'No hay mensaje del usuario' }
        }

        const chat = model.startChat({
            history: history,
        })

        const result = await chat.sendMessage(lastMessage.parts)
        const response = result.response
        const text = response.text()

        return { success: true, reply: text }
    } catch (error: any) {
        console.error('Gemini chat error:', error)
        // Extract a clean error message
        let errorMsg = 'Error al comunicarse con Gemini'
        const rawMsg = error.message || ''
        if (rawMsg.includes('Quota exceeded') || rawMsg.includes('quota')) {
            errorMsg = 'Se ha alcanzado el límite de uso de la API de Gemini. Inténtalo más tarde. ⏳'
        } else if (rawMsg.includes('API_KEY')) {
            errorMsg = 'La clave de API de Google no es válida. Revisa tu configuración. 🔑'
        } else if (rawMsg.length < 200) {
            errorMsg = rawMsg
        }

        return {
            success: false,
            reply: '',
            error: errorMsg,
        }
    }
}
