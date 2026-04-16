import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101824] px-6 py-16 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_20%_-10%,rgba(39,180,172,0.25),transparent_60%),radial-gradient(30rem_20rem_at_85%_115%,rgba(250,146,70,0.25),transparent_60%)]" />
      <main className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0c121b]/85 p-8 backdrop-blur md:p-12">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">DuskBoard</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
          Ship work through a strict agile workflow.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300 md:text-base">
          The backend is ready. Next you can sign in, create a project, and start moving tasks through rules that
          actually matter.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-400 px-6 text-sm font-semibold text-[#0d131c] transition hover:bg-teal-300"
          >
            Open Login
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Create Account
          </Link>
        </div>
      </main>
    </div>
  );
}
