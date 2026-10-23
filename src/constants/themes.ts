export interface StudioTheme {
  id: string;
  name: string;
  group: 'Signature' | 'Classic IDE' | 'Modern Terminal' | 'Cyber & Neon' | 'Minimal & Retro';
  bg: string;
  surface: string;
  accent: string;
  glow: string;
}

const RAW_THEMES: [string, string, StudioTheme['group'], string, string, string, string][] = [
  ['obsidian', 'Vercel Obsidian', 'Signature', '#050507', '#0c0c10', '#10b981', 'rgba(16,185,129,0.22)'],
  ['linear_gold', 'Linear Gold', 'Signature', '#080706', '#12100d', '#f59e0b', 'rgba(245,158,11,0.22)'],
  ['raycast_red', 'Raycast Crimson', 'Signature', '#090506', '#140b0d', '#ff6363', 'rgba(255,99,99,0.22)'],
  ['supabase', 'Supabase Emerald', 'Signature', '#060907', '#0f1713', '#3ecf8e', 'rgba(62,207,142,0.22)'],
  ['stripe', 'Stripe Indigo', 'Signature', '#070812', '#101326', '#635bff', 'rgba(99,91,255,0.25)'],
  ['cursor_mid', 'Cursor Midnight', 'Signature', '#060709', '#101217', '#38bdf8', 'rgba(56,189,248,0.22)'],
  ['zed_carbon', 'Zed Carbon', 'Signature', '#08090a', '#121417', '#60a5fa', 'rgba(96,165,250,0.22)'],
  ['tokyo_night', 'Tokyo Night', 'Classic IDE', '#0b0d17', '#131629', '#a78bfa', 'rgba(167,139,250,0.24)'],
  ['tokyo_storm', 'Tokyo Night Storm', 'Classic IDE', '#111422', '#1a1e33', '#7aa2f7', 'rgba(122,162,247,0.24)'],
  ['catppuccin_mocha', 'Catppuccin Mocha', 'Classic IDE', '#11111b', '#181825', '#f5c2e7', 'rgba(245,194,231,0.22)'],
  ['catppuccin_mac', 'Catppuccin Macchiato', 'Classic IDE', '#141622', '#1e2030', '#c6a0f6', 'rgba(198,160,246,0.22)'],
  ['catppuccin_frappe', 'Catppuccin Frappe', 'Classic IDE', '#191b28', '#232634', '#8caaee', 'rgba(140,170,238,0.22)'],
  ['dracula', 'Dracula Pro', 'Classic IDE', '#0d0a14', '#191426', '#ff79c6', 'rgba(255,121,198,0.24)'],
  ['gruvbox_dark', 'Gruvbox Dark', 'Classic IDE', '#11100e', '#1d1b18', '#fe8019', 'rgba(254,128,25,0.22)'],
  ['gruvbox_mat', 'Gruvbox Material', 'Classic IDE', '#121110', '#1e1c1a', '#a9b665', 'rgba(169,182,101,0.22)'],
  ['nord', 'Nord Polar', 'Classic IDE', '#0e1116', '#191f28', '#88c0d0', 'rgba(136,192,208,0.22)'],
  ['one_dark', 'One Dark Pro', 'Classic IDE', '#0c0e12', '#161920', '#61afef', 'rgba(97,175,239,0.22)'],
  ['monokai', 'Monokai Pro', 'Classic IDE', '#100f10', '#1c1a1c', '#ffd866', 'rgba(255,216,102,0.22)'],
  ['rose_pine', 'Rosé Pine', 'Classic IDE', '#0f0d16', '#191724', '#ebbcba', 'rgba(235,188,186,0.22)'],
  ['rose_moon', 'Rosé Pine Moon', 'Classic IDE', '#141220', '#232136', '#ea9a97', 'rgba(234,154,151,0.22)'],
  ['kanagawa_wave', 'Kanagawa Wave', 'Classic IDE', '#0d0f17', '#16161d', '#7e9cd8', 'rgba(126,156,216,0.22)'],
  ['kanagawa_dragon', 'Kanagawa Dragon', 'Classic IDE', '#0c0c0a', '#181616', '#c4746e', 'rgba(196,116,110,0.22)'],
  ['everforest', 'Everforest Dark', 'Classic IDE', '#0f1411', '#1a211e', '#a7c080', 'rgba(167,192,128,0.22)'],
  ['night_owl', 'Night Owl', 'Classic IDE', '#010b14', '#051626', '#82aaff', 'rgba(130,170,255,0.24)'],
  ['ayu_mirage', 'Ayu Mirage', 'Classic IDE', '#0d1017', '#171c28', '#ffcc66', 'rgba(255,204,102,0.22)'],
  ['ayu_dark', 'Ayu Dark', 'Classic IDE', '#05070a', '#0b0e14', '#ff8f40', 'rgba(255,143,64,0.22)'],
  ['cobalt2', 'Cobalt2', 'Classic IDE', '#07111e', '#122338', '#ffc600', 'rgba(255,198,0,0.24)'],
  ['palenight', 'Material Palenight', 'Classic IDE', '#10121e', '#1b1e2b', '#c792ea', 'rgba(199,146,234,0.22)'],
  ['shades_purple', 'Shades of Purple', 'Classic IDE', '#100e23', '#1e1c3f', '#fad000', 'rgba(250,208,0,0.24)'],
  ['horizon', 'Horizon Dark', 'Classic IDE', '#0e0f14', '#1c1e26', '#e95678', 'rgba(233,86,120,0.24)'],
  ['andromeda', 'Andromeda', 'Classic IDE', '#0d1016', '#181c24', '#00e8c6', 'rgba(0,232,198,0.24)'],
  ['poimandres', 'Poimandres', 'Modern Terminal', '#0b0e14', '#141923', '#5de4c7', 'rgba(93,228,199,0.24)'],
  ['vesper', 'Vesper Peppermint', 'Modern Terminal', '#080808', '#101010', '#ffc799', 'rgba(255,199,153,0.22)'],
  ['oxocarbon', 'IBM Oxocarbon', 'Modern Terminal', '#090909', '#161616', '#ff7eb6', 'rgba(255,126,182,0.24)'],
  ['github_dim', 'GitHub Dark Dimmed', 'Modern Terminal', '#0d1117', '#161b22', '#58a6ff', 'rgba(88,166,255,0.22)'],
  ['solarized_osaka', 'Solarized Osaka', 'Modern Terminal', '#001117', '#001e26', '#2aa198', 'rgba(42,161,152,0.24)'],
  ['warp_term', 'Warp Magenta', 'Modern Terminal', '#09070e', '#14101f', '#e879f9', 'rgba(232,121,249,0.24)'],
  ['ghostty_slate', 'Ghostty Slate', 'Modern Terminal', '#090a0f', '#12151f', '#818cf8', 'rgba(129,140,248,0.22)'],
  ['alacritty_ash', 'Alacritty Ash', 'Modern Terminal', '#0a0a0a', '#141414', '#facc15', 'rgba(250,204,21,0.22)'],
  ['helix_void', 'Helix Void', 'Modern Terminal', '#0d0814', '#1a1128', '#c084fc', 'rgba(192,132,252,0.24)'],
  ['neovim_lua', 'Neovim Moonfly', 'Modern Terminal', '#06080a', '#11151c', '#36c692', 'rgba(54,198,146,0.22)'],
  ['doom_one', 'Doom Emacs One', 'Modern Terminal', '#0d0f14', '#181c24', '#51afef', 'rgba(81,175,239,0.22)'],
  ['cyberpunk', 'Cyberpunk 2077', 'Cyber & Neon', '#090414', '#14092b', '#00f0ff', 'rgba(0,240,255,0.28)'],
  ['synthwave', "Synthwave '84", 'Cyber & Neon', '#0f081d', '#1d1135', '#ff7edb', 'rgba(255,126,219,0.28)'],
  ['outrun', 'Outrun Electric', 'Cyber & Neon', '#070412', '#130929', '#ff2a85', 'rgba(255,42,133,0.28)'],
  ['matrix', 'Matrix Phosphor', 'Cyber & Neon', '#020804', '#06150a', '#00ff66', 'rgba(0,255,102,0.28)'],
  ['amber_crt', 'Fallout Amber CRT', 'Minimal & Retro', '#0a0702', '#171005', '#ffb000', 'rgba(255,176,0,0.26)'],
  ['monolith', 'Monolith Pure White', 'Minimal & Retro', '#050505', '#0f0f0f', '#ffffff', 'rgba(255,255,255,0.2)'],
  ['zenburn', 'Zenburn Low-Contrast', 'Minimal & Retro', '#141412', '#1f1f1c', '#f0dfaf', 'rgba(240,223,175,0.2)'],
  ['iceberg', 'Iceberg Glacier', 'Minimal & Retro', '#0b0d14', '#161821', '#84a0c6', 'rgba(132,160,198,0.22)'],
  ['gotham', 'Gotham City', 'Minimal & Retro', '#05080b', '#0a0f14', '#26a98b', 'rgba(38,169,139,0.22)'],
  ['panda', 'Panda Syntax', 'Cyber & Neon', '#0d0e11', '#191a20', '#19f9d8', 'rgba(25,249,216,0.24)'],
  ['blood_moon', 'Blood Moon Eclipse', 'Cyber & Neon', '#0b0304', '#170709', '#ef4444', 'rgba(239,68,68,0.26)'],
  ['arctic', 'Arctic Aurora', 'Cyber & Neon', '#040b11', '#0a1926', '#22d3ee', 'rgba(34,211,238,0.26)'],
];

export const STUDIO_THEMES: StudioTheme[] = RAW_THEMES.map(
  ([id, name, group, bg, surface, accent, glow]) => ({
    id,
    name,
    group,
    bg,
    surface,
    accent,
    glow,
  })
);