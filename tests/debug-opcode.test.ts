import { describe, it, expect } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";

describe("Debug VM opcode permutation", () => {
  it("shows VM-based output with randomized names", () => {
    const engine = new ObfuscatorEngine({
      seed: "opcode-perm-test",
      virtualization: true,
      stringProtection: true,
      constantProtection: false,
      expressionTransforms: false,
      deadCode: false,
      controlFlow: false,
    });

    const source = `print("Hello, world!")

local score = 10
score = score + 5
print(score)`;

    const report = engine.getReport(source);
    console.log("=== OBFUSCATED OUTPUT ===");
    console.log(report.output);
    console.log("\n=== WARNINGS ===");
    console.log(report.warnings);

    expect(report.validationPassed).toBe(true);

    expect(report.output).toContain("while true do");

    const protoMatch = report.output.match(/local (_ps\w+)\s*=\s*\{/);
    expect(protoMatch).toBeTruthy();
    if (protoMatch) {
      const protoName = protoMatch[1];
      expect(report.output).toContain(protoName);
    }
  });

  it("encodes operators as numeric codes instead of strings", () => {
    const engine = new ObfuscatorEngine({
      seed: "op-enc-test",
      vmProfile: "profileA",
      virtualization: true,
      stringProtection: true,
      constantProtection: false,
      expressionTransforms: false,
      deadCode: false,
      controlFlow: false,
    });

    const source = `local a = 1 + 2
local b = a - 3
print(b)`;

    const report = engine.getReport(source);

    expect(report.validationPassed).toBe(true);

    const binOpsMatch = report.output.match(/local (_bc\w+)\s*=\s*\{/);
    expect(binOpsMatch).toBeTruthy();
    if (binOpsMatch) {
      const binOpsName = binOpsMatch[1];
      expect(report.output).toContain(binOpsName);
    }

    expect(report.output).not.toContain('"+"');
    expect(report.output).not.toContain('"-"');
  });

  it("produces different operator encodings for different seeds", () => {
    const engine1 = new ObfuscatorEngine({
      seed: "op-enc-seed-1",
      vmProfile: "profileA",
      virtualization: true,
      stringProtection: true,
      constantProtection: false,
      expressionTransforms: false,
      deadCode: false,
      controlFlow: false,
    });

    const engine2 = new ObfuscatorEngine({
      seed: "op-enc-seed-2",
      vmProfile: "profileA",
      virtualization: true,
      stringProtection: true,
      constantProtection: false,
      expressionTransforms: false,
      deadCode: false,
      controlFlow: false,
    });

    const source = `local a = 1 + 2
print(a)`;

    const report1 = engine1.getReport(source);
    const report2 = engine2.getReport(source);

    const binOps1Match = report1.output.match(/local (_bc\w+)\s*=\s*\{/);
    const binOps2Match = report2.output.match(/local (_bc\w+)\s*=\s*\{/);

    expect(binOps1Match).toBeTruthy();
    expect(binOps2Match).toBeTruthy();
    expect(binOps1Match![1]).not.toBe(binOps2Match![1]);
  });
});
