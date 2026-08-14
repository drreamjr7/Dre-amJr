export type BgType = 'image' | 'video' | 'gif';
export type ProfileEffect = 'none' | 'glow' | 'pulse' | 'float' | 'shimmer' | 'rainbow';
export type EffectSpeed = 'slow' | 'normal' | 'fast';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  bg_url: string;
  bg_video_url: string;
  bg_gif_url: string;
  bg_type: BgType;
  music_url: string;
  instagram_username: string;
  profile_effect: ProfileEffect;
  effect_color: string;
  effect_speed: EffectSpeed;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  is_locked: boolean;
  position: number;
  created_at: string;
}

export const DEFAULT_AVATAR =
  'https://images.pexels.com/photos/1649673/pexels-photo-1649673.jpeg?auto=compress&cs=tinysrgb&h=400&w=400';
export const DEFAULT_BG =
  'https://images.pexels.com/photos/14240656/pexels-photo-14240656.jpeg?auto=compress&cs=tinysrgb&h=1200&w=800';
