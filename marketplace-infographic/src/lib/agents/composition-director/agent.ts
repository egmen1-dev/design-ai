import type { DesignAgent } from "../types";
import { runCompositionDirector } from "@/lib/design/composition-director";
import type { CompositionDirectorInput, CompositionDirectorResult } from "@/lib/design/composition-director";

export const COMPOSITION_DIRECTOR_AGENT: DesignAgent<
  CompositionDirectorInput,
  CompositionDirectorResult
> = {
  id: "composition-director",
  name: "Composition Director",
  version: "1.0.0",
  run: (input) => runCompositionDirector(input),
};

export { runCompositionDirector };
export type { CompositionDirectorInput, CompositionDirectorResult };
