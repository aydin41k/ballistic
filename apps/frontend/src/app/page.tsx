import Image from "next/image";
import Link from "next/link";

const optionalFeatures = [
  {
    title: "AI that can actually act",
    description:
      "Connect an MCP-compatible assistant to create, find, update, complete and delegate work through conversation.",
    icon: "spark",
    accent: "bg-violet-100 text-violet-700",
  },
  {
    title: "Dates when time matters",
    description:
      "Add schedules, due dates and recurring tasks when a plain ordered list is no longer enough.",
    icon: "calendar",
    accent: "bg-blue-100 text-blue-700",
  },
  {
    title: "Projects without the ceremony",
    description:
      "Group and filter tasks without turning your personal list into a project-management department.",
    icon: "folder",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    title: "Delegate without losing the thread",
    description:
      "Assign tasks, add context and get notified when work moves—only if collaboration belongs in your day.",
    icon: "people",
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Notes, tags and history",
    description:
      "Keep the context you need nearby, then leave it out of sight when all you need is the next task.",
    icon: "note",
    accent: "bg-rose-100 text-rose-700",
  },
  {
    title: "Fast everywhere",
    description:
      "Optimistic updates, drag ordering and a focused mobile view keep the list feeling immediate.",
    icon: "bolt",
    accent: "bg-cyan-100 text-cyan-700",
  },
] as const;

