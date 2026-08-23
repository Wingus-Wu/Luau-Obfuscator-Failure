import type { BaseNode } from "./types.js";
import type {
  Expression,
  Identifier,
  FunctionParam,
  BinaryOperator,
  IndexExpression,
  MemberExpression,
  CallExpression,
  MethodCallExpression,
} from "./expressions.js";

export type Statement =
  | RawStatement
  | VariableDeclaration
  | FunctionDeclaration
  | Assignment
  | CompoundAssignment
  | CallStatement
  | MethodCallStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | IfStatement
  | WhileLoop
  | RepeatLoop
  | NumericForLoop
  | GenericForLoop
  | DoBlock
  | ExportDeclaration
  | TypeDeclaration
  | ImportDeclaration;

export interface RawStatement extends BaseNode {
  kind: "RawStatement";
  code: string;
}

export interface VariableDeclaration extends BaseNode {
  kind: "VariableDeclaration";
  left: Identifier[];
  right: Expression[];
}

export interface FunctionDeclaration extends BaseNode {
  kind: "FunctionDeclaration";
  name: Identifier;
  params: FunctionParam[];
  hasVararg: boolean;
  returnAnnotations: (string | null)[];
  body: Statement[];
  isMethod: boolean;
}

export interface Assignment extends BaseNode {
  kind: "Assignment";
  left: (Identifier | IndexExpression | MemberExpression)[];
  right: Expression[];
}

export interface CompoundAssignment extends BaseNode {
  kind: "CompoundAssignment";
  operator: BinaryOperator;
  left: Identifier | IndexExpression | MemberExpression;
  right: Expression;
}

export interface CallStatement extends BaseNode {
  kind: "CallStatement";
  expression: CallExpression;
}

export interface MethodCallStatement extends BaseNode {
  kind: "MethodCallStatement";
  expression: MethodCallExpression;
}

export interface ReturnStatement extends BaseNode {
  kind: "ReturnStatement";
  expressions: Expression[];
}

export interface BreakStatement extends BaseNode {
  kind: "BreakStatement";
}

export interface ContinueStatement extends BaseNode {
  kind: "ContinueStatement";
}

export interface ElseIfBlock {
  condition: Expression;
  body: Statement[];
}

export interface IfStatement extends BaseNode {
  kind: "IfStatement";
  condition: Expression;
  body: Statement[];
  elseifBlocks: ElseIfBlock[];
  elseBody: Statement[];
}

export interface WhileLoop extends BaseNode {
  kind: "WhileLoop";
  condition: Expression;
  body: Statement[];
}

export interface RepeatLoop extends BaseNode {
  kind: "RepeatLoop";
  body: Statement[];
  condition: Expression;
}

export interface NumericForLoop extends BaseNode {
  kind: "NumericForLoop";
  variable: Identifier;
  start: Expression;
  end: Expression;
  step: Expression | null;
  body: Statement[];
}

export interface GenericForLoop extends BaseNode {
  kind: "GenericForLoop";
  variables: Identifier[];
  expressions: Expression[];
  body: Statement[];
}

export interface DoBlock extends BaseNode {
  kind: "DoBlock";
  body: Statement[];
}

export interface ExportDeclaration extends BaseNode {
  kind: "ExportDeclaration";
  declaration: FunctionDeclaration | VariableDeclaration | TypeDeclaration;
}

export interface TypeDeclaration extends BaseNode {
  kind: "TypeDeclaration";
  name: string;
  typeParameters: string[];
  definition: string;
}

export interface ImportDeclaration extends BaseNode {
  kind: "ImportDeclaration";
  path: string;
  imports: string[];
}

export interface Program {
  statements: Statement[];
}
