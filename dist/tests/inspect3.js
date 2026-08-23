import { Parser } from "../src/parser/index.js";
import { Generator } from "../src/generator/index.js";
const parser = new Parser();
const generator = new Generator();
function tryParse(label, code) {
    try {
        parser.parse(code);
        console.log(label, "-> PARSED OK");
    }
    catch (e) {
        console.log(label, "-> FAIL:", e.message.split("\n")[0]);
    }
}
tryParse("chained index assign", "local t={}\nlocal instr={10,5}\nt.locals[instr[2]]=1");
tryParse("simple", "local t={}\nt[2]=1");
tryParse("env names chained", "local env={}\nlocal names={}\nenv[names[instr[2]]]=1");
// Also test the actual output round-trip from a real run
const { ObfuscatorEngine } = await import("../src/obfuscator.js");
const e = new ObfuscatorEngine({
    seed: "vm-test", virtualization: true, stringProtection: true,
    constantProtection: false, expressionTransforms: false, deadCode: false, controlFlow: false,
});
const r = e.getReport('local score = 10; score = score + 5; print("Your total score is:", score)');
tryParse("full vm output", r.output);
