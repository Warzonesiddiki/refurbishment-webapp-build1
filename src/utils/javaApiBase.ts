function getWindowOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:8085";
}

export function resolveJavaApiBase(configured: string | undefined): string {
  const raw = configured?.trim();
  if (!raw) {
    return getWindowOrigin();
  }
  return raw.replace(/\/+$/, "");
}

export function joinJavaApiPath(base: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (base === "/api" && normalizedPath.startsWith("/api/")) {
    return normalizedPath;
  }

  if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${base}${normalizedPath.slice(4)}`;
  }

  return `${base}${normalizedPath}`;
}
