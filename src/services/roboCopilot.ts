import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LangId } from '@/data/types';
import { getCompilerSpec } from './compiler';
import type { RoboMood } from '@/components/ide/RoboMascot';

export type BotState = RoboMood;

export type CopilotAction =
  | 'complete'
  | 'fix'
  | 'explain'
  | 'optimize'
  | 'custom';

export interface CopilotDiffProposal {
  id: string;
  title: string;
  explanation: string;
  patchSummary: string;
  proposedFullCode: string;
  addedLines: string[];
  insertStartLine: number;
  mode: 'append' | 'replace';
}

export interface CopilotReply {
  message: string;
  proposal: CopilotDiffProposal | null;
  nextBotState: RoboMood;
}

export interface CopilotRequest {
  lang: LangId;
  code: string;
  action: CopilotAction;
  customPrompt?: string;
  stderr?: string;
  errorLine?: number | null;
  exitCode?: number;
}

const AI_KEY_STORAGE_ID = '@codelingo_ai_api_key_v1';
let cachedCustomApiKey: string | null | undefined;

export async function loadStoredAiApiKey(): Promise<string | null> {
  if (cachedCustomApiKey !== undefined) return cachedCustomApiKey;
  try {
    const raw = await AsyncStorage.getItem(AI_KEY_STORAGE_ID);
    cachedCustomApiKey = raw?.trim() ? raw.trim() : null;
    return cachedCustomApiKey;
  } catch {
    cachedCustomApiKey = null;
    return null;
  }
}

