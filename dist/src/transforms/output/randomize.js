export class OutputRandomizationTransform {
    name = "outputRandomization";
    priority = 95;
    enabled = true;
    random = null;
    context = null;
    apply(ast, context) {
        this.random = context.random;
        this.context = context;
        if (!context.config.outputRandomization) {
            return ast;
        }
        // Randomize statement order for top-level independent statements
        const statements = this.randomizeStatementOrder(ast.statements, context);
        // Apply formatting variations
        const result = {
            ...ast,
            statements: statements.map(s => this.randomizeStatementFormatting(s, context)),
            __outputRandomization: {
                whitespaceVariation: context.outputRandomizationState.whitespaceVariation,
                lineBreakStyle: context.outputRandomizationState.lineBreakStyle,
                helperOrder: context.outputRandomizationState.helperOrder,
            },
        };
        return result;
    }
    randomizeStatementOrder(statements, context) {
        // Group statements by dependency
        const groups = this.groupByDependency(statements);
        const result = [];
        for (const group of groups) {
            if (group.length > 1 && this.random.nextBool(0.5)) {
                // Shuffle independent statements
                result.push(...this.random.shuffle([...group]));
            }
            else {
                result.push(...group);
            }
        }
        return result;
    }
    groupByDependency(statements) {
        // Simple grouping: functions that don't reference each other can be reordered
        // For now, keep functions together but allow shuffling of independent functions
        const groups = [];
        let currentGroup = [];
        for (const stmt of statements) {
            if (stmt.kind === "FunctionDeclaration" || stmt.kind === "VariableDeclaration") {
                if (currentGroup.length > 0 && currentGroup[0].kind === "FunctionDeclaration") {
                    groups.push(currentGroup);
                    currentGroup = [stmt];
                }
                else {
                    currentGroup.push(stmt);
                }
            }
            else {
                currentGroup.push(stmt);
            }
        }
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }
        return groups.length > 0 ? groups : [statements];
    }
    randomizeStatementFormatting(stmt, context) {
        // This transform mainly affects the generator output
        // The actual randomization happens in the generator
        // Here we just mark the statement for formatting variations
        if (stmt.kind === "FunctionDeclaration") {
            return {
                ...stmt,
                // @ts-ignore
                __outputRandomization: {
                    whitespaceVariation: this.random.nextInt(0, 3),
                    lineBreakStyle: this.random.pick(["compact", "expanded", "mixed"]),
                    helperOrdering: this.random.pick(["original", "reversed", "shuffled"]),
                },
            };
        }
        return stmt;
    }
}
