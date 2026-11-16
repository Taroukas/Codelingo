/**
 * Core curriculum & exercise contracts for CodeLingo.
 */

export type LangId =
  | 'python'
  | 'cpp'
  | 'js'
  | 'go'
  | 'java'
  | 'rust'
  | 'sql'
  | 'c'
  | 'ts'
  | 'css'
  | 'html'
  | 'php'
  | 'asm'
  | 'swift'
  | 'kotlin'
  | 'julia'
  | 'lua'
  | 'csharp';

export type NodeKind = 'lesson' | 'checkpoint_cube' | 'boss_challenge';

export type ConceptGraphicType =
  | 'variables'
  | 'control_flow'
  | 'collections'
  | 'dicts_sets'
  | 'functions'
  | 'classes_oop'
  | 'cpp_stack'
  | 'cpp_loops'
  | 'cpp_refs'
  | 'cpp_pointers'
  | 'cpp_vectors'
  | 'cpp_classes'
  | 'cpp_smart_ptr'
  | 'js_vars'
  | 'js_arrows'
  | 'js_objects'
  | 'js_arrays'
  | 'js_async'
  | 'go_vars'
  | 'go_range'
  | 'go_slices'
  | 'go_structs'
  | 'go_channels'
  | 'java_vars'
  | 'java_flow'
  | 'java_arrays'
  | 'java_oop'
  | 'java_collections'
  | 'java_streams'
  | 'rust_vars'
  | 'rust_ownership'
  | 'rust_control'
  | 'rust_structs'
  | 'rust_errors'
  | 'rust_collections'
  | 'sql_select'
  | 'sql_filter'
  | 'sql_aggregates'
  | 'sql_joins'
  | 'sql_mutations'
  | 'c_basics'
  | 'c_flow'
  | 'c_arrays'
  | 'c_pointers'
  | 'c_structs'
  | 'c_memory'
  | 'ts_types'
  | 'ts_interfaces'
  | 'ts_unions'
  | 'ts_generics'
  | 'ts_utils'
  | 'css_cascade'
  | 'css_box'
  | 'css_flex'
  | 'css_grid'
  | 'css_vars'
  | 'html_dom'
  | 'html_semantic'
  | 'html_media'
  | 'html_forms'
  | 'html_a11y'
  | 'php_vars'
  | 'php_arrays'
  | 'php_funcs'
  | 'php_oop'
  | 'php_modern'
  | 'asm_regs'
  | 'asm_flags'
  | 'asm_stack'
  | 'asm_mem'
  | 'asm_syscall'
  | 'swift_vars'
  | 'swift_opt'
  | 'swift_struct'
  | 'swift_proto'
  | 'swift_async'
  | 'kt_vars'
  | 'kt_null'
  | 'kt_data'
  | 'kt_lambda'
  | 'kt_coro'
  | 'jl_one'
  | 'jl_broadcast'
  | 'jl_dispatch'
  | 'jl_structs'
  | 'jl_perf'
  | 'lua_local'
  | 'lua_funcs'
  | 'lua_tables'
  | 'lua_meta'
  | 'lua_coro'
  | 'cs_vars'
  | 'cs_pattern'
  | 'cs_record'
  | 'cs_linq'
  | 'cs_async';

interface BaseExercise {
  id: string;
  explanation: string;
}

/** Step 1: Concise Interactive Theory Bite */
export interface TheoryBiteExercise extends BaseExercise {
  type: 'theory_bite';
  title: string;
  code: string[];
  output?: string | string[];
  highlightNote?: string;
}

/** Steps 2-4: Mimo-style Inline Code Token Builder with numbered code rows & slot pills */
export interface TokenBuilderExercise extends BaseExercise {
  type: 'token_builder';
  prompt: string;
  /** Lines containing `{{0}}`, `{{1}}`, `{{2}}` slot markers. */
  codeLines: string[];
  expectedTokens: string[];
  distractors: string[];
  syntaxHint?: string;
  output?: string;
}

/** Legacy tap-to-build code bank (kept for backward component compatibility) */
export interface CodeBlocksExercise extends BaseExercise {
  type: 'code_blocks';
  prompt: string;
  tokens: string[];
  distractors: string[];
  output: string;
}

/** Spot the Bug — also feeds 60s Bug Hunt Blitz */
export interface FindBugExercise extends BaseExercise {
  type: 'find_bug';
  prompt: string;
  lines: string[];
  bugLine: number;
  fixed: string;
}

/** Predict the Output */
export interface PredictOutputExercise extends BaseExercise {
  type: 'predict_output';
  prompt: string;
  code: string[];
  options: [string, string, string];
  answer: number;
}

/** Concept Multiple Choice */
export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice';
  question: string;
  options: [string, string, string, string];
  answer: number;
}

export type Exercise =
  | TheoryBiteExercise
  | TokenBuilderExercise
  | CodeBlocksExercise
  | FindBugExercise
  | PredictOutputExercise
  | MultipleChoiceExercise;

export interface GuideSyntaxItem {
  title: string;
  tag?: string;
  code: string;
  output?: string;
  explanation: string;
  notes?: string[];
}

export interface GuidePitfallItem {
  title: string;
  buggyCode: string;
  fixedCode: string;
  reason: string;
}

export interface UnitGuidebook {
  summary: string;
  mentalModel?: string;
  keyTakeaways?: string[];
  keySyntax: GuideSyntaxItem[];
  commonMistakes?: GuidePitfallItem[];
  proTip: string;
}

export interface LessonNode {
  id: string;
  lang: LangId;
  unitIndex: number;
  nodeIndex: number;
  globalIndex: number;
  kind: NodeKind;
  title: string;
  subtitle: string;
  icon: string;
  xpReward: number;
  gemReward: number;
  noHints?: boolean;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  lang: LangId;
  unitNumber: number;
  sectionLabel: string;
  title: string;
  subtitle: string;
  description: string;
  conceptGraphicType: ConceptGraphicType;
  color: string;
  lipColor: string;
  guidebook: UnitGuidebook;
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

export type ExerciseSeed =
  | Omit<TheoryBiteExercise, 'id'>
  | Omit<TokenBuilderExercise, 'id'>
  | Omit<CodeBlocksExercise, 'id'>
  | Omit<FindBugExercise, 'id'>
  | Omit<PredictOutputExercise, 'id'>
  | Omit<MultipleChoiceExercise, 'id'>;

export interface NodeSeed {
  kind: NodeKind;
  title: string;
  subtitle: string;
  exercises: ExerciseSeed[];
}

export interface UnitSeed {
  title: string;
  subtitle: string;
  conceptGraphicType: ConceptGraphicType;
  guidebook: UnitGuidebook;
  nodes: NodeSeed[];
}
