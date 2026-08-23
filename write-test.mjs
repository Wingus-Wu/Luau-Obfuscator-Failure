import fs from "fs";
fs.writeFileSync("test.lua", 'local function test() return "hello" end test()', "utf8");