const SCRIPT_FUNCTION_NAME = "advanced_flip_exchange";
const MAX_EXECUTION_STEPS = 200_000;
const compiledScripts = new Map();

export const PAGE_PYTHON_SAMPLE = `def advanced_flip_exchange(course):
    flip_list=[]
    exchange_list=[]
    num_32_count=0
    for i in range(course.length):
        flip=0
        exchange=0

        is_32=str(course.control_number[i])=="32"
        num_32_count+=is_32
        if is_32 and num_32_count==2:
            flip=1
        assert not flip*exchange

        flip_list.append(flip)
        exchange_list.append(exchange)

    return flip_list,exchange_list`;

export function isPythonPageScript(source) {
  return new RegExp(`^\\s*def\\s+${SCRIPT_FUNCTION_NAME}\\s*\\(`, "m").test(String(source || ""));
}

export function validatePythonPageScript(source) {
  try {
    compilePythonPageScript(source);
    return "";
  }
  catch (error) {
    return error?.message || String(error);
  }
}

export function executePythonPageScript(source, course) {
  return compilePythonPageScript(source)(course || {});
}

export function compilePythonPageScript(source) {
  const code = String(source || "");
  if (compiledScripts.has(code)) return compiledScripts.get(code);
  const program = new PythonSubsetParser(code).parse();
  if (!program.some(statement => statement.type === "def" && statement.name === SCRIPT_FUNCTION_NAME)) {
    throw scriptError(`Required function '${SCRIPT_FUNCTION_NAME}(course)' was not found`);
  }
  const compiled = course => {
    const budget = { remaining: MAX_EXECUTION_STEPS };
    const globals = createGlobalScope(budget);
    executeBlock(program, globals, budget);
    const fn = globals.get(SCRIPT_FUNCTION_NAME);
    return callValue(fn, [course], budget, 0);
  };
  compiledScripts.set(code, compiled);
  return compiled;
}

class PythonSubsetParser {
  constructor(source) {
    this.lines = logicalLines(source);
    this.position = 0;
  }

  parse() {
    if (!this.lines.length) throw scriptError("Script is empty");
    const indent = this.lines[0].indent;
    if (indent !== 0) throw scriptError("Top-level code must not be indented", this.lines[0].line);
    const body = this.parseBlock(0);
    if (this.position !== this.lines.length) {
      throw scriptError("Unexpected indentation", this.lines[this.position]?.line);
    }
    return body;
  }

  parseBlock(indent) {
    const statements = [];
    while (this.position < this.lines.length) {
      const line = this.lines[this.position];
      if (line.indent < indent) break;
      if (line.indent > indent) throw scriptError("Unexpected indentation", line.line);
      if (/^(elif\b|else\s*:)/.test(line.text)) break;
      statements.push(this.parseStatement(indent));
    }
    return statements;
  }

