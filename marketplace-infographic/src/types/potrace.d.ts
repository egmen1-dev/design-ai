declare module "potrace" {
  export function trace(
    input: string | Buffer,
    options?: Record<string, unknown>,
    callback?: (error: Error | null, svg: string) => void,
  ): void;

  export class Potrace {
    setParameters(options: Record<string, unknown>): void;
    loadImage(
      input: string | Buffer,
      callback: (error: Error | null) => void,
    ): void;
    getSVG(): string;
  }
}
