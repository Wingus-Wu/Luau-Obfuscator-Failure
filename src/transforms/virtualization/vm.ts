import type { Program, Statement, Expression } from "../../ast/index.js";
import type {
  Identifier,
  CallExpression,
  MethodCallExpression,
  BinaryExpression,
  UnaryExpression,
  FunctionExpression,
  TableConstructor,
  MemberExpression,
  IndexExpression,
  IfExpression,
  InterpString,
  FunctionParam,
} from "../../ast/expressions.js";
import type {
  VariableDeclaration,
  FunctionDeclaration,
  Assignment,
  CompoundAssignment,
  ReturnStatement,
  IfStatement,
  WhileLoop,
  RepeatLoop,
  NumericForLoop,
  GenericForLoop,
  DoBlock,
  CallStatement,
  MethodCallStatement,
  BreakStatement,
  ContinueStatement,
  RawStatement,
  ExportDeclaration,
} from "../../ast/statements.js";
import type { TransformContext } from "../transform.js";

const enum Op {
   Nop = 1,
  PushConst = 2,
  PushGlobal = 3,
  PopGlobal = 4,
  PushLocal = 5,
  PopLocal = 6,
  Pop = 7,
  Dup = 8,
  Call = 9,
  CallMethod = 10,
  Return = 11,
  Jump = 12,
  JumpIfFalse = 13,
  JumpIfTrue = 14,
  NewTable = 15,
  SetList = 16,
  Concat = 17,
  Len = 18,
  Binary = 19,
  Unary = 20,
  GetProperty = 21,
  SetProperty = 22,
  GetIndex = 23,
  SetIndex = 24,
  LoadProto = 25,
  Close = 26,
  Vararg = 27,
  Nil = 28,
  Halt = 29,
  TableVararg = 30,
}

import { BINARY_OP_CODES, UNARY_OP_CODES } from "./profiles/base.js";

interface CompiledProto {
  instructions: number[][];
  constants: any[];
  numParams: number;
  hasVararg: boolean;
}

interface ProtoBuilder {
  instructions: number[][];
  constants: any[];
  constantMap: Map<string, number>;
  locals: string[];
  localMap: Map<string, number>;
  pendingJumps: number[];
  pendingBreaks: { idx: number; scope: number }[];
  pendingContinues: { idx: number; scope: number }[];
  scopeDepth: number;
  localScopes: { name: string; index: number; scopeDepth: number }[];
  numParams: number;
  hasVararg: boolean;
}

interface CompilationResult {
  protos: CompiledProto[];
  globals: string[];
}

type ExprTask =
  | { kind: "expr"; expr: Expression; expectedResults?: number }
  | { kind: "emit"; op: number; args?: number[] }
  | { kind: "emitJump"; op: number; ref: { idx: number } }
  | { kind: "patchJump"; ref: { idx: number } };

function createProtoBuilder(numParams: number, hasVararg: boolean): ProtoBuilder {
  return {
    instructions: [],
    constants: [],
    constantMap: new Map(),
    locals: [],
    localMap: new Map(),
    pendingJumps: [],
    pendingBreaks: [],
    pendingContinues: [],
    scopeDepth: 0,
    localScopes: [],
    numParams,
    hasVararg,
  };
}

function protoAddConstant(proto: ProtoBuilder, value: any): number {
  const key = typeof value === "string" ? `__str_${value}` : `__${typeof value}_${value}`;
  if (proto.constantMap.has(key)) return proto.constantMap.get(key)!;
  const idx = proto.constants.length;
  proto.constants.push(value);
  proto.constantMap.set(key, idx);
  return idx;
}

function protoAddLocal(proto: ProtoBuilder, name: string, scopeDepth: number): number {
  for (let i = proto.localScopes.length - 1; i >= 0; i--) {
    const ls = proto.localScopes[i];
    if (ls.name === name) {
      if (ls.scopeDepth >= scopeDepth) {
        return ls.index;
      }
      break;
    }
  }
  const idx = proto.locals.length;
  proto.locals.push(name);
  proto.localScopes.push({ name, index: idx, scopeDepth });
  proto.localMap.set(name, idx);
  return idx;
}

function protoGetLocal(proto: ProtoBuilder, name: string): number | undefined {
  return proto.localMap.get(name);
}

function protoEndScope(proto: ProtoBuilder, depth: number): void {
  for (let i = proto.localScopes.length - 1; i >= 0; i--) {
    if (proto.localScopes[i].scopeDepth === depth) {
      const removed = proto.localScopes.splice(i, 1)[0];
      const found = proto.localScopes.find(ls => ls.name === removed.name);
      if (found) {
        proto.localMap.set(removed.name, found.index);
      } else {
        proto.localMap.delete(removed.name);
      }
    }
  }
}

function protoEmit(proto: ProtoBuilder, op: number, ...args: number[]): void {
  proto.instructions.push([op, ...args]);
}

