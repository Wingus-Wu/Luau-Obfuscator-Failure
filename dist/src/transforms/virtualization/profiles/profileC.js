import { rndName, luaStr, luaVal, ALL_OPS, makeOpTables, generateOpcodeMapping, handlerBody, makeVars, generateBit32Fallback, generateNamesTable, generateProtosTable, } from "./base.js";
import { BINARY_OP_CODES, UNARY_OP_CODES } from "../vm.js";
const OP = {
    Nop: 1, PushConst: 2, PushGlobal: 3, PopGlobal: 4, PushLocal: 5, PopLocal: 6,
    Pop: 7, Dup: 8, Call: 9, CallMethod: 10, Return: 11, Jump: 12,
    JumpIfFalse: 13, JumpIfTrue: 14, NewTable: 15, SetList: 16,
    Concat: 17, Len: 18, Binary: 19, Unary: 20, GetProperty: 21, SetProperty: 22,
    GetIndex: 23, SetIndex: 24, LoadProto: 25, Close: 26, Vararg: 27, Nil: 28, Halt: 29,
};
export class ProfileC {
    name = "profileC";
    description = "State-machine dispatcher with band-based dispatch, additive opcode encoding, lazy constant loader, incremental environment";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        this.remapBinaryUnary(protos, opTables);
        const mapping = generateOpcodeMapping(ALL_OPS, r, "add");
        const encodedProtos = mapping.encodeInstrs(protos);
        const v = makeVars(r, rndName(r, "vm"));
        const vmName = v.vmName;
        const protosName = rndName(r, "ps");
        const namesName = v.names;
        const envName = v.env;
        const constPoolName = rndName(r, "cp");
        const constCacheName = rndName(r, "cc");
        const constLoaderName = rndName(r, "cl");
        const resolverName = rndName(r, "rslv");
        const binOpsName = v.binOps;
        const unaryOpsName = v.unaryOps;
        const revMapName = rndName(r, "rm");
        const stateVar = rndName(r, "sv");
        const bandCount = r.nextInt(2, 4);
        const revMap = new Map();
        for (const op of ALL_OPS) {
            revMap.set(mapping.encodeValue(op), op);
        }
        const revEntries = [];
        for (const [enc, orig] of revMap.entries()) {
            revEntries.push(`[${enc}]=${orig}`);
        }
        const allOpsShuffled = r.shuffle([...ALL_OPS]);
        const bands = Array.from({ length: bandCount }, () => []);
        for (let i = 0; i < allOpsShuffled.length; i++) {
            bands[i % bandCount].push(allOpsShuffled[i]);
        }
        const constRef = `${constLoaderName}(${v.instr}[2])`;
        const S = v.S;
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(generateNamesTable(globals, namesName));
        parts.push(generateProtosTable(encodedProtos, protosName, "cp"));
        parts.push(`local ${binOpsName} = {${opTables.binOpsCode}}`);
        parts.push(`local ${unaryOpsName} = {${opTables.unaryOpsCode}}`);
        parts.push(`local ${revMapName} = {${revEntries.join(",")}}`);
        parts.push(`local ${constPoolName} = {}`);
        for (let i = 0; i < protos.length; i++) {
            const constEntries = protos[i].constants.map(c => luaVal(c));
            parts.push(`${constPoolName}[${i}] = {[0]=${constEntries.join(",")}}`);
        }
        parts.push(`local ${constCacheName} = {}`);
        parts.push(`local function ${constLoaderName}(idx, pIdx)`);
        parts.push(`  local key = (pIdx or 0) * 100003 + idx`);
        parts.push(`  if ${constCacheName}[key] ~= nil then return ${constCacheName}[key] end`);
        parts.push(`  local val = ${constPoolName}[pIdx or 0][idx]`);
        parts.push(`  ${constCacheName}[key] = val`);
        parts.push(`  return val`);
        parts.push(`end`);
        parts.push(`local ${envName} = {}`);
        parts.push(`local function ${resolverName}(key)`);
        parts.push(`  if ${envName}[key] == nil then`);
        parts.push(`    ${envName}[key] = _G[key]`);
        parts.push(`  end`);
        parts.push(`  return ${envName}[key]`);
        parts.push(`end`);
        for (const g of globals) {
            parts.push(`${envName}[${luaStr(g)}] = ${g}`);
        }
        const vmCodeParts = [];
        vmCodeParts.push(`local function ${vmName}(protoIdx, ${envName}, args)`);
        vmCodeParts.push(`  local proto = ${protosName}[protoIdx]`);
        vmCodeParts.push(`  local bc = proto.bc`);
        vmCodeParts.push(`  local ${S} = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}}`);
        vmCodeParts.push(`  for i=1,proto.np or 0 do ${S}.locals[i-1]=${S}.varargs[i] end`);
        vmCodeParts.push(`  local ${stateVar} = 0`);
        vmCodeParts.push(`  while true do`);
        vmCodeParts.push(`    local instr = bc[${S}.pc + 1]`);
        vmCodeParts.push(`    if instr == nil then break end`);
        vmCodeParts.push(`    ${S}.pc = ${S}.pc + 1`);
        vmCodeParts.push(`    local op = ${revMapName}[instr[1]] or instr[1]`);
        vmCodeParts.push(`    ${stateVar} = op % ${bandCount}`);
        for (let band = 0; band < bandCount; band++) {
            const keyword = band === 0 ? "if" : "elseif";
            vmCodeParts.push(`    ${keyword} ${stateVar} == ${band} then`);
            const chain = [];
            for (let j = 0; j < bands[band].length; j++) {
                const op = bands[band][j];
                const body = handlerBody(op, v, constRef);
                const subKeyword = j === 0 ? "if" : "elseif";
                const line = `${subKeyword} op == ${op} then`;
                chain.push(line);
                if (body) {
                    for (const bline of body.split("\n")) {
                        chain.push(`      ${bline}`);
                    }
                }
            }
            if (chain.length > 0) {
                chain.push("end");
                vmCodeParts.push(...chain.map(l => "    " + l));
            }
        }
        vmCodeParts.push("    end");
        vmCodeParts.push("  end");
        vmCodeParts.push("  return nil");
        vmCodeParts.push("end");
        vmCodeParts.push(`${vmName}(0, ${envName}, {})`);
        parts.push(vmCodeParts.join("\n"));
        return parts.join("\n");
    }
    remapBinaryUnary(protos, tbl) {
        for (const proto of protos) {
            for (const instr of proto.instructions) {
                if (Array.isArray(instr) && instr[0] === "raw")
                    continue;
                if (instr[0] === OP.Binary) {
                    const sym = Object.keys(BINARY_OP_CODES).find(k => BINARY_OP_CODES[k] === instr[1]);
                    if (sym)
                        instr[1] = tbl.symbolToBinCode[sym];
                }
                if (instr[0] === OP.Unary) {
                    const sym = Object.keys(UNARY_OP_CODES).find(k => UNARY_OP_CODES[k] === instr[1]);
                    if (sym)
                        instr[1] = tbl.symbolToUnaryCode[sym];
                }
            }
        }
    }
}
