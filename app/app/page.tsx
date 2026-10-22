import { auth } from "@clerk/nextjs/server";
import { SolaceApp } from "@/components/solace-app";

export default async function AppPage() {
  await auth.protect();
  return <main className="min-h-[calc(100dvh-4rem)] w-full overflow-visible bg-[#f4eee8]"><SolaceApp /></main>;
}
