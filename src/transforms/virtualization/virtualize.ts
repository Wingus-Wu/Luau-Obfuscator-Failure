// @ts-ignore
import type { Program } from "../../ast/index.js";
import type { Statement } from "../../ast/statements.js";
import type { TransformContext, TransformStats } from "../transform.js";
import { compileToBytecode } from "./vm.js";

export type StringPoolStrategy = "xor" | "rotate" | "xor-chunked";

function randomName(random: any, prefix: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let name = "_" + prefix;
  for (let i = 0; i < 7; i++) {
    name += chars[random.nextInt(0, chars.length - 1)];
  }
  return name;
}

export class VirtualizationTransform {
  name = "virtualization";
  priority = 80;
  enabled = true;

  apply(ast: Program, context: TransformContext): Program {
    try {
      const { code, stats } = compileToBytecode(ast, context);
      context.stats.functionsVirtualized = stats.functionsVirtualized;

      const helperStmt: Statement = {
        kind: "RawStatement",
        code,
        line: 0,
        column: 0,
        __generatedHelper: true,
      } as any;

      return {
        ...ast,
        statements: [helperStmt],
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`Virtualization failed: ${msg}`);
      return ast;
    }
  }
}