  parseStatement(indent) {
    const line = this.lines[this.position++];
    const text = line.text;
    const defMatch = text.match(/^def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:\s*$/);
    if (defMatch) {
      const params = defMatch[2].split(",").map(value => value.trim()).filter(Boolean);
      for (const param of params) {
        if (!/^[A-Za-z_]\w*$/.test(param)) throw scriptError(`Unsupported parameter '${param}'`, line.line);
      }
      return { type: "def", name: defMatch[1], params, body: this.childBlock(indent, line), line: line.line };
    }

    const forMatch = text.match(/^for\s+(.+?)\s+in\s+(.+)\s*:\s*$/);
    if (forMatch) {
      return {
        type: "for",
        target: parseExpression(forMatch[1], line.line),
        iterable: parseExpression(forMatch[2], line.line),
        body: this.childBlock(indent, line),
        line: line.line
      };
    }

    const whileMatch = text.match(/^while\s+(.+)\s*:\s*$/);
    if (whileMatch) {
      return { type: "while", test: parseExpression(whileMatch[1], line.line), body: this.childBlock(indent, line), line: line.line };
    }

    const ifMatch = text.match(/^if\s+(.+)\s*:\s*$/);
    if (ifMatch) {
      const branches = [{ test: parseExpression(ifMatch[1], line.line), body: this.childBlock(indent, line), line: line.line }];
      let otherwise = [];
      while (this.position < this.lines.length && this.lines[this.position].indent === indent) {
        const candidate = this.lines[this.position];
        const elifMatch = candidate.text.match(/^elif\s+(.+)\s*:\s*$/);
        if (elifMatch) {
          this.position += 1;
          branches.push({ test: parseExpression(elifMatch[1], candidate.line), body: this.childBlock(indent, candidate), line: candidate.line });
          continue;
        }
        if (/^else\s*:\s*$/.test(candidate.text)) {
          this.position += 1;
          otherwise = this.childBlock(indent, candidate);
        }
        break;
      }
      return { type: "if", branches, otherwise, line: line.line };
    }

    const returnMatch = text.match(/^return(?:\s+(.+))?$/);
    if (returnMatch) return { type: "return", value: returnMatch[1] ? parseExpression(returnMatch[1], line.line) : literal(null), line: line.line };
    const assertMatch = text.match(/^assert\s+(.+)$/);
    if (assertMatch) return { type: "assert", value: parseExpression(assertMatch[1], line.line), line: line.line };
    if (text === "break") return { type: "break", line: line.line };
    if (text === "continue") return { type: "continue", line: line.line };
    if (text === "pass") return { type: "pass", line: line.line };

    const assignment = findAssignment(text);
    if (assignment) {
      return {
        type: "assign",
        target: parseExpression(text.slice(0, assignment.index), line.line),
        operator: assignment.operator,
        value: parseExpression(text.slice(assignment.index + assignment.operator.length), line.line),
        line: line.line
      };
    }
    return { type: "expression", value: parseExpression(text, line.line), line: line.line };
  }

  childBlock(parentIndent, header) {
    const next = this.lines[this.position];
    if (!next || next.indent <= parentIndent) throw scriptError("Expected an indented block", header.line);
    return this.parseBlock(next.indent);
  }
}

class ExpressionParser {
  constructor(source, line) {
    this.tokens = expressionTokens(source, line);
    this.position = 0;
    this.line = line;
  }

  parse() {
    const value = this.parseTuple();
    if (this.current().type !== "end") throw scriptError(`Unexpected token '${this.current().value}'`, this.line);
    return value;
  }

  parseTuple() {
    const values = [this.parseOr()];
    while (this.takeIf(",")) {
      if (this.current().type === "end" || this.is(")") || this.is("]")) break;
      values.push(this.parseOr());
    }
    return values.length === 1 ? values[0] : { type: "tuple", values };
  }

  parseOr() {
    let node = this.parseAnd();
    while (this.keyword("or")) node = { type: "binary", operator: this.take().value, left: node, right: this.parseAnd() };
    return node;
  }

  parseAnd() {
    let node = this.parseNot();
    while (this.keyword("and")) node = { type: "binary", operator: this.take().value, left: node, right: this.parseNot() };
    return node;
  }

  parseNot() {
    if (this.keyword("not") && this.tokens[this.position + 1]?.value !== "in") {
      this.take();
      return { type: "unary", operator: "not", value: this.parseNot() };
    }
    return this.parseComparison();
  }

  parseComparison() {
    let node = this.parseAdditive();
    while (true) {
      let operator = null;
      if (["==", "!=", "<", "<=", ">", ">="].includes(this.current().value)) operator = this.take().value;
      else if (this.keyword("in")) operator = this.take().value;
      else if (this.keyword("is")) {
        this.take();
        operator = this.keyword("not") ? "is not" : "is";
        if (operator === "is not") this.take();
      }
      else if (this.keyword("not") && this.tokens[this.position + 1]?.value === "in") {
        this.position += 2;
        operator = "not in";
      }
      if (!operator) break;
      node = { type: "binary", operator, left: node, right: this.parseAdditive() };
    }
    return node;
  }

  parseAdditive() {
    let node = this.parseMultiplicative();
    while (["+", "-"].includes(this.current().value)) node = { type: "binary", operator: this.take().value, left: node, right: this.parseMultiplicative() };
    return node;
  }

  parseMultiplicative() {
    let node = this.parseUnary();
    while (["*", "/", "//", "%"].includes(this.current().value)) node = { type: "binary", operator: this.take().value, left: node, right: this.parseUnary() };
    return node;
  }

