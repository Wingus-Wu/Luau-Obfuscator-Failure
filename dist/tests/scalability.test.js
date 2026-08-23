import { describe, it, expect } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
import { Parser } from "../src/parser/index.js";
function generateLuauScript(targetSizeBytes) {
    const parts = [
        "-- Scalability Benchmark Script",
        "local Players = game:GetService(\"Players\")",
        "local RunService = game:GetService(\"RunService\")",
        "local config = { speed = 16, jumpPower = 50, debug = false }",
        "local stats = { coins = 0, level = 1, experience = 100 }",
    ];
    let counter = 0;
    let currentSize = parts.join("\n").length;
    while (currentSize < targetSizeBytes) {
        const i = counter++;
        const funcDecl = `local function processEntity_${i}(entity, factor)
  local baseScore = (entity.score or 10) * factor + ${i % 100}
  if baseScore > 50 then
    baseScore = baseScore * 2
  else
    baseScore = baseScore + 1
  end
  local result = {
    id = ${i},
    name = "Entity_" .. tostring(${i}),
    active = true,
    score = baseScore,
  }
  for step = 1, 3 do
    result.score = result.score + step
  end
  return result
end`;
        const callSite = `local item_${i} = processEntity_${i}({ score = ${i * 3 + 7} }, 1.5)`;
        parts.push(funcDecl);
        parts.push(callSite);
        currentSize += funcDecl.length + callSite.length + 2;
    }
    return parts.join("\n");
}
describe("Large-Input Scalability Benchmarks", () => {
    const parser = new Parser();
    it("transforms 100 KB input within limits", { timeout: 30000 }, () => {
        const source = generateLuauScript(100 * 1024);
        const inputSize = Buffer.byteLength(source, "utf8");
        expect(inputSize).toBeGreaterThanOrEqual(100 * 1024);
        const startTime = performance.now();
        const engine = new ObfuscatorEngine({ seed: "scale-100kb" });
        const report = engine.getReport(source);
        const duration = performance.now() - startTime;
        console.log(`[100 KB] In: ${report.inputSize} bytes | Out: ${report.outputSize} bytes | Ratio: ${(report.outputSize / report.inputSize).toFixed(2)}x | Time: ${duration.toFixed(2)}ms`);
        expect(report.warnings.length).toBe(0);
        expect(report.outputSize).toBeLessThan(report.inputSize * 4);
        expect(() => parser.parse(report.output)).not.toThrow();
    });
    it("transforms 500 KB input within limits", { timeout: 60000 }, () => {
        const source = generateLuauScript(500 * 1024);
        const inputSize = Buffer.byteLength(source, "utf8");
        expect(inputSize).toBeGreaterThanOrEqual(500 * 1024);
        const startTime = performance.now();
        const engine = new ObfuscatorEngine({ seed: "scale-500kb" });
        const report = engine.getReport(source);
        const duration = performance.now() - startTime;
        console.log(`[500 KB] In: ${report.inputSize} bytes | Out: ${report.outputSize} bytes | Ratio: ${(report.outputSize / report.inputSize).toFixed(2)}x | Time: ${duration.toFixed(2)}ms`);
        expect(report.warnings.length).toBe(0);
        expect(report.outputSize).toBeLessThan(report.inputSize * 4);
        expect(() => parser.parse(report.output)).not.toThrow();
    });
    it("transforms 1 MB input without stack overflow or exponential bloat", { timeout: 120000 }, () => {
        const source = generateLuauScript(1024 * 1024);
        const inputSize = Buffer.byteLength(source, "utf8");
        expect(inputSize).toBeGreaterThanOrEqual(1024 * 1024);
        const startTime = performance.now();
        const engine = new ObfuscatorEngine({ seed: "scale-1mb" });
        const report = engine.getReport(source);
        const duration = performance.now() - startTime;
        console.log(`[1 MB] In: ${report.inputSize} bytes | Out: ${report.outputSize} bytes | Ratio: ${(report.outputSize / report.inputSize).toFixed(2)}x | Time: ${duration.toFixed(2)}ms`);
        expect(report.warnings.length).toBe(0);
        expect(report.outputSize).toBeLessThan(report.inputSize * 4);
        expect(() => parser.parse(report.output)).not.toThrow();
    });
    it("handles deeply nested expressions without stack overflow", { timeout: 30000 }, () => {
        const depth = 5000;
        let source = "print(";
        for (let i = 0; i < depth; i++) {
            source += "1 + (";
        }
        source += "42";
        for (let i = 0; i < depth; i++) {
            source += ")";
        }
        source += ")\n";
        const engine = new ObfuscatorEngine({ seed: "deep-nest", virtualization: true });
        const report = engine.getReport(source);
        expect(report.warnings.length).toBe(0);
        expect(() => parser.parse(report.output)).not.toThrow();
    });
    it("handles while true do loops without stack overflow", { timeout: 30000 }, () => {
        let source = "local i = 0\nwhile true do\n";
        for (let k = 0; k < 1000; k++) {
            source += `  i = i + 1\n  if i >= ${k + 1} then break end\n`;
        }
        source += "end\nprint(i)\n";
        const engine = new ObfuscatorEngine({ seed: "while-true", virtualization: true });
        const report = engine.getReport(source);
        expect(report.warnings.length).toBe(0);
        expect(() => parser.parse(report.output)).not.toThrow();
    });
    it("produces XOR LUT with exactly 256 entries", { timeout: 30000 }, () => {
        const source = `
local s = "Hello, obfuscated world!"
print(s)
`;
        const engine = new ObfuscatorEngine({ seed: "xor-lut-256", stringProtection: true, virtualization: true });
        const report = engine.getReport(source);
        const lutMatch = report.output.match(/for _i=0,255 do \w+\[_i\]=bit32\.bxor/);
        expect(lutMatch).not.toBeNull();
        const forLoopMatch = report.output.match(/for _i=0,(\d+) do \w+\[_i\]=bit32\.bxor/);
        expect(forLoopMatch).not.toBeNull();
        expect(Number(forLoopMatch[1])).toBe(255);
        const lutDeclMatch = report.output.match(new RegExp(`local ${lutMatch[0].split(" ")[1].replace("[_i]=bit32.bxor", "")}={}`));
        const tableInitPattern = /for _i=0,255 do (\w+)\[_i\]=bit32\.bxor/g;
        const matches = [...report.output.matchAll(tableInitPattern)];
        expect(matches.length).toBeGreaterThan(0);
        for (const m of matches) {
            expect(m[1]).toBeTruthy();
        }
        expect(report.warnings.length).toBe(0);
        expect(() => parser.parse(report.output)).not.toThrow();
    });
    it("produces no duplicate local variable declarations", { timeout: 30000 }, () => {
        let source = "";
        for (let i = 0; i < 500; i++) {
            source += `local v${i} = ${i}\n`;
        }
        source += "local sum = 0\n";
        for (let i = 0; i < 500; i++) {
            source += `sum = sum + v${i}\n`;
        }
        source += "print(sum)\n";
        const engine = new ObfuscatorEngine({ seed: "no-dup-locals", virtualization: true });
        const report = engine.getReport(source);
        const localDecls = report.output.matchAll(/local (\w+) = \{\}/g);
        const localNames = new Set();
        let duplicates = 0;
        for (const m of localDecls) {
            if (localNames.has(m[1])) {
                duplicates++;
            }
            localNames.add(m[1]);
        }
        expect(duplicates).toBe(0);
        expect(report.warnings.length).toBe(0);
        expect(() => parser.parse(report.output)).not.toThrow();
    });
});
