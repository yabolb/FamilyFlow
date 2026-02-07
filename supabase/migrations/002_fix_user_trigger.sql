-- ============================================================================
-- FamilyFlow - Corrección del Trigger de Registro
-- Versión: 1.0.1
-- Descripción: Modifica el trigger para NO crear familia automáticamente
--              El usuario debe pasar por onboarding para elegir crear/unirse
-- ============================================================================

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recrear la función con nueva lógica
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _family_id UUID := NULL;
    _user_name TEXT;
    _invite_code TEXT;
BEGIN
    -- Extraer metadata del registro
    _user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
    _invite_code := NEW.raw_user_meta_data->>'invite_code';
    
    -- SOLO asignar familia si viene con código de invitación válido
    IF _invite_code IS NOT NULL AND _invite_code != '' THEN
        SELECT id INTO _family_id 
        FROM public.families 
        WHERE invite_code = UPPER(_invite_code);
    END IF;
    
    -- Crear el perfil del usuario (family_id será NULL si no hay invite_code válido)
    INSERT INTO public.users (id, email, full_name, family_id, is_family_admin)
    VALUES (
        NEW.id,
        NEW.email,
        _user_name,
        _family_id,
        FALSE  -- No es admin hasta que cree su propia familia
    );
    
    RETURN NEW;
END;
$$;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-crea perfil de usuario. La familia se asigna en onboarding o via invite_code.';
