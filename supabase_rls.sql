-- ============================================================
-- GLOBAL CAR — Configuración de Row Level Security (RLS)
-- ============================================================
-- INSTRUCCIONES:
--   1. Ir a: supabase.com → Tu Proyecto → SQL Editor
--   2. Pegar todo este contenido y presionar "Run"
--   3. Verificar en Table Editor que cada tabla muestre el candado activo
-- ============================================================

-- ============================================================
-- PASO 1: HABILITAR RLS EN TODAS LAS TABLAS
-- (Si ya está habilitado, este comando no hace nada dañino)
-- ============================================================

ALTER TABLE vehicles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 2: LIMPIAR POLÍTICAS ANTERIORES (evitar conflictos)
-- ============================================================

DROP POLICY IF EXISTS "Lectura publica de vehiculos"              ON vehicles;
DROP POLICY IF EXISTS "Solo admins crean vehiculos"               ON vehicles;
DROP POLICY IF EXISTS "Solo admins editan vehiculos"              ON vehicles;
DROP POLICY IF EXISTS "Solo admins borran vehiculos"              ON vehicles;
DROP POLICY IF EXISTS "Anon puede dar like"                       ON vehicles;

DROP POLICY IF EXISTS "Lectura publica de marcas"                 ON marcas;
DROP POLICY IF EXISTS "Solo admins gestionan marcas"              ON marcas;

DROP POLICY IF EXISTS "Acceso total bloqueado a site_settings"    ON site_settings;
DROP POLICY IF EXISTS "Solo admins leen settings"                 ON site_settings;
DROP POLICY IF EXISTS "Solo admins editan settings"               ON site_settings;

-- ============================================================
-- TABLA: vehicles
-- ============================================================

-- Lectura pública: cualquiera puede ver vehículos disponibles o en tránsito
-- (el anon key de Supabase puede leer estas filas)
CREATE POLICY "Lectura publica de vehiculos"
ON vehicles
FOR SELECT
TO anon, authenticated
USING (status IN ('available', 'transit'));

-- Solo usuarios autenticados (sesión admin de Flask) pueden insertar
CREATE POLICY "Solo admins crean vehiculos"
ON vehicles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Solo usuarios autenticados pueden actualizar
CREATE POLICY "Solo admins editan vehiculos"
ON vehicles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Solo usuarios autenticados pueden borrar
CREATE POLICY "Solo admins borran vehiculos"
ON vehicles
FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- TABLA: marcas
-- ============================================================

-- Lectura pública total (las marcas son información pública)
CREATE POLICY "Lectura publica de marcas"
ON marcas
FOR SELECT
TO anon, authenticated
USING (true);

-- Solo autenticados pueden INSERT, UPDATE, DELETE
CREATE POLICY "Solo admins gestionan marcas"
ON marcas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- TABLA: site_settings
-- ============================================================
-- Esta tabla contiene URLs de listas de precios → COMPLETAMENTE PRIVADA

-- Ningún usuario anónimo puede leer esta tabla
CREATE POLICY "Solo admins leen settings"
ON site_settings
FOR SELECT
TO authenticated
USING (true);

-- Solo autenticados pueden modificar settings
CREATE POLICY "Solo admins editan settings"
ON site_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- PASO 3: VERIFICACIÓN — Ejecutar estas queries para confirmar
-- ============================================================

-- Ver todas las políticas activas:
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('vehicles', 'marcas', 'site_settings')
ORDER BY tablename, policyname;

-- Verificar que RLS esté habilitado:
SELECT
    relname AS tabla,
    relrowsecurity AS rls_habilitado
FROM pg_class
WHERE relname IN ('vehicles', 'marcas', 'site_settings');

-- ============================================================
-- PASO 4: PRUEBA DE ACCESO ANÓNIMO
-- (Ejecutar en una terminal para confirmar que settings es privado)
-- ============================================================
-- curl https://xfcdhztdpfmdowkluumo.supabase.co/rest/v1/site_settings \
--   -H "apikey: TU_ANON_KEY" \
--   -H "Authorization: Bearer TU_ANON_KEY"
-- Resultado esperado: [] (array vacío, sin datos)
--
-- curl https://xfcdhztdpfmdowkluumo.supabase.co/rest/v1/vehicles \
--   -H "apikey: TU_ANON_KEY" \
--   -H "Authorization: Bearer TU_ANON_KEY"
-- Resultado esperado: Solo vehículos con status 'available' o 'transit'
-- ============================================================
