/**
 * Unified, non-forced language-specific curriculum engine for all 18 languages:
 * Python (6) · C++ (7) · JavaScript (5) · Go (5) · Java (6) · Rust (6) · SQL (5) · C (6) ·
 * TypeScript (5) · CSS (5) · HTML (5) · PHP (5) · Assembly (5) · Swift (5) ·
 * Kotlin (5) · Julia (5) · Lua (5) · C# (5) = 96 Units, 498 Nodes.
 */

import { Colors } from '@/theme';
import { PYTHON_UNITS } from './pythonCurriculum';
import { CPP_UNITS } from './cppCurriculum';
import { JS_UNITS } from './jsCurriculum';
import { GO_UNITS } from './goCurriculum';
import { JAVA_UNITS } from './javaCurriculum';
import { RUST_UNITS } from './rustCurriculum';
import { SQL_UNITS } from './sqlCurriculum';
import { C_UNITS } from './cCurriculum';
import { TS_UNITS } from './tsCurriculum';
import { CSS_UNITS } from './cssCurriculum';
import { HTML_UNITS } from './htmlCurriculum';
import { PHP_UNITS } from './phpCurriculum';
import { ASM_UNITS } from './asmCurriculum';
import { SWIFT_UNITS } from './swiftCurriculum';
import { KOTLIN_UNITS } from './kotlinCurriculum';
import { JULIA_UNITS } from './juliaCurriculum';
import { LUA_UNITS } from './luaCurriculum';
import { CSHARP_UNITS } from './csharpCurriculum';
import type {
  Exercise,
  FindBugExercise,
  LangId,
  Language,
  LessonNode,
  Unit,
  UnitSeed,
} from './types';

export * from './types';

function buildUnits(lang: LangId, seeds: UnitSeed[]): Unit[] {
  let runningGlobalIdx = 0;

  return seeds.map((seed, uIdx) => {
    const lessonTotal = seed.nodes.filter((n) => n.kind !== 'checkpoint_cube').length;
    let lessonOrdinal = 0;

    const nodes: LessonNode[] = seed.nodes.map((nodeSeed, nIdx) => {
      const globalIndex = runningGlobalIdx++;
      if (nodeSeed.kind !== 'checkpoint_cube') {
        lessonOrdinal += 1;
      }

      const exercises: Exercise[] = nodeSeed.exercises.map((ex, eIdx) => ({
        ...ex,
        id: `${lang}-u${uIdx + 1}-n${nIdx + 1}-e${eIdx + 1}`,
      }));

      const isCube = nodeSeed.kind === 'checkpoint_cube';
      const isBoss = nodeSeed.kind === 'boss_challenge';

      return {
        id: `${lang}-${globalIndex}`,
        lang,
        unitIndex: uIdx,
        nodeIndex: nIdx,
        globalIndex,
        kind: nodeSeed.kind,
        title: nodeSeed.title,
        subtitle: nodeSeed.subtitle || `Step ${lessonOrdinal} of ${lessonTotal}`,
        icon: isCube ? 'cube' : isBoss ? 'trophy' : 'code-slash',
        xpReward: isCube || isBoss ? 50 : 25,
        gemReward: isCube || isBoss ? 25 : 10,
        noHints: isCube,
        exercises,
      };
    });

    return {
      id: `${lang}-unit-${uIdx + 1}`,
      lang,
      unitNumber: uIdx + 1,
      sectionLabel: `SECTION 1, UNIT ${uIdx + 1}`,
      title: seed.title,
      subtitle: seed.subtitle,
      description: seed.subtitle,
      conceptGraphicType: seed.conceptGraphicType,
      color: Colors.violet,
      lipColor: Colors.violetLip,
      guidebook: seed.guidebook,
      nodes,
    };
  });
}

