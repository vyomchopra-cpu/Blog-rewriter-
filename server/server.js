// Local web-server version of the Blog Generator.
// Runs on Mac OR Windows: `npm install && npm start`, then open the printed URL.
// Reuses the Electron-free core (api.js, wordpress.js); feedback saves offline to
// a local blog-data folder. Same renderer as the desktop app (browser shim in main.jsx).
const express = require('express')
const path = require('path')
const api = require('../src/main/api')
const wp = require('../src/main/wordpress')
const store = require('./store')
const context = require('./context')

const PORT = process.env.PORT || 4317
const DIST = path.join(__dirname, '..', 'dist')

async function buildGenOpts(creds) {
  let extraContext = ''
  if (creds.useContextFolder) { try { extraContext = await context.buildContextBlock() } catch (e) {} }
  return {
    extraContext,
    customInstructions: creds.customInstructions || '',
    readingLevel: creds.readingLevel || '',
    tone: creds.tone || '',
    temperature: typeof creds.temperature === 'number' ? creds.temperature : 1,
    maxTokens: creds.maxTokens || 8000
  }
}
const withStyle = (opts, inputs) => {
  if (inputs && inputs.styleInstructions) opts.customInstructions = [opts.customInstructions, `WRITING STYLE: ${inputs.styleInstructions}`].filter(Boolean).join('\n\n')
  return opts
}
const needKey = (c) => { if (!c.anthropicApiKey) throw new Error('No API key configured. Go to Settings.') }

