import {
  executePythonPageScript,
  isPythonPageScript,
  pythonPageExecutionState,
  validatePythonPageScript
} from "./python-page-script.js?v=20260802-90";

const FORMULA_VARIABLES = new Set([
  "variation",
  "control",
  "point",
  "ordinal",
  "code",
  "courseControl",
  "index",
  "team",
  "leg"
]);

const compiledFormulaCache = new Map();
const compiledRuleCache = new Map();

export function courseControlMapChangeKind(courseControl) {
  if (courseControl?.mapFlip) return "flip";
  if (courseControl?.mapExchange) return "exchange";
  return "";
}

export function setCourseControlMapChange(courseControl, kind) {
  if (!courseControl) return "";
  const normalized = kind === "flip" ? "flip" : kind === "exchange" ? "exchange" : "";
  courseControl.mapExchange = normalized !== "";
  courseControl.mapFlip = normalized === "flip";
  return normalized;
}

/**
 * Compile the deliberately small page-break expression language.
 *
 * Supported variables:
 *   variation, control/point, ordinal, code, courseControl, index, team, leg
 * Supported operators:
 *   ==, =, !=, <>, <, <=, >, >=, &&/and, ||/or, !/not, parentheses
 * A semicolon or newline separates rules. Prefix a rule with `exchange:` or
 * `flip:` to choose the action; unprefixed rules remain flips for backwards
 * compatibility. If both kinds match one point, flip wins.
 * No JavaScript evaluation is used here: project files can therefore contain
 * formulas without becoming an executable-code surface.
 */
export function compilePageBreakFormula(source) {
  const formula = String(source || "").trim();
  if (!formula) return () => false;
  if (compiledFormulaCache.has(formula)) return compiledFormulaCache.get(formula);

  const resolveKind = compilePageBreakRules(formula);
  const predicate = context => !!resolveKind(context);
  compiledFormulaCache.set(formula, predicate);
  return predicate;
}

export function compilePageBreakRules(source) {
  const formula = String(source || "").trim();
  if (!formula) return () => "";
  if (compiledRuleCache.has(formula)) return compiledRuleCache.get(formula);

  const parser = new FormulaParser(tokenizeFormula(formula));
  const rules = parser.parseRules();
  const resolver = context => {
    let exchange = false;
    for (const rule of rules) {
      if (!truthy(evaluateFormulaNode(rule.expression, context || {}))) continue;
      if (rule.kind === "flip") return "flip";
      exchange = true;
    }
    return exchange ? "exchange" : "";
  };
  compiledRuleCache.set(formula, resolver);
  return resolver;
}

export function validatePageBreakFormula(source) {
  if (isPythonPageScript(source)) return validatePythonPageScript(source);
  try {
    compilePageBreakRules(source);
    return "";
  }
  catch (error) {
    return error?.message || String(error);
  }
}

/** Remap numeric courseControl operands when a course graph is duplicated. */
export function remapPageBreakFormulaCourseControls(source, idMap) {
  const formula = String(source || "");
  if (!formula.trim() || !idMap?.get) return formula;
  if (isPythonPageScript(formula)) return formula;
  let tokens;
  try {
    tokens = tokenizeFormula(formula);
    new FormulaParser(tokens).parseRules();
  }
  catch {
    // Keep invalid user input byte-for-byte; the editor will continue to show
    // its validation error instead of making a surprising partial rewrite.
    return formula;
  }
  const replacements = new Map();
  const comparisonOperators = new Set(["=", "==", "!=", "<>", "<", "<=", ">", ">="]);
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index]?.type !== "identifier" || tokens[index].value !== "courseControl") continue;
    const rightOperator = tokens[index + 1];
    if (rightOperator?.type === "operator" && comparisonOperators.has(rightOperator.value)) {
      addCourseControlReplacement(replacements, parenthesizedLiteralAfter(tokens, index + 2), idMap);
    }
    const leftOperator = tokens[index - 1];
    if (leftOperator?.type === "operator" && comparisonOperators.has(leftOperator.value)) {
      addCourseControlReplacement(replacements, parenthesizedLiteralBefore(tokens, index - 2), idMap);
    }
  }
  return [...replacements.values()]
    .sort((a, b) => b.start - a.start)
    .reduce((text, replacement) => `${text.slice(0, replacement.start)}${replacement.value}${text.slice(replacement.end)}`, formula);
}

