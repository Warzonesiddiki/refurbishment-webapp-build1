function toHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Web(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function calculateChecksum(data: unknown): Promise<string> {
  const serialized = JSON.stringify(data);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return sha256Web(serialized);
  }
  let hash = 0;
  for (let i = 0; i < serialized.length; i += 1) {
    hash = (hash << 5) - hash + serialized.charCodeAt(i);
    hash |= 0;
  }
  return `fallback-${Math.abs(hash)}`;
}