  parseUnary() {
    if (["+", "-"].includes(this.current().value)) return { type: "unary", operator: this.take().value, value: this.parseUnary() };
    return this.parsePower();
  }

  parsePower() {
    let node = this.parsePostfix();
    if (this.takeIf("**")) node = { type: "binary", operator: "**", left: node, right: this.parseUnary() };
    return node;
  }

  parsePostfix() {
    let node = this.parsePrimary();
    while (true) {
      if (this.takeIf(".")) {
        const name = this.take();
        if (name.type !== "identifier") throw scriptError("Expected an attribute name", this.line);
        node = { type: "attribute", object: node, name: name.value };
        continue;
      }
      if (this.takeIf("[")) {
        const index = this.parseTuple();
        this.expect("]");
        node = { type: "index", object: node, index };
        continue;
      }
      if (this.takeIf("(")) {
        const args = [];
        if (!this.is(")")) {
          do { args.push(this.parseOr()); } while (this.takeIf(",") && !this.is(")"));
        }
        this.expect(")");
        node = { type: "call", callee: node, args };
        continue;
      }
      break;
    }
    return node;
  }

  parsePrimary() {
    const token = this.take();
    if (token.type === "literal") return literal(token.value);
    if (token.type === "identifier") return { type: "variable", name: token.value };
    if (token.value === "[") {
      const values = [];
      if (!this.is("]")) {
        do { values.push(this.parseOr()); } while (this.takeIf(",") && !this.is("]"));
      }
      this.expect("]");
      return { type: "list", values };
    }
    if (token.value === "(") {
      if (this.takeIf(")")) return { type: "tuple", values: [] };
      const value = this.parseTuple();
      this.expect(")");
      return value;
    }
    throw scriptError(`Expected a value, found '${token.value || "end of expression"}'`, this.line);
  }

  keyword(value) { return this.current().type === "identifier" && this.current().value === value; }
  is(value) { return this.current().value === value; }
  current() { return this.tokens[this.position] || this.tokens.at(-1); }
  take() { return this.tokens[this.position++]; }
  takeIf(value) { if (!this.is(value)) return false; this.position += 1; return true; }
  expect(value) { if (!this.takeIf(value)) throw scriptError(`Expected '${value}'`, this.line); }
}

class Scope {
  constructor(parent = null) {
    this.parent = parent;
    this.values = new Map();
  }
  define(name, value) { this.values.set(name, value); }
  set(name, value) { this.values.set(name, value); }
  get(name) {
    if (this.values.has(name)) return this.values.get(name);
    if (this.parent) return this.parent.get(name);
    throw scriptError(`Name '${name}' is not defined`);
  }
}

function createGlobalScope(budget) {
  const scope = new Scope();
  const builtin = (name, fn) => scope.define(name, { type: "builtin", name, call: fn });
  builtin("range", (args, executionBudget) => pythonRange(args, executionBudget));
  builtin("str", args => String(args[0] ?? ""));
  builtin("int", args => Math.trunc(Number(args[0]) || 0));
  builtin("float", args => Number(args[0]) || 0);
  builtin("bool", args => pythonTruthy(args[0]));
  builtin("len", args => args[0]?.length ?? Object.keys(args[0] || {}).length);
  builtin("min", args => Math.min(...flattenBuiltinArgs(args).map(Number)));
  builtin("max", args => Math.max(...flattenBuiltinArgs(args).map(Number)));
  builtin("sum", args => [...(args[0] || [])].reduce((sum, value) => sum + Number(value || 0), Number(args[1] || 0)));
  builtin("abs", args => Math.abs(Number(args[0]) || 0));
  builtin("enumerate", args => [...(args[0] || [])].map((value, index) => [index + Number(args[1] || 0), value]));
  builtin("zip", args => {
    const arrays = args.map(value => [...(value || [])]);
    const length = arrays.length ? Math.min(...arrays.map(value => value.length)) : 0;
    return Array.from({ length }, (_, index) => arrays.map(value => value[index]));
  });
  scope.define("True", true);
  scope.define("False", false);
  scope.define("None", null);
  scope.define("__budget__", budget);
  return scope;
}

function executeBlock(statements, scope, budget) {
  for (const statement of statements) {
    tick(budget, statement.line);
    const signal = executeStatement(statement, scope, budget);
    if (signal) return signal;
  }
  return null;
}

