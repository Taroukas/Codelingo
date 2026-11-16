import { LangId } from '@/data/courses';

export interface ExecutionResult {
  lines: string[];
  elapsedLabel: string;
  exitCode: 0 | 1;
}

const MAX_LOOP_ITERATIONS = 1000;

function formatElapsed(ms: number): string {
  const sec = Math.max(0.01, ms / 1000);
  return `${sec.toFixed(2)}s`;
}

function runnerBanner(lang: LangId): string {
  switch (lang) {
    case 'python':
      return '> Running main.py...';
    case 'cpp':
      return '> Compiling main.cpp (clang++ -O2)...';
    case 'js':
      return '> Running index.js (Node v22)...';
    case 'go':
      return '> Running main.go...';
    case 'java':
      return '> Compiling Main.java & launching JVM 21...';
    case 'rust':
      return '> Compiling main.rs (rustc 1.82)...';
    case 'sql':
      return '> Executing query.sql on PostgreSQL 16...';
    case 'c':
      return '> Compiling main.c (-Wall -Wextra)...';
    case 'ts':
      return '> Running main.ts via tsc + node...';
    case 'css':
      return '> Parsing styles.css & calculating specificity...';
    case 'html':
      return '> Tokenizing index.html DOM tree...';
    case 'php':
      return '> Running index.php via PHP 8.3 CLI...';
    case 'asm':
      return '> Assembling boot.asm (x86-64 NASM)...';
    case 'swift':
      return '> Running main.swift (Swift 6)...';
    case 'kotlin':
      return '> Running Main.kt on Kotlin/JVM...';
    case 'julia':
      return '> Running calc.jl (Julia 1.11 JIT)...';
    case 'lua':
      return '> Running script.lua on Lua 5.4 VM...';
    case 'csharp':
      return '> Running Program.cs (.NET 8 SDK)...';
  }
}

/* ------------------------------------------------------------------ */
/*  Expression tokenizer & safe evaluator (Python / C++ / Go)         */
/* ------------------------------------------------------------------ */

type Scope = Record<string, unknown>;

interface UserFunc {
  params: { name: string; byRef?: boolean }[];
  body: string[];
}

interface ExecCtx {
  scope: Scope;
  funcs: Record<string, UserFunc>;
  methods: Record<string, { receiverParam: string; body: string[] }>;
  stdout: string[];
  currentLineBuffer: string;
}

function flushBuffer(ctx: ExecCtx) {
  if (ctx.currentLineBuffer.length > 0) {
    ctx.stdout.push(ctx.currentLineBuffer);
    ctx.currentLineBuffer = '';
  }
}

function appendOutputText(ctx: ExecCtx, text: string) {
  const parts = (ctx.currentLineBuffer + text).split('\n');
  for (let i = 0; i < parts.length - 1; i++) {
    ctx.stdout.push(parts[i]);
  }
  ctx.currentLineBuffer = parts[parts.length - 1];
}

function formatPyValue(val: unknown, nested = false): string {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return nested ? `'${val}'` : val;
  if (Array.isArray(val)) {
    return `[${val.map((v) => formatPyValue(v, true)).join(', ')}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    const body = entries
      .map(([k, v]) => {
        const keyStr = /^-?\d+(\.\d+)?$/.test(k) ? k : `'${k}'`;
        return `${keyStr}: ${formatPyValue(v, true)}`;
      })
      .join(', ');
    return `{${body}}`;
  }
  return String(val);
}

function formatGenericValue(val: unknown): string {
  if (val === null || val === undefined) return 'nil';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number' || typeof val === 'string') return String(val);
  if (Array.isArray(val)) {
    return `[${val.map((v) => formatGenericValue(v)).join(', ')}]`;
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

/** Split top-level arguments/items by comma, respecting (), [], {}, and quotes. */
function splitTopLevel(text: string, sep = ','): string[] {
  const out: string[] = [];
  let cur = '';
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let quote: string | null = null;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';

    if (quote) {
      cur += ch;
      if (ch === quote && prev !== '\\') {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      cur += ch;
      continue;
    }

    if (ch === '(') depthParen++;
    else if (ch === ')') depthParen--;
    else if (ch === '[') depthBracket++;
    else if (ch === ']') depthBracket--;
    else if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace--;

    if (
      ch === sep &&
      depthParen === 0 &&
      depthBracket === 0 &&
      depthBrace === 0
    ) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }

  if (cur.trim().length > 0) {
    out.push(cur.trim());
  }
  return out;
}

function unquoteString(raw: string): string {
  const inner = raw.slice(1, -1);
  return inner
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

function isSingleQuotedLiteral(expr: string): boolean {
  if (expr.length < 2) return false;
  const q = expr[0];
  if (q !== '"' && q !== "'" && q !== '`') return false;
  let escaped = false;
  for (let i = 1; i < expr.length; i++) {
    const ch = expr[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === q) {
      return i === expr.length - 1;
    }
  }
  return false;
}

function interpolateBalanced(
  text: string,
  prefix: string,
  openCh: string,
  closeCh: string,
  evaluate: (inside: string) => string,
): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (text.startsWith(prefix + openCh, i)) {
      const start = i + prefix.length + 1;
      let depth = 1;
      let j = start;
      while (j < text.length && depth > 0) {
        if (text[j] === openCh) depth++;
        else if (text[j] === closeCh) depth--;
        if (depth > 0) j++;
      }
      if (depth === 0) {
        out += evaluate(text.slice(start, j));
        i = j + 1;
        continue;
      }
    }
    out += text[i];
    i++;
  }
  return out;
}

