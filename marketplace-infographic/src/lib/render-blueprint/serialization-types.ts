/**
 * Chapter 3.12 — Serialization types
 */
import type { RenderBlueprint } from "./types";

export const SERIALIZATION_SCHEMA_VERSION = 1;
export const COMPRESSION_THRESHOLD_BYTES = 256 * 1024;

export type SerializationFormat = "json" | "messagepack";

export type SerializationMetadata = {
  serializedAt: number;
  format: SerializationFormat;
  compressed: boolean;
  compression?: "gzip";
  byteLength: number;
  schemaVersion: number;
};

/** Wire format — pure JSON envelope, no functions or classes */
export type SerializableBlueprint = {
  schemaVersion: number;
  /** Blueprint data schema version (meta.version) */
  version: number;
  blueprint: RenderBlueprint;
  checksum: string;
  metadata: SerializationMetadata;
  /** Preserved unknown fields for forward compatibility */
  unknownFields?: Record<string, unknown>;
};

export type ImageReference = {
  uri: string;
  mimeType?: string;
  width?: number;
  height?: number;
};

export type SerializationValidationIssue = {
  code:
    | "INVALID_JSON"
    | "MISSING_VERSION"
    | "MISSING_CHECKSUM"
    | "CHECKSUM_MISMATCH"
    | "CONTAINS_FUNCTION"
    | "CYCLIC_REFERENCE"
    | "BINARY_DATA"
    | "SECRET_FIELD"
    | "PROMPT_STORED";
  message: string;
};

export type SerializationValidationResult = {
  ok: boolean;
  issues: SerializationValidationIssue[];
};

export type SerializeOptions = {
  format?: SerializationFormat;
  compress?: boolean;
  includeUnknown?: Record<string, unknown>;
};

export type DeserializeOptions = {
  verifyChecksum?: boolean;
  migrate?: boolean;
};

export type SerializedPayload = {
  envelope: SerializableBlueprint;
  json: string;
  compressed?: Buffer;
  metadata: SerializationMetadata;
};
