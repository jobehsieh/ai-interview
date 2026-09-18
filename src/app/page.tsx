import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_TOTAL_QUESTIONS } from "@/lib/interview-types";

const features = [
  {
    title: "貼合職缺的客製化提問",
    description:
      "貼上任何職缺描述，AI 面試官會根據內容出題，而不是套用罐頭題庫。",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    title: "追問式對話，越答越深入",
    description:
      "AI 會針對你的回答繼續追問細節，模擬真實面試官抽絲剝繭的節奏。",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 10.5h7.5m-7.5 3h4.5m4.5-9H4.5a1.5 1.5 0 0 0-1.5 1.5v10.5l3.75-3h11.25a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5Z"
      />
    ),
  },
  {
    title: "每題即時給出更好的回答方式",
    description:
      "答完每一題後，立刻獲得具體建議，知道怎麼補充重點、讓回答更有結構。",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 18h6m-5.5 3h5M12 3a6 6 0 0 0-3.5 10.9c.5.36.75.95.75 1.55V16h5.5v-.55c0-.6.25-1.19.75-1.55A6 6 0 0 0 12 3Z"
      />
    ),
  },
  {
    title: "完整評分報告與改進建議",
    description:
      "回答完畢後，AI 會給出總體評分、各項能力分析、優點與具體待加強之處。",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v18h18M8 17V10m5 7V6m5 11v-4"
      />
    ),
  },
];

const steps = [
  {
    title: "貼上職缺描述，設定題數",
    description: "輸入你要準備的職缺內容，並選擇想練習的題目數量。",
  },
  {
    title: "逐題作答，AI 即時追問與建議",
    description: "AI 面試官會依你的回答追問細節，並給出更好的回答方式建議。",
  },
  {
    title: "取得總評分與改進方向",
    description: "答完所有題目後，獲得完整的評分報告與具體的改進建議。",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.indigo.100),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.indigo.950),transparent)]" />
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 pt-20 pb-16 text-center sm:pt-28">
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
              AI 面試模擬器
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
              上場前，先讓{" "}
              <span className="bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                AI 面試官
              </span>{" "}
              電你一次
            </h1>
            <p className="max-w-xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
              貼上職缺描述，AI 會依內容出題、追問細節，每一題結束後給你更好的回答方式，最後產出完整評分報告。
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/interview"
                className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
              >
                開始模擬面試
              </Link>
              <a
                href="#features"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                看看怎麼運作
              </a>
            </div>

            {/* Preview mock */}
            <div className="mt-6 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-4 text-left shadow-xl shadow-zinc-900/5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span>
                  第 2 / {DEFAULT_TOTAL_QUESTIONS} 題
                </span>
                <span>67%</span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-[11px] font-bold text-white">
                    AI
                  </span>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                    能說說你如何避免資料庫超賣問題嗎？
                  </div>
                </div>
                <div className="flex flex-row-reverse items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    你
                  </span>
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
                    我會用樂觀鎖，搭配 version 欄位檢查...
                  </div>
                </div>
                <div className="ml-9 max-w-[85%] self-end rounded-2xl rounded-tr-sm border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    更好的回答方式
                  </div>
                  可以再補充重試策略與交易隔離層級的取捨...
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              不只是題庫，更像一場真的面試
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              每一次練習都根據你貼的職缺量身打造，並在過程中給你可以馬上用上的建議。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50"
        >
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                三個步驟，練到有感
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex flex-col gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            準備好了嗎？
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
            現在就貼上職缺描述，開始你的第一場 AI 模擬面試。
          </p>
          <Link
            href="/interview"
            className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
          >
            開始模擬面試
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