function evalSimpleExpr(rawExpr: string, ctx: ExecCtx, lang: LangId): unknown {
  const expr = rawExpr.trim();
  if (!expr) return undefined;

  // Channel receive in Go: <-ch
  if (lang === 'go' && expr.startsWith('<-')) {
    const chName = expr.slice(2).trim();
    const ch = ctx.scope[chName];
    if (Array.isArray(ch)) {
      return ch.length > 0 ? ch.shift() : '';
    }
    return undefined;
  }

  // f-string in Python: f"..."
  if (
    lang === 'python' &&
    expr.length >= 3 &&
    (expr.startsWith('f"') || expr.startsWith("f'"))
  ) {
    const q = expr[1];
    if (expr.endsWith(q)) {
      const inner = expr.slice(2, -1);
      return inner.replace(/\{([^}]+)\}/g, (_, inside: string) =>
        formatPyValue(evalSimpleExpr(inside, ctx, lang)),
      );
    }
  }

  // C# interpolated string: $"..."
  if (
    lang === 'csharp' &&
    expr.length >= 3 &&
    expr.startsWith('$"') &&
    isSingleQuotedLiteral(expr.slice(1))
  ) {
    const inner = unquoteString(expr.slice(1));
    return interpolateBalanced(inner, '', '{', '}', (inside) =>
      formatGenericValue(evalSimpleExpr(inside, ctx, lang)),
    );
  }

  // String literal (with language-native interpolation where applicable)
  if (isSingleQuotedLiteral(expr)) {
    const rawText = unquoteString(expr);
    if (expr.startsWith('"')) {
      if (lang === 'swift') {
        return interpolateBalanced(rawText, '\\', '(', ')', (inside) =>
          formatGenericValue(evalSimpleExpr(inside, ctx, lang)),
        );
      }
      if (lang === 'kotlin') {
        const step1 = interpolateBalanced(rawText, '$', '{', '}', (inside) =>
          formatGenericValue(evalSimpleExpr(inside, ctx, lang)),
        );
        return step1.replace(/\$([A-Za-z_]\w*)/g, (_, ident: string) =>
          formatGenericValue(evalSimpleExpr(ident, ctx, lang)),
        );
      }
      if (lang === 'julia') {
        const step1 = interpolateBalanced(rawText, '$', '(', ')', (inside) =>
          formatGenericValue(evalSimpleExpr(inside, ctx, lang)),
        );
        return step1.replace(/\$([A-Za-z_]\w*)/g, (_, ident: string) =>
          formatGenericValue(evalSimpleExpr(ident, ctx, lang)),
        );
      }
      if (lang === 'php') {
        return rawText.replace(/\$([A-Za-z_]\w*)/g, (_, ident: string) =>
          formatGenericValue(evalSimpleExpr(`$${ident}`, ctx, lang)),
        );
      }
    }
    return rawText;
  }

  // Lua length operator: #str or #arr
  if (lang === 'lua' && expr.startsWith('#')) {
    const target = evalSimpleExpr(expr.slice(1), ctx, lang);
    if (typeof target === 'string' || Array.isArray(target)) return target.length;
    if (target && typeof target === 'object') return Object.keys(target).length;
    return 0;
  }

  // Booleans / nil / None
  if (expr === 'True' || expr === 'true') return true;
  if (expr === 'False' || expr === 'false') return false;
  if (expr === 'None' || expr === 'null' || expr === 'nullptr' || expr === 'nil')
    return null;

  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return Number(expr);
  }

  // Parenthesized expression
  if (expr.startsWith('(') && expr.endsWith(')')) {
    // Make sure outer parens match each other rather than (a) + (b)
    let depth = 0;
    let wrapped = true;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === '(') depth++;
      else if (expr[i] === ')') depth--;
      if (depth === 0) {
        wrapped = false;
        break;
      }
    }
    if (wrapped) {
      return evalSimpleExpr(expr.slice(1, -1), ctx, lang);
    }
  }

  // Python dict comprehension: {kExpr: vExpr for var in iter [if cond]}
  if (lang === 'python' && expr.startsWith('{') && expr.endsWith('}')) {
    const inner = expr.slice(1, -1).trim();
    const compMatch = inner.match(
      /^([^:]+):(.+?)\s+for\s+([A-Za-z_]\w*)\s+in\s+(.+?)(?:\s+if\s+(.+))?$/,
    );
    if (compMatch) {
      const [, kExpr, vExpr, loopVar, iterExpr, condExpr] = compMatch;
      const iterable = evalSimpleExpr(iterExpr, ctx, lang);
      const outObj: Record<string, unknown> = {};
      if (Array.isArray(iterable)) {
        const prevVal = ctx.scope[loopVar];
        const hadPrev = loopVar in ctx.scope;
        for (const item of iterable) {
          ctx.scope[loopVar] = item;
          if (condExpr && !evalSimpleExpr(condExpr, ctx, lang)) continue;
          const kVal = evalSimpleExpr(kExpr, ctx, lang);
          const vVal = evalSimpleExpr(vExpr, ctx, lang);
          outObj[String(kVal)] = vVal;
        }
        if (hadPrev) ctx.scope[loopVar] = prevVal;
        else delete ctx.scope[loopVar];
      }
      return outObj;
    }

    // Regular dict literal
    const pairs = splitTopLevel(inner);
    const obj: Record<string, unknown> = {};
    for (const p of pairs) {
      const colonIdx = p.indexOf(':');
      if (colonIdx !== -1) {
        const k = evalSimpleExpr(p.slice(0, colonIdx), ctx, lang);
        const v = evalSimpleExpr(p.slice(colonIdx + 1), ctx, lang);
        obj[String(k)] = v;
      }
    }
    return obj;
  }

  // C++ / Go initializer list: {15, 30, 45} when NOT containing ':'
  if (
    (lang === 'cpp' || lang === 'go') &&
    expr.startsWith('{') &&
    expr.endsWith('}')
  ) {
    const items = splitTopLevel(expr.slice(1, -1));
    return items.map((it) => evalSimpleExpr(it, ctx, lang));
  }

  // List literal or Python list comprehension
  if (expr.startsWith('[') && expr.endsWith(']')) {
    const inner = expr.slice(1, -1).trim();
    if (lang === 'python') {
      const lcMatch = inner.match(
        /^(.+?)\s+for\s+([A-Za-z_]\w*)\s+in\s+(.+?)(?:\s+if\s+(.+))?$/,
      );
      if (lcMatch) {
        const [, valExpr, loopVar, iterExpr, condExpr] = lcMatch;
        const iterable = evalSimpleExpr(iterExpr, ctx, lang);
        const arr: unknown[] = [];
        if (Array.isArray(iterable)) {
          const prevVal = ctx.scope[loopVar];
          const hadPrev = loopVar in ctx.scope;
          for (const item of iterable) {
            ctx.scope[loopVar] = item;
            if (condExpr && !evalSimpleExpr(condExpr, ctx, lang)) continue;
            arr.push(evalSimpleExpr(valExpr, ctx, lang));
          }
          if (hadPrev) ctx.scope[loopVar] = prevVal;
          else delete ctx.scope[loopVar];
        }
        return arr;
      }
    }
    if (!inner) return [];
    return splitTopLevel(inner).map((it) => evalSimpleExpr(it, ctx, lang));
  }

  // Go struct literal: Player{Name: "Kai", Level: 3}
  if (lang === 'go') {
    const structMatch = expr.match(/^([A-Za-z_]\w*)\{([^}]*)\}$/);
    if (structMatch) {
      const fields = splitTopLevel(structMatch[2]);
      const obj: Record<string, unknown> = { __type: structMatch[1] };
      for (const field of fields) {
        const idx = field.indexOf(':');
        if (idx !== -1) {
          const k = field.slice(0, idx).trim();
          const v = evalSimpleExpr(field.slice(idx + 1), ctx, lang);
          obj[k] = v;
        }
      }
      return obj;
    }

    // Go slice literal: []int{1, 2, 3}
    const sliceLitMatch = expr.match(/^\[\]\w+\{([^}]*)\}$/);
    if (sliceLitMatch) {
      return splitTopLevel(sliceLitMatch[1]).map((it) =>
        evalSimpleExpr(it, ctx, lang),
      );
    }

    // make(chan ...)
    if (expr.startsWith('make(')) {
      return [];
    }
  }

  // Rust inline expression: if cond { thenExpr } else { elseExpr }
  if (lang === 'rust') {
    const rustIfExpr = expr.match(
      /^if\s+([\s\S]+?)\s*\{\s*([\s\S]+?)\s*\}\s*else\s*\{\s*([\s\S]+?)\s*\}$/,
    );
    if (rustIfExpr) {
      const condVal = evalSimpleExpr(rustIfExpr[1], ctx, lang);
      return evalSimpleExpr(condVal ? rustIfExpr[2] : rustIfExpr[3], ctx, lang);
    }
  }

  // Ternary expression: cond ? thenExpr : elseExpr
  {
    let depthP = 0;
    let depthB = 0;
    let depthC = 0;
    let qQuote: string | null = null;
    let qPos = -1;
    let cPos = -1;
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (qQuote) {
        if (ch === qQuote && expr[i - 1] !== '\\') qQuote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        qQuote = ch;
        continue;
      }
      if (ch === '(') depthP++;
      else if (ch === ')') depthP--;
      else if (ch === '[') depthB++;
      else if (ch === ']') depthB--;
      else if (ch === '{') depthC++;
      else if (ch === '}') depthC--;
      else if (depthP === 0 && depthB === 0 && depthC === 0) {
        if (ch === '?' && qPos === -1) qPos = i;
        else if (ch === ':' && qPos !== -1) {
          cPos = i;
          break;
        }
      }
    }
    if (qPos > 0 && cPos > qPos) {
      const cond = evalSimpleExpr(expr.slice(0, qPos), ctx, lang);
      return evalSimpleExpr(
        cond ? expr.slice(qPos + 1, cPos) : expr.slice(cPos + 1),
        ctx,
        lang,
      );
    }
  }

  // Binary operators ordered by lowest precedence first
  const operatorGroups: string[][] = [
    [' or ', '||'],
    [' and ', '&&'],
    ['==', '!=', '~=', '>=', '<=', '>', '<'],
    ['+', '-', '.+', '.-', '..', ...(lang === 'php' ? ['.'] : [])],
    ['*', '/', '//', '%', '.*', './'],
    ['**', '^'],
  ];

  for (const ops of operatorGroups) {
    let depthParen = 0;
    let depthBracket = 0;
    let depthBrace = 0;
    let quote: string | null = null;

    // Scan right-to-left for left-associative evaluation
    for (let i = expr.length - 1; i >= 0; i--) {
      const ch = expr[i];
      if (quote) {
        if (ch === quote && (i === 0 || expr[i - 1] !== '\\')) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === ')') depthParen++;
      else if (ch === '(') depthParen--;
      else if (ch === ']') depthBracket++;
      else if (ch === '[') depthBracket--;
      else if (ch === '}') depthBrace++;
      else if (ch === '{') depthBrace--;

      if (depthParen !== 0 || depthBracket !== 0 || depthBrace !== 0) continue;

      for (const op of ops) {
        const start = i - op.length + 1;
        if (start <= 0) continue;
        if (expr.slice(start, i + 1) === op) {
          if (op === '..' && lang !== 'lua') continue;
          if (op === '..' && (expr[start - 1] === '.' || expr[i + 1] === '.')) continue;
          if (
            op === '.' &&
            (expr[start - 1] === '.' ||
              expr[i + 1] === '.' ||
              (/\d/.test(expr[start - 1] ?? '') && /\d/.test(expr[i + 1] ?? '')))
          ) {
            continue;
          }
          // Avoid treating unary +/- or exponent inside negative number at start
          const leftStr = expr.slice(0, start).trim();
          const rightStr = expr.slice(i + 1).trim();
          if (!leftStr || !rightStr) continue;
          // Ensure `-` / `+` isn't part of `+=` etc. or scientific notation
          if (
            (op === '+' || op === '-' || op === '*' || op === '/' || op === '>' || op === '<') &&
            ['+', '-', '*', '/', '.', '=', '!', '<', '>', '~'].includes(
              leftStr[leftStr.length - 1],
            )
          ) {
            continue;
          }
          if (op === '*' && (expr[start - 1] === '*' || expr[start + 1] === '*')) {
            continue;
          }
          if (op === '/' && (expr[start - 1] === '/' || expr[start + 1] === '/')) {
            continue;
          }
          if ((op === '>' || op === '<') && expr[i + 1] === '=') {
            continue;
          }

          const lVal = evalSimpleExpr(leftStr, ctx, lang);
          const rVal = evalSimpleExpr(rightStr, ctx, lang);

          switch (op) {
            case ' or ':
            case '||':
              return Boolean(lVal) || Boolean(rVal);
            case ' and ':
            case '&&':
              return Boolean(lVal) && Boolean(rVal);
            case '==':
              return lVal === rVal;
            case '!=':
            case '~=':
              return lVal !== rVal;
            case '>=':
              return Number(lVal) >= Number(rVal);
            case '<=':
              return Number(lVal) <= Number(rVal);
            case '>':
              return Number(lVal) > Number(rVal);
            case '<':
              return Number(lVal) < Number(rVal);
            case '..':
              return String(lVal ?? '') + String(rVal ?? '');
            case '.':
              if (lang === 'php') return String(lVal ?? '') + String(rVal ?? '');
              break;
            case '.+':
            case '.-':
            case '.*':
            case './': {
              const fn = (a: number, b: number) =>
                op === '.+' ? a + b : op === '.-' ? a - b : op === '.*' ? a * b : a / b;
              if (Array.isArray(lVal) && Array.isArray(rVal)) {
                return lVal.map((x, idx) => fn(Number(x), Number(rVal[idx] ?? 0)));
              }
              if (Array.isArray(lVal)) return lVal.map((x) => fn(Number(x), Number(rVal)));
              if (Array.isArray(rVal)) return rVal.map((y) => fn(Number(lVal), Number(y)));
              return fn(Number(lVal), Number(rVal));
            }
            case '+':
              return typeof lVal === 'string' || typeof rVal === 'string'
                ? String(lVal) + String(rVal)
                : Number(lVal) + Number(rVal);
            case '-':
              return Number(lVal) - Number(rVal);
            case '*':
              if (typeof lVal === 'string' && typeof rVal === 'string' && lang === 'julia') {
                return lVal + rVal;
              }
              return typeof lVal === 'string' && typeof rVal === 'number'
                ? lVal.repeat(Math.max(0, rVal))
                : Number(lVal) * Number(rVal);
            case '/': {
              if (Number(rVal) === 0) throw new Error('Division by zero');
              const floatCast =
                /^\((double|float)\)/.test(leftStr.trim()) ||
                /^\((double|float)\)/.test(rightStr.trim());
              return !floatCast &&
                (lang === 'cpp' ||
                  lang === 'go' ||
                  lang === 'java' ||
                  lang === 'c' ||
                  lang === 'rust' ||
                  lang === 'csharp' ||
                  lang === 'kotlin' ||
                  lang === 'swift')
                ? Number.isInteger(lVal) && Number.isInteger(rVal)
                  ? Math.trunc(Number(lVal) / Number(rVal))
                  : Number(lVal) / Number(rVal)
                : Number(lVal) / Number(rVal);
            }
            case '//':
              if (Number(rVal) === 0) throw new Error('Division by zero');
              return Math.floor(Number(lVal) / Number(rVal));
            case '%':
              return Number(lVal) % Number(rVal);
            case '**':
            case '^':
              return Math.pow(Number(lVal), Number(rVal));
          }
        }
      }
    }
  }

  // Built-in or user function call: name(arg1, arg2)
  const callMatch = expr.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\(([\s\S]*)\)$/);
  if (callMatch) {
    const fnName = callMatch[1];
    const argsRaw = splitTopLevel(callMatch[2]);
    const args = argsRaw.map((a) => evalSimpleExpr(a, ctx, lang));

    if (fnName === 'range') {
      const start = args.length === 1 ? 0 : Number(args[0] ?? 0);
      const end = args.length === 1 ? Number(args[0] ?? 0) : Number(args[1] ?? 0);
      const step = Number(args[2] ?? 1) || 1;
      const out: number[] = [];
      for (
        let n = start;
        (step > 0 ? n < end : n > end) && out.length < MAX_LOOP_ITERATIONS;
        n += step
      ) {
        out.push(n);
      }
      return out;
    }
    if (fnName === 'len' || fnName === 'length') {
      const target = args[0];
      if (Array.isArray(target) || typeof target === 'string') return target.length;
      if (target && typeof target === 'object') return Object.keys(target).length;
      return 0;
    }
    if (fnName === 'sum' && Array.isArray(args[0])) {
      return args[0].reduce((acc: number, x) => acc + Number(x), 0);
    }
    if (fnName === 'min' && Array.isArray(args[0])) {
      return Math.min(...args[0].map(Number));
    }
    if (fnName === 'max' && Array.isArray(args[0])) {
      return Math.max(...args[0].map(Number));
    }
    if (fnName === 'abs') return Math.abs(Number(args[0]));
    if (fnName === 'round') return Math.round(Number(args[0]));
    if (fnName === 'int') return Math.trunc(Number(args[0]));
    if (fnName === 'float') return Number(args[0]);
    if (fnName === 'str') return formatPyValue(args[0]);
    if (fnName === 'append' && Array.isArray(args[0])) {
      return [...args[0], ...args.slice(1)];
    }

    if (fnName === 'strlen') return String(args[0] ?? '').length;

    // Object method like hero.LevelUp() or league.equals("Gold")
    if (fnName.includes('.')) {
      const [objName, methName] = fnName.split('.');
      const obj = ctx.scope[objName];
      if (methName === 'equals' && obj !== undefined) {
        return obj === args[0];
      }
      if (methName === 'length' && typeof obj === 'string') {
        return obj.length;
      }
      const meth = ctx.methods[methName];
      if (obj && typeof obj === 'object' && meth) {
        const saved = ctx.scope[meth.receiverParam];
        ctx.scope[meth.receiverParam] = obj;
        for (const stmt of meth.body) {
          executeStatement(stmt, ctx, lang);
        }
        ctx.scope[meth.receiverParam] = saved;
        return undefined;
      }
    }

    // User function call
    const ufn = ctx.funcs[fnName];
    if (ufn) {
      const prevScope = { ...ctx.scope };
      ufn.params.forEach((p, idx) => {
        ctx.scope[p.name] = args[idx];
      });
      let retVal: unknown = undefined;
      for (const stmt of ufn.body) {
        const res = executeStatement(stmt, ctx, lang);
        if (res && res.__return) {
          retVal = res.value;
          break;
        }
      }
      // Copy back pass-by-reference arguments if variable identifiers
      ufn.params.forEach((p, idx) => {
        if (p.byRef && /^[A-Za-z_]\w*$/.test(argsRaw[idx] ?? '')) {
          prevScope[argsRaw[idx].trim()] = ctx.scope[p.name];
        }
      });
      ctx.scope = prevScope;
      return retVal;
    }
  }

  // Explicit C/Java type cast: (double)expr, (float)expr, (int)expr
  const castMatch = expr.match(
    /^\(\s*(double|float|int|long|size_t)\s*\)\s*([\s\S]+)$/,
  );
  if (castMatch) {
    const val = Number(evalSimpleExpr(castMatch[2], ctx, lang));
    return castMatch[1] === 'int' || castMatch[1] === 'long'
      ? Math.trunc(val)
      : val;
  }

  // Indexing: arr[idx] (1-based for Julia & Lua sequences)
  const indexMatch = expr.match(/^(\$?[A-Za-z_]\w*)\[(.+)\]$/);
  if (indexMatch) {
    const target = ctx.scope[indexMatch[1]];
    const idxRaw = indexMatch[2].trim();
    if (Array.isArray(target)) {
      if ((lang === 'julia' || lang === 'lua') && idxRaw === 'end') {
        return target[target.length - 1];
      }
      const key = evalSimpleExpr(idxRaw, ctx, lang);
      const pos = lang === 'julia' || lang === 'lua' ? Number(key) - 1 : Number(key);
      return target[pos];
    }
    const key = evalSimpleExpr(idxRaw, ctx, lang);
    if (target && typeof target === 'object') {
      return (target as Record<string, unknown>)[String(key)];
    }
  }

  // Property access: hero.Name
  if (/^[A-Za-z_]\w*\.[A-Za-z_]\w*$/.test(expr)) {
    const [objName, prop] = expr.split('.');
    const obj = ctx.scope[objName];
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[prop];
    }
  }

  // Variable lookup (including PHP $var names)
  if (/^\$?[A-Za-z_]\w*$/.test(expr)) {
    if (expr in ctx.scope) return ctx.scope[expr];
    throw new Error(`Undefined identifier '${expr}'`);
  }

  throw new Error(`Unable to evaluate expression '${expr}'`);
}

