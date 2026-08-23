import { ObfuscatorEngine } from "../src/obfuscator.js";
const e = new ObfuscatorEngine({
    seed: "vm-test", virtualization: true, stringProtection: true,
    constantProtection: false, expressionTransforms: false, deadCode: false, controlFlow: false,
});
const r = e.getReport('local score = 10; score = score + 5; print("Your total score is:", score)');
console.log("valid:", r.validationPassed);
const lines = r.output.split("\n");
lines.forEach((l, i) => console.log((i + 1).toString().padStart(3) + ": " + l));
