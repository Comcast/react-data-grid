declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

// somehow required to make types work
export {};
