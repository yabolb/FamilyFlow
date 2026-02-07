-- ============================================================================
-- Add due_month to expense_templates
-- Descripción: Añade soporte para saber el mes de vencimiento en gastos anuales
-- ============================================================================

-- Añadir la columna due_month
ALTER TABLE public.expense_templates 
ADD COLUMN IF NOT EXISTS due_month INTEGER CHECK (due_month >= 1 AND due_month <= 12);

COMMENT ON COLUMN public.expense_templates.due_month IS 'Mes de vencimiento (1-12) para gastos con frecuencia anual';

-- Refrescar el cache de PostgREST (esto ocurre automáticamente en Supabase al ejecutar SQL)
NOTIFY pgrst, 'reload schema';
