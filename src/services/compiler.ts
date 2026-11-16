import type { LangId } from '@/data/types';
import { runPlaygroundCode } from '@/utils/codeRunner';

export type CompilerSourceEngine = 'piston' | 'judge0' | 'wandbox' | 'local';

export interface CompilerExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  compilerName: string;
  errorLine: number | null;
  source: CompilerSourceEngine;
  commandLabel: string;
}

export interface CompilerLangSpec {
  lang: LangId;
  badgeLabel: string;
  mainFilename: string;
  commandLabel: string;
  piston: { language: string; version: string } | null;
  judge0LanguageId: number | null;
  wandbox: { compiler: string; compilerOptionRaw?: string } | null;
}

export interface CompileRunParams {
  lang: LangId;
  source: string;
  stdin?: string;
}

interface PreparedSource {
  code: string;
  lineOffset: number;
}

const DEFAULT_PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';
const JUDGE0_API_URL =
  'https://ce.judge0.com/submissions/?base64_encoded=false&wait=true';

const PISTON_COOLDOWN_MS = 5 * 60 * 1000;
let pistonBlockedUntil = 0;

export const COMPILER_SPECS: Record<LangId, CompilerLangSpec> = {
  python: {
    lang: 'python',
    badgeLabel: 'Python 3.12',
    mainFilename: 'main.py',
    commandLabel: 'python3 main.py',
    piston: { language: 'python', version: '3.10.0' },
    judge0LanguageId: 100,
    wandbox: { compiler: 'cpython-3.12.7' },
  },
  cpp: {
    lang: 'cpp',
    badgeLabel: 'GCC 14 (C++20)',
    mainFilename: 'main.cpp',
    commandLabel: 'g++ main.cpp -std=c++20 -O2',
    piston: { language: 'c++', version: '10.2.0' },
    judge0LanguageId: 105,
    wandbox: { compiler: 'gcc-head', compilerOptionRaw: '-std=c++20\n-O2' },
  },
  c: {
    lang: 'c',
    badgeLabel: 'GCC 14 (C11)',
    mainFilename: 'main.c',
    commandLabel: 'gcc main.c -Wall -Wextra',
    piston: { language: 'c', version: '10.2.0' },
    judge0LanguageId: 103,
    wandbox: { compiler: 'gcc-13.2.0-c' },
  },
  js: {
    lang: 'js',
    badgeLabel: 'Node 22',
    mainFilename: 'main.js',
    commandLabel: 'node main.js',
    piston: { language: 'javascript', version: '18.15.0' },
    judge0LanguageId: 102,
    wandbox: { compiler: 'nodejs-20.17.0' },
  },
  ts: {
    lang: 'ts',
    badgeLabel: 'TypeScript 5.6',
    mainFilename: 'main.ts',
    commandLabel: 'tsc main.ts && node main.js',
    piston: { language: 'typescript', version: '5.0.3' },
    judge0LanguageId: 101,
    wandbox: { compiler: 'typescript-5.6.2' },
  },
  go: {
    lang: 'go',
    badgeLabel: 'Go 1.23',
    mainFilename: 'main.go',
    commandLabel: 'go run main.go',
    piston: { language: 'go', version: '1.16.2' },
    judge0LanguageId: 107,
    wandbox: { compiler: 'go-1.23.2' },
  },
  rust: {
    lang: 'rust',
    badgeLabel: 'Rust 1.85',
    mainFilename: 'main.rs',
    commandLabel: 'rustc main.rs -O',
    piston: { language: 'rust', version: '1.68.2' },
    judge0LanguageId: 108,
    wandbox: { compiler: 'rust-1.82.0' },
  },
  asm: {
    lang: 'asm',
    badgeLabel: 'NASM x86',
    mainFilename: 'main.asm',
    commandLabel: 'nasm -f elf main.asm && ld',
    piston: { language: 'nasm', version: '2.15.5' },
    judge0LanguageId: 45,
    wandbox: null,
  },
  java: {
    lang: 'java',
    badgeLabel: 'JDK 17',
    mainFilename: 'Main.java',
    commandLabel: 'javac Main.java && java Main',
    piston: { language: 'java', version: '15.0.2' },
    judge0LanguageId: 91,
    wandbox: { compiler: 'openjdk-jdk-22+36' },
  },
  csharp: {
    lang: 'csharp',
    badgeLabel: 'Mono C#',
    mainFilename: 'Program.cs',
    commandLabel: 'mcs Program.cs && mono Program.exe',
    piston: { language: 'csharp', version: '6.12.0' },
    judge0LanguageId: 51,
    wandbox: { compiler: 'mono-6.12.0.199' },
  },
  swift: {
    lang: 'swift',
    badgeLabel: 'Swift 6',
    mainFilename: 'main.swift',
    commandLabel: 'swift main.swift',
    piston: { language: 'swift', version: '5.3.3' },
    judge0LanguageId: 83,
    wandbox: { compiler: 'swift-6.0.1' },
  },
  kotlin: {
    lang: 'kotlin',
    badgeLabel: 'Kotlin 2.1',
    mainFilename: 'Main.kt',
    commandLabel: 'kotlinc Main.kt -include-runtime',
    piston: { language: 'kotlin', version: '1.8.20' },
    judge0LanguageId: 111,
    wandbox: null,
  },
  php: {
    lang: 'php',
    badgeLabel: 'PHP 8.3',
    mainFilename: 'index.php',
    commandLabel: 'php index.php',
    piston: { language: 'php', version: '8.2.3' },
    judge0LanguageId: 98,
    wandbox: { compiler: 'php-8.3.12' },
  },
  lua: {
    lang: 'lua',
    badgeLabel: 'Lua 5.4',
    mainFilename: 'main.lua',
    commandLabel: 'lua main.lua',
    piston: { language: 'lua', version: '5.4.4' },
    judge0LanguageId: 64,
    wandbox: { compiler: 'lua-5.4.7' },
  },
  sql: {
    lang: 'sql',
    badgeLabel: 'SQLite 3',
    mainFilename: 'query.sql',
    commandLabel: 'sqlite3 < query.sql',
    piston: { language: 'sqlite3', version: '3.36.0' },
    judge0LanguageId: 82,
    wandbox: { compiler: 'sqlite-3.46.1' },
  },
  julia: {
    lang: 'julia',
    badgeLabel: 'Julia 1.8',
    mainFilename: 'main.jl',
    commandLabel: 'julia main.jl',
    piston: { language: 'julia', version: '1.8.5' },
    judge0LanguageId: null,
    wandbox: null,
  },
  html: {
    lang: 'html',
    badgeLabel: 'HTML5 DOM',
    mainFilename: 'index.html',
    commandLabel: 'dom-inspect index.html',
    piston: null,
    judge0LanguageId: null,
    wandbox: null,
  },
  css: {
    lang: 'css',
    badgeLabel: 'CSS3 Parser',
    mainFilename: 'styles.css',
    commandLabel: 'css-parse styles.css',
    piston: null,
    judge0LanguageId: null,
    wandbox: null,
  },
};

