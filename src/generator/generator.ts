import type {
  Program, Statement,
  RawStatement,
  VariableDeclaration, FunctionDeclaration, Assignment, CompoundAssignment,
  CallStatement, MethodCallStatement, ReturnStatement, BreakStatement,
  ContinueStatement, IfStatement, WhileLoop, RepeatLoop, NumericForLoop,
  GenericForLoop, DoBlock, ExportDeclaration, TypeDeclaration,
} from "../ast/statements.js";
import type {
  Expression, FunctionParam, BinaryOperator,
  NilLiteral, BooleanLiteral, NumberLiteral, StringLiteral,
  InterpString, Vararg, Identifier, FunctionExpression,
  TableField, TableConstructor, BinaryExpression, UnaryExpression,
  ParenthesizedExpression, IndexExpression, MemberExpression,
  CallExpression, MethodCallExpression, TypeCastExpression, IfExpression,
} from "../ast/expressions.js";

export class Generator {
  private indent = 0;
  private output = "";

  generate(program: Program): string {
    this.output = "";
    for (const stmt of program.statements) {
      this.output += this.visitStatement(stmt);
      this.output += "\n";
    }
    return this.output.trimEnd() + "\n";
  }

  private visitStatement(stmt: Statement): string {
    switch (stmt.kind) {
      case "RawStatement":
        return stmt.code;

      case "VariableDeclaration":
        if (stmt.left.length === 0) return "";
        let vd = "  ".repeat(this.indent) + "local ";
        for (let i = 0; i < stmt.left.length; i++) {
          if (i > 0) vd += ", ";
          vd += stmt.left[i].name;
        }
        if (stmt.right.length > 0) {
          vd += " = ";
          for (let i = 0; i < stmt.right.length; i++) {
            if (i > 0) vd += ", ";
            vd += this.visitExpression(stmt.right[i]);
          }
        }
        vd += ";";
        return vd;

      case "FunctionDeclaration": {
        let fd = "  ".repeat(this.indent) + (stmt.isMethod ? "function " : "function ");
        fd += this.visitExpression(stmt.name as any);
        fd += this.visitParams(stmt.params);
        if (stmt.returnAnnotations.length > 0 && stmt.returnAnnotations[0]) {
          fd += ": " + stmt.returnAnnotations[0];
        }
        for (const s of stmt.body) {
          fd += "\n" + this.visitStatement(s);
        }
        fd += "\n" + "  ".repeat(this.indent) + "end";
        return fd;
      }

      case "Assignment": {
        let asn = "  ".repeat(this.indent);
        for (let i = 0; i < stmt.left.length; i++) {
          if (i > 0) asn += ", ";
          asn += this.visitExpression(stmt.left[i] as any);
        }
        asn += " = ";
        for (let i = 0; i < stmt.right.length; i++) {
          if (i > 0) asn += ", ";
          asn += this.visitExpression(stmt.right[i]);
        }
        asn += ";";
        return asn;
      }

      case "CompoundAssignment": {
        let ca = "  ".repeat(this.indent);
        const left = this.visitExpression(stmt.left as any);
        const op = stmt.operator.endsWith("=") ? stmt.operator.slice(0, -1) : stmt.operator;
        ca += left + " = " + left + " " + op + " " + this.visitExpression(stmt.right);
        ca += ";";
        return ca;
      }

      case "CallStatement":
        return "  ".repeat(this.indent) + this.visitExpression(stmt.expression as any) + ";";

      case "MethodCallStatement":
        return "  ".repeat(this.indent) + this.visitExpression(stmt.expression as any) + ";";

      case "ReturnStatement": {
        let rs = "  ".repeat(this.indent) + "return";
        for (const expr of stmt.expressions) {
          rs += " " + this.visitExpression(expr);
        }
        rs += ";";
        return rs;
      }

      case "BreakStatement":
        return "  ".repeat(this.indent) + "break;";

      case "ContinueStatement":
        return "  ".repeat(this.indent) + "continue;";

      case "IfStatement": {
        let ifs = "  ".repeat(this.indent) + "if " + this.visitExpression(stmt.condition) + " then";
        for (const s of stmt.body) {
          ifs += "\n" + this.visitStatement(s);
        }
        for (const elseif of stmt.elseifBlocks) {
          ifs += "\n" + "  ".repeat(this.indent) + "elseif " + this.visitExpression(elseif.condition) + " then";
          for (const s of elseif.body) {
            ifs += "\n" + this.visitStatement(s);
          }
        }
        if (stmt.elseBody.length > 0) {
          ifs += "\n" + "  ".repeat(this.indent) + "else";
          for (const s of stmt.elseBody) {
            ifs += "\n" + this.visitStatement(s);
          }
        }
        ifs += "\n" + "  ".repeat(this.indent) + "end";
        return ifs;
      }

      case "WhileLoop": {
        let wl = "  ".repeat(this.indent) + "while " + this.visitExpression(stmt.condition) + " do";
        for (const s of stmt.body) {
          wl += "\n" + this.visitStatement(s);
        }
        wl += "\n" + "  ".repeat(this.indent) + "end";
        return wl;
      }

      case "RepeatLoop": {
        let rl = "  ".repeat(this.indent) + "repeat";
        for (const s of stmt.body) {
          rl += "\n" + this.visitStatement(s);
        }
        rl += "\n" + "  ".repeat(this.indent) + "until " + this.visitExpression(stmt.condition);
        return rl;
      }

      case "NumericForLoop": {
        let nfl = "  ".repeat(this.indent) + "for " + stmt.variable.name + " = " + this.visitExpression(stmt.start) + ", " + this.visitExpression(stmt.end);
        if (stmt.step) nfl += ", " + this.visitExpression(stmt.step);
        nfl += " do";
        for (const s of stmt.body) {
          nfl += "\n" + this.visitStatement(s);
        }
        nfl += "\n" + "  ".repeat(this.indent) + "end";
        return nfl;
      }

      case "GenericForLoop": {
        let gfl = "  ".repeat(this.indent) + "for ";
        for (let i = 0; i < stmt.variables.length; i++) {
          if (i > 0) gfl += ", ";
          gfl += stmt.variables[i].name;
        }
        gfl += " in ";
        for (let i = 0; i < stmt.expressions.length; i++) {
          if (i > 0) gfl += ", ";
          gfl += this.visitExpression(stmt.expressions[i]);
        }
        gfl += " do";
        for (const s of stmt.body) {
          gfl += "\n" + this.visitStatement(s);
        }
        gfl += "\n" + "  ".repeat(this.indent) + "end";
        return gfl;
      }

      case "DoBlock": {
        let db = "  ".repeat(this.indent) + "do";
        for (const s of stmt.body) {
          db += "\n" + this.visitStatement(s);
        }
        db += "\n" + "  ".repeat(this.indent) + "end";
        return db;
      }

      case "ExportDeclaration": {
        let ed = "  ".repeat(this.indent) + "export ";
        ed += this.visitStatement(stmt.declaration);
        ed += ";";
        return ed;
      }

      case "TypeDeclaration":
        return "  ".repeat(this.indent) + "type " + stmt.name + (stmt.typeParameters.length > 0 ? "<" + stmt.typeParameters.join(", ") + ">" : "") + " = " + stmt.definition + ";";

      default:
        return "";
    }
  }

