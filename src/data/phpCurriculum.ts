import type { UnitSeed } from './types';

export const PHP_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: PHP Basics & String Interpolation (6 nodes)
  // =========================================================================
  {
    title: 'PHP Basics & Echo',
    subtitle: 'Open <?php tags, bind $variables, concatenate with ., and interpolate safely.',
    conceptGraphicType: 'php_vars',
    guidebook: {
      summary:
        'PHP 8 powers millions of modern backends (Laravel, Symfony, WordPress) with fast request execution, explicit `$` variables, strict typing opt-in, and rich built-in functions. Every PHP statement ends in `;` inside `<?php ... ?>`.',
      mentalModel:
        'Look closely at quotes and operators: `.` (dot) **concatenates** strings while `+` ONLY adds numbers (`"10" . "5" === "105"`, `"10" + "5" === 15`). Double quotes `"Hello $name"` **interpolate** `$vars`; single quotes `\'Hello $name\'` print literal `$name`!',
      keyTakeaways: [
        'Every PHP variable starts with `$` (`$xp = 120;`); pure PHP files open with `<?php` and omit the closing `?>` to prevent stray whitespace.',
        'String concatenation uses dot `.` (`$a . " " . $b`), never `+`!',
        'Double quotes `"Lv.$lvl"` expand variables (`{$user->name}`); single quotes keep literal characters cleanly.',
        'Always compare strictly using `===` and `!==`—loose `==` coerces strings/numbers in surprising legacy ways (`0 == ""`!).',
      ],
      keySyntax: [
        {
          title: 'Echo, Variables & Dot Concatenation',
          tag: 'BASICS',
          code: '<?php\n$handle = "nadia";\n$xp = 250;\necho "Player: " . $handle . " (" . $xp . " XP)\\n";',
          output: 'Player: nadia (250 XP)',
          explanation:
            '`echo` streams strings directly to output; `.` glues strings cleanly while `;` ends every statement.',
          notes: [
            'Constants don’t use `$`: `const MAX_HEARTS = 5;` inside scripts/classes.',
          ],
        },
        {
          title: 'Double vs Single Quote Interpolation',
          tag: 'STRINGS',
          code: '$lang = "PHP";\necho "Learning {$lang} 8!\\n";\necho \'Literal $lang\';',
          output: 'Learning PHP 8!\nLiteral $lang',
          explanation:
            'Braces `{$lang}` isolate variable names cleanly inside double quotes; single quotes run faster when no variables expand.',
          notes: [
            'Herodoc (`<<<TEXT ... TEXT;`) handles clean multi-line strings.',
          ],
        },
        {
          title: 'Strict Equality === vs Loose ==',
          tag: 'SAFETY',
          code: '$code = "0";\nvar_dump($code === 0); // false (clean type check!)',
          output: 'bool(false)',
          explanation:
            'Strict `===` checks BOTH type and value so `"42"` never silently matches integer `42`.',
          notes: [
            'Null coalescing `??` works identically to TS/C#: `$name = $_GET["user"] ?? "Guest";`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using + Instead of . to Join PHP Strings',
          buggyCode: '$full = "Hello " + "World"; // TypeError in PHP 8!',
          fixedCode: '$full = "Hello " . "World";',
          reason:
            'PHP reserves `+` strictly for math (and array unions); strings ALWAYS join with dot `.`!',
        },
        {
          title: 'Forgetting the $ Prefix on Variables',
          buggyCode: '$xp = 50;\necho xp;',
          fixedCode: '$xp = 50;\necho $xp;',
          reason:
            'Bare words without `$` look up constants, never local `$variables`!',
        },
      ],
      proTip:
        'Start every pure PHP 8 module with `declare(strict_types=1);` right after `<?php` so passing `"42"` into an `int` parameter throws a crisp `TypeError` immediately instead of silently coercing!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Tags, $Vars & Echo',
        subtitle: 'Write PHP statements, declare $variables, and join strings with .',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Every Variable Starts with $',
            explanation:
              'Open scripts with `<?php`, prefix every variable with `$` (`$score = 40;`), join strings with `.`, and print with `echo`.',
            code: ['<?php', '$name = "Ada";', '$xp = 120;', 'echo $name . ": " . $xp;'],
            output: 'Ada: 120',
            highlightNote: 'Pure `.php` files intentionally omit closing `?>` at EOF.',
          },
          {
            type: 'token_builder',
            prompt: 'Declare `$lang` cleanly and print `"Hi, PHP"` using concatenation.',
            codeLines: ['<?php', '{{0}}lang = "PHP";', 'echo "Hi, " {{1}} $lang;'],
            expectedTokens: ['$', '.'],
            distractors: ['let ', '+', '::'],
            syntaxHint: 'Variables need `$` and string join uses `.`.',
            explanation: '`$` prefixes variable names; `.` joins PHP strings cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the classic JS/Python `+` concatenation error in PHP!',
            lines: [
              '<?php',
              '$first = "Code";',
              '$second = "Lingo";',
              'echo $first + $second;',
            ],
            bugLine: 3,
            fixed: 'echo $first . $second;',
            explanation: 'PHP uses `.` for string concatenation (`+` only adds numbers).',
          },
          {
            type: 'predict_output',
            prompt: 'What does `echo \'User: $id\';` (single quotes) print when `$id = 7;`?',
            code: ['$id = 7;', "echo 'User: $id';"],
            options: ['User: 7', 'User: $id', 'Syntax error'],
            answer: 1,
            explanation: 'Single quotes never interpolate variables—use double quotes `"User: $id"`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Interpolation & Strict Ops',
        subtitle: 'Compare with === safely and expand vars in double quotes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Safe Comparisons & Coalescing',
            explanation:
              'Wrap embedded variables in `{$var}` inside double quotes, compare strictly with `===`, and fallback missing values via `??`.',
            code: ['$raw = "0";', '$same = ($raw === 0); // false', '$user = $input ?? "Guest";'],
            highlightNote: '`===` catches subtle `"12"` vs `12` bugs before they slip into logic.',
          },
          {
            type: 'token_builder',
            prompt: 'Interpolate `$xp` inside double quotes and check exact equality.',
            codeLines: ['echo "Score: {{0}}$xp} pts";', 'if ($xp {{1}} 100) { echo "Max!"; }'],
            expectedTokens: ['{', '==='],
            distractors: ['$', '==', '='],
            explanation: '`{$xp}` delimits interpolated vars cleanly; `===` checks value + type.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the forgotten `$` prefix on echo!',
            lines: [
              '$streak = 12;',
              'echo streak;',
            ],
            bugLine: 1,
            fixed: 'echo $streak;',
            explanation: 'Without `$`, PHP expects an undefined constant named `streak`.',
          },
          {
            type: 'multiple_choice',
            question: 'What is `0 == ""` in PHP 7 vs `0 === ""` in PHP 8?',
            options: [
              'Both return true',
              '`0 === ""` strictly returns false because int != string',
              'Both throw TypeError',
              '`===` converts int to string',
            ],
            answer: 1,
            explanation: 'Always prefer `===` / `!==` so integers and strings never accidentally match.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Strict Types & Constants',
        subtitle: 'Enable strict_types=1 and lock constants cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Opting into Strict Parameter Types',
            explanation:
              'Top-of-file `declare(strict_types=1);` turns off silent numeric coercion on function parameters. Constants use `const NAME = val;` without `$`.',
            code: ['<?php', 'declare(strict_types=1);', 'const MAX_HEARTS = 5;'],
            highlightNote: '`strlen($s)` returns byte length; use `mb_strlen($s)` for UTF-8 accents/emoji!',
          },
          {
            type: 'token_builder',
            prompt: 'Enable strict typing and declare `API_VER` constant without `$`.',
            codeLines: ['<?php', 'declare({{0}}=1);', '{{1}} API_VER = 2;'],
            expectedTokens: ['strict_types', 'const'],
            distractors: ['strict', 'define', '$const'],
            explanation: '`declare(strict_types=1);` activates strict checks; `const` defines compile constants.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the illegal `$` prefix on a PHP constant declaration!',
            lines: [
              'const $LIMIT = 10;',
            ],
            bugLine: 0,
            fixed: 'const LIMIT = 10;',
            explanation: 'Constants NEVER start with `$` in PHP (`const LIMIT = 10;`).',
          },
          {
            type: 'multiple_choice',
            question: 'Why do pure `.php` source files usually omit the closing `?>` tag at the very bottom?',
            options: [
              'PHP 8 removed ?>',
              'Trailing spaces/newlines after ?> would accidentally flush HTTP output early!',
              'It runs 2x faster',
              'Composer forbids ?>',
            ],
            answer: 1,
            explanation: 'Accidental whitespace after `?>` breaks JSON/header responses—omitting `?>` prevents it.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: PHP Basics',
        subtitle: 'Check quotes, ===, strict_types, and dot concatenation',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Safely read optional `$name` or default to `"Visitor"` and print with interpolation.',
            codeLines: ['$who = $input {{0}} "Visitor";', 'echo "Welcome, {{1}}!\\n";'],
            expectedTokens: ['??', '$who'],
            distractors: ['||', 'who', '+'],
            explanation: '`??` supplies fallback cleanly without warnings on undefined array keys.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the silent interpolation failure inside single quotes!',
            lines: [
              '$gems = 90;',
              "echo 'Gems: $gems\\n';",
            ],
            bugLine: 1,
            fixed: 'echo "Gems: $gems\\n";',
            explanation: 'Neither `$gems` nor `\n` expands inside single quotes—switch to double quotes!',
          },
          {
            type: 'predict_output',
            prompt: 'What does `echo "5" . 3;` output in PHP?',
            code: ['echo "5" . 3;'],
            options: ['8', '53', 'TypeError'],
            answer: 1,
            explanation: 'The dot `.` operator converts both operands to text and joins them -> `"53"`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Conditionals & Loops',
        subtitle: 'Branch with elseif and iterate numeric/range loops',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Control Flow & elseif',
            explanation:
              'PHP uses `elseif` (one word or `else if`), standard `for ($i = 0; $i < 5; $i++)`, and `switch`/`match` expressions.',
            code: ['$xp = 150;', 'if ($xp >= 200) {', '    echo "Gold";', '} elseif ($xp >= 100) {', '    echo "Silver";', '}'],
            highlightNote: 'Spaceship `<=>` compares two values cleanly (`-1`, `0`, `1`) for custom sorting!',
          },
          {
            type: 'token_builder',
            prompt: 'Loop `$i` from `1` through `3` inclusive and accumulate `$sum`.',
            codeLines: ['$sum = 0;', '{{0}} ($i = 1; $i <= 3; $i++) {', '    {{1}} += $i;', '}'],
            expectedTokens: ['for', '$sum'],
            distractors: ['foreach', 'sum', 'while'],
            explanation: '`for` loops share C-style syntax with `$`-prefixed counters.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the Python `elif` keyword mistakenly written in PHP.',
            lines: [
              'if ($hp <= 0) {',
              '    echo "Down";',
              '} elif ($hp < 25) {',
              '    echo "Low";',
              '}',
            ],
            bugLine: 2,
            fixed: '} elseif ($hp < 25) {',
            explanation: 'PHP uses `elseif` (not `elif`).',
          },
          {
            type: 'predict_output',
            prompt: 'What does `$a = 10 <=> 25;` evaluate to with PHP’s spaceship operator?',
            code: ['echo (10 <=> 25);'],
            options: ['-1', '0', '1'],
            answer: 0,
            explanation: '`10 < 25`, so spaceship `<=>` returns `-1` (`0` if equal, `1` if greater).',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: PHP Core',
        subtitle: 'Combine strict_types, $, ., interpolation, and loops cleanly',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write a strict header, loop `$n`, and print exact totals using `.` or `""`.',
            codeLines: [
              '<?php',
              'declare({{0}}=1);',
              '$total = 0;',
              'for ($i = 1; $i <= 4; $i++) { $total += $i * 10; }',
              'echo "Total: " {{1}} $total;',
            ],
            expectedTokens: ['strict_types', '.'],
            distractors: ['strict', '+', '&'],
            explanation: 'Strict typing + dot string concatenation keeps PHP clean and bug-free.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing semicolon ending the PHP statement.',
            lines: [
              '<?php',
              '$user = "tariq"',
              'echo $user;',
            ],
            bugLine: 1,
            fixed: '$user = "tariq";',
            explanation: 'Every PHP statement terminates with a semicolon `;`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which operator safely checks null/unset keys (`$_GET["page"] ?? 1`) without an undefined key warning?',
            options: ['||', '??', '?:', '&'],
            answer: 1,
            explanation: 'Null coalescing `??` returns the fallback cleanly when unset or `null`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Indexed & Associative Arrays (5 nodes)
  // =========================================================================
  {
    title: 'Arrays & Associative Maps',
    subtitle: 'Master list arrays, key-value associative arrays, foreach, and array helpers.',
    conceptGraphicType: 'php_arrays',
    guidebook: {
      summary:
        'PHP’s `array` (`[...]`) is a Swiss-army ordered hash map: it works seamlessly BOTH as a `0`-indexed list (`[10, 20, 30]`) AND as a key-value associative dictionary (`["lang" => "php", "xp" => 90]`)!',
      mentalModel:
        'Under the hood, every PHP array preserves insertion order AND supports instant hash lookups—AND arrays are passed **by value (copy-on-write)** so mutating a parameter array never leaks outside unless passed `&`.',
      keyTakeaways: [
        'Use modern short brackets `[...]` cleanly instead of legacy `array(...)`.',
        'Append to a list cleanly via `$items[] = "Rust";`, and count elements with `count($items)`.',
        'Loop dictionaries with key + value via `foreach ($scores as $name => $xp) { ... }`.',
        'Spread & transform with `[...$a, ...$b]`, `array_map(...)`, and `array_filter(...)`.',
      ],
      keySyntax: [
        {
          title: 'Indexed & Associative Arrays',
          tag: 'MAPS + LISTS',
          code: '$langs = ["PHP", "SQL"];\n$langs[] = "Lua";\n$user = ["handle" => "ali", "xp" => 420];\necho count($langs) . " | " . $user["xp"];',
          output: '3 | 420',
          explanation:
            '`$langs[] = "Lua"` pushes to the end in O(1); `=>` pairs string keys with values inside associative arrays.',
          notes: [
            'Check safely if a key exists with `isset($user["bio"])` or `array_key_exists("bio", $user)`.',
          ],
        },
        {
          title: 'Foreach & Destructuring',
          tag: 'ITERATION',
          code: 'foreach ($user as $k => $v) {\n    echo "$k=$v\\n";\n}\n[$first, $second] = $langs;',
          output: 'handle=ali\nxp=420',
          explanation:
            'Symmetric destructuring `[$a, $b] = $list` unpacks values cleanly cleanly like JS!',
          notes: [
            'Destructure associative keys too: `["xp" => $xp] = $user;`!',
          ],
        },
        {
          title: 'array_map & array_filter',
          tag: 'TRANSFORMS',
          code: '$nums = [1, 2, 3, 4];\n$evens = array_filter($nums, fn($n) => $n % 2 === 0);\n$doubled = array_map(fn($n) => $n * 2, $evens);',
          output: '[4, 8]',
          explanation:
            'Careful: in `array_map`, the callback comes FIRST (`fn, $arr`), whereas in `array_filter`, the array comes FIRST (`$arr, fn`)!',
          notes: [
            '`array_values($filtered)` re-indexes sparse keys back to `[0, 1, ...]` cleanly.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Expecting array_filter to Re-Index Keys Back to 0',
          buggyCode: '$out = array_filter([10, 20, 30], fn($x) => $x > 15);\n// $out has keys [1 => 20, 2 => 30], NOT [0 => 20]!',
          fixedCode: '$out = array_values(array_filter([10, 20, 30], fn($x) => $x > 15));',
          reason:
            '`array_filter` preserves original numeric keys so `json_encode($out)` would turn into `{"1":20}` unless re-indexed via `array_values`!',
        },
        {
          title: 'Swapping Parameter Order of array_map vs array_filter',
          buggyCode: 'array_map($arr, fn($x) => $x * 2); // Deprecated/wrong order!',
          fixedCode: 'array_map(fn($x) => $x * 2, $arr);',
          reason:
            '`array_map($callback, $array)` accepts the callback first!',
        },
      ],
      proTip:
        'Unpack associative & numeric arrays cleanly using `[...$defaults, ...$overrides]` in PHP 8.1+—just like JavaScript object spread, overriding defaults without touching original arrays!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Lists & Key => Value Maps',
        subtitle: 'Create short arrays, push elements, and measure with count()',
        exercises: [
          {
            type: 'theory_bite',
            title: 'One Structure for Lists & Dicts',
            explanation:
              'Build lists `[1, 2, 3]` or associative maps `["name" => "Ada", "xp" => 80]`. Append cleanly with `$arr[] = val;` and check length via `count($arr)`.',
            code: ['$tags = ["php", "sql"];', '$tags[] = "lua";', '$hero = ["name" => "Zoe", "hp" => 100];', 'echo count($tags) . " " . $hero["name"];'],
            output: '3 Zoe',
            highlightNote: 'Notice fat arrow `=>` (not `:`) connects keys and values!',
          },
          {
            type: 'token_builder',
            prompt: 'Define an associative `$profile` and push `"Rust"` onto `$tracks`.',
            codeLines: ['$profile = ["handle" {{0}} "ali", "xp" => 500];', '$tracks{{1}} = "Rust";'],
            expectedTokens: ['=>', '[]'],
            distractors: [':', '.push()', '->'],
            explanation: 'Use `=>` for associative entries and `$tracks[] = ...` to append.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the JS colon syntax accidentally used in a PHP associative array.',
            lines: [
              '$cfg = [',
              '  "env": "prod",',
              '  "debug" => false,',
              '];',
            ],
            bugLine: 1,
            fixed: '  "env" => "prod",',
            explanation: 'PHP associative arrays require `=>`, never `:`!',
          },
          {
            type: 'predict_output',
            prompt: 'What does `echo count([10, 20, 30]);` print?',
            code: ['$a = [10, 20, 30];', 'echo count($a);'],
            options: ['2', '3', 'Undefined length()'],
            answer: 1,
            explanation: '`count($a)` returns the number of elements (`3`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'foreach & Unpacking',
        subtitle: 'Iterate maps cleanly with key => value and spread arrays',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Clean Iteration & Merging',
            explanation:
              'Iterate values `foreach ($arr as $v)` or pairs `foreach ($map as $k => $v)`. Merge/override associative arrays cleanly with spread `[...$a, ...$b]`.',
            code: ['$xp = ["ali" => 90, "mia" => 120];', 'foreach ($xp as $name => $pts) {', '    echo "$name:$pts ";', '}'],
            highlightNote: 'Values inside `foreach` iterate copies by default—original arrays stay safe!',
          },
          {
            type: 'token_builder',
            prompt: 'Loop over `$scores` printing each `$lang` key and `$pts` value.',
            codeLines: ['{{0}} ($scores as $lang {{1}} $pts) {', '    echo "$lang -> $pts\\n";', '}'],
            expectedTokens: ['foreach', '=>'],
            distractors: ['for', 'as', ':'],
            explanation: '`foreach ($map as $key => $val)` exposes both keys and values.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the swapped array / variable order in `foreach`!',
            lines: [
              '$items = ["a", "b"];',
              'foreach ($item as $items) {',
              '    echo $item;',
              '}',
            ],
            bugLine: 1,
            fixed: 'foreach ($items as $item) {',
            explanation: 'PHP puts the iterable array FIRST and the loop variable after `as`.',
          },
          {
            type: 'multiple_choice',
            question: 'What happens to original `$a` if a helper receives `$a` (by value) and executes `$a[] = 99;` inside?',
            options: [
              'Caller $a gains 99',
              'Caller $a stays unchanged because PHP arrays are copy-on-write values',
              'Throws ImmutableError',
              'Erases $a',
            ],
            answer: 1,
            explanation: 'PHP copies arrays on write unless `&` reference is explicitly requested.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Arrays',
        subtitle: 'Check isset vs null, count, and array_values',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Filter positive scores and re-index numeric keys cleanly from `0`.',
            codeLines: ['$pos = {{0}}(array_filter($nums, fn($n) => $n > 0));', 'echo {{1}}($pos);'],
            expectedTokens: ['array_values', 'count'],
            distractors: ['array_keys', 'len', 'size'],
            explanation: '`array_values(...)` compacts preserved keys back to sequential `[0..N-1]`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `array_map` rejects the swapped arguments!',
            lines: [
              '$nums = [1, 2, 3];',
              '$sq = array_map($nums, fn($x) => $x * $x);',
            ],
            bugLine: 1,
            fixed: '$sq = array_map(fn($x) => $x * $x, $nums);',
            explanation: '`array_map` takes the callback FIRST and the array SECOND.',
          },
          {
            type: 'multiple_choice',
            question: 'How does `isset($map["bio"])` differ from `array_key_exists("bio", $map)` when `$map = ["bio" => null]`?',
            options: [
              'Both return true',
              'isset returns false (treats null as unset), while array_key_exists returns true!',
              'array_key_exists throws Warning on null',
              'Both return false',
            ],
            answer: 1,
            explanation: 'Use `array_key_exists` when a stored `null` value still counts as present.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Map, Filter & Spread',
        subtitle: 'Transform data pipelines functionally with arrow functions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Arrow Functions & Pipeline Transforms',
            explanation:
              'Combine short `fn($x) => ...` arrows with `array_map`, `array_filter`, and `array_reduce`, and merge defaults via `[...$base, ...$patch]`.',
            code: ['$base = ["role" => "user", "hearts" => 5];', '$admin = [...$base, "role" => "admin"];'],
            highlightNote: 'PHP arrow functions `fn($x) => ...` capture outer `$vars` automatically!',
          },
          {
            type: 'token_builder',
            prompt: 'Merge `$defaults` and `$custom` cleanly so `$custom` keys win.',
            codeLines: ['$merged = [{{0}}$defaults, ...$custom];', '$inMap = {{1}}("sql", $langs, true);'],
            expectedTokens: ['...', 'in_array'],
            distractors: ['..', 'array_has', 'contains'],
            explanation: 'Spreading `[...$defaults, ...$custom]` overrides safely; always pass `true` (strict) to `in_array`!',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the dangerous loose `in_array` comparison (`0` matching `"sql"`)!',
            lines: [
              '$ids = [0, 1, 2];',
              '$found = in_array("sql", $ids);',
            ],
            bugLine: 1,
            fixed: '$found = in_array("sql", $ids, true);',
            explanation: 'Always pass the 3rd `true` parameter to `in_array` for strict `===` matching.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `implode("-", ["a", "b", "c"])` return?',
            code: ['echo implode("-", ["a", "b", "c"]);'],
            options: ['["a-b-c"]', 'a-b-c', 'abc'],
            answer: 1,
            explanation: '`implode(separator, array)` joins array elements into one string cleanly.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: PHP Collections',
        subtitle: 'Master associative maps, foreach, strict array checks, and spreads',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Filter scores `>= 50`, double them, and join cleanly with `", "`.',
            codeLines: [
              '$top = array_filter($scores, fn($s) => $s >= 50);',
              '$doubled = {{0}}(fn($s) => $s * 2, $top);',
              'echo {{1}}(", ", $doubled);',
            ],
            expectedTokens: ['array_map', 'implode'],
            distractors: ['array_walk', 'explode', 'join_str'],
            explanation: '`array_map` transforms values cleanly and `implode` joins them into text.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the wrong order of arguments passed to `array_filter`.',
            lines: [
              '$evens = array_filter(fn($n) => $n % 2 === 0, $nums);',
            ],
            bugLine: 0,
            fixed: '$evens = array_filter($nums, fn($n) => $n % 2 === 0);',
            explanation: 'Unlike `array_map`, `array_filter` takes `$array` FIRST and callback second!',
          },
          {
            type: 'multiple_choice',
            question: 'Which function splits `"rust,sql,c"` into an indexed PHP array `["rust", "sql", "c"]`?',
            options: ['split(",", $s)', 'explode(",", $s)', 'implode(",", $s)', 'str_split($s, ",")'],
            answer: 1,
            explanation: '`explode($sep, $str)` splits strings; `implode($sep, $arr)` joins them back.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Functions & Closures (5 nodes)
  // =========================================================================
  {
    title: 'Functions & Closures',
    subtitle: 'Type parameters, union returns, named args, arrow functions, and use() closures.',
    conceptGraphicType: 'php_funcs',
    guidebook: {
      summary:
        'Modern PHP 8 functions look remarkably sharp: full parameter/return types (`string|int`, `?string`), named arguments (`createUser(xp: 50)`), automatic outer capture in arrow `fn()`, and explicit `use ($x)` capture in multi-line closures.',
      mentalModel:
        'Remember PHP’s strict variable scope wall: regular functions AND multi-line `function () {}` closures CANNOT see outer variables unless you pass them in as arguments or explicitly import them with `use ($var)`! Only single-expression `fn() => ...` auto-captures by value.',
      keyTakeaways: [
        'Annotate parameter and return types cleanly (`function clamp(int $v, int $max): int`), including nullable `?string` and unions `int|float`.',
        'Multi-line closures MUST declare `use ($outer)` (`function ($x) use ($rate) { ... }`), while arrow `fn($x) => $x * $rate` auto-captures `$rate`.',
        'Use **named arguments** (`sendMail(to: $email, urgent: true)`) to skip defaults cleanly without long argument lists.',
        'Specify `: void` on functions that emit side effects (`echo`, DB writes) with zero return value.',
      ],
      keySyntax: [
        {
          title: 'Typed Functions, Nullable & Named Args',
          tag: 'PHP 8 SIGNATURES',
          code: 'function badge(string $name, int $xp = 0, ?string $tag = null): string {\n    $suffix = $tag ? " [$tag]" : "";\n    return "$name ($xp)$suffix";\n}\necho badge(name: "Kenji", tag: "VIP");',
          output: 'Kenji (0) [VIP]',
          explanation:
            'Named arguments skipped `$xp` seamlessly cleanly while preserving strict `?string` nullability.',
          notes: [
            '`?string` is clean shorthand for `string|null`.',
          ],
        },
        {
          title: 'Multi-Line Closures vs Arrow Functions',
          tag: 'CLOSURES',
          code: '$bonus = 20;\n$addBonus = function (int $x) use ($bonus): int {\n    return $x + $bonus;\n};\n$fast = fn(int $x): int => $x + $bonus;',
          output: 'Both return x + 20 with clean scope safety',
          explanation:
            'Multi-line `function () use ($bonus)` scopes explicitly; single-line `fn()` captures `$bonus` automatically by value.',
          notes: [
            'Use `use (&$count)` only when a closure explicitly needs to mutate an outer counter.',
          ],
        },
        {
          title: 'Variadics & Unpacking (...$args)',
          tag: 'VARIADICS',
          code: 'function sumAll(int ...$nums): int {\n    return array_sum($nums);\n}\necho sumAll(10, 20, 30);',
          output: '60',
          explanation:
            '`int ...$nums` collects arbitrary typed integers directly into `$nums` as an array.',
          notes: [
            'Unpack an existing array back into args using `sumAll(...$arr)`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using an Outer Variable Inside function () Without use ()',
          buggyCode: '$tax = 0.1;\n$fn = function ($price) { return $price * $tax; }; // Undefined $tax!',
          fixedCode: '$tax = 0.1;\n$fn = function ($price) use ($tax) { return $price * $tax; };',
          reason:
            'Unlike JavaScript closures, multi-line PHP anonymous functions isolate their scope completely unless `use ($tax)` imports it.',
        },
        {
          title: 'Writing global $x Everywhere Instead of Arguments',
          buggyCode: 'function calc() { global $xp; return $xp * 2; }',
          fixedCode: 'function calc(int $xp): int { return $xp * 2; }',
          reason:
            'Passing parameters explicitly keeps functions predictable, testable, and bug-free.',
        },
      ],
      proTip:
        'PHP 8.1+ supports **First-Class Callable Syntax** (`$trimAll = array_map(trim(...), $lines);`): appending `(...)` turns any function or method directly into a typed `Closure` with zero stringly-typed `"trim"` names!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Typed Signatures & Named Args',
        subtitle: 'Add strict parameter/return types and skip optional defaults cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicit Contracts & Named Parameters',
            explanation:
              'Specify types directly (`string`, `int`, `?string` nullable, `int|float` union) plus return `: type` after `)`. Pass arguments out of order via `name: value`.',
            code: ['function reward(string $user, int $xp = 25): string {', '    return "$user +$xp XP";', '}', 'echo reward(user: "Ada", xp: 50);'],
            output: 'Ada +50 XP',
            highlightNote: 'PHP variable names start with `$`, EXCEPT named argument labels (`xp: 50`)!',
          },
          {
            type: 'token_builder',
            prompt: 'Make `$tag` nullable and enforce a `string` return type.',
            codeLines: ['function formatTag({{0}} $tag): {{1}} {', '    return $tag ?? "none";', '}'],
            expectedTokens: ['?string', 'string'],
            distractors: ['string?', 'void', 'str'],
            explanation: '`?string` marks a nullable string cleanly; `: string` locks return type.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid `$` inside a named argument label.',
            lines: [
              'function greet(string $who, string $msg = "Hi") { return "$msg $who"; }',
              'echo greet($who: "Mia");',
            ],
            bugLine: 1,
            fixed: 'echo greet(who: "Mia");',
            explanation: 'Named call labels omit `$` (`who: "Mia"`, never `$who:`).',
          },
          {
            type: 'multiple_choice',
            question: 'What does `int|string` mean on a PHP 8 function parameter?',
            options: [
              'Bitwise OR of values',
              'Union type accepting either int OR string cleanly',
              'Converts int into string',
              'Invalid syntax',
            ],
            answer: 1,
            explanation: 'PHP 8 natively checks union types like `int|string` and `User|null`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Scope, Closures & use()',
        subtitle: 'Bridge outer variables safely into anonymous functions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicit Closure Imports',
            explanation:
              'Unlike JS/Python, a PHP `function` block does NOT inherit outer `$vars` automatically. Import read-only copies via `use ($factor)` or write one-line arrows `fn($x) => ...` which auto-capture.',
            code: ['$mult = 3;', '$fn = function (int $x) use ($mult): int {', '    return $x * $mult;', '};'],
            highlightNote: 'Need to mutate `$count` outside? Write `use (&$count)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Import `$prefix` into a multi-line closure and auto-capture it in an arrow fn.',
            codeLines: ['$wrap = function (string $s) {{0}} ($prefix): string {', '    return $prefix . $s;', '};', '$short = {{1}}(string $s): string => $prefix . $s;'],
            expectedTokens: ['use', 'fn'],
            distractors: ['import', 'function', 'arrow'],
            explanation: '`use ($prefix)` imports outer vars cleanly; `fn(...) =>` captures automatically.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the undefined outer variable error inside this closure!',
            lines: [
              '$limit = 10;',
              '$filter = function (int $n): bool {',
              '    return $n <= $limit;',
              '};',
            ],
            bugLine: 1,
            fixed: '$filter = function (int $n) use ($limit): bool {',
            explanation: 'Multi-line PHP closures require `use ($limit)` to access `$limit`.',
          },
          {
            type: 'predict_output',
            prompt: 'With `$k = 2; $f = fn($x) => $x * $k; $k = 10; echo $f(5);`, what prints?',
            code: ['$k = 2;', '$f = fn($x) => $x * $k;', '$k = 10;', 'echo $f(5);'],
            options: ['50', '10', 'Undefined variable'],
            answer: 1,
            explanation: '`fn()` captures `$k` by **value** at creation (`2`), printing `5 * 2 = 10`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Functions',
        subtitle: 'Verify union returns, void, and closure capture rules',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Accept variadic integers safely and return total sum as `int`.',
            codeLines: ['function total(int {{0}}nums): {{1}} {', '    return array_sum($nums);', '}'],
            expectedTokens: ['...$', 'int'],
            distractors: ['&$', 'void', 'array'],
            explanation: '`int ...$nums` validates every argument as `int` cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why returning a value inside `: void` fails compilation.',
            lines: [
              'function logXp(int $x): void {',
              '    echo $x;',
              '    return $x;',
              '}',
            ],
            bugLine: 2,
            fixed: '    return;',
            explanation: '`: void` functions may only `return;` early without a value.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `array_map(strtoupper(...), ["py", "go"])` do in PHP 8.1+?',
            options: [
              'Syntax error near (...)',
              'Passes `strtoupper` cleanly using First-Class Callable syntax',
              'Uppercases only the first string',
              'Mutates original array in place',
            ],
            answer: 1,
            explanation: '`fnName(...)` builds a first-class closure without fragile string function names.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Generators & Callables',
        subtitle: 'Stream large datasets lazily with yield instead of huge arrays',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Streaming Values with yield',
            explanation:
              'Returning a 1M-row array uses huge RAM. Replace `return` with `yield $item;` inside a `Generator` function so `foreach` pulls one item at a time in constant O(1) memory.',
            code: ['function seq(int $max): Generator {', '    for ($i = 1; $i <= $max; $i++) yield $i;', '}'],
            highlightNote: 'Notice a generator function’s return type is `Generator` or `iterable`!',
          },
          {
            type: 'token_builder',
            prompt: 'Stream IDs one by one lazily without building a full array in memory.',
            codeLines: ['function ids(int $n): {{0}} {', '    for ($i = 0; $i < $n; $i++) {{1}} $i;', '}'],
            expectedTokens: ['Generator', 'yield'],
            distractors: ['array', 'return', 'emit'],
            explanation: '`yield` turns `ids` into a lazy O(1)-RAM `Generator`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid return type on a yielding generator function.',
            lines: [
              'function rangeGen(): array {',
              '    yield 1;',
              '    yield 2;',
              '}',
            ],
            bugLine: 0,
            fixed: 'function rangeGen(): Generator {',
            explanation: 'Functions using `yield` return a `Generator` (or `iterable`), never plain `array`.',
          },
          {
            type: 'multiple_choice',
            question: 'What typehint accepts BOTH an `array` AND a lazy `Generator` seamlessly?',
            options: ['mixed', 'iterable', 'Traversable', 'object'],
            answer: 1,
            explanation: '`iterable` accepts arrays and `Traversable`/`Generator` objects cleanly.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: PHP Function Craft',
        subtitle: 'Combine strict types, closures, variadics, and generators',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build a counter incrementer mutating an outer `$hits` cleanly via closure.',
            codeLines: [
              '$hits = 0;',
              '$record = function (int $step = 1) use ({{0}}$hits): void {',
              '    $hits += $step;',
              '};',
              '$record({{1}}: 3);',
            ],
            expectedTokens: ['&', 'step'],
            distractors: ['*', '$step', 'val'],
            explanation: '`use (&$hits)` mutates `$hits`; named argument `step: 3` targets explicitly.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why optional parameter order triggers a deprecation/error in PHP 8.',
            lines: [
              'function create(string $tag = "new", string $name): string {',
              '    return "$tag:$name";',
              '}',
            ],
            bugLine: 0,
            fixed: 'function create(string $name, string $tag = "new"): string {',
            explanation: 'Place required parameters BEFORE parameters with `= default` values.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `$a = [2, 4]; echo sumAll(...$a);` evaluate to?',
            code: ['function sumAll(int ...$xs): int { return array_sum($xs); }', '$a = [2, 4];', 'echo sumAll(...$a);'],
            options: ['[2, 4]', '6', 'TypeError'],
            answer: 1,
            explanation: 'Argument unpacking `...$a` spreads `2, 4` cleanly into `$xs` returning `6`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Modern OOP & Namespaces (5 nodes)
  // =========================================================================
  {
    title: 'OOP, Promotion & Namespaces',
    subtitle: 'Eliminate boilerplate with constructor promotion, readonly classes, and interfaces.',
    conceptGraphicType: 'php_oop',
    guidebook: {
      summary:
        'PHP 8 modernized OOP dramatically: **Constructor Property Promotion** declares visibility, type, property, and assignment all in one parameter list, while `readonly` prevents accidental field mutations and `->` accesses methods cleanly.',
      mentalModel:
        'Use `$obj->prop` (`->`) for instance members (NOT `.` dot!) and `ClassName::CONST` (`::`) for static constants/factories. Inside the class, `$this->prop` refers to the current instance.',
      keyTakeaways: [
        'Declare properties cleanly right inside `__construct(public readonly string $id, private int $xp = 0) {}`!',
        'Instance access ALWAYS uses arrow `->` (`$user->addXp(25)`), while static calls use `::` (`User::create(...)`).',
        'Favor `interface` + composition over deep inheritance chains, and mark immutable value objects `readonly`.',
        'Organize files with `namespace App\\Models;` matching PSR-4 folder paths cleanly.',
      ],
      keySyntax: [
        {
          title: 'Constructor Property Promotion + readonly',
          tag: 'PHP 8 OOP',
          code: 'class Profile {\n    public function __construct(\n        public readonly string $handle,\n        private int $xp = 0,\n    ) {}\n\n    public function earn(int $pts): void { $this->xp += $pts; }\n}',
          output: 'Zero redundant property boilerplate; $handle immutable',
          explanation:
            'Putting `public`/`private`/`readonly` before constructor parameters auto-declares and assigns those properties immediately.',
          notes: [
            'In PHP 8.2+, marking `readonly class Foo` makes every single property `readonly` automatically!',
          ],
        },
        {
          title: 'Interfaces & Static Self Factories',
          tag: 'CONTRACTS',
          code: 'interface Scorable {\n    public function score(): int;\n}\nclass Quiz implements Scorable {\n    public function score(): int { return 100; }\n}',
          output: 'Polymorphic contract guaranteed by PHP',
          explanation:
            'Classes adopt contracts via `implements`; use `self` or `static` for factory return types.',
          notes: [
            '`final class Token` blocks unintended subclass inheritance cleanly.',
          ],
        },
        {
          title: 'Namespaces & Imports (use)',
          tag: 'NAMESPACES',
          code: 'namespace App\\Domain;\nuse App\\Contracts\\Scorable;\nuse DateTimeImmutable;',
          output: 'Zero class name collisions across packages',
          explanation:
            'Built-in global classes like `DateTimeImmutable` inside a namespace need a `use` import (or leading `\\`).',
          notes: [
            'Composer PSR-4 autoloads `App\\Domain\\User` directly from `src/Domain/User.php`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Writing $this.xp (Dot) Instead of $this->xp (Arrow)',
          buggyCode: '$this.xp += 10; // Joins strings instead of reading property!',
          fixedCode: '$this->xp += 10;',
          reason:
            'In PHP, `.` concatenates text—object property/method access ALWAYS uses `->` AND omits `$` on the property name (`$this->xp`, NOT `$this->$xp`)!',
        },
        {
          title: 'Writing $this->$prop by Accident',
          buggyCode: 'return $this->$handle; // Reads property named by dynamic $handle var!',
          fixedCode: 'return $this->handle;',
          reason:
            'Writing `$` after `->` triggers a dynamic variable-property lookup! Keep `$` only on `$this`, never on the property identifier.',
        },
      ],
      proTip:
        'Use `DateTimeImmutable` instead of mutable `DateTime` everywhere in PHP—calling `$date->modify("+1 day")` returns a safe new date object instead of mutating shared timestamps unexpectedly!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Classes & Promotion',
        subtitle: 'Write lean PHP 8 constructors with property promotion',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Boilerplate Promoted Properties',
            explanation:
              'Prefix `__construct` parameters with `public`, `private`, or `protected` (plus optional `readonly`) to declare & initialize properties automatically. Access members with `$this->field`.',
            code: ['class Hero {', '    public function __construct(', '        public readonly string $name,', '        public int $xp = 0,', '    ) {}', '}'],
            highlightNote: 'Notice NO `$` before the field name in `$hero->xp`!',
          },
          {
            type: 'token_builder',
            prompt: 'Promote immutable `$id` publicly and build an instance via `new`.',
            codeLines: ['class Node {', '    public function __construct({{0}} readonly string $id) {}', '}', '$n = {{1}} Node("n1");', 'echo $n->id;'],
            expectedTokens: ['public', 'new'],
            distractors: ['var', 'create', 'def'],
            explanation: '`public readonly` promotes `$id` right in `__construct`; `new` instantiates it.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the extra `$` bug performing dynamic property lookup!',
            lines: [
              'class User {',
              '    public function __construct(public string $handle) {}',
              '    public function tag(): string { return "@" . $this->$handle; }',
              '}',
            ],
            bugLine: 2,
            fixed: '    public function tag(): string { return "@" . $this->handle; }',
            explanation: 'Property access in PHP omits `$` on the field (`$this->handle`).',
          },
          {
            type: 'multiple_choice',
            question: 'How do you access an instance method `earn(25)` on `$player` in PHP?',
            options: ['$player.earn(25)', '$player::earn(25)', '$player->earn(25)', '$player->earn($25)'],
            answer: 2,
            explanation: 'Instance calls use single arrow `->`, whereas static/class constants use `::`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Visibility, Static & Interfaces',
        subtitle: 'Enforce encapsulation, static :: calls, and interface contracts',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Encapsulation & Interfaces',
            explanation:
              'Keep internal state `private`, expose contracts with `interface` + `implements`, and access `static` factories/constants using double-colon `::`.',
            code: ['interface Runner { public function run(): void; }', 'class Job implements Runner {', '    public const TIMEOUT = 30;', '    public function run(): void { echo self::TIMEOUT; }', '}'],
            highlightNote: 'Inside a class, constants & static methods use `self::NAME`.',
          },
          {
            type: 'token_builder',
            prompt: 'Implement interface `HasXp` and read a class constant inside a method.',
            codeLines: ['class Lesson {{0}} HasXp {', '    public const BASE_XP = 25;', '    public function xp(): int { return {{1}}::BASE_XP; }', '}'],
            expectedTokens: ['implements', 'self'],
            distractors: ['extends', 'this', 'new'],
            explanation: 'Classes implement interfaces with `implements` and read constants via `self::`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the wrong operator accessing a class constant!',
            lines: [
              'class Config { public const LIMIT = 5; }',
              'echo Config->LIMIT;',
            ],
            bugLine: 1,
            fixed: 'echo Config::LIMIT;',
            explanation: 'Class constants and static members always use `::`, never `->`.',
          },
          {
            type: 'predict_output',
            prompt: 'What happens if external code writes `$user->xp = 999;` when `$xp` is `private`?',
            code: ['$user = new Profile("ada", xp: 10);', '$user->xp = 999;'],
            options: ['Updates silently', 'Fatal Error: Cannot access private property', 'Sets public copy'],
            answer: 1,
            explanation: '`private` blocks external reads/writes directly—expose explicit methods instead.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: OOP',
        subtitle: 'Check promotion, readonly, -> vs ::, and traits',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Share reusable timestamp methods cleanly across classes via a `trait`.',
            codeLines: ['{{0}} HasTimestamps {', '    public function created(): string { return "now"; }', '}', 'class Post { {{1}} HasTimestamps; }'],
            expectedTokens: ['trait', 'use'],
            distractors: ['mixin', 'implements', 'extends'],
            explanation: 'Traits bundle horizontal reusable methods imported inside classes via `use`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the invalid mutation on a readonly promoted field!',
            lines: [
              'class Item { public function __construct(public readonly int $id) {} }',
              '$it = new Item(10);',
              '$it->id = 20;',
            ],
            bugLine: 2,
            fixed: '$it2 = new Item(20);',
            explanation: '`readonly` properties can only be initialized once inside `__construct`.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `readonly class Point { public function __construct(public int $x, public int $y) {} }` guarantee in PHP 8.2+?',
            options: [
              'Class cannot be instantiated',
              'Every declared property inside Point is automatically readonly',
              'Point becomes static',
              'Fields auto-convert to strings',
            ],
            answer: 1,
            explanation: 'Class-level `readonly` enforces immutability across all fields cleanly.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Namespaces & Autoloading',
        subtitle: 'Isolate classes in App\\ namespaces cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero Name Collisions with Namespaces',
            explanation:
              'Start module files with `namespace App\\Services;` right after `declare(...)`. Import other namespaces—and global classes like `\\DateTimeImmutable`—using `use`.',
            code: ['<?php', 'namespace App\\Models;', 'use DateTimeImmutable;', '$now = new DateTimeImmutable();'],
            highlightNote: 'Notice PHP separates namespace segments with backslash `\\`!',
          },
          {
            type: 'token_builder',
            prompt: 'Declare namespace `App\\Api` and import `App\\Models\\User`.',
            codeLines: ['<?php', '{{0}} App\\Api;', '{{1}} App\\Models\\User;', 'class Controller {}'],
            expectedTokens: ['namespace', 'use'],
            distractors: ['package', 'import', 'include'],
            explanation: '`namespace` scopes the file; `use` imports short class names cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the forward-slash typo in a PHP namespace path!',
            lines: [
              '<?php',
              'namespace App/Domain;',
            ],
            bugLine: 1,
            fixed: 'namespace App\\Domain;',
            explanation: 'PHP namespaces strictly use backslash `\\`, not forward slash `/`.',
          },
          {
            type: 'multiple_choice',
            question: 'When inside `namespace App;`, why might `new DateTimeImmutable()` fail without a `use` import or leading `\\`?',
            options: [
              'DateTimeImmutable was removed in PHP 8',
              'PHP looks for `App\\DateTimeImmutable` unless imported or prefixed `\\DateTimeImmutable`',
              'Constructors ignore namespaces',
              'It runs slower',
            ],
            answer: 1,
            explanation: 'Relative class names resolve inside the current namespace unless imported with `use`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: PHP Architect',
        subtitle: 'Master promoted readonly OOP, interfaces, and namespaces',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write a clean immutable `Account` implementing `HasId` in namespace `App`.',
            codeLines: [
              '<?php',
              'namespace App;',
              'readonly class Account {{0}} HasId {',
              '    public function __construct(private string $id) {}',
              '    public function id(): string { return {{1}}->id; }',
              '}',
            ],
            expectedTokens: ['implements', '$this'],
            distractors: ['extends', 'self', '$id'],
            explanation: 'Immutable `readonly class` + `implements` + `$this->id` yields clean PHP 8 code.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the `.` string operator mistakenly used for an OOP method call!',
            lines: [
              '$svc = new Mailer();',
              '$svc.send("ada@dev");',
            ],
            bugLine: 1,
            fixed: '$svc->send("ada@dev");',
            explanation: 'Object methods in PHP always use arrow `->`, never dot `.`!',
          },
          {
            type: 'predict_output',
            prompt: 'What does `echo get_class(new User());` return inside `namespace App;`?',
            code: ['namespace App;', 'class User {}', 'echo get_class(new User());'],
            options: ['User', 'App\\User', 'Object'],
            answer: 1,
            explanation: 'Namespaces prefix full FQCN class names as `App\\User`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Null-Safe, Match & JSON (5 nodes)
  // =========================================================================
  {
    title: 'Null-Safe, Match & JSON',
    subtitle: 'Master PHP 8 ?-> chains, strict match() expressions, enums, and json_encode.',
    conceptGraphicType: 'php_modern',
    guidebook: {
      summary:
        'Modern PHP 8 ships expressive constructs that cut clutter cleanly: **null-safe chaining** (`$user?->profile?->city`), **strict `match ($code)` expressions** (zero fallthrough bugs, strict `===`), **backed Enums**, and safe **JSON** handling (`JSON_THROW_ON_ERROR`).',
      mentalModel:
        'Compare `switch` vs `match`: `switch` checks loosely (`==`), falls through silently without `break`, and is a statement. `match` checks strictly (`===`), NEVER falls through, AND returns a value cleanly!',
      keyTakeaways: [
        'Chain nullable objects cleanly using `$order?->user?->email ?? "none"` without nested `if ($x !== null)` pyramids.',
        'Prefer `match ($status)` over `switch`: it uses strict `===`, returns values directly, and enforces a matching or `default` arm!',
        'Declare typed domain states cleanly using PHP 8.1 `enum League: string { case Gold = "gold"; }`.',
        'Pass `JSON_THROW_ON_ERROR` into `json_encode` / `json_decode` so corrupt JSON throws a clear `JsonException` immediately.',
      ],
      keySyntax: [
        {
          title: 'Strict match() Expression',
          tag: 'MATCH',
          code: '$tier = match (true) {\n    $xp >= 1000 => "Diamond",\n    $xp >= 500  => "Gold",\n    default     => "Bronze",\n};',
          output: 'Returns exact string without needing `break;`',
          explanation:
            '`match` evaluates top-to-bottom cleanly, terminates with `;`, and throws `UnhandledMatchError` if no case + no `default` matches.',
          notes: [
            'Combine arms with commas: `200, 201 => "OK"`.',
          ],
        },
        {
          title: 'Null-Safe Operator ?-> & Coalescing',
          tag: 'NULL SAFE',
          code: '$bio = $user?->getProfile()?->bio ?? "No bio yet";',
          output: '"No bio yet" cleanly even when `$user` or `getProfile()` returns null',
          explanation:
            'If `$user` is `null`, `?->getProfile()` short-circuits cleanly to `null` without calling the method or crashing!',
          notes: [
            'Combine `?->` cleanly at the end with `??` for crisp fallback values.',
          ],
        },
        {
          title: 'Backed Enum & Throwing JSON',
          tag: 'ENUMS + JSON',
          code: 'enum Track: string { case Rust = "rust"; case Sql = "sql"; }\n$data = json_decode($raw, associative: true, flags: JSON_THROW_ON_ERROR);',
          output: 'Associative array guaranteed or throws JsonException',
          explanation:
            'Passing `associative: true` returns PHP arrays instead of `stdClass`, and `JSON_THROW_ON_ERROR` catches malformed payloads instantly.',
          notes: [
            'Backed enums convert back cleanly from DB strings using `Track::from("rust")` or nullable `Track::tryFrom($input)`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting Semicolon After match () { ... } Expression',
          buggyCode: '$label = match ($n) {\n    1 => "One",\n    default => "Other"\n}',
          fixedCode: '$label = match ($n) {\n    1 => "One",\n    default => "Other",\n};',
          reason:
            'Because `match` is an expression assigned with `=`, its closing brace MUST end with a `;`!',
        },
        {
          title: 'Ignoring Silent null From json_decode($badJson)',
          buggyCode: '$data = json_decode($bad, true); // Silently returns null!',
          fixedCode: '$data = json_decode($bad, true, flags: JSON_THROW_ON_ERROR);',
          reason:
            'Without `JSON_THROW_ON_ERROR`, broken JSON fails quietly returning `null` instead of surfacing an error.',
        },
      ],
      proTip:
        'Wrap database string codes cleanly with `EnumName::tryFrom($input) ?? EnumName::Default` — invalid user inputs never crash and valid values get strict typed enum safety everywhere!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Strict match() Expressions',
        subtitle: 'Replace fallthrough switch statements cleanly with match',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Fallthrough Value Matching',
            explanation:
              '`match ($val) { ... };` evaluates strictly (`===`), supports comma-joined arms (`1, 2 => "Low"`), never falls through, and returns the matched result directly.',
            code: ['$msg = match ($status) {', '    200, 201 => "Success",', '    404 => "Missing",', '    default => "Error",', '};'],
            highlightNote: 'Notice `;` right after closing `}` of `match`!',
          },
          {
            type: 'token_builder',
            prompt: 'Map `$code` strictly using `match` and a `default` arm.',
            codeLines: ['$label = {{0}} ($code) {', '    "py" => "Python",', '    "rs" => "Rust",', '    {{1}} => "Course",', '};'],
            expectedTokens: ['match', 'default'],
            distractors: ['switch', 'else', '_'],
            explanation: '`match` ends with `;` and handles unmatched values via `default`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing semicolon after this `match` expression.',
            lines: [
              '$tier = match ($xp) {',
              '    0 => "New",',
              '    default => "Active",',
              '}',
            ],
            bugLine: 3,
            fixed: '};',
            explanation: '`match` is an expression assigned to `$tier`, so it must end in `;`.',
          },
          {
            type: 'predict_output',
            prompt: 'Because `match` uses strict `===`, what does `match ("1") { 1 => "num", "1" => "str" };` return?',
            code: ['echo match ("1") { 1 => "num", "1" => "str" };'],
            options: ['num', 'str', 'UnhandledMatchError'],
            answer: 1,
            explanation: 'String `"1"` does NOT match integer `1`, jumping cleanly to `"1" => "str"`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Null-Safe ?-> Chains',
        subtitle: 'Safely traverse nullable objects and methods without crashes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Short-Circuiting Null Safety',
            explanation:
              'Writing `$user->profile->city` crashes if `$user` or `profile` is `null`. Use `?->` (`$user?->profile?->city`) so any `null` cleanly yields `null` instead of crashing.',
            code: ['$city = $session?->getUser()?->city ?? "Unknown";'],
            highlightNote: '`?->` works for BOTH properties (`?->name`) and method calls (`?->getName()`)!',
          },
          {
            type: 'token_builder',
            prompt: 'Safely read nullable `$profile?->bio` and fallback cleanly to `""`.',
            codeLines: ['$bio = $user{{0}}getProfile()?->bio {{1}} "";'],
            expectedTokens: ['?->', '??'],
            distractors: ['?.', '||', '->'],
            explanation: 'PHP uses `?->` (not `?.`) for null-safe method/property chaining.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the JS optional chaining `?.` typo in PHP!',
            lines: [
              '$name = $user?.profile?.name ?? "Anon";',
            ],
            bugLine: 0,
            fixed: '$name = $user?->profile?->name ?? "Anon";',
            explanation: 'PHP object access uses arrows, so null-safe chaining is `?->` (`not ?.`).',
          },
          {
            type: 'multiple_choice',
            question: 'Can you assign a value TO a null-safe chain (`$user?->xp = 10;`) in PHP?',
            options: [
              'Yes, writes when non-null',
              'No! ?-> is read-only and cannot sit on the left of `=`',
              'Only on readonly props',
              'Assigns global $xp',
            ],
            answer: 1,
            explanation: 'PHP rejects `$a?->b = ...` at compile time—check `if ($user !== null)` before writing.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Modern PHP',
        subtitle: 'Verify backed enums, tryFrom, and error-throwing JSON',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Declare a string-backed `League` enum and parse safely without throwing.',
            codeLines: ['{{0}} League: string { case Gold = "gold"; case Silver = "silver"; }', '$picked = League::{{1}}($input) ?? League::Silver;'],
            expectedTokens: ['enum', 'tryFrom'],
            distractors: ['class', 'from', 'parse'],
            explanation: '`tryFrom` returns `null` safely on unknown strings, pairing with `??`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why invalid JSON hides bugs without raising exceptions!',
            lines: [
              '$payload = json_decode($rawBody, true);',
            ],
            bugLine: 0,
            fixed: '$payload = json_decode($rawBody, true, flags: JSON_THROW_ON_ERROR);',
            explanation: 'Pass `JSON_THROW_ON_ERROR` so corrupt JSON triggers catchable `JsonException`.',
          },
          {
            type: 'multiple_choice',
            question: 'What does the 2nd `true` argument do in `json_decode($json, true)`?',
            options: [
              'Enables strict UTF-8',
              'Decodes JSON objects into associative arrays `[...]` instead of `stdClass` objects',
              'Throws on error',
              'Pretty-prints output',
            ],
            answer: 1,
            explanation: 'Setting `$associative = true` produces familiar PHP `[...]` dictionaries.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Exceptions & Try/Catch',
        subtitle: 'Handle RuntimeException cleanly with try/catch/finally',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Structured Error Recovery',
            explanation:
              'Raise failures with `throw new InvalidArgumentException("...")`, catch typed exceptions cleanly with `catch (JsonException|RuntimeException $e)`, and run cleanup in `finally`.',
            code: ['try {', '    $data = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);', '} catch (JsonException $e) {', '    $data = [];', '}'],
            highlightNote: 'PHP 8 even allows multi-type catches (`catch (A|B $e)`) or nameless `catch (JsonException)`.',
          },
          {
            type: 'token_builder',
            prompt: 'Throw cleanly on empty input and catch `JsonException` safely.',
            codeLines: ['try {', '    if ($raw === "") {{0}} new InvalidArgumentException("Empty");', '} {{1}} (InvalidArgumentException $e) {', '    echo $e->getMessage();', '}'],
            expectedTokens: ['throw', 'catch'],
            distractors: ['raise', 'except', 'rescue'],
            explanation: 'Use `throw new ...` and `catch (Type $e)` with arrow `$e->getMessage()`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the broken dot call inside catch.',
            lines: [
              'try {',
              '    runTask();',
              '} catch (RuntimeException $e) {',
              '    echo $e.getMessage();',
              '}',
            ],
            bugLine: 3,
            fixed: '    echo $e->getMessage();',
            explanation: 'Exception methods on `$e` require `->` (`$e->getMessage()`).',
          },
          {
            type: 'multiple_choice',
            question: 'Does PHP 8 let `throw` appear inside expressions like `$val = $input ?? throw new Exception("Missing");`?',
            options: [
              'No, throw is statement-only',
              'Yes! PHP 8 turned `throw` into a valid expression for ??, match, and ?:',
              'Only inside catch blocks',
              'Only for RuntimeException',
            ],
            answer: 1,
            explanation: 'Expressive `throw` inside `??` or `match` arms keeps validation super concise!',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Modern PHP 8 Pro',
        subtitle: 'Conquer ?->, match, enums, strict JSON, and exceptions',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Decode JSON safely, match status code strictly, and read nullable handle.',
            codeLines: [
              '$obj = json_decode($raw, true, flags: {{0}});',
              '$badge = {{1}} ($obj["xp"] ?? 0) {',
              '    0 => "Starter",',
              '    default => $user?->handle ?? "Member",',
              '};',
            ],
            expectedTokens: ['JSON_THROW_ON_ERROR', 'match'],
            distractors: ['JSON_STRICT', 'switch', 'case'],
            explanation: 'Throwing JSON + strict `match` + `?->` yields ultra-safe PHP 8 code.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why invalid enum string crashes instead of defaulting gracefully!',
            lines: [
              'enum Mode: string { case Fast = "fast"; case Safe = "safe"; }',
              '$m = Mode::from($untrustedInput) ?? Mode::Safe;',
            ],
            bugLine: 1,
            fixed: '$m = Mode::tryFrom($untrustedInput) ?? Mode::Safe;',
            explanation: '`Mode::from()` throws `ValueError` before `??` runs; use `Mode::tryFrom()`!',
          },
          {
            type: 'predict_output',
            prompt: 'What does `$a = null; echo $a?->count() ?? 0;` print?',
            code: ['$a = null;', 'echo $a?->count() ?? 0;'],
            options: ['Fatal Error', '0', 'null'],
            answer: 1,
            explanation: '`?->` returns `null` safely so `?? 0` prints `0`.',
          },
        ],
      },
    ],
  },
];
