// @ts-ignore
import type { Program, Statement, Expression } from "../../ast/index.js";
import type {
  FunctionDeclaration,
  IfStatement,
  WhileLoop,
  NumericForLoop,
  GenericForLoop,
  RepeatLoop,
  DoBlock,
  VariableDeclaration,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  Assignment,
  CompoundAssignment,
  CallStatement,
  MethodCallStatement,
  ExportDeclaration,
} from "../../ast/statements.js";
import type { Identifier, NumberLiteral, BinaryExpression, BooleanLiteral } from "../../ast/expressions.js";
import type { TransformContext } from "../transform.js";

export class ControlFlowTransform {
  name = "controlFlow";
  priority = 60;
  enabled = true;

  private isGeneratedStatement(stmt: Statement): boolean {
    return Boolean((stmt as any).__generatedHelper);
  }

  apply(ast: Program, context: TransformContext): Program {
    const maxSize = context.config.controlFlowMaxFunctionSize;
    const result = {
      ...ast,
      statements: ast.statements.map(s => this.transformStmt(s, context, maxSize)),
      __controlFlowProcessed: true,
    };
    return result;
  }

  private transformStmt(stmt: Statement, context: TransformContext, maxSize: number): Statement {
    if (this.isGeneratedStatement(stmt)) return stmt;

    switch (stmt.kind) {
      case "FunctionDeclaration":
        return this.transformFunction(stmt, context, maxSize);
      case "IfStatement":
        return this.transformIf(stmt, context);
      case "WhileLoop":
        return this.transformWhile(stmt, context);
      case "NumericForLoop":
        return this.transformFor(stmt, context);
      default:
        return { ...stmt, body: (stmt as any).body?.map((s: any) => this.transformStmt(s, context, maxSize)) } as any;
    }
  }

