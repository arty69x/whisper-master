export type OllamaResponse = { response: string };

export class OllamaClient {
  private readonly endpoint = "http://localhost:11434/api/generate";

  async generate(model: string, prompt: string): Promise<string> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false })
      });
      if (!response.ok) return `fallback:${prompt.slice(0, 80)}`;
      const data = (await response.json()) as Partial<OllamaResponse>;
      return typeof data.response === "string" ? data.response : `fallback:${prompt.slice(0, 80)}`;
    } catch {
      return `fallback:${prompt.slice(0, 80)}`;
    }
  }
}
