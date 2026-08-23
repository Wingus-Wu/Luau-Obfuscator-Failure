import type {
  Token,
  TokenKind,
} from "./types.js";
import type {
  Statement,
  Program,
  VariableDeclaration,
  FunctionDeclaration,
  Assignment,
  CompoundAssignment,
  CallStatement,
  MethodCallStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
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
  FunctionParam,
  BinaryOperator,
  UnaryOperator,
  NilLiteral,
  BooleanLiteral,
  NumberLiteral,
  StringLiteral,
  InterpString,
  Vararg,
  Identifier,
  FunctionExpression,
  TableField,
  TableConstructor,
  BinaryExpression,
  UnaryExpression,
  ParenthesizedExpression,
  IndexExpression,
  MemberExpression,
  CallExpression,
  MethodCallExpression,
  TypeCastExpression,
  IfExpression,
} from "../ast/expressions.js";
import type { LogEntry } from "../server/logger";
import { Lexer } from "./lexer.js";

function loc(token: Token | { line: number; column: number }) {
  return { line: token.line, column: token.column };
}

export class ParseError extends Error {
  constructor(token: Token, message: string, source?: string) {
    let fullMessage = `Parse error at line ${token.line}, col ${token.column}: ${message}`;
    if (source) {
      const lines = source.split("\n");
      const lineIdx = Math.max(0, Math.min(token.line - 1, lines.length - 1));
      const lineText = lines[lineIdx] || "";
      const colIdx = Math.max(0, Math.min(token.column - 1, lineText.length));
      fullMessage += `\n  ${lineText}\n  ${" ".repeat(colIdx)}^`;
    }
    super(fullMessage);
    this.name = "ParseError";
  }
}

export class Parser {
  private tokens: Token[] = [];
  private current = 0;
  private source: string = "";
  private logs: LogEntry[] = [];
  private logSource = "Parser";

  parse(source: string): Program {
    this.source = source;
    this.logs = [];
    const lexer = new Lexer(source);
    this.tokens = lexer.lex();
    this.current = 0;

    this.log("debug", `Lexing complete`, { tokens: this.tokens.length });

    const statements: Statement[] = [];
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    return { statements };
  }

  private log(level: LogEntry["level"], message: string, data?: unknown) {
    const entry: LogEntry = {
      level,
      source: this.logSource,
      message,
      timestamp: Date.now(),
      data,
    };
    this.logs.push(entry);
    return entry;
  }

  getLogs() {
    return [...this.logs];
  }

  private isAtEnd(): boolean {
    return this.peek().kind === "EOF";
  }

  private peek(offset = 0): Token {
    const idx = this.current + offset;
    return this.tokens[idx] ?? { kind: "EOF", value: "", line: 0, column: 0 };
  }

  private previous(): Token {
    return this.tokens[this.current - 1] ?? { kind: "EOF", value: "", line: 0, column: 0 };
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(kind: TokenKind): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().kind === kind;
  }