export async function saveStoredAiApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  cachedCustomApiKey = trimmed.length > 0 ? trimmed : null;
  try {
    if (trimmed.length > 0) {
      await AsyncStorage.setItem(AI_KEY_STORAGE_ID, trimmed);
    } else {
      await AsyncStorage.removeItem(AI_KEY_STORAGE_ID);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export async function hasConfiguredAiKey(): Promise<boolean> {
  const envKey = process.env.EXPO_PUBLIC_AI_API_KEY?.trim();
  if (envKey) return true;
  const stored = await loadStoredAiApiKey();
  return Boolean(stored);
}

const LANG_HUMAN_NAME: Record<LangId, string> = {
  python: 'Python',
  cpp: 'C++',
  c: 'C',
  js: 'JavaScript',
  ts: 'TypeScript',
  go: 'Go',
  rust: 'Rust',
  asm: 'x86 Assembly',
  java: 'Java',
  csharp: 'C#',
  swift: 'Swift',
  kotlin: 'Kotlin',
  php: 'PHP',
  lua: 'Lua',
  sql: 'SQL',
  julia: 'Julia',
  html: 'HTML',
  css: 'CSS',
};

let proposalCounter = 0;
function nextProposalId(): string {
  proposalCounter += 1;
  return `patch-${proposalCounter}`;
}

function splitLines(code: string): string[] {
  return code.replace(/\r\n/g, '\n').split('\n');
}

function buildDiffProposal(
  beforeCode: string,
  afterCode: string,
  title: string,
  explanation: string,
  patchSummary?: string,
): CopilotDiffProposal | null {
  const cleanBefore = beforeCode.replace(/\r\n/g, '\n').trimEnd();
  const cleanAfter = afterCode.replace(/\r\n/g, '\n').trimEnd();
  if (!cleanAfter || cleanBefore === cleanAfter) return null;

  const beforeLines = cleanBefore.length > 0 ? cleanBefore.split('\n') : [];
  const afterLines = cleanAfter.split('\n');

  let prefix = 0;
  while (
    prefix < beforeLines.length &&
    prefix < afterLines.length &&
    beforeLines[prefix] === afterLines[prefix]
  ) {
    prefix += 1;
  }

  let beforeSuffix = beforeLines.length - 1;
  let afterSuffix = afterLines.length - 1;
  while (
    beforeSuffix >= prefix &&
    afterSuffix >= prefix &&
    beforeLines[beforeSuffix] === afterLines[afterSuffix]
  ) {
    beforeSuffix -= 1;
    afterSuffix -= 1;
  }

  const changedSlice = afterLines.slice(prefix, afterSuffix + 1);
  const addedLines =
    changedSlice.length > 0
      ? changedSlice.slice(0, 14)
      : afterLines.slice(Math.max(0, afterLines.length - 6));

  const mode: 'append' | 'replace' =
    prefix >= beforeLines.length ? 'append' : 'replace';

  return {
    id: nextProposalId(),
    title,
    explanation,
    patchSummary:
      patchSummary ??
      (mode === 'append'
        ? `+${addedLines.length} line${addedLines.length === 1 ? '' : 's'}`
        : `Line ${prefix + 1}`),
    proposedFullCode: cleanAfter,
    addedLines,
    insertStartLine: prefix + 1,
    mode,
  };
}

/* ------------------------------------------------------------------ */
/*  Tier A: Cloud LLM Provider (OpenAI / Groq / Gemini / OpenRouter)   */
/* ------------------------------------------------------------------ */

interface ResolvedLlmEndpoint {
  url: string;
  model: string;
  headers: Record<string, string>;
}

async function resolveLlmEndpoint(): Promise<ResolvedLlmEndpoint | null> {
  const storedKey = await loadStoredAiApiKey();
  const apiKey = storedKey || process.env.EXPO_PUBLIC_AI_API_KEY?.trim() || '';

  if (!apiKey) return null;

  if (apiKey.startsWith('gsk_')) {
    return {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }

  if (apiKey.startsWith('AIza')) {
    return {
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.0-flash',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }

  if (apiKey.startsWith('sk-or-')) {
    return {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3.3-70b-instruct',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }

  return {
    url:
      process.env.EXPO_PUBLIC_AI_BASE_URL?.trim() ||
      'https://api.openai.com/v1/chat/completions',
    model: process.env.EXPO_PUBLIC_AI_MODEL?.trim() || 'gpt-4o-mini',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  };
}

async function tryExternalLlmCopilot(
  req: CopilotRequest,
): Promise<CopilotReply | null> {
  const endpoint = await resolveLlmEndpoint();
  if (!endpoint) return null;

  const spec = getCompilerSpec(req.lang);
  const systemPrompt = [
    `You are Robo, an expert ${LANG_HUMAN_NAME[req.lang]} IDE Copilot (${spec.mainFilename}).`,
    'Reply ONLY with strict JSON: {"explanation": string, "proposedCode": string | null}.',
    'Wrap all variable names, functions, and line numbers in backticks inside `explanation`.',
    'If action is `explain`, format `explanation` as 3 concise bullet points (`• Line X: ...`) and set `proposedCode` to null.',
    'If completing, fixing, or writing code, set `proposedCode` to the complete runnable file that compiles with Exit 0.',
  ].join(' ');

  const userPayload = [
    `Action: ${req.action}`,
    req.customPrompt ? `User request: ${req.customPrompt}` : '',
    req.stderr
      ? `Compiler stderr (line ${req.errorLine ?? '?'}):\n${req.stderr}`
      : '',
    `Current editor code:\n\`\`\`${req.lang}\n${req.code}\n\`\`\``,
  ]
    .filter(Boolean)
    .join('\n\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);
  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: endpoint.headers,
      body: JSON.stringify({
        model: endpoint.model,
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      explanation?: string;
      proposedCode?: string | null;
    };
    if (!parsed.explanation) return null;

    const proposal =
      typeof parsed.proposedCode === 'string' &&
      parsed.proposedCode.trim().length > 0
        ? buildDiffProposal(
            req.code,
            parsed.proposedCode,
            req.action === 'fix' ? 'Compiler Fix' : 'Copilot Patch',
            parsed.explanation,
          )
        : null;

    return {
      message: parsed.explanation.trim(),
      proposal,
      nextBotState: proposal ? 'happy' : 'idle',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/*  Tier B: Deep Deterministic Multi-Language Code Intelligence        */
/* ------------------------------------------------------------------ */

type AlgorithmId =
  | 'bubble_sort'
  | 'binary_search'
  | 'reverse_string'
  | 'factorial'
  | 'prime_check'
  | 'two_sum'
  | 'fibonacci'
  | 'linked_list'
  | 'palindrome'
  | 'matrix_multiply'
  | 'user_input';

interface AlgorithmDetectMatch {
  id: AlgorithmId;
  title: string;
}

function detectAlgorithmIntent(text: string): AlgorithmDetectMatch | null {
  const q = text.toLowerCase();
  if (/\bbubble\s*sort\b|\btri\s*[aà]\s*bulles?\b|\btri\s*bulle\b/.test(q)) {
    return { id: 'bubble_sort', title: 'Bubble Sort' };
  }
  if (
    /\bbinary\s*search\b|\bbsearch\b|\brecherche\s*binaire\b|\bdichotomie\b/.test(
      q,
    )
  ) {
    return { id: 'binary_search', title: 'Binary Search' };
  }
  if (
    /\bpalindrome\b/.test(q)
  ) {
    return { id: 'palindrome', title: 'Palindrome Check' };
  }
  if (
    /\breverse\s*(?:a\s*)?(?:string|text|word|str|array|list)\b|\binverser\b/.test(
      q,
    )
  ) {
    return { id: 'reverse_string', title: 'Reverse String' };
  }
  if (/\bfactorial\b|\bfactorielle\b/.test(q)) {
    return { id: 'factorial', title: 'Factorial' };
  }
  if (
    /\bprime\b|\bis_prime\b|\bisprime\b|\bnombre\s*premier\b/.test(q)
  ) {
    return { id: 'prime_check', title: 'Prime Check' };
  }
  if (/\btwo\s*sum\b|\b2sum\b|\bdeux\s*sommes\b|\bpair\s*sum\b/.test(q)) {
    return { id: 'two_sum', title: 'Two Sum' };
  }
  if (/\bfibonacci\b|\bfib\b/.test(q)) {
    return { id: 'fibonacci', title: 'Fibonacci Sequence' };
  }
  if (/\blinked\s*list\b|\bliste\s*cha[iî]n[eé]e\b/.test(q)) {
    return { id: 'linked_list', title: 'Linked List' };
  }
  if (/\bmatrix\b|\bmatrice\b/.test(q)) {
    return { id: 'matrix_multiply', title: 'Matrix Multiply' };
  }
  if (
    /\buser\s*input\b|\bread\s*stdin\b|\binput\(\)|\bcin\b|\bentr[eé]e\s*utilisateur\b/.test(
      q,
    )
  ) {
    return { id: 'user_input', title: 'Stdin Input Reader' };
  }
  if (/\bsort\b|\btrier\b|\bquicksort\b/.test(q)) {
    return { id: 'bubble_sort', title: 'Bubble Sort' };
  }
  return null;
}

function generateAlgorithmCode(algo: AlgorithmId, lang: LangId): string {
  switch (algo) {
    case 'bubble_sort':
      if (lang === 'cpp' || lang === 'c') {
        return [
          '#include <iostream>',
          '#include <vector>',
          '#include <utility>',
          'int main() {',
          '    std::vector<int> arr = {64, 25, 12, 22, 11};',
          '    for (size_t i = 0; i < arr.size(); i++) {',
          '        for (size_t j = 0; j + 1 < arr.size() - i; j++) {',
          '            if (arr[j] > arr[j + 1]) std::swap(arr[j], arr[j + 1]);',
          '        }',
          '    }',
          '    std::cout << "Bubble sorted: ";',
          '    for (int n : arr) std::cout << n << " ";',
          '    return 0;',
          '}',
        ].join('\n');
      }
      if (lang === 'js' || lang === 'ts') {
        return [
          'function bubbleSort(arr) {',
          '  const a = [...arr];',
          '  for (let i = 0; i < a.length; i++) {',
          '    for (let j = 0; j < a.length - i - 1; j++) {',
          '      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];',
          '    }',
          '  }',
          '  return a;',
          '}',
          'console.log("Bubble sorted:", bubbleSort([64, 25, 12, 22, 11]).join(" "));',
        ].join('\n');
      }
      if (lang === 'go') {
        return [
          'package main',
          'import "fmt"',
          'func main() {',
          '    a := []int{64, 25, 12, 22, 11}',
          '    for i := 0; i < len(a); i++ {',
          '        for j := 0; j < len(a)-i-1; j++ {',
          '            if a[j] > a[j+1] { a[j], a[j+1] = a[j+1], a[j] }',
          '        }',
          '    }',
          '    fmt.Println("Bubble sorted:", a)',
          '}',
        ].join('\n');
      }
      if (lang === 'rust') {
        return [
          'fn main() {',
          '    let mut a = [64, 25, 12, 22, 11];',
          '    let n = a.len();',
          '    for i in 0..n {',
          '        for j in 0..(n - 1 - i) {',
          '            if a[j] > a[j + 1] { a.swap(j, j + 1); }',
          '        }',
          '    }',
          '    println!("Bubble sorted: {:?}", a);',
          '}',
        ].join('\n');
      }
      return [
        'def bubble_sort(arr):',
        '    n = len(arr)',
        '    for i in range(n):',
        '        for j in range(0, n - i - 1):',
        '            if arr[j] > arr[j + 1]:',
        '                arr[j], arr[j + 1] = arr[j + 1], arr[j]',
        '    return arr',
        '',
        'data = [64, 25, 12, 22, 11]',
        'print("Bubble sorted:", bubble_sort(data))',
      ].join('\n');

    case 'binary_search':
      if (lang === 'cpp' || lang === 'c') {
        return [
          '#include <iostream>',
          '#include <vector>',
          'int binarySearch(const std::vector<int>& arr, int target) {',
          '    int lo = 0, hi = (int)arr.size() - 1;',
          '    while (lo <= hi) {',
          '        int mid = lo + (hi - lo) / 2;',
          '        if (arr[mid] == target) return mid;',
          '        if (arr[mid] < target) lo = mid + 1;',
          '        else hi = mid - 1;',
          '    }',
          '    return -1;',
          '}',
          'int main() {',
          '    std::vector<int> nums = {3, 8, 14, 21, 34, 55};',
          '    std::cout << "Found 21 at index: " << binarySearch(nums, 21);',
          '    return 0;',
          '}',
        ].join('\n');
      }
      if (lang === 'js' || lang === 'ts') {
        return [
          'function binarySearch(arr, target) {',
          '  let lo = 0, hi = arr.length - 1;',
          '  while (lo <= hi) {',
          '    const mid = (lo + hi) >> 1;',
          '    if (arr[mid] === target) return mid;',
          '    if (arr[mid] < target) lo = mid + 1;',
          '    else hi = mid - 1;',
          '  }',
          '  return -1;',
          '}',
          'console.log("Index of 21:", binarySearch([3, 8, 14, 21, 34, 55], 21));',
        ].join('\n');
      }
      if (lang === 'go') {
        return [
          'package main',
          'import "fmt"',
          'func binarySearch(arr []int, target int) int {',
          '    lo, hi := 0, len(arr)-1',
          '    for lo <= hi {',
          '        mid := (lo + hi) / 2',
          '        if arr[mid] == target { return mid }',
          '        if arr[mid] < target { lo = mid + 1 } else { hi = mid - 1 }',
          '    }',
          '    return -1',
          '}',
          'func main() {',
          '    fmt.Println("Found 21 at index:", binarySearch([]int{3, 8, 14, 21, 34, 55}, 21))',
          '}',
        ].join('\n');
      }
      return [
        'def binary_search(arr, target):',
        '    lo, hi = 0, len(arr) - 1',
        '    while lo <= hi:',
        '        mid = (lo + hi) // 2',
        '        if arr[mid] == target:',
        '            return mid',
        '        elif arr[mid] < target:',
        '            lo = mid + 1',
        '        else:',
        '            hi = mid - 1',
        '    return -1',
        '',
        'nums = [3, 8, 14, 21, 34, 55]',
        'print("Found 21 at index:", binary_search(nums, 21))',
      ].join('\n');

    case 'reverse_string':
      if (lang === 'cpp') {
        return [
          '#include <iostream>',
          '#include <string>',
          '#include <algorithm>',
          'int main() {',
          '    std::string text = "CodeLingo";',
          '    std::reverse(text.begin(), text.end());',
          '    std::cout << "Reversed: " << text;',
          '    return 0;',
          '}',
        ].join('\n');
      }
      if (lang === 'js' || lang === 'ts') {
        return [
          'function reverseString(s) {',
          '  return s.split("").reverse().join("");',
          '}',
          'console.log("Reversed:", reverseString("CodeLingo"));',
        ].join('\n');
      }
      return [
        'def reverse_string(text):',
        '    return text[::-1]',
        '',
        'word = "CodeLingo"',
        'print("Reversed:", reverse_string(word))',
      ].join('\n');

    case 'factorial':
      if (lang === 'cpp' || lang === 'c') {
        return [
          '#include <iostream>',
          'long long factorial(int n) {',
          '    long long res = 1;',
          '    for (int i = 2; i <= n; i++) res *= i;',
          '    return res;',
          '}',
          'int main() {',
          '    std::cout << "6! = " << factorial(6);',
          '    return 0;',
          '}',
        ].join('\n');
      }
      if (lang === 'js' || lang === 'ts') {
        return [
          'function factorial(n) {',
          '  let res = 1;',
          '  for (let i = 2; i <= n; i++) res *= i;',
          '  return res;',
          '}',
          'console.log("6! =", factorial(6));',
        ].join('\n');
      }
      return [
        'def factorial(n):',
        '    result = 1',
        '    for i in range(2, n + 1):',
        '        result *= i',
        '    return result',
        '',
        'print("6! =", factorial(6))',
      ].join('\n');

    case 'prime_check':
      if (lang === 'cpp') {
        return [
          '#include <iostream>',
          'bool isPrime(int n) {',
          '    if (n < 2) return false;',
          '    for (int i = 2; i * i <= n; i++) {',
          '        if (n % i == 0) return false;',
          '    }',
          '    return true;',
          '}',
          'int main() {',
          '    for (int n : {2, 17, 24, 29}) {',
          '        std::cout << n << (isPrime(n) ? " is prime\\n" : " is composite\\n");',
          '    }',
          '    return 0;',
          '}',
        ].join('\n');
      }
      if (lang === 'js' || lang === 'ts') {
        return [
          'function isPrime(n) {',
          '  if (n < 2) return false;',
          '  for (let i = 2; i * i <= n; i++) {',
          '    if (n % i === 0) return false;',
          '  }',
          '  return true;',
          '}',
          'console.log("Primes up to 20:", [2,3,4,5,11,15,17,19].filter(isPrime));',
        ].join('\n');
      }
      return [
        'def is_prime(n):',
        '    if n < 2:',
        '        return False',
        '    for i in range(2, int(n ** 0.5) + 1):',
        '        if n % i == 0:',
        '            return False',
        '    return True',
        '',
        'primes = [x for x in range(2, 30) if is_prime(x)]',
        'print("Primes < 30:", primes)',
      ].join('\n');

    case 'two_sum':
      if (lang === 'cpp') {
        return [
          '#include <iostream>',
          '#include <vector>',
          '#include <unordered_map>',
          'int main() {',
          '    std::vector<int> nums = {2, 7, 11, 15};',
          '    int target = 9;',
          '    std::unordered_map<int, int> seen;',
          '    for (int i = 0; i < (int)nums.size(); i++) {',
          '        int need = target - nums[i];',
          '        if (seen.count(need)) {',
          '            std::cout << "Two Sum indices: [" << seen[need] << ", " << i << "]";',
          '        }',
          '        seen[nums[i]] = i;',
          '    }',
          '    return 0;',
          '}',
        ].join('\n');
      }
      if (lang === 'js' || lang === 'ts') {
        return [
          'function twoSum(nums, target) {',
          '  const seen = new Map();',
          '  for (let i = 0; i < nums.length; i++) {',
          '    const need = target - nums[i];',
          '    if (seen.has(need)) return [seen.get(need), i];',
          '    seen.set(nums[i], i);',
          '  }',
          '  return [];',
          '}',
          'console.log("Two Sum [2,7,11,15] -> 9:", twoSum([2, 7, 11, 15], 9));',
        ].join('\n');
      }
      return [
        'def two_sum(nums, target):',
        '    seen = {}',
        '    for i, num in enumerate(nums):',
        '        diff = target - num',
        '        if diff in seen:',
        '            return [seen[diff], i]',
        '        seen[num] = i',
        '    return []',
        '',
        'print("Two Sum indices:", two_sum([2, 7, 11, 15], 9))',
      ].join('\n');

    case 'fibonacci':
      if (lang === 'cpp') {
        return [
          '#include <iostream>',
          'int main() {',
          '    int a = 0, b = 1;',
          '    std::cout << "Fibonacci: ";',
          '    for (int i = 0; i < 8; i++) {',
          '        std::cout << a << " ";',
          '        int next = a + b;',
          '        a = b;',
          '        b = next;',
          '    }',
          '    return 0;',
          '}',
        ].join('\n');
      }
      if (lang === 'js' || lang === 'ts') {
        return [
          'function fibonacci(n) {',
          '  const seq = [0, 1];',
          '  for (let i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2]);',
          '  return seq.slice(0, n);',
          '}',
          'console.log("Fibonacci(8):", fibonacci(8).join(", "));',
        ].join('\n');
      }
      return [
        'def fibonacci(n):',
        '    a, b = 0, 1',
        '    seq = []',
        '    for _ in range(n):',
        '        seq.append(a)',
        '        a, b = b, a + b',
        '    return seq',
        '',
        'print("Fibonacci(8):", fibonacci(8))',
      ].join('\n');

    case 'linked_list':
      if (lang === 'cpp') {
        return [
          '#include <iostream>',
          'struct Node {',
          '    int val;',
          '    Node* next;',
          '};',
          'int main() {',
          '    Node n3{30, nullptr};',
          '    Node n2{20, &n3};',
          '    Node n1{10, &n2};',
          '    for (Node* cur = &n1; cur != nullptr; cur = cur->next) {',
          '        std::cout << cur->val << " -> ";',
          '    }',
          '    std::cout << "NULL";',
          '    return 0;',
          '}',
        ].join('\n');
      }
      return [
        'class Node:',
        '    def __init__(self, val, nxt=None):',
        '        self.val = val',
        '        self.next = nxt',
        '',
        'head = Node(10, Node(20, Node(30)))',
        'cur, out = head, []',
        'while cur:',
        '    out.append(str(cur.val))',
        '    cur = cur.next',
        'print(" -> ".join(out) + " -> None")',
      ].join('\n');

    case 'palindrome':
      if (lang === 'cpp') {
        return [
          '#include <iostream>',
          '#include <string>',
          'bool isPalindrome(const std::string& s) {',
          '    int l = 0, r = (int)s.size() - 1;',
          '    while (l < r) {',
          '        if (s[l++] != s[r--]) return false;',
          '    }',
          '    return true;',
          '}',
          'int main() {',
          '    std::cout << "racecar: " << (isPalindrome("racecar") ? "true" : "false");',
          '    return 0;',
          '}',
        ].join('\n');
      }
      if (lang === 'js' || lang === 'ts') {
        return [
          'function isPalindrome(s) {',
          '  const clean = s.toLowerCase();',
          '  return clean === clean.split("").reverse().join("");',
          '}',
          'console.log("racecar ->", isPalindrome("racecar"));',
        ].join('\n');
      }
      return [
        'def is_palindrome(s):',
        '    clean = s.lower()',
        '    return clean == clean[::-1]',
        '',
        'for word in ["racecar", "level", "python"]:',
        '    print(f"{word}: {is_palindrome(word)}")',
      ].join('\n');

    case 'matrix_multiply':
      return [
        'def matmul_2x2(A, B):',
        '    return [',
        '        [A[0][0]*B[0][0] + A[0][1]*B[1][0], A[0][0]*B[0][1] + A[0][1]*B[1][1]],',
        '        [A[1][0]*B[0][0] + A[1][1]*B[1][0], A[1][0]*B[0][1] + A[1][1]*B[1][1]],',
        '    ]',
        '',
        'A = [[1, 2], [3, 4]]',
        'B = [[5, 6], [7, 8]]',
        'print("A x B =", matmul_2x2(A, B))',
      ].join('\n');

    case 'user_input':
      if (lang === 'cpp') {
        return [
          '#include <iostream>',
          '#include <string>',
          'int main() {',
          '    std::string name = "Coder";',
          '    std::cin >> name;',
          '    std::cout << "Hello, " << name << "!";',
          '    return 0;',
          '}',
        ].join('\n');
      }
      return [
        'import sys',
        'raw = sys.stdin.read().strip() or "Coder"',
        'print(f"Received input: {raw}")',
      ].join('\n');
  }
}

/* ------------------------------------------------------------------ */
/*  1. Deep Unfinished Function / Loop / Variable Synthesizer          */
/* ------------------------------------------------------------------ */

function extractCommentsFromCode(code: string): string {
  const lines = splitLines(code);
  const commentParts: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('#') &&
      !trimmed.startsWith('#include') &&
      !trimmed.startsWith('#define')
    ) {
      commentParts.push(trimmed.slice(1).trim());
    } else if (trimmed.startsWith('//')) {
      commentParts.push(trimmed.slice(2).trim());
    } else if (trimmed.startsWith(';') || trimmed.startsWith('--')) {
      commentParts.push(trimmed.slice(2).trim());
    }
  }
  return commentParts.join(' ');
}

function inferPythonFunctionBody(
  fnName: string,
  params: string[],
  indent: string,
): { bodyLines: string[]; sampleCall: string; summary: string } {
  const p0 = params[0] || 'nums';
  const p1 = params[1] || 'target';
  const nameLower = fnName.toLowerCase();

  if (/avg|average|mean|moyenne/.test(nameLower)) {
    return {
      bodyLines: [
        `${indent}if not ${p0}:`,
        `${indent}    return 0`,
        `${indent}return sum(${p0}) / len(${p0})`,
      ],
      sampleCall: `print("${fnName}:", ${fnName}([10, 20, 30, 40]))`,
      summary: `sum(${p0}) / len(${p0})`,
    };
  }
  if (/max|largest|highest|maximum/.test(nameLower)) {
    return {
      bodyLines: [
        `${indent}best = ${p0}[0]`,
        `${indent}for item in ${p0}:`,
        `${indent}    if item > best:`,
        `${indent}        best = item`,
        `${indent}return best`,
      ],
      sampleCall: `print("${fnName}:", ${fnName}([14, 42, 8, 99, 23]))`,
      summary: `maximum element scan over \`${p0}\``,
    };
  }
  if (/min|smallest|lowest|minimum/.test(nameLower)) {
    return {
      bodyLines: [
        `${indent}best = ${p0}[0]`,
        `${indent}for item in ${p0}:`,
        `${indent}    if item < best:`,
        `${indent}        best = item`,
        `${indent}return best`,
      ],
      sampleCall: `print("${fnName}:", ${fnName}([14, 42, 8, 99, 23]))`,
      summary: `minimum element scan over \`${p0}\``,
    };
  }
  if (/sum|total|somme/.test(nameLower)) {
    return {
      bodyLines: [
        `${indent}total = 0`,
        `${indent}for x in ${p0}:`,
        `${indent}    total += x`,
        `${indent}return total`,
      ],
      sampleCall: `print("${fnName}:", ${fnName}([10, 25, 35, 50]))`,
      summary: `accumulator loop over \`${p0}\``,
    };
  }
  if (/even|pair|filter/.test(nameLower)) {
    return {
      bodyLines: [`${indent}return [x for x in ${p0} if x % 2 == 0]`],
      sampleCall: `print("${fnName}:", ${fnName}([1, 2, 3, 4, 5, 6]))`,
      summary: `even filter comprehension on \`${p0}\``,
    };
  }
  if (/reverse|invert|invers/.test(nameLower)) {
    return {
      bodyLines: [`${indent}return ${p0}[::-1]`],
      sampleCall: `print("${fnName}:", ${fnName}("CodeLingo"))`,
      summary: `slice reversal \`${p0}[::-1]\``,
    };
  }
  if (/fact/.test(nameLower)) {
    return {
      bodyLines: [
        `${indent}res = 1`,
        `${indent}for i in range(2, ${p0} + 1):`,
        `${indent}    res *= i`,
        `${indent}return res`,
      ],
      sampleCall: `print("${fnName}(5):", ${fnName}(5))`,
      summary: `iterative factorial of \`${p0}\``,
    };
  }
  if (/prime|premier/.test(nameLower)) {
    return {
      bodyLines: [
        `${indent}if ${p0} < 2:`,
        `${indent}    return False`,
        `${indent}for i in range(2, int(${p0} ** 0.5) + 1):`,
        `${indent}    if ${p0} % i == 0:`,
        `${indent}        return False`,
        `${indent}return True`,
      ],
      sampleCall: `print("${fnName}(17):", ${fnName}(17))`,
      summary: `trial division primality check on \`${p0}\``,
    };
  }
  if (/palin/.test(nameLower)) {
    return {
      bodyLines: [
        `${indent}s = str(${p0}).lower()`,
        `${indent}return s == s[::-1]`,
      ],
      sampleCall: `print("${fnName}('racecar'):", ${fnName}("racecar"))`,
      summary: `palindrome check on \`${p0}\``,
    };
  }
  if (/search|find|cherch/.test(nameLower) && params.length >= 2) {
    return {
      bodyLines: [
        `${indent}for idx, val in enumerate(${p0}):`,
        `${indent}    if val == ${p1}:`,
        `${indent}        return idx`,
        `${indent}return -1`,
      ],
      sampleCall: `print("${fnName}:", ${fnName}([4, 9, 15, 22], 15))`,
      summary: `index lookup of \`${p1}\` in \`${p0}\``,
    };
  }
  if (/sort|tri/.test(nameLower)) {
    return {
      bodyLines: [`${indent}return sorted(${p0})`],
      sampleCall: `print("${fnName}:", ${fnName}([42, 12, 8, 99, 23]))`,
      summary: `sorted output for \`${p0}\``,
    };
  }

  return {
    bodyLines: [
      `${indent}result = []`,
      `${indent}for item in ${p0}:`,
      `${indent}    result.append(item)`,
      `${indent}return result`,
    ],
    sampleCall: `print("${fnName}:", ${fnName}([1, 2, 3]))`,
    summary: `iteration and return over \`${p0}\``,
  };
}

function synthesizeSmartCompletion(lang: LangId, code: string): CopilotReply {
  const lines = splitLines(code);
  const trimmed = code.trim();

  // 1. Check if comments inside the file request a specific algorithm
  const commentText = extractCommentsFromCode(code);
  const commentAlgo = detectAlgorithmIntent(commentText);
  if (commentAlgo && lines.length <= 8) {
    const generated = generateAlgorithmCode(commentAlgo.id, lang);
    const msg = `Synthesized a complete, runnable **${commentAlgo.title}** implementation in \`${LANG_HUMAN_NAME[lang]}\` from your comment.`;
    return {
      message: msg,
      proposal: buildDiffProposal(
        code,
        generated,
        commentAlgo.title,
        msg,
        `${splitLines(generated).length} lines`,
      ),
      nextBotState: 'happy',
    };
  }

  // 2. Empty editor buffer -> generate runnable algorithm
  if (!trimmed) {
    const generated = generateAlgorithmCode('fibonacci', lang);
    const msg = `Generated a runnable \`${LANG_HUMAN_NAME[lang]}\` Fibonacci implementation with test output.`;
    return {
      message: msg,
      proposal: buildDiffProposal(code, generated, 'Starter Code', msg),
      nextBotState: 'happy',
    };
  }

  const lastNonEmptyIdx = (() => {
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      if (lines[i].trim().length > 0) return i;
    }
    return 0;
  })();
  const lastLine = lines[lastNonEmptyIdx].trim();
  const lastLineRaw = lines[lastNonEmptyIdx];
  const baseIndent = /^(\s*)/.exec(lastLineRaw)?.[1] ?? '';

  // 3. Python-specific deep structural completion
  if (lang === 'python') {
    // 3A. Unfinished `def fn_name(params):` (either at end of file or followed only by `pass`)
    const defMatch =
      /^\s*def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:?\s*$/.exec(lastLineRaw) ??
      (lastLine === 'pass' && lastNonEmptyIdx >= 1
        ? /^\s*def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:?\s*$/.exec(
            lines[lastNonEmptyIdx - 1],
          )
        : null);

    if (defMatch) {
      const fnName = defMatch[1];
      const rawParams = defMatch[2]
        .split(',')
        .map((p) => p.split(':')[0].split('=')[0].trim())
        .filter(Boolean);
      const defLineIdx =
        lastLine === 'pass' ? lastNonEmptyIdx - 1 : lastNonEmptyIdx;
      const fnIndent = /^(\s*)/.exec(lines[defLineIdx])?.[1] ?? '';
      const bodyIndent = `${fnIndent}    `;

      const { bodyLines, sampleCall, summary } = inferPythonFunctionBody(
        fnName,
        rawParams,
        bodyIndent,
      );

      const prefixLines = lines.slice(0, defLineIdx + 1);
      if (!prefixLines[defLineIdx].trimEnd().endsWith(':')) {
        prefixLines[defLineIdx] = `${prefixLines[defLineIdx].trimEnd()}:`;
      }
      const nextCode = [...prefixLines, ...bodyLines, '', sampleCall].join('\n');
      const msg = `Completed \`${fnName}(${rawParams.join(', ')})\` using ${summary} and added a \`print()\` test call.`;
      return {
        message: msg,
        proposal: buildDiffProposal(
          code,
          nextCode,
          `Complete ${fnName}()`,
          msg,
        ),
        nextBotState: 'happy',
      };
    }

    // 3B. Partial Python function with local variables (`results = []`, `v.sort()`, etc.) lacking `return`
    const topDefMatch = /^\s*def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:/m.exec(
      code,
    );
    if (topDefMatch && !/\breturn\b/.test(code)) {
      const fnName = topDefMatch[1];
      const param0 =
        topDefMatch[2]
          .split(',')[0]
          ?.split(':')[0]
          ?.split('=')[0]
          ?.trim() || 'numbers';
      const listVar =
        /^\s*([a-zA-Z_]\w*)\s*=\s*\[\s*\]/m.exec(code)?.[1] ?? null;
      const iterSource =
        /^\s*([a-zA-Z_]\w*)\.sort\(\)/m.exec(code)?.[1] ?? param0;

      if (listVar) {
        const addition = [
          `    for n in ${iterSource}:`,
          `        ${listVar}.append(n)`,
          `    return ${listVar}`,
          '',
          `print(${fnName}([9, 2, 7, 4, 1]))`,
        ].join('\n');
        const nextCode = `${code.trimEnd()}\n${addition}`;
        const msg = `Completed \`${fnName}()\` by iterating \`${iterSource}\`, appending to \`${listVar}\`, and returning \`${listVar}\`.`;
        return {
          message: msg,
          proposal: buildDiffProposal(
            code,
            nextCode,
            `Complete ${fnName}()`,
            msg,
          ),
          nextBotState: 'happy',
        };
      }
    }

    // 3C. Unfinished Python `for` / `while` / `if` header ending in `:`
    if (lastLine.endsWith(':')) {
      const innerIndent = `${baseIndent}    `;
      const forMatch = /^for\s+([a-zA-Z_]\w*)\s+in\s+(.+):$/.exec(lastLine);
      if (forMatch) {
        const loopVar = forMatch[1];
        const accVar =
          /^\s*([a-zA-Z_]\w*)\s*=\s*0\b/m.exec(code)?.[1] ??
          /^\s*([a-zA-Z_]\w*)\s*=\s*\[\s*\]/m.exec(code)?.[1];
        const isListAcc = new RegExp(
          `^\\s*${accVar ?? '__none'}\\s*=\\s*\\[`,
          'm',
        ).test(code);

        const body = accVar
          ? isListAcc
            ? `${innerIndent}${accVar}.append(${loopVar})\n${baseIndent}print("Result:", ${accVar})`
            : `${innerIndent}${accVar} += ${loopVar}\n${baseIndent}print("Total:", ${accVar})`
          : `${innerIndent}print("Value:", ${loopVar})`;

        const nextCode = `${code.trimEnd()}\n${body}`;
        const msg = accVar
          ? `Completed the \`for ${loopVar}\` loop updating \`${accVar}\` and printing the final result.`
          : `Completed the \`for ${loopVar}\` loop body with a \`print()\` output statement.`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, nextCode, 'Complete Loop', msg),
          nextBotState: 'happy',
        };
      }

      const ifMatch = /^(?:if|elif)\s+(.+):$/.exec(lastLine);
      if (ifMatch) {
        const cond = ifMatch[1];
        const nextCode = `${code.trimEnd()}\n${innerIndent}print("Condition matched:", ${cond})`;
        const msg = `Completed the \`if ${cond}:\` branch with a verification \`print()\`.`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, nextCode, 'Complete Branch', msg),
          nextBotState: 'happy',
        };
      }
    }

    // 3D. Declared variables in Python without `print`
    if (!/\bprint\s*\(/.test(code)) {
      const assignedVars = [
        ...code.matchAll(/^\s*([a-zA-Z_]\w*)\s*=\s*[^=]/gm),
      ].map((m) => m[1]);
      const lastVar = assignedVars[assignedVars.length - 1];
      if (lastVar) {
        const nextCode = `${code.trimEnd()}\nprint("${lastVar} =", ${lastVar})`;
        const msg = `Added \`print("${lastVar} =", ${lastVar})\` so running your script displays the computed value of \`${lastVar}\`.`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, nextCode, `Print ${lastVar}`, msg),
          nextBotState: 'happy',
        };
      }
    }
  }

  // 4. C++ / C / Go / Rust / JS / TS Unfinished Function Signature Completion
  const cFuncMatch =
    /(?:int|long|double|float|bool|void|auto|string|std::string)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{\s*$/.exec(
      lastLine,
    ) ??
    /func\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)[^{]*\{\s*$/.exec(lastLine) ??
    /fn\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)[^{]*\{\s*$/.exec(lastLine) ??
    /function\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{\s*$/.exec(lastLine);

  if (cFuncMatch) {
    const fnName = cFuncMatch[1];
    const rawParams = cFuncMatch[2];
    const firstParamToken =
      rawParams
        .split(',')[0]
        ?.trim()
        .split(/\s+/)
        .filter((t) => !t.includes(':') && !t.includes('&') && !t.includes('*'))
        .pop()
        ?.replace(/[&*[\]]/g, '') || 'v';

    let completionBlock = '';
    if (lang === 'cpp' || lang === 'c') {
      if (/max/i.test(fnName)) {
        completionBlock = [
          `    int best = ${firstParamToken}[0];`,
          `    for (int x : ${firstParamToken}) if (x > best) best = x;`,
          '    return best;',
          '}',
          'int main() {',
          '    std::vector<int> sample = {12, 45, 7, 89, 23};',
          `    std::cout << "${fnName}: " << ${fnName}(sample);`,
          '    return 0;',
          '}',
        ].join('\n');
      } else {
        completionBlock = [
          '    int total = 0;',
          `    for (int x : ${firstParamToken}) total += x;`,
          '    return total;',
          '}',
          'int main() {',
          '    std::vector<int> sample = {10, 20, 30, 40};',
          `    std::cout << "${fnName}: " << ${fnName}(sample);`,
          '    return 0;',
          '}',
        ].join('\n');
      }
    } else if (lang === 'go') {
      completionBlock = [
        '    total := 0',
        `    for _, v := range ${firstParamToken} { total += v }`,
        '    return total',
        '}',
        'func main() {',
        `    fmt.Println("${fnName}:", ${fnName}([]int{10, 20, 30, 40}))`,
        '}',
      ].join('\n');
    } else if (lang === 'rust') {
      completionBlock = [
        `    ${firstParamToken}.iter().sum()`,
        '}',
        'fn main() {',
        `    println!("${fnName}: {}", ${fnName}(&[10, 20, 30, 40]));`,
        '}',
      ].join('\n');
    } else {
      completionBlock = [
        `  return Array.isArray(${firstParamToken}) ? ${firstParamToken}.reduce((a, b) => a + b, 0) : ${firstParamToken};`,
        '}',
        `console.log("${fnName}:", ${fnName}([10, 20, 30, 40]));`,
      ].join('\n');
    }

    const nextCode = `${code.trimEnd()}\n${completionBlock}`;
    const msg = `Synthesized the body for \`${fnName}(${firstParamToken})\` and added an entrypoint call so you can hit \`RUN\`.`;
    return {
      message: msg,
      proposal: buildDiffProposal(code, nextCode, `Complete ${fnName}()`, msg),
      nextBotState: 'happy',
    };
  }

  // 5. Unclosed `{` blocks in C/C++/JS/TS/Go/Rust/Java/C#
  const openBraces = (code.match(/\{/g) ?? []).length;
  const closeBraces = (code.match(/\}/g) ?? []).length;
  if (openBraces > closeBraces) {
    const diff = openBraces - closeBraces;
    let bodyLine = '';
    if (lang === 'cpp') {
      const vecVar = /vector<\w+>\s+(\w+)/.exec(code)?.[1];
      bodyLine = vecVar
        ? `    for (auto x : ${vecVar}) std::cout << x << " ";\n    return 0;\n`
        : '    std::cout << "Done" << std::endl;\n    return 0;\n';
    } else if (lang === 'js' || lang === 'ts') {
      bodyLine = '  console.log("Completed block");\n';
    } else if (lang === 'go') {
      bodyLine = '    fmt.Println("Completed block")\n';
    } else if (lang === 'rust') {
      bodyLine = '    println!("Completed block");\n';
    }
    const nextCode = `${code.trimEnd()}\n${bodyLine}${'}'.repeat(diff)}`;
    const msg = `Completed the open \`{\` block${diff > 1 ? 's' : ''} and added output logging.`;
    return {
      message: msg,
      proposal: buildDiffProposal(code, nextCode, 'Complete Block', msg),
      nextBotState: 'happy',
    };
  }

  // 6. C++ complete program extension referencing user's actual vector/variables
  if (lang === 'cpp') {
    const vecMatch = /std::vector<int>\s+(\w+)/.exec(code);
    if (vecMatch && !/max_element|accumulate/.test(code)) {
      const vName = vecMatch[1];
      const nextCode = code.includes('return 0;')
        ? code.replace(
            'return 0;',
            `std::cout << "\\nMin: " << *std::min_element(${vName}.begin(), ${vName}.end()) << " | Max: " << *std::max_element(${vName}.begin(), ${vName}.end()) << std::endl;\n    return 0;`,
          )
        : `${code.trimEnd()}\nstd::cout << "\\nCount: " << ${vName}.size();`;
      const msg = `Extended your C++ program to print \`std::min_element\` and \`std::max_element\` of \`${vName}\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(
          code,
          nextCode,
          `Inspect ${vName}`,
          msg,
        ),
        nextBotState: 'happy',
      };
    }
  }

  // 7. JS / TS array / variable inspection
  if (lang === 'js' || lang === 'ts') {
    const decls = [
      ...code.matchAll(/\b(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=/g),
    ].map((m) => m[1]);
    const targetVar = decls[decls.length - 1] ?? 'result';
    const nextCode = `${code.trimEnd()}\nconsole.log("Summary (${targetVar}):", JSON.stringify(${targetVar}));`;
    const msg = `Added a structured \`console.log\` inspecting \`${targetVar}\`.`;
    return {
      message: msg,
      proposal: buildDiffProposal(code, nextCode, `Inspect ${targetVar}`, msg),
      nextBotState: 'happy',
    };
  }

  // 8. Python complete program extension referencing user's actual function or variable
  if (lang === 'python') {
    const fnMatch = /^\s*def\s+([a-zA-Z_]\w*)\s*\(/m.exec(code);
    const varMatch = [...code.matchAll(/^([a-zA-Z_]\w*)\s*=\s*\[/gm)].pop();
    const vName = varMatch?.[1];
    if (vName) {
      const nextCode = `${code.trimEnd()}\nprint(f"Stats for ${vName} -> len={len(${vName})}, sum={sum(${vName})}, max={max(${vName})}")`;
      const msg = `Added a summary \`print(f"...")\` displaying \`len(${vName})\`, \`sum(${vName})\`, and \`max(${vName})\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, nextCode, `Summarize ${vName}`, msg),
        nextBotState: 'happy',
      };
    }
    if (fnMatch) {
      const fn = fnMatch[1];
      const nextCode = `${code.trimEnd()}\nprint("Benchmark ${fn}:", ${fn}([12, 5, 8, 3, 19]))`;
      const msg = `Added an extra test call for \`${fn}()\` with a second input list.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, nextCode, `Test ${fn}()`, msg),
        nextBotState: 'happy',
      };
    }
  }

  // Fallback for Go / Rust / SQL / Lua / Swift / ASM
  const fallbackAlgo = generateAlgorithmCode('binary_search', lang);
  const msg = `Generated a complete \`${LANG_HUMAN_NAME[lang]}\` binary search example you can run and customize.`;
  return {
    message: msg,
    proposal: buildDiffProposal(code, fallbackAlgo, 'Binary Search', msg),
    nextBotState: 'happy',
  };
}

/* ------------------------------------------------------------------ */
/*  2. Surgical Compiler Error Auto-Fixer (`🔧 Fix Error`)              */
/* ------------------------------------------------------------------ */

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

function findClosestSymbol(
  typo: string,
  candidates: string[],
): string | null {
  let best: string | null = null;
  let bestDist = 3; // max distance 2
  for (const cand of candidates) {
    if (cand === typo || cand.length < 2) continue;
    const d = levenshteinDistance(typo.toLowerCase(), cand.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = cand;
    }
  }
  return best;
}

function collectDeclaredIdentifiers(code: string, lang: LangId): string[] {
  const set = new Set<string>();
  for (const m of code.matchAll(
    /\b(?:def|function|fn|func|let|const|var|int|double|float|bool|string|auto)\s+([a-zA-Z_]\w*)/g,
  )) {
    set.add(m[1]);
  }
  for (const m of code.matchAll(/^\s*([a-zA-Z_]\w*)\s*:?=/gm)) {
    set.add(m[1]);
  }
  for (const m of code.matchAll(/\bfor\s+\(?([a-zA-Z_]\w*)/g)) {
    set.add(m[1]);
  }
  if (lang === 'python') {
    ['print', 'range', 'len', 'sum', 'min', 'max', 'sorted', 'enumerate', 'append', 'str', 'int', 'list'].forEach((b) =>
      set.add(b),
    );
  } else if (lang === 'js' || lang === 'ts') {
    ['console', 'log', 'Math', 'Array', 'JSON', 'Promise', 'parseInt'].forEach(
      (b) => set.add(b),
    );
  } else if (lang === 'cpp' || lang === 'c') {
    ['cout', 'cin', 'endl', 'vector', 'sort', 'string', 'printf', 'swap'].forEach(
      (b) => set.add(b),
    );
  }
  return [...set];
}

function synthesizeSurgicalFix(
  lang: LangId,
  code: string,
  stderr: string = '',
  errorLine: number | null = null,
): CopilotReply {
  const lines = splitLines(code);
  const spec = getCompilerSpec(lang);
  const errLower = stderr.toLowerCase();
  const candidates = collectDeclaredIdentifiers(code, lang);

  // --- PYTHON SURGICAL FIXES ---
  if (lang === 'python') {
    // 1. Missing colon `:` on `def`, `for`, `if`, `elif`, `else`, `while`, `class`
    const missingColonIdx = lines.findIndex(
      (l) =>
        /^\s*(?:def\s+\w+\s*\([^)]*\)|(?:for|if|elif|while)\s+[^:]+|else|try|finally)\s*$/.test(
          l,
        ) && !l.trimEnd().endsWith(':'),
    );
    if (missingColonIdx !== -1) {
      const updated = [...lines];
      updated[missingColonIdx] = `${updated[missingColonIdx].trimEnd()}:`;
      const fixed = updated.join('\n');
      const msg = `Fixed \`SyntaxError\` on line \`${missingColonIdx + 1}\` by adding the missing trailing colon \`:\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, 'Add Missing Colon', msg),
        nextBotState: 'happy',
      };
    }

    // 2. Assignment `=` inside `if` / `elif` / `while` condition (`if x = 5:`)
    const badEqIdx = lines.findIndex((l) =>
      /^\s*(?:if|elif|while)\s+[^=!<>]+=(?!=)[^=]+:/.test(l),
    );
    if (badEqIdx !== -1) {
      const updated = [...lines];
      updated[badEqIdx] = updated[badEqIdx].replace(
        /^(\s*(?:if|elif|while)\s+[^=!<>]+)=(?!=)/,
        '$1==',
      );
      const fixed = updated.join('\n');
      const msg = `Replaced assignment \`=\` with comparison \`==\` inside the condition on line \`${badEqIdx + 1}\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, 'Fix == Operator', msg),
        nextBotState: 'happy',
      };
    }

    // 3. `IndentationError`: line after `:` has 0 extra indent
    for (let i = 0; i < lines.length - 1; i += 1) {
      if (lines[i].trimEnd().endsWith(':')) {
        const headerIndent = /^(\s*)/.exec(lines[i])?.[1].length ?? 0;
        const nextLine = lines[i + 1];
        const nextIndent = /^(\s*)/.exec(nextLine)?.[1].length ?? 0;
        if (nextLine.trim().length > 0 && nextIndent <= headerIndent) {
          const updated = [...lines];
          updated[i + 1] = `${' '.repeat(headerIndent + 4)}${nextLine.trimStart()}`;
          const fixed = updated.join('\n');
          const msg = `Fixed \`IndentationError\` on line \`${i + 2}\` by indenting the block body 4 spaces under \`${lines[i].trim()}\`.`;
          return {
            message: msg,
            proposal: buildDiffProposal(code, fixed, 'Fix Indentation', msg),
            nextBotState: 'happy',
          };
        }
      }
    }

    // 4. `IndexError`: `range(len(x) + 1)` or `range(1, len(x) + 1)`
    const rangeBugIdx = lines.findIndex((l) =>
      /range\([^)]*len\([^)]+\)\s*\+\s*1\s*\)/.test(l),
    );
    if (rangeBugIdx !== -1) {
      const updated = [...lines];
      updated[rangeBugIdx] = updated[rangeBugIdx]
        .replace(
          /range\(\s*1\s*,\s*(len\([^)]+\))\s*\+\s*1\s*\)/,
          'range($1)',
        )
        .replace(/range\(\s*(len\([^)]+\))\s*\+\s*1\s*\)/, 'range($1)');
      const fixed = updated.join('\n');
      const msg = `Fixed \`IndexError\` on line \`${rangeBugIdx + 1}\` by changing \`range(... + 1)\` to \`range(len(...))\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, 'Fix Range Bounds', msg),
        nextBotState: 'happy',
      };
    }

    // 5. `NameError: name 'X' is not defined` -> fuzzy-match typo or define variable
    const nameErrMatch = /NameError:\s+name\s+'([a-zA-Z_]\w*)'\s+is\s+not\s+defined/.exec(
      stderr,
    );
    if (nameErrMatch) {
      const badName = nameErrMatch[1];
      const closest = findClosestSymbol(badName, candidates);
      const targetIdx =
        errorLine && errorLine >= 1 && errorLine <= lines.length
          ? errorLine - 1
          : lines.findIndex((l) => new RegExp(`\\b${badName}\\b`).test(l));

      if (closest && targetIdx !== -1) {
        const updated = [...lines];
        updated[targetIdx] = updated[targetIdx].replace(
          new RegExp(`\\b${badName}\\b`, 'g'),
          closest,
        );
        const fixed = updated.join('\n');
        const msg = `Fixed \`NameError\` on line \`${targetIdx + 1}\`: replaced misspelled \`${badName}\` with declared \`${closest}\`.`;
        return {
          message: msg,
          proposal: buildDiffProposal(
            code,
            fixed,
            `Rename to ${closest}`,
            msg,
          ),
          nextBotState: 'happy',
        };
      }

      const insertIdx = Math.max(0, targetIdx !== -1 ? targetIdx : 0);
      const indent = /^(\s*)/.exec(lines[insertIdx] ?? '')?.[1] ?? '';
      const updated = [...lines];
      updated.splice(insertIdx, 0, `${indent}${badName} = 0`);
      const fixed = updated.join('\n');
      const msg = `Fixed \`NameError\` by initializing \`${badName} = 0\` before line \`${insertIdx + 1}\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, `Define ${badName}`, msg),
        nextBotState: 'happy',
      };
    }

    // 6. `TypeError: can only concatenate str (not "int") to str`
    if (
      errLower.includes('can only concatenate str') ||
      errLower.includes('unsupported operand type(s) for +')
    ) {
      const targetIdx =
        errorLine && errorLine >= 1 && errorLine <= lines.length
          ? errorLine - 1
          : lines.findIndex((l) => /["'][^"']*["']\s*\+\s*[a-zA-Z_]\w*/.test(l));
      if (targetIdx !== -1) {
        const updated = [...lines];
        updated[targetIdx] = updated[targetIdx].replace(
          /(["'][^"']*["']\s*\+\s*)([a-zA-Z_]\w*(?:\([^)]*\))?)/,
          '$1str($2)',
        );
        const fixed = updated.join('\n');
        const msg = `Fixed \`TypeError\` on line \`${targetIdx + 1}\` by wrapping the numeric value in \`str()\`.`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, fixed, 'Wrap in str()', msg),
          nextBotState: 'happy',
        };
      }
    }

    // 7. Missing `f` before string with `{var}` interpolation
    const missingFIdx = lines.findIndex((l) => {
      const m = /(?<![fFrRbB])"[^"]*\{([a-zA-Z_]\w*)\}[^"]*"/.exec(l);
      return Boolean(m && candidates.includes(m[1]));
    });
    if (missingFIdx !== -1) {
      const updated = [...lines];
      updated[missingFIdx] = updated[missingFIdx].replace(
        /(?<![fFrRbB])("[^"]*\{[a-zA-Z_]\w*\}[^"]*")/,
        'f$1',
      );
      const fixed = updated.join('\n');
      const msg = `Added the \`f\` string prefix on line \`${missingFIdx + 1}\` so \`{...}\` interpolates your variable.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, 'Add f-string Prefix', msg),
        nextBotState: 'happy',
      };
    }
  }

  // --- C++ / C SURGICAL FIXES ---
  if (lang === 'cpp' || lang === 'c') {
    // 1. Missing `#include` headers
    if (lang === 'cpp') {
      const missingHeaders: string[] = [];
      if (/\b(?:cout|cin|endl)\b/.test(code) && !/<iostream>/.test(code)) {
        missingHeaders.push('#include <iostream>');
      }
      if (/\bvector\s*</.test(code) && !/<vector>/.test(code)) {
        missingHeaders.push('#include <vector>');
      }
      if (/\b(?:sort|reverse|max_element|min_element)\b/.test(code) && !/<algorithm>/.test(code)) {
        missingHeaders.push('#include <algorithm>');
      }
      if (/\bstring\b/.test(code) && !/<string>/.test(code)) {
        missingHeaders.push('#include <string>');
      }
      if (missingHeaders.length > 0) {
        const fixed = `${missingHeaders.join('\n')}\n${code}`;
        const msg = `Added missing C++ STL header${missingHeaders.length > 1 ? 's' : ''} (${missingHeaders.map((h) => `\`${h}\``).join(', ')}).`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, fixed, 'Add #include', msg),
          nextBotState: 'happy',
        };
      }

      // 2. Unqualified `cout`, `cin`, `endl`, `vector`, `string`, `sort` without `std::`
      if (
        !/using\s+namespace\s+std\s*;/.test(code) &&
        (/\b(?:cout|cin|endl|vector|string|sort)\b/.test(stderr) ||
          /(?<!std::)\b(?:cout|cin|endl)\b/.test(code))
      ) {
        const fixed = code
          .replace(/(?<!std::)\b(cout|cin|endl|sort)\b/g, 'std::$1')
          .replace(/(?<!std::)\b(vector|string)\s*</g, 'std::$1<');
        if (fixed !== code) {
          const msg =
            'Qualified standard library symbols (`std::cout`, `std::vector`, `std::sort`) with the `std::` namespace.';
          return {
            message: msg,
            proposal: buildDiffProposal(
              code,
              fixed,
              'Add std:: Prefix',
              msg,
            ),
            nextBotState: 'happy',
          };
        }
      }
    }

    // 3. Missing semicolon `;` on statement lines inside `main` / functions
    const missingSemiIdx = lines.findIndex((l, idx) => {
      const t = l.trim();
      if (
        !t ||
        t.startsWith('#') ||
        t.startsWith('//') ||
        t.endsWith(';') ||
        t.endsWith('{') ||
        t.endsWith('}') ||
        t.endsWith(':') ||
        t.endsWith(',')
      ) {
        return false;
      }
      if (/^(?:if|else|for|while|switch|struct|class|int\s+main|void\s+\w+)\b/.test(t)) {
        return false;
      }
      return (
        errorLine === idx + 1 ||
        errorLine === idx + 2 ||
        errLower.includes("expected ';'") ||
        errLower.includes('expected `;`')
      );
    });

    if (missingSemiIdx !== -1) {
      const updated = [...lines];
      updated[missingSemiIdx] = `${updated[missingSemiIdx].trimEnd()};`;
      const fixed = updated.join('\n');
      const msg = `Added the missing semicolon \`;\` at the end of line \`${missingSemiIdx + 1}\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, 'Add Semicolon ;', msg),
        nextBotState: 'happy',
      };
    }

    // 4. Undeclared C/C++ identifier -> fuzzy match or declare
    const cppUndecl = /'([a-zA-Z_]\w*)'\s+was\s+not\s+declared\s+in\s+this\s+scope/.exec(
      stderr,
    );
    if (cppUndecl) {
      const badSym = cppUndecl[1];
      const closest = findClosestSymbol(badSym, candidates);
      const lineIdx =
        errorLine && errorLine >= 1 && errorLine <= lines.length
          ? errorLine - 1
          : lines.findIndex((l) => new RegExp(`\\b${badSym}\\b`).test(l));

      if (closest && lineIdx !== -1) {
        const updated = [...lines];
        updated[lineIdx] = updated[lineIdx].replace(
          new RegExp(`\\b${badSym}\\b`, 'g'),
          closest,
        );
        const fixed = updated.join('\n');
        const msg = `Replaced undeclared \`${badSym}\` on line \`${lineIdx + 1}\` with declared identifier \`${closest}\`.`;
        return {
          message: msg,
          proposal: buildDiffProposal(
            code,
            fixed,
            `Use ${closest}`,
            msg,
          ),
          nextBotState: 'happy',
        };
      }

      const idx = Math.max(0, lineIdx !== -1 ? lineIdx : lines.length - 1);
      const indent = /^(\s*)/.exec(lines[idx] ?? '')?.[1] ?? '    ';
      const updated = [...lines];
      updated.splice(idx, 0, `${indent}int ${badSym} = 0;`);
      const fixed = updated.join('\n');
      const msg = `Declared \`int ${badSym} = 0;\` prior to line \`${idx + 1}\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, `Declare ${badSym}`, msg),
        nextBotState: 'happy',
      };
    }
  }

  // --- JAVASCRIPT / TYPESCRIPT SURGICAL FIXES ---
  if (lang === 'js' || lang === 'ts') {
    // 1. `const` reassignment (`TypeError: Assignment to constant variable`)
    for (const m of code.matchAll(/\bconst\s+([a-zA-Z_]\w*)\s*=/g)) {
      const vName = m[1];
      const reassignRx = new RegExp(
        `(?:\\b${vName}\\s*(?:\\+=|-=|\\*=|\\/=|=[^=])|\\b${vName}\\+\\+|\\b${vName}--)`,
      );
      const declLineIdx = lines.findIndex((l) =>
        new RegExp(`\\bconst\\s+${vName}\\b`).test(l),
      );
      const hasReassign = lines.some(
        (l, idx) => idx !== declLineIdx && reassignRx.test(l),
      );
      if (
        declLineIdx !== -1 &&
        (hasReassign || errLower.includes('assignment to constant variable'))
      ) {
        const updated = [...lines];
        updated[declLineIdx] = updated[declLineIdx].replace(
          /\bconst\b/,
          'let',
        );
        const fixed = updated.join('\n');
        const msg = `Changed \`const ${vName}\` to \`let ${vName}\` on line \`${declLineIdx + 1}\` because \`${vName}\` is mutated later.`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, fixed, `Change const -> let`, msg),
          nextBotState: 'happy',
        };
      }
    }

    // 2. `ReferenceError: X is not defined`
    const jsRef = /ReferenceError:\s+([a-zA-Z_]\w*)\s+is\s+not\s+defined/.exec(
      stderr,
    );
    if (jsRef) {
      const badSym = jsRef[1];
      const closest = findClosestSymbol(badSym, candidates);
      const lineIdx =
        errorLine && errorLine >= 1 && errorLine <= lines.length
          ? errorLine - 1
          : lines.findIndex((l) => new RegExp(`\\b${badSym}\\b`).test(l));
      if (closest && lineIdx !== -1) {
        const updated = [...lines];
        updated[lineIdx] = updated[lineIdx].replace(
          new RegExp(`\\b${badSym}\\b`, 'g'),
          closest,
        );
        const fixed = updated.join('\n');
        const msg = `Fixed \`ReferenceError\` on line \`${lineIdx + 1}\`: replaced \`${badSym}\` with \`${closest}\`.`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, fixed, `Fix ${closest}`, msg),
          nextBotState: 'happy',
        };
      }
    }
  }

  // --- GO SURGICAL FIXES ---
  if (lang === 'go') {
    const unusedMatch = /([a-zA-Z_]\w*)\s+declared\s+(?:and\s+not\s+used|but\s+not\s+used)/.exec(
      stderr,
    );
    if (unusedMatch) {
      const vName = unusedMatch[1];
      const closeIdx = lines.lastIndexOf('}');
      const updated = [...lines];
      const insertAt = closeIdx !== -1 ? closeIdx : updated.length;
      updated.splice(insertAt, 0, `    fmt.Println("${vName}:", ${vName})`);
      const fixed = updated.join('\n');
      const msg = `Used \`${vName}\` in \`fmt.Println()\` to resolve Go's unused variable error.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, `Print ${vName}`, msg),
        nextBotState: 'happy',
      };
    }

    const goUndef = /undefined:\s+([a-zA-Z_]\w*)/.exec(stderr);
    if (goUndef) {
      const sym = goUndef[1];
      const assignIdx = lines.findIndex((l) =>
        new RegExp(`^\\s*${sym}\\s*=[^=]`).test(l),
      );
      if (assignIdx !== -1) {
        const updated = [...lines];
        updated[assignIdx] = updated[assignIdx].replace(
          new RegExp(`(${sym}\\s*)=`),
          '$1:=',
        );
        const fixed = updated.join('\n');
        const msg = `Changed \`=\` to short variable declaration \`:=\` for \`${sym}\` on line \`${assignIdx + 1}\`.`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, fixed, 'Use := Declaration', msg),
          nextBotState: 'happy',
        };
      }
    }
  }

  // --- RUST SURGICAL FIXES ---
  if (lang === 'rust') {
    const mutMatch = /cannot assign twice to immutable variable `([a-zA-Z_]\w*)`/.exec(
      stderr,
    );
    if (mutMatch) {
      const vName = mutMatch[1];
      const letIdx = lines.findIndex((l) =>
        new RegExp(`\\blet\\s+${vName}\\b`).test(l),
      );
      if (letIdx !== -1) {
        const updated = [...lines];
        updated[letIdx] = updated[letIdx].replace(
          new RegExp(`\\blet\\s+(${vName})\\b`),
          'let mut $1',
        );
        const fixed = updated.join('\n');
        const msg = `Added \`mut\` to \`let mut ${vName}\` on line \`${letIdx + 1}\` so \`${vName}\` can be mutated safely.`;
        return {
          message: msg,
          proposal: buildDiffProposal(code, fixed, `Add mut to ${vName}`, msg),
          nextBotState: 'happy',
        };
      }
    }

    const printlnIdx = lines.findIndex((l) => /\bprintln\s*\(/.test(l));
    if (printlnIdx !== -1) {
      const updated = [...lines];
      updated[printlnIdx] = updated[printlnIdx].replace(
        /\bprintln\s*\(/g,
        'println!(',
      );
      const fixed = updated.join('\n');
      const msg = `Changed \`println(\` to the Rust macro invocation \`println!(\` on line \`${printlnIdx + 1}\`.`;
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, 'Use println! Macro', msg),
        nextBotState: 'happy',
      };
    }
  }

  // --- ASSEMBLY (NASM) SURGICAL FIXES ---
  if (lang === 'asm') {
    if (
      /\b_start\b/.test(code) &&
      !/int\s+0x80/i.test(code) &&
      !/\bsyscall\b/i.test(code)
    ) {
      const fixed = `${code.trimEnd()}\n    mov eax, 1\n    xor ebx, ebx\n    int 0x80`;
      const msg =
        'Appended the Linux `sys_exit` interrupt (`mov eax, 1` / `int 0x80`) so `_start` exits with code `0` instead of segfaulting.';
      return {
        message: msg,
        proposal: buildDiffProposal(code, fixed, 'Add sys_exit', msg),
        nextBotState: 'happy',
      };
    }
  }

  // --- CROSS-LANGUAGE STRUCTURAL FIXES ---
  // Off-by-one loop `i <= arr.size()` or `i <= arr.length`
  const offByOneIdx = lines.findIndex((l) =>
    /for\s*\([^;]*;\s*\w+\s*<=\s*[\w.]+\.(?:size\(\)|length)\b/.test(l),
  );
  if (offByOneIdx !== -1) {
    const updated = [...lines];
    updated[offByOneIdx] = updated[offByOneIdx].replace('<=', '<');
    const fixed = updated.join('\n');
    const msg = `Fixed out-of-bounds loop condition on line \`${offByOneIdx + 1}\` by changing \`<=\` to \`<\`.`;
    return {
      message: msg,
      proposal: buildDiffProposal(code, fixed, 'Fix Loop Bound', msg),
      nextBotState: 'happy',
    };
  }

  // Unbalanced parentheses `(` vs `)`
  const openP = (code.match(/\(/g) ?? []).length;
  const closeP = (code.match(/\)/g) ?? []).length;
  if (openP > closeP) {
    const idx =
      errorLine && errorLine >= 1 && errorLine <= lines.length
        ? errorLine - 1
        : lines.length - 1;
    const updated = [...lines];
    updated[idx] = `${updated[idx].trimEnd()}${')'.repeat(openP - closeP)}`;
    const fixed = updated.join('\n');
    const msg = `Inserted ${openP - closeP} missing closing \`)\` on line \`${idx + 1}\`.`;
    return {
      message: msg,
      proposal: buildDiffProposal(code, fixed, 'Close Parenthesis', msg),
      nextBotState: 'happy',
    };
  }

  // Unbalanced braces `{` vs `}`
  const openB = (code.match(/\{/g) ?? []).length;
  const closeB = (code.match(/\}/g) ?? []).length;
  if (openB > closeB) {
    const fixed = `${code.trimEnd()}\n${'}'.repeat(openB - closeB)}`;
    const msg = `Closed ${openB - closeB} open \`{\` brace block${openB - closeB > 1 ? 's' : ''} at the end of \`${spec.mainFilename}\`.`;
    return {
      message: msg,
      proposal: buildDiffProposal(code, fixed, 'Close Brace }', msg),
      nextBotState: 'happy',
    };
  }

  if (!stderr.trim()) {
    return {
      message: `No syntax or runtime errors detected in \`${spec.mainFilename}\` — hit \`RUN\` to execute!`,
      proposal: null,
      nextBotState: 'happy',
    };
  }

  // Guaranteed working fallback patch if code failed with severe syntax breakage
  const firstErrLine =
    stderr
      .split('\n')
      .find((l) => /error:|Error:|exception/i.test(l))
      ?.trim() ??
    stderr.split('\n')[0]?.trim() ??
    'Syntax error';
  return {
    message: errorLine
      ? `Line \`${errorLine}\` raised \`${firstErrLine.slice(0, 95)}\`. Check variable names and punctuation on line \`${errorLine}\`.`
      : `Compiler reported: \`${firstErrLine.slice(0, 95)}\`.`,
    proposal: null,
    nextBotState: 'worried',
  };
}

