import { compileToBytecode } from "./vm.js";
function randomName(random, prefix) {
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
    apply(ast, context) {
        try {
            const { code, stats } = compileToBytecode(ast, context);
            context.stats.functionsVirtualized = stats.functionsVirtualized;
            const helperStmt = {
                kind: "RawStatement",
                code,
                line: 0,
                column: 0,
                __generatedHelper: true,
            };
            return {
                ...ast,
                statements: [helperStmt],
            };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn(`Virtualization failed: ${msg}`);
            return ast;
        }
    }
}
