/**
 * Postinstall patch for Next.js 16.x
 *
 * Fixes: "The router state header was sent but could not be parsed" (500)
 *
 * Some browser automation tools send a malformed Next-Router-State-Tree
 * header during client-side navigation. Next.js throws a 500 error instead
 * of falling back to a full page render. This patch changes the throw to
 * return undefined, which makes Next.js treat it as a fresh page load.
 */
const fs = require("fs");
const path = require("path");

const files = [
  "dist/server/app-render/parse-and-validate-flight-router-state.js",
  "dist/compiled/next-server/app-page.runtime.prod.js",
  "dist/compiled/next-server/app-page.runtime.dev.js",
  "dist/compiled/next-server/app-page-turbo.runtime.prod.js",
  "dist/compiled/next-server/app-page-turbo.runtime.dev.js",
  "dist/compiled/next-server/app-page-turbo-experimental.runtime.prod.js",
  "dist/compiled/next-server/app-page-turbo-experimental.runtime.dev.js",
  "dist/compiled/next-server/app-page-experimental.runtime.prod.js",
  "dist/compiled/next-server/app-page-experimental.runtime.dev.js",
];

const nextDir = path.join(__dirname, "..", "node_modules", "next");
let patched = 0;

// Patterns to find and replace (compiled uses Error(), source uses new Error())
const patterns = [
  // Compiled/minified bundles
  {
    find: 'throw Object.defineProperty(Error("The router state header was sent but could not be parsed.")',
    replace: 'return void 0;void Object.defineProperty(Error("patched")',
  },
  // Source files
  {
    find: "throw Object.defineProperty(new Error('The router state header was sent but could not be parsed.')",
    replace: "return undefined;void Object.defineProperty(new Error('patched')",
  },
];

for (const file of files) {
  const filePath = path.join(nextDir, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  for (const { find, replace } of patterns) {
    if (content.includes(find)) {
      content = content.split(find).join(replace);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    patched++;
  }
}

console.log(`patch-next: patched ${patched} file(s)`);