export const IDE_DEFAULT_CODE: Record<LangId, string> = {
  python: [
    'def sort_and_filter(nums):',
    '    evens = [n * n for n in nums if n % 2 == 0]',
    '    return sorted(evens)',
    '',
    'scores = [7, 4, 2, 9, 6]',
    'print("Filtered squares:", sort_and_filter(scores))',
  ].join('\n'),
  cpp: [
    '#include <iostream>',
    '#include <vector>',
    '#include <algorithm>',
    'int main() {',
    '    std::vector<int> v = {12, 5, 2, 8};',
    '    std::sort(v.begin(), v.end());',
    '    for (int n : v) std::cout << n << " ";',
    '    return 0;',
    '}',
  ].join('\n'),
  c: [
    '#include <stdio.h>',
    '',
    'int main() {',
    '    int nums[] = {10, 25, 40, 15};',
    '    int sum = 0;',
    '    for (int i = 0; i < 4; i++) {',
    '        sum += nums[i];',
    '    }',
    '    printf("Sum = %d\\n", sum);',
    '    return 0;',
    '}',
  ].join('\n'),
  js: [
    'const players = [',
    '  { name: "Luna", xp: 420 },',
    '  { name: "Max", xp: 90 },',
    '  { name: "Zoe", xp: 610 },',
    '];',
    'const top = players.filter((p) => p.xp >= 400).map((p) => p.name);',
    'console.log("Top:", top.join(", "));',
  ].join('\n'),
  ts: [
    'interface Player { name: string; xp: number; }',
    'const roster: Player[] = [',
    '  { name: "Yuna", xp: 1450 },',
    '  { name: "Kai", xp: 980 },',
    '];',
    'const top = roster.map((p: Player) => `${p.name} (${p.xp} XP)`);',
    'console.log(top.join(" | "));',
  ].join('\n'),
  go: [
    'package main',
    'import "fmt"',
    '',
    'func main() {',
    '    scores := []int{15, 30, 45, 60}',
    '    total := 0',
    '    for _, s := range scores {',
    '        total += s',
    '    }',
    '    fmt.Println("Total XP:", total)',
    '}',
  ].join('\n'),
  rust: [
    'fn main() {',
    '    let scores = [10, 20, 30, 40];',
    '    let total: i32 = scores.iter().sum();',
    '    println!("Total XP: {} (count={})", total, scores.len());',
    '}',
  ].join('\n'),
  asm: [
    'section .data',
    '    msg db "Hello from NASM x86!", 10',
    'section .text',
    '    global _start',
    '_start:',
    '    mov eax, 4',
    '    mov ebx, 1',
    '    mov ecx, msg',
    '    mov edx, 21',
    '    int 0x80',
    '    mov eax, 1',
    '    xor ebx, ebx',
    '    int 0x80',
  ].join('\n'),
  java: [
    'public class Main {',
    '    public static void main(String[] args) {',
    '        int totalXp = 0;',
    '        for (int i = 1; i <= 4; i++) {',
    '            totalXp += i * 25;',
    '        }',
    '        System.out.println("Total XP: " + totalXp);',
    '    }',
    '}',
  ].join('\n'),
  csharp: [
    'using System;',
    '',
    'class Program {',
    '    static void Main() {',
    '        string hero = "Theo";',
    '        int xp = 300 + 50;',
    '        Console.WriteLine($"Player: {hero} ({xp} XP)");',
    '    }',
    '}',
  ].join('\n'),
  swift: [
    'let track = "Swift"',
    'var total = 0',
    'for step in 1...4 {',
    '    total += step * 10',
    '}',
    'print("\\(track) Total: \\(total) XP")',
  ].join('\n'),
  kotlin: [
    'fun main() {',
    '    var total = 0',
    '    for (i in 1..5) {',
    '        total += i * 20',
    '    }',
    '    println("Kotlin Total XP: $total")',
    '}',
  ].join('\n'),
  php: [
    '<?php',
    '$scores = [45, 82, 95, 70];',
    'foreach ($scores as $s) {',
    '    if ($s >= 80) {',
    '        echo "Passed: $s\\n";',
    '    }',
    '}',
  ].join('\n'),
  lua: [
    'local sum = 0',
    'for i = 1, 5 do',
    '    sum = sum + i * 10',
    'end',
    'print("Total XP: " .. sum)',
  ].join('\n'),
  sql: [
    'SELECT handle, lang, xp',
    'FROM users',
    'WHERE xp >= 900',
    'ORDER BY xp DESC',
    'LIMIT 3;',
  ].join('\n'),
  julia: [
    'scores = [10, 20, 30]',
    'scaled = scores .* 2',
    'println("Sum scaled: $(sum(scaled))")',
  ].join('\n'),
  html: [
    '<article class="lesson">',
    '  <h2>DOM Inspector</h2>',
    '  <p>Semantic tags help screen readers.</p>',
    '  <img src="badge.png" alt="Lesson badge" />',
    '</article>',
  ].join('\n'),
  css: [
    '.card {',
    '  display: flex;',
    '  gap: 12px;',
    '  padding: 16px;',
    '  background: #12111A;',
    '}',
    '#hero.card {',
    '  border: 1px solid #7C5CFC;',
    '}',
  ].join('\n'),
};

