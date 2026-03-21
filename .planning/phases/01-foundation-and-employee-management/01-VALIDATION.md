---
phase: 1
slug: foundation-and-employee-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-02 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | AUTH-04 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | EMPL-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | EMPL-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | EMPL-06 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | DEMO-01 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | DEMO-02 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` — test framework installation
- [ ] `vitest.config.ts` — vitest configuration
- [ ] `src/__tests__/` — test directory structure

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login page renders centered card with logo | AUTH-01 | Visual layout | Navigate to /login, verify centered card |
| Role badge displays in header | AUTH-05 | Visual element | Login as each role, verify badge |
| Sidebar navigation collapses | AUTH-05 | Interactive UI | Click collapse button, verify icon-only mode |
| Employee slide-over panel | EMPL-02 | Interactive UI | Click employee row, verify panel slides from right |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
