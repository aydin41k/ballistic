import Image from "next/image";
import Link from "next/link";

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

const particleClusters = [
  { x: 74, y: 22, rx: 19, ry: 18, count: 92, seed: 0.2 },
  { x: 46, y: 57, rx: 17, ry: 25, count: 82, seed: 1.4 },
  { x: 82, y: 73, rx: 13, ry: 18, count: 58, seed: 2.8 },
] as const;

const taskParticles = particleClusters.flatMap((cluster, clusterIndex) =>
  Array.from({ length: cluster.count }, (_, index) => {
    const angle = index * 2.3999632297 + cluster.seed;
    const radius = Math.sqrt((index + 0.5) / cluster.count);
    const wobble = 0.84 + Math.sin(index * 9.17 + cluster.seed) * 0.15;

    return {
      id: `${clusterIndex}-${index}`,
      x:
        cluster.x +
        Math.cos(angle) * cluster.rx * radius * wobble +
        Math.sin(index * 3.1) * 0.8,
      y:
        cluster.y +
        Math.sin(angle) * cluster.ry * radius * wobble +
        Math.cos(index * 2.7) * 0.8,
      radius: 0.12 + (index % 5) * 0.035,
      opacity: 0.28 + (index % 7) * 0.085,
    };
  }),
);

