import { ObfuscatorEngine } from "../src/obfuscator.js";
import fs from "fs";

function showOutput(profile: string, source: string): string {
  const engine = new ObfuscatorEngine({
    seed: "diag-" + profile,
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

const source = `local score = 10\nscore = score + 5\nprint(score)`;
fs.writeFileSync("output-profileA.txt", showOutput("profileA", source));
fs.writeFileSync("output-profileB.txt", showOutput("profileB", source));
fs.writeFileSync("output-profileC.txt", showOutput("profileC", source));
fs.writeFileSync("output-profileD.txt", showOutput("profileD", source));
console.log("done");
