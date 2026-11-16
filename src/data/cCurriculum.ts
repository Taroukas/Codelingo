import type { UnitSeed } from './types';

export const C_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Anatomy of C & printf (6 nodes)
  // =========================================================================
  {
    title: 'Anatomy of C & printf',
    subtitle: 'Include headers, run main(), format output with printf, and master C types.',
    conceptGraphicType: 'c_basics',
    guidebook: {
      summary:
        'C is the lean systems language behind operating systems, kernels, and embedded firmware. Every program compiles directly to machine code starting at `int main(void)`, prints formatted text using `<stdio.h>`’s `printf`, and ends cleanly with `return 0;`.',
      mentalModel:
        'C trusts the programmer completely: variables do not auto-initialize to zero, `printf` trusts your `%d` / `%f` / `%s` format specifiers to match each argument, and type sizes sit close to raw CPU registers.',
      keyTakeaways: [
        '`#include <stdio.h>` imports `printf`; `return 0;` signals successful exit from `main`.',
        'Match format specifiers strictly: `%d` (`int`), `%zu` (`size_t` / `sizeof`), `%.2f` (`double`), `%c` (`char`), `%s` (`char*` string).',
        'Single quotes hold one `char` byte (`\'A\'`); double quotes hold a null-terminated `char*` string (`"A"`).',
        'Always initialize local C variables (`int count = 0;`)—uninitialized stack variables contain garbage bytes!',
      ],
      keySyntax: [
        {
          title: 'Minimal Runnable C Program',
          tag: 'MAIN + STDIO',
          code: '#include <stdio.h>\n\nint main(void) {\n    int level = 3;\n    double rate = 98.5;\n    printf("Lv %d -> %.1f%%\\n", level, rate);\n    return 0;\n}',
          output: 'Lv 3 -> 98.5%',
          explanation:
            '`printf` fills `%d` and `%.1f` from left to right. Write `%%` to print a literal percent sign and `\\n` for a newline.',
          notes: [
            '`sizeof(int)` is typically `4` bytes (printed safely with `%zu`).',
          ],
        },
        {
          title: 'Integer Division vs Casts',
          tag: 'ARITHMETIC',
          code: 'int a = 7, b = 2;\nint q = a / b;\ndouble exact = (double)a / b;\nprintf("%d %.2f\\n", q, exact);',
          output: '3 3.50',
          explanation:
            'Dividing two `int` values drops the fractional part (`3`). Casting `(double)a` promotes division to floating point (`3.50`).',
          notes: [
            '`const int MAX_USERS = 64;` forbids modifying a constant after initialization.',
          ],
        },
        {
          title: 'Sizes in Memory with sizeof',
          tag: 'MEMORY SIZE',
          code: '#include <stdio.h>\nprintf("char=%zu int=%zu double=%zu\\n",\n       sizeof(char), sizeof(int), sizeof(double));',
          output: 'char=1 int=4 double=8',
          explanation:
            '`sizeof` is a compile-time operator returning byte width as `size_t` (`%zu`).',
          notes: [
            'Use `<stdint.h>` types (`int32_t`, `uint8_t`) when exact bit width must never vary across CPUs.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Mismatched printf Format Specifier',
          buggyCode: 'double pi = 3.14;\nprintf("pi = %d\\n", pi); // Undefined behavior!',
          fixedCode: 'double pi = 3.14;\nprintf("pi = %.2f\\n", pi);',
          reason:
            '`%d` expects an `int`, whereas `double` lives in floating-point registers or occupies 8 bytes—passing the wrong specifier prints garbage.',
        },
        {
          title: 'Reading Uninitialized Local Variables',
          buggyCode: 'int sum;\nsum += 10; // Undefined garbage value!',
          fixedCode: 'int sum = 0;\nsum += 10;',
          reason:
            'C does NOT zero-initialize stack variables automatically; always assign an initial value on declaration.',
        },
      ],
      proTip:
        'Compile every C file with `-Wall -Wextra -Werror` (`gcc -Wall -Wextra main.c -o main`) so the compiler catches format-specifier mismatches and uninitialized variables immediately.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Headers & main()',
        subtitle: 'Include stdio.h and emit stdout with printf',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Your First C Program',
            explanation:
              'Preprocessor `#include <stdio.h>` exposes `printf`. Execution begins at `int main(void)` and finishes cleanly with `return 0;`.',
            code: ['#include <stdio.h>', '', 'int main(void) {', '    printf("Hello, C!\\n");', '    return 0;', '}'],
            output: 'Hello, C!',
            highlightNote: '`printf` does NOT add a newline automatically—include `\\n`.',
          },
          {
            type: 'token_builder',
            prompt: 'Include standard I/O and print `Booting...` cleanly.',
            codeLines: ['{{0}} <stdio.h>', 'int main(void) {', '    {{1}}("Booting...\\n");', '    return 0;', '}'],
            expectedTokens: ['#include', 'printf'],
            distractors: ['import', 'cout', 'print'],
            syntaxHint: 'Headers start with `#include`, output uses `printf`.',
            explanation: '`#include <stdio.h>` declares `printf` for formatted console output.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the missing semicolon error in C.',
            lines: [
              '#include <stdio.h>',
              'int main(void) {',
              '    printf("Ready\\n")',
              '    return 0;',
              '}',
            ],
            bugLine: 2,
            fixed: '    printf("Ready\\n");',
            explanation: 'Every statement in C must terminate with `;`.',
          },
          {
            type: 'predict_output',
            prompt: 'What prints when `\\n` is omitted between two `printf` calls?',
            code: ['printf("Hi ");', 'printf("C99\\n");'],
            options: ['Hi\nC99', 'Hi C99', 'Compile error'],
            answer: 1,
            explanation: 'Without `\\n` after `"Hi "`, both strings print on the same line.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Types & Format Specifiers',
        subtitle: 'Pair int, double, char safely with %d, %f, %c',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Primitive Types & Format Codes',
            explanation:
              'C primitives map cleanly to printf codes: `int` -> `%d`, `double` -> `%.2f`, `char` (single quotes `\'X\'`) -> `%c`, `char*` -> `%s`.',
            code: ['int hp = 95;', 'double kda = 2.50;', "char rank = 'S';", 'printf("%c %d %.2f\\n", rank, hp, kda);'],
            output: 'S 95 2.50',
            highlightNote: 'C has no built-in `bool` keyword without `<stdbool.h>` (`1`/`0`).',
          },
          {
            type: 'token_builder',
            prompt: 'Print an `int` count and a `double` price to 2 decimal places.',
            codeLines: ['int qty = 4;', 'double price = 12.5;', 'printf("x{{0}} @ ${{1}}\\n", qty, price);'],
            expectedTokens: ['%d', '%.2f'],
            distractors: ['%s', '%c', '%i.2'],
            explanation: '`%d` formats signed `int`; `%.2f` formats `double` to 2 decimals.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the mismatched format specifier.',
            lines: [
              'int score = 88;',
              'printf("Score: %s\\n", score);',
            ],
            bugLine: 1,
            fixed: 'printf("Score: %d\\n", score);',
            explanation: 'Passing `int score` to `%s` treats `88` as a pointer and crashes.',
          },
          {
            type: 'multiple_choice',
            question: 'Which literal represents a single `char` in C?',
            options: ['"A"', "'A'", 'char("A")', 'c"A"'],
            answer: 1,
            explanation: 'Single quotes `\'A\'` produce a 1-byte `char`; `"A"` is a string array.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Casts & sizeof',
        subtitle: 'Control integer truncation and inspect byte sizes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicit Casts & Byte Widths',
            explanation:
              'Int division truncates decimals (`5 / 2 == 2`). Cast with `(double)x` to get floats, and inspect any type’s byte size via `sizeof(x)` (`%zu`).',
            code: ['int a = 5, b = 2;', 'double ratio = (double)a / b;', 'printf("%.1f (%zu bytes)\\n", ratio, sizeof(ratio));'],
            output: '2.5 (8 bytes)',
            highlightNote: 'Print `sizeof(...)` portably with `%zu` (`size_t`).',
          },
          {
            type: 'token_builder',
            prompt: 'Compute exact float ratio and print the byte size of `int`.',
            codeLines: ['double pct = {{0}} 3 / 4;', 'printf("Ratio: %.2f, bytes: %zu\\n", pct, {{1}}(int));'],
            expectedTokens: ['(double)', 'sizeof'],
            distractors: ['double', 'len', 'size'],
            explanation: '`(double) 3 / 4` evaluates `0.75`; `sizeof(int)` gives byte size.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `double x = 9 / 2; printf("%.1f", x);` print?',
            code: ['double x = 9 / 2;', 'printf("%.1f", x);'],
            options: ['4.5', '4.0', '4'],
            answer: 1,
            explanation: '`9 / 2` evaluates as integer `4` first, then converts to `4.0`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `sum` adds onto uninitialized stack garbage.',
            lines: [
              'int sum;',
              'sum = sum + 5;',
              'printf("%d\\n", sum);',
            ],
            bugLine: 0,
            fixed: 'int sum = 0;',
            explanation: 'Local variables in C hold random leftover memory unless initialized.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: C Basics',
        subtitle: 'Lock down headers, types, casts, and format strings',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Lock constant `MAX` and print `sizeof(MAX)`.',
            codeLines: ['{{0}} int MAX = 100;', 'printf("bytes=%zu\\n", {{1}}(MAX));'],
            expectedTokens: ['const', 'sizeof'],
            distractors: ['final', 'let', 'len'],
            explanation: '`const` prevents mutation; `sizeof(MAX)` measures its byte footprint.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the double-quoted char mistake.',
            lines: [
              'char grade = "A";',
              'printf("%c\\n", grade);',
            ],
            bugLine: 0,
            fixed: "char grade = 'A';",
            explanation: '`"A"` is a `const char*` string pointer; `char` requires single quotes `\'A\'`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which `printf` specifier safely prints a `sizeof(...)` result?',
            options: ['%s', '%c', '%zu', '%f'],
            answer: 2,
            explanation: '`sizeof` yields `size_t`, whose exact C specifier is `%zu`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Bitwise & Modulo Ops',
        subtitle: 'Manipulate bits and remainders at hardware speed',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Low-Level Operators',
            explanation:
              'C shines at bit manipulation: `&` (AND), `|` (OR), `^` (XOR), `~` (NOT), `<<` / `>>` bit shifts, plus `%` remainder.',
            code: ['unsigned int flags = 0b0101;', 'unsigned int mask = 1 << 1;', 'printf("%u\\n", flags | mask);'],
            output: '7',
            highlightNote: '`1 << k` sets bit `k` cleanly (`1 << 3 == 8`).',
          },
          {
            type: 'token_builder',
            prompt: 'Check if `n` is odd using bitwise AND (`&`), and shift `1` left by `3`.',
            codeLines: ['int isOdd = n {{0}} 1;', 'int bit3 = 1 {{1}} 3;'],
            expectedTokens: ['&', '<<'],
            distractors: ['&&', '>>', '^'],
            explanation: '`n & 1` inspects bit 0; `1 << 3` builds mask `8`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `printf("%d", (6 | 2));` print?',
            code: ['printf("%d", 6 | 2); // 0b110 | 0b010'],
            options: ['2', '6', '8'],
            answer: 1,
            explanation: '`0b110 | 0b010` equals `0b110` (`6`).',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the logical AND (`&&`) accidentally used instead of bitwise mask `&`.',
            lines: [
              'int FLAG_READ = 4;',
              'int hasRead = (perms && FLAG_READ);',
            ],
            bugLine: 1,
            fixed: 'int hasRead = (perms & FLAG_READ);',
            explanation: '`&&` only tests truthiness (`0` or `1`), whereas `&` masks individual bits.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: C Foundations',
        subtitle: 'Synthesize types, printf specifiers, casts, and bit math',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Include `<stdio.h>`, compute exact average, and format with 1 decimal.',
            codeLines: [
              '{{0}} <stdio.h>',
              'int main(void) {',
              '    int total = 15, n = 4;',
              '    printf("avg={{1}}\\n", (double)total / n);',
              '    return 0;',
              '}',
            ],
            expectedTokens: ['#include', '%.1f'],
            distractors: ['import', '%d', '%.1d'],
            explanation: 'Casting `total` gives `3.75` which `%.1f` renders as `3.8`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the missing cast truncation bug.',
            lines: [
              'int done = 3, total = 4;',
              'double ratio = done / total;',
              'printf("%.2f\\n", ratio);',
            ],
            bugLine: 1,
            fixed: 'double ratio = (double)done / total;',
            explanation: '`done / total` truncates `3 / 4` to `0` before assigning to `ratio`.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `sizeof(char)` guarantee by C standard?',
            options: ['Usually 4 bytes', 'Always 1 byte', 'Always 2 bytes', 'Depends on OS'],
            answer: 1,
            explanation: 'In C, `sizeof(char)` is defined as exactly `1` byte on every platform.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Control Flow & Functions (5 nodes)
  // =========================================================================
  {
    title: 'Control Flow & Functions',
    subtitle: 'Branch cleanly with C truthiness, iterate loops, and declare function prototypes.',
    conceptGraphicType: 'c_flow',
    guidebook: {
      summary:
        'C lacks a native `bool` keyword unless you include `<stdbool.h>`: `0` is false and **any non-zero integer is true**. Functions must be declared (or prototyped at the top of the file) before they are called.',
      mentalModel:
        'The C compiler reads your `.c` file strictly top-to-bottom in a single pass. If `main()` calls `square(5)` before `square` is defined, you need a forward prototype like `int square(int x);` above `main()`.',
      keyTakeaways: [
        'In conditions (`if (x)`), `0` and `NULL` are false; every other integer value is true.',
        'Always guard assignment typos: `if (x = 5)` sets `x` to `5` (non-zero truthy!) instead of comparing `x == 5`.',
        'Every `switch` case falls through to the next case unless you write `break;`.',
        'C passes arguments **by value** (`void bump(int x)` modifies a local copy, leaving caller variables unchanged).',
      ],
      keySyntax: [
        {
          title: 'Function Prototype + Definition',
          tag: 'PROTOTYPE',
          code: '#include <stdio.h>\n\nint square(int x); // Forward prototype\n\nint main(void) {\n    printf("%d\\n", square(6));\n    return 0;\n}\n\nint square(int x) {\n    return x * x;\n}',
          output: '36',
          explanation:
            'Putting `int square(int x);` near the top lets `main()` call `square` cleanly even when the body sits below.',
          notes: [
            'Write `int main(void)` rather than `int main()` in C so empty-arg calls are strictly checked.',
          ],
        },
        {
          title: 'C99 for-Loop & <stdbool.h>',
          tag: 'LOOPS',
          code: '#include <stdbool.h>\nbool found = false;\nfor (int i = 0; i < 4; i++) {\n    if (i == 2) { found = true; break; }\n}',
          output: 'found = 1 (true)',
          explanation:
            '`<stdbool.h>` defines readable `bool`, `true` (`1`), and `false` (`0`).',
          notes: [
            '`switch` also works cleanly on integer/char constants when every case ends in `break;`.',
          ],
        },
        {
          title: 'Pass-by-Value Behavior',
          tag: 'SCOPE',
          code: 'void doubleIt(int x) { x *= 2; }\n\nint n = 10;\ndoubleIt(n);\nprintf("%d\\n", n);',
          output: '10',
          explanation:
            '`doubleIt` receives a copy of `n`, leaving the caller’s `n` untouched at `10`. To mutate `n`, you pass `&n` (pointers in Unit 4).',
          notes: [
            'Use `static` on helper functions to keep them private to one `.c` file.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Single = Inside if Condition',
          buggyCode: 'if (status = 1) { printf("OK"); } // Always assigns 1 (truthy)!',
          fixedCode: 'if (status == 1) { printf("OK"); }',
          reason:
            '`status = 1` overwrites `status` with `1`, evaluates to `1` (true), and always enters the `if` branch!',
        },
        {
          title: 'Missing break in switch Case',
          buggyCode: 'switch (code) {\n  case 1: puts("One");\n  case 2: puts("Two"); break;\n}',
          fixedCode: 'switch (code) {\n  case 1: puts("One"); break;\n  case 2: puts("Two"); break;\n}',
          reason:
            'C `switch` falls straight into subsequent cases if `break;` is omitted.',
        },
      ],
      proTip:
        'A classic C trick to catch accidental assignments at compile time is `"Yoda conditions"` (`if (1 == status)`), though modern `-Wall` warns cleanly whenever `=` appears without extra parentheses.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'C Truthiness & Branching',
        subtitle: 'Understand 0 vs non-zero and guard against = typos',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero Is False, Non-Zero Is True',
            explanation:
              'Without `<stdbool.h>`, C conditions evaluate integers directly: `0` is false, and anything else (`1`, `-3`, `42`) is true. Write `==` to compare!',
            code: ['#include <stdbool.h>', 'bool ready = true;', 'if (ready && score == 100) {', '    printf("Perfect!\\n");', '}'],
            highlightNote: 'Include `<stdbool.h>` whenever you want `bool`, `true`, and `false`.',
          },
          {
            type: 'token_builder',
            prompt: 'Include `<stdbool.h>` and compare `lives` cleanly against `0`.',
            codeLines: ['#include {{0}}', 'bool alive = true;', 'if (lives {{1}} 0) { alive = false; }'],
            expectedTokens: ['<stdbool.h>', '=='],
            distractors: ['<bool.h>', '=', '==='],
            explanation: '`<stdbool.h>` enables `bool`/`true`/`false`; `==` tests equality.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the assignment-in-condition trap!',
            lines: [
              'int loggedIn = 0;',
              'if (loggedIn = 1) {',
              '    printf("Welcome back\\n");',
              '}',
            ],
            bugLine: 1,
            fixed: 'if (loggedIn == 1) {',
            explanation: 'Single `=` mutates `loggedIn` to `1` and always evaluates truthy.',
          },
          {
            type: 'predict_output',
            prompt: 'What prints when `int x = -5; if (x) printf("T"); else printf("F");` runs?',
            code: ['int x = -5;', 'if (x) printf("T");', 'else printf("F");'],
            options: ['T', 'F', 'Compile error'],
            answer: 0,
            explanation: 'In C, every non-zero integer (even `-5`) is truthy.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Loops & switch Statements',
        subtitle: 'Iterate with for/while and prevent switch fallthrough',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Iteration & Clean switch Cases',
            explanation:
              'C `for (init; cond; step)` loops drive exact index ranges, while `switch` dispatches integer/char cases—remember `break;` at the end of every branch!',
            code: ['switch (tier) {', "    case 'A': printf(\"Gold\"); break;", "    default: printf(\"Base\"); break;", '}'],
            highlightNote: 'Every unhandled case jumps to `default:`.',
          },
          {
            type: 'token_builder',
            prompt: 'Prevent case `1` from falling into `default`.',
            codeLines: ['switch (mode) {', '    case 1:', '        printf("Fast\\n");', '        {{0}};', '    {{1}}:', '        printf("Normal\\n");', '}'],
            expectedTokens: ['break', 'default'],
            distractors: ['continue', 'else', 'return'],
            explanation: '`break;` exits the `switch`; `default:` acts as fallback.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the accidental switch fallthrough bug.',
            lines: [
              'switch (n) {',
              '    case 1: printf("One");',
              '    case 2: printf("Two"); break;',
              '}',
            ],
            bugLine: 1,
            fixed: '    case 1: printf("One"); break;',
            explanation: 'Missing `break;` makes `n == 1` print both `"One"` and `"Two"`.',
          },
          {
            type: 'predict_output',
            prompt: 'What prints from `for (int i = 0; i < 6; i += 2) printf("%d", i);`?',
            code: ['for (int i = 0; i < 6; i += 2) {', '    printf("%d", i);', '}'],
            options: ['024', '0246', '246'],
            answer: 0,
            explanation: '`i` takes `0, 2, 4` and stops as soon as `i` hits `6`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Control Flow',
        subtitle: 'Verify loops, bools, and fallthrough behavior',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Loop cleanly `while` `hp` stays above `0` and skip `hp == 2`.',
            codeLines: ['{{0}} (hp > 0) {', '    hp--;', '    if (hp == 2) {{1}};', '}'],
            expectedTokens: ['while', 'continue'],
            distractors: ['for', 'break', 'skip'],
            explanation: '`continue;` jumps straight to the next loop check.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the semicolons killing this for-loop body!',
            lines: [
              'int sum = 0;',
              'for (int i = 1; i <= 5; i++);',
              '{ sum += i; }',
            ],
            bugLine: 1,
            fixed: 'for (int i = 1; i <= 5; i++)',
            explanation: 'A stray `;` right after `for (...)` makes the loop body empty!',
          },
          {
            type: 'multiple_choice',
            question: 'What evaluates to false in a standard C `if (expr)` check?',
            options: ['Only NULL', '0 and NULL only', '-1 and 0', 'Negative numbers'],
            answer: 1,
            explanation: 'Only zero (`0` / `NULL` / `\'\\0\'`) is falsy in C.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Prototypes & Value Passing',
        subtitle: 'Declare functions upfront and understand value copies',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Forward Declarations & Copies',
            explanation:
              'Declare a function prototype (`int add(int a, int b);`) before `main()` so the compiler knows its parameter and return types ahead of the body.',
            code: ['int add(int a, int b); // Prototype', '', 'int main(void) {', '    printf("%d\\n", add(3, 4));', '    return 0;', '}', '', 'int add(int a, int b) { return a + b; }'],
            highlightNote: 'Void functions take/return nothing: `void greet(void)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Write the forward prototype for `cube` taking and returning `int`.',
            codeLines: ['{{0}} cube(int n){{1}}', 'int main(void) {', '    return cube(2);', '}'],
            expectedTokens: ['int', ';'],
            distractors: ['void', 'fn', '{'],
            explanation: 'Prototypes mirror the signature ending cleanly with `;`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `x` equal after `bump(x)` completes?',
            code: ['void bump(int v) { v += 10; }', 'int main(void) {', '    int x = 5;', '    bump(x);', '    printf("%d", x);', '}'],
            options: ['15', '5', '0'],
            answer: 1,
            explanation: 'C passes `x` by value, so `v += 10` mutates only the local parameter.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the incompatible void return mistake.',
            lines: [
              'void logScore(int s) {',
              '    printf("%d\\n", s);',
              '    return s;',
              '}',
            ],
            bugLine: 2,
            fixed: '    return;',
            explanation: 'A `void` function cannot return a value like `s`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Control Flow Mastery',
        subtitle: 'Combine C prototypes, loops, and truthiness cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Declare prototype and return factorial cleanly.',
            codeLines: [
              'int fact(int n){{0}}',
              'int fact(int n) {',
              '    int res = 1;',
              '    for (int i = 2; i <= n; i++) res *= i;',
              '    {{1}} res;',
              '}',
            ],
            expectedTokens: [';', 'return'],
            distractors: ['{', 'yield', 'break'],
            explanation: 'Forward prototype ends in `;` and `fact` sends `res` back via `return`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the bug in this condition.',
            lines: [
              'int ok = 0;',
              'if (ok = 5) {',
              '    printf("Passed\\n");',
              '}',
            ],
            bugLine: 1,
            fixed: 'if (ok == 5) {',
            explanation: 'Use `==` for comparisons rather than assignment `=`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why put `int sum(int a, int b);` before `main` when `sum` is implemented below `main`?',
            options: [
              'To speed up CPU caching',
              'So the single-pass compiler validates types at the call site',
              'To allocate heap memory',
              'To export sum to other programs',
            ],
            answer: 1,
            explanation: 'C validates arguments and return types in top-to-bottom order.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Arrays & C-Strings (5 nodes)
  // =========================================================================
  {
    title: 'Arrays & C-Strings',
    subtitle: 'Work with fixed contiguous arrays, char buffers, null terminators, and <string.h>.',
    conceptGraphicType: 'c_arrays',
    guidebook: {
      summary:
        'C arrays are raw contiguous blocks of memory with **zero automatic bounds checks** and no `.length` property. Strings in C are literally `char` arrays ending with a special zero byte `\'\\0\'` (`NUL`).',
      mentalModel:
        'Think of a C string `"Go"` as 3 consecutive bytes in memory: `[\'G\', \'o\', \'\\0\']`. Functions like `printf("%s")` and `strlen()` simply walk byte by byte until they crash into that `\'\\0\'` sentinel!',
      keyTakeaways: [
        'Compute fixed array length in the declaring scope with `sizeof(arr) / sizeof(arr[0])`—inside functions, arrays **decay to pointers**!',
        'Always reserve `+1` extra byte in every string buffer (`char name[5]` holds max 4 chars + `\'\\0\'`).',
        'Never compare C strings with `==` (that compares pointer addresses!); always use `strcmp(a, b) == 0` from `<string.h>`.',
        'Out-of-bounds array writes (`arr[5] = 9` on size-5 array) silently corrupt adjacent memory (undefined behavior).',
      ],
      keySyntax: [
        {
          title: 'Array Length via sizeof Idiom',
          tag: 'ARRAYS',
          code: 'int nums[] = {10, 20, 30, 40};\nsize_t n = sizeof(nums) / sizeof(nums[0]);\nprintf("len=%zu last=%d\\n", n, nums[n - 1]);',
          output: 'len=4 last=40',
          explanation:
            '`sizeof(nums)` gives total bytes (`16`), and dividing by `sizeof(nums[0])` (`4`) calculates `4` elements portably.',
          notes: [
            'This idiom ONLY works on true stack arrays—not after passing an array to a function parameter `int arr[]`!',
          ],
        },
        {
          title: 'Null-Terminated Strings & <string.h>',
          tag: 'C-STRINGS',
          code: '#include <string.h>\nchar tag[8] = "C99";\nprintf("len=%zu same=%d\\n", strlen(tag), strcmp(tag, "C99") == 0);',
          output: 'len=3 same=1',
          explanation:
            '`strlen` counts chars *before* `\'\\0\'` (`3`), while `strcmp(a, b)` returns `0` when both strings match byte-for-byte.',
          notes: [
            'Use `snprintf(buf, sizeof(buf), ...)` or `strncpy` + manual `buf[cap-1] = \'\\0\'` to avoid buffer overflows.',
          ],
        },
        {
          title: 'Passing Arrays + Explicit Length',
          tag: 'PARAMETERS',
          code: 'int sumArr(const int arr[], size_t len) {\n    int total = 0;\n    for (size_t i = 0; i < len; i++) total += arr[i];\n    return total;\n}',
          output: 'Returns sum without mutating caller array',
          explanation:
            'Because array parameters decay to `int*`, C functions always take `(const int arr[], size_t len)` pairs.',
          notes: [
            'Adding `const` prevents `sumArr` from accidentally modifying caller elements.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Comparing Two C Strings with ==',
          buggyCode: 'char role[6] = "admin";\nif (role == "admin") { /* Usually FALSE! */ }',
          fixedCode: 'char role[6] = "admin";\nif (strcmp(role, "admin") == 0) { /* TRUE! */ }',
          reason:
            '`role == "admin"` compares two **memory addresses**, not text characters. Always check `strcmp(a, b) == 0`.',
        },
        {
          title: 'Off-by-One Missing Null Terminator Byte',
          buggyCode: 'char word[3] = "cat"; // No room for \\0!',
          fixedCode: 'char word[4] = "cat"; // c, a, t, \\0',
          reason:
            'A 3-letter string needs **4** bytes (`+1` for `\'\\0\'`); without it, `printf("%s")` reads past the array!',
        },
      ],
      proTip:
        'Use `snprintf(dst, sizeof(dst), "%s", src)` instead of `strcpy` or `strcat`—it always guarantees `\\0` termination and never overflows `dst`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Contiguous Stack Arrays',
        subtitle: 'Index safely and measure array length with sizeof',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Indexed Arrays & Bounds',
            explanation:
              'C arrays sit side by side in memory with zero bounds checks. Compute element count via `sizeof(arr) / sizeof(arr[0])`. Valid indices run `0` to `len - 1`.',
            code: ['int ids[] = {4, 8, 15, 16};', 'size_t len = sizeof(ids) / sizeof(ids[0]);', 'printf("len=%zu last=%d\\n", len, ids[len - 1]);'],
            output: 'len=4 last=16',
            highlightNote: 'Pass `len` explicitly whenever handing arrays to functions.',
          },
          {
            type: 'token_builder',
            prompt: 'Compute element count of `scores` safely using `sizeof`.',
            codeLines: ['int scores[] = {90, 85, 95};', 'size_t count = {{0}}(scores) / sizeof(scores{{1}});'],
            expectedTokens: ['sizeof', '[0]'],
            distractors: ['len', 'size', '.length'],
            explanation: '`sizeof(scores) / sizeof(scores[0])` returns `3`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the out-of-bounds buffer corruption bug!',
            lines: [
              'int arr[3] = {10, 20, 30};',
              'arr[3] = 40;',
              'printf("%d\\n", arr[2]);',
            ],
            bugLine: 1,
            fixed: 'arr[2] = 40;',
            explanation: 'A size-3 array has valid indices `0, 1, 2`—index `3` corrupts memory.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does a helper function need `(const int a[], size_t n)` instead of running `sizeof(a)` inside?',
            options: [
              'Arrays shrink to 1 element inside functions',
              'Array parameters decay into pointers, so sizeof(a) gives pointer size (8 bytes)',
              'sizeof only works on doubles',
              'const disables sizeof',
            ],
            answer: 1,
            explanation: 'Inside a callee, `a` is just a pointer, losing the array’s total size.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Null-Terminated C-Strings',
        subtitle: 'Understand the \\0 sentinel byte cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Strings Are char Arrays Ending in \\0',
            explanation:
              'Every C string stores an extra `\'\\0\'` zero byte at the end. Reserve `chars + 1` bytes in fixed buffers so printing and `strlen` stop at the right spot.',
            code: ['char city[5] = "Oslo"; // O, s, l, o, \\0', 'printf("%s\\n", city);'],
            output: 'Oslo',
            highlightNote: 'Partial array zero-init: `char buf[8] = {0};` fills all 8 bytes with `\\0`.',
          },
          {
            type: 'token_builder',
            prompt: 'Manually terminate a 3-letter buffer after placing `\'C\'`, `\'9\'`, `\'9\'`.',
            codeLines: ['char ver[{{0}}];', "ver[0] = 'C'; ver[1] = '9'; ver[2] = '9';", "ver[3] = {{1}};"],
            expectedTokens: ['4', "'\\0'"],
            distractors: ['3', "'0'", 'NULL'],
            explanation: '3 characters plus `\'\\0\'` requires `4` total bytes in `ver`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `printf` reads garbage past this char array.',
            lines: [
              "char code[3] = {'S', 'Q', 'L'};",
              'printf("%s\\n", code);',
            ],
            bugLine: 0,
            fixed: 'char code[4] = "SQL";',
            explanation: 'Without a trailing `\'\\0\'`, `%s` scans past `code` into adjacent memory.',
          },
          {
            type: 'predict_output',
            prompt: 'If `char s[] = "hi\\0world";`, what does `printf("%s", s);` print?',
            code: ['char s[] = "hi\\0world";', 'printf("%s", s);'],
            options: ['hiworld', 'hi', 'world'],
            answer: 1,
            explanation: '`%s` stops immediately at the first `\'\\0\'` after `"hi"`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Buffers',
        subtitle: 'Check array sizes, bounds, and null termination',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Pass `nums` safely as read-only (`const`) along with its length.',
            codeLines: ['int maxVal({{0}} int nums[], {{1}} len) {', '    int best = nums[0];', '    for (size_t i = 1; i < len; i++)', '        if (nums[i] > best) best = nums[i];', '    return best;', '}'],
            expectedTokens: ['const', 'size_t'],
            distractors: ['final', 'let', 'void'],
            explanation: '`const` protects input elements and `size_t` matches `sizeof`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the buffer size too small for `"Rust"` + null byte.',
            lines: [
              'char lang[4] = "Rust";',
              'printf("%zu\\n", strlen(lang));',
            ],
            bugLine: 0,
            fixed: 'char lang[5] = "Rust";',
            explanation: '`"Rust"` holds 4 letters plus `\'\\0\'`, needing `char lang[5]`.',
          },
          {
            type: 'multiple_choice',
            question: 'What value does `sizeof("Go")` return in C?',
            options: ['2', '3', '8', '4'],
            answer: 1,
            explanation: '`"Go"` contains `\'G\'`, `\'o\'`, and hidden `\'\\0\'` -> `3` bytes.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: '<string.h> Operations',
        subtitle: 'Compare, measure, and copy strings without buffer overflows',
        exercises: [
          {
            type: 'theory_bite',
            title: 'strlen, strcmp, and snprintf',
            explanation:
              'Never write `strA == strB`! Include `<string.h>` and check `strcmp(a, b) == 0`. Measure chars (excluding `\\0`) with `strlen`, and copy safely with `snprintf`.',
            code: ['#include <string.h>', 'char buf[16];', 'snprintf(buf, sizeof(buf), "%s", "C11");', 'if (strcmp(buf, "C11") == 0) printf("ok\\n");'],
            output: 'ok',
            highlightNote: '`strcmp` returns `0` when strings match—NOT `1`!',
          },
          {
            type: 'token_builder',
            prompt: 'Check if `cmd` equals `"run"` cleanly using `<string.h>`.',
            codeLines: ['#include <string.h>', 'if ({{0}}(cmd, "run") {{1}} 0) {', '    printf("Starting\\n");', '}'],
            expectedTokens: ['strcmp', '=='],
            distractors: ['strlen', '!=', 'equals'],
            explanation: '`strcmp(a, b)` returns `0` when both strings are identical.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the broken C string comparison.',
            lines: [
              'char mode[] = "fast";',
              'if (mode == "fast") {',
              '    printf("Turbo\\n");',
              '}',
            ],
            bugLine: 1,
            fixed: 'if (strcmp(mode, "fast") == 0) {',
            explanation: '`mode == "fast"` compares memory addresses instead of string characters.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `printf("%zu", strlen("Code"));` output?',
            code: ['printf("%zu", strlen("Code"));'],
            options: ['5', '4', '8'],
            answer: 1,
            explanation: '`strlen` counts characters before `\'\\0\'`, returning `4`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: String & Array Master',
        subtitle: 'Prove bounds discipline and safe <string.h> usage',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Copy `src` safely into `dst` bounded by `sizeof(dst)` and test equality.',
            codeLines: [
              'char dst[8];',
              '{{0}}(dst, sizeof(dst), "%s", src);',
              'if ({{1}}(dst, "quit") == 0) return 0;',
            ],
            expectedTokens: ['snprintf', 'strcmp'],
            distractors: ['strcpy', '==', 'strlen'],
            explanation: '`snprintf` respects `sizeof(dst)` cleanly while `strcmp` checks `"quit"`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the off-by-one loop bound bug!',
            lines: [
              'int v[4] = {2, 4, 6, 8};',
              'for (int i = 0; i <= 4; i++) {',
              '    printf("%d\\n", v[i]);',
              '}',
            ],
            bugLine: 1,
            fixed: 'for (int i = 0; i < 4; i++) {',
            explanation: '`i <= 4` reads `v[4]` one element past the end of `v`!',
          },
          {
            type: 'multiple_choice',
            question: 'What does `strcmp("abc", "abc")` return?',
            options: ['1 (true)', '0', '-1', '3'],
            answer: 1,
            explanation: '`strcmp` returns `0` when strings match (`<0` if less, `>0` if greater).',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Pointers & Addresses (5 nodes)
  // =========================================================================
  {
    title: 'Pointers & Addresses',
    subtitle: 'Store addresses, mutate variables via *p, check NULL, and traverse with pointers.',
    conceptGraphicType: 'c_pointers',
    guidebook: {
      summary:
        'A pointer is simply a variable holding a **memory address**. `&x` ("address-of x") grabs where `x` lives in RAM, while `*p` ("dereference p") follows that address to read or write the underlying value.',
      mentalModel:
        'Think of `int x = 42;` as a house at Street `#104` holding `42`. Then `int *p = &x;` is a sticky note with `#104` written on it. Changing `*p = 99;` walks to `#104` and changes the house’s value from `42` to `99`!',
      keyTakeaways: [
        '`&x` yields a pointer to `x` (`int *`), whereas `*p` reads/writes the value stored at pointer `p`.',
        'Pointers unlock **in-place mutation** across function boundaries (`swap(&a, &b)`).',
        'Initialize unused pointers to `NULL` and always write `if (p != NULL)` before dereferencing `*p` (dereferencing `NULL` segfaults!).',
        'In C, array name `arr` decays to `&arr[0]`, and `*(p + 1)` automatically advances by `sizeof(*p)` bytes (not 1 raw byte!).',
      ],
      keySyntax: [
        {
          title: 'Address-Of (&) & Dereference (*)',
          tag: 'BASICS',
          code: 'int score = 10;\nint *ptr = &score;\n*ptr = 25;\nprintf("score=%d addr=%p\\n", score, (void*)ptr);',
          output: 'score=25 addr=0x7ffee4b2',
          explanation:
            '`ptr` stores `&score`. Writing `*ptr = 25` modifies `score` directly through its memory address.',
          notes: [
            'Print pointer addresses with `%p` cast to `(void*)`.',
          ],
        },
        {
          title: 'Swap Two Variables In-Place',
          tag: 'OUT PARAMS',
          code: 'void swap(int *a, int *b) {\n    int tmp = *a;\n    *a = *b;\n    *b = tmp;\n}\n// Call: swap(&x, &y);',
          output: 'Caller’s x and y are genuinely swapped!',
          explanation:
            'Passing `&x` and `&y` sends memory addresses so `swap` mutates the caller’s variables instead of local copies.',
          notes: [
            'Check `if (!a || !b) return;` if callers might pass `NULL`.',
          ],
        },
        {
          title: 'NULL Guards & Pointer Arithmetic',
          tag: 'SAFETY',
          code: 'int arr[3] = {10, 20, 30};\nint *p = arr; // Same as &arr[0]\nprintf("2nd=%d\\n", *(p + 1));',
          output: '2nd=20',
          explanation:
            'Adding `1` to an `int *` steps forward by `sizeof(int)` (`4` bytes), landing cleanly on `arr[1]`.',
          notes: [
            '`const int *p` locks the pointed-to value read-only while letting `p` advance.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Dereferencing an Uninitialized or NULL Pointer',
          buggyCode: 'int *p = NULL;\n*p = 5; // Immediate Segmentation Fault!',
          fixedCode: 'int *p = NULL;\nif (p != NULL) { *p = 5; }',
          reason:
            'Dereferencing `NULL` (`0x0`) or a wild uninitialized pointer tries to access invalid memory and crashes your program.',
        },
        {
          title: 'Returning Pointer to Local Stack Variable',
          buggyCode: 'int* bad(void) { int x = 42; return &x; } // Dangling pointer!',
          fixedCode: 'int good(void) { int x = 42; return x; }',
          reason:
            'Stack frame `x` is destroyed the instant `bad()` returns! Never return the address `&x` of a local non-static variable.',
        },
      ],
      proTip:
        'Keep `*` attached to the variable name (`int *a, *b;` instead of `int* a, b;`), because in C `int* a, b;` actually makes `a` a pointer and `b` a plain `int`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: '& Address & * Dereference',
        subtitle: 'Take memory addresses and read/write target values',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Pointers Point to Memory',
            explanation:
              '`int *p = &x;` saves the address of `x` inside `p`. From then on, `*p` reads or mutates `x` directly in memory.',
            code: ['int hp = 50;', 'int *p = &hp;', '*p += 25;', 'printf("%d\\n", hp);'],
            output: '75',
            highlightNote: 'Notice the two uses of `*`: `int *p` declares a pointer; `*p = ...` dereferences it.',
          },
          {
            type: 'token_builder',
            prompt: 'Point `p` at `level` and double `level` through `p`.',
            codeLines: ['int level = 4;', 'int {{0}} p = {{1}}level;', '*p *= 2;'],
            expectedTokens: ['*', '&'],
            distractors: ['&', '*', '->'],
            syntaxHint: 'Declare pointer with `*`, grab address with `&`.',
            explanation: '`int *p = &level;` stores `level`’s address so `*p *= 2` turns it into `8`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing address-of operator.',
            lines: [
              'int count = 12;',
              'int *ptr = count;',
              'printf("%d\\n", *ptr);',
            ],
            bugLine: 1,
            fixed: 'int *ptr = &count;',
            explanation: '`ptr` expects an address (`&count`), not plain integer `12`.',
          },
          {
            type: 'predict_output',
            prompt: 'What prints after modifying `*p`?',
            code: ['int a = 10;', 'int *p = &a;', '*p = 99;', 'printf("%d", a);'],
            options: ['10', '99', 'Address of a'],
            answer: 1,
            explanation: '`*p = 99` writes `99` directly into `a`’s memory slot.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Mutating via Functions',
        subtitle: 'Pass &x addresses to mutate caller state cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Simulating Pass-by-Reference',
            explanation:
              'Passing `&x` gives a helper function direct access to the caller’s variable via `*p`. Always name parameter pointers clearly.',
            code: ['void reset(int *hp) {', '    *hp = 100;', '}', '// Call: reset(&playerHp);'],
            highlightNote: 'Great way to return multiple outputs from a single C function!',
          },
          {
            type: 'token_builder',
            prompt: 'Implement `swap` in place and pass addresses from `main`.',
            codeLines: ['void swap(int {{0}} a, int *b) {', '    int tmp = *a; *a = *b; *b = tmp;', '}', '// In main:', 'swap({{1}}x, &y);'],
            expectedTokens: ['*', '&'],
            distractors: ['&', '*', '->'],
            explanation: '`void swap(int *a, int *b)` receives `&x` and `&y`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `swap` only swaps addresses locally instead of values!',
            lines: [
              'void swap(int *a, int *b) {',
              '    int *tmp = a;',
              '    a = b;',
              '    b = tmp;',
              '}',
            ],
            bugLine: 1,
            fixed: '    int tmp = *a; *a = *b; *b = tmp;',
            explanation: 'Swapping local pointers `a` and `b` leaves the pointed-to ints untouched; dereference `*a` and `*b`!',
          },
          {
            type: 'multiple_choice',
            question: 'In `int* a, b;`, what type is `b`?',
            options: ['int * (pointer)', 'int (plain integer)', 'void *', 'Compile error'],
            answer: 1,
            explanation: 'In C, `*` binds to the variable name, making `b` a plain `int`!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: NULL & Safety',
        subtitle: 'Prevent segfaults and dangling stack pointers',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Initialize `ptr` safely and guard before dereferencing.',
            codeLines: ['int *ptr = {{0}};', 'if (ptr {{1}} NULL) {', '    printf("%d\\n", *ptr);', '}'],
            expectedTokens: ['NULL', '!='],
            distractors: ['0', '==', 'nullptr'],
            explanation: 'C uses uppercase `NULL` and guards `if (ptr != NULL)` before `*ptr`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the fatal segmentation fault!',
            lines: [
              'int *target = NULL;',
              '*target = 42;',
            ],
            bugLine: 1,
            fixed: 'if (target != NULL) *target = 42;',
            explanation: 'Dereferencing `NULL` immediately crashes with SIGSEGV.',
          },
          {
            type: 'multiple_choice',
            question: 'Why must a C function NEVER return `&localVar`?',
            options: [
              'Local vars live on the heap forever',
              'The stack variable dies on return, leaving a dangling pointer',
              'The `&` operator forbids locals',
              'It prints slower',
            ],
            answer: 1,
            explanation: 'Stack memory is reclaimed once the function returns.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Pointer Arithmetic & Arrays',
        subtitle: 'Walk elements with *(p + i) and const pointers',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Arrays and Pointers Working Together',
            explanation:
              'An array name `nums` decays to `&nums[0]`. Writing `p + 2` skips `2 * sizeof(int)` bytes cleanly, so `*(nums + i)` equals `nums[i]`.',
            code: ['int nums[] = {5, 10, 15};', 'int *p = nums;', 'printf("%d\\n", *(p + 2));'],
            output: '15',
            highlightNote: 'Prefer `const int *p` whenever scanning read-only buffers.',
          },
          {
            type: 'token_builder',
            prompt: 'Read the third element of `arr` via pointer arithmetic without mutating it.',
            codeLines: ['{{0}} int *p = arr;', 'int third = {{1}}(p + 2);'],
            expectedTokens: ['const', '*'],
            distractors: ['final', '&', '->'],
            explanation: '`const int *p` marks elements read-only and `*(p + 2)` fetches `arr[2]`.',
          },
          {
            type: 'predict_output',
            prompt: 'With `int a[] = {3, 6, 9}; int *p = a; p++;`, what does `*p` equal?',
            code: ['int a[] = {3, 6, 9};', 'int *p = a;', 'p++;', 'printf("%d", *p);'],
            options: ['4', '6', '9'],
            answer: 1,
            explanation: '`p++` advances by one whole `int` element from `a[0]` (`3`) to `a[1]` (`6`).',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing parentheses in pointer offset dereferencing.',
            lines: [
              'int a[3] = {10, 20, 30};',
              'int *p = a;',
              'printf("%d\\n", *p + 1); // Wanted a[1]!',
            ],
            bugLine: 2,
            fixed: 'printf("%d\\n", *(p + 1));',
            explanation: '`*p + 1` adds `1` to `10` (`11`), whereas `*(p + 1)` fetches `20`!',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Pointer Tactician',
        subtitle: 'Master & / *, NULL safety, and pointer traversal',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Safely increment `*counter` only when `counter` is non-NULL.',
            codeLines: [
              'void inc(int *counter) {',
              '    if (counter == {{0}}) return;',
              '    ({{1}}counter)++;',
              '}',
            ],
            expectedTokens: ['NULL', '*'],
            distractors: ['0', '&', '->'],
            explanation: '`(*counter)++` increments the pointed value, whereas `*counter++` shifts the pointer!',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the operator-precedence pointer bug (`*p++` vs `(*p)++`)!',
            lines: [
              'void addOne(int *n) {',
              '    *n++; // Moves pointer instead of incrementing int!',
              '}',
            ],
            bugLine: 1,
            fixed: '    (*n)++;',
            explanation: 'Postfix `++` binds tighter than `*`, so parenthesize `(*n)++`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is `x` after `f(&x)`?',
            code: ['void f(int *p) { *p = *p * 3; }', 'int main(void) { int x = 4; f(&x); printf("%d", x); }'],
            options: ['4', '12', 'Address'],
            answer: 1,
            explanation: 'Dereferencing `p` triples `x` directly from `4` to `12`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Structs & Typedefs (5 nodes)
  // =========================================================================
  {
    title: 'Structs & Typedefs',
    subtitle: 'Bundle related fields into structs, simplify names with typedef, and use ->.',
    conceptGraphicType: 'c_structs',
    guidebook: {
      summary:
        'C has no classes, so it models objects by grouping related fields inside a `struct`. Pairing `typedef struct { ... } User;` removes repetitive `struct` prefixes, and pointers to structs use the clean arrow operator `u->xp` instead of `(*u).xp`.',
      mentalModel:
        'Use **dot** (`.`) when you have the struct value itself (`user.xp`), and use **arrow** (`->`) when you hold a **pointer** to a struct (`ptr->xp`). Both read the same field cleanly!',
      keyTakeaways: [
        'Use `typedef struct { ... } Player;` so callers can write `Player p;` cleanly without `struct Player p;`.',
        'Initialize structs with designated initializers: `Player p = {.name = "Ada", .xp = 100};` (unspecified fields zero automatically!).',
        '`ptr->field` is syntactic sugar for `(*ptr).field`—essential when passing structs by pointer.',
        'Passing large structs by `const Player *p` avoids copying the entire struct on every function call.',
      ],
      keySyntax: [
        {
          title: 'typedef struct + Designated Initializer',
          tag: 'STRUCT DEF',
          code: 'typedef struct {\n    const char *handle;\n    int xp;\n    int hearts;\n} Profile;\n\nProfile p = {.handle = "kenji", .xp = 240, .hearts = 5};',
          output: 'p.handle="kenji", p.xp=240, p.hearts=5',
          explanation:
            '`typedef` creates type alias `Profile`. Designated `.field = val` syntax stays readable even when fields reorder.',
          notes: [
            'Any field omitted in `{.handle = "kenji"}` automatically initializes to `0`!',
          ],
        },
        {
          title: 'Dot (.) vs Arrow (->) Through Pointers',
          tag: 'ARROW OP',
          code: 'void rewardXp(Profile *p, int gain) {\n    if (!p) return;\n    p->xp += gain;\n}\n// Value dot: p1.xp | Pointer arrow: ptr->xp',
          output: 'Mutates caller’s Profile.xp directly',
          explanation:
            '`p->xp` dereferences pointer `p` and accesses `.xp` in one clean step.',
          notes: [
            'Use `const Profile *p` for read-only helpers like `printProfile`.',
          ],
        },
        {
          title: 'Enums for Tagged States',
          tag: 'ENUMS',
          code: 'typedef enum {\n    STATE_IDLE = 0,\n    STATE_ACTIVE,\n    STATE_DONE\n} Status;\nStatus st = STATE_ACTIVE;',
          output: 'st == 1',
          explanation:
            '`enum` replaces cryptic magic numbers (`0, 1, 2`) with self-documenting constants.',
          notes: [
            'Combine `enum` + `struct` cleanly for C state machines and tagged records.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using Dot (.) on a Struct Pointer',
          buggyCode: 'void levelUp(Player *p) { p.xp += 100; } // Compile error!',
          fixedCode: 'void levelUp(Player *p) { p->xp += 100; }',
          reason:
            '`p` is a pointer (`Player *`), not a value (`Player`), so C requires the arrow operator `p->xp`.',
        },
        {
          title: 'Forgetting Semicolon After Struct Definition',
          buggyCode: 'typedef struct {\n    int x;\n} Point // Missing semicolon!',
          fixedCode: 'typedef struct {\n    int x;\n} Point;',
          reason:
            'Unlike functions, `struct` and `enum` definitions always end with `;` after the closing brace.',
        },
      ],
      proTip:
        'For self-referential structs like linked-list nodes (`Node *next;`), name the struct tag right after `struct` (`typedef struct Node { int val; struct Node *next; } Node;`), because the `typedef` alias `Node` is not in scope until the closing `;`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'struct & typedef Basics',
        subtitle: 'Group heterogeneous fields and use designated initializers',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Clean Record Types with typedef',
            explanation:
              'Group related fields under one `struct` and alias it with `typedef`. Designated initializers `.field = value` leave omitted fields safely at `0`.',
            code: ['typedef struct {', '    int x;', '    int y;', '} Vec2;', '', 'Vec2 pos = {.x = 3, .y = 7};'],
            highlightNote: 'Don’t forget the semicolon `;` right after `} Vec2;`!',
          },
          {
            type: 'token_builder',
            prompt: 'Define `Point` with `typedef` and initialize `x` to `10`.',
            codeLines: ['{{0}} struct {', '    int x;', '    int y;', '} Point;', 'Point pt = {{{1}} = 10, .y = 20};'],
            expectedTokens: ['typedef', '.x'],
            distractors: ['class', 'x', '->x'],
            explanation: '`typedef` creates type `Point`; `.x = 10` initializes the `x` field explicitly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing trailing semicolon on this struct.',
            lines: [
              'typedef struct {',
              '    int hp;',
              '    int mp;',
              '} Hero',
              'Hero h = {100, 50};',
            ],
            bugLine: 3,
            fixed: '} Hero;',
            explanation: 'C struct declarations must terminate with `;`.',
          },
          {
            type: 'predict_output',
            prompt: 'With `Vec2 v = {.x = 5};`, what value does `v.y` hold?',
            code: ['typedef struct { int x, y; } Vec2;', 'Vec2 v = {.x = 5};', 'printf("%d", v.y);'],
            options: ['Garbage memory', '0', '5'],
            answer: 1,
            explanation: 'Any fields omitted in a brace initializer auto-zero to `0`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Dot (.) vs Arrow (->)',
        subtitle: 'Mutate structs via pointers with p->field cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Accessing Struct Fields via Pointers',
            explanation:
              'Direct struct values use `.` (`user.xp`). Struct pointers (`User *u`) use `->` (`u->xp`), which automatically dereferences `u` first.',
            code: ['void heal(Hero *h, int amt) {', '    h->hp += amt;', '}', 'Hero me = {.hp = 40};', 'heal(&me, 20);'],
            output: 'me.hp == 60',
            highlightNote: '`h->hp` is cleaner shorthand for `(*h).hp`.',
          },
          {
            type: 'token_builder',
            prompt: 'Pass `Hero` by pointer and increment `xp` cleanly.',
            codeLines: ['void addXp(Hero {{0}} h, int xp) {', '    h{{1}}xp += xp;', '}'],
            expectedTokens: ['*', '->'],
            distractors: ['&', '.', '::'],
            explanation: '`Hero *h` receives an address, so `h->xp` accesses its field.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the dot-operator error on a struct pointer.',
            lines: [
              'void resetScore(Player *p) {',
              '    p.score = 0;',
              '}',
            ],
            bugLine: 1,
            fixed: '    p->score = 0;',
            explanation: '`p` is a `Player *` pointer; use `->` instead of `.`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which expression is strictly equivalent to `node->value`?',
            options: ['*node.value', '(*node).value', '&node.value', 'node::value'],
            answer: 1,
            explanation: 'Because `.` binds tighter than `*`, parentheses are needed: `(*node).value`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Structs',
        subtitle: 'Verify typedefs, arrows, and const struct pointers',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Print a `Stats` struct read-only without copying it.',
            codeLines: ['void show({{0}} Stats *s) {', '    printf("xp=%d\\n", s{{1}}xp);', '}'],
            expectedTokens: ['const', '->'],
            distractors: ['val', '.', 'static'],
            explanation: '`const Stats *s` avoids copying while preventing accidental writes.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the arrow mistakenly used on a plain struct value!',
            lines: [
              'Point pt = {2, 5};',
              'printf("%d\\n", pt->x);',
            ],
            bugLine: 1,
            fixed: 'printf("%d\\n", pt.x);',
            explanation: '`pt` is a stack value (`Point`), not a pointer (`Point *`), so use `pt.x`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why pass `const Profile *p` instead of `Profile p` to read-only C functions?',
            options: [
              'C forbids passing structs by value',
              'It avoids copying large structs on the stack while blocking edits',
              'It automatically allocates on the heap',
              'Dot syntax becomes faster than arrow',
            ],
            answer: 1,
            explanation: 'Passing an 8-byte pointer saves copying big structs.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Enums & Linked Nodes',
        subtitle: 'Model clean states with enum and self-referential structs',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Typedef Enums & Node Links',
            explanation:
              'Enums name integer constants cleanly (`typedef enum { ... } Mode;`). Linked structs name a tag after `struct` so `struct Node *next;` compiles inside itself.',
            code: ['typedef struct Node {', '    int val;', '    struct Node *next;', '} Node;'],
            highlightNote: 'Inside `{ ... }`, the short alias `Node` is not defined yet—write `struct Node *`.',
          },
          {
            type: 'token_builder',
            prompt: 'Wire a self-referential linked-list `Node` cleanly.',
            codeLines: ['typedef struct {{0}} {', '    int data;', '    {{1}} Node *next;', '} Node;'],
            expectedTokens: ['Node', 'struct'],
            distractors: ['Self', 'typedef', '*'],
            explanation: 'Inside the body, refer back to `struct Node *next;` before `} Node;`.',
          },
          {
            type: 'predict_output',
            prompt: 'What integer value does `MEDIUM` hold in `enum { LOW = 1, MEDIUM, HIGH };`?',
            code: ['enum { LOW = 1, MEDIUM, HIGH };', 'printf("%d", MEDIUM);'],
            options: ['0', '2', '1'],
            answer: 1,
            explanation: 'Enums auto-increment by 1 from the previous constant (`LOW = 1 -> MEDIUM = 2`).',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid forward reference inside a typedef struct.',
            lines: [
              'typedef struct Node {',
              '    int data;',
              '    Node *next;',
              '} Node;',
            ],
            bugLine: 2,
            fixed: '    struct Node *next;',
            explanation: 'The `Node` typedef doesn’t exist until line 4; write `struct Node *next;`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: C Struct Architect',
        subtitle: 'Combine typedef structs, designated init, enums, and pointers',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Update `Task *t` status safely via pointer and zero-init `done`.',
            codeLines: [
              'typedef struct { int id; bool done; } Task;',
              'void finish(Task *t) { if (t) t{{0}}done = true; }',
              'Task t1 = {{{1}} = 7}; // done becomes false',
            ],
            expectedTokens: ['->', '.id'],
            distractors: ['.', 'id', '::'],
            explanation: '`t->done` mutates via pointer while `{.id = 7}` auto-zeros `.done`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the bug when passing a struct to a pointer parameter.',
            lines: [
              'void bump(Counter *c) { c->n++; }',
              'Counter c = {.n = 1};',
              'bump(c);',
            ],
            bugLine: 2,
            fixed: 'bump(&c);',
            explanation: '`bump` expects `Counter *`, so pass the address `&c`.',
          },
          {
            type: 'multiple_choice',
            question: 'Given `Point p = {3, 4};` and `Point *ptr = &p;`, which pair BOTH print `3`?',
            options: [
              'p->x and *ptr.x',
              'p.x and ptr->x',
              'p.x and ptr.x',
              '&p.x and ptr->x',
            ],
            answer: 1,
            explanation: 'Value `p` uses `.`, and pointer `ptr` uses `->`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 6: Dynamic Memory & Discipline (5 nodes)
  // =========================================================================
  {
    title: 'Dynamic Memory & Discipline',
    subtitle: 'Allocate on the heap with malloc/calloc, resize with realloc, and eliminate leaks.',
    conceptGraphicType: 'c_memory',
    guidebook: {
      summary:
        'Stack variables vanish when a function returns, and stack arrays must know their sizes early. When data size changes at runtime or needs to outlive a function, C allocates **heap memory** via `<stdlib.h>`’s `malloc`/`calloc`, resizes with `realloc`, and returns it manually with `free`.',
      mentalModel:
        'Every `malloc` is a loan from the OS allocator. For every `malloc`/`calloc`, there must be **one exact matching `free(ptr);`**—zero times leaks memory, two times corrupts the heap (double free)!',
      keyTakeaways: [
        'Always check `if (p == NULL)` right after `malloc`/`calloc` in case allocation fails.',
        'Compute allocation bytes cleanly using `malloc(n * sizeof(*p))` so element types never drift.',
        '`calloc(n, sizeof(int))` allocates AND zero-initializes every byte (`malloc` leaves raw garbage bytes!).',
        'Set pointers to `NULL` immediately after `free(p); p = NULL;` so accidental reuse never causes Use-After-Free or Double-Free.',
      ],
      keySyntax: [
        {
          title: 'Allocate, Check NULL, and Free',
          tag: 'MALLOC / FREE',
          code: '#include <stdlib.h>\nint *arr = malloc(5 * sizeof(*arr));\nif (arr == NULL) return 1;\narr[0] = 42;\nfree(arr);\narr = NULL;',
          output: 'Clean 5-int heap array, freed with zero leaks',
          explanation:
            '`sizeof(*arr)` stays right even if `arr` changes from `int*` to `double*`. Nulling `arr = NULL` after `free` eliminates dangling pointers.',
          notes: [
            'In C, do NOT cast `malloc`’s `void *` return (`(int*)malloc(...)` can hide a missing `<stdlib.h>` include!).',
          ],
        },
        {
          title: 'Zero-Initialized Heap Buffers (calloc)',
          tag: 'CALLOC',
          code: 'int *counts = calloc(10, sizeof(*counts));\nif (!counts) return 1;\n// Guaranteed all zeros: counts[0..9] == 0\nfree(counts);',
          output: '10 zeroed integers safely allocated & freed',
          explanation:
            '`calloc(count, elemSize)` handles integer overflow multiplication internally and zeroes all allocated memory.',
          notes: [
            'Prefer `calloc` over `malloc` + manual loop when starting counters or flags.',
          ],
        },
        {
          title: 'Safe realloc Pattern (Temporary Pointer)',
          tag: 'REALLOC',
          code: 'int *tmp = realloc(arr, newCap * sizeof(*arr));\nif (tmp == NULL) {\n    free(arr); // Original arr still valid to clean up!\n    return 1;\n}\narr = tmp;',
          output: 'Grows buffer without leaking on OOM failure',
          explanation:
            'Never assign `arr = realloc(arr, ...)` directly! If `realloc` fails and returns `NULL`, overwriting `arr` leaks the old pointer permanently.',
          notes: [
            'Calling `free(NULL)` is guaranteed safe (no-op) by the C standard.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Use-After-Free or Double-Free',
          buggyCode: 'free(buf);\nprintf("%d\\n", buf[0]); // Use-After-Free UB!\nfree(buf); // Double-Free crash!',
          fixedCode: 'free(buf);\nbuf = NULL;',
          reason:
            'Once `free(buf)` returns memory to the allocator, touching or re-freeing `buf` corrupts heap metadata.',
        },
        {
          title: 'Allocating n Bytes Instead of n * sizeof(int)',
          buggyCode: 'int *nums = malloc(10); // Only 2.5 ints (10 bytes)!',
          fixedCode: 'int *nums = malloc(10 * sizeof(*nums)); // 40 bytes!',
          reason:
            '`malloc` counts **bytes**, not array elements—always multiply by `sizeof(*ptr)`.',
        },
      ],
      proTip:
        'Test every non-trivial C binary with AddressSanitizer (`gcc -fsanitize=address,undefined -g main.c`)! ASan catches memory leaks, out-of-bounds writes, and use-after-free bugs on the exact line they occur.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'malloc & free Essentials',
        subtitle: 'Allocate heap bytes from <stdlib.h> and prevent leaks',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Dynamic Lifetime on the Heap',
            explanation:
              'Include `<stdlib.h>` for `malloc(bytes)` and `free(ptr)`. Multiply element count by `sizeof(*ptr)`, verify `!= NULL`, and `free` once finished.',
            code: ['#include <stdlib.h>', 'int *buf = malloc(4 * sizeof(*buf));', 'if (buf != NULL) {', '    buf[0] = 99;', '    free(buf);', '    buf = NULL;', '}'],
            highlightNote: '`buf = NULL;` turns accidental double-free into a harmless `free(NULL)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Allocate 8 `double`s safely on the heap and clean up.',
            codeLines: ['double *xs = {{0}}(8 * sizeof(*xs));', 'if (xs == NULL) return 1;', 'xs[0] = 3.5;', '{{1}}(xs);'],
            expectedTokens: ['malloc', 'free'],
            distractors: ['new', 'alloc', 'delete'],
            syntaxHint: 'Allocation in `<stdlib.h>` uses `malloc` and `free`.',
            explanation: '`malloc` reserves `8 * sizeof(double)` bytes; `free` releases them.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the severe byte-count undersize bug!',
            lines: [
              'int n = 10;',
              'int *scores = malloc(n);',
              'scores[9] = 100;',
            ],
            bugLine: 1,
            fixed: 'int *scores = malloc(n * sizeof(*scores));',
            explanation: '`malloc(10)` gives only 10 bytes—10 `int`s require `10 * sizeof(int)` (40 bytes)!',
          },
          {
            type: 'multiple_choice',
            question: 'Which standard C header declares `malloc`, `calloc`, `realloc`, and `free`?',
            options: ['<stdio.h>', '<stdlib.h>', '<string.h>', '<memory.h>'],
            answer: 1,
            explanation: 'All standard C heap allocators live inside `<stdlib.h>`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'calloc vs malloc',
        subtitle: 'Allocate zero-filled heap arrays cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Why calloc Prevents Uninitialized Heap Bugs',
            explanation:
              '`malloc` returns uninitialized bytes. `calloc(count, elemSize)` allocates AND zeroes every single byte, avoiding stale heap data.',
            code: ['int *hist = calloc(26, sizeof(*hist));', 'if (!hist) return 1;', 'hist[0]++; // Guaranteed 0 -> 1', 'free(hist);'],
            highlightNote: 'Notice `calloc` takes TWO arguments: count and element size.',
          },
          {
            type: 'token_builder',
            prompt: 'Allocate 16 zeroed `int` counters on the heap.',
            codeLines: ['int *bins = {{0}}(16, {{1}}(*bins));', 'if (bins == NULL) return 1;'],
            expectedTokens: ['calloc', 'sizeof'],
            distractors: ['malloc', 'len', 'zero'],
            explanation: '`calloc(16, sizeof(*bins))` zero-initializes all 16 integers cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the uninitialized heap read bug.',
            lines: [
              'int *totals = malloc(5 * sizeof(*totals));',
              'totals[0] += 1;',
            ],
            bugLine: 0,
            fixed: 'int *totals = calloc(5, sizeof(*totals));',
            explanation: '`malloc` memory holds stale garbage, so `totals[0] += 1` is undefined unless zeroed with `calloc`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `int *a = calloc(3, sizeof(int)); printf("%d", a[2]); free(a);` print?',
            code: ['int *a = calloc(3, sizeof(int));', 'printf("%d", a[2]);', 'free(a);'],
            options: ['Garbage', '0', 'NULL'],
            answer: 1,
            explanation: '`calloc` zeroes every byte of the allocation before returning.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Heap Lifetimes',
        subtitle: 'Eliminate leaks, dangling pointers, and double-frees',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Free `msg` and neutralize any dangling pointer afterward.',
            codeLines: ['char *msg = malloc(32);', 'if (!msg) return 1;', 'free(msg);', 'msg = {{0}};'],
            expectedTokens: ['NULL'],
            distractors: ['0', 'free', 'void'],
            explanation: 'Resetting `msg = NULL;` makes an accidental second `free(msg)` harmless.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the Use-After-Free bug!',
            lines: [
              'int *p = malloc(sizeof(int));',
              '*p = 77;',
              'free(p);',
              'printf("%d\\n", *p);',
            ],
            bugLine: 3,
            fixed: 'printf("%d\\n", *p);\nfree(p);\np = NULL;',
            explanation: 'Print `*p` BEFORE `free(p)`—reading freed memory is Use-After-Free UB.',
          },
          {
            type: 'multiple_choice',
            question: 'What happens when you call `free(NULL)` in standard C?',
            options: [
              'Segmentation fault',
              'Guaranteed safe no-op',
              'Deletes stack memory',
              'Returns -1',
            ],
            answer: 1,
            explanation: 'C guarantees `free(NULL)` does nothing, making cleanup guards clean.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Safe realloc & Cleanup',
        subtitle: 'Grow dynamic arrays without leaking on OOM',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Growing Heap Buffers Safely',
            explanation:
              'Never overwrite your only pointer directly (`p = realloc(p, ...)` leaks old memory if `realloc` returns `NULL`). Capture into `tmp` first!',
            code: ['int *tmp = realloc(arr, 20 * sizeof(*arr));', 'if (tmp == NULL) {', '    free(arr);', '    return 1;', '}', 'arr = tmp;'],
            highlightNote: '`realloc` preserves existing bytes up to the smaller of old/new size.',
          },
          {
            type: 'token_builder',
            prompt: 'Grow `buf` using a temporary pointer `next` so `buf` never leaks.',
            codeLines: ['int *next = {{0}}(buf, newCap * sizeof(*buf));', 'if (next == NULL) { {{1}}(buf); return 1; }', 'buf = next;'],
            expectedTokens: ['realloc', 'free'],
            distractors: ['malloc', 'delete', 'calloc'],
            explanation: 'Using `next` keeps `buf` reachable to `free(buf)` if `realloc` returns `NULL`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the classic `realloc` OOM leak!',
            lines: [
              'buf = realloc(buf, newCap * sizeof(*buf));',
              'if (buf == NULL) return 1;',
            ],
            bugLine: 0,
            fixed: 'int *tmp = realloc(buf, newCap * sizeof(*buf));',
            explanation: 'If `realloc` fails and overwrites `buf` with `NULL`, the old block can never be freed!',
          },
          {
            type: 'multiple_choice',
            question: 'Why avoid freeing `arr` on line 1 when `realloc` succeeds?',
            options: [
              'You must still free the old arr manually',
              'realloc automatically copies and frees the old block if it moves',
              'realloc only shrinks arrays',
              'realloc returns a stack array',
            ],
            answer: 1,
            explanation: 'A successful `realloc` handles releasing the old pointer internally if relocated.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: C Systems Pro',
        subtitle: 'Conquer structs, heap buffers, safe realloc, and zero leaks',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Allocate a zeroed `Packet` struct on the heap, set `len`, then release it.',
            codeLines: [
              'Packet *pkt = {{0}}(1, sizeof(*pkt));',
              'if (!pkt) return 1;',
              'pkt{{1}}len = 64;',
              'free(pkt); pkt = NULL;',
            ],
            expectedTokens: ['calloc', '->'],
            distractors: ['malloc', '.', '::'],
            explanation: '`calloc` zeroes all fields cleanly and `pkt->len` writes through the pointer.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the subtle memory leak before early return!',
            lines: [
              'char *buf = malloc(128);',
              'if (!buf) return 1;',
              'if (errorFlag) return 1;',
              'free(buf);',
            ],
            bugLine: 2,
            fixed: 'if (errorFlag) { free(buf); return 1; }',
            explanation: 'Early return on line 3 skips `free(buf)` and leaks 128 bytes.',
          },
          {
            type: 'multiple_choice',
            question: 'What is a **double free** bug in C?',
            options: [
              'Freeing two different pointers on one line',
              'Calling free(p) twice on the same non-NULL heap pointer',
              'Using calloc instead of malloc',
              'Calling free(NULL)',
            ],
            answer: 1,
            explanation: 'Double-freeing the same address corrupts allocator bookkeeping; set `p = NULL` after `free(p)`!',
          },
        ],
      },
    ],
  },
];
