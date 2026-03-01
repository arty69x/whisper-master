import { OllamaClient } from "../services/OllamaClient";

export abstract class BaseAgent<TInput, TOutput> {
  protected readonly ollama = new OllamaClient();
  abstract name: string;
  abstract run(input: TInput): Promise<TOutput>;
}
