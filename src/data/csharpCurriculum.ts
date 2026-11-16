import type { UnitSeed } from './types';

export const CSHARP_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Type Inference, Interpolation & Loops (6 nodes)
  // =========================================================================
  {
    title: 'Type Inference, Interpolation & Loops',
    subtitle: 'Declare typed C# bindings, $"" string interpolation, and foreach loops.',
    conceptGraphicType: 'cs_vars',
    guidebook: {
      summary:
        'Modern C# pairs strict **.NET compile-time static typing** with sleek developer ergonomics: infer local variables via `var`, embed expressions inside `$"{...}"` strings, write concise expression-bodied helpers `=>`, and iterate collections with `foreach`.',
      mentalModel:
        'Think of `var score = 100;` as C# saying "deduce `int` strictly at compile time"—it’s 100% statically typed just like writing `int score = 100;`, never dynamic JavaScript.',
      keyTakeaways: [
        'Use `var` when the right-hand type is obvious (`var names = new List<string>();`), and explicit types (`int`, `string`, `bool`, `double`, `decimal`) where clarity matters.',
        'Format strings cleanly with leading dollar sign `$`: `Console.WriteLine($"{user}: {xp} XP");`.',
        'Prefer **`decimal`** (`19.99m`) for currency instead of binary floating-point `double`.',
        'Short single-expression methods write cleanly with `=>`: `static int Double(int x) => x * 2;`.',
      ],
      keySyntax: [
        {
          title: 'Static Types & $"" Interpolation',
          tag: 'STRINGS',
          code: 'string lang = "C#";\nvar streak = 14;\nConsole.WriteLine($"{lang} streak: {streak + 1}");',
          output: 'C# streak: 15',
          explanation:
            '`$` enables curly-brace expressions inside strings; `var streak` infers strict `int`.',
          notes: [
            'Combine `$@""` (or `@$""`) for verbatim multi-line paths without escaping `\\`.',
          ],
        },
        {
          title: 'Expression-Bodied Methods & Loops',
          tag: 'SYNTAX',
          code: 'static int Square(int n) => n * n;\nforeach (var i in new[] { 1, 2, 3 })\n  Console.WriteLine(Square(i));',
          output: '1\n4\n9',
          explanation:
            '`=>` removes `{ return ...; }` clutter on one-line methods and properties cleanly.',
          notes: [
            'Top-level statements in modern .NET avoid verbose `Program.Main` scaffolding in single-file tools.',
          ],
        },
        {
          title: 'Constants vs Readonly Fields',
          tag: 'CONSTANTS',
          code: 'const int MaxHearts = 5;\nvar lives = MaxHearts;\nConsole.WriteLine(lives);',
          output: '5',
          explanation:
            '`const` bakes compile-time constants in cleanly, whereas `readonly` locks fields initialized in constructors.',
          notes: [
            'Modern C# 12 collection expressions write compact arrays/lists cleanly: `int[] xs = [1, 2, 3];`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting Leading $ on Interpolated Strings',
          buggyCode: 'var msg = "Hi {name}";',
          fixedCode: 'var msg = $"Hi {name}";',
          reason:
            'Without the `$` prefix before `"..."`, C# prints `{name}` literally instead of evaluating `name`.',
        },
        {
          title: 'Using var Without an Initializer',
          buggyCode: 'var score;\nscore = 50;',
          fixedCode: 'int score = 50;',
          reason:
            'The compiler must infer `var`’s static type immediately from its assignment expression.',
        },
      ],
      proTip:
        'Use raw string literals `""" ... """` in C# 11+ whenever embedding JSON or SQL so quotes never need ugly backslash escaping!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'var, Types & $ Interpolation',
        subtitle: 'Format output cleanly and respect C# static inference',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Compile-Time Static var',
            explanation:
              'In C#, `var` infers an explicit static type from the initializer (`var xp = 10;` means `int xp = 10;`). Embed values cleanly inside `$"{expr}"` interpolated strings.',
            code: ['string hero = "Theo";', 'var xp = 250;', 'Console.WriteLine($"{hero} +{xp} XP");'],
            highlightNote: 'Once inferred, `xp = "abc"` fails compilation—`var` stays strictly typed!',
          },
          {
            type: 'token_builder',
            prompt: 'Infer `lang` cleanly and print `$"{lang}: {ver}"`.',
            codeLines: ['{{0}} lang = "C#";', 'int ver = 12;', 'Console.WriteLine({{1}}"{lang}: {ver}");'],
            expectedTokens: ['var', '$'],
            distractors: ['let', 'val', '@'],
            explanation: '`var` deduces `string` while `$` enables `{...}` string interpolation.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot forgetting `$` on an interpolated C# string.',
            lines: [
              'int level = 7;',
              'Console.WriteLine("Level {level}");',
            ],
            bugLine: 1,
            fixed: 'Console.WriteLine($"Level {level}");',
            explanation: 'Prefix the string literal with `$` so `{level}` evaluates to `7`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this C# snippet output?',
            code: ['int a = 5;', 'int b = 2;', 'Console.WriteLine(a / b);'],
            options: ['2', '2.5', '3'],
            answer: 0,
            explanation: 'Dividing two `int` values performs integer division (`5 / 2 == 2`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Methods & Loops',
        subtitle: 'Write expression-bodied functions and clean foreach iteration',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Arrow Bodies & foreach',
            explanation:
              'Use `=>` for clean single-expression methods (`int Triple(int n) => n * 3;`) and `foreach (var x in items)` to walk arrays, spans, or lists without index bounds bugs.',
            code: ['static int Bonus(int xp) => xp + 10;', 'foreach (var n in new[] { 10, 20 })', '  Console.WriteLine(Bonus(n));'],
            highlightNote: 'Use `for (int i = 0; i < arr.Length; i++)` only when you specifically need index `i`.',
          },
          {
            type: 'token_builder',
            prompt: 'Loop over `tags` with `foreach` and check `.Length`.',
            codeLines: ['string[] tags = ["net", "asp"];', '{{0}} (var tag {{1}} tags)', '  Console.WriteLine(tag.Length);'],
            expectedTokens: ['foreach', 'in'],
            distractors: ['for', 'of', ':'],
            explanation: '`foreach (var item in collection)` iterates elements cleanly in C#.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix trying to declare `var` without an initializer.',
            lines: [
              'var status;',
              'status = "Ready";',
            ],
            bugLine: 0,
            fixed: 'string status = "Ready";',
            explanation: '`var` requires immediate initialization so C# knows the variable’s type.',
          },
          {
            type: 'multiple_choice',
            question: 'Which numeric type should represent monetary prices cleanly in C# without binary rounding drift?',
            options: ['decimal', 'double', 'float', 'int'],
            answer: 0,
            explanation: '`decimal` (128-bit base-10) eliminates `$0.1 + $0.2` binary float drift.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Properties & Constants',
        subtitle: 'Control read-only exposure cleanly with auto-properties',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Auto-Properties Over Public Fields',
            explanation:
              'Idiomatic C# uses PascalCase properties `{ get; set; }` or `{ get; private set; }` instead of raw mutable public fields, keeping encapsulation clean.',
            code: ['class Player {', '  public string Name { get; set; } = "Guest";', '  public int Score { get; private set; }', '}'],
            highlightNote: '`const` is implicitly static; `readonly` fields are assigned in constructors.',
          },
          {
            type: 'token_builder',
            prompt: 'Allow `Score` to be read publicly but mutated only inside the class.',
            codeLines: ['public int Score { {{0}}; {{1}} set; }'],
            expectedTokens: ['get', 'private'],
            distractors: ['read', 'readonly', 'const'],
            explanation: '`{ get; private set; }` protects writes while letting callers read `.Score`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot trying to assign a new value to a `const`.',
            lines: [
              'const int Max = 5;',
              'Max = 10;',
            ],
            bugLine: 1,
            fixed: 'int max = 10;',
            explanation: '`const` fields are compile-time constants and cannot be mutated.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 1 Checkpoint',
        subtitle: 'Check interpolation, var inference, and collection iteration',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write an expression-bodied helper returning `x * 2`.',
            codeLines: ['static int Scale(int x) {{0}} x * {{1}};'],
            expectedTokens: ['=>', '2'],
            distractors: ['->', 'return', '1'],
            explanation: 'Expression-bodied methods return directly after `=>`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `$"{2 + 3} items"` output?',
            code: ['Console.WriteLine($"{2 + 3} items");'],
            options: ['5 items', '{2 + 3} items', '2 + 3 items'],
            answer: 0,
            explanation: 'Braces inside `$""` evaluate arithmetic cleanly to `5`.',
          },
          {
            type: 'multiple_choice',
            question: 'Does using `var` turn a C# variable dynamically typed like Python?',
            options: [
              'No—C# resolves `var` statically at compile time with zero runtime penalty',
              'Yes—you can assign an int then a string into the same `var`',
              'Yes—`var` stores everything inside `object`',
              '`var` only works for strings',
            ],
            answer: 0,
            explanation: '`var` is purely compile-time type inference (`int`, `string`, etc.).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Tuples & Deconstruction',
        subtitle: 'Return multiple named values cleanly in lightweight ValueTuples',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Named ValueTuples',
            explanation:
              'C# supports named lightweight stack tuples like `(bool Ok, int Code) Check()` and deconstruction `var (ok, code) = Check();` with zero heap class allocations!',
            code: ['(int Min, int Max) Range() => (1, 10);', 'var (lo, hi) = Range();', 'Console.WriteLine($"{lo}-{hi}");'],
            highlightNote: 'C# ValueTuples are mutable value structs passed efficiently by value.',
          },
          {
            type: 'token_builder',
            prompt: 'Deconstruct a named tuple cleanly into `(name, xp)`.',
            codeLines: ['(string Name, int Xp) Load() => ("Theo", 80);', '{{0}} (name, xp) = {{1}}();'],
            expectedTokens: ['var', 'Load'],
            distractors: ['let', 'Tuple', 'out'],
            explanation: '`var (name, xp) = Load();` unpacks both tuple fields cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot forgetting parentheses around a multi-type tuple return.',
            lines: [
              'int, int Pair() => (3, 4);',
            ],
            bugLine: 0,
            fixed: '(int, int) Pair() => (3, 4);',
            explanation: 'Tuple return types must always be wrapped in parentheses `(int, int)`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss: Sharp CLI',
        subtitle: 'Combine interpolation, ValueTuples, and foreach cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Format each item cleanly with `foreach` and `$""`.',
            codeLines: ['int[] nums = [2, 4];', '{{0}} (var n in nums)', '  Console.WriteLine({{1}}"{n * 10}");'],
            expectedTokens: ['foreach', '$'],
            distractors: ['for', '@', 'in'],
            explanation: '`foreach` + `$"{n * 10}"` prints `20` then `40`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does integer division + interpolation print?',
            code: ['var x = 7;', 'Console.WriteLine($"{x / 2}.{x % 2}");'],
            options: ['3.1', '3.5', '7.2'],
            answer: 0,
            explanation: '`7 / 2 == 3` and `7 % 2 == 1`, printing `"3.1"`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix reassigning a different type to a statically inferred `var`.',
            lines: [
              'var points = 100;',
              'points = "max";',
            ],
            bugLine: 1,
            fixed: 'points = 999;',
            explanation: '`points` was strictly inferred as `int` and cannot receive a `string`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Nullable Types & Pattern Matching (5 nodes)
  // =========================================================================
  {
    title: 'Nullable Types & Pattern Matching',
    subtitle: 'Prevent NullReferenceException cleanly and match shapes via switch expressions.',
    conceptGraphicType: 'cs_pattern',
    guidebook: {
      summary:
        'C# 8+ nullable reference annotations (`string?`) pair cleanly with `?.`, `??`, `??=`, and modern **switch expressions** (`value switch { ... _ => ... }`) plus relational (`>= 90`) and property (`{ Score: > 50 }`) patterns!',
      mentalModel:
        'Modern C# pattern matching turns clunky `if/else if` type-and-null ladders into compact tabular rules where the compiler warns if any case is missing.',
      keyTakeaways: [
        'Enable `<Nullable>enable</Nullable>` so `string` warns against `null`, restricting missing states strictly to `string?`.',
        'Chain null-conditional `user?.Name`, provide fallbacks via `?? "Guest"`, or assign-if-null cleanly via `cache ??= new()`.',
        'Prefer concise **`switch` expressions** (`x switch { >= 90 => "A", _ => "B" }`) returning values directly without `break;` clutter.',
        'Check non-null cleanly using **`is not null`** (`if (user is not null)`), which cannot be fooled by overloaded `==` operators!',
      ],
      keySyntax: [
        {
          title: 'Null Operators ?., ?? and ??=',
          tag: 'NULL SAFETY',
          code: 'string? bio = null;\nint len = bio?.Length ?? 0;\nbio ??= "Default";',
          output: 'len == 0, bio == "Default"',
          explanation:
            '`bio?.Length` yields `int?` (`null`), `?? 0` unwraps to `0`, and `??=` assigns only when `bio` is `null`.',
          notes: [
            'Use `ArgumentNullException.ThrowIfNull(arg);` at public method boundaries!',
          ],
        },
        {
          title: 'Switch Expressions with Relational Patterns',
          tag: 'PATTERN MATCH',
          code: 'string Tier(int xp) => xp switch {\n  >= 500 => "Gold",\n  >= 100 => "Silver",\n  _ => "Bronze"\n};',
          output: 'Tier(250) == "Silver"',
          explanation:
            '`_` matches as the wildcard catch-all arm inside comma-separated `switch` expressions.',
          notes: [
            'Combine patterns with `and` / `or`: `>= 10 and <= 20 => "Teen"`.',
          ],
        },
        {
          title: 'Type & Property Patterns',
          tag: 'SHAPES',
          code: 'if (obj is string { Length: > 0 } s)\n  Console.WriteLine(s.ToUpper());',
          output: 'Matches non-empty strings and binds `s` safely',
          explanation:
            'Matches runtime type `string`, checks property `Length > 0`, and binds variable `s` in one expression!',
          notes: [
            '`is not null` beats `!= null` because custom `==` overrides never interfere.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting Comma Separator & Wildcard _ in Switch Expression',
          buggyCode: 'var tier = x switch { 1 => "One"; default => "Many" };',
          fixedCode: 'var tier = x switch { 1 => "One", _ => "Many" };',
          reason:
            '`switch` expressions separate arms with commas `,` and spell the catch-all `_`, not `default:`.',
        },
        {
          title: 'Calling Method on Null-Conditional Result Without ??',
          buggyCode: 'int chars = text?.Trim().Length;',
          fixedCode: 'int chars = text?.Trim().Length ?? 0;',
          reason:
            '`text?.Trim().Length` evaluates to nullable `int?`, not plain `int`.',
        },
      ],
      proTip:
        'Replace nested `switch` statements full of `break;` with comma-separated `switch` expressions—C# checks exhaustiveness at compile time and eliminates fallthrough bugs.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Null Operators ?., ?? & ??=',
        subtitle: 'Safely unwrap missing references and assign lazy defaults',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Null Coalescing Assignment ??=',
            explanation:
              'Beyond `?.` safe navigation and `??` fallback, C# includes `??=` which assigns a value ONLY if the variable is currently `null`.',
            code: ['string? tag = null;', 'int len = tag?.Length ?? 0;', 'tag ??= "csharp";'],
            highlightNote: 'Notice `tag?.ToUpper()?.Trim()` short-circuits cleanly if `tag` is `null`.',
          },
          {
            type: 'token_builder',
            prompt: 'Read `nick?.Length` safely and initialize `nick` if `null` with `??=`.',
            codeLines: ['string? nick = null;', 'int size = nick{{0}}Length ?? 0;', 'nick {{1}} "Anon";'],
            expectedTokens: ['?.', '??='],
            distractors: ['!.', '??', ':='],
            explanation: '`?.` avoids dereferencing `null`, and `??=` assigns defaults lazily.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix trying to store nullable `int?` directly into non-nullable `int`.',
            lines: [
              'string? raw = null;',
              'int len = raw?.Length;',
            ],
            bugLine: 1,
            fixed: 'int len = raw?.Length ?? 0;',
            explanation: '`raw?.Length` has type `int?`; add `?? 0` to unwrap to `int`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `??=` output when `name` is already set?',
            code: ['string? name = "Ada";', 'name ??= "Guest";', 'Console.WriteLine(name);'],
            options: ['Ada', 'Guest', 'null'],
            answer: 0,
            explanation: 'Since `name` is not `null`, `??=` leaves `"Ada"` untouched.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Switch Expressions & _',
        subtitle: 'Replace verbose switch-break blocks cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Tabular Switch Expressions',
            explanation:
              'Write `input switch { pattern => value, _ => fallback };`. Arms run top-to-bottom cleanly with relational thresholds (`< 0`, `>= 100`) and combinators (`and`, `or`).',
            code: ['string Label(int hp) => hp switch {', '  <= 0 => "KO",', '  <= 25 => "Low",', '  _ => "OK"', '};'],
            highlightNote: 'Notice each arm ends with `,` (comma) and the entire expression ends with `;` after `}`.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete a relational `switch` expression with wildcard `_`.',
            codeLines: ['string Rank(int xp) => xp {{0}} {', '  >= 100 => "Pro",', '  {{1}} => "Starter"', '};'],
            expectedTokens: ['switch', '_'],
            distractors: ['when', 'default', 'else'],
            explanation: '`switch` expressions match arms via `=>` and use `_` for fallback.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix invalid `default:` statement label inside a `switch` expression.',
            lines: [
              'string Tag(int code) => code switch {',
              '  200 => "OK",',
              '  default: "Err"',
              '};',
            ],
            bugLine: 2,
            fixed: '  _ => "Err"',
            explanation: 'Switch expressions use discard wildcard `_ =>`, not `default:`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 2 Checkpoint',
        subtitle: 'Check is not null, relational patterns, and null coalescing',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Guard cleanly using `is not null` before calling `.Trim()`.',
            codeLines: ['if (input {{0}} not {{1}})', '  Console.WriteLine(input.Trim());'],
            expectedTokens: ['is', 'null'],
            distractors: ['!=', '==', 'empty'],
            explanation: '`is not null` guarantees compiler flow analysis narrows `input` safely.',
          },
          {
            type: 'predict_output',
            prompt: 'Which switch expression arm runs for `temp = 20`?',
            code: ['var s = 20 switch { < 0 => "Ice", >= 0 and < 30 => "Mild", _ => "Hot" };', 'Console.WriteLine(s);'],
            options: ['Mild', 'Ice', 'Hot'],
            answer: 0,
            explanation: '`20` satisfies `>= 0 and < 30`, evaluating to `"Mild"`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does C# recommend `obj is not null` over `obj != null`?',
            options: [
              '`is not null` checks true null reference regardless of custom `==` overrides',
              '`!=` is removed in C# 12',
              '`is not null` casts objects into strings automatically',
              '`!=` only works on integers',
            ],
            answer: 0,
            explanation: 'Pattern matching bypasses any custom overloaded `operator !=` directly.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Property & List Patterns',
        subtitle: 'Inspect nested properties and slice arrays in one expression',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Property & List Matching',
            explanation:
              'Match properties cleanly with `{ Length: > 3 }` or even C# 11+ list patterns `[var head, ..]` to check shape and extract items simultaneously!',
            code: ['if (msg is string { Length: > 0 } text)', '  Console.WriteLine(text);', 'int first = nums is [var a, ..] ? a : 0;'],
            highlightNote: 'Property patterns automatically verify non-null before checking inner fields!',
          },
          {
            type: 'token_builder',
            prompt: 'Match a `string` whose `Length > 2` and bind it as `s`.',
            codeLines: ['if (payload {{0}} string { {{1}}: > 2 } s)', '  Console.WriteLine(s);'],
            expectedTokens: ['is', 'Length'],
            distractors: ['as', 'Count', '=='],
            explanation: 'Property patterns check `{ Length: > 2 }` and bind `s` only on match.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix forgetting commas separating arms in a tuple switch expression.',
            lines: [
              'var ok = (a, b) switch {',
              '  (true, true) => "Both";',
              '  _ => "Partial"',
              '};',
            ],
            bugLine: 1,
            fixed: '  (true, true) => "Both",',
            explanation: 'Arms in a switch expression separate with commas `,`, never semicolons `;`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss: Safe Matcher',
        subtitle: 'Combine switch expressions, property patterns, and ??= cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Guard argument `name` with `ThrowIfNull` and classify length.',
            codeLines: ['ArgumentNullException.{{0}}(name);', 'var kind = name.Length switch { <= 3 => "Short", {{1}} => "Normal" };'],
            expectedTokens: ['ThrowIfNull', '_'],
            distractors: ['Assert', 'default', 'Check'],
            explanation: '`ThrowIfNull` enforces non-null contracts cleanly while `_` handles remaining lengths.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace this list pattern match.',
            code: ['int[] arr = [10, 20, 30];', 'var res = arr is [10, .., var last] ? last : 0;', 'Console.WriteLine(res);'],
            options: ['30', '10', '0'],
            answer: 0,
            explanation: '`[10, .., var last]` verifies prefix `10` and binds trailing `30` cleanly!',
          },
          {
            type: 'find_bug',
            prompt: 'Fix a non-exhaustive switch expression missing its catch-all arm.',
            lines: [
              'string Sign(int n) => n switch {',
              '  > 0 => "+",',
              '  < 0 => "-"',
              '};',
            ],
            bugLine: 2,
            fixed: '  _ => "0"',
            explanation: '`n == 0` isn’t covered without adding `0 => "0"` or `_ => "0"`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Records, Classes & Immutability (5 nodes)
  // =========================================================================
  {
    title: 'Records, Classes & Immutability',
    subtitle: 'Model immutable value-equal data cleanly with record types and with-expressions.',
    conceptGraphicType: 'cs_record',
    guidebook: {
      summary:
        'Modern C# gives data models first-class treatment via **`record`** (`record Hero(string Name, int Xp)`): one line generates value-based `==` equality, clean `ToString()`, deconstruction, and non-destructive **`with`** cloning!',
      mentalModel:
        'Two plain `class` objects with identical fields test `false` for `==` (comparing memory pointers). Two `record` instances compare `true` by **value**—and `hero with { Xp = 99 }` clones cleanly without mutating the original!',
      keyTakeaways: [
        'Positional records (`public record User(string Name, int Xp);`) emit init-only immutable properties automatically.',
        'Clone and modify records non-destructively using **`with` expressions**: `var next = user with { Xp = user.Xp + 10 };`.',
        'Use **`init`** setters (`public string Tag { get; init; }`) and **`required`** modifier on classes/records so fields cannot be forgotten or mutated after construction.',
        'Declare **`record struct`** for ultra-fast stack value semantics with value equality cleanly built in.',
      ],
      keySyntax: [
        {
          title: 'Positional record & Non-Destructive with',
          tag: 'RECORDS',
          code: 'public record Score(string User, int Pts);\nvar s1 = new Score("Theo", 50);\nvar s2 = s1 with { Pts = 80 };',
          output: 's1.Pts == 50, s2.Pts == 80',
          explanation:
            '`s1` remains unchanged while `s2` copies every other property (`User = "Theo"`) automatically.',
          notes: [
            '`new Score("A", 1) == new Score("A", 1)` evaluates `true` cleanly for records!',
          ],
        },
        {
          title: 'init-Only & required Object Initializers',
          tag: 'IMMUTABLE INIT',
          code: 'class Config {\n  public required string Host { get; init; }\n  public int Port { get; init; } = 8080;\n}',
          output: 'Compiler forbids omitting Host or mutating after `{ Host = "..." }`',
          explanation:
            '`init` allows setting during `new Config { ... }` initialization, then freezes the property afterward.',
          notes: [
            '`required` prevents uninitialized `null` gaps at compile time.',
          ],
        },
        {
          title: 'C# 12 Primary Constructors on Classes',
          tag: 'CONCISE CLASSES',
          code: 'class Wallet(int gems) {\n  public int Balance => gems;\n}',
          output: 'Clean constructor parameter captured directly in class body',
          explanation:
            'Primary constructors eliminate repetitive private backing-field assignment boilerplate.',
          notes: [
            'Notice `record` positional parameters automatically expose public `init` properties, whereas `class(int a)` parameters stay private unless exposed.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Expecting == to Compare Fields on a Plain class',
          buggyCode: 'class Box(int n); // new Box(5) == new Box(5) is FALSE!',
          fixedCode: 'record Box(int N); // new Box(5) == new Box(5) is TRUE!',
          reason:
            'Reference `class` `==` defaults to pointer identity unless overridden; `record` generates value equality automatically.',
        },
        {
          title: 'Mutating an init-Only Property Later',
          buggyCode: 'var u = new User("Kai", 10); u.Xp = 20;',
          fixedCode: 'var u2 = u with { Xp = 20 };',
          reason:
            'Positional `record` properties have `{ get; init; }` accessors and cannot be assigned after initialization.',
        },
      ],
      proTip:
        'Default DTOs, events, and domain snapshots to `public sealed record`—value equality makes unit assertions (`Assert.Equal(expected, actual)`) work with zero custom `Equals` code!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Positional Records & with',
        subtitle: 'Replace verbose immutable DTO classes cleanly in one line',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Immutable Data Snapshots',
            explanation:
              'A C# `record` automatically gives value-based `==` equality, readable formatting (`Score { User = Ada, Pts = 10 }`), deconstruction, and non-destructive `with` cloning.',
            code: ['record Card(string Title, int Xp);', 'var a = new Card("LINQ", 25);', 'var b = a with { Xp = 50 };'],
            highlightNote: '`a == b` compares `false` because `Xp` differs (`25` vs `50`), while `a.Xp` stays `25`.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare a `record` `Unit` and produce a cloned `v2` changing only `Nodes`.',
            codeLines: ['{{0}} Unit(string Name, int Nodes);', 'var v1 = new Unit("Core", 5);', 'var v2 = v1 {{1}} { Nodes = 6 };'],
            expectedTokens: ['record', 'with'],
            distractors: ['struct', 'copy', 'clone'],
            explanation: '`record` creates immutable properties and `with` clones selectively.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `==` evaluate for two matching records?',
            code: ['record Tag(string Name);', 'Console.WriteLine(new Tag("c#") == new Tag("c#"));'],
            options: ['True', 'False', 'Compile error'],
            answer: 0,
            explanation: 'Records implement value-based equality on all properties automatically.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot trying to mutate an init-only positional record property.',
            lines: [
              'record Hero(string Name, int Hp);',
              'var h = new Hero("Ada", 100);',
              'h.Hp = 80;',
            ],
            bugLine: 2,
            fixed: 'h = h with { Hp = 80 };',
            explanation: 'Positional record properties are `init`-only; evolve them via `with`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'init Setters & required',
        subtitle: 'Guarantee complete object initialization without later mutation',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Compile-Time Object Initialization Contracts',
            explanation:
              'Replacing `{ get; set; }` with `{ get; init; }` locks a property right after `new Foo { ... }` finishes. Adding `required` forces callers to supply it at construction!',
            code: ['class ApiClient {', '  public required string Key { get; init; }', '}'],
            highlightNote: 'Great when classes have many optional fields plus a few mandatory ones.',
          },
          {
            type: 'token_builder',
            prompt: 'Make `Url` mandatory at initialization and read-only afterward.',
            codeLines: ['class Endpoint {', '  public {{0}} string Url { get; {{1}}; }', '}'],
            expectedTokens: ['required', 'init'],
            distractors: ['const', 'set', 'private'],
            explanation: '`required` + `init` forces initialization once at creation time.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix instantiating a class while omitting a `required` property.',
            lines: [
              'class User { public required string Email { get; init; } }',
              'var u = new User();',
            ],
            bugLine: 1,
            fixed: 'var u = new User { Email = "a@b.com" };',
            explanation: 'Every `required` property must be assigned inside the object initializer `{ ... }`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 3 Checkpoint',
        subtitle: 'Compare class vs record vs record struct cleanly',
        exercises: [
          {
            type: 'multiple_choice',
            question: 'How does `record struct` differ from plain `record` (which is a `record class`)?',
            options: [
              '`record struct` is a stack-friendly value type without heap allocation',
              '`record struct` has reference pointer equality',
              '`record struct` cannot use `with` expressions',
              '`record struct` disables constructors',
            ],
            answer: 0,
            explanation: '`record struct` combines value-type zero-allocation layout with synthesized `Equals`/`with`.',
          },
          {
            type: 'token_builder',
            prompt: 'Deconstruct a positional `record` `Point(int X, int Y)` cleanly.',
            codeLines: ['record Point(int X, int Y);', 'var (x, {{0}}) = {{1}} Point(3, 4);'],
            expectedTokens: ['y', 'new'],
            distractors: ['Y', 'var', 'with'],
            explanation: 'Every positional record generates a matching `Deconstruct` method cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'Does `with` mutate the original record?',
            code: ['record Level(int N);', 'var a = new Level(1);', 'var b = a with { N = 2 };', 'Console.WriteLine($"{a.N}-{b.N}");'],
            options: ['1-2', '2-2', '1-1'],
            answer: 0,
            explanation: '`with` creates a fresh copy `b` (`2`) while `a` stays safely `1`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Primary Constructors & sealed',
        subtitle: 'Keep class hierarchies concise and prevent unintended subclassing',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Concise Constructors & Sealed Defaults',
            explanation:
              'C# 12 lets plain classes declare parameters directly in the header (`class Repo(string db)`), while marking leaf classes `sealed` unlocks JIT devirtualization speedups.',
            code: ['sealed class Logger(string tag) {', '  public void Log(string msg) => Console.WriteLine($"[{tag}] {msg}");', '}'],
            highlightNote: 'Notice primary parameters on `class` stay accessible directly across methods without declaring private fields.',
          },
          {
            type: 'token_builder',
            prompt: 'Define a `sealed` class with a primary constructor parameter `rate`.',
            codeLines: ['{{0}} class Taxer(double {{1}}) {', '  public double Apply(double v) => v * rate;', '}'],
            expectedTokens: ['sealed', 'rate'],
            distractors: ['final', 'const', 'val'],
            explanation: '`sealed` blocks inheritance and primary parameter `rate` stays directly usable in `Apply`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot trying to inherit from a `sealed` record/class.',
            lines: [
              'sealed record BaseEvent(int Id);',
              'record ClickEvent(int Id) : BaseEvent(Id);',
            ],
            bugLine: 1,
            fixed: 'abstract record BaseEvent(int Id);',
            explanation: 'To allow derived records, mark the base `abstract record` (or omit `sealed`).',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss: Immutable State Tree',
        subtitle: 'Architect value-equal models with records, init, and with',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Add a helper method returning an updated copy of a record cleanly.',
            codeLines: ['record Account(string User, int Gems) {', '  public Account Reward(int n) => this {{0}} { {{1}} = Gems + n };', '}'],
            expectedTokens: ['with', 'Gems'],
            distractors: ['copy', 'set', 'User'],
            explanation: '`this with { Gems = Gems + n }` produces clean pure functional state transitions.',
          },
          {
            type: 'predict_output',
            prompt: 'Compare class reference equality vs record value equality.',
            code: ['class C(int x) { public int X => x; }', 'record R(int X);', 'Console.WriteLine($"{new C(1) == new C(1)}-{new R(1) == new R(1)}");'],
            options: ['False-True', 'True-True', 'False-False'],
            answer: 0,
            explanation: 'Classes compare references (`False`) whereas records compare values (`True`).',
          },
          {
            type: 'find_bug',
            prompt: 'Fix accidental use of Java `final` keyword instead of C# `sealed`.',
            lines: [
              'final class Metrics { public int Count { get; init; } }',
            ],
            bugLine: 0,
            fixed: 'sealed class Metrics { public int Count { get; init; } }',
            explanation: 'C# prevents inheritance with `sealed`, not `final`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: LINQ Queries & Collections (5 nodes)
  // =========================================================================
  {
    title: 'LINQ Queries & Collections',
    subtitle: 'Query lists, dictionaries, and arrays declaratively with deferred LINQ.',
    conceptGraphicType: 'cs_linq',
    guidebook: {
      summary:
        '**LINQ (Language Integrated Query)** turns C# collections (`List<T>`, arrays, `Dictionary<K,V>`) into crisp lazy pipelines (`Where`, `Select`, `OrderBy`, `GroupBy`, `Any`, `FirstOrDefault`) using strongly typed lambdas.',
      mentalModel:
        'LINQ pipelines don’t copy the entire array on every chained step! **`Where` and `Select` execute lazily ("deferred execution")**—items stream one-by-one only when you iterate (`foreach`) or call a terminal method (`.ToList()`, `.Count()`, `.Sum()`).',
      keyTakeaways: [
        'Use **`Where(...)`** to filter, **`Select(...)`** to transform (like JS `.map`), and **`OrderByDescending(...)`** to sort.',
        'Prefer **`Any()`** over `Count() > 0` for existence checks—`Any()` stops immediately on the very first match!',
        'Watch out for **deferred execution**: if you modify the underlying `List` before iterating a LINQ query variable, the query sees the later state unless materialized with `.ToList()`.',
        'Lookup dictionaries safely with **`TryGetValue(key, out var val)`** instead of crashing via `dict[missingKey]`.',
      ],
      keySyntax: [
        {
          title: 'Method-Chain LINQ Pipeline',
          tag: 'LINQ',
          code: 'var nums = new[] { 3, 8, 2, 10 };\nvar top = nums.Where(n => n > 4).Select(n => n * 2).ToList();',
          output: '[16, 20]',
          explanation:
            '`Where` keeps `[8, 10]`, `Select` doubles them to `[16, 20]`, and `.ToList()` materializes one final list.',
          notes: [
            'Keep `using System.Linq;` (imported implicitly in modern .NET projects).',
          ],
        },
        {
          title: 'Safe Single-Item & Short-Circuit Queries',
          tag: 'OPERATORS',
          code: 'bool hasPro = scores.Any(s => s >= 90);\nvar top = scores.OrderByDescending(s => s).FirstOrDefault();',
          output: 'True if any >= 90; FirstOrDefault returns 0 safely if empty',
          explanation:
            '`FirstOrDefault()` avoids `InvalidOperationException` when sequences are empty (unlike `First()`).',
          notes: [
            'Even faster: `scores.Max()` throws on empty, while `scores.DefaultIfEmpty(0).Max()` stays crash-proof.',
          ],
        },
        {
          title: 'Safe Dictionary Lookups',
          tag: 'COLLECTIONS',
          code: 'var ranks = new Dictionary<string, int> { ["Ada"] = 1 };\nif (ranks.TryGetValue("Ada", out var r)) Console.WriteLine(r);',
          output: '1 (single hash lookup!)',
          explanation:
            '`TryGetValue` avoids doing two hash lookups (`ContainsKey` + `dict[key]`) cleanly.',
          notes: [
            'Or call `ranks.GetValueOrDefault("Bob", 999)` directly!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using First() on Possibly Empty Query Results',
          buggyCode: 'var user = users.Where(u => u.IsAdmin).First();',
          fixedCode: 'var user = users.FirstOrDefault(u => u.IsAdmin);',
          reason:
            '`First()` throws `InvalidOperationException` on zero matches—`FirstOrDefault(predicate)` checks cleanly in one call.',
        },
        {
          title: 'Multiple Enumeration of Deferred LINQ Queries',
          buggyCode: 'var q = items.Where(ExpensiveCheck);\nvar n = q.Count(); var list = q.ToList();',
          fixedCode: 'var list = items.Where(ExpensiveCheck).ToList();\nvar n = list.Count;',
          reason:
            'Iterating `q` twice re-runs `ExpensiveCheck` on every item from scratch; materialize once with `.ToList()`.',
        },
      ],
      proTip:
        'Use `items.MaxBy(x => x.Xp)` in modern .NET 6+ instead of `OrderByDescending(x => x.Xp).FirstOrDefault()`—it finds the top item in O(n) single pass instead of sorting O(n log n)!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Where, Select & Lambdas',
        subtitle: 'Filter and project data cleanly using strongly typed lambdas',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Composable LINQ Steps',
            explanation:
              'LINQ maps SQL-like verbs cleanly onto C#: `.Where(x => ...)` filters items, `.Select(x => ...)` transforms each item, and `.OrderBy(x => ...)` sorts without mutating the source list.',
            code: ['var scores = new[] { 10, 40, 25 };', 'var labels = scores.Where(s => s >= 20).Select(s => $"{s}xp");'],
            highlightNote: 'Notice C# lambdas use fat arrow `=>` (`x => x * 2`).',
          },
          {
            type: 'token_builder',
            prompt: 'Filter odd numbers (`% 2 == 1`) and triple each with `Select`.',
            codeLines: ['var res = new[] { 1, 2, 3 }', '  .{{0}}(n => n % 2 == 1)', '  .{{1}}(n => n * 3);'],
            expectedTokens: ['Where', 'Select'],
            distractors: ['Filter', 'Map', 'Take'],
            explanation: 'LINQ spells filter as `Where` and projection/map as `Select`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot mutating vs crash-prone `.First()` on an empty match.',
            lines: [
              'var nums = new[] { 2, 4, 6 };',
              'var odd = nums.First(n => n % 2 == 1);',
            ],
            bugLine: 1,
            fixed: 'var odd = nums.FirstOrDefault(n => n % 2 == 1);',
            explanation: '`First(...)` throws when no element matches; `FirstOrDefault(...)` returns `0` cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `Sum()` output after `Where`?',
            code: ['var xs = new[] { 5, 10, 15 };', 'Console.WriteLine(xs.Where(x => x >= 10).Sum());'],
            options: ['25', '30', '2'],
            answer: 0,
            explanation: '`Where` keeps `10` and `15`, whose sum is `25`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Deferred Execution & Any()',
        subtitle: 'Understand lazy LINQ evaluation and fast existence checks',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Queries Evaluate Lazily Until Consumed',
            explanation:
              'Writing `var q = list.Where(x => x > 5);` builds a lazy query plan without copying elements yet. It executes only when iterated or snapped via `.ToList()` / `.Count()`.',
            code: ['var list = new List<int> { 1, 10 };', 'var q = list.Where(x => x > 5);', 'list.Add(20);', 'Console.WriteLine(q.Count());'],
            highlightNote: '`q.Count()` prints `2` because `20` was added before `q` executed!',
          },
          {
            type: 'token_builder',
            prompt: 'Check efficiently if any element exceeds `50` and materialize filtered results.',
            codeLines: ['bool hasHigh = scores.{{0}}(s => s > 50);', 'var snapshot = scores.Where(s => s > 50).{{1}}();'],
            expectedTokens: ['Any', 'ToList'],
            distractors: ['Exists', 'Count', 'Collect'],
            explanation: '`Any` short-circuits on the first match; `ToList()` caches a concrete copy.',
          },
          {
            type: 'find_bug',
            prompt: 'Optimize the wasteful full scan checking for at least one admin.',
            lines: [
              'bool anyAdmin = users.Where(u => u.IsAdmin).Count() > 0;',
            ],
            bugLine: 0,
            fixed: 'bool anyAdmin = users.Any(u => u.IsAdmin);',
            explanation: 'Calling `.Count() > 0` walks every element; `.Any(...)` stops at the first admin!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 4 Checkpoint',
        subtitle: 'Verify TryGetValue, GroupBy, and O(n) MaxBy helpers',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Look up `"cs"` safely in one hash probe with `TryGetValue`.',
            codeLines: ['var units = new Dictionary<string, int> { ["cs"] = 5 };', 'if (units.{{0}}("cs", {{1}} var count))', '  Console.WriteLine(count);'],
            expectedTokens: ['TryGetValue', 'out'],
            distractors: ['Get', 'ref', 'contains'],
            explanation: '`TryGetValue` writes the matched entry into `out var count` safely.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `Take` + `Skip` output?',
            code: ['var xs = new[] { 10, 20, 30, 40 };', 'Console.WriteLine(xs.Skip(1).Take(2).Sum());'],
            options: ['50', '30', '70'],
            answer: 0,
            explanation: '`Skip(1)` drops `10`, `Take(2)` yields `[20, 30]`, summing to `50`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does `items.MaxBy(x => x.Xp)` beat `OrderByDescending(x => x.Xp).FirstOrDefault()`?',
            options: [
              'Finds the maximum in O(n) single pass with zero sorting overhead',
              'Mutates the array in place',
              'Ignores ties automatically',
              'Converts floats to ints',
            ],
            answer: 0,
            explanation: '`MaxBy` tracks the winning item linearly without allocating a sorted buffer.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'GroupBy & Aggregations',
        subtitle: 'Summarize collections cleanly by key without manual loops',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Declarative Grouping',
            explanation:
              '`GroupBy(item => item.Category)` returns groups keyed by `.Key`, where each group acts as an `IEnumerable<Item>` ready for `.Count()` or `.Sum()`.',
            code: ['var words = new[] { "c#", "c", "go" };', 'foreach (var g in words.GroupBy(w => w[0]))', '  Console.WriteLine($"{g.Key}:{g.Count()}");'],
            highlightNote: 'Use `.Distinct()` cleanly to deduplicate items lazily in O(n) hash order.',
          },
          {
            type: 'token_builder',
            prompt: 'Deduplicate scores and sort descending cleanly.',
            codeLines: ['var top = raw.{{0}}().{{1}}(x => x).ToList();'],
            expectedTokens: ['Distinct', 'OrderByDescending'],
            distractors: ['Unique', 'SortDesc', 'Filter'],
            explanation: '`Distinct()` removes duplicates and `OrderByDescending` sorts highest first.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot forgetting LINQ `OrderBy` returns a new ordered query instead of mutating in place.',
            lines: [
              'var items = new List<int> { 3, 1, 2 };',
              'items.OrderBy(x => x);',
              'Console.WriteLine(items[0]);',
            ],
            bugLine: 1,
            fixed: 'items = items.OrderBy(x => x).ToList();',
            explanation: '`OrderBy` does not sort `items` in place; capture the ordered result or use `items.Sort()`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss: Query Optimizer',
        subtitle: 'Combine deferred queries, TryGetValue, and MaxBy cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Check non-empty list cleanly, pick top scorer in O(n), and get fallback name.',
            codeLines: ['record Hero(string Name, int Xp);', 'var best = heroes.{{0}}(h => h.Xp);', 'var label = best?.Name {{1}} "None";'],
            expectedTokens: ['MaxBy', '??'],
            distractors: ['Max', '?:', 'First'],
            explanation: '`MaxBy` selects top scorer in one pass; `best?.Name ?? "None"` handles empty lists cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace this deferred LINQ execution.',
            code: ['var data = new List<int> { 2 };', 'var q = data.Select(x => x * 10);', 'data.Add(5);', 'Console.WriteLine(q.Sum());'],
            options: ['70', '20', '7'],
            answer: 0,
            explanation: '`q` runs only at `.Sum()`, processing both `2` and `5` -> `20 + 50 = 70`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix unsafe indexer throwing `KeyNotFoundException` on missing map key.',
            lines: [
              'var map = new Dictionary<string, int>();',
              'int xp = map["missing"];',
            ],
            bugLine: 1,
            fixed: 'int xp = map.GetValueOrDefault("missing", 0);',
            explanation: 'Direct `map[key]` throws on missing keys; prefer `GetValueOrDefault` or `TryGetValue`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: async/await Tasks & Cancellation (5 nodes)
  // =========================================================================
  {
    title: 'async/await Tasks & Cancellation',
    subtitle: 'Write non-blocking async Tasks, run Task.WhenAll, and propagate CancellationToken.',
    conceptGraphicType: 'cs_async',
    guidebook: {
      summary:
        'C# pioneered modern **`async` / `await`**. Returning **`Task`** or **`Task<T>`** yields thread-pool control cleanly during I/O waits, while **`Task.WhenAll`** runs concurrent work together and **`CancellationToken`** stops stale requests gracefully.',
      mentalModel:
        'When code hits `await`, the thread is immediately handed back to serve other web requests or UI frames—the state machine resumes seamlessly once the awaited I/O `Task` completes.',
      keyTakeaways: [
        'Always return **`Task`** (not `void`!) from async methods—`async void` crashes processes with uncatchable exceptions (reserve it strictly for UI event handlers).',
        'Avoid `.Result` or `.Wait()` on unfinished tasks (`Deadlock` risk on UI/SyncContext threads!); write **`async` all the way** with `await`.',
        'Start parallel tasks concurrently and join cleanly via **`await Task.WhenAll(t1, t2)`** instead of sequential `await t1; await t2;`.',
        'Accept **`CancellationToken ct = default`** on async APIs and pass `ct` downstream so cancelled user navigation aborts work cleanly.',
      ],
      keySyntax: [
        {
          title: 'async Task<T> & Passing CancellationToken',
          tag: 'TASKS',
          code: 'async Task<string> FetchAsync(CancellationToken ct = default) {\n  await Task.Delay(50, ct);\n  return "Synced";\n}',
          output: 'Suspends cleanly and cancels instantly if ct fires',
          explanation:
            'By C# convention, async methods end in `...Async` and forward optional `CancellationToken ct`.',
          notes: [
            'Void-like async procedures return `Task`, while value-returning ones use `Task<T>`.',
          ],
        },
        {
          title: 'Parallel Execution with Task.WhenAll',
          tag: 'CONCURRENCY',
          code: 'var t1 = LoadXpAsync();\nvar t2 = LoadStreakAsync();\nawait Task.WhenAll(t1, t2);',
          output: 'Runs t1 and t2 simultaneously',
          explanation:
            'Starting both Tasks before calling `Task.WhenAll` runs them in parallel cleanly.',
          notes: [
            '`await Task.WhenAll(tasks)` returns `T[]` directly when tasks share matching return type `Task<T>`.',
          ],
        },
        {
          title: 'Zero-Overhead Hot Paths with ValueTask<T>',
          tag: 'PERF',
          code: 'ValueTask<int> GetCachedAsync(bool hit) =>\n  hit ? ValueTask.FromResult(42) : new ValueTask<int>(LoadDbAsync());',
          output: 'Zero heap allocation when result returns synchronously from cache',
          explanation:
            '`ValueTask<T>` avoids allocating a `Task<T>` object when results are usually cached synchronously.',
          notes: [
            'Unlike `Task`, never await a single `ValueTask` more than once!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Deadlocking with .Result / .Wait() Instead of await',
          buggyCode: 'var data = FetchAsync().Result; // blocks & deadlocks UI threads!',
          fixedCode: 'var data = await FetchAsync();',
          reason:
            'Blocking synchronously on `.Result` starves thread-pool/SyncContext continuations trying to resume.',
        },
        {
          title: 'Writing async void Helper Methods',
          buggyCode: 'async void SaveCloudAsync() { await UploadAsync(); }',
          fixedCode: 'async Task SaveCloudAsync() { await UploadAsync(); }',
          reason:
            'Callers cannot `await` an `async void` method and exceptions inside it escape `try/catch`.',
        },
      ],
      proTip:
        'Use **`TaskCompletionSource`** or **`CancellationTokenSource(TimeSpan.FromSeconds(5))`** to enforce clean automatic timeouts across network calls with zero callback timers.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'async Task<T> vs async void',
        subtitle: 'Return composable Tasks and await asynchronously all the way',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Composable Tasks Without .Result',
            explanation:
              'Async methods return `Task` (no return value) or `Task<T>` (returns `T`). Never block with `.Result` or write `async void` helpers—propagate `async`/`await` cleanly up the call chain!',
            code: ['async Task<int> DoubleAsync(int n) {', '  await Task.Delay(10);', '  return n * 2;', '}'],
            highlightNote: 'Notice inside `async Task<int>`, returning `int` wraps into `Task<int>` automatically!',
          },
          {
            type: 'token_builder',
            prompt: 'Fix `SaveAsync` to return an awaitable `Task` and suspend with `await`.',
            codeLines: ['async {{0}} SaveAsync() {', '  {{1}} UploadCloudAsync();', '}'],
            expectedTokens: ['Task', 'await'],
            distractors: ['void', 'Wait', 'async'],
            explanation: '`async Task` lets callers `await SaveAsync()` and catch failures safely.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the deadlock-prone synchronous `.Result` call inside async flow.',
            lines: [
              'async Task<string> LoadBannerAsync() {',
              '  var data = FetchTitleAsync().Result;',
              '  return data;',
              '}',
            ],
            bugLine: 1,
            fixed: '  var data = await FetchTitleAsync();',
            explanation: 'Use `await` instead of `.Result` so the thread isn’t blocked waiting on itself.',
          },
          {
            type: 'multiple_choice',
            question: 'Why are `async void` helper methods hazardous in C#?',
            options: [
              'Callers cannot `await` completion and thrown exceptions bypass `try/catch`',
              'They allocate 10x more memory than `Task`',
              '`await` is forbidden inside `async void`',
              'They run synchronously on a single loop',
            ],
            answer: 0,
            explanation: '`async void` detaches execution so callers lose error handling and completion tracking.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Parallel Task.WhenAll',
        subtitle: 'Launch independent Tasks together and await completion cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Concurrent Fan-Out with Task.WhenAll',
            explanation:
              'Calling `await a(); await b();` waits sequentially! Save the un-awaited `Task` handles first, then join both cleanly with `await Task.WhenAll(t1, t2)`.',
            code: ['var xpTask = GetXpAsync();', 'var rankTask = GetRankAsync();', 'await Task.WhenAll(xpTask, rankTask);'],
            highlightNote: 'After `WhenAll`, reading `xpTask.Result` (or `await xpTask`) is already completed and non-blocking!',
          },
          {
            type: 'token_builder',
            prompt: 'Run `t1` and `t2` simultaneously and join them with `Task.WhenAll`.',
            codeLines: ['var t1 = PingAsync("A");', 'var t2 = PingAsync("B");', 'string[] res = {{0}} Task.{{1}}(t1, t2);'],
            expectedTokens: ['await', 'WhenAll'],
            distractors: ['sync', 'WhenAny', 'JoinAll'],
            explanation: '`await Task.WhenAll(t1, t2)` resolves both results together into `string[]`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix awaiting tasks sequentially when parallel `Task.WhenAll` was intended.',
            lines: [
              'var a = await LoadUserAsync();',
              'var b = await LoadStatsAsync();',
            ],
            bugLine: 0,
            fixed: 'var ta = LoadUserAsync(); var tb = LoadStatsAsync(); await Task.WhenAll(ta, tb);',
            explanation: 'Starting both tasks before awaiting overlaps I/O wait time concurrently.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 5 Checkpoint',
        subtitle: 'Check Task.Delay, WhenAny, and cancellation propagation',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Suspend non-blockingly for `200ms` instead of `Thread.Sleep(200)`.',
            codeLines: ['await {{0}}.{{1}}(200, ct);'],
            expectedTokens: ['Task', 'Delay'],
            distractors: ['Thread', 'Sleep', 'Wait'],
            explanation: '`await Task.Delay(200, ct)` yields the thread cleanly and honors cancellation.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `await Task.WhenAny(tFast, tSlow)` return?',
            code: ['var tFast = Task.FromResult(1);', 'var winner = await Task.WhenAny(tFast, Task.Delay(5000));', 'Console.WriteLine(winner == tFast);'],
            options: ['True', 'False', '1'],
            answer: 0,
            explanation: '`Task.WhenAny` resolves immediately with whichever Task completed first (`tFast`).',
          },
          {
            type: 'multiple_choice',
            question: 'What is the idiomatic default parameter added to cancellable C# async methods?',
            options: [
              'CancellationToken ct = default',
              'bool cancel = false',
              'Task stopper = null',
              'Action onAbort',
            ],
            answer: 0,
            explanation: '`CancellationToken ct = default` lets callers opt in cleanly without forcing boilerplate.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'CancellationToken & Timeouts',
        subtitle: 'Abort stale async work cooperatively cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Cooperative Cancellation Propagation',
            explanation:
              'Pass `CancellationToken ct` down into HTTP, DB, and `Task.Delay` calls—or call `ct.ThrowIfCancellationRequested()` inside loops—so timed-out jobs stop cleanly without wasting server resources.',
            code: ['using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));', 'await SyncAsync(cts.Token);'],
            highlightNote: 'Cancelled tasks cleanly throw `OperationCanceledException` when observed with `await`.',
          },
          {
            type: 'token_builder',
            prompt: 'Create a token source that auto-cancels after 1 second and pass `.Token`.',
            codeLines: ['using var cts = new {{0}}(TimeSpan.FromSeconds(1));', 'await WorkAsync(cts.{{1}});'],
            expectedTokens: ['CancellationTokenSource', 'Token'],
            distractors: ['CancellationToken', 'Cancel', 'Default'],
            explanation: '`CancellationTokenSource` issues the `.Token` passed into async APIs.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot silently dropping the caller’s `ct` instead of forwarding it to `Delay`.',
            lines: [
              'async Task PollAsync(CancellationToken ct) {',
              '  await Task.Delay(1000);',
              '}',
            ],
            bugLine: 1,
            fixed: '  await Task.Delay(1000, ct);',
            explanation: 'Always forward `ct` into downstream calls like `Task.Delay(1000, ct)` so cancellation triggers immediately.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss: Resilient Cloud Sync',
        subtitle: 'Combine WhenAll, Task<T>, CancellationToken, and async safety',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write a resilient `async Task<int>` helper forwarding `ct` and returning sum.',
            codeLines: ['async {{0}}<int> TotalAsync(CancellationToken ct = default) {', '  var a = GetAAsync(ct); var b = GetBAsync(ct);', '  int[] vals = await Task.{{1}}(a, b);', '  return vals.Sum();', '}'],
            expectedTokens: ['Task', 'WhenAll'],
            distractors: ['ValueTask', 'WhenAny', 'void'],
            explanation: '`async Task<int>` + `Task.WhenAll` runs both cancellable tasks concurrently cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix catching errors around a detached `async void` procedure.',
            lines: [
              'async void SyncNow() => await PushAsync();',
            ],
            bugLine: 0,
            fixed: 'async Task SyncNowAsync() => await PushAsync();',
            explanation: 'Returning `Task` lets callers `await` completion and handle exceptions cleanly.',
          },
          {
            type: 'multiple_choice',
            question: 'When should `ValueTask<T>` be preferred over `Task<T>`?',
            options: [
              'In hot paths where results frequently complete synchronously from a cache',
              'Whenever launching parallel `Task.WhenAll` fan-outs',
              'When awaiting the same task variable three times',
              'Only inside `Main()` entrypoints',
            ],
            answer: 0,
            explanation: '`ValueTask<T>` eliminates heap `Task` allocations on synchronous cache hits.',
          },
        ],
      },
    ],
  },
];
