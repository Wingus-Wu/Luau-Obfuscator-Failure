import { Parser } from "./parser/index.js";
import { Generator } from "./generator/index.js";
import { createRandom, generateSeed } from "./utils/prng.js";
import { SemanticAnalyzer } from "./analyzer/scope.js";
import { DEFAULT_CONFIG, applyIntensity } from "./config/config.js";
import { IdentifierRenamingTransform } from "./transforms/identifiers/rename.js";
import { StringProtectionTransform } from "./transforms/strings/protect.js";
import { ConstantProtectionTransform } from "./transforms/constants/protect.js";
import { ExpressionTransform } from "./transforms/expressions/transform.js";
import { DeadCodeTransform } from "./transforms/deadcode/inject.js";
import { ControlFlowTransform } from "./transforms/controlflow/flatten.js";
import { PropertyProtectionTransform } from "./transforms/properties/protect.js";
import { VirtualizationTransform } from "./transforms/virtualization/virtualize.js";
import { OpaquePredicateTransform } from "./transforms/controlflow/opaque.js";
import { AntiTamperTransform } from "./transforms/antiTamper/inject.js";
import { OutputRandomizationTransform } from "./transforms/output/randomize.js";
let fengariModule = null;
try {
    fengariModule = await import("fengari");
}
catch (e) {
    // fengari not available
}
const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengariModule || {};
export { createRandom, generateSeed, applyIntensity };
export class ObfuscatorEngine {
    random;
    config;
    generator = new Generator();
    parser = new Parser();
    logs = [];
    logSource = "Obfuscator";
    constructor(config = {}) {
        const baseConfig = config.intensity
            ? { ...applyIntensity(config, config.intensity), ...config }
            : { ...DEFAULT_CONFIG, ...config };
        this.config = baseConfig;
        const seed = baseConfig.seed || generateSeed();
        this.config.seed = seed;
        this.random = createRandom(seed);
    }
    log(level, message, data) {
        const entry = {
            level,
            source: this.logSource,
            message,
            timestamp: Date.now(),
            data,
        };
        this.logs.push(entry);
        return entry;
    }
    obfuscate(source) {
        const startTime = Date.now();
        const warnings = [];
        const skippedTransforms = [];
        this.logs = [];
        this.log("info", "Starting obfuscation", { inputSize: source.length });
        let program;
        try {
            program = this.parser.parse(source);
            const parserLogs = this.parser.getLogs();
            for (const log of parserLogs) {
                this.logs.push(log);
            }
            this.log("success", "Parse complete", { statements: program.statements.length });
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const parserLogs = this.parser.getLogs();
            for (const log of parserLogs) {
                this.logs.push(log);
            }
            this.log("error", "Parse failed", { error: msg, snippet: source.slice(0, 200) });
            throw new Error(`Parse failed: ${msg}`);
        }
        const analyzer = new SemanticAnalyzer(this.random, this.config.globals, this.config.protectedIdentifiers);
        const analyzerResult = analyzer.analyze(program);
        this.log("debug", "Semantic analysis complete", {
            scopes: analyzerResult.scopes.length,
            globals: analyzerResult.globals.size,
            exported: analyzerResult.exportedNames.size,
        });
        const renamedIdentifiers = new Map();
        const protectedStrings = [];
        const stats = {
            identifiersRenamed: 0,
            stringsProtected: 0,
            constantsTransformed: 0,
            deadCodeInjected: 0,
            controlFlowTransformed: 0,
            functionsVirtualized: 0,
            opaquePredicatesInjected: 0,
            antiTamperChecks: 0,
        };
        const context = {
            random: this.random,
            config: this.config,
            analyzer: analyzerResult,
            renamedIdentifiers,
            protectedStrings,
            stats,
            stringPool: new Map(),
            stringPoolDecoderName: "",
            stringPoolStrategy: "xor",
            stringPoolStrategyParams: null,
            opaquePredicateState: new Map(),
            vmRuntimeState: {
                functionsToVirtualize: new Set(),
                vmProfiles: new Map(),
            },
            antiTamperState: {
                protectedRanges: [],
                checksums: new Map(),
            },
            outputRandomizationState: {
                whitespaceVariation: this.random.nextInt(0, 4),
                lineBreakStyle: this.random.pick(["unix", "windows", "mixed"]),
                helperOrder: [],
            },
        };
        const unavailableTransforms = new Set();
        const transforms = [
            new IdentifierRenamingTransform(),
            new OpaquePredicateTransform(),
            new ControlFlowTransform(),
            new DeadCodeTransform(),
            new StringProtectionTransform(),
            new ConstantProtectionTransform(),
            new ExpressionTransform(),
            new PropertyProtectionTransform(),
            new VirtualizationTransform(),
            new AntiTamperTransform(),
            new OutputRandomizationTransform(),
        ];
        transforms.sort((a, b) => a.priority - b.priority);
        const transformReport = [];
        // Helper to check if a transform should be enabled based on config
        const isTransformEnabled = (transformName) => {
            const configValue = this.config[transformName];
            if (typeof configValue === "boolean")
                return configValue;
            if (typeof configValue === "string")
                return configValue !== "none" && configValue !== "false" && configValue !== "";
            return Boolean(configValue);
        };
        for (const transform of transforms) {
            if (!transform.enabled || !isTransformEnabled(transform.name)) {
                transformReport.push({ name: transform.name, enabled: false, applied: false });
                this.log("info", `Transform skipped: ${transform.name}`, { reason: "disabled in config" });
                continue;
            }
            this.log("info", `Running transform: ${transform.name}`);
            try {
                const t0 = performance.now();
                const inStmts = program.statements.length;
                program = transform.apply(program, context);
                const durationMs = performance.now() - t0;
                const outStmts = program.statements.length;
                const applied = true;
                transformReport.push({ name: transform.name, enabled: true, applied });
                this.log("success", `Transform completed: ${transform.name} in ${durationMs.toFixed(2)}ms`, {
                    inStmts,
                    outStmts,
                    durationMs,
                });
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                this.log("error", `Transform failed: ${transform.name}`, { error: msg, stack: e instanceof Error ? e.stack : undefined });
                warnings.push(`Transform ${transform.name} failed: ${msg}`);
                skippedTransforms.push(transform.name);
            }
        }
        const output = this.generator.generate(program);
        this.log("info", "Code generation complete", { outputSize: output.length });
        let validationPassed = false;
        try {
            const reparsed = this.parser.parse(output);
            validationPassed = true;
            this.log("success", "Output validation passed");
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            warnings.push(`Output validation failed: ${msg}`);
            this.log("error", "Output validation failed", { error: msg });
        }
        // Runtime validation: execute the generated code to catch runtime errors
        if (this.config.validation && this.config.validationRuntimeTest && lua && lauxlib && lualib) {
            try {
                this.log("info", "Running runtime validation...");
                const runtimeResult = this.runLua(output);
                if (runtimeResult.error) {
                    validationPassed = false;
                    const msg = `Runtime validation failed: ${runtimeResult.error}\nStderr: ${runtimeResult.stderr}`;
                    warnings.push(msg);
                    this.log("error", "Runtime validation failed", { error: runtimeResult.error, stderr: runtimeResult.stderr });
                }
                else {
                    this.log("success", "Runtime validation passed");
                }
            }
            catch (e) {
                validationPassed = false;
                const msg = e instanceof Error ? e.message : String(e);
                warnings.push(`Runtime validation error: ${msg}`);
                this.log("error", "Runtime validation error", { error: msg });
            }
        }
        else if (this.config.validationRuntimeTest && (!lua || !lauxlib || !lualib)) {
            this.log("warn", "Runtime validation skipped - fengari not available");
        }
        const duration = Date.now() - startTime;
        this.log("success", "Obfuscation complete", { duration, seed: this.config.seed });
        return {
            program,
            stats,
            seed: this.config.seed,
            warnings,
            skippedTransforms,
        };
    }
    runLua(source) {
        if (!lua || !lauxlib || !lualib) {
            return { stdout: "", stderr: "", error: "fengari not available" };
        }
        const L = lauxlib.luaL_newstate();
        lualib.luaL_openlibs(L);
        const stdout = [];
        const stderr = [];
        // Override print to capture output
        lua.lua_getglobal(L, "print");
        lua.lua_pushlightuserdata(L, { stdout, stderr });
        lua.lua_pushcclosure(L, (L_ref) => {
            const L = L_ref;
            const handler = lua.lua_touserdata(L, lua.lua_upvalueindex(1));
            const n = lua.lua_gettop(L);
            const parts = [];
            for (let i = 1; i <= n; i++) {
                const val = lua.lua_tostring(L, i);
                if (val !== undefined) {
                    parts.push(to_jsstring(val));
                }
                else if (lua.lua_isboolean(L, i)) {
                    parts.push(lua.lua_toboolean(L, i) ? "true" : "false");
                }
                else if (lua.lua_isnil(L, i)) {
                    parts.push("nil");
                }
                else {
                    parts.push(String(lua.lua_tonumber(L, i)));
                }
            }
            handler.stdout.push(parts.join("\t"));
            return 0;
        }, 1);
        lua.lua_setglobal(L, "print");
        // Override error to capture error messages
        lua.lua_getglobal(L, "error");
        lua.lua_pushlightuserdata(L, { stderr });
        lua.lua_pushcclosure(L, (L_ref) => {
            const L = L_ref;
            const handler = lua.lua_touserdata(L, lua.lua_upvalueindex(1));
            const msg = lua.lua_tostring(L, 1) ? to_jsstring(lua.lua_tostring(L, 1)) : "unknown error";
            handler.stderr.push(msg);
            lua.lua_pushstring(L, to_luastring(msg));
            return 1;
        }, 1);
        lua.lua_setglobal(L, "error");
        const loadResult = lauxlib.luaL_loadstring(L, to_luastring(source));
        if (loadResult !== 0) {
            const err = to_jsstring(lua.lua_tostring(L, -1));
            return { stdout: stdout.join("\n"), stderr: stderr.join("\n"), error: err };
        }
        const pcallResult = lua.lua_pcall(L, 0, 0, 0);
        if (pcallResult !== 0) {
            const err = to_jsstring(lua.lua_tostring(L, -1));
            return { stdout: stdout.join("\n"), stderr: stderr.join("\n"), error: err };
        }
        return { stdout: stdout.join("\n"), stderr: stderr.join("\n"), error: null };
    }
    generate(source, config) {
        if (config) {
            const baseConfig = config.intensity
                ? { ...applyIntensity(config, config.intensity), ...config }
                : { ...this.config, ...config };
            this.config = baseConfig;
            const seed = baseConfig.seed || generateSeed();
            this.config.seed = seed;
            this.random.seed(seed);
        }
        this.logs = [];
        const result = this.obfuscate(source);
        return this.generator.generate(result.program);
    }
    getReport(source) {
        const startTime = Date.now();
        const inputSize = Buffer.byteLength(source, "utf8");
        this.logs = [];
        const result = this.obfuscate(source);
        const output = this.generator.generate(result.program);
        const outputSize = Buffer.byteLength(output, "utf8");
        const transforms = [
            { name: "Identifier Renaming", enabled: this.config.identifierRenaming, applied: result.stats.identifiersRenamed > 0 },
            { name: "String Protection", enabled: this.isLevelEnabled(this.config.stringProtection), applied: result.stats.stringsProtected > 0 },
            { name: "Constant Protection", enabled: this.isLevelEnabled(this.config.constantProtection), applied: result.stats.constantsTransformed > 0 },
            { name: "Dead Code", enabled: this.config.deadCode, applied: result.stats.deadCodeInjected > 0 },
            { name: "Control Flow", enabled: this.isLevelEnabled(this.config.controlFlow), applied: result.stats.controlFlowTransformed > 0 },
            { name: "Opaque Predicates", enabled: this.config.controlFlowOpaquePredicates, applied: result.stats.opaquePredicatesInjected > 0 },
            { name: "Property Protection", enabled: this.config.propertyProtection, applied: this.config.propertyProtection && !result.skippedTransforms.includes("propertyProtection") },
            { name: "Anti-Tamper", enabled: this.config.antiTamper, applied: result.stats.antiTamperChecks > 0 },
            { name: "Virtualization", enabled: this.isLevelEnabled(this.config.virtualization), applied: result.stats.functionsVirtualized > 0 },
            { name: "Output Randomization", enabled: this.config.outputRandomization, applied: true },
            { name: "Validation", enabled: this.config.validation, applied: true },
        ];
        return {
            seed: result.seed,
            inputSize,
            outputSize,
            transforms,
            stats: result.stats,
            warnings: result.warnings,
            skippedTransforms: result.skippedTransforms,
            validationPassed: result.warnings.filter(w => w.includes("validation")).length === 0,
            duration: Date.now() - startTime,
            logs: [...this.logs],
            output,
        };
    }
    isLevelEnabled(val) {
        if (typeof val === "boolean")
            return val;
        return val !== "none";
    }
    getLogs() {
        return [...this.logs];
    }
}
