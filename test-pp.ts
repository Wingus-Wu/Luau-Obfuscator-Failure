import { ObfuscatorEngine } from "./src/obfuscator.js";

const engine = new ObfuscatorEngine({
  seed: "pp-test",
  propertyProtection: true,
  stringProtection: false,
  constantProtection: false,
  expressionTransforms: false,
  deadCode: false,
  controlFlow: false,
  identifierRenaming: false,
  virtualization: false,
});

const source = 'local t = {}; t.value = 42; print(t.value)';
const report = engine.getReport(source);
console.log("=== OUTPUT ===");
console.log(report.output);
console.log("=== WARNINGS ===");
console.log(report.warnings);
console.log("=== SKIPPED ===");
console.log(report.skippedTransforms);
console.log("=== TRANSFORMS ===");
for (const t of report.transforms) {
  console.log(`  ${t.name}: enabled=${t.enabled} applied=${t.applied}`);
}
