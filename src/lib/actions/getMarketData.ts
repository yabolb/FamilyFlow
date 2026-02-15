'use server'

export interface MarketData {
    electricity: {
        price: number
        unit: string
        lastUpdated: string
        isEstimated: boolean
        trend: 'cheap' | 'normal' | 'expensive'
    }
}

const FALLBACK_PRICE = 0.15
const AVERAGE_PRICE = 0.15

export async function getMarketData(): Promise<MarketData> {
    try {
        const response = await fetch(
            'https://api.esios.ree.es/archives/70/download_json',
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 3600 }, // Cache 1 hour
            }
        )

        if (!response.ok) {
            throw new Error(`ESIOS API error: ${response.status}`)
        }

        const data = await response.json()

        // ESIOS returns PVPC data. Extract today's average price.
        // The structure is: { PVPC: [{ Dia: "dd/mm/yyyy", PCB: "xx,xx", ... }, ...] }
        const today = new Date()
        const todayStr = today.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })

        const pvpcEntries = data?.PVPC || []

        // Find today's entries
        const todayEntries = pvpcEntries.filter((entry: any) =>
            entry.Dia === todayStr
        )

        if (todayEntries.length === 0) {
            throw new Error('No PVPC data for today')
        }

        // Calculate average price from all hourly entries
        // PCB field contains price in €/MWh, we need €/kWh
        const prices = todayEntries.map((entry: any) => {
            const priceStr = (entry.PCB || entry.GEN || '0').replace(',', '.')
            return parseFloat(priceStr) / 1000 // MWh -> kWh
        })

        const avgPrice = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length

        const trend = avgPrice < AVERAGE_PRICE * 0.85
            ? 'cheap'
            : avgPrice > AVERAGE_PRICE * 1.15
                ? 'expensive'
                : 'normal'

        return {
            electricity: {
                price: Math.round(avgPrice * 10000) / 10000, // 4 decimal precision
                unit: '€/kWh',
                lastUpdated: new Date().toISOString(),
                isEstimated: false,
                trend,
            },
        }
    } catch (error) {
        console.error('Error fetching ESIOS data:', error)

        // Fallback
        return {
            electricity: {
                price: FALLBACK_PRICE,
                unit: '€/kWh',
                lastUpdated: new Date().toISOString(),
                isEstimated: true,
                trend: 'normal',
            },
        }
    }
}
