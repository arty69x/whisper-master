declare module "node:fs" {
  export const promises: {
    readdir(path: string, options?: { withFileTypes?: boolean }): Promise<Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
    writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    copyFile(src: string, dest: string): Promise<void>;
    access(path: string): Promise<void>;
    lstat(path: string): Promise<{ isSymbolicLink(): boolean }>;
  };
}

declare module "node:path" {
  const path: {
    join: (...parts: string[]) => string;
    dirname: (path: string) => string;
    basename: (path: string) => string;
    isAbsolute: (path: string) => boolean;
  };
  export = path;
}

declare module "node:crypto" {
  export function createHash(algorithm: string): {
    update(data: Uint8Array): { digest(encoding: "hex"): string };
  };
}

declare const process: { cwd(): string; env: Record<string, string | undefined>; stdout: { write(chunk: string): void }; stderr: { write(chunk: string): void } };
declare const Buffer: { from(input: string, encoding: "utf8"): Uint8Array };