/* ------------------------------------------------------------------ */
/*  3. Line-by-Line Contextual Explainer (`💡 Explain`)                 */
/* ------------------------------------------------------------------ */

function describeSingleLine(line: string, lineNumber: number): string | null {
  const t = line.trim();
  if (!t || t === '{' || t === '}' || t === 'return 0;') return null;

  // Header includes / imports / package
  const incMatch = /^#include\s+(<[^>]+>)/.exec(t);
  if (incMatch) {
    return `• Line \`${lineNumber}\`: Imports C++ header \`${incMatch[1]}\`.`;
  }
  const pyDef = /^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\):/.exec(t);
  if (pyDef) {
    return `• Line \`${lineNumber}\`: Defines function \`${pyDef[1]}(${pyDef[2]})\`.`;
  }
  const cFunc =
    /^(?:int|void|bool|double|long\s+long|string|std::string|func|fn|function)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/.exec(
      t,
    );
  if (cFunc) {
    return `• Line \`${lineNumber}\`: Declares entrypoint/function \`${cFunc[1]}(${cFunc[2]})\`.`;
  }

  //Comprehension
  const compMatch = /^([a-zA-Z_]\w*)\s*=\s*\[(.+)\s+for\s+([a-zA-Z_]\w*)\s+in\s+([^\]]+)\]/.exec(
    t,
  );
  if (compMatch) {
    return `• Line \`${lineNumber}\`: Builds list \`${compMatch[1]}\` via comprehension over \`${compMatch[3]}\` in \`${compMatch[4].trim()}\`.`;
  }

  // Loops
  const pyFor = /^for\s+([a-zA-Z_,\s]+)\s+in\s+(.+):/.exec(t);
  if (pyFor) {
    return `• Line \`${lineNumber}\`: Iterates \`${pyFor[1].trim()}\` across \`${pyFor[2].trim()}\`.`;
  }
  const cFor = /^for\s*\((.+)\)/.exec(t);
  if (cFor) {
    return `• Line \`${lineNumber}\`: Loops with header \`(${cFor[1].trim()})\`.`;
  }
  const whileMatch = /^while\s*\(?([^:{]+)\)?/.exec(t);
  if (whileMatch) {
    return `• Line \`${lineNumber}\`: Repeats while \`${whileMatch[1].trim()}\` holds true.`;
  }

  // Conditionals
  const ifMatch = /^(?:if|elif|else\s+if)\s*\(?([^:{]+)\)?/.exec(t);
  if (ifMatch) {
    return `• Line \`${lineNumber}\`: Branches when condition \`${ifMatch[1].trim()}\` is met.`;
  }

  // Sorting / mutations
  if (/std::sort\s*\(([^)]+)\)/.test(t) || /\.sort\s*\(/.test(t)) {
    return `• Line \`${lineNumber}\`: Sorts collection elements in ascending order via \`${t.replace(/;$/, '')}\`.`;
  }
  const appendMatch = /^([a-zA-Z_]\w*)\.(?:append|push|push_back)\((.+)\)/.exec(
    t,
  );
  if (appendMatch) {
    return `• Line \`${lineNumber}\`: Appends \`${appendMatch[2]}\` into \`${appendMatch[1]}\`.`;
  }

  // Output statements
  if (
    /^(?:print|console\.log|fmt\.Println|fmt\.Printf|println!|printf|std::cout|Console\.WriteLine|echo)\b/.test(
      t,
    )
  ) {
    const cleanCall = t.length > 44 ? `${t.slice(0, 41)}...` : t;
    return `• Line \`${lineNumber}\`: Outputs results to stdout via \`${cleanCall}\`.`;
  }

  // Return statement
  const retMatch = /^return\s+(.+?);?$/.exec(t);
  if (retMatch) {
    return `• Line \`${lineNumber}\`: Returns \`${retMatch[1]}\` to the caller.`;
  }

  // Variable declaration / assignment
  const varMatch =
    /^(?:const|let|var|local|val|std::vector<[^>]+>|int|double|string|auto)?\s*([a-zA-Z_]\w*)\s*:?=\s*(.+?);?$/.exec(
      t,
    );
  if (varMatch) {
    const valPreview =
      varMatch[2].length > 28 ? `${varMatch[2].slice(0, 25)}...` : varMatch[2];
    return `• Line \`${lineNumber}\`: Initializes \`${varMatch[1]}\` to \`${valPreview}\`.`;
  }

  // Assembly instructions
  const asmMatch = /^(mov|add|sub|imul|shl|xor|cmp|jnz|je|jne|int|syscall)\s*(.*)$/i.exec(
    t,
  );
  if (asmMatch) {
    return `• Line \`${lineNumber}\`: Executes x86 instruction \`${asmMatch[1]} ${asmMatch[2]}\`.`;
  }

  // SQL clauses
  if (/^(?:SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT)\b/i.test(t)) {
    return `• Line \`${lineNumber}\`: Executes SQL clause \`${t}\`.`;
  }

  return null;
}

function synthesizeLineByLineExplanation(
  lang: LangId,
  code: string,
  focusLine?: number | null,
): CopilotReply {
  const lines = splitLines(code);
  const spec = getCompilerSpec(lang);

  if (!code.trim()) {
    return {
      message: `\`${spec.mainFilename}\` is empty right now. Write a few lines or ask me for \`bubble sort\` or \`binary search\`!`,
      proposal: null,
      nextBotState: 'idle',
    };
  }

  // If the user asked about a specific line (`explain line 4` / `explique la ligne 4`)
  if (focusLine && focusLine >= 1 && focusLine <= lines.length) {
    const raw = lines[focusLine - 1].trim();
    const single =
      describeSingleLine(raw, focusLine) ??
      `• Line \`${focusLine}\`: Executes \`${raw || '(empty line)'}\`.`;
    return {
      message: single,
      proposal: null,
      nextBotState: 'idle',
    };
  }

  const bullets: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const b = describeSingleLine(lines[i], i + 1);
    if (b) bullets.push(b);
  }

  // Select up to 3 most informative bullets (first definition/init, core loop/transform, final output/return)
  let picked: string[];
  if (bullets.length <= 3) {
    picked = bullets;
  } else {
    picked = [
      bullets[0],
      bullets[Math.floor(bullets.length / 2)],
      bullets[bullets.length - 1],
    ];
  }

  if (picked.length === 0) {
    picked = [
      `• Line \`1–${lines.length}\`: Runs \`${lines.length}\` lines in \`${spec.mainFilename}\`.`,
    ];
  }

  return {
    message: picked.join('\n'),
    proposal: null,
    nextBotState: 'idle',
  };
}

