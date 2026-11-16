import { LangId } from './courses';

export const SYNTAX_SPRINT_TOTAL_LEVELS = 30;
export const SYNTAX_SPRINT_MAX_STARS = 90;
/** Star thresholds in seconds: [3-star (<18s & 0 mistakes), 2-star (<28s & <=1 mistake), 1-star (clear)] */
export const SYNTAX_SPRINT_STAR_THRESHOLDS: readonly [number, number, number] = [
  18, 28, 45,
];

export interface SyntaxSprintCard {
  id: string;
  filename: string;
  codeLines: string[];
  isValid: boolean;
  explanation: string;
}

export interface SyntaxSprintLevel {
  levelNumber: number;
  sector: 1 | 2 | 3;
  sectorTitle: string;
  title: string;
  isBoss: boolean;
  cardCount: number;
  starThresholds: readonly [number, number, number];
  xpReward: number;
  gemReward: number;
  cards: SyntaxSprintCard[];
}

export const SYNTAX_SPRINT_SECTORS: Record<
  1 | 2 | 3,
  { sector: 1 | 2 | 3; title: string; subtitle: string }
> = {
  1: {
    sector: 1,
    title: 'Declarations, Quotes & Brackets',
    subtitle: '5 cards per node · Spot missing quotes, parens & assignment traps',
  },
  2: {
    sector: 2,
    title: 'Loops, Functions & Signatures',
    subtitle: '7 cards per node · Colons, semicolons, headers & array syntax',
  },
  3: {
    sector: 3,
    title: 'Pointers, Closures & Deep Syntax',
    subtitle: '10 cards per node · Multi-line blocks, generics & registers',
  },
};

const LEVEL_TITLES: readonly string[] = [
  // Sector 01 (1-10)
  'Variable Bindings',
  'String Literal Traps',
  'Bracket & Paren Balance',
  'Comparison vs Assignment',
  'Boolean & Null Tokens',
  'Numeric & Hex Literals',
  'Array & List Literals',
  'Tuple & Key-Value Syntax',
  'Import & Include Headers',
  'BOSS: Sector 01 Gauntlet',
  // Sector 02 (11-20)
  'Function Signatures',
  'Return Statement Rules',
  'For-Loop Headers',
  'While & Guard Conditions',
  'If / Else Branch Blocks',
  'Switch & Match Clauses',
  'Method Chaining & Dots',
  'Slice & Range Indexing',
  'Lambda & Arrow Expressions',
  'BOSS: Sector 02 Gauntlet',
  // Sector 03 (21-30)
  'Struct & Class Definitions',
  'Pointers & Reference Syntax',
  'Async / Concurrent Blocks',
  'Error & Exception Handling',
  'Generics & Type Annotations',
  'Destructuring & Unpacking',
  'Comprehension & Stream Ops',
  'Memory & Register Addressing',
  'Macro & Decorator Rules',
  'BOSS: Master Syntax Trial',
];

const FILE_EXT: Record<LangId, string> = {
  python: 'py',
  cpp: 'cpp',
  js: 'js',
  go: 'go',
  asm: 'asm',
  java: 'java',
  rust: 'rs',
  sql: 'sql',
  c: 'c',
  ts: 'ts',
  css: 'css',
  html: 'html',
  php: 'php',
  swift: 'swift',
  kotlin: 'kt',
  julia: 'jl',
  lua: 'lua',
  csharp: 'cs',
};

interface RawSnippetPair {
  validLines: string[];
  validExplain: string;
  errorLines: string[];
  errorExplain: string;
}

