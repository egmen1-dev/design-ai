import {
  DEFAULT_STYLE,
  type InfographicStyle,
  TRENDS,
} from "./design-trends";
import { generateMockInfographicJson } from "./ollama-mock";
import {
  infographicResultSchema,
  type InfographicResult,
} from "./validations";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_URL ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";
const AI_MOCK_MODE =
  process.env.AI_MOCK_MODE === "true" || process.env.OLLAMA_MOCK === "true";

const SYSTEM_PROMPT = `You are an expert marketplace infographic designer.
Requirements:
- Return ONLY valid JSON, no markdown, no code fences.
- JSON shape: { "title": string, "subtitle": string, "bullets": string[], "colorScheme": "light"|"dark"|"gradient", "style": "glassmorphism"|"minimal"|"modern"|"neumorphism"|"brutalism"|"3d"|"retro"|"swiss", "colors"?: string[], "layout"?: "hero"|"cards"|"timeline"|"split"|"radial"|"comparison" }.
- title must be concise and under 60 characters.
- bullets must contain 1 to 5 short strings.
- Use a high-converting marketplace/ecommerce visual hierarchy.
- Respect the requested style when provided.`;

export type GenerateInfographicOptions = {
  prompt: string;
  style?: InfographicStyle;
  fewShotExamples?: string;
};

export async function generateInfographicJson({
  prompt,
  style,
  fewShotExamples,
}: GenerateInfographicOptions): Promise<InfographicResult> {
  const requestedStyle = style ?? DEFAULT_STYLE;

  if (AI_MOCK_MODE) {
    return generateMockInfographicJson(prompt, requestedStyle);
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: buildPrompt({ prompt, style: requestedStyle, fewShotExamples }),
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 1536,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { response?: string };
  const parsedJson = extractJson(data.response ?? "");
  const result = infographicResultSchema.safeParse(parsedJson);

  if (!result.success) {
    throw new Error(`Ollama returned invalid infographic JSON: ${result.error.message}`);
  }

  return result.data;
}

export function renderInfographicHtml(result: InfographicResult): string {
  const trend = TRENDS[result.style];
  const accent = result.colors?.[0] ?? trend.accent;
  const secondary = result.colors?.[1] ?? trend.foreground;
  const bulletCards = result.bullets
    .map(
      (bullet, index) => `
        <article class="card">
          <span class="number">${String(index + 1).padStart(2, "0")}</span>
          <p>${escapeHtml(bullet)}</p>
        </article>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1" />
  <style>
    :root {
      --bg: ${trend.background};
      --fg: ${trend.foreground};
      --accent: ${accent};
      --secondary: ${secondary};
      --border: ${trend.border};
      --shadow: ${trend.shadow};
      --font: ${trend.font};
    }
    * { box-sizing: border-box; }
    body {
      width: 1200px;
      min-height: 1600px;
      margin: 0;
      padding: 64px;
      font-family: var(--font);
      color: var(--fg);
      background: var(--bg);
      overflow: hidden;
    }
    .canvas {
      min-height: 1472px;
      padding: 64px;
      border: var(--border);
      box-shadow: var(--shadow);
      ${trend.css}
      position: relative;
    }
    .canvas::before {
      content: "";
      position: absolute;
      inset: 28px;
      border: 1px solid color-mix(in srgb, var(--accent), transparent 65%);
      pointer-events: none;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border: var(--border);
      color: var(--accent);
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      ${trend.css}
    }
    h1 {
      max-width: 920px;
      margin: 44px 0 24px;
      font-size: 82px;
      line-height: 0.96;
      letter-spacing: -0.065em;
    }
    .subtitle {
      max-width: 860px;
      margin: 0;
      color: color-mix(in srgb, var(--fg), transparent 20%);
      font-size: 30px;
      line-height: 1.34;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
      margin-top: 72px;
    }
    .card {
      min-height: 220px;
      padding: 32px;
      border: var(--border);
      box-shadow: var(--shadow);
      ${trend.css}
      background: color-mix(in srgb, var(--bg), white 12%);
    }
    .number {
      display: block;
      margin-bottom: 24px;
      color: var(--accent);
      font-size: 48px;
      font-weight: 900;
      line-height: 1;
    }
    .card p {
      margin: 0;
      font-size: 27px;
      font-weight: 700;
      line-height: 1.22;
    }
    .footer {
      position: absolute;
      left: 64px;
      right: 64px;
      bottom: 54px;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      color: color-mix(in srgb, var(--fg), transparent 35%);
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <main class="canvas">
    <div class="eyebrow">${escapeHtml(result.style)} / ${escapeHtml(result.colorScheme)}</div>
    <h1>${escapeHtml(result.title)}</h1>
    <p class="subtitle">${escapeHtml(result.subtitle)}</p>
    <section class="cards">${bulletCards}</section>
    <footer class="footer">
      <span>${escapeHtml(result.layout ?? "cards")}</span>
      <span>AI marketplace infographic</span>
    </footer>
  </main>
</body>
</html>`;
}

function buildPrompt({
  prompt,
  style,
  fewShotExamples,
}: Required<Pick<GenerateInfographicOptions, "prompt">> &
  Pick<GenerateInfographicOptions, "style" | "fewShotExamples">): string {
  const examples = fewShotExamples?.trim()
    ? `Approved examples for few-shot learning:\n${fewShotExamples.trim()}\n\n`
    : "";

  return `${examples}${SYSTEM_PROMPT}\n\nRequested style: ${style ?? DEFAULT_STYLE}\nUser description: "${prompt}"\n\nJSON:`;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Ollama response did not contain JSON");
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
