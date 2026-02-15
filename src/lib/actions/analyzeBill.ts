'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export async function analyzeBill(formData: FormData): Promise<{
    success: boolean
    analysis: string
    error?: string
}> {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            return { success: false, analysis: '', error: 'GOOGLE_API_KEY no configurada' }
        }

        const file = formData.get('image') as File | null
        if (!file) {
            return { success: false, analysis: '', error: 'No se ha proporcionado imagen' }
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')

        // Determine MIME type
        const mimeType = file.type || 'image/jpeg'

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
        })

        const prompt = `Analiza esta factura o ticket. Extrae la siguiente información:

1. **Proveedor/Empresa**: El nombre de la empresa que emite la factura.
2. **Importe Total**: La cantidad total a pagar.
3. **Periodo**: El periodo de facturación si aparece.
4. **Consumo**: Si es una factura de luz, gas o telecomunicaciones, indica el consumo (kWh, m³, GB, etc.).
5. **Análisis**: Compara con precios medios del mercado español actual:
   - Luz: Media PVPC ~0.15 €/kWh
   - Gas: Media ~0.08 €/kWh
   - Internet/Móvil: Ofertas desde 25€ (Digi) a 40€ (Movistar)
   - Seguros hogar: Media 200-400€/año

Dime si el precio es competitivo o si debería buscar alternativas más baratas.

Responde en español, sé directo y usa emojis. Formatea con markdown.`

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: base64,
                },
            },
        ])

        const response = result.response
        const text = response.text()

        return { success: true, analysis: text }
    } catch (error: any) {
        console.error('Bill analysis error:', error)
        return {
            success: false,
            analysis: '',
            error: error.message || 'Error al analizar la factura',
        }
    }
}
