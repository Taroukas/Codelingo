import type { UnitSeed } from './types';

export const HTML_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Document Tree & Core Elements (6 nodes)
  // =========================================================================
  {
    title: 'Document Tree & Elements',
    subtitle: 'Structure valid HTML5 documents, headings, paragraphs, and nested tags.',
    conceptGraphicType: 'html_dom',
    guidebook: {
      summary:
        'HTML (HyperText Markup Language) builds the **DOM (Document Object Model)** tree of every web page. Every page starts cleanly with `<!DOCTYPE html>`, sets `<html lang="en">`, places metadata in `<head>`, and puts visible content in `<body>`.',
      mentalModel:
        'Think of HTML tags as nested boxes: opening `<p>` and closing `</p>` must always close in reverse inside-out order (`<p><strong>ok</strong></p>`), while void tags like `<meta>`, `<img>`, and `<input>` carry no closing tag.',
      keyTakeaways: [
        'Always open files with `<!DOCTYPE html>` so browsers run Standards Mode instead of legacy quirks mode.',
        'Keep `<title>` and `<meta name="viewport" ...>` inside `<head>`, never inside `<body>`.',
        'Headings (`<h1>` through `<h6>`) express **document outline hierarchy**, not text font size—keep one clear `<h1>` and don’t skip levels.',
        'Void elements (`<br>`, `<hr>`, `<img>`, `<meta>`, `<link>`) have no children and no closing `</img >` tag.',
      ],
      keySyntax: [
        {
          title: 'Minimal Standards-Compliant HTML5 Skeleton',
          tag: 'BOILERPLATE',
          code: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>CodeLingo</title>\n</head>\n<body>\n  <h1>Hello Web</h1>\n</body>\n</html>',
          output: 'Clean standards-mode DOM with mobile viewport support',
          explanation:
            '`lang="en"` guides screen readers and translation; the viewport meta tag prevents tiny zoomed-out desktop layout on phones.',
          notes: [
            'Place external CSS `<link rel="stylesheet">` inside `<head>` so styles paint immediately without unstyled flash.',
          ],
        },
        {
          title: 'Ordered & Unordered Lists',
          tag: 'LISTS',
          code: '<ul>\n  <li>Parse tokens</li>\n  <li>Build DOM tree</li>\n</ul>',
          output: 'Bulleted semantic list with 2 items',
          explanation:
            'Only `<li>` elements belong as direct children of `<ul>` or `<ol>`—use `<ol>` when step sequence matters.',
          notes: [
            'Screen readers announce list item counts automatically when you use `<ul>`/`<li>` instead of stacked `<div>`s.',
          ],
        },
        {
          title: 'Attributes & Proper Nesting',
          tag: 'ATTRIBUTES',
          code: '<p data-unit="1">\n  Learn <strong>clean</strong> markup.\n</p>',
          output: 'Clean balanced DOM node',
          explanation:
            'Attributes sit inside the opening tag (`name="value"`); nested tags always close inner-before-outer.',
          notes: [
            'Custom attributes for JavaScript hooks always start with `data-*` (`data-id="42"`).',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using h1..h6 Based on Font Size Instead of Outline',
          buggyCode: '<h1>App</h1>\n<h4>Subtitle</h4> <!-- Skipped h2 & h3! -->',
          fixedCode: '<h1>App</h1>\n<h2>Subtitle</h2>',
          reason:
            'Headings build navigation outlines for assistive tools—follow `h1 -> h2 -> h3` cleanly and tweak visual size in CSS.',
        },
        {
          title: 'Mis-nested Crossing Closing Tags',
          buggyCode: '<p><em>Important</p></em>',
          fixedCode: '<p><em>Important</em></p>',
          reason:
            'Tags must close in Last-In First-Out order (`</em>` before `</p>`).',
        },
      ],
      proTip:
        'Load non-blocking JavaScript cleanly using `<script defer src="app.js"></script>` inside `<head>` so HTML parsing finishes uninterrupted and DOM elements exist before your script executes!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'HTML5 Skeleton',
        subtitle: 'Open pages with DOCTYPE, head metadata, and body content',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Roots of Every Web Document',
            explanation:
              'Every HTML5 file starts with `<!DOCTYPE html>`, wraps content inside `<html lang="en">`, separates browser metadata inside `<head>`, and renders visible nodes inside `<body>`.',
            code: ['<!DOCTYPE html>', '<html lang="en">', '<head><title>App</title></head>', '<body><h1>Ready</h1></body>', '</html>'],
            highlightNote: 'Omitting `<!DOCTYPE html>` drops browsers into legacy Quirks Mode.',
          },
          {
            type: 'token_builder',
            prompt: 'Complete the valid HTML5 header and viewport setup.',
            codeLines: ['{{0}}', '<html lang="en">', '<{{1}}>', '  <title>CodeLingo</title>', '</head>', '</html>'],
            expectedTokens: ['<!DOCTYPE html>', 'head'],
            distractors: ['<HTML5>', 'header', 'meta'],
            explanation: '`<!DOCTYPE html>` starts HTML5 cleanly; `<head>` holds page metadata.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot where visible text mistakenly appears outside `<body>`.',
            lines: [
              '<!DOCTYPE html>',
              '<html lang="en">',
              '<head><p>Welcome!</p></head>',
              '<body></body>',
              '</html>',
            ],
            bugLine: 2,
            fixed: '<head><title>Welcome</title></head>',
            explanation: 'Visible elements like `<p>` belong inside `<body>`, never inside `<head>`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which `<meta>` tag ensures mobile browsers match device screen width instead of shrinking desktop pages?',
            options: [
              '<meta name="responsive" content="true">',
              '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
              '<meta charset="mobile">',
              '<meta name="screen" content="100%">',
            ],
            answer: 1,
            explanation: 'The `viewport` meta tag unlocks responsive mobile scaling.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Text, Headings & Lists',
        subtitle: 'Build clean h1-h3 hierarchies, ul/ol lists, and paragraphs',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Headings & Real List Markup',
            explanation:
              'Step headings monotonically (`<h1>` -> `<h2>` -> `<h3>`) without skipping levels. Wrap unordered lists in `<ul>` and numbered steps in `<ol>` containing only `<li>` children.',
            code: ['<h1>Curriculum</h1>', '<h2>Unit 1</h2>', '<ol><li>Read guide</li><li>Pass boss</li></ol>'],
            highlightNote: 'Need bold emphasis? Use `<strong>` for semantic importance (`<em>` for stress).',
          },
          {
            type: 'token_builder',
            prompt: 'Build a numbered 2-step checklist cleanly.',
            codeLines: ['{{0}}', '  <{{1}}>Open playground</{{1}}>', '  <li>Run code</li>', '</ol>'],
            expectedTokens: ['<ol>', 'li'],
            distractors: ['<ul>', 'item', 'p'],
            explanation: '`<ol>` produces ordered numbered steps made of `<li>` list items.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid child element placed directly inside `<ul>`.',
            lines: [
              '<ul>',
              '  <p>Languages</p>',
              '  <li>TypeScript</li>',
              '</ul>',
            ],
            bugLine: 1,
            fixed: '  <li>Languages</li>',
            explanation: 'Only `<li>` tags are valid direct children of `<ul>` or `<ol>`.',
          },
          {
            type: 'predict_output',
            prompt: 'Which element renders numbered steps `1., 2., 3.` by default?',
            code: ['<ol><li>First</li><li>Second</li></ol>'],
            options: ['<ul>', '<ol>', '<dl>'],
            answer: 1,
            explanation: '`<ol>` (ordered list) numbers items sequentially automatically.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Nesting & Void Elements',
        subtitle: 'Close tags LIFO and distinguish void vs container elements',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Balanced Tags & Void Elements',
            explanation:
              'HTML void elements (`<img src="...">`, `<meta>`, `<link>`, `<br>`, `<hr>`, `<input>`) cannot hold children so they NEVER have a `</img>` closing tag.',
            code: ['<p>See <code>main.html</code> below:</p>', '<hr>', '<input type="text" placeholder="Search">'],
            highlightNote: 'Avoid fake `<p />` self-closing on non-void tags—always write `<p></p>`.',
          },
          {
            type: 'token_builder',
            prompt: 'Close nested `<strong>` cleanly inside `<p>` and insert a horizontal divider.',
            codeLines: ['<p>Status: <strong>Online{{0}}</p>', '{{1}}'],
            expectedTokens: ['</strong>', '<hr>'],
            distractors: ['</p>', '</hr>', '<line>'],
            explanation: 'Close `</strong>` before `</p>`; `<hr>` is a void divider with no closing tag.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the invalid closing tag on a void element.',
            lines: [
              '<div class="avatar">',
              '  <img src="hero.png" alt="Hero"></img>',
              '</div>',
            ],
            bugLine: 1,
            fixed: '  <img src="hero.png" alt="Hero">',
            explanation: '`<img>` is an HTML void element and must never have `</img>`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which HTML element is NOT a void element (it MUST have a closing tag)?',
            options: ['<input>', '<meta>', '<script>', '<link>'],
            answer: 2,
            explanation: '`<script>` requires `</script>` even when `src="..."` is present!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: DOM Basics',
        subtitle: 'Verify valid structure, attributes, and script defer',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Attach a custom data attribute and defer loading `app.js` cleanly.',
            codeLines: ['<div {{0}}="unit-1"></div>', '<script {{1}} src="app.js"></script>'],
            expectedTokens: ['data-id', 'defer'],
            distractors: ['id-data', 'async-defer', 'lazy'],
            explanation: 'Custom JS hooks use `data-*`; `defer` delays script run cleanly until HTML finishes parsing.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `app.js` blocks rendering or sees empty `document.body`!',
            lines: [
              '<head>',
              '  <script src="app.js" />',
              '</head>',
            ],
            bugLine: 1,
            fixed: '  <script defer src="app.js"></script>',
            explanation: '`<script>` is not self-closing (`/>`)—always include `</script>`.',
          },
          {
            type: 'multiple_choice',
            question: 'What is the clean HTML attribute prefix for storing custom metadata read by JS (`el.dataset.*`)?',
            options: ['meta-*', 'custom-*', 'data-*', 'x-*'],
            answer: 2,
            explanation: '`data-user="42"` exposes `el.dataset.user` cleanly in standard DOM.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Inline Text & Code Semantics',
        subtitle: 'Distinguish code, pre, blockquote, time, and span',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Rich Content Tags',
            explanation:
              'Wrap inline symbols in `<code>`, multi-line indented code in `<pre><code>...</code></pre>`, dates in `<time datetime="2026-11-13">`, and reserve `<span>` strictly as a neutral inline hook.',
            code: ['<pre><code>let x = 42;</code></pre>', '<p>Updated <time datetime="2026-11-13">today</time></p>'],
            highlightNote: 'Escape literal angle brackets inside HTML code previews as `&lt;` and `&gt;`!',
          },
          {
            type: 'token_builder',
            prompt: 'Preserve whitespace around a multi-line code snippet cleanly.',
            codeLines: ['{{0}}<{{1}}>fn main() {}</code></pre>'],
            expectedTokens: ['<pre>', 'code'],
            distractors: ['<div>', 'script', 'samp'],
            explanation: '`<pre><code>` preserves indentation while marking semantic source code.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why literal `<div>` renders as an empty element instead of showing text!',
            lines: [
              '<p>Write <div> in HTML to group blocks.</p>',
            ],
            bugLine: 0,
            fixed: '<p>Write <code>&lt;div&gt;</code> in HTML to group blocks.</p>',
            explanation: 'HTML parses raw `<div>` as a tag—escape display angle brackets with `&lt;` / `&gt;`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does HTML collapse multiple spaces inside normal `<p>Hello     world</p>` down to?',
            code: ['<p>Hello     world</p>'],
            options: ['Hello     world (5 spaces)', 'Hello world (1 space)', 'Helloworld'],
            answer: 1,
            explanation: 'Normal HTML collapses runs of spaces/newlines to 1 space outside `<pre>`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: DOM Architect',
        subtitle: 'Synthesize DOCTYPE, nesting, headings, defer, and entities',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Complete the accessible HTML5 document shell.',
            codeLines: [
              '<!DOCTYPE html>',
              '<html {{0}}="en">',
              '<head>',
              '  <meta charset="UTF-8">',
              '  <script {{1}} src="main.js"></script>',
              '</head>',
              '<body><h1>CodeLingo</h1></body>',
              '</html>',
            ],
            expectedTokens: ['lang', 'defer'],
            distractors: ['language', 'async', 'load'],
            explanation: '`lang="en"` declares language cleanly; `defer` guarantees DOM readiness.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the crossed closing tags corrupting DOM hierarchy.',
            lines: [
              '<p>Master <em>HTML5</p></em> cleanly.',
            ],
            bugLine: 0,
            fixed: '<p>Master <em>HTML5</em> cleanly.</p>',
            explanation: 'Close inner `</em>` before outer `</p>`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why avoid skipping directly from `<h1>` to `<h4>` just to make a heading smaller?',
            options: [
              '<h4> cannot accept CSS styling',
              'Skipping levels breaks screen reader heading navigation; style headings with CSS instead',
              'Browsers hide <h4> without <h3>',
              'HTML5 forbids <h4>',
            ],
            answer: 1,
            explanation: 'Keep outline levels sequential cleanly (`h1 -> h2 -> h3`) for document structure.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Semantic Landmarks (5 nodes)
  // =========================================================================
  {
    title: 'Semantic Landmarks',
    subtitle: 'Replace div soup with header, nav, main, article, section, and footer.',
    conceptGraphicType: 'html_semantic',
    guidebook: {
      summary:
        'A screen reader or search crawler sees zero meaning in `<div class="top">` — but HTML5 **semantic landmarks** (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`) publish the exact architecture of your page automatically.',
      mentalModel:
        'Use landmarks like room labels on a blueprint: `<main>` marks the primary page room (one visible `<main>` per page), `<nav>` holds major navigation links, and `<article>` wraps self-contained reusable content (a blog post or product card).',
      keyTakeaways: [
        'Wrap primary page content inside one visible `<main>` element so keyboard users can skip headers straight to `<main>`.',
        'Put primary site link groups inside `<nav aria-label="Main">`—don’t wrap every tiny footer link inside `<nav>`.',
        '`<article>` = independently syndicatable unit (card/post/comment); `<section>` = thematic chapter that almost always starts with a heading (`<h2>`).',
        'Always use `<button>` for actions and `<a href="...">` for navigation—NEVER `<div onclick="...">`!',
      ],
      keySyntax: [
        {
          title: 'Clean Page Landmark Skeleton',
          tag: 'LANDMARKS',
          code: '<body>\n  <header>\n    <nav aria-label="Primary"><a href="/">Home</a></nav>\n  </header>\n  <main>\n    <article><h1>Lesson</h1></article>\n  </main>\n  <footer><p>&copy; 2026 CodeLingo</p></footer>\n</body>',
          output: 'Screen readers expose 4 landmarks: banner, navigation, main, contentinfo',
          explanation:
            'Built-in HTML5 elements expose ARIA roles automatically with zero extra JavaScript.',
          notes: [
            'Place `<header>` and `<footer>` at page level OR inside individual `<article>` cards.',
          ],
        },
        {
          title: 'Interactive Button vs Navigation Link',
          tag: 'ELEMENT CHOICE',
          code: '<!-- Navigates to URL -> use <a> -->\n<a href="/leaderboard">Leaderboard</a>\n<!-- Triggers UI action/submit -> use <button> -->\n<button type="button" id="run">Run Code</button>',
          output: 'Keyboard Enter/Space & focus tab-stops work out of the box',
          explanation:
            'Always specify `type="button"` on non-submit buttons inside forms so clicking doesn’t submit unexpectedly!',
          notes: [
            'An `<a>` without `href` loses keyboard focusability—use `<button>` whenever there is no URL.',
          ],
        },
        {
          title: 'Figure & Figcaption + Native Disclosure',
          tag: 'COMPONENTS',
          code: '<details>\n  <summary>View Hint</summary>\n  <p>Check missing semicolons cleanly.</p>\n</details>',
          output: 'Accessible collapsible hint widget with ZERO JavaScript!',
          explanation:
            'Native `<details>`/`<summary>` handles open state, ARIA expanded state, and keyboard toggling built into every browser.',
          notes: [
            'Pair images with captions cleanly via `<figure><img ...><figcaption>...</figcaption></figure>`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Fake Clickable <div onclick="..."> Buttons',
          buggyCode: '<div class="btn" onclick="submit()">Save</div>',
          fixedCode: '<button type="button" class="btn">Save</button>',
          reason:
            '`<div>` is invisible to Tab keyboard navigation, Enter/Space key presses, and screen reader button lists.',
        },
        {
          title: 'Putting <section> Inside Generic Containers Without a Heading',
          buggyCode: '<section><div class="avatar"></div></section>',
          fixedCode: '<div class="avatar"></div>',
          reason:
            'If a wrapper has no semantic theme/heading and exists solely for CSS styling, plain `<div>` is actually MORE honest than misusing `<section>`!',
        },
      ],
      proTip:
        'Give multiple `<nav>` landmarks distinct `aria-label`s (`aria-label="Primary"` vs `aria-label="Breadcrumb"`) so assistive users hear which menu they’re jumping into.',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Page Landmarks',
        subtitle: 'Structure banner, nav, main, and footer cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-Div Page Blueprint',
            explanation:
              'Replace `<div id="header">`, `<div id="main">`, `<div id="footer">` with native `<header>`, `<nav>`, `<main>`, and `<footer>` landmarks.',
            code: ['<header><nav><a href="/">CodeLingo</a></nav></header>', '<main><h1>Learn</h1></main>', '<footer><p>v1.0</p></footer>'],
            highlightNote: 'Keep strictly ONE visible `<main>` landmark per HTML page.',
          },
          {
            type: 'token_builder',
            prompt: 'Wrap primary content inside `<main>` and primary menu links inside `<nav>`.',
            codeLines: ['<header>', '  {{0}} aria-label="Main"><a href="/docs">Docs</a></nav>', '</header>', '{{1}}', '  <h1>Courses</h1>', '</main>'],
            expectedTokens: ['<nav', '<main>'],
            distractors: ['<menu', '<section>', '<article>'],
            explanation: '`<nav>` labels navigation menus; `<main>` holds the unique page body.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the duplicate visible `<main>` violation.',
            lines: [
              '<main><p>Hero</p></main>',
              '<main><p>Cards</p></main>',
            ],
            bugLine: 1,
            fixed: '<section aria-label="Cards"><p>Cards</p></section>',
            explanation: 'A page must only contain ONE visible `<main>` landmark—split sub-blocks into `<section>`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which HTML5 tag best represents a self-contained blog post, forum comment, or feed card?',
            options: ['<aside>', '<article>', '<nav>', '<footer>'],
            answer: 1,
            explanation: '`<article>` wraps complete, self-contained content that makes sense on its own.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Button vs Link Discipline',
        subtitle: 'Eliminate div-soup click handlers cleanly',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Action = <button>, URL = <a href>',
            explanation:
              'Never fake interactive controls with `<div onclick>` or `<a href="#">`! Use `<a href="/path">` to go somewhere, and `<button type="button">` to do something.',
            code: ['<a href="/profile">View Profile</a>', '<button type="button">Run Query</button>'],
            highlightNote: 'Default button `type` inside `<form>` is `"submit"`—always set `type="button"` on non-submit buttons!',
          },
          {
            type: 'token_builder',
            prompt: 'Create a non-submitting toolbar action button and a navigation link.',
            codeLines: ['<button {{0}}="button">Format</button>', '<a {{1}}="/practice">Practice</a>'],
            expectedTokens: ['type', 'href'],
            distractors: ['role', 'src', 'link'],
            explanation: '`type="button"` stops unwanted form submits; `href` activates link keyboard focus.',
          },
          {
            type: 'find_bug',
            prompt: 'Replace the keyboard-inaccessible clickable `<div>` card button!',
            lines: [
              '<div class="run-btn" onclick="run()">Run Code</div>',
            ],
            bugLine: 0,
            fixed: '<button type="button" class="run-btn">Run Code</button>',
            explanation: 'Clickable `<div>`s aren’t reachable by Tab key or Enter/Space natively.',
          },
          {
            type: 'multiple_choice',
            question: 'What does a `<button>` WITHOUT a `type` attribute default to inside `<form>`?',
            options: ['type="button"', 'type="reset"', 'type="submit"', 'type="none"'],
            answer: 2,
            explanation: 'Bare `<button>` defaults to `type="submit"`, triggering form submission unexpectedly!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Semantics',
        subtitle: 'Verify aside, details/summary, and figure pairings',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Create a zero-JS collapsible hint drawer with native HTML.',
            codeLines: ['{{0}}', '  <{{1}}>Show Answer Hint</summary>', '  <p>Check bracket matching.</p>', '</details>'],
            expectedTokens: ['<details>', 'summary'],
            distractors: ['<accordion>', 'legend', 'caption'],
            explanation: '`<details>` + `<summary>` ships native keyboard toggling built into HTML.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the `<a>` tag misusing no `href` for a button action.',
            lines: [
              '<a onclick="toggleModal()">Open Settings</a>',
            ],
            bugLine: 0,
            fixed: '<button type="button">Open Settings</button>',
            explanation: 'Without `href`, `<a>` drops out of keyboard Tab order—use `<button>`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which tag pairs an image or diagram cleanly with an explanatory caption?',
            options: ['<div> + <span>', '<figure> + <figcaption>', '<section> + <label>', '<aside> + <title>'],
            answer: 1,
            explanation: '`<figure>` binds media and its `<figcaption>` semantically.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Section vs Div & Sidebar Aside',
        subtitle: 'Choose honest elements cleanly without over-tagging',
        exercises: [
          {
            type: 'theory_bite',
            title: 'When Plain <div> Is Actually Right',
            explanation:
              'Use `<aside>` for tangential sidebars/callouts and `<section>` for distinct thematic groups WITH a heading (`<h2>`). When wrapping purely for CSS flexbox/grid layout, plain `<div>` is completely clean.',
            code: ['<main>', '  <section><h2>Units</h2>...</section>', '  <aside><h3>Quick Tip</h3>...</aside>', '</main>'],
            highlightNote: 'Don’t turn every CSS layout wrapper into a meaningless `<section>`!',
          },
          {
            type: 'token_builder',
            prompt: 'Place a related pro-tip callout inside `<aside>` inside `<main>`.',
            codeLines: ['<section>', '  <h2>Pointers</h2>', '  {{0}}<h4>Memory Note</h4><p>Always free once.</p></{{1}}>', '</section>'],
            expectedTokens: ['<aside>', 'aside'],
            distractors: ['<sidebar>', 'div', 'article'],
            explanation: '`<aside>` marks tangentially related notes cleanly inside a section or page.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the unsemantic abuse of `<nav>` around a plain copyright notice.',
            lines: [
              '<footer>',
              '  <nav><p>&copy; 2026 CodeLingo Inc.</p></nav>',
              '</footer>',
            ],
            bugLine: 1,
            fixed: '  <p>&copy; 2026 CodeLingo Inc.</p>',
            explanation: 'Reserve `<nav>` strictly for groups of major navigation links, never plain text.',
          },
          {
            type: 'multiple_choice',
            question: 'Should you use `<div>` ONLY for CSS grouping with zero semantic meaning?',
            options: [
              'No, replace every single div with section',
              'Yes! Using div for pure CSS layout wrappers avoids polluting landmark trees',
              'div is deprecated in HTML5',
              'Only inside <footer>',
            ],
            answer: 1,
            explanation: 'Plain `<div>` is ideal whenever an element exists strictly for CSS layout.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Semantic Architect',
        subtitle: 'Master landmarks, native controls, details, and clean trees',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build an accessible card featuring a native `<article>`, link, and button.',
            codeLines: [
              '<{{0}} class="lesson-card">',
              '  <h2>HTML Semantics</h2>',
              '  <a href="/guide">Guidebook</a>',
              '  <button {{1}}="button">Start</button>',
              '</article>',
            ],
            expectedTokens: ['article', 'type'],
            distractors: ['aside', 'role', 'href'],
            explanation: '`<article>` scopes standalone cards while `<a>` + `<button type="button">` separate routes vs actions.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why placing a `<nav>` button inside an `<a>` breaks valid HTML!',
            lines: [
              '<a href="/lessons">',
              '  <button type="button">Continue</button>',
              '</a>',
            ],
            bugLine: 1,
            fixed: '<a href="/lessons" class="btn">Continue</a>',
            explanation: 'Never nest interactive controls (`<button>` inside `<a>`)—style `<a class="btn">` cleanly!',
          },
          {
            type: 'predict_output',
            prompt: 'How many `<main>` tags should be visible simultaneously on one HTML page?',
            code: ['<!-- How many visible <main> landmarks? -->'],
            options: ['Zero', 'One', 'One per card'],
            answer: 1,
            explanation: 'Keep exactly ONE visible `<main>` landmark as the jump target for page content.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: Links, Media & Tables (5 nodes)
  // =========================================================================
  {
    title: 'Links, Media & Tables',
    subtitle: 'Secure external links, ship responsive images with alt/dimensions, and structure data tables.',
    conceptGraphicType: 'html_media',
    guidebook: {
      summary:
        'Media and links connect the web, while `<table>` renders true tabular grid data. Modern HTML pairs `<img>` with mandatory `alt` descriptions, explicit `width`/`height` to kill layout shift (CLS), and clean table headers (`<thead>`, `<th scope="col">`).',
      mentalModel:
        'Treat `width` and `height` attributes on `<img>` like **aspect-ratio reservations**: even with responsive CSS `width: 100%; height: auto;`, those HTML integers reserve vertical box space BEFORE pixels download so text never jumps!',
      keyTakeaways: [
        'Write descriptive `alt="..."` on meaningful images, and empty `alt=""` (NOT missing `alt`!) on purely decorative icons so screen readers skip them cleanly.',
        'Include `width`, `height`, and `loading="lazy"` on below-the-fold images for instant loading with zero layout shift.',
        'External `target="_blank"` links in older specs needed `rel="noopener noreferrer"` (now good practice everywhere for security/privacy).',
        'Never use `<table>` for page layout—reserve `<table>` (`<thead>`, `<tbody>`, `<th scope="col">`) strictly for 2D data.',
      ],
      keySyntax: [
        {
          title: 'Zero-CLS Lazy Image + Decorative Alt',
          tag: 'MEDIA',
          code: '<img src="/banner.webp" alt="CodeLingo IDE preview" width="800" height="450" loading="lazy">\n<img src="/sparkle.svg" alt="" aria-hidden="true">',
          output: 'Reserves exact 16:9 ratio before network load completes',
          explanation:
            'Setting `width` + `height` stops page jumping cleanly, while `alt=""` silences screen readers on decorative assets.',
          notes: [
            'Use `<picture><source media="(min-width: 800px)" srcset="wide.webp"><img ...></picture>` for art-directed responsive images.',
          ],
        },
        {
          title: 'Safe External Links & Anchors',
          tag: 'LINKS',
          code: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Docs</a>\n<a href="#unit-3">Jump to Unit 3</a>',
          output: 'Opens safely in new tab without exposing window.opener',
          explanation:
            '`rel="noopener noreferrer"` closes legacy `window.opener` tabnabbing risks on `_blank` tabs.',
          notes: [
            'Use `download="notes.pdf"` on `<a>` to prompt saving a local file rather than navigating.',
          ],
        },
        {
          title: 'Accessible Data Table with Scope',
          tag: 'TABLES',
          code: '<table>\n  <caption>Leaderboard</caption>\n  <thead><tr><th scope="col">Handle</th><th scope="col">XP</th></tr></thead>\n  <tbody><tr><td>yuna_ts</td><td>1710</td></tr></tbody>\n</table>',
          output: 'Associates every XP cell directly with column header `XP`',
          explanation:
            '`<th scope="col">` lets assistive software read column headers alongside every row cell cleanly.',
          notes: [
            'Use `<tbody>` and `<caption>` cleanly—never place header text inside plain `<td>` cells!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Omitting alt Entirely on Decorative Images',
          buggyCode: '<img src="/divider.svg">',
          fixedCode: '<img src="/divider.svg" alt="">',
          reason:
            'When `alt` is omitted completely, screen readers often read aloud the raw filename (`"divider dot s v g"`)! Empty `alt=""` hides it cleanly.',
        },
        {
          title: 'Plain <td> Cells Used as Table Headers',
          buggyCode: '<thead><tr><td>Lang</td><td>Units</td></tr></thead>',
          fixedCode: '<thead><tr><th scope="col">Lang</th><th scope="col">Units</th></tr></thead>',
          reason:
            'Always wrap header labels in `<th scope="col">` (or `scope="row"`) rather than `<td>`.',
        },
      ],
      proTip:
        'Keep hero above-the-fold images eager (`loading="eager"`, `fetchpriority="high"`) and put `loading="lazy"` strictly on images lower down the page so your Largest Contentful Paint stays snappy!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Responsive Images & Alt',
        subtitle: 'Prevent layout shift and write meaningful vs empty alt text',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Fast, Accessible Images',
            explanation:
              'Every `<img>` needs an `alt` attribute: describe info images cleanly (`alt="Red heart badge"`), or set empty `alt=""` on purely decorative art. Include `width` & `height` to stop Cumulative Layout Shift.',
            code: ['<img src="logo.png" alt="Rust gear logo" width="64" height="64">', '<img src="glow.svg" alt="">'],
            highlightNote: 'Defer off-screen images cleanly using `loading="lazy"`.',
          },
          {
            type: 'token_builder',
            prompt: 'Embed a lazy below-the-fold photo with accessible text & ratio sizing.',
            codeLines: ['<img src="ide.webp" {{0}}="Code editor" width="640" height="360" {{1}}="lazy">'],
            expectedTokens: ['alt', 'loading'],
            distractors: ['title', 'defer', 'lazy-load'],
            explanation: '`alt` provides screen-reader text while `loading="lazy"` defers network fetches.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why screen readers read the raw SVG URL on this decorative icon!',
            lines: [
              '<button type="button">',
              '  <img src="/assets/tiny_star_v2.svg">',
              '  Favorite',
              '</button>',
            ],
            bugLine: 1,
            fixed: '  <img src="/assets/tiny_star_v2.svg" alt="">',
            explanation: 'Decorative images paired with visible labels need empty `alt=""` so readers skip redundant filenames.',
          },
          {
            type: 'multiple_choice',
            question: 'Why add HTML `width` and `height` on `<img>` even when CSS sets `width: 100%; height: auto;`?',
            options: [
              'It disables CSS resizing',
              'Browsers compute the exact aspect ratio immediately to avoid page jumps while loading',
              'It forces low resolution downloads',
              'It adds a shadow border',
            ],
            answer: 1,
            explanation: 'HTML `width`/`height` let CSS reserve exact aspect ratio before pixels arrive.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Links, Security & Anchors',
        subtitle: 'Configure internal anchors, mail/tel schemes, and external tabs safely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Safe External Links & Anchors',
            explanation:
              'Link to same-page IDs with `href="#section"`, external sites with `target="_blank" rel="noopener noreferrer"`, and meaningful link text (`"Read SQL Guide"`—never `"Click here"`).',
            code: ['<a href="https://sqlite.org" target="_blank" rel="noopener noreferrer">SQLite Docs</a>'],
            highlightNote: 'Write descriptive link labels because screen readers often browse a standalone list of links!',
          },
          {
            type: 'token_builder',
            prompt: 'Open external Rust docs safely in a new browser tab.',
            codeLines: ['<a href="https://doc.rust-lang.org" {{0}}="_blank" {{1}}="noopener noreferrer">Rust Book</a>'],
            expectedTokens: ['target', 'rel'],
            distractors: ['open', 'security', 'type'],
            explanation: '`target="_blank"` + `rel="noopener noreferrer"` protects opened tabs cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Fix the uninformative link label failing accessibility audits.',
            lines: [
              '<p>Read unit rules <a href="/guide">click here</a>.</p>',
            ],
            bugLine: 0,
            fixed: '<p>Read the <a href="/guide">Unit Guidebook rules</a>.</p>',
            explanation: 'Descriptive links like `"Unit Guidebook rules"` tell assistive users where the link goes.',
          },
          {
            type: 'predict_output',
            prompt: 'Where does `<a href="#summary">` scroll when clicked cleanly?',
            code: ['<h2 id="summary">Summary</h2>', '<a href="#summary">Jump</a>'],
            options: ['Reloads homepage', 'Scrolls smoothly to element with id="summary"', 'Opens new tab'],
            answer: 1,
            explanation: 'Hash URLs (`#id`) jump straight to the matching element ID on the same page.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Media',
        subtitle: 'Check alt rules, srcset/picture, and link targets',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Serve crisp retina resolution images using `srcset` density descriptors.',
            codeLines: ['<img src="badge.png" {{0}}="badge.png 1x, badge@2x.png 2x" {{1}}="Streak badge">'],
            expectedTokens: ['srcset', 'alt'],
            distractors: ['sources', 'title', 'data-src'],
            explanation: '`srcset` lets HiDPI screens fetch `@2x` cleanly while 1x screens save bandwidth.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `loading="lazy"` slows down the main hero banner at the top of the page!',
            lines: [
              '<section class="hero">',
              '  <img src="hero.webp" alt="Banner" loading="lazy">',
              '</section>',
            ],
            bugLine: 1,
            fixed: '  <img src="hero.webp" alt="Banner" fetchpriority="high">',
            explanation: 'Never lazy-load above-the-fold hero images; keep them eager with `fetchpriority="high"`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which HTML element wraps multiple `<source>` tags to switch image crops cleanly at screen breakpoints?',
            options: ['<gallery>', '<picture>', '<media>', '<figure>'],
            answer: 1,
            explanation: '`<picture>` picks the first matching `<source media="...">`, falling back to inner `<img>`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Data Tables with Scope',
        subtitle: 'Structure real tabular data cleanly with caption, thead, and th',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Accessible Data Tables',
            explanation:
              'Organize tabular data with `<caption>`, `<thead>`, `<tbody>`, header cells `<th scope="col">`, and data cells `<td>`.',
            code: ['<table>', '  <thead><tr><th scope="col">Track</th><th scope="col">Units</th></tr></thead>', '  <tbody><tr><td>SQL</td><td>5</td></tr></tbody>', '</table>'],
            highlightNote: 'Use `scope="row"` when the first column labels an entire horizontal row.',
          },
          {
            type: 'token_builder',
            prompt: 'Define proper column headers inside `<thead>` cleanly.',
            codeLines: ['<table>', '  {{0}}', '    <tr><th {{1}}="col">Language</th><th scope="col">XP</th></tr>', '  </thead>', '</table>'],
            expectedTokens: ['<thead>', 'scope'],
            distractors: ['<header>', 'axis', 'role'],
            explanation: '`<thead>` separates header rows while `scope="col"` binds cells cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot header cells disguised as regular `<td>` cells.',
            lines: [
              '<thead>',
              '  <tr><td>Username</td><td>Streak</td></tr>',
              '</thead>',
            ],
            bugLine: 1,
            fixed: '  <tr><th scope="col">Username</th><th scope="col">Streak</th></tr>',
            explanation: 'Column titles belong inside `<th scope="col">` elements, never plain `<td>`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which tag adds an accessible title heading directly describing a `<table>`?',
            options: ['<thead>', '<caption>', '<summary>', '<legend>'],
            answer: 1,
            explanation: '`<caption>` must sit as the first child of `<table>` to title the dataset cleanly.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Media & Tables Pro',
        subtitle: 'Master images, secure links, and accessible data tables',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Build an accessible table row + safe external docs link.',
            codeLines: [
              '<table>',
              '  <caption>Tracks</caption>',
              '  <thead><tr><th {{0}}="col">Name</th><th scope="col">Docs</th></tr></thead>',
              '  <tbody><tr><td>C#</td><td><a href="https://learn.microsoft.com" target="_blank" {{1}}="noopener noreferrer">Ref</a></td></tr></tbody>',
              '</table>',
            ],
            expectedTokens: ['scope', 'rel'],
            distractors: ['col', 'href', 'type'],
            explanation: '`scope="col"` + `rel="noopener noreferrer"` cover accessibility and link hygiene.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `<table>` layout below should NEVER be used for non-tabular UI.',
            lines: [
              '<img src="chart.png" width="400" height="200">',
            ],
            bugLine: 0,
            fixed: '<img src="chart.png" alt="Weekly XP growth chart" width="400" height="200">',
            explanation: 'Non-decorative data images like charts must carry an explicit `alt` description.',
          },
          {
            type: 'predict_output',
            prompt: 'If `<img>` lacks `alt` completely (`<img src="x.png">`), how might screen readers treat it?',
            code: ['<img src="user_avatar_84.png">'],
            options: [
              'Silently skip it automatically',
              'Read the noisy raw image filename aloud',
              'Block image download',
            ],
            answer: 1,
            explanation: 'Missing `alt` exposes filenames; intentional `alt=""` cleanly silences decorative assets.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Forms & Validation (5 nodes)
  // =========================================================================
  {
    title: 'Forms & Native Validation',
    subtitle: 'Bind labels, pick mobile keyboards via input types, and validate inputs natively.',
    conceptGraphicType: 'html_forms',
    guidebook: {
      summary:
        'HTML forms collect user input natively with built-in accessibility, mobile keyboard switching (`type="email"`, `type="number"`), and client validation (`required`, `minlength`, `pattern`)—without writing custom JS widgets.',
      mentalModel:
        'A form input without a linked `<label for="...">` is **unlabeled mystery space**. Matching `label[for]` with `input[id]` enlarges the click/tap target onto the text AND announces the field name on focus!',
      keyTakeaways: [
        'Always link `<label for="email">` to `<input id="email" name="email">`—never swap `placeholder` for `<label>`.',
        'Pick semantic input `type`s (`email`, `url`, `tel`, `number`, `password`, `search`) so iOS/Android automatically display matching keyboards.',
        'Include `name="..."` on every control so `<form>` actually submits or exposes fields via `FormData`.',
        'Group radio buttons or checkboxes cleanly inside `<fieldset><legend>...</legend>...</fieldset>`.',
      ],
      keySyntax: [
        {
          title: 'Accessible Labeled Form Field',
          tag: 'LABELS + FORM',
          code: '<form action="/signup" method="post">\n  <label for="handle">Handle</label>\n  <input id="handle" name="handle" type="text" required minlength="3" autocomplete="username">\n  <button type="submit">Join</button>\n</form>',
          output: 'Tapping "Handle" focuses input; browser validates length >= 3 cleanly',
          explanation:
            'Matching `for="handle"` and `id="handle"` binds label & control while `autocomplete` accelerates autofill.',
          notes: [
            'Placeholders disappear the moment a user types—keep persistent labels visible!',
          ],
        },
        {
          title: 'Grouped Radio Buttons via Fieldset',
          tag: 'RADIO GROUP',
          code: '<fieldset>\n  <legend>Experience Level</legend>\n  <label><input type="radio" name="tier" value="new" checked> Beginner</label>\n  <label><input type="radio" name="tier" value="pro"> Pro</label>\n</fieldset>',
          output: 'Mutually exclusive choices under one shared `name="tier"`',
          explanation:
            'Sharing identical `name="tier"` makes radios mutually exclusive automatically; `<legend>` reads out the group prompt.',
          notes: [
            'Nesting `<input>` inside `<label>...</label>` also links them cleanly without an explicit `for`/`id`!',
          ],
        },
        {
          title: 'Select Dropdowns & Textareas',
          tag: 'CONTROLS',
          code: '<label for="lang">Track</label>\n<select id="lang" name="lang">\n  <option value="ts">TypeScript</option>\n  <option value="sql">SQL</option>\n</select>',
          output: 'Native accessible picker menu',
          explanation:
            'Native `<select>` gets mobile wheel pickers, keyboard arrows, and escape-to-close completely free.',
          notes: [
            'Use `<textarea name="bio" rows="4"></textarea>` cleanly—never write `<input type="textarea">`.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Using placeholder Instead of <label>',
          buggyCode: '<input type="email" placeholder="Email Address">',
          fixedCode: '<label for="email">Email Address</label>\n<input id="email" name="email" type="email">',
          reason:
            'Placeholders vanish when typing starts and aren’t treated as reliable accessible labels.',
        },
        {
          title: 'Forgetting the name Attribute on Inputs',
          buggyCode: '<input id="xp" type="number" value="100">',
          fixedCode: '<input id="xp" name="xp" type="number" value="100">',
          reason:
            'Without `name="..."`, browsers omit the field completely when submitting `<form>` or building `new FormData(form)`!',
        },
      ],
      proTip:
        'Use `inputmode="numeric"` cleanly on OTP verification codes or credit card digits instead of `type="number"`, because `type="number"` renders annoying up/down stepper arrows and strips leading zeros like `"042"`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Labels, Inputs & Name',
        subtitle: 'Pair for/id labels cleanly and choose semantic input types',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Every Input Deserves a Real Label',
            explanation:
              'Link `<label for="x">` directly to `<input id="x" name="x">` so clicking the caption focuses the field, and pick matching `type` (`email`, `password`, `url`) for smart keyboards.',
            code: ['<label for="user-email">Email</label>', '<input id="user-email" name="email" type="email" required>'],
            highlightNote: '`name="..."` determines the key sent in `FormData`!',
          },
          {
            type: 'token_builder',
            prompt: 'Bind label `for="pw"` to a required password input cleanly.',
            codeLines: ['<label {{0}}="pw">Password</label>', '<input {{1}}="pw" name="password" type="password" required>'],
            expectedTokens: ['for', 'id'],
            distractors: ['name', 'class', 'bind'],
            explanation: '`label[for]` always links cleanly to matching `input[id]`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `FormData(form)` submits ZERO value for this input!',
            lines: [
              '<label for="city">City</label>',
              '<input id="city" type="text">',
            ],
            bugLine: 1,
            fixed: '<input id="city" name="city" type="text">',
            explanation: '`id` hooks CSS & `<label>`, while `name="..."` actually includes the field in form submissions!',
          },
          {
            type: 'multiple_choice',
            question: 'Which `<input>` setup triggers a mobile digit pad WITHOUT stripping leading zeros (like ZIP `"02139"`)?',
            options: [
              'type="number"',
              'type="text" inputmode="numeric"',
              'type="integer"',
              'type="decimal"',
            ],
            answer: 1,
            explanation: '`inputmode="numeric"` keeps leading zeros cleanly while opening the number pad.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Native Validation Rules',
        subtitle: 'Enforce required, minlength, max, and pattern declaratively',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Zero-JS Client Validation',
            explanation:
              'Browser attributes (`required`, `minlength`, `maxlength`, `min`, `max`, `pattern`) block bad submits natively—always remember to ALSO validate on your server!',
            code: ['<input name="handle" required minlength="3" pattern="[a-z0-9_]+">'],
            highlightNote: 'Style invalid touched inputs smoothly in CSS via `:user-invalid`.',
          },
          {
            type: 'token_builder',
            prompt: 'Require `age` to stay strictly between `13` and `120`.',
            codeLines: ['<input name="age" type="number" {{0}} min="13" {{1}}="120">'],
            expectedTokens: ['required', 'max'],
            distractors: ['mandatory', 'ceiling', 'pattern'],
            explanation: '`required` forbids empty values while `min`/`max` clamp numeric ranges.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the broken HTML multi-line text tag.',
            lines: [
              '<label for="bio">Bio</label>',
              '<input id="bio" name="bio" type="textarea">',
            ],
            bugLine: 1,
            fixed: '<textarea id="bio" name="bio" rows="3"></textarea>',
            explanation: 'There is no `type="textarea"`—multi-line inputs use `<textarea>...</textarea>`.',
          },
          {
            type: 'predict_output',
            prompt: 'Does `<input type="text" required pattern="[A-Z]{3}">` accept `"ts1"`?',
            code: ['<input type="text" required pattern="[A-Z]{3}">'],
            options: ['Yes', 'No, fails uppercase 3-letter regex check', 'Truncates to TS1'],
            answer: 1,
            explanation: '`pattern` anchors the whole string to 3 uppercase letters `A-Z`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Forms',
        subtitle: 'Verify fieldset groups, radios, and autofill hints',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Group two mutually exclusive radio choices under a clear legend.',
            codeLines: ['<fieldset>', '  <{{0}}>Goal</legend>', '  <label><input type="radio" {{1}}="goal" value="casual"> 5m/day</label>', '  <label><input type="radio" name="goal" value="pro"> 20m/day</label>', '</fieldset>'],
            expectedTokens: ['legend', 'name'],
            distractors: ['caption', 'id', 'group'],
            explanation: '`<legend>` labels `<fieldset>`, and matching `name` connects radio options.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why clicking Radio B fails to uncheck Radio A!',
            lines: [
              '<input type="radio" name="plan_a" value="free"> Free',
              '<input type="radio" name="plan_b" value="pro"> Pro',
            ],
            bugLine: 1,
            fixed: '<input type="radio" name="plan" value="pro"> Pro',
            explanation: 'Radios belong to the same mutual group ONLY when they share identical `name="..."`.',
          },
          {
            type: 'multiple_choice',
            question: 'Why avoid deleting visible `<label>` tags even when `placeholder` describes the box?',
            options: [
              'Placeholders break HTML5 forms',
              'Placeholders disappear on typing and confuse screen readers / memory',
              'Inputs refuse focus without placeholder',
              'CSS cannot style placeholders',
            ],
            answer: 1,
            explanation: 'Persistent `<label>` stays legible before, during, and after typing.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Select, Datalist & Submit',
        subtitle: 'Offer clean dropdowns, suggestions, and method="post"',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Choosing GET vs POST & Native Selects',
            explanation:
              'Use `method="get"` for harmless bookmarkable search filters (`?q=rust`), and `method="post"` for login/writes so secrets NEVER leak in browser URLs!',
            code: ['<form action="/search" method="get">', '  <input name="q" type="search" aria-label="Search lessons">', '</form>'],
            highlightNote: 'Offer searchable autocomplete hints natively using `<input list="langs">` + `<datalist id="langs">`!',
          },
          {
            type: 'token_builder',
            prompt: 'Submit login credentials safely via POST with proper autocomplete.',
            codeLines: ['<form action="/login" {{0}}="post">', '  <label for="e">Email</label>', '  <input id="e" name="email" type="email" {{1}}="email" required>', '</form>'],
            expectedTokens: ['method', 'autocomplete'],
            distractors: ['mode', 'autofill', 'send'],
            explanation: '`method="post"` keeps data out of URLs; `autocomplete="email"` enables password managers.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the huge security mistake leaking passwords in URL query strings!',
            lines: [
              '<form action="/signin" method="get">',
              '  <input name="password" type="password" required>',
              '</form>',
            ],
            bugLine: 0,
            fixed: '<form action="/signin" method="post">',
            explanation: 'GET forms serialize every field cleanly into URLs/logs (`?password=...`); logins ALWAYS use `post`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which `<form>` attribute blocks native browser popup tooltips only when you handle custom inline JS validation?',
            options: ['disablevalidation', 'novalidate', 'raw="true"', 'custom-errors'],
            answer: 1,
            explanation: 'Adding `novalidate` on `<form>` lets custom JS run cleanly while keeping `required`/`min` semantics intact.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Forms Engineer',
        subtitle: 'Synthesize labels, fieldsets, validation, and secure methods',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Wire an accessible language picker dropdown inside a POST form.',
            codeLines: [
              '<form action="/prefs" method="post">',
              '  <label {{0}}="track">Favorite Track</label>',
              '  <{{1}} id="track" name="track" required>',
              '    <option value="swift">Swift</option>',
              '    <option value="kotlin">Kotlin</option>',
              '  </select>',
              '</form>',
            ],
            expectedTokens: ['for', 'select'],
            distractors: ['id', 'dropdown', 'datalist'],
            explanation: '`for="track"` pairs label & `<select id="track" name="track">`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why screen readers fail to link this `<label>` cleanly!',
            lines: [
              '<label for="username">Username</label>',
              '<input id="user" name="username" type="text">',
            ],
            bugLine: 1,
            fixed: '<input id="username" name="username" type="text">',
            explanation: '`label[for]` always matches the target element’s `id`, NOT its `name`!',
          },
          {
            type: 'predict_output',
            prompt: 'What URL runs on submit of `<form action="/find" method="get"><input name="lang" value="lua"></form>`?',
            code: ['<form action="/find" method="get">', '  <input name="lang" value="lua">', '</form>'],
            options: ['/find (body)', '/find?lang=lua', '/find/lua'],
            answer: 1,
            explanation: 'GET requests encode form pairs directly into the URL query string `?lang=lua`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Accessibility & Metadata (5 nodes)
  // =========================================================================
  {
    title: 'Accessibility & Metadata',
    subtitle: 'Build inclusive UIs with ARIA, focus management, live regions, and clean <head> meta.',
    conceptGraphicType: 'html_a11y',
    guidebook: {
      summary:
        '**Web Accessibility (a11y)** makes pages usable with keyboards, screen readers, zoom, and high contrast. First Rule of ARIA: **use native HTML elements whenever they exist** (`<button>`, `<nav>`, `<dialog>`); add ARIA strictly for custom dynamic state.',
      mentalModel:
        'HTML exposes an **Accessibility Tree** (Role + Name + State) directly beside visual CSS. Missing `aria-label` on icon-only buttons leaves buttons literally named `"button"` with zero description!',
      keyTakeaways: [
        'Icon-only buttons (`<button><svg>...</svg></button>`) MUST carry `aria-label="Close modal"` AND `aria-hidden="true"` on the decorative icon.',
        'Announce dynamic toasts/status updates cleanly via `aria-live="polite"` (`role="status"`).',
        'Toggle state explicitly on custom tabs/accordions with `aria-expanded="false"` / `aria-selected="true"`.',
        'NEVER write `tabindex > 0` (`tabindex="5"`) and NEVER disable focus outlines without replacing them with `:focus-visible`!',
      ],
      keySyntax: [
        {
          title: 'Icon-Only Button & Live Status Toast',
          tag: 'ARIA ESSENTIALS',
          code: '<button type="button" aria-label="Close modal">\n  <svg aria-hidden="true">...</svg>\n</button>\n<div role="status" aria-live="polite">Saved cleanly!</div>',
          output: 'Announces "Close modal, button" and speaks updates politely',
          explanation:
            '`aria-label` names icon buttons cleanly without changing visual UI, while `aria-live="polite"` announces changes when the user finishes listening.',
          notes: [
            'Use `aria-live="assertive"` (`role="alert"`) ONLY for urgent validation or error interruptions.',
          ],
        },
        {
          title: 'Native <dialog> Modal + Focus Skip Link',
          tag: 'DIALOG & SKIP',
          code: '<a class="skip-link" href="#main">Skip to content</a>\n<dialog id="guide" aria-labelledby="guide-title">\n  <h2 id="guide-title">Unit 1 Guide</h2>\n</dialog>',
          output: 'Built-in Escape-to-close, backdrop, and focus containment',
          explanation:
            '`aria-labelledby` points a region/dialog directly at its visible heading ID (`guide-title`).',
          notes: [
            'Native `dialog.showModal()` handles top-layer stacking and Esc closing automatically.',
          ],
        },
        {
          title: 'Open Graph & SEO Head Tags',
          tag: 'METADATA',
          code: '<meta name="description" content="Interactive coding micro-lessons.">\n<meta property="og:title" content="CodeLingo">\n<link rel="canonical" href="https://codelingo.app/">',
          output: 'Crisp link preview cards & search snippets',
          explanation:
            '`<meta name="description">` and `og:*` Open Graph tags craft rich share previews in chat/social feeds.',
          notes: [
            'Avoid positive `tabindex="1"`—only use `tabindex="0"` (make focusable) or `tabindex="-1"` (programmatic JS focus only).',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Icon Button Missing Accessible Name',
          buggyCode: '<button type="button"><svg>...</svg></button>',
          fixedCode: '<button type="button" aria-label="Settings"><svg aria-hidden="true">...</svg></button>',
          reason:
            'Without text or `aria-label`, assistive tools announce a silent mysterious `"button"`.',
        },
        {
          title: 'Putting Positive tabindex="2" Hacks Into HTML',
          buggyCode: '<input tabindex="2"><button tabindex="1">Send</button>',
          fixedCode: '<button>Send</button><input>',
          reason:
            'Positive `tabindex` hijacks natural reading order; fix HTML source order cleanly instead!',
        },
      ],
      proTip:
        'Test every UI feature with just your **Tab**, **Shift+Tab**, **Enter**, **Space**, and **Escape** keys for 30 seconds before shipping—you’ll immediately spot trapped modals, invisible focus states, and unlabelled icon controls!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'First Rule of ARIA',
        subtitle: 'Name icon buttons and announce live updates politely',
        exercises: [
          {
            type: 'theory_bite',
            title: 'No ARIA Is Better Than Bad ARIA',
            explanation:
              'Prefer native `<button>`, `<a href>`, `<select>` first. Add `aria-label` on icon-only controls, `aria-hidden="true"` on decorative icons, and `aria-live="polite"` on status toasts.',
            code: ['<button type="button" aria-label="Mute sound">', '  <svg aria-hidden="true">...</svg>', '</button>'],
            highlightNote: 'Never put `aria-hidden="true"` on anything focusable!',
          },
          {
            type: 'token_builder',
            prompt: 'Label a close button cleanly and hide its decorative icon SVG.',
            codeLines: ['<button type="button" {{0}}="Close">', '  <svg {{1}}="true"></svg>', '</button>'],
            expectedTokens: ['aria-label', 'aria-hidden'],
            distractors: ['title', 'hidden', 'alt'],
            explanation: '`aria-label` names the button cleanly while `aria-hidden="true"` hides SVG noise.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `aria-hidden="true"` breaks this focusable button completely!',
            lines: [
              '<button type="button" aria-hidden="true" aria-label="Help">?</button>',
            ],
            bugLine: 0,
            fixed: '<button type="button" aria-label="Help">?</button>',
            explanation: 'Putting `aria-hidden="true"` on a focusable element hides it from screen readers while Tab still lands on it!',
          },
          {
            type: 'multiple_choice',
            question: 'Which `aria-live` mode politely reads a "Progress Saved" toast without cutting off active speech?',
            options: ['aria-live="off"', 'aria-live="polite"', 'aria-live="assertive"', 'aria-live="silent"'],
            answer: 1,
            explanation: '`polite` waits for a quiet pause before speaking background updates.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Focus Order & Dialogs',
        subtitle: 'Manage tabindex safely and leverage native <dialog>',
        exercises: [
          {
            type: 'theory_bite',
            title: 'tabindex Discipline & Native <dialog>',
            explanation:
              'Natural DOM order should drive Tab flow (`tabindex="0"` for custom widgets, `tabindex="-1"` for programmatic focus targets like headings). Native `<dialog>` brings backdrop + Esc handling built-in.',
            code: ['<dialog open aria-labelledby="dlg-h">', '  <h2 id="dlg-h">Confirm Reset</h2>', '</dialog>'],
            highlightNote: 'Never write positive `tabindex="1"`, `2`, `3`—reorder DOM HTML instead!',
          },
          {
            type: 'token_builder',
            prompt: 'Make a modal heading programmatically focusable without entering normal Tab flow.',
            codeLines: ['<dialog open {{0}}="modal-title">', '  <h2 id="modal-title" {{1}}="-1">Results</h2>', '</dialog>'],
            expectedTokens: ['aria-labelledby', 'tabindex'],
            distractors: ['aria-label', 'autofocus', 'order'],
            explanation: '`aria-labelledby` binds the dialog title; `tabindex="-1"` enables `el.focus()` without adding a Tab stop.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the anti-pattern scrambing keyboard Tab order across the page.',
            lines: [
              '<button type="button" tabindex="3">Save</button>',
              '<input type="text" tabindex="1">',
            ],
            bugLine: 0,
            fixed: '<input type="text">\n<button type="button">Save</button>',
            explanation: 'Positive `tabindex` breaks natural reading flow—order the DOM elements cleanly.',
          },
          {
            type: 'multiple_choice',
            question: 'Why does `<a href="#main-content">Skip to main content</a>` sit at the very top of `<body>`?',
            options: [
              'To refresh stylesheets',
              'Lets keyboard users jump straight past long navbar menus in 1 Tab key',
              'Required for SEO keywords',
              'Blocks mobile zooming',
            ],
            answer: 1,
            explanation: 'Skip links save keyboard-only users from tabbing through 20 header links on every page load.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: a11y',
        subtitle: 'Check ARIA state toggles, dialog labels, and keyboard rules',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Publish open/collapsed accordion state dynamically with ARIA.',
            codeLines: ['<button type="button" {{0}}="false" {{1}}="faq-panel">', '  Toggle Details', '</button>'],
            expectedTokens: ['aria-expanded', 'aria-controls'],
            distractors: ['data-open', 'aria-open', 'for'],
            explanation: '`aria-expanded="true|false"` tells assistive users whether the drawer is open.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why screen readers fail to identify the role of `<div onclick>`.',
            lines: [
              '<div class="tab" role="button">Overview</div>',
            ],
            bugLine: 0,
            fixed: '<button type="button" class="tab">Overview</button>',
            explanation: '`role="button"` on a `<div>` does NOT add Tab focus or Enter/Space handlers—use real `<button>`.',
          },
          {
            type: 'predict_output',
            prompt: 'What does `tabindex="-1"` do on a `<div>`?',
            code: ['<div id="err-banner" tabindex="-1">Fix 2 errors</div>'],
            options: [
              'Disables all mouse clicks',
              'Excludes from Tab order while letting JS call .focus()',
              'Puts element first in Tab order',
            ],
            answer: 1,
            explanation: '`tabindex="-1"` lets JS move keyboard focus cleanly to error summaries or headings.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Head Metadata & Social Previews',
        subtitle: 'Configure description, canonical URLs, favicons, and Open Graph tags',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Search & Share Metadata in <head>',
            explanation:
              'Keep `<title>` concise & page-specific, add `<meta name="description">`, link canonical URLs with `<link rel="canonical">`, and expose rich previews via `og:title` / `og:image`.',
            code: ['<title>Learn SQL | CodeLingo</title>', '<meta name="description" content="Master SQL joins and queries interactively.">', '<meta property="og:title" content="Learn SQL on CodeLingo">'],
            highlightNote: 'Notice Open Graph tags use `property="og:..."`, not `name="..."`!',
          },
          {
            type: 'token_builder',
            prompt: 'Declare the canonical URL and Open Graph title inside `<head>`.',
            codeLines: ['<link {{0}}="canonical" href="https://codelingo.app/ts">', '<meta {{1}}="og:title" content="TypeScript Track">'],
            expectedTokens: ['rel', 'property'],
            distractors: ['type', 'name', 'href'],
            explanation: 'Canonical URLs use `<link rel="canonical">`; Open Graph meta uses `property`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the broken `<title>` placed inside `<body>` instead of `<head>`.',
            lines: [
              '<body>',
              '  <title>Wrong Place</title>',
              '  <h1>Profile</h1>',
              '</body>',
            ],
            bugLine: 1,
            fixed: '  <h1>Profile</h1>',
            explanation: 'Document `<title>` belongs strictly inside `<head>`, never inside `<body>`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which `<link>` relation establishes a page’s primary preferred URL for search engines to avoid duplicate-URL penalties?',
            options: ['rel="alternate"', 'rel="canonical"', 'rel="prefetch"', 'rel="bookmark"'],
            answer: 1,
            explanation: '`rel="canonical"` signals the authoritative URL cleanly.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Inclusive Web Pro',
        subtitle: 'Combine ARIA labels, live regions, <dialog>, and <head> hygiene',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Create a screen-reader status announcement and an accessible close icon.',
            codeLines: [
              '<div role="status" {{0}}="polite">Unit 5 Completed!</div>',
              '<button type="button" {{1}}="Close dialog">',
              '  <svg aria-hidden="true"></svg>',
              '</button>',
            ],
            expectedTokens: ['aria-live', 'aria-label'],
            distractors: ['aria-polite', 'alt', 'title'],
            explanation: 'Polite live announcements + named icon buttons keep dynamic apps inclusive.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why `<div>` tab navigation hurts keyboard users here.',
            lines: [
              '<button type="button">Close</button>',
              '<svg aria-hidden="true" tabindex="0"></svg>',
            ],
            bugLine: 1,
            fixed: '<svg aria-hidden="true"></svg>',
            explanation: 'A decorative `aria-hidden="true"` icon should never receive `tabindex="0"`.',
          },
          {
            type: 'multiple_choice',
            question: 'What is the **First Rule of ARIA**?',
            options: [
              'Add role attributes to every element',
              'Use native semantic HTML controls before reaching for ARIA roles',
              'Hide all icons from keyboard users',
              'Set tabindex="1" on headers',
            ],
            answer: 1,
            explanation: 'Native HTML (`<button>`, `<nav>`, `<main>`) comes with full keyboard + ARIA semantics built in.',
          },
        ],
      },
    ],
  },
];
