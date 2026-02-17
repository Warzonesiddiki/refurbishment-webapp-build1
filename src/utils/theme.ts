export type ThemeMode = "cyber" | "pro";
const THEME_CLASS_CYBER = "theme-cyber";
const THEME_CLASS_PRO = "theme-pro";

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "pro";
  const saved = window.localStorage.getItem("alm_theme");
  return saved === "cyber" ? "cyber" : "pro";
}

export function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove(THEME_CLASS_CYBER, THEME_CLASS_PRO);
  body.classList.remove(THEME_CLASS_CYBER, THEME_CLASS_PRO);
  const cls = theme === "pro" ? THEME_CLASS_PRO : THEME_CLASS_CYBER;
  root.classList.add(cls);
  body.classList.add(cls);
  root.setAttribute("data-theme", theme);
  body.setAttribute("data-theme", theme);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("alm_theme", theme);
  }
}