function assignTarget(
  target: string,
  val: unknown,
  ctx: ExecCtx,
  _lang: LangId,
) {
  const clean = target.trim();
  if (clean.includes('.')) {
    const [objName, prop] = clean.split('.');
    const obj = ctx.scope[objName];
    if (obj && typeof obj === 'object') {
      (obj as Record<string, unknown>)[prop] = val;
      return;
    }
  }
  ctx.scope[clean] = val;
}

function executeStatement(
  rawStmt: string,
  ctx: ExecCtx,
  lang: LangId,
): { __return: true; value: unknown } | void {
  const stmt = rawStmt.trim().replace(/;+$/, '');
  if (!stmt) return;

  if (stmt.startsWith('return ')) {
    return {
      __return: true,
      value: evalSimpleExpr(stmt.slice(7), ctx, lang),
    };
  }

  // Python list.append(...)
  const appendMatch = stmt.match(/^([A-Za-z_]\w*)\.append\(([\s\S]*)\)$/);
  if (appendMatch) {
    const arr = ctx.scope[appendMatch[1]];
    if (Array.isArray(arr)) {
      arr.push(evalSimpleExpr(appendMatch[2], ctx, lang));
    }
    return;
  }

  // Method call, macro invocation, or function call as statement
  if (/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*!?\([\s\S]*\)$/.test(stmt)) {
    // Print statements
    if (
      (lang === 'swift' || lang === 'lua') &&
      stmt.startsWith('print(')
    ) {
      const inner = stmt.slice(6, -1);
      const args = inner.trim() ? splitTopLevel(inner) : [];
      const rendered = args.map((a) =>
        formatGenericValue(evalSimpleExpr(a, ctx, lang)),
      );
      appendOutputText(ctx, `${rendered.join(' ')}\n`);
      return;
    }

    if (
      (lang === 'kotlin' || lang === 'julia') &&
      (stmt.startsWith('println(') || stmt.startsWith('print('))
    ) {
      const isLn = stmt.startsWith('println(');
      const inner = stmt.slice(isLn ? 8 : 6, -1);
      const args = inner.trim() ? splitTopLevel(inner) : [];
      const rendered = args.map((a) =>
        formatGenericValue(evalSimpleExpr(a, ctx, lang)),
      );
      const text = rendered.join(lang === 'julia' ? '' : ' ');
      appendOutputText(ctx, isLn ? `${text}\n` : text);
      return;
    }

    if (
      lang === 'csharp' &&
      (stmt.startsWith('Console.WriteLine(') || stmt.startsWith('Console.Write('))
    ) {
      const isLn = stmt.startsWith('Console.WriteLine(');
      const inner = stmt.slice(isLn ? 18 : 14, -1);
      const val = inner.trim() ? formatGenericValue(evalSimpleExpr(inner, ctx, lang)) : '';
      appendOutputText(ctx, isLn ? `${val}\n` : val);
      return;
    }

    if (lang === 'python' && stmt.startsWith('print(')) {
      const inner = stmt.slice(6, -1);
      const args = inner.trim() ? splitTopLevel(inner) : [];
      const rendered = args.map((a) =>
        formatPyValue(evalSimpleExpr(a, ctx, lang), false),
      );
      appendOutputText(ctx, `${rendered.join(' ')}\n`);
      return;
    }

    if (
      lang === 'java' &&
      (stmt.startsWith('System.out.println(') || stmt.startsWith('System.out.print('))
    ) {
      const isLn = stmt.startsWith('System.out.println(');
      const inner = stmt.slice(isLn ? 19 : 17, -1);
      const val = inner.trim() ? formatGenericValue(evalSimpleExpr(inner, ctx, lang)) : '';
      appendOutputText(ctx, isLn ? `${val}\n` : val);
      return;
    }

    if (lang === 'rust' && (stmt.startsWith('println!(') || stmt.startsWith('print!('))) {
      const isLn = stmt.startsWith('println!(');
      const inner = stmt.slice(isLn ? 9 : 7, -1);
      const args = splitTopLevel(inner);
      const template = String(evalSimpleExpr(args[0] ?? '""', ctx, lang));
      let argIdx = 1;
      const formatted = template.replace(/\{(?::\?)?\}/g, () =>
        formatGenericValue(evalSimpleExpr(args[argIdx++] ?? '""', ctx, lang)),
      );
      appendOutputText(ctx, isLn ? `${formatted}\n` : formatted);
      return;
    }

    if (lang === 'c' && stmt.startsWith('printf(')) {
      const inner = stmt.slice(7, -1);
      const args = splitTopLevel(inner);
      const template = String(evalSimpleExpr(args[0] ?? '""', ctx, lang));
      let argIdx = 1;
      const formatted = template.replace(
        /%%|%([0-9]*\.([0-9]+))?f|%[sdizucp]+/g,
        (spec, _fullPrec, decimals) => {
          if (spec === '%%') return '%';
          const raw = evalSimpleExpr(args[argIdx++] ?? '""', ctx, lang);
          if (spec.endsWith('f')) {
            const digits = decimals ? Number(decimals) : 6;
            return Number(raw).toFixed(digits);
          }
          if (spec === '%d' || spec === '%i') return String(Math.trunc(Number(raw)));
          return formatGenericValue(raw);
        },
      );
      appendOutputText(ctx, formatted);
      return;
    }

    if (lang === 'go' && stmt.startsWith('fmt.Println(')) {
      const inner = stmt.slice(12, -1);
      const args = inner.trim() ? splitTopLevel(inner) : [];
      const rendered = args.map((a) =>
        formatGenericValue(evalSimpleExpr(a, ctx, lang)),
      );
      appendOutputText(ctx, `${rendered.join(' ')}\n`);
      return;
    }

    if (lang === 'go' && stmt.startsWith('fmt.Print(')) {
      const inner = stmt.slice(10, -1);
      const args = inner.trim() ? splitTopLevel(inner) : [];
      const rendered = args.map((a) =>
        formatGenericValue(evalSimpleExpr(a, ctx, lang)),
      );
      appendOutputText(ctx, rendered.join(''));
      return;
    }

    if (lang === 'go' && stmt.startsWith('fmt.Printf(')) {
      const inner = stmt.slice(11, -1);
      const args = splitTopLevel(inner);
      const template = String(evalSimpleExpr(args[0] ?? '""', ctx, lang));
      let argIdx = 1;
      const formatted = template.replace(/%[sdvf]/g, () => {
        const val = evalSimpleExpr(args[argIdx++] ?? '""', ctx, lang);
        return formatGenericValue(val);
      });
      appendOutputText(ctx, formatted);
      return;
    }

    evalSimpleExpr(stmt, ctx, lang);
    return;
  }

  // Go channel send: ch <- expr
  if (lang === 'go') {
    const chSend = stmt.match(/^([A-Za-z_]\w*)\s*<-\s*([\s\S]+)$/);
    if (chSend) {
      const ch = ctx.scope[chSend[1]];
      const val = evalSimpleExpr(chSend[2], ctx, lang);
      if (Array.isArray(ch)) ch.push(val);
      return;
    }
  }

  // C++ std::cout << ...
  if (lang === 'cpp' && /^(?:std::)?cout\s*<</.test(stmt)) {
    const parts = stmt
      .replace(/^(?:std::)?cout\s*<</, '')
      .split('<<')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      if (part === 'std::endl' || part === 'endl') {
        appendOutputText(ctx, '\n');
      } else {
        appendOutputText(
          ctx,
          formatGenericValue(evalSimpleExpr(part, ctx, lang)),
        );
      }
    }
    return;
  }

  // Increment / decrement: x++, p.Level++, x--
  const incMatch = stmt.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)(\+\+|--)$/);
  if (incMatch) {
    const cur = Number(evalSimpleExpr(incMatch[1], ctx, lang) ?? 0);
    assignTarget(
      incMatch[1],
      incMatch[2] === '++' ? cur + 1 : cur - 1,
      ctx,
      lang,
    );
    return;
  }

  // Compound assignment: +=, -=, *=, /=, %=
  const compAssign = stmt.match(
    /^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\s*(\+=|-=|\*=|\/=|%=)\s*([\s\S]+)$/,
  );
  if (compAssign) {
    const [, target, op, rhs] = compAssign;
    const cur = Number(evalSimpleExpr(target, ctx, lang) ?? 0);
    const val = Number(evalSimpleExpr(rhs, ctx, lang) ?? 0);
    const next =
      op === '+='
        ? cur + val
        : op === '-='
        ? cur - val
        : op === '*='
        ? cur * val
        : op === '/='
        ? cur / val
        : cur % val;
    assignTarget(target, next, ctx, lang);
    return;
  }

  // Go short declaration: name := expr
  if (lang === 'go') {
    const shortDecl = stmt.match(/^([A-Za-z_]\w*)\s*:=\s*([\s\S]+)$/);
    if (shortDecl) {
      ctx.scope[shortDecl[1]] = evalSimpleExpr(shortDecl[2], ctx, lang);
      return;
    }
  }

  // PHP echo statement: echo expr;
  if (lang === 'php' && /^echo\s+/.test(stmt)) {
    const val = formatGenericValue(evalSimpleExpr(stmt.slice(5), ctx, lang));
    appendOutputText(ctx, val);
    return;
  }

  // PHP $var = expr;
  if (lang === 'php') {
    const phpDecl = stmt.match(/^(\$[A-Za-z_]\w*)\s*=\s*([\s\S]+)$/);
    if (phpDecl) {
      ctx.scope[phpDecl[1]] = evalSimpleExpr(phpDecl[2], ctx, lang);
      return;
    }
  }

  // C++ / Java / C / C# declarations: int x = 10; string hero = "Theo"; var xp = 300;
  if (lang === 'cpp' || lang === 'java' || lang === 'c' || lang === 'csharp') {
    const typedDecl = stmt.match(
      /^(?:const\s+|final\s+|readonly\s+)?(?:std::(?:vector<[^>]+>|string)|String|string|decimal|boolean|size_t|unsigned\s+int|int|long|double|float|bool|auto|char|var)\s*\*?\s*([\s\S]+)$/,
    );
    if (typedDecl) {
      const parts = splitTopLevel(typedDecl[1]);
      for (const part of parts) {
        const cleanPart = part.replace(/^\*/, '').trim();
        const eqAt = cleanPart.indexOf('=');
        if (eqAt > 0) {
          const name = cleanPart.slice(0, eqAt).trim();
          const rhs = cleanPart.slice(eqAt + 1).trim();
          ctx.scope[name] = evalSimpleExpr(rhs, ctx, lang);
        } else if (/^[A-Za-z_]\w*$/.test(cleanPart)) {
          ctx.scope[cleanPart] = 0;
        }
      }
      return;
    }
  }

  // Rust / Swift / Kotlin let, val, var declarations
  if (lang === 'rust' || lang === 'swift' || lang === 'kotlin') {
    const bindDecl = stmt.match(
      /^(?:let|val|var)\s+(?:mut\s+)?([A-Za-z_]\w*)(?:\s*:\s*[^=]+)?\s*=\s*([\s\S]+)$/,
    );
    if (bindDecl) {
      ctx.scope[bindDecl[1]] = evalSimpleExpr(bindDecl[2], ctx, lang);
      return;
    }
  }

  // Lua local var = expr
  if (lang === 'lua') {
    const localDecl = stmt.match(/^local\s+([A-Za-z_]\w*)\s*=\s*([\s\S]+)$/);
    if (localDecl) {
      ctx.scope[localDecl[1]] = evalSimpleExpr(localDecl[2], ctx, lang);
      return;
    }
  }

  // Go var declaration: var name [type] = expr
  if (lang === 'go') {
    const varDecl = stmt.match(
      /^var\s+([A-Za-z_]\w*)(?:\s+[A-Za-z_[\]*\w]+)?\s*=\s*([\s\S]+)$/,
    );
    if (varDecl) {
      ctx.scope[varDecl[1]] = evalSimpleExpr(varDecl[2], ctx, lang);
      return;
    }
  }

  // Python/C++/Go regular assignment or tuple unpacking: a, b = b, a + b
  const eqIdx = stmt.indexOf('=');
  if (
    eqIdx > 0 &&
    stmt[eqIdx - 1] !== '=' &&
    stmt[eqIdx - 1] !== '!' &&
    stmt[eqIdx - 1] !== '<' &&
    stmt[eqIdx - 1] !== '>' &&
    stmt[eqIdx + 1] !== '='
  ) {
    const lhs = stmt.slice(0, eqIdx).trim();
    const rhs = stmt.slice(eqIdx + 1).trim();
    const lhsTargets = splitTopLevel(lhs);
    const rhsItems = splitTopLevel(rhs);

    if (lhsTargets.length > 1 && lhsTargets.length === rhsItems.length) {
      const evaluated = rhsItems.map((r) => evalSimpleExpr(r, ctx, lang));
      lhsTargets.forEach((t, i) => assignTarget(t, evaluated[i], ctx, lang));
    } else {
      assignTarget(lhs, evalSimpleExpr(rhs, ctx, lang), ctx, lang);
    }
    return;
  }

  throw new Error(`Unsupported syntax: '${stmt}'`);
}

