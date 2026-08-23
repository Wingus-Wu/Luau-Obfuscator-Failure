const KEYWORDS = {
    and: "And",
    break: "Break",
    do: "Do",
    else: "Else",
    elseif: "Elseif",
    end: "End",
    export: "Export",
    false: "False",
    for: "For",
    function: "Function",
    if: "If",
    in: "In",
    local: "Local",
    nil: "Nil",
    not: "Not",
    or: "Or",
    repeat: "Repeat",
    return: "Return",
    then: "Then",
    true: "True",
    type: "Type",
    typeof: "Typeof",
    until: "Until",
    while: "While",
    continue: "Continue",
};
const MULTI_CHAR_TOKENS = [
    ["+=", "PlusEqual"],
    ["-=", "MinusEqual"],
    ["*=", "StarEqual"],
    ["/=", "SlashEqual"],
    ["%=", "PercentEqual"],
    ["^=", "CaretEqual"],
    ["..=", "DotDotEqual"],
    ["&=", "AmpersandEqual"],
    ["|=", "PipeEqual"],
    ["<<=", "LessLessEqual"],
    [">>=", "GreaterGreaterEqual"],
    ["==", "EqualEqual"],
    ["~=", "TildeEqual"],
    ["<=", "LessEqual"],
    [">=", "GreaterEqual"],
    ["<<", "LessLess"],
    [">>", "GreaterGreater"],
    ["//", "SlashSlash"],
    ["...", "Vararg"],
    ["..", "DotDot"],
    ["::", "ColonColon"],
];
export class Lexer {
    source;
    pos = 0;
    line = 1;
    column = 1;
    constructor(source, startLine = 1, startCol = 1) {
        this.source = source;
        this.line = startLine;
        this.column = startCol;
    }
    lex() {
        const tokens = [];
        while (!this.isAtEnd()) {
            const token = this.scanToken();
            if (token)
                tokens.push(token);
        }
        tokens.push({ kind: "EOF", value: "", line: this.line, column: this.column });
        return tokens;
    }
    isAtEnd() {
        return this.pos >= this.source.length;
    }
    peek(offset = 0) {
        const idx = this.pos + offset;
        return idx < this.source.length ? this.source[idx] : "\0";
    }
    advance() {
        const ch = this.source[this.pos++];
        if (ch === "\n") {
            this.line++;
            this.column = 1;
        }
        else {
            this.column++;
        }
        return ch;
    }
    skipWhitespace() {
        while (!this.isAtEnd()) {
            const ch = this.peek();
            if (ch === " " || ch === "\r" || ch === "\t" || ch === "\n") {
                this.advance();
            }
            else if (ch === "-" && this.peek(1) === "-") {
                this.skipComment();
            }
            else if (ch === "[" && this.peek(1) === "[") {
                this.skipLongComment();
            }
            else {
                break;
            }
        }
    }
    skipComment() {
        while (!this.isAtEnd() && this.peek() !== "\n") {
            this.advance();
        }
    }
    skipLongComment() {
        let depth = 1;
        this.advance();
        this.advance();
        while (!this.isAtEnd() && depth > 0) {
            if (this.peek() === "[" && this.peek(1) === "[") {
                depth++;
                this.advance();
                this.advance();
            }
            else if (this.peek() === "]" && this.peek(1) === "]") {
                depth--;
                this.advance();
                this.advance();
            }
            else {
                this.advance();
            }
        }
    }
    scanString(quote) {
        const startLine = this.line;
        const startCol = this.column;
        let value = "";
        while (!this.isAtEnd() && this.peek() !== quote) {
            if (this.peek() === "\\") {
                this.advance();
                const esc = this.advance();
                switch (esc) {
                    case "n":
                        value += "\n";
                        break;
                    case "r":
                        value += "\r";
                        break;
                    case "t":
                        value += "\t";
                        break;
                    case "v":
                        value += "\v";
                        break;
                    case "a":
                        value += "\a";
                        break;
                    case "b":
                        value += "\b";
                        break;
                    case "f":
                        value += "\f";
                        break;
                    case "\\":
                        value += "\\";
                        break;
                    case '"':
                        value += '"';
                        break;
                    case "'":
                        value += "'";
                        break;
                    case "`":
                        value += "`";
                        break;
                    case "\n":
                        value += "\n";
                        break;
                    case "0":
                        value += "\0";
                        break;
                    case "z":
                        while (!this.isAtEnd() && (this.peek() === " " || this.peek() === "\t" || this.peek() === "\r" || this.peek() === "\n")) {
                            this.advance();
                        }
                        break;
                    case "x": {
                        const hex = this.source.slice(this.pos, this.pos + 2);
                        const code = parseInt(hex, 16);
                        if (!isNaN(code)) {
                            value += String.fromCharCode(code);
                            this.advance();
                            this.advance();
                        }
                        else {
                            value += esc;
                        }
                        break;
                    }
                    case "u": {
                        const hex = this.source.slice(this.pos, this.pos + 4);
                        const code = parseInt(hex, 16);
                        if (!isNaN(code)) {
                            value += String.fromCodePoint(code);
                            this.pos += 4;
                            this.column += 4;
                        }
                        else {
                            value += esc;
                        }
                        break;
                    }
                    default: value += esc;
                }
            }
            else {
                value += this.advance();
            }
        }
        if (this.isAtEnd()) {
            throw new Error(`Unterminated string starting at line ${startLine}, col ${startCol}`);
        }
        this.advance();
        return value;
    }
    scanInterpString() {
        const startLine = this.line;
        const startCol = this.column;
        let value = "";
        this.advance(); // consume opening backtick
        while (!this.isAtEnd() && this.peek() !== "`") {
            if (this.peek() === "\\") {
                this.advance();
                const esc = this.advance();
                switch (esc) {
                    case "n":
                        value += "\n";
                        break;
                    case "r":
                        value += "\r";
                        break;
                    case "t":
                        value += "\t";
                        break;
                    case "v":
                        value += "\v";
                        break;
                    case "a":
                        value += "\a";
                        break;
                    case "b":
                        value += "\b";
                        break;
                    case "f":
                        value += "\f";
                        break;
                    case "\\":
                        value += "\\";
                        break;
                    case '"':
                        value += '"';
                        break;
                    case "'":
                        value += "'";
                        break;
                    case "`":
                        value += "`";
                        break;
                    case "\n":
                        value += "\n";
                        break;
                    case "0":
                        value += "\0";
                        break;
                    case "z":
                        while (!this.isAtEnd() && (this.peek() === " " || this.peek() === "\t" || this.peek() === "\r" || this.peek() === "\n")) {
                            this.advance();
                        }
                        break;
                    case "x": {
                        const hex = this.source.slice(this.pos, this.pos + 2);
                        const code = parseInt(hex, 16);
                        if (!isNaN(code)) {
                            value += String.fromCharCode(code);
                            this.advance();
                            this.advance();
                        }
                        else {
                            value += esc;
                        }
                        break;
                    }
                    case "u": {
                        const hex = this.source.slice(this.pos, this.pos + 4);
                        const code = parseInt(hex, 16);
                        if (!isNaN(code)) {
                            value += String.fromCodePoint(code);
                            this.pos += 4;
                            this.column += 4;
                        }
                        else {
                            value += esc;
                        }
                        break;
                    }
                    default: value += esc;
                }
            }
            else if (this.peek() === "{") {
                if (this.peek(1) === "{") {
                    value += "{";
                    this.advance();
                    this.advance();
                }
                else {
                    value += this.advance();
                }
            }
            else if (this.peek() === "}") {
                if (this.peek(1) === "}") {
                    value += "}";
                    this.advance();
                    this.advance();
                }
                else {
                    value += this.advance();
                }
            }
            else {
                value += this.advance();
            }
        }
        if (this.isAtEnd()) {
            throw new Error(`Unterminated interpolated string starting at line ${startLine}, col ${startCol}`);
        }
        this.advance(); // consume closing backtick
        return value;
    }
    scanLongString() {
        const startLine = this.line;
        const startCol = this.column;
        let depth = 1;
        let opens = "";
        for (let i = 0; i < depth; i++) {
            opens += this.advance();
        }
        let value = "";
        while (!this.isAtEnd()) {
            if (this.peek() === "]" && this.peek(1) === "]") {
                let closeDepth = 0;
                let closeOpens = "";
                for (let i = 0; i < depth; i++) {
                    closeOpens += this.peek(closeDepth);
                    closeDepth++;
                }
                if (this.source.slice(this.pos, this.pos + depth + 2) === opens + "]]") {
                    this.pos += depth + 2;
                    this.column += depth + 2;
                    return value;
                }
            }
            value += this.advance();
        }
        throw new Error(`Unterminated long string starting at line ${startLine}, col ${startCol}`);
    }
    scanNumber() {
        let num = "";
        while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
            num += this.advance();
        }
        if (!this.isAtEnd() && this.peek() === "." && /[0-9]/.test(this.peek(1))) {
            num += this.advance();
            while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
                num += this.advance();
            }
        }
        if (!this.isAtEnd() && (this.peek() === "e" || this.peek() === "E")) {
            num += this.advance();
            if (!this.isAtEnd() && (this.peek() === "+" || this.peek() === "-")) {
                num += this.advance();
            }
            while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
                num += this.advance();
            }
        }
        return num;
    }
    scanIdentifier(start) {
        let ident = start;
        while (!this.isAtEnd() && /[A-Za-z0-9_\u00C0-\u024F\u0370-\u03FF]/.test(this.peek())) {
            ident += this.advance();
        }
        return ident;
    }
    scanToken() {
        this.skipWhitespace();
        if (this.isAtEnd())
            return null;
        const startLine = this.line;
        const startCol = this.column;
        const ch = this.peek();
        if (ch === "[" && (this.peek(1) === "[" || this.peek(1) === "=")) {
            let eqCount = 0;
            let idx = 1;
            while (this.peek(idx) === "=") {
                eqCount++;
                idx++;
            }
            if (this.peek(idx) === "[") {
                const value = this.scanLongString();
                return { kind: "String", value, raw: `[${"=".repeat(eqCount)}[${value}]${"=".repeat(eqCount)}]`, line: startLine, column: startCol };
            }
        }
        if (ch === '"' || ch === "'") {
            const quote = this.advance();
            const value = this.scanString(quote);
            return { kind: "String", value, raw: `${quote}${value}${quote}`, line: startLine, column: startCol };
        }
        if (ch === "`") {
            const value = this.scanInterpString();
            return { kind: "InterpString", value, raw: "`" + value + "`", line: startLine, column: startCol };
        }
        if (/[0-9]/.test(ch)) {
            const num = this.scanNumber();
            return { kind: "Number", value: num, line: startLine, column: startCol };
        }
        if (/[A-Za-z_\u00C0-\u024F\u0370-\u03FF]/.test(ch)) {
            const ident = this.scanIdentifier(this.advance());
            const kind = KEYWORDS[ident] ?? "Identifier";
            return { kind, value: ident, line: startLine, column: startCol };
        }
        for (const [op, kind] of MULTI_CHAR_TOKENS) {
            if (this.source.slice(this.pos, this.pos + op.length) === op) {
                for (let i = 0; i < op.length; i++)
                    this.advance();
                return { kind, value: op, line: startLine, column: startCol };
            }
        }
        const SINGLE_CHAR_TOKENS = {
            "+": "Plus", "-": "Minus", "*": "Star", "/": "Slash", "%": "Percent",
            "^": "Caret", "#": "Hash", "&": "Ampersand", "~": "Tilde", "|": "Pipe",
            "<": "Less", ">": "Greater", "=": "Assign", "(": "LParen", ")": "RParen",
            "{": "LBrace", "}": "RBrace", "[": "LBracket", "]": "RBracket",
            ";": "Semicolon", ":": "Colon", ".": "Dot", ",": "Comma",
        };
        const singleKind = SINGLE_CHAR_TOKENS[ch];
        if (singleKind) {
            this.advance();
            return { kind: singleKind, value: ch, line: startLine, column: startCol };
        }
        throw new Error(`Unexpected character '${ch}' at line ${startLine}, col ${startCol}`);
    }
}
