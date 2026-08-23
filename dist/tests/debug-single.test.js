import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
import fengari from "fengari";
const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari;
function runLua(source) {
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    const stdout = [];
    lua.lua_getglobal(L, "print");
    lua.lua_pushlightuserdata(L, { stdout });
    lua.lua_pushcclosure(L, (L_ref) => {
        const handler = lua.lua_touserdata(L, lua.lua_upvalueindex(1));
        const n = lua.lua_gettop(L_ref);
        const parts = [];
        for (let i = 1; i <= n; i++) {
            const val = lua.lua_tostring(L_ref, i);
            if (val !== undefined)
                parts.push(to_jsstring(val));
            else if (lua.lua_isboolean(L_ref, i))
                parts.push(lua.lua_toboolean(L_ref, i) ? "true" : "false");
            else if (lua.lua_isnil(L_ref, i))
                parts.push("nil");
            else
                parts.push(String(lua.lua_tonumber(L_ref, i)));
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
describe("debug-single", () => {
    it("profileA-hello", () => {
        const profile = "profileA";
        const tc = { name: "hello", source: `print("Hello, world!")\nlocal score = 10\nscore = score + 5\nprint(score)`, expected: "Hello, world!\n15" };
        for (let attempt = 0; attempt < 3; attempt++) {
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
            console.log(`Attempt ${attempt}: ok=${ok}, error=${JSON.stringify(obfuscated.error)}, stdout=${JSON.stringify(obfuscated.stdout)}`);
            if (!ok) {
                console.log("OUTPUT:\n" + report.output);
                break;
            }
        }
    });
});
