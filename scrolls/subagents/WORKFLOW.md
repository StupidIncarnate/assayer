# Subagent Orchestration & Isolated Review Workflow

This scroll defines the objective, role structure, and development discipline when collaborating with subagents during interactive Assayer review sessions.

---

## 1. Overall Objective

Assayer is undergoing real-time interactive review and hardening across all product surfaces:
- **Desktop UI & Ergonomics**: Test case explorer, salient case indicators, error category classification, hover-to-highlight synchronization between detail panes and the source code viewer, and window state persistence.
- **Core Compiler Analysis**: Complete syntax coverage, case derivation for complex expressions (such as nullish coalescing `??` branching and stub breadth), and fast compile caching.
- **Specimen Generation & Verification**: Standardized expectation headers (`Expected lint errors:`, `Expected undriven errors:`, etc.), specimen comment projections, and automated validation.

The primary operational goal is **rapid, high-quality turnaround on reviewer feedback while keeping the live system stable, responsive, and uninterrupted**.

---

## 2. Subagent Architecture & Roles

Tasks are coordinated by the **Parent Orchestrator** and delegated to focused subagents:

| Role | Domain / Packages | Responsibilities |
|---|---|---|
| **Parent Orchestrator** | Monorepo root | Fields user requests, investigates root causes, breaks down work, dispatches subagents, reviews diffs, and integrates atomic commits into the active review branch. |
| **UI App Engineer** | `packages/app` | Mantine UI components, CodeMirror extensions, interaction handlers, styling tokens, error categories, and client-side view state. |
| **Core Compiler Engineer** | `packages/core`, `packages/shared` | AST analysis, case derivation, tsconfig caching, condition tree transformers, and shared Zod/TypeScript contracts. |
| **Desktop & Gateway Engineer** | `packages/desktop`, `packages/@gateway/*` | Electron main process, IPC responders, brokers, window bounds persistence across multi-monitor setups, and platform gateways. |
| **Specimen Generator Engineer** | `packages/specimen-generator` | Syntax specimen templates, expectation comment transformers, and specimen test matrices. |

---

## 3. Subagent Operating Rules

1. **Strict File-Scoped Ward Only**:
   Subagents run ward **strictly scoped to touched files**:
   ```bash
   npm run ward -- -- <files>
   ```
   **NEVER** run whole-repo `npm run ward`, `--changed`, `--committed`, or `--uncommitted` during an active review session. Full sweeps slow down the system and can mask or conflict with in-flight tasks.
2. **Never Touch or Regenerate `smoke-repo/`**:
   The specimen suite under `smoke-repo/` must remain frozen during review passes unless the user explicitly requests a specimen rebuild.
3. **Gateway & Architecture Boundaries**:
   Every gateway modification requires its matching `.proxy.ts` and `.test.ts`. No raw imports of Node built-ins or outside packages; route through `#gateway/*`.

---

## 4. Isolated Branching & Commit Integration Protocol

### The Problem: UI Reload Thrashing
The reviewer runs the live Assayer desktop application and Vite dev server (`npm run dev`) while reviewing. When subagents edit files directly in the active working branch:
1. Every file save triggers Vite Hot Module Replacement (HMR) or full page reload.
2. Intermediate edits (syntax errors, incomplete imports, temporary type mismatches) crash or blank the user's running window.
3. Rapid succession of edits causes continuous reload thrashing, resetting user scroll position, open folders, and selected files.

### The Protocol

```
[ Active Review Branch ]  --------------------------------->  [ Clean Reload (1x) ]
          \                                                             ^
           \ (Branch off)                                              /
            v                                                         /
   [ task/<feature-slug> ]                                           /
          |                                                         /
          +---> Subagent edits & runs file-scoped ward             /
          +---> Subagent commits verified code (git commit)       /
          +---> Orchestrator brings commit over (cherry-pick/merge)
```

#### Step 1: Branch Off Before Starting Work
When a new non-trivial task or batch of subagents is kicked off:
- Create an isolated task branch off the current branch:
  ```bash
  git checkout -b task/<task-slug>
  ```
  *(Or use an isolated `git worktree` via `mcp__dungeonmaster__create-worktree` when parallel checkouts are needed).*

#### Step 2: Subagents Work and Commit in Isolation
- Subagents make changes inside the task branch or worktree.
- Subagents verify their changes with file-scoped ward (`npm run ward -- -- <files>`).
- Once all checks pass (exit code 0), the subagent or orchestrator records a clean git commit:
  ```bash
  git commit -m "feat(<package>): <clear concise description>"
  ```

#### Step 3: Orchestrator Brings Over the Finished Commit
- Once verified and committed, switch back to the active review branch (or cherry-pick the commit):
  ```bash
  git checkout <review-branch>
  git cherry-pick <task-commit-hash>
  ```
- If a package build is required (e.g. CLI or Desktop main process), rebuild the specific workspace:
  ```bash
  npm run build -w @assayer/<workspace>
  ```

#### Benefit
The user's live Electron / Vite window updates **exactly once** with a complete, fully functioning, verified feature. No intermediate flicker, no reload loops, and no broken intermediate states.
