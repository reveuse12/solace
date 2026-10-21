import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) { return <p className="text-[10px] uppercase tracking-[.15em] text-[#827b73]">{children}</p>; }
export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`rounded-2xl border border-[#e5ddd5] bg-[#fbf8f4] ${className}`}>{children}</div>; }
export function PrimaryButton({ children, type = "button", onClick }: { children: ReactNode; type?: "button" | "submit"; onClick?: () => void }) { return <button type={type} onClick={onClick} className="rounded-full bg-[#252321] px-5 py-3 text-xs text-[#f4eee8] transition-transform active:scale-[.98]">{children}</button>; }
