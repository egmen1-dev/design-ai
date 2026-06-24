const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

const SYSTEM_PROMPT = `You are an expert infographic designer. Generate a complete, self-contained HTML document for a professional infographic.
Requirements:
- Return ONLY valid HTML starting with <!DOCTYPE html>
- Use inline CSS only (no external stylesheets)
- Canvas size: 1200x1600px
- Modern, clean design with clear hierarchy
- Use a cohesive color palette
- Include data visualization elements where appropriate`;

export async function generateInfographicHtml(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: `${SYSTEM_PROMPT}\n\nUser request: ${prompt}\n\nHTML:`,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 4096,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { response?: string };
  let html = data.response?.trim() ?? "";

  const docStart = html.indexOf("<!DOCTYPE");
  const htmlStart = html.indexOf("<html");
  const start = docStart >= 0 ? docStart : htmlStart;

  if (start > 0) {
    html = html.slice(start);
  }

  if (!html.includes("</html>")) {
    html = wrapFallbackHtml(prompt, html);
  }

  return html;
}

function wrapFallbackHtml(prompt: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 1600px;
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: #f8fafc; padding: 48px;
      display: flex; flex-direction: column; gap: 32px;
    }
    h1 { font-size: 48px; line-height: 1.1; }
    .content { font-size: 20px; line-height: 1.6; opacity: 0.9; white-space: pre-wrap; }
    .badge {
      display: inline-block; background: #0ea5e9; color: white;
      padding: 8px 16px; border-radius: 999px; font-size: 14px;
    }
  </style>
</head>
<body>
  <span class="badge">AI Infographic</span>
  <h1>${escapeHtml(prompt.slice(0, 80))}</h1>
  <div class="content">${escapeHtml(content || "Generated infographic content")}</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
