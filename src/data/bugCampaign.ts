import { LANGUAGES } from './curriculum';
import { LangId } from './types';

export const BUG_CAMPAIGN_TOTAL_LEVELS = 30;
export const BUG_CAMPAIGN_MAX_STARS = 90;
export const BUG_CAMPAIGN_BUGS_PER_LEVEL = 3;
export const BUG_CAMPAIGN_STAR_THRESHOLDS: [number, number, number] = [
  15, 25, 40,
];

export type BugSectorId = 1 | 2 | 3;

export interface BugCampaignSectorMeta {
  sector: BugSectorId;
  code: string;
  title: string;
  headerLabel: string;
}

export const BUG_CAMPAIGN_SECTORS: Record<BugSectorId, BugCampaignSectorMeta> = {
  1: {
    sector: 1,
    code: 'SECTOR 01',
    title: 'Syntax & Operator Glitches',
    headerLabel: 'SECTOR 01 • SYNTAX & OPERATOR GLITCHES',
  },
  2: {
    sector: 2,
    code: 'SECTOR 02',
    title: 'Loop Bounds & Off-By-One Traps',
    headerLabel: 'SECTOR 02 • LOOP BOUNDS & OFF-BY-ONE TRAPS',
  },
  3: {
    sector: 3,
    code: 'SECTOR 03',
    title: 'Memory, Pointers & Deep Logic Bugs',
    headerLabel: 'SECTOR 03 • MEMORY, POINTERS & DEEP LOGIC',
  },
};

export interface BugCampaignSnippet {
  filename: string;
  codeLines: string[];
  bugLine: number;
  explanation: string;
}

export interface BugCampaignLevel {
  id: string;
  lang: LangId;
  levelNumber: number; // 1..30
  title: string;
  sector: BugSectorId;
  sectorTitle: string;
  filename: string;
  codeLines: string[];
  bugLine: number;
  explanation: string;
  starThresholds: [number, number, number];
  isBoss: boolean;
  xpReward: number;
  gemReward: number;
  stages: [BugCampaignSnippet, BugCampaignSnippet, BugCampaignSnippet];
}

interface RawCampaignSeed {
  title: string;
  sectorHint: BugSectorId;
  codeLines: string[];
  bugLine: number;
  explanation: string;
  isBossCandidate?: boolean;
}

const FILE_EXT_BY_LANG: Record<LangId, string> = {
  python: 'py',
  cpp: 'cpp',
  js: 'js',
  go: 'go',
  java: 'java',
  rust: 'rs',
  sql: 'sql',
  c: 'c',
  ts: 'ts',
  css: 'css',
  html: 'html',
  php: 'php',
  asm: 'asm',
  swift: 'swift',
  kotlin: 'kt',
  julia: 'jl',
  lua: 'lua',
  csharp: 'cs',
};

function makeSeed(
  sectorHint: BugSectorId,
  title: string,
  codeLines: string[],
  bugLine: number,
  explanation: string,
  isBossCandidate = false,
): RawCampaignSeed {
  return {
    title,
    sectorHint,
    codeLines,
    bugLine,
    explanation,
    isBossCandidate,
  };
}

/**
 * Curated progressive Sector 1/2/3 & Boss bug levels tailored to each of the 18
 * languages (combined with curriculum unit bugs for rich, non-repeating 30-level tracks).
 */
