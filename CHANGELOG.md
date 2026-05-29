# Changelog

All notable changes to the Blog Generator. Newest first. Keep this in sync with
`src/renderer/screens/Changelog.jsx` (the in-app view).

## v2.2 — Cost control, feedback rewards, distribution (2026-05-29)

### Fixed
- **Opus removed / cost control.** Opus is disabled everywhere and existing installs auto-migrate to Sonnet. New **Fast model** setting routes cheap passes (outline, metadata, scoring, GEO) to Haiku; draft + humanize stay on Sonnet. Sidebar now shows the real model (it used to label everything non-Sonnet as "Opus").
- **GEO Hacker** now strips markdown code fences (was rendering ```html as literal text).

### New
- **Reward signal** on every feedback entry (−1…+1, derived from the 1-5 rating or set explicitly).
- **Rewrite logging** — inline highlight-edits log BEFORE→AFTER to the feedback folder as a reward −1 training signal.
- **Weekly export** — "Export weekly feedback file" button bundles all feedback into `WEEKLY-EXPORT-<date>.md` (the single file to request weekly) and reveals it in Explorer.
- **Crossed-out data points** — click research data points in the Outline to cross them out; excluded from research + draft.
- **Nascent markers** — amber dots on nascent nav sections and the Newsletter/One-Pager formats.
- **Baked shared key** — optional `src/main/bundled-config.json` (gitignored; template provided) seeds one shared API key + zero setup into writer builds.

### Packaging notes (hard-won on the locked build machine)
- `keytar` removed (native module; can't compile with a space in the user path "Vyom Gaurav Chopra"). WP password now falls back to electron-store.
- electron-builder needs the `winCodeSign` cache pre-extracted (no symlink privilege on this machine) — extract any `*.7z` in `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign` into a `winCodeSign-2.6.0` folder, ignore the 2 macOS symlink errors.
- Build the unpacked target only: `electron-builder --win dir` (the `portable`/installer targets pull in the signing toolkit). Output zipped from `release\win-unpacked`.

## v2.1 — "First week updates" (2026-05-28) — NASCENT

This release scaffolds **all 19 requested features** at a basic, touch-and-give-feedback
level. A "Feedback" button sits beside every new build; notes save into
`blog-data/feedback/` for the weekly tuning pull. Cross-account features run as
**local scaffolds** until the online backend is switched on.

### Fixed
- **Length overshoot (1200 → 1800).** Target word count is now a hard target.
  `generateDraft` derives `max_tokens` from the word count (`wordCountToMaxTokens`)
  and the prompt enforces a ±10% range. The humanization pass is capped to the
  draft size and told not to expand. Outline no longer hardcodes 1800.
- **Em dashes surviving the output.** New deterministic `sanitizeArticle()` strips
  every em/en/horizontal dash regardless of the humanization toggle. It runs on the
  draft, the humanize pass, and the final link pass. Lint now counts en dashes too,
  so the AI feedback and the actual copy finally agree.

### New
- **Newsletter** and **One-Pager** (tech informatics) article formats.
- **Length tiers** — Small / Medium / Large / X-Large, plus a 300–3500 word slider.
- **Recents** — ChatGPT-style history of every generation (sidebar + screen).
- **Roles** — Admin / Writer / Spectator role switcher (local sim of the 3 accounts).
- **Workflow** — Jira-style board: Keywords → Assigned → Drafting → In Review → Approved/Published.
- **Usage** — dashboard of API calls, estimated tokens & cost, last-7-days, by type.
- **GEO Hacker** — generate citation-ready collateral (Q&A, quotable stats, llms.txt,
  glossary) for AI answer engines (ChatGPT/Gemini/Perplexity/AI Overviews).
- **Knowledge base restructure** — new categories (context / examples / collaterals /
  specs / feedback) + per-format example folders (blogs, newsletters, one-pagers,
  definitive-guides, listicles, comparisons), read live.
- **Customize** — user-extensible custom keywords, editable personas (full fields),
  and custom writing styles that plug into the prompt builder.
- **Inline highlight-edit** — select any sentence in the article and rewrite just
  that part.
- **Revise page** — edit the published HTML, re-clean/lint, push an updated draft.
- **Feature feedback buttons** beside every new/nascent build.

### Notes / next
- Online migration (Node/Express or Next backend, login, real 3-account roles,
  shared workflow, admin-sees-all, central usage) is the next milestone. Confirm
  cloud vs local-network hosting first. Hosting ≈ $0 on free tier, ~$5/mo always-on;
  the Anthropic API remains the real cost.
- Drag-and-drop on the workflow board, reopening full drafts from Recents, and true
  per-account usage roll-up all land with the backend.

## v2.0 — Context & quality layer (2026-05-27)
- Live `blog-data/` knowledge folder injected into every generation.
- Feedback bar + auto-saved feedback files.
- Free local lint + on-demand AI self-critique scorecard.
- Output controls: temperature, max tokens, humanization toggle, reading level, tone,
  standing instructions.

## v1.0 — Core (2026-05-26)
- 3-pass pipeline (research/outline → draft → humanize).
- WordPress draft publishing with Yoast/RankMath meta.
- Brand / geo / persona / format selection and bulk queue.
