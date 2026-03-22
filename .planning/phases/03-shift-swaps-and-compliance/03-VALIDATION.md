---
phase: 3
slug: shift-swaps-and-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SWAP-01..07, COMP-04 | build+unit | `npx tsc --noEmit && npx vitest run` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | DEMO-05,06 | build | `npm run build` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 2 | SWAP-02..07 | build | `npm run build` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 2 | COMP-01..03 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing vitest infrastructure from Phase 1-2

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swap request card shows both shifts side-by-side | SWAP-07 | Visual layout | Navigate to /swaps, verify swap request details |
| One-click approve/reject buttons | SWAP-05 | Interactive UI | Click approve on pending swap |
| Compliance banner shows posting warnings | COMP-02 | Visual indicator | Navigate to /compliance, check for warnings |
| Audit log shows chronological entries | COMP-04 | Visual display | Navigate to /compliance, check audit log |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
