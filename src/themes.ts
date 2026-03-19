export interface ThemeDef {
  id: string;
  name: string;
  /** Short label shown on card */
  label: string;
  /** Preview swatches: [bg, surface, accent, secondary] */
  swatches: [string, string, string, string];
}

export const themes: ThemeDef[] = [
  {
    id: "midnight",
    name: "Midnight",
    label: "Deep navy, iris accents",
    swatches: ["#0d1017", "#141821", "#7C6CFF", "#33D1C6"],
  },
  {
    id: "nord",
    name: "Nord",
    label: "Arctic blues, muted greens",
    swatches: ["#2E3440", "#3B4252", "#88C0D0", "#A3BE8C"],
  },
  {
    id: "solarized",
    name: "Solarized Dark",
    label: "Classic warm-cool contrast",
    swatches: ["#002B36", "#073642", "#268BD2", "#2AA198"],
  },
  {
    id: "dracula",
    name: "Dracula",
    label: "Purple, pink, cyan",
    swatches: ["#282A36", "#44475A", "#BD93F9", "#8BE9FD"],
  },
  {
    id: "rosepine",
    name: "Rosé Pine",
    label: "Muted rose, gold, pine",
    swatches: ["#191724", "#1f1d2e", "#c4a7e7", "#31748f"],
  },
];

export const DEFAULT_THEME = "midnight";
export const STORAGE_KEY = "rondo-theme";
