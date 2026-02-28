# Best Version of Yourself - Agent Knowledge Base

Welcome. This document (`AGENT.md`) is your primary source of truth for the "Best Version of Yourself" project. It contains constraints, architectural decisions, and critical context needed to successfully contribute to this repository.

## ⚠️ 1. CRITICAL: Circuit Breaker & Automatic Testing
This project strictly enforces a "test-to-pass" workflow. As an AI Agent, **you are NOT allowed to bypass tests**.
- **The Rule**: If you modify *any* iOS Swift/Objective-C code, you MUST use the `apply_code_and_test` tool (which calls `scripts/ios_test_runner.py`).
- **The Process**: 
  1. The script writes your code.
  2. The script compiles and runs the iOS Simulator tests in the background over `BestVersionOfYourself.xcworkspace`.
  3. If tests fail, your changes are **automatically reverted**. You will receive a compact error log. Analyze it and try again.
  4. If tests pass, you will receive a `verification_token`. You **must** provide this token to the `mark_task_completed` tool to successfully finish your task.

## 2. Architecture & Module Relationships

The project is a monorepo consisting of the following key directories:

### `mobile/` (React Native App)
- **Framework**: React Native 0.83.1 (New Architecture enabled).
- **Language**: TypeScript (`.ts`, `.tsx`).
- **Navigation**: React Navigation 7 (`@react-navigation/native`, `@react-navigation/bottom-tabs`, etc.).
- **Backend/Services**: Firebase (`@react-native-firebase/*`).
- **Performance/Animations**: `react-native-reanimated` (v4), `react-native-nitro-modules`, `react-native-worklets`.
- **Styling**: Tailwind Merge (`tailwind-merge`), `clsx`, combined with standard `StyleSheet`.
- **State/Storage**: `@react-native-async-storage/async-storage`.

### `web/` (React Web App)
- **Framework**: React 18 + Vite.
- **Language**: TypeScript (`.ts`, `.tsx`).
- **Routing**: React Router DOM 6.
- **Backend/Services**: Firebase JS SDK v11.
- **Testing**: Vitest + React Testing Library.

### `shared/`
- Contains types, utilities, or constants shared between `web` and `mobile`. (If applicable, ensure both environments can import from here without breaking platform-specific APIs).

### `functions/`
- Cloud Functions for Firebase.

## 3. Development Commands

### Mobile (React Native)
- **Install dependencies**: `npm run postinstall` (at root, or `npm install` inside `mobile/`). Note: The project uses `patch-package`, which runs automatically post-install.
- **Start Metro Bundler**: `npm run start` (inside `mobile/`).
- **Run iOS**: `npm run ios` (inside `mobile/`).
- **Run Android**: `npm run android` (inside `mobile/`).
- **Lint & Type Check**: `npm run validate` (inside `mobile/`).

### Web (Vite)
- **Start Dev Server**: `npm run dev` (at root, or inside `web/`).
- **Build Production**: `npm run build` (inside `web/`).
- **Run Tests**: `npm run test` (inside `web/`).

## 4. Naming Conventions and Coding Patterns
- **Components**: PascalCase (e.g., `UserProfile.tsx`). Function components are preferred over class components.
- **Hooks**: camelCase, prefixed with `use` (e.g., `useUserData.ts`).
- **Files/Utilities**: camelCase or kebab-case (e.g., `format-date.ts`, `apiClient.ts`).
- **Styling (Mobile)**: Prefer extracting styles using `StyleSheet.create` combined with standard React Native styling. Avoid inline styles where possible to ensure performance.
- **Imports**: Group imports logically (React -> React Native -> Third Party -> Internal). Use absolute paths if configured, otherwise use relative paths.

## 5. Known Caveats & Workarounds
- **Hermes & dSYMs (iOS)**: The project includes custom Ruby scripts (`update_hermes_dsym_phase*.rb`) in `mobile/ios/` to fix Hermes dSYM generation issues during archiving. Do not remove or modify these build phases without explicit instructions.
- **Apple Sign-In**: Configured via `@invertase/react-native-apple-authentication` and a setup Ruby script.
- **Firebase Initialization**: Follows a specific sequence. Be cautious when adding initialization logic to `index.js` or `App.tsx` in the mobile app.
- **Test File Protection**: Web and Mobile test files (e.g., `__tests__` or `*Tests/*.swift`) are **read-only** via MCP permissions. You cannot alter tests to force them to pass. Fix the implementation, not the test.

## 6. Security & Secrets Management
- **NO HARDCODED SECRETS**: It is strictly forbidden to hardcode API keys, tokens, passwords, or any sensitive credentials directly in the source code.
- **Environment Variables**: Always use `.env` files (e.g., `react-native-config` for mobile or `import.meta.env` for Vite web) to inject secrets during build time or runtime.
- **CI/CD Secrets**: For Fastlane and GitHub Actions, secrets (like App Store Connect API Keys or Play Store JSON keys) must be referred to exclusively via `ENV["KEY_NAME"]` and securely injected by the CI environment.

---
*End of Knowledge Base*
