import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
import { Parser } from "../src/parser/index.js";
const parser = new Parser();
describe("debug parser", () => {
    it("captures parse error", () => {
        const engine = new ObfuscatorEngine({
            seed: "vm-test",
            virtualization: true,
            stringProtection: false,
            constantProtection: false,
            expressionTransforms: false,
            deadCode: false,
            controlFlow: false,
        });
        const source = 'local score = 10; score = score + 5; print("Your total score is:", score)';
        const report = engine.getReport(source);
        console.log("validationPassed:", report.validationPassed);
        console.log("Warnings:", JSON.stringify(report.warnings));
        if (!report.validationPassed) {
            try {
                parser.parse(report.output);
            }
            catch (e) {
                console.log("Parse error message:", e.message);
                console.log("Parse error line:", e.line);
                console.log("Parse error column:", e.column);
                console.log("Parse error token:", e.token);
            }
        }
    });
});
