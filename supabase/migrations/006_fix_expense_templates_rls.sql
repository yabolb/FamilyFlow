-- ============================================================================
-- Fix RLS Policies for Expense Templates
-- Descripción: Asegurar permisos para gastos fijos
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.expense_templates ENABLE ROW LEVEL SECURITY;

-- 1. SELECT - Ver templates de su familia
DROP POLICY IF EXISTS "Los usuarios pueden ver templates de su familia" ON public.expense_templates;

CREATE POLICY "Los usuarios pueden ver templates de su familia"
    ON public.expense_templates FOR SELECT
    USING (
        family_id IN (
            SELECT family_id FROM public.users WHERE id = auth.uid()
        )
    );

-- 2. INSERT - Crear templates en su familia
DROP POLICY IF EXISTS "Los usuarios pueden crear templates para su familia" ON public.expense_templates;

CREATE POLICY "Los usuarios pueden crear templates para su familia"
    ON public.expense_templates FOR INSERT
    WITH CHECK (
        family_id IN (
            SELECT family_id FROM public.users WHERE id = auth.uid()
        )
    );

-- 3. UPDATE - Actualizar templates de su familia
DROP POLICY IF EXISTS "Los usuarios pueden actualizar templates de su familia" ON public.expense_templates;

CREATE POLICY "Los usuarios pueden actualizar templates de su familia"
    ON public.expense_templates FOR UPDATE
    USING (
        family_id IN (
            SELECT family_id FROM public.users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        family_id IN (
            SELECT family_id FROM public.users WHERE id = auth.uid()
        )
    );

-- 4. DELETE - Eliminar templates de su familia
DROP POLICY IF EXISTS "Los usuarios pueden eliminar templates de su familia" ON public.expense_templates;

CREATE POLICY "Los usuarios pueden eliminar templates de su familia"
    ON public.expense_templates FOR DELETE
    USING (
        family_id IN (
            SELECT family_id FROM public.users WHERE id = auth.uid()
        )
    );
