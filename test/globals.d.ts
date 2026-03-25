declare global {
  interface ImportMeta {
    readonly env: {
      readonly CI: boolean;
    };
  }
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    dragFill: (from: string, to: string) => Promise<void>;
    resizeColumn: (name: string, resizeBy: number | readonly number[]) => Promise<void>;
  }
}

// somehow required to make types work
export {};
