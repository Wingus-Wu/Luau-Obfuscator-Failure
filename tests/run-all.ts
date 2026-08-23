import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const testDir = path.resolve("tests");
const testFiles = fs.readdirSync(testDir).filter((f: string) => f.endsWith(".test.ts"));

console.log("Running Luau Obfuscator Tests\n");

let passed = 0;
let failed = 0;

for (const file of testFiles) {
  console.log(`Running ${file}...`);
  try {
    execSync(`npx vitest run ${path.join(testDir, file)} --reporter=verbose`, {
      stdio: "inherit",
      cwd: process.cwd(),
      env: { ...process.env, NODE_OPTIONS: "--loader ts-node/esm" },
    });
    passed++;
  } catch (e) {
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
