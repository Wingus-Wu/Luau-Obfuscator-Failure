import { rndName, luaStr, ALL_OPS, makeOpTables, generateOpcodeMapping, handlerBody, makeVars, generateBit32Fallback, generateNamesTable, generateProtosTable, generateSplitConstantPools, } from "./base.js";
import { BINARY_OP_CODES, UNARY_OP_CODES } from "../vm.js";
const OP = {
    Nop: 1, PushConst: 2, PushGlobal: 3, PopGlobal: 4, PushLocal: 5, PopLocal: 6,
    Pop: 7, Dup: 8, Call: 9, CallMethod: 10, Return: 11, Jump: 12,
    JumpIfFalse: 13, JumpIfTrue: 14, NewTable: 15, SetList: 16,
    Concat: 17, Len: 18, Binary: 19, Unary: 20, GetProperty: 21, SetProperty: 22,
    GetIndex: 23, SetIndex: 24, LoadProto: 25, Close: 26, Vararg: 27, Nil: 28, Halt: 29,
};
export class ProfileD {
    name = "profileD";
    description = "Mixed dispatcher (inline + handler table), double-shuffle opcodes, per-function split pools, lazy resolver environment";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        this.remapBinaryUnary(protos, opTables);
        const mapping = generateOpcodeMapping(ALL_OPS, r, "double-shuffle");
        const encodedProtos = mapping.encodeInstrs(protos);
        const v = makeVars(r, rndName(r, "vm"));
        const vmName = v.vmName;
        const protosName = rndName(r, "ps");
        const namesName = v.names;
        const envName = v.env;
        const handlersName = rndName(r, "hd");
        const resolverName = rndName(r, "rslv");
        const constPoolName = rndName(r, "cpl");
        const constCacheName = rndName(r, "cdc");
        const constLoaderName = rndName(r, "cld");
        const revMapName = rndName(r, "rm");
        const binOpsName = v.binOps;
        const unaryOpsName = v.unaryOps;
        const ctxName = rndName(r, "ctx");
        const revMap = new Map();
        for (const op of ALL_OPS) {
            revMap.set(mapping.encodeValue(op), op);
        }
        const revEntries = [];
        for (const [enc, orig] of revMap.entries()) {
            revEntries.push(`[${enc}]=${orig}`);
        }
        const allOpsShuffled = r.shuffle([...ALL_OPS]);
        const inlineOps = [];
        const tableOps = [];
        const inlineSet = new Set();
        for (const op of allOpsShuffled) {
            if (op === OP.Return || op === OP.Halt) {
                inlineOps.push(op);
                inlineSet.add(op);
            }
            else if (r.nextBool(0.5)) {
                inlineOps.push(op);
                inlineSet.add(op);
            }
            else {
                tableOps.push(op);
            }
        }
        if (inlineOps.length === 0) {
            inlineOps.push(allOpsShuffled[0]);
            inlineSet.add(allOpsShuffled[0]);
        }
        if (tableOps.length === 0) {
            tableOps.push(allOpsShuffled[0]);
        }
        const S = v.S;
        const constRef = `${constLoaderName}(${v.instr}[2])`;
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(generateNamesTable(globals, namesName));
        parts.push(`local ${constPoolName} = {}`);
        parts.push(generateSplitConstantPools(encodedProtos, constPoolName));
        parts.push(`local ${constCacheName} = {}`);
        parts.push(`local function ${constLoaderName}(idx, pIdx)`);
        parts.push(`  local key = (pIdx or 0) * 100003 + idx`);
        parts.push(`  if ${constCacheName}[key] ~= nil then return ${constCacheName}[key] end`);
        parts.push(`  local pools = ${constPoolName}[pIdx or 0]`);
        parts.push(`  local grp = pools.__d[idx]`);
        parts.push(`  local val = pools[grp][idx]`);
        parts.push(`  ${constCacheName}[key] = val`);
        parts.push(`  return val`);
        parts.push(`end`);
        parts.push(generateProtosTable(encodedProtos, protosName, "cp"));
        parts.push(`local ${binOpsName} = {${opTables.binOpsCode}}`);
        parts.push(`local ${unaryOpsName} = {${opTables.unaryOpsCode}}`);
        parts.push(`local ${revMapName} = {${revEntries.join(",")}}`);
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
        const handlerFuncs = [];
        const handlerTableEntries = [];
        for (const op of tableOps) {
            const encOp = mapping.encodeValue(op);
            const hName = `_h${r.nextInt(100000, 999999)}`;
            const body = handlerBody(op, v, constRef);
            if (!body) {
                handlerFuncs.push(`local function ${hName}(S, instr, ctx)
end`);
            }
            else {
                handlerFuncs.push(`local function ${hName}(S, instr, ctx)
  ${body}
end`);
            }
            handlerTableEntries.push(`${encOp}=${hName}`);
        }
        for (const hf of handlerFuncs)
            parts.push(hf);
        parts.push(`local ${handlersName} = {}`);
        for (const entry of handlerTableEntries) {
            const [key, val] = entry.split("=");
            parts.push(`${handlersName}[${key}] = ${val}`);
        }
        const vmCodeParts = [];
        vmCodeParts.push(`local function ${vmName}(protoIdx, ${envName}, args)`);
        vmCodeParts.push(`  local proto = ${protosName}[protoIdx]`);
        vmCodeParts.push(`  local bc = proto.bc`);
        vmCodeParts.push(`  local ${ctxName} = {pIdx=protoIdx}`);
        vmCodeParts.push(`  local ${S} = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}`);
        vmCodeParts.push(`  for i=1,proto.np or 0 do ${S}.locals[i-1]=${S}.varargs[i] end`);
        vmCodeParts.push(`  while true do`);
        vmCodeParts.push(`    local instr = bc[${S}.pc + 1]`);
        vmCodeParts.push(`    if instr == nil then break end`);
        vmCodeParts.push(`    ${S}.pc = ${S}.pc + 1`);
        vmCodeParts.push(`    local op = ${revMapName}[instr[1]] or instr[1]`);
        for (let i = 0; i < inlineOps.length; i++) {
            const op = inlineOps[i];
            const body = handlerBody(op, v, constRef);
            const keyword = i === 0 ? "if" : "elseif";
            vmCodeParts.push(`    ${keyword} op == ${op} then`);
            if (body) {
                for (const bline of body.split("\n")) {
                    vmCodeParts.push(`      ${bline}`);
                }
            }
        }
        vmCodeParts.push("    elseif false then end");
        vmCodeParts.push(`    local handler = ${handlersName}[op]`);
        vmCodeParts.push(`    if op ~= ${OP.Return} and op ~= ${OP.Halt} then`);
        vmCodeParts.push(`      if handler then handler(${S}, instr, ${ctxName}) end`);
        vmCodeParts.push(`    end`);
        vmCodeParts.push(`    if ${S}.halt then break end`);
        vmCodeParts.push(`    if ${S}.ret then return table.unpack(${S}.ret) end`);
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
