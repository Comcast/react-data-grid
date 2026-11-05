declare global {
  interface ImportMeta {
    readonly env: {
      readonly CI: boolean;
    };
  }
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateMedia: (options: {
      colorScheme: 'light' | 'dark';
      forcedColors: 'active' | 'none';
    }) => Promise<void>;
  }
}

// required to make types work
export {};
