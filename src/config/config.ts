export type Intensity = "low" | "medium" | "high" | "extreme";

export type TargetRuntime = "luau" | "lua51" | "lua52" | "lua53" | "roblox";

export type IdentifierObfuscationLevel = "none" | "safe" | "aggressive";
export type StringProtectionLevel = "none" | "basic" | "advanced" | "maximum" | boolean;
export type ConstantProtectionLevel = "none" | "basic" | "advanced" | "maximum" | boolean;
export type VirtualizationLevel = "none" | "selective" | "aggressive" | "maximum" | boolean;
export type ControlFlowLevel = "none" | "basic" | "advanced" | "maximum" | boolean;
export type VmArchitecture = "stack" | "register" | "hybrid" | "random";
export type DispatcherStrategy = "if-else" | "table" | "state-machine" | "mixed" | "random";
export type InstructionEncoding = "array" | "packed" | "split" | "random";
export type AntiTamperAction = "warn" | "disable" | "fail";

export interface ObfuscationConfig {
  seed: string;
  intensity: Intensity;
  
  // Identifier obfuscation
  identifierObfuscation: IdentifierObfuscationLevel;
  identifierRenaming: boolean;
  identifierRenamingStrategy: "short" | "numeric" | "random" | "unicode-safe" | "mixed" | "per-scope";
  renameGlobals: boolean;
  renameProperties: boolean;
  protectedIdentifiers: string[];
  excludeIdentifiers: string[];
  
  // String protection
  stringProtection: StringProtectionLevel;
  stringProtectionIntensity: Intensity;
  stringPerStringStrategy: boolean;
  stringMultipleDecoders: boolean;
  stringLazyDecoding: boolean;
  stringSplitStrings: boolean;
  stringArithmeticTransform: boolean;
  
  // Constant protection
  constantProtection: ConstantProtectionLevel;
  constantProtectionIntensity: Intensity;
  constantTransformNumbers: boolean;
  constantTransformBooleans: boolean;
  constantTransformStrings: boolean;
  constantArithmeticEncoding: boolean;
  constantBitwiseEncoding: boolean;
  
  // Expression transforms
  expressionTransforms: boolean;
  
  // Control flow
  controlFlow: ControlFlowLevel;
  controlFlowIntensity: number;
  controlFlowFlattening: boolean;
  controlFlowFlatteningPercentage: number;
  controlFlowOpaquePredicates: boolean;
  controlFlowBlockSplitting: boolean;
  controlFlowBlockReordering: boolean;
  controlFlowJumpIndirection: boolean;
  controlFlowDispatcherBased: boolean;
  controlFlowMaxFunctionSize: number;
  
  // Dead code
  deadCode: boolean;
  deadCodeIntensity: Intensity;
  deadCodePercentage: number;
  deadCodeSemanticPreserving: boolean;
  deadCodeCloneAndMutate: boolean;
  
  // Virtualization
  virtualization: VirtualizationLevel;
  virtualizationPercentage: number;
  virtualizationMode: "none" | "selected" | "all";
  vmArchitecture: VmArchitecture;
  vmProfile: string;
  dispatcherStrategy: DispatcherStrategy;
  instructionEncoding: InstructionEncoding;
  opcodeMutation: boolean;
  opcodeRandomizeNumbers: boolean;
  opcodeRandomizeOperands: boolean;
  opcodeCombineOperations: boolean;
  perFunctionVirtualization: boolean;
  virtualizeSensitiveOnly: boolean;
  
  // Constant pool
  constantPoolSplitting: boolean;
  constantPoolMultiplePools: boolean;
  constantPoolLazyConstants: boolean;
  constantPoolPerFunction: boolean;
  constantPoolEncrypted: boolean;
  constantPoolShuffledIndexes: boolean;
  
  // Environment
  environmentLazyResolution: boolean;
  environmentMultipleResolvers: boolean;
  environmentRandomizedLookup: boolean;
  
  // Anti-tamper
  antiTamper: boolean;
  antiTamperAction: AntiTamperAction;
  antiTamperIntegrityCheck: boolean;
  antiTamperChecksumValidation: boolean;
  antiTamperStateValidation: boolean;
  antiDebug: boolean;
  
  // Property Protection
  propertyProtection: boolean;
  
  // Output
  outputRandomization: boolean;
  outputWhitespaceRandomization: boolean;
  outputLineBreakRandomization: boolean;
  outputHelperOrderingRandomization: boolean;
  
  // Build
  buildRandomization: boolean;
  
  // Validation
  validation: boolean;
  validationRuntimeTest: boolean;
  validationDifferentialTest: boolean;
  
  // Debug
  debug: boolean;
  sourceMap: boolean;
  sourceMapInline: boolean;
  
