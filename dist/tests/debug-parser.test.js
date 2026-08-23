import { describe, it } from "vitest";
import { Parser } from "../src/parser/parser.js";
describe("Debug parser bitwise", () => {
    const tests = [
        "result = string.char(a & 0xFF)",
        "result = string.char((a | b) & 0xFF)",
        "result = string.char(((a | b)) & 0xFF)",
        "result = string.char((a | b) - (a & b))",
        "result = string.char(((a | b) - (a & b)) & 0xFF)",
        "result = string.char((a | b) - (a & b) & 0xFF)",
    ];
    for (const source of tests) {
        it(`parses: ${source}`, () => {
            const parser = new Parser();
            try {
                const program = parser.parse(source);
                console.log("OK:", source);
            }
            catch (e) {
                console.log("FAIL:", source, "->", e.message);
            }
        });
    }
});