const PYTHON_DECK: readonly RawSnippetPair[] = [
  {
    validLines: ['score = 42', 'username = "nova_01"', 'print(f"{username}: {score}")'],
    validExplain: 'Valid `f-string` interpolation and variable assignment.',
    errorLines: ['score = 42', 'username = "nova_01', 'print(username)'],
    errorExplain: 'Unclosed string literal `"nova_01` is missing its closing `"`.',
  },
  {
    validLines: ['def greet(name):', '    print(f"Hello, {name}!")', '    return True'],
    validExplain: 'Valid `def` header with trailing `:` and indented block.',
    errorLines: ['def greet(name)', '    print(f"Hello, {name}!")', '    return True'],
    errorExplain: 'Function header `def greet(name)` is missing the required trailing `:`.',
  },
  {
    validLines: ['items = [10, 20, 30, 40]', 'first_two = items[:2]', 'print(len(first_two))'],
    validExplain: 'Valid Python list literal and `[:2]` slice syntax.',
    errorLines: ['items = [10, 20, 30, 40)', 'print(len(items))'],
    errorExplain: 'Mismatched bracket: list opens with `[` but closes with `)`.',
  },
  {
    validLines: ['if status == "ready":', '    launch_engine()', 'else:', '    wait_tick()'],
    validExplain: 'Valid `if` / `else:` conditional using equality `==`.',
    errorLines: ['if status = "ready":', '    launch_engine()'],
    errorExplain: 'SyntaxError: cannot use single `=` assignment inside an `if` condition; use `==`.',
  },
  {
    validLines: ['for idx in range(0, 10, 2):', '    total += idx'],
    validExplain: 'Valid `for ... in range(start, stop, step):` loop.',
    errorLines: ['for idx in range(0, 10, 2)', '    total += idx'],
    errorExplain: 'Missing `:` at the end of the `for` loop header.',
  },
  {
    validLines: ['user = {"id": 7, "role": "admin"}', 'print(user.get("role"))'],
    validExplain: 'Valid dictionary literal with `:` key-value pairs.',
    errorLines: ['user = {"id" = 7, "role" = "admin"}', 'print(user["role"])'],
    errorExplain: 'Dictionary literals use `:` between keys and values, not `=`.',
  },
  {
    validLines: ['squares = [x * x for x in range(6) if x % 2 == 0]', 'print(squares)'],
    validExplain: 'Valid list comprehension with trailing `if` filter.',
    errorLines: ['squares = [for x in range(6): x * x]', 'print(squares)'],
    errorExplain: 'Invalid list comprehension order: expression `x * x` must precede `for`.',
  },
  {
    validLines: ['try:', '    val = int("42")', 'except ValueError as err:', '    val = 0'],
    validExplain: 'Valid `try:` / `except ValueError as err:` block.',
    errorLines: ['try:', '    val = int("42")', 'catch (ValueError err):', '    val = 0'],
    errorExplain: 'Python uses `except ValueError as err:`, not `catch (...)`.',
  },
  {
    validLines: ['calc = lambda a, b: (a + b) * 2', 'print(calc(3, 5))'],
    validExplain: 'Valid single-expression `lambda a, b:` function.',
    errorLines: ['calc = lambda (a, b) => (a + b) * 2', 'print(calc(3, 5))'],
    errorExplain: 'Python `lambda` uses `lambda a, b: expr`, not arrow `=>` syntax.',
  },
  {
    validLines: ['class Vector2D:', '    def __init__(self, x: float, y: float):', '        self.x = x', '        self.y = y'],
    validExplain: 'Valid `class` definition and typed `__init__` constructor.',
    errorLines: ['class Vector2D()', '    def __init__(self, x, y):', '        self.x = x'],
    errorExplain: '`class Vector2D` is missing the required trailing `:`.',
  },
  {
    validLines: ['a, b, *rest = [1, 2, 3, 4, 5]', 'print(a, b, rest)'],
    validExplain: 'Valid starred iterable unpacking `*rest`.',
    errorLines: ['*a, *b = [1, 2, 3, 4]', 'print(a, b)'],
    errorExplain: 'SyntaxError: multiple starred expressions `*a, *b` in assignment target.',
  },
  {
    validLines: ['async def fetch_packet(url: str) -> bytes:', '    data = await read_stream(url)', '    return data'],
    validExplain: 'Valid `async def` coroutine with `await` and return type annotation `-> bytes`.',
    errorLines: ['def fetch_packet(url: str) => bytes:', '    data = await read_stream(url)', '    return data'],
    errorExplain: 'Python return annotations use `->` (not `=>`) and `await` requires `async def`.',
  },
];

