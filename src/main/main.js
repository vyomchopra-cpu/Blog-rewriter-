const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

const api = require('./api')
const wp = require('./wordpress')
const context = require('./context')
const { getConfig, saveConfig, getApiCredentials, getState, setState, bumpUsage } = require('./store')

// Build the generation options (live context folder + output controls)
async function buildGenOpts(creds) {
  let extraContext = ''
  if (creds.useContextFolder) {
    try { extraContext = await context.buildContextBlock() } catch (e) { extraContext = '' }
  }
  return {
    extraContext,
    customInstructions: creds.customInstructions || '',
    readingLevel: creds.readingLevel || '',
    tone: creds.tone || '',
    temperature: typeof creds.temperature === 'number' ? creds.temperature : 1,
    maxTokens: creds.maxTokens || 8000
  }
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'Blog Generator'
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  context.ensureDirs().catch(() => {})
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC Handlers ───────────────────────────────────────────────────────────

ipcMain.handle('get-config', async () => {
  return await getConfig()
})

ipcMain.handle('save-config', async (_, config) => {
  await saveConfig(config)
  return { success: true }
})

ipcMain.handle('test-api', async () => {
  const creds = await getApiCredentials()
  if (!creds.anthropicApiKey) return { success: false, message: 'No API key configured' }
  return await api.testApiKey(creds.anthropicApiKey, creds.model)
})

ipcMain.handle('test-wp', async () => {
  const creds = await getApiCredentials()
  if (!creds.wpSiteUrl || !creds.wpUsername || !creds.wpAppPassword) {
    return { success: false, error: 'WordPress not fully configured' }
  }
  return await wp.testConnection(creds.wpSiteUrl, creds.wpUsername, creds.wpAppPassword)
})

ipcMain.handle('generate-outline', async (_, inputs) => {
  const creds = await getApiCredentials()
  if (!creds.anthropicApiKey) throw new Error('No API key configured. Go to Settings.')
  const opts = await buildGenOpts(creds)
  if (inputs && inputs.styleInstructions) {
    opts.customInstructions = [opts.customInstructions, `WRITING STYLE: ${inputs.styleInstructions}`].filter(Boolean).join('\n\n')
  }
  await bumpUsage({ type: 'outline', account: creds.accountId })
  return await api.generateOutline(creds.anthropicApiKey, creds.fastModel || creds.model, inputs, opts)
})

ipcMain.handle('generate-draft', async (_, { inputs, outlineJSON, researchJSON }) => {
  const creds = await getApiCredentials()
  if (!creds.anthropicApiKey) throw new Error('No API key configured. Go to Settings.')
  const opts = await buildGenOpts(creds)
  if (inputs && inputs.styleInstructions) {
    opts.customInstructions = [opts.customInstructions, `WRITING STYLE: ${inputs.styleInstructions}`].filter(Boolean).join('\n\n')
  }
  await bumpUsage({ type: 'draft', account: creds.accountId })
  return await api.generateDraft(creds.anthropicApiKey, creds.model, inputs, outlineJSON, researchJSON, opts)
})

ipcMain.handle('humanize-draft', async (_, { draftHTML, keyword, brand }) => {
  const creds = await getApiCredentials()
  if (!creds.anthropicApiKey) throw new Error('No API key configured. Go to Settings.')
  const opts = await buildGenOpts(creds)
  await bumpUsage({ type: 'humanize', account: creds.accountId })
  return await api.humanizeDraft(creds.anthropicApiKey, creds.model, draftHTML, keyword, brand, opts)
})

// Whether the humanization pass should run (renderer reads this to skip the call)
ipcMain.handle('should-humanize', async () => {
  const creds = await getApiCredentials()
  return creds.runHumanization !== false
})

ipcMain.handle('generate-metadata', async (_, { inputs, finalHTML }) => {
  const creds = await getApiCredentials()
  if (!creds.anthropicApiKey) throw new Error('No API key configured. Go to Settings.')
  await bumpUsage({ type: 'metadata', account: creds.accountId })
  return await api.generateMetadata(creds.anthropicApiKey, creds.fastModel || creds.model, inputs, finalHTML)
})

ipcMain.handle('replace-links', async (_, { html, brand }) => {
  return api.replaceInternalLinks(html, brand)
})

ipcMain.handle('generate-schema', async (_, { metadata, keyword, brand }) => {
  return api.generateSchema(metadata, keyword, brand)
})

ipcMain.handle('count-links', async (_, { html }) => {
  return {
    count: api.countInternalLinks(html),
    links: api.extractInternalLinks(html)
  }
})

ipcMain.handle('count-words', async (_, { html }) => {
  return api.countWords(html)
})

ipcMain.handle('push-to-wp', async (_, { articleData }) => {
  const creds = await getApiCredentials()
  if (!creds.wpSiteUrl || !creds.wpUsername || !creds.wpAppPassword) {
    return { success: false, error: 'WordPress not configured. Go to Settings.' }
  }
  const settings = {
    seoPlugin: creds.seoPlugin,
    misCategory: creds.misCategoryId,
    wisCategory: creds.wisCategoryId
  }
  return await wp.createDraft(creds.wpSiteUrl, creds.wpUsername, creds.wpAppPassword, articleData, settings)
})

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url)
})

