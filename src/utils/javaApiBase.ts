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

  const normalized = raw.replace(/\/+$/, "");
  if (!normalized) {
    return "/";
  }

  return normalized;
}

export function joinJavaApiPath(base: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const baseIsApiRoot = base === "/api" || base.endsWith("/api");
  if (baseIsApiRoot && (normalizedPath === "/api" || normalizedPath.startsWith("/api/"))) {
    if (base === "/api") {
      return normalizedPath;
    }
    if (normalizedPath === "/api") {
      return base;
    }
    return `${base}${normalizedPath.slice(4)}`;
  }

  if (base === "/") {
    return normalizedPath;
  }

  return `${base}${normalizedPath}`;
}