export const LANGUAGES: Language[] = [
  {
    id: 'python',
    name: 'Python',
    short: 'PY',
    badgeBg: '#8B5CF6',
    badgeLip: '#6D28D9',
    fileExt: 'main.py',
    learners: '4.2M learners',
    units: buildUnits('python', PYTHON_UNITS),
  },
  {
    id: 'cpp',
    name: 'C++',
    short: 'C++',
    badgeBg: '#1CB0F6',
    badgeLip: '#1899D6',
    fileExt: 'main.cpp',
    learners: '2.1M learners',
    units: buildUnits('cpp', CPP_UNITS),
  },
  {
    id: 'js',
    name: 'JavaScript',
    short: 'JS',
    badgeBg: '#FFC800',
    badgeLip: '#E5B400',
    fileExt: 'index.js',
    learners: '3.8M learners',
    units: buildUnits('js', JS_UNITS),
  },
  {
    id: 'go',
    name: 'Go',
    short: 'GO',
    badgeBg: '#00CD9C',
    badgeLip: '#00A880',
    fileExt: 'main.go',
    learners: '1.4M learners',
    units: buildUnits('go', GO_UNITS),
  },
  {
    id: 'java',
    name: 'Java',
    short: 'JAVA',
    badgeBg: '#EA8C2E',
    badgeLip: '#B56312',
    fileExt: 'Main.java',
    learners: '2.9M learners',
    units: buildUnits('java', JAVA_UNITS),
  },
  {
    id: 'rust',
    name: 'Rust',
    short: 'RUST',
    badgeBg: '#F74C00',
    badgeLip: '#B83400',
    fileExt: 'main.rs',
    learners: '1.1M learners',
    units: buildUnits('rust', RUST_UNITS),
  },
  {
    id: 'sql',
    name: 'SQL',
    short: 'SQL',
    badgeBg: '#38BDF8',
    badgeLip: '#0284C7',
    fileExt: 'query.sql',
    learners: '3.6M learners',
    units: buildUnits('sql', SQL_UNITS),
  },
  {
    id: 'c',
    name: 'C',
    short: 'C',
    badgeBg: '#5C6BC0',
    badgeLip: '#283593',
    fileExt: 'main.c',
    learners: '1.9M learners',
    units: buildUnits('c', C_UNITS),
  },
  {
    id: 'ts',
    name: 'TypeScript',
    short: 'TS',
    badgeBg: '#3178C6',
    badgeLip: '#1E4E8C',
    fileExt: 'main.ts',
    learners: '3.1M learners',
    units: buildUnits('ts', TS_UNITS),
  },
  {
    id: 'css',
    name: 'CSS',
    short: 'CSS',
    badgeBg: '#38BDF8',
    badgeLip: '#0284C7',
    fileExt: 'styles.css',
    learners: '4.8M learners',
    units: buildUnits('css', CSS_UNITS),
  },
  {
    id: 'html',
    name: 'HTML',
    short: 'HTML',
    badgeBg: '#E34F26',
    badgeLip: '#9F2F12',
    fileExt: 'index.html',
    learners: '5.4M learners',
    units: buildUnits('html', HTML_UNITS),
  },
  {
    id: 'php',
    name: 'PHP',
    short: 'PHP',
    badgeBg: '#777BB4',
    badgeLip: '#4A4E82',
    fileExt: 'index.php',
    learners: '2.2M learners',
    units: buildUnits('php', PHP_UNITS),
  },
  {
    id: 'asm',
    name: 'Assembly',
    short: 'ASM',
    badgeBg: '#10B981',
    badgeLip: '#047857',
    fileExt: 'boot.asm',
    learners: '640K learners',
    units: buildUnits('asm', ASM_UNITS),
  },
  {
    id: 'swift',
    name: 'Swift',
    short: 'SWIFT',
    badgeBg: '#F05138',
    badgeLip: '#B52F1A',
    fileExt: 'main.swift',
    learners: '1.7M learners',
    units: buildUnits('swift', SWIFT_UNITS),
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    short: 'KT',
    badgeBg: '#7F52FF',
    badgeLip: '#5227CC',
    fileExt: 'Main.kt',
    learners: '1.8M learners',
    units: buildUnits('kotlin', KOTLIN_UNITS),
  },
  {
    id: 'julia',
    name: 'Julia',
    short: 'JL',
    badgeBg: '#9558B2',
    badgeLip: '#663182',
    fileExt: 'calc.jl',
    learners: '520K learners',
    units: buildUnits('julia', JULIA_UNITS),
  },
  {
    id: 'lua',
    name: 'Lua',
    short: 'LUA',
    badgeBg: '#60A5FA',
    badgeLip: '#2563EB',
    fileExt: 'script.lua',
    learners: '930K learners',
    units: buildUnits('lua', LUA_UNITS),
  },
  {
    id: 'csharp',
    name: 'C#',
    short: 'C#',
    badgeBg: '#68217A',
    badgeLip: '#431150',
    fileExt: 'Program.cs',
    learners: '2.9M learners',
    units: buildUnits('csharp', CSHARP_UNITS),
  },
];

export function getLanguage(id: LangId): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}

