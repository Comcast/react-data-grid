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
    emulateMedia: (options: {
      colorScheme: 'light' | 'dark';
      forcedColors: 'active' | 'none';
    }) => Promise<void>;
    resizeColumn: (name: string, resizeBy: number | readonly number[]) => Promise<void>;
  }
}

// required to make types work
export {};
