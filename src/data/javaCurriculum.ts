import type { UnitSeed } from './types';

export const JAVA_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: First Steps in Java (6 nodes)
  // =========================================================================
  {
    title: 'First Steps in Java',
    subtitle: 'Print to stdout, declare static types, and master Java arithmetic.',
    conceptGraphicType: 'java_vars',
    guidebook: {
      summary:
        'Java is a strictly typed, object-oriented language compiled to JVM bytecode. Every standalone program runs inside `public static void main(String[] args)`, prints via `System.out.println(...)`, and requires explicit variable types and trailing semicolons `;`.',
      mentalModel:
        'Think of primitive variables (`int`, `double`, `boolean`) as holding direct values on the stack, whereas `String` and class objects store references pointing to immutable or heap-allocated objects.',
      keyTakeaways: [
        'Every executable Java statement ends with a semicolon `;`, and class names match their `.java` filename (`Main.java` -> `public class Main`).',
        'Use primitive `int` for integers, `double` for decimals, `boolean` for `true`/`false`, and capitalized `String` for double-quoted text.',
        'Dividing two `int` values truncates decimals (`7 / 2 == 3`); cast with `(double) a / b` when precision matters.',
        'Lock constants cleanly with the `final` keyword (`final int MAX_HP = 100;`).',
      ],
      keySyntax: [
        {
          title: 'Console Output with System.out.println',
          tag: 'STDOUT',
          code: 'String hero = "Ada";\nint score = 120;\nSystem.out.println(hero + ": " + score);',
          output: 'Ada: 120',
          explanation:
            '`System.out.println` prints any value followed by a newline; `+` concatenates strings cleanly with numbers.',
          notes: [
            'Use `System.out.print(...)` when you want consecutive output on the same line.',
          ],
        },
        {
          title: 'Primitive Types & final Constants',
          tag: 'TYPES',
          code: 'final int maxHp = 100;\nint hp = 75;\ndouble rate = 1.5;\nboolean ready = hp > 0;\nSystem.out.println(ready + " " + (hp * rate));',
          output: 'true 112.5',
          explanation:
            'Java enforces compile-time type checks so storing text inside an `int` or reassigning a `final` variable is rejected immediately.',
          notes: [
            '`long` needs an `L` suffix (`10_000_000_000L`) and `float` needs `f` (`3.5f`).',
          ],
        },
        {
          title: 'Integer Truncation vs Explicit Casting',
          tag: 'MATH',
          code: 'int intRes = 9 / 4;\ndouble exact = (double) 9 / 4;\nSystem.out.println(intRes + " vs " + exact);',
          output: '2 vs 2.25',
          explanation:
            'Java performs integer division whenever both operands are `int`. Cast at least one operand to `(double)` before dividing.',
          notes: [
            '`Math.max(a, b)` and `Math.sqrt(x)` provide fast built-in math without imports.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Expecting Decimals from int / int',
          buggyCode: 'double ratio = 5 / 2; // Evaluates 2 first -> 2.0!',
          fixedCode: 'double ratio = 5.0 / 2;',
          reason:
            'Java evaluates `5 / 2` as integer `2` BEFORE assigning into `double ratio`. Write `5.0` or `(double) 5` so floating-point division runs.',
        },
        {
          title: 'Lowercase string Keyword',
          buggyCode: 'string name = "Java"; // Compile error!',
          fixedCode: 'String name = "Java";',
          reason:
            '`String` is a standard library class in `java.lang`, not a lowercase primitive — its `S` must always be capitalized.',
        },
      ],
      proTip:
        'Java 10+ supports `var` for local variables with obvious right-hand types (`var scores = new ArrayList<Integer>();`), cutting boilerplate while keeping strict static typing.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'System.out & main()',
        subtitle: 'Print formatted text using Java standard output',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Your First Java Program',
            explanation:
              'Every Java app begins executing inside `main`. Send output to stdout using `System.out.println(...)`, ending every statement with `;`.',
            code: ['public class Main {', '  public static void main(String[] args) {', '    System.out.println("Hello, Java!");', '  }', '}'],
            output: 'Hello, Java!',
            highlightNote: '`println` appends a newline automatically; `print` stays on the same line.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the standard Java print statement.',
            codeLines: ['System.{{0}}.{{1}}("Booted");'],
            expectedTokens: ['out', 'println'],
            distractors: ['err', 'log', 'printline'],
            syntaxHint: 'Standard output stream lives on `System.out`.',
            explanation: '`System.out.println(...)` writes `"Booted"` followed by a newline.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the broken Java print statement.',
            lines: [
              'int level = 5;',
              'System.out.println("Level: " + level)',
            ],
            bugLine: 1,
            fixed: 'System.out.println("Level: " + level);',
            explanation: 'Missing trailing semicolon `;` on line 2 causes a Java compile error.',
          },
          {
            type: 'predict_output',
            prompt: 'What gets printed cleanly to the console?',
            code: ['System.out.print("A");', 'System.out.println("B");'],
            options: ['AB', 'A\nB', 'AB\n'],
            answer: 0,
            explanation: '`print("A")` leaves the cursor on the same line right before `println("B")`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Primitives & String',
        subtitle: 'Declare int, double, boolean, and String variables safely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Static Types & final Constants',
            explanation:
              'Java asks for each variable’s type upfront: `int` (whole numbers), `double` (decimals), `boolean` (`true`/`false`), and capitalized `String` (text). Use `final` to lock constants.',
            code: ['final int maxHp = 100;', 'int hp = 85;', 'String tag = "Knight";'],
            highlightNote: 'Notice lowercase `int`/`boolean` vs capitalized `String`.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare a text label and lock a constant ceiling.',
            codeLines: ['{{0}} hero = "Rami";', '{{1}} int cap = 50;'],
            expectedTokens: ['String', 'final'],
            distractors: ['string', 'const', 'str'],
            explanation: '`String` holds text and `final` forbids future reassignments.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid Java type declaration.',
            lines: [
              'int xp = 40;',
              'string badge = "Pro";',
              'System.out.println(badge);',
            ],
            bugLine: 1,
            fixed: 'String badge = "Pro";',
            explanation: '`String` is a class and must start with an uppercase `S`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which Java keyword prevents a variable from ever being reassigned?',
            options: ['final', 'const', 'readonly', 'static'],
            answer: 0,
            explanation: 'In Java, `final` marks constants (Java reserves `const` as unused!).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Casting & Arithmetic',
        subtitle: 'Prevent silent int division truncation using (double)',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicit Type Casting',
            explanation:
              'Dividing two `int` values drops the remainder (`7 / 2` gives `3`). Prefix one operand with `(double)` to force floating-point division.',
            code: ['int a = 7, b = 2;', 'double exact = (double) a / b;  // 3.5'],
            output: '3.5',
          },
          {
            type: 'token_builder',
            prompt: 'Compute exact decimal accuracy cleanly.',
            codeLines: ['int hits = 3, total = 4;', 'double acc = {{0}} hits {{1}} total;'],
            expectedTokens: ['(double)', '/'],
            distractors: ['(int)', '%', 'double'],
            explanation: 'Casting `hits` to `double` before dividing preserves `0.75`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `ratio` evaluate to here?',
            code: ['double ratio = 9 / 2;', 'System.out.println(ratio);'],
            options: ['4.5', '4.0', '4'],
            answer: 1,
            explanation: '`9 / 2` runs integer division first (`4`), then widens to `4.0`!',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the silent precision loss in average calculation.',
            lines: [
              'int sum = 5, count = 2;',
              'double avg = sum / count;',
              'System.out.println(avg);',
            ],
            bugLine: 1,
            fixed: 'double avg = (double) sum / count;',
            explanation: 'Without `(double)`, `5 / 2` yields `2.0` instead of `2.5`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Java Basics Checkpoint',
        subtitle: 'No-hints sprint on Java types, stdout, and precision math',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Declare an immutable constant and print it.',
            codeLines: ['{{0}} int port = 8080;', 'System.out.{{1}}(port);'],
            expectedTokens: ['final', 'println'],
            distractors: ['const', 'printf', 'printLn'],
            explanation: '`final` marks constants; `System.out.println` writes to stdout.',
          },
          {
            type: 'find_bug',
            prompt: 'Identify the line that drops decimal precision.',
            lines: [
              'int total = 15;',
              'double half = total / 2;',
              'System.out.println(half);',
            ],
            bugLine: 1,
            fixed: 'double half = total / 2.0;',
            explanation: '`15 / 2` evaluates as integer `7` unless one operand is a decimal (`2.0`).',
          },
          {
            type: 'predict_output',
            prompt: 'What does Java string + math print?',
            code: ['System.out.println("XP: " + 10 + 5);'],
            options: ['XP: 15', 'XP: 105', 'Compile Error'],
            answer: 1,
            explanation: 'Evaluates left-to-right: `"XP: " + 10` makes `"XP: 10"`, then `+ 5` gives `"XP: 105"`!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'String Concat & Methods',
        subtitle: 'Combine text cleanly without operator precedence surprises',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Parentheses & String APIs',
            explanation:
              '`"Sum: " + 2 + 3` concatenates left-to-right into `"Sum: 23"`. Wrap math inside parentheses `(...)` and inspect lengths with `.length()` or case with `.toUpperCase()`.',
            code: ['String msg = "sum: " + (2 + 3);', 'System.out.println(msg.toUpperCase());'],
            output: 'SUM: 5',
          },
          {
            type: 'token_builder',
            prompt: 'Compute total inside concatenation cleanly.',
            codeLines: ['int a = 12, b = 8;', 'System.out.println("Pts: " + {{0}});'],
            expectedTokens: ['(a + b)'],
            distractors: ['a + b', 'sum(a,b)'],
            explanation: 'Parentheses force arithmetic `a + b` (20) before string concatenation.',
          },
          {
            type: 'multiple_choice',
            question: 'How do you read the character count of a Java `String s`?',
            options: ['s.length()', 'len(s)', 's.length', 's.size()'],
            answer: 0,
            explanation: '`String` exposes `.length()` as a method (with parentheses!).',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the broken `String` length call.',
            lines: [
              'String name = "CodeLingo";',
              'int chars = name.length;',
              'System.out.println(chars);',
            ],
            bugLine: 1,
            fixed: 'int chars = name.length();',
            explanation: 'Arrays use `.length`, whereas `String` objects use the `.length()` method.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss: JVM Ready',
        subtitle: 'Combine constants, casting, and clean output formatting',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build an exact percentage calculation and print it.',
            codeLines: [
              'final int maxXp = 200;',
              'int earned = 150;',
              'double pct = {{0}} earned / maxXp * 100;',
              'System.out.{{1}}("Progress: " + pct + "%");',
            ],
            expectedTokens: ['(double)', 'println'],
            distractors: ['(float)', 'log', 'printLine'],
            explanation: '`(double) earned / maxXp` prevents zero truncation on `150 / 200`.',
          },
          {
            type: 'find_bug',
            prompt: 'Crush the final boss syntax bug.',
            lines: [
              'boolean active = true;',
              'int bonus = 25;',
              'System.out.println("Bonus: " + bonus);',
              'string status = active ? "ON" : "OFF";',
            ],
            bugLine: 3,
            fixed: 'String status = active ? "ON" : "OFF";',
            explanation: '`String` must start with capital `S`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace the final console line.',
            code: ['int x = 10;', 'x += 5;', 'System.out.println("Score=" + (x * 2));'],
            options: ['Score=30', 'Score=25', 'Score=105'],
            answer: 0,
            explanation: '`x` becomes `15`, then `(15 * 2)` gives `30`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Control Flow & Methods (5 nodes)
  // =========================================================================
  {
    title: 'Control Flow & Methods',
    subtitle: 'Branch with switch expressions, write loops, and structure static methods.',
    conceptGraphicType: 'java_flow',
    guidebook: {
      summary:
        'Java requires strict boolean conditions inside `if (...)` and `while (...)` — integers like `1` never coerce to `true`. Reusable helper methods declare an explicit return type (`int`, `void`, `String`) and parameter types upfront.',
      mentalModel:
        'Every parameter in a Java method passes BY VALUE: primitives pass a copied number, while object parameters pass a copied reference pointer — meaning calling mutator methods works, but reassigning the parameter variable does not affect callers.',
      keyTakeaways: [
        'Use `&&`, `||`, and `!` on strict `boolean` values (`if (count > 0)` instead of `if (count)`).',
        'Modern Java `switch` expressions with arrows (`case 1 -> "Gold";`) never fall through cleanly.',
        'Mark helper functions `static` when calling them directly from `main` without instantiating an object.',
        'A method returning `void` exits early with bare `return;`; typed methods must return on every execution path.',
      ],
      keySyntax: [
        {
          title: 'Strict Boolean Branching',
          tag: 'BRANCHING',
          code: 'int hp = 25;\nboolean shielded = false;\nif (hp > 0 && hp < 30 && !shielded) {\n  System.out.println("CRITICAL");\n}',
          output: 'CRITICAL',
          explanation:
            'Conditions must evaluate strictly to `boolean` — Java forbids accidental `if (x = 5)` assignments at compile time.',
          notes: [
            'Short-circuit `&&` skips evaluating the right expression if the left side is already `false`.',
          ],
        },
        {
          title: 'Modern Java Switch Arrow Syntax',
          tag: 'SWITCH',
          code: 'String tier = "S";\nint mult = switch (tier) {\n  case "S", "A" -> 3;\n  case "B" -> 2;\n  default -> 1;\n};\nSystem.out.println(mult);',
          output: '3',
          explanation:
            'Arrow-style `switch` eliminates forgotten `break;` bugs and returns a value cleanly.',
          notes: [
            'Legacy `case "S": ... break;` still works, but arrow syntax is cleaner and safer.',
          ],
        },
        {
          title: 'Static Methods & Early Returns',
          tag: 'METHODS',
          code: 'static int boost(int xp, int mult) {\n  if (xp <= 0) return 0;\n  return xp * mult;\n}\nSystem.out.println(boost(40, 3));',
          output: '120',
          explanation:
            'Declare return type (`int`) and typed parameters `(int xp, int mult)` explicitly before `{ ... }`.',
          notes: [
            'Java supports method overloading: two methods with the same name and distinct parameter lists.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Testing an Integer Directly Inside if (...)',
          buggyCode: 'int count = 3;\nif (count) { System.out.println("Yes"); }',
          fixedCode: 'int count = 3;\nif (count > 0) { System.out.println("Yes"); }',
          reason:
            'Unlike C/Python/JS, Java rejects non-boolean expressions inside `if (...)` with incompatible types error.',
        },
        {
          title: 'Missing return Path in Non-void Method',
          buggyCode: 'static int sign(int n) {\n  if (n > 0) return 1;\n} // Error if n <= 0!',
          fixedCode: 'static int sign(int n) {\n  if (n > 0) return 1;\n  return -1;\n}',
          reason:
            'The Java compiler verifies every possible branch returns an `int` before allowing compilation.',
        },
      ],
      proTip:
        'Use guard clauses (`if (input == null) return;`) at the top of methods so your core business logic stays flat and readable.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Strict Conditions & Switch',
        subtitle: 'Write boolean guards and arrow switch expressions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boolean-Only Conditions',
            explanation:
              'Java insists every `if` condition evaluate strictly to `boolean`. Combine tests cleanly with `&&`, `||`, `!`, and leverage arrow `switch` (`case ->`) to avoid fallthrough bugs.',
            code: ['int bonus = switch (rank) {', '  case 1 -> 100;', '  default -> 20;', '};'],
            output: '100',
          },
          {
            type: 'token_builder',
            prompt: 'Guard against zero hearts safely.',
            codeLines: ['if (hearts {{0}} 0 {{1}} !paused) {', '  playTurn();', '}'],
            expectedTokens: ['>', '&&'],
            distractors: ['=', 'and', '&'],
            explanation: '`hearts > 0 && !paused` checks strictly boolean expressions.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the non-boolean `if` condition.',
            lines: [
              'int lives = 2;',
              'if (lives) {',
              '  System.out.println("Playing");',
              '}',
            ],
            bugLine: 1,
            fixed: 'if (lives > 0) {',
            explanation: 'Java does not treat `int` as a boolean; write `lives > 0`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `switch` assign to `xp` when `rank` is `"A"`?',
            code: ['String rank = "A";', 'int xp = switch (rank) {', '  case "S", "A" -> 50;', '  default -> 10;', '};', 'System.out.println(xp);'],
            options: ['50', '10', '60'],
            answer: 0,
            explanation: 'Comma labels match multiple cases cleanly with zero fallthrough.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'For & While Loops',
        subtitle: 'Iterate ranges cleanly and skip items with continue',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Indexed Iteration in Java',
            explanation:
              'Use `for (int i = 0; i < n; i++)` for counted loops and `while (cond)` for open-ended state loops.',
            code: ['int sum = 0;', 'for (int i = 1; i <= 4; i++) {', '  sum += i;', '}'],
            output: '10',
          },
          {
            type: 'token_builder',
            prompt: 'Loop cleanly from 0 up to 4 (exclusive of 5).',
            codeLines: ['for (int i = 0; {{0}}; {{1}}) {', '  step(i);', '}'],
            expectedTokens: ['i < 5', 'i++'],
            distractors: ['i in 5', 'i <= 5', '++'],
            explanation: 'Starting at `0` with `i < 5` executes exactly 5 iterations (`0..4`).',
          },
          {
            type: 'predict_output',
            prompt: 'How many numbers get printed before `break`?',
            code: ['for (int i = 1; i <= 5; i++) {', '  if (i == 3) break;', '  System.out.print(i);', '}'],
            options: ['12', '123', '1245'],
            answer: 0,
            explanation: 'At `i == 3`, `break` exits the loop before printing `3`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the off-by-one loop condition bug.',
            lines: [
              '// Should run 3 times: 0, 1, 2',
              'for (int i = 0; i <= 3; i++) {',
              '  tick();',
              '}',
            ],
            bugLine: 1,
            fixed: 'for (int i = 0; i < 3; i++) {',
            explanation: '`0..3` inclusive runs 4 iterations instead of 3.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Logic & Loop Checkpoint',
        subtitle: 'No-hints check on branches, switch, and Java loops',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write an arrow `switch` case returning bonus XP.',
            codeLines: ['int pts = switch (lvl) {', '  case 1 {{0}} 10;', '  {{1}} -> 25;', '};'],
            expectedTokens: ['->', 'default'],
            distractors: [':', 'else', 'break'],
            explanation: 'Arrow switch arms separate patterns from results with `->` and use `default`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the unreachable or invalid return condition.',
            lines: [
              'int x = 10;',
              'if (x = 10) {',
              '  System.out.println("Ten");',
              '}',
            ],
            bugLine: 1,
            fixed: 'if (x == 10) {',
            explanation: 'Equality uses `==`; `=` is assignment.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace the `continue` loop output.',
            code: ['int sum = 0;', 'for (int i = 1; i <= 4; i++) {', '  if (i == 2) continue;', '  sum += i;', '}', 'System.out.println(sum);'],
            options: ['8', '10', '1'],
            answer: 0,
            explanation: '`1 + 3 + 4 = 8` (`2` is skipped).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Methods & Overloading',
        subtitle: 'Declare typed return values and reusable helper functions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Defining Static Helper Methods',
            explanation:
              'Every Java method specifies `[modifiers] returnType name(paramType param)`. Methods returning nothing use `void`.',
            code: ['static int addBonus(int xp, int mult) {', '  return xp * mult;', '}'],
            highlightNote: 'Calling `addBonus(20, 3)` returns `60` without mutating caller variables.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the helper method returning a greeting `String`.',
            codeLines: ['static {{0}} greet(String name) {', '  {{1}} "Hi, " + name;', '}'],
            expectedTokens: ['String', 'return'],
            distractors: ['void', 'def', 'print'],
            explanation: 'Declare the return type `String` and exit with `return`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the missing return statement on `else` path.',
            lines: [
              'static int clamp(int n) {',
              '  if (n > 0) return n;',
              '  if (n <= 0) System.out.println(0);',
              '}',
            ],
            bugLine: 2,
            fixed: '  return 0;',
            explanation: 'An `int` method must return an `int` on all code paths — printing is not returning.',
          },
          {
            type: 'multiple_choice',
            question: 'What defines valid Java method overloading?',
            options: [
              'Same method name, different parameter types or count',
              'Different return type only with identical parameters',
              'Renaming variables inside `{}`',
              'Placing `void` before `static`',
            ],
            answer: 0,
            explanation: 'Overloading differentiates methods by their parameter signature.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss: Flow Architect',
        subtitle: 'Synthesize loops, guard clauses, and typed methods',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write a clean `isEven` predicate method.',
            codeLines: ['static {{0}} isEven(int n) {', '  {{1}} n % 2 == 0;', '}'],
            expectedTokens: ['boolean', 'return'],
            distractors: ['bool', 'void', 'int'],
            explanation: 'Java spells booleans out in full (`boolean`).',
          },
          {
            type: 'find_bug',
            prompt: 'Eliminate the infinite `while` loop bug.',
            lines: [
              'int i = 3;',
              'while (i > 0) {',
              '  System.out.println(i);',
              '}',
            ],
            bugLine: 2,
            fixed: '  System.out.println(i--);',
            explanation: '`i` never decrements inside the loop, running forever.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this helper call print?',
            code: ['static int calc(int a) { return a + 5; }', 'static int calc(int a, int b) { return a * b; }', 'System.out.println(calc(3) + calc(2, 4));'],
            options: ['16', '13', '17'],
            answer: 0,
            explanation: '`calc(3)` is `8` and `calc(2, 4)` is `8`; `8 + 8 = 16`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Arrays & Strings (5 nodes)
  // =========================================================================
  {
    title: 'Arrays & Strings',
    subtitle: 'Store fixed sequences in int[], iterate with for-each, and compare Strings safely.',
    conceptGraphicType: 'java_arrays',
    guidebook: {
      summary:
        'Java arrays (`int[]`, `String[]`) are fixed-length contiguous objects whose size is queried via `.length` (a field, NO parentheses). Strings are immutable objects that MUST be compared with `.equals()`, never `==`!',
      mentalModel:
        'Comparing two Strings with `a == b` compares their memory addresses (`false` if constructed separately!), whereas `a.equals(b)` compares the actual characters inside them.',
      keyTakeaways: [
        'Use `arr.length` for arrays (property) vs `str.length()` for Strings (method).',
        'Never compare Strings with `==`; always write `expected.equals(actual)` (safe even if `actual` is `null`!).',
        'Use enhanced `for (int x : arr)` when reading elements cleanly without needing array indices.',
        'When building Strings inside a loop, use `StringBuilder` to avoid creating O(n^2) throwaway Strings.',
      ],
      keySyntax: [
        {
          title: 'Array Declaration & Enhanced For-Each',
          tag: 'ARRAYS',
          code: 'int[] scores = {15, 25, 40};\nint sum = 0;\nfor (int s : scores) { sum += s; }\nSystem.out.println(scores.length + " -> " + sum);',
          output: '3 -> 80',
          explanation:
            'Enhanced `for (int s : scores)` visits every element safely with zero risk of `ArrayIndexOutOfBoundsException`.',
          notes: [
            'Allocate an empty fixed array with `int[] buf = new int[5];` (zero-initialized).',
          ],
        },
        {
          title: 'Safe String Value Comparison',
          tag: 'STRINGS',
          code: 'String mode = new String("pro");\nSystem.out.println(mode.equals("pro"));\nSystem.out.println("PRO".equalsIgnoreCase(mode));',
          output: 'true\ntrue',
          explanation:
            '`.equals()` and `.equalsIgnoreCase()` inspect actual character contents reliably.',
          notes: [
            'Calling literal-first `"pro".equals(input)` prevents `NullPointerException` when `input` might be `null`!',
          ],
        },
        {
          title: 'Fast Loops with StringBuilder',
          tag: 'PERF',
          code: 'StringBuilder sb = new StringBuilder();\nfor (int i = 1; i <= 3; i++) sb.append(i);\nSystem.out.println(sb.toString());',
          output: '123',
          explanation:
            '`StringBuilder` mutates a single backing character buffer cleanly in O(n) total time.',
          notes: [
            'String `+` inside loops allocates a brand-new `String` on every iteration.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Comparing Two Strings Using ==',
          buggyCode: 'if (role == "admin") { grantAccess(); } // Compares references!',
          fixedCode: 'if ("admin".equals(role)) { grantAccess(); }',
          reason:
            '`==` tests whether two references point to the exact same object in heap memory — runtime user Strings often fail `==` even with identical text.',
        },
        {
          title: 'Calling .length() on an Array',
          buggyCode: 'int[] nums = {1, 2};\nint len = nums.length(); // Compile error!',
          fixedCode: 'int[] nums = {1, 2};\nint len = nums.length;',
          reason:
            '`length` on a Java array is a `final` field, not a method. Drop the parentheses.',
        },
      ],
      proTip:
        'Import `java.util.Arrays` for instant helpers: `Arrays.toString(arr)` prints readable `[1, 2, 3]` instead of `[I@3f99bd52`, and `Arrays.sort(arr)` sorts fast in place.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Fixed Arrays & For-Each',
        subtitle: 'Create int[] arrays and read elements safely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Fixed Arrays in Java',
            explanation:
              'Declare arrays with `Type[] name = { ... };`. Check array length via `arr.length` (no parentheses) and loop cleanly with `for (int x : arr)`.',
            code: ['int[] xp = {10, 20, 30};', 'for (int v : xp) { sum += v; }'],
            output: '60',
          },
          {
            type: 'token_builder',
            prompt: 'Loop over every item inside `scores` using enhanced for-each.',
            codeLines: ['int[] scores = {4, 8, 12};', 'for (int s {{0}} scores) {', '  total += s;', '}'],
            expectedTokens: [':'],
            distractors: ['in', 'of', '=>'],
            explanation: 'Java’s enhanced for-each separates variable and collection with `:`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the invalid array length access.',
            lines: [
              'int[] ids = {101, 102, 103};',
              'System.out.println(ids.length());',
            ],
            bugLine: 1,
            fixed: 'System.out.println(ids.length);',
            explanation: 'Array length is a public `final` field (`ids.length`), not a method.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed by accessing array tail index?',
            code: ['String[] langs = {"Py", "Go", "Java"};', 'System.out.println(langs[langs.length - 1]);'],
            options: ['Java', 'Go', 'ArrayIndexOutOfBounds'],
            answer: 0,
            explanation: '`3 - 1 = 2`, which holds `"Java"`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Strings & .equals()',
        subtitle: 'Compare text reliably without reference equality traps',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Why .equals() Matters',
            explanation:
              'Using `a == b` on `String` objects checks memory address equality, NOT character contents! Always write `"target".equals(input)`.',
            code: ['String tag = new String("PRO");', 'boolean ok = "PRO".equals(tag);  // true'],
            highlightNote: 'Putting the literal first avoids null crashes if `tag` is `null`.',
          },
          {
            type: 'token_builder',
            prompt: 'Safely test if `cmd` matches `"run"`.',
            codeLines: ['if ("run".{{0}}(cmd)) {', '  execute();', '}'],
            expectedTokens: ['equals'],
            distractors: ['==', 'compare', 'same'],
            explanation: '`.equals()` compares every character in `String` cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the brittle String equality bug.',
            lines: [
              'String status = getStatus();',
              'if (status == "DONE") {',
              '  finish();',
              '}',
            ],
            bugLine: 1,
            fixed: 'if ("DONE".equals(status)) {',
            explanation: '`==` can fail on heap-created Strings even when text matches `"DONE"`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why are Java `String` objects called "immutable"?',
            options: [
              'Operations like `.toUpperCase()` return a new String without modifying the original',
              'Strings cannot contain digits',
              'Strings live on the CPU stack instead of heap',
              'You cannot reassign a `String` variable',
            ],
            answer: 0,
            explanation: 'Calling string methods always constructs a new String; references can still be reassigned unless `final`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Arrays & Strings Checkpoint',
        subtitle: 'Zero-hints sprint on length fields, bounds & .equals()',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Allocate a 4-integer buffer and assign its last element.',
            codeLines: ['int[] buf = {{0}} int[4];', 'buf[{{1}}] = 99;'],
            expectedTokens: ['new', '3'],
            distractors: ['make', '4', 'alloc'],
            explanation: '`new int[4]` has valid indices `0..3`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the off-by-one array bounds crash.',
            lines: [
              'int[] vals = {10, 20, 30};',
              'for (int i = 0; i <= vals.length; i++) {',
              '  System.out.println(vals[i]);',
              '}',
            ],
            bugLine: 1,
            fixed: 'for (int i = 0; i < vals.length; i++) {',
            explanation: '`i == 3` triggers `ArrayIndexOutOfBoundsException`!',
          },
          {
            type: 'predict_output',
            prompt: 'What does calling `.toUpperCase()` without saving do?',
            code: ['String s = "java";', 's.toUpperCase();', 'System.out.println(s);'],
            options: ['java', 'JAVA', 'Compile Error'],
            answer: 0,
            explanation: '`String` is immutable; ignoring the returned `"JAVA"` leaves `s` unchanged.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'StringBuilder & Matrices',
        subtitle: 'Construct efficient strings in loops without throwaway garbage',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Efficient Append with StringBuilder',
            explanation:
              'Concatenating Strings in a loop with `+=` creates repeated heap copies. Use `StringBuilder` `.append()` and finish with `.toString()`.',
            code: ['var sb = new StringBuilder("v");', 'sb.append(2).append(".0");', 'System.out.println(sb.toString());'],
            output: 'v2.0',
          },
          {
            type: 'token_builder',
            prompt: 'Append digits cleanly into a mutable buffer.',
            codeLines: ['StringBuilder sb = new StringBuilder();', 'sb.{{0}}("ID-").append(7);', 'String res = sb.{{1}}();'],
            expectedTokens: ['append', 'toString'],
            distractors: ['push', 'build', 'concat'],
            explanation: 'Chain `.append(...)` and convert cleanly via `.toString()`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which utility formats a primitive array like `int[] a = {1, 2}` for readable printing?',
            options: ['Arrays.toString(a)', 'a.toString()', 'String.join(a)', 'System.out.dump(a)'],
            answer: 0,
            explanation: 'Bare `a.toString()` prints memory hash `[I@...`; `Arrays.toString(a)` prints `[1, 2]`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the immutable string result that gets discarded.',
            lines: [
              'String title = "hello";',
              'title.replace("h", "H");',
              'System.out.println(title);',
            ],
            bugLine: 1,
            fixed: 'title = title.replace("h", "H");',
            explanation: 'Assign the returned String back to `title` so the change isn’t lost.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss: Buffer Guard',
        subtitle: 'Pass bounds safety, equality, and StringBuilder fluency',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Join array items cleanly with `StringBuilder`.',
            codeLines: [
              'String[] tags = {"py", "rs"};',
              'var out = new StringBuilder();',
              'for (String t {{0}} tags) out.{{1}}(t);',
            ],
            expectedTokens: [':', 'append'],
            distractors: ['in', 'add', 'push'],
            explanation: 'Enhanced loop `:` pairs smoothly with `StringBuilder.append`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the unsafe string equality check.',
            lines: [
              'String env = getEnv();',
              'if (env == "prod") {',
              '  enableCache();',
              '}',
            ],
            bugLine: 1,
            fixed: 'if ("prod".equals(env)) {',
            explanation: '`"prod".equals(env)` prevents reference-compare mismatches and null crashes.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `Arrays`-style indexing print?',
            code: ['int[][] grid = {{1, 2}, {3, 4}};', 'System.out.println(grid[1][0]);'],
            options: ['3', '2', '4'],
            answer: 0,
            explanation: 'Row index `1` (`{3, 4}`), column `0` equals `3`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Classes, OOP & Inheritance (5 nodes)
  // =========================================================================
  {
    title: 'Classes, OOP & Inheritance',
    subtitle: 'Encapsulate fields, write constructors with this, and extend classes with @Override.',
    conceptGraphicType: 'java_oop',
    guidebook: {
      summary:
        'Java builds architectures around `class` blueprints bundling `private` fields with `public` methods. Constructors initialize new instances cleanly using `this`, while subclasses inherit behavior using `extends`, `super(...)`, and `@Override`.',
      mentalModel:
        '`private` hides raw state so external callers go through validated methods (Encapsulation). `@Override` tells the compiler to verify your subclass method signature truly matches a parent method.',
      keyTakeaways: [
        'Keep fields `private` and expose safe read/write methods so invariants can’t be bypassed.',
        'Use `this.field = field` inside constructors when parameter names shadow instance fields.',
        'Call `super(...)` as the very first line in a subclass constructor to initialize parent state.',
        'Annotate overridden methods with `@Override` so typos cause a compile error instead of a silent bug!',
      ],
      keySyntax: [
        {
          title: 'Encapsulated Class & Constructor',
          tag: 'CLASS',
          code: 'class Player {\n  private int xp;\n  Player(int xp) { this.xp = xp; }\n  void gain(int amt) { this.xp += amt; }\n  int getXp() { return xp; }\n}',
          output: 'Player(125)',
          explanation:
            '`this.xp` distinguishes the instance field from the constructor parameter `xp`.',
          notes: [
            'Java 16+ `record Point(int x, int y) {}` generates constructor, getters, and `.equals()` automatically!',
          ],
        },
        {
          title: 'Inheritance with extends & super()',
          tag: 'INHERITANCE',
          code: 'class ProPlayer extends Player {\n  private String badge;\n  ProPlayer(int xp, String b) {\n    super(xp);\n    this.badge = b;\n  }\n}',
          output: 'ProPlayer(200, "S")',
          explanation:
            '`extends` inherits `Player`’s behavior while `super(xp)` delegates base initialization.',
          notes: [
            'Java classes support single inheritance (`extends` one class), avoiding C++ diamond ambiguity.',
          ],
        },
        {
          title: 'Polymorphism & @Override Safety',
          tag: 'OVERRIDE',
          code: '@Override\npublic String toString() {\n  return "Xp=" + getXp();\n}',
          output: 'Xp=125',
          explanation:
            'Overriding `Object.toString()` lets `System.out.println(player)` display human-readable output.',
          notes: [
            'If you accidentally misspell `tostring()`, `@Override` immediately catches it at compile time!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting this. in Shadowed Constructor',
          buggyCode: 'class Box { int w;\n  Box(int w) { w = w; } // Self-assignment no-op!\n}',
          fixedCode: 'class Box { int w;\n  Box(int w) { this.w = w; }\n}',
          reason:
            '`w = w` assigns the parameter back to itself, leaving instance field `this.w` stuck at `0`!',
        },
        {
          title: 'Placing super() After Other Statements',
          buggyCode: 'ProPlayer(int xp) {\n  System.out.println(xp);\n  super(xp); // Compile error!\n}',
          fixedCode: 'ProPlayer(int xp) {\n  super(xp);\n  System.out.println(xp);\n}',
          reason:
            '`super(...)` must execute BEFORE any statements in classic constructors so parent state exists first.',
        },
      ],
      proTip:
        'Prefer `public record User(String name, int xp) {}` for immutable value models — one line gives constructor, accessors, `toString()`, and structural `.equals()`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Classes, Fields & this',
        subtitle: 'Design blueprints with private fields and constructors',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Encapsulation & Constructors',
            explanation:
              'Keep state `private` and initialize fields via a constructor sharing the class name. Use `this.field` whenever a parameter shares a field’s name.',
            code: ['class Hero {', '  private int hp;', '  Hero(int hp) { this.hp = hp; }', '}'],
            highlightNote: 'Unlike C++, do NOT put `;` after a Java class closing brace `}`.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the `Player` constructor cleanly.',
            codeLines: ['class Player {', '  private String name;', '  Player(String name) {', '    {{0}}.name = name;', '  }', '}'],
            expectedTokens: ['this'],
            distractors: ['self', 'super', 'me'],
            explanation: '`this.name` targets the instance field rather than the parameter.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the self-assignment constructor bug.',
            lines: [
              'class Coin {',
              '  int value;',
              '  Coin(int value) { value = value; }',
              '}',
            ],
            bugLine: 2,
            fixed: '  Coin(int value) { this.value = value; }',
            explanation: '`value = value` never writes to the object’s field, leaving `value` as `0`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does creating and inspecting `new Hero()` print?',
            code: ['Hero h = new Hero(80);', 'h.heal(20);', 'System.out.println(h.getHp());'],
            options: ['100', '80', '20'],
            answer: 0,
            explanation: 'Initialized at `80`, then `heal(20)` updates `hp` to `100`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Inheritance & @Override',
        subtitle: 'Extend base classes with super() and safe overrides',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Single Inheritance via extends',
            explanation:
              'A subclass inherits public/protected methods from its parent via `extends`. Always annotate parent overrides with `@Override`.',
            code: ['class Admin extends User {', '  @Override', '  String role() { return "ADMIN"; }', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Inherit `User` and delegate constructor initialization.',
            codeLines: ['class Pro {{0}} User {', '  Pro(String name) {', '    {{1}}(name);', '  }', '}'],
            expectedTokens: ['extends', 'super'],
            distractors: ['implements', 'this', 'parent'],
            explanation: 'Classes inherit classes via `extends` and initialize parents via `super(...)`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the invalid `super()` call placement.',
            lines: [
              'class Mage extends Hero {',
              '  int mana;',
              '  Mage(int hp, int m) {',
              '    this.mana = m;',
              '    super(hp);',
              '  }',
              '}',
            ],
            bugLine: 4,
            fixed: '  Mage(int hp, int m) { super(hp); this.mana = m; }',
            explanation: '`super(...)` must run before field assignments inside the subclass constructor.',
          },
          {
            type: 'multiple_choice',
            question: 'Why add `@Override` above an overridden Java method?',
            options: [
              'The compiler verifies the signature actually exists in the parent class',
              'It makes the method execute 2x faster',
              'It disables inheritance for subclasses',
              'It automatically marks the method `static`',
            ],
            answer: 0,
            explanation: '`@Override` turns misspelled method overrides into immediate compile errors.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'OOP & Inheritance Checkpoint',
        subtitle: 'No-hints check on encapsulation, super(), and polymorphism',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Mark field private and safely override `toString()`.',
            codeLines: ['{{0}} int xp = 50;', '{{1}} public String toString() { return "XP:" + xp; }'],
            expectedTokens: ['private', '@Override'],
            distractors: ['hidden', '@Virtual', 'protected'],
            explanation: 'Hide state via `private` and guard parent method overrides with `@Override`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the direct access to an encapsulated private field.',
            lines: [
              'class Vault { private int key = 9; }',
              'Vault v = new Vault();',
              'System.out.println(v.key);',
            ],
            bugLine: 2,
            fixed: 'System.out.println(v.getKey());',
            explanation: '`private` fields cannot be read directly from outside `Vault`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does polymorphic dispatch call at runtime?',
            code: ['User u = new Admin();', 'System.out.println(u.role());'],
            options: ['ADMIN', 'USER', 'Compile Error'],
            answer: 0,
            explanation: 'Java dispatches virtual instance methods based on runtime type (`Admin`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Static vs Instance Members',
        subtitle: 'Distinguish per-object fields from class-wide static utilities',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Shared Class State vs Instance State',
            explanation:
              'Fields without `static` belong to EACH `new` object independently. Members marked `static` belong once to the class itself (`Math.max`, counters).',
            code: ['class Bot {', '  static int total = 0;', '  Bot() { total++; }', '}'],
            output: 'total increments once per Bot constructed',
          },
          {
            type: 'token_builder',
            prompt: 'Declare a utility method callable cleanly without `new`.',
            codeLines: ['public {{0}} int doubleXp(int x) {', '  return x * 2;', '}'],
            expectedTokens: ['static'],
            distractors: ['const', 'global', 'this'],
            explanation: '`static` methods attach directly to the class (`Calc.doubleXp(10)`).',
          },
          {
            type: 'multiple_choice',
            question: 'What does modern `record Point(int x, int y) {}` NOT automatically generate?',
            options: [
              'Mutable setter methods (`setX`, `setY`)',
              'A canonical constructor `Point(x, y)`',
              '`equals()` and `hashCode()`',
              'Clean `toString()`',
            ],
            answer: 0,
            explanation: 'Java records are shallowly immutable — fields are `final` with read accessors `x()` and `y()`, never setters.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `main` cannot touch non-static `this` directly.',
            lines: [
              'int bonus = 10;',
              'public static void main(String[] a) {',
              '  System.out.println(bonus);',
              '}',
            ],
            bugLine: 0,
            fixed: 'static int bonus = 10;',
            explanation: '`static` methods cannot read non-static instance fields without an object instance.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss: Domain Modeler',
        subtitle: 'Build solid immutable records and overridden classes',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Create a compact Java 17+ immutable data record.',
            codeLines: ['public {{0}} LessonBadge(String id, int xp) {}'],
            expectedTokens: ['record'],
            distractors: ['struct', 'dataclass', 'enum'],
            explanation: '`record` concisely models transparent immutable data carriers.',
          },
          {
            type: 'find_bug',
            prompt: 'Squash the silent override typo bug.',
            lines: [
              'class Pro extends User {',
              '  @Override',
              '  public String tostring() { return "Pro"; }',
              '}',
            ],
            bugLine: 2,
            fixed: '  public String toString() { return "Pro"; }',
            explanation: 'Case sensitivity matters (`toString` with capital `S`).',
          },
          {
            type: 'predict_output',
            prompt: 'Trace shared `static` counter across two object creations.',
            code: ['new Bot();', 'new Bot();', 'System.out.println(Bot.total);'],
            options: ['2', '1', '0'],
            answer: 0,
            explanation: 'Both instances increment the exact same class-level `static` counter.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Collections & Exceptions (5 nodes)
  // =========================================================================
  {
    title: 'Collections & Exceptions',
    subtitle: 'Manage dynamic ArrayList<T>, lookup HashMap<K,V>, and guard try/catch blocks.',
    conceptGraphicType: 'java_collections',
    guidebook: {
      summary:
        'When collection sizes vary dynamically, Java switches from fixed `int[]` arrays to generics in `java.util`: `ArrayList<T>` for ordered dynamic lists and `HashMap<K, V>` for O(1) key-value lookup, wrapped with `try/catch` error safety.',
      mentalModel:
        'Java generics work ONLY on reference types — never `ArrayList<int>`, always the boxed wrapper `ArrayList<Integer>` (Java auto-boxes `int` ↔ `Integer` cleanly for you!).',
      keyTakeaways: [
        'Use wrapper classes (`Integer`, `Double`, `Boolean`) inside generic type parameters `<...>`.',
        'Call `.add()`, `.get(i)`, and `.size()` on `ArrayList<T>` (methods, unlike `.length` on arrays!).',
        'Read maps safely with `map.getOrDefault(key, 0)` so absent keys never return `null` and trigger `NullPointerException`.',
        'Catch specific exceptions first (`NumberFormatException`) before broad `Exception`, and close resources with try-with-resources.',
      ],
      keySyntax: [
        {
          title: 'Dynamic Lists via ArrayList<T>',
          tag: 'LISTS',
          code: 'var items = new ArrayList<String>();\nitems.add("Java");\nitems.add("Rust");\nSystem.out.println(items.size() + ": " + items.get(1));',
          output: '2: Rust',
          explanation:
            '`ArrayList<T>` grows automatically behind the scenes while providing O(1) `.get(index)` lookup.',
          notes: [
            'Use `List.of("A", "B")` for concise unmodifiable constant lists.',
          ],
        },
        {
          title: 'HashMap<K, V> & getOrDefault()',
          tag: 'MAPS',
          code: 'var xpMap = new HashMap<String, Integer>();\nxpMap.put("java", 120);\nint sqlXp = xpMap.getOrDefault("sql", 0);\nSystem.out.println(xpMap.get("java") + " / " + sqlXp);',
          output: '120 / 0',
          explanation:
            '`getOrDefault` prevents `null` unboxing crashes when reading an unrecorded key.',
          notes: [
            'Accumulate counts cleanly in one line: `xpMap.merge("java", 25, Integer::sum);`.',
          ],
        },
        {
          title: 'Resilient try / catch / finally',
          tag: 'ERRORS',
          code: 'try {\n  int n = Integer.parseInt("abc");\n  System.out.println(n);\n} catch (NumberFormatException e) {\n  System.out.println("Invalid int fallback: 0");\n}',
          output: 'Invalid int fallback: 0',
          explanation:
            'Throwing inside `try` jumps directly to the matching `catch` block, preventing app crashes.',
          notes: [
            'Try-with-resources `try (var sc = new Scanner(...))` auto-closes streams cleanly.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Primitive Type Inside Generics (<int>)',
          buggyCode: 'ArrayList<int> nums = new ArrayList<>(); // Compile error!',
          fixedCode: 'ArrayList<Integer> nums = new ArrayList<>();',
          reason:
            'Java generics require object wrapper types (`Integer`, `Double`, `Long`, `Boolean`) inside angle brackets `<...>`.',
        },
        {
          title: 'Unboxing null from HashMap.get() to int',
          buggyCode: 'int xp = xpMap.get("missing"); // NullPointerException!',
          fixedCode: 'int xp = xpMap.getOrDefault("missing", 0);',
          reason:
            '`HashMap.get()` returns `null` when a key is missing; assigning `null` into primitive `int` crashes at runtime.',
        },
      ],
      proTip:
        'Check uniqueness in O(1) using `HashSet<String>` — `seen.add(tag)` returns `false` if `tag` was already present, letting you filter duplicates cleanly.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'ArrayList<T> & Generics',
        subtitle: 'Grow lists dynamically and understand wrapper types',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Dynamic ArrayList & Boxed Types',
            explanation:
              '`ArrayList<T>` stores ordered, resizable collections. Always write boxed types like `Integer` or `String` inside `<...>`, and query size with `.size()`.',
            code: ['ArrayList<Integer> nums = new ArrayList<>();', 'nums.add(10);', 'System.out.println(nums.get(0));'],
            output: '10',
          },
          {
            type: 'token_builder',
            prompt: 'Create a generic list of integers cleanly.',
            codeLines: ['var scores = new ArrayList<{{0}}>();', 'scores.{{1}}(50);'],
            expectedTokens: ['Integer', 'add'],
            distractors: ['int', 'push', 'append'],
            explanation: 'Use boxed `Integer` in `<...>` and `.add()` to append.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the invalid generic primitive parameter.',
            lines: [
              'import java.util.ArrayList;',
              'ArrayList<int> ids = new ArrayList<>();',
              'ids.add(7);',
            ],
            bugLine: 1,
            fixed: 'ArrayList<Integer> ids = new ArrayList<>();',
            explanation: 'Java generics cannot take primitive `int`; use `Integer`.',
          },
          {
            type: 'predict_output',
            prompt: 'What gets printed after adding and removing an element?',
            code: ['var list = new ArrayList<String>();', 'list.add("A"); list.add("B");', 'list.remove(0);', 'System.out.println(list.get(0));'],
            options: ['B', 'A', 'null'],
            answer: 0,
            explanation: 'Removing index `0` (`"A"`) shifts `"B"` down into index `0`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'HashMap & getOrDefault',
        subtitle: 'Store O(1) key-value maps safely without null crashes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Key-Value Dictionaries via HashMap',
            explanation:
              'Insert with `.put(k, v)` and read safely using `.getOrDefault(k, fallback)` to avoid unexpected `null` crashes.',
            code: ['var map = new HashMap<String, Integer>();', 'map.put("rust", 80);', 'int go = map.getOrDefault("go", 0);'],
            output: '0',
          },
          {
            type: 'token_builder',
            prompt: 'Insert and safely read from a score map.',
            codeLines: ['var xp = new HashMap<String, Integer>();', 'xp.{{0}}("java", 150);', 'int c = xp.{{1}}("c", 0);'],
            expectedTokens: ['put', 'getOrDefault'],
            distractors: ['set', 'get', 'fetch'],
            explanation: '`put` inserts pairs; `getOrDefault` safely guards absent keys.',
          },
          {
            type: 'find_bug',
            prompt: 'Prevent `NullPointerException` when unboxing a missing map entry.',
            lines: [
              'HashMap<String, Integer> m = new HashMap<>();',
              'int score = m.get("unknown");',
              'System.out.println(score);',
            ],
            bugLine: 1,
            fixed: 'int score = m.getOrDefault("unknown", 0);',
            explanation: '`m.get("unknown")` returns `null`, which crashes when auto-unboxed into `int`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which collection automatically drops duplicate elements cleanly?',
            options: ['HashSet<T>', 'ArrayList<T>', 'LinkedList<T>', 'int[]'],
            answer: 0,
            explanation: '`HashSet<T>` stores unique items backed by a hash table.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Collections Checkpoint',
        subtitle: 'Zero-hints check on ArrayList, HashMap, and unboxing safety',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Check element count on a `List` cleanly.',
            codeLines: ['var list = List.of("Py", "Java", "SQL");', 'System.out.println(list.{{0}}());'],
            expectedTokens: ['size'],
            distractors: ['length', 'count', 'len'],
            explanation: 'All `java.util.Collection` implementations measure count with `.size()`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the wrong property used to get `ArrayList` length.',
            lines: [
              'var items = new ArrayList<String>();',
              'items.add("hero");',
              'System.out.println(items.length);',
            ],
            bugLine: 2,
            fixed: 'System.out.println(items.size());',
            explanation: '`ArrayList` has no `.length` field; call `.size()`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace `HashSet` deduplication.',
            code: ['var s = new HashSet<String>();', 's.add("go"); s.add("c"); s.add("go");', 'System.out.println(s.size());'],
            options: ['2', '3', '1'],
            answer: 0,
            explanation: 'Duplicate `"go"` is ignored cleanly; `size()` stays `2`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Try / Catch & Exceptions',
        subtitle: 'Handle runtime faults cleanly with typed catch blocks',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Structured Exception Handling',
            explanation:
              'Wrap risky operations (parsing input, reading files, dividing by user input) in `try { ... } catch (SpecificException e) { ... }`. Clean up cleanly inside `finally`.',
            code: ['try {', '  int n = Integer.parseInt("x");', '} catch (NumberFormatException e) {', '  System.out.println("Fallback 0");', '}'],
            output: 'Fallback 0',
          },
          {
            type: 'token_builder',
            prompt: 'Catch invalid number parsing gracefully.',
            codeLines: ['{{0}} {', '  int v = Integer.parseInt(raw);', '} {{1}} (NumberFormatException e) {', '  handleBadInput();', '}'],
            expectedTokens: ['try', 'catch'],
            distractors: ['attempt', 'except', 'rescue'],
            explanation: 'Java uses `try` and `catch` (not `except`).',
          },
          {
            type: 'multiple_choice',
            question: 'When does a `finally { ... }` block execute?',
            options: [
              'Always after `try`/`catch`, whether an exception was thrown or not',
              'Only when an exception is caught',
              'Only if no exception occurs',
              'Only at JVM shutdown',
            ],
            answer: 0,
            explanation: '`finally` guarantees cleanup runs on normal completion AND error recovery.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the unreachable `catch` ordering bug.',
            lines: [
              'try { risky(); }',
              'catch (Exception e) { log(e); }',
              'catch (IllegalArgumentException iae) { fix(); }',
            ],
            bugLine: 1,
            fixed: 'catch (IllegalArgumentException iae) { fix(); }',
            explanation: 'Catching parent `Exception` first swallows subclasses cleanly, making specific catches below unreachable (compile error)!',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss: Resilient Java',
        subtitle: 'Combine HashMap counts and error guards cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Increment a map counter safely even for unseen keys.',
            codeLines: ['counts.put(lang, counts.{{0}}(lang, 0) {{1}} 1);'],
            expectedTokens: ['getOrDefault', '+'],
            distractors: ['get', 'or', '++'],
            explanation: '`getOrDefault(lang, 0) + 1` avoids null checks completely.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the null-prone boxed integer trap.',
            lines: [
              'var map = new HashMap<String, Integer>();',
              'int lvl = map.get("missing") + 1;',
            ],
            bugLine: 1,
            fixed: 'int lvl = map.getOrDefault("missing", 0) + 1;',
            explanation: 'Missing key returns `null`, throwing `NullPointerException` on `+ 1`.',
          },
          {
            type: 'predict_output',
            prompt: 'What gets printed cleanly by this `try/catch/finally`?',
            code: ['try {', '  int r = 10 / 0;', '  System.out.print("A");', '} catch (ArithmeticException e) {', '  System.out.print("B");', '} finally {', '  System.out.print("C");', '}'],
            options: ['BC', 'ABC', 'B'],
            answer: 0,
            explanation: '`10 / 0` throws immediately -> skips `"A"` -> runs catch `"B"` -> runs finally `"C"`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 6: Interfaces, Streams & Lambdas (5 nodes)
  // =========================================================================
  {
    title: 'Interfaces, Streams & Lambdas',
    subtitle: 'Design contracts with interface, write clean lambdas, and pipeline streams + Optional.',
    conceptGraphicType: 'java_streams',
    guidebook: {
      summary:
        'Modern Java combines `interface` contracts with concise lambda callbacks (`x -> x * 2`), lazy declarative `.stream()` pipelines (`.filter()`, `.map()`, `.toList()`), and explicit `Optional<T>` containers to eliminate surprise null crashes.',
      mentalModel:
        'A Java Stream is NOT a data structure and never mutates the underlying `List` — it is a lazy pipeline that processes elements on demand only once a terminal step (`.toList()`, `.count()`, `.forEach()`) runs.',
      keyTakeaways: [
        'Classes adopt contracts using `implements InterfaceName` and may implement multiple interfaces simultaneously.',
        'Lambdas `x -> expr` concisely implement single-abstract-method ("functional") interfaces like `Predicate<T>`.',
        'Streams require a terminal operation (like `.toList()` or `.sum()`) to actually execute intermediate `.filter()`/`.map()` steps!',
        'Prefer `Optional.ofNullable(v).orElse(fallback)` over returning bare `null` across API boundaries.',
      ],
      keySyntax: [
        {
          title: 'Interfaces & Lambda Implementation',
          tag: 'INTERFACES',
          code: 'interface Scorable { int score(int base); }\nScorable boost = base -> base * 2;\nSystem.out.println(boost.score(35));',
          output: '70',
          explanation:
            'Functional interfaces with one abstract method accept lambda expressions cleanly without anonymous-class boilerplate.',
          notes: [
            'Add `@FunctionalInterface` above single-method interfaces so teammates don’t accidentally add a 2nd abstract method.',
          ],
        },
        {
          title: 'Declarative Stream Pipeline',
          tag: 'STREAMS',
          code: 'var nums = List.of(10, 25, 40, 5);\nvar hits = nums.stream()\n  .filter(n -> n >= 20)\n  .map(n -> n + 5)\n  .toList();\nSystem.out.println(hits);',
          output: '[30, 45]',
          explanation:
            '`.stream()` filters and transforms collections cleanly into a new list without mutating `nums`.',
          notes: [
            'Java 16+ added concise `.toList()` right on `Stream` (replacing `.collect(Collectors.toList())`).',
          ],
        },
        {
          title: 'Null Safety with Optional<T>',
          tag: 'OPTIONAL',
          code: 'Optional<String> tag = Optional.ofNullable(null);\nString out = tag.orElse("Guest");\nSystem.out.println(out);',
          output: 'Guest',
          explanation:
            '`Optional<T>` makes absence explicit in the type system, forcing callers to supply fallbacks like `.orElse(...)`.',
          notes: [
            'Avoid calling raw `.get()` without `.isPresent()` — prefer `.orElse(...)` or `.orElseThrow()`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Omitting a Terminal Operation on a Stream',
          buggyCode: 'var s = list.stream().filter(x -> x > 0); // Lazy! Never runs!',
          fixedCode: 'var res = list.stream().filter(x -> x > 0).toList();',
          reason:
            'Intermediate ops (`.filter`, `.map`) only configure a pipeline; nothing executes until a terminal op (`.toList()`, `.count()`, `.forEach()`) runs.',
        },
        {
          title: 'Using extends Instead of implements for Interfaces',
          buggyCode: 'class Worker extends Runnable { ... }',
          fixedCode: 'class Worker implements Runnable { ... }',
          reason:
            'Classes inherit parent classes with `extends`, but implement interfaces using `implements`.',
        },
      ],
      proTip:
        'Replace verbose `x -> System.out.println(x)` lambdas cleanly using method references: `names.forEach(System.out::println)`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Interfaces & Lambdas',
        subtitle: 'Define shared contracts and concise callback expressions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Contracts via interface & Arrow Lambdas',
            explanation:
              'Classes adopt capabilities with `implements InterfaceName`. Single-method functional interfaces accept crisp `->` lambdas (`(a, b) -> a + b`).',
            code: ['interface Rule { boolean ok(int n); }', 'Rule adult = age -> age >= 18;'],
            highlightNote: 'Notice Java lambdas use single arrow `->` (whereas JS uses `=>`).',
          },
          {
            type: 'token_builder',
            prompt: 'Write a lambda transforming an integer cleanly.',
            codeLines: ['Function<Integer, Integer> dbl = x {{0}} x * 2;', 'class Runner {{1}} Runnable { public void run() {} }'],
            expectedTokens: ['->', 'implements'],
            distractors: ['=>', 'extends', 'uses'],
            explanation: 'Java uses `->` for lambdas and `implements` for interface adoption.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the incorrect arrow syntax in a Java lambda.',
            lines: [
              'var nums = List.of(1, 2, 3);',
              'nums.forEach(n => System.out.println(n));',
            ],
            bugLine: 1,
            fixed: 'nums.forEach(n -> System.out.println(n));',
            explanation: 'Java uses thin arrow `->`, not JS fat arrow `=>`.',
          },
          {
            type: 'multiple_choice',
            question: 'How many interfaces can one Java class implement simultaneously?',
            options: ['Any number separated by commas', 'Only 1', 'At most 2', 'None if abstract'],
            answer: 0,
            explanation: 'A class can `extends` only 1 class, but `implements A, B, C` freely.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Streams (.filter, .map)',
        subtitle: 'Chain declarative data transformations cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Lazy Pipelines & Terminal Collect',
            explanation:
              'Call `.stream()` to transform collections via `.filter(...)`, `.map(...)`, and materialize with `.toList()`.',
            code: ['var res = scores.stream()', '  .filter(s -> s >= 50)', '  .toList();'],
            output: '[50, 90]',
          },
          {
            type: 'token_builder',
            prompt: 'Build a stream that keeps positives and collects them into a list.',
            codeLines: ['var pos = raw.{{0}}()', '  .filter(n -> n > 0)', '  .{{1}}();'],
            expectedTokens: ['stream', 'toList'],
            distractors: ['pipe', 'collectList', 'done'],
            explanation: 'Open via `.stream()` and materialize via `.toList()`.',
          },
          {
            type: 'predict_output',
            prompt: 'What list does the chained pipeline produce?',
            code: ['var r = List.of(2, 5, 8).stream()', '  .filter(x -> x % 2 == 0)', '  .map(x -> x * 10)', '  .toList();', 'System.out.println(r);'],
            options: ['[20, 80]', '[20, 50, 80]', '[2, 8]'],
            answer: 0,
            explanation: 'Only even numbers `2, 8` survive `.filter`, then multiply by `10`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why the stream pipeline never returns a `List`.',
            lines: [
              'List<Integer> raw = List.of(3, 6, 9);',
              'List<Integer> big = raw.stream().filter(n -> n > 4);',
            ],
            bugLine: 1,
            fixed: 'List<Integer> big = raw.stream().filter(n -> n > 4).toList();',
            explanation: 'Without terminal `.toList()`, the expression has type `Stream<Integer>`, not `List<Integer>`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Streams & Optional Checkpoint',
        subtitle: 'Zero-hints sprint on lambdas, streams, and Optional',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Count matches on a Java stream cleanly.',
            codeLines: ['long hits = devs.stream()', '  .{{0}}(d -> d.xp() > 100)', '  .{{1}}();'],
            expectedTokens: ['filter', 'count'],
            distractors: ['where', 'len', 'size'],
            explanation: '`.filter(...)` narrows items and terminal `.count()` returns a `long`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the unguarded `Optional` crash risk.',
            lines: [
              'Optional<String> name = Optional.empty();',
              'String out = name.get();',
            ],
            bugLine: 1,
            fixed: 'String out = name.orElse("Anonymous");',
            explanation: 'Calling `.get()` on empty `Optional` throws `NoSuchElementException`. Use `.orElse(...)`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `Optional.orElse` print?',
            code: ['Optional<Integer> opt = Optional.ofNullable(null);', 'System.out.println(opt.orElse(99));'],
            options: ['99', 'null', 'NoSuchElementException'],
            answer: 0,
            explanation: '`ofNullable(null)` creates empty `Optional`, returning fallback `99`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Optional<T> & Method Refs',
        subtitle: 'Handle absence safely and pass :: method references',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicit Optional & :: Syntax',
            explanation:
              'Wrap nullable results with `Optional.ofNullable(v)` and unwrap via `.orElse(default)`. Pass existing methods cleanly with `ClassName::methodName`.',
            code: ['var opt = Optional.of("Java");', 'opt.ifPresent(System.out::println);'],
            output: 'Java',
          },
          {
            type: 'token_builder',
            prompt: 'Use `::` method reference and `Optional.orElse`.',
            codeLines: ['names.forEach(System.out{{0}}println);', 'String tier = maybeTier.{{1}}("Bronze");'],
            expectedTokens: ['::', 'orElse'],
            distractors: ['->', 'unwrapOr', '.'],
            explanation: '`::` builds a method reference; `.orElse` safely unwraps empty Optionals.',
          },
          {
            type: 'multiple_choice',
            question: 'Which expression replaces `s -> s.toUpperCase()` cleanly?',
            options: ['String::toUpperCase', 'String.toUpperCase()', 's::toUpperCase()', 'toUpperCase->s'],
            answer: 0,
            explanation: '`String::toUpperCase` invokes `.toUpperCase()` on each element in `.map(String::toUpperCase)`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 6 Boss: Modern Java',
        subtitle: 'Combine records, streams, lambdas & Optional null safety',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Pipeline scores cleanly and print top label.',
            codeLines: [
              'int max = List.of(10, 45, 30).{{0}}()',
              '  .mapToInt(n -> n)',
              '  .max()',
              '  .{{1}}(0);',
            ],
            expectedTokens: ['stream', 'orElse'],
            distractors: ['iter', 'unwrap', 'default'],
            explanation: '`max()` on an `IntStream` returns `OptionalInt`, safely unwrapped via `.orElse(0)`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the Java interface inheritance keyword.',
            lines: [
              'interface Syncable { void sync(); }',
              'class CloudSync extends Syncable {',
              '  public void sync() {}',
              '}',
            ],
            bugLine: 1,
            fixed: 'class CloudSync implements Syncable {',
            explanation: 'A class uses `implements` for interfaces, not `extends`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace final modern Java pipeline output.',
            code: ['var res = List.of("a", "go", "rust").stream()', '  .filter(s -> s.length() > 2)', '  .map(String::toUpperCase)', '  .findFirst()', '  .orElse("NONE");', 'System.out.println(res);'],
            options: ['RUST', 'GO', 'NONE'],
            answer: 0,
            explanation: 'Only `"rust"` has `length() > 2`, mapped to `"RUST"`.',
          },
        ],
      },
    ],
  },
];
