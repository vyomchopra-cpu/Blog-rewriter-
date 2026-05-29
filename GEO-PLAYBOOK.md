# GEO Master Playbook — MoveInSync & WorkInSync (condensed)

Source: GEO planning sessions, May 2026. Full prompt corpus + canonical phrases are
machine-usable in `src/data/geo-corpus.js` (used by the GEO Hacker screen). Source
workbooks: `GEO Prompts- MIS- All Location.xlsx`, `GEO Tracker - Prompts Repo.xlsx`.

## How LLMs pick what to say (two layers)
- **Training data (long game, 6-18 mo):** Wikipedia > Reddit > news/press (ET, YourStory, People Matters) > G2/Capterra/Gartner > Quora/SO > owned blog. Can't edit; influence by being present in trusted sources.
- **RAG / live retrieval (short game, 4-6 wks):** Perplexity, ChatGPT browse, Gemini, Google AIO, Copilot retrieve at query time. Wins: pages that rank on Google, high DA, semantic match, structured content (schema/headers/direct answers), G2/Capterra, ranking Reddit threads.
- **Co-occurrence is the mechanism.** Consistent phrasing across many independent sources = the model treats it as fact. 80% of a quarter's effort should be RAG.
- **Deep search** runs sub-queries, reads full pages, weights specific numbers + structured comparisons + sources that cite sources.

## Benchmarking (Part 2) — the next-week dashboard
- Fixed corpus of 40-80 prompts (60% unbranded / 25% comparison / 15% branded), stable month-over-month.
- Metrics per prompt × engine: **presence rate, position, sentiment, citation rate, share of voice, accuracy.** Optimise citation rate (authority) over presence (awareness).
- Engines: ChatGPT, Google AIO, Perplexity, Gemini, Claude, Copilot. Perplexity moves fastest, Claude slowest.
- **Tracker schema (from the MIS workbook):** Prompt · Country · Page · Pain Points · Topics · Tags · Priority (P0/P1) · Your brand mentioned · Total citations · Engines ranked · Your domain cited · **Routematic mentioned** · **Routematic cited** · Intent Volume Monthly · 3-month growth.
- Cadence: weekly headline dashboard, monthly trend review, quarterly competitor re-run.

## Three surfaces: traditional search · AI answers (GEO) · zero-click/AIO snippets.

## Quick wins (days) — Part 5
1. **G2 profile rewrite** with exact corpus phrases (Perplexity quotes verbatim) — highest ROI.
2. Capterra + SoftwareSuggest update (SoftwareSuggest dominates India B2B SaaS queries).
3. FAQ sections + FAQPage schema on top 10 blog posts.
4. Standalone "What is X" definitional pages (400-600 words, FAQ schema).
5. Internal linking pass with exact anchor text.
6. Respond to all G2/Capterra reviews.
7. Crunchbase update (facts AI engines pull).

## Long-term (3-12 mo, compounding) — Part 6
1. Topical authority clusters (pillar + 6-8 cluster posts) — MIS: transport mgmt, carpooling, route optimisation, compliance/safety, fleet cost. WIS: hybrid, desk booking, room utilisation, visitor mgmt, space optimisation.
2. Comparison page library — MIS: vs Routematic, Ola Corporate, WheelsEye, in-house. WIS: vs Robin, Archieapp (top US priority), Envoy, Comeen.
3. Backlinks (DR moat): MIS DR 43 vs Archieapp DR 74. Digital PR data study, HARO/SourceBottle, guest posts (People Matters, HR Katha, CiteHR, SHRMIndia), NASSCOM/CII/FICCI listings, competitor backlink replication.
4. Annual original data report ("India Employee Commute Report 2026").
5. City/industry landing pages (Bengaluru, Pune, IT parks, pharma).
6. **Wikipedia page for MoveInSync** (highest-trust LLM signal; build 3-5 press citations first, neutral tone, no COI).
7. Review velocity (5 G2/Capterra/mo, outcome+number language, respond to all).

## Reddit (Part 7) — it's a corpus, not social
- MIS subs: r/FacilitiesManagement, r/humanresources, r/india, r/bangalore, r/pune, r/supplychain, r/IndianStartups. WIS: r/remotework, r/hybrid_work, r/sysadmin.
- Modes: answer existing threads (safest, one honest mention) · neutral discussion posts · founder AMA. Aged genuine accounts, karma first. Premium does nothing for GEO.

## Press (Part 8): one ET/YourStory data point > 20 blogs. Real attributable numbers. Targets: ET CIO/HR Tech, People Matters, YourStory, Inc42, Business Standard. 2-3 placements/quarter.

## Internal (Part 9, zero cost): employee LinkedIn amplification · sales/CS problem log (verbatim customer language) · SME voice-note posts · founder posts (specific number, 150-250 words, 2/wk) · customer quote extraction · Quora/forum answers.

## Schema (Part 10, one-time): FAQPage on every post/comparison, Article, Organization, Product, BreadcrumbList. AIO/Copilot extract structured data verbatim.

## 12-week plan: Wk1 baseline + G2/Capterra/Crunchbase rewrite + competitor baseline; Wk2 prompt-mapped posts + LinkedIn channel; Wk3 review campaign + Wikipedia draft + schema start; Wk4 Wikipedia submit + QBR review hook; Wk5-6 comparison pages + schema complete; Wk7 Reddit seeding + press pitch 1; Wk8 score vs baseline; Wk9-10 press 2 + Ola comparison; Wk11 re-score + competitor benchmark; Wk12 full review + plan months 4-6.

## The 20% that structurally moves LLMs (Part 13) — built into GEO Hacker
1. **Own the canonical definition** of each category (cited by Wikipedia/G2/press).
2. **Inject memorable data** into the corpus (one specific number across 5 sources).
3. **Genuine "when to choose competitor" section** → comparison pages read as informational, get retrieved.
4. **Seed consistent canonical language** across every surface (5-8 phrases each — see geo-corpus.js).
5. **"Alternatives to [competitor]" pages** → capture late-funnel switchers.

## What good looks like @12mo
MIS non-branded organic 600 → 3,000-5,000/mo; DR 43 → 55-60; MIS mentioned in ≥60% of MIS prompts, WIS ≥40%; Wikipedia live; ≥3 cited press data points; inbound demo requests 2x. Pipeline: months 1-3 zero, 4-6 early signal, 6-12 compounding.

---
*Next-week build candidate: the GEO benchmarking dashboard (presence/position/citation/SoV across 5 engines × the corpus, with the Routematic competitor column), importing the GEO Tracker xlsx directly.*
