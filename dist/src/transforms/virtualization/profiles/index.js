import { BINARY_OP_CODES, UNARY_OP_CODES } from "./base.js";
import { rndName, ALL_OPS, makeOpTables, makeVars, handlerBody, generateBit32Fallback, generateNamesTable, generateProtosTable, generateSplitConstantPools, generateShuffledConstantPool, generateOpcodeMapping, makeRegisterVars, registerHandlerBody, createSemEncoder, generateEnvInit, } from "./base.js";
const OP = {
    Nop: 1, PushConst: 2, PushGlobal: 3, PopGlobal: 4, PushLocal: 5, PopLocal: 6,
    Pop: 7, Dup: 8, Call: 9, CallMethod: 10, Return: 11, Jump: 12,
    JumpIfFalse: 13, JumpIfTrue: 14, NewTable: 15, SetList: 16,
    Concat: 17, Len: 18, Binary: 19, Unary: 20, GetProperty: 21, SetProperty: 22,
    GetIndex: 23, SetIndex: 24, LoadProto: 25, Close: 26, Vararg: 27, Nil: 28, Halt: 29,
};
function remapOps(protos, tbl) {
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
function emitBit32(protos, parts, envName, globals) {
    let needsBit32 = false;
    for (const proto of protos) {
        for (const instr of proto.instructions) {
            if (Array.isArray(instr) && instr[0] === "raw")
                continue;
            if (instr[0] === OP.Binary && Object.keys(BINARY_OP_CODES).find(k => BINARY_OP_CODES[k] === instr[1 + 0])?.match(/[&|~]/))
                needsBit32 = true;
        }
    }
    parts.push(generateBit32Fallback());
}
export class ProfileA {
    name = "profileA";
    description = "Handler function-table dispatcher, XOR+shuffle opcodes, split constant pools, lazy environment resolver";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        remapOps(protos, opTables);
        const xorKey = r.nextInt(1, 255);
        const mapping = generateOpcodeMapping(ALL_OPS, r, "xor-shuffle", xorKey);
        const encodedProtos = mapping.encodeInstrs(protos);
        const v = makeVars(r, rndName(r, "vm"));
        const vmName = v.vmName;
        const protosName = rndName(r, "ps");
        const namesName = v.names;
        const envName = v.env;
        const handlersName = rndName(r, "hd");
        const resolverName = rndName(r, "rslv");
        const splitPoolsName = rndName(r, "cpls");
        const binOpsName = v.binOps;
        const unaryOpsName = v.unaryOps;
        const S = v.S;
        const sem = createSemEncoder(r);
        const decoderName = context.stringPool.size > 0 ? context.stringPoolDecoderName : undefined;
        const allOpsShuffled = r.shuffle([...ALL_OPS]);
        const handlerFuncs = [];
        const handlerTableEntries = [];
        const constAccess = `${sem.D}(${splitPoolsName}[ctx.pIdx or 0][${splitPoolsName}[ctx.pIdx or 0].__d[${v.instr}[2]]][${splitPoolsName}[ctx.pIdx or 0].__s[${v.instr}[2]]])`;
        for (const op of allOpsShuffled) {
            const encOp = mapping.encodeValue(op);
            const hName = `_h${r.nextInt(100000, 999999)}`;
            const body = handlerBody(op, v, constAccess);
            if (!body) {
                handlerFuncs.push(`local function ${hName}(${S}, instr, ctx)
end`);
            }
            else {
                handlerFuncs.push(`local function ${hName}(${S}, instr, ctx)
  ${body}
end`);
            }
            handlerTableEntries.push(`${encOp}=${hName}`);
        }
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(sem.code);
        parts.push(generateNamesTable(globals, namesName, sem));
        parts.push(generateSplitConstantPools(encodedProtos, splitPoolsName, sem));
        parts.push(generateProtosTable(encodedProtos, protosName, "cp", sem));
        parts.push(`local ${binOpsName} = {${opTables.binOpsCode}}`);
        parts.push(`local ${unaryOpsName} = {${opTables.unaryOpsCode}}`);
        parts.push(`local ${envName} = {}`);
        for (const line of generateEnvInit(globals, envName, namesName, decoderName))
            parts.push(line);
        parts.push(`local function ${resolverName}(key)`);
        parts.push(`  if ${envName}[key] == nil and key ~= "nil" then`);
        parts.push(`    ${envName}[key] = _G[key]`);
        parts.push(`  end`);
        parts.push(`  return ${envName}[key]`);
        parts.push(`end`);
        parts.push(`local ${vmName}`);
        for (const hf of handlerFuncs)
            parts.push(hf);
        parts.push(`local ${handlersName} = {}`);
        for (const entry of handlerTableEntries) {
            const [key, val] = entry.split("=");
            parts.push(`${handlersName}[${key}] = ${val}`);
        }
        const vmCode = `${vmName} = function(protoIdx, ${envName}, args)
  local proto = ${protosName}[protoIdx]
  local bc = proto.bc
  local ${S} = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do ${S}.locals[i-1]=${S}.varargs[i] end
  while true do
    local instr = bc[${S}.pc + 1]
    if instr == nil then break end
    ${S}.pc = ${S}.pc + 1
    ${S}.ret = nil
    local op = instr[1]
    local handler = ${handlersName}[op]
    if handler == nil then break end
    handler(${S}, instr, {pIdx=protoIdx})
    if ${S}.halt then break end
    if ${S}.ret then return table.unpack(${S}.ret) end
  end
  return nil
end
${vmName}(0, ${envName}, {})`;
        parts.push(vmCode);
        return parts.join("\n");
    }
}
export class ProfileB {
    name = "profileB";
    description = "If/elseif dispatcher with shuffled branch order, shuffle opcodes, single constant pool, eager environment";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        remapOps(protos, opTables);
        const mapping = generateOpcodeMapping(ALL_OPS, r, "shuffle");
        const encodedProtos = mapping.encodeInstrs(protos);
        const v = makeVars(r, rndName(r, "vm"));
        const vmName = v.vmName;
        const protosName = rndName(r, "ps");
        const namesName = v.names;
        const envName = v.env;
        const reverseMapName = rndName(r, "rom");
        const binOpsName = v.binOps;
        const unaryOpsName = v.unaryOps;
        const cpName = v.cp;
        const S = v.S;
        const sem = createSemEncoder(r);
        const decoderName = context.stringPool.size > 0 ? context.stringPoolDecoderName : undefined;
        const revMap = new Map();
        for (const op of ALL_OPS) {
            revMap.set(mapping.encodeValue(op), op);
        }
        const revEntries = [];
        for (const [enc, orig] of revMap.entries()) {
            revEntries.push(`[${enc}]=${orig}`);
        }
        const shuffledOps = r.shuffle([...ALL_OPS]);
        const constAccess = `${sem.D}(${cpName}[${v.instr}[2]])`;
        const dispatchChain = [];
        for (let i = 0; i < shuffledOps.length; i++) {
            const op = shuffledOps[i];
            const encOp = mapping.encodeValue(op);
            const body = handlerBody(op, v, constAccess);
            const keyword = i === 0 ? "if" : "elseif";
            dispatchChain.push(`${keyword} op == ${op} then`);
            if (body) {
                for (const line of body.split("\n")) {
                    dispatchChain.push(`  ${line}`);
                }
            }
        }
        dispatchChain.push("end");
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
            const constEntries = proto.constants.map(c => sem.encodeVal(c));
            const cpStr = proto.constants.length > 0
                ? `cp = {[0]=${constEntries.join(",")}}`
                : `cp = {}`;
            protoEntries.push(`[${i}] = {bc = {${instrEntries.join(",")}}, ${cpStr}, np = ${proto.numParams || 0}}`);
        }
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(sem.code);
        parts.push(`local ${protosName} = {${protoEntries.join(",")}}`);
        parts.push(generateNamesTable(globals, namesName, sem));
        parts.push(`local ${reverseMapName} = {${revEntries.join(",")}}`);
        parts.push(`local ${binOpsName} = {${opTables.binOpsCode}}`);
        parts.push(`local ${unaryOpsName} = {${opTables.unaryOpsCode}}`);
        parts.push(`local ${envName} = {}`);
        for (const line of generateEnvInit(globals, envName, namesName, decoderName))
            parts.push(line);
        const vmCode = `local function ${vmName}(protoIdx, ${envName}, args)
  local proto = ${protosName}[protoIdx]
  local bc = proto.bc
  local ${cpName} = proto.cp
  local ${S} = {sp = -1, pc = 0, stack = {}, locals = {}, varargs = args or {}, halt = false, ret = nil}
  for i = 1, proto.np or 0 do ${S}.locals[i - 1] = ${S}.varargs[i] end
  while true do
    local instr = bc[${S}.pc + 1]
    ${S}.pc = ${S}.pc + 1
     if instr == nil then break end
    ${S}.ret = nil
    local op = ${reverseMapName}[instr[1]] or instr[1]
    ${dispatchChain.join("\n    ")}
    if ${S}.halt then break end
    if ${S}.ret then return table.unpack(${S}.ret) end
  end
  return nil
end
${vmName}(0, ${envName}, {})`;
        parts.push(vmCode);
        return parts.join("\n");
    }
}
export class ProfileC {
    name = "profileC";
    description = "State-machine dispatcher with band-based dispatch, additive opcode encoding, lazy constant loader, incremental environment";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        remapOps(protos, opTables);
        const mapping = generateOpcodeMapping(ALL_OPS, r, "add");
        const encodedProtos = mapping.encodeInstrs(protos);
        const v = makeVars(r, rndName(r, "vm"));
        const vmName = v.vmName;
        const protosName = rndName(r, "ps");
        const namesName = v.names;
        const envName = v.env;
        const resolverName = rndName(r, "rslv");
        const constPoolName = rndName(r, "cp");
        const constCacheName = rndName(r, "cc");
        const constLoaderName = rndName(r, "cl");
        const revMapName = rndName(r, "rm");
        const stateVar = rndName(r, "sv");
        const binOpsName = v.binOps;
        const unaryOpsName = v.unaryOps;
        const S = v.S;
        const sem = createSemEncoder(r);
        const decoderName = context.stringPool.size > 0 ? context.stringPoolDecoderName : undefined;
        const revMap = new Map();
        for (const op of ALL_OPS) {
            revMap.set(mapping.encodeValue(op), op);
        }
        const revEntries = [];
        for (const [enc, orig] of revMap.entries()) {
            revEntries.push(`[${enc}]=${orig}`);
        }
        const allOpsShuffled = r.shuffle([...ALL_OPS]);
        const bandCount = r.nextInt(2, 4);
        const bands = Array.from({ length: bandCount }, () => []);
        const bandOf = [];
        for (let i = 0; i < allOpsShuffled.length; i++) {
            const op = allOpsShuffled[i];
            bands[i % bandCount].push(op);
            bandOf[op] = i % bandCount;
        }
        const bandOfName = rndName(r, "band");
        const constRef = `${sem.D}(${constLoaderName}(${v.instr}[2], protoIdx))`;
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(sem.code);
        parts.push(generateNamesTable(globals, namesName, sem));
        parts.push(generateProtosTable(encodedProtos, protosName, "cp", sem));
        parts.push(`local ${binOpsName} = {${opTables.binOpsCode}}`);
        parts.push(`local ${unaryOpsName} = {${opTables.unaryOpsCode}}`);
        parts.push(`local ${revMapName} = {${revEntries.join(",")}}`);
        parts.push(`local ${constPoolName} = {}`);
        for (let i = 0; i < protos.length; i++) {
            const constEntries = protos[i].constants.map(c => sem.encodeVal(c));
            const poolStr = constEntries.length > 0
                ? `{[0]=${constEntries.join(",")}}`
                : `{}`;
            parts.push(`${constPoolName}[${i}] = ${poolStr}`);
        }
        parts.push(`local ${constCacheName} = {}`);
        parts.push(`local function ${constLoaderName}(idx, pIdx)`);
        parts.push(`  if pIdx == nil then pIdx = 0 end`);
        parts.push(`  local key = pIdx * 100003 + idx`);
        parts.push(`  if ${constCacheName}[key] ~= nil then return ${constCacheName}[key] end`);
        parts.push(`  local val = ${constPoolName}[pIdx][idx]`);
        parts.push(`  ${constCacheName}[key] = val`);
        parts.push(`  return val`);
        parts.push(`end`);
        parts.push(`local ${envName} = {}`);
        for (const line of generateEnvInit(globals, envName, namesName, decoderName))
            parts.push(line);
        parts.push(`local function ${resolverName}(key)`);
        parts.push(`  if ${envName}[key] == nil then`);
        parts.push(`    ${envName}[key] = _G[key]`);
        parts.push(`  end`);
        parts.push(`  return ${envName}[key]`);
        parts.push(`end`);
        const bandOfEntries = [];
        for (const op of ALL_OPS) {
            bandOfEntries.push(`[${op}]=${bandOf[op]}`);
        }
        parts.push(`local ${bandOfName} = {${bandOfEntries.join(",")}}`);
        const vmCodeParts = [];
        vmCodeParts.push(`local function ${vmName}(protoIdx, ${envName}, args)`);
        vmCodeParts.push(`  local proto = ${protosName}[protoIdx]`);
        vmCodeParts.push(`  local bc = proto.bc`);
        vmCodeParts.push(`  local ${S} = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}`);
        vmCodeParts.push(`  for i=1,proto.np or 0 do ${S}.locals[i-1]=${S}.varargs[i] end`);
        vmCodeParts.push(`  while true do`);
        vmCodeParts.push(`    local instr = bc[${S}.pc + 1]`);
        vmCodeParts.push(`    if instr == nil then break end`);
        vmCodeParts.push(`    ${S}.pc = ${S}.pc + 1`);
        vmCodeParts.push(`    ${S}.ret = nil`);
        vmCodeParts.push(`    local op = ${revMapName}[instr[1]] or instr[1]`);
        vmCodeParts.push(`    ${stateVar} = ${bandOfName}[op]`);
        for (let band = 0; band < bandCount; band++) {
            const keyword = band === 0 ? "if" : "elseif";
            vmCodeParts.push(`    ${keyword} ${stateVar} == ${band} then`);
            const opsInBand = bands[band];
            for (let j = 0; j < opsInBand.length; j++) {
                const op = opsInBand[j];
                const body = handlerBody(op, v, constRef);
                const subKeyword = j === 0 ? "if" : "elseif";
                vmCodeParts.push(`      ${subKeyword} op == ${op} then`);
                if (body) {
                    for (const bline of body.split("\n")) {
                        const indent = bline.startsWith("local") ? "        " : "        ";
                        vmCodeParts.push(`        ${bline}`);
                    }
                }
            }
            if (opsInBand.length > 0) {
                vmCodeParts.push("      end");
            }
        }
        vmCodeParts.push("    end");
        vmCodeParts.push(`    if ${S}.halt then break end`);
        vmCodeParts.push(`    if ${S}.ret then return table.unpack(${S}.ret) end`);
        vmCodeParts.push("  end");
        vmCodeParts.push("  return nil");
        vmCodeParts.push("end");
        vmCodeParts.push(`${vmName}(0, ${envName}, {})`);
        parts.push(vmCodeParts.join("\n"));
        return parts.join("\n");
    }
}
export class ProfileD {
    name = "profileD";
    description = "Mixed dispatcher (inline + handler table), double-shuffle opcodes, per-function lazy pools, resolver environment";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        remapOps(protos, opTables);
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
        const S = v.S;
        const sem = createSemEncoder(r);
        const decoderName = context.stringPool.size > 0 ? context.stringPoolDecoderName : undefined;
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
        for (const op of allOpsShuffled) {
            if (op === OP.Return || op === OP.Halt || r.nextBool(0.45)) {
                inlineOps.push(op);
            }
            else {
                tableOps.push(op);
            }
        }
        if (inlineOps.length === 0) {
            inlineOps.push(allOpsShuffled[0]);
        }
        const constRefInline = `${sem.D}(${constLoaderName}(${v.instr}[2], protoIdx))`;
        const constRefHandler = `${sem.D}(${constLoaderName}(${v.instr}[2], ctx.pIdx))`;
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(sem.code);
        parts.push(generateNamesTable(globals, namesName, sem));
        parts.push(generateShuffledConstantPool(encodedProtos, constPoolName, r, sem));
        parts.push(`local ${constCacheName} = {}`);
        parts.push(`local function ${constLoaderName}(idx, pIdx)`);
        parts.push(`  if pIdx == nil then pIdx = 0 end`);
        parts.push(`  local key = pIdx * 100003 + idx`);
        parts.push(`  if ${constCacheName}[key] ~= nil then return ${constCacheName}[key] end`);
        parts.push(`  local pools = ${constPoolName}[pIdx]`);
        parts.push(`  local val = pools[pools.__r[idx]]`);
        parts.push(`  ${constCacheName}[key] = val`);
        parts.push(`  return val`);
        parts.push(`end`);
        parts.push(generateProtosTable(encodedProtos, protosName, "cp", sem));
        parts.push(`local ${binOpsName} = {${opTables.binOpsCode}}`);
        parts.push(`local ${unaryOpsName} = {${opTables.unaryOpsCode}}`);
        parts.push(`local ${revMapName} = {${revEntries.join(",")}}`);
        parts.push(`local ${envName} = {}`);
        for (const line of generateEnvInit(globals, envName, namesName, decoderName))
            parts.push(line);
        parts.push(`local function ${resolverName}(key)`);
        parts.push(`  if ${envName}[key] == nil then`);
        parts.push(`    ${envName}[key] = _G[key]`);
        parts.push(`  end`);
        parts.push(`  return ${envName}[key]`);
        parts.push(`end`);
        const handlerFuncs = [];
        const handlerTableEntries = [];
        for (const op of tableOps) {
            const hName = `_h${r.nextInt(100000, 999999)}`;
            const body = handlerBody(op, v, constRefHandler);
            if (!body) {
                handlerFuncs.push(`local function ${hName}(${S}, instr, ctx)
end`);
            }
            else {
                handlerFuncs.push(`local function ${hName}(${S}, instr, ctx)
  ${body}
end`);
            }
            handlerTableEntries.push(`${op}=${hName}`);
        }
        parts.push(`local ${vmName}`);
        for (const hf of handlerFuncs)
            parts.push(hf);
        parts.push(`local ${handlersName} = {}`);
        for (const entry of handlerTableEntries) {
            const [key, val] = entry.split("=");
            parts.push(`${handlersName}[${key}] = ${val}`);
        }
        const vmCodeParts = [];
        vmCodeParts.push(`${vmName} = function(protoIdx, ${envName}, args)`);
        vmCodeParts.push(`  local proto = ${protosName}[protoIdx]`);
        vmCodeParts.push(`  local bc = proto.bc`);
        vmCodeParts.push(`  local ${S} = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}`);
        vmCodeParts.push(`  for i=1,proto.np or 0 do ${S}.locals[i-1]=${S}.varargs[i] end`);
        vmCodeParts.push(`  while true do`);
        vmCodeParts.push(`    local instr = bc[${S}.pc + 1]`);
        vmCodeParts.push(`    if instr == nil then break end`);
        vmCodeParts.push(`    ${S}.pc = ${S}.pc + 1`);
        vmCodeParts.push(`    ${S}.ret = nil`);
        vmCodeParts.push(`    local op = ${revMapName}[instr[1]] or instr[1]`);
        for (let i = 0; i < inlineOps.length; i++) {
            const op = inlineOps[i];
            const body = handlerBody(op, v, constRefInline);
            const keyword = i === 0 ? "if" : "elseif";
            vmCodeParts.push(`    ${keyword} op == ${op} then`);
            if (body) {
                for (const bline of body.split("\n")) {
                    vmCodeParts.push(`      ${bline}`);
                }
            }
        }
        if (inlineOps.length > 0) {
            vmCodeParts.push(`    end`);
            vmCodeParts.push(`    local handler = ${handlersName}[op]`);
            vmCodeParts.push(`    if handler then handler(${S}, instr, {pIdx=protoIdx}) end`);
        }
        else {
            vmCodeParts.push(`    local handler = ${handlersName}[op]`);
            vmCodeParts.push(`    if handler then handler(${S}, instr, {pIdx=protoIdx}) end`);
        }
        vmCodeParts.push(`    if ${S}.halt then break end`);
        vmCodeParts.push(`    if ${S}.ret then return table.unpack(${S}.ret) end`);
        vmCodeParts.push(`  end`);
        vmCodeParts.push(`  return nil`);
        vmCodeParts.push(`end`);
        vmCodeParts.push(`${vmName}(0, ${envName}, {})`);
        parts.push(vmCodeParts.join("\n"));
        return parts.join("\n");
    }
}
// ───────────────────────────────────────────────────────────────────
// Profile E — Register-file VM with packed instruction encoding.
//
// Structural differences vs A–D:
//   • Register file R[T] instead of stack[sp]
//   • Packed-integer bytecode (single integers, not {op,arg1,arg2} arrays)
//   • Table dispatch with runtime-scrambled handler construction
//   • Constants stored as lazy-evaluated arithmetic expressions (no pool table)
//   • Environment resolved through indirect lookup chains (no big env table)
//   • Randomized code-block ordering
// ───────────────────────────────────────────────────────────────────
export class ProfileE {
    name = "profileE";
    description = "Register-file VM with array instructions, double-shuffle opcodes, table dispatch, lazy constant reconstruction";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        remapOps(protos, opTables);
        const mapping = generateOpcodeMapping(ALL_OPS, r, "double-shuffle");
        const encodedProtos = mapping.encodeInstrs(protos);
        const v = makeRegisterVars(r, rndName(r, "vm"));
        const R = v.R;
        const S = v.S;
        const L = v.L;
        const V = v.V;
        const instr = v.instr;
        const names = v.names;
        const bcps = v.binOps;
        const uops = v.unaryOps;
        const vmName = v.vmName;
        const env = v.env;
        const cp = v.cp;
        const protosName = rndName(r, "ps");
        const handlersName = rndName(r, "hd");
        const revMapName = rndName(r, "rm");
        const sem = createSemEncoder(r);
        const revMap = new Map();
        for (const op of ALL_OPS)
            revMap.set(mapping.encodeValue(op), op);
        const revEntries = [];
        for (const [encOp, orig] of revMap.entries())
            revEntries.push(`[${encOp}]=${orig}`);
        const allOpsShuffled = r.shuffle([...ALL_OPS]);
        const handlerFuncs = [];
        const handlerTableEntries = [];
        const constAccess = `${sem.D}(${cp}[${instr}[2]])`;
        for (const op of allOpsShuffled) {
            const origOp = op;
            const hName = `_h${r.nextInt(100000, 999999)}`;
            const body = registerHandlerBody(op, v, constAccess);
            handlerFuncs.push(`local function ${hName}(${R},${instr},_pi,${S},${L},${V},${names},${bcps},${uops},${cp})`);
            if (body) {
                handlerFuncs.push(`  ${body}`);
            }
            handlerFuncs.push(`end`);
            handlerTableEntries.push(`${origOp}=${hName}`);
        }
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(sem.code);
        parts.push(generateNamesTable(globals, v.names, sem));
        parts.push(generateProtosTable(encodedProtos, protosName, v.cp, sem));
        parts.push(`local ${revMapName}={${revEntries.join(",")}}`);
        parts.push(`local ${bcps}={${opTables.binOpsCode}}`);
        parts.push(`local ${uops}={${opTables.unaryOpsCode}}`);
        parts.push(`local ${env}={}`);
        for (const line of generateEnvInit(globals, env, v.names, context.stringPoolDecoderName))
            parts.push(line);
        parts.push(`local ${handlersName}={};`);
        for (const hf of handlerFuncs)
            parts.push(hf);
        for (const entry of r.shuffle(handlerTableEntries)) {
            const [key, val] = entry.split("=");
            if (r.nextBool(0.5)) {
                parts.push(`${handlersName}[${key}]=${val}`);
            }
            else {
                parts.push(`${handlersName}[${key}]=${handlersName}[${key}] or ${val}`);
            }
        }
        const vmCode = `${vmName}=function(protoIdx,${env},args)
local proto=${protosName}[protoIdx] local bc=proto.bc local ${cp}=proto.${cp}
  local ${R}={} local ${S}={sp=-1,pc=0,ret=nil,halt=false} local ${L}={} local ${V}=args or {}
  for i=1,proto.np or 0 do ${L}[i-1]=${V}[i] end
  while true do
    local ${instr}=bc[${S}.pc+1]
    if ${instr}==nil then break end
    ${S}.pc=${S}.pc+1
    ${S}.ret=nil
    local op=${revMapName}[${instr}[1]] or ${instr}[1]
    local h=${handlersName}[op]
    if h then h(${R},${instr},protoIdx,${S},${L},${V},${names},${bcps},${uops},${cp}) end
    if ${S}.halt then break end
    if ${S}.ret then return table.unpack(${S}.ret) end
  end
  return nil
end`;
        const vmAssign = `${vmName}(0,${env},{})`;
        parts.push(vmCode);
        parts.push(vmAssign);
        return parts.join("\n");
    }
}
