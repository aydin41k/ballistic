import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Write it down",
    description: "A title is enough. Capture the task before it captures you.",
  },
  {
    number: "02",
    title: "Put it in order",
    description: "Move the important thing up. Let everything else wait.",
  },
  {
    number: "03",
    title: "Get it done",
    description: "Todo, doing, done or not worth doing. Nothing to configure.",
  },
] as const;

const optionalTools = [
  "AI assistant",
  "Dates and repeats",
  "Projects",
  "Delegation",
  "Notifications",
  "Notes and history",
] as const;

export default function LandingPage() {
  return (
    <main className="relative left-1/2 -my-4 min-h-dvh w-screen -translate-x-1/2 overflow-hidden bg-[#f1ede4] text-[#20251f] lg:static lg:my-0 lg:w-auto lg:translate-x-0">
      <header className="sticky top-0 z-40 border-b border-[#d8d1c4] bg-[#f1ede4]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.5rem] max-w-6xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 text-[#20251f]"
            aria-label="Ballistic home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-[0.7rem]"
              priority
            />
            <span className="text-lg font-extrabold tracking-[-0.025em]">
              Ballistic
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 text-sm font-semibold text-[#65675f] md:flex"
            aria-label="Main navigation"
          >
            <a href="#simple" className="hover:text-[#20251f]">
              Why it works
            </a>
            <a href="#optional" className="hover:text-[#20251f]">
              Optional power
            </a>
            <a href="#companion" className="hover:text-[#20251f]">
              AI + web
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="hidden px-2 py-2 text-sm font-bold text-[#4f544d] min-[360px]:inline-flex"
            >
              Sign in
            </Link>
            <PrimaryLink compact>Start my list</PrimaryLink>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:px-10 lg:pb-32 lg:pt-24">
        <div
          className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full border border-[#c9bfaf] sm:right-0 lg:h-96 lg:w-96"
          aria-hidden="true"
        />
        <div className="grid items-center gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
          <div className="relative z-10 max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#687b63]">
              <span className="h-px w-8 bg-[#687b63]" />A mobile-first to-do app
            </p>

            <h1 className="mt-7 text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-[#20251f] sm:text-6xl lg:text-[4.9rem]">
              The simplest to-do list.
              <span className="mt-2 block text-[#a65336]">
                Made for your pocket.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-[#60635c] sm:text-xl">
              Open it. Add the thing. Get on with your day. Ballistic is built
              for the phone in your hand, with AI and serious features waiting
              quietly until you actually want them.
            </p>

            <div className="mt-9 max-w-sm">
              <PrimaryLink large>Start my list now</PrimaryLink>
              <p className="mt-4 text-sm leading-6 text-[#77786f]">
                Create your account and add your first task. No setup ritual.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#d4ccbe] pt-6 text-sm font-semibold text-[#555a52]">
              <span className="flex items-center gap-2">
                <TickIcon /> Mobile first
              </span>
              <span className="flex items-center gap-2">
                <TickIcon /> AI optional
              </span>
              <span className="flex items-center gap-2">
                <TickIcon /> Web companion included
              </span>
            </div>
          </div>

          <PhonePreview />
        </div>
      </section>

      <section id="simple" className="border-y border-[#ded7ca] bg-[#faf7f0]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="max-w-md">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#687b63]">
                Simple by default
              </p>
              <h2 className="mt-5 text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[#20251f] sm:text-5xl">
                Your list. Not a lifestyle.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#66685f]">
                Productivity apps keep asking you to build a system. Ballistic
                asks what needs doing.
              </p>
            </div>

            <div className="border-t border-[#cfc7b8]">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-3 border-b border-[#cfc7b8] py-7 sm:grid-cols-[3rem_11rem_1fr] sm:items-baseline sm:gap-5"
                >
                  <span className="text-xs font-extrabold tracking-[0.16em] text-[#a65336]">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-extrabold tracking-tight text-[#20251f]">
                    {step.title}
                  </h3>
                  <p className="leading-7 text-[#686a62]">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="optional" className="bg-[#f1ede4]">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-24 lg:px-10 lg:py-28">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#687b63]">
              Nothing forced
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[#20251f] sm:text-5xl">
              Begin with almost nothing.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#62655d]">
              A clean ordered list is the whole app on day one. Add more only
              when it saves you time—not because a dashboard says you should.
            </p>
            <div className="mt-8">
              <PrimaryLink>Make my list</PrimaryLink>
            </div>
          </div>

          <div className="border-t border-[#cfc7b8]">
            {optionalTools.map((tool) => (
              <div
                key={tool}
                className="flex items-center justify-between border-b border-[#cfc7b8] py-5"
              >
                <span className="text-lg font-bold tracking-tight text-[#30352f]">
                  {tool}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8a8b80]">
                  When wanted
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="companion" className="bg-[#293229] text-[#f4efe5]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#b8c6ab]">
              More power. Same calm.
            </p>
            <h2 className="mt-5 text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-5xl">
              The mobile app stays the centre.
            </h2>
          </div>

          <div className="mt-14 grid border-y border-white/20 md:grid-cols-2">
            <article className="py-9 md:border-r md:border-white/20 md:py-12 md:pr-12">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-[#d5b09d]">
                <SparkIcon />
              </span>
              <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-[#b8c6ab]">
                AI when you ask
              </p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">
                Let AI do the list admin.
              </h3>
              <p className="mt-4 max-w-md leading-7 text-[#ccd1c7]">
                Connect an MCP-compatible assistant to capture, find, update,
                complete or delegate tasks. Leave it disconnected and Ballistic
                remains a beautifully ordinary list.
              </p>
            </article>

            <article className="border-t border-white/20 py-9 md:border-l-0 md:border-t-0 md:py-12 md:pl-12">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-[#d5b09d]">
                <ScreenIcon />
              </span>
              <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-[#b8c6ab]">
                Web when it helps
              </p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">
                A companion for the bigger screen.
              </h3>
              <p className="mt-4 max-w-md leading-7 text-[#ccd1c7]">
                Open the same list on desktop when a keyboard or more room is
                useful. The web app supports the mobile experience—it does not
                try to replace it.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#b85f3d] text-[#fffaf1]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-9 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f5d8ca]">
              Enough organising
            </p>
            <h2 className="mt-4 text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              Your first task is waiting.
            </h2>
            <p className="mt-4 text-lg text-[#f8ded2]">
              Make the list now. You can overthink it later.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex min-h-[3.5rem] shrink-0 items-center justify-center gap-3 rounded-full bg-[#fffaf1] px-8 py-4 text-base font-extrabold text-[#71341f] shadow-[0_12px_30px_rgba(84,35,19,0.18)] hover:-translate-y-1 hover:bg-white"
          >
            Start my list now
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <footer className="bg-[#faf7f0]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-9 text-sm text-[#72746c] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg"
            />
            <span className="font-extrabold text-[#20251f]">Ballistic</span>
            <span>© {new Date().getFullYear()} Psycode Pty. Ltd.</span>
          </div>
          <div className="flex items-center gap-5 font-semibold">
            <span>Mobile first. Web when useful.</span>
            <Link href="/login" className="text-[#5f655b] hover:text-[#20251f]">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PrimaryLink({
  children,
  compact = false,
  large = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
  large?: boolean;
}) {
  return (
    <Link
      href="/register"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#b85f3d] font-extrabold text-white shadow-[0_10px_24px_rgba(123,58,35,0.16)] hover:-translate-y-0.5 hover:bg-[#a65032] ${
        compact
          ? "px-4 py-2.5 text-sm sm:px-5"
          : large
            ? "min-h-[3.6rem] w-full px-7 py-4 text-base"
            : "min-h-[3.25rem] px-7 py-3.5 text-base"
      }`}
    >
      {children}
      <ArrowIcon />
    </Link>
  );
}

function PhonePreview() {
  const tasks = [
    { title: "Send the proposal", state: "doing" },
    { title: "Book the dentist", state: "todo" },
    { title: "Call Mum", state: "todo" },
  ] as const;

  return (
    <div className="relative mx-auto w-full max-w-[23rem] lg:mr-5">
      <div
        className="absolute -left-16 top-20 h-52 w-52 rounded-full bg-[#c9b99e] opacity-65"
        aria-hidden="true"
      />
      <div
        className="absolute -right-8 bottom-20 h-32 w-32 rounded-full bg-[#aebaa7] opacity-80"
        aria-hidden="true"
      />

      <div className="relative rounded-[2.8rem] border-[7px] border-[#252a24] bg-[#252a24] p-1 shadow-[0_34px_70px_rgba(56,49,38,0.22)]">
        <div className="overflow-hidden rounded-[2.2rem] bg-[#fbf9f4]">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#252a24]" />

          <div className="px-5 pb-5 pt-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#898b83]">Good morning</p>
                <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#252a24]">
                  Today
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e5ded1] text-sm font-extrabold text-[#4d534b]">
                B
              </span>
            </div>

            <div className="mt-7 space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.title}
                  className="flex items-center gap-3 border-b border-[#e3ddd2] pb-3"
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                      task.state === "doing"
                        ? "border-[#a65336] bg-[#f2ddd3]"
                        : "border-[#bbb9b0]"
                    }`}
                  >
                    {task.state === "doing" && (
                      <span className="h-2 w-2 rounded-full bg-[#a65336]" />
                    )}
                  </span>
                  <span className="flex-1 text-sm font-bold text-[#363b35]">
                    {task.title}
                  </span>
                  <span className="text-[#aaa99f]">••</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-[#e9eee5] p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#64705f]">
                <SparkIcon /> AI, if you want it
              </div>
              <p className="mt-2 text-sm leading-6 text-[#596057]">
                “Move the overdue task to the top.”
              </p>
            </div>

            <div className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#b85f3d] px-5 text-sm font-extrabold text-white">
              <PlusIcon /> Add a task
            </div>
          </div>

          <div className="flex items-center justify-around border-t border-[#e6e0d6] px-5 py-4 text-[10px] font-bold text-[#92948b]">
            <span className="text-[#a65336]">Today</span>
            <span>Projects</span>
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="relative ml-auto mt-5 max-w-[18rem] border-l border-[#928a7c] pl-4 text-sm leading-6 text-[#66685f]">
        The mobile app is the product. Desktop and web are there when a bigger
        screen genuinely helps.
      </div>
    </div>
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

function TickIcon() {
  return (
    <span
      className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#dce5d8] text-[#53674f]"
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

function ScreenIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="3.5" width="15" height="10.5" rx="1.5" />
      <path d="M7 17h6M10 14v3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 3v12M3 9h12" />
    </svg>
  );
}
