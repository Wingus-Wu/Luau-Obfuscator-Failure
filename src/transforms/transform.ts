// @ts-ignore
export type StringPoolStrategy = "xor" | "rotate" | "xor-chunked";

export interface TransformContext {
  random: any;
  config: any;
  analyzer: any;
  renamedIdentifiers: Map<string, string>;
  protectedStrings: string[];
  stats: TransformStats;
  stringPool: Map<number, { encoded: string; strategy: StringPoolStrategy }>;
  stringPoolDecoderName: string;
  stringPoolStrategy: StringPoolStrategy;
  stringPoolStrategyParams: any;
  opaquePredicateState: Map<string, any>;
  vmRuntimeState: {
    functionsToVirtualize: Set<string>;
    vmProfiles: Map<string, any>;
  };
  antiTamperState: {
    protectedRanges: { start: number; end: number; checksum: string }[];
    checksums: Map<string, string>;
  };
  outputRandomizationState: {
    whitespaceVariation: number;
    lineBreakStyle: string;
    helperOrder: string[];
  };
}

export interface TransformStats {
  identifiersRenamed: number;
  stringsProtected: number;
  constantsTransformed: number;
  deadCodeInjected: number;
  controlFlowTransformed: number;
  functionsVirtualized: number;
  opaquePredicatesInjected: number;
  antiTamperChecks: number;
}

export interface Transform {
  name: string;
  priority: number;
  enabled: boolean;
  apply(ast: any, context: TransformContext): any;
}

export interface ObfuscationResult {
  program: any;
  stats: TransformStats;
  seed: string;
  warnings: string[];
  skippedTransforms: string[];
}