  // Target
  targetRuntime: TargetRuntime;
  globals: string[];
  protectedProperties: string[];
  excludeFunctions: string[];
}

export const DEFAULT_CONFIG: ObfuscationConfig = {
  seed: "",
  intensity: "medium",
  
  // Identifier obfuscation
  identifierObfuscation: "safe",
  identifierRenaming: true,
  identifierRenamingStrategy: "mixed",
  renameGlobals: false,
  renameProperties: false,
  protectedIdentifiers: [
    "game", "workspace", "script", "shared", "require", "typeof",
    "task", "wait", "spawn", "delay", "Instance", "Vector3",
    "CFrame", "Color3", "Enum", "print", "warn", "error",
  ],
  excludeIdentifiers: [],
  
  // String protection
  stringProtection: "basic",
  stringProtectionIntensity: "medium",
  stringPerStringStrategy: false,
  stringMultipleDecoders: false,
  stringLazyDecoding: false,
  stringSplitStrings: false,
  stringArithmeticTransform: false,
  
  // Constant protection
  constantProtection: "basic",
  constantProtectionIntensity: "medium",
  constantTransformNumbers: true,
  constantTransformBooleans: true,
  constantTransformStrings: false,
  constantArithmeticEncoding: true,
  constantBitwiseEncoding: true,
  
  // Expression transforms
  expressionTransforms: false,
  
  // Control flow
  controlFlow: "none",
  controlFlowIntensity: 0.5,
  controlFlowFlattening: false,
  controlFlowFlatteningPercentage: 0.65,
  controlFlowOpaquePredicates: false,
  controlFlowBlockSplitting: false,
  controlFlowBlockReordering: false,
  controlFlowJumpIndirection: false,
  controlFlowDispatcherBased: false,
  controlFlowMaxFunctionSize: 500,
  
  // Dead code
  deadCode: false,
  deadCodeIntensity: "medium",
  deadCodePercentage: 0.25,
  deadCodeSemanticPreserving: true,
  deadCodeCloneAndMutate: false,
  
  // Virtualization
  virtualization: "none",
  virtualizationPercentage: 0.3,
  virtualizationMode: "selected",
  vmArchitecture: "random",
  vmProfile: "random",
  dispatcherStrategy: "random",
  instructionEncoding: "random",
  opcodeMutation: true,
  opcodeRandomizeNumbers: true,
  opcodeRandomizeOperands: false,
  opcodeCombineOperations: false,
  perFunctionVirtualization: true,
  virtualizeSensitiveOnly: true,
  
  // Constant pool
  constantPoolSplitting: true,
  constantPoolMultiplePools: true,
  constantPoolLazyConstants: true,
  constantPoolPerFunction: true,
  constantPoolEncrypted: false,
  constantPoolShuffledIndexes: true,
  
  // Environment
  environmentLazyResolution: true,
  environmentMultipleResolvers: true,
  environmentRandomizedLookup: true,
  
  // Anti-tamper
  antiTamper: false,
  antiTamperAction: "disable",
  antiTamperIntegrityCheck: true,
  antiTamperChecksumValidation: true,
  antiTamperStateValidation: true,
  antiDebug: false,
  
  // Property Protection
  propertyProtection: false,
  
  // Output
  outputRandomization: true,
  outputWhitespaceRandomization: true,
  outputLineBreakRandomization: true,
  outputHelperOrderingRandomization: true,
  
  // Build
  buildRandomization: true,
  
  // Validation
  validation: true,
  validationRuntimeTest: false,
  validationDifferentialTest: false,
  
  // Debug
  debug: false,
  sourceMap: false,
  sourceMapInline: false,
  
  // Target
  targetRuntime: "luau",
  globals: [
    "game", "workspace", "script", "shared", "getgenv", "getrenv",
    "getnilinstances", "getinstances", "gethui", "getreg", "reg",
    "typeof", "type", "rawset", "rawget", "rawequal", "rawlen",
    "setmetatable", "getmetatable", "next", "pairs", "ipairs",
    "select", "unpack", "pack", "table", "string", "math", "os",
    "coroutine", "bit32", "utf8", "require", "loadstring", "load",
    "dofile", "dostring", "print", "warn", "error", "assert",
    "tonumber", "tostring", "pcall", "xpcall", "yield", "resume",
    "wrap", "create", "running", "status",
    "task", "wait", "delay", "spawn", "desynchronize", "synchronize",
    "Instance", "Vector3", "Vector2", "Vector3int16", "Vector2int16",
    "CFrame", "UDim", "UDim2", "Ray", "Region3", "Region3int16",
    "Color3", "ColorSequence", "NumberRange", "NumberSequence",
    "Rect", "PhysicalProperties", "Random", "Enums", "Axes",
    "BrickColor", "Color3.new", "Color3.fromHSV", "Color3.fromRGB",
    "CFrame.new", "CFrame.Angles", "CFrame.fromMatrix",
    "UDim.new", "UDim2.new", "Vector2.new", "Vector3.new",
    "Enum", "Enum.KeyCode", "Enum.Material", "Enum.ParticleEmitterShape",
    "printidentity", "getfenv", "setfenv",
  ],
  protectedProperties: [],
  excludeFunctions: [],
};