const CPP_DECK: readonly RawSnippetPair[] = [
  {
    validLines: ['#include <iostream>', 'int main() {', '  int count = 16;', '  std::cout << count << "\\n";', '}'],
    validExplain: 'Valid C++20 `main()` with `std::cout` stream output.',
    errorLines: ['#include <iostream>', 'int main() {', '  int count = 16', '  std::cout << count;', '}'],
    errorExplain: 'Missing semicolon `;` at the end of `int count = 16`.',
  },
  {
    validLines: ['std::vector<int> nums = {4, 8, 15, 16};', 'nums.push_back(23);'],
    validExplain: 'Valid brace-initialized `std::vector<int>` and `push_back` call.',
    errorLines: ['std::vector<int> nums = [4, 8, 15, 16];', 'nums.push_back(23);'],
    errorExplain: 'C++ initializer lists require curly braces `{...}`, not square brackets `[...]`.',
  },
  {
    validLines: ['for (int i = 0; i < 10; ++i) {', '  sum += i;', '}'],
    validExplain: 'Valid C++ `for (init; cond; step)` loop.',
    errorLines: ['for (int i = 0, i < 10, ++i) {', '  sum += i;', '}'],
    errorExplain: 'C++ `for` clauses must be separated by `;`, not commas `,`.',
  },
  {
    validLines: ['int val = 42;', 'int* ptr = &val;', '*ptr += 8;'],
    validExplain: 'Valid address-of `&val` and pointer dereference `*ptr`.',
    errorLines: ['int val = 42;', 'int* ptr = *val;', '&ptr = 50;'],
    errorExplain: 'Cannot dereference non-pointer `*val` or assign to rvalue `&ptr`.',
  },
  {
    validLines: ['auto cmp = [](int a, int b) -> bool {', '  return a > b;', '};'],
    validExplain: 'Valid C++ lambda with capture list `[]` and trailing `-> bool`.',
    errorLines: ['auto cmp = (int a, int b) => {', '  return a > b;', '};'],
    errorExplain: 'C++ lambdas require capture brackets `[](int a, int b) { ... }`, not `=>`.',
  },
  {
    validLines: ['struct Node {', '  int key;', '  Node* next = nullptr;', '};'],
    validExplain: 'Valid `struct` declaration terminated with `};`.',
    errorLines: ['struct Node {', '  int key;', '  Node* next = nullptr;', '}'],
    errorExplain: 'C++ `struct` and `class` declarations must end with a semicolon `};`.',
  },
  {
    validLines: ['if (ptr != nullptr && *ptr > 0) {', '  process(*ptr);', '}'],
    validExplain: 'Valid short-circuit null check before pointer dereference.',
    errorLines: ['if (ptr !== nullptr and *ptr > 0) {', '  process(*ptr);', '}'],
    errorExplain: 'C++ uses `!=` for inequality, not JavaScript `!==`.',
  },
  {
    validLines: ['template <typename T>', 'T clamp_val(T x, T lo, T hi) {', '  return x < lo ? lo : (x > hi ? hi : x);', '}'],
    validExplain: 'Valid `template <typename T>` generic function.',
    errorLines: ['template <T>', 'T clamp_val(T x, T lo, T hi) {', '  return x;', '}'],
    errorExplain: 'Template parameter list requires `typename T` or `class T` inside `<...>`.',
  },
  {
    validLines: ['for (const auto& item : registry) {', '  std::cout << item.id << "\\n";', '}'],
    validExplain: 'Valid range-based `for (const auto& item : container)` loop.',
    errorLines: ['for (const auto& item in registry) {', '  std::cout << item.id << "\\n";', '}'],
    errorExplain: 'C++ range-for loops use `:`, not the keyword `in`.',
  },
  {
    validLines: ['std::unique_ptr< int > buf = std::make_unique<int>(99);', 'std::cout << *buf;'],
    validExplain: 'Valid RAII smart pointer creation via `std::make_unique<int>`.',
    errorLines: ['std::unique_ptr<int> buf = new int(99);', 'delete buf;'],
    errorExplain: '`std::unique_ptr` constructor from raw `new` is `explicit`, and `delete` cannot be called on a smart pointer.',
  },
];

