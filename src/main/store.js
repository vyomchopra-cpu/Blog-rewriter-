const fs = require('fs')
const path = require('path')

let _store = null

const SONNET = 'claude-sonnet-4-5-20251001'
const HAIKU = 'claude-haiku-4-5-20251001'
const OPUS = 'claude-opus-4-5-20251101'

// Seed config from a bundled file (src/main/bundled-config.json) the first time,
// so all writers can ship with ONE shared API key / shared data folder and zero
// setup. The file is gitignored but IS packaged into the app. Only fills blanks.
function seedFromBundled(store) {
  try {
    const p = path.join(__dirname, 'bundled-config.json')
    if (!fs.existsSync(p)) return
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'))
    const fill = (k) => { if (cfg[k] !== undefined && cfg[k] !== '' && !store.get(k)) store.set(k, cfg[k]) }
    ;['anthropicApiKey', 'model', 'fastModel', 'wpSiteUrl', 'wpUsername', 'dataDir', 'currentRole', 'accountName'].forEach(fill)
    if (cfg.wpAppPassword && !store.get('wpAppPasswordFallback')) store.set('wpAppPasswordFallback', cfg.wpAppPassword)
  } catch (e) {}
}

async function getStore() {
  if (_store) return _store
  const { default: Store } = await import('electron-store')
  _store = new Store({
    defaults: {
      anthropicApiKey: '',
      model: 'claude-sonnet-4-5-20251001',
      fastModel: '',
      wpSiteUrl: '',
      wpUsername: '',
      seoPlugin: 'yoast',
      misCategoryId: '',
      wisCategoryId: '',
      presets: [],
      // Output controls
      temperature: 1,
      maxTokens: 8000,
      runHumanization: true,
      customInstructions: '',
      readingLevel: '',
      tone: '',
      useContextFolder: true,
      // Collaboration / role (nascent local sim until online backend)
      currentRole: 'admin',      // admin | writer | spectator
      accountId: '',
      accountName: '',
      lengthTier: 'large',       // small | medium | large | xlarge | custom
      // Nascent feature state (arrays/objects) — accessed via getState/setState
      recents: [],
      workflowItems: [],
      customPersonas: [],
      customKeywords: [],
      customStyles: [],
      usage: { totalCalls: 0, byType: {}, byDay: {}, lastCall: null }
    }
  })
  seedFromBundled(_store)
  // Opus is disabled for cost — migrate any existing install off it onto Sonnet.
  if (_store.get('model') === OPUS) _store.set('model', SONNET)
  if (_store.get('fastModel') === OPUS) _store.set('fastModel', '')
  return _store
}

let keytar = null
try {
  keytar = require('keytar')
} catch (e) {
  keytar = null
}

const KEYCHAIN_SERVICE = 'blog-generator-wp'
const KEYCHAIN_ACCOUNT = 'wp-app-password'

async function getWpPassword(store) {
  if (keytar) {
    try {
      return await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT) || ''
    } catch (e) {}
  }
  return store.get('wpAppPasswordFallback', '')
}

async function setWpPassword(store, password) {
  if (keytar) {
    try {
      await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, password)
      return
    } catch (e) {}
  }
  store.set('wpAppPasswordFallback', password)
}

async function getConfig() {
  const store = await getStore()
  const wpPwd = await getWpPassword(store)
  return {
    anthropicApiKey: store.get('anthropicApiKey', ''),
    model: store.get('model', 'claude-sonnet-4-5-20251001'),
    fastModel: store.get('fastModel', ''),
    wpSiteUrl: store.get('wpSiteUrl', ''),
    wpUsername: store.get('wpUsername', ''),
    wpAppPassword: wpPwd ? '••••••••' : '',
    wpAppPasswordSet: !!wpPwd,
    seoPlugin: store.get('seoPlugin', 'yoast'),
    misCategoryId: store.get('misCategoryId', ''),
    wisCategoryId: store.get('wisCategoryId', ''),
    presets: store.get('presets', []),
    temperature: store.get('temperature', 1),
    maxTokens: store.get('maxTokens', 8000),
    runHumanization: store.get('runHumanization', true),
    customInstructions: store.get('customInstructions', ''),
    readingLevel: store.get('readingLevel', ''),
    tone: store.get('tone', ''),
    useContextFolder: store.get('useContextFolder', true),
    currentRole: store.get('currentRole', 'admin'),
    accountId: store.get('accountId', ''),
    accountName: store.get('accountName', ''),
    lengthTier: store.get('lengthTier', 'large')
  }
}

