import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors, MONO } from '@/theme';

/** Optional per-token colour overrides so screens can retheme code without forking the tokenizer. */
export interface SyntaxPalette {
  keyword?: string;
  string?: string;
  number?: string;
  operator?: string;
  comment?: string;
  plain?: string;
}

const DEFAULT_PALETTE: Required<SyntaxPalette> = {
  keyword: Colors.violet,
  string: Colors.green,
  number: Colors.flame,
  operator: Colors.sky,
  comment: Colors.textSecondary,
  plain: Colors.white,
};

const KEYWORDS = new Set([
  'def',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'in',
  'while',
  'range',
  'print',
  'len',
  'True',
  'False',
  'None',
  'and',
  'or',
  'not',
  'int',
  'void',
  'bool',
  'char',
  'double',
  'float',
  'auto',
  'const',
  'let',
  'var',
  'function',
  'async',
  'await',
  'true',
  'false',
  'null',
  'undefined',
  'func',
  'package',
  'import',
  'type',
  'struct',
  'go',
  'chan',
  'make',
  'defer',
  'std',
  'cout',
  'endl',
  'fmt',
  'Println',
  'Printf',
  'console',
  'log',
  // Java
  'public',
  'private',
  'protected',
  'class',
  'interface',
  'static',
  'final',
  'extends',
  'implements',
  'new',
  'this',
  'super',
  'boolean',
  'String',
  'System',
  'out',
  'println',
  'ArrayList',
  'HashMap',
  // Rust
  'fn',
  'mut',
  'match',
  'impl',
  'trait',
  'enum',
  'pub',
  'use',
  'mod',
  'loop',
  'Self',
  'Some',
  'Ok',
  'Err',
  'Option',
  'Result',
  'Vec',
  // SQL
  'SELECT',
  'DISTINCT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'NOT',
  'IN',
  'BETWEEN',
  'LIKE',
  'IS',
  'NULL',
  'AS',
  'ORDER',
  'BY',
  'ASC',
  'DESC',
  'LIMIT',
  'OFFSET',
  'GROUP',
  'HAVING',
  'JOIN',
  'INNER',
  'LEFT',
  'ON',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'COALESCE',
  'CREATE',
  'TABLE',
  'PRIMARY',
  'KEY',
  'DEFAULT',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  // C
  'sizeof',
  'typedef',
  'switch',
  'case',
  'break',
  'continue',
  'default',
  'malloc',
  'calloc',
  'realloc',
  'free',
  'printf',
  'snprintf',
  'strcmp',
  'strlen',
  'size_t',
  // TypeScript
  'number',
  'string',
  'boolean',
  'unknown',
  'any',
  'never',
  'readonly',
  'keyof',
  'implements',
  'as',
  // CSS & HTML
  'display',
  'flex',
  'grid',
  'gap',
  'padding',
  'margin',
  'background',
  'border',
  'color',
  'width',
  'height',
  'article',
  'section',
  'header',
  'footer',
  'main',
  'nav',
  'form',
  'label',
  'input',
  'button',
  'div',
  'img',
  'alt',
  // PHP
  'echo',
  'foreach',
  // Assembly (x86-64)
  'mov',
  'add',
  'sub',
  'imul',
  'inc',
  'dec',
  'xor',
  'shl',
  'shr',
  'cmp',
  'test',
  'jmp',
  'je',
  'jz',
  'jne',
  'jnz',
  'jg',
  'jl',
  'lea',
  'push',
  'pop',
  'ret',
  'rax',
  'rbx',
  'rcx',
  'rdx',
  'rsi',
  'rdi',
  'rsp',
  'rbp',
  // Swift
  'func',
  'guard',
  'extension',
  'protocol',
  'actor',
  'some',
  'mutating',
  'nil',
  'throws',
  'Task',
  'didSet',
  // Kotlin
  'val',
  'fun',
  'when',
  'sealed',
  'data',
  'object',
  'companion',
  'suspend',
  'flow',
  'emit',
  'collect',
  'until',
  'downTo',
  'step',
  'listOf',
  'mapOf',
  // Julia
  'end',
  'elseif',
  'nothing',
  'abstract',
  'mutable',
  'where',
  'Dict',
  // Lua
  'local',
  'then',
  'do',
  'ipairs',
  'pairs',
  'setmetatable',
  'coroutine',
  'yield',
  'resume',
  'pcall',
  // C#
  'using',
  'namespace',
  'record',
  'with',
  'init',
  'required',
  'decimal',
  'Console',
  'WriteLine',
  'Where',
  'Select',
  'ToList',
]);

const TOKEN_RE =
  /(\/\/.*$|--.*$|#(?:$|\s.*$)|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b|[$@]?[A-Za-z_][\w-]*|[+\-*/%=<>!&|:;,.()[\]{}~^]+|\s+)/g;

function getTokenColor(token: string, palette: Required<SyntaxPalette>): string {
  if (
    token.startsWith('//') ||
    token.startsWith('--') ||
    token === '#' ||
    token.startsWith('# ') ||
    token.startsWith('/*') ||
    token.startsWith('<!--')
  ) {
    return palette.comment;
  }
  if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) return palette.string;
  if (/^\d/.test(token)) return palette.number;
  if (KEYWORDS.has(token)) return palette.keyword;
  if (/^[+\-*/%=<>!&|:~^]+$/.test(token)) return palette.operator;
  return palette.plain;
}

export function CodeLine({
  code,
  fontSize = 14,
  lineHeight,
  syntax,
}: {
  code: string;
  fontSize?: number;
  /** Override the default 1.45× leading so a code row can align with its line number. */
  lineHeight?: number;
  syntax?: SyntaxPalette;
}) {
  const palette = syntax ? { ...DEFAULT_PALETTE, ...syntax } : DEFAULT_PALETTE;
  const trimmed = code.trimStart();
  const isAsmComment = trimmed.startsWith(';');
  const parts = isAsmComment ? [code] : code.match(TOKEN_RE) ?? [code];
  return (
    <Text style={[styles.code, { fontSize, lineHeight: lineHeight ?? fontSize * 1.45 }]}>
      {parts.map((part, idx) => (
        <Text
          key={idx}
          style={{
            color: isAsmComment ? palette.comment : getTokenColor(part, palette),
          }}
        >
          {part}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  code: {
    fontFamily: MONO,
    color: Colors.white,
  },
});
