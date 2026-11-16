import type { UnitSeed } from './types';

export const CSS_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Selectors & Specificity (6 nodes)
  // =========================================================================
  {
    title: 'Selectors & Specificity',
    subtitle: 'Target elements precisely, understand the cascade, and tame specificity weights.',
    conceptGraphicType: 'css_cascade',
    guidebook: {
      summary:
        'CSS rules compete through the **Cascade**: when two declarations target the same element, the browser picks the winner by origin/importance, then **Specificity** `(ID, Class/Attr/Pseudo, Element)`, and finally source order (last wins).',
      mentalModel:
        'Score every selector like a 3-digit counter `(A, B, C)`: `#id` adds `A` (`1,0,0`), `.class` / `:hover` / `[attr]` adds `B` (`0,1,0`), and tag `div` / `p` adds `C` (`0,0,1`). Higher leftmost wins!',
      keyTakeaways: [
        'Style mostly with single `.class` selectors (`0,1,0`) so overrides stay flat and predictable without fighting `#id` weights (`1,0,0`).',
        'Avoid `!important` for layout overrides—it breaks natural cascade precedence and creates maintenance arms races.',
        'Combinators sharpen targeting: `nav a` matches any descendant, `nav > a` matches direct children only.',
        'Pseudo-classes match state (`:hover`, `:focus-visible`, `:nth-child(odd)`), while pseudo-elements inject content (`::before`, `::after`).',
      ],
      keySyntax: [
        {
          title: 'Specificity Weight Comparison',
          tag: 'CASCADE',
          code: '/* (0,0,1) tag */\np { color: #a1a1aa; }\n/* (0,1,0) class beats tag cleanly */\n.lead { color: #fafafa; }\n/* (1,0,0) ID outweighs 10 classes! */\n#hero { color: #6e56cf; }',
          output: '#hero text turns #6e56cf regardless of source line order',
          explanation:
            'Even if `.lead.big.bold` stacks 3 classes `(0,3,0)`, a single `#id` `(1,0,0)` always outweighs it.',
          notes: [
            'Universal selector `*` adds `0` specificity (`0,0,0`).',
          ],
        },
        {
          title: 'Combinators: Descendant vs Direct Child',
          tag: 'COMBINATORS',
          code: '.card > h2 { margin-top: 0; }\n.card p + p { margin-top: 8px; }',
          output: 'Targets direct `<h2>` children and adjacent sibling `<p>`s',
          explanation:
            '`>` restricts matches strictly to immediate children; `+` matches an element directly following a sibling.',
          notes: [
            '`div.active` (no space) means `<div class="active">`, whereas `div .active` means `.active` *inside* a `<div>`!',
          ],
        },
        {
          title: 'Focus & State Pseudo-Classes',
          tag: 'INTERACTION',
          code: '.btn:hover { background: #27272a; }\n.btn:focus-visible { outline: 2px solid #6e56cf; }',
          output: 'Clean hover fill + keyboard-only focus ring',
          explanation:
            '`:focus-visible` shows keyboard focus outlines for accessibility without flashing rings on mouse clicks.',
          notes: [
            'Pseudo-classes use one colon (`:hover`); pseudo-elements use two (`::before`).',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Space Typo: div .btn vs div.btn',
          buggyCode: 'button .primary { background: #6e56cf; } /* Matches INSIDE button! */',
          fixedCode: 'button.primary { background: #6e56cf; }',
          reason:
            'A space creates a descendant selector; omit spaces to combine tag + class on the SAME element.',
        },
        {
          title: 'Using !important Instead of Fixing Selector Order',
          buggyCode: '.card p { color: red !important; }',
          fixedCode: '.card .alert-text { color: #f85149; }',
          reason:
            '`!important` forces every future override to also use `!important`—clean single-class modifiers stay maintainable.',
        },
      ],
      proTip:
        'Wrap low-priority defaults inside `:where(.btn)` — `:where(...)` zeros out specificity `(0,0,0)`, making library defaults effortless to override with a single class!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Rules, Classes & IDs',
        subtitle: 'Write clean property declarations and reusable .class selectors',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Anatomy of a CSS Rule',
            explanation:
              'A CSS ruleset pairs a **selector** (which elements to match) with a declaration block `{ property: value; }`. Prefer `.class` selectors for reusable styling.',
            code: ['.card {', '  background: #0e0e12;', '  color: #fafafa;', '  border-radius: 10px;', '}'],
            highlightNote: 'Every CSS declaration inside `{ ... }` ends with a semicolon `;`.',
          },
          {
            type: 'token_builder',
            prompt: 'Style every element with class `badge` using dark surface background.',
            codeLines: ['{{0}}badge {', '  background-color: #18181b;', '  {{1}}: #fafafa;', '}'],
            expectedTokens: ['.', 'color'],
            distractors: ['#', 'font-color', '::'],
            syntaxHint: 'Classes start with `.`, text color property is `color`.',
            explanation: '`.badge` targets `class="badge"` and `color` sets foreground text.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the CSS syntax error breaking the second property.',
            lines: [
              '.pill {',
              '  padding: 6px 12px',
              '  border-radius: 8px;',
              '}',
            ],
            bugLine: 1,
            fixed: '  padding: 6px 12px;',
            explanation: 'Missing `;` after `padding` causes the next line to fail parsing.',
          },
          {
            type: 'multiple_choice',
            question: 'Which property sets the **text color** in CSS?',
            options: ['text-color', 'font-color', 'color', 'foreground'],
            answer: 2,
            explanation: 'Standard CSS always uses plain `color` for text.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Specificity & Cascade',
        subtitle: 'Calculate (ID, Class, Element) weights to predict winners',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Who Wins When Rules Collide?',
            explanation:
              'Specificity ranks selectors `(ID, Class, Tag)`: `#id` `(1,0,0)` beats `.class` `(0,1,0)`, which beats `div` `(0,0,1)`. Ties go to the **later** rule in file order.',
            code: ['p { color: gray; }      /* (0,0,1) */', '.bio { color: white; }  /* (0,1,0) wins! */', '.bio { color: silver; } /* same weight -> last wins */'],
            highlightNote: 'No count of elements ever outweighs a single `.class`, nor classes an `#id`.',
          },
          {
            type: 'token_builder',
            prompt: 'Match element `<a>` that ALSO carries class `active` (no descendant space).',
            codeLines: ['a{{0}}active {', '  color: {{1}};', '}'],
            expectedTokens: ['.', '#6e56cf'],
            distractors: [' .', '#', '$'],
            explanation: '`a.active` targets `<a class="active">` cleanly with `(0,1,1)` weight.',
          },
          {
            type: 'predict_output',
            prompt: 'Which color applies to `<p id="intro" class="lead">Hi</p>`?',
            code: ['#intro { color: violet; }', '.lead.hero { color: green; }', 'p { color: white; }'],
            options: ['violet', 'green', 'white'],
            answer: 0,
            explanation: '`#intro` scores `(1,0,0)`, outweighing `.lead.hero` `(0,2,0)` even before it.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why this descendant rule misses `<button class="primary">` itself.',
            lines: [
              'button .primary {',
              '  background: #6e56cf;',
              '}',
            ],
            bugLine: 0,
            fixed: 'button.primary {',
            explanation: 'The space matches `.primary` *inside* `button`, not `<button class="primary">`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Combinators & States',
        subtitle: 'Scope direct children (>), siblings (+), and :hover/:focus-visible',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Precision Targeting',
            explanation:
              'Use `>` for direct child tags (`ul > li`), `+` for immediate next sibling (`h2 + p`), and `:hover` / `:focus-visible` for interactive feedback.',
            code: ['.menu > li { padding: 4px 0; }', '.btn:focus-visible { outline: 2px solid #6e56cf; }'],
            highlightNote: '`:hover` on touch/desktop is single-colon `:`; `::before` is double-colon `::`.',
          },
          {
            type: 'token_builder',
            prompt: 'Match ONLY direct `<a>` children of `.nav` and highlight keyboard focus.',
            codeLines: ['.nav {{0}} a {', '  color: #a1a1aa;', '}', '.nav a{{1}}focus-visible {', '  color: #fafafa;', '}'],
            expectedTokens: ['>', ':'],
            distractors: ['+', '::', '>>'],
            explanation: '`>` restricts to direct children; `:focus-visible` handles keyboard focus.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid double-colon on a state pseudo-class.',
            lines: [
              '.card::hover {',
              '  border-color: rgba(255, 255, 255, 0.2);',
              '}',
            ],
            bugLine: 0,
            fixed: '.card:hover {',
            explanation: 'Pseudo-classes like `:hover` use a single `:`; `::` is for `::before`/`::after`.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `h1 + p` select?',
            options: [
              'Every <p> anywhere inside <h1>',
              'Only the first <p> immediately following an <h1> sibling',
              'Both <h1> and all <p> tags',
              'Every sibling after <h1>',
            ],
            answer: 1,
            explanation: 'Adjacent sibling combinator `+` matches only the very next sibling.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Cascade',
        subtitle: 'Check specificity math, spaces, and combinators',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Apply fallback font weight with zero specificity using `:where(...)`.',
            codeLines: ['{{0}}(.tag) {', '  {{1}}: 600;', '}'],
            expectedTokens: [':where', 'font-weight'],
            distractors: [':is', 'font-bold', 'text-weight'],
            explanation: '`:where(.tag)` has `(0,0,0)` specificity so overrides need zero effort.',
          },
          {
            type: 'find_bug',
            prompt: 'Remove the cascade-breaking !important hack cleanly.',
            lines: [
              '.title {',
              '  color: #fafafa !important;',
              '}',
            ],
            bugLine: 1,
            fixed: '  color: #fafafa;',
            explanation: 'Clean specificity order eliminates fragile `!important` overrides.',
          },
          {
            type: 'predict_output',
            prompt: 'Two `.btn` rules appear back-to-back: blue first, violet second. Which wins?',
            code: ['.btn { background: blue; }', '.btn { background: violet; }'],
            options: ['blue', 'violet', 'Browser mixes both'],
            answer: 1,
            explanation: 'With equal specificity `(0,1,0)`, the later rule in source order wins.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Attribute & nth-child',
        subtitle: 'Style form inputs by attribute and stripe rows evenly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Structural & Attribute Selectors',
            explanation:
              'Target HTML attributes directly (`input[type="email"]`, `[disabled]`) or select every odd/even child (`tr:nth-child(even)`) without extra classes.',
            code: ['input[type="email"] { border-color: #3f3f46; }', 'li:nth-child(even) { background: #121216; }'],
            highlightNote: 'Attribute selectors carry the same `(0,1,0)` weight as a `.class`!',
          },
          {
            type: 'token_builder',
            prompt: 'Select disabled buttons cleanly using an attribute selector.',
            codeLines: ['button[{{0}}] {', '  {{1}}: 0.5;', '  cursor: not-allowed;', '}'],
            expectedTokens: ['disabled', 'opacity'],
            distractors: [':disabled-attr', 'alpha', 'transparent'],
            explanation: '`[disabled]` matches elements carrying the `disabled` attribute.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the unquoted string containing spaces in an attribute match.',
            lines: [
              'a[title=Go Home] {',
              '  text-decoration: underline;',
              '}',
            ],
            bugLine: 0,
            fixed: 'a[title="Go Home"] {',
            explanation: 'Attribute values with spaces must be wrapped in quotes (`"Go Home"`).',
          },
          {
            type: 'multiple_choice',
            question: 'What is the specificity of `button[disabled]:hover`?',
            options: ['(0,0,3)', '(0,2,1)', '(1,1,1)', '(0,1,2)'],
            answer: 1,
            explanation: '1 element (`button`) + 1 attr (`[disabled]`) + 1 pseudo (`:hover`) = `(0,2,1)`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Cascade Strategist',
        subtitle: 'Conquer specificity, combinators, and clean selector syntax',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Target direct `.row` children inside `#board` on hover without `!important`.',
            codeLines: [
              '#board {{0}} .row{{1}}hover {',
              '  background: #18181b;',
              '}',
            ],
            expectedTokens: ['>', ':'],
            distractors: ['+', '::', ' '],
            explanation: '`>` restricts to direct `.row` children; `:hover` handles hover state.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the comma-separated selector mistake leaking `.active` globally.',
            lines: [
              '.tabs a, .active {',
              '  color: #fafafa;',
              '}',
            ],
            bugLine: 0,
            fixed: '.tabs a.active {',
            explanation: '`.tabs a, .active` styles EVERY `.active` element on the whole page!',
          },
          {
            type: 'predict_output',
            prompt: 'Which specificity tuple wins: `div#app p` vs `.page .card .title .sub`?',
            code: ['/* A: div#app p -> (1,0,2) */', '/* B: .page .card .title .sub -> (0,4,0) */'],
            options: ['Rule B (4 classes)', 'Rule A (has 1 ID)', 'Tie: last wins'],
            answer: 1,
            explanation: 'Leftmost column wins: `1` ID `(1,0,2)` beats `0` IDs `(0,4,0)`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Box Model & Units (5 nodes)
  // =========================================================================
  {
    title: 'Box Model & Units',
    subtitle: 'Control content, padding, border, margin, border-box, and rem/em scaling.',
    conceptGraphicType: 'css_box',
    guidebook: {
      summary:
        'Every rendered HTML element is a rectangular box made of **content -> padding -> border -> margin**. By default (`content-box`), adding padding/borders makes a `width: 200px` box swell wider—always set `box-sizing: border-box;` globally!',
      mentalModel:
        'Imagine a framed picture: **content** is the photo, **padding** is the matte inside the frame, **border** is the wooden frame, and **margin** is the empty wall space separating neighboring frames.',
      keyTakeaways: [
        'Apply `*, *::before, *::after { box-sizing: border-box; }` so `width: 200px` INCLUDES padding and border instead of overflowing.',
        'Vertical margins between stacked blocks **collapse** (taking `max(top, bottom)`, never their sum), unlike flex/grid `gap`.',
        'Use `rem` (relative to `<html>` root font size, usually `16px`) for consistent typography & spacing; avoid `px` on body text.',
        'Center fixed-width block containers cleanly with `margin-inline: auto;` (or `margin: 0 auto;`).',
      ],
      keySyntax: [
        {
          title: 'Global border-box Reset',
          tag: 'BOX SIZING',
          code: '*, *::before, *::after {\n  box-sizing: border-box;\n}\n.panel {\n  width: 300px;\n  padding: 16px;\n  border: 1px solid rgba(255,255,255,0.08);\n}',
          output: 'Total rendered box width = exact 300px (not 334px)',
          explanation:
            '`border-box` keeps total width locked at `300px`, shrinking content area automatically for padding + border.',
          notes: [
            'Default `content-box` would add `32px` padding + `2px` border = `334px`!',
          ],
        },
        {
          title: 'rem vs em vs Viewport Units',
          tag: 'UNITS',
          code: 'html { font-size: 16px; }\n.title { font-size: 1.25rem; } /* 20px everywhere */\n.chip { padding: 0.25em 0.75em; } /* scales with chip font */',
          output: '.title stays 20px even inside nested containers',
          explanation:
            '`rem` reads root `<html>` font-size cleanly; `em` scales relative to the element’s OWN `font-size`.',
          notes: [
            'Use `100dvh` (`dynamic viewport height`) on mobile rather than `100vh` so address bars don’t clip UI.',
          ],
        },
        {
          title: 'Logical Spacing & Centered Max-Width',
          tag: 'CONTAINER',
          code: '.container {\n  width: min(100% - 32px, 960px);\n  margin-inline: auto;\n  padding-block: 24px;\n}',
          output: 'Responsive 16px side gutters capping at 960px centered',
          explanation:
            '`min(100% - 32px, 960px)` plus `margin-inline: auto` centers pages cleanly without media queries.',
          notes: [
            '`display: inline` ignores `width`/`height`; use `inline-block`, `block`, or `flex`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Unexpected Overflow From content-box Padding',
          buggyCode: '.col { box-sizing: content-box; width: 50%; padding: 20px; }',
          fixedCode: '.col { box-sizing: border-box; width: 50%; padding: 20px; }',
          reason:
            'Two `width: 50%` columns plus `20px` padding sum to `100% + 80px` under `content-box`, wrapping onto a second line!',
        },
        {
          title: 'Setting Width on a display: inline Element',
          buggyCode: 'span { width: 120px; height: 40px; } /* Ignored! */',
          fixedCode: 'span { display: inline-block; width: 120px; height: 40px; }',
          reason:
            '`<span>` defaults to `inline`, which ignores explicit `width`/`height` and vertical margins.',
        },
      ],
      proTip:
        'Prefer `gap` in Flex/Grid containers over manual `margin-bottom` hacks on cards—you never fight collapsed margins or awkward trailing margin on the last item!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Padding, Border & Margin',
        subtitle: 'Understand the 4-layer box model and border-box sizing',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Why Every App Resets to border-box',
            explanation:
              'Under default `content-box`, `padding` and `border` ADD onto `width`. Setting `box-sizing: border-box;` keeps total size equal to exact `width`.',
            code: ['.box {', '  box-sizing: border-box;', '  width: 240px;', '  padding: 16px;', '  border: 2px solid #27272a;', '}'],
            output: 'Rendered width: exact 240px',
            highlightNote: 'Shorthand `padding: 8px 16px;` = `top/bottom 8px`, `left/right 16px`.',
          },
          {
            type: 'token_builder',
            prompt: 'Lock `.card` width to `320px` even with `14px` padding inside.',
            codeLines: ['.card {', '  {{0}}: border-box;', '  width: 320px;', '  {{1}}: 14px;', '}'],
            expectedTokens: ['box-sizing', 'padding'],
            distractors: ['box-model', 'margin', 'content-box'],
            explanation: '`box-sizing: border-box` absorbs `padding` inside `320px`.',
          },
          {
            type: 'predict_output',
            prompt: 'Under `content-box`, `width: 100px; padding: 10px; border: 5px solid;` yields what total width?',
            code: ['.legacy { box-sizing: content-box; width: 100px; padding: 10px; border: 5px solid; }'],
            options: ['100px', '115px', '130px'],
            answer: 2,
            explanation: '`100 + 10 + 10 (left+right pad) + 5 + 5 (borders) = 130px`!',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `width` and `height` are ignored on `<span class="badge">`.',
            lines: [
              '.badge {',
              '  display: inline;',
              '  width: 120px;',
              '}',
            ],
            bugLine: 1,
            fixed: '  display: inline-block;',
            explanation: '`inline` ignores explicit `width`/`height`; switch to `inline-block`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Margin Collapse & Auto Center',
        subtitle: 'Handle vertical margin collapse and center layouts cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Vertical Margin Collapse',
            explanation:
              'When two vertical block margins touch (`mb: 24px` above `mt: 16px`), CSS merges them to `max(24, 16) = 24px` (not `40px`!). Horizontally, `margin-inline: auto` centers fixed-width blocks.',
            code: ['.card { max-width: 640px; margin-inline: auto; }'],
            highlightNote: 'Flexbox and Grid children NEVER collapse margins with neighbors.',
          },
          {
            type: 'token_builder',
            prompt: 'Center `.sheet` horizontally while setting `24px` top/bottom margin.',
            codeLines: ['.sheet {', '  max-width: 720px;', '  {{0}}: 24px {{1}};', '}'],
            expectedTokens: ['margin', 'auto'],
            distractors: ['padding', 'center', '50%'],
            explanation: '`margin: 24px auto;` centers horizontally whenever `max-width` bounds the box.',
          },
          {
            type: 'predict_output',
            prompt: 'Card 1 has `margin-bottom: 20px;`. Card 2 right below has `margin-top: 30px;`. Gap between them?',
            code: ['.a { margin-bottom: 20px; }', '.b { margin-top: 30px; }'],
            options: ['50px', '30px', '20px'],
            answer: 1,
            explanation: 'Vertical adjacent block margins collapse to the larger one (`30px`).',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `margin: 0 auto;` fails to center this element.',
            lines: [
              '.centered {',
              '  display: inline;',
              '  max-width: 500px;',
              '  margin: 0 auto;',
              '}',
            ],
            bugLine: 1,
            fixed: '  display: block;',
            explanation: 'Auto horizontal margins only center `block`/`flex` elements, not `inline`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Units',
        subtitle: 'Check rem/em scaling, dvh, and box-sizing rules',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Scale `.heading` reliably from root HTML (`1.5rem`) and apply global border-box.',
            codeLines: ['* { box-sizing: {{0}}; }', '.heading { font-size: 1.5{{1}}; }'],
            expectedTokens: ['border-box', 'rem'],
            distractors: ['content-box', 'px', 'vh'],
            explanation: '`border-box` fixes layout math; `rem` honors user font accessibility sizes.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the compounding `em` nesting trap inside nested lists!',
            lines: [
              'ul { font-size: 0.8em; } /* Shrinks 0.8 * 0.8 = 0.64 on level 2! */',
            ],
            bugLine: 0,
            fixed: 'ul { font-size: 0.875rem; }',
            explanation: '`em` compounds exponentially inside nested `<ul>`s; use `rem` instead.',
          },
          {
            type: 'multiple_choice',
            question: 'How many pixels equals `1.5rem` when `html { font-size: 16px; }`?',
            options: ['16px', '24px', '18px', '32px'],
            answer: 1,
            explanation: '`1.5 * 16px = 24px`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Overflow & Display Modes',
        subtitle: 'Tame scrollable boxes, min-height, and min()/clamp()',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Viewport-Safe Heights & Scrolling',
            explanation:
              'Use `overflow: auto;` to add scrollbars ONLY when needed, and `clamp(min, preferred, max)` to scale fluidly without overflowing.',
            code: ['.log-view { max-height: 240px; overflow-y: auto; }', 'h1 { font-size: clamp(1.25rem, 3vw, 2rem); }'],
            highlightNote: 'Avoid `height: 100vh` alone on cards with variable content—prefer `min-height`.',
          },
          {
            type: 'token_builder',
            prompt: 'Scroll vertically only when `.console` grows taller than `220px`.',
            codeLines: ['.console {', '  max-height: 220px;', '  {{0}}: {{1}};', '}'],
            expectedTokens: ['overflow-y', 'auto'],
            distractors: ['scroll-y', 'hidden', 'wrap'],
            explanation: '`overflow-y: auto;` keeps clean edges until content exceeds `220px`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why long unspaced URLs break out of this fixed card!',
            lines: [
              '.comment {',
              '  width: 260px;',
              '  height: 100px;',
              '  overflow: visible;',
              '}',
            ],
            bugLine: 2,
            fixed: '  min-height: 100px;\n  overflow-wrap: anywhere;',
            explanation: 'Fixed `height` + `overflow: visible` leaks text past borders; use `min-height`.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `clamp(14px, 2vw, 20px)` guarantee?',
            options: [
              'Always jumps strictly from 14px to 20px',
              'Scales with 2vw while staying cleanly between 14px and 20px',
              'Fixes height at 2vw',
              'Disables browser zoom',
            ],
            answer: 1,
            explanation: '`clamp(min, val, max)` clamps dynamic viewport growth cleanly inside bounds.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Box Model Architect',
        subtitle: 'Solve real box-sizing, margin, rem, and container challenges',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build a centered responsive wrapper capped at `900px` with `border-box`.',
            codeLines: [
              '.wrap {',
              '  box-sizing: {{0}};',
              '  max-width: 900px;',
              '  width: 100%;',
              '  margin-inline: {{1}};',
              '  padding-inline: 1rem;',
              '}',
            ],
            expectedTokens: ['border-box', 'auto'],
            distractors: ['content-box', 'center', '0'],
            explanation: '`border-box` + `max-width` + `margin-inline: auto` prevents horizontal scroll.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why two 50% boxes wrap onto two rows!',
            lines: [
              '.half {',
              '  box-sizing: content-box;',
              '  width: 50%;',
              '  padding: 12px;',
              '}',
            ],
            bugLine: 1,
            fixed: '  box-sizing: border-box;',
            explanation: 'Padding adds `24px` to each `50%` width under `content-box`, exceeding `100%`.',
          },
          {
            type: 'predict_output',
            prompt: 'A `200px` `border-box` square has `padding: 20px;` and `border: 5px solid`. Width of inner content area?',
            code: ['.box { box-sizing: border-box; width: 200px; padding: 20px; border: 5px solid; }'],
            options: ['200px', '175px', '150px'],
            answer: 2,
            explanation: '`200 - (20 + 20) - (5 + 5) = 150px` left for inner content.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Flexbox Mastery (5 nodes)
  // =========================================================================
  {
    title: 'Flexbox Mastery',
    subtitle: 'Align rows and columns effortlessly with main/cross axes, gap, and flex-shrink.',
    conceptGraphicType: 'css_flex',
    guidebook: {
      summary:
        'Flexbox arranges items cleanly along a single **main axis** (`row` or `column`). Mastering Flexbox comes down to knowing which axis `justify-content` controls (main) vs `align-items` (cross), plus spacing children with `gap`.',
      mentalModel:
        'Imagine a skewer running through items: in `flex-direction: row`, the skewer goes left-to-right so `justify-content` spaces items horizontally and `align-items` centers them vertically. Flip to `column`, and the axes flip too!',
      keyTakeaways: [
        '`justify-content` always aligns along the **main axis**; `align-items` always aligns along the **cross axis**.',
        'Use `gap: 12px;` on the flex container instead of child margins between buttons or chips.',
        'Write `flex: 1;` (`1 1 0%`) so columns share leftover width evenly, and add `min-width: 0;` on flex children before `text-overflow: ellipsis` works!',
        'Set `flex-wrap: wrap;` when chip lists or tags should drop gracefully onto new lines on small screens.',
      ],
      keySyntax: [
        {
          title: 'Navbar / Split Toolbar Row',
          tag: 'ROW ALIGN',
          code: '.topbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n}',
          output: 'Logo left, actions right, vertically centered with 12px min gap',
          explanation:
            '`space-between` pushes ends apart horizontally while `align-items: center` aligns different heights vertically.',
          notes: [
            '`flex-shrink: 0;` keeps icons from squishing when long titles sit nearby.',
          ],
        },
        {
          title: 'Centering Both Axes + Wrapping Chips',
          tag: 'WRAP & CENTER',
          code: '.chip-bar {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: center;\n  gap: 8px;\n}',
          output: 'Chips wrap onto tidy centered rows with 8px horizontal & vertical gap',
          explanation:
            '`gap` adds spacing both between items on a row AND between wrapped rows.',
          notes: [
            'Use `align-content` only when wrapping creates multiple lines.',
          ],
        },
        {
          title: 'Truncating Long Text Inside Flex Children',
          tag: 'MIN-WIDTH 0',
          code: '.flex-title {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}',
          output: 'Long filenames cleanly truncate (`...`) instead of overflowing',
          explanation:
            'By default flex items refuse to shrink smaller than `min-width: auto` (their longest unbreakable word). Setting `min-width: 0` unlocks clean shrinking.',
          notes: [
            'One of the top 3 real-world CSS layout fixes every frontend engineer relies on!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using justify-content for Vertical Alignment in column Mode? (Or Mixing Axes!)',
          buggyCode: '.col { display: flex; flex-direction: column; align-items: space-between; }',
          fixedCode: '.col { display: flex; flex-direction: column; justify-content: space-between; }',
          reason:
            '`align-items` NEVER takes `space-between`—when `flex-direction: column`, vertical spacing lives on `justify-content`!',
        },
        {
          title: 'Forgetting min-width: 0 on Truncated Flex Items',
          buggyCode: '.label { flex: 1; overflow: hidden; white-space: nowrap; } /* Still overflows! */',
          fixedCode: '.label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }',
          reason:
            'Flexbox sets `min-width: auto` by default, preventing the box from narrowing enough for `ellipsis`.',
        },
      ],
      proTip:
        'Need just one item pushed to the far right inside a left-aligned flex row? Put `margin-left: auto;` on that single child—no wrapper `<div>` needed!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Main & Cross Axes',
        subtitle: 'Master display: flex, justify-content, and align-items',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Flex Container Fundamentals',
            explanation:
              'Setting `display: flex;` turns direct children into flex items along a horizontal row. Use `justify-content` on the main axis and `align-items` on the cross axis.',
            code: ['.row {', '  display: flex;', '  justify-content: space-between;', '  align-items: center;', '  gap: 8px;', '}'],
            highlightNote: 'Default `flex-direction` is `row` (left-to-right).',
          },
          {
            type: 'token_builder',
            prompt: 'Center a tiny badge cleanly inside a square flex box.',
            codeLines: ['.center {', '  display: {{0}};', '  justify-content: center;', '  {{1}}: center;', '}'],
            expectedTokens: ['flex', 'align-items'],
            distractors: ['block', 'align-content', 'vertical-align'],
            explanation: '`justify-content: center` + `align-items: center` centers both axes cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid property value in this vertical stack.',
            lines: [
              '.stack {',
              '  display: flex;',
              '  flex-direction: column;',
              '  align-items: space-between;',
              '}',
            ],
            bugLine: 3,
            fixed: '  justify-content: space-between;',
            explanation: '`space-between` only works on `justify-content`, which follows `column` vertically.',
          },
          {
            type: 'multiple_choice',
            question: 'When `flex-direction: column;` is active, which axis does `justify-content` align?',
            options: ['Horizontal (left-to-right)', 'Vertical (top-to-bottom)', 'Diagonal', 'Z-index'],
            answer: 1,
            explanation: '`justify-content` always follows the main axis (`column` = vertical).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Grow, Shrink & Wrap',
        subtitle: 'Distribute space with flex: 1, flex-shrink: 0, and flex-wrap',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Controlling Child Sizing',
            explanation:
              '`flex: 1;` lets a column grow to fill remaining space. Lock fixed icons with `flex-shrink: 0;`, and let multi-tag bars break rows with `flex-wrap: wrap;`.',
            code: ['.avatar { flex-shrink: 0; width: 40px; }', '.content { flex: 1; }', '.tags { display: flex; flex-wrap: wrap; gap: 6px; }'],
            highlightNote: 'Setting `flex: 1;` equals `flex-grow: 1; flex-shrink: 1; flex-basis: 0%;`.',
          },
          {
            type: 'token_builder',
            prompt: 'Stop icons from squishing and let tag chips wrap cleanly.',
            codeLines: ['.icon { {{0}}: 0; }', '.chip-list { display: flex; {{1}}: wrap; gap: 8px; }'],
            expectedTokens: ['flex-shrink', 'flex-wrap'],
            distractors: ['flex-grow', 'white-space', 'word-wrap'],
            explanation: '`flex-shrink: 0` protects icons; `flex-wrap: wrap` wraps overflowing chips.',
          },
          {
            type: 'predict_output',
            prompt: 'In a `300px` flex row, Card A has `flex: 1` and Card B has `flex: 2`. Width of Card B?',
            code: ['.a { flex: 1; }', '.b { flex: 2; }'],
            options: ['150px', '200px', '100px'],
            answer: 1,
            explanation: 'Space splits in `1 : 2` ratio (`1/3 = 100px`, `2/3 = 200px`).',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `gap` has zero effect on `.row`.',
            lines: [
              '.row {',
              '  display: block;',
              '  gap: 12px;',
              '}',
            ],
            bugLine: 1,
            fixed: '  display: flex;',
            explanation: '`gap` only spaces children of `flex` or `grid` containers, never `block`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Flexbox',
        subtitle: 'Test axes, truncation min-width, and flex-shrink',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Prevent long text from pushing sibling buttons off a flex row.',
            codeLines: ['.title {', '  flex: 1;', '  {{0}}: 0;', '  overflow: hidden;', '  {{1}}: ellipsis;', '  white-space: nowrap;', '}'],
            expectedTokens: ['min-width', 'text-overflow'],
            distractors: ['max-width', 'overflow-wrap', 'flex-shrink'],
            explanation: '`min-width: 0` lets the flex child shrink below content size so `ellipsis` triggers.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `.right-btn` fails to stick to the right edge inside `display: flex`.',
            lines: [
              '.bar { display: flex; }',
              '.right-btn { float: right; }',
            ],
            bugLine: 1,
            fixed: '.right-btn { margin-left: auto; }',
            explanation: '`float` is ignored inside flex containers—use `margin-left: auto` instead!',
          },
          {
            type: 'multiple_choice',
            question: 'Which container property spaces wrapped flex rows vertically AND horizontally?',
            options: ['spacing', 'padding', 'gap', 'margin-inline'],
            answer: 2,
            explanation: '`gap` controls both column and row spacing inside flex/grid containers.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Self Alignment & Order',
        subtitle: 'Override individual child alignment cleanly with align-self',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Per-Item Flex Overrides',
            explanation:
              'Override the container’s `align-items` for one single item using `align-self: flex-end;` or `align-self: stretch;`.',
            code: ['.card-footer { margin-top: auto; align-self: flex-end; }'],
            highlightNote: '`margin-top: auto` in a `flex-direction: column` card pins footers to the bottom!',
          },
          {
            type: 'token_builder',
            prompt: 'Pin `.cta` to the bottom of variable-height cards in a `column` flex box.',
            codeLines: ['.card { display: flex; flex-direction: {{0}}; }', '.card .cta { {{1}}: auto; }'],
            expectedTokens: ['column', 'margin-top'],
            distractors: ['row', 'align-bottom', 'bottom'],
            explanation: '`margin-top: auto` absorbs extra vertical card height above `.cta`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `align-self` on the container does nothing for items.',
            lines: [
              '.wrapper {',
              '  display: flex;',
              '  align-self: center;',
              '}',
            ],
            bugLine: 2,
            fixed: '  align-items: center;',
            explanation: 'Containers align all children via `align-items`; `align-self` goes on a child.',
          },
          {
            type: 'multiple_choice',
            question: 'Does changing CSS `order` alter keyboard Tab focus order?',
            options: [
              'Yes, Tab follows visual CSS order',
              'No! Tab stays pinned to HTML DOM order, hurting accessibility if abused',
              'Only inside Grid',
              'order disables Tab focus',
            ],
            answer: 1,
            explanation: 'Keep DOM order logical for screen readers & keyboard users instead of relying on `order`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Flex Layout Engineer',
        subtitle: 'Build responsive card decks, footers, and truncated headers',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Create a responsive horizontal flex bar where only the title expands & truncates.',
            codeLines: [
              '.header { display: flex; {{0}}: center; gap: 8px; }',
              '.header .title { flex: 1; {{1}}: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }',
            ],
            expectedTokens: ['align-items', 'min-width'],
            distractors: ['justify-content', 'max-width', 'flex-wrap'],
            explanation: '`align-items: center` + `min-width: 0` builds resilient toolbars.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why chips refuse to wrap onto a second line!',
            lines: [
              '.pills {',
              '  display: flex;',
              '  gap: 8px;',
              '  overflow-wrap: break-word;',
              '}',
            ],
            bugLine: 3,
            fixed: '  flex-wrap: wrap;',
            explanation: '`flex-wrap: wrap` wraps flex items onto new lines (`overflow-wrap` wraps words).',
          },
          {
            type: 'predict_output',
            prompt: 'In `display: flex; flex-direction: column;`, what happens when Child 1 has `margin-bottom: auto`?',
            code: ['.col { display: flex; flex-direction: column; height: 200px; }', '.top { margin-bottom: auto; }'],
            options: ['Nothing changes', 'Child 2+ are pushed all the way to the bottom', 'Items center vertically'],
            answer: 1,
            explanation: '`margin-bottom: auto` absorbs all remaining vertical space under Child 1.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: CSS Grid Systems (5 nodes)
  // =========================================================================
  {
    title: 'CSS Grid Systems',
    subtitle: 'Design 2D dashboards, fr tracks, auto-fit responsive cards, and spanned tiles.',
    conceptGraphicType: 'css_grid',
    guidebook: {
      summary:
        'While Flexbox solves 1D rows/columns, **CSS Grid** controls 2D rows AND columns simultaneously on the container—powering bento dashboards, sidebars, and media-query-free responsive card grids.',
      mentalModel:
        'Think of Flexbox as **content-out** (children push sizes) and Grid as **layout-in** (you define fixed or fractional `1fr` tracks, then drop items cleanly into cells).',
      keyTakeaways: [
        'Divide remaining space into proportional fractions with `1fr` (`grid-template-columns: 240px 1fr;`).',
        'Build responsive multi-column grids with **zero media queries**: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));`.',
        'Span hero cards across two columns or rows cleanly via `grid-column: span 2;`.',
        'Center anything in just 2 lines: `display: grid; place-items: center;`.',
      ],
      keySyntax: [
        {
          title: 'Zero-Media-Query Responsive Card Grid',
          tag: 'AUTO-FIT',
          code: '.bento {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 12px;\n}',
          output: 'Fits as many >=220px cards per row as viewport width allows',
          explanation:
            '`minmax(220px, 1fr)` prevents squishing below `220px` while stretching cards to fill extra space evenly.',
          notes: [
            '`auto-fit` collapses empty tracks so cards stretch full width; `auto-fill` keeps empty track slots reserved.',
          ],
        },
        {
          title: 'Fixed Sidebar + Fluid Workspace Shell',
          tag: 'FR TRACKS',
          code: '.shell {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n  min-height: 100dvh;\n}',
          output: '240px sidebar + fluid remaining main column',
          explanation:
            '`1fr` takes `100%` of whatever horizontal space remains after the `240px` sidebar.',
          notes: [
            'Like Flexbox, put `minmax(0, 1fr)` if wide `<pre>` code blocks inside `1fr` might blow out the track!',
          ],
        },
        {
          title: 'Spanning Bento Tiles Across Tracks',
          tag: 'SPANNING',
          code: '.featured-card {\n  grid-column: span 2;\n  grid-row: span 2;\n}',
          output: 'Featured bento widget fills a 2x2 grid area',
          explanation:
            '`span N` expands an item cleanly without hardcoding track line numbers.',
          notes: [
            'Short center trick: `display: grid; place-items: center;`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using 50% + gap Overflow Instead of fr Units',
          buggyCode: 'grid-template-columns: 50% 50%; gap: 16px; /* Overflows by 16px! */',
          fixedCode: 'grid-template-columns: 1fr 1fr; gap: 16px;',
          reason:
            'Percentages ignore `gap` (`50% + 50% + 16px > 100%`), whereas `1fr` subtracts `gap` BEFORE splitting space.',
        },
        {
          title: 'Code Block Stretching a 1fr Grid Column Past Viewport',
          buggyCode: '.grid { grid-template-columns: 220px 1fr; } /* Wide <pre> forces overflow! */',
          fixedCode: '.grid { grid-template-columns: 220px minmax(0, 1fr); }',
          reason:
            '`1fr` acts like `minmax(auto, 1fr)` by default; `minmax(0, 1fr)` allows horizontal shrinking cleanly.',
        },
      ],
      proTip:
        'Need two-line overlays (image + badge + gradient) without `position: absolute` headaches? Put children in the SAME grid cell (`grid-area: 1 / 1;`)—they stack cleanly inside normal layout flow!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Tracks & fr Units',
        subtitle: 'Define columns cleanly without percentage + gap overflow',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Fractional Grid Tracks',
            explanation:
              'Activate Grid with `display: grid;`, then specify columns using `grid-template-columns`. Prefer `fr` fractions (`1fr 2fr`) so CSS subtracts `gap` cleanly before dividing space.',
            code: ['.layout {', '  display: grid;', '  grid-template-columns: 220px 1fr;', '  gap: 12px;', '}'],
            highlightNote: 'Use `repeat(3, 1fr)` as clean shorthand for `1fr 1fr 1fr`.',
          },
          {
            type: 'token_builder',
            prompt: 'Create a 3 equal-column grid with a `12px` gutter.',
            codeLines: ['.cards {', '  display: {{0}};', '  {{1}}: repeat(3, 1fr);', '  gap: 12px;', '}'],
            expectedTokens: ['grid', 'grid-template-columns'],
            distractors: ['flex', 'grid-columns', 'columns'],
            explanation: '`repeat(3, 1fr)` creates three equal tracks factoring out `gap`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why 2 columns with `gap: 16px` trigger horizontal scrolling!',
            lines: [
              '.split {',
              '  display: grid;',
              '  grid-template-columns: 50% 50%;',
              '  gap: 16px;',
              '}',
            ],
            bugLine: 2,
            fixed: '  grid-template-columns: 1fr 1fr;',
            explanation: '`50% + 50% + 16px` equals `100% + 16px`; use `1fr 1fr` instead.',
          },
          {
            type: 'multiple_choice',
            question: 'In a `620px` grid with `gap: 20px` and `grid-template-columns: 1fr 2fr;`, how wide is the `2fr` column?',
            options: ['413px', '400px', '310px', '420px'],
            answer: 1,
            explanation: '`620 - 20 (gap) = 600px`; `2/3 * 600 = 400px`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Responsive auto-fit Grids',
        subtitle: 'Reflow cards across mobile and desktop with zero breakpoints',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Intrinsic Fluid Grids',
            explanation:
              'Pair `repeat(auto-fit, minmax(220px, 1fr))` to auto-pack cards that never dip below `220px` and cleanly wrap down to 1 column on phones.',
            code: ['.catalog {', '  display: grid;', '  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));', '  gap: 14px;', '}'],
            highlightNote: '`minmax(min(220px, 100%), 1fr)` stays safe even inside sub-220px panels!',
          },
          {
            type: 'token_builder',
            prompt: 'Build a zero-media-query grid keeping cards at least `240px` wide.',
            codeLines: ['.grid {', '  display: grid;', '  grid-template-columns: repeat({{0}}, {{1}}(240px, 1fr));', '  gap: 12px;', '}'],
            expectedTokens: ['auto-fit', 'minmax'],
            distractors: ['auto', 'clamp', 'wrap'],
            explanation: '`auto-fit` + `minmax(240px, 1fr)` adapts column count automatically.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing upper max bound on minmax(...).',
            lines: [
              '.grid {',
              '  grid-template-columns: repeat(auto-fit, minmax(200px));',
              '}',
            ],
            bugLine: 1,
            fixed: '  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));',
            explanation: '`minmax(min, max)` always takes TWO comma-separated track sizes.',
          },
          {
            type: 'predict_output',
            prompt: 'A `600px` grid uses `minmax(250px, 1fr)` with `gap: 0`. How many columns fit per row?',
            code: ['.g { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }'],
            options: ['1 column', '2 columns', '3 columns'],
            answer: 1,
            explanation: '`3 * 250 = 750px` exceeds `600px`, so Grid lays out 2 columns of `300px`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Grid',
        subtitle: 'Verify place-items, spans, and minmax(0, 1fr)',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Center `.modal` in 2 lines and stretch `.hero` across 2 columns.',
            codeLines: ['.backdrop { display: grid; {{0}}: center; }', '.hero { {{1}}: span 2; }'],
            expectedTokens: ['place-items', 'grid-column'],
            distractors: ['align-items', 'col-span', 'justify-self'],
            explanation: '`place-items: center` centers both grid axes; `grid-column: span 2` widens `.hero`.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the wide `<pre>` snippet pushing `.main` column out past viewport.',
            lines: [
              '.workspace {',
              '  display: grid;',
              '  grid-template-columns: 240px 1fr;',
              '}',
            ],
            bugLine: 2,
            fixed: '  grid-template-columns: 240px minmax(0, 1fr);',
            explanation: '`minmax(0, 1fr)` prevents wide unbreakable code lines from widening the track.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `place-items: center;` serve as shorthand for in CSS Grid?',
            options: [
              'padding + margin',
              'align-items + justify-items',
              'grid-column + grid-row',
              'top + left',
            ],
            answer: 1,
            explanation: '`place-items` sets both `align-items` (block axis) and `justify-items` (inline axis).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Named Areas & Overlaying',
        subtitle: 'Map page templates cleanly and stack layers via grid-area',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Readable ASCII Layout Maps',
            explanation:
              'Name regions with `grid-template-areas` so your entire page blueprint reads like a diagram, or stack an image + badge cleanly in `grid-area: 1 / 1;`.',
            code: ['.app {', '  display: grid;', '  grid-template-areas: "nav main";', '}', '.nav { grid-area: nav; }'],
            highlightNote: 'Use `.` inside `grid-template-areas` to denote an empty grid cell.',
          },
          {
            type: 'token_builder',
            prompt: 'Assign `.sidebar` into the named `"side"` grid area.',
            codeLines: ['.page { display: grid; {{0}}: "side main"; }', '.sidebar { {{1}}: side; }'],
            expectedTokens: ['grid-template-areas', 'grid-area'],
            distractors: ['grid-areas', 'area', 'grid-name'],
            explanation: '`grid-template-areas` defines named cells matched via `grid-area`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the mismatched column count inside grid-template-areas!',
            lines: [
              '.frame {',
              '  display: grid;',
              '  grid-template-areas:',
              '    "top top"',
              '    "side";',
              '}',
            ],
            bugLine: 4,
            fixed: '    "side main";',
            explanation: 'Every quoted row string in `grid-template-areas` must list the same number of cells.',
          },
          {
            type: 'multiple_choice',
            question: 'How do you stack two elements on top of each other using Grid without `position: absolute`?',
            options: [
              'Assign both children `grid-area: 1 / 1` inside the same grid container',
              'Use `float: left` on both',
              'Set `flex-direction: z`',
              'Grid forbids overlapping items',
            ],
            answer: 0,
            explanation: 'Multiple items placed on cell `1 / 1` overlap cleanly in DOM/z-index order.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Bento Architect',
        subtitle: 'Master auto-fit grids, spans, fr math, and safe overflow',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build a responsive bento dashboard where `.spotlight` spans 2 columns.',
            codeLines: [
              '.bento {',
              '  display: grid;',
              '  grid-template-columns: repeat({{0}}, minmax(200px, 1fr));',
              '  gap: 12px;',
              '}',
              '.spotlight { {{1}}: span 2; }',
            ],
            expectedTokens: ['auto-fit', 'grid-column'],
            distractors: ['wrap', 'column-span', 'flex'],
            explanation: '`auto-fit` packs responsive cards while `grid-column: span 2` promotes featured widgets.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing unit on `1` inside grid-template-columns.',
            lines: [
              '.dash {',
              '  display: grid;',
              '  grid-template-columns: 200px 1;',
              '}',
            ],
            bugLine: 2,
            fixed: '  grid-template-columns: 200px 1fr;',
            explanation: 'Track widths require units (`1fr`), never bare unitless integers like `1`.',
          },
          {
            type: 'predict_output',
            prompt: 'What happens if `.spotlight { grid-column: span 2; }` runs in a 1-column mobile grid?',
            code: ['.bento { grid-template-columns: 1fr; }', '.spotlight { grid-column: span 2; }'],
            options: [
              'Forces a wider 2nd track and causes horizontal scroll!',
              'Auto-shrinks to 1 column cleanly',
              'Hides .spotlight',
            ],
            answer: 0,
            explanation: '`span 2` forces an implicit 2nd column unless scoped inside `@media (min-width: ...)`!',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Custom Properties, Media Queries & Motion (5 nodes)
  // =========================================================================
  {
    title: 'Variables, Responsive & Motion',
    subtitle: 'Theme apps with --custom-props, @media queries, and 60fps CSS transforms.',
    conceptGraphicType: 'css_vars',
    guidebook: {
      summary:
        'Modern CSS ships dynamic design tokens via **Custom Properties** (`--surface: #0e0e12;`), adaptive breakpoints (`@media`), and hardware-accelerated **transforms & transitions** (`transform`, `opacity`) that stay silky at 60fps.',
      mentalModel:
        'CSS custom properties live right in the DOM cascade: define theme tokens on `:root`, override them inside `.dark` or `@media`, and animate ONLY GPU-composited properties (`transform`, `opacity`) instead of `left`/`top`/`width`.',
      keyTakeaways: [
        'Declare tokens cleanly on `:root` (`--accent: #6e56cf;`) and consume them via `var(--accent, fallback)`.',
        'Mobile-first `@media (min-width: 768px)` layers desktop enhancements cleanly on top of compact base styles.',
        'Animate `transform: translateY(-2px)` and `opacity` — animating `width`, `height`, or `margin` triggers expensive layout recalculation!',
        'Always honor accessibility with `@media (prefers-reduced-motion: reduce)` around non-essential animations.',
      ],
      keySyntax: [
        {
          title: 'Design Tokens on :root & var() Fallbacks',
          tag: 'TOKENS',
          code: ':root {\n  --canvas: #0a0a0c;\n  --accent: #6e56cf;\n}\n.btn { background: var(--accent, #6e56cf); }',
          output: 'Swapping `.light { --canvas: #fff; }` rethemes instantly',
          explanation:
            'Unlike Sass `$vars`, CSS `var(--name)` works live in the browser so themes switch in 1 line with zero rebuild.',
          notes: [
            'Supply an optional 2nd arg inside `var(--gap, 12px)` as a safety fallback.',
          ],
        },
        {
          title: 'Mobile-First Breakpoints & Container Queries',
          tag: 'RESPONSIVE',
          code: '.grid { grid-template-columns: 1fr; }\n@media (min-width: 768px) {\n  .grid { grid-template-columns: repeat(3, 1fr); }\n}',
          output: '1 col on phones -> 3 cols at >=768px width',
          explanation:
            'Writing compact mobile styles first keeps overrides tiny and additive as viewports grow.',
          notes: [
            'Container queries (`@container (min-width: 400px)`) respond to parent card width instead of screen width!',
          ],
        },
        {
          title: '60fps Compositor Transitions',
          tag: 'MOTION',
          code: '.pill {\n  transition: transform 140ms ease, opacity 140ms ease;\n}\n.pill:active {\n  transform: scale(0.96);\n  opacity: 0.9;\n}',
          output: 'Zero-jank GPU tap scale + opacity shift',
          explanation:
            '`transform` and `opacity` bypass layout reflow & paint completely, running directly on the GPU compositor.',
          notes: [
            'Avoid `transition: all ...` which accidentally animates unintended layout properties.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Animating width/top/margin Instead of transform',
          buggyCode: '.drawer { transition: left 300ms ease; }',
          fixedCode: '.drawer { transition: transform 300ms ease; }',
          reason:
            'Animating `left` forces layout calculations every frame; `transform: translateX(...)` runs cleanly on the GPU.',
        },
        {
          title: 'Omitting Double Dash `--` on Custom Properties',
          buggyCode: ':root { accent: #6e56cf; } .btn { color: var(accent); }',
          fixedCode: ':root { --accent: #6e56cf; } .btn { color: var(--accent); }',
          reason:
            'Every CSS custom property MUST start with `--` both where defined and inside `var(--name)`.',
        },
      ],
      proTip:
        'Check `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` to keep motion comfortable for vestibular-sensitive users.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Custom Properties (--vars)',
        subtitle: 'Define cascade-aware tokens on :root and consume with var()',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Live CSS Tokens',
            explanation:
              'Define design tokens starting with `--` inside `:root`, and read them anywhere via `var(--token, fallback)`. Scoped overrides retheme entire subtrees automatically.',
            code: [':root { --surface: #0e0e12; --border: rgba(255,255,255,0.08); }', '.card { background: var(--surface); border: 1px solid var(--border); }'],
            highlightNote: 'Notice custom property names are case-sensitive (`--Bg` != `--bg`)!',
          },
          {
            type: 'token_builder',
            prompt: 'Define `--accent` on `:root` and read it with `#6e56cf` fallback.',
            codeLines: ['{{0}} { --accent: #6e56cf; }', '.cta { background: {{1}}(--accent, #6e56cf); }'],
            expectedTokens: [':root', 'var'],
            distractors: ['html', 'get', '$accent'],
            explanation: '`:root` makes tokens global; `var(--accent, fallback)` handles missing values.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing double-dash inside `var(...)`.',
            lines: [
              ':root { --radius: 10px; }',
              '.box { border-radius: var(radius); }',
            ],
            bugLine: 1,
            fixed: '.box { border-radius: var(--radius); }',
            explanation: '`var()` always expects the full `--radius` token prefix.',
          },
          {
            type: 'multiple_choice',
            question: 'How do CSS Custom Properties differ from Sass/SCSS `$variables`?',
            options: [
              'CSS custom properties only hold hex colors',
              'CSS custom properties exist live in the DOM and respond dynamically to themes/media queries',
              'CSS variables require compilation on save',
              'SCSS variables override :root at runtime',
            ],
            answer: 1,
            explanation: 'Live CSS `--vars` cascade and update instantaneously at runtime.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: '@media & Mobile-First',
        subtitle: 'Layer wider breakpoints cleanly atop compact mobile defaults',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Mobile-First Queries',
            explanation:
              'Style narrow phone layouts by default, then expand columns inside `@media (min-width: 768px) { ... }` as screen space grows.',
            code: ['.cols { grid-template-columns: 1fr; }', '@media (min-width: 768px) {', '  .cols { grid-template-columns: 1fr 1fr; }', '}'],
            highlightNote: 'Keep media query units in `px` or `rem` consistently.',
          },
          {
            type: 'token_builder',
            prompt: 'Apply two columns ONLY when the viewport reaches at least `640px` wide.',
            codeLines: ['{{0}} ({{1}}: 640px) {', '  .cards { grid-template-columns: 1fr 1fr; }', '}'],
            expectedTokens: ['@media', 'min-width'],
            distractors: ['@query', 'max-width', 'screen-width'],
            explanation: '`@media (min-width: 640px)` scales up cleanly from mobile defaults.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why desktop overrides mobile on narrow phones too!',
            lines: [
              '@media (min-width: 768px) { .cols { grid-template-columns: 1fr 1fr; } }',
              '.cols { grid-template-columns: 1fr; }',
            ],
            bugLine: 1,
            fixed: '.cols { grid-template-columns: 1fr; }\n@media (min-width: 768px) { .cols { grid-template-columns: 1fr 1fr; } }',
            explanation: 'Because both have equal specificity, putting the 1-col base rule LAST overwrites `@media`!',
          },
          {
            type: 'multiple_choice',
            question: 'Which feature queries the parent card’s size rather than the full browser viewport?',
            options: ['@viewport', '@container', '@scope', '@layer'],
            answer: 1,
            explanation: '`container-type: inline-size;` + `@container (min-width: ...)` adapts widgets to their card container!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Themes',
        subtitle: 'Check custom properties, fallbacks, and breakpoint ordering',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Swap surface color cleanly whenever `[data-theme="light"]` is active.',
            codeLines: ['[data-theme="light"] {', '  {{0}}: #ffffff;', '}', 'body { background: {{1}}(--surface, #0a0a0c); }'],
            expectedTokens: ['--surface', 'var'],
            distractors: ['surface', 'token', 'theme'],
            explanation: 'Overriding `--surface` on `[data-theme]` rethemes everything reading `var(--surface)`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid unitless media query threshold.',
            lines: [
              '@media (min-width: 768) {',
              '  .sidebar { display: block; }',
              '}',
            ],
            bugLine: 0,
            fixed: '@media (min-width: 768px) {',
            explanation: 'Media dimensions require explicit units (`768px` or `48rem`).',
          },
          {
            type: 'predict_output',
            prompt: 'If `:root` has `--gap: 8px;` and `.dense` overrides `--gap: 4px;`, what does `padding: var(--gap)` inside `.dense` compute to?',
            code: [':root { --gap: 8px; }', '.dense { --gap: 4px; }', '.dense .row { padding: var(--gap); }'],
            options: ['8px', '4px', '12px'],
            answer: 1,
            explanation: 'Custom properties inherit down the cascade, picking up `.dense`’s `4px`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'GPU Motion & Accessibility',
        subtitle: 'Animate transform/opacity smoothly and respect reduced motion',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Jank Compositor Animations',
            explanation:
              'Transition only explicit compositor properties (`transform`, `opacity`) instead of `all` or `left`/`top`. Respect `@media (prefers-reduced-motion: reduce)`.',
            code: ['.card { transition: transform 150ms ease, opacity 150ms ease; }', '.card:hover { transform: translateY(-2px); }'],
            highlightNote: '`position: sticky; top: 0;` also outperforms JS scroll listeners!',
          },
          {
            type: 'token_builder',
            prompt: 'Scale buttons smoothly on press using GPU-composited `transform`.',
            codeLines: ['.btn { {{0}}: transform 120ms ease; }', '.btn:active { {{1}}: scale(0.96); }'],
            expectedTokens: ['transition', 'transform'],
            distractors: ['animation', 'scale', 'zoom'],
            explanation: 'Combining `transition: transform` with `scale(0.96)` avoids layout reflow.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the expensive layout-reflow transition!',
            lines: [
              '.panel {',
              '  transition: left 200ms ease, width 200ms ease;',
              '}',
            ],
            bugLine: 1,
            fixed: '  transition: transform 200ms ease, opacity 200ms ease;',
            explanation: 'Animating `left`/`width` recalculates layout on every frame; use `transform`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which CSS media query detects users who disable jarring screen motion in OS settings?',
            options: [
              'prefers-color-scheme: dark',
              'prefers-reduced-motion: reduce',
              'hover: none',
              'pointer: coarse',
            ],
            answer: 1,
            explanation: 'Checking `prefers-reduced-motion: reduce` respects user comfort settings.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Design System Pro',
        subtitle: 'Master tokens, responsive queries, and 60fps transitions',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Theme `.card` via `--border` token and disable motion cleanly when reduced.',
            codeLines: [
              '.card { border: 1px solid {{0}}(--border); transition: transform 150ms ease; }',
              '@media ({{1}}: reduce) {',
              '  .card { transition: none; }',
              '}',
            ],
            expectedTokens: ['var', 'prefers-reduced-motion'],
            distractors: ['token', 'prefers-contrast', 'reduced-motion'],
            explanation: 'Design tokens + `prefers-reduced-motion` yields resilient CSS.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why `position: sticky` refuses to stick inside this wrapper!',
            lines: [
              '.page-wrap { overflow: hidden; }',
              '.sticky-bar { position: sticky; top: 0; }',
            ],
            bugLine: 0,
            fixed: '.page-wrap { overflow-x: clip; }',
            explanation: '`overflow: hidden` breaks `position: sticky`; `overflow-x: clip` preserves sticking!',
          },
          {
            type: 'predict_output',
            prompt: 'With `background: var(--missing, #18181b);`, what renders if `--missing` was never defined?',
            code: ['.pill { background: var(--missing, #18181b); }'],
            options: ['Transparent (invalid)', '#18181b', 'Black #000'],
            answer: 1,
            explanation: 'The second argument inside `var(..., fallback)` supplies `#18181b`.',
          },
        ],
      },
    ],
  },
];
