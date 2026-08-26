# Source design references

Original project inputs, added to the repo so the comments that already cite
them point at a real file instead of nothing.

- **`user-flow-flowchart.jpeg`** — the end-to-end flow (sign-up → company/job
  seeker branch → job posting, chat areas, applications, subscriptions) that
  `flowchart: "..."` comments across `app/` quote verbatim. Search the
  codebase for `flowchart:` to find every call site this diagram backs.
- **`joblify-use-cases-v002.pdf`** — the use-case spec (project code `JOB`)
  that `JOB_UC_*` comments (e.g. `JOB_UC_09.0`) reference for specific
  numbered requirements.

Both predate this repo's docs tree; treat them as the original brief, not as
living documentation — `docs/DESIGN.md`, `docs/FRONTEND.md`, and
`docs/REMAINING_STEPS.md` are what actually stay current with the code.