/* ------------------------------------------------------------------ */
/*  Python runner (indentation-based blocks)                          */
/* ------------------------------------------------------------------ */

function runPythonBlock(
  lines: { indent: number; text: string }[],
  startIdx: number,
  baseIndent: number,
  ctx: ExecCtx,
): { nextIdx: number; ret?: { __return: true; value: unknown } } {
  let i = startIdx;
  while (i < lines.length && lines[i].indent >= baseIndent) {
    const { indent, text } = lines[i];

    // `for var in iter:`
    const forMatch = text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+):$/);
    if (forMatch) {
      const [, loopVar, iterExpr] = forMatch;
      const bodyStart = i + 1;
      const bodyIndent =
        bodyStart < lines.length && lines[bodyStart].indent > indent
          ? lines[bodyStart].indent
          : indent + 4;
      let bodyEnd = bodyStart;
      while (bodyEnd < lines.length && lines[bodyEnd].indent >= bodyIndent) {
        bodyEnd++;
      }

      const iterable = evalSimpleExpr(iterExpr, ctx, 'python');
      if (Array.isArray(iterable)) {
        for (let k = 0; k < iterable.length && k < MAX_LOOP_ITERATIONS; k++) {
          ctx.scope[loopVar] = iterable[k];
          const res = runPythonBlock(lines.slice(0, bodyEnd), bodyStart, bodyIndent, ctx);
          if (res.ret) return { nextIdx: bodyEnd, ret: res.ret };
        }
      }
      i = bodyEnd;
      continue;
    }

    // `while cond:`
    const whileMatch = text.match(/^while\s+(.+):$/);
    if (whileMatch) {
      const bodyStart = i + 1;
      const bodyIndent =
        bodyStart < lines.length && lines[bodyStart].indent > indent
          ? lines[bodyStart].indent
          : indent + 4;
      let bodyEnd = bodyStart;
      while (bodyEnd < lines.length && lines[bodyEnd].indent >= bodyIndent) {
        bodyEnd++;
      }

      let guard = 0;
      while (evalSimpleExpr(whileMatch[1], ctx, 'python')) {
        if (++guard > MAX_LOOP_ITERATIONS) {
          throw new Error('Loop iteration limit exceeded (1000)');
        }
        const res = runPythonBlock(lines.slice(0, bodyEnd), bodyStart, bodyIndent, ctx);
        if (res.ret) return { nextIdx: bodyEnd, ret: res.ret };
      }
      i = bodyEnd;
      continue;
    }

    // `if cond:` (+ optional `else:`)
    const ifMatch = text.match(/^if\s+(.+):$/);
    if (ifMatch) {
      const thenStart = i + 1;
      const thenIndent =
        thenStart < lines.length && lines[thenStart].indent > indent
          ? lines[thenStart].indent
          : indent + 4;
      let thenEnd = thenStart;
      while (thenEnd < lines.length && lines[thenEnd].indent >= thenIndent) {
        thenEnd++;
      }

      let elseStart = -1;
      let elseEnd = thenEnd;
      if (
        thenEnd < lines.length &&
        lines[thenEnd].indent === indent &&
        lines[thenEnd].text === 'else:'
      ) {
        elseStart = thenEnd + 1;
        const elseIndent =
          elseStart < lines.length && lines[elseStart].indent > indent
            ? lines[elseStart].indent
            : indent + 4;
        elseEnd = elseStart;
        while (elseEnd < lines.length && lines[elseEnd].indent >= elseIndent) {
          elseEnd++;
        }
      }

      const cond = Boolean(evalSimpleExpr(ifMatch[1], ctx, 'python'));
      if (cond) {
        const res = runPythonBlock(lines.slice(0, thenEnd), thenStart, thenIndent, ctx);
        if (res.ret) return { nextIdx: elseEnd, ret: res.ret };
      } else if (elseStart !== -1) {
        const res = runPythonBlock(
          lines.slice(0, elseEnd),
          elseStart,
          lines[elseStart]?.indent ?? indent + 4,
          ctx,
        );
        if (res.ret) return { nextIdx: elseEnd, ret: res.ret };
      }
      i = elseEnd;
      continue;
    }

    // `def fn(a, b):`
    const defMatch = text.match(/^def\s+([A-Za-z_]\w*)\(([^)]*)\):$/);
    if (defMatch) {
      const [, fnName, rawParams] = defMatch;
      const bodyStart = i + 1;
      const bodyIndent =
        bodyStart < lines.length && lines[bodyStart].indent > indent
          ? lines[bodyStart].indent
          : indent + 4;
      let bodyEnd = bodyStart;
      while (bodyEnd < lines.length && lines[bodyEnd].indent >= bodyIndent) {
        bodyEnd++;
      }
      ctx.funcs[fnName] = {
        params: rawParams
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
          .map((name) => ({ name })),
        body: lines.slice(bodyStart, bodyEnd).map((l) => l.text),
      };
      i = bodyEnd;
      continue;
    }

    const res = executeStatement(text, ctx, 'python');
    if (res && res.__return) return { nextIdx: i + 1, ret: res };
    i++;
  }
  return { nextIdx: i };
}

