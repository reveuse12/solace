import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/app");

  return <main className="min-h-[calc(100dvh-4rem)] bg-[#f4eee8] text-[#252321]">
    <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.1fr_.9fr] lg:px-16">
      <div><p className="text-[10px] uppercase tracking-[.18em] text-[#827b73]">A daily practice for your inner world</p><h1 className="mt-6 max-w-2xl text-6xl font-semibold leading-[.9] tracking-[-.07em] sm:text-8xl">Make space for<br /><em className="font-serif font-medium">what matters.</em></h1><p className="mt-8 max-w-md text-sm leading-7 text-[#827b73]">Solace gives you a quiet place for intentions, reflection, and small rituals that help you return to yourself.</p><div className="mt-10 flex flex-wrap gap-3"><SignUpButton><button className="rounded-full bg-[#252321] px-6 py-3 text-xs text-[#f4eee8]">Begin your practice</button></SignUpButton><SignInButton><button className="rounded-full border border-[#252321] px-6 py-3 text-xs">Sign in</button></SignInButton></div></div>
      <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-[#d8d9cf] p-8"><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#cbd5c7] blur-2xl" /><div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#e5d8cc] blur-2xl" /><div className="relative flex h-full min-h-[300px] flex-col justify-between"><span className="text-[10px] uppercase tracking-[.16em] text-[#6e716b]">Your space, daily</span><p className="max-w-xs font-serif text-4xl leading-tight">A little room to breathe, notice, and begin again.</p><span className="text-xs text-[#6e716b]">Private by design · Yours to shape</span></div></div>
    </section>
  </main>;
}
