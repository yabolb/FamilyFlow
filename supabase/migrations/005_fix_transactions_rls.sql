-- ============================================================================
-- Fix RLS Policies for Transactions
-- Descripción: Refuerza y simplifica las políticas RLS para transacciones
-- ============================================================================

-- Asegurar permisos de ejecución en la función auxiliar
GRANT EXECUTE ON FUNCTION public.get_user_family_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_family_id TO service_role;

-- 1. INSERT POLICY
DROP POLICY IF EXISTS "Los usuarios pueden crear transacciones para su familia" ON public.transactions;

CREATE POLICY "Los usuarios pueden crear transacciones para su familia"
    ON public.transactions FOR INSERT
    WITH CHECK (
        -- El usuario inserta en SU familia actual
        family_id IN (
            SELECT family_id 
            FROM public.users 
            WHERE id = auth.uid()
        )
        -- Y se asigna a sí mismo como creador
        AND user_id = auth.uid()
    );

-- 2. SELECT POLICY
DROP POLICY IF EXISTS "Los usuarios pueden ver transacciones de su familia" ON public.transactions;

CREATE POLICY "Los usuarios pueden ver transacciones de su familia"
    ON public.transactions FOR SELECT
    USING (
        -- Puede ver transacciones de su familia actual
        family_id IN (
            SELECT family_id 
            FROM public.users 
            WHERE id = auth.uid()
        )
    );

-- 3. UPDATE POLICY
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias transacciones" ON public.transactions;

CREATE POLICY "Los usuarios pueden actualizar transacciones de su familia"
    ON public.transactions FOR UPDATE
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

-- 4. DELETE POLICY
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propias transacciones" ON public.transactions;

CREATE POLICY "Los usuarios pueden eliminar transacciones de su familia"
    ON public.transactions FOR DELETE
    USING (
        family_id IN (
            SELECT family_id FROM public.users WHERE id = auth.uid()
        )
    );
