import { ObfuscatorEngine } from "../src/obfuscator.js";
import fs from "fs";

function genOutput(profile: string, seed: string, source: string): string {
  const engine = new ObfuscatorEngine({
    seed: seed,
    vmProfile: profile,
    virtualization: true,
    stringProtection: true,
    constantProtection: false,
    expressionTransforms: false,
    deadCode: false,
    controlFlow: false,
  });
  const report = engine.getReport(source);
  return report.output;
}

const helloSrc = `print("Hello, world!")\nlocal score = 10\nscore = score + 5\nprint(score)`;
fs.writeFileSync("diag-A-hello.txt", genOutput("profileA", "test-profileA", helloSrc));
fs.writeFileSync("diag-B-hello.txt", genOutput("profileB", "test-profileB", helloSrc));
fs.writeFileSync("diag-D-hello.txt", genOutput("profileD", "test-profileD", helloSrc));
fs.writeFileSync("diag-C-hello.txt", genOutput("profileC", "test-profileC", helloSrc));
console.log("done");
