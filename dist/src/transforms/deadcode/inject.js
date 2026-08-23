function randomVarName(random) {
    const len = random.nextInt(3, 6);
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let name = "_";
    for (let i = 0; i < len; i++) {
        name += chars[random.nextInt(0, chars.length - 1)];
    }
    return name;
}
function randomNumber(random) {
    return { kind: "NumberLiteral", raw: String(random.nextInt(1, 1000)), line: 0, column: 0 };
}
function randomString(random) {
    const len = random.nextInt(3, 10);
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let s = "";
    for (let i = 0; i < len; i++)
        s += chars[random.nextInt(0, chars.length - 1)];
    return { kind: "StringLiteral", value: s, raw: JSON.stringify(s), quoteStyle: "double", line: 0, column: 0 };
}
function createDeadVar(random) {
    const name = randomVarName(random);
    const value = random.nextBool(0.5) ? randomNumber(random) : randomString(random);
    return {
        kind: "VariableDeclaration",
        left: [{ kind: "Identifier", name, line: 0, column: 0 }],
        right: [value],
        line: 0,
        column: 0,
    };
}
function createDeadCalc(random) {
    const a = randomVarName(random);
    const ops = ["+", "-", "*"];
    const op = random.pick(ops);
    return {
        kind: "VariableDeclaration",
        left: [{ kind: "Identifier", name: a, line: 0, column: 0 }],
        right: [
            {
                kind: "BinaryExpression",
                operator: op,
                left: randomNumber(random),
                right: randomNumber(random),
                line: 0,
                column: 0,
            },
        ],
        line: 0,
        column: 0,
    };
}
function createDeadTable(random) {
    const name = randomVarName(random);
    const fields = [];
    const count = random.nextInt(1, 4);
    for (let i = 0; i < count; i++) {
        fields.push({
            key: null,
            value: randomNumber(random),
            isNameKey: false,
        });
    }
    return {
        kind: "VariableDeclaration",
        left: [{ kind: "Identifier", name, line: 0, column: 0 }],
        right: [{ kind: "TableConstructor", fields, line: 0, column: 0 }],
        line: 0,
        column: 0,
    };
}
function createDeadDoBlock(random) {
    const count = random.nextInt(1, 3);
    const body = [];
    for (let i = 0; i < count; i++) {
        body.push(createDeadCalc(random));
    }
    return { kind: "DoBlock", body, line: 0, column: 0 };
}
function createDeadIf(random) {
    const name = randomVarName(random);
    return {
        kind: "IfStatement",
        condition: {
            kind: "BinaryExpression",
            operator: ">",
            left: { kind: "Identifier", name, line: 0, column: 0 },
            right: randomNumber(random),
            line: 0,
            column: 0,
        },
        body: [createDeadCalc(random)],
        elseifBlocks: [],
        elseBody: [createDeadCalc(random)],
        line: 0,
        column: 0,
    };
}
function createDeadCode(random) {
    const generators = [
        () => [createDeadVar(random)],
        () => [createDeadCalc(random)],
        () => [createDeadTable(random)],
        () => [createDeadDoBlock(random)],
        () => [createDeadIf(random)],
    ];
    return random.pick(generators)();
}
export class DeadCodeTransform {
    name = "deadCode";
    priority = 50;
    enabled = true;
    isGeneratedStatement(stmt) {
        return Boolean(stmt.__generatedHelper);
    }
    apply(ast, context) {
        const intensity = context.config.deadCodeIntensity;
        const counts = { low: 1, medium: 3, high: 6, extreme: 12 };
        let count = counts[intensity] || 3;
        if (ast.statements.length > 200) {
            count = Math.min(count, 1);
        }
        return {
            ...ast,
            statements: ast.statements.map(s => this.injectIntoStatement(s, context, count)),
        };
    }
    injectIntoStatement(stmt, context, count) {
        if (this.isGeneratedStatement(stmt))
            return stmt;
        switch (stmt.kind) {
            case "FunctionDeclaration":
                return this.injectIntoFunction(stmt, context, count);
            case "IfStatement":
                return {
                    ...stmt,
                    body: stmt.body.map(s => this.injectIntoStatement(s, context, count)),
                    elseBody: stmt.elseBody.map(s => this.injectIntoStatement(s, context, count)),
                };
            case "WhileLoop":
                return { ...stmt, body: stmt.body.map(s => this.injectIntoStatement(s, context, Math.max(1, count - 2))) };
            case "NumericForLoop":
                return { ...stmt, body: stmt.body.map(s => this.injectIntoStatement(s, context, Math.max(1, count - 2))) };
            case "GenericForLoop":
                return { ...stmt, body: stmt.body.map(s => this.injectIntoStatement(s, context, Math.max(1, count - 2))) };
            case "DoBlock":
                return {
                    ...stmt,
                    body: stmt.body.map(s => this.injectIntoStatement(s, context, count)),
                };
            case "ExportDeclaration":
                return { ...stmt, declaration: this.injectIntoStatement(stmt.declaration, context, count) };
            default:
                return stmt;
        }
    }
    injectIntoFunction(stmt, context, count) {
        const deadStatements = [];
        for (let i = 0; i < count; i++) {
            deadStatements.push(...createDeadCode(context.random));
        }
        context.stats.deadCodeInjected += deadStatements.length;
        return {
            ...stmt,
            body: [...deadStatements, ...stmt.body.map(s => this.injectIntoStatement(s, context, count))],
        };
    }
}