const EXTRA_BUG_BANK: Record<LangId, RawCampaignSeed[]> = {
  python: [
    makeSeed(
      1,
      'Assignment vs Equality',
      ['lives = 3', 'if lives = 0:', '    print("Game Over")'],
      1,
      'Comparisons inside `if` require `==`, whereas `=` assigns a value.',
    ),
    makeSeed(
      1,
      'String + Integer Mix',
      ['level = 5', 'badge = "LVL " + level', 'print(badge)'],
      1,
      'Wrap `level` in `str(level)` before concatenating strings with `+`.',
    ),
    makeSeed(
      2,
      'Off-By-One Range',
      [
        'def find_items(arr):',
        '    out = []',
        '    for i in range(1, len(arr) + 1):',
        '        out.append(arr[i])',
        '    return out',
      ],
      2,
      '`range(1, len(arr) + 1)` skips index `0` and hits `IndexError` on `arr[len(arr)]`.',
    ),
    makeSeed(
      2,
      'Stagnant While Loop',
      ['n = 4', 'while n > 0:', '    print(n)', '    n += 1'],
      3,
      'Incrementing `n += 1` moves away from `0` and triggers an infinite loop instead of `n -= 1`.',
    ),
    makeSeed(
      2,
      'Mutating Iterated List',
      [
        'nums = [1, 2, 3, 4]',
        'for x in nums:',
        '    if x % 2 == 0:',
        '        nums.remove(x)',
      ],
      3,
      'Removing from `nums` during `for x in nums` shifts indices and skips elements.',
    ),
    makeSeed(
      2,
      'Exclusive Upper Bound',
      ['total = 0', 'for k in range(1, 5):', '    total += k', 'print(total == 15)'],
      1,
      '`range(1, 5)` stops at `4`; pass `range(1, 6)` to include `5`.',
    ),
    makeSeed(
      2,
      'Slice Step Reversal',
      ['tags = ["a", "b", "c", "d"]', 'mid = tags[3:1:1]', 'print(mid)'],
      1,
      'Slicing from index `3` down to `1` with positive step `+1` returns `[]`; use `-1`.',
    ),
    makeSeed(
      3,
      'Mutable Default Trap',
      [
        'def push_log(msg, buf=[]):',
        '    buf.append(msg)',
        '    return buf',
      ],
      0,
      'Default list `buf=[]` is shared across every call; default to `None` instead.',
    ),
    makeSeed(
      3,
      'Shallow Matrix Alias',
      [
        'grid = [[0] * 3] * 3',
        'grid[0][1] = 9',
        'print(grid[1][1])',
      ],
      0,
      '`[[0] * 3] * 3` aliases the same inner row list three times across all rows.',
    ),
    makeSeed(
      3,
      'Late Binding Closure',
      [
        'fns = [lambda: i for i in range(3)]',
        'print(fns[0](), fns[2]())',
      ],
      0,
      'Every `lambda` captures the loop variable `i` by reference; bind `i=i` as a default arg.',
    ),
    makeSeed(
      3,
      'Exhausted Generator',
      [
        'gen = (x * 2 for x in [1, 2, 3])',
        'first = sum(gen)',
        'second = list(gen)',
      ],
      2,
      'A generator is single-pass; after `sum(gen)` consumes it, `list(gen)` yields `[]`.',
    ),
    makeSeed(
      3,
      'Identity vs Value',
      ['a = 1000', 'b = 1000', 'if a is b:', '    print("Match")'],
      2,
      '`is` checks object identity rather than equality; compare integers with `==`.',
    ),
    makeSeed(
      3,
      'Unbound Local Shadow',
      [
        'count = 10',
        'def bump():',
        '    count += 1',
        'bump()',
      ],
      2,
      'Assigning `count += 1` marks `count` local without `global count` and raises `UnboundLocalError`.',
    ),
    makeSeed(
      3,
      'Tuple Comma Pitfall',
      ['single = ("py")', 'print(type(single))'],
      0,
      'Without a trailing comma, `("py")` evaluates to a `str` instead of a `tuple`.',
      true,
    ),
    makeSeed(
      3,
      'Dict Key Mutation',
      ['seen = {}', 'key = [1, 2]', 'seen[key] = True'],
      2,
      'Lists are unhashable (`TypeError`); convert `key` to a `tuple` before indexing `dict`.',
      true,
    ),
  ],
  cpp: [
    makeSeed(
      1,
      'Assignment in If',
      ['int hp = 100;', 'if (hp = 0) {', '    std::cout << "KO";', '}'],
      1,
      'Single `=` assigns `0` inside the condition; use `==` for equality checks.',
    ),
    makeSeed(
      1,
      'Integer Division Loss',
      ['int a = 5, b = 2;', 'double ratio = a / b;', 'std::cout << ratio;'],
      1,
      '`a / b` performs integer division (`2`); cast `static_cast<double>(a)` first.',
    ),
    makeSeed(
      2,
      'Vector Bounds Overrun',
      [
        'std::vector<int> v = {2, 4, 6};',
        'for (int i = 0; i <= v.size(); ++i) {',
        '    sum += v[i];',
        '}',
      ],
      1,
      '`i <= v.size()` reads one element past `v`; loop strictly with `i < v.size()`.',
    ),
    makeSeed(
      2,
      'Unsigned Loop Underflow',
      [
        'std::vector<int> items = {10, 20};',
        'for (size_t i = items.size() - 1; i >= 0; --i) {',
        '    std::cout << items[i];',
        '}',
      ],
      1,
      'Decrementing `size_t` below `0` wraps around to `SIZE_MAX`, causing an infinite loop.',
    ),
    makeSeed(
      2,
      'Iterator Invalidation',
      [
        'std::vector<int> nums = {1, 2, 3};',
        'for (auto it = nums.begin(); it != nums.end(); ++it) {',
        '    if (*it == 2) nums.push_back(9);',
        '}',
      ],
      2,
      '`push_back` may reallocate `nums` and invalidate the active iterator `it`.',
    ),
    makeSeed(
      2,
      'Post-Decrement Skip',
      [
        'int steps = 3;',
        'while (steps-- > 0)',
        '    if (steps == 3) break;',
      ],
      2,
      '`steps--` evaluates to `3` then decrements to `2` before entering the loop body.',
    ),
    makeSeed(
      3,
      'Dangling Stack Pointer',
      [
        'int* makePtr() {',
        '    int local = 42;',
        '    return &local;',
        '}',
      ],
      2,
      '`local` is destroyed when `makePtr()` returns, leaving the returned pointer dangling.',
    ),
    makeSeed(
      3,
      'Wild Null Dereference',
      ['int* ptr = nullptr;', '*ptr = 10;', 'std::cout << *ptr;'],
      1,
      'Writing `*ptr` while `ptr` is `nullptr` triggers immediate undefined behavior / segfault.',
    ),
    makeSeed(
      3,
      'Double Delete Heap',
      ['int* p = new int(7);', 'delete p;', 'delete p;'],
      2,
      'Calling `delete p` twice corrupts the heap allocator; set `p = nullptr` or use `unique_ptr`.',
    ),
    makeSeed(
      3,
      'Missing Virtual Dtor',
      [
        'class Base {',
        'public:',
        '    ~Base() {}',
        '};',
      ],
      2,
      'Non-virtual `~Base()` causes derived resources to leak when deleted via `Base*`.',
      true,
    ),
    makeSeed(
      3,
      'Move After Use',
      [
        'std::string name = "Ada";',
        'auto owner = std::move(name);',
        'std::cout << name.at(0);',
      ],
      2,
      '`std::move(name)` empties `name`, so `name.at(0)` throws `std::out_of_range`.',
      true,
    ),
  ],
  js: [
    makeSeed(
      1,
      'Loose Coercion Trap',
      ['const input = "0";', 'if (input == false) {', '  launch();', '}'],
      1,
      '`==` coerces `"0"` to `0` and equals `false`; use strict equality `===`.',
    ),
    makeSeed(
      1,
      'Reassigning Const',
      ['const combo = 1;', 'combo += 1;', 'console.log(combo);'],
      1,
      'Variables declared with `const` cannot be reassigned; switch to `let`.',
    ),
    makeSeed(
      1,
      'Implicit String Math',
      ['const price = "10";', 'const total = price + 5;', 'console.log(total);'],
      1,
      '`"10" + 5` performs string concatenation (`"105"`); parse with `Number(price)`.',
    ),
    makeSeed(
      2,
      'Array End Overrun',
      [
        'const ids = [101, 102, 103];',
        'for (let i = 0; i <= ids.length; i++) {',
        '  process(ids[i]);',
        '}',
      ],
      1,
      '`i <= ids.length` passes `undefined` on the final iteration; use `i < ids.length`.',
    ),
    makeSeed(
      2,
      'Lexicographic Sort Bug',
      ['const scores = [10, 2, 30];', 'scores.sort();', 'console.log(scores);'],
      1,
      '`Array.prototype.sort()` compares elements as strings (`"10"` before `"2"`); pass `(a, b) => a - b`.',
    ),
    makeSeed(
      2,
      'For-In Array Key',
      [
        'const arr = ["a", "b"];',
        'for (const item in arr) {',
        '  greet(item.toUpperCase());',
        '}',
      ],
      1,
      '`for...in` iterates string indices (`"0"`, `"1"`); use `for...of` to read array values.',
    ),
    makeSeed(
      2,
      'Missing Map Return',
      [
        'const nums = [1, 2, 3];',
        'const doubled = nums.map(n => { n * 2 });',
        'console.log(doubled);',
      ],
      1,
      'Curly braces `{ ... }` create a block without an explicit `return`, producing `[undefined, ...]`.',
    ),
    makeSeed(
      2,
      'Skipped Splice Element',
      [
        'const q = [1, 2, 3, 4];',
        'for (let i = 0; i < q.length; i++) {',
        '  if (q[i] > 0) q.splice(i, 1);',
        '}',
      ],
      2,
      'Splicing at `i` shifts the next item down to index `i` before `i++` skips it.',
    ),
    makeSeed(
      3,
      'Var Closure Leak',
      [
        'for (var i = 0; i < 3; i++) {',
        '  setTimeout(() => console.log(i), 10);',
        '}',
      ],
      0,
      '`var` is function-scoped, so all callbacks log `3`; declare with block-scoped `let`.',
    ),
    makeSeed(
      3,
      'Floating Promise Read',
      [
        'async function loadUser() {',
        '  const res = fetch("/api/me");',
        '  return res.json();',
        '}',
      ],
      1,
      '`fetch()` returns a `Promise`, not a `Response`; prepend `await` before calling `.json()`.',
    ),
    makeSeed(
      3,
      'NaN Equality Fail',
      ['const val = Number("abc");', 'if (val === NaN) {', '  fallback();', '}'],
      1,
      '`NaN === NaN` is always `false` in JavaScript; check with `Number.isNaN(val)`.',
    ),
    makeSeed(
      3,
      'Lost Method Context',
      [
        'const bot = { id: 7, ping() { return this.id; } };',
        'const fn = bot.ping;',
        'fn();',
      ],
      2,
      'Calling detached `fn()` loses the receiver `bot`, leaving `this` undefined.',
    ),
    makeSeed(
      3,
      'Shared Nested Reference',
      [
        'const base = { stats: { xp: 10 } };',
        'const clone = { ...base };',
        'clone.stats.xp = 99;',
      ],
      1,
      'Object spread `{ ...base }` is shallow, so `clone.stats` mutates `base.stats` directly.',
    ),
    makeSeed(
      3,
      'Reduce Missing Seed',
      ['const empty = [];', 'const total = empty.reduce((a, b) => a + b);'],
      1,
      'Calling `.reduce()` on an empty array without an initial value throws `TypeError`.',
      true,
    ),
    makeSeed(
      3,
      'Await Inside ForEach',
      [
        'async function saveAll(list) {',
        '  list.forEach(async (item) => { await db.save(item); });',
        '  return "saved";',
        '}',
      ],
      1,
      '`forEach` ignores async callbacks and returns before `await db.save` finishes; use `for...of`.',
      true,
    ),
    makeSeed(
      1,
      'Null Typeof Gotcha',
      ['const data = null;', 'if (typeof data === "null") {', '  reset();', '}'],
      1,
      '`typeof null` evaluates to `"object"`, not `"null"`; compare `data === null`.',
      true,
    ),
    makeSeed(
      2,
      'Async Stale Length',
      ['let i = 0;', 'while (i <= 5); {', '  i++;', '}'],
      1,
      'A stray `;` right after `while (i <= 5)` creates an empty infinite spin loop.',
      true,
    ),
  ],
  go: [
    makeSeed(
      1,
      'Short Var Shadow',
      [
        'count := 5',
        'if true {',
        '    count := 10',
        '}',
        'fmt.Println(count)',
      ],
      2,
      '`:=` inside `if` declares a new inner `count` variable instead of updating the outer one.',
    ),
    makeSeed(
      1,
      'Unused Export Import',
      ['package main', 'import "fmt"', 'func main() {', '    println("hi")', '}'],
      1,
      'Unused import `"fmt"` fails compilation in Go; remove it or call `fmt.Println`.',
    ),
    makeSeed(
      2,
      'Slice End Index Trap',
      [
        'nums := []int{10, 20, 30}',
        'for i := 0; i <= len(nums); i++ {',
        '    fmt.Println(nums[i])',
        '}',
      ],
      1,
      '`i <= len(nums)` panics with index out of range; iterate while `i < len(nums)`.',
    ),
    makeSeed(
      2,
      'Range Key vs Value',
      [
        'tags := []string{"go", "rust"}',
        'for tag := range tags {',
        '    fmt.Println(len(tag))',
        '}',
      ],
      1,
      'Single-variable `range tags` binds the integer index, not the string value; use `for _, tag := range tags`.',
    ),
    makeSeed(
      2,
      'Pointer Capture Loop',
      [
        'var ptrs []*int',
        'for _, v := range []int{1, 2} {',
        '    val := v',
        '    ptrs = append(ptrs, val)',
        '}',
      ],
      3,
      '`ptrs` expects `*int` pointers, so pass `&val` when appending to `ptrs`.',
    ),
    makeSeed(
      2,
      'Map Iteration Order',
      [
        'items := []int{4, 5, 6}',
        'for i := len(items); i > 0; i-- {',
        '    fmt.Println(items[i])',
        '}',
      ],
      2,
      '`i` starts at `len(items)` (`3`), causing an immediate panic on `items[3]`.',
    ),
    makeSeed(
      3,
      'Nil Map Write Panic',
      ['var cache map[string]int', 'cache["xp"] = 50', 'fmt.Println(cache)'],
      1,
      'Writing into a `nil` map panics at runtime; allocate it first with `make(map[string]int)`.',
    ),
    makeSeed(
      3,
      'Unbuffered Deadlock',
      [
        'ch := make(chan int)',
        'ch <- 42',
        'fmt.Println(<-ch)',
      ],
      1,
      'Sending onto an unbuffered channel on the same goroutine blocks forever without a receiver.',
    ),
    makeSeed(
      3,
      'Value Receiver Mutation',
      [
        'type Bot struct { Energy int }',
        'func (b Bot) Boost() { b.Energy += 10 }',
        'func main() { Bot{}.Boost() }',
      ],
      1,
      'A value receiver `(b Bot)` mutates only a copy; use pointer receiver `(b *Bot)`.',
    ),
    makeSeed(
      3,
      'Close Already Closed',
      ['ch := make(chan int, 1)', 'close(ch)', 'close(ch)'],
      2,
      'Closing an already-closed channel triggers a runtime panic in Go.',
    ),
    makeSeed(
      3,
      'Append Shared Backing',
      [
        'base := []int{1, 2, 3, 4}',
        'sub := base[:2]',
        'sub = append(sub, 99)',
        'fmt.Println(base[2])',
      ],
      2,
      '`sub` still shares `base` backing array capacity, overwriting `base[2]` with `99`.',
    ),
    makeSeed(
      3,
      'Defer Loop Resource Leak',
      [
        'for _, path := range files {',
        '    f, _ := os.Open(path)',
        '    defer f.Close()',
        '}',
      ],
      2,
      '`defer` runs only when the enclosing function returns, keeping every file descriptor open.',
      true,
    ),
    makeSeed(
      3,
      'Interface Nil Check',
      [
        'var err *MyError = nil',
        'var out error = err',
        'if out != nil { handle(out) }',
      ],
      1,
      'Storing a typed `nil` pointer inside `error` leaves `out != nil` true (`(*MyError, nil)`).',
      true,
    ),
    makeSeed(
      1,
      'String Index Byte',
      ['s := "hello"', 's[0] = \'H\'', 'fmt.Println(s)'],
      1,
      'Strings in Go are immutable; convert to `[]byte` or build a new string instead of `s[0] =`.',
      true,
    ),
    makeSeed(
      2,
      'WaitGroup Missing Add',
      [
        'var wg sync.WaitGroup',
        'go func() { defer wg.Done() }()',
        'wg.Wait()',
      ],
      1,
      'Calling `wg.Done()` without `wg.Add(1)` causes a negative WaitGroup counter panic.',
      true,
    ),
  ],
  java: [
    makeSeed(
      2,
      'Off-By-One Array Loop',
      [
        'int[] pts = {10, 20, 30};',
        'for (int i = 0; i <= pts.length; i++) {',
        '    System.out.println(pts[i]);',
        '}',
      ],
      1,
      '`i <= pts.length` throws `ArrayIndexOutOfBoundsException`; stop at `i < pts.length`.',
    ),
    makeSeed(
      3,
      'String Reference Equals',
      [
        'String cmd = new String("run");',
        'if (cmd == "run") {',
        '    execute();',
        '}',
      ],
      1,
      '`==` checks object references in Java; compare string text with `cmd.equals("run")`.',
    ),
    makeSeed(
      3,
      'Concurrent List Modify',
      [
        'for (Integer x : list) {',
        '    if (x == 0) list.remove(x);',
        '}',
      ],
      1,
      'Calling `list.remove(x)` inside enhanced `for` throws `ConcurrentModificationException`.',
      true,
    ),
  ],
  rust: [
    makeSeed(
      2,
      'Exclusive Range Bounds',
      ['for n in 1..5 {', '    sum += n;', '}', 'assert_eq!(sum, 15);'],
      0,
      '`1..5` excludes `5` (`1+2+3+4 = 10`); use inclusive `1..=5`.',
    ),
    makeSeed(
      2,
      'Vec Out-Of-Bounds Index',
      ['let v = vec![10, 20];', 'for i in 0..=v.len() {', '    dbg!(v[i]);', '}'],
      1,
      '`0..=v.len()` indexes `v[2]`, which panics at runtime; iterate over `0..v.len()`.',
    ),
    makeSeed(
      3,
      'Use After Move',
      [
        'let token = String::from("key");',
        'consume(token);',
        'println!("{}", token);',
      ],
      2,
      '`consume(token)` moves ownership out of `token`, so reading `token` afterwards fails borrow check.',
    ),
    makeSeed(
      3,
      'Two Mutable Borrows',
      [
        'let mut hp = 10;',
        'let a = &mut hp;',
        'let b = &mut hp;',
        '*a += *b;',
      ],
      2,
      'Rust forbids two simultaneous `&mut` borrows `a` and `b` of `hp`.',
    ),
    makeSeed(
      3,
      'Missing Mut Binding',
      ['let score = 0;', 'score += 25;', 'println!("{}", score);'],
      1,
      'Bindings are immutable by default in Rust; declare `let mut score = 0;`.',
    ),
    makeSeed(
      3,
      'Returning Local Ref',
      [
        'fn dangling() -> &String {',
        '    let s = String::from("x");',
        '    &s',
        '}',
      ],
      2,
      '`s` drops at function end, so returning `&s` creates a dangling lifetime error.',
      true,
    ),
    makeSeed(
      3,
      'Unwrap On None Panic',
      [
        'let list = vec![1, 2];',
        'let tenth = list.get(9).unwrap();',
      ],
      1,
      '`list.get(9)` returns `None`; `.unwrap()` panics instead of handling with `unwrap_or` or `match`.',
      true,
    ),
    makeSeed(
      2,
      'Unsigned Zero Underflow',
      ['let mut count: u8 = 0;', 'count -= 1;', 'println!("{}", count);'],
      1,
      'Subtracting `1` from unsigned `u8` `0` panics in debug builds on integer underflow.',
    ),
    makeSeed(
      1,
      'Semicolon Returns Unit',
      ['fn add(a: i32, b: i32) -> i32 {', '    a + b;', '}'],
      1,
      'A trailing `;` turns `a + b` into a statement returning `()` instead of `i32`.',
    ),
  ],
  sql: [
    makeSeed(
      2,
      'Between Boundary Flip',
      ['SELECT * FROM logs', 'WHERE day BETWEEN 10 AND 1;'],
      1,
      '`BETWEEN` requires the lower bound first (`BETWEEN 1 AND 10`); `10 AND 1` matches zero rows.',
    ),
    makeSeed(
      3,
      'Equal NULL Comparison',
      ['SELECT id FROM users', 'WHERE deleted_at = NULL;'],
      1,
      '`= NULL` always evaluates to UNKNOWN in SQL; write `IS NULL` to match nulls.',
    ),
    makeSeed(
      3,
      'Missing GROUP BY Col',
      ['SELECT team, COUNT(*)', 'FROM players', 'ORDER BY team;'],
      0,
      'Selecting non-aggregated `team` alongside `COUNT(*)` requires `GROUP BY team`.',
    ),
    makeSeed(
      3,
      'Where Rejects Aggregate',
      ['SELECT lang, COUNT(*)', 'FROM runs', 'WHERE COUNT(*) > 5', 'GROUP BY lang;'],
      2,
      'Aggregate filters belong in `HAVING COUNT(*) > 5` after `GROUP BY`, not `WHERE`.',
      true,
    ),
    makeSeed(
      3,
      'Update Without Filter',
      ['UPDATE profiles', 'SET rank = 1', ';'],
      1,
      'Running `UPDATE` with no `WHERE` clause overwrites `rank` for every single row.',
      true,
    ),
    makeSeed(
      2,
      'Offset Skips Wrong Page',
      ['SELECT name FROM scores', 'LIMIT 0', 'OFFSET 10;'],
      1,
      '`LIMIT 0` returns zero rows regardless of `OFFSET`.',
    ),
    makeSeed(
      1,
      'Single Quote Identifier',
      ['SELECT \'username\'', 'FROM users;'],
      0,
      'Single quotes produce literal text `"username"` every row; drop quotes for column `username`.',
    ),
  ],
  c: [
    makeSeed(
      2,
      'Char Array Null Overflow',
      ['char tag[4];', 'strcpy(tag, "CODE");', 'printf("%s", tag);'],
      1,
      '`"CODE"` needs `5` bytes (`4` chars + `\\0` terminator), overflowing `tag[4]`.',
    ),
    makeSeed(
      3,
      'Missing Free Leak',
      [
        'void work() {',
        '    int* buf = malloc(sizeof(int) * 8);',
        '    buf[0] = 9;',
        '}',
      ],
      1,
      'Allocated memory `buf` is never released with `free(buf)` before returning.',
      true,
    ),
    makeSeed(
      3,
      'Printf Pointer Specifier',
      ['int val = 42;', 'printf("%s", val);'],
      1,
      'Passing `int` to `%s` treats `42` as a memory address; print integers with `%d`.',
      true,
    ),
  ],
  ts: [
    makeSeed(
      2,
      'Index Boundary Typo',
      [
        'const steps: number[] = [1, 2, 3];',
        'for (let i = 0; i <= steps.length; i++) {',
        '  steps[i].toFixed(0);',
        '}',
      ],
      1,
      'When `i === steps.length`, `steps[i]` is `undefined` and `.toFixed()` throws at runtime.',
    ),
    makeSeed(
      3,
      'Any Escape Bypass',
      ['function parse(raw: unknown): number {', '  return (raw as any).toFixed(2);', '}'],
      1,
      'Casting `raw as any` silences type checking and crashes if `raw` is not a number.',
      true,
    ),
    makeSeed(
      3,
      'Readonly Push Error',
      [
        'const ids: readonly number[] = [1, 2];',
        'ids.push(3);',
      ],
      1,
      '`readonly number[]` forbids mutating methods like `.push()`; create `[...ids, 3]`.',
    ),
    makeSeed(
      3,
      'Unnarrowed Union Access',
      [
        'function len(v: string | null): number {',
        '  return v.length;',
        '}',
      ],
      1,
      '`v` may be `null`; guard with `if (!v) return 0;` before reading `v.length`.',
      true,
    ),
    makeSeed(
      2,
      'Keyof Unsafe Lookup',
      [
        'const map = { py: 1, go: 2 };',
        'function read(k: string) {',
        '  return map[k];',
        '}',
      ],
      2,
      'TypeScript forbids indexing `{ py, go }` by raw `string`; narrow `k: keyof typeof map`.',
    ),
    makeSeed(
      3,
      'Stale Type Predicate',
      [
        'interface User { name?: string }',
        'const u: User = {};',
        'console.log(u.name!.toUpperCase());',
      ],
      2,
      'Non-null assertion `u.name!` bypasses optional safety and throws when `u.name` is `undefined`.',
    ),
    makeSeed(
      1,
      'Optional Before Required',
      ['function log(a?: string, b: number) {', '  console.log(a, b);', '}'],
      0,
      'Required parameters (`b`) cannot appear after an optional parameter (`a?`) in TypeScript.',
    ),
  ],
  css: [
    makeSeed(
      1,
      'Space Before Unit',
      ['.card {', '  padding: 16 px;', '  border-radius: 8px;', '}'],
      1,
      'Units must touch numbers (`16px`); `16 px` makes the `padding` declaration invalid.',
    ),
    makeSeed(
      2,
      'Nth-Child Zero Index',
      ['.row:nth-child(0) {', '  background: #7C5CFC;', '}'],
      0,
      'CSS `:nth-child()` is 1-based (`1`), so `:nth-child(0)` matches zero elements.',
    ),
    makeSeed(
      2,
      'Calc Missing Spaces',
      ['.panel {', '  width: calc(100%-32px);', '}'],
      1,
      'CSS `calc()` `+` and `-` operators require spaces around them (`100% - 32px`).',
    ),
    makeSeed(
      3,
      'Z-Index Without Position',
      ['.overlay {', '  z-index: 999;', '  background: #12111A;', '}'],
      1,
      '`z-index` has no effect on elements with default `position: static`; add `position: relative` or `absolute`.',
      true,
    ),
    makeSeed(
      3,
      'Flex Overflow Shrink',
      ['.card {', '  position: fixed;', '  top: 0;', '  margin: auto;', '}'],
      1,
      '`top: 0` without `bottom/inset` ignores vertical `margin: auto` centering.',
      true,
    ),
    makeSeed(
      3,
      'Important Specificity Lock',
      [':root {', '  --accent: #7C5CFC;', '}', '.btn { color: --accent; }'],
      3,
      'Custom properties must be read with `var(--accent)`, never bare `--accent`.',
    ),
    makeSeed(
      2,
      'Percentage Height Void',
      ['.child {', '  height: 100%;', '  position: sticky;', '}'],
      2,
      'Sticky positioning also requires an offset like `top: 0` to engage.',
    ),
  ],
  html: [
    makeSeed(
      1,
      'Unclosed Closing Tag',
      ['<div class="card">', '  <h2>Status</h2>', '<div>'],
      2,
      'Closing tags require a leading slash (`</div>`), not a second opening `<div>`.',
    ),
    makeSeed(
      2,
      'Duplicate Page ID',
      ['<button id="save">Save</button>', '<button id="save">Reset</button>'],
      1,
      'HTML `id` attributes must be unique across the document; use classes or distinct IDs.',
    ),
    makeSeed(
      2,
      'Button Nested Inside Anchor',
      ['<a href="/home">', '  <button>Go</button>', '</a>'],
      1,
      'Nesting interactive `<button>` inside `<a>` creates invalid HTML and broken accessibility.',
    ),
    makeSeed(
      3,
      'Script Blocks Parser',
      ['<head>', '  <script src="app.js"></script>', '</head>', '<div id="root"></div>'],
      1,
      'Blocking `<script>` in `<head>` runs before `#root` exists in DOM unless marked `defer`.',
      true,
    ),
    makeSeed(
      3,
      'Missing Rel Noopener',
      ['<a href="https://example.com" target="_blank">', '  Docs', '</a>'],
      0,
      'External links with `target="_blank"` should include `rel="noopener noreferrer"` for safety.',
      true,
    ),
    makeSeed(
      3,
      'Form Method Submit Trap',
      ['<form action="/pay">', '  <button type="reset">Pay Now</button>', '</form>'],
      1,
      '`type="reset"` clears all form fields instead of submitting; use `type="submit"`.',
    ),
    makeSeed(
      1,
      'Void Tag Closing Pair',
      ['<img src="logo.png" alt="Logo">', '</img>'],
      1,
      '`<img>` is a void element and cannot have an `</img>` closing tag.',
    ),
  ],
  php: [
    makeSeed(
      1,
      'Plus Concats Strings',
      ['$lang = "PHP";', 'echo "Lang: " + $lang;'],
      1,
      'In PHP, string concatenation uses `.` (`"Lang: " . $lang`), while `+` tries numeric math.',
    ),
    makeSeed(
      2,
      'Loose String In Array',
      ['$arr = [10, 20, 30];', 'for ($i = 0; $i <= count($arr); $i++) {', '  echo $arr[$i];', '}'],
      1,
      '`$i <= count($arr)` triggers an undefined array key warning on the last pass; use `<`.',
    ),
    makeSeed(
      2,
      'Foreach Reference Leak',
      ['foreach ($rows as &$r) { $r *= 2; }', '$r = 99;'],
      1,
      'Assigning `$r = 99` after `foreach (&$r)` overwrites the final array element unless you call `unset($r)`.',
      true,
    ),
    makeSeed(
      3,
      'Strict Type Missing',
      ['$flag = false;', 'if (strpos("php", "p") == false) {', '  echo "Missing";', '}'],
      1,
      '`strpos("php", "p")` returns `0`, which `== false` treats as truthy; check `=== false`.',
      true,
    ),
    makeSeed(
      3,
      'Undefined Global Scope',
      ['$xp = 10;', 'function showXp() {', '  echo $xp;', '}'],
      2,
      'PHP functions do not inherit outer variables implicitly; pass `$xp` as an argument or use `global`.',
    ),
    makeSeed(
      3,
      'Missing Dollar Variable',
      ['$score = 50;', 'score += 10;', 'echo $score;'],
      1,
      'Every variable reference in PHP requires a leading `$` (`$score += 10;`).',
    ),
    makeSeed(
      2,
      'Empty Check Pitfall',
      ['$qty = "0";', 'if (empty($qty)) { die("No items"); }'],
      1,
      '`empty("0")` evaluates to `true` in PHP; validate explicitly with `$qty === ""`.',
    ),
  ],
  asm: [
    makeSeed(
      1,
      'Reversed Mov Operands',
      ['section .text', 'mov 5, rax', 'add rax, 1'],
      1,
      'In Intel x86-64 syntax (`dest, src`), an immediate `5` cannot be the destination (`mov rax, 5`).',
    ),
    makeSeed(
      2,
      'Zero Loop Counter Trap',
      ['mov rcx, 0', 'loop_top:', '  inc rax', '  dec rcx', '  jnz loop_top'],
      0,
      'Starting `rcx = 0` and running `dec rcx` wraps `rcx` to `0xFFFFFFFFFFFFFFFF`, looping forever.',
    ),
    makeSeed(
      2,
      'Off-By-One Stride',
      ['mov rcx, 4', 'next_word:', '  add rsi, 1', '  loop next_word'],
      2,
      'Stepping a `64-bit` (`qword`) pointer requires `add rsi, 8`, whereas `+1` misaligns reads.',
    ),
    makeSeed(
      3,
      'Unbalanced Stack Ret',
      ['compute:', '  push rbx', '  mov rbx, rdi', '  ret'],
      3,
      'Returning while `rbx` remains on the stack corrupts the return address (`pop rbx` before `ret`).',
      true,
    ),
    makeSeed(
      3,
      'Division Missing Rdx Clear',
      ['mov rax, 20', 'mov rbx, 4', 'div rbx'],
      2,
      'Unsigned `div rbx` divides `RDX:RAX`; zero `xor rdx, rdx` beforehand or `#DE` / wrong quotient occurs.',
      true,
    ),
    makeSeed(
      3,
      'Caller-Saved Clobber',
      ['mov rax, 10', 'call helper', 'add rax, 5'],
      2,
      'Functions may overwrite caller-saved `RAX`; save values in callee-saved `RBX`/`R12` across `call`.',
    ),
    makeSeed(
      3,
      'Write To Read-Only Data',
      ['section .rodata', 'msg db "OK", 0', 'section .text', 'mov byte [msg], \'X\''],
      3,
      'Writing into `.rodata` triggers a segmentation fault (`SIGSEGV`); mutable data belongs in `.data`.',
    ),
  ],
  swift: [
    makeSeed(
      1,
      'Mutating Let Constant',
      ['let lives = 3', 'lives -= 1', 'print(lives)'],
      1,
      '`let` defines an immutable constant in Swift; switch to `var lives = 3`.',
    ),
    makeSeed(
      2,
      'Half-Open Upper Miss',
      ['let scores = [10, 20, 30]', 'for i in 0...scores.count {', '    print(scores[i])', '}'],
      1,
      '`0...scores.count` hits index `3` out of bounds; iterate over half-open `0..<scores.count`.',
    ),
    makeSeed(
      2,
      'Reversed Range Crash',
      ['for i in 5..<1 {', '    print(i)', '}'],
      0,
      'Lower bound must be `<=` upper bound (`1..<5` or `.reversed()`); `5..<1` crashes at runtime.',
    ),
    makeSeed(
      3,
      'Force Unwrap Nil Crash',
      ['let port: Int? = nil', 'let num = port!', 'print(num)'],
      1,
      'Force-unwrapping `nil` with `!` traps immediately; unwrap safely with `if let` or `??`.',
    ),
    makeSeed(
      3,
      'Strong Self Retain Cycle',
      ['timer.onTick = {', '    self.ticks += 1', '}'],
      1,
      'Capturing `self` strongly inside a stored closure causes a memory retain cycle; add `[weak self]`.',
      true,
    ),
    makeSeed(
      3,
      'UI Update Off MainThread',
      [
        'DispatchQueue.global().async {',
        '    label.text = "Done"',
        '}',
      ],
      1,
      'Mutating UIKit views from a background queue causes undefined behavior; wrap in `DispatchQueue.main.async`.',
      true,
    ),
    makeSeed(
      2,
      'Array Slice Zero Assumption',
      ['let a = [10, 20, 30]', 'let tail = a.dropFirst()', 'print(tail[0])'],
      2,
      '`ArraySlice` keeps its original startIndex (`1`), so `tail[0]` crashes (`Fatal error`); convert via `Array(tail)`.',
    ),
    makeSeed(
      3,
      'Value Copy Expectation',
      ['struct Point { var x: Int }', 'let p = Point(x: 1)', 'p.x = 5'],
      2,
      '`p` is a `let` value-type instance, so struct properties cannot be mutated unless `var p`.',
    ),
    makeSeed(
      2,
      'Guard Missing Return',
      ['func check(_ n: Int) {', '    guard n > 0 else { print("bad") }', '}'],
      1,
      '`guard ... else` must exit the current scope (`return`, `throw`, `break`).',
    ),
    makeSeed(
      1,
      'Missing String Interpolation',
      ['let score = 80', 'print("XP: \\score")'],
      1,
      'Swift interpolation requires parentheses around expressions: `"XP: \\(score)"`.',
    ),
    makeSeed(
      3,
      'Weak Var Non-Optional',
      ['class Node {', '    weak var next: Node = Node()', '}'],
      1,
      '`weak` references must always be declared optional (`Node?`) and `var`.',
    ),
    makeSeed(
      3,
      'Dict Default Nil Key',
      ['var counts: [String: Int] = [:]', 'let v: Int = counts["py"]', 'print(v + 1)'],
      1,
      'Dictionary lookup returns `Int?`, not `Int`; provide fallback `counts["py", default: 0]`.',
    ),
  ],
  kotlin: [
    makeSeed(
      1,
      'Reassigning Val Binding',
      ['val level = 1', 'level += 1', 'println(level)'],
      1,
      '`val` is read-only in Kotlin; declare mutable values with `var`.',
    ),
    makeSeed(
      2,
      'Inclusive Size Overrun',
      ['val items = listOf("a", "b")', 'for (i in 0..items.size) {', '    println(items[i])', '}'],
      1,
      '`0..items.size` includes index `2` out of bounds; use `0 until items.size` or `items.indices`.',
    ),
    makeSeed(
      2,
      'Empty Ascending Range',
      ['for (i in 5..1) {', '    println(i)', '}'],
      0,
      '`5..1` produces an empty range in Kotlin; count downwards using `5 downTo 1`.',
    ),
    makeSeed(
      3,
      'Double Bang NPE',
      ['val name: String? = null', 'println(name!!.length)'],
      1,
      '`!!` throws `NullPointerException` when `name` is `null`; use safe call `name?.length ?: 0`.',
    ),
    makeSeed(
      3,
      'Data Class Equals Trap',
      ['val a = listOf(1, 2)', 'val b = mutableListOf(1, 2)', '(b as MutableList).clear()'],
      2,
      'Mutating a list aliased across references leads to unexpected shared-state bugs.',
    ),
    makeSeed(
      3,
      'Non-Local Return Lambda',
      ['listOf(1, 2, 3).forEach {', '    if (it == 2) return', '}'],
      1,
      'Unqualified `return` inside inline `forEach` exits the enclosing function, not just the lambda; use `return@forEach`.',
      true,
    ),
    makeSeed(
      3,
      'Lateinit Before Set',
      ['class App {', '    lateinit var db: String', '    fun read() = db.length', '}'],
      2,
      'Accessing `lateinit` before initialization throws `UninitializedPropertyAccessException`.',
      true,
    ),
    makeSeed(
      2,
      'Filter Ignored Return',
      ['val list = mutableListOf(1, -2, 3)', 'list.filter { it > 0 }', 'println(list)'],
      1,
      '`filter` returns a new list without mutating `list`; assign the result or call `removeAll`.',
    ),
    makeSeed(
      3,
      'Coroutine RunBlocking UI',
      ['val job = GlobalScope.launch {', '    delay(500)', '}'],
      0,
      '`GlobalScope.launch` leaks work outside structured concurrency lifecycles; use a scoped `CoroutineScope`.',
    ),
    makeSeed(
      1,
      'Java Ternary Syntax',
      ['val ok = true', 'val msg = ok ? "Yes" : "No"'],
      1,
      'Kotlin has no `? :` ternary operator; use `if (ok) "Yes" else "No"`.',
    ),
    makeSeed(
      3,
      'Mutable Set Unstable Hash',
      ['val s = hashSetOf<Int>()', 'val n: Int? = null', 'println(n?.plus(1))'],
      1,
      'Null arithmetic evaluates to `null`; handle nullable fallbacks with Elvis `?: 0`.',
    ),
    makeSeed(
      2,
      'Step Must Be Positive',
      ['for (i in 10 downTo 2 step -2) {', '    println(i)', '}'],
      0,
      'In Kotlin progressions, `step` must always be positive (`step 2`), even with `downTo`.',
    ),
  ],
  julia: [
    makeSeed(
      1,
      'Zero Based Indexing Error',
      ['arr = [10, 20, 30]', 'println(arr[0])'],
      1,
      'Julia arrays are 1-indexed; the first item is `arr[1]`, while `arr[0]` throws `BoundsError`.',
    ),
    makeSeed(
      2,
      'Zero Start Loop Trap',
      ['items = ["a", "b"]', 'for i in 0:length(items)', '    println(items[i])', 'end'],
      1,
      'Looping `0:length(items)` accesses `items[0]`; iterate cleanly over `eachindex(items)`.',
    ),
    makeSeed(
      2,
      'Descending Step Omitted',
      ['for k in 5:1', '    println(k)', 'end'],
      0,
      '`5:1` creates an empty range in Julia without a negative step (`5:-1:1`).',
    ),
    makeSeed(
      3,
      'Global Scope Rebind Error',
      ['x = 0', 'for i in 1:3', '    x += i', 'end'],
      2,
      'In top-level scripts, updating outer `x` inside `for` can hit soft-scope ambiguity without `global x`.',
    ),
    makeSeed(
      3,
      'Non-Mutating Bang Miss',
      ['v = [3, 1, 2]', 'sort(v)', 'println(v[1])'],
      1,
      '`sort(v)` returns a sorted copy and leaves `v` unchanged; mutate in-place with `sort!(v)`.',
    ),
    makeSeed(
      3,
      'Untyped Struct Field Perf',
      ['struct Box', '    data', 'end'],
      1,
      'Untyped field `data` defaults to `Any`, boxing values dynamically instead of concrete type `Int`/`Float64`.',
      true,
    ),
    makeSeed(
      3,
      'Missing Dot Broadcast',
      ['a = [1, 2, 3]', 'b = sin(a)'],
      1,
      'Calling scalar `sin(a)` on a vector throws `MethodError`; broadcast element-wise with `sin.(a)`.',
      true,
    ),
    makeSeed(
      2,
      'Tuple Immutable Assign',
      ['t = (1, 2, 3)', 't[1] = 9'],
      1,
      'Tuples are immutable in Julia; use an `Array` `[1, 2, 3]` if elements must update.',
    ),
    makeSeed(
      3,
      'Column vs Row Slicing',
      ['m = [1 2; 3 4]', 'sub = @view m[1, :]', 'sub = [9, 9]'],
      2,
      'Rebinding `sub = ...` drops the view reference instead of updating row elements with `sub .= [9, 9]`.',
    ),
    makeSeed(
      1,
      'Integer Power Overflow',
      ['big = 2^63', 'println(big > 0)'],
      0,
      '`Int64` silently wraps around on `2^63` (`typemin(Int64)`); compute `big(2)^63` for precision.',
    ),
    makeSeed(
      2,
      'String Char Single Quotes',
      ['word = \'Julia\'', 'println(word)'],
      0,
      'Single quotes denote a single `Char` in Julia; wrap multi-character strings in double quotes `"Julia"`.',
    ),
    makeSeed(
      3,
      'Aliased Copy Confusion',
      ['a = [1, 2]', 'b = a', 'push!(b, 3)'],
      1,
      '`b = a` creates an alias to the same vector; duplicate independently with `copy(a)`.',
    ),
    makeSeed(
      2,
      'Missing End Block',
      ['function greet(n)', '    println(n)', '}'],
      2,
      'Julia closes blocks with the `end` keyword rather than curly braces `}`.',
    ),
  ],
  lua: [
    makeSeed(
      1,
      'C-Style Not Equal',
      ['local hp = 10', 'if hp != 0 then', '  print("Alive")', 'end'],
      1,
      'Lua uses `~=` for not-equal comparisons; `!=` is a syntax error.',
    ),
    makeSeed(
      2,
      'Zero Index Table Miss',
      ['local list = {"x", "y", "z"}', 'for i = 0, #list do', '  print(list[i])', 'end'],
      1,
      'Lua arrays start at index `1`, so `i = 0` yields `nil` on the first iteration.',
    ),
    makeSeed(
      2,
      'Length Operator Hole',
      ['local arr = {1, nil, 3, 4}', 'print(#arr)'],
      0,
      '`#arr` length is undefined when arrays contain `nil` holes in Lua.',
    ),
    makeSeed(
      2,
      'Numeric For Reverse Step',
      ['for i = 5, 1 do', '  print(i)', 'end'],
      0,
      'Numeric `for` defaults to step `+1` and stops immediately unless you specify `, -1`.',
    ),
    makeSeed(
      3,
      'Accidental Global Leak',
      ['function addXp(n)', '  total = (total or 0) + n', 'end'],
      1,
      'Omitting `local` writes `total` into `_G` globals across all modules.',
    ),
    makeSeed(
      3,
      'Dot Instead Of Colon',
      ['local obj = { x = 5 }', 'function obj:inc() self.x = self.x + 1 end', 'obj.inc()'],
      2,
      'Calling `obj.inc()` omits `self` (`nil`); use colon method syntax `obj:inc()`.',
      true,
    ),
    makeSeed(
      3,
      'Pairs vs Ipairs Order',
      ['local t = { [1] = "a", [3] = "b" }', 'for i, v in ipairs(t) do', '  print(v)', 'end'],
      1,
      '`ipairs` halts at index `2` because it is `nil`, missing key `[3]`; iterate sparse keys with `pairs`.',
      true,
    ),
    makeSeed(
      3,
      'Table Concat Numbers Only Trap',
      ['local a = {1, 2}', 'local b = a', 'b[1] = 99'],
      1,
      'Tables are assigned by reference in Lua, so changing `b[1]` modifies `a[1]`.',
    ),
    makeSeed(
      1,
      'Zero Is Truthy Trap',
      ['local coins = 0', 'if coins then', '  print("Has coins!")', 'end'],
      1,
      'Only `false` and `nil` are falsy in Lua; `0` evaluates to `true`, so check `coins > 0`.',
    ),
    makeSeed(
      2,
      'Local Recursive Capture',
      [
        'local fact = function(n)',
        '  if n <= 1 then return 1 end',
        '  return n * fact(n - 1)',
        'end',
      ],
      0,
      'Declare `local fact` first, then assign `fact = function(n) ...` so the recursive call binds to the local.',
    ),
    makeSeed(
      3,
      'Coroutine Resume First Arg',
      ['local co = coroutine.create(function() return 1 end)', 'local v = coroutine.resume(co)', 'print(v + 1)'],
      2,
      '`coroutine.resume` returns `(okBoolean, value)`, so `v` is `true`, not `1`.',
    ),
    makeSeed(
      2,
      'String Dot Concat Error',
      ['local name = "Lua"', 'print("Hi " + name)'],
      1,
      'String concatenation in Lua uses `..`, whereas `+` attempts arithmetic coercion.',
    ),
    makeSeed(
      3,
      'Metatable Missing __index',
      ['local proto = { speed = 5 }', 'local car = setmetatable({}, proto)', 'print(car.speed)'],
      1,
      'A metatable needs `{ __index = proto }` so missing key lookups fall back to `proto`.',
    ),
    makeSeed(
      1,
      'Elseif Two Words Trap',
      ['if x > 5 then', '  a = 1', 'else if x > 0 then', '  a = 2', 'end'],
      2,
      '`else if` opens a second nested `if` requiring two `end`s; write single keyword `elseif`.',
    ),
  ],
  csharp: [
    makeSeed(
      1,
      'Missing Decimal Suffix',
      ['float speed = 3.5;', 'Console.WriteLine(speed);'],
      0,
      'Floating literals default to `double`; append `f` (`3.5f`) to assign to `float`.',
    ),
    makeSeed(
      2,
      'Array Bounds Inclusive',
      ['int[] scores = {10, 20};', 'for (int i = 0; i <= scores.Length; i++) {', '    Console.WriteLine(scores[i]);', '}'],
      1,
      '`i <= scores.Length` throws `IndexOutOfRangeException`; loop while `i < scores.Length`.',
    ),
    makeSeed(
      2,
      'Foreach Collection Modify',
      ['var items = new List<int> { 1, 2, 3 };', 'foreach (var n in items) {', '    if (n == 2) items.Remove(n);', '}'],
      2,
      'Mutating `items` inside `foreach` throws `InvalidOperationException`.',
    ),
    makeSeed(
      3,
      'Async Void Swallow Error',
      ['async void SaveData() {', '    await Task.Delay(50);', '    throw new Exception("fail");', '}'],
      0,
      'Uncaught exceptions in `async void` crash the process; return `async Task` instead.',
      true,
    ),
    makeSeed(
      3,
      'Deferred LINQ Execution',
      ['int x = 2;', 'var q = nums.Where(n => n > x);', 'x = 100;', 'return q.Count();'],
      1,
      'LINQ queries capture `x` lazily by variable reference, evaluating with `x = 100` unless materialized with `.ToList()`.',
      true,
    ),
    makeSeed(
      3,
      'Null Reference Deref',
      ['string? tag = null;', 'Console.WriteLine(tag.ToUpper());'],
      1,
      'Calling `.ToUpper()` on nullable `tag` throws `NullReferenceException`; guard with `tag?.ToUpper()`.',
    ),
    makeSeed(
      3,
      'Struct Value Copy Mutation',
      ['struct Vec { public int X; }', 'var list = new List<Vec> { new Vec { X = 1 } };', 'list[0].X = 9;'],
      2,
      'Indexer `list[0]` returns a temporary `Vec` copy of the struct, failing to compile mutation.',
    ),
    makeSeed(
      2,
      'String Immutability Drop',
      ['string s = "code";', 's.ToUpper();', 'Console.WriteLine(s);'],
      1,
      '`s.ToUpper()` returns a new string instead of mutating `s` in place; capture `s = s.ToUpper();`.',
    ),
    makeSeed(
      3,
      'Deadlock Wait On Task',
      ['async Task<int> Fetch() => 42;', 'int res = Fetch().Result;'],
      1,
      'Blocking synchronously with `.Result` on UI/synchronization threads risks deadlocks; use `await Fetch()`.',
    ),
    makeSeed(
      2,
      'Integer Division Avg',
      ['int sum = 5, count = 2;', 'double avg = sum / count;'],
      1,
      '`sum / count` divides as integers (`2`); cast `(double)sum / count`.',
    ),
    makeSeed(
      3,
      'Missing Dispose Stream',
      ['var sr = new StreamReader("a.txt");', 'return sr.ReadToEnd();'],
      0,
      'Wrap disposable I/O handles in `using var sr = ...` so file descriptors always close.',
    ),
    makeSeed(
      1,
      'Double Quote Char Literal',
      ['char rank = "A";', 'Console.WriteLine(rank);'],
      0,
      '`char` literals in C# require single quotes `\'A\'` rather than string quotes `"A"`.',
    ),
  ],
};

