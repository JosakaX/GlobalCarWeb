-- ============================================================
-- GLOBAL CAR — Configuración de Row Level Security (RLS)
-- ============================================================
-- INSTRUCCIONES:
--   1. Ir a: supabase.com → Tu Proyecto → SQL Editor
--   2. Pegar todo este contenido y presionar "Run"
--   3. Verificar en Table Editor que cada tabla muestre el candado activo
-- ============================================================

ALTER TABLE vehicles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de vehiculos" ON vehicles;
DROP POLICY IF EXISTS "Solo admins crean vehiculos"  ON vehicles;
DROP POLICY IF EXISTS "Solo admins editan vehiculos" ON vehicles;
DROP POLICY IF EXISTS "Solo admins borran vehiculos" ON vehicles;
DROP POLICY IF EXISTS "Lectura publica de marcas"    ON marcas;
DROP POLICY IF EXISTS "Solo admins gestionan marcas" ON marcas;
DROP POLICY IF EXISTS "Solo admins leen settings"    ON site_settings;
DROP POLICY IF EXISTS "Solo admins editan settings"  ON site_settings;

CREATE POLICY "Lectura publica de vehiculos"
ON vehicles FOR SELECT TO anon, authenticated
USING (status IN ('available', 'transit'));

CREATE POLICY "Solo admins crean vehiculos"
ON vehicles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Solo admins editan vehiculos"
ON vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Solo admins borran vehiculos"
ON vehicles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Lectura publica de marcas"
ON marcas FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Solo admins gestionan marcas"
ON marcas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Solo admins leen settings"
ON site_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admins editan settings"
ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
