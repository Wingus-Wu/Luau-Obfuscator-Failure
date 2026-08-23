function luaString(value) {
    let result = "\"";
    for (const ch of value) {
        switch (ch) {
            case "\"":
                result += "\\\"";
                break;
            case "\\":
                result += "\\\\";
                break;
            case "\n":
                result += "\\n";
                break;
            case "\r":
                result += "\\r";
                break;
            case "\t":
                result += "\\t";
                break;
            case "\0":
                result += "\\0";
                break;
            default:
                if (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) > 126) {
                    result += "\\" + ch.charCodeAt(0).toString(10).padStart(3, "0");
                }
                else {
                    result += ch;
                }
        }
    }
    result += "\"";
    return result;
}
function encodeString(str, strategy, params) {
    if (strategy === "xor") {
        const key = params.key;
        let result = "";
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ key);
        }
        return { encoded: result };
    }
    if (strategy === "rotate") {
        const offset = params.offset;
        let result = "";
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode((str.charCodeAt(i) + offset) % 256);
        }
        return { encoded: result };
    }
    if (strategy === "xor-chunked") {
        const chunkSize = params.chunkSize;
        const keys = params.keys;
        let result = "";
        for (let i = 0; i < str.length; i++) {
            const keyIdx = Math.floor(i / chunkSize);
            const key = keys[keyIdx] ?? keys[keys.length - 1];
            result += String.fromCharCode(str.charCodeAt(i) ^ key);
        }
        return { encoded: result };
    }
    const key = params?.key ?? 0;
    let result = "";
    for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key);
    }
    return { encoded: result };
}
function generateParams(strategy, random) {
    if (strategy === "xor") {
        return { key: random.nextInt(1, 255) };
    }
    if (strategy === "rotate") {
        return { offset: random.nextInt(1, 255) };
    }
    if (strategy === "xor-chunked") {
        const chunkSize = random.nextInt(2, 5);
        const keys = [];
        const maxChunks = 24;
        for (let i = 0; i < maxChunks; i++) {
            keys.push(random.nextInt(1, 255));
        }
        return { chunkSize, keys };
    }
    return { key: random.nextInt(1, 255) };
}
function buildXorLookupTable(name, key) {
    return `local _sp_xor_${name}={};for _i=0,255 do _sp_xor_${name}[_i]=bit32.bxor(_i,${key}) end`;
}
function buildXorChunkedLookupTables(name, keys) {
    return `local _sp_xor_${name}={};local _sp_k_${name}={${keys.join(",")}};for _k=1,#_sp_k_${name} do local _t={};for _i=0,255 do _t[_i]=bit32.bxor(_i,_sp_k_${name}[_k]) end;_sp_xor_${name}[_k]=_t end`;
}
function generateDecoderName(random) {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let name = "_sd";
    for (let i = 0; i < 6; i++) {
        name += chars[random.nextInt(0, chars.length - 1)];
    }
    return name;
}
function makeNum(value, line = 0, column = 0) {
    return { kind: "NumberLiteral", raw: value, line, column };
}
function makeStr(value, line = 0, column = 0) {
    return { kind: "StringLiteral", value, raw: JSON.stringify(value), quoteStyle: "double", line, column };
}
function makeId(name, line = 0, column = 0) {
    return { kind: "Identifier", name, line, column };
}
function makeMember(object, property, line = 0, column = 0) {
    return { kind: "MemberExpression", object, property, line, column };
}
function makeCallExpr(callee, args, line = 0, column = 0) {
    return { kind: "CallExpression", callee, args, line, column };
}
function makeBinaryExpr(op, left, right, line = 0, column = 0) {
    return { kind: "BinaryExpression", operator: op, left, right, line, column };
}
function makeStringLen(input) {
    return makeCallExpr(makeMember(makeId("string"), "len"), [input]);
}
export class StringProtectionTransform {
    name = "stringProtection";
    priority = 20;
    enabled = true;
    random = null;
    context = null;
    poolId = 0;
    isGeneratedStatement(stmt) {
        return Boolean(stmt.__generatedHelper);
    }
    isGeneratedExpression(expr) {
        return Boolean(expr.__generatedHelper);
    }
    apply(ast, context) {
        this.random = context.random;
        this.context = context;
        this.poolId = 0;
        const strategies = ["xor", "rotate", "xor-chunked"];
        const strategy = context.random.pick(strategies);
        const params = generateParams(strategy, context.random);
        const decoderName = generateDecoderName(context.random);
        context.stringPoolDecoderName = decoderName;
        context.stringPoolStrategy = strategy;
        context.stringPoolStrategyParams = params;
        const newStatements = [];
        for (const stmt of ast.statements) {
            newStatements.push(...this.protectStatement(stmt));
        }
        if (context.stringPool.size === 0) {
            return { ...ast, statements: newStatements };
        }
        const isVirt = typeof context.config.virtualization === "string"
            ? context.config.virtualization !== "none" && context.config.virtualization !== "false" && context.config.virtualization !== ""
            : Boolean(context.config.virtualization);
        if (!isVirt) {
            const helperStatements = this.createHelperStatements(decoderName, strategy);
            return { ...ast, statements: [...helperStatements, ...newStatements] };
        }
        return { ...ast, statements: newStatements };
    }
    protectStatement(stmt) {
        if (this.isGeneratedStatement(stmt))
            return [stmt];
        if (stmt.kind === "VariableDeclaration")
            return [{ ...stmt, right: stmt.right.map(e => this.protectExpression(e)) }];
        if (stmt.kind === "FunctionDeclaration") {
            return [{
                    ...stmt,
                    body: stmt.body.map(s => {
                        const protectedStmts = this.protectStatement(s);
                        return protectedStmts.length === 1 ? protectedStmts[0] : { kind: "DoBlock", body: protectedStmts };
                    }),
                }];
        }
        if (stmt.kind === "Assignment") {
            return [{
                    ...stmt,
                    left: stmt.left.map(e => this.protectExpression(e)),
                    right: stmt.right.map(e => this.protectExpression(e)),
                }];
        }
        if (stmt.kind === "CompoundAssignment")
            return [{ ...stmt, left: this.protectExpression(stmt.left), right: this.protectExpression(stmt.right) }];
        if (stmt.kind === "CallStatement")
            return [{ ...stmt, expression: this.protectExpression(stmt.expression) }];
        if (stmt.kind === "MethodCallStatement")
            return [{ ...stmt, expression: this.protectExpression(stmt.expression) }];
        if (stmt.kind === "ReturnStatement")
            return [{ ...stmt, expressions: stmt.expressions.map(e => this.protectExpression(e)) }];
        if (stmt.kind === "BreakStatement" || stmt.kind === "ContinueStatement")
            return [stmt];
        if (stmt.kind === "IfStatement")
            return [this.protectIfStatement(stmt)];
        if (stmt.kind === "WhileLoop")
            return [this.protectWhileLoop(stmt)];
        if (stmt.kind === "RepeatLoop")
            return [this.protectRepeatLoop(stmt)];
        if (stmt.kind === "NumericForLoop")
            return [this.protectNumericForLoop(stmt)];
        if (stmt.kind === "GenericForLoop")
            return [this.protectGenericForLoop(stmt)];
        if (stmt.kind === "DoBlock")
            return [this.protectDoBlock(stmt)];
        if (stmt.kind === "ExportDeclaration")
            return [this.protectExportDeclaration(stmt)];
        return [stmt];
    }
    protectIfStatement(stmt) {
        return {
            ...stmt,
            condition: this.protectExpression(stmt.condition),
            body: stmt.body.flatMap((s) => this.protectStatement(s)),
            elseifBlocks: stmt.elseifBlocks.map((eb) => ({
                condition: this.protectExpression(eb.condition),
                body: eb.body.flatMap((s) => this.protectStatement(s)),
            })),
            elseBody: stmt.elseBody.flatMap((s) => this.protectStatement(s)),
        };
    }
    protectWhileLoop(stmt) {
        return { ...stmt, condition: this.protectExpression(stmt.condition), body: stmt.body.flatMap((s) => this.protectStatement(s)) };
    }
    protectRepeatLoop(stmt) {
        return { ...stmt, body: stmt.body.flatMap((s) => this.protectStatement(s)), condition: this.protectExpression(stmt.condition) };
    }
    protectNumericForLoop(stmt) {
        return {
            ...stmt,
            start: this.protectExpression(stmt.start),
            end: this.protectExpression(stmt.end),
            step: stmt.step ? this.protectExpression(stmt.step) : null,
            body: stmt.body.flatMap((s) => this.protectStatement(s)),
        };
    }
    protectGenericForLoop(stmt) {
        return { ...stmt, expressions: stmt.expressions.map((e) => this.protectExpression(e)), body: stmt.body.flatMap((s) => this.protectStatement(s)) };
    }
    protectDoBlock(stmt) {
        return { ...stmt, body: stmt.body.flatMap((s) => this.protectStatement(s)) };
    }
    protectExportDeclaration(stmt) {
        return { ...stmt, declaration: this.protectStatement(stmt.declaration)[0] };
    }
    protectExpression(expr) {
        if (this.isGeneratedExpression(expr))
            return expr;
        if (expr.kind === "StringLiteral")
            return this.protectString(expr);
        if (expr.kind === "FunctionExpression")
            return this.protectFunctionExpr(expr);
        if (expr.kind === "TableConstructor") {
            return { ...expr, fields: expr.fields.map(f => ({ ...f, key: f.key ? this.protectExpression(f.key) : null, value: this.protectExpression(f.value) })) };
        }
        if (expr.kind === "BinaryExpression")
            return { ...expr, left: this.protectExpression(expr.left), right: this.protectExpression(expr.right) };
        if (expr.kind === "UnaryExpression")
            return { ...expr, argument: this.protectExpression(expr.argument) };
        if (expr.kind === "ParenthesizedExpression")
            return { ...expr, expression: this.protectExpression(expr.expression) };
        if (expr.kind === "IndexExpression")
            return { ...expr, object: this.protectExpression(expr.object), index: this.protectExpression(expr.index) };
        if (expr.kind === "MemberExpression")
            return { ...expr, object: this.protectExpression(expr.object) };
        if (expr.kind === "CallExpression")
            return { ...expr, callee: this.protectExpression(expr.callee), args: expr.args.map(a => this.protectExpression(a)) };
        if (expr.kind === "MethodCallExpression")
            return { ...expr, object: this.protectExpression(expr.object), args: expr.args.map(a => this.protectExpression(a)) };
        if (expr.kind === "TypeCastExpression")
            return { ...expr, expression: this.protectExpression(expr.expression) };
        if (expr.kind === "IfExpression") {
            return {
                ...expr,
                clauses: expr.clauses.map(c => ({ condition: this.protectExpression(c.condition), body: this.protectExpression(c.body) })),
                elseBody: this.protectExpression(expr.elseBody),
            };
        }
        if (expr.kind === "InterpString")
            return { ...expr, parts: expr.parts.map(p => typeof p === "string" ? p : this.protectExpression(p)) };
        return expr;
    }
    protectString(str) {
        const { encoded } = encodeString(str.value, this.context.stringPoolStrategy, this.context.stringPoolStrategyParams);
        this.poolId++;
        this.context.stringPool.set(this.poolId, { encoded, strategy: this.context.stringPoolStrategy });
        this.context.stats.stringsProtected++;
        if (this.context.config.virtualization) {
            return makeCallExpr(makeId(this.context.stringPoolDecoderName, str.line, str.column), [makeNum(String(this.poolId), str.line, str.column)], str.line, str.column);
        }
        return makeCallExpr(makeId(this.context.stringPoolDecoderName, str.line, str.column), [makeStr(encoded, str.line, str.column)], str.line, str.column);
    }
    protectFunctionExpr(expr) {
        return {
            ...expr,
            body: expr.body.map((s) => {
                const protectedStmts = this.protectStatement(s);
                return protectedStmts.length === 1 ? protectedStmts[0] : { kind: "DoBlock", body: protectedStmts };
            }),
        };
    }
    createHelperStatements(decoderName, strategy) {
        const entries = [];
        const sortedIds = Array.from(this.context.stringPool.keys()).sort((a, b) => a - b);
        for (const id of sortedIds) {
            const entry = this.context.stringPool.get(id);
            entries.push(luaString(entry.encoded));
        }
        const poolTable = "local " + decoderName + "_pool = {" + entries.join(", ") + "};";
        const decoderCode = this.buildDecoderLua(decoderName, strategy);
        return [
            { kind: "RawStatement", code: poolTable, line: 0, column: 0, __generatedHelper: true },
            { kind: "RawStatement", code: decoderCode, line: 0, column: 0, __generatedHelper: true },
        ];
    }
    buildDecoderLua(decoderName, strategy) {
        const params = this.context.stringPoolStrategyParams;
        const cacheName = "_sp_cache_" + decoderName;
        const poolName = decoderName + "_pool";
        if (strategy === "xor") {
            const key = params.key;
            const lookupName = "_sp_xor_" + decoderName;
            return [
                "local " + cacheName + " = {}",
                buildXorLookupTable(decoderName, key),
                "local function " + decoderName + "(input)",
                "  local _decoded = " + poolName + "[input]",
                "  if _decoded then input = _decoded end",
                "  if " + cacheName + "[input] then return " + cacheName + "[input] end",
                "  local result = \"\"",
                "  for i = 1, #input do",
                "    result = result .. string.char(" + lookupName + "[string.byte(input, i)])",
                "  end",
                "  " + cacheName + "[input] = result",
                "  return result",
                "end",
            ].join("\n");
        }
        if (strategy === "rotate") {
            const offset = params.offset;
            return [
                "local " + cacheName + " = {}",
                "local function " + decoderName + "(input)",
                "  local _decoded = " + poolName + "[input]",
                "  if _decoded then input = _decoded end",
                "  if " + cacheName + "[input] then return " + cacheName + "[input] end",
                "  local result = \"\"",
                "  for i = 1, #input do",
                "    result = result .. string.char((string.byte(input, i) - " + offset + " + 256) % 256)",
                "  end",
                "  " + cacheName + "[input] = result",
                "  return result",
                "end",
            ].join("\n");
        }
        if (strategy === "xor-chunked") {
            const chunkSize = params.chunkSize;
            const keys = params.keys;
            const lookupTable = buildXorChunkedLookupTables(decoderName, keys);
            return [
                "local " + cacheName + " = {}",
                lookupTable,
                "local function " + decoderName + "(input)",
                "  local _decoded = " + poolName + "[input]",
                "  if _decoded then input = _decoded end",
                "  if " + cacheName + "[input] then return " + cacheName + "[input] end",
                "  local result = \"\"",
                "  for i = 1, #input do",
                "    local key_idx = math.ceil(i / " + chunkSize + ")",
                "    local _b = string.byte(input, i)",
                "    result = result .. string.char(_sp_xor_" + decoderName + "[key_idx][_b])",
                "  end",
                "  " + cacheName + "[input] = result",
                "  return result",
                "end",
            ].join("\n");
        }
        const key = params.key ?? 0;
        const lookupName = "_sp_xor_" + decoderName;
        return [
            "local " + cacheName + " = {}",
            buildXorLookupTable(decoderName, key),
            "local function " + decoderName + "(input)",
            "  local _decoded = " + poolName + "[input]",
            "  if _decoded then input = _decoded end",
            "  if " + cacheName + "[input] then return " + cacheName + "[input] end",
            "  local result = \"\"",
            "  for i = 1, #input do",
            "    result = result .. string.char(" + lookupName + "[string.byte(input, i)])",
            "  end",
            "  " + cacheName + "[input] = result",
            "  return result",
            "end",
        ].join("\n");
    }
}
