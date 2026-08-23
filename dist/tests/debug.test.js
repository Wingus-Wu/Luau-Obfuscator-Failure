import { describe, it, expect } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
describe("Debug String Protection", () => {
    it("debug string protection", () => {
        const engine = new ObfuscatorEngine({ seed: "test-seed" });
        const result = engine.obfuscate('local s = "hello world";');
        console.log("stats:", JSON.stringify(result.stats));
        console.log("skipped:", JSON.stringify(result.skippedTransforms));
        console.log("warnings:", JSON.stringify(result.warnings));
        const output = engine.generator.generate(result.program);
        console.log("output:", output);
        // Check that the output is valid
        expect(output).not.toContain('"hello world"');
    });
});
