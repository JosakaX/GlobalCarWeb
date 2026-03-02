-- Run this in your Supabase SQL Editor

-- 1. Create the 'vehicles' table
CREATE TABLE public.vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  price numeric NOT NULL,
  status text NOT NULL,
  description text,
  images text[],
  likes integer DEFAULT 0
);

-- 2. Create the storage bucket for vehicle images
insert into storage.buckets (id, name, public) 
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do nothing;

-- 3. Policy: Allow public view of images
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'vehicle-images' );

-- 4. Policy: Allow anon inserts (for MVP testing)
create policy "Anon Uploads" 
on storage.objects for insert 
with check ( bucket_id = 'vehicle-images' );

-- 5. Policies for vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

create policy "Enable read access for all users"
on "public"."vehicles"
as permissive
for select
to public
using (true);

create policy "Enable insert for all users"
on "public"."vehicles"
as permissive
for insert
to public
with check (true);

-- 6. Policy: Enable update access for all users (Needed for the Like button and editing in admin panel)
create policy "Enable update for all users"
on "public"."vehicles"
as permissive
for update
to public
using (true)
with check (true);

-- 7. Policy: Enable delete access for all users (Needed for deleting in admin panel)
create policy "Enable delete for all users"
on "public"."vehicles"
as permissive
for delete
to public
using (true);

-- 8. Create the 'site_settings' table for dynamic site configuration (like homepage price list images)
CREATE TABLE public.site_settings (
  id integer PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL
);

-- Insert default values mapped to your static files
INSERT INTO public.site_settings (id, key, value) VALUES 
(1, 'price_list_1', '/static/images/price-list-1.jpg'),
(2, 'price_list_2', '/static/images/price-list-2.jpg');

-- 9. Set up Policies for site_settings table
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

create policy "Enable read access for all users on settings"
on "public"."site_settings"
as permissive
for select
to public
using (true);

create policy "Enable update for all users on settings"
on "public"."site_settings"
as permissive
for update
to public
using (true)
with check (true);
