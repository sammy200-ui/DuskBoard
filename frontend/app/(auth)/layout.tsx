import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1420] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45rem_26rem_at_6%_0%,rgba(36,190,172,0.25),transparent_70%),radial-gradient(42rem_24rem_at_96%_105%,rgba(252,148,83,0.22),transparent_70%)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-[1.12fr_0.88fr]">
        <section className="hidden border-r border-white/10 px-10 py-12 md:flex md:flex-col">
          <Link href="/" className="w-fit text-xs uppercase tracking-[0.2em] text-zinc-300">
            DuskBoard
          </Link>
          <div className="mt-auto max-w-md">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">Workflow First</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
              Move tickets with rules,
              <br />
              not just drag and drop.
            </h2>
            <p className="mt-5 text-sm leading-7 text-zinc-300">
              DuskBoard enforces role-based transitions so your sprint flow stays real from first commit to final QA.
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center px-5 py-10 md:px-10">{children}</section>
      </div>
    </div>
  );
}