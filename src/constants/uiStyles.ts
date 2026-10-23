export type UIStyleId =
  | 'glassmorphism'
  | 'claymorphism'
  | 'neumorphism'
  | 'neobrutalism'
  | 'frosted_crystal'
  | 'cyber_hud'
  | 'retro_crt'
  | 'holographic'
  | 'bento_matte'
  | 'carbon_fiber'
  | 'vantablack'
  | 'blueprint';

export interface UIStyleSpec {
  id: UIStyleId;
  name: string;
  tagline: string;
  badge: string;
  cardClass: string;
  buttonClass: string;
  pillClass: string;
}

export const UI_STYLES: UIStyleSpec[] = [
  {
    id: 'glassmorphism',
    name: 'Specular Glassmorphism',
    tagline: 'Linear & Raycast translucent crystal with 1px top specular refraction',
    badge: 'DEFAULT',
    cardClass:
      'backdrop-blur-2xl bg-white/[0.03] border border-white/[0.09] rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_24px_60px_rgba(0,0,0,0.75)]',
    buttonClass:
      'backdrop-blur-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-all',
    pillClass: 'bg-black/45 border border-white/[0.07] rounded-xl',
  },
  {
    id: 'claymorphism',
    name: '3D Claymorphism',
    tagline: 'Inflated soft matte 3D clay surfaces with deep inner rim shadows',
    badge: '3D CLAY',
    cardClass:
      'bg-[#151621]/95 border-2 border-white/[0.12] rounded-[28px] shadow-[inset_0_6px_14px_rgba(255,255,255,0.16),inset_0_-8px_16px_rgba(0,0,0,0.65),0_20px_40px_rgba(0,0,0,0.6)]',
    buttonClass:
      'bg-[#1c1e2d] hover:bg-[#232638] rounded-2xl border border-white/15 shadow-[inset_0_3px_6px_rgba(255,255,255,0.18),inset_0_-4px_6px_rgba(0,0,0,0.6),0_6px_14px_rgba(0,0,0,0.4)] active:translate-y-0.5 transition-all',
    pillClass:
      'bg-[#10111a] rounded-2xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_-1px_2px_rgba(255,255,255,0.08)]',
  },
  {
    id: 'neumorphism',
    name: 'Soft Neumorphism',
    tagline: 'Tactile extruded dark silicone chassis with dual-directional bevels',
    badge: 'TACTILE',
    cardClass:
      'bg-[#121318] border border-white/[0.03] rounded-3xl shadow-[10px_10px_24px_#070709,-8px_-8px_20px_rgba(255,255,255,0.035),inset_1px_1px_2px_rgba(255,255,255,0.05)]',
    buttonClass:
      'bg-[#14151b] rounded-xl shadow-[5px_5px_12px_#070709,-4px_-4px_10px_rgba(255,255,255,0.03)] hover:shadow-[inset_3px_3px_7px_#070709,inset_-2px_-2px_6px_rgba(255,255,255,0.03)] transition-all',
    pillClass:
      'bg-[#0e0f13] rounded-xl shadow-[inset_4px_4px_8px_#060608,inset_-3px_-3px_7px_rgba(255,255,255,0.025)]',
  },
  {
    id: 'neobrutalism',
    name: 'Neo-Brutalism',
    tagline: 'High-contrast architectural borders with hard 5px offset shadows',
    badge: 'BOLD',
    cardClass:
      'bg-[#0d0d11] border-2 border-white/80 rounded-none shadow-[6px_6px_0px_0px_var(--dt-accent,#10b981)]',
    buttonClass:
      'bg-[#14141b] border-2 border-white/80 rounded-none shadow-[3px_3px_0px_0px_var(--dt-accent,#10b981)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--dt-accent,#10b981)] transition-all',
    pillClass: 'bg-black border-2 border-white/60 rounded-none',
  },
  {
    id: 'frosted_crystal',
    name: 'Apple Vision Crystal',
    tagline: 'Ultra-bright spatial computing frosted acrylic with luminous edges',
    badge: 'SPATIAL',
    cardClass:
      'backdrop-blur-3xl bg-gradient-to-b from-white/[0.10] to-white/[0.03] border border-white/20 rounded-[26px] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.35),0_30px_80px_rgba(0,0,0,0.85)]',
    buttonClass:
      'backdrop-blur-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/25 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-all',
    pillClass: 'backdrop-blur-xl bg-black/30 border border-white/15 rounded-2xl',
  },
  {
    id: 'cyber_hud',
    name: 'Cyberpunk Mecha HUD',
    tagline: 'Razor-sharp tactical corners with glowing laser accent rails',
    badge: 'SCI-FI',
    cardClass:
      'bg-[#080a10]/90 border border-[var(--dt-accent,#10b981)]/50 rounded-tr-2xl rounded-bl-2xl rounded-tl-sm rounded-br-sm shadow-[0_0_25px_rgba(16,185,129,0.15),inset_0_0_20px_rgba(16,185,129,0.05)]',
    buttonClass:
      'bg-black/70 border border-[var(--dt-accent,#10b981)]/60 hover:bg-[var(--dt-accent,#10b981)]/15 rounded-tr-xl rounded-bl-xl transition-all',
    pillClass: 'bg-black/80 border border-white/15 rounded-tr-lg rounded-bl-lg',
  },
  {
    id: 'retro_crt',
    name: 'Phosphor CRT Monitor',
    tagline: '1980s mainframe terminal enclosure with scanline inner glow',
    badge: 'RETRO',
    cardClass:
      'bg-[#060a07]/95 border-2 border-[var(--dt-accent,#10b981)]/40 rounded-xl shadow-[inset_0_0_35px_rgba(16,185,129,0.12),0_0_20px_rgba(0,0,0,0.9)]',
    buttonClass:
      'bg-black border border-[var(--dt-accent,#10b981)]/50 hover:bg-[var(--dt-accent,#10b981)]/20 rounded-md uppercase tracking-wider transition-all',
    pillClass: 'bg-black border border-[var(--dt-accent,#10b981)]/30 rounded-md',
  },
  {
    id: 'holographic',
    name: 'Iridescent Holo Foil',
    tagline: 'Prismatic multi-spectrum border shimmer over deep obsidian glass',
    badge: 'PRISM',
    cardClass:
      'backdrop-blur-2xl bg-[#0b0b12]/85 border border-fuchsia-400/30 rounded-2xl shadow-[0_0_35px_-5px_rgba(168,85,247,0.22),inset_0_1px_0_rgba(255,255,255,0.25)]',
    buttonClass:
      'bg-gradient-to-r from-emerald-500/10 via-violet-500/10 to-pink-500/10 hover:from-emerald-500/20 hover:to-pink-500/20 border border-white/20 rounded-xl transition-all',
    pillClass: 'bg-black/50 border border-violet-400/20 rounded-xl',
  },
  {
    id: 'bento_matte',
    name: 'Minimalist Bento Matte',
    tagline: 'Zero-glare Apple keynote bento grid with crisp hairline dividers',
    badge: 'MATTE',
    cardClass: 'bg-[#101013] border border-white/[0.07] rounded-2xl shadow-xl',
    buttonClass:
      'bg-[#18181c] hover:bg-[#222228] border border-white/[0.07] rounded-xl transition-all',
    pillClass: 'bg-[#0a0a0c] border border-white/[0.05] rounded-xl',
  },
  {
    id: 'carbon_fiber',
    name: 'Motorsport Forged Carbon',
    tagline: 'High-stiffness dark weave chassis with titanium accent trim',
    badge: 'CARBON',
    cardClass:
      'bg-gradient-to-br from-[#141518] via-[#0c0d10] to-[#141518] border border-white/15 rounded-2xl shadow-[inset_0_2px_0_rgba(255,255,255,0.12),0_20px_50px_rgba(0,0,0,0.85)]',
    buttonClass:
      'bg-[#181a1f] hover:bg-[#20232a] border border-white/15 rounded-xl transition-all',
    pillClass: 'bg-black/60 border border-white/10 rounded-xl',
  },
  {
    id: 'vantablack',
    name: 'OLED Vantablack Stealth',
    tagline: 'Pure #000000 zero-emission pixels for late-night flow state',
    badge: 'OLED',
    cardClass: 'bg-black border border-white/[0.06] rounded-2xl shadow-none',
    buttonClass:
      'bg-black hover:bg-white/[0.05] border border-white/[0.1] rounded-xl transition-all',
    pillClass: 'bg-black border border-white/[0.06] rounded-xl',
  },
  {
    id: 'blueprint',
    name: 'CAD Engineering Schematic',
    tagline: 'Technical drafting wireframe with dashed precision tolerances',
    badge: 'CAD',
    cardClass:
      'bg-[#070b12]/90 border border-dashed border-sky-400/40 rounded-lg shadow-[inset_0_0_20px_rgba(56,189,248,0.06)]',
    buttonClass:
      'bg-sky-950/30 hover:bg-sky-900/40 border border-dashed border-sky-400/40 rounded-md transition-all',
    pillClass: 'bg-black/50 border border-dashed border-sky-400/30 rounded-md',
  },
];