function protoEmitRaw(proto: ProtoBuilder, code: string): void {
  (proto.instructions as any[]).push(["raw", code]);
}

function protoEmitJump(proto: ProtoBuilder, op: number): number {
  const idx = proto.instructions.length;
  proto.instructions.push([op, 0]);
  proto.pendingJumps.push(idx);
  return idx;
}

function protoPatchJump(proto: ProtoBuilder, idx: number, target?: number): void {
  const targetPc = target !== undefined ? target : proto.instructions.length;
  proto.instructions[idx][1] = targetPc;
  const pendingIdx = proto.pendingJumps.indexOf(idx);
  if (pendingIdx >= 0) proto.pendingJumps.splice(pendingIdx, 1);
}

function protoPatchAllJumps(proto: ProtoBuilder): void {
  while (proto.pendingJumps.length > 0) {
    const idx = proto.pendingJumps.pop()!;
    proto.instructions[idx][1] = proto.instructions.length;
  }
}

function protoPatchBreaks(proto: ProtoBuilder, target: number, scope: number): void {
  const remaining: { idx: number; scope: number }[] = [];
  for (const pb of proto.pendingBreaks) {
    if (pb.scope >= scope) {
      proto.instructions[pb.idx][1] = target;
    } else {
      remaining.push(pb);
    }
  }
  proto.pendingBreaks = remaining;
}

function protoPatchContinues(proto: ProtoBuilder, target: number, scope: number): void {
  const remaining: { idx: number; scope: number }[] = [];
  for (const pc of proto.pendingContinues) {
    if (pc.scope >= scope) {
      proto.instructions[pc.idx][1] = target;
    } else {
      remaining.push(pc);
    }
  }
  proto.pendingContinues = remaining;
}

class BytecodeCompiler {
  private protos: any[] = [];
  private globals: string[] = [];
  private globalMap = new Map<string, number>();
  private random: any;
  private currentProto!: ProtoBuilder;
  private emittedGlobals = new Set<string>();

  constructor(random: any) {
    this.random = random;
  }

  private maybeAddLocal(name: string): number {
    return protoAddLocal(this.currentProto, name, this.currentProto.scopeDepth);
  }

  private maybeAddGlobal(name: string): number {
    if (this.emittedGlobals.has(name)) return this.addGlobal(name);
    this.emittedGlobals.add(name);
    return this.addGlobal(name);
  }

  compile(program: Program): CompilationResult {
    const mainProto = createProtoBuilder(0, false);
    this.protos.push(mainProto);
    this.currentProto = mainProto;

    for (const stmt of program.statements) {
      this.compileStatement(stmt);
    }

    protoEmit(this.currentProto, Op.Halt);

    const compiled: CompiledProto[] = [];
    for (let i = 0; i < this.protos.length; i++) {
      const pb = this.protos[i] as ProtoBuilder;
      compiled.push({
        instructions: pb.instructions,
        constants: pb.constants,
        numParams: pb.numParams,
        hasVararg: pb.hasVararg,
      });
    }

    return { protos: compiled, globals: this.globals };
  }

  private addGlobal(name: string): number {
    if (this.globalMap.has(name)) return this.globalMap.get(name)!;
    const idx = this.globals.length;
    this.globals.push(name);
    this.globalMap.set(name, idx);
    return idx;
  }

  private compileStatement(stmt: Statement): void {
    if ((stmt as any).__generatedHelper) return;

    switch (stmt.kind) {
      case "RawStatement":
        protoEmitRaw(this.currentProto, stmt.code);
        break;
      case "VariableDeclaration":
        this.compileVariableDeclaration(stmt);
        break;
      case "Assignment":
        this.compileAssignment(stmt);
        break;
      case "CompoundAssignment":
        this.compileCompoundAssignment(stmt);
        break;
      case "FunctionDeclaration":
        this.compileFunctionDeclaration(stmt);
        break;
      case "ReturnStatement":
        this.compileReturn(stmt);
        break;
      case "CallStatement":
        this.compileExpression((stmt as CallStatement).expression, 0);
        break;
      case "MethodCallStatement":
        this.compileExpression((stmt as MethodCallStatement).expression, 0);
        break;
      case "IfStatement":
        this.compileIf(stmt);
        break;
      case "WhileLoop":
        this.compileWhile(stmt);
        break;
      case "RepeatLoop":
        this.compileRepeat(stmt);
        break;
      case "NumericForLoop":
        this.compileNumericFor(stmt);
        break;
      case "GenericForLoop":
        this.compileGenericFor(stmt);
        break;
      case "DoBlock":
        this.compileDoBlock(stmt);
        break;
      case "BreakStatement":
        protoEmit(this.currentProto, Op.Close, this.currentProto.scopeDepth);
        protoEmit(this.currentProto, Op.Jump, -1);
        this.currentProto.pendingBreaks.push({ idx: this.currentProto.instructions.length - 1, scope: this.currentProto.scopeDepth });
        break;
      case "ContinueStatement":
        protoEmit(this.currentProto, Op.Close, this.currentProto.scopeDepth);
        protoEmit(this.currentProto, Op.Jump, -1);
        this.currentProto.pendingContinues.push({ idx: this.currentProto.instructions.length - 1, scope: this.currentProto.scopeDepth });
        break;
      case "ExportDeclaration":
        this.compileStatement((stmt as ExportDeclaration).declaration);
        break;
    }
  }

