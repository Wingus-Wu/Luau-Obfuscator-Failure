export class ConstantProtectionTransform {
    name = "constantProtection";
    priority = 30;
    enabled = true;
    isGeneratedStatement(stmt) {
        return Boolean(stmt.__generatedHelper);
    }
    isGeneratedExpression(expr) {
        return Boolean(expr.__generatedHelper);
    }
    apply(ast, context) {
        return {
            ...ast,
            statements: ast.statements.map(s => this.transformStatement(s, context)),
        };
    }
    transformStatement(stmt, context) {
        if (this.isGeneratedStatement(stmt))
            return stmt;
        switch (stmt.kind) {
            case "VariableDeclaration":
                return { ...stmt, right: stmt.right.map(e => this.transformExpression(e, context)) };
            case "FunctionDeclaration":
                return { ...stmt, body: stmt.body.map(s => this.transformStatement(s, context)) };
            case "Assignment":
                return { ...stmt, right: stmt.right.map(e => this.transformExpression(e, context)) };
            case "CompoundAssignment":
                return { ...stmt, right: this.transformExpression(stmt.right, context) };
            case "ReturnStatement":
                return { ...stmt, expressions: stmt.expressions.map(e => this.transformExpression(e, context)) };
            case "CallStatement":
                return { ...stmt, expression: this.transformExpression(stmt.expression, context) };
            case "MethodCallStatement":
                return { ...stmt, expression: this.transformExpression(stmt.expression, context) };
            case "IfStatement":
                return {
                    ...stmt,
                    condition: this.transformExpression(stmt.condition, context),
                    body: stmt.body.map(s => this.transformStatement(s, context)),
                    elseifBlocks: stmt.elseifBlocks.map(eb => ({
                        condition: this.transformExpression(eb.condition, context),
                        body: eb.body.map(s => this.transformStatement(s, context)),
                    })),
                    elseBody: stmt.elseBody.map(s => this.transformStatement(s, context)),
                };
            case "WhileLoop":
                return { ...stmt, condition: this.transformExpression(stmt.condition, context), body: stmt.body.map(s => this.transformStatement(s, context)) };
            case "RepeatLoop":
                return { ...stmt, body: stmt.body.map(s => this.transformStatement(s, context)), condition: this.transformExpression(stmt.condition, context) };
            case "NumericForLoop":
                return { ...stmt, start: this.transformExpression(stmt.start, context), end: this.transformExpression(stmt.end, context), step: stmt.step ? this.transformExpression(stmt.step, context) : null, body: stmt.body.map(s => this.transformStatement(s, context)) };
            case "GenericForLoop":
                return { ...stmt, expressions: stmt.expressions.map(e => this.transformExpression(e, context)), body: stmt.body.map(s => this.transformStatement(s, context)) };
            case "DoBlock":
                return { ...stmt, body: stmt.body.map(s => this.transformStatement(s, context)) };
            case "ExportDeclaration":
                return { ...stmt, declaration: this.transformStatement(stmt.declaration, context) };
            default:
                return stmt;
        }
    }
    transformExpression(expr, context) {
        if (this.isGeneratedExpression(expr))
            return expr;
        switch (expr.kind) {
            case "NumberLiteral":
                return this.protectNumber(expr, context);
            case "BooleanLiteral":
                return this.protectBoolean(expr, context);
            case "BinaryExpression":
                return { ...expr, left: this.transformExpression(expr.left, context), right: this.transformExpression(expr.right, context) };
            case "UnaryExpression":
                return { ...expr, argument: this.transformExpression(expr.argument, context) };
            case "CallExpression":
                return { ...expr, callee: this.transformExpression(expr.callee, context), args: expr.args.map(a => this.transformExpression(a, context)) };
            case "MethodCallExpression":
                return { ...expr, object: this.transformExpression(expr.object, context), args: expr.args.map(a => this.transformExpression(a, context)) };
            case "TableConstructor":
                return { ...expr, fields: expr.fields.map(f => ({ ...f, key: f.key ? this.transformExpression(f.key, context) : null, value: this.transformExpression(f.value, context) })) };
            case "IndexExpression":
                return { ...expr, object: this.transformExpression(expr.object, context), index: this.transformExpression(expr.index, context) };
            case "MemberExpression":
                return { ...expr, object: this.transformExpression(expr.object, context) };
            case "ParenthesizedExpression":
                return { ...expr, expression: this.transformExpression(expr.expression, context) };
            case "TypeCastExpression":
                return { ...expr, expression: this.transformExpression(expr.expression, context) };
            case "IfExpression":
                return {
                    ...expr,
                    clauses: expr.clauses.map(c => ({ condition: this.transformExpression(c.condition, context), body: this.transformExpression(c.body, context) })),
                    elseBody: this.transformExpression(expr.elseBody, context),
                };
            case "InterpString":
                return { ...expr, parts: expr.parts.map(p => typeof p === "string" ? p : this.transformExpression(p, context)) };
            default:
                return expr;
        }
    }
    protectNumber(num, context) {
        const value = parseFloat(num.raw);
        if (isNaN(value))
            return num;
        if (value === 0 || value === 1 || value === -1)
            return num;
        const strategies = ["arithmetic", "bitwise", "string"];
        const strategy = context.random.pick(strategies);
        context.stats.constantsTransformed++;
        switch (strategy) {
            case "arithmetic": {
                const ops = [
                    () => {
                        const a = context.random.nextInt(1, Math.floor(Math.abs(value)) + 1);
                        const b = value - a;
                        return { kind: "BinaryExpression", operator: "+", left: { kind: "NumberLiteral", raw: String(a), line: num.line, column: num.column }, right: { kind: "NumberLiteral", raw: String(b), line: num.line, column: num.column }, line: num.line, column: num.column };
                    },
                    () => {
                        const a = context.random.nextInt(2, 10);
                        const b = value * a;
                        return { kind: "BinaryExpression", operator: "/", left: { kind: "NumberLiteral", raw: String(b), line: num.line, column: num.column }, right: { kind: "NumberLiteral", raw: String(a), line: num.line, column: num.column }, line: num.line, column: num.column };
                    },
                    () => {
                        const a = context.random.nextInt(1, 100);
                        const b = value + a;
                        return { kind: "BinaryExpression", operator: "-", left: { kind: "NumberLiteral", raw: String(b), line: num.line, column: num.column }, right: { kind: "NumberLiteral", raw: String(a), line: num.line, column: num.column }, line: num.line, column: num.column };
                    },
                    () => {
                        const a = context.random.nextInt(2, 5);
                        const b = value * a;
                        return { kind: "BinaryExpression", operator: "*", left: { kind: "NumberLiteral", raw: String(b), line: num.line, column: num.column }, right: { kind: "NumberLiteral", raw: String(a), line: num.line, column: num.column }, line: num.line, column: num.column };
                    },
                ];
                return context.random.pick(ops)();
            }
            case "bitwise": {
                const ops = [
                    () => ({ kind: "CallExpression", callee: { kind: "MemberExpression", object: { kind: "Identifier", name: "bit32" }, property: "bor" }, args: [{ kind: "NumberLiteral", raw: String(value), line: num.line, column: num.column }, { kind: "NumberLiteral", raw: "0", line: num.line, column: num.column }], line: num.line, column: num.column }),
                    () => ({ kind: "CallExpression", callee: { kind: "MemberExpression", object: { kind: "Identifier", name: "bit32" }, property: "band" }, args: [{ kind: "NumberLiteral", raw: String(value), line: num.line, column: num.column }, { kind: "NumberLiteral", raw: "4294967295", line: num.line, column: num.column }], line: num.line, column: num.column }),
                ];
                return context.random.pick(ops)();
            }
            case "string":
                return {
                    kind: "CallExpression",
                    callee: {
                        kind: "MemberExpression",
                        object: { kind: "Identifier", name: "string", line: num.line, column: num.column },
                        property: "byte",
                        line: num.line,
                        column: num.column,
                    },
                    args: [{
                            kind: "StringLiteral",
                            value: String.fromCharCode(value),
                            raw: JSON.stringify(String.fromCharCode(value)),
                            quoteStyle: "double",
                            line: num.line,
                            column: num.column,
                        }],
                    line: num.line,
                    column: num.column,
                };
            default:
                return num;
        }
    }
    protectBoolean(bool, context) {
        if (bool.value) {
            return { kind: "UnaryExpression", operator: "not", argument: { kind: "NilLiteral", line: bool.line, column: bool.column }, line: bool.line, column: bool.column };
        }
        else {
            return { kind: "UnaryExpression", operator: "not", argument: { kind: "NilLiteral", line: bool.line, column: bool.column }, line: bool.line, column: bool.column };
        }
    }
}