const principles = [
  {
    number: "01",
    title: "Capture it",
    description:
      "A title is enough. Add the task before your brain opens another tab.",
  },
  {
    number: "02",
    title: "Put it in order",
    description:
      "Move what matters up. Let the rest wait without turning it into a planning workshop.",
  },
  {
    number: "03",
    title: "Move it forward",
    description:
      "Todo, doing, done or not worth doing. Four states. No interpretive dance.",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="relative left-1/2 -my-4 min-h-dvh w-screen -translate-x-1/2 overflow-hidden bg-[#f8f9ff] text-[#111b3f] lg:static lg:my-0 lg:w-auto lg:translate-x-0">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#dfe7ff] blur-3xl" />
        <div className="absolute right-[-8rem] top-[-4rem] h-[30rem] w-[30rem] rounded-full bg-[#eadfff] opacity-80 blur-3xl" />
        <div className="absolute left-[46%] top-36 h-48 w-48 rounded-full bg-[#d9ff9f] opacity-60 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/60 bg-[#f8f9ff]/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 text-[#111b3f]"
            aria-label="Ballistic home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={38}
              height={38}
              className="h-9 w-9 rounded-xl shadow-sm"
              priority
            />
            <span className="text-lg font-black tracking-tight">Ballistic</span>
          </Link>

          <nav
            className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex"
            aria-label="Main navigation"
          >
            <a href="#simple" className="hover:text-[#111b3f]">
              Why simple
            </a>
            <a href="#features" className="hover:text-[#111b3f]">
              Optional power
            </a>
            <a href="#ai" className="hover:text-[#111b3f]">
              AI-first
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-bold text-[#111b3f] hover:bg-white min-[360px]:inline-flex sm:px-4"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#2547e8] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-[#1838ce] sm:px-5"
            >
              Get started
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:px-10 lg:pb-32 lg:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 xl:gap-24">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#cbd6ff] bg-white/80 px-3.5 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2547e8] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#8bcf2f] shadow-[0_0_0_4px_rgba(139,207,47,0.15)]" />
              To-dos without the productivity theatre
            </div>

            <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#101a3b] sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
              The simplest to-do list.
              <span className="mt-2 block bg-gradient-to-r from-[#2547e8] via-[#6d3be8] to-[#ab38c9] bg-clip-text text-transparent">
                AI-first when you want more.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Capture a task, put it in order, get on with your day. Turn on AI,
              dates, projects, recurring work, delegation and notifications only
              when they earn their place.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full bg-[#2547e8] px-7 py-3.5 text-base font-extrabold text-white shadow-xl shadow-blue-900/20 hover:-translate-y-1 hover:bg-[#1838ce]"
              >
                Start with one task
                <ArrowIcon />
              </Link>
              <Link
                href="/app"
                className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-slate-300 bg-white/70 px-7 py-3.5 text-base font-extrabold text-[#111b3f] hover:border-slate-400 hover:bg-white"
              >
                Open the app
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CheckIcon /> No setup ritual
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckIcon /> No feature avalanche
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckIcon /> Complexity stays optional
              </span>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section
        id="simple"
        className="relative border-y border-slate-200/80 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2547e8]">
                Simple on purpose
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] text-[#111b3f] sm:text-5xl">
                Not another productivity operating system.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
                Ballistic starts as the thing most apps eventually bury: a clear
                list of what you need to do next.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {principles.map((principle) => (
                <article
                  key={principle.number}
                  className="group rounded-[1.75rem] border border-slate-200 bg-[#f8f9ff] p-6 transition hover:-translate-y-1 hover:border-[#b9c7ff] hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <span className="text-xs font-black tracking-[0.16em] text-[#2547e8]">
                    {principle.number}
                  </span>
                  <h3 className="mt-10 text-xl font-black tracking-tight text-[#111b3f]">
                    {principle.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative overflow-hidden bg-[#f8f9ff]">
        <div
          className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-80 max-w-5xl rounded-full bg-gradient-to-r from-blue-100 via-violet-100 to-lime-100 opacity-70 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2547e8]">
              Power on demand
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#111b3f] sm:text-5xl">
              Start tiny. Switch on the clever stuff later.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Every extra exists to remove work—not create a new system for you
              to maintain.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {optionalFeatures.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[1.75rem] border border-white bg-white/85 p-6 shadow-lg shadow-slate-900/[0.04] backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/[0.08]"
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl ${feature.accent}`}
                >
                  <FeatureIcon name={feature.icon} />
                </span>
                <h3 className="mt-6 text-xl font-black tracking-tight text-[#111b3f]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ai" className="bg-[#0d1738] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#caddff]">
              <SparkIcon /> AI-first, never AI-forced
            </div>
            <h2 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
              Let your AI handle the list admin.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Connect your preferred MCP-compatible assistant. Ask it to capture
              ideas, find overdue work, update priorities, complete tasks or
              delegate the follow-up—while Ballistic stays the clear source of
              truth.
            </p>
            <p className="mt-5 text-sm font-bold text-[#b8c8ff]">
              Don&apos;t want AI? Leave it off. The list remains brilliantly
              boring.
            </p>
          </div>

          <div className="relative rounded-[2rem] border border-white/10 bg-[#141f46] p-4 shadow-2xl shadow-black/25 sm:p-6">
            <div
              className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#8f5cff] opacity-30 blur-3xl"
              aria-hidden="true"
            />
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#7d5cff] to-[#2c58ff]">
                  <SparkIcon />
                </span>
                <div>
                  <p className="text-sm font-extrabold">
                    Ballistic AI connection
                  </p>
                  <p className="text-xs text-slate-400">MCP tools ready</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black text-emerald-300">
                Optional · On
              </span>
            </div>

            <div className="space-y-4 py-5">
              <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#3156df] px-4 py-3 text-sm leading-6">
                What should I focus on today? Move anything overdue to the top.
              </div>
              <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-4 text-sm leading-6 text-slate-200">
                <p>
                  I found three active tasks and moved the overdue one to the
                  top.
                </p>
                <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#aebfff]">
                    Now first
                  </p>
                  <p className="mt-1 font-bold text-white">
                    Send revised proposal
                  </p>
                  <p className="mt-1 text-xs text-rose-300">
                    Overdue · Client work
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "Capture these notes",
                  "What is overdue?",
                  "Delegate the follow-up",
                ].map((prompt) => (
                  <span
                    key={prompt}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300"
                  >
                    {prompt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#caff62]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#34520a]">
              Less organising. More doing.
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.045em] text-[#101a3b] sm:text-5xl">
              Your next task does not need a strategy deck.
            </h2>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#111b3f] px-7 py-4 text-base font-extrabold text-white shadow-xl shadow-lime-950/15 hover:-translate-y-1 hover:bg-[#2547e8]"
          >
            Create your list
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-9 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={30}
              height={30}
              className="h-7 w-7 rounded-lg"
            />
            <span className="font-black text-[#111b3f]">Ballistic</span>
            <span>© {new Date().getFullYear()} Psycode Pty. Ltd.</span>
          </div>
          <div className="flex items-center gap-5 font-semibold">
            <Link href="/login" className="text-slate-500 hover:text-[#111b3f]">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-slate-500 hover:text-[#111b3f]"
            >
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductPreview() {
  const tasks = [
    {
      title: "Send revised proposal",
      meta: "Client work",
      colour: "bg-blue-500",
      status: "doing",
    },
    {
      title: "Book dentist",
      meta: "Personal",
      colour: "bg-amber-400",
      status: "todo",
    },
    {
      title: "Write launch notes",
      meta: "Ballistic",
      colour: "bg-violet-500",
      status: "todo",
    },
  ] as const;

  return (
    <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
      <div
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#cbd8ff] via-[#e8dcff] to-[#ddffab] opacity-75 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-[0_30px_80px_rgba(25,42,110,0.18)] backdrop-blur sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#111b3f] text-sm font-black text-white">
              B
            </span>
            <div>
              <p className="text-sm font-black text-[#111b3f]">Today</p>
              <p className="text-xs text-slate-400">
                Three things. Nice and clear.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#eef1ff] px-3 py-1.5 text-xs font-black text-[#2547e8]">
            + Add task
          </span>
        </div>

        <div className="space-y-3 py-5">
          {tasks.map((task, index) => (
            <div
              key={task.title}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4"
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${task.status === "doing" ? "border-[#2547e8] bg-[#eef1ff]" : "border-slate-300"}`}
              >
                {task.status === "doing" && (
                  <span className="h-2 w-2 rounded-full bg-[#2547e8]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-[#111b3f]">
                  {task.title}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <span className={`h-2 w-2 rounded-full ${task.colour}`} />
                  {task.meta}
                </p>
              </div>
              <span className="hidden rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400 sm:block">
                {index === 0 ? "Doing" : "Todo"}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border-t border-slate-200/80 pt-4 sm:grid-cols-3">
          {[
            ["AI assistant", "On"],
            ["Dates", "Off"],
            ["Delegation", "Off"],
          ].map(([label, state]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl bg-[#f7f8fc] px-3 py-2.5"
            >
              <span className="text-xs font-bold text-slate-600">{label}</span>
              <span
                className={`relative h-5 w-9 rounded-full ${state === "On" ? "bg-violet-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm ${state === "On" ? "right-0.5" : "left-0.5"}`}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative -mt-2 ml-auto w-[88%] rounded-2xl border border-violet-200 bg-[#171e42] p-4 text-white shadow-2xl sm:absolute sm:-bottom-20 sm:-right-5 sm:mt-0 sm:w-[72%]">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">
          <SparkIcon /> Your AI, connected
        </div>
        <p className="mt-3 text-sm font-semibold leading-6">
          “Add ‘renew passport’ for next month and keep it below the dentist.”
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-200">
          <CheckIcon light /> Task added in the right place
        </div>
      </div>
    </div>
  );
}

function FeatureIcon({
  name,
}: {
  name: (typeof optionalFeatures)[number]["icon"];
}) {
  const paths = {
    spark: (
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Zm6 11 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </>
    ),
    folder: (
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    ),
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    note: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function CheckIcon({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${light ? "bg-emerald-400/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 16 16"
        width="11"
        height="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 8 2.5 2.5L12 5" />
      </svg>
    </span>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m10 2 1.3 4.2L15.5 7.5l-4.2 1.3L10 13l-1.3-4.2-4.2-1.3 4.2-1.3L10 2ZM16 12l.7 2.3L19 15l-2.3.7L16 18l-.7-2.3L13 15l2.3-.7L16 12Z" />
    </svg>
  );
}
