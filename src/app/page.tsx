import TypingTest from '@/components/typing/TypingTest';
import { Terminal, Keyboard, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <>
      <main className="h-dvh w-screen overflow-hidden bg-[#050507]">
        <TypingTest />
      </main>

      <div className="absolute bottom-2 left-6 z-40 hidden md:block">
        <a
          href="#about-devtype"
          className="text-[11px] text-neutral-500 hover:text-emerald-400 font-mono transition-colors"
        >
          About & Shortcuts ↓
        </a>
      </div>

      <section
        id="about-devtype"
        aria-labelledby="about-devtype-heading"
        className="w-full bg-[#07080c] text-neutral-300 font-mono py-16 px-6 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Terminal className="w-3.5 h-3.5" /> Open-Source Developer Typing Studio
            </div>
            <h2 id="about-devtype-heading" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              What is DevType?
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              DevType is a high-performance typing studio designed specifically for software engineers. Instead of practicing arbitrary pangrams or static prose, DevType enables you to build muscle memory on real-world open-source code corpuses strictly curated for <strong className="text-white">TypeScript</strong>, <strong className="text-white">Python</strong>, and <strong className="text-white">Go</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Real Code Coruses</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Short, medium, and long snippets harvested directly from real production repositories with proper source attribution.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Weak Spots Coach</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Automatically identifies your most-missed keys and multi-character syntax patterns with 14-day time decay.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <Keyboard className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Sub-Pixel Caret Physics</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Spring physics and butter-smooth interpolation built for mechanical keyboard enthusiasts.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-emerald-400" /> Essential Keyboard Shortcuts
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400">
                    <th className="py-2.5 px-3">Shortcut</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2 px-3 font-bold text-white"><kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">Esc</kbd></td>
                    <td className="py-2 px-3 text-neutral-400">Restart current snippet immediately</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-white"><kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">Tab</kbd></td>
                    <td className="py-2 px-3 text-neutral-400">Skip leading indentation spaces</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-white"><kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">Ctrl + K / ⌘K</kbd></td>
                    <td className="py-2 px-3 text-neutral-400">Open Command Palette (Languages, Themes, Daily Challenge)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-white"><kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">Ctrl + ,</kbd></td>
                    <td className="py-2 px-3 text-neutral-400">Open Full-Page Studio Settings</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-white"><kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">Alt + N</kbd></td>
                    <td className="py-2 px-3 text-neutral-400">Roll guaranteed unseen random snippet</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-white"><kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">Ctrl + Enter</kbd></td>
                    <td className="py-2 px-3 text-neutral-400">Finish and submit Zen mode run</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
