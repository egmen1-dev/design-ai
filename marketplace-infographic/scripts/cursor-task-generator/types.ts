export type TaskState =
  | "Pending"
  | "Ready"
  | "Running"
  | "Blocked"
  | "Review"
  | "Completed"
  | "Rejected";

export type TaskPriority = "Critical" | "High" | "Medium" | "Low";
export type TaskRisk = "low" | "medium" | "high" | "critical";

export type TaskGroup =
  | "Platform"
  | "Runtime"
  | "Provider"
  | "Assets"
  | "Vision"
  | "Learning"
  | "Legacy"
  | "Contracts"
  | "Infrastructure";

export interface TaskScore {
  complexity: number;
  risk: TaskRisk;
  estimatedHours: number;
  architectureImpact: number;
  breakingChange: boolean;
  confidence: number;
}

export interface CursorTask {
  id: string;
  title: string;
  wave: number;
  waveName: string;
  priority: TaskPriority;
  risk: TaskRisk;
  estimatedHours: number;
  dependsOn: string[];
  files: string[];
  acceptance: string[];
  rollback: string[];
  architectureRef: string;
  rfcRef?: string;
  adrRef?: string;
  directive?: string;
  group: TaskGroup;
  state: TaskState;
  score: TaskScore;
}

export interface WavePlan {
  wave: number;
  name: string;
  group: TaskGroup;
  tasks: CursorTask[];
}

export interface TaskPlan {
  generatedAt: string;
  waves: WavePlan[];
  dependencyGraph: Record<string, string[]>;
  checklists: {
    preImplementation: string[];
    implementation: string[];
    postImplementation: string[];
  };
}

export const WAVE_DEFINITIONS: Array<{ wave: number; name: string; group: TaskGroup }> = [
  { wave: 1, name: "Platform Core", group: "Platform" },
  { wave: 2, name: "Contracts", group: "Contracts" },
  { wave: 3, name: "Runtime", group: "Runtime" },
  { wave: 4, name: "Knowledge", group: "Platform" },
  { wave: 5, name: "Commercial", group: "Platform" },
  { wave: 6, name: "Creative", group: "Platform" },
  { wave: 7, name: "Visual", group: "Platform" },
  { wave: 8, name: "Rendering", group: "Platform" },
  { wave: 9, name: "Vision", group: "Vision" },
  { wave: 10, name: "Learning", group: "Learning" },
  { wave: 11, name: "Providers", group: "Provider" },
  { wave: 12, name: "Assets", group: "Assets" },
  { wave: 13, name: "SDK", group: "Platform" },
  { wave: 14, name: "Architecture Validation", group: "Infrastructure" },
  { wave: 15, name: "Legacy Cleanup", group: "Legacy" },
  { wave: 16, name: "Performance", group: "Infrastructure" },
  { wave: 17, name: "Marketplace", group: "Platform" },
  { wave: 18, name: "Testing", group: "Infrastructure" },
  { wave: 19, name: "Documentation", group: "Infrastructure" },
  { wave: 20, name: "Release", group: "Infrastructure" },
];
