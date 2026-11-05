/**
 * Duolingo-style programming curriculum for Python, C++, JavaScript, and Go.
 * 4 languages × 3 units × 4 nodes × 4 exercises = 192 interactive exercises.
 * All content is strictly in English.
 */

import { Colors } from '@/theme';

export type LangId = 'python' | 'cpp' | 'js' | 'go';

interface BaseExercise {
  id: string;
  explanation: string;
}

/** 1. Tap-to-Build Code Bank */
export interface CodeBlocksExercise extends BaseExercise {
  type: 'code_blocks';
  prompt: string;
  tokens: string[];
  distractors: string[];
  output: string;
}

/** 2. Spot the Bug */
export interface FindBugExercise extends BaseExercise {
  type: 'find_bug';
  prompt: string;
  lines: string[];
  bugLine: number;
  fixed: string;
}

/** 3. Predict the Output (3 tactile choice cards) */
export interface PredictOutputExercise extends BaseExercise {
  type: 'predict_output';
  prompt: string;
  code: string[];
  options: [string, string, string];
  answer: number;
}

/** 4. Multiple Choice Concept (4 tactile choice cards) */
export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice';
  question: string;
  options: [string, string, string, string];
  answer: number;
}

export type Exercise =
  | CodeBlocksExercise
  | FindBugExercise
  | PredictOutputExercise
  | MultipleChoiceExercise;

export interface GuideTip {
  heading: string;
  summary: string;
  code: string[];
}

export interface LessonNode {
  id: string;
  lang: LangId;
  unitIndex: number;
  nodeIndex: number; // 0..3 within unit
  globalIndex: number; // 0..11 across language
  title: string;
  subtitle: string;
  icon: string;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  lang: LangId;
  unitNumber: number; // 1, 2, 3
  sectionLabel: string; // e.g. "SECTION 1, UNIT 1"
  title: string;
  description: string;
  color: string;
  lipColor: string;
  guidebook: GuideTip[];
  nodes: LessonNode[];
}

export interface Language {
  id: LangId;
  name: string;
  short: string;
  badgeBg: string;
  badgeLip: string;
  fileExt: string;
  learners: string;
  units: Unit[];
}

interface UnitSeed {
  title: string;
  description: string;
  guidebook: GuideTip[];
  nodeTitles: [string, string, string, string];
  baseExercises: [
    Omit<CodeBlocksExercise, 'id'>,
    Omit<FindBugExercise, 'id'>,
    Omit<PredictOutputExercise, 'id'>,
    Omit<MultipleChoiceExercise, 'id'>,
  ][];
}

const UNIT_PALETTE = [
  { color: Colors.violet, lipColor: Colors.violetLip },
  { color: Colors.sky, lipColor: Colors.skyLip },
  { color: Colors.emerald, lipColor: Colors.emeraldLip },
] as const;

const NODE_ICONS = ['star', 'code-slash', 'barbell', 'trophy'] as const;

function buildUnits(lang: LangId, seeds: [UnitSeed, UnitSeed, UnitSeed]): Unit[] {
  return seeds.map((seed, uIdx) => {
    const palette = UNIT_PALETTE[uIdx];
    const nodes: LessonNode[] = seed.nodeTitles.map((nodeTitle, nIdx) => {
      const globalIndex = uIdx * 4 + nIdx;
      const exGroup = seed.baseExercises[nIdx];
      const exercises: Exercise[] = exGroup.map((ex, eIdx) => ({
        ...ex,
        id: `${lang}-u${uIdx + 1}-n${nIdx + 1}-e${eIdx + 1}`,
      }));
      return {
        id: `${lang}-${globalIndex}`,
        lang,
        unitIndex: uIdx,
        nodeIndex: nIdx,
        globalIndex,
        title: nodeTitle,
        subtitle: `Lesson ${nIdx + 1} of 4`,
        icon: NODE_ICONS[nIdx],
        exercises,
      };
    });

    return {
      id: `${lang}-unit-${uIdx + 1}`,
      lang,
      unitNumber: uIdx + 1,
      sectionLabel: `SECTION 1, UNIT ${uIdx + 1}`,
      title: seed.title,
      description: seed.description,
      color: palette.color,
      lipColor: palette.lipColor,
      guidebook: seed.guidebook,
      nodes,
    };
  });
}