const INTENSITY_PROFILES: Record<Intensity, Partial<ObfuscationConfig>> = {
  low: {
    identifierObfuscation: "safe",
    identifierRenaming: true,
    identifierRenamingStrategy: "short",
    stringProtection: "basic",
    stringProtectionIntensity: "low",
    stringPerStringStrategy: false,
    stringMultipleDecoders: false,
    constantProtection: "basic",
    constantProtectionIntensity: "low",
    constantTransformNumbers: true,
    constantTransformBooleans: false,
    controlFlow: "none",
    controlFlowFlattening: false,
    controlFlowOpaquePredicates: false,
    deadCode: false,
    deadCodeIntensity: "low",
    virtualization: "none",
    virtualizationPercentage: 0,
    vmArchitecture: "stack",
    dispatcherStrategy: "if-else",
    instructionEncoding: "array",
    opcodeMutation: false,
    perFunctionVirtualization: false,
    virtualizeSensitiveOnly: false,
    constantPoolSplitting: false,
    constantPoolMultiplePools: false,
    constantPoolLazyConstants: false,
    constantPoolPerFunction: false,
    environmentLazyResolution: false,
    environmentMultipleResolvers: false,
    antiTamper: false,
    antiDebug: false,
    propertyProtection: false,
    outputRandomization: false,
    buildRandomization: false,
    validation: true,
    validationRuntimeTest: false,
  },
  medium: {
    identifierObfuscation: "safe",
    identifierRenaming: true,
    identifierRenamingStrategy: "mixed",
    stringProtection: "basic",
    stringProtectionIntensity: "medium",
    stringPerStringStrategy: false,
    stringMultipleDecoders: false,
    constantProtection: "basic",
    constantProtectionIntensity: "medium",
    constantTransformNumbers: true,
    constantTransformBooleans: true,
    controlFlow: "basic",
    controlFlowIntensity: 0.4,
    controlFlowFlattening: true,
    controlFlowFlatteningPercentage: 0.4,
    controlFlowOpaquePredicates: false,
    deadCode: false,
    deadCodeIntensity: "medium",
    virtualization: "selective",
    virtualizationPercentage: 0.3,
    virtualizationMode: "selected",
    vmArchitecture: "random",
    dispatcherStrategy: "random",
    instructionEncoding: "random",
    opcodeMutation: true,
    opcodeRandomizeNumbers: true,
    opcodeRandomizeOperands: false,
    perFunctionVirtualization: true,
    virtualizeSensitiveOnly: true,
    constantPoolSplitting: true,
    constantPoolMultiplePools: true,
    constantPoolLazyConstants: true,
    constantPoolPerFunction: true,
    environmentLazyResolution: true,
    environmentMultipleResolvers: true,
    antiTamper: false,
    antiDebug: false,
    propertyProtection: false,
    outputRandomization: true,
    buildRandomization: true,
    validation: true,
    validationRuntimeTest: false,
  },
  high: {
    identifierObfuscation: "aggressive",
    identifierRenaming: true,
    identifierRenamingStrategy: "per-scope",
    stringProtection: "advanced",
    stringProtectionIntensity: "high",
    stringPerStringStrategy: true,
    stringMultipleDecoders: true,
    stringLazyDecoding: true,
    stringSplitStrings: true,
    stringArithmeticTransform: true,
    constantProtection: "advanced",
    constantProtectionIntensity: "high",
    constantTransformNumbers: true,
    constantTransformBooleans: true,
    constantTransformStrings: true,
    constantArithmeticEncoding: true,
    constantBitwiseEncoding: true,
    controlFlow: "advanced",
    controlFlowIntensity: 0.7,
    controlFlowFlattening: true,
    controlFlowFlatteningPercentage: 0.65,
    controlFlowOpaquePredicates: true,
    controlFlowBlockSplitting: true,
    controlFlowBlockReordering: true,
    controlFlowJumpIndirection: true,
    deadCode: true,
    deadCodeIntensity: "high",
    deadCodePercentage: 0.4,
    deadCodeSemanticPreserving: true,
    deadCodeCloneAndMutate: true,
    virtualization: "aggressive",
    virtualizationPercentage: 0.65,
    virtualizationMode: "selected",
    vmArchitecture: "hybrid",
    dispatcherStrategy: "mixed",
    instructionEncoding: "packed",
    opcodeMutation: true,
    opcodeRandomizeNumbers: true,
    opcodeRandomizeOperands: true,
    opcodeCombineOperations: true,
    perFunctionVirtualization: true,
    virtualizeSensitiveOnly: true,
    constantPoolSplitting: true,
    constantPoolMultiplePools: true,
    constantPoolLazyConstants: true,
    constantPoolPerFunction: true,
    constantPoolEncrypted: true,
    constantPoolShuffledIndexes: true,
    environmentLazyResolution: true,
    environmentMultipleResolvers: true,
    environmentRandomizedLookup: true,
    antiTamper: true,
    antiTamperAction: "disable",
    antiTamperIntegrityCheck: true,
    antiTamperChecksumValidation: true,
    antiTamperStateValidation: true,
    antiDebug: true,
    propertyProtection: true,
    outputRandomization: true,
    buildRandomization: true,
    validation: true,
    validationRuntimeTest: true,
    validationDifferentialTest: false,
  },
  extreme: {
    identifierObfuscation: "aggressive",
    identifierRenaming: true,
    identifierRenamingStrategy: "per-scope",
    stringProtection: "maximum",
    stringProtectionIntensity: "extreme",
    stringPerStringStrategy: true,
    stringMultipleDecoders: true,
    stringLazyDecoding: true,
    stringSplitStrings: true,
    stringArithmeticTransform: true,
    constantProtection: "maximum",
    constantProtectionIntensity: "extreme",
    constantTransformNumbers: true,
    constantTransformBooleans: true,
    constantTransformStrings: true,
    constantArithmeticEncoding: true,
    constantBitwiseEncoding: true,
    controlFlow: "maximum",
    controlFlowIntensity: 0.9,
    controlFlowFlattening: true,
    controlFlowFlatteningPercentage: 0.85,
    controlFlowOpaquePredicates: true,
    controlFlowBlockSplitting: true,
    controlFlowBlockReordering: true,
    controlFlowJumpIndirection: true,
    controlFlowDispatcherBased: true,
    deadCode: true,
    deadCodeIntensity: "extreme",
    deadCodePercentage: 0.6,
    deadCodeSemanticPreserving: true,
    deadCodeCloneAndMutate: true,
    virtualization: "maximum",
    virtualizationPercentage: 0.9,
    virtualizationMode: "all",
    vmArchitecture: "random",
    dispatcherStrategy: "random",
    instructionEncoding: "random",
    opcodeMutation: true,
    opcodeRandomizeNumbers: true,
    opcodeRandomizeOperands: true,
    opcodeCombineOperations: true,
    perFunctionVirtualization: true,
    virtualizeSensitiveOnly: true,
    constantPoolSplitting: true,
    constantPoolMultiplePools: true,
    constantPoolLazyConstants: true,
    constantPoolPerFunction: true,
    constantPoolEncrypted: true,
    constantPoolShuffledIndexes: true,
    environmentLazyResolution: true,
    environmentMultipleResolvers: true,
    environmentRandomizedLookup: true,
    antiTamper: true,
    antiTamperAction: "fail",
    antiTamperIntegrityCheck: true,
    antiTamperChecksumValidation: true,
    antiTamperStateValidation: true,
    antiDebug: true,
    propertyProtection: true,
    outputRandomization: true,
    buildRandomization: true,
    validation: true,
    validationRuntimeTest: true,
    validationDifferentialTest: true,
  },
};