function executeStatement(statement, scope, budget) {
  switch (statement.type) {
    case "def":
      scope.define(statement.name, { ...statement, type: "function", closure: scope });
      return null;
    case "assign": {
      const value = evaluate(statement.value, scope, budget);
      if (statement.operator === "=") assignTarget(statement.target, value, scope, budget);
      else {
        const current = evaluate(statement.target, scope, budget);
        assignTarget(statement.target, binaryValue(statement.operator.slice(0, -1), current, value), scope, budget);
      }
      return null;
    }
    case "expression": evaluate(statement.value, scope, budget); return null;
    case "assert":
      if (!pythonTruthy(evaluate(statement.value, scope, budget))) throw scriptError("Assertion failed", statement.line);
      return null;
    case "return": return { type: "return", value: evaluate(statement.value, scope, budget) };
    case "break": return { type: "break" };
    case "continue": return { type: "continue" };
    case "pass": return null;
    case "if": {
      for (const branch of statement.branches) {
        if (!pythonTruthy(evaluate(branch.test, scope, budget))) continue;
        return executeBlock(branch.body, scope, budget);
      }
      return executeBlock(statement.otherwise, scope, budget);
    }
    case "for": {
      const iterable = evaluate(statement.iterable, scope, budget);
      if (iterable == null || typeof iterable[Symbol.iterator] !== "function") throw scriptError("Object is not iterable", statement.line);
      for (const value of iterable) {
        tick(budget, statement.line);
        assignTarget(statement.target, value, scope, budget);
        const signal = executeBlock(statement.body, scope, budget);
        if (signal?.type === "return") return signal;
        if (signal?.type === "break") break;
      }
      return null;
    }
    case "while": {
      while (pythonTruthy(evaluate(statement.test, scope, budget))) {
        tick(budget, statement.line);
        const signal = executeBlock(statement.body, scope, budget);
        if (signal?.type === "return") return signal;
        if (signal?.type === "break") break;
      }
      return null;
    }
    default: throw scriptError(`Unsupported statement '${statement.type}'`, statement.line);
  }
}

function evaluate(node, scope, budget) {
  tick(budget);
  switch (node.type) {
    case "literal": return node.value;
    case "variable": return scope.get(node.name);
    case "list": return node.values.map(value => evaluate(value, scope, budget));
    case "tuple": return node.values.map(value => evaluate(value, scope, budget));
    case "attribute": return getAttribute(evaluate(node.object, scope, budget), node.name);
    case "index": return getIndex(evaluate(node.object, scope, budget), evaluate(node.index, scope, budget));
    case "call": return callValue(evaluate(node.callee, scope, budget), node.args.map(arg => evaluate(arg, scope, budget)), budget);
    case "unary": {
      const value = evaluate(node.value, scope, budget);
      if (node.operator === "not") return !pythonTruthy(value);
      if (node.operator === "+") return Number(value);
      if (node.operator === "-") return -Number(value);
      break;
    }
    case "binary": {
      const left = evaluate(node.left, scope, budget);
      if (node.operator === "and") return pythonTruthy(left) ? evaluate(node.right, scope, budget) : left;
      if (node.operator === "or") return pythonTruthy(left) ? left : evaluate(node.right, scope, budget);
      return binaryValue(node.operator, left, evaluate(node.right, scope, budget));
    }
  }
  throw scriptError(`Unsupported expression '${node.type}'`);
}

function binaryValue(operator, left, right) {
  switch (operator) {
    case "+": return Array.isArray(left) && Array.isArray(right) ? [...left, ...right] : left + right;
    case "-": return Number(left) - Number(right);
    case "*": return Number(left) * Number(right);
    case "/": return Number(left) / Number(right);
    case "//": return Math.floor(Number(left) / Number(right));
    case "%": return Number(left) % Number(right);
    case "**": return Number(left) ** Number(right);
    case "==": return pythonEqual(left, right);
    case "!=": return !pythonEqual(left, right);
    case "<": return left < right;
    case "<=": return left <= right;
    case ">": return left > right;
    case ">=": return left >= right;
    case "in": return contains(right, left);
    case "not in": return !contains(right, left);
    case "is": return left === right;
    case "is not": return left !== right;
    default: throw scriptError(`Unsupported operator '${operator}'`);
  }
}

