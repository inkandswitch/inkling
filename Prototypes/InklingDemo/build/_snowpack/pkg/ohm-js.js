function abstract(optMethodName) {
  const methodName = optMethodName || "";
  return function() {
    throw new Error("this method " + methodName + " is abstract! (it has no implementation in class " + this.constructor.name + ")");
  };
}
function assert(cond, message) {
  if (!cond) {
    throw new Error(message || "Assertion failed");
  }
}
function defineLazyProperty(obj, propName, getterFn) {
  let memo;
  Object.defineProperty(obj, propName, {
    get() {
      if (!memo) {
        memo = getterFn.call(this);
      }
      return memo;
    }
  });
}
function clone(obj) {
  if (obj) {
    return Object.assign({}, obj);
  }
  return obj;
}
function repeatFn(fn, n) {
  const arr = [];
  while (n-- > 0) {
    arr.push(fn());
  }
  return arr;
}
function repeatStr(str, n) {
  return new Array(n + 1).join(str);
}
function repeat(x, n) {
  return repeatFn(() => x, n);
}
function getDuplicates(array) {
  const duplicates = [];
  for (let idx = 0; idx < array.length; idx++) {
    const x = array[idx];
    if (array.lastIndexOf(x) !== idx && duplicates.indexOf(x) < 0) {
      duplicates.push(x);
    }
  }
  return duplicates;
}
function copyWithoutDuplicates(array) {
  const noDuplicates = [];
  array.forEach((entry) => {
    if (noDuplicates.indexOf(entry) < 0) {
      noDuplicates.push(entry);
    }
  });
  return noDuplicates;
}
function isSyntactic(ruleName) {
  const firstChar = ruleName[0];
  return firstChar === firstChar.toUpperCase();
}
function isLexical(ruleName) {
  return !isSyntactic(ruleName);
}
function padLeft(str, len, optChar) {
  const ch = optChar || " ";
  if (str.length < len) {
    return repeatStr(ch, len - str.length) + str;
  }
  return str;
}
function StringBuffer() {
  this.strings = [];
}
StringBuffer.prototype.append = function(str) {
  this.strings.push(str);
};
StringBuffer.prototype.contents = function() {
  return this.strings.join("");
};
const escapeUnicode = (str) => String.fromCodePoint(parseInt(str, 16));
function unescapeCodePoint(s) {
  if (s.charAt(0) === "\\") {
    switch (s.charAt(1)) {
      case "b":
        return "\b";
      case "f":
        return "\f";
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "	";
      case "v":
        return "\v";
      case "x":
        return escapeUnicode(s.slice(2, 4));
      case "u":
        return s.charAt(2) === "{" ? escapeUnicode(s.slice(3, -1)) : escapeUnicode(s.slice(2, 6));
      default:
        return s.charAt(1);
    }
  } else {
    return s;
  }
}
function unexpectedObjToString(obj) {
  if (obj == null) {
    return String(obj);
  }
  const baseToString = Object.prototype.toString.call(obj);
  try {
    let typeName;
    if (obj.constructor && obj.constructor.name) {
      typeName = obj.constructor.name;
    } else if (baseToString.indexOf("[object ") === 0) {
      typeName = baseToString.slice(8, -1);
    } else {
      typeName = typeof obj;
    }
    return typeName + ": " + JSON.stringify(String(obj));
  } catch (e) {
    return baseToString;
  }
}
var common = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  abstract,
  assert,
  defineLazyProperty,
  clone,
  repeatFn,
  repeatStr,
  repeat,
  getDuplicates,
  copyWithoutDuplicates,
  isSyntactic,
  isLexical,
  padLeft,
  StringBuffer,
  unescapeCodePoint,
  unexpectedObjToString
});
const UnicodeCategories = {
  Lu: /\p{Lu}/u,
  Ll: /\p{Ll}/u,
  Lt: /\p{Lt}/u,
  Lm: /\p{Lm}/u,
  Lo: /\p{Lo}/u,
  Nl: /\p{Nl}/u,
  Nd: /\p{Nd}/u,
  Mn: /\p{Mn}/u,
  Mc: /\p{Mc}/u,
  Pc: /\p{Pc}/u,
  Zs: /\p{Zs}/u,
  L: /\p{Letter}/u,
  Ltmo: /\p{Lt}|\p{Lm}|\p{Lo}/u
};
class PExpr {
  constructor() {
    if (this.constructor === PExpr) {
      throw new Error("PExpr cannot be instantiated -- it's abstract");
    }
  }
  withSource(interval) {
    if (interval) {
      this.source = interval.trimmed();
    }
    return this;
  }
}
const any = Object.create(PExpr.prototype);
const end = Object.create(PExpr.prototype);
class Terminal extends PExpr {
  constructor(obj) {
    super();
    this.obj = obj;
  }
}
class Range extends PExpr {
  constructor(from, to) {
    super();
    this.from = from;
    this.to = to;
    this.matchCodePoint = from.length > 1 || to.length > 1;
  }
}
class Param extends PExpr {
  constructor(index) {
    super();
    this.index = index;
  }
}
class Alt extends PExpr {
  constructor(terms) {
    super();
    this.terms = terms;
  }
}
class Extend extends Alt {
  constructor(superGrammar, name, body) {
    const origBody = superGrammar.rules[name].body;
    super([body, origBody]);
    this.superGrammar = superGrammar;
    this.name = name;
    this.body = body;
  }
}
class Splice extends Alt {
  constructor(superGrammar, ruleName, beforeTerms, afterTerms) {
    const origBody = superGrammar.rules[ruleName].body;
    super([...beforeTerms, origBody, ...afterTerms]);
    this.superGrammar = superGrammar;
    this.ruleName = ruleName;
    this.expansionPos = beforeTerms.length;
  }
}
class Seq extends PExpr {
  constructor(factors) {
    super();
    this.factors = factors;
  }
}
class Iter extends PExpr {
  constructor(expr) {
    super();
    this.expr = expr;
  }
}
class Star extends Iter {
}
class Plus extends Iter {
}
class Opt extends Iter {
}
Star.prototype.operator = "*";
Plus.prototype.operator = "+";
Opt.prototype.operator = "?";
Star.prototype.minNumMatches = 0;
Plus.prototype.minNumMatches = 1;
Opt.prototype.minNumMatches = 0;
Star.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
Plus.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
Opt.prototype.maxNumMatches = 1;
class Not extends PExpr {
  constructor(expr) {
    super();
    this.expr = expr;
  }
}
class Lookahead extends PExpr {
  constructor(expr) {
    super();
    this.expr = expr;
  }
}
class Lex extends PExpr {
  constructor(expr) {
    super();
    this.expr = expr;
  }
}
class Apply extends PExpr {
  constructor(ruleName, args = []) {
    super();
    this.ruleName = ruleName;
    this.args = args;
  }
  isSyntactic() {
    return isSyntactic(this.ruleName);
  }
  toMemoKey() {
    if (!this._memoKey) {
      Object.defineProperty(this, "_memoKey", {value: this.toString()});
    }
    return this._memoKey;
  }
}
class UnicodeChar extends PExpr {
  constructor(category) {
    super();
    this.category = category;
    this.pattern = UnicodeCategories[category];
  }
}
function createError(message, optInterval) {
  let e;
  if (optInterval) {
    e = new Error(optInterval.getLineAndColumnMessage() + message);
    e.shortMessage = message;
    e.interval = optInterval;
  } else {
    e = new Error(message);
  }
  return e;
}
function intervalSourcesDontMatch() {
  return createError("Interval sources don't match");
}
function grammarSyntaxError(matchFailure) {
  const e = new Error();
  Object.defineProperty(e, "message", {
    enumerable: true,
    get() {
      return matchFailure.message;
    }
  });
  Object.defineProperty(e, "shortMessage", {
    enumerable: true,
    get() {
      return "Expected " + matchFailure.getExpectedText();
    }
  });
  e.interval = matchFailure.getInterval();
  return e;
}
function undeclaredGrammar(grammarName, namespace, interval) {
  const message = namespace ? `Grammar ${grammarName} is not declared in namespace '${namespace}'` : "Undeclared grammar " + grammarName;
  return createError(message, interval);
}
function duplicateGrammarDeclaration(grammar2, namespace) {
  return createError("Grammar " + grammar2.name + " is already declared in this namespace");
}
function grammarDoesNotSupportIncrementalParsing(grammar2) {
  return createError(`Grammar '${grammar2.name}' does not support incremental parsing`);
}
function undeclaredRule(ruleName, grammarName, optInterval) {
  return createError("Rule " + ruleName + " is not declared in grammar " + grammarName, optInterval);
}
function cannotOverrideUndeclaredRule(ruleName, grammarName, optSource) {
  return createError("Cannot override rule " + ruleName + " because it is not declared in " + grammarName, optSource);
}
function cannotExtendUndeclaredRule(ruleName, grammarName, optSource) {
  return createError("Cannot extend rule " + ruleName + " because it is not declared in " + grammarName, optSource);
}
function duplicateRuleDeclaration(ruleName, grammarName, declGrammarName, optSource) {
  let message = "Duplicate declaration for rule '" + ruleName + "' in grammar '" + grammarName + "'";
  if (grammarName !== declGrammarName) {
    message += " (originally declared in '" + declGrammarName + "')";
  }
  return createError(message, optSource);
}
function wrongNumberOfParameters(ruleName, expected, actual, source) {
  return createError("Wrong number of parameters for rule " + ruleName + " (expected " + expected + ", got " + actual + ")", source);
}
function wrongNumberOfArguments(ruleName, expected, actual, expr) {
  return createError("Wrong number of arguments for rule " + ruleName + " (expected " + expected + ", got " + actual + ")", expr);
}
function duplicateParameterNames(ruleName, duplicates, source) {
  return createError("Duplicate parameter names in rule " + ruleName + ": " + duplicates.join(", "), source);
}
function invalidParameter(ruleName, expr) {
  return createError("Invalid parameter to rule " + ruleName + ": " + expr + " has arity " + expr.getArity() + ", but parameter expressions must have arity 1", expr.source);
}
const syntacticVsLexicalNote = "NOTE: A _syntactic rule_ is a rule whose name begins with a capital letter. See https://ohmjs.org/d/svl for more details.";
function applicationOfSyntacticRuleFromLexicalContext(ruleName, applyExpr) {
  return createError("Cannot apply syntactic rule " + ruleName + " from here (inside a lexical context)", applyExpr.source);
}
function applySyntacticWithLexicalRuleApplication(applyExpr) {
  const {ruleName} = applyExpr;
  return createError(`applySyntactic is for syntactic rules, but '${ruleName}' is a lexical rule. ` + syntacticVsLexicalNote, applyExpr.source);
}
function unnecessaryExperimentalApplySyntactic(applyExpr) {
  return createError("applySyntactic is not required here (in a syntactic context)", applyExpr.source);
}
function incorrectArgumentType(expectedType, expr) {
  return createError("Incorrect argument type: expected " + expectedType, expr.source);
}
function multipleSuperSplices(expr) {
  return createError("'...' can appear at most once in a rule body", expr.source);
}
function invalidCodePoint(applyWrapper) {
  const node = applyWrapper._node;
  assert(node && node.isNonterminal() && node.ctorName === "escapeChar_unicodeCodePoint");
  const digitIntervals = applyWrapper.children.slice(1, -1).map((d) => d.source);
  const fullInterval = digitIntervals[0].coverageWith(...digitIntervals.slice(1));
  return createError(`U+${fullInterval.contents} is not a valid Unicode code point`, fullInterval);
}
function kleeneExprHasNullableOperand(kleeneExpr, applicationStack) {
  const actuals = applicationStack.length > 0 ? applicationStack[applicationStack.length - 1].args : [];
  const expr = kleeneExpr.expr.substituteParams(actuals);
  let message = "Nullable expression " + expr + " is not allowed inside '" + kleeneExpr.operator + "' (possible infinite loop)";
  if (applicationStack.length > 0) {
    const stackTrace = applicationStack.map((app) => new Apply(app.ruleName, app.args)).join("\n");
    message += "\nApplication stack (most recent application last):\n" + stackTrace;
  }
  return createError(message, kleeneExpr.expr.source);
}
function inconsistentArity(ruleName, expected, actual, expr) {
  return createError("Rule " + ruleName + " involves an alternation which has inconsistent arity (expected " + expected + ", got " + actual + ")", expr.source);
}
function multipleErrors(errors) {
  const messages = errors.map((e) => e.message);
  return createError(["Errors:"].concat(messages).join("\n- "), errors[0].interval);
}
function missingSemanticAction(ctorName, name, type, stack) {
  let stackTrace = stack.slice(0, -1).map((info) => {
    const ans = "  " + info[0].name + " > " + info[1];
    return info.length === 3 ? ans + " for '" + info[2] + "'" : ans;
  }).join("\n");
  stackTrace += "\n  " + name + " > " + ctorName;
  let moreInfo = "";
  if (ctorName === "_iter") {
    moreInfo = [
      "\nNOTE: as of Ohm v16, there is no default action for iteration nodes \u2014 see ",
      "  https://ohmjs.org/d/dsa for details."
    ].join("\n");
  }
  const message = [
    `Missing semantic action for '${ctorName}' in ${type} '${name}'.${moreInfo}`,
    "Action stack (most recent call last):",
    stackTrace
  ].join("\n");
  const e = createError(message);
  e.name = "missingSemanticAction";
  return e;
}
function throwErrors(errors) {
  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw multipleErrors(errors);
  }
}
function padNumbersToEqualLength(arr) {
  let maxLen = 0;
  const strings = arr.map((n) => {
    const str = n.toString();
    maxLen = Math.max(maxLen, str.length);
    return str;
  });
  return strings.map((s) => padLeft(s, maxLen));
}
function strcpy(dest, src, offset) {
  const origDestLen = dest.length;
  const start = dest.slice(0, offset);
  const end2 = dest.slice(offset + src.length);
  return (start + src + end2).substr(0, origDestLen);
}
function lineAndColumnToMessage(...ranges) {
  const lineAndCol = this;
  const {offset} = lineAndCol;
  const {repeatStr: repeatStr2} = common;
  const sb = new StringBuffer();
  sb.append("Line " + lineAndCol.lineNum + ", col " + lineAndCol.colNum + ":\n");
  const lineNumbers = padNumbersToEqualLength([
    lineAndCol.prevLine == null ? 0 : lineAndCol.lineNum - 1,
    lineAndCol.lineNum,
    lineAndCol.nextLine == null ? 0 : lineAndCol.lineNum + 1
  ]);
  const appendLine = (num, content, prefix) => {
    sb.append(prefix + lineNumbers[num] + " | " + content + "\n");
  };
  if (lineAndCol.prevLine != null) {
    appendLine(0, lineAndCol.prevLine, "  ");
  }
  appendLine(1, lineAndCol.line, "> ");
  const lineLen = lineAndCol.line.length;
  let indicationLine = repeatStr2(" ", lineLen + 1);
  for (let i = 0; i < ranges.length; ++i) {
    let startIdx = ranges[i][0];
    let endIdx = ranges[i][1];
    assert(startIdx >= 0 && startIdx <= endIdx, "range start must be >= 0 and <= end");
    const lineStartOffset = offset - lineAndCol.colNum + 1;
    startIdx = Math.max(0, startIdx - lineStartOffset);
    endIdx = Math.min(endIdx - lineStartOffset, lineLen);
    indicationLine = strcpy(indicationLine, repeatStr2("~", endIdx - startIdx), startIdx);
  }
  const gutterWidth = 2 + lineNumbers[1].length + 3;
  sb.append(repeatStr2(" ", gutterWidth));
  indicationLine = strcpy(indicationLine, "^", lineAndCol.colNum - 1);
  sb.append(indicationLine.replace(/ +$/, "") + "\n");
  if (lineAndCol.nextLine != null) {
    appendLine(2, lineAndCol.nextLine, "  ");
  }
  return sb.contents();
}
let builtInRulesCallbacks = [];
function awaitBuiltInRules(cb) {
  builtInRulesCallbacks.push(cb);
}
function announceBuiltInRules(grammar2) {
  builtInRulesCallbacks.forEach((cb) => {
    cb(grammar2);
  });
  builtInRulesCallbacks = null;
}
function getLineAndColumn(str, offset) {
  let lineNum = 1;
  let colNum = 1;
  let currOffset = 0;
  let lineStartOffset = 0;
  let nextLine = null;
  let prevLine = null;
  let prevLineStartOffset = -1;
  while (currOffset < offset) {
    const c = str.charAt(currOffset++);
    if (c === "\n") {
      lineNum++;
      colNum = 1;
      prevLineStartOffset = lineStartOffset;
      lineStartOffset = currOffset;
    } else if (c !== "\r") {
      colNum++;
    }
  }
  let lineEndOffset = str.indexOf("\n", lineStartOffset);
  if (lineEndOffset === -1) {
    lineEndOffset = str.length;
  } else {
    const nextLineEndOffset = str.indexOf("\n", lineEndOffset + 1);
    nextLine = nextLineEndOffset === -1 ? str.slice(lineEndOffset) : str.slice(lineEndOffset, nextLineEndOffset);
    nextLine = nextLine.replace(/^\r?\n/, "").replace(/\r$/, "");
  }
  if (prevLineStartOffset >= 0) {
    prevLine = str.slice(prevLineStartOffset, lineStartOffset).replace(/\r?\n$/, "");
  }
  const line = str.slice(lineStartOffset, lineEndOffset).replace(/\r$/, "");
  return {
    offset,
    lineNum,
    colNum,
    line,
    prevLine,
    nextLine,
    toString: lineAndColumnToMessage
  };
}
function getLineAndColumnMessage(str, offset, ...ranges) {
  return getLineAndColumn(str, offset).toString(...ranges);
}
const uniqueId = (() => {
  let idCounter = 0;
  return (prefix) => "" + prefix + idCounter++;
})();
class Interval {
  constructor(sourceString, startIdx, endIdx) {
    this.sourceString = sourceString;
    this.startIdx = startIdx;
    this.endIdx = endIdx;
  }
  get contents() {
    if (this._contents === void 0) {
      this._contents = this.sourceString.slice(this.startIdx, this.endIdx);
    }
    return this._contents;
  }
  get length() {
    return this.endIdx - this.startIdx;
  }
  coverageWith(...intervals) {
    return Interval.coverage(...intervals, this);
  }
  collapsedLeft() {
    return new Interval(this.sourceString, this.startIdx, this.startIdx);
  }
  collapsedRight() {
    return new Interval(this.sourceString, this.endIdx, this.endIdx);
  }
  getLineAndColumn() {
    return getLineAndColumn(this.sourceString, this.startIdx);
  }
  getLineAndColumnMessage() {
    const range = [this.startIdx, this.endIdx];
    return getLineAndColumnMessage(this.sourceString, this.startIdx, range);
  }
  minus(that) {
    if (this.sourceString !== that.sourceString) {
      throw intervalSourcesDontMatch();
    } else if (this.startIdx === that.startIdx && this.endIdx === that.endIdx) {
      return [];
    } else if (this.startIdx < that.startIdx && that.endIdx < this.endIdx) {
      return [
        new Interval(this.sourceString, this.startIdx, that.startIdx),
        new Interval(this.sourceString, that.endIdx, this.endIdx)
      ];
    } else if (this.startIdx < that.endIdx && that.endIdx < this.endIdx) {
      return [new Interval(this.sourceString, that.endIdx, this.endIdx)];
    } else if (this.startIdx < that.startIdx && that.startIdx < this.endIdx) {
      return [new Interval(this.sourceString, this.startIdx, that.startIdx)];
    } else {
      return [this];
    }
  }
  relativeTo(that) {
    if (this.sourceString !== that.sourceString) {
      throw intervalSourcesDontMatch();
    }
    assert(this.startIdx >= that.startIdx && this.endIdx <= that.endIdx, "other interval does not cover this one");
    return new Interval(this.sourceString, this.startIdx - that.startIdx, this.endIdx - that.startIdx);
  }
  trimmed() {
    const {contents} = this;
    const startIdx = this.startIdx + contents.match(/^\s*/)[0].length;
    const endIdx = this.endIdx - contents.match(/\s*$/)[0].length;
    return new Interval(this.sourceString, startIdx, endIdx);
  }
  subInterval(offset, len) {
    const newStartIdx = this.startIdx + offset;
    return new Interval(this.sourceString, newStartIdx, newStartIdx + len);
  }
}
Interval.coverage = function(firstInterval, ...intervals) {
  let {startIdx, endIdx} = firstInterval;
  for (const interval of intervals) {
    if (interval.sourceString !== firstInterval.sourceString) {
      throw intervalSourcesDontMatch();
    } else {
      startIdx = Math.min(startIdx, interval.startIdx);
      endIdx = Math.max(endIdx, interval.endIdx);
    }
  }
  return new Interval(firstInterval.sourceString, startIdx, endIdx);
};
const MAX_CHAR_CODE = 65535;
class InputStream {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.examinedLength = 0;
  }
  atEnd() {
    const ans = this.pos >= this.source.length;
    this.examinedLength = Math.max(this.examinedLength, this.pos + 1);
    return ans;
  }
  next() {
    const ans = this.source[this.pos++];
    this.examinedLength = Math.max(this.examinedLength, this.pos);
    return ans;
  }
  nextCharCode() {
    const nextChar = this.next();
    return nextChar && nextChar.charCodeAt(0);
  }
  nextCodePoint() {
    const cp = this.source.slice(this.pos++).codePointAt(0);
    if (cp > MAX_CHAR_CODE) {
      this.pos += 1;
    }
    this.examinedLength = Math.max(this.examinedLength, this.pos);
    return cp;
  }
  matchString(s, optIgnoreCase) {
    let idx;
    if (optIgnoreCase) {
      for (idx = 0; idx < s.length; idx++) {
        const actual = this.next();
        const expected = s[idx];
        if (actual == null || actual.toUpperCase() !== expected.toUpperCase()) {
          return false;
        }
      }
      return true;
    }
    for (idx = 0; idx < s.length; idx++) {
      if (this.next() !== s[idx]) {
        return false;
      }
    }
    return true;
  }
  sourceSlice(startIdx, endIdx) {
    return this.source.slice(startIdx, endIdx);
  }
  interval(startIdx, optEndIdx) {
    return new Interval(this.source, startIdx, optEndIdx ? optEndIdx : this.pos);
  }
}
class MatchResult {
  constructor(matcher, input, startExpr, cst, cstOffset, rightmostFailurePosition, optRecordedFailures) {
    this.matcher = matcher;
    this.input = input;
    this.startExpr = startExpr;
    this._cst = cst;
    this._cstOffset = cstOffset;
    this._rightmostFailurePosition = rightmostFailurePosition;
    this._rightmostFailures = optRecordedFailures;
    if (this.failed()) {
      defineLazyProperty(this, "message", function() {
        const detail = "Expected " + this.getExpectedText();
        return getLineAndColumnMessage(this.input, this.getRightmostFailurePosition()) + detail;
      });
      defineLazyProperty(this, "shortMessage", function() {
        const detail = "expected " + this.getExpectedText();
        const errorInfo = getLineAndColumn(this.input, this.getRightmostFailurePosition());
        return "Line " + errorInfo.lineNum + ", col " + errorInfo.colNum + ": " + detail;
      });
    }
  }
  succeeded() {
    return !!this._cst;
  }
  failed() {
    return !this.succeeded();
  }
  getRightmostFailurePosition() {
    return this._rightmostFailurePosition;
  }
  getRightmostFailures() {
    if (!this._rightmostFailures) {
      this.matcher.setInput(this.input);
      const matchResultWithFailures = this.matcher._match(this.startExpr, {
        tracing: false,
        positionToRecordFailures: this.getRightmostFailurePosition()
      });
      this._rightmostFailures = matchResultWithFailures.getRightmostFailures();
    }
    return this._rightmostFailures;
  }
  toString() {
    return this.succeeded() ? "[match succeeded]" : "[match failed at position " + this.getRightmostFailurePosition() + "]";
  }
  getExpectedText() {
    if (this.succeeded()) {
      throw new Error("cannot get expected text of a successful MatchResult");
    }
    const sb = new StringBuffer();
    let failures = this.getRightmostFailures();
    failures = failures.filter((failure) => !failure.isFluffy());
    for (let idx = 0; idx < failures.length; idx++) {
      if (idx > 0) {
        if (idx === failures.length - 1) {
          sb.append(failures.length > 2 ? ", or " : " or ");
        } else {
          sb.append(", ");
        }
      }
      sb.append(failures[idx].toString());
    }
    return sb.contents();
  }
  getInterval() {
    const pos = this.getRightmostFailurePosition();
    return new Interval(this.input, pos, pos);
  }
}
class PosInfo {
  constructor() {
    this.applicationMemoKeyStack = [];
    this.memo = {};
    this.maxExaminedLength = 0;
    this.maxRightmostFailureOffset = -1;
    this.currentLeftRecursion = void 0;
  }
  isActive(application) {
    return this.applicationMemoKeyStack.indexOf(application.toMemoKey()) >= 0;
  }
  enter(application) {
    this.applicationMemoKeyStack.push(application.toMemoKey());
  }
  exit() {
    this.applicationMemoKeyStack.pop();
  }
  startLeftRecursion(headApplication, memoRec) {
    memoRec.isLeftRecursion = true;
    memoRec.headApplication = headApplication;
    memoRec.nextLeftRecursion = this.currentLeftRecursion;
    this.currentLeftRecursion = memoRec;
    const {applicationMemoKeyStack} = this;
    const indexOfFirstInvolvedRule = applicationMemoKeyStack.indexOf(headApplication.toMemoKey()) + 1;
    const involvedApplicationMemoKeys = applicationMemoKeyStack.slice(indexOfFirstInvolvedRule);
    memoRec.isInvolved = function(applicationMemoKey) {
      return involvedApplicationMemoKeys.indexOf(applicationMemoKey) >= 0;
    };
    memoRec.updateInvolvedApplicationMemoKeys = function() {
      for (let idx = indexOfFirstInvolvedRule; idx < applicationMemoKeyStack.length; idx++) {
        const applicationMemoKey = applicationMemoKeyStack[idx];
        if (!this.isInvolved(applicationMemoKey)) {
          involvedApplicationMemoKeys.push(applicationMemoKey);
        }
      }
    };
  }
  endLeftRecursion() {
    this.currentLeftRecursion = this.currentLeftRecursion.nextLeftRecursion;
  }
  shouldUseMemoizedResult(memoRec) {
    if (!memoRec.isLeftRecursion) {
      return true;
    }
    const {applicationMemoKeyStack} = this;
    for (let idx = 0; idx < applicationMemoKeyStack.length; idx++) {
      const applicationMemoKey = applicationMemoKeyStack[idx];
      if (memoRec.isInvolved(applicationMemoKey)) {
        return false;
      }
    }
    return true;
  }
  memoize(memoKey, memoRec) {
    this.memo[memoKey] = memoRec;
    this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
    this.maxRightmostFailureOffset = Math.max(this.maxRightmostFailureOffset, memoRec.rightmostFailureOffset);
    return memoRec;
  }
  clearObsoleteEntries(pos, invalidatedIdx) {
    if (pos + this.maxExaminedLength <= invalidatedIdx) {
      return;
    }
    const {memo} = this;
    this.maxExaminedLength = 0;
    this.maxRightmostFailureOffset = -1;
    Object.keys(memo).forEach((k) => {
      const memoRec = memo[k];
      if (pos + memoRec.examinedLength > invalidatedIdx) {
        delete memo[k];
      } else {
        this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
        this.maxRightmostFailureOffset = Math.max(this.maxRightmostFailureOffset, memoRec.rightmostFailureOffset);
      }
    });
  }
}
const BALLOT_X = "\u2717";
const CHECK_MARK = "\u2713";
const DOT_OPERATOR = "\u22C5";
const RIGHTWARDS_DOUBLE_ARROW = "\u21D2";
const SYMBOL_FOR_HORIZONTAL_TABULATION = "\u2409";
const SYMBOL_FOR_LINE_FEED = "\u240A";
const SYMBOL_FOR_CARRIAGE_RETURN = "\u240D";
const Flags = {
  succeeded: 1 << 0,
  isRootNode: 1 << 1,
  isImplicitSpaces: 1 << 2,
  isMemoized: 1 << 3,
  isHeadOfLeftRecursion: 1 << 4,
  terminatesLR: 1 << 5
};
function spaces(n) {
  return repeat(" ", n).join("");
}
function getInputExcerpt(input, pos, len) {
  const excerpt = asEscapedString(input.slice(pos, pos + len));
  if (excerpt.length < len) {
    return excerpt + repeat(" ", len - excerpt.length).join("");
  }
  return excerpt;
}
function asEscapedString(obj) {
  if (typeof obj === "string") {
    return obj.replace(/ /g, DOT_OPERATOR).replace(/\t/g, SYMBOL_FOR_HORIZONTAL_TABULATION).replace(/\n/g, SYMBOL_FOR_LINE_FEED).replace(/\r/g, SYMBOL_FOR_CARRIAGE_RETURN);
  }
  return String(obj);
}
class Trace {
  constructor(input, pos1, pos2, expr, succeeded, bindings, optChildren) {
    this.input = input;
    this.pos = this.pos1 = pos1;
    this.pos2 = pos2;
    this.source = new Interval(input, pos1, pos2);
    this.expr = expr;
    this.bindings = bindings;
    this.children = optChildren || [];
    this.terminatingLREntry = null;
    this._flags = succeeded ? Flags.succeeded : 0;
  }
  get displayString() {
    return this.expr.toDisplayString();
  }
  clone() {
    return this.cloneWithExpr(this.expr);
  }
  cloneWithExpr(expr) {
    const ans = new Trace(this.input, this.pos, this.pos2, expr, this.succeeded, this.bindings, this.children);
    ans.isHeadOfLeftRecursion = this.isHeadOfLeftRecursion;
    ans.isImplicitSpaces = this.isImplicitSpaces;
    ans.isMemoized = this.isMemoized;
    ans.isRootNode = this.isRootNode;
    ans.terminatesLR = this.terminatesLR;
    ans.terminatingLREntry = this.terminatingLREntry;
    return ans;
  }
  recordLRTermination(ruleBodyTrace, value) {
    this.terminatingLREntry = new Trace(this.input, this.pos, this.pos2, this.expr, false, [value], [ruleBodyTrace]);
    this.terminatingLREntry.terminatesLR = true;
  }
  walk(visitorObjOrFn, optThisArg) {
    let visitor = visitorObjOrFn;
    if (typeof visitor === "function") {
      visitor = {enter: visitor};
    }
    function _walk(node, parent, depth) {
      let recurse = true;
      if (visitor.enter) {
        if (visitor.enter.call(optThisArg, node, parent, depth) === Trace.prototype.SKIP) {
          recurse = false;
        }
      }
      if (recurse) {
        node.children.forEach((child) => {
          _walk(child, node, depth + 1);
        });
        if (visitor.exit) {
          visitor.exit.call(optThisArg, node, parent, depth);
        }
      }
    }
    if (this.isRootNode) {
      this.children.forEach((c) => {
        _walk(c, null, 0);
      });
    } else {
      _walk(this, null, 0);
    }
  }
  toString() {
    const sb = new StringBuffer();
    this.walk((node, parent, depth) => {
      if (!node) {
        return this.SKIP;
      }
      const ctorName = node.expr.constructor.name;
      if (ctorName === "Alt") {
        return;
      }
      sb.append(getInputExcerpt(node.input, node.pos, 10) + spaces(depth * 2 + 1));
      sb.append((node.succeeded ? CHECK_MARK : BALLOT_X) + " " + node.displayString);
      if (node.isHeadOfLeftRecursion) {
        sb.append(" (LR)");
      }
      if (node.succeeded) {
        const contents = asEscapedString(node.source.contents);
        sb.append(" " + RIGHTWARDS_DOUBLE_ARROW + "  ");
        sb.append(typeof contents === "string" ? '"' + contents + '"' : contents);
      }
      sb.append("\n");
    });
    return sb.contents();
  }
}
Trace.prototype.SKIP = {};
Object.keys(Flags).forEach((name) => {
  const mask = Flags[name];
  Object.defineProperty(Trace.prototype, name, {
    get() {
      return (this._flags & mask) !== 0;
    },
    set(val) {
      if (val) {
        this._flags |= mask;
      } else {
        this._flags &= ~mask;
      }
    }
  });
});
PExpr.prototype.allowsSkippingPrecedingSpace = abstract("allowsSkippingPrecedingSpace");
any.allowsSkippingPrecedingSpace = end.allowsSkippingPrecedingSpace = Apply.prototype.allowsSkippingPrecedingSpace = Terminal.prototype.allowsSkippingPrecedingSpace = Range.prototype.allowsSkippingPrecedingSpace = UnicodeChar.prototype.allowsSkippingPrecedingSpace = function() {
  return true;
};
Alt.prototype.allowsSkippingPrecedingSpace = Iter.prototype.allowsSkippingPrecedingSpace = Lex.prototype.allowsSkippingPrecedingSpace = Lookahead.prototype.allowsSkippingPrecedingSpace = Not.prototype.allowsSkippingPrecedingSpace = Param.prototype.allowsSkippingPrecedingSpace = Seq.prototype.allowsSkippingPrecedingSpace = function() {
  return false;
};
let BuiltInRules$1;
awaitBuiltInRules((g) => {
  BuiltInRules$1 = g;
});
let lexifyCount;
PExpr.prototype.assertAllApplicationsAreValid = function(ruleName, grammar2) {
  lexifyCount = 0;
  this._assertAllApplicationsAreValid(ruleName, grammar2);
};
PExpr.prototype._assertAllApplicationsAreValid = abstract("_assertAllApplicationsAreValid");
any._assertAllApplicationsAreValid = end._assertAllApplicationsAreValid = Terminal.prototype._assertAllApplicationsAreValid = Range.prototype._assertAllApplicationsAreValid = Param.prototype._assertAllApplicationsAreValid = UnicodeChar.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
};
Lex.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  lexifyCount++;
  this.expr._assertAllApplicationsAreValid(ruleName, grammar2);
  lexifyCount--;
};
Alt.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  for (let idx = 0; idx < this.terms.length; idx++) {
    this.terms[idx]._assertAllApplicationsAreValid(ruleName, grammar2);
  }
};
Seq.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  for (let idx = 0; idx < this.factors.length; idx++) {
    this.factors[idx]._assertAllApplicationsAreValid(ruleName, grammar2);
  }
};
Iter.prototype._assertAllApplicationsAreValid = Not.prototype._assertAllApplicationsAreValid = Lookahead.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  this.expr._assertAllApplicationsAreValid(ruleName, grammar2);
};
Apply.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2, skipSyntacticCheck = false) {
  const ruleInfo = grammar2.rules[this.ruleName];
  const isContextSyntactic = isSyntactic(ruleName) && lexifyCount === 0;
  if (!ruleInfo) {
    throw undeclaredRule(this.ruleName, grammar2.name, this.source);
  }
  if (!skipSyntacticCheck && isSyntactic(this.ruleName) && !isContextSyntactic) {
    throw applicationOfSyntacticRuleFromLexicalContext(this.ruleName, this);
  }
  const actual = this.args.length;
  const expected = ruleInfo.formals.length;
  if (actual !== expected) {
    throw wrongNumberOfArguments(this.ruleName, expected, actual, this.source);
  }
  const isBuiltInApplySyntactic = BuiltInRules$1 && ruleInfo === BuiltInRules$1.rules.applySyntactic;
  const isBuiltInCaseInsensitive = BuiltInRules$1 && ruleInfo === BuiltInRules$1.rules.caseInsensitive;
  if (isBuiltInCaseInsensitive) {
    if (!(this.args[0] instanceof Terminal)) {
      throw incorrectArgumentType('a Terminal (e.g. "abc")', this.args[0]);
    }
  }
  if (isBuiltInApplySyntactic) {
    const arg = this.args[0];
    if (!(arg instanceof Apply)) {
      throw incorrectArgumentType("a syntactic rule application", arg);
    }
    if (!isSyntactic(arg.ruleName)) {
      throw applySyntacticWithLexicalRuleApplication(arg);
    }
    if (isContextSyntactic) {
      throw unnecessaryExperimentalApplySyntactic(this);
    }
  }
  this.args.forEach((arg) => {
    arg._assertAllApplicationsAreValid(ruleName, grammar2, isBuiltInApplySyntactic);
    if (arg.getArity() !== 1) {
      throw invalidParameter(this.ruleName, arg);
    }
  });
};
PExpr.prototype.assertChoicesHaveUniformArity = abstract("assertChoicesHaveUniformArity");
any.assertChoicesHaveUniformArity = end.assertChoicesHaveUniformArity = Terminal.prototype.assertChoicesHaveUniformArity = Range.prototype.assertChoicesHaveUniformArity = Param.prototype.assertChoicesHaveUniformArity = Lex.prototype.assertChoicesHaveUniformArity = UnicodeChar.prototype.assertChoicesHaveUniformArity = function(ruleName) {
};
Alt.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  if (this.terms.length === 0) {
    return;
  }
  const arity = this.terms[0].getArity();
  for (let idx = 0; idx < this.terms.length; idx++) {
    const term = this.terms[idx];
    term.assertChoicesHaveUniformArity();
    const otherArity = term.getArity();
    if (arity !== otherArity) {
      throw inconsistentArity(ruleName, arity, otherArity, term);
    }
  }
};
Extend.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  const actualArity = this.terms[0].getArity();
  const expectedArity = this.terms[1].getArity();
  if (actualArity !== expectedArity) {
    throw inconsistentArity(ruleName, expectedArity, actualArity, this.terms[0]);
  }
};
Seq.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  for (let idx = 0; idx < this.factors.length; idx++) {
    this.factors[idx].assertChoicesHaveUniformArity(ruleName);
  }
};
Iter.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  this.expr.assertChoicesHaveUniformArity(ruleName);
};
Not.prototype.assertChoicesHaveUniformArity = function(ruleName) {
};
Lookahead.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  this.expr.assertChoicesHaveUniformArity(ruleName);
};
Apply.prototype.assertChoicesHaveUniformArity = function(ruleName) {
};
PExpr.prototype.assertIteratedExprsAreNotNullable = abstract("assertIteratedExprsAreNotNullable");
any.assertIteratedExprsAreNotNullable = end.assertIteratedExprsAreNotNullable = Terminal.prototype.assertIteratedExprsAreNotNullable = Range.prototype.assertIteratedExprsAreNotNullable = Param.prototype.assertIteratedExprsAreNotNullable = UnicodeChar.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
};
Alt.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  for (let idx = 0; idx < this.terms.length; idx++) {
    this.terms[idx].assertIteratedExprsAreNotNullable(grammar2);
  }
};
Seq.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  for (let idx = 0; idx < this.factors.length; idx++) {
    this.factors[idx].assertIteratedExprsAreNotNullable(grammar2);
  }
};
Iter.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  this.expr.assertIteratedExprsAreNotNullable(grammar2);
  if (this.expr.isNullable(grammar2)) {
    throw kleeneExprHasNullableOperand(this, []);
  }
};
Opt.prototype.assertIteratedExprsAreNotNullable = Not.prototype.assertIteratedExprsAreNotNullable = Lookahead.prototype.assertIteratedExprsAreNotNullable = Lex.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  this.expr.assertIteratedExprsAreNotNullable(grammar2);
};
Apply.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  this.args.forEach((arg) => {
    arg.assertIteratedExprsAreNotNullable(grammar2);
  });
};
class Node {
  constructor(matchLength) {
    this.matchLength = matchLength;
  }
  get ctorName() {
    throw new Error("subclass responsibility");
  }
  numChildren() {
    return this.children ? this.children.length : 0;
  }
  childAt(idx) {
    if (this.children) {
      return this.children[idx];
    }
  }
  indexOfChild(arg) {
    return this.children.indexOf(arg);
  }
  hasChildren() {
    return this.numChildren() > 0;
  }
  hasNoChildren() {
    return !this.hasChildren();
  }
  onlyChild() {
    if (this.numChildren() !== 1) {
      throw new Error("cannot get only child of a node of type " + this.ctorName + " (it has " + this.numChildren() + " children)");
    } else {
      return this.firstChild();
    }
  }
  firstChild() {
    if (this.hasNoChildren()) {
      throw new Error("cannot get first child of a " + this.ctorName + " node, which has no children");
    } else {
      return this.childAt(0);
    }
  }
  lastChild() {
    if (this.hasNoChildren()) {
      throw new Error("cannot get last child of a " + this.ctorName + " node, which has no children");
    } else {
      return this.childAt(this.numChildren() - 1);
    }
  }
  childBefore(child) {
    const childIdx = this.indexOfChild(child);
    if (childIdx < 0) {
      throw new Error("Node.childBefore() called w/ an argument that is not a child");
    } else if (childIdx === 0) {
      throw new Error("cannot get child before first child");
    } else {
      return this.childAt(childIdx - 1);
    }
  }
  childAfter(child) {
    const childIdx = this.indexOfChild(child);
    if (childIdx < 0) {
      throw new Error("Node.childAfter() called w/ an argument that is not a child");
    } else if (childIdx === this.numChildren() - 1) {
      throw new Error("cannot get child after last child");
    } else {
      return this.childAt(childIdx + 1);
    }
  }
  isTerminal() {
    return false;
  }
  isNonterminal() {
    return false;
  }
  isIteration() {
    return false;
  }
  isOptional() {
    return false;
  }
}
class TerminalNode extends Node {
  get ctorName() {
    return "_terminal";
  }
  isTerminal() {
    return true;
  }
  get primitiveValue() {
    throw new Error("The `primitiveValue` property was removed in Ohm v17.");
  }
}
class NonterminalNode extends Node {
  constructor(ruleName, children, childOffsets, matchLength) {
    super(matchLength);
    this.ruleName = ruleName;
    this.children = children;
    this.childOffsets = childOffsets;
  }
  get ctorName() {
    return this.ruleName;
  }
  isNonterminal() {
    return true;
  }
  isLexical() {
    return isLexical(this.ctorName);
  }
  isSyntactic() {
    return isSyntactic(this.ctorName);
  }
}
class IterationNode extends Node {
  constructor(children, childOffsets, matchLength, isOptional) {
    super(matchLength);
    this.children = children;
    this.childOffsets = childOffsets;
    this.optional = isOptional;
  }
  get ctorName() {
    return "_iter";
  }
  isIteration() {
    return true;
  }
  isOptional() {
    return this.optional;
  }
}
PExpr.prototype.eval = abstract("eval");
any.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const cp = inputStream.nextCodePoint();
  if (cp !== void 0) {
    state.pushBinding(new TerminalNode(String.fromCodePoint(cp).length), origPos);
    return true;
  } else {
    state.processFailure(origPos, this);
    return false;
  }
};
end.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  if (inputStream.atEnd()) {
    state.pushBinding(new TerminalNode(0), origPos);
    return true;
  } else {
    state.processFailure(origPos, this);
    return false;
  }
};
Terminal.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  if (!inputStream.matchString(this.obj)) {
    state.processFailure(origPos, this);
    return false;
  } else {
    state.pushBinding(new TerminalNode(this.obj.length), origPos);
    return true;
  }
};
Range.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const cp = this.matchCodePoint ? inputStream.nextCodePoint() : inputStream.nextCharCode();
  if (cp !== void 0 && this.from.codePointAt(0) <= cp && cp <= this.to.codePointAt(0)) {
    state.pushBinding(new TerminalNode(String.fromCodePoint(cp).length), origPos);
    return true;
  } else {
    state.processFailure(origPos, this);
    return false;
  }
};
Param.prototype.eval = function(state) {
  return state.eval(state.currentApplication().args[this.index]);
};
Lex.prototype.eval = function(state) {
  state.enterLexifiedContext();
  const ans = state.eval(this.expr);
  state.exitLexifiedContext();
  return ans;
};
Alt.prototype.eval = function(state) {
  for (let idx = 0; idx < this.terms.length; idx++) {
    if (state.eval(this.terms[idx])) {
      return true;
    }
  }
  return false;
};
Seq.prototype.eval = function(state) {
  for (let idx = 0; idx < this.factors.length; idx++) {
    const factor = this.factors[idx];
    if (!state.eval(factor)) {
      return false;
    }
  }
  return true;
};
Iter.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const arity = this.getArity();
  const cols = [];
  const colOffsets = [];
  while (cols.length < arity) {
    cols.push([]);
    colOffsets.push([]);
  }
  let numMatches = 0;
  let prevPos = origPos;
  let idx;
  while (numMatches < this.maxNumMatches && state.eval(this.expr)) {
    if (inputStream.pos === prevPos) {
      throw kleeneExprHasNullableOperand(this, state._applicationStack);
    }
    prevPos = inputStream.pos;
    numMatches++;
    const row = state._bindings.splice(state._bindings.length - arity, arity);
    const rowOffsets = state._bindingOffsets.splice(state._bindingOffsets.length - arity, arity);
    for (idx = 0; idx < row.length; idx++) {
      cols[idx].push(row[idx]);
      colOffsets[idx].push(rowOffsets[idx]);
    }
  }
  if (numMatches < this.minNumMatches) {
    return false;
  }
  let offset = state.posToOffset(origPos);
  let matchLength = 0;
  if (numMatches > 0) {
    const lastCol = cols[arity - 1];
    const lastColOffsets = colOffsets[arity - 1];
    const endOffset = lastColOffsets[lastColOffsets.length - 1] + lastCol[lastCol.length - 1].matchLength;
    offset = colOffsets[0][0];
    matchLength = endOffset - offset;
  }
  const isOptional = this instanceof Opt;
  for (idx = 0; idx < cols.length; idx++) {
    state._bindings.push(new IterationNode(cols[idx], colOffsets[idx], matchLength, isOptional));
    state._bindingOffsets.push(offset);
  }
  return true;
};
Not.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  state.pushFailuresInfo();
  const ans = state.eval(this.expr);
  state.popFailuresInfo();
  if (ans) {
    state.processFailure(origPos, this);
    return false;
  }
  inputStream.pos = origPos;
  return true;
};
Lookahead.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  if (state.eval(this.expr)) {
    inputStream.pos = origPos;
    return true;
  } else {
    return false;
  }
};
Apply.prototype.eval = function(state) {
  const caller = state.currentApplication();
  const actuals = caller ? caller.args : [];
  const app = this.substituteParams(actuals);
  const posInfo = state.getCurrentPosInfo();
  if (posInfo.isActive(app)) {
    return app.handleCycle(state);
  }
  const memoKey = app.toMemoKey();
  const memoRec = posInfo.memo[memoKey];
  if (memoRec && posInfo.shouldUseMemoizedResult(memoRec)) {
    if (state.hasNecessaryInfo(memoRec)) {
      return state.useMemoizedResult(state.inputStream.pos, memoRec);
    }
    delete posInfo.memo[memoKey];
  }
  return app.reallyEval(state);
};
Apply.prototype.handleCycle = function(state) {
  const posInfo = state.getCurrentPosInfo();
  const {currentLeftRecursion} = posInfo;
  const memoKey = this.toMemoKey();
  let memoRec = posInfo.memo[memoKey];
  if (currentLeftRecursion && currentLeftRecursion.headApplication.toMemoKey() === memoKey) {
    memoRec.updateInvolvedApplicationMemoKeys();
  } else if (!memoRec) {
    memoRec = posInfo.memoize(memoKey, {
      matchLength: 0,
      examinedLength: 0,
      value: false,
      rightmostFailureOffset: -1
    });
    posInfo.startLeftRecursion(this, memoRec);
  }
  return state.useMemoizedResult(state.inputStream.pos, memoRec);
};
Apply.prototype.reallyEval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const origPosInfo = state.getCurrentPosInfo();
  const ruleInfo = state.grammar.rules[this.ruleName];
  const {body} = ruleInfo;
  const {description} = ruleInfo;
  state.enterApplication(origPosInfo, this);
  if (description) {
    state.pushFailuresInfo();
  }
  const origInputStreamExaminedLength = inputStream.examinedLength;
  inputStream.examinedLength = 0;
  let value = this.evalOnce(body, state);
  const currentLR = origPosInfo.currentLeftRecursion;
  const memoKey = this.toMemoKey();
  const isHeadOfLeftRecursion = currentLR && currentLR.headApplication.toMemoKey() === memoKey;
  let memoRec;
  if (state.doNotMemoize) {
    state.doNotMemoize = false;
  } else if (isHeadOfLeftRecursion) {
    value = this.growSeedResult(body, state, origPos, currentLR, value);
    origPosInfo.endLeftRecursion();
    memoRec = currentLR;
    memoRec.examinedLength = inputStream.examinedLength - origPos;
    memoRec.rightmostFailureOffset = state._getRightmostFailureOffset();
    origPosInfo.memoize(memoKey, memoRec);
  } else if (!currentLR || !currentLR.isInvolved(memoKey)) {
    memoRec = origPosInfo.memoize(memoKey, {
      matchLength: inputStream.pos - origPos,
      examinedLength: inputStream.examinedLength - origPos,
      value,
      failuresAtRightmostPosition: state.cloneRecordedFailures(),
      rightmostFailureOffset: state._getRightmostFailureOffset()
    });
  }
  const succeeded = !!value;
  if (description) {
    state.popFailuresInfo();
    if (!succeeded) {
      state.processFailure(origPos, this);
    }
    if (memoRec) {
      memoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();
    }
  }
  if (state.isTracing() && memoRec) {
    const entry = state.getTraceEntry(origPos, this, succeeded, succeeded ? [value] : []);
    if (isHeadOfLeftRecursion) {
      assert(entry.terminatingLREntry != null || !succeeded);
      entry.isHeadOfLeftRecursion = true;
    }
    memoRec.traceEntry = entry;
  }
  inputStream.examinedLength = Math.max(inputStream.examinedLength, origInputStreamExaminedLength);
  state.exitApplication(origPosInfo, value);
  return succeeded;
};
Apply.prototype.evalOnce = function(expr, state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  if (state.eval(expr)) {
    const arity = expr.getArity();
    const bindings = state._bindings.splice(state._bindings.length - arity, arity);
    const offsets = state._bindingOffsets.splice(state._bindingOffsets.length - arity, arity);
    const matchLength = inputStream.pos - origPos;
    return new NonterminalNode(this.ruleName, bindings, offsets, matchLength);
  } else {
    return false;
  }
};
Apply.prototype.growSeedResult = function(body, state, origPos, lrMemoRec, newValue) {
  if (!newValue) {
    return false;
  }
  const {inputStream} = state;
  while (true) {
    lrMemoRec.matchLength = inputStream.pos - origPos;
    lrMemoRec.value = newValue;
    lrMemoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();
    if (state.isTracing()) {
      const seedTrace = state.trace[state.trace.length - 1];
      lrMemoRec.traceEntry = new Trace(state.input, origPos, inputStream.pos, this, true, [newValue], [seedTrace.clone()]);
    }
    inputStream.pos = origPos;
    newValue = this.evalOnce(body, state);
    if (inputStream.pos - origPos <= lrMemoRec.matchLength) {
      break;
    }
    if (state.isTracing()) {
      state.trace.splice(-2, 1);
    }
  }
  if (state.isTracing()) {
    lrMemoRec.traceEntry.recordLRTermination(state.trace.pop(), newValue);
  }
  inputStream.pos = origPos + lrMemoRec.matchLength;
  return lrMemoRec.value;
};
UnicodeChar.prototype.eval = function(state) {
  const {inputStream} = state;
  const origPos = inputStream.pos;
  const ch = inputStream.next();
  if (ch && this.pattern.test(ch)) {
    state.pushBinding(new TerminalNode(ch.length), origPos);
    return true;
  } else {
    state.processFailure(origPos, this);
    return false;
  }
};
PExpr.prototype.getArity = abstract("getArity");
any.getArity = end.getArity = Terminal.prototype.getArity = Range.prototype.getArity = Param.prototype.getArity = Apply.prototype.getArity = UnicodeChar.prototype.getArity = function() {
  return 1;
};
Alt.prototype.getArity = function() {
  return this.terms.length === 0 ? 0 : this.terms[0].getArity();
};
Seq.prototype.getArity = function() {
  let arity = 0;
  for (let idx = 0; idx < this.factors.length; idx++) {
    arity += this.factors[idx].getArity();
  }
  return arity;
};
Iter.prototype.getArity = function() {
  return this.expr.getArity();
};
Not.prototype.getArity = function() {
  return 0;
};
Lookahead.prototype.getArity = Lex.prototype.getArity = function() {
  return this.expr.getArity();
};
function getMetaInfo(expr, grammarInterval) {
  const metaInfo = {};
  if (expr.source && grammarInterval) {
    const adjusted = expr.source.relativeTo(grammarInterval);
    metaInfo.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
  }
  return metaInfo;
}
PExpr.prototype.outputRecipe = abstract("outputRecipe");
any.outputRecipe = function(formals, grammarInterval) {
  return ["any", getMetaInfo(this, grammarInterval)];
};
end.outputRecipe = function(formals, grammarInterval) {
  return ["end", getMetaInfo(this, grammarInterval)];
};
Terminal.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["terminal", getMetaInfo(this, grammarInterval), this.obj];
};
Range.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["range", getMetaInfo(this, grammarInterval), this.from, this.to];
};
Param.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["param", getMetaInfo(this, grammarInterval), this.index];
};
Alt.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["alt", getMetaInfo(this, grammarInterval)].concat(this.terms.map((term) => term.outputRecipe(formals, grammarInterval)));
};
Extend.prototype.outputRecipe = function(formals, grammarInterval) {
  const extension = this.terms[0];
  return extension.outputRecipe(formals, grammarInterval);
};
Splice.prototype.outputRecipe = function(formals, grammarInterval) {
  const beforeTerms = this.terms.slice(0, this.expansionPos);
  const afterTerms = this.terms.slice(this.expansionPos + 1);
  return [
    "splice",
    getMetaInfo(this, grammarInterval),
    beforeTerms.map((term) => term.outputRecipe(formals, grammarInterval)),
    afterTerms.map((term) => term.outputRecipe(formals, grammarInterval))
  ];
};
Seq.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["seq", getMetaInfo(this, grammarInterval)].concat(this.factors.map((factor) => factor.outputRecipe(formals, grammarInterval)));
};
Star.prototype.outputRecipe = Plus.prototype.outputRecipe = Opt.prototype.outputRecipe = Not.prototype.outputRecipe = Lookahead.prototype.outputRecipe = Lex.prototype.outputRecipe = function(formals, grammarInterval) {
  return [
    this.constructor.name.toLowerCase(),
    getMetaInfo(this, grammarInterval),
    this.expr.outputRecipe(formals, grammarInterval)
  ];
};
Apply.prototype.outputRecipe = function(formals, grammarInterval) {
  return [
    "app",
    getMetaInfo(this, grammarInterval),
    this.ruleName,
    this.args.map((arg) => arg.outputRecipe(formals, grammarInterval))
  ];
};
UnicodeChar.prototype.outputRecipe = function(formals, grammarInterval) {
  return ["unicodeChar", getMetaInfo(this, grammarInterval), this.category];
};
PExpr.prototype.introduceParams = abstract("introduceParams");
any.introduceParams = end.introduceParams = Terminal.prototype.introduceParams = Range.prototype.introduceParams = Param.prototype.introduceParams = UnicodeChar.prototype.introduceParams = function(formals) {
  return this;
};
Alt.prototype.introduceParams = function(formals) {
  this.terms.forEach((term, idx, terms) => {
    terms[idx] = term.introduceParams(formals);
  });
  return this;
};
Seq.prototype.introduceParams = function(formals) {
  this.factors.forEach((factor, idx, factors) => {
    factors[idx] = factor.introduceParams(formals);
  });
  return this;
};
Iter.prototype.introduceParams = Not.prototype.introduceParams = Lookahead.prototype.introduceParams = Lex.prototype.introduceParams = function(formals) {
  this.expr = this.expr.introduceParams(formals);
  return this;
};
Apply.prototype.introduceParams = function(formals) {
  const index = formals.indexOf(this.ruleName);
  if (index >= 0) {
    if (this.args.length > 0) {
      throw new Error("Parameterized rules cannot be passed as arguments to another rule.");
    }
    return new Param(index).withSource(this.source);
  } else {
    this.args.forEach((arg, idx, args) => {
      args[idx] = arg.introduceParams(formals);
    });
    return this;
  }
};
PExpr.prototype.isNullable = function(grammar2) {
  return this._isNullable(grammar2, Object.create(null));
};
PExpr.prototype._isNullable = abstract("_isNullable");
any._isNullable = Range.prototype._isNullable = Param.prototype._isNullable = Plus.prototype._isNullable = UnicodeChar.prototype._isNullable = function(grammar2, memo) {
  return false;
};
end._isNullable = function(grammar2, memo) {
  return true;
};
Terminal.prototype._isNullable = function(grammar2, memo) {
  if (typeof this.obj === "string") {
    return this.obj === "";
  } else {
    return false;
  }
};
Alt.prototype._isNullable = function(grammar2, memo) {
  return this.terms.length === 0 || this.terms.some((term) => term._isNullable(grammar2, memo));
};
Seq.prototype._isNullable = function(grammar2, memo) {
  return this.factors.every((factor) => factor._isNullable(grammar2, memo));
};
Star.prototype._isNullable = Opt.prototype._isNullable = Not.prototype._isNullable = Lookahead.prototype._isNullable = function(grammar2, memo) {
  return true;
};
Lex.prototype._isNullable = function(grammar2, memo) {
  return this.expr._isNullable(grammar2, memo);
};
Apply.prototype._isNullable = function(grammar2, memo) {
  const key = this.toMemoKey();
  if (!Object.prototype.hasOwnProperty.call(memo, key)) {
    const {body} = grammar2.rules[this.ruleName];
    const inlined = body.substituteParams(this.args);
    memo[key] = false;
    memo[key] = inlined._isNullable(grammar2, memo);
  }
  return memo[key];
};
PExpr.prototype.substituteParams = abstract("substituteParams");
any.substituteParams = end.substituteParams = Terminal.prototype.substituteParams = Range.prototype.substituteParams = UnicodeChar.prototype.substituteParams = function(actuals) {
  return this;
};
Param.prototype.substituteParams = function(actuals) {
  return actuals[this.index];
};
Alt.prototype.substituteParams = function(actuals) {
  return new Alt(this.terms.map((term) => term.substituteParams(actuals)));
};
Seq.prototype.substituteParams = function(actuals) {
  return new Seq(this.factors.map((factor) => factor.substituteParams(actuals)));
};
Iter.prototype.substituteParams = Not.prototype.substituteParams = Lookahead.prototype.substituteParams = Lex.prototype.substituteParams = function(actuals) {
  return new this.constructor(this.expr.substituteParams(actuals));
};
Apply.prototype.substituteParams = function(actuals) {
  if (this.args.length === 0) {
    return this;
  } else {
    const args = this.args.map((arg) => arg.substituteParams(actuals));
    return new Apply(this.ruleName, args);
  }
};
function isRestrictedJSIdentifier(str) {
  return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str);
}
function resolveDuplicatedNames(argumentNameList) {
  const count = Object.create(null);
  argumentNameList.forEach((argName) => {
    count[argName] = (count[argName] || 0) + 1;
  });
  Object.keys(count).forEach((dupArgName) => {
    if (count[dupArgName] <= 1) {
      return;
    }
    let subscript = 1;
    argumentNameList.forEach((argName, idx) => {
      if (argName === dupArgName) {
        argumentNameList[idx] = argName + "_" + subscript++;
      }
    });
  });
}
PExpr.prototype.toArgumentNameList = abstract("toArgumentNameList");
any.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return ["any"];
};
end.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return ["end"];
};
Terminal.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  if (typeof this.obj === "string" && /^[_a-zA-Z0-9]+$/.test(this.obj)) {
    return ["_" + this.obj];
  } else {
    return ["$" + firstArgIndex];
  }
};
Range.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  let argName = this.from + "_to_" + this.to;
  if (!isRestrictedJSIdentifier(argName)) {
    argName = "_" + argName;
  }
  if (!isRestrictedJSIdentifier(argName)) {
    argName = "$" + firstArgIndex;
  }
  return [argName];
};
Alt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  const termArgNameLists = this.terms.map((term) => term.toArgumentNameList(firstArgIndex, true));
  const argumentNameList = [];
  const numArgs = termArgNameLists[0].length;
  for (let colIdx = 0; colIdx < numArgs; colIdx++) {
    const col = [];
    for (let rowIdx = 0; rowIdx < this.terms.length; rowIdx++) {
      col.push(termArgNameLists[rowIdx][colIdx]);
    }
    const uniqueNames = copyWithoutDuplicates(col);
    argumentNameList.push(uniqueNames.join("_or_"));
  }
  if (!noDupCheck) {
    resolveDuplicatedNames(argumentNameList);
  }
  return argumentNameList;
};
Seq.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  let argumentNameList = [];
  this.factors.forEach((factor) => {
    const factorArgumentNameList = factor.toArgumentNameList(firstArgIndex, true);
    argumentNameList = argumentNameList.concat(factorArgumentNameList);
    firstArgIndex += factorArgumentNameList.length;
  });
  if (!noDupCheck) {
    resolveDuplicatedNames(argumentNameList);
  }
  return argumentNameList;
};
Iter.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  const argumentNameList = this.expr.toArgumentNameList(firstArgIndex, noDupCheck).map((exprArgumentString) => exprArgumentString[exprArgumentString.length - 1] === "s" ? exprArgumentString + "es" : exprArgumentString + "s");
  if (!noDupCheck) {
    resolveDuplicatedNames(argumentNameList);
  }
  return argumentNameList;
};
Opt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return this.expr.toArgumentNameList(firstArgIndex, noDupCheck).map((argName) => {
    return "opt" + argName[0].toUpperCase() + argName.slice(1);
  });
};
Not.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return [];
};
Lookahead.prototype.toArgumentNameList = Lex.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return this.expr.toArgumentNameList(firstArgIndex, noDupCheck);
};
Apply.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return [this.ruleName];
};
UnicodeChar.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return ["$" + firstArgIndex];
};
Param.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
  return ["param" + this.index];
};
PExpr.prototype.toDisplayString = abstract("toDisplayString");
Alt.prototype.toDisplayString = Seq.prototype.toDisplayString = function() {
  if (this.source) {
    return this.source.trimmed().contents;
  }
  return "[" + this.constructor.name + "]";
};
any.toDisplayString = end.toDisplayString = Iter.prototype.toDisplayString = Not.prototype.toDisplayString = Lookahead.prototype.toDisplayString = Lex.prototype.toDisplayString = Terminal.prototype.toDisplayString = Range.prototype.toDisplayString = Param.prototype.toDisplayString = function() {
  return this.toString();
};
Apply.prototype.toDisplayString = function() {
  if (this.args.length > 0) {
    const ps = this.args.map((arg) => arg.toDisplayString());
    return this.ruleName + "<" + ps.join(",") + ">";
  } else {
    return this.ruleName;
  }
};
UnicodeChar.prototype.toDisplayString = function() {
  return "Unicode [" + this.category + "] character";
};
function isValidType(type) {
  return type === "description" || type === "string" || type === "code";
}
class Failure {
  constructor(pexpr, text, type) {
    if (!isValidType(type)) {
      throw new Error("invalid Failure type: " + type);
    }
    this.pexpr = pexpr;
    this.text = text;
    this.type = type;
    this.fluffy = false;
  }
  getPExpr() {
    return this.pexpr;
  }
  getText() {
    return this.text;
  }
  getType() {
    return this.type;
  }
  isDescription() {
    return this.type === "description";
  }
  isStringTerminal() {
    return this.type === "string";
  }
  isCode() {
    return this.type === "code";
  }
  isFluffy() {
    return this.fluffy;
  }
  makeFluffy() {
    this.fluffy = true;
  }
  clearFluffy() {
    this.fluffy = false;
  }
  subsumes(that) {
    return this.getText() === that.getText() && this.type === that.type && (!this.isFluffy() || this.isFluffy() && that.isFluffy());
  }
  toString() {
    return this.type === "string" ? JSON.stringify(this.getText()) : this.getText();
  }
  clone() {
    const failure = new Failure(this.pexpr, this.text, this.type);
    if (this.isFluffy()) {
      failure.makeFluffy();
    }
    return failure;
  }
  toKey() {
    return this.toString() + "#" + this.type;
  }
}
PExpr.prototype.toFailure = abstract("toFailure");
any.toFailure = function(grammar2) {
  return new Failure(this, "any object", "description");
};
end.toFailure = function(grammar2) {
  return new Failure(this, "end of input", "description");
};
Terminal.prototype.toFailure = function(grammar2) {
  return new Failure(this, this.obj, "string");
};
Range.prototype.toFailure = function(grammar2) {
  return new Failure(this, JSON.stringify(this.from) + ".." + JSON.stringify(this.to), "code");
};
Not.prototype.toFailure = function(grammar2) {
  const description = this.expr === any ? "nothing" : "not " + this.expr.toFailure(grammar2);
  return new Failure(this, description, "description");
};
Lookahead.prototype.toFailure = function(grammar2) {
  return this.expr.toFailure(grammar2);
};
Apply.prototype.toFailure = function(grammar2) {
  let {description} = grammar2.rules[this.ruleName];
  if (!description) {
    const article = /^[aeiouAEIOU]/.test(this.ruleName) ? "an" : "a";
    description = article + " " + this.ruleName;
  }
  return new Failure(this, description, "description");
};
UnicodeChar.prototype.toFailure = function(grammar2) {
  return new Failure(this, "a Unicode [" + this.category + "] character", "description");
};
Alt.prototype.toFailure = function(grammar2) {
  const fs = this.terms.map((t) => t.toFailure(grammar2));
  const description = "(" + fs.join(" or ") + ")";
  return new Failure(this, description, "description");
};
Seq.prototype.toFailure = function(grammar2) {
  const fs = this.factors.map((f) => f.toFailure(grammar2));
  const description = "(" + fs.join(" ") + ")";
  return new Failure(this, description, "description");
};
Iter.prototype.toFailure = function(grammar2) {
  const description = "(" + this.expr.toFailure(grammar2) + this.operator + ")";
  return new Failure(this, description, "description");
};
PExpr.prototype.toString = abstract("toString");
any.toString = function() {
  return "any";
};
end.toString = function() {
  return "end";
};
Terminal.prototype.toString = function() {
  return JSON.stringify(this.obj);
};
Range.prototype.toString = function() {
  return JSON.stringify(this.from) + ".." + JSON.stringify(this.to);
};
Param.prototype.toString = function() {
  return "$" + this.index;
};
Lex.prototype.toString = function() {
  return "#(" + this.expr.toString() + ")";
};
Alt.prototype.toString = function() {
  return this.terms.length === 1 ? this.terms[0].toString() : "(" + this.terms.map((term) => term.toString()).join(" | ") + ")";
};
Seq.prototype.toString = function() {
  return this.factors.length === 1 ? this.factors[0].toString() : "(" + this.factors.map((factor) => factor.toString()).join(" ") + ")";
};
Iter.prototype.toString = function() {
  return this.expr + this.operator;
};
Not.prototype.toString = function() {
  return "~" + this.expr;
};
Lookahead.prototype.toString = function() {
  return "&" + this.expr;
};
Apply.prototype.toString = function() {
  if (this.args.length > 0) {
    const ps = this.args.map((arg) => arg.toString());
    return this.ruleName + "<" + ps.join(",") + ">";
  } else {
    return this.ruleName;
  }
};
UnicodeChar.prototype.toString = function() {
  return "\\p{" + this.category + "}";
};
class CaseInsensitiveTerminal extends PExpr {
  constructor(param) {
    super();
    this.obj = param;
  }
  _getString(state) {
    const terminal = state.currentApplication().args[this.obj.index];
    assert(terminal instanceof Terminal, "expected a Terminal expression");
    return terminal.obj;
  }
  allowsSkippingPrecedingSpace() {
    return true;
  }
  eval(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const matchStr = this._getString(state);
    if (!inputStream.matchString(matchStr, true)) {
      state.processFailure(origPos, this);
      return false;
    } else {
      state.pushBinding(new TerminalNode(matchStr.length), origPos);
      return true;
    }
  }
  getArity() {
    return 1;
  }
  substituteParams(actuals) {
    return new CaseInsensitiveTerminal(this.obj.substituteParams(actuals));
  }
  toDisplayString() {
    return this.obj.toDisplayString() + " (case-insensitive)";
  }
  toFailure(grammar2) {
    return new Failure(this, this.obj.toFailure(grammar2) + " (case-insensitive)", "description");
  }
  _isNullable(grammar2, memo) {
    return this.obj._isNullable(grammar2, memo);
  }
}
var pexprs = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  CaseInsensitiveTerminal,
  PExpr,
  any,
  end,
  Terminal,
  Range,
  Param,
  Alt,
  Extend,
  Splice,
  Seq,
  Iter,
  Star,
  Plus,
  Opt,
  Not,
  Lookahead,
  Lex,
  Apply,
  UnicodeChar
});
let builtInApplySyntacticBody;
awaitBuiltInRules((builtInRules) => {
  builtInApplySyntacticBody = builtInRules.rules.applySyntactic.body;
});
const applySpaces = new Apply("spaces");
class MatchState {
  constructor(matcher, startExpr, optPositionToRecordFailures) {
    this.matcher = matcher;
    this.startExpr = startExpr;
    this.grammar = matcher.grammar;
    this.input = matcher.getInput();
    this.inputStream = new InputStream(this.input);
    this.memoTable = matcher._memoTable;
    this.userData = void 0;
    this.doNotMemoize = false;
    this._bindings = [];
    this._bindingOffsets = [];
    this._applicationStack = [];
    this._posStack = [0];
    this.inLexifiedContextStack = [false];
    this.rightmostFailurePosition = -1;
    this._rightmostFailurePositionStack = [];
    this._recordedFailuresStack = [];
    if (optPositionToRecordFailures !== void 0) {
      this.positionToRecordFailures = optPositionToRecordFailures;
      this.recordedFailures = Object.create(null);
    }
  }
  posToOffset(pos) {
    return pos - this._posStack[this._posStack.length - 1];
  }
  enterApplication(posInfo, app) {
    this._posStack.push(this.inputStream.pos);
    this._applicationStack.push(app);
    this.inLexifiedContextStack.push(false);
    posInfo.enter(app);
    this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
    this.rightmostFailurePosition = -1;
  }
  exitApplication(posInfo, optNode) {
    const origPos = this._posStack.pop();
    this._applicationStack.pop();
    this.inLexifiedContextStack.pop();
    posInfo.exit();
    this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, this._rightmostFailurePositionStack.pop());
    if (optNode) {
      this.pushBinding(optNode, origPos);
    }
  }
  enterLexifiedContext() {
    this.inLexifiedContextStack.push(true);
  }
  exitLexifiedContext() {
    this.inLexifiedContextStack.pop();
  }
  currentApplication() {
    return this._applicationStack[this._applicationStack.length - 1];
  }
  inSyntacticContext() {
    const currentApplication = this.currentApplication();
    if (currentApplication) {
      return currentApplication.isSyntactic() && !this.inLexifiedContext();
    } else {
      return this.startExpr.factors[0].isSyntactic();
    }
  }
  inLexifiedContext() {
    return this.inLexifiedContextStack[this.inLexifiedContextStack.length - 1];
  }
  skipSpaces() {
    this.pushFailuresInfo();
    this.eval(applySpaces);
    this.popBinding();
    this.popFailuresInfo();
    return this.inputStream.pos;
  }
  skipSpacesIfInSyntacticContext() {
    return this.inSyntacticContext() ? this.skipSpaces() : this.inputStream.pos;
  }
  maybeSkipSpacesBefore(expr) {
    if (expr.allowsSkippingPrecedingSpace() && expr !== applySpaces) {
      return this.skipSpacesIfInSyntacticContext();
    } else {
      return this.inputStream.pos;
    }
  }
  pushBinding(node, origPos) {
    this._bindings.push(node);
    this._bindingOffsets.push(this.posToOffset(origPos));
  }
  popBinding() {
    this._bindings.pop();
    this._bindingOffsets.pop();
  }
  numBindings() {
    return this._bindings.length;
  }
  truncateBindings(newLength) {
    while (this._bindings.length > newLength) {
      this.popBinding();
    }
  }
  getCurrentPosInfo() {
    return this.getPosInfo(this.inputStream.pos);
  }
  getPosInfo(pos) {
    let posInfo = this.memoTable[pos];
    if (!posInfo) {
      posInfo = this.memoTable[pos] = new PosInfo();
    }
    return posInfo;
  }
  processFailure(pos, expr) {
    this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, pos);
    if (this.recordedFailures && pos === this.positionToRecordFailures) {
      const app = this.currentApplication();
      if (app) {
        expr = expr.substituteParams(app.args);
      }
      this.recordFailure(expr.toFailure(this.grammar), false);
    }
  }
  recordFailure(failure, shouldCloneIfNew) {
    const key = failure.toKey();
    if (!this.recordedFailures[key]) {
      this.recordedFailures[key] = shouldCloneIfNew ? failure.clone() : failure;
    } else if (this.recordedFailures[key].isFluffy() && !failure.isFluffy()) {
      this.recordedFailures[key].clearFluffy();
    }
  }
  recordFailures(failures, shouldCloneIfNew) {
    Object.keys(failures).forEach((key) => {
      this.recordFailure(failures[key], shouldCloneIfNew);
    });
  }
  cloneRecordedFailures() {
    if (!this.recordedFailures) {
      return void 0;
    }
    const ans = Object.create(null);
    Object.keys(this.recordedFailures).forEach((key) => {
      ans[key] = this.recordedFailures[key].clone();
    });
    return ans;
  }
  getRightmostFailurePosition() {
    return this.rightmostFailurePosition;
  }
  _getRightmostFailureOffset() {
    return this.rightmostFailurePosition >= 0 ? this.posToOffset(this.rightmostFailurePosition) : -1;
  }
  getMemoizedTraceEntry(pos, expr) {
    const posInfo = this.memoTable[pos];
    if (posInfo && expr instanceof Apply) {
      const memoRec = posInfo.memo[expr.toMemoKey()];
      if (memoRec && memoRec.traceEntry) {
        const entry = memoRec.traceEntry.cloneWithExpr(expr);
        entry.isMemoized = true;
        return entry;
      }
    }
    return null;
  }
  getTraceEntry(pos, expr, succeeded, bindings) {
    if (expr instanceof Apply) {
      const app = this.currentApplication();
      const actuals = app ? app.args : [];
      expr = expr.substituteParams(actuals);
    }
    return this.getMemoizedTraceEntry(pos, expr) || new Trace(this.input, pos, this.inputStream.pos, expr, succeeded, bindings, this.trace);
  }
  isTracing() {
    return !!this.trace;
  }
  hasNecessaryInfo(memoRec) {
    if (this.trace && !memoRec.traceEntry) {
      return false;
    }
    if (this.recordedFailures && this.inputStream.pos + memoRec.rightmostFailureOffset === this.positionToRecordFailures) {
      return !!memoRec.failuresAtRightmostPosition;
    }
    return true;
  }
  useMemoizedResult(origPos, memoRec) {
    if (this.trace) {
      this.trace.push(memoRec.traceEntry);
    }
    const memoRecRightmostFailurePosition = this.inputStream.pos + memoRec.rightmostFailureOffset;
    this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, memoRecRightmostFailurePosition);
    if (this.recordedFailures && this.positionToRecordFailures === memoRecRightmostFailurePosition && memoRec.failuresAtRightmostPosition) {
      this.recordFailures(memoRec.failuresAtRightmostPosition, true);
    }
    this.inputStream.examinedLength = Math.max(this.inputStream.examinedLength, memoRec.examinedLength + origPos);
    if (memoRec.value) {
      this.inputStream.pos += memoRec.matchLength;
      this.pushBinding(memoRec.value, origPos);
      return true;
    }
    return false;
  }
  eval(expr) {
    const {inputStream} = this;
    const origNumBindings = this._bindings.length;
    const origUserData = this.userData;
    let origRecordedFailures;
    if (this.recordedFailures) {
      origRecordedFailures = this.recordedFailures;
      this.recordedFailures = Object.create(null);
    }
    const origPos = inputStream.pos;
    const memoPos = this.maybeSkipSpacesBefore(expr);
    let origTrace;
    if (this.trace) {
      origTrace = this.trace;
      this.trace = [];
    }
    const ans = expr.eval(this);
    if (this.trace) {
      const bindings = this._bindings.slice(origNumBindings);
      const traceEntry = this.getTraceEntry(memoPos, expr, ans, bindings);
      traceEntry.isImplicitSpaces = expr === applySpaces;
      traceEntry.isRootNode = expr === this.startExpr;
      origTrace.push(traceEntry);
      this.trace = origTrace;
    }
    if (ans) {
      if (this.recordedFailures && inputStream.pos === this.positionToRecordFailures) {
        Object.keys(this.recordedFailures).forEach((key) => {
          this.recordedFailures[key].makeFluffy();
        });
      }
    } else {
      inputStream.pos = origPos;
      this.truncateBindings(origNumBindings);
      this.userData = origUserData;
    }
    if (this.recordedFailures) {
      this.recordFailures(origRecordedFailures, false);
    }
    if (expr === builtInApplySyntacticBody) {
      this.skipSpaces();
    }
    return ans;
  }
  getMatchResult() {
    this.grammar._setUpMatchState(this);
    this.eval(this.startExpr);
    let rightmostFailures;
    if (this.recordedFailures) {
      rightmostFailures = Object.keys(this.recordedFailures).map((key) => this.recordedFailures[key]);
    }
    const cst = this._bindings[0];
    if (cst) {
      cst.grammar = this.grammar;
    }
    return new MatchResult(this.matcher, this.input, this.startExpr, cst, this._bindingOffsets[0], this.rightmostFailurePosition, rightmostFailures);
  }
  getTrace() {
    this.trace = [];
    const matchResult = this.getMatchResult();
    const rootTrace = this.trace[this.trace.length - 1];
    rootTrace.result = matchResult;
    return rootTrace;
  }
  pushFailuresInfo() {
    this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
    this._recordedFailuresStack.push(this.recordedFailures);
  }
  popFailuresInfo() {
    this.rightmostFailurePosition = this._rightmostFailurePositionStack.pop();
    this.recordedFailures = this._recordedFailuresStack.pop();
  }
}
class Matcher {
  constructor(grammar2) {
    this.grammar = grammar2;
    this._memoTable = [];
    this._input = "";
    this._isMemoTableStale = false;
  }
  _resetMemoTable() {
    this._memoTable = [];
    this._isMemoTableStale = false;
  }
  getInput() {
    return this._input;
  }
  setInput(str) {
    if (this._input !== str) {
      this.replaceInputRange(0, this._input.length, str);
    }
    return this;
  }
  replaceInputRange(startIdx, endIdx, str) {
    const prevInput = this._input;
    const memoTable = this._memoTable;
    if (startIdx < 0 || startIdx > prevInput.length || endIdx < 0 || endIdx > prevInput.length || startIdx > endIdx) {
      throw new Error("Invalid indices: " + startIdx + " and " + endIdx);
    }
    this._input = prevInput.slice(0, startIdx) + str + prevInput.slice(endIdx);
    if (this._input !== prevInput && memoTable.length > 0) {
      this._isMemoTableStale = true;
    }
    const restOfMemoTable = memoTable.slice(endIdx);
    memoTable.length = startIdx;
    for (let idx = 0; idx < str.length; idx++) {
      memoTable.push(void 0);
    }
    for (const posInfo of restOfMemoTable) {
      memoTable.push(posInfo);
    }
    for (let pos = 0; pos < startIdx; pos++) {
      const posInfo = memoTable[pos];
      if (posInfo) {
        posInfo.clearObsoleteEntries(pos, startIdx);
      }
    }
    return this;
  }
  match(optStartApplicationStr, options = {incremental: true}) {
    return this._match(this._getStartExpr(optStartApplicationStr), {
      incremental: options.incremental,
      tracing: false
    });
  }
  trace(optStartApplicationStr, options = {incremental: true}) {
    return this._match(this._getStartExpr(optStartApplicationStr), {
      incremental: options.incremental,
      tracing: true
    });
  }
  _match(startExpr, options = {}) {
    const opts = {
      tracing: false,
      incremental: true,
      positionToRecordFailures: void 0,
      ...options
    };
    if (!opts.incremental) {
      this._resetMemoTable();
    } else if (this._isMemoTableStale && !this.grammar.supportsIncrementalParsing) {
      throw grammarDoesNotSupportIncrementalParsing(this.grammar);
    }
    const state = new MatchState(this, startExpr, opts.positionToRecordFailures);
    return opts.tracing ? state.getTrace() : state.getMatchResult();
  }
  _getStartExpr(optStartApplicationStr) {
    const applicationStr = optStartApplicationStr || this.grammar.defaultStartRule;
    if (!applicationStr) {
      throw new Error("Missing start rule argument -- the grammar has no default start rule.");
    }
    const startApp = this.grammar.parseApplication(applicationStr);
    return new Seq([startApp, end]);
  }
}
const globalActionStack = [];
const hasOwnProperty = (x, prop) => Object.prototype.hasOwnProperty.call(x, prop);
class Wrapper {
  constructor(node, sourceInterval, baseInterval) {
    this._node = node;
    this.source = sourceInterval;
    this._baseInterval = baseInterval;
    if (node.isNonterminal()) {
      assert(sourceInterval === baseInterval);
    }
    this._childWrappers = [];
  }
  _forgetMemoizedResultFor(attributeName) {
    delete this._node[this._semantics.attributeKeys[attributeName]];
    this.children.forEach((child) => {
      child._forgetMemoizedResultFor(attributeName);
    });
  }
  child(idx) {
    if (!(0 <= idx && idx < this._node.numChildren())) {
      return void 0;
    }
    let childWrapper = this._childWrappers[idx];
    if (!childWrapper) {
      const childNode = this._node.childAt(idx);
      const offset = this._node.childOffsets[idx];
      const source = this._baseInterval.subInterval(offset, childNode.matchLength);
      const base = childNode.isNonterminal() ? source : this._baseInterval;
      childWrapper = this._childWrappers[idx] = this._semantics.wrap(childNode, source, base);
    }
    return childWrapper;
  }
  _children() {
    for (let idx = 0; idx < this._node.numChildren(); idx++) {
      this.child(idx);
    }
    return this._childWrappers;
  }
  isIteration() {
    return this._node.isIteration();
  }
  isTerminal() {
    return this._node.isTerminal();
  }
  isNonterminal() {
    return this._node.isNonterminal();
  }
  isSyntactic() {
    return this.isNonterminal() && this._node.isSyntactic();
  }
  isLexical() {
    return this.isNonterminal() && this._node.isLexical();
  }
  isOptional() {
    return this._node.isOptional();
  }
  iteration(optChildWrappers) {
    const childWrappers = optChildWrappers || [];
    const childNodes = childWrappers.map((c) => c._node);
    const iter = new IterationNode(childNodes, [], -1, false);
    const wrapper = this._semantics.wrap(iter, null, null);
    wrapper._childWrappers = childWrappers;
    return wrapper;
  }
  get children() {
    return this._children();
  }
  get ctorName() {
    return this._node.ctorName;
  }
  get numChildren() {
    return this._node.numChildren();
  }
  get sourceString() {
    return this.source.contents;
  }
}
class Semantics {
  constructor(grammar2, superSemantics) {
    const self = this;
    this.grammar = grammar2;
    this.checkedActionDicts = false;
    this.Wrapper = class extends (superSemantics ? superSemantics.Wrapper : Wrapper) {
      constructor(node, sourceInterval, baseInterval) {
        super(node, sourceInterval, baseInterval);
        self.checkActionDictsIfHaventAlready();
        this._semantics = self;
      }
      toString() {
        return "[semantics wrapper for " + self.grammar.name + "]";
      }
    };
    this.super = superSemantics;
    if (superSemantics) {
      if (!(grammar2.equals(this.super.grammar) || grammar2._inheritsFrom(this.super.grammar))) {
        throw new Error("Cannot extend a semantics for grammar '" + this.super.grammar.name + "' for use with grammar '" + grammar2.name + "' (not a sub-grammar)");
      }
      this.operations = Object.create(this.super.operations);
      this.attributes = Object.create(this.super.attributes);
      this.attributeKeys = Object.create(null);
      for (const attributeName in this.attributes) {
        Object.defineProperty(this.attributeKeys, attributeName, {
          value: uniqueId(attributeName)
        });
      }
    } else {
      this.operations = Object.create(null);
      this.attributes = Object.create(null);
      this.attributeKeys = Object.create(null);
    }
  }
  toString() {
    return "[semantics for " + this.grammar.name + "]";
  }
  checkActionDictsIfHaventAlready() {
    if (!this.checkedActionDicts) {
      this.checkActionDicts();
      this.checkedActionDicts = true;
    }
  }
  checkActionDicts() {
    let name;
    for (name in this.operations) {
      this.operations[name].checkActionDict(this.grammar);
    }
    for (name in this.attributes) {
      this.attributes[name].checkActionDict(this.grammar);
    }
  }
  toRecipe(semanticsOnly) {
    function hasSuperSemantics(s) {
      return s.super !== Semantics.BuiltInSemantics._getSemantics();
    }
    let str = "(function(g) {\n";
    if (hasSuperSemantics(this)) {
      str += "  var semantics = " + this.super.toRecipe(true) + "(g";
      const superSemanticsGrammar = this.super.grammar;
      let relatedGrammar = this.grammar;
      while (relatedGrammar !== superSemanticsGrammar) {
        str += ".superGrammar";
        relatedGrammar = relatedGrammar.superGrammar;
      }
      str += ");\n";
      str += "  return g.extendSemantics(semantics)";
    } else {
      str += "  return g.createSemantics()";
    }
    ["Operation", "Attribute"].forEach((type) => {
      const semanticOperations = this[type.toLowerCase() + "s"];
      Object.keys(semanticOperations).forEach((name) => {
        const {actionDict, formals, builtInDefault} = semanticOperations[name];
        let signature = name;
        if (formals.length > 0) {
          signature += "(" + formals.join(", ") + ")";
        }
        let method;
        if (hasSuperSemantics(this) && this.super[type.toLowerCase() + "s"][name]) {
          method = "extend" + type;
        } else {
          method = "add" + type;
        }
        str += "\n    ." + method + "(" + JSON.stringify(signature) + ", {";
        const srcArray = [];
        Object.keys(actionDict).forEach((actionName) => {
          if (actionDict[actionName] !== builtInDefault) {
            let source = actionDict[actionName].toString().trim();
            source = source.replace(/^.*\(/, "function(");
            srcArray.push("\n      " + JSON.stringify(actionName) + ": " + source);
          }
        });
        str += srcArray.join(",") + "\n    })";
      });
    });
    str += ";\n  })";
    if (!semanticsOnly) {
      str = "(function() {\n  var grammar = this.fromRecipe(" + this.grammar.toRecipe() + ");\n  var semantics = " + str + "(grammar);\n  return semantics;\n});\n";
    }
    return str;
  }
  addOperationOrAttribute(type, signature, actionDict) {
    const typePlural = type + "s";
    const parsedNameAndFormalArgs = parseSignature(signature, type);
    const {name} = parsedNameAndFormalArgs;
    const {formals} = parsedNameAndFormalArgs;
    this.assertNewName(name, type);
    const builtInDefault = newDefaultAction(type, name, doIt);
    const realActionDict = {_default: builtInDefault};
    Object.keys(actionDict).forEach((name2) => {
      realActionDict[name2] = actionDict[name2];
    });
    const entry = type === "operation" ? new Operation(name, formals, realActionDict, builtInDefault) : new Attribute(name, realActionDict, builtInDefault);
    entry.checkActionDict(this.grammar);
    this[typePlural][name] = entry;
    function doIt(...args) {
      const thisThing = this._semantics[typePlural][name];
      if (arguments.length !== thisThing.formals.length) {
        throw new Error("Invalid number of arguments passed to " + name + " " + type + " (expected " + thisThing.formals.length + ", got " + arguments.length + ")");
      }
      const argsObj = Object.create(null);
      for (const [idx, val] of Object.entries(args)) {
        const formal = thisThing.formals[idx];
        argsObj[formal] = val;
      }
      const oldArgs = this.args;
      this.args = argsObj;
      const ans = thisThing.execute(this._semantics, this);
      this.args = oldArgs;
      return ans;
    }
    if (type === "operation") {
      this.Wrapper.prototype[name] = doIt;
      this.Wrapper.prototype[name].toString = function() {
        return "[" + name + " operation]";
      };
    } else {
      Object.defineProperty(this.Wrapper.prototype, name, {
        get: doIt,
        configurable: true
      });
      Object.defineProperty(this.attributeKeys, name, {
        value: uniqueId(name)
      });
    }
  }
  extendOperationOrAttribute(type, name, actionDict) {
    const typePlural = type + "s";
    parseSignature(name, "attribute");
    if (!(this.super && name in this.super[typePlural])) {
      throw new Error("Cannot extend " + type + " '" + name + "': did not inherit an " + type + " with that name");
    }
    if (hasOwnProperty(this[typePlural], name)) {
      throw new Error("Cannot extend " + type + " '" + name + "' again");
    }
    const inheritedFormals = this[typePlural][name].formals;
    const inheritedActionDict = this[typePlural][name].actionDict;
    const newActionDict = Object.create(inheritedActionDict);
    Object.keys(actionDict).forEach((name2) => {
      newActionDict[name2] = actionDict[name2];
    });
    this[typePlural][name] = type === "operation" ? new Operation(name, inheritedFormals, newActionDict) : new Attribute(name, newActionDict);
    this[typePlural][name].checkActionDict(this.grammar);
  }
  assertNewName(name, type) {
    if (hasOwnProperty(Wrapper.prototype, name)) {
      throw new Error("Cannot add " + type + " '" + name + "': that's a reserved name");
    }
    if (name in this.operations) {
      throw new Error("Cannot add " + type + " '" + name + "': an operation with that name already exists");
    }
    if (name in this.attributes) {
      throw new Error("Cannot add " + type + " '" + name + "': an attribute with that name already exists");
    }
  }
  wrap(node, source, optBaseInterval) {
    const baseInterval = optBaseInterval || source;
    return node instanceof this.Wrapper ? node : new this.Wrapper(node, source, baseInterval);
  }
}
function parseSignature(signature, type) {
  if (!Semantics.prototypeGrammar) {
    assert(signature.indexOf("(") === -1);
    return {
      name: signature,
      formals: []
    };
  }
  const r = Semantics.prototypeGrammar.match(signature, type === "operation" ? "OperationSignature" : "AttributeSignature");
  if (r.failed()) {
    throw new Error(r.message);
  }
  return Semantics.prototypeGrammarSemantics(r).parse();
}
function newDefaultAction(type, name, doIt) {
  return function(...children) {
    const thisThing = this._semantics.operations[name] || this._semantics.attributes[name];
    const args = thisThing.formals.map((formal) => this.args[formal]);
    if (!this.isIteration() && children.length === 1) {
      return doIt.apply(children[0], args);
    } else {
      throw missingSemanticAction(this.ctorName, name, type, globalActionStack);
    }
  };
}
Semantics.createSemantics = function(grammar2, optSuperSemantics) {
  const s = new Semantics(grammar2, optSuperSemantics !== void 0 ? optSuperSemantics : Semantics.BuiltInSemantics._getSemantics());
  const proxy = function ASemantics(matchResult) {
    if (!(matchResult instanceof MatchResult)) {
      throw new TypeError("Semantics expected a MatchResult, but got " + unexpectedObjToString(matchResult));
    }
    if (matchResult.failed()) {
      throw new TypeError("cannot apply Semantics to " + matchResult.toString());
    }
    const cst = matchResult._cst;
    if (cst.grammar !== grammar2) {
      throw new Error("Cannot use a MatchResult from grammar '" + cst.grammar.name + "' with a semantics for '" + grammar2.name + "'");
    }
    const inputStream = new InputStream(matchResult.input);
    return s.wrap(cst, inputStream.interval(matchResult._cstOffset, matchResult.input.length));
  };
  proxy.addOperation = function(signature, actionDict) {
    s.addOperationOrAttribute("operation", signature, actionDict);
    return proxy;
  };
  proxy.extendOperation = function(name, actionDict) {
    s.extendOperationOrAttribute("operation", name, actionDict);
    return proxy;
  };
  proxy.addAttribute = function(name, actionDict) {
    s.addOperationOrAttribute("attribute", name, actionDict);
    return proxy;
  };
  proxy.extendAttribute = function(name, actionDict) {
    s.extendOperationOrAttribute("attribute", name, actionDict);
    return proxy;
  };
  proxy._getActionDict = function(operationOrAttributeName) {
    const action = s.operations[operationOrAttributeName] || s.attributes[operationOrAttributeName];
    if (!action) {
      throw new Error('"' + operationOrAttributeName + '" is not a valid operation or attribute name in this semantics for "' + grammar2.name + '"');
    }
    return action.actionDict;
  };
  proxy._remove = function(operationOrAttributeName) {
    let semantic;
    if (operationOrAttributeName in s.operations) {
      semantic = s.operations[operationOrAttributeName];
      delete s.operations[operationOrAttributeName];
    } else if (operationOrAttributeName in s.attributes) {
      semantic = s.attributes[operationOrAttributeName];
      delete s.attributes[operationOrAttributeName];
    }
    delete s.Wrapper.prototype[operationOrAttributeName];
    return semantic;
  };
  proxy.getOperationNames = function() {
    return Object.keys(s.operations);
  };
  proxy.getAttributeNames = function() {
    return Object.keys(s.attributes);
  };
  proxy.getGrammar = function() {
    return s.grammar;
  };
  proxy.toRecipe = function(semanticsOnly) {
    return s.toRecipe(semanticsOnly);
  };
  proxy.toString = s.toString.bind(s);
  proxy._getSemantics = function() {
    return s;
  };
  return proxy;
};
class Operation {
  constructor(name, formals, actionDict, builtInDefault) {
    this.name = name;
    this.formals = formals;
    this.actionDict = actionDict;
    this.builtInDefault = builtInDefault;
  }
  checkActionDict(grammar2) {
    grammar2._checkTopDownActionDict(this.typeName, this.name, this.actionDict);
  }
  execute(semantics, nodeWrapper) {
    try {
      const {ctorName} = nodeWrapper._node;
      let actionFn = this.actionDict[ctorName];
      if (actionFn) {
        globalActionStack.push([this, ctorName]);
        return actionFn.apply(nodeWrapper, nodeWrapper._children());
      }
      if (nodeWrapper.isNonterminal()) {
        actionFn = this.actionDict._nonterminal;
        if (actionFn) {
          globalActionStack.push([this, "_nonterminal", ctorName]);
          return actionFn.apply(nodeWrapper, nodeWrapper._children());
        }
      }
      globalActionStack.push([this, "default action", ctorName]);
      return this.actionDict._default.apply(nodeWrapper, nodeWrapper._children());
    } finally {
      globalActionStack.pop();
    }
  }
}
Operation.prototype.typeName = "operation";
class Attribute extends Operation {
  constructor(name, actionDict, builtInDefault) {
    super(name, [], actionDict, builtInDefault);
  }
  execute(semantics, nodeWrapper) {
    const node = nodeWrapper._node;
    const key = semantics.attributeKeys[this.name];
    if (!hasOwnProperty(node, key)) {
      node[key] = Operation.prototype.execute.call(this, semantics, nodeWrapper);
    }
    return node[key];
  }
}
Attribute.prototype.typeName = "attribute";
const SPECIAL_ACTION_NAMES = ["_iter", "_terminal", "_nonterminal", "_default"];
function getSortedRuleValues(grammar2) {
  return Object.keys(grammar2.rules).sort().map((name) => grammar2.rules[name]);
}
const jsonToJS = (str) => str.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
let ohmGrammar$1;
let buildGrammar$1;
class Grammar {
  constructor(name, superGrammar, rules, optDefaultStartRule) {
    this.name = name;
    this.superGrammar = superGrammar;
    this.rules = rules;
    if (optDefaultStartRule) {
      if (!(optDefaultStartRule in rules)) {
        throw new Error("Invalid start rule: '" + optDefaultStartRule + "' is not a rule in grammar '" + name + "'");
      }
      this.defaultStartRule = optDefaultStartRule;
    }
    this._matchStateInitializer = void 0;
    this.supportsIncrementalParsing = true;
  }
  matcher() {
    return new Matcher(this);
  }
  isBuiltIn() {
    return this === Grammar.ProtoBuiltInRules || this === Grammar.BuiltInRules;
  }
  equals(g) {
    if (this === g) {
      return true;
    }
    if (g == null || this.name !== g.name || this.defaultStartRule !== g.defaultStartRule || !(this.superGrammar === g.superGrammar || this.superGrammar.equals(g.superGrammar))) {
      return false;
    }
    const myRules = getSortedRuleValues(this);
    const otherRules = getSortedRuleValues(g);
    return myRules.length === otherRules.length && myRules.every((rule, i) => {
      return rule.description === otherRules[i].description && rule.formals.join(",") === otherRules[i].formals.join(",") && rule.body.toString() === otherRules[i].body.toString();
    });
  }
  match(input, optStartApplication) {
    const m = this.matcher();
    m.replaceInputRange(0, 0, input);
    return m.match(optStartApplication);
  }
  trace(input, optStartApplication) {
    const m = this.matcher();
    m.replaceInputRange(0, 0, input);
    return m.trace(optStartApplication);
  }
  createSemantics() {
    return Semantics.createSemantics(this);
  }
  extendSemantics(superSemantics) {
    return Semantics.createSemantics(this, superSemantics._getSemantics());
  }
  _checkTopDownActionDict(what, name, actionDict) {
    const problems = [];
    for (const k in actionDict) {
      const v = actionDict[k];
      const isSpecialAction = SPECIAL_ACTION_NAMES.includes(k);
      if (!isSpecialAction && !(k in this.rules)) {
        problems.push(`'${k}' is not a valid semantic action for '${this.name}'`);
        continue;
      }
      if (typeof v !== "function") {
        problems.push(`'${k}' must be a function in an action dictionary for '${this.name}'`);
        continue;
      }
      const actual = v.length;
      const expected = this._topDownActionArity(k);
      if (actual !== expected) {
        let details;
        if (k === "_iter" || k === "_nonterminal") {
          details = `it should use a rest parameter, e.g. \`${k}(...children) {}\`. NOTE: this is new in Ohm v16 \u2014 see https://ohmjs.org/d/ati for details.`;
        } else {
          details = `expected ${expected}, got ${actual}`;
        }
        problems.push(`Semantic action '${k}' has the wrong arity: ${details}`);
      }
    }
    if (problems.length > 0) {
      const prettyProblems = problems.map((problem) => "- " + problem);
      const error = new Error([
        `Found errors in the action dictionary of the '${name}' ${what}:`,
        ...prettyProblems
      ].join("\n"));
      error.problems = problems;
      throw error;
    }
  }
  _topDownActionArity(actionName) {
    return SPECIAL_ACTION_NAMES.includes(actionName) ? 0 : this.rules[actionName].body.getArity();
  }
  _inheritsFrom(grammar2) {
    let g = this.superGrammar;
    while (g) {
      if (g.equals(grammar2, true)) {
        return true;
      }
      g = g.superGrammar;
    }
    return false;
  }
  toRecipe(superGrammarExpr = void 0) {
    const metaInfo = {};
    if (this.source) {
      metaInfo.source = this.source.contents;
    }
    let startRule = null;
    if (this.defaultStartRule) {
      startRule = this.defaultStartRule;
    }
    const rules = {};
    Object.keys(this.rules).forEach((ruleName) => {
      const ruleInfo = this.rules[ruleName];
      const {body} = ruleInfo;
      const isDefinition = !this.superGrammar || !this.superGrammar.rules[ruleName];
      let operation;
      if (isDefinition) {
        operation = "define";
      } else {
        operation = body instanceof Extend ? "extend" : "override";
      }
      const metaInfo2 = {};
      if (ruleInfo.source && this.source) {
        const adjusted = ruleInfo.source.relativeTo(this.source);
        metaInfo2.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
      }
      const description = isDefinition ? ruleInfo.description : null;
      const bodyRecipe = body.outputRecipe(ruleInfo.formals, this.source);
      rules[ruleName] = [
        operation,
        metaInfo2,
        description,
        ruleInfo.formals,
        bodyRecipe
      ];
    });
    let superGrammarOutput = "null";
    if (superGrammarExpr) {
      superGrammarOutput = superGrammarExpr;
    } else if (this.superGrammar && !this.superGrammar.isBuiltIn()) {
      superGrammarOutput = this.superGrammar.toRecipe();
    }
    const recipeElements = [
      ...["grammar", metaInfo, this.name].map(JSON.stringify),
      superGrammarOutput,
      ...[startRule, rules].map(JSON.stringify)
    ];
    return jsonToJS(`[${recipeElements.join(",")}]`);
  }
  toOperationActionDictionaryTemplate() {
    return this._toOperationOrAttributeActionDictionaryTemplate();
  }
  toAttributeActionDictionaryTemplate() {
    return this._toOperationOrAttributeActionDictionaryTemplate();
  }
  _toOperationOrAttributeActionDictionaryTemplate() {
    const sb = new StringBuffer();
    sb.append("{");
    let first = true;
    for (const ruleName in this.rules) {
      const {body} = this.rules[ruleName];
      if (first) {
        first = false;
      } else {
        sb.append(",");
      }
      sb.append("\n");
      sb.append("  ");
      this.addSemanticActionTemplate(ruleName, body, sb);
    }
    sb.append("\n}");
    return sb.contents();
  }
  addSemanticActionTemplate(ruleName, body, sb) {
    sb.append(ruleName);
    sb.append(": function(");
    const arity = this._topDownActionArity(ruleName);
    sb.append(repeat("_", arity).join(", "));
    sb.append(") {\n");
    sb.append("  }");
  }
  parseApplication(str) {
    let app;
    if (str.indexOf("<") === -1) {
      app = new Apply(str);
    } else {
      const cst = ohmGrammar$1.match(str, "Base_application");
      app = buildGrammar$1(cst, {});
    }
    if (!(app.ruleName in this.rules)) {
      throw undeclaredRule(app.ruleName, this.name);
    }
    const {formals} = this.rules[app.ruleName];
    if (formals.length !== app.args.length) {
      const {source} = this.rules[app.ruleName];
      throw wrongNumberOfParameters(app.ruleName, formals.length, app.args.length, source);
    }
    return app;
  }
  _setUpMatchState(state) {
    if (this._matchStateInitializer) {
      this._matchStateInitializer(state);
    }
  }
}
Grammar.ProtoBuiltInRules = new Grammar("ProtoBuiltInRules", void 0, {
  any: {
    body: any,
    formals: [],
    description: "any character",
    primitive: true
  },
  end: {
    body: end,
    formals: [],
    description: "end of input",
    primitive: true
  },
  caseInsensitive: {
    body: new CaseInsensitiveTerminal(new Param(0)),
    formals: ["str"],
    primitive: true
  },
  lower: {
    body: new UnicodeChar("Ll"),
    formals: [],
    description: "a lowercase letter",
    primitive: true
  },
  upper: {
    body: new UnicodeChar("Lu"),
    formals: [],
    description: "an uppercase letter",
    primitive: true
  },
  unicodeLtmo: {
    body: new UnicodeChar("Ltmo"),
    formals: [],
    description: "a Unicode character in Lt, Lm, or Lo",
    primitive: true
  },
  spaces: {
    body: new Star(new Apply("space")),
    formals: []
  },
  space: {
    body: new Range("\0", " "),
    formals: [],
    description: "a space"
  }
});
Grammar.initApplicationParser = function(grammar2, builderFn) {
  ohmGrammar$1 = grammar2;
  buildGrammar$1 = builderFn;
};
class GrammarDecl {
  constructor(name) {
    this.name = name;
  }
  sourceInterval(startIdx, endIdx) {
    return this.source.subInterval(startIdx, endIdx - startIdx);
  }
  ensureSuperGrammar() {
    if (!this.superGrammar) {
      this.withSuperGrammar(this.name === "BuiltInRules" ? Grammar.ProtoBuiltInRules : Grammar.BuiltInRules);
    }
    return this.superGrammar;
  }
  ensureSuperGrammarRuleForOverriding(name, source) {
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    if (!ruleInfo) {
      throw cannotOverrideUndeclaredRule(name, this.superGrammar.name, source);
    }
    return ruleInfo;
  }
  installOverriddenOrExtendedRule(name, formals, body, source) {
    const duplicateParameterNames$1 = getDuplicates(formals);
    if (duplicateParameterNames$1.length > 0) {
      throw duplicateParameterNames(name, duplicateParameterNames$1, source);
    }
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    const expectedFormals = ruleInfo.formals;
    const expectedNumFormals = expectedFormals ? expectedFormals.length : 0;
    if (formals.length !== expectedNumFormals) {
      throw wrongNumberOfParameters(name, expectedNumFormals, formals.length, source);
    }
    return this.install(name, formals, body, ruleInfo.description, source);
  }
  install(name, formals, body, description, source, primitive = false) {
    this.rules[name] = {
      body: body.introduceParams(formals),
      formals,
      description,
      source,
      primitive
    };
    return this;
  }
  withSuperGrammar(superGrammar) {
    if (this.superGrammar) {
      throw new Error("the super grammar of a GrammarDecl cannot be set more than once");
    }
    this.superGrammar = superGrammar;
    this.rules = Object.create(superGrammar.rules);
    if (!superGrammar.isBuiltIn()) {
      this.defaultStartRule = superGrammar.defaultStartRule;
    }
    return this;
  }
  withDefaultStartRule(ruleName) {
    this.defaultStartRule = ruleName;
    return this;
  }
  withSource(source) {
    this.source = new InputStream(source).interval(0, source.length);
    return this;
  }
  build() {
    const grammar2 = new Grammar(this.name, this.ensureSuperGrammar(), this.rules, this.defaultStartRule);
    grammar2._matchStateInitializer = grammar2.superGrammar._matchStateInitializer;
    grammar2.supportsIncrementalParsing = grammar2.superGrammar.supportsIncrementalParsing;
    const grammarErrors = [];
    let grammarHasInvalidApplications = false;
    Object.keys(grammar2.rules).forEach((ruleName) => {
      const {body} = grammar2.rules[ruleName];
      try {
        body.assertChoicesHaveUniformArity(ruleName);
      } catch (e) {
        grammarErrors.push(e);
      }
      try {
        body.assertAllApplicationsAreValid(ruleName, grammar2);
      } catch (e) {
        grammarErrors.push(e);
        grammarHasInvalidApplications = true;
      }
    });
    if (!grammarHasInvalidApplications) {
      Object.keys(grammar2.rules).forEach((ruleName) => {
        const {body} = grammar2.rules[ruleName];
        try {
          body.assertIteratedExprsAreNotNullable(grammar2, []);
        } catch (e) {
          grammarErrors.push(e);
        }
      });
    }
    if (grammarErrors.length > 0) {
      throwErrors(grammarErrors);
    }
    if (this.source) {
      grammar2.source = this.source;
    }
    return grammar2;
  }
  define(name, formals, body, description, source, primitive) {
    this.ensureSuperGrammar();
    if (this.superGrammar.rules[name]) {
      throw duplicateRuleDeclaration(name, this.name, this.superGrammar.name, source);
    } else if (this.rules[name]) {
      throw duplicateRuleDeclaration(name, this.name, this.name, source);
    }
    const duplicateParameterNames$1 = getDuplicates(formals);
    if (duplicateParameterNames$1.length > 0) {
      throw duplicateParameterNames(name, duplicateParameterNames$1, source);
    }
    return this.install(name, formals, body, description, source, primitive);
  }
  override(name, formals, body, descIgnored, source) {
    this.ensureSuperGrammarRuleForOverriding(name, source);
    this.installOverriddenOrExtendedRule(name, formals, body, source);
    return this;
  }
  extend(name, formals, fragment, descIgnored, source) {
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    if (!ruleInfo) {
      throw cannotExtendUndeclaredRule(name, this.superGrammar.name, source);
    }
    const body = new Extend(this.superGrammar, name, fragment);
    body.source = fragment.source;
    this.installOverriddenOrExtendedRule(name, formals, body, source);
    return this;
  }
}
class Builder {
  constructor() {
    this.currentDecl = null;
    this.currentRuleName = null;
  }
  newGrammar(name) {
    return new GrammarDecl(name);
  }
  grammar(metaInfo, name, superGrammar, defaultStartRule, rules) {
    const gDecl = new GrammarDecl(name);
    if (superGrammar) {
      gDecl.withSuperGrammar(superGrammar instanceof Grammar ? superGrammar : this.fromRecipe(superGrammar));
    }
    if (defaultStartRule) {
      gDecl.withDefaultStartRule(defaultStartRule);
    }
    if (metaInfo && metaInfo.source) {
      gDecl.withSource(metaInfo.source);
    }
    this.currentDecl = gDecl;
    Object.keys(rules).forEach((ruleName) => {
      this.currentRuleName = ruleName;
      const ruleRecipe = rules[ruleName];
      const action = ruleRecipe[0];
      const metaInfo2 = ruleRecipe[1];
      const description = ruleRecipe[2];
      const formals = ruleRecipe[3];
      const body = this.fromRecipe(ruleRecipe[4]);
      let source;
      if (gDecl.source && metaInfo2 && metaInfo2.sourceInterval) {
        source = gDecl.source.subInterval(metaInfo2.sourceInterval[0], metaInfo2.sourceInterval[1] - metaInfo2.sourceInterval[0]);
      }
      gDecl[action](ruleName, formals, body, description, source);
    });
    this.currentRuleName = this.currentDecl = null;
    return gDecl.build();
  }
  terminal(x) {
    return new Terminal(x);
  }
  range(from, to) {
    return new Range(from, to);
  }
  param(index) {
    return new Param(index);
  }
  alt(...termArgs) {
    let terms = [];
    for (let arg of termArgs) {
      if (!(arg instanceof PExpr)) {
        arg = this.fromRecipe(arg);
      }
      if (arg instanceof Alt) {
        terms = terms.concat(arg.terms);
      } else {
        terms.push(arg);
      }
    }
    return terms.length === 1 ? terms[0] : new Alt(terms);
  }
  seq(...factorArgs) {
    let factors = [];
    for (let arg of factorArgs) {
      if (!(arg instanceof PExpr)) {
        arg = this.fromRecipe(arg);
      }
      if (arg instanceof Seq) {
        factors = factors.concat(arg.factors);
      } else {
        factors.push(arg);
      }
    }
    return factors.length === 1 ? factors[0] : new Seq(factors);
  }
  star(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Star(expr);
  }
  plus(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Plus(expr);
  }
  opt(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Opt(expr);
  }
  not(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Not(expr);
  }
  lookahead(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Lookahead(expr);
  }
  lex(expr) {
    if (!(expr instanceof PExpr)) {
      expr = this.fromRecipe(expr);
    }
    return new Lex(expr);
  }
  app(ruleName, optParams) {
    if (optParams && optParams.length > 0) {
      optParams = optParams.map(function(param) {
        return param instanceof PExpr ? param : this.fromRecipe(param);
      }, this);
    }
    return new Apply(ruleName, optParams);
  }
  splice(beforeTerms, afterTerms) {
    return new Splice(this.currentDecl.superGrammar, this.currentRuleName, beforeTerms.map((term) => this.fromRecipe(term)), afterTerms.map((term) => this.fromRecipe(term)));
  }
  fromRecipe(recipe) {
    const args = recipe[0] === "grammar" ? recipe.slice(1) : recipe.slice(2);
    const result = this[recipe[0]](...args);
    const metaInfo = recipe[1];
    if (metaInfo) {
      if (metaInfo.sourceInterval && this.currentDecl) {
        result.withSource(this.currentDecl.sourceInterval(...metaInfo.sourceInterval));
      }
    }
    return result;
  }
}
function makeRecipe(recipe) {
  if (typeof recipe === "function") {
    return recipe.call(new Builder());
  } else {
    if (typeof recipe === "string") {
      recipe = JSON.parse(recipe);
    }
    return new Builder().fromRecipe(recipe);
  }
}
var BuiltInRules = makeRecipe(["grammar", {source: 'BuiltInRules {\n\n  alnum  (an alpha-numeric character)\n    = letter\n    | digit\n\n  letter  (a letter)\n    = lower\n    | upper\n    | unicodeLtmo\n\n  digit  (a digit)\n    = "0".."9"\n\n  hexDigit  (a hexadecimal digit)\n    = digit\n    | "a".."f"\n    | "A".."F"\n\n  ListOf<elem, sep>\n    = NonemptyListOf<elem, sep>\n    | EmptyListOf<elem, sep>\n\n  NonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  EmptyListOf<elem, sep>\n    = /* nothing */\n\n  listOf<elem, sep>\n    = nonemptyListOf<elem, sep>\n    | emptyListOf<elem, sep>\n\n  nonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  emptyListOf<elem, sep>\n    = /* nothing */\n\n  // Allows a syntactic rule application within a lexical context.\n  applySyntactic<app> = app\n}'}, "BuiltInRules", null, null, {alnum: ["define", {sourceInterval: [18, 78]}, "an alpha-numeric character", [], ["alt", {sourceInterval: [60, 78]}, ["app", {sourceInterval: [60, 66]}, "letter", []], ["app", {sourceInterval: [73, 78]}, "digit", []]]], letter: ["define", {sourceInterval: [82, 142]}, "a letter", [], ["alt", {sourceInterval: [107, 142]}, ["app", {sourceInterval: [107, 112]}, "lower", []], ["app", {sourceInterval: [119, 124]}, "upper", []], ["app", {sourceInterval: [131, 142]}, "unicodeLtmo", []]]], digit: ["define", {sourceInterval: [146, 177]}, "a digit", [], ["range", {sourceInterval: [169, 177]}, "0", "9"]], hexDigit: ["define", {sourceInterval: [181, 254]}, "a hexadecimal digit", [], ["alt", {sourceInterval: [219, 254]}, ["app", {sourceInterval: [219, 224]}, "digit", []], ["range", {sourceInterval: [231, 239]}, "a", "f"], ["range", {sourceInterval: [246, 254]}, "A", "F"]]], ListOf: ["define", {sourceInterval: [258, 336]}, null, ["elem", "sep"], ["alt", {sourceInterval: [282, 336]}, ["app", {sourceInterval: [282, 307]}, "NonemptyListOf", [["param", {sourceInterval: [297, 301]}, 0], ["param", {sourceInterval: [303, 306]}, 1]]], ["app", {sourceInterval: [314, 336]}, "EmptyListOf", [["param", {sourceInterval: [326, 330]}, 0], ["param", {sourceInterval: [332, 335]}, 1]]]]], NonemptyListOf: ["define", {sourceInterval: [340, 388]}, null, ["elem", "sep"], ["seq", {sourceInterval: [372, 388]}, ["param", {sourceInterval: [372, 376]}, 0], ["star", {sourceInterval: [377, 388]}, ["seq", {sourceInterval: [378, 386]}, ["param", {sourceInterval: [378, 381]}, 1], ["param", {sourceInterval: [382, 386]}, 0]]]]], EmptyListOf: ["define", {sourceInterval: [392, 434]}, null, ["elem", "sep"], ["seq", {sourceInterval: [438, 438]}]], listOf: ["define", {sourceInterval: [438, 516]}, null, ["elem", "sep"], ["alt", {sourceInterval: [462, 516]}, ["app", {sourceInterval: [462, 487]}, "nonemptyListOf", [["param", {sourceInterval: [477, 481]}, 0], ["param", {sourceInterval: [483, 486]}, 1]]], ["app", {sourceInterval: [494, 516]}, "emptyListOf", [["param", {sourceInterval: [506, 510]}, 0], ["param", {sourceInterval: [512, 515]}, 1]]]]], nonemptyListOf: ["define", {sourceInterval: [520, 568]}, null, ["elem", "sep"], ["seq", {sourceInterval: [552, 568]}, ["param", {sourceInterval: [552, 556]}, 0], ["star", {sourceInterval: [557, 568]}, ["seq", {sourceInterval: [558, 566]}, ["param", {sourceInterval: [558, 561]}, 1], ["param", {sourceInterval: [562, 566]}, 0]]]]], emptyListOf: ["define", {sourceInterval: [572, 682]}, null, ["elem", "sep"], ["seq", {sourceInterval: [685, 685]}]], applySyntactic: ["define", {sourceInterval: [685, 710]}, null, ["app"], ["param", {sourceInterval: [707, 710]}, 0]]}]);
Grammar.BuiltInRules = BuiltInRules;
announceBuiltInRules(Grammar.BuiltInRules);
var ohmGrammar = makeRecipe(["grammar", {source: `Ohm {

  Grammars
    = Grammar*

  Grammar
    = ident SuperGrammar? "{" Rule* "}"

  SuperGrammar
    = "<:" ident

  Rule
    = ident Formals? ruleDescr? "="  RuleBody  -- define
    | ident Formals?            ":=" OverrideRuleBody  -- override
    | ident Formals?            "+=" RuleBody  -- extend

  RuleBody
    = "|"? NonemptyListOf<TopLevelTerm, "|">

  TopLevelTerm
    = Seq caseName  -- inline
    | Seq

  OverrideRuleBody
    = "|"? NonemptyListOf<OverrideTopLevelTerm, "|">

  OverrideTopLevelTerm
    = "..."  -- superSplice
    | TopLevelTerm

  Formals
    = "<" ListOf<ident, ","> ">"

  Params
    = "<" ListOf<Seq, ","> ">"

  Alt
    = NonemptyListOf<Seq, "|">

  Seq
    = Iter*

  Iter
    = Pred "*"  -- star
    | Pred "+"  -- plus
    | Pred "?"  -- opt
    | Pred

  Pred
    = "~" Lex  -- not
    | "&" Lex  -- lookahead
    | Lex

  Lex
    = "#" Base  -- lex
    | Base

  Base
    = ident Params? ~(ruleDescr? "=" | ":=" | "+=")  -- application
    | oneCharTerminal ".." oneCharTerminal           -- range
    | terminal                                       -- terminal
    | "(" Alt ")"                                    -- paren

  ruleDescr  (a rule description)
    = "(" ruleDescrText ")"

  ruleDescrText
    = (~")" any)*

  caseName
    = "--" (~"\\n" space)* name (~"\\n" space)* ("\\n" | &"}")

  name  (a name)
    = nameFirst nameRest*

  nameFirst
    = "_"
    | letter

  nameRest
    = "_"
    | alnum

  ident  (an identifier)
    = name

  terminal
    = "\\"" terminalChar* "\\""

  oneCharTerminal
    = "\\"" terminalChar "\\""

  terminalChar
    = escapeChar
      | ~"\\\\" ~"\\"" ~"\\n" "\\u{0}".."\\u{10FFFF}"

  escapeChar  (an escape sequence)
    = "\\\\\\\\"                                     -- backslash
    | "\\\\\\""                                     -- doubleQuote
    | "\\\\\\'"                                     -- singleQuote
    | "\\\\b"                                      -- backspace
    | "\\\\n"                                      -- lineFeed
    | "\\\\r"                                      -- carriageReturn
    | "\\\\t"                                      -- tab
    | "\\\\u{" hexDigit hexDigit? hexDigit?
             hexDigit? hexDigit? hexDigit? "}"   -- unicodeCodePoint
    | "\\\\u" hexDigit hexDigit hexDigit hexDigit  -- unicodeEscape
    | "\\\\x" hexDigit hexDigit                    -- hexEscape

  space
   += comment

  comment
    = "//" (~"\\n" any)* &("\\n" | end)  -- singleLine
    | "/*" (~"*/" any)* "*/"  -- multiLine

  tokens = token*

  token = caseName | comment | ident | operator | punctuation | terminal | any

  operator = "<:" | "=" | ":=" | "+=" | "*" | "+" | "?" | "~" | "&"

  punctuation = "<" | ">" | "," | "--"
}`}, "Ohm", null, "Grammars", {Grammars: ["define", {sourceInterval: [9, 32]}, null, [], ["star", {sourceInterval: [24, 32]}, ["app", {sourceInterval: [24, 31]}, "Grammar", []]]], Grammar: ["define", {sourceInterval: [36, 83]}, null, [], ["seq", {sourceInterval: [50, 83]}, ["app", {sourceInterval: [50, 55]}, "ident", []], ["opt", {sourceInterval: [56, 69]}, ["app", {sourceInterval: [56, 68]}, "SuperGrammar", []]], ["terminal", {sourceInterval: [70, 73]}, "{"], ["star", {sourceInterval: [74, 79]}, ["app", {sourceInterval: [74, 78]}, "Rule", []]], ["terminal", {sourceInterval: [80, 83]}, "}"]]], SuperGrammar: ["define", {sourceInterval: [87, 116]}, null, [], ["seq", {sourceInterval: [106, 116]}, ["terminal", {sourceInterval: [106, 110]}, "<:"], ["app", {sourceInterval: [111, 116]}, "ident", []]]], Rule_define: ["define", {sourceInterval: [131, 181]}, null, [], ["seq", {sourceInterval: [131, 170]}, ["app", {sourceInterval: [131, 136]}, "ident", []], ["opt", {sourceInterval: [137, 145]}, ["app", {sourceInterval: [137, 144]}, "Formals", []]], ["opt", {sourceInterval: [146, 156]}, ["app", {sourceInterval: [146, 155]}, "ruleDescr", []]], ["terminal", {sourceInterval: [157, 160]}, "="], ["app", {sourceInterval: [162, 170]}, "RuleBody", []]]], Rule_override: ["define", {sourceInterval: [188, 248]}, null, [], ["seq", {sourceInterval: [188, 235]}, ["app", {sourceInterval: [188, 193]}, "ident", []], ["opt", {sourceInterval: [194, 202]}, ["app", {sourceInterval: [194, 201]}, "Formals", []]], ["terminal", {sourceInterval: [214, 218]}, ":="], ["app", {sourceInterval: [219, 235]}, "OverrideRuleBody", []]]], Rule_extend: ["define", {sourceInterval: [255, 305]}, null, [], ["seq", {sourceInterval: [255, 294]}, ["app", {sourceInterval: [255, 260]}, "ident", []], ["opt", {sourceInterval: [261, 269]}, ["app", {sourceInterval: [261, 268]}, "Formals", []]], ["terminal", {sourceInterval: [281, 285]}, "+="], ["app", {sourceInterval: [286, 294]}, "RuleBody", []]]], Rule: ["define", {sourceInterval: [120, 305]}, null, [], ["alt", {sourceInterval: [131, 305]}, ["app", {sourceInterval: [131, 170]}, "Rule_define", []], ["app", {sourceInterval: [188, 235]}, "Rule_override", []], ["app", {sourceInterval: [255, 294]}, "Rule_extend", []]]], RuleBody: ["define", {sourceInterval: [309, 362]}, null, [], ["seq", {sourceInterval: [324, 362]}, ["opt", {sourceInterval: [324, 328]}, ["terminal", {sourceInterval: [324, 327]}, "|"]], ["app", {sourceInterval: [329, 362]}, "NonemptyListOf", [["app", {sourceInterval: [344, 356]}, "TopLevelTerm", []], ["terminal", {sourceInterval: [358, 361]}, "|"]]]]], TopLevelTerm_inline: ["define", {sourceInterval: [385, 408]}, null, [], ["seq", {sourceInterval: [385, 397]}, ["app", {sourceInterval: [385, 388]}, "Seq", []], ["app", {sourceInterval: [389, 397]}, "caseName", []]]], TopLevelTerm: ["define", {sourceInterval: [366, 418]}, null, [], ["alt", {sourceInterval: [385, 418]}, ["app", {sourceInterval: [385, 397]}, "TopLevelTerm_inline", []], ["app", {sourceInterval: [415, 418]}, "Seq", []]]], OverrideRuleBody: ["define", {sourceInterval: [422, 491]}, null, [], ["seq", {sourceInterval: [445, 491]}, ["opt", {sourceInterval: [445, 449]}, ["terminal", {sourceInterval: [445, 448]}, "|"]], ["app", {sourceInterval: [450, 491]}, "NonemptyListOf", [["app", {sourceInterval: [465, 485]}, "OverrideTopLevelTerm", []], ["terminal", {sourceInterval: [487, 490]}, "|"]]]]], OverrideTopLevelTerm_superSplice: ["define", {sourceInterval: [522, 543]}, null, [], ["terminal", {sourceInterval: [522, 527]}, "..."]], OverrideTopLevelTerm: ["define", {sourceInterval: [495, 562]}, null, [], ["alt", {sourceInterval: [522, 562]}, ["app", {sourceInterval: [522, 527]}, "OverrideTopLevelTerm_superSplice", []], ["app", {sourceInterval: [550, 562]}, "TopLevelTerm", []]]], Formals: ["define", {sourceInterval: [566, 606]}, null, [], ["seq", {sourceInterval: [580, 606]}, ["terminal", {sourceInterval: [580, 583]}, "<"], ["app", {sourceInterval: [584, 602]}, "ListOf", [["app", {sourceInterval: [591, 596]}, "ident", []], ["terminal", {sourceInterval: [598, 601]}, ","]]], ["terminal", {sourceInterval: [603, 606]}, ">"]]], Params: ["define", {sourceInterval: [610, 647]}, null, [], ["seq", {sourceInterval: [623, 647]}, ["terminal", {sourceInterval: [623, 626]}, "<"], ["app", {sourceInterval: [627, 643]}, "ListOf", [["app", {sourceInterval: [634, 637]}, "Seq", []], ["terminal", {sourceInterval: [639, 642]}, ","]]], ["terminal", {sourceInterval: [644, 647]}, ">"]]], Alt: ["define", {sourceInterval: [651, 685]}, null, [], ["app", {sourceInterval: [661, 685]}, "NonemptyListOf", [["app", {sourceInterval: [676, 679]}, "Seq", []], ["terminal", {sourceInterval: [681, 684]}, "|"]]]], Seq: ["define", {sourceInterval: [689, 704]}, null, [], ["star", {sourceInterval: [699, 704]}, ["app", {sourceInterval: [699, 703]}, "Iter", []]]], Iter_star: ["define", {sourceInterval: [719, 736]}, null, [], ["seq", {sourceInterval: [719, 727]}, ["app", {sourceInterval: [719, 723]}, "Pred", []], ["terminal", {sourceInterval: [724, 727]}, "*"]]], Iter_plus: ["define", {sourceInterval: [743, 760]}, null, [], ["seq", {sourceInterval: [743, 751]}, ["app", {sourceInterval: [743, 747]}, "Pred", []], ["terminal", {sourceInterval: [748, 751]}, "+"]]], Iter_opt: ["define", {sourceInterval: [767, 783]}, null, [], ["seq", {sourceInterval: [767, 775]}, ["app", {sourceInterval: [767, 771]}, "Pred", []], ["terminal", {sourceInterval: [772, 775]}, "?"]]], Iter: ["define", {sourceInterval: [708, 794]}, null, [], ["alt", {sourceInterval: [719, 794]}, ["app", {sourceInterval: [719, 727]}, "Iter_star", []], ["app", {sourceInterval: [743, 751]}, "Iter_plus", []], ["app", {sourceInterval: [767, 775]}, "Iter_opt", []], ["app", {sourceInterval: [790, 794]}, "Pred", []]]], Pred_not: ["define", {sourceInterval: [809, 824]}, null, [], ["seq", {sourceInterval: [809, 816]}, ["terminal", {sourceInterval: [809, 812]}, "~"], ["app", {sourceInterval: [813, 816]}, "Lex", []]]], Pred_lookahead: ["define", {sourceInterval: [831, 852]}, null, [], ["seq", {sourceInterval: [831, 838]}, ["terminal", {sourceInterval: [831, 834]}, "&"], ["app", {sourceInterval: [835, 838]}, "Lex", []]]], Pred: ["define", {sourceInterval: [798, 862]}, null, [], ["alt", {sourceInterval: [809, 862]}, ["app", {sourceInterval: [809, 816]}, "Pred_not", []], ["app", {sourceInterval: [831, 838]}, "Pred_lookahead", []], ["app", {sourceInterval: [859, 862]}, "Lex", []]]], Lex_lex: ["define", {sourceInterval: [876, 892]}, null, [], ["seq", {sourceInterval: [876, 884]}, ["terminal", {sourceInterval: [876, 879]}, "#"], ["app", {sourceInterval: [880, 884]}, "Base", []]]], Lex: ["define", {sourceInterval: [866, 903]}, null, [], ["alt", {sourceInterval: [876, 903]}, ["app", {sourceInterval: [876, 884]}, "Lex_lex", []], ["app", {sourceInterval: [899, 903]}, "Base", []]]], Base_application: ["define", {sourceInterval: [918, 979]}, null, [], ["seq", {sourceInterval: [918, 963]}, ["app", {sourceInterval: [918, 923]}, "ident", []], ["opt", {sourceInterval: [924, 931]}, ["app", {sourceInterval: [924, 930]}, "Params", []]], ["not", {sourceInterval: [932, 963]}, ["alt", {sourceInterval: [934, 962]}, ["seq", {sourceInterval: [934, 948]}, ["opt", {sourceInterval: [934, 944]}, ["app", {sourceInterval: [934, 943]}, "ruleDescr", []]], ["terminal", {sourceInterval: [945, 948]}, "="]], ["terminal", {sourceInterval: [951, 955]}, ":="], ["terminal", {sourceInterval: [958, 962]}, "+="]]]]], Base_range: ["define", {sourceInterval: [986, 1041]}, null, [], ["seq", {sourceInterval: [986, 1022]}, ["app", {sourceInterval: [986, 1001]}, "oneCharTerminal", []], ["terminal", {sourceInterval: [1002, 1006]}, ".."], ["app", {sourceInterval: [1007, 1022]}, "oneCharTerminal", []]]], Base_terminal: ["define", {sourceInterval: [1048, 1106]}, null, [], ["app", {sourceInterval: [1048, 1056]}, "terminal", []]], Base_paren: ["define", {sourceInterval: [1113, 1168]}, null, [], ["seq", {sourceInterval: [1113, 1124]}, ["terminal", {sourceInterval: [1113, 1116]}, "("], ["app", {sourceInterval: [1117, 1120]}, "Alt", []], ["terminal", {sourceInterval: [1121, 1124]}, ")"]]], Base: ["define", {sourceInterval: [907, 1168]}, null, [], ["alt", {sourceInterval: [918, 1168]}, ["app", {sourceInterval: [918, 963]}, "Base_application", []], ["app", {sourceInterval: [986, 1022]}, "Base_range", []], ["app", {sourceInterval: [1048, 1056]}, "Base_terminal", []], ["app", {sourceInterval: [1113, 1124]}, "Base_paren", []]]], ruleDescr: ["define", {sourceInterval: [1172, 1231]}, "a rule description", [], ["seq", {sourceInterval: [1210, 1231]}, ["terminal", {sourceInterval: [1210, 1213]}, "("], ["app", {sourceInterval: [1214, 1227]}, "ruleDescrText", []], ["terminal", {sourceInterval: [1228, 1231]}, ")"]]], ruleDescrText: ["define", {sourceInterval: [1235, 1266]}, null, [], ["star", {sourceInterval: [1255, 1266]}, ["seq", {sourceInterval: [1256, 1264]}, ["not", {sourceInterval: [1256, 1260]}, ["terminal", {sourceInterval: [1257, 1260]}, ")"]], ["app", {sourceInterval: [1261, 1264]}, "any", []]]]], caseName: ["define", {sourceInterval: [1270, 1338]}, null, [], ["seq", {sourceInterval: [1285, 1338]}, ["terminal", {sourceInterval: [1285, 1289]}, "--"], ["star", {sourceInterval: [1290, 1304]}, ["seq", {sourceInterval: [1291, 1302]}, ["not", {sourceInterval: [1291, 1296]}, ["terminal", {sourceInterval: [1292, 1296]}, "\n"]], ["app", {sourceInterval: [1297, 1302]}, "space", []]]], ["app", {sourceInterval: [1305, 1309]}, "name", []], ["star", {sourceInterval: [1310, 1324]}, ["seq", {sourceInterval: [1311, 1322]}, ["not", {sourceInterval: [1311, 1316]}, ["terminal", {sourceInterval: [1312, 1316]}, "\n"]], ["app", {sourceInterval: [1317, 1322]}, "space", []]]], ["alt", {sourceInterval: [1326, 1337]}, ["terminal", {sourceInterval: [1326, 1330]}, "\n"], ["lookahead", {sourceInterval: [1333, 1337]}, ["terminal", {sourceInterval: [1334, 1337]}, "}"]]]]], name: ["define", {sourceInterval: [1342, 1382]}, "a name", [], ["seq", {sourceInterval: [1363, 1382]}, ["app", {sourceInterval: [1363, 1372]}, "nameFirst", []], ["star", {sourceInterval: [1373, 1382]}, ["app", {sourceInterval: [1373, 1381]}, "nameRest", []]]]], nameFirst: ["define", {sourceInterval: [1386, 1418]}, null, [], ["alt", {sourceInterval: [1402, 1418]}, ["terminal", {sourceInterval: [1402, 1405]}, "_"], ["app", {sourceInterval: [1412, 1418]}, "letter", []]]], nameRest: ["define", {sourceInterval: [1422, 1452]}, null, [], ["alt", {sourceInterval: [1437, 1452]}, ["terminal", {sourceInterval: [1437, 1440]}, "_"], ["app", {sourceInterval: [1447, 1452]}, "alnum", []]]], ident: ["define", {sourceInterval: [1456, 1489]}, "an identifier", [], ["app", {sourceInterval: [1485, 1489]}, "name", []]], terminal: ["define", {sourceInterval: [1493, 1531]}, null, [], ["seq", {sourceInterval: [1508, 1531]}, ["terminal", {sourceInterval: [1508, 1512]}, '"'], ["star", {sourceInterval: [1513, 1526]}, ["app", {sourceInterval: [1513, 1525]}, "terminalChar", []]], ["terminal", {sourceInterval: [1527, 1531]}, '"']]], oneCharTerminal: ["define", {sourceInterval: [1535, 1579]}, null, [], ["seq", {sourceInterval: [1557, 1579]}, ["terminal", {sourceInterval: [1557, 1561]}, '"'], ["app", {sourceInterval: [1562, 1574]}, "terminalChar", []], ["terminal", {sourceInterval: [1575, 1579]}, '"']]], terminalChar: ["define", {sourceInterval: [1583, 1660]}, null, [], ["alt", {sourceInterval: [1602, 1660]}, ["app", {sourceInterval: [1602, 1612]}, "escapeChar", []], ["seq", {sourceInterval: [1621, 1660]}, ["not", {sourceInterval: [1621, 1626]}, ["terminal", {sourceInterval: [1622, 1626]}, "\\"]], ["not", {sourceInterval: [1627, 1632]}, ["terminal", {sourceInterval: [1628, 1632]}, '"']], ["not", {sourceInterval: [1633, 1638]}, ["terminal", {sourceInterval: [1634, 1638]}, "\n"]], ["range", {sourceInterval: [1639, 1660]}, "\0", "\u{10FFFF}"]]]], escapeChar_backslash: ["define", {sourceInterval: [1703, 1758]}, null, [], ["terminal", {sourceInterval: [1703, 1709]}, "\\\\"]], escapeChar_doubleQuote: ["define", {sourceInterval: [1765, 1822]}, null, [], ["terminal", {sourceInterval: [1765, 1771]}, '\\"']], escapeChar_singleQuote: ["define", {sourceInterval: [1829, 1886]}, null, [], ["terminal", {sourceInterval: [1829, 1835]}, "\\'"]], escapeChar_backspace: ["define", {sourceInterval: [1893, 1948]}, null, [], ["terminal", {sourceInterval: [1893, 1898]}, "\\b"]], escapeChar_lineFeed: ["define", {sourceInterval: [1955, 2009]}, null, [], ["terminal", {sourceInterval: [1955, 1960]}, "\\n"]], escapeChar_carriageReturn: ["define", {sourceInterval: [2016, 2076]}, null, [], ["terminal", {sourceInterval: [2016, 2021]}, "\\r"]], escapeChar_tab: ["define", {sourceInterval: [2083, 2132]}, null, [], ["terminal", {sourceInterval: [2083, 2088]}, "\\t"]], escapeChar_unicodeCodePoint: ["define", {sourceInterval: [2139, 2243]}, null, [], ["seq", {sourceInterval: [2139, 2221]}, ["terminal", {sourceInterval: [2139, 2145]}, "\\u{"], ["app", {sourceInterval: [2146, 2154]}, "hexDigit", []], ["opt", {sourceInterval: [2155, 2164]}, ["app", {sourceInterval: [2155, 2163]}, "hexDigit", []]], ["opt", {sourceInterval: [2165, 2174]}, ["app", {sourceInterval: [2165, 2173]}, "hexDigit", []]], ["opt", {sourceInterval: [2188, 2197]}, ["app", {sourceInterval: [2188, 2196]}, "hexDigit", []]], ["opt", {sourceInterval: [2198, 2207]}, ["app", {sourceInterval: [2198, 2206]}, "hexDigit", []]], ["opt", {sourceInterval: [2208, 2217]}, ["app", {sourceInterval: [2208, 2216]}, "hexDigit", []]], ["terminal", {sourceInterval: [2218, 2221]}, "}"]]], escapeChar_unicodeEscape: ["define", {sourceInterval: [2250, 2309]}, null, [], ["seq", {sourceInterval: [2250, 2291]}, ["terminal", {sourceInterval: [2250, 2255]}, "\\u"], ["app", {sourceInterval: [2256, 2264]}, "hexDigit", []], ["app", {sourceInterval: [2265, 2273]}, "hexDigit", []], ["app", {sourceInterval: [2274, 2282]}, "hexDigit", []], ["app", {sourceInterval: [2283, 2291]}, "hexDigit", []]]], escapeChar_hexEscape: ["define", {sourceInterval: [2316, 2371]}, null, [], ["seq", {sourceInterval: [2316, 2339]}, ["terminal", {sourceInterval: [2316, 2321]}, "\\x"], ["app", {sourceInterval: [2322, 2330]}, "hexDigit", []], ["app", {sourceInterval: [2331, 2339]}, "hexDigit", []]]], escapeChar: ["define", {sourceInterval: [1664, 2371]}, "an escape sequence", [], ["alt", {sourceInterval: [1703, 2371]}, ["app", {sourceInterval: [1703, 1709]}, "escapeChar_backslash", []], ["app", {sourceInterval: [1765, 1771]}, "escapeChar_doubleQuote", []], ["app", {sourceInterval: [1829, 1835]}, "escapeChar_singleQuote", []], ["app", {sourceInterval: [1893, 1898]}, "escapeChar_backspace", []], ["app", {sourceInterval: [1955, 1960]}, "escapeChar_lineFeed", []], ["app", {sourceInterval: [2016, 2021]}, "escapeChar_carriageReturn", []], ["app", {sourceInterval: [2083, 2088]}, "escapeChar_tab", []], ["app", {sourceInterval: [2139, 2221]}, "escapeChar_unicodeCodePoint", []], ["app", {sourceInterval: [2250, 2291]}, "escapeChar_unicodeEscape", []], ["app", {sourceInterval: [2316, 2339]}, "escapeChar_hexEscape", []]]], space: ["extend", {sourceInterval: [2375, 2394]}, null, [], ["app", {sourceInterval: [2387, 2394]}, "comment", []]], comment_singleLine: ["define", {sourceInterval: [2412, 2458]}, null, [], ["seq", {sourceInterval: [2412, 2443]}, ["terminal", {sourceInterval: [2412, 2416]}, "//"], ["star", {sourceInterval: [2417, 2429]}, ["seq", {sourceInterval: [2418, 2427]}, ["not", {sourceInterval: [2418, 2423]}, ["terminal", {sourceInterval: [2419, 2423]}, "\n"]], ["app", {sourceInterval: [2424, 2427]}, "any", []]]], ["lookahead", {sourceInterval: [2430, 2443]}, ["alt", {sourceInterval: [2432, 2442]}, ["terminal", {sourceInterval: [2432, 2436]}, "\n"], ["app", {sourceInterval: [2439, 2442]}, "end", []]]]]], comment_multiLine: ["define", {sourceInterval: [2465, 2501]}, null, [], ["seq", {sourceInterval: [2465, 2487]}, ["terminal", {sourceInterval: [2465, 2469]}, "/*"], ["star", {sourceInterval: [2470, 2482]}, ["seq", {sourceInterval: [2471, 2480]}, ["not", {sourceInterval: [2471, 2476]}, ["terminal", {sourceInterval: [2472, 2476]}, "*/"]], ["app", {sourceInterval: [2477, 2480]}, "any", []]]], ["terminal", {sourceInterval: [2483, 2487]}, "*/"]]], comment: ["define", {sourceInterval: [2398, 2501]}, null, [], ["alt", {sourceInterval: [2412, 2501]}, ["app", {sourceInterval: [2412, 2443]}, "comment_singleLine", []], ["app", {sourceInterval: [2465, 2487]}, "comment_multiLine", []]]], tokens: ["define", {sourceInterval: [2505, 2520]}, null, [], ["star", {sourceInterval: [2514, 2520]}, ["app", {sourceInterval: [2514, 2519]}, "token", []]]], token: ["define", {sourceInterval: [2524, 2600]}, null, [], ["alt", {sourceInterval: [2532, 2600]}, ["app", {sourceInterval: [2532, 2540]}, "caseName", []], ["app", {sourceInterval: [2543, 2550]}, "comment", []], ["app", {sourceInterval: [2553, 2558]}, "ident", []], ["app", {sourceInterval: [2561, 2569]}, "operator", []], ["app", {sourceInterval: [2572, 2583]}, "punctuation", []], ["app", {sourceInterval: [2586, 2594]}, "terminal", []], ["app", {sourceInterval: [2597, 2600]}, "any", []]]], operator: ["define", {sourceInterval: [2604, 2669]}, null, [], ["alt", {sourceInterval: [2615, 2669]}, ["terminal", {sourceInterval: [2615, 2619]}, "<:"], ["terminal", {sourceInterval: [2622, 2625]}, "="], ["terminal", {sourceInterval: [2628, 2632]}, ":="], ["terminal", {sourceInterval: [2635, 2639]}, "+="], ["terminal", {sourceInterval: [2642, 2645]}, "*"], ["terminal", {sourceInterval: [2648, 2651]}, "+"], ["terminal", {sourceInterval: [2654, 2657]}, "?"], ["terminal", {sourceInterval: [2660, 2663]}, "~"], ["terminal", {sourceInterval: [2666, 2669]}, "&"]]], punctuation: ["define", {sourceInterval: [2673, 2709]}, null, [], ["alt", {sourceInterval: [2687, 2709]}, ["terminal", {sourceInterval: [2687, 2690]}, "<"], ["terminal", {sourceInterval: [2693, 2696]}, ">"], ["terminal", {sourceInterval: [2699, 2702]}, ","], ["terminal", {sourceInterval: [2705, 2709]}, "--"]]]}]);
const superSplicePlaceholder = Object.create(PExpr.prototype);
function namespaceHas(ns, name) {
  for (const prop in ns) {
    if (prop === name)
      return true;
  }
  return false;
}
function buildGrammar(match, namespace, optOhmGrammarForTesting) {
  const builder = new Builder();
  let decl;
  let currentRuleName;
  let currentRuleFormals;
  let overriding = false;
  const metaGrammar = optOhmGrammarForTesting || ohmGrammar;
  const helpers = metaGrammar.createSemantics().addOperation("visit", {
    Grammars(grammarIter) {
      return grammarIter.children.map((c) => c.visit());
    },
    Grammar(id, s, _open, rules, _close) {
      const grammarName = id.visit();
      decl = builder.newGrammar(grammarName);
      s.child(0) && s.child(0).visit();
      rules.children.map((c) => c.visit());
      const g = decl.build();
      g.source = this.source.trimmed();
      if (namespaceHas(namespace, grammarName)) {
        throw duplicateGrammarDeclaration(g);
      }
      namespace[grammarName] = g;
      return g;
    },
    SuperGrammar(_, n) {
      const superGrammarName = n.visit();
      if (superGrammarName === "null") {
        decl.withSuperGrammar(null);
      } else {
        if (!namespace || !namespaceHas(namespace, superGrammarName)) {
          throw undeclaredGrammar(superGrammarName, namespace, n.source);
        }
        decl.withSuperGrammar(namespace[superGrammarName]);
      }
    },
    Rule_define(n, fs, d, _, b) {
      currentRuleName = n.visit();
      currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
      if (!decl.defaultStartRule && decl.ensureSuperGrammar() !== Grammar.ProtoBuiltInRules) {
        decl.withDefaultStartRule(currentRuleName);
      }
      const body = b.visit();
      const description = d.children.map((c) => c.visit())[0];
      const source = this.source.trimmed();
      return decl.define(currentRuleName, currentRuleFormals, body, description, source);
    },
    Rule_override(n, fs, _, b) {
      currentRuleName = n.visit();
      currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
      const source = this.source.trimmed();
      decl.ensureSuperGrammarRuleForOverriding(currentRuleName, source);
      overriding = true;
      const body = b.visit();
      overriding = false;
      return decl.override(currentRuleName, currentRuleFormals, body, null, source);
    },
    Rule_extend(n, fs, _, b) {
      currentRuleName = n.visit();
      currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
      const body = b.visit();
      const source = this.source.trimmed();
      return decl.extend(currentRuleName, currentRuleFormals, body, null, source);
    },
    RuleBody(_, terms) {
      return builder.alt(...terms.visit()).withSource(this.source);
    },
    OverrideRuleBody(_, terms) {
      const args = terms.visit();
      const expansionPos = args.indexOf(superSplicePlaceholder);
      if (expansionPos >= 0) {
        const beforeTerms = args.slice(0, expansionPos);
        const afterTerms = args.slice(expansionPos + 1);
        afterTerms.forEach((t) => {
          if (t === superSplicePlaceholder)
            throw multipleSuperSplices(t);
        });
        return new Splice(decl.superGrammar, currentRuleName, beforeTerms, afterTerms).withSource(this.source);
      } else {
        return builder.alt(...args).withSource(this.source);
      }
    },
    Formals(opointy, fs, cpointy) {
      return fs.visit();
    },
    Params(opointy, ps, cpointy) {
      return ps.visit();
    },
    Alt(seqs) {
      return builder.alt(...seqs.visit()).withSource(this.source);
    },
    TopLevelTerm_inline(b, n) {
      const inlineRuleName = currentRuleName + "_" + n.visit();
      const body = b.visit();
      const source = this.source.trimmed();
      const isNewRuleDeclaration = !(decl.superGrammar && decl.superGrammar.rules[inlineRuleName]);
      if (overriding && !isNewRuleDeclaration) {
        decl.override(inlineRuleName, currentRuleFormals, body, null, source);
      } else {
        decl.define(inlineRuleName, currentRuleFormals, body, null, source);
      }
      const params = currentRuleFormals.map((formal) => builder.app(formal));
      return builder.app(inlineRuleName, params).withSource(body.source);
    },
    OverrideTopLevelTerm_superSplice(_) {
      return superSplicePlaceholder;
    },
    Seq(expr) {
      return builder.seq(...expr.children.map((c) => c.visit())).withSource(this.source);
    },
    Iter_star(x, _) {
      return builder.star(x.visit()).withSource(this.source);
    },
    Iter_plus(x, _) {
      return builder.plus(x.visit()).withSource(this.source);
    },
    Iter_opt(x, _) {
      return builder.opt(x.visit()).withSource(this.source);
    },
    Pred_not(_, x) {
      return builder.not(x.visit()).withSource(this.source);
    },
    Pred_lookahead(_, x) {
      return builder.lookahead(x.visit()).withSource(this.source);
    },
    Lex_lex(_, x) {
      return builder.lex(x.visit()).withSource(this.source);
    },
    Base_application(rule, ps) {
      const params = ps.children.map((c) => c.visit())[0] || [];
      return builder.app(rule.visit(), params).withSource(this.source);
    },
    Base_range(from, _, to) {
      return builder.range(from.visit(), to.visit()).withSource(this.source);
    },
    Base_terminal(expr) {
      return builder.terminal(expr.visit()).withSource(this.source);
    },
    Base_paren(open, x, close) {
      return x.visit();
    },
    ruleDescr(open, t, close) {
      return t.visit();
    },
    ruleDescrText(_) {
      return this.sourceString.trim();
    },
    caseName(_, space1, n, space2, end2) {
      return n.visit();
    },
    name(first, rest) {
      return this.sourceString;
    },
    nameFirst(expr) {
    },
    nameRest(expr) {
    },
    terminal(open, cs, close) {
      return cs.children.map((c) => c.visit()).join("");
    },
    oneCharTerminal(open, c, close) {
      return c.visit();
    },
    escapeChar(c) {
      try {
        return unescapeCodePoint(this.sourceString);
      } catch (err) {
        if (err instanceof RangeError && err.message.startsWith("Invalid code point ")) {
          throw invalidCodePoint(c);
        }
        throw err;
      }
    },
    NonemptyListOf(x, _, xs) {
      return [x.visit()].concat(xs.children.map((c) => c.visit()));
    },
    EmptyListOf() {
      return [];
    },
    _terminal() {
      return this.sourceString;
    }
  });
  return helpers(match).visit();
}
var operationsAndAttributesGrammar = makeRecipe(["grammar", {source: 'OperationsAndAttributes {\n\n  AttributeSignature =\n    name\n\n  OperationSignature =\n    name Formals?\n\n  Formals\n    = "(" ListOf<name, ","> ")"\n\n  name  (a name)\n    = nameFirst nameRest*\n\n  nameFirst\n    = "_"\n    | letter\n\n  nameRest\n    = "_"\n    | alnum\n\n}'}, "OperationsAndAttributes", null, "AttributeSignature", {AttributeSignature: ["define", {sourceInterval: [29, 58]}, null, [], ["app", {sourceInterval: [54, 58]}, "name", []]], OperationSignature: ["define", {sourceInterval: [62, 100]}, null, [], ["seq", {sourceInterval: [87, 100]}, ["app", {sourceInterval: [87, 91]}, "name", []], ["opt", {sourceInterval: [92, 100]}, ["app", {sourceInterval: [92, 99]}, "Formals", []]]]], Formals: ["define", {sourceInterval: [104, 143]}, null, [], ["seq", {sourceInterval: [118, 143]}, ["terminal", {sourceInterval: [118, 121]}, "("], ["app", {sourceInterval: [122, 139]}, "ListOf", [["app", {sourceInterval: [129, 133]}, "name", []], ["terminal", {sourceInterval: [135, 138]}, ","]]], ["terminal", {sourceInterval: [140, 143]}, ")"]]], name: ["define", {sourceInterval: [147, 187]}, "a name", [], ["seq", {sourceInterval: [168, 187]}, ["app", {sourceInterval: [168, 177]}, "nameFirst", []], ["star", {sourceInterval: [178, 187]}, ["app", {sourceInterval: [178, 186]}, "nameRest", []]]]], nameFirst: ["define", {sourceInterval: [191, 223]}, null, [], ["alt", {sourceInterval: [207, 223]}, ["terminal", {sourceInterval: [207, 210]}, "_"], ["app", {sourceInterval: [217, 223]}, "letter", []]]], nameRest: ["define", {sourceInterval: [227, 257]}, null, [], ["alt", {sourceInterval: [242, 257]}, ["terminal", {sourceInterval: [242, 245]}, "_"], ["app", {sourceInterval: [252, 257]}, "alnum", []]]]}]);
initBuiltInSemantics(Grammar.BuiltInRules);
initPrototypeParser(operationsAndAttributesGrammar);
function initBuiltInSemantics(builtInRules) {
  const actions = {
    empty() {
      return this.iteration();
    },
    nonEmpty(first, _, rest) {
      return this.iteration([first].concat(rest.children));
    }
  };
  Semantics.BuiltInSemantics = Semantics.createSemantics(builtInRules, null).addOperation("asIteration", {
    emptyListOf: actions.empty,
    nonemptyListOf: actions.nonEmpty,
    EmptyListOf: actions.empty,
    NonemptyListOf: actions.nonEmpty
  });
}
function initPrototypeParser(grammar2) {
  Semantics.prototypeGrammarSemantics = grammar2.createSemantics().addOperation("parse", {
    AttributeSignature(name) {
      return {
        name: name.parse(),
        formals: []
      };
    },
    OperationSignature(name, optFormals) {
      return {
        name: name.parse(),
        formals: optFormals.children.map((c) => c.parse())[0] || []
      };
    },
    Formals(oparen, fs, cparen) {
      return fs.asIteration().children.map((c) => c.parse());
    },
    name(first, rest) {
      return this.sourceString;
    }
  });
  Semantics.prototypeGrammar = grammar2;
}
function findIndentation(input) {
  let pos = 0;
  const stack = [0];
  const topOfStack = () => stack[stack.length - 1];
  const result = {};
  const regex = /( *).*(?:$|\r?\n|\r)/g;
  let match;
  while ((match = regex.exec(input)) != null) {
    const [line, indent] = match;
    if (line.length === 0)
      break;
    const indentSize = indent.length;
    const prevSize = topOfStack();
    const indentPos = pos + indentSize;
    if (indentSize > prevSize) {
      stack.push(indentSize);
      result[indentPos] = 1;
    } else if (indentSize < prevSize) {
      const prevLength = stack.length;
      while (topOfStack() !== indentSize) {
        stack.pop();
      }
      result[indentPos] = -1 * (prevLength - stack.length);
    }
    pos += line.length;
  }
  if (stack.length > 1) {
    result[pos] = 1 - stack.length;
  }
  return result;
}
const INDENT_DESCRIPTION = "an indented block";
const DEDENT_DESCRIPTION = "a dedent";
const INVALID_CODE_POINT = 1114111 + 1;
class InputStreamWithIndentation extends InputStream {
  constructor(state) {
    super(state.input);
    this.state = state;
  }
  _indentationAt(pos) {
    return this.state.userData[pos] || 0;
  }
  atEnd() {
    return super.atEnd() && this._indentationAt(this.pos) === 0;
  }
  next() {
    if (this._indentationAt(this.pos) !== 0) {
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return void 0;
    }
    return super.next();
  }
  nextCharCode() {
    if (this._indentationAt(this.pos) !== 0) {
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return INVALID_CODE_POINT;
    }
    return super.nextCharCode();
  }
  nextCodePoint() {
    if (this._indentationAt(this.pos) !== 0) {
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return INVALID_CODE_POINT;
    }
    return super.nextCodePoint();
  }
}
class Indentation extends PExpr {
  constructor(isIndent = true) {
    super();
    this.isIndent = isIndent;
  }
  allowsSkippingPrecedingSpace() {
    return true;
  }
  eval(state) {
    const {inputStream} = state;
    const pseudoTokens = state.userData;
    state.doNotMemoize = true;
    const origPos = inputStream.pos;
    const sign = this.isIndent ? 1 : -1;
    const count = (pseudoTokens[origPos] || 0) * sign;
    if (count > 0) {
      state.userData = Object.create(pseudoTokens);
      state.userData[origPos] -= sign;
      state.pushBinding(new TerminalNode(0), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  }
  getArity() {
    return 1;
  }
  _assertAllApplicationsAreValid(ruleName, grammar2) {
  }
  _isNullable(grammar2, memo) {
    return false;
  }
  assertChoicesHaveUniformArity(ruleName) {
  }
  assertIteratedExprsAreNotNullable(grammar2) {
  }
  introduceParams(formals) {
    return this;
  }
  substituteParams(actuals) {
    return this;
  }
  toString() {
    return this.isIndent ? "indent" : "dedent";
  }
  toDisplayString() {
    return this.toString();
  }
  toFailure(grammar2) {
    const description = this.isIndent ? INDENT_DESCRIPTION : DEDENT_DESCRIPTION;
    return new Failure(this, description, "description");
  }
}
const applyIndent = new Apply("indent");
const applyDedent = new Apply("dedent");
const newAnyBody = new Splice(BuiltInRules, "any", [applyIndent, applyDedent], []);
const IndentationSensitive = new Builder().newGrammar("IndentationSensitive").withSuperGrammar(BuiltInRules).define("indent", [], new Indentation(true), INDENT_DESCRIPTION, void 0, true).define("dedent", [], new Indentation(false), DEDENT_DESCRIPTION, void 0, true).extend("any", [], newAnyBody, "any character", void 0).build();
Object.assign(IndentationSensitive, {
  _matchStateInitializer(state) {
    state.userData = findIndentation(state.input);
    state.inputStream = new InputStreamWithIndentation(state);
  },
  supportsIncrementalParsing: false
});
const version = "17.1.0";
Grammar.initApplicationParser(ohmGrammar, buildGrammar);
const isBuffer = (obj) => !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
function compileAndLoad(source, namespace) {
  const m = ohmGrammar.match(source, "Grammars");
  if (m.failed()) {
    throw grammarSyntaxError(m);
  }
  return buildGrammar(m, namespace);
}
function grammar(source, optNamespace) {
  const ns = grammars(source, optNamespace);
  const grammarNames = Object.keys(ns);
  if (grammarNames.length === 0) {
    throw new Error("Missing grammar definition");
  } else if (grammarNames.length > 1) {
    const secondGrammar = ns[grammarNames[1]];
    const interval = secondGrammar.source;
    throw new Error(getLineAndColumnMessage(interval.sourceString, interval.startIdx) + "Found more than one grammar definition -- use ohm.grammars() instead.");
  }
  return ns[grammarNames[0]];
}
function grammars(source, optNamespace) {
  const ns = Object.create(optNamespace || {});
  if (typeof source !== "string") {
    if (isBuffer(source)) {
      source = source.toString();
    } else {
      throw new TypeError("Expected string as first argument, got " + unexpectedObjToString(source));
    }
  }
  compileAndLoad(source, ns);
  return ns;
}
export {IndentationSensitive as ExperimentalIndentationSensitive, buildGrammar as _buildGrammar, grammar, grammars, makeRecipe, ohmGrammar, pexprs, version};
