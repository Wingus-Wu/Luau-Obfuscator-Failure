const {ObfuscatorEngine} = require('./dist/src/obfuscator.js');
const fengari = require('fengari');
const fs = require('fs');

// First, test the decoder directly
const source = `local t = {}
t["key"] = 99
print(t["key"])
print(t.key)`;

const engine = new ObfuscatorEngine({
  seed: "diff-index-assignment",
  virtualization: true,
  stringProtection: true,
  constantProtection: false,
  expressionTransforms: false,
  deadCode: false,
  controlFlow: false,
});

const output = engine.generate(source);

// Extract and test the decoder
const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari;
const L = lauxlib.luaL_newstate();
lualib.luaL_openlibs(L);

// Just run the output and capture everything
const stdout = [];
lua.lua_pushlightuserdata(L, { stdout });
lua.lua_pushcclosure(L, (L_ref) => {
  const handler = lua.lua_touserdata(L_ref, lua.lua_upvalueindex(1));
  const n = lua.lua_gettop(L_ref);
  const parts = [];
  for (let i = 1; i <= n; i++) {
    const val = lua.lua_tostring(L_ref, i);
    if (val !== undefined) parts.push(to_jsstring(val));
    else if (lua.lua_isboolean(L_ref, i)) parts.push(lua.lua_toboolean(L_ref, i) ? "true" : "false");
    else if (lua.lua_isnil(L_ref, i)) parts.push("nil");
    else parts.push(String(lua.lua_tonumber(L_ref, i)));
  }
  handler.stdout.push(parts.join("\t"));
  return 0;
}, 1);
lua.lua_setglobal(L, "print");

const status = lauxlib.luaL_loadstring(L, to_luastring(output));
if (status !== 0) {
  console.log('PARSE ERROR:', to_jsstring(lua.lua_tostring(L, -1)));
} else {
  const pcallStatus = lua.lua_pcall(L, 0, 0, 0);
  if (pcallStatus !== 0) {
    console.log('RUNTIME ERROR:', to_jsstring(lua.lua_tostring(L, -1)));
  }
  console.log('STDOUT:', JSON.stringify(stdout));
}

// Now test the decoder directly
const decodeStatus = lauxlib.luaL_loadstring(L, to_luastring(output));
console.log('Load status:', decodeStatus);

// Extract the decoder by evaluating the output and then calling it
const testDecode = `
${output}
-- The decoder has already been called in the main block
-- Let's test with a direct call
-- But we need to know the decoder name and pool index
-- Let's just check if the decoder works
local _test = _sdwgbvnx(1)
print("_test:", _test)
`;
// Can't easily test this way. Let me extract the relevant parts.

// Instead, let's test the decoder in a simpler way
const testOutput = `
${output}
`;
