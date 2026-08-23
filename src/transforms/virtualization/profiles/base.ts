import type { CompiledProto, CompilationResult } from "../vm.js";
import type { TransformContext } from "../../transform.js";
import { generatePortableXorFunction, generateXorDecoderBody, generateRotateDecoderBody, generateXorChunkedDecoderBody, dedupeEmptyLocalTables } from "../../strings/decoder.js";

export interface VMProfile {
  name: string;
  description: string;
  generateRuntime(result: CompilationResult, context: TransformContext): string;
}

export type OpcodeEncoding = "xor" | "shuffle" | "add" | "double-shuffle" | "xor-shuffle";
export type InstructionFormat = "array" | "packed";

function hexChars(random: any, len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) {
    s += chars[random.nextInt(0, chars.length - 1)];
  }
  return s;
}

export function rndName(random: any, prefix: string, len: number = 8): string {
  return "_" + prefix + hexChars(random, len);
}

export function luaStr(value: string): string {
  let result = "\"";
  for (const ch of value) {
    switch (ch) {
      case "\"": result += "\\\""; break;
      case "\\": result += "\\\\"; break;
      case "\n": result += "\\n"; break;
      case "\r": result += "\\r"; break;
      case "\t": result += "\\t"; break;
      case "\0": result += "\\000"; break;
      default:
        if (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) > 126) {
          result += "\\" + ch.charCodeAt(0).toString(10).padStart(3, "0");
        } else {
          result += ch;
        }
    }
  }
  result += "\"";
  return result;
}

