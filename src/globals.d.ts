declare module 'react' {
  interface CSSProperties {
    // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
    [key: `--${string}`]: string | number | undefined;
  }
}

// required to make types work
export {};
