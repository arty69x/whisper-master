export abstract class BaseAgent<TInput, TOutput> {
  public abstract run(input: TInput): TOutput | Promise<TOutput>;
}
