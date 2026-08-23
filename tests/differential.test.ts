import { describe, it, expect } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";

// fengari-based Lua execution harness
let fengari: any;
try {
  fengari = await import("fengari");
} catch (e) {
  // fengari not available
}

function runLua(source: string): { stdout: string; stderr: string; error: string | null } {
  if (!fengari) {
    return { stdout: "", stderr: "", error: "fengari not available" };
  }

  const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari;

  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);

  const stdout: string[] = [];
  const stderr: string[] = [];

  // Override print to capture output
  lua.lua_getglobal(L, "print");
  lua.lua_pushlightuserdata(L, { stdout, stderr });
  lua.lua_pushcclosure(L, (L_ref: any) => {
    const L = L_ref;
    const handler = lua.lua_touserdata(L, lua.lua_upvalueindex(1));
    const n = lua.lua_gettop(L);
    const parts: string[] = [];
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
  lua.lua_pushcclosure(L, (L_ref: any) => {
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
    return { stdout: stdout.join("\n"), stderr: stderr.join("\n"), error: err };
  }

  const pcallResult = lua.lua_pcall(L, 0, 0, 0);
  if (pcallResult !== 0) {
    const err = to_jsstring(lua.lua_tostring(L, -1));
    return { stdout: stdout.join("\n"), stderr: stderr.join("\n"), error: err };
  }

  return { stdout: stdout.join("\n"), stderr: stderr.join("\n"), error: null };
}

describe("Runtime Differential Testing", () => {
  const cases = [
    {
      name: "hello world and arithmetic",
      source: `print("Hello, world!")

local score = 10
score = score + 5
print(score)`,
      expected: "Hello, world!\n15",
    },
    {
      name: "string variable",
      source: `local x = "hello"
print(x)`,
      expected: "hello",
    },
    {
      name: "table property access",
      source: `local t = {value = 123}
print(t.value)`,
      expected: "123",
    },
    {
      name: "function call",
      source: `local function add(a, b)
    return a + b
end
print(add(2, 3))`,
      expected: "5",
    },
    {
      name: "for loop",
      source: `for i = 1, 3 do
    print(i)
end`,
      expected: "1\n2\n3",
    },
    {
      name: "property assignment",
      source: `local t = {}
t.value = 42
print(t.value)`,
      expected: "42",
    },
    {
      name: "index assignment and access",
      source: `local t = {}
t["key"] = 99
print(t["key"])
print(t.key)`,
      expected: "99\n99",
    },
    {
      name: "method call on table",
      source: `local obj = {x = 10, add = function(self, n) return self.x + n end}
print(obj:add(5))`,
      expected: "15",
    },
    {
      name: "compound assignment",
      source: `local x = 10
x = x + 5
x = x * 2
print(x)`,
      expected: "30",
    },
  ];

  for (const testCase of cases) {
    it(testCase.name, async () => {
      if (!fengari) {
        console.warn("Skipping runtime test - fengari not available");
        expect(true).toBe(true);
        return;
      }

      const originalResult = runLua(testCase.source);
      expect(originalResult.error).toBeNull();
      expect(originalResult.stdout).toBe(testCase.expected);

      const engine = new ObfuscatorEngine({
        seed: "diff-" + testCase.name.replace(/\s+/g, "-"),
        virtualization: true,
        stringProtection: true,
        constantProtection: false,
        expressionTransforms: false,
        deadCode: false,
        controlFlow: false,
      });

      const report = engine.getReport(testCase.source);
      const obfuscatedResult = runLua(report.output);

      if (obfuscatedResult.error) {
        console.log("OBFUSCATED OUTPUT:");
        console.log(report.output);
        console.log("OBFUSCATED ERROR:", obfuscatedResult.error);
      }

      expect(obfuscatedResult.error).toBeNull();
      expect(obfuscatedResult.stdout).toBe(testCase.expected);
    });
  }
});