const JS_TS_DECK: readonly RawSnippetPair[] = [
  {
    validLines: ['const scores = [12, 24, 36];', 'const doubled = scores.map((n) => n * 2);', 'console.log(doubled);'],
    validExplain: 'Valid `const` array and `.map((n) => n * 2)` arrow callback.',
    errorLines: ['const scores = [12, 24, 36];', 'const doubled = scores.map((n) -> n * 2);'],
    errorExplain: 'JavaScript/TypeScript arrow functions use `=>`, not `->`.',
  },
  {
    validLines: ['const { id, name = "guest" } = payload;', 'console.log(`${id}: ${name}`);'],
    validExplain: 'Valid object destructuring with default value and template literal.',
    errorLines: ['const { id, name: "guest" } = payload;', 'console.log(id, name);'],
    errorExplain: 'Destructuring default values use `=`, whereas `:` renames the binding (`name: alias`).',
  },
  {
    validLines: ['async function loadUser(id) {', '  const res = await fetch(`/api/${id}`);', '  return res.json();', '}'],
    validExplain: 'Valid `async function` using `await` and backtick template string.',
    errorLines: ['function loadUser(id) {', '  const res = await fetch(`/api/${id}`);', '  return res.json();', '}'],
    errorExplain: '`await` is only valid inside an `async` function or top-level ES module.',
  },
  {
    validLines: ['const total = items.reduce((acc, cur) => acc + cur.price, 0);'],
    validExplain: 'Valid `.reduce()` accumulator with initial value `0`.',
    errorLines: ['const total = items.reduce((acc, cur) => { acc + cur.price }, 0);'],
    errorExplain: 'Block-body arrow `{ acc + cur.price }` is missing `return`, returning `undefined`.',
  },
  {
    validLines: ['if (status === "active" && retries < 3) {', '  dispatchJob();', '}'],
    validExplain: 'Valid strict equality `===` and logical AND `&&`.',
    errorLines: ['if (status === "active" and retries < 3) {', '  dispatchJob();', '}'],
    errorExplain: 'JavaScript uses `&&` for logical AND, not the keyword `and`.',
  },
  {
    validLines: ['const merged = { ...defaults, ...overrides, updatedAt: Date.now() };'],
    validExplain: 'Valid object spread `...` syntax.',
    errorLines: ['const merged = { **defaults, **overrides };'],
    errorExplain: 'JavaScript object spread uses `...obj`, not Python `**obj`.',
  },
  {
    validLines: ['for (const [key, val] of Object.entries(config)) {', '  console.log(key, val);', '}'],
    validExplain: 'Valid `for (const [k, v] of Object.entries(...))` iteration.',
    errorLines: ['for (const [key, val] in Object.entries(config)) {', '  console.log(key, val);', '}'],
    errorExplain: '`for...in` iterates string keys and cannot destructure `[key, val]` entries cleanly like `for...of`.',
  },
  {
    validLines: ['const port = Number(process.env.PORT ?? 8080);'],
    validExplain: 'Valid nullish coalescing operator `??`.',
    errorLines: ['const port = Number(process.env.PORT ?: 8080);'],
    errorExplain: 'JavaScript does not have an Elvis `?:` operator; use `??` or `||`.',
  },
];

