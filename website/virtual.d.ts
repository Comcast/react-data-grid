declare module 'virtual:client-import-map' {
  // the client build's import map, see the `client-import-map` plugin in `vite.config.ts`
  const importMap: string | undefined;
  export default importMap;
}