export function getCompilerSpec(lang: LangId): CompilerLangSpec {
  return COMPILER_SPECS[lang];
}

function getPistonEndpoint(): string {
  const envUrl = process.env.EXPO_PUBLIC_PISTON_URL?.trim();
  return envUrl && envUrl.length > 0 ? envUrl : DEFAULT_PISTON_URL;
}

/**
 * Wraps bare classroom snippets into valid compilation units when the user
 * omits boilerplate (e.g. `fn main()`, `package main`, `int main()`),
 * returning exact prepended `lineOffset` so errors map to editor lines.
 */
function prepareSourceForCloud(lang: LangId, rawSource: string): PreparedSource {
  const trimmed = rawSource.trim();
  if (!trimmed) return { code: rawSource, lineOffset: 0 };

  switch (lang) {
    case 'cpp': {
      if (/\bmain\s*\(/.test(rawSource)) {
        return { code: rawSource, lineOffset: 0 };
      }
      const header = [
        '#include <iostream>',
        '#include <vector>',
        '#include <string>',
        '#include <algorithm>',
        '#include <map>',
        'int main() {',
      ];
      return {
        code: `${header.join('\n')}\n${rawSource}\nreturn 0;\n}`,
        lineOffset: header.length,
      };
    }
    case 'c': {
      if (/\bmain\s*\(/.test(rawSource)) {
        return { code: rawSource, lineOffset: 0 };
      }
      const header = ['#include <stdio.h>', '#include <stdlib.h>', 'int main() {'];
      return {
        code: `${header.join('\n')}\n${rawSource}\nreturn 0;\n}`,
        lineOffset: header.length,
      };
    }
    case 'go': {
      if (/\bpackage\s+main\b/.test(rawSource)) {
        return { code: rawSource, lineOffset: 0 };
      }
      if (/\bfunc\s+main\s*\(/.test(rawSource)) {
        const header = ['package main', 'import "fmt"'];
        return {
          code: `${header.join('\n')}\n${rawSource}`,
          lineOffset: header.length,
        };
      }
      const header = ['package main', 'import "fmt"', 'func main() {'];
      return {
        code: `${header.join('\n')}\n${rawSource}\n}`,
        lineOffset: header.length,
      };
    }
    case 'rust': {
      if (/\bfn\s+main\s*\(/.test(rawSource)) {
        return { code: rawSource, lineOffset: 0 };
      }
      const header = ['fn main() {'];
      return {
        code: `${header.join('\n')}\n${rawSource}\n}`,
        lineOffset: header.length,
      };
    }
    case 'java': {
      if (/\bclass\s+\w+/.test(rawSource)) {
        return { code: rawSource, lineOffset: 0 };
      }
      const header = ['public class Main {', 'public static void main(String[] args) {'];
      return {
        code: `${header.join('\n')}\n${rawSource}\n}\n}`,
        lineOffset: header.length,
      };
    }
    case 'csharp': {
      if (/\bstatic\s+void\s+Main\b/.test(rawSource) || /\bclass\s+\w+/.test(rawSource)) {
        return { code: rawSource, lineOffset: 0 };
      }
      const header = ['using System;', 'class Program {', 'static void Main() {'];
      return {
        code: `${header.join('\n')}\n${rawSource}\n}\n}`,
        lineOffset: header.length,
      };
    }
    case 'kotlin': {
      if (/\bfun\s+main\s*\(/.test(rawSource)) {
        return { code: rawSource, lineOffset: 0 };
      }
      const header = ['fun main() {'];
      return {
        code: `${header.join('\n')}\n${rawSource}\n}`,
        lineOffset: header.length,
      };
    }
    case 'php': {
      if (/<\?php/.test(rawSource)) {
        return { code: rawSource, lineOffset: 0 };
      }
      return {
        code: `<?php\n${rawSource}`,
        lineOffset: 1,
      };
    }
    case 'sql': {
      const hasUsersRef = /\busers\b/i.test(rawSource);
      const createsTable = /\bCREATE\s+TABLE\b/i.test(rawSource);
      if (hasUsersRef && !createsTable) {
        const seedLines = [
          'CREATE TABLE users (id INTEGER PRIMARY KEY, handle TEXT, lang TEXT, xp INTEGER);',
          "INSERT INTO users (handle, lang, xp) VALUES ('kenji_rs','rust',1840),('ada_py','python',1620),('tariq_sql','sql',1410),('maya_go','go',1120),('leo_cpp','cpp',980),('dev_c','c',940);",
          '.headers on',
          '.mode column',
        ];
        return {
          code: `${seedLines.join('\n')}\n${rawSource}`,
          lineOffset: seedLines.length,
        };
      }
      return { code: rawSource, lineOffset: 0 };
    }
    case 'js': {
      // Allow top-level `await` inside CommonJS Node execution by wrapping in async IIFE.
      if (/\bawait\b/.test(rawSource) && !/\basync\s+function\b/.test(rawSource)) {
        const header = ['(async () => {'];
        return {
          code: `${header.join('\n')}\n${rawSource}\n})();`,
          lineOffset: header.length,
        };
      }
      return { code: rawSource, lineOffset: 0 };
    }
    default:
      return { code: rawSource, lineOffset: 0 };
  }
}

/**
 * Extracts a 1-based editor line number from compiler/runtime stderr.
 */
export function parseErrorLine(
  stderr: string,
  lang: LangId,
  lineOffset: number = 0,
): number | null {
  if (!stderr) return null;

  const patterns: RegExp[] = [
    // Python tracebacks: File "main.py", line 4
    /File\s+"[^"]+",\s+line\s+(\d+)/i,
    // GCC / Clang / Go / Kotlin / Swift / NASM: main.cpp:6:12: error:
    /(?:main|prog|index|query|Main|Program)\.\w+:(\d+)(?::\d+)?/i,
    // Generic file:line:col or --> main.rs:5:9
    /-->\s*[^:\s]+:(\d+):\d+/,
    // C# / TypeScript: Program.cs(8,13) or main.ts(4,5)
    /\.(?:cs|ts)\((\d+),\d+\)/i,
    // Node / V8 stack traces
    /at\s+[^\n]*:(\d+):\d+/,
    // PHP: on line 6
    /on\s+line\s+(\d+)/i,
    // Lua: :5: or lua: ...:5:
    /lua[^:]*:[^:]+:(\d+):/i,
    // SQLite: near line 3
    /near\s+line\s+(\d+)/i,
    // Generic fallback `:<line>:<col>:`
    /:(\d+):\d+:/,
    // Local JS / SyntaxError fallback
    /line\s+(\d+)/i,
  ];

  // Put language-specific best patterns first when ambiguous
  if (lang === 'python') {
    const m = /File\s+"[^"]+",\s+line\s+(\d+)/i.exec(stderr);
    if (m) return adjustLineNumber(Number(m[1]), lineOffset);
  }

  for (const rx of patterns) {
    const match = rx.exec(stderr);
    if (match && match[1]) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > 0) {
        return adjustLineNumber(n, lineOffset);
      }
    }
  }

  return null;
}

function adjustLineNumber(rawLine: number, lineOffset: number): number {
  const adjusted = rawLine - lineOffset;
  return adjusted >= 1 ? adjusted : 1;
}

function stripJvmWarnings(text: string): string {
  return text
    .split('\n')
    .filter(
      (line) =>
        !/^WARNING:\s+(A restricted method|java\.lang\.System::load|Use --enable-native-access|A terminally deprecated|sun\.misc\.Unsafe|Please consider reporting)/.test(
          line.trim(),
        ),
    )
    .join('\n')
    .trim();
}

function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

interface PistonApiResponse {
  compile?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    output?: string;
  };
  run?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    output?: string;
  };
}

