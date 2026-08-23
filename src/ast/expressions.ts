import type { BaseNode } from "./types.js";

export type Expression =
  | NilLiteral
  | BooleanLiteral
  | NumberLiteral
  | StringLiteral
  | InterpString
  | Vararg
  | Identifier
  | FunctionExpression
  | TableConstructor
  | BinaryExpression
  | UnaryExpression
  | ParenthesizedExpression
  | IndexExpression
  | MemberExpression
  | CallExpression
  | MethodCallExpression
  | TypeCastExpression
  | IfExpression;

export interface NilLiteral extends BaseNode {
  kind: "NilLiteral";
}

export interface BooleanLiteral extends BaseNode {
  kind: "BooleanLiteral";
  value: boolean;
}

export interface NumberLiteral extends BaseNode {
  kind: "NumberLiteral";
  raw: string;
}

export interface StringLiteral extends BaseNode {
  kind: "StringLiteral";
  value: string;
  raw: string;
  quoteStyle: "double" | "single" | "long";
}

export interface InterpString extends BaseNode {
  kind: "InterpString";
  parts: (string | Expression)[];
}

export interface Vararg extends BaseNode {
  kind: "Vararg";
}

export interface Identifier extends BaseNode {
  kind: "Identifier";
  name: string;
  global?: boolean;
  exported?: boolean;
  originalName?: string;
}

export interface FunctionParam {
  name: string;
  typeAnnotation: string | null;
  isVararg: boolean;
  default?: Expression;
}

export interface FunctionExpression extends BaseNode {
  kind: "FunctionExpression";
  params: FunctionParam[];
  hasVararg: boolean;
  returnAnnotations: (string | null)[];
  body: any[];
  isMethod: boolean;
  bindingName?: string;
}

export interface TableField {
  key: Expression | null;
  value: Expression;
  isNameKey: boolean;
}

export interface TableConstructor extends BaseNode {
  kind: "TableConstructor";
  fields: TableField[];
}

export interface BinaryExpression extends BaseNode {
  kind: "BinaryExpression";
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends BaseNode {
  kind: "UnaryExpression";
  operator: UnaryOperator;
  argument: Expression;
}

export interface ParenthesizedExpression extends BaseNode {
  kind: "ParenthesizedExpression";
  expression: Expression;
}

export interface IndexExpression extends BaseNode {
  kind: "IndexExpression";
  object: Expression;
  index: Expression;
}

export interface MemberExpression extends BaseNode {
  kind: "MemberExpression";
  object: Expression;
  property: string;
}

export interface CallExpression extends BaseNode {
  kind: "CallExpression";
  callee: Expression;
  args: Expression[];
  selfArg?: Expression;
}

export interface MethodCallExpression extends BaseNode {
  kind: "MethodCallExpression";
  object: Expression;
  method: string;
  args: Expression[];
}

export interface TypeCastExpression extends BaseNode {
  kind: "TypeCastExpression";
  expression: Expression;
  typeText: string;
}

export interface IfExpression extends BaseNode {
  kind: "IfExpression";
  clauses: { condition: Expression; body: Expression }[];
  elseBody: Expression;
}

export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "^"
  | ".."
  | "=="
  | "~="
  | "<"
  | ">"
  | "<="
  | ">="
  | "and"
  | "or"
  | "&"
  | "|"
  | "<<"
  | ">>"
  | "//"
  | "+="
  | "-="
  | "*="
  | "/="
  | "%="
  | "^="
  | "..="
  | "&="
  | "|="
  | "<<="
  | ">>=";

export type UnaryOperator = "-" | "not" | "#" | "~";
