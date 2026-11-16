import type { UnitSeed } from './types';

export const GO_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: First Steps in Go (6 nodes)
  // =========================================================================
  {
    title: 'First Steps in Go',
    subtitle: 'Display messages, create variables with :=, and work with simple values.',
    conceptGraphicType: 'go_vars',
    guidebook: {
      summary:
        'Go is statically typed, compiled, and intentionally minimal: no semicolons, strict unused-import/variable checks, and clean short variable declarations (`:=`) inside functions. Display formatted text via the standard `"fmt"` package (`fmt.Println`, `fmt.Printf`).',
      mentalModel:
        'Use `:=` ONLY when declaring at least one brand-new variable inside a function. Once a variable exists (`score := 10`), updates use `=` (`score = 20`). Unused variables and imports are hard compile errors in Go!',
      keyTakeaways: [
        'Short assignment `:=` declares + infers type in one step inside functions; package-level globals require `var` or `const`.',
        'Capitalized identifiers (`fmt.Println`, `User.Name`) are exported publicly outside a package; lowercase are package-private.',
        'Every uninitialized Go variable starts safely at its zero value (`0`, `""`, `false`) — never garbage memory.',
        'String + int addition is invalid (`"XP: " + 10` fails compile); use `fmt.Printf` or comma args in `fmt.Println`.',
      ],
      keySyntax: [
        {
          title: 'Formatted Output (`Println` vs `Printf`)',
          tag: 'FMT',
          code: 'name := "Rami"\nxp := 120\nfmt.Println("Hero:", name)\nfmt.Printf("%s has %d XP\\n", name, xp)',
          output: 'Hero: Rami\nRami has 120 XP',
          explanation:
            '`Println` inserts spaces between args and appends a newline; `Printf` formats verbs like `%s` (string), `%d` (int), and `%v` (any value).',
          notes: [
            'Keep `fmt.Sprintf(...)` handy to build formatted strings without printing yet.',
          ],
        },
        {
          title: 'Short Declaration (:=), Zero Values & Const',
          tag: 'VARIABLES',
          code: 'const maxLevel = 99\nvar bonus int  // zero value: 0\nscore := 40\nscore += bonus + 10\nfmt.Println(score, maxLevel)',
          output: '50 99',
          explanation:
            'Uninitialized variables cleanly start at zero (`0` for ints, `""` for strings, `false` for bools), preventing uninitialized bugs.',
          notes: [
            'Go infers `40` as `int` and `3.14` as `float64` automatically.',
          ],
        },
        {
          title: 'Explicit Type Conversions',
          tag: 'TYPES',
          code: 'a := 5\nb := 2\nratio := float64(a) / float64(b)\nfmt.Println(a/b, ratio)',
          output: '2 2.5',
          explanation:
            'Go rejects implicit numeric mixing (`int + float64` won’t compile). Convert explicitly with `float64(a)`.',
          notes: [
            'Int-to-string needs `strconv.Itoa(n)` — `string(65)` actually produces `"A"` (Unicode rune)!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Re-Using := on an Existing Variable',
          buggyCode: 'xp := 10\nxp := 20  // Compile error: no new variables!',
          fixedCode: 'xp := 10\nxp = 20',
          reason:
            '`:=` declares new variables; updates must use plain `=`. Exception: multi-return `v, err := fn()` allows overwriting `err` if `v` is new.',
        },
        {
          title: 'Leaving Unused Variables or Imports',
          buggyCode: 'bonus := 15\nfmt.Println("Ready") // Fails compile!',
          fixedCode: '_ = bonus // Or remove unused var\nfmt.Println("Ready")',
          reason:
            'Go treats unused locals and imports as compile errors to keep codebases fast and dead-code free. Discard deliberately with `_`.',
        },
      ],
      proTip:
        'Check any value’s Go syntax representation during debugging using `fmt.Printf("%#v\\n", val)` — it prints field names, quotes, and types cleanly!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Saying Hello',
        subtitle: 'Display words and messages with fmt.Println()',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Your First Go Output',
            explanation:
              'Go displays messages on the screen using `fmt.Println()`. Wrap words in quotes `" "` so Go knows it is text, and notice `Println` starts with a capital `P`.',
            code: ['fmt.Println("Hello, World!")'],
            output: 'Hello, World!',
            highlightNote: 'Go requires capital `P` in `fmt.Println`.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the command to show `"Hello Go"` on screen.',
            codeLines: ['{{0}}.{{1}}("Hello Go")'],
            expectedTokens: ['fmt', 'Println'],
            distractors: ['std', 'println', 'print'],
            explanation: 'In Go, `fmt.Println(...)` prints a line cleanly to the screen.',
            syntaxHint: 'Remember uppercase `P` in `Println`.',
            output: 'Hello Go',
          },
          {
            type: 'token_builder',
            prompt: 'Print a friendly welcome message inside quotes.',
            codeLines: ['fmt.Println({{0}})'],
            expectedTokens: ['"Welcome!"'],
            distractors: ['Welcome', 'show', 'print'],
            explanation: 'Wrap text in quotes `"..."` inside `fmt.Println(...)`.',
            syntaxHint: 'Text always goes inside double quotes `" "`.',
            output: 'Welcome!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line using lowercase `println` instead of `Println`.',
            lines: [
              'fmt.Println("Starting...")',
              'fmt.println("Hello")',
              'fmt.Println("Done!")',
            ],
            bugLine: 1,
            fixed: 'fmt.Println("Hello")',
            explanation: 'In Go, `fmt.Println` must start with a capital `P`.',
          },
          {
            type: 'predict_output',
            prompt: 'What appears on screen?',
            code: ['fmt.Println("CodeLingo")'],
            options: ['CodeLingo', '"CodeLingo"', 'Println'],
            answer: 0,
            explanation: '`fmt.Println()` displays the characters inside the quotes without showing quote marks.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Creating Variables',
        subtitle: 'Create labeled boxes quickly with :=',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Creating Variables with :=',
            explanation:
              'Think of a variable as a labeled box holding a value. Inside functions, Go lets you create a variable in one clean step using `:=`.',
            code: ['name := "Tarek"', 'score := 10', 'fmt.Println(name)'],
            output: 'Tarek',
            highlightNote: 'Pass the variable name without quotes (`fmt.Println(name)`) to show its value.',
          },
          {
            type: 'token_builder',
            prompt: 'Create a new variable `score` holding `25`.',
            codeLines: ['score {{0}} 25'],
            expectedTokens: [':='],
            distractors: ['let', '==', '->'],
            explanation: '`:=` creates a new variable and stores `25` in it.',
            syntaxHint: 'When creating a variable for the first time in Go, use `:=`.',
          },
          {
            type: 'token_builder',
            prompt: 'Save `"Ada"` in `player` and print what is inside.',
            codeLines: ['player {{0}} "Ada"', 'fmt.Println({{1}})'],
            expectedTokens: [':=', 'player'],
            distractors: ['=', '"player"', 'var'],
            explanation: 'Create `player` with `:=`, then display its value with `fmt.Println(player)`.',
            syntaxHint: 'Do not put quotes around `player` when printing its value!',
            output: 'Ada',
          },
          {
            type: 'token_builder',
            prompt: 'Store `"Paris"` in `city` and print it on screen.',
            codeLines: ['{{0}} := "Paris"', '{{1}}.Println(city)'],
            expectedTokens: ['city', 'fmt'],
            distractors: ['"city"', 'print', 'std'],
            explanation: 'Create `city := "Paris"` and output it with `fmt.Println(city)`.',
            syntaxHint: 'Match the variable name `city` and package `fmt`.',
            output: 'Paris',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Go snippet display?',
            code: ['pet := "Cat"', 'fmt.Println(pet)'],
            options: ['Cat', 'pet', '"pet"'],
            answer: 0,
            explanation: 'Without quotes around `pet`, `fmt.Println(pet)` prints what is stored inside `pet`: `Cat`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Updating & Using Variables',
        subtitle: 'Tell := apart from = when changing stored values',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Create Once with :=, Update with =',
            explanation:
              'Once a variable is created using `:=`, update it later using plain `=`. And remember: `fmt.Println(score)` shows the number inside, while `fmt.Println("score")` prints the literal word `score`.',
            code: ['score := 10', 'score = score + 5', 'fmt.Println(score)'],
            output: '15',
            highlightNote: 'Use `:=` to create a box, and `=` to change what is inside.',
          },
          {
            type: 'token_builder',
            prompt: 'Add `5` to existing variable `score` using `=`.',
            codeLines: ['score := 10', 'score {{0}} score {{1}} 5'],
            expectedTokens: ['=', '+'],
            distractors: [':=', '==', 'and'],
            explanation: 'Since `score` already exists, update it cleanly using `=` instead of `:=`.',
            syntaxHint: 'Only use `:=` when creating a brand new variable!',
          },
          {
            type: 'token_builder',
            prompt: 'Change `coins` to `30` and print its new value.',
            codeLines: ['coins := 10', '{{0}} = 30', 'fmt.Println({{1}})'],
            expectedTokens: ['coins', 'coins'],
            distractors: [':=', '"coins"', 'coin'],
            explanation: '`coins = 30` updates the stored number, and `fmt.Println(coins)` prints `30`.',
            syntaxHint: 'Leave quotes off `coins` when passing it to `fmt.Println()`.',
            output: '30',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line that wrongly uses `:=` a second time on `score`.',
            lines: [
              'score := 10',
              'score := 20',
              'fmt.Println(score)',
            ],
            bugLine: 1,
            fixed: 'score = 20',
            explanation: '`score` already exists! Replace `:=` with `=` to update its value.',
          },
          {
            type: 'predict_output',
            prompt: 'What number prints at the end?',
            code: ['gems := 10', 'gems = gems + 5', 'fmt.Println(gems)'],
            options: ['15', '10', '10 + 5'],
            answer: 0,
            explanation: '`gems` starts at `10`, updates cleanly with `=` to `15`, and prints `15`.',
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
            prompt: 'Create `level` as `12`, update it to add `1`, and print it.',
            codeLines: ['level {{0}} 12', 'level {{1}} level + 1', 'fmt.Println(level)'],
            expectedTokens: [':=', '='],
            distractors: ['==', 'var', 'let'],
            explanation: 'Create with `:=` on line 1, then update with `=` on line 2.',
            syntaxHint: 'Remember: `:=` creates, `=` updates.',
            output: '13',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the line printing `"xp"` as text instead of its number.',
            lines: [
              'xp := 40',
              'fmt.Println("xp")',
            ],
            bugLine: 1,
            fixed: 'fmt.Println(xp)',
            explanation: 'Remove quotes around `xp` so Go prints `40` instead of the literal word.',
          },
          {
            type: 'predict_output',
            prompt: 'What prints after updating `x`?',
            code: ['x := 4', 'x = x + 3', 'fmt.Println(x)'],
            options: ['7', '4', '43'],
            answer: 0,
            explanation: '`x` becomes `4 + 3`, displaying `7`.',
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
              'Numbers (`10`, `3.5`) have NO quotes and add like normal math (`10 + 5` is `15`). Putting `" "` around digits makes them text, so `"10" + "5"` glues words together into `"105"`.',
            code: ['fmt.Println(10 + 5)', 'fmt.Println("10" + "5")'],
            output: ['15', '105'],
            highlightNote: 'Pass `"Score:"` and `score` separated by a comma in `fmt.Println("Score:", score)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Store numeric `age` (no quotes) and text `word` (with quotes).',
            codeLines: ['age := {{0}}', 'word := {{1}}'],
            expectedTokens: ['18', '"Hi"'],
            distractors: ['"18"', 'Hi', 'let'],
            explanation: 'Numbers omit quotes (`18`); words use double quotes (`"Hi"`).',
            syntaxHint: 'Check which value belongs inside quotes `" "`!',
          },
          {
            type: 'token_builder',
            prompt: 'Add `price` and `tax` cleanly and print `total`.',
            codeLines: ['price := 20', 'tax := 4', 'total := price {{0}} tax', '{{1}}.Println(total)'],
            expectedTokens: ['+', 'fmt'],
            distractors: [',', 'print', '='],
            explanation: 'Adding `price + tax` computes `24`, shown via `fmt.Println(total)`.',
            syntaxHint: 'Add with `+` and output with `fmt.Println`.',
            output: '24',
          },
          {
            type: 'token_builder',
            prompt: 'Print label `"Stars:"` followed by variable `stars`.',
            codeLines: ['stars := 3', 'fmt.Println("Stars:"{{0}} {{1}})'],
            expectedTokens: [',', 'stars'],
            distractors: ['+', '"stars"', ';'],
            explanation: 'A comma in `fmt.Println("Stars:", stars)` automatically prints a space between them.',
            syntaxHint: 'Separate arguments with `,` and pass `stars` without quotes.',
            output: 'Stars: 3',
          },
          {
            type: 'predict_output',
            prompt: 'What does joining `"4"` + `"2"` output?',
            code: ['fmt.Println("4" + "2")'],
            options: ['42', '6', '"4" + "2"'],
            answer: 0,
            explanation: 'Because `"4"` and `"2"` wear quotes, they are text! `+` glues text into `42`, not `6`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss Challenge',
        subtitle: 'Put printing, := variables, updates, and numbers & text together',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Unit 1 Recap',
            explanation:
              'Great progress! You can print with `fmt.Println()`, create variables with `:=`, update them with `=`, and print labels next to numbers.',
            code: ['hero := "Tarek"', 'xp := 20', 'xp = xp + 5', 'fmt.Println(hero, xp)'],
            output: 'Tarek 25',
          },
          {
            type: 'token_builder',
            prompt: 'Create `xp` at `50`, add `25` using `=`, and print `xp`.',
            codeLines: ['xp {{0}} 50', 'xp {{1}} xp + 25', 'fmt.Println({{2}})'],
            expectedTokens: [':=', '=', 'xp'],
            distractors: ['"xp"', '==', 'let'],
            explanation: 'Declare `xp := 50`, update `xp = xp + 25`, and print `xp` (`75`).',
            syntaxHint: 'Remember `:=` to create, `=` to update, and no quotes on `xp`!',
            output: '75',
          },
          {
            type: 'token_builder',
            prompt: 'Print `"Rank:"` followed by variable `rank`.',
            codeLines: ['rank := 1', 'fmt.{{0}}("Rank:"{{1}} rank)'],
            expectedTokens: ['Println', ','],
            distractors: ['println', '+', 'echo'],
            explanation: 'Use capital `Println` and separate items with a comma `,`.',
            syntaxHint: 'Always capitalize `Println` in `fmt.Println(...)`.',
            output: 'Rank: 1',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line wrongly reusing `:=` instead of `=`.',
            lines: [
              'coins := 10',
              'coins := coins + 5',
              'fmt.Println(coins)',
            ],
            bugLine: 1,
            fixed: 'coins = coins + 5',
            explanation: '`coins` already exists; change `:=` to `=` to update it.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this final Unit 1 challenge print?',
            code: ['gems := 5', 'gems = gems + 10', 'fmt.Println("Gems:", gems)'],
            options: ['Gems: 15', 'Gems: 5', 'Gems: gems'],
            answer: 0,
            explanation: '`gems` updates to `15`, and `fmt.Println("Gems:", gems)` outputs `Gems: 15`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: For Range Loops & Switch (5 nodes)
  // =========================================================================
  {
    title: 'For Range Loops & Switch',
    subtitle: 'Master Go’s single loop keyword `for`, `range`, and break-free `switch`.',
    conceptGraphicType: 'go_range',
    guidebook: {
      summary:
        'Go simplifies control flow aggressively: there are no parentheses `()` around conditions, opening `{` braces MUST stay on the same line, `for` is the single loop keyword, and `switch` cases never fall through unless asked.',
      mentalModel:
        '`for` covers every iteration pattern in Go: 3-part C-loops (`for i := 0; i < n; i++`), condition-only while loops (`for hp > 0`), infinite loops (`for {}`), and collection scanning (`for i, v := range list`).',
      keyTakeaways: [
        'Go supports inline init inside `if`: `if val, ok := m[k]; ok { ... }` scopes `val` cleanly to that `if/else`.',
        'Discard unwanted `range` indices with the blank identifier: `for _, v := range items` (avoids unused error).',
        'Every `switch` case breaks automatically — list comma values (`case "S", "A":`) instead of stacking blank cases!',
        'Keep the opening curly brace `{` on the SAME line as `if`/`for`/`switch` — Go’s lexer inserts semicolons automatically on line breaks.',
      ],
      keySyntax: [
        {
          title: 'All Four Forms of `for` & `range`',
          tag: 'LOOPS',
          code: 'nums := []int{10, 20, 30}\nsum := 0\nfor _, v := range nums {\n    sum += v\n}\nfmt.Println("Total:", sum)',
          output: 'Total: 60',
          explanation:
            '`range` returns `(index, copyOfValue)` on slices/arrays cleanly; `_` discards the unused index.',
          notes: [
            'Condition-only while equivalent: `for tries < 3 { tries++ }`.',
          ],
        },
        {
          title: 'if with Scoped Init Statement',
          tag: 'BRANCHING',
          code: 'xp := 85\nif diff := 100 - xp; diff > 0 {\n    fmt.Println(diff, "to go")\n}',
          output: '15 to go',
          explanation:
            '`diff` lives strictly inside the `if/else` block, keeping outer function scope uncluttered.',
          notes: [
            'This idiom is everywhere in Go error handling: `if err := run(); err != nil { return err }`.',
          ],
        },
        {
          title: 'Multi-Value & Tagless `switch`',
          tag: 'SWITCH',
          code: 'xp := 92\nswitch {\ncase xp >= 90:\n    fmt.Println("Tier S")\ncase xp >= 70:\n    fmt.Println("Tier A")\ndefault:\n    fmt.Println("Tier B")\n}',
          output: 'Tier S',
          explanation:
            'A conditionless `switch {}` replaces messy `if / else if` chains cleanly and stops automatically after the first match.',
          notes: [
            'Multiple matches on one case use commas: `case "py", "go":`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Placing Opening { on a New Line',
          buggyCode: 'if hp > 0\n{\n    fmt.Println("OK")\n}',
          fixedCode: 'if hp > 0 {\n    fmt.Println("OK")\n}',
          reason:
            'Go automatically inserts `;` at the end of `if hp > 0` if `{` drops to the next line, causing a syntax error.',
        },
        {
          title: 'Modifying the Value Copy in for-range',
          buggyCode: 'for _, x := range nums {\n    x *= 2 // Mutates local copy only!\n}',
          fixedCode: 'for i := range nums {\n    nums[i] *= 2\n}',
          reason:
            '`range` copies each element into `x`; index `nums[i]` when you want to mutate elements stored inside the slice.',
        },
      ],
      proTip:
        'Go 1.22+ gives each iteration of `for i, v := range slice` its own fresh loop variable copy, preventing the classic closure capture bug automatically!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Only One Loop: for',
        subtitle: 'Write C-style, while-style, and if-init conditions cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Every Loop in Go Is `for`',
            explanation:
              'Go drops `while` and `do-while` completely, leaving a single clean keyword: `for`. Omit outer parentheses `()` — opening `{` stays on the same line!',
            code: ['for i := 0; i < 3; i++ { }', 'for running { step() }'],
          },
          {
            type: 'token_builder',
            prompt: 'Write a Go while-style loop without using `while`.',
            codeLines: ['lives := 3', '{{0}} lives > 0 {', '    lives--', '}'],
            expectedTokens: ['for'],
            distractors: ['while', 'until', 'loop'],
            explanation: '`for cond { ... }` serves cleanly as Go’s `while` loop.',
            syntaxHint: '`while` is not even a valid keyword in Go!',
          },
          {
            type: 'token_builder',
            prompt: 'Write a classic 3-clause Go loop with `:=`.',
            codeLines: ['for i {{0}} 0; i < 4; i{{1}} {', '    sum += i', '}'],
            expectedTokens: [':=', '++'],
            distractors: ['=', 'in', '+=1'],
            explanation: 'Loop counters declare inline via `i := 0` and increment with `i++` (note `++` is a statement only, postfix `i++`!).',
            syntaxHint: 'Go forbids prefix `++i` — only `i++` and `i--` compile.',
          },
          {
            type: 'token_builder',
            prompt: 'Scope a temporary error right inside an `if` header.',
            codeLines: ['if err {{0}} ping(); err != {{1}} {', '    log(err)', '}'],
            expectedTokens: [':=', 'nil'],
            distractors: ['=', 'null', ';'],
            explanation: '`if init; cond` scopes `err` narrowly inside the `if / else` block cleanly.',
            syntaxHint: 'Semicolon separates init statement from condition in Go `if` headers.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the invalid brace placement / `while` syntax error.',
            lines: [
              'n := 5',
              'while n > 0 {',
              '    n--',
              '}',
            ],
            bugLine: 1,
            fixed: 'for n > 0 {',
            explanation: 'Replace `while` with `for` in Go.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Range Iteration (for range)',
        subtitle: 'Unpack index + value tuples cleanly with range',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Iterating Slices & Strings with `range`',
            explanation:
              '`for i, v := range slice` yields both index `i` and a value copy `v`. Notice: because `v` is a copy, mutating `v` won’t edit the slice unless you assign `slice[i]`!',
            code: ['for _, s := range scores {', '    total += s', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Sum values while discarding unused index cleanly.',
            codeLines: ['for {{0}}, v := {{1}} scores {', '    sum += v', '}'],
            expectedTokens: ['_', 'range'],
            distractors: ['i', 'in', 'of'],
            explanation: 'Write `_` to skip index `i`, paired with Go’s `range` keyword.',
            syntaxHint: 'Naming `i` without referencing it fails Go compilation!',
          },
          {
            type: 'token_builder',
            prompt: 'Iterate keys and values cleanly over a Go map.',
            codeLines: ['xpMap := map[string]int{"py": 90, "go": 80}', 'for lang, xp {{0}} {{1}} xpMap {', '    fmt.Println(lang, xp)', '}'],
            expectedTokens: [':=', 'range'],
            distractors: ['=', 'in', 'each'],
            explanation: '`for k, v := range myMap` iterates keys & values directly.',
            syntaxHint: 'Remember map iteration order in Go is randomized!',
          },
          {
            type: 'token_builder',
            prompt: 'Loop only using the index `i` without `_` needed.',
            codeLines: ['for i {{0}} range items {', '    items[i] *= 2', '}'],
            expectedTokens: [':='],
            distractors: ['=', 'in', ':'],
            explanation: 'If you only need index `i`, omit `, v` cleanly: `for i := range items`.',
            syntaxHint: 'Assigning `items[i] *= 2` directly updates elements inside the slice!',
          },
          {
            type: 'predict_output',
            prompt: 'Does mutating range copy `v` modify the slice?',
            code: [
              'nums := []int{1, 2}',
              'for _, v := range nums { v *= 10 }',
              'fmt.Println(nums[0])',
            ],
            options: ['1', '10', 'Compile error'],
            answer: 0,
            explanation: '`v` in `range` is a value copy — mutating `v` does not update `nums[0]`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Range & Control',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Double every element in place using `range` index.',
            codeLines: ['for i := {{0}} vals {', '    vals[i] {{1}} 2', '}'],
            expectedTokens: ['range', '*='],
            distractors: ['in', 'v', '=='],
            explanation: 'Use `for i := range vals` when mutating `vals[i]` directly in place.',
            syntaxHint: 'Mutating the second variable `v` only updates a temporary copy!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the unused-variable compile error inside `range`.',
            lines: [
              'sum := 0',
              'for idx, val := range []int{10, 20} {',
              '    sum += val',
              '}',
            ],
            bugLine: 1,
            fixed: 'for _, val := range []int{10, 20} {',
            explanation: '`idx` is declared with `:=` yet never used in the loop body — replace with `_`.',
          },
          {
            type: 'predict_output',
            prompt: 'Watch automatic switch break! What prints?',
            code: ['rank := 1', 'res := 0', 'switch rank { case 1: res = 10; case 2: res = 20 }', 'fmt.Println(res)'],
            options: ['10', '20', '30'],
            answer: 0,
            explanation: 'Go `switch` cases break automatically at the end of `case 1` (`10`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Clean Switch Statements',
        subtitle: 'Match strings, multi-values, and tagless conditions without break',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Tagless & Multi-Value `switch`',
            explanation:
              'Go `switch` works cleanly on strings, accepts comma lists (`case "js", "ts":`), requires zero `break`, and even acts like clean `if/else-if` chains via tagless `switch {}`!',
            code: ['switch {', 'case xp >= 1000: return "Obsidian"', 'default: return "Bronze"', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Match multiple language labels on one clean case line.',
            codeLines: ['switch lang {', '{{0}} "py", "go":', '    fmt.Println("Backend")', '{{1}}:', '    fmt.Println("Other")', '}'],
            expectedTokens: ['case', 'default'],
            distractors: ['when', 'else', 'break'],
            explanation: 'Comma-separated cases replace redundant fallthrough lines cleanly.',
            syntaxHint: 'No `break` needed at the end of `case` in Go!',
          },
          {
            type: 'token_builder',
            prompt: 'Use tagless `switch` as clean multi-condition guard.',
            codeLines: ['{{0}} {', '{{1}} speed > 80:', '    tag = "Fast"', 'default:', '    tag = "Normal"', '}'],
            expectedTokens: ['switch', 'case'],
            distractors: ['if', 'elif', 'match'],
            explanation: 'Tagless `switch { case cond: ... }` evaluates boolean cases cleanly top to bottom.',
            syntaxHint: 'Omit condition after `switch` to write readable condition guards.',
          },
          {
            type: 'token_builder',
            prompt: 'Break out of an outer loop cleanly using label `outer:`.',
            codeLines: ['outer:', 'for i := 0; i < 3; i++ {', '    if done { {{0}} outer }', '}'],
            expectedTokens: ['break'],
            distractors: ['exit', 'continue', 'goto'],
            explanation: 'Labeled `break outer` exits nested loops cleanly without boolean flags.',
            syntaxHint: '`break outer` jumps right past the outer loop.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this tagless switch pick?',
            code: ['xp := 750', 'switch { case xp > 900: fmt.Print("S"); case xp > 500: fmt.Print("A"); default: fmt.Print("B") }'],
            options: ['A', 'AB', 'S'],
            answer: 0,
            explanation: 'First matching case (`xp > 500`) executes `"A"` and auto-exits the switch.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss Challenge',
        subtitle: 'Combine `for`, `range`, `_`, and tagless `switch` flawlessly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Loop & Branch Fluency',
            explanation:
              'Go strips visual noise: no parentheses around conditions, zero-fallthrough switches, single `for` loop keyword, and explicit `_` discards.',
            code: ['for _, c := range codes { switch { case c >= 500: errs++ } }'],
          },
          {
            type: 'token_builder',
            prompt: 'Count high scores over `80` cleanly via `range`.',
            codeLines: [
              'top := 0',
              '{{0}} {{1}}, s := {{2}} scores {',
              '    if s >= 80 { top++ }',
              '}',
            ],
            expectedTokens: ['for', '_', 'range'],
            distractors: ['while', 'i', 'in'],
            explanation: '`for _, s := range scores` avoids unused variables while scanning cleanly.',
            syntaxHint: 'Remember `for` is Go’s single loop keyword.',
          },
          {
            type: 'token_builder',
            prompt: 'Classify latency via clean tagless `switch`.',
            codeLines: [
              '{{0}} {',
              '{{1}} ms < 50: tier = "Ultra"',
              '{{2}}: tier = "Standard"',
              '}',
            ],
            expectedTokens: ['switch', 'case', 'default'],
            distractors: ['if', 'elif', 'else'],
            explanation: 'Tagless `switch` evaluates boolean branches cleanly without `break`.',
            syntaxHint: 'End fallback branch with `default:`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the invalid JS/C++ `++` usage on prefix expression.',
            lines: [
              'for i := 0; i < 3; ++i {',
              '    fmt.Println(i)',
              '}',
            ],
            bugLine: 0,
            fixed: 'for i := 0; i < 3; i++ {',
            explanation: 'Go only permits postfix statement increments `i++` — prefix `++i` fails compilation.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['s := []int{2, 4, 6}', 'for i := range s { s[i] += 1 }', 'fmt.Println(s[2])'],
            options: ['7', '6', '2'],
            answer: 0,
            explanation: 'Using index `i` updates `s[2]` directly from `6` to `7`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Slices, Maps & Pointers (5 nodes)
  // =========================================================================
  {
    title: 'Slices, Maps & Pointers',
    subtitle: 'Grow dynamic slices with `append()`, guard nil maps, and mutate via `*T`.',
    conceptGraphicType: 'go_slices',
    guidebook: {
      summary:
        'Go slices (`[]T`) are slim 3-word descriptors (`ptr, len, cap`) backed by contiguous arrays, maps (`map[K]V`) are built-in hash tables, and pointers (`*T`) explicitly pass memory addresses when functions mutate arguments.',
      mentalModel:
        'A `nil` slice (`var s []int`) is completely safe to read `len(s)` and `append(s, x)` onto — whereas writing `m[k] = v` into a `nil` map crashes with a runtime panic unless allocated via `make` or `{}`!',
      keyTakeaways: [
        'Always assign `append` back (`s = append(s, x)`) because reallocation returns a new backing array address.',
        'Pre-size hot slices via `make([]T, 0, cap)` to avoid resizing copies while keeping initial `len` at `0`.',
        'Initialize maps with `make(map[K]V)` or `map[K]V{}` before any write; read safely with comma-ok `v, ok := m[k]`.',
        'Go forbids unsafe pointer arithmetic (`ptr++` does not compile) and cleans heap-escaped values via GC automatically.',
      ],
      keySyntax: [
        {
          title: 'Slice Growth, Slicing & Capacity',
          tag: 'SLICES',
          code: 's := make([]int, 0, 4)\ns = append(s, 10, 20, 30)\nfmt.Println(s[1:], len(s), cap(s))',
          output: '[20 30] 3 4',
          explanation:
            '`make([]int, 0, 4)` reserves capacity for 4 integers upfront so appending 3 items performs zero reallocations.',
          notes: [
            'Sub-slices share backing arrays! Copy with `append([]int(nil), s...)` or `slices.Clone(s)` to isolate mutations.',
          ],
        },
        {
          title: 'Maps, Make & Comma-Ok Check',
          tag: 'MAPS',
          code: 'xp := make(map[string]int)\nxp["go"] = 90\nif val, ok := xp["py"]; !ok {\n    fmt.Println("missing, default:", val)\n}',
          output: 'missing, default: 0',
          explanation:
            '`val, ok := m[k]` distinguishes a key holding `0` (`ok == true`) from an absent key (`ok == false`).',
          notes: [
            'Delete entries safely anytime via built-in `delete(xp, "go")` (safe even if missing!).',
          ],
        },
        {
          title: 'Explicit Mutation via Pointers (`*T`)',
          tag: 'POINTERS',
          code: 'func heal(hp *int, amt int) {\n    if hp != nil { *hp += amt }\n}\nhp := 65\nheal(&hp, 15)\nfmt.Println(hp)',
          output: '80',
          explanation:
            'Passing `&hp` hands the function the variable’s address so `*hp += amt` mutates the caller’s value directly.',
          notes: [
            'Wait: maps and slices are already reference descriptors, so functions can mutate elements without `*[]int`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Writing to an Uninitialized nil Map',
          buggyCode: 'var counts map[string]int\ncounts["go"] = 1 // PANIC: assignment to entry in nil map!',
          fixedCode: 'counts := make(map[string]int)\ncounts["go"] = 1',
          reason:
            'Zero-value maps have no underlying hash table allocated yet. Always call `make(...)` or `{}` before writing.',
        },
        {
          title: 'Ignoring the Return Value of append()',
          buggyCode: 'nums := []int{1, 2}\nappend(nums, 3) // Compile error in Go!',
          fixedCode: 'nums := []int{1, 2}\nnums = append(nums, 3)',
          reason:
            'Unlike JS `.push()`, `append()` returns a brand-new slice header struct containing updated `len` and `ptr`.',
        },
      ],
      proTip:
        'Since Go 1.21, import the standard `"slices"` and `"maps"` packages for battle-tested generics like `slices.Sort`, `slices.Contains`, and `maps.Clone`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Dynamic Slices & append()',
        subtitle: 'Grow slices safely and understand length vs capacity',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Assign `append()` Back to Your Slice',
            explanation:
              'Unlike Python `list.append()`, Go `append(s, val)` is a built-in function returning the updated slice header (in case it reallocated to a bigger backing array). Always write `s = append(s, val)`.',
            code: ['nums := []int{10, 20}', 'nums = append(nums, 30)'],
          },
          {
            type: 'token_builder',
            prompt: 'Append `42` cleanly onto slice `list`.',
            codeLines: ['list := []int{1, 2}', 'list = {{0}}(list, 42)'],
            expectedTokens: ['append'],
            distractors: ['push', 'add', 'insert'],
            explanation: 'Built-in `append(slice, elems...)` returns the possibly reallocated slice header.',
            syntaxHint: 'Dropping `list =` causes unused expression error or loses the element!',
          },
          {
            type: 'token_builder',
            prompt: 'Pre-allocate empty slice of length `0` and capacity `8`.',
            codeLines: ['buf := {{0}}([]int, 0, 8)', 'fmt.Println(len(buf), cap(buf))'],
            expectedTokens: ['make'],
            distractors: ['new', 'alloc', 'len'],
            explanation: '`make([]int, 0, 8)` allocates capacity `8` up front with `len == 0`.',
            syntaxHint: '`make([]int, 8)` without `, 0` would fill 8 zeros first!',
            output: '0 8',
          },
          {
            type: 'token_builder',
            prompt: 'Take subslice elements `[1..2]` cleanly (`start` inclusive, `stop` exclusive).',
            codeLines: ['arr := []string{"a", "b", "c", "d"}', 'mid := arr[{{0}}:{{1}}]'],
            expectedTokens: ['1', '3'],
            distractors: ['0', '2', '4'],
            explanation: '`arr[1:3]` returns `["b", "c"]` sharing the underlying buffer cleanly.',
            syntaxHint: 'Slice stop index `3` stops right before index `3`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `s` never grows if `append` return value is discarded.',
            lines: [
              's := []int{1, 2}',
              'append(s, 3)',
              'fmt.Println(len(s))',
            ],
            bugLine: 1,
            fixed: 's = append(s, 3)',
            explanation: 'Built-in `append` returns a new slice header and must be assigned back (`s = append(s, 3)`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Maps & Comma-Ok Idiom',
        subtitle: 'Prevent nil-map panics and distinguish zero values cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Initialize Maps & Comma-Ok Check',
            explanation:
              'Reading a `nil` map safely returns zero, but writing `var m map[string]int; m["a"] = 1` PANICS at runtime! Always allocate with `make(map[string]int)` and verify presence via `v, ok := m[k]`.',
            code: ['xp := make(map[string]int)', 'xp["go"] = 90', 'v, ok := xp["py"]'],
          },
          {
            type: 'token_builder',
            prompt: 'Allocate a writable string-to-int map cleanly.',
            codeLines: ['counts := {{0}}(map[string]int)', 'counts["go"] = 1'],
            expectedTokens: ['make'],
            distractors: ['new', 'alloc', 'set'],
            explanation: '`make(map[K]V)` allocates the internal hash table safely for writes.',
            syntaxHint: '`var counts map[string]int` stays `nil` and panics on assignment!',
          },
          {
            type: 'token_builder',
            prompt: 'Distinguish key absence from stored `0` using comma-ok.',
            codeLines: ['score, {{0}} := ranks["Tarek"]', 'if {{1}}ok {', '    fmt.Println("Unranked")', '}'],
            expectedTokens: ['ok', '!'],
            distractors: ['exists', 'not', 'err'],
            explanation: 'Comma-ok binds boolean `ok` (`true` only if the key exists in the map).',
            syntaxHint: 'Go logical NOT operator is `!ok`.',
          },
          {
            type: 'token_builder',
            prompt: 'Remove key `"old"` safely from map `cfg`.',
            codeLines: ['{{0}}(cfg, "old")', 'fmt.Println(len(cfg))'],
            expectedTokens: ['delete'],
            distractors: ['remove', 'pop', 'unset'],
            explanation: 'Built-in `delete(m, key)` removes keys cleanly (safe no-op if missing!).',
            syntaxHint: 'Go deletes map entries with built-in function `delete(m, key)`, not a method.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the runtime panic writing into a `nil` map.',
            lines: [
              'var scores map[string]int',
              'scores["py"] = 100',
              'fmt.Println(scores)',
            ],
            bugLine: 0,
            fixed: 'scores := make(map[string]int)',
            explanation: '`var scores map[...]` is `nil`; assigning `scores["py"] = 100` panics immediately!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Slices & Maps',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Allocate map cleanly, set entry, and delete temp key.',
            codeLines: [
              'm := {{0}}(map[string]int)',
              'm["temp"] = 5',
              '{{1}}(m, "temp")',
            ],
            expectedTokens: ['make', 'delete'],
            distractors: ['new', 'remove', 'pop'],
            explanation: 'Initialize via `make` before writes and remove keys via built-in `delete(m, k)`.',
            syntaxHint: 'Remember `new(map[...])` returns a pointer to a nil map!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `boost(&hp)` cannot mutate pass-by-value `hp`.',
            lines: [
              'func boost(hp int) { hp += 10 }',
              'myHp := 50',
              'boost(myHp)',
              'fmt.Println(myHp)',
            ],
            bugLine: 0,
            fixed: 'func boost(hp *int) { *hp += 10 } // and call boost(&myHp)',
            explanation: 'Go passes everything by value; pass `*int` pointer (`&myHp`) to mutate caller state.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `v, ok` produce when key `"rust"` is absent?',
            code: ['m := map[string]int{"go": 1}', 'v, ok := m["rust"]', 'fmt.Println(v, ok)'],
            options: ['0 false', 'nil false', 'Panic'],
            answer: 0,
            explanation: 'Missing int keys cleanly yield zero-value `0` paired with `ok == false`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Pointers Without Arithmetic',
        subtitle: 'Share and mutate state safely using *T pointers and &x',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Simple, Safe Pointers (`&x` and `*p`)',
            explanation:
              'Go pointers (`*int`) behave just like C++ pointers (`&` takes address, `*` dereferences) EXCEPT Go forbids dangerous pointer arithmetic (`p++` doesn’t compile!) and garbage-collects stack escapes safely.',
            code: ['func inc(p *int) { *p++ }', 'n := 5; inc(&n)  // n == 6'],
            highlightNote: 'Notice Go still uses dot `.` (`p.Field`) even through struct pointers — zero `->`!',
          },
          {
            type: 'token_builder',
            prompt: 'Accept an `int` pointer and dereference to update value.',
            codeLines: ['func doubleIt(n {{0}}int) {', '    {{1}}n *= 2', '}'],
            expectedTokens: ['*', '*'],
            distractors: ['&', '->', 'ref'],
            explanation: '`*int` is pointer type, and `*n *= 2` multiplies the pointed integer.',
            syntaxHint: 'Type declarations write `*int`, not `int*` like C++.',
          },
          {
            type: 'token_builder',
            prompt: 'Pass pointer address of `lives` into `heal(&lives)`.',
            codeLines: ['lives := 2', 'heal({{0}}lives)', 'fmt.Println(lives)'],
            expectedTokens: ['&'],
            distractors: ['*', '->', '@'],
            explanation: 'Take address of `lives` cleanly with `&lives`.',
            syntaxHint: 'Cannot pass plain `lives` where `*int` is expected.',
          },
          {
            type: 'token_builder',
            prompt: 'Check pointer nilness cleanly before dereferencing.',
            codeLines: ['if p {{0}} {{1}} {', '    *p = 0', '}'],
            expectedTokens: ['!=', 'nil'],
            distractors: ['!==', 'nullptr', 'null'],
            explanation: 'Guard Go pointers with `if p != nil` — never `nullptr`.',
            syntaxHint: 'Zero value of any pointer type in Go is `nil`.',
          },
          {
            type: 'predict_output',
            prompt: 'Remember Go auto-dereferences struct pointers on dot `.`! Output?',
            code: ['type Hero struct { XP int }', 'h := &Hero{XP: 50}', 'h.XP += 25', 'fmt.Println(h.XP)'],
            options: ['75', '50', 'Compile error (must use ->)'],
            answer: 0,
            explanation: 'Go has no `->` operator! `h.XP` automatically compiles cleanly as `(*h).XP`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss Challenge',
        subtitle: 'Master slices, nil-safe maps, comma-ok, and pointers',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Safe Containers & Pointers',
            explanation:
              'Never write to a `nil` map, always rebind `append()`, check `v, ok := m[k]`, and read/write struct pointers cleanly via dot `.`.',
            code: ['s = append(s, x); m := make(map[string]int)'],
          },
          {
            type: 'token_builder',
            prompt: 'Safely initialize map, look up `"go"`, and append if missing.',
            codeLines: [
              'ranks := {{0}}(map[string]int)',
              'if _, ok := ranks["go"]; {{1}}ok {',
              '    ranks["go"] = 1',
              '}',
            ],
            expectedTokens: ['make', '!'],
            distractors: ['new', 'not', 'nil'],
            explanation: '`make` allocates writable hash storage and `if _, ok := ...; !ok` checks absence cleanly.',
            syntaxHint: 'Remember comma-ok inside `if init; !ok` scopes cleanly.',
          },
          {
            type: 'token_builder',
            prompt: 'Mutate slice header via pointer `*[]int` or return `append`.',
            codeLines: [
              'func push(s *[]int, v int) {',
              '    {{0}}s = {{1}}(*s, v)',
              '}',
            ],
            expectedTokens: ['*', 'append'],
            distractors: ['&', 'push', 'add'],
            explanation: 'Dereference `*s` cleanly so caller sees the reallocated slice header.',
            syntaxHint: 'Slices passed by value copy the 24-byte slice header unless pointer or returned.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why C++ `->` syntax breaks Go compilation.',
            lines: [
              'type User struct { Streak int }',
              'u := &User{Streak: 5}',
              'u->Streak++',
              'fmt.Println(u.Streak)',
            ],
            bugLine: 2,
            fixed: 'u.Streak++',
            explanation: 'Go uses dot `.` for BOTH values and pointers (`->` does not exist in Go!).',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['s := make([]int, 0, 4)', 's = append(s, 10, 20)', 'fmt.Println(len(s), s[1])'],
            options: ['2 20', '4 20', '2 10'],
            answer: 0,
            explanation: '`make([]int, 0, 4)` starts at length `0`, so appending `10, 20` makes `len(s) == 2` and `s[1] == 20`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Structs & Interfaces (5 nodes)
  // =========================================================================
  {
    title: 'Structs & Interfaces',
    subtitle: 'Attach pointer vs value receivers and satisfy interfaces implicitly.',
    conceptGraphicType: 'go_structs',
    guidebook: {
      summary:
        'Go replaces class hierarchies and inheritance with composable `struct` records, methods attached via receivers, and implicit interfaces. Any concrete type implementing all methods of an interface satisfies it automatically — decoupling packages cleanly.',
      mentalModel:
        'Choose receivers by two simple rules: use a **pointer receiver** `(p *Player)` if the method mutates `p` or `p` is large (or if ANY other method on `Player` uses a pointer receiver, for consistency); use `(p Player)` only for small read-only value types.',
      keyTakeaways: [
        'Use named composite literals (`Hero{Name: "Ada", XP: 50}`) so adding new struct fields never silently breaks callers.',
        'Go calls methods on `p.Gain(10)` transparently whether `p` is a `Hero` or `*Hero` (auto-dereference/address-of).',
        'Keep interfaces tiny (`1–3 methods`, like `io.Reader` or `fmt.Stringer`) and define them in the consuming package.',
        'Compose behavior cleanly via struct embedding instead of inheritance!',
      ],
      keySyntax: [
        {
          title: 'Struct Definition & Named Composite Literal',
          tag: 'STRUCTS',
          code: 'type Player struct {\n    Name string\n    XP   int\n}\np := Player{Name: "Zayd", XP: 100}\nfmt.Printf("%s: %d\\n", p.Name, p.XP)',
          output: 'Zayd: 100',
          explanation:
            'Named fields order-independently construct structs and safely leave omitted fields at clean zero values.',
          notes: [
            'Lowercase struct fields (`xp int`) are hidden outside the declaring package.',
          ],
        },
        {
          title: 'Pointer vs Value Receivers',
          tag: 'METHODS',
          code: 'func (p *Player) Gain(amt int) {\n    p.XP += amt\n}\np := Player{Name: "Lina", XP: 50}\np.Gain(30)\nfmt.Println(p.XP)',
          output: '80',
          explanation:
            'Pointer receiver `*Player` mutates `p.XP` in place; Go automatically converts `p.Gain(30)` into `(&p).Gain(30)`!',
          notes: [
            'If a method used `(p Player)` without `*`, `p.XP += amt` would only mutate a temporary copy!',
          ],
        },
        {
          title: 'Implicit Interface Satisfaction',
          tag: 'INTERFACES',
          code: 'type Scorer interface { GetXP() int }\nfunc (p Player) GetXP() int { return p.XP }\n\nvar s Scorer = Player{Name: "Bo", XP: 75}\nfmt.Println(s.GetXP())',
          output: '75',
          explanation:
            'No `implements` keyword anywhere — matching the method signature satisfies `Scorer` automatically!',
          notes: [
            'Notice `any` (alias for `interface{}`) accepts any Go value.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Mutating Fields with a Value Receiver',
          buggyCode: 'func (p Player) LevelUp() {\n    p.XP += 100 // Lost immediately!\n}',
          fixedCode: 'func (p *Player) LevelUp() {\n    p.XP += 100\n}',
          reason:
            'Value receivers copy the entire struct on every call, throwing away mutations as soon as the method returns.',
        },
        {
          title: 'Assigning T Value When *T Implements Interface',
          buggyCode: '// func (p *Player) Run() requires *Player!\nvar r Runner = Player{} // Compile error!',
          fixedCode: 'var r Runner = &Player{}',
          reason:
            'Pointer-receiver methods live in `*T`’s method set, not `T`’s. Pass `&Player{}` when assigning to an interface.',
        },
      ],
      proTip:
        'Prefer struct embedding (`type Admin struct { Player; Role string }`) to promote `Player`’s fields and methods without rigid superclass trees.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Structs & Field Initializers',
        subtitle: 'Model records cleanly with named composite literals',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Data Records via `type ... struct`',
            explanation:
              'Go declares data models using `type Name struct { ... }` with field names BEFORE their types. Prefer named field literals (`User{Name: "Ada"}`) so omitted fields zero-initialize cleanly.',
            code: ['type Hero struct {', '    Name string', '    XP   int', '}', 'h := Hero{Name: "Tarek"}'],
          },
          {
            type: 'token_builder',
            prompt: 'Declare `Unit` struct with exported `Title` field.',
            codeLines: ['{{0}} Unit {{1}} {', '    Title string', '    Done  bool', '}'],
            expectedTokens: ['type', 'struct'],
            distractors: ['class', 'interface', 'record'],
            explanation: 'Go types always follow syntax `type <Name> struct { ... }`.',
            syntaxHint: 'Notice Go places `type` before name and `struct` after name.',
          },
          {
            type: 'token_builder',
            prompt: 'Construct a pointer `&Player{...}` cleanly with named fields.',
            codeLines: ['p := {{0}}Player{Name: "Kai", Level{{1}} 3}'],
            expectedTokens: ['&', ':'],
            distractors: ['*', '=', 'new'],
            explanation: '`&Player{...}` constructs and takes pointer directly; struct literal fields use `:`.',
            syntaxHint: 'Named fields use colon `:`, never `=`.',
          },
          {
            type: 'token_builder',
            prompt: 'Embed `Base` struct cleanly for Go composition.',
            codeLines: ['type Base struct { ID int }', 'type Pro struct {', '    {{0}}', '    Tier string', '}'],
            expectedTokens: ['Base'],
            distractors: ['extends Base', 'super Base', 'inherit Base'],
            explanation: 'Struct embedding gives clean composition — fields on `Base` promote right onto `Pro`.',
            syntaxHint: 'Go favors composition (embed type directly without field name) over inheritance!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap why `p.XP` prints `0` when field literal used `=` instead of `:` (or wrong export).',
            lines: [
              'type Coder struct { XP int }',
              'func main() {',
              '    c := Coder{XP = 500}',
              '    fmt.Println(c.XP)',
              '}',
            ],
            bugLine: 2,
            fixed: '    c := Coder{XP: 500}',
            explanation: 'Go struct literal keys require colon `XP: 500`, never assignment `=`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Value vs Pointer Receivers',
        subtitle: 'Know when `func (p *T)` mutates caller vs `(p T)` copy',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Methods Are Functions with Receivers',
            explanation:
              'Attach methods outside the `struct` block using a receiver before the function name: `func (p *Hero) Add(x int)`. Pointer receivers `*Hero` mutate caller fields; value receivers `(p Hero)` get a copy.',
            code: ['func (h *Hero) Heal() { h.HP += 10 }', 'func (h Hero) Tag() string { return h.Name }'],
          },
          {
            type: 'token_builder',
            prompt: 'Attach a mutating pointer receiver method to `Wallet`.',
            codeLines: ['func (w {{0}}Wallet) AddGems(n int) {', '    w.Gems {{1}} n', '}'],
            expectedTokens: ['*', '+='],
            distractors: ['&', '=+', '->'],
            explanation: '`*Wallet` mutates `w.Gems` directly on the caller struct.',
            syntaxHint: 'Without `*`, `(w Wallet)` updates only a temporary copy that disappears when `AddGems` returns!',
          },
          {
            type: 'token_builder',
            prompt: 'Attach a read-only value receiver returning `Label`.',
            codeLines: ['{{0}} (u User) Badge() string {', '    return "@" + u.Handle', '}'],
            expectedTokens: ['func'],
            distractors: ['def', 'method', 'fn'],
            explanation: 'Every method declaration in Go begins with keyword `func (recv Type)`.',
            syntaxHint: 'Remember lowercase/uppercase method visibility still applies!',
          },
          {
            type: 'token_builder',
            prompt: 'Write an idiomatic `NewUser` constructor helper returning `*User`.',
            codeLines: ['func NewUser(name string) {{0}}User {', '    return {{1}}User{Name: name}', '}'],
            expectedTokens: ['*', '&'],
            distractors: ['&', '*', 'new'],
            explanation: 'Go idiom names constructors `New<Type>` returning `&Type{...}` as `*Type`.',
            syntaxHint: 'Go returns stack-allocated `&User{...}` safely — escape analysis moves it to heap automatically!',
          },
          {
            type: 'predict_output',
            prompt: 'Watch value receiver copy! What does `c.Val` print?',
            code: [
              'type Box struct { Val int }',
              'func (b Box) Bump() { b.Val = 99 }',
              'x := Box{Val: 1}; x.Bump(); fmt.Println(x.Val)',
            ],
            options: ['1', '99', 'Compile error'],
            answer: 0,
            explanation: '`Bump()` used value receiver `(b Box)`, modifying only a copy; `x.Val` stays `1`!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Structs & Interfaces',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Define an `Encoder` interface and satisfy it implicitly.',
            codeLines: [
              'type Encoder {{0}} {',
              '    Encode() string',
              '}',
              'func ({{1}} Json) Encode() string { return "{}" }',
            ],
            expectedTokens: ['interface', 'j'],
            distractors: ['struct', 'implements', 'this'],
            explanation: '`type Encoder interface` declares contract; `Json` satisfies it implicitly via matching `Encode() string`.',
            syntaxHint: 'There is NO `implements` keyword anywhere in Go!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the silent bug where `Reset()` fails to zero caller `Streak`.',
            lines: [
              'type Counter struct { Streak int }',
              'func (c Counter) Reset() { c.Streak = 0 }',
              'func main() { c := Counter{5}; c.Reset(); fmt.Println(c.Streak) }',
            ],
            bugLine: 1,
            fixed: 'func (c *Counter) Reset() { c.Streak = 0 }',
            explanation: 'Mutating methods MUST take pointer receiver `(c *Counter)`, otherwise `c.Streak = 0` edits a copy.',
          },
          {
            type: 'predict_output',
            prompt: 'Can `var s Runner = Dog{}` compile cleanly without `implements`?',
            code: [
              'type Runner interface { Run() string }',
              'type Dog struct{}',
              'func (Dog) Run() string { return "woof" }',
              'var r Runner = Dog{}; fmt.Println(r.Run())',
            ],
            options: ['woof', 'Compile error (missing implements)', 'nil'],
            answer: 0,
            explanation: 'Structural typing! Because `Dog` defines `Run() string`, `Dog{}` automatically implements `Runner`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Implicit Interfaces & `any`',
        subtitle: 'Decouple code with small interfaces and safe type assertions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Duck Typing at Compile Time',
            explanation:
              'Go interfaces are tiny behavior contracts (often 1–2 methods like `io.Reader` or `fmt.Stringer`). Any struct implementing those signatures automatically qualifies without importing the interface package!',
            code: ['type Stringer interface { String() string }', 'val, ok := x.(int)  // safe type assertion'],
          },
          {
            type: 'token_builder',
            prompt: 'Assert concrete `string` from `any` safely with comma-ok.',
            codeLines: ['var raw any = "GoLang"', 's, ok := raw.({{0}})', 'if {{1}} { fmt.Println(s) }'],
            expectedTokens: ['string', 'ok'],
            distractors: ['str', 'err', 'as string'],
            explanation: '`val, ok := x.(T)` extracts `T` cleanly without panicking if mismatched.',
            syntaxHint: 'Bare `raw.(string)` panics at runtime if `raw` actually holds an `int`!',
          },
          {
            type: 'token_builder',
            prompt: 'Use `type switch` to inspect an `any` interface value cleanly.',
            codeLines: ['switch v := x.({{0}}) {', 'case int: fmt.Println("int", v)', '}'],
            expectedTokens: ['type'],
            distractors: ['typeof', 'any', 'kind'],
            explanation: 'Special `switch v := x.(type)` dispatches on the dynamic concrete type cleanly.',
            syntaxHint: 'Keyword literal `type` inside `x.(type)` works exclusively inside `switch`!',
          },
          {
            type: 'token_builder',
            prompt: 'Satisfy `fmt.Stringer` implicitly so `fmt.Println` customizes output.',
            codeLines: ['func (b Badge) {{0}}() {{1}} {', '    return b.Title', '}'],
            expectedTokens: ['String', 'string'],
            distractors: ['toString', '__repr__', 'int'],
            explanation: 'Defining `String() string` lets `fmt.Println(b)` format `b.Title` automatically.',
            syntaxHint: 'Note capital `String()` method name vs lowercase `string` return type.',
          },
          {
            type: 'predict_output',
            prompt: 'What happens if `r` is satisfied via pointer receiver only?',
            code: [
              'type Speaker interface { Speak() string }',
              'type Bot struct{}; func (*Bot) Speak() string { return "hi" }',
              'var s Speaker = &Bot{}; fmt.Println(s.Speak())',
            ],
            options: ['hi', 'nil', 'Compile error'],
            answer: 0,
            explanation: '`&Bot{}` matches pointer receiver `*Bot` cleanly and prints `"hi"`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss Challenge',
        subtitle: 'Architect clean decoupled structs, receivers, and interfaces',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Boss Briefing: Composition Over Inheritance',
            explanation:
              'Compose small Go interfaces, mutate state via `*T` receivers, safely unwrap dynamic `any` values with `v, ok := x.(T)`, and return errors cleanly.',
            code: ['type Store interface { Save(xp int) error }'],
          },
          {
            type: 'token_builder',
            prompt: 'Declare `Syncer` interface and mutating pointer receiver.',
            codeLines: [
              'type Syncer {{0}} { Sync() error }',
              'func (s {{1}}CloudSync) Sync() error {',
              '    s.LastAt = "now"',
              '    return nil',
              '}',
            ],
            expectedTokens: ['interface', '*'],
            distractors: ['struct', '&', 'implements'],
            explanation: '`interface` defines behavior while `*CloudSync` allows mutating `s.LastAt`.',
            syntaxHint: 'Note `Sync() error` matches cleanly with no `implements` keyword.',
          },
          {
            type: 'token_builder',
            prompt: 'Safely narrow `any` value into `int` without panic.',
            codeLines: [
              'func parse(x any) int {',
              '    if v, ok := x.({{0}}); {{1}} { return v }',
              '    return 0',
              '}',
            ],
            expectedTokens: ['int', 'ok'],
            distractors: ['number', 'err', 'nil'],
            explanation: 'Comma-ok type assertion `v, ok := x.(int)` guards against panic cleanly.',
            syntaxHint: 'Using bare `x.(int)` without `, ok` crashes if `x` is a string!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the panicked unguarded type assertion.',
            lines: [
              'var v any = "CodeLingo"',
              'num := v.(int)',
              'fmt.Println(num)',
            ],
            bugLine: 1,
            fixed: 'num, ok := v.(int)',
            explanation: '`v` holds `"CodeLingo"` (string), so single-value `v.(int)` panics at runtime!',
          },
          {
            type: 'predict_output',
            prompt: 'What does calling a pointer-receiver mutator print?',
            code: [
              'type Hero struct { Level int }',
              'func (h *Hero) Up() { h.Level++ }',
              'u := Hero{Level: 1}; u.Up(); fmt.Println(u.Level)',
            ],
            options: ['2', '1', 'Compile error'],
            answer: 0,
            explanation: 'Go automatically passes `(&u).Up()` when invoking a pointer-receiver method on addressable `u`!',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Goroutines & Channels (ch <-) (5 nodes)
  // =========================================================================
  {
    title: 'Goroutines & Channels (ch <-)',
    subtitle: 'Run lightweight concurrent workers and pass messages over typed channels.',
    conceptGraphicType: 'go_channels',
    guidebook: {
      summary:
        'Concurrency is built directly into Go’s core language via lightweight M:N goroutines (`go fn()`) and typed channels (`make(chan T)`). Guided by Go’s famous proverb — "Share memory by communicating" — channels synchronize work and timeouts cleanly with `select`.',
      mentalModel:
        'An unbuffered channel `make(chan int)` is a **handoff baton**: sending (`ch <- v`) blocks the sender until a receiver (`<-ch`) grabs it! Adding capacity (`make(chan int, 4)`) acts like a bounded mailbox queue.',
      keyTakeaways: [
        'Goroutines use ~2 KB initial stack (vs megabytes for OS threads), letting servers spin up tens of thousands cheaply.',
        'Always initialize channels with `make(chan T)` — a zero `nil` channel blocks sends and receives forever!',
        'Close channels strictly from the SENDER side (`close(ch)`) when done producing so `for v := range ch` exits cleanly.',
        'Coordinate cancellation and deadlines across concurrent workers using `context.Context` + `select { case <-ctx.Done(): ... }`.',
      ],
      keySyntax: [
        {
          title: 'Goroutine + Buffered Channel Handoff',
          tag: 'CHANNELS',
          code: 'ch := make(chan string, 1)\ngo func() {\n    ch <- "synced"\n}()\nmsg := <-ch\nfmt.Println(msg)',
          output: 'synced',
          explanation:
            'Arrow direction always moves data leftward: `ch <- v` pushes into `ch`, while `<-ch` pops out of `ch`.',
          notes: [
            'Main exiting kills every running goroutine immediately — wait via channels or `sync.WaitGroup`!',
          ],
        },
        {
          title: 'Multiplexing Channels & Timeouts with `select`',
          tag: 'SELECT',
          code: 'select {\ncase res := <-ch:\n    fmt.Println("Got:", res)\ncase <-time.After(2 * time.Second):\n    fmt.Println("Timed out")\n}',
          output: 'Got: synced',
          explanation:
            '`select` blocks until ONE of its channel cases is ready (or picks pseudo-randomly if multiple are ready at once).',
          notes: [
            'Add a `default:` branch to make `select` completely non-blocking.',
          ],
        },
        {
          title: 'Waiting on Multiple Workers (`WaitGroup`)',
          tag: 'SYNC',
          code: 'var wg sync.WaitGroup\nwg.Add(1)\ngo func() {\n    defer wg.Done()\n    fmt.Print("worker ")\n}()\nwg.Wait()\nfmt.Print("done")',
          output: 'worker done',
          explanation:
            '`wg.Add(1)` increments before launching, `defer wg.Done()` decrements on finish, and `wg.Wait()` blocks until zero.',
          notes: [
            'Always call `wg.Add(1)` BEFORE `go func()`, never inside the goroutine itself (race condition!).',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Sending on an Unbuffered Channel in Same Goroutine',
          buggyCode: 'ch := make(chan int)\nch <- 42 // DEADLOCK! Nobody receiving yet',
          fixedCode: 'ch := make(chan int, 1)\nch <- 42',
          reason:
            'Unbuffered channels require a concurrent receiver actively waiting at the same instant. Either run the send in `go func()` or buffer `make(chan int, 1)`.',
        },
        {
          title: 'Closing a Channel Twice or From Receiver',
          buggyCode: 'close(ch)\nclose(ch) // PANIC: close of closed channel!',
          fixedCode: '// Only sender calls close(ch) once when finished',
          reason:
            'Closing an already-closed channel (or sending to a closed one) panics immediately. Always give close ownership solely to the producer.',
        },
      ],
      proTip:
        'Run `go test -race ./...` regularly — Go’s built-in race detector catches unsynchronized concurrent map/variable accesses automatically in real tests!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Goroutines & `go` Keyword',
        subtitle: 'Spawn thousands of lightweight M:N green threads in one keyword',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Spawning Concurrent Goroutines',
            explanation:
              'Prefixing any function call with `go` runs it concurrently on Go’s scheduler using only ~2KB initial stack! Care: if `main()` exits early, all background goroutines stop immediately unless synchronized.',
            code: ['go sendMetric("xp")', 'go func() { fmt.Println("async!") }()'],
          },
          {
            type: 'token_builder',
            prompt: 'Launch `syncCloud()` asynchronously in its own goroutine.',
            codeLines: ['{{0}} syncCloud()', 'fmt.Println("UI stays responsive")'],
            expectedTokens: ['go'],
            distractors: ['async', 'spawn', 'await'],
            explanation: 'Writing `go syncCloud()` schedules execution concurrently in Go.',
            syntaxHint: 'Go uses `go` rather than `async` / `spawn`.',
          },
          {
            type: 'token_builder',
            prompt: 'Invoke an inline anonymous goroutine cleanly with trailing `()`.',
            codeLines: ['{{0}} func() {', '    fmt.Println("Worker active")', '}{{1}}'],
            expectedTokens: ['go', '()'],
            distractors: ['async', ';', '{}'],
            explanation: '`go` always takes a function CALL — don’t forget trailing `()` on anonymous functions!',
            syntaxHint: 'Omitting `()` fails because `go` requires calling the function.',
          },
          {
            type: 'token_builder',
            prompt: 'Wait for worker goroutines cleanly with `sync.WaitGroup`.',
            codeLines: ['var wg sync.WaitGroup', 'wg.{{0}}(1)', 'go func() { defer wg.{{1}}() }()', 'wg.{{2}}()'],
            expectedTokens: ['Add', 'Done', 'Wait'],
            distractors: ['Push', 'Finish', 'Join'],
            explanation: '`wg.Add(1)` increments, `defer wg.Done()` decrements, and `wg.Wait()` blocks until zero.',
            syntaxHint: 'Calling `wg.Add(1)` INSIDE the goroutine races against `wg.Wait()` — always `Add` BEFORE `go`!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the goroutine race calling `wg.Add(1)` inside instead of before `go`.',
            lines: [
              'var wg sync.WaitGroup',
              'go func() {',
              '    wg.Add(1)',
              '    defer wg.Done()',
              '}()',
              'wg.Wait()',
            ],
            bugLine: 2,
            fixed: '// move wg.Add(1) BEFORE go func()!',
            explanation: '`wg.Wait()` can run before the child goroutine executes `wg.Add(1)`, exiting prematurely!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Typed Channels (ch <-)',
        subtitle: 'Send and receive values safely across goroutines',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Communicate by Sharing Channels',
            explanation:
              'Create channels with `ch := make(chan int)` (unbuffered) or `make(chan int, cap)` (buffered). Note the arrow direction: `ch <- x` sends INTO `ch`; `x := <-ch` receives OUT of `ch`.',
            code: ['ch := make(chan int, 1)', 'ch <- 42', 'res := <-ch'],
          },
          {
            type: 'token_builder',
            prompt: 'Initialize a typed channel of `string` with buffer size `1`.',
            codeLines: ['ch := {{0}}(chan string, 1)', 'ch {{1}} "pong"'],
            expectedTokens: ['make', '<-'],
            distractors: ['new', '->', '='],
            explanation: '`make(chan string, 1)` avoids deadlock on same-goroutine single send (`ch <- "pong"`).',
            syntaxHint: 'Channel send arrow points LEFT into channel: `ch <- val`.',
          },
          {
            type: 'token_builder',
            prompt: 'Receive the value from `ch` cleanly inside `main`.',
            codeLines: ['ch := make(chan int)', 'go func() { ch <- 99 }()', 'val := {{0}}ch'],
            expectedTokens: ['<-'],
            distractors: ['->', '<<', 'recv'],
            explanation: '`val := <-ch` blocks cleanly until the worker sends `99`!',
            syntaxHint: 'Unbuffered channels synchronize sender & receiver cleanly.',
          },
          {
            type: 'token_builder',
            prompt: 'Close channel after finishing sends so receivers stop ranging.',
            codeLines: ['ch <- 10', '{{0}}(ch)', 'for v := range ch { fmt.Println(v) }'],
            expectedTokens: ['close'],
            distractors: ['end', 'stop', 'delete'],
            explanation: '`close(ch)` signals receivers (`range ch`) that no more values will arrive.',
            syntaxHint: 'Only senders should call `close(ch)` — sending to a closed channel panics!',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the `nil` channel deadlock bug.',
            lines: [
              'var ch chan int',
              'go func() { ch <- 1 }()',
              'fmt.Println(<-ch)',
            ],
            bugLine: 0,
            fixed: 'ch := make(chan int)',
            explanation: '`var ch chan int` leaves `ch == nil`, which blocks sends and receives forever!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Concurrency',
        subtitle: '3-step no-hint challenge for Bonus Gem Chest (+25 Gems)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build complete ping-pong goroutine channel transfer.',
            codeLines: [
              'ch := {{0}}(chan string, 1)',
              '{{1}} func() { ch {{2}} "OK" }()',
              'fmt.Println(<-ch)',
            ],
            expectedTokens: ['make', 'go', '<-'],
            distractors: ['new', 'async', '->'],
            explanation: 'Create channel with `make`, spawn with `go`, and send with `ch <-`.',
            syntaxHint: 'Don’t forget `<-` always points leftward.',
            output: 'OK',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the missing `()` that prevents goroutine invocation.',
            lines: [
              'ch := make(chan int)',
              'go func() {',
              '    ch <- 7',
              '}',
              'fmt.Println(<-ch)',
            ],
            bugLine: 3,
            fixed: '}()',
            explanation: '`go func() { ... }` requires calling `()` immediately after closing `}`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does receiving from a closed empty channel return?',
            code: ['ch := make(chan int, 1)', 'close(ch)', 'v, ok := <-ch', 'fmt.Println(v, ok)'],
            options: ['0 false', 'Panic', 'Blocks forever'],
            answer: 0,
            explanation: 'Receiving from a closed channel returns immediately with zero-value `0` and `ok == false`!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'select & Mutex Safety',
        subtitle: 'Multiplex channels with select and prevent data races',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Multiplexing with `select` & Mutexes',
            explanation:
              '`select` lets a goroutine wait on whichever channel becomes ready first — ideal for timeouts (`case <-time.After(...)`). When sharing shared map/counters without channels, protect writes with `sync.Mutex` (`mu.Lock(); defer mu.Unlock()`).',
            code: ['select {', 'case v := <-resCh: return v', 'case <-doneCh: return 0', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Listen concurrently on result channel OR timeout channel.',
            codeLines: ['{{0}} {', '{{1}} msg := <-resCh:', '    fmt.Println(msg)', 'case <-time.After(time.Second):', '    fmt.Println("timeout")', '}'],
            expectedTokens: ['select', 'case'],
            distractors: ['switch', 'when', 'match'],
            explanation: '`select` chooses whichever `case` channel operation completes first.',
            syntaxHint: '`switch` evaluates values sequentially; `select` waits across channel operations!',
          },
          {
            type: 'token_builder',
            prompt: 'Lock mutex cleanly and unlock immediately via `defer`.',
            codeLines: ['mu.{{0}}()', 'defer mu.{{1}}()', 'sharedXp += 25'],
            expectedTokens: ['Lock', 'Unlock'],
            distractors: ['Acquire', 'Release', 'Close'],
            explanation: '`mu.Lock()` + `defer mu.Unlock()` guarantees the mutex unlocks even on early return!',
            syntaxHint: 'Remember exported capitalization on `Lock()` / `Unlock()`.',
          },
          {
            type: 'token_builder',
            prompt: 'Avoid blocking indefinitely if channel isn’t ready using `default`.',
            codeLines: ['select {', 'case ch <- val:', '{{0}}:', '    fmt.Println("channel full")', '}'],
            expectedTokens: ['default'],
            distractors: ['else', 'otherwise', 'fallback'],
            explanation: 'Adding `default:` turns `select` into an instant non-blocking send/receive check.',
            syntaxHint: 'Go uses `default:` inside both `switch` and `select`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `select` do when `default:` is present and `ch` is empty?',
            code: ['ch := make(chan int)', 'select { case x := <-ch: fmt.Print(x); default: fmt.Print("IDLE") }'],
            options: ['IDLE', 'Deadlock', '0'],
            answer: 0,
            explanation: 'Non-blocking `select` hits `default:` immediately and prints `"IDLE"`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Go Mastery Boss',
        subtitle: 'Coordinate safe concurrent Go pipelines with zero deadlocks',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Final Boss: Go Concurrency Mastery',
            explanation:
              'Complete the Go track by combining `make(chan T)`, `go` workers, `select` multiplexing, `sync.WaitGroup`, and `defer mu.Unlock()`.',
            code: ['ch := make(chan int, 2); go work(ch); select { case v := <-ch: ... }'],
          },
          {
            type: 'token_builder',
            prompt: 'Spawn worker sending XP over channel, then close safely.',
            codeLines: [
              'ch := {{0}}(chan int, 1)',
              '{{1}} func() {',
              '    ch {{2}} 250',
              '    close(ch)',
              '}()',
            ],
            expectedTokens: ['make', 'go', '<-'],
            distractors: ['new', 'async', '->'],
            explanation: 'Channel created via `make`, worker spawned with `go`, data sent via `ch <- 250`.',
            syntaxHint: 'Keep close inside the producer goroutine after all sends finish.',
          },
          {
            type: 'token_builder',
            prompt: 'Safeguard shared state with mutex and non-blocking select.',
            codeLines: [
              'mu.{{0}}()',
              '{{1}} mu.Unlock()',
              'count++',
            ],
            expectedTokens: ['Lock', 'defer'],
            distractors: ['Wait', 'finally', 'unlock'],
            explanation: '`mu.Lock()` paired with `defer mu.Unlock()` keeps critical sections panic-safe.',
            syntaxHint: 'Always `defer` unlock right on the line below `Lock()`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the unbuffered single-goroutine self-deadlock bug!',
            lines: [
              'func main() {',
              '    ch := make(chan int)',
              '    ch <- 10',
              '    fmt.Println(<-ch)',
              '}',
            ],
            bugLine: 1,
            fixed: '    ch := make(chan int, 1)',
            explanation: 'Unbuffered `make(chan int)` blocks on `ch <- 10` waiting for another goroutine — give buffer `1` or send in a `go` goroutine!',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: [
              'ch := make(chan string, 2)',
              'ch <- "Go"',
              'ch <- "Pro"',
              'fmt.Println(<-ch + " " + <-ch)',
            ],
            options: ['Go Pro', 'Pro Go', 'Deadlock'],
            answer: 0,
            explanation: 'Go channels are strictly FIFO queues: `"Go"` sends first and receives first (`"Go Pro"`).',
          },
        ],
      },
    ],
  },
];