  private compileVariableDeclaration(stmt: VariableDeclaration): void {
    let multiResultHandled = false;
    for (let i = 0; i < stmt.right.length; i++) {
      const rightExpr = stmt.right[i];
      const isLast = i === stmt.right.length - 1;
      const needsMultiResult = isLast && stmt.left.length > stmt.right.length &&
        (rightExpr.kind === "CallExpression" || rightExpr.kind === "MethodCallExpression");
      const expectedResults = needsMultiResult ? stmt.left.length - stmt.right.length + 1 : undefined;

      this.compileExpression(rightExpr, expectedResults);

      if (needsMultiResult) {
        multiResultHandled = true;
        for (let j = expectedResults - 1; j >= 0; j--) {
          const leftIdx = i + j;
          if (leftIdx < stmt.left.length) {
            const localIdx = protoAddLocal(this.currentProto, stmt.left[leftIdx].name, this.currentProto.scopeDepth);
            protoEmit(this.currentProto, Op.PopLocal, localIdx);
          }
        }
      } else {
        if (i < stmt.left.length) {
          const localIdx = protoAddLocal(this.currentProto, stmt.left[i].name, this.currentProto.scopeDepth);
          protoEmit(this.currentProto, Op.PopLocal, localIdx);
        } else {
          protoEmit(this.currentProto, Op.Pop, 1);
        }
      }
    }
    if (!multiResultHandled) {
      for (let i = stmt.right.length; i < stmt.left.length; i++) {
        const localIdx = protoAddLocal(this.currentProto, stmt.left[i].name, this.currentProto.scopeDepth);
        protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, null));
        protoEmit(this.currentProto, Op.PopLocal, localIdx);
      }
    }
  }

  private compileAssignment(stmt: Assignment): void {
    for (let i = 0; i < stmt.right.length; i++) {
      const rightExpr = stmt.right[i];
      const isLast = i === stmt.right.length - 1;
      const needsMultiResult = isLast && stmt.left.length > stmt.right.length &&
        (rightExpr.kind === "CallExpression" || rightExpr.kind === "MethodCallExpression");
      const expectedResults = needsMultiResult ? stmt.left.length - stmt.right.length + 1 : undefined;
      this.compileExpression(rightExpr, expectedResults);
    }
    for (let i = stmt.left.length - 1; i >= 0; i--) {
      const target = stmt.left[i];
      if (target.kind === "Identifier") {
        const localIdx = protoGetLocal(this.currentProto, target.name);
        if (localIdx !== undefined) {
          protoEmit(this.currentProto, Op.PopLocal, localIdx);
        } else {
          const globalIdx = this.addGlobal(target.name);
          protoEmit(this.currentProto, Op.PopGlobal, globalIdx);
        }
      } else if (target.kind === "MemberExpression") {
        this.compileExpression(target.object);
        protoEmit(this.currentProto, Op.SetProperty, protoAddConstant(this.currentProto, target.property));
      } else if (target.kind === "IndexExpression") {
        const tmp = this.maybeAddLocal("__tmp");
        protoEmit(this.currentProto, Op.PopLocal, tmp);
        this.compileExpression(target.object);
        this.compileExpression(target.index);
        protoEmit(this.currentProto, Op.PushLocal, tmp);
        protoEmit(this.currentProto, Op.SetIndex);
      }
    }
  }

  private compileCompoundAssignment(stmt: CompoundAssignment): void {
    const op = stmt.operator.slice(0, -1);
    const opCode = BINARY_OP_CODES[op];
    if (!opCode) {
      this.compileExpression(stmt.right);
      protoEmit(this.currentProto, Op.Pop, 1);
      return;
    }

    if (stmt.left.kind === "Identifier") {
      const localIdx = protoGetLocal(this.currentProto, stmt.left.name);
      if (localIdx !== undefined) {
        protoEmit(this.currentProto, Op.PushLocal, localIdx);
      } else {
        const globalIdx = this.addGlobal(stmt.left.name);
        protoEmit(this.currentProto, Op.PushGlobal, globalIdx);
      }
    } else {
      this.compileExpression(stmt.left);
    }

    protoEmit(this.currentProto, Op.Dup);
    this.compileExpression(stmt.right);
    protoEmit(this.currentProto, Op.Binary, opCode);

    if (stmt.left.kind === "Identifier") {
      const localIdx = protoGetLocal(this.currentProto, stmt.left.name);
      if (localIdx !== undefined) {
        protoEmit(this.currentProto, Op.PopLocal, localIdx);
      } else {
        const globalIdx = this.addGlobal(stmt.left.name);
        protoEmit(this.currentProto, Op.PopGlobal, globalIdx);
      }
    } else if (stmt.left.kind === "MemberExpression") {
      this.compileExpression(stmt.left.object);
      protoEmit(this.currentProto, Op.SetProperty, protoAddConstant(this.currentProto, stmt.left.property));
    } else if (stmt.left.kind === "IndexExpression") {
      const tmp = protoAddLocal(this.currentProto, "__tmp", this.currentProto.scopeDepth);
      protoEmit(this.currentProto, Op.PopLocal, tmp);
      this.compileExpression(stmt.left.object);
      this.compileExpression(stmt.left.index);
      protoEmit(this.currentProto, Op.PushLocal, tmp);
      protoEmit(this.currentProto, Op.SetIndex);
    }
    protoEmit(this.currentProto, Op.Pop, 1);
  }

  private compileFunctionProto(params: FunctionParam[], hasVararg: boolean, body: Statement[]): number {
    const proto = createProtoBuilder(params.length, hasVararg);

    proto.scopeDepth = 1;
    for (const param of params) {
      if (param.isVararg) continue;
      protoAddLocal(proto, param.name, 1);
    }

    const protoIdx = this.protos.length;
    const savedProto = this.currentProto;
    this.currentProto = proto;
    this.protos.push(proto as any);

    for (const stmt of body) {
      this.compileStatement(stmt);
    }

    protoEmit(this.currentProto, Op.Return, 0);

    this.currentProto = savedProto;
    return protoIdx;
  }

  private compileFunctionDeclaration(stmt: FunctionDeclaration): void {
    const protoIdx = this.compileFunctionProto(stmt.params, stmt.hasVararg, stmt.body);
    if (stmt.name.kind === "Identifier") {
      protoEmit(this.currentProto, Op.LoadProto, protoIdx);
      const globalIdx = this.addGlobal(stmt.name.name);
      protoEmit(this.currentProto, Op.PopGlobal, globalIdx);
    } else {
      const name = stmt.name as unknown as MemberExpression;
      const parts: string[] = [];
      let obj: Expression = name;
      while (obj.kind === "MemberExpression") {
        parts.unshift(obj.property);
        obj = obj.object;
      }
      this.compileExpression(obj);
      for (let i = 0; i < parts.length - 1; i++) {
        protoEmit(this.currentProto, Op.GetProperty, protoAddConstant(this.currentProto, parts[i]));
      }
      protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, parts[parts.length - 1]));
      protoEmit(this.currentProto, Op.LoadProto, protoIdx);
      protoEmit(this.currentProto, Op.SetIndex);
    }
  }

  private compileFunctionExpression(expr: FunctionExpression): void {
    const protoIdx = this.compileFunctionProto(expr.params, expr.hasVararg, expr.body);
    protoEmit(this.currentProto, Op.LoadProto, protoIdx);
  }

  private compileReturn(stmt: ReturnStatement): void {
    protoEmit(this.currentProto, Op.Close, this.currentProto.scopeDepth);
    for (let i = 0; i < stmt.expressions.length; i++) {
      this.compileExpression(stmt.expressions[i]);
    }
    protoEmit(this.currentProto, Op.Return, stmt.expressions.length);
  }

  private compileIf(stmt: IfStatement): void {
    this.compileExpression(stmt.condition);
    const ifFalse = protoEmitJump(this.currentProto, Op.JumpIfFalse);

    this.currentProto.scopeDepth++;
    for (const s of stmt.body) this.compileStatement(s);
    protoEndScope(this.currentProto, this.currentProto.scopeDepth);
    this.currentProto.scopeDepth--;

    if (stmt.elseBody.length === 0 && stmt.elseifBlocks.length === 0) {
      protoPatchJump(this.currentProto, ifFalse);
    } else {
      const jumpEnd = protoEmitJump(this.currentProto, Op.Jump);
      protoPatchJump(this.currentProto, ifFalse);

      for (const elseif of stmt.elseifBlocks) {
        this.compileExpression(elseif.condition);
        const elseifFalse = protoEmitJump(this.currentProto, Op.JumpIfFalse);
        this.currentProto.scopeDepth++;
        for (const s of elseif.body) this.compileStatement(s);
        protoEndScope(this.currentProto, this.currentProto.scopeDepth);
        this.currentProto.scopeDepth--;

        const jumpEndElse = protoEmitJump(this.currentProto, Op.Jump);
        protoPatchJump(this.currentProto, elseifFalse);
        protoEmit(this.currentProto, Op.Pop, 1);
      }

      if (stmt.elseBody.length > 0) {
        this.currentProto.scopeDepth++;
        for (const s of stmt.elseBody) this.compileStatement(s);
        protoEndScope(this.currentProto, this.currentProto.scopeDepth);
        this.currentProto.scopeDepth--;
      }

      protoPatchAllJumps(this.currentProto);
    }
  }

  private compileWhile(stmt: WhileLoop): void {
    const loopStart = this.currentProto.instructions.length;
    this.currentProto.scopeDepth++;
    const outerScope = this.currentProto.scopeDepth;

    this.compileExpression(stmt.condition);
    const jumpEnd = protoEmitJump(this.currentProto, Op.JumpIfFalse);

    this.currentProto.scopeDepth++;
    for (const s of stmt.body) this.compileStatement(s);
    protoEndScope(this.currentProto, this.currentProto.scopeDepth);
    this.currentProto.scopeDepth--;

    protoEmit(this.currentProto, Op.Jump, loopStart);
    protoPatchJump(this.currentProto, jumpEnd);
    this.currentProto.scopeDepth--;
    protoEndScope(this.currentProto, outerScope);

    protoPatchContinues(this.currentProto, loopStart, this.currentProto.scopeDepth);
    protoPatchBreaks(this.currentProto, this.currentProto.instructions.length, this.currentProto.scopeDepth);
  }

  private compileRepeat(stmt: RepeatLoop): void {
    const loopStart = this.currentProto.instructions.length;
    const loopScope = this.currentProto.scopeDepth + 1;
    this.currentProto.scopeDepth++;

    for (const s of stmt.body) this.compileStatement(s);

    protoPatchAllJumps(this.currentProto);
    protoPatchContinues(this.currentProto, loopStart, this.currentProto.scopeDepth);

    this.compileExpression(stmt.condition);
    const backJumpIdx = this.currentProto.instructions.length;
    protoEmit(this.currentProto, Op.JumpIfFalse);
    this.currentProto.instructions[backJumpIdx][1] = loopStart;

    protoPatchBreaks(this.currentProto, this.currentProto.instructions.length, this.currentProto.scopeDepth);
    this.currentProto.scopeDepth--;
    protoEndScope(this.currentProto, loopScope);
  }

  private compileNumericFor(stmt: NumericForLoop): void {
    this.compileExpression(stmt.start);
    this.compileExpression(stmt.end);
    if (stmt.step) {
      this.compileExpression(stmt.step);
    } else {
      protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, 1));
    }

    this.currentProto.scopeDepth++;
    const startIdx = this.maybeAddLocal("__for_start");
    const endIdx = this.maybeAddLocal("__for_end");
    const stepIdx = this.maybeAddLocal("__for_step");
    const varIdx = protoAddLocal(this.currentProto, stmt.variable.name, this.currentProto.scopeDepth);

    protoEmit(this.currentProto, Op.PopLocal, stepIdx);
    protoEmit(this.currentProto, Op.PopLocal, endIdx);
    protoEmit(this.currentProto, Op.PopLocal, startIdx);

    const stepIsConst = stmt.step !== null && stmt.step !== undefined && stmt.step.kind === "NumberLiteral";
    const stepValue = stepIsConst ? Number((stmt.step as any).raw) : null;
    const isNegativeStep = stepValue !== null && stepValue < 0;

    const condStart = this.currentProto.instructions.length;
    protoEmit(this.currentProto, Op.PushLocal, startIdx);
    protoEmit(this.currentProto, Op.PushLocal, endIdx);
    
    if (stepIsConst) {
      const cmpOp = isNegativeStep ? BINARY_OP_CODES[">="]! : BINARY_OP_CODES["<="]!;
      protoEmit(this.currentProto, Op.Binary, cmpOp);
    } else {
      protoEmit(this.currentProto, Op.PushLocal, stepIdx);
      protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, 0));
      protoEmit(this.currentProto, Op.Binary, BINARY_OP_CODES["<"]!);
      const jumpNegative = protoEmitJump(this.currentProto, Op.JumpIfTrue);
      
      protoEmit(this.currentProto, Op.PushLocal, startIdx);
      protoEmit(this.currentProto, Op.PushLocal, endIdx);
      protoEmit(this.currentProto, Op.Binary, BINARY_OP_CODES["<="]!);
      const jumpAfterPos = protoEmitJump(this.currentProto, Op.Jump);
      
      protoPatchJump(this.currentProto, jumpNegative);
      protoEmit(this.currentProto, Op.PushLocal, startIdx);
      protoEmit(this.currentProto, Op.PushLocal, endIdx);
      protoEmit(this.currentProto, Op.Binary, BINARY_OP_CODES[">="]!);
      
      protoPatchJump(this.currentProto, jumpAfterPos);
    }
    
    protoEmit(this.currentProto, Op.Unary, UNARY_OP_CODES["not"]!);
    const jumpEnd = protoEmitJump(this.currentProto, Op.JumpIfTrue);

    protoEmit(this.currentProto, Op.PushLocal, startIdx);
    protoEmit(this.currentProto, Op.PopLocal, varIdx);

    this.currentProto.scopeDepth++;
    for (const s of stmt.body) this.compileStatement(s);
    this.currentProto.scopeDepth--;
    protoEndScope(this.currentProto, this.currentProto.scopeDepth + 1);

    protoEmit(this.currentProto, Op.PushLocal, varIdx);
    protoEmit(this.currentProto, Op.PushLocal, stepIdx);
    protoEmit(this.currentProto, Op.Binary, BINARY_OP_CODES["+"]!);
    protoEmit(this.currentProto, Op.PopLocal, startIdx);

    protoEmit(this.currentProto, Op.Jump, condStart);
    protoPatchJump(this.currentProto, jumpEnd);

    protoEndScope(this.currentProto, this.currentProto.scopeDepth);
    this.currentProto.scopeDepth--;
    protoPatchContinues(this.currentProto, condStart, this.currentProto.scopeDepth);
    protoPatchBreaks(this.currentProto, this.currentProto.instructions.length, this.currentProto.scopeDepth);
  }

  private compileGenericFor(stmt: GenericForLoop): void {
    const numExprs = stmt.expressions.length;
    if (numExprs === 0) {
      protoEmit(this.currentProto, Op.Nil, 0);
      protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, null));
      protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, null));
    } else {
      const lastExpr = stmt.expressions[numExprs - 1];
      const isLastCall = lastExpr.kind === "CallExpression" || lastExpr.kind === "MethodCallExpression";
      for (let i = 0; i < numExprs - (isLastCall ? 1 : 0); i++) {
        this.compileExpression(stmt.expressions[i]);
      }
      if (isLastCall) {
        this.compileExpression(lastExpr, 3);
      } else {
        this.compileExpression(lastExpr);
        if (numExprs === 1) {
          protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, null));
          protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, null));
        } else if (numExprs === 2) {
          protoEmit(this.currentProto, Op.PushConst, protoAddConstant(this.currentProto, null));
        }
      }
    }

    this.currentProto.scopeDepth++;
    const fIdx = protoAddLocal(this.currentProto, "__for_fn", this.currentProto.scopeDepth);
    const sIdx = protoAddLocal(this.currentProto, "__for_state", this.currentProto.scopeDepth);
    for (const v of stmt.variables) protoAddLocal(this.currentProto, v.name, this.currentProto.scopeDepth);

    const varIdxs = stmt.variables.map(v => protoGetLocal(this.currentProto, v.name)!);
    const firstVarIdx = varIdxs[0];

    if (firstVarIdx !== undefined) {
      protoEmit(this.currentProto, Op.PopLocal, firstVarIdx);
    } else {
      protoEmit(this.currentProto, Op.Pop, 1);
    }
    protoEmit(this.currentProto, Op.PopLocal, sIdx);
    protoEmit(this.currentProto, Op.PopLocal, fIdx);

    const loopStart = this.currentProto.instructions.length;
    protoEmit(this.currentProto, Op.PushLocal, fIdx);
    protoEmit(this.currentProto, Op.PushLocal, sIdx);
    protoEmit(this.currentProto, Op.PushLocal, firstVarIdx);
    protoEmit(this.currentProto, Op.Call, 2, stmt.variables.length);

    for (let i = stmt.variables.length - 1; i >= 0; i--) {
      protoEmit(this.currentProto, Op.PopLocal, varIdxs[i]);
    }

    protoEmit(this.currentProto, Op.PushLocal, firstVarIdx);
    const jumpEnd = protoEmitJump(this.currentProto, Op.JumpIfFalse);

    this.currentProto.scopeDepth++;
    for (const s of stmt.body) this.compileStatement(s);
    this.currentProto.scopeDepth--;
    protoEndScope(this.currentProto, this.currentProto.scopeDepth + 1);

    protoEmit(this.currentProto, Op.Jump, loopStart);
    protoPatchJump(this.currentProto, jumpEnd);

    protoEndScope(this.currentProto, this.currentProto.scopeDepth);
    this.currentProto.scopeDepth--;
    protoPatchContinues(this.currentProto, loopStart, this.currentProto.scopeDepth);
    protoPatchBreaks(this.currentProto, this.currentProto.instructions.length, this.currentProto.scopeDepth);
  }

  private compileDoBlock(stmt: DoBlock): void {
    const scope = this.currentProto.scopeDepth + 1;
    this.currentProto.scopeDepth++;
    for (const s of stmt.body) this.compileStatement(s);
    protoEndScope(this.currentProto, scope);
    this.currentProto.scopeDepth--;
    protoPatchAllJumps(this.currentProto);
  }

  private compileExpression(expr: Expression, expectedResults?: number): void {
    const tasks: ExprTask[] = [{ kind: "expr", expr, expectedResults }];
    while (tasks.length > 0) {
      const task = tasks.pop()!;
      if (task.kind === "expr") {
        this.enqueueExprTasks(tasks, task.expr, task.expectedResults);
      } else if (task.kind === "emit") {
        protoEmit(this.currentProto, task.op, ...(task.args ?? []));
      } else if (task.kind === "emitJump") {
        task.ref.idx = protoEmitJump(this.currentProto, task.op);
      } else if (task.kind === "patchJump") {
        protoPatchJump(this.currentProto, task.ref.idx);
      }
    }
  }

  private enqueueExprTasks(tasks: ExprTask[], expr: Expression, expectedResults?: number): void {
    switch (expr.kind) {
      case "NilLiteral":
        tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, null)] });
        break;
      case "BooleanLiteral":
        tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, expr.value)] });
        break;
      case "NumberLiteral":
        tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, Number(expr.raw))] });
        break;
      case "StringLiteral":
        tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, expr.value)] });
        break;
      case "InterpString":
        this.enqueueInterpStringTasks(tasks, expr);
        break;
      case "Vararg":
        tasks.push({ kind: "emit", op: Op.Vararg, args: [0] });
        break;
      case "Identifier": {
        const localIdx = protoGetLocal(this.currentProto, expr.name);
        if (localIdx !== undefined) {
          tasks.push({ kind: "emit", op: Op.PushLocal, args: [localIdx] });
        } else {
          const globalIdx = this.addGlobal(expr.name);
          tasks.push({ kind: "emit", op: Op.PushGlobal, args: [globalIdx] });
        }
        break;
      }
      case "FunctionExpression":
        this.compileFunctionExpression(expr);
        break;
      case "TableConstructor":
        this.enqueueTableConstructorTasks(tasks, expr);
        break;
      case "BinaryExpression":
        this.enqueueBinaryTasks(tasks, expr);
        break;
      case "UnaryExpression":
        this.enqueueUnaryTasks(tasks, expr);
        break;
      case "ParenthesizedExpression":
        tasks.push({ kind: "expr", expr: expr.expression });
        break;
      case "IndexExpression":
        tasks.push({ kind: "emit", op: Op.GetIndex });
        tasks.push({ kind: "expr", expr: expr.index });
        tasks.push({ kind: "expr", expr: expr.object });
        break;
      case "MemberExpression":
        tasks.push({ kind: "emit", op: Op.GetProperty, args: [protoAddConstant(this.currentProto, expr.property)] });
        tasks.push({ kind: "expr", expr: expr.object });
        break;
      case "CallExpression":
        this.enqueueCallTasks(tasks, expr, expectedResults);
        break;
      case "MethodCallExpression":
        this.enqueueMethodCallTasks(tasks, expr, expectedResults);
        break;
      case "TypeCastExpression":
        tasks.push({ kind: "expr", expr: expr.expression });
        break;
      case "IfExpression":
        this.enqueueIfExpressionTasks(tasks, expr);
        break;
      default:
        tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, null)] });
    }
  }

  private enqueueCallTasks(tasks: ExprTask[], expr: CallExpression, expectedResults?: number): void {
    const nresults = expectedResults ?? 1;
    tasks.push({ kind: "emit", op: Op.Call, args: [expr.args.length, nresults] });
    for (let i = expr.args.length - 1; i >= 0; i--) {
      tasks.push({ kind: "expr", expr: expr.args[i] });
    }
    tasks.push({ kind: "expr", expr: expr.callee });
  }

  private enqueueMethodCallTasks(tasks: ExprTask[], expr: MethodCallExpression, expectedResults?: number): void {
    const nresults = expectedResults ?? 1;
    tasks.push({ kind: "emit", op: Op.CallMethod, args: [expr.args.length, nresults] });
    tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, expr.method)] });
    for (let i = expr.args.length - 1; i >= 0; i--) {
      tasks.push({ kind: "expr", expr: expr.args[i] });
    }
    tasks.push({ kind: "expr", expr: expr.object });
  }

  private enqueueBinaryTasks(tasks: ExprTask[], expr: BinaryExpression): void {
    const op = expr.operator;
    const opCode = BINARY_OP_CODES[op];
    if (!opCode) {
      tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, null)] });
      return;
    }

    if (op === "and" || op === "or") {
      const jumpRef = { idx: 0 };
      // For "and": if left is falsy, return left (skip right). JumpIfFalse pops, so Dup first.
      // For "or": if left is truthy, return left (skip right). JumpIfTrue pops, so Dup first.
      const jumpOp = op === "and" ? Op.JumpIfFalse : Op.JumpIfTrue;
      tasks.push({ kind: "patchJump", ref: jumpRef });
      tasks.push({ kind: "expr", expr: expr.right });
      tasks.push({ kind: "emit", op: Op.Pop, args: [1] }); // Pop left if not short-circuited
      tasks.push({ kind: "emitJump", op: jumpOp, ref: jumpRef });
      tasks.push({ kind: "emit", op: Op.Dup }); // Dup left so JumpIf* pops the copy
      tasks.push({ kind: "expr", expr: expr.left });
    } else {
      tasks.push({ kind: "emit", op: Op.Binary, args: [opCode] });
      tasks.push({ kind: "expr", expr: expr.right });
      tasks.push({ kind: "expr", expr: expr.left });
    }
  }

  private enqueueUnaryTasks(tasks: ExprTask[], expr: UnaryExpression): void {
    const opCode = UNARY_OP_CODES[expr.operator];
    if (!opCode) {
      tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, null)] });
      return;
    }
    tasks.push({ kind: "emit", op: Op.Unary, args: [opCode] });
    tasks.push({ kind: "expr", expr: expr.argument });
  }

  private enqueueTableConstructorTasks(tasks: ExprTask[], expr: TableConstructor): void {
    for (let i = expr.fields.length - 1; i >= 0; i--) {
      const field = expr.fields[i];
      if (field.key && !field.isNameKey) {
        tasks.push({ kind: "emit", op: Op.SetIndex });
        tasks.push({ kind: "expr", expr: field.value });
        tasks.push({ kind: "expr", expr: field.key });
        tasks.push({ kind: "emit", op: Op.Dup });
      } else if (field.key) {
        tasks.push({ kind: "emit", op: Op.SetIndex });
        tasks.push({ kind: "expr", expr: field.value });
        if (field.key.kind === "StringLiteral") {
          tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, field.key.value)] });
        } else {
          tasks.push({ kind: "expr", expr: field.key });
        }
        tasks.push({ kind: "emit", op: Op.Dup });
       } else {
          if (field.value.kind === "Vararg") {
            tasks.push({ kind: "emit", op: Op.TableVararg });
          } else {
            tasks.push({ kind: "emit", op: Op.SetList });
            tasks.push({ kind: "expr", expr: field.value });
          }
        }
    }
    tasks.push({ kind: "emit", op: Op.NewTable });
  }

  private enqueueInterpStringTasks(tasks: ExprTask[], expr: InterpString): void {
    if (expr.parts.length === 0) {
      tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, "")] });
      return;
    }
    for (let i = expr.parts.length - 1; i >= 0; i--) {
      if (i > 0) {
        tasks.push({ kind: "emit", op: Op.Concat });
      }
      const part = expr.parts[i];
      if (typeof part === "string") {
        tasks.push({ kind: "emit", op: Op.PushConst, args: [protoAddConstant(this.currentProto, part)] });
      } else {
        tasks.push({ kind: "expr", expr: part });
      }
    }
  }

  private enqueueIfExpressionTasks(tasks: ExprTask[], expr: IfExpression): void {
    const numClauses = expr.clauses.length;
    const hasElse = expr.elseBody.kind !== "NilLiteral";
    const subTasks: ExprTask[] = [];

    for (let i = 0; i < numClauses; i++) {
      const clause = expr.clauses[i];
      const isLastClause = i === numClauses - 1;
      const needsElseJump = isLastClause ? hasElse : true;

      subTasks.push({ kind: "expr", expr: clause.condition });

      const jumpRef = { idx: 0 };
      subTasks.push({ kind: "emitJump", op: Op.JumpIfFalse, ref: jumpRef });

      subTasks.push({ kind: "emit", op: Op.Pop, args: [1] });

      subTasks.push({ kind: "expr", expr: clause.body });

      if (needsElseJump) {
        const endRef = { idx: 0 };
        subTasks.push({ kind: "emitJump", op: Op.Jump, ref: endRef });
        subTasks.push({ kind: "patchJump", ref: jumpRef });
        subTasks.push({ kind: "emit", op: Op.Pop, args: [1] });
        if (!isLastClause) {
          subTasks.push({ kind: "patchJump", ref: endRef });
        }
      } else {
        subTasks.push({ kind: "patchJump", ref: jumpRef });
      }
    }

    if (hasElse) {
      subTasks.push({ kind: "expr", expr: expr.elseBody });
    }

    for (let i = subTasks.length - 1; i >= 0; i--) {
      tasks.push(subTasks[i]);
    }
  }
}

import { generateVMRuntime } from "./profiles/selector.js";

export function compileToBytecode(program: Program, context: TransformContext): { code: string; stats: { functionsVirtualized: number } } {
  const compiler = new BytecodeCompiler(context.random);
  const result = compiler.compile(program);
  const code = generateVMRuntime(result, context);
  return { code, stats: { functionsVirtualized: result.protos.length > 1 ? result.protos.length - 1 : 1 } };
}

export { BytecodeCompiler, Op, BINARY_OP_CODES, UNARY_OP_CODES };
export type { CompiledProto, CompilationResult };
