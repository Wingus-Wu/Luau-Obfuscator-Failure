import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";

function showOutput(profile: string, source: string) {
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
  console.log(`\n===== ${profile} =====`);
  console.log(report.output);
}

describe("show outputs", () => {
  it("profileA-simple", () => {
    showOutput("profileA", `local score = 10\nscore = score + 5\nprint(score)`);
  });
  it("profileB-simple", () => {
    showOutput("profileB", `local score = 10\nscore = score + 5\nprint(score)`);
  });
  it("profileC-simple", () => {
    showOutput("profileC", `local score = 10\nscore = score + 5\nprint(score)`);
  });
  it("profileD-simple", () => {
    showOutput("profileD", `local score = 10\nscore = score + 5\nprint(score)`);
  });
  it("profileE-simple", () => {
    showOutput("profileE", `local score = 10\nscore = score + 5\nprint(score)`);
  });
});