// ============================================================================
// 1. PYTHON
// ============================================================================
const pythonUnits: [UnitSeed, UnitSeed, UnitSeed] = [
  {
    title: 'Variables & Memory',
    description: 'Store text, numbers, and booleans using clean Python syntax.',
    guidebook: [
      {
        heading: 'Creating Variables',
        summary: 'Python assigns values with = and infers the data type automatically without a keyword.',
        code: ['username = "Alex"', 'score = 250', 'is_active = True'],
      },
      {
        heading: 'Printing & String Formatting',
        summary: 'Use print() to display values or f-strings to embed expressions directly inside text.',
        code: ['level = 4', 'print(f"Player level: {level}")'],
      },
    ],
    nodeTitles: ['Printing Output', 'Variables & Types', 'String Formatting', 'Unit 1 Review'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Build the code statement to print "Hello World"',
          tokens: ['print', '(', '"Hello World"', ')'],
          distractors: ['echo', ';', 'console'],
          output: 'Hello World',
          explanation: 'In Python, print() outputs text or variables directly to the console.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['player = "Luna"', 'coins = 50', 'print("Player: " + player)', 'print("Coins: " + coins)'],
          bugLine: 3,
          fixed: 'print("Coins: " + str(coins))',
          explanation: 'Python cannot concatenate a string and an integer directly; wrap coins in str() or use an f-string.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['x = 5', 'y = x', 'x = 12', 'print(y)'],
          options: ['5', '12', '17'],
          answer: 0,
          explanation: 'y copies the value 5 when assigned; changing x later does not alter y.',
        },
        {
          type: 'multiple_choice',
          question: 'Which Python data type represents the value 3.14?',
          options: ['int', 'float', 'str', 'bool'],
          answer: 1,
          explanation: 'Numbers with a decimal point are stored as float values in Python.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Assign the integer 100 to a variable named energy',
          tokens: ['energy', '=', '100'],
          distractors: ['let', 'int', '=='],
          output: 'energy -> 100',
          explanation: 'Python variables are created the moment you assign a value using =.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['is_ready = true', 'speed = 10', 'name = "Nova"', 'print(name)'],
          bugLine: 0,
          fixed: 'is_ready = True',
          explanation: 'Boolean literals in Python are capitalized: True and False.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['a = 10', 'b = 3', 'print(a // b)'],
          options: ['3', '3.33', '1'],
          answer: 0,
          explanation: 'The // operator performs floor division and discards the remainder.',
        },
        {
          type: 'multiple_choice',
          question: 'Which function returns the data type of a variable in Python?',
          options: ['typeof()', 'type()', 'kind()', 'class()'],
          answer: 1,
          explanation: 'Calling type(x) returns the class/type of x.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Build an f-string that prints the user variable',
          tokens: ['print', '(', 'f"Hi {user}"', ')'],
          distractors: ['"Hi {user}"', '$user', 'printf'],
          output: 'Hi Alex',
          explanation: 'Prefixing a string with f lets you evaluate variables inside curly braces {}.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['xp = 40', 'bonus = "10"', 'total = xp + int(bonus)', 'print(Total)'],
          bugLine: 3,
          fixed: 'print(total)',
          explanation: 'Python variable names are case-sensitive: total and Total are different identifiers.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['word = "Duo"', 'print(word * 2)'],
          options: ['DuoDuo', 'Duo2', 'TypeError'],
          answer: 0,
          explanation: 'Multiplying a string by an integer repeats the string that many times.',
        },
        {
          type: 'multiple_choice',
          question: 'What does int("42") return?',
          options: ['"42"', '42', '42.0', 'Error'],
          answer: 1,
          explanation: 'int() parses a numeric string and returns an integer value.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Swap the values of a and b in one Python line',
          tokens: ['a, b', '=', 'b, a'],
          distractors: ['swap', '==', 'let'],
          output: 'a and b swapped',
          explanation: 'Python supports tuple unpacking to swap two variables without a temporary variable.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['price = 20', 'tax = 5', '2total = price + tax', 'print(price)'],
          bugLine: 2,
          fixed: 'total_2 = price + tax',
          explanation: 'Variable names in Python cannot start with a digit.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['msg = "python"', 'print(len(msg))'],
          options: ['6', '5', '7'],
          answer: 0,
          explanation: 'len() returns the number of characters in the string "python", which is 6.',
        },
        {
          type: 'multiple_choice',
          question: 'Which operator calculates the remainder of a division?',
          options: ['/', '//', '%', '**'],
          answer: 2,
          explanation: 'The modulo operator % returns the remainder of a division.',
        },
      ],
    ],
  },
  {
    title: 'Control Flow & Loops',
    description: 'Branch logic with if/elif/else and repeat work with for and while loops.',
    guidebook: [
      {
        heading: 'Conditional Statements',
        summary: 'Python uses indentation (4 spaces) and colons to define code blocks inside if, elif, and else.',
        code: ['if score >= 90:', '    print("Rank A")', 'elif score >= 70:', '    print("Rank B")'],
      },
      {
        heading: 'For Loops & range()',
        summary: 'range(n) generates numbers from 0 up to n - 1.',
        code: ['for i in range(3):', '    print(i)  # 0, 1, 2'],
      },
    ],
    nodeTitles: ['If Statements', 'Elif & Logical Ops', 'For Loops', 'While & Break'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Build the condition: if level is at least 10',
          tokens: ['if', 'level', '>=', '10', ':'],
          distractors: ['then', '(', '=>'],
          output: 'Condition evaluated -> True',
          explanation: 'Every if header in Python ends with a colon : and indents its body.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['hp = 30', 'if hp < 50', '    print("Low HP")', 'print("Done")'],
          bugLine: 1,
          fixed: 'if hp < 50:',
          explanation: 'Missing colon : at the end of the if statement causes a SyntaxError.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['n = 7', 'if n % 2 == 0:', '    print("even")', 'else:', '    print("odd")'],
          options: ['odd', 'even', '7'],
          answer: 0,
          explanation: '7 modulo 2 equals 1, so the else branch runs and prints "odd".',
        },
        {
          type: 'multiple_choice',
          question: 'Which operator checks equality between two values in Python?',
          options: ['=', '==', '===', ':='],
          answer: 1,
          explanation: '== compares two values for equality, while = assigns a value.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Check if both has_key and is_open are true',
          tokens: ['if', 'has_key', 'and', 'is_open', ':'],
          distractors: ['&&', 'or', 'then'],
          output: 'Access granted',
          explanation: 'Python uses the plain English keyword "and" for logical conjunction.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['temp = 25', 'if temp > 30:', '    print("Hot")', 'else if temp > 20:', '    print("Warm")'],
          bugLine: 3,
          fixed: 'elif temp > 20:',
          explanation: 'Python uses the keyword elif instead of else if.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['a = True', 'b = False', 'print(a or b)'],
          options: ['True', 'False', 'None'],
          answer: 0,
          explanation: 'The or operator returns True if at least one operand is True.',
        },
        {
          type: 'multiple_choice',
          question: 'Which value is considered falsy in Python?',
          options: ['"0"', '[0]', '0', 'True'],
          answer: 2,
          explanation: 'The integer 0 (along with "", [], and None) is falsy in boolean contexts.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Loop variable i through 5 iterations using range',
          tokens: ['for', 'i', 'in', 'range(5)', ':'],
          distractors: ['of', 'foreach', ';'],
          output: '0 1 2 3 4',
          explanation: 'range(5) produces 0, 1, 2, 3, 4 in a for-in loop.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['total = 0', 'for n in [1, 2, 3]:', 'total += n', 'print(total)'],
          bugLine: 2,
          fixed: '    total += n',
          explanation: 'The body of a for loop must be indented, otherwise Python raises an IndentationError.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['for i in range(1, 4):', '    print(i, end=" ")'],
          options: ['1 2 3', '0 1 2 3', '1 2 3 4'],
          answer: 0,
          explanation: 'range(1, 4) starts at 1 and stops before 4, printing 1 2 3.',
        },
        {
          type: 'multiple_choice',
          question: 'How many numbers does range(4) generate?',
          options: ['3', '4', '5', '1'],
          answer: 1,
          explanation: 'range(4) generates 4 numbers: 0, 1, 2, and 3.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Build a while loop that runs while count > 0',
          tokens: ['while', 'count', '>', '0', ':'],
          distractors: ['until', 'loop', 'do'],
          output: 'Countdown active',
          explanation: 'A while loop repeats its indented block as long as the condition stays True.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug (infinite loop)',
          lines: ['n = 3', 'while n > 0:', '    print(n)', '    n += 1'],
          bugLine: 3,
          fixed: '    n -= 1',
          explanation: 'Incrementing n makes it grow forever; decrement with n -= 1 so the loop terminates.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['for x in [1, 2, 3]:', '    if x == 2:', '        break', '    print(x)'],
          options: ['1', '1 2', '1 2 3'],
          answer: 0,
          explanation: 'When x reaches 2, break exits the loop immediately after printing only 1.',
        },
        {
          type: 'multiple_choice',
          question: 'Which keyword skips to the next loop iteration without exiting?',
          options: ['pass', 'skip', 'continue', 'break'],
          answer: 2,
          explanation: 'continue jumps straight to the next iteration of the loop.',
        },
      ],
    ],
  },
  {
    title: 'Functions & Data Structures',
    description: 'Write reusable functions and organize data with lists and dictionaries.',
    guidebook: [
      {
        heading: 'Defining Functions',
        summary: 'Use def to define a function and return to send a value back to the caller.',
        code: ['def multiply(a, b=2):', '    return a * b'],
      },
      {
        heading: 'Lists & Dictionaries',
        summary: 'Lists store ordered items by index [0]; dictionaries store key-value pairs {key: value}.',
        code: ['items = ["sword", "shield"]', 'user = {"name": "Aria", "lvl": 5}'],
      },
    ],
    nodeTitles: ['Defining Functions', 'Return Values', 'Lists & Indexing', 'Dictionaries'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Define a function named greet that takes name',
          tokens: ['def', 'greet', '(name)', ':'],
          distractors: ['function', 'func', '=>'],
          output: 'function greet(name)',
          explanation: 'Python functions start with the def keyword, parameter list, and a colon.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['def say_hi():', '    print("Hi!")', '', 'say_hi'],
          bugLine: 3,
          fixed: 'say_hi()',
          explanation: 'Without parentheses (), say_hi only references the function object without calling it.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['def power(x, p=2):', '    return x ** p', 'print(power(3))'],
          options: ['9', '6', '8'],
          answer: 0,
          explanation: 'p defaults to 2 when omitted, so 3 ** 2 evaluates to 9.',
        },
        {
          type: 'multiple_choice',
          question: 'Which keyword starts a function definition in Python?',
          options: ['func', 'function', 'def', 'fn'],
          answer: 2,
          explanation: 'def (short for define) declares a new function in Python.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Return the sum of a and b from a function',
          tokens: ['return', 'a', '+', 'b'],
          distractors: ['yield', 'output', 'print'],
          output: 'Returns a + b',
          explanation: 'The return statement exits the function and hands the computed value to the caller.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['def add(a, b):', '    a + b', 'res = add(4, 6)', 'print(res)'],
          bugLine: 1,
          fixed: '    return a + b',
          explanation: 'Without return, the function implicitly returns None.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['def double(n):', '    return n * 2', 'print(double(double(4)))'],
          options: ['16', '8', '12'],
          answer: 0,
          explanation: 'double(4) returns 8, and double(8) returns 16.',
        },
        {
          type: 'multiple_choice',
          question: 'What does a Python function return if it has no return statement?',
          options: ['0', 'False', 'None', '""'],
          answer: 2,
          explanation: 'Every Python function without an explicit return value returns None.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Append the string "gem" to the loot list',
          tokens: ['loot', '.', 'append', '("gem")'],
          distractors: ['push', 'add', 'insert'],
          output: 'loot -> [..., "gem"]',
          explanation: 'list.append(item) adds a new element to the end of a Python list.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['scores = [10, 20, 30]', 'first = scores[0]', 'last = scores[3]', 'print(first, last)'],
          bugLine: 2,
          fixed: 'last = scores[2]',
          explanation: 'A 3-element list has valid indices 0, 1, and 2; scores[3] raises an IndexError.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['nums = [5, 10, 15]', 'print(nums[-1])'],
          options: ['15', '5', '-1'],
          answer: 0,
          explanation: 'Negative index -1 accesses the last element of a list.',
        },
        {
          type: 'multiple_choice',
          question: 'What is the index of the first element in a Python list?',
          options: ['1', '0', '-1', 'None'],
          answer: 1,
          explanation: 'Python lists are zero-indexed, so the first element is at index 0.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Access the "xp" key inside the player dictionary',
          tokens: ['player', '[', '"xp"', ']'],
          distractors: ['player.xp', '("xp")', '->'],
          output: 'player["xp"] -> 500',
          explanation: 'Dictionary values are accessed by placing the key inside square brackets.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['user = {"name": "Kai"}', 'user["level"] = 3', 'print(user["score"])', 'print(user["name"])'],
          bugLine: 2,
          fixed: 'print(user.get("score", 0))',
          explanation: 'Accessing a missing key with [] raises a KeyError; use .get() for a safe default.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['d = {"a": 1, "b": 2}', 'd["a"] = 9', 'print(d["a"])'],
          options: ['9', '1', '2'],
          answer: 0,
          explanation: 'Assigning to an existing dictionary key overwrites its previous value.',
        },
        {
          type: 'multiple_choice',
          question: 'Which syntax creates an empty dictionary in Python?',
          options: ['[]', '()', '{}', 'set()'],
          answer: 2,
          explanation: 'Curly braces {} create an empty dictionary.',
        },
      ],
    ],
  },
];

