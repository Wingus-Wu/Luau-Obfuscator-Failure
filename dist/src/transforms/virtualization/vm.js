import { BINARY_OP_CODES, UNARY_OP_CODES } from "./profiles/base.js";
function createProtoBuilder(numParams, hasVararg) {
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
function protoAddConstant(proto, value) {
    const key = typeof value === "string" ? `__str_${value}` : `__${typeof value}_${value}`;
    if (proto.constantMap.has(key))
        return proto.constantMap.get(key);
    const idx = proto.constants.length;
    proto.constants.push(value);
    proto.constantMap.set(key, idx);
    return idx;
}
function protoAddLocal(proto, name, scopeDepth) {
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
function protoGetLocal(proto, name) {
    return proto.localMap.get(name);
}
function protoEndScope(proto, depth) {
    for (let i = proto.localScopes.length - 1; i >= 0; i--) {
        if (proto.localScopes[i].scopeDepth === depth) {
            const removed = proto.localScopes.splice(i, 1)[0];
            const found = proto.localScopes.find(ls => ls.name === removed.name);
            if (found) {
                proto.localMap.set(removed.name, found.index);
            }
            else {
                proto.localMap.delete(removed.name);
            }
        }
    }
}
function protoEmit(proto, op, ...args) {
    proto.instructions.push([op, ...args]);
}
function protoEmitRaw(proto, code) {
    proto.instructions.push(["raw", code]);
}
function protoEmitJump(proto, op) {
    const idx = proto.instructions.length;
    proto.instructions.push([op, 0]);
    proto.pendingJumps.push(idx);
    return idx;
}
function protoPatchJump(proto, idx, target) {
    const targetPc = target !== undefined ? target : proto.instructions.length;
    proto.instructions[idx][1] = targetPc;
    const pendingIdx = proto.pendingJumps.indexOf(idx);
    if (pendingIdx >= 0)
        proto.pendingJumps.splice(pendingIdx, 1);
}
function protoPatchAllJumps(proto) {
    while (proto.pendingJumps.length > 0) {
        const idx = proto.pendingJumps.pop();
        proto.instructions[idx][1] = proto.instructions.length;
    }
}
function protoPatchBreaks(proto, target, scope) {
    const remaining = [];
    for (const pb of proto.pendingBreaks) {
        if (pb.scope >= scope) {
            proto.instructions[pb.idx][1] = target;
        }
        else {
            remaining.push(pb);
        }
    }
    proto.pendingBreaks = remaining;
}
function protoPatchContinues(proto, target, scope) {
    const remaining = [];
    for (const pc of proto.pendingContinues) {
        if (pc.scope >= scope) {
            proto.instructions[pc.idx][1] = target;
        }
        else {
            remaining.push(pc);
        }
    }
    proto.pendingContinues = remaining;
}
class BytecodeCompiler {
    protos = [];
    globals = [];
    globalMap = new Map();
    random;
    currentProto;
    emittedGlobals = new Set();
    constructor(random) {
        this.random = random;
    }
    maybeAddLocal(name) {
        return protoAddLocal(this.currentProto, name, this.currentProto.scopeDepth);
    }
    maybeAddGlobal(name) {
        if (this.emittedGlobals.has(name))
            return this.addGlobal(name);
        this.emittedGlobals.add(name);
        return this.addGlobal(name);
    }
    compile(program) {
        const mainProto = createProtoBuilder(0, false);
        this.protos.push(mainProto);
        this.currentProto = mainProto;
        for (const stmt of program.statements) {
            this.compileStatement(stmt);
        }
        protoEmit(this.currentProto, 29 /* Op.Halt */);
        const compiled = [];
        for (let i = 0; i < this.protos.length; i++) {
            const pb = this.protos[i];
            compiled.push({
                instructions: pb.instructions,
                constants: pb.constants,
                numParams: pb.numParams,
                hasVararg: pb.hasVararg,
            });
        }
        return { protos: compiled, globals: this.globals };
    }
    addGlobal(name) {
        if (this.globalMap.has(name))
            return this.globalMap.get(name);
        const idx = this.globals.length;
        this.globals.push(name);
        this.globalMap.set(name, idx);
        return idx;
    }
    compileStatement(stmt) {
        if (stmt.__generatedHelper)
            return;
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
                this.compileExpression(stmt.expression, 0);
                break;
            case "MethodCallStatement":
                this.compileExpression(stmt.expression, 0);
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
                protoEmit(this.currentProto, 26 /* Op.Close */, this.currentProto.scopeDepth);
                protoEmit(this.currentProto, 12 /* Op.Jump */, -1);
                this.currentProto.pendingBreaks.push({ idx: this.currentProto.instructions.length - 1, scope: this.currentProto.scopeDepth });
                break;
            case "ContinueStatement":
                protoEmit(this.currentProto, 26 /* Op.Close */, this.currentProto.scopeDepth);
                protoEmit(this.currentProto, 12 /* Op.Jump */, -1);
                this.currentProto.pendingContinues.push({ idx: this.currentProto.instructions.length - 1, scope: this.currentProto.scopeDepth });
                break;
            case "ExportDeclaration":
                this.compileStatement(stmt.declaration);
                break;
        }
    }
    compileVariableDeclaration(stmt) {
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
                        protoEmit(this.currentProto, 6 /* Op.PopLocal */, localIdx);
                    }
                }
            }
            else {
                if (i < stmt.left.length) {
                    const localIdx = protoAddLocal(this.currentProto, stmt.left[i].name, this.currentProto.scopeDepth);
                    protoEmit(this.currentProto, 6 /* Op.PopLocal */, localIdx);
                }
                else {
                    protoEmit(this.currentProto, 7 /* Op.Pop */, 1);
                }
            }
        }
        if (!multiResultHandled) {
            for (let i = stmt.right.length; i < stmt.left.length; i++) {
                const localIdx = protoAddLocal(this.currentProto, stmt.left[i].name, this.currentProto.scopeDepth);
                protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, null));
                protoEmit(this.currentProto, 6 /* Op.PopLocal */, localIdx);
            }
        }
    }
    compileAssignment(stmt) {
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
                    protoEmit(this.currentProto, 6 /* Op.PopLocal */, localIdx);
                }
                else {
                    const globalIdx = this.addGlobal(target.name);
                    protoEmit(this.currentProto, 4 /* Op.PopGlobal */, globalIdx);
                }
            }
            else if (target.kind === "MemberExpression") {
                this.compileExpression(target.object);
                protoEmit(this.currentProto, 22 /* Op.SetProperty */, protoAddConstant(this.currentProto, target.property));
            }
            else if (target.kind === "IndexExpression") {
                const tmp = this.maybeAddLocal("__tmp");
                protoEmit(this.currentProto, 6 /* Op.PopLocal */, tmp);
                this.compileExpression(target.object);
                this.compileExpression(target.index);
                protoEmit(this.currentProto, 5 /* Op.PushLocal */, tmp);
                protoEmit(this.currentProto, 24 /* Op.SetIndex */);
            }
        }
    }
    compileCompoundAssignment(stmt) {
        const op = stmt.operator.slice(0, -1);
        const opCode = BINARY_OP_CODES[op];
        if (!opCode) {
            this.compileExpression(stmt.right);
            protoEmit(this.currentProto, 7 /* Op.Pop */, 1);
            return;
        }
        if (stmt.left.kind === "Identifier") {
            const localIdx = protoGetLocal(this.currentProto, stmt.left.name);
            if (localIdx !== undefined) {
                protoEmit(this.currentProto, 5 /* Op.PushLocal */, localIdx);
            }
            else {
                const globalIdx = this.addGlobal(stmt.left.name);
                protoEmit(this.currentProto, 3 /* Op.PushGlobal */, globalIdx);
            }
        }
        else {
            this.compileExpression(stmt.left);
        }
        protoEmit(this.currentProto, 8 /* Op.Dup */);
        this.compileExpression(stmt.right);
        protoEmit(this.currentProto, 19 /* Op.Binary */, opCode);
        if (stmt.left.kind === "Identifier") {
            const localIdx = protoGetLocal(this.currentProto, stmt.left.name);
            if (localIdx !== undefined) {
                protoEmit(this.currentProto, 6 /* Op.PopLocal */, localIdx);
            }
            else {
                const globalIdx = this.addGlobal(stmt.left.name);
                protoEmit(this.currentProto, 4 /* Op.PopGlobal */, globalIdx);
            }
        }
        else if (stmt.left.kind === "MemberExpression") {
            this.compileExpression(stmt.left.object);
            protoEmit(this.currentProto, 22 /* Op.SetProperty */, protoAddConstant(this.currentProto, stmt.left.property));
        }
        else if (stmt.left.kind === "IndexExpression") {
            const tmp = protoAddLocal(this.currentProto, "__tmp", this.currentProto.scopeDepth);
            protoEmit(this.currentProto, 6 /* Op.PopLocal */, tmp);
            this.compileExpression(stmt.left.object);
            this.compileExpression(stmt.left.index);
            protoEmit(this.currentProto, 5 /* Op.PushLocal */, tmp);
            protoEmit(this.currentProto, 24 /* Op.SetIndex */);
        }
        protoEmit(this.currentProto, 7 /* Op.Pop */, 1);
    }
    compileFunctionProto(params, hasVararg, body) {
        const proto = createProtoBuilder(params.length, hasVararg);
        proto.scopeDepth = 1;
        for (const param of params) {
            if (param.isVararg)
                continue;
            protoAddLocal(proto, param.name, 1);
        }
        const protoIdx = this.protos.length;
        const savedProto = this.currentProto;
        this.currentProto = proto;
        this.protos.push(proto);
        for (const stmt of body) {
            this.compileStatement(stmt);
        }
        protoEmit(this.currentProto, 11 /* Op.Return */, 0);
        this.currentProto = savedProto;
        return protoIdx;
    }
    compileFunctionDeclaration(stmt) {
        const protoIdx = this.compileFunctionProto(stmt.params, stmt.hasVararg, stmt.body);
        if (stmt.name.kind === "Identifier") {
            protoEmit(this.currentProto, 25 /* Op.LoadProto */, protoIdx);
            const globalIdx = this.addGlobal(stmt.name.name);
            protoEmit(this.currentProto, 4 /* Op.PopGlobal */, globalIdx);
        }
        else {
            const name = stmt.name;
            const parts = [];
            let obj = name;
            while (obj.kind === "MemberExpression") {
                parts.unshift(obj.property);
                obj = obj.object;
            }
            this.compileExpression(obj);
            for (let i = 0; i < parts.length - 1; i++) {
                protoEmit(this.currentProto, 21 /* Op.GetProperty */, protoAddConstant(this.currentProto, parts[i]));
            }
            protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, parts[parts.length - 1]));
            protoEmit(this.currentProto, 25 /* Op.LoadProto */, protoIdx);
            protoEmit(this.currentProto, 24 /* Op.SetIndex */);
        }
    }
    compileFunctionExpression(expr) {
        const protoIdx = this.compileFunctionProto(expr.params, expr.hasVararg, expr.body);
        protoEmit(this.currentProto, 25 /* Op.LoadProto */, protoIdx);
    }
    compileReturn(stmt) {
        protoEmit(this.currentProto, 26 /* Op.Close */, this.currentProto.scopeDepth);
        for (let i = 0; i < stmt.expressions.length; i++) {
            this.compileExpression(stmt.expressions[i]);
        }
        protoEmit(this.currentProto, 11 /* Op.Return */, stmt.expressions.length);
    }
    compileIf(stmt) {
        this.compileExpression(stmt.condition);
        const ifFalse = protoEmitJump(this.currentProto, 13 /* Op.JumpIfFalse */);
        this.currentProto.scopeDepth++;
        for (const s of stmt.body)
            this.compileStatement(s);
        protoEndScope(this.currentProto, this.currentProto.scopeDepth);
        this.currentProto.scopeDepth--;
        if (stmt.elseBody.length === 0 && stmt.elseifBlocks.length === 0) {
            protoPatchJump(this.currentProto, ifFalse);
        }
        else {
            const jumpEnd = protoEmitJump(this.currentProto, 12 /* Op.Jump */);
            protoPatchJump(this.currentProto, ifFalse);
            for (const elseif of stmt.elseifBlocks) {
                this.compileExpression(elseif.condition);
                const elseifFalse = protoEmitJump(this.currentProto, 13 /* Op.JumpIfFalse */);
                this.currentProto.scopeDepth++;
                for (const s of elseif.body)
                    this.compileStatement(s);
                protoEndScope(this.currentProto, this.currentProto.scopeDepth);
                this.currentProto.scopeDepth--;
                const jumpEndElse = protoEmitJump(this.currentProto, 12 /* Op.Jump */);
                protoPatchJump(this.currentProto, elseifFalse);
                protoEmit(this.currentProto, 7 /* Op.Pop */, 1);
            }
            if (stmt.elseBody.length > 0) {
                this.currentProto.scopeDepth++;
                for (const s of stmt.elseBody)
                    this.compileStatement(s);
                protoEndScope(this.currentProto, this.currentProto.scopeDepth);
                this.currentProto.scopeDepth--;
            }
            protoPatchAllJumps(this.currentProto);
        }
    }
    compileWhile(stmt) {
        const loopStart = this.currentProto.instructions.length;
        this.currentProto.scopeDepth++;
        const outerScope = this.currentProto.scopeDepth;
        this.compileExpression(stmt.condition);
        const jumpEnd = protoEmitJump(this.currentProto, 13 /* Op.JumpIfFalse */);
        this.currentProto.scopeDepth++;
        for (const s of stmt.body)
            this.compileStatement(s);
        protoEndScope(this.currentProto, this.currentProto.scopeDepth);
        this.currentProto.scopeDepth--;
        protoEmit(this.currentProto, 12 /* Op.Jump */, loopStart);
        protoPatchJump(this.currentProto, jumpEnd);
        this.currentProto.scopeDepth--;
        protoEndScope(this.currentProto, outerScope);
        protoPatchContinues(this.currentProto, loopStart, this.currentProto.scopeDepth);
        protoPatchBreaks(this.currentProto, this.currentProto.instructions.length, this.currentProto.scopeDepth);
    }
    compileRepeat(stmt) {
        const loopStart = this.currentProto.instructions.length;
        const loopScope = this.currentProto.scopeDepth + 1;
        this.currentProto.scopeDepth++;
        for (const s of stmt.body)
            this.compileStatement(s);
        protoPatchAllJumps(this.currentProto);
        protoPatchContinues(this.currentProto, loopStart, this.currentProto.scopeDepth);
        this.compileExpression(stmt.condition);
        const backJumpIdx = this.currentProto.instructions.length;
        protoEmit(this.currentProto, 13 /* Op.JumpIfFalse */);
        this.currentProto.instructions[backJumpIdx][1] = loopStart;
        protoPatchBreaks(this.currentProto, this.currentProto.instructions.length, this.currentProto.scopeDepth);
        this.currentProto.scopeDepth--;
        protoEndScope(this.currentProto, loopScope);
    }
    compileNumericFor(stmt) {
        this.compileExpression(stmt.start);
        this.compileExpression(stmt.end);
        if (stmt.step) {
            this.compileExpression(stmt.step);
        }
        else {
            protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, 1));
        }
        this.currentProto.scopeDepth++;
        const startIdx = this.maybeAddLocal("__for_start");
        const endIdx = this.maybeAddLocal("__for_end");
        const stepIdx = this.maybeAddLocal("__for_step");
        const varIdx = protoAddLocal(this.currentProto, stmt.variable.name, this.currentProto.scopeDepth);
        protoEmit(this.currentProto, 6 /* Op.PopLocal */, stepIdx);
        protoEmit(this.currentProto, 6 /* Op.PopLocal */, endIdx);
        protoEmit(this.currentProto, 6 /* Op.PopLocal */, startIdx);
        const stepIsConst = stmt.step !== null && stmt.step !== undefined && stmt.step.kind === "NumberLiteral";
        const stepValue = stepIsConst ? Number(stmt.step.raw) : null;
        const isNegativeStep = stepValue !== null && stepValue < 0;
        const condStart = this.currentProto.instructions.length;
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, startIdx);
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, endIdx);
        if (stepIsConst) {
            const cmpOp = isNegativeStep ? BINARY_OP_CODES[">="] : BINARY_OP_CODES["<="];
            protoEmit(this.currentProto, 19 /* Op.Binary */, cmpOp);
        }
        else {
            protoEmit(this.currentProto, 5 /* Op.PushLocal */, stepIdx);
            protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, 0));
            protoEmit(this.currentProto, 19 /* Op.Binary */, BINARY_OP_CODES["<"]);
            const jumpNegative = protoEmitJump(this.currentProto, 14 /* Op.JumpIfTrue */);
            protoEmit(this.currentProto, 5 /* Op.PushLocal */, startIdx);
            protoEmit(this.currentProto, 5 /* Op.PushLocal */, endIdx);
            protoEmit(this.currentProto, 19 /* Op.Binary */, BINARY_OP_CODES["<="]);
            const jumpAfterPos = protoEmitJump(this.currentProto, 12 /* Op.Jump */);
            protoPatchJump(this.currentProto, jumpNegative);
            protoEmit(this.currentProto, 5 /* Op.PushLocal */, startIdx);
            protoEmit(this.currentProto, 5 /* Op.PushLocal */, endIdx);
            protoEmit(this.currentProto, 19 /* Op.Binary */, BINARY_OP_CODES[">="]);
            protoPatchJump(this.currentProto, jumpAfterPos);
        }
        protoEmit(this.currentProto, 20 /* Op.Unary */, UNARY_OP_CODES["not"]);
        const jumpEnd = protoEmitJump(this.currentProto, 14 /* Op.JumpIfTrue */);
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, startIdx);
        protoEmit(this.currentProto, 6 /* Op.PopLocal */, varIdx);
        this.currentProto.scopeDepth++;
        for (const s of stmt.body)
            this.compileStatement(s);
        this.currentProto.scopeDepth--;
        protoEndScope(this.currentProto, this.currentProto.scopeDepth + 1);
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, varIdx);
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, stepIdx);
        protoEmit(this.currentProto, 19 /* Op.Binary */, BINARY_OP_CODES["+"]);
        protoEmit(this.currentProto, 6 /* Op.PopLocal */, startIdx);
        protoEmit(this.currentProto, 12 /* Op.Jump */, condStart);
        protoPatchJump(this.currentProto, jumpEnd);
        protoEndScope(this.currentProto, this.currentProto.scopeDepth);
        this.currentProto.scopeDepth--;
        protoPatchContinues(this.currentProto, condStart, this.currentProto.scopeDepth);
        protoPatchBreaks(this.currentProto, this.currentProto.instructions.length, this.currentProto.scopeDepth);
    }
    compileGenericFor(stmt) {
        const numExprs = stmt.expressions.length;
        if (numExprs === 0) {
            protoEmit(this.currentProto, 28 /* Op.Nil */, 0);
            protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, null));
            protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, null));
        }
        else {
            const lastExpr = stmt.expressions[numExprs - 1];
            const isLastCall = lastExpr.kind === "CallExpression" || lastExpr.kind === "MethodCallExpression";
            for (let i = 0; i < numExprs - (isLastCall ? 1 : 0); i++) {
                this.compileExpression(stmt.expressions[i]);
            }
            if (isLastCall) {
                this.compileExpression(lastExpr, 3);
            }
            else {
                this.compileExpression(lastExpr);
                if (numExprs === 1) {
                    protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, null));
                    protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, null));
                }
                else if (numExprs === 2) {
                    protoEmit(this.currentProto, 2 /* Op.PushConst */, protoAddConstant(this.currentProto, null));
                }
            }
        }
        this.currentProto.scopeDepth++;
        const fIdx = protoAddLocal(this.currentProto, "__for_fn", this.currentProto.scopeDepth);
        const sIdx = protoAddLocal(this.currentProto, "__for_state", this.currentProto.scopeDepth);
        for (const v of stmt.variables)
            protoAddLocal(this.currentProto, v.name, this.currentProto.scopeDepth);
        const varIdxs = stmt.variables.map(v => protoGetLocal(this.currentProto, v.name));
        const firstVarIdx = varIdxs[0];
        if (firstVarIdx !== undefined) {
            protoEmit(this.currentProto, 6 /* Op.PopLocal */, firstVarIdx);
        }
        else {
            protoEmit(this.currentProto, 7 /* Op.Pop */, 1);
        }
        protoEmit(this.currentProto, 6 /* Op.PopLocal */, sIdx);
        protoEmit(this.currentProto, 6 /* Op.PopLocal */, fIdx);
        const loopStart = this.currentProto.instructions.length;
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, fIdx);
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, sIdx);
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, firstVarIdx);
        protoEmit(this.currentProto, 9 /* Op.Call */, 2, stmt.variables.length);
        for (let i = stmt.variables.length - 1; i >= 0; i--) {
            protoEmit(this.currentProto, 6 /* Op.PopLocal */, varIdxs[i]);
        }
        protoEmit(this.currentProto, 5 /* Op.PushLocal */, firstVarIdx);
        const jumpEnd = protoEmitJump(this.currentProto, 13 /* Op.JumpIfFalse */);
        this.currentProto.scopeDepth++;
        for (const s of stmt.body)
            this.compileStatement(s);
        this.currentProto.scopeDepth--;
        protoEndScope(this.currentProto, this.currentProto.scopeDepth + 1);
        protoEmit(this.currentProto, 12 /* Op.Jump */, loopStart);
        protoPatchJump(this.currentProto, jumpEnd);
        protoEndScope(this.currentProto, this.currentProto.scopeDepth);
        this.currentProto.scopeDepth--;
        protoPatchContinues(this.currentProto, loopStart, this.currentProto.scopeDepth);
        protoPatchBreaks(this.currentProto, this.currentProto.instructions.length, this.currentProto.scopeDepth);
    }
    compileDoBlock(stmt) {
        const scope = this.currentProto.scopeDepth + 1;
        this.currentProto.scopeDepth++;
        for (const s of stmt.body)
            this.compileStatement(s);
        protoEndScope(this.currentProto, scope);
        this.currentProto.scopeDepth--;
        protoPatchAllJumps(this.currentProto);
    }
    compileExpression(expr, expectedResults) {
        const tasks = [{ kind: "expr", expr, expectedResults }];
        while (tasks.length > 0) {
            const task = tasks.pop();
            if (task.kind === "expr") {
                this.enqueueExprTasks(tasks, task.expr, task.expectedResults);
            }
            else if (task.kind === "emit") {
                protoEmit(this.currentProto, task.op, ...(task.args ?? []));
            }
            else if (task.kind === "emitJump") {
                task.ref.idx = protoEmitJump(this.currentProto, task.op);
            }
            else if (task.kind === "patchJump") {
                protoPatchJump(this.currentProto, task.ref.idx);
            }
        }
    }
    enqueueExprTasks(tasks, expr, expectedResults) {
        switch (expr.kind) {
            case "NilLiteral":
                tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, null)] });
                break;
            case "BooleanLiteral":
                tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, expr.value)] });
                break;
            case "NumberLiteral":
                tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, Number(expr.raw))] });
                break;
            case "StringLiteral":
                tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, expr.value)] });
                break;
            case "InterpString":
                this.enqueueInterpStringTasks(tasks, expr);
                break;
            case "Vararg":
                tasks.push({ kind: "emit", op: 27 /* Op.Vararg */, args: [0] });
                break;
            case "Identifier": {
                const localIdx = protoGetLocal(this.currentProto, expr.name);
                if (localIdx !== undefined) {
                    tasks.push({ kind: "emit", op: 5 /* Op.PushLocal */, args: [localIdx] });
                }
                else {
                    const globalIdx = this.addGlobal(expr.name);
                    tasks.push({ kind: "emit", op: 3 /* Op.PushGlobal */, args: [globalIdx] });
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
                tasks.push({ kind: "emit", op: 23 /* Op.GetIndex */ });
                tasks.push({ kind: "expr", expr: expr.index });
                tasks.push({ kind: "expr", expr: expr.object });
                break;
            case "MemberExpression":
                tasks.push({ kind: "emit", op: 21 /* Op.GetProperty */, args: [protoAddConstant(this.currentProto, expr.property)] });
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
                tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, null)] });
        }
    }
    enqueueCallTasks(tasks, expr, expectedResults) {
        const nresults = expectedResults ?? 1;
        tasks.push({ kind: "emit", op: 9 /* Op.Call */, args: [expr.args.length, nresults] });
        for (let i = expr.args.length - 1; i >= 0; i--) {
            tasks.push({ kind: "expr", expr: expr.args[i] });
        }
        tasks.push({ kind: "expr", expr: expr.callee });
    }
    enqueueMethodCallTasks(tasks, expr, expectedResults) {
        const nresults = expectedResults ?? 1;
        tasks.push({ kind: "emit", op: 10 /* Op.CallMethod */, args: [expr.args.length, nresults] });
        tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, expr.method)] });
        for (let i = expr.args.length - 1; i >= 0; i--) {
            tasks.push({ kind: "expr", expr: expr.args[i] });
        }
        tasks.push({ kind: "expr", expr: expr.object });
    }
    enqueueBinaryTasks(tasks, expr) {
        const op = expr.operator;
        const opCode = BINARY_OP_CODES[op];
        if (!opCode) {
            tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, null)] });
            return;
        }
        if (op === "and" || op === "or") {
            const jumpRef = { idx: 0 };
            // For "and": if left is falsy, return left (skip right). JumpIfFalse pops, so Dup first.
            // For "or": if left is truthy, return left (skip right). JumpIfTrue pops, so Dup first.
            const jumpOp = op === "and" ? 13 /* Op.JumpIfFalse */ : 14 /* Op.JumpIfTrue */;
            tasks.push({ kind: "patchJump", ref: jumpRef });
            tasks.push({ kind: "expr", expr: expr.right });
            tasks.push({ kind: "emit", op: 7 /* Op.Pop */, args: [1] }); // Pop left if not short-circuited
            tasks.push({ kind: "emitJump", op: jumpOp, ref: jumpRef });
            tasks.push({ kind: "emit", op: 8 /* Op.Dup */ }); // Dup left so JumpIf* pops the copy
            tasks.push({ kind: "expr", expr: expr.left });
        }
        else {
            tasks.push({ kind: "emit", op: 19 /* Op.Binary */, args: [opCode] });
            tasks.push({ kind: "expr", expr: expr.right });
            tasks.push({ kind: "expr", expr: expr.left });
        }
    }
    enqueueUnaryTasks(tasks, expr) {
        const opCode = UNARY_OP_CODES[expr.operator];
        if (!opCode) {
            tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, null)] });
            return;
        }
        tasks.push({ kind: "emit", op: 20 /* Op.Unary */, args: [opCode] });
        tasks.push({ kind: "expr", expr: expr.argument });
    }
    enqueueTableConstructorTasks(tasks, expr) {
        for (let i = expr.fields.length - 1; i >= 0; i--) {
            const field = expr.fields[i];
            if (field.key && !field.isNameKey) {
                tasks.push({ kind: "emit", op: 24 /* Op.SetIndex */ });
                tasks.push({ kind: "expr", expr: field.value });
                tasks.push({ kind: "expr", expr: field.key });
                tasks.push({ kind: "emit", op: 8 /* Op.Dup */ });
            }
            else if (field.key) {
                tasks.push({ kind: "emit", op: 24 /* Op.SetIndex */ });
                tasks.push({ kind: "expr", expr: field.value });
                if (field.key.kind === "StringLiteral") {
                    tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, field.key.value)] });
                }
                else {
                    tasks.push({ kind: "expr", expr: field.key });
                }
                tasks.push({ kind: "emit", op: 8 /* Op.Dup */ });
            }
            else {
                if (field.value.kind === "Vararg") {
                    tasks.push({ kind: "emit", op: 30 /* Op.TableVararg */ });
                }
                else {
                    tasks.push({ kind: "emit", op: 16 /* Op.SetList */ });
                    tasks.push({ kind: "expr", expr: field.value });
                }
            }
        }
        tasks.push({ kind: "emit", op: 15 /* Op.NewTable */ });
    }
    enqueueInterpStringTasks(tasks, expr) {
        if (expr.parts.length === 0) {
            tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, "")] });
            return;
        }
        for (let i = expr.parts.length - 1; i >= 0; i--) {
            if (i > 0) {
                tasks.push({ kind: "emit", op: 17 /* Op.Concat */ });
            }
            const part = expr.parts[i];
            if (typeof part === "string") {
                tasks.push({ kind: "emit", op: 2 /* Op.PushConst */, args: [protoAddConstant(this.currentProto, part)] });
            }
            else {
                tasks.push({ kind: "expr", expr: part });
            }
        }
    }
    enqueueIfExpressionTasks(tasks, expr) {
        const numClauses = expr.clauses.length;
        const hasElse = expr.elseBody.kind !== "NilLiteral";
        const subTasks = [];
        for (let i = 0; i < numClauses; i++) {
            const clause = expr.clauses[i];
            const isLastClause = i === numClauses - 1;
            const needsElseJump = isLastClause ? hasElse : true;
            subTasks.push({ kind: "expr", expr: clause.condition });
            const jumpRef = { idx: 0 };
            subTasks.push({ kind: "emitJump", op: 13 /* Op.JumpIfFalse */, ref: jumpRef });
            subTasks.push({ kind: "emit", op: 7 /* Op.Pop */, args: [1] });
            subTasks.push({ kind: "expr", expr: clause.body });
            if (needsElseJump) {
                const endRef = { idx: 0 };
                subTasks.push({ kind: "emitJump", op: 12 /* Op.Jump */, ref: endRef });
                subTasks.push({ kind: "patchJump", ref: jumpRef });
                subTasks.push({ kind: "emit", op: 7 /* Op.Pop */, args: [1] });
                if (!isLastClause) {
                    subTasks.push({ kind: "patchJump", ref: endRef });
                }
            }
            else {
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
export function compileToBytecode(program, context) {
    const compiler = new BytecodeCompiler(context.random);
    const result = compiler.compile(program);
    const code = generateVMRuntime(result, context);
    return { code, stats: { functionsVirtualized: result.protos.length > 1 ? result.protos.length - 1 : 1 } };
}
export { BytecodeCompiler, BINARY_OP_CODES, UNARY_OP_CODES };
