export class PropertyProtectionTransform {
    name = "propertyProtection";
    priority = 70;
    enabled = true;
    apply(ast, context) {
        const protectedProps = new Set(context.config.protectedProperties);
        if (protectedProps.size === 0) {
            this.collectProperties(ast, protectedProps);
            if (protectedProps.size === 0)
                return ast;
        }
        return { ...ast, statements: ast.statements.map(s => this.transformStmt(s, context, protectedProps)), };
    }
    collectProperties(node, props) {
        if (!node || typeof node !== "object")
            return;
        if (node.kind === "MemberExpression" && typeof node.property === "string") {
            props.add(node.property);
        }
        for (const key of Object.keys(node)) {
            if (key === "kind" || key === "line" || key === "column" || key === "raw" || key === "value" || key === "quoteStyle")
                continue;
            const child = node[key];
            if (Array.isArray(child)) {
                for (const item of child)
                    this.collectProperties(item, props);
            }
            else if (child && typeof child === "object" && child.kind) {
                this.collectProperties(child, props);
            }
        }
    }
    transformStmt(stmt, context, protectedProps) { switch (stmt.kind) {
        case "VariableDeclaration": return { ...stmt, right: stmt.right.map(e => this.transformExpr(e, context, protectedProps)) };
        case "FunctionDeclaration": return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context, protectedProps)) };
        case "Assignment": return { ...stmt, left: stmt.left.map(e => this.transformExpr(e, context, protectedProps)), right: stmt.right.map(e => this.transformExpr(e, context, protectedProps)) };
        case "CallStatement": return { ...stmt, expression: this.transformExpr(stmt.expression, context, protectedProps) };
        case "MethodCallStatement": return { ...stmt, expression: this.transformExpr(stmt.expression, context, protectedProps) };
        case "IfStatement": return { ...stmt, condition: this.transformExpr(stmt.condition, context, protectedProps), body: stmt.body.map(s => this.transformStmt(s, context, protectedProps)), elseifBlocks: stmt.elseifBlocks.map(eb => ({ condition: this.transformExpr(eb.condition, context, protectedProps), body: eb.body.map(s => this.transformStmt(s, context, protectedProps)) })), elseBody: stmt.elseBody.map(s => this.transformStmt(s, context, protectedProps)) };
        case "WhileLoop": return { ...stmt, condition: this.transformExpr(stmt.condition, context, protectedProps), body: stmt.body.map(s => this.transformStmt(s, context, protectedProps)) };
        case "RepeatLoop": return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context, protectedProps)), condition: this.transformExpr(stmt.condition, context, protectedProps) };
        case "NumericForLoop": return { ...stmt, start: this.transformExpr(stmt.start, context, protectedProps), end: this.transformExpr(stmt.end, context, protectedProps), step: stmt.step ? this.transformExpr(stmt.step, context, protectedProps) : null, body: stmt.body.map(s => this.transformStmt(s, context, protectedProps)) };
        case "GenericForLoop": return { ...stmt, expressions: stmt.expressions.map(e => this.transformExpr(e, context, protectedProps)), body: stmt.body.map(s => this.transformStmt(s, context, protectedProps)) };
        case "DoBlock": return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context, protectedProps)) };
        case "ExportDeclaration": return { ...stmt, declaration: this.transformStmt(stmt.declaration, context, protectedProps) };
        default: return stmt;
    } }
    transformExpr(expr, context, protectedProps) { switch (expr.kind) {
        case "MemberExpression":
            if (protectedProps.has(expr.property)) {
                return { kind: "IndexExpression", object: expr.object, index: { kind: "StringLiteral", value: expr.property, raw: JSON.stringify(expr.property), quoteStyle: "double", line: expr.line, column: expr.column }, line: expr.line, column: expr.column, };
            }
            return { ...expr, object: this.transformExpr(expr.object, context, protectedProps) };
        case "TableConstructor": return { ...expr, fields: expr.fields.map(f => ({ ...f, key: f.key ? this.transformExpr(f.key, context, protectedProps) : null, value: this.transformExpr(f.value, context, protectedProps), })) };
        case "CallExpression": return { ...expr, callee: this.transformExpr(expr.callee, context, protectedProps), args: expr.args.map(a => this.transformExpr(a, context, protectedProps)) };
        case "MethodCallExpression": return { ...expr, object: this.transformExpr(expr.object, context, protectedProps), args: expr.args.map(a => this.transformExpr(a, context, protectedProps)) };
        case "BinaryExpression": return { ...expr, left: this.transformExpr(expr.left, context, protectedProps), right: this.transformExpr(expr.right, context, protectedProps) };
        case "UnaryExpression": return { ...expr, argument: this.transformExpr(expr.argument, context, protectedProps) };
        default: return expr;
    } }
}
