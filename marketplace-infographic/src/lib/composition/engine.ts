import type { CompositionEngineInput } from "@/lib/design/types";
import { generateComposition } from "@/lib/design/composition-engine";
import type { CompositionInput, CompositionLayout } from "./types";

/** @deprecated Используйте generateComposition из @/lib/design */
export function computeComposition(input: CompositionInput): CompositionLayout {
  const engineInput: CompositionEngineInput = {
    category: input.category,
    layout: input.layout,
    bulletCount: input.bulletCount,
    hasLeftPanel: input.hasLeftPanel,
    hasRightSidebar: input.hasRightSidebar,
    hasLogo: input.hasLogo,
    objectScale: input.objectScale,
    styleHint: input.styleHint,
    seed: input.seed,
  };

  return generateComposition(engineInput).layout;
}
