export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-[10px] font-bold text-white">
            AI
          </span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            AI Interview
          </span>
        </div>
        <p>用 AI 練習面試，讓你上場前更有把握。</p>
      </div>
    </footer>
  );
}
