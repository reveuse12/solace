import { ClerkProvider, Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstall } from "@/components/pwa-install";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solace — Make space for what matters",
  description: "A quiet space for intentions, audio rituals, and reflection.",
  appleWebApp: { capable: true, title: "Solace", statusBarStyle: "default" },
};

export const viewport = { themeColor: "#f4eee8", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <Show when="signed-out">
            <header className="flex h-16 items-center justify-end gap-4 border-b border-[#d9d0c6] bg-[#f4eee8] px-4 text-[#252321]">
              <SignInButton />
              <SignUpButton />
            </header>
          </Show>
          <PwaRegister />
          <PwaInstall />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
