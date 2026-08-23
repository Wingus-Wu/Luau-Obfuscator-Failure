import fs from "fs";

const p = "src/transforms/virtualization/profiles/base.ts";
let s = fs.readFileSync(p, "utf8");
let a = s.split("\n");
let changes = 0;

for (let i = 0; i < a.length; i++) {
  if (/^    case 6:/.test(a[i])) {
    a[i] = "    case 6:  return `local _idx=${instr}[2]; ${S}.locals[_idx]=${S}.stack[${S}.sp]; ${S}.sp=${S}.sp-1`";
    changes++;
  }
  if (a[i].includes("local _rets=_vmf(_pi,") && a[i].includes("${S}.stack)")) {
    a[i] = a[i].replace("${S}.stack)", "_args)");
    changes++;
  }
}

fs.writeFileSync(p, a.join("\n"));
console.log("changed lines:", changes);
console.log("case6:", a.find((l) => /^    case 6:/.test(l)));
console.log("loadproto arg line:", a.find((l) => l.includes("local _rets=_vmf")));
