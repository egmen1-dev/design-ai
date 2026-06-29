/**
 * Chapter 3.17 — Mock LLM (deterministic agent test provider)
 */

export type MockLLMResponse = {
  text: string;
  confidence: number;
  tokens: number;
};

export class MockLLMProvider {
  private readonly responses: Map<string, MockLLMResponse> = new Map();
  private callCount = 0;

  register(promptKey: string, response: MockLLMResponse): void {
    this.responses.set(promptKey, response);
  }

  registerDefault(response: MockLLMResponse): void {
    this.responses.set("*", response);
  }

  async complete(prompt: string): Promise<MockLLMResponse> {
    this.callCount += 1;
    const key = prompt.trim().slice(0, 64);
    const hit = this.responses.get(key) ?? this.responses.get("*");
    if (!hit) {
      return {
        text: JSON.stringify({ deterministic: true, promptKey: key }),
        confidence: 80,
        tokens: 32,
      };
    }
    return { ...hit };
  }

  get calls(): number {
    return this.callCount;
  }

  reset(): void {
    this.callCount = 0;
  }
}

/** Same prompt + seed → same mock output */
export function deterministicMockKey(seed: number, agentId: string, inputHash: string): string {
  return `${seed}:${agentId}:${inputHash}`;
}
