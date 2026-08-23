// @ts-ignore
import type { Program, Statement, Expression } from "../../ast/index.js";
import type {
  VariableDeclaration,
  FunctionDeclaration,
  Assignment,
  ReturnStatement,
  IfStatement,
  WhileLoop,
  RepeatLoop,
  NumericForLoop,
  GenericForLoop,
  DoBlock,
  ExportDeclaration,
} from "../../ast/statements.js";
import type {
  BinaryExpression,
  UnaryExpression,
  NumberLiteral,
  BooleanLiteral,
  NilLiteral,
  Identifier,
  CallExpression,
  TableConstructor,
  MemberExpression,
  IndexExpression,
  ParenthesizedExpression,
  TypeCastExpression,
  IfExpression,
  InterpString,
} from "../../ast/expressions.js";
import type { TransformContext } from "../transform.js";

function hasSideEffects(expr: Expression): boolean {
  switch (expr.kind) {
    case "CallExpression":
    case "MethodCallExpression":
    case "FunctionExpression":
      return true;
    case "BinaryExpression":
      return hasSideEffects(expr.left) || hasSideEffects(expr.right);
    case "UnaryExpression":
      return hasSideEffects(expr.argument);
    case "ParenthesizedExpression":
      return hasSideEffects(expr.expression);
    case "IndexExpression":
      return hasSideEffects(expr.object) || hasSideEffects(expr.index);
    case "MemberExpression":
      return hasSideEffects(expr.object);
    case "TableConstructor":
      return expr.fields.some(f => hasSideEffects(f.value));
    case "IfExpression":
      return hasSideEffects(expr.elseBody) || expr.clauses.some(c => hasSideEffects(c.body));
    default:
      return false;
  }
}

function transformExpression(expr: Expression, context: TransformContext): Expression {
  if ((expr as any).__generatedHelper) return expr;
  if (hasSideEffects(expr)) return expr;

  switch (expr.kind) {
    case "BinaryExpression":
      return transformBinary(expr, context);
    case "UnaryExpression":
      return transformUnary(expr, context);
    default:
      return expr;
  }
}

function transformBinary(expr: BinaryExpression, context: TransformContext): Expression {
  const left = transformExpression(expr.left, context);
  const right = transformExpression(expr.right, context);

  if (left.kind === "NumberLiteral" && right.kind === "NumberLiteral") {
    const l = Number(left.raw);
    const r = Number(right.raw);
    if (!isNaN(l) && !isNaN(r)) {
      const result = evalBinary(l, expr.operator, r);
      if (result !== undefined && !isNaN(result)) {
        return { kind: "NumberLiteral", raw: String(result), line: expr.line, column: expr.column };
      }
    }
  }

  switch (expr.operator) {
    case "+":
      if (isZero(right)) return left;
      if (isZero(left)) return right;
      break;
    case "*":
      if (isZero(right)) return { kind: "NumberLiteral", raw: "0", line: expr.line, column: expr.column };
      if (isZero(left)) return { kind: "NumberLiteral", raw: "0", line: expr.line, column: expr.column };
      break;
    case "-":
      if (isZero(right)) return left;
      if (isZero(left)) return { kind: "UnaryExpression", operator: "-", argument: right, line: expr.line, column: expr.column };
      break;
    case "/":
      if (isOne(right)) return left;
      break;
    case "^":
      if (isOne(right)) return left;
      if (isZero(right)) return { kind: "NumberLiteral", raw: "1", line: expr.line, column: expr.column };
      break;
    case "..":
      if (isEmptyString(right)) return left;
      if (isEmptyString(left)) return right;
      break;
    case "and":
      if (isTrue(left)) return right;
      if (isFalse(left)) return left;
      break;
    case "or":
      if (isTrue(left)) return left;
      if (isFalse(left)) return right;
      break;
    case "==":
      if (left.kind === "Identifier" && right.kind === "Identifier" && left.name === right.name) {
        return { kind: "BooleanLiteral", value: true, line: expr.line, column: expr.column };
      }
      break;
    case "~=":
      if (left.kind === "Identifier" && right.kind === "Identifier" && left.name === right.name) {
        return { kind: "BooleanLiteral", value: false, line: expr.line, column: expr.column };
      }
      break;
  }

  if (context.random.nextBool(0.15) && !hasSideEffects(left) && !hasSideEffects(right)) {
    const encodeOps: Record<string, [string, (e1: Expression, e2: Expression) => Expression][]> = {
      "+": [["-", (l, r) => ({ kind: "BinaryExpression", operator: "-", left: l, right: { kind: "UnaryExpression", operator: "-", argument: r, line: expr.line, column: expr.column }, line: expr.line, column: expr.column })]],
      "-": [["+", (l, r) => ({ kind: "BinaryExpression", operator: "+", left: l, right: { kind: "UnaryExpression", operator: "-", argument: r, line: expr.line, column: expr.column }, line: expr.line, column: expr.column })]],
      "*": [["/", (l, r) => {
        if (isZero(r)) return expr;
        return { kind: "BinaryExpression", operator: "/", left: l, right: { kind: "BinaryExpression", operator: "/", left: { kind: "NumberLiteral", raw: "1", line: expr.line, column: expr.column }, right: r, line: expr.line, column: expr.column }, line: expr.line, column: expr.column };
      }]],
      "==": [["~=", (l, r) => ({ kind: "UnaryExpression", operator: "not", argument: { kind: "BinaryExpression", operator: "~=", left: l, right: r, line: expr.line, column: expr.column }, line: expr.line, column: expr.column })]],
      "<": [[">", (l, r) => ({ kind: "BinaryExpression", operator: ">", left: r, right: l, line: expr.line, column: expr.column })]],
      "<=": [[">=", (l, r) => ({ kind: "BinaryExpression", operator: ">=", left: r, right: l, line: expr.line, column: expr.column })]],
    };
    const ops = encodeOps[expr.operator];
    if (ops) {
      const [newOp, builder] = context.random.pick(ops);
      return builder(left, right);
    }
  }

  return { ...expr, left, right };
}

