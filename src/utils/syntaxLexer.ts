import type { LangId } from '@/data/types';

export type SyntaxTokenKind =
  | 'keyword'
  | 'builtin'
  | 'function'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'identifier'
  | 'whitespace';

export interface SyntaxToken {
  text: string;
  kind: SyntaxTokenKind;
  color: string;
  bold?: boolean;
  italic?: boolean;
}

export const SYNTAX_COLORS: Record<SyntaxTokenKind, string> = {
  keyword: '#C084FC', // Electric Purple
  builtin: '#38BDF8', // Cyan Sky
  function: '#818CF8', // Soft Indigo-Blue
  string: '#34D399', // Emerald Mint
  number: '#FBBF24', // Warm Amber Gold
  comment: '#64748B', // Muted Slate Italic
  operator: '#94A3B8', // Cool Zinc Slate
  identifier: '#F8FAFC', // Crisp Off-White
  whitespace: '#F8FAFC',
};

const KEYWORDS = new Set<string>([
  // Python / General
  'def',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'in',
  'import',
  'from',
  'as',
  'class',
  'pass',
  'break',
  'continue',
  'and',
  'or',
  'not',
  'is',
  'lambda',
  'yield',
  'try',
  'except',
  'finally',
  'with',
  'True',
  'False',
  'None',
  'global',
  'nonlocal',
  // C / C++ / Java / C#
  '#include',
  '#define',
  'int',
  'long',
  'short',
  'void',
  'char',
  'double',
  'float',
  'bool',
  'auto',
  'unsigned',
  'signed',
  'const',
  'static',
  'struct',
  'enum',
  'union',
  'typedef',
  'sizeof',
  'using',
  'namespace',
  'template',
  'typename',
  'public',
  'private',
  'protected',
  'virtual',
  'override',
  'new',
  'delete',
  'nullptr',
  'null',
  'true',
  'false',
  'switch',
  'case',
  'default',
  'do',
  'goto',
  // JS / TS
  'let',
  'var',
  'function',
  'async',
  'await',
  'typeof',
  'instanceof',
  'interface',
  'type',
  'export',
  'extends',
  'implements',
  'readonly',
  'this',
  'super',
  'of',
  // Go / Rust / Swift / Kotlin / Lua / Julia / PHP
  'func',
  'package',
  'defer',
  'go',
  'chan',
  'select',
  'range',
  'map',
  'fallthrough',
  'fn',
  'mut',
  'pub',
  'impl',
  'trait',
  'match',
  'where',
  'crate',
  'use',
  'mod',
  'ref',
  'move',
  ' unsafe',
  'fun',
  'val',
  'when',
  'object',
  'companion',
  'guard',
  'protocol',
  'extension',
  'local',
  'then',
  'elseif',
  'end',
  'repeat',
  'until',
  'nil',
  'function',
  'begin',
  'module',
  'echo',
  'foreach',
  // Assembly (NASM x86 / x86_64)
  'mov',
  'add',
  'sub',
  'imul',
  'mul',
  'idiv',
  'div',
  'inc',
  'dec',
  'xor',
  'and',
  'or',
  'not',
  'shl',
  'shr',
  'sal',
  'sar',
  'cmp',
  'test',
  'jmp',
  'je',
  'jne',
  'jz',
  'jnz',
  'jg',
  'jge',
  'jl',
  'jle',
  'ja',
  'jb',
  'call',
  'ret',
  'push',
  'pop',
  'lea',
  'nop',
  'syscall',
  'int',
  'section',
  'db',
  'dw',
  'dd',
  'dq',
  'equ',
  'times',
  // SQL
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'PRIMARY',
  'KEY',
  'INTEGER',
  'TEXT',
  'REAL',
  'JOIN',
  'LEFT',
  'INNER',
  'ON',
  'AS',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'NULL',
  'ASC',
  'DESC',
  'DISTINCT',
]);