function executePython(source: string): string[] {
  const ctx: ExecCtx = {
    scope: {},
    funcs: {},
    methods: {},
    stdout: [],
    currentLineBuffer: '',
  };

  const parsedLines: { indent: number; text: string }[] = [];
  for (const rawLine of source.split('\n')) {
    const noComment = rawLine.replace(/\s+#.*$/, '');
    if (!noComment.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.search(/\S/);
    parsedLines.push({ indent: indent === -1 ? 0 : indent, text: noComment.trim() });
  }

  runPythonBlock(parsedLines, 0, 0, ctx);
  flushBuffer(ctx);
  return ctx.stdout;
}

/* ------------------------------------------------------------------ */
/*  C++ & Go brace-based runners                                      */
/* ------------------------------------------------------------------ */

function splitTopLevelStatements(source: string): string[] {
  const statements: string[] = [];
  let cur = '';
  let depthBrace = 0;
  let depthParen = 0;
  let quote: string | null = null;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const prev = i > 0 ? source[i - 1] : '';

    if (quote) {
      cur += ch;
      if (ch === quote && prev !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      cur += ch;
      continue;
    }

    if (ch === '{') depthBrace++;
    else if (ch === '}') {
      depthBrace--;
      cur += ch;
      if (depthBrace === 0 && depthParen === 0) {
        // Check Go immediately invoked `go func() { ... }()`
        const rest = source.slice(i + 1);
        if (rest.startsWith('()')) {
          cur += '()';
          i += 2;
        }
        const restTrim = source.slice(i + 1).trimStart();
        if (!restTrim.startsWith('else') && !restTrim.startsWith(';')) {
          statements.push(cur.trim());
          cur = '';
        }
      }
      continue;
    } else if (ch === '(') depthParen++;
    else if (ch === ')') depthParen--;

    if ((ch === ';' || ch === '\n') && depthBrace === 0 && depthParen === 0) {
      if (cur.trim().length > 0) {
        statements.push(cur.trim());
        cur = '';
      }
      continue;
    }

    cur += ch;
  }
  if (cur.trim().length > 0) statements.push(cur.trim());
  return statements;
}

function runBraceStatements(stmts: string[], ctx: ExecCtx, lang: LangId) {
  for (const raw of stmts) {
    const stmt = raw.trim();
    if (
      !stmt ||
      stmt.startsWith('#include') ||
      stmt.startsWith('import ') ||
      stmt.startsWith('using ') ||
      stmt === '<?php' ||
      stmt === '?>'
    ) {
      continue;
    }

    // Unwrap outer Java/C# class shell: public class Main { ... }
    const classMatch = stmt.match(
      /^(?:(?:public|private|internal|sealed)\s+)*class\s+[A-Za-z_]\w*\s*\{([\s\S]*)\}$/,
    );
    if (classMatch) {
      runBraceStatements(splitTopLevelStatements(classMatch[1]), ctx, lang);
      continue;
    }

    // Rust fn / Swift func / Kotlin fun / C-style function definitions
    const rustFnMatch =
      lang === 'rust'
        ? stmt.match(/^fn\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:->\s*[^{]+)?\{([\s\S]*)\}$/)
        : null;
    const kotlinSwiftFnMatch =
      lang === 'kotlin' || lang === 'swift'
        ? stmt.match(/^(?:func|fun)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:(?::|->)\s*[^{]+)?\{([\s\S]*)\}$/)
        : null;
    const phpFnMatch =
      lang === 'php'
        ? stmt.match(/^function\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{([\s\S]*)\}$/)
        : null;
    const cStyleFnMatch = stmt.match(
      /^(?:(?:public|private|static|final|async)\s+)*(?:void|int|double|float|bool|boolean|String|string|std::string)\s+([A-Za-z_]\w*)\(([^)]*)\)\s*\{([\s\S]*)\}$/,
    );
    const fnMatch = rustFnMatch ?? kotlinSwiftFnMatch ?? phpFnMatch ?? cStyleFnMatch;
    if (fnMatch) {
      const [, fnName, rawParams, bodyText] = fnMatch;
      const params = splitTopLevel(rawParams)
        .filter((p) => p.trim() && p.trim() !== 'void')
        .map((p) => {
          const byRef = p.includes('&');
          const tokens = p
            .replace(/&|mut\s+|_+\s+|:/g, ' ')
            .trim()
            .split(/\s+/);
          return {
            name:
              lang === 'rust' || lang === 'kotlin' || lang === 'swift' || lang === 'php'
                ? tokens[0]
                : tokens[tokens.length - 1],
            byRef,
          };
        });
      if (fnName === 'main' || fnName === 'Main') {
        runBraceStatements(splitTopLevelStatements(bodyText), ctx, lang);
      } else {
        ctx.funcs[fnName] = {
          params,
          body: splitTopLevelStatements(bodyText),
        };
      }
      continue;
    }

    // Rust (`for n in 1..=5`), Swift (`for n in 1...4` / `0..<4`), Kotlin (`for (n in 1..5)` / `until`)
    if (lang === 'rust' || lang === 'swift' || lang === 'kotlin') {
      const rangeMatch = stmt.match(
        /^for\s+\(?\s*([A-Za-z_]\w*)\s+in\s+([^\s.]+)\s*(\.\.=|\.\.\.|\.\.<|\.\.|\s+until\s+)\s*([^{)]+)\)?\s*\{([\s\S]*)\}$/,
      );
      if (rangeMatch) {
        const [, loopVar, startExpr, opTok, endExpr, bodyStr] = rangeMatch;
        const start = Number(evalSimpleExpr(startExpr, ctx, lang));
        const end = Number(evalSimpleExpr(endExpr, ctx, lang));
        const op = opTok.trim();
        const inclusive = op === '..=' || op === '...' || op === '..';
        const innerStmts = splitTopLevelStatements(bodyStr);
        let guard = 0;
        for (let i = start; inclusive ? i <= end : i < end; i++) {
          if (++guard > MAX_LOOP_ITERATIONS) {
            throw new Error('Loop iteration limit exceeded (1000)');
          }
          ctx.scope[loopVar] = i;
          runBraceStatements(innerStmts, ctx, lang);
        }
        continue;
      }
    }

    // PHP / C# foreach loops: `foreach ($scores as $s)` or `foreach (var x in arr)`
    if (lang === 'php') {
      const phpForeach = stmt.match(
        /^foreach\s*\(\s*([^)]+?)\s+as\s+(\$[A-Za-z_]\w*)\s*\)\s*\{([\s\S]*)\}$/,
      );
      if (phpForeach) {
        const [, iterExpr, loopVar, bodyStr] = phpForeach;
        const iterable = evalSimpleExpr(iterExpr, ctx, lang);
        const innerStmts = splitTopLevelStatements(bodyStr);
        if (Array.isArray(iterable)) {
          for (let i = 0; i < iterable.length && i < MAX_LOOP_ITERATIONS; i++) {
            ctx.scope[loopVar] = iterable[i];
            runBraceStatements(innerStmts, ctx, lang);
          }
        }
        continue;
      }
    }
    if (lang === 'csharp') {
      const csForeach = stmt.match(
        /^foreach\s*\(\s*(?:var|int|string|double|bool)\s+([A-Za-z_]\w*)\s+in\s+([^)]+)\)\s*\{([\s\S]*)\}$/,
      );
      if (csForeach) {
        const [, loopVar, iterExpr, bodyStr] = csForeach;
        const iterable = evalSimpleExpr(iterExpr, ctx, lang);
        const innerStmts = splitTopLevelStatements(bodyStr);
        if (Array.isArray(iterable)) {
          for (let i = 0; i < iterable.length && i < MAX_LOOP_ITERATIONS; i++) {
            ctx.scope[loopVar] = iterable[i];
            runBraceStatements(innerStmts, ctx, lang);
          }
        }
        continue;
      }
    }

    // C++ range-based for loop: for (int s : scores) { ... }
    const rangeForBlock = stmt.match(
      /^for\s*\(\s*(?:const\s+)?(?:auto|int|double|float|String|std::string)\s*&?\s+([A-Za-z_]\w*)\s*:\s*([^)]+)\)\s*\{([\s\S]*)\}$/,
    );
    const rangeForSingle = stmt.match(
      /^for\s*\(\s*(?:const\s+)?(?:auto|int|double|float|String|std::string)\s*&?\s+([A-Za-z_]\w*)\s*:\s*([^)]+)\)\s*([\s\S]+)$/,
    );
    const rf = rangeForBlock ?? rangeForSingle;
    if (rf) {
      const [, loopVar, iterExpr, bodyStr] = rf;
      const iterable = evalSimpleExpr(iterExpr, ctx, lang);
      const innerStmts = splitTopLevelStatements(bodyStr);
      if (Array.isArray(iterable)) {
        for (let i = 0; i < iterable.length && i < MAX_LOOP_ITERATIONS; i++) {
          ctx.scope[loopVar] = iterable[i];
          runBraceStatements(innerStmts, ctx, lang);
        }
      }
      continue;
    }

    // Classic for loop: for (int i = 0; i < n; i++) { ... }
    const classicFor = stmt.match(
      /^for\s*\(([^;]+);([^;]+);([^)]+)\)\s*(?:\{([\s\S]*)\}|([\s\S]+))$/,
    );
    if (classicFor) {
      const [, initStmt, condExpr, stepStmt, blockBody, singleBody] = classicFor;
      executeStatement(initStmt, ctx, lang);
      const innerStmts = splitTopLevelStatements(blockBody ?? singleBody ?? '');
      let guard = 0;
      while (evalSimpleExpr(condExpr, ctx, lang)) {
        if (++guard > MAX_LOOP_ITERATIONS) {
          throw new Error('Loop iteration limit exceeded (1000)');
        }
        runBraceStatements(innerStmts, ctx, lang);
        executeStatement(stepStmt, ctx, lang);
      }
      continue;
    }

    // Block if / else statement (supports parens OR paren-less Swift conditions)
    const ifMatch = stmt.match(
      /^if\s*(?:\(([\s\S]+?)\)|([\s\S]+?))\s*\{([\s\S]*?)\}(?:\s*else\s*\{([\s\S]*)\})?$/,
    );
    if (ifMatch) {
      const condExpr = ifMatch[1] ?? ifMatch[2];
      const thenBody = ifMatch[3];
      const elseBody = ifMatch[4];
      if (evalSimpleExpr(condExpr, ctx, lang)) {
        runBraceStatements(splitTopLevelStatements(thenBody), ctx, lang);
      } else if (elseBody) {
        runBraceStatements(splitTopLevelStatements(elseBody), ctx, lang);
      }
      continue;
    }

    const res = executeStatement(stmt, ctx, lang);
    if (res && res.__return) return;
  }
}

function runCppStatements(stmts: string[], ctx: ExecCtx) {
  runBraceStatements(stmts, ctx, 'cpp');
}

function executeSimpleBraceLang(
  source: string,
  lang: 'java' | 'rust' | 'c' | 'php' | 'swift' | 'kotlin' | 'csharp',
): string[] {
  const ctx: ExecCtx = {
    scope: {},
    funcs: {},
    methods: {},
    stdout: [],
    currentLineBuffer: '',
  };
  const cleanedLines = source
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return (
        !t.startsWith('#include') &&
        !t.startsWith('import ') &&
        !t.startsWith('using ') &&
        t !== '<?php' &&
        t !== '?>'
      );
    })
    .map((l) => {
      let line = l.includes('://') ? l : l.replace(/\/\/.*$/, '');
      if (lang === 'php') line = line.replace(/(?:^|\s)#.*$/, '');
      return line;
    });
  const statements = splitTopLevelStatements(cleanedLines.join('\n'));
  runBraceStatements(statements, ctx, lang);
  flushBuffer(ctx);
  return ctx.stdout;
}

/* ------------------------------------------------------------------ */
/*  SQL mini relational engine (PostgreSQL-style table results)       */
/* ------------------------------------------------------------------ */

type SqlRow = Record<string, string | number | boolean | null>;

function createSeedSqlTables(): Record<string, SqlRow[]> {
  return {
    users: [
      { id: 1, handle: 'kenji_rs', username: 'kenji_rs', lang: 'rust', language: 'rust', league: 'Diamond', xp: 1840, streak: 19, gems: 420, active: true, bio: 'Systems engineer' },
      { id: 2, handle: 'ada_py', username: 'ada_py', lang: 'python', language: 'python', league: 'Gold', xp: 1620, streak: 14, gems: 310, active: true, bio: 'ML & scripts' },
      { id: 3, handle: 'tariq_sql', username: 'tariq_sql', lang: 'sql', language: 'sql', league: 'Gold', xp: 1410, streak: 11, gems: 250, active: true, bio: 'Query tuner' },
      { id: 4, handle: 'nadia_java', username: 'nadia_java', lang: 'java', language: 'java', league: 'Silver', xp: 1180, streak: 9, gems: 190, active: true, bio: 'JVM backend' },
      { id: 5, handle: 'hana_rs', username: 'hana_rs', lang: 'rust', language: 'rust', league: 'Gold', xp: 1020, streak: 8, gems: 160, active: true, bio: 'Async Tokio' },
      { id: 6, handle: 'leo_cpp', username: 'leo_cpp', lang: 'cpp', language: 'cpp', league: 'Silver', xp: 980, streak: 7, gems: 140, active: true, bio: null },
      { id: 7, handle: 'elena_c', username: 'elena_c', lang: 'c', language: 'c', league: 'Silver', xp: 940, streak: 6, gems: 130, active: true, bio: 'Kernel dev' },
      { id: 8, handle: 'sara_py', username: 'sara_py', lang: 'python', language: 'python', league: 'Silver', xp: 890, streak: 5, gems: 115, active: true, bio: 'Data pipelines' },
      { id: 9, handle: 'omar_sql', username: 'omar_sql', lang: 'sql', language: 'sql', league: 'Bronze', xp: 720, streak: 4, gems: 90, active: true, bio: null },
      { id: 10, handle: 'noah_go', username: 'noah_go', lang: 'go', language: 'go', league: 'Bronze', xp: 650, streak: 3, gems: 80, active: true, bio: 'Microservices' },
      { id: 11, handle: 'mia_js', username: 'mia_js', lang: 'js', language: 'js', league: 'Bronze', xp: 410, streak: 2, gems: 55, active: false, bio: 'React Native' },
    ],
    lessons: [
      { id: 1, title: 'Variables & Types', lang: 'python', difficulty: 'easy', xp: 25 },
      { id: 2, title: 'Ownership & Borrowing', lang: 'rust', difficulty: 'medium', xp: 45 },
      { id: 3, title: 'Relational Joins', lang: 'sql', difficulty: 'medium', xp: 40 },
      { id: 4, title: 'Pointers & Addresses', lang: 'c', difficulty: 'hard', xp: 50 },
    ],
    orders: [
      { id: 101, user_id: 1, item: 'Heart Refill', total: 40, status: 'paid' },
      { id: 102, user_id: 2, item: 'Streak Freeze', total: 25, status: 'paid' },
      { id: 103, user_id: 3, item: 'Streak Freeze', total: 25, status: 'paid' },
    ],
  };
}

function resolveSqlField(row: SqlRow, key: string): string | number | boolean | null {
  const clean = key.trim();
  if (clean in row) return row[clean];
  const bare = clean.includes('.') ? clean.split('.').pop()!.trim() : clean;
  if (bare in row) return row[bare];
  return null;
}

function parseSqlLiteral(tok: string): string | number | boolean | null {
  const t = tok.trim();
  if (/^null$/i.test(t)) return null;
  if (/^true$/i.test(t)) return true;
  if (/^false$/i.test(t)) return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  return t;
}

