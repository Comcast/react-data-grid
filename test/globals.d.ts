declare global {
  interface ImportMeta {
    readonly env: {
      readonly CI: boolean;
    };
  }
}

declare module 'vite-plus/test/browser' {
  interface BrowserCommands {
    dragFill: (from: string, to: string) => Promise<void>;
    resizeColumn: (name: string, resizeBy: number | readonly number[]) => Promise<void>;
  }
}

// required to make types work
export {};
