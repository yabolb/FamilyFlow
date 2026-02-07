# 🗄️ FamilyFlow - Base de Datos Supabase

## Configuración del Proyecto

**Project ID:** `cfjiyuihgyadmhjtvrqc`

**URL del Proyecto:** `https://cfjiyuihgyadmhjtvrqc.supabase.co`

## 📁 Estructura de Migraciones

```
supabase/
├── migrations/
│   └── 001_initial_schema.sql    # Schema inicial completo
└── README.md
```

## 🚀 Cómo Ejecutar el Schema

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto `FamilyFlow`
3. Ve a **SQL Editor** en el menú lateral
4. Crea una nueva query
5. Copia y pega el contenido de `migrations/001_initial_schema.sql`
6. Ejecuta el script

### Opción 2: Usando Supabase CLI

```bash
# Instalar CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref cfjiyuihgyadmhjtvrqc

# Ejecutar migraciones
supabase db push
```

## 📊 Modelo de Datos

```
┌─────────────────┐
│    families     │
│─────────────────│
│ id (PK)         │
│ name            │
│ invite_code     │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐     ┌─────────────────┐
│     users       │     │   categories    │
│─────────────────│     │─────────────────│
│ id (PK/FK auth) │     │ id (PK)         │
│ email           │     │ name            │
│ full_name       │     │ icon (emoji)    │
│ family_id (FK)  │     │ type            │
│ avatar_url      │     │ family_id (FK)  │◄── NULL = Sistema
│ is_family_admin │     │ is_system       │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────┐
│              transactions                    │
│─────────────────────────────────────────────│
│ id (PK)                                      │
│ family_id (FK) ─────────────────────────────│
│ user_id (FK) ───────────────────────────────│
│ category_id (FK) ───────────────────────────│
│ template_id (FK) → expense_templates         │
│ amount, description, date, status            │
│ is_prorated                                  │
└──────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           expense_templates                  │
│─────────────────────────────────────────────│
│ id (PK)                                      │
│ family_id (FK)                               │
│ title, amount, frequency, due_day            │
│ category_id (FK)                             │
└──────────────────────────────────────────────┘
```

## 🔐 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado para **multitenancy**:

| Tabla | Política |
|-------|----------|
| `families` | Ver/editar solo tu familia |
| `users` | Ver miembros de tu familia, editar solo tu perfil |
| `categories` | Ver sistema + familia, crear/editar solo familia |
| `expense_templates` | CRUD solo para tu familia |
| `transactions` | Ver familia, crear/editar/eliminar solo las propias |

## ⚙️ Triggers Automáticos

### `on_auth_user_created`
Cuando un usuario se registra en `auth.users`:
1. Lee `raw_user_meta_data` para obtener `family_name`, `full_name`, `invite_code`
2. Si tiene `invite_code` válido → Lo asigna a esa familia
3. Si no → Crea una nueva familia
4. Crea el perfil en `public.users`

### `set_updated_at_*`
Actualiza automáticamente `updated_at` en todas las tablas relevantes.

## 📂 Categorías del Sistema (Seed Data)

35 categorías predefinidas en español, organizadas por grupos:

- 🏠 **Vivienda**: Alquiler, Luz, Gas, Agua, Internet...
- 🚗 **Transporte**: Coche, Gasolina, Transporte Público...
- 🛒 **Vida Diaria**: Supermercado, Restaurantes, Café...
- 👨‍👩‍👧‍👦 **Familia**: Educación, Guardería, Mascotas...
- 🩺 **Salud**: Médico, Farmacia, Gimnasio...
- 🎉 **Ocio**: Entretenimiento, Suscripciones, Viajes...
- 👔 **Personal**: Ropa, Cuidado Personal
- 💰 **Finanzas**: Ahorro, Impuestos, Préstamos
- 📦 **Otros**: Regalos, Donaciones, Otros

## 🔧 Funciones Útiles

```sql
-- Obtener family_id del usuario actual
SELECT public.get_user_family_id();

-- Generar gastos fijos del mes (ejecutar día 1)
SELECT public.generate_monthly_fixed_expenses();
```

## 📈 Vistas del Dashboard

```sql
-- Resumen mensual por familia
SELECT * FROM public.v_monthly_summary;

-- Gastos por categoría del mes actual
SELECT * FROM public.v_current_month_by_category;
```
