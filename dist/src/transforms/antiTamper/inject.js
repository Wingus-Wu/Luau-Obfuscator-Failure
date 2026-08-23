function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
function randomVarName(random) {
    const len = random.nextInt(3, 6);
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let name = "_";
    for (let i = 0; i < len; i++) {
        name += chars[random.nextInt(0, chars.length - 1)];
    }
    return name;
}
function makeId(name, line = 0, column = 0) {
    return { kind: "Identifier", name, line, column };
}
function makeNum(value, line = 0, column = 0) {
    return { kind: "NumberLiteral", raw: value, line, column };
}
function makeStr(value, line = 0, column = 0) {
    return { kind: "StringLiteral", value, raw: JSON.stringify(value), quoteStyle: "double", line, column };
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
function makeMember(object, property, line = 0, column = 0) {
    return { kind: "MemberExpression", object, property, line, column };
}
function makeBool(value, line = 0, column = 0) {
    return { kind: "BooleanLiteral", value, line, column };
}
export class AntiTamperTransform {
    name = "antiTamper";
    priority = 75;
    enabled = true;
    random = null;
    context = null;
    apply(ast, context) {
        this.random = context.random;
        this.context = context;
        if (!context.config.antiTamper) {
            return ast;
        }
        const checks = [];
        const protectedSections = [];
        // Collect functions to protect
        const functionsToProtect = [];
        for (const stmt of ast.statements) {
            if (stmt.kind === "FunctionDeclaration") {
                functionsToProtect.push(stmt);
            }
        }
        // Select subset to protect based on percentage
        const protectCount = Math.max(1, Math.floor(functionsToProtect.length * 0.5));
        const shuffled = this.random.shuffle([...functionsToProtect]);
        const selected = shuffled.slice(0, protectCount);
        for (const func of selected) {
            const funcName = func.name.name;
            const funcBody = this.serializeFunction(func);
            const hash = hashString(funcBody);
            protectedSections.push({ name: funcName, hash, data: funcBody });
            const checkVar = "_at_" + funcName + "_" + this.random.nextInt(1000, 9999);
            checks.push({
                kind: "VariableDeclaration",
                left: [{ kind: "Identifier", name: checkVar, line: func.line, column: func.column }],
                right: [{ kind: "NumberLiteral", raw: String(hash), line: func.line, column: func.column }],
                line: func.line,
                column: func.column,
            });
        }
        if (checks.length === 0)
            return ast;
        // Generate verification function
        const verifyFuncName = "_verify_" + this.random.nextInt(1000, 9999);
        const verifyBody = [
            {
                kind: "VariableDeclaration",
                left: [{ kind: "Identifier", name: "_at_ok", line: 0, column: 0 }],
                right: [{ kind: "BooleanLiteral", value: true, line: 0, column: 0 }],
                line: 0,
                column: 0,
            },
        ];
        for (const section of protectedSections) {
            const checkVar = "_at_" + section.name + "_" + this.random.nextInt(1000, 9999);
            // Note: In real implementation, we'd need to re-serialize at runtime
            // For now, we use the stored hash
            const currentHashVar = "_ch_" + section.name;
            verifyBody.push({
                kind: "VariableDeclaration",
                left: [{ kind: "Identifier", name: currentHashVar, line: 0, column: 0 }],
                right: [{ kind: "NumberLiteral", raw: String(hashString(this.serializeFunction({
                            kind: "FunctionDeclaration",
                            name: { kind: "Identifier", name: section.name, line: 0, column: 0 },
                            params: [],
                            hasVararg: false,
                            returnAnnotations: [],
                            body: [],
                            isMethod: false,
                            line: 0,
                            column: 0,
                        }))), line: 0, column: 0 }],
                line: 0,
                column: 0,
            });
            verifyBody.push({
                kind: "IfStatement",
                condition: makeBinary("~=", makeId(currentHashVar), makeNum(String(section.hash))),
                body: [
                    {
                        kind: "Assignment",
                        left: [makeId("_at_ok")],
                        right: [makeBool(false)],
                        line: 0,
                        column: 0,
                    },
                ],
                elseifBlocks: [],
                elseBody: [],
                line: 0,
                column: 0,
            });
        }
        // Add tamper response
        const tamperAction = context.config.antiTamperAction || "disable";
        let tamperResponse = [];
        switch (tamperAction) {
            case "warn":
                tamperResponse.push({
                    kind: "CallStatement",
                    expression: makeCall(makeId("warn"), [makeStr("[AntiTamper] Integrity check failed")]),
                    line: 0,
                    column: 0,
                });
                break;
            case "disable":
                tamperResponse.push({
                    kind: "ReturnStatement",
                    expressions: [makeStr("tampered")],
                    line: 0,
                    column: 0,
                });
                break;
            case "fail":
                tamperResponse.push({
                    kind: "CallStatement",
                    expression: makeCall(makeId("error"), [makeStr("[AntiTamper] Integrity violation detected")]),
                    line: 0,
                    column: 0,
                });
                break;
        }
        verifyBody.push({
            kind: "IfStatement",
            condition: makeUnary("not", makeId("_at_ok")),
            body: tamperResponse,
            elseifBlocks: [],
            elseBody: [],
            line: 0,
            column: 0,
        });
        verifyBody.push({
            kind: "ReturnStatement",
            expressions: [makeId("_at_ok")],
            line: 0,
            column: 0,
        });
        const verifyFunc = {
            kind: "FunctionDeclaration",
            name: makeId(verifyFuncName),
            params: [],
            hasVararg: false,
            returnAnnotations: [null],
            body: verifyBody,
            isMethod: false,
            line: 0,
            column: 0,
        };
        // Insert periodic verification calls
        const newStatements = [];
        for (const stmt of ast.statements) {
            newStatements.push(stmt);
            if (stmt.kind === "FunctionDeclaration" && this.random.nextBool(0.3)) {
                newStatements.push({
                    kind: "CallStatement",
                    expression: makeCall(makeId(verifyFuncName), []),
                    line: 0,
                    column: 0,
                });
            }
        }
        // Add verification function at the beginning
        newStatements.unshift(verifyFunc);
        context.stats.antiTamperChecks = checks.length + 1;
        return { ...ast, statements: newStatements };
    }
    serializeFunction(func) {
        // Simplified serialization for hashing
        return JSON.stringify({
            name: func.name.name,
            params: func.params.map(p => p.name),
            body: func.body.map(s => s.kind),
        });
    }
}
