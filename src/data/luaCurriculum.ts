import type { UnitSeed } from './types';

export const LUA_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Locals, Strings & 1-Based Loops (6 nodes)
  // =========================================================================
  {
    title: 'Locals, Strings & 1-Based Loops',
    subtitle: 'Scope variables with local, concatenate via .., and write 1-indexed Lua loops.',
    conceptGraphicType: 'lua_local',
    guidebook: {
      summary:
        'Lua is a tiny, fast embeddable scripting language powering engines from Redis and Neovim to Roblox. Variables default to **global** unless marked `local`, **arrays start at 1**, inequality is written **`~=`**, and only **`false` and `nil`** are falsy!',
      mentalModel:
        'Think of Lua like a razor-sharp pocket knife: a tiny core (`~300KB`) with clean rules—no `!=` (use `~=`), string concat uses `..`, and `#t` returns sequence length.',
      keyTakeaways: [
        'Always write **`local x = ...`**; forgetting `local` silently pollutes the shared global table `_G`.',
        'Concatenate strings cleanly using two dots (`"Lua " .. "5.4"`), and measure lengths with `#` (`#"Lua" == 3`).',
        'Check inequality with **`~=`** (not `!=`!). Note that **`0` and `""` are truthy** in Lua—only `nil` and `false` are falsy!',
        'Numeric loops run `for i = 1, 5 do ... end` (both bounds inclusive!) and terminate blocks with `end`.',
      ],
      keySyntax: [
        {
          title: 'local Scope & String Concatenation',
          tag: 'BASICS',
          code: 'local lang = "Lua"\nlocal ver = 5.4\nprint(lang .. " " .. ver)\nprint(#lang)',
          output: 'Lua 5.4\n3',
          explanation:
            '`local` keeps variables lexically scoped and fast in VM registers; `..` coerces numbers neatly onto strings.',
          notes: [
            'Single-line comments start with `--`; block comments use `--[[ ... ]]`.',
          ],
        },
        {
          title: 'Truthiness & ~= Inequality',
          tag: 'LOGIC',
          code: 'local x = 0\nif x ~= nil and x then\n  print("0 is truthy!")\nend',
          output: '0 is truthy!',
          explanation:
            'In Lua, ONLY `false` and `nil` evaluate as falsy—zero `0` and empty `""` both enter the `if` branch!',
          notes: [
            'Boolean logical operators are spelled `and`, `or`, and `not`.',
          ],
        },
        {
          title: 'Inclusive Numeric for Loops',
          tag: 'LOOPS',
          code: 'local sum = 0\nfor i = 1, 4 do\n  sum = sum + i\nend\nprint(sum)',
          output: '10',
          explanation:
            '`for i = start, stop [, step] do ... end` includes `stop` cleanly; add an optional 3rd step (`10, 2, -2`).',
          notes: [
            'Lua does not have `++` or `+=`; always write `sum = sum + i`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Writing != Instead of ~= for Inequality',
          buggyCode: 'if hp != 0 then print("Alive") end',
          fixedCode: 'if hp ~= 0 then print("Alive") end',
          reason:
            'Lua strictly uses `~=` (tilde equals) for not-equal; `!=` is a syntax error.',
        },
        {
          title: 'Treating 0 or "" as Falsy in Lua',
          buggyCode: 'if count then ... end -- passes when count is 0!',
          fixedCode: 'if count > 0 then ... end',
          reason:
            'Zero (`0`) and empty string (`""`) are truthy in Lua; only `false` and `nil` are falsy.',
        },
      ],
      proTip:
        'Use Lua’s `local x = opts.x or 10` idiom only when `false` isn’t a valid setting—otherwise check `if opts.x == nil then x = 10 end` explicitly.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'local, .. & Length #',
        subtitle: 'Avoid global leaks and join strings with dot-dot syntax',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Everything Is Global Without local',
            explanation:
              'Variables in Lua default to global `_G` unless prefixed with `local`. Strings concatenate via `..`, and `#s` measures string or array sequence length.',
            code: ['local badge = "Lua"', 'local tag = badge .. " Pro"', 'print(#badge)'],
            highlightNote: 'Notice Lua prints `3` for `#"Lua"`, and has no `+=` operator.',
          },
          {
            type: 'token_builder',
            prompt: 'Bind local `user` and concatenate it cleanly onto `"Hi, "`.',
            codeLines: ['{{0}} user = "Kai"', 'print("Hi, " {{1}} user)'],
            expectedTokens: ['local', '..'],
            distractors: ['let', '+', 'var'],
            explanation: '`local` restricts scope and `..` joins strings cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the unsupported C-style `+=` operator in Lua.',
            lines: [
              'local xp = 10',
              'xp += 5',
              'print(xp)',
            ],
            bugLine: 1,
            fixed: 'xp = xp + 5',
            explanation: 'Standard Lua has no compound `+=`; write `xp = xp + 5`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `#name` evaluate to?',
            code: ['local name = "Code"', 'print(#name)'],
            options: ['4', '5', 'Error'],
            answer: 0,
            explanation: 'The length operator `#` returns the byte length of `"Code"` (`4`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Truthiness & ~= Branches',
        subtitle: 'Remember only nil and false fail conditions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero Is Truthy in Lua',
            explanation:
              'Unlike JavaScript or Python, `0` and `""` evaluate **true** in Lua conditionals! Check inequality using `~=` and logical checks with `and`, `or`, `not`.',
            code: ['local coins = 0', 'if coins ~= nil then print("Tracked") end'],
            highlightNote: 'Only `nil` and `false` branch into `else`.',
          },
          {
            type: 'token_builder',
            prompt: 'Write a Lua condition checking `status ~= "off"` with `then` / `end`.',
            codeLines: ['local status = "on"', 'if status {{0}} "off" {{1}}', '  print("Active")', 'end'],
            expectedTokens: ['~=', 'then'],
            distractors: ['!=', '{', ':'],
            explanation: 'Lua inequality uses `~=` and `if` headers always close with `then`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the JavaScript-style inequality operator `!=`.',
            lines: [
              'local mode = "game"',
              'if mode != "idle" then print(mode) end',
            ],
            bugLine: 1,
            fixed: 'if mode ~= "idle" then print(mode) end',
            explanation: 'Replace `!=` with Lua’s not-equal operator `~=`.',
          },
          {
            type: 'predict_output',
            prompt: 'What gets printed when `x = 0`?',
            code: ['local x = 0', 'if x then print("A") else print("B") end'],
            options: ['A', 'B', 'Error'],
            answer: 0,
            explanation: 'In Lua, `0` is truthy—only `false` and `nil` are falsy!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Numeric for Loops & 1-Indexing',
        subtitle: 'Iterate inclusive numeric ranges cleanly without off-by-one bugs',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Numeric Loop Bounds',
            explanation:
              'Lua’s numeric loop `for i = 1, 5 do ... end` evaluates start/stop once and includes **both** `1` and `5`. Step backward safely with a 3rd step argument (`for i = 5, 1, -1 do`).',
            code: ['for i = 1, 5, 2 do', '  print(i)', 'end'],
            highlightNote: 'Arrays and loops both start naturally at `1` across the Lua stdlib.',
          },
          {
            type: 'token_builder',
            prompt: 'Loop from `3` down to `1` cleanly.',
            codeLines: ['for n = 3, 1, {{0}} {{1}}', '  print(n)', 'end'],
            expectedTokens: ['-1', 'do'],
            distractors: ['1', 'then', '{'],
            explanation: 'Third parameter `-1` steps downward and `for` headers end with `do`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `for i = 1, 3` accumulate?',
            code: ['local total = 0', 'for i = 1, 3 do total = total + i end', 'print(total)'],
            options: ['6', '3', '5'],
            answer: 0,
            explanation: 'Both `1` and `3` are inclusive: `1 + 2 + 3 = 6`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot using `then` instead of `do` on a Lua loop.',
            lines: [
              'for i = 1, 4 then',
              '  print(i)',
              'end',
            ],
            bugLine: 0,
            fixed: 'for i = 1, 4 do',
            explanation: '`if` uses `then`, while `for` and `while` loops require `do`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 1 Checkpoint',
        subtitle: 'Check Lua syntax quirks: ~=, .., local, and 1..N loops',
        exercises: [
          {
            type: 'multiple_choice',
            question: 'Which two values are falsy in Lua?',
            options: [
              'Only `false` and `nil`',
              '`false`, `nil`, `0`, and `""`',
              'Only `nil`',
              '`0` and `false` only',
            ],
            answer: 0,
            explanation: '`0`, `""`, and `{}` are all truthy in Lua; only `false` and `nil` are falsy.',
          },
          {
            type: 'token_builder',
            prompt: 'Print `"Level " .. lvl` only when `lvl` is not `0`.',
            codeLines: ['local lvl = 3', 'if lvl {{0}} 0 then', '  print("Level " {{1}} lvl)', 'end'],
            expectedTokens: ['~=', '..'],
            distractors: ['!=', '+', '=='],
            explanation: '`~=` tests not-equal and `..` joins the string cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `#("abc" .. "de")` return?',
            code: ['local s = "abc" .. "de"', 'print(#s)'],
            options: ['5', '6', 'abcde'],
            answer: 0,
            explanation: 'Joining `"abc"` + `"de"` creates a 5-character string.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Fallback Defaults with or',
        subtitle: 'Use short-circuit or cleanly while guarding booleans',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Lua `and` / `or` Value Expressions',
            explanation:
              'In Lua, `a or b` returns `a` itself if `a` isn’t `false`/`nil`, otherwise `b`! `local port = envPort or 8080` gives instant fallback defaults.',
            code: ['local name = nil', 'local display = name or "Guest"', 'print(display)'],
            highlightNote: 'Simulate ternary expressions carefully: `cond and a or b` works ONLY when `a` cannot be false/nil.',
          },
          {
            type: 'token_builder',
            prompt: 'Supply fallback `"Guest"` cleanly using `or`.',
            codeLines: ['local raw = nil', 'local user = raw {{0}} "{{1}}"'],
            expectedTokens: ['or', 'Guest'],
            distractors: ['||', '??', 'and'],
            explanation: '`raw or "Guest"` yields `"Guest"` when `raw` is `nil`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the JavaScript `||` operator used instead of Lua `or`.',
            lines: [
              'local title = inputTitle || "Untitled"',
            ],
            bugLine: 0,
            fixed: 'local title = inputTitle or "Untitled"',
            explanation: 'Lua spells logical OR as keyword `or`, not `||`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss: Embed-Ready Script',
        subtitle: 'Clean up global leaks, invalid operators, and loop syntax',
        exercises: [
          {
            type: 'find_bug',
            prompt: 'Fix the accidental global variable leaking outside the function.',
            lines: [
              'function step()',
              '  tmp = 42',
              '  return tmp',
              'end',
            ],
            bugLine: 1,
            fixed: '  local tmp = 42',
            explanation: 'Prefix `local` so `tmp` does not overwrite `_G.tmp` globally.',
          },
          {
            type: 'token_builder',
            prompt: 'Sum odd numbers `1, 3, 5` with a step of `2`.',
            codeLines: ['{{0}} sum = 0', 'for i = 1, 5, {{1}} do sum = sum + i end', 'print(sum)'],
            expectedTokens: ['local', '2'],
            distractors: ['var', '1', 'do'],
            explanation: '`local` scopes `sum` and `1, 5, 2` visits `1, 3, 5` -> `9`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Lua check output?',
            code: ['local s = ""', 'print(s and "Y" or "N")'],
            options: ['Y', 'N', '""'],
            answer: 0,
            explanation: 'Empty string `""` is truthy in Lua, so `"" and "Y"` evaluates to `"Y"`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: First-Class Functions & Closures (5 nodes)
  // =========================================================================
  {
    title: 'First-Class Functions & Closures',
    subtitle: 'Return multiple values natively and capture local state cleanly in closures.',
    conceptGraphicType: 'lua_funcs',
    guidebook: {
      summary:
        'Functions in Lua are **first-class lexical closures**: they live inside variables or tables, **return multiple values natively** (`return min, max`) without allocating tuples, and capture local **upvalues** cleanly.',
      mentalModel:
        'Instead of wrapping two return values in an object or array, a Lua function hands back `return x, y` directly—callers catch both cleanly (`local a, b = f()`) or keep just the first (`local a = f()`).',
      keyTakeaways: [
        'Return any count of values with `return a, b`; missing receivers receive `nil` and extra return values are silently discarded.',
        'Declare recursive local helpers via `local f; f = function(...)` or `local function f(...)` (never `local f = function() ... f()` since `f` isn’t in scope yet during RHS!).',
        'Lexical closures capture outer `local` variables by reference (upvalues) cleanly with minimal overhead.',
        'Accept variable arguments cleanly using `...` (`local args = {...}` or `select("#", ...)`).',
      ],
      keySyntax: [
        {
          title: 'Multi-Value Returns',
          tag: 'RETURNS',
          code: 'local function minmax(a, b)\n  if a < b then return a, b else return b, a end\nend\nlocal lo, hi = minmax(9, 4)\nprint(lo .. "-" .. hi)',
          output: '4-9',
          explanation:
            'No temporary wrapper table needed—`lo` receives `4` and `hi` receives `9` directly on the Lua stack.',
          notes: [
            'Wrap a call in parentheses `(minmax(9, 4))` to force adjusting it to strictly 1 return value.',
          ],
        },
        {
          title: 'Stateful Lexical Closures (Upvalues)',
          tag: 'CLOSURES',
          code: 'local function makeCounter()\n  local n = 0\n  return function() n = n + 1; return n end\nend\nlocal inc = makeCounter()',
          output: 'inc() -> 1, inc() -> 2',
          explanation:
            'Each `makeCounter()` call creates its own independent `n` upvalue remembered across calls.',
          notes: [
            'Prefer `local function foo()` over global `function foo()` in modules!',
          ],
        },
        {
          title: 'Variadic ... Functions',
          tag: 'VARIADIC',
          code: 'local function sumAll(...)\n  local s = 0\n  for _, v in ipairs({...}) do s = s + v end\n  return s\nend',
          output: 'sumAll(1, 2, 3) == 6',
          explanation:
            '`{...}` packs varargs cleanly into a 1-based array table.',
          notes: [
            'When arguments may include `nil` holes, prefer `table.pack(...)` or `select(i, ...)`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Recursion Inside local f = function()',
          buggyCode: 'local fact = function(n) return n < 2 and 1 or n * fact(n - 1) end',
          fixedCode: 'local function fact(n) return n < 2 and 1 or n * fact(n - 1) end',
          reason:
            '`local fact = function()` reads global `fact` inside its body because local `fact` is declared after evaluating the function!',
        },
        {
          title: 'Forgetting Lua Adjusts Extra Multi-Returns Except Last',
          buggyCode: 'local a, b = pair(), 99 -- pair() adjusts to 1 value!',
          fixedCode: 'local a = pair(); local x, y = pair()',
          reason:
            'Only the final expression in a list expands all multiple return values.',
        },
      ],
      proTip:
        'Lua compiles `local function foo()` directly into `local foo; foo = function()`, so recursive self-calls capture the local upvalue cleanly!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Multiple Return Values',
        subtitle: 'Unpack swap, min/max, and status flags with zero tuple wrappers',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Native Multi-Value Return',
            explanation:
              'Lua functions return comma-separated values directly (`return ok, msg`). Assigning `local a, b = fn()` unpacks cleanly without extra tables.',
            code: ['local function splitSum(a, b)', '  return a + b, a - b', 'end', 'local s, d = splitSum(10, 3)'],
            highlightNote: 'Any unassigned variable in `local x, y, z = splitSum(10, 3)` gets `nil`.',
          },
          {
            type: 'token_builder',
            prompt: 'Return `b, a` swapped cleanly and catch both in `x, y`.',
            codeLines: ['local function swap(a, b)', '  {{0}} b, a', 'end', 'local x, y = {{1}}(1, 2)'],
            expectedTokens: ['return', 'swap'],
            distractors: ['yield', 'local', 'tuple'],
            explanation: '`return b, a` yields both values natively.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `y` contain here?',
            code: ['local function f() return 10, 20, 30 end', 'local x, y = f()', 'print(x + y)'],
            options: ['30', '60', '10'],
            answer: 0,
            explanation: '`x = 10`, `y = 20`, extra `30` discards cleanly -> `10 + 20 = 30`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot forgetting `local` before recursive helper `countdown`.',
            lines: [
              'local cd = function(n)',
              '  if n > 0 then cd(n - 1) end',
              'end',
            ],
            bugLine: 0,
            fixed: 'local function cd(n)',
            explanation: '`local cd = function()` looks up global `cd` inside recursion; write `local function cd(n)`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Closures & Upvalues',
        subtitle: 'Encapsulate private state without heavy class wrappers',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Upvalue Capture',
            explanation:
              'Inner Lua functions automatically capture outer `local` variables ("upvalues"). State stays private inside the closure, invisible to outside callers!',
            code: ['local function ticker(step)', '  local v = 0', '  return function() v = v + step; return v end', 'end'],
            highlightNote: 'Closures run fast in Lua because upvalues live cleanly inside Lua’s register VM.',
          },
          {
            type: 'token_builder',
            prompt: 'Return a closure adding `base` to incoming `x`.',
            codeLines: ['local function adder(base)', '  {{0}} function(x)', '    return base + {{1}}', '  end', 'end'],
            expectedTokens: ['return', 'x'],
            distractors: ['local', 'base', 'end'],
            explanation: 'Returning an anonymous `function(x)` closes over `base`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace two independent closures.',
            code: ['local function gen()', '  local n = 0', '  return function() n = n + 1; return n end', 'end', 'local a, b = gen(), gen()', 'print(a() .. b() .. a())'],
            options: ['112', '123', '111'],
            answer: 0,
            explanation: '`a` and `b` own separate `n` upvalues: `a()->1`, `b()->1`, `a()->2` -> `"112"`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 2 Checkpoint',
        subtitle: 'Verify varargs (...), multi-returns, and closure scope',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Pack varargs cleanly inside `{...}` and count arguments.',
            codeLines: ['local function countArgs({{0}})', '  local list = {{{1}}}', '  return #list', 'end'],
            expectedTokens: ['...', '...'],
            distractors: ['args', '*args', 'var'],
            explanation: '`...` forwards all extra arguments into `{...}`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does parentheses around `(pair())` do?',
            code: ['local function pair() return "A", "B" end', 'local x, y = (pair())', 'print(y)'],
            options: ['nil', 'B', 'A'],
            answer: 0,
            explanation: 'Wrapping `(pair())` truncates multiple returns strictly to `1` value (`"A"`), leaving `y` as `nil`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does `local function f()` safely allow recursion while `local f = function()` breaks?',
            options: [
              '`local function f` declares local `f` before compiling the body',
              '`local function f` skips closure upvalues',
              '`local f = function()` disables `return`',
              'Only global functions support `if` checks',
            ],
            answer: 0,
            explanation: '`local function f()` desugars to `local f; f = function()`, bringing local `f` into scope first.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Higher-Order Lua Helpers',
        subtitle: 'Pass callbacks cleanly without verbose class boilerplate',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Functions as Values',
            explanation:
              'Pass functions cleanly into `table.sort(arr, cmp)` or custom `map(list, fn)` helpers. Custom sort comparators simply return `true` when `a` belongs before `b`!',
            code: ['local scores = {10, 40, 20}', 'table.sort(scores, function(a, b) return a > b end)'],
            highlightNote: 'Notice Lua sorts tables in place (`table.sort` returns `nil`, mutating `scores`)!',
          },
          {
            type: 'token_builder',
            prompt: 'Sort `nums` descending with a custom comparator closure.',
            codeLines: ['local nums = {3, 1, 2}', 'table.sort(nums, {{0}}(a, b) {{1}} a > b end)'],
            expectedTokens: ['function', 'return'],
            distractors: ['fn', '=>', 'yield'],
            explanation: '`table.sort` expects `a > b` boolean comparison for descending order.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot assigning the return value of in-place `table.sort`.',
            lines: [
              'local nums = {4, 1, 3}',
              'nums = table.sort(nums)',
              'print(nums[1])',
            ],
            bugLine: 1,
            fixed: 'table.sort(nums)',
            explanation: '`table.sort(nums)` sorts in place and returns `nil`—assigning it wipes out `nums`!',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss: Closure Engine',
        subtitle: 'Combine varargs, multi-return status, and recursive locals',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build a safe multiplier factory returning product and step count.',
            codeLines: ['local function tracker(k)', '  local calls = 0', '  return function(v)', '    calls = calls + 1', '    {{0}} v * k, {{1}}', '  end', 'end'],
            expectedTokens: ['return', 'calls'],
            distractors: ['yield', 'k', 'local'],
            explanation: 'Returns both computed product and incremented upvalue counter natively.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace vararg `select("#", ...)` count.',
            code: ['local function n(...)', '  return select("#", ...)', 'end', 'print(n(10, nil, 30))'],
            options: ['3', '1', '2'],
            answer: 0,
            explanation: '`select("#", ...)` accurately counts all passed slots (`3`), even with `nil` inside!',
          },
          {
            type: 'find_bug',
            prompt: 'Fix truncation wiping the second return value before assigning.',
            lines: [
              'local function vals() return 5, 9 end',
              'local a, b = vals(), 1',
            ],
            bugLine: 1,
            fixed: 'local a, b = vals()',
            explanation: 'Putting `, 1` after `vals()` collapses `vals()` to only its first value `5`, making `b = 1` instead of `9`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Tables as Arrays & Maps (5 nodes)
  // =========================================================================
  {
    title: 'Tables as Arrays & Maps',
    subtitle: 'Master Lua’s single universal data structure: 1-based sequences and hash maps.',
    conceptGraphicType: 'lua_tables',
    guidebook: {
      summary:
        'Lua keeps the language astonishingly minimal by unifying arrays, dictionaries, objects, and modules into **one single structure: the `table` (`{}`)**—starting sequences at index **`1`** (`ipairs`), and mapping string/key entries via hash slots (`pairs`).',
      mentalModel:
        'Every Lua table silently blends two C regions under the hood: a flat **array block** for dense integers `1..n` plus a **hash table** for everything else—zero ceremony to construct or traverse!',
      keyTakeaways: [
        'Sequence arrays start at index **`1`** (`t[1]` first item, `t[#t]` last item); never rely on `t[0]` for stdlib helpers!',
        'Append cleanly with **`table.insert(t, val)`** or `t[#t + 1] = val`, and iterate dense lists with `ipairs(t)`.',
        'Access string keys via dot sugar `cfg.port` (equivalent to `cfg["port"]`), and delete keys by setting `cfg.port = nil`.',
        'Avoid `nil` "holes" inside arrays (`{10, nil, 30}`): `#t` and `ipairs(t)` can stop early at missing entries!',
      ],
      keySyntax: [
        {
          title: 'Mixed Arrays & Record Syntax',
          tag: 'TABLES',
          code: 'local arr = {"Lua", "5.4"}\nlocal cfg = { host = "localhost", port = 8080 }\nprint(arr[1] .. ":" .. cfg.port)',
          output: 'Lua:8080',
          explanation:
            'Arrays list values sequentially (`1, 2`), while record keys assign cleanly with `key = val`.',
          notes: [
            'Use bracketed keys `{ [100] = "score", ["a-b"] = true }` when keys aren’t simple identifiers.',
          ],
        },
        {
          title: 'ipairs (Ordered 1..N) vs pairs (All Keys)',
          tag: 'ITERATION',
          code: 'for i, v in ipairs({"a", "b"}) do print(i, v) end\nfor k, v in pairs({xp = 50}) do print(k, v) end',
          output: '1 a, 2 b\nxp 50',
          explanation:
            '`ipairs` walks dense integer keys `1, 2, ...` in guaranteed order; `pairs` visits every key (unordered hash + array).',
          notes: [
            'Stopping at the first `nil` means `ipairs` stops if a slot becomes `nil`.',
          ],
        },
        {
          title: 'Deleting Entries & table.concat',
          tag: 'MUTATION',
          code: 'local items = {"a", "b", "c"}\ntable.insert(items, "d")\nprint(table.concat(items, "-"))',
          output: 'a-b-c-d',
          explanation:
            '`table.concat` joins string/number elements vastly faster than concatenating with `..` inside a loop.',
          notes: [
            'Use `table.remove(items, idx)` to delete and shift array items without leaving a `nil` hole.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Assigning tbl[idx] = nil Inside an Array',
          buggyCode: 'local t = {"a", "b", "c"}; t[2] = nil -- hole breaks ipairs!',
          fixedCode: 'local t = {"a", "b", "c"}; table.remove(t, 2)',
          reason:
            'Setting an array element to `nil` leaves a hole where `ipairs` stops and `#t` becomes unpredictable.',
        },
        {
          title: 'Expecting 0-Based Indexing in ipairs / #t',
          buggyCode: 'local t = {[0] = "first", "second"}; print(#t)',
          fixedCode: 'local t = {"first", "second"}; print(#t)',
          reason:
            '`#t` counts from index `1` upward—index `[0]` sits in the hash half and is ignored by `#t` and `ipairs`!',
        },
      ],
      proTip:
        'Joining hundreds of text chunks? Append into a local array table (`buf[#buf + 1] = s`) and join once at the end with `table.concat(buf)` to avoid quadratic string reallocations.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Tables as Sequences (1..#t)',
        subtitle: 'Index arrays from 1 and grow/remove elements without holes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Arrays Begin at 1',
            explanation:
              'Curly braces `{...}` create a Lua table. Array slots count cleanly from index `1` to `#t`. Use `table.insert(t, x)` to append and `table.remove(t, i)` to delete safely.',
            code: ['local list = {"py", "lua"}', 'table.insert(list, "rs")', 'print(list[1], #list)'],
            highlightNote: 'Notice `table.insert` mutates `list` cleanly without shifting gaps.',
          },
          {
            type: 'token_builder',
            prompt: 'Append `"go"` to `langs` and fetch its final element using `#langs`.',
            codeLines: ['local langs = {"c", "lua"}', 'table.{{0}}(langs, "go")', 'print(langs[{{1}}langs])'],
            expectedTokens: ['insert', '#'],
            distractors: ['push', 'append', 'len'],
            explanation: '`table.insert` pushes `"go"` to slot `3`, read cleanly via `langs[#langs]`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the 0-index lookup missing the first array item.',
            lines: [
              'local scores = {95, 88, 72}',
              'print(scores[0])',
            ],
            bugLine: 1,
            fixed: 'print(scores[1])',
            explanation: 'In Lua array literals, `"95"` sits at `scores[1]`, leaving `scores[0]` as `nil`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `table.remove` shift?',
            code: ['local t = {"a", "b", "c"}', 'table.remove(t, 2)', 'print(t[2])'],
            options: ['c', 'nil', 'b'],
            answer: 0,
            explanation: '`table.remove(t, 2)` removes `"b"` and shifts `"c"` down into slot `2`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Tables as Dictionaries',
        subtitle: 'Store structured keys with dot sugar and delete keys via nil',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Record Syntax & Nil Removal',
            explanation:
              '`local user = { name = "Kai", xp = 100 }` sets string keys directly. Read `user.name` (`user["name"]`), or erase keys by assigning `user.xp = nil`.',
            code: ['local cfg = { retries = 3, tls = true }', 'cfg.tls = nil', 'print(cfg.retries)'],
            highlightNote: 'Any non-`nil` value (even functions or other tables!) can serve as a dictionary key via `[key]`.',
          },
          {
            type: 'token_builder',
            prompt: 'Initialize key `"port"` inside a Lua table and clear `"tmp"` cleanly.',
            codeLines: ['local srv = { {{0}} = 8080, tmp = true }', 'srv.tmp = {{1}}'],
            expectedTokens: ['port', 'nil'],
            distractors: ['"port":', 'delete', 'null'],
            explanation: 'Identifiers use bare `port = 8080` and deleting a key assigns `nil`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix invalid JSON-colon dictionary syntax in Lua.',
            lines: [
              'local user = { name: "Ada", lvl: 5 }',
              'print(user.name)',
            ],
            bugLine: 0,
            fixed: 'local user = { name = "Ada", lvl = 5 }',
            explanation: 'Lua record keys always assign with `=`, never `:`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 3 Checkpoint',
        subtitle: 'Distinguish ipairs vs pairs and join strings efficiently',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Iterate dense array indices in guaranteed `1..N` order.',
            codeLines: ['for i, v in {{0}}({"x", "y"}) {{1}}', '  print(i, v)', 'end'],
            expectedTokens: ['ipairs', 'do'],
            distractors: ['pairs', 'range', 'then'],
            explanation: '`ipairs` guarantees ordered `1, 2, ...` array iteration.',
          },
          {
            type: 'multiple_choice',
            question: 'When traversing arbitrary string keys in a Lua dictionary, which iterator must you use?',
            options: ['pairs(tbl)', 'ipairs(tbl)', 'iter(tbl)', 'keys(tbl)'],
            answer: 0,
            explanation: '`ipairs` stops immediately on key `1` missing; `pairs` visits all hash and array entries.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `table.concat` return?',
            code: ['local t = {"a", "b", "c"}', 'print(table.concat(t, ":"))'],
            options: ['a:b:c', 'abc', '{a, b, c}'],
            answer: 0,
            explanation: '`table.concat(t, ":")` joins sequence items fast with separator `":"`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Table Holes & Nested Config',
        subtitle: 'Avoid sparse nil gaps and index computed dictionary keys',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Preventing Sequence Holes',
            explanation:
              'Setting `arr[2] = nil` makes `#arr` and `ipairs(arr)` unpredictable because Lua assumes sequences are contiguous from `1..N`. Use `table.remove` on lists!',
            code: ['local k = "xp"', 'local bag = { [k] = 100 }', 'print(bag.xp)'],
            highlightNote: 'Square brackets `{ [expr] = val }` evaluate expressions as dynamic table keys.',
          },
          {
            type: 'token_builder',
            prompt: 'Use variable `key` dynamically inside a table literal.',
            codeLines: ['local key = "rank"', 'local meta = { [{{0}}] = 1 }', 'print(meta.{{1}})'],
            expectedTokens: ['key', 'rank'],
            distractors: ['"key"', 'key', '['],
            explanation: '`{ [key] = 1 }` evaluates `key` to `"rank"`, readable as `meta.rank`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix leaving a `nil` hole inside an active list.',
            lines: [
              'local q = {"a", "b", "c"}',
              'q[2] = nil',
              'print(#q)',
            ],
            bugLine: 1,
            fixed: 'table.remove(q, 2)',
            explanation: 'Use `table.remove(q, 2)` to shrink contiguous arrays cleanly without leaving holes.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss: Table Architect',
        subtitle: 'Build fast buffered strings, dynamic keys, and clean loops',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Accumulate parts cleanly in a sequence and join with `table.concat`.',
            codeLines: ['local buf = {}', 'for i = 1, 3 do buf[#buf + 1] = "v" .. i end', 'print({{0}}.{{1}}(buf, ", "))'],
            expectedTokens: ['table', 'concat'],
            distractors: ['string', 'join', 'insert'],
            explanation: '`table.concat(buf, ", ")` produces `"v1, v2, v3"` efficiently.',
          },
          {
            type: 'predict_output',
            prompt: 'Where does `ipairs` stop on a sparse table?',
            code: ['local t = {10, nil, 30}', 'local count = 0', 'for _ in ipairs(t) do count = count + 1 end', 'print(count)'],
            options: ['1', '3', '2'],
            answer: 0,
            explanation: '`ipairs` exits immediately upon hitting `t[2] == nil`, yielding count `1`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix iterating dictionary keys cleanly.',
            lines: [
              'local scores = {ada = 10, leo = 20}',
              'for k, v in ipairs(scores) do print(k, v) end',
            ],
            bugLine: 1,
            fixed: 'for k, v in pairs(scores) do print(k, v) end',
            explanation: '`scores` has string keys—`ipairs` skips them completely; use `pairs`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Metatables & Prototype OOP (5 nodes)
  // =========================================================================
  {
    title: 'Metatables & Prototype OOP',
    subtitle: 'Customize lookups, operators, and clean method calls via __index and : sugar.',
    conceptGraphicType: 'lua_meta',
    guidebook: {
      summary:
        'Lua has no built-in `class` keyword—instead, **metatables (`setmetatable`)** give any table custom fallback lookups (`__index`), operator overloading (`__add`, `__tostring`), and clean OOP using colon sugar (`obj:hit(10)`).',
      mentalModel:
        'Think of `__index` as a polite fallback assistant: if `hero["jump"]` isn’t on `hero` itself, Lua asks `hero`’s metatable `__index` (`Hero` prototype) cleanly with zero per-instance method copies!',
      keyTakeaways: [
        'Calling `obj:method(x)` is pure syntactic sugar for `obj.method(obj, x)`—likewise `function Foo:bar(x)` injects hidden parameter `self`!',
        'Bind prototype methods cleanly by setting `Class.__index = Class` and attaching `setmetatable({}, Class)`.',
        'Override operators cleanly via metamethods: `__add` (`+`), `__eq` (`==`), `__tostring` (`tostring(x)`), and `__call` (`x(...)`).',
        'Missing keys consult `__index`; writing unknown keys can trigger guard metamethod `__newindex`.',
      ],
      keySyntax: [
        {
          title: 'Prototype Classes with __index & : Sugar',
          tag: 'OOP',
          code: 'local Counter = {}\nCounter.__index = Counter\nfunction Counter.new() return setmetatable({ n = 0 }, Counter) end\nfunction Counter:inc() self.n = self.n + 1 end',
          output: 'local c = Counter.new(); c:inc() -> c.n == 1',
          explanation:
            '`c:inc()` passes `c` automatically as `self`; Lua finds `inc` on `Counter` via `__index`.',
          notes: [
            'Calling `c.inc()` with a dot instead of `:` fails to pass `self` unless supplied explicitly (`c.inc(c)`).',
          ],
        },
        {
          title: 'Custom Operators (__add, __tostring)',
          tag: 'METAMETHODS',
          code: 'local Vec = { __add = function(a, b)\n  return setmetatable({ x = a.x + b.x }, getmetatable(a))\nend }',
          output: 'v1 + v2 evaluates cleanly via __add!',
          explanation:
            'Any operator on tables consults its metatable’s matching dunder key cleanly.',
          notes: [
            '`__tostring` customizes what `print(obj)` displays cleanly!',
          ],
        },
        {
          title: 'Default Values via Function __index',
          tag: 'DEFAULTS',
          code: 'local counts = setmetatable({}, { __index = function() return 0 end })\nprint(counts.missing)',
          output: '0',
          explanation:
            'Passing a function as `__index(tbl, key)` computes fallback defaults dynamically whenever keys are absent.',
          notes: [
            'To bypass metamethods directly, use raw intrinsics `rawget(t, k)` and `rawset(t, k, v)`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Calling a : Method with a Dot (Forgetting self)',
          buggyCode: 'local h = Hero.new(); h.takeDamage(10)',
          fixedCode: 'local h = Hero.new(); h:takeDamage(10)',
          reason:
            '`h.takeDamage(10)` passes `10` as `self`, causing `attempt to index a number value`!',
        },
        {
          title: 'Forgetting Class.__index = Class Before setmetatable',
          buggyCode: 'local obj = setmetatable({}, Dog) -- Dog has no __index!',
          fixedCode: 'Dog.__index = Dog\nlocal obj = setmetatable({}, Dog)',
          reason:
            'A metatable needs explicit `__index = Dog`—otherwise Lua won’t fall back to `Dog`’s methods!',
        },
      ],
      proTip:
        'Guard against typo’d global reads/writes in large Lua scripts by putting a `__newindex` metamethod error trap on `_G`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Colon Sugar & self',
        subtitle: 'Understand obj:method() vs obj.method(obj)',
        exercises: [
          {
            type: 'theory_bite',
            title: 'The Colon : Shortcut',
            explanation:
              'Lua attaches methods cleanly via `:`: `function Dog:bark()` automatically accepts hidden first argument `self`, matching calls written `myDog:bark()`.',
            code: ['local timer = { sec = 5 }', 'function timer:tick() self.sec = self.sec - 1 end', 'timer:tick()'],
            highlightNote: '`timer:tick()` strictly means `timer.tick(timer)`!',
          },
          {
            type: 'token_builder',
            prompt: 'Define and invoke `add` using colon method sugar cleanly.',
            codeLines: ['local bag = { xp = 0 }', 'function bag{{0}}add(pts) {{1}}.xp = self.xp + pts end', 'bag:add(25)'],
            expectedTokens: [':', 'self'],
            distractors: ['.', 'this', 'bag'],
            explanation: '`:` injects `self` on both definition and call site.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing `self` argument caused by using `.` instead of `:`.',
            lines: [
              'local c = { n = 10 }',
              'function c:inc() self.n = self.n + 1 end',
              'c.inc()',
            ],
            bugLine: 2,
            fixed: 'c:inc()',
            explanation: 'Calling `c.inc()` omits `self` (`nil`); use `c:inc()` with a colon.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Metatables & __index',
        subtitle: 'Wire prototype inheritance and lazy default fallbacks cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Fallback Lookup with __index',
            explanation:
              'When a table lacks a key, Lua checks its metatable’s `__index` field. Setting `Hero.__index = Hero` lets every `setmetatable({}, Hero)` share `Hero`’s methods cleanly!',
            code: ['local Hero = {}', 'Hero.__index = Hero', 'function Hero:hi() return "Hero" end', 'local h = setmetatable({}, Hero)'],
            highlightNote: '`getmetatable(h)` inspects which metatable is currently attached.',
          },
          {
            type: 'token_builder',
            prompt: 'Wire `Player` as the fallback `__index` prototype for new instances.',
            codeLines: ['local Player = {}', 'Player.{{0}} = Player', 'function Player.new(name)', '  return {{1}}({ name = name }, Player)', 'end'],
            expectedTokens: ['__index', 'setmetatable'],
            distractors: ['prototype', 'extends', 'newtable'],
            explanation: '`__index = Player` + `setmetatable` forms clean Lua prototype OOP.',
          },
          {
            type: 'predict_output',
            prompt: 'What does a default-zero `__index` return on missing keys?',
            code: ['local zeros = setmetatable({ a = 5 }, { __index = function() return 0 end })', 'print(zeros.a + zeros.missing)'],
            options: ['5', 'nil', 'Error'],
            answer: 0,
            explanation: '`zeros.a` hits `5`, `zeros.missing` triggers `__index` -> `0`, printing `5`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 4 Checkpoint',
        subtitle: 'Check metamethods, __add, __tostring, and rawget',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Customize `tostring(box)` via the `__tostring` metamethod.',
            codeLines: ['local mt = {', '  {{0}} = function(b) return "Box(" .. b.v .. ")" end', '}', 'local box = {{1}}({ v = 9 }, mt)'],
            expectedTokens: ['__tostring', 'setmetatable'],
            distractors: ['toString', 'format', 'prototype'],
            explanation: '`__tostring` hooks cleanly into `tostring()` and `print()`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which Lua helper reads a key from a table WITHOUT triggering its `__index` metamethod?',
            options: ['rawget(t, k)', 'direct(t, k)', 't[k]', 'pairs(t)'],
            answer: 0,
            explanation: '`rawget` bypasses metamethod hooks directly on raw table slots.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix forgot setting `Item.__index = Item` before attaching metatable.',
            lines: [
              'local Item = {}; function Item:ping() print("ok") end',
              'local x = setmetatable({}, Item)',
              'x:ping()',
            ],
            bugLine: 0,
            fixed: 'local Item = {}; Item.__index = Item; function Item:ping() print("ok") end',
            explanation: 'Without `Item.__index = Item`, Lua never falls back into `Item` when looking up `ping`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Operator Overloading',
        subtitle: 'Define clean vector math and equality via metamethods',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Table Operators',
            explanation:
              'Override `+`, `-`, `*`, and `==` on domain tables via `__add`, `__sub`, `__mul`, and `__eq` inside their shared metatable.',
            code: ['Vec.__add = function(a, b) return Vec.new(a.x + b.x) end'],
            highlightNote: '`__eq` runs automatically only when both tables share a metatable with `__eq`!',
          },
          {
            type: 'token_builder',
            prompt: 'Implement vector addition for `v1 + v2` using `__add`.',
            codeLines: ['local mt = {}', 'mt.{{0}} = function(a, b)', '  return {{1}}({ x = a.x + b.x }, mt)', 'end'],
            expectedTokens: ['__add', 'setmetatable'],
            distractors: ['add', 'operator+', 'clone'],
            explanation: '`__add` implements `+` and returns a new metatable-attached instance.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot forgetting the leading double underscore on a metamethod key.',
            lines: [
              'local mt = { add = function(a, b) return a.x + b.x end }',
              'local a = setmetatable({ x = 2 }, mt)',
              'local b = setmetatable({ x = 3 }, mt)',
              'print(a + b)',
            ],
            bugLine: 0,
            fixed: 'local mt = { __add = function(a, b) return a.x + b.x end }',
            explanation: 'Lua metamethod keys always require double underscores (`__add`).',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss: Custom Vector OOP',
        subtitle: 'Wire constructors, methods, and metamethods cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Complete the prototype `Timer` with constructor, `:reset()`, and `__tostring`.',
            codeLines: ['local Timer = {}; Timer.{{0}} = Timer', 'function Timer.new() return setmetatable({ s = 0 }, Timer) end', 'function Timer{{1}}reset() self.s = 0 end'],
            expectedTokens: ['__index', ':'],
            distractors: ['__proto', '.', 'this'],
            explanation: '`__index` enables inheritance and `:` supplies `self` automatically.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this prototype lookup print?',
            code: ['local Base = { tag = "Core" }; Base.__index = Base', 'local obj = setmetatable({ tag = "Sub" }, Base)', 'print(obj.tag)'],
            options: ['Sub', 'Core', 'nil'],
            answer: 0,
            explanation: '`obj` already defines its own key `tag = "Sub"`, so `__index` fallback is never needed!',
          },
          {
            type: 'find_bug',
            prompt: 'Fix forgetting colon call when calling a method expecting `self`.',
            lines: [
              'local Bot = {}; Bot.__index = Bot',
              'function Bot:name() return self.n end',
              'local b = setmetatable({ n = "L0" }, Bot)',
              'print(b.name())',
            ],
            bugLine: 3,
            fixed: 'print(b:name())',
            explanation: '`b:name()` passes `b` cleanly as `self`; dot call `b.name()` passes `nil`!',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Coroutines & Embeddable Games (5 nodes)
  // =========================================================================
  {
    title: 'Coroutines & Embeddable Games',
    subtitle: 'Coordinate pause/resume workflows and guard errors cleanly with pcall.',
    conceptGraphicType: 'lua_coro',
    guidebook: {
      summary:
        'Lua’s **coroutines** let scripts pause mid-function (`coroutine.yield`) and resume seamlessly across game frames (`coroutine.resume`), while **`pcall`** wraps risky calls safely without exception classes!',
      mentalModel:
        'Unlike OS threads that race concurrently, only ONE coroutine runs at a time and yields explicitly (`coroutine.yield()`), making multi-frame cutscenes, AI scripts, and iterators effortless with zero locks.',
      keyTakeaways: [
        'Create a paused coroutine with `local co = coroutine.create(fn)`, advance it with `coroutine.resume(co, ...)`, and pause inside via `coroutine.yield(...)`.',
        '`coroutine.resume(co)` returns **`ok, val1, val2...`** just like `pcall`—if `co` throws an error, `ok` is `false` and `val1` is the message!',
        'Wrap fallible host/script code cleanly using **`local ok, res = pcall(fn, arg)`** instead of `try/catch`.',
        'Use `coroutine.status(co)` (`"suspended"`, `"running"`, `"dead"`) to clean up finished game state machines.',
      ],
      keySyntax: [
        {
          title: 'Pause & Resume Game Steps',
          tag: 'COROUTINES',
          code: 'local co = coroutine.create(function()\n  print("Step 1")\n  coroutine.yield("paused")\n  print("Step 2")\nend)\nlocal ok, msg = coroutine.resume(co)',
          output: 'Step 1 (and msg == "paused")',
          explanation:
            'Calling `coroutine.resume(co)` again prints `Step 2` and transitions status to `"dead"`.',
          notes: [
            'Pass data **into** a resumed coroutine as extra arguments to `coroutine.resume(co, data)`.',
          ],
        },
        {
          title: 'Safe Protected Calls with pcall',
          tag: 'ERROR HANDLING',
          code: 'local function risky(x)\n  if x < 0 then error("negative") end\n  return x * 2\nend\nlocal ok, res = pcall(risky, -1)',
          output: 'ok == false, res == "... negative"',
          explanation:
            'Instead of crashing the whole host app, `pcall` catches `error(...)` and returns `false, errorMsg`.',
          notes: [
            'Pass arguments cleanly to `pcall(fn, arg1, arg2)`—zero wrapper closure allocation needed!',
          ],
        },
        {
          title: 'Custom Stateful Iterators via coroutine.wrap',
          tag: 'ITERATORS',
          code: 'local nextStep = coroutine.wrap(function()\n  for i = 1, 2 do coroutine.yield(i * 10) end\nend)\nprint(nextStep(), nextStep())',
          output: '10 20',
          explanation:
            '`coroutine.wrap` builds a plain callable function directly suited for `for v in iter do` loops!',
          notes: [
            'Unlike `resume`, errors inside `coroutine.wrap` propagate upward directly rather than returning `false`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting ok Flag Returned by resume / pcall',
          buggyCode: 'local val = pcall(parseConfig, raw)',
          fixedCode: 'local ok, val = pcall(parseConfig, raw)',
          reason:
            'Both `pcall` and `coroutine.resume` return boolean `ok` first and the actual value second!',
        },
        {
          title: 'Resuming a Dead Coroutine Without Checking',
          buggyCode: 'coroutine.resume(doneCo) -- returns false, "cannot resume dead coroutine"',
          fixedCode: 'if coroutine.status(co) ~= "dead" then coroutine.resume(co) end',
          reason:
            'Once a coroutine returns from its function body, its status becomes `"dead"` and cannot resume again.',
        },
      ],
      proTip:
        'Pair Lua **coroutines** with a game engine tick loop: each NPC cutscene yields `coroutine.yield("wait_1s")` cleanly without nested frame counters!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'create, yield & resume',
        subtitle: 'Pause execution mid-function and resume across steps cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Cooperative Coroutines',
            explanation:
              '`coroutine.create(fn)` starts a suspended coroutine. Calling `coroutine.resume(co)` runs until `coroutine.yield(val)` pauses cleanly and returns `true, val`.',
            code: ['local co = coroutine.create(function()', '  coroutine.yield(10)', '  return 20', 'end)', 'local ok, a = coroutine.resume(co)'],
            highlightNote: 'Notice `a` receives `10` on the first resume and `20` on the second!',
          },
          {
            type: 'token_builder',
            prompt: 'Pause inside a coroutine yielding `"wait"` and advance it once.',
            codeLines: ['local co = coroutine.create(function()', '  coroutine.{{0}}("wait")', 'end)', 'local ok, msg = coroutine.{{1}}(co)'],
            expectedTokens: ['yield', 'resume'],
            distractors: ['await', 'pause', 'start'],
            explanation: '`coroutine.yield` pauses execution; `coroutine.resume` continues it.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `ok, val` hold after the 2nd resume?',
            code: ['local co = coroutine.create(function()', '  coroutine.yield("A")', '  return "B"', 'end)', 'coroutine.resume(co)', 'local ok, val = coroutine.resume(co)', 'print(val)'],
            options: ['B', 'A', 'nil'],
            answer: 0,
            explanation: 'First resume stopped at `"A"`, second finishes cleanly returning `"B"`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Protected Errors with pcall',
        subtitle: 'Catch errors cleanly without crashing embedded host apps',
        exercises: [
          {
            type: 'theory_bite',
            title: 'No try/catch Needed',
            explanation:
              'Pass a function and its arguments into `pcall(fn, a, b)`. If `fn` throws `error(...)`, `pcall` catches it cleanly and returns `false, message`; on success it returns `true, result`.',
            code: ['local ok, err = pcall(function() error("bad input") end)', 'if not ok then print("Caught:", err) end'],
            highlightNote: 'Use `xpcall(fn, errHandler)` when you need stack traces collected before unwinding.',
          },
          {
            type: 'token_builder',
            prompt: 'Invoke `risky(5)` safely and check boolean status `ok`.',
            codeLines: ['local ok, res = {{0}}(risky, 5)', 'if {{1}} ok then print("Safe:", res) end'],
            expectedTokens: ['pcall', 'and'],
            distractors: ['try', 'catch', 'or'],
            explanation: '`pcall(fn, arg)` avoids closure allocation and returns `ok, res`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot forgetting that `pcall` returns boolean status BEFORE the result.',
            lines: [
              'local function double(n) return n * 2 end',
              'local res = pcall(double, 4)',
              'print(res + 1)',
            ],
            bugLine: 1,
            fixed: 'local ok, res = pcall(double, 4)',
            explanation: '`res` caught boolean `true` instead of `8`, crashing arithmetic `true + 1`!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 5 Checkpoint',
        subtitle: 'Check coroutine lifecycle status and wrap helpers cleanly',
        exercises: [
          {
            type: 'multiple_choice',
            question: 'What is `coroutine.status(co)` right after `coroutine.create(fn)`?',
            options: ['"suspended"', '"running"', '"dead"', '"idle"'],
            answer: 0,
            explanation: 'Created coroutines begin `"suspended"` until first resumed.',
          },
          {
            type: 'token_builder',
            prompt: 'Prevent resuming a finished coroutine cleanly.',
            codeLines: ['if coroutine.{{0}}(co) ~= "{{1}}" then', '  coroutine.resume(co)', 'end'],
            expectedTokens: ['status', 'dead'],
            distractors: ['state', 'done', 'closed'],
            explanation: 'Guard with `coroutine.status(co) ~= "dead"` before resuming.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `coroutine.wrap` produce?',
            code: ['local w = coroutine.wrap(function()', '  coroutine.yield(7)', '  return 9', 'end)', 'print(w() + w())'],
            options: ['16', '7', 'Error'],
            answer: 0,
            explanation: '`w()` behaves as a plain generator returning `7` then `9` (`7 + 9 = 16`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Passing Values via yield',
        subtitle: 'Exchange data two-ways between host and coroutine',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Bi-Directional Message Passing',
            explanation:
              'Arguments passed into `coroutine.resume(co, x)` become the **return values of `coroutine.yield()`** inside the paused coroutine—enabling seamless state machines!',
            code: ['local co = coroutine.create(function(a)', '  local b = coroutine.yield(a + 1)', '  return b * 10', 'end)'],
            highlightNote: 'First `resume` passes arguments to `function(...)`; later resumes feed `yield(...)`!',
          },
          {
            type: 'token_builder',
            prompt: 'Catch a signal back from `coroutine.yield("ready")` inside the coroutine.',
            codeLines: ['local co = coroutine.create(function()', '  local cmd = coroutine.{{0}}("ready")', '  return cmd', 'end)', 'coroutine.resume(co)', 'local ok, out = coroutine.{{1}}(co, "GO")'],
            expectedTokens: ['yield', 'resume'],
            distractors: ['send', 'next', 'wrap'],
            explanation: 'Passing `"GO"` into the second `resume` makes `yield` return `"GO"`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix trying to pass yield data inside `pcall` syntax incorrectly.',
            lines: [
              'local co = coroutine.create(function() return 1 end)',
              'local ok = coroutine.resume(co)',
              'coroutine.resume(co)',
            ],
            bugLine: 2,
            fixed: 'if coroutine.status(co) ~= "dead" then coroutine.resume(co) end',
            explanation: 'Resuming after the coroutine already returned leaves it `"dead"` and returns `false`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss: Script Scheduler',
        subtitle: 'Orchestrate safe coroutines and protected callbacks cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build an iterator factory with `coroutine.wrap` yielding dense items.',
            codeLines: ['local function seq(n)', '  return coroutine.{{0}}(function()', '    for i = 1, n do coroutine.{{1}}(i * i) end', '  end)', 'end'],
            expectedTokens: ['wrap', 'yield'],
            distractors: ['create', 'return', 'resume'],
            explanation: '`coroutine.wrap` works natively inside `for x in seq(3) do` loops!',
          },
          {
            type: 'predict_output',
            prompt: 'What does `pcall` return on success?',
            code: ['local function okFn() return 42 end', 'local ok, v = pcall(okFn)', 'print(tostring(ok) .. ":" .. v)'],
            options: ['true:42', '42:nil', 'false:42'],
            answer: 0,
            explanation: '`pcall` returns `true` followed by the normal return value `42`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix calling a function argument inside `pcall` prematurely (`pcall(fn())`).',
            lines: [
              'local function boom() error("fail") end',
              'local ok, err = pcall(boom())',
            ],
            bugLine: 1,
            fixed: 'local ok, err = pcall(boom)',
            explanation: 'Passing `boom()` executes it BEFORE `pcall` can protect it; pass the function `boom` itself!',
          },
        ],
      },
    ],
  },
];
