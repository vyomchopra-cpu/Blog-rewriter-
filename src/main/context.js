const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { app } = require('electron')

// Optional extractors — gracefully skip if not installed
let pdfParse = null
let mammoth = null
try { pdfParse = require('pdf-parse') } catch (e) { pdfParse = null }
try { mammoth = require('mammoth') } catch (e) { mammoth = null }

// Input categories. context = brand voice/dos&donts, examples = gold-standard
// past work (with per-format subfolders), collaterals = decks/one-pagers/sales
// assets, specs = product/tech specifications, feedback = auto-filled corrections.
const SUBDIRS = ['context', 'examples', 'collaterals', 'specs', 'feedback']
// Per-article-format knowledge folders, seeded under examples/.
const EXAMPLE_FORMATS = ['blogs', 'newsletters', 'one-pagers', 'definitive-guides', 'listicles', 'comparisons']
const TEXT_EXTS = ['.txt', '.md', '.markdown', '.json', '.csv', '.html', '.htm']

// Labels + caps for how each category is injected into prompts
const INJECT = {
  context:     { label: 'CONTEXT FILE',   group: 'knowledge' },
  examples:    { label: 'STYLE EXAMPLE',  group: 'examples' },
  collaterals: { label: 'BRAND COLLATERAL', group: 'knowledge' },
  specs:       { label: 'PRODUCT SPEC',   group: 'knowledge' }
}
const CONTEXT_CHAR_CAP = 10000   // shared by context + collaterals + specs (lowered for cost)
const EXAMPLE_CHAR_CAP = 6000
const FEEDBACK_CHAR_CAP = 4000

let _store = null
async function getStore() {
  if (_store) return _store
  const { default: Store } = await import('electron-store')
  _store = new Store()
  return _store
}

async function getDataDir() {
  const store = await getStore()
  const custom = store.get('dataDir', '')
  const dir = custom || path.join(app.getPath('userData'), 'blog-data')
  return dir
}

async function setDataDir(dir) {
  const store = await getStore()
  store.set('dataDir', dir || '')
  await ensureDirs()
}

async function ensureDirs() {
  const base = await getDataDir()
  await fsp.mkdir(base, { recursive: true })
  for (const sub of SUBDIRS) {
    await fsp.mkdir(path.join(base, sub), { recursive: true })
  }
  // Per-format knowledge folders under examples/
  for (const f of EXAMPLE_FORMATS) {
    await fsp.mkdir(path.join(base, 'examples', f), { recursive: true })
  }
  const readme = path.join(base, 'README.txt')
  if (!fs.existsSync(readme)) {
    await fsp.writeFile(readme, SEED_README, 'utf8')
  }
  return base
}

const SEED_README = `BLOG GENERATOR — DATA FOLDER

Drop files here to make the generator smarter. It reads this folder on EVERY generation.

context/      Brand voice, dos & donts, terminology, anything MIS/WIS specific.
examples/     Gold-standard past work. Per-format subfolders:
              blogs/  newsletters/  one-pagers/  definitive-guides/  listicles/  comparisons/
collaterals/  Sales decks, one-pagers, brochures, campaign assets.
specs/        Product/technical specifications and fact sheets.
feedback/     Auto-filled when writers rate an article. You can also drop manual notes here.

Supported file types: .txt .md .json .csv .html  (and .pdf / .docx if the optional extractors are installed)

Tip: smaller, focused files beat one giant dump. The generator caps total injected context.
`

async function extractFileText(fullPath) {
  const ext = path.extname(fullPath).toLowerCase()
  try {
    if (TEXT_EXTS.includes(ext)) {
      return await fsp.readFile(fullPath, 'utf8')
    }
    if (ext === '.pdf' && pdfParse) {
      const buf = await fsp.readFile(fullPath)
      const data = await pdfParse(buf)
      return data.text || ''
    }
    if ((ext === '.docx' || ext === '.doc') && mammoth) {
      const result = await mammoth.extractRawText({ path: fullPath })
      return result.value || ''
    }
  } catch (e) {
    return ''
  }
  return ''
}

function isSupported(filename) {
  const ext = path.extname(filename).toLowerCase()
  if (TEXT_EXTS.includes(ext)) return true
  if (ext === '.pdf' && pdfParse) return true
  if ((ext === '.docx' || ext === '.doc') && mammoth) return true
  return false
}

function relOf(base, full) {
  return path.relative(base, full).split(path.sep).join('/')
}

