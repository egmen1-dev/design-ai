/**
 * Chapter 3.12 — Serialization engine
 */
import { createHash } from "crypto";
import { gzipSync, gunzipSync } from "zlib";
import type { RenderBlueprint } from "./types";
import { RENDER_BLUEPRINT_VERSION } from "./types";
import { canonicalStringify, canonicalize } from "./canonical-json";
import { migrateBlueprint, extractUnknownBlueprintFields } from "./blueprint-migration";
import {
  COMPRESSION_THRESHOLD_BYTES,
  SERIALIZATION_SCHEMA_VERSION,
  type DeserializeOptions,
  type SerializableBlueprint,
  type SerializationValidationIssue,
  type SerializationValidationResult,
  type SerializeOptions,
  type SerializedPayload,
} from "./serialization-types";

export {
  SERIALIZATION_SCHEMA_VERSION,
  COMPRESSION_THRESHOLD_BYTES,
  type SerializableBlueprint,
  type SerializationMetadata,
  type SerializationFormat,
  type SerializationValidationIssue,
  type SerializationValidationResult,
  type SerializeOptions,
  type DeserializeOptions,
  type SerializedPayload,
  type ImageReference,
} from "./serialization-types";

export { canonicalStringify, canonicalize, canonicalParse } from "./canonical-json";
export { migrateBlueprint, extractUnknownBlueprintFields } from "./blueprint-migration";

export class SerializationError extends Error {
  readonly issues: SerializationValidationIssue[];

  constructor(message: string, issues: SerializationValidationIssue[] = []) {
    super(message);
    this.name = "SerializationError";
    this.issues = issues;
  }
}

const SECRET_KEY_PATTERN =
  /^(api[_-]?key|token|secret|password|authorization|credential|bearer)$/i;

const BINARY_PATTERNS = [
  /^data:image\//i,
  /^data:application\/octet-stream/i,
  /^[A-Za-z0-9+/]{500,}={0,2}$/,
];

const PROMPT_STORED_PATTERN = /"compiledPrompt"|"mergedPrompt"|"backgroundPrompt"/i;

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function collectIssues(
  value: unknown,
  path = "",
  issues: SerializationValidationIssue[] = [],
  seen = new WeakSet<object>(),
): SerializationValidationIssue[] {
  if (value === null || value === undefined) return issues;
  const t = typeof value;
  if (t === "function") {
    issues.push({ code: "CONTAINS_FUNCTION", message: `Function at ${path || "root"}` });
    return issues;
  }
  if (t !== "object") {
    if (typeof value === "string") {
      if (value.length > 512_000) {
        issues.push({ code: "BINARY_DATA", message: `Oversized string at ${path}` });
      }
      for (const pat of BINARY_PATTERNS) {
        if (pat.test(value)) {
          issues.push({ code: "BINARY_DATA", message: `Binary-like data at ${path}` });
          break;
        }
      }
    }
    return issues;
  }

  if (seen.has(value as object)) {
    issues.push({ code: "CYCLIC_REFERENCE", message: `Cycle at ${path}` });
    return issues;
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    value.forEach((item, i) => collectIssues(item, `${path}[${i}]`, issues, seen));
    return issues;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      issues.push({ code: "SECRET_FIELD", message: `Secret field: ${path}.${key}` });
    }
    if (/^(prompt|compiledPrompt|mergedPrompt|backgroundPrompt|negativePrompt)$/i.test(key)) {
      issues.push({ code: "PROMPT_STORED", message: `Prompt field: ${path}.${key}` });
    }
    collectIssues(child, path ? `${path}.${key}` : key, issues, seen);
  }
  return issues;
}

export function validateSerializable(value: unknown): SerializationValidationResult {
  const issues = collectIssues(value);
  if (issues.length === 0) {
    try {
      const serialized = canonicalStringify(value);
      if (PROMPT_STORED_PATTERN.test(serialized)) {
        issues.push({ code: "PROMPT_STORED", message: "Prompt strings must not be stored in blueprint" });
      }
    } catch {
      issues.push({ code: "CONTAINS_FUNCTION", message: "Value is not JSON-serializable" });
    }
  }
  return { ok: issues.length === 0, issues };
}

export function computeBlueprintChecksum(blueprint: RenderBlueprint): string {
  return sha256(canonicalStringify(blueprint));
}

