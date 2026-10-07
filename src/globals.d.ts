declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }

  // TODO: remove once in React types
  interface ButtonHTMLAttributes<T> extends React.HTMLAttributes<T> {
    command?: string;
    commandfor?: string;
  }
}

// required to make types work
export {};
