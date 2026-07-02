/**
 * Design AI Book — shared types for platform chapters 8–11
 */

export type PlatformSectionDefinition = {
  ref: string;
  id: string;
  label: string;
  responsibility: string;
  implementationStatus: "full" | "registry" | "missing";
};

export type BookChapterDefinition = {
  chapter: number;
  id: string;
  title: string;
  expectedSections: number;
  modulePath: string;
  branchSuffix: string;
};
