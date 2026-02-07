-- ============================================================================
-- FamilyFlow - Schema Inicial de Base de Datos
-- Versión: 1.0.0
-- Descripción: Gestor Financiero Familiar Multi-tenant
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES NECESARIAS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TIPOS ENUMERADOS (ENUMS)
-- ============================================================================

-- Tipo de categoría
CREATE TYPE category_type AS ENUM ('fixed', 'variable', 'both');

-- Frecuencia de gastos fijos
CREATE TYPE expense_frequency AS ENUM ('monthly', 'annual');

-- Estado de transacción
CREATE TYPE transaction_status AS ENUM ('paid', 'pending');

-- ============================================================================
-- 3. TABLAS PRINCIPALES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: families
-- Descripción: Grupos familiares que comparten la gestión financiera
-- -----------------------------------------------------------------------------
CREATE TABLE public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(8) UNIQUE DEFAULT UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para búsqueda por código de invitación
CREATE INDEX idx_families_invite_code ON public.families(invite_code);

-- Comentarios de documentación
COMMENT ON TABLE public.families IS 'Grupos familiares para gestión financiera compartida';
COMMENT ON COLUMN public.families.invite_code IS 'Código único de 8 caracteres para invitar miembros';

-- -----------------------------------------------------------------------------
-- Tabla: users (perfil público vinculado a auth.users)
-- Descripción: Información pública de usuarios con referencia a su familia
-- -----------------------------------------------------------------------------
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_family_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_users_family_id ON public.users(family_id);
CREATE INDEX idx_users_email ON public.users(email);

COMMENT ON TABLE public.users IS 'Perfiles públicos de usuarios vinculados a auth.users';
COMMENT ON COLUMN public.users.is_family_admin IS 'Indica si el usuario es administrador de su familia';

-- -----------------------------------------------------------------------------
-- Tabla: categories
-- Descripción: Categorías de gastos (sistema + personalizadas por familia)
-- -----------------------------------------------------------------------------
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL, -- Emoji
    type category_type NOT NULL DEFAULT 'both',
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_categories_family_id ON public.categories(family_id);
CREATE INDEX idx_categories_type ON public.categories(type);

COMMENT ON TABLE public.categories IS 'Categorías de gastos: NULL en family_id = categoría del sistema';
COMMENT ON COLUMN public.categories.family_id IS 'NULL para categorías globales del sistema, UUID para personalizadas';

