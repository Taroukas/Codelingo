import type { UnitSeed } from './types';

export const PYTHON_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: First Steps in Python (6 nodes)
  // =========================================================================
  {
    title: 'First Steps in Python',
    subtitle: 'Display messages, store values in variables, and do simple math.',
    conceptGraphicType: 'variables',
    guidebook: {
      summary:
        'Python executes line-by-line from top to bottom. Use `print()` to send text or values to stdout, bind names to objects with `=`, and format values seamlessly inside f-strings like `f"{name}"`.',
      mentalModel:
        'In Python, a variable is a name tag stuck onto an object in memory — not a rigid fixed-type slot. Reassigning `score = score + 5` evaluates the right side first (`15`), then moves the label `score` to the new `int` object.',
      keyTakeaways: [
        'Wrap text literals in matching quotes `"..."` or `\'...\'` — bare words look up variable names.',
        'Python binds types dynamically at runtime (`int`, `float`, `str`, `bool`); inspect anytime with `type(x)`.',
        'Division `/` always produces a `float` (`10 / 2 == 5.0`); use `//` for whole integer division (`10 // 3 == 3`).',
        'Use f-strings (`f"HP: {hp}"`) instead of `+` concatenation when mixing strings and numbers.',
      ],
      keySyntax: [
        {
          title: 'Formatted Output & f-Strings',
          tag: 'STDOUT',
          code: 'player = "Maya"\nxp = 240\nprint(f"{player} earned {xp + 10} XP")',
          output: 'Maya earned 250 XP',
          explanation:
            'Prefixing a string with `f` lets Python evaluate any expression inside `{...}` directly at runtime.',
          notes: [
            '`print()` separates comma-passed arguments with spaces automatically.',
            'Expressions like `{xp + 10}` run before converting the result to text.',
          ],
        },
        {
          title: 'Dynamic Variables & Rebinding',
          tag: 'MEMORY',
          code: 'combo = 1\ncombo += 2\ntier = "Silver"\nprint(combo, type(tier).__name__)',
          output: '3 str',
          explanation:
            'Augmented assignment `+=` adds to the current value cleanly, while `type(...)` reveals an object’s runtime type.',
          notes: [
            '`combo += 2` is shorthand for `combo = combo + 2`.',
            'Snake case (`high_score`, `max_hp`) is the standard Python naming style.',
          ],
        },
        {
          title: 'Integer vs Float Division & Modulo',
          tag: 'ARITHMETIC',
          code: 'a, b = 17, 5\nprint(a / b, a // b, a % b)',
          output: '3.4 3 2',
          explanation:
            'Use `/` for exact decimal division, `//` to drop the remainder toward negative infinity, and `%` for remainder checks.',
          notes: [
            '`n % 2 == 0` is the classic idiom for testing even numbers.',
            'Tuple unpacking `a, b = 17, 5` binds multiple values on a single line.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Concatenating str + int Directly',
          buggyCode: 'xp = 50\nprint("XP: " + xp)',
          fixedCode: 'xp = 50\nprint(f"XP: {xp}")',
          reason:
            'Python refuses implicit string-number addition and raises `TypeError`. Use an f-string or `str(xp)` instead.',
        },
        {
          title: 'Quoting a Variable Name',
          buggyCode: 'score = 95\nprint("score")',
          fixedCode: 'score = 95\nprint(score)',
          reason:
            'Quotes turn `score` into plain text (`"score"`). Omit quotes when you want the stored value (`95`).',
        },
      ],
      proTip:
        'Inspect both a label and its live value while debugging using `print(f"{score=}")` — Python 3.8+ prints `score=95` automatically!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Saying Hello',
        subtitle: 'Display words and messages on screen with print()',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Your First Python Command',
            explanation:
              'The `print()` command tells Python to display a message on the screen. Wrap words in quotes `" "` so Python treats them as text.',
            code: ['print("Hello, World!")'],
            output: 'Hello, World!',
            highlightNote: 'Quotes mark text — Python displays what is inside the quotes.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the command to show `"Hello!"` on screen.',
            codeLines: ['{{0}}("Hello!")'],
            expectedTokens: ['print'],
            distractors: ['show', 'write', 'echo'],
            explanation: 'In Python, displaying output always uses `print(...)`.',
            syntaxHint: 'Python uses `print()`, not `show()` or `echo()`.',
            output: 'Hello!',
          },
          {
            type: 'token_builder',
            prompt: 'Print a friendly welcome message with quotes around the text.',
            codeLines: ['{{0}}({{1}})'],
            expectedTokens: ['print', '"Welcome!"'],
            distractors: ['say', 'Welcome', 'display'],
            explanation: 'Put `"Welcome!"` inside quotes so Python prints the text cleanly.',
            syntaxHint: 'Remember to wrap text in quotes `"..."` inside `print()`.',
            output: 'Welcome!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that is missing quotes around the word.',
            lines: [
              'print("Starting...")',
              'print(Hello)',
              'print("Done!")',
            ],
            bugLine: 1,
            fixed: 'print("Hello")',
            explanation: 'Without quotes, Python looks for a variable named `Hello` instead of printing the word.',
          },
          {
            type: 'predict_output',
            prompt: 'What will appear on screen?',
            code: ['print("CodeLingo")'],
            options: ['CodeLingo', '"CodeLingo"', 'print'],
            answer: 0,
            explanation: '`print()` displays the characters inside the quotes without showing the quotes themselves.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Creating Variables',
        subtitle: 'Save text and numbers inside labeled boxes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Variables Are Labeled Boxes',
            explanation:
              'A variable is like a labeled box that stores a value in memory. Use `=` to give a name on the left to a value on the right.',
            code: ['name = "Tarek"', 'score = 10', 'print(name)'],
            output: 'Tarek',
            highlightNote: 'Variable names never use quotes (`name`, not `"name"`).',
          },
          {
            type: 'token_builder',
            prompt: 'Store the name `"Ada"` inside a variable called `player`.',
            codeLines: ['player {{0}} "Ada"'],
            expectedTokens: ['='],
            distractors: [':', '==', '->'],
            explanation: 'A single `=` puts the value on the right into the variable on the left.',
            syntaxHint: 'Use a single `=` to save a value into a variable.',
          },
          {
            type: 'token_builder',
            prompt: 'Save the number `25` in `points`, then print it.',
            codeLines: ['points {{0}} 25', '{{1}}(points)'],
            expectedTokens: ['=', 'print'],
            distractors: ['let', 'show', '=='],
            explanation: 'First save `25` into `points` with `=`, then pass `points` to `print()`.',
            syntaxHint: 'Python creates variables with `=` directly — no `let` keyword needed.',
            output: '25',
          },
          {
            type: 'token_builder',
            prompt: 'Create a `city` variable storing `"Paris"` and display it.',
            codeLines: ['{{0}} = "Paris"', 'print({{1}})'],
            expectedTokens: ['city', 'city'],
            distractors: ['"city"', 'var', 'town'],
            explanation: 'Pass the variable name `city` (without quotes!) to `print()`.',
            syntaxHint: 'Keep the exact same variable name `city` on both lines.',
            output: 'Paris',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Python snippet display?',
            code: ['pet = "Cat"', 'print(pet)'],
            options: ['Cat', 'pet', '"pet"'],
            answer: 0,
            explanation: 'Because `pet` has no quotes inside `print(pet)`, Python prints what is stored in `pet`: `Cat`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Updating & Using Variables',
        subtitle: 'Change stored values and combine variables cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Changing What Is Inside a Box',
            explanation:
              'You can replace or add to a variable later. Notice the difference: `print(score)` shows the number inside `score`, while `print("score")` shows the literal word `score`.',
            code: ['score = 10', 'score = score + 5', 'print(score)'],
            output: '15',
            highlightNote: 'Python reads `score + 5` first (`15`), then stores it back into `score`.',
          },
          {
            type: 'token_builder',
            prompt: 'Add `5` to `score` and save the new value back into `score`.',
            codeLines: ['score = 10', 'score = {{0}} {{1}} 5'],
            expectedTokens: ['score', '+'],
            distractors: ['10', '=', 'and'],
            explanation: '`score = score + 5` takes the old score (`10`), adds `5`, and saves `15`.',
            syntaxHint: 'Use the current variable `score` plus `5`.',
          },
          {
            type: 'token_builder',
            prompt: 'Update `coins` to `30`, then print the value stored in `coins`.',
            codeLines: ['coins = 10', '{{0}} = 30', 'print({{1}})'],
            expectedTokens: ['coins', 'coins'],
            distractors: ['"coins"', 'new', 'coin'],
            explanation: 'Reassigning `coins = 30` replaces `10` with `30`, and `print(coins)` displays `30`.',
            syntaxHint: 'Do not put quotes around `coins` when printing its value!',
            output: '30',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that prints the word "score" instead of the number 50.',
            lines: [
              'score = 50',
              'print("score")',
            ],
            bugLine: 1,
            fixed: 'print(score)',
            explanation: 'Adding quotes around `"score"` turns it into literal text instead of reading the variable.',
          },
          {
            type: 'predict_output',
            prompt: 'What number prints at the end?',
            code: ['coins = 10', 'coins = coins + 5', 'print(coins)'],
            options: ['15', '10', '10 + 5'],
            answer: 0,
            explanation: '`coins` starts at `10`, adds `5` to become `15`, and `print(coins)` outputs `15`.',
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
            prompt: 'Store `12` in `level`, add `1`, and print the result.',
            codeLines: ['level {{0}} 12', 'level = level + 1', '{{1}}(level)'],
            expectedTokens: ['=', 'print'],
            distractors: ['==', 'show', 'let'],
            explanation: 'Assign with `=` and display output with `print()`.',
            syntaxHint: 'Remember both `=` and `print()`.',
            output: '13',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the line that forgets quotes around the message text.',
            lines: [
              'name = "Mia"',
              'print(name)',
              'print(Ready)',
            ],
            bugLine: 2,
            fixed: 'print("Ready")',
            explanation: 'The word `Ready` needs quotes `"Ready"` so Python knows it is text.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed after updating `x`?',
            code: ['x = 4', 'x = x + 3', 'print(x)'],
            options: ['7', '4', '43'],
            answer: 0,
            explanation: '`4 + 3` calculates `7`, which replaces the old value inside `x`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Numbers vs. Text',
        subtitle: 'Tell math numbers apart from quoted text cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Numbers Do Math, Quotes Hold Words',
            explanation:
              'Numbers like `10` or `3.5` have NO quotes and can be added like normal math (`10 + 5` is `15`). Putting `" "` around digits makes them text (`"10"` + `"5"` glues the text into `"105"`!).',
            code: ['print(10 + 5)', 'print("10" + "5")'],
            output: ['15', '105'],
            highlightNote: 'Use commas inside `print("Age:", 18)` to print text and numbers together!',
          },
          {
            type: 'token_builder',
            prompt: 'Store an integer `age` (no quotes) and text `word` (with quotes).',
            codeLines: ['age = {{0}}', 'word = {{1}}'],
            expectedTokens: ['18', '"Hi"'],
            distractors: ['"18"', 'Hi', 'num'],
            explanation: 'Numbers like `18` do not wear quotes; words like `"Hi"` always wear quotes.',
            syntaxHint: 'Check which value needs `" "` quotes!',
          },
          {
            type: 'token_builder',
            prompt: 'Add `price` and `tax` together cleanly and display `total`.',
            codeLines: ['price = 20', 'tax = 4', 'total = price {{0}} tax', '{{1}}(total)'],
            expectedTokens: ['+', 'print'],
            distractors: [',', 'show', '='],
            explanation: 'Both `price` and `tax` are numbers, so `+` adds them to `24`.',
            syntaxHint: 'Add numbers using `+` and show `total` with `print()`.',
            output: '24',
          },
          {
            type: 'token_builder',
            prompt: 'Print a text label and a number side by side using a comma.',
            codeLines: ['stars = 3', 'print("Stars:"{{0}} {{1}})'],
            expectedTokens: [',', 'stars'],
            distractors: ['+', '"stars"', ';'],
            explanation: 'A comma inside `print()` puts a clean space between `"Stars:"` and `stars`.',
            syntaxHint: 'Separate items in `print(...)` with `,` — not `+`.',
            output: 'Stars: 3',
          },
          {
            type: 'predict_output',
            prompt: 'What does glueing two text strings `"4"` + `"2"` print?',
            code: ['print("4" + "2")'],
            options: ['42', '6', '"4" + "2"'],
            answer: 0,
            explanation: 'Because `"4"` and `"2"` have quotes, they are text! `+` joins text into `42`, not `6`.',
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
              'Great progress! You know how to print messages with `print()`, save values in variables using `=`, update values with math, and combine text labels with numbers using commas.',
            code: ['hero = "Tarek"', 'xp = 20', 'xp = xp + 5', 'print(hero, xp)'],
            output: 'Tarek 25',
          },
          {
            type: 'token_builder',
            prompt: 'Create `xp` starting at `50`, add `25`, and print it.',
            codeLines: ['xp {{0}} 50', 'xp = xp {{1}} 25', 'print({{2}})'],
            expectedTokens: ['=', '+', 'xp'],
            distractors: ['"xp"', '==', 'let'],
            explanation: '`xp = 50` creates the variable, `+ 25` updates it to `75`, and `print(xp)` displays `75`.',
            syntaxHint: 'Assign with `=`, add with `+`, and print `xp` without quotes.',
            output: '75',
          },
          {
            type: 'token_builder',
            prompt: 'Print the label `"Rank:"` followed by variable `rank`.',
            codeLines: ['rank = 1', '{{0}}("Rank:"{{1}} rank)'],
            expectedTokens: ['print', ','],
            distractors: ['echo', '+', ';'],
            explanation: 'Use `print()` with `,` to display text next to a number safely.',
            syntaxHint: 'Commas separate different values inside `print()`.',
            output: 'Rank: 1',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that prints the literal word instead of the updated value.',
            lines: [
              'score = 10',
              'score = score + 10',
              'print("score")',
            ],
            bugLine: 2,
            fixed: 'print(score)',
            explanation: 'Remove quotes around `score` so Python prints `20` instead of the word `"score"`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this final Unit 1 challenge print?',
            code: ['gems = 5', 'gems = gems + 10', 'print("Gems:", gems)'],
            options: ['Gems: 15', 'Gems: 5', 'Gems: gems'],
            answer: 0,
            explanation: '`gems` updates from `5` to `15`, and `print("Gems:", gems)` displays `Gems: 15`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Control Flow & Loops (5 nodes)
  // =========================================================================
  {
    title: 'Control Flow & Loops',
    subtitle: 'Branch with if/elif/else and iterate cleanly over ranges.',
    conceptGraphicType: 'control_flow',
    guidebook: {
      summary:
        'Python defines code blocks strictly through 4-space indentation instead of curly braces `{}`. Combined with natural-English `and`/`or`/`not` logic and `for`/`while` loops, control flow reads almost like pseudocode.',
      mentalModel:
        'In `if/elif/else` chains, Python evaluates conditions top-to-bottom and executes ONLY the first branch that evaluates to `True`, skipping everything below it.',
      keyTakeaways: [
        'Every `if`, `elif`, `else`, `for`, and `while` header must end with a colon `:`.',
        'Never mix tabs and spaces — stick to `4 spaces` per indentation level to avoid `IndentationError`.',
        'Empty values (`0`, `""`, `[]`, `None`) evaluate to `False` ("falsy") inside boolean checks.',
        '`range(start, stop, step)` starts at `start` (default `0`) and stops right BEFORE `stop`.',
      ],
      keySyntax: [
        {
          title: 'Chained Branches & Guard Clauses',
          tag: 'BRANCHING',
          code: 'hp = 24\nif hp <= 0:\n    state = "KO"\nelif hp < 30:\n    state = "critical"\nelse:\n    state = "ready"\nprint(state)',
          output: 'critical',
          explanation:
            'Use `elif` (never `else if`) so mutually exclusive conditions run cleanly without deep nesting.',
          notes: [
            'Python even supports math-style chained comparisons: `10 <= hp <= 50`.',
            'Use `and`, `or`, `not` instead of C-style `&&`, `||`, `!`.',
          ],
        },
        {
          title: 'Range Iteration & Step Control',
          tag: 'FOR LOOP',
          code: 'total = 0\nfor n in range(2, 9, 2):\n    total += n\nprint(total)',
          output: '20',
          explanation:
            '`range(2, 9, 2)` yields `2, 4, 6, 8` lazily without allocating a list in memory.',
          notes: [
            'Count down cleanly with a negative step: `range(5, 0, -1)`.',
            'Need index + value? Write `for idx, val in enumerate(items):`.',
          ],
        },
        {
          title: 'While Loop with Break & Continue',
          tag: 'WHILE LOOP',
          code: 'tries = 0\nwhile tries < 4:\n    tries += 1\n    if tries == 2:\n        continue\n    print(tries, end=" ")',
          output: '1 3 4 ',
          explanation:
            '`continue` jumps straight to the next condition check, while `break` exits the enclosing loop immediately.',
          notes: [
            'Always update the loop counter before `continue` to prevent infinite loops.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using Assignment (=) in an if Condition',
          buggyCode: 'if lives = 0:\n    game_over()',
          fixedCode: 'if lives == 0:\n    game_over()',
          reason:
            '`=` binds a value; `==` tests equality. Putting `=` directly in an `if` header raises `SyntaxError`.',
        },
        {
          title: 'Looping to an Inclusive Bound',
          buggyCode: '# Prints 0, 1, 2, 3, 4\nfor i in range(1, 5):\n    print(i)',
          fixedCode: '# Prints 1, 2, 3, 4, 5\nfor i in range(1, 6):\n    print(i)',
          reason:
            '`range(start, stop)` always excludes `stop`. Pass `stop + 1` when you want the final number included.',
        },
      ],
      proTip:
        'Flatten deeply nested `if` blocks by returning early when invalid ("guard clause"), and use `in` checks like `if role in ("admin", "mod"):` instead of repeating `==`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'if / elif / else',
        subtitle: 'Branch logic cleanly using indentation & colons',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Colons & Indentation Blocks',
            explanation:
              'Python uses `elif` (never `else if`) and requires a colon `:` at the end of every branch condition. Indented lines below belong to that branch.',
            code: ['if xp >= 100:', '    tier = "Gold"', 'elif xp >= 50:', '    tier = "Silver"'],
            highlightNote: 'Missing `:` or wrong indentation raises `IndentationError`.',
          },
          {
            type: 'token_builder',
            prompt: 'Add the middle branch keyword and trailing colon.',
            codeLines: ['if x > 10:', '    tag = "high"', '{{0}} x > 0:', '    tag = "mid"'],
            expectedTokens: ['elif'],
            distractors: ['else if', 'elsif', 'when'],
            explanation: 'Python spells else-if cleanly as `elif`.',
            syntaxHint: '`else if` is a `SyntaxError` in Python; always use `elif`.',
          },
          {
            type: 'token_builder',
            prompt: 'Combine two conditions with Python logical keywords.',
            codeLines: ['if hearts > 0 {{0}} {{1}} is_locked:', '    start_lesson()'],
            expectedTokens: ['and', 'not'],
            distractors: ['&&', '!', '||'],
            explanation: 'Python spells boolean operators as words: `and`, `or`, `not`.',
            syntaxHint: '`&&` and `!` are invalid syntax in Python conditionals.',
          },
          {
            type: 'token_builder',
            prompt: 'Assign a status tag using Python inline ternary syntax.',
            codeLines: ['badge = "PRO" {{0}} xp >= 1000 {{1}} "DEV"'],
            expectedTokens: ['if', 'else'],
            distractors: ['?', ':', 'then'],
            explanation: 'Python ternary reads `val_true if cond else val_false`.',
            syntaxHint: 'Python does not use `? :` for ternary expressions.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line with invalid Python conditional syntax.',
            lines: [
              'score = 88',
              'if score >= 90:',
              '    grade = "A"',
              'else if score >= 80:',
              '    grade = "B"',
            ],
            bugLine: 3,
            fixed: 'elif score >= 80:',
            explanation: 'Replace `else if` with `elif` in Python.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'For Loops & range()',
        subtitle: 'Iterate N times with zero off-by-one surprises',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Pythonic `for ... in range()`',
            explanation:
              '`range(n)` starts at `0` and stops before `n`. Pass `(start, stop, step)` to customize bounds and increments.',
            code: ['for i in range(3):', '    print(i)  # 0, 1, 2'],
            highlightNote: 'Use `_` when you ignore the loop counter.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the loop header to run 5 times (`0..4`).',
            codeLines: ['for i {{0}} range(5):', '    print(i)'],
            expectedTokens: ['in'],
            distractors: ['of', 'from', '='],
            explanation: 'Python `for` loops always iterate using `in`.',
            syntaxHint: '`for i of ...` is JavaScript syntax; Python always uses `in`.',
          },
          {
            type: 'token_builder',
            prompt: 'Generate even numbers `2, 4, 6` with step 2.',
            codeLines: ['for n {{0}} {{1}}(2, 8, 2):', '    print(n)'],
            expectedTokens: ['in', 'range'],
            distractors: ['len', 'slice', 'seq'],
            explanation: '`range(2, 8, 2)` steps by 2 starting at 2 and stops before 8.',
            syntaxHint: 'End argument `8` is exclusive, so the last value yielded is `6`.',
            output: '2\n4\n6',
          },
          {
            type: 'token_builder',
            prompt: 'Pair each item with its index using `enumerate()`.',
            codeLines: ['langs = ["Py", "Go"]', 'for idx, name in {{0}}(langs):', '    print({{1}}"{idx}: {name}")'],
            expectedTokens: ['enumerate', 'f'],
            distractors: ['entries', 'index', '$'],
            explanation: '`enumerate()` yields `(index, value)` tuples directly without manual counters.',
            syntaxHint: 'Avoid `range(len(langs))` when `enumerate()` gives both cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What is the final value printed?',
            code: ['total = 0', 'for k in range(1, 4):', '    total += k', 'print(total)'],
            options: ['6', '10', '3'],
            answer: 0,
            explanation: '`range(1, 4)` produces `1, 2, 3`, whose sum is `6`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Branch & Loop',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Accumulate only odd numbers below 6.',
            codeLines: [
              'total = 0',
              'for n {{0}} {{1}}(1, 6, 2):',
              '    total += n',
            ],
            expectedTokens: ['in', 'range'],
            distractors: ['of', 'while', 'step'],
            explanation: '`range(1, 6, 2)` yields `1, 3, 5` for a sum of `9`.',
            syntaxHint: 'Python iterates exclusively via `for ... in range(...)`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the missing syntax in this loop block.',
            lines: [
              'count = 3',
              'while count > 0',
              '    print(count)',
              '    count -= 1',
            ],
            bugLine: 1,
            fixed: 'while count > 0:',
            explanation: 'Every `while` condition header must end with a colon `:`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `break` cause this loop to output?',
            code: [
              'res = 0',
              'for i in range(5):',
              '    if i == 3: break',
              '    res += i',
              'print(res)',
            ],
            options: ['3', '6', '10'],
            answer: 0,
            explanation: 'Iterations `0 + 1 + 2 = 3`; at `i == 3`, `break` exits immediately.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'While, break & continue',
        subtitle: 'Control loop termination and skip iterations cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Skipping & Exiting Loops',
            explanation:
              'Use `continue` to skip straight to the next iteration without exiting the loop. Use `break` to terminate the enclosing loop immediately.',
            code: ['for x in [1, -2, 3]:', '    if x < 0: continue', '    total += x'],
          },
          {
            type: 'token_builder',
            prompt: 'Loop while attempts remain above zero.',
            codeLines: ['{{0}} retries > 0:', '    retries -= 1'],
            expectedTokens: ['while'],
            distractors: ['until', 'loop', 'for'],
            explanation: '`while` repeats as long as its condition evaluates truthy.',
            syntaxHint: 'Python does not have `until` or `loop` keywords.',
          },
          {
            type: 'token_builder',
            prompt: 'Skip empty strings and exit early on `"STOP"`.',
            codeLines: [
              'for cmd in queue:',
              '    if cmd == "": {{0}}',
              '    if cmd == "STOP": {{1}}',
            ],
            expectedTokens: ['continue', 'break'],
            distractors: ['skip', 'return', 'next'],
            explanation: '`continue` skips the current item; `break` exits the loop cleanly.',
            syntaxHint: '`skip` and `next` are not loop control statements in Python.',
          },
          {
            type: 'token_builder',
            prompt: 'Decrement cleanly to avoid an infinite `while` loop.',
            codeLines: ['hp = 3', 'while hp > 0:', '    hp {{0}} 1', 'print({{1}}"Done: {hp}")'],
            expectedTokens: ['-=', 'f'],
            distractors: ['--', '=-', '$'],
            explanation: 'Use `hp -= 1` instead of `--hp`, as Python lacks increment/decrement operators.',
            syntaxHint: '`--` is unary double-negation or syntax error, never decrements.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed after `continue` skips `2`?',
            code: [
              'sum_ok = 0',
              'for n in [1, 2, 3]:',
              '    if n == 2: continue',
              '    sum_ok += n',
              'print(sum_ok)',
            ],
            options: ['4', '6', '1'],
            answer: 0,
            explanation: 'Skipping `2` sums `1 + 3 = 4`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss Challenge',
        subtitle: 'Build guarded loops combining `elif`, `range`, and `break`',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Safe Loop Control',
            explanation:
              'Combining `for` loops with `if/elif` filters lets you scan logs and abort early on fatal conditions cleanly without deeply nested pyramids.',
            code: ['for code in [200, 404, 500]:', '    if code >= 500: break'],
          },
          {
            type: 'token_builder',
            prompt: 'Loop over `range(1, 5)` and skip index 2.',
            codeLines: [
              'for i {{0}} {{1}}(1, 5):',
              '    if i == 2: {{2}}',
            ],
            expectedTokens: ['in', 'range', 'continue'],
            distractors: ['of', 'break', 'elif'],
            explanation: '`continue` skips `2` while preserving iterations `1, 3, 4`.',
            syntaxHint: '`break` would exit completely instead of skipping only `2`.',
          },
          {
            type: 'token_builder',
            prompt: 'Guard multi-tier status scoring cleanly.',
            codeLines: [
              'if xp > 900:',
              '    rank = "S"',
              '{{0}} xp > 500:',
              '    rank = "A"',
              '{{1}}:',
              '    rank = "B"',
            ],
            expectedTokens: ['elif', 'else'],
            distractors: ['else if', 'default', 'otherwise'],
            explanation: 'Python multi-way branching uses `if`, `elif`, and `else`.',
            syntaxHint: '`default` is for `switch` or `match/case`, not `if` blocks.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the infinite loop bug.',
            lines: [
              'n = 5',
              'while n > 0:',
              '    print(n)',
              '    n =+ 1',
            ],
            bugLine: 3,
            fixed: '    n -= 1',
            explanation: '`n =+ 1` assigns positive `1` forever instead of decrementing with `n -= 1`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this countdown filter print?',
            code: [
              'hits = 0',
              'for i in range(4):',
              '    if i % 2 == 0: hits += 1',
              'print(hits)',
            ],
            options: ['2', '4', '1'],
            answer: 0,
            explanation: 'Even numbers in `0, 1, 2, 3` are `0` and `2`, so `hits` is `2`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Lists, Tuples & Slicing (5 nodes)
  // =========================================================================
  {
    title: 'Lists, Tuples & Slicing',
    subtitle: 'Manipulate ordered sequences, negative indices, and comprehensions.',
    conceptGraphicType: 'collections',
    guidebook: {
      summary:
        'Lists (`[]`) are resizable, ordered arrays that support negative indexing and slice views. Tuples (`()`) store lightweight, fixed immutable sequences, while comprehensions transform collections in one readable line.',
      mentalModel:
        'Assigning `b = a` does NOT duplicate a list — both names point to the exact same object in memory. Slicing `a[1:4]` always allocates a shallow new list without mutating `a`.',
      keyTakeaways: [
        'Negative indices read backwards from the tail: `items[-1]` is the last element, `items[-2]` second-to-last.',
        'Slice syntax `[start:stop:step]` excludes `stop`; `items[::-1]` produces a reversed copy.',
        '`.append(x)` mutates in place and returns `None`; `sorted(items)` returns a new list.',
        'Use a tuple `(x, y)` for fixed coordinates or unpacking when size should never change.',
      ],
      keySyntax: [
        {
          title: 'Slicing, Negative Index & Reversal',
          tag: 'SLICING',
          code: 'nums = [10, 20, 30, 40, 50]\nprint(nums[-1], nums[1:4])\nprint(nums[::-1])',
          output: '50 [20, 30, 40]\n[50, 40, 30, 20, 10]',
          explanation:
            'Omit `start` or `stop` to slice from index `0` or all the way to the end safely without `IndexError`.',
          notes: [
            'Out-of-bounds slices never crash (`nums[2:99]` clamps cleanly).',
            'Use `.pop()` to remove and return the last item in O(1) time.',
          ],
        },
        {
          title: 'List Comprehensions & Filtering',
          tag: 'PYTHONIC',
          code: 'raw = [3, 8, 12, 5, 20]\nhits = [n * 2 for n in raw if n >= 10]\nprint(hits)',
          output: '[24, 40]',
          explanation:
            'Combines mapping (`n * 2`) and filtering (`if n >= 10`) faster and more cleanly than building with `.append()`.',
          notes: [
            'Keep comprehensions concise; switch to a normal `for` loop if logic needs 2+ conditions.',
          ],
        },
        {
          title: 'Tuples & Unpacking',
          tag: 'IMMUTABLE',
          code: 'point = (14, 28)\nx, y = point\nprint(f"x={x}, y={y}")',
          output: 'x=14, y=28',
          explanation:
            'Tuples lock element count and order, making them safe dictionary keys and clean multi-value returns.',
          notes: [
            'A 1-element tuple requires a trailing comma: `(42,)` — `(42)` is just `int`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Accidental Aliasing Instead of Copying',
          buggyCode: 'orig = [1, 2]\ncopy = orig\ncopy.append(3)  # Mutates orig too!',
          fixedCode: 'orig = [1, 2]\ncopy = orig.copy()\ncopy.append(3)',
          reason:
            '`=` only copies the reference pointer. Use `orig.copy()` or `orig[:]` to keep mutations isolated.',
        },
        {
          title: 'Assigning Return Value of In-Place .sort()',
          buggyCode: 'nums = [3, 1, 2]\nnums = nums.sort()  # None!',
          fixedCode: 'nums = [3, 1, 2]\nordered = sorted(nums)',
          reason:
            'In-place mutators `.sort()`, `.reverse()`, and `.append()` return `None` in Python so you notice the mutation.',
        },
      ],
      proTip:
        'Check membership in `O(1)` when checking hundreds of items by storing reference values in a `set`, reserving lists for ordered data.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Lists & Negative Indexing',
        subtitle: 'Create, append, and read tail elements in O(1)',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Mutable Lists & `.append()`',
            explanation:
              'Python lists store dynamic items inside square brackets `[]`. Index `-1` fetches the very last element cleanly without writing `len(arr) - 1`.',
            code: ['stack = ["py", "cpp"]', 'stack.append("go")', 'print(stack[-1])  # go'],
          },
          {
            type: 'token_builder',
            prompt: 'Add `"js"` to the end of `langs`.',
            codeLines: ['langs = ["py", "cpp"]', 'langs.{{0}}("js")'],
            expectedTokens: ['append'],
            distractors: ['push', 'add', 'insertLast'],
            explanation: 'Python lists add elements to the end via `.append()`, never `.push()`.',
            syntaxHint: '`.push()` is JavaScript; Python lists use `.append()`.',
          },
          {
            type: 'token_builder',
            prompt: 'Read the last element and total list length cleanly.',
            codeLines: ['tags = ["a", "b", "c"]', 'tail = tags[{{0}}]', 'size = {{1}}(tags)'],
            expectedTokens: ['-1', 'len'],
            distractors: ['last', 'size', 'length'],
            explanation: '`tags[-1]` grabs the final item and built-in `len()` returns count `3`.',
            syntaxHint: 'Lists use the global function `len(tags)`, not `tags.length`.',
          },
          {
            type: 'token_builder',
            prompt: 'Remove and return the last element from `queue`.',
            codeLines: ['queue = [10, 20, 30]', 'item = queue.{{0}}()', 'print({{1}}"Popped {item}")'],
            expectedTokens: ['pop', 'f'],
            distractors: ['shift', 'removeLast', '$'],
            explanation: '`.pop()` removes and returns the last list element in O(1) time.',
            syntaxHint: 'Use `.pop()` without arguments to pop from the right end.',
            output: 'Popped 30',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the out-of-bounds index bug.',
            lines: [
              'items = ["alpha", "beta", "gamma"]',
              'first = items[0]',
              'last = items[3]',
              'print(first, last)',
            ],
            bugLine: 2,
            fixed: 'last = items[-1]',
            explanation: 'A 3-item list has indices `0, 1, 2`; `items[3]` raises `IndexError`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Slicing & Copying',
        subtitle: 'Extract sublists cleanly with [start:stop:step]',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Boilerplate List Slicing',
            explanation:
              '`seq[start:stop]` returns elements from `start` up to `stop - 1`. Omitting `start` defaults to `0`; step `-1` (`seq[::-1]`) reverses cleanly.',
            code: ['nums = [1, 2, 3, 4]', 'mid = nums[1:3]   # [2, 3]', 'rev = nums[::-1]  # [4, 3, 2, 1]'],
          },
          {
            type: 'token_builder',
            prompt: 'Reverse the list concisely using slice stepping.',
            codeLines: ['nums = [10, 20, 30]', 'rev = nums[{{0}}]'],
            expectedTokens: ['::-1'],
            distractors: [':-1', '-1:', '.reverse'],
            explanation: 'Slice `[::-1]` creates a reversed shallow copy without mutating `nums`.',
            syntaxHint: 'Note the two colons: `[start:stop:step]` where `step = -1`.',
          },
          {
            type: 'token_builder',
            prompt: 'Extract index `1` and `2`, stopping before index `3`.',
            codeLines: ['chars = ["a", "b", "c", "d"]', 'sub = chars[{{0}}:{{1}}]'],
            expectedTokens: ['1', '3'],
            distractors: ['0', '2', '4'],
            explanation: 'Slices include index `1` and exclude index `3`, yielding `["b", "c"]`.',
            syntaxHint: 'Remember: stop index `3` is exclusive in Python slices.',
          },
          {
            type: 'token_builder',
            prompt: 'Clone a list cleanly so edits never mutate the original.',
            codeLines: ['orig = [1, 2]', 'clone = orig[{{0}}]', 'clone.{{1}}(3)'],
            expectedTokens: [':', 'append'],
            distractors: ['*', 'push', '-1'],
            explanation: '`orig[:]` creates an independent shallow copy before `.append(3)`.',
            syntaxHint: 'Without `[:]`, `clone = orig` points to the exact same list object!',
          },
          {
            type: 'predict_output',
            prompt: 'What does slicing with `nums[-2:]` print?',
            code: ['nums = [10, 20, 30, 40]', 'print(nums[-2:])'],
            options: ['[30, 40]', '[10, 20]', '[40, 30]'],
            answer: 0,
            explanation: 'Start at `-2` (value `30`) through the end yields `[30, 40]`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Sequences',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Transform `[1, 2, 3]` into doubled squares via comprehension.',
            codeLines: ['vals = [1, 2, 3]', 'sq = [x ** 2 {{0}} x {{1}} vals]'],
            expectedTokens: ['for', 'in'],
            distractors: ['map', 'of', 'while'],
            explanation: 'List comprehensions place `[expr for item in iterable]`.',
            syntaxHint: 'Do not invert `for` and `in` inside list comprehensions.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that fails because tuples are immutable.',
            lines: [
              'point = (10, 20)',
              'x = point[0]',
              'point[0] = 99',
              'print(point)',
            ],
            bugLine: 2,
            fixed: 'point = (99, point[1])',
            explanation: 'Tuples cannot be reassigned by index (`TypeError`); create a new tuple or use a list.',
          },
          {
            type: 'predict_output',
            prompt: 'What happens with aliasing vs slicing?',
            code: ['a = [1, 2]', 'b = a', 'b.append(3)', 'print(len(a))'],
            options: ['3', '2', 'TypeError'],
            answer: 0,
            explanation: '`b = a` binds both names to the same list object, so `a` also becomes length `3`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Tuples & Comprehensions',
        subtitle: 'Unpack immutable tuples and filter lists concisely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Tuples vs List Comprehensions',
            explanation:
              'Tuples `(x, y)` lock data safely from accidental mutation and unpack neatly. List comprehensions transform or filter collections in a single expression.',
            code: ['lat, lon = (36.7, 3.0)', 'fast = [n * 10 for n in range(3) if n > 0]'],
          },
          {
            type: 'token_builder',
            prompt: 'Unpack the `(x, y)` coordinate tuple into two variables.',
            codeLines: ['coord = (12, 48)', '{{0}}, {{1}} = coord'],
            expectedTokens: ['x', 'y'],
            distractors: ['(x)', '[0]', 'let'],
            explanation: 'Tuple unpacking assigns each slot directly to `x` and `y`.',
            syntaxHint: 'Count of variables on the left must match tuple length (`2`).',
          },
          {
            type: 'token_builder',
            prompt: 'Keep only scores `>= 50` using a conditional comprehension.',
            codeLines: ['passed = [s {{0}} s in scores {{1}} s >= 50]'],
            expectedTokens: ['for', 'if'],
            distractors: ['where', 'filter', 'elif'],
            explanation: 'Filter conditions sit at the end of a list comprehension with `if`.',
            syntaxHint: 'Python comprehensions use `if`, never `where` or `filter`.',
          },
          {
            type: 'token_builder',
            prompt: 'Check membership before appending cleanly.',
            codeLines: ['tags = ("api", "db")', 'if "db" {{0}} tags:', '    print({{1}}(tags))'],
            expectedTokens: ['in', 'len'],
            distractors: ['has', 'contains', 'size'],
            explanation: 'Use `in` to test membership and `len()` for tuple length.',
            syntaxHint: 'Tuples support `in` and `len()` just like lists.',
            output: '2',
          },
          {
            type: 'predict_output',
            prompt: 'What does this comprehension evaluate to?',
            code: ['res = [x * 2 for x in [1, 2, 3] if x != 2]', 'print(res)'],
            options: ['[2, 6]', '[2, 4, 6]', '[1, 3]'],
            answer: 0,
            explanation: '`x == 2` is filtered out, leaving `1 * 2` and `3 * 2` -> `[2, 6]`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss Challenge',
        subtitle: 'Master slices, tuple unpacking, and list comprehensions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Clean Data Pipelines',
            explanation:
              'Real Python code replaces multi-line accumulator loops with slicing and comprehensions, cutting bugs and making intent immediately visible.',
            code: ['top3 = sorted(scores, reverse=True)[:3]'],
          },
          {
            type: 'token_builder',
            prompt: 'Grab the top two values cleanly via slicing.',
            codeLines: ['ranks = [99, 85, 70, 50]', 'podium = ranks[{{0}}:{{1}}]'],
            expectedTokens: ['0', '2'],
            distractors: ['1', '3', '-1'],
            explanation: '`ranks[0:2]` selects index `0` and `1` -> `[99, 85]`.',
            syntaxHint: 'Slice stop index `2` stops right before index 2 (`70`).',
          },
          {
            type: 'token_builder',
            prompt: 'Normalize strings to uppercase using a list comprehension.',
            codeLines: ['raw = ["py", "go"]', 'upper = [w.{{0}}() {{1}} w {{2}} raw]'],
            expectedTokens: ['upper', 'for', 'in'],
            distractors: ['toUpperCase', 'map', 'of'],
            explanation: 'Strings expose `.upper()` in Python, applied over `for w in raw`.',
            syntaxHint: '`.toUpperCase()` belongs to JavaScript; Python uses `.upper()`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the invalid method call on a Python list.',
            lines: [
              'items = [1, 2, 3]',
              'items.push(4)',
              'print(items[::-1])',
            ],
            bugLine: 1,
            fixed: 'items.append(4)',
            explanation: 'Python lists raise `AttributeError` on `.push()`; use `.append(4)`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['a = [10, 20, 30]', 'b = a[:]', 'b.pop()', 'print(len(a), len(b))'],
            options: ['3 2', '2 2', '3 3'],
            answer: 0,
            explanation: '`a[:]` clones `a`, so popping from `b` leaves `a` untouched at length `3`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Dictionaries & Sets (5 nodes)
  // =========================================================================
  {
    title: 'Dictionaries & Sets',
    subtitle: 'Perform O(1) key-value lookups and fast deduplication.',
    conceptGraphicType: 'dicts_sets',
    guidebook: {
      summary:
        'Dictionaries (`{k: v}`) store hash-indexed key-value pairs for instant O(1) lookup, while Sets (`{a, b}`) hold unique hashable items and power mathematical intersections (`&`) and differences (`-`).',
      mentalModel:
        'Both `dict` keys and `set` members rely on `hash(key)` to jump straight to a memory bucket in constant time — which is why only immutable types (`str`, `int`, `tuple`) can serve as keys.',
      keyTakeaways: [
        'Use `.get(key, default)` for defensive reads so missing keys return a fallback instead of `KeyError`.',
        'Python 3.7+ guarantees dictionaries preserve insertion order when iterating.',
        'Empty `{}` creates a `dict`; always call `set()` to instantiate an empty `set`.',
        'Set operators `&` (both), `|` (union), and `-` (only left) replace verbose nested loops.',
      ],
      keySyntax: [
        {
          title: 'Safe Dict Reads & Dynamic Counting',
          tag: 'DICTIONARY',
          code: 'xp = {"py": 120, "go": 80}\nprint(xp.get("cpp", 0))\nxp["cpp"] = xp.get("cpp", 0) + 50\nprint(xp)',
          output: '0\n{\'py\': 120, \'go\': 80, \'cpp\': 50}',
          explanation:
            '`.get()` prevents crashes on absent keys and makes frequency counters one-liners.',
          notes: [
            'Check key presence with `if "cpp" in xp:` (O(1) hash lookup).',
          ],
        },
        {
          title: 'Iterating Keys & Values via .items()',
          tag: 'ITERATION',
          code: 'scores = {"Ada": 98, "Lin": 92}\nfor name, pts in scores.items():\n    print(f"{name}: {pts}")',
          output: 'Ada: 98\nLin: 92',
          explanation:
            'Unpack `(key, value)` pairs directly using `.items()` instead of looking up `scores[key]` on every step.',
          notes: [
            'Use `.keys()` or `.values()` if you only need one side.',
          ],
        },
        {
          title: 'Set Algebra & Instant Deduplication',
          tag: 'SETS',
          code: 'a = {"py", "go", "js"}\nb = {"go", "cpp"}\nprint(sorted(a & b), sorted(a - b))',
          output: '[\'go\'] [\'js\', \'py\']',
          explanation:
            'Sets automatically drop duplicates and compute intersections/differences cleanly.',
          notes: [
            '`set(list_with_dupes)` deduplicates in O(n) average time.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Creating an Empty Set with {}',
          buggyCode: 'seen = {}\nseen.add("py")  # AttributeError!',
          fixedCode: 'seen = set()\nseen.add("py")',
          reason:
            '`{}` always constructs an empty `dict`, which has no `.add()` method. Use `set()` instead.',
        },
        {
          title: 'Direct Indexing on Optional Keys',
          buggyCode: 'cfg = {"theme": "dark"}\nmode = cfg["lang"]  # KeyError!',
          fixedCode: 'cfg = {"theme": "dark"}\nmode = cfg.get("lang", "en")',
          reason:
            'Bracket indexing `cfg[k]` throws `KeyError` when absent. `.get(k, fallback)` stays resilient.',
        },
      ],
      proTip:
        'Need nested counts or grouped lists without manual `if key not in map:` checks? Python’s `collections.Counter` and `defaultdict(list)` handle initialization automatically.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Dict Lookups & .get()',
        subtitle: 'Safely read and update key-value maps',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Preventing KeyError with `.get()`',
            explanation:
              'Accessing `user["missing"]` crashes with `KeyError`. Calling `user.get("missing", 0)` returns a safe fallback value instead.',
            code: ['xp_map = {"py": 300}', 'go_xp = xp_map.get("go", 0)  # 0'],
          },
          {
            type: 'token_builder',
            prompt: 'Safely read `"streak"` with fallback `0`.',
            codeLines: ['profile = {"xp": 450}', 's = profile.{{0}}("streak", 0)'],
            expectedTokens: ['get'],
            distractors: ['find', 'fetch', 'read'],
            explanation: 'Dict `.get(key, default)` returns `0` when `"streak"` is absent.',
            syntaxHint: '`.find()` does not exist on Python dicts.',
          },
          {
            type: 'token_builder',
            prompt: 'Update an entry cleanly and iterate `.items()`.',
            codeLines: ['counts = {"py": 1}', 'for lang, n in counts.{{0}}():', '    print({{1}}"{lang}: {n}")'],
            expectedTokens: ['items', 'f'],
            distractors: ['entries', 'pairs', '$'],
            explanation: '`.items()` yields `(key, value)` pairs cleanly during iteration.',
            syntaxHint: 'Python dicts expose `.items()`, not JavaScript `Object.entries()`.',
            output: 'py: 1',
          },
          {
            type: 'token_builder',
            prompt: 'Check key membership and increment count safely.',
            codeLines: ['hits = {}', 'key = "api"', 'hits[key] = hits.{{0}}(key, 0) {{1}} 1'],
            expectedTokens: ['get', '+'],
            distractors: ['fetch', '++', 'set'],
            explanation: 'Using `.get(key, 0) + 1` is the canonical Python frequency counter pattern.',
            syntaxHint: 'Avoid bare `hits[key] += 1` if `key` may not exist yet.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that throws a KeyError.',
            lines: [
              'cfg = {"theme": "dark"}',
              'mode = cfg.get("theme", "light")',
              'port = cfg["port"]',
              'print(mode, port)',
            ],
            bugLine: 2,
            fixed: 'port = cfg.get("port", 8080)',
            explanation: 'Key `"port"` is missing from `cfg`, so `cfg["port"]` raises `KeyError`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Sets & Unique Items',
        subtitle: 'Deduplicate collections and check O(1) membership',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Set Uniqueness & `set()`',
            explanation:
              'Sets eliminate duplicates automatically and check `x in my_set` in constant O(1) time. Empty `{}` makes a `dict`, so initialize an empty set with `set()`.',
            code: ['seen = set()', 'seen.add("python")', 'seen.add("python")  # still size 1'],
          },
          {
            type: 'token_builder',
            prompt: 'Initialize an empty set cleanly.',
            codeLines: ['visited = {{0}}', 'visited.add("node-1")'],
            expectedTokens: ['set()'],
            distractors: ['{}', '[]', 'Set()'],
            explanation: '`set()` creates an empty set; `{}` creates an empty dictionary!',
            syntaxHint: '`{}` has `.add()` missing because it creates a `dict`.',
          },
          {
            type: 'token_builder',
            prompt: 'Insert `"go"` into the set and deduplicate `raw`.',
            codeLines: ['langs = {"py"}', 'langs.{{0}}("go")', 'unique = {{1}}(["a", "a", "b"])'],
            expectedTokens: ['add', 'set'],
            distractors: ['append', 'push', 'dict'],
            explanation: 'Sets use `.add()` (not `.append()`), and `set(list)` removes duplicates.',
            syntaxHint: '`.append()` only exists on lists.',
          },
          {
            type: 'token_builder',
            prompt: 'Compute common skills using set intersection `&`.',
            codeLines: ['a = {"py", "sql"}', 'b = {"go", "py"}', 'shared = a {{0}} b', 'print({{1}}(shared))'],
            expectedTokens: ['&', 'len'],
            distractors: ['&&', 'size', '+'],
            explanation: 'Set intersection `a & b` finds shared keys (`{"py"}`), size `1`.',
            syntaxHint: '`+` is undefined on sets; use `|` for union and `&` for intersection.',
            output: '1',
          },
          {
            type: 'predict_output',
            prompt: 'What is `len(set([1, 2, 2, 3, 3, 3]))`?',
            code: ['items = [1, 2, 2, 3, 3, 3]', 'print(len(set(items)))'],
            options: ['3', '6', '2'],
            answer: 0,
            explanation: 'Converting to a `set` collapses duplicates to `{1, 2, 3}` (length `3`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Hash Maps',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Create an empty set and populate unique tags.',
            codeLines: ['seen = {{0}}', 'for t in ["x", "x"]:', '    seen.{{1}}(t)'],
            expectedTokens: ['set()', 'add'],
            distractors: ['{}', 'append', 'push'],
            explanation: 'Create an empty set with `set()` and add items with `.add()`.',
            syntaxHint: '`{}` creates a dict, which has no `.add()` method.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that misinitializes a Python set.',
            lines: [
              'unique_ids = {}',
              'unique_ids.add(101)',
              'print(unique_ids)',
            ],
            bugLine: 0,
            fixed: 'unique_ids = set()',
            explanation: '`{}` is a `dict`, so `.add()` fails with `AttributeError`. Use `set()`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this safe lookup print?',
            code: ['m = {"a": 10}', 'print(m.get("b", 99) + m["a"])'],
            options: ['109', 'KeyError', '99'],
            answer: 0,
            explanation: '`m.get("b", 99)` returns fallback `99`, plus `m["a"]` (`10`) = `109`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Dict Comprehensions',
        subtitle: 'Transform keys and values into clean lookup tables',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Building Dicts Declaratively',
            explanation:
              'Dict comprehensions mirror list comprehensions using curly braces and a colon `{k: v for ...}`. They convert raw arrays into fast O(1) lookup tables.',
            code: ['nums = [2, 4]', 'sq = {n: n ** 2 for n in nums}  # {2: 4, 4: 16}'],
          },
          {
            type: 'token_builder',
            prompt: 'Build a dict mapping each number to its double.',
            codeLines: ['doubles = {x{{0}} x * 2 {{1}} x in [1, 2, 3]}'],
            expectedTokens: [':', 'for'],
            distractors: ['=', '=>', 'if'],
            explanation: 'Key-value separation in a dict comprehension uses `:`.',
            syntaxHint: 'Do not use `=` inside `{k: v ...}` dictionary expressions.',
          },
          {
            type: 'token_builder',
            prompt: 'Filter items keeping only passing XP >= 50.',
            codeLines: ['raw = {"a": 80, "b": 20}', 'ok = {k: v for k, v in raw.{{0}}() {{1}} v >= 50}'],
            expectedTokens: ['items', 'if'],
            distractors: ['keys', 'values', 'where'],
            explanation: 'Unpack `.items()` and append `if v >= 50` at the end.',
            syntaxHint: '`.keys()` only yields keys, causing an unpacking `ValueError` for `k, v`.',
          },
          {
            type: 'token_builder',
            prompt: 'Invert a dict safely swapping values and keys.',
            codeLines: ['codes = {"US": 1, "DZ": 213}', 'inv = {v: k {{0}} k, v {{1}} codes.{{2}}()}'],
            expectedTokens: ['for', 'in', 'items'],
            distractors: ['entries', 'of', 'values'],
            explanation: '`for k, v in codes.items()` exposes both values cleanly for swapping.',
            syntaxHint: 'Always call `.items()` when looping over both key and value.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['d = {n: n * 10 for n in [1, 2]}', 'print(d.get(2, 0))'],
            options: ['20', '0', '2'],
            answer: 0,
            explanation: 'Key `2` maps to `2 * 10 = 20`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss Challenge',
        subtitle: 'Solve deduplication and fast map pipelines cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Hash Table Mastery',
            explanation:
              'Combining `set` deduplication with `dict.get()` frequency counting lets you solve classic log-aggregation problems in O(N) linear time.',
            code: ['freq = {}', 'for w in words: freq[w] = freq.get(w, 0) + 1'],
          },
          {
            type: 'token_builder',
            prompt: 'Count unique words safely with `.get()`.',
            codeLines: [
              'counts = {}',
              'for w in ["py", "go", "py"]:',
              '    counts[w] = counts.{{0}}(w, 0) {{1}} 1',
            ],
            expectedTokens: ['get', '+'],
            distractors: ['fetch', '++', 'add'],
            explanation: '`.get(w, 0) + 1` initializes unseen keys to `0` before incrementing.',
            syntaxHint: 'Avoid KeyError on first insertion by providing `0` default to `.get()`.',
          },
          {
            type: 'token_builder',
            prompt: 'Remove duplicate IDs and verify common members.',
            codeLines: [
              'seen = {{0}}',
              'seen.{{1}}("u1")',
              'print(len(seen & {"u1", "u2"}))',
            ],
            expectedTokens: ['set()', 'add'],
            distractors: ['{}', 'append', 'push'],
            explanation: '`set()` + `.add()` tracks IDs cleanly; `&` intersects against `{"u1", "u2"}`.',
            syntaxHint: 'Empty `{}` creates a dict, which does not support `&` intersection.',
            output: '1',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the bug in this dict key-value loop.',
            lines: [
              'scores = {"Alice": 90, "Bob": 85}',
              'for name, pts in scores:',
              '    print(name, pts)',
            ],
            bugLine: 1,
            fixed: 'for name, pts in scores.items():',
            explanation: 'Iterating over a bare dict only yields keys, raising `ValueError` on unpacking two variables.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed after union `|` on two sets?',
            code: ['s1 = {1, 2}', 's2 = {2, 3}', 'print(len(s1 | s2))'],
            options: ['3', '4', '1'],
            answer: 0,
            explanation: 'Set union `{1, 2} | {2, 3}` is `{1, 2, 3}`, whose length is `3`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Functions & Scope (5 nodes)
  // =========================================================================
  {
    title: 'Functions & Scope',
    subtitle: 'Write clean `def` functions, default args, *args, and lambdas.',
    conceptGraphicType: 'functions',
    guidebook: {
      summary:
        'Functions encapsulate reusable logic behind clear inputs and outputs using `def`. Understanding local vs module scope (LEGB rule), variadic parameters (`*args`, `**kwargs`), and anonymous `lambda` functions keeps Python code modular and bug-free.',
      mentalModel:
        'Variables created inside a function live strictly inside that call’s local stack frame and vanish when `return` runs. Every function implicitly returns `None` if execution reaches the end without a `return`.',
      keyTakeaways: [
        'Use `return` to pass values back cleanly — `print()` displays to stdout but returns `None`.',
        'Optional parameters must come AFTER required positional parameters in `def fn(a, b=1):`.',
        '`*args` packs extra positional values into a tuple; `**kwargs` packs keyword options into a dict.',
        'Never use a mutable default (`items=[]`) — defaults are evaluated ONCE at function definition, not per call!',
      ],
      keySyntax: [
        {
          title: 'Typed Signatures & Default Arguments',
          tag: 'FUNCTIONS',
          code: 'def apply_boost(xp: int, mult: int = 2) -> int:\n    return xp * mult\n\nprint(apply_boost(25), apply_boost(25, 3))',
          output: '50 75',
          explanation:
            'Default parameters allow clean optional arguments, while type hints document intent for teams and tools.',
          notes: [
            'Pass keyword arguments explicitly for clarity: `apply_boost(xp=25, mult=3)`.',
          ],
        },
        {
          title: 'Safe Mutable Default Pattern',
          tag: 'BEST PRACTICE',
          code: 'def add_tag(tag: str, tags=None):\n    if tags is None:\n        tags = []\n    tags.append(tag)\n    return tags\nprint(add_tag("py"), add_tag("go"))',
          output: '[\'py\'] [\'go\']',
          explanation:
            'Defaulting to `None` allocates a fresh list on every invocation instead of leaking items across calls.',
          notes: [
            'Same pattern applies to `dict` and `set` default arguments.',
          ],
        },
        {
          title: 'Sorting with Lambda Key Functions',
          tag: 'LAMBDA',
          code: 'users = [{"n": "Ada", "xp": 90}, {"n": "Bo", "xp": 140}]\ntop = sorted(users, key=lambda u: u["xp"], reverse=True)\nprint(top[0]["n"])',
          output: 'Bo',
          explanation:
            '`lambda` creates a compact single-expression callback ideal for `sorted()`, `min()`, and `max()`.',
          notes: [
            'If a transformation needs multiple lines or branching, always prefer a named `def`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Shared Mutable Default List Trap',
          buggyCode: 'def push(x, arr=[]):\n    arr.append(x)\n    return arr',
          fixedCode: 'def push(x, arr=None):\n    arr = [] if arr is None else arr\n    arr.append(x)\n    return arr',
          reason:
            'Default `[]` is shared across every future call (`push(1)` then `push(2)` returns `[1, 2]`). Use `None`.',
        },
        {
          title: 'Using print() Instead of return',
          buggyCode: 'def double(n):\n    print(n * 2)\nres = double(5) + 1  # TypeError!',
          fixedCode: 'def double(n):\n    return n * 2\nres = double(5) + 1',
          reason:
            'Calling `double(5)` when there is no `return` evaluates to `None`, crashing `None + 1`.',
        },
      ],
      proTip:
        'Pass arguments via `*args` to accept any count (`def sum_all(*nums): return sum(nums)`), and keep functions small enough to understand in one glance.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'def & Return Values',
        subtitle: 'Define reusable functions with clean return paths',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Defining Functions with `def`',
            explanation:
              'Every Python function starts with `def`, followed by parameters in parentheses and a colon `:`. Without an explicit `return`, a function implicitly returns `None`.',
            code: ['def add_xp(cur, bonus):', '    return cur + bonus'],
          },
          {
            type: 'token_builder',
            prompt: 'Declare the function header using `def`.',
            codeLines: ['{{0}} square(n):', '    return n * n'],
            expectedTokens: ['def'],
            distractors: ['func', 'function', 'fn'],
            explanation: 'Python declares functions with `def`, unlike `func` (Go) or `function` (JS).',
            syntaxHint: 'Python uses `def`, never `func` or `function`.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the function to return double `x`.',
            codeLines: ['{{0}} double(x):', '    {{1}} x * 2'],
            expectedTokens: ['def', 'return'],
            distractors: ['func', 'yield', 'print'],
            explanation: '`return` sends `x * 2` back to the caller rather than printing `None`.',
            syntaxHint: 'Printing inside a helper returns `None` to the caller!',
          },
          {
            type: 'token_builder',
            prompt: 'Provide a default multiplier `mult=2` and call cleanly.',
            codeLines: ['{{0}} scale(xp, mult{{1}}2):', '    {{2}} xp * mult'],
            expectedTokens: ['def', '=', 'return'],
            distractors: [':', ':=', 'func'],
            explanation: 'Default parameters bind values with `=` in the signature.',
            syntaxHint: 'Write `mult=2` with `=`, not `: 2`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `res + 5` crashes with a TypeError.',
            lines: [
              'def compute(n):',
              '    print(n * 2)',
              'res = compute(10)',
              'print(res + 5)',
            ],
            bugLine: 1,
            fixed: '    return n * 2',
            explanation: '`compute` only calls `print()`, so `res` receives `None` instead of `20`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: '*args, **kwargs & Scope',
        subtitle: 'Handle flexible arguments and respect LEGB variable scope',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Variable Arguments (`*args`, `**kwargs`)',
            explanation:
              'Prefixing a parameter with `*args` packs extra positional inputs into a tuple. Prefixing with `**kwargs` packs extra keyword arguments into a dict.',
            code: ['def sum_all(*nums):', '    return sum(nums)'],
          },
          {
            type: 'token_builder',
            prompt: 'Accept arbitrary positional numbers using `*args`.',
            codeLines: ['def total({{0}}nums):', '    return sum(nums)'],
            expectedTokens: ['*'],
            distractors: ['&', '...', '**'],
            explanation: 'A single asterisk `*` packs positional arguments into a tuple.',
            syntaxHint: 'JavaScript spreads with `...`; Python uses `*nums`.',
          },
          {
            type: 'token_builder',
            prompt: 'Guard mutable default safely using `None`.',
            codeLines: [
              'def push_tag(tag, bucket={{0}}):',
              '    if bucket is {{1}}:',
              '        bucket = []',
              '    bucket.append(tag)',
              '    return bucket',
            ],
            expectedTokens: ['None', 'None'],
            distractors: ['[]', 'null', 'nil'],
            explanation: 'Using `=None` prevents sharing a single mutable list across all calls!',
            syntaxHint: 'Python spells missing value `None`, not `null` or `nil`.',
          },
          {
            type: 'token_builder',
            prompt: 'Sort a list of dicts by `"xp"` using `lambda`.',
            codeLines: ['devs = [{"xp": 90}, {"xp": 150}]', 'top = sorted(devs, key={{0}} d: d[{{1}}])'],
            expectedTokens: ['lambda', '"xp"'],
            distractors: ['=>', 'def', 'func'],
            explanation: '`lambda d: d["xp"]` creates a lightweight anonymous key extractor.',
            syntaxHint: 'Python inline lambdas use `lambda param: expr`, not `=>`.',
          },
          {
            type: 'predict_output',
            prompt: 'What happens to global `x`?',
            code: ['x = 10', 'def bump():', '    x = 99', 'bump()', 'print(x)'],
            options: ['10', '99', 'UnboundLocalError'],
            answer: 0,
            explanation: '`x = 99` inside `bump()` creates a local variable; outer `x` stays `10`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Functions',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Compute flexible sum and return result cleanly.',
            codeLines: ['{{0}} calc_sum({{1}}vals):', '    {{2}} sum(vals)'],
            expectedTokens: ['def', '*', 'return'],
            distractors: ['func', '...', 'print'],
            explanation: 'Define with `def`, accept variadic args via `*vals`, and `return` cleanly.',
            syntaxHint: 'Remember `*vals` packs arguments into a tuple.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the classic mutable default argument trap.',
            lines: [
              'def add_item(item, box=[]):',
              '    box.append(item)',
              '    return box',
            ],
            bugLine: 0,
            fixed: 'def add_item(item, box=None):',
            explanation: '`box=[]` evaluates once at definition time and leaks state across calls.',
          },
          {
            type: 'predict_output',
            prompt: 'What does calling `fn = lambda a, b=3: a + b` return?',
            code: ['fn = lambda a, b=3: a + b', 'print(fn(7))'],
            options: ['10', '7', 'TypeError'],
            answer: 0,
            explanation: '`a = 7` uses default `b = 3` cleanly, returning `10`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Closures & Lambdas',
        subtitle: 'Pass functions as values and build clean multipliers',
        exercises: [
          {
            type: 'theory_bite',
            title: 'First-Class Functions & Closures',
            explanation:
              'In Python, functions are objects: you can pass them to `sorted()`, `map()`, or return inner functions that remember enclosing variables.',
            code: ['def make_mult(k):', '    return lambda x: x * k'],
          },
          {
            type: 'token_builder',
            prompt: 'Return a lambda closure capturing `factor`.',
            codeLines: ['def scaler(factor):', '    return {{0}} v: v * factor'],
            expectedTokens: ['lambda'],
            distractors: ['def', 'fn', '=>'],
            explanation: 'An inner `lambda` captures `factor` from the enclosing `scaler` scope.',
            syntaxHint: 'Anonymous functions in Python start with keyword `lambda`.',
          },
          {
            type: 'token_builder',
            prompt: 'Sort scores descending using `reverse=True`.',
            codeLines: ['top = sorted(scores, key={{0}} s: s.xp, reverse={{1}})'],
            expectedTokens: ['lambda', 'True'],
            distractors: ['true', 'func', 'DESC'],
            explanation: '`sorted(..., key=lambda ..., reverse=True)` sorts highest to lowest cleanly.',
            syntaxHint: 'Boolean flags in Python always require capital `True`.',
          },
          {
            type: 'token_builder',
            prompt: 'Define an explicit return value inside an inner helper.',
            codeLines: ['{{0}} apply_twice(fn, val):', '    {{1}} fn(fn(val))'],
            expectedTokens: ['def', 'return'],
            distractors: ['func', 'echo', 'yield'],
            explanation: 'Calling `fn(fn(val))` passes the first result directly back into `fn`.',
            syntaxHint: 'Always `return` the composed output.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `triple(4)` print?',
            code: ['def mult(k): return lambda x: x * k', 'triple = mult(3)', 'print(triple(4))'],
            options: ['12', '7', '3'],
            answer: 0,
            explanation: 'Closure `triple` remembers `k = 3`, so `triple(4)` computes `4 * 3 = 12`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss Challenge',
        subtitle: 'Synthesize clean helpers, defaults, and lambdas',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Composable Helpers',
            explanation:
              'Great Python code keeps pure functions small, avoids mutable defaults, and leverages `key=lambda` for clean sorting without boilerplate classes.',
            code: ['def award(base, bonus=0): return base + bonus'],
          },
          {
            type: 'token_builder',
            prompt: 'Write a variadic score calculator with safe fallback.',
            codeLines: [
              '{{0}} total_xp(*rounds, bonus=0):',
              '    {{1}} sum(rounds) + bonus',
            ],
            expectedTokens: ['def', 'return'],
            distractors: ['func', 'print', 'yield'],
            explanation: '`*rounds` collects positional ints and sums them plus `bonus`.',
            syntaxHint: 'Functions return values via `return`.',
          },
          {
            type: 'token_builder',
            prompt: 'Find the top coder with `max()` and a `lambda` key.',
            codeLines: ['mvp = max(roster, key={{0}} p: p[{{1}}])'],
            expectedTokens: ['lambda', '"xp"'],
            distractors: ['func', '=>', 'get'],
            explanation: '`max(..., key=lambda p: p["xp"])` finds the highest-XP coder in one pass.',
            syntaxHint: 'Pass the key string `"xp"` inside `p["xp"]`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the invalid syntax in the lambda sorting call.',
            lines: [
              'items = [("py", 3), ("go", 1)]',
              'res = sorted(items, key=(x) => x[1])',
              'print(res)',
            ],
            bugLine: 1,
            fixed: 'res = sorted(items, key=lambda x: x[1])',
            explanation: 'Python lambdas require `lambda x: x[1]`, never JS arrow `=>`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['def calc(a, b=5): return a + b', 'print(calc(10), calc(10, 1))'],
            options: ['15 11', '15 15', 'TypeError'],
            answer: 0,
            explanation: '`calc(10)` uses default `b=5` (`15`), while `calc(10, 1)` overrides it (`11`).',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 6: Classes & OOP (5 nodes)
  // =========================================================================
  {
    title: 'Classes & OOP',
    subtitle: 'Design blueprints with `class`, `__init__`, `self`, and inheritance.',
    conceptGraphicType: 'classes_oop',
    guidebook: {
      summary:
        'Classes model real-world domain objects by pairing instance data (`self.attr`) with methods inside a blueprint. Python passes the object instance automatically as `self` and lets subclasses extend behavior via `super()`.',
      mentalModel:
        'Writing `hero.gain(20)` silently translates under the hood into `Player.gain(hero, 20)`. Every instance stores its own attributes in its personal `self.__dict__`, separate from shared class attributes.',
      keyTakeaways: [
        'Use PascalCase (`UserProfile`) for class names and always place `self` first in instance methods.',
        '`__init__` initializes fields on a newly created object — never put `return value` inside `__init__`.',
        'Call `super().__init__(...)` in subclasses so parent setup logic never gets skipped or duplicated.',
        'Implement `__repr__` (or `@dataclass`) so objects print cleanly in logs instead of `<Player object at 0x...>`.',
      ],
      keySyntax: [
        {
          title: 'Class Blueprint, __init__ & __repr__',
          tag: 'OOP CORE',
          code: 'class Coder:\n    def __init__(self, name: str, xp: int = 0):\n        self.name = name\n        self.xp = xp\n    def __repr__(self) -> str:\n        return f"Coder({self.name}, {self.xp}xp)"\n\nprint(Coder("Zayd", 120))',
          output: 'Coder(Zayd, 120xp)',
          explanation:
            'Python runs `__init__` automatically on `Coder(...)` creation and calls `__repr__` when printing.',
          notes: [
            'Prefix attributes with `_` (e.g. `self._hp`) as a convention to mark internal state.',
          ],
        },
        {
          title: 'Inheritance & super() Delegation',
          tag: 'SUBCLASS',
          code: 'class ProCoder(Coder):\n    def __init__(self, name: str, lang: str):\n        super().__init__(name, xp=100)\n        self.lang = lang\n\np = ProCoder("Lina", "Python")\nprint(p.name, p.xp, p.lang)',
          output: 'Lina 100 Python',
          explanation:
            '`super()` invokes the base class method cleanly while letting the subclass attach specialized attributes.',
          notes: [
            'Check runtime inheritance with `isinstance(p, Coder)` (`True`).',
          ],
        },
        {
          title: 'Instance Methods Mutating State',
          tag: 'METHODS',
          code: 'class Streak:\n    def __init__(self):\n        self.days = 0\n    def bump(self):\n        self.days += 1\n        return self.days\n\ns = Streak()\nprint(s.bump(), s.bump())',
          output: '1 2',
          explanation:
            'Methods read and update `self.days` directly on that specific `Streak` object.',
          notes: [
            'Two separate `Streak()` instances keep completely independent `days` counters.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting self in Method Parameters',
          buggyCode: 'class Counter:\n    def reset():\n        self.val = 0',
          fixedCode: 'class Counter:\n    def reset(self):\n        self.val = 0',
          reason:
            'Python passes the instance implicitly as arg #1; omitting `self` raises `TypeError: takes 0 positional arguments`.',
        },
        {
          title: 'Mutable Class Attribute Shared Across All Objects',
          buggyCode: 'class Team:\n    members = []  # Shared across ALL teams!',
          fixedCode: 'class Team:\n    def __init__(self):\n        self.members = []',
          reason:
            'Lists defined directly inside `class Team:` belong to the class template, not individual instances. Initialize per-instance lists in `__init__`.',
        },
      ],
      proTip:
        'For simple data-holding classes, `from dataclasses import dataclass` generates `__init__`, `__repr__`, and `==` comparisons automatically with zero boilerplate.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'class & __init__',
        subtitle: 'Initialize instance attributes cleanly via self',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Blueprints with `class` & `self`',
            explanation:
              'Methods in a Python class explicitly accept `self` as their first parameter to reference the active object instance. Python calls `__init__` automatically when constructing `Coder("Tarek")`.',
            code: ['class Coder:', '    def __init__(self, xp):', '        self.xp = xp'],
          },
          {
            type: 'token_builder',
            prompt: 'Declare the `Hero` class header cleanly.',
            codeLines: ['{{0}} Hero:', '    def __init__(self, name):', '        self.name = name'],
            expectedTokens: ['class'],
            distractors: ['struct', 'type', 'interface'],
            explanation: 'Python OOP types start with keyword `class`.',
            syntaxHint: 'Unlike Go (`struct`) or TypeScript (`interface`), Python uses `class`.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the constructor signature and store `xp`.',
            codeLines: ['class Player:', '    def {{0}}(self, xp):', '        {{1}}.xp = xp'],
            expectedTokens: ['__init__', 'self'],
            distractors: ['constructor', 'this', 'init'],
            explanation: 'Constructors in Python are named `__init__` (double underscores) and use `self`.',
            syntaxHint: '`constructor` and `this` belong to JavaScript; Python uses `__init__` and `self`.',
          },
          {
            type: 'token_builder',
            prompt: 'Add a method that increments instance XP and prints it.',
            codeLines: [
              '    def gain({{0}}, pts):',
              '        {{1}}.xp += pts',
              '        {{2}} self.xp',
            ],
            expectedTokens: ['self', 'self', 'return'],
            distractors: ['this', 'yield', 'cls'],
            explanation: 'Every regular instance method accepts `self` first and reads fields via `self.`.',
            syntaxHint: '`cls` is for `@classmethod`, not instance methods.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why calling `c.level_up()` crashes.',
            lines: [
              'class Coder:',
              '    xp = 0',
              '    def level_up():',
              '        self.xp += 10',
            ],
            bugLine: 2,
            fixed: '    def level_up(self):',
            explanation: 'Instance method `level_up` forgot `self` in its parameter list.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Methods & __repr__',
        subtitle: 'Customize object formatting and encapsulate state',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Readable Objects with `__repr__`',
            explanation:
              'Implementing `__repr__(self)` gives objects clean developer output in debuggers and logs instead of `<Coder object at 0x...>`.',
            code: ['class Node:', '    def __repr__(self):', '        return f"Node(xp={self.xp})"'],
          },
          {
            type: 'token_builder',
            prompt: 'Implement `__repr__` returning an f-string summary.',
            codeLines: [
              'class Gem:',
              '    def __init__(self, n): self.n = n',
              '    def {{0}}(self):',
              '        return {{1}}"Gem({self.n})"',
            ],
            expectedTokens: ['__repr__', 'f'],
            distractors: ['toString', '$', '__print__'],
            explanation: '`__repr__` controls how `print([gem])` and debug logs display the instance.',
            syntaxHint: '`toString` is Java/JS; Python uses `__repr__` or `__str__`.',
          },
          {
            type: 'token_builder',
            prompt: 'Instantiate without `new` and call `.status()`.',
            codeLines: ['class Bot:', '    def __init__(self, id): self.id = id', 'b = {{0}}(42)', 'print(b.id)'],
            expectedTokens: ['Bot'],
            distractors: ['new Bot', 'create', 'Bot.new'],
            explanation: 'Python instantiates classes directly as callables (`Bot(42)`), never with `new`.',
            syntaxHint: '`new Bot(42)` raises a `SyntaxError` in Python.',
            output: '42',
          },
          {
            type: 'token_builder',
            prompt: 'Mark a read-only computed attribute cleanly using `@property`.',
            codeLines: ['class Profile:', '    {{0}}', '    def level(self):', '        return self.xp // 100'],
            expectedTokens: ['@property'],
            distractors: ['@getter', '@readonly', 'get'],
            explanation: '`@property` lets callers read `user.level` without parentheses.',
            syntaxHint: 'Python exposes computed getters via the built-in `@property` decorator.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: [
              'class Bag:',
              '    def __init__(self, n=1): self.n = n',
              '    def add(self): self.n += 2',
              'b = Bag()',
              'b.add()',
              'print(b.n)',
            ],
            options: ['3', '2', '1'],
            answer: 0,
            explanation: '`Bag()` starts with `n=1`; `.add()` increments it to `3`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: OOP Core',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Define constructor `Task` and instantiate it properly.',
            codeLines: [
              '{{0}} Task:',
              '    def {{1}}(self, done=False): self.done = done',
              't = {{2}}(True)',
            ],
            expectedTokens: ['class', '__init__', 'Task'],
            distractors: ['struct', 'constructor', 'new Task'],
            explanation: 'Define `class Task`, constructor `__init__`, and instantiate as `Task(True)`.',
            syntaxHint: 'Never prefix Python constructors with `new`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the JS syntax leak in this Python class.',
            lines: [
              'class Wallet:',
              '    def __init__(self, gems):',
              '        this.gems = gems',
            ],
            bugLine: 2,
            fixed: '        self.gems = gems',
            explanation: 'Inside Python methods, instance attributes live on `self`, not `this`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `@property` let you read cleanly?',
            code: [
              'class Streak:',
              '    def __init__(self, d): self.days = d',
              '    @property',
              '    def weeks(self): return self.days // 7',
              'print(Streak(14).weeks)',
            ],
            options: ['2', '<bound method>', 'TypeError'],
            answer: 0,
            explanation: '`@property` runs `weeks(self)` transparently on attribute read (`14 // 7 = 2`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Inheritance & super()',
        subtitle: 'Extend base classes cleanly without duplicating setup',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Subclassing & `super()`',
            explanation:
              'Pass the parent class inside parentheses (`class Child(Parent):`) to inherit its methods. Inside `__init__`, invoke `super().__init__(...)` to initialize inherited fields cleanly.',
            code: ['class ProUser(User):', '    def __init__(self, name, tier):', '        super().__init__(name)', '        self.tier = tier'],
          },
          {
            type: 'token_builder',
            prompt: 'Inherit `PythonDev` from base class `Coder`.',
            codeLines: ['{{0}} PythonDev({{1}}):', '    pass'],
            expectedTokens: ['class', 'Coder'],
            distractors: ['extends', 'implements', 'struct'],
            explanation: 'Python inherits by placing the parent inside parentheses `class Sub(Base):`.',
            syntaxHint: 'Python does not use `extends`; pass the parent inside `(...)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Delegate name initialization to the base class with `super()`.',
            codeLines: [
              'class Boss(Entity):',
              '    def __init__(self, hp, shield):',
              '        {{0}}().{{1}}(hp)',
              '        self.shield = shield',
            ],
            expectedTokens: ['super', '__init__'],
            distractors: ['parent', 'base', 'this'],
            explanation: '`super().__init__(hp)` avoids repeating `Entity.__init__` wiring.',
            syntaxHint: 'Do not pass `self` inside `super().__init__(hp)` in Python 3.',
          },
          {
            type: 'token_builder',
            prompt: 'Check object type relationship cleanly at runtime.',
            codeLines: ['b = Boss(100, 50)', 'print({{0}}(b, {{1}}))'],
            expectedTokens: ['isinstance', 'Entity'],
            distractors: ['instanceof', 'typeof', 'subclass'],
            explanation: '`isinstance(obj, Class)` respects inheritance (`True` for `Entity`).',
            syntaxHint: '`instanceof` belongs to JS/Java; Python uses `isinstance(obj, Cls)`.',
            output: 'True',
          },
          {
            type: 'predict_output',
            prompt: 'What does overriding `xp_bonus()` print?',
            code: [
              'class User: def bonus(self): return 10',
              'class Pro(User): def bonus(self): return 25',
              'print(Pro().bonus())',
            ],
            options: ['25', '10', 'AttributeError'],
            answer: 0,
            explanation: 'Subclass `Pro` overrides `bonus()`, so `Pro().bonus()` evaluates to `25`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Python Mastery Boss',
        subtitle: 'Architect a clean class hierarchy end to end',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Final Boss: Clean Pythonic Design',
            explanation:
              'Complete your Python track by assembling classes, `super()` inheritance, `@property`, and clear `__repr__` formatting.',
            code: ['class Course(Track):', '    def __init__(self, id): super().__init__(id)'],
          },
          {
            type: 'token_builder',
            prompt: 'Build `Badge` constructor and clean debug string.',
            codeLines: [
              '{{0}} Badge:',
              '    def {{1}}(self, title): self.title = title',
              '    def {{2}}(self): return f"<{self.title}>"',
            ],
            expectedTokens: ['class', '__init__', '__repr__'],
            distractors: ['struct', 'constructor', 'toString'],
            explanation: '`__init__` binds `title` and `__repr__` gives clean string formatting.',
            syntaxHint: 'Use standard dunder names `__init__` and `__repr__`.',
          },
          {
            type: 'token_builder',
            prompt: 'Extend `Badge` and invoke `super().__init__()`.',
            codeLines: [
              'class RareBadge(Badge):',
              '    def __init__(self, title, xp):',
              '        {{0}}().{{1}}(title)',
              '        self.xp = xp',
            ],
            expectedTokens: ['super', '__init__'],
            distractors: ['base', 'parent', 'self'],
            explanation: '`super().__init__(title)` sets the inherited title attribute cleanly.',
            syntaxHint: 'Python 3 calls `super()` with empty parentheses.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the invalid `new` instantiation error.',
            lines: [
              'class Course:',
              '    def __init__(self, lang): self.lang = lang',
              'py = new Course("Python")',
            ],
            bugLine: 2,
            fixed: 'py = Course("Python")',
            explanation: 'Python creates objects by calling `Course("Python")` without `new`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed at the end of Python OOP?',
            code: [
              'class Counter:',
              '    def __init__(self): self.v = 1',
              '    def bump(self): self.v *= 5',
              'c = Counter(); c.bump(); print(c.v)',
            ],
            options: ['5', '1', 'AttributeError'],
            answer: 0,
            explanation: '`Counter()` sets `v = 1`; `.bump()` multiplies it by `5`.',
          },
        ],
      },
    ],
  },
];
