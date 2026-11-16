import type { UnitSeed } from './types';

export const TS_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Static Types & Inference (6 nodes)
  // =========================================================================
  {
    title: 'Static Types & Inference',
    subtitle: 'Annotate variables, functions, and tuples safely while leaning on TS inference.',
    conceptGraphicType: 'ts_types',
    guidebook: {
      summary:
        'TypeScript adds a **compile-time static type checker** directly on top of JavaScript, catching typos, `undefined` crashes, and mismatched arguments before your code ever runs—then erasing every `: type` annotation cleanly into plain JS.',
      mentalModel:
        'Think of TypeScript as zero-runtime scaffolding: annotations constrain what values flow into a function at build time, while `tsc` emits crisp, un-annotated JavaScript for browsers or Node.',
      keyTakeaways: [
        'Let TypeScript **infer** obvious literals (`const score = 100;` already narrows or infers `number`), and add explicit annotations (`: string`) on parameters and boundaries.',
        'Always write lowercase `string`, `number`, and `boolean`—never capitalized `String` or `Number` object wrappers.',
        'Avoid escaping to `any` (which turns off the type checker entirely); prefer `unknown` when input shapes aren’t verified yet.',
        'Type array collections as `number[]` or `Array<string>`, and fixed-length tuples as `[string, number]`.',
      ],
      keySyntax: [
        {
          title: 'Typed Variables & Strict Functions',
          tag: 'SIGNATURES',
          code: 'function formatXp(user: string, xp: number): string {\n  return `${user}: ${xp} XP`;\n}\nconst badge = formatXp("Ada", 120);',
          output: '"Ada: 120 XP"',
          explanation:
            'Parameter annotations check callers at compile time, while `: string` ensures every `return` branch produces text.',
          notes: [
            'Void functions returning nothing use `: void`.',
          ],
        },
        {
          title: 'Arrays, Tuples & readonly',
          tag: 'COLLECTIONS',
          code: 'const ids: readonly number[] = [10, 20];\nconst pair: [string, number] = ["Rust", 1];',
          output: 'Compiler blocks `ids.push(30)` & enforces `[str, num]` order',
          explanation:
            '`readonly number[]` forbids mutating methods like `.push()` cleanly; tuples enforce exact slot positions.',
          notes: [
            'Use `as const` on literal arrays (`const dirs = ["N", "S"] as const`) to freeze exact literal types.',
          ],
        },
        {
          title: 'Safe unknown vs Dangerous any',
          tag: 'TYPE SAFETY',
          code: 'function safeUpper(raw: unknown): string {\n  if (typeof raw === "string") return raw.toUpperCase();\n  return "";\n}',
          output: '"HI" when given "hi", "" otherwise',
          explanation:
            '`unknown` forces you to check `typeof raw === "string"` before reading `.toUpperCase()`, whereas `any` blindly lets crashes slip through.',
          notes: [
            'Enable `"strict": true` in `tsconfig.json` for full `strictNullChecks` protection.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using any Instead of unknown for External Input',
          buggyCode: 'function parse(data: any) { return data.name.trim(); }',
          fixedCode: 'function parse(data: unknown): string { ... }',
          reason:
            '`any` silently disables all TypeScript checks across every property chain it touches.',
        },
        {
          title: 'Using Capitalized JS Wrapper Types',
          buggyCode: 'let title: String = "Guide";',
          fixedCode: 'let title: string = "Guide";',
          reason:
            '`String` refers to boxed wrapper objects, incompatible with plain primitive `string` APIs.',
        },
      ],
      proTip:
        'Enable `strictNullChecks` (`"strict": true`): forcing `null` and `undefined` out of `string`/`number` types eliminates the #1 source of JavaScript runtime exceptions.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Primitives & Annotations',
        subtitle: 'Add string, number, and boolean types cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Cost Compile Checks',
            explanation:
              'TypeScript attaches `: type` hints after variable or parameter names using lowercase primitives: `string`, `number`, and `boolean`.',
            code: ['const handle: string = "yuna_ts";', 'let streak: number = 14;', 'const active: boolean = true;'],
            highlightNote: '`tsc` strips every `: type` before execution—zero runtime overhead.',
          },
          {
            type: 'token_builder',
            prompt: 'Annotate `xp` as numeric and the return type as text.',
            codeLines: ['function rank(xp: {{0}}): {{1}} {', '  return xp > 500 ? "Pro" : "Rookie";', '}'],
            expectedTokens: ['number', 'string'],
            distractors: ['int', 'String', 'str'],
            explanation: 'TS uses lowercase `number` and `string` primitive annotations.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the invalid primitive casing bug.',
            lines: [
              'const level: number = 5;',
              'const badge: String = "Gold";',
            ],
            bugLine: 1,
            fixed: 'const badge: string = "Gold";',
            explanation: 'Always use lowercase `string`, not wrapper class `String`.',
          },
          {
            type: 'multiple_choice',
            question: 'What happens to TypeScript type annotations after compilation into JS?',
            options: [
              'They are erased cleanly from output JS',
              'They stay attached as runtime classes',
              'They double bundle size',
              'They convert arrays to tuples',
            ],
            answer: 0,
            explanation: 'Types exist solely at compile time and emit clean JS.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Inference & Void',
        subtitle: 'Trust inferred types and type parameter/return contracts',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Smart Type Inference',
            explanation:
              'You don’t need `: number` on every local variable—`const xp = 42;` already infers `number`. Reserve explicit annotations for function inputs, outputs (`void`), and empty arrays.',
            code: ['const items: string[] = [];', 'function log(msg: string): void {', '  console.log(msg);', '}'],
            highlightNote: 'An empty `const items = [];` without `: string[]` defaults to `any[]`!',
          },
          {
            type: 'token_builder',
            prompt: 'Type an empty array of `number`s and a helper returning nothing.',
            codeLines: ['const scores: {{0}} = [];', 'function ping(id: number): {{1}} {', '  scores.push(id);', '}'],
            expectedTokens: ['number[]', 'void'],
            distractors: ['int[]', 'null', 'undefined'],
            explanation: '`number[]` avoids `any[]`, while `: void` marks no return value.',
          },
          {
            type: 'predict_output',
            prompt: 'What type does TypeScript infer for `let tag = "sql";`?',
            code: ['let tag = "sql";'],
            options: ['any', 'string', 'literal "sql"'],
            answer: 1,
            explanation: 'Mutable `let` widens literal `"sql"` cleanly to `string`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the function returning a number when marked void.',
            lines: [
              'function add(a: number, b: number): void {',
              '  return a + b;',
              '}',
            ],
            bugLine: 0,
            fixed: 'function add(a: number, b: number): number {',
            explanation: 'Returning `a + b` requires return type `: number`, not `: void`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Tuples & unknown',
        subtitle: 'Lock fixed slots cleanly and ban unchecked any',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Tuples vs unknown Safety',
            explanation:
              'Tuples (`[string, number]`) fix exact length and element types per position. Use `unknown` over `any` whenever a value’s runtime type must be checked first.',
            code: ['const row: [string, number] = ["C#", 26];', 'function check(v: unknown) {', '  if (typeof v === "string") return v.length;', '}'],
            highlightNote: 'Tuple indices know exact types: `row[0]` is `string`, `row[1]` is `number`.',
          },
          {
            type: 'token_builder',
            prompt: 'Lock a `(label, score)` tuple and guard unknown input.',
            codeLines: ['const entry: [{{0}}, number] = ["Lua", 98];', 'function inspect(x: {{1}}) {', '  if (typeof x === "number") return x * 2;', '}'],
            expectedTokens: ['string', 'unknown'],
            distractors: ['any', 'text', 'object'],
            explanation: '`[string, number]` fixes slot order; `unknown` enforces runtime checks.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the reversed tuple element order!',
            lines: [
              'const coord: [number, number] = [10, 20];',
              'const user: [string, number] = [42, "Ada"];',
            ],
            bugLine: 1,
            fixed: 'const user: [string, number] = ["Ada", 42];',
            explanation: 'Tuple `[string, number]` requires text first and number second.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does strict TypeScript prefer `unknown` over `any` for JSON input?',
            options: [
              'unknown skips type checking',
              'unknown forces narrowing checks before reading properties',
              'any throws compile errors on primitives',
              'unknown auto-validates schemas at runtime',
            ],
            answer: 1,
            explanation: '`unknown` blocks accidental property reads until narrowed cleanly.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Foundations',
        subtitle: 'Verify inference, tuples, readonly, and unknown discipline',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Make `tags` an immutable string array that forbids `.push()`.',
            codeLines: ['const tags: {{0}} string[] = ["ts", "dev"];', 'const copy = tags.map((t) => t.toUpperCase());'],
            expectedTokens: ['readonly'],
            distractors: ['const', 'final', 'static'],
            explanation: '`readonly string[]` forbids mutating arrays while keeping `.map` intact.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the bug trying to mutate a readonly tuple.',
            lines: [
              'const point: readonly [number, number] = [3, 4];',
              'point[0] = 9;',
            ],
            bugLine: 1,
            fixed: 'const nextPoint: readonly [number, number] = [9, point[1]];',
            explanation: '`readonly` forbids reassigning elements inside tuples.',
          },
          {
            type: 'predict_output',
            prompt: 'With `const dirs = ["up", "down"] as const;`, what is the type of `dirs[0]`?',
            code: ['const dirs = ["up", "down"] as const;'],
            options: ['string', '"up"', 'any'],
            answer: 1,
            explanation: '`as const` narrows literals down to exact `"up"` and marks readonly.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Strict Null Safety',
        subtitle: 'Handle optional parameters and optional chaining cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Eliminating Null Pointer Crashes',
            explanation:
              'Mark optional parameters with `?` (`name?: string`), read nested values safely via `user?.bio`, and supply fallbacks with nullish coalescing `??`.',
            code: ['function greet(name?: string): string {', '  return `Hi, ${name ?? "Guest"}`;', '}'],
            highlightNote: '`??` only triggers on `null`/`undefined`—unlike `||` which triggers on `0` or `""`!',
          },
          {
            type: 'token_builder',
            prompt: 'Make `bonus` optional and default safely with nullish coalescing.',
            codeLines: ['function total(xp: number, bonus{{0}}: number): number {', '  return xp + (bonus {{1}} 0);', '}'],
            expectedTokens: ['?', '??'],
            distractors: ['!', '||', '::'],
            explanation: '`bonus?: number` marks optionality; `?? 0` keeps `0` safe without falsy traps.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the parameter order bug with optional args!',
            lines: [
              'function createUser(bio?: string, handle: string) {',
              '  return handle;',
              '}',
            ],
            bugLine: 0,
            fixed: 'function createUser(handle: string, bio?: string) {',
            explanation: 'A required parameter cannot follow an optional `?` parameter in TS.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `0 ?? 100` evaluate to?',
            code: ['const gems = 0 ?? 100;', 'console.log(gems);'],
            options: ['100', '0', 'undefined'],
            answer: 1,
            explanation: '`??` only falls back for `null`/`undefined`, keeping `0` intact!',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Strict Typist',
        subtitle: 'Prove mastery over annotations, tuples, unknown, and ??',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build a safe parser narrowing `unknown` cleanly with a default fallback.',
            codeLines: [
              'function readPort(raw: {{0}}): number {',
              '  if (typeof raw === "number") return raw;',
              '  return 3000;',
              '}',
              'const cfg: readonly [string, number] = ["localhost", readPort({{1}})];',
            ],
            expectedTokens: ['unknown', 'undefined'],
            distractors: ['any', 'null!', 'never'],
            explanation: '`unknown` guarantees caller checks while returning typed tuple slots.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the unsafe any shortcut in strict TypeScript.',
            lines: [
              'function logLength(val: unknown) {',
              '  return val.length;',
              '}',
            ],
            bugLine: 1,
            fixed: '  return typeof val === "string" ? val.length : 0;',
            explanation: 'TS blocks `.length` on `unknown` until you narrow with `typeof` or `Array.isArray`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does `score || 10` misbehave when `score = 0`?',
            options: [
              '|| treats 0 as falsy and substitutes 10; use ?? instead',
              '|| throws a TypeError on numbers',
              '0 is nullish in TypeScript',
              '|| converts 0 to "0"',
            ],
            answer: 0,
            explanation: 'Always prefer `score ?? 10` so `0` and `""` stay preserved.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Interfaces & Object Shapes (5 nodes)
  // =========================================================================
  {
    title: 'Interfaces & Object Shapes',
    subtitle: 'Model clean contracts with interface, type, readonly fields, and extends.',
    conceptGraphicType: 'ts_interfaces',
    guidebook: {
      summary:
        'Interfaces and object type aliases let you describe complex objects once and enforce exact properties, optional fields, and immutability everywhere those objects flow.',
      mentalModel:
        'TypeScript uses **structural typing** ("duck typing"): two types match whenever their shapes contain the same required fields, regardless of whether they share a nominal class name.',
      keyTakeaways: [
        'Use `interface User { readonly id: string; handle: string; bio?: string; }` for extensible object shapes.',
        'Extend contracts cleanly with `interface Admin extends User { role: "admin"; }`—or combine aliases using `&` intersections.',
        'Prefer `Record<string, number>` for dynamic key-value dictionaries instead of loose `{}` objects.',
        'Guard `readonly` properties on entities so IDs and timestamps can never be mutated accidentally.',
      ],
      keySyntax: [
        {
          title: 'Interface with Readonly & Optional Fields',
          tag: 'CONTRACT',
          code: 'interface Learner {\n  readonly id: number;\n  handle: string;\n  bio?: string;\n}\nconst u: Learner = { id: 1, handle: "yuna_ts" };',
          output: 'Compiler forbids `u.id = 2` and warns if `handle` is missing',
          explanation:
            '`readonly id` blocks post-creation edits while `bio?: string` makes `bio` optional.',
          notes: [
            'Structural excess-property checking warns immediately if an object literal passes unknown typo keys like `{ hndle: "a" }`.',
          ],
        },
        {
          title: 'Extending Interfaces vs Type Intersections',
          tag: 'COMPOSITION',
          code: 'interface Tracked { createdAt: string; }\ninterface Lesson extends Tracked {\n  slug: string;\n}',
          output: 'Lesson requires both `slug` and `createdAt`',
          explanation:
            '`extends` reuses fields cleanly across models; `type` aliases compose the same way using `&`.',
          notes: [
            '`type` can also name unions and primitives, whereas `interface` focuses on object shapes.',
          ],
        },
        {
          title: 'Typed Dictionaries with Record<K, V>',
          tag: 'INDEX MAPS',
          code: 'const xpByLang: Record<string, number> = {\n  ts: 420,\n  rust: 680,\n};',
          output: 'All values guaranteed numeric (`number`)',
          explanation:
            '`Record<K, V>` cleanly enforces uniform key/value types on lookup maps.',
          notes: [
            'Combine with literal union keys (`Record<"ts" | "js", number>`) so every language must be present!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Trying to Mutate a readonly Interface Field',
          buggyCode: 'user.id = 99; // TS Error: Cannot assign to id because it is read-only',
          fixedCode: 'const updated: User = { ...user, xp: user.xp + 25 };',
          reason:
            'Immutable state updates return shallow copies (`{ ...user }`) rather than reassigning `readonly` properties.',
        },
        {
          title: 'Optional Property Access Without Guarding undefined',
          buggyCode: 'function bioLen(u: User) { return u.bio.length; }',
          fixedCode: 'function bioLen(u: User) { return u.bio?.length ?? 0; }',
          reason:
            '`bio?: string` includes `undefined`; reading `.length` directly fails under strict checks.',
        },
      ],
      proTip:
        'Use `type Props = ...` when you need unions or mapped utilities, and `interface` for clean domain models you want library consumers or classes to `extend` or `implement`.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Interface Contracts',
        subtitle: 'Define object schemas with required, optional, and readonly fields',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Clean Object Shapes',
            explanation:
              'An `interface` lists the exact keys and types an object expects. Mark unchangeable IDs `readonly` and optional fields with `?`.',
            code: ['interface Course {', '  readonly slug: string;', '  units: number;', '  badge?: string;', '}'],
            highlightNote: 'Passing extra unknown keys directly in an object literal triggers a typo warning.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare `Player` with immutable `id` and optional `title`.',
            codeLines: ['{{0}} Player {', '  {{1}} id: number;', '  name: string;', '  title?: string;', '}'],
            expectedTokens: ['interface', 'readonly'],
            distractors: ['struct', 'final', 'const'],
            explanation: '`interface` defines the contract and `readonly` locks `id` permanently.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the illegal mutation of a readonly field.',
            lines: [
              'interface Account { readonly id: string; xp: number; }',
              'const acc: Account = { id: "u1", xp: 50 };',
              'acc.id = "u2";',
            ],
            bugLine: 2,
            fixed: 'acc.xp = 75;',
            explanation: '`id` is marked `readonly` so TypeScript blocks reassigning `acc.id`.',
          },
          {
            type: 'multiple_choice',
            question: 'What does TypeScript’s structural typing check when assigning object B to type A?',
            options: [
              'Whether B was built with the exact same class constructor',
              'Whether B includes all properties required by A with compatible types',
              'Whether property keys appear in identical order',
              'Only runtime prototype chains',
            ],
            answer: 1,
            explanation: 'TS checks object shape compatibility rather than nominal names.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Extending & Records',
        subtitle: 'Compose interfaces via extends and map keys with Record',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Reusable Inheritance & Record Maps',
            explanation:
              '`interface ProUser extends User` inherits all base keys cleanly. For lookup tables, `Record<K, V>` maps every key of type `K` to value `V`.',
            code: ['interface Admin extends User { level: number; }', 'const totals: Record<string, number> = { ts: 5, c: 6 };'],
            highlightNote: '`Record<"py" | "ts", number>` even verifies no language key is forgotten!',
          },
          {
            type: 'token_builder',
            prompt: 'Inherit fields from `BaseNode` and map status counts via `Record`.',
            codeLines: ['interface BossNode {{0}} BaseNode {', '  bonusXp: number;', '}', 'const counts: {{1}}<string, number> = { won: 3 };'],
            expectedTokens: ['extends', 'Record'],
            distractors: ['implements', 'Map', 'Object'],
            explanation: 'Interfaces inherit via `extends`; typed dicts use `Record<K, V>`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the value violating Record<string, number>.',
            lines: [
              'const scores: Record<string, number> = {',
              '  ada: 95,',
              '  max: "88",',
              '};',
            ],
            bugLine: 2,
            fixed: '  max: 88,',
            explanation: '`Record<string, number>` enforces numeric values; `"88"` is a string.',
          },
          {
            type: 'predict_output',
            prompt: 'If `User` has `{ name: string }` and `Pro extends User` adds `{ gems: number }`, what is valid?',
            code: ['const u: Pro = { name: "Kai", gems: 120 };'],
            options: ['Missing id error', 'Valid Pro object', 'Only { gems } allowed'],
            answer: 1,
            explanation: '`Pro` combines both `User`’s `name` and its own `gems` field.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Shapes',
        subtitle: 'Check readonly updates, optional fields, and extends',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Safely read optional `u.bio` length defaulting cleanly to `0`.',
            codeLines: ['function bioChars(u: { bio?: string }): number {', '  return u.bio{{0}}.length {{1}} 0;', '}'],
            expectedTokens: ['?', '??'],
            distractors: ['!', '||', '.'],
            explanation: '`u.bio?.length ?? 0` handles missing bios without runtime throws.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why strict TS rejects direct `.toUpperCase()` on optional `nickname`.',
            lines: [
              'interface Profile { nickname?: string; }',
              'function upper(p: Profile) { return p.nickname.toUpperCase(); }',
            ],
            bugLine: 1,
            fixed: 'function upper(p: Profile) { return p.nickname?.toUpperCase() ?? ""; }',
            explanation: '`p.nickname` may be `undefined`, requiring `?.` or an `if` guard.',
          },
          {
            type: 'multiple_choice',
            question: 'Which statement cleanly distinguishes `type` from `interface` in TypeScript?',
            options: [
              'Only `interface` supports generics',
              'Only `type` can define unions (`"a" | "b"`) and tuple aliases directly',
              'Only `type` has zero runtime footprint',
              '`interface` cannot declare optional `?` fields',
            ],
            answer: 1,
            explanation: '`type` defines unions, primitives, and tuples; `interface` models objects.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Type Aliases & Intersections',
        subtitle: 'Combine reusable type building blocks with &',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Composing Types with &',
            explanation:
              'Intersection `&` merges multiple object types into one (`Timestamped & Payload`), requiring all properties from both sides.',
            code: ['type WithId = { id: string };', 'type WithXp = { xp: number };', 'type Hero = WithId & WithXp;'],
            highlightNote: 'Intersecting conflicting primitives (`string & number`) resolves to `never`!',
          },
          {
            type: 'token_builder',
            prompt: 'Define alias `Titled` and merge it with `Scorable` using intersection.',
            codeLines: ['{{0}} Titled = { title: string };', 'type Card = Titled {{1}} { xp: number };'],
            expectedTokens: ['type', '&'],
            distractors: ['interface', '|', '+'],
            explanation: '`type` creates object aliases and `&` merges fields from both types.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the impossible intersection creating type `never`.',
            lines: [
              'type Named = { tag: string };',
              'type Coded = { tag: number };',
              'type Conflict = Named & Coded;',
            ],
            bugLine: 1,
            fixed: 'type Coded = { code: number };',
            explanation: '`tag: string & number` reduces to `never` because no value is both.',
          },
          {
            type: 'multiple_choice',
            question: 'How do you clone an object updating `xp` while respecting `readonly id`?',
            options: [
              'user.id = user.id; user.xp = 10;',
              'const next = { ...user, xp: 10 };',
              'Object.freeze(user);',
              'delete user.id;',
            ],
            answer: 1,
            explanation: 'Spread `{ ...user, xp: 10 }` builds a new typed object cleanly.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Schema Modeler',
        subtitle: 'Combine interfaces, readonly, extends, Record, and &',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Require keys `"ts"` and `"js"` inside a `Record` extending an interface.',
            codeLines: [
              'interface Timed { ms: number; }',
              'interface Run {{0}} Timed { ok: boolean; }',
              'const stats: {{1}}<"ts" | "js", Run> = {',
              '  ts: { ms: 12, ok: true },',
              '  js: { ms: 9, ok: true },',
              '};',
            ],
            expectedTokens: ['extends', 'Record'],
            distractors: ['implements', 'Map', 'type'],
            explanation: 'Exhaustive `Record<"ts" | "js", Run>` ensures no language is missed.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the missing required key on `CourseConfig`.',
            lines: [
              'interface CourseConfig { id: string; maxHearts: number; }',
              'const cfg: CourseConfig = { id: "ts" };',
            ],
            bugLine: 1,
            fixed: 'const cfg: CourseConfig = { id: "ts", maxHearts: 5 };',
            explanation: '`maxHearts` is required (no `?`) so TS rejects omitting it.',
          },
          {
            type: 'predict_output',
            prompt: 'Does passing `{ id: 1, name: "Lua", extra: true }` via variable `raw` pass into `{ id: number; name: string }`?',
            code: ['const raw = { id: 1, name: "Lua", extra: true };', 'const course: { id: number; name: string } = raw;'],
            options: ['Yes, structural subtype', 'No, excess error', 'Runtime crash'],
            answer: 0,
            explanation: 'Fresh object literals forbid excess keys, while assigned variables use structural matching.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Unions & Type Narrowing (5 nodes)
  // =========================================================================
  {
    title: 'Unions & Type Narrowing',
    subtitle: 'Constrain values with literal unions, discriminated kinds, and exhaustive checks.',
    conceptGraphicType: 'ts_unions',
    guidebook: {
      summary:
        'Unions (`string | number` or `"idle" | "loading" | "error"`) let a variable hold one of several explicit shapes, while **type narrowing** (`typeof`, `in`, `"kind" in state`) lets TypeScript prove exactly which branch is active.',
      mentalModel:
        'Think of a **discriminated union** (`{ kind: "ok"; data: string } | { kind: "err"; error: string }`) like a sealed envelope with a printed label on the front: check `res.kind === "ok"`, and TS automatically unlocks `res.data`!',
      keyTakeaways: [
        'Use literal unions (`type Status = "idle" | "running" | "done"`) instead of loose `string` flags.',
        'Narrow primitives with `typeof x === "string"`, arrays with `Array.isArray(x)`, and classes with `instanceof`.',
        'Tag multi-shape objects with a common literal field (`kind` or `status`) to build **discriminated unions**.',
        'Assign unused fallback branches to `const _check: never = state;` so adding a new union member causes an instant compile reminder!',
      ],
      keySyntax: [
        {
          title: 'Discriminated Union + Narrowing',
          tag: 'PATTERN',
          code: 'type Result =\n  | { status: "ok"; value: number }\n  | { status: "err"; reason: string };\n\nfunction describe(r: Result): string {\n  return r.status === "ok" ? `Val: ${r.value}` : r.reason;\n}',
          output: 'Compiler narrows `r.value` cleanly inside `r.status === "ok"`',
          explanation:
            'Checking the literal discriminant `r.status` splits the union into exact branches with zero unsafe type casts.',
          notes: [
            'Discriminants avoid error-prone `as MyType` assertions completely.',
          ],
        },
        {
          title: 'Narrowing with typeof and in',
          tag: 'GUARDS',
          code: 'function format(id: string | number): string {\n  if (typeof id === "number") return `#${id.toFixed(0)}`;\n  return id.toUpperCase();\n}',
          output: '"#7" or "TS"',
          explanation:
            'Inside the `else` branch, TS knows `id` MUST be `string` and unlocks `.toUpperCase()` safely.',
          notes: [
            '`if ("role" in account)` narrows object unions cleanly even without a shared discriminant tag.',
          ],
        },
        {
          title: 'Exhaustive switch with never',
          tag: 'EXHAUSTIVE',
          code: 'function assertNever(x: never): never {\n  throw new Error(`Unhandled case: ${String(x)}`);\n}',
          output: 'Compile error if any union variant is forgotten in switch',
          explanation:
            'Once every literal case is handled cleanly, the remaining type shrinks down to empty set `never`.',
          notes: [
            'Custom type predicates (`x is User`) build reusable narrowing helpers for complex checks.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Silencing Union Errors with unsafe `as` Casts',
          buggyCode: 'const txt = (input as string).trim(); // Crashes if input is number!',
          fixedCode: 'if (typeof input === "string") input.trim();',
          reason:
            '`as` lies to the compiler without checking runtime values; genuine narrowing keeps code safe.',
        },
        {
          title: 'Reading Union-Specific Fields Before Checking Discriminant',
          buggyCode: 'function printErr(r: Result) { console.log(r.reason); }',
          fixedCode: 'if (r.status === "err") console.log(r.reason);',
          reason:
            '`reason` only exists on `{ status: "err" }`, never on `{ status: "ok" }`.',
        },
      ],
      proTip:
        'Prefer a discriminated union over optional flag bags (`{ loading?: boolean; data?: T; error?: string }`): impossible states like `{ loading: true, data: ... , error: "..." }` become impossible to construct!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Literal & Union Types',
        subtitle: 'Restrict variables to explicit value sets with |',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Exact Allowed Values with |',
            explanation:
              'Unions combine types using `|` (`"light" | "dark"` or `string | number`). Only methods common to all members work until you narrow.',
            code: ['type League = "Bronze" | "Gold" | "Obsidian";', 'const myTier: League = "Gold";'],
            highlightNote: 'Autocomplete lists `"Bronze" | "Gold" | "Obsidian"` immediately!',
          },
          {
            type: 'token_builder',
            prompt: 'Allow `id` to be either `string` or `number`, and restrict `mode` literals.',
            codeLines: ['type Id = string {{0}} number;', 'type Mode = "play" | {{1}};'],
            expectedTokens: ['|', '"blitz"'],
            distractors: ['&', 'string', '+'],
            explanation: 'Pipe `|` forms unions across primitives or exact string literals.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid value outside the union literals.',
            lines: [
              'type Theme = "carbon" | "zinc";',
              'const active: Theme = "neon";',
            ],
            bugLine: 1,
            fixed: 'const active: Theme = "carbon";',
            explanation: '`"neon"` is excluded by `"carbon" | "zinc"`.',
          },
          {
            type: 'multiple_choice',
            question: 'What happens if you call `x.toUpperCase()` on `x: string | number` without narrowing?',
            options: [
              'Compiles cleanly',
              'Type error: number does not have .toUpperCase()',
              'Returns stringified number',
              'TS narrows automatically to string',
            ],
            answer: 1,
            explanation: 'Only operations valid on EVERY union member work before narrowing.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'typeof & in Narrowing',
        subtitle: 'Shrink unions cleanly inside conditional branches',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Control-Flow Narrowing',
            explanation:
              'TypeScript tracks `if (typeof x === "number")`, `Array.isArray(x)`, and `if ("key" in obj)` so each branch automatically unlocks the matching type.',
            code: ['function pad(v: string | number): string {', '  if (typeof v === "number") return v.toFixed(1);', '  return v.trim();', '}'],
            highlightNote: 'Notice the early `return` narrows the rest of the function to `string`!',
          },
          {
            type: 'token_builder',
            prompt: 'Narrow an `Admin | Guest` union safely using the `in` operator.',
            codeLines: ['function label(u: { role: string } | { guestId: number }) {', '  if ({{0}} {{1}} u) return u.role;', '  return `Guest #${u.guestId}`;', '}'],
            expectedTokens: ['"role"', 'in'],
            distractors: ['role', 'has', 'typeof'],
            explanation: '`"role" in u` proves `u` has the `.role` property.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `.map` fails before Array.isArray narrowing.',
            lines: [
              'function cleanTags(input: string | string[]) {',
              '  return input.map((t) => t.trim());',
              '}',
            ],
            bugLine: 1,
            fixed: '  return Array.isArray(input) ? input.map((t) => t.trim()) : [input.trim()];',
            explanation: 'Plain `string` has no `.map` method until narrowed via `Array.isArray`.',
          },
          {
            type: 'predict_output',
            prompt: 'In `if (typeof x === "string") ... else { /* type here? */ }` when `x: string | boolean`:',
            code: ['function f(x: string | boolean) {', '  if (typeof x === "string") return 1;', '  // What type is x here?', '}'],
            options: ['string | boolean', 'boolean', 'never'],
            answer: 1,
            explanation: 'Eliminating `string` narrows `x` strictly to `boolean`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Unions',
        subtitle: 'Verify union safety without unsafe `as` casts',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write a reusable type guard confirming `x` is a `string`.',
            codeLines: ['function isText(x: unknown): x {{0}} {{1}} {', '  return typeof x === "string";', '}'],
            expectedTokens: ['is', 'string'],
            distractors: ['as', 'unknown', 'boolean'],
            explanation: '`x is string` teaches callers to narrow automatically on truthy returns.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the unsafe `as` assertion bypassing narrowing!',
            lines: [
              'function shout(x: string | number) {',
              '  return (x as string).toUpperCase();',
              '}',
            ],
            bugLine: 1,
            fixed: '  return typeof x === "string" ? x.toUpperCase() : String(x);',
            explanation: '`(x as string)` crashes at runtime when `x` is a `number`.',
          },
          {
            type: 'multiple_choice',
            question: 'What is `typeof null` in JavaScript/TypeScript at runtime?',
            options: ['"null"', '"undefined"', '"object"', '"never"'],
            answer: 2,
            explanation: 'Always guard `val !== null` explicitly before checking `typeof val === "object"`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Discriminated Unions & never',
        subtitle: 'Model explicit state machines checked exhaustively by tsc',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Impossible States Made Impossible',
            explanation:
              'Give every variant a common literal tag (like `kind: "ok"` vs `kind: "err"`). Checking `switch (s.kind)` lets TS guarantee via `never` that no state was overlooked.',
            code: ['type LoadState =', '  | { kind: "idle" }', '  | { kind: "ready"; data: string[] };'],
            highlightNote: 'Assign `default: const _x: never = state;` to enforce exhaustiveness!',
          },
          {
            type: 'token_builder',
            prompt: 'Tag states with `kind` and enforce exhaustiveness with `never`.',
            codeLines: [
              'type Step = { {{0}}: "done"; xp: number } | { kind: "fail" };',
              'function score(s: Step): number {',
              '  switch (s.kind) {',
              '    case "done": return s.xp;',
              '    case "fail": return 0;',
              '    default: const check: {{1}} = s; return check;',
              '  }',
              '}',
            ],
            expectedTokens: ['kind', 'never'],
            distractors: ['type', 'void', 'unknown'],
            explanation: 'Adding a new `Step` variant makes `const check: never = s` fail compilation until handled.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing discriminant check reading `s.data` unsafely.',
            lines: [
              'type Net = { kind: "loading" } | { kind: "ok"; data: number };',
              'function show(n: Net) {',
              '  return n.data * 2;',
              '}',
            ],
            bugLine: 2,
            fixed: '  return n.kind === "ok" ? n.data * 2 : 0;',
            explanation: '`{ kind: "loading" }` carries no `.data` field—check `n.kind` first.',
          },
          {
            type: 'multiple_choice',
            question: 'What does type `never` represent in TypeScript?',
            options: [
              'Same as void/undefined',
              'An impossible set with zero values (e.g. unreachable code or throwing fn)',
              'Optional parameters',
              'Any dynamic JS object',
            ],
            answer: 1,
            explanation: '`never` marks unreachable branches and infinite/throwing functions.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: State Machine Architect',
        subtitle: 'Assemble discriminated unions, typeof guards, and never',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Handle all `Action` variants cleanly using discriminated narrowing.',
            codeLines: [
              'type Action = { kind: "add"; n: number } | { kind: "reset" };',
              'function reduce(total: number, act: Action): number {',
              '  if (act.{{0}} === "reset") return 0;',
              '  return total + act.{{1}};',
              '}',
            ],
            expectedTokens: ['kind', 'n'],
            distractors: ['type', 'Action', 'value'],
            explanation: 'Returning early on `act.kind === "reset"` narrows `act` cleanly to `{ kind: "add"; n: number }`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the forgotten case caught by exhaustive `never`.',
            lines: [
              'type Mode = "fast" | "safe" | "turbo";',
              'function speed(m: Mode): number {',
              '  if (m === "fast") return 2;',
              '  if (m === "safe") return 1;',
              '  const left: never = m;',
              '}',
            ],
            bugLine: 4,
            fixed: '  return 3;',
            explanation: '`"turbo"` was unhandled, so `m` was `"turbo"`, failing `never` assignment!',
          },
          {
            type: 'predict_output',
            prompt: 'Given `type Box = { kind: "a"; v: 1 } | { kind: "b"; v: 2 };`, what is `v` when `b.kind === "b"`?',
            code: ['if (box.kind === "b") console.log(box.v);'],
            options: ['1 | 2', '2', 'number'],
            answer: 1,
            explanation: 'Narrowing via literal `kind` locks `box.v` specifically to `2`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Generics <T> (5 nodes)
  // =========================================================================
  {
    title: 'Generics <T>',
    subtitle: 'Write reusable type-safe functions, wrappers, and constrained containers.',
    conceptGraphicType: 'ts_generics',
    guidebook: {
      summary:
        'Generics (`<T>`) let a function, interface, or class work cleanly across **any** type while remembering the exact type passed in—never erasing return types back to `any` or `unknown`.',
      mentalModel:
        'Think of `<T>` as a **type parameter** filled automatically from your argument: pass `"Ada"` into `first<T>(arr: T[])`, and `T` locks cleanly to `string` for the return type!',
      keyTakeaways: [
        'Infer `<T>` from arguments cleanly (`first(["a", "b"])` -> `string | undefined`) without verbose explicit `<string>` calls.',
        'Constrain `<T extends { length: number }>` when a generic function relies on a specific property like `.length`.',
        'Use `<T, K extends keyof T>(obj: T, key: K): T[K]` to guarantee safe property lookups with zero typo keys!',
        'Generic wrappers like `ApiResponse<T>` reuse one envelope across dozens of data models.',
      ],
      keySyntax: [
        {
          title: 'Generic Function & Type Inference',
          tag: 'REUSABLE',
          code: 'function first<T>(items: readonly T[]): T | undefined {\n  return items[0];\n}\nconst top = first([10, 20]); // Inferred: number | undefined',
          output: '10 (typed as number | undefined)',
          explanation:
            '`<T>` links input element type directly to return type so callers retain full autocomplete.',
          notes: [
            'Including `| undefined` reminds callers empty arrays might not have index `0`.',
          ],
        },
        {
          title: 'Constrained Generics & keyof Lookups',
          tag: 'KEYOF',
          code: 'function pickField<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}',
          output: 'pickField({ xp: 50, lang: "ts" }, "xp") -> number',
          explanation:
            '`K extends keyof T` restricts `key` strictly to real keys on `obj` and returns exact type `T[K]`.',
          notes: [
            'Passing an invalid key like `"xpp"` triggers an immediate compile error.',
          ],
        },
        {
          title: 'Generic Envelope Interfaces',
          tag: 'WRAPPER',
          code: 'interface Box<T> {\n  ok: boolean;\n  data: T;\n}\nconst res: Box<number[]> = { ok: true, data: [1, 2] };',
          output: 'res.data has type number[]',
          explanation:
            '`Box<T>` parameterizes `data` cleanly so API wrappers stay strongly typed everywhere.',
          notes: [
            'Defaults work too: `interface Box<T = unknown> { data: T; }`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Accessing .length Without extends Constraint',
          buggyCode: 'function sizeOf<T>(x: T) { return x.length; }',
          fixedCode: 'function sizeOf<T extends { length: number }>(x: T) { return x.length; }',
          reason:
            'Unconstrained `T` could be a `number` or `boolean`, which has no `.length` property.',
        },
        {
          title: 'Falling Back to any When <T> Was Needed',
          buggyCode: 'function wrap(v: any) { return { value: v }; } // Returns { value: any }!',
          fixedCode: 'function wrap<T>(v: T): { value: T } { return { value: v }; }',
          reason:
            'Using `any` throws away caller type knowledge, whereas `<T>` preserves it automatically.',
        },
      ],
      proTip:
        'Don’t add `<T>` unless `T` connects at least TWO places (like parameter -> return, or two parameters). A generic used only once is just noise for `unknown`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Generic Functions <T>',
        subtitle: 'Preserve caller types seamlessly without any',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Type Variables Follow Arguments',
            explanation:
              'Declare `<T>` right before `(args)` so TypeScript captures the input type into `T` and re-emits `T` in the return signature.',
            code: ['function wrap<T>(value: T): { value: T } {', '  return { value };', '}', 'const box = wrap("TypeScript");'],
            highlightNote: '`box.value` knows it is `string` automatically!',
          },
          {
            type: 'token_builder',
            prompt: 'Make `last` preserve any array element type `T`.',
            codeLines: ['function last{{0}}(arr: readonly T[]): {{1}} | undefined {', '  return arr[arr.length - 1];', '}'],
            expectedTokens: ['<T>', 'T'],
            distractors: ['<any>', 'unknown', 'any'],
            explanation: '`<T>` lets `last([true, false])` return `boolean | undefined`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `identity` loses its input type information!',
            lines: [
              'function identity(val: any): any {',
              '  return val;',
              '}',
            ],
            bugLine: 0,
            fixed: 'function identity<T>(val: T): T {',
            explanation: 'Using `any` erases types, whereas `<T>(val: T): T` keeps them.',
          },
          {
            type: 'predict_output',
            prompt: 'With `function pair<A, B>(a: A, b: B): [A, B]`, what does `pair("TS", 5)` return as type?',
            code: ['const res = pair("TS", 5);'],
            options: ['[any, any]', '[string, number]', '(string | number)[]'],
            answer: 1,
            explanation: 'Multiple type params `<A, B>` capture `"TS"` (`string`) and `5` (`number`) into `[string, number]`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Constraints & keyof',
        subtitle: 'Require structural capabilities via extends and keyof',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Safe Constraints with extends',
            explanation:
              'Add `<T extends { id: string }>` when your helper reads `.id`, or `<K extends keyof T>` when accessing a key dynamically.',
            code: ['function getId<T extends { id: string }>(item: T): string {', '  return item.id;', '}'],
            highlightNote: 'Callers can pass `{ id: "u1", xp: 50 }` while `{ xp: 50 }` fails at build time.',
          },
          {
            type: 'token_builder',
            prompt: 'Constrain `K` cleanly to real keys on object `T`.',
            codeLines: ['function getProp<T, K {{0}} {{1}} T>(obj: T, key: K): T[K] {', '  return obj[key];', '}'],
            expectedTokens: ['extends', 'keyof'],
            distractors: ['implements', 'in', 'typeof'],
            explanation: '`K extends keyof T` rejects misspelled property names immediately.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the missing constraint preventing `.length` access.',
            lines: [
              'function longest<T>(a: T, b: T): T {',
              '  return a.length >= b.length ? a : b;',
              '}',
            ],
            bugLine: 0,
            fixed: 'function longest<T extends { length: number }>(a: T, b: T): T {',
            explanation: 'Without `extends { length: number }`, `T` isn’t guaranteed to have `.length`.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `keyof { id: number; name: string }` evaluate to?',
            options: ['["id", "name"]', '"id" | "name"', 'number | string', 'Record<string, any>'],
            answer: 1,
            explanation: '`keyof` extracts the union of literal property keys (`"id" | "name"`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Generics',
        subtitle: 'Verify inference, constraints, and keyof lookups',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Define a generic `ApiResult<T>` carrying `data: T` and default `<T = string>`.',
            codeLines: ['interface ApiResult<T {{0}} string> {', '  data: {{1}};', '}'],
            expectedTokens: ['=', 'T'],
            distractors: ['extends', 'unknown', 'any'],
            explanation: 'Default type parameters `= string` let `ApiResult` omit brackets when default fits.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the invalid key passed to a `keyof` generic.',
            lines: [
              'const user = { handle: "yuna", xp: 300 };',
              'getProp(user, "hearts");',
            ],
            bugLine: 1,
            fixed: 'getProp(user, "xp");',
            explanation: '`"hearts"` does not exist on `keyof typeof user` (`"handle" | "xp"`).',
          },
          {
            type: 'multiple_choice',
            question: 'When should you write `<T>` on a TypeScript function?',
            options: [
              'On every single function for consistency',
              'When relating multiple values’ types (e.g. input type determines output type)',
              'Whenever replacing boolean',
              'Only inside React components',
            ],
            answer: 1,
            explanation: 'Generics connect types across inputs and outputs cleanly.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Generic Containers & Maps',
        subtitle: 'Type React hooks, Promises, Arrays, and Maps',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Standard Built-In Generics',
            explanation:
              'TypeScript’s standard library uses generics everywhere: `Array<T>`, `Map<K, V>`, `Set<T>`, and `Promise<T>`.',
            code: ['const cache = new Map<string, number>();', 'cache.set("ts", 100);', 'async function fetchXp(): Promise<number> { return 50; }'],
            highlightNote: 'Every `async` function automatically wraps its return value inside `Promise<T>`.',
          },
          {
            type: 'token_builder',
            prompt: 'Type an async loader resolving an array of `User`s and a typed `Set`.',
            codeLines: ['const seen = new {{0}}<string>();', 'async function loadUsers(): {{1}}<User[]> {', '  return [];', '}'],
            expectedTokens: ['Set', 'Promise'],
            distractors: ['List', 'Async', 'Future'],
            explanation: '`Set<string>` tracks unique keys; `async` functions return `Promise<User[]>`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing Promise wrapper on an async return type.',
            lines: [
              'async function getScore(): number {',
              '  return 42;',
              '}',
            ],
            bugLine: 0,
            fixed: 'async function getScore(): Promise<number> {',
            explanation: '`async` functions always return a `Promise<...>`, never raw `number`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `const s = new Set([1, 2, 2]);` infer for `s`?',
            code: ['const s = new Set([1, 2, 2]);'],
            options: ['Set<any>', 'Set<number>', 'number[]'],
            answer: 1,
            explanation: 'TS infers `Set<number>` directly from the array literal `[1, 2, 2]`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Generic Toolkit',
        subtitle: 'Combine <T>, constraints, keyof, and Promise<T>',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build an async key reader returning `Promise<T[K]>`.',
            codeLines: [
              'async function fetchKey<T, K {{0}} keyof T>(obj: T, k: K): {{1}}<T[K]> {',
              '  return obj[k];',
              '}',
            ],
            expectedTokens: ['extends', 'Promise'],
            distractors: ['in', 'Async', 'ReturnType'],
            explanation: 'Combining `extends keyof T` with `Promise<T[K]>` preserves async property types.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the value mismatch on Map<string, number>.',
            lines: [
              'const scores = new Map<string, number>();',
              'scores.set("rust", "120");',
            ],
            bugLine: 1,
            fixed: 'scores.set("rust", 120);',
            explanation: '`Map<string, number>` enforces numeric values (`120`, not `"120"`).',
          },
          {
            type: 'multiple_choice',
            question: 'What is `T[K]` called in `function get<T, K extends keyof T>(o: T, k: K): T[K]`?',
            options: [
              'Tuple destructuring',
              'Indexed access type (looks up property K’s type on T)',
              'Template literal',
              'Array slice',
            ],
            answer: 1,
            explanation: '`T[K]` extracts the exact property value type corresponding to key `K`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Async & Utility Types (5 nodes)
  // =========================================================================
  {
    title: 'Async & Utility Types',
    subtitle: 'Transform shapes cleanly with Partial, Pick, Omit, Readonly, and Awaited.',
    conceptGraphicType: 'ts_utils',
    guidebook: {
      summary:
        'Instead of duplicating DTO interfaces for drafts, updates, or public responses, TypeScript ships built-in **utility types** (`Partial`, `Required`, `Pick`, `Omit`, `Readonly`, `Awaited`, `ReturnType`) that derive new types directly from your source of truth.',
      mentalModel:
        'Think of utility types as type-level functions: pass `User` into `Partial<User>` to get patch payloads, or `Omit<User, "password">` to strip secrets cleanly with zero copy-paste drift.',
      keyTakeaways: [
        '`Partial<T>` marks every property optional (ideal for `updateUser(id, patch: Partial<User>)`).',
        '`Pick<T, "a" | "b">` keeps only chosen keys; `Omit<T, "secret">` drops sensitive keys.',
        '`Readonly<T>` locks all top-level properties against accidental mutation.',
        '`Awaited<ReturnType<typeof fn>>` extracts the resolved output type of any `async` function!',
      ],
      keySyntax: [
        {
          title: 'Pick, Omit & Partial for Clean APIs',
          tag: 'UTILITIES',
          code: 'interface User { id: string; handle: string; hash: string; }\ntype PublicUser = Omit<User, "hash">;\ntype UserPatch = Partial<Pick<User, "handle">>;',
          output: 'PublicUser lacks `hash`; UserPatch accepts `{ handle?: string }`',
          explanation:
            'Deriving `PublicUser` and `UserPatch` from `User` guarantees schema updates automatically propagate everywhere.',
          notes: [
            'Adding `xp: number` to `User` updates `PublicUser` immediately.',
          ],
        },
        {
          title: 'Async Unwrapping with Awaited & ReturnType',
          tag: 'ASYNC TYPES',
          code: 'async function getProfile() { return { xp: 100, streak: 5 }; }\ntype ProfileData = Awaited<ReturnType<typeof getProfile>>;',
          output: 'ProfileData = { xp: number; streak: number }',
          explanation:
            '`typeof getProfile` grabs the function signature, `ReturnType` grabs `Promise<...>`, and `Awaited` unwraps the `Promise`.',
          notes: [
            '`satisfies` (`const map = { a: 1 } satisfies Record<string, number>`) checks a type WITHOUT losing narrow literal keys!',
          ],
        },
        {
          title: 'Strict NonNullable<T> & Extract/Exclude',
          tag: 'FILTERING',
          code: 'type Raw = string | null | undefined;\ntype Clean = NonNullable<Raw>; // string',
          output: 'Strips null and undefined cleanly',
          explanation:
            '`NonNullable<T>` removes `null | undefined` while `Exclude<U, V>` drops union members.',
          notes: [
            '`Parameters<typeof fn>` grabs an array tuple of a function’s arguments.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Duplicating User into CreateUser, PublicUser Manually',
          buggyCode: 'interface PublicUser { id: string; handle: string; } // Drifts out of sync!',
          fixedCode: 'type PublicUser = Omit<User, "passwordHash">;',
          reason:
            'Manual copies silently rot whenever fields change—derive them via `Pick` or `Omit`.',
        },
        {
          title: 'Allowing id Edits in Partial<User> Patches',
          buggyCode: 'function patch(p: Partial<User>) { ... } // Lets callers overwrite id!',
          fixedCode: 'function patch(p: Partial<Omit<User, "id">>) { ... }',
          reason:
            'Combine `Omit<User, "id">` with `Partial<...>` so primary keys can never be patched.',
        },
      ],
      proTip:
        'TypeScript 4.9+ `satisfies` (`const palette = { accent: "#6E56CF" } satisfies Record<string, string>`) validates shape constraints while still letting `palette.accent` autocomplete as `"#6E56CF"` instead of widening to `string`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Partial, Pick & Omit',
        subtitle: 'Derive patch & public DTO types from existing models',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Drift Derived Types',
            explanation:
              '`Partial<T>` makes every property optional. `Pick<T, Keys>` selects a subset of keys, while `Omit<T, Keys>` excludes keys.',
            code: ['interface User { id: string; email: string; secret: string; }', 'type Public = Omit<User, "secret">;', 'type Patch = Partial<Pick<User, "email">>;'],
            highlightNote: 'If `User` renames `email`, `Pick` fails compilation immediately rather than rotting!',
          },
          {
            type: 'token_builder',
            prompt: 'Strip `"token"` from `Account` and make `Account` fields optional for patching.',
            codeLines: ['type SafeAccount = {{0}}<Account, "token">;', 'type UpdateDto = {{1}}<SafeAccount>;'],
            expectedTokens: ['Omit', 'Partial'],
            distractors: ['Pick', 'Readonly', 'Exclude'],
            explanation: '`Omit` removes `"token"` and `Partial` makes remaining fields optional.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the nonexistent key passed inside Pick<...>.',
            lines: [
              'interface Item { id: string; price: number; }',
              'type PriceTag = Pick<Item, "cost">;',
            ],
            bugLine: 1,
            fixed: 'type PriceTag = Pick<Item, "price">;',
            explanation: '`Pick` checks keys strictly against `keyof Item` (`"id" | "price"`).',
          },
          {
            type: 'multiple_choice',
            question: 'Which utility type marks every field of `Config` immutable?',
            options: ['Partial<Config>', 'Readonly<Config>', 'Required<Config>', 'Omit<Config, "id">'],
            answer: 1,
            explanation: '`Readonly<T>` adds the `readonly` modifier onto every property in `T`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Awaited & ReturnType',
        subtitle: 'Inspect async return types cleanly with typeof',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Extracting Types from Functions',
            explanation:
              'Never repeat a complex function’s output type! Combine `ReturnType<typeof fn>` with `Awaited<...>` to extract resolved payloads automatically.',
            code: ['async function loadUser() { return { id: 1, xp: 400 }; }', 'type Loaded = Awaited<ReturnType<typeof loadUser>>;'],
            highlightNote: '`typeof loadUser` bridges JS value space into TS type space cleanly.',
          },
          {
            type: 'token_builder',
            prompt: 'Extract the resolved object type of `async function fetchConfig()`.',
            codeLines: ['type Cfg = {{0}}<{{1}}<typeof fetchConfig>>;'],
            expectedTokens: ['Awaited', 'ReturnType'],
            distractors: ['Promise', 'Parameters', 'Readonly'],
            explanation: '`ReturnType` gets `Promise<...>`, and `Awaited` unwraps it.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing `typeof` inside ReturnType<fn>.',
            lines: [
              'function makeHero() { return { hp: 100 }; }',
              'type Hero = ReturnType<makeHero>;',
            ],
            bugLine: 1,
            fixed: 'type Hero = ReturnType<typeof makeHero>;',
            explanation: '`makeHero` is a runtime value; pass `typeof makeHero` to `ReturnType<...>`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is `Awaited<Promise<Promise<string>>>` in TypeScript?',
            code: ['type Res = Awaited<Promise<Promise<string>>>;'],
            options: ['Promise<string>', 'string', 'unknown'],
            answer: 1,
            explanation: '`Awaited` recursively unwraps nested Promises all the way down to `string`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Utilities',
        subtitle: 'Lock down Pick, Omit, Required, and NonNullable',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Strip `null` and `undefined` cleanly and flip optional fields required.',
            codeLines: ['type Present = {{0}}<string | null | undefined>;', 'type StrictOpts = {{1}}<Partial<Options>>;'],
            expectedTokens: ['NonNullable', 'Required'],
            distractors: ['Partial', 'Readonly', 'Extract'],
            explanation: '`NonNullable` removes nullish members; `Required` removes `?`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `Patch` still lets callers overwrite primary key `id`.',
            lines: [
              'interface User { id: string; name: string; }',
              'type SafePatch = Partial<User>;',
            ],
            bugLine: 1,
            fixed: 'type SafePatch = Partial<Omit<User, "id">>;',
            explanation: 'Omit `"id"` before applying `Partial` so `id` cannot be accidentally patched.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `Exclude<"a" | "b" | "c", "c">` produce?',
            options: ['"c"', '"a" | "b"', 'Omit<"a" | "b", "c">', 'never'],
            answer: 1,
            explanation: '`Exclude` filters members out of a **union** (whereas `Omit` filters object **keys**).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'The satisfies Operator',
        subtitle: 'Validate shapes without erasing narrow literal keys',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Check Without Widening via satisfies',
            explanation:
              'Classic `: Record<string, string>` widens keys to `any string` so `cfg.primary` stops catching typos! Use `satisfies` to validate values while keeping exact keys intact.',
            code: ['const palette = {', '  accent: "#6E56CF",', '  danger: "#F85149",', '} satisfies Record<string, string>;', '// palette.accent is literal "#6E56CF"!'],
            highlightNote: '`palette.typo` becomes an immediate compile error when checked with `satisfies`.',
          },
          {
            type: 'token_builder',
            prompt: 'Verify all routes match `string` via `satisfies` without losing key autocomplete.',
            codeLines: ['const routes = {', '  home: "/",', '  sandbox: "/sandbox",', '} {{0}} Record<string, {{1}}>;'],
            expectedTokens: ['satisfies', 'string'],
            distractors: ['as', 'implements', 'any'],
            explanation: '`satisfies` validates value types while keeping `"home" | "sandbox"` keys exact.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `as` silences a missing property error instead of catching it.',
            lines: [
              'const cfg = { url: 123 } as { url: string };',
            ],
            bugLine: 0,
            fixed: 'const cfg = { url: "/api" } satisfies { url: string };',
            explanation: 'Using `as` hides type mismatches; `satisfies` reports `123` immediately.',
          },
          {
            type: 'multiple_choice',
            question: 'When is `satisfies` better than `: Type`?',
            options: [
              'When you want to preserve exact inferred keys/literals AND validate constraints',
              'When disabling strict checks',
              'When casting any to string',
              'Only in JSON files',
            ],
            answer: 0,
            explanation: '`satisfies` checks conformity while retaining precision inference.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: TypeScript Mastery',
        subtitle: 'Synthesize Pick, Omit, Awaited, ReturnType, and satisfies',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Derive safe public profile without `"hash"` and validate theme colors.',
            codeLines: [
              'type SafeProfile = {{0}}<User, "hash">;',
              'const theme = { bg: "#0A0A0C", fg: "#FAFAFA" } {{1}} Record<string, string>;',
            ],
            expectedTokens: ['Omit', 'satisfies'],
            distractors: ['Exclude', 'as', 'Pick'],
            explanation: '`Omit` protects secret fields while `satisfies` validates keys safely.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the bug trying to mutate a Readonly<State>.',
            lines: [
              'function lock(s: Readonly<{ count: number }>) {',
              '  s.count += 1;',
              '}',
            ],
            bugLine: 1,
            fixed: '  return { ...s, count: s.count + 1 };',
            explanation: '`Readonly<T>` rejects mutating `.count`; return a new object instead.',
          },
          {
            type: 'predict_output',
            prompt: 'What keys exist on `Pick<{ a: 1; b: 2; c: 3 }, "a" | "c">`?',
            code: ['type Res = Pick<{ a: 1; b: 2; c: 3 }, "a" | "c">;'],
            options: ['b only', 'a and c', 'a, b, and c'],
            answer: 1,
            explanation: '`Pick` keeps only the selected keys `"a"` and `"c"`.',
          },
        ],
      },
    ],
  },
];