// ============================================================================
// 2. C++
// ============================================================================
const cppUnits: [UnitSeed, UnitSeed, UnitSeed] = [
  {
    title: 'Types & Streams',
    description: 'Master static types, std::cout output, and arithmetic in C++.',
    guidebook: [
      {
        heading: 'Static Variables & Semicolons',
        summary: 'Every C++ variable declares its type upfront, and every statement ends with a semicolon ;.',
        code: ['int lives = 3;', 'double speed = 9.8;', 'char rank = \'S\';'],
      },
      {
        heading: 'Console Output with std::cout',
        summary: 'Use the insertion operator << to send values to std::cout.',
        code: ['#include <iostream>', 'std::cout << "XP: " << 120 << "\\n";'],
      },
    ],
    nodeTitles: ['Hello std::cout', 'Primitive Types', 'Integer Division', 'Const & Auto'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Send "Ready" to standard output',
          tokens: ['std::cout', '<<', '"Ready"', ';'],
          distractors: ['>>', 'print', ':'],
          output: 'Ready',
          explanation: 'std::cout uses the stream insertion operator << followed by a semicolon.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['#include <iostream>', 'int main() {', '    int score = 10', '    std::cout << score;', '}'],
          bugLine: 2,
          fixed: '    int score = 10;',
          explanation: 'Every declaration statement in C++ must end with a semicolon ;.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['int a = 4;', 'int b = 6;', 'std::cout << a + b;'],
          options: ['10', '46', '24'],
          answer: 0,
          explanation: 'a + b adds the two integers and outputs 10.',
        },
        {
          type: 'multiple_choice',
          question: 'Which header is required to use std::cout?',
          options: ['<stdio.h>', '<iostream>', '<string>', '<vector>'],
          answer: 1,
          explanation: '<iostream> defines standard input/output streams like std::cout and std::cin.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Declare an integer variable lives equal to 3',
          tokens: ['int', 'lives', '=', '3', ';'],
          distractors: ['let', 'var', ':='],
          output: 'int lives = 3',
          explanation: 'Specify the type int, the identifier lives, the value, and a semicolon.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['int points = 50;', 'bool active = true;', 'int label = "Gold";', 'std::cout << points;'],
          bugLine: 2,
          fixed: 'std::string label = "Gold";',
          explanation: 'A text literal cannot be stored in an int variable; use std::string.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['bool ok = true;', 'std::cout << ok;'],
          options: ['1', 'true', '0'],
          answer: 0,
          explanation: 'By default, std::cout prints boolean true as 1 and false as 0.',
        },
        {
          type: 'multiple_choice',
          question: 'How many bytes does a standard 32-bit int occupy in C++?',
          options: ['1 byte', '2 bytes', '4 bytes', '8 bytes'],
          answer: 2,
          explanation: 'sizeof(int) is 4 bytes (32 bits) on modern platforms.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Declare a double variable ratio equal to 2.5',
          tokens: ['double', 'ratio', '=', '2.5', ';'],
          distractors: ['int', 'str', ':'],
          output: 'ratio = 2.5',
          explanation: 'double stores double-precision floating-point numbers.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['int a = 10;', 'int b = 0;', 'int c = a / b;', 'std::cout << c;'],
          bugLine: 2,
          fixed: 'int c = a / 2;',
          explanation: 'Dividing an integer by zero causes undefined behavior and crashes the program.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['int a = 7;', 'int b = 2;', 'std::cout << a / b;'],
          options: ['3', '3.5', '4'],
          answer: 0,
          explanation: 'Dividing two ints performs integer division and truncates the decimal part.',
        },
        {
          type: 'multiple_choice',
          question: 'What is the result of 9 % 4 in C++?',
          options: ['2', '1', '2.25', '0'],
          answer: 1,
          explanation: '9 divided by 4 leaves a remainder of 1.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Declare a constant integer MAX_HP equal to 100',
          tokens: ['const', 'int', 'MAX_HP', '=', '100;'],
          distractors: ['final', 'let', 'mut'],
          output: 'const MAX_HP = 100',
          explanation: 'const prevents a variable from being modified after initialization.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const int limit = 5;', 'int current = 2;', 'limit = 10;', 'std::cout << current;'],
          bugLine: 2,
          fixed: 'current = 10;',
          explanation: 'A const variable is read-only and cannot be reassigned.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['auto x = 6;', 'x += 4;', 'std::cout << x;'],
          options: ['10', '6', '4'],
          answer: 0,
          explanation: 'auto deduces x as int, and x += 4 adds 4 to produce 10.',
        },
        {
          type: 'multiple_choice',
          question: 'What does the auto keyword do in C++?',
          options: ['Frees memory', 'Deduces type from initializer', 'Makes variable global', 'Runs in a thread'],
          answer: 1,
          explanation: 'auto instructs the compiler to infer the variable type from its initial value.',
        },
      ],
    ],
  },
  {
    title: 'Conditions & Loops',
    description: 'Control execution flow with if, switch, and high-speed C++ loops.',
    guidebook: [
      {
        heading: 'If & Switch Blocks',
        summary: 'Conditions go inside parentheses () and blocks inside curly braces {}. Always use == for equality.',
        code: ['if (hp <= 0) {', '    std::cout << "Game Over";', '}'],
      },
      {
        heading: 'For Loops',
        summary: 'A C++ for loop combines initialization, condition, and increment in its header.',
        code: ['for (int i = 0; i < 3; i++) {', '    std::cout << i;', '}'],
      },
    ],
    nodeTitles: ['If & Equality', 'Switch Cases', 'For Loops', 'While & Arrays'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Build the condition: if x is equal to 0',
          tokens: ['if', '(', 'x', '==', '0', ')'],
          distractors: ['=', 'then', ':'],
          output: 'Condition true when x == 0',
          explanation: 'C++ wraps the condition in parentheses and uses == for comparison.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['int x = 5;', 'if (x = 10) {', '    std::cout << "Ten";', '}'],
          bugLine: 1,
          fixed: 'if (x == 10) {',
          explanation: 'Single = assigns 10 to x and evaluates to true; use == to compare.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['int n = 4;', 'if (n > 2 && n < 6)', '    std::cout << "In";', 'else', '    std::cout << "Out";'],
          options: ['In', 'Out', 'InOut'],
          answer: 0,
          explanation: 'Both 4 > 2 and 4 < 6 are true, so && evaluates to true.',
        },
        {
          type: 'multiple_choice',
          question: 'Which operator represents logical OR in C++?',
          options: ['or', '||', '|', '&&'],
          answer: 1,
          explanation: '|| is the logical OR operator in C++.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Write a case label for value 1 inside a switch',
          tokens: ['case', '1', ':', 'break', ';'],
          distractors: ['when', '->', 'stop'],
          output: 'case 1 handled',
          explanation: 'Each case ends with break; to prevent fallthrough into the next case.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug (unwanted fallthrough)',
          lines: ['switch (code) {', 'case 1:', '    std::cout << "One";', 'default:', '    std::cout << "Other";', '}'],
          bugLine: 2,
          fixed: '    std::cout << "One"; break;',
          explanation: 'Without break;, execution falls through from case 1 directly into default.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['int k = 2;', 'std::cout << (k == 2 ? "Yes" : "No");'],
          options: ['Yes', 'No', '2'],
          answer: 0,
          explanation: 'The ternary operator ? : returns the first value when the condition is true.',
        },
        {
          type: 'multiple_choice',
          question: 'Which branch runs in a switch when no case matches?',
          options: ['else', 'otherwise', 'default', 'fallback'],
          answer: 2,
          explanation: 'The default: label handles any value not matched by a case.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Build a standard for loop header from 0 to n',
          tokens: ['for', '(int i = 0;', 'i < n;', 'i++)'],
          distractors: ['i--', 'in', 'range'],
          output: 'Iterates i = 0 .. n-1',
          explanation: 'The three parts of a C++ for loop are init; condition; increment.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug (out-of-bounds read)',
          lines: ['int arr[3] = {1, 2, 3};', 'int sum = 0;', 'for (int i = 0; i <= 3; i++)', '    sum += arr[i];'],
          bugLine: 2,
          fixed: 'for (int i = 0; i < 3; i++)',
          explanation: 'Valid indices for arr[3] are 0, 1, 2. Using i <= 3 reads past the end of the array.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['for (int i = 0; i < 3; i++) {', '    std::cout << i;', '}'],
          options: ['012', '123', '0123'],
          answer: 0,
          explanation: 'i starts at 0 and stops when i reaches 3, printing 012.',
        },
        {
          type: 'multiple_choice',
          question: 'What does i++ do?',
          options: ['Doubles i', 'Increments i by 1', 'Resets i to 0', 'Squares i'],
          answer: 1,
          explanation: 'i++ adds 1 to the variable i.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Loop over each int x in nums using range-based for',
          tokens: ['for', '(', 'int x', ':', 'nums', ')'],
          distractors: ['in', 'of', ';'],
          output: 'Iterates through nums',
          explanation: 'C++11 range-based for uses a colon : to iterate over a container.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['int i = 0;', 'while (i < 3) {', '    std::cout << i;', '}'],
          bugLine: 2,
          fixed: '    std::cout << i; i++;',
          explanation: 'Because i is never incremented, i < 3 stays true forever.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['int a[3] = {4, 8, 12};', 'std::cout << a[1];'],
          options: ['8', '4', '12'],
          answer: 0,
          explanation: 'Array indexing starts at 0, so a[1] is the second element, 8.',
        },
        {
          type: 'multiple_choice',
          question: 'Which loop guarantees its body executes at least once?',
          options: ['for', 'while', 'do...while', 'range-for'],
          answer: 2,
          explanation: 'do...while checks its condition at the bottom after running the body once.',
        },
      ],
    ],
  },
  {
    title: 'Functions, Pointers & References',
    description: 'Pass data by reference, work with memory addresses, and build structs.',
    guidebook: [
      {
        heading: 'Pointers & Addresses',
        summary: '&x gets the memory address of x, and *ptr dereferences a pointer to read or write its value.',
        code: ['int x = 10;', 'int* ptr = &x;', '*ptr = 25; // x is now 25'],
      },
      {
        heading: 'Pass by Reference',
        summary: 'Use int& in function parameters to modify the caller variable without copying.',
        code: ['void boost(int& score) {', '    score += 50;', '}'],
      },
    ],
    nodeTitles: ['Functions', 'References &', 'Pointers *', 'Structs'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Declare a function header add returning an int',
          tokens: ['int', 'add', '(int a, int b)', '{'],
          distractors: ['def', 'func', '->'],
          output: 'int add(int a, int b)',
          explanation: 'C++ functions specify the return type before the function name.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['void logScore(int s) {', '    std::cout << s;', '    return s;', '}'],
          bugLine: 2,
          fixed: '    return;',
          explanation: 'A function declared with return type void cannot return a value.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['int sq(int n) { return n * n; }', 'std::cout << sq(5);'],
          options: ['25', '10', '5'],
          answer: 0,
          explanation: 'sq(5) computes 5 * 5 and returns 25.',
        },
        {
          type: 'multiple_choice',
          question: 'Which return type indicates a function returns nothing?',
          options: ['null', 'none', 'void', 'empty'],
          answer: 2,
          explanation: 'void specifies that a function does not return a value.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Take parameter v by reference so it can be modified',
          tokens: ['void', 'reset', '(', 'int& v', ')'],
          distractors: ['int* v', 'ref v', 'val v'],
          output: 'Pass-by-reference active',
          explanation: 'int& v binds directly to the caller’s variable without copying.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug (score never changes)',
          lines: ['void zero(int v) {', '    v = 0;', '}', 'zero(score);'],
          bugLine: 0,
          fixed: 'void zero(int& v) {',
          explanation: 'Passing int v by value only zeroes a local copy; use int& v to modify score.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['int x = 3;', 'int& r = x;', 'r = 9;', 'std::cout << x;'],
          options: ['9', '3', '12'],
          answer: 0,
          explanation: 'r is a reference alias to x, so assigning r = 9 changes x to 9.',
        },
        {
          type: 'multiple_choice',
          question: 'What is a C++ reference (int&)?',
          options: ['A copy of an int', 'An alias for an existing variable', 'A dynamic array', 'A macro'],
          answer: 1,
          explanation: 'A reference acts as another name for an already existing variable.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Store the memory address of x in pointer ptr',
          tokens: ['int*', 'ptr', '=', '&x', ';'],
          distractors: ['*x', '&&x', 'ref'],
          output: 'ptr points to x',
          explanation: 'The address-of operator & returns the memory address of x.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug (null pointer crash)',
          lines: ['int* p = nullptr;', '*p = 42;', 'std::cout << "Done";', 'return 0;'],
          bugLine: 1,
          fixed: 'int val = 42; int* p = &val;',
          explanation: 'Dereferencing nullptr causes undefined behavior (segmentation fault).',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['int x = 5;', 'int* p = &x;', '*p = 11;', 'std::cout << x;'],
          options: ['11', '5', '0'],
          answer: 0,
          explanation: '*p accesses x through the pointer, updating x to 11.',
        },
        {
          type: 'multiple_choice',
          question: 'Which literal represents a null pointer in modern C++?',
          options: ['None', 'nil', 'nullptr', 'undefined'],
          answer: 2,
          explanation: 'C++11 introduced nullptr as the type-safe null pointer literal.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Access the hp field of a struct pointer heroPtr',
          tokens: ['heroPtr', '->', 'hp'],
          distractors: ['.', '::', '&'],
          output: 'heroPtr->hp',
          explanation: 'The arrow operator -> dereferences a struct pointer and accesses its member.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['struct Point {', '    int x;', '    int y;', '}'],
          bugLine: 3,
          fixed: '};',
          explanation: 'Struct and class definitions in C++ must end with a closing brace and semicolon };.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['struct Vec { int x; int y; };', 'Vec v{3, 7};', 'std::cout << v.x + v.y;'],
          options: ['10', '37', '21'],
          answer: 0,
          explanation: 'v.x is 3 and v.y is 7, so their sum is 10.',
        },
        {
          type: 'multiple_choice',
          question: 'What is the default member visibility inside a C++ struct?',
          options: ['private', 'protected', 'public', 'internal'],
          answer: 2,
          explanation: 'Members of a struct are public by default (unlike class, which defaults to private).',
        },
      ],
    ],
  },
];