/**
 * Calculate page boundaries for one concrete course path. Each exchange/flip
 * point is intentionally included in both adjacent pages, matching Purple
 * Pen's CourseDesignator part semantics.
 */
export function coursePageLayout(rows, course, options = {}) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const formula = String(course?.pageBreakFormula || "").trim();
  const pythonScript = isPythonPageScript(formula);
  let formulaResolver = () => "";
  let formulaError = "";
  let scriptFlips = [];
  let scriptExchanges = [];
  let scriptPending = false;
  if (pythonScript) {
    try {
      const scriptCourse = buildPythonPageCourse(sourceRows, course, options);
      const execution = pythonPageExecutionState(formula, scriptCourse);
      if (execution.status === "error") throw new Error(execution.error);
      if (execution.status !== "ready") scriptPending = true;
      const result = execution.status === "ready" ? execution.result : [[], []];
      if (!Array.isArray(result) || result.length !== 2 || !Array.isArray(result[0]) || !Array.isArray(result[1])) {
        throw new Error("advanced_flip_exchange(course) must return (flip_list, exchange_list)");
      }
      [scriptFlips, scriptExchanges] = result;
      if (!scriptPending && (scriptFlips.length !== scriptCourse.length || scriptExchanges.length !== scriptCourse.length)) {
        throw new Error(`Returned lists must each contain ${scriptCourse.length} item(s)`);
      }
      const conflict = scriptFlips.findIndex((value, index) => !!value && !!scriptExchanges[index]);
      if (conflict >= 0) throw new Error(`Point ${conflict + 1} cannot be both a map flip and a map exchange`);
    }
    catch (error) {
      formulaError = error?.message || String(error);
    }
  }
  else if (formula) {
    try {
      formulaResolver = compilePageBreakRules(formula);
    }
    catch (error) {
      formulaError = error?.message || String(error);
    }
  }

  const variation = String(options.variationCode || options.pageContext?.variation || "");
  const team = finiteOrZero(options.relayTeam ?? options.pageContext?.team);
  const leg = finiteOrZero(options.relayLeg ?? options.pageContext?.leg);
  const breakIndexes = [];
  const breakKinds = new Map();
  let normalControlIndex = 0;

  for (let index = 0; index < sourceRows.length; index += 1) {
    const row = sourceRows[index];
    const normal = row?.control?.kind === "normal";
    if (normal) normalControlIndex += 1;

    const courseControl = row?.courseControl;
    const explicitKind = courseControlMapChangeKind(courseControl);
    const scriptIndex = normalControlIndex - 1;
    const formulaKind = normal && !formulaError && pythonScript
      ? (scriptFlips[scriptIndex] ? "flip" : scriptExchanges[scriptIndex] ? "exchange" : "")
      : normal && !formulaError ? formulaResolver({
      variation,
      control: normalControlIndex,
      point: normalControlIndex,
      ordinal: finiteOrZero(row?.ordinal),
      code: String(row?.control?.code || ""),
      courseControl: finiteOrZero(courseControl?.id),
      index: index + 1,
      team,
      leg
      }) : "";

    // A terminal exchange has no following map part. Ignore it for paging so
    // an accidental flag cannot create a blank trailing page.
    if ((explicitKind || formulaKind) && index < sourceRows.length - 1) {
      breakIndexes.push(index);
      breakKinds.set(
        index,
        explicitKind === "flip" || formulaKind === "flip" ? "flip" : (explicitKind || formulaKind)
      );
    }
  }

  const uniqueBreakIndexes = [...new Set(breakIndexes)].sort((a, b) => a - b);
  const pages = [];
  let start = 0;
  for (const end of uniqueBreakIndexes) {
    pages.push({ start, end });
    start = end;
  }
  pages.push({ start, end: Math.max(start, sourceRows.length - 1) });

  return {
    rows: sourceRows,
    breakIndexes: uniqueBreakIndexes,
    breakKinds,
    pages,
    pageCount: Math.max(1, pages.length),
    formulaError,
    formulaPending: scriptPending
  };
}

