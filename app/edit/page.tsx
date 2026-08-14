'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Link, BgType, ProfileEffect, EffectSpeed } from '@/lib/types';
import { DEFAULT_AVATAR, DEFAULT_BG } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Lock, Unlock, ArrowLeft, Save, GripVertical, ExternalLink, Check, Upload, Image as ImageIcon, Video, Music, Sparkles, Palette, Zap } from 'lucide-react';

const EFFECT_OPTIONS: { value: ProfileEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'glow', label: 'Glow' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'float', label: 'Float' },
  { value: 'shimmer', label: 'Shimmer' },
  { value: 'rainbow', label: 'Rainbow' },
];

const SPEED_OPTIONS: { value: EffectSpeed; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

const BG_TYPE_OPTIONS: { value: BgType; label: string; icon: typeof ImageIcon }[] = [
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'gif', label: 'GIF', icon: ImageIcon },
];

export default function EditPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [bgVideoUrl, setBgVideoUrl] = useState('');
  const [bgGifUrl, setBgGifUrl] = useState('');
  const [bgType, setBgType] = useState<BgType>('image');
  const [musicUrl, setMusicUrl] = useState('');
  const [igUsername, setIgUsername] = useState('');
  const [profileEffect, setProfileEffect] = useState<ProfileEffect>('none');
  const [effectColor, setEffectColor] = useState('#38bdf8');
  const [effectSpeed, setEffectSpeed] = useState<EffectSpeed>('normal');

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    async function loadData() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'demo')
        .maybeSingle();

      if (profileData) {
        const p = profileData as Profile;
        setProfile(p);
        setDisplayName(p.display_name);
        setBio(p.bio || '');
        setAvatarUrl(p.avatar_url || '');
        setBgUrl(p.bg_url || '');
        setBgVideoUrl(p.bg_video_url || '');
        setBgGifUrl(p.bg_gif_url || '');
        setBgType((p.bg_type as BgType) || 'image');
        setMusicUrl(p.music_url || '');
        setIgUsername(p.instagram_username || '');
        setProfileEffect((p.profile_effect as ProfileEffect) || 'none');
        setEffectColor(p.effect_color || '#38bdf8');
        setEffectSpeed((p.effect_speed as EffectSpeed) || 'normal');

        const { data: linksData } = await supabase
          .from('links')
          .select('*')
          .eq('profile_id', p.id)
          .order('position', { ascending: true });
        setLinks((linksData || []) as Link[]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        bg_url: bgUrl,
        bg_video_url: bgVideoUrl,
        bg_gif_url: bgGifUrl,
        bg_type: bgType,
        music_url: musicUrl,
        instagram_username: igUsername,
        profile_effect: profileEffect,
        effect_color: effectColor,
        effect_speed: effectSpeed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadFile = async (file: File, field: 'avatar' | 'bg_image' | 'bg_video' | 'bg_gif' | 'music') => {
    setUploading(field);
    const ext = file.name.split('.').pop();
    const fileName = `${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('profile-assets')
      .upload(fileName, file);

    if (error) {
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('profile-assets')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    if (field === 'avatar') setAvatarUrl(publicUrl);
    else if (field === 'bg_image') setBgUrl(publicUrl);
    else if (field === 'bg_video') setBgVideoUrl(publicUrl);
    else if (field === 'bg_gif') setBgGifUrl(publicUrl);
    else if (field === 'music') setMusicUrl(publicUrl);

    setUploading(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'bg_image' | 'bg_video' | 'bg_gif' | 'music') => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, field);
  };

  const addLink = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('links')
      .insert({
        profile_id: profile.id,
        title: 'New Link',
        url: 'https://',
        is_locked: false,
        position: links.length,
      })
      .select()
      .maybeSingle();

    if (data) {
      setLinks([...links, data as Link]);
    }
  };

  const updateLink = async (id: string, updates: Partial<Link>) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    await supabase.from('links').update(updates).eq('id', id);
  };

  const deleteLink = async (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
    await supabase.from('links').delete().eq('id', id);
  };

  const moveLink = async (id: string, direction: 'up' | 'down') => {
    const index = links.findIndex((l) => l.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const newLinks = [...links];
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    newLinks.forEach((l, i) => {
      l.position = i;
    });
    setLinks(newLinks);

    for (const l of newLinks) {
      await supabase.from('links').update({ position: l.position }).eq('id', l.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const previewBgUrl = bgType === 'video' ? bgVideoUrl : bgType === 'gif' ? bgGifUrl : bgUrl;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <a href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to bio
            </Button>
          </a>
          <h1 className="text-xl font-bold gradient-text" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Edit Profile
          </h1>
        </div>

        {/* Profile card */}
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize how your bio page looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview avatar + bg */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
              {bgType === 'video' && bgVideoUrl ? (
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src={bgVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${previewBgUrl || DEFAULT_BG})` }}
                />
              )}
              <div className="absolute inset-0 bg-background/40" />
              <div
                className="absolute bottom-3 left-3 w-16 h-16 rounded-full bg-cover bg-center border-2 border-white/30"
                style={{ backgroundImage: `url(${avatarUrl || DEFAULT_AVATAR})` }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="glass border-white/10 bg-white/5"
                placeholder="Your Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="glass border-white/10 bg-white/5 resize-none"
                rows={3}
                placeholder="Tell people about yourself..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Instagram Username</label>
              <Input
                value={igUsername}
                onChange={(e) => setIgUsername(e.target.value)}
                className="glass border-white/10 bg-white/5"
                placeholder="yourusername (no @)"
              />
            </div>

            {/* Avatar upload */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" /> Avatar Image
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="glass border-white/10 bg-white/5 text-sm flex-1"
                  placeholder="Paste URL or upload..."
                />
                <input
                  ref={(el) => { fileInputRefs.current['avatar'] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'avatar')}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploading === 'avatar'}
                  onClick={() => fileInputRefs.current['avatar']?.click()}
                  className="glass border-white/10 hover:bg-white/10 gap-1.5 whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading === 'avatar' ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>

            {/* Background type selector */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Background Type</label>
              <div className="grid grid-cols-3 gap-2">
                {BG_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setBgType(opt.value)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        bgType === opt.value
                          ? 'glass-strong border border-primary/50 text-primary glow-primary'
                          : 'glass border border-white/5 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background image URL + upload */}
            {bgType === 'image' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3" /> Background Image
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={bgUrl}
                    onChange={(e) => setBgUrl(e.target.value)}
                    className="glass border-white/10 bg-white/5 text-sm flex-1"
                    placeholder="Paste URL or upload..."
                  />
                  <input
                    ref={(el) => { fileInputRefs.current['bg_image'] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'bg_image')}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploading === 'bg_image'}
                    onClick={() => fileInputRefs.current['bg_image']?.click()}
                    className="glass border-white/10 hover:bg-white/10 gap-1.5 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading === 'bg_image' ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            )}

            {/* Background video URL + upload */}
            {bgType === 'video' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Video className="w-3 h-3" /> Background Video (MP4)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={bgVideoUrl}
                    onChange={(e) => setBgVideoUrl(e.target.value)}
                    className="glass border-white/10 bg-white/5 text-sm flex-1"
                    placeholder="Paste URL or upload .mp4..."
                  />
                  <input
                    ref={(el) => { fileInputRefs.current['bg_video'] = el; }}
                    type="file"
                    accept="video/mp4,video/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'bg_video')}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploading === 'bg_video'}
                    onClick={() => fileInputRefs.current['bg_video']?.click()}
                    className="glass border-white/10 hover:bg-white/10 gap-1.5 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading === 'bg_video' ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Video plays as a looping background. MP4 recommended for best performance.
                </p>
              </div>
            )}

            {/* Background GIF URL + upload */}
            {bgType === 'gif' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3" /> Background GIF
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={bgGifUrl}
                    onChange={(e) => setBgGifUrl(e.target.value)}
                    className="glass border-white/10 bg-white/5 text-sm flex-1"
                    placeholder="Paste URL or upload .gif..."
                  />
                  <input
                    ref={(el) => { fileInputRefs.current['bg_gif'] = el; }}
                    type="file"
                    accept="image/gif"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'bg_gif')}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploading === 'bg_gif'}
                    onClick={() => fileInputRefs.current['bg_gif']?.click()}
                    className="glass border-white/10 hover:bg-white/10 gap-1.5 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading === 'bg_gif' ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Animated GIF plays as a looping background.
                </p>
              </div>
            )}

            {/* Music upload */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Music className="w-3 h-3" /> Background Music (MP3)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  className="glass border-white/10 bg-white/5 text-sm flex-1"
                  placeholder="Paste URL or upload..."
                />
                <input
                  ref={(el) => { fileInputRefs.current['music'] = el; }}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'music')}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploading === 'music'}
                  onClick={() => fileInputRefs.current['music']?.click()}
                  className="glass border-white/10 hover:bg-white/10 gap-1.5 whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading === 'music' ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>

            <Button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 glow-primary"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Effects card */}
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Profile Effects
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Add animated visual effects to your profile section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Effect type */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Effect Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EFFECT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setProfileEffect(opt.value)}
                    className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                      profileEffect === opt.value
                        ? 'glass-strong border border-accent/50 text-accent glow-accent'
                        : 'glass border border-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Effect color */}
            {profileEffect !== 'none' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Palette className="w-3 h-3" /> Effect Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={effectColor}
                      onChange={(e) => setEffectColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10"
                    />
                    <Input
                      value={effectColor}
                      onChange={(e) => setEffectColor(e.target.value)}
                      className="glass border-white/10 bg-white/5 text-sm flex-1"
                      placeholder="#38bdf8"
                    />
                    {/* Color presets */}
                    <div className="flex gap-1.5">
                      {['#38bdf8', '#c084fc', '#f472b6', '#fbbf24', '#34d399', '#f87171'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setEffectColor(c)}
                          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: c,
                            borderColor: effectColor === c ? '#fff' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Effect speed */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Animation Speed</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SPEED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setEffectSpeed(opt.value)}
                        className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                          effectSpeed === opt.value
                            ? 'glass-strong border border-primary/50 text-primary'
                            : 'glass border border-white/5 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Live Preview</label>
                  <div className="flex justify-center py-4">
                    <div
                      className={`relative effect-${profileEffect} effect-speed-${effectSpeed}`}
                      style={{ ['--effect-color' as string]: effectColor }}
                    >
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-accent to-pink-500 blur-md" />
                      <div
                        className="relative w-20 h-20 rounded-full bg-cover bg-center border-2 border-white/20"
                        style={{ backgroundImage: `url(${avatarUrl || DEFAULT_AVATAR})` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Links card */}
        <Card className="glass-strong border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-foreground">Links</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Add and manage your bio links
                </CardDescription>
              </div>
              <Button
                onClick={addLink}
                size="sm"
                variant="outline"
                className="glass border-white/10 hover:bg-white/10 gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {links.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No links yet. Click &quot;Add&quot; to create one.
              </p>
            )}
            {links.map((link, i) => (
              <div
                key={link.id}
                className="glass rounded-xl p-3 space-y-3 border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveLink(link.id, 'up')}
                      disabled={i === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveLink(link.id, 'down')}
                      disabled={i === links.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                    >
                      ▼
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground w-4 text-center">{i + 1}</span>
                  <Input
                    value={link.title}
                    onChange={(e) => updateLink(link.id, { title: e.target.value })}
                    className="glass border-white/10 bg-white/5 text-sm flex-1"
                    placeholder="Link title"
                  />
                  <button
                    onClick={() => updateLink(link.id, { is_locked: !link.is_locked })}
                    className={`p-2 rounded-lg transition-colors ${
                      link.is_locked
                        ? 'text-accent bg-accent/10 hover:bg-accent/20'
                        : 'text-muted-foreground hover:text-foreground bg-white/5'
                    }`}
                    title={link.is_locked ? 'Locked - follow to unlock' : 'Unlocked'}
                  >
                    {link.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive bg-white/5 hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-10">
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(link.id, { url: e.target.value })}
                    className="glass border-white/10 bg-white/5 text-sm flex-1"
                    placeholder="https://..."
                  />
                </div>
                {link.is_locked && (
                  <p className="pl-10 text-xs text-accent/70 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Visitors must follow you on Instagram before this link opens
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="text-center pb-8">
          <a href="/">
            <Button variant="outline" className="glass border-white/10 hover:bg-white/10 gap-2">
              <ExternalLink className="w-4 h-4" />
              View Live Bio
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
