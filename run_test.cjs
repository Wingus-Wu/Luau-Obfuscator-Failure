const { interopRequireDefault } = require("fengari/interop");
const { lua } = require("fengari");
const fs = require("fs");

const code = fs.readFileSync("test_output.lua", "utf8");
const L = lua();
try {
  L.loadstring(code, "test")();
  console.log("Success!");
} catch (e) {
  console.error("Error:", e.message);
  console.error(e.stack);
}