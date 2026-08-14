'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Link } from '@/lib/types';
import { DEFAULT_AVATAR, DEFAULT_BG } from '@/lib/types';
import { Instagram, Lock, Music, Volume2, VolumeX, ExternalLink, Sparkles } from 'lucide-react';

export default function BioPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [followed, setFollowed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'demo')
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
        const { data: linksData } = await supabase
          .from('links')
          .select('*')
          .eq('profile_id', (profileData as Profile).id)
          .order('position', { ascending: true });
        setLinks((linksData || []) as Link[]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleEnter = useCallback(() => {
    setEntered(true);
    if (audioRef.current && profile?.music_url) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
  }, [profile]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
  };

  const handleFollowClick = () => {
    if (!profile?.instagram_username) return;
    window.location.href = `instagram://user?username=${profile.instagram_username}`;
    setTimeout(() => setFollowed(true), 1500);
  };

  const handleLinkClick = (link: Link, e: React.MouseEvent) => {
    if (link.is_locked && !followed) {
      e.preventDefault();
      document.getElementById('instagram-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
        </div>
      </div>
    );
  }

  const bgType = profile?.bg_type || 'image';
  const bgUrl = profile?.bg_url || DEFAULT_BG;
  const bgVideoUrl = profile?.bg_video_url || '';
  const bgGifUrl = profile?.bg_gif_url || '';
  const avatarUrl = profile?.avatar_url || DEFAULT_AVATAR;
  const igUsername = profile?.instagram_username || '';
  const effect = profile?.profile_effect || 'none';
  const effectColor = profile?.effect_color || '#38bdf8';
  const effectSpeed = profile?.effect_speed || 'normal';

  const renderBackground = () => {
    if (bgType === 'video' && bgVideoUrl) {
      return (
        <video
          className="absolute inset-0 w-full h-full object-cover scale-110"
          src={bgVideoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      );
    }
    const url = bgType === 'gif' ? (bgGifUrl || bgUrl) : bgUrl;
    return (
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: `url(${url})` }}
      />
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background media */}
      <div className="fixed inset-0 z-0">
        {renderBackground()}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background/90" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Audio element */}
      {profile?.music_url && (
        <audio ref={audioRef} src={profile.music_url} loop preload="auto" />
      )}

      {/* Start screen */}
      {!entered && (
        <div
          onClick={handleEnter}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer bg-background/80 backdrop-blur-md animate-fade-in"
        >
          <div className="text-center space-y-8 animate-scale-in">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse-glow" />
              <div className="relative w-20 h-20 rounded-full glass-strong flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold gradient-text animate-gradient-shift" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {profile?.display_name || 'linkd'}
              </h1>
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                Click anywhere to enter
              </p>
            </div>
            {profile?.music_url && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Music className="w-3 h-3" />
                <span>Music will start playing</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`relative z-10 min-h-screen flex flex-col items-center px-4 py-12 transition-all duration-700 ${entered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Music toggle */}
        {profile?.music_url && (
          <button
            onClick={toggleMusic}
            className="fixed top-6 right-6 z-20 w-11 h-11 rounded-full glass-strong flex items-center justify-center hover:scale-110 transition-transform glow-primary"
            aria-label="Toggle music"
          >
            {musicPlaying ? (
              <Volume2 className="w-5 h-5 text-primary" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Edit link */}
        <a
          href="/edit"
          className="fixed top-6 left-6 z-20 px-4 py-2 rounded-full glass text-xs font-medium text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
        >
          Edit Profile
        </a>

        {/* Profile section */}
        <div className="w-full max-w-md space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Avatar with effect */}
          <div className="flex flex-col items-center space-y-4">
            <div
              className={`relative ${effect !== 'none' ? `effect-${effect} effect-speed-${effectSpeed}` : ''}`}
              style={{ ['--effect-color' as string]: effectColor }}
            >
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-accent to-pink-500 blur-md animate-pulse-glow" />
              <div
                className="relative w-28 h-28 rounded-full bg-cover bg-center border-2 border-white/20"
                style={{ backgroundImage: `url(${avatarUrl})` }}
              />
            </div>
            <div className="text-center space-y-1">
              <h1
                className={`text-2xl font-bold text-foreground ${effect === 'shimmer' ? `effect-shimmer effect-speed-${effectSpeed}` : ''}`}
                style={{ fontFamily: 'var(--font-space-grotesk)', ['--effect-color' as string]: effectColor }}
              >
                {profile?.display_name || 'Your Name'}
              </h1>
              {igUsername && (
                <p className="text-sm text-muted-foreground">@{igUsername}</p>
              )}
            </div>
            {profile?.bio && (
              <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Instagram card */}
          {igUsername && (
            <div id="instagram-card" className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={handleFollowClick}
                className={`w-full glass-strong rounded-2xl p-4 flex items-center gap-4 hover:scale-[1.02] transition-all group ${
                  followed ? 'glow-pink' : 'gradient-border'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {followed ? 'Following on Instagram' : 'Follow on Instagram'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {followed ? 'Unlocked exclusive content!' : 'Unlock exclusive links below'}
                  </p>
                </div>
                {followed ? (
                  <Sparkles className="w-5 h-5 text-pink-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-primary/50 group-hover:border-primary transition-colors" />
                )}
              </button>
            </div>
          )}

          {/* Links */}
          <div className="space-y-3">
            {links.map((link, i) => {
              const isLocked = link.is_locked && !followed;
              return (
                <a
                  key={link.id}
                  href={isLocked ? undefined : link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleLinkClick(link, e)}
                  className={`block w-full glass rounded-2xl p-4 text-center transition-all animate-fade-in-up ${
                    isLocked
                      ? 'cursor-pointer hover:glow-accent'
                      : 'hover:glass-strong hover:scale-[1.02] hover:glow-primary'
                  }`}
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isLocked && <Lock className="w-4 h-4 text-accent" />}
                    <span className={`text-sm font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {isLocked ? 'Follow to unlock' : link.title}
                    </span>
                    {!isLocked && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </a>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-8 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <p className="text-xs text-muted-foreground/50">
              powered by linkd
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
