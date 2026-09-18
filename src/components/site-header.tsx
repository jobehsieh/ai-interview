import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/80 dark:bg-black/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/30">
            AI
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            AI Interview
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400 sm:flex">
          <a
            href="#features"
            className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            功能特色
          </a>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            使用流程
          </a>
        </nav>
        <Link
          href="/interview"
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
        >
          開始模擬面試
        </Link>
      </div>
    </header>
  );
}