const BUILTINS = new Set<string>([
  // Python
  'print',
  'len',
  'append',
  'input',
  'str',
  'int',
  'list',
  'dict',
  'set',
  'tuple',
  'sum',
  'min',
  'max',
  'abs',
  'sorted',
  'reversed',
  'enumerate',
  'zip',
  'filter',
  'open',
  // C / C++
  'std',
  'cout',
  'cin',
  'cerr',
  'endl',
  'vector',
  'string',
  'sort',
  'reverse',
  'find',
  'max_element',
  'min_element',
  'swap',
  'pair',
  'make_pair',
  'printf',
  'scanf',
  'malloc',
  'free',
  'size_t',
  'ios',
  'sync_with_stdio',
  // JS / TS
  'console',
  'log',
  'warn',
  'error',
  'Math',
  'Array',
  'Object',
  'String',
  'Number',
  'Boolean',
  'Promise',
  'JSON',
  'Date',
  'Map',
  'Set',
  'parseInt',
  'parseFloat',
  'isNaN',
  'process',
  // Go / Rust / Java / C# / Kotlin / Julia / Lua
  'fmt',
  'Println',
  'Printf',
  'Print',
  'Sprintf',
  'Scanln',
  'make',
  'cap',
  'copy',
  'close',
  'panic',
  'println',
  'vec',
  'Some',
  'None',
  'Ok',
  'Err',
  'Box',
  'String',
  'Vec',
  'System',
  'out',
  'Main',
  'Program',
  'Console',
  'WriteLine',
  'Write',
  'ReadLine',
  'tostring',
  'tonumber',
  'ipairs',
  'pairs',
  'length',
  // SQL Aggregates
  'COUNT',
  'AVG',
  'SUM',
  'MIN',
  'MAX',
  'ROUND',
  'COALESCE',
  // x86 / x86_64 Registers
  'rax',
  'rbx',
  'rcx',
  'rdx',
  'rsi',
  'rdi',
  'rbp',
  'rsp',
  'rip',
  'eax',
  'ebx',
  'ecx',
  'edx',
  'esi',
  'edi',
  'ebp',
  'esp',
  'ax',
  'bx',
  'cx',
  'dx',
  'al',
  'bl',
  'cl',
  'dl',
  'ah',
  'bh',
  'ch',
  'dh',
  'r8',
  'r9',
  'r10',
  'r11',
  'r12',
  'r13',
  'r14',
  'r15',
]);

const LINE_CACHE_LIMIT = 600;
const lineTokenCache = new Map<string, SyntaxToken[]>();

