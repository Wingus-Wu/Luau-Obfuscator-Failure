export class SemanticAnalyzer {
    random;
    builtinGlobals;
    referencedGlobals = new Set();
    declaredLocals = new Set();
    properties = new Set();
    protectedIdentifiers;
    currentScope = null;
    scopes = [];
    exportedNames = new Set();
    allIdentifiers = new Map();
    functionSizes = new Map();
    constructor(random, globals, protectedIdentifiers) {
        this.random = random;
        this.builtinGlobals = new Set(globals);
        this.protectedIdentifiers = new Set(protectedIdentifiers);
    }
    analyze(program) {
        this.scopes = [];
        this.referencedGlobals = new Set();
        this.declaredLocals = new Set();
        this.properties = new Set();
        this.exportedNames = new Set();
        this.allIdentifiers = new Map();
        this.functionSizes = new Map();
        this.currentScope = { locals: new Map(), depth: 0, functionDepth: 0, name: "global" };
        this.scopes.push(this.currentScope);
        const processedStatements = program.statements.map(s => this.visitStatement(s));
        const result = {
            program: { statements: processedStatements },
            scopes: this.scopes,
            globals: this.referencedGlobals,
            builtinGlobals: this.builtinGlobals,
            declaredLocals: this.declaredLocals,
            properties: this.properties,
            exportedNames: this.exportedNames,
            protectedIdentifiers: this.protectedIdentifiers,
            allIdentifiers: this.allIdentifiers,
            functionSizes: this.functionSizes,
        };
        return result;
    }
    enterScope(name) {
        const depth = this.currentScope ? this.currentScope.depth + 1 : 0;
        const functionDepth = this.currentScope ? this.currentScope.functionDepth : 0;
        this.currentScope = { locals: new Map(), parent: this.currentScope ?? undefined, depth, functionDepth, name };
        this.scopes.push(this.currentScope);
    }
    exitScope() {
        if (this.currentScope?.parent) {
            this.currentScope = this.currentScope.parent;
        }
    }
    enterFunction() {
        const functionDepth = this.currentScope ? this.currentScope.functionDepth + 1 : 1;
        this.enterScope("function_" + functionDepth);
        if (this.currentScope) {
            this.currentScope.functionDepth = functionDepth;
        }
    }
    exitFunction() {
        this.exitScope();
    }
    declareIdentifier(name) {
        const info = {
            kind: "Identifier",
            name,
            line: 0,
            column: 0,
        };
        if (this.currentScope) {
            this.currentScope.locals.set(name, info);
            this.declaredLocals.add(name);
            const existing = this.allIdentifiers.get(name) ?? [];
            existing.push(info);
            this.allIdentifiers.set(name, existing);
        }
        return info;
    }
    resolveIdentifier(name) {
        let scope = this.currentScope;
        while (scope) {
            if (scope.locals.has(name)) {
                return scope.locals.get(name);
            }
            scope = scope.parent ?? null;
        }
        return null;
    }
    referenceGlobal(name) {
        if (!this.builtinGlobals.has(name)) {
            this.referencedGlobals.add(name);
        }
    }
    visitStatement(stmt) {
        switch (stmt.kind) {
            case "VariableDeclaration":
                return this.visitVariableDeclaration(stmt);
            case "FunctionDeclaration":
                return this.visitFunctionDeclaration(stmt);
            case "Assignment":
                return this.visitAssignment(stmt);
            case "CompoundAssignment":
                return this.visitCompoundAssignment(stmt);
            case "CallStatement":
                return { ...stmt, expression: this.visitExpression(stmt.expression) };
            case "MethodCallStatement":
                return { ...stmt, expression: this.visitExpression(stmt.expression) };
            case "ReturnStatement":
                return { ...stmt, expressions: stmt.expressions.map(e => this.visitExpression(e)) };
            case "BreakStatement":
            case "ContinueStatement":
                return stmt;
            case "IfStatement":
                return this.visitIfStatement(stmt);
            case "WhileLoop":
                return this.visitWhileLoop(stmt);
            case "RepeatLoop":
                return this.visitRepeatLoop(stmt);
            case "NumericForLoop":
                return this.visitNumericForLoop(stmt);
            case "GenericForLoop":
                return this.visitGenericForLoop(stmt);
            case "DoBlock":
                return this.visitDoBlock(stmt);
            case "ExportDeclaration":
                return this.visitExportDeclaration(stmt);
            case "TypeDeclaration":
                return stmt;
            default:
                return stmt;
        }
    }
    visitVariableDeclaration(stmt) {
        const newRight = stmt.right.map(e => this.visitExpression(e));
        const newLeft = stmt.left.map(id => {
            this.declareIdentifier(id.name);
            return id;
        });
        return { ...stmt, left: newLeft, right: newRight };
    }
    visitAssignment(stmt) {
        const newRight = stmt.right.map(e => this.visitExpression(e));
        const newLeft = stmt.left.map(e => {
            if (e.kind === "Identifier") {
                const resolved = this.resolveIdentifier(e.name);
                if (!resolved) {
                    this.referenceGlobal(e.name);
                }
                return e;
            }
            return this.visitExpression(e);
        });
        return { ...stmt, left: newLeft, right: newRight };
    }
    visitCompoundAssignment(stmt) {
        const newRight = this.visitExpression(stmt.right);
        let newLeft = stmt.left;
        if (stmt.left.kind === "Identifier") {
            const resolved = this.resolveIdentifier(stmt.left.name);
            if (!resolved) {
                this.referenceGlobal(stmt.left.name);
            }
        }
        else {
            newLeft = this.visitExpression(stmt.left);
        }
        return { ...stmt, left: newLeft, right: newRight };
    }
    visitFunctionDeclaration(stmt) {
        if (stmt.name && stmt.name.kind === "Identifier") {
            this.declareIdentifier(stmt.name.name);
        }
        this.enterFunction();
        const newParams = stmt.params.map(p => {
            if (p.isVararg)
                return p;
            this.declareIdentifier(p.name);
            return p;
        });
        const newBody = stmt.body.map(s => this.visitStatement(s));
        this.exitFunction();
        if (stmt.name && stmt.name.kind === "Identifier") {
            this.functionSizes.set(stmt.name.name, newBody.length);
        }
        return { ...stmt, params: newParams, body: newBody };
    }
    visitIfStatement(stmt) {
        return {
            ...stmt,
            condition: this.visitExpression(stmt.condition),
            body: stmt.body.map(s => this.visitStatement(s)),
            elseifBlocks: stmt.elseifBlocks.map(eb => ({ condition: this.visitExpression(eb.condition), body: eb.body.map(s => this.visitStatement(s)) })),
            elseBody: stmt.elseBody.map(s => this.visitStatement(s)),
        };
    }
    visitWhileLoop(stmt) {
        return {
            ...stmt,
            condition: this.visitExpression(stmt.condition),
            body: stmt.body.map(s => this.visitStatement(s)),
        };
    }
    visitRepeatLoop(stmt) {
        return {
            ...stmt,
            body: stmt.body.map(s => this.visitStatement(s)),
            condition: this.visitExpression(stmt.condition),
        };
    }
    visitNumericForLoop(stmt) {
        const start = this.visitExpression(stmt.start);
        const end = this.visitExpression(stmt.end);
        const step = stmt.step ? this.visitExpression(stmt.step) : null;
        this.enterScope("for_num");
        this.declareIdentifier(stmt.variable.name);
        const body = stmt.body.map(s => this.visitStatement(s));
        this.exitScope();
        return {
            ...stmt,
            start,
            end,
            step,
            body,
        };
    }
    visitGenericForLoop(stmt) {
        const expressions = stmt.expressions.map(e => this.visitExpression(e));
        this.enterScope("for_gen");
        const newVars = stmt.variables.map(v => {
            this.declareIdentifier(v.name);
            return v;
        });
        const body = stmt.body.map(s => this.visitStatement(s));
        this.exitScope();
        return {
            ...stmt,
            variables: newVars,
            expressions,
            body,
        };
    }
    visitDoBlock(stmt) {
        this.enterScope("do");
        const body = stmt.body.map(s => this.visitStatement(s));
        this.exitScope();
        return {
            ...stmt,
            body,
        };
    }
    visitExportDeclaration(stmt) {
        const decl = stmt.declaration;
        if (decl.kind === "FunctionDeclaration") {
            this.exportedNames.add(decl.name.name);
        }
        else if (decl.kind === "TypeDeclaration") {
            this.exportedNames.add(decl.name);
        }
        else if (decl.kind === "VariableDeclaration") {
            for (const id of decl.left) {
                this.exportedNames.add(id.name);
            }
        }
        return { ...stmt, declaration: this.visitStatement(decl) };
    }
    visitExpression(expr) {
        switch (expr.kind) {
            case "Identifier": {
                const resolved = this.resolveIdentifier(expr.name);
                if (resolved) {
                    return { ...expr, global: false };
                }
                this.referenceGlobal(expr.name);
                return { ...expr, global: true };
            }
            case "FunctionExpression":
                this.enterFunction();
                const newParams = expr.params.map(p => {
                    if (p.isVararg)
                        return p;
                    this.declareIdentifier(p.name);
                    return p;
                });
                const newBody = expr.body.map(s => this.visitStatement(s));
                this.exitFunction();
                return {
                    ...expr,
                    params: newParams,
                    body: newBody,
                };
            case "TableConstructor":
                return {
                    ...expr,
                    fields: expr.fields.map(f => {
                        if (f.isNameKey && f.key?.kind === "StringLiteral") {
                            this.properties.add(f.key.value);
                            return { ...f, value: this.visitExpression(f.value) };
                        }
                        return {
                            ...f,
                            key: f.key ? this.visitExpression(f.key) : null,
                            value: this.visitExpression(f.value),
                        };
                    }),
                };
            case "BinaryExpression":
                return { ...expr, left: this.visitExpression(expr.left), right: this.visitExpression(expr.right) };
            case "UnaryExpression":
                return { ...expr, argument: this.visitExpression(expr.argument) };
            case "ParenthesizedExpression":
                return { ...expr, expression: this.visitExpression(expr.expression) };
            case "IndexExpression":
                return { ...expr, object: this.visitExpression(expr.object), index: this.visitExpression(expr.index) };
            case "MemberExpression":
                this.properties.add(expr.property);
                return { ...expr, object: this.visitExpression(expr.object) };
            case "CallExpression":
                return { ...expr, callee: this.visitExpression(expr.callee), args: expr.args.map(a => this.visitExpression(a)) };
            case "MethodCallExpression":
                this.properties.add(expr.method);
                return { ...expr, object: this.visitExpression(expr.object), args: expr.args.map(a => this.visitExpression(a)) };
            case "TypeCastExpression":
                return { ...expr, expression: this.visitExpression(expr.expression) };
            case "IfExpression":
                return { ...expr, clauses: expr.clauses.map(c => ({ condition: this.visitExpression(c.condition), body: this.visitExpression(c.body) })), elseBody: this.visitExpression(expr.elseBody) };
            case "InterpString":
                return { ...expr, parts: expr.parts.map(p => typeof p === "string" ? p : this.visitExpression(p)) };
            default:
                return expr;
        }
    }
}
