import type { UnitSeed } from './types';

export const ASM_UNITS: UnitSeed[] = [
  // =========================================================================
  // UNIT 1: Registers & Arithmetic (6 nodes)
  // =========================================================================
  {
    title: 'Registers & Arithmetic',
    subtitle: 'Understand 64/32-bit x86-64 registers, Intel syntax (dst, src), mov, add, and sub.',
    conceptGraphicType: 'asm_regs',
    guidebook: {
      summary:
        'Assembly sits one step above raw CPU machine opcodes. In **Intel x86-64 syntax** (NASM), every instruction writes `opcode destination, source`: data flows from RIGHT to LEFT into lightning-fast CPU registers (`rax`, `rbx`, `rcx`, `rdx`).',
      mentalModel:
        'Registers are 16 tiny ultra-fast CPU scratchpads right inside the core. `rax` holds 64 bits, while `eax` is its **lower 32 bits** (writing `eax` automatically zeroes the upper 32 bits of `rax` cleanly!).',
      keyTakeaways: [
        'In Intel syntax (`mov rax, 42`), **destination is FIRST, source is SECOND**—never move memory-to-memory in one instruction (`mov [a], [b]` is illegal!).',
        'Register width names map cleanly: `rax` (64-bit) -> `eax` (32-bit) -> `ax` (16-bit) -> `al` (low 8 bits).',
        'Fast zeroing idiom: `xor eax, eax` zeroes all 64 bits of `rax` in fewer instruction bytes than `mov rax, 0`!',
        'Arithmetic instructions (`add dst, src`, `sub dst, src`, `inc dst`, `dec dst`) mutate `dst` in place and update CPU flags (`ZF`, `CF`).',
      ],
      keySyntax: [
        {
          title: 'Moving & Computing in Registers',
          tag: 'MOV / ADD',
          code: 'mov rax, 15     ; rax = 15\nmov rbx, 27     ; rbx = 27\nadd rax, rbx    ; rax = rax + rbx (42)\nsub rax, 2      ; rax = 40',
          output: 'rax == 40, rbx == 27',
          explanation:
            'Immediate constants (`15`, `27`, `2`) flow straight into registers, and `add`/`sub` modify the first operand cleanly.',
          notes: [
            'Comments in NASM/Intel assembly start with a semicolon `;`.',
          ],
        },
        {
          title: 'Zeroing & Sub-Registers (rax vs eax)',
          tag: 'WIDTHS',
          code: 'xor eax, eax    ; Fastest way to set rax = 0\nmov eax, 100    ; Clears upper 32 bits of rax too!',
          output: 'rax == 100 (cleanly zero-extended)',
          explanation:
            'Writing any 32-bit `e*` register (`eax`, `edi`) zeroes the upper half of the 64-bit register, whereas writing 8-bit `al` preserves upper bits!',
          notes: [
            'Use `imul dst, src` for signed multiplication (`imul rax, 3`).',
          ],
        },
        {
          title: 'Bitwise Shifts for Fast *2 / /2',
          tag: 'SHIFTS',
          code: 'mov rax, 5\nshl rax, 3      ; Multiply by 2^3 = 8 -> 40\nshr rax, 1      ; Divide unsigned by 2 -> 20',
          output: 'rax == 20',
          explanation:
            '`shl` shifts bits left (fast power-of-2 multiply); `shr` shifts unsigned right (`sar` preserves sign bit).',
          notes: [
            'Bitwise `and`, `or`, `xor` also test and mask register flags directly.',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Writing Source-First Instead of Destination-First (Intel Order)',
          buggyCode: 'mov 10, rax ; Cannot overwrite literal constant 10!',
          fixedCode: 'mov rax, 10',
          reason:
            'Intel syntax ALWAYS puts destination FIRST (`mov dst, src`); you can never assign into an immediate number.',
        },
        {
          title: 'Memory-to-Memory mov in a Single Instruction',
          buggyCode: 'mov [rsi], [rdi] ; Illegal on x86!',
          fixedCode: 'mov rax, [rdi]\nmov [rsi], rax',
          reason:
            'x86 allows at most ONE memory operand per instruction—bounce through a register like `rax` first.',
        },
      ],
      proTip:
        'Why do compilers always emit `xor eax, eax` instead of `mov rax, 0`? It takes 2 machine bytes instead of 7–10, requires zero immediate fetch, AND breaks register dependency chains inside modern out-of-order CPUs!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Intel Syntax & Registers',
        subtitle: 'Load values with mov dst, src and use 64/32-bit registers',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Destination Left, Source Right',
            explanation:
              'Intel x86-64 instructions follow `op dst, src`. Start with `mov` to load registers (`rax`, `rbx`, `rcx`, `rdx`) and write `;` for comments.',
            code: ['; Compute (10 + 32)', 'mov rax, 10', 'add rax, 32   ; rax becomes 42'],
            output: 'rax = 42',
            highlightNote: 'Notice `mov` copies values—`src` remains unchanged.',
          },
          {
            type: 'token_builder',
            prompt: 'Load `20` into `rax`, then add `5` into `rax`.',
            codeLines: ['{{0}} rax, 20', '{{1}} rax, 5'],
            expectedTokens: ['mov', 'add'],
            distractors: ['ld', 'set', 'plus'],
            syntaxHint: 'Load via `mov`, accumulate via `add`.',
            explanation: '`mov rax, 20` initializes `rax`; `add rax, 5` updates `rax` to `25`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the reversed operand order trying to write into constant `42`!',
            lines: [
              'mov 42, rax',
              'add rax, 8',
            ],
            bugLine: 0,
            fixed: 'mov rax, 42',
            explanation: 'Intel syntax always writes `mov destination, source`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which register holds the **lower 32 bits** of 64-bit register `rax`?',
            options: ['ax', 'al', 'eax', 'r32'],
            answer: 2,
            explanation: '`eax` is the 32-bit bottom half (`ax` = 16-bit, `al` = 8-bit).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Arithmetic, xor & Shifts',
        subtitle: 'Compute with add, sub, imul, xor zeroing, and shl/shr',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Fast Idioms & Multiply/Shift',
            explanation:
              'Zero a register fast via `xor eax, eax`. Multiply signed integers with `imul dst, val`, increment by 1 with `inc`, or shift powers of 2 via `shl`/`shr`.',
            code: ['xor eax, eax   ; rax = 0', 'mov rax, 6', 'imul rax, 7    ; rax = 42', 'inc rax        ; rax = 43'],
            output: 'rax = 43',
            highlightNote: '`shl rax, 2` multiplies `rax` by `4` cleanly in 1 cycle!',
          },
          {
            type: 'token_builder',
            prompt: 'Zero `rbx` using XOR, then double `rax` with a 1-bit left shift.',
            codeLines: ['{{0}} ebx, ebx', 'mov rax, 9', '{{1}} rax, 1'],
            expectedTokens: ['xor', 'shl'],
            distractors: ['zero', 'shr', 'mul'],
            explanation: '`xor ebx, ebx` clears `rbx`; `shl rax, 1` multiplies `9 * 2 = 18`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is `rax` at the end?',
            code: ['mov rax, 10', 'sub rax, 3', 'shl rax, 1'],
            options: ['7', '14', '3'],
            answer: 1,
            explanation: '`10 - 3 = 7`, and shifting left by 1 multiplies by `2` (`14`).',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the illegal direct memory-to-memory move!',
            lines: [
              'mov rax, 5',
              'mov [rsi], [rdi]',
            ],
            bugLine: 1,
            fixed: 'mov rax, [rdi]\nmov [rsi], rax',
            explanation: 'x86 `mov` forbids two memory `[...]` brackets in a single instruction.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Hex Literals & LEA Math',
        subtitle: 'Compute scaled offsets fast with lea without touching flags',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Address Math & Hex Values',
            explanation:
              'Immediate numbers accept decimal (`42`) or hex (`0x2A`). Meanwhile `lea` computes `base + idx * scale` in one clock cycle WITHOUT modifying `RFLAGS`!',
            code: ['mov rax, 10', 'lea rbx, [rax + rax*2]  ; rbx = 30 cleanly'],
            output: 'rbx = 30',
            highlightNote: '`lea` computes fast multiplications by 3, 5, or 9 without using `imul`.',
          },
          {
            type: 'token_builder',
            prompt: 'Load hex `0x10` (`16`) into `rcx`, then use `lea` for `rcx * 2 + 4`.',
            codeLines: ['mov rcx, {{0}}', '{{1}} rdx, [rcx*2 + 4]'],
            expectedTokens: ['0x10', 'lea'],
            distractors: ['16h', 'mov', 'imul'],
            explanation: '`0x10` equals 16 decimal, and `lea` computes effective address math without memory access.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot overwriting `rax` with a sub-register confusion (expecting zeroing cleanly).',
            lines: [
              'mov rax, 0xFF',
              'mov ax, 1',
            ],
            bugLine: 1,
            fixed: 'mov eax, 1',
            explanation: 'Writing 16-bit `ax` leaves the upper 48 bits of `rax` dirty; writing 32-bit `eax` zero-extends the whole 64-bit register!',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Registers',
        subtitle: 'Verify sub-register zero extension and Intel syntax rules',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Multiply `rcx` by `5`, then subtract `rdx`.',
            codeLines: ['{{0}} rcx, 5', '{{1}} rcx, rdx'],
            expectedTokens: ['imul', 'sub'],
            distractors: ['add', 'div', 'shr'],
            explanation: '`imul rcx, 5` scales `rcx`; `sub rcx, rdx` subtracts `rdx`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the unsupported `#` comment syntax causing an assembler error in NASM!',
            lines: [
              'mov rax, 1   # set rax to 1',
            ],
            bugLine: 0,
            fixed: 'mov rax, 1   ; set rax to 1',
            explanation: 'Intel/NASM assembly comments start with `;` semicolon, not `#`.',
          },
          {
            type: 'multiple_choice',
            question: 'What happens to the upper 32 bits of `rax` when you execute `mov eax, 1`?',
            options: [
              'Upper 32 bits hold garbage',
              'x86-64 automatically zeroes the upper 32 bits of rax',
              'Only ax changes',
              'Triggers overflow',
            ],
            answer: 1,
            explanation: 'Every 32-bit register write on x86-64 zero-extends neatly into 64 bits.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Signed vs Unsigned Math',
        subtitle: 'Contrast shr vs sar and overflow-safe arithmetic',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Preserving Negative Signs on Right Shift',
            explanation:
              '`shr` shifts `0`s into the top sign bit (unsigned division). `sar` (Shift Arithmetic Right) copies the original sign bit so negative numbers stay cleanly negative!',
            code: ['mov rax, -8', 'sar rax, 1    ; Preserves sign -> -4'],
            output: 'rax = -4',
            highlightNote: 'Check unsigned overflow with `CF` (Carry) vs signed overflow with `OF`.',
          },
          {
            type: 'token_builder',
            prompt: 'Halve signed negative `rax` cleanly preserving sign bit, then bump by 1.',
            codeLines: ['mov rax, -16', '{{0}} rax, 1', '{{1}} rax'],
            expectedTokens: ['sar', 'inc'],
            distractors: ['shr', 'shl', 'dec'],
            explanation: '`sar` divides signed numbers cleanly toward `-infinity`; `inc` adds `1`.',
          },
          {
            type: 'predict_output',
            prompt: 'Start: `rax = 4, rbx = 10`. After `xchg rax, rbx`, what do they hold?',
            code: ['mov rax, 4', 'mov rbx, 10', 'xchg rax, rbx'],
            options: ['rax=4, rbx=4', 'rax=10, rbx=4', 'rax=14, rbx=10'],
            answer: 1,
            explanation: '`xchg` swaps both register values cleanly without a temp register.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why dividing `-8` with `shr` corrupts the negative sign!',
            lines: [
              'mov rax, -8',
              'shr rax, 1   ; Turns negative MSB into 0!',
            ],
            bugLine: 1,
            fixed: 'sar rax, 1',
            explanation: 'Unsigned `shr` pulls in `0` at the top bit; signed division requires `sar`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: ALU Master',
        subtitle: 'Compute expressions cleanly across registers, shifts, and opcodes',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Compute `rax = (3 * 4) + 8` cleanly using shifts and add.',
            codeLines: [
              'mov rax, 3',
              '{{0}} rax, 2   ; * 4 -> 12',
              '{{1}} rax, 8   ; -> 20',
            ],
            expectedTokens: ['shl', 'add'],
            distractors: ['shr', 'sub', 'sar'],
            explanation: '`shl 2` multiplies by `4`, then `add 8` computes `20`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the invalid immediate-destination mistake.',
            lines: [
              'mov rcx, 5',
              'add 10, rcx',
            ],
            bugLine: 1,
            fixed: 'add rcx, 10',
            explanation: 'Always place the target register `rcx` BEFORE immediate `10`.',
          },
          {
            type: 'predict_output',
            prompt: 'What is `rax` after running `xor eax, eax`, `mov eax, 7`, `imul eax, 3`, `dec eax`?',
            code: ['xor eax, eax', 'mov eax, 7', 'imul eax, 3', 'dec eax'],
            options: ['21', '20', '10'],
            answer: 1,
            explanation: '`7 * 3 = 21`, then `dec eax` yields `20`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 2: Flags, cmp & Jumps (5 nodes)
  // =========================================================================
  {
    title: 'Flags, cmp & Branches',
    subtitle: 'Branch control flow cleanly using cmp, test, RFLAGS, and conditional jumps.',
    conceptGraphicType: 'asm_flags',
    guidebook: {
      summary:
        'Assembly has no `if`/`else` keywords! Instead, instructions like `cmp a, b` (subtracts without saving!) and `test a, a` update single-bit flags inside `RFLAGS` (`ZF` Zero, `SF` Sign, `CF` Carry), and conditional jumps (`je`, `jne`, `jg`, `jl`) inspect those flags to branch.',
      mentalModel:
        'Think of `cmp rax, 10` as computing `(rax - 10)` **strictly for its side-effect on `RFLAGS`** while leaving `rax` untouched! Right afterward, `je` jumps if zero (`ZF=1`), `jg` jumps if signed greater, and `jl` jumps if signed less.',
      keyTakeaways: [
        '`cmp a, b` updates flags as `a - b`; read the jump condition naturally as `"jump if a <cond> b"` (`jg` = `a > b`, `jl` = `a < b`).',
        'Check if a register is zero cleanly with `test rax, rax` + `jz label` (shorter & faster than `cmp rax, 0`).',
        'Signed comparisons jump on `g`/`l` (`jg`, `jge`, `jl`, `jle`); unsigned comparisons jump on `a`/`b` ("above"/"below": `ja`, `jb`).',
        'Build loops easily with a label + `dec rcx` + `jnz loop_start` jumping backward until counter hits `0`.',
      ],
      keySyntax: [
        {
          title: 'Comparing Two Registers & Branching',
          tag: 'IF / ELSE',
          code: 'cmp rax, rbx\njge greater_or_eq\nmov rcx, 0       ; Else branch\njmp done\ngreater_or_eq:\nmov rcx, 1\ndone:',
          output: 'rcx = (rax >= rbx) ? 1 : 0',
          explanation:
            'Notice the unconditional `jmp done` skipping the `greater_or_eq:` block so both branches don’t run!',
          notes: [
            'Short conditional move `cmovg` avoids branch mispredictions altogether on modern CPUs!',
          ],
        },
        {
          title: 'Fast Zero Check with test',
          tag: 'TEST',
          code: 'test rdi, rdi    ; Bitwise AND sets ZF=1 iff rdi == 0\njz is_null',
          output: 'Jumps to `is_null:` cleanly if pointer `rdi` is zero',
          explanation:
            '`test` performs bitwise `&` without modifying `rdi`, updating Zero Flag `ZF` in 2 bytes.',
          notes: [
            '`test al, 1` + `jnz is_odd` checks bit 0 without mutating `al`!',
          ],
        },
        {
          title: 'Counted Loop with jnz',
          tag: 'LOOPS',
          code: 'mov rcx, 4\nsum_loop:\n    add rax, rcx\n    dec rcx\n    jnz sum_loop',
          output: 'Adds 4 + 3 + 2 + 1 = 10 into rax',
          explanation:
            '`dec rcx` sets `ZF=1` on reaching `0`; `jnz` loops while `ZF=0`.',
          notes: [
            'Careful: put nothing between `cmp` and `j*` that alters `RFLAGS` (unlike `add`/`inc`!).',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Forgetting jmp Over the Then-Block into Else',
          buggyCode: 'cmp rax, 5\nje is_five\nmov rbx, 0\nis_five:\nmov rbx, 1 ; Falls straight through when rax != 5!',
          fixedCode: 'cmp rax, 5\nje is_five\nmov rbx, 0\njmp end\nis_five:\nmov rbx, 1\nend:',
          reason:
            'Labels don’t stop execution—without `jmp end`, the false path runs straight into `is_five:` and overwrites `rbx`!',
        },
        {
          title: 'Using Unsigned ja/jb on Signed Negative Integers',
          buggyCode: 'mov rax, -1\ncmp rax, 5\nja above ; Jumps! -1 unsigned is 0xFFF...!',
          fixedCode: 'mov rax, -1\ncmp rax, 5\njg greater ; Correctly FALSE!',
          reason:
            '`ja`/`jb` treat bits as unsigned (`0xFFFFFFFFFFFFFFFF > 5`); signed ints ALWAYS need `jg`/`jl`!',
        },
      ],
      proTip:
        'NEVER insert arithmetic (`add`, `sub`) between `cmp`/`test` and the conditional jump! `mov` and `lea` preserve `RFLAGS` cleanly, while `add`/`dec`/`xor` overwrite your flags silently!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'cmp, test & RFLAGS',
        subtitle: 'Set Zero & Sign flags without clobbering operands',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Compare Leaves Registers Intact',
            explanation:
              '`cmp a, b` computes `a - b` only to set `RFLAGS` (`ZF=1` when equal, `SF` for negative). `test a, b` runs `a & b` just for flags (`test a, a` checks `== 0`).',
            code: ['cmp rbx, 10    ; Updates ZF/SF, rbx stays untouched', 'je matched     ; Jumps if rbx == 10'],
            highlightNote: '`je` and `jz` actually share the exact same CPU opcode (`ZF == 1`)!',
          },
          {
            type: 'token_builder',
            prompt: 'Jump to `ok_label` ONLY if `rax` equals `rbx`.',
            codeLines: ['{{0}} rax, rbx', '{{1}} ok_label'],
            expectedTokens: ['cmp', 'je'],
            distractors: ['test', 'jmp', 'jg'],
            explanation: '`cmp rax, rbx` compares; `je` jumps when Zero Flag shows equality.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `je` reads the WRONG flags here!',
            lines: [
              'cmp rax, 10',
              'add rcx, 1    ; Overwrites RFLAGS!',
              'je target',
            ],
            bugLine: 1,
            fixed: 'je target',
            explanation: '`add rcx, 1` modifies `RFLAGS`, erasing the result of `cmp rax, 10` before `je`!',
          },
          {
            type: 'multiple_choice',
            question: 'What does `test rax, 1` followed by `jnz odd_label` check cleanly?',
            options: [
              'Whether rax == 1 exact',
              'Whether bit 0 of rax is 1 (i.e. rax is an odd number)',
              'Whether rax < 0',
              'Multiplies rax by 1',
            ],
            answer: 1,
            explanation: 'Bitwise `rax & 1` isolates the lowest parity bit (`ZF=0` when odd).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Signed vs Unsigned Jumps',
        subtitle: 'Pick jg/jl (signed) vs ja/jb (unsigned) accurately',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Greater/Less vs Above/Below',
            explanation:
              'Signed integers use **Greater / Less** (`jg`, `jge`, `jl`, `jle`). Unsigned sizes/addresses use **Above / Below** (`ja`, `jae`, `jb`, `jbe`).',
            code: ['cmp rax, rbx', 'jl signed_smaller   ; Signed <', 'jb unsigned_below   ; Unsigned <'],
            highlightNote: '`jmp label` is the unconditional goto jumping regardless of any flags.',
          },
          {
            type: 'token_builder',
            prompt: 'Branch cleanly if signed `rax > 0` without falling into else.',
            codeLines: ['cmp rax, 0', '{{0}} pos_branch', 'mov rbx, 0', '{{1}} end_if', 'pos_branch:', 'mov rbx, 1', 'end_if:'],
            expectedTokens: ['jg', 'jmp'],
            distractors: ['ja', 'je', 'call'],
            explanation: 'Signed greater uses `jg`; unconditional `jmp` prevents fallthrough into `pos_branch:`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the classic unsigned jump mistake on negative temperature `-5`!',
            lines: [
              'mov rax, -5',
              'cmp rax, 0',
              'ja above_zero  ; Treats -5 as huge unsigned int!',
            ],
            bugLine: 2,
            fixed: 'jg above_zero',
            explanation: 'Signed comparisons must use `jg` / `jl`—`-5` is unsigned `0xFFFF...FFFB > 0`!',
          },
          {
            type: 'predict_output',
            prompt: 'With `rax = 5, rbx = 5`, what does `cmp rax, rbx` + `jg skip` do?',
            code: ['mov rax, 5', 'mov rbx, 5', 'cmp rax, rbx', 'jg skip'],
            options: ['Jumps to skip', 'Does NOT jump (5 is not strictly > 5)', 'Throws flag error'],
            answer: 1,
            explanation: '`jg` requires strictly greater (`jge` jumps on `>=`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Branching',
        subtitle: 'Lock down labels, test zero-checks, and fallthrough traps',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Check cleanly for null pointer in `rdi` using fast `test`.',
            codeLines: ['{{0}} rdi, rdi', '{{1}} null_exit'],
            expectedTokens: ['test', 'jz'],
            distractors: ['cmp', 'jg', 'jb'],
            explanation: '`test rdi, rdi` + `jz` jumps whenever `rdi == 0`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the missing `jmp` allowing BOTH if and else to overwrite `rcx`!',
            lines: [
              'cmp rax, 1',
              'je was_one',
              'mov rcx, 99',
              'was_one:',
              'mov rcx, 1',
            ],
            bugLine: 2,
            fixed: 'mov rcx, 99\njmp done\nwas_one:\nmov rcx, 1\ndone:',
            explanation: 'Without `jmp done` after `mov rcx, 99`, execution falls right into `was_one:`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which instruction pairs cleanly with `cmp len, max_len` when lengths are **unsigned**?',
            options: ['jg / jl', 'ja / jb', 'jz only', 'js'],
            answer: 1,
            explanation: 'Unsigned lengths/pointers always compare using Above (`ja`) / Below (`jb`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Loops & Conditional Move',
        subtitle: 'Count backward cleanly with jnz and avoid branch mispredicts with cmov',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Backward Jumps = Loops',
            explanation:
              'Decrement a loop counter with `dec rcx` and jump back with `jnz loop_top` while non-zero. Even cooler: `cmovg` assigns conditionally with ZERO branching!',
            code: ['mov rcx, 3', 'top:', '    add rax, 10', '    dec rcx', '    jnz top'],
            output: 'rax increases by 30',
            highlightNote: 'Remember `loop` instruction is slow on modern CPUs—use `dec rcx` + `jnz`!',
          },
          {
            type: 'token_builder',
            prompt: 'Loop cleanly `5` times accumulating `10` each step.',
            codeLines: ['mov rcx, 5', 'loop_step:', '    add rax, 10', '    {{0}} rcx', '    {{1}} loop_step'],
            expectedTokens: ['dec', 'jnz'],
            distractors: ['sub', 'jz', 'je'],
            explanation: '`dec rcx` updates Zero Flag automatically so `jnz` loops until `rcx == 0`.',
          },
          {
            type: 'predict_output',
            prompt: 'How many total additions run?',
            code: ['xor eax, eax', 'mov rcx, 4', 'next:', '    add rax, 2', '    dec rcx', '    jnz next'],
            options: ['6 (3 times)', '8 (4 times)', '10 (5 times)'],
            answer: 1,
            explanation: '`rcx` steps `4 -> 3 -> 2 -> 1 -> 0` executing the body 4 times -> `8`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the subtle infinite loop bug when `rcx` starts at `0`!',
            lines: [
              'mov rcx, 0',
              'repeat:',
              '    dec rcx   ; Wraps 0 -> -1 (non-zero!)',
              '    jnz repeat',
            ],
            bugLine: 0,
            fixed: 'mov rcx, 0\ntest rcx, rcx\njz done\nrepeat:',
            explanation: 'Always guard with `test rcx, rcx` + `jz done` before a do-while `dec`/`jnz` loop!',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Control Flow Master',
        subtitle: 'Master flags, signed vs unsigned branches, and safe loops',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Compute `max(rax, rbx)` cleanly into `rcx`.',
            codeLines: [
              'mov rcx, rax',
              'cmp rbx, rax',
              '{{0}} keep_rax',
              'mov rcx, rbx',
              'keep_rax:',
            ],
            expectedTokens: ['jle'],
            distractors: ['jg', 'jbe', 'jz'],
            explanation: 'If signed `rbx <= rax`, jump cleanly to skip overwriting `rcx` with `rbx`!',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why `cmp` + `mov` breaks or wait—check which instruction clobbers flags!',
            lines: [
              'cmp rdi, rsi',
              'xor eax, eax  ; Clobbers ZF and SF!',
              'je match',
            ],
            bugLine: 1,
            fixed: 'je match\nxor eax, eax',
            explanation: '`xor eax, eax` resets `ZF=1` unconditionally—place `je match` immediately after `cmp`!',
          },
          {
            type: 'multiple_choice',
            question: 'Why does `mov` NOT overwrite flags between `cmp` and `je` while `xor eax, eax` DOES?',
            options: [
              'mov never modifies RFLAGS; logic/math instructions like xor/add/sub always modify RFLAGS',
              'xor uses 32-bit registers only',
              'je ignores xor',
              'RFLAGS is read-only',
            ],
            answer: 0,
            explanation: '`mov` and `lea` leave `RFLAGS` untouched; logic/ALU ops rewrite flags.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 3: The Stack & Function Calls (5 nodes)
  // =========================================================================
  {
    title: 'Stack, call & ret',
    subtitle: 'Manage rsp LIFO stack frames, push/pop safely, and write functions with call/ret.',
    conceptGraphicType: 'asm_stack',
    guidebook: {
      summary:
        'The **Call Stack** grows **downward** toward lower memory addresses and is tracked by stack pointer `rsp`. `push x` subtracts `8` from `rsp` and writes `x` at `[rsp]`, while `pop y` reads `[rsp]` and adds `8` back.',
      mentalModel:
        '`call func` is literally two steps combined: `push return_address` + `jmp func`. Then `ret` pops that saved address off `[rsp]` right back into instruction pointer `rip`—so every `push` MUST match an exact `pop` before `ret`!',
      keyTakeaways: [
        'Stack grows **downward**: `push rax` decreases `rsp` by `8` bytes; `pop rax` increases `rsp` by `8` bytes (Last-In First-Out).',
        'Before returning (`ret`), `[rsp]` MUST point cleanly to the saved return address—unmatched `push`/`pop` crashes straight to garbage memory!',
        'Save & restore callee-saved registers (`rbx`, `rbp`, `r12`..`r15`) cleanly with matching `push`/`pop` pairs in reverse order.',
        'Allocate local stack buffers cleanly using `sub rsp, N` and reclaim with `add rsp, N` cleanly before `ret`.',
      ],
      keySyntax: [
        {
          title: 'Saving & Restoring Registers (LIFO)',
          tag: 'PUSH / POP',
          code: 'push rax\npush rbx\n; Top of stack ([rsp]) now holds rbx!\npop rbx         ; Always pop in REVERSE push order\npop rax',
          output: 'Restores original rbx and rax cleanly; rsp unchanged',
          explanation:
            'Pushing `rax` then `rbx` leaves `rbx` on top, so popping `rbx` FIRST restores both registers without swapping them.',
          notes: [
            'Swapping `pop rax` / `pop rbx` turns `push` + `pop` into an accidental `xchg`!',
          ],
        },
        {
          title: 'Clean Leaf Function with call & ret',
          tag: 'SUBROUTINES',
          code: 'add_five:\n    mov rax, rdi\n    add rax, 5\n    ret\n\n; Caller:\nmov rdi, 10\ncall add_five   ; rax returns 15!',
          output: 'rax == 15 cleanly returned to caller',
          explanation:
            '`call` pushes the next instruction address onto `[rsp]`, jumps into `add_five`, and `ret` returns cleanly with `rax = 15`.',
          notes: [
            'By convention on x86-64, function return values ALWAYS come back in `rax`!',
          ],
        },
        {
          title: 'Stack Frame Prologue & Local Allocation',
          tag: 'STACK FRAME',
          code: 'push rbp\nmov rbp, rsp\nsub rsp, 16     ; Reserve 16-byte aligned local space\n; ... body ...\nleave           ; Restores rsp = rbp; pop rbp\nret',
          output: 'Clean 16-byte aligned stack frame',
          explanation:
            'System V x86-64 ABI expects `rsp` to be **16-byte aligned** right before any `call` instruction!',
          notes: [
            'Remember: `call` pushes an 8-byte return address, so entering a function shifts `rsp` off 16-byte alignment until another `push rbp` (8 bytes) aligns it again!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Returning With a Leftover Unpopped Value on Stack',
          buggyCode: 'my_fn:\n    push rbx\n    mov rax, 1\n    ret  ; Pops rbx instead of return address -> CRASH!',
          fixedCode: 'my_fn:\n    push rbx\n    mov rax, 1\n    pop rbx\n    ret',
          reason:
            '`ret` blindly jumps to whatever 8-byte address currently sits at `[rsp]`—unpopped values trigger an immediate Segfault!',
        },
        {
          title: 'Popping Multiple Registers in Forward Order',
          buggyCode: 'push rax\npush rbx\npop rax\npop rbx ; Swapped values silently!',
          fixedCode: 'push rax\npush rbx\npop rbx\npop rax',
          reason:
            'Stack is LIFO (Last-In First-Out): the LAST register pushed must always be popped FIRST.',
        },
      ],
      proTip:
        'Trace `rsp` with a quick mental delta (`push = -8`, `pop = +8`, `sub rsp, 16 = -16`): at every `ret`, your function’s net `rsp` delta MUST equal `0`, and right before any `call`, `rsp % 16 == 0`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'push, pop & Downward rsp',
        subtitle: 'Understand LIFO order and how rsp shifts by 8 bytes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'LIFO Stack Mechanics',
            explanation:
              'Stack pointer `rsp` points to the current top item and grows **downward** in memory. `push` writes 8 bytes at `rsp - 8`; `pop` reads and bumps `rsp + 8`.',
            code: ['push rbx    ; rsp -= 8', 'push rcx    ; rsp -= 8', 'pop rcx     ; rsp += 8', 'pop rbx     ; rsp += 8'],
            highlightNote: 'Notice `pop` ALWAYS mirrors `push` in exact reverse order!',
          },
          {
            type: 'token_builder',
            prompt: 'Preserve `rax` and `rdi` across a block cleanly in LIFO order.',
            codeLines: ['push rax', 'push rdi', '; work...', '{{0}} rdi', '{{1}} rax'],
            expectedTokens: ['pop', 'pop'],
            distractors: ['pull', 'push', 'ret'],
            explanation: 'Since `rdi` was pushed last, `pop rdi` runs before `pop rax`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `rax` and `rbx` end up accidentally swapped!',
            lines: [
              'push rax',
              'push rbx',
              'pop rax',
              'pop rbx',
            ],
            bugLine: 2,
            fixed: 'pop rbx\npop rax',
            explanation: 'Stack pops LIFO: popping `rax` first overwrites `rax` with `rbx`’s value.',
          },
          {
            type: 'predict_output',
            prompt: 'If `rsp = 0x1000` before `push rax` + `push rbx` (each 8 bytes), what is `rsp` afterward?',
            code: ['; rsp starts at 0x1000', 'push rax', 'push rbx'],
            options: ['0x1010', '0x0FF0 (-16 bytes)', '0x1000'],
            answer: 1,
            explanation: 'Stacks grow downward by `16` bytes (`0x10`), landing cleanly at `0x0FF0`.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'call & ret Subroutines',
        subtitle: 'Pass args, jump safely with call, and return results in rax',
        exercises: [
          {
            type: 'theory_bite',
            title: 'How Subroutines Work Under the Hood',
            explanation:
              '`call label` pushes the return address onto `[rsp]` and jumps. The callee puts its result in `rax` and runs `ret` to pop back cleanly.',
            code: ['double_it:', '    mov rax, rdi', '    shl rax, 1', '    ret'],
            highlightNote: 'Never use plain `jmp` to return from a `call`—always use `ret`!',
          },
          {
            type: 'token_builder',
            prompt: 'Invoke `square` with `rdi = 5` and return cleanly at the end of `square`.',
            codeLines: ['mov rdi, 5', '{{0}} square', '; ...', 'square:', '    mov rax, rdi', '    imul rax, rdi', '    {{1}}'],
            expectedTokens: ['call', 'ret'],
            distractors: ['jmp', 'return', 'pop'],
            explanation: '`call` saves the return address; `ret` pops it back cleanly after setting `rax`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the catastrophic unpopped register crash before `ret`!',
            lines: [
              'helper:',
              '    push r12',
              '    mov rax, 99',
              '    ret',
            ],
            bugLine: 3,
            fixed: '    pop r12\n    ret',
            explanation: '`ret` pops the top of `[rsp]` as a code address—leaving `r12` on the stack segfaults!',
          },
          {
            type: 'multiple_choice',
            question: 'What exact two operations does `call foo` execute atomically?',
            options: [
              'mov rax, rip; jmp foo',
              'push return_address onto stack, then jmp foo',
              'sub rsp, 16; jmp foo',
              'pop rsp; call foo',
            ],
            answer: 1,
            explanation: '`call` pushes the address of the very next instruction onto `[rsp]` then jumps.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Stack',
        subtitle: 'Check rsp alignment, net stack delta, and callee saves',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Reserve `16` bytes of local stack space safely and clean up before `ret`.',
            codeLines: ['fn_local:', '    {{0}} rsp, 16', '    ; use [rsp..rsp+15]', '    {{1}} rsp, 16', '    ret'],
            expectedTokens: ['sub', 'add'],
            distractors: ['push', 'pop', 'alloc'],
            explanation: 'Allocate downward via `sub rsp, 16` and reclaim upward via `add rsp, 16`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the stack leak growing `rsp` downward forever!',
            lines: [
              'calc:',
              '    sub rsp, 32',
              '    mov rax, 7',
              '    ret',
            ],
            bugLine: 3,
            fixed: '    add rsp, 32\n    ret',
            explanation: 'Reclaim allocated stack space (`add rsp, 32`) so `[rsp]` points back to return addr.',
          },
          {
            type: 'multiple_choice',
            question: 'Why must `rsp` be **16-byte aligned** right before `call printf` on x86-64 Linux/macOS?',
            options: [
              'printf prints hex only on 16s',
              'SSE vector instructions (`movaps`) inside libc crash immediately on misaligned stacks!',
              '16 is ASCII size',
              'Only 32-bit CPUs align stacks',
            ],
            answer: 1,
            explanation: 'Aligned SSE memory instructions require 16-byte stack alignment (`rsp % 16 == 0`).',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Frame Pointers & Stack Args',
        subtitle: 'Anchor local slots cleanly with rbp base frames',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Stable Offsets via rbp',
            explanation:
              'When a function runs dynamic `push`/`pop` instructions inside its body, `rsp` moves around. Anchoring `mov rbp, rsp` lets locals sit safely at fixed negative offsets (`[rbp - 8]`), cleaned in 1 line by `leave`.',
            code: ['push rbp', 'mov rbp, rsp', 'sub rsp, 16', 'mov qword [rbp - 8], 42', 'leave', 'ret'],
            highlightNote: '`leave` is hardware shorthand for `mov rsp, rbp` + `pop rbp`!',
          },
          {
            type: 'token_builder',
            prompt: 'Set up classic frame pointer `rbp` cleanly and tear down with `leave`.',
            codeLines: ['push rbp', 'mov {{0}}, rsp', 'sub rsp, 16', '{{1}}', 'ret'],
            expectedTokens: ['rbp', 'leave'],
            distractors: ['rsp', 'pop', 'exit'],
            explanation: '`mov rbp, rsp` locks the frame base; `leave` restores `rsp` and `rbp` cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `[rbp - 8]` touches caller memory when `sub rsp` is forgotten!',
            lines: [
              'push rbp',
              'mov rbp, rsp',
              'mov qword [rbp - 8], 99',
              'call helper   ; Overwrites [rbp - 8] with call return addr!',
            ],
            bugLine: 2,
            fixed: 'sub rsp, 16\nmov qword [rbp - 8], 99',
            explanation: 'Without advancing `rsp` via `sub rsp, 16`, `[rbp - 8]` is unreserved stack clobbered by `call`!',
          },
          {
            type: 'multiple_choice',
            question: 'What exact two instructions does x86 `leave` execute?',
            options: [
              'pop rsp; ret',
              'mov rsp, rbp; pop rbp',
              'sub rsp, 8; pop rbp',
              'xor rbp, rbp; ret',
            ],
            answer: 1,
            explanation: '`leave` resets `rsp` back to `rbp` and pops the caller’s saved `rbp`.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Stack Master',
        subtitle: 'Prove total mastery of LIFO push/pop, call/ret, and alignment',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write a clean `sum2` subroutine preserving callee-saved `rbx` safely.',
            codeLines: [
              'sum2:',
              '    {{0}} rbx',
              '    mov rbx, rdi',
              '    add rbx, rsi',
              '    mov rax, rbx',
              '    {{1}} rbx',
              '    ret',
            ],
            expectedTokens: ['push', 'pop'],
            distractors: ['mov', 'save', 'load'],
            explanation: 'Saving & restoring `rbx` respects caller contracts while returning sum in `rax`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why `ret` crashes when calling a helper without saving `rbx` cleanly—wait, spot the `rsp` mismatch!',
            lines: [
              'bad_fn:',
              '    sub rsp, 16',
              '    mov rax, 1',
              '    pop rbp',
              '    ret',
            ],
            bugLine: 3,
            fixed: '    add rsp, 16',
            explanation: 'Allocated `16` bytes with `sub rsp, 16`, so clean up with `add rsp, 16` before `ret`!',
          },
          {
            type: 'predict_output',
            prompt: 'After `push 10`, `push 20`, `pop rax`, what sits at top `[rsp]` AND in `rax`?',
            code: ['push 10', 'push 20', 'pop rax'],
            options: ['rax=10, top=20', 'rax=20, top=10', 'rax=20, top=20'],
            answer: 1,
            explanation: 'LIFO pops the most recently pushed value `20` into `rax`, leaving `10` on top.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 4: Memory Addressing & LEA (5 nodes)
  // =========================================================================
  {
    title: 'Memory Addressing & LEA',
    subtitle: 'Read [base + idx*scale] memory operands, size specifiers, and pointer-free LEA math.',
    conceptGraphicType: 'asm_mem',
    guidebook: {
      summary:
        'Square brackets `[ ... ]` **dereference** a memory address (like `*ptr` in C), supporting full scaled-index addressing `[base + index*scale + offset]` (`scale` in `1, 2, 4, 8`). Meanwhile, `lea` (**Load Effective Address**) runs that exact address math WITHOUT reading memory!',
      mentalModel:
        'Compare `mov rax, [rbx + 8]` (reads 8 bytes sitting at RAM address `rbx + 8`) vs `lea rax, [rbx + 8]` (computes the number `rbx + 8` and puts `&ptr[1]` into `rax` without touching RAM at all!).',
      keyTakeaways: [
        'Brackets `[rsi]` read/write RAM at address `rsi`; bare `rsi` holds the address number itself.',
        'Specify exact data width (`byte`, `word`, `dword`, `qword`) whenever an immediate writes to memory: `mov dword [rdi], 5`!',
        '`lea rax, [rdi + rsi*4]` indexes into 32-bit `int` arrays in 1 instruction (`scale` only supports `1`, `2`, `4`, or `8`).',
        'Compilers abuse `lea rax, [rdi + rdi*2]` to multiply by `3`, `5`, or `9` in a single cycle without using `imul`!',
      ],
      keySyntax: [
        {
          title: 'Scaled Array Indexing [base + i*scale]',
          tag: 'ARRAYS',
          code: '; int32 array pointer in rdi, index in rcx\nmov eax, dword [rdi + rcx*4]',
          output: 'Reads element arr[rcx] zero-extended cleanly into rax',
          explanation:
            '`scale = 4` matches 4-byte `int32` (`8` matches 8-byte pointers/`int64`/`double`).',
          notes: [
            'Allowed scales in x86 SIB bytes are strictly `1`, `2`, `4`, or `8`!',
          ],
        },
        {
          title: 'Memory Write Width Specifiers',
          tag: 'WIDTHS',
          code: 'mov byte  [rsi], 0x41    ; Writes 1 byte (\'A\')\nmov dword [rdi], 42      ; Writes 4 bytes (int)\nmov qword [rbx], 0       ; Writes 8 bytes (ptr/long)',
          output: 'Unambiguous RAM writes with exact byte width',
          explanation:
            'Because `42` has no inherent register width, NASM requires `byte`/`word`/`dword`/`qword` before `[addr]`.',
          notes: [
            '`byte` = 1B, `word` = 2B, `dword` = 4B, `qword` = 8B.',
          ],
        },
        {
          title: 'Address & Fast Arithmetic with lea',
          tag: 'LEA TRICK',
          code: 'lea rax, [rdi + 8]        ; rax = &ptr[1], ZERO RAM access!\nlea rdx, [rcx + rcx*4]    ; rdx = rcx * 5 in 1 cycle!',
          output: 'Computes pointers & scaled adds without altering RFLAGS!',
          explanation:
            '`lea` steals x86 address generation hardware to compute `a + b*scale + c` without touching `RFLAGS` or memory.',
          notes: [
            '`mov` vs `lea` is the single best litmus test distinguishing C value vs `&` pointer semantics in ASM!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Missing Size Prefix Writing Constant to Memory',
          buggyCode: 'mov [rdi], 10 ; Ambiguous: 1, 2, 4, or 8 bytes?!',
          fixedCode: 'mov qword [rdi], 10',
          reason:
            'Assemblers refuse `mov [addr], imm` until you state `byte`, `word`, `dword`, or `qword` explicitly.',
        },
        {
          title: 'Confusing lea with Memory Dereference mov',
          buggyCode: 'lea eax, [rdi] ; Just copies pointer rdi into eax, DOES NOT read [rdi]!',
          fixedCode: 'mov eax, [rdi] ; Actually loads int stored at rdi',
          reason:
            'Despite its brackets, `lea` ONLY computes the address inside `[...]`—never dereferencing RAM!',
        },
      ],
      proTip:
        'Use `movzx eax, byte [rsi]` ("Move Zero-Extend") when reading unsigned `uint8_t` bytes or C-string chars into 32/64-bit registers so upper bits start cleanly zeroed (`movsx` sign-extends signed `int8_t`)!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'Brackets [addr] & Widths',
        subtitle: 'Dereference pointers cleanly with byte, dword, and qword sizes',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Value vs Dereferenced Memory',
            explanation:
              'Brackets `[...]` access memory like `*ptr` in C. When storing an immediate constant into memory, declare width: `byte` (1B), `word` (2B), `dword` (4B), or `qword` (8B).',
            code: ['mov rax, [rdi]       ; Read 8-byte int at address rdi', 'mov dword [rsi], 99  ; Write 4-byte 99 to [rsi]'],
            highlightNote: 'Notice `mov rax, rdi` copies the pointer; `mov rax, [rdi]` reads what it points to!',
          },
          {
            type: 'token_builder',
            prompt: 'Write 1-byte NUL terminator `0` at `[rsi]` and read 8 bytes from `[rdi]` into `rax`.',
            codeLines: ['mov {{0}} [rsi], 0', 'mov rax, {{1}}'],
            expectedTokens: ['byte', '[rdi]'],
            distractors: ['qword', 'rdi', 'char'],
            explanation: '`byte` writes exactly 1 byte (`\0`); `[rdi]` dereferences pointer `rdi`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the ambiguous size error when writing `5` to memory.',
            lines: [
              'mov [rbx], 5',
            ],
            bugLine: 0,
            fixed: 'mov qword [rbx], 5',
            explanation: 'Immediate memory writes need explicit width (`byte`/`word`/`dword`/`qword`).',
          },
          {
            type: 'multiple_choice',
            question: 'How many bytes does a `dword` operand represent in x86-64?',
            options: ['1 byte', '2 bytes', '4 bytes (32 bits)', '8 bytes'],
            answer: 2,
            explanation: '`byte`=1, `word`=2, `dword`=4, `qword`=8 bytes.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Scaled Index [base + i*scale]',
        subtitle: 'Walk 4-byte and 8-byte arrays in a single memory operand',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Hardware Array Indexing',
            explanation:
              'Address forms support `[base + index*scale + disp]` where `scale` MUST be `1`, `2`, `4`, or `8`—matching `char`, `int16`, `int32`, and `int64`/pointer sizes cleanly.',
            code: ['; rdi = int64_t* arr, rcx = index i', 'mov rax, [rdi + rcx*8]', 'movzx edx, byte [rsi + rcx]'],
            highlightNote: '`movzx` reads 1 unsigned byte cleanly into `edx` zero-extended!',
          },
          {
            type: 'token_builder',
            prompt: 'Read element `rcx` of an `int32` (`4`-byte) array pointed to by `rdi`.',
            codeLines: ['mov eax, {{0}} [rdi + rcx*{{1}}]'],
            expectedTokens: ['dword', '4'],
            distractors: ['qword', '8', 'byte'],
            explanation: '`int32` elements are 4 bytes (`dword`) spaced at `rcx * 4`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the illegal hardware scale factor `3` in x86 addressing!',
            lines: [
              'mov rax, [rdi + rcx*3]',
            ],
            bugLine: 0,
            fixed: 'lea rax, [rdi + rcx*2]\nadd rax, rcx',
            explanation: 'x86 SIB scales ONLY accept `1`, `2`, `4`, or `8`—never `3` or `6`.',
          },
          {
            type: 'predict_output',
            prompt: 'Base `rdi = 0x2000`, `rcx = 3`. What memory address does `[rdi + rcx*8 + 4]` read?',
            code: ['; rdi = 0x2000, rcx = 3', 'mov eax, dword [rdi + rcx*8 + 4]'],
            options: ['0x2007', '0x201C (28 decimal bytes past base)', '0x2024'],
            answer: 1,
            explanation: '`3 * 8 + 4 = 28` bytes = `0x1C` hex -> `0x201C`.',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: Memory',
        subtitle: 'Check mov vs lea and zero-extension widths',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Compute pointer `&arr[i]` for an 8-byte array WITHOUT reading RAM.',
            codeLines: ['{{0}} rax, [rdi + rsi*{{1}}]'],
            expectedTokens: ['lea', '8'],
            distractors: ['mov', '4', 'ptr'],
            explanation: '`lea` computes `rdi + rsi*8` into `rax` without dereferencing memory.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why upper bits of `rax` keep stale junk when loading a single char byte into `al`!',
            lines: [
              'mov rax, 0xFFFF',
              'mov al, byte [rsi]',
            ],
            bugLine: 1,
            fixed: 'movzx eax, byte [rsi]',
            explanation: 'Writing `al` leaves upper 56 bits intact! `movzx eax, byte [rsi]` clears upper bits cleanly.',
          },
          {
            type: 'multiple_choice',
            question: 'What does `lea rax, [rdi + rdi*4]` leave inside `rax` if `rdi = 6`?',
            options: ['Reads RAM at addr 30', 'Sets rax = 30 without touching RAM', 'Syntax error', 'Sets rax = 6'],
            answer: 1,
            explanation: '`lea` never dereferences `[...]`—it fast-computes `6 + 6*4 = 30`!',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Strings & Data Directives',
        subtitle: 'Lay out static bytes with .data, db, and zero-terminated strings',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Defining Static Data in .data / .rodata',
            explanation:
              'Define read-only messages using `section .rodata` and `db` ("Define Byte", ending C-strings with `, 0`). Load string addresses into registers via `lea rax, [rel msg]`.',
            code: ['section .rodata', 'msg db "Boot", 10, 0   ; "Boot\\n\\0"', 'section .text', 'lea rdi, [rel msg]'],
            highlightNote: '`[rel msg]` generates modern position-independent PIC addresses (`RIP`-relative)!',
          },
          {
            type: 'token_builder',
            prompt: 'Define a null-terminated `"OK"` byte string and load its address via PIC.',
            codeLines: ['section .rodata', 'ok_str {{0}} "OK", 0', 'section .text', '{{1}} rdi, [rel ok_str]'],
            expectedTokens: ['db', 'lea'],
            distractors: ['dq', 'mov', 'dw'],
            explanation: '`db` emits bytes (`0` terminator); `lea` takes the address cleanly.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `printf` runs off the end of this static string!',
            lines: [
              'section .rodata',
              'banner db "CodeLingo"',
            ],
            bugLine: 1,
            fixed: 'banner db "CodeLingo", 0',
            explanation: 'C-strings require an explicit trailing `, 0` NUL terminator byte!',
          },
          {
            type: 'multiple_choice',
            question: 'In NASM, what does `msg_len equ $ - msg` compute?',
            options: [
              'Allocates heap dollars',
              'Constant byte length between label `msg` and current assembly position `$`',
              'Runtime strlen loop',
              'Multiplies address by 8',
            ],
            answer: 1,
            explanation: '`$` is current offset and `equ` freezes compile-time constants cleanly.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: Pointer Engineer',
        subtitle: 'Conquer [base + i*scale], mov vs lea, and size prefixes',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Zero-extend a byte char from `[rsi + rcx]` and compute `&arr[3]` in `rax`.',
            codeLines: [
              '{{0}} edx, byte [rsi + rcx]',
              '{{1}} rax, [rdi + 24]   ; 3 * 8 bytes',
            ],
            expectedTokens: ['movzx', 'lea'],
            distractors: ['mov', 'add', 'dword'],
            explanation: '`movzx` zero-extends bytes safely; `lea` computes offsets without dereferencing.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch why writing `1` to `[rax]` fails assembling.',
            lines: [
              'mov [rax], 1',
            ],
            bugLine: 0,
            fixed: 'mov byte [rax], 1',
            explanation: 'Specify `byte`/`dword`/`qword` before `[rax]` when assigning constants.',
          },
          {
            type: 'predict_output',
            prompt: 'Given `rdi` points to `[100, 200, 300]` (`64-bit qwords`), what loads `300` into `rax`?',
            code: ['mov rax, [rdi + 16]'],
            options: ['100', '200', '300'],
            answer: 2,
            explanation: 'Index `2 * 8 bytes = +16` bytes accesses `arr[2] = 300`.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // UNIT 5: Linux Syscalls & System V ABI (5 nodes)
  // =========================================================================
  {
    title: 'Syscalls & Calling ABI',
    subtitle: 'Pass args in System V registers (rdi..r9), preserve callee-saves, and invoke syscall.',
    conceptGraphicType: 'asm_syscall',
    guidebook: {
      summary:
        'A calling convention (**ABI**) defines which registers hold function parameters, which hold the return value, and which must survive intact across calls. On 64-bit Linux/macOS (**System V AMD64 ABI**), args flow cleanly into `rdi, rsi, rdx, rcx, r8, r9`, returning in `rax`.',
      mentalModel:
        'Memorize the 6-register argument mnemonic **"Diane’s Silk Dress Costs `$89`"**: **`rdi, rsi, rdx, rcx, r8, r9`**! For kernel `syscall`, swap `rcx` -> `r10`, place the syscall number in `rax`, and invoke `syscall`.',
      keyTakeaways: [
        'Function arguments arrive in: **1:`rdi`, 2:`rsi`, 3:`rdx`, 4:`rcx`, 5:`r8`, 6:`r9`**; return value leaves in `rax`.',
        'Kernel `syscall` passes `rax` = syscall ID (e.g. `1` = `write`, `60` = `exit` on Linux x86-64) with args in `rdi, rsi, rdx, r10, r8, r9`.',
        'Caller-saved (scratch, free to trash inside functions): `rax, rdi, rsi, rdx, rcx, r8, r9, r10, r11`.',
        'Callee-saved (MUST push/pop if modified!): `rbx, rbp, r12, r13, r14, r15` (+ `rsp` unchanged).',
      ],
      keySyntax: [
        {
          title: 'Linux x86-64 Write & Exit Syscalls',
          tag: 'SYSCALL',
          code: '; sys_write(fd=1, buf=msg, len=5)\nmov eax, 1          ; syscall #1 = write\nmov edi, 1          ; arg1: stdout fd\nlea rsi, [rel msg]  ; arg2: buffer ptr\nmov rdx, 5          ; arg3: byte count\nsyscall\n\n; sys_exit(code=0)\nmov eax, 60\nxor edi, edi\nsyscall',
          output: 'Prints 5 bytes cleanly to stdout and exits code 0',
          explanation:
            'Setting `rax = 60` (`sys_exit`) and `rdi = 0` cleanly tells the Linux kernel to terminate the process without segfaulting off the end of `.text`!',
          notes: [
            '`syscall` preserves all registers EXCEPT `rax` (return/errno), `rcx`, and `r11`.',
          ],
        },
        {
          title: 'Multi-Argument Call Following System V ABI',
          tag: 'ABI CALL',
          code: '; clamp(value=42, min=0, max=100)\nmov rdi, 42\nxor esi, esi\nmov rdx, 100\ncall clamp          ; Result comes back in rax',
          output: 'Passes (42, 0, 100) matching C functions cleanly!',
          explanation:
            'Following System V ABI means your hand-written ASM calls `printf`/`malloc` and links directly into C programs!',
          notes: [
            'Notice Windows x64 ABI differs (`rcx, rdx, r8, r9`!).',
          ],
        },
        {
          title: 'Callee-Saved vs Scratch Register Rule',
          tag: 'REGISTER PRESERVE',
          code: 'my_fn:\n    push rbx        ; Preserved! Required before modifying rbx\n    mov rbx, rdi\n    call other_fn   ; Safe: rbx survives other_fn!\n    mov rax, rbx\n    pop rbx\n    ret',
          output: 'Safely carries `rbx` across inner calls cleanly',
          explanation:
            'Scratch registers (`rdi`, `rcx`) vanish after `call other_fn`, whereas `rbx`/`r12`..`r15` are guaranteed preserved across `call`!',
          notes: [
            'Don’t assume `rdi` still holds arg 1 after calling another function!',
          ],
        },
      ],
      commonMistakes: [
        {
          title: 'Missing sys_exit Syscall at Program End',
          buggyCode: 'main_entry:\n    mov eax, 1\n    syscall\n    ; Execution falls into random garbage -> Segfault!',
          fixedCode: '    mov eax, 60\n    xor edi, edi\n    syscall',
          reason:
            'Top-level `_start` has no C caller to `ret` to! Always invoke `sys_exit` (`eax = 60`) cleanly.',
        },
        {
          title: 'Assuming rdi Survives a Nested Function Call',
          buggyCode: 'fn:\n    call log_msg    ; log_msg is free to trash rdi!\n    mov rax, rdi    ; BUG: rdi now holds junk!',
          fixedCode: 'fn:\n    push rbx\n    mov rbx, rdi\n    call log_msg\n    mov rax, rbx\n    pop rbx\n    ret',
          reason:
            '`rdi` is caller-saved (volatile); move values needed across `call` into a callee-saved register like `rbx` or `r12`.',
        },
      ],
      proTip:
        'Because `syscall` clobbers `rcx` (storing user `rip`) and `r11` (`RFLAGS`), Linux kernel syscalls pass Argument 4 inside **`r10`** rather than C’s normal `rcx`!',
    },
    nodes: [
      {
        kind: 'lesson',
        title: 'System V Argument Order',
        subtitle: 'Pass C/ASM args cleanly in rdi, rsi, rdx, rcx, r8, r9',
        exercises: [
          {
            type: 'theory_bite',
            title: 'The 6 Fast Argument Registers',
            explanation:
              'On Linux/macOS x86-64, arguments 1–6 go into `rdi, rsi, rdx, rcx, r8, r9` in order, and return values arrive in `rax`.',
            code: ['; sum3(10, 20, 30)', 'mov rdi, 10', 'mov rsi, 20', 'mov rdx, 30', 'call sum3    ; rax = 60'],
            highlightNote: 'Remember `D` -> `S` -> `D` -> `C` -> `8` -> `9`!',
          },
          {
            type: 'token_builder',
            prompt: 'Call `max2(15, 42)` using System V arg 1 and arg 2 registers.',
            codeLines: ['mov {{0}}, 15', 'mov {{1}}, 42', 'call max2'],
            expectedTokens: ['rdi', 'rsi'],
            distractors: ['rax', 'rdx', 'rcx'],
            explanation: 'Arg 1 sits in `rdi`, Arg 2 sits in `rsi`, and return leaves in `rax`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the wrong register expecting arg 1 to arrive in `rax`!',
            lines: [
              '; int doubleIt(int x) -> returns x * 2',
              'doubleIt:',
              '    shl rax, 1   ; Caller put x in rdi, NOT rax!',
              '    ret',
            ],
            bugLine: 2,
            fixed: '    mov rax, rdi\n    shl rax, 1',
            explanation: 'Arg 1 enters in `rdi` and leaves in `rax` (`mov rax, rdi`).',
          },
          {
            type: 'multiple_choice',
            question: 'Which register carries a function’s integer or pointer **return value** back to caller?',
            options: ['rdi', 'rsi', 'rax', 'rsp'],
            answer: 2,
            explanation: '`rax` (`eax` for 32-bit ints) always carries the primary return value.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Linux x86-64 Syscalls',
        subtitle: 'Write output to stdout and exit cleanly with syscall',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Talking Directly to the OS Kernel',
            explanation:
              'Load the syscall ID into `eax`, place arguments in `rdi, rsi, rdx` (`r10` for arg 4!), and run `syscall`. Linux `write = 1`, `exit = 60`.',
            code: ['mov eax, 1     ; sys_write', 'mov edi, 1     ; fd = stdout', 'syscall', 'mov eax, 60    ; sys_exit', 'xor edi, edi   ; exit code 0', 'syscall'],
            highlightNote: 'Inside `_start`, forgetting `sys_exit` crashes into invalid opcodes!',
          },
          {
            type: 'token_builder',
            prompt: 'Invoke Linux `sys_exit(0)` cleanly after work finishes.',
            codeLines: ['mov eax, {{0}}', 'xor edi, edi', '{{1}}'],
            expectedTokens: ['60', 'syscall'],
            distractors: ['1', 'ret', 'int'],
            explanation: 'Syscall `60` terminates the process cleanly with status `edi` (`0`).',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why `syscall` receives arg 4 in the wrong register (`rcx` gets overwritten by CPU)!',
            lines: [
              'mov rax, 9        ; sys_mmap',
              'mov rcx, 0x22     ; Clobbered by syscall!',
              'syscall',
            ],
            bugLine: 1,
            fixed: 'mov r10, 0x22',
            explanation: 'Syscalls replace arg 4 `rcx` with `r10` because `syscall` uses `rcx` internally.',
          },
          {
            type: 'predict_output',
            prompt: 'In `mov eax, 1; mov edi, 1; lea rsi, [rel s]; mov edx, 2; syscall` where `s = "Go!"`: what prints?',
            code: ['; sys_write(1, "Go!", 2)'],
            options: ['Go!', 'Go', 'Error'],
            answer: 1,
            explanation: '`rdx = 2` limits kernel `sys_write` to the first 2 bytes (`"Go"`).',
          },
        ],
      },
      {
        kind: 'checkpoint_cube',
        title: 'Checkpoint Cube: ABI',
        subtitle: 'Lock down volatile scratch vs callee-saved registers',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Safely preserve `rdi` across a nested `call helper` using callee-saved `r12`.',
            codeLines: ['{{0}} r12', 'mov r12, rdi', 'call helper', 'mov rax, r12', '{{1}} r12', 'ret'],
            expectedTokens: ['push', 'pop'],
            distractors: ['mov', 'save', 'keep'],
            explanation: '`r12` survives `call helper`, provided you push/pop `r12` cleanly for your own caller!',
          },
          {
            type: 'find_bug',
            prompt: 'Spot the volatile register assumption across a function call!',
            lines: [
              'calc:',
              '    mov r10, rdi',
              '    call side_effect  ; Caller-saved r10 may be wiped!',
              '    mov rax, r10',
              '    ret',
            ],
            bugLine: 1,
            fixed: '    push rbx\n    mov rbx, rdi',
            explanation: '`r10` is scratch/caller-saved; use callee-saved `rbx` or `r12..r15` across calls.',
          },
          {
            type: 'multiple_choice',
            question: 'Which set contains ONLY **callee-saved** registers in System V x86-64 ABI?',
            options: [
              'rax, rdi, rsi',
              'rbx, rbp, r12, r13, r14, r15',
              'rcx, rdx, r8, r9',
              'r10, r11',
            ],
            answer: 1,
            explanation: '`rbx`, `rbp`, and `r12..r15` must be saved & restored if mutated.',
          },
        ],
      },
      {
        kind: 'lesson',
        title: 'Integrating ASM & C',
        subtitle: 'Export symbols cleanly with global and obey C ABI rules',
        exercises: [
          {
            type: 'theory_bite',
            title: 'Exporting Assembly Functions to C/Rust',
            explanation:
              'Add `global my_add` so linkers expose `my_add`, match System V register order (`rdi, rsi` -> `rax`), and leave `rbp`/`rbx`/`rsp` restored on `ret`.',
            code: ['section .text', 'global fast_add', 'fast_add:', '    lea eax, [rdi + rsi]', '    ret'],
            highlightNote: 'Notice `lea eax, [rdi + rsi]` adds two ints cleanly in 1 instruction without altering flags!',
          },
          {
            type: 'token_builder',
            prompt: 'Export `dot2(a, b)` for C callers cleanly in `.text`.',
            codeLines: ['section .text', '{{0}} dot2', 'dot2:', '    mov rax, rdi', '    imul rax, {{1}}', '    ret'],
            expectedTokens: ['global', 'rsi'],
            distractors: ['export', 'rbx', 'rdx'],
            explanation: '`global` exports `dot2` cleanly; arg 2 arrives in `rsi`.',
          },
          {
            type: 'find_bug',
            prompt: 'Spot why linking C `extern int get_id(void);` sees an undefined symbol!',
            lines: [
              'section .text',
              'get_id:',
              '    mov eax, 7',
              '    ret',
            ],
            bugLine: 1,
            fixed: 'global get_id\nget_id:',
            explanation: 'Labels are local to `.asm` unless explicitly exported via `global`.',
          },
          {
            type: 'multiple_choice',
            question: 'Which NASM directive marks stacks non-executable on Linux (`section .note.GNU-stack`)?',
            options: [
              'Important security defense against stack buffer execution',
              'Required for registers to exist',
              'Enables 16-bit real mode',
              'Disables syscalls',
            ],
            answer: 0,
            explanation: 'Adding `section .note.GNU-stack noalloc noexec` tells linkers not to allow code execution on stack pages.',
          },
        ],
      },
      {
        kind: 'boss_challenge',
        title: 'Boss: x86-64 Systems Pro',
        subtitle: 'Synthesize System V ABI, syscalls, stack saves, and lea',
        exercises: [
          {
            type: 'token_builder',
            prompt: 'Write an exported `clamp_zero(x)` returning `max(0, x)` and printing safely via `sys_write`.',
            codeLines: [
              'global clamp_zero',
              'clamp_zero:',
              '    xor eax, eax',
              '    test rdi, rdi',
              '    {{0}} done',
              '    mov rax, rdi',
              'done:',
              '    {{1}}',
            ],
            expectedTokens: ['js', 'ret'],
            distractors: ['jz', 'syscall', 'jmp'],
            explanation: 'Sign-flag jump `js` branches cleanly on negative `rdi`, returning `0` or `rdi` in `rax`.',
          },
          {
            type: 'find_bug',
            prompt: 'Catch the missing clean exit at the bottom of Linux `_start`!',
            lines: [
              '_start:',
              '    mov eax, 1',
              '    mov edi, 1',
              '    syscall',
              '    ret',
            ],
            bugLine: 4,
            fixed: '    mov eax, 60\n    xor edi, edi\n    syscall',
            explanation: '`_start` has zero caller return frame—terminate cleanly using `sys_exit` (`60`), never `ret`!',
          },
          {
            type: 'predict_output',
            prompt: 'If `foo` puts `(10, 20, 30)` in `(rdi, rsi, rdx)` and calls `add3`, what holds `20`?',
            code: ['; Inside add3(a, b, c) following System V AMD64 ABI'],
            options: ['rax', 'rsi', 'rdx'],
            answer: 1,
            explanation: 'Parameter 2 (`b`) always arrives in `rsi` (`1:rdi, 2:rsi, 3:rdx`).',
          },
        ],
      },
    ],
  },
];
