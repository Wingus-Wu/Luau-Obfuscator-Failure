import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
describe("Debug function call", () => {
    it("debug function call output", async () => {
        const engine = new ObfuscatorEngine({
            seed: "diff-function-call",
            virtualization: true,
            stringProtection: true,
            constantProtection: false,
            expressionTransforms: false,
            deadCode: false,
            controlFlow: false,
        });
        const source = `local function add(a, b)
    return a + b
end
print(add(2, 3))`;
        const report = engine.getReport(source);
        console.log("output:", JSON.stringify(report.output));
        // Let's also check what the generator produces for a simple empty VariableDeclaration
        const { Generator } = await import("../src/generator/generator.js");
        const g = new Generator();
        const emptyVarDecl = {
            kind: "VariableDeclaration",
            left: [],
            right: [],
            line: 0,
            column: 0
        };
        console.log("empty var decl:", g.generate([emptyVarDecl]));
    });
});
