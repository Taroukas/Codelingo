import type { UnitSeed } from './types';

export const JULIA_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: 1-Based Arrays & Math (6 nodes)
  // =========================================================================
  {
    title: '1-Based Arrays & Math',
    subtitle: 'Work natively with 1-indexed arrays, clean ranges, and Julia string interpolation.',
    conceptGraphicType: 'jl_one',
    guidebook: {
      summary:
        'Julia merges **Python-like readability** with **C-level speed** via JIT compilation. Unlike 0-indexed languages, Julia indexes vectors and matrices starting cleanly at **`1`** (`xs[1]` ... `xs[end]`) to match mathematical notation.',
      mentalModel:
        'Think of Julia as runnable linear algebra: `x = 3; 2x + 1` works directly without `*`, `1:5` creates a lightweight range without allocating memory, and `println("val=$(x + 1)")` interpolates expressions inline.',
      keyTakeaways: [
        'Arrays start at **index 1**: `arr[1]` gets the first item and `arr[end]` gets the last (`arr[0]` throws `BoundsError`!).',
        'Build inclusive ranges with `1:5` (1..5) or stepped ranges with `1:2:9` (`1, 3, 5, 7, 9`).',
        'Interpolate strings cleanly via `"$name"` or `"$(x * 2)"`, and concatenate strings with `*` (not `+`!).',
        'Every block (`function`, `for`, `if`) ends explicitly with `end`—no curly braces or fragile indentation rules.',
      ],
      keySyntax: [
        {
          title: '1-Based Indexing & Ranges',
          tag: 'INDEXING',
          code: 'nums = [10, 20, 30, 40]\nprintln(nums[1])\nprintln(nums[2:end])',
          output: '10\n[20, 30, 40]',
          explanation:
            '`nums[1]` is `10` (the very first item) and `end` always refers to `length(nums)`.',
          notes: [
            'Use `eachindex(nums)` inside generic functions to stay clean even on custom-offset arrays.',
          ],
        },
        {
          title: 'String * Concatenation & $ Interpolation',
          tag: 'STRINGS',
          code: 'lang = "Julia"\nver = 1\nprintln(lang * " v" * string(ver + 0.1))\nprintln("Sum = $(2 + 3)")',
          output: 'Julia v1.1\nSum = 5',
          explanation:
            'Julia uses `*` for string concatenation (like algebraic non-commutative composition) and `$` / `$(...)` for interpolation.',
          notes: [
            'Exponentiation uses `^` (`2^10 == 1024`), not `**`.',
          ],
        },
        {
          title: 'Short Functions & end Blocks',
          tag: 'FUNCTIONS',
          code: 'square(x) = x^2\nfunction greet(name)\n  "Hi, $name"\nend',
          output: 'square(5) == 25',
          explanation:
            'Julia implicitly returns the last evaluated expression in a function—`return` is optional unless exiting early.',
          notes: [
            'Juxtaposition (`2x`) works natively when a numeric literal precedes a variable.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Indexing with [0] Like Python or C',
          buggyCode: 'arr = [5, 10, 15]\nfirst = arr[0]',
          fixedCode: 'arr = [5, 10, 15]\nfirst = arr[1]',
          reason:
            'Julia vectors start at `1`; accessing index `0` immediately throws a `BoundsError`.',
        },
        {
          title: 'Concatenating Strings with + Instead of *',
          buggyCode: 'msg = "Hello " + "Julia"',
          fixedCode: 'msg = "Hello " * "Julia"',
          reason:
            '`+` means commutative numeric addition; Julia defines `*` for joining strings cleanly.',
        },
      ],
      proTip:
        'Use Julia’s `begin` and `end` indexing arithmetic (`arr[end - 1]` for second-to-last) and never worry about Python-style negative indices wrapping accidentally.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: '1-Based Indexing & * Strings',
        subtitle: 'Read vectors from 1..end and interpolate expressions cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Indexed from 1 to end',
            explanation:
              'Julia arrays start at `1` (`xs[1]`) and support `xs[end]` cleanly. Concatenate strings with `*` or interpolate via `$var` and `$(expr)`.',
            code: ['xs = [100, 200, 300]', 'println("First=$(xs[1]) Last=$(xs[end])")'],
            highlightNote: 'Math exponentiation uses `^` (`3^2 == 9`) instead of `**`.',
          },
          {
            type: 'token_builder',
            prompt: 'Grab the first and last items of `scores`.',
            codeLines: ['scores = [12, 24, 36]', 'println("Head: $(scores[{{0}}]) Tail: $(scores[{{1}}])")'],
            expectedTokens: ['1', 'end'],
            distractors: ['0', '-1', 'len'],
            explanation: '`scores[1]` gets `12` and `scores[end]` gets `36`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the Python-style 0-index bug in Julia.',
            lines: [
              'langs = ["Julia", "Rust", "Lua"]',
              'println(langs[0])',
            ],
            bugLine: 1,
            fixed: 'println(langs[1])',
            explanation: 'Julia vectors are 1-indexed, so index `0` triggers a `BoundsError`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this Julia expression print?',
            code: ['x = 4', 'println(2x + 1)'],
            options: ['9', '241', 'SyntaxError'],
            answer: 0,
            explanation: 'Numeric coefficient juxtaposition evaluates `2 * 4 + 1 = 9` cleanly.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Ranges, Loops & end Blocks',
        subtitle: 'Iterate ranges lazily and write concise Julia functions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicit end Delimiters',
            explanation:
              'Julia uses `for i in 1:n ... end` and `if cond ... elseif ... else ... end`. Functions return their final expression automatically without needing `return`.',
            code: ['total = 0', 'for i in 1:4', '  total += i', 'end'],
            highlightNote: 'Stepped ranges write `start:step:stop`, e.g., `0:2:6` -> `0, 2, 4, 6`.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete a stepped range from `2` to `6` by `2` and close cleanly.',
            codeLines: ['for x in 2:{{0}}:6', '  println(x)', '{{1}}'],
            expectedTokens: ['2', 'end'],
            distractors: ['step', '}', 'done'],
            explanation: '`2:2:6` puts step size in the middle and terminates blocks with `end`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix joining strings using `+` instead of `*`.',
            lines: [
              'a = "Hi "',
              'b = "Julia"',
              'println(a + b)',
            ],
            bugLine: 2,
            fixed: 'println(a * b)',
            explanation: 'Julia concatenates strings with `*` (or interpolation `"$a$b"`).',
          },
          {
            type: 'multiple_choice',
            question: 'Which operator computes powers (`2` to the `5`th power) in Julia?',
            options: ['2^5', '2**5', 'pow(2, 5)', '2^^5'],
            answer: 0,
            explanation: 'Julia uses `^` for exponentiation (`2^5 == 32`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Short Functions & nothing',
        subtitle: 'Write one-line equations and handle missing results with nothing',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Assignment-Form Functions',
            explanation:
              'Single-expression functions read just like math: `f(x, y) = 2x + y`. For absent values, Julia provides `nothing` (check via `isnothing(v)` or `v === nothing`).',
            code: ['hyp(a, b) = sqrt(a^2 + b^2)', 'println(hyp(3, 4))'],
            highlightNote: 'Remember `&&`, `||`, and `!` perform short-circuit boolean logic.',
          },
          {
            type: 'token_builder',
            prompt: 'Define an assignment function `cube(n)` returning `n^3`.',
            codeLines: ['cube(n) {{0}} n{{1}}3'],
            expectedTokens: ['=', '^'],
            distractors: ['->', '**', ':='],
            explanation: '`cube(n) = n^3` matches mathematical function notation cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `last` return here?',
            code: ['function calc(n)', '  n * 3', 'end', 'println(calc(5))'],
            options: ['15', 'nothing', 'Error'],
            answer: 0,
            explanation: 'Julia implicitly returns the last expression inside `function ... end`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot using Python `None` instead of Julia `nothing`.',
            lines: [
              'val = None',
              'println(val === nothing)',
            ],
            bugLine: 0,
            fixed: 'val = nothing',
            explanation: 'Julia spells the null/unit sentinel value `nothing` (all lowercase).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 1 Checkpoint',
        subtitle: 'Lock in 1-based indexing, interpolation, and end blocks',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Interpolate `n^2` directly inside a printed string.',
            codeLines: ['n = 6', 'println("Sq = {{0}}(n^2)")'],
            expectedTokens: ['$'],
            distractors: ['#{', '@', '\\'],
            explanation: '`$(n^2)` evaluates arbitrary expressions inside double quotes.',
          },
          {
            type: 'predict_output',
            prompt: 'What slice does `xs[2:3]` return?',
            code: ['xs = [10, 20, 30, 40]', 'println(xs[2:3])'],
            options: ['[20, 30]', '[20]', '[30, 40]'],
            answer: 0,
            explanation: 'Slice `2:3` includes both index `2` (`20`) and index `3` (`30`).',
          },
          {
            type: 'multiple_choice',
            question: 'What happens if you pass `arr[0]` on a standard Julia Array?',
            options: [
              'BoundsError: index 0 is out of 1:length bounds',
              'Returns the array length',
              'Returns `nothing` silently',
              'Reads the last element',
            ],
            answer: 0,
            explanation: 'Standard arrays start strictly at index `1`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Tuples, Dicts & Comprehensions',
        subtitle: 'Build vectors cleanly with comprehensions and key-value dicts',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Comprehensions & Dict Pairs',
            explanation:
              'Array comprehensions `[x^2 for x in 1:4]` build typed vectors cleanly. Dictionaries use `=>` pair syntax: `Dict("py" => 1, "jl" => 2)`.',
            code: ['evens = [x for x in 1:6 if x % 2 == 0]', 'scores = Dict("Ada" => 99)'],
            highlightNote: 'Use `;` inside `=>` pairs or `get(scores, "Bob", 0)` for safe defaults.',
          },
          {
            type: 'token_builder',
            prompt: 'Build a dictionary mapping `"jl"` to `5` and fetch safely with `get`.',
            codeLines: ['units = Dict("jl" {{0}} 5)', 'val = {{1}}(units, "rs", 0)'],
            expectedTokens: ['=>', 'get'],
            distractors: [':', 'fetch', '->'],
            explanation: '`=>` constructs `Pair` keys and `get(dict, key, default)` avoids KeyErrors.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix Python-style `{key: val}` dictionary syntax in Julia.',
            lines: [
              'cfg = {"port": 8080}',
              'println(cfg["port"])',
            ],
            bugLine: 0,
            fixed: 'cfg = Dict("port" => 8080)',
            explanation: 'Julia dictionaries use `Dict("key" => val)`, since `{...}` denotes parametric type parameters.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss: Matrix Explorer',
        subtitle: 'Combine 1-based slices, comprehensions, and assignment functions',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Compute squares for `1:3` using a comprehension and return index `end`.',
            codeLines: ['sq = [x{{0}}2 for x in 1:3]', 'println(sq[{{1}}])'],
            expectedTokens: ['^', 'end'],
            distractors: ['**', '-1', '0'],
            explanation: '`[x^2 for x in 1:3]` yields `[1, 4, 9]` and `sq[end]` evaluates to `9`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix missing block closure and string concat operator.',
            lines: [
              'for c in ["a", "b"]',
              '  println(c + "!")',
              'end',
            ],
            bugLine: 1,
            fixed: '  println(c * "!")',
            explanation: 'Join strings with `*`, never `+`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does this slice + interpolation output?',
            code: ['nums = [5, 10, 15, 20]', 'println("Mid: $(nums[2] + nums[3])")'],
            options: ['Mid: 25', 'Mid: 35', 'Mid: 15'],
            answer: 0,
            explanation: '`nums[2]` is `10` and `nums[3]` is `15`, summing to `25`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Dot Syntax & Broadcasting (5 nodes)
  // =========================================================================
  {
    title: 'Dot Syntax & Broadcasting',
    subtitle: 'Vectorize ANY scalar function or operator across arrays using dot fusion.',
    conceptGraphicType: 'jl_broadcast',
    guidebook: {
      summary:
        'Julia does not force you to wait for specialized C-wrapped NumPy functions: appending a **dot (`.`)** to *any* operator (`.+`, `.*`, `.^`) or function (`sin.(xs)`, `clamp.(v, 0, 1)`) vectorizes it—and **loop fusion** compiles chained dots into one single allocation-free machine loop!',
      mentalModel:
        'In Python NumPy, `(x * 2) + 1` allocates an intermediate array for `x * 2`. In Julia, `(x .* 2) .+ 1` (or `@. x * 2 + 1`) **fuses** into a single tight CPU loop with zero temporary heap arrays.',
      keyTakeaways: [
        'Broadcast binary operators with a leading dot: `xs .+ 1`, `xs .* 2`, `xs .^ 2`, `xs .> 5`.',
        'Broadcast *any* scalar function across collections by putting `.` right before `(`: `sqrt.(xs)`.',
        'Use in-place dot assignment `.=` (`out .= xs .* 2 .+ 1`) to reuse pre-allocated buffers cleanly.',
        'Prefix a whole formula with `@.` (`@. y = 2 * x + 1`) so every operator and call automatically broadcasts.',
      ],
      keySyntax: [
        {
          title: 'Fused Dot Broadcasting',
          tag: 'BROADCASTING',
          code: 'xs = [1, 2, 3]\nys = xs .* 2 .+ 1\nprintln(ys)',
          output: '[3, 5, 7]',
          explanation:
            'Both `.*` and `.+` fuse into a single loop computing `(x * 2) + 1` per element.',
          notes: [
            'Notice `.*` writes the dot **before** `+` / `*` / `>`, whereas `f.(xs)` writes it before `(`.',
          ],
        },
        {
          title: 'Applying Custom Functions Elementwise',
          tag: 'FUNCTIONS',
          code: 'triple(x) = 3x\nprintln(triple.([1, 4, 9]))',
          output: '[3, 12, 27]',
          explanation:
            'Even functions you write yourself automatically vectorize across arrays with `.`!',
          notes: [
            'Wrap scalar arguments in `Ref(arg)` if you want an array-like value NOT iterated elementwise.',
          ],
        },
        {
          title: 'The @. Auto-Broadcast Macro',
          tag: 'FUSION MACRO',
          code: 'x = [0, 1, 2]\ny = @. x^2 + 2x + 1',
          output: '[1, 4, 9]',
          explanation:
            '`@.` rewrites every operator (`^`, `*`, `+`) into `.^`, `.*`, `.+` cleanly.',
          notes: [
            'Combine with pre-allocated `dest .= @. ...` in hot loops for zero GC pressure.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Writing Vector + Scalar Without a Dot',
          buggyCode: 'xs = [1, 2, 3]\nys = xs + 10',
          fixedCode: 'xs = [1, 2, 3]\nys = xs .+ 10',
          reason:
            'Linear algebra forbids adding a scalar to a vector directly; dot `.+` explicitly signals elementwise broadcasting.',
        },
        {
          title: 'Applying Scalar Function to Array Without Dot',
          buggyCode: 'vals = uppercase(["hi", "jl"])',
          fixedCode: 'vals = uppercase.(["hi", "jl"])',
          reason:
            '`uppercase` accepts a `String`, not `Vector{String}`; add `.(` to broadcast across elements.',
        },
      ],
      proTip:
        'Remember dot fusion rule: `ys .= f.(g.(xs))` evaluates `f(g(x))` per item directly into `ys`—no slow Python loops needed to match C speed!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Elementwise Operators (.+, .*)',
        subtitle: 'Apply scalars and arrays together cleanly with leading dots',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicit Elementwise Vectorization',
            explanation:
              'Unlike NumPy where `+` silently guesses vector math vs concatenation, Julia separates vector algebra from elementwise operations using a leading `.` (`xs .+ 1`, `xs .^ 2`).',
            code: ['nums = [1, 2, 3]', 'scaled = nums .* 10', 'mask = nums .> 1'],
            highlightNote: '`.>` returns a packed `BitVector` (`[false, true, true]`) for fast filtering!',
          },
          {
            type: 'token_builder',
            prompt: 'Double `[2, 4, 6]` and add `1` elementwise in one fused line.',
            codeLines: ['xs = [2, 4, 6]', 'res = xs {{0}} 2 {{1}} 1'],
            expectedTokens: ['.*', '.+'],
            distractors: ['*', '+', '*.'],
            explanation: '`.*` multiplies and `.+` adds element-by-element in a single fused loop.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix illegal addition of scalar `5` to a Vector without dot syntax.',
            lines: [
              'v = [10, 20, 30]',
              'out = v + 5',
            ],
            bugLine: 1,
            fixed: 'out = v .+ 5',
            explanation: 'Use `.+` to broadcast scalar `5` across vector `v`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `a .* b` produce?',
            code: ['a = [2, 3]', 'b = [4, 5]', 'println(a .* b)'],
            options: ['[8, 15]', '23', 'Error'],
            answer: 0,
            explanation: 'Elementwise `.*` multiplies matching indices `[2*4, 3*5] = [8, 15]`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Broadcasting Functions f.(xs)',
        subtitle: 'Vectorize built-in and custom scalar functions cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Any Function Broadcasts with .(',
            explanation:
              'Place a `.` right before opening parentheses `f.(xs)` to run any scalar function over every element of an array without rewriting `f`!',
            code: ['words = ["julia", "lua"]', 'up = uppercase.(words)'],
            highlightNote: 'Multi-argument broadcasts like `max.(a, b)` align dimensions cleanly too!',
          },
          {
            type: 'token_builder',
            prompt: 'Apply custom `bump(x)` elementwise over `scores`.',
            codeLines: ['bump(x) = x + 10', 'scores = [5, 15]', 'res = bump{{0}}(scores)'],
            expectedTokens: ['.'],
            distractors: ['*', '@', '&'],
            explanation: '`bump.(scores)` vectorizes scalar `bump` across `[5, 15]` -> `[15, 25]`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix calling scalar `sqrt` directly on a vector without `.(`. ',
            lines: [
              'roots = sqrt([4, 9, 16])',
            ],
            bugLine: 0,
            fixed: 'roots = sqrt.([4, 9, 16])',
            explanation: '`sqrt` expects a scalar number; `sqrt.([...])` broadcasts elementwise.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 2 Checkpoint',
        subtitle: 'Verify boolean BitVector masks and @. fusion macro',
        exercises: [
          {
            type: 'predict_output',
            prompt: 'What does boolean indexing print?',
            code: ['xs = [3, 8, 1, 9]', 'println(xs[xs .> 5])'],
            options: ['[8, 9]', '[false, true, false, true]', '[8]'],
            answer: 0,
            explanation: '`xs .> 5` indexes only elements where the mask is `true` (`[8, 9]`).',
          },
          {
            type: 'token_builder',
            prompt: 'Apply the `@.` macro to auto-broadcast the whole expression.',
            codeLines: ['x = [1, 2, 3]', 'y = {{0}} 2x + 3'],
            expectedTokens: ['@.'],
            distractors: ['@vec', '.*', 'map'],
            explanation: '`@.` injects dots before every operator in the expression.',
          },
          {
            type: 'multiple_choice',
            question: 'What major performance benefit does Julia’s dot fusion (`f.(g.(x))`) deliver?',
            options: [
              'Combines steps into one loop with zero intermediate array allocations',
              'Moves computation onto disk storage',
              'Automatically prints debug output',
              'Disables bounds checking permanently',
            ],
            answer: 0,
            explanation: 'Fused broadcasts compute element-by-element directly into the single result array.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'In-Place .= Buffer Reuse',
        subtitle: 'Write allocation-free numeric pipelines into preallocated vectors',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Allocation Updates via .=',
            explanation:
              'Whereas `y = x .* 2` allocates a new vector `y`, `y .= x .* 2` writes results straight into existing memory inside `y`—zero garbage collection!',
            code: ['x = [1.0, 2.0, 3.0]', 'y = similar(x)', 'y .= sin.(x) .+ 1.0'],
            highlightNote: '`similar(x)` allocates an uninitialized array matching `x`’s size and type.',
          },
          {
            type: 'token_builder',
            prompt: 'Update `buf` completely in place without creating a new array.',
            codeLines: ['buf = [1, 2, 3]', 'buf {{0}} buf .^ {{1}}'],
            expectedTokens: ['.=', '2'],
            distractors: ['=', '1', '*='],
            explanation: '`.=` mutates elements inside existing `buf` cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix trying to assign a freshly allocated array where in-place mutation of `dest` was required.',
            lines: [
              'function scale!(dest, src)',
              '  dest = src .* 2',
              'end',
            ],
            bugLine: 1,
            fixed: '  dest .= src .* 2',
            explanation: '`dest = ...` only rebinds the local name; `dest .= ...` writes into the caller’s array!',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss: Fused Pipeline',
        subtitle: 'Master dot broadcasting, masks, and @. fusion cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Normalize `v` inside `out` cleanly using `@.` and `.=`.',
            codeLines: ['v = [10.0, 20.0]', 'out = similar(v)', 'out {{0}} {{1}} v / 10.0 + 1.0'],
            expectedTokens: ['.=', '@.'],
            distractors: ['=', '.*', ':='],
            explanation: '`out .= @. v / 10.0 + 1.0` executes cleanly in place with zero extra allocations.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace this shape broadcast.',
            code: ['row = [1 2 3]', 'col = [10, 20]', 'mat = col .+ row', 'println(size(mat))'],
            options: ['(2, 3)', '(3, 2)', 'Error'],
            answer: 0,
            explanation: '2×1 column + 1×3 row broadcasts cleanly to a `(2, 3)` matrix!',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing dot on elementwise comparison.',
            lines: [
              'temps = [18, 25, 31]',
              'hot = temps > 24',
            ],
            bugLine: 1,
            fixed: 'hot = temps .> 24',
            explanation: 'Comparing vector elements against `24` requires `.>` broadcast syntax.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Multiple Dispatch & Methods (5 nodes)
  // =========================================================================
  {
    title: 'Multiple Dispatch & Methods',
    subtitle: 'Dispatch behavior dynamically across ALL argument types at once.',
    conceptGraphicType: 'jl_dispatch',
    guidebook: {
      summary:
        '**Multiple dispatch** is Julia’s signature superpower: instead of attaching methods to a single `self` class (single dispatch), one generic function chooses its fastest specialized **method** based on the runtime types of **all arguments combined**.',
      mentalModel:
        'Imagine `+`: `+(Int, Int)`, `+(Float64, Float64)`, and `+(Matrix, Matrix)` are all distinct specialized methods of one generic function `+`—your own types join the exact same ecosystem seamlessly!',
      keyTakeaways: [
        'Annotate parameter types with `::` (`collide(a::Ship, b::Asteroid)`) to specialize a generic function for a type combination.',
        'More specific methods automatically win over broader supertypes (`Int` beats `Real` beats `Any`).',
        'Inspect all overloaded methods for any function using `methods(+)` or trace which compiles via `@which 1 + 2.0`.',
        'Avoid **type piracy**: never redefine a base function like `Base.+` exclusively for base types (`Int`, `String`) you don’t own.',
      ],
      keySyntax: [
        {
          title: 'Adding Specialized Methods',
          tag: 'DISPATCH',
          code: 'describe(x::Int) = "Integer $x"\ndescribe(x::String) = "Text: $x"\ndescribe(x) = "Other"',
          output: 'describe(7) -> "Integer 7"',
          explanation:
            'Julia picks the tightest matching method at runtime/compile-time and compiles fast specialized machine code for each combination.',
          notes: [
            '`describe(x)` with no `::` defaults to `x::Any`.',
          ],
        },
        {
          title: 'Two-Argument Interaction Rules',
          tag: 'MULTIPLE ARG',
          code: 'interact(a::Number, b::Number) = a + b\ninteract(a::String, b::Int) = a ^ b',
          output: 'interact("ha", 3) -> "hahaha"',
          explanation:
            'In Julia, `"ha" ^ 3` repeats strings natively—dispatching cleanly on `(String, Int)`.',
          notes: [
            'Notice no base class needed modification to add `interact(::CustomA, ::CustomB)`!',
          ],
        },
        {
          title: 'Constraining Subtypes with Abstract Types',
          tag: 'TYPE HIERARCHY',
          code: 'scale(x::T) where T <: Number = 2x',
          output: 'Matches Int, Float64, Complex, etc., blocks String cleanly',
          explanation:
            'Julia’s `<:` operator reads "is a subtype of", matching any numeric concrete subtype.',
          notes: [
            'Check subtype relationships interactively: `Int <: Real` (`true`).',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Single-Dispatch OOP Method Thinking',
          buggyCode: 'user.save() # trying class-bound dot calls everywhere',
          fixedCode: 'save(user) # free generic function dispatched on User',
          reason:
            'Julia functions live outside structs so any package can extend behavior across pairs of types without modifying source code.',
        },
        {
          title: 'Type Piracy on Base Functions',
          buggyCode: 'Base.:+(a::String, b::String) = a * b',
          fixedCode: 'join_str(a::String, b::String) = a * b',
          reason:
            'Redefining `Base.+` on types you don’t own breaks unrelated libraries across the session.',
        },
      ],
      proTip:
        'Keep parameter type annotations on helper functions only as narrow as dispatch actually needs—leaving generic math parameters unannotated lets custom numbers (like `ForwardDiff.Dual` or `Unitful` quantities) work out of the box!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Type Annotations & Methods',
        subtitle: 'Specialize generic functions on parameter types cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'One Function, Many Specialized Methods',
            explanation:
              'In Julia, `tag(x::Int)` and `tag(x::String)` register two specialized **methods** under one generic function `tag`. The tightest matching signature executes!',
            code: ['kind(x::Int) = "int"', 'kind(x::Float64) = "float"', 'println(kind(3.14))'],
            highlightNote: 'Calling `methods(kind)` lists every method registered on `kind`.',
          },
          {
            type: 'token_builder',
            prompt: 'Specialize `fmt` for `Bool` vs fallback `Any`.',
            codeLines: ['fmt(v{{0}}Bool) = v ? "YES" : "NO"', 'fmt(v::{{1}}) = string(v)'],
            expectedTokens: ['::', 'Any'],
            distractors: [':', 'Object', '->'],
            explanation: '`::Type` annotates parameter types; `Any` acts as the universal catch-all.',
          },
          {
            type: 'predict_output',
            prompt: 'Which method wins when passing an `Int`?',
            code: ['rank(x::Any) = "generic"', 'rank(x::Real) = "real"', 'rank(x::Int) = "exact int"', 'println(rank(42))'],
            options: ['exact int', 'real', 'generic'],
            answer: 0,
            explanation: 'More specific `Int <: Real <: Any` always takes dispatch priority.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the incorrect single-colon parameter annotation syntax.',
            lines: [
              'double_int(x: Int) = 2x',
            ],
            bugLine: 0,
            fixed: 'double_int(x::Int) = 2x',
            explanation: 'Julia type assertions use a double colon `::`, never single `:`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Multi-Argument Dispatch',
        subtitle: 'Resolve interactions dynamically across two or more types',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Beyond OOP Class Ownership',
            explanation:
              'OOP dispatches only on `self`. Julia inspects **every** argument position—so `hit(a::Laser, b::Shield)` vs `hit(a::Rock, b::Shield)` reads cleanly without awkward Visitor patterns.',
            code: ['combine(a::Int, b::Int) = a + b', 'combine(a::String, b::String) = a * b'],
            highlightNote: 'Two packages can add new `combine` pairs without editing each other’s structs!',
          },
          {
            type: 'token_builder',
            prompt: 'Dispatch `merge_val` across `(String, Int)` to repeat strings.',
            codeLines: ['merge_val(s{{0}}String, n{{1}}Int) = s^n'],
            expectedTokens: ['::', '::'],
            distractors: [':', 'is', '->'],
            explanation: 'Both parameters use `::` so Julia dispatches on the `(String, Int)` tuple.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the ambiguous symmetric dispatch overlap.',
            lines: [
              'pair(a::Int, b::Any) = 1',
              'pair(a::Any, b::Int) = 2',
              'pair(10, 20)',
            ],
            bugLine: 2,
            fixed: 'pair(a::Int, b::Int) = 3 # add exact tie-breaker',
            explanation: 'Passing `(Int, Int)` matches neither `(Int, Any)` nor `(Any, Int)` uniquely until an `(Int, Int)` method is defined.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 3 Checkpoint',
        subtitle: 'Check <: supertypes, parametric constraints, and specificity',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Constrain `T` to any subtype of `Real`.',
            codeLines: ['norm(x::T) where T {{0}} {{1}} = abs(x)'],
            expectedTokens: ['<:', 'Real'],
            distractors: [':', 'Int', 'extends'],
            explanation: '`T <: Real` matches `Int`, `Float64`, `Rational`, etc.',
          },
          {
            type: 'multiple_choice',
            question: 'What is "type piracy" in Julia?',
            options: [
              'Extending a function you don’t own exclusively for types you also don’t own',
              'Omitting `end` at the bottom of a module',
              'Using 1-based array slices',
              'Compiling functions with `@.`',
            ],
            answer: 0,
            explanation: 'Pirating external functions on external types causes subtle global conflicts.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `Int <: Real` evaluate to?',
            code: ['println(Int <: Real)'],
            options: ['true', 'false', 'Error'],
            answer: 0,
            explanation: '`Int` is a concrete subtype of abstract `Real`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Abstract Supertypes & Extensions',
        subtitle: 'Share shared interfaces cleanly across concrete structs',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Abstract Types as Dispatch Tags',
            explanation:
              'Declare interfaces cleanly with `abstract type Shape end`, attach concrete structs via `<: Shape`, and write one shared function `describe(s::Shape)`!',
            code: ['abstract type Shape end', 'struct Dot <: Shape end', 'area(::Dot) = 0'],
            highlightNote: 'Notice `::Dot` can even omit an unused variable name cleanly!',
          },
          {
            type: 'token_builder',
            prompt: 'Create an abstract `Node` tag and inherit `Leaf` under it.',
            codeLines: ['{{0}} type Node end', 'struct Leaf {{1}} Node end'],
            expectedTokens: ['abstract', '<:'],
            distractors: ['interface', ':', 'struct'],
            explanation: '`abstract type` defines dispatch groups; `<:` links concrete types.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix trying to inherit fields from a concrete struct.',
            lines: [
              'struct Animal; age::Int; end',
              'struct Dog <: Animal; name::String; end',
            ],
            bugLine: 1,
            fixed: 'abstract type Animal end',
            explanation: 'Only `abstract type`s can be subtyped in Julia—concrete `struct`s are final.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss: Dispatch Architect',
        subtitle: 'Resolve method specificity and subtype abstractions cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Specialize `score` for `T <: Number` while rejecting strings.',
            codeLines: ['score(x::T) {{0}} T {{1}} Number = 10x'],
            expectedTokens: ['where', '<:'],
            distractors: ['if', ':', 'extends'],
            explanation: '`where T <: Number` enforces numeric types cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace which method executes on `msg("hi", 2)`.',
            code: ['msg(a, b) = "any"', 'msg(a::String, b::Number) = "str-num"', 'msg(a::String, b::Int) = a^b', 'println(msg("hi", 2))'],
            options: ['hihi', 'str-num', 'any'],
            answer: 0,
            explanation: '`(String, Int)` is more specific than `(String, Number)`, producing `"hihi"`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the accidental type-assertion typo on method signature.',
            lines: [
              'greet(name::String) = "Hi $name"',
              'greet(id: Int) = "User #$id"',
            ],
            bugLine: 1,
            fixed: 'greet(id::Int) = "User #$id"',
            explanation: 'Parameter type constraints always use double colons `::`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Types, Structs & Tuples (5 nodes)
  // =========================================================================
  {
    title: 'Types, Structs & Tuples',
    subtitle: 'Design compact immutable structs, named tuples, and parametric containers.',
    conceptGraphicType: 'jl_structs',
    guidebook: {
      summary:
        'Julia structs default to **immutable value layout** so arrays of structs sit tightly packed inline in CPU cache without heap pointer chasing. Annotate fields concretely and reach for `mutable struct` only when fields truly must mutate.',
      mentalModel:
        'Think of an immutable `struct Point; x::Float64; y::Float64; end` like a pure 16-byte machine register pair: Julia passes it cheaply in registers with zero heap allocation.',
      keyTakeaways: [
        'Plain `struct` fields cannot be reassigned after construction (`p.x = 2` errors); declare `mutable struct` when mutation is essential.',
        'Always give struct fields **concrete types** (`x::Float64`), never abstract ones (`x::Real`), so CPU layout stays unboxed.',
        'Use **NamedTuples** `(name="Ada", xp=50)` for quick lightweight structured returns with zero boilerplate.',
        'Parameterize structs cleanly: `struct Box{T}; val::T; end` specializes memory layout for every `T`!',
      ],
      keySyntax: [
        {
          title: 'Immutable Struct vs Mutable Struct',
          tag: 'DATA LAYOUT',
          code: 'struct Vec2\n  x::Float64\n  y::Float64\nend\nv = Vec2(3.0, 4.0)',
          output: 'Vec2(3.0, 4.0) (stack-friendly value)',
          explanation:
            'Both fields pack directly into contiguous memory with zero GC overhead.',
          notes: [
            'Default outer constructors accept positional arguments in declaration order.',
          ],
        },
        {
          title: 'Lightweight NamedTuples',
          tag: 'TUPLES',
          code: 'user = (name="Yuna", xp=120)\nprintln("$(user.name): $(user.xp)")',
          output: 'Yuna: 120',
          explanation:
            'NamedTuples give O(1) dot-access fields (`user.xp`) without declaring a named `struct`.',
          notes: [
            'Note single-element tuples require a trailing comma: `(x=1,)`.',
          ],
        },
        {
          title: 'Parametric Structs for Concrete Fields',
          tag: 'GENERICS',
          code: 'struct PairBox{T<:Real}\n  lo::T\n  hi::T\nend',
          output: 'PairBox(1, 5) has concrete Int fields!',
          explanation:
            'Using `{T<:Real}` instead of `lo::Real` preserves exact concrete machine types per instance.',
          notes: [
            'Parametric structs let one definition compile fast specialized code for `Int`, `Float32`, or `Float64`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Reassigning Fields on an Immutable struct',
          buggyCode: 'struct State; hp::Int; end\ns = State(100); s.hp -= 10',
          fixedCode: 'mutable struct State; hp::Int; end\ns = State(100); s.hp -= 10',
          reason:
            'Default `struct`s are strictly immutable; changing a field requires `mutable struct` or creating a new `State`.',
        },
        {
          title: 'Abstract Field Types Killing Struct Speed',
          buggyCode: 'struct Slow; val::Real; end',
          fixedCode: 'struct Fast{T<:Real}; val::T; end',
          reason:
            'An abstract `Real` field forces heap-boxed pointer wrappers instead of inline machine numbers.',
        },
      ],
      proTip:
        'Return lightweight `(ok=true, count=n)` NamedTuples from helpers so callers can destructure `local` fields cleanly via `(; ok, count) = run()`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Immutable vs Mutable Structs',
        subtitle: 'Keep models stack-friendly and opt into mutation purposefully',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Inline Value Layout by Default',
            explanation:
              'A plain Julia `struct` cannot modify fields after creation—making arrays of structs fast and contiguous in memory. Add `mutable struct` only when in-place updates are necessary.',
            code: ['struct Tag', '  name::String', '  pts::Int', 'end', 't = Tag("jl", 10)'],
            highlightNote: 'Fields inside structs separate type with `::`.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare a `mutable struct` so `xp` can increase in place.',
            codeLines: ['{{0}} struct Hero', '  name::String', '  xp{{1}}Int', 'end'],
            expectedTokens: ['mutable', '::'],
            distractors: ['var', ':', 'mut'],
            explanation: '`mutable struct` permits field assignment; `::` binds concrete types.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the forbidden field mutation on a plain immutable struct.',
            lines: [
              'struct Counter; n::Int; end',
              'c = Counter(0)',
              'c.n += 1',
            ],
            bugLine: 2,
            fixed: 'mutable struct Counter; n::Int; end',
            explanation: 'Standard `struct` fields are immutable after construction.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'NamedTuples & Destructuring',
        subtitle: 'Group return values cleanly without extra struct boilerplate',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Cost NamedTuples',
            explanation:
              'Wrap named fields in parentheses `(a=1, b="ok")` to create an immutable `NamedTuple`. Property lookup (`res.b`) is resolved at compile time!',
            code: ['cfg = (host="localhost", port=8080)', 'println(cfg.port)'],
            highlightNote: 'Destructure fields by name cleanly via `(; host, port) = cfg`.',
          },
          {
            type: 'token_builder',
            prompt: 'Return a NamedTuple and destructure `score` cleanly.',
            codeLines: ['stat = (name="Ada", {{0}}=95)', '(; {{1}}) = stat', 'println(score)'],
            expectedTokens: ['score', 'score'],
            distractors: ['xp', 'name', 'val'],
            explanation: '`(; field) = tuple` binds properties cleanly by name.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix a single-field NamedTuple missing its trailing comma.',
            lines: [
              'one = (x=42)',
              'println(one.x)',
            ],
            bugLine: 0,
            fixed: 'one = (x=42,)',
            explanation: 'Without a trailing comma `,`, `(x=42)` parses as parenthesized assignment rather than a NamedTuple.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 4 Checkpoint',
        subtitle: 'Verify struct layout, NamedTuples, and parametric specialization',
        exercises: [
          {
            type: 'predict_output',
            prompt: 'What does `Point(1, 2) == Point(1, 2)` evaluate to?',
            code: ['struct Point; x::Int; y::Int; end', 'println(Point(1, 2) == Point(1, 2))'],
            options: ['true', 'false', 'Error'],
            answer: 0,
            explanation: 'Immutable Julia structs automatically compare equal by field values (`true`).',
          },
          {
            type: 'token_builder',
            prompt: 'Make `Box{T}` parametric so fields stay unboxed.',
            codeLines: ['struct Box{{{0}}}', '  item::{{1}}', 'end'],
            expectedTokens: ['T', 'T'],
            distractors: ['Any', 'Real', '*'],
            explanation: 'Type parameter `{T}` locks a concrete machine type on every constructed `Box`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why should struct fields avoid abstract types like `x::Real`?',
            options: [
              'Abstract fields force slow heap boxing and pointer indirection',
              'Abstract fields cannot be printed',
              'Structs refuse constructors with Real fields',
              'Abstract fields only hold Booleans',
            ],
            answer: 0,
            explanation: 'Using parametric `{T <: Real}` keeps memory layout concrete and inline.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Parametric Structs & Constructors',
        subtitle: 'Enforce invariants inside inner constructors cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Validating Inside `new(...)`',
            explanation:
              'Define an inner constructor matching the struct name to validate invariants before calling `new(...)`. Outside calls cannot bypass your checks!',
            code: ['struct Positive', '  val::Int', '  Positive(v) = v > 0 ? new(v) : error("Must be > 0")', 'end'],
            highlightNote: 'Parametric types match `struct Positive{T<:Real}` seamlessly.',
          },
          {
            type: 'token_builder',
            prompt: 'Validate `n >= 0` in the inner constructor using `new(n)`.',
            codeLines: ['struct NonNeg', '  n::Int', '  NonNeg(n) = n >= 0 ? {{0}}(n) : {{1}}("neg")', 'end'],
            expectedTokens: ['new', 'error'],
            distractors: ['NonNeg', 'throw', 'return'],
            explanation: 'Only inner constructors can invoke `new(...)` to build an instance.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot calling an abstract container parameter without `T` syntax.',
            lines: [
              'struct Span',
              '  lo::Number',
              '  hi::Number',
              'end',
            ],
            bugLine: 0,
            fixed: 'struct Span{T<:Number} # use T::T for lo and hi',
            explanation: 'Parameterize `struct Span{T<:Number}` so `lo::T` and `hi::T` stay concrete and fast.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss: Fast Geometry',
        subtitle: 'Combine concrete parametric structs, NamedTuples, and dispatch',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Complete an immutable parametric `Rect{T<:Real}` and area helper.',
            codeLines: ['struct Rect{{{0}}<:Real}', '  w::T; h::T', 'end', 'area(r::{{1}}) = r.w * r.h'],
            expectedTokens: ['T', 'Rect'],
            distractors: ['Any', 'struct', 'Float64'],
            explanation: '`Rect{T<:Real}` compiles specialized `area` machine code for any numeric `T`.',
          },
          {
            type: 'predict_output',
            prompt: 'Does changing a vector inside an immutable wrapper mutate elements?',
            code: ['struct Bag; items::Vector{Int}; end', 'b = Bag([1, 2]); push!(b.items, 3)', 'println(length(b.items))'],
            options: ['3', '2', 'Immutable error'],
            answer: 0,
            explanation: 'You cannot rebind `b.items = ...`, but the mutable `Vector` referenced inside still supports `push!`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix trying to call `new()` outside a struct definition.',
            lines: [
              'struct Key; id::Int; end',
              'k = new(Key, 5)',
            ],
            bugLine: 1,
            fixed: 'k = Key(5)',
            explanation: 'Outside the struct block, instantiate directly using `Key(5)`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Type Stability & Zero-Alloc Code (5 nodes)
  // =========================================================================
  {
    title: 'Type Stability & Zero-Alloc Code',
    subtitle: 'Write type-stable hot functions, slice views, and local scopes for C speed.',
    conceptGraphicType: 'jl_perf',
    guidebook: {
      summary:
        'Julia compiles native LLVM machine instructions on first call—as fast as C when your function is **type-stable** (its variable and return types depend only on input argument types, never runtime branches) and avoids untyped globals or accidental slice copies.',
      mentalModel:
        'Think of LLVM codegen as needing a clear blue-print: if `f(x)` returns either `Int` or `String` depending on runtime values, CPU registers must box values in slow dynamic wrappers; keeping outputs consistently `Float64` unlocks raw SIMD math.',
      keyTakeaways: [
        'Return consistent concrete types (`0.0` instead of `0` when the other branch returns a `Float64`, or `zero(x)` generically!).',
        'Never mutate or read **untyped global variables** (`g = 10`) inside tight loops—pass parameters into functions or use `const` globals.',
        'Regular array slices (`arr[1:100]`) allocate a **copy** in Julia! Wrap slices with `@view arr[1:100]` (`view(arr, 1:100)`) for zero-copy O(1) views.',
        'Inspect compiled types anytime with `@code_warntype my_func(args)`—red `Any` or `Union` warnings highlight performance leaks instantly.',
      ],
      keySyntax: [
        {
          title: 'Type-Stable Returns with zero(x)',
          tag: 'TYPE STABILITY',
          code: 'safe_sqrt(x) = x >= 0 ? sqrt(x) : zero(float(x))',
          output: 'Always returns Float64 regardless of branch',
          explanation:
            '`zero(float(x))` guarantees `0.0::Float64` matches `sqrt(x)::Float64`, avoiding an `Int`/`Float64` `Union`.',
          notes: [
            'Check stability interactively with `@code_warntype safe_sqrt(-1)`.',
          ],
        },
        {
          title: 'Zero-Copy Slices with @view',
          tag: 'MEMORY',
          code: 'xs = collect(1:1000)\ns = sum(@view xs[10:50])',
          output: 'Sums slice directly with zero heap allocation',
          explanation:
            'Without `@view`, `xs[10:50]` copies 41 elements to the heap before summing.',
          notes: [
            'Prefix a whole block of slices cleanly using `@views`!',
          ],
        },
        {
          title: 'const Globals vs Arguments',
          tag: 'GLOBALS',
          code: 'const RATE = 1.08\ntax(price) = price * RATE',
          output: 'Compiler inlines RATE directly as a constant',
          explanation:
            'Untyped globals can change type anywhere; `const` locks the concrete type cleanly for LLVM optimization.',
          notes: [
            'Even better: pass state via struct parameters into local functions.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Returning Mixed Int (0) and Float (x/2) Branches',
          buggyCode: 'half(x) = x <= 0 ? 0 : x / 2',
          fixedCode: 'half(x) = x <= 0 ? 0.0 : x / 2',
          reason:
            '`0` is `Int` while `x / 2` is `Float64`, forcing a `Union{Int, Float64}` type instability.',
        },
        {
          title: 'Copying Huge Slices Inside Loops',
          buggyCode: 'for i in 1:1000; s += sum(arr[1:500]); end',
          fixedCode: 'for i in 1:1000; s += sum(@view arr[1:500]); end',
          reason:
            'Bare indexing `arr[1:500]` allocates a new 500-element vector on every iteration.',
        },
      ],
      proTip:
        'Benchmark real functions inside `BenchmarkTools` (`@btime`) rather than global top-level loops—global scope variables defeat JIT register allocation unless wrapped inside a `function`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Type Stability & @code_warntype',
        subtitle: 'Keep return types predictable for LLVM machine specialization',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Same Input Type -> Same Output Type',
            explanation:
              'A function is **type-stable** when the return type depends strictly on argument types, never runtime branches. Writing `0.0` instead of `0` alongside `Float64` branches keeps LLVM register math 100% concrete!',
            code: ['clamp0(x::Float64) = x > 0.0 ? x : 0.0'],
            highlightNote: 'Use `zero(x)` or `one(x)` generically so `Float32`, `Float64`, and `Int` all stay type-stable.',
          },
          {
            type: 'token_builder',
            prompt: 'Fix `ratio(a, b)` so zero-divisor still returns `Float64` (`0.0`).',
            codeLines: ['ratio(a::Int, b::Int) = b == 0 ? {{0}} : a {{1}} b'],
            expectedTokens: ['0.0', '/'],
            distractors: ['0', '//', 'nothing'],
            explanation: '`/` in Julia always produces `Float64`, matching `0.0` with zero type union.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the type instability mixing `Int` and `Float64` accumulator types.',
            lines: [
              'function sum_halves(n)',
              '  acc = 0',
              '  for i in 1:n; acc += i / 2; end',
              '  acc',
              'end',
            ],
            bugLine: 1,
            fixed: '  acc = 0.0',
            explanation: '`acc` flips type from `Int` (`0`) to `Float64` on iteration 1; initialize `acc = 0.0`!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Zero-Copy @view Slices',
        subtitle: 'Avoid hidden array copies inside performance-critical loops',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Views vs Heap Copies',
            explanation:
              'Array indexing `arr[a:b]` creates a brand-new copied array in Julia. Wrapping with `@view arr[a:b]` creates a lightweight `SubArray` window directly over the original memory!',
            code: ['xs = [10, 20, 30, 40]', 'v = @view xs[2:3]', 'println(sum(v))'],
            highlightNote: 'Writing into `@view xs[2:3] .= 0` mutates the underlying `xs` directly too!',
          },
          {
            type: 'token_builder',
            prompt: 'Sum a subslice without allocating a copied vector.',
            codeLines: ['total(xs) = sum({{0}} xs[1:{{1}}])'],
            expectedTokens: ['@view', 'end'],
            distractors: ['copy', '0', 'slice'],
            explanation: '`@view xs[1:end]` borrows elements directly with zero copy.',
          },
          {
            type: 'multiple_choice',
            question: 'What does plain `sub = data[1:1000]` do in Julia?',
            options: [
              'Allocates and copies a brand-new 1,000-element vector',
              'Creates an O(1) immutable reference view automatically',
              'Sorts the elements ascending',
              'Returns a Tuple',
            ],
            answer: 0,
            explanation: 'Standard array slices allocate copies; add `@view` for zero-copy windows.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Unit 5 Checkpoint',
        subtitle: 'Guard loops against untyped globals and unstable accumulators',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Lock a module-level coefficient with `const` so functions inline cleanly.',
            codeLines: ['{{0}} TAX = 1.15', 'with_tax(x::Float64) = x * {{1}}'],
            expectedTokens: ['const', 'TAX'],
            distractors: ['let', 'global', 'rate'],
            explanation: '`const TAX` fixes the global’s concrete type at compile time.',
          },
          {
            type: 'predict_output',
            prompt: 'What does modifying a `@view` mutate?',
            code: ['xs = [1, 2, 3]', 'v = @view xs[1:2]', 'v[1] = 99', 'println(xs[1])'],
            options: ['99', '1', 'Error'],
            answer: 0,
            explanation: 'A `view` shares underlying storage directly with `xs`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which macro highlights type instabilities (`Any` / `Union`) inside a compiled Julia function?',
            options: ['@code_warntype', '@debug', '@. ', '@view'],
            answer: 0,
            explanation: '`@code_warntype fn(args)` shows inferred types per IR statement cleanly.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Preallocation & Typed Containers',
        subtitle: 'Replace Any[] vectors with concrete Vector{T}',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Avoid Accidental Any[] Collections',
            explanation:
              'Writing `xs = []` allocates `Vector{Any}`, boxing every pushed number on the heap! Always declare concrete containers like `xs = Int[]` or `Float64[]`.',
            code: ['ys = Float64[]', 'sizehint!(ys, 1000)', 'push!(ys, 3.14)'],
            highlightNote: '`sizehint!` pre-reserves capacity so `push!` avoids repeated reallocations.',
          },
          {
            type: 'token_builder',
            prompt: 'Initialize a typed empty `Int` vector cleanly instead of `Any[]`.',
            codeLines: ['ids = {{0}}[]', 'push!(ids, 42)', 'println({{1}}(ids))'],
            expectedTokens: ['Int', 'eltype'],
            distractors: ['Any', 'var', 'typeof'],
            explanation: '`Int[]` produces `Vector{Int}` (`eltype(ids) == Int`).',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the empty `Any[]` vector boxing floats in a tight loop.',
            lines: [
              'function build(n)',
              '  out = []',
              '  for i in 1:n; push!(out, Float64(i)); end',
              '  out',
              'end',
            ],
            bugLine: 1,
            fixed: '  out = Float64[]',
            explanation: '`out = Float64[]` stores unboxed 64-bit floats contiguously.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss: C-Speed Kernel',
        subtitle: 'Eliminate allocations, type unions, and slow globals cleanly',
        exercises: [
          {
            type: 'find_bug',
            prompt: 'Fix the untyped global variable slowing down `scale_vec`.',
            lines: [
              'k = 2.5',
              'scale_vec(xs) = xs .* k',
            ],
            bugLine: 0,
            fixed: 'const k = 2.5',
            explanation: 'Non-`const` globals disable concrete type inference inside functions.',
          },
          {
            type: 'token_builder',
            prompt: 'Combine concrete `Float64[]`, `@views`, and `zero(eltype(xs))`.',
            codeLines: ['function win_sum(xs::Vector{Float64})', '  out = {{0}}[]', '  push!(out, sum({{1}} xs[1:end]))', '  out', 'end'],
            expectedTokens: ['Float64', '@view'],
            distractors: ['Any', 'copy', 'Int'],
            explanation: '`Float64[]` + `@view` yields fast, concrete code with minimal allocations.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does `zero(x)` outperform literal `0` inside generic numeric functions?',
            options: [
              'It returns `0` of the exact matching type `typeof(x)` to preserve type stability',
              'It runs on multiple threads automatically',
              'It converts integers to strings',
              'It skips `for` loops completely',
            ],
            answer: 0,
            explanation: '`zero(1.5)` returns `0.0::Float64`, keeping branches uniform across every numeric type.',
          },
        ],
      },
    ],
  },
];
