import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
describe("Debug addition assignment", () => {
    it("debug addition assignment", () => {
        const source = `
      local score = 10
      score = score + 5
      print("Your total score is:", score)
    `;
        const engine2 = new ObfuscatorEngine({ seed: "TTTTEEEE" });
        const report = engine2.getReport(source);
        console.log("validationPassed:", report.validationPassed);
        console.log("warnings:", report.warnings);
        console.log("output:", report.output);
        console.log("stats:", JSON.stringify(report.stats));
    });
});