function titleFromPrompt(prompt: string, index: number, sector: BugSectorId): string {
  const clean = prompt
    .replace(/^Tap the (line that |line with |invalid |classic |missing )?/i, '')
    .replace(/^Spot the (line that |bug in )?/i, '')
    .replace(/^Find the (line that |bug in )?/i, '')
    .replace(/[.!?]+$/, '')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 3);
  if (words.length >= 2) {
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).replace(/[`"']/g, ''))
      .join(' ')
      .slice(0, 26);
  }
  const fallbackNames: Record<BugSectorId, string> = {
    1: `Syntax Fault #${index}`,
    2: `Loop Trap #${index}`,
    3: `Logic Audit #${index}`,
  };
  return fallbackNames[sector];
}

function makeFilename(lang: LangId, sector: BugSectorId, levelNumber: number, isBoss: boolean): string {
  const ext = FILE_EXT_BY_LANG[lang];
  const padded = String(levelNumber).padStart(2, '0');
  if (isBoss) {
    return `boss_s${sector}.${ext}`;
  }
  if (sector === 1) return `syntax_${padded}.${ext}`;
  if (sector === 2) return `bounds_${padded}.${ext}`;
  return `logic_${padded}.${ext}`;
}

function signatureOf(lines: string[]): string {
  return lines.map((l) => l.trim()).join('\n');
}