  private visitExpression(expr: Expression): string {
    switch (expr.kind) {
      case "NilLiteral": return "nil";
      case "BooleanLiteral": return expr.value ? "true" : "false";
      case "NumberLiteral": return expr.raw;
      case "StringLiteral": return this.escapeString(expr.value);
      case "InterpString": return this.visitInterpString(expr);
      case "Vararg": return "...";
      case "Identifier": return expr.name;
      case "FunctionExpression": {
        let fn = "function";
        fn += this.visitParams(expr.params);
        this.indent++;
        for (const s of expr.body) {
          fn += "\n" + this.visitStatement(s);
        }
        this.indent--;
        fn += "\n" + "  ".repeat(this.indent) + "end";
        return fn;
      }
      case "TableConstructor":
        let tbl = "{";
        for (let i = 0; i < expr.fields.length; i++) {
          if (i > 0) tbl += ", ";
          const field = expr.fields[i];
          if (field.key) {
            const needsBrackets = !field.isNameKey ||
              (field.key.kind !== "Identifier" && field.key.kind !== "StringLiteral");
            if (needsBrackets) {
              tbl += "[" + this.visitExpression(field.key) + "] = ";
            } else {
              tbl += this.visitExpression(field.key) + " = ";
            }
          }
          tbl += this.visitExpression(field.value);
        }
        tbl += "}";
        return tbl;
      case "BinaryExpression":
        const opPrec = this.getPrecedence(expr.operator);
        const leftStr = this.visitExpression(expr.left);
        const rightStr = this.visitExpression(expr.right);
        return `(${leftStr})` + expr.operator + `(${rightStr})`;
      case "UnaryExpression": {
        const argStr = this.visitExpression(expr.argument);
        if (expr.operator === "not") {
          return "not " + argStr;
        }
        return expr.operator + argStr;
      }
      case "ParenthesizedExpression":
        return "(" + this.visitExpression(expr.expression) + ")";
      case "IndexExpression":
        return this.visitExpression(expr.object) + "[" + this.visitExpression(expr.index) + "]";
      case "MemberExpression":
        return this.visitExpression(expr.object) + "." + expr.property;
      case "CallExpression":
        let call = this.visitExpression(expr.callee) + "(";
        for (let i = 0; i < expr.args.length; i++) {
          if (i > 0) call += ", ";
          call += this.visitExpression(expr.args[i]);
        }
        call += ")";
        return call;
      case "MethodCallExpression":
        let method = this.visitExpression(expr.object) + ":" + expr.method + "(";
        for (let i = 0; i < expr.args.length; i++) {
          if (i > 0) method += ", ";
          method += this.visitExpression(expr.args[i]);
        }
        method += ")";
        return method;
      case "TypeCastExpression":
        return "(" + this.visitExpression(expr.expression) + "::" + expr.typeText + ")";
      case "IfExpression":
        let ifExpr = "(" + this.visitExpression(expr.clauses[0].condition) + " and " + this.visitExpression(expr.clauses[0].body) + ")";
        for (let i = 1; i < expr.clauses.length; i++) {
          ifExpr += " or (" + this.visitExpression(expr.clauses[i].condition) + " and " + this.visitExpression(expr.clauses[i].body) + ")";
        }
        ifExpr += " or (" + this.visitExpression(expr.elseBody) + ")";
        return ifExpr;
      default:
        return `/* unknown: ${(expr as any).kind} */`;
    }
  }

