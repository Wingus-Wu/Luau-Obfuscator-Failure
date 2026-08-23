#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { ObfuscatorEngine } from "../obfuscator.js";
const program = new Command();
program
    .name("obfuscator")
    .description("Luau Obfuscator - Production-grade Luau source code protection")
    .version("1.0.0");
program
    .argument("<input>", "Input Luau/Lua file")
    .option("-o, --output <file>", "Output file")
    .option("--config <file>", "JSON configuration file")
    .option("--seed <seed>", "Randomization seed")
    .option("--level <level>", "Intensity level: low, medium, high, extreme", "medium")
    .option("--no-identifier-renaming", "Disable identifier renaming")
    .option("--no-string-protection", "Disable string protection")
    .option("--no-constant-protection", "Disable constant protection")
    .option("--no-expression-transforms", "Disable expression transforms")
    .option("--no-dead-code", "Disable dead code")
    .option("--no-control-flow", "Disable control flow")
    .option("--virtualize", "Enable VM virtualization for supported straight-line code")
    .option("--debug", "Enable debug output")
    .action((input, options) => {
    runObfuscator(input, options);
});
function loadConfig(configPath) {
    if (!configPath)
        return {};
    try {
        const content = fs.readFileSync(configPath, "utf8");
        const parsed = JSON.parse(content);
        console.error(`[CLI] Loaded config from: ${configPath}`);
        return parsed;
    }
    catch (e) {
        console.error(`[CLI] Failed to load config from ${configPath}:`, e);
        process.exit(1);
    }
}
function runObfuscator(inputPath, options) {
    const startTime = Date.now();
    console.error(`[CLI] Input file: ${inputPath}`);
    console.error(`[CLI] Options:`, JSON.stringify(options, null, 2));
    if (!fs.existsSync(inputPath)) {
        console.error(`[CLI] Error: Input file not found: ${inputPath}`);
        process.exit(1);
    }
    const source = fs.readFileSync(inputPath, "utf8");
    console.error(`[CLI] Read ${source.length} bytes from ${inputPath}`);
    const config = {
        ...loadConfig(options.config),
        seed: options.seed,
        intensity: options.level,
        debug: options.debug ?? false,
        identifierRenaming: options.identifierRenaming ?? true,
        stringProtection: options.stringProtection ?? "basic",
        constantProtection: options.constantProtection ?? "basic",
        deadCode: options.deadCode ?? false,
        controlFlow: options.controlFlow ?? false,
        virtualization: options.virtualize ? "selective" : "none",
    };
    const engine = new ObfuscatorEngine(config);
    const report = engine.getReport(source);
    let output = engine.generate(source, config);
    if (options.output) {
        const outDir = path.dirname(options.output);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        fs.writeFileSync(options.output, output);
    }
    console.log("\nLuau Obfuscator\n");
    console.log("Input:");
    console.log(`  ${(Buffer.byteLength(source, "utf8") / 1024).toFixed(1)} KB\n`);
    console.log("Output:");
    console.log(`  ${(Buffer.byteLength(output, "utf8") / 1024).toFixed(1)} KB\n`);
    console.log("Transforms:");
    for (const t of report.transforms) {
        console.log(`  ${t.name.padEnd(25)} ${t.enabled ? (t.applied ? "✓" : "-") : "✗"}`);
    }
    console.log("\nIdentifiers renamed: " + report.stats.identifiersRenamed);
    console.log("Strings protected: " + report.stats.stringsProtected);
    console.log("Constants transformed: " + report.stats.constantsTransformed);
    console.log("Dead code injected: " + report.stats.deadCodeInjected);
    console.log("Control flow transformed: " + report.stats.controlFlowTransformed);
    console.log("Functions virtualized: " + report.stats.functionsVirtualized);
    console.log("\nBuild seed:");
    console.log("  " + report.seed);
    console.log("\nValidation:");
    console.log("  Syntax: " + (report.validationPassed ? "PASS" : "FAIL"));
    console.log("\nDuration: " + (Date.now() - startTime) + "ms");
    if (report.warnings.length > 0) {
        console.log("\nWarnings:");
        for (const w of report.warnings) {
            console.log("  " + w);
        }
    }
    if (options.output) {
        console.log(`\nOutput written to: ${options.output}`);
    }
}
program.parse();
