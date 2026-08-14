/*
# Create profiles and links tables for link-in-bio app

1. New Tables
- `profiles`: Stores a creator's link-in-bio profile.
  - `id` (uuid, primary key)
  - `username` (text, unique, the handle shown in the bio)
  - `display_name` (text, name shown at top of bio page)
  - `bio` (text, short description under the name)
  - `avatar_url` (text, URL to profile picture)
  - `bg_url` (text, URL to background image/video)
  - `music_url` (text, URL to background audio track)
  - `instagram_username` (text, Instagram handle for deep link + follow button)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- `links`: Stores individual links attached to a profile.
  - `id` (uuid, primary key)
  - `profile_id` (uuid, foreign key to profiles.id, cascade delete)
  - `title` (text, display text for the link button)
  - `url` (text, the destination URL)
  - `is_locked` (boolean, whether the link is follow-to-unlock gated)
  - `position` (integer, display order)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- This is a single-tenant demo app with no sign-in screen, so all CRUD
  is open to anon + authenticated (data is intentionally public/shared).

3. Seed Data
- Inserts one default profile with placeholder content and three sample links
  so the bio page renders immediately on first load.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL DEFAULT 'demo',
  display_name text NOT NULL DEFAULT 'Your Name',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  bg_url text DEFAULT '',
  music_url text DEFAULT '',
  instagram_username text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Link',
  url text NOT NULL DEFAULT '#',
  is_locked boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_links" ON links;
CREATE POLICY "anon_select_links" ON links FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_links" ON links;
CREATE POLICY "anon_insert_links" ON links FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_links" ON links;
CREATE POLICY "anon_update_links" ON links FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_links" ON links;
CREATE POLICY "anon_delete_links" ON links FOR DELETE
  TO anon, authenticated USING (true);

-- Seed a default profile if none exists
INSERT INTO profiles (username, display_name, bio, avatar_url, bg_url, music_url, instagram_username)
SELECT 'demo', 'Alex Rivera', 'Photographer & content creator based in LA. Follow my journey and unlock exclusive links below.', '', '', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'alexrivera'
WHERE NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- Seed sample links for the default profile
INSERT INTO links (profile_id, title, url, is_locked, position)
SELECT id, 'Latest YouTube Video', 'https://youtube.com', false, 0
FROM profiles WHERE username = 'demo'
AND NOT EXISTS (SELECT 1 FROM links LIMIT 1);

INSERT INTO links (profile_id, title, url, is_locked, position)
SELECT id, 'Exclusive Photo Drop', 'https://example.com/exclusive', true, 1
FROM profiles WHERE username = 'demo'
AND NOT EXISTS (SELECT 1 FROM links WHERE position = 1);

INSERT INTO links (profile_id, title, url, is_locked, position)
SELECT id, 'My Merch Store', 'https://example.com/merch', false, 2
FROM profiles WHERE username = 'demo'
AND NOT EXISTS (SELECT 1 FROM links WHERE position = 2);