async function tryPistonExecute(
  spec: CompilerLangSpec,
  prepared: PreparedSource,
  stdin: string,
): Promise<CompilerExecutionResult | null> {
  if (!spec.piston) return null;

  const endpoint = getPistonEndpoint();
  const usingDefaultEmkc = endpoint === DEFAULT_PISTON_URL;
  if (usingDefaultEmkc && Date.now() < pistonBlockedUntil) {
    return null;
  }

  const startMs = Date.now();
  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: spec.piston.language,
          version: spec.piston.version,
          files: [{ name: spec.mainFilename, content: prepared.code }],
          stdin,
          compile_timeout: 10000,
          run_timeout: 5000,
        }),
      },
      11500,
    );

    if (!response.ok) {
      if (usingDefaultEmkc && (response.status === 401 || response.status === 403)) {
        pistonBlockedUntil = Date.now() + PISTON_COOLDOWN_MS;
      }
      return null;
    }

    const data = (await response.json()) as PistonApiResponse;
    const elapsedMs = Math.max(1, Date.now() - startMs);

    const compileStderr = data.compile?.stderr?.trim() ?? '';
    const compileCode = data.compile?.code ?? 0;
    if (compileCode !== 0 || (compileStderr.length > 0 && !data.run)) {
      const cleanedErr = compileStderr || data.compile?.output?.trim() || 'Compilation failed.';
      return {
        stdout: data.compile?.stdout?.trim() ?? '',
        stderr: cleanedErr,
        exitCode: compileCode || 1,
        executionTimeMs: elapsedMs,
        compilerName: `${spec.badgeLabel} (Piston)`,
        errorLine: parseErrorLine(cleanedErr, spec.lang, prepared.lineOffset),
        source: 'piston',
        commandLabel: spec.commandLabel,
      };
    }

    const runStdout = data.run?.stdout?.replace(/\s+$/, '') ?? '';
    const runStderr = data.run?.stderr?.trim() ?? '';
    const exitCode = data.run?.code ?? (runStderr.length > 0 && runStdout.length === 0 ? 1 : 0);

    return {
      stdout: runStdout,
      stderr: runStderr,
      exitCode,
      executionTimeMs: elapsedMs,
      compilerName: `${spec.badgeLabel} (Piston)`,
      errorLine: exitCode !== 0 ? parseErrorLine(runStderr, spec.lang, prepared.lineOffset) : null,
      source: 'piston',
      commandLabel: spec.commandLabel,
    };
  } catch {
    return null;
  }
}