export function luaVal(value: any): string {
  if (value === null) return "nil";
  if (typeof value === "string") return luaStr(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export const ALL_OPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

export const BINARY_OP_DEFS: { symbol: string; code: string }[] = [
  { symbol: "+", code: "function(a,b) return a + b end" },
  { symbol: "-", code: "function(a,b) return a - b end" },
  { symbol: "*", code: "function(a,b) return a * b end" },
  { symbol: "/", code: "function(a,b) return a / b end" },
  { symbol: "%", code: "function(a,b) return a % b end" },
  { symbol: "^", code: "function(a,b) return a ^ b end" },
  { symbol: "==", code: "function(a,b) return a == b end" },
  { symbol: "~=", code: "function(a,b) return a ~= b end" },
  { symbol: "<", code: "function(a,b) return a < b end" },
  { symbol: ">", code: "function(a,b) return a > b end" },
  { symbol: "<=", code: "function(a,b) return a <= b end" },
  { symbol: ">=", code: "function(a,b) return a >= b end" },
  { symbol: "..", code: "function(a,b) return tostring(a) .. tostring(b) end" },
  { symbol: "and", code: "function(a,b) return a and b end" },
  { symbol: "or", code: "function(a,b) return a or b end" },
  { symbol: "&", code: "function(a,b) return bit32.band(a, b) end" },
  { symbol: "|", code: "function(a,b) return bit32.bor(a, b) end" },
  { symbol: "<<", code: "function(a,b) return bit32.lshift(a, b) end" },
  { symbol: ">>", code: "function(a,b) return bit32.rshift(a, b) end" },
  { symbol: "//", code: "function(a,b) return a // b end" },
];

export const UNARY_OP_DEFS: { symbol: string; code: string }[] = [
  { symbol: "-", code: "function(a) return -a end" },
  { symbol: "not", code: "function(a) return not a end" },
  { symbol: "#", code: "function(a) return #a end" },
  { symbol: "~", code: "function(a) return bit32.bnot(a) end" },
];

export interface OpTables {
  binOpsCode: string;
  unaryOpsCode: string;
  symbolToBinCode: Record<string, number>;
  symbolToUnaryCode: Record<string, number>;
}

export function makeOpTables(random: any): OpTables {
  const shBin = random.shuffle([...BINARY_OP_DEFS]);
  const shUn = random.shuffle([...UNARY_OP_DEFS]);
  const symbolToBinCode: Record<string, number> = {};
  const symbolToUnaryCode: Record<string, number> = {};
  for (let i = 0; i < shBin.length; i++) symbolToBinCode[shBin[i].symbol] = i + 1;
  for (let i = 0; i < shUn.length; i++) symbolToUnaryCode[shUn[i].symbol] = i + 1;
  const binOpsCode = shBin.map((op, i) => `[${i + 1}]=${op.code}`).join(",");
  const unaryOpsCode = shUn.map((op, i) => `[${i + 1}]=${op.code}`).join(",");
  return { binOpsCode, unaryOpsCode, symbolToBinCode, symbolToUnaryCode };
}

export const BINARY_OP_CODES: Record<string, number> = {
  "+": 1, "-": 2, "*": 3, "/": 4, "%": 5, "^": 6,
  "==": 7, "~=": 8, "<": 9, ">": 10, "<=": 11, ">=": 12,
  "..": 13, "and": 14, "or": 15, "&": 16, "|": 17,
  "<<": 18, ">>": 19, "//": 20,
};

export const UNARY_OP_CODES: Record<string, number> = {
  "-": 1, "not": 2, "#": 3, "~": 4,
};

export interface OpcodeMappingResult {
  encodeInstrs: (protos: CompiledProto[]) => CompiledProto[];
  decodeLua: string;
  encodeValue: (op: number) => number;
}

export function generateOpcodeMapping(
  allOps: number[],
  random: any,
  encoding: OpcodeEncoding,
  xorKey?: number
): OpcodeMappingResult {
  if (encoding === "xor") {
    const key = xorKey ?? random.nextInt(1, 255);
    const encode = (op: number) => op ^ key;
    return {
      encodeValue: encode,
      decodeLua: `(instr[1] and bit32.bxor(instr[1], ${key})) or instr[1]`,
      encodeInstrs: (protos) => {
        return protos.map(proto => ({
          ...proto,
          instructions: proto.instructions.map(instr => {
            if (Array.isArray(instr) && (instr as any)[0] === "raw") return instr;
            if (!Array.isArray(instr)) return instr;
            const arr = [...(instr as any[])];
            arr[0] = encode(arr[0] as number);
            return arr;
          }),
        }));
      },
    };
  }

  if (encoding === "shuffle") {
    const shuffled = random.shuffle([...allOps]);
    const encode = (op: number) => shuffled[allOps.indexOf(op)] ?? op;
    const revEntries: string[] = [];
    for (let i = 0; i < allOps.length; i++) {
      revEntries.push(`[${shuffled[i]}]=${allOps[i]}`);
    }
    return {
      encodeValue: encode,
      decodeLua: `({${revEntries.join(",")}})[instr[1]] or instr[1]`,
      encodeInstrs: (protos) => {
        return protos.map(proto => ({
          ...proto,
          instructions: proto.instructions.map(instr => {
            if (Array.isArray(instr) && (instr as any)[0] === "raw") return instr;
            if (!Array.isArray(instr)) return instr;
            const arr = [...instr as number[]];
            const idx = allOps.indexOf(arr[0] as number);
            if (idx >= 0) arr[0] = shuffled[idx];
            return arr;
          }),
        }));
      },
    };
  }

  if (encoding === "add") {
    const key = random.nextInt(1, 250);
    const shuffled = random.shuffle([...allOps]);
    const encode = (op: number) => {
      const idx = allOps.indexOf(op);
      return idx >= 0 ? (shuffled[idx] + key) % 256 : op;
    };
    const subEntries: string[] = [];
    for (let i = 0; i < 256; i++) subEntries.push(`[${i}]=${(i + key) % 256}`);
    const revEntries: string[] = [];
    for (let i = 0; i < allOps.length; i++) {
      const enc = (shuffled[i] + key) % 256;
      revEntries.push(`[${enc}]=${allOps[i]}`);
    }
    return {
      encodeValue: encode,
      decodeLua: `({${revEntries.join(",")}})[{${subEntries.join(",")}}[instr[1]]] or instr[1]`,
      encodeInstrs: (protos) => {
        return protos.map(proto => ({
          ...proto,
          instructions: proto.instructions.map(instr => {
            if (Array.isArray(instr) && (instr as any)[0] === "raw") return instr;
            if (!Array.isArray(instr)) return instr;
            const arr = [...instr as number[]];
            const idx = allOps.indexOf(arr[0] as number);
            if (idx >= 0) arr[0] = (shuffled[idx] + key) % 256;
            return arr;
          }),
        }));
      },
    };
  }

  if (encoding === "double-shuffle") {
    const sh1 = random.shuffle([...allOps]);
    const sh2 = random.shuffle([...allOps]);
    const encode = (op: number) => {
      const idx = allOps.indexOf(op);
      return idx >= 0 ? sh2[sh1[idx] - 1] : op;
    };
    const revEntries: string[] = [];
    for (let i = 0; i < allOps.length; i++) {
      const enc = sh2[sh1[i] - 1];
      revEntries.push(`[${enc}]=${allOps[i]}`);
    }
    return {
      encodeValue: encode,
      decodeLua: `({${revEntries.join(",")}})[instr[1]] or instr[1]`,
      encodeInstrs: (protos) => {
        return protos.map(proto => ({
          ...proto,
          instructions: proto.instructions.map(instr => {
            if (Array.isArray(instr) && (instr as any)[0] === "raw") return instr;
            if (!Array.isArray(instr)) return instr;
            const arr = [...instr as number[]];
            const idx = allOps.indexOf(arr[0] as number);
            if (idx >= 0) arr[0] = sh2[sh1[idx] - 1];
            return arr;
          }),
        }));
      },
    };
  }

  const key = xorKey ?? random.nextInt(1, 255);
  const shuffled = random.shuffle([...allOps]);
  const encode = (op: number) => (shuffled[allOps.indexOf(op)] ?? op) ^ key;
  const revEntries: string[] = [];
  for (let i = 0; i < allOps.length; i++) {
    const enc = shuffled[i] ^ key;
    revEntries.push(`[${enc}]=${allOps[i]}`);
  }
  return {
    encodeValue: encode,
    decodeLua: `({${revEntries.join(",")}})[instr[1] and bit32.bxor(instr[1], ${key})] or instr[1]`,
    encodeInstrs: (protos) => {
      return protos.map(proto => ({
        ...proto,
        instructions: proto.instructions.map(instr => {
          if (Array.isArray(instr) && (instr as any)[0] === "raw") return instr;
          if (!Array.isArray(instr)) return instr;
          const arr = [...instr as number[]];
          const idx = allOps.indexOf(arr[0] as number);
          if (idx >= 0) arr[0] = (shuffled[idx] ^ key);
          return arr;
        }),
      }));
    },
  };
}

export interface HandlerVars {
  S: string;
  instr: string;
  names: string;
  binOps: string;
  unaryOps: string;
  vmName: string;
  env: string;
  cp: string;
  bc: string;
  nilSentinel: string;
}

export function makeVars(random: any, vmName: string): HandlerVars {
  return {
    S: rndName(random, "st"),
    instr: "instr",
    names: rndName(random, "nm"),
    binOps: rndName(random, "bc"),
    unaryOps: rndName(random, "un"),
    vmName,
    env: rndName(random, "en"),
    cp: rndName(random, "cp"),
     bc: "bc",
     nilSentinel: rndName(random, "nil"),
  };
}

export function handlerBody(op: number, v: HandlerVars, constAccess: string): string {
  const S = v.S;
  const instr = v.instr;
  const env = v.env;
  const names = v.names;
  const bcps = v.binOps;
  const uops = v.unaryOps;
  const vm = v.vmName;

  switch (op) {
    case 1:  return "";
    case 2:  return `${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=${constAccess}`;
    case 3:  return `${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=${env}[${names}[${instr}[2]]]`;
    case 4:  return `${env}[${names}[${instr}[2]]]=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1`;
    case 5:  return `${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=${S}.locals[${instr}[2]]`;
    case 6:  return `local _idx=${instr}[2]; ${S}.locals[_idx]=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1`
    case 7:  return `${S}.sp=${S}.sp-${instr}[2]`;
    case 8:  return `${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=${S}.stack[${S}.sp-1]`;
     case 9:  return `local nargs=${instr}[2]
      local nresults=${instr}[3] or 1
      local fn=${S}.stack[${S}.sp-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=${S}.stack[${S}.sp-nargs+i] end
      ${S}.sp=${S}.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs))}
      for i=1,nresults do ${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=rets[i] end`;
    case 10: return `local nargs=${instr}[2]
      local nresults=${instr}[3] or 1
      local methodName=${S}.stack[${S}.sp]
      ${S}.sp=${S}.sp-1
      local obj=${S}.stack[${S}.sp-nargs]
      local fn=obj[methodName]
      local callArgs={obj}
      for i=1,nargs do callArgs[i+1]=${S}.stack[${S}.sp-nargs+i] end
      ${S}.sp=${S}.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs+1))}
      for i=1,nresults do ${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=rets[i] end`;
    case 11: return `local nret=${instr}[2]
      local rets={}
      for i=nret,1,-1 do
        rets[i]=${S}.stack[${S}.sp]
        ${S}.sp=${S}.sp-1
      end
      ${S}.ret=rets`;
    case 12: return `${S}.pc=${instr}[2]`;
    case 13: return `local v=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1
      if not v then ${S}.pc=${instr}[2] end`;
    case 14: return `local v=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1
      if v then ${S}.pc=${instr}[2] end`;
    case 15: return `${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]={}`;
    case 16: return `local t=${S}.stack[${S}.sp-1]; local val=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; t[#t+1]=val`;
    case 17: return `local b=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; local a=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; ${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=tostring(a)..tostring(b)`;
    case 18: return `${S}.stack[${S}.sp]=#${S}.stack[${S}.sp]`;
    case 19: return `local b=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; local a=${S}.stack[${S}.sp]; ${S}.stack[${S}.sp]=${bcps}[${instr}[2]](a,b)`;
    case 20: return `${S}.stack[${S}.sp]=${uops}[${instr}[2]](${S}.stack[${S}.sp])`;
    case 21: return `${S}.stack[${S}.sp]=${S}.stack[${S}.sp][${constAccess}]`;
    case 22: return `local obj=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; local val=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; obj[${constAccess}]=val`;
    case 23: return `local idx=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; local obj=${S}.stack[${S}.sp]; ${S}.stack[${S}.sp]=obj[idx]`;
    case 24: return `local val=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; local idx=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; local obj=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1; obj[idx]=val`;
    case 25: return `${S}.sp=${S}.sp+1
      local _pi=${instr}[2]
      local _vmf=${vm}
      ${S}.stack[${S}.sp]=function(...)
        local _args={...}
        local _rets={_vmf(_pi,${env},_args)}
        if #_rets>0 then return table.unpack(_rets) end
        return nil
      end`;
    case 26: return "";
    case 27: return `for i=1,#${S}.varargs do ${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=${S}.varargs[i] end`;
    case 28: return `${S}.sp=${S}.sp+1; ${S}.stack[${S}.sp]=nil`;
    case 29: return `${S}.halt=true`;
    case 30: return `local t=${S}.stack[${S}.sp]
      for i=1,#${S}.varargs do t[#t+1]=${S}.varargs[i] end`;
    default:  return "";
  }
}

export function generateBit32Fallback(): string {
  return `if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end`;
}

export interface SemEncoder {
  key: number;
  D: string;
  lut: string;
  cache: string;
  code: string;
  encodeStr(s: string): string;
  encodeVal(v: any): string;
}

export function createSemEncoder(random: any): SemEncoder {
  const key = random.nextInt(1, 255);
  const lut = rndName(random, "lut");
  const cache = rndName(random, "dc");
  const D = rndName(random, "dec");
  const code =
    `local ${lut}={};for _i=0,255 do ${lut}[_i]=bit32.bxor(_i,${key}) end;local ${cache}={};` +
    `local function ${D}(v)\n` +
    `  local c=${cache}[v]; if c~=nil then return c end\n` +
    `  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(${lut}[v[i]])end;return s end)\n` +
    `  if ok then ${cache}[v]=r;return r end\n` +
    `  return v\n` +
    `end`;
  return {
    key,
    D,
    lut,
    cache,
    code,
    encodeStr(s: string): string {
      const bytes: number[] = [];
      for (let i = 0; i < s.length; i++) {
        bytes.push(s.charCodeAt(i) ^ key);
      }
      return `{${bytes.join(",")}}`;
    },
    encodeVal(v: any): string {
      if (typeof v === "string") return this.encodeStr(v);
      return luaVal(v);
    },
  };
}

export function generateNamesTable(globals: string[], namesName: string, sem?: SemEncoder): string {
  if (globals.length === 0) return `local ${namesName} = {}`;
  if (sem) {
    const rawName = namesName + "_r";
    const encodedEntries = `[0]=${globals.map(g => sem.encodeStr(g)).join(",")}`;
    return `local ${rawName}={${encodedEntries}};local ${namesName}={};` +
      `setmetatable(${namesName},{__index=function(_,k)\n` +
      `  local v=rawget(${rawName},k);local d=${sem.D}(v);rawset(${namesName},k,d);return d\n` +
      `end})`;
  }
  const entries = `[0]=${globals.map(g => luaStr(g)).join(",")}`;
  return `local ${namesName} = {${entries}}`;
}

export function generateEnvInit(globals: string[], envName: string, namesName: string, decoderName?: string): string[] {
  const lines: string[] = [];
  const n = globals.length;
  if (n > 0) {
    lines.push(`for _i = 0, ${n - 1} do local _n = ${namesName}[_i]; if _n ~= nil then ${envName}[_n] = _G[_n] end end`);
  }
  if (decoderName) {
    lines.push(`${envName}[${luaStr(decoderName)}] = ${decoderName}`);
  }
  return lines;
}

export function generateProtosTable(protos: CompiledProto[], protosName: string, cpVarName?: string, sem?: SemEncoder): string {
  const entries: string[] = [];
  for (let i = 0; i < protos.length; i++) {
    const proto = protos[i];
    const instrEntries: string[] = [];
    for (const instr of proto.instructions as any[]) {
      if (Array.isArray(instr) && (instr as any)[0] === "raw") {
        instrEntries.push(instr[1]);
      } else {
        const vals = instr.map(v => typeof v === "string" ? JSON.stringify(v) : String(v));
        instrEntries.push(`{${vals.join(",")}}`);
      }
    }
    let cpStr = "";
    if (cpVarName) {
      const constEntries = proto.constants.map(c => sem ? sem.encodeVal(c) : luaVal(c));
      cpStr = proto.constants.length > 0
        ? `, ${cpVarName} = {[0]=${constEntries.join(",")}}`
        : `, ${cpVarName} = {}`;
    }
    entries.push(`[${i}] = {bc = {${instrEntries.join(",")}}${cpStr}, np = ${proto.numParams || 0}}`);
  }
  return `local ${protosName} = {${entries.join(",")}}`;
}

export function generateSplitConstantPools(
  protos: CompiledProto[],
  poolsName: string,
  sem?: SemEncoder
): string {
  const parts: string[] = [];
  parts.push(`local ${poolsName} = {}`);
  for (let i = 0; i < protos.length; i++) {
    const proto = protos[i];
    const strings: any[] = [];
    const numbers: any[] = [];
    const booleans: any[] = [];
    const nils: any[] = [];
    const dispatch: number[] = [];
    const subidx: number[] = [];
    const strIdx: number[] = [];
    const numIdx: number[] = [];
    const boolIdx: number[] = [];
    const nilIdx: number[] = [];

    for (const c of proto.constants) {
      if (typeof c === "string") { strings.push(c); dispatch.push(0); strIdx.push(strIdx.length); subidx.push(strings.length - 1); }
      else if (typeof c === "number") { numbers.push(c); dispatch.push(1); numIdx.push(numIdx.length); subidx.push(numbers.length - 1); }
      else if (typeof c === "boolean") { booleans.push(c); dispatch.push(2); boolIdx.push(boolIdx.length); subidx.push(booleans.length - 1); }
      else { nils.push(c); dispatch.push(3); nilIdx.push(nilIdx.length); subidx.push(nils.length - 1); }
    }
    const poolsStr = [strings, numbers, booleans, nils]
      .map(g => g.length === 0 ? "{}" : `{[0]=${g.map(c => sem ? sem.encodeVal(c) : luaVal(c)).join(",")}}`)
      .join(",");
    parts.push(`${poolsName}[${i}] = {[0]=${poolsStr}}`);
    const dStr = dispatch.length > 0 ? `{[0]=${dispatch.join(",")}}` : "{}";
    const sStr = subidx.length > 0 ? `{[0]=${subidx.join(",")}}` : "{}";
    parts.push(`${poolsName}[${i}].__d = ${dStr}`);
    parts.push(`${poolsName}[${i}].__s = ${sStr}`);
  }
  return parts.join("\n");
}

export function generateLazyConstantLoader(
  poolName: string,
  cacheName: string,
  loaderName: string,
  pIdxVar: string,
  instrIdxExpr: string
): string {
  return `local ${cacheName} = {}
local function ${loaderName}(idx, ${pIdxVar})
  if ${pIdxVar} == nil then ${pIdxVar} = 0 end
  local key = ${pIdxVar} * 100003 + idx
  if ${cacheName}[key] ~= nil then return ${cacheName}[key] end
  local val = ${poolName}[${pIdxVar}][idx]
  ${cacheName}[key] = val
  return val
end`;
}

export function generateShuffledConstantPool(
  protos: CompiledProto[],
  poolsName: string,
  random: any,
  sem?: SemEncoder
): string {
  const parts: string[] = [];
  parts.push(`local ${poolsName} = {}`);
  for (let i = 0; i < protos.length; i++) {
    const constants = protos[i].constants;
    const n = constants.length;
    if (n === 0) {
      parts.push(`${poolsName}[${i}] = {}`);
      parts.push(`${poolsName}[${i}].__r = {}`);
      continue;
    }
    const order = random.shuffle([...Array(n).keys()]);
    const shuffled: any[] = [];
    for (const idx of order) {
      shuffled.push(constants[idx]);
    }
    const remap: number[] = [];
    for (let j = 0; j < n; j++) {
      remap[order[j]] = j;
    }
    const constEntries = shuffled.map(c => sem ? sem.encodeVal(c) : luaVal(c));
    parts.push(`${poolsName}[${i}] = {[0]=${constEntries.join(",")}}`);
    parts.push(`${poolsName}[${i}].__r = {[0]=${remap.join(",")}}`);
  }
  return parts.join("\n");
}

export function generateStringPool(context: TransformContext): string {
  if (context.stringPool.size === 0 || !context.stringPoolDecoderName) {
    return "";
  }
  const decoderName = context.stringPoolDecoderName;
  const strategy = context.stringPoolStrategy;
  const params = context.stringPoolStrategyParams;
  const poolValues: string[] = [];
  const sortedIds = Array.from(context.stringPool.keys()).sort((a, b) => a - b);
  for (const id of sortedIds) {
    poolValues.push(context.stringPool.get(id)!.encoded);
  }
  const poolTable = `local ${decoderName}_pool = {${poolValues.map(luaStr).join(",")}};`;

  const cacheName = "_sp_cache_" + decoderName;
  const poolName = decoderName + "_pool";

  let decoderCode: string;
  if (strategy === "xor") {
    const key = params.key;
    const xorFnName = "_sp_xorfn_" + decoderName;
    decoderCode = [
      generatePortableXorFunction(xorFnName),
      generateXorDecoderBody(decoderName, xorFnName, String(key), cacheName, poolName),
    ].join("\n");
  } else if (strategy === "rotate") {
    const offset = params.offset;
    decoderCode = generateRotateDecoderBody(decoderName, offset, cacheName, poolName);
  } else if (strategy === "xor-chunked") {
    const chunkSize = params.chunkSize;
    const keys = params.keys;
    const xorFnName = "_sp_xorfn_" + decoderName;
    const keysTable = `_sp_k_${decoderName}`;
    decoderCode = [
      `local ${keysTable}={${keys.join(",")}}`,
      generatePortableXorFunction(xorFnName),
      generateXorChunkedDecoderBody(decoderName, xorFnName, chunkSize, keysTable, cacheName, poolName),
    ].join("\n");
  } else {
    const key = params?.key ?? 0;
    const xorFnName = "_sp_xorfn_" + decoderName;
    decoderCode = [
      generatePortableXorFunction(xorFnName),
      generateXorDecoderBody(decoderName, xorFnName, String(key), cacheName, poolName),
    ].join("\n");
  }

  return dedupeEmptyLocalTables(poolTable + "\n" + decoderCode);
}

// ─── Instruction encoding ──────────────────────────────────────────

export interface PackedEncoding {
  opBase: number;
  opMask: number;
  arg1Base: number;
  arg1Mask: number;
  arg2Base: number;
  decodeLua: string;
}

export function generatePackedEncoding(random: any): PackedEncoding {
  const opBits = random.nextInt(5, 6);
  const arg1Bits = 8;
  const opBase = 1 << opBits;
  const arg1Base = 1 << arg1Bits;
  const arg2Base = opBase * arg1Base;
  const varName = "instr";

  const decodeLua =
    `local _o=${varName}%${opBase} ` +
    `local _a1=(${varName}//${opBase})%${arg1Base} ` +
    `local _a2=${varName}//${arg2Base}`;

  return {
    opBase,
    opMask: opBase - 1,
    arg1Base,
    arg1Mask: arg1Base - 1,
    arg2Base,
    decodeLua,
  };
}

export function encodeInstruction(instr: any[], enc: PackedEncoding): number | string {
  if (Array.isArray(instr)) {
    if (instr[0] === "raw") return "raw:" + String(instr[1]);
    const op = (instr[0] as number) & enc.opMask;
    const a1 = ((instr[1] as number) || 0);
    const a2 = ((instr[2] as number) || 0);
    return op + a1 * enc.opBase + a2 * enc.arg2Base;
  }
  return instr;
}

export function generateEncodedProtosTable(
  protos: CompiledProto[],
  protosName: string,
  enc: PackedEncoding,
  cpVarName: string,
): string {
  const entries: string[] = [];
  for (let i = 0; i < protos.length; i++) {
    const proto = protos[i];
    const instrEntries: string[] = [];
    for (const instr of proto.instructions as any[]) {
      if (Array.isArray(instr) && (instr as any)[0] === "raw") {
        instrEntries.push(`"${(instr as any)[1].replace(/"/g, '\\"')}"`);
      } else if (Array.isArray(instr)) {
        instrEntries.push(String(encodeInstruction(instr as number[], enc)));
      } else {
        instrEntries.push(String(instr));
      }
    }
    const constStr = proto.constants.length > 0
      ? `${cpVarName}={${proto.constants.map(c => luaVal(c)).join(",")}}`
      : `${cpVarName}={}`;
    entries.push(`[${i}]={bc={${instrEntries.join(",")}},${constStr},np=${proto.numParams || 0}}`);
  }
  return `local ${protosName}={${entries.join(",")}}`;
}

// ─── Arithmetic constant reconstruction ───────────────────────────

export function constantExpr(value: any, random: any, cpVar: string): string {
  if (value === null || value === undefined) return "nil";
  if (typeof value === "boolean") return value ? "not not 0" : "not 0";
  if (typeof value === "string") return `${cpVar}[${random.nextInt(0, 100000) % 1000}]`;

  if (typeof value === "number") {
    const n = value;
    const strategies = ["split-add", "split-sub", "double-half", "xor-mask", "neg-neg", "mul-div", "identity"];
    const strat = random.pick(strategies);

    switch (strat) {
      case "split-add": {
        if (n === 0) return "0";
        const a = random.nextInt(1, Math.max(1, Math.abs(n) - 1));
        const b = n - a;
        return `${a}+${b}`;
      }
      case "split-sub": {
        if (n === 0) return "0-0";
        const a = n + random.nextInt(1, 100);
        const b = a - n;
        return `${a}-${b}`;
      }
      case "double-half": {
        if (n === 0) return "0*2";
        return `(${n * 2})//2`;
      }
      case "xor-mask": {
        const mask = random.nextInt(1, 999999);
        const masked = Math.floor(n) ^ mask;
        return `bit32.bxor(${masked},${mask})`;
      }
      case "neg-neg": {
        if (n >= 0) return `-${-n}`;
        return `${n}`;
      }
      case "mul-div": {
        if (n === 0) return "0*3";
        const m = random.nextInt(2, 7);
        return `(${n * m})//${m}`;
      }
      case "identity":
      default:
        return String(n);
    }
  }

  return luaVal(value);
}

export function generateArithmeticConstantPool(
  protos: CompiledProto[],
  poolName: string,
  random: any,
): string {
  const parts: string[] = [];
  parts.push(`local ${poolName}={}`);
  for (let i = 0; i < protos.length; i++) {
    const proto = protos[i];
    const constEntries = proto.constants.map(c => constantExpr(c, random, poolName));
    if (constEntries.length > 0) {
      parts.push(`${poolName}[${i}]={[0]=${constEntries.join(",")}}`);
    } else {
      parts.push(`${poolName}[${i}]={}`);
    }
  }
  return parts.join("\n");
}

export interface RegisterHandlerVars {
  R: string;
  S: string;
  L: string;
  V: string;
  instr: string;
  names: string;
  binOps: string;
  unaryOps: string;
  vmName: string;
  env: string;
  cp: string;
  nilSentinel: string;
}

export function makeRegisterVars(random: any, vmName: string): RegisterHandlerVars {
  return {
    R: rndName(random, "R"),
    S: rndName(random, "st"),
    L: rndName(random, "L"),
    V: rndName(random, "V"),
    instr: "instr",
    names: rndName(random, "nm"),
    binOps: rndName(random, "bc"),
    unaryOps: rndName(random, "un"),
    vmName,
    env: rndName(random, "en"),
    cp: rndName(random, "cp"),
    nilSentinel: rndName(random, "nil"),
  };
}

export function registerHandlerBody(op: number, v: RegisterHandlerVars, constAccess: string): string {
  const R = v.R;
  const S = v.S;
  const L = v.L;
  const V = v.V;
  const instr = v.instr;
  const env = v.env;
  const names = v.names;
  const bcps = v.binOps;
  const uops = v.unaryOps;
  const vm = v.vmName;

  switch (op) {
    case 1:  return "";
    case 2:  return `${S}.sp=${S}.sp+1; ${R}[${S}.sp]=${constAccess}`;
    case 3:  return `${S}.sp=${S}.sp+1; ${R}[${S}.sp]=${env}[${names}[${instr}[2]]]`;
    case 4:  return `${env}[${names}[${instr}[2]]]=${R}[${S}.sp]; ${S}.sp=${S}.sp-1`;
    case 5:  return `${S}.sp=${S}.sp+1; ${R}[${S}.sp]=${L}[${instr}[2]]`;
    case 6:  return `${L}[${instr}[2]]=${R}[${S}.sp]; ${S}.sp=${S}.sp-1`;
    case 7:  return `${S}.sp=${S}.sp-${instr}[2]`;
    case 8:  return `${S}.sp=${S}.sp+1; ${R}[${S}.sp]=${R}[${S}.sp-1]`;
     case 9:  return `local nargs=${instr}[2]
      local nresults=${instr}[3]; if nresults==nil then nresults=1 end
      local fn=${R}[${S}.sp-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=${R}[${S}.sp-nargs+i] end
      ${S}.sp=${S}.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs))}
      for i=1,nresults do ${S}.sp=${S}.sp+1; ${R}[${S}.sp]=rets[i] end`;
    case 10: return `local nargs=${instr}[2]
      local nresults=${instr}[3]; if nresults==nil then nresults=1 end
      local methodName=${R}[${S}.sp]
      ${S}.sp=${S}.sp-1
      local obj=${R}[${S}.sp-nargs]
      local fn=obj[methodName]
      local callArgs={obj}
      for i=1,nargs do callArgs[i+1]=${R}[${S}.sp-nargs+i] end
      ${S}.sp=${S}.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs+1))}
      for i=1,nresults do ${S}.sp=${S}.sp+1; ${R}[${S}.sp]=rets[i] end`;
    case 11: return `local nret=${instr}[2]
      local rets={}
      for i=nret,1,-1 do
        rets[i]=${R}[${S}.sp]
        ${S}.sp=${S}.sp-1
      end
      ${S}.ret=rets`;
    case 12: return `${S}.pc=${instr}[2]`;
    case 13: return `local v=${R}[${S}.sp]; ${S}.sp=${S}.sp-1
      if not v then ${S}.pc=${instr}[2] end`;
    case 14: return `local v=${R}[${S}.sp]; ${S}.sp=${S}.sp-1
      if v then ${S}.pc=${instr}[2] end`;
    case 15: return `${S}.sp=${S}.sp+1; ${R}[${S}.sp]={}`;
    case 16: return `local t=${R}[${S}.sp-1]; local val=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; t[#t+1]=val`;
    case 17: return `local b=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; local a=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; ${S}.sp=${S}.sp+1; ${R}[${S}.sp]=tostring(a)..tostring(b)`;
    case 18: return `${R}[${S}.sp]=#${R}[${S}.sp]`;
    case 19: return `local b=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; local a=${R}[${S}.sp]; ${R}[${S}.sp]=${bcps}[${instr}[2]](a,b)`;
    case 20: return `${R}[${S}.sp]=${uops}[${instr}[2]](${R}[${S}.sp])`;
    case 21: return `${R}[${S}.sp]=${R}[${S}.sp][${constAccess}]`;
    case 22: return `local obj=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; local val=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; obj[${constAccess}]=val`;
    case 23: return `local idx=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; local obj=${R}[${S}.sp]; ${R}[${S}.sp]=obj[idx]`;
    case 24: return `local val=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; local idx=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; local obj=${R}[${S}.sp]; ${S}.sp=${S}.sp-1; obj[idx]=val`;
    case 25: return `${S}.sp=${S}.sp+1
      local _pi=${instr}[2]
      local _vmf=${vm}
      ${R}[${S}.sp]=function(...)
        local _args={...}
        local _rets={_vmf(_pi,${env},_args)}
        if #_rets>0 then return table.unpack(_rets) end
        return nil
      end`;
    case 26: return "";
    case 27: return `for i=1,#${V} do ${S}.sp=${S}.sp+1; ${R}[${S}.sp]=${V}[i] end`;
    case 28: return `${S}.sp=${S}.sp+1; ${R}[${S}.sp]=nil`;
    case 29: return `${S}.halt=true`;
    case 30: return `local t=${R}[${S}.sp]
      for i=1,#${V} do t[#t+1]=${V}[i] end`;
    default:  return "";
  }
}

// ─── Deobfuscation resistance analyzer ─────────────────────────────

export interface AnalysisResult {
  score: number;
  findings: { pattern: string; count: number; description: string }[];
}

export function analyzeDeobfuscationResistance(source: string): AnalysisResult {
  const patterns: { pattern: RegExp; description: string; weight: number }[] = [
    { pattern: /while true do/g, description: "VM dispatch loop signature", weight: 3 },
    { pattern: /local\s+\w*\s*=\s*\{\s*bc\s*=/g, description: "Bytecode table signature", weight: 3 },
    { pattern: /local\s+\w*\s*=\s*\{\s*cp\s*=/g, description: "Constant pool signature", weight: 2 },
    { pattern: /pc\s*=\s*pc\s*\+\s*1/g, description: "PC increment pattern", weight: 2 },
    { pattern: /if\s+op\s*==\s*\d+/g, description: "Opcode dispatch chain", weight: 3 },
    { pattern: /local\s+\w+_\w+\s*=\s*\{\}/g, description: "Obvious cache table", weight: 1 },
    { pattern: /string\.char/g, description: "String char decoder", weight: 2 },
    { pattern: /bit32\./g, description: "Bitwise operations", weight: 1 },
    { pattern: /table\.unpack/g, description: "Unpack pattern", weight: 1 },
    { pattern: /pairs\(\s*_G\s*\)/g, description: "Environment from _G", weight: 2 },
    { pattern: /local\s+\w*\s*=\s*\{\s*break/gi, description: "Control flow flattening", weight: 2 },
    { pattern: /if\s+not\s+bit32/g, description: "Bit32 fallback", weight: 2 },
    { pattern: /__d\s*=\s*\{/g, description: "Split pool dispatch", weight: 2 },
    { pattern: /__r\s*=\s*\{/g, description: "Remap table", weight: 2 },
    { pattern: /__s\s*=\s*\{/g, description: "Subindex table", weight: 2 },
  ];

  const findings: { pattern: string; count: number; description: string }[] = [];
  let totalScore = 0;

  for (const { pattern, description, weight } of patterns) {
    const count = (source.match(pattern) || []).length;
    if (count > 0) {
      findings.push({ pattern: pattern.source, count, description });
      totalScore += count * weight;
    }
  }

  return { score: totalScore, findings };
}
