-- ============================================================================
-- FamilyFlow - Seed de Categorías del Sistema
-- Versión: 1.0.0
-- Descripción: Inserta las categorías globales (family_id = NULL, is_system = TRUE)
-- ============================================================================

-- Limpiar categorías del sistema existentes (si hay)
DELETE FROM public.categories WHERE is_system = TRUE;

-- ============================================================================
-- CATEGORÍAS DE VIVIENDA (FIJOS)
-- ============================================================================
INSERT INTO public.categories (name, icon, type, family_id, is_system, sort_order) VALUES
('Alquiler/Hipoteca', '🏠', 'fixed', NULL, TRUE, 1),
('Luz', '⚡', 'fixed', NULL, TRUE, 2),
('Agua', '💧', 'fixed', NULL, TRUE, 3),
('Gas', '🔥', 'fixed', NULL, TRUE, 4),
('Internet/Móvil', '📱', 'fixed', NULL, TRUE, 5),
('Seguros', '🛡️', 'fixed', NULL, TRUE, 6),
('Comunidad', '🏢', 'fixed', NULL, TRUE, 7),
('Impuestos', '📋', 'fixed', NULL, TRUE, 8);

-- ============================================================================
-- CATEGORÍAS DE VIDA DIARIA (VARIABLES)
-- ============================================================================
INSERT INTO public.categories (name, icon, type, family_id, is_system, sort_order) VALUES
('Supermercado', '🛒', 'variable', NULL, TRUE, 10),
('Transporte', '🚗', 'variable', NULL, TRUE, 11),
('Restaurantes', '🍽️', 'variable', NULL, TRUE, 12),
('Salud', '❤️', 'variable', NULL, TRUE, 13),
('Ropa', '👕', 'variable', NULL, TRUE, 14),
('Regalos', '🎁', 'variable', NULL, TRUE, 15),
('Niños', '👶', 'variable', NULL, TRUE, 16),
('Viajes', '✈️', 'variable', NULL, TRUE, 17),
('Ocio', '🎮', 'variable', NULL, TRUE, 18),
('Educación', '📚', 'variable', NULL, TRUE, 19),
('Suscripciones', '💳', 'variable', NULL, TRUE, 20),
('Otros', '📦', 'variable', NULL, TRUE, 99);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT id, name, icon, type, sort_order FROM public.categories WHERE is_system = TRUE ORDER BY sort_order;
