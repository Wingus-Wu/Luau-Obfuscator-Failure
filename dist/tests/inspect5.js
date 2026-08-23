import { ObfuscatorEngine } from "../src/obfuscator.js";
import { Parser } from "../src/parser/index.js";
import fengari from "fengari";
const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari;
function runLua(source) {
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    const stdout = [];
    lua.lua_getglobal(L, "print");
    lua.lua_pushlightuserdata(L, { stdout });
    lua.lua_pushcclosure(L, (Lr) => {
        const L = Lr;
        const handler = lua.lua_touserdata(L, lua.lua_upvalueindex(1));
        const n = lua.lua_gettop(L);
        const parts = [];
        for (let i = 1; i <= n; i++) {
            const val = lua.lua_tostring(L, i);
            if (val !== undefined)
                parts.push(to_jsstring(val));
            else if (lua.lua_isboolean(L, i))
                parts.push(lua.lua_toboolean(L, i) ? "true" : "false");
            else if (lua.lua_isnil(L, i))
                parts.push("nil");
            else
                parts.push(String(lua.lua_tonumber(L, i)));
        }
        handler.stdout.push(parts.join("\t"));
        return 0;
    }, 1);
    lua.lua_setglobal(L, "print");
    const loadResult = lauxlib.luaL_loadstring(L, to_luastring(source));
    if (loadResult !== 0)
        return { stdout: "", error: to_jsstring(lua.lua_tostring(L, -1)) };
    const pcallResult = lua.lua_pcall(L, 0, 0, 0);
    if (pcallResult !== 0)
        return { stdout: stdout.join("\n"), error: to_jsstring(lua.lua_tostring(L, -1)) };
    return { stdout: stdout.join("\n"), error: null };
}
const parser = new Parser();
const cases = [
    { name: "hello world and arithmetic", src: `print("Hello, world!")\nlocal score = 10\nscore = score + 5\nprint(score)`, expected: "Hello, world!\n15" },
    { name: "function call", src: `local function add(a, b)\n  return a + b\nend\nprint(add(2, 3))`, expected: "5" },
    { name: "for loop", src: `for i = 1, 3 do\n  print(i)\nend`, expected: "1\n2\n3" },
    { name: "method call on table", src: `local obj = {x = 10, add = function(self, n) return self.x + n end}\nprint(obj:add(5))`, expected: "15" },
    { name: "compound assignment", src: `local x = 10\nx = x + 5\nx = x * 2\nprint(x)`, expected: "30" },
];
for (const seed of ["diff-1", "diff-2", "diff-3"]) {
    console.log("=== SEED", seed, "===");
    for (const c of cases) {
        const e = new ObfuscatorEngine({
            seed: seed + "-" + c.name,
            virtualization: true, stringProtection: true, constantProtection: false,
            expressionTransforms: false, deadCode: false, controlFlow: false,
        });
        const r = e.getReport(c.src);
        let parseErr = "";
        try {
            parser.parse(r.output);
        }
        catch (ex) {
            parseErr = ex.message.split("\n")[0];
        }
        const run = runLua(r.output);
        const profile = r.output.includes("_sv") ? "C/band" : (r.output.includes("handlersName") ? "A/table" : r.output.includes("elseif op") ? "B/if" : "?");
        console.log(`  [${c.name}] valid=${r.validationPassed} parseErr=${parseErr || "none"} runErr=${run.error?.slice(0, 60) || "none"} stdout="${run.stdout}" expected="${c.expected}" ${run.stdout === c.expected ? ">>> MATCH" : "<<< MISMATCH"}`);
        if (parseErr && !run.error) {
            console.log("  OUTPUT:\n" + r.output.split("\n").slice(0, 5).join("\n"));
        }
    }
}