function assignTarget(target, value, scope, budget) {
  if (target.type === "variable") {
    scope.set(target.name, value);
    return;
  }
  if (target.type === "tuple" || target.type === "list") {
    const values = [...(value || [])];
    if (values.length !== target.values.length) throw scriptError("Cannot unpack values of different lengths");
    target.values.forEach((item, index) => assignTarget(item, values[index], scope, budget));
    return;
  }
  if (target.type === "attribute") {
    const object = evaluate(target.object, scope, budget);
    if (!object || typeof object !== "object") throw scriptError("Cannot assign an attribute on this value");
    assertSafeProperty(target.name);
    object[target.name] = value;
    return;
  }
  if (target.type === "index") {
    const object = evaluate(target.object, scope, budget);
    const index = evaluate(target.index, scope, budget);
    assertSafeProperty(index);
    object[index] = value;
    return;
  }
  throw scriptError("Invalid assignment target");
}

function callValue(value, args, budget, line) {
  if (value?.type === "builtin") return value.call(args, budget);
  if (value?.type === "bound-method") return value.call(args, budget);
  if (value?.type === "function") {
    if (args.length !== value.params.length) throw scriptError(`${value.name}() expects ${value.params.length} argument(s)`, line || value.line);
    const local = new Scope(value.closure);
    value.params.forEach((name, index) => local.define(name, args[index]));
    const signal = executeBlock(value.body, local, budget);
    return signal?.type === "return" ? signal.value : null;
  }
  throw scriptError("Object is not callable", line);
}

function getAttribute(object, name) {
  if (object == null) throw scriptError(`Cannot access '${name}' on None`);
  assertSafeProperty(name);
  if (Array.isArray(object)) {
    if (name === "append") return boundMethod("list.append", args => { object.push(args[0]); return null; });
    if (name === "extend") return boundMethod("list.extend", args => { object.push(...(args[0] || [])); return null; });
    if (name === "count") return boundMethod("list.count", args => object.filter(value => pythonEqual(value, args[0])).length);
    if (name === "index") return boundMethod("list.index", args => object.findIndex(value => pythonEqual(value, args[0])));
  }
  if (typeof object === "string") {
    if (name === "lower") return boundMethod("str.lower", () => object.toLowerCase());
    if (name === "upper") return boundMethod("str.upper", () => object.toUpperCase());
    if (name === "startswith") return boundMethod("str.startswith", args => object.startsWith(String(args[0])));
    if (name === "endswith") return boundMethod("str.endswith", args => object.endsWith(String(args[0])));
    if (name === "strip") return boundMethod("str.strip", () => object.trim());
  }
  if (typeof object === "object" && Object.prototype.hasOwnProperty.call(object, name)) return object[name];
  throw scriptError(`Object has no attribute '${name}'`);
}

function getIndex(object, index) {
  if (object == null) throw scriptError("Cannot index None");
  assertSafeProperty(index);
  const normalized = typeof index === "number" && index < 0 && object.length !== undefined ? object.length + index : index;
  return object[normalized];
}

function boundMethod(name, call) { return { type: "bound-method", name, call }; }

function logicalLines(source) {
  const result = [];
  String(source || "").replace(/\r\n?/g, "\n").split("\n").forEach((raw, index) => {
    if (/^\s*$/.test(raw)) return;
    if (/^\s*#/.test(raw)) return;
    const prefix = raw.match(/^[ \t]*/)[0];
    if (prefix.includes("\t")) throw scriptError("Tabs are not supported; use spaces", index + 1);
    const text = stripComment(raw.slice(prefix.length)).trimEnd();
    if (!text.trim()) return;
    result.push({ indent: prefix.length, text: text.trimStart(), line: index + 1 });
  });
  return result;
}

function stripComment(source) {
  let quote = "";
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) { escaped = false; continue; }
    if (char === "\\" && quote) { escaped = true; continue; }
    if (quote) { if (char === quote) quote = ""; continue; }
    if (char === "\"" || char === "'") { quote = char; continue; }
    if (char === "#") return source.slice(0, index);
  }
  return source;
}

