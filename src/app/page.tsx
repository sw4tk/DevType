export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import TypingTest from '@/components/typing/TypingTest';

export default function Home() {
  return (
    <main className="h-dvh w-screen overflow-hidden bg-[#050507]">
      <TypingTest />
    </main>
  );
}