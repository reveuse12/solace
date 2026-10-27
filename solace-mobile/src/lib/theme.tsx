import { createContext, useContext, type ReactNode } from "react";
export const palettes = {
  warm: { ink: "#4b1f38", muted: "#795065", pink: "#f8dfe2", rose: "#e49bb8", surface: "#fff7fa", dark: "#211a26", button: "#4b1f38", buttonText: "#fff7fa", quiet: "#efdce5", border: "#b77e98", placeholder: "#896378", error: "#96372e", notice: "#edcfdf" },
  midnight: { ink: "#fae8f0", muted: "#d3b8cc", pink: "#211a26", rose: "#87546f", surface: "#302534", dark: "#211a26", button: "#e7a5c5", buttonText: "#321c2b", quiet: "#453347", border: "#a17d95", placeholder: "#bda2b6", error: "#ffb9ad", notice: "#453347" },
};
const Theme = createContext(palettes.warm);
export function ThemeProvider({ mode, children }: { mode: "warm" | "midnight"; children: ReactNode }) { return <Theme.Provider value={palettes[mode]}>{children}</Theme.Provider>; }
export const usePalette = () => useContext(Theme);