export async function preparePythonPageLayout(rows, course, options = {}) {
  const source = String(course?.pageBreakFormula || "").trim();
  if (!isPythonPageScript(source)) return coursePageLayout(rows, course, options);
  const scriptCourse = buildPythonPageCourse(rows, course, options);
  await executePythonPageScript(source, scriptCourse);
  return coursePageLayout(rows, course, options);
}

export function buildPythonPageCourse(rows, course, options = {}) {
  const normalRows = (Array.isArray(rows) ? rows : []).filter(row => row?.control?.kind === "normal");
  const branchName = String(options.variationCode || options.pageContext?.variation || "");
  const team = finiteOrZero(options.relayTeam ?? options.pageContext?.team);
  const leg = finiteOrZero(options.relayLeg ?? options.pageContext?.leg);
  return {
    length: normalRows.length,
    control_number: normalRows.map(row => String(row.control?.code || "")),
    point_branch: normalRows.map(row => String(row?.pointBranch || "")),
    point_allowed_legs: normalRows.map(row => Array.isArray(row?.pointAllowedLegs)
      ? row.pointAllowedLegs.map(value => Math.max(1, Math.round(Number(value) || 1)))
      : []),
    allowed_legs: Array.isArray(normalRows[0]?.routeAllowedLegs)
      ? normalRows[0].routeAllowedLegs.map(value => Math.max(1, Math.round(Number(value) || 1)))
      : [],
    point: normalRows.map((_row, index) => index + 1),
    ordinal: normalRows.map(row => finiteOrZero(row?.ordinal)),
    course_control: normalRows.map(row => finiteOrZero(row?.courseControl?.id)),
    control_id: normalRows.map(row => finiteOrZero(row?.control?.id)),
    branch_name: branchName,
    variation: branchName,
    course_name: String(course?.name || ""),
    course_id: finiteOrZero(course?.id),
    team,
    leg
  };
}

export function rowsForCoursePage(rows, course, options = {}) {
  const layout = coursePageLayout(rows, course, options);
  const requestedPage = normalizeRequestedPage(options.page);
  const globalView = requestedPage === null;
  const selectedPage = globalView ? null : clamp(requestedPage, 1, layout.pageCount);
  const pageBounds = selectedPage ? layout.pages[selectedPage - 1] : null;
  const start = pageBounds?.start ?? 0;
  const end = pageBounds?.end ?? Math.max(0, layout.rows.length - 1);
  const breakSet = new Set(layout.breakIndexes);
  const visibleRows = globalView ? layout.rows : layout.rows.slice(start, end + 1);

  return visibleRows.map((row, localIndex) => {
    const sourceIndex = globalView ? localIndex : start + localIndex;
    const pageBreakAfter = breakSet.has(sourceIndex);
    const startsAtExchange = globalView
      ? pageBreakAfter
      : selectedPage > 1 && sourceIndex === start && breakSet.has(start);
    const endsAtExchange = !globalView
      && selectedPage < layout.pageCount
      && sourceIndex === end
      && breakSet.has(end);
    return {
      ...row,
      pageBreakAfter,
      pageBreakKind: pageBreakAfter ? layout.breakKinds.get(sourceIndex) || "exchange" : "",
      exchangeStart: startsAtExchange,
      pageBreakDirective: pageBreakAfter && (globalView || endsAtExchange),
      pageStartsAtExchange: startsAtExchange,
      pageEndsAtExchange: endsAtExchange,
      suppressControlSymbol: endsAtExchange && row.control?.kind === "map-exchange",
      coursePage: selectedPage,
      coursePageCount: layout.pageCount,
      pageFormulaError: layout.formulaError,
      pageFormulaPending: layout.formulaPending === true
    };
  });
}

