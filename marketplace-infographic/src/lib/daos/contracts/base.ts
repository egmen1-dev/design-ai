export type DAOSStatus =
  | "draft"
  | "ready"
  | "validated"
  | "rejected"
  | "failed";

export type DAOSConfidence = {
  score: number;
  reason?: string;
};

export type DAOSDecisionTraceItem = {
  id: string;
  source: string;
  decision: string;
  reason: string;
  confidence: number;
  evidence?: string[];
  createdAt: string;
};

export type DAOSBaseSpecification = {
  id: string;
  projectId: string;
  version: number;
  status: DAOSStatus;
  createdAt: string;
  updatedAt: string;
  source: string;
  confidence?: DAOSConfidence;
  decisionTrace: DAOSDecisionTraceItem[];
};
