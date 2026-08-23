import { describe, it, expect } from "vitest";
import { Parser } from "../src/parser/index.js";
import { Generator } from "../src/generator/index.js";
const parser = new Parser();
const generator = new Generator();
describe("Parser", () => {
    it("parses simple variable declaration", () => {
        const ast = parser.parse('local x = 10;');
        expect(ast.statements).toHaveLength(1);
        expect(ast.statements[0].kind).toBe("VariableDeclaration");
    });
    it("parses function declaration", () => {
        const ast = parser.parse("function test() return 1; end;");
        expect(ast.statements).toHaveLength(1);
        expect(ast.statements[0].kind).toBe("FunctionDeclaration");
    });
    it("parses if statement", () => {
        const ast = parser.parse("if true then local x = 1; elseif false then local y = 2; else local z = 3; end;");
        expect(ast.statements).toHaveLength(1);
        expect(ast.statements[0].kind).toBe("IfStatement");
    });
    it("parses while loop", () => {
        const ast = parser.parse("while true do break; end;");
        expect(ast.statements).toHaveLength(1);
        expect(ast.statements[0].kind).toBe("WhileLoop");
    });
    it("parses numeric for loop", () => {
        const ast = parser.parse("for i = 1, 10 do break; end;");
        expect(ast.statements).toHaveLength(1);
        expect(ast.statements[0].kind).toBe("NumericForLoop");
    });
    it("parses generic for loop", () => {
        const ast = parser.parse("for k, v in pairs(t) do break; end;");
        expect(ast.statements).toHaveLength(1);
        expect(ast.statements[0].kind).toBe("GenericForLoop");
    });
    it("parses table constructor", () => {
        const ast = parser.parse('local t = { a = 1, [2] = 3, "x" };');
        expect(ast.statements[0].kind).toBe("VariableDeclaration");
    });
    it("parses binary expressions", () => {
        const ast = parser.parse("local x = 1 + 2 * 3;");
        expect(ast.statements[0].kind).toBe("VariableDeclaration");
    });
    it("parses string literals", () => {
        const ast = parser.parse('local s = "hello";');
        expect(ast.statements[0].kind).toBe("VariableDeclaration");
    });
    it("parses unicode strings", () => {
        const ast = parser.parse('local s = "你好世界";');
        expect(ast.statements[0].kind).toBe("VariableDeclaration");
    });
    it("parses method calls", () => {
        const ast = parser.parse("game:GetService(\"Players\");");
        expect(ast.statements).toHaveLength(1);
    });
    it("parses compound assignments", () => {
        const ast = parser.parse("local x = 1; x += 2;");
        expect(ast.statements).toHaveLength(2);
        expect(ast.statements[1].kind).toBe("CompoundAssignment");
    });
    it("parses continue statement", () => {
        const ast = parser.parse("for i = 1, 10 do continue; end;");
        expect(ast.statements[0].kind).toBe("NumericForLoop");
    });
    it("parses repeat until", () => {
        const ast = parser.parse("repeat break; until true;");
        expect(ast.statements).toHaveLength(1);
        expect(ast.statements[0].kind).toBe("RepeatLoop");
    });
    it("parses type annotations", () => {
        const ast = parser.parse("local x: number = 1;");
        expect(ast.statements[0].kind).toBe("VariableDeclaration");
    });
    it("parses export type", () => {
        const ast = parser.parse("export type MyType = string;");
        expect(ast.statements).toHaveLength(1);
        expect(ast.statements[0].kind).toBe("ExportDeclaration");
    });
});
describe("Generator", () => {
    it("generates valid Luau from simple AST", () => {
        const ast = parser.parse("local x = 10;");
        const output = generator.generate(ast);
        expect(output).toContain("local x = 10");
    });
    it("generates valid Luau from function", () => {
        const ast = parser.parse("function test() return 1; end;");
        const output = generator.generate(ast);
        expect(output).toContain("function test()");
        expect(output).toContain("return 1");
        expect(output).toContain("end");
    });
    it("round-trips simple code", () => {
        const source = "local x = 1 + 2;\nlocal y = x * 3;\nreturn y;";
        const ast1 = parser.parse(source);
        const output = generator.generate(ast1);
        const ast2 = parser.parse(output);
        expect(ast2.statements).toHaveLength(ast1.statements.length);
    });
});
