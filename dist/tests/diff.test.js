import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
describe("Differential Testing", () => {
    it("reproduces the VM crash case", () => {
        const engine = new ObfuscatorEngine({
            seed: "vm-crash-test",
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
        console.log("=== SOURCE ===");
        console.log(source);
        console.log("\n=== OBFUSCATED OUTPUT ===");
        console.log(report.output);
        console.log("\n=== VALIDATION ===");
        console.log("passed:", report.validationPassed);
        console.log("warnings:", report.warnings);
        console.log("stats:", JSON.stringify(report.stats));
    });
});