export function serializeBlueprint(
  blueprint: RenderBlueprint,
  options: SerializeOptions = {},
): SerializedPayload {
  const { blueprint: cleanBlueprint, unknownFields: extractedUnknown } =
    extractUnknownBlueprintFields(blueprint as unknown as Record<string, unknown>);
  const unknownFields = {
    ...extractedUnknown,
    ...(options.includeUnknown ?? {}),
  };
  const body = cleanBlueprint as RenderBlueprint;

  const validation = validateSerializable(body);
  if (!validation.ok) {
    throw new SerializationError(
      `Serialization validation failed: ${validation.issues.map((i) => i.message).join("; ")}`,
      validation.issues,
    );
  }

  const format = options.format ?? "json";
  const canonicalBody = canonicalStringify(body);
  const checksum = sha256(canonicalBody);
  const now = Date.now();

  const envelope: SerializableBlueprint = {
    schemaVersion: SERIALIZATION_SCHEMA_VERSION,
    version: body.meta.version ?? RENDER_BLUEPRINT_VERSION,
    blueprint: body,
    checksum,
    metadata: {
      serializedAt: now,
      format,
      compressed: false,
      byteLength: Buffer.byteLength(canonicalBody, "utf8"),
      schemaVersion: SERIALIZATION_SCHEMA_VERSION,
    },
    ...(Object.keys(unknownFields).length > 0 ? { unknownFields } : {}),
  };

  const json = canonicalStringify(envelope);
  let compressed: Buffer | undefined;
  let metadata = { ...envelope.metadata, byteLength: Buffer.byteLength(json, "utf8") };

  const shouldCompress =
    options.compress !== false && metadata.byteLength > COMPRESSION_THRESHOLD_BYTES;
  if (shouldCompress) {
    compressed = gzipSync(Buffer.from(json, "utf8"));
    metadata = {
      ...metadata,
      compressed: true,
      compression: "gzip",
      byteLength: compressed.length,
    };
    envelope.metadata = metadata;
  }

  return { envelope, json, compressed, metadata };
}

export function deserializeBlueprint(
  input: string | Buffer | SerializableBlueprint,
  options: DeserializeOptions = {},
): { blueprint: RenderBlueprint; envelope: SerializableBlueprint; unknownFields: Record<string, unknown> } {
  const verifyChecksum = options.verifyChecksum !== false;
  const doMigrate = options.migrate !== false;

  let parsed: SerializableBlueprint;

  if (typeof input === "object" && !Buffer.isBuffer(input) && "blueprint" in input) {
    parsed = input;
  } else {
    let json: string;
    try {
      if (Buffer.isBuffer(input)) {
        json = gunzipSync(input).toString("utf8");
      } else if (input.startsWith("{")) {
        json = input;
      } else {
        json = gunzipSync(Buffer.from(input, "base64")).toString("utf8");
      }
    } catch {
      throw new SerializationError("Invalid JSON or compression format", [
        { code: "INVALID_JSON", message: "Could not parse input" },
      ]);
    }

    try {
      parsed = JSON.parse(json) as SerializableBlueprint;
    } catch {
      throw new SerializationError("Invalid JSON", [{ code: "INVALID_JSON", message: "JSON parse failed" }]);
    }
  }

  if (!parsed.version && !parsed.blueprint?.meta?.version) {
    throw new SerializationError("Missing version", [
      { code: "MISSING_VERSION", message: "version field required" },
    ]);
  }
  if (!parsed.checksum) {
    throw new SerializationError("Missing checksum", [
      { code: "MISSING_CHECKSUM", message: "checksum field required" },
    ]);
  }

  if (verifyChecksum) {
    const expected = sha256(canonicalStringify(parsed.blueprint));
    if (expected !== parsed.checksum) {
      throw new SerializationError("Checksum mismatch", [
        { code: "CHECKSUM_MISMATCH", message: "Blueprint checksum does not match payload" },
      ]);
    }
  }

  let blueprint = parsed.blueprint;
  let unknownFields = parsed.unknownFields ?? {};

  if (doMigrate) {
    const migrated = migrateBlueprint(
      blueprint as unknown as Record<string, unknown>,
      unknownFields,
    );
    blueprint = migrated.blueprint;
    unknownFields = migrated.unknownFields;
  }

  const validation = validateSerializable(blueprint);
  if (!validation.ok) {
    throw new SerializationError(
      `Deserialized blueprint invalid: ${validation.issues.map((i) => i.message).join("; ")}`,
      validation.issues,
    );
  }

  const merged = { ...blueprint, ...unknownFields } as RenderBlueprint;
  return { blueprint: merged, envelope: parsed, unknownFields };
}

export function exportBlueprintToJson(blueprint: RenderBlueprint, options?: SerializeOptions): string {
  return serializeBlueprint(blueprint, options).json;
}

export function importBlueprintFromJson(
  json: string,
  options?: DeserializeOptions,
): RenderBlueprint {
  return deserializeBlueprint(json, options).blueprint;
}

/** Round-trip fidelity check */
export function assertSerializationRoundTrip(blueprint: RenderBlueprint): RenderBlueprint {
  const { json } = serializeBlueprint(blueprint);
  const { blueprint: restored } = deserializeBlueprint(json);
  const a = canonicalStringify(blueprint);
  const b = canonicalStringify(restored);
  if (a !== b) {
    throw new SerializationError("Round-trip canonical JSON mismatch", [
      { code: "CHECKSUM_MISMATCH", message: "Restored blueprint differs from original" },
    ]);
  }
  return restored;
}
