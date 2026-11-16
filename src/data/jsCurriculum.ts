import type { UnitSeed } from './types';

export const JS_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: First Steps in JavaScript (6 nodes)
  // =========================================================================
  {
    title: 'First Steps in JavaScript',
    subtitle: 'Print messages, create variables, and work with numbers and text.',
    conceptGraphicType: 'js_vars',
    guidebook: {
      summary:
        'Modern JavaScript defaults to `const` for bindings that never reassign and `let` for counters or mutable references (avoid legacy `var`). Print values cleanly via `console.log()`, interpolate strings with backtick template literals `` `${x}` ``, and always compare with strict equality `===`.',
      mentalModel:
        'Using `const` locks the binding (you cannot write `user = ...` again), while still allowing mutations inside objects or arrays unless copied. Template strings evaluate expressions inside `${...}` before building the final text.',
      keyTakeaways: [
        'Default to `const` everywhere; switch to `let` only when you genuinely reassign (`score += 5`). Never use `var`.',
        'Always compare using strict `===` and `!==` — loose `==` performs weird implicit type coercions (`"5" == 5` is `true`!).',
        'Template literals `` `XP: ${xp}` `` support multi-line text and inline math cleanly.',
        'String + number with `+` coerces to string (`"5" + 1 === "51"`), whereas `-` coerces to number (`"5" - 1 === 4`).',
      ],
      keySyntax: [
        {
          title: 'Template Literals & console.log()',
          tag: 'TEMPLATES',
          code: 'const hero = "Zayd";\nlet xp = 120;\nxp += 30;\nconsole.log(`${hero} -> ${xp} XP`);',
          output: 'Zayd -> 150 XP',
          explanation:
            'Wrap strings in backticks `` `...` `` to inject variables or JS expressions inline with `${...}`.',
          notes: [
            'Passing multiple comma-separated args (`console.log("XP:", xp)`) prints them space-separated.',
          ],
        },
        {
          title: 'Strict Equality (`===`) vs Coercion',
          tag: 'TYPES',
          code: 'console.log(5 === "5", 5 == "5");\nconsole.log(typeof 42, typeof "42");',
          output: 'false true\nnumber string',
          explanation:
            'Strict equality `===` checks BOTH value and runtime type without silent conversions.',
          notes: [
            'Convert user input explicitly with `Number("42")` or `String(42)` instead of relying on coercion.',
          ],
        },
        {
          title: 'const Safety vs Nullish Defaults (`??`)',
          tag: 'DEFAULTS',
          code: 'const input = 0;\nconst safeA = input ?? 10;\nconst safeB = input || 10;\nconsole.log(safeA, safeB);',
          output: '0 10',
          explanation:
            'Nullish coalescing `??` falls back ONLY on `null` or `undefined`, preserving valid `0` and `""` values.',
          notes: [
            'Use `??` whenever `0`, `false`, or empty string `""` is a meaningful setting!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Accidental String Concatenation with +',
          buggyCode: 'const qty = "3";\nconsole.log(qty + 2); // "32"!',
          fixedCode: 'const qty = "3";\nconsole.log(Number(qty) + 2); // 5',
          reason:
            '`+` favors string concatenation whenever either side is text. Parse numeric inputs with `Number()` first.',
        },
        {
          title: 'Reassigning a const Binding',
          buggyCode: 'const score = 10;\nscore += 5; // TypeError!',
          fixedCode: 'let score = 10;\nscore += 5;',
          reason:
            '`const` throws `TypeError: Assignment to constant variable` on reassignment. Declare mutable counters with `let`.',
        },
      ],
      proTip:
        'Check `console.log({ hero, xp })` with curly braces to print labeled key-value pairs cleanly during debugging without typing label strings manually.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Saying Hello',
        subtitle: 'Display words and messages with console.log()',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Your First JavaScript Command',
            explanation:
              'In JavaScript, `console.log()` prints a message on the screen. Wrap words in quotes `" "` so JavaScript treats them as text.',
            code: ['console.log("Hello, World!");'],
            output: 'Hello, World!',
            highlightNote: 'Quotes tell JavaScript where your text starts and ends.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the command to show `"Hello!"` on screen.',
            codeLines: ['{{0}}.log("Hello!");'],
            expectedTokens: ['console'],
            distractors: ['print', 'show', 'echo'],
            explanation: 'In JavaScript, displaying console output uses `console.log(...)`.',
            syntaxHint: 'JavaScript prints via `console.log()`, not `print()`.',
            output: 'Hello!',
          },
          {
            type: 'token_builder',
            prompt: 'Print `"Welcome!"` inside `console.log`.',
            codeLines: ['console.{{0}}({{1}});'],
            expectedTokens: ['log', '"Welcome!"'],
            distractors: ['print', 'Welcome', 'say'],
            explanation: 'Put `"Welcome!"` in quotes inside `console.log(...)`.',
            syntaxHint: 'Wrap text words inside `"..."` quotes.',
            output: 'Welcome!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that forgets quotes around the word `Hello`.',
            lines: [
              'console.log("Starting...");',
              'console.log(Hello);',
              'console.log("Done!");',
            ],
            bugLine: 1,
            fixed: 'console.log("Hello");',
            explanation: 'Without quotes, JavaScript looks for a variable named `Hello` instead of printing text.',
          },
          {
            type: 'predict_output',
            prompt: 'What appears on screen?',
            code: ['console.log("CodeLingo");'],
            options: ['CodeLingo', '"CodeLingo"', 'console'],
            answer: 0,
            explanation: '`console.log()` displays the text inside the quotes cleanly.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Creating Variables',
        subtitle: 'Store text and numbers using let and const',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Variables with let & const',
            explanation:
              'Think of a variable as a labeled box holding a value. Use `let` for boxes whose value can change, and `const` for boxes that stay the same.',
            code: ['const name = "Tarek";', 'let score = 10;', 'console.log(name);'],
            output: 'Tarek',
            highlightNote: 'Only write `let` or `const` once when you first create the variable.',
          },
          {
            type: 'token_builder',
            prompt: 'Create a changeable `score` variable holding `25`.',
            codeLines: ['{{0}} score = 25;'],
            expectedTokens: ['let'],
            distractors: ['int', 'print', 'set'],
            explanation: '`let` creates a variable whose value you can update later.',
            syntaxHint: 'JavaScript uses `let` for changeable variables.',
          },
          {
            type: 'token_builder',
            prompt: 'Save fixed `"Ada"` in `player`, then display it cleanly.',
            codeLines: ['{{0}} player = "Ada";', 'console.log({{1}});'],
            expectedTokens: ['const', 'player'],
            distractors: ['let', '"player"', 'var'],
            explanation: '`const` keeps `"Ada"` fixed, and `console.log(player)` prints its value.',
            syntaxHint: 'Pass `player` without quotes so JavaScript prints `Ada`.',
            output: 'Ada',
          },
          {
            type: 'token_builder',
            prompt: 'Assign `"Paris"` to `city` and print it on screen.',
            codeLines: ['const city {{0}} "Paris";', '{{1}}.log(city);'],
            expectedTokens: ['=', 'console'],
            distractors: ['==', 'print', ':'],
            explanation: 'Use `=` to store `"Paris"` in `city`, and `console.log(city)` to display it.',
            syntaxHint: 'Store with single `=` and print with `console.log()`.',
            output: 'Paris',
          },
          {
            type: 'predict_output',
            prompt: 'What does this JavaScript snippet display?',
            code: ['const pet = "Cat";', 'console.log(pet);'],
            options: ['Cat', 'pet', '"pet"'],
            answer: 0,
            explanation: 'Without quotes around `pet`, `console.log(pet)` prints what is stored inside `pet`: `Cat`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Updating & Using Variables',
        subtitle: 'Change let variables and print stored values cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Updating What Is Inside a Variable',
            explanation:
              'Once a `let` variable exists, you can update it without writing `let` again. Remember: `console.log(score)` prints the number (`15`), while `console.log("score")` prints the literal word `score`.',
            code: ['let score = 10;', 'score = score + 5;', 'console.log(score);'],
            output: '15',
            highlightNote: 'If you try updating a `const` variable, JavaScript gives an error — use `let` when values change!',
          },
          {
            type: 'token_builder',
            prompt: 'Add `5` to `score` and save the new value back into `score`.',
            codeLines: ['let score = 10;', 'score = {{0}} {{1}} 5;'],
            expectedTokens: ['score', '+'],
            distractors: ['let', '==', '10'],
            explanation: 'JavaScript adds `score + 5` (`15`) and updates `score`.',
            syntaxHint: 'No `let` is needed when updating an existing variable.',
          },
          {
            type: 'token_builder',
            prompt: 'Update `coins` to `30` and print its value cleanly.',
            codeLines: ['let coins = 10;', '{{0}} = 30;', 'console.log({{1}});'],
            expectedTokens: ['coins', 'coins'],
            distractors: ['let', '"coins"', 'coin'],
            explanation: '`coins = 30;` updates the variable, and `console.log(coins)` outputs `30`.',
            syntaxHint: 'Omit quotes on `coins` when passing it to `console.log()`.',
            output: '30',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that prints the literal word "coins" instead of 50.',
            lines: [
              'let coins = 50;',
              'console.log("coins");',
            ],
            bugLine: 1,
            fixed: 'console.log(coins);',
            explanation: 'Quotes around `"coins"` make JavaScript print the word instead of reading the variable.',
          },
          {
            type: 'predict_output',
            prompt: 'What number prints at the end?',
            code: ['let xp = 10;', 'xp = xp + 5;', 'console.log(xp);'],
            options: ['15', '10', '10 + 5'],
            answer: 0,
            explanation: '`xp` starts at `10`, adds `5` to become `15`, and prints `15`.',
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
            prompt: 'Create changeable `level = 12`, add `1`, and log it.',
            codeLines: ['{{0}} level = 12;', 'level = level + 1;', '{{1}}.log(level);'],
            expectedTokens: ['let', 'console'],
            distractors: ['const', 'print', 'var'],
            explanation: 'Use `let` so `level` can increase, then log via `console.log`.',
            syntaxHint: '`const level = 12` cannot be reassigned later!',
            output: '13',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the line missing quotes around `"Ready"`.',
            lines: [
              'const name = "Mia";',
              'console.log(name);',
              'console.log(Ready);',
            ],
            bugLine: 2,
            fixed: 'console.log("Ready");',
            explanation: 'Wrap `Ready` in quotes `"Ready"` so JavaScript treats it as text.',
          },
          {
            type: 'predict_output',
            prompt: 'What is logged after updating `x`?',
            code: ['let x = 4;', 'x = x + 3;', 'console.log(x);'],
            options: ['7', '4', '43'],
            answer: 0,
            explanation: '`4 + 3` calculates `7`, which replaces `4` inside `x`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Numbers vs. Text',
        subtitle: 'Tell math numbers apart from quoted text strings',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Numbers Do Math, Quotes Hold Words',
            explanation:
              'Numbers like `10` or `3.5` have NO quotes and add normally (`10 + 5` is `15`). Strings inside `" "` are text, so `"10" + "5"` glues the text together into `"105"`!',
            code: ['console.log(10 + 5);', 'console.log("10" + "5");'],
            output: ['15', '105'],
            highlightNote: 'You can separate items with commas inside `console.log("Score:", 10)`!',
          },
          {
            type: 'token_builder',
            prompt: 'Store numeric `age` (no quotes) and text `word` (with quotes).',
            codeLines: ['const age = {{0}};', 'const word = {{1}};'],
            expectedTokens: ['18', '"Hi"'],
            distractors: ['"18"', 'Hi', 'let'],
            explanation: 'Numbers don’t use quotes (`18`); words use quotes (`"Hi"`).',
            syntaxHint: 'Check which value should wear quotes `" "`!',
          },
          {
            type: 'token_builder',
            prompt: 'Add `price` and `tax` cleanly and print `total`.',
            codeLines: ['const price = 20, tax = 4;', 'const total = price {{0}} tax;', '{{1}}.log(total);'],
            expectedTokens: ['+', 'console'],
            distractors: [',', 'print', '='],
            explanation: 'Adding two numbers with `+` calculates `24`, displayed with `console.log`.',
            syntaxHint: 'Add numbers with `+` and output with `console.log`.',
            output: '24',
          },
          {
            type: 'token_builder',
            prompt: 'Log `"Stars:"` followed by the variable `stars`.',
            codeLines: ['const stars = 3;', 'console.log("Stars:"{{0}} {{1}});'],
            expectedTokens: [',', 'stars'],
            distractors: ['"stars"', 'print', ';'],
            explanation: 'A comma in `console.log("Stars:", stars)` prints both separated by a space.',
            syntaxHint: 'Separate arguments with `,` and pass `stars` without quotes.',
            output: 'Stars: 3',
          },
          {
            type: 'predict_output',
            prompt: 'What does glueing two text strings `"4"` + `"2"` output?',
            code: ['console.log("4" + "2");'],
            options: ['42', '6', '"4" + "2"'],
            answer: 0,
            explanation: 'Since `"4"` and `"2"` are inside quotes, `+` joins text into `42` rather than `6`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss Challenge',
        subtitle: 'Put printing, variables, updates, and numbers & text together',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Unit 1 Recap',
            explanation:
              'Great start! You now know how to print with `console.log()`, store values with `const` and `let`, update numbers, and print labels alongside numbers.',
            code: ['const hero = "Tarek";', 'let xp = 20;', 'xp = xp + 5;', 'console.log(hero, xp);'],
            output: 'Tarek 25',
          },
          {
            type: 'token_builder',
            prompt: 'Create changeable `xp = 50`, add `25`, and print it.',
            codeLines: ['{{0}} xp = 50;', 'xp = xp {{1}} 25;', 'console.log({{2}});'],
            expectedTokens: ['let', '+', 'xp'],
            distractors: ['const', '"xp"', '=='],
            explanation: 'Start with `let` so `xp` can increase to `75`, then log `xp`.',
            syntaxHint: '`const` blocks updating `xp`, and `console.log(xp)` needs no quotes.',
            output: '75',
          },
          {
            type: 'token_builder',
            prompt: 'Print `"Rank:"` and variable `rank` on one clean line.',
            codeLines: ['const rank = 1;', '{{0}}.log("Rank:"{{1}} rank);'],
            expectedTokens: ['console', ','],
            distractors: ['print', 'let', ';'],
            explanation: '`console.log("Rank:", rank)` puts a clean space between text and numbers.',
            syntaxHint: 'Use `console.log` and separate items with a comma `,`.',
            output: 'Rank: 1',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line trying to reassign a locked `const` variable.',
            lines: [
              'const gems = 10;',
              'gems = gems + 10;',
              'console.log(gems);',
            ],
            bugLine: 1,
            fixed: 'let gems = 10; // use let on line 1 so gems can change',
            explanation: 'Variables created with `const` cannot change later; use `let` when a value updates.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this final Unit 1 challenge print?',
            code: ['let gems = 5;', 'gems = gems + 10;', 'console.log("Gems:", gems);'],
            options: ['Gems: 15', 'Gems: 5', 'Gems: gems'],
            answer: 0,
            explanation: '`gems` changes from `5` to `15`, and `console.log("Gems:", gems)` shows `Gems: 15`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Control Flow & Arrow Functions (5 nodes)
  // =========================================================================
  {
    title: 'Control Flow & Arrow Functions',
    subtitle: 'Write concise arrow callbacks, ternaries, and default parameters.',
    conceptGraphicType: 'js_arrows',
    guidebook: {
      summary:
        'Arrow functions (`(x) => expr`) are JavaScript’s concise syntax for callbacks and pure helpers. Unlike traditional `function` declarations, arrows bind `this` lexically from the outer scope and support single-expression implicit returns alongside ternaries and default parameters.',
      mentalModel:
        'Right after `=>`, JavaScript checks the very first character: if it is `{`, it parses a multi-line statement block requiring `return`; anything else is treated as an expression returned automatically.',
      keyTakeaways: [
        'Omit `{}` and `return` for clean 1-line expressions: `const sq = n => n * n;`.',
        'Wrap object literals in `(...)` on implicit returns (`id => ({ id })`), or `{` opens a code block!',
        'Use ternary expressions (`cond ? a : b`) for crisp value selection inside JSX or expressions.',
        'Closures let inner arrow functions capture and remember variables from their enclosing scope even after it returns.',
      ],
      keySyntax: [
        {
          title: 'Implicit Returns & Default Parameters',
          tag: 'ARROW FN',
          code: 'const boost = (xp, mult = 2) => xp * mult;\nconst makeTag = id => ({ id, ok: true });\nconsole.log(boost(15), makeTag(7).ok);',
          output: '30 true',
          explanation:
            'Default args evaluate whenever callers pass `undefined` or omit the argument, and `({ ... })` safely returns an object literal.',
          notes: [
            'Zero parameters require empty parentheses: `() => 42`.',
          ],
        },
        {
          title: 'Ternary Expressions & Early Guards',
          tag: 'BRANCHING',
          code: 'const getRank = xp => (xp >= 100 ? "PRO" : "DEV");\nconst describe = score => {\n  if (score < 0) return "Invalid";\n  return getRank(score);\n};\nconsole.log(describe(140));',
          output: 'PRO',
          explanation:
            'Use ternary `? :` when picking between two values, and switch to early `return` guards for multi-step logic.',
          notes: [
            'Avoid nesting 3+ ternaries — switch to clean early-return `if` blocks.',
          ],
        },
        {
          title: 'Lexical Closures Preserving State',
          tag: 'CLOSURE',
          code: 'const makeCounter = (step = 1) => {\n  let total = 0;\n  return () => (total += step);\n};\nconst inc = makeCounter(5);\nconsole.log(inc(), inc());',
          output: '5 10',
          explanation:
            'The returned arrow remembers its own private `total` variable across future calls.',
          notes: [
            'React hooks and event handlers rely heavily on closures capturing render state.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Returning Undefined from Arrow Object Literal',
          buggyCode: 'const toUser = name => { name }; // Returns undefined!',
          fixedCode: 'const toUser = name => ({ name });',
          reason:
            'Without surrounding parentheses, JS interprets `{ name }` as a function block with a label and zero `return` statement.',
        },
        {
          title: 'Forgetting return Inside Multi-Line `{}` Arrows',
          buggyCode: 'const nums = [1, 2, 3].map(n => {\n  n * 10;\n});',
          fixedCode: 'const nums = [1, 2, 3].map(n => {\n  return n * 10;\n});',
          reason:
            'Adding curly braces turns off implicit return. Either write `return` explicitly or remove the `{}` braces.',
        },
      ],
      proTip:
        'Remember: `function fn()` declarations are hoisted (callable before their line), whereas `const fn = () => {}` bindings stay uninitialized until their declaration executes.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Arrow Functions (`=>`)',
        subtitle: 'Master implicit single-line returns vs explicit braces',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Concise Arrow Syntax',
            explanation:
              'Arrow functions replace verbose `function(x) { return ... }` expressions with `(x) => ...`. When `{}` braces are omitted, the single expression returns implicitly.',
            code: ['const sq = n => n * n;', 'const sum = (a, b) => a + b;'],
          },
          {
            type: 'token_builder',
            prompt: 'Write a single-line arrow returning `n * 3`.',
            codeLines: ['const triple = n {{0}} n * 3;'],
            expectedTokens: ['=>'],
            distractors: ['->', '=', ':'],
            explanation: 'JavaScript fat-arrow syntax is strictly `=>`.',
            syntaxHint: 'Thin `->` belongs to C++/Rust, not JavaScript.',
          },
          {
            type: 'token_builder',
            prompt: 'Wrap returned object literal cleanly so `{` is not parsed as a block.',
            codeLines: ['const makeUser = name => {{0}}{ name, xp: 0 }{{1}};'],
            expectedTokens: ['(', ')'],
            distractors: ['{', '}', '['],
            explanation: 'Wrapping `({ name, xp: 0 })` disambiguates an object expression from a function block.',
            syntaxHint: 'Without `(...)`, `name => { name }` fails or returns `undefined`!',
          },
          {
            type: 'token_builder',
            prompt: 'Include explicit `return` inside a braced multi-line arrow.',
            codeLines: ['const tag = ({{0}}) => {', '    if (xp > 50) {{1}} "A";', '    return "B";', '};'],
            expectedTokens: ['xp', 'return'],
            distractors: ['yield', 'const', '->'],
            explanation: 'Inside `{ ... }`, JavaScript arrows never auto-return — add `return`.',
            syntaxHint: 'Omitting `return` inside `{}` silently returns `undefined`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `getSum(3, 4)` returns `undefined`.',
            lines: [
              'const getSum = (a, b) => {',
              '    a + b;',
              '};',
              'console.log(getSum(3, 4));',
            ],
            bugLine: 1,
            fixed: '    return a + b;',
            explanation: 'Because braces `{}` were opened, `a + b;` without `return` returns `undefined`!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Ternary, Switch & Loops',
        subtitle: 'Iterate arrays cleanly with `for...of` vs `for...in`',
        exercises: [
          {
            type: 'theory_bite',
            title: '`for...of` for Values vs `for...in`',
            explanation:
              'Never iterate JS arrays with `for...in` — it loops over string index keys (`"0"`, `"1"`)! Always use `for (const item of arr)` to iterate actual element values cleanly.',
            code: ['for (const score of [10, 20]) {', '    total += score;', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Loop over actual array elements (`10, 20, 30`).',
            codeLines: ['const list = [10, 20, 30];', 'for (const v {{0}} list) {', '    sum += v;', '}'],
            expectedTokens: ['of'],
            distractors: ['in', 'from', ':'],
            explanation: '`for (const v of list)` iterates values (`10, 20, 30`), unlike `in` which gives keys `"0", "1"`.',
            syntaxHint: 'Classic JS Bug Blitz trap: `for...in` iterates array indices as strings!',
          },
          {
            type: 'token_builder',
            prompt: 'Write concise conditional ternary expression.',
            codeLines: ['const label = lives > 0 {{0}} "Alive" {{1}} "Empty";'],
            expectedTokens: ['?', ':'],
            distractors: ['if', 'else', '??'],
            explanation: '`cond ? a : b` cleanly chooses between two values.',
            syntaxHint: 'Do not confuse `?:` ternary with `??` nullish coalescing.',
          },
          {
            type: 'token_builder',
            prompt: 'Break cleanly out of `switch` cases with strict match.',
            codeLines: ['switch (lang) {', '  case "go": speed = 10; {{0}};', '  {{1}}: speed = 5;', '}'],
            expectedTokens: ['break', 'default'],
            distractors: ['continue', 'else', 'stop'],
            explanation: 'JS `switch` uses strict `===` comparison and requires `break;` per case.',
            syntaxHint: 'Add `default:` to handle unmatched values cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What subtle bug does `for...in` cause here?',
            code: ['let out = "";', 'for (const x in [10, 20]) out += x;', 'console.log(out);'],
            options: ['01', '1020', '30'],
            answer: 0,
            explanation: '`for...in` yields array property indices `"0"` and `"1"`, concatenating `"01"` instead of values!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Control & Arrows',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Iterate values via `for...of` and pass through arrow helper.',
            codeLines: [
              'const double = x {{0}} x * 2;',
              'for (const n {{1}} [1, 2]) console.log(double(n));',
            ],
            expectedTokens: ['=>', 'of'],
            distractors: ['->', 'in', ':'],
            explanation: 'Arrow uses `=>` and value array iteration uses `for ... of`.',
            syntaxHint: 'Both `->` and `for...in` are incorrect here.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the object-return syntax trap in an arrow function.',
            lines: [
              'const toBadge = (id) => { id: id, ok: true };',
              'console.log(toBadge(1));',
            ],
            bugLine: 0,
            fixed: 'const toBadge = (id) => ({ id, ok: true });',
            explanation: 'Without `({ ... })`, `{ id: id }` is treated as a labeled statement inside a block returning `undefined` (or syntax error)!',
          },
          {
            type: 'predict_output',
            prompt: 'What does `fn(5)` evaluate to with default params?',
            code: ['const fn = (a, b = 2) => a ** b;', 'console.log(fn(5));'],
            options: ['25', '10', 'NaN'],
            answer: 0,
            explanation: 'Default `b = 2` turns `5 ** 2` into `25`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Closures & Default Args',
        subtitle: 'Build stateful closures and fallback default parameters',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Lexical Closures & Defaults',
            explanation:
              'An inner function returned from an outer function keeps live access to outer variables via closure. Parameter defaults (`mult = 1`) apply cleanly whenever the caller passes `undefined`.',
            code: ['const makeCounter = (n = 0) => () => ++n;'],
          },
          {
            type: 'token_builder',
            prompt: 'Define an arrow helper with default bonus `10`.',
            codeLines: ['const grantXp = (xp, bonus {{0}} 10) {{1}} xp + bonus;'],
            expectedTokens: ['=', '=>'],
            distractors: [':', '->', '??'],
            explanation: 'Default parameters bind with `=`, and implicit return uses `=>`.',
            syntaxHint: 'Default arguments in JS signatures use `=`.',
          },
          {
            type: 'token_builder',
            prompt: 'Return a counter closure capturing `count`.',
            codeLines: ['function makeStep(count = 0) {', '    {{0}} () {{1}} ++count;', '}'],
            expectedTokens: ['return', '=>'],
            distractors: ['yield', '->', 'const'],
            explanation: 'Returning `() => ++count` preserves private state per counter instance.',
            syntaxHint: 'Prefix `++count` increments before returning the updated value.',
          },
          {
            type: 'token_builder',
            prompt: 'Collect arbitrary numbers using rest parameter `...nums`.',
            codeLines: ['const sumAll = ({{0}}nums) => nums.reduce((a, b) => a + b, 0);'],
            expectedTokens: ['...'],
            distractors: ['*', '&', '**'],
            explanation: 'Rest syntax `...nums` collects trailing arguments into a real Array.',
            syntaxHint: 'Python uses `*nums`; JavaScript uses three dots `...nums`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does calling the closure twice print?',
            code: [
              'const make = (x = 1) => () => x++;',
              'const next = make();',
              'console.log(next(), next());',
            ],
            options: ['1 2', '2 3', '1 1'],
            answer: 0,
            explanation: 'Post-increment `x++` returns `1` first, updates closure `x` to `2`, then returns `2`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss Challenge',
        subtitle: 'Combine rest params, closures, and `for...of` safely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Functional JS Cleanups',
            explanation:
              'Pair `for...of`, strict `switch`, rest `...args`, and implicit/braced arrows cleanly with zero accidental `undefined` returns.',
            code: ['const sum = (...xs) => { let t = 0; for (const x of xs) t += x; return t; };'],
          },
          {
            type: 'token_builder',
            prompt: 'Iterate rest arguments with `for...of` and return total.',
            codeLines: [
              'const addAll = ({{0}}vals) => {',
              '    let sum = 0;',
              '    for (const v {{1}} vals) sum += v;',
              '    {{2}} sum;',
              '};',
            ],
            expectedTokens: ['...', 'of', 'return'],
            distractors: ['*', 'in', 'yield'],
            explanation: 'Combine rest `...vals`, `for...of`, and explicit `return` inside `{}`.',
            syntaxHint: 'Remember `return sum;` inside braced arrow bodies.',
          },
          {
            type: 'token_builder',
            prompt: 'Build concise factory returning an object literal.',
            codeLines: ['const makeStat = (xp = 0) {{0}} {{1}}{ xp, active: true }{{2}};'],
            expectedTokens: ['=>', '(', ')'],
            distractors: ['->', '{', '}'],
            explanation: 'Parentheses around `{ ... }` allow concise object returns in arrows.',
            syntaxHint: 'Always wrap `({...})` when returning an object implicitly.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the loop bug iterating indices as strings instead of numbers.',
            lines: [
              'const nums = [5, 10, 15];',
              'let sum = 0;',
              'for (const n in nums) sum += n;',
              'console.log(sum);',
            ],
            bugLine: 2,
            fixed: 'for (const n of nums) sum += n;',
            explanation: '`for...in` sets `n` to `"0"`, `"1"`, `"2"` (turning `sum` into `"0012"`!). Use `for...of`.',
          },
          {
            type: 'predict_output',
            prompt: 'What happens passing `undefined` vs `0` to default arg?',
            code: ['const f = (n = 10) => n;', 'console.log(f(undefined), f(0));'],
            options: ['10 0', '10 10', 'undefined 0'],
            answer: 0,
            explanation: 'Default parameters trigger on `undefined` (`10`) while preserving `0`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Objects & Destructuring (5 nodes)
  // =========================================================================
  {
    title: 'Objects & Destructuring',
    subtitle: 'Extract nested fields cleanly and copy objects immutably with `...`.',
    conceptGraphicType: 'js_objects',
    guidebook: {
      summary:
        'JavaScript objects (`{}`) store key-value properties cleanly, and destructuring unpacks multiple fields into local variables in one line. Combine spread syntax (`...`) and optional chaining (`?.`) for safe, immutable state updates.',
      mentalModel:
        'Spreading `{ ...prev, hearts: 4 }` builds a brand-new shallow object copying properties left-to-right — later keys win. That means `{ hearts: 4, ...prev }` gets overwritten by `prev.hearts`!',
      keyTakeaways: [
        'Use property shorthand `{ name, xp }` whenever your variable matches the object key name.',
        'Provide safe fallback defaults directly while destructuring: `const { rank = "Novice" } = user;`.',
        'Access deep optional paths safely with `user?.profile?.avatar ?? "default.png"` instead of crashing `TypeError`.',
        'Keep state updates immutable (`{ ...user, xp: user.xp + 10 }`) so React detects reference changes cleanly.',
      ],
      keySyntax: [
        {
          title: 'Destructuring, Renaming & Fallbacks',
          tag: 'DESTRUCTURE',
          code: 'const profile = { name: "Ada", xp: 400 };\nconst { name: user, xp, tier = "Gold" } = profile;\nconsole.log(`${user} (${tier}): ${xp}`);',
          output: 'Ada (Gold): 400',
          explanation:
            'Rename extracted fields via `key: localVar` and assign defaults using `=`, all in one statement.',
          notes: [
            'Array destructuring unpacks by position: `const [first, ...rest] = items;`.',
          ],
        },
        {
          title: 'Immutable Object Spread & Override Order',
          tag: 'IMMUTABLE',
          code: 'const state = { hearts: 5, gems: 30 };\nconst next = { ...state, hearts: state.hearts - 1 };\nconsole.log(state.hearts, next.hearts);',
          output: '5 4',
          explanation:
            'Placing `...state` first copies existing keys, then `hearts: ...` cleanly overwrites just that field.',
          notes: [
            'Spread performs a shallow clone: update nested objects explicitly (`nested: { ...state.nested, k: v }`).',
          ],
        },
        {
          title: 'Optional Chaining (`?.`) Guard',
          tag: 'NULL SAFETY',
          code: 'const res = { user: null };\nconst handle = res?.user?.handle ?? "@guest";\nconsole.log(handle);',
          output: '@guest',
          explanation:
            '`?.` short-circuits immediately to `undefined` if any intermediate step is `null` or `undefined`.',
          notes: [
            'Works on methods and arrays too: `fn?.()`, `list?.[0]`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Putting ...spread AFTER the Override Key',
          buggyCode: 'const updated = { xp: 999, ...user }; // Overwritten!',
          fixedCode: 'const updated = { ...user, xp: 999 };',
          reason:
            'Keys evaluated later replace earlier keys. Always spread `...user` FIRST, then specify changed fields after.',
        },
        {
          title: 'Mutating Shared State Objects Directly',
          buggyCode: 'function loseHeart(s) {\n  s.hearts -= 1; // Mutates original!\n  return s;\n}',
          fixedCode: 'function loseHeart(s) {\n  return { ...s, hearts: s.hearts - 1 };\n}',
          reason:
            'Mutating `s` breaks React re-render checks because the object reference stayed identical.',
        },
      ],
      proTip:
        'Pick out sensitive keys cleanly using rest destructuring: `const { password, ...publicUser } = account;` creates a safe object omitting `password`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Object Shorthand & Destructuring',
        subtitle: 'Unpack properties cleanly with default values and aliases',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Shorthand & Destructuring Extraction',
            explanation:
              'When variable name matches object key, `{ xp }` is shorthand for `{ xp: xp }`. Reading objects back uses `const { xp, rank = 1 } = user` to extract and supply fallbacks at once.',
            code: ['const name = "Tarek";', 'const dev = { name, streak: 5 };', 'const { streak } = dev;'],
          },
          {
            type: 'token_builder',
            prompt: 'Extract `xp` and fallback `league = "Obsidian"` in one line.',
            codeLines: ['const {{0}} xp, league {{1}} "Obsidian" {{2}} = profile;'],
            expectedTokens: ['{', '=', '}'],
            distractors: ['[', ':', '=>'],
            explanation: 'Object destructuring wraps keys in `{ ... }` and assigns defaults with `=`.',
            syntaxHint: 'Notice `=` gives a fallback value inside `{ league = "Obsidian" }`, whereas `:` renames the variable!',
          },
          {
            type: 'token_builder',
            prompt: 'Rename `id` to `userId` while destructuring.',
            codeLines: ['const user = { id: 7, role: "pro" };', 'const { id{{0}} userId } = {{1}};'],
            expectedTokens: [':', 'user'],
            distractors: ['=', 'as', 'this'],
            explanation: 'Use colon `key: localVarName` when renaming during destructuring.',
            syntaxHint: '`id: userId` binds value of `user.id` into variable `userId`.',
          },
          {
            type: 'token_builder',
            prompt: 'Read array positions 0 and 1 cleanly via array destructuring.',
            codeLines: ['const pair = ["Python", 95];', 'const {{0}}lang, pct{{1}} = pair;'],
            expectedTokens: ['[', ']'],
            distractors: ['{', '}', '('],
            explanation: 'Array destructuring matches elements by index position inside `[ ... ]`.',
            syntaxHint: 'Objects match by property name (`{}`), arrays match by index (`[]`).',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `name` turns out `undefined` with array brackets on an object.',
            lines: [
              'const dev = { name: "Ada", xp: 400 };',
              'const [name] = dev;',
              'console.log(name);',
            ],
            bugLine: 1,
            fixed: 'const { name } = dev;',
            explanation: '`dev` is a plain object (not iterable); destructuring objects must use curly braces `{ name }`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Spread Operator & Immutability',
        subtitle: 'Clone objects safely and apply clean overrides',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Immutable Updates with `...`',
            explanation:
              'Never mutate shared state directly in React/Zustand stores. Spread existing fields (`{ ...prev, updated: true }`) into a new object reference so UI subscriptions detect the update cleanly.',
            code: ['const prev = { xp: 100, gems: 10 };', 'const next = { ...prev, xp: 125 };'],
          },
          {
            type: 'token_builder',
            prompt: 'Clone `user` immutably while bumping `xp` to `200`.',
            codeLines: ['const updated = { {{0}}user, xp: 200 };'],
            expectedTokens: ['...'],
            distractors: ['*', '&', 'spread'],
            explanation: 'Spread syntax `...user` copies enumerable own keys into the new object.',
            syntaxHint: 'Place `...user` BEFORE `xp: 200` so `200` wins!',
          },
          {
            type: 'token_builder',
            prompt: 'Extract `id` separately and group remaining props into `rest`.',
            codeLines: ['const { id, {{0}}rest } = payload;'],
            expectedTokens: ['...'],
            distractors: ['*', 'remaining', '&&'],
            explanation: 'Rest destructuring collects leftover properties into a fresh `rest` object.',
            syntaxHint: 'Rest `...rest` must always be the last property in `{ ... }`.',
          },
          {
            type: 'token_builder',
            prompt: 'Combine two arrays immutably into a new list.',
            codeLines: ['const a = [1, 2];', 'const b = [{{0}}a, 3, 4];'],
            expectedTokens: ['...'],
            distractors: ['*', 'push', 'concat'],
            explanation: '`[...a, 3, 4]` creates `[1, 2, 3, 4]` without mutating `a`.',
            syntaxHint: 'Notice `push` mutates in place; `[...a, item]` stays immutable.',
          },
          {
            type: 'predict_output',
            prompt: 'Watch the order of spread! What is `next.xp`?',
            code: ['const prev = { xp: 100 };', 'const next = { xp: 999, ...prev };', 'console.log(next.xp);'],
            options: ['100', '999', 'SyntaxError'],
            answer: 0,
            explanation: 'Because `...prev` came AFTER `xp: 999`, `prev.xp` (`100`) overwrote `999`!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Objects',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Destructure `hearts` cleanly and create an immutable healed state.',
            codeLines: [
              'const { hearts } = state;',
              'const healed = { {{0}}state, hearts: hearts {{1}} 2 };',
            ],
            expectedTokens: ['...', '+'],
            distractors: ['*', '-', '&&'],
            explanation: 'Spread `...state` first, then override `hearts: hearts + 2`.',
            syntaxHint: 'Override key must come after `...state`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the spread ordering bug that wipes out the updated flag.',
            lines: [
              'const cfg = { dark: false, sound: true };',
              'const nextCfg = { dark: true, ...cfg };',
              'console.log(nextCfg.dark);',
            ],
            bugLine: 1,
            fixed: 'const nextCfg = { ...cfg, dark: true };',
            explanation: 'Spreading `...cfg` last resets `dark` back to `false`!',
          },
          {
            type: 'predict_output',
            prompt: 'What does nested default destructuring print?',
            code: ['const u = { name: "Zo" };', 'const { xp = 50, name: handle } = u;', 'console.log(handle, xp);'],
            options: ['Zo 50', 'undefined 50', 'ReferenceError'],
            answer: 0,
            explanation: '`name: handle` renames to `handle` (`"Zo"`), while absent `xp` uses default `50`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Object.entries & Iteration',
        subtitle: 'Inspect keys, values, and dynamic computed keys cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Inspecting Objects with `Object.entries()`',
            explanation:
              'Plain objects don’t work directly with `for...of`. Use `Object.entries(obj)` (which returns `[[key, val], ...]`), `Object.keys(obj)`, or dynamic bracket keys `{ [key]: val }`.',
            code: ['for (const [lang, pct] of Object.entries(map)) {', '    console.log(lang, pct);', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Iterate both key and value cleanly with `Object.entries`.',
            codeLines: ['for (const [k, v] {{0}} Object.{{1}}(stats)) {', '    console.log(k, v);', '}'],
            expectedTokens: ['of', 'entries'],
            distractors: ['in', 'items', 'pairs'],
            explanation: '`Object.entries()` returns an array of `[key, val]` tuples ready for `for...of`.',
            syntaxHint: 'Python uses `.items()`; JavaScript uses `Object.entries(obj)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Use computed property key syntax `[lang]` cleanly.',
            codeLines: ['const lang = "go";', 'const patch = { {{0}}lang{{1}}: 100 };'],
            expectedTokens: ['[', ']'],
            distractors: ['$', '{', '('],
            explanation: 'Wrapping a variable key in `[lang]` sets property `"go": 100` instead of literal `"lang"`.',
            syntaxHint: 'Without `[...]`, `{ lang: 100 }` sets literal key `"lang"`.',
          },
          {
            type: 'token_builder',
            prompt: 'Count own properties on `scores` safely via `Object.keys`.',
            codeLines: ['const count = Object.{{0}}(scores).{{1}};'],
            expectedTokens: ['keys', 'length'],
            distractors: ['size', 'len', 'entries()'],
            explanation: '`Object.keys(scores)` returns a key array whose count is `.length`.',
            syntaxHint: 'Plain objects lack a `.length` or `.size` property directly.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed for computed keys?',
            code: ['const k = "xp";', 'const obj = { [k]: 40 };', 'console.log(obj.xp, obj.k);'],
            options: ['40 undefined', 'undefined 40', '40 40'],
            answer: 0,
            explanation: '`[k]` evaluates to key `"xp"`, so `obj.xp === 40` and `obj.k === undefined`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss Challenge',
        subtitle: 'Master destructuring, rest spread, and Object.entries',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: State Updates',
            explanation:
              'Immutable state updates pair computed keys `[key]`, object spread `{ ...prev }`, and clean parameter destructuring.',
            code: ['const setNode = (done, lang, id) => ({ ...done, [lang]: [...done[lang], id] });'],
          },
          {
            type: 'token_builder',
            prompt: 'Update nested `python` array immutably inside state object.',
            codeLines: [
              'const nextNodes = {',
              '    {{0}}done,',
              '    python: [{{1}}done.python, "py-3"],',
              '};',
            ],
            expectedTokens: ['...', '...'],
            distractors: ['*', '&', 'push'],
            explanation: 'Spread outer `done` object AND inner `done.python` array to preserve immutability.',
            syntaxHint: 'Mutating nested arrays breaks shallow state equality checks!',
          },
          {
            type: 'token_builder',
            prompt: 'Destructure incoming parameter directly inside arrow signature.',
            codeLines: ['const greet = ({{0}} name, xp = 0 {{1}}) => `${name}: ${xp}`;'],
            expectedTokens: ['{', '}'],
            distractors: ['[', ']', '('],
            explanation: 'Destructuring object arguments directly in parameter signatures keeps callers clean.',
            syntaxHint: 'Always wrap destructured params in `{ ... }` inside `(...)`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why looping directly over a plain object throws TypeError.',
            lines: [
              'const ranks = { python: 1, go: 2 };',
              'for (const [k, v] of ranks) {',
              '    console.log(k, v);',
              '}',
            ],
            bugLine: 1,
            fixed: 'for (const [k, v] of Object.entries(ranks)) {',
            explanation: 'Plain objects are not iterable with `for...of`; wrap in `Object.entries(ranks)`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['const a = { x: 1, y: 2 };', 'const { x, ...rest } = a;', 'console.log(Object.keys(rest).length);'],
            options: ['1', '2', '0'],
            answer: 0,
            explanation: 'Rest pattern leaves `{ y: 2 }` inside `rest`, which has `1` key.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Array Methods (.map, .filter) (5 nodes)
  // =========================================================================
  {
    title: 'Array Methods (.map, .filter)',
    subtitle: 'Transform, filter, and reduce arrays cleanly without mutation.',
    conceptGraphicType: 'js_arrays',
    guidebook: {
      summary:
        'Modern JavaScript processes arrays declaratively through chained immutable methods: `.filter()` keeps matches, `.map()` transforms elements 1-to-1, `.find()` returns the first hit, and `.reduce()` folds everything into one summary.',
      mentalModel:
        '`.map()` and `.filter()` NEVER mutate the source array — they build and return a fresh array. Watch out for `.sort()` and `.reverse()`, which silently mutate in place unless you clone first (`[...arr].sort()`).',
      keyTakeaways: [
        'Use `.map()` for 1-to-1 transforms (output length === input length) and `.filter()` to keep matching items.',
        'Use `.find()` / `.some()` / `.every()` for searches — `.find()` stops immediately on the first match!',
        'Always pass `(a, b) => a - b` to `.sort()` for numbers; bare `.sort()` converts numbers to strings (`"10"` < `"2"`).',
        'Clone before sorting or reversing (`[...items].sort(...)`) so original UI state stays untouched.',
      ],
      keySyntax: [
        {
          title: 'Chained .filter() + .map() Pipeline',
          tag: 'PIPELINE',
          code: 'const devs = [\n  { name: "Kai", xp: 640 },\n  { name: "Sam", xp: 180 },\n];\nconst pros = devs.filter(d => d.xp >= 500).map(d => d.name);\nconsole.log(pros);',
          output: '["Kai"]',
          explanation:
            'Pipelines read clearly top-to-bottom without allocating intermediate placeholder loops.',
          notes: [
            '`.some(d => d.xp > 500)` checks existence cleanly in boolean `true`/`false`.',
          ],
        },
        {
          title: 'Non-Mutating Numeric .sort()',
          tag: 'SORTING',
          code: 'const nums = [10, 2, 30];\nconst asc = [...nums].sort((a, b) => a - b);\nconsole.log("orig:", nums, "sorted:", asc);',
          output: 'orig: [10, 2, 30] sorted: [2, 10, 30]',
          explanation:
            '`[...nums]` creates a fresh shallow array copy so `.sort()` leaves `nums` untouched, while `a - b` orders numerically.',
          notes: [
            'In ES2023+, `.toSorted((a, b) => a - b)` also returns a sorted copy directly.',
          ],
        },
        {
          title: 'Aggregating Totals via .reduce()',
          tag: 'REDUCE',
          code: 'const scores = [25, 40, 35];\nconst total = scores.reduce((acc, cur) => acc + cur, 0);\nconsole.log(total);',
          output: '100',
          explanation:
            '`.reduce(fn, initial)` carries an accumulator across every element — ideal for sums, totals, and index maps.',
          notes: [
            'Always pass the initial value (`0`, `{}` or `[]`) as the 2nd argument so empty arrays never throw!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Bare .sort() on Numbers (Lexicographic Bug)',
          buggyCode: 'const nums = [10, 2, 5];\nnums.sort(); // [10, 2, 5] because "1" < "2"!',
          fixedCode: 'const sorted = [...nums].sort((a, b) => a - b);',
          reason:
            'Default `.sort()` coerces elements to UTF-16 strings! Always supply a numeric comparator `(a, b) => a - b`.',
        },
        {
          title: 'Missing return in Braced Predicate',
          buggyCode: 'const pos = [-1, 4].filter(n => { n > 0 }); // []!',
          fixedCode: 'const pos = [-1, 4].filter(n => n > 0); // [4]',
          reason:
            'Braces without `return` yield `undefined` (falsy), causing `.filter()` to drop every single item.',
        },
      ],
      proTip:
        'Use `new Set(arr)` + spread `[...new Set(arr)]` to deduplicate primitive arrays in O(n) cleanly instead of nested `.filter()` + `.indexOf()`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: '.map() & .filter()',
        subtitle: 'Transform and filter lists into fresh arrays cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Immutable Data Transformations',
            explanation:
              '`.map(fn)` transforms every item 1-to-1 into a same-length array, while `.filter(pred)` keeps items where `pred` returns truthy. Neither mutates the original list.',
            code: ['const nums = [1, 2, 3, 4];', 'const evens = nums.filter(n => n % 2 === 0);  // [2, 4]'],
          },
          {
            type: 'token_builder',
            prompt: 'Double every value in `xp` using `.map()`.',
            codeLines: ['const boosted = xp.{{0}}(v {{1}} v * 2);'],
            expectedTokens: ['map', '=>'],
            distractors: ['filter', 'forEach', '->'],
            explanation: '`.map()` returns a brand new array; `.forEach()` always returns `undefined`!',
            syntaxHint: 'Never use `.forEach()` when you want a transformed array back.',
          },
          {
            type: 'token_builder',
            prompt: 'Keep only completed units (`done === true`).',
            codeLines: ['const finished = units.{{0}}(u => u.done {{1}} true);'],
            expectedTokens: ['filter', '==='],
            distractors: ['map', 'find', '=='],
            explanation: '`.filter()` keeps every matching element, while `.find()` stops at the first.',
            syntaxHint: 'Use `.filter()` for multiple items, `.find()` for one item.',
          },
          {
            type: 'token_builder',
            prompt: 'Chain `.filter` and `.map` to get active handles.',
            codeLines: ['const active = users', '    .{{0}}(u => u.online)', '    .{{1}}(u => u.handle);'],
            expectedTokens: ['filter', 'map'],
            distractors: ['reduce', 'find', 'forEach'],
            explanation: 'Filter active objects first, then project onto `.handle` strings.',
            syntaxHint: 'Filtering before mapping avoids projecting discarded entries.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `doubled` is `undefined` instead of `[2, 4, 6]`.',
            lines: [
              'const nums = [1, 2, 3];',
              'const doubled = nums.forEach(n => n * 2);',
              'console.log(doubled);',
            ],
            bugLine: 1,
            fixed: 'const doubled = nums.map(n => n * 2);',
            explanation: '`.forEach()` ignores callback return values and always returns `undefined`. Use `.map()`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: '.find(), .some() & .every()',
        subtitle: 'Query single items and boolean array checks cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Short-Circuit Query Methods',
            explanation:
              '`.find(pred)` returns the first matching item (or `undefined`). Use `.some(pred)` when you only need a `boolean` check whether at least one element matches, avoiding wasted allocation.',
            code: ['const hasAdmin = roles.some(r => r === "admin");', 'const target = nodes.find(n => n.id === id);'],
          },
          {
            type: 'token_builder',
            prompt: 'Locate the single user matching `id === 42`.',
            codeLines: ['const match = devs.{{0}}(d => d.id === 42);'],
            expectedTokens: ['find'],
            distractors: ['filter', 'some', 'includes'],
            explanation: '`.find()` returns the object directly (or `undefined`), not a 1-element array.',
            syntaxHint: '`.filter()` returns `[match]`, whereas `.find()` returns `match`.',
          },
          {
            type: 'token_builder',
            prompt: 'Verify if ANY test failed vs ALL tests passed.',
            codeLines: ['const anyFail = tests.{{0}}(t => !t.ok);', 'const allOk = tests.{{1}}(t => t.ok);'],
            expectedTokens: ['some', 'every'],
            distractors: ['any', 'all', 'find'],
            explanation: 'JS names boolean quantifiers `.some()` (exists) and `.every()` (forall).',
            syntaxHint: 'Python uses `any()`/`all()`, whereas JS Arrays use `.some()`/`.every()`.',
          },
          {
            type: 'token_builder',
            prompt: 'Check string/primitive membership concisely with `.includes()`.',
            codeLines: ['const unlocked = ["py", "go"];', 'if (unlocked.{{0}}("go")) {', '    console.log("Ready");', '}'],
            expectedTokens: ['includes'],
            distractors: ['contains', 'has', 'in'],
            explanation: 'JS arrays check membership using `.includes(value)`.',
            syntaxHint: 'Arrays use `.includes()`, whereas `Set` / `Map` use `.has()`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `[].every(x => x > 0)` return?',
            code: ['console.log([].every(x => x > 0), [].some(x => x > 0));'],
            options: ['true false', 'false false', 'true true'],
            answer: 0,
            explanation: 'Vacuous truth: `.every()` returns `true` on empty arrays, while `.some()` returns `false`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Array Pipelines',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Sort numeric array non-destructively from lowest to highest.',
            codeLines: ['const asc = [{{0}}nums].{{1}}((a, b) => a {{2}} b);'],
            expectedTokens: ['...', 'sort', '-'],
            distractors: ['*', 'order', '+'],
            explanation: 'Clone with `[...nums]` first because `.sort()` mutates in place; `a - b` sorts ascending!',
            syntaxHint: 'Never call `nums.sort()` without a comparator on numbers (`10` sorts before `2`!).',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the silent JavaScript lexicographic number-sort bug.',
            lines: [
              'const scores = [5, 20, 100, 9];',
              'const ranked = [...scores].sort();',
              'console.log(ranked[0]);',
            ],
            bugLine: 1,
            fixed: 'const ranked = [...scores].sort((a, b) => a - b);',
            explanation: 'Without comparator `(a, b) => a - b`, `.sort()` compares UTF-16 strings (`"100" < "20" < "5"`).',
          },
          {
            type: 'predict_output',
            prompt: 'What does `filter` return when `{}` omits `return`?',
            code: ['const res = [1, 2, 3].filter(n => { n > 1; });', 'console.log(res.length);'],
            options: ['0', '2', '3'],
            answer: 0,
            explanation: 'Curly braces `{}` return `undefined` (falsy), so `.filter()` drops every item (`length === 0`)!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: '.reduce() & Flattening',
        subtitle: 'Aggregate sums, lookup maps, and nested lists cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Accumulating with `.reduce()` & `.flatMap()`',
            explanation:
              '`.reduce((acc, cur) => ..., initialValue)` folds an array down to a single sum or lookup dictionary. Always pass an explicit `initialValue` (`0` or `{}`) so empty arrays never throw!',
            code: ['const sum = xpList.reduce((acc, x) => acc + x, 0);'],
          },
          {
            type: 'token_builder',
            prompt: 'Sum all scores starting safely from initial `0`.',
            codeLines: ['const sum = scores.{{0}}((acc, n) => acc + n, {{1}});'],
            expectedTokens: ['reduce', '0'],
            distractors: ['fold', 'map', '1'],
            explanation: 'Initial accumulator `0` guarantees `[]` evaluates cleanly to `0` instead of crashing.',
            syntaxHint: 'Always pass the 2nd argument initial value to `.reduce()`.',
          },
          {
            type: 'token_builder',
            prompt: 'Map each unit and flatten nested nodes in one pass.',
            codeLines: ['const allNodes = units.{{0}}(u => u.nodes);'],
            expectedTokens: ['flatMap'],
            distractors: ['map', 'flat', 'flatten'],
            explanation: '`.flatMap()` replaces `.map(...).flat()` cleanly in one allocation.',
            syntaxHint: '`.map()` alone would leave a nested 2D array `[[n1, n2], [n3]]`.',
          },
          {
            type: 'token_builder',
            prompt: 'Deduplicate array elements concisely with `Set` + spread.',
            codeLines: ['const unique = [{{0}}new {{1}}(tags)];'],
            expectedTokens: ['...', 'Set'],
            distractors: ['*', 'set', 'Array'],
            explanation: '`[...new Set(arr)]` turns any iterable set back into a unique array.',
            syntaxHint: 'Note capitalization of built-in `Set` in JavaScript.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `.reduce()` produce on an empty array with initial `10`?',
            code: ['const res = [].reduce((a, b) => a + b, 10);', 'console.log(res);'],
            options: ['10', '0', 'TypeError'],
            answer: 0,
            explanation: 'With `0` iterations, `.reduce()` immediately returns initial accumulator `10`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss Challenge',
        subtitle: 'Ship clean functional data pipelines with zero mutations',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Array Discipline',
            explanation:
              'Never mutate props/store arrays with `.sort()` directly, always pass initial value to `.reduce()`, and avoid missing `return` inside `{}` callbacks.',
            code: ['const total = items.filter(i => i.ok).reduce((a, i) => a + i.xp, 0);'],
          },
          {
            type: 'token_builder',
            prompt: 'Sum XP only for unlocked items without mutating `list`.',
            codeLines: [
              'const total = list',
              '    .{{0}}(item => !item.locked)',
              '    .{{1}}((sum, item) => sum + item.xp, 0);',
            ],
            expectedTokens: ['filter', 'reduce'],
            distractors: ['find', 'map', 'forEach'],
            explanation: '`.filter()` keeps unlocked entries before `.reduce(..., 0)` aggregates XP.',
            syntaxHint: 'Pair `.filter` + `.reduce` cleanly with initial `0`.',
          },
          {
            type: 'token_builder',
            prompt: 'Clone and sort highest XP first cleanly.',
            codeLines: ['const desc = [{{0}}users].{{1}}((a, b) => b.xp - a.xp);'],
            expectedTokens: ['...', 'sort'],
            distractors: ['*', 'orderBy', 'find'],
            explanation: '`b.xp - a.xp` sorts descending while `[...users]` avoids mutating `users`.',
            syntaxHint: '`a - b` is ascending; `b - a` is descending.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the `.reduce()` bug that crashes when `arr` is empty.',
            lines: [
              'const getSum = (arr) => {',
              '    return arr.reduce((a, b) => a + b);',
              '};',
              'console.log(getSum([]));',
            ],
            bugLine: 1,
            fixed: '    return arr.reduce((a, b) => a + b, 0);',
            explanation: 'Calling `.reduce()` without an initial value throws `TypeError` on `[]`!',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: [
              'const a = [1, 2, 3];',
              'console.log(a.filter(x => x > 1).map(x => x * 10).length);',
            ],
            options: ['2', '3', '30'],
            answer: 0,
            explanation: 'Filtering `> 1` yields `[2, 3]`; mapping produces `[20, 30]` with `.length === 2`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Async / Await & Promises (5 nodes)
  // =========================================================================
  {
    title: 'Async / Await & Promises',
    subtitle: 'Coordinate asynchronous fetches cleanly with `try/catch` and `Promise.all`.',
    conceptGraphicType: 'js_async',
    guidebook: {
      summary:
        'JavaScript runs on a single UI thread via an Event Loop, returning `Promise` handles for slow I/O instead of freezing execution. `async`/`await` lets asynchronous sequences read like clean top-to-bottom synchronous code with `try/catch` error handling.',
      mentalModel:
        'Calling an `async` function ALWAYS returns a `Promise` wrapping its return value. `await` yields control back to the Event Loop while waiting for that Promise to settle, keeping scrolling and animations 60fps smooth.',
      keyTakeaways: [
        'Handle errors safely by wrapping `await` calls inside `try { ... } catch (err) { ... }`.',
        'Avoid sequential "waterfall" waits (`await a(); await b();`) when tasks are independent — fire them in parallel with `Promise.all()`.',
        'Use `Promise.allSettled([...])` when one failed sub-request shouldn’t abort the rest.',
        'Remember that `forEach(async x => ...)` does NOT wait — use a `for...of` loop or `Promise.all(arr.map(...))`.',
      ],
      keySyntax: [
        {
          title: 'Safe Async / Await with try/catch',
          tag: 'ASYNC / AWAIT',
          code: 'async function loadScore(id) {\n  try {\n    const data = await Promise.resolve({ xp: 220 });\n    return data.xp;\n  } catch (err) {\n    return 0;\n  }\n}\nloadScore(1).then(v => console.log(v));',
          output: '220',
          explanation:
            '`try/catch` intercepts rejected promises just like synchronous exceptions, keeping fallback handling simple.',
          notes: [
            'Use a `finally { setLoading(false); }` block to clean up spinners regardless of success or failure.',
          ],
        },
        {
          title: 'Parallel Execution with Promise.all()',
          tag: 'CONCURRENCY',
          code: 'async function loadDashboard() {\n  const [xp, rank] = await Promise.all([\n    Promise.resolve(480),\n    Promise.resolve("#3"),\n  ]);\n  console.log(xp, rank);\n}\nloadDashboard();',
          output: '480 #3',
          explanation:
            'Starts both async tasks simultaneously and resolves once both succeed, slashing total wait latency in half.',
          notes: [
            'Array destructuring unpacks results in the exact order promises were passed in (not finish order!).',
          ],
        },
        {
          title: 'Promise States & .then()/.catch() Chains',
          tag: 'PROMISES',
          code: 'Promise.reject("Offline")\n  .catch(err => ({ fallback: true, err }))\n  .then(res => console.log(res.fallback));',
          output: 'true',
          explanation:
            'A Promise starts `pending` and settles once into either `fulfilled` or `rejected` — recovering via `.catch()` feeds the next `.then()`.',
          notes: [
            'Always convert HTTP `fetch()` errors manually (`if (!res.ok) throw new Error(...)`) because `404`/`500` responses still resolve.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Sequential Waterfall Slowdown',
          buggyCode: 'const a = await fetchUser();\nconst b = await fetchRanks(); // Waits 2x longer!',
          fixedCode: 'const [a, b] = await Promise.all([\n  fetchUser(),\n  fetchRanks(),\n]);',
          reason:
            'If `fetchRanks()` doesn’t depend on `fetchUser()`, awaiting them one-by-one doubles total network time.',
        },
        {
          title: 'Using await Inside Array.forEach()',
          buggyCode: 'ids.forEach(async id => await syncItem(id));\nconsole.log("Done!"); // Prints BEFORE sync finishes!',
          fixedCode: 'await Promise.all(ids.map(id => syncItem(id)));\nconsole.log("Done!");',
          reason:
            '`.forEach()` discards returned Promises immediately. Map items into promises and await `Promise.all()`, or loop with `for (const id of ids)`.',
        },
      ],
      proTip:
        'In React `useEffect`, use an inner `async function run()` paired with an `isMounted` flag or `AbortController` so stale network responses never overwrite unmounted state.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Promises & `.then()`',
        subtitle: 'Understand pending, fulfilled, and rejected Promise states',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Asynchronous Future Values (`Promise`)',
            explanation:
              'Network requests don’t block JavaScript’s single UI thread; they immediately return a `Promise`. Chain `.then(val => ...)` for success and `.catch(err => ...)` for rejections.',
            code: ['fetchProfile()', '  .then(p => console.log(p.xp))', '  .catch(err => console.warn(err));'],
          },
          {
            type: 'token_builder',
            prompt: 'Handle Promise rejection safely at the end of a chain.',
            codeLines: ['loadScore()', '    .then(xp => save(xp))', '    .{{0}}(err => console.error(err));'],
            expectedTokens: ['catch'],
            distractors: ['error', 'except', 'fail'],
            explanation: 'Promises handle rejection paths via `.catch(err => ...)`.',
            syntaxHint: '`.finally()` runs on both outcomes, whereas `.catch()` handles rejections.',
          },
          {
            type: 'token_builder',
            prompt: 'Create an immediately resolved Promise returning `42`.',
            codeLines: ['const ready = Promise.{{0}}(42);'],
            expectedTokens: ['resolve'],
            distractors: ['create', 'done', 'ok'],
            explanation: '`Promise.resolve(val)` wraps any immediate value in a fulfilled Promise.',
            syntaxHint: 'Mirror helper for immediate failure is `Promise.reject(err)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Run cleanup logic regardless of success or failure.',
            codeLines: ['setLoading(true);', 'syncCloud().{{0}}(() => setLoading(false));'],
            expectedTokens: ['finally'],
            distractors: ['always', 'done', 'after'],
            explanation: '`.finally()` runs whether the Promise resolved or rejected — ideal for clearing loaders!',
            syntaxHint: 'Avoid duplicating `setLoading(false)` in both `.then` and `.catch`.',
          },
          {
            type: 'predict_output',
            prompt: 'Notice JS microtask order! What logs first?',
            code: ['Promise.resolve("B").then(console.log);', 'console.log("A");'],
            options: ['A then B', 'B then A', 'Only A'],
            answer: 0,
            explanation: 'Promise `.then()` runs asynchronously on the microtask queue AFTER synchronous `"A"` finishes.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'async / await & try/catch',
        subtitle: 'Write linear async control flow without callback nesting',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Pause Locally with `await`',
            explanation:
              'You can only use `await` inside an `async` function. If an awaited Promise rejects, `await` throws that error cleanly into the surrounding `try / catch` block.',
            code: ['async function sync() {', '  try { return await api.save(); } catch (e) { return null; }', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Mark the arrow handler `async` so `await` is valid inside.',
            codeLines: ['const fetchXp = {{0}} () => {', '    const res = {{1}} api.getXp();', '    return res;', '};'],
            expectedTokens: ['async', 'await'],
            distractors: ['await', 'defer', 'yield'],
            explanation: 'Signature takes `async` before `() =>`, and body pauses on `await`.',
            syntaxHint: 'Putting `async` after `() =>` is a syntax error!',
          },
          {
            type: 'token_builder',
            prompt: 'Guard network errors cleanly with `try / catch`.',
            codeLines: ['async function sync() {', '    {{0}} {', '        return await upload();', '    } {{1}} (err) {', '        return { synced: false };', '    }', '}'],
            expectedTokens: ['try', 'catch'],
            distractors: ['attempt', 'except', 'rescue'],
            explanation: '`try / catch` catches both synchronous throws and rejected `await`ed Promises.',
            syntaxHint: 'Python uses `except`; JavaScript always uses `catch`.',
          },
          {
            type: 'token_builder',
            prompt: 'Don’t drop the Promise! Await `loadData()` before reading `.xp`.',
            codeLines: ['async function show() {', '    const profile = {{0}} loadData();', '    console.log(profile.xp);', '}'],
            expectedTokens: ['await'],
            distractors: ['async', 'resolve', 'then'],
            explanation: 'Without `await`, `profile` is a `Promise` object (`profile.xp === undefined`)!',
            syntaxHint: 'Every `async` function returns a Promise — remember `await` at call sites.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `await` fails to parse in this helper.',
            lines: [
              'function getLeaderboard() {',
              '    const rows = await fetchRows();',
              '    return rows;',
              '}',
            ],
            bugLine: 0,
            fixed: 'async function getLeaderboard() {',
            explanation: 'Using `await` inside a synchronous `function` throws a SyntaxError; add `async`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Async Flow',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Launch two independent async tasks simultaneously in parallel.',
            codeLines: [
              'const load = {{0}} () => {',
              '    const [user, board] = {{1}} Promise.{{2}}([getUser(), getBoard()]);',
              '    return { user, board };',
              '};',
            ],
            expectedTokens: ['async', 'await', 'all'],
            distractors: ['defer', 'race', 'sync'],
            explanation: '`await Promise.all([...])` runs tasks concurrently instead of sequentially.',
            syntaxHint: '`Promise.race` resolves when ONLY the first promise settles!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `items.map(async id => ...)` yields pending Promises.',
            lines: [
              'async function loadAll(ids) {',
              '    const res = ids.map(async id => fetchUser(id));',
              '    return res;',
              '}',
            ],
            bugLine: 1,
            fixed: '    const res = await Promise.all(ids.map(id => fetchUser(id)));',
            explanation: '`.map(async ...)` creates an array of unresolved Promises unless wrapped in `await Promise.all(...)`!',
          },
          {
            type: 'predict_output',
            prompt: 'What does an `async` function ALWAYS return?',
            code: ['async function val() { return 7; }', 'console.log(val() instanceof Promise);'],
            options: ['true', 'false', '7'],
            answer: 0,
            explanation: 'Even returning literal `7` inside an `async` function wraps it inside a `Promise` (`true`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Concurrency: Promise.all & allSettled',
        subtitle: 'Eliminate sequential waterfalls and handle partial failures',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Fast Parallelism without Silent Crashes',
            explanation:
              'Sequential `await a(); await b();` waits twice as long. `Promise.all([a(), b()])` halves latency, while `Promise.allSettled([...])` keeps going even if one optional request fails.',
            code: ['const results = await Promise.allSettled([pingA(), pingB()]);'],
          },
          {
            type: 'token_builder',
            prompt: 'Run all fetches concurrently and keep partial results if one fails.',
            codeLines: ['const outcomes = await Promise.{{0}}([syncA(), syncB()]);'],
            expectedTokens: ['allSettled'],
            distractors: ['all', 'race', 'any'],
            explanation: '`Promise.allSettled` never short-circuits on a single rejection.',
            syntaxHint: '`Promise.all` rejects completely if even one item fails.',
          },
          {
            type: 'token_builder',
            prompt: 'Filter successful settled outcomes safely.',
            codeLines: ['const ok = outcomes.{{0}}(o => o.status {{1}} "fulfilled");'],
            expectedTokens: ['filter', '==='],
            distractors: ['map', '==', 'find'],
            explanation: 'Each item from `allSettled` has `status: "fulfilled" | "rejected"`.',
            syntaxHint: 'Check `o.status === "fulfilled"` before reading `o.value`.',
          },
          {
            type: 'token_builder',
            prompt: 'Wrap a callback timer `setTimeout` in a clean Promise.',
            codeLines: ['const sleep = ms => new {{0}}(r => setTimeout(r, ms));'],
            expectedTokens: ['Promise'],
            distractors: ['Async', 'Task', 'Future'],
            explanation: '`new Promise(resolve => setTimeout(resolve, ms))` powers `await sleep(300)`.',
            syntaxHint: 'JavaScript uses `new Promise(...)` rather than `Future` or `Task`.',
          },
          {
            type: 'predict_output',
            prompt: 'Which finishes earlier on 50ms + 50ms tasks?',
            code: [
              '// Mode A: await p1(); await p2(); -> ~100ms',
              '// Mode B: await Promise.all([p1(), p2()]);',
              'console.log("B wins speed");',
            ],
            options: ['~50ms parallel (B wins speed)', '~100ms sequential', 'Depends on alphabetical order'],
            answer: 0,
            explanation: '`Promise.all` kicks off both promises concurrently (`max(50, 50) ≈ 50ms`).',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'JS Mastery Boss',
        subtitle: 'Architect resilient async/await cloud sync pipelines',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Final Boss: Resilient Cloud Sync',
            explanation:
              'Complete the JavaScript track by handling Promise errors via `try/catch`, launching concurrent queries with `Promise.all`, and never leaking unawaited Promises.',
            code: ['const [p, lb] = await Promise.all([syncProfile(), fetchBoard()]);'],
          },
          {
            type: 'token_builder',
            prompt: 'Fetch cloud data inside `try/catch` and return safe fallback.',
            codeLines: [
              'const syncSafe = {{0}} () => {',
              '    try {',
              '        return {{1}} api.upload();',
              '    } {{2}} (err) {',
              '        return { ok: false };',
              '    }',
              '};',
            ],
            expectedTokens: ['async', 'await', 'catch'],
            distractors: ['defer', 'except', 'resolve'],
            explanation: 'Wrap awaited calls with `try/catch` inside `async () =>`.',
            syntaxHint: 'Always `await` inside `try` — returning an unawaited Promise skips the `catch` block!',
          },
          {
            type: 'token_builder',
            prompt: 'Parallelize independent profile and leaderboard calls.',
            codeLines: ['const [me, board] = await Promise.{{0}}([getMe(), getBoard()]);'],
            expectedTokens: ['all'],
            distractors: ['race', 'sync', 'map'],
            explanation: '`Promise.all([p1, p2])` returns tuple `[me, board]` once both fulfill.',
            syntaxHint: 'Do not confuse `Promise.all` with `Promise.race`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the bug that skips the `try/catch` block completely!',
            lines: [
              'async function save() {',
              '    try {',
              '        return uploadToCloud();',
              '    } catch (e) {',
              '        return false;',
              '    }',
              '}',
            ],
            bugLine: 2,
            fixed: '        return await uploadToCloud();',
            explanation: 'Returning a rejected Promise WITHOUT `await` bypasses the `catch` block (`return await` is needed inside `try/catch`!).',
          },
          {
            type: 'predict_output',
            prompt: 'What does `await Promise.all([1, 2, Promise.resolve(3)])` log?',
            code: ['Promise.all([1, 2, Promise.resolve(3)]).then(v => console.log(v.length));'],
            options: ['3', '1', 'TypeError'],
            answer: 0,
            explanation: '`Promise.all` promotes primitives (`1, 2`) cleanly, returning `[1, 2, 3]` (`.length === 3`).',
          },
        ],
      },
    ],
  },
];
