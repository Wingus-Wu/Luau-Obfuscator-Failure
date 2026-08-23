import { describe, it, expect } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
import fengari from "fengari";

const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari;

function runLua(source: string): { stdout: string; error: string | null } {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  const stdout: string[] = [];

  lua.lua_getglobal(L, "print");
  lua.lua_pushlightuserdata(L, { stdout });
  lua.lua_pushcclosure(L, (L_ref: any) => {
    const handler = lua.lua_touserdata(L, lua.lua_upvalueindex(1));
    const n = lua.lua_gettop(L_ref);
    const parts: string[] = [];
    for (let i = 1; i <= n; i++) {
      const ttype = lua.lua_type(L_ref, i);
      if (ttype === lua.LUA_TNIL) { parts.push("nil"); }
      else if (ttype === lua.LUA_TBOOLEAN) { parts.push(lua.lua_toboolean(L_ref, i) ? "true" : "false"); }
      else if (ttype === lua.LUA_TNUMBER) { parts.push(String(lua.lua_tonumber(L_ref, i))); }
      else {
        const val = lua.lua_tostring(L_ref, i);
        if (val !== undefined && val !== null) { parts.push(to_jsstring(val)); }
        else { parts.push(String(lua.lua_tonumber(L_ref, i))); }
      }
    }
    handler.stdout.push(parts.join("\t"));
    return 0;
  }, 1);
  lua.lua_setglobal(L, "print");

  const loadResult = lauxlib.luaL_loadstring(L, to_luastring(source));
  if (loadResult !== 0) {
    const err = to_jsstring(lua.lua_tostring(L, -1));
    return { stdout: stdout.join("\n"), error: err };
  }
  const pcallResult = lua.lua_pcall(L, 0, 0, 0);
  if (pcallResult !== 0) {
    const err = to_jsstring(lua.lua_tostring(L, -1));
    return { stdout: stdout.join("\n"), error: err };
  }
  return { stdout: stdout.join("\n"), error: null };
}

const testCases = [
  { name: "hello", source: `print("Hello, world!")\nlocal score = 10\nscore = score + 5\nprint(score)`, expected: "Hello, world!\n15" },
  { name: "table-prop", source: `local t = {value = 123}\nprint(t.value)`, expected: "123" },
  { name: "func-call", source: `local function add(a, b)\n  return a + b\nend\nprint(add(2, 3))`, expected: "5" },
  { name: "for-loop", source: `for i = 1, 3 do\n  print(i)\nend`, expected: "1\n2\n3" },
  { name: "prop-assign", source: `local t = {}\nt.value = 42\nprint(t.value)`, expected: "42" },
  { name: "idx-access", source: `local t = {}\nt["key"] = 99\nprint(t["key"])\nprint(t.key)`, expected: "99\n99" },
  { name: "method-call", source: `local obj = {x = 10, add = function(self, n) return self.x + n end}\nprint(obj:add(5))`, expected: "15" },
  { name: "compound", source: `local x = 10\nx = x + 5\nx = x * 2\nprint(x)`, expected: "30" },
  { name: "if-else", source: `local x = 5\nif x > 3 then\n  print("big")\nelse\n  print("small")\nend`, expected: "big" },
  { name: "if-elseif-else", source: `local x = 2\nif x == 1 then\n  print("one")\nelseif x == 2 then\n  print("two")\nelse\n  print("three")\nend`, expected: "two" },
  { name: "while-loop", source: `local i = 1\nwhile i <= 3 do\n  print(i)\n  i = i + 1\nend`, expected: "1\n2\n3" },
  { name: "repeat-loop", source: `local i = 1\nrepeat\n  print(i)\n  i = i + 1\nuntil i > 3`, expected: "1\n2\n3" },
  { name: "nested-for", source: `for i = 1, 2 do\n  for j = 1, 2 do\n    print(i * 10 + j)\n  end\nend`, expected: "11\n12\n21\n22" },
  { name: "nil-bool", source: `print(nil)\nprint(true)\nprint(false)`, expected: "nil\ntrue\nfalse" },
  { name: "concat", source: `local s = "hello" .. " " .. "world"\nprint(s)`, expected: "hello world" },
  { name: "unary", source: `local x = 5\nprint(-x)\nprint(not true)\nprint(not false)`, expected: "-5\nfalse\ntrue" },
  { name: "comparison", source: `print(1 < 2)\nprint(3 > 2)\nprint(2 == 2)\nprint(1 ~= 2)`, expected: "true\ntrue\ntrue\ntrue" },
  { name: "string-len", source: `print(#"hello")`, expected: "5" },
  { name: "table-iter", source: `local t = {10, 20, 30}\nfor i, v in pairs(t) do print(i, v) end`, expected: "1\t10\n2\t20\n3\t30" },
  { name: "local-fn", source: `local function greet(name)\n  return "hello, " .. name\nend\nprint(greet("world"))`, expected: "hello, world" },
  { name: "math-call", source: `print(math.sqrt(16))`, expected: "4" },
  { name: "string-func", source: `print(string.len("hello"))`, expected: "5" },
  { name: "compound-assign", source: `local x = 10\nx += 5\nx *= 2\nprint(x)`, expected: "30" },
  { name: "interp-string", source: `local name = "world"\nprint(\`Hello, {name}!\`)`, expected: "Hello, world!" },
  { name: "do-block", source: `local x = 1\ndo\n  local x = 2\n  print(x)\nend\nprint(x)`, expected: "2\n1" },
  { name: "nested-table", source: `local t = { a = { b = { c = 1 } } }\nprint(t.a.b.c)`, expected: "1" },
  { name: "vararg-fn", source: `local function sum(...)\n  local s = 0\n  for _, v in ipairs({...}) do s = s + v end\n  return s\nend\nprint(sum(1, 2, 3))`, expected: "6" },
  { name: "multi-return", source: `local function f()\n  return 1, 2, 3\nend\nlocal a, b, c = f()\nprint(a, b, c)`, expected: "1\t2\t3" },
  { name: "generic-for", source: `local t = {a=1, b=2, c=3}\nfor k, v in pairs(t) do print(k, v) end`, expected: "a\t1\nb\t2\nc\t3" },
];

const profiles = ["profileA", "profileB", "profileC", "profileD", "profileE"];

describe("profile diagnostics", () => {
  for (const profile of profiles) {
    describe(`profile ${profile}`, () => {
      for (const tc of testCases) {
        it(tc.name, () => {
          const engine = new ObfuscatorEngine({
            seed: "test-" + profile,
            vmProfile: profile,
            virtualization: true,
            stringProtection: true,
            constantProtection: false,
            expressionTransforms: false,
            deadCode: false,
            controlFlow: false,
          });
          const report = engine.getReport(tc.source);
          const obfuscated = runLua(report.output);
          const ok = obfuscated.error === null && obfuscated.stdout === tc.expected;
          if (!ok) {
            console.log(`[${profile}/${tc.name}] error=${obfuscated.error}, stdout=${JSON.stringify(obfuscated.stdout)}, expected=${JSON.stringify(tc.expected)}`);
            console.log("OBFUSCATED OUTPUT:\n" + report.output);
          }
          expect(ok).toBe(true);
        });
      }
    });
  }
});
