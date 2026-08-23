import { describe, it } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";

function show(label: string, src: string, cfg?: any) {
  const engine = new ObfuscatorEngine({ seed: "z", constantProtection: false, expressionTransforms: false, deadCode: false, controlFlow: false, stringProtection: false, propertyProtection: false, identifierRenaming: false, ...cfg });
  const out = engine.generate(src);
  console.log("==== " + label + " ====");
  console.log(out);
}

describe("isolate", () => {
  it("function expression params", () => {
    show("fe-basic", `local f = function(x) return x end`);
    show("fe-arg", `print(function(x) return x end)`);
    show("fe-connect", `obj:Connect(function(input) print(input) end)`);
  });
  it("constant protection bitwise cases (expr off)", () => {
    const engine = new ObfuscatorEngine({ seed: "z", constantProtection: true, expressionTransforms: false, identifierRenaming: false });
    // brute a few values via different seeds
    for (const s of ["z1","z2","z3","z4","z5","z6","z7","z8"]) {
      const e = new ObfuscatorEngine({ seed: s, constantProtection: true, expressionTransforms: false, identifierRenaming: false, stringProtection: false });
      const out = e.generate(`local a = 2 local b = 3 local c = 5`);
      console.log("==seed "+s+"==\n"+out);
    }
  });
});
