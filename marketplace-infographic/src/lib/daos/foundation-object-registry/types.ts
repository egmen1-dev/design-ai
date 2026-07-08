export type FoundationObjectType = "GenerationContext" | "MetricValue" | "FeatureFlag";

export type LifecycleState = "Initialized" | "Active" | "Deprecated" | "Archived";

export type InstanceMutability = "Immutable" | "AppendOnly" | "Mutable";

export type LifecycleSpec = {
  currentState: LifecycleState;
  instanceMutability: InstanceMutability;
};

export type FoundationObjectDefinition = {
  ObjectId: string;
  ObjectName: string;
  ObjectType: FoundationObjectType;
  Description: string;
  Owner: string;
  Producer: string;
  Consumers: string[];
  Lifecycle: LifecycleSpec;
  SchemaVersion: string;
  Dependencies: string[];
  ValidationRules: string[];
  Diagnostics: string[];
  Notes: string;
};

export type ValidationIssueCode =
  | "DUPLICATE_OBJECT_ID"
  | "DUPLICATE_SCHEMA_VERSION"
  | "MISSING_OWNER"
  | "MISSING_PRODUCER"
  | "MISSING_LIFECYCLE"
  | "MISSING_DESCRIPTION"
  | "MISSING_VERSION"
  | "INVALID_VERSION"
  | "INVALID_DEPENDENCY"
  | "UNKNOWN_OBJECT_TYPE"
  | "REGISTRATION_INELIGIBLE"
  | "INCOMPLETE_CONSUMERS"
  | "PRODUCER_UNREACHABLE";

export type ValidationIssue = {
  code: ValidationIssueCode;
  severity: "Error" | "Warning";
  objectId?: string;
  message: string;
};

export type DependencyGraphEntry = {
  producer: string;
  objectId: string;
  consumers: string[];
};

export type FoundationObjectRegistryDiagnostics = {
  registrySchemaVersion: number;
  bootstrapComplete: boolean;
  foundationRegistryHealthy: boolean;
  registeredObjects: FoundationObjectDefinition[];
  duplicates: {
    duplicateObjectIds: string[];
    duplicateSchemaVersions: Array<{ objectId: string; schemaVersion: string }>;
  };
  missingOwners: {
    objectIds: string[];
  };
  missingProducers: {
    objectIds: string[];
  };
  dependencyGraph: DependencyGraphEntry[];
  validationIssues: ValidationIssue[];
  schemaVersions: Array<{
    objectId: string;
    schemaVersion: string;
    lifecycleState: string;
  }>;
  objectStatistics: {
    totalDefinitions: number;
    totalObjectTypes: number;
    definitionsByType: Record<string, number>;
    definitionsByOwner: Record<string, number>;
    activeCount: number;
    deprecatedCount: number;
  };
};

export type FoundationObjectRegistry = {
  Lookup: (objectType: FoundationObjectType) => FoundationObjectDefinition | undefined;
  LookupById: (objectId: string) => FoundationObjectDefinition | undefined;
  LookupVersion: (
    objectId: string,
    schemaVersion: string,
  ) => FoundationObjectDefinition | undefined;
  List: () => FoundationObjectDefinition[];
  ListVersions: (objectId: string) => FoundationObjectDefinition[];
  Diagnostics: () => FoundationObjectRegistryDiagnostics;
  Validate: () => FoundationObjectRegistryDiagnostics;
};