  private transformFunction(stmt: FunctionDeclaration, context: TransformContext, maxSize: number): FunctionDeclaration {
    if (stmt.body.length > maxSize) return stmt;
    if (this.hasNestedFunctions(stmt)) return stmt;
    if (this.hasReturnInLoop(stmt)) return stmt;

    if (context.random.nextBool(0.4)) {
      context.stats.controlFlowTransformed++;
      return this.flattenFunction(stmt, context);
    }
    return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context, maxSize)) };
  }

  private flattenFunction(stmt: FunctionDeclaration, context: TransformContext): FunctionDeclaration {
    const stateVar = "_s" + context.random.nextInt(1000, 9999);
    let currentState = 1;

    const newBody: Statement[] = [
      {
        kind: "VariableDeclaration",
        left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
        right: [{ kind: "NumberLiteral", raw: String(currentState), line: stmt.line, column: stmt.column }],
        line: stmt.line,
        column: stmt.column,
      },
      {
        kind: "WhileLoop",
        condition: { kind: "BooleanLiteral", value: true, line: stmt.line, column: stmt.column },
        body: this.flattenBody(stmt.body, context, stateVar, () => currentState++),
        line: stmt.line,
        column: stmt.column,
      },
    ];

    return { ...stmt, body: newBody };
  }

  private flattenBody(stmts: Statement[], context: TransformContext, stateVar: string, nextState: () => number): Statement[] {
    const result: Statement[] = [];
    let state = nextState();

    for (const stmt of stmts) {
      if (stmt.kind === "IfStatement") {
        const trueState = nextState();
        const falseState = nextState();
        const continueState = nextState();

        result.push({
          kind: "IfStatement",
          condition: {
            kind: "BinaryExpression",
            operator: "==",
            left: { kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column },
            right: { kind: "NumberLiteral", raw: String(state), line: stmt.line, column: stmt.column },
            line: stmt.line,
            column: stmt.column,
          },
          body: [
            {
              kind: "IfStatement",
              condition: stmt.condition,
              body: [
                {
                  kind: "Assignment",
                  left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
                  right: [{ kind: "NumberLiteral", raw: String(trueState), line: stmt.line, column: stmt.column }],
                  line: stmt.line,
                  column: stmt.column,
                } as any,
                ...stmt.body.map(s => this.flattenStmt(s, context, stateVar, nextState)),
                {
                  kind: "Assignment",
                  left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
                  right: [{ kind: "NumberLiteral", raw: String(continueState), line: stmt.line, column: stmt.column }],
                  line: stmt.line,
                  column: stmt.column,
                } as any,
              ],
              elseifBlocks: [],
              elseBody: [
                {
                  kind: "Assignment",
                  left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
                  right: [{ kind: "NumberLiteral", raw: String(falseState), line: stmt.line, column: stmt.column }],
                  line: stmt.line,
                  column: stmt.column,
                } as any,
                ...stmt.elseBody.map(s => this.flattenStmt(s, context, stateVar, nextState)),
                {
                  kind: "Assignment",
                  left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
                  right: [{ kind: "NumberLiteral", raw: String(continueState), line: stmt.line, column: stmt.column }],
                  line: stmt.line,
                  column: stmt.column,
                } as any,
              ],
              line: stmt.line,
              column: stmt.column,
            },
          ],
          elseifBlocks: [],
          elseBody: [],
          line: stmt.line,
          column: stmt.column,
        });
        state = continueState;
      } else if (stmt.kind === "ReturnStatement") {
        result.push({
          kind: "IfStatement",
          condition: {
            kind: "BinaryExpression",
            operator: "==",
            left: { kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column },
            right: { kind: "NumberLiteral", raw: String(state), line: stmt.line, column: stmt.column },
            line: stmt.line,
            column: stmt.column,
          },
          body: [stmt],
          elseifBlocks: [],
          elseBody: [],
          line: stmt.line,
          column: stmt.column,
        });
        state = nextState();
      } else {
        result.push(this.flattenStmt(stmt, context, stateVar, nextState));
      }
    }

    return result;
  }

  private flattenStmt(stmt: Statement, context: TransformContext, stateVar: string, nextState: () => number): Statement {
    if (stmt.kind === "IfStatement") return this.transformIf(stmt, context);
    if (stmt.kind === "WhileLoop") return this.transformWhile(stmt, context);
    if (stmt.kind === "NumericForLoop") return this.transformFor(stmt, context);
    return { ...stmt, body: (stmt as any).body?.map((s: any) => this.flattenStmt(s, context, stateVar, nextState)) } as any;
  }

  private transformIf(stmt: IfStatement, context: TransformContext): Statement {
    return {
      ...stmt,
      body: stmt.body.map(s => this.transformStmt(s, context, context.config.controlFlowMaxFunctionSize)),
      elseifBlocks: stmt.elseifBlocks.map(eb => ({
        condition: eb.condition,
        body: eb.body.map(s => this.transformStmt(s, context, context.config.controlFlowMaxFunctionSize)),
      })),
      elseBody: stmt.elseBody.map(s => this.transformStmt(s, context, context.config.controlFlowMaxFunctionSize)),
    };
  }

  private transformWhile(stmt: WhileLoop, context: TransformContext): Statement {
    if (context.random.nextBool(0.3)) {
      context.stats.controlFlowTransformed++;
      const stateVar = "_ws" + context.random.nextInt(1000, 9999);
      const condition = stmt.condition;
      const body = stmt.body;
      const newBody: Statement[] = [
        {
          kind: "VariableDeclaration",
          left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
          right: [{ kind: "BooleanLiteral", value: true, line: stmt.line, column: stmt.column }],
          line: stmt.line,
          column: stmt.column,
        },
        {
          kind: "WhileLoop",
          condition: { kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column },
          body: [
            {
              kind: "IfStatement",
              condition: condition,
              body: body.map(s => this.transformStmt(s, context, context.config.controlFlowMaxFunctionSize)),
              elseifBlocks: [],
              elseBody: [{
                kind: "Assignment",
                left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
                right: [{ kind: "BooleanLiteral", value: false, line: stmt.line, column: stmt.column }],
                line: stmt.line,
                column: stmt.column,
              } as any],
              line: stmt.line,
              column: stmt.column,
            },
          ],
          line: stmt.line,
          column: stmt.column,
        },
      ];
      return { ...stmt, condition: { kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }, body: newBody };
    }
    return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context, context.config.controlFlowMaxFunctionSize)) };
  }

  private transformFor(stmt: NumericForLoop, context: TransformContext): Statement {
    if (context.random.nextBool(0.3)) {
      context.stats.controlFlowTransformed++;
      const stateVar = "_fs" + context.random.nextInt(1000, 9999);
      return {
        ...stmt,
        body: [
          {
            kind: "VariableDeclaration",
            left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
            right: [{ kind: "BooleanLiteral", value: true, line: stmt.line, column: stmt.column }],
            line: stmt.line,
            column: stmt.column,
          },
          {
            kind: "WhileLoop",
            condition: { kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column },
            body: [
              {
                kind: "IfStatement",
                condition: {
                  kind: "BinaryExpression",
                  operator: ">",
                  left: { kind: "Identifier", name: stmt.variable.name, line: stmt.line, column: stmt.column },
                  right: stmt.end,
                  line: stmt.line,
                  column: stmt.column,
                },
                body: [{
                  kind: "Assignment",
                  left: [{ kind: "Identifier", name: stateVar, line: stmt.line, column: stmt.column }],
                  right: [{ kind: "BooleanLiteral", value: false, line: stmt.line, column: stmt.column }],
                  line: stmt.line,
                  column: stmt.column,
                } as any],
                elseifBlocks: [],
                elseBody: stmt.body.map(s => this.transformStmt(s, context, context.config.controlFlowMaxFunctionSize)),
                line: stmt.line,
                column: stmt.column,
              },
              {
                kind: "CompoundAssignment",
                operator: "+=",
                left: { kind: "Identifier", name: stmt.variable.name, line: stmt.line, column: stmt.column },
                right: stmt.step || { kind: "NumberLiteral", raw: "1", line: stmt.line, column: stmt.column },
                line: stmt.line,
                column: stmt.column,
              } as any,
            ],
            line: stmt.line,
            column: stmt.column,
          },
        ],
      };
    }
    return { ...stmt, body: stmt.body.map(s => this.transformStmt(s, context, context.config.controlFlowMaxFunctionSize)) };
  }

  private hasNestedFunctions(stmt: FunctionDeclaration): boolean {
    let found = false;
    const check = (s: Statement): void => {
      if (s.kind === "FunctionDeclaration") {
        found = true;
        return;
      }
      if ((s as any).body) {
        for (const child of (s as any).body) check(child);
      }
    };
    for (const s of stmt.body) check(s);
    return found;
  }

  private hasReturnInLoop(stmt: FunctionDeclaration): boolean {
    let found = false;
    const check = (s: Statement): void => {
      if (s.kind === "ReturnStatement") {
        found = true;
        return;
      }
      if ((s as any).body) {
        for (const child of (s as any).body) check(child);
      }
    };
    for (const s of stmt.body) {
      if (s.kind === "WhileLoop" || s.kind === "NumericForLoop" || s.kind === "GenericForLoop" || s.kind === "RepeatLoop") {
        for (const child of (s as any).body) check(child);
      }
    }
    return found;
  }
}