// ============================================================================
// 3. JAVASCRIPT
// ============================================================================
const jsUnits: [UnitSeed, UnitSeed, UnitSeed] = [
  {
    title: 'Variables & Strict Equality',
    description: 'Use let and const, template literals, and strict === comparisons.',
    guidebook: [
      {
        heading: 'let vs. const',
        summary: 'Use const by default for bindings that will not be reassigned, and let when a value changes.',
        code: ['const API_URL = "/v1";', 'let retries = 0;', 'retries += 1;'],
      },
      {
        heading: 'Strict Equality ===',
        summary: 'Always prefer === over == so JavaScript checks both value and type without coercion.',
        code: ['5 === 5    // true', '5 === "5"  // false'],
      },
    ],
    nodeTitles: ['const & let', 'Template Strings', 'Strict ===', 'Truthy & Falsy'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Declare a constant named Hero equal to "Aria"',
          tokens: ['const', 'Hero', '=', '"Aria"', ';'],
          distractors: ['int', 'def', ':='],
          output: 'Hero -> "Aria"',
          explanation: 'const creates a block-scoped constant binding.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const max = 10;', 'let count = 1;', 'max = 20;', 'console.log(count);'],
          bugLine: 2,
          fixed: 'count = 20;',
          explanation: 'Reassigning a const variable throws TypeError: Assignment to constant variable.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['console.log(typeof null);'],
          options: ['object', 'null', 'undefined'],
          answer: 0,
          explanation: 'typeof null returns "object" due to a historic quirk in JavaScript.',
        },
        {
          type: 'multiple_choice',
          question: 'Which keyword declares a block-scoped variable that can be reassigned?',
          options: ['var', 'const', 'let', 'static'],
          answer: 2,
          explanation: 'let is block-scoped and allows reassignment.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Log a template literal embedding the score variable',
          tokens: ['console.log', '(', '`Score: ${score}`', ')'],
          distractors: ['"Score: ${score}"', 'print', '#{score}'],
          output: 'Score: 150',
          explanation: 'Template literals use backticks ` ` and ${} placeholders.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const user = "Sam";', 'const msg = "Hello ${user}";', 'console.log(msg);', 'console.log(user.length);'],
          bugLine: 1,
          fixed: 'const msg = `Hello ${user}`;',
          explanation: '${} interpolation only works inside backticks ` `, not double quotes.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['console.log("5" + 3);'],
          options: ['53', '8', 'NaN'],
          answer: 0,
          explanation: 'When + has a string operand, JavaScript converts the number to a string and concatenates.',
        },
        {
          type: 'multiple_choice',
          question: 'What does Number("42") return?',
          options: ['"42"', '42', 'NaN', 'true'],
          answer: 1,
          explanation: 'Number("42") converts the string into the number 42.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Check if a is strictly equal to b',
          tokens: ['if', '(', 'a', '===', 'b', ')'],
          distractors: ['==', '=', 'then'],
          output: 'Strict check passed',
          explanation: '=== compares both type and value without implicit type conversion.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const input = "5";', 'if (input === 5) {', '  console.log("Match");', '}'],
          bugLine: 1,
          fixed: 'if (Number(input) === 5) {',
          explanation: '"5" is a string and 5 is a number, so input === 5 is always false.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['console.log(0 == false, 0 === false);'],
          options: ['true false', 'false true', 'true true'],
          answer: 0,
          explanation: 'Loose == coerces 0 and false to equal, while strict === sees different types.',
        },
        {
          type: 'multiple_choice',
          question: 'Which operator checks strict inequality in JavaScript?',
          options: ['!=', '!==', '<>', '!='],
          answer: 1,
          explanation: '!== returns true when operands differ in value or type.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Use nullish coalescing to fall back to "Guest"',
          tokens: ['const', 'label', '=', 'name', '??', '"Guest"'],
          distractors: ['||', '&&', '?:'],
          output: 'label -> "Guest"',
          explanation: '?? returns the right-hand fallback only when the left side is null or undefined.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['let total;', 'total += 10;', 'console.log(total);', 'console.log("Done");'],
          bugLine: 0,
          fixed: 'let total = 0;',
          explanation: 'An uninitialized let variable is undefined, and undefined + 10 produces NaN.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['const count = 0;', 'console.log(count || 5, count ?? 5);'],
          options: ['5 0', '0 5', '5 5'],
          answer: 0,
          explanation: '|| treats 0 as falsy and falls back to 5, while ?? keeps 0 because it is not null/undefined.',
        },
        {
          type: 'multiple_choice',
          question: 'Which of these values is truthy in JavaScript?',
          options: ['0', '""', 'null', '[]'],
          answer: 3,
          explanation: 'All objects and arrays—even an empty array []—are truthy in JavaScript.',
        },
      ],
    ],
  },
  {
    title: 'Arrays & Iteration',
    description: 'Transform arrays cleanly with for...of, map, filter, and spread syntax.',
    guidebook: [
      {
        heading: 'Array Methods: map & filter',
        summary: 'map() transforms every element into a new array; filter() keeps elements matching a predicate.',
        code: ['const nums = [1, 2, 3, 4];', 'const doubled = nums.map(n => n * 2);', 'const evens = nums.filter(n => n % 2 === 0);'],
      },
      {
        heading: 'Spread Syntax (...)',
        summary: 'Use ... to clone or merge arrays and objects immutably.',
        code: ['const combined = [...first, ...second];'],
      },
    ],
    nodeTitles: ['for...of Loops', 'Array.map()', 'Array.filter()', 'Spread & Destructuring'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Iterate over each item of the list array',
          tokens: ['for', '(', 'const item', 'of', 'list', ')'],
          distractors: ['in', 'foreach', 'from'],
          output: 'Iterates values of list',
          explanation: 'for...of iterates over array values, whereas for...in iterates over keys.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const scores = [10, 20];', 'let sum = 0;', 'for (const s in scores) {', '  sum += s;', '}'],
          bugLine: 2,
          fixed: 'for (const s of scores) {',
          explanation: 'for...in iterates over string indices ("0", "1") instead of the numeric values.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['const a = ["x", "y"];', 'a.push("z");', 'console.log(a.length);'],
          options: ['3', '2', '4'],
          answer: 0,
          explanation: 'push() appends "z" to the array, increasing its length from 2 to 3.',
        },
        {
          type: 'multiple_choice',
          question: 'Which method removes and returns the last element of an array?',
          options: ['shift()', 'pop()', 'slice()', 'splice()'],
          answer: 1,
          explanation: 'pop() removes and returns the final element of an array.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Double every number in arr using map',
          tokens: ['arr', '.', 'map', '(x => x * 2)'],
          distractors: ['forEach', 'filter', 'find'],
          output: '[2, 4, 6]',
          explanation: 'map() applies the callback to each element and returns a new array.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const nums = [1, 2, 3];', 'const doubled = nums.map(n => {', '  n * 2;', '});'],
          bugLine: 2,
          fixed: '  return n * 2;',
          explanation: 'When an arrow function uses curly braces {}, you must write an explicit return statement.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['const out = [1, 2, 3].map(x => x + 1);', 'console.log(out.join("-"));'],
          options: ['2-3-4', '1-2-3', '234'],
          answer: 0,
          explanation: 'map adds 1 to each element ([2, 3, 4]) and join("-") connects them with hyphens.',
        },
        {
          type: 'multiple_choice',
          question: 'Does Array.prototype.map() mutate the original array?',
          options: ['Yes, always', 'No, it returns a new array', 'Only for numbers', 'Only when sorted'],
          answer: 1,
          explanation: 'map() creates and returns a brand-new array without mutating the source array.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Keep only numbers greater than 10 using filter',
          tokens: ['nums', '.', 'filter', '(n => n > 10)'],
          distractors: ['map', 'reduce', 'some'],
          output: 'Filtered array',
          explanation: 'filter() keeps elements for which the callback returns a truthy value.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const vals = [2, 5, 8];', 'const sum = vals.reduce((acc, n) => acc + n);', 'const empty = [].reduce((acc, n) => acc + n);', 'console.log(sum, empty);'],
          bugLine: 2,
          fixed: 'const empty = [].reduce((acc, n) => acc + n, 0);',
          explanation: 'Calling reduce() on an empty array without an initial value (0) throws a TypeError.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['const res = [1, 2, 3, 4].filter(n => n % 2 === 0);', 'console.log(res.length);'],
          options: ['2', '4', '1'],
          answer: 0,
          explanation: 'Only 2 and 4 are even, so the resulting array has length 2.',
        },
        {
          type: 'multiple_choice',
          question: 'Which array method returns the FIRST element matching a condition?',
          options: ['filter()', 'find()', 'includes()', 'some()'],
          answer: 1,
          explanation: 'find() stops and returns the first matching element (or undefined).',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Clone the items array and append 4 using spread',
          tokens: ['const', 'next', '=', '[...items, 4]', ';'],
          distractors: ['...items', '{...items}', 'items.copy()'],
          output: '[...items, 4]',
          explanation: '[...items, 4] spreads existing elements into a new array and adds 4 at the end.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const point = [10, 20];', 'const { x, y } = point;', 'console.log(x + y);', 'console.log(point[0]);'],
          bugLine: 1,
          fixed: 'const [x, y] = point;',
          explanation: 'Array destructuring uses square brackets [x, y], not curly braces.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['const [first, , third] = [10, 20, 30];', 'console.log(first + third);'],
          options: ['40', '30', '60'],
          answer: 0,
          explanation: 'The empty comma skips 20, binding first = 10 and third = 30 (sum 40).',
        },
        {
          type: 'multiple_choice',
          question: 'What does [...[1, 2], ...[3, 4]] evaluate to?',
          options: ['[[1, 2], [3, 4]]', '[1, 2, 3, 4]', '[4, 6]', 'SyntaxError'],
          answer: 1,
          explanation: 'Spreading two arrays inside a new array literal concatenates their elements.',
        },
      ],
    ],
  },
  {
    title: 'Functions, Objects & Async',
    description: 'Build arrow functions, manipulate objects by reference, and await Promises.',
    guidebook: [
      {
        heading: 'Arrow Functions & Objects',
        summary: 'Concise arrow functions (a, b) => a + b return implicitly when written without braces.',
        code: ['const add = (a, b) => a + b;', 'const user = { id: 1, name: "Zoe" };'],
      },
      {
        heading: 'Async / Await',
        summary: 'Mark a function async to pause on Promises with await.',
        code: ['async function loadUser() {', '  const data = await fetchUser();', '  return data.name;', '}'],
      },
    ],
    nodeTitles: ['Arrow Functions', 'Objects & Keys', 'Reference vs Value', 'Async & Await'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Create an arrow function add that returns a + b',
          tokens: ['const', 'add', '=', '(a, b)', '=>', 'a + b;'],
          distractors: ['function', '->', 'def'],
          output: 'add(2, 3) -> 5',
          explanation: 'Arrow functions without curly braces implicitly return the expression result.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const makeUser = (name) => { name: name };', 'const u = makeUser("Kai");', 'console.log(u);', 'console.log("Done");'],
          bugLine: 0,
          fixed: 'const makeUser = (name) => ({ name: name });',
          explanation: 'Returning an object literal implicitly from an arrow function requires wrapping it in parentheses ({ ... }).',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['const inc = (x = 1) => x + 1;', 'console.log(inc(), inc(4));'],
          options: ['2 5', '1 5', 'NaN 5'],
          answer: 0,
          explanation: 'inc() uses default parameter x = 1 (returning 2), and inc(4) returns 5.',
        },
        {
          type: 'multiple_choice',
          question: 'How do arrow functions handle the "this" keyword?',
          options: ['They bind their own this', 'They inherit this from the enclosing scope', 'this is always null', 'They throw an error'],
          answer: 1,
          explanation: 'Arrow functions capture this lexically from their surrounding scope.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Destructure name and level from the player object',
          tokens: ['const', '{ name, level }', '=', 'player', ';'],
          distractors: ['[ name, level ]', 'from', ':='],
          output: 'name, level extracted',
          explanation: 'Object destructuring extracts matching property names using curly braces.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['const user = { name: "Leo", level: 4 };', 'function getLevel(u) {', '  return u.lvl;', '}', 'console.log(getLevel(user));'],
          bugLine: 2,
          fixed: '  return u.level;',
          explanation: 'The property is named level, not lvl; reading a non-existent key returns undefined.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['const obj = { a: 1, b: 2 };', 'console.log(Object.keys(obj).length);'],
          options: ['2', '1', '0'],
          answer: 0,
          explanation: 'Object.keys(obj) returns ["a", "b"], which has length 2.',
        },
        {
          type: 'multiple_choice',
          question: 'What does user?.profile?.avatar return if profile is undefined?',
          options: ['null', 'undefined', 'TypeError', 'false'],
          answer: 1,
          explanation: 'Optional chaining ?. short-circuits and returns undefined instead of throwing.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Create a shallow clone of user with level set to 5',
          tokens: ['const', 'updated', '=', '{ ...user, level: 5 }', ';'],
          distractors: ['[...user]', 'user.clone()', '=>'],
          output: '{ ...user, level: 5 }',
          explanation: 'Object spread copies existing properties and overrides keys placed after it.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug (accidental mutation)',
          lines: ['const base = { hp: 100 };', 'const copy = base;', 'copy.hp = 0;', 'console.log(base.hp);'],
          bugLine: 1,
          fixed: 'const copy = { ...base };',
          explanation: 'Assigning an object copies its reference; spread into { ...base } to create a separate object.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['console.log({ a: 1 } === { a: 1 });'],
          options: ['false', 'true', 'TypeError'],
          answer: 0,
          explanation: 'Two distinct object literals occupy different memory references, so === is false.',
        },
        {
          type: 'multiple_choice',
          question: 'How are objects passed to functions in JavaScript?',
          options: ['Deep copied automatically', 'By reference to the same object', 'Converted to JSON', 'Frozen automatically'],
          answer: 1,
          explanation: 'Objects are passed by sharing their reference, so mutating properties affects the caller object.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Await the fetchScore() promise inside an async function',
          tokens: ['const', 'score', '=', 'await', 'fetchScore();'],
          distractors: ['async', 'yield', 'defer'],
          output: 'score resolved',
          explanation: 'await pauses the async function until the Promise resolves to a value.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['function loadData() {', '  const res = await fetch("/api");', '  return res;', '}'],
          bugLine: 0,
          fixed: 'async function loadData() {',
          explanation: 'await can only be used inside a function marked with the async keyword.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['Promise.resolve(7)', '  .then(n => n * 2)', '  .then(n => console.log(n));'],
          options: ['14', '7', 'Promise'],
          answer: 0,
          explanation: 'The first .then() doubles 7 to 14, and the second logs 14.',
        },
        {
          type: 'multiple_choice',
          question: 'What does an async function always return?',
          options: ['A string', 'A Promise', 'An array', 'undefined'],
          answer: 1,
          explanation: 'An async function always wraps its return value inside a Promise.',
        },
      ],
    ],
  },
];

