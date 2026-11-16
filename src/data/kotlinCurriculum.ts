import type { UnitSeed } from './types';

export const KOTLIN_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: val, var & Expressions (6 nodes)
  // =========================================================================
  {
    title: 'val, var & Expressions',
    subtitle: 'Declare read-only bindings, expression bodies, and clean when branches.',
    conceptGraphicType: 'kt_vars',
    guidebook: {
      summary:
        'Kotlin blends pragmatic JVM power with expressive syntax: prefer read-only `val` references over `var`, embed values cleanly with `$name` templates, and return directly from `if` and `when` expressions.',
      mentalModel:
        'Think of Kotlin as "expressions everywhere": `if (...) a else b`, `when (x) { ... }`, and `fun add(a: Int, b: Int) = a + b` all evaluate cleanly to values instead of forcing temporary mutable variables.',
      keyTakeaways: [
        'Use `val` for read-only references (like Java `final`) and `var` only when reassignment is necessary.',
        'Insert variables into strings with `$x` and arbitrary expressions with `${x + 1}`.',
        'Single-expression functions collapse `return` braces cleanly: `fun double(n: Int) = n * 2`.',
        'Kotlin `when` replaces verbose `switch` blocks with zero fallthrough and direct value returns.',
      ],
      keySyntax: [
        {
          title: 'val Bindings & String Templates',
          tag: 'BASICS',
          code: 'val lang = "Kotlin"\nvar xp = 100\nxp += 25\nprintln("$lang -> ${xp} XP")',
          output: 'Kotlin -> 125 XP',
          explanation:
            '`lang` stays fixed while `xp` updates; `${xp}` wraps complex expressions cleanly inside quotes.',
          notes: [
            'Semicolons are completely optional and omitted in idiomatic Kotlin.',
          ],
        },
        {
          title: 'Expression Functions & when',
          tag: 'CONTROL FLOW',
          code: 'fun tier(xp: Int) = when {\n  xp >= 500 -> "Pro"\n  xp >= 100 -> "Rising"\n  else -> "Rookie"\n}',
          output: 'tier(240) == "Rising"',
          explanation:
            '`when` returns its matching arrow arm cleanly; no `break` keywords are needed.',
          notes: [
            'When `when` is used as a value (`val t = when (...)`), Kotlin checks all branches exhaustively including `else`.',
          ],
        },
        {
          title: 'Inclusive Ranges & step Loops',
          tag: 'LOOPS',
          code: 'for (i in 1..4) println(i)\nfor (n in 10 downTo 2 step 4) println(n)',
          output: '1 2 3 4 then 10 6 2',
          explanation:
            '`1..4` includes `4`; use `0 until n` (or `0..<n`) to exclude the upper limit.',
          notes: [
            'Named arguments like `greet(name = "Hana", xp = 50)` keep call sites crystal clear.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using ${...} Wrong vs Bare $',
          buggyCode: 'println("Next: $x + 1")',
          fixedCode: 'println("Next: ${x + 1}")',
          reason:
            'Without curly braces, `$x + 1` prints the number followed by literal `" + 1"`.',
        },
        {
          title: 'Reassigning a val Reference',
          buggyCode: 'val combo = 1; combo += 1',
          fixedCode: 'var combo = 1; combo += 1',
          reason:
            '`val` binds an immutable reference; variables that increment need `var`.',
        },
      ],
      proTip:
        'Start every variable as `val` and convert to `var` only if required—coupled with `when` expressions, most functions need zero mutable state at all.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'val, var & Templates',
        subtitle: 'Choose read-only val and interpolate values cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Immutable First with val',
            explanation:
              'Kotlin distinguishes read-only `val` from reassignable `var`, with clean type inference and `$var` / `${expr}` string templates.',
            code: ['val track = "Kotlin"', 'var streak = 4', 'streak += 1', 'println("$track: ${streak * 10} XP")'],
            highlightNote: 'Notice Kotlin does not require `new` or trailing semicolons anywhere.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare fixed `user` and mutable `hearts`, then print `${hearts - 1}`.',
            codeLines: ['{{0}} user = "Hana"', '{{1}} hearts = 5', 'println("$user has ${hearts - 1}")'],
            expectedTokens: ['val', 'var'],
            distractors: ['let', 'const', 'int'],
            explanation: '`val` stays fixed while `var` allows decrementing later.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the illegal reassignment to a read-only binding.',
            lines: [
              'val level = 1',
              'level = 2',
              'println(level)',
            ],
            bugLine: 1,
            fixed: 'var level = 1',
            explanation: 'Change `val level` to `var level` when mutation is intended.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Kotlin template print?',
            code: ['val x = 5', 'println("Score: $x + 2")'],
            options: ['Score: 7', 'Score: 5 + 2', 'Compile error'],
            answer: 1,
            explanation: 'Without `${...}`, `$x` evaluates alone and `+ 2` remains literal text.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Functions & Default Args',
        subtitle: 'Write single-expression functions and named defaults',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Concise Kotlin Functions',
            explanation:
              'Functions start with `fun`. Short bodies can drop `{ return ... }` in favor of `= expr`, and default parameter values remove overloaded boilerplate.',
            code: ['fun award(pts: Int, mult: Int = 2) = pts * mult', 'println(award(pts = 15))'],
            highlightNote: 'Return types after `: Type` can be omitted on single-expression `fun`s.',
          },
          {
            type: 'token_builder',
            prompt: 'Write a single-expression `square` helper returning `n * n`.',
            codeLines: ['{{0}} square(n: Int): Int {{1}} n * n'],
            expectedTokens: ['fun', '='],
            distractors: ['func', '->', 'return'],
            explanation: '`fun` defines the function and `=` sets its expression body.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the missing return type on a block-body function.',
            lines: [
              'fun double(x: Int) {',
              '  return x * 2',
              '}',
            ],
            bugLine: 0,
            fixed: 'fun double(x: Int): Int {',
            explanation: 'Block bodies (`{ return ... }`) returning a value must declare `: Int`.',
          },
          {
            type: 'multiple_choice',
            question: 'How do Kotlin functions mark a procedure returning no meaningful value?',
            options: [': Unit', ': void', ': Nothing', ': Empty'],
            answer: 0,
            explanation: '`Unit` (often omitted automatically) is Kotlin’s singleton empty return type.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'when Expressions & Ranges',
        subtitle: 'Replace fallthrough switches with value-returning when arms',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Smart when Branches',
            explanation:
              'Kotlin `when` replaces `switch` with `->` arrows, multi-value matches (`1, 2 ->`), range checks (`in 80..100 ->`), and direct assignment.',
            code: ['val grade = when (score) {', '  in 90..100 -> "A"', '  else -> "B"', '}'],
            highlightNote: 'Only the first matching arm executes—zero accidental fallthrough!',
          },
          {
            type: 'token_builder',
            prompt: 'Match a range `in 1..5` inside `when` and assign `label`.',
            codeLines: ['val label = {{0}} (streak) {', '  {{1}} 1..5 -> "Warmup"', '  else -> "Blaze"', '}'],
            expectedTokens: ['when', 'in'],
            distractors: ['switch', 'case', 'of'],
            explanation: '`when` matches `in 1..5` cleanly via `->`.',
          },
          {
            type: 'predict_output',
            prompt: 'What gets printed by this `downTo` loop?',
            code: ['var s = 0', 'for (i in 1..3) s += i', 'println(s)'],
            options: ['3', '6', '12'],
            answer: 1,
            explanation: '`1..3` includes `1`, `2`, and `3`, summing to `6`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the expression `when` missing its fallback branch.',
            lines: [
              'val n = 4',
              'val txt = when (n) {',
              '  1 -> "One"',
              '  2 -> "Two"',
              '}',
            ],
            bugLine: 1,
            fixed: '  else -> "Other" // required in expression when',
            explanation: 'Using `when` as an expression returning a value requires an `else` branch.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 1 Checkpoint',
        subtitle: 'Check val/var discipline, templates, and when expressions',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Loop cleanly over `listOf("a", "b")` with `${it.uppercase()}`.',
            codeLines: ['val items = listOf("a", "b")', 'for (it {{0}} items) {', '  println("{{1}}")', '}'],
            expectedTokens: ['in', '${it.uppercase()}'],
            distractors: ['of', '$it.uppercase()', '=>'],
            explanation: '`in` iterates lists; braces `${...}` evaluate method calls inside strings.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `0 until 3` yield?',
            code: ['val out = mutableListOf<Int>()', 'for (i in 0 until 3) out.add(i)', 'println(out.size)'],
            options: ['2', '3', '4'],
            answer: 1,
            explanation: '`0 until 3` visits `0, 1, 2` -> `3` elements.',
          },
          {
            type: 'multiple_choice',
            question: 'Which statement correctly picks `val` vs `var`?',
            options: [
              'Use `val` unless reassignment is actually required',
              'Use `var` everywhere for speed',
              '`val` makes nested lists deeply immutable forever',
              '`val` cannot store primitives like `Int`',
            ],
            answer: 0,
            explanation: 'Defaulting to `val` guards against unintended reference reassignment.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Immutable Collections',
        subtitle: 'Separate read-only listOf/mapOf from mutable collections',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Read-Only Views First',
            explanation:
              'Kotlin distinguishes read-only interfaces (`listOf`, `mapOf`) from writable ones (`mutableListOf`, `mutableMapOf`). Read-only `List` exposes `.size`, `.first()`, `.contains()` while hiding `.add()`.',
            code: ['val fixed = listOf(10, 20)', 'val scores = mutableMapOf("Hana" to 90)', 'scores["Leo"] = 85'],
            highlightNote: '`key to value` builds clean `Pair` entries for maps.',
          },
          {
            type: 'token_builder',
            prompt: 'Construct a read-only map linking `"kt"` to `5`.',
            codeLines: ['val units = {{0}}("kt" {{1}} 5)'],
            expectedTokens: ['mapOf', 'to'],
            distractors: ['Map', '=>', ':'],
            explanation: '`mapOf("kt" to 5)` creates a clean immutable Kotlin Map.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the invalid mutation on an immutable `listOf`.',
            lines: [
              'val tags = listOf("jvm", "android")',
              'tags.add("multiplatform")',
            ],
            bugLine: 1,
            fixed: 'val tags = mutableListOf("jvm", "android")',
            explanation: '`listOf` returns a read-only `List`; `.add()` requires `mutableListOf`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss: Idiomatic Evaluator',
        subtitle: 'Refactor verbose control flow into clean Kotlin expressions',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Collapse `badge` into an expression `fun` returning `when`.',
            codeLines: ['fun badge(xp: Int) = {{0}} {', '  xp >= 100 -> "Master"', '  {{1}} -> "Learner"', '}'],
            expectedTokens: ['when', 'else'],
            distractors: ['switch', 'default', 'if'],
            explanation: 'Expression functions pair seamlessly with `when { ... else -> ... }`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the unbraced property expression inside this template.',
            lines: [
              'val name = "kotlin"',
              'println("Len: $name.length")',
            ],
            bugLine: 1,
            fixed: 'println("Len: ${name.length}")',
            explanation: 'Calling `.length` inside a template requires `${name.length}`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace this Kotlin expression.',
            code: ['val n = 4', 'val res = if (n % 2 == 0) n * 10 else 0', 'println(res)'],
            options: ['0', '40', '4'],
            answer: 1,
            explanation: '`if` evaluates directly to an expression value (`40`).',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Null Safety & Smart Casts (5 nodes)
  // =========================================================================
  {
    title: 'Null Safety & Smart Casts',
    subtitle: 'Prevent NullPointerException with nullable types, ?., ?: and is casts.',
    conceptGraphicType: 'kt_null',
    guidebook: {
      summary:
        'Kotlin’s type system splits **non-null (`String`)** from **nullable (`String?`)** references at compile time, eliminating billion-dollar `NullPointerException` bugs via `?.`, `?:`, `?.let`, and smart type narrowing.',
      mentalModel:
        'Once you check `if (x != null)` or `if (obj is String)`, Kotlin’s compiler automatically narrows ("smart casts") `x` inside that block—no manual cast needed.',
      keyTakeaways: [
        'A plain `String` cannot store `null`; append `?` (`String?`) only when absence is valid.',
        'Chain safe calls (`user?.email?.trim()`) and supply fallbacks via the **Elvis operator** (`?: "none"`).',
        'Pair `?: return` with clean early exits, or use `value?.let { ... }` to execute code strictly when non-null.',
        'Treat `!!` (non-null assertion) as a last resort—just like uncaught exceptions, it crashes on `null`.',
      ],
      keySyntax: [
        {
          title: 'Safe Call ?. & Elvis ?: Operator',
          tag: 'NULL SAFETY',
          code: 'val raw: String? = null\nval len = raw?.length ?: 0\nprintln(len)',
          output: '0',
          explanation:
            'If `raw` is `null`, `raw?.length` short-circuits to `null`, and Elvis `?: 0` provides `0`.',
          notes: [
            'Combine with early returns: `val name = input ?: return`.',
          ],
        },
        {
          title: 'Smart Casts with != null & is',
          tag: 'NARROWING',
          code: 'fun describe(x: Any): Int {\n  if (x is String) return x.length\n  return 0\n}',
          output: 'describe("kotlin") == 6',
          explanation:
            'Checking `x is String` automatically casts `x` into `String` inside the branch so `.length` compiles directly.',
          notes: [
            'Works inside `when (x) { is Int -> x + 1 ... }` too!',
          ],
        },
        {
          title: 'Scoped ?.let Execution',
          tag: 'SCOPING',
          code: 'val token: String? = "abc"\ntoken?.let { println("Token: $it") }',
          output: 'Token: abc',
          explanation:
            '`?.let` runs its lambda only when `token` is non-null, passing the guaranteed non-null `it` safely.',
          notes: [
            'Safer than `if (varProp != null)` on shared mutable properties that another thread might null out.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Abusing !! Non-Null Assertion',
          buggyCode: 'val count = nullableList!!.size',
          fixedCode: 'val count = nullableList?.size ?: 0',
          reason:
            '`!!` throws `NullPointerException` at runtime whenever the value turns out to be `null`.',
        },
        {
          title: 'Unsafe Cast as vs Safe as?',
          buggyCode: 'val s = obj as String',
          fixedCode: 'val s = obj as? String ?: ""',
          reason:
            '`as` throws `ClassCastException` on mismatch; safe cast `as?` simply returns `null`.',
        },
      ],
      proTip:
        'When validating API payloads, chain `val id = dto.id ?: return null`—each Elvis early return acts like a clean guardrail keeping all code below 100% non-null.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Nullable Types & Elvis ?:',
        subtitle: 'Differentiate String from String? and provide defaults safely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Compile-Time Null Guards',
            explanation:
              'Kotlin forbids calling `.length` on a `String?` directly. Use safe call `?.` to forward only if non-null, and Elvis `?:` to fall back if null.',
            code: ['val handle: String? = null', 'val size = handle?.length ?: 0'],
            highlightNote: 'Look sideways at `?:`—it resembles Elvis’s pompadour hair!',
          },
          {
            type: 'token_builder',
            prompt: 'Read `bio?.trim()` safely or default to `"No bio"`.',
            codeLines: ['fun showBio(bio: String?): String {', '  return bio{{0}}trim() {{1}} "No bio"', '}'],
            expectedTokens: ['?.', '?:'],
            distractors: ['!.', '??', '||'],
            explanation: '`?.` skips `.trim()` on `null`, and `?:` returns `"No bio"`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the direct method call on a nullable String?.',
            lines: [
              'fun upper(s: String?): String {',
              '  return s.uppercase()',
              '}',
            ],
            bugLine: 1,
            fixed: '  return s?.uppercase() ?: ""',
            explanation: '`s` is `String?`, so calling `.uppercase()` requires `?.` safety.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Elvis expression evaluate to?',
            code: ['val nick: String? = "Leo"', 'println(nick?.length ?: -1)'],
            options: ['-1', '3', 'null'],
            answer: 1,
            explanation: '`nick` is `"Leo"`, whose length is `3`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Smart Casts & is Checks',
        subtitle: 'Let the compiler automatically narrow types after checks',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Boilerplate Type Narrowing',
            explanation:
              'After `if (x is String)` or `if (x != null)`, Kotlin’s compiler remembers the proof inside that branch—you can access `.length` directly without `(String) x` casts!',
            code: ['fun count(v: Any): Int {', '  if (v is String) return v.length', '  if (v is List<*>) return v.size', '  return 0', '}'],
            highlightNote: 'Safe casts use `as?` (`val str = v as? String`) and evaluate to `null` on mismatch.',
          },
          {
            type: 'token_builder',
            prompt: 'Smart-cast `item` inside `when` using `is` and return its length.',
            codeLines: ['fun measure(item: Any) = when (item) {', '  {{0}} String -> item.length', '  is {{1}} -> item', '  else -> 0', '}'],
            expectedTokens: ['is', 'Int'],
            distractors: ['as', 'typeof', 'Number'],
            explanation: '`is String` narrows `item` automatically inside that `when` branch.',
          },
          {
            type: 'find_bug',
            prompt: 'Replace the crashing unsafe `as` cast with safe `as?`.',
            lines: [
              'val raw: Any = 42',
              'val text = raw as String',
            ],
            bugLine: 1,
            fixed: 'val text = raw as? String',
            explanation: '`42 as String` crashes with `ClassCastException`; `as?` yields `null` safely.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 2 Checkpoint',
        subtitle: 'Practice ?.let, Elvis early returns, and smart casts',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Run `save(it)` only when `draft` is non-null using `?.let`.',
            codeLines: ['val draft: String? = "v1"', 'draft{{0}} { save({{1}}) }'],
            expectedTokens: ['?.let', 'it'],
            distractors: ['?.apply', 'this', '!!'],
            explanation: '`draft?.let { ... }` passes the non-null value safely as `it`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `show(null)` print?',
            code: ['fun show(x: String?) {', '  val text = x ?: return', '  println(text)', '}'],
            options: ['null', 'Nothing prints', 'Throws exception'],
            answer: 1,
            explanation: 'Elvis `?: return` exits early before `println` executes.',
          },
          {
            type: 'multiple_choice',
            question: 'Why should `!!` generally be avoided in production Kotlin?',
            options: [
              'It throws a NullPointerException if the value is unexpectedly null',
              'It slows down math expressions',
              'It converts variables into mutable `var`s',
              'It disables string templates',
            ],
            answer: 0,
            explanation: '`!!` re-introduces runtime null crashes that Kotlin was designed to prevent.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Elvis Guardrails & Chaining',
        subtitle: 'Keep business logic readable without nested null pyramids',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Early Return Guardrails',
            explanation:
              'In Kotlin, `return` and `throw` are expressions! That means `val id = user?.id ?: return` cleanly exits on `null` and leaves `id` guaranteed non-null below.',
            code: ['fun award(user: User?) {', '  val name = user?.name ?: return', '  println("GG $name")', '}'],
            highlightNote: 'Chains like `a?.b?.c ?: "default"` evaluate left-to-right cleanly.',
          },
          {
            type: 'token_builder',
            prompt: 'Unwrap `age` cleanly or exit with `-1` when missing.',
            codeLines: ['fun validate(input: String?): Int {', '  val safe = input?.trim() {{0}} return -1', '  return safe.length', '}'],
            expectedTokens: ['?:'],
            distractors: ['??', '||', '=='],
            explanation: 'Combining `?: return -1` avoids nested `if (input != null)` blocks.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the unsafe double-bang `!!` crash risk.',
            lines: [
              'fun parseLen(raw: String?): Int {',
              '  return raw!!.length',
              '}',
            ],
            bugLine: 1,
            fixed: '  return raw?.length ?: 0',
            explanation: 'Use `raw?.length ?: 0` instead of `!!` so null inputs never crash.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss: Null-Proof Guard',
        subtitle: 'Combine safe casts, ?.let, and Elvis early returns cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Safely cast `payload as? String` and unwrap or return `0`.',
            codeLines: ['fun scoreLen(payload: Any?): Int {', '  val text = payload {{0}} String {{1}} return 0', '  return text.length', '}'],
            expectedTokens: ['as?', '?:'],
            distractors: ['as', 'is', '??'],
            explanation: '`as?` avoids cast exceptions and `?: return 0` exits on failure.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed?',
            code: ['fun f(a: String?): String = a?.uppercase() ?: "NONE"', 'println(f(null) + "-" + f("ok"))'],
            options: ['NONE-OK', 'null-OK', 'NONE-ok'],
            answer: 0,
            explanation: '`f(null)` returns `"NONE"` and `f("ok")` returns `"OK"`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix calling `.first()` without handling an empty/null string cleanly.',
            lines: [
              'fun initial(name: String?): Char {',
              '  return name!!.first()',
              '}',
            ],
            bugLine: 1,
            fixed: '  return name?.firstOrNull() ?: \'_\'',
            explanation: '`firstOrNull() ?: \'_\'` protects against both `null` and empty strings.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Data Classes & Sealed Types (5 nodes)
  // =========================================================================
  {
    title: 'Data Classes & Sealed Types',
    subtitle: 'Auto-generate equals/copy with data class and model closed states via sealed.',
    conceptGraphicType: 'kt_data',
    guidebook: {
      summary:
        'Kotlin eliminates Java model boilerplate cleanly: `data class` synthesizes `equals`, `hashCode`, `toString`, `.copy()`, and destructuring, while `sealed interface` enables compiler-verified exhaustive `when` states.',
      mentalModel:
        'Think of `data class` as an immutable record snapshot with a free `.copy(xp = xp + 10)` updater, and `sealed` as a closed family of subclasses whose entire membership is known at compile time.',
      keyTakeaways: [
        '`data class User(val name: String, val xp: Int = 0)` auto-generates structural `==` equality, `toString()`, and `copy()`.',
        'Destructure `data class` properties positionally: `val (name, xp) = user`.',
        '`sealed interface` / `sealed class` restricts subclasses cleanly so `when (state)` needs **no `else`** branch.',
        'Declare singletons cleanly with `object AppConfig` and static helpers with `companion object`.',
      ],
      keySyntax: [
        {
          title: 'data class Equality & copy()',
          tag: 'MODELS',
          code: 'data class Hero(val name: String, val hp: Int)\nval h1 = Hero("Ada", 100)\nval h2 = h1.copy(hp = 80)',
          output: 'Hero(name=Ada, hp=80) without mutating h1',
          explanation:
            '`.copy(...)` clones the data class with only specific named fields updated—ideal for immutable state.',
          notes: [
            '`==` compares structural values in Kotlin, while `===` compares object reference identity.',
          ],
        },
        {
          title: 'Exhaustive sealed interface',
          tag: 'ADTs',
          code: 'sealed interface NetState {\n  data object Loading : NetState\n  data class Ready(val count: Int) : NetState\n}',
          output: 'when(s) checks Loading and Ready with zero else!',
          explanation:
            'Because no external file can subclass `NetState`, Kotlin proves at compile time that every subtype is handled.',
          notes: [
            'Adding a third subtype (`Error`) flags every incomplete `when` across the entire project.',
          ],
        },
        {
          title: 'Singleton object & Companion',
          tag: 'SINGLETONS',
          code: 'object Metrics { const val MAX_HEARTS = 5 }\nclass User {\n  companion object { fun guest() = User() }\n}',
          output: 'Metrics.MAX_HEARTS == 5',
          explanation:
            '`object` creates a thread-safe singleton lazily on first access.',
          notes: [
            'Call companion members like `User.guest()` directly on the class name.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Writing a data class with Mutable Vars Everywhere',
          buggyCode: 'data class CacheKey(var id: Int)',
          fixedCode: 'data class CacheKey(val id: Int)',
          reason:
            'Mutating a `var` field inside a `HashMap`/`HashSet` key corrupts its `hashCode` bucket lookup.',
        },
        {
          title: 'Adding Unnecessary else to Sealed when',
          buggyCode: 'when (net) { is Ready -> ... else -> ... }',
          fixedCode: 'when (net) { NetState.Loading -> ... is NetState.Ready -> ... }',
          reason:
            'Adding `else` hides new subtypes added later instead of letting the compiler warn you.',
        },
      ],
      proTip:
        'Model every UI screen state with a `sealed interface` containing `data object Loading`, `data class Content(...)`, and `data class Error(val msg: String)`—you get effortless exhaustive rendering.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'data class & copy()',
        subtitle: 'Generate value equality, toString, and immutable updates',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Boilerplate Value Models',
            explanation:
              'Prefixing a primary-constructor class with `data` automatically implements `equals` (`==`), `hashCode`, readable `toString`, destructuring (`val (a, b) = item`), and `.copy(...)`.',
            code: ['data class Card(val title: String, val xp: Int)', 'val a = Card("Loop", 20)', 'val b = a.copy(xp = 30)'],
            highlightNote: 'Keep constructor fields `val` and evolve state cleanly via `.copy(...)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare a `data class` and clone `p1` updating only `score`.',
            codeLines: ['{{0}} class Player(val id: String, val score: Int)', 'val p1 = Player("u1", 10)', 'val p2 = p1.{{1}}(score = 50)'],
            expectedTokens: ['data', 'copy'],
            distractors: ['struct', 'clone', 'val'],
            explanation: '`data class` generates `.copy(...)` automatically.',
          },
          {
            type: 'predict_output',
            prompt: 'What does Kotlin `==` compare for `data class` instances?',
            code: ['data class Point(val x: Int, val y: Int)', 'println(Point(1, 2) == Point(1, 2))'],
            options: ['true', 'false', 'Compile error'],
            answer: 0,
            explanation: '`data class` generates structural equality, so identical fields compare `true`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the `data class` missing a primary constructor parameter.',
            lines: [
              'data class Empty()',
              'val e = Empty()',
            ],
            bugLine: 0,
            fixed: 'object Empty // or data object Empty',
            explanation: 'A `data class` must have at least one `val`/`var` constructor parameter; use `data object` for parameterless tags.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Sealed Classes & Interfaces',
        subtitle: 'Encode closed state variants for compiler-checked whens',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Closed Algebraic Types',
            explanation:
              'Marking an interface/class `sealed` restricts all subclasses to the same package. `when (state)` becomes statically exhaustive without needing an `else` catch-all!',
            code: ['sealed interface Result {', '  data class Ok(val v: Int) : Result', '  data object Err : Result', '}'],
            highlightNote: 'Notice `Ok` carries state while `Err` uses a singleton `data object`.',
          },
          {
            type: 'token_builder',
            prompt: 'Lock `UiState` with `sealed` so `when` needs no `else`.',
            codeLines: ['{{0}} interface UiState', 'data object Idle : UiState', 'data class Loaded(val n: Int) : {{1}}'],
            expectedTokens: ['sealed', 'UiState'],
            distractors: ['abstract', 'enum', 'open'],
            explanation: '`sealed interface` restricts implementations to compile-time known subtypes.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing branch in an exhaustive `when` expression.',
            lines: [
              'sealed class Net { object Wait : Net(); data class Done(val ms: Int) : Net() }',
              'fun msg(s: Net) = when (s) {',
              '  is Net.Done -> "${s.ms}ms"',
              '}',
            ],
            bugLine: 1,
            fixed: '  Net.Wait -> "Loading" // must handle every sealed subtype',
            explanation: 'Because `when` is used as a return expression, `Net.Wait` must also be handled.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 3 Checkpoint',
        subtitle: 'Verify destructuring, singletons, and sealed hierarchies',
        exercises: [
          {
            type: 'predict_output',
            prompt: 'What does positional destructuring print?',
            code: ['data class Tag(val name: String, val rank: Int)', 'val (n, r) = Tag("Rust", 1)', 'println("$n#$r")'],
            options: ['Rust#1', '1#Rust', 'Tag(Rust, 1)'],
            answer: 0,
            explanation: '`(n, r)` unpacks `component1()` and `component2()` in constructor order.',
          },
          {
            type: 'token_builder',
            prompt: 'Create a singleton configuration `object`.',
            codeLines: ['{{0}} Theme {', '  const val ACCENT = "#6E56CF"', '}'],
            expectedTokens: ['object'],
            distractors: ['class', 'static', 'struct'],
            explanation: '`object Theme` declares a single shared instance directly.',
          },
          {
            type: 'multiple_choice',
            question: 'How does `==` differ from `===` in Kotlin?',
            options: [
              '`==` checks structural `.equals()`, while `===` checks reference identity',
              '`===` converts types automatically like JavaScript',
              '`==` only works on integers',
              'Both check memory pointers identically',
            ],
            answer: 0,
            explanation: '`==` calls `.equals()` safely (even with `null`); `===` compares pointers.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Enum Classes vs Sealed',
        subtitle: 'Choose between uniform enum constants and rich sealed variants',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Choosing enum vs sealed',
            explanation:
              'Use `enum class` when every constant has identical fixed shape (`NORTH`, `SOUTH`), and `sealed` when each state holds different payload types (`Ok(data)` vs `Error(code)`).',
            code: ['enum class Tier(val mult: Int) {', '  BRONZE(1), GOLD(2)', '}'],
            highlightNote: 'Kotlin `enum class` entries can cleanly own properties and helper methods too!',
          },
          {
            type: 'token_builder',
            prompt: 'Add a `companion object` factory on `Token`.',
            codeLines: ['class Token(val raw: String) {', '  {{0}} object {', '    fun empty() = {{1}}("")', '  }', '}'],
            expectedTokens: ['companion', 'Token'],
            distractors: ['static', 'singleton', 'this'],
            explanation: '`companion object` exposes static-like factories such as `Token.empty()`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix modifying a non-existent mutable property on a data class.',
            lines: [
              'data class Score(val xp: Int)',
              'val s = Score(10)',
              's.xp = 20',
            ],
            bugLine: 2,
            fixed: 'val s2 = s.copy(xp = 20)',
            explanation: '`val xp` is read-only; create updated state via `s.copy(xp = 20)`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss: Immutable Domain',
        subtitle: 'Architect clean models with data classes, sealed states, and companions',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Destructure `item` and return a copied upgrade.',
            codeLines: ['data class Item(val name: String, val lvl: Int)', 'val (n, l) = Item("Sword", 1)', 'val next = Item(n, l).{{0}}(lvl = l + {{1}})'],
            expectedTokens: ['copy', '1'],
            distractors: ['clone', 'update', '0'],
            explanation: '`.copy(lvl = l + 1)` preserves `name` while advancing level cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `enum` property lookup output?',
            code: ['enum class Mode(val sec: Int) { BLITZ(60), ZEN(0) }', 'println(Mode.BLITZ.sec)'],
            options: ['60', 'BLITZ', '0'],
            answer: 0,
            explanation: 'Each enum constant stores its constructor property cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the reference check used instead of structural equality.',
            lines: [
              'data class Key(val id: Int)',
              'val ok = Key(5) === Key(5)',
            ],
            bugLine: 1,
            fixed: 'val ok = Key(5) == Key(5)',
            explanation: 'Two distinct `Key(5)` objects differ by `===` pointer; use `==` for data equality.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Lambdas & Scope Functions (5 nodes)
  // =========================================================================
  {
    title: 'Lambdas & Scope Functions',
    subtitle: 'Chain filter/map pipelines cleanly and master let, apply, also, and run.',
    conceptGraphicType: 'kt_lambda',
    guidebook: {
      summary:
        'Kotlin makes functional data transforms effortless: trailing lambdas move outside `()`, single parameters default to `it`, and **scope functions** (`let`, `apply`, `also`, `run`, `with`) keep configuration concise.',
      mentalModel:
        'Remember the 2×2 grid for scope functions: **`let` & `also`** expose the object as `it` (great for renaming or null safety), whereas **`apply` & `run`** bind `this` directly (great for configuring objects cleanly).',
      keyTakeaways: [
        'When the last argument of a function is a lambda, place `{ ... }` right after `)`—or omit `()` altogether if it’s the only argument!',
        'Collection pipelines (`filter`, `map`, `any`, `associateBy`, `groupBy`) replace nested loops with clear verbs.',
        'Use `apply` to configure an object (`Paint().apply { strokeWidth = 2f }`), returning the configured object itself.',
        'Use `also` for side effects like logging (`result.also { log(it) }`), and `let` for mapping values (`str?.let { parse(it) }`).',
      ],
      keySyntax: [
        {
          title: 'Trailing Lambdas & Collection Verbs',
          tag: 'PIPELINES',
          code: 'val scores = listOf(40, 85, 92)\nval top = scores.filter { it >= 80 }.map { "$it%" }',
          output: '["85%", "92%"]',
          explanation:
            'Single-argument lambdas bind `it` automatically and read smoothly outside parentheses.',
          notes: [
            'Use `.asSequence()` on huge collections to stream lazily without intermediate list copies.',
          ],
        },
        {
          title: 'Object Setup with apply vs Side-Effect also',
          tag: 'SCOPE',
          code: 'val cfg = Config().apply {\n  retries = 3\n  timeoutMs = 500\n}.also { println("Ready: $it") }',
          output: 'Returns configured `cfg` cleanly',
          explanation:
            '`apply` uses `this` (implicit fields) and returns `cfg`; `also` receives `it` and also returns `cfg`.',
          notes: [
            'Choose explicit lambda parameter names (`user -> ...`) whenever scope functions nest.',
          ],
        },
        {
          title: 'Transforming via let & groupBy',
          tag: 'TRANSFORMS',
          code: 'val grouped = listOf("go", "git", "rust").groupBy { it.first() }',
          output: '{g=["go", "git"], r=["rust"]}',
          explanation:
            'Kotlin’s stdlib bundles `groupBy`, `associateWith`, `sumOf`, and `chunked` right out of the box.',
          notes: [
            'Destructure map entries cleanly in lambdas: `map.forEach { (k, v) -> ... }`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Expecting apply to Return the Last Line Value',
          buggyCode: 'val len = "kotlin".apply { length }',
          fixedCode: 'val len = "kotlin".let { it.length }',
          reason:
            '`apply` and `also` always return the receiver object itself (`"kotlin"`), not the lambda body’s last expression (`let`/`run` return the result).',
        },
        {
          title: 'Shadowing it Across Nested Scope Lambdas',
          buggyCode: 'a?.let { b?.let { use(it) } }',
          fixedCode: 'a?.let { first -> b?.let { second -> use(first, second) } }',
          reason:
            'Nesting unnamed `it` shadows the outer parameter silently and confuses readers.',
        },
      ],
      proTip:
        'Use `sumOf`, `maxByOrNull`, and `associateBy` instead of manual loops + temporary `MutableMap`s—you get shorter, safer, null-aware pipelines in one line.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Trailing Lambdas & it',
        subtitle: 'Transform collections concisely with filter, map, and count',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Trailing Closure Syntax',
            explanation:
              'In Kotlin, `list.filter({ it > 0 })` drops parentheses cleanly to `list.filter { it > 0 }`. Single-parameter lambdas refer to their input via `it`.',
            code: ['val nums = listOf(1, 2, 3, 4)', 'val sum = nums.filter { it % 2 == 0 }.sum()'],
            highlightNote: 'Use descriptive names (`n -> ...`) whenever lambdas wrap multiple lines.',
          },
          {
            type: 'token_builder',
            prompt: 'Keep positive scores and double each value with `map`.',
            codeLines: ['val res = listOf(-2, 5, 10)', '  .{{0}} { it > 0 }', '  .{{1}} { it * 2 }'],
            expectedTokens: ['filter', 'map'],
            distractors: ['select', 'transform', 'where'],
            explanation: '`filter` retains positives, then `map` multiplies each by `2`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `any` return here?',
            code: ['val tags = listOf("py", "kt", "c")', 'println(tags.any { it.length == 2 })'],
            options: ['true', 'false', '2'],
            answer: 0,
            explanation: '`any` short-circuits to `true` as soon as `"py"` satisfies `length == 2`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the accidental nested shadowed `it` parameter.',
            lines: [
              'val list = listOf(listOf(1, 2))',
              'list.forEach { it.filter { it > 1 } }',
            ],
            bugLine: 1,
            fixed: 'list.forEach { row -> row.filter { it > 1 } }',
            explanation: 'Naming the outer parameter `row ->` prevents confusing shadowed `it` bugs.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Scope: let, apply, also',
        subtitle: 'Pick the right scope function for transforming vs configuring',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Return Result vs Return Self',
            explanation:
              '`apply` (`this`) and `also` (`it`) always return the receiver object itself—ideal for builder setup or logging. `let` (`it`) and `run` (`this`) return the lambda’s computed result.',
            code: ['val arr = mutableListOf(1).apply { add(2) }', 'val size = arr.let { it.size * 10 }'],
            highlightNote: '`apply` configures `this`; `let` maps `it` into a new result.',
          },
          {
            type: 'token_builder',
            prompt: 'Configure a mutable builder with `apply` returning `cfg` itself.',
            codeLines: ['data class Req(var url: String = "", var retries: Int = 1)', 'val r = Req().{{0}} {', '  {{1}} = "https://api"', '  retries = 3', '}'],
            expectedTokens: ['apply', 'url'],
            distractors: ['let', 'it', 'map'],
            explanation: '`apply` exposes fields directly on `this` and returns the configured `Req`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the scope function that returns the receiver instead of the computed count.',
            lines: [
              'val words = listOf("kotlin", "swift")',
              'val count: Int = words.also { it.size }',
            ],
            bugLine: 1,
            fixed: 'val count: Int = words.let { it.size }',
            explanation: '`also` returns `List<String>` (`words`), not `Int`; `let` returns `it.size`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 4 Checkpoint',
        subtitle: 'Apply Kotlin stdlib collection verbs and scope rules',
        exercises: [
          {
            type: 'predict_output',
            prompt: 'What does `sumOf` print?',
            code: ['data class Task(val xp: Int)', 'val list = listOf(Task(10), Task(25))', 'println(list.sumOf { it.xp })'],
            options: ['35', '2', 'Task(35)'],
            answer: 0,
            explanation: '`sumOf { it.xp }` adds `10 + 25 = 35` cleanly.',
          },
          {
            type: 'token_builder',
            prompt: 'Log an intermediate chain value cleanly without altering the return value.',
            codeLines: ['val out = listOf(3, 1, 2)', '  .sorted()', '  .{{0}} { println("Sorted: ${{1}}") }'],
            expectedTokens: ['also', 'it'],
            distractors: ['let', 'apply', 'this'],
            explanation: '`also` runs a side effect on `it` and passes the sorted list unchanged.',
          },
          {
            type: 'multiple_choice',
            question: 'When transforming a huge list of 100,000 items with chained filter/map, how do you avoid intermediate list allocations?',
            options: ['Call `.asSequence()` before filter/map', 'Use `arrayOf()`', 'Wrap in `also`', 'Disable `val`'],
            answer: 0,
            explanation: '`Sequence` evaluates pipelines lazily item-by-item without extra list allocations.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Grouping & Map Transforms',
        subtitle: 'Index and aggregate collections in one declarative call',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Rich Collection Aggregators',
            explanation:
              'Stdlib helpers like `groupBy`, `partition`, `associateBy`, and `joinToString` turn 10 lines of imperative map initialization into 1 expressive line.',
            code: ['val csv = listOf("py", "kt", "rs").joinToString(",")', 'val (even, odd) = listOf(1, 2, 3, 4).partition { it % 2 == 0 }'],
            highlightNote: '`partition` splits a list into two lists `(matching, rest)` in one pass!',
          },
          {
            type: 'token_builder',
            prompt: 'Join formatted items with `" | "` cleanly.',
            codeLines: ['val line = listOf("Go", "Zig").{{0}}(separator = " | ") { it.{{1}}() }'],
            expectedTokens: ['joinToString', 'uppercase'],
            distractors: ['join', 'toUpper', 'concat'],
            explanation: '`joinToString` formats and joins elements in one step.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the crash risk if `maxBy` runs on an empty list.',
            lines: [
              'val scores = emptyList<Int>()',
              'val top = scores.maxOf { it }',
            ],
            bugLine: 1,
            fixed: 'val top = scores.maxOrNull() ?: 0',
            explanation: 'Non-nullable `maxOf` throws `NoSuchElementException` on empty collections; prefer `maxOrNull()`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss: Functional Pipeline',
        subtitle: 'Combine partition, associateBy, and scope transforms',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Filter non-blank tags, lowercase them, and join cleanly.',
            codeLines: ['val slug = listOf(" KT ", "", " Go ")', '  .map { it.trim().lowercase() }', '  .{{0}} { it.isNotEmpty() }', '  .{{1}}("-")'],
            expectedTokens: ['filter', 'joinToString'],
            distractors: ['map', 'join', 'apply'],
            explanation: '`filter` drops blanks and `joinToString("-")` produces `"kt-go"`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace this `partition` destructuring.',
            code: ['val (a, b) = listOf(1, 2, 3, 4).partition { it > 2 }', 'println("${a.size}-${b.size}")'],
            options: ['2-2', '3-1', '1-3'],
            answer: 0,
            explanation: '`[3, 4]` and `[1, 2]` each have size `2`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix reading the receiver instead of lambda return on `run`.',
            lines: [
              'val box = StringBuilder("Hi")',
              'val ok: String = box.apply {',
              '  append("!")',
              '  toString()',
              '}',
            ],
            bugLine: 1,
            fixed: 'val ok: String = box.run {',
            explanation: '`apply` returns `StringBuilder`; `run` returns the last expression `toString()`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Coroutines & Structured Flow (5 nodes)
  // =========================================================================
  {
    title: 'Coroutines & Structured Flow',
    subtitle: 'Suspend cleanly without blocking threads using launch, async, and Flow.',
    conceptGraphicType: 'kt_coro',
    guidebook: {
      summary:
        'Kotlin Coroutines represent lightweight suspending computations rather than heavyweight OS threads: `suspend fun` pauses without blocking, `coroutineScope` guarantees child lifetimes, and `Flow<T>` streams asynchronous sequences reactively.',
      mentalModel:
        'One JVM thread can juggle **tens of thousands** of coroutines concurrently: hitting `delay(500)` or a network `suspend fun` parks that coroutine and frees the thread to handle UI frames seamlessly.',
      keyTakeaways: [
        'Only another `suspend fun` or coroutine builder (`launch`, `async`) can invoke a `suspend` function.',
        'Use `launch { }` for fire-and-forget jobs (`Job`), and `async { } + .await()` when returning a computed `Deferred<T>` value.',
        'Switch thread pools cleanly with `withContext(Dispatchers.IO) { ... }` without nesting callbacks.',
        '`Flow<T>` produces cold async streams emitted via `emit(...)` and consumed safely with `.collect { ... }`.',
      ],
      keySyntax: [
        {
          title: 'suspend fun & withContext(Dispatchers.IO)',
          tag: 'SUSPENDING',
          code: 'suspend fun fetchJson(): String = withContext(Dispatchers.IO) {\n  readNetwork()\n}',
          output: 'Suspends caller cleanly; IO runs off the main thread',
          explanation:
            '`withContext` hops onto the IO pool for blocking calls and safely restores the caller’s dispatcher afterward.',
          notes: [
            '`Dispatchers.Main` drives UI updates; `Dispatchers.Default` handles CPU-heavy work.',
          ],
        },
        {
          title: 'Parallel async / await in coroutineScope',
          tag: 'STRUCTURED',
          code: 'suspend fun summary() = coroutineScope {\n  val a = async { loadXP() }\n  val b = async { loadStreak() }\n  a.await() + b.await()\n}',
          output: 'Runs loadXP & loadStreak concurrently',
          explanation:
            '`coroutineScope` waits for both child coroutines and automatically cancels the sibling if one throws.',
          notes: [
            'Never launch fire-and-forget work on `GlobalScope`—bind work to a structured scope.',
          ],
        },
        {
          title: 'Cold Streams with Flow<T>',
          tag: 'REACTIVE FLOW',
          code: 'fun ticks(): Flow<Int> = flow {\n  for (i in 1..3) { delay(100); emit(i) }\n}',
          output: 'Emits 1, 2, 3 cleanly to `.collect { ... }`',
          explanation:
            'A `flow { ... }` stays inert until a collector starts collecting it.',
          notes: [
            'Operators like `.map`, `.filter`, and `.debounce` compose on `Flow` just like `List`!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Calling Thread.sleep Inside a Coroutine',
          buggyCode: 'launch { Thread.sleep(1000) }',
          fixedCode: 'launch { delay(1000) }',
          reason:
            '`Thread.sleep` freezes the entire underlying thread for all coroutines; `delay` suspends cleanly without blocking.',
        },
        {
          title: 'Forgetting await() on async Deferred',
          buggyCode: 'val res = async { 42 }\nprintln(res + 1)',
          fixedCode: 'val res = async { 42 }\nprintln(res.await() + 1)',
          reason:
            '`async` returns a `Deferred<Int>` promise—call `.await()` to obtain its value.',
        },
      ],
      proTip:
        'Keep ViewModel and repository coroutines cancellation-friendly: prefer structured `coroutineScope` + `withContext(Dispatchers.IO)` so navigating away cancels orphaned requests automatically.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'suspend & Dispatchers',
        subtitle: 'Write non-blocking suspend functions and hop thread pools cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Suspend Without Blocking',
            explanation:
              'Adding `suspend` lets a function pause (at `delay(...)` or `withContext(...)`) without locking the thread. Callers look completely linear.',
            code: ['suspend fun loadRank(): Int = withContext(Dispatchers.IO) {', '  42', '}'],
            highlightNote: 'Always use `delay(ms)` inside coroutines—never blocking `Thread.sleep(ms)`!',
          },
          {
            type: 'token_builder',
            prompt: 'Move heavy JSON parsing off the main thread cleanly.',
            codeLines: ['{{0}} fun parseUser(): String = {{1}}(Dispatchers.Default) {', '  "Ada"', '}'],
            expectedTokens: ['suspend', 'withContext'],
            distractors: ['async', 'Thread', 'launch'],
            explanation: '`suspend` enables `withContext(Dispatchers.Default)` cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Replace the thread-blocking pause inside a coroutine.',
            lines: [
              'suspend fun retry() {',
              '  Thread.sleep(500)',
              '  println("Retrying")',
              '}',
            ],
            bugLine: 1,
            fixed: '  delay(500)',
            explanation: '`delay(500)` suspends cleanly while freeing the thread for other work.',
          },
          {
            type: 'multiple_choice',
            question: 'Which dispatcher is tuned specifically for blocking disk or network calls?',
            options: [
              'Dispatchers.IO',
              'Dispatchers.Main',
              'Dispatchers.Unconfined',
              'Dispatchers.UI',
            ],
            answer: 0,
            explanation: '`Dispatchers.IO` scales a shared thread pool optimized for waiting I/O.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'launch vs async & Scope',
        subtitle: 'Choose between fire-and-forget Jobs and Deferred results',
        exercises: [
          {
            type: 'theory_bite',
            title: 'launch vs async',
            explanation:
              'Inside a `CoroutineScope`, `launch` starts a side-effect job returning `Job`, while `async` computes a result returning `Deferred<T>` retrieved via `.await()`.',
            code: ['coroutineScope {', '  val a = async { 10 }', '  val b = async { 20 }', '  println(a.await() + b.await())', '}'],
            highlightNote: '`coroutineScope` won’t return until every child coroutine finishes or cancels cleanly.',
          },
          {
            type: 'token_builder',
            prompt: 'Run `fetchA` and `fetchB` in parallel inside `coroutineScope`.',
            codeLines: ['suspend fun pair() = {{0}} {', '  val d = async { fetchA() }', '  d.{{1}}()', '}'],
            expectedTokens: ['coroutineScope', 'await'],
            distractors: ['GlobalScope', 'join', 'launch'],
            explanation: '`coroutineScope` scopes child jobs safely; `.await()` extracts the `Deferred` value.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing `.await()` on a `Deferred<Int>` return value.',
            lines: [
              'suspend fun calc() = coroutineScope {',
              '  val x = async { 5 }',
              '  x * 2',
              '}',
            ],
            bugLine: 2,
            fixed: '  x.await() * 2',
            explanation: '`x` has type `Deferred<Int>`; call `x.await()` before multiplying.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 5 Checkpoint',
        subtitle: 'Review Dispatchers, structured concurrency, and non-blocking waits',
        exercises: [
          {
            type: 'predict_output',
            prompt: 'What happens if one child inside `coroutineScope` throws an exception?',
            code: ['coroutineScope {', '  launch { delay(5000); println("Done") }', '  launch { error("Fail") }', '}'],
            options: [
              'The sibling coroutine cancels cleanly and the exception propagates',
              '"Done" still prints 5 seconds later',
              'The whole process freezes indefinitely',
            ],
            answer: 0,
            explanation: 'Structured concurrency automatically cancels sibling children on failure.',
          },
          {
            type: 'token_builder',
            prompt: 'Launch background sync tied cleanly to `viewModelScope`.',
            codeLines: ['viewModelScope.{{0}} {', '  val ok = syncCloud()', '}'],
            expectedTokens: ['launch'],
            distractors: ['suspend', 'emit', 'collect'],
            explanation: '`launch` starts a coroutine attached to `viewModelScope`’s lifecycle.',
          },
          {
            type: 'multiple_choice',
            question: 'Why should `GlobalScope.launch` generally be avoided?',
            options: [
              'Unscoped coroutines leak past screen lifecycles and never auto-cancel',
              'GlobalScope runs synchronously on the main thread',
              'GlobalScope cannot invoke `suspend` functions',
              'GlobalScope disables exceptions completely',
            ],
            answer: 0,
            explanation: 'Bound scopes (`viewModelScope`, `coroutineScope`) cancel leaks automatically.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Cold Streams with Flow<T>',
        subtitle: 'Emit asynchronous sequences cleanly with flow, emit, and collect',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Reactive Streams Made Simple',
            explanation:
              'A `Flow<T>` emits values sequentially using `emit(value)` inside a `flow { ... }` builder and only starts executing once a consumer invokes `.collect { ... }`.',
            code: ['val stream = flow { emit(1); emit(2) }', 'stream.map { it * 10 }.collect { println(it) }'],
            highlightNote: '`flowOn(Dispatchers.IO)` switches upstream execution dispatcher without blocking collectors.',
          },
          {
            type: 'token_builder',
            prompt: 'Emit numbers inside a `flow` builder and listen with `collect`.',
            codeLines: ['val f = flow { {{0}}(42) }', 'f.{{1}} { println(it) }'],
            expectedTokens: ['emit', 'collect'],
            distractors: ['yield', 'return', 'subscribe'],
            explanation: '`emit(...)` pushes values into the cold stream; `collect` consumes them.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot forgetting to call `.collect` on a cold Flow.',
            lines: [
              'suspend fun watch(f: Flow<Int>) {',
              '  f.map { println(it) }',
              '}',
            ],
            bugLine: 1,
            fixed: '  f.collect { println(it) }',
            explanation: '`.map` is an intermediate operator on cold Flows—nothing runs until terminal `.collect`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss: Structured Pipeline',
        subtitle: 'Combine async parallelism, flowOn, and cancellation safety',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Switch a cold Flow’s upstream emission onto `Dispatchers.IO`.',
            codeLines: ['flow { emit(readDb()) }', '  .{{0}}(Dispatchers.IO)', '  .{{1}} { render(it) }'],
            expectedTokens: ['flowOn', 'collect'],
            distractors: ['withContext', 'subscribeOn', 'emit'],
            explanation: '`flowOn` shifts upstream producers safely while `collect` stays on the caller context.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix calling a `suspend fun` directly from a plain non-suspending function.',
            lines: [
              'suspend fun ping() = "ok"',
              'fun run() = ping()',
            ],
            bugLine: 1,
            fixed: 'suspend fun run() = ping()',
            explanation: 'Calling `ping()` requires either marking `run()` `suspend` or launching inside a scope.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Flow chain collect?',
            code: ['flowOf(1, 2, 3).filter { it > 1 }.map { it * 10 }.collect { println(it) }'],
            options: ['20 then 30', '10, 20, 30', '2 then 3'],
            answer: 0,
            explanation: '`filter` passes `2` and `3`, and `map` scales them to `20` and `30`.',
          },
        ],
      },
    ],
  },
];
