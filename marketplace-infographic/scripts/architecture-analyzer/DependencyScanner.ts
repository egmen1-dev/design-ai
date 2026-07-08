import type { ScanResult } from "../architecture-scanner/types";
import type { DependencyReportData } from "./types";

function layerFromPath(path: string): string {
  const p = path.replace(/\\/g, "/");
  if (p.includes("/platform-core/")) return "platform-core";
  if (p.includes("/runtime/")) return "runtime";
  if (p.includes("/providers/")) return "providers";
  if (p.includes("/design-process/")) return "creative";
  if (p.includes("/render-engine/") || p.includes("/render-blueprint/")) return "rendering";
  if (p.includes("/design-governance/")) return "governance";
  if (p.includes("/prompt/")) return "prompt-legacy";
  return "other";
}

export class DependencyScanner {
  scan(scan: ScanResult): DependencyReportData {
    const edgeCounts = new Map<string, number>();
    let totalInternalDeps = 0;

    for (const file of scan.files) {
      const fromLayer = layerFromPath(file.path);
      for (const dep of file.dependencies) {
        totalInternalDeps++;
        const toLayer = layerFromPath(dep.includes("/") ? dep : file.path);
        const key = `${fromLayer}->${toLayer}`;
        edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
      }
    }

    const crossLayerEdges = [...edgeCounts.entries()]
      .map(([key, count]) => {
        const [from, to] = key.split("->");
        return { from: from!, to: to!, count };
      })
      .filter((e) => e.from !== e.to)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topCoupledFiles = scan.files
      .map((f) => ({ path: f.path, dependencyCount: f.dependencies.length }))
      .sort((a, b) => b.dependencyCount - a.dependencyCount)
      .slice(0, 25);

    return { totalInternalDeps, crossLayerEdges, topCoupledFiles };
  }
}