// ============================================================================
// 4. GO
// ============================================================================
const goUnits: [UnitSeed, UnitSeed, UnitSeed] = [
  {
    title: 'Variables & Zero Values',
    description: 'Use short variable declarations :=, static types, and Go zero values.',
    guidebook: [
      {
        heading: 'Short Declaration :=',
        summary: 'Inside functions, := declares and initializes a variable with automatic type inference.',
        code: ['name := "Gopher"', 'port := 8080'],
      },
      {
        heading: 'Zero Values',
        summary: 'Variables declared without an explicit value default to 0, false, or "" (never uninitialized memory).',
        code: ['var count int     // 0', 'var label string  // ""', 'var ready bool    // false'],
      },
    ],
    nodeTitles: ['Short := Syntax', 'Static Types', 'Zero Values', 'fmt Formatting'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Declare and initialize score to 100 using short syntax',
          tokens: ['score', ':=', '100'],
          distractors: ['let', '=', 'var'],
          output: 'score (int) = 100',
          explanation: ':= declares a new variable and infers its type from the right-hand value.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['package main', 'func main() {', '    score := 10', '    score := 20', '}'],
          bugLine: 3,
          fixed: '    score = 20',
          explanation: ':= cannot redeclare the same variable in the same scope; use = to reassign.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['x := 10', 'y := 25', 'fmt.Println(x + y)'],
          options: ['35', '1025', '15'],
          answer: 0,
          explanation: 'Both x and y are inferred as int, and fmt.Println outputs their sum 35.',
        },
        {
          type: 'multiple_choice',
          question: 'Where can the short declaration operator := be used in Go?',
          options: ['Only outside functions', 'Only inside functions', 'Only in struct definitions', 'Anywhere in a file'],
          answer: 1,
          explanation: 'At package level, declarations must start with var or const; := is valid only inside functions.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Declare an explicit string variable city equal to "Tokyo"',
          tokens: ['var', 'city', 'string', '=', '"Tokyo"'],
          distractors: ['str', 'let', ':='],
          output: 'city = "Tokyo"',
          explanation: 'In Go, the variable name comes before its type: var name type = value.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['package main', 'func main() {', '    var count int = "ten"', '    println(count)', '}'],
          bugLine: 2,
          fixed: '    var count int = 10',
          explanation: 'Go is statically typed: you cannot assign a string literal to an int variable.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['const factor = 3', 'n := 7', 'fmt.Println(n * factor)'],
          options: ['21', '10', '73'],
          answer: 0,
          explanation: 'Untyped constant factor adapts to int and multiplies 7 * 3 = 21.',
        },
        {
          type: 'multiple_choice',
          question: 'How does Go handle unused local variables?',
          options: ['Ignores them silently', 'Refuses to compile with an error', 'Deletes them at runtime', 'Converts them to nil'],
          answer: 1,
          explanation: 'Go treats unused local variables as a compile-time error to keep code clean.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Declare an integer variable total with its zero value',
          tokens: ['var', 'total', 'int'],
          distractors: ['= nil', 'let', 'int total'],
          output: 'total = 0',
          explanation: 'var total int initializes total to 0 automatically.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['var title string', 'title = nil', 'fmt.Println(title)', 'fmt.Println("ok")'],
          bugLine: 1,
          fixed: 'title = ""',
          explanation: 'In Go, string is a value type and cannot be assigned nil; its zero value is "".',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['var n int', 'var ok bool', 'fmt.Println(n, ok)'],
          options: ['0 false', 'nil false', '0 true'],
          answer: 0,
          explanation: 'The zero value for int is 0, and for bool is false.',
        },
        {
          type: 'multiple_choice',
          question: 'What is the zero value of a string in Go?',
          options: ['nil', '"" (empty string)', '"0"', 'undefined'],
          answer: 1,
          explanation: 'Strings in Go default to the empty string "".',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Print formatted string with %d for an integer level',
          tokens: ['fmt.Printf', '(', '"Lv.%d"', ',', 'level)'],
          distractors: ['Println', '%s', '$level'],
          output: 'Lv.4',
          explanation: 'fmt.Printf uses format verbs like %d for integers and %s for strings.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['package main', 'import "fmt"', 'func main() {', '    fmt.println("Hello Go")', '}'],
          bugLine: 3,
          fixed: '    fmt.Println("Hello Go")',
          explanation: 'Exported functions in Go packages always start with a capital letter: fmt.Println.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['s := fmt.Sprintf("%s-%d", "go", 1)', 'fmt.Println(s)'],
          options: ['go-1', 'go1', '%s-%d'],
          answer: 0,
          explanation: 'fmt.Sprintf formats and returns the string "go-1".',
        },
        {
          type: 'multiple_choice',
          question: 'What determines whether a function or type is exported from a Go package?',
          options: ['The export keyword', 'Starting its name with a capital letter', 'Adding @public', 'Listing it in go.mod'],
          answer: 1,
          explanation: 'In Go, any identifier starting with an uppercase letter is exported.',
        },
      ],
    ],
  },
  {
    title: 'Control Flow & Slices',
    description: 'Write idiomatic error checks, switch blocks, for-range loops, and slices.',
    guidebook: [
      {
        heading: 'If, Switch & Error Checks',
        summary: 'Go omits parentheses around conditions and never falls through switch cases by default.',
        code: ['if err != nil {', '    return err', '}'],
      },
      {
        heading: 'For-Range & Slices',
        summary: 'Go has only one loop keyword (for). Use range to iterate over slices and _ to ignore the index.',
        code: ['nums := []int{2, 4, 6}', 'for _, n := range nums {', '    fmt.Println(n)', '}'],
      },
    ],
    nodeTitles: ['If & Errors', 'Switch Statements', 'For & Range', 'Dynamic Slices'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Write the idiomatic Go error check',
          tokens: ['if', 'err', '!=', 'nil', '{'],
          distractors: ['null', '(', 'catch'],
          output: 'Error handled cleanly',
          explanation: 'Go functions return errors as values, checked immediately with if err != nil.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['x := 5', 'if x == 5', '{', '    fmt.Println("Five")', '}'],
          bugLine: 1,
          fixed: 'if x == 5 {',
          explanation: 'Due to Go automatic semicolon insertion, the opening brace { must sit on the same line as if.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['if n := 4; n > 2 {', '    fmt.Println(n * 2)', '}'],
          options: ['8', '4', '2'],
          answer: 0,
          explanation: 'Go allows a short init statement n := 4 before the condition; 4 > 2 prints 8.',
        },
        {
          type: 'multiple_choice',
          question: 'How does Go handle runtime errors idiomatically?',
          options: ['try / catch blocks', 'Returning an explicit error value', 'Global error variables', 'Checked exceptions'],
          answer: 1,
          explanation: 'Go treats errors as explicit return values rather than using exceptions.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Start a tagless switch statement in Go',
          tokens: ['switch', '{', 'case', 'x > 0:', '}'],
          distractors: ['break', '(', 'when'],
          output: 'Switch evaluated',
          explanation: 'A switch without an expression evaluates boolean cases from top to bottom.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['day := 1', 'switch day {', 'case "Monday":', '    fmt.Println("Start")', '}'],
          bugLine: 2,
          fixed: 'case 1:',
          explanation: 'Every case value must match the type of the switched variable (int).',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['x := 1', 'switch x {', 'case 1:', '    fmt.Print("A")', 'case 2:', '    fmt.Print("B")', '}'],
          options: ['A', 'AB', 'B'],
          answer: 0,
          explanation: 'Go switch cases break automatically unless fallthrough is written explicitly.',
        },
        {
          type: 'multiple_choice',
          question: 'Do Go switch cases require a break statement at the end of each case?',
          options: ['Yes, always', 'No, Go breaks automatically', 'Only for strings', 'Only in default'],
          answer: 1,
          explanation: 'Go cases do not fall through by default; break is implicit.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Range over nums while ignoring the index with _',
          tokens: ['for', '_, n', ':=', 'range nums', '{'],
          distractors: ['in', 'of', 'foreach'],
          output: 'Iterates values of nums',
          explanation: 'The blank identifier _ discards the unwanted index returned by range.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug ("i declared and not used")',
          lines: ['nums := []int{1, 2, 3}', 'sum := 0', 'for i, n := range nums {', '    sum += n', '}'],
          bugLine: 2,
          fixed: 'for _, n := range nums {',
          explanation: 'Because i is never used inside the loop, Go fails compilation unless replaced with _.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['for i := 3; i > 0; i-- {', '    fmt.Print(i)', '}'],
          options: ['321', '123', '3210'],
          answer: 0,
          explanation: 'i counts down 3, 2, 1 and stops when i reaches 0.',
        },
        {
          type: 'multiple_choice',
          question: 'How do you write a "while" loop in Go?',
          options: ['while cond { }', 'for cond { }', 'loop cond { }', 'repeat cond { }'],
          answer: 1,
          explanation: 'In Go, a for loop with only a condition acts as a while loop.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Append the number 40 to slice s',
          tokens: ['s', '=', 'append', '(s, 40)'],
          distractors: ['s.push(40)', 's.add(40)', 'append(40)'],
          output: 's -> [..., 40]',
          explanation: 'append() returns a new slice header, so you assign the result back to s.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['s := []int{10, 20}', 'append(s, 30)', 'fmt.Println(len(s))', 'fmt.Println(s[0])'],
          bugLine: 1,
          fixed: 's = append(s, 30)',
          explanation: 'Calling append() without assigning its return value discards the updated slice.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['a := []int{10, 20, 30, 40}', 'sub := a[1:3]', 'fmt.Println(len(sub), sub[0])'],
          options: ['2 20', '3 20', '2 10'],
          answer: 0,
          explanation: 'a[1:3] includes index 1 and 2 ([20, 30]), which has length 2 and first element 20.',
        },
        {
          type: 'multiple_choice',
          question: 'Which built-in function creates a slice or channel in Go?',
          options: ['new()', 'make()', 'alloc()', 'create()'],
          answer: 1,
          explanation: 'make() initializes slices, maps, and channels.',
        },
      ],
    ],
  },
  {
    title: 'Structs, Pointers & Goroutines',
    description: 'Model data with structs, mutate state with pointer receivers, and run goroutines.',
    guidebook: [
      {
        heading: 'Structs & Pointer Receivers',
        summary: 'Use a pointer receiver (b *Bot) when a method needs to modify the struct fields.',
        code: ['type Bot struct { HP int }', 'func (b *Bot) Heal(n int) {', '    b.HP += n', '}'],
      },
      {
        heading: 'Goroutines & Channels',
        summary: 'Prefix a call with go to run it concurrently, and use channels (<-) to communicate safely.',
        code: ['ch := make(chan string)', 'go func() { ch <- "ready" }()', 'msg := <-ch'],
      },
    ],
    nodeTitles: ['Multiple Returns', 'Structs & Methods', 'Pointer Receivers', 'Goroutines & Channels'],
    baseExercises: [
      [
        {
          type: 'code_blocks',
          prompt: 'Declare swap returning two ints',
          tokens: ['func', 'swap(a, b int)', '(int, int)', '{'],
          distractors: ['->', 'def', '[int, int]'],
          output: 'func swap(a, b int) (int, int)',
          explanation: 'Go functions list multiple return types inside parentheses after the parameter list.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['func divide(a, b int) (int, bool) {', '    if b == 0 { return 0 }', '    return a / b, true', '}'],
          bugLine: 1,
          fixed: '    if b == 0 { return 0, false }',
          explanation: 'Every return statement must return values matching all declared return types.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['func pair() (int, int) { return 3, 7 }', 'a, b := pair()', 'fmt.Println(b, a)'],
          options: ['7 3', '3 7', '10'],
          answer: 0,
          explanation: 'a receives 3 and b receives 7, so printing b, a outputs 7 3.',
        },
        {
          type: 'multiple_choice',
          question: 'What does the defer keyword do in Go?',
          options: ['Runs a call on a background thread', 'Schedules a function call to run when the surrounding function returns', 'Cancels a function', 'Skips compilation'],
          answer: 1,
          explanation: 'defer delays a function call until the surrounding function finishes.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Define a struct type named Player',
          tokens: ['type', 'Player', 'struct', '{'],
          distractors: ['class', 'interface', '=>'],
          output: 'type Player struct',
          explanation: 'Go defines custom composite types using type Name struct { ... }.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug',
          lines: ['type User struct { Name string }', 'u := User{Name: "Ava"}', 'fmt.Println(u.name)', 'fmt.Println("ok")'],
          bugLine: 2,
          fixed: 'fmt.Println(u.Name)',
          explanation: 'Struct field names in Go are case-sensitive: the field is Name, not name.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['type Box struct { W, H int }', 'b := Box{W: 4, H: 5}', 'fmt.Println(b.W * b.H)'],
          options: ['20', '9', '45'],
          answer: 0,
          explanation: 'b.W is 4 and b.H is 5, so 4 * 5 outputs 20.',
        },
        {
          type: 'multiple_choice',
          question: 'How does Go implement object-oriented behavior without classes?',
          options: ['Prototypes', 'Structs with methods and interfaces', 'Inheritance trees', 'Macros'],
          answer: 1,
          explanation: 'Go attaches methods to structs and uses implicit interfaces for polymorphism.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Declare a pointer receiver method Reset on Counter',
          tokens: ['func', '(c *Counter)', 'Reset()', '{'],
          distractors: ['(c Counter)', 'this.Counter', 'self'],
          output: 'func (c *Counter) Reset()',
          explanation: 'A pointer receiver (c *Counter) mutates the original Counter instance.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug (HP never increases)',
          lines: ['type Bot struct { HP int }', 'func (b Bot) Heal() {', '    b.HP += 10', '}'],
          bugLine: 1,
          fixed: 'func (b *Bot) Heal() {',
          explanation: 'A value receiver (b Bot) modifies a copy; use a pointer receiver (b *Bot) to mutate the struct.',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['n := 5', 'p := &n', '*p += 3', 'fmt.Println(n)'],
          options: ['8', '5', '3'],
          answer: 0,
          explanation: '*p modifies n through its pointer, adding 3 to produce 8.',
        },
        {
          type: 'multiple_choice',
          question: 'Does Go allow pointer arithmetic (such as ptr++) in normal code?',
          options: ['Yes, everywhere', 'No, pointer arithmetic is disallowed for safety', 'Only on slices', 'Only on structs'],
          answer: 1,
          explanation: 'Go supports pointers for memory sharing without unsafe pointer arithmetic.',
        },
      ],
      [
        {
          type: 'code_blocks',
          prompt: 'Send the string "ok" into channel ch',
          tokens: ['ch', '<-', '"ok"'],
          distractors: ['->', '<<', 'ch.send("ok")'],
          output: '"ok" sent to ch',
          explanation: 'ch <- val sends a value into a channel; <-ch receives from it.',
        },
        {
          type: 'find_bug',
          prompt: 'Tap the line with the bug (sending to a nil channel blocks forever)',
          lines: ['var ch chan int', 'go func() { ch <- 1 }()', 'fmt.Println(<-ch)', 'fmt.Println("done")'],
          bugLine: 0,
          fixed: 'ch := make(chan int)',
          explanation: 'A channel declared with var is nil; initialize it with make(chan int).',
        },
        {
          type: 'predict_output',
          prompt: 'What will this output?',
          code: ['ch := make(chan int, 1)', 'ch <- 42', 'fmt.Println(<-ch)'],
          options: ['42', '1', '0'],
          answer: 0,
          explanation: 'Buffered channel ch stores 42 and <-ch receives and prints 42.',
        },
        {
          type: 'multiple_choice',
          question: 'Which keyword launches a function call in a concurrent goroutine?',
          options: ['async', 'spawn', 'go', 'thread'],
          answer: 2,
          explanation: 'Writing go fn() starts fn() concurrently in a lightweight goroutine.',
        },
      ],
    ],
  },
];