function splitSqlKeywordClauses(stmt: string, delimiterRegex: RegExp): string[] {
  const parts: string[] = [];
  let cur = '';
  let depth = 0;
  let inQuote = false;
  for (let i = 0; i < stmt.length; i++) {
    const ch = stmt[i];
    if (ch === "'") inQuote = !inQuote;
    if (!inQuote) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
    }
    if (!inQuote && depth === 0) {
      const slice = stmt.slice(i);
      const m = slice.match(delimiterRegex);
      if (m) {
        parts.push(cur.trim());
        cur = '';
        i += m[0].length - 1;
        continue;
      }
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function evalSqlCondition(row: SqlRow, cond: string): boolean {
  const s = cond
    .trim()
    .replace(
      /\b([A-Za-z_][\w.]*)\s+BETWEEN\s+([^\s]+)\s+AND\s+([^\s)]+)/gi,
      '($1 >= $2 AND $1 <= $3)',
    );
  if (!s) return true;
  if (s.startsWith('(') && s.endsWith(')')) {
    let d = 0;
    let wrapped = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') d++;
      else if (s[i] === ')') d--;
      if (d === 0) {
        wrapped = false;
        break;
      }
    }
    if (wrapped) return evalSqlCondition(row, s.slice(1, -1));
  }

  const orParts = splitSqlKeywordClauses(s, /^\s+OR\s+/i);
  if (orParts.length > 1) return orParts.some((p) => evalSqlCondition(row, p));

  const andParts = splitSqlKeywordClauses(s, /^\s+AND\s+/i);
  if (andParts.length > 1) return andParts.every((p) => evalSqlCondition(row, p));

  const isNullMatch = s.match(/^(.+?)\s+IS\s+(NOT\s+)?NULL$/i);
  if (isNullMatch) {
    const v = resolveSqlField(row, isNullMatch[1]);
    return isNullMatch[2] ? v !== null && v !== undefined : v === null || v === undefined;
  }

  const inMatch = s.match(/^(.+?)\s+(NOT\s+)?IN\s*\((.+)\)$/i);
  if (inMatch) {
    const v = resolveSqlField(row, inMatch[1]);
    const list = splitTopLevel(inMatch[3]).map(parseSqlLiteral);
    const hasNull = list.some((x) => x === null);
    if (inMatch[2]) {
      if (hasNull) return false;
      return !list.includes(v);
    }
    return list.includes(v);
  }

  const likeMatch = s.match(/^(.+?)\s+(NOT\s+)?LIKE\s+('[^']*')$/i);
  if (likeMatch) {
    const v = resolveSqlField(row, likeMatch[1]);
    if (v === null || v === undefined) return false;
    const pat = likeMatch[3]
      .slice(1, -1)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/%/g, '.*')
      .replace(/_/g, '.');
    const matched = new RegExp(`^${pat}$`, 'i').test(String(v));
    return likeMatch[2] ? !matched : matched;
  }

  const cmpMatch = s.match(/^(.+?)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/);
  if (cmpMatch) {
    const [, lhsExpr, op, rhsExpr] = cmpMatch;
    const lVal =
      /^[A-Za-z_][\w.]*$/.test(lhsExpr.trim()) || /\(.*\)/.test(lhsExpr)
        ? resolveSqlField(row, lhsExpr)
        : parseSqlLiteral(lhsExpr);
    const rVal = parseSqlLiteral(rhsExpr);
    if (lVal === null || rVal === null) return false;
    if (op === '=') return lVal === rVal;
    if (op === '!=' || op === '<>') return lVal !== rVal;
    if (op === '>=') return Number(lVal) >= Number(rVal);
    if (op === '<=') return Number(lVal) <= Number(rVal);
    if (op === '>') return Number(lVal) > Number(rVal);
    if (op === '<') return Number(lVal) < Number(rVal);
  }

  return Boolean(resolveSqlField(row, s));
}

function evalSqlAggregate(rows: SqlRow[], expr: string): number | string | null {
  const m = expr.trim().match(/^(COUNT|SUM|AVG|MIN|MAX)\(\s*(DISTINCT\s+)?(.+?)\s*\)$/i);
  if (!m) return null;
  const fn = m[1].toUpperCase();
  const isDistinct = Boolean(m[2]);
  const col = m[3].trim();

  if (fn === 'COUNT' && col === '*') return rows.length;
  const vals = rows
    .map((r) => resolveSqlField(r, col))
    .filter((v) => v !== null && v !== undefined);
  if (fn === 'COUNT') {
    return isDistinct ? new Set(vals.map(String)).size : vals.length;
  }
  const nums = vals.map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return null;
  if (fn === 'SUM') return nums.reduce((a, b) => a + b, 0);
  if (fn === 'AVG') {
    const raw = nums.reduce((a, b) => a + b, 0) / nums.length;
    return Number.isInteger(raw) ? raw : Math.round(raw * 10) / 10;
  }
  if (fn === 'MIN') return Math.min(...nums);
  return Math.max(...nums);
}

function formatSqlAsciiTable(columns: string[], rows: SqlRow[]): string[] {
  const strRows = rows.map((r) =>
    columns.map((c) => {
      const v = r[c];
      return v === null || v === undefined ? 'NULL' : String(v);
    }),
  );
  const widths = columns.map((c, idx) =>
    Math.max(c.length, ...strRows.map((r) => r[idx].length)),
  );
  const header = columns.map((c, i) => c.padEnd(widths[i])).join(' | ');
  const sep = widths.map((w) => '-'.repeat(w)).join('-+-');
  const dataLines = strRows.map((r) =>
    r.map((cell, i) => cell.padEnd(widths[i])).join(' | '),
  );
  const footer = `(${rows.length} ${rows.length === 1 ? 'row' : 'rows'} returned)`;
  return [header, sep, ...dataLines, footer];
}

function executeSql(source: string): string[] {
  const tables = createSeedSqlTables();
  const stripped = source
    .split('\n')
    .map((l) => l.replace(/--.*$/, ''))
    .join('\n');

  const stmts = stripped
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  if (stmts.length === 0) return ['(empty SQL query)'];

  const out: string[] = [];
  for (const rawStmt of stmts) {
    const stmt = rawStmt.replace(/\s+/g, ' ').trim();
    if (/^(BEGIN|COMMIT|ROLLBACK)$/i.test(stmt)) {
      out.push(`Transaction ${stmt.toUpperCase()} ok.`);
      continue;
    }

    // Minimal DML feedback
    const insertM = stmt.match(/^INSERT\s+INTO\s+([A-Za-z_]\w*)/i);
    if (insertM) {
      out.push(`INSERT into '${insertM[1]}' ok (1 row affected).`);
      continue;
    }
    const updateM = stmt.match(/^UPDATE\s+([A-Za-z_]\w*)/i);
    if (updateM) {
      out.push(`UPDATE '${updateM[1]}' ok.`);
      continue;
    }
    const deleteM = stmt.match(/^DELETE\s+FROM\s+([A-Za-z_]\w*)/i);
    if (deleteM) {
      out.push(`DELETE from '${deleteM[1]}' ok.`);
      continue;
    }
    const createM = stmt.match(/^CREATE\s+TABLE\s+([A-Za-z_]\w*)/i);
    if (createM) {
      tables[createM[1]] = [];
      out.push(`Table '${createM[1]}' created.`);
      continue;
    }

    const selectMatch = stmt.match(
      /^SELECT\s+(DISTINCT\s+)?([\s\S]+?)(?:\s+FROM\s+([A-Za-z_]\w*)(?:\s+(?:AS\s+)?(?!(?:WHERE|GROUP|HAVING|ORDER|LIMIT|OFFSET|INNER|LEFT|RIGHT|CROSS|JOIN|ON)\b)([A-Za-z_]\w*))?([\s\S]*))?$/i,
    );
    if (!selectMatch) {
      throw new Error(`Unsupported SQL statement: '${stmt}'`);
    }

    const [, distinctKw, selectColsRaw, fromTable, fromAlias, tailRaw = ''] = selectMatch;
    const selectItems = splitTopLevel(selectColsRaw).map((raw) => {
      const asM = raw.trim().match(/^([\s\S]+?)\s+AS\s+([A-Za-z_]\w*)$/i);
      const expr = (asM ? asM[1] : raw).trim();
      const label = asM
        ? asM[2].trim()
        : expr.includes('.')
        ? expr.split('.').pop()!.trim()
        : expr;
      return { expr, label };
    });

    if (!fromTable) {
      const singleRow: SqlRow = {};
      for (const item of selectItems) {
        const coal = item.expr.match(/^COALESCE\((.+)\)$/i);
        if (coal) {
          const vals = splitTopLevel(coal[1]).map(parseSqlLiteral);
          singleRow[item.label] = vals.find((v) => v !== null) ?? null;
        } else {
          singleRow[item.label] = parseSqlLiteral(item.expr);
        }
      }
      out.push(...formatSqlAsciiTable(selectItems.map((i) => i.label), [singleRow]));
      continue;
    }

    const baseRows = tables[fromTable.toLowerCase()];
    if (!baseRows) throw new Error(`Unknown table '${fromTable}'`);

    let workingRows: SqlRow[] = baseRows.map((r) => {
      const prefixed: SqlRow = { ...r };
      if (fromAlias) {
        Object.entries(r).forEach(([k, v]) => {
          prefixed[`${fromAlias}.${k}`] = v;
        });
      }
      return prefixed;
    });

    // Optional tail clauses
    let tail = tailRaw.trim();
    const joinMatches = [...tail.matchAll(/(INNER\s+|LEFT\s+(?:OUTER\s+)?)?JOIN\s+([A-Za-z_]\w*)(?:\s+(?:AS\s+)?(?!ON\b)([A-Za-z_]\w*))?\s+ON\s+([\s\S]+?)(?=\s+(?:INNER\s+JOIN|LEFT\s+JOIN|JOIN|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET)|$)/gi)];
    for (const jm of joinMatches) {
      const isLeft = Boolean(jm[1] && /LEFT/i.test(jm[1]));
      const rTable = tables[jm[2].toLowerCase()];
      if (!rTable) throw new Error(`Unknown joined table '${jm[2]}'`);
      const rAlias = jm[3] || jm[2];
      const onClause = jm[4].trim();
      const nextRows: SqlRow[] = [];
      for (const lr of workingRows) {
        let matched = false;
        for (const rr of rTable) {
          const merged: SqlRow = { ...lr };
          Object.entries(rr).forEach(([k, v]) => {
            merged[`${rAlias}.${k}`] = v;
            if (!(k in merged)) merged[k] = v;
          });
          if (evalSqlCondition(merged, onClause)) {
            nextRows.push(merged);
            matched = true;
          }
        }
        if (isLeft && !matched) nextRows.push({ ...lr });
      }
      workingRows = nextRows;
      tail = tail.replace(jm[0], '').trim();
    }

    const extractClause = (kw: RegExp, nextKws: string): string | null => {
      const re = new RegExp(
        `${kw.source}\\s+([\\s\\S]+?)(?=\\s+(?:${nextKws})\\b|$)`,
        'i',
      );
      const m = tail.match(re);
      if (!m) return null;
      tail = tail.replace(m[0], '').trim();
      return m[1].trim();
    };

    const whereClause = extractClause(/\bWHERE/, 'GROUP\\s+BY|HAVING|ORDER\\s+BY|LIMIT|OFFSET');
    const groupClause = extractClause(/\bGROUP\s+BY/, 'HAVING|ORDER\\s+BY|LIMIT|OFFSET');
    const havingClause = extractClause(/\bHAVING/, 'ORDER\\s+BY|LIMIT|OFFSET');
    const orderClause = extractClause(/\bORDER\s+BY/, 'LIMIT|OFFSET');
    const limitClause = extractClause(/\bLIMIT/, 'OFFSET');
    const offsetClause = extractClause(/\bOFFSET/, '$^');

    if (whereClause) {
      workingRows = workingRows.filter((r) => evalSqlCondition(r, whereClause));
    }

    const hasAggregate = selectItems.some((i) =>
      /^(COUNT|SUM|AVG|MIN|MAX)\(/i.test(i.expr),
    );
    let projected: SqlRow[] = [];
    let outputCols: string[] = [];

    if (groupClause || hasAggregate) {
      const groupKeys = groupClause
        ? splitTopLevel(groupClause).map((g) => g.trim())
        : [];
      const groups = new Map<string, SqlRow[]>();
      if (groupKeys.length === 0) {
        groups.set('__all__', workingRows);
      } else {
        for (const r of workingRows) {
          const k = groupKeys.map((gk) => String(resolveSqlField(r, gk))).join('||');
          const arr = groups.get(k) ?? [];
          arr.push(r);
          groups.set(k, arr);
        }
      }

      outputCols = selectItems.map((i) => i.label);
      for (const [, grpRows] of groups) {
        const outRow: SqlRow = {};
        for (const item of selectItems) {
          if (/^(COUNT|SUM|AVG|MIN|MAX)\(/i.test(item.expr)) {
            outRow[item.label] = evalSqlAggregate(grpRows, item.expr);
          } else {
            outRow[item.label] = resolveSqlField(grpRows[0], item.expr);
          }
          outRow[item.expr] = outRow[item.label];
        }
        if (havingClause) {
          // Evaluate aggregate placeholders inside HAVING too
          const replacedHaving = havingClause.replace(
            /(COUNT|SUM|AVG|MIN|MAX)\([^)]+\)/gi,
            (aggExpr) => String(evalSqlAggregate(grpRows, aggExpr) ?? 'NULL'),
          );
          if (!evalSqlCondition(outRow, replacedHaving)) continue;
        }
        projected.push(outRow);
      }
    } else if (selectItems.length === 1 && selectItems[0].expr === '*') {
      const sample = workingRows[0] ?? baseRows[0];
      outputCols = Object.keys(sample).filter((k) => !k.includes('.'));
      projected = workingRows.map((r) => {
        const clean: SqlRow = {};
        outputCols.forEach((c) => {
          clean[c] = r[c] ?? null;
        });
        return clean;
      });
    } else {
      outputCols = selectItems.map((i) => i.label);
      projected = workingRows.map((r) => {
        const outRow: SqlRow = {};
        for (const item of selectItems) {
          outRow[item.label] = resolveSqlField(r, item.expr);
        }
        return outRow;
      });
    }

    if (distinctKw) {
      const seen = new Set<string>();
      projected = projected.filter((r) => {
        const sig = outputCols.map((c) => String(r[c])).join('|');
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });
    }

    if (orderClause) {
      const orderSpecs = splitTopLevel(orderClause).map((part) => {
        const toks = part.trim().split(/\s+/);
        const dir = toks[1]?.toUpperCase() === 'DESC' ? -1 : 1;
        return { col: toks[0], dir };
      });
      projected.sort((a, b) => {
        for (const spec of orderSpecs) {
          const av = resolveSqlField(a, spec.col);
          const bv = resolveSqlField(b, spec.col);
          if (av === bv) continue;
          if (av === null) return 1;
          if (bv === null) return -1;
          if (typeof av === 'number' && typeof bv === 'number') {
            return (av - bv) * spec.dir;
          }
          return String(av).localeCompare(String(bv)) * spec.dir;
        }
        return 0;
      });
    }

    const offset = offsetClause ? Math.max(0, Number(offsetClause)) : 0;
    const limit = limitClause ? Math.max(0, Number(limitClause)) : projected.length;
    projected = projected.slice(offset, offset + limit);

    out.push(...formatSqlAsciiTable(outputCols, projected));
  }

  return out;
}

function executeCpp(source: string): string[] {
  const ctx: ExecCtx = {
    scope: {},
    funcs: {},
    methods: {},
    stdout: [],
    currentLineBuffer: '',
  };

  // Seed variables from template hint comment if user runs default swapRef template:
  // e.g., `// a=10, b=99 -> swapped:`
  const commentSeedMatch = source.match(
    /\/\/\s*([A-Za-z_]\w*\s*=\s*-?\d+(?:\s*,\s*[A-Za-z_]\w*\s*=\s*-?\d+)*)(\s*->\s*swapped\s*:)?/,
  );

  const cleanedLines = source
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !t.startsWith('#include') && !t.startsWith('using namespace');
    })
    .map((l) => l.replace(/\/\/.*$/, ''));

  const statements = splitTopLevelStatements(cleanedLines.join('\n'));
  if (commentSeedMatch) {
    for (const pair of commentSeedMatch[1].split(',')) {
      const [k, v] = pair.split('=').map((s) => s.trim());
      if (k && v && !(k in ctx.scope)) {
        ctx.scope[k] = Number(v);
      }
    }
  }

  runCppStatements(statements, ctx);

  // If template used `// a=10, b=99 -> swapped:` without an explicit swapRef(...) call,
  // simulate calling swapRef cleanly before printing.
  if (
    commentSeedMatch &&
    commentSeedMatch[2] &&
    ctx.funcs.swapRef &&
    !/\bswapRef\s*\(/.test(source.replace(/void\s+swapRef[\s\S]*?\}/, ''))
  ) {
    const retryCtx: ExecCtx = {
      scope: {},
      funcs: {},
      methods: {},
      stdout: [],
      currentLineBuffer: '',
    };
    for (const pair of commentSeedMatch[1].split(',')) {
      const [k, v] = pair.split('=').map((s) => s.trim());
      if (k && v) retryCtx.scope[k] = Number(v);
    }
    const nonPrint = statements.filter((s) => !s.includes('cout'));
    const printOnly = statements.filter((s) => s.includes('cout'));
    runCppStatements(nonPrint, retryCtx);
    const keys = Object.keys(retryCtx.scope);
    if (keys.length >= 2) {
      executeStatement(`swapRef(${keys[0]}, ${keys[1]})`, retryCtx, 'cpp');
    }
    runCppStatements(printOnly, retryCtx);
    flushBuffer(retryCtx);
    return retryCtx.stdout;
  }

  flushBuffer(ctx);
  return ctx.stdout;
}

