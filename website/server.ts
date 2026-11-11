import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import importMap from 'virtual:client-import-map';

const importMapScript =
  importMap === undefined ? undefined : `<script type="importmap">${importMap}</script>`;

// the browser must read the import map before it starts loading modules
const firstModuleRE = /<link [^>]*rel="modulepreload"|<script [^>]*type="module"/;

export default createServerEntry({
  async fetch(request, opts) {
    const response = await handler.fetch(request, opts);
    if (
      importMapScript === undefined ||
      response.headers.get('content-type')?.startsWith('text/html') !== true
    ) {
      return response;
    }

    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(
      html.replace(firstModuleRE, (tag) => importMapScript + tag),
      {
        status: response.status,
        statusText: response.statusText,
        headers
      }
    );
  }
});