function normalizeRequestedPage(value) {
  if (value === undefined || value === null || value === "" || value === "global" || value === "all") {
    return null;
  }
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function tokenizeFormula(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === " " || char === "\t" || char === "\r") {
      index += 1;
      continue;
    }
    if (char === "\n" || char === ";") {
      tokens.push({ type: "separator", value: char, index });
      index += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ type: "left", value: char, index: index++ });
      continue;
    }
    if (char === ")") {
      tokens.push({ type: "right", value: char, index: index++ });
      continue;
    }
    if (char === ":") {
      tokens.push({ type: "colon", value: char, index: index++ });
      continue;
    }

    const pair = source.slice(index, index + 2);
    if (["==", "!=", "<=", ">=", "&&", "||", "<>"].includes(pair)) {
      tokens.push({ type: "operator", value: pair, index });
      index += 2;
      continue;
    }
    if (["=", "<", ">", "!"].includes(char)) {
      tokens.push({ type: "operator", value: char, index: index++ });
      continue;
    }
    if (char === "\"" || char === "'") {
      const quote = char;
      const start = index;
      index += 1;
      let value = "";
      let closed = false;
      while (index < source.length) {
        const next = source[index++];
        if (next === quote) {
          closed = true;
          break;
        }
        if (next === "\\") {
          if (index >= source.length) break;
          const escaped = source[index++];
          value += ({ n: "\n", r: "\r", t: "\t" })[escaped] ?? escaped;
        }
        else {
          value += next;
        }
      }
      if (!closed) throw formulaSyntaxError("Unterminated string", start);
      tokens.push({ type: "literal", value, index: start });
      continue;
    }
    if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(source[index + 1] || ""))) {
      const start = index;
      const match = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      index += match[0].length;
      tokens.push({ type: "literal", value: Number(match[0]), index: start, end: index });
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const start = index;
      const match = source.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      const value = match[0];
      index += value.length;
      const keyword = value.toLowerCase();
      if (["and", "or", "not"].includes(keyword)) {
        tokens.push({ type: "operator", value: keyword, index: start });
      }
      else if (keyword === "true" || keyword === "false") {
        tokens.push({ type: "literal", value: keyword === "true", index: start });
      }
      else {
        tokens.push({ type: "identifier", value, index: start });
      }
      continue;
    }
    throw formulaSyntaxError(`Unexpected character '${char}'`, index);
  }
  tokens.push({ type: "end", value: "", index: source.length });
  return tokens;
}

class FormulaParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  parseRules() {
    const rules = [];
    this.skipSeparators();
    while (!this.is("end")) {
      let kind = "flip";
      if (this.is("identifier") && this.tokens[this.position + 1]?.type === "colon") {
        const prefix = String(this.current().value || "").toLowerCase();
        if (prefix !== "exchange" && prefix !== "flip") {
          throw formulaSyntaxError(`Unknown page action '${this.current().value}'`, this.current().index);
        }
        kind = prefix;
        this.position += 2;
      }
      rules.push({ kind, expression: this.parseOr() });
      if (!this.is("separator") && !this.is("end")) {
        throw formulaSyntaxError(`Unexpected token '${this.current().value}'`, this.current().index);
      }
      this.skipSeparators();
    }
    if (!rules.length) throw formulaSyntaxError("Formula is empty", 0);
    return rules;
  }

  parseOr() {
    let node = this.parseAnd();
    while (this.operator("||", "or")) {
      const operator = this.take().value;
      node = { type: "binary", operator, left: node, right: this.parseAnd() };
    }
    return node;
  }

  parseAnd() {
    let node = this.parseUnary();
    while (this.operator("&&", "and")) {
      const operator = this.take().value;
      node = { type: "binary", operator, left: node, right: this.parseUnary() };
    }
    return node;
  }

  parseUnary() {
    if (this.operator("!", "not")) {
      return { type: "unary", operator: this.take().value, value: this.parseUnary() };
    }
    return this.parseComparison();
  }

  parseComparison() {
    let node = this.parsePrimary();
    if (this.operator("=", "==", "!=", "<>", "<", "<=", ">", ">=")) {
      const operator = this.take().value;
      node = { type: "binary", operator, left: node, right: this.parsePrimary() };
    }
    return node;
  }

  parsePrimary() {
    const token = this.current();
    if (token.type === "literal") {
      this.position += 1;
      return { type: "literal", value: token.value };
    }
    if (token.type === "identifier") {
      this.position += 1;
      if (!FORMULA_VARIABLES.has(token.value)) {
        throw formulaSyntaxError(`Unknown variable '${token.value}'`, token.index);
      }
      return { type: "variable", name: token.value };
    }
    if (token.type === "left") {
      this.position += 1;
      const node = this.parseOr();
      if (!this.is("right")) throw formulaSyntaxError("Missing ')'", this.current().index);
      this.position += 1;
      return node;
    }
    throw formulaSyntaxError(`Expected a value, found '${token.value || "end of formula"}'`, token.index);
  }

  skipSeparators() {
    while (this.is("separator")) this.position += 1;
  }

  operator(...values) {
    return this.current().type === "operator" && values.includes(this.current().value);
  }

  is(type) {
    return this.current().type === type;
  }

  current() {
    return this.tokens[this.position] || this.tokens[this.tokens.length - 1];
  }

  take() {
    return this.tokens[this.position++];
  }
}