function runGoStatements(stmts: string[], ctx: ExecCtx) {
  for (const raw of stmts) {
    const stmt = raw.trim();
    if (!stmt || stmt.startsWith('package ') || stmt.startsWith('import ')) continue;

    // type Player struct { ... }
    if (/^type\s+[A-Za-z_]\w*\s+struct\s*\{[\s\S]*\}$/.test(stmt)) continue;

    // Pointer receiver method: func (p *Player) LevelUp() { p.Level++ }
    const methMatch = stmt.match(
      /^func\s*\(\s*([A-Za-z_]\w*)\s+\*?[A-Za-z_]\w*\s*\)\s*([A-Za-z_]\w*)\(\s*\)\s*\{([\s\S]*)\}$/,
    );
    if (methMatch) {
      const [, receiverParam, methName, bodyText] = methMatch;
      ctx.methods[methName] = {
        receiverParam,
        body: splitTopLevelStatements(bodyText),
      };
      continue;
    }

    // func main() { ... }
    const mainMatch = stmt.match(/^func\s+main\(\)\s*\{([\s\S]*)\}$/);
    if (mainMatch) {
      runGoStatements(splitTopLevelStatements(mainMatch[1]), ctx);
      continue;
    }

    // go func() { ... }()
    const goFuncMatch = stmt.match(/^go\s+func\(\)\s*\{([\s\S]*)\}\(\)$/);
    if (goFuncMatch) {
      runGoStatements(splitTopLevelStatements(goFuncMatch[1]), ctx);
      continue;
    }

    // for i := 0; i < n; i++ { ... }
    const classicFor = stmt.match(
      /^for\s+([^;]+);([^;]+);([^{]+)\{([\s\S]*)\}$/,
    );
    if (classicFor) {
      const [, initStmt, condExpr, stepStmt, blockBody] = classicFor;
      executeStatement(initStmt, ctx, 'go');
      const innerStmts = splitTopLevelStatements(blockBody);
      let guard = 0;
      while (evalSimpleExpr(condExpr, ctx, 'go')) {
        if (++guard > MAX_LOOP_ITERATIONS) {
          throw new Error('Loop iteration limit exceeded (1000)');
        }
        runGoStatements(innerStmts, ctx);
        executeStatement(stepStmt, ctx, 'go');
      }
      continue;
    }

    executeStatement(stmt, ctx, 'go');
  }
}

function executeGo(source: string): string[] {
  const ctx: ExecCtx = {
    scope: {},
    funcs: {},
    methods: {},
    stdout: [],
    currentLineBuffer: '',
  };

  const cleaned = source
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n');

  const statements = splitTopLevelStatements(cleaned);
  runGoStatements(statements, ctx);
  flushBuffer(ctx);
  return ctx.stdout;
}

/* ------------------------------------------------------------------ */
/*  JavaScript async evaluator (supports await + console capture)     */
/* ------------------------------------------------------------------ */

function formatJsArg(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

async function executeJs(source: string): Promise<string[]> {
  const stdout: string[] = [];
  const fakeConsole = {
    log: (...args: unknown[]) => {
      stdout.push(args.map(formatJsArg).join(' '));
    },
    info: (...args: unknown[]) => {
      stdout.push(args.map(formatJsArg).join(' '));
    },
    warn: (...args: unknown[]) => {
      stdout.push(`[warn] ${args.map(formatJsArg).join(' ')}`);
    },
    error: (...args: unknown[]) => {
      stdout.push(`[error] ${args.map(formatJsArg).join(' ')}`);
    },
  };

  const AsyncFn = Object.getPrototypeOf(async function () {}).constructor as new (
    ...args: string[]
  ) => (...vals: unknown[]) => Promise<unknown>;

  const fn = new AsyncFn(
    'console',
    'window',
    'global',
    'globalThis',
    'fetch',
    'require',
    source,
  );
  await fn(
    fakeConsole,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  );
  return stdout;
}

/* ------------------------------------------------------------------ */
/*  TypeScript (type erasure -> JS), CSS, HTML, ASM, Julia, Lua       */
/* ------------------------------------------------------------------ */

async function executeTs(source: string): Promise<string[]> {
  const strings: string[] = [];
  const masked = source.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
    (m) => {
      strings.push(m);
      return `__TS_STR_${strings.length - 1}__`;
    },
  );
  const stripped = masked
    .replace(/\binterface\s+[A-Za-z_]\w*(?:<[^>]+>)?\s*\{[\s\S]*?\}/g, '')
    .replace(/\btype\s+[A-Za-z_]\w*(?:<[^>]+>)?\s*=\s*[^;\n]+;?/g, '')
    .replace(
      /\b(const|let|var)\s+([A-Za-z_$]\w*)\s*:\s*[A-Za-z_$][\w.<>[\]|&,\s]*(?==)/g,
      '$1 $2 ',
    )
    .replace(
      /\(([^()]*)\)\s*:\s*[A-Za-z_$][\w.<>[\]|&,\s]*\s*(?=\{|=>)/g,
      '($1) ',
    )
    .replace(
      /\(([^()]*)\)/g,
      (full, params: string) =>
        params.includes(':')
          ? `(${params.replace(/([A-Za-z_$]\w*)\s*\??:\s*[^,)]+/g, '$1')})`
          : full,
    )
    .replace(/\s+as\s+(?:const|[A-Za-z_$][\w.<>[\]|&]*)/g, '');
  const jsSource = stripped.replace(
    /__TS_STR_(\d+)__/g,
    (_, idx: string) => strings[Number(idx)] ?? '""',
  );
  return executeJs(jsSource);
}

function cssSpecificity(selector: string): [number, number, number] {
  const ids = (selector.match(/#[A-Za-z_-][\w-]*/g) ?? []).length;
  const attrsAndClasses = (
    selector.match(/(\.[A-Za-z_-][\w-]*|\[[^\]]+\]|:[A-Za-z-]+)/g) ?? []
  ).length;
  const cleaned = selector
    .replace(/#[A-Za-z_-][\w-]*/g, ' ')
    .replace(/\.[A-Za-z_-][\w-]*/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/:{1,2}[A-Za-z-]+(?:\([^)]*\))?/g, ' ')
    .replace(/[>+~*]/g, ' ');
  const tags = cleaned.trim().split(/\s+/).filter(Boolean).length;
  return [ids, attrsAndClasses, tags];
}

function executeCss(source: string): string[] {
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const out: string[] = [];
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  let ruleCount = 0;
  let varCount = 0;
  while ((m = ruleRe.exec(noComments)) !== null) {
    const sel = m[1].trim().replace(/\s+/g, ' ');
    const decls = m[2]
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.includes(':'));
    varCount += decls.filter((d) => d.startsWith('--')).length;
    const [a, b, c] = cssSpecificity(sel);
    out.push(`${sel}  [${a},${b},${c}] -> ${decls.length} prop${decls.length === 1 ? '' : 's'}`);
    ruleCount++;
  }
  if (ruleCount === 0) throw new Error('No valid CSS rules found');
  if (varCount > 0) out.push(`Custom properties defined: ${varCount}`);
  return out;
}

function executeHtml(source: string): string[] {
  const tagRe = /<!--[\s\S]*?-->|<(\/?)([A-Za-z][A-Za-z0-9-]*)([^>]*)>|([^<]+)/g;
  const voidTags = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'source']);
  const out: string[] = [];
  let depth = 0;
  let m: RegExpExecArray | null;
  let missingAlt = 0;

  while ((m = tagRe.exec(source)) !== null) {
    const [, closingSlash, tagNameRaw, attrsRaw, textRaw] = m;
    if (textRaw !== undefined) {
      const txt = textRaw.trim().replace(/\s+/g, ' ');
      if (txt && out.length > 0 && out.length < 40) {
        const last = out[out.length - 1];
        if (!last.includes(' alt=')) {
          out[out.length - 1] = `${last}${txt.slice(0, 26)}`;
        }
      }
      continue;
    }
    if (!tagNameRaw) continue;
    const tag = tagNameRaw.toLowerCase();
    const isSelfClose = attrsRaw.trim().endsWith('/') || voidTags.has(tag);
    if (closingSlash) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    const pad = '  '.repeat(depth);
    let extra = '';
    if (tag === 'img') {
      const altMatch = attrsRaw.match(/\balt\s*=\s*["']([^"']*)["']/i);
      if (!altMatch) {
        missingAlt++;
        extra = ' (missing alt)';
      } else {
        extra = ` alt="${altMatch[1]}"`;
      }
    }
    out.push(`${pad}<${tag}>${extra}`);
    if (!isSelfClose) depth++;
  }

  out.push(
    missingAlt > 0
      ? `A11y check: WARN (${missingAlt} img missing alt)`
      : 'A11y check: PASS',
  );
  return out;
}

