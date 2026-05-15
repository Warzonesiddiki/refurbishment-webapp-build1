export function isLocalhostHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function normalizePort(port: string): string {
  if (!port) return "";
  return port.startsWith(":") ? port.slice(1) : port;
}

export function buildLanHintUrl(hostname: string, port: string, protocol: string): string {
  const normalizedPort = normalizePort(port);
  if (!isLocalhostHost(hostname)) return `${protocol}//${hostname}${normalizedPort ? `:${normalizedPort}` : ""}`;
  return `${protocol}//192.168.x.x${normalizedPort ? `:${normalizedPort}` : ""}`;
}

export function getLanAccessTip(url: string): string {
  return `Open on same Wi‑Fi via ${url}`;
}
