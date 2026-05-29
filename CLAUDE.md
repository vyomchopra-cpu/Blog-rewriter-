# Blog Generator — Project Context for Claude

This file orients any Claude session working on this project. Read it first.

## What this is

An in-house SEO blog generator for **3 content writers** at **MoveInSync (MIS — employee transport)** and **WorkInSync (WIS — workplace management)**. It turns a keyword + brand + persona + format into a publish-ready, humanized HTML article and pushes it to WordPress as a draft.

Goals the owner stated: **10× output, 10× quality, 1/10th the checking time.** "Koala, but better, and hyper-tuned to MIS/WIS context." Self-improving from a feedback folder.

Currently a **local Electron + React desktop app**. A decision has been made to migrate it to an **online web app** (see Roadmap). The owner runs/relaunches it themselves.

## Tech stack (do not deviate without asking)

- Electron 28 (desktop shell) + React 18 + Vite + Tailwind CSS
- Node main process (CJS) for all API calls (Anthropic + WordPress)
- `electron-store` (config), `keytar` (WP password in OS keychain), `axios`
- Optional: `pdf-parse`, `mammoth` (extract text from context files)
- **No** TypeScript, Redux, other CSS frameworks, database, auth, or server component (in the current desktop version).

## How to run

```
npm install
npm run dev      # Vite on localhost:5173 + Electron window (dev; terminal must stay open)
npm run build    # vite build + electron-builder. NOTE: on the locked build machine use `electron-builder --win dir` only (portable/installer targets need the winCodeSign signing toolkit which fails without symlink privilege). See CHANGELOG.md "Packaging notes" for the winCodeSign pre-extract workaround, the keytar removal, and why the user-path space breaks native builds. Shareable artifact = zip of release\win-unpacked.
```
`npm run dev` opens a native desktop window. localhost:5173 exists internally but must NOT be opened in a plain browser (no main-process / IPC there, so API calls fail). Requires Node 18+.

## Architecture

