-- ============================================================================
-- FamilyFlow - Corrección de Políticas RLS para Onboarding
-- Versión: 1.0.2
-- Descripción: Añade políticas que permiten a usuarios crear familias
--              y verse a sí mismos aunque no tengan familia aún
-- ============================================================================

-- ============================================================================
-- 1. POLÍTICAS PARA FAMILIES
-- ============================================================================

-- Permitir a usuarios autenticados CREAR familias (necesario para onboarding)
CREATE POLICY "Usuarios autenticados pueden crear familias"
    ON public.families FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- ============================================================================
-- 2. POLÍTICAS PARA USERS
-- ============================================================================

-- Permitir a usuarios ver su PROPIO perfil aunque no tengan familia
DROP POLICY IF EXISTS "Los usuarios pueden ver miembros de su familia" ON public.users;

CREATE POLICY "Los usuarios pueden ver su propio perfil"
    ON public.users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Los usuarios pueden ver miembros de su familia"
    ON public.users FOR SELECT
    USING (
        family_id IS NOT NULL 
        AND family_id = public.get_user_family_id()
    );

-- Asegurar que el usuario puede actualizar su perfil incluyendo el family_id
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.users;

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
    ON public.users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================================================
-- FIN
-- ============================================================================