// ─── Quality: lint (free) + score (1 API call) ───────────────────────────────
ipcMain.handle('lint-article', async (_, { html, keyword }) => {
  return api.lintArticle(html, keyword)
})

ipcMain.handle('score-article', async (_, { html, inputs }) => {
  const creds = await getApiCredentials()
  if (!creds.anthropicApiKey) throw new Error('No API key configured. Go to Settings.')
  await bumpUsage({ type: 'score', account: creds.accountId })
  return await api.scoreArticle(creds.anthropicApiKey, creds.fastModel || creds.model, html, inputs)
})

// ─── Context & feedback folder ────────────────────────────────────────────────
ipcMain.handle('context-list', async () => {
  return await context.listFiles()
})

ipcMain.handle('context-status', async () => {
  const dir = await context.getDataDir()
  return { dataDir: dir, extractors: context.extractorStatus() }
})

ipcMain.handle('context-add-text', async (_, { sub, name, content }) => {
  return await context.addTextFile(sub, name, content)
})

ipcMain.handle('context-toggle', async (_, { rel, active }) => {
  await context.toggleFile(rel, active)
  return { success: true }
})

ipcMain.handle('context-delete', async (_, { rel }) => {
  return await context.deleteFile(rel)
})

ipcMain.handle('context-open-folder', async () => {
  const dir = await context.getDataDir()
  await context.ensureDirs()
  await shell.openPath(dir)
  return { success: true, dir }
})

ipcMain.handle('context-set-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose shared data folder',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || !result.filePaths[0]) return { canceled: true }
  await context.setDataDir(result.filePaths[0])
  return { success: true, dir: result.filePaths[0] }
})

ipcMain.handle('context-import-files', async (_, { sub }) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import files into ' + sub,
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Documents', extensions: ['txt', 'md', 'json', 'csv', 'html', 'pdf', 'docx'] }]
  })
  if (result.canceled) return { canceled: true }
  const imported = []
  for (const p of result.filePaths) {
    try { imported.push(await context.importFile(sub, p)) } catch (e) {}
  }
  return { success: true, imported }
})

ipcMain.handle('save-feedback', async (_, { entry }) => {
  return await context.saveFeedback(entry)
})

// ─── Generic state store (nascent feature data: recents, workflow, custom...) ──
ipcMain.handle('state-get', async (_, { key, def }) => {
  return await getState(key, def === undefined ? null : def)
})

ipcMain.handle('state-set', async (_, { key, value }) => {
  return await setState(key, value)
})

// Push one finished article onto the Recents list (most-recent first, cap 100).
ipcMain.handle('recent-add', async (_, { entry }) => {
  const list = await getState('recents', [])
  const item = { id: Date.now().toString(36), at: new Date().toISOString(), ...entry }
  const next = [item, ...(Array.isArray(list) ? list : [])].slice(0, 100)
  await setState('recents', next)
  return { success: true, item }
})

// ─── Usage / credit tracking ──────────────────────────────────────────────────
ipcMain.handle('usage-get', async () => {
  const usage = await getState('usage', { totalCalls: 0, byType: {}, byDay: {}, lastCall: null })
  return usage
})

ipcMain.handle('usage-reset', async () => {
  await setState('usage', { totalCalls: 0, byType: {}, byDay: {}, lastCall: null })
  return { success: true }
})

// ─── Inline highlight-edit: rewrite a selected snippet ────────────────────────
ipcMain.handle('rewrite-snippet', async (_, { snippet, instruction, keyword, brand }) => {
  const creds = await getApiCredentials()
  if (!creds.anthropicApiKey) throw new Error('No API key configured. Go to Settings.')
  await bumpUsage({ type: 'rewrite', account: creds.accountId })
  const replacement = await api.rewriteSnippet(creds.anthropicApiKey, creds.model, snippet, instruction)
  // Log the rewrite as a training signal: original was sub-par (reward -1), the
  // human-approved direction is captured for the weekly tuning pull.
  try {
    await context.saveFeedback({
      keyword: `[REWRITE] ${keyword || ''}`, brand: brand || '', kind: 'rewrite', reward: -1,
      notes: `Writer rewrote a passage.\nInstruction: ${instruction || '(none)'}\n\nBEFORE:\n${snippet}\n\nAFTER:\n${replacement}`
    })
  } catch (e) {}
  return replacement
})

// Bundle all feedback into one dated file and reveal it for the weekly send.
ipcMain.handle('feedback-export', async () => {
  const res = await context.exportWeeklyFeedback()
  try { if (res?.path) shell.showItemInFolder(res.path) } catch (e) {}
  return res
})

// ─── GEO Hacker: generate AI-visibility collateral ────────────────────────────
ipcMain.handle('geo-generate', async (_, opts) => {
  const creds = await getApiCredentials()
  if (!creds.anthropicApiKey) throw new Error('No API key configured. Go to Settings.')
  let extraContext = ''
  if (creds.useContextFolder) {
    try { extraContext = await context.buildContextBlock() } catch (e) { extraContext = '' }
  }
  await bumpUsage({ type: 'geo', account: creds.accountId })
  return await api.generateGeoCollateral(creds.anthropicApiKey, creds.fastModel || creds.model, { ...opts, extraContext })
})
