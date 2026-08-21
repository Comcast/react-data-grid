declare module 'react' {
  interface CSSProperties {
    // oxlint-disable-next-line typescript/consistent-indexed-object-style
    [key: `--${string}`]: string | number | undefined;
  }
}

// required to make types work
export {};
