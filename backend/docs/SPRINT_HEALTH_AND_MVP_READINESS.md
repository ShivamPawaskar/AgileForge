# Sprint health and MVP readiness rules

## Sprint health

The sprint metrics endpoint recalculates values from the selected sprint, its tasks, their status histories, due dates, and project membership on every request. There is no cached or predictive score.

- **Completed:** the sprint is marked completed, or it contains tasks and every task is done.
- **At Risk:** the sprint has no tasks, completion is more than 10 percentage points behind elapsed sprint time, or any unfinished task is overdue (unless the delayed rule below applies).
- **Delayed:** completion is more than 20 percentage points behind elapsed sprint time, or there is at least one overdue task after at least half of the sprint duration has elapsed.
- **On Track:** none of the above conditions apply.

Elapsed time is clamped to 0–100% of the sprint dates. Completion pace uses completed task story points divided by total task story points; when all task estimates are zero, it uses completed task count. Overdue means an unfinished task with a due date earlier than the evaluation time. An empty sprint is At Risk because no committed work is available to measure.

## MVP readiness

Readiness is an evidence checklist, not a predictive AI assessment. The score is `passed checks / 5 × 100`; each check has equal weight. A check passes only when qualifying project records exist:

1. **Core workflow completion:** at least one task tagged `Core workflow` exists and every such task is done.
2. **Critical task completion:** at least one critical task exists and every critical task is done.
3. **Input validation evidence:** at least one test case categorized `Input validation` has a `Passed` status.
4. **Test record coverage:** at least five test cases are recorded for the project.
5. **Working demonstration feature:** at least one task tagged `Demo feature` is done and at least one test case categorized `Demo feature` has a `Passed` status.

The readiness page shows the evidence used for each check and recommendations for failed checks. Task evidence tags and test case outcomes are editable project records stored in MongoDB. Re-evaluate after changing evidence to refresh the result.