const MASTER_TOKEN_REGEX =
  /(\s+)|(\/\/.*$|\/\*[\s\S]*?\*\/|--.*$|<!--[\s\S]*?-->)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b0x[0-9a-fA-F]+\b|\b0b[01]+\b|\b\d+(?:\.\d+)?\b)|(#[a-zA-Z_]\w*)|([a-zA-Z_$][\w$]*!?)|(==|!=|<=|>=|->|=>|:=|::|<<|>>|&&|\|\||[=+\-*/%<>!&|^~{}()[\];:,.?@#])/g;

function isHashCommentLanguage(lang: LangId): boolean {
  return (
    lang === 'python' ||
    lang === 'julia' ||
    lang === 'php'
  );
}

/**
 * Tokenizes a single line of code in < 0.2ms with memoization.
 */
export function tokenizeCodeLine(line: string, lang: LangId): SyntaxToken[] {
  if (line.length === 0) {
    return [{ text: '', kind: 'whitespace', color: SYNTAX_COLORS.whitespace }];
  }

  const cacheKey = `${lang}::${line}`;
  const cached = lineTokenCache.get(cacheKey);
  if (cached) return cached;

  // Handle full-line or trailing `;` comment in Assembly and `#` comment in Python/Julia/PHP
  let codePart = line;
  let trailingComment = '';

  if (lang === 'asm') {
    const semiIdx = findUnquotedChar(line, ';');
    if (semiIdx !== -1) {
      codePart = line.slice(0, semiIdx);
      trailingComment = line.slice(semiIdx);
    }
  } else if (isHashCommentLanguage(lang)) {
    const hashIdx = findUnquotedChar(line, '#');
    if (hashIdx !== -1) {
      codePart = line.slice(0, hashIdx);
      trailingComment = line.slice(hashIdx);
    }
  } else if (lang === 'cpp' || lang === 'c') {
    // Format `#include <header>` cleanly
    const incMatch = /^(\s*)(#\s*include)(\s+)(<[^>]+>)(.*)$/.exec(line);
    if (incMatch) {
      const [, leadingWs, directive, midWs, header, rest] = incMatch;
      const result: SyntaxToken[] = [];
      if (leadingWs) {
        result.push({ text: leadingWs, kind: 'whitespace', color: SYNTAX_COLORS.whitespace });
      }
      result.push({
        text: directive,
        kind: 'keyword',
        color: SYNTAX_COLORS.keyword,
        bold: true,
      });
      if (midWs) {
        result.push({ text: midWs, kind: 'whitespace', color: SYNTAX_COLORS.whitespace });
      }
      result.push({
        text: header,
        kind: 'string',
        color: SYNTAX_COLORS.string,
      });
      if (rest) {
        result.push(...tokenizeCodeSegment(rest, lang));
      }
      saveToCache(cacheKey, result);
      return result;
    }
  }

  const tokens = tokenizeCodeSegment(codePart, lang);
  if (trailingComment) {
    tokens.push({
      text: trailingComment,
      kind: 'comment',
      color: SYNTAX_COLORS.comment,
      italic: true,
    });
  }

  saveToCache(cacheKey, tokens);
  return tokens;
}

function findUnquotedChar(line: string, target: string): number {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : '';
    if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
    else if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
    else if (ch === target && !inSingle && !inDouble) return i;
  }
  return -1;
}

function tokenizeCodeSegment(segment: string, lang: LangId): SyntaxToken[] {
  if (!segment) return [];

  const tokens: SyntaxToken[] = [];
  let lastIndex = 0;
  MASTER_TOKEN_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = MASTER_TOKEN_REGEX.exec(segment)) !== null) {
    if (match.index > lastIndex) {
      const skipped = segment.slice(lastIndex, match.index);
      tokens.push({
        text: skipped,
        kind: 'identifier',
        color: SYNTAX_COLORS.identifier,
      });
    }

    const [
      full,
      whitespace,
      comment,
      strLiteral,
      numLiteral,
      directive,
      ident,
      operator,
    ] = match;

    if (whitespace !== undefined) {
      tokens.push({
        text: full,
        kind: 'whitespace',
        color: SYNTAX_COLORS.whitespace,
      });
    } else if (comment !== undefined) {
      tokens.push({
        text: full,
        kind: 'comment',
        color: SYNTAX_COLORS.comment,
        italic: true,
      });
    } else if (strLiteral !== undefined) {
      tokens.push({
        text: full,
        kind: 'string',
        color: SYNTAX_COLORS.string,
      });
    } else if (numLiteral !== undefined) {
      tokens.push({
        text: full,
        kind: 'number',
        color: SYNTAX_COLORS.number,
      });
    } else if (directive !== undefined) {
      tokens.push({
        text: full,
        kind: 'keyword',
        color: SYNTAX_COLORS.keyword,
        bold: true,
      });
    } else if (ident !== undefined) {
      const stripped = ident.endsWith('!') ? ident.slice(0, -1) : ident;
      const upperForSql = lang === 'sql' ? stripped.toUpperCase() : stripped;
      const nextChar = segment[match.index + full.length] ?? '';

      if (
        KEYWORDS.has(stripped) ||
        (lang === 'sql' && KEYWORDS.has(upperForSql)) ||
        (lang === 'asm' && KEYWORDS.has(stripped.toLowerCase()))
      ) {
        tokens.push({
          text: full,
          kind: 'keyword',
          color: SYNTAX_COLORS.keyword,
          bold: true,
        });
      } else if (
        BUILTINS.has(stripped) ||
        (lang === 'sql' && BUILTINS.has(upperForSql)) ||
        (lang === 'asm' && BUILTINS.has(stripped.toLowerCase()))
      ) {
        tokens.push({
          text: full,
          kind: 'builtin',
          color: SYNTAX_COLORS.builtin,
        });
      } else if (nextChar === '(' || ident.endsWith('!')) {
        tokens.push({
          text: full,
          kind: 'function',
          color: SYNTAX_COLORS.function,
        });
      } else {
        tokens.push({
          text: full,
          kind: 'identifier',
          color: SYNTAX_COLORS.identifier,
        });
      }
    } else if (operator !== undefined) {
      tokens.push({
        text: full,
        kind: 'operator',
        color: SYNTAX_COLORS.operator,
      });
    } else {
      tokens.push({
        text: full,
        kind: 'identifier',
        color: SYNTAX_COLORS.identifier,
      });
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < segment.length) {
    tokens.push({
      text: segment.slice(lastIndex),
      kind: 'identifier',
      color: SYNTAX_COLORS.identifier,
    });
  }

  return mergeAdjacentSameKind(tokens);
}

function mergeAdjacentSameKind(tokens: SyntaxToken[]): SyntaxToken[] {
  if (tokens.length <= 1) return tokens;
  const merged: SyntaxToken[] = [tokens[0]];
  for (let i = 1; i < tokens.length; i += 1) {
    const prev = merged[merged.length - 1];
    const curr = tokens[i];
    if (
      prev.kind === curr.kind &&
      prev.color === curr.color &&
      prev.bold === curr.bold &&
      prev.italic === curr.italic
    ) {
      merged[merged.length - 1] = { ...prev, text: prev.text + curr.text };
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

function saveToCache(key: string, tokens: SyntaxToken[]): void {
  if (lineTokenCache.size >= LINE_CACHE_LIMIT) {
    const firstKey = lineTokenCache.keys().next().value;
    if (firstKey !== undefined) {
      lineTokenCache.delete(firstKey);
    }
  }
  lineTokenCache.set(key, tokens);
}