export const LANGUAGES: Language[] = [
  {
    id: 'python',
    name: 'Python',
    short: 'PY',
    badgeBg: '#8B5CF6',
    badgeLip: '#6D28D9',
    fileExt: 'main.py',
    learners: '4.2M learners',
    units: buildUnits('python', pythonUnits),
  },
  {
    id: 'cpp',
    name: 'C++',
    short: 'C++',
    badgeBg: '#1CB0F6',
    badgeLip: '#1899D6',
    fileExt: 'main.cpp',
    learners: '2.1M learners',
    units: buildUnits('cpp', cppUnits),
  },
  {
    id: 'js',
    name: 'JavaScript',
    short: 'JS',
    badgeBg: '#FFC800',
    badgeLip: '#E5B400',
    fileExt: 'index.js',
    learners: '3.8M learners',
    units: buildUnits('js', jsUnits),
  },
  {
    id: 'go',
    name: 'Go',
    short: 'GO',
    badgeBg: '#00CD9C',
    badgeLip: '#00A880',
    fileExt: 'main.go',
    learners: '1.4M learners',
    units: buildUnits('go', goUnits),
  },
];

export function getLanguage(id: LangId): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}

export function getNodeById(nodeId: string): { lang: Language; unit: Unit; node: LessonNode } | undefined {
  for (const lang of LANGUAGES) {
    for (const unit of lang.units) {
      const node = unit.nodes.find((n) => n.id === nodeId);
      if (node) return { lang, unit, node };
    }
  }
  return undefined;
}

