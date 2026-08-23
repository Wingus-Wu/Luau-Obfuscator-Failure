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
    // Identifier obfuscation - checkboxes only
    .option("--identifier-renaming", "Enable identifier renaming", true)
    .option("--no-identifier-renaming", "Disable identifier renaming")
    .option("--rename-globals", "Rename global identifiers", true)
    .option("--no-rename-globals", "Don't rename global identifiers")
    .option("--rename-properties", "Rename property accesses", true)
    .option("--no-rename-properties", "Don't rename property accesses")
    .option("--protected-identifiers <list>", "Comma-separated identifiers to protect", "game,workspace,script,shared,require,typeof,task,wait,spawn,delay,Instance,Vector3,CFrame,Color3,Enum,print,warn,error")
    .option("--exclude-identifiers <list>", "Comma-separated identifiers to exclude from renaming", "")
    // String protection - checkboxes only
    .option("--string-protection", "Enable string protection", true)
    .option("--no-string-protection", "Disable string protection")
    .option("--string-per-string-strategy", "Use different strategy per string", true)
    .option("--no-string-per-string-strategy", "Don't use per-string strategy")
    .option("--string-multiple-decoders", "Use multiple decoder functions", true)
    .option("--no-string-multiple-decoders", "Don't use multiple decoders")
    .option("--string-lazy-decoding", "Lazy string decoding", true)
    .option("--no-string-lazy-decoding", "Disable lazy decoding")
    .option("--string-split-strings", "Split strings into chunks", true)
    .option("--no-string-split-strings", "Don't split strings")
    .option("--string-arithmetic-transform", "Apply arithmetic transforms to strings", true)
    .option("--no-string-arithmetic-transform", "Disable string arithmetic transforms")
    // Constant protection - checkboxes only
    .option("--constant-protection", "Enable constant protection", true)
    .option("--no-constant-protection", "Disable constant protection")
    .option("--constant-transform-numbers", "Transform numeric literals", true)
    .option("--no-constant-transform-numbers", "Don't transform numbers")
    .option("--constant-transform-booleans", "Transform boolean literals", true)
    .option("--no-constant-transform-booleans", "Don't transform booleans")
    .option("--constant-transform-strings", "Transform string constants", true)
    .option("--no-constant-transform-strings", "Don't transform string constants")
    .option("--constant-arithmetic-encoding", "Use arithmetic encoding for constants", true)
    .option("--no-constant-arithmetic-encoding", "Disable arithmetic encoding")
    .option("--constant-bitwise-encoding", "Use bitwise encoding for constants", true)
    .option("--no-constant-bitwise-encoding", "Disable bitwise encoding")
    // Expression transforms
    .option("--expression-transforms", "Enable expression transforms", true)
    .option("--no-expression-transforms", "Disable expression transforms")
    // Control flow - checkboxes only
    .option("--control-flow", "Enable control flow obfuscation", true)
    .option("--no-control-flow", "Disable control flow")
    .option("--control-flow-flattening", "Enable control flow flattening", true)
    .option("--no-control-flow-flattening", "Disable control flow flattening")
    .option("--control-flow-opaque-predicates", "Enable opaque predicates", true)
    .option("--no-control-flow-opaque-predicates", "Disable opaque predicates")
    .option("--control-flow-block-splitting", "Enable block splitting", true)
    .option("--no-control-flow-block-splitting", "Disable block splitting")
    .option("--control-flow-block-reordering", "Enable block reordering", true)
    .option("--no-control-flow-block-reordering", "Disable block reordering")
    .option("--control-flow-jump-indirection", "Enable jump indirection", true)
    .option("--no-control-flow-jump-indirection", "Disable jump indirection")
    .option("--control-flow-dispatcher-based", "Enable dispatcher-based flattening", true)
    .option("--no-control-flow-dispatcher-based", "Disable dispatcher-based flattening")
    // Dead code - checkboxes only
    .option("--dead-code", "Enable dead code injection", true)
    .option("--no-dead-code", "Disable dead code injection")
    .option("--dead-code-semantic-preserving", "Keep dead code semantically preserving", true)
    .option("--no-dead-code-semantic-preserving", "Don't preserve semantics")
    .option("--dead-code-clone-and-mutate", "Clone and mutate existing code", true)
    .option("--no-dead-code-clone-and-mutate", "Don't clone and mutate")
    // Virtualization - checkboxes only
    .option("--virtualization", "Enable VM virtualization", true)
    .option("--no-virtualization", "Disable virtualization")
    .option("--per-function-virtualization", "Virtualize per function", true)
    .option("--no-per-function-virtualization", "Don't virtualize per function")
    .option("--virtualize-sensitive-only", "Only virtualize sensitive functions", true)
    .option("--no-virtualize-sensitive-only", "Virtualize all functions")
    .option("--opcode-mutation", "Enable opcode mutation", true)
    .option("--no-opcode-mutation", "Disable opcode mutation")
    .option("--opcode-randomize-numbers", "Randomize opcode numbers", true)
    .option("--no-opcode-randomize-numbers", "Don't randomize opcode numbers")
    .option("--opcode-randomize-operands", "Randomize operand encoding", true)
    .option("--no-opcode-randomize-operands", "Don't randomize operands")
    .option("--opcode-combine-operations", "Combine operations into single opcodes", true)
    .option("--no-opcode-combine-operations", "Don't combine operations")
    // Constant pool - checkboxes only
    .option("--constant-pool-splitting", "Split constant pools", true)
    .option("--no-constant-pool-splitting", "Don't split constant pools")
    .option("--constant-pool-multiple-pools", "Use multiple constant pools", true)
    .option("--no-constant-pool-multiple-pools", "Don't use multiple pools")
    .option("--constant-pool-lazy-constants", "Lazy constant resolution", true)
    .option("--no-constant-pool-lazy-constants", "Disable lazy constants")
    .option("--constant-pool-per-function", "Per-function constant pools", true)
    .option("--no-constant-pool-per-function", "Disable per-function pools")
    .option("--constant-pool-encrypted", "Encrypt constant pools", true)
    .option("--no-constant-pool-encrypted", "Don't encrypt pools")
    .option("--constant-pool-shuffled-indexes", "Shuffle constant pool indexes", true)
    .option("--no-constant-pool-shuffled-indexes", "Don't shuffle indexes")
    // Environment - checkboxes only
    .option("--environment-lazy-resolution", "Lazy environment resolution", true)
    .option("--no-environment-lazy-resolution", "Disable lazy resolution")
    .option("--environment-multiple-resolvers", "Use multiple environment resolvers", true)
    .option("--no-environment-multiple-resolvers", "Disable multiple resolvers")
    .option("--environment-randomized-lookup", "Randomize environment lookup", true)
    .option("--no-environment-randomized-lookup", "Disable randomized lookup")
    // Anti-tamper - checkboxes only
    .option("--anti-tamper", "Enable anti-tamper", true)
    .option("--no-anti-tamper", "Disable anti-tamper")
    .option("--anti-tamper-integrity-check", "Enable integrity checks", true)
    .option("--no-anti-tamper-integrity-check", "Disable integrity checks")
    .option("--anti-tamper-checksum-validation", "Enable checksum validation", true)
    .option("--no-anti-tamper-checksum-validation", "Disable checksum validation")
    .option("--anti-tamper-state-validation", "Enable state validation", true)
    .option("--no-anti-tamper-state-validation", "Disable state validation")
    .option("--anti-debug", "Enable anti-debug", true)
    .option("--no-anti-debug", "Disable anti-debug")
    // Property Protection
    .option("--property-protection", "Enable property protection", true)
    .option("--no-property-protection", "Disable property protection")
    // Output - checkboxes only
    .option("--output-randomization", "Enable output randomization", true)
    .option("--no-output-randomization", "Disable output randomization")
    .option("--output-whitespace-randomization", "Randomize whitespace", true)
    .option("--no-output-whitespace-randomization", "Don't randomize whitespace")
    .option("--output-line-break-randomization", "Randomize line breaks", true)
    .option("--no-output-line-break-randomization", "Don't randomize line breaks")
    .option("--output-helper-ordering-randomization", "Randomize helper ordering", true)
    .option("--no-output-helper-ordering-randomization", "Don't randomize helper ordering")
    // Build
    .option("--build-randomization", "Enable build randomization", true)
    .option("--no-build-randomization", "Disable build randomization")
    // Validation - checkboxes only
    .option("--validation", "Enable validation", true)
    .option("--no-validation", "Disable validation")
    .option("--validation-runtime-test", "Enable runtime validation", true)
    .option("--no-validation-runtime-test", "Disable runtime validation")
    .option("--validation-differential-test", "Enable differential testing", true)
    .option("--no-validation-differential-test", "Disable differential testing")
    // Debug
    .option("--debug", "Enable debug output")
    .option("--source-map", "Generate source map", true)
    .option("--no-source-map", "Disable source map")
    .option("--source-map-inline", "Inline source map", true)
    .option("--no-source-map-inline", "Don't inline source map")
    // Target
    .option("--globals <list>", "Comma-separated global identifiers", "game,workspace,script,shared,getgenv,getrenv,getnilinstances,getinstances,gethui,getreg,reg,typeof,type,rawset,rawget,rawequal,rawlen,setmetatable,getmetatable,next,pairs,ipairs,select,unpack,pack,table,string,math,os,coroutine,bit32,utf8,require,loadstring,load,dofile,dostring,print,warn,error,assert,tonumber,tostring,pcall,xpcall,yield,resume,wrap,create,running,status,task,wait,delay,spawn,desynchronize,synchronize,Instance,Vector3,Vector2,Vector3int16,Vector2int16,CFrame,UDim,UDim2,Ray,Region3,Region3int16,Color3,ColorSequence,NumberRange,NumberSequence,Rect,PhysicalProperties,Random,Enums,Axes,BrickColor,Color3.new,Color3.fromHSV,Color3.fromRGB,CFrame.new,CFrame.Angles,CFrame.fromMatrix,UDim.new,UDim2.new,Vector2.new,Vector3.new,Enum,Enum.KeyCode,Enum.Material,Enum.ParticleEmitterShape,printidentity,getfenv,setfenv")
    .option("--protected-properties <list>", "Comma-separated protected properties", "")
    .option("--exclude-functions <list>", "Comma-separated functions to exclude from virtualization", "")
    .action((input, options) => {
    runObfuscator(input, options);
});
function parseList(list) {
    return list ? list.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];
}
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
        debug: options.debug ?? false,
        // Identifier obfuscation - all checkboxes
        identifierObfuscation: "aggressive",
        identifierRenaming: options.identifierRenaming ?? true,
        identifierRenamingStrategy: "per-scope",
        renameGlobals: options.renameGlobals ?? true,
        renameProperties: options.renameProperties ?? true,
        protectedIdentifiers: parseList(options.protectedIdentifiers),
        excludeIdentifiers: parseList(options.excludeIdentifiers),
        // String protection - checkboxes
        stringProtection: options.stringProtection ? "maximum" : "none",
        stringProtectionIntensity: "extreme",
        stringPerStringStrategy: options.stringPerStringStrategy ?? true,
        stringMultipleDecoders: options.stringMultipleDecoders ?? true,
        stringLazyDecoding: options.stringLazyDecoding ?? true,
        stringSplitStrings: options.stringSplitStrings ?? true,
        stringArithmeticTransform: options.stringArithmeticTransform ?? true,
        // Constant protection - checkboxes
        constantProtection: options.constantProtection ? "maximum" : "none",
        constantProtectionIntensity: "extreme",
        constantTransformNumbers: options.constantTransformNumbers ?? true,
        constantTransformBooleans: options.constantTransformBooleans ?? true,
        constantTransformStrings: options.constantTransformStrings ?? true,
        constantArithmeticEncoding: options.constantArithmeticEncoding ?? true,
        constantBitwiseEncoding: options.constantBitwiseEncoding ?? true,
        // Expression transforms
        expressionTransforms: options.expressionTransforms ?? true,
        // Control flow - checkboxes
        controlFlow: options.controlFlow ? "maximum" : "none",
        controlFlowIntensity: 0.9,
        controlFlowFlattening: options.controlFlowFlattening ?? true,
        controlFlowFlatteningPercentage: 0.85,
        controlFlowOpaquePredicates: options.controlFlowOpaquePredicates ?? true,
        controlFlowBlockSplitting: options.controlFlowBlockSplitting ?? true,
        controlFlowBlockReordering: options.controlFlowBlockReordering ?? true,
        controlFlowJumpIndirection: options.controlFlowJumpIndirection ?? true,
        controlFlowDispatcherBased: options.controlFlowDispatcherBased ?? true,
        controlFlowMaxFunctionSize: 500,
        // Dead code - checkboxes
        deadCode: options.deadCode ?? true,
        deadCodeIntensity: "extreme",
        deadCodePercentage: 0.6,
        deadCodeSemanticPreserving: options.deadCodeSemanticPreserving ?? true,
        deadCodeCloneAndMutate: options.deadCodeCloneAndMutate ?? true,
        // Virtualization - checkboxes
        virtualization: options.virtualization ? "maximum" : "none",
        virtualizationPercentage: 0.9,
        virtualizationMode: "all",
        vmArchitecture: "random",
        vmProfile: "random",
        dispatcherStrategy: "random",
        instructionEncoding: "random",
        opcodeMutation: options.opcodeMutation ?? true,
        opcodeRandomizeNumbers: options.opcodeRandomizeNumbers ?? true,
        opcodeRandomizeOperands: options.opcodeRandomizeOperands ?? true,
        opcodeCombineOperations: options.opcodeCombineOperations ?? true,
        perFunctionVirtualization: options.perFunctionVirtualization ?? true,
        virtualizeSensitiveOnly: options.virtualizeSensitiveOnly ?? true,
        // Constant pool
        constantPoolSplitting: options.constantPoolSplitting ?? true,
        constantPoolMultiplePools: options.constantPoolMultiplePools ?? true,
        constantPoolLazyConstants: options.constantPoolLazyConstants ?? true,
        constantPoolPerFunction: options.constantPoolPerFunction ?? true,
        constantPoolEncrypted: options.constantPoolEncrypted ?? true,
        constantPoolShuffledIndexes: options.constantPoolShuffledIndexes ?? true,
        // Environment
        environmentLazyResolution: options.environmentLazyResolution ?? true,
        environmentMultipleResolvers: options.environmentMultipleResolvers ?? true,
        environmentRandomizedLookup: options.environmentRandomizedLookup ?? true,
        // Anti-tamper
        antiTamper: options.antiTamper ?? true,
        antiTamperAction: "fail",
        antiTamperIntegrityCheck: options.antiTamperIntegrityCheck ?? true,
        antiTamperChecksumValidation: options.antiTamperChecksumValidation ?? true,
        antiTamperStateValidation: options.antiTamperStateValidation ?? true,
        antiDebug: options.antiDebug ?? true,
        // Property Protection
        propertyProtection: options.propertyProtection ?? true,
        // Output
        outputRandomization: options.outputRandomization ?? true,
        outputWhitespaceRandomization: options.outputWhitespaceRandomization ?? true,
        outputLineBreakRandomization: options.outputLineBreakRandomization ?? true,
        outputHelperOrderingRandomization: options.outputHelperOrderingRandomization ?? true,
        // Build
        buildRandomization: options.buildRandomization ?? true,
        // Validation
        validation: options.validation ?? true,
        validationRuntimeTest: options.validationRuntimeTest ?? true,
        validationDifferentialTest: options.validationDifferentialTest ?? true,
        // Debug
        sourceMap: options.sourceMap ?? true,
        sourceMapInline: options.sourceMapInline ?? true,
        // Target
        targetRuntime: "luau",
        globals: parseList(options.globals),
        protectedProperties: parseList(options.protectedProperties),
        excludeFunctions: parseList(options.excludeFunctions),
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