### Main process — `src/main/`
- `main.js` — window creation, all `ipcMain.handle` handlers, `buildGenOpts()` (loads live context + output controls and threads them into the pipeline).
- `api.js` — all Anthropic calls + helpers. Contains the 3-pass pipeline, metadata, schema, internal-link replacement, word/link counting, `lintArticle` (free local scan), `scoreArticle` (AI self-critique), `testApiKey`. NOTE: brand/persona/geo/format/anti-pattern data is **inlined** here (CJS can't import the ESM `src/data` files), so changes to prompts must be mirrored in both `api.js` and `src/data/`.
  - v2.1 additions: `sanitizeArticle()` (deterministic em/en-dash strip, runs on every pass — the real em-dash fix), `wordCountToMaxTokens()` + hard ±10% length range in `generateDraft` (the length-overshoot fix), `LENGTH_TIERS`, **Newsletter** + **One-Pager** formats, `resolvePersona()` (falls back to a user-defined `inputs.customPersona`), `generateGeoCollateral()` (GEO Hacker), `rewriteSnippet()` (inline highlight-edit). `inputs.styleInstructions` is merged into `customInstructions` by the main-process handlers.
- `wordpress.js` — `testConnection`, `createDraft` (status always `draft`), tag resolve/create, Yoast/RankMath meta fields.
- `store.js` — `electron-store` via **dynamic `import()`** (v8 is ESM, main is CJS — this matters). Persists API key, model, WP creds, SEO mapping, presets, and output controls. WP password goes through keytar with a fallback.
  - v2.1 additions: `currentRole`/`accountId`/`lengthTier` config; generic `getState(key)`/`setState(key,value)` for nascent feature data (`recents`, `workflowItems`, `customKeywords`, `customPersonas`, `customStyles`); `bumpUsage({type,account})` for the usage dashboard.
- `context.js` — manages the live `blog-data/` folder. v2.1 categories: `context/`, `examples/` (+ per-format subfolders: blogs, newsletters, one-pagers, definitive-guides, listicles, comparisons), `collaterals/`, `specs/`, `feedback/`. `buildContextBlock()` reads them on **every** generation (one-level recursion via `collectFiles`) and injects brand knowledge + accumulated feedback into prompts. Configurable shared dir. Optional PDF/DOCX extractors with graceful fallback.
- `preload.js` — exposes `window.electron.invoke(channel, ...args)` via contextBridge.

### Renderer — `src/renderer/`
- `App.jsx` — MemoryRouter, holds shared `articleState`, dynamic accent color (indigo=MIS, emerald=WIS), routes to Settings if no API key.
- `screens/`: `KeywordSelect`, `OutlineEditor`, `ArticleView`, `BulkQueue`, `Settings`, `KnowledgeBase` (Context & Feedback), plus v2.1: `Recents`, `Workflow` (Jira board), `Usage`, `GeoHacker`, `Customize` (custom keywords/personas/styles), `Changelog`, `Revise`.
- `components/`: `Sidebar` (now has a role switcher + expanded nav), `StatusBadge`, `Scorecard`, `FeedbackBar`, `FeatureFeedback` (the reusable "Feedback" button beside every nascent feature → saves to `blog-data/feedback/`).
- Main-process IPC added in v2.1: `state-get`/`state-set`, `recent-add`, `usage-get`/`usage-reset`, `geo-generate`, `rewrite-snippet`; `bumpUsage` is called inside every Claude-calling handler.
- Keyword/persona/format data is **inlined in the renderer screens too** (renderer can't `require` node modules). Three copies of keyword data exist: `src/data/keywords.js`, and inlined in `KeywordSelect.jsx` + `BulkQueue.jsx`. Keep in sync.

### Data — `src/data/`
`keywords.js`, `personas.js` (8), `geo-blocks.js` (India/US), `product-blocks.js` (MIS/WIS), `internal-links.js`, `anti-patterns.js`, `prompt-builder.js`.

## The 3-pass pipeline

1. **Pass 1 — Research/Outline** (`generateOutline`): returns JSON (search intent, competitor word count, entities, gaps, geo signals, outline with H2/H3 + flags: GEO DATA / STAT NEEDED / PRODUCT MENTION / COMPETITOR GAP).
2. **Pass 2 — Draft** (`generateDraft`): full HTML following the outline. System prompt assembled from brand + persona + geo + format + anti-pattern blocks + live context + standing instructions. Internal links emitted as `{{LINK:anchor|URL}}` placeholders.
3. **Pass 3 — Humanization** (`humanizeDraft`): rewrites for sentence-length variance, breaks AI paragraph patterns, strips banned phrases/em dashes, adds a cited stat + a light opinion. **Toggleable** in Settings.

After passes: `replaceInternalLinks` → `generateMetadata` (title/meta/slug/tags/schema) → `generateSchema` (JSON-LD) → assemble final HTML. Then `lintArticle` runs automatically (free); `scoreArticle` runs on demand.

Sequential always (never parallel) to respect rate limits. Bulk mode runs articles one at a time.

## Critical conventions / gotchas

- All Claude calls live in the **main process** — the API key never reaches the renderer.
- WordPress password via **keytar** (OS keychain), never plaintext.
- `electron-store` is **ESM** — loaded via dynamic `import()` in `store.js`/`context.js`. Don't switch to `require()`.
- Internal-link placeholders MUST be replaced before rendering (preview uses `dangerouslySetInnerHTML`) and before WordPress push.
- Articles are **always** pushed as `draft`, never auto-published.
- Prompt/data edits must be mirrored between `api.js` (inlined) and `src/data/`.
- The `blog-data/` folder is the self-improvement engine — read live every generation. Feedback the writers leave (star rating + notes via `FeedbackBar`) auto-saves there as timestamped `.md`.

## Settings the owner controls

API key, model (Sonnet/Opus), WP site/user/app-password, SEO plugin (Yoast/RankMath/None) + category IDs, presets, and **Output Controls**: temperature, max tokens, humanization on/off, use-context-folder on/off, reading level, tone, and free-text **Standing Instructions** (always-applied rules — fastest way to steer output without code).

## Roadmap (agreed, not yet built)

**Big direction decision (2026-05-28): migrate to an ONLINE WEB APP.** Why: the 3 writers are on company-managed/MDM-locked machines (Scalefusion) where installing an unsigned `.exe` is likely blocked; browsers work everywhere. Online gives zero-install, ONE central API key (writers never see Settings), native reviewer mode, instant updates. Writers are same-office; budget is "depends on value." Leaning **cloud-hosted (~$5–15/mo, Render/Railway)** over free local-network because the host machine is also MDM-locked (may block inbound ports); local-network is the free fallback if there's an always-on office machine + lenient IT. **Confirm cloud vs local-network before starting the migration.**

Migration is mostly mechanical: core logic (data, prompt-builder, 3-pass api, WordPress integration, React screens) **ports unchanged**; swap the Electron shell for a small Node/Express (or Next.js) backend holding creds server-side; add login + roles.

**Next-week "first week updates" package:**
1. **Online migration** + simple **login** (3 accounts: 2 junior writers + 1 senior).
2. **Reviewer / collaboration mode** — juniors create + "Submit for Review"; senior gets a **Review Queue** to read, comment, **Approve → publish to WordPress**. (Desktop-only fallback: push as WP "Pending Review" status + WP Editor role.) Owner wants the 3 people "alive" and able to interact across their own views.
3. **Wispr Flow scratchpad** — a Scratchpad screen with a big capture box (text OR Wispr voice dictation; Wispr types into focused fields at OS level, no API integration needed). "Scratchpad → Blog Post" seeds the full pipeline from a freeform brain-dump (infers keyword/angle/persona, user confirms, then 3 passes). Entries auto-save to `blog-data/scratchpad/` and can be sent to `feedback/`.
4. **Hyper-customization (requested 2026-05-28):** let writers **add their own keywords** (persist + editable in-app, not just the static lists; possibly fetch/add via API) and **define custom writing styles** that plug into the prompt builder. Make keywords/styles user-extensible rather than hardcoded.

Other roadmap ideas: real SERP research via Serper/SerpAPI in Pass 1; folder file-watching; visual humanization diff; semantic retrieval when context grows; internal-link sitemap crawl; one-click "feedback → prompt rules"; pre-baked config in the build so writers have zero setup.

## Known install gotcha (resolved 2026-05-28)

On first `npm install`, Electron's postinstall downloaded the binary zip to the `@electron/get` cache (`%LOCALAPPDATA%\electron\Cache\...`) but **failed to extract it into `node_modules\electron\dist`**, so `npm run dev` threw `Electron failed to install correctly`. Re-running `node node_modules/electron/install.js` just reported "Cache hit" and no-op'd. Fix that worked: manually `Expand-Archive` the cached 107MB zip into `node_modules\electron\dist` and write `node_modules\electron\path.txt` containing `electron.exe`. If this recurs (e.g. fresh clone), do that, or delete the electron cache dir and reinstall. Config files are `postcss.config.mjs` / `tailwind.config.mjs` (.mjs, since package.json is CJS for the main process — do NOT add `"type":"module"`).

## Current status

Desktop app fully built: core + v2 (context/feedback/quality) + **v2.1 "first week updates" (nascent breadth)**. v2.1 shipped: the two real bug fixes (length overshoot, em dashes), Newsletter/One-Pager formats, length tiers, Recents, role switcher (Admin/Writer/Spectator), Workflow board, Usage dashboard, GEO Hacker, KB categories + per-format folders, Customize (keywords/personas/styles), inline highlight-edit, Revise page, and a Feedback button beside every new feature. Cross-account features are **local scaffolds** (single-machine sim) pending the online backend.

Owner relaunches themselves. `npm run build` packaging still unverified end-to-end. **Not yet verified at runtime by this session — needs `npm run dev` smoke test** (watch for any import typos in the new screens). See `CHANGELOG.md`.

**Next session priorities:** (1) confirm cloud vs local-network hosting; (2) online migration — Node/Express (or Next) backend holding creds + real 3-account auth/roles, turning the nascent Workflow/Usage/Recents/roles scaffolds into shared cross-user state; (3) drag-and-drop workflow, reopen-from-Recents, real per-account usage. **Port the core logic — do not rebuild it.**