interface Judge0ApiResponse {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  status?: { id?: number; description?: string };
}

async function tryJudge0Execute(
  spec: CompilerLangSpec,
  prepared: PreparedSource,
  stdin: string,
): Promise<CompilerExecutionResult | null> {
  if (spec.judge0LanguageId === null) return null;

  const startMs = Date.now();
  try {
    const response = await fetchWithTimeout(
      JUDGE0_API_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: prepared.code,
          language_id: spec.judge0LanguageId,
          stdin,
        }),
      },
      12500,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as Judge0ApiResponse;
    const statusId = data.status?.id ?? 0;
    const wallMs = Math.max(1, Date.now() - startMs);
    const runtimeSec = data.time ? Number.parseFloat(data.time) : NaN;
    const execMs =
      Number.isFinite(runtimeSec) && runtimeSec > 0
        ? Math.max(1, Math.round(runtimeSec * 1000))
        : wallMs;

    const rawStdout = (data.stdout ?? '').replace(/\s+$/, '');
    const rawStderr = (data.stderr ?? '').trim();
    const rawCompileOut = stripJvmWarnings(data.compile_output ?? '');
    const sysMessage = (data.message ?? '').trim();

    // Judge0 status 3 === Accepted
    if (statusId === 3) {
      return {
        stdout: rawStdout,
        stderr: rawStderr,
        exitCode: 0,
        executionTimeMs: execMs,
        compilerName: spec.badgeLabel,
        errorLine: null,
        source: 'judge0',
        commandLabel: spec.commandLabel,
      };
    }

    const combinedErr = [rawCompileOut, rawStderr, sysMessage]
      .filter((part) => part.length > 0)
      .join('\n');
    const fallbackErr =
      combinedErr || data.status?.description || 'Execution failed with non-zero exit status.';

    return {
      stdout: rawStdout,
      stderr: fallbackErr,
      exitCode: 1,
      executionTimeMs: execMs,
      compilerName: spec.badgeLabel,
      errorLine: parseErrorLine(fallbackErr, spec.lang, prepared.lineOffset),
      source: 'judge0',
      commandLabel: spec.commandLabel,
    };
  } catch {
    return null;
  }
}

