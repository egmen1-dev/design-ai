/**
 * Chapter 3.15 — Privacy sanitization for diagnostic data
 */

const SECRET_PATTERNS = [
  /\b(sk-[A-Za-z0-9_-]{8,})\b/g,
  /\b(api[_-]?key\s*[:=]\s*)([^\s,}"']+)/gi,
  /\b(bearer\s+)([A-Za-z0-9._-]+)/gi,
  /\b(token\s*[:=]\s*)([^\s,}"']+)/gi,
  /\b(password\s*[:=]\s*)([^\s,}"']+)/gi,
  /\b(authorization\s*[:=]\s*)([^\s,}"']+)/gi,
];

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

export function maskSecrets(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, (_match, prefix?: string) => {
      if (prefix && typeof prefix === "string" && prefix.length < 20) {
        return `${prefix}[REDACTED]`;
      }
      return "[REDACTED]";
    });
  }
  out = out.replace(EMAIL_PATTERN, "[EMAIL_REDACTED]");
  return out;
}

export function sanitizeDiagnosticData(
  data: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(data)) {
    if (/^(api[_-]?key|token|secret|password|authorization|credential|bearer)$/i.test(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (typeof value === "string") {
      out[key] = maskSecrets(value);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
    } else {
      out[key] = maskSecrets(JSON.stringify(value));
    }
  }
  return out;
}

export function stripDebugOnlyFields<T extends { prompt?: string; negativePrompt?: string }>(
  diagnostic: T,
  debugMode: boolean,
): T {
  if (debugMode) return diagnostic;
  const { prompt: _p, negativePrompt: _n, ...rest } = diagnostic;
  return rest as T;
}
