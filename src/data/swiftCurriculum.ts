import type { UnitSeed } from './types';

export const SWIFT_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Constants, Types & Safety (6 nodes)
  // =========================================================================
  {
    title: 'Constants, Types & Safety',
    subtitle: 'Prefer immutable let bindings, string interpolation, and strict Swift types.',
    conceptGraphicType: 'swift_vars',
    guidebook: {
      summary:
        'Swift defaults to **safety by construction**: prefer `let` constants over mutable `var` variables, rely on clean type inference, and use `\\(...)` interpolation instead of raw string concatenation.',
      mentalModel:
        'Think of `let` as a sealed box assigned once and guaranteed never to mutate underneath another function, while `var` opens the lid only when change is genuinely needed.',
      keyTakeaways: [
        'Declare constants with `let` and mutable state with `var`—the Swift compiler warns when a `var` is never mutated.',
        'Swift infers concrete types (`Int`, `Double`, `String`, `Bool`) from literals; write `: Type` only for clarity or empty collections.',
        'Swift never silently widens `Int` into `Double`; convert explicitly via `Double(count)`.',
        'Interpolate any expression inside string literals using `\\(expression)`.',
      ],
      keySyntax: [
        {
          title: 'let Constants & Interpolation',
          tag: 'BINDINGS',
          code: 'let language = "Swift"\nvar streak: Int = 7\nstreak += 1\nprint("\\(language) streak: \\(streak)")',
          output: 'Swift streak: 8',
          explanation:
            '`language` cannot be reassigned after initialization, whereas `streak` updates safely in place.',
          notes: [
            'String interpolation `\\(...)` works with math and property calls too: `\\(streak * 2)`.',
          ],
        },
        {
          title: 'Functions with Argument Labels',
          tag: 'FUNCTIONS',
          code: 'func greet(user name: String, xp: Int = 10) -> String {\n  return "\\(name) +\\(xp) XP"\n}\nlet msg = greet(user: "Lucas")',
          output: '"Lucas +10 XP"',
          explanation:
            'Callers pass external labels (`user:`), while the body uses the internal name (`name`), making call sites read like prose.',
          notes: [
            'Prefix a parameter with `_` to omit its external argument label at call sites.',
          ],
        },
        {
          title: 'Arrays, Dictionaries & Loops',
          tag: 'COLLECTIONS',
          code: 'var scores: [String: Int] = ["Ada": 95]\nscores["Lucas"] = 100\nfor i in 1...3 { print(i) }',
          output: '1\n2\n3',
          explanation:
            'Square brackets express both arrays `[Int]` and dictionaries `[String: Int]`; `1...3` is a closed range including `3`.',
          notes: [
            'Use half-open `0..<count` when indexing into zero-based arrays.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Mixing Int and Double Without Explicit Conversion',
          buggyCode: 'let total = 10 + 2.5\nlet a: Int = 10; let b: Double = 2.5; let sum = a + b',
          fixedCode: 'let a: Int = 10; let b: Double = 2.5; let sum = Double(a) + b',
          reason:
            'Literals adapt (`10 + 2.5`), but typed variables `Int` and `Double` require an explicit `Double(a)` cast.',
        },
        {
          title: 'Mutating a let Binding',
          buggyCode: 'let lives = 5\nlives -= 1',
          fixedCode: 'var lives = 5\nlives -= 1',
          reason:
            '`let` enforces compile-time immutability; anything reassigned must be declared with `var`.',
        },
      ],
      proTip:
        'Type half-open array ranges as `0..<items.count`, or iterate directly (`for item in items`) to avoid off-by-one crashes completely.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'let vs var & Types',
        subtitle: 'Bind immutable constants and interpolate strings cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Immutable by Default',
            explanation:
              'Swift uses `let` for constants (fixed once assigned) and `var` for variables that change. Embed values inside strings with `\\(value)`.',
            code: ['let app = "CodeLingo"', 'var level: Int = 1', 'level += 1', 'print("\\(app) Lv.\\(level)")'],
            highlightNote: 'Starting with `let` prevents accidental state bugs across functions.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare an immutable `maxHearts` constant and a mutable `score` variable.',
            codeLines: ['{{0}} maxHearts: Int = 5', '{{1}} score = 0', 'score += 25'],
            expectedTokens: ['let', 'var'],
            distractors: ['const', 'mut', 'val'],
            explanation: '`let` locks constants while `var` permits reassignment.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the illegal reassignment to a constant.',
            lines: [
              'let limit = 60',
              'limit = 90',
              'print(limit)',
            ],
            bugLine: 1,
            fixed: 'var limit = 60',
            explanation: 'Changing `limit` requires declaring it with `var` instead of `let`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Swift interpolation print?',
            code: ['let x = 4', 'print("Total: \\(x * 3)")'],
            options: ['Total: (x * 3)', 'Total: 12', 'Total: 43'],
            answer: 1,
            explanation: '`\\(x * 3)` evaluates `4 * 3` to `12` inside the string.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Strict Numeric Types',
        subtitle: 'Respect explicit Int-to-Double casts and typed collections',
        exercises: [
          {
            type: 'theory_bite',
            title: 'No Hidden Numeric Casts',
            explanation:
              'Swift refuses to implicitly add an `Int` variable to a `Double` variable—wrap integers with `Double(n)` explicitly so precision loss never surprises you.',
            code: ['let base: Int = 10', 'let bonus: Double = 1.5', 'let total = Double(base) + bonus'],
            highlightNote: 'Explicit conversions keep rounding and overflow decisions visible in code.',
          },
          {
            type: 'token_builder',
            prompt: 'Safely multiply `price` (`Double`) by `qty` (`Int`).',
            codeLines: ['let price: Double = 4.5', 'let qty: Int = 3', 'let bill = price * {{0}}({{1}})'],
            expectedTokens: ['Double', 'qty'],
            distractors: ['Int', 'float', 'price'],
            explanation: '`Double(qty)` converts the integer into a `Double` cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line with an empty untyped array error.',
            lines: [
              'let tags: [String] = ["swift", "ios"]',
              'var scores = []',
            ],
            bugLine: 1,
            fixed: 'var scores: [Int] = []',
            explanation: 'An empty literal `[]` needs an element type annotation like `: [Int]`.',
          },
          {
            type: 'multiple_choice',
            question: 'How do you write a Swift dictionary mapping String keys to Int values?',
            options: [
              '[String: Int]',
              'Map<String, Int>',
              '{String -> Int}',
              'Dictionary[String]',
            ],
            answer: 0,
            explanation: 'Swift spells dictionary types concisely as `[Key: Value]`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Functions & Ranges',
        subtitle: 'Write clear argument labels and safe closed or half-open ranges',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Readable Call Sites',
            explanation:
              'Swift functions include parameter labels at call sites (`award(points: 20)`) and return types with `->`. Ranges use `1...5` (inclusive) or `0..<5` (excludes 5).',
            code: ['func bonus(for hits: Int) -> Int {', '  return hits * 10', '}', 'let xp = bonus(for: 3)'],
            highlightNote: 'Use `...` for inclusive ends and `..<` for half-open slices.',
          },
          {
            type: 'token_builder',
            prompt: 'Return an `Int` from `double` and omit the external label with `_`.',
            codeLines: ['func double({{0}} n: Int) {{1}} Int {', '  return n * 2', '}'],
            expectedTokens: ['_', '->'],
            distractors: [':', '=>', 'void'],
            explanation: '`_ n` allows `double(5)` while `-> Int` declares the return type.',
          },
          {
            type: 'predict_output',
            prompt: 'How many times does `0..<3` run?',
            code: ['var sum = 0', 'for i in 0..<3 { sum += i }', 'print(sum)'],
            options: ['3', '6', '2'],
            answer: 0,
            explanation: '`0..<3` yields `0, 1, 2`, whose sum is `0 + 1 + 2 = 3`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid function return arrow syntax.',
            lines: [
              'func greet(name: String): String {',
              '  return "Hi \\(name)"',
              '}',
            ],
            bugLine: 0,
            fixed: 'func greet(name: String) -> String {',
            explanation: 'Swift functions specify return types with `->`, not `:`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 1 Checkpoint',
        subtitle: 'Verify constants, interpolation, and type-safe ranges',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Loop cleanly through `1...4` and interpolate each step.',
            codeLines: ['for step {{0}} 1...4 {', '  print("Step \\({{1}})")', '}'],
            expectedTokens: ['in', 'step'],
            distractors: ['of', 'i', ':'],
            explanation: '`for step in 1...4` iterates `1` through `4` inclusive.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Swift snippet print?',
            code: ['let nums = [10, 20, 30]', 'print(nums.count)'],
            options: ['2', '3', '30'],
            answer: 1,
            explanation: '`.count` returns the total number of elements (`3`).',
          },
          {
            type: 'multiple_choice',
            question: 'Which range excludes its upper bound `5`?',
            options: ['0..<5', '0...5', '0..5', 'range(0, 5)'],
            answer: 0,
            explanation: 'Half-open `0..<5` stops at `4` without including `5`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Tuples & Switch Precision',
        subtitle: 'Group multiple values cleanly and match exhaustive patterns',
        exercises: [
          {
            type: 'theory_bite',
            title: 'No Implicit Fallthrough in switch',
            explanation:
              'Swift `switch` statements must cover every case exhaustively and never fall through accidentally between cases—no `break` keyword needed!',
            code: ['let http = 200', 'switch http {', 'case 200...299: print("OK")', 'default: print("Retry")', '}'],
            highlightNote: 'A single `case` can even match ranges like `200...299` directly.',
          },
          {
            type: 'token_builder',
            prompt: 'Access a named tuple field and match a closed range in `switch`.',
            codeLines: ['let rank = (tier: "Gold", xp: 850)', 'switch rank.{{0}} {', '{{1}} 500...999: print("Gold")', 'default: break', '}'],
            expectedTokens: ['xp', 'case'],
            distractors: ['tier', 'when', 'match'],
            explanation: 'Named tuples expose `.xp`, and `switch` arms start with `case`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the non-exhaustive switch missing its `default` branch.',
            lines: [
              'let code = 404',
              'switch code {',
              'case 200: print("OK")',
              '}',
            ],
            bugLine: 1,
            fixed: 'default: print("Other") // inside switch',
            explanation: 'Switching on `Int` requires a `default:` branch to handle all remaining numbers.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss: Safe Scorer',
        subtitle: 'Debug mixed numeric types, let immutability, and interpolation',
        exercises: [
          {
            type: 'find_bug',
            prompt: 'Fix the mixed-type Int + Double addition.',
            lines: [
              'let base: Int = 50',
              'let mult: Double = 1.5',
              'let total = base * mult',
            ],
            bugLine: 2,
            fixed: 'let total = Double(base) * mult',
            explanation: 'Convert `base` to `Double(base)` before multiplying by `Double`.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the helper returning an interpolated badge.',
            codeLines: ['func badge(user: String, pts: Int) {{0}} String {', '  return "\\(user): \\({{1}})"', '}'],
            expectedTokens: ['->', 'pts'],
            distractors: [':', 'user', '=>'],
            explanation: '`-> String` declares return type and `\\(pts)` interpolates points.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace the final output of this Swift snippet.',
            code: ['var x = 2', 'switch x {', 'case 1, 2: x += 5', 'default: x = 0', '}', 'print(x)'],
            options: ['0', '7', '2'],
            answer: 1,
            explanation: '`case 1, 2:` matches `2`, runs `x += 5` -> `7`, and stops cleanly.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Optionals & Unwrapping (5 nodes)
  // =========================================================================
  {
    title: 'Optionals & Unwrapping',
    subtitle: 'Eliminate null-pointer crashes with ?, ??, if let, and guard let.',
    conceptGraphicType: 'swift_opt',
    guidebook: {
      summary:
        'In Swift, a normal `String` **can never be `nil`**. Missing values must be modeled explicitly with an **Optional** (`String?`), forcing you to unwrap safely before touching the inner value.',
      mentalModel:
        'An `Optional<T>` (`T?`) is a wrapped box that holds either `.some(value)` or `.none` (`nil`). You never crash from forgetting a null check because the compiler locks the box until you unwrap it.',
      keyTakeaways: [
        'Use `if let value` for scoped unwrapping when `nil` is just one normal branch.',
        'Use `guard let value else { return }` for early exits so happy-path code stays flat and unindented.',
        'Provide safe defaults cleanly with the nil-coalescing operator: `username ?? "Guest"`.',
        'Chain optional property access safely via `user?.profile?.handle`, and reserve `!` force-unwrapping strictly for provably impossible cases.',
      ],
      keySyntax: [
        {
          title: 'guard let Early Return & ?? Fallback',
          tag: 'UNWRAPPING',
          code: 'func welcome(_ name: String?) -> String {\n  guard let name else { return "Hello, Guest" }\n  return "Hello, \\(name)"\n}',
          output: '"Hello, Guest" if nil, "Hello, Ada" if "Ada"',
          explanation:
            '`guard let` checks for `nil` up front, exits early if missing, and leaves unwrapped `name: String` in scope below.',
          notes: [
            'Swift 5.7+ supports shorthand `guard let name else` without writing `= name`.',
          ],
        },
        {
          title: 'Nil Coalescing & Optional Chaining',
          tag: 'SAFE ACCESS',
          code: 'let input: String? = nil\nlet count = input?.count ?? 0\nprint(count)',
          output: '0',
          explanation:
            '`input?.count` evaluates to `Int?` (`nil`), and `?? 0` safely unwraps it to `0`.',
          notes: [
            'If `input` were `"Swift"`, `count` becomes `5`.',
          ],
        },
        {
          title: 'if let Conditional Binding',
          tag: 'SCOPED',
          code: 'let parsed = Int("42")\nif let num = parsed {\n  print(num * 2)\n}',
          output: '84',
          explanation:
            '`Int("42")` returns `Int?` because arbitrary text might fail parsing; `if let` binds `num` only when valid.',
          notes: [
            'You can chain conditions inside `if let`: `if let n = Int(raw), n > 0 { ... }`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Force-Unwrapping nil with !',
          buggyCode: 'let num = Int("abc")!\nprint(num)',
          fixedCode: 'let num = Int("abc") ?? 0\nprint(num)',
          reason:
            'Calling `!` on a `nil` Optional (`Int("abc")` is `nil`) immediately crashes the app with a fatal error.',
        },
        {
          title: 'Missing Early Exit Inside guard else',
          buggyCode: 'guard let x = opt else { print("empty") }',
          fixedCode: 'guard let x = opt else { return }',
          reason:
            'A `guard` `else` block must transfer control out of scope (`return`, `throw`, `break`, or `continue`).',
        },
      ],
      proTip:
        'Treat every `!` in application code like a warning sign: replacing `x!` with `guard let x` or `x ?? fallback` guarantees zero nil crashes at runtime.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Optional Basics & ??',
        subtitle: 'Model missing values explicitly with T? and nil coalescing',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicitly Absent Values',
            explanation:
              'Appending `?` makes a type Optional (`Int?`), meaning it holds an integer or `nil`. Use `??` to supply a fallback value cleanly.',
            code: ['let nick: String? = nil', 'let display = nick ?? "Anonymous"', 'print(display)'],
            highlightNote: '`String` cannot store `nil`; only `String?` can.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare an optional `Int?` and unwrap it with a `0` fallback.',
            codeLines: ['let bonus: {{0}} = nil', 'let applied = bonus {{1}} 0'],
            expectedTokens: ['Int?', '??'],
            distractors: ['Int', '?:', '||'],
            explanation: '`Int?` allows `nil`, and `??` returns `0` when `bonus` is `nil`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line assigning nil to a non-optional String.',
            lines: [
              'var bio: String = "iOS dev"',
              'bio = nil',
            ],
            bugLine: 1,
            fixed: 'var bio: String? = "iOS dev"',
            explanation: 'Non-optional `String` forbids `nil`; declare `var bio: String?`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `??` evaluate to here?',
            code: ['let cached: Int? = 50', 'print(cached ?? 10)'],
            options: ['10', '50', 'nil'],
            answer: 1,
            explanation: 'Since `cached` holds `50` (not `nil`), `??` returns `50`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'if let & guard let',
        subtitle: 'Unwrap Optionals safely and keep functions flat',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Early Exit with guard let',
            explanation:
              '`guard let` checks that an optional exists and exits early inside `else` if `nil`. Unlike `if let`, the unwrapped variable remains available for the rest of the function!',
            code: ['func show(_ id: Int?) {', '  guard let id else { return }', '  print("User #\\(id)")', '}'],
            highlightNote: 'Happy-path code stays unnested at the top level.',
          },
          {
            type: 'token_builder',
            prompt: 'Unwrap `token` with `guard let` and exit early if missing.',
            codeLines: ['func auth(_ token: String?) -> Bool {', '  {{0}} let token else { {{1}} false }', '  return !token.isEmpty', '}'],
            expectedTokens: ['guard', 'return'],
            distractors: ['if', 'break', 'unwrap'],
            explanation: '`guard let` binds `token` below and returns `false` on `nil`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the guard else block that fails to exit scope.',
            lines: [
              'func run(_ name: String?) {',
              '  guard let name else { print("Missing") }',
              '  print(name)',
              '}',
            ],
            bugLine: 1,
            fixed: '  guard let name else { return }',
            explanation: '`guard ... else` must exit the enclosing function with `return` (or `throw`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 2 Checkpoint',
        subtitle: 'Combine optional chaining, if let, and nil coalescing',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Chain optional `.first` safely and upper-case it.',
            codeLines: ['let words: [String] = []', 'let head = words.first{{0}}uppercased() ?? "NONE"'],
            expectedTokens: ['?.'],
            distractors: ['!.', '.', '??'],
            explanation: 'Optional chaining `?.` returns `nil` instead of crashing on empty arrays.',
          },
          {
            type: 'predict_output',
            prompt: 'What gets printed?',
            code: ['let raw = "99"', 'if let n = Int(raw) { print(n + 1) }'],
            options: ['100', '991', 'nil'],
            answer: 0,
            explanation: '`Int("99")` succeeds as `Optional(99)`, `if let` binds `99`, and prints `100`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does `Int("abc")!` crash a Swift app?',
            options: [
              'Force-unwrapping `nil` triggers a fatal runtime crash',
              'Strings cannot be passed to `Int(...)`',
              '`!` negates integer signs',
              '`Int()` returns `Bool`',
            ],
            answer: 0,
            explanation: '`Int("abc")` evaluates to `nil`, and `!` traps when an optional is `nil`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Optional Chaining Mastery',
        subtitle: 'Safely traverse nested properties without deep nesting',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Short-Circuit on First nil',
            explanation:
              'When calling `team?.lead?.name`, if any link is `nil`, Swift stops gracefully and returns `nil` for the whole chain without crashing.',
            code: ['let text: String? = "swift"', 'let len = text?.count ?? 0'],
            highlightNote: 'Every intermediate access returns an Optional until terminated by `??` or `if let`.',
          },
          {
            type: 'token_builder',
            prompt: 'Safely check `email?.isEmpty` with a fallback of `true`.',
            codeLines: ['let email: String? = nil', 'let blank = email{{0}}isEmpty {{1}} true'],
            expectedTokens: ['?.', '??'],
            distractors: ['!.', '&&', '||'],
            explanation: '`?.` skips `.isEmpty` when `nil`, and `?? true` evaluates to `true`.',
          },
          {
            type: 'find_bug',
            prompt: 'Remove the dangerous force-unwrap on user input.',
            lines: [
              'let portText = "abc"',
              'let port = Int(portText)!',
            ],
            bugLine: 1,
            fixed: 'let port = Int(portText) ?? 8080',
            explanation: 'Use `?? 8080` instead of `!` so malformed input never crashes.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss: Crash-Proof Parser',
        subtitle: 'Combine guard let, Int parsing, and optional chaining',
        exercises: [
          {
            type: 'find_bug',
            prompt: 'Fix the unguarded optional usage in `parseAge`.',
            lines: [
              'func nextYear(_ input: String) -> Int {',
              '  let age = Int(input)',
              '  return age + 1',
              '}',
            ],
            bugLine: 2,
            fixed: '  return (age ?? 0) + 1',
            explanation: '`age` has type `Int?` and must be unwrapped before adding `1`.',
          },
          {
            type: 'token_builder',
            prompt: 'Require both non-nil `name` and non-empty check.',
            codeLines: ['func tag(_ name: String?) -> String {', '  {{0}} let name, !name.isEmpty else { return "guest" }', '  return name.lowercased()', '}'],
            expectedTokens: ['guard'],
            distractors: ['when', 'assert', 'switch'],
            explanation: '`guard let name, !name.isEmpty else` combines unwrapping and validation.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace this optional chain.',
            code: ['let msg: String? = "hi"', 'print(msg?.uppercased() ?? "?")'],
            options: ['hi', 'HI', '?'],
            answer: 1,
            explanation: '`msg` is `"hi"`, so `.uppercased()` runs and produces `"HI"`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Value Structs & Enums (5 nodes)
  // =========================================================================
  {
    title: 'Value Structs & Enums',
    subtitle: 'Prefer copy-on-assign structs and rich enums with associated data.',
    conceptGraphicType: 'swift_struct',
    guidebook: {
      summary:
        'Unlike languages where objects live purely on the heap, Swift centers around **value types** (`struct` and `enum`): assigning a `struct` copies it independently, eliminating shared mutable state bugs.',
      mentalModel:
        'A `struct` is like a fresh spreadsheet copy—editing your copy never alters your teammate’s sheet. A `class` is a single shared Google Doc where everyone edits the same object.',
      keyTakeaways: [
        'Use `struct` by default for models; Swift generates a clean memberwise `init(...)` automatically!',
        'Methods inside a `struct` that modify `self` must be explicitly marked `mutating func`.',
        'Swift `enum` cases can carry **associated values** (`case failed(reason: String)`), creating airtight state machines.',
        'Switching on an `enum` is checked for exhaustiveness by the compiler—add a case, and the compiler flags every unhandled `switch`.',
      ],
      keySyntax: [
        {
          title: 'Struct Value Copy & mutating Method',
          tag: 'VALUE TYPES',
          code: 'struct Counter {\n  var count = 0\n  mutating func inc() { count += 1 }\n}\nvar a = Counter(); var b = a; b.inc()',
          output: 'a.count == 0, b.count == 1',
          explanation:
            '`b = a` creates an independent value copy; `mutating` grants write permission on `var` instances.',
          notes: [
            'Calling a `mutating` method on a `let` struct is blocked cleanly at compile time.',
          ],
        },
        {
          title: 'Enums with Associated Values',
          tag: 'SUM TYPES',
          code: 'enum LoadState {\n  case idle\n  case loaded(items: Int)\n  case failed(String)\n}',
          output: 'LoadState.loaded(items: 12)',
          explanation:
            'Each case carries precisely the data valid for that state—impossible to have an error message alongside a loaded item list.',
          notes: [
            'Pattern match associated payloads via `case let .loaded(count):`.',
          ],
        },
        {
          title: 'Computed Properties on Structs',
          tag: 'PROPERTIES',
          code: 'struct Rect {\n  var w: Double, h: Double\n  var area: Double { w * h }\n}',
          output: 'Rect(w: 3, h: 4).area == 12.0',
          explanation:
            'Read-only computed properties compute derived fields on demand using concise expression syntax.',
          notes: [
            'Computed properties use `var`, never `let`, because their result recalculates.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting mutating on a Struct Method',
          buggyCode: 'struct Player { var hp = 10; func hit() { hp -= 1 } }',
          fixedCode: 'struct Player { var hp = 10; mutating func hit() { hp -= 1 } }',
          reason:
            'Value types receive `self` as immutable by default unless marked `mutating`.',
        },
        {
          title: 'Calling a mutating Method on a let Struct',
          buggyCode: 'let p = Counter(); p.inc()',
          fixedCode: 'var p = Counter(); p.inc()',
          reason:
            '`let` freezes the entire value graph of a struct.',
        },
      ],
      proTip:
        'Model UI state (`idle`, `loading`, `loaded([Item])`, `error(String)`) as one `enum` instead of 3 booleans (`isLoading`, `hasError`) so impossible state combinations cannot exist.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Structs & Value Copies',
        subtitle: 'Understand independent value semantics and mutating methods',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Independent Value Semantics',
            explanation:
              'Assigning a `struct` copies its fields into a brand new value—changing the copy never mutates the original. Methods that change fields need `mutating`.',
            code: ['struct Score {', '  var pts: Int', '  mutating func add(_ n: Int) { pts += n }', '}'],
            highlightNote: 'Structs get an automatic memberwise initializer like `Score(pts: 10)`!',
          },
          {
            type: 'token_builder',
            prompt: 'Allow `step()` to increment `count` inside a `struct`.',
            codeLines: ['struct Stepper {', '  var count = 0', '  {{0}} func step() { {{1}} += 1 }', '}'],
            expectedTokens: ['mutating', 'count'],
            distractors: ['var', 'mutable', 'self'],
            explanation: '`mutating func` marks value mutation inside a Swift struct.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `p1.x` equal after `p2` moves?',
            code: ['struct Point { var x: Int }', 'let p1 = Point(x: 5)', 'var p2 = p1', 'p2.x = 99', 'print(p1.x)'],
            options: ['99', '5', '0'],
            answer: 1,
            explanation: 'Because `Point` is a `struct`, `p2 = p1` copied the value; `p1.x` stays `5`.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the method missing the `mutating` keyword.',
            lines: [
              'struct Cart {',
              '  var total = 0',
              '  func reset() { total = 0 }',
              '}',
            ],
            bugLine: 2,
            fixed: '  mutating func reset() { total = 0 }',
            explanation: 'Struct methods assigning properties require `mutating func`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Enums & Associated Data',
        subtitle: 'Encode exact domain states and match payloads exhaustively',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Enums Carrying Payloads',
            explanation:
              'Each `enum` case can store distinct associated types and be unpacked cleanly in a `switch` statement using `case let .name(value):`.',
            code: ['enum Status { case ok, error(code: Int) }', 'let s = Status.error(code: 404)'],
            highlightNote: 'Notice dot-shorthand `.ok` when Swift already knows the `enum` type.',
          },
          {
            type: 'token_builder',
            prompt: 'Unpack `xp` from `.passed(let xp)` inside `switch`.',
            codeLines: ['enum Quiz { case pending, passed(Int) }', 'let res: Quiz = .passed(50)', 'switch res {', 'case .pending: print("Wait")', '{{0}} .passed(let {{1}}): print(xp)', '}'],
            expectedTokens: ['case', 'xp'],
            distractors: ['when', 'passed', 'let'],
            explanation: '`case .passed(let xp):` extracts the integer payload cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the switch missing a case from `enum Role`.',
            lines: [
              'enum Role { case guest, member, admin }',
              'let r = Role.guest',
              'switch r {',
              'case .guest, .member: print("Basic")',
              '}',
            ],
            bugLine: 2,
            fixed: 'case .admin: print("Root") // added before }',
            explanation: 'Exhaustive enum `switch` must cover `.admin` (or include `default:`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 3 Checkpoint',
        subtitle: 'Distinguish struct value copies from classes and computed fields',
        exercises: [
          {
            type: 'multiple_choice',
            question: 'Why does Swift prefer `struct` over `class` for most data models?',
            options: [
              'Value copies prevent unintended shared mutation',
              'Structs run on the GPU',
              'Classes cannot have methods',
              'Structs skip type checking',
            ],
            answer: 0,
            explanation: 'Value types isolate each copy so aliasing bugs cannot occur.',
          },
          {
            type: 'token_builder',
            prompt: 'Define a read-only computed property `isAdult` inside `User`.',
            codeLines: ['struct User {', '  var age: Int', '  {{0}} isAdult: Bool { {{1}} >= 18 }', '}'],
            expectedTokens: ['var', 'age'],
            distractors: ['let', 'func', 'Bool'],
            explanation: 'Computed properties always start with `var`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `c1.n` print?',
            code: ['class Box { var n = 1 }', 'let c1 = Box(); let c2 = c1', 'c2.n = 9; print(c1.n)'],
            options: ['1', '9', 'Compile error'],
            answer: 1,
            explanation: '`class` is a reference type, so `c1` and `c2` point to the same instance (`9`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Property Observers & Init',
        subtitle: 'React cleanly to didSet changes and custom initializers',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Automatic Property Observers',
            explanation:
              'Attach `didSet` to any stored `var` to react immediately after its value changes—great for clamping bounds or updating UI state.',
            code: ['struct Meter {', '  var level = 0 { didSet { print("Now \\(level)") } }', '}'],
            highlightNote: '`didSet` does not fire during initial setup inside `init`, only subsequent changes.',
          },
          {
            type: 'token_builder',
            prompt: 'Add a `didSet` hook that prints when `lives` changes.',
            codeLines: ['var lives = 3 {', '  {{0}} {', '    print("Hearts: \\({{1}})")', '  }', '}'],
            expectedTokens: ['didSet', 'lives'],
            distractors: ['onChange', 'self', 'willGet'],
            explanation: '`didSet` executes right after a new value is stored.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix calling a `mutating` method on an immutable `let` struct.',
            lines: [
              'struct Counter { var n = 0; mutating func inc() { n += 1 } }',
              'let c = Counter()',
              'c.inc()',
            ],
            bugLine: 1,
            fixed: 'var c = Counter()',
            explanation: 'Mutating methods can only be called on `var` instances.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss: State Machine',
        subtitle: 'Architect bug-free state transitions with structs & enums',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Model an authenticated session enum and switch cleanly.',
            codeLines: ['enum Auth { case out, signedIn(user: String) }', 'let st: Auth = .signedIn(user: "Yuna")', 'switch st {', 'case .out: print("Login")', 'case .signedIn(let {{0}}): print({{1}})', '}'],
            expectedTokens: ['u', 'u'],
            distractors: ['user', 'Auth', 'st'],
            explanation: 'Binding `let u` exposes the associated `String` inside the arm.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the computed property erroneously declared with `let`.',
            lines: [
              'struct Square {',
              '  var side: Int',
              '  let area: Int { side * side }',
              '}',
            ],
            bugLine: 2,
            fixed: '  var area: Int { side * side }',
            explanation: 'Computed properties must always use `var`, never `let`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this value-type swap print?',
            code: ['struct Tag { var name: String }', 'var a = Tag(name: "A")', 'var b = a; b.name = "B"', 'print("\\(a.name)\\(b.name)")'],
            options: ['AB', 'BB', 'AA'],
            answer: 0,
            explanation: '`a` keeps `"A"` while copied `b` becomes `"B"`, printing `"AB"`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Protocols & Extensions (5 nodes)
  // =========================================================================
  {
    title: 'Protocols & Extensions',
    subtitle: 'Compose behavior with protocols, extensions, generics, and closures.',
    conceptGraphicType: 'swift_proto',
    guidebook: {
      summary:
        'Swift embraces **Protocol-Oriented Programming**: define capabilities cleanly with `protocol`, share default implementations via `extension`, and abstract concisely with trailing closures and generics.',
      mentalModel:
        'Think of a `protocol` as a contract badge any `struct`, `enum`, or `class` can earn—and an `extension` lets you retroactively add helpful methods even to built-in types like `Int` or `Array`.',
      keyTakeaways: [
        'A `protocol` specifies required properties (`{ get }` or `{ get set }`) and method signatures without inheritance baggage.',
        '`extension SomeProtocol { ... }` gives every conforming type free shared methods in one place.',
        'Constrain generics cleanly with `<T: Comparable>` or opaque syntax (`some Sequence`).',
        'Trailing closure syntax lets `.map { $0 * 2 }` read smoothly without parentheses clutter.',
      ],
      keySyntax: [
        {
          title: 'Protocol & Default Extension',
          tag: 'PROTOCOLS',
          code: 'protocol Describable { var label: String { get } }\nextension Describable {\n  func printBadge() { print("[\\(label)]") }\n}',
          output: 'Any conforming struct gains `.printBadge()` automatically',
          explanation:
            'Adding `.printBadge()` on the protocol extension gives all conforming types reusable behavior.',
          notes: [
            'Built-in Swift protocols include `Equatable`, `Hashable`, `Comparable`, and `Codable`.',
          ],
        },
        {
          title: 'Generic Constraints',
          tag: 'GENERICS',
          code: 'func largest<T: Comparable>(_ a: T, _ b: T) -> T {\n  return a > b ? a : b\n}',
          output: 'largest(10, 42) == 42',
          explanation:
            'Requiring `T: Comparable` guarantees the `>` operator exists at compile time with zero runtime boxing.',
          notes: [
            'Works seamlessly for `Int`, `Double`, `String`, or your own `Comparable` types.',
          ],
        },
        {
          title: 'Trailing Closures & Shorthand $0',
          tag: 'FUNCTIONAL',
          code: 'let doubled = [1, 2, 3].map { $0 * 2 }\nlet evens = doubled.filter { $0 > 2 }',
          output: '[4, 6]',
          explanation:
            'When the final argument of a method is a closure, drop the parameter parentheses and reference the first item as `$0`.',
          notes: [
            'Use named arguments (`{ item in ... }`) for multi-line closures so intent stays obvious.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Declaring Stored Properties Inside an Extension',
          buggyCode: 'extension String { var cacheId: Int = 0 }',
          fixedCode: 'extension String { var charCount: Int { count } }',
          reason:
            'Extensions cannot add stored memory layout fields—only computed properties and methods.',
        },
        {
          title: 'Leaving Protocol Requirements Unimplemented',
          buggyCode: 'protocol Named { var name: String { get } }\nstruct Bot: Named {}',
          fixedCode: 'struct Bot: Named { let name: String }',
          reason:
            'Conforming types must implement every requirement lacking a default extension.',
        },
      ],
      proTip:
        'Add `: Codable, Equatable` to data models and Swift auto-synthesizes JSON encoding, decoding, and `==` equality with zero boilerplate!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Protocols & Conformance',
        subtitle: 'Design clean contracts and add behavior via extensions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Capabilities Over Inheritance',
            explanation:
              'Protocols describe what a type *can do* without forcing class hierarchies. Structs, enums, and classes all conform identically with `: ProtocolName`.',
            code: ['protocol Scorable {', '  var points: Int { get }', '}', 'struct Quiz: Scorable { let points: Int }'],
            highlightNote: '`{ get }` allows conformance via either `let` constants or computed `var`s.',
          },
          {
            type: 'token_builder',
            prompt: 'Extend `Int` with a computed `isEven` helper.',
            codeLines: ['{{0}} Int {', '  var isEven: Bool { self % 2 {{1}} 0 }', '}'],
            expectedTokens: ['extension', '=='],
            distractors: ['protocol', 'override', '='],
            explanation: '`extension Int` retroactively adds computed helpers cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the illegal stored property inside an extension.',
            lines: [
              'extension Double {',
              '  var label: String = "num"',
              '}',
            ],
            bugLine: 1,
            fixed: '  var label: String { "num" }',
            explanation: 'Extensions only allow computed properties, not stored defaults with `=`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which standard protocol lets Swift synthesize JSON serialization automatically?',
            options: ['Codable', 'Jsonable', 'Serializable', 'Printable'],
            answer: 0,
            explanation: '`Codable` combines `Encodable & Decodable` with compiler synthesis.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Generics & Constraints',
        subtitle: 'Write reusable type-safe functions with protocol bounds',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Type-Safe Generics',
            explanation:
              'Angle brackets `<T>` write one function for many types, while `<T: Equatable>` unlocks operators like `==` safely at compile time.',
            code: ['func same<T: Equatable>(_ a: T, _ b: T) -> Bool {', '  return a == b', '}'],
            highlightNote: 'Swift specializes generics cleanly without losing static type information.',
          },
          {
            type: 'token_builder',
            prompt: 'Constrain `T` so `a < b` compiles safely.',
            codeLines: ['func smaller<T: {{0}}>(_ a: T, _ b: T) -> T {', '  return a < b ? {{1}} : b', '}'],
            expectedTokens: ['Comparable', 'a'],
            distractors: ['Equatable', 'Any', 'b'],
            explanation: '`Comparable` guarantees `<` ordering across types.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the missing constraint preventing `==` inside `contains`.',
            lines: [
              'func sameItem<T>(_ a: T, _ b: T) -> Bool {',
              '  return a == b',
              '}',
            ],
            bugLine: 0,
            fixed: 'func sameItem<T: Equatable>(_ a: T, _ b: T) -> Bool {',
            explanation: 'Unconstrained `<T>` has no `==` operator unless constrained to `Equatable`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 4 Checkpoint',
        subtitle: 'Apply trailing closures, map, filter, and generics',
        exercises: [
          {
            type: 'predict_output',
            prompt: 'What does this Swift closure chain print?',
            code: ['let nums = [1, 2, 3, 4]', 'let res = nums.filter { $0 > 2 }.map { $0 * 10 }', 'print(res)'],
            options: ['[30, 40]', '[10, 20]', '[3, 4]'],
            answer: 0,
            explanation: '`filter` keeps `[3, 4]`, then `map` scales them to `[30, 40]`.',
          },
          {
            type: 'token_builder',
            prompt: 'Sum scores using `reduce` and `$0 + $1`.',
            codeLines: ['let total = [5, 10, 15].reduce(0) { {{0}} + {{1}} }'],
            expectedTokens: ['$0', '$1'],
            distractors: ['acc', 'val', 'it'],
            explanation: 'In two-argument closures, `$0` is the accumulator and `$1` is the element.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `$0` represent inside `.filter { $0.isEmpty }`?',
            options: [
              'The first parameter passed to the closure',
              'The array itself',
              'The index counter',
              'The return value of filter',
            ],
            answer: 0,
            explanation: '`$0` is Swift’s shorthand for the closure’s first argument.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Opaque some & Protocol Extensions',
        subtitle: 'Hide concrete return types cleanly while preserving performance',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Opaque Return Types (`some`)',
            explanation:
              'Returning `some View` or `some Collection` tells callers "one concrete conforming type is returned", keeping static compiler optimization intact (essential in SwiftUI!).',
            code: ['protocol Badge {}', 'struct ProBadge: Badge {}', 'func makeBadge() -> some Badge { ProBadge() }'],
            highlightNote: '`some Protocol` preserves identity; every `return` branch must return the same concrete type.',
          },
          {
            type: 'token_builder',
            prompt: 'Return an opaque `some Equatable` value from `makeId`.',
            codeLines: ['func makeId() -> {{0}} {{1}} {', '  return "user-1"', '}'],
            expectedTokens: ['some', 'Equatable'],
            distractors: ['any', 'Any', 'let'],
            explanation: '`some Equatable` lets callers use `==` without exposing `String`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the mixed return types breaking `some Equatable`.',
            lines: [
              'func pick(_ flag: Bool) -> some Equatable {',
              '  if flag { return "ok" }',
              '  return 42',
              '}',
            ],
            bugLine: 2,
            fixed: '  return "fallback"',
            explanation: 'An opaque `some` function must return one consistent underlying type across all branches.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss: Protocol Toolkit',
        subtitle: 'Combine extensions, closures, and constrained generics',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write a default protocol method via extension.',
            codeLines: ['protocol Greetable { var name: String { get } }', '{{0}} Greetable {', '  func hi() -> String { "Hi \\({{1}})" }', '}'],
            expectedTokens: ['extension', 'name'],
            distractors: ['protocol', 'override', 'self'],
            explanation: 'Default protocol implementations live cleanly in an `extension`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace this compactMap transformation.',
            code: ['let raw = ["10", "x", "20"]', 'let nums = raw.compactMap { Int($0) }', 'print(nums)'],
            options: ['[10, 20]', '[10, nil, 20]', '[10]'],
            answer: 0,
            explanation: '`compactMap` automatically drops `nil` conversions cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the missing conformance requirement on `User`.',
            lines: [
              'protocol IdProvider { var id: Int { get } }',
              'struct User: IdProvider {}',
            ],
            bugLine: 1,
            fixed: 'struct User: IdProvider { let id: Int }',
            explanation: 'Conforming to `IdProvider` requires implementing `id: Int`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Swift Concurrency & Actors (5 nodes)
  // =========================================================================
  {
    title: 'Swift Concurrency & Actors',
    subtitle: 'Write linear async/await code and isolate shared state with actors.',
    conceptGraphicType: 'swift_async',
    guidebook: {
      summary:
        'Modern Swift replaces nested callback pyramids with **structured concurrency**: mark suspending functions `async`, pause cleanly with `await`, run parallel work via `async let`, and guard shared state inside an `actor`.',
      mentalModel:
        'Think of `await` as pausing cleanly on a suspension point without blocking the UI thread, while an `actor` is a single-lane concierge desk—only one task enters its mutable state at a time.',
      keyTakeaways: [
        'Call `await` inside `async` functions or a `Task { ... }` block; handle errors cleanly using `try await`.',
        'Use `async let a = ...; async let b = ...` to run independent fetches concurrently instead of waiting one-by-one.',
        'Declare shared mutable state with `actor` instead of manual locks—every cross-actor access automatically enforces `await`.',
        'Ensure types crossing concurrency boundaries are value types or safely marked `Sendable`.',
      ],
      keySyntax: [
        {
          title: 'async throws & Error Handling',
          tag: 'ASYNC / AWAIT',
          code: 'func fetchUser() async throws -> String {\n  return try await loadFromAPI()\n}',
          output: 'Suspends safely until API responds or throws',
          explanation:
            '`async` comes before `throws` in the signature, while `try` comes before `await` at call sites.',
          notes: [
            'Remember the mnemonic: **AT** at declaration (`async throws`), **TA** at call site (`try await`).',
          ],
        },
        {
          title: 'Parallel Work with async let',
          tag: 'CONCURRENCY',
          code: 'async let xp = loadXP()\nasync let rank = loadRank()\nlet summary = await "\\(xp) #\\(rank)"',
          output: 'Both tasks execute simultaneously',
          explanation:
            '`async let` starts child tasks right away so total latency is `max(xp, rank)` instead of `xp + rank`.',
          notes: [
            'Both child tasks are automatically cancelled if the parent task fails or cancels.',
          ],
        },
        {
          title: 'Actor State Isolation',
          tag: 'DATA SAFETY',
          code: 'actor ScoreStore {\n  private var total = 0\n  func add(_ n: Int) { total += n }\n  func current() -> Int { total }\n}',
          output: 'await store.add(10)',
          explanation:
            'Actors serialize access to `total` automatically, eliminating data races at compile time.',
          notes: [
            'Mark UI view models with `@MainActor` so UI updates always run safely on the main thread.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Writing throws Before async in Signatures',
          buggyCode: 'func load() throws async -> Int',
          fixedCode: 'func load() async throws -> Int',
          reason:
            'Swift syntax mandates `async` before `throws` on declarations, and `try await` on calls.',
        },
        {
          title: 'Reading Actor Methods Without await',
          buggyCode: 'let val = store.current()',
          fixedCode: 'let val = await store.current()',
          reason:
            'Cross-actor calls may suspend cleanly for isolation, so Swift requires `await`.',
        },
      ],
      proTip:
        'Pair `@MainActor` on UI controllers with background `async` helpers—you get responsive 60fps scrolling and zero dispatch-queue boilerplate.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'async / await Basics',
        subtitle: 'Write clean sequential async flows without nested callbacks',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Structured Suspension Points',
            explanation:
              'Mark suspending functions with `async` before `->` (and before `throws`). Call them cleanly inside another `async` function or `Task` with `await`.',
            code: ['func loadXp() async -> Int { return 50 }', 'func run() async {', '  let xp = await loadXp()', '}'],
            highlightNote: 'Code after `await` resumes smoothly without blocking CPU threads.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete an `async throws` signature and its `try await` call.',
            codeLines: ['func sync() {{0}} throws -> Int {', '  return {{1}} await fetchRemote()', '}'],
            expectedTokens: ['async', 'try'],
            distractors: ['await', 'defer', 'catch'],
            explanation: 'Declaration puts `async throws`; call site writes `try await`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix calling an `async` helper without `await`.',
            lines: [
              'func fetch() async -> String { "OK" }',
              'func run() async {',
              '  let msg = fetch()',
              '}',
            ],
            bugLine: 2,
            fixed: '  let msg = await fetch()',
            explanation: 'Every call to an `async` function must explicitly mark suspension with `await`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which order is valid in a throwing async Swift function declaration?',
            options: [
              'async throws -> String',
              'throws async -> String',
              'await throws -> String',
              'try async -> String',
            ],
            answer: 0,
            explanation: 'Swift signatures always write `async throws`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Parallel Tasks & async let',
        subtitle: 'Run independent async operations simultaneously',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Concurrent async let Bindings',
            explanation:
              'Sequential `await a(); await b()` waits for `a` before starting `b`. Declare `async let` to launch both child tasks concurrently and `await` their results together.',
            code: ['async let profile = loadUser()', 'async let stats = loadStats()', 'let pair = await (profile, stats)'],
            highlightNote: 'Structured concurrency automatically cancels unused child tasks if an error throws.',
          },
          {
            type: 'token_builder',
            prompt: 'Start `first` and `second` concurrently and await both.',
            codeLines: ['{{0}} let first = loadA()', 'async let second = loadB()', 'let sum = {{1}} (first + second)'],
            expectedTokens: ['async', 'await'],
            distractors: ['Task', 'try', 'defer'],
            explanation: '`async let` spawns concurrent work; `await` joins both results.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing `await` when reading an `async let` result.',
            lines: [
              'async let score = loadScore()',
              'print(score)',
            ],
            bugLine: 1,
            fixed: 'print(await score)',
            explanation: 'Reading an `async let` constant still requires `await` at point of use.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 5 Checkpoint',
        subtitle: 'Verify async throws, Task, and concurrent execution',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Launch async work from synchronous UI code via `Task`.',
            codeLines: ['func onTap() {', '  {{0}} {', '    {{1}} refreshFeed()', '  }', '}'],
            expectedTokens: ['Task', 'await'],
            distractors: ['async', 'Actor', 'Thread'],
            explanation: '`Task { ... }` bridges synchronous code into an async context.',
          },
          {
            type: 'predict_output',
            prompt: 'If `loadA()` takes 1s and `loadB()` takes 1s via `async let`, how long does `await (a, b)` wait?',
            code: ['async let a = loadA() // 1s', 'async let b = loadB() // 1s', 'let res = await (a, b)'],
            options: ['~1 second', '~2 seconds', '0 seconds'],
            answer: 0,
            explanation: 'Running concurrently overlaps both waits into ~1 second total.',
          },
          {
            type: 'multiple_choice',
            question: 'Why are unstructured callbacks replaced by structured `async let` / `TaskGroup`?',
            options: [
              'Automatic cancellation and leak-free error propagation',
              'They bypass Swift type checking',
              'They only run on single-core CPUs',
              'They disable memory safety',
            ],
            answer: 0,
            explanation: 'Structured tasks tie child lifetimes safely to their parent scope.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Actors & @MainActor',
        subtitle: 'Prevent data races cleanly using actor isolation',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Compile-Time Race Isolation',
            explanation:
              'An `actor` behaves like a class except Swift guarantees only one task mutates its properties at a time. Outside callers use `await` safely without manual locks.',
            code: ['actor Wallet {', '  var gems = 50', '  func add(_ g: Int) { gems += g }', '}'],
            highlightNote: 'UI classes in iOS use `@MainActor` so screen updates always execute on the main queue.',
          },
          {
            type: 'token_builder',
            prompt: 'Safely isolate a shared counter inside an `actor` and await its call.',
            codeLines: ['{{0}} HitCounter {', '  var hits = 0', '  func bump() { hits += 1 }', '}', 'let c = HitCounter()', '{{1}} c.bump()'],
            expectedTokens: ['actor', 'await'],
            distractors: ['struct', 'sync', 'try'],
            explanation: '`actor` protects `hits`, and outside calls synchronize cleanly via `await`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing `await` when calling an actor method.',
            lines: [
              'actor Cache { var size = 0; func count() -> Int { size } }',
              'func read(_ c: Cache) async -> Int {',
              '  return c.count()',
              '}',
            ],
            bugLine: 2,
            fixed: '  return await c.count()',
            explanation: 'Accessing `c.count()` across actor isolation requires `await`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss: Zero-Race Pipeline',
        subtitle: 'Combine async throws, @MainActor, and actor state cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Pin a UI model to the main thread and handle an async load.',
            codeLines: ['{{0}}', 'class ProfileVM {', '  func load() async { _ = {{1}} fetchProfile() }', '}'],
            expectedTokens: ['@MainActor', 'await'],
            distractors: ['@Sendable', 'async', 'actor'],
            explanation: '`@MainActor` keeps UI state safely on the main thread.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the swapped `throws async` declaration order.',
            lines: [
              'func download() throws async -> Data {',
              '  return try await getData()',
              '}',
            ],
            bugLine: 0,
            fixed: 'func download() async throws -> Data {',
            explanation: '`async` always precedes `throws` in Swift declarations.',
          },
          {
            type: 'multiple_choice',
            question: 'What guarantees a type can safely cross between concurrent Tasks without data races?',
            options: ['Conforming to Sendable', 'Using var globals', 'Casting with !', 'Removing await'],
            answer: 0,
            explanation: '`Sendable` verifies thread-safe transfer across actor boundaries.',
          },
        ],
      },
    ],
  },
];
