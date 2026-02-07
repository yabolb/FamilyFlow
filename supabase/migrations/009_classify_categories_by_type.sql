-- ============================================================================
-- Update Category Types
-- Descripción: Clasifica las categorías en fijas, variables o ambas
-- ============================================================================

-- 1. Gastos Fijos (Plantillas)
UPDATE public.categories
SET type = 'fixed'
WHERE name IN ('Alquiler', 'Hipoteca', 'Luz', 'Agua', 'Internet', 'Seguros', 'Impuestos', 'Comunidad');

-- 2. Gastos Variables (Transacciones rápidas)
UPDATE public.categories
SET type = 'variable'
WHERE name IN ('Supermercado', 'Restaurantes', 'Ocio', 'Regalos', 'Ropa', 'Suscripciones');

-- 3. Ambos (Aparecen siempre)
UPDATE public.categories
SET type = 'both'
WHERE name IN ('Transporte', 'Salud', 'Hogar', 'Otros');

-- Refrescar cache de PostgREST
NOTIFY pgrst, 'reload schema';
