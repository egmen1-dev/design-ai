/**
 * Chapter 3.17 — Golden dataset (etalon products for all pipeline versions)
 */
import type { GoldenProduct } from "./testing-types";

export const GOLDEN_DATASET: GoldenProduct[] = [
  { id: "coffee-machine", name: "Coffee Machine", category: "home_appliances", seed: 101 },
  { id: "hair-dryer", name: "Hair Dryer", category: "beauty", seed: 102 },
  { id: "vacuum-cleaner", name: "Vacuum Cleaner", category: "home_appliances", seed: 103 },
  { id: "blender", name: "Blender", category: "kitchen", seed: 104 },
  { id: "lawn-mower", name: "Lawn Mower", category: "garden_tools", seed: 105 },
  { id: "speaker", name: "Speaker", category: "electronics", seed: 106 },
  { id: "monitor", name: "Monitor", category: "electronics", seed: 107 },
];

export function goldenProductById(id: string): GoldenProduct | undefined {
  return GOLDEN_DATASET.find((p) => p.id === id);
}
