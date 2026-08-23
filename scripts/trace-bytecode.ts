import { BytecodeCompiler, Op, BINARY_OP_CODES } from "../src/transforms/virtualization/vm.js";
import { Parser } from "../src/parser/index.js";
import { createRandom } from "../src/utils/prng.js";
import { makeOpTables, BINARY_OP_DEFS, ALL_OPS } from "../src/transforms/virtualization/profiles/base.js";
import { rndName, makeVars, handlerBody, generateOpcodeMapping } from "../src/transforms/virtualization/profiles/base.js";

const parser = new Parser();
const source = `local score = 10\nscore = score + 5\nprint(score)`;
const program = parser.parse(source);

const random = createRandom("test-profileB");
const compiler = new BytecodeCompiler(random);
const result = compiler.compile(program);

console.log("=== Original bytecode ===");
for (const proto of result.protos) {
  console.log("Proto:", proto.instructions);
  console.log("Constants:", proto.constants);
  console.log("Globals:", result.globals);
}

// Now remap
const opTables = makeOpTables(random);
console.log("\n=== BinOps table ===");
console.log("binOpsCode:", opTables.binOpsCode);
console.log("symbolToBinCode:", opTables.symbolToBinCode);
console.log("\nBINARY_OP_CODES:", BINARY_OP_CODES);
console.log("\n=== Remapping binary ops ===");
for (const proto of result.protos) {
  for (const instr of proto.instructions as any[]) {
    if (instr[0] === Op.Binary) {
      const origOp = instr[1];
      const sym = Object.keys(BINARY_OP_CODES).find(k => BINARY_OP_CODES[k as any] === origOp);
      const newOp = sym ? opTables.symbolToBinCode[sym] : origOp;
      console.log(`  Binary: orig code=${origOp}, symbol='${sym}', new code=${newOp}, binOps[${newOp}]=${opTables.binOpsCode.split(",")[newOp - 1]}`);
    }
  }
}

// Now encode
const mapping = generateOpcodeMapping(ALL_OPS, random, "shuffle");
const encodedProtos = mapping.encodeInstrs(result.protos);
console.log("\n=== Encoded bytecode ===");
for (const proto of encodedProtos) {
  console.log("Proto:", proto.instructions);
}
