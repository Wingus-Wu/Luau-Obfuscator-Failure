import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
describe("Debug Differential", () => {
    it("debug table property access", () => {
        const engine = new ObfuscatorEngine({
            seed: "diff-table",
            virtualization: true,
            stringProtection: true,
            constantProtection: false,
            expressionTransforms: false,
            deadCode: false,
            controlFlow: false,
        });
        const source = `local t = {value = 123}
print(t.value)`;
        const report = engine.getReport(source);
        console.log("validationPassed:", report.validationPassed);
        console.log("warnings:", report.warnings);
        console.log("output:", report.output);
    });
});
