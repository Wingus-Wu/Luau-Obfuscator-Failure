import { Parser } from "../src/parser/index.js";
import { createRandom } from "../src/utils/prng.js";
import { makeOpTables, BINARY_OP_DEFS, ALL_OPS, generateOpcodeMapping } from "../src/transforms/virtualization/profiles/base.js";
import { BINARY_OP_CODES } from "../src/transforms/virtualization/profiles/base.js";
import { BytecodeCompiler, Op } from "../src/transforms/virtualization/vm.js";
import { selectVMProfile } from "../src/transforms/virtualization/profiles/selector.js";

console.log("=== BINARY_OP_DEFS symbols ===");
for (const d of BINARY_OP_DEFS) {
  console.log(`  ${d.symbol} -> ${d.code}`);
}

// Check for duplicate symbols
const symbols = BINARY_OP_DEFS.map(d => d.symbol);
const dupes = symbols.filter((s, i) => symbols.indexOf(s) !== i);
console.log("Duplicate symbols:", dupes);

// Now create compiler and compile
const parser = new Parser();
const source = `local score = 10\nscore = score + 5\nprint(score)`;
const program = parser.parse(source);

const random = createRandom("test-profileB");
const compiler = new BytecodeCompiler(random);
const result = compiler.compile(program);

console.log("\n=== Compiler output instructions ===");
for (const instr of result.protos[0].instructions as any[]) {
  console.log(instr);
}

// Now call makeOpTables with the same random
const opTables = makeOpTables(random);
console.log("\n=== makeOpTables result ===");
console.log("symbolToBinCode:", opTables.symbolToBinCode);

// Check if binOpsCode has the expected number of entries
const entries = opTables.binOpsCode.split(",");
console.log("binOpsCode entries:", entries.length);
for (let i = 0; i < entries.length; i++) {
  console.log(`  [${i+1}]: ${entries[i]}`);
}