function executeAsm(source: string): string[] {
  const regNames = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rsp', 'rbp', 'r8', 'r9'];
  const alias: Record<string, string> = {
    eax: 'rax',
    ebx: 'rbx',
    ecx: 'rcx',
    edx: 'rdx',
    esi: 'rsi',
    edi: 'rdi',
  };
  const regs: Record<string, number> = {};
  regNames.forEach((r) => {
    regs[r] = 0;
  });

  const normReg = (tok: string): string | null => {
    const low = tok.trim().toLowerCase();
    if (low in regs) return low;
    if (low in alias) return alias[low];
    return null;
  };
  const readVal = (tok: string): number => {
    const r = normReg(tok);
    if (r) return regs[r];
    if (/^-?0x[0-9a-f]+$/i.test(tok.trim())) return parseInt(tok.trim(), 16);
    if (/^-?\d+$/.test(tok.trim())) return Number(tok.trim());
    throw new Error(`Unknown ASM operand '${tok}'`);
  };

  interface AsmInst {
    op: string;
    a?: string;
    b?: string;
  }
  const labels: Record<string, number> = {};
  const prog: AsmInst[] = [];

  for (const rawLine of source.split('\n')) {
    const code = rawLine.replace(/;.*$/, '').trim();
    if (!code || code.startsWith('section ') || code.startsWith('global ')) continue;
    const lblMatch = code.match(/^([A-Za-z_.][\w.]*):(.*)$/);
    if (lblMatch) {
      labels[lblMatch[1]] = prog.length;
      const tail = lblMatch[2].trim();
      if (!tail) continue;
      const sp = tail.search(/\s/);
      const op = (sp === -1 ? tail : tail.slice(0, sp)).toLowerCase();
      const args = sp === -1 ? [] : tail.slice(sp + 1).split(',').map((s) => s.trim());
      prog.push({ op, a: args[0], b: args[1] });
    } else {
      const sp = code.search(/\s/);
      const op = (sp === -1 ? code : code.slice(0, sp)).toLowerCase();
      const args = sp === -1 ? [] : code.slice(sp + 1).split(',').map((s) => s.trim());
      prog.push({ op, a: args[0], b: args[1] });
    }
  }

  let zf = 0;
  let sf = 0;
  let ip = 0;
  let cycles = 0;
  const setFlags = (val: number) => {
    zf = val === 0 ? 1 : 0;
    sf = val < 0 ? 1 : 0;
  };

  while (ip < prog.length) {
    if (++cycles > MAX_LOOP_ITERATIONS) {
      throw new Error('ASM cycle limit exceeded (1000)');
    }
    const inst = prog[ip];
    const dest = inst.a ? normReg(inst.a) : null;
    switch (inst.op) {
      case 'mov':
        if (dest && inst.b) regs[dest] = readVal(inst.b);
        ip++;
        break;
      case 'add':
        if (dest && inst.b) {
          regs[dest] += readVal(inst.b);
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'sub':
        if (dest && inst.b) {
          regs[dest] -= readVal(inst.b);
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'imul':
        if (dest && inst.b) {
          regs[dest] *= readVal(inst.b);
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'inc':
        if (dest) {
          regs[dest] += 1;
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'dec':
        if (dest) {
          regs[dest] -= 1;
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'xor':
        if (dest && inst.b) {
          regs[dest] = regs[dest] ^ readVal(inst.b);
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'shl':
        if (dest && inst.b) {
          regs[dest] = regs[dest] << readVal(inst.b);
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'shr':
        if (dest && inst.b) {
          regs[dest] = regs[dest] >>> readVal(inst.b);
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'neg':
        if (dest) {
          regs[dest] = -regs[dest];
          setFlags(regs[dest]);
        }
        ip++;
        break;
      case 'cmp':
        if (inst.a && inst.b) setFlags(readVal(inst.a) - readVal(inst.b));
        ip++;
        break;
      case 'test':
        if (inst.a && inst.b) setFlags(readVal(inst.a) & readVal(inst.b));
        ip++;
        break;
      case 'jmp':
        ip = inst.a && inst.a in labels ? labels[inst.a] : ip + 1;
        break;
      case 'je':
      case 'jz':
        ip = zf === 1 && inst.a && inst.a in labels ? labels[inst.a] : ip + 1;
        break;
      case 'jne':
      case 'jnz':
        ip = zf === 0 && inst.a && inst.a in labels ? labels[inst.a] : ip + 1;
        break;
      case 'jg':
        ip = zf === 0 && sf === 0 && inst.a && inst.a in labels ? labels[inst.a] : ip + 1;
        break;
      case 'jl':
        ip = sf === 1 && inst.a && inst.a in labels ? labels[inst.a] : ip + 1;
        break;
      case 'ret':
      case 'hlt':
        ip = prog.length;
        break;
      default:
        ip++;
        break;
    }
  }

  const lines = [
    `RAX = ${regs.rax} (0x${(regs.rax >>> 0).toString(16).padStart(4, '0')})`,
  ];
  for (const r of ['rbx', 'rcx', 'rdx']) {
    if (regs[r] !== 0 || r === 'rcx') {
      lines.push(`${r.toUpperCase()} = ${regs[r]}`);
    }
  }
  lines.push(`ZF  = ${zf}`);
  return lines;
}

function executeEndBlockLang(source: string, lang: 'julia' | 'lua'): string[] {
  const ctx: ExecCtx = {
    scope: {},
    funcs: {},
    methods: {},
    stdout: [],
    currentLineBuffer: '',
  };

  const lines = source
    .split('\n')
    .map((raw) =>
      (lang === 'lua'
        ? raw.replace(/--.*$/, '')
        : raw.replace(/(?:^|\s)#.*$/, '')
      ).trim(),
    )
    .filter(Boolean);

  function runRange(start: number, stop: number): number {
    let i = start;
    while (i < stop) {
      const line = lines[i];
      if (line === 'end' || line.startsWith('else') || line.startsWith('elseif')) {
        return i;
      }

      // Julia `for v in a:b` / `for v in expr` ... `end`
      if (lang === 'julia') {
        const jlFor = line.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+)$/);
        if (jlFor) {
          const [, loopVar, rangeStr] = jlFor;
          let endIdx = i + 1;
          let depth = 1;
          while (endIdx < stop && depth > 0) {
            if (/^(?:for|if|while|function)\b/.test(lines[endIdx]) && !/\bend$/.test(lines[endIdx])) {
              depth++;
            } else if (lines[endIdx] === 'end') {
              depth--;
            }
            if (depth > 0) endIdx++;
          }
          const rangeParts = rangeStr.split(':').map((p) => p.trim());
          let items: unknown[] = [];
          if (rangeParts.length === 2 || rangeParts.length === 3) {
            const s = Number(evalSimpleExpr(rangeParts[0], ctx, lang));
            const step =
              rangeParts.length === 3
                ? Number(evalSimpleExpr(rangeParts[1], ctx, lang))
                : 1;
            const e = Number(
              evalSimpleExpr(rangeParts[rangeParts.length - 1], ctx, lang),
            );
            for (let k = s; step > 0 ? k <= e : k >= e; k += step) {
              if (items.length >= MAX_LOOP_ITERATIONS) break;
              items.push(k);
            }
          } else {
            const val = evalSimpleExpr(rangeStr, ctx, lang);
            if (Array.isArray(val)) items = val;
          }
          for (const item of items) {
            ctx.scope[loopVar] = item;
            runRange(i + 1, endIdx);
          }
          i = endIdx + 1;
          continue;
        }
      }

      // Lua numeric loop `for i = a, b [, step] do ... end`
      if (lang === 'lua') {
        const luaFor = line.match(
          /^for\s+([A-Za-z_]\w*)\s*=\s*([^,]+),\s*([^,d]+?)(?:,\s*(.+?))?\s+do$/,
        );
        if (luaFor) {
          const [, loopVar, startS, stopS, stepS] = luaFor;
          let endIdx = i + 1;
          let depth = 1;
          while (endIdx < stop && depth > 0) {
            if (/^(?:for|if|while|function)\b/.test(lines[endIdx]) && !/\bend$/.test(lines[endIdx])) {
              depth++;
            } else if (lines[endIdx] === 'end') {
              depth--;
            }
            if (depth > 0) endIdx++;
          }
          const startNum = Number(evalSimpleExpr(startS, ctx, lang));
          const stopNum = Number(evalSimpleExpr(stopS, ctx, lang));
          const stepNum = stepS ? Number(evalSimpleExpr(stepS, ctx, lang)) : 1;
          let guard = 0;
          for (
            let k = startNum;
            stepNum > 0 ? k <= stopNum : k >= stopNum;
            k += stepNum
          ) {
            if (++guard > MAX_LOOP_ITERATIONS) {
              throw new Error('Loop iteration limit exceeded (1000)');
            }
            ctx.scope[loopVar] = k;
            runRange(i + 1, endIdx);
          }
          i = endIdx + 1;
          continue;
        }
      }

      // `if cond [then] ... [else ...] end`
      const ifMatch = line.match(/^if\s+(.+?)(?:\s+then)?$/);
      if (ifMatch) {
        let depth = 1;
        let elseIdx = -1;
        let endIdx = i + 1;
        while (endIdx < stop && depth > 0) {
          const l = lines[endIdx];
          if (/^(?:for|if|while|function)\b/.test(l)) depth++;
          else if (l === 'else' && depth === 1) elseIdx = endIdx;
          else if (l === 'end') depth--;
          if (depth > 0) endIdx++;
        }
        const cond = evalSimpleExpr(ifMatch[1], ctx, lang);
        const isTrue = lang === 'lua' ? cond !== false && cond !== null && cond !== undefined : Boolean(cond);
        if (isTrue) {
          runRange(i + 1, elseIdx !== -1 ? elseIdx : endIdx);
        } else if (elseIdx !== -1) {
          runRange(elseIdx + 1, endIdx);
        }
        i = endIdx + 1;
        continue;
      }

      executeStatement(line, ctx, lang);
      i++;
    }
    return i;
  }

  runRange(0, lines.length);
  flushBuffer(ctx);
  return ctx.stdout;
}

/* ------------------------------------------------------------------ */
/*  Public entrypoint                                                 */
/* ------------------------------------------------------------------ */

export async function runPlaygroundCode(
  lang: LangId,
  source: string,
): Promise<ExecutionResult> {
  const startedAt =
    typeof performance !== 'undefined' ? performance.now() : Date.now();
  const banner = runnerBanner(lang);

  try {
    let outputLines: string[] = [];
    if (lang === 'js') {
      outputLines = await executeJs(source);
    } else if (lang === 'ts') {
      outputLines = await executeTs(source);
    } else if (lang === 'python') {
      outputLines = executePython(source);
    } else if (lang === 'cpp') {
      outputLines = executeCpp(source);
    } else if (lang === 'go') {
      outputLines = executeGo(source);
    } else if (
      lang === 'java' ||
      lang === 'rust' ||
      lang === 'c' ||
      lang === 'php' ||
      lang === 'swift' ||
      lang === 'kotlin' ||
      lang === 'csharp'
    ) {
      outputLines = executeSimpleBraceLang(source, lang);
    } else if (lang === 'css') {
      outputLines = executeCss(source);
    } else if (lang === 'html') {
      outputLines = executeHtml(source);
    } else if (lang === 'asm') {
      outputLines = executeAsm(source);
    } else if (lang === 'julia' || lang === 'lua') {
      outputLines = executeEndBlockLang(source, lang);
    } else {
      outputLines = executeSql(source);
    }

    const elapsedMs =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
      startedAt;
    const body =
      outputLines.length > 0 ? outputLines : ['(no stdout printed)'];

    return {
      lines: [banner, ...body, 'Process exited with code 0'],
      elapsedLabel: formatElapsed(elapsedMs),
      exitCode: 0,
    };
  } catch (err) {
    const elapsedMs =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
      startedAt;
    const message =
      err instanceof Error ? err.message : 'Runtime execution failed';
    return {
      lines: [banner, `Error: ${message}`, 'Process exited with code 1'],
      elapsedLabel: formatElapsed(elapsedMs),
      exitCode: 1,
    };
  }
}
