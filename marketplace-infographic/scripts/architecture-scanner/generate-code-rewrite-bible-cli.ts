#!/usr/bin/env npx tsx
import { join } from "node:path";
import { writeCodeRewriteBible } from "./generate-code-rewrite-bible";
import { scanRepository } from "./scan-repository";

const OUTPUT_PATH = join(__dirname, "../../../docs/Code_Rewrite_Bible.md");

const result = scanRepository();
writeCodeRewriteBible(result, OUTPUT_PATH);
