/*
# Add bg_video_url column to profiles

1. Modified Tables
- `profiles`: Adds `bg_video_url` (text) column to store an optional MP4 video
  background URL. When set, the bio page plays the video as the background
  instead of the static background image.

2. Security
- No policy changes needed — the column inherits existing RLS policies on
  `profiles` (anon + authenticated full CRUD).
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bg_video_url text DEFAULT '';
