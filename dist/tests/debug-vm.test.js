import { describe, it, expect } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
describe("Debug VM", () => {
    it("debug vm test", () => {
        const engine2 = new ObfuscatorEngine({
            seed: "vm-test",
            virtualization: true,
            stringProtection: false,
            constantProtection: false,
            expressionTransforms: false,
            deadCode: false,
            controlFlow: false,
        });
        const report = engine2.getReport('local score = 10; score = score + 5; print("Your total score is:", score)');
        console.log("validationPassed:", report.validationPassed);
        console.log("functionsVirtualized:", report.stats.functionsVirtualized);
        console.log("output:", report.output);
        console.log("warnings:", report.warnings);
        expect(true).toBe(true);
    });
});
