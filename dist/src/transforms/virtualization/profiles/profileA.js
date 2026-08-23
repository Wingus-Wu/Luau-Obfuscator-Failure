import { rndName, luaStr, ALL_OPS, makeOpTables, generateOpcodeMapping, handlerBody, makeVars, generateBit32Fallback, generateNamesTable, generateProtosTable, generateSplitConstantPools, } from "./base.js";
import { BINARY_OP_CODES, UNARY_OP_CODES } from "../vm.js";
const OP = {
    Nop: 1, PushConst: 2, PushGlobal: 3, PopGlobal: 4, PushLocal: 5, PopLocal: 6,
    Pop: 7, Dup: 8, Call: 9, CallMethod: 10, Return: 11, Jump: 12,
    JumpIfFalse: 13, JumpIfTrue: 14, NewTable: 15, SetList: 16,
    Concat: 17, Len: 18, Binary: 19, Unary: 20, GetProperty: 21, SetProperty: 22,
    GetIndex: 23, SetIndex: 24, LoadProto: 25, Close: 26, Vararg: 27, Nil: 28, Halt: 29,
};
export class ProfileA {
    name = "profileA";
    description = "Handler function-table dispatcher, XOR+shuffle opcodes, split constant pools, lazy environment resolver";
    generateRuntime(result, context) {
        const r = context.random;
        const { protos, globals } = result;
        const opTables = makeOpTables(r);
        this.remapBinaryUnary(protos, opTables);
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
        const revMap = new Map();
        for (const op of ALL_OPS) {
            revMap.set(mapping.encodeValue(op), op);
        }
        const allOpsShuffled = r.shuffle([...ALL_OPS]);
        const handlerFuncs = [];
        const handlerTableEntries = [];
        const S = v.S;
        for (const op of allOpsShuffled) {
            const encOp = mapping.encodeValue(op);
            const hName = `_h${r.nextInt(100000, 999999)}`;
            if (op === OP.PushConst) {
                const body = `${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=${splitPoolsName}[ctx.pIdx][ctx.__d][${v.instr}[2]]`;
                handlerFuncs.push(`local function ${hName}(S, instr, ctx)
  ${body}
end`);
            }
            else if (op === OP.PushGlobal) {
                const body = `${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=${resolverName}(${namesName}[${v.instr}[2]])`;
                handlerFuncs.push(`local function ${hName}(S, instr, ctx)
  ${body}
end`);
            }
            else if (op === OP.PopGlobal) {
                const body = `${resolverName}(${namesName}[${v.instr}[2]]) = ${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1`;
                handlerFuncs.push(`local function ${hName}(S, instr, ctx)
  ${body}
end`);
            }
            else {
                let constRef;
                if (op === OP.PushConst) {
                    constRef = `${splitPoolsName}[ctx.pIdx][__d][${v.instr}[2]]`;
                }
                else {
                    constRef = "nil";
                }
                const body = handlerBody(op, v, constRef);
                if (op === OP.Return) {
                    handlerFuncs.push(`local function ${hName}(S, instr, ctx)
  ${body}
end`);
                }
                else if (op === OP.Halt) {
                    handlerFuncs.push(`local function ${hName}(S, instr, ctx)
  ${body}
end`);
                }
                else if (body) {
                    handlerFuncs.push(`local function ${hName}(S, instr, ctx)
  ${body}
end`);
                }
                else {
                    handlerFuncs.push(`local function ${hName}(S, instr, ctx)
end`);
                }
            }
            handlerTableEntries.push(`${encOp}=${hName}`);
        }
        const parts = [];
        parts.push(generateBit32Fallback());
        parts.push(generateNamesTable(globals, namesName));
        parts.push(`local ${splitPoolsName} = {}`);
        parts.push(generateSplitConstantPools(encodedProtos, splitPoolsName));
        parts.push(generateProtosTable(encodedProtos, protosName, "cp"));
        parts.push(`local ${binOpsName} = {${opTables.binOpsCode}}`);
        parts.push(`local ${unaryOpsName} = {${opTables.unaryOpsCode}}`);
        parts.push(`local ${envName} = {}`);
        for (const g of globals) {
            parts.push(`${envName}[${luaStr(g)}] = ${g}`);
        }
        parts.push(`local function ${resolverName}(key)`);
        parts.push(`  if ${envName}[key] == nil and key ~= "nil" then`);
        parts.push(`    ${envName}[key] = _G[key]`);
        parts.push(`  end`);
        parts.push(`  return ${envName}[key]`);
        parts.push(`end`);
        for (const hf of handlerFuncs)
            parts.push(hf);
        parts.push(`local ${handlersName} = {}`);
        for (const entry of handlerTableEntries) {
            parts.push(`${handlersName}[${entry.split("=")[0]}] = ${entry.split("=")[1]}`);
        }
        const revEntries = [];
        for (const [enc, orig] of revMap.entries()) {
            revEntries.push(`[${enc}]=${orig}`);
        }
        const vmCode = `local function ${vmName}(protoIdx, ${envName}, args)
  local proto = ${protosName}[protoIdx]
  local bc = proto.bc
  local ctx = {pIdx=protoIdx, __d=(${splitPoolsName}[protoIdx] or {}).__d or {}}
  local S = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do S.locals[i-1]=S.varargs[i] end
  while true do
    local instr = bc[S.pc + 1]
    if instr == nil then break end
    S.pc = S.pc + 1
    local op = ({${revEntries.join(",")}})[instr[1]] or instr[1]
    local handler = ${handlersName}[op]
    if handler == nil then break end
    handler(S, instr, ctx)
    if S.halt then break end
    if S.ret then return table.unpack(S.ret) end
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
