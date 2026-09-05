import { build } from "esbuild";
const client = await build({ entryPoints: ["src/client.ts"], bundle: true, write: false, format: "iife", target: "es2020" });
await build({ entryPoints: ["src/index.ts"], bundle: true, platform: "node", format: "esm", target: "node22", packages: "external", loader: { ".css": "text" }, define: { __GRID_CLIENT__: JSON.stringify(client.outputFiles[0].text) }, outfile: "dist/index.js" });
