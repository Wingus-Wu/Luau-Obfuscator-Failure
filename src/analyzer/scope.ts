import type {
  Statement,
  Program,
  VariableDeclaration,
  FunctionDeclaration,
  Assignment,
  CompoundAssignment,
  IfStatement,
  WhileLoop,
  RepeatLoop,
  NumericForLoop,
  GenericForLoop,
  DoBlock,
  ExportDeclaration,
  TypeDeclaration,
} from "../ast/statements.js";
import type {
  Expression,
  Identifier,
  FunctionParam,
  BinaryOperator,
  NilLiteral,
  BooleanLiteral,
  NumberLiteral,
  StringLiteral,
  InterpString,
  Vararg,
  UnaryExpression,
  ParenthesizedExpression,
  IfExpression,
  CallExpression,
  MethodCallExpression,
  TableConstructor,
  TypeCastExpression,
  MemberExpression,
  IndexExpression,
} from "../ast/expressions.js";
import type { SourceLocation } from "../ast/types.js";
import type { RandomService } from "../utils/prng.js";

export interface ScopeInfo {
  locals: Map<string, Identifier>;
  parent?: ScopeInfo;
  depth: number;
  functionDepth: number;
  name: string;
}

export interface AnalyzerResult {
  program: Program;
  scopes: ScopeInfo[];
  globals: Set<string>;
  builtinGlobals: Set<string>;
  declaredLocals: Set<string>;
  properties: Set<string>;
  exportedNames: Set<string>;
  protectedIdentifiers: Set<string>;
  allIdentifiers: Map<string, Identifier[]>;
  functionSizes: Map<string, number>;
}

export class SemanticAnalyzer {
  private random: RandomService;
  private builtinGlobals: Set<string>;
  private referencedGlobals: Set<string> = new Set();
  private declaredLocals: Set<string> = new Set();
  private properties: Set<string> = new Set();
  private protectedIdentifiers: Set<string>;
  private currentScope: ScopeInfo | null = null;
  private scopes: ScopeInfo[] = [];
  private exportedNames: Set<string> = new Set();
  private allIdentifiers: Map<string, Identifier[]> = new Map();
  private functionSizes: Map<string, number> = new Map();

  constructor(random: RandomService, globals: string[], protectedIdentifiers: string[]) {
    this.random = random;
    this.builtinGlobals = new Set(globals);
    this.protectedIdentifiers = new Set(protectedIdentifiers);
  }

