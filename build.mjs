import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const client = await build({ entryPoints: [join(root, "src/client.ts")], bundle: true, write: false, format: "iife", target: "es2020" });
await build({ entryPoints: [join(root, "src/index.ts")], bundle: true, platform: "node", format: "esm", target: "node22", packages: "external", loader: { ".css": "text" }, define: { __GRID_CLIENT__: JSON.stringify(client.outputFiles[0].text) }, outfile: join(root, "dist/index.js") });
