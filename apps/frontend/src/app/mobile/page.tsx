import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ballistic for Mobile | Coming Soon",
  description:
    "Ballistic is bringing its beautifully simple, AI-connectable bullet list to mobile.",
};

const mobileBenefits = [
  {
    number: "01",
    title: "Capture in a tap",
    description: "Open it, write the bullet, get on with your day.",
  },
  {
    number: "02",
    title: "Beautifully simple",
    description: "Everything you need for a clear list. Nothing in your way.",
  },
  {
    number: "03",
    title: "Your AI, if you want it",
    description:
      "Connect a compatible AI service you already use and let it handle the list admin.",
  },
] as const;

export default function MobilePage() {
  return (
    <main className="relative left-1/2 -my-4 min-h-dvh w-screen -translate-x-1/2 overflow-hidden bg-[#f5f3ee] text-[var(--text)] lg:static lg:my-0 lg:w-auto lg:translate-x-0">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10 lg:py-7">
        <Link href="/" className="flex items-center gap-3 text-[var(--navy)]">
          <Image
            src="/logo.png"
            alt=""
            width={34}
            height={34}
            className="h-8 w-8 rounded-xl"
          />
          <span className="text-sm font-semibold tracking-[-0.01em]">
            Ballistic
          </span>
        </Link>

        <Link
          href="/register"
          className="inline-flex min-h-10 items-center rounded-full border border-slate-300/80 bg-white/60 px-4 text-xs font-semibold text-[var(--navy)] backdrop-blur hover:bg-white"
        >
          Use on the web
        </Link>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100dvh-5rem)] max-w-7xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-10 lg:pb-24 lg:pt-10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-200 bg-white/65 px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[var(--blue)] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[var(--blue-600)]" />
            Mobile app · Coming soon
          </div>

          <h1 className="mt-7 text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-[4.8rem]">
            Your clearest list.
            <span className="block text-[var(--blue)]">
              Right in your pocket.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-balance text-xl leading-8 text-slate-600 sm:text-2xl sm:leading-9">
            Ballistic for mobile is built for the moment a thought appears:
            quick to open, effortless to use and quiet enough to become a habit.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--blue)] px-5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(30,64,175,0.22)] hover:-translate-y-0.5 hover:bg-[var(--blue-600)]"
            >
              Start on the web
              <span className="text-lg leading-none" aria-hidden="true">
                →
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center px-4 text-sm font-medium text-slate-500 hover:text-[var(--navy)]"
            >
              Back to Ballistic
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[31rem] items-center justify-center lg:min-h-[38rem] lg:justify-end">
          <div
            className="pointer-events-none absolute h-[27rem] w-[27rem] rounded-full border border-blue-200/80 sm:h-[34rem] sm:w-[34rem]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute h-[20rem] w-[20rem] rounded-full bg-blue-200/65 blur-[70px] sm:h-[26rem] sm:w-[26rem]"
            aria-hidden="true"
          />

          <div className="relative w-[17.5rem] rotate-[3deg] rounded-[2.8rem] border-[7px] border-[var(--navy)] bg-white p-3 shadow-[0_35px_90px_rgba(10,37,64,0.25)] transition-transform duration-500 hover:rotate-0 sm:w-[19rem]">
            <div className="relative min-h-[34rem] overflow-hidden rounded-[2.15rem] bg-[#f7f8fa] px-5 pb-6 pt-8 sm:min-h-[37rem]">
              <span className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-[var(--navy)]" />

              <div className="flex items-end justify-between border-b border-slate-200 pb-5">
                <div>
                  <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Today
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                    My list
                  </p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--blue)] text-xl text-white">
                  +
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <MobileTask colour="bg-blue-500" text="Send the proposal" />
                <MobileTask colour="bg-amber-400" text="Book Friday lunch" />
                <MobileTask
                  colour="bg-emerald-500"
                  text="Plan the next release"
                />
              </div>

              <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-blue-500">
                  Optional connection
                </p>
                <p className="mt-2 text-sm font-medium leading-5 text-[var(--navy)]">
                  Let your AI organise the list when you want a hand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto grid max-w-7xl divide-y divide-slate-200 px-5 sm:px-8 lg:grid-cols-3 lg:divide-x lg:divide-y-0 lg:px-10">
          {mobileBenefits.map((benefit) => (
            <article
              key={benefit.number}
              className="py-8 lg:px-8 lg:py-10 first:lg:pl-0 last:lg:pr-0"
            >
              <span className="text-[0.65rem] font-medium tracking-[0.16em] text-slate-400">
                {benefit.number}
              </span>
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.015em] text-[var(--navy)]">
                {benefit.title}
              </h2>
              <p className="mt-2 max-w-sm leading-7 text-slate-500">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>Ballistic: The Simplest Bullet List</span>
          <span>Mobile first · Web companion included</span>
        </div>
      </footer>
    </main>
  );
}

function MobileTask({ colour, text }: { colour: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3.5 shadow-sm">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colour}`} />
      <span className="text-sm font-medium text-[var(--navy)]">{text}</span>
      <span className="ml-auto h-5 w-5 rounded-full border border-slate-300" />
    </div>
  );
}
