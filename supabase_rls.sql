-- Políticas de Seguridad de Supabase para Global Car
-- Habilita RLS en las tablas principales

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 1. VEHÍCULOS
-- Lectura pública
CREATE POLICY "Public read for vehicles" ON vehicles
    FOR SELECT USING (true);

-- Escritura solo para autenticados (Admin)
CREATE POLICY "Admin full access for vehicles" ON vehicles
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. MARCAS
CREATE POLICY "Public read for marcas" ON marcas
    FOR SELECT USING (true);

-- 3. SITE SETTINGS
CREATE POLICY "Public read for settings" ON site_settings
    FOR SELECT USING (true);
