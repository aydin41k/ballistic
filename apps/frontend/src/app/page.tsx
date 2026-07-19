import Image from "next/image";
import Link from "next/link";
import { LandingSignalField } from "@/components/LandingSignalField";

const steps = [
  {
    number: "01",
    title: "Capture",
    description: "Type the thing before your brain opens another tab.",
  },
  {
    number: "02",
    title: "Order",
    description: "Move what matters up. Let the rest wait its turn.",
  },
  {
    number: "03",
    title: "Move",
    description: "Todo, doing, done or not worth doing. That is the system.",
  },
] as const;

const optionalTools = [
  ["AI assistant", "Create, find and update tasks through conversation"],
  ["Dates + repeats", "Bring in time only when time matters"],
  ["Projects", "Add structure without building a second job"],
  ["Delegation", "Hand work over without losing the thread"],
  ["Notifications", "Hear about movement, not meaningless noise"],
] as const;

export default function LandingPage() {
  return (
    <main className="relative left-1/2 -my-4 min-h-dvh w-screen -translate-x-1/2 overflow-hidden bg-[var(--page-bg)] text-[var(--text)] selection:bg-[var(--blue-600)] selection:text-white lg:static lg:my-0 lg:w-auto lg:translate-x-0">
      <FloatingHeader />

      <section className="relative min-h-[54rem] overflow-hidden border-b border-slate-200 sm:min-h-[58rem] lg:min-h-[calc(100svh-1rem)]">
        <LandingSignalField />

        <div className="relative z-10 mx-auto grid min-h-[54rem] max-w-7xl items-end gap-12 px-5 pb-16 pt-32 sm:min-h-[58rem] sm:px-8 sm:pb-20 lg:min-h-[calc(100svh-1rem)] lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:pb-16 lg:pt-28">
          <div className="max-w-2xl lg:pb-12">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-500">
              Mobile-first · AI when invited
            </p>
            <h1 className="mt-5 text-balance text-5xl font-black leading-[0.93] tracking-[-0.065em] sm:text-6xl lg:text-[5.25rem]">
              Your tasks.
              <span className="block">Nothing else</span>
              <span className="block">in the way.</span>
            </h1>

            <div className="mt-8 max-w-xl border-l border-[var(--navy)] pl-5 sm:pl-6">
              <p className="text-lg leading-7 text-slate-600 sm:text-xl sm:leading-8">
                Ballistic is the simplest to-do list on your phone. Add AI,
                dates, projects and delegation only when they make life easier.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <PrimaryLink>Start my list</PrimaryLink>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center rounded-full bg-white/90 px-5 text-sm font-semibold text-[var(--navy)] ring-1 ring-slate-200 backdrop-blur hover:bg-white"
                >
                  I already have one
                </Link>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end lg:pb-3 lg:pr-12">
            <PhonePreview />
          </div>
        </div>

        <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200 backdrop-blur sm:flex lg:right-8">
          <span className="h-2 w-2 rounded-full bg-[var(--blue-600)]" />
          The phone is the product. Web is the companion.
        </div>
      </section>

      <section id="simple" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
          <div className="grid gap-16 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
            <div className="max-w-xl">
              <SectionLabel>Designed to disappear</SectionLabel>
              <h2 className="mt-6 text-balance text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                A list should reduce the noise.
                <span className="text-slate-300"> Not become more of it.</span>
              </h2>
            </div>

            <div className="self-end border-t border-[var(--navy)]">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-3 border-b border-slate-200 py-7 sm:grid-cols-[3rem_9rem_1fr] sm:items-baseline sm:gap-5"
                >
                  <span className="text-[0.68rem] font-bold tracking-[0.16em] text-slate-400">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold tracking-[-0.025em]">
                    {step.title}
                  </h3>
                  <p className="leading-7 text-slate-500">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="optional"
        className="relative overflow-hidden border-y border-blue-100 bg-blue-50"
      >
        <div
          className="pointer-events-none absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full border border-blue-200"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-28 lg:px-10 lg:py-36">
          <div>
            <SectionLabel>Power, on request</SectionLabel>
            <h2 className="mt-6 max-w-xl text-balance text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl">
              Start with a list.
              <span className="block text-slate-300">
                Turn on the rest later.
              </span>
            </h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-slate-600">
              Every extra is optional. Ballistic stays calm until a feature can
              genuinely remove work from your day.
            </p>
            <div className="mt-9">
              <PrimaryLink>Make my list now</PrimaryLink>
            </div>
          </div>

          <div className="border-t border-[var(--navy)]">
            {optionalTools.map(([title, description], index) => (
              <article
                key={title}
                className="group grid gap-3 border-b border-blue-200 py-6 sm:grid-cols-[2.4rem_10rem_1fr_auto] sm:items-center sm:gap-5"
              >
                <span className="text-[0.65rem] font-bold tracking-[0.14em] text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-bold tracking-[-0.02em]">{title}</h3>
                <p className="text-sm leading-6 text-slate-500">
                  {description}
                </p>
                <span className="flex h-7 w-12 items-center rounded-full border border-blue-200 bg-white/80 p-1">
                  <span className="h-5 w-5 rounded-full bg-slate-300 transition-transform group-hover:translate-x-5 group-hover:bg-[var(--blue-600)]" />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="companion" className="bg-[var(--navy)] text-white">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
          <div className="grid gap-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-24">
            <div>
              <SectionLabel light>One list. Three ways in.</SectionLabel>
              <h2 className="mt-6 max-w-xl text-balance text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                Mobile at the centre.
                <span className="block text-white/35">
                  AI and web around it.
                </span>
              </h2>
              <p className="mt-7 max-w-lg text-lg leading-8 text-white/60">
                Reach for the app when life happens. Use your AI assistant when
                talking is faster. Open the web companion when a keyboard and a
                bigger screen help.
              </p>
            </div>

            <CompanionMap />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute -bottom-40 right-[8%] h-80 w-80 rounded-full bg-blue-200 blur-[90px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            You already know the first task
          </p>
          <div className="mt-6 flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <h2 className="max-w-4xl text-balance text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]">
              Stop organising.
              <span className="block">Put it down.</span>
            </h2>
            <Link
              href="/register"
              className="group inline-flex min-h-16 shrink-0 items-center gap-5 rounded-full bg-[var(--blue)] px-7 text-base font-bold text-white ring-1 ring-blue-900/10 shadow-[0_18px_50px_rgba(30,64,175,0.24)] hover:-translate-y-1 hover:bg-[var(--blue-600)]"
            >
              Start my list
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition-transform group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 text-xs text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={26}
              height={26}
              className="h-6 w-6 rounded-lg"
            />
            <span className="font-bold text-[var(--navy)]">Ballistic</span>
            <span>© {new Date().getFullYear()} Psycode Pty. Ltd.</span>
          </div>
          <div className="flex items-center gap-5 font-medium">
            <span>Mobile first · AI optional · Web included</span>
            <Link
              href="/login"
              className="text-slate-500 hover:text-[var(--navy)]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FloatingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 rounded-full bg-white/95 px-3.5 text-[var(--navy)] shadow-sm ring-1 ring-slate-200 backdrop-blur-xl"
          aria-label="Ballistic home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg"
            priority
          />
          <span className="text-sm font-bold tracking-[-0.025em]">
            Ballistic
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full bg-white/95 p-1 shadow-sm ring-1 ring-slate-200 backdrop-blur-xl md:flex"
          aria-label="Main navigation"
        >
          <a
            href="#simple"
            className="rounded-full px-4 py-2 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-[var(--navy)]"
          >
            Simple
          </a>
          <a
            href="#optional"
            className="rounded-full px-4 py-2 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-[var(--navy)]"
          >
            Optional power
          </a>
          <a
            href="#companion"
            className="rounded-full px-4 py-2 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-[var(--navy)]"
          >
            AI + web
          </a>
        </nav>

        <div className="flex items-center gap-2 rounded-full bg-white/95 p-1 shadow-sm ring-1 ring-slate-200 backdrop-blur-xl">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-xs font-medium text-slate-500 hover:text-[var(--navy)] min-[390px]:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[var(--blue)] px-4 text-xs font-bold text-white ring-1 ring-blue-900/10 hover:bg-[var(--blue-600)]"
          >
            Start my list
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}

function PhonePreview() {
  const tasks = [
    ["Send revised proposal", "doing"],
    ["Book dentist", "todo"],
    ["Call Mum", "todo"],
  ] as const;

  return (
    <div className="relative w-[18.5rem] sm:w-[20.5rem]">
      <div className="absolute -inset-8 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="relative rounded-[3rem] border-[0.45rem] border-[var(--navy)] bg-[var(--navy)] p-1 shadow-[0_35px_90px_rgba(10,37,64,0.24)]">
        <div className="overflow-hidden rounded-[2.35rem] bg-white">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-[var(--navy)]" />
          <div className="px-5 pb-5 pt-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.65rem] font-medium text-slate-400">
                  Good morning
                </p>
                <p className="mt-0.5 text-2xl font-black tracking-[-0.045em]">
                  Today
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--navy)] text-xs font-bold text-white">
                B
              </span>
            </div>

            <div className="mt-7 border-t border-[var(--navy)]">
              {tasks.map(([title, status]) => (
                <div
                  key={title}
                  className="flex items-center gap-3 border-b border-slate-200 py-3.5"
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                      status === "doing"
                        ? "border-[var(--blue)] bg-blue-100"
                        : "border-slate-300"
                    }`}
                  >
                    {status === "doing" && (
                      <span className="h-2 w-2 rounded-full bg-[var(--blue)]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {title}
                  </span>
                  <span className="text-xs text-slate-300">••</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[#f0f0ed] p-4">
              <div className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-slate-500">
                <SparkIcon /> AI, if you ask
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-600">
                “Move anything overdue to the top.”
              </p>
            </div>

            <div className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--blue)] text-sm font-bold text-white">
              <PlusIcon /> Add a task
            </div>
          </div>

          <div className="flex items-center justify-around border-t border-slate-200 px-5 py-4 text-[0.58rem] font-semibold text-slate-400">
            <span className="text-[var(--blue)]">Today</span>
            <span>Projects</span>
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="absolute -right-7 top-32 hidden rounded-full bg-white px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--navy)] shadow-lg ring-1 ring-slate-200 sm:block">
        Mobile first
      </div>
    </div>
  );
}

function CompanionMap() {
  return (
    <div className="relative min-h-[29rem] overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.035] p-5 sm:min-h-[31rem] sm:p-8">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M 28 65 C 39 58, 41 28, 59 30 S 72 55, 84 52"
          fill="none"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="0.25"
        />
        <path
          d="M 28 65 C 45 67, 56 79, 75 79"
          fill="none"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="0.25"
        />
      </svg>

      <div className="absolute left-[8%] top-[44%] w-24 rounded-[1.35rem] border-4 border-white bg-white p-2 text-[var(--navy)] shadow-2xl sm:w-28">
        <div className="mx-auto h-1.5 w-8 rounded-full bg-[var(--navy)]" />
        <p className="mt-4 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Today
        </p>
        {["Proposal", "Dentist", "Mum"].map((task, index) => (
          <div
            key={task}
            className="mt-2 flex items-center gap-1.5 border-b border-slate-200 pb-1.5 text-[0.48rem] font-semibold"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full border border-slate-300 ${index === 0 ? "border-[var(--blue)] bg-blue-100" : ""}`}
            />
            {task}
          </div>
        ))}
        <p className="mt-2 text-center text-[0.42rem] font-bold text-slate-400">
          MOBILE
        </p>
      </div>

      <div className="absolute right-[7%] top-[17%] w-[54%] rounded-xl border border-white/20 bg-[#102f4d] p-2 shadow-2xl sm:p-3">
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          <span className="ml-auto text-[0.42rem] font-bold tracking-[0.12em] text-white/35">
            WEB COMPANION
          </span>
        </div>
        <div className="grid grid-cols-[0.34fr_0.66fr] gap-2 pt-2">
          <div className="space-y-1.5 rounded-md bg-white/[0.04] p-2">
            <div className="h-1 w-8 rounded-full bg-white/35" />
            <div className="h-1 w-10 rounded-full bg-white/15" />
            <div className="h-1 w-7 rounded-full bg-white/15" />
          </div>
          <div className="space-y-1.5">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-md border border-white/10 p-2"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full border border-white/30 ${item === 0 ? "bg-blue-400" : ""}`}
                />
                <span className="h-1 flex-1 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-[13%] right-[11%] w-[54%] rounded-2xl bg-[var(--blue-600)] p-4 text-white shadow-2xl sm:p-5">
        <div className="flex items-center gap-2 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white/65">
          <SparkIcon /> Your AI connection
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 sm:text-sm">
          “Add the follow-up and put it after the proposal.”
        </p>
      </div>

      <span className="absolute left-[26%] top-[62%] h-3 w-3 rounded-full bg-blue-400 ring-4 ring-blue-400/20" />
      <span className="absolute right-[39%] top-[29%] h-2 w-2 rounded-full bg-blue-400" />
      <span className="absolute bottom-[20%] right-[24%] h-2 w-2 rounded-full bg-[var(--navy)] ring-2 ring-blue-400" />
    </div>
  );
}

function SectionLabel({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className={`flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${light ? "text-white/45" : "text-slate-500"}`}
    >
      <span className={`h-px w-8 ${light ? "bg-white/40" : "bg-slate-400"}`} />
      {children}
    </p>
  );
}

function PrimaryLink({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/register"
      className="inline-flex min-h-11 items-center gap-3 rounded-full bg-[var(--blue)] px-5 text-sm font-bold text-white ring-1 ring-blue-900/10 shadow-[0_12px_30px_rgba(30,64,175,0.2)] hover:-translate-y-0.5 hover:bg-[var(--blue-600)]"
    >
      {children}
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white">
        <ArrowIcon />
      </span>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m10 2 1.3 4.2L15.5 7.5l-4.2 1.3L10 13l-1.3-4.2-4.2-1.3 4.2-1.3L10 2ZM16 12l.7 2.3L19 15l-2.3.7L16 18l-.7-2.3L13 15l2.3-.7L16 12Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 3v12M3 9h12" />
    </svg>
  );
}
