export function termsMatch(haystack: string, term: string): boolean {
  const h = haystack.toLowerCase();
  const t = term.toLowerCase().trim();
  if (!t) return false;
  if (h.includes(t)) return true;
  if (t.length >= 4) {
    for (const word of h.split(/[^\p{L}\p{N}]+/u)) {
      if (word.length >= 3 && (word.includes(t) || t.includes(word))) return true;
    }
  }
  return false;
}

export function expandQueryTerms(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);
}
