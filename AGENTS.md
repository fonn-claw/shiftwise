# AGENTS.md — Build Instructions

## Context
This is a FonnIT daily build project. Read BRIEF.md for what to build.

## CRITICAL: Single-Session Build
Complete the ENTIRE app in this single session. Do NOT stop between phases.
Do NOT suggest `/clear` or context resets. Auto-advance through all phases.
Do NOT wait for follow-up instructions or human input.

## Methodology
Use GSD (get-shit-done) for the full build lifecycle:
1. Initialize: /gsd:new-project --auto @BRIEF.md
2. For EACH phase: discuss → ui-phase (if frontend) → plan → execute → verify
3. Auto-advance through ALL phases without human intervention
4. After all phases: /gsd:ship

**CRITICAL: You are running non-interactively. There is NO human to answer questions.**
When GSD asks for config preferences, workflow settings, or any confirmation:
- Always pick the recommended/default option
- Mode: YOLO, Granularity: Coarse, Parallel: Yes, Git: Yes, Research: Yes
- Plan Check: Yes, Verifier: Yes, Model Profile: Balanced
- NEVER wait for a response. NEVER ask "want me to continue?". Just proceed.

## UI Quality
This app will be showcased on LinkedIn. Use shadcn/ui, professional spacing,
consistent colors, polished typography. Run /gsd:ui-phase for every phase
with frontend work.

## KNOWN BUG: Font Variable
When using next/font (Inter or any Google font), the CSS variable MUST be wired correctly:
- In layout.tsx: `const inter = Inter({ variable: "--font-inter" })`
- In globals.css: `--font-sans: var(--font-inter);` (NOT `--font-sans: var(--font-sans)` — that's circular!)
This is a recurring bug. Double-check this after setup.

## Deploy Target
- Vercel with Neon PostgreSQL (Vercel-managed integration)
- Domain: shiftwise.demos.fonnit.com

## Standards
- Full test coverage
- Demo data seeded and realistic
- Build must pass before handoff
- Responsive design (mobile-first where applicable)

## On Completion
When completely finished, run:
openclaw system event --text "BUILD COMPLETE: shiftwise" --mode now