interface WandboxApiResponse {
  status?: string;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  program_output?: string;
  program_error?: string;
}

async function tryWandboxExecute(
  spec: CompilerLangSpec,
  prepared: PreparedSource,
  stdin: string,
): Promise<CompilerExecutionResult | null> {
  if (!spec.wandbox) return null;

  const startMs = Date.now();
  try {
    const response = await fetchWithTimeout(
      WANDBOX_API_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler: spec.wandbox.compiler,
          code: prepared.code,
          stdin,
          ...(spec.wandbox.compilerOptionRaw
            ? { 'compiler-option-raw': spec.wandbox.compilerOptionRaw }
            : {}),
        }),
      },
      10500,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as WandboxApiResponse;
    const elapsedMs = Math.max(1, Date.now() - startMs);
    const stdout = (data.program_output ?? '').replace(/\s+$/, '');
    const compileErr = (data.compiler_error ?? '').trim();
    const programErr = (data.program_error ?? '').trim();
    const statusCode = Number.parseInt(data.status ?? '0', 10);
    const exitCode = Number.isFinite(statusCode) ? statusCode : 1;

    // Detect Wandbox internal container pid1 issue and fall back cleanly
    if (programErr.includes('ERROR (catatonit:')) {
      return null;
    }

    const stderr = [compileErr, programErr].filter(Boolean).join('\n');
    const isErr = exitCode !== 0 || (compileErr.length > 0 && stdout.length === 0);

    return {
      stdout,
      stderr,
      exitCode: isErr ? (exitCode === 0 ? 1 : exitCode) : 0,
      executionTimeMs: elapsedMs,
      compilerName: `${spec.badgeLabel} (Wandbox)`,
      errorLine: isErr ? parseErrorLine(stderr, spec.lang, prepared.lineOffset) : null,
      source: 'wandbox',
      commandLabel: spec.commandLabel,
    };
  } catch {
    return null;
  }
}

