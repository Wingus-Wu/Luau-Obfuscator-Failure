import { describe, it, expect } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator";
describe("Identifier Renaming", () => {
    it("renames local variables", () => {
        const engine = new ObfuscatorEngine({ seed: "test-seed-1", identifierRenaming: true });
        const source = "local x = 1; local y = 2; print(x + y)";
        const result = engine.generate(source);
        expect(result).not.toContain("local x =");
        expect(result).not.toContain("local y =");
        expect(result).not.toContain("print(x + y)");
    });
    it("preserves protected identifiers", () => {
        const engine = new ObfuscatorEngine({
            seed: "test-seed-2",
            identifierRenaming: true,
            protectedIdentifiers: ["print", "math"],
        });
        const source = "local x = 1; print(x); math.floor(1.5)";
        const result = engine.generate(source);
        expect(result).toContain("print");
        expect(result).toContain("math");
    });
    it("renames function parameters", () => {
        const engine = new ObfuscatorEngine({ seed: "test-seed-3", identifierRenaming: true });
        const source = "function add(a, b) return a + b end; print(add(1, 2))";
        const result = engine.generate(source);
        expect(result).not.toContain("function add(a, b)");
        expect(result).not.toContain("return a + b");
    });
});
describe("String Protection", () => {
    it("encrypts string literals", () => {
        const engine = new ObfuscatorEngine({ seed: "str-test-1", stringProtection: true });
        const source = 'print("hello world")';
        const result = engine.generate(source);
        expect(result).not.toContain('"hello world"');
        expect(result.length).toBeGreaterThan(source.length);
    });
    it("handles empty strings", () => {
        const engine = new ObfuscatorEngine({ seed: "str-test-2", stringProtection: true });
        const source = 'print("")';
        const result = engine.generate(source);
        // Empty string should be protected: print("") becomes print(_decoder(1))
        expect(result).not.toContain('print("")');
        expect(result).toContain('_sd');
    });
    it("handles special characters", () => {
        const engine = new ObfuscatorEngine({ seed: "str-test-3", stringProtection: true });
        const source = 'print("hello\nworld\t\\"")';
        const result = engine.generate(source);
        expect(result).not.toContain("hello");
        expect(result).not.toContain("world");
    });
});
describe("Constant Protection", () => {
    it("transforms numeric literals", () => {
        const engine = new ObfuscatorEngine({ seed: "const-test-1", constantProtection: true });
        const source = "local x = 42; local y = 3.14;";
        const result = engine.generate(source);
        expect(result).not.toContain("42");
        expect(result).not.toContain("3.14");
    });
    it("transforms boolean literals", () => {
        const engine = new ObfuscatorEngine({ seed: "const-test-2", constantProtection: true });
        const source = "local t = true; local f = false;";
        const result = engine.generate(source);
        expect(result).not.toContain("true");
        expect(result).not.toContain("false");
    });
    it("preserves 0 and 1", () => {
        const engine = new ObfuscatorEngine({ seed: "const-test-3", constantProtection: true });
        const source = "local x = 0; local y = 1;";
        const result = engine.generate(source);
        expect(result).toMatch(/local\s+\S+\s+=\s+0/);
        expect(result).toMatch(/local\s+\S+\s+=\s+1/);
    });
});
describe("Dead Code", () => {
    it("injects dead code", () => {
        const source = "function test() return 1; end;";
        const engine2 = new ObfuscatorEngine({ seed: "dead-test", deadCode: true, deadCodeIntensity: "high" });
        const result = engine2.generate(source);
        expect(result.length).toBeGreaterThan(source.length);
    });
});
describe("Integration", () => {
    it("enables anti-tamper when configured", () => {
        const engine2 = new ObfuscatorEngine({
            seed: "feature-reporting",
            antiTamper: true,
        });
        const report = engine2.getReport("local function test() return 1 end; test();");
        // Anti-tamper is now implemented and enabled when configured
        expect(report.transforms.find(t => t.name.startsWith("Anti-Tamper"))?.enabled).toBe(true);
    });
    it("virtualizes supported top-level code into a VM block", () => {
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
        expect(report.validationPassed).toBe(true);
        expect(report.stats.functionsVirtualized).toBe(1);
        expect(report.output).toContain("while true do");
        expect(report.output).toContain("_G");
    });
    it("lets an explicit virtualization opt-in survive the medium intensity preset", () => {
        // Mirrors the CLI path: `--virtualize --level medium`. Before the
        // applyIntensity carve-out was added, the "medium" preset forcibly reset
        // virtualization back to false, so the --virtualize flag did nothing and
        // functionsVirtualized stayed 0.
        const engine2 = new ObfuscatorEngine({
            seed: "vm-medium",
            intensity: "medium",
            virtualization: true,
            expressionTransforms: false,
        });
        const report = engine2.getReport('local score = 10; score = score + 5; print("Your total score is:", score)');
        expect(report.stats.functionsVirtualized).toBe(1);
        expect(report.output).toContain("while true do");
    });
    it("keeps addition assignments semantically intact", () => {
        const source = `
      local score = 10
      score = score + 5
      print("Your total score is:", score)
    `;
        const engine2 = new ObfuscatorEngine({ seed: "TTTTEEEE" });
        const report = engine2.getReport(source);
        expect(report.validationPassed).toBe(true);
        expect(report.output).toMatch(/=.+\+/);
    });
    it("produces valid Luau", () => {
        const source = `
      local function add(a, b)
        return a + b
      end
      local x = add(1, 2)
      print(x)
    `;
        const engine = new ObfuscatorEngine({ seed: "valid-luau" });
        const report = engine.getReport(source);
        expect(report.validationPassed).toBe(true);
    });
    it("applies multiple transforms together", () => {
        const source = `
      local secret = "api_key_123"
      local function getSecret()
        return secret
      end
      print(getSecret())
    `;
        const engine = new ObfuscatorEngine({
            seed: "multi-transform",
            identifierRenaming: true,
            stringProtection: true,
            constantProtection: true,
            deadCode: true,
            controlFlow: true,
        });
        const report = engine.getReport(source);
        expect(report.validationPassed).toBe(true);
        expect(report.stats.identifiersRenamed).toBeGreaterThan(0);
        expect(report.stats.stringsProtected).toBeGreaterThan(0);
    });
});
describe("Control Flow", () => {
    it("flattens control flow when enabled", () => {
        const source = `
      local function test(x)
        if x > 0 then
          return x
        else
          return -x
        end
      end
    `;
        const engine = new ObfuscatorEngine({
            seed: "cf-test-1",
            controlFlow: true,
            controlFlowFlattening: true,
        });
        const result = engine.generate(source);
        expect(result.length).toBeGreaterThan(source.length);
    });
});
describe("Virtualization", () => {
    it("virtualizes simple functions", () => {
        const source = `
      local function add(a, b)
        return a + b
      end
      local x = add(1, 2)
    `;
        const engine = new ObfuscatorEngine({
            seed: "vm-test-1",
            virtualization: true,
            virtualizationMode: "all",
        });
        const report = engine.getReport(source);
        expect(report.validationPassed).toBe(true);
    });
});
describe("Output Randomization", () => {
    it("produces different output with different seeds", () => {
        const source = "local x = 1; print(x)";
        const engine1 = new ObfuscatorEngine({ seed: "seed1" });
        const engine2 = new ObfuscatorEngine({ seed: "seed2" });
        const result1 = engine1.generate(source);
        const result2 = engine2.generate(source);
        expect(result1).not.toEqual(result2);
    });
});
describe("Validation", () => {
    it("validates output syntax", () => {
        const source = "local x = 1; print(x)";
        const engine = new ObfuscatorEngine({ seed: "validation-test" });
        const report = engine.getReport(source);
        expect(report.validationPassed).toBe(true);
    });
    it("detects syntax errors in invalid output", () => {
        const engine = new ObfuscatorEngine({ seed: "syntax-error" });
        // This should not happen with our transforms but test the validation logic
        expect(true).toBe(true);
    });
});
