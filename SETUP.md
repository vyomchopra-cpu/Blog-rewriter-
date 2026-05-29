# Blog Generator — Setup & Run Guide

## Prerequisites

Install Node.js (v18 or later) from https://nodejs.org

## First-time setup

```
cd blog-generator
npm install
npm run dev
```

The app opens automatically. Go to **Settings** first and enter your Anthropic API key.

## On first launch

The app redirects to Settings if no API key is configured. Enter:
1. Anthropic API key (from console.anthropic.com)
2. Preferred model (Sonnet = faster/cheaper, Opus = best quality)
3. WordPress site URL, username, application password (optional — only needed for publishing)

## Running the app

```
npm run dev      # Development mode (hot reload)
npm run build    # Build distributable
```

## WordPress Application Password

Generate in: WordPress Admin → Users → Your Profile → Application Passwords
Enter a name (e.g. "Blog Generator"), click Add, copy the password.

## Workflow

1. **New Article** → select brand, geo, keyword, persona, format → Generate Outline
2. **Outline Editor** → review/edit sections → Generate Article (runs all 3 passes)
3. **Article View** → review, check the Quality scorecard, rate it (feedback), edit SEO → Send to WordPress as Draft
4. **Bulk Queue** → select multiple keywords → Generate All → Send All to WordPress

## Context & Feedback (the self-improving part)

Open the **Context & Feedback** screen. It manages a local `blog-data/` folder with three sub-folders:

- `context/` — brand docs, product facts, terminology, dos & donts. Injected as authoritative brand knowledge.
- `examples/` — gold-standard past articles. The generator mirrors their voice and depth.
- `feedback/` — auto-filled every time a writer rates an article. Past corrections the generator must not repeat.

**The app reads this folder live on every generation.** Drop files in (Import button, or "Open Folder" and copy them in), toggle individual files on/off, or add a quick note inline. Supported: `.txt .md .json .csv .html` natively, plus `.pdf` and `.docx` (extractors install automatically via npm).

To deploy across writers: point all installs at one shared/synced folder via **Change…** on the Context screen.

## Output Controls (Settings)

- **Model** — Sonnet (fast/cheap) or Opus (best)
- **Humanization Pass** — toggle Pass 3 on/off
- **Use Context Folder** — toggle live context injection
- **Temperature** — focus vs. creativity
- **Max Output Length** — article length ceiling
- **Reading Level / Tone** — audience and voice
- **Standing Instructions** — always-applied rules you can edit yourself between tuning sessions

## Quality checking (1/10th the time)

On the Article screen:
- **Lint** runs instantly and free — flags AI-tell phrases, em dashes, banned openers, missing keyword, low sentence variation.
- **AI Self-Critique** (one button, one API call) scores AI-detection risk, keyword coverage, persona fit, factual specificity, and brand voice, and lists the top fixes.

## Troubleshooting

- **"No API key configured"** → Go to Settings, save your API key, click Test API Key
- **WordPress test fails** → Verify the application password (not your login password)
- **electron-store error** → Ensure Node.js v18+ is installed
- **keytar not building** → Run `npm rebuild keytar` after `npm install`

## Tech notes

- All API calls (Anthropic + WordPress) run in Electron main process — API keys never exposed to renderer
- WordPress passwords stored in OS keychain via keytar (falls back to electron-store if keytar unavailable)
- Bulk generation runs sequentially to respect API rate limits
- Articles always saved as WordPress drafts — never auto-published
