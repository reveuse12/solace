import { auth } from "@clerk/nextjs/server";
import { SolaceApp } from "@/components/solace-app";

export default async function Home() {
  await auth.protect();

  return (
    <main className="h-[calc(100dvh-4rem)] w-full overflow-hidden bg-[#f4eee8]">
      <SolaceApp />
    </main>
  );
}
