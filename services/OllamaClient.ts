export class OllamaClient {
  public async complete(prompt: string): Promise<string> {
    return Promise.resolve(`deterministic:${prompt}`);
  }
}