// Collect files in a category dir, descending ONE level into subfolders
// (so examples/blogs/* etc. are picked up). Returns newest-first.
function collectFiles(base, sub) {
  const root = path.join(base, sub)
  const out = []
  let entries = []
  try { entries = fs.readdirSync(root) } catch (e) { return out }
  for (const name of entries) {
    const full = path.join(root, name)
    let stat
    try { stat = fs.statSync(full) } catch (e) { continue }
    if (stat.isFile()) {
      out.push({ name, full, rel: relOf(base, full), modified: stat.mtimeMs, size: stat.size })
    } else if (stat.isDirectory()) {
      let sub2 = []
      try { sub2 = fs.readdirSync(full) } catch (e) { sub2 = [] }
      for (const n2 of sub2) {
        const f2 = path.join(full, n2)
        let s2
        try { s2 = fs.statSync(f2) } catch (e) { continue }
        if (s2.isFile()) out.push({ name: `${name}/${n2}`, full: f2, rel: relOf(base, f2), modified: s2.mtimeMs, size: s2.size })
      }
    }
  }
  return out.sort((a, b) => b.modified - a.modified)
}

async function getDisabledSet() {
  const store = await getStore()
  return new Set(store.get('disabledContextFiles', []))
}

async function listFiles() {
  const base = await ensureDirs()
  const disabled = await getDisabledSet()
  const out = { dataDir: base }
  for (const sub of SUBDIRS) {
    out[sub] = collectFiles(base, sub)
      .filter(f => f.name !== 'README.txt')
      .map(f => ({
        name: f.name,
        rel: f.rel,
        sizeKB: Math.max(1, Math.round(f.size / 1024)),
        modified: f.modified,
        supported: isSupported(f.name),
        active: !disabled.has(f.rel)
      }))
  }
  return out
}

async function toggleFile(rel, active) {
  const store = await getStore()
  const disabled = new Set(store.get('disabledContextFiles', []))
  if (active) disabled.delete(rel)
  else disabled.add(rel)
  store.set('disabledContextFiles', [...disabled])
}