async function saveConfig(config) {
  const store = await getStore()
  if (config.anthropicApiKey !== undefined) store.set('anthropicApiKey', config.anthropicApiKey)
  if (config.model !== undefined) store.set('model', config.model === OPUS ? SONNET : config.model)
  if (config.fastModel !== undefined) store.set('fastModel', config.fastModel === OPUS ? '' : config.fastModel)
  if (config.wpSiteUrl !== undefined) store.set('wpSiteUrl', config.wpSiteUrl)
  if (config.wpUsername !== undefined) store.set('wpUsername', config.wpUsername)
  if (config.wpAppPassword !== undefined && !config.wpAppPassword.includes('•')) {
    await setWpPassword(store, config.wpAppPassword)
  }
  if (config.seoPlugin !== undefined) store.set('seoPlugin', config.seoPlugin)
  if (config.misCategoryId !== undefined) store.set('misCategoryId', config.misCategoryId)
  if (config.wisCategoryId !== undefined) store.set('wisCategoryId', config.wisCategoryId)
  if (config.presets !== undefined) store.set('presets', config.presets)
  if (config.temperature !== undefined) store.set('temperature', config.temperature)
  if (config.maxTokens !== undefined) store.set('maxTokens', config.maxTokens)
  if (config.runHumanization !== undefined) store.set('runHumanization', config.runHumanization)
  if (config.customInstructions !== undefined) store.set('customInstructions', config.customInstructions)
  if (config.readingLevel !== undefined) store.set('readingLevel', config.readingLevel)
  if (config.tone !== undefined) store.set('tone', config.tone)
  if (config.useContextFolder !== undefined) store.set('useContextFolder', config.useContextFolder)
  if (config.currentRole !== undefined) store.set('currentRole', config.currentRole)
  if (config.accountId !== undefined) store.set('accountId', config.accountId)
  if (config.accountName !== undefined) store.set('accountName', config.accountName)
  if (config.lengthTier !== undefined) store.set('lengthTier', config.lengthTier)
}

// ─── Generic state store for nascent feature data (recents, workflow, etc.) ───
async function getState(key, def = null) {
  const store = await getStore()
  return store.get(key, def)
}

async function setState(key, value) {
  const store = await getStore()
  store.set(key, value)
  return { success: true }
}

// Increment usage counters. Called by each IPC handler that hits the Claude API.
async function bumpUsage(meta = {}) {
  const store = await getStore()
  const usage = store.get('usage', { totalCalls: 0, byType: {}, byDay: {}, lastCall: null })
  const type = meta.type || 'other'
  const day = new Date().toISOString().slice(0, 10)
  usage.totalCalls = (usage.totalCalls || 0) + 1
  usage.byType[type] = (usage.byType[type] || 0) + 1
  usage.byDay[day] = (usage.byDay[day] || 0) + 1
  usage.lastCall = new Date().toISOString()
  if (meta.account) {
    usage.byAccount = usage.byAccount || {}
    usage.byAccount[meta.account] = (usage.byAccount[meta.account] || 0) + 1
  }
  store.set('usage', usage)
  return usage
}

async function getApiCredentials() {
  const store = await getStore()
  const wpPwd = await getWpPassword(store)
  return {
    anthropicApiKey: store.get('anthropicApiKey', ''),
    model: store.get('model', 'claude-sonnet-4-5-20251001'),
    fastModel: store.get('fastModel', ''),
    wpSiteUrl: store.get('wpSiteUrl', ''),
    wpUsername: store.get('wpUsername', ''),
    wpAppPassword: wpPwd,
    seoPlugin: store.get('seoPlugin', 'yoast'),
    misCategoryId: store.get('misCategoryId', ''),
    wisCategoryId: store.get('wisCategoryId', ''),
    temperature: store.get('temperature', 1),
    maxTokens: store.get('maxTokens', 8000),
    runHumanization: store.get('runHumanization', true),
    customInstructions: store.get('customInstructions', ''),
    readingLevel: store.get('readingLevel', ''),
    tone: store.get('tone', ''),
    useContextFolder: store.get('useContextFolder', true),
    currentRole: store.get('currentRole', 'admin'),
    accountId: store.get('accountId', ''),
    lengthTier: store.get('lengthTier', 'large')
  }
}

module.exports = { getConfig, saveConfig, getApiCredentials, getState, setState, bumpUsage }
