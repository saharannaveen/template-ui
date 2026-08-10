# Sequential HITL Approval Design

## Problem

When the orchestrator makes 2+ tool calls in a single LLM response, the `HumanInTheLoopMiddleware` creates one interrupt with N `action_requests`. The current UI has two bugs:

1. **All-or-nothing approval:** Clicking Approve on ANY tool card approves ALL action_requests at once (`ChatMessagesView.tsx:633-635`). There is no per-request granularity.
2. **Single boolean gate:** One `approvalSubmitted` state (`ChatMessagesView.tsx:474`) hides all approval buttons after any single click.

The agent's middleware strictly validates `len(decisions) == len(action_requests)` (`human_in_the_loop.py:438-443`) — sending fewer decisions crashes with a `ValueError`.

## Design

### UX Flow

1. Agent interrupt arrives with N `action_requests` (e.g. `web_search` + `read_file`).
2. UI shows **only the first** action_request card with Approve / Reject / Always Allow buttons.
3. User approves → card is marked decided, **second** card appears.
4. User approves → all N decisions are sent to the backend in one `resumeWithDecisions([...])` call.
5. Agent resumes and processes all tools.

Multi-subagent case: if subagent A and B each interrupt separately, LangGraph handles these as sequential interrupts. Each gets its own approval cycle — no UI changes needed for this case.

### Backend Constraint

`HumanInTheLoopMiddleware.after_model()` collects all interruptable tool calls into a single `interrupt()` call and validates the decision count on resume:

```python
decisions = interrupt(hitl_request)["decisions"]
if len(decisions) != len(interrupt_indices):
    raise ValueError(...)
```

All N decisions must be sent together. No partial resumes.

### Component Changes

#### 1. `ChatMessagesView.tsx` — Sequential approval state

Replace:
- `approvalSubmitted: boolean` → `decisions: Array<{type: 'approve'|'reject', message?: string} | null>` (length = N, initialized to all nulls)
- Add `currentApprovalIndex: number` (starts at 0)

Rendering logic:
- Only render approval buttons on the tool card matching `action_requests[currentApprovalIndex]`
- Other action_request cards that haven't been reached yet are not shown (or shown without buttons, grayed out)
- Already-decided cards show a badge ("Approved" / "Rejected") but no buttons

On approve/reject click:
```
decisions[currentApprovalIndex] = { type: 'approve' | 'reject' }
currentApprovalIndex++
if (currentApprovalIndex === action_requests.length) {
  onInterruptResume(decisions.filter(Boolean))
}
```

"Always Allow" still works per-tool-name. If it's clicked, auto-approve that tool and advance to next.

#### 2. `ChatPage.tsx` — No changes

`handleInterruptResume` already passes `decisions` array through to `thread.resumeWithDecisions(decisions)`.

#### 3. `useStreamingAPI.ts` — Crash recovery for partial decisions

Save partial decisions to `localStorage` when any individual decision is made:
```
localStorage.setItem(`partial-decisions:${threadId}`, JSON.stringify({
  decisions,           // array with nulls for undecided
  currentIndex,
  interruptHash,       // hash of action_requests to verify it's the same interrupt
  timestamp
}))
```

On interrupt appearance, check for saved partial decisions:
- If `interruptHash` matches, restore `decisions` array and `currentApprovalIndex`
- If stale (>5 min) or mismatched, discard

Clear partial decisions after successful `resumeWithDecisions` call.

#### 4. Auto-approve (`ChatPage.tsx:381-399`)

The existing auto-approve effect already generates one decision per action_request. No change needed — it sends all N decisions at once.

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| 2 action_requests, same tool name | Distinguish by index position, not name |
| User approves 1 of 3, then refreshes page | Partial decisions restored from localStorage |
| Agent crashes mid-UI-decision | On recovery, agent re-interrupts with same requests; UI restores partial state |
| Agent crashes after all decisions sent | Existing `pending-decision:{threadId}` recovery handles this |
| autoApproveAllTools is true | All decisions auto-sent immediately, no UI shown |
| alwaysAllowedTools matches some but not all | Auto-approve matching tools, show UI for remaining |

### Files Modified

- `src/frontend/components/ChatMessagesView.tsx` — sequential approval state and rendering
- `src/frontend/hooks/useStreamingAPI.ts` — partial decision persistence/restore
- `e2e/hitl/` — update E2E tests for sequential flow
