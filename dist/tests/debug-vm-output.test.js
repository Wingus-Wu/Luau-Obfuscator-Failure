import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
describe("Debug VM Output", () => {
    it("debug hello world", () => {
        const engine = new ObfuscatorEngine({
            seed: "diff-hello-world-and-arithmetic",
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
        console.log("stats:", JSON.stringify(report.stats));
        console.log("output:", report.output);
        console.log("warnings:", report.warnings);
    });
});
