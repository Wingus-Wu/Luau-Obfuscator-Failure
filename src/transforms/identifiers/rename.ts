import type { Program, Statement, Expression } from "../../ast/index.js";
import type { VariableDeclaration, FunctionDeclaration, Assignment, CompoundAssignment } from "../../ast/statements.js";
import type { Identifier, FunctionExpression, FunctionParam } from "../../ast/expressions.js";
import type { TransformContext } from "../transform.js";

function generateName(random: any, strategy: string, index: number): string {
  switch (strategy) {
    case "short":
      return "_" + random.nextInt(0x1000, 0xFFFF).toString(36);
    case "numeric":
      return "_" + index.toString(36);
    case "random": {
      const len = random.nextInt(4, 8);
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "_";
      for (let i = 0; i < len; i++) {
        result += chars[random.nextInt(0, chars.length - 1)];
      }
      return result;
    }
    case "unicode-safe": {
      const prefixes = ["\u03B1", "\u03B2", "\u03B3", "\u03B4", "\u03B5", "\u03B6", "\u03B7", "\u03B8"];
      return "_" + prefixes[random.nextInt(0, prefixes.length - 1)] + index.toString(36);
    }
    case "mixed":
    default: {
      const strategies = ["short", "numeric", "random"];
      return generateName(random, random.pick(strategies), index);
    }
  }
}

export class IdentifierRenamingTransform {
  name = "identifierRenaming";
  priority = 10;
  enabled = true;

  private renamingMap = new Map<string, string>();
  private nameIndex = 0;
  private random: any = null;
  private context: TransformContext | null = null;

  apply(ast: Program, context: TransformContext): Program {
    this.random = context.random;
    this.context = context;
    this.renamingMap.clear();
    this.nameIndex = 0;

    const newStatements = ast.statements.map(s => this.renameStatement(s, context));
    return { ...ast, statements: newStatements };
  }

  private getNewName(originalName: string): string {
    if (this.renamingMap.has(originalName)) {
      return this.renamingMap.get(originalName)!;
    }
    const strategy = this.random.pick(["short", "numeric", "random", "mixed"]);
    const newName = generateName(this.random, strategy, this.nameIndex++);
    this.renamingMap.set(originalName, newName);
    if (this.context) this.context.stats.identifiersRenamed++;
    return newName;
  }

  private isProtected(name: string): boolean {
    if (!this.context) return false;
    return (
      this.context.config.protectedIdentifiers.includes(name) ||
      this.context.config.globals.includes(name) ||
      (this.context.analyzer.protectedIdentifiers && this.context.analyzer.protectedIdentifiers.has(name)) ||
      (this.context.analyzer.builtinGlobals && this.context.analyzer.builtinGlobals.has(name)) ||
      (this.context.analyzer.globals && this.context.analyzer.globals.has(name))
    );
  }

  private renameStatement(stmt: Statement, context: TransformContext): Statement {
    switch (stmt.kind) {
      case "VariableDeclaration":
        return this.renameVariableDeclaration(stmt);
      case "FunctionDeclaration":
        return this.renameFunctionDeclaration(stmt);
      case "Assignment":
        return this.renameAssignment(stmt);
      case "CompoundAssignment":
        return {
          ...stmt,
          left: this.renameExpression(stmt.left),
          right: this.renameExpression(stmt.right),
        } as any;
      case "CallStatement":
        return { ...stmt, expression: this.renameExpression(stmt.expression as any) as any };
      case "MethodCallStatement":
        return { ...stmt, expression: this.renameExpression(stmt.expression as any) as any };
      case "ReturnStatement":
        return { ...stmt, expressions: stmt.expressions.map(e => this.renameExpression(e)) };
      case "BreakStatement":
      case "ContinueStatement":
        return stmt;
      case "IfStatement":
        return this.renameIfStatement(stmt);
      case "WhileLoop":
        return this.renameWhileLoop(stmt);
      case "RepeatLoop":
        return this.renameRepeatLoop(stmt);
      case "NumericForLoop":
        return this.renameNumericForLoop(stmt);
      case "GenericForLoop":
        return this.renameGenericForLoop(stmt);
      case "DoBlock":
        return this.renameDoBlock(stmt);
      case "ExportDeclaration":
        return this.renameExportDeclaration(stmt);
      case "TypeDeclaration":
        return stmt;
      default:
        return stmt;
    }
  }

  private renameVariableDeclaration(stmt: VariableDeclaration): VariableDeclaration {
    const newLeft = stmt.left.map(id => {
      if (this.isProtected(id.name)) return id;
      return { ...id, name: this.getNewName(id.name) };
    });
    const newRight = stmt.right.map(e => this.renameExpression(e));
    return { ...stmt, left: newLeft, right: newRight };
  }

  private renameFunctionDeclaration(stmt: FunctionDeclaration): FunctionDeclaration {
    const newName = this.isProtected(stmt.name.name)
      ? stmt.name
      : { ...stmt.name, name: this.getNewName(stmt.name.name) };
    const newParams = stmt.params.map(p => {
      if (p.isVararg) return p;
      return { ...p, name: this.getNewName(p.name) };
    });
    const newBody = stmt.body.map(s => this.renameStatement(s, this.context!));
    return { ...stmt, name: newName, params: newParams, body: newBody };
  }