  private visitParams(params: FunctionParam[]): string {
    const parts: string[] = [];
    for (const p of params) {
      if (p.isVararg) {
        parts.push("...");
      } else {
        let param = p.name;
        if (p.typeAnnotation) param += ": " + p.typeAnnotation;
        parts.push(param);
      }
    }
    return "(" + parts.join(", ") + ")";
  }

  private visitInterpString(expr: InterpString): string {
    let result = "";
    for (let i = 0; i < expr.parts.length; i++) {
      const part = expr.parts[i];
      if (typeof part === "string") {
        result += this.escapeString(part);
      } else {
        result += ".." + this.visitExpression(part) + "..";
      }
    }
    return result;
  }

  private escapeString(value: string): string {
    let result = '"';
    for (const ch of value) {
      switch (ch) {
        case '"': result += '\\"'; break;
        case '\\': result += "\\\\"; break;
        case '\n': result += "\\n"; break;
        case '\r': result += "\\r"; break;
        case '\t': result += "\\t"; break;
        case '\0': result += "\\0"; break;
        default:
          if (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) > 126) {
            result += "\\" + ch.charCodeAt(0).toString(10);
          } else {
            result += ch;
          }
      }
    }
    result += '"';
    return result;
  }

  private getPrecedence(op: string): number {
    switch (op) {
      case "or": return 1;
      case "and": return 2;
      case "<": case ">": case "<=": case ">=": case "~=": case "==": return 3;
      case "|": return 4;
      case "&": return 5;
      case "<<": case ">>": return 6;
      case "..": return 7;
      case "+": case "-": return 8;
      case "*": case "/": case "%": case "//": return 9;
      case "^": case "not": return 10;
      default: return 0;
    }
  }
}
