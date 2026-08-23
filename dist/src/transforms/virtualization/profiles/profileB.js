import { rndName, luaStr, luaVal, ALL_OPS, makeOpTables, generateOpcodeMapping, handlerBody, makeVars, generateBit32Fallback, generateNamesTable, } from "./base.js";
import { BINARY_OP_CODES, UNARY_OP_CODES } from "../vm.js";
export class ProfileB {
    name = "profileB";
    description = "If/elseif dispatcher with shuffled branch order, shuffle opcodes, single constant pool, eager environment";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        this.remapBinaryUnary(protos, opTables);
        const mapping = generateOpcodeMapping(ALL_OPS, r, "shuffle");
        const encodedProtos = mapping.encodeInstrs(protos);
        const v = makeVars(r, rndName(r, "vm"));
        const vmName = v.vmName;
        const protosName = rndName(r, "ps");
        const namesName = v.names;
        const envName = v.env;
        const binOpsName = v.binOps;
        const unaryOpsName = v.unaryOps;
        const reverseOpMapName = rndName(r, "rom");
        const revMap = new Map();
        for (const op of ALL_OPS) {
            revMap.set(mapping.encodeValue(op), op);
        }
        const revEntries = [];
        for (const [enc, orig] of revMap.entries()) {
            revEntries.push(`[${enc}]=${orig}`);
        }
        const shuffledOps = r.shuffle([...ALL_OPS]);
        const protoEntries = [];
        for (let i = 0; i < encodedProtos.length; i++) {
            const proto = encodedProtos[i];
            const instrEntries = [];
            for (const instr of proto.instructions) {
                if (Array.isArray(instr) && instr[0] === "raw") {
                    instrEntries.push(instr[1]);
                }
                else {
                    const vals = instr.map(val => typeof val === "string" ? JSON.stringify(val) : String(val));
                    instrEntries.push(`{${vals.join(",")}}`);
                }
            }
            const constEntries = proto.constants.map(c => luaVal(c));
            const cpStr = proto.constants.length > 0
                ? `cp = {[0]=${constEntries.join(",")}}`
                : `cp = {}`;
            protoEntries.push(`[${i}] = {bc = {${instrEntries.join(",")}}, ${cpStr}, np = ${proto.numParams || 0}}`);
        }
        const envEntries = [];
        for (const g of globals) {
            envEntries.push(`${envName}[${luaStr(g)}] = ${g}`);
        }
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(`local ${protosName} = {${protoEntries.join(",")}}`);
        parts.push(generateNamesTable(globals, namesName));
        parts.push(`local ${reverseOpMapName} = {${revEntries.join(",")}}`);
        parts.push(`local ${binOpsName} = {${opTables.binOpsCode}}`);
        parts.push(`local ${unaryOpsName} = {${opTables.unaryOpsCode}}`);
        parts.push(`local ${envName} = {}`);
        parts.push(`for _k, _v in pairs(_G) do ${envName}[_k] = _v end`);
        parts.push(`${envName}["bit32"] = bit32 or {}`);
        for (const entry of envEntries)
            parts.push(entry);
        const constRef = `${v.cp}[${v.instr}[2]]`;
        const dispatchChain = [];
        for (let i = 0; i < shuffledOps.length; i++) {
            const op = shuffledOps[i];
            const body = handlerBody(op, v, constRef);
            const keyword = i === 0 ? "if" : "elseif";
            const encodedOp = mapping.encodeValue(op);
            dispatchChain.push(`${keyword} op == ${encodedOp} then`);
            if (body) {
                for (const line of body.split("\n")) {
                    dispatchChain.push(`  ${line}`);
                }
            }
        }
        dispatchChain.push("end");
        const vmCode = `local function ${vmName}(protoIdx, ${envName}, args)
  local proto = ${protosName}[protoIdx]
  local bc = proto.bc
  local ${v.cp} = proto.cp
  local ${v.S} = {sp = -1, pc = 0, stack = {}, locals = {}, varargs = args or {}}
  for i = 1, proto.np or 0 do ${v.S}.locals[i - 1] = ${v.S}.varargs[i] end
  while true do
    local instr = bc[${v.S}.pc + 1]
    ${v.S}.pc = ${v.S}.pc + 1
    if instr == nil then break end
    local op = ${reverseOpMapName}[instr[1]] or instr[1]
    ${dispatchChain.join("\n    ")}
  end
  return nil
end
${vmName}(0, ${envName}, {})`;
        parts.push(vmCode);
        return parts.join("\n");
    }
    remapBinaryUnary(protos, tbl) {
        for (const proto of protos) {
            for (const instr of proto.instructions) {
                if (Array.isArray(instr) && instr[0] === "raw")
                    continue;
                if (instr[0] === 19) {
                    const sym = Object.keys(BINARY_OP_CODES).find(k => BINARY_OP_CODES[k] === instr[1]);
                    if (sym)
                        instr[1] = tbl.symbolToBinCode[sym];
                }
                if (instr[0] === 20) {
                    const sym = Object.keys(UNARY_OP_CODES).find(k => UNARY_OP_CODES[k] === instr[1]);
                    if (sym)
                        instr[1] = tbl.symbolToUnaryCode[sym];
                }
            }
        }
    }
}