  private renameAssignment(stmt: Assignment): Assignment {
    const newLeft = stmt.left.map(e => this.renameExpression(e) as any);
    const newRight = stmt.right.map(e => this.renameExpression(e));
    return { ...stmt, left: newLeft, right: newRight };
  }

  private renameIfStatement(stmt: any): any {
    return {
      ...stmt,
      condition: this.renameExpression(stmt.condition),
      body: stmt.body.map((s: any) => this.renameStatement(s, this.context!)),
      elseifBlocks: stmt.elseifBlocks.map((eb: any) => ({
        condition: this.renameExpression(eb.condition),
        body: eb.body.map((s: any) => this.renameStatement(s, this.context!)),
      })),
      elseBody: stmt.elseBody.map((s: any) => this.renameStatement(s, this.context!)),
    };
  }

  private renameWhileLoop(stmt: any): any {
    return {
      ...stmt,
      condition: this.renameExpression(stmt.condition),
      body: stmt.body.map((s: any) => this.renameStatement(s, this.context!)),
    };
  }

  private renameRepeatLoop(stmt: any): any {
    return {
      ...stmt,
      body: stmt.body.map((s: any) => this.renameStatement(s, this.context!)),
      condition: this.renameExpression(stmt.condition),
    };
  }

  private renameNumericForLoop(stmt: any): any {
    return {
      ...stmt,
      variable: { ...stmt.variable, name: this.getNewName(stmt.variable.name) },
      start: this.renameExpression(stmt.start),
      end: this.renameExpression(stmt.end),
      step: stmt.step ? this.renameExpression(stmt.step) : null,
      body: stmt.body.map((s: any) => this.renameStatement(s, this.context!)),
    };
  }

  private renameGenericForLoop(stmt: any): any {
    return {
      ...stmt,
      variables: stmt.variables.map((v: any) => ({ ...v, name: this.getNewName(v.name) })),
      expressions: stmt.expressions.map((e: any) => this.renameExpression(e)),
      body: stmt.body.map((s: any) => this.renameStatement(s, this.context!)),
    };
  }

  private renameDoBlock(stmt: any): any {
    return {
      ...stmt,
      body: stmt.body.map((s: any) => this.renameStatement(s, this.context!)),
    };
  }

  private renameExportDeclaration(stmt: any): any {
    return {
      ...stmt,
      declaration: this.renameStatement(stmt.declaration, this.context!),
    };
  }

  private renameExpression(expr: Expression): Expression {
    switch (expr.kind) {
      case "Identifier":
        if (this.isProtected(expr.name)) return expr;
        return { ...expr, name: this.getNewName(expr.name) };
      case "FunctionExpression":
        return this.renameFunctionExpr(expr);
      case "TableConstructor":
        return {
          ...expr,
          fields: expr.fields.map(f => {
            if (f.isNameKey) {
              return { ...f, value: this.renameExpression(f.value) };
            }
            return {
              ...f,
              key: f.key ? this.renameExpression(f.key) : null,
              value: this.renameExpression(f.value),
            };
          }),
        };
      case "BinaryExpression":
        return { ...expr, left: this.renameExpression(expr.left), right: this.renameExpression(expr.right) };
      case "UnaryExpression":
        return { ...expr, argument: this.renameExpression(expr.argument) };
      case "ParenthesizedExpression":
        return { ...expr, expression: this.renameExpression(expr.expression) };
      case "IndexExpression":
        return { ...expr, object: this.renameExpression(expr.object), index: this.renameExpression(expr.index) };
      case "MemberExpression":
        return { ...expr, object: this.renameExpression(expr.object) };
      case "CallExpression":
        return { ...expr, callee: this.renameExpression(expr.callee), args: expr.args.map(a => this.renameExpression(a)) };
      case "MethodCallExpression":
        return { ...expr, object: this.renameExpression(expr.object), args: expr.args.map(a => this.renameExpression(a)) };
      case "TypeCastExpression":
        return { ...expr, expression: this.renameExpression(expr.expression) };
      case "IfExpression":
        return {
          ...expr,
          clauses: expr.clauses.map(c => ({
            condition: this.renameExpression(c.condition),
            body: this.renameExpression(c.body),
          })),
          elseBody: this.renameExpression(expr.elseBody),
        };
      case "InterpString":
        return { ...expr, parts: expr.parts.map(p => typeof p === "string" ? p : this.renameExpression(p)) };
      default:
        return expr;
    }
  }

  private renameFunctionExpr(expr: FunctionExpression): FunctionExpression {
    const newParams = expr.params.map(p => {
      if (p.isVararg) return p;
      return { ...p, name: this.getNewName(p.name) };
    });
    const newBody = expr.body.map(s => this.renameStatement(s, this.context!));
    return { ...expr, params: newParams, body: newBody };
  }
}


