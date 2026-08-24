import fengari from "fengari";
const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari;

import fs from "fs";

function runLua(source, name) {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);

  const stdout = [];
  const stderr = [];

  // Override print to capture output
  lua.lua_getglobal(L, "print");
  lua.lua_pushlightuserdata(L, { stdout, stderr });
  lua.lua_pushcclosure(L, (L_ref) => {
    const L = L_ref;
    const handler = lua.lua_touserdata(L, lua.lua_upvalueindex(1));
    const n = lua.lua_gettop(L);
    const parts = [];
    for (let i = 1; i <= n; i++) {
      const val = lua.lua_tostring(L, i);
      if (val !== undefined) {
        parts.push(to_jsstring(val));
      } else if (lua.lua_isboolean(L, i)) {
        parts.push(lua.lua_toboolean(L, i) ? "true" : "false");
      } else if (lua.lua_isnil(L, i)) {
        parts.push("nil");
      } else {
        parts.push(String(lua.lua_tonumber(L, i)));
      }
    }
    handler.stdout.push(parts.join("\t"));
    return 0;
  }, 1);
  lua.lua_setglobal(L, "print");

  // Override error to capture error messages
  lua.lua_getglobal(L, "error");
  lua.lua_pushlightuserdata(L, { stderr });
  lua.lua_pushcclosure(L, (L_ref) => {
    const L = L_ref;
    const handler = lua.lua_touserdata(L, lua.lua_upvalueindex(1));
    const msg = lua.lua_tostring(L, 1) ? to_jsstring(lua.lua_tostring(L, 1)) : "unknown error";
    handler.stderr.push(msg);
    lua.lua_pushstring(L, to_luastring(msg));
    return 1;
  }, 1);
  lua.lua_setglobal(L, "error");

  const loadResult = lauxlib.luaL_loadstring(L, to_luastring(source));
  if (loadResult !== 0) {
    const err = to_jsstring(lua.lua_tostring(L, -1));
    console.log(`[${name}] Load Error:`, err);
    return;
  }

  const pcallResult = lua.lua_pcall(L, 0, 0, 0);
  if (pcallResult !== 0) {
    const err = to_jsstring(lua.lua_tostring(L, -1));
    console.log(`[${name}] Runtime Error:`, err);
    return;
  }

  console.log(`[${name}] Success!`);
  console.log(`Output: ${stdout.join("\n")}`);
}

// Test original
const originalCode = fs.readFileSync("test_or.lua", "utf8");
console.log("=== Original ===");
runLua(originalCode, "original");

// Test obfuscated
const obfuscatedCode = fs.readFileSync("test_or_vm.lua", "utf8");
console.log("\n=== Obfuscated (vm only) ===");
runLua(obfuscatedCode, "vm_only");