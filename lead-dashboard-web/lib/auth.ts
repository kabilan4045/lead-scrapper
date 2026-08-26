// Shared-passcode session helper. Uses Web Crypto (available in both the
// Node.js runtime used by Route Handlers/Proxy and any Edge runtime), so it
// works the same everywhere without a Node-specific `crypto` import.

export const SESSION_COOKIE = "ld_session";
const TOKEN_CONTEXT = "lead-dashboard-authenticated";

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function makeSessionToken(passcode: string): Promise<string> {
  return hmacHex(passcode, TOKEN_CONTEXT);
}

export async function isValidSessionToken(
  token: string | undefined | null,
  passcode: string
): Promise<boolean> {
  if (!token) return false;
  const expected = await hmacHex(passcode, TOKEN_CONTEXT);
  if (token.length !== expected.length) return false;
  // Constant-time comparison to avoid leaking the token via timing.
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
