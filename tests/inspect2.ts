import { ObfuscatorEngine } from "../src/obfuscator.js";
import { Parser } from "../src/parser/index.js";

const parser = new Parser();
const source = 'local score = 10; score = score + 5; print("Your total score is:", score)';

for (const seed of ["s1", "s2", "s3", "opcode-perm-test", "vm-test"]) {
  const e = new ObfuscatorEngine({
    seed,
    virtualization: true,
    stringProtection: true,
    constantProtection: false,
    expressionTransforms: false,
    deadCode: false,
    controlFlow: false,
  });
  const r = e.getReport(source);
  let parseErr = "";
  try { parser.parse(r.output); } catch (ex: any) { parseErr = ex.message.split("\n")[0]; }
  const vmFn = r.output.match(/local function (_vm\w+)/)?.[1] ?? "?";
  console.log(`SEED ${seed} vmFn=${vmFn} valid=${r.validationPassed} parseErr=${parseErr || "none"}`);
  if (parseErr) {
    console.log("--- OUTPUT (first parse error region) ---");
    const lines = r.output.split("\n");
    // find line 87 region
    const idx = parseErr.match(/line (\d+)/);
    const lineNo = idx ? parseInt(idx[1], 10) : 87;
    const start = Math.max(0, lineNo - 5);
    for (let i = start; i < Math.min(lines.length, lineNo + 3); i++) {
      console.log(`${i+1}: ${lines[i]}`);
    }
  }
}
