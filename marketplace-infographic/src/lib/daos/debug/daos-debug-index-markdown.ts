import type { DAOSDebugIndex } from "./daos-debug-index";

function cell(value: string | number | undefined): string {
  if (value === undefined || value === "") return "—";
  return String(value).replace(/\|/g, "\\|");
}

/** Render markdown table of DAOS debug index entries. */
export function renderDaosDebugIndexMarkdown(index: DAOSDebugIndex): string {
  const lines = [
    "# DAOS Debug Reports Index",
    "",
    `Updated: ${index.updatedAt}`,
    `Entries: ${index.entries.length}`,
    "",
    "| createdAt | mode | summary | score | final gate | projectId | runId | bundle | summary | markdown |",
    "| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |",
  ];

  if (index.entries.length === 0) {
    lines.push("| — | — | — | — | — | — | — | — | — | — |");
  } else {
    for (const entry of index.entries) {
      lines.push(
        `| ${cell(entry.createdAt)} | ${cell(entry.generationMode)} | ${cell(entry.summaryStatus)} | ${cell(entry.summaryScore)} | ${cell(entry.finalGateStatus)} | ${cell(entry.projectId)} | ${cell(entry.runId)} | ${cell(entry.bundlePath)} | ${cell(entry.summaryPath)} | ${cell(entry.markdownPath)} |`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
