const IMPORT_RE =
  /import\s+(?:type\s+)?(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
const EXPORT_RE = /export\s+(?:type\s+)?(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|enum|interface|type)\s+(\w+)/g;

export function extractImports(content: string): string[] {
  const imports = new Set<string>();
  for (const match of content.matchAll(IMPORT_RE)) {
    if (match[1]) imports.add(match[1]);
  }
  return [...imports];
}

export function extractExports(content: string): string[] {
  const exports = new Set<string>();
  for (const match of content.matchAll(EXPORT_RE)) {
    if (match[1]) exports.add(match[1]);
  }
  if (/export\s+default/.test(content)) exports.add("default");
  return [...exports];
}

export function resolveDependencies(imports: string[]): string[] {
  return imports.filter(
    (i) => i.startsWith("@/") || i.startsWith(".") || i.startsWith("src/"),
  );
}

export function importTargetsLayer(imports: string[], layerPattern: RegExp): boolean {
  return imports.some((i) => layerPattern.test(i.replace(/\\/g, "/")));
}