export function getNodeById(
  nodeId: string,
): { lang: Language; unit: Unit; node: LessonNode } | undefined {
  for (const lang of LANGUAGES) {
    for (const unit of lang.units) {
      const node = unit.nodes.find((n) => n.id === nodeId);
      if (node) return { lang, unit, node };
    }
  }
  return undefined;
}

export function getNextNodeAfter(nodeId: string): LessonNode | undefined {
  for (const lang of LANGUAGES) {
    const flatNodes = lang.units.flatMap((u) => u.nodes);
    const idx = flatNodes.findIndex((n) => n.id === nodeId);
    if (idx >= 0 && idx + 1 < flatNodes.length) {
      return flatNodes[idx + 1];
    }
  }
  return undefined;
}

/** Collects every find_bug challenge across all 23 units for 60s Bug Hunt Blitz. */
export function getAllBugExercises(): (FindBugExercise & {
  lang: LangId;
  fileExt: string;
})[] {
  const list: (FindBugExercise & { lang: LangId; fileExt: string })[] = [];
  for (const lang of LANGUAGES) {
    for (const unit of lang.units) {
      for (const node of unit.nodes) {
        for (const ex of node.exercises) {
          if (ex.type === 'find_bug') {
            list.push({ ...ex, lang: lang.id, fileExt: lang.fileExt });
          }
        }
      }
    }
  }
  return list;
}

/**
 * Guarantees every lesson node always has playable exercises even if a node
 * seed omits steps.
 */
const FALLBACK_SPECS: Record<
  LangId,
  { sampleCode: string[]; tokenLine: string[]; expected: string[]; distractors: string[] }
> = {
  python: {
    sampleCode: ['value = 42', 'print(value)'],
    tokenLine: ['{{0}} = 42', '{{1}}(value)'],
    expected: ['value', 'print'],
    distractors: ['echo', 'var'],
  },
  cpp: {
    sampleCode: ['int value = 42;', 'std::cout << value;'],
    tokenLine: ['{{0}} value = 42;', 'std::cout << {{1}};'],
    expected: ['int', 'value'],
    distractors: ['var', 'cout'],
  },
  js: {
    sampleCode: ['const value = 42;', 'console.log(value);'],
    tokenLine: ['{{0}} value = 42;', 'console.{{1}}(value);'],
    expected: ['const', 'log'],
    distractors: ['val', 'print'],
  },
  go: {
    sampleCode: ['value := 42', 'fmt.Println(value)'],
    tokenLine: ['value {{0}} 42', 'fmt.{{1}}(value)'],
    expected: [':=', 'Println'],
    distractors: ['=', 'Printf'],
  },
  java: {
    sampleCode: ['int value = 42;', 'System.out.println(value);'],
    tokenLine: ['{{0}} value = 42;', 'System.out.{{1}}(value);'],
    expected: ['int', 'println'],
    distractors: ['var', 'printline'],
  },
  rust: {
    sampleCode: ['let value = 42;', 'println!("{}", value);'],
    tokenLine: ['{{0}} value = 42;', '{{1}}("{}", value);'],
    expected: ['let', 'println!'],
    distractors: ['var', 'print'],
  },
  sql: {
    sampleCode: ['SELECT 42 AS value;'],
    tokenLine: ['{{0}} 42 {{1}} value;'],
    expected: ['SELECT', 'AS'],
    distractors: ['GET', 'INTO'],
  },
  c: {
    sampleCode: ['int value = 42;', 'printf("%d\\n", value);'],
    tokenLine: ['{{0}} value = 42;', '{{1}}("%d\\n", value);'],
    expected: ['int', 'printf'],
    distractors: ['var', 'print'],
  },
  ts: {
    sampleCode: ['const value: number = 42;', 'console.log(value);'],
    tokenLine: ['const value: {{0}} = 42;', 'console.{{1}}(value);'],
    expected: ['number', 'log'],
    distractors: ['int', 'print'],
  },
  css: {
    sampleCode: ['.card {', '  display: flex;', '  gap: 12px;', '}'],
    tokenLine: ['.card { {{0}}: flex; {{1}}: 12px; }'],
    expected: ['display', 'gap'],
    distractors: ['layout', 'space'],
  },
  html: {
    sampleCode: ['<article>', '  <h1>Hello HTML</h1>', '</article>'],
    tokenLine: ['<{{0}}><h1>Hello HTML</h1></{{1}}>'],
    expected: ['article', 'article'],
    distractors: ['div', 'section'],
  },
  php: {
    sampleCode: ['$value = 42;', 'echo "Value: $value";'],
    tokenLine: ['{{0}}value = 42;', '{{1}} "Value: $value";'],
    expected: ['$', 'echo'],
    distractors: ['let', 'print'],
  },
  asm: {
    sampleCode: ['mov rax, 42', 'add rax, 8'],
    tokenLine: ['{{0}} rax, 42', '{{1}} rax, 8'],
    expected: ['mov', 'add'],
    distractors: ['let', 'inc'],
  },
  swift: {
    sampleCode: ['let value = 42', 'print("Val: \\(value)")'],
    tokenLine: ['{{0}} value = 42', '{{1}}("Val: \\(value)")'],
    expected: ['let', 'print'],
    distractors: ['val', 'echo'],
  },
  kotlin: {
    sampleCode: ['val value = 42', 'println("Val: $value")'],
    tokenLine: ['{{0}} value = 42', '{{1}}("Val: $value")'],
    expected: ['val', 'println'],
    distractors: ['let', 'echo'],
  },
  julia: {
    sampleCode: ['arr = [10, 20, 30]', 'println(arr[1])'],
    tokenLine: ['arr = [10, 20, 30]', '{{0}}(arr[{{1}}])'],
    expected: ['println', '1'],
    distractors: ['echo', '0'],
  },
  lua: {
    sampleCode: ['local value = 42', 'print("Val: " .. value)'],
    tokenLine: ['{{0}} value = 42', 'print("Val: " {{1}} value)'],
    expected: ['local', '..'],
    distractors: ['var', '+'],
  },
  csharp: {
    sampleCode: ['var value = 42;', 'Console.WriteLine($"{value}");'],
    tokenLine: ['{{0}} value = 42;', 'Console.{{1}}($"{value}");'],
    expected: ['var', 'WriteLine'],
    distractors: ['let', 'println'],
  },
};