function transformUnary(expr: UnaryExpression, context: TransformContext): Expression {
  const arg = transformExpression(expr.argument, context);

  switch (expr.operator) {
    case "-":
      if (arg.kind === "NumberLiteral") {
        const val = Number(arg.raw);
        if (!isNaN(val)) {
          return { kind: "NumberLiteral", raw: String(-val), line: expr.line, column: expr.column };
        }
      }
      if (arg.kind === "UnaryExpression" && arg.operator === "-") {
        return arg.argument;
      }
      break;
    case "not":
      if (arg.kind === "BooleanLiteral") {
        return { kind: "BooleanLiteral", value: !arg.value, line: expr.line, column: expr.column };
      }
      if (arg.kind === "NilLiteral") {
        return { kind: "BooleanLiteral", value: true, line: expr.line, column: expr.column };
      }
      if (arg.kind === "UnaryExpression" && arg.operator === "not") {
        return arg.argument;
      }
      break;
    case "~":
      if (arg.kind === "UnaryExpression" && arg.operator === "~") {
        return arg.argument;
      }
      break;
  }

  return { ...expr, argument: arg };
}

function isZero(e: Expression): boolean {
  return e.kind === "NumberLiteral" && Number(e.raw) === 0;
}

function isOne(e: Expression): boolean {
  return e.kind === "NumberLiteral" && Number(e.raw) === 1;
}

function isEmptyString(e: Expression): boolean {
  return e.kind === "StringLiteral" && e.value === "";
}

function isTrue(e: Expression): boolean {
  return e.kind === "BooleanLiteral" && e.value === true;
}

function isFalse(e: Expression): boolean {
  return e.kind === "BooleanLiteral" && e.value === false;
}

function evalBinary(l: number, op: string, r: number): number | undefined {
  switch (op) {
    case "+": return l + r;
    case "-": return l - r;
    case "*": return l * r;
    case "/": return l / r;
    case "%": return l % r;
    case "^": return l ** r;
    case "//": return Math.floor(l / r);
    case "&": return l & r;
    case "|": return l | r;
    case "<<": return l << r;
    case ">>": return l >> r;
    default: return undefined;
  }
}

export class ExpressionTransform {
  name = "expressionTransforms";
  priority = 40;
  enabled = true;

  apply(ast: Program, context: TransformContext): Program {
    return {
      ...ast,
      statements: ast.statements.map(s => this.transformStmt(s, context)),
    };
  }

  private transformStmt(stmt: Statement, context: TransformContext): Statement {
    if ((stmt as any).__generatedHelper) return stmt;

    switch (stmt.kind) {
      case "VariableDeclaration":
        return { ...stmt, right: stmt.right.map(e => transformExpression(e, context)) };
      case "FunctionDeclaration":
        return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context)) };
      case "Assignment":
        return { ...stmt, left: stmt.left.map(e => transformExpression(e as Expression, context) as any), right: stmt.right.map(e => transformExpression(e, context)) };
      case "CompoundAssignment":
        return { ...stmt, left: transformExpression(stmt.left as Expression, context) as any, right: transformExpression(stmt.right, context) };
      case "ReturnStatement":
        return { ...stmt, expressions: stmt.expressions.map(e => transformExpression(e, context)) };
      case "IfStatement":
        return {
          ...stmt,
          condition: transformExpression(stmt.condition, context),
          body: stmt.body.map(s => this.transformStmt(s, context)),
          elseifBlocks: stmt.elseifBlocks.map(eb => ({ condition: transformExpression(eb.condition, context), body: eb.body.map(s => this.transformStmt(s, context)) })),
          elseBody: stmt.elseBody.map(s => this.transformStmt(s, context)),
        };
      case "WhileLoop":
        return { ...stmt, condition: transformExpression(stmt.condition, context), body: stmt.body.map(s => this.transformStmt(s, context)) };
      case "RepeatLoop":
        return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context)), condition: transformExpression(stmt.condition, context) };
      case "NumericForLoop":
        return { ...stmt, start: transformExpression(stmt.start, context), end: transformExpression(stmt.end, context), step: stmt.step ? transformExpression(stmt.step, context) : null, body: stmt.body.map(s => this.transformStmt(s, context)) };
      case "GenericForLoop":
        return { ...stmt, expressions: stmt.expressions.map(e => transformExpression(e, context)), body: stmt.body.map(s => this.transformStmt(s, context)) };
      case "DoBlock":
        return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context)) };
      case "ExportDeclaration":
        return { ...stmt, declaration: this.transformStmt(stmt.declaration, context) as any };
      default:
        return stmt;
    }
  }
}