function stripBasicTypeScriptTypes(source: string): string {
  return source
    .replace(/\b(?:interface|type)\s+\w+\s*(?:=[^;{]+;|\{[^}]*\})/g, '')
    .replace(/(\w+)\s*:\s*(?:string|number|boolean|any|void|unknown|never)(?:\[\])?/g, '$1')
    .replace(/\)\s*:\s*(?:string|number|boolean|any|void|unknown|never|Player)(?:\[\])?\s*\{/g, ') {')
    .replace(/as\s+(?:const|string|number|boolean|any|\w+)/g, '');
}

function formatPrintableValue(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function runLocalJsSandbox(
  lang: 'js' | 'ts',
  source: string,
): CompilerExecutionResult {
  const startMs = Date.now();
  const captured: string[] = [];
  const errors: string[] = [];

  const mockConsole = {
    log: (...args: unknown[]) => captured.push(args.map(formatPrintableValue).join(' ')),
    info: (...args: unknown[]) => captured.push(args.map(formatPrintableValue).join(' ')),
    warn: (...args: unknown[]) => captured.push(`[warn] ${args.map(formatPrintableValue).join(' ')}`),
    error: (...args: unknown[]) => errors.push(args.map(formatPrintableValue).join(' ')),
  };

  try {
    const jsSource = lang === 'ts' ? stripBasicTypeScriptTypes(source) : source;
    const fn = new Function('console', `"use strict";\n${jsSource}`) as (
      c: typeof mockConsole,
    ) => unknown;
    const retVal = fn(mockConsole);
    if (retVal !== undefined && captured.length === 0) {
      captured.push(formatPrintableValue(retVal));
    }
    const elapsed = Math.max(1, Date.now() - startMs);
    const hasErr = errors.length > 0;
    return {
      stdout: captured.join('\n'),
      stderr: errors.join('\n'),
      exitCode: hasErr ? 1 : 0,
      executionTimeMs: elapsed,
      compilerName: lang === 'ts' ? 'Local TS Engine' : 'Local JS Engine',
      errorLine: null,
      source: 'local',
      commandLabel: COMPILER_SPECS[lang].commandLabel,
    };
  } catch (err) {
    const elapsed = Math.max(1, Date.now() - startMs);
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const stack = err instanceof Error ? err.stack ?? '' : '';
    const lineMatch = /<anonymous>:(\d+):/.exec(stack) ?? /:(\d+):\d+/.exec(stack);
    const rawLine = lineMatch ? Math.max(1, Number(lineMatch[1]) - 2) : null;
    return {
      stdout: captured.join('\n'),
      stderr: message,
      exitCode: 1,
      executionTimeMs: elapsed,
      compilerName: lang === 'ts' ? 'Local TS Engine' : 'Local JS Engine',
      errorLine: rawLine,
      source: 'local',
      commandLabel: COMPILER_SPECS[lang].commandLabel,
    };
  }
}

async function runOfflineAstFallback(
  lang: LangId,
  source: string,
): Promise<CompilerExecutionResult> {
  const startMs = Date.now();
  const spec = COMPILER_SPECS[lang];

  // Prefer genuine JS/TS runtime evaluation when snippet doesn't rely on top-level await
  if ((lang === 'js' || lang === 'ts') && !/\bawait\b/.test(source)) {
    return runLocalJsSandbox(lang, source);
  }

  const res = await runPlaygroundCode(lang, source);
  const elapsedMs = Math.max(1, Date.now() - startMs);
  const bodyLines = res.lines.filter(
    (line) =>
      !line.startsWith('> ') &&
      !/^Process exited with code \d+/i.test(line.trim()),
  );

  if (res.exitCode !== 0) {
    const stderr = bodyLines.join('\n') || 'Execution error.';
    return {
      stdout: '',
      stderr,
      exitCode: res.exitCode,
      executionTimeMs: elapsedMs,
      compilerName: `${spec.badgeLabel} (Local)`,
      errorLine: parseErrorLine(stderr, lang, 0),
      source: 'local',
      commandLabel: spec.commandLabel,
    };
  }

  return {
    stdout: bodyLines.join('\n'),
    stderr: '',
    exitCode: 0,
    executionTimeMs: elapsedMs,
    compilerName: `${spec.badgeLabel} (Local)`,
    errorLine: null,
    source: 'local',
    commandLabel: spec.commandLabel,
  };
}

/**
 * Compiles and executes arbitrary multi-language source code using:
 * 1. Piston API (primary when enabled/configured)
 * 2. Judge0 CE API (free multi-language compiler & NASM runtime)
 * 3. Wandbox API (GCC/Clang/Python/Go/Rust failover)
 * 4. Offline JS/TS sandbox & local AST fallback (zero-downtime guarantee)
 */
export async function compileAndRunCode({
  lang,
  source,
  stdin = '',
}: CompileRunParams): Promise<CompilerExecutionResult> {
  const spec = COMPILER_SPECS[lang];

  if (!source.trim()) {
    return {
      stdout: '',
      stderr: 'Editor buffer is empty. Write code or pick a template to run.',
      exitCode: 1,
      executionTimeMs: 1,
      compilerName: spec.badgeLabel,
      errorLine: 1,
      source: 'local',
      commandLabel: spec.commandLabel,
    };
  }

  // HTML & CSS inspect cleanly locally without compiler roundtrips
  if (lang === 'html' || lang === 'css') {
    return runOfflineAstFallback(lang, source);
  }

  // Pedagogical register-trace ASM snippets (without ELF `_start`) run in our local x86 emulator
  if (lang === 'asm' && !/\b_start\b/.test(source) && !/\bglobal\s+/i.test(source)) {
    return runOfflineAstFallback(lang, source);
  }

  const prepared = prepareSourceForCloud(lang, source);

  const pistonResult = await tryPistonExecute(spec, prepared, stdin);
  if (pistonResult) return pistonResult;

  const wandboxFirst =
    lang === 'cpp' || lang === 'c' || lang === 'rust' || lang === 'go';

  if (wandboxFirst) {
    const wandboxResult = await tryWandboxExecute(spec, prepared, stdin);
    if (wandboxResult) return wandboxResult;

    const judge0Result = await tryJudge0Execute(spec, prepared, stdin);
    if (judge0Result) return judge0Result;
  } else {
    const judge0Result = await tryJudge0Execute(spec, prepared, stdin);
    if (judge0Result) return judge0Result;

    const wandboxResult = await tryWandboxExecute(spec, prepared, stdin);
    if (wandboxResult) return wandboxResult;
  }

  return runOfflineAstFallback(lang, source);
}