const GO_DECK: readonly RawSnippetPair[] = [
  {
    validLines: ['package main', 'import "fmt"', 'func main() {', '  msg := "ready"', '  fmt.Println(msg)', '}'],
    validExplain: 'Valid Go `:=` short variable declaration inside `main()`.',
    errorLines: ['package main', 'import "fmt"', 'msg := "ready"', 'func main() {', '  fmt.Println(msg)', '}'],
    errorExplain: 'Short declaration `:=` is only valid inside functions; package scope requires `var msg = ...`.',
  },
  {
    validLines: ['nums := []int{2, 4, 8, 16}', 'for idx, val := range nums {', '  fmt.Println(idx, val)', '}'],
    validExplain: 'Valid Go slice literal `[]int{...}` and `for i, v := range` loop.',
    errorLines: ['nums := []int[2, 4, 8, 16]', 'for idx, val in nums {', '  fmt.Println(idx, val)', '}'],
    errorExplain: 'Go slice literals use curly braces `[]int{...}` and loops use `:= range`, not `in`.',
  },
  {
    validLines: ['func divide(a, b float64) (float64, error) {', '  if b == 0 {', '    return 0, fmt.Errorf("div by zero")', '  }', '  return a / b, nil', '}'],
    validExplain: 'Valid Go multi-value return `(float64, error)`.',
    errorLines: ['func divide(a, b float64): (float64, error) {', '  return a / b, nil', '}'],
    errorExplain: 'Go function signatures do not use `:` before the return type.',
  },
  {
    validLines: ['ch := make(chan int, 4)', 'ch <- 42', 'val := <-ch'],
    validExplain: 'Valid buffered channel `make(chan int, 4)` send and receive.',
    errorLines: ['ch := make(chan int, 4)', 'ch -> 42', 'val := ->ch'],
    errorExplain: 'Go channel send and receive always use left arrow `<-`, never `->`.',
  },
  {
    validLines: ['counts := map[string]int{"ok": 1, "err": 0}', 'if v, exists := counts["ok"]; exists {', '  fmt.Println(v)', '}'],
    validExplain: 'Valid Go comma-ok map lookup with `if` initializer.',
    errorLines: ['counts := map<string, int>{"ok": 1}', 'fmt.Println(counts["ok"])'],
    errorExplain: 'Go map types use `map[KeyType]ValueType`, not angle brackets `<...>`.',
  },
];

const ASM_DECK: readonly RawSnippetPair[] = [
  {
    validLines: ['section .text', 'global _start', '_start:', '  mov rax, 60', '  xor rdi, rdi', '  syscall'],
    validExplain: 'Valid x86_64 NASM `_start` routine calling `sys_exit` (`rax = 60`).',
    errorLines: ['section .text', 'global _start', '_start', '  mov 60, rax', '  syscall'],
    errorExplain: 'Label `_start:` is missing its colon and Intel `mov` cannot have an immediate `60` as destination.',
  },
  {
    validLines: ['push rbp', 'mov rbp, rsp', 'sub rsp, 16', 'mov DWORD [rbp-4], 42'],
    validExplain: 'Valid x86_64 stack frame prologue and local `[rbp-4]` store.',
    errorLines: ['push rbp', 'mov rbp, rsp', 'mov [rbp-4] [rsp], 42'],
    errorExplain: 'Invalid memory operand: x86 cannot address two memory brackets in one instruction.',
  },
  {
    validLines: ['mov rcx, 5', '.loop_head:', '  add rax, rcx', '  dec rcx', '  jnz .loop_head'],
    validExplain: 'Valid local label `.loop_head:` and `dec rcx` / `jnz` counter loop.',
    errorLines: ['mov rcx, 5', '.loop_head:', '  add rax, rcx', '  jnz rcx == 0'],
    errorExplain: '`jnz` takes a target label (`.loop_head`), not a boolean expression `rcx == 0`.',
  },
  {
    validLines: ['cmp rdi, rsi', 'cmovg rax, rdi', 'ret'],
    validExplain: 'Valid `cmp` followed by conditional move `cmovg` and `ret`.',
    errorLines: ['cmp 10, 20', 'cmovg rax, 10', 'ret'],
    errorExplain: '`cmp` first operand and `cmovg` source operand cannot be immediate constants.',
  },
];

const RUST_DECK: readonly RawSnippetPair[] = [
  {
    validLines: ['fn main() {', '  let mut total = 0;', '  for n in 1..=5 {', '    total += n;', '  }', '  println!("total = {}", total);', '}'],
    validExplain: 'Valid `let mut`, inclusive range `1..=5`, and `println!` macro.',
    errorLines: ['fn main() {', '  let total = 0;', '  for n in 1..=5 {', '    total += n;', '  }', '  println("total = {}", total);', '}'],
    errorExplain: '`total` is missing `mut` and `println!` requires the macro bang `!`.',
  },
  {
    validLines: ['fn first_item(slice: &[i32]) -> Option<i32> {', '  slice.first().copied()', '}'],
    validExplain: 'Valid Rust slice borrow `&[i32]` and implicit tail return expression.',
    errorLines: ['fn first_item(slice: &[i32]) -> Option<i32> {', '  slice.first().copied();', '}'],
    errorExplain: 'Trailing `;` turns the tail expression into a `()` statement, mismatching `Option<i32>`.',
  },
];