const handlers = {
  'get-config': async () => store.getConfig(),
  'save-config': async (config) => store.saveConfig(config),
  'test-api': async () => { const c = store.getApiCredentials(); if (!c.anthropicApiKey) return { success: false, message: 'No API key configured' }; return api.testApiKey(c.anthropicApiKey, c.model) },
  'test-wp': async () => { const c = store.getApiCredentials(); if (!c.wpSiteUrl || !c.wpUsername || !c.wpAppPassword) return { success: false, error: 'WordPress not fully configured' }; return wp.testConnection(c.wpSiteUrl, c.wpUsername, c.wpAppPassword) },
  'generate-outline': async (inputs) => { const c = store.getApiCredentials(); needKey(c); const o = withStyle(await buildGenOpts(c), inputs); store.bumpUsage({ type: 'outline', account: c.accountId }); return api.generateOutline(c.anthropicApiKey, c.fastModel || c.model, inputs, o) },
  'generate-draft': async ({ inputs, outlineJSON, researchJSON }) => { const c = store.getApiCredentials(); needKey(c); const o = withStyle(await buildGenOpts(c), inputs); store.bumpUsage({ type: 'draft', account: c.accountId }); return api.generateDraft(c.anthropicApiKey, c.model, inputs, outlineJSON, researchJSON, o) },
  'humanize-draft': async ({ draftHTML, keyword, brand }) => { const c = store.getApiCredentials(); needKey(c); const o = await buildGenOpts(c); store.bumpUsage({ type: 'humanize', account: c.accountId }); return api.humanizeDraft(c.anthropicApiKey, c.model, draftHTML, keyword, brand, o) },
  'should-humanize': async () => store.getApiCredentials().runHumanization !== false,
  'generate-metadata': async ({ inputs, finalHTML }) => { const c = store.getApiCredentials(); needKey(c); store.bumpUsage({ type: 'metadata', account: c.accountId }); return api.generateMetadata(c.anthropicApiKey, c.fastModel || c.model, inputs, finalHTML) },
  'replace-links': async ({ html, brand }) => api.replaceInternalLinks(html, brand),
  'generate-schema': async ({ metadata, keyword, brand }) => api.generateSchema(metadata, keyword, brand),
  'count-links': async ({ html }) => ({ count: api.countInternalLinks(html), links: api.extractInternalLinks(html) }),
  'count-words': async ({ html }) => api.countWords(html),
  'push-to-wp': async ({ articleData }) => { const c = store.getApiCredentials(); if (!c.wpSiteUrl || !c.wpUsername || !c.wpAppPassword) return { success: false, error: 'WordPress not configured. Go to Settings.' }; return wp.createDraft(c.wpSiteUrl, c.wpUsername, c.wpAppPassword, articleData, { seoPlugin: c.seoPlugin, misCategory: c.misCategoryId, wisCategory: c.wisCategoryId }) },
  'open-external': async (url) => ({ url }),
  'lint-article': async ({ html, keyword }) => api.lintArticle(html, keyword),
  'score-article': async ({ html, inputs }) => { const c = store.getApiCredentials(); needKey(c); store.bumpUsage({ type: 'score', account: c.accountId }); return api.scoreArticle(c.anthropicApiKey, c.fastModel || c.model, html, inputs) },
  'context-list': async () => context.listFiles(),
  'context-status': async () => ({ dataDir: context.getDataDir(), extractors: context.extractorStatus() }),
  'context-add-text': async ({ sub, name, content }) => context.addTextFile(sub, name, content),
  'context-toggle': async ({ rel, active }) => context.toggleFile(rel, active),
  'context-delete': async ({ rel }) => context.deleteFile(rel),
  'context-open-folder': async () => ({ success: false, dir: context.getDataDir(), note: 'Open this folder manually — a browser cannot open OS folders.' }),
  'context-set-dir': async () => ({ canceled: true, note: 'Set the BLOG_DATA_DIR env var to change the data folder for the local server.' }),
  'context-import-files': async () => ({ canceled: true, note: 'Use “Add note”, or drop files directly into the data folder. (Native file dialog is desktop-only.)' }),
  'save-feedback': async ({ entry }) => context.saveFeedback(entry),
  'state-get': async ({ key, def }) => store.getState(key, def === undefined ? null : def),
  'state-set': async ({ key, value }) => store.setState(key, value),
  'recent-add': async ({ entry }) => { const list = store.getState('recents', []); const item = { id: Date.now().toString(36), at: new Date().toISOString(), ...entry }; store.setState('recents', [item, ...(Array.isArray(list) ? list : [])].slice(0, 100)); return { success: true, item } },
  'usage-get': async () => store.getState('usage', { totalCalls: 0, byType: {}, byDay: {}, lastCall: null }),
  'usage-reset': async () => { store.setState('usage', { totalCalls: 0, byType: {}, byDay: {}, lastCall: null }); return { success: true } },
  'geo-generate': async (opts) => { const c = store.getApiCredentials(); needKey(c); let ex = ''; if (c.useContextFolder) { try { ex = await context.buildContextBlock() } catch (e) {} } store.bumpUsage({ type: 'geo', account: c.accountId }); return api.generateGeoCollateral(c.anthropicApiKey, c.fastModel || c.model, { ...opts, extraContext: ex }) },
  'rewrite-snippet': async ({ snippet, instruction, keyword, brand }) => { const c = store.getApiCredentials(); needKey(c); store.bumpUsage({ type: 'rewrite', account: c.accountId }); const r = await api.rewriteSnippet(c.anthropicApiKey, c.model, snippet, instruction); try { await context.saveFeedback({ keyword: `[REWRITE] ${keyword || ''}`, brand: brand || '', kind: 'rewrite', reward: -1, notes: `Instruction: ${instruction || '(none)'}\n\nBEFORE:\n${snippet}\n\nAFTER:\n${r}` }) } catch (e) {} return r },
  'feedback-export': async () => context.exportWeeklyFeedback()
}

const app = express()
app.use(express.json({ limit: '25mb' }))

app.post('/api/:channel', async (req, res) => {
  const fn = handlers[req.params.channel]
  if (!fn) return res.status(404).json({ ok: false, error: `Unknown channel: ${req.params.channel}` })
  try {
    const args = Array.isArray(req.body) ? req.body : []
    const result = await fn(...args)
    res.json({ ok: true, result })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) })
  }
})

app.use(express.static(DIST))
app.use((req, res) => res.sendFile(path.join(DIST, 'index.html')))

context.ensureDirs()
app.listen(PORT, () => {
  console.log(`\n  ✅ Blog Generator (local) is running`)
  console.log(`  →  Open in your browser:  http://localhost:${PORT}`)
  console.log(`  →  Feedback + data saved offline to:  ${context.getDataDir()}\n`)
})
