import type { UnitSeed } from './types';

export const SQL_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Querying Tables & Sorting (6 nodes)
  // =========================================================================
  {
    title: 'Querying Tables & Sorting',
    subtitle: 'Read columns with SELECT, remove duplicates, sort rows, and cap results.',
    conceptGraphicType: 'sql_select',
    guidebook: {
      summary:
        'SQL (Structured Query Language) declares *what* data you want rather than *how* to loop over rows. Even though you write `SELECT` first, the database engine logically picks `FROM` the table before selecting columns, sorting with `ORDER BY`, and slicing rows with `LIMIT`.',
      mentalModel:
        'Imagine a spreadsheet table: `FROM` picks which sheet to open, `SELECT` chooses which vertical columns to show, `ORDER BY` sorts the rows, and `LIMIT` tears off only the top few rows.',
      keyTakeaways: [
        'List explicit columns (`SELECT name, xp FROM users;`) instead of `SELECT *` in production queries.',
        'Use `AS` to rename output columns (`xp * 2 AS double_xp`) for clean downstream reports.',
        '`SELECT DISTINCT` eliminates duplicate combinations across the selected columns.',
        '`ORDER BY col DESC LIMIT N` is the standard Top-N leaderboard pattern (`ASC` is the default).',
      ],
      keySyntax: [
        {
          title: 'Select Columns with Aliases',
          tag: 'PROJECTION',
          code: 'SELECT username AS handle, xp\nFROM users\nORDER BY xp DESC\nLIMIT 2;',
          output: 'handle    | xp\n----------+-----\nada_py    | 1420\nleo_cpp   | 1180',
          explanation:
            '`SELECT` picks the columns to display, `AS` gives `username` a friendlier header, and `ORDER BY ... DESC LIMIT 2` keeps the top two.',
          notes: [
            'SQL keywords are case-insensitive, though uppercase `SELECT`/`FROM` is standard style.',
            'Semicolon `;` terminates each standalone SQL statement.',
          ],
        },
        {
          title: 'Deduplicate with DISTINCT',
          tag: 'UNIQUES',
          code: 'SELECT DISTINCT league\nFROM users\nORDER BY league ASC;',
          output: 'league\n--------\nBronze\nGold\nSilver',
          explanation:
            '`DISTINCT` collapses repeated values so each unique `league` appears once.',
          notes: [
            'Sorting strings alphabetically uses `ASC` (default) or `DESC` for Z-to-A.',
          ],
        },
        {
          title: 'Multi-Column Sort & Offset Pagination',
          tag: 'PAGINATION',
          code: 'SELECT name, price\nFROM items\nORDER BY price DESC, name ASC\nLIMIT 5 OFFSET 5;',
          output: '(page 2: rows 6..10 sorted by highest price)',
          explanation:
            'When two rows tie on `price`, `name ASC` breaks the tie alphabetically; `OFFSET 5` skips page 1.',
          notes: [
            '`ASC` / `DESC` applies per column, not to the whole `ORDER BY` list.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using == or Putting LIMIT Before ORDER BY',
          buggyCode: 'SELECT name FROM users LIMIT 3 ORDER BY xp DESC;',
          fixedCode: 'SELECT name FROM users ORDER BY xp DESC LIMIT 3;',
          reason:
            '`LIMIT` must always come after `ORDER BY` (near the end of the query), otherwise SQL fails to parse.',
        },
        {
          title: 'Double Quotes for String Literals Instead of Identifiers',
          buggyCode: 'SELECT * FROM users WHERE league = "Gold";',
          fixedCode: "SELECT * FROM users WHERE league = 'Gold';",
          reason:
            'Standard SQL uses single quotes `\'Gold\'` for text values; double quotes wrap column or table identifiers.',
        },
      ],
      proTip:
        'SQL runs in this logical order: `FROM` -> `WHERE` -> `GROUP BY` -> `HAVING` -> `SELECT` -> `DISTINCT` -> `ORDER BY` -> `LIMIT`. Understanding that order immediately explains why `ORDER BY` can sort by `SELECT` aliases while `WHERE` cannot!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'SELECT & FROM',
        subtitle: 'Project specific columns from a relational table',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Choosing Columns',
            explanation:
              '`SELECT` chooses which columns appear in your result, and `FROM` names the source table. Pick exact columns instead of `*` to keep queries fast.',
            code: ['SELECT username, xp', 'FROM learners;'],
            output: 'username | xp\n---------+-----\nada_py   | 940',
            highlightNote: 'Every statement cleanly ends with `;`.',
          },
          {
            type: 'token_builder',
            prompt: 'Query the `title` and `difficulty` columns from `lessons`.',
            codeLines: ['{{0}} title, difficulty', '{{1}} lessons;'],
            expectedTokens: ['SELECT', 'FROM'],
            distractors: ['GET', 'TABLE', 'IN'],
            syntaxHint: 'Columns follow `SELECT`, table name follows `FROM`.',
            explanation: '`SELECT cols FROM table;` is the backbone of SQL reads.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the syntax mistake in this query.',
            lines: [
              'FROM users',
              'SELECT username, streak;',
            ],
            bugLine: 0,
            fixed: 'SELECT username, streak FROM users;',
            explanation: '`SELECT` must always be written before `FROM` in SQL.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `SELECT * FROM courses;` return?',
            options: [
              'Only numeric columns from courses',
              'Every column of every row in courses',
              'The row count of courses',
              'Only distinct values in courses',
            ],
            answer: 1,
            explanation: '`*` expands to every column defined on the target table.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Aliases & Expressions',
        subtitle: 'Rename columns with AS and compute inline expressions',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Renaming Output Columns',
            explanation:
              'You can compute math or combine columns right in `SELECT` and label the column neatly using `AS`.',
            code: ['SELECT name, xp * 2 AS bonus_xp', 'FROM learners;'],
            output: 'name | bonus_xp\n-----+---------\nMaya | 600',
            highlightNote: 'Aliases only affect the output header—the table stays untouched.',
          },
          {
            type: 'token_builder',
            prompt: 'Expose `price * qty` under a column named `total`.',
            codeLines: ['SELECT item, price * qty {{0}} {{1}}', 'FROM orders;'],
            expectedTokens: ['AS', 'total'],
            distractors: ['=', 'INTO', 'LABEL'],
            explanation: '`AS total` assigns the calculated column name.',
          },
          {
            type: 'predict_output',
            prompt: 'What header & value appear for a user with `xp = 150`?',
            code: ['SELECT xp + 50 AS next_xp FROM users LIMIT 1;'],
            options: ['next_xp: 200', 'xp: 150', 'bonus: 200'],
            answer: 0,
            explanation: 'Inline arithmetic adds `50` and labels the column `next_xp`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the broken alias assignment.',
            lines: [
              'SELECT name,',
              '  gems * 10 = gem_score',
              'FROM players;',
            ],
            bugLine: 1,
            fixed: '  gems * 10 AS gem_score',
            explanation: 'SQL aliases use `AS`, never `=` inside `SELECT`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'DISTINCT Values',
        subtitle: 'Strip duplicate rows cleanly with SELECT DISTINCT',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Unique Values Only',
            explanation:
              'Add `DISTINCT` right after `SELECT` when you want each unique value (or unique row tuple) returned only once.',
            code: ['SELECT DISTINCT language', 'FROM enrollments;'],
            output: 'language\n--------\npython\nrust\nsql',
            highlightNote: 'Great for listing categories, tags, or active countries.',
          },
          {
            type: 'token_builder',
            prompt: 'Return every unique `city` stored in `customers`.',
            codeLines: ['SELECT {{0}} city', 'FROM {{1}};'],
            expectedTokens: ['DISTINCT', 'customers'],
            distractors: ['UNIQUE', 'ONLY', 'cities'],
            explanation: '`SELECT DISTINCT city FROM customers;` removes duplicate cities.',
          },
          {
            type: 'predict_output',
            prompt: 'How many rows return if badges are `Gold, Gold, Silver`?',
            code: ['SELECT DISTINCT tier FROM badges;'],
            options: ['3 rows', '2 rows', '1 row'],
            answer: 1,
            explanation: '`Gold` collapses into one row, leaving `Gold` and `Silver`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the misplaced DISTINCT keyword.',
            lines: [
              'SELECT country',
              'DISTINCT',
              'FROM visitors;',
            ],
            bugLine: 1,
            fixed: 'SELECT DISTINCT country',
            explanation: '`DISTINCT` must appear immediately after `SELECT`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Projections',
        subtitle: 'Verify SELECT, AS, and DISTINCT before sorting',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'List unique `role` labels aliased as `user_role`.',
            codeLines: ['SELECT {{0}} role {{1}} user_role', 'FROM members;'],
            expectedTokens: ['DISTINCT', 'AS'],
            distractors: ['UNIQUE', 'LIKE', 'INTO'],
            explanation: '`DISTINCT` applies before column aliases are emitted.',
          },
          {
            type: 'find_bug',
            prompt: 'Tap the line with invalid SQL clause order.',
            lines: [
              'SELECT *',
              'DISTINCT',
              'FROM logs;',
            ],
            bugLine: 1,
            fixed: 'SELECT DISTINCT *',
            explanation: '`DISTINCT` belongs right after `SELECT`, before column names.',
          },
          {
            type: 'multiple_choice',
            question: 'Does `SELECT name AS n FROM users;` alter the table schema?',
            options: [
              'Yes, it permanently renames the column',
              'No, AS only labels the query result',
              'Only if LIMIT is omitted',
              'It creates a backup copy first',
            ],
            answer: 1,
            explanation: 'Column aliases only apply to that query’s output grid.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'ORDER BY & LIMIT',
        subtitle: 'Rank top records and paginate cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Sorting Top Results',
            explanation:
              'Use `ORDER BY col DESC` for highest-first (`ASC` for lowest-first), followed by `LIMIT N` at the bottom to cap how many rows come back.',
            code: ['SELECT handle, xp', 'FROM leaderboard', 'ORDER BY xp DESC', 'LIMIT 3;'],
            highlightNote: '`LIMIT 3` always runs after sorting, never before.',
          },
          {
            type: 'token_builder',
            prompt: 'Fetch the 5 cheapest products from `catalog`.',
            codeLines: ['SELECT title, price FROM catalog', '{{0}} price ASC', '{{1}} 5;'],
            expectedTokens: ['ORDER BY', 'LIMIT'],
            distractors: ['SORT BY', 'TOP', 'GROUP BY'],
            explanation: '`ORDER BY price ASC LIMIT 5` returns the 5 lowest prices.',
          },
          {
            type: 'predict_output',
            prompt: 'Scores are `40, 95, 70`. What row returns first?',
            code: ['SELECT score FROM runs ORDER BY score DESC LIMIT 1;'],
            options: ['40', '70', '95'],
            answer: 2,
            explanation: '`DESC` puts largest scores at the top, and `LIMIT 1` grabs `95`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the ordering/limit bug.',
            lines: [
              'SELECT handle, streak',
              'FROM users',
              'LIMIT 5 ORDER BY streak DESC;',
            ],
            bugLine: 2,
            fixed: 'ORDER BY streak DESC LIMIT 5;',
            explanation: '`ORDER BY` must precede `LIMIT` in standard SQL.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Leaderboard Slice',
        subtitle: 'Assemble a full ranked projection query under pressure',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build page 2 (rows 11–20) of top earners.',
            codeLines: [
              'SELECT username AS player, xp',
              'FROM users',
              'ORDER BY xp {{0}}',
              'LIMIT 10 {{1}} 10;',
            ],
            expectedTokens: ['DESC', 'OFFSET'],
            distractors: ['ASC', 'SKIP', 'TOP'],
            explanation: '`DESC` sorts highest XP first; `OFFSET 10` skips the top 10.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the invalid keyword in this leaderboard query.',
            lines: [
              'SELECT name, score',
              'FROM players',
              'SORT BY score DESC',
              'LIMIT 10;',
            ],
            bugLine: 2,
            fixed: 'ORDER BY score DESC',
            explanation: 'SQL uses `ORDER BY`, not `SORT BY`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which clause runs LAST when SQL executes `SELECT DISTINCT name FROM users ORDER BY xp DESC LIMIT 5;`?',
            options: ['FROM', 'DISTINCT', 'ORDER BY', 'LIMIT'],
            answer: 3,
            explanation: '`LIMIT` slices the already-sorted result set at the very end.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Filtering & Null Logic (5 nodes)
  // =========================================================================
  {
    title: 'Filtering & Null Logic',
    subtitle: 'Filter rows with WHERE, boolean logic, IN/BETWEEN, LIKE, and IS NULL.',
    conceptGraphicType: 'sql_filter',
    guidebook: {
      summary:
        'A bare `SELECT` pulls the entire table. `WHERE` keeps only the rows satisfying your predicate using single equality `=`, ranges with `BETWEEN`, lists with `IN`, wildcard search with `LIKE`, and explicit null checks (`IS NULL`).',
      mentalModel:
        'Think of `NULL` not as zero or `""`, but as **"unknown value"**. Comparing `unknown = unknown` yields `UNKNOWN` (falsy in `WHERE`), so you must ask `IS NULL` or `IS NOT NULL` instead.',
      keyTakeaways: [
        'Equality in SQL `WHERE` is a single equals sign `=`, inequality is `<>` or `!=`, and text uses single quotes `\'Gold\'`.',
        '`AND` binds tighter than `OR`! Always wrap mixed conditions in parentheses: `WHERE active = true AND (tier = \'Pro\' OR xp > 500)`.',
        '`IN (\'py\', \'rs\', \'sql\')` is cleaner and safer than repeating `OR` chains.',
        'Never write `= NULL` or `!= NULL` — always write `IS NULL` / `IS NOT NULL`.',
      ],
      keySyntax: [
        {
          title: 'Parenthesized AND / OR Filtering',
          tag: 'PREDICATES',
          code: "SELECT handle, xp\nFROM users\nWHERE (league = 'Gold' OR league = 'Silver')\n  AND xp >= 500;",
          output: 'Filtered rows matching both league AND minimum XP',
          explanation:
            'Parentheses guarantee `OR` evaluates before `AND`, preventing unexpected lower-XP rows from leaking through.',
          notes: [
            '`BETWEEN 10 AND 20` is inclusive on both ends (`>= 10 AND <= 20`).',
          ],
        },
        {
          title: 'Set Membership & Wildcards',
          tag: 'IN / LIKE',
          code: "SELECT title\nFROM lessons\nWHERE lang IN ('rust', 'sql')\n  AND title LIKE 'Join%';",
          output: "e.g. 'Joining Tables cleanly'",
          explanation:
            '`IN` checks against a list of discrete values; `LIKE` matches text patterns where `%` means zero or more chars and `_` means one char.',
          notes: [
            'Postgres offers case-insensitive `ILIKE`; standard SQL often pairs `LOWER(col) LIKE ...`.',
          ],
        },
        {
          title: 'Handling Missing Data (NULL)',
          tag: 'THREE-VALUED',
          code: 'SELECT username, deleted_at\nFROM users\nWHERE deleted_at IS NULL\n  AND bio IS NOT NULL;',
          output: 'Active accounts with filled bios',
          explanation:
            '`IS NULL` matches missing values while `IS NOT NULL` confirms a value exists.',
          notes: [
            'Use `COALESCE(nickname, username)` to fall back cleanly when displaying nullable columns.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Testing Equality Against NULL',
          buggyCode: 'SELECT * FROM tasks WHERE owner_id = NULL; -- Always 0 rows!',
          fixedCode: 'SELECT * FROM tasks WHERE owner_id IS NULL;',
          reason:
            'Because `NULL` means unknown, `owner_id = NULL` evaluates to `UNKNOWN`, never `TRUE`. Always use `IS NULL`.',
        },
        {
          title: 'Missing Parentheses Around OR + AND',
          buggyCode: "SELECT * FROM users WHERE tier = 'Pro' OR tier = 'VIP' AND banned = false;",
          fixedCode: "SELECT * FROM users WHERE (tier = 'Pro' OR tier = 'VIP') AND banned = false;",
          reason:
            '`AND` has higher precedence than `OR`, so without parentheses banned `Pro` users sneak into the output!',
        },
      ],
      proTip:
        'Wrapping indexed columns in functions inside `WHERE` (like `WHERE YEAR(created_at) = 2026`) often defeats database indexes. Prefer range predicates (`WHERE created_at >= \'2026-01-01\' AND created_at < \'2027-01-01\'`) for instant lookups.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'WHERE & Comparisons',
        subtitle: 'Filter rows cleanly with =, <>, >=, and BETWEEN',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Row Filtering Basics',
            explanation:
              '`WHERE` sits right after `FROM` and keeps only rows where the condition evaluates to `TRUE`. SQL uses single `=` and single quotes for strings.',
            code: ['SELECT handle, xp', 'FROM users', "WHERE league = 'Gold' AND xp >= 500;"],
            highlightNote: '`BETWEEN a AND b` includes both boundary values `a` and `b`.',
          },
          {
            type: 'token_builder',
            prompt: 'Select courses whose `hours` are between 2 and 6 inclusive.',
            codeLines: ['SELECT title FROM courses', '{{0}} hours {{1}} 2 AND 6;'],
            expectedTokens: ['WHERE', 'BETWEEN'],
            distractors: ['IF', 'RANGE', 'FROM'],
            explanation: '`WHERE col BETWEEN 2 AND 6` matches `2 <= hours <= 6`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the non-SQL equality mistake.',
            lines: [
              'SELECT name, score',
              'FROM users',
              "WHERE active == true;",
            ],
            bugLine: 2,
            fixed: 'WHERE active = true;',
            explanation: 'SQL equality uses a single `=`, not `==`.',
          },
          {
            type: 'predict_output',
            prompt: 'Ages are `17, 18, 25, 30`. How many pass `BETWEEN 18 AND 25`?',
            code: ['SELECT age FROM members WHERE age BETWEEN 18 AND 25;'],
            options: ['1 row', '2 rows', '3 rows'],
            answer: 1,
            explanation: '`BETWEEN` is inclusive, keeping both `18` and `25`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'IN, LIKE & NULLs',
        subtitle: 'Match lists, wildcard strings, and missing fields safely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Pattern Matching & IS NULL',
            explanation:
              'Use `IN (...)` for lists, `LIKE \'py%\'` (`%` = any chars, `_` = 1 char) for text prefixes, and `IS NULL` (never `= NULL`) to test empty cells.',
            code: ['SELECT email FROM users', "WHERE lang IN ('sql', 'c')", '  AND deleted_at IS NULL;'],
            highlightNote: '`= NULL` returns zero rows in every standard SQL database!',
          },
          {
            type: 'token_builder',
            prompt: 'Keep active users whose handle starts with `"dev_"`.',
            codeLines: ['SELECT handle FROM users', 'WHERE archived_at {{0}}', "  AND handle {{1}} 'dev_%';"],
            expectedTokens: ['IS NULL', 'LIKE'],
            distractors: ['= NULL', 'EQUALS', 'CONTAINS'],
            explanation: '`IS NULL` checks null values and `LIKE` supports `%` wildcards.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the classic SQL NULL comparison bug.',
            lines: [
              'SELECT id, title',
              'FROM tickets',
              'WHERE assignee_id = NULL;',
            ],
            bugLine: 2,
            fixed: 'WHERE assignee_id IS NULL;',
            explanation: 'Never compare with `= NULL`; use `IS NULL` instead.',
          },
          {
            type: 'multiple_choice',
            question: "Which string matches `LIKE 'A_e'`?",
            options: ['Alex', 'Ace', 'Apple', 'A'],
            answer: 1,
            explanation: '`_` matches exactly one single character, so `A_e` matches `Ace`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Precedence',
        subtitle: 'Lock down AND/OR grouping and NULL behavior',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Keep non-banned users in either `rust` or `go`.',
            codeLines: ['SELECT handle FROM users', 'WHERE banned = false', "  AND {{0}} {{1}} ('rust', 'go');"],
            expectedTokens: ['lang', 'IN'],
            distractors: ['HAS', 'LIKE', 'OR'],
            explanation: '`lang IN (\'rust\', \'go\')` avoids subtle `AND`/`OR` precedence bugs.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why banned VIP users accidentally appear here.',
            lines: [
              'SELECT handle FROM users',
              "WHERE tier = 'Pro' OR tier = 'VIP' AND banned = false;",
            ],
            bugLine: 1,
            fixed: "WHERE (tier = 'Pro' OR tier = 'VIP') AND banned = false;",
            explanation: '`AND` binds tighter than `OR`, so `OR` groups need parentheses.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `COALESCE(NULL, \'Guest\')` evaluate to?',
            code: ['SELECT COALESCE(NULL, \'Guest\');'],
            options: ['NULL', 'Guest', 'Error'],
            answer: 1,
            explanation: '`COALESCE` returns the first non-NULL expression in its list.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'NOT & Safe Filters',
        subtitle: 'Negate sets cleanly with NOT IN and IS NOT NULL',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Negating Filters Safely',
            explanation:
              '`NOT` flips boolean expressions (`IS NOT NULL`, `NOT LIKE`, `NOT BETWEEN`). Beware `NOT IN` if the list contains a `NULL`, which yields zero rows!',
            code: ['SELECT handle FROM users', "WHERE role NOT IN ('bot', 'guest')", '  AND verified_at IS NOT NULL;'],
            highlightNote: '`<>` and `!=` both mean not equal for non-NULL values.',
          },
          {
            type: 'token_builder',
            prompt: 'Filter verified accounts outside the `Trial` plan.',
            codeLines: ['SELECT email FROM accounts', 'WHERE verified_at {{0}}', "  AND plan {{1}} 'Trial';"],
            expectedTokens: ['IS NOT NULL', '<>'],
            distractors: ['!= NULL', 'IS NULL', 'NOT'],
            explanation: '`IS NOT NULL` confirms verification; `<>` excludes `Trial`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the broken non-NULL test.',
            lines: [
              'SELECT name FROM users',
              'WHERE phone != NULL;',
            ],
            bugLine: 1,
            fixed: 'WHERE phone IS NOT NULL;',
            explanation: '`!= NULL` always yields unknown; write `IS NOT NULL`.',
          },
          {
            type: 'multiple_choice',
            question: "What happens if you run `WHERE id NOT IN (1, 2, NULL)`?",
            options: [
              'Returns all ids except 1 and 2',
              'Returns 0 rows because NULL makes NOT IN unknown',
              'Throws a divide-by-zero error',
              'Only excludes NULL',
            ],
            answer: 1,
            explanation: '`id <> NULL` is `UNKNOWN`, so the whole `AND` chain fails to match.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Precision Search',
        subtitle: 'Combine WHERE, IN, LIKE, NULL checks, and sorting',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Find active SQL/Rust learners whose bio is present, top XP first.',
            codeLines: [
              'SELECT handle, xp FROM users',
              "WHERE lang {{0}} ('sql', 'rust')",
              '  AND bio {{1}}',
              'ORDER BY xp DESC LIMIT 10;',
            ],
            expectedTokens: ['IN', 'IS NOT NULL'],
            distractors: ['LIKE', '!= NULL', 'IS NULL'],
            explanation: 'Set filter + non-null check + top-N sort.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the invalid quote style in this filter.',
            lines: [
              'SELECT title, xp',
              'FROM lessons',
              'WHERE track = "sql" AND xp > 10;',
            ],
            bugLine: 2,
            fixed: "WHERE track = 'sql' AND xp > 10;",
            explanation: 'SQL string literals use single quotes `\'sql\'`, not double quotes.',
          },
          {
            type: 'predict_output',
            prompt: 'With `tags`: `null`, `sql`, `rust`, `sql` — what returns?',
            code: ['SELECT COUNT(*) FROM posts WHERE tags IS NOT NULL;'],
            options: ['4', '3', '2'],
            answer: 1,
            explanation: 'Three rows have non-NULL `tags`, so `WHERE` keeps those 3.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Aggregates & Grouping (5 nodes)
  // =========================================================================
  {
    title: 'Aggregates & Grouping',
    subtitle: 'Summarize datasets with COUNT, SUM, AVG, GROUP BY, and HAVING.',
    conceptGraphicType: 'sql_aggregates',
    guidebook: {
      summary:
        'Aggregates collapse many rows into single summary numbers (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`). Pairing them with `GROUP BY` produces one summary row per bucket, while `HAVING` filters those summary buckets after grouping.',
      mentalModel:
        'Imagine sorting cards into labeled buckets (`GROUP BY language`): first `WHERE` discards unwanted cards before bucketing, then `SUM`/`COUNT` totals each bucket, and finally `HAVING` removes buckets whose total is too small.',
      keyTakeaways: [
        '`COUNT(*)` counts every row in the group; `COUNT(col)` skips `NULL` values; `COUNT(DISTINCT col)` counts unique non-NULL values.',
        'Every non-aggregated column in `SELECT` must also appear inside `GROUP BY`.',
        '`WHERE` filters individual rows **before** grouping; `HAVING` filters grouped totals **after** grouping.',
        'You cannot use aggregate functions like `SUM(xp) > 100` inside `WHERE` — move them to `HAVING`.',
      ],
      keySyntax: [
        {
          title: 'Group Metrics per Category',
          tag: 'GROUP BY',
          code: 'SELECT lang, COUNT(*) AS learners, AVG(xp) AS avg_xp\nFROM users\nWHERE xp > 0\nGROUP BY lang\nORDER BY learners DESC;',
          output: 'lang   | learners | avg_xp\n-------+----------+-------\npython | 420      | 680.5\nsql    | 195      | 540.0',
          explanation:
            '`WHERE` drops zero-XP accounts first, `GROUP BY lang` forms one bucket per language, and `COUNT(*)` / `AVG(xp)` summarize each bucket.',
          notes: [
            '`ROUND(AVG(xp), 1)` keeps averages crisp to one decimal place.',
          ],
        },
        {
          title: 'Filter Groups with HAVING',
          tag: 'HAVING',
          code: 'SELECT user_id, SUM(xp) AS total_xp\nFROM completions\nGROUP BY user_id\nHAVING SUM(xp) >= 1000\nORDER BY total_xp DESC;',
          output: 'Only users whose combined XP reaches 1000+',
          explanation:
            '`HAVING` evaluates after `GROUP BY`, so it can inspect `SUM(xp)` directly.',
          notes: [
            'Most SQL engines reject `SELECT` aliases inside `HAVING`—repeat `SUM(xp)` cleanly.',
          ],
        },
        {
          title: 'COUNT(*) vs COUNT(col) vs DISTINCT',
          tag: 'NULL SAFETY',
          code: 'SELECT\n  COUNT(*) AS total_rows,\n  COUNT(referrer) AS referred_rows,\n  COUNT(DISTINCT lang) AS active_langs\nFROM users;',
          output: 'total_rows: 100 | referred_rows: 34 | active_langs: 8',
          explanation:
            '`COUNT(referrer)` excludes NULLs automatically while `COUNT(*)` counts every row regardless of NULL fields.',
          notes: [
            '`AVG(col)` also ignores NULLs, unlike turning NULL into `0` via `COALESCE`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Filtering Aggregates Inside WHERE',
          buggyCode: 'SELECT lang, COUNT(*) FROM users WHERE COUNT(*) > 10 GROUP BY lang;',
          fixedCode: 'SELECT lang, COUNT(*) FROM users GROUP BY lang HAVING COUNT(*) > 10;',
          reason:
            '`WHERE` runs *before* `GROUP BY` builds groups, so `COUNT(*)` does not exist yet! Use `HAVING` to filter grouped aggregates.',
        },
        {
          title: 'Un-grouped Column in SELECT',
          buggyCode: 'SELECT lang, handle, COUNT(*) FROM users GROUP BY lang;',
          fixedCode: 'SELECT lang, COUNT(*) FROM users GROUP BY lang;',
          reason:
            'If a group collapses 50 rows into 1 `lang` row, SQL cannot pick which single `handle` to display unless it is aggregated (e.g. `MAX(handle)`) or in `GROUP BY`.',
        },
      ],
      proTip:
        'Need conditional counts in a single scan? Use `SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS pass_count` instead of running two separate queries!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'COUNT, SUM & AVG',
        subtitle: 'Roll up columns into single summary statistics',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Whole-Table Summaries',
            explanation:
              'Aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) condense many rows into a single metric row.',
            code: ['SELECT COUNT(*) AS users, SUM(xp) AS total_xp, MAX(streak) AS best', 'FROM learners;'],
            output: 'users: 84 | total_xp: 41200 | best: 29',
            highlightNote: '`COUNT(*)` counts all rows; `COUNT(col)` ignores NULL values.',
          },
          {
            type: 'token_builder',
            prompt: 'Compute total `amount` and average `amount` across paid orders.',
            codeLines: ["SELECT {{0}}(amount) AS revenue, {{1}}(amount) AS avg_order", "FROM orders WHERE status = 'paid';"],
            expectedTokens: ['SUM', 'AVG'],
            distractors: ['TOTAL', 'MEAN', 'COUNT'],
            explanation: '`SUM` adds values and `AVG` computes the arithmetic mean.',
          },
          {
            type: 'predict_output',
            prompt: 'Given rows with `rating = 5, 3, NULL`, what is `COUNT(rating)`?',
            code: ['SELECT COUNT(rating) FROM reviews;'],
            options: ['3', '2', 'NULL'],
            answer: 1,
            explanation: '`COUNT(column)` skips `NULL` rows, returning `2`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the nonexistent SQL average function.',
            lines: [
              'SELECT COUNT(*) AS n,',
              '  MEAN(score) AS avg_score',
              'FROM attempts;',
            ],
            bugLine: 1,
            fixed: '  AVG(score) AS avg_score',
            explanation: 'SQL uses `AVG(...)`, not `MEAN(...)`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'GROUP BY Buckets',
        subtitle: 'Compute aggregates independently per group',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Bucketing Rows with GROUP BY',
            explanation:
              '`GROUP BY` splits rows by shared column values so `COUNT`, `SUM`, or `AVG` runs inside each bucket separately.',
            code: ['SELECT league, COUNT(*) AS players', 'FROM users', 'GROUP BY league;'],
            output: 'Gold: 18 | Silver: 42 | Bronze: 90',
            highlightNote: 'Every plain column in `SELECT` must be listed in `GROUP BY`.',
          },
          {
            type: 'token_builder',
            prompt: 'Count lessons completed per `language`.',
            codeLines: ['SELECT language, {{0}}(*) AS completed', 'FROM progress', '{{1}} language;'],
            expectedTokens: ['COUNT', 'GROUP BY'],
            distractors: ['SUM', 'ORDER BY', 'SPLIT BY'],
            explanation: '`GROUP BY language` partitions rows before counting each group.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why SQL rejects this grouped SELECT.',
            lines: [
              'SELECT language, username, COUNT(*)',
              'FROM progress',
              'GROUP BY language;',
            ],
            bugLine: 0,
            fixed: 'SELECT language, COUNT(*)',
            explanation: '`username` is neither aggregated nor included in `GROUP BY`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which clause filters individual rows BEFORE `GROUP BY` forms buckets?',
            options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'],
            answer: 1,
            explanation: '`WHERE` filters raw rows before aggregation starts.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Rollups',
        subtitle: 'Check GROUP BY validity and DISTINCT counts',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Count unique learners (`user_id`) per `track`.',
            codeLines: ['SELECT track, COUNT({{0}} user_id) AS students', 'FROM enrollments', '{{1}} track;'],
            expectedTokens: ['DISTINCT', 'GROUP BY'],
            distractors: ['UNIQUE', 'ORDER BY', 'ONLY'],
            explanation: '`COUNT(DISTINCT user_id)` avoids counting repeat enrollments twice.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the clause placed in the wrong order.',
            lines: [
              'SELECT track, COUNT(*) AS n',
              'FROM lessons',
              'GROUP BY track',
              'WHERE published = true;',
            ],
            bugLine: 3,
            fixed: 'WHERE published = true\nGROUP BY track;',
            explanation: '`WHERE` must always appear BEFORE `GROUP BY`.',
          },
          {
            type: 'predict_output',
            prompt: 'If table `events` is empty (`0` rows), what does `SELECT COUNT(*) FROM events;` return?',
            code: ['SELECT COUNT(*) FROM events;'],
            options: ['0', 'NULL', 'No rows'],
            answer: 0,
            explanation: '`COUNT(*)` without `GROUP BY` always returns a row with `0`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'HAVING Filters',
        subtitle: 'Keep only groups meeting aggregate thresholds',
        exercises: [
          {
            type: 'theory_bite',
            title: 'WHERE vs HAVING',
            explanation:
              'Use `WHERE` for raw row conditions (like `status = \'ok\'`) and `HAVING` for aggregate conditions (like `COUNT(*) >= 5`) after `GROUP BY`.',
            code: ['SELECT author, COUNT(*) AS posts', 'FROM articles', 'GROUP BY author', 'HAVING COUNT(*) >= 5;'],
            highlightNote: '`HAVING` sits strictly between `GROUP BY` and `ORDER BY`.',
          },
          {
            type: 'token_builder',
            prompt: 'Return languages whose average accuracy exceeds `85`.',
            codeLines: ['SELECT lang, AVG(accuracy) AS avg_acc', 'FROM results', 'GROUP BY lang', '{{0}} {{1}}(accuracy) > 85;'],
            expectedTokens: ['HAVING', 'AVG'],
            distractors: ['WHERE', 'SUM', 'MEAN'],
            explanation: 'Aggregate filters like `AVG(accuracy) > 85` require `HAVING`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the illegal aggregate inside WHERE.',
            lines: [
              'SELECT user_id, SUM(gems) AS total',
              'FROM rewards',
              'WHERE SUM(gems) > 100',
              'GROUP BY user_id;',
            ],
            bugLine: 2,
            fixed: 'GROUP BY user_id\nHAVING SUM(gems) > 100;',
            explanation: 'Aggregates cannot run in `WHERE`; move the filter to `HAVING`.',
          },
          {
            type: 'multiple_choice',
            question: 'Can a query use BOTH `WHERE` and `HAVING` together?',
            options: [
              'No, only one filter clause is allowed',
              'Yes: WHERE filters rows first, then HAVING filters groups',
              'Only in DELETE queries',
              'Only if ORDER BY is omitted',
            ],
            answer: 1,
            explanation: '`WHERE` narrows input rows cleanly before `GROUP BY` + `HAVING`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Analytics Report',
        subtitle: 'Combine WHERE, GROUP BY, HAVING, and ORDER BY',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Find top cohorts with at least 10 active learners.',
            codeLines: [
              'SELECT cohort, COUNT(*) AS learners',
              'FROM users',
              'WHERE active = true',
              '{{0}} cohort',
              '{{1}} COUNT(*) >= 10',
              'ORDER BY learners DESC;',
            ],
            expectedTokens: ['GROUP BY', 'HAVING'],
            distractors: ['ORDER BY', 'WHERE', 'FILTER'],
            explanation: '`WHERE` keeps active users, `GROUP BY` buckets, `HAVING` enforces `>= 10`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the invalid ORDER/HAVING order.',
            lines: [
              'SELECT lang, SUM(xp) AS total',
              'FROM logs',
              'GROUP BY lang',
              'ORDER BY total DESC',
              'HAVING SUM(xp) > 500;',
            ],
            bugLine: 4,
            fixed: 'HAVING SUM(xp) > 500\nORDER BY total DESC;',
            explanation: '`HAVING` must precede `ORDER BY` in SQL grammar.',
          },
          {
            type: 'predict_output',
            prompt: 'With `a(10), a(20), b(5)`: how many groups pass `HAVING SUM(v) >= 25`?',
            code: ['SELECT k, SUM(v) FROM t GROUP BY k HAVING SUM(v) >= 25;'],
            options: ['2 groups', '1 group (a: 30)', '0 groups'],
            answer: 1,
            explanation: 'Group `a` sums to `30 >= 25`, while `b` sums to `5` and drops out.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Relational Joins (5 nodes)
  // =========================================================================
  {
    title: 'Relational Joins',
    subtitle: 'Connect normalized tables cleanly with INNER JOIN, LEFT JOIN, and aliases.',
    conceptGraphicType: 'sql_joins',
    guidebook: {
      summary:
        'Relational databases avoid duplicating data by splitting entities into tables (`users`, `orders`, `lessons`) linked by foreign keys. `JOIN` stitches rows back together horizontally whenever their keys match.',
      mentalModel:
        'Think of `INNER JOIN` as taking only pairs that exist in **both** tables (strict match), while `LEFT JOIN` keeps **every** row from the left table and fills missing right-hand columns with `NULL`.',
      keyTakeaways: [
        'Short table aliases (`FROM users u JOIN progress p ON u.id = p.user_id`) prevent ambiguous column errors.',
        '`INNER JOIN` (default `JOIN`) drops rows without a match in the other table.',
        '`LEFT JOIN ... WHERE right.id IS NULL` is the classic idiom for finding items with zero matches (e.g. users with zero lessons).',
        'Never forget the `ON` condition—missing it creates a Cartesian cross-product multiplying every row by every row!',
      ],
      keySyntax: [
        {
          title: 'INNER JOIN with Aliases',
          tag: 'INNER JOIN',
          code: 'SELECT u.handle, l.title, p.accuracy\nFROM progress p\nINNER JOIN users u ON p.user_id = u.id\nINNER JOIN lessons l ON p.lesson_id = l.id;',
          output: 'handle  | title          | accuracy\n--------+----------------+---------\nada_py  | Variables      | 100',
          explanation:
            'Qualifying columns as `u.handle` and `p.accuracy` avoids ambiguity when two tables share an `id` or `title` column.',
          notes: [
            '`JOIN` by itself is shorthand for `INNER JOIN` in SQL.',
          ],
        },
        {
          title: 'LEFT JOIN to Preserve Unmatched Rows',
          tag: 'LEFT JOIN',
          code: 'SELECT u.handle, COUNT(p.node_id) AS finished\nFROM users u\nLEFT JOIN progress p ON u.id = p.user_id\nGROUP BY u.id, u.handle;',
          output: 'handle  | finished\n--------+---------\nnew_dev | 0\nada_py  | 14',
          explanation:
            'Counting `p.node_id` (not `COUNT(*)`) is crucial! Unmatched rows have `p.node_id = NULL`, which `COUNT(p.node_id)` counts accurately as `0`.',
          notes: [
            '`COUNT(*)` on a `LEFT JOIN` would miscount unmatched rows as `1` instead of `0`.',
          ],
        },
        {
          title: 'Anti-Join Pattern (Find Orphans)',
          tag: 'NO MATCH',
          code: 'SELECT u.id, u.email\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE o.id IS NULL;',
          output: 'All users who have never placed an order',
          explanation:
            'Keeping all `users` via `LEFT JOIN` and filtering `WHERE o.id IS NULL` surfaces users with no matching orders.',
          notes: [
            'Filter the right table inside `ON` if you want to keep unmatched left rows (`LEFT JOIN orders o ON u.id = o.user_id AND o.paid = true`).',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Putting Right-Table Filter in WHERE After LEFT JOIN',
          buggyCode: "SELECT u.handle, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.status = 'paid';",
          fixedCode: "SELECT u.handle, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid';",
          reason:
            "Filtering `WHERE o.status = 'paid'` discards all rows where `o.status` is `NULL`, silently turning your `LEFT JOIN` into an `INNER JOIN`!",
        },
        {
          title: 'Ambiguous id Column Without Table Prefix',
          buggyCode: 'SELECT id, handle FROM users u JOIN orders o ON u.id = o.user_id;',
          fixedCode: 'SELECT u.id, u.handle FROM users u JOIN orders o ON u.id = o.user_id;',
          reason:
            'Both `users` and `orders` have an `id` column, so bare `id` fails compilation until qualified as `u.id`.',
        },
      ],
      proTip:
        'Check your row counts before and after every `JOIN`! If a table suddenly multiplies in size, you likely joined on a non-unique column instead of a 1-to-1 or foreign-key link.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'INNER JOIN & Aliases',
        subtitle: 'Match rows across two tables via primary/foreign keys',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Joining Related Tables',
            explanation:
              '`INNER JOIN` pairs each row in table A with matching rows in table B via `ON a.key = b.key`. Always prefix shared column names with short table aliases.',
            code: ['SELECT u.handle, o.total', 'FROM orders o', 'INNER JOIN users u ON o.user_id = u.id;'],
            highlightNote: 'Writing `JOIN` alone means `INNER JOIN`.',
          },
          {
            type: 'token_builder',
            prompt: 'Join `lessons l` onto `units un` where `l.unit_id` equals `un.id`.',
            codeLines: ['SELECT l.title, un.name FROM lessons l', '{{0}} units un {{1}} l.unit_id = un.id;'],
            expectedTokens: ['JOIN', 'ON'],
            distractors: ['LINK', 'WHERE', 'USING'],
            explanation: '`JOIN table alias ON left.col = right.col` pairs matching records.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the ambiguous column error.',
            lines: [
              'SELECT id, title',
              'FROM units u',
              'JOIN lessons l ON u.id = l.unit_id;',
            ],
            bugLine: 0,
            fixed: 'SELECT u.id, l.title',
            explanation: 'Both `units` and `lessons` have `id`, so qualify `u.id` or `l.id`.',
          },
          {
            type: 'predict_output',
            prompt: '`users` has 3 rows, `orders` has 2 rows matching 2 users. How many INNER JOIN rows?',
            code: ['SELECT u.id, o.id FROM users u INNER JOIN orders o ON u.id = o.user_id;'],
            options: ['3 rows', '2 rows', '6 rows'],
            answer: 1,
            explanation: '`INNER JOIN` drops the 1 user without a matching order.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'LEFT JOIN & NULLs',
        subtitle: 'Keep unmatched left-table rows cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Preserving Left Rows',
            explanation:
              '`LEFT JOIN` keeps every row from the left table even when the right table has no matching row (filling right columns with `NULL`).',
            code: ['SELECT u.handle, o.amount', 'FROM users u', 'LEFT JOIN orders o ON u.id = o.user_id;'],
            output: 'new_user | NULL',
            highlightNote: 'Use `COUNT(o.id)` rather than `COUNT(*)` so missing joins count as `0`.',
          },
          {
            type: 'token_builder',
            prompt: 'Keep all users, counting only completed lessons (`0` for newcomers).',
            codeLines: ['SELECT u.handle, COUNT(p.lesson_id) AS done', 'FROM users u', '{{0}} progress p ON u.id = p.user_id', '{{1}} u.id, u.handle;'],
            expectedTokens: ['LEFT JOIN', 'GROUP BY'],
            distractors: ['INNER JOIN', 'ORDER BY', 'RIGHT JOIN'],
            explanation: '`LEFT JOIN` keeps zero-progress users; `COUNT(p.lesson_id)` skips NULLs.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why newcomers get miscounted as having 1 completion!',
            lines: [
              'SELECT u.handle, COUNT(*) AS done',
              'FROM users u',
              'LEFT JOIN progress p ON u.id = p.user_id',
              'GROUP BY u.handle;',
            ],
            bugLine: 0,
            fixed: 'SELECT u.handle, COUNT(p.lesson_id) AS done',
            explanation: '`COUNT(*)` counts the padded NULL row as `1`; count `p.lesson_id` instead.',
          },
          {
            type: 'multiple_choice',
            question: 'How do you find products with ZERO orders using `LEFT JOIN`?',
            options: [
              'WHERE o.id = 0',
              'WHERE o.id IS NULL',
              'INNER JOIN orders o',
              'HAVING o.id IS NULL',
            ],
            answer: 1,
            explanation: 'Unmatched `LEFT JOIN` rows yield `NULL` in right-side columns.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Multi-Table',
        subtitle: 'Check join types, ON keys, and filtering rules',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Find courses (`c`) that have no enrolled students (`e`).',
            codeLines: ['SELECT c.title FROM courses c', '{{0}} enrollments e ON c.id = e.course_id', 'WHERE e.id {{1}};'],
            expectedTokens: ['LEFT JOIN', 'IS NULL'],
            distractors: ['INNER JOIN', '= NULL', 'NOT NULL'],
            explanation: 'Anti-join with `LEFT JOIN` + `WHERE e.id IS NULL`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the join missing its ON condition.',
            lines: [
              'SELECT u.name, b.label',
              'FROM users u',
              'INNER JOIN badges b',
              'WHERE u.id = b.user_id;',
            ],
            bugLine: 2,
            fixed: 'INNER JOIN badges b ON u.id = b.user_id;',
            explanation: 'Always pair `JOIN` with `ON ...` rather than misusing bare joins.',
          },
          {
            type: 'predict_output',
            prompt: 'Left has `[1, 2]`, Right has `[2, 2, 3]`. How many rows in `LEFT JOIN`?',
            code: ['SELECT l.id, r.id FROM left_t l LEFT JOIN right_t r ON l.id = r.id;'],
            options: ['2 rows', '3 rows', '4 rows'],
            answer: 1,
            explanation: 'Left `1` keeps 1 NULL row; Left `2` duplicates across both `2`s (`1 + 2 = 3`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Self Joins & Multi-Joins',
        subtitle: 'Chain three tables and join a table to itself',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Chaining & Self-Referencing Joins',
            explanation:
              'You can chain as many `JOIN`s as needed, or join a table to **itself** using two distinct aliases (`e` for employee, `m` for manager).',
            code: ['SELECT e.name AS member, m.name AS mentor', 'FROM learners e', 'LEFT JOIN learners m ON e.mentor_id = m.id;'],
            highlightNote: 'Distinct aliases `e` and `m` let SQL treat one table as two sides.',
          },
          {
            type: 'token_builder',
            prompt: 'Join `learners` twice to show each learner and their referrer.',
            codeLines: ['SELECT u.handle, {{0}}.handle AS invited_by', 'FROM learners u', 'LEFT JOIN learners ref ON u.referred_by = {{1}}.id;'],
            expectedTokens: ['ref', 'ref'],
            distractors: ['u', 'learners', 'self'],
            explanation: 'Both the SELECT and ON clauses point to alias `ref` for the mentor.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the filter that breaks a LEFT JOIN into an INNER JOIN.',
            lines: [
              'SELECT u.handle, o.id',
              'FROM users u',
              'LEFT JOIN orders o ON u.id = o.user_id',
              "WHERE o.status = 'paid';",
            ],
            bugLine: 3,
            fixed: "LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid';",
            explanation: 'Right-table filter in `WHERE` strips unmatched `NULL` rows.',
          },
          {
            type: 'multiple_choice',
            question: 'What happens if two tables of 10 rows are joined WITHOUT an `ON` match key (`CROSS JOIN`)?',
            options: [
              '10 rows return',
              '0 rows return',
              '100 rows (10 x 10 Cartesian product)',
              'Only matching IDs return',
            ],
            answer: 2,
            explanation: 'Every row on the left pairs with every row on the right (`10 * 10`).',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Relational Join',
        subtitle: 'Master multi-table joins, aggregates, and orphan checks',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Compute total paid spend per user, keeping users with `$0` spend.',
            codeLines: [
              'SELECT u.handle, COALESCE(SUM(o.total), 0) AS spent',
              'FROM users u',
              "LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'",
              '{{0}} u.id, u.handle',
              '{{1}} spent DESC;',
            ],
            expectedTokens: ['GROUP BY', 'ORDER BY'],
            distractors: ['HAVING', 'WHERE', 'SORT BY'],
            explanation: 'Keeping `o.status` inside `ON` preserves zero-spend users cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the missing alias qualification.',
            lines: [
              'SELECT u.handle, created_at',
              'FROM users u',
              'JOIN sessions s ON u.id = s.user_id;',
            ],
            bugLine: 0,
            fixed: 'SELECT u.handle, s.created_at',
            explanation: 'Both tables track `created_at`; specify `u.` or `s.` cleanly.',
          },
          {
            type: 'multiple_choice',
            question: 'Which join preserves unmatched rows from the LEFT table?',
            options: ['INNER JOIN', 'CROSS JOIN', 'LEFT JOIN', 'SELF JOIN'],
            answer: 2,
            explanation: '`LEFT JOIN` returns all left rows plus NULLs when right has no match.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Writing Data & Schemas (5 nodes)
  // =========================================================================
  {
    title: 'Writing Data & Schemas',
    subtitle: 'Design constrained tables and safely execute INSERT, UPDATE, and DELETE.',
    conceptGraphicType: 'sql_mutations',
    guidebook: {
      summary:
        'SQL doesn’t just read—DML (`INSERT`, `UPDATE`, `DELETE`) mutates rows, and DDL (`CREATE TABLE`) defines table columns and data-integrity constraints like `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, and `DEFAULT`.',
      mentalModel:
        'Treat `UPDATE` and `DELETE` like surgical tools: **always preview your `WHERE` predicate with a `SELECT` first**, because omitting `WHERE` updates or erases every row in the table!',
      keyTakeaways: [
        'Explicitly list target columns in `INSERT INTO users (handle, xp) VALUES (\'ada\', 100);` so adding columns later never breaks inserts.',
        'ALWAYS include a tight `WHERE` clause on `UPDATE` and `DELETE` (`WHERE id = 42`).',
        'Enforce invariants inside the DB itself with `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, and `DEFAULT` constraints.',
        'Wrap dependent multi-step writes inside `BEGIN; ... COMMIT;` (or `ROLLBACK;`) transactions so partial failures never corrupt state.',
      ],
      keySyntax: [
        {
          title: 'CREATE TABLE with Constraints',
          tag: 'DDL SCHEMA',
          code: 'CREATE TABLE lessons (\n  id INTEGER PRIMARY KEY,\n  slug TEXT UNIQUE NOT NULL,\n  xp INTEGER NOT NULL DEFAULT 25\n);',
          output: 'Table `lessons` created with uniqueness & default guarantees',
          explanation:
            'Database constraints reject duplicate slugs or missing titles at write time before bad data can enter.',
          notes: [
            'Adding `FOREIGN KEY (unit_id) REFERENCES units(id)` prevents orphan child rows.',
          ],
        },
        {
          title: 'INSERT Single & Multiple Rows',
          tag: 'INSERT',
          code: "INSERT INTO lessons (id, slug, xp)\nVALUES\n  (1, 'sql-select', 30),\n  (2, 'sql-where', 35);",
          output: '2 rows inserted',
          explanation:
            'Listing columns explicitly makes inserts immune to schema column reordering.',
          notes: [
            'Postgres supports `RETURNING id` to grab the newly generated ID in the same round trip.',
          ],
        },
        {
          title: 'Safe Targeted UPDATE & DELETE',
          tag: 'MUTATIONS',
          code: 'UPDATE users\nSET xp = xp + 50, hearts = 5\nWHERE id = 7;\n\nDELETE FROM sessions\nWHERE expires_at < CURRENT_TIMESTAMP;',
          output: 'Updated user 7 only; purged expired sessions only',
          explanation:
            'Both mutations lock tightly to matching rows using `WHERE`. Never omit `WHERE` unless intentionally wiping the whole table.',
          notes: [
            'Wrap both writes inside `BEGIN; ... COMMIT;` if they must succeed or fail atomically.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting WHERE on UPDATE or DELETE',
          buggyCode: 'UPDATE users SET gems = 0; -- Resets EVERY user in prod!',
          fixedCode: 'UPDATE users SET gems = 0 WHERE id = 91;',
          reason:
            'An `UPDATE` or `DELETE` without `WHERE` mutates **all rows** in the table with zero warning.',
        },
        {
          title: 'Inserting NULL Into a NOT NULL Column',
          buggyCode: "INSERT INTO lessons (id, slug) VALUES (3, NULL);",
          fixedCode: "INSERT INTO lessons (id, slug) VALUES (3, 'sql-joins');",
          reason:
            'Constraints like `NOT NULL` and `UNIQUE` reject incomplete or duplicate records before saving.',
        },
      ],
      proTip:
        'Before running any scary production `DELETE FROM t WHERE ...`, swap `DELETE` for `SELECT *` with the exact same `WHERE` clause (`SELECT * FROM t WHERE ...`) so you see the exact rows about to disappear!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'CREATE TABLE & Types',
        subtitle: 'Define columns, primary keys, and NOT NULL constraints',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Schema Guarantees',
            explanation:
              '`CREATE TABLE` defines column types and rules (`PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`) so the database enforces data integrity automatically.',
            code: ['CREATE TABLE users (', '  id INTEGER PRIMARY KEY,', '  handle TEXT UNIQUE NOT NULL,', '  hearts INTEGER DEFAULT 5', ');'],
            highlightNote: 'Every row gets a unique `PRIMARY KEY` ID.',
          },
          {
            type: 'token_builder',
            prompt: 'Create a `badges` table where `code` is unique and never NULL.',
            codeLines: ['CREATE TABLE badges (', '  id INTEGER {{0}},', '  code TEXT UNIQUE {{1}}', ');'],
            expectedTokens: ['PRIMARY KEY', 'NOT NULL'],
            distractors: ['FOREIGN KEY', 'ALLOW NULL', 'DEFAULT'],
            explanation: '`PRIMARY KEY` uniquely identifies each row; `NOT NULL` blocks blanks.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid table syntax.',
            lines: [
              'CREATE TABLE scores (',
              '  id INTEGER PRIMARY KEY,',
              '  points INTEGER NOT_NULL',
              ');',
            ],
            bugLine: 2,
            fixed: '  points INTEGER NOT NULL',
            explanation: 'In SQL, `NOT NULL` is two space-separated keywords, not `NOT_NULL`.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `DEFAULT 5` do on column `hearts`?',
            options: [
              'Limits hearts to a max of 5',
              'Automatically stores 5 if INSERT omits hearts',
              'Deletes rows when hearts reach 5',
              'Makes hearts unique across users',
            ],
            answer: 1,
            explanation: '`DEFAULT` supplies a fallback value when omitted on insert.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'INSERT INTO Rows',
        subtitle: 'Add single and multi-row records cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Explicit Column Inserts',
            explanation:
              'Always list the column names after `INSERT INTO table (...)` followed by matching tuples inside `VALUES (...)`.',
            code: ["INSERT INTO users (handle, xp)", "VALUES ('kenji_rs', 120);"],
            highlightNote: 'Unspecified columns receive their `DEFAULT` value (or `NULL`).',
          },
          {
            type: 'token_builder',
            prompt: 'Insert a new SQL lesson earning 40 XP.',
            codeLines: ['{{0}} lessons (slug, xp)', "{{1}} ('sql-basics', 40);"],
            expectedTokens: ['INSERT INTO', 'VALUES'],
            distractors: ['ADD TO', 'SET', 'ROW'],
            explanation: '`INSERT INTO table (cols) VALUES (vals);` adds a new row.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the mismatched column and value count.',
            lines: [
              'INSERT INTO items (name, price, stock)',
              "VALUES ('Potion', 25);",
            ],
            bugLine: 1,
            fixed: "VALUES ('Potion', 25, 1);",
            explanation: 'Listing 3 columns requires providing 3 values in `VALUES`.',
          },
          {
            type: 'predict_output',
            prompt: '`hearts` has `DEFAULT 5`. What does `hearts` hold after `INSERT INTO users (handle) VALUES (\'zoe\');`?',
            code: ["INSERT INTO users (handle) VALUES ('zoe');"],
            options: ['NULL', '0', '5'],
            answer: 2,
            explanation: 'Omitted columns automatically populate with their `DEFAULT 5`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Writes',
        subtitle: 'Verify schema rules and INSERT accuracy',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Insert two languages in one single statement.',
            codeLines: ['INSERT INTO tracks (id, name)', '{{0}}', "  (7, 'sql'){{1}}", "  (8, 'c');"],
            expectedTokens: ['VALUES', ','],
            distractors: ['SET', ';', 'AND'],
            explanation: 'Separate multiple inserted row tuples using commas.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing keyword in CREATE TABLE.',
            lines: [
              'TABLE learners (',
              '  id INTEGER PRIMARY KEY',
              ');',
            ],
            bugLine: 0,
            fixed: 'CREATE TABLE learners (',
            explanation: 'Defining a new table always starts with `CREATE TABLE`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why should `INSERT` explicitly list column names instead of relying on table order?',
            options: [
              'It disables constraints',
              'Adding new columns later won’t silently break existing INSERTs',
              'It avoids single quotes',
              'SQL requires listing at least 5 columns',
            ],
            answer: 1,
            explanation: 'Explicit column lists stay resilient as schemas evolve.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'UPDATE, DELETE & Safety',
        subtitle: 'Modify and remove targeted rows with strict WHERE guards',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Targeted Mutations & Transactions',
            explanation:
              'Use `UPDATE t SET col = val WHERE ...` and `DELETE FROM t WHERE ...`. Wrap multi-step updates in `BEGIN; ... COMMIT;` so they succeed together.',
            code: ['BEGIN;', 'UPDATE users SET xp = xp + 50 WHERE id = 4;', 'DELETE FROM temp_tokens WHERE user_id = 4;', 'COMMIT;'],
            highlightNote: 'Omitting `WHERE` touches EVERY single row in the table!',
          },
          {
            type: 'token_builder',
            prompt: 'Subtract 1 heart only from user `id = 9`.',
            codeLines: ['{{0}} users', '{{1}} hearts = hearts - 1', 'WHERE id = 9;'],
            expectedTokens: ['UPDATE', 'SET'],
            distractors: ['MODIFY', 'VALUES', 'CHANGE'],
            explanation: '`UPDATE table SET assignments WHERE condition;` modifies matched rows.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the dangerous bug that wipes the entire table!',
            lines: [
              'DELETE FROM invoices',
              'id = 104;',
            ],
            bugLine: 1,
            fixed: 'WHERE id = 104;',
            explanation: 'Without `WHERE`, `DELETE FROM invoices;` fails or threatens every row.',
          },
          {
            type: 'multiple_choice',
            question: 'How do you undo uncommitted mutations after `BEGIN;` if a step fails?',
            options: ['UNDO;', 'ROLLBACK;', 'REVERT;', 'CANCEL;'],
            answer: 1,
            explanation: '`ROLLBACK;` cleanly discards everything done since `BEGIN;`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: SQL Architect',
        subtitle: 'Prove mastery of schema design, writes, and transactions',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Delete stale unverified accounts safely inside a transaction.',
            codeLines: [
              'BEGIN;',
              '{{0}} users',
              '{{1}} verified = false AND created_at < \'2025-01-01\';',
              'COMMIT;',
            ],
            expectedTokens: ['DELETE FROM', 'WHERE'],
            distractors: ['REMOVE FROM', 'UPDATE', 'HAVING'],
            explanation: 'Atomic `DELETE FROM ... WHERE ...` cleanly removes targeted records.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the invalid UPDATE assignment syntax.',
            lines: [
              'UPDATE products',
              'VALUES price = 19',
              'WHERE id = 12;',
            ],
            bugLine: 1,
            fixed: 'SET price = 19',
            explanation: '`UPDATE` uses `SET`, while `INSERT` uses `VALUES`.',
          },
          {
            type: 'predict_output',
            prompt: 'User `xp` starts at `100`. After `UPDATE` inside `BEGIN; ... ROLLBACK;`, what is `xp`?',
            code: ['BEGIN;', 'UPDATE users SET xp = 999 WHERE id = 1;', 'ROLLBACK;'],
            options: ['999', '100', 'NULL'],
            answer: 1,
            explanation: '`ROLLBACK` reverts the entire transaction back to `100`.',
          },
        ],
      },
    ],
  },
];
