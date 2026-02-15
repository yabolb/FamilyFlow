export const getEmojiForCategory = (name: string): string => {
    const lowerName = name.toLowerCase().trim()

    // Comida y Bebida
    if (match(lowerName, ['pan', 'fruta', 'verdura', 'carne', 'pescado', 'super', 'compra', 'mercado'])) return '🛒'
    if (match(lowerName, ['restaurante', 'cena', 'comida', 'menu', 'sushi', 'pizza', 'burger', 'mcdonalds'])) return '🍽️'
    if (match(lowerName, ['cafe', 'cafeteria', 'desayuno', 'starbucks'])) return '☕'
    if (match(lowerName, ['bar', 'cerveza', 'copas', 'vino', 'alcohol'])) return '🍻'

    // Transporte
    if (match(lowerName, ['gasolina', 'combustible', 'repostaje', 'diesel'])) return '⛽'
    if (match(lowerName, ['parking', 'aparcamiento', 'zona azul'])) return '🅿️'
    if (match(lowerName, ['peaje', 'autopista'])) return '🛣️'
    if (match(lowerName, ['bus', 'autobus', 'transport', 'metro', 'tren', 'taxi', 'uber', 'cabify'])) return '🚌'
    if (match(lowerName, ['coche', 'auto', 'mecanico', 'reparacion coche'])) return '🚗'

    // Casa y Facturas
    if (match(lowerName, ['alquiler', 'hipoteca', 'renta'])) return '🏠'
    if (match(lowerName, ['luz', 'electricidad', 'endesa', 'iberdrola'])) return '⚡'
    if (match(lowerName, ['agua', 'aqualia', 'canal'])) return '💧'
    if (match(lowerName, ['gas', 'naturgy'])) return '🔥'
    if (match(lowerName, ['internet', 'wifi', 'fibra', 'movistar', 'vodafone', 'orange', 'pepephone'])) return '🌐'
    if (match(lowerName, ['telefono', 'movil', 'celular'])) return '📱'
    if (match(lowerName, ['seguro', 'poliza', 'mutua'])) return '🛡️'
    if (match(lowerName, ['limpieza', 'hogar', 'mueble', 'ikea'])) return '🧹'

    // Ocio y Compras
    if (match(lowerName, ['ropa', 'moda', 'zara', 'mango', 'primark', 'hm', 'nike'])) return '👕'
    if (match(lowerName, ['regalo', 'cumpleanos', 'navidad', 'reyes'])) return '🎁'
    if (match(lowerName, ['cine', 'pelicula', 'teatro', 'entrada'])) return '🎬'
    if (match(lowerName, ['juego', 'videojuego', 'steam', 'playstation', 'nintendo'])) return '🎮'
    if (match(lowerName, ['libro', 'lectura', 'kindle'])) return '📚'
    if (match(lowerName, ['eletronica', 'tech', 'apple', 'samsung', 'pc'])) return '💻'

    // Salud y Cuidado
    if (match(lowerName, ['farmacia', 'medicamento', 'medico', 'doctor', 'dentista'])) return '💊'
    if (match(lowerName, ['gimnasio', 'gym', 'deporte', 'entrenamiento'])) return '💪'
    if (match(lowerName, ['peluqueria', 'estetica', 'belleza'])) return '💇'

    // Niños y Mascotas
    if (match(lowerName, ['nino', 'nina', 'hijo', 'bebe', 'pañal', 'colegio', 'guarderia'])) return '👶'
    if (match(lowerName, ['mascota', 'perro', 'gato', 'veterinario', 'pienso'])) return '🐾'

    // Viajes
    if (match(lowerName, ['viaje', 'hotel', 'vuelo', 'avion', 'hotel', 'airbnb'])) return '✈️'

    // Otros
    if (match(lowerName, ['suscripcion', 'netflix', 'spotify', 'hbo', 'disney', 'prime'])) return '📺'
    if (match(lowerName, ['banco', 'comision', 'interes'])) return '🏦'

    // Default variations
    if (match(lowerName, ['sueldo', 'nomina', 'ingreso'])) return '💰'

    return '📦' // Default icon
}

export const COMMON_EMOJIS = [
    '🛒', '🍽️', '☕', '🍻',
    '🏠', '⚡', '💧', '🔥', '🌐', '📱',
    '⛽', '🅿️', '🚌', '🚗', '✈️',
    '👕', '🎁', '🎬', '🎮', '📚', '💻',
    '💊', '💪', '💇', '👶', '🐾',
    '📺', '🏦', '💰', '📦', '🎉', '💼'
]

const match = (text: string, keywords: string[]): boolean => {
    return keywords.some(keyword => text.includes(keyword))
}