function getLanguageDeck(lang: LangId): readonly RawSnippetPair[] {
  switch (lang) {
    case 'python':
    case 'julia':
    case 'lua':
      return PYTHON_DECK;
    case 'cpp':
    case 'c':
    case 'java':
    case 'csharp':
      return CPP_DECK;
    case 'js':
    case 'ts':
    case 'swift':
    case 'kotlin':
    case 'php':
      return JS_TS_DECK;
    case 'go':
      return GO_DECK;
    case 'asm':
      return ASM_DECK;
    case 'rust':
      return RUST_DECK;
    default:
      return PYTHON_DECK;
  }
}

export function computeSyntaxSprintStars(
  elapsedMs: number,
  mistakes: number,
  thresholds: readonly [number, number, number] = SYNTAX_SPRINT_STAR_THRESHOLDS,
): 1 | 2 | 3 {
  const sec = elapsedMs / 1000;
  if (mistakes === 0 && sec <= thresholds[0]) return 3;
  if (mistakes <= 1 && sec <= thresholds[1]) return 2;
  return 1;
}

export function getSyntaxSprintLevel(
  lang: LangId,
  levelNumber: number,
): SyntaxSprintLevel {
  const safeNum = Math.max(1, Math.min(SYNTAX_SPRINT_TOTAL_LEVELS, levelNumber));
  const sector: 1 | 2 | 3 = safeNum <= 10 ? 1 : safeNum <= 20 ? 2 : 3;
  const isBoss = safeNum === 10 || safeNum === 20 || safeNum === 30;
  const baseCardCount = sector === 1 ? 5 : sector === 2 ? 7 : 10;
  const cardCount = isBoss ? baseCardCount + 2 : baseCardCount;
  const ext = FILE_EXT[lang] ?? 'py';
  const deck = getLanguageDeck(lang);

  const cards: SyntaxSprintCard[] = [];
  for (let i = 0; i < cardCount; i += 1) {
    const pairIdx = (safeNum * 3 + i * 5) % deck.length;
    const pair = deck[pairIdx];
    // Deterministic alternating valid/invalid pattern per level & card index
    const isValid = (safeNum + i * 2) % 3 !== 0;
    const numStr = String(i + 1).padStart(2, '0');
    cards.push({
      id: `${lang}-sprint-${safeNum}-c${i + 1}`,
      filename: `snippet_${numStr}.${ext}`,
      codeLines: isValid ? pair.validLines : pair.errorLines,
      isValid,
      explanation: isValid ? pair.validExplain : pair.errorExplain,
    });
  }

  const starThresholds: readonly [number, number, number] =
    sector === 1 ? [16, 26, 42] : sector === 2 ? [20, 32, 48] : [26, 38, 55];

  return {
    levelNumber: safeNum,
    sector,
    sectorTitle: SYNTAX_SPRINT_SECTORS[sector].title,
    title: LEVEL_TITLES[safeNum - 1] ?? `Syntax Sprint ${safeNum}`,
    isBoss,
    cardCount,
    starThresholds,
    xpReward: isBoss ? 50 : 20 + sector * 5,
    gemReward: isBoss ? 25 : 6 + sector * 2,
    cards,
  };
}

export function getSyntaxSprintLevels(lang: LangId): SyntaxSprintLevel[] {
  const list: SyntaxSprintLevel[] = [];
  for (let lvl = 1; lvl <= SYNTAX_SPRINT_TOTAL_LEVELS; lvl += 1) {
    list.push(getSyntaxSprintLevel(lang, lvl));
  }
  return list;
}
