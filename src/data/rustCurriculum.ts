import type { UnitSeed } from './types';

export const RUST_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: First Steps in Rust (6 nodes)
  // =========================================================================
  {
    title: 'First Steps in Rust',
    subtitle: 'Print via macros, embrace immutable-by-default let, and shadow variables safely.',
    conceptGraphicType: 'rust_vars',
    guidebook: {
      summary:
        'Rust guarantees memory safety at compile time without a garbage collector. Variables created with `let` are **immutable by default** unless marked `let mut`, and formatted text prints through the `println!` macro (note the trailing `!`).',
      mentalModel:
        'Invisibility of mutation is a feature in Rust: when a variable is `let count = 10`, readers and the compiler know it never changes unless explicitly shadowed (`let count = count + 1`) or declared `let mut count = 10`.',
      keyTakeaways: [
        'Write `println!("...")` WITH the `!` — it invokes a Rust macro, not a regular function.',
        'Use `{}` placeholders inside `println!("{} XP", xp)` (or `{xp}` inline capture!).',
        'Variables declared via `let x = 5;` are immutable; add `mut` (`let mut x = 5;`) to update later.',
        'Variable shadowing (`let x = x.len();`) lets you rebind a name AND switch its type cleanly without `mut`.',
      ],
      keySyntax: [
        {
          title: 'Formatted Output with println! Macro',
          tag: 'MACROS',
          code: 'let hero = "Kenji";\nlet xp = 120;\nprintln!("{hero} earned {} XP", xp + 30);',
          output: 'Kenji earned 150 XP',
          explanation:
            'Inline `{hero}` captures local variables directly, while `{}` interpolates evaluated expressions.',
          notes: [
            'Use `{:?}` debug formatting (`println!("{:?}", vec![1, 2])`) to print collections!',
          ],
        },
        {
          title: 'Immutable `let` vs Mutable `let mut`',
          tag: 'MUTABILITY',
          code: 'let cap = 100;\nlet mut hp = 60;\nhp += 25;\nprintln!("hp={hp} / {cap}");',
          output: 'hp=85 / 100',
          explanation:
            'Opt-in mutability forces explicit intent whenever state changes.',
          notes: [
            'True compile-time constants use `const MAX_HP: i32 = 100;` with an explicit type annotation.',
          ],
        },
        {
          title: 'Scalar Types & Shadowing',
          tag: 'TYPES',
          code: 'let spaces = "   ";\nlet spaces = spaces.len();\nlet exact: f64 = 7.0 / 2.0;\nprintln!("{spaces} {exact}");',
          output: '3 3.5',
          explanation:
            'Re-declaring with `let` creates a fresh binding that can even transform types cleanly (`&str` -> `usize`).',
          notes: [
            'Default integer inference is `i32`; floats default to `f64`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Mutating a Non-mut Variable',
          buggyCode: 'let score = 10;\nscore += 5; // Error: cannot assign twice to immutable variable',
          fixedCode: 'let mut score = 10;\nscore += 5;',
          reason:
            'Every Rust binding is read-only by default. Add `mut` after `let` when reassignments happen.',
        },
        {
          title: 'Calling println Without !',
          buggyCode: 'println("Hello Rust!"); // Expected function, found macro',
          fixedCode: 'println!("Hello Rust!");',
          reason:
            'Because Rust functions take fixed parameter counts, variadic formatting runs via the `println!` macro.',
        },
      ],
      proTip:
        'Check any expression’s value and source file:line while debugging using `dbg!(x);` — it prints `[src/main.rs:4] x = 42` AND returns ownership cleanly.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'println! & Macros',
        subtitle: 'Format output cleanly with Rust macros and {} placeholders',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Your First Rust Output',
            explanation:
              'In Rust, `fn main()` is the entry point and `println!` writes formatted lines to stdout. The exclamation mark `!` signals a compile-time macro!',
            code: ['fn main() {', '    let lang = "Rust";', '    println!("Booted {lang}!");', '}'],
            output: 'Booted Rust!',
            highlightNote: 'Notice the trailing semicolon `;` on statements inside `{}`.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the formatted Rust print call.',
            codeLines: ['let xp = 50;', '{{0}}("Earned {{1}} XP", xp);'],
            expectedTokens: ['println!', '{}'],
            distractors: ['println', '%d', 'print!'],
            explanation: '`println!` formats `{}` arguments safely at compile time.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the broken Rust macro call.',
            lines: [
              'fn main() {',
              '    println("Ready!");',
              '}',
            ],
            bugLine: 1,
            fixed: '    println!("Ready!");',
            explanation: '`println` requires `!` to invoke the formatting macro.',
          },
          {
            type: 'predict_output',
            prompt: 'What gets printed using `{:?}` debug formatting?',
            code: ['let nums = [10, 20];', 'println!("{:?}", nums);'],
            options: ['[10, 20]', '10 20', 'Array(2)'],
            answer: 0,
            explanation: '`{:?}` prints debug representations cleanly across arrays and structs.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'let & let mut',
        subtitle: 'Contrast immutable-by-default bindings with explicit mutability',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Opt-In Mutability',
            explanation:
              'Variables start immutable (`let hp = 100`). To update a binding in place, declare it `let mut hp = 100`. Compile-time constants use `const` with an explicit type.',
            code: ['let mut combo = 1;', 'combo += 2;', 'const MAX: u32 = 99;'],
            output: 'combo is 3',
          },
          {
            type: 'token_builder',
            prompt: 'Declare a mutable counter cleanly and increment it.',
            codeLines: ['let {{0}} streak = 3;', 'streak {{1}} 1;'],
            expectedTokens: ['mut', '+='],
            distractors: ['var', 'let', ':='],
            explanation: '`let mut` unlocks reassignment; Rust has no `++` operator — use `+= 1`!',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why Rust rejects mutating `score`.',
            lines: [
              'let score = 10;',
              'score = score + 15;',
              'println!("{score}");',
            ],
            bugLine: 0,
            fixed: 'let mut score = 10;',
            explanation: 'Immutable `let` forbids updates; declare `let mut score = 10;`.',
          },
          {
            type: 'multiple_choice',
            question: 'Does Rust support `score++` increment syntax?',
            options: [
              'No — always write `score += 1`',
              'Yes, prefix `++score` only',
              'Yes, both prefix and postfix',
              'Only inside `unsafe` blocks',
            ],
            answer: 0,
            explanation: 'Rust intentionally omitted `++`/`--` to prevent precedence ambiguity bugs.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Scalar Types & Shadowing',
        subtitle: 'Work with i32, f64, bool, and type-changing let shadowing',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Types & Shadowing',
            explanation:
              'Integers default to `i32` (`u32` unsigned), floats default to `f64`, and `usize` indexes collections. Shadowing (`let x = ...`) binds a fresh variable reusing the same name — even with a new type!',
            code: ['let raw = "42";', 'let raw: i32 = 42;', 'let half: f64 = 7.0 / 2.0;'],
            output: '3.5',
          },
          {
            type: 'token_builder',
            prompt: 'Shadow `tag` into its length cleanly.',
            codeLines: ['let tag = "rust";', '{{0}} tag = tag.{{1}}();'],
            expectedTokens: ['let', 'len'],
            distractors: ['mut', 'length', 'size'],
            explanation: 'Prefixing `let` shadows cleanly and swaps type from `&str` to `usize`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the mismatched scalar arithmetic bug.',
            lines: [
              'let whole: i32 = 5;',
              'let dec: f64 = 2.0;',
              'let sum = whole + dec;',
            ],
            bugLine: 2,
            fixed: 'let sum = (whole as f64) + dec;',
            explanation: 'Rust never silently mixes `i32` + `f64`; cast explicitly via `as f64`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `x` print inside shadowed inner vs outer scopes?',
            code: ['let x = 5;', '{ let x = x * 2; println!("{x}"); }', 'println!("{x}");'],
            options: ['10 then 5', '10 then 10', '5 then 5'],
            answer: 0,
            explanation: 'Inner shadow disappears when the `{}` block ends, revealing outer `5`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Rust Basics Checkpoint',
        subtitle: 'No-hints check on mutability, macros, and shadowing',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Declare a typed constant and format debug output.',
            codeLines: ['{{0}} PORT: u16 = 8080;', 'println!("{{1}}", PORT);'],
            expectedTokens: ['const', '{}'],
            distractors: ['final', 'let', '%d'],
            explanation: '`const` requires an explicit type (`u16`); `{}` displays `8080`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the invalid Rust increment operator.',
            lines: [
              'let mut count = 0;',
              'count++;',
              'println!("{count}");',
            ],
            bugLine: 1,
            fixed: 'count += 1;',
            explanation: 'Rust uses `count += 1;` instead of `count++;`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is printed cleanly?',
            code: ['let mut x = 4;', 'x *= 3;', 'let x = x + 1;', 'println!("{x}");'],
            options: ['13', '12', 'Compile Error'],
            answer: 0,
            explanation: '`4 * 3 = 12`, then shadowed cleanly to `13`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Tuples & Fixed Arrays',
        subtitle: 'Destructure fixed tuples and inspect array bounds safety',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Compound Primitives',
            explanation:
              'Tuples group mixed types (`let pos = (10, "py");`) accessed via `.0` or destructured (`let (x, y) = pos;`). Arrays `[i32; 3]` enforce fixed lengths and panic safely on out-of-bounds reads instead of reading garbage.',
            code: ['let pair = (200, "OK");', 'let (code, msg) = pair;', 'let arr: [i32; 3] = [1, 2, 3];'],
            output: '200 OK',
          },
          {
            type: 'token_builder',
            prompt: 'Destructure a tuple cleanly and read index 1.',
            codeLines: ['let stats = (90, "Gold");', 'let {{0}} = stats;', 'println!("{}", stats.{{1}});'],
            expectedTokens: ['(xp, tier)', '1'],
            distractors: ['[xp, tier]', '[1]', '0'],
            explanation: 'Destructure tuples with `(...)` and index fields with `.0`, `.1`.',
          },
          {
            type: 'multiple_choice',
            question: 'What happens in safe Rust if you access an array index past its length at runtime?',
            options: [
              'Rust safely panics and aborts before reading invalid memory',
              'It silently reads adjacent memory bytes like C',
              'It returns `null`',
              'It resizes the array automatically',
            ],
            answer: 0,
            explanation: 'Bounds checks stop out-of-bounds reads immediately — preventing buffer overflows.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 1 Boss: Cargo Ready',
        subtitle: 'Demonstrate clean Rust types, mutability & compound expressions',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Compute exact float ratio and update mutable points.',
            codeLines: [
              'let mut total = 10;',
              'total {{0}} 5;',
              'let ratio = (total {{1}} f64) / 2.0;',
              'println!("{ratio}");',
            ],
            expectedTokens: ['+=', 'as'],
            distractors: ['=', 'into', '++'],
            explanation: '`total += 5` updates mutable `total`; `as f64` converts explicitly.',
          },
          {
            type: 'find_bug',
            prompt: 'Crush the boss mutability error.',
            lines: [
              'let attempts = 3;',
              'let active = true;',
              'attempts -= 1;',
              'println!("{attempts} {active}");',
            ],
            bugLine: 0,
            fixed: 'let mut attempts = 3;',
            explanation: '`attempts` must be declared `let mut` to allow `-= 1`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace tuple indexing and shadowing.',
            code: ['let pt = (4, 9);', 'let x = pt.0;', 'let x = x * 2;', 'println!("{}-{}", x, pt.1);'],
            options: ['8-9', '4-9', '18-9'],
            answer: 0,
            explanation: '`pt.0` is `4`, shadowed to `8`, alongside `pt.1` (`9`).',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Ownership & Borrowing (5 nodes)
  // =========================================================================
  {
    title: 'Ownership & Borrowing',
    subtitle: 'Master Move semantics, shared &T references, and exclusive &mut T borrows.',
    conceptGraphicType: 'rust_ownership',
    guidebook: {
      summary:
        'Ownership is Rust’s flagship superpower: every value in memory has ONE clear owner at any instant. Passing a heap value like `String` moves ownership (unless cloned or borrowed via `&`). When the owner exits scope `}`, memory frees cleanly with zero GC!',
      mentalModel:
        'Imagine sharing a single physical book: **any number of readers** can read it at once (`&T` shared borrows), OR **exactly ONE writer** can edit it (`&mut T` exclusive borrow) — NEVER both simultaneously! This single rule kills data races at compile time.',
      keyTakeaways: [
        'Each value has one owner; assigning `let s2 = s1;` for heap `String` **moves** ownership cleanly — `s1` becomes invalid!',
        'Simple stack scalars (`i32`, `bool`, `f64`, `char`) implement `Copy` and duplicate cheaply instead of moving.',
        'Pass `&String` or `&str` when functions only need to read (borrowing without taking ownership).',
        'Borrow rules at one time: EITHER many `&T` immutable borrows OR ONE `&mut T` mutable borrow — never mixed!',
      ],
      keySyntax: [
        {
          title: 'Move Semantics vs Stack Copy',
          tag: 'OWNERSHIP',
          code: 'let a = 10; let b = a; // i32 is Copy!\nlet s1 = String::from("rust");\nlet s2 = s1; // s1 MOVED into s2\nprintln!("{a} {b} {s2}");',
          output: '10 10 rust',
          explanation:
            'After `let s2 = s1`, `s1` is dropped cleanly so Rust never double-frees heap text at scope exit.',
          notes: [
            'Call `.clone()` explicitly (`let s2 = s1.clone();`) only when you genuinely need a separate heap duplicate.',
          ],
        },
        {
          title: 'Shared Immutable Borrow (`&T`)',
          tag: 'BORROWING',
          code: 'fn char_len(s: &String) -> usize { s.len() }\nlet tag = String::from("borrow");\nlet len = char_len(&tag);\nprintln!("{tag} -> {len}");',
          output: 'borrow -> 6',
          explanation:
            'Passing `&tag` lends temporary read-only access without moving ownership, letting callers keep using `tag` afterward!',
          notes: [
            'Prefer `&str` over `&String` in read-only function params so string literals `"abc"` work seamlessly too.',
          ],
        },
        {
          title: 'Exclusive Mutable Borrow (`&mut T`)',
          tag: 'EXCLUSIVE',
          code: 'fn boost(s: &mut String) {\n    s.push_str("!");\n}\nlet mut msg = String::from("fast");\nboost(&mut msg);\nprintln!("{msg}");',
          output: 'fast!',
          explanation:
            'Callee mutates `msg` in place through `&mut msg` without reallocating ownership.',
          notes: [
            'Two `&mut msg` borrows CANNOT overlap alive in the same scope — zero aliasing bugs!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using a String After It Was Moved',
          buggyCode: 'let s1 = String::from("hi");\nlet s2 = s1;\nprintln!("{s1}"); // Compile error: value borrowed after move',
          fixedCode: 'let s1 = String::from("hi");\nlet s2 = &s1;\nprintln!("{s1} {s2}");',
          reason:
            'Borrowing `&s1` lets both `s1` and `s2` inspect `"hi"` safely without moving ownership out of `s1`.',
        },
        {
          title: 'Overlapping Mutable & Immutable Borrows',
          buggyCode: 'let mut v = vec![1, 2];\nlet r1 = &v[0];\nv.push(3); // Mutates while r1 borrows v!\nprintln!("{r1}");',
          fixedCode: 'let mut v = vec![1, 2];\nlet first = v[0]; // Copies i32\nv.push(3);\nprintln!("{first}");',
          reason:
            'If `v.push(3)` reallocates memory while `r1` is still used later, `r1` would dangle! Borrow checker stops this bug before running.',
        },
      ],
      proTip:
        'Non-Lexical Lifetimes (NLL): in modern Rust, a borrow’s lifetime ends the moment it is **last used**, NOT at the closing brace `}` — so once you finish reading `r1`, you can mutably borrow right on the next line!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Move Semantics vs Copy',
        subtitle: 'Understand single ownership on heap String vs stack Copy',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Only One Owner at a Time',
            explanation:
              'When `let s2 = s1;` runs on a heap `String`, ownership transfers ("moves") cleanly to `s2`, invalidating `s1`. Small fixed scalars (`i32`, `bool`) automatically `Copy` instead.',
            code: ['let s1 = String::from("cargo");', 'let s2 = s1;  // s1 moved here', '// s1 is now out of scope!'],
            highlightNote: 'Zero garbage collector pauses — owner drops heap memory deterministically at `}`.',
          },
          {
            type: 'token_builder',
            prompt: 'Explicitly duplicate `orig` onto a separate heap string.',
            codeLines: ['let orig = String::from("hero");', 'let copy = orig.{{0}}();', 'println!("{orig} & {copy}");'],
            expectedTokens: ['clone'],
            distractors: ['copy', 'dup', 'ref'],
            explanation: 'Calling `.clone()` allocates an independent heap duplicate when needed.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the use-after-move borrow checker error.',
            lines: [
              'let name = String::from("Ada");',
              'let moved = name;',
              'println!("{name}");',
            ],
            bugLine: 2,
            fixed: 'println!("{moved}");',
            explanation: 'Ownership moved to `moved`; `name` cannot be read afterward.',
          },
          {
            type: 'multiple_choice',
            question: 'Which variable assignment performs a shallow `Copy` cleanly WITHOUT moving ownership?',
            options: [
              'let b: i32 = a;',
              'let s2: String = s1;',
              'let v2: Vec<i32> = v1;',
              'let map2: HashMap<i32, i32> = map1;',
            ],
            answer: 0,
            explanation: 'Stack integers (`i32`) implement the `Copy` trait; heap collections move unless cloned.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Borrowing (&T & &mut T)',
        subtitle: 'Lend read-only and exclusive mutable access cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Share Freely (&) or Mutate Exclusively (&mut)',
            explanation:
              'Prefix types with `&` to read without taking ownership, or `&mut` to modify caller state safely. Rule: many `&T` readers OR one `&mut T` writer — never overlapping!',
            code: ['fn tag_len(s: &str) -> usize { s.len() }', 'fn bang(s: &mut String) { s.push(\'!\'); }'],
          },
          {
            type: 'token_builder',
            prompt: 'Borrow `msg` mutably so `append_ok` updates it in place.',
            codeLines: ['fn append_ok(s: {{0}} String) { s.push_str(" OK"); }', 'let mut msg = String::from("API");', 'append_ok({{1}} msg);'],
            expectedTokens: ['&mut', '&mut'],
            distractors: ['mut', '&', '*mut'],
            explanation: 'Both parameter signature and call site mark `&mut` explicitly so mutation is never hidden.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the aliasing rule violation (two simultaneous mutable borrows).',
            lines: [
              'let mut xp = 50;',
              'let r1 = &mut xp;',
              'let r2 = &mut xp;',
              'println!("{r1} {r2}");',
            ],
            bugLine: 2,
            fixed: '// Use one &mut borrow at a time before taking another',
            explanation: 'Rust forbids two active `&mut` references pointing to `xp` simultaneously.',
          },
          {
            type: 'predict_output',
            prompt: 'What prints when lending `&s` to a reader function?',
            code: ['fn len_of(s: &String) -> usize { s.len() }', 'let s = String::from("rust");', 'let n = len_of(&s);', 'println!("{s}:{n}");'],
            options: ['rust:4', 'Moved Error', '4:4'],
            answer: 0,
            explanation: 'Borrowing `&s` returns access back cleanly so `s` still prints `"rust"`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Ownership Checkpoint',
        subtitle: 'No-hints check on moves, Copy scalars, and borrow rules',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Keep `msg` reusable after printing its character length.',
            codeLines: ['fn check(s: {{0}}String) -> usize { s.len() }', 'let msg = String::from("safe");', 'let n = check({{1}}msg);'],
            expectedTokens: ['&', '&'],
            distractors: ['*mut', 'copy', '&mut'],
            explanation: 'Immutable reference `&String` reads without consuming ownership.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the mutable vs immutable overlap bug.',
            lines: [
              'let mut s = String::from("hi");',
              'let reader = &s;',
              's.push_str("!");',
              'println!("{reader}");',
            ],
            bugLine: 2,
            fixed: '// Finish reading {reader} BEFORE mutating s',
            explanation: '`s.push_str` requires `&mut s` while immutable `reader` is still alive until line 4.',
          },
          {
            type: 'multiple_choice',
            question: 'How does Rust completely prevent dangling pointers at compile time?',
            options: [
              'References (`&T`) must never outlive the owner they borrow from',
              'Everything is reference-counted like Python',
              'Variables live forever until process exit',
              'Raw pointers run inside a JVM',
            ],
            answer: 0,
            explanation: 'Lifetimes guarantee every borrow stays valid for its entire active scope.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'String Slices (&str)',
        subtitle: 'Reference substrings cleanly with zero heap allocation',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Copy Views with Slices',
            explanation:
              'A slice `&s[0..4]` is a lightweight fat pointer `(ptr, len)` borrowing directly into an existing `String` or array — zero copy!',
            code: ['let full = String::from("codelingo");', 'let head: &str = &full[0..4];  // "code"'],
            output: 'code',
          },
          {
            type: 'token_builder',
            prompt: 'Take a zero-copy slice of the first 4 bytes.',
            codeLines: ['let title = String::from("rustacean");', 'let part: &str = {{0}}title[{{1}}];'],
            expectedTokens: ['&', '0..4'],
            distractors: ['*', '0:4', '1..5'],
            explanation: 'Range syntax `0..4` paired with `&` borrows `[ptr, 4]` cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What does accepting `&str` let callers pass cleanly?',
            code: ['fn shout(s: &str) { println!("{s}!"); }', 'let owned = String::from("go");', 'shout("py"); shout(&owned);'],
            options: ['py! then go!', 'Compile Error on &owned', 'Owned error'],
            answer: 0,
            explanation: 'Deref coercion lets `&String` automatically coerce into `&str` cleanly.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 2 Boss: Borrow Whisperer',
        subtitle: 'Prove total mastery of move semantics, cloning & &mut borrows',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Fix function signature to update caller string safely.',
            codeLines: ['fn upgrade(name: {{0}} String) {', '    name.push_str("_pro");', '}', 'let mut u = String::from("dev");', 'upgrade({{1}} u);'],
            expectedTokens: ['&mut', '&mut'],
            distractors: ['&', '*', 'mut'],
            explanation: 'Explicit `&mut` grants safe in-place write access with zero copies.',
          },
          {
            type: 'find_bug',
            prompt: 'Eliminate the moved-value crash in the boss snippet.',
            lines: [
              'let item = String::from("gem");',
              'consume(item);',
              'println!("Kept: {item}");',
            ],
            bugLine: 1,
            fixed: 'inspect(&item);',
            explanation: 'Passing `item` by value moved it into `consume`; pass `&item` to keep ownership.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace non-lexical lifetimes (NLL) execution.',
            code: ['let mut score = 10;', 'let r = &score;', 'println!("{r}");', 'let w = &mut score;', '*w += 5;', 'println!("{score}");'],
            options: ['10 then 15', 'Borrow Checker Error', '15 then 15'],
            answer: 0,
            explanation: '`r` ends right after `println!("{r}")`, so `&mut score` is completely valid below!',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Functions, Control Flow & Match (5 nodes)
  // =========================================================================
  {
    title: 'Functions, Control Flow & Match',
    subtitle: 'Return values as tail expressions, loop over ranges, and match exhaustively.',
    conceptGraphicType: 'rust_control',
    guidebook: {
      summary:
        'Almost everything in Rust is an expression returning a value: `if` blocks evaluate to values directly, and the final line of a function WITHOUT a semicolon `;` becomes its return value! Combine that with exhaustive `match` pattern matching for rock-solid branching.',
      mentalModel:
        'A semicolon `;` at the end of a block line turns an **expression** (`42`) into a **statement** returning empty unit `()`. Drop the semicolon on the final line of `fn` or `if` to return that value!',
      keyTakeaways: [
        'Declare functions with `fn name(arg: Type) -> ReturnType { ... }` (explicit arrow `->`).',
        'Omit the trailing semicolon `;` on the tail line of a function to return it cleanly without typing `return`.',
        'Use `if cond { a } else { b }` directly in assignments — no `? :` ternary operator exists in Rust!',
        '`match` MUST handle every possible case exhaustively (`_` wildcard covers remaining cases).',
      ],
      keySyntax: [
        {
          title: 'Expression Functions & Tail Returns',
          tag: 'FUNCTIONS',
          code: 'fn double_xp(xp: i32) -> i32 {\n    xp * 2  // No semicolon = returned!\n}\nprintln!("{}", double_xp(35));',
          output: '70',
          explanation:
            'Because `xp * 2` has no trailing `;`, it returns directly as an `i32`. Early exits still use `return ...;`.',
          notes: [
            'Adding `;` turns `xp * 2;` into unit `()`, causing a type mismatch error!',
          ],
        },
        {
          title: 'if-as-Expression & Range Loops',
          tag: 'LOOPS',
          code: 'let tier = if 95 >= 90 { "S" } else { "A" };\nlet mut sum = 0;\nfor i in 1..=4 { sum += i; }\nprintln!("{tier} {sum}");',
          output: 'S 10',
          explanation:
            '`1..4` excludes `4` (`1, 2, 3`), while `1..=4` includes `4` (`1, 2, 3, 4`).',
          notes: [
            '`loop { ... break val; }` lets even infinite retry loops return a result cleanly!',
          ],
        },
        {
          title: 'Exhaustive Pattern Matching (`match`)',
          tag: 'MATCH',
          code: 'let code = 200;\nlet status = match code {\n    200 | 201 => "OK",\n    404 => "Not Found",\n    _ => "Other",\n};\nprintln!("{status}");',
          output: 'OK',
          explanation:
            '`match` checks arms top-to-bottom (`|` matches multiple patterns) and stops cleanly — zero fallthrough bugs.',
          notes: [
            'Match ranges work nicely too: `90..=100 => "S"`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Accidental Semicolon on Final Return Expression',
          buggyCode: 'fn square(n: i32) -> i32 {\n    n * n;  // Returns () instead of i32!\n}',
          fixedCode: 'fn square(n: i32) -> i32 {\n    n * n\n}',
          reason:
            'Trailing `;` suppresses the expression’s value into `()`. Drop `;` on implicit returns!',
        },
        {
          title: 'Non-Exhaustive match Missing Catch-All _',
          buggyCode: 'match xp {\n    0 => "Zero",\n    100 => "Max",\n} // Error: missing patterns!',
          fixedCode: 'match xp {\n    0 => "Zero",\n    100 => "Max",\n    _ => "Mid",\n}',
          reason:
            'Rust requires `match` to cover 100% of possible values — append `_ => ...` for unhandled integers/strings.',
        },
      ],
      proTip:
        'Need to exit a nested loop from inside an inner loop cleanly? Label the outer loop `\'outer: for ... { break \'outer; }`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Expression Functions',
        subtitle: 'Understand implicit tail returns without semicolons',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Statements vs Expressions',
            explanation:
              'Rust functions annotate return types with `-> Type`. Leave off `;` on the last line to evaluate and return that value automatically!',
            code: ['fn add(a: i32, b: i32) -> i32 {', '    a + b', '}'],
            output: 'Returns a + b cleanly',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the expression-based `boost` function.',
            codeLines: ['fn boost(xp: i32) {{0}} i32 {', '    xp {{1}} 2', '}'],
            expectedTokens: ['->', '*'],
            distractors: ['=>', ':', ';'],
            explanation: '`-> i32` declares the return type and tail `xp * 2` returns without `;`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the extra semicolon breaking the return value.',
            lines: [
              'fn next_level(lvl: i32) -> i32 {',
              '    lvl + 1;',
              '}',
            ],
            bugLine: 1,
            fixed: '    lvl + 1',
            explanation: '`lvl + 1;` evaluates to unit `()` instead of `i32`.',
          },
          {
            type: 'multiple_choice',
            question: 'How does Rust replace `cond ? a : b` ternary expressions?',
            options: [
              'if cond { a } else { b }',
              'switch cond -> a : b',
              'a when cond else b',
              'Rust keeps `? :`',
            ],
            answer: 0,
            explanation: 'In Rust, `if / else` itself is an expression returning a value.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Ranges & Loop Control',
        subtitle: 'Master 0..n vs 0..=n ranges, while, and value-returning loops',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Exclusive vs Inclusive Ranges',
            explanation:
              'Write `0..5` to iterate `0, 1, 2, 3, 4`, and `0..=5` when you want `5` included too! Reverse cleanly with `(1..=3).rev()`.',
            code: ['for n in 1..=3 {', '    println!("{n}");', '}'],
            output: '1\n2\n3',
          },
          {
            type: 'token_builder',
            prompt: 'Iterate inclusive 1 through 5 cleanly.',
            codeLines: ['let mut total = 0;', '{{0}} n in {{1}} {', '    total += n;', '}'],
            expectedTokens: ['for', '1..=5'],
            distractors: ['while', '1..5', 'range(1, 5)'],
            explanation: '`1..=5` yields `1..5` inclusive without an off-by-one bug.',
          },
          {
            type: 'predict_output',
            prompt: 'What value does `loop { break ...; }` produce?',
            code: ['let mut n = 1;', 'let res = loop {', '    n *= 2;', '    if n >= 8 { break n + 1; }', '};', 'println!("{res}");'],
            options: ['9', '8', '4'],
            answer: 0,
            explanation: '`n` hits `8` and `break n + 1` returns `9` directly out of `loop`!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Control & Match Checkpoint',
        subtitle: 'Zero-hints sprint on implicit returns, if-exprs & exhaustive match',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write an exhaustive `match` on status codes.',
            codeLines: ['let msg = {{0}} code {', '    200 => "OK",', '    {{1}} => "Err",', '};'],
            expectedTokens: ['match', '_'],
            distractors: ['switch', 'default', 'else'],
            explanation: '`match` uses `=>` arms and `_` as the exhaustive catch-all wildcard.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the mismatched branch types inside `if / else` expression.',
            lines: [
              'let ready = true;',
              'let code = if ready { 200 } else { "500" };',
            ],
            bugLine: 1,
            fixed: 'let code = if ready { 200 } else { 500 };',
            explanation: 'Both arms of an `if` expression must return the exact same type (`i32`).',
          },
          {
            type: 'predict_output',
            prompt: 'Trace range exclusivity cleanly.',
            code: ['let mut cnt = 0;', 'for _ in 0..4 { cnt += 1; }', 'println!("{cnt}");'],
            options: ['4', '5', '3'],
            answer: 0,
            explanation: '`0..4` iterates `0, 1, 2, 3` (`4` times).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Pattern Matching (`match`)',
        subtitle: 'Match ranges, multiple patterns (|), and destructured tuples cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Exhaustive Safety with match',
            explanation:
              'Unlike C/Java `switch`, Rust `match` checks every arm at compile time, never falls through unintentionally, and supports OR patterns (`1 | 2`) plus inclusive ranges (`90..=100`).',
            code: ['let grade = match xp {', '    90..=100 => "S",', '    _ => "B",', '};'],
          },
          {
            type: 'token_builder',
            prompt: 'Match either `200` or `201` on one line, then handle everything else.',
            codeLines: ['match status {', '    200 {{0}} 201 => "Success",', '    {{1}} => "Retry",', '}'],
            expectedTokens: ['|', '_'],
            distractors: ['||', 'default', 'or'],
            explanation: 'Inside `match` patterns, combine alternatives with single pipe `|`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing exhaustiveness arm.',
            lines: [
              'let tier = 2;',
              'let bonus = match tier {',
              '    1 => 10,',
              '    2 => 25,',
              '};',
            ],
            bugLine: 3,
            fixed: '    2 => 25,\n    _ => 5,',
            explanation: '`tier: i32` has billions of values; include `_ => ...` to cover remaining cases.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 3 Boss: Pattern Master',
        subtitle: 'Combine expression functions, inclusive ranges & exhaustive match',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write a clean `grade` helper returning a `&\'static str`.',
            codeLines: [
              'fn tier(xp: u32) -> &\'static str {',
              '    {{0}} xp {',
              '        100..=u32::MAX => "Pro",',
              '        {{1}} => "Dev",',
              '    }',
              '}',
            ],
            expectedTokens: ['match', '_'],
            distractors: ['switch', 'else', 'default'],
            explanation: 'Notice no `;` on `match` — its matched arm becomes the function return value!',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the accidental unit return inside `calc`.',
            lines: [
              'fn calc(a: i32, b: i32) -> i32 {',
              '    if a > b { a } else { b };',
              '}',
            ],
            bugLine: 1,
            fixed: '    if a > b { a } else { b }',
            explanation: 'Removing `;` lets the `if/else` expression return `i32` directly.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `match` print cleanly?',
            code: ['let pair = (true, 5);', 'let out = match pair {', '    (true, n) => n * 10,', '    _ => 0,', '};', 'println!("{out}");'],
            options: ['50', '5', '0'],
            answer: 0,
            explanation: '`(true, n)` binds `n = 5` and returns `50`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Structs, Enums & Traits (5 nodes)
  // =========================================================================
  {
    title: 'Structs, Enums & Traits',
    subtitle: 'Model data with structs & impl blocks, algebraic enums, and shared traits.',
    conceptGraphicType: 'rust_structs',
    guidebook: {
      summary:
        'Rust avoids classic class inheritance and instead pairs clean `struct` data models + `impl` behavior blocks with tagged `enum` variants (carrying per-variant data!) and `trait` polymorphism.',
      mentalModel:
        'A Rust `enum` is far richer than numeric constants: every variant (`Msg::Move { x, y }`, `Msg::Quit`) acts like a type-safe tagged union verified exhaustively by `match`.',
      keyTakeaways: [
        'Attach methods inside `impl MyStruct { fn read(&self) ... fn update(&mut self) ... }`.',
        'Methods borrowing `&self` read fields; methods mutating fields take `&mut self` (called with `.method()` cleanly!).',
        'Use `#[derive(Debug, Clone, PartialEq)]` above structs/enums to auto-generate printing and equality.',
        'Implement shared contracts via `impl TraitName for StructName { ... }` instead of deep inheritance trees.',
      ],
      keySyntax: [
        {
          title: 'Struct Blueprint & impl Methods',
          tag: 'STRUCTS',
          code: '#[derive(Debug)]\nstruct Player { xp: u32 }\nimpl Player {\n    fn new(xp: u32) -> Self { Self { xp } }\n    fn gain(&mut self, amt: u32) { self.xp += amt; }\n}\nlet mut p = Player::new(50);\np.gain(25);\nprintln!("{:?}", p);',
          output: 'Player { xp: 75 }',
          explanation:
            'Associated functions without `self` (like `Player::new`) call via `::`, while methods take `&self`/`&mut self` and call via `.`.',
          notes: [
            '`Self` inside `impl Player` is an alias for `Player`.',
          ],
        },
        {
          title: 'Rich Data Enums & Matching',
          tag: 'ENUMS',
          code: 'enum Event { Ping, Add(i32) }\nlet e = Event::Add(15);\nmatch e {\n    Event::Ping => println!("pong"),\n    Event::Add(n) => println!("+{n}"),\n}',
          output: '+15',
          explanation:
            'Enum variants hold customized payloads directly inside their variant definition.',
          notes: [
            'Combines state + associated payload cleanly with zero unused fields.',
          ],
        },
        {
          title: 'Shared Behavior via Traits',
          tag: 'TRAITS',
          code: 'trait Describe { fn tag(&self) -> &str; }\nstruct Hero;\nimpl Describe for Hero {\n    fn tag(&self) -> &str { "Hero" }\n}\nprintln!("{}", Hero.tag());',
          output: 'Hero',
          explanation:
            '`trait` defines method signatures that any struct or enum can implement cleanly via `impl Trait for Type`.',
          notes: [
            'Accept polymorphic arguments cleanly via `fn show(item: &impl Describe)`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Taking Ownership (`self`) in a Getter Method',
          buggyCode: 'impl Player {\n    fn get_xp(self) -> u32 { self.xp } // Drops Player after 1 call!\n}',
          fixedCode: 'impl Player {\n    fn get_xp(&self) -> u32 { self.xp }\n}',
          reason:
            'Bare `self` moves and consumes the struct on the very first call! Always write `&self` for reads or `&mut self` for edits.',
        },
        {
          title: 'Printing Structs Without #[derive(Debug)]',
          buggyCode: 'struct Pos { x: i32 }\nprintln!("{:?}", Pos { x: 1 }); // Missing Debug trait!',
          fixedCode: '#[derive(Debug)]\nstruct Pos { x: i32 }',
          reason:
            'Add `#[derive(Debug)]` so Rust implements formatting automatically.',
        },
      ],
      proTip:
        'Implement `Display` (`std::fmt::Display`) or `#[derive(Debug, Clone, PartialEq)]` early on domain models — it makes unit tests (`assert_eq!`) and logs seamless.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Structs & impl Blocks',
        subtitle: 'Construct structs cleanly and attach &self / &mut self methods',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Data + Methods with struct & impl',
            explanation:
              'Define named fields in `struct Hero { hp: i32 }` and place methods in `impl Hero`. Read via `&self` or mutate via `&mut self`.',
            code: ['struct Hero { hp: i32 }', 'impl Hero {', '    fn heal(&mut self, amt: i32) { self.hp += amt; }', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Attach a mutating method `bump` onto `Streak`.',
            codeLines: ['struct Streak { days: u32 }', '{{0}} Streak {', '    fn bump({{1}} self) { self.days += 1; }', '}'],
            expectedTokens: ['impl', '&mut'],
            distractors: ['class', '&', 'mut'],
            explanation: '`impl` opens the behavior block; `&mut self` allows mutating `self.days`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the method that accidentally consumes the struct on read.',
            lines: [
              'struct Score(i32);',
              'impl Score {',
              '    fn val(self) -> i32 { self.0 }',
              '}',
            ],
            bugLine: 2,
            fixed: '    fn val(&self) -> i32 { self.0 }',
            explanation: 'Using bare `self` drops `Score` on the first `.val()` call; borrow `&self`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does calling `Hero::new(80)` followed by `.heal(20)` print?',
            code: ['let mut h = Hero::new(80);', 'h.heal(20);', 'println!("{}", h.hp);'],
            options: ['100', '80', '20'],
            answer: 0,
            explanation: 'Associated constructor builds `Hero { hp: 80 }`; `heal` mutates it to `100`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Rich Enums & Variants',
        subtitle: 'Model algebraic state machines cleanly with data enums',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Variants That Carry Data',
            explanation:
              'Rust enums let each variant store its own typed fields (`Msg::Write(String)` or `Msg::Move { x: i32, y: i32 }`), unwrapped safely via `match`.',
            code: ['enum Action { Quit, Bonus(u32) }', 'let act = Action::Bonus(50);'],
            output: 'Bonus(50)',
          },
          {
            type: 'token_builder',
            prompt: 'Construct an enum variant and unpack its payload.',
            codeLines: ['let a = Action::Bonus(25);', 'match a {', '    Action::Quit => println!("bye"),', '    {{0}}(pts) {{1}} println!("+{pts}"),', '}'],
            expectedTokens: ['Action::Bonus', '=>'],
            distractors: ['Bonus', ':', '->'],
            explanation: 'Namespace variants with `Enum::Variant` and bind inner fields inside `match`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why are Rust enums preferred over multiple optional struct fields (`err: Option<E>, data: Option<T>`)?',
            options: [
              'Compiler guarantees only ONE valid state exists — impossible states cannot be constructed',
              'Enums skip stack allocation completely',
              'Enums automatically serialize to SQL',
              'Enums ignore borrow checker rules',
            ],
            answer: 0,
            explanation: 'Making invalid combinations unrepresentable eliminates an entire class of bugs.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Structs & Enums Checkpoint',
        subtitle: 'Zero-hints sprint on derive, receivers, and variant payloads',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Auto-derive debug printing on `Point`.',
            codeLines: ['#[derive({{0}})]', 'struct Point { x: i32, {{1}}: i32 }'],
            expectedTokens: ['Debug', 'y'],
            distractors: ['Print', 'i32', 'Display'],
            explanation: '`#[derive(Debug)]` unlocks `{:?}` formatting across all fields.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `println!("{:?}", b)` fails compilation.',
            lines: [
              'struct Badge { lvl: u8 }',
              'fn main() {',
              '    let b = Badge { lvl: 3 };',
              '    println!("{:?}", b);',
              '}',
            ],
            bugLine: 0,
            fixed: '#[derive(Debug)]\nstruct Badge { lvl: u8 }',
            explanation: 'Structs must explicitly derive or implement `Debug` for `{:?}` printing.',
          },
          {
            type: 'predict_output',
            prompt: 'What does matching an enum payload print?',
            code: ['enum Coin { Penny, Note(i32) }', 'let c = Coin::Note(20);', 'let val = match c { Coin::Penny => 1, Coin::Note(v) => v };', 'println!("{val}");'],
            options: ['20', '1', 'Compile Error'],
            answer: 0,
            explanation: '`Coin::Note(20)` matches the second arm, binding `v = 20`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Traits & Shared Contracts',
        subtitle: 'Write generic interfaces with trait and impl Trait for Type',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Polymorphism Without Inheritance',
            explanation:
              'A `trait` declares shared method behavior (`trait Summary { fn summary(&self) -> String; }`). Any type implements it via `impl Summary for Article`.',
            code: ['trait Name { fn label(&self) -> &str; }', 'impl Name for Bot { fn label(&self) -> &str { "Bot" } }'],
          },
          {
            type: 'token_builder',
            prompt: 'Implement `Scorable` cleanly for `Quiz`.',
            codeLines: ['trait Scorable { fn pts(&self) -> u32; }', 'struct Quiz;', '{{0}} Scorable {{1}} Quiz {', '    fn pts(&self) -> u32 { 25 }', '}'],
            expectedTokens: ['impl', 'for'],
            distractors: ['implements', 'on', 'class'],
            explanation: 'Rust writes `impl Trait for Struct` cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the trait implementation parameter mismatch.',
            lines: [
              'trait Greet { fn hi(&self); }',
              'struct Dev;',
              'impl Greet for Dev {',
              '    fn hi() { println!("hi"); }',
              '}',
            ],
            bugLine: 3,
            fixed: '    fn hi(&self) { println!("hi"); }',
            explanation: 'Method signature inside `impl Greet for Dev` must include `&self` cleanly.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 4 Boss: Rust Modeler',
        subtitle: 'Architect structs, derive macros, traits, and pattern matching',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Accept any `Describe` trait implementor polymorphically.',
            codeLines: ['fn log_item(item: &{{0}} Describe) {', '    println!("{}", item.describe());', '}'],
            expectedTokens: ['impl'],
            distractors: ['dyn Trait', 'struct', 'for'],
            explanation: '`&impl Describe` generates fast monomorphized static dispatch.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the associated vs method receiver call.',
            lines: [
              'struct Counter(u32);',
              'impl Counter { fn next(&mut self) { self.0 += 1; } }',
              'let mut c = Counter(0);',
              'c::next();',
            ],
            bugLine: 3,
            fixed: 'c.next();',
            explanation: 'Instance methods on values (`&mut self`) use `.` (`c.next()`), while associated functions use `Counter::new()`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace trait dispatch on struct.',
            code: ['trait Bonus { fn calc(&self) -> i32 { 10 } }', 'struct VIP;', 'impl Bonus for VIP {}', 'println!("{}", VIP.calc());'],
            options: ['10', '0', 'Compile Error'],
            answer: 0,
            explanation: 'Traits can provide default implementations that types inherit automatically.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Option, Result & Error Handling (5 nodes)
  // =========================================================================
  {
    title: 'Option, Result & Error Handling',
    subtitle: 'Eliminate null crashes using Option<T>, Result<T, E>, and the ? operator.',
    conceptGraphicType: 'rust_errors',
    guidebook: {
      summary:
        'Rust has NO `null` value! Optional absence is encoded in `Option<T>` (`Some(val)` or `None`), and recoverable failures live in `Result<T, E>` (`Ok(val)` or `Err(err)`). Propagate errors cleanly across calls with the `?` operator.',
      mentalModel:
        'Because `Option<T>` and `T` are completely distinct types, the compiler FORCES you to unwrap `Some` or provide a fallback before touching the inner value — making null-pointer crashes practically impossible.',
      keyTakeaways: [
        'Handle missing values cleanly with `.unwrap_or(fallback)` or `if let Some(v) = opt { ... }`.',
        'Avoid `.unwrap()` in production code — calling it on `None` or `Err` panics and crashes the thread!',
        'Use `?` inside functions returning `Result` or `Option` to unwrap `Ok`/`Some` OR return `Err`/`None` immediately.',
        'Reserve `panic!` strictly for unrecoverable bugs/violated invariants, never expected bad user input.',
      ],
      keySyntax: [
        {
          title: 'Null-Free Option<T> Handling',
          tag: 'OPTION',
          code: 'let maybe: Option<i32> = None;\nlet val = maybe.unwrap_or(10);\nif let Some(x) = Some(42) {\n    println!("{val} / {x}");\n}',
          output: '10 / 42',
          explanation:
            '`.unwrap_or(10)` supplies a clean default while `if let Some(x)` cleanly runs a single-pattern unwrap.',
          notes: [
            'Transform inner values cleanly without unwrapping: `opt.map(|x| x * 2)`.',
          ],
        },
        {
          title: 'Recoverable Result<T, E> Checks',
          tag: 'RESULT',
          code: 'let parsed: Result<i32, _> = "99".parse();\nmatch parsed {\n    Ok(n) => println!("Parsed {n}"),\n    Err(e) => println!("Invalid: {e}"),\n}',
          output: 'Parsed 99',
          explanation:
            'Standard parsing and I/O functions return `Result<T, E>`, forcing callers to inspect `Ok` vs `Err`.',
          notes: [
            'In quick prototypes, `.expect("config file missing")` beats bare `.unwrap()` by adding context if it fails.',
          ],
        },
        {
          title: 'Clean Propagation via `?` Operator',
          tag: 'PROPAGATE',
          code: 'fn parse_double(s: &str) -> Result<i32, std::num::ParseIntError> {\n    let n: i32 = s.parse()?;\n    Ok(n * 2)\n}',
          output: 'parse_double("21") == Ok(42)',
          explanation:
            '`?` unwraps `Ok(n)` cleanly OR returns `Err(e)` early from the enclosing function in one character!',
          notes: [
            '`?` works inside functions returning either `Result` or `Option` cleanly.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Blind .unwrap() on User Input',
          buggyCode: 'let n: i32 = user_text.parse().unwrap(); // Panics on "abc"!',
          fixedCode: 'let n: i32 = user_text.parse().unwrap_or(0);',
          reason:
            'Unchecked `.unwrap()` aborts your app whenever `Err` occurs; use `unwrap_or`, `match`, or `?`.',
        },
        {
          title: 'Using ? Inside a Non-Result Function',
          buggyCode: 'fn read_num(s: &str) -> i32 {\n    s.parse()? // Compile error: returns i32, not Result!\n}',
          fixedCode: 'fn read_num(s: &str) -> Result<i32, std::num::ParseIntError> {\n    Ok(s.parse()?)\n}',
          reason:
            'The `?` operator needs a compatible `Result` or `Option` return type on its enclosing function.',
        },
      ],
      proTip:
        'Convert between `Option<T>` and `Result<T, E>` seamlessly using `.ok_or("missing value")` or `.ok()`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Option<T> (No Nulls!)',
        subtitle: 'Safely unwrap optional values with Some, None, and unwrap_or',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Making Absence Explicit',
            explanation:
              'Rust eliminates null-pointer bugs using `enum Option<T> { Some(T), None }`. Unwrap safely via `match`, `if let Some(x)`, or `.unwrap_or(default)`.',
            code: ['let maybe_xp: Option<u32> = None;', 'let xp = maybe_xp.unwrap_or(0);'],
            output: '0',
          },
          {
            type: 'token_builder',
            prompt: 'Unwrap an `Option` safely using a fallback of `100`.',
            codeLines: ['let cap: Option<i32> = Some(75);', 'let val = cap.{{0}}(100);', 'if let {{1}}(x) = cap { println!("{x}"); }'],
            expectedTokens: ['unwrap_or', 'Some'],
            distractors: ['orElse', 'Ok', 'unwrap'],
            explanation: '`unwrap_or(100)` extracts safely; `if let Some(x)` destructures `Some`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the panic waiting to happen on an optional array tail.',
            lines: [
              'let scores: Vec<i32> = vec![];',
              'let last = scores.last().unwrap();',
              'println!("{last}");',
            ],
            bugLine: 1,
            fixed: 'let last = *scores.last().unwrap_or(&0);',
            explanation: 'Calling `.unwrap()` on an empty vector’s `last()` (`None`) panics!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Result<T, E> & ? Operator',
        subtitle: 'Handle recoverable errors and propagate failures concisely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Typed Errors & One-Char `?` Propagation',
            explanation:
              'Operations that can fail return `Result<T, E>` (`Ok(v)` or `Err(e)`). Inside functions returning `Result`, suffixing `?` forwards errors cleanly to the caller.',
            code: ['fn half_str(s: &str) -> Result<i32, std::num::ParseIntError> {', '    let n: i32 = s.parse()?;', '    Ok(n / 2)', '}'],
          },
          {
            type: 'token_builder',
            prompt: 'Return success wrapped in `Ok` after forwarding parse failure via `?`.',
            codeLines: ['fn parse_xp(s: &str) -> Result<i32, std::num::ParseIntError> {', '    let n: i32 = s.parse(){{0}};', '    {{1}}(n + 10)', '}'],
            expectedTokens: ['?', 'Ok'],
            distractors: ['!', 'Some', 'return'],
            explanation: '`?` unwraps or returns `Err` cleanly; wrap the final value in `Ok(...)`.',
          },
          {
            type: 'multiple_choice',
            question: 'What happens when `s.parse()?` encounters an `Err(e)`?',
            options: [
              'The enclosing function immediately returns `Err(e)`',
              'Rust ignores the error and continues',
              'The program panics cleanly',
              'It retries once automatically',
            ],
            answer: 0,
            explanation: '`?` performs clean early error return up to the caller.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Error Handling Checkpoint',
        subtitle: 'Zero-hints sprint on Option, Result, and ? ergonomics',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Convert `Option` failure directly into a descriptive `Result`.',
            codeLines: ['let item = list.first().{{0}}("list empty"){{1}};'],
            expectedTokens: ['ok_or', '?'],
            distractors: ['unwrap', '!', 'or_else'],
            explanation: '`.ok_or(err)` converts `Option<T>` cleanly into `Result<T, E>` for `?`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why `?` fails to compile inside `main() -> ()`.',
            lines: [
              'fn parse_port(s: &str) -> i32 {',
              '    s.parse().unwrap_or(80)',
              '}',
              'fn bad(s: &str) -> i32 { s.parse()? }',
            ],
            bugLine: 3,
            fixed: 'fn bad(s: &str) -> Result<i32, std::num::ParseIntError> { Ok(s.parse()?) }',
            explanation: '`?` requires the function return type to be `Result` or `Option`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace `Option::map` + `unwrap_or`.',
            code: ['let x = Some(15).map(|n| n * 2).unwrap_or(0);', 'println!("{x}");'],
            options: ['30', '15', '0'],
            answer: 0,
            explanation: '`Some(15)` maps to `Some(30)` and unwraps cleanly to `30`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Combinators (.map, .and_then)',
        subtitle: 'Transform optional & result values cleanly without nested matches',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Functional Combinators',
            explanation:
              'Chain `.map(...)`, `.and_then(...)`, and `.unwrap_or_else(...)` directly on `Option` and `Result` instead of stacking verbose `match` blocks.',
            code: ['let len = Some("rust").map(|s| s.len()).unwrap_or(0);'],
            output: '4',
          },
          {
            type: 'token_builder',
            prompt: 'Transform an optional score only when `Some` exists.',
            codeLines: ['let doubled = maybe_xp.{{0}}(|x| x * 2).{{1}}(0);'],
            expectedTokens: ['map', 'unwrap_or'],
            distractors: ['filter', 'getOr', 'unwrap'],
            explanation: '`.map` skips transformation if `None`; `.unwrap_or(0)` safely unpacks.',
          },
          {
            type: 'predict_output',
            prompt: 'What does mapping over `None` evaluate to?',
            code: ['let val: Option<i32> = None;', 'println!("{}", val.map(|n| n + 10).unwrap_or(5));'],
            options: ['5', '15', '10'],
            answer: 0,
            explanation: '`.map()` short-circuits cleanly on `None`, falling through to `.unwrap_or(5)`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 5 Boss: Zero-Panic Guard',
        subtitle: 'Combine Option, Result, ? propagation, and safe fallbacks',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Parse and multiply safely returning clean `Result`.',
            codeLines: [
              'fn parse_triple(s: &str) -> Result<i32, std::num::ParseIntError> {',
              '    let v: i32 = s.trim().parse(){{0}};',
              '    {{1}}(v * 3)',
              '}',
            ],
            expectedTokens: ['?', 'Ok'],
            distractors: ['unwrap', 'Some', 'return'],
            explanation: '`.trim()` removes whitespace cleanly before `parse()?` and `Ok(v * 3)`.',
          },
          {
            type: 'find_bug',
            prompt: 'Replace dangerous panic-prone unwrap cleanly.',
            lines: [
              'let raw = "not_a_number";',
              'let port: i32 = raw.parse().unwrap();',
              'println!("{port}");',
            ],
            bugLine: 1,
            fixed: 'let port: i32 = raw.parse().unwrap_or(8080);',
            explanation: '`.unwrap()` crashes on malformed `"not_a_number"`; supply safe default `8080`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace final safe error fallback.',
            code: ['let r: Result<i32, &str> = Err("timeout");', 'println!("{}", r.unwrap_or(-1));'],
            options: ['-1', 'timeout', 'Panic'],
            answer: 0,
            explanation: '`.unwrap_or(-1)` catches `Err` cleanly and yields `-1`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 6: Vectors, Slices & Iterators (5 nodes)
  // =========================================================================
  {
    title: 'Vectors, Slices & Iterators',
    subtitle: 'Manage heap Vec<T>, String vs &str, and zero-cost .iter().filter().collect() chains.',
    conceptGraphicType: 'rust_collections',
    guidebook: {
      summary:
        'Dynamic collections in Rust center on `Vec<T>` (`vec![1, 2, 3]`) and `HashMap<K, V>`, traversed through lazy, zero-cost iterators: `.iter()` (borrowing `&T`) or `.into_iter()` (moving `T`), terminated cleanly with `.collect()`.',
      mentalModel:
        'Iterators in Rust compile into tight assembly loops equal to hand-written C loops — chaining `.iter().filter(...).map(...).sum()` allocates ZERO intermediate heap vectors!',
      keyTakeaways: [
        'Use `.get(index)` on `Vec<T>` when indices come from input — it returns `Option<&T>` instead of panicking!',
        'Remember `.iter()` yields `&T` (keeps vector alive), whereas `.into_iter()` consumes ownership of the `Vec`.',
        'Iterators are completely lazy until consumed by `.collect()`, `.sum()`, `.count()`, or `.for_each()`.',
        'Prefer `String` when owning/building text, and `&str` when borrowing read-only text slices.',
      ],
      keySyntax: [
        {
          title: 'Dynamic Vectors & Safe `.get()`',
          tag: 'VECTORS',
          code: 'let mut v = vec![10, 20];\nv.push(30);\nlet safe = v.get(5).copied().unwrap_or(0);\nprintln!("len={} tail={} safe={}", v.len(), v[2], safe);',
          output: 'len=3 tail=30 safe=0',
          explanation:
            '`vec![...]` macro initializes a heap vector cleanly while `.get(5)` returns `None` instead of panicking.',
          notes: [
            'Notice `.copied()` converts `Option<&i32>` neatly to `Option<i32>`.',
          ],
        },
        {
          title: 'Zero-Cost Lazy Iterator Pipeline',
          tag: 'ITERATORS',
          code: 'let nums = vec![1, 2, 3, 4];\nlet evens: Vec<i32> = nums.iter()\n    .filter(|&&n| n % 2 == 0)\n    .map(|&n| n * 10)\n    .collect();\nprintln!("{:?}", evens);',
          output: '[20, 40]',
          explanation:
            '`.iter()` borrows elements read-only so `nums` remains usable; `.collect()` materializes into the annotated `Vec<i32>`.',
          notes: [
            'Rust’s "turbofish" `.collect::<Vec<i32>>()` lets you omit the left-side type annotation!',
          ],
        },
        {
          title: 'Mutating Map Entry Cleanly',
          tag: 'HASHMAP',
          code: 'use std::collections::HashMap;\nlet mut xp = HashMap::new();\nxp.entry("rust").and_modify(|v| *v += 50).or_insert(50);\nprintln!("{:?}", xp.get("rust"));',
          output: 'Some(50)',
          explanation:
            'Rust’s `.entry(k).or_insert(val)` API inserts if missing and returns a `&mut` handle cleanly in one hash lookup!',
          notes: [
            'Classic frequency word counter: `*counts.entry(word).or_insert(0) += 1;`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Moving `Vec` via `.into_iter()` Then Using It After',
          buggyCode: 'let v = vec![1, 2];\nlet sum: i32 = v.into_iter().sum();\nprintln!("{:?}", v); // Compile error: v moved!',
          fixedCode: 'let v = vec![1, 2];\nlet sum: i32 = v.iter().sum();\nprintln!("{:?} sum={}", v, sum);',
          reason:
            '`into_iter()` consumes `v`; call `.iter()` to borrow elements so `v` stays accessible afterward.',
        },
        {
          title: 'Omitting Target Type for `.collect()`',
          buggyCode: 'let res = nums.iter().collect(); // Compiler cannot infer container type!',
          fixedCode: 'let res: Vec<_> = nums.iter().collect();',
          reason:
            '`.collect()` can build a `Vec`, `HashSet`, or `String` — specify `Vec<_>` or `::<Vec<_>>()` on one side.',
        },
      ],
      proTip:
        'Increment counters in `HashMap` idiomatically with `*map.entry(key).or_insert(0) += 1;` — one lookup, zero `contains_key` boilerplate.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Vec<T> & Safe Indexing',
        subtitle: 'Allocate heap vectors with vec! and guard bounds via .get()',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Dynamic Vectors in Rust',
            explanation:
              'Create resizable vectors using `vec![10, 20]` or `Vec::new()`. Append via `.push()` and read untrusted indices safely via `.get(idx)` returning `Option<&T>`.',
            code: ['let mut nums = vec![10, 20];', 'nums.push(30);', 'let ok = nums.get(1);  // Some(&20)'],
            output: 'Some(20)',
          },
          {
            type: 'token_builder',
            prompt: 'Initialize a mutable vector and safely guard an out-of-range read.',
            codeLines: ['let mut list = {{0}}[5, 10];', 'list.push(15);', 'let val = list.{{1}}(9).copied().unwrap_or(0);'],
            expectedTokens: ['vec!', 'get'],
            distractors: ['Vec', 'at', 'fetch'],
            explanation: '`vec![...]` constructs the vector and `.get(9)` safely returns `None` instead of crashing.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the vector out-of-bounds panic trap.',
            lines: [
              'let items = vec!["py", "go"];',
              'let third = items[2];',
              'println!("{third}");',
            ],
            bugLine: 1,
            fixed: 'let third = *items.get(2).unwrap_or(&"none");',
            explanation: 'Direct `items[2]` panics cleanly at index `2` on a 2-element vector.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Zero-Cost Iterators',
        subtitle: 'Chain .iter(), .filter(), .map(), and .collect() lazily',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Cost Iterator Adapters',
            explanation:
              'Calling `.iter()` borrows elements without moving ownership. Chain `.filter()` and `.map()`, then materialize cleanly with `.collect::<Vec<_>>()` or `.sum()`.',
            code: ['let total: i32 = vec![2, 4, 6].iter().map(|n| n * 2).sum();'],
            output: '24',
          },
          {
            type: 'token_builder',
            prompt: 'Filter positives without moving `raw` and materialize into `Vec<i32>`.',
            codeLines: ['let out: Vec<i32> = raw.{{0}}()', '    .filter(|&&n| n > 0)', '    .copied()', '    .{{1}}();'],
            expectedTokens: ['iter', 'collect'],
            distractors: ['into_iter', 'to_vec', 'done'],
            explanation: '`.iter()` borrows cleanly; `.collect()` constructs the resulting `Vec`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the iterator type inference failure on `.collect()`.',
            lines: [
              'let nums = vec![1, 2, 3];',
              'let doubled = nums.iter().map(|n| n * 2).collect();',
            ],
            bugLine: 1,
            fixed: 'let doubled: Vec<i32> = nums.iter().map(|n| n * 2).collect();',
            explanation: 'Specify target container type (`Vec<i32>`) so `.collect()` knows what to construct.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Iterators Checkpoint',
        subtitle: 'Zero-hints sprint on iter vs into_iter, slices & collect',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Count matches lazily without allocating a temporary `Vec`.',
            codeLines: ['let hits = logs.{{0}}()', '    .filter(|s| s.starts_with("ERR"))', '    .{{1}}();'],
            expectedTokens: ['iter', 'count'],
            distractors: ['stream', 'len', 'collect'],
            explanation: '`.count()` consumes the iterator directly in O(1) extra memory.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why `scores` cannot be printed after summing.',
            lines: [
              'let scores = vec![10, 20, 30];',
              'let total: i32 = scores.into_iter().sum();',
              'println!("{:?} -> {total}", scores);',
            ],
            bugLine: 1,
            fixed: 'let total: i32 = scores.iter().sum();',
            explanation: '`into_iter()` moved ownership of `scores`; switch to `.iter()`.',
          },
          {
            type: 'predict_output',
            prompt: 'Trace zero-cost `.iter().filter().map().sum()`.',
            code: ['let nums = vec![1, 2, 3, 4];', 'let s: i32 = nums.iter().filter(|&&n| n % 2 == 1).map(|&n| n * 10).sum();', 'println!("{s}");'],
            options: ['40', '100', '20'],
            answer: 0,
            explanation: 'Odd numbers `1, 3` map to `10, 30`; `sum()` returns `40`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'String vs &str & HashMap',
        subtitle: 'Master heap text vs slices and HashMap .entry() updates',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Clean Counters with .entry()',
            explanation:
              'Avoid checking `if map.contains_key(...)` separately — call `*map.entry(k).or_insert(0) += 1;` to initialize and update in one pass!',
            code: ['let mut map = HashMap::new();', '*map.entry("rs").or_insert(0) += 25;'],
          },
          {
            type: 'token_builder',
            prompt: 'Increment a map counter cleanly using `.entry()`.',
            codeLines: ['*xp.{{0}}("rust").{{1}}(0) += 10;'],
            expectedTokens: ['entry', 'or_insert'],
            distractors: ['get', 'unwrap_or', 'insert'],
            explanation: '`.entry(k).or_insert(0)` yields `&mut i32` cleanly whether key existed or not.',
          },
          {
            type: 'multiple_choice',
            question: 'Why do idiomatic Rust functions accept `s: &str` instead of `s: &String`?',
            options: [
              '`&str` accepts BOTH string literals (`"abc"`) and `&String` via deref coercion',
              '`&str` allows mutating the string in place',
              '`&String` is deprecated in Rust',
              '`&str` executes asynchronously',
            ],
            answer: 0,
            explanation: '`&str` is strictly more flexible for callers with zero performance cost.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Unit 6 Boss: Zero-Cost Master',
        subtitle: 'Synthesize Vec, HashMap entries, Option safety, and iterators',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build a complete filter-map-sum chain over `players`.',
            codeLines: [
              'let bonus: i32 = xp_list.{{0}}()',
              '    .filter(|&&v| v >= 50)',
              '    .map(|&v| v + 10)',
              '    .{{1}}();',
            ],
            expectedTokens: ['iter', 'sum'],
            distractors: ['into_iter', 'collect', 'count'],
            explanation: 'Lazy iterator fuses filter + map + sum with zero heap allocations!',
          },
          {
            type: 'find_bug',
            prompt: 'Eliminate the type error reading `HashMap.get`.',
            lines: [
              'let mut m = HashMap::new();',
              'm.insert("py", 100);',
              'let v: i32 = m.get("py").unwrap_or(0);',
            ],
            bugLine: 2,
            fixed: 'let v: i32 = *m.get("py").unwrap_or(&0);',
            explanation: '`HashMap::get` returns `Option<&V>`, so fallback & unwrap match `&0` cleanly.',
          },
          {
            type: 'predict_output',
            prompt: 'What gets printed by `.entry().or_insert()`?',
            code: ['let mut counts = HashMap::new();', '*counts.entry("c").or_insert(10) += 5;', '*counts.entry("c").or_insert(10) += 5;', 'println!("{}", counts["c"]);'],
            options: ['20', '15', '10'],
            answer: 0,
            explanation: 'First call initializes to `10` and adds `5` (`15`); second finds `15` (ignores `or_insert`) and adds `5` -> `20`!',
          },
        ],
      },
    ],
  },
];
