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
    return { kind: "NumberLiteral", raw: String(random.nextInt(1, 1000000)), line: 0, column: 0 };
}
function makeId(name, line = 0, column = 0) {
    return { kind: "Identifier", name, line, column };
}
function makeNum(value, line = 0, column = 0) {
    return { kind: "NumberLiteral", raw: value, line, column };
}
function makeBool(value, line = 0, column = 0) {
    return { kind: "BooleanLiteral", value, line, column };
}
function makeBinary(op, left, right, line = 0, column = 0) {
    return { kind: "BinaryExpression", operator: op, left, right, line, column };
}
function makeUnary(op, arg, line = 0, column = 0) {
    return { kind: "UnaryExpression", operator: op, argument: arg, line, column };
}
function makeCall(callee, args, line = 0, column = 0) {
    return { kind: "CallExpression", callee, args, line, column };
}
function generateOpaquePredicate(random, style = "mixed") {
    const styles = style === "mixed" ? random.pick(["numeric", "string"]) : style;
    if (styles === "numeric") {
        // Numeric opaque predicates based on algebraic identities
        const type = random.nextInt(0, 5);
        switch (type) {
            case 0: {
                // x^2 + y^2 >= 2xy (always true for real numbers)
                const x = random.nextInt(1, 1000);
                const y = random.nextInt(1, 1000);
                const left = makeBinary("+", makeNum(String(x * x)), makeNum(String(y * y)));
                const right = makeNum(String(2 * x * y));
                return { predicate: makeBinary(">=", left, right), alwaysTrue: true, description: "sum-of-squares >= 2xy" };
            }
            case 1: {
                // (a + b)^2 = a^2 + 2ab + b^2
                const a = random.nextInt(1, 100);
                const b = random.nextInt(1, 100);
                const left = makeNum(String((a + b) * (a + b)));
                const right = makeBinary("+", makeBinary("+", makeNum(String(a * a)), makeNum(String(2 * a * b))), makeNum(String(b * b)));
                return { predicate: makeBinary("==", left, right), alwaysTrue: true, description: "square-of-sum identity" };
            }
            case 2: {
                // Bitwise: a & b <= a
                const a = random.nextInt(1, 10000);
                const b = random.nextInt(1, 10000);
                const left = makeBinary("&", makeNum(String(a)), makeNum(String(b)));
                const right = makeNum(String(a));
                return { predicate: makeBinary("<=", left, right), alwaysTrue: true, description: "bitwise-and upper bound" };
            }
            case 3: {
                // Modular arithmetic: (a * b) % a == 0
                const a = random.nextInt(1, 1000);
                const b = random.nextInt(1, 1000);
                const left = makeBinary("%", makeBinary("*", makeNum(String(a)), makeNum(String(b))), makeNum(String(a)));
                return { predicate: makeBinary("==", left, makeNum("0")), alwaysTrue: true, description: "modular-zero identity" };
            }
            case 4: {
                // XOR self-cancellation: a ^ b ^ b == a
                const a = random.nextInt(1, 10000);
                const b = random.nextInt(1, 10000);
                const left = makeBinary("^", makeBinary("^", makeNum(String(a)), makeNum(String(b))), makeNum(String(b)));
                return { predicate: makeBinary("==", left, makeNum(String(a))), alwaysTrue: true, description: "xor-self-cancellation" };
            }
            case 5: {
                // Multiplicative identity with bitwise: a * 1 == a
                const a = random.nextInt(1, 1000000);
                return { predicate: makeBinary("==", makeBinary("*", makeNum(String(a)), makeNum("1")), makeNum(String(a))), alwaysTrue: true, description: "multiplicative-identity" };
            }
        }
    }
    // String-based opaque predicates
    const str = "opaque_" + random.nextInt(10000, 99999);
    const len = str.length;
    return { predicate: makeBinary("==", makeCall(makeId("string.len"), [makeStr(str)]), makeNum(String(len))), alwaysTrue: true, description: "string-length-identity" };
}
function makeStr(value, line = 0, column = 0) {
    return { kind: "StringLiteral", value, raw: JSON.stringify(value), quoteStyle: "double", line, column };
}
function isGeneratedStatement(stmt) {
    return Boolean(stmt.__generatedHelper);
}
export class OpaquePredicateTransform {
    name = "opaquePredicate";
    priority = 55;
    enabled = true;
    random = null;
    context = null;
    apply(ast, context) {
        this.random = context.random;
        this.context = context;
        if (!context.config.controlFlowOpaquePredicates) {
            return ast;
        }
        return {
            ...ast,
            statements: ast.statements.map(s => this.transformStmt(s, context)),
        };
    }
    transformStmt(stmt, context) {
        if (isGeneratedStatement(stmt))
            return stmt;
        switch (stmt.kind) {
            case "FunctionDeclaration":
                return this.transformFunction(stmt, context);
            case "IfStatement":
                return this.transformIf(stmt, context);
            case "WhileLoop":
                return this.transformWhile(stmt, context);
            case "NumericForLoop":
                return this.transformFor(stmt, context);
            case "GenericForLoop":
                return this.transformGenericFor(stmt, context);
            case "DoBlock":
                return this.transformDoBlock(stmt, context);
            default:
                return { ...stmt, body: stmt.body?.map((s) => this.transformStmt(s, context)) };
        }
    }
    transformFunction(stmt, context) {
        if (stmt.body.length < 3)
            return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context)) };
        // Inject opaque predicates at function entry
        const entryPredicates = this.generateEntryPredicates(context);
        return {
            ...stmt,
            body: [...entryPredicates, ...stmt.body.map(s => this.transformStmt(s, context))],
        };
    }
    generateEntryPredicates(context) {
        const predicates = [];
        const count = this.random.nextInt(1, 3);
        for (let i = 0; i < count; i++) {
            const { predicate, alwaysTrue } = generateOpaquePredicate(this.random);
            const varName = randomVarName(this.random);
            // Create a variable that will always be true/false based on opaque predicate
            predicates.push({
                kind: "VariableDeclaration",
                left: [{ kind: "Identifier", name: varName, line: 0, column: 0 }],
                right: [predicate],
                line: 0,
                column: 0,
                __generatedHelper: true,
            });
            // Store for later use in control flow
            context.opaquePredicateState.set(varName, { value: alwaysTrue, predicate });
        }
        return predicates;
    }
    transformIf(stmt, context) {
        const newCondition = this.maybeWrapWithOpaquePredicate(stmt.condition, context);
        return {
            ...stmt,
            condition: newCondition,
            body: stmt.body.map(s => this.transformStmt(s, context)),
            elseifBlocks: stmt.elseifBlocks.map(eb => ({
                condition: this.maybeWrapWithOpaquePredicate(eb.condition, context),
                body: eb.body.map(s => this.transformStmt(s, context)),
            })),
            elseBody: stmt.elseBody.map(s => this.transformStmt(s, context)),
        };
    }
    maybeWrapWithOpaquePredicate(condition, context) {
        if (this.random.nextBool(0.3)) {
            const { predicate, alwaysTrue } = generateOpaquePredicate(this.random);
            const varName = randomVarName(this.random);
            // Create a variable to hold the opaque predicate result
            context.opaquePredicateState.set(varName, { value: alwaysTrue, predicate });
            // Wrap original condition with opaque predicate
            if (alwaysTrue) {
                return makeBinary("and", predicate, condition);
            }
            else {
                return makeBinary("or", makeUnary("not", predicate), condition);
            }
        }
        return condition;
    }
    transformWhile(stmt, context) {
        return {
            ...stmt,
            condition: this.maybeWrapWithOpaquePredicate(stmt.condition, context),
            body: stmt.body.map(s => this.transformStmt(s, context)),
        };
    }
    transformFor(stmt, context) {
        return {
            ...stmt,
            start: this.maybeWrapWithOpaquePredicate(stmt.start, context),
            end: this.maybeWrapWithOpaquePredicate(stmt.end, context),
            step: stmt.step ? this.maybeWrapWithOpaquePredicate(stmt.step, context) : null,
            body: stmt.body.map(s => this.transformStmt(s, context)),
        };
    }
    transformGenericFor(stmt, context) {
        return {
            ...stmt,
            expressions: stmt.expressions.map(e => this.maybeWrapWithOpaquePredicate(e, context)),
            body: stmt.body.map(s => this.transformStmt(s, context)),
        };
    }
    transformDoBlock(stmt, context) {
        // Inject opaque predicates inside do blocks
        const newBody = [];
        for (const s of stmt.body) {
            if (this.random.nextBool(0.2)) {
                const { predicate, alwaysTrue } = generateOpaquePredicate(this.random);
                const varName = randomVarName(this.random);
                newBody.push({
                    kind: "VariableDeclaration",
                    left: [{ kind: "Identifier", name: varName, line: 0, column: 0 }],
                    right: [predicate],
                    line: 0,
                    column: 0,
                    __generatedHelper: true,
                });
                context.opaquePredicateState.set(varName, { value: alwaysTrue, predicate });
            }
            newBody.push(this.transformStmt(s, context));
        }
        return { ...stmt, body: newBody };
    }
}