export function buildFallbackExercises(
  lang: LangId,
  nodeId: string,
  topicTitle: string,
  count = 5,
): Exercise[] {
  const { sampleCode, tokenLine, expected, distractors } = FALLBACK_SPECS[lang];

  const pool: Exercise[] = [
    {
      id: `${nodeId}-fb-1`,
      type: 'theory_bite',
      title: topicTitle,
      code: sampleCode,
      highlightNote: `Core ${topicTitle} syntax forms the foundation for every block in this unit.`,
      explanation: `Review how ${topicTitle} declares and prints a value cleanly.`,
    },
    {
      id: `${nodeId}-fb-2`,
      type: 'token_builder',
      prompt: `Complete the ${topicTitle} statement.`,
      codeLines: tokenLine,
      expectedTokens: expected,
      distractors,
      syntaxHint: 'Check exact declaration keywords and output function names.',
      explanation: `Correct ${topicTitle} syntax binds and prints the variable value.`,
    },
    {
      id: `${nodeId}-fb-3`,
      type: 'predict_output',
      prompt: 'What does this snippet print?',
      code: sampleCode,
      options: ['42', 'undefined', '0'],
      answer: 0,
      explanation: 'The variable is initialized to 42 and printed directly.',
    },
    {
      id: `${nodeId}-fb-4`,
      type: 'find_bug',
      prompt: 'Tap the line with the bug.',
      lines: [
        lang === 'python' ? 'count = 10' : 'let count = 10;',
        lang === 'python' ? 'print(cont)' : 'console.log(cont);',
      ],
      bugLine: 1,
      fixed: lang === 'python' ? 'print(count)' : 'console.log(count);',
      explanation: 'Typo in variable name `cont` instead of `count`.',
    },
    {
      id: `${nodeId}-fb-5`,
      type: 'token_builder',
      prompt: 'Fill in the missing token to print the result.',
      codeLines: tokenLine,
      expectedTokens: expected,
      distractors,
      syntaxHint: 'Place the declaration keyword in slot 1 and printer in slot 2.',
      explanation: 'All tokens placed in exact execution order.',
    },
  ];

  return pool.slice(0, count);
}

/** Pre-built interactive playground templates for the Practice tab. */
export interface PlaygroundSnippet {
  title: string;
  description: string;
  code: string[];
  output: string[];
}

