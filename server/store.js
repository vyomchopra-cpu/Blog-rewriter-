// Plain-Node store for the local web-server version (no Electron, no keytar).
// Everything persists to <dataDir>/app-config.json. Feedback/context files live
// in the same dataDir. Key is seeded from env or src/main/bundled-config.json.
const fs = require('fs')
const path = require('path')

const DATA_DIR = process.env.BLOG_DATA_DIR || path.join(process.cwd(), 'blog-data')
const CONFIG_FILE = path.join(DATA_DIR, 'app-config.json')

const DEFAULTS = {
  anthropicApiKey: '', model: 'claude-sonnet-4-5-20250929', fastModel: 'claude-haiku-4-5-20251001',
  wpSiteUrl: '', wpUsername: '', wpAppPassword: '', seoPlugin: 'yoast', misCategoryId: '', wisCategoryId: '',
  presets: [], temperature: 1, maxTokens: 8000, runHumanization: true, customInstructions: '',
  readingLevel: '', tone: '', useContextFolder: true,
  currentRole: 'admin', accountId: '', accountName: '', lengthTier: 'large', dataDir: '',
  recents: [], workflowItems: [], customKeywords: [], customPersonas: [], customStyles: [],
  disabledContextFiles: [], usage: { totalCalls: 0, byType: {}, byDay: {}, lastCall: null }
}

let _d = null
function load() {
  if (_d) return _d
  try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch (e) {}
  let saved = {}
  try { saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) } catch (e) {}
  _d = { ...DEFAULTS, ...saved }
  seed()
  return _d
}
function persist() { try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(_d, null, 2)) } catch (e) {} }

function seed() {
  // env wins
  if (process.env.ANTHROPIC_API_KEY && !_d.anthropicApiKey) _d.anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const candidates = [
    path.join(__dirname, '..', 'src', 'main', 'bundled-config.json'),
    path.join(__dirname, 'bundled-config.json'),
    path.join(process.cwd(), 'bundled-config.json')
  ]
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue
      const cfg = JSON.parse(fs.readFileSync(p, 'utf8'))
      ;['anthropicApiKey', 'model', 'fastModel', 'wpSiteUrl', 'wpUsername', 'currentRole', 'accountName', 'dataDir'].forEach(k => { if (cfg[k] && !_d[k]) _d[k] = cfg[k] })
      if (cfg.wpAppPassword && !_d.wpAppPassword) _d.wpAppPassword = cfg.wpAppPassword
      break
    } catch (e) {}
  }
}

function getDataDir() { const d = load(); return d.dataDir || DATA_DIR }

function getConfig() {
  const d = load()
  const pwd = d.wpAppPassword
  return { ...d, anthropicApiKey: d.anthropicApiKey, wpAppPassword: pwd ? '••••••••' : '', wpAppPasswordSet: !!pwd }
}

function saveConfig(cfg = {}) {
  const d = load()
  for (const [k, v] of Object.entries(cfg)) {
    if (v === undefined) continue
    if (k === 'wpAppPassword' && typeof v === 'string' && v.includes('•')) continue
    d[k] = v
  }
  persist()
  return { success: true }
}

function getApiCredentials() { return { ...load() } }
function getState(key, def = null) { const d = load(); return (d[key] !== undefined ? d[key] : def) }
function setState(key, value) { const d = load(); d[key] = value; persist(); return { success: true } }

function bumpUsage(meta = {}) {
  const d = load()
  const u = d.usage || (d.usage = { totalCalls: 0, byType: {}, byDay: {}, lastCall: null })
  const type = meta.type || 'other'
  const day = new Date().toISOString().slice(0, 10)
  u.totalCalls = (u.totalCalls || 0) + 1
  u.byType[type] = (u.byType[type] || 0) + 1
  u.byDay[day] = (u.byDay[day] || 0) + 1
  u.lastCall = new Date().toISOString()
  persist()
  return u
}

module.exports = { getConfig, saveConfig, getApiCredentials, getState, setState, bumpUsage, getDataDir, DATA_DIR }
