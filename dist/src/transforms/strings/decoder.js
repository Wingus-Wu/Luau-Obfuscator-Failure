/** Compact XOR helpers for string decoding. Preserves byte-wise XOR behavior
 *  without emitting a 256-entry lookup table. */
export function generatePortableXorFunction(fnName) {
    return ("local function " + fnName +
        "(a,b) local r,m=0,1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end " +
        "a=math.floor(a/2) b=math.floor(b/2) m=m*2 end return r end");
}
export function generateXorDecoderBody(decoderName, xorFnName, keyExpr, cacheName, poolName) {
    return [
        "local " + cacheName + " = {}",
        "local function " + decoderName + "(input)",
        "  local _decoded = " + poolName + "[input]",
        "  if _decoded then input = _decoded end",
        "  if " + cacheName + "[input] then return " + cacheName + "[input] end",
        "  local n = #input",
        "  local buf = {}",
        "  for i = 1, n do",
        "    buf[i] = string.char(" + xorFnName + "(string.byte(input, i), " + keyExpr + "))",
        "  end",
        "  local result = table.concat(buf)",
        "  " + cacheName + "[input] = result",
        "  return result",
        "end",
    ].join("\n");
}
export function generateRotateDecoderBody(decoderName, offset, cacheName, poolName) {
    return [
        "local " + cacheName + " = {}",
        "local function " + decoderName + "(input)",
        "  local _decoded = " + poolName + "[input]",
        "  if _decoded then input = _decoded end",
        "  if " + cacheName + "[input] then return " + cacheName + "[input] end",
        "  local n = #input",
        "  local buf = {}",
        "  for i = 1, n do",
        "    buf[i] = string.char((string.byte(input, i) - " + offset + " + 256) % 256)",
        "  end",
        "  local result = table.concat(buf)",
        "  " + cacheName + "[input] = result",
        "  return result",
        "end",
    ].join("\n");
}
export function generateXorChunkedDecoderBody(decoderName, xorFnName, chunkSize, keysTableName, cacheName, poolName) {
    return [
        "local " + cacheName + " = {}",
        "local function " + decoderName + "(input)",
        "  local _decoded = " + poolName + "[input]",
        "  if _decoded then input = _decoded end",
        "  if " + cacheName + "[input] then return " + cacheName + "[input] end",
        "  local n = #input",
        "  local buf = {}",
        "  for i = 1, n do",
        "    local key_idx = math.ceil(i / " + chunkSize + ")",
        "    local _b = string.byte(input, i)",
        "    buf[i] = string.char(" + xorFnName + "(_b, " + keysTableName + "[key_idx]))",
        "  end",
        "  local result = table.concat(buf)",
        "  " + cacheName + "[input] = result",
        "  return result",
        "end",
    ].join("\n");
}
/** Drop duplicate `local <name> = {}` declarations (Luau rejects redefinition). */
export function dedupeEmptyLocalTables(code) {
    const seen = new Set();
    return code.replace(/^local\s+([A-Za-z_][\w]*)\s*=\s*\{\}\s*$/gm, (full, name) => {
        if (seen.has(name))
            return "";
        seen.add(name);
        return full;
    }).replace(/\n{3,}/g, "\n\n");
}
