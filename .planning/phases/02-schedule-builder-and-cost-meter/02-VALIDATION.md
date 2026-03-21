---
phase: 2
slug: schedule-builder-and-cost-meter
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 2 — Validation Strategy

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
| 02-01-01 | 01 | 1 | SCHED-01 | build | `npm run build` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | DEMO-03 | build | `npm run build` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 2 | SCHED-02,03,04 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-02-02 | 02 | 2 | COST-01..08 | build | `npm run build` | ✅ | ⬜ pending |
| 02-03-01 | 03 | 2 | SCHED-05,06,07 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-03-02 | 03 | 2 | SCHED-08,09 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing vitest infrastructure from Phase 1

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Grid renders 12 employee rows x 7 day columns | SCHED-01 | Visual layout | Navigate to /schedule, verify grid structure |
| Shifts color-coded by role | SCHED-06 | Visual styling | Check shift cells have correct role colors |
| Drag-and-drop shift reassignment | SCHED-05 | Interactive UI | Drag a shift to different employee/day |
| Cost meter updates in real-time | COST-04 | Live behavior | Add/remove shifts, verify sidebar updates |
| Overtime indicators amber/red | COST-05 | Visual threshold | Check Jake Kim's hours show red indicator |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