function toSnippet(filename: string, seed: RawCampaignSeed): BugCampaignSnippet {
  return {
    filename,
    codeLines: [...seed.codeLines],
    bugLine: Math.max(0, Math.min(seed.codeLines.length - 1, seed.bugLine)),
    explanation: seed.explanation,
  };
}

function buildLanguageCampaign(langId: LangId): BugCampaignLevel[] {
  const langSpec = LANGUAGES.find((l) => l.id === langId) ?? LANGUAGES[0];
  const seen = new Set<string>();

  const s1: RawCampaignSeed[] = [];
  const s2: RawCampaignSeed[] = [];
  const s3: RawCampaignSeed[] = [];
  const fallbackPool: RawCampaignSeed[] = [];

  const pushUnique = (target: RawCampaignSeed[], seed: RawCampaignSeed) => {
    const sig = signatureOf(seed.codeLines);
    if (seen.has(sig) || seed.codeLines.length === 0) return;
    seen.add(sig);
    target.push(seed);
  };

  // First push curated sector-specific bugs so Sector 2 (loops) & Sector 3 (memory/logic)
  // always have authentic late-campaign progression and strong boss trios.
  for (const extra of EXTRA_BUG_BANK[langId] ?? []) {
    if (extra.sectorHint === 1) pushUnique(s1, extra);
    else if (extra.sectorHint === 2) pushUnique(s2, extra);
    else pushUnique(s3, extra);
  }

  // Pull curriculum find_bug exercises partitioned cleanly by unit depth
  const totalUnits = Math.max(1, langSpec.units.length);
  langSpec.units.forEach((unit, uIdx) => {
    const ratio = uIdx / totalUnits;
    const targetSector: BugSectorId = ratio < 0.38 ? 1 : ratio < 0.72 ? 2 : 3;
    unit.nodes.forEach((node) => {
      node.exercises.forEach((ex, exIdx) => {
        if (ex.type !== 'find_bug') return;
        const seed = makeSeed(
          targetSector,
          titleFromPrompt(ex.prompt, exIdx + 1, targetSector),
          ex.lines,
          ex.bugLine,
          ex.explanation,
        );
        if (targetSector === 1) pushUnique(s1, seed);
        else if (targetSector === 2) pushUnique(s2, seed);
        else pushUnique(s3, seed);
        fallbackPool.push(seed);
      });
    });
  });

  // Snapshot full immutable sector pools before shifting headlines so companion
  // bugs (stages 2 & 3) always pull 100% distinct bugs within every level.
  const allSectorSeeds: Record<BugSectorId, RawCampaignSeed[]> = {
    1: [...s1, ...s2, ...s3],
    2: [...s2, ...s3, ...s1],
    3: [...s3, ...s2, ...s1],
  };

  // Helper to pull a unique headline seed for each level without duplicates
  const takeSeed = (
    sector: BugSectorId,
    preferBoss = false,
  ): RawCampaignSeed => {
    const primary = sector === 1 ? s1 : sector === 2 ? s2 : s3;
    const secondary = sector === 1 ? s2 : sector === 2 ? s3 : s2;
    const tertiary = sector === 1 ? s3 : s1;

    const pickFrom = (arr: RawCampaignSeed[]): RawCampaignSeed | undefined => {
      if (arr.length === 0) return undefined;
      if (preferBoss) {
        const bossIdx = arr.findIndex((item) => item.isBossCandidate);
        if (bossIdx >= 0) return arr.splice(bossIdx, 1)[0];
      }
      return preferBoss ? arr.pop() : arr.shift();
    };

    const chosen =
      pickFrom(primary) ?? pickFrom(secondary) ?? pickFrom(tertiary);
    if (chosen) return chosen;

    const backup =
      fallbackPool[primary.length % Math.max(1, fallbackPool.length)] ??
      makeSeed(
        sector,
        `Anomaly Scan`,
        ['// Review control path', 'let err = true;', 'assert(!err);'],
        1,
        'Flagged error condition `err = true` triggers the assertion failure.',
      );
    return backup;
  };

  const pickDistinctCompanion = (
    sector: BugSectorId,
    excludeSigs: Set<string>,
    startOffset: number,
  ): RawCampaignSeed => {
    const candidates = allSectorSeeds[sector];
    for (let step = 0; step < candidates.length; step += 1) {
      const candidate =
        candidates[(startOffset + step) % Math.max(1, candidates.length)];
      if (!candidate) continue;
      const sig = signatureOf(candidate.codeLines);
      if (!excludeSigs.has(sig)) {
        excludeSigs.add(sig);
        return candidate;
      }
    }
    return candidates[0];
  };

  // Reserve Boss headline seeds first so Bosses 10, 20, 30 never get leftover items
  const bossHeads: Record<BugSectorId, RawCampaignSeed> = {
    1: takeSeed(1, true),
    2: takeSeed(2, true),
    3: takeSeed(3, true),
  };

  const ext = FILE_EXT_BY_LANG[langId];
  const levels: BugCampaignLevel[] = [];

  for (
    let levelNumber = 1;
    levelNumber <= BUG_CAMPAIGN_TOTAL_LEVELS;
    levelNumber++
  ) {
    const sector: BugSectorId =
      levelNumber <= 10 ? 1 : levelNumber <= 20 ? 2 : 3;
    const sectorMeta = BUG_CAMPAIGN_SECTORS[sector];
    const isBoss = levelNumber % 10 === 0;
    const filename = makeFilename(langId, sector, levelNumber, isBoss);

    const seedOne = isBoss ? bossHeads[sector] : takeSeed(sector, false);
    const usedInLevel = new Set<string>([signatureOf(seedOne.codeLines)]);
    const seedTwo = pickDistinctCompanion(
      sector,
      usedInLevel,
      levelNumber * 7 + sector * 3,
    );
    const seedThree = pickDistinctCompanion(
      sector,
      usedInLevel,
      levelNumber * 13 + sector * 5 + 1,
    );

    const baseName = filename.slice(0, Math.max(1, filename.lastIndexOf('.')));
    const stageOne = toSnippet(filename, seedOne);
    const stageTwo = toSnippet(`${baseName}_b2.${ext}`, seedTwo);
    const stageThree = toSnippet(`${baseName}_b3.${ext}`, seedThree);

    const bossNames: Record<BugSectorId, string> = {
      1: 'Boss: Syntax Overload',
      2: 'Boss: Loop Gauntlet',
      3: 'Boss: Core Corruption',
    };

    levels.push({
      id: `${langId}-lvl-${levelNumber}`,
      lang: langId,
      levelNumber,
      title: isBoss ? bossNames[sector] : seedOne.title,
      sector,
      sectorTitle: sectorMeta.title,
      filename: stageOne.filename,
      codeLines: stageOne.codeLines,
      bugLine: stageOne.bugLine,
      explanation: stageOne.explanation,
      starThresholds: [...BUG_CAMPAIGN_STAR_THRESHOLDS],
      isBoss,
      xpReward: isBoss ? 35 : 15,
      gemReward: isBoss ? 25 : 5,
      stages: [stageOne, stageTwo, stageThree],
    });
  }

  return levels;
}

const CAMPAIGN_CACHE = new Map<LangId, BugCampaignLevel[]>();

export function getBugCampaignLevels(lang: LangId): BugCampaignLevel[] {
  const existing = CAMPAIGN_CACHE.get(lang);
  if (existing) return existing;
  const built = buildLanguageCampaign(lang);
  CAMPAIGN_CACHE.set(lang, built);
  return built;
}

export function getBugCampaignLevel(
  lang: LangId,
  levelNumber: number,
): BugCampaignLevel {
  const levels = getBugCampaignLevels(lang);
  const clamped = Math.max(
    1,
    Math.min(BUG_CAMPAIGN_TOTAL_LEVELS, Math.round(levelNumber)),
  );
  return levels[clamped - 1] ?? levels[0];
}

export function computeBugLevelStars(
  elapsedMs: number,
  thresholds: [number, number, number] = BUG_CAMPAIGN_STAR_THRESHOLDS,
): 0 | 1 | 2 | 3 {
  const sec = elapsedMs / 1000;
  if (sec < thresholds[0]) return 3;
  if (sec < thresholds[1]) return 2;
  if (sec < thresholds[2]) return 1;
  return 0;
}