-- -----------------------------------------------------------------------------
-- Tabla: expense_templates
-- Descripción: Plantillas de gastos fijos mensuales/anuales
-- -----------------------------------------------------------------------------
CREATE TABLE public.expense_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    frequency expense_frequency NOT NULL DEFAULT 'monthly',
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_expense_templates_family_id ON public.expense_templates(family_id);
CREATE INDEX idx_expense_templates_category_id ON public.expense_templates(category_id);
CREATE INDEX idx_expense_templates_active ON public.expense_templates(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE public.expense_templates IS 'Plantillas de gastos fijos recurrentes';
COMMENT ON COLUMN public.expense_templates.due_day IS 'Día del mes en que vence el pago (1-31)';

-- -----------------------------------------------------------------------------
-- Tabla: transactions
-- Descripción: Registro histórico de todas las transacciones
-- -----------------------------------------------------------------------------
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.expense_templates(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status transaction_status NOT NULL DEFAULT 'paid',
    is_prorated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para consultas frecuentes
CREATE INDEX idx_transactions_family_id ON public.transactions(family_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_family_date ON public.transactions(family_id, date DESC);

-- Índice compuesto para dashboard (optimiza consultas por familia y rango de fechas)
-- Nota: No usamos índice parcial con CURRENT_DATE porque no es IMMUTABLE
CREATE INDEX idx_transactions_family_year_month ON public.transactions(family_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

COMMENT ON TABLE public.transactions IS 'Historial de todas las transacciones financieras';
COMMENT ON COLUMN public.transactions.is_prorated IS 'TRUE si es parte de un prorrateo de gasto anual';
COMMENT ON COLUMN public.transactions.template_id IS 'Referencia al template si fue generado automáticamente';

-- ============================================================================
-- 4. FUNCIONES AUXILIARES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Función: get_user_family_id
-- Descripción: Obtiene el family_id del usuario autenticado actual
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT family_id FROM public.users WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_family_id IS 'Retorna el family_id del usuario autenticado';

-- -----------------------------------------------------------------------------
-- Función: update_updated_at
-- Descripción: Actualiza automáticamente el campo updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers para updated_at en todas las tablas relevantes
CREATE TRIGGER set_updated_at_families
    BEFORE UPDATE ON public.families
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_expense_templates
    BEFORE UPDATE ON public.expense_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_transactions
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 5. FUNCIÓN Y TRIGGER PARA AUTO-CREAR USUARIO EN REGISTRO
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Función: handle_new_user
-- Descripción: Crea entrada en public.users cuando se registra en auth.users
--              Si viene con invite_code, lo asigna a esa familia
--              Si no, crea una nueva familia
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _family_id UUID;
    _family_name TEXT;
    _user_name TEXT;
    _invite_code TEXT;
BEGIN
    -- Extraer metadata del registro
    _family_name := COALESCE(NEW.raw_user_meta_data->>'family_name', 'Mi Familia');
    _user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
    _invite_code := NEW.raw_user_meta_data->>'invite_code';
    
    -- Si viene con código de invitación, buscar la familia
    IF _invite_code IS NOT NULL AND _invite_code != '' THEN
        SELECT id INTO _family_id 
        FROM public.families 
        WHERE invite_code = UPPER(_invite_code);
        
        -- Si no encuentra la familia, crear una nueva
        IF _family_id IS NULL THEN
            INSERT INTO public.families (name)
            VALUES (_family_name)
            RETURNING id INTO _family_id;
        END IF;
    ELSE
        -- Crear nueva familia
        INSERT INTO public.families (name)
        VALUES (_family_name)
        RETURNING id INTO _family_id;
    END IF;
    
    -- Crear el perfil del usuario
    INSERT INTO public.users (id, email, full_name, family_id, is_family_admin)
    VALUES (
        NEW.id,
        NEW.email,
        _user_name,
        _family_id,
        -- Es admin si creó la familia (no vino con invite_code)
        (_invite_code IS NULL OR _invite_code = '')
    );
    
    RETURN NEW;
END;
$$;

-- Trigger que se ejecuta después de insertar en auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-crea perfil y familia cuando un usuario se registra';

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - MULTITENANCY
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Políticas para: families
-- -----------------------------------------------------------------------------
CREATE POLICY "Los usuarios pueden ver su propia familia"
    ON public.families FOR SELECT
    USING (id = public.get_user_family_id());

CREATE POLICY "Los admins pueden actualizar su familia"
    ON public.families FOR UPDATE
    USING (id = public.get_user_family_id())
    WITH CHECK (id = public.get_user_family_id());

-- Permitir lectura por invite_code para unirse a familias
CREATE POLICY "Cualquiera puede buscar familia por código"
    ON public.families FOR SELECT
    USING (TRUE);

-- -----------------------------------------------------------------------------
-- Políticas para: users
-- -----------------------------------------------------------------------------
CREATE POLICY "Los usuarios pueden ver miembros de su familia"
    ON public.users FOR SELECT
    USING (family_id = public.get_user_family_id());

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
    ON public.users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
    ON public.users FOR INSERT
    WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------------------------
-- Políticas para: categories
-- -----------------------------------------------------------------------------
CREATE POLICY "Los usuarios pueden ver categorías del sistema y de su familia"
    ON public.categories FOR SELECT
    USING (
        family_id IS NULL  -- Categorías del sistema
        OR family_id = public.get_user_family_id()  -- Categorías de su familia
    );

CREATE POLICY "Los usuarios pueden crear categorías para su familia"
    ON public.categories FOR INSERT
    WITH CHECK (family_id = public.get_user_family_id());

CREATE POLICY "Los usuarios pueden actualizar categorías de su familia"
    ON public.categories FOR UPDATE
    USING (family_id = public.get_user_family_id())
    WITH CHECK (family_id = public.get_user_family_id());

CREATE POLICY "Los usuarios pueden eliminar categorías de su familia"
    ON public.categories FOR DELETE
    USING (family_id = public.get_user_family_id() AND is_system = FALSE);

-- -----------------------------------------------------------------------------
-- Políticas para: expense_templates
-- -----------------------------------------------------------------------------
CREATE POLICY "Los usuarios pueden ver templates de su familia"
    ON public.expense_templates FOR SELECT
    USING (family_id = public.get_user_family_id());

CREATE POLICY "Los usuarios pueden crear templates para su familia"
    ON public.expense_templates FOR INSERT
    WITH CHECK (family_id = public.get_user_family_id());

CREATE POLICY "Los usuarios pueden actualizar templates de su familia"
    ON public.expense_templates FOR UPDATE
    USING (family_id = public.get_user_family_id())
    WITH CHECK (family_id = public.get_user_family_id());

CREATE POLICY "Los usuarios pueden eliminar templates de su familia"
    ON public.expense_templates FOR DELETE
    USING (family_id = public.get_user_family_id());

-- -----------------------------------------------------------------------------
-- Políticas para: transactions
-- -----------------------------------------------------------------------------
CREATE POLICY "Los usuarios pueden ver transacciones de su familia"
    ON public.transactions FOR SELECT
    USING (family_id = public.get_user_family_id());

CREATE POLICY "Los usuarios pueden crear transacciones para su familia"
    ON public.transactions FOR INSERT
    WITH CHECK (
        family_id = public.get_user_family_id()
        AND user_id = auth.uid()
    );

CREATE POLICY "Los usuarios pueden actualizar sus propias transacciones"
    ON public.transactions FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Los usuarios pueden eliminar sus propias transacciones"
    ON public.transactions FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- 7. SEED DATA - CATEGORÍAS DEL SISTEMA EN ESPAÑOL
-- ============================================================================

INSERT INTO public.categories (name, icon, type, family_id, is_system, sort_order) VALUES
    -- 🏠 VIVIENDA (Gastos Fijos)
    ('Alquiler/Hipoteca', '🏠', 'fixed', NULL, TRUE, 1),
    ('Electricidad', '💡', 'fixed', NULL, TRUE, 2),
    ('Gas', '🔥', 'fixed', NULL, TRUE, 3),
    ('Agua', '💧', 'fixed', NULL, TRUE, 4),
    ('Internet/Teléfono', '📡', 'fixed', NULL, TRUE, 5),
    ('Comunidad', '🏢', 'fixed', NULL, TRUE, 6),
    ('Seguro Hogar', '🛡️', 'fixed', NULL, TRUE, 7),
    
    -- 🚗 TRANSPORTE (Mixto)
    ('Coche/Moto', '🚗', 'both', NULL, TRUE, 10),
    ('Transporte Público', '🚇', 'variable', NULL, TRUE, 11),
    ('Gasolina', '⛽', 'variable', NULL, TRUE, 12),
    ('Parking', '🅿️', 'variable', NULL, TRUE, 13),
    ('Seguro Vehículo', '🚘', 'fixed', NULL, TRUE, 14),
    
    -- 🛒 VIDA DIARIA (Variables)
    ('Supermercado', '🛒', 'variable', NULL, TRUE, 20),
    ('Restaurantes', '🍽️', 'variable', NULL, TRUE, 21),
    ('Café/Snacks', '☕', 'variable', NULL, TRUE, 22),
    ('Delivery', '🛵', 'variable', NULL, TRUE, 23),
    
    -- 👨‍👩‍👧‍👦 FAMILIA
    ('Educación', '📚', 'both', NULL, TRUE, 30),
    ('Guardería', '👶', 'fixed', NULL, TRUE, 31),
    ('Actividades Niños', '⚽', 'both', NULL, TRUE, 32),
    ('Mascotas', '🐕', 'variable', NULL, TRUE, 33),
    
    -- 🩺 SALUD Y BIENESTAR
    ('Salud/Médico', '🩺', 'variable', NULL, TRUE, 40),
    ('Farmacia', '💊', 'variable', NULL, TRUE, 41),
    ('Gimnasio', '🏋️', 'fixed', NULL, TRUE, 42),
    ('Seguro Médico', '🏥', 'fixed', NULL, TRUE, 43),
    
    -- 🎉 OCIO Y ENTRETENIMIENTO
    ('Entretenimiento', '🎬', 'variable', NULL, TRUE, 50),
    ('Suscripciones', '📺', 'fixed', NULL, TRUE, 51),
    ('Viajes', '✈️', 'variable', NULL, TRUE, 52),
    ('Hobbies', '🎨', 'variable', NULL, TRUE, 53),
    
    -- 👔 PERSONAL
    ('Ropa', '👔', 'variable', NULL, TRUE, 60),
    ('Cuidado Personal', '💇', 'variable', NULL, TRUE, 61),
    
    -- 💰 FINANZAS
    ('Ahorro', '🏦', 'both', NULL, TRUE, 70),
    ('Impuestos', '📋', 'fixed', NULL, TRUE, 71),
    ('Préstamos', '💳', 'fixed', NULL, TRUE, 72),
    
    -- 📦 OTROS
    ('Regalos', '🎁', 'variable', NULL, TRUE, 80),
    ('Donaciones', '❤️', 'variable', NULL, TRUE, 81),
    ('Otros', '📦', 'both', NULL, TRUE, 99);

-- ============================================================================
-- 8. FUNCIÓN PARA GENERAR GASTOS FIJOS AUTOMÁTICAMENTE (Día 1 del mes)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_monthly_fixed_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template RECORD;
    first_admin_id UUID;
BEGIN
    -- Recorrer todos los templates activos mensuales
    FOR template IN 
        SELECT et.*, f.id as fam_id
        FROM public.expense_templates et
        JOIN public.families f ON et.family_id = f.id
        WHERE et.is_active = TRUE 
        AND et.frequency = 'monthly'
    LOOP
        -- Obtener el primer admin de la familia
        SELECT id INTO first_admin_id
        FROM public.users
        WHERE family_id = template.family_id AND is_family_admin = TRUE
        LIMIT 1;
        
        -- Si no hay admin, usar cualquier usuario de la familia
        IF first_admin_id IS NULL THEN
            SELECT id INTO first_admin_id
            FROM public.users
            WHERE family_id = template.family_id
            LIMIT 1;
        END IF;
        
        -- Solo insertar si hay un usuario disponible
        IF first_admin_id IS NOT NULL THEN
            -- Verificar que no exista ya para este mes
            IF NOT EXISTS (
                SELECT 1 FROM public.transactions
                WHERE template_id = template.id
                AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
            ) THEN
                INSERT INTO public.transactions (
                    family_id,
                    user_id,
                    category_id,
                    template_id,
                    amount,
                    description,
                    date,
                    status,
                    is_prorated
                ) VALUES (
                    template.family_id,
                    first_admin_id,
                    template.category_id,
                    template.id,
                    template.amount,
                    template.title,
                    CURRENT_DATE,
                    'pending',
                    FALSE
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.generate_monthly_fixed_expenses IS 'Genera transacciones pendientes para gastos fijos mensuales. Ejecutar vía cron el día 1.';

-- ============================================================================
-- 9. VISTAS ÚTILES PARA EL DASHBOARD
-- ============================================================================

-- Vista: Resumen mensual por familia
CREATE OR REPLACE VIEW public.v_monthly_summary AS
SELECT 
    family_id,
    DATE_TRUNC('month', date) AS month,
    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS total_paid,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS total_pending,
    SUM(amount) AS total_amount,
    COUNT(*) AS transaction_count
FROM public.transactions
GROUP BY family_id, DATE_TRUNC('month', date);

-- Vista: Gastos por categoría del mes actual
CREATE OR REPLACE VIEW public.v_current_month_by_category AS
SELECT 
    t.family_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.type AS category_type,
    SUM(t.amount) AS total_amount,
    COUNT(*) AS transaction_count
FROM public.transactions t
LEFT JOIN public.categories c ON t.category_id = c.id
WHERE DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY t.family_id, c.name, c.icon, c.type;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
