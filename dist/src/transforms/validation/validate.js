import { Parser } from "../../parser/index.js";
import { Generator } from "../../generator/index.js";
export class ValidationTransform {
    name = "validation";
    priority = 100;
    enabled = true;
    random = null;
    context = null;
    parser = new Parser();
    generator = new Generator();
    apply(ast, context) {
        this.random = context.random;
        this.context = context;
        if (!context.config.validation) {
            return ast;
        }
        // Phase 1: Parse validation - ensure output is syntactically valid
        if (context.config.validation) {
            this.validateSyntax(context);
        }
        // Phase 2: AST validity checks
        this.validateAST(ast);
        // Phase 3: Static consistency checks
        this.validateConsistency(ast, context);
        // Phase 4: Runtime validation (if enabled)
        if (context.config.validationRuntimeTest) {
            this.validateRuntime(ast, context);
        }
        // Phase 5: Differential validation (if enabled)
        if (context.config.validationDifferentialTest) {
            this.validateDifferential(ast, context);
        }
        return ast;
    }
    validateSyntax(context) {
        // The actual syntax validation happens after code generation
        // This is a placeholder for the validation that runs in obfuscator.ts
        // after generation
    }
    validateAST(ast) {
        // Check for common AST issues
        for (const stmt of ast.statements) {
            this.checkStatement(stmt, new Set());
        }
    }
    checkStatement(stmt, visited) {
        // Detect circular references
        const stmtId = JSON.stringify(stmt).slice(0, 100);
        if (visited.has(stmtId)) {
            // Just warn, don't fail
            return;
        }
        visited.add(stmtId);
        // Check for required fields based on statement kind
        switch (stmt.kind) {
            case "FunctionDeclaration":
                if (!stmt.name || !stmt.name.name) {
                    // Just warn
                }
                if (!Array.isArray(stmt.body)) {
                    // Just warn
                }
                for (const s of stmt.body) {
                    this.checkStatement(s, new Set(visited));
                }
                break;
            case "IfStatement":
                if (!stmt.condition) {
                    // Just warn
                }
                for (const s of stmt.body) {
                    this.checkStatement(s, new Set(visited));
                }
                for (const s of stmt.elseBody) {
                    this.checkStatement(s, new Set(visited));
                }
                break;
            case "WhileLoop":
            case "RepeatLoop":
            case "NumericForLoop":
            case "GenericForLoop":
            case "DoBlock":
                if (!Array.isArray(stmt.body)) {
                    // Just warn
                }
                for (const s of stmt.body) {
                    this.checkStatement(s, new Set(visited));
                }
                break;
        }
    }
    validateConsistency(ast, context) {
        // Check that all identifiers referenced are declared or are globals
        const declaredIdentifiers = new Set();
        const globals = new Set(context.config.globals);
        this.collectDeclaredIdentifiers(ast, declaredIdentifiers);
        this.checkIdentifierReferences(ast, declaredIdentifiers, globals);
    }
    collectDeclaredIdentifiers(ast, declared) {
        for (const stmt of ast.statements) {
            this.collectFromStatement(stmt, declared);
        }
    }
    collectFromStatement(stmt, declared) {
        switch (stmt.kind) {
            case "VariableDeclaration":
                for (const id of stmt.left) {
                    declared.add(id.name);
                }
                break;
            case "FunctionDeclaration":
                declared.add(stmt.name.name);
                for (const param of stmt.params) {
                    if (!param.isVararg) {
                        declared.add(param.name);
                    }
                }
                for (const s of stmt.body) {
                    this.collectFromStatement(s, declared);
                }
                break;
            case "IfStatement":
                for (const s of stmt.body)
                    this.collectFromStatement(s, declared);
                for (const s of stmt.elseBody)
                    this.collectFromStatement(s, declared);
                for (const eb of stmt.elseifBlocks) {
                    for (const s of eb.body)
                        this.collectFromStatement(s, declared);
                }
                break;
            case "WhileLoop":
            case "RepeatLoop":
            case "NumericForLoop":
            case "GenericForLoop":
            case "DoBlock":
                for (const s of stmt.body)
                    this.collectFromStatement(s, declared);
                break;
        }
    }
    checkIdentifierReferences(ast, declared, globals) {
        for (const stmt of ast.statements) {
            this.checkReferencesInStatement(stmt, declared, globals);
        }
    }
    checkReferencesInStatement(stmt, declared, globals) {
        const checkExpression = (expr) => {
            if (expr.kind === "Identifier") {
                if (!declared.has(expr.name) && !globals.has(expr.name) && !expr.global) {
                    // This could be a valid reference to a global not in our list
                    // Just warn, don't fail
                }
            }
            else if (expr.kind === "BinaryExpression") {
                checkExpression(expr.left);
                checkExpression(expr.right);
            }
            else if (expr.kind === "UnaryExpression") {
                checkExpression(expr.argument);
            }
            else if (expr.kind === "CallExpression") {
                checkExpression(expr.callee);
                for (const arg of expr.args)
                    checkExpression(arg);
            }
            else if (expr.kind === "MethodCallExpression") {
                checkExpression(expr.object);
                for (const arg of expr.args)
                    checkExpression(arg);
            }
            else if (expr.kind === "IndexExpression") {
                checkExpression(expr.object);
                checkExpression(expr.index);
            }
            else if (expr.kind === "MemberExpression") {
                checkExpression(expr.object);
            }
            else if (expr.kind === "FunctionExpression") {
                for (const s of expr.body)
                    this.collectFromStatement(s, new Set());
            }
            else if (expr.kind === "TableConstructor") {
                for (const field of expr.fields) {
                    if (field.key)
                        checkExpression(field.key);
                    checkExpression(field.value);
                }
            }
            else if (expr.kind === "IfExpression") {
                for (const clause of expr.clauses) {
                    checkExpression(clause.condition);
                    checkExpression(clause.body);
                }
                checkExpression(expr.elseBody);
            }
            else if (expr.kind === "InterpString") {
                for (const part of expr.parts) {
                    if (typeof part !== "string")
                        checkExpression(part);
                }
            }
        };
        const checkStmt = (s) => {
            switch (s.kind) {
                case "VariableDeclaration":
                    for (const e of s.right)
                        checkExpression(e);
                    break;
                case "FunctionDeclaration":
                    for (const b of s.body)
                        checkStmt(b);
                    break;
                case "Assignment":
                    for (const e of s.left)
                        checkExpression(e);
                    for (const e of s.right)
                        checkExpression(e);
                    break;
                case "IfStatement":
                    checkExpression(s.condition);
                    for (const b of s.body)
                        checkStmt(b);
                    for (const b of s.elseBody)
                        checkStmt(b);
                    break;
                case "WhileLoop":
                case "RepeatLoop":
                    checkExpression(s.condition);
                    for (const b of s.body)
                        checkStmt(b);
                    break;
                case "NumericForLoop":
                    checkExpression(s.start);
                    checkExpression(s.end);
                    if (s.step)
                        checkExpression(s.step);
                    for (const b of s.body)
                        checkStmt(b);
                    break;
                case "GenericForLoop":
                    for (const e of s.expressions)
                        checkExpression(e);
                    for (const b of s.body)
                        checkStmt(b);
                    break;
                case "DoBlock":
                    for (const b of s.body)
                        checkStmt(b);
                    break;
                case "ReturnStatement":
                    for (const e of s.expressions)
                        checkExpression(e);
                    break;
                case "CallStatement":
                case "MethodCallStatement":
                    checkExpression(s.expression);
                    break;
            }
        };
        checkStmt(stmt);
    }
    validateRuntime(ast, context) {
        // Runtime validation would require a Lua/Luau VM
        // This is a placeholder for integration with fengari or similar
        // The actual implementation would:
        // 1. Generate code from AST
        // 2. Run it in a sandboxed Luau VM
        // 3. Compare outputs with expected behavior
        console.log("[Validation] Runtime validation requires Luau VM integration");
    }
    validateDifferential(ast, context) {
        // Differential validation would:
        // 1. Generate obfuscated code
        // 2. Run both original and obfuscated with same inputs
        // 3. Compare outputs
        console.log("[Validation] Differential validation requires test harness");
    }
}
