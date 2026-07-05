import { createSpecification, type BaseSpecification } from "./BaseSpecification";

export type ResearchSpec = Readonly<
  BaseSpecification & {
    readonly specType: "ResearchSpec";
    readonly query: string;
    readonly findings: Readonly<Record<string, unknown>>;
  }
>;

export type KnowledgeSpec = Readonly<
  BaseSpecification & {
    readonly specType: "KnowledgeSpec";
    readonly knowledge: Readonly<Record<string, unknown>>;
  }
>;

export type CommercialSpec = Readonly<
  BaseSpecification & {
    readonly specType: "CommercialSpec";
    readonly strategy: Readonly<Record<string, unknown>>;
  }
>;

export type CreativeSpec = Readonly<
  BaseSpecification & {
    readonly specType: "CreativeSpec";
    readonly creative: Readonly<Record<string, unknown>>;
  }
>;

export type VisualBlueprint = Readonly<
  BaseSpecification & {
    readonly specType: "VisualBlueprint";
    readonly blueprint: Readonly<Record<string, unknown>>;
  }
>;

export type RenderBlueprint = Readonly<
  BaseSpecification & {
    readonly specType: "RenderBlueprint";
    readonly render: Readonly<Record<string, unknown>>;
  }
>;

export type VisionReport = Readonly<
  BaseSpecification & {
    readonly specType: "VisionReport";
    readonly report: Readonly<Record<string, unknown>>;
  }
>;

export type LearningReport = Readonly<
  BaseSpecification & {
    readonly specType: "LearningReport";
    readonly learning: Readonly<Record<string, unknown>>;
  }
>;

export type DaosSpecification =
  | ResearchSpec
  | KnowledgeSpec
  | CommercialSpec
  | CreativeSpec
  | VisualBlueprint
  | RenderBlueprint
  | VisionReport
  | LearningReport;

const now = () => new Date().toISOString();

export function emptyResearchSpec(
  patch: Partial<Omit<ResearchSpec, "specType" | "version" | "createdAt">> = {},
): ResearchSpec {
  return createSpecification({
    specType: "ResearchSpec",
    version: "1.0.0",
    createdAt: now(),
    query: "",
    findings: Object.freeze({}),
    ...patch,
  });
}

export function emptyKnowledgeSpec(
  patch: Partial<Omit<KnowledgeSpec, "specType" | "version" | "createdAt">> = {},
): KnowledgeSpec {
  return createSpecification({
    specType: "KnowledgeSpec",
    version: "1.0.0",
    createdAt: now(),
    knowledge: Object.freeze({}),
    ...patch,
  });
}

export function emptyCommercialSpec(
  patch: Partial<Omit<CommercialSpec, "specType" | "version" | "createdAt">> = {},
): CommercialSpec {
  return createSpecification({
    specType: "CommercialSpec",
    version: "1.0.0",
    createdAt: now(),
    strategy: Object.freeze({}),
    ...patch,
  });
}

export function emptyCreativeSpec(
  patch: Partial<Omit<CreativeSpec, "specType" | "version" | "createdAt">> = {},
): CreativeSpec {
  return createSpecification({
    specType: "CreativeSpec",
    version: "1.0.0",
    createdAt: now(),
    creative: Object.freeze({}),
    ...patch,
  });
}

export function emptyVisualBlueprint(
  patch: Partial<Omit<VisualBlueprint, "specType" | "version" | "createdAt">> = {},
): VisualBlueprint {
  return createSpecification({
    specType: "VisualBlueprint",
    version: "1.0.0",
    createdAt: now(),
    blueprint: Object.freeze({}),
    ...patch,
  });
}

export function emptyRenderBlueprint(
  patch: Partial<Omit<RenderBlueprint, "specType" | "version" | "createdAt">> = {},
): RenderBlueprint {
  return createSpecification({
    specType: "RenderBlueprint",
    version: "1.0.0",
    createdAt: now(),
    render: Object.freeze({}),
    ...patch,
  });
}