function evaluateFormulaNode(node, context) {
  if (node.type === "literal") return node.value;
  if (node.type === "variable") return context[node.name];
  if (node.type === "unary") return !truthy(evaluateFormulaNode(node.value, context));
  const left = evaluateFormulaNode(node.left, context);
  if (node.operator === "&&" || node.operator === "and") {
    return truthy(left) && truthy(evaluateFormulaNode(node.right, context));
  }
  if (node.operator === "||" || node.operator === "or") {
    return truthy(left) || truthy(evaluateFormulaNode(node.right, context));
  }
  const right = evaluateFormulaNode(node.right, context);
  switch (node.operator) {
    case "=":
    case "==": return comparableEqual(left, right);
    case "!=":
    case "<>": return !comparableEqual(left, right);
    case "<": return compareValues(left, right) < 0;
    case "<=": return compareValues(left, right) <= 0;
    case ">": return compareValues(left, right) > 0;
    case ">=": return compareValues(left, right) >= 0;
    default: return false;
  }
}

function comparableEqual(left, right) {
  if (typeof left === "number" && typeof right === "number") return left === right;
  if (typeof left === "boolean" || typeof right === "boolean") return truthy(left) === truthy(right);
  return String(left ?? "") === String(right ?? "");
}

function compareValues(left, right) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function truthy(value) {
  return !!value;
}

function finiteOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formulaSyntaxError(message, index) {
  return new Error(`${message} at column ${Math.max(1, Number(index) + 1)}`);
}

function addCourseControlReplacement(replacements, token, idMap) {
  if (token?.type !== "literal" || !Number.isInteger(token.value) || !Number.isFinite(token.end)) return;
  const mapped = idMap.get(Number(token.value));
  const mappedId = Number(mapped?.id ?? mapped);
  if (!Number.isInteger(mappedId) || mappedId <= 0) return;
  replacements.set(token.index, { start: token.index, end: token.end, value: String(mappedId) });
}

function parenthesizedLiteralAfter(tokens, start) {
  let index = start;
  let depth = 0;
  while (tokens[index]?.type === "left") {
    depth += 1;
    index += 1;
  }
  const literal = tokens[index];
  if (literal?.type !== "literal") return null;
  index += 1;
  while (depth > 0 && tokens[index]?.type === "right") {
    depth -= 1;
    index += 1;
  }
  return depth === 0 ? literal : null;
}

function parenthesizedLiteralBefore(tokens, start) {
  let index = start;
  let depth = 0;
  while (tokens[index]?.type === "right") {
    depth += 1;
    index -= 1;
  }
  const literal = tokens[index];
  if (literal?.type !== "literal") return null;
  index -= 1;
  while (depth > 0 && tokens[index]?.type === "left") {
    depth -= 1;
    index -= 1;
  }
  return depth === 0 ? literal : null;
}