function findAssignment(source) {
  let quote = "";
  let escaped = false;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) { escaped = false; continue; }
    if (char === "\\" && quote) { escaped = true; continue; }
    if (quote) { if (char === quote) quote = ""; continue; }
    if (char === "\"" || char === "'") { quote = char; continue; }
    if ("([{".includes(char)) { depth += 1; continue; }
    if (")]}".includes(char)) { depth -= 1; continue; }
    if (depth !== 0) continue;
    for (const operator of ["//=", "+=", "-=", "*=", "/=", "%=", "="]) {
      if (!source.startsWith(operator, index)) continue;
      if (operator === "=" && (source[index - 1] === "=" || source[index - 1] === "!" || source[index - 1] === "<" || source[index - 1] === ">" || source[index + 1] === "=")) continue;
      return { index, operator };
    }
  }
  return null;
}

function expressionTokens(source, line) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) { index += 1; continue; }
    const pair = source.slice(index, index + 2);
    if (["==", "!=", "<=", ">=", "//", "**"].includes(pair)) {
      tokens.push({ type: "operator", value: pair });
      index += 2;
      continue;
    }
    if ("+-*/%<>()[],.".includes(char)) {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }
    if (char === "\"" || char === "'") {
      const quote = char;
      index += 1;
      let value = "";
      let closed = false;
      while (index < source.length) {
        const next = source[index++];
        if (next === quote) { closed = true; break; }
        if (next === "\\") {
          if (index >= source.length) break;
          const escaped = source[index++];
          value += ({ n: "\n", r: "\r", t: "\t" })[escaped] ?? escaped;
        }
        else value += next;
      }
      if (!closed) throw scriptError("Unterminated string", line);
      tokens.push({ type: "literal", value });
      continue;
    }
    const number = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (number) {
      tokens.push({ type: "literal", value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    const identifier = source.slice(index).match(/^[A-Za-z_]\w*/);
    if (identifier) {
      const value = identifier[0];
      tokens.push({ type: "identifier", value });
      index += value.length;
      continue;
    }
    throw scriptError(`Unexpected character '${char}'`, line);
  }
  tokens.push({ type: "end", value: "" });
  return tokens;
}

function parseExpression(source, line) {
  return new ExpressionParser(String(source || "").trim(), line).parse();
}

function literal(value) { return { type: "literal", value }; }
function pythonTruthy(value) {
  if (value == null || value === false || value === 0 || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}
function pythonEqual(left, right) {
  if (Array.isArray(left) && Array.isArray(right)) return left.length === right.length && left.every((value, index) => pythonEqual(value, right[index]));
  return left === right;
}
function contains(container, value) {
  if (typeof container === "string") return container.includes(String(value));
  if (Array.isArray(container)) return container.some(candidate => pythonEqual(candidate, value));
  return Object.prototype.hasOwnProperty.call(container || {}, value);
}
function pythonRange(args, budget) {
  let start = 0;
  let stop = Number(args[0]) || 0;
  let step = 1;
  if (args.length >= 2) { start = Number(args[0]) || 0; stop = Number(args[1]) || 0; }
  if (args.length >= 3) step = Number(args[2]) || 0;
  if (!step) throw scriptError("range() step cannot be zero");
  const estimatedLength = Math.max(0, Math.ceil((stop - start) / step));
  if (!Number.isFinite(estimatedLength) || estimatedLength > Math.min(MAX_EXECUTION_STEPS, budget?.remaining ?? MAX_EXECUTION_STEPS)) {
    throw scriptError("range() is too large");
  }
  const values = [];
  if (step > 0) for (let value = start; value < stop; value += step) values.push(value);
  else for (let value = start; value > stop; value += step) values.push(value);
  return values;
}
function flattenBuiltinArgs(args) { return args.length === 1 && Array.isArray(args[0]) ? args[0] : args; }
function assertSafeProperty(value) {
  const name = String(value);
  if (["__proto__", "prototype", "constructor"].includes(name) || name.startsWith("__")) {
    throw scriptError(`Property '${name}' is unavailable in the sandbox`);
  }
}
function tick(budget, line) {
  budget.remaining -= 1;
  if (budget.remaining < 0) throw scriptError("Execution limit exceeded", line);
}
function scriptError(message, line) {
  return new Error(line ? `${message} on line ${line}` : message);
}
