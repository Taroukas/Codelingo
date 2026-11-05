import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors, MONO } from '@/theme';

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
]);

const TOKEN_RE =
  /(\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b|[+\-*/%=<>!&|:;,.()[\]{}]+|\s+)/g;

function getTokenColor(token: string): string {
  if (token.startsWith('//') || token.startsWith('#')) return Colors.textSecondary;
  if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) return Colors.green;
  if (/^\d/.test(token)) return Colors.flame;
  if (KEYWORDS.has(token)) return Colors.violet;
  if (/^[+\-*/%=<>!&|:]+$/.test(token)) return Colors.sky;
  return Colors.white;
}

export function CodeLine({ code, fontSize = 14 }: { code: string; fontSize?: number }) {
  const parts = code.match(TOKEN_RE) ?? [code];
  return (
    <Text style={[styles.code, { fontSize, lineHeight: fontSize * 1.45 }]}>
      {parts.map((part, idx) => (
        <Text key={idx} style={{ color: getTokenColor(part) }}>
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
