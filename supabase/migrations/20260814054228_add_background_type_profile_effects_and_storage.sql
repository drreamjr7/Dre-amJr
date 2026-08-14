/*
# Add background type, GIF support, profile effects, and file upload storage

1. Modified Tables
- `profiles`: Adds several new columns for enhanced customization:
  - `bg_type` (text, default 'image') — controls which background media renders: 'image', 'video', or 'gif'
  - `bg_gif_url` (text, default '') — URL for GIF background (used when bg_type = 'gif')
  - `profile_effect` (text, default 'none') — visual effect applied to the profile section: 'none', 'glow', 'pulse', 'float', 'shimmer', 'rainbow'
  - `effect_color` (text, default '#38bdf8') — hex color used by the profile effect
  - `effect_speed` (text, default 'normal') — animation speed for the effect: 'slow', 'normal', 'fast'

2. Storage
- Creates a public storage bucket `profile-assets` for user-uploaded avatar images,
  background images/videos/GIFs, and music files.
- Adds policies allowing anon + authenticated users to upload, read, and delete
  files in the bucket (single-tenant demo app, no sign-in).

3. Security
- No RLS policy changes needed on `profiles` — the new columns inherit existing
  open CRUD policies (anon + authenticated).
- Storage bucket policies are open to anon + authenticated for this demo app.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bg_type text NOT NULL DEFAULT 'image';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bg_gif_url text NOT NULL DEFAULT '';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_effect text NOT NULL DEFAULT 'none';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS effect_color text NOT NULL DEFAULT '#38bdf8';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS effect_speed text NOT NULL DEFAULT 'normal';

-- Create the profile-assets storage bucket (public so files are readable via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-assets', 'profile-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon + authenticated to manage files in profile-assets
DROP POLICY IF EXISTS "anon_read_profile_assets" ON storage.objects;
CREATE POLICY "anon_read_profile_assets" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'profile-assets');

DROP POLICY IF EXISTS "anon_insert_profile_assets" ON storage.objects;
CREATE POLICY "anon_insert_profile_assets" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'profile-assets');

DROP POLICY IF EXISTS "anon_update_profile_assets" ON storage.objects;
CREATE POLICY "anon_update_profile_assets" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'profile-assets')
  WITH CHECK (bucket_id = 'profile-assets');

DROP POLICY IF EXISTS "anon_delete_profile_assets" ON storage.objects;
CREATE POLICY "anon_delete_profile_assets" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'profile-assets');