export const PLAYGROUND_SNIPPETS: Record<LangId, PlaygroundSnippet[]> = {
  python: [
    {
      title: 'Fibonacci Generator',
      description: 'Compute the first 6 Fibonacci numbers using tuple unpacking.',
      code: [
        'a, b = 0, 1',
        'seq = []',
        'for _ in range(6):',
        '    seq.append(a)',
        '    a, b = b, a + b',
        'print("Fibonacci:", seq)',
      ],
      output: [
        '> Running main.py...',
        'Fibonacci: [0, 1, 1, 2, 3, 5]',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Dictionary Comprehension',
      description: 'Square even numbers into a lookup table.',
      code: [
        'nums = [1, 2, 3, 4, 5, 6]',
        'squares = {n: n ** 2 for n in nums if n % 2 == 0}',
        'print(squares)',
      ],
      output: [
        '> Running main.py...',
        '{2: 4, 4: 16, 6: 36}',
        'Process exited with code 0',
      ],
    },
  ],
  cpp: [
    {
      title: 'Pointer & Reference Swap',
      description: 'Modify two integers in place using C++ references.',
      code: [
        'void swapRef(int& a, int& b) {',
        '    int tmp = a;',
        '    a = b;',
        '    b = tmp;',
        '}',
        '// a=10, b=99 -> swapped:',
        'std::cout << "a=" << a << " b=" << b;',
      ],
      output: [
        '> Compiling main.cpp (clang++ -O2)...',
        'a=99 b=10',
        'Process exited with code 0',
      ],
    },
    {
      title: 'STL Vector Accumulation',
      description: 'Accumulate elements of a dynamic std::vector.',
      code: [
        'std::vector<int> scores = {15, 30, 45, 60};',
        'int total = 0;',
        'for (int s : scores) total += s;',
        'std::cout << "Total XP: " << total;',
      ],
      output: [
        '> Compiling main.cpp (clang++ -O2)...',
        'Total XP: 150',
        'Process exited with code 0',
      ],
    },
  ],
  js: [
    {
      title: 'Array Pipeline (filter + map)',
      description: 'Filter active players and format their display tags.',
      code: [
        'const players = [',
        '  { name: "Luna", xp: 420 },',
        '  { name: "Max", xp: 90 },',
        '  { name: "Zoe", xp: 610 },',
        '];',
        'const top = players.filter(p => p.xp >= 400).map(p => p.name);',
        'console.log("Top:", top.join(", "));',
      ],
      output: [
        '> Running index.js (Node v22)...',
        'Top: Luna, Zoe',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Async Promise Pipeline',
      description: 'Resolve an async calculation concurrently.',
      code: [
        'const compute = async (n) => n * 15;',
        'const [a, b] = await Promise.all([compute(2), compute(4)]);',
        'console.log(`Earned +${a + b} XP!`);',
      ],
      output: [
        '> Running index.js (Node v22)...',
        'Earned +90 XP!',
        'Process exited with code 0',
      ],
    },
  ],
  go: [
    {
      title: 'Goroutine & Channel Ping',
      description: 'Send a message from a concurrent goroutine over a typed channel.',
      code: [
        'ch := make(chan string, 1)',
        'go func() {',
        '    ch <- "pong from goroutine"',
        '}()',
        'fmt.Println("Received:", <-ch)',
      ],
      output: [
        '> Running main.go...',
        'Received: pong from goroutine',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Struct Method Receiver',
      description: 'Level up a Player struct using a pointer receiver.',
      code: [
        'type Player struct { Name string; Level int }',
        'func (p *Player) LevelUp() { p.Level++ }',
        'hero := Player{Name: "Kai", Level: 3}',
        'hero.LevelUp()',
        'fmt.Printf("%s is now Lv.%d\\n", hero.Name, hero.Level)',
      ],
      output: [
        '> Running main.go...',
        'Kai is now Lv.4',
        'Process exited with code 0',
      ],
    },
  ],
  java: [
    {
      title: 'JVM Variables & Loop',
      description: 'Accumulate XP milestones using a typed Java for-loop.',
      code: [
        'int totalXp = 0;',
        'for (int i = 1; i <= 4; i++) {',
        '    totalXp += i * 25;',
        '}',
        'System.out.println("Total XP: " + totalXp);',
      ],
      output: [
        '> Compiling Main.java & launching JVM 21...',
        'Total XP: 250',
        'Process exited with code 0',
      ],
    },
    {
      title: 'HashMap Lookup & Guard',
      description: 'Read league multipliers safely using String & math.',
      code: [
        'String league = "Gold";',
        'int base = 120;',
        'int bonus = league.equals("Gold") ? 60 : 20;',
        'System.out.println(league + " reward: " + (base + bonus));',
      ],
      output: [
        '> Compiling Main.java & launching JVM 21...',
        'Gold reward: 180',
        'Process exited with code 0',
      ],
    },
  ],
  rust: [
    {
      title: 'Match Score Tier',
      description: 'Evaluate an exhaustive match expression without mutations.',
      code: [
        'let xp = 640;',
        'let tier = if xp >= 500 { "Obsidian" } else { "Silver" };',
        'println!("Tier: {} ({} XP)", tier, xp);',
      ],
      output: [
        '> Compiling main.rs (rustc 1.82)...',
        'Tier: Obsidian (640 XP)',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Accumulator Range Loop',
      description: 'Sum a range safely with an explicit mut binding.',
      code: [
        'let mut sum = 0;',
        'for n in 1..=5 {',
        '    sum += n * 10;',
        '}',
        'println!("Sum: {}", sum);',
      ],
      output: [
        '> Compiling main.rs (rustc 1.82)...',
        'Sum: 150',
        'Process exited with code 0',
      ],
    },
  ],
  sql: [
    {
      title: 'Top Learners Leaderboard',
      description: 'Filter active tracks, rank by XP descending, and take Top 3.',
      code: [
        'SELECT handle, lang, xp',
        'FROM users',
        'WHERE xp >= 500',
        'ORDER BY xp DESC',
        'LIMIT 3;',
      ],
      output: [
        '> Executing query.sql on PostgreSQL 16...',
        'handle      | lang   | xp',
        '------------+--------+-----',
        'kenji_rs    | rust   | 1840',
        'ada_py      | python | 1620',
        'tariq_sql   | sql    | 1410',
        '(3 rows returned in 0.4ms)',
      ],
    },
    {
      title: 'Language Cohort Metrics',
      description: 'Group users by language and compute counts and averages.',
      code: [
        'SELECT lang, COUNT(*) AS users, AVG(xp) AS avg_xp',
        'FROM users',
        'GROUP BY lang',
        'ORDER BY avg_xp DESC;',
      ],
      output: [
        '> Executing query.sql on PostgreSQL 16...',
        'lang   | users | avg_xp',
        '-------+-------+-------',
        'rust   | 2     | 1430',
        'python | 2     | 1255',
        'sql    | 2     | 1065',
        'c      | 2     | 940',
        '(4 rows returned in 0.5ms)',
      ],
    },
  ],
  c: [
    {
      title: 'Pointer Swap & printf',
      description: 'Declare pointers, pass addresses, and format with %d.',
      code: [
        'int a = 15, b = 42;',
        'int tmp = a;',
        'a = b;',
        'b = tmp;',
        'printf("a=%d b=%d\\n", a, b);',
      ],
      output: [
        '> Compiling main.c (-Wall -Wextra)...',
        'a=42 b=15',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Loop & Cast Average',
      description: 'Compute exact floating-point mean without int truncation.',
      code: [
        'int total = 0;',
        'for (int i = 1; i <= 4; i++) {',
        '    total += i * 10;',
        '}',
        'double avg = (double)total / 4;',
        'printf("Total=%d Avg=%.1f\\n", total, avg);',
      ],
      output: [
        '> Compiling main.c (-Wall -Wextra)...',
        'Total=100 Avg=25.0',
        'Process exited with code 0',
      ],
    },
  ],
  ts: [
    {
      title: 'Typed Filter & Map',
      description: 'Filter scores cleanly with explicit number annotations.',
      code: [
        'const scores: number[] = [72, 95, 88, 60];',
        'const high: number[] = scores.filter((s: number) => s >= 80);',
        'console.log("High count:", high.length);',
        'console.log("Top:", high.join(", "));',
      ],
      output: [
        '> Running main.ts via tsc + node...',
        'High count: 2',
        'Top: 95, 88',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Typed Player Badge',
      description: 'Use interface & typed function returns cleanly.',
      code: [
        'interface Player { name: string; xp: number; }',
        'function badge(name: string, xp: number): string {',
        '  return name + " -> " + xp + " XP";',
        '}',
        'console.log(badge("Yuna", 1450));',
        'console.log("Strict types verified");',
      ],
      output: [
        '> Running main.ts via tsc + node...',
        'Yuna -> 1450 XP',
        'Strict types verified',
        'Process exited with code 0',
      ],
    },
  ],
  css: [
    {
      title: 'Flexbox Card & Specificity',
      description: 'Compare class selector vs #id.class specificity scores.',
      code: [
        '.card {',
        '  display: flex;',
        '  gap: 12px;',
        '  padding: 16px;',
        '  background: #0E0E12;',
        '}',
        '#hero.card {',
        '  border: 1px solid #6E56CF;',
        '}',
      ],
      output: [
        '> Parsing styles.css & calculating specificity...',
        '.card  [0,1,0] -> 4 props',
        '#hero.card  [1,1,0] -> 1 prop',
        'Process exited with code 0',
      ],
    },
    {
      title: 'CSS Grid & Custom Props',
      description: 'Inspect CSS variables and responsive Grid declarations.',
      code: [
        ':root {',
        '  --accent: #6E56CF;',
        '  --radius: 10px;',
        '}',
        '.bento-grid {',
        '  display: grid;',
        '  grid-template-columns: repeat(2, 1fr);',
        '  gap: 10px;',
        '}',
      ],
      output: [
        '> Parsing styles.css & calculating specificity...',
        ':root  [0,1,0] -> 2 props',
        '.bento-grid  [0,1,0] -> 3 props',
        'Process exited with code 0',
      ],
    },
  ],
  html: [
    {
      title: 'Semantic Card DOM Tree',
      description: 'Inspect structured HTML landmarks and alt attributes.',
      code: [
        '<article class="lesson">',
        '  <h2>DOM Tree</h2>',
        '  <p>Semantic tags help screen readers.</p>',
        '  <img src="badge.png" alt="Lesson badge" />',
        '</article>',
      ],
      output: [
        '> Tokenizing index.html DOM tree...',
        '<article>',
        '  <h2>DOM Tree</h2>',
        '  <p>',
        '  <img> alt="Lesson badge"',
        'A11y check: PASS',
      ],
    },
    {
      title: 'Accessible Labelled Form',
      description: 'Verify labels, controls, and clean landmark hierarchy.',
      code: [
        '<form action="/sync">',
        '  <label for="user">Handle</label>',
        '  <input id="user" type="text" required />',
        '  <button type="submit">Save Profile</button>',
        '</form>',
      ],
      output: [
        '> Tokenizing index.html DOM tree...',
        '<form>',
        '  <label>',
        '  <input>',
        '  <button>',
        'A11y check: PASS',
      ],
    },
  ],
  php: [
    {
      title: 'Interpolated Variables',
      description: 'Combine $variables and dot (.) string concatenation.',
      code: [
        '<?php',
        '$user = "Ada";',
        '$xp = 120;',
        '$bonus = 35;',
        'echo "Player: $user\\n";',
        'echo "Total XP: " . ($xp + $bonus) . "\\n";',
      ],
      output: [
        '> Running index.php via PHP 8.3 CLI...',
        'Player: Ada',
        'Total XP: 155',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Foreach Score Filter',
      description: 'Iterate an indexed PHP array and print passing scores.',
      code: [
        '<?php',
        '$scores = [45, 82, 95, 70];',
        'foreach ($scores as $s) {',
        '  if ($s >= 80) {',
        '    echo "Passed: $s\\n";',
        '  }',
        '}',
      ],
      output: [
        '> Running index.php via PHP 8.3 CLI...',
        'Passed: 82',
        'Passed: 95',
        'Process exited with code 0',
      ],
    },
  ],
  asm: [
    {
      title: 'Register Countdown Loop',
      description: 'Sum 5..1 into RAX using xor, add, dec, and jnz.',
      code: [
        '; Sum 5..1 into RAX',
        'mov rcx, 5',
        'xor rax, rax',
        'loop_start:',
        '  add rax, rcx',
        '  dec rcx',
        '  jnz loop_start',
      ],
      output: [
        '> Assembling boot.asm (x86-64 NASM)...',
        'RAX = 15 (0x000f)',
        'RCX = 0',
        'ZF  = 1',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Multiply & Bit Shift',
      description: 'Trace imul, logical left shift (shl), and mov.',
      code: [
        '; Compute (6 * 7) << 1 + 4',
        'mov rax, 6',
        'imul rax, 7',
        'shl rax, 1',
        'add rax, 4',
        'mov rbx, rax',
      ],
      output: [
        '> Assembling boot.asm (x86-64 NASM)...',
        'RAX = 88 (0x0058)',
        'RBX = 88 (0x0058)',
        'Process exited with code 0',
      ],
    },
  ],
  swift: [
    {
      title: 'Interpolation & Bonus',
      description: 'Combine let, var, and Swift \\(...) string interpolation.',
      code: [
        'let track = "Swift"',
        'var streak = 6',
        'streak += 1',
        'print("\\(track) Streak: \\(streak)")',
        'let bonus = streak * 15',
        'print("Bonus: \\(bonus) XP")',
      ],
      output: [
        '> Running main.swift (Swift 6)...',
        'Swift Streak: 7',
        'Bonus: 105 XP',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Closed Range Accumulator',
      description: 'Loop over Swift closed range 1...4 cleanly.',
      code: [
        'var total = 0',
        'for step in 1...4 {',
        '  total += step * 10',
        '}',
        'print("Steps summed: \\(total)")',
        'print("Complete: true")',
      ],
      output: [
        '> Running main.swift (Swift 6)...',
        'Steps summed: 100',
        'Complete: true',
        'Process exited with code 0',
      ],
    },
  ],
  kotlin: [
    {
      title: 'Templates & val/var',
      description: 'Interpolate $lang and ${xp} cleanly in Kotlin.',
      code: [
        'val lang = "Kotlin"',
        'var xp = 200',
        'xp += 50',
        'println("$lang User: Hana")',
        'println("Total XP: ${xp}")',
      ],
      output: [
        '> Running Main.kt on Kotlin/JVM...',
        'Kotlin User: Hana',
        'Total XP: 250',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Inclusive Range Sum',
      description: 'Accumulate 1..5 cleanly without off-by-one bugs.',
      code: [
        'var total = 0',
        'for (i in 1..5) {',
        '  total += i',
        '}',
        'println("Sum 1..5 = $total")',
        'println("All good")',
      ],
      output: [
        '> Running Main.kt on Kotlin/JVM...',
        'Sum 1..5 = 15',
        'All good',
        'Process exited with code 0',
      ],
    },
  ],
  julia: [
    {
      title: '1-Based Vector Broadcast',
      description: 'Broadcast .* 2 across scores and index element 1.',
      code: [
        'scores = [10, 20, 30]',
        'scaled = scores .* 2',
        'println("First: $(scores[1])")',
        'println("Sum scaled: $(sum(scaled))")',
      ],
      output: [
        '> Running calc.jl (Julia 1.11 JIT)...',
        'First: 10',
        'Sum scaled: 120',
        'Process exited with code 0',
      ],
    },
    {
      title: 'Square Sum & end Block',
      description: 'Evaluate a 1:4 loop inside an explicit end block.',
      code: [
        'total = 0',
        'for i in 1:4',
        '  total += i * i',
        'end',
        'println("Squares sum: $total")',
        'println("Count: $(length([10, 20, 30]))")',
      ],
      output: [
        '> Running calc.jl (Julia 1.11 JIT)...',
        'Squares sum: 30',
        'Count: 3',
        'Process exited with code 0',
      ],
    },
  ],
  lua: [
    {
      title: 'Local Scope & Concat',
      description: 'Use local bindings, .. string concatenation, and # length.',
      code: [
        'local user = "Kai"',
        'local level = 4',
        'print("Lua Hero: " .. user)',
        'print("Next Level: " .. (level + 1))',
      ],
      output: [
        '> Running script.lua on Lua 5.4 VM...',
        'Lua Hero: Kai',
        'Next Level: 5',
        'Process exited with code 0',
      ],
    },
    {
      title: '1-Based Numeric Loop',
      description: 'Iterate 1, 5 inclusively and measure byte length with #.',
      code: [
        'local sum = 0',
        'for i = 1, 5 do',
        '  sum = sum + i * 10',
        'end',
        'print("Total XP: " .. sum)',
        'print("Byte len: " .. #"Lua")',
      ],
      output: [
        '> Running script.lua on Lua 5.4 VM...',
        'Total XP: 150',
        'Byte len: 3',
        'Process exited with code 0',
      ],
    },
  ],
  csharp: [
    {
      title: 'Interpolated C# Output',
      description: 'Use var type inference and $"" string interpolation.',
      code: [
        'string hero = "Theo";',
        'var xp = 300;',
        'xp += 50;',
        'Console.WriteLine($"Player: {hero}");',
        'Console.WriteLine($"Balance: {xp} XP");',
      ],
      output: [
        '> Running Program.cs (.NET 8 SDK)...',
        'Player: Theo',
        'Balance: 350 XP',
        'Process exited with code 0',
      ],
    },
    {
      title: 'For Loop & Integer Math',
      description: 'Compute sum and mean cleanly inside a for loop.',
      code: [
        'int sum = 0;',
        'for (int i = 1; i <= 4; i++) {',
        '  sum += i * 25;',
        '}',
        'Console.WriteLine($"Total: {sum}");',
        'Console.WriteLine($"Avg: {sum / 4}");',
      ],
      output: [
        '> Running Program.cs (.NET 8 SDK)...',
        'Total: 250',
        'Avg: 62',
        'Process exited with code 0',
      ],
    },
  ],
};
