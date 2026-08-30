const fs = require("fs");

const checks = [
  ["package.json", fs.existsSync("package.json")],
  ["next.config.ts", fs.existsSync("next.config.ts")],
  ["app/page.tsx", fs.existsSync("app/page.tsx")],
  ["app/api/live/route.ts", fs.existsSync("app/api/live/route.ts")],
  ["app/api/match/route.ts", fs.existsSync("app/api/match/route.ts")],
  ["app/api/league/route.ts", fs.existsSync("app/api/league/route.ts")],
  ["app/api/team/route.ts", fs.existsSync("app/api/team/route.ts")],
  ["public/sw.js", fs.existsSync("public/sw.js")],
  ["public/icon-192.svg", fs.existsSync("public/icon-192.svg")],
  ["public/icon-512.svg", fs.existsSync("public/icon-512.svg")]
];

let failed = false;

for (const [name, ok] of checks) {
  if (ok) {
    console.log(`✓ ${name}`);
  } else {
    console.log(`✗ ${name}`);
    failed = true;
  }
}

if (failed) {
  console.error("\nDeployment preflight failed.");
  process.exit(1);
}

console.log("\n✓ Deployment preflight passed.");