async function deleteFile(rel) {
  const base = await getDataDir()
  const full = path.join(base, rel)
  if (!path.resolve(full).startsWith(path.resolve(base))) return { success: false, error: 'Invalid path' }
  try {
    await fsp.unlink(full)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

async function addTextFile(sub, name, content) {
  const base = await ensureDirs()
  const top = String(sub || 'context').split('/')[0]
  if (!SUBDIRS.includes(top)) sub = 'context'
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const finalName = path.extname(safeName) ? safeName : `${safeName}.md`
  const destDir = path.join(base, sub)
  await fsp.mkdir(destDir, { recursive: true })
  const full = path.join(destDir, finalName)
  await fsp.writeFile(full, content, 'utf8')
  return { success: true, rel: relOf(base, full) }
}

async function importFile(sub, sourcePath) {
  const base = await ensureDirs()
  const top = String(sub || 'context').split('/')[0]
  if (!SUBDIRS.includes(top)) sub = 'context'
  const name = path.basename(sourcePath)
  const destDir = path.join(base, sub)
  await fsp.mkdir(destDir, { recursive: true })
  const dest = path.join(destDir, name)
  await fsp.copyFile(sourcePath, dest)
  return { success: true, rel: relOf(base, dest) }
}

// Build the live context block injected into prompts
async function buildContextBlock() {
  const base = await ensureDirs()
  const disabled = await getDisabledSet()

  const knowledgeParts = []
  const exampleParts = []
  let knowledgeUsed = 0
  let exampleUsed = 0

  for (const sub of ['context', 'collaterals', 'specs', 'examples']) {
    const meta = INJECT[sub]
    const isExample = meta.group === 'examples'
    const cap = isExample ? EXAMPLE_CHAR_CAP : CONTEXT_CHAR_CAP
    for (const f of collectFiles(base, sub)) {
      if (f.name === 'README.txt' || disabled.has(f.rel)) continue
      const used = isExample ? exampleUsed : knowledgeUsed
      const remaining = cap - used
      if (remaining <= 200) break
      const text = (await extractFileText(f.full)).trim()
      if (!text) continue
      const slice = text.length > remaining ? text.slice(0, remaining) + '\n[...truncated]' : text
      const block = `--- ${meta.label}: ${f.name} ---\n${slice}`
      if (isExample) { exampleParts.push(block); exampleUsed += slice.length }
      else { knowledgeParts.push(block); knowledgeUsed += slice.length }
    }
  }

  // Feedback (flat)
  const fbParts = []
  let fbUsed = 0
  for (const f of collectFiles(base, 'feedback')) {
    if (disabled.has(f.rel)) continue
    let text = ''
    try { text = fs.readFileSync(f.full, 'utf8') } catch (e) { continue }
    text = text.trim()
    if (!text) continue
    const remaining = FEEDBACK_CHAR_CAP - fbUsed
    if (remaining <= 150) break
    const slice = text.length > remaining ? text.slice(0, remaining) : text
    fbParts.push(slice)
    fbUsed += slice.length
  }

  let block = ''
  const ctxText = [...knowledgeParts, ...exampleParts].join('\n\n')
  if (ctxText) {
    block += `\n\nMIS/WIS KNOWLEDGE BASE (loaded from the writer's context folders — treat as authoritative brand context, mirror this voice and these facts):\n${ctxText}`
  }
  if (fbParts.length) {
    block += `\n\nACCUMULATED EDITOR FEEDBACK (past corrections from human writers — apply these lessons, do NOT repeat past mistakes):\n${fbParts.join('\n---\n')}`
  }
  return block
}

async function saveFeedback(entry) {
  const base = await ensureDirs()
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const safeKw = (entry.keyword || 'article').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)
  const filename = `${ts}__${safeKw}.md`
  const full = path.join(base, 'feedback', filename)

  // Reward function: a normalised good/bad signal for future tuning.
  // Explicit entry.reward wins; otherwise derive from the 1-5 rating (1=-1, 3=0, 5=+1).
  const rating = Number(entry.rating) || 0
  const reward = (entry.reward !== undefined && entry.reward !== '' && entry.reward !== null)
    ? entry.reward
    : (rating ? +(((rating - 3) / 2).toFixed(2)) : '')

  const body = `# Feedback — ${entry.keyword || ''}
Date: ${new Date().toISOString()}
Kind: ${entry.kind || 'rating'}
Reward: ${reward}
Brand: ${entry.brand || ''}
Geo: ${entry.geo || ''}
Persona: ${entry.persona || ''}
Format: ${entry.format || ''}
Rating: ${entry.rating || ''} / 5

## What to fix / improve
${entry.notes || '(none)'}

## What worked well
${entry.worked || '(none)'}

## Article excerpt (first 800 chars)
${(entry.excerpt || '').slice(0, 800)}
`
  await fsp.writeFile(full, body, 'utf8')
  return { success: true, file: filename }
}

// Bundle every feedback .md into a single dated file at the data-folder root, so the
// writer has ONE file to send each week. Returns the filename to request.
async function exportWeeklyFeedback() {
  const base = await ensureDirs()
  const dir = path.join(base, 'feedback')
  let names = []
  try { names = fs.readdirSync(dir) } catch (e) { names = [] }
  const entries = names
    .filter(n => n.toLowerCase().endsWith('.md'))
    .map(n => ({ n, full: path.join(dir, n) }))
    .filter(e => { try { return fs.statSync(e.full).isFile() } catch { return false } })
    .sort((a, b) => fs.statSync(a.full).mtimeMs - fs.statSync(b.full).mtimeMs)

  const parts = []
  for (const { n, full } of entries) {
    try { parts.push(`\n\n===== ${n} =====\n${fs.readFileSync(full, 'utf8')}`) } catch (e) {}
  }
  const date = new Date().toISOString().slice(0, 10)
  const filename = `WEEKLY-EXPORT-${date}.md`
  const out = path.join(base, filename)
  const header = `# Weekly Feedback Export\nGenerated: ${new Date().toISOString()}\nAccount: (this machine)\nEntries: ${entries.length}\nData folder: ${base}\n`
  await fsp.writeFile(out, header + parts.join('\n'), 'utf8')
  return { success: true, file: filename, path: out, count: entries.length }
}

function extractorStatus() {
  return { pdf: !!pdfParse, docx: !!mammoth }
}

module.exports = {
  getDataDir,
  setDataDir,
  ensureDirs,
  listFiles,
  toggleFile,
  deleteFile,
  addTextFile,
  importFile,
  buildContextBlock,
  saveFeedback,
  exportWeeklyFeedback,
  extractorStatus,
  SUBDIRS,
  EXAMPLE_FORMATS
}