export default function LandingPage() {
  return (
    <main className="relative left-1/2 -my-4 min-h-dvh w-screen -translate-x-1/2 overflow-hidden bg-[#f7f7f5] text-[#0b0b0b] selection:bg-[#b7ff5a] selection:text-black lg:static lg:my-0 lg:w-auto lg:translate-x-0">
      <FloatingHeader />

      <section className="relative min-h-[54rem] overflow-hidden border-b border-black/10 sm:min-h-[58rem] lg:min-h-[calc(100svh-1rem)]">
        <TaskSignalField />

        <div className="relative z-10 mx-auto grid min-h-[54rem] max-w-7xl items-end gap-12 px-5 pb-16 pt-32 sm:min-h-[58rem] sm:px-8 sm:pb-20 lg:min-h-[calc(100svh-1rem)] lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:pb-16 lg:pt-28">
          <div className="max-w-2xl lg:pb-12">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/55">
              Mobile-first · AI when invited
            </p>
            <h1 className="mt-5 text-balance text-5xl font-black leading-[0.93] tracking-[-0.065em] sm:text-6xl lg:text-[5.25rem]">
              Your tasks.
              <span className="block">Nothing else</span>
              <span className="block">in the way.</span>
            </h1>

            <div className="mt-8 max-w-xl border-l border-black pl-5 sm:pl-6">
              <p className="text-lg leading-7 text-black/68 sm:text-xl sm:leading-8">
                Ballistic is the simplest to-do list on your phone. Add AI,
                dates, projects and delegation only when they make life easier.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <PrimaryLink>Start my list</PrimaryLink>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center rounded-full bg-white/80 px-5 text-sm font-semibold text-black ring-1 ring-black/10 backdrop-blur hover:bg-white"
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

        <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-3 rounded-full bg-white/85 px-4 py-2 text-xs font-medium text-black/60 ring-1 ring-black/[0.06] backdrop-blur sm:flex lg:right-8">
          <span className="h-2 w-2 rounded-full bg-[#91f743]" />
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
                <span className="text-black/30"> Not become more of it.</span>
              </h2>
            </div>

            <div className="self-end border-t border-black">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-3 border-b border-black/20 py-7 sm:grid-cols-[3rem_9rem_1fr] sm:items-baseline sm:gap-5"
                >
                  <span className="text-[0.68rem] font-bold tracking-[0.16em] text-black/40">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold tracking-[-0.025em]">
                    {step.title}
                  </h3>
                  <p className="leading-7 text-black/58">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="optional"
        className="relative overflow-hidden border-y border-black/10 bg-[#edffdc]"
      >
        <div
          className="pointer-events-none absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full border border-black/15"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-28 lg:px-10 lg:py-36">
          <div>
            <SectionLabel>Power, on request</SectionLabel>
            <h2 className="mt-6 max-w-xl text-balance text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl">
              Start with a list.
              <span className="block text-black/32">
                Turn on the rest later.
              </span>
            </h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-black/62">
              Every extra is optional. Ballistic stays calm until a feature can
              genuinely remove work from your day.
            </p>
            <div className="mt-9">
              <PrimaryLink>Make my list now</PrimaryLink>
            </div>
          </div>

          <div className="border-t border-black">
            {optionalTools.map(([title, description], index) => (
              <article
                key={title}
                className="group grid gap-3 border-b border-black/20 py-6 sm:grid-cols-[2.4rem_10rem_1fr_auto] sm:items-center sm:gap-5"
              >
                <span className="text-[0.65rem] font-bold tracking-[0.14em] text-black/38">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-bold tracking-[-0.02em]">{title}</h3>
                <p className="text-sm leading-6 text-black/52">{description}</p>
                <span className="flex h-7 w-12 items-center rounded-full border border-black/15 bg-white/65 p-1">
                  <span className="h-5 w-5 rounded-full bg-black/20 transition-transform group-hover:translate-x-5 group-hover:bg-black" />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="companion" className="bg-[#0b0b0b] text-white">
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
          <div className="absolute -bottom-40 right-[8%] h-80 w-80 rounded-full bg-[#b7ff5a] blur-[90px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/45">
            You already know the first task
          </p>
          <div className="mt-6 flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <h2 className="max-w-4xl text-balance text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]">
              Stop organising.
              <span className="block">Put it down.</span>
            </h2>
            <Link
              href="/register"
              className="group inline-flex min-h-16 shrink-0 items-center gap-5 rounded-full bg-[#b7ff5a] px-7 text-base font-bold text-black ring-1 ring-black/10 shadow-[0_18px_50px_rgba(121,190,39,0.28)] hover:-translate-y-1 hover:bg-[#a9f846]"
            >
              Start my list
              <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 text-xs text-black/48 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={26}
              height={26}
              className="h-6 w-6 rounded-lg"
            />
            <span className="font-bold text-black">Ballistic</span>
            <span>© {new Date().getFullYear()} Psycode Pty. Ltd.</span>
          </div>
          <div className="flex items-center gap-5 font-medium">
            <span>Mobile first · AI optional · Web included</span>
            <Link href="/login" className="text-black/60 hover:text-black">
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
          className="flex min-h-11 items-center gap-2.5 rounded-full bg-white/90 px-3.5 text-black shadow-sm ring-1 ring-black/[0.06] backdrop-blur-xl"
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
          className="hidden items-center gap-1 rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-black/[0.06] backdrop-blur-xl md:flex"
          aria-label="Main navigation"
        >
          <a
            href="#simple"
            className="rounded-full px-4 py-2 text-xs font-medium text-black/65 hover:bg-black/[0.04] hover:text-black"
          >
            Simple
          </a>
          <a
            href="#optional"
            className="rounded-full px-4 py-2 text-xs font-medium text-black/65 hover:bg-black/[0.04] hover:text-black"
          >
            Optional power
          </a>
          <a
            href="#companion"
            className="rounded-full px-4 py-2 text-xs font-medium text-black/65 hover:bg-black/[0.04] hover:text-black"
          >
            AI + web
          </a>
        </nav>

        <div className="flex items-center gap-2 rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-black/[0.06] backdrop-blur-xl">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-xs font-medium text-black/65 hover:text-black min-[390px]:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#b7ff5a] px-4 text-xs font-bold text-black ring-1 ring-black/10 hover:bg-[#a9f846]"
          >
            Start my list
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}

function TaskSignalField() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <path
          d="M 12 80 C 30 63, 36 57, 48 55 S 68 30, 75 23 S 82 61, 83 74"
          fill="none"
          stroke="#111111"
          strokeOpacity="0.08"
          strokeWidth="0.08"
        />
        <circle
          cx="46"
          cy="57"
          r="22"
          fill="none"
          stroke="#111111"
          strokeOpacity="0.07"
          strokeWidth="0.08"
        />
        <circle
          cx="75"
          cy="22"
          r="24"
          fill="none"
          stroke="#111111"
          strokeOpacity="0.07"
          strokeWidth="0.08"
        />
        {taskParticles.map((particle) => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={particle.radius}
            fill="#8df43b"
            fillOpacity={particle.opacity}
          />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#f7f7f5] via-[#f7f7f5]/75 to-transparent" />
    </div>
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
      <div className="absolute -inset-8 rounded-full bg-[#b7ff5a]/25 blur-3xl" />
      <div className="relative rounded-[3rem] border-[0.45rem] border-black bg-black p-1 shadow-[0_35px_90px_rgba(0,0,0,0.22)]">
        <div className="overflow-hidden rounded-[2.35rem] bg-white">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-black" />
          <div className="px-5 pb-5 pt-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.65rem] font-medium text-black/42">
                  Good morning
                </p>
                <p className="mt-0.5 text-2xl font-black tracking-[-0.045em]">
                  Today
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-xs font-bold text-white">
                B
              </span>
            </div>

            <div className="mt-7 border-t border-black">
              {tasks.map(([title, status]) => (
                <div
                  key={title}
                  className="flex items-center gap-3 border-b border-black/12 py-3.5"
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                      status === "doing"
                        ? "border-black bg-[#b7ff5a]"
                        : "border-black/25"
                    }`}
                  >
                    {status === "doing" && (
                      <span className="h-2 w-2 rounded-full bg-black" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {title}
                  </span>
                  <span className="text-xs text-black/30">••</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[#f0f0ed] p-4">
              <div className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-black/50">
                <SparkIcon /> AI, if you ask
              </div>
              <p className="mt-2 text-sm leading-5 text-black/65">
                “Move anything overdue to the top.”
              </p>
            </div>

            <div className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full bg-black text-sm font-bold text-white">
              <PlusIcon /> Add a task
            </div>
          </div>

          <div className="flex items-center justify-around border-t border-black/10 px-5 py-4 text-[0.58rem] font-semibold text-black/35">
            <span className="text-black">Today</span>
            <span>Projects</span>
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="absolute -right-7 top-32 hidden rounded-full bg-white px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-black shadow-lg ring-1 ring-black/[0.06] sm:block">
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

      <div className="absolute left-[8%] top-[44%] w-24 rounded-[1.35rem] border-4 border-white bg-white p-2 text-black shadow-2xl sm:w-28">
        <div className="mx-auto h-1.5 w-8 rounded-full bg-black" />
        <p className="mt-4 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-black/40">
          Today
        </p>
        {["Proposal", "Dentist", "Mum"].map((task, index) => (
          <div
            key={task}
            className="mt-2 flex items-center gap-1.5 border-b border-black/10 pb-1.5 text-[0.48rem] font-semibold"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full border border-black/30 ${index === 0 ? "bg-[#b7ff5a]" : ""}`}
            />
            {task}
          </div>
        ))}
        <p className="mt-2 text-center text-[0.42rem] font-bold text-black/35">
          MOBILE
        </p>
      </div>

      <div className="absolute right-[7%] top-[17%] w-[54%] rounded-xl border border-white/25 bg-[#171717] p-2 shadow-2xl sm:p-3">
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#b7ff5a]" />
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
                  className={`h-2.5 w-2.5 rounded-full border border-white/30 ${item === 0 ? "bg-[#b7ff5a]" : ""}`}
                />
                <span className="h-1 flex-1 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-[13%] right-[11%] w-[54%] rounded-2xl bg-[#b7ff5a] p-4 text-black shadow-2xl sm:p-5">
        <div className="flex items-center gap-2 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-black/55">
          <SparkIcon /> Your AI connection
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 sm:text-sm">
          “Add the follow-up and put it after the proposal.”
        </p>
      </div>

      <span className="absolute left-[26%] top-[62%] h-3 w-3 rounded-full bg-[#b7ff5a] ring-4 ring-[#b7ff5a]/20" />
      <span className="absolute right-[39%] top-[29%] h-2 w-2 rounded-full bg-[#b7ff5a]" />
      <span className="absolute bottom-[20%] right-[24%] h-2 w-2 rounded-full bg-black ring-2 ring-[#b7ff5a]" />
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
      className={`flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${light ? "text-white/45" : "text-black/45"}`}
    >
      <span className={`h-px w-8 ${light ? "bg-white/40" : "bg-black/40"}`} />
      {children}
    </p>
  );
}

function PrimaryLink({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/register"
      className="inline-flex min-h-11 items-center gap-3 rounded-full bg-[#b7ff5a] px-5 text-sm font-bold text-black ring-1 ring-black/10 shadow-[0_12px_30px_rgba(121,190,39,0.18)] hover:-translate-y-0.5 hover:bg-[#a9f846]"
    >
      {children}
      <span className="grid h-7 w-7 place-items-center rounded-full bg-black text-white">
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
