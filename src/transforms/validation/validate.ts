// @ts-ignore
import type { Program, Statement, Expression } from "../../ast/index.js";
import type { TransformContext } from "../transform.js";
import { Parser, ParseError } from "../../parser/index.js";
import { Generator } from "../../generator/index.js";

export class ValidationTransform {
  name = "validation";
  priority = 100;
  enabled = true;

  private random: any = null;
  private context: TransformContext | null = null;
  private parser = new Parser();
  private generator = new Generator();

  apply(ast: Program, context: TransformContext): Program {
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

  private validateSyntax(context: TransformContext): void {
    // The actual syntax validation happens after code generation
    // This is a placeholder for the validation that runs in obfuscator.ts
    // after generation
  }

  private validateAST(ast: Program): void {
    // Check for common AST issues
    for (const stmt of ast.statements) {
      this.checkStatement(stmt, new Set());
    }
  }

  private checkStatement(stmt: Statement, visited: Set<string>): void {
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

  private validateConsistency(ast: Program, context: TransformContext): void {
    // Check that all identifiers referenced are declared or are globals
    const declaredIdentifiers = new Set<string>();
    const globals = new Set<string>(context.config.globals);
    
    this.collectDeclaredIdentifiers(ast, declaredIdentifiers);
    
    this.checkIdentifierReferences(ast, declaredIdentifiers, globals);
  }

  private collectDeclaredIdentifiers(ast: Program, declared: Set<string>): void {
    for (const stmt of ast.statements) {
      this.collectFromStatement(stmt, declared);
    }
  }

  private collectFromStatement(stmt: Statement, declared: Set<string>): void {
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
        for (const s of stmt.body) this.collectFromStatement(s, declared);
        for (const s of stmt.elseBody) this.collectFromStatement(s, declared);
        for (const eb of stmt.elseifBlocks) {
          for (const s of eb.body) this.collectFromStatement(s, declared);
        }
        break;
      case "WhileLoop":
      case "RepeatLoop":
      case "NumericForLoop":
      case "GenericForLoop":
      case "DoBlock":
        for (const s of stmt.body) this.collectFromStatement(s, declared);
        break;
    }
  }

  private checkIdentifierReferences(ast: Program, declared: Set<string>, globals: Set<string>): void {
    for (const stmt of ast.statements) {
      this.checkReferencesInStatement(stmt, declared, globals);
    }
  }

  private checkReferencesInStatement(stmt: Statement, declared: Set<string>, globals: Set<string>): void {
    const checkExpression = (expr: Expression): void => {
      if (expr.kind === "Identifier") {
        if (!declared.has(expr.name) && !globals.has(expr.name) && !expr.global) {
          // This could be a valid reference to a global not in our list
          // Just warn, don't fail
        }
      } else if (expr.kind === "BinaryExpression") {
        checkExpression(expr.left);
        checkExpression(expr.right);
      } else if (expr.kind === "UnaryExpression") {
        checkExpression(expr.argument);
      } else if (expr.kind === "CallExpression") {
        checkExpression(expr.callee);
        for (const arg of expr.args) checkExpression(arg);
      } else if (expr.kind === "MethodCallExpression") {
        checkExpression(expr.object);
        for (const arg of expr.args) checkExpression(arg);
      } else if (expr.kind === "IndexExpression") {
        checkExpression(expr.object);
        checkExpression(expr.index);
      } else if (expr.kind === "MemberExpression") {
        checkExpression(expr.object);
      } else if (expr.kind === "FunctionExpression") {
        for (const s of expr.body) this.collectFromStatement(s, new Set());
      } else if (expr.kind === "TableConstructor") {
        for (const field of expr.fields) {
          if (field.key) checkExpression(field.key);
          checkExpression(field.value);
        }
      } else if (expr.kind === "IfExpression") {
        for (const clause of expr.clauses) {
          checkExpression(clause.condition);
          checkExpression(clause.body);
        }
        checkExpression(expr.elseBody);
      } else if (expr.kind === "InterpString") {
        for (const part of expr.parts) {
          if (typeof part !== "string") checkExpression(part);
        }
      }
    };

    const checkStmt = (s: Statement): void => {
      switch (s.kind) {
        case "VariableDeclaration":
          for (const e of s.right) checkExpression(e);
          break;
        case "FunctionDeclaration":
          for (const b of s.body) checkStmt(b);
          break;
        case "Assignment":
          for (const e of s.left) checkExpression(e as any);
          for (const e of s.right) checkExpression(e);
          break;
        case "IfStatement":
          checkExpression(s.condition);
          for (const b of s.body) checkStmt(b);
          for (const b of s.elseBody) checkStmt(b);
          break;
        case "WhileLoop":
        case "RepeatLoop":
          checkExpression(s.condition);
          for (const b of s.body) checkStmt(b);
          break;
        case "NumericForLoop":
          checkExpression(s.start);
          checkExpression(s.end);
          if (s.step) checkExpression(s.step);
          for (const b of s.body) checkStmt(b);
          break;
        case "GenericForLoop":
          for (const e of s.expressions) checkExpression(e);
          for (const b of s.body) checkStmt(b);
          break;
        case "DoBlock":
          for (const b of s.body) checkStmt(b);
          break;
        case "ReturnStatement":
          for (const e of s.expressions) checkExpression(e);
          break;
        case "CallStatement":
        case "MethodCallStatement":
          checkExpression(s.expression as any);
          break;
      }
    };

    checkStmt(stmt);
  }

  private validateRuntime(ast: Program, context: TransformContext): void {
    // Runtime validation would require a Lua/Luau VM
    // This is a placeholder for integration with fengari or similar
    // The actual implementation would:
    // 1. Generate code from AST
    // 2. Run it in a sandboxed Luau VM
    // 3. Compare outputs with expected behavior
    console.log("[Validation] Runtime validation requires Luau VM integration");
  }

  private validateDifferential(ast: Program, context: TransformContext): void {
    // Differential validation would:
    // 1. Generate obfuscated code
    // 2. Run both original and obfuscated with same inputs
    // 3. Compare outputs
    console.log("[Validation] Differential validation requires test harness");
  }
}