/** Collects all find_bug exercises across all 4 languages for 60s Bug Hunt Blitz. */
export function getAllBugExercises(): (FindBugExercise & { lang: LangId; fileExt: string })[] {
  const list: (FindBugExercise & { lang: LangId; fileExt: string })[] = [];
  for (const lang of LANGUAGES) {
    for (const unit of lang.units) {
      for (const node of unit.nodes) {
        for (const ex of node.exercises) {
          if (ex.type === 'find_bug') {
            list.push({ ...ex, lang: lang.id, fileExt: lang.fileExt });
          }
        }
      }
    }
  }
  return list;
}

/** Pre-built interactive playground templates for the Practice tab. */
export interface PlaygroundSnippet {
  title: string;
  description: string;
  code: string[];
  output: string[];
}

export const PLAYGROUND_SNIPPETS: Record<LangId, PlaygroundSnippet[]> = {
  python: [
    {
      title: 'Fibonacci Generator',
      description: 'Compute the first 6 Fibonacci numbers using tuple unpacking.',
      code: [
        'a, b = 0, 1',
        'seq = []',
        'for _ in range(6):',
        '    seq.append(a)',
        '    a, b = b, a + b',
        'print("Fibonacci:", seq)',
      ],
      output: ['> Running main.py...', 'Fibonacci: [0, 1, 1, 2, 3, 5]', 'Process exited with code 0'],
    },
    {
      title: 'Dictionary Comprehension',
      description: 'Square even numbers into a lookup table.',
      code: [
        'nums = [1, 2, 3, 4, 5, 6]',
        'squares = {n: n ** 2 for n in nums if n % 2 == 0}',
        'print(squares)',
      ],
      output: ['> Running main.py...', '{2: 4, 4: 16, 6: 36}', 'Process exited with code 0'],
    },
  ],
  cpp: [
    {
      title: 'Pointer & Reference Swap',
      description: 'Modify two integers in place using C++ references.',
      code: [
        'void swapRef(int& a, int& b) {',
        '    int tmp = a;',
        '    a = b;',
        '    b = tmp;',
        '}',
        '// a=10, b=99 -> swapped:',
        'std::cout << "a=" << a << " b=" << b;',
      ],
      output: ['> Compiling main.cpp (clang++ -O2)...', 'a=99 b=10', 'Process exited with code 0'],
    },
    {
      title: 'Stack Array Sum',
      description: 'Accumulate elements of a fixed-size array.',
      code: [
        'int scores[4] = {15, 30, 45, 60};',
        'int total = 0;',
        'for (int s : scores) total += s;',
        'std::cout << "Total XP: " << total;',
      ],
      output: ['> Compiling main.cpp (clang++ -O2)...', 'Total XP: 150', 'Process exited with code 0'],
    },
  ],
  js: [
    {
      title: 'Array Pipeline (filter + map)',
      description: 'Filter active players and format their display tags.',
      code: [
        'const players = [',
        '  { name: "Luna", xp: 420 },',
        '  { name: "Max", xp: 90 },',
        '  { name: "Zoe", xp: 610 },',
        '];',
        'const top = players.filter(p => p.xp >= 400).map(p => p.name);',
        'console.log("Top:", top.join(", "));',
      ],
      output: ['> Running index.js (Node v22)...', 'Top: Luna, Zoe', 'Process exited with code 0'],
    },
    {
      title: 'Promise Chain',
      description: 'Resolve an async calculation and print the result.',
      code: [
        'const compute = async (n) => n * 15;',
        'compute(4).then(xp => {',
        '  console.log(`Earned +${xp} XP!`);',
        '});',
      ],
      output: ['> Running index.js (Node v22)...', 'Earned +60 XP!', 'Process exited with code 0'],
    },
  ],
  go: [
    {
      title: 'Goroutine & Channel Ping',
      description: 'Send a message from a concurrent goroutine over a typed channel.',
      code: [
        'ch := make(chan string, 1)',
        'go func() {',
        '    ch <- "pong from goroutine"',
        '}()',
        'fmt.Println("Received:", <-ch)',
      ],
      output: ['> Running main.go...', 'Received: pong from goroutine', 'Process exited with code 0'],
    },
    {
      title: 'Struct Method Receiver',
      description: 'Level up a Player struct using a pointer receiver.',
      code: [
        'type Player struct { Name string; Level int }',
        'func (p *Player) LevelUp() { p.Level++ }',
        'hero := Player{Name: "Kai", Level: 3}',
        'hero.LevelUp()',
        'fmt.Printf("%s is now Lv.%d\\n", hero.Name, hero.Level)',
      ],
      output: ['> Running main.go...', 'Kai is now Lv.4', 'Process exited with code 0'],
    },
  ],
};
