<div align="center">
  <img src="https://api.iconify.design/lucide/terminal.svg?color=%2310b981&width=64&height=64" alt="DevType Logo" />
  <h1>DevType — Developer Typing Studio</h1>
  <p><strong>A production-grade, highly polished developer typing studio built with Next.js, TypeScript, Tailwind CSS, and Supabase.</strong></p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-database-setup">Database Setup</a> •
    <a href="#-license">License</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_16-App_Router-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-Design-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-Cloud_Telemetry-3ecf8e?style=flat-square&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
  </p>
</div>

---

## ✨ Features

- **AST Code Synthesis & Infinite Corpus:** Generates and scrapes non-repeating, domain-driven code snippets across TypeScript, Rust, Python, and Go with strict length bounds (`Short`, `Medium`, `Long`).
- **12 Studio Surface Architectures:** Dynamically switch between *Specular Glassmorphism*, *3D Claymorphism*, *Soft Neumorphism*, *Neo-Brutalism*, *Apple Vision Crystal*, *Cyberpunk Mecha HUD*, *Phosphor CRT*, and more.
- **Sub-Pixel Caret Glide Engine:** Custom 120Hz physics loop supporting spring physics, butter-smooth interpolation, velocity stretch, and neon caret bloom.
- **Advanced Practice Modes:** Sprint, 15s/30s/60s time trials, Sudden Death (1HP), Zen Mode with Confidence Fading Text, Vim Dojo Arena, and Smart Weakness Coach.
- **Cloud Telemetry & Career Dossier:** Real-time session syncing to Supabase with detailed accuracy breakdowns, missed-key analytics, and shareable OG PNG export cards and Ghost P2P challenge links.
- **Configurable Workspace:** On-screen 65% mechanical keyboard toggle (with automatic IDE expansion down to the viewport), custom font-size scaling, and mechanical audio switch profiles (*Thock*, *Clack*, *Click*).

---

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Custom CSS 3D Glass/Clay Rules
- **Backend & Database:** [Supabase](https://supabase.com/) (REST API with `typing_sessions` & `code_corpus` tables)
- **Charts & Visualizations:** Recharts
- **Icons & Typography:** Lucide React & Google Fonts (*Poppins*)

---

## 🚀 Getting Started

Follow these instructions to set up the repository locally on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/devtype.git](https://github.com/your-username/devtype.git)
cd devtype

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Configure Environment Variables

Create a `.env.local` file in your root folder:

```bash
cp .env.example .env.local

```

Open `.env.local` and paste your live Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

```

### 4. Run the Development Server

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the typing studio.

---

## 🗄️ Database Setup (Supabase)

To enable cloud telemetry and corpus synchronization, execute this complete SQL block in your [Supabase SQL Editor](https://supabase.com/dashboard):

```sql
-- 1. Create typing_sessions table
create table if not exists public.typing_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id text default 'guest_engineer',
  username text default 'guest_dev',
  avatar_url text,
  lang_id text not null,
  game_mode text default 'standard',
  wpm integer not null,
  raw_wpm integer not null,
  accuracy numeric not null,
  consistency integer,
  chars integer,
  duration_sec integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create code_corpus table with unique hash constraint
create table if not exists public.code_corpus (
  id uuid default gen_random_uuid() primary key,
  lang_id text not null,
  repo_source text,
  filename text,
  code text not null,
  line_count integer,
  hash text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Disable RLS and grant public permissions for guest telemetry & seeding
alter table public.typing_sessions disable row level security;
alter table public.code_corpus disable row level security;

grant usage on schema public to anon, authenticated;
grant all on table public.typing_sessions to anon, authenticated;
grant all on table public.code_corpus to anon, authenticated;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

```

---

## 📦 Production Build

To build the application for optimized production deployment (Vercel, Netlify, etc.):

```bash
npm run build
npm run start

```

---

## 🛡️ .gitignore Configuration

Ensure your `.gitignore` file includes `.env.local` to prevent exposing your production keys on GitHub:

```text
.env.local
.next/
node_modules/

```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

```

```