  private match(...kinds: TokenKind[]): boolean {
    for (const kind of kinds) {
      if (this.check(kind)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(kind: TokenKind, message: string): Token {
    if (this.check(kind)) return this.advance();
    const token = this.peek();
    this.log("error", `consume failed: expected ${kind}, got ${token.kind}`, {
      expected: kind,
      got: token.kind,
      value: token.value,
      line: token.line,
      column: token.column,
      context: this.getSourceContext(token),
    });
    throw new ParseError(token, message, this.source);
  }

  private getSourceContext(token: Token): string {
    if (!this.tokens || this.tokens.length === 0) return "no source loaded";
    const start = Math.max(0, this.current - 3);
    const end = Math.min(this.tokens.length, this.current + 5);
    const contextTokens = this.tokens.slice(start, end);
    const parts = contextTokens.map((t, i) => {
      const marker = i === start ? ">>>" : "   ";
      return `${marker} ${t.kind} "${t.value}" (line ${t.line}, col ${t.column})`;
    });
    return "\n" + parts.join("\n");
  }

  private maybeSemicolon(): void {
    if (this.check("Semicolon")) {
      this.advance();
    } else if (!this.isAtEnd() && !this.isStatementStart(this.peek().kind)) {
      // If there's no semicolon and the next token isn't a statement start,
      // that's still okay for simple statements (e.g., expression statements)
    }
  }

  private isStatementStart(kind: TokenKind): boolean {
    return (
      kind === "Local" ||
      kind === "Function" ||
      kind === "Export" ||
      kind === "Type" ||
      kind === "If" ||
      kind === "While" ||
      kind === "Repeat" ||
      kind === "For" ||
      kind === "Do" ||
      kind === "Return" ||
      kind === "Break" ||
      kind === "Continue" ||
      kind === "EOF"
    );
  }

  private parseStatement(): Statement | null {
    if (this.match("Local")) {
      if (this.match("Function")) return this.parseFunctionDeclaration(false);
      return this.parseLocalDeclaration();
    }
    if (this.match("Function")) return this.parseFunctionDeclaration(false);
    if (this.match("Export")) {
      if (this.match("Type")) return this.parseExportDeclaration(this.parseTypeExport());
      if (this.match("Function")) return this.parseExportDeclaration(this.parseFunctionDeclaration(false) as FunctionDeclaration);
      return this.parseExportDeclaration(this.parseLocalDeclaration() as VariableDeclaration);
    }
    if (this.match("Type")) return this.parseTypeDeclaration();
    return this.parseSimpleStatement();
  }

  private parseLocalDeclaration(): VariableDeclaration {
    const token = this.previous();
    const names: Identifier[] = [];
    while (this.check("Identifier")) {
      names.push(this.identifier());
      if (this.match("Colon")) {
        this.parseTypeAnnotation();
      }
      if (!this.check("Comma")) break;
      this.advance();
    }
    const exprs: Expression[] = [];
    if (this.match("Assign")) {
      while (!this.isAtEnd() && !this.check("Semicolon")) {
        if (exprs.length > 0 && !this.check("Comma")) break;
        if (exprs.length > 0) this.consume("Comma", "Expected ',' in variable declaration");
        exprs.push(this.parseExpression());
      }
    }
    this.maybeSemicolon();
    return { kind: "VariableDeclaration", left: names, right: exprs, ...loc(token) };
  }

  private parseFunctionDeclaration(isMethod: boolean): FunctionDeclaration {
    const token = this.previous();
    const name = this.identifier();
    const params = this.parseParams();
    const returnAnnotations: (string | null)[] = this.parseReturnAnnotation();
    const body = this.parseBlock();
    this.consume("End", "Expected 'end' after function body");
    this.maybeSemicolon();
    return { kind: "FunctionDeclaration", name, params, hasVararg: params.some(p => p.isVararg), returnAnnotations, body, isMethod, ...loc(token) };
  }

  private parseExportDeclaration(decl: FunctionDeclaration | VariableDeclaration | TypeDeclaration): ExportDeclaration {
    const token = this.previous();
    return { kind: "ExportDeclaration", declaration: decl, ...loc(token) };
  }

  private parseTypeExport(): TypeDeclaration {
    const token = this.previous();
    const name = this.consume("Identifier", "Expected type name after 'export type'").value;
    const typeParams = this.parseTypeParams();
    const def = this.consume("Assign", "Expected '=' in type declaration").value === "=" ? "" : "";
    let definition = "";
    while (!this.isAtEnd() && !this.check("Semicolon")) {
      definition += this.advance().value;
    }
    this.maybeSemicolon();
    return { kind: "TypeDeclaration", name, typeParameters: typeParams, definition: definition.trim(), ...loc(token) };
  }

  private parseTypeDeclaration(): TypeDeclaration {
    const token = this.previous();
    const name = this.consume("Identifier", "Expected type name after 'type'").value;
    const typeParams = this.parseTypeParams();
    let definition = "";
    while (!this.isAtEnd() && !this.check("Semicolon")) {
      definition += this.advance().value;
    }
    this.maybeSemicolon();
    return { kind: "TypeDeclaration", name, typeParameters: typeParams, definition: definition.trim(), ...loc(token) };
  }

  private parseTypeParams(): string[] {
    const params: string[] = [];
    if (!this.check("Less")) return params;
    this.advance();
    while (!this.check("Greater") && !this.isAtEnd()) {
      if (params.length > 0) this.consume("Comma", "Expected ',' in type parameters");
      params.push(this.consume("Identifier", "Expected type parameter").value);
    }
    this.consume("Greater", "Expected '>' after type parameters");
    return params;
  }

  private parseParams(): FunctionParam[] {
    const params: FunctionParam[] = [];
    this.consume("LParen", "Expected '(' after function name");
    while (!this.check("RParen") && !this.isAtEnd()) {
      if (this.check("Vararg")) {
        this.advance();
        params.push({ name: "...", typeAnnotation: null, isVararg: true });
        if (this.check("Comma")) {
          this.advance();
        }
        continue;
      }
      if (params.length > 0) this.consume("Comma", "Expected ',' between parameters");
      const name = this.consume("Identifier", "Expected parameter name").value;
      let typeAnnotation: string | null = null;
      if (this.match("Colon")) {
        let depth = 0;
        let ann = "";
        while (!this.isAtEnd() && (depth > 0 || (!this.check("Comma") && !this.check("RParen")))) {
          if (this.check("LParen") || this.check("Less")) depth++;
          else if (this.check("RParen") || this.check("Greater")) depth--;
          if (depth === 0 && (this.check("Comma") && this.peek(1).kind !== "Vararg")) break;
          ann += this.advance().value;
        }
        typeAnnotation = ann.trim() || null;
      }
      params.push({ name, typeAnnotation, isVararg: false });
    }
    if (this.match("Vararg")) {
      params.push({ name: "...", typeAnnotation: null, isVararg: true });
    }
    this.consume("RParen", "Expected ')' after parameters");
    return params;
  }

  private parseTypeAnnotation(): string | null {
    let depth = 0;
    let ann = "";
    while (!this.isAtEnd() && (depth > 0 || (!this.check("Comma") && !this.check("Assign") && !this.check("RParen")))) {
      if (this.check("LParen") || this.check("Less")) depth++;
      else if (this.check("RParen") || this.check("Greater")) depth--;
      ann += this.advance().value;
    }
    return ann.trim() || null;
  }

  private parseReturnAnnotation(): (string | null)[] {
    const annotations: (string | null)[] = [];
    if (this.match("Colon")) {
      let depth = 0;
      let ann = "";
      while (!this.isAtEnd() && (depth > 0 || (!this.check("Semicolon") && !this.check("Do") && !this.check("End") && !this.check("Else") && !this.check("Elseif") && !this.check("Until")))) {
        if (this.check("LParen") || this.check("Less")) depth++;
        else if (this.check("RParen") || this.check("Greater")) depth--;
        ann += this.advance().value;
      }
      annotations.push(ann.trim() || null);
    }
    return annotations;
  }

  private parseBlock(): Statement[] {
    const stmts: Statement[] = [];
    while (!this.isAtEnd() && !this.check("End") && !this.check("Else") && !this.check("Elseif") && !this.check("Until")) {
      const stmt = this.parseStatement();
      if (stmt) stmts.push(stmt);
    }
    return stmts;
  }

  private parseSimpleStatement(): Statement {
    if (this.check("If")) return this.parseIfStatement();
    if (this.check("While")) return this.parseWhileLoop();
    if (this.check("Repeat")) return this.parseRepeatLoop();
    if (this.check("For")) return this.parseForLoop();
    if (this.check("Do")) return this.parseDoBlock();
    if (this.check("Return")) return this.parseReturnStatement();
    if (this.match("Break")) {
      const token = this.previous();
      this.maybeSemicolon();
      return { kind: "BreakStatement", ...loc(token) };
    }
    if (this.match("Continue")) {
      const token = this.previous();
      this.maybeSemicolon();
      return { kind: "ContinueStatement", ...loc(token) };
    }
    return this.parseExpressionStatement();
  }

  private parseIfStatement(): IfStatement {
    const token = this.consume("If", "Expected 'if'");
    const condition = this.parseExpression();
    this.consume("Then", "Expected 'then' after if condition");
    const body = this.parseBlock();
    const elseifBlocks: IfStatement["elseifBlocks"] = [];
    while (this.match("Elseif")) {
      const elseifCondition = this.parseExpression();
      this.consume("Then", "Expected 'then' after elseif condition");
      const elseifBody = this.parseBlock();
      elseifBlocks.push({ condition: elseifCondition, body: elseifBody });
    }
    let elseBody: Statement[] = [];
    if (this.match("Else")) {
      elseBody = this.parseBlock();
    }
    this.consume("End", "Expected 'end' after if block");
    this.maybeSemicolon();
    return { kind: "IfStatement", condition, body, elseifBlocks, elseBody, ...loc(token) };
  }

  private parseWhileLoop(): WhileLoop {
    const token = this.consume("While", "Expected 'while'");
    const condition = this.parseExpression();
    this.consume("Do", "Expected 'do' after while condition");
    const body = this.parseBlock();
    this.consume("End", "Expected 'end' after while body");
    this.maybeSemicolon();
    return { kind: "WhileLoop", condition, body, ...loc(token) };
  }

  private parseRepeatLoop(): RepeatLoop {
    const token = this.consume("Repeat", "Expected 'repeat'");
    const body = this.parseBlock();
    this.consume("Until", "Expected 'until' after repeat body");
    const condition = this.parseExpression();
    this.maybeSemicolon();
    return { kind: "RepeatLoop", body, condition, ...loc(token) };
  }

  private parseForLoop(): WhileLoop | NumericForLoop | GenericForLoop {
    const token = this.consume("For", "Expected 'for'");
    const name = this.identifier();

    if (this.match("Assign")) {
      const start = this.parseExpression();
      this.consume("Comma", "Expected ',' in numeric for");
      const end = this.parseExpression();
      let step: Expression | null = null;
      if (this.match("Comma")) {
        step = this.parseExpression();
      }
      this.consume("Do", "Expected 'do' in numeric for");
      const body = this.parseBlock();
      this.consume("End", "Expected 'end' after for body");
      this.maybeSemicolon();
      return { kind: "NumericForLoop", variable: name, start, end, step, body, ...loc(token) };
    } else {
      const variables: Identifier[] = [name];
      while (this.match("Comma")) {
        variables.push(this.identifier());
      }
      this.consume("In", "Expected 'in' in generic for");
      const expressions: Expression[] = [];
      while (!this.check("Do") && !this.isAtEnd()) {
        if (expressions.length > 0) this.consume("Comma", "Expected ',' in generic for");
        expressions.push(this.parseExpression());
      }
      this.consume("Do", "Expected 'do' in generic for");
      const body = this.parseBlock();
      this.consume("End", "Expected 'end' after for body");
      this.maybeSemicolon();
      return { kind: "GenericForLoop", variables, expressions, body, ...loc(token) };
    }
  }

  private parseDoBlock(): DoBlock {
    const token = this.consume("Do", "Expected 'do'");
    const body = this.parseBlock();
    this.consume("End", "Expected 'end' after do block");
    this.maybeSemicolon();
    return { kind: "DoBlock", body, ...loc(token) };
  }

  private parseReturnStatement(): ReturnStatement {
    const token = this.consume("Return", "Expected 'return'");
    const exprs: Expression[] = [];
    const stopKinds = new Set(["Semicolon", "End", "Else", "Elseif", "Until"]);
    while (!this.isAtEnd() && !stopKinds.has(this.peek().kind)) {
      if (exprs.length > 0 && !this.check("Comma")) break;
      if (exprs.length > 0) this.consume("Comma", "Expected ',' in return statement");
      exprs.push(this.parseExpression());
    }
    this.maybeSemicolon();
    return { kind: "ReturnStatement", expressions: exprs, ...loc(token) };
  }

  private parseExpressionStatement(): CallStatement | MethodCallStatement | Assignment | CompoundAssignment {
    const expr = this.parseExpression();
    if (expr.kind === "CallExpression") {
      const token = loc(expr);
      this.maybeSemicolon();
      return { kind: "CallStatement", expression: expr, ...token };
    }
    if (expr.kind === "MethodCallExpression") {
      const token = loc(expr);
      this.maybeSemicolon();
      return { kind: "MethodCallStatement", expression: expr, ...token };
    }
    if (this.match("Assign")) {
      const token = this.previous();
      const right = this.parseExpression();
      this.maybeSemicolon();
      const left = expr as IndexExpression | MemberExpression | Identifier;
      return { kind: "Assignment", left: [left], right: [right], ...loc(token) };
    }
    const compoundOps: [TokenKind, BinaryOperator][] = [
      ["PlusEqual", "+="],
      ["MinusEqual", "-="],
      ["StarEqual", "*="],
      ["SlashEqual", "/="],
      ["PercentEqual", "%="],
      ["CaretEqual", "^="],
      ["DotDotEqual", "..="],
      ["AmpersandEqual", "&="],
      ["PipeEqual", "|="],
      ["LessLessEqual", "<<="],
      ["GreaterGreaterEqual", ">>="],
    ];
    for (const [tokenKind, op] of compoundOps) {
      if (this.match(tokenKind)) {
        const token = this.previous();
        const right = this.parseExpression();
        this.maybeSemicolon();
        const left = expr as Identifier | IndexExpression | MemberExpression;
        return { kind: "CompoundAssignment", operator: op, left, right, ...loc(token) };
      }
    }
    this.maybeSemicolon();
    return { kind: "CallStatement", expression: { kind: "CallExpression", callee: expr, args: [], ...loc(expr) }, ...loc(expr) };
  }

  private identifier(): Identifier {
    const token = this.consume("Identifier", "Expected identifier");
    return { kind: "Identifier", name: token.value, ...loc(token) };
  }

  private parseExpression(): Expression {
    return this.parseOr();
  }

  private parseOr(): Expression {
    let left = this.parseAnd();
    while (this.match("Or")) {
      const token = this.previous();
      const right = this.parseAnd();
      left = { kind: "BinaryExpression", operator: "or", left, right, ...loc(token) };
    }
    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseEquality();
    while (this.match("And")) {
      const token = this.previous();
      const right = this.parseEquality();
      left = { kind: "BinaryExpression", operator: "and", left, right, ...loc(token) };
    }
    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseComparison();
    while (this.match("EqualEqual", "TildeEqual")) {
      const token = this.previous();
      const right = this.parseComparison();
      left = { kind: "BinaryExpression", operator: token.value as BinaryOperator, left, right, ...loc(token) };
    }
    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseBitwiseOr();
    while (this.match("Less", "Greater", "LessEqual", "GreaterEqual")) {
      const token = this.previous();
      const right = this.parseBitwiseOr();
      left = { kind: "BinaryExpression", operator: token.value as BinaryOperator, left, right, ...loc(token) };
    }
    return left;
  }

  private parseBitwiseOr(): Expression {
    let left = this.parseBitwiseAnd();
    while (this.match("Pipe")) {
      const token = this.previous();
      const right = this.parseBitwiseAnd();
      left = { kind: "BinaryExpression", operator: "|", left, right, ...loc(token) };
    }
    return left;
  }

  private parseBitwiseAnd(): Expression {
    let left = this.parseShift();
    while (this.match("Ampersand")) {
      const token = this.previous();
      const right = this.parseShift();
      left = { kind: "BinaryExpression", operator: "&", left, right, ...loc(token) };
    }
    return left;
  }

  private parseShift(): Expression {
    let left = this.parseConcat();
    while (this.match("LessLess", "GreaterGreater")) {
      const token = this.previous();
      const right = this.parseConcat();
      left = { kind: "BinaryExpression", operator: token.value as BinaryOperator, left, right, ...loc(token) };
    }
    return left;
  }

  private parseConcat(): Expression {
    let left = this.parseAddition();
    while (this.match("DotDot")) {
      const token = this.previous();
      const right = this.parseAddition();
      left = { kind: "BinaryExpression", operator: "..", left, right, ...loc(token) };
    }
    return left;
  }

  private parseAddition(): Expression {
    let left = this.parseMultiplication();
    while (this.match("Plus", "Minus")) {
      const token = this.previous();
      const right = this.parseMultiplication();
      left = { kind: "BinaryExpression", operator: token.value as BinaryOperator, left, right, ...loc(token) };
    }
    return left;
  }

  private parseMultiplication(): Expression {
    let left = this.parseUnary();
    while (this.match("Star", "Slash", "Percent", "SlashSlash")) {
      const token = this.previous();
      const right = this.parseUnary();
      left = { kind: "BinaryExpression", operator: token.value as BinaryOperator, left, right, ...loc(token) };
    }
    return left;
  }

  private parseUnary(): Expression {
    if (this.match("Not", "Minus", "Hash", "Tilde", "Typeof")) {
      const token = this.previous();
      const arg = this.parseUnary();
      return { kind: "UnaryExpression", operator: token.value as UnaryOperator, argument: arg, ...loc(token) };
    }
    return this.parsePower();
  }

  private parsePower(): Expression {
    let left = this.parsePrimary();
    while (this.match("Caret")) {
      const token = this.previous();
      const right = this.parseUnary();
      left = { kind: "BinaryExpression", operator: "^", left, right, ...loc(token) };
    }
    return left;
  }

  private parsePrimary(): Expression {
    if (this.match("Nil")) {
      const token = this.previous();
      return { kind: "NilLiteral", ...loc(token) };
    }
    if (this.match("True")) {
      const token = this.previous();
      return { kind: "BooleanLiteral", value: true, ...loc(token) };
    }
    if (this.match("False")) {
      const token = this.previous();
      return { kind: "BooleanLiteral", value: false, ...loc(token) };
    }
    if (this.match("Number")) {
      const token = this.previous();
      return { kind: "NumberLiteral", raw: token.value, ...loc(token) };
    }
    if (this.match("String")) {
      const token = this.previous();
      return { kind: "StringLiteral", value: token.value, raw: token.value, quoteStyle: "double", ...loc(token) };
    }
    if (this.match("InterpString")) {
      const token = this.previous();
      return this.parseInterpString(token);
    }
    if (this.match("Vararg")) {
      const token = this.previous();
      return { kind: "Vararg", ...loc(token) };
    }

    if (this.match("Function")) return this.parseFunctionExpression(false);
    if (this.match("ColonColon")) {
      const token = this.previous();
      const target = this.identifier();
      return { kind: "Identifier", name: target.name, ...loc(token) };
    }

    if (this.check("LBrace")) return this.parseTableConstructor();

    if (this.check("LParen")) {
      const token = this.peek();
      this.advance();
      const expr = this.parseExpression();
      this.consume("RParen", "Expected ')'");
      // A parenthesized expression can be followed by member / method / index /
      // call postfixes: (a - b).Unit, (f):method(), (t)[k], (f)(args).
      return this.parsePostfix({ kind: "ParenthesizedExpression", expression: expr, ...loc(token) });
    }

    if (this.check("Identifier")) {
      let expr: Expression = this.identifier();
      if (this.match("ColonColon")) {
        const token = this.previous();
        let typeText = "";
        while (!this.isAtEnd() && !this.check("Comma") && !this.check("RParen") && !this.check("Semicolon") && !this.check("End") && !this.check("Then") && !this.check("Do") && !this.check("Else") && !this.check("Elseif") && !this.check("Until")) {
          typeText += this.advance().value;
        }
        expr = { kind: "TypeCastExpression", expression: expr, typeText: typeText.trim(), ...loc(token) };
      }
      // Apply member / method / index / call postfixes. Shared with the
      // parenthesized-expression branch so `(a).member`, `(f):m()`, `(t)[k]`,
      // `(f)(args)` all parse — not just `ident.member`.
      return this.parsePostfix(expr);
    }

     throw new ParseError(this.peek(), `Unexpected token: ${this.peek().kind}`, this.source);
  }

  private parseInterpString(token: Token): InterpString {
    const parts: (string | Expression)[] = [];
    const raw = token.value;
    let i = 0;
    let currentStr = "";
    while (i < raw.length) {
      if (raw[i] === "{") {
        if (raw[i + 1] === "{") {
          currentStr += "{";
          i += 2;
        } else {
          if (currentStr.length > 0) {
            parts.push(currentStr);
            currentStr = "";
          }
          let depth = 1;
          let j = i + 1;
          while (j < raw.length && depth > 0) {
            if (raw[j] === "{") depth++;
            else if (raw[j] === "}") depth--;
            if (depth === 0) break;
            j++;
          }
          const exprText = raw.slice(i + 1, j);
          const expr = this.parseExpressionFromText(exprText, token.line, token.column + i);
          parts.push(expr);
          i = j + 1;
        }
      } else if (raw[i] === "}") {
        if (raw[i + 1] === "}") {
          currentStr += "}";
          i += 2;
        } else {
          currentStr += raw[i];
          i++;
        }
      } else {
        currentStr += raw[i];
        i++;
      }
    }
    if (currentStr.length > 0) {
      parts.push(currentStr);
    }
    return { kind: "InterpString", parts, ...loc(token) };
  }

  private parseExpressionFromText(text: string, line: number, col: number): Expression {
    const lexer = new Lexer(text, line, col);
    const savedTokens = this.tokens;
    const savedCurrent = this.current;
    this.tokens = lexer.lex();
    this.current = 0;
    const expr = this.parseExpression();
    this.tokens = savedTokens;
    this.current = savedCurrent;
    return expr;
  }

  // Shared postfix-access loop for member access (.), method call (:),
  // index ([...]) and call ((...)/{...}). Used after both Identifier and
  // ParenthesizedExpression primaries so `(a - b).Unit`, `(f):m()`, `(t)[k]`,
  // `(f)(args)` and `f(x).y` all parse. Loop guard uses `check` (peek-only)
  // and the body uses `match` (advancing) so each `.`/`:`/`[`/`(`/`{` is
  // consumed exactly once (an earlier `match`-in-guard version dropped access).
  private parsePostfix(expr: Expression): Expression {
    while (this.check("Colon") || this.check("LBracket") || this.check("Dot") || this.check("LParen") || this.check("LBrace")) {
      if (this.match("Colon")) {
        const token = this.previous();
        const method = this.consume("Identifier", "Expected method name after ':'").value;
        const args = this.parseArguments();
        expr = { kind: "MethodCallExpression", object: expr, method, args, ...loc(token) };
      } else if (this.match("LBracket")) {
        const token = this.previous();
        const index = this.parseExpression();
        this.consume("RBracket", "Expected ']' after index");
        expr = { kind: "IndexExpression", object: expr, index, ...loc(token) };
      } else if (this.match("Dot")) {
        const token = this.previous();
        const property = this.consume("Identifier", "Expected property name after '.'").value;
        expr = { kind: "MemberExpression", object: expr, property, ...loc(token) };
      } else if (this.check("LParen") || this.check("LBrace")) {
        expr = this.finishCall(expr as any, this.previous());
      }
    }
    return expr;
  }

  private finishCall(callee: Expression, token: Token): CallExpression {
    const args = this.parseArguments();
    return { kind: "CallExpression", callee, args, ...loc(token) };
  }

  private parseArguments(): Expression[] {
    const args: Expression[] = [];
    if (this.match("LParen")) {
      while (!this.check("RParen") && !this.isAtEnd()) {
        if (args.length > 0) this.consume("Comma", "Expected ',' between arguments");
        args.push(this.parseExpression());
      }
      this.consume("RParen", "Expected ')' after arguments");
    } else if (this.match("LBrace")) {
      args.push(this.parseTableConstructor());
    }
    return args;
  }

  private parseFunctionExpression(isMethod: boolean): FunctionExpression {
    const token = this.previous();
    const params = this.parseParams();
    const returnAnnotations: (string | null)[] = this.parseReturnAnnotation();
    const body = this.parseBlock();
    this.consume("End", "Expected 'end' after function body");
    return { kind: "FunctionExpression", params, hasVararg: params.some(p => p.isVararg), returnAnnotations, body, isMethod, ...loc(token) };
  }

  private parseTableConstructor(): TableConstructor {
    const token = this.consume("LBrace", "Expected '{'");
    const fields: TableField[] = [];
    while (!this.check("RBrace") && !this.isAtEnd()) {
      let key: Expression | null = null;
      let value: Expression;
      let isNameKey = false;
      if (this.check("Identifier") && this.peek(1).kind === "Assign") {
        const name = this.advance().value;
        key = { kind: "StringLiteral", value: name, raw: name, quoteStyle: "double", ...loc(this.peek()) };
        this.advance();
        value = this.parseExpression();
        isNameKey = true;
      } else if (this.check("LBracket")) {
        const token = this.advance();
        key = this.parseExpression();
        this.consume("RBracket", "Expected ']'");
        this.consume("Assign", "Expected '='");
        value = this.parseExpression();
      } else {
        value = this.parseExpression();
      }
      fields.push({ key, value, isNameKey });
      if (this.check("Comma") || this.check("Semicolon")) {
        this.advance();
      } else {
        break;
      }
    }
    this.consume("RBrace", "Expected '}' after table constructor");
    return { kind: "TableConstructor", fields, ...loc(token) };
  }
}