// Apply an intensity preset on top of the caller's config. Presets stay
// authoritative for every toggle so that the intensity levels remain
// well-defined (e.g. "medium" always keeps dead code / control flow off).
// Carve-outs: UI checkboxes / CLI flags that are explicitly set by the user
// should not be overridden by the intensity preset.
export function applyIntensity(base: Partial<ObfuscationConfig>, intensity: Intensity): ObfuscationConfig {
  const config = { ...DEFAULT_CONFIG, ...base };
  const profile = INTENSITY_PROFILES[intensity] ?? {};

  const UI_CARVE_OUTS = [
    "virtualization",
    "virtualizationMode",
    "identifierRenaming",
    "stringProtection",
    "constantProtection",
    "expressionTransforms",
    "deadCode",
    "controlFlow",
  ];

  for (const [key, value] of Object.entries(profile)) {
    // Carve-out: explicit virtualization!=="none" should not be overridden by preset
    if (key === "virtualization" && base.virtualization && base.virtualization !== "none" && profile.virtualization === "none") {
      continue;
    }
    // Carve-out: explicit virtualization mode should not be downgraded
    if (key === "virtualizationMode" && base.virtualizationMode && base.virtualizationMode !== "none") {
      continue;
    }
    // Carve-out: UI checkboxes / explicit user flags
    if (UI_CARVE_OUTS.includes(key) && base[key] !== undefined) {
      continue;
    }
    (config as any)[key] = value;
  }
  return config;
}