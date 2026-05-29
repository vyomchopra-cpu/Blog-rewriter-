// Plain-Node port of the blog-data context/feedback layer for the local server.
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const store = require('./store')

let pdfParse = null, mammoth = null
try { pdfParse = require('pdf-parse') } catch (e) {}
try { mammoth = require('mammoth') } catch (e) {}

const SUBDIRS = ['context', 'examples', 'collaterals', 'specs', 'feedback']
const EXAMPLE_FORMATS = ['blogs', 'newsletters', 'one-pagers', 'definitive-guides', 'listicles', 'comparisons']
const TEXT_EXTS = ['.txt', '.md', '.markdown', '.json', '.csv', '.html', '.htm']
const INJECT = {
  context: { label: 'CONTEXT FILE', group: 'knowledge' },
  examples: { label: 'STYLE EXAMPLE', group: 'examples' },
  collaterals: { label: 'BRAND COLLATERAL', group: 'knowledge' },
  specs: { label: 'PRODUCT SPEC', group: 'knowledge' }
}
const CONTEXT_CHAR_CAP = 10000, EXAMPLE_CHAR_CAP = 6000, FEEDBACK_CHAR_CAP = 4000

function dataDir() { return store.getDataDir() }
function disabledSet() { return new Set(store.getState('disabledContextFiles', [])) }
function relOf(base, full) { return path.relative(base, full).split(path.sep).join('/') }

function ensureDirs() {
  const base = dataDir()
  fs.mkdirSync(base, { recursive: true })
  for (const s of SUBDIRS) fs.mkdirSync(path.join(base, s), { recursive: true })
  for (const f of EXAMPLE_FORMATS) fs.mkdirSync(path.join(base, 'examples', f), { recursive: true })
  return base
}

function collectFiles(base, sub) {
  const root = path.join(base, sub), out = []
  let entries = []
  try { entries = fs.readdirSync(root) } catch (e) { return out }
  for (const name of entries) {
    const full = path.join(root, name)
    let st; try { st = fs.statSync(full) } catch (e) { continue }
    if (st.isFile()) out.push({ name, full, rel: relOf(base, full), modified: st.mtimeMs, size: st.size })
    else if (st.isDirectory()) {
      let sub2 = []; try { sub2 = fs.readdirSync(full) } catch (e) {}
      for (const n2 of sub2) {
        const f2 = path.join(full, n2)
        let s2; try { s2 = fs.statSync(f2) } catch (e) { continue }
        if (s2.isFile()) out.push({ name: `${name}/${n2}`, full: f2, rel: relOf(base, f2), modified: s2.mtimeMs, size: s2.size })
      }
    }
  }
  return out.sort((a, b) => b.modified - a.modified)
}

function isSupported(fn) {
  const e = path.extname(fn).toLowerCase()
  return TEXT_EXTS.includes(e) || (e === '.pdf' && pdfParse) || ((e === '.docx' || e === '.doc') && mammoth)
}

async function extractFileText(full) {
  const e = path.extname(full).toLowerCase()
  try {
    if (TEXT_EXTS.includes(e)) return await fsp.readFile(full, 'utf8')
    if (e === '.pdf' && pdfParse) return (await pdfParse(await fsp.readFile(full))).text || ''
    if ((e === '.docx' || e === '.doc') && mammoth) return (await mammoth.extractRawText({ path: full })).value || ''
  } catch (er) { return '' }
  return ''
}

async function listFiles() {
  const base = ensureDirs(), disabled = disabledSet(), out = { dataDir: base }
  for (const sub of SUBDIRS) {
    out[sub] = collectFiles(base, sub).filter(f => f.name !== 'README.txt').map(f => ({
      name: f.name, rel: f.rel, sizeKB: Math.max(1, Math.round(f.size / 1024)),
      modified: f.modified, supported: isSupported(f.name), active: !disabled.has(f.rel)
    }))
  }
  return out
}

function toggleFile(rel, active) {
  const set = disabledSet()
  if (active) set.delete(rel); else set.add(rel)
  store.setState('disabledContextFiles', [...set])
  return { success: true }
}

async function deleteFile(rel) {
  const base = dataDir(), full = path.join(base, rel)
  if (!path.resolve(full).startsWith(path.resolve(base))) return { success: false, error: 'Invalid path' }
  try { await fsp.unlink(full); return { success: true } } catch (e) { return { success: false, error: e.message } }
}

async function addTextFile(sub, name, content) {
  const base = ensureDirs()
  const top = String(sub || 'context').split('/')[0]
  if (!SUBDIRS.includes(top)) sub = 'context'
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fn = path.extname(safe) ? safe : `${safe}.md`
  const dir = path.join(base, sub); fs.mkdirSync(dir, { recursive: true })
  const full = path.join(dir, fn)
  await fsp.writeFile(full, content, 'utf8')
  return { success: true, rel: relOf(base, full) }
}

async function buildContextBlock() {
  const base = ensureDirs(), disabled = disabledSet()
  const knowledge = [], examples = []
  let kUsed = 0, eUsed = 0
  for (const sub of ['context', 'collaterals', 'specs', 'examples']) {
    const meta = INJECT[sub], isEx = meta.group === 'examples', cap = isEx ? EXAMPLE_CHAR_CAP : CONTEXT_CHAR_CAP
    for (const f of collectFiles(base, sub)) {
      if (f.name === 'README.txt' || disabled.has(f.rel)) continue
      const used = isEx ? eUsed : kUsed, rem = cap - used
      if (rem <= 200) break
      const text = (await extractFileText(f.full)).trim()
      if (!text) continue
      const slice = text.length > rem ? text.slice(0, rem) + '\n[...truncated]' : text
      const block = `--- ${meta.label}: ${f.name} ---\n${slice}`
      if (isEx) { examples.push(block); eUsed += slice.length } else { knowledge.push(block); kUsed += slice.length }
    }
  }
  const fb = []; let fbUsed = 0
  for (const f of collectFiles(base, 'feedback')) {
    if (disabled.has(f.rel)) continue
    let t = ''; try { t = fs.readFileSync(f.full, 'utf8') } catch (e) { continue }
    t = t.trim(); if (!t) continue
    const rem = FEEDBACK_CHAR_CAP - fbUsed; if (rem <= 150) break
    fb.push(t.length > rem ? t.slice(0, rem) : t); fbUsed += Math.min(t.length, rem)
  }
  let block = ''
  const ctx = [...knowledge, ...examples].join('\n\n')
  if (ctx) block += `\n\nMIS/WIS KNOWLEDGE BASE (authoritative brand context, mirror this voice and these facts):\n${ctx}`
  if (fb.length) block += `\n\nACCUMULATED EDITOR FEEDBACK (apply these lessons, do NOT repeat past mistakes):\n${fb.join('\n---\n')}`
  return block
}

async function saveFeedback(entry) {
  const base = ensureDirs()
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const safeKw = (entry.keyword || 'article').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)
  const full = path.join(base, 'feedback', `${ts}__${safeKw}.md`)
  const rating = Number(entry.rating) || 0
  const reward = (entry.reward !== undefined && entry.reward !== '' && entry.reward !== null) ? entry.reward : (rating ? +(((rating - 3) / 2).toFixed(2)) : '')
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
  return { success: true, file: path.basename(full) }
}

async function exportWeeklyFeedback() {
  const base = ensureDirs(), dir = path.join(base, 'feedback')
  let names = []; try { names = fs.readdirSync(dir) } catch (e) {}
  const entries = names.filter(n => n.toLowerCase().endsWith('.md'))
    .map(n => ({ n, full: path.join(dir, n) }))
    .filter(e => { try { return fs.statSync(e.full).isFile() } catch { return false } })
    .sort((a, b) => fs.statSync(a.full).mtimeMs - fs.statSync(b.full).mtimeMs)
  const parts = []
  for (const { n, full } of entries) { try { parts.push(`\n\n===== ${n} =====\n${fs.readFileSync(full, 'utf8')}`) } catch (e) {} }
  const filename = `WEEKLY-EXPORT-${new Date().toISOString().slice(0, 10)}.md`
  const out = path.join(base, filename)
  await fsp.writeFile(out, `# Weekly Feedback Export\nGenerated: ${new Date().toISOString()}\nEntries: ${entries.length}\nData folder: ${base}\n` + parts.join('\n'), 'utf8')
  return { success: true, file: filename, path: out, count: entries.length }
}

function extractorStatus() { return { pdf: !!pdfParse, docx: !!mammoth } }

module.exports = { ensureDirs, listFiles, toggleFile, deleteFile, addTextFile, buildContextBlock, saveFeedback, exportWeeklyFeedback, extractorStatus, getDataDir: dataDir }