  analyze(program: Program): AnalyzerResult {
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
    const result: AnalyzerResult = {
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

  private enterScope(name: string): void {
    const depth = this.currentScope ? this.currentScope.depth + 1 : 0;
    const functionDepth = this.currentScope ? this.currentScope.functionDepth : 0;
    this.currentScope = { locals: new Map(), parent: this.currentScope ?? undefined, depth, functionDepth, name };
    this.scopes.push(this.currentScope);
  }

  private exitScope(): void {
    if (this.currentScope?.parent) {
      this.currentScope = this.currentScope.parent;
    }
  }

  private enterFunction(): void {
    const functionDepth = this.currentScope ? this.currentScope.functionDepth + 1 : 1;
    this.enterScope("function_" + functionDepth);
    if (this.currentScope) {
      this.currentScope.functionDepth = functionDepth;
    }
  }

  private exitFunction(): void {
    this.exitScope();
  }

  private declareIdentifier(name: string): Identifier {
    const info: Identifier = {
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

  private resolveIdentifier(name: string): Identifier | null {
    let scope: ScopeInfo | null = this.currentScope;
    while (scope) {
      if (scope.locals.has(name)) {
        return scope.locals.get(name)!;
      }
      scope = scope.parent ?? null;
    }
    return null;
  }

  private referenceGlobal(name: string): void {
    if (!this.builtinGlobals.has(name)) {
      this.referencedGlobals.add(name);
    }
  }

  private visitStatement(stmt: Statement): Statement {
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
        return { ...stmt, expression: this.visitExpression(stmt.expression as any) as any };
      case "MethodCallStatement":
        return { ...stmt, expression: this.visitExpression(stmt.expression as any) as any };
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

  private visitVariableDeclaration(stmt: VariableDeclaration): VariableDeclaration {
    const newRight = stmt.right.map(e => this.visitExpression(e));
    const newLeft: Identifier[] = stmt.left.map(id => {
      this.declareIdentifier(id.name);
      return id;
    });
    return { ...stmt, left: newLeft, right: newRight };
  }

  private visitAssignment(stmt: Assignment): Assignment {
    const newRight = stmt.right.map(e => this.visitExpression(e));
    const newLeft = stmt.left.map(e => {
      if (e.kind === "Identifier") {
        const resolved = this.resolveIdentifier(e.name);
        if (!resolved) {
          this.referenceGlobal(e.name);
        }
        return e;
      }
      return this.visitExpression(e) as any;
    });
    return { ...stmt, left: newLeft, right: newRight };
  }

  private visitCompoundAssignment(stmt: CompoundAssignment): CompoundAssignment {
    const newRight = this.visitExpression(stmt.right);
    let newLeft = stmt.left;
    if (stmt.left.kind === "Identifier") {
      const resolved = this.resolveIdentifier(stmt.left.name);
      if (!resolved) {
        this.referenceGlobal(stmt.left.name);
      }
    } else {
      newLeft = this.visitExpression(stmt.left) as any;
    }
    return { ...stmt, left: newLeft, right: newRight };
  }

  private visitFunctionDeclaration(stmt: FunctionDeclaration): FunctionDeclaration {
    if (stmt.name && stmt.name.kind === "Identifier") {
      this.declareIdentifier(stmt.name.name);
    }
    this.enterFunction();
    const newParams = stmt.params.map(p => {
      if (p.isVararg) return p;
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

  private visitIfStatement(stmt: IfStatement): IfStatement {
    return {
      ...stmt,
      condition: this.visitExpression(stmt.condition),
      body: stmt.body.map(s => this.visitStatement(s)),
      elseifBlocks: stmt.elseifBlocks.map(eb => ({ condition: this.visitExpression(eb.condition), body: eb.body.map(s => this.visitStatement(s)) })),
      elseBody: stmt.elseBody.map(s => this.visitStatement(s)),
    };
  }

  private visitWhileLoop(stmt: WhileLoop): WhileLoop {
    return {
      ...stmt,
      condition: this.visitExpression(stmt.condition),
      body: stmt.body.map(s => this.visitStatement(s)),
    };
  }

  private visitRepeatLoop(stmt: RepeatLoop): RepeatLoop {
    return {
      ...stmt,
      body: stmt.body.map(s => this.visitStatement(s)),
      condition: this.visitExpression(stmt.condition),
    };
  }

  private visitNumericForLoop(stmt: NumericForLoop): NumericForLoop {
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

  private visitGenericForLoop(stmt: GenericForLoop): GenericForLoop {
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

  private visitDoBlock(stmt: DoBlock): DoBlock {
    this.enterScope("do");
    const body = stmt.body.map(s => this.visitStatement(s));
    this.exitScope();
    return {
      ...stmt,
      body,
    };
  }

  private visitExportDeclaration(stmt: ExportDeclaration): ExportDeclaration {
    const decl = stmt.declaration;
    if (decl.kind === "FunctionDeclaration") {
      this.exportedNames.add(decl.name.name);
    } else if (decl.kind === "TypeDeclaration") {
      this.exportedNames.add(decl.name);
    } else if (decl.kind === "VariableDeclaration") {
      for (const id of decl.left) {
        this.exportedNames.add(id.name);
      }
    }
    return { ...stmt, declaration: this.visitStatement(decl) as any };
  }

  private visitExpression(expr: Expression): Expression {
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
          if (p.isVararg) return p;
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
