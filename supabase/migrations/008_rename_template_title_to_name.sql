-- ============================================================================
-- Rename title to name in expense_templates
-- Descripción: Unifica el nombre de columna con el resto del sistema (users, categories)
-- ============================================================================

-- Renombrar columna title a name
ALTER TABLE public.expense_templates 
RENAME COLUMN title TO name;

-- Refrescar el cache de PostgREST
NOTIFY pgrst, 'reload schema';
