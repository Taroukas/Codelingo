import type { UnitSeed } from './types';

export const CPP_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: First Steps in C++ (6 nodes)
  // =========================================================================
  {
    title: 'First Steps in C++',
    subtitle: 'Print messages, create labeled variables, and do simple math.',
    conceptGraphicType: 'cpp_stack',
    guidebook: {
      summary:
        'C++ is statically typed and compiled to native machine code before execution. You declare a variable’s exact type once (`int`, `double`, `std::string`, `bool`), end statements with `;`, and stream output via `std::cout <<`.',
      mentalModel:
        'Unlike Python variables, a C++ variable is a fixed typed box in memory. `int hp = 100;` reserves 4 bytes for integers; you can update `hp` with another `int`, never swap it to text.',
      keyTakeaways: [
        'Every executable statement in C++ must terminate with a semicolon `;`.',
        'Include `<iostream>` for `std::cout` and `<string>` when working with `std::string`.',
        'Stream operator `<<` flows right-to-left INTO `std::cout`; chain multiple pieces with `<<`.',
        'Watch integer division: `5 / 2` evaluates to `2` in C++ unless at least one operand is a `double` (`5.0 / 2`).',
      ],
      keySyntax: [
        {
          title: 'Streaming Multiple Values with cout',
          tag: 'IOSTREAM',
          code: '#include <iostream>\nint xp = 120;\nstd::cout << "XP: " << xp << "\\n";',
          output: 'XP: 120',
          explanation:
            'Chain text literals and variables onto `std::cout` with `<<`. Prefer `"\\n"` over `std::endl` for fast un-flushed newlines.',
          notes: [
            '`std::cout` does NOT automatically insert spaces or newlines between `<<` chunks.',
          ],
        },
        {
          title: 'Typed Variables, Constants & auto',
          tag: 'TYPES',
          code: 'const int maxHp = 100;\nint hp = maxHp - 25;\nstd::string hero = "Kai";\nstd::cout << hero << ": " << hp;',
          output: 'Kai: 75',
          explanation:
            'Prefix read-only values with `const` so the compiler blocks accidental modification at compile time.',
          notes: [
            'Use `double` for decimals (`3.14`), `char` with single quotes (`\'A\'`), and `std::string` with double quotes (`"Kai"`).',
          ],
        },
        {
          title: 'Integer vs Floating-Point Division',
          tag: 'ARITHMETIC',
          code: 'int intDiv = 7 / 2;\ndouble fpDiv = 7.0 / 2;\nstd::cout << intDiv << " vs " << fpDiv;',
          output: '3 vs 3.5',
          explanation:
            'Dividing two `int` values drops any fractional decimal part cleanly toward zero; use `7.0` or `static_cast<double>(a)` for decimals.',
          notes: [
            'Overflowing a signed `int` triggers undefined behavior — pick `long long` for billions.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Missing Semicolon or Using >> on cout',
          buggyCode: 'std::cout >> "Hi"\nint x = 10;',
          fixedCode: 'std::cout << "Hi\\n";\nint x = 10;',
          reason:
            '`std::cout` uses insertion `<<` (think arrows pushing bytes into `cout`) and every statement needs a trailing `;`.',
        },
        {
          title: 'Single Quotes for Multi-Char Text',
          buggyCode: 'std::string tag = \'CPP\';',
          fixedCode: 'std::string tag = "CPP";',
          reason:
            'Single quotes `\'A\'` denote a single `char` integer code, whereas strings always require double quotes `"..."`.',
        },
      ],
      proTip:
        'Compile with `-Wall -Wextra` warnings enabled — the C++ compiler catches narrowing conversions, unused variables, and uninitialized reads before your app even runs.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Saying Hello',
        subtitle: 'Show messages on screen using std::cout and ;',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Your First C++ Output',
            explanation:
              'C++ uses `std::cout <<` to send text to the screen. Put words inside double quotes `" "` and end every line with a semicolon `;`.',
            code: ['std::cout << "Hello, World!";'],
            output: 'Hello, World!',
            highlightNote: 'Notice the arrows `<<` point left toward `std::cout` (the screen).',
          },
          {
            type: 'token_builder',
            prompt: 'Send `"Hello C++"` to standard output with `<<`.',
            codeLines: ['std::cout {{0}} "Hello C++";'],
            expectedTokens: ['<<'],
            distractors: ['>>', '=', '->'],
            explanation: '`std::cout << ...` sends text toward the screen.',
            syntaxHint: 'Think of `<<` as pushing words out into `cout`.',
            output: 'Hello C++',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the C++ output line and remember the ending semicolon.',
            codeLines: ['{{0}}::cout << "Ready!"{{1}}'],
            expectedTokens: ['std', ';'],
            distractors: ['print', ':', 'log'],
            explanation: '`std::cout` prints `"Ready!"`, and `;` tells C++ the instruction is done.',
            syntaxHint: 'Every C++ instruction ends with `;`.',
            output: 'Ready!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that is missing its ending semicolon.',
            lines: [
              'std::cout << "Starting...";',
              'std::cout << "Hello"',
              'std::cout << "Done!";',
            ],
            bugLine: 1,
            fixed: 'std::cout << "Hello";',
            explanation: 'C++ requires `;` at the end of every statement.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this C++ line display?',
            code: ['std::cout << "CodeLingo";'],
            options: ['CodeLingo', '"CodeLingo"', 'cout'],
            answer: 0,
            explanation: '`std::cout` prints the characters inside the quotes without the quote marks.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Creating Variables',
        subtitle: 'Store numbers and text inside labeled boxes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Labeled Boxes with Types',
            explanation:
              'In C++, you label each box with what it holds: `int` for whole numbers (like `10`) and `std::string` for words (like `"Tarek"`).',
            code: ['std::string name = "Tarek";', 'int score = 10;', 'std::cout << name;'],
            output: 'Tarek',
            highlightNote: 'Only specify `int` or `std::string` the first time you create the variable.',
          },
          {
            type: 'token_builder',
            prompt: 'Create a whole-number variable `score` set to `25`.',
            codeLines: ['{{0}} score = 25;'],
            expectedTokens: ['int'],
            distractors: ['var', 'let', 'string'],
            explanation: 'Use `int` when storing whole numbers like `25`.',
            syntaxHint: '`int` is short for integer (a whole number).',
          },
          {
            type: 'token_builder',
            prompt: 'Save `"Ada"` inside a text variable `name`, then print it.',
            codeLines: ['{{0}}::string name = "Ada";', 'std::cout << {{1}};'],
            expectedTokens: ['std', 'name'],
            distractors: ['int', '"name"', 'str'],
            explanation: '`std::string` holds words, and passing `name` without quotes prints `Ada`.',
            syntaxHint: 'No quotes around `name` when printing what is inside the box!',
            output: 'Ada',
          },
          {
            type: 'token_builder',
            prompt: 'Store `12` in `level` and display it on screen.',
            codeLines: ['int level {{0}} 12;', 'std::cout << level{{1}}'],
            expectedTokens: ['=', ';'],
            distractors: ['==', ':', '<<'],
            explanation: 'Use `=` to assign `12` and `;` to end the output line.',
            syntaxHint: 'Check assignment `=` and trailing `;`.',
            output: '12',
          },
          {
            type: 'predict_output',
            prompt: 'What appears on screen?',
            code: ['int points = 50;', 'std::cout << points;'],
            options: ['50', 'points', 'int'],
            answer: 0,
            explanation: '`std::cout << points;` displays the number stored inside `points`, which is `50`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Updating & Using Variables',
        subtitle: 'Change stored numbers and read variable values cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Updating an Existing Box',
            explanation:
              'After creating a variable with `int`, update it anytime without writing `int` again. And remember: `<< score` shows the value (`15`), while `<< "score"` prints the word `score`.',
            code: ['int score = 10;', 'score = score + 5;', 'std::cout << score;'],
            output: '15',
            highlightNote: 'Do not write `int` a second time when updating the same variable.',
          },
          {
            type: 'token_builder',
            prompt: 'Add `5` to `score` and store the new total back in `score`.',
            codeLines: ['int score = 10;', 'score = {{0}} {{1}} 5;'],
            expectedTokens: ['score', '+'],
            distractors: ['int', '==', '10'],
            explanation: 'C++ computes `score + 5` (`15`) and updates the value in `score`.',
            syntaxHint: 'Update using `score` plus `5` (no `int` keyword needed).',
          },
          {
            type: 'token_builder',
            prompt: 'Change `coins` to `30` and print its new value.',
            codeLines: ['int coins = 10;', '{{0}} = 30;', 'std::cout << {{1}};'],
            expectedTokens: ['coins', 'coins'],
            distractors: ['int', '"coins"', 'coin'],
            explanation: '`coins = 30;` updates the box, and `std::cout << coins;` prints `30`.',
            syntaxHint: 'Leave quotes off `coins` so C++ prints `30`.',
            output: '30',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that prints the literal word "coins" instead of 40.',
            lines: [
              'int coins = 40;',
              'std::cout << "coins";',
            ],
            bugLine: 1,
            fixed: 'std::cout << coins;',
            explanation: 'Quotes around `"coins"` print the word literally instead of the variable value.',
          },
          {
            type: 'predict_output',
            prompt: 'What number does this print?',
            code: ['int gems = 10;', 'gems = gems + 5;', 'std::cout << gems;'],
            options: ['15', '10', '10 + 5'],
            answer: 0,
            explanation: '`gems` starts at `10`, gets `5` added (`15`), and prints `15`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint: Output & Variables',
        subtitle: '3-step recap challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Create `xp = 20`, add `5`, and send it to `std::cout`.',
            codeLines: ['{{0}} xp = 20;', 'xp = xp + 5;', 'std::cout {{1}} xp;'],
            expectedTokens: ['int', '<<'],
            distractors: ['let', '>>', 'str'],
            explanation: 'Whole numbers start with `int`, and output uses `<<`.',
            syntaxHint: 'Verify `int` for numbers and `<<` pointing left toward `std::cout`.',
            output: '25',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line pointing stream arrows the wrong direction.',
            lines: [
              'int level = 1;',
              'std::cout >> level;',
            ],
            bugLine: 1,
            fixed: 'std::cout << level;',
            explanation: '`std::cout` always uses `<<` pointing toward `cout`.',
          },
          {
            type: 'predict_output',
            prompt: 'What prints after adding 3?',
            code: ['int x = 4;', 'x = x + 3;', 'std::cout << x;'],
            options: ['7', '4', '43'],
            answer: 0,
            explanation: '`x` becomes `4 + 3`, printing `7`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Numbers vs. Text',
        subtitle: 'Understand whole numbers, decimals, and text strings',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Numbers vs. Text Strings',
            explanation:
              'In C++, `int` stores whole numbers (`42`), `double` stores decimals (`3.5`), and `std::string` stores quoted words (`"42"`). Chaining `<<` lets you print text and numbers together cleanly.',
            code: ['double pi = 3.14;', 'std::string a = "4", b = "2";', 'std::cout << "Sum=" << (4 + 2);'],
            output: 'Sum=6',
            highlightNote: 'Joining two `std::string`s `"4" + "2"` gives `"42"`, not `6`!',
          },
          {
            type: 'token_builder',
            prompt: 'Choose `double` for a decimal price and `std::string` for a word.',
            codeLines: ['{{0}} price = 9.99;', 'std::{{1}} item = "Pass";'],
            expectedTokens: ['double', 'string'],
            distractors: ['int', 'text', 'let'],
            explanation: '`double` holds decimal values like `9.99`, and `std::string` holds text.',
            syntaxHint: '`int` drops decimals — use `double` for decimal numbers.',
          },
          {
            type: 'token_builder',
            prompt: 'Chain `"Rank: "` and variable `rank` into `std::cout`.',
            codeLines: ['int rank = 1;', 'std::cout {{0}} "Rank: " {{1}} rank;'],
            expectedTokens: ['<<', '<<'],
            distractors: ['>>', ',', '+'],
            explanation: 'In C++, chain another `<<` to print multiple values in one statement.',
            syntaxHint: 'Each item sent to `std::cout` uses its own `<<`.',
            output: 'Rank: 1',
          },
          {
            type: 'token_builder',
            prompt: 'Join two text strings `"Code"` and `"Lingo"` with `+`.',
            codeLines: ['std::string a = "Code", b = "Lingo";', 'std::cout << (a {{0}} b){{1}}'],
            expectedTokens: ['+', ';'],
            distractors: ['<<', ',', ':'],
            explanation: '`+` glues two `std::string`s together into `"CodeLingo"`.',
            syntaxHint: 'Use `+` between strings and finish with `;`.',
            output: 'CodeLingo',
          },
          {
            type: 'predict_output',
            prompt: 'What happens when joining two text strings `"1"` and `"0"`?',
            code: ['std::string a = "1", b = "0";', 'std::cout << a + b;'],
            options: ['10', '1', '2'],
            answer: 0,
            explanation: 'Because `"1"` and `"0"` are text (`std::string`), `+` puts them side by side -> `10`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss Challenge',
        subtitle: 'Combine printing, variables, updates, and numbers & text',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Unit 1 Recap',
            explanation:
              'Awesome start! You know how to print with `std::cout <<`, store `int`, `double`, and `std::string` values, update variables with math, and finish lines with `;`.',
            code: ['int xp = 20;', 'xp = xp + 10;', 'std::cout << "XP: " << xp;'],
            output: 'XP: 30',
          },
          {
            type: 'token_builder',
            prompt: 'Create `hp = 50`, add `25`, and print the final number.',
            codeLines: ['{{0}} hp = 50;', 'hp = hp {{1}} 25;', 'std::cout << hp{{2}}'],
            expectedTokens: ['int', '+', ';'],
            distractors: ['var', '==', ':'],
            explanation: 'Declare `int hp = 50;`, add `25`, and print `hp;` (`75`).',
            syntaxHint: 'Whole numbers use `int` and every statement ends with `;`.',
            output: '75',
          },
          {
            type: 'token_builder',
            prompt: 'Print text label `"Score: "` followed by variable `score`.',
            codeLines: ['int score = 90;', 'std::cout {{0}} "Score: " {{1}} score;'],
            expectedTokens: ['<<', '<<'],
            distractors: [',', '>>', 'and'],
            explanation: 'Chain `<<` operators to output text and variables on the same line.',
            syntaxHint: 'Put `<<` before every item printed by `std::cout`.',
            output: 'Score: 90',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line trying to print the literal word "xp" instead of its value.',
            lines: [
              'int xp = 100;',
              'xp = xp + 50;',
              'std::cout << "xp";',
            ],
            bugLine: 2,
            fixed: 'std::cout << xp;',
            explanation: 'Remove quotes around `xp` so C++ prints `150` instead of `"xp"`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this final Unit 1 snippet output?',
            code: ['int coins = 5;', 'coins = coins + 10;', 'std::cout << "Coins: " << coins;'],
            options: ['Coins: 15', 'Coins: 5', 'Coins: coins'],
            answer: 0,
            explanation: '`coins` updates to `15`, and `std::cout` prints `Coins: 15`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Control Flow & Fast Loops (5 nodes)
  // =========================================================================
  {
    title: 'Control Flow & Fast Loops',
    subtitle: 'Branch cleanly with `switch`/`if` and iterate with zero-overhead loops.',
    conceptGraphicType: 'cpp_loops',
    guidebook: {
      summary:
        'Control flow in C++ wraps conditions in parentheses `if (...)` and scopes blocks with curly braces `{ ... }`. Combining short-circuit operators (`&&`, `||`) with range-based `for` loops gives you expressive logic with zero runtime overhead.',
      mentalModel:
        '`&&` and `||` short-circuit left-to-right: if the left operand settles the outcome, the right expression never executes — making pointer/index guards like `i < n && arr[i] > 0` completely safe.',
      keyTakeaways: [
        'Always enclose conditions in parentheses `(...)`; use `else if` (two words), never `elif`.',
        'Prefer pre-increment `++i` in `for` loops and zero-indexed `< n` bounds.',
        'Prefer range-based `for (const auto& x : items)` when you do not need element indices.',
        'Include `break;` at the bottom of every `switch` branch to avoid silent fallthrough.',
      ],
      keySyntax: [
        {
          title: 'if / else if & Logical Short-Circuit',
          tag: 'BRANCHING',
          code: 'int hp = 40;\nbool shielded = true;\nif (hp <= 0) {\n  std::cout << "KO";\n} else if (hp < 50 && shielded) {\n  std::cout << "Guarded";\n}',
          output: 'Guarded',
          explanation:
            'Boolean expressions combine cleanly using `&&` (AND), `||` (OR), and `!` (NOT).',
          notes: [
            'Curly braces `{}` are optional for 1-line bodies, but always keeping `{}` prevents subtle indentation bugs.',
          ],
        },
        {
          title: 'Classic Indexed vs Range-Based for',
          tag: 'LOOPS',
          code: 'int nums[] = {3, 6, 9};\nint sum = 0;\nfor (int x : nums) { sum += x; }\nstd::cout << sum;',
          output: '18',
          explanation:
            'Range-based `for` iterates every element directly without risking an off-by-one `<=` index crash.',
          notes: [
            'Classic loop `for (int i = 0; i < 3; ++i)` gives explicit index access when needed.',
          ],
        },
        {
          title: 'Clean switch Dispatch',
          tag: 'SWITCH',
          code: 'int code = 200;\nswitch (code) {\n  case 200: std::cout << "OK"; break;\n  case 404: std::cout << "Missing"; break;\n  default:  std::cout << "Err";\n}',
          output: 'OK',
          explanation:
            '`switch` handles integer or enum jump tables cleanly when matching discrete constants.',
          notes: [
            'Without `break;`, execution falls right into `case 404:`!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Single = Inside if Condition',
          buggyCode: 'int hp = 0;\nif (hp = 10) { std::cout << "Alive"; }',
          fixedCode: 'int hp = 0;\nif (hp == 10) { std::cout << "Alive"; }',
          reason:
            '`hp = 10` assigns `10` (non-zero = truthy!) and runs the branch unintentionally. Use `==`.',
        },
        {
          title: 'Forgetting break in a switch Case',
          buggyCode: 'case 1: std::cout << "One ";\ncase 2: std::cout << "Two"; break;',
          fixedCode: 'case 1: std::cout << "One"; break;\ncase 2: std::cout << "Two"; break;',
          reason:
            'In C++, `switch` cases fall through by default unless terminated by `break;` or `return;`.',
        },
      ],
      proTip:
        'Put literals on the right with compiler flags (`-Wparentheses`) OR use modern `if (int len = v.size(); len > 0)` C++17 init-statements to keep loop variables tightly scoped.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Conditionals & Logic',
        subtitle: 'Combine C++ boolean gates &&, ||, ! safely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boolean Gates & Parentheses',
            explanation:
              'All C++ `if` and `while` conditions require parentheses `(...)`. Combine checks using `&&` (AND), `||` (OR), and `!` (NOT) — C++ evaluates lazily left-to-right.',
            code: ['if (hp > 0 && !paused) {', '    tick();', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Combine two guard checks with logical AND.',
            codeLines: ['if (lives > 0 {{0}} gems >= 100) {', '    unlock();', '}'],
            expectedTokens: ['&&'],
            distractors: ['and', '&', '||'],
            explanation: 'Logical short-circuit AND uses `&&`, whereas single `&` is bitwise.',
            syntaxHint: 'Prefer `&&` over bitwise `&` for boolean branching.',
          },
          {
            type: 'token_builder',
            prompt: 'Add an `else if` branch properly parenthesized.',
            codeLines: ['if (xp >= 1000) tier = 1;', '{{0}} (xp >= 500) tier = 2;', '{{1}} tier = 3;'],
            expectedTokens: ['else if', 'else'],
            distractors: ['elif', 'otherwise', 'switch'],
            explanation: 'C++ always writes `else if (...)`, never Python `elif`.',
            syntaxHint: 'Always wrap the `else if (...)` condition in parentheses.',
          },
          {
            type: 'token_builder',
            prompt: 'Write an inline ternary expression for rank tag.',
            codeLines: ['auto tag = (xp > 500) {{0}} "PRO" {{1}} "DEV";'],
            expectedTokens: ['?', ':'],
            distractors: ['if', 'else', '->'],
            explanation: 'Ternary `cond ? valA : valB` picks a matching expression cleanly.',
            syntaxHint: 'Format is strictly `cond ? a : b`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the dangerous assignment-inside-condition bug.',
            lines: [
              'int status = 0;',
              'if (status = 1) {',
              '    std::cout << "Active";',
              '}',
            ],
            bugLine: 1,
            fixed: 'if (status == 1) {',
            explanation: '`status = 1` overwrites `status` and always evaluates truthy; use `==`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'For Loops & Range-Based',
        subtitle: 'Write classic `for` counters and modern range-for loops',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Overhead Iteration',
            explanation:
              'Classic C++ loops separate init, guard, and increment with semicolons (`for (int i = 0; i < n; ++i)`). Range-for (`for (int x : items)`) reads clean value elements directly.',
            code: ['for (int i = 0; i < 4; ++i) sum += i;', 'for (int n : nums) std::cout << n;'],
          },
          {
            type: 'token_builder',
            prompt: 'Complete classic indexed `for` loop up to `5`.',
            codeLines: ['for (int i = 0{{0}} i < 5{{1}} ++i) {', '    total += i;', '}'],
            expectedTokens: [';', ';'],
            distractors: [',', ':', 'in'],
            explanation: 'C++ `for (init; cond; step)` strictly separates all three parts with `;`.',
            syntaxHint: 'Commas inside `for (...)` cause a syntax error.',
          },
          {
            type: 'token_builder',
            prompt: 'Iterate values cleanly using range-based `for`.',
            codeLines: ['int nums[] = {2, 4, 6};', 'for (int x {{0}} nums) {', '    sum {{1}} x;', '}'],
            expectedTokens: [':', '+='],
            distractors: ['in', 'of', '=+', ':='],
            explanation: 'Range-based for loops use a single colon `for (type var : collection)`.',
            syntaxHint: 'C++ uses `:` rather than `in` or `of`.',
          },
          {
            type: 'token_builder',
            prompt: 'Skip negative entries with `continue` cleanly.',
            codeLines: ['for (int v : list) {', '    if (v < 0) {{0}};', '    sum += v;', '}'],
            expectedTokens: ['continue'],
            distractors: ['break', 'skip', 'next'],
            explanation: '`continue;` jumps to the next element immediately.',
            syntaxHint: 'Do not forget the trailing semicolon after `continue`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this post-decrement `while` loop print?',
            code: ['int n = 3, res = 0;', 'while (n > 0) { res += n; --n; }', 'std::cout << res;'],
            options: ['6', '3', '10'],
            answer: 0,
            explanation: 'Adds `3 + 2 + 1 = 6` before `n` reaches `0`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Loops',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Range-loop over `scores` and accumulate evens only.',
            codeLines: [
              'for (int s {{0}} scores) {',
              '    if (s % 2 != 0) {{1}};',
              '    total += s;',
              '}',
            ],
            expectedTokens: [':', 'continue'],
            distractors: ['in', 'break', 'skip'],
            explanation: 'Range-for uses `:`, and `continue;` skips odd elements safely.',
            syntaxHint: 'Remember `:` in C++ range-based `for`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the off-by-one array bounds error.',
            lines: [
              'int a[3] = {10, 20, 30};',
              'for (int i = 0; i <= 3; ++i) {',
              '    sum += a[i];',
              '}',
            ],
            bugLine: 1,
            fixed: 'for (int i = 0; i < 3; ++i) {',
            explanation: 'Array size `3` has valid indices `0, 1, 2`; `i <= 3` triggers out-of-bounds read `a[3]`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `switch` fallthrough cause here?',
            code: ['int k = 1, r = 0;', 'switch(k) { case 1: r += 2; case 2: r += 3; break; }', 'std::cout << r;'],
            options: ['5', '2', '3'],
            answer: 0,
            explanation: 'Because `case 1` has no `break;`, execution falls straight into `case 2`: `2 + 3 = 5`!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Switch & Fallthrough',
        subtitle: 'Dispatch integral constants cleanly without `if` chains',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Guarding `switch` Cases with `break`',
            explanation:
              'Unlike Go or Rust, C++ `switch` cases fall through by default unless terminated by `break;`. Include `default:` to catch unexpected enum or integer codes.',
            code: ['switch (cmd) {', '  case 1: run(); break;', '  default: stop();', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Stop `case 1` from falling into `case 2`.',
            codeLines: ['switch (mode) {', '  case 1: x = 10; {{0}};', '  case 2: x = 20; break;', '}'],
            expectedTokens: ['break'],
            distractors: ['stop', 'return', 'end'],
            explanation: '`break;` exits the `switch` block cleanly after executing `case 1`.',
            syntaxHint: 'Missing `break` silently runs `case 2` right afterward!',
          },
          {
            type: 'token_builder',
            prompt: 'Add fallback label `default` inside `switch`.',
            codeLines: ['{{0}} (code) {', '  case 0: ok = true; break;', '  {{1}}: ok = false;', '}'],
            expectedTokens: ['switch', 'default'],
            distractors: ['match', 'else', 'otherwise'],
            explanation: 'C++ dispatches with `switch (expr)` and fallback `default:`.',
            syntaxHint: '`else` cannot be used inside a `switch` block.',
          },
          {
            type: 'token_builder',
            prompt: 'Execute at least once cleanly via `do ... while`.',
            codeLines: ['int n = 0;', '{{0}} {', '    ++n;', '} {{1}} (n < 3);'],
            expectedTokens: ['do', 'while'],
            distractors: ['repeat', 'until', 'for'],
            explanation: '`do { ... } while (cond);` always executes its body once before checking `cond`.',
            syntaxHint: 'Note the mandatory semicolon after `while (cond);` in `do-while` loops.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['int i = 0;', 'do { i += 5; } while (false);', 'std::cout << i;'],
            options: ['5', '0', 'Infinite loop'],
            answer: 0,
            explanation: '`do-while` executes the body once even when the condition is `false`, setting `i = 5`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss Challenge',
        subtitle: 'Master bounds-safe loops and explicit switch control',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Zero-Bug Control Flow',
            explanation:
              'Watch out for classic C++ control traps: `=` inside `if`, `i <= size` off-by-one reads, and missing `break;` inside `switch` cases.',
            code: ['for (int i = 0; i < N; ++i) { if (ok) break; }'],
          },
          {
            type: 'token_builder',
            prompt: 'Write a strict bounds-safe counter loop skipping index `2`.',
            codeLines: [
              'for (int i = 0; i {{0}} 5; ++i) {',
              '    if (i == 2) {{1}};',
              '}',
            ],
            expectedTokens: ['<', 'continue'],
            distractors: ['<=', 'break', 'elif'],
            explanation: 'Use strict `< 5` for 0-based arrays of length `5` and `continue;` to skip `2`.',
            syntaxHint: '`i <= 5` reads 6 iterations (`0..5`), causing out-of-bounds bugs.',
          },
          {
            type: 'token_builder',
            prompt: 'Dispatch status cleanly with `switch`, `break`, and `default`.',
            codeLines: [
              '{{0}} (tier) {',
              '  case 1: mult = 2; {{1}};',
              '  {{2}}: mult = 1;',
              '}',
            ],
            expectedTokens: ['switch', 'break', 'default'],
            distractors: ['match', 'continue', 'else'],
            explanation: 'Every `case` ends cleanly with `break;`, with `default:` as fallback.',
            syntaxHint: 'Avoid fallthrough bugs by closing every handled case with `break;`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the loop condition causing an infinite loop or wrong check.',
            lines: [
              'int x = 3;',
              'while (x > 0) {',
              '    if (x = 2) break;',
              '    --x;',
              '}',
            ],
            bugLine: 2,
            fixed: '    if (x == 2) break;',
            explanation: '`x = 2` assigns `2` (truthy!) on the first pass instead of comparing `x == 2`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['int sum = 0;', 'for (int x : {10, 20, 30}) { if (x > 10) sum += x; }', 'std::cout << sum;'],
            options: ['50', '60', '30'],
            answer: 0,
            explanation: 'Only elements strictly greater than `10` (`20 + 30`) accumulate to `50`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Functions & References (&) (5 nodes)
  // =========================================================================
  {
    title: 'Functions & References (&)',
    subtitle: 'Pass large objects with zero copies via `T&` and `const T&`.',
    conceptGraphicType: 'cpp_refs',
    guidebook: {
      summary:
        'C++ defaults to pass-by-value, meaning functions receive a full copy of every argument. Adding `&` binds a reference directly to the caller’s variable with zero memory copy — while `const T&` enforces read-only safety.',
      mentalModel:
        'A reference (`int& alias = x;`) is not a separate copy or a nullable pointer — it is a second permanent alias for the exact same memory cell. Modifying `alias` mutates `x` directly.',
      keyTakeaways: [
        'Use `T` (pass by value) for cheap primitives like `int`, `bool`, and `double`.',
        'Use `const T&` for `std::string`, `std::vector`, and structs you only need to inspect (zero copy + protected).',
        'Use non-const `T&` ONLY when the function intentionally mutates the caller’s variable in place.',
        'Declare functions before calling them (or provide a top prototype declaration).',
      ],
      keySyntax: [
        {
          title: 'In-Place Mutation via Reference (`T&`)',
          tag: 'REFERENCE',
          code: 'void applyHeal(int& hp, int amt) {\n  hp += amt;\n}\nint hp = 40;\napplyHeal(hp, 25);\nstd::cout << hp;',
          output: '65',
          explanation:
            'Because `hp` is received as `int&`, adding `amt` updates the caller’s `hp` variable directly.',
          notes: [
            'Notice callers pass `hp` normally (`applyHeal(hp, 25)`) without taking `&hp`.',
          ],
        },
        {
          title: 'Zero-Copy Read (`const T&`)',
          tag: 'PERFORMANCE',
          code: 'int countChars(const std::string& text) {\n  return static_cast<int>(text.size());\n}\nstd::cout << countChars("CodeLingo");',
          output: '9',
          explanation:
            '`const std::string&` accepts literals and large strings without allocating a heap copy, and guarantees `text` cannot be changed.',
          notes: [
            'Non-const `std::string&` refuses string literals `"hello"`; `const std::string&` accepts both variables and temporaries!',
          ],
        },
        {
          title: 'Function Overloading & Default Args',
          tag: 'SIGNATURES',
          code: 'int boost(int xp, int mult = 2) {\n  return xp * mult;\n}\nstd::cout << boost(10) << " " << boost(10, 3);',
          output: '20 30',
          explanation:
            'Trailing parameters can specify default values; C++ also supports multiple functions sharing one name with different parameter types.',
          notes: [
            'Place default values in the declaration header so callers see them cleanly.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Returning a Reference to a Local Variable',
          buggyCode: 'int& badRef() {\n  int local = 42;\n  return local;  // Dangling UB!\n}',
          fixedCode: 'int safeVal() {\n  int local = 42;\n  return local;\n}',
          reason:
            '`local` is destroyed when `badRef()` returns! Never return `T&` pointing to a stack variable that dies at function exit.',
        },
        {
          title: 'Forgetting const on Read-Only String/Vector Params',
          buggyCode: 'void log(std::string& msg); // Fails on log("hi")',
          fixedCode: 'void log(const std::string& msg);',
          reason:
            'Temporary values like `"hi"` cannot bind to a mutable `T&`. Marking it `const T&` fixes the compile error AND eliminates copies.',
        },
      ],
      proTip:
        'Follow the "C++ Core Guidelines" parameter rule: `int/double` by value, `const T&` for read-only large objects, and `T&` (or returning a new value) for outputs.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Pass by Value vs Ref (&)',
        subtitle: 'Understand copy semantics vs direct reference aliases',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Why Pass by Reference (`&`)?',
            explanation:
              'Passing `int x` copies bytes into the function parameter so mutations stay local. Writing `int& x` binds directly to the caller’s variable with zero copy cost.',
            code: ['void addOne(int& v) { v += 1; }', 'int n = 10; addOne(n);  // n is 11'],
            highlightNote: 'Unlike pointers, references cannot be null.',
          },
          {
            type: 'token_builder',
            prompt: 'Make `swapInts` mutate the caller integers in place.',
            codeLines: ['void swapInts(int{{0}} a, int{{1}} b) {', '    int tmp = a; a = b; b = tmp;', '}'],
            expectedTokens: ['&', '&'],
            distractors: ['*', '^', '%'],
            explanation: 'Adding `&` declares reference parameters bound directly to caller variables.',
            syntaxHint: 'Without `&`, swapping only swaps local copies inside `swapInts`.',
          },
          {
            type: 'token_builder',
            prompt: 'Create a local alias `ref` bound directly to `score`.',
            codeLines: ['int score = 100;', 'int{{0}} ref = score;', 'ref += 50;'],
            expectedTokens: ['&'],
            distractors: ['*', '@', '->'],
            explanation: 'After `int& ref = score;`, mutating `ref` sets `score` to `150`.',
            syntaxHint: 'Place `&` on the type declarator (`int& ref = score`), not `&score`.',
          },
          {
            type: 'token_builder',
            prompt: 'Return `void` and accept a reference `streak` to reset.',
            codeLines: ['{{0}} resetStreak(int{{1}} streak) {', '    streak = 0;', '}'],
            expectedTokens: ['void', '&'],
            distractors: ['int', '*', 'null'],
            explanation: 'Functions with no return value specify `void` and mutate via `int&`.',
            syntaxHint: 'Non-returning helpers must declare return type `void`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is `xp` after calling pass-by-value `bump(xp)`?',
            code: ['void bump(int n) { n += 50; }', 'int xp = 10;', 'bump(xp);', 'std::cout << xp;'],
            options: ['10', '60', 'Compile error'],
            answer: 0,
            explanation: '`n` received a copy of `xp`, leaving caller `xp` unchanged at `10`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'const References & Safety',
        subtitle: 'Read large objects in O(1) without accidental mutations',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Copy Read Safety (`const T&`)',
            explanation:
              'Passing a 10MB string by value copies 10MB on every call. Declaring `const std::string& s` avoids any heap copy while banning mutations inside the callee.',
            code: ['void logTag(const std::string& s) {', '    std::cout << s;', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Pass `title` read-only with zero heap allocation copy.',
            codeLines: ['int lenOf({{0}} std::string{{1}} title) {', '    return title.size();', '}'],
            expectedTokens: ['const', '&'],
            distractors: ['*', 'var', 'let'],
            explanation: '`const std::string&` guarantees fast zero-copy read access.',
            syntaxHint: 'Prefix with `const` and suffix the type with `&`.',
          },
          {
            type: 'token_builder',
            prompt: 'Return calculated XP explicitly from the read-only reference.',
            codeLines: ['int bonus(const int& base) {', '    {{0}} base * 2;', '}'],
            expectedTokens: ['return'],
            distractors: ['yield', 'cout', 'void'],
            explanation: 'Read the `const int&` value cleanly and `return base * 2;`.',
            syntaxHint: 'Non-`void` functions must return a matching typed value.',
          },
          {
            type: 'token_builder',
            prompt: 'Overload default argument cleanly in C++ signature.',
            codeLines: ['int award(int base, int mult {{0}} 2) {', '    {{1}} base * mult;', '}'],
            expectedTokens: ['=', 'return'],
            distractors: [':', ':=', 'void'],
            explanation: 'C++ sets default parameter values with `= 2` in the signature.',
            syntaxHint: 'Trailing defaults work in C++ just like Python (`int mult = 2`).',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `tag` cannot be mutated inside this helper.',
            lines: [
              'void exclaim(const std::string& tag) {',
              '    tag += "!";',
              '    std::cout << tag;',
              '}',
            ],
            bugLine: 1,
            fixed: 'std::cout << tag << "!";',
            explanation: '`tag` is a `const` reference, so mutating it via `+=` triggers a compile error.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: References',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Allow `levelUp` to mutate `lvl` directly in place.',
            codeLines: ['{{0}} levelUp(int{{1}} lvl) {', '    ++lvl;', '}'],
            expectedTokens: ['void', '&'],
            distractors: ['int', '*', 'const'],
            explanation: '`void` + `int&` mutates caller `lvl` directly with zero copy.',
            syntaxHint: 'Adding `const` would forbid `++lvl`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the dangling reference bug returning address of a dead local.',
            lines: [
              'int& makeLocal() {',
              '    int x = 42;',
              '    return x;',
              '}',
            ],
            bugLine: 2,
            fixed: '    return 42; // change return type to int',
            explanation: '`x` is destroyed when `makeLocal` returns! Returning `int&` creates undefined behavior (dangling reference).',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed when two refs alias the same int?',
            code: ['int x = 5;', 'int& r = x;', 'r *= 3;', 'std::cout << x;'],
            options: ['15', '5', '3'],
            answer: 0,
            explanation: '`r` IS `x`, so multiplying `r` by `3` directly updates `x` to `15`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Function Overloading & Scope',
        subtitle: 'Overload by parameter types and avoid dangling stack returns',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Compile-Time Function Overloading',
            explanation:
              'C++ allows multiple functions with the same name as long as their parameter types or counts differ. The compiler picks the exact match at compile time with zero runtime overhead.',
            code: ['int add(int a, int b);', 'double add(double a, double b);'],
          },
          {
            type: 'token_builder',
            prompt: 'Write the matching `double` overload for `square`.',
            codeLines: [
              'int square(int n) { return n * n; }',
              '{{0}} square({{1}} n) { return n * n; }',
            ],
            expectedTokens: ['double', 'double'],
            distractors: ['int', 'auto', 'void'],
            explanation: 'Distinct parameter types (`double` vs `int`) overload cleanly.',
            syntaxHint: 'Cannot overload differing ONLY by return type; parameter types must differ.',
          },
          {
            type: 'token_builder',
            prompt: 'Return by value (`std::string`) safely instead of dangling ref.',
            codeLines: ['{{0}} buildTag(const std::string& u) {', '    return "@" + u;', '}'],
            expectedTokens: ['std::string'],
            distractors: ['std::string&', 'char&', 'void'],
            explanation: 'Returning a newly built local string MUST return by value (`std::string`), never `&`.',
            syntaxHint: 'Returning `std::string&` to a temporary `"@" + u` creates a dangling reference!',
          },
          {
            type: 'token_builder',
            prompt: 'Pass both a mutable counter ref and a read-only const ref label.',
            codeLines: ['void record(int{{0}} total, {{1}} std::string{{2}} label) {', '    ++total;', '}'],
            expectedTokens: ['&', 'const', '&'],
            distractors: ['*', 'val', 'let'],
            explanation: 'Mix `T&` for output mutation and `const T&` for read-only inputs.',
            syntaxHint: 'Keep `label` immutable via `const std::string&`.',
          },
          {
            type: 'predict_output',
            prompt: 'Which overload runs for `calc(2.5)`?',
            code: [
              'int calc(int x) { return 1; }',
              'int calc(double x) { return 2; }',
              'std::cout << calc(2.5);',
            ],
            options: ['2', '1', 'Compile error'],
            answer: 0,
            explanation: '`2.5` is a `double` literal, matching the second overload (`2`).',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss Challenge',
        subtitle: 'Design zero-copy interfaces free of dangling references',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Safe Reference Architecture',
            explanation:
              'Never return a reference to a local stack variable. Use `T&` for in-place mutation, `const T&` for large reads, and value return for newly constructed results.',
            code: ['void apply(int& score, const std::string& mode);'],
          },
          {
            type: 'token_builder',
            prompt: 'Double `xp` in place only if `mode == "2x"`.',
            codeLines: [
              'void boost(int{{0}} xp, {{1}} std::string{{2}} mode) {',
              '    if (mode == "2x") xp *= 2;',
              '}',
            ],
            expectedTokens: ['&', 'const', '&'],
            distractors: ['*', 'var', 'ref'],
            explanation: '`xp` mutates via `int&`, while `mode` avoids allocation copy via `const std::string&`.',
            syntaxHint: 'Do not make `xp` `const` since the function multiplies it in place.',
          },
          {
            type: 'token_builder',
            prompt: 'Return a combined `int` sum safely by value.',
            codeLines: ['{{0}} sumRefs(const int& a, const int& b) {', '    {{1}} a + b;', '}'],
            expectedTokens: ['int', 'return'],
            distractors: ['int&', 'void', '*'],
            explanation: 'Because `a + b` produces a temporary value, return `int` by value.',
            syntaxHint: 'Never return `int&` to a temporary expression `a + b`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the reference reassignment bug (references cannot be rebound).',
            lines: [
              'int x = 10, y = 20;',
              'int& r = x;',
              'const int& cr = y;',
              'cr += 5;',
            ],
            bugLine: 3,
            fixed: 'r += 5;',
            explanation: '`cr` is a `const` reference, so mutating through `cr` is rejected by the compiler.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: [
              'void scale(int& a, int k) { a *= k; k = 99; }',
              'int v = 4, m = 3; scale(v, m);',
              'std::cout << v << ":" << m;',
            ],
            options: ['12:3', '12:99', '4:3'],
            answer: 0,
            explanation: '`v` passed by `&` becomes `12`; `m` passed by value stays `3`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Pointers & Memory Addresses (*) (5 nodes)
  // =========================================================================
  {
    title: 'Pointers & Memory Addresses (*)',
    subtitle: 'Read stack addresses with `&`, dereference `*p`, and guard `nullptr`.',
    conceptGraphicType: 'cpp_pointers',
    guidebook: {
      summary:
        'Unlike references, pointers (`T*`) are full variables holding raw memory addresses. A pointer can be reassigned (`p = &other`), initialized to `nullptr`, and accessed via the dereference operator `*p` or struct arrow `p->field`.',
      mentalModel:
        'Keep the two dual symbols straight: `&expr` produces the address OF `expr`; `*ptr` follows the address inside `ptr` to read or write the target value in memory.',
      keyTakeaways: [
        'Initialize every pointer immediately — either `&var` or `nullptr` — never leave an uninitialized wild pointer.',
        'Always guard optional pointers (`if (ptr != nullptr)`) before reading `*ptr` or `ptr->member`.',
        'Notice `*` means "pointer type" in declarations (`int* p`) and "dereference address" in expressions (`*p = 5`).',
        'Prefer references (`T&`) when null is impossible; reserve raw `T*` for optional non-owning links.',
      ],
      keySyntax: [
        {
          title: 'Address-Of (&) & Dereference (*)',
          tag: 'POINTERS',
          code: 'int hp = 100;\nint* ptr = &hp;\n*ptr = 80;\nstd::cout << hp << " @ " << (ptr != nullptr);',
          output: '80 @ 1',
          explanation:
            '`&hp` grabs `hp`’s stack address; writing `*ptr = 80` modifies `hp` directly at that address.',
          notes: [
            'Reassigning `ptr = &other` points `ptr` elsewhere without changing `hp`.',
          ],
        },
        {
          title: 'Safe nullptr Guard & Rebinding',
          tag: 'SAFETY',
          code: 'int* target = nullptr;\nif (target == nullptr) {\n  std::cout << "No target locked";\n}',
          output: 'No target locked',
          explanation:
            'Modern C++ uses the type-safe `nullptr` keyword (instead of `NULL` or `0`) to mark an empty pointer.',
          notes: [
            'Shorthand `if (ptr)` checks `ptr != nullptr` cleanly.',
          ],
        },
        {
          title: 'Arrow Operator (`->`) on Struct Pointers',
          tag: 'MEMBER ACCESS',
          code: 'struct Node { int id; };\nNode n{7};\nNode* p = &n;\nstd::cout << p->id;',
          output: '7',
          explanation:
            '`p->id` is clean syntax sugar for `(*p).id` when reading fields through a pointer.',
          notes: [
            'Remember: `.` for values/references, `->` for pointers and smart pointers.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Dereferencing a Null or Uninitialized Pointer',
          buggyCode: 'int* p = nullptr;\n*p = 42;  // Segfault crash!',
          fixedCode: 'int* p = nullptr;\nif (p != nullptr) { *p = 42; }',
          reason:
            'Writing to address `0x0` (`nullptr`) triggers an immediate OS segmentation fault. Always verify non-null first.',
        },
        {
          title: 'Declaring Two Pointers on One Line Wrong',
          buggyCode: 'int* a, b;  // b is an int, NOT int*!',
          fixedCode: 'int* a = nullptr;\nint* b = nullptr;',
          reason:
            'In C++ grammar, `*` binds to each declarator name (`a`), not the base type. Declare one pointer per line cleanly.',
        },
      ],
      proTip:
        'If a pointer never owns heap cleanup and simply observes an existing variable, prefer a non-owning `T*` initialized to `nullptr`, or use `std::optional<T&>` / plain `T&` whenever presence is guaranteed.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Addresses (&) & Dereference (*)',
        subtitle: 'Inspect stack memory addresses and write via *ptr',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Pointers Hold Memory Addresses',
            explanation:
              'Applying `&` to a variable returns its address (`&x`). Storing that address in `int* p = &x;` lets `*p` read or modify `x` directly through memory.',
            code: ['int x = 10;', 'int* p = &x;', '*p = 25;  // x becomes 25'],
            highlightNote: 'Notice `*` means "pointer type" in declarations, and "dereference" in expressions.',
          },
          {
            type: 'token_builder',
            prompt: 'Store the memory address of `xp` inside pointer `p`.',
            codeLines: ['int xp = 100;', 'int{{0}} p = {{1}}xp;'],
            expectedTokens: ['*', '&'],
            distractors: ['&', '*', '->'],
            explanation: '`int* p = &xp;` declares an int pointer holding the address of `xp`.',
            syntaxHint: 'LHS type uses `*`; RHS address-of operator uses `&`.',
          },
          {
            type: 'token_builder',
            prompt: 'Modify `xp` indirectly by dereferencing `p`.',
            codeLines: ['int xp = 10;', 'int* p = &xp;', '{{0}}p = 99;', 'std::cout << xp;'],
            expectedTokens: ['*'],
            distractors: ['&', '->', '.'],
            explanation: '`*p = 99` writes `99` into the memory location `p` points to.',
            syntaxHint: 'Assigning `p = 99` without `*` tries to overwrite the address itself!',
            output: '99',
          },
          {
            type: 'token_builder',
            prompt: 'Re-point `p` to `b` cleanly and print its dereferenced value.',
            codeLines: ['int a = 1, b = 2;', 'int* p = &a;', 'p = {{0}}b;', 'std::cout << {{1}}p;'],
            expectedTokens: ['&', '*'],
            distractors: ['*', '&', '->'],
            explanation: 'Unlike references, pointers can reseat (`p = &b`) and then dereference (`*p`).',
            syntaxHint: 'To point `p` at `b`, assign `p = &b`.',
            output: '2',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the type error writing an int directly into a pointer.',
            lines: [
              'int score = 50;',
              'int* ptr = &score;',
              'ptr = 75;',
              'std::cout << score;',
            ],
            bugLine: 2,
            fixed: '*ptr = 75;',
            explanation: '`ptr` holds an address; updating the pointed value requires `*ptr = 75;`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'nullptr & Safety Checks',
        subtitle: 'Prevent segfaults with modern C++ nullptr guards',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Type-Safe `nullptr` Guards',
            explanation:
              'Never initialize an empty pointer uninitialized — garbage addresses cause undefined crashes. Initialize empty pointers to `nullptr` and always guard with `if (p != nullptr)` before `*p`.',
            code: ['int* p = nullptr;', 'if (p != nullptr) *p = 5;'],
          },
          {
            type: 'token_builder',
            prompt: 'Initialize pointer safely to modern C++ null.',
            codeLines: ['int* target = {{0}};'],
            expectedTokens: ['nullptr'],
            distractors: ['null', 'None', 'nil'],
            explanation: 'C++11 introduced type-safe keyword `nullptr` to replace ambiguous `0` / `NULL`.',
            syntaxHint: '`null` (JS) and `nil` (Go) do not compile in C++.',
          },
          {
            type: 'token_builder',
            prompt: 'Guard before dereferencing optional pointer `p`.',
            codeLines: ['void reset(int* p) {', '    if (p {{0}} {{1}}) *p = 0;', '}'],
            expectedTokens: ['!=', 'nullptr'],
            distractors: ['==', 'null', 'nil'],
            explanation: 'Checking `p != nullptr` guarantees `*p` never crashes on a null pointer.',
            syntaxHint: 'Dereferencing when `p == nullptr` causes a segmentation fault!',
          },
          {
            type: 'token_builder',
            prompt: 'Access struct field cleanly through pointer arrow `->`.',
            codeLines: ['struct Hero { int xp; };', 'Hero h{50};', 'Hero* p = &h;', 'std::cout << p{{0}}xp;'],
            expectedTokens: ['->'],
            distractors: ['.', '::', '*'],
            explanation: 'Through a pointer, access members using `p->xp` (shorthand for `(*p).xp`).',
            syntaxHint: 'Use `.` for values/references, and `->` for pointers.',
            output: '50',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed when `ptr` stays null vs assigned?',
            code: ['int x = 7;', 'int* p = nullptr;', 'if (!p) p = &x;', 'std::cout << *p;'],
            options: ['7', '0', 'Segfault'],
            answer: 0,
            explanation: '`!p` is true (`p` is `nullptr`), so `p` points to `&x` before printing `*p` (`7`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Pointers',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Guard `ptr` against `nullptr` and increment pointed value.',
            codeLines: ['if (ptr != {{0}}) {', '    {{1}}ptr += 10;', '}'],
            expectedTokens: ['nullptr', '*'],
            distractors: ['null', '&', '->'],
            explanation: 'Guard with `nullptr` and dereference with `*` before incrementing.',
            syntaxHint: 'Write `(*ptr) += 10` (`*ptr += 10`).',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the immediate null-dereference segfault bug.',
            lines: [
              'int* ptr = nullptr;',
              'int fallback = 10;',
              '*ptr = fallback;',
              'std::cout << fallback;',
            ],
            bugLine: 2,
            fixed: 'ptr = &fallback;',
            explanation: 'Writing `*ptr` while `ptr` is `nullptr` triggers a segmentation fault.',
          },
          {
            type: 'predict_output',
            prompt: 'What does reseating `p` leave in `a` vs `b`?',
            code: ['int a = 1, b = 2;', 'int* p = &a; *p = 10;', 'p = &b; *p = 20;', 'std::cout << a + b;'],
            options: ['30', '21', '12'],
            answer: 0,
            explanation: '`a` becomes `10` and `b` becomes `20`, summing to `30`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Pointer Arithmetic & Const Ptr',
        subtitle: 'Step across contiguous buffers and understand const placement',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Arrays Decay to Contiguous Pointers',
            explanation:
              'Adding `1` to `int* p` advances the memory address by `sizeof(int)` (`4` bytes), landing directly on the next array element! That is how array indexing `a[i]` works under the hood.',
            code: ['int arr[3] = {10, 20, 30};', 'int* p = arr;', '*(p + 1) == 20'],
          },
          {
            type: 'token_builder',
            prompt: 'Read the 2nd element (`20`) via pointer offset dereference.',
            codeLines: ['int a[2] = {10, 20};', 'int* p = a;', 'std::cout << {{0}}(p + 1);'],
            expectedTokens: ['*'],
            distractors: ['&', '->', '[]'],
            explanation: '`*(p + 1)` advances by 1 element (`4` bytes) and reads `20`.',
            syntaxHint: 'Parentheses are required so `*` applies after `+ 1`.',
            output: '20',
          },
          {
            type: 'token_builder',
            prompt: 'Lock the pointed data as read-only (`const T*`).',
            codeLines: ['void inspect({{0}} int{{1}} p) {', '    if (p) std::cout << *p;', '}'],
            expectedTokens: ['const', '*'],
            distractors: ['&', 'constexpr', 'readonly'],
            explanation: '`const int* p` lets `p` point anywhere, while forbidding writing to `*p`.',
            syntaxHint: 'Read C++ pointer types right-to-left: "pointer to const int".',
          },
          {
            type: 'token_builder',
            prompt: 'Use arrow syntax cleanly inside member method `this->`.',
            codeLines: ['void setXp(int xp) {', '    {{0}}->xp = xp;', '}'],
            expectedTokens: ['this'],
            distractors: ['self', 'super', 'auto'],
            explanation: 'Inside C++ member functions, `this` is a pointer to the current object (`this->`).',
            syntaxHint: 'In C++, `this` is a pointer so it uses `->`, whereas `self.` is Python.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `*(arr + 2)` output?',
            code: ['int arr[3] = {5, 15, 25};', 'std::cout << *(arr + 2);'],
            options: ['25', '7', '15'],
            answer: 0,
            explanation: '`arr` decays to `&arr[0]`; `+ 2` advances two `int` slots to `25`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss Challenge',
        subtitle: 'Demonstrate rock-solid pointer safety and indirection',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Mastering Memory Indirection',
            explanation:
              'Safe C++ code uses references (`T&`) whenever an object must exist, and nullable pointers (`T*`) guarded against `nullptr` when absence is valid.',
            code: ['if (node != nullptr) std::cout << node->xp;'],
          },
          {
            type: 'token_builder',
            prompt: 'Check `p` is non-null, then read member `xp` cleanly.',
            codeLines: [
              'int readXp(const Player* p) {',
              '    if (p == {{0}}) return 0;',
              '    return p{{1}}xp;',
              '}',
            ],
            expectedTokens: ['nullptr', '->'],
            distractors: ['null', '.', '*'],
            explanation: 'Compare pointers against `nullptr`, then use `->` for field access.',
            syntaxHint: 'Dot access `p.xp` fails on a pointer `Player*`.',
          },
          {
            type: 'token_builder',
            prompt: 'Take address of `hp`, write via pointer, and output.',
            codeLines: ['int hp = 50;', 'int* p = {{0}}hp;', '{{1}}p += 25;'],
            expectedTokens: ['&', '*'],
            distractors: ['*', '&', '->'],
            explanation: 'Bind pointer with `&hp`, mutate target integer via `*p`.',
            syntaxHint: 'Remember `&` = address, `*` = dereference.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the dangling uninitialized wildcard pointer.',
            lines: [
              'int safe = 10;',
              'int* bad;',
              '*bad = 99;',
              'std::cout << safe;',
            ],
            bugLine: 1,
            fixed: 'int* bad = nullptr;',
            explanation: 'Leaving `int* bad;` uninitialized points into random memory; always initialize to `nullptr` or `&var`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['int v = 8;', 'int* p = &v;', '(*p)--;', 'std::cout << v;'],
            options: ['7', '8', 'Segfault'],
            answer: 0,
            explanation: '`(*p)--` decrements `v` directly through its memory address to `7`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Arrays & std::vector (STL) (5 nodes)
  // =========================================================================
  {
    title: 'Arrays & std::vector (STL)',
    subtitle: 'Manage dynamic heap arrays safely with `std::vector` and iterators.',
    conceptGraphicType: 'cpp_vectors',
    guidebook: {
      summary:
        '`std::vector<T>` is C++’s dynamic contiguous array inside the STL (`<vector>`). It combines cache-friendly O(1) index speed with automatic resizing, `.size()` tracking, and deterministic RAII cleanup.',
      mentalModel:
        'A vector keeps three pointers on the stack (`begin`, `end`, `capacity`) pointing to one contiguous heap buffer. When `.push_back()` exceeds `capacity`, it doubles allocation cleanly — unless you call `.reserve(n)` ahead of time.',
      keyTakeaways: [
        'Always prefer `std::vector<T>` (dynamic) or `std::array<T, N>` (fixed) over raw C arrays `int arr[]`.',
        '`v[i]` skips bounds checks for max speed; `v.at(i)` throws `std::out_of_range` cleanly on invalid indices.',
        'Call `v.reserve(count)` before inserting known bulk elements to eliminate repeated heap reallocations.',
        'Iterate with `for (const auto& item : v)` so large items aren’t copied on each step.',
      ],
      keySyntax: [
        {
          title: 'Dynamic Growth & Bounds-Safe Access',
          tag: 'STL VECTOR',
          code: '#include <vector>\nstd::vector<int> v = {10, 20};\nv.push_back(30);\nstd::cout << v.size() << " -> " << v.at(2);',
          output: '3 -> 30',
          explanation:
            '`.push_back()` appends in amortized O(1) time while `.size()` tracks exact element count.',
          notes: [
            'Use `.empty()` instead of `.size() == 0` for idiomatic STL readability.',
          ],
        },
        {
          title: 'Capacity Pre-Allocation & Sorting',
          tag: 'ALGORITHMS',
          code: 'std::vector<int> nums = {30, 10, 20};\nstd::sort(nums.begin(), nums.end());\nfor (int x : nums) { std::cout << x << " "; }',
          output: '10 20 30 ',
          explanation:
            'Iterators (`begin()`, `end()`) plug vectors straight into `<algorithm>` utilities like `std::sort` and `std::find`.',
          notes: [
            '`nums.reserve(1000)` allocates capacity once without changing `nums.size()`.',
          ],
        },
        {
          title: 'Safe Pop & Back Access',
          tag: 'STACK OPS',
          code: 'std::vector<int> st = {4, 8, 12};\nint top = st.back();\nst.pop_back();\nstd::cout << top << " rem:" << st.size();',
          output: '12 rem:2',
          explanation:
            '`.back()` inspects the tail element while `.pop_back()` removes it (always ensure `!st.empty()` first!).',
          notes: [
            'Never use `st[st.size()]` — valid indices run strictly `0` through `st.size() - 1`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Mutating Vector Size During Iteration',
          buggyCode: 'for (int x : vec) {\n  if (x > 0) vec.push_back(0); // Invalidates iterators!\n}',
          fixedCode: 'size_t n = vec.size();\nfor (size_t i = 0; i < n; ++i) { ... }',
          reason:
            '`push_back()` can reallocate the heap buffer mid-loop, leaving range-for iterators dangling cleanly into freed memory.',
        },
        {
          title: 'Reading `.back()` or `[0]` on an Empty Vector',
          buggyCode: 'std::vector<int> v;\nint first = v[0]; // Undefined behavior!',
          fixedCode: 'std::vector<int> v;\nint first = v.empty() ? 0 : v[0];',
          reason:
            'Indexing an empty vector is silent memory corruption; check `!v.empty()` or guard indices strictly `< v.size()`.',
        },
      ],
      proTip:
        'Need to construct complex objects inside a vector without temporary copies? Call `v.emplace_back(arg1, arg2)` to construct the element directly in-place at the vector’s tail.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'std::vector Basics',
        subtitle: 'Create resizable STL vectors and append with push_back',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Dynamic Heap Lists (`std::vector`)',
            explanation:
              'Raw C arrays have fixed compile-time sizes. `std::vector<T>` stores contiguous heap elements that grow cleanly with `.push_back()` and know their own `.size()`.',
            code: ['#include <vector>', 'std::vector<int> v = {10, 20};', 'v.push_back(30);'],
          },
          {
            type: 'token_builder',
            prompt: 'Append `99` to the end of vector `scores`.',
            codeLines: ['std::vector<int> scores = {10, 20};', 'scores.{{0}}(99);'],
            expectedTokens: ['push_back'],
            distractors: ['append', 'push', 'add'],
            explanation: 'STL vectors append elements using `.push_back(val)`.',
            syntaxHint: '`.push()` belongs to JavaScript; `.append()` belongs to Python.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare an integer vector and query its element count.',
            codeLines: ['std::{{0}}<int> nums = {1, 2, 3};', 'auto n = nums.{{1}}();'],
            expectedTokens: ['vector', 'size'],
            distractors: ['list', 'len', 'length'],
            explanation: '`std::vector<int>` exposes `.size()` returning `3`.',
            syntaxHint: 'Vectors do not expose `.length()`; use `.size()`.',
          },
          {
            type: 'token_builder',
            prompt: 'Remove the tail element safely after checking `!v.empty()`.',
            codeLines: ['if (!v.{{0}}()) {', '    v.{{1}}();', '}'],
            expectedTokens: ['empty', 'pop_back'],
            distractors: ['isEmpty', 'pop', 'shift'],
            explanation: 'Check `.empty()` cleanly and call `.pop_back()` (note: returns `void`, unlike Python!).',
            syntaxHint: '`.pop_back()` removes the last item without returning it.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the invalid method call on `std::vector`.',
            lines: [
              'std::vector<int> xp = {10, 20};',
              'xp.append(30);',
              'std::cout << xp.size();',
            ],
            bugLine: 1,
            fixed: 'xp.push_back(30);',
            explanation: '`std::vector` has no `.append()`; use `.push_back(30)`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Bounds Safety & Iterators',
        subtitle: 'Compare v[i] vs v.at(i) and sort with iterators',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Iterators `.begin()` & `.end()`',
            explanation:
              'Standard algorithms like `std::sort` operate cleanly on half-open iterator ranges `[v.begin(), v.end())`. Calling `.at(i)` adds bounds checking that throws `std::out_of_range` instead of silent memory corruption.',
            code: ['std::sort(v.begin(), v.end());', 'int x = v.at(0);'],
          },
          {
            type: 'token_builder',
            prompt: 'Sort vector `v` in ascending order using STL iterators.',
            codeLines: ['std::sort(v.{{0}}(), v.{{1}}());'],
            expectedTokens: ['begin', 'end'],
            distractors: ['start', 'stop', 'first'],
            explanation: '`v.begin()` and `v.end()` delimit all elements in an STL container.',
            syntaxHint: 'Every STL algorithm takes `(begin, end)` iterators.',
          },
          {
            type: 'token_builder',
            prompt: 'Iterate by const-ref so big strings aren’t copied.',
            codeLines: ['for ({{0}} auto{{1}} name : names) {', '    std::cout << name;', '}'],
            expectedTokens: ['const', '&'],
            distractors: ['*', 'var', 'let'],
            explanation: '`const auto&` binds cleanly to each item with zero allocation overhead.',
            syntaxHint: 'Writing `for (auto name : names)` copies every string!',
          },
          {
            type: 'token_builder',
            prompt: 'Access index `2` with runtime bounds validation.',
            codeLines: ['int val = nums.{{0}}(2);', 'std::cout << nums.{{1}}();'],
            expectedTokens: ['at', 'back'],
            distractors: ['get', 'last', 'end'],
            explanation: '`.at(2)` checks bounds; `.back()` returns a reference to the last item directly.',
            syntaxHint: '`.end()` returns a past-the-end iterator, NOT the last value (`.back()`).',
          },
          {
            type: 'predict_output',
            prompt: 'What does mutating via `auto&` in a range loop print?',
            code: ['std::vector<int> v = {1, 2};', 'for (auto& x : v) x *= 10;', 'std::cout << v[1];'],
            options: ['20', '2', 'Compile error'],
            answer: 0,
            explanation: 'Reference `auto& x` modifies vector elements in place, turning `v[1]` into `20`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: STL Vectors',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Reserve capacity and push value without excess allocations.',
            codeLines: ['std::vector<int> v;', 'v.{{0}}(100);', 'v.{{1}}(42);'],
            expectedTokens: ['reserve', 'push_back'],
            distractors: ['resize', 'append', 'alloc'],
            explanation: '`.reserve(100)` allocates capacity while leaving `.size() == 0` before `.push_back()`.',
            syntaxHint: '`.resize(100)` would insert 100 zeros BEFORE index 0!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the dangling iterator / empty-pop hazard.',
            lines: [
              'std::vector<int> v = {1, 2};',
              'int x = v.pop_back();',
              'std::cout << v.size();',
            ],
            bugLine: 1,
            fixed: 'int x = v.back(); v.pop_back();',
            explanation: 'In C++, `pop_back()` returns `void`! Read `v.back()` first before popping.',
          },
          {
            type: 'predict_output',
            prompt: 'What is `v.size()` after `reserve(50)`?',
            code: ['std::vector<int> v = {5, 6};', 'v.reserve(50);', 'std::cout << v.size();'],
            options: ['2', '50', '52'],
            answer: 0,
            explanation: '`reserve` adjusts capacity only, so element count `v.size()` stays `2`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: '2D Vectors & Memory Performance',
        subtitle: 'Allocate grids cleanly and avoid O(N) reallocations',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Fixed Size & 2D Vectors',
            explanation:
              'Construct pre-sized vectors cleanly via `std::vector<int> v(n, 0)` (n zeros). Combine `emplace_back` or `reserve` to minimize temporary object copies.',
            code: ['std::vector<int> dp(5, 0);', 'std::vector<std::vector<int>> grid(3, dp);'],
          },
          {
            type: 'token_builder',
            prompt: 'Initialize vector `counts` with `10` elements all set to `0`.',
            codeLines: ['std::vector<int> counts{{0}}10, 0{{1}};'],
            expectedTokens: ['(', ')'],
            distractors: ['{', '}', '['],
            explanation: 'Parentheses `counts(10, 0)` invokes count-fill constructor (10 zeros), whereas `{10, 0}` creates 2 items `[10, 0]`!',
            syntaxHint: 'Critical C++ distinction: `(10, 0)` = ten zeros, `{10, 0}` = two values!',
          },
          {
            type: 'token_builder',
            prompt: 'Access first and last items safely without raw `0` vs `size()-1`.',
            codeLines: ['int head = v.{{0}}();', 'int tail = v.{{1}}();'],
            expectedTokens: ['front', 'back'],
            distractors: ['first', 'last', 'end'],
            explanation: '`.front()` and `.back()` clearly express head and tail access.',
            syntaxHint: 'Unlike Python `v[-1]`, negative indexing is undefined behavior in C++!',
          },
          {
            type: 'token_builder',
            prompt: 'Clear all elements cleanly while keeping capacity intact.',
            codeLines: ['v.{{0}}();', 'std::cout << v.empty();'],
            expectedTokens: ['clear'],
            distractors: ['reset', 'erase', 'empty'],
            explanation: '`.clear()` removes every element and sets `.size()` to `0`.',
            syntaxHint: '`.empty()` only inspects whether size is `0` — it does not empty the vector!',
            output: '1',
          },
          {
            type: 'predict_output',
            prompt: 'Spot `{4, 1}` vs `(4, 1)` vector size!',
            code: ['std::vector<int> a{4, 1};', 'std::vector<int> b(4, 1);', 'std::cout << a.size() << ":" << b.size();'],
            options: ['2:4', '4:4', '2:2'],
            answer: 0,
            explanation: 'Brace list `{4, 1}` holds 2 ints; paren constructor `(4, 1)` holds four `1`s.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss Challenge',
        subtitle: 'Synthesize STL sorting, const iteration, and bounds safety',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: STL Discipline',
            explanation:
              'Never index `v[-1]`, never assign `x = v.pop_back()`, and iterate read-only collections as `const auto&`.',
            code: ['std::sort(v.begin(), v.end());'],
          },
          {
            type: 'token_builder',
            prompt: 'Sort `scores` and print highest score via `.back()`.',
            codeLines: [
              'std::sort(scores.{{0}}(), scores.{{1}}());',
              'std::cout << scores.{{2}}();',
            ],
            expectedTokens: ['begin', 'end', 'back'],
            distractors: ['start', 'stop', 'last'],
            explanation: 'Sorting ascending puts the max element at `scores.back()`.',
            syntaxHint: 'Use `.back()` cleanly instead of `*scores.end()` (undefined behavior!).',
          },
          {
            type: 'token_builder',
            prompt: 'Sum elements read-only with zero vector copy.',
            codeLines: [
              'int sum = 0;',
              'for ({{0}} auto{{1}} x : vals) sum += x;',
            ],
            expectedTokens: ['const', '&'],
            distractors: ['*', 'var', 'let'],
            explanation: '`const auto&` works uniformly for ints, strings, and structs.',
            syntaxHint: 'Add `const` + `&` for safe read-only iteration.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the dangerous Python-style negative index bug in C++.',
            lines: [
              'std::vector<int> v = {10, 20, 30};',
              'int last = v[-1];',
              'std::cout << last;',
            ],
            bugLine: 1,
            fixed: 'int last = v.back();',
            explanation: 'C++ does NOT wrap negative indices; `v[-1]` reads garbage memory before index `0`!',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['std::vector<int> v = {3, 1, 2};', 'v.pop_back();', 'std::cout << v.back();'],
            options: ['1', '2', '3'],
            answer: 0,
            explanation: 'Popping `2` leaves `{3, 1}`, so `.back()` returns `1`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 6: Structs & Classes (5 nodes)
  // =========================================================================
  {
    title: 'Structs & Classes',
    subtitle: 'Encapsulate data, constructors, access modifiers, and RAII destructors.',
    conceptGraphicType: 'cpp_classes',
    guidebook: {
      summary:
        'C++ `struct` and `class` are virtually identical blueprints combining state and methods; the sole difference is default visibility (`public` for `struct`, `private` for `class`). Constructors use initializer lists and RAII destructors handle cleanup deterministically.',
      mentalModel:
        'Every time a stack-allocated C++ object hits its closing brace `}`, its destructor (`~ClassName()`) executes automatically — guaranteeing files, locks, and buffers close even when errors occur.',
      keyTakeaways: [
        'Use `struct` for plain passive data aggregates (`Point { int x; int y; }`) and `class` when invariants need `private` guards.',
        'Initialize fields in the constructor’s member initializer list `: xp(x)` before the `{}` body runs.',
        'Mark read-only getter methods `const` (`int getXp() const`) so they work on `const T&` parameters.',
        'Always place a semicolon `;` after the closing brace `};` of a class or struct definition.',
      ],
      keySyntax: [
        {
          title: 'Class, Initializer List & const Getter',
          tag: 'ENCAPSULATION',
          code: 'class Player {\n  int xp;\npublic:\n  Player(int x) : xp(x) {}\n  int getXp() const { return xp; }\n};\nPlayer p(150);\nstd::cout << p.getXp();',
          output: '150',
          explanation:
            '`: xp(x)` initializes `xp` directly without creating a dummy default first, and `const` promises no mutation.',
          notes: [
            'Prefix single-argument constructors with `explicit` (`explicit Player(int x)`) to prevent accidental implicit conversions.',
          ],
        },
        {
          title: 'Plain Data struct & Aggregate Init',
          tag: 'STRUCT',
          code: 'struct Vec2 {\n  int x;\n  int y;\n  int sum() const { return x + y; }\n};\nVec2 pos{12, 8};\nstd::cout << pos.sum();',
          output: '20',
          explanation:
            '`struct` starts `public:` by default, letting callers construct brace-initialized data aggregates concisely.',
          notes: [
            'Notice `{12, 8}` avoids narrowing bugs automatically under C++11+ uniform initialization.',
          ],
        },
        {
          title: 'RAII Destructor Lifecycle',
          tag: 'RAII',
          code: 'struct ScopeLog {\n  ScopeLog() { std::cout << "[open "; }\n  ~ScopeLog() { std::cout << "close]"; }\n};\n{ ScopeLog log; std::cout << "work "; }',
          output: '[open work close]',
          explanation:
            'Constructors acquire resources on entry; destructors (`~Type()`) deterministically clean them up on scope exit.',
          notes: [
            'Zero garbage collector pauses — cleanup happens the exact nanosecond `}` is reached.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Missing Trailing Semicolon After Class Definition',
          buggyCode: 'class Hero {\n  int hp = 100;\n}  // Compile error!',
          fixedCode: 'class Hero {\n  int hp = 100;\n};',
          reason:
            'C++ syntax allows declaring variable instances right after `}`, so omitting `;` causes cryptic compiler errors on subsequent lines.',
        },
        {
          title: 'Omitting const on Read-Only Methods',
          buggyCode: 'int getXp() { return xp; }\nvoid show(const Player& p) { p.getXp(); } // Error!',
          fixedCode: 'int getXp() const { return xp; }\nvoid show(const Player& p) { p.getXp(); }',
          reason:
            'Calling non-`const` methods through a `const Player&` fails compilation because the compiler cannot prove they won’t mutate `p`.',
        },
      ],
      proTip:
        'Write `const` on every method that does not modify object fields — it unlocks passing your objects via `const T&` cleanly throughout the codebase.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'struct vs class',
        subtitle: 'Compare default access visibility and member lists',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Public Structs vs Private Classes',
            explanation:
              'The ONLY built-in difference between `struct` and `class` in C++ is default visibility: `struct` starts `public:`, while `class` starts `private:`. Both require a trailing `;`.',
            code: ['struct Point { int x; int y; };', 'class Vault { private: int key; };'],
          },
          {
            type: 'token_builder',
            prompt: 'Declare `Point` struct and terminate cleanly with `;`.',
            codeLines: ['{{0}} Point {', '    int x;', '    int y;', '}{{1}}'],
            expectedTokens: ['struct', ';'],
            distractors: ['class', ':', 'type'],
            explanation: '`struct` keeps `x, y` public by default; closing brace requires `;`.',
            syntaxHint: 'Missing `;` after `}` confuses C++ parsers into confusing compile errors.',
          },
          {
            type: 'token_builder',
            prompt: 'Expose public constructor inside `class Counter`.',
            codeLines: ['{{0}} Counter {', '    int n;', '{{1}}:', '    Counter() : n(0) {}', '};'],
            expectedTokens: ['class', 'public'],
            distractors: ['struct', 'export', 'open'],
            explanation: '`class` hides `n` as private by default; `public:` exposes the constructor.',
            syntaxHint: 'Do not forget the colon after `public:`.',
          },
          {
            type: 'token_builder',
            prompt: 'Initialize `xp` efficiently via member initializer list.',
            codeLines: ['struct Hero {', '    int xp;', '    Hero(int x) {{0}} xp(x) {}', '};'],
            expectedTokens: [':'],
            distractors: ['=', '->', '=>'],
            explanation: 'C++ member initializer lists follow the signature with a colon `:`.',
            syntaxHint: 'Prefer `: xp(x)` over assigning `this->xp = x` inside the body.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the missing terminator causing C++ parse failures.',
            lines: [
              'struct Node {',
              '    int val;',
              '}',
              'int main() { Node n{5}; }',
            ],
            bugLine: 2,
            fixed: '};',
            explanation: 'Every `struct` or `class` declaration in C++ must close with `};`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Const Methods & RAII',
        subtitle: 'Mark getters const and understand automatic destructors',
        exercises: [
          {
            type: 'theory_bite',
            title: '`const` Methods & Deterministic Destructors',
            explanation:
              'Appending `const` after a method signature promises it will not mutate object fields, letting `const T&` callers invoke it. Destructors `~ClassName()` run automatically on scope exit (RAII).',
            code: ['int getXp() const { return xp; }', '~Session() { cleanup(); }'],
          },
          {
            type: 'token_builder',
            prompt: 'Mark `size()` `const` so read-only refs can call it.',
            codeLines: ['class Box {', '    int n = 4;', 'public:', '    int size() {{0}} { return n; }', '};'],
            expectedTokens: ['const'],
            distractors: ['readonly', 'pure', 'final'],
            explanation: 'Trailing `const` enables calling `box.size()` on `const Box&`.',
            syntaxHint: 'Place `const` AFTER `size()`, before `{`.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare the deterministic RAII destructor for `Handle`.',
            codeLines: ['class Handle {', 'public:', '    {{0}}Handle() { close(); }', '};'],
            expectedTokens: ['~'],
            distractors: ['delete ', 'destroy ', '!'],
            explanation: 'C++ destructors start with tilde `~ClassName()`.',
            syntaxHint: 'Prefix constructor name with `~` for the destructor.',
          },
          {
            type: 'token_builder',
            prompt: 'Prevent accidental single-arg implicit casts with `explicit`.',
            codeLines: ['class Buffer {', 'public:', '    {{0}} Buffer(int cap) {}', '};'],
            expectedTokens: ['explicit'],
            distractors: ['strict', 'sealed', 'private'],
            explanation: '`explicit` stops sneaky compiler bugs like passing `5` where a `Buffer` is expected.',
            syntaxHint: 'Good C++ practice marks single-argument constructors `explicit`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed when RAII object leaves inner scope?',
            code: [
              'struct Log { ~Log() { std::cout << "END"; } };',
              '{ Log l; std::cout << "IN-"; }',
            ],
            options: ['IN-END', 'END-IN', 'IN-'],
            answer: 0,
            explanation: 'Inside `{ ... }`, `IN-` prints first; closing `}` immediately invokes `~Log()` (`END`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: OOP C++',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Expose public `const` getter initialized cleanly via `:`.',
            codeLines: [
              'class Rank {',
              '    int lvl;',
              '{{0}}:',
              '    Rank(int l) {{1}} lvl(l) {}',
              '    int get() {{2}} { return lvl; }',
              '};',
            ],
            expectedTokens: ['public', ':', 'const'],
            distractors: ['private', '=', 'final'],
            explanation: 'Expose members with `public:`, init with `: lvl(l)`, and qualify getter `const`.',
            syntaxHint: 'Getters should almost always carry trailing `const`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `get(const Item& it)` refuses to compile.',
            lines: [
              'struct Item { int id; int getId() { return id; } };',
              'int read(const Item& it) {',
              '    return it.getId();',
              '}',
            ],
            bugLine: 0,
            fixed: 'struct Item { int id; int getId() const { return id; } };',
            explanation: '`it` is `const Item&`, so calling non-const method `getId()` is forbidden!',
          },
          {
            type: 'predict_output',
            prompt: 'Can external code read private `x`?',
            code: ['class A { int x = 5; };', '// inside main(): std::cout << A().x;'],
            options: ['Compile error', '5', '0'],
            answer: 0,
            explanation: '`class` members default to `private:`, blocking external `.x` access.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Encapsulation & Methods',
        subtitle: 'Separate private invariants from clean public APIs',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Guarding Invariants with `private:`',
            explanation:
              'Hide internal state behind `private:` so callers can only mutate via validated methods (e.g., clamping HP at `>= 0`). Outside calls resolve methods with `.` on objects or `->` on pointers.',
            code: ['class Hp { int v; public: void dmg(int d) { v = std::max(0, v - d); } };'],
          },
          {
            type: 'token_builder',
            prompt: 'Instantiate stack `Wallet` and invoke `.add(50)`.',
            codeLines: ['Wallet w(100);', 'w{{0}}add(50);', 'std::cout << w.total() {{1}}'],
            expectedTokens: ['.', ';'],
            distractors: ['->', '::', ':'],
            explanation: 'Stack value objects always use `.` for member access.',
            syntaxHint: 'Do not confuse stack objects (`.`) with pointers (`->`).',
          },
          {
            type: 'token_builder',
            prompt: 'Restrict `balance` as private and expose a `const` getter.',
            codeLines: ['class Vault {', '{{0}}:', '    int bal = 0;', 'public:', '    int get() {{1}} { return bal; }', '};'],
            expectedTokens: ['private', 'const'],
            distractors: ['protected', 'static', 'readonly'],
            explanation: '`private:` locks `bal` inside `Vault`; `get() const` reads safely.',
            syntaxHint: 'Add trailing `const` to read-only getters.',
          },
          {
            type: 'token_builder',
            prompt: 'Construct `Player` with `override` cleanly on virtual method.',
            codeLines: ['struct Base { virtual int bonus() { return 0; } };', 'struct Pro : {{0}} Base {', '    int bonus() {{1}} { return 25; }', '};'],
            expectedTokens: ['public', 'override'],
            distractors: ['extends', 'implements', 'final'],
            explanation: 'C++ inherits with `: public Base` and marks overrides cleanly with `override`.',
            syntaxHint: 'Using `override` asks the compiler to catch mismatched base signatures!',
          },
          {
            type: 'predict_output',
            prompt: 'What does polymorphic `override` return?',
            code: [
              'struct A { virtual int xp() { return 10; } };',
              'struct B : public A { int xp() override { return 30; } };',
              'A* ptr = new B(); std::cout << ptr->xp(); delete ptr;',
            ],
            options: ['30', '10', 'Compile error'],
            answer: 0,
            explanation: '`virtual` enables runtime dispatch so `ptr->xp()` calls `B::xp()` (`30`).',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 6 Boss Challenge',
        subtitle: 'Architect RAII classes with initializer lists and `override`',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Class Guarantees',
            explanation:
              'Every well-built C++ class uses initializer lists `:`, marks read methods `const`, qualifies single-arg constructors `explicit`, and closes with `};`.',
            code: ['class Timer { int s; public: explicit Timer(int sec) : s(sec) {} };'],
          },
          {
            type: 'token_builder',
            prompt: 'Build immutable getter class cleanly.',
            codeLines: [
              '{{0}} Score {',
              '    int pts;',
              'public:',
              '    Score(int p) {{1}} pts(p) {}',
              '    int value() {{2}} { return pts; }',
              '};',
            ],
            expectedTokens: ['class', ':', 'const'],
            distractors: ['struct', '=', 'final'],
            explanation: '`class` protects `pts`, `: pts(p)` constructs directly, and `const` secures reads.',
            syntaxHint: 'Always match `: field(arg)` and trailing `const` on getters.',
          },
          {
            type: 'token_builder',
            prompt: 'Inherit publicly and verify override cleanly.',
            codeLines: [
              'struct Child : {{0}} Parent {',
              '    void run() {{1}} {}',
              '};',
            ],
            expectedTokens: ['public', 'override'],
            distractors: ['extends', 'virtual', 'super'],
            explanation: 'C++ subclasses inherit cleanly via `: public Parent` and validate with `override`.',
            syntaxHint: 'Without `public`, `class` inheritance defaults to private!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the forgotten virtual destructor / missing semicolon error.',
            lines: [
              'class Hero {',
              'public:',
              '    int hp = 100;',
              '}',
            ],
            bugLine: 3,
            fixed: '};',
            explanation: 'Class declarations in C++ must always terminate with `};`.',
          },
          {
            type: 'predict_output',
            prompt: 'What happens with default member initialization?',
            code: ['struct cfg { int speed = 5; };', 'cfg c;', 'std::cout << c.speed;'],
            options: ['5', '0', 'Undefined'],
            answer: 0,
            explanation: 'In-class member initializer `= 5` safely sets `c.speed` to `5`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 7: Smart Pointers & Heap Memory (5 nodes)
  // =========================================================================
  {
    title: 'Smart Pointers & Heap Memory',
    subtitle: 'Replace raw `new`/`delete` with `unique_ptr`, `shared_ptr`, and move semantics.',
    conceptGraphicType: 'cpp_smart_ptr',
    guidebook: {
      summary:
        'Manual `new` and `delete` cause leaks, double-frees, and dangling pointers. Modern C++ owns dynamic heap memory via RAII smart pointers in `<memory>`: `std::unique_ptr` for single ownership and `std::shared_ptr` for reference-counted sharing.',
      mentalModel:
        'Think of `std::unique_ptr` as an exclusive keycard wrapping a raw heap pointer. You can move the keycard to another owner via `std::move(ptr)` (leaving the old one `nullptr`), and whoever holds it last automatically triggers `delete`.',
      keyTakeaways: [
        'Use `std::make_unique<T>(args...)` as your default heap allocator — never write bare `new` or `delete`.',
        '`std::unique_ptr` has ZERO runtime size/speed overhead compared to a raw pointer `T*`.',
        'Use `std::make_shared<T>(args...)` only when multiple independent lifetimes genuinely share one object.',
        'Rule of Zero: compose `std::unique_ptr`, `std::vector`, and `std::string` so you never write manual destructors.',
      ],
      keySyntax: [
        {
          title: 'Exclusive Ownership (`unique_ptr` & `move`)',
          tag: 'UNIQUE PTR',
          code: '#include <memory>\nauto hero = std::make_unique<int>(99);\nauto next = std::move(hero);\nstd::cout << (hero == nullptr) << " " << *next;',
          output: '1 99',
          explanation:
            '`std::unique_ptr` forbids copying at compile time; `std::move` transfers ownership cleanly and sets `hero` to `nullptr`.',
          notes: [
            'Access owned struct fields directly with `*ptr` and `ptr->field`.',
          ],
        },
        {
          title: 'Shared Reference Count (`shared_ptr`)',
          tag: 'SHARED PTR',
          code: 'auto doc = std::make_shared<int>(42);\nauto copy = doc;\nstd::cout << doc.use_count() << " val:" << *copy;',
          output: '2 val:42',
          explanation:
            'Copies bump the atomic control-block counter; heap cleanup executes automatically when `use_count()` hits `0`.',
          notes: [
            'Pair cyclic links (parent ↔ child) with `std::weak_ptr` to break reference cycles cleanly.',
          ],
        },
        {
          title: 'Passing Owned Objects to Observers',
          tag: 'BORROWING',
          code: 'void readVal(const int& val) { std::cout << val; }\nauto box = std::make_unique<int>(77);\nreadVal(*box);',
          output: '77',
          explanation:
            'Functions that only inspect an object should accept `const T&` or `T*`, keeping ownership decoupled cleanly.',
          notes: [
            'Only accept `std::unique_ptr<T>` by value if the function permanently takes over ownership.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Trying to Copy a std::unique_ptr',
          buggyCode: 'auto a = std::make_unique<int>(5);\nauto b = a;  // Compile error!',
          fixedCode: 'auto a = std::make_unique<int>(5);\nauto b = std::move(a);',
          reason:
            'Two `unique_ptr` instances cannot own the same allocation (that would double-free!). Transfer with `std::move` or pick `shared_ptr`.',
        },
        {
          title: 'Using Raw Pointer After std::move',
          buggyCode: 'auto a = std::make_unique<int>(5);\nauto b = std::move(a);\nstd::cout << *a;  // Crashes! a is nullptr',
          fixedCode: 'auto a = std::make_unique<int>(5);\nauto b = std::move(a);\nstd::cout << *b;',
          reason:
            'Moving out of `a` leaves `a` empty (`nullptr`). Always read from the new owner `b`.',
        },
      ],
      proTip:
        'Start every heap allocation with `std::make_unique` — 90% of architectures only need exclusive single ownership (`unique_ptr`) plus non-owning references (`T&`) for readers.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Stack vs Heap & unique_ptr',
        subtitle: 'Allocate safely with `std::make_unique` and zero leaks',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Say Goodbye to Raw `new` / `delete`',
            explanation:
              'If a function returns early or throws an exception before `delete ptr;`, heap memory leaks forever. `std::unique_ptr` frees heap memory automatically via RAII when its owner goes out of scope.',
            code: ['#include <memory>', 'auto p = std::make_unique<int>(42);', 'std::cout << *p;'],
          },
          {
            type: 'token_builder',
            prompt: 'Allocate a heap integer cleanly without raw `new`.',
            codeLines: ['auto ptr = std::{{0}}<int>(99);'],
            expectedTokens: ['make_unique'],
            distractors: ['new_ptr', 'alloc', 'make_copy'],
            explanation: '`std::make_unique<T>(args...)` allocates and wraps safely in one call.',
            syntaxHint: 'Prefer `std::make_unique` over wrapping `unique_ptr<T>(new T)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Dereference `unique_ptr` and check non-null just like a pointer.',
            codeLines: ['auto p = std::make_unique<Player>(5);', 'if (p != {{0}}) {', '    std::cout << p{{1}}xp;', '}'],
            expectedTokens: ['nullptr', '->'],
            distractors: ['null', '.', '*'],
            explanation: '`unique_ptr` supports `!= nullptr`, `*p`, and `->` identically to raw pointers.',
            syntaxHint: 'Use `->` to access fields on smart pointers too.',
          },
          {
            type: 'token_builder',
            prompt: 'Specify the smart pointer type for exclusive ownership.',
            codeLines: ['std::{{0}}<Node> root = std::make_unique<Node>();'],
            expectedTokens: ['unique_ptr'],
            distractors: ['shared_ptr', 'weak_ptr', 'auto_ptr'],
            explanation: '`std::unique_ptr` enforces single ownership with zero overhead.',
            syntaxHint: 'Never use deprecated `auto_ptr` (removed in C++17).',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the memory leak caused by missing `delete` or raw `new`.',
            lines: [
              'void run(bool abort) {',
              '    int* buf = new int(10);',
              '    if (abort) return;',
              '    delete buf;',
              '}',
            ],
            bugLine: 2,
            fixed: '    if (abort) { delete buf; return; } // or use std::make_unique',
            explanation: 'Returning early skips `delete buf;`, leaking heap memory permanently!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Move Semantics (std::move)',
        subtitle: 'Transfer unique_ptr ownership with zero copies',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Moving Exclusive Resources',
            explanation:
              'Copying a `unique_ptr` is banned at compile time because two owners cannot exclusively own one allocation. Calling `std::move(a)` transfers ownership to `b` and sets `a` to `nullptr`.',
            code: ['auto a = std::make_unique<int>(7);', 'auto b = std::move(a);  // a is now nullptr!'],
          },
          {
            type: 'token_builder',
            prompt: 'Transfer ownership from `src` to `dst` cleanly.',
            codeLines: ['auto src = std::make_unique<int>(42);', 'auto dst = std::{{0}}(src);'],
            expectedTokens: ['move'],
            distractors: ['copy', 'clone', 'transfer'],
            explanation: '`std::move(src)` moves pointer ownership without cloning heap memory.',
            syntaxHint: 'After moving, do not dereference `src` because it becomes `nullptr`!',
          },
          {
            type: 'token_builder',
            prompt: 'Take a `unique_ptr` sink parameter by value + move cleanly.',
            codeLines: ['void adopt(std::{{0}}<Bot> b) {}', 'auto bot = std::make_unique<Bot>();', 'adopt(std::{{1}}(bot));'],
            expectedTokens: ['unique_ptr', 'move'],
            distractors: ['shared_ptr', 'ref', 'copy'],
            explanation: 'Passing `std::move(bot)` transfers ownership directly into `adopt`.',
            syntaxHint: 'Passing `bot` without `std::move` fails to compile!',
          },
          {
            type: 'token_builder',
            prompt: 'Observe a heap resource WITHOUT taking ownership using `const T&`.',
            codeLines: ['void inspect({{0}} Item{{1}} item) {}', 'inspect(*uptr);'],
            expectedTokens: ['const', '&'],
            distractors: ['*', 'unique_ptr', 'move'],
            explanation: 'If a function just needs to read an object, pass `*uptr` as `const T&` rather than moving ownership.',
            syntaxHint: 'Dereference `uptr` so the helper accepts simple references cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What is `a == nullptr` right after `b = std::move(a)`?',
            code: ['auto a = std::make_unique<int>(5);', 'auto b = std::move(a);', 'std::cout << (a == nullptr);'],
            options: ['1', '0', 'Compile error'],
            answer: 0,
            explanation: 'Moving a `unique_ptr` nulls out the source (`a == nullptr` is true -> `1`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Smart Pointers',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Create and move a `unique_ptr` safely.',
            codeLines: ['auto p1 = std::{{0}}<int>(8);', 'auto p2 = std::{{1}}(p1);'],
            expectedTokens: ['make_unique', 'move'],
            distractors: ['make_shared', 'copy', 'new'],
            explanation: 'Create exclusive ownership via `make_unique` and transfer with `std::move`.',
            syntaxHint: '`unique_ptr` rejects copy construction — must use `std::move`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the use-after-move null dereference bug!',
            lines: [
              'auto p = std::make_unique<int>(100);',
              'auto q = std::move(p);',
              'std::cout << *p;',
            ],
            bugLine: 2,
            fixed: 'std::cout << *q;',
            explanation: 'Once `std::move(p)` runs, `p` becomes `nullptr`! Dereferencing `*p` segfaults.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `.use_count()` print for two `shared_ptr`s?',
            code: ['auto a = std::make_shared<int>(9);', 'auto b = a;', 'std::cout << a.use_count();'],
            options: ['2', '1', 'Compile error'],
            answer: 0,
            explanation: 'Both `a` and `b` share ownership cleanly, so reference count is `2`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'shared_ptr & weak_ptr',
        subtitle: 'Share ownership safely and break reference cycles',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Reference Counting & Weak Observers',
            explanation:
              '`std::shared_ptr` maintains an atomic reference count and frees memory when the last copy dies. Use `std::weak_ptr` to break cyclic parent-child references without leaking.',
            code: ['auto s = std::make_shared<Doc>();', 'std::weak_ptr<Doc> w = s;', 'if (auto locked = w.lock()) {}'],
          },
          {
            type: 'token_builder',
            prompt: 'Allocate a reference-counted object in one allocation.',
            codeLines: ['auto doc = std::{{0}}<Node>(10);'],
            expectedTokens: ['make_shared'],
            distractors: ['make_unique', 'shared_ptr', 'new'],
            explanation: '`std::make_shared` allocates the object and control block together for cache speed.',
            syntaxHint: 'Always prefer `std::make_shared<T>(...)` over `shared_ptr<T>(new T)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Store a non-owning cycle-breaking link using `weak_ptr`.',
            codeLines: ['std::{{0}}<Node> parent;', 'if (auto sp = parent.{{1}}()) {', '    sp->ping();', '}'],
            expectedTokens: ['weak_ptr', 'lock'],
            distractors: ['unique_ptr', 'get', 'deref'],
            explanation: '`weak_ptr::lock()` safely upgrades to a temporary `shared_ptr` only if still alive.',
            syntaxHint: 'You cannot dereference a `weak_ptr` directly — always `.lock()` it first!',
          },
          {
            type: 'token_builder',
            prompt: 'Inspect current shared reference count cleanly.',
            codeLines: ['auto a = std::make_shared<int>(1);', 'auto b = a;', 'std::cout << a.{{0}}();'],
            expectedTokens: ['use_count'],
            distractors: ['refs', 'count', 'size'],
            explanation: '`.use_count()` reports how many `shared_ptr` owners currently share the block.',
            syntaxHint: 'C++ spells the ref counter accessor `.use_count()`.',
            output: '2',
          },
          {
            type: 'predict_output',
            prompt: 'What happens to `.use_count()` when inner `b` leaves scope?',
            code: ['auto a = std::make_shared<int>(7);', '{ auto b = a; }', 'std::cout << a.use_count();'],
            options: ['1', '2', '0'],
            answer: 0,
            explanation: 'When `b` is destroyed at `}`, count drops back from `2` to `1`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'C++ Mastery Boss',
        subtitle: 'Ship leak-free modern C++ memory management',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Final Boss: Zero Raw `new` / `delete`',
            explanation:
              'Complete the C++ track using modern RAII: `unique_ptr` by default, `std::move` for transfer, `shared_ptr` for shared lifetimes, and `weak_ptr::lock()` against cycles.',
            code: ['auto engine = std::make_unique<Engine>();'],
          },
          {
            type: 'token_builder',
            prompt: 'Construct exclusive pointer and transfer it cleanly.',
            codeLines: [
              'auto p = std::{{0}}<Hero>(100);',
              'std::{{1}}<Hero> teamLead = std::{{2}}(p);',
            ],
            expectedTokens: ['make_unique', 'unique_ptr', 'move'],
            distractors: ['make_shared', 'shared_ptr', 'copy'],
            explanation: 'Exclusive transfer pairs `make_unique`, `unique_ptr`, and `std::move`.',
            syntaxHint: 'Always move exclusive pointers explicitly with `std::move`.',
          },
          {
            type: 'token_builder',
            prompt: 'Promote a `weak_ptr` safely before accessing `.id`.',
            codeLines: [
              'std::{{0}}<Task> ref = sharedTask;',
              'if (auto live = ref.{{1}}()) {',
              '    std::cout << live{{2}}id;',
              '}',
            ],
            expectedTokens: ['weak_ptr', 'lock', '->'],
            distractors: ['shared_ptr', 'get', '.'],
            explanation: '`.lock()` returns a temporary `shared_ptr` accessed safely with `->`.',
            syntaxHint: 'Guard `weak_ptr` via `.lock()` inside an `if` check.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line trying to copy an uncopyable `unique_ptr`.',
            lines: [
              'auto a = std::make_unique<int>(5);',
              'std::unique_ptr<int> b = a;',
              'std::cout << *b;',
            ],
            bugLine: 1,
            fixed: 'std::unique_ptr<int> b = std::move(a);',
            explanation: '`unique_ptr` deletes its copy constructor; ownership must transfer via `std::move(a)`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: [
              'auto w = std::weak_ptr<int>();',
              '{ auto s = std::make_shared<int>(55); w = s; }',
              'std::cout << (w.expired() ? "GONE" : "ALIVE");',
            ],
            options: ['GONE', 'ALIVE', 'Segfault'],
            answer: 0,
            explanation: 'When `s` drops at `}`, the object is freed immediately, so `w.expired()` is true (`GONE`).',
          },
        ],
      },
    ],
  },
];
