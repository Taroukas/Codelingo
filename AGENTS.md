# Expo Project Guidelines

Expo has changed — do not trust your training data. Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed.

Before writing any code that touches an Expo, EAS, or React Native API:
1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch `https://docs.expo.dev/llms.txt` — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

- Use `bunx` instead of `npx` if the project uses Bun (`bun.lock` present).
- `npx expo install <package>` — ALWAYS use instead of `npm`, `yarn`, `pnpm`, or `bun add` — resolves SDK-compatible versions.
- `npx expo start` — Start the development server.
- `npx expo lint` — Run the linter.
- `npx tsc --noEmit` — Run TypeScript type checking.
- `npx expo-doctor` — Diagnose dependency and project configuration issues.
- `npx expo install --fix` — Fix incompatible package versions.
- Run `npx expo lint` and `npx tsc --noEmit` before declaring any task complete.

## Navigation & Routing

- Use Expo Router for all navigation.
- Routes live in `src/app/` (or `app/`) — every file there is a screen, and `_layout.tsx` files define navigators.
- Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Reference documentation index: `https://docs.expo.dev/llms.txt` and [Expo Router Documentation](https://docs.expo.dev/router/introduction.md).

---

# CodeLingo — Linear / Raycast Pro Design System

> **This document supersedes every earlier visual direction** (Cyberpunk, "Hacker Pro", neon glow, chunky 3D pills, pastel Mimo cards). If existing code conflicts with anything below, the design system wins and the code gets migrated. No mixed-era screens.

## 1. Tech Stack & Strict Constraints
- **Framework**: React Native with Expo Managed Workflow (100% compatible with standard iOS Expo Go).
- **Allowed Packages**: ONLY use packages already installed in `package.json` (`expo-linear-gradient`, `expo-blur`, `expo-haptics`, `@expo/vector-icons`, `react-native-reanimated`, `react-native-safe-area-context`). Do NOT run `npm install` for any native library unsupported by Expo Go.
- **Language**: All UI text, lessons, code comments, and feedback must be in **English**.
- **Typing**: Strict TypeScript (`.tsx` and `.ts`).
- **Safe Area**: Every screen must respect the iPhone Notch / Dynamic Island and Home Indicator using `useSafeAreaInsets` or `SafeAreaView`.
- **Haptics survive the redesign**: they are interaction feedback, not visual styling. `Light` on taps, `Medium` on primary actions (run code), `NotificationFeedbackType.Success/Error` for correct/wrong answers.

## 2. The Five Non-Negotiable Rules

### Rule 1 — Flat monolithic surfaces. No gradients on cards or buttons.
- **Banned**: multi-colour `LinearGradient` on cards, banners, buttons, pills, or headers. Banned: soft purple/blue washes, glow shadows, neon rims.
- Backgrounds are flat and deep: canvas `#0A0A0C`, elevated surface `#0E0E12`, control surface `#18181B`.
- Depth comes from **surface elevation + a 1px hairline border**: `borderWidth: 1`, `borderColor: 'rgba(255, 255, 255, 0.08)'` (use `0.14` only for a selected/active element).
- Never thick coloured outlines. Never `borderWidth` above 1 as decoration.

### Rule 2 — No chunky 3D pills.
- **Banned**: `borderBottomWidth: 3 | 4 | 5` lips, two-layer "extruded" buttons, cartoon drop-lips, toy bevels.
- Micro-components are precision-engineered: height `34` or `36`, `borderRadius: 8` or `10`, flat fill.
- State changes are a **background shift**, not a lip: inactive `#18181B`, active `#27272A`, plus a 1px `rgba(255,255,255,0.14)` hairline on the active element.
- Press feedback = slight background shift or `opacity: 0.9`, never a translate-down lip.

### Rule 3 — Mono + utility typography.
- Code, terminals, stats, counters, badges, filenames, and any numeric value use `MONO` (`Platform.OS === 'ios' ? 'Menlo' : 'monospace'`).
- Strict tracking: `letterSpacing: -0.2` on monospace stats/counters. Uppercase micro-labels may use `+0.6` tracking at 10–11px.
- Text hierarchy is zinc-only:
  - Primary `#FAFAFA` · Secondary `#A1A1AA` · Labels/disabled `#71717A`.
  - No bright purple/blue/green text for normal UI copy.
- Type scale: labels 10–11, body 13–14, titles 17–20. Nothing shouts.

### Rule 4 — Dense "bento" dock layout.
- No sprawling whitespace, no oversized padding, no decorative empty space. Screens read like a developer dashboard: information-rich, tight, aligned to a 4px grid.
- Screen gutters `16`, section gaps `8–12`, card padding `12–14`, control gaps `6–8`.
- Prefer one screen with zero scrolling. If content must scroll, it scrolls inside a single card viewport, never the whole screen shell.

### Rule 5 — Clean tab switching, zero flashing UI.
- Top-level switches (e.g. `Code Playground | 60s Bug Blitz`) use a microscopic, flush iOS segmented control:
  - Container: height `34`, `backgroundColor: '#0E0E12'`, `borderRadius: 9`, `padding: 2`, 1px hairline border.
  - Indicator: flat `#27272A` pill, `borderRadius: 7`, 1px `rgba(255,255,255,0.10)`, slides (`translateX`) in ~120ms; content and state switch **instantly** on press.
  - No layout jump, no flash, no mount/unmount flicker, no scroll reset.

## 3. Colour Tokens (single source of truth)

| Token | Value | Use |
|---|---|---|
| `canvas` | `#0A0A0C` | App background |
| `surface` | `#0E0E12` | Cards, headers, dock |
| `surfaceRaised` | `#121216` | Chips, nested rows |
| `control` | `#18181B` | Inactive control fill |
| `controlActive` | `#27272A` | Active/selected control fill |
| `terminal` | `#08080A` | Code + console recess |
| `hairline` | `rgba(255,255,255,0.08)` | Default 1px border |
| `hairlineStrong` | `rgba(255,255,255,0.14)` | Active/focused 1px border |
| `textPrimary` | `#FAFAFA` | Primary copy |
| `textSecondary` | `#A1A1AA` | Supporting copy |
| `textMuted` | `#71717A` | Labels, filenames, disabled |
| `accent` | `#6E56CF` | **Only** primary action / selection indicator |
| `success` | `#3FB950` | Correct answers only |
| `danger` | `#F85149` | Wrong answers only |

Accent, success, and danger are semantic. They never appear as body text, large fills, glows, or borders.

## 4. Component Contracts

- **Card**: `backgroundColor: '#0E0E12'`, `borderRadius: 10`, `borderWidth: 1`, hairline border, `padding: 12–14`, **no shadow**. Sections inside are separated by 1px hairlines, not gaps only.
- **Primary button**: height `36`, radius `8`, solid fill (`#FAFAFA` on dark with `#0A0A0C` label, or `accent` with white label), 13px semibold label, single line. Pressed → `opacity 0.9`.
- **Secondary button**: height `34`, radius `8`, `#18181B`, hairline border, `#FAFAFA` label.
- **Segmented control**: per Rule 5.
- **Stat chip**: height `24–28`, radius `6`, `#121216`, hairline, mono 11px, `letterSpacing: -0.2`; label `#71717A`, value `#FAFAFA`.
- **IDE shell**: `#08080A`, radius `10`, 1px hairline, clipped. Header `38–40` tall in `#0E0E12`: 6px window dots (`#3F3F46` family, monochrome), filename mono 11 `#71717A`, right-aligned micro `RUN` button (height `26–28`, radius `6`, accent fill).
- **Console**: attached to the IDE bottom, `#08080A`, `borderTopWidth: 1` hairline, mono 11.5/16, command `#71717A`, output `#FAFAFA`, exit line `#A1A1AA`.
- **Icons**: `@expo/vector-icons` only, 14–18px, monochrome zinc. No emoji in chrome, labels, or stats.

## 5. Hard Bans (delete on sight)
1. Any `LinearGradient` on a card, button, pill, or header.
2. `borderBottomWidth` ≥ 2 used as a 3D lip, and any "outer lip + inner face" 3D component pattern.
3. Thick purple/cyan outlines, glow `shadowColor`, neon palettes, rainbow accents.
4. Corner radii above `12` on cards/controls (modals/sheets may use up to `16`).
5. Uppercase body copy, 17px+ stat numbers inside pills, emoji iconography.
6. Mixed design eras: a screen is either fully migrated or untouched — never half.

## 6. Migration Rules
- `src/components/Tactile3D.tsx` (`Tactile3DBox`, `Tactile3DNode`) is **legacy**. Do not build new UI with it; migrate any screen that still uses it to flat surfaces + hairline borders, and then delete the component.
- `DuolingoButton` (`src/components/CyberButton.tsx`) is legacy in the same way: replace with the primary/secondary button contract above.
- `Colors` in `src/theme/index.ts` must be re-pointed to the tokens in section 3 before touching screens, so all screens inherit the palette at once.
- When a screen is migrated, it must satisfy: flat surfaces, 1px hairlines, 34/36px controls, mono stats, dense spacing, and zero banned patterns — verified by reading the file, not by assumption.
- The floating glass tab bar component is tuned and must not be modified unless explicitly requested.

## 7. Practice Tab Blueprint (first migration target)
- Top: flush segmented control `Code Playground | 60s Bug Blitz` (Rule 5) — replaces the giant banner card.
- Row: compact stat chips (Best / Crushed / XP) in mono, `#121216`, hairline.
- Playground: one IDE card containing header + language/template micro-selects + code viewport + console; `RUN` lives in the IDE header as a micro button.
- Blitz: same shell, code lines tap-to-select, timer as a mono chip that shifts to `danger` only under 10s; results render inline in the same card slot.
- Everything above the tab bar, zero scrolling, `paddingBottom` clears the floating bar (`max(98, insets.bottom + 76)`).