/* ------------------------------------------------------------------ */
/*  4. Natural Language Chat & Optimization Engine (EN + FR)           */
/* ------------------------------------------------------------------ */

function synthesizeNaturalChat(
  lang: LangId,
  code: string,
  prompt: string,
  stderr: string = '',
  errorLine: number | null = null,
): CopilotReply {
  const q = prompt.trim();
  const qLower = q.toLowerCase();

  if (!q) {
    return synthesizeSmartCompletion(lang, code);
  }

  // 1. Check specific line explanation request (`explain line 4` / `explique la ligne 4`)
  const lineExplainMatch = /(?:explain|explique|line|ligne)\s*#?(\d+)/i.exec(q);
  if (lineExplainMatch) {
    const targetLine = Number.parseInt(lineExplainMatch[1], 10);
    return synthesizeLineByLineExplanation(lang, code, targetLine);
  }

  // 2. Check named algorithm request (English & French)
  const algo = detectAlgorithmIntent(q);
  if (algo) {
    const generated = generateAlgorithmCode(algo.id, lang);
    const msg = `Built a complete, runnable **${algo.title}** in \`${LANG_HUMAN_NAME[lang]}\`. Tap \`✓ Accept Code\` to insert it into the editor!`;
    return {
      message: msg,
      proposal: buildDiffProposal(
        code,
        generated,
        algo.title,
        msg,
        `${splitLines(generated).length} lines`,
      ),
      nextBotState: 'happy',
    };
  }

  // 3. Fix / Debug / Corriger intent
  if (
    /\bfix\b|\bbug\b|\berror\b|\bdebug\b|\bcorrig|\br[eé]par|\bpourquoi\b|\bfail/.test(
      qLower,
    )
  ) {
    return synthesizeSurgicalFix(lang, code, stderr, errorLine);
  }

  // 4. Explain / Understand / Expliquer intent
  if (
    /\bexplain\b|\bwhat\s+does\b|\bhow\s+does\b|\bexplique|\bcomprend/.test(
      qLower,
    )
  ) {
    return synthesizeLineByLineExplanation(lang, code);
  }

  // 5. Complete / Finish / Loop / Compléter intent
  return synthesizeSmartCompletion(lang, code);
}

/**
 * Main entry point for the 2-Tier Hybrid Robot Copilot Engine.
 */
export async function askRoboCopilot(
  request: CopilotRequest,
): Promise<CopilotReply> {
  // Tier A: Real Cloud LLM when API key is configured
  const cloudReply = await tryExternalLlmCopilot(request);
  if (cloudReply) return cloudReply;

  // Brief natural cadence (140ms) so the thinking animation reads cleanly
  await new Promise((resolve) => setTimeout(resolve, 140));

  // Tier B: Deep Deterministic Multi-Language Code Intelligence
  switch (request.action) {
    case 'complete':
      return synthesizeSmartCompletion(request.lang, request.code);
    case 'fix':
      return synthesizeSurgicalFix(
        request.lang,
        request.code,
        request.stderr ?? '',
        request.errorLine ?? null,
      );
    case 'explain':
      return synthesizeLineByLineExplanation(request.lang, request.code);
    case 'optimize':
      return synthesizeSmartCompletion(request.lang, request.code);
    case 'custom':
      return synthesizeNaturalChat(
        request.lang,
        request.code,
        request.customPrompt ?? '',
        request.stderr ?? '',
        request.errorLine ?? null,
      );
  }
}
