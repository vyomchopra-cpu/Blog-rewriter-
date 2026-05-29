import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
      <h2 className="text-base font-semibold text-[#f5f5f5]">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, note, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#d1d5db]">{label}</label>
      {note && <p className="text-xs text-[#6b7280]">{note}</p>}
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#4b5563] focus:outline-none focus:border-[#4b5563] transition-colors'

export default function Settings({ config, setConfig, accentColor }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    anthropicApiKey: config?.anthropicApiKey || '',
    model: config?.model || 'claude-sonnet-4-5-20250929',
    fastModel: config?.fastModel || '',
    wpSiteUrl: config?.wpSiteUrl || '',
    wpUsername: config?.wpUsername || '',
    wpAppPassword: '',
    seoPlugin: config?.seoPlugin || 'yoast',
    misCategoryId: config?.misCategoryId || '',
    wisCategoryId: config?.wisCategoryId || '',
    temperature: config?.temperature ?? 1,
    maxTokens: config?.maxTokens ?? 8000,
    runHumanization: config?.runHumanization ?? true,
    customInstructions: config?.customInstructions || '',
    readingLevel: config?.readingLevel || '',
    tone: config?.tone || '',
    useContextFolder: config?.useContextFolder ?? true
  })
  const [status, setStatus] = useState({})
  const [presets, setPresets] = useState(config?.presets || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function saveAll() {
    setSaving(true)
    try {
      await window.electron.invoke('save-config', { ...form, presets })
      const newCfg = await window.electron.invoke('get-config')
      setConfig(newCfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function testApi() {
    setStatus(s => ({ ...s, api: { loading: true } }))
    await window.electron.invoke('save-config', { anthropicApiKey: form.anthropicApiKey, model: form.model })
    const res = await window.electron.invoke('test-api')
    setStatus(s => ({ ...s, api: res }))
  }

  async function testWp() {
    setStatus(s => ({ ...s, wp: { loading: true } }))
    await window.electron.invoke('save-config', {
      wpSiteUrl: form.wpSiteUrl,
      wpUsername: form.wpUsername,
      wpAppPassword: form.wpAppPassword || undefined
    })
    const res = await window.electron.invoke('test-wp')
    setStatus(s => ({ ...s, wp: res }))
  }

  function deletePreset(idx) {
    setPresets(p => p.filter((_, i) => i !== idx))
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#f5f5f5]">Settings</h1>
          <p className="text-sm text-[#9ca3af] mt-1">Configure your API keys and WordPress connection.</p>
        </div>

        {/* Anthropic API */}
        <Section title="Anthropic API">
          <Field label="API Key">
            <input
              type="password"
              className={inputCls}
              placeholder="sk-ant-..."
              value={form.anthropicApiKey}
              onChange={e => set('anthropicApiKey', e.target.value)}
            />
          </Field>
          <Field label="Main model" note="Used for the draft + humanization (the quality-critical passes). Opus is disabled to control cost.">
            <select
              className={inputCls}
              value={form.model}
              onChange={e => set('model', e.target.value)}
            >
              <option value="claude-sonnet-4-5-20250929">Sonnet 4.5 — recommended (good quality, ~5× cheaper than Opus)</option>
              <option value="claude-haiku-4-5-20251001">Haiku 4.5 — cheapest (test quality before relying on it)</option>
            </select>
          </Field>
          <Field label="Fast model (research, outline, metadata, scoring)" note="Cheaper steps can run on a smaller model to cut cost. Leave on “Same as main” if unsure.">
            <select
              className={inputCls}
              value={form.fastModel}
              onChange={e => set('fastModel', e.target.value)}
            >
              <option value="">Same as main model</option>
              <option value="claude-haiku-4-5-20251001">Haiku 4.5 — cheapest (recommended for these steps)</option>
              <option value="claude-sonnet-4-5-20250929">Sonnet 4.5</option>
            </select>
          </Field>
          <div className="flex items-center gap-3">
            <button
              onClick={testApi}
              disabled={!form.anthropicApiKey || status.api?.loading}
              className="px-4 py-2 text-sm rounded-lg border border-[#2a2a2a] text-[#d1d5db] hover:bg-[#2a2a2a] disabled:opacity-40 transition-colors"
            >
              {status.api?.loading ? 'Testing...' : 'Test API Key'}
            </button>
            {status.api && !status.api.loading && (
              <span className={`text-xs font-medium ${status.api.success ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {status.api.success ? '✓ Connected' : `✗ ${status.api.message}`}
              </span>
            )}
          </div>
        </Section>

        {/* WordPress */}
        <Section title="WordPress">
          <Field label="Site URL">
            <input
              type="text"
              className={inputCls}
              placeholder="https://moveinsync.com"
              value={form.wpSiteUrl}
              onChange={e => set('wpSiteUrl', e.target.value)}
            />
          </Field>
          <Field label="Username">
            <input
              type="text"
              className={inputCls}
              placeholder="admin"
              value={form.wpUsername}
              onChange={e => set('wpUsername', e.target.value)}
            />
          </Field>
          <Field
            label="Application Password"
            note="Generate in WordPress › Users › Your Profile › Application Passwords. Stored locally on this machine."
          >
            <input
              type="password"
              className={inputCls}
              placeholder={config?.wpAppPasswordSet ? '•••••••• (already saved)' : 'xxxx xxxx xxxx xxxx'}
              value={form.wpAppPassword}
              onChange={e => set('wpAppPassword', e.target.value)}
            />
          </Field>
          <div className="flex items-center gap-3">
            <button
              onClick={testWp}
              disabled={!form.wpSiteUrl || !form.wpUsername || status.wp?.loading}
              className="px-4 py-2 text-sm rounded-lg border border-[#2a2a2a] text-[#d1d5db] hover:bg-[#2a2a2a] disabled:opacity-40 transition-colors"
            >
              {status.wp?.loading ? 'Testing...' : 'Test Connection'}
            </button>
            {status.wp && !status.wp.loading && (
              <span className={`text-xs font-medium ${status.wp.success ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {status.wp.success ? `✓ Connected as ${status.wp.userName}` : `✗ ${status.wp.error}`}
              </span>
            )}
          </div>
        </Section>

        {/* WordPress Mapping */}
        <Section title="WordPress Mapping">
          <Field label="SEO Plugin">
            <div className="flex gap-2">
              {['yoast', 'rankmath', 'none'].map(p => (
                <button
                  key={p}
                  onClick={() => set('seoPlugin', p)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    form.seoPlugin === p
                      ? 'border-transparent text-white'
                      : 'border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5]'
                  }`}
                  style={form.seoPlugin === p ? { background: accentColor } : {}}
                >
                  {p === 'yoast' ? 'Yoast SEO' : p === 'rankmath' ? 'RankMath' : 'None'}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="MIS Blog Category ID" note="WordPress › Posts › Categories">
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 5"
                value={form.misCategoryId}
                onChange={e => set('misCategoryId', e.target.value)}
              />
            </Field>
            <Field label="WIS Blog Category ID">
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 8"
                value={form.wisCategoryId}
                onChange={e => set('wisCategoryId', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Output Controls */}
        <Section title="Output Controls">
          <Field label="Humanization Pass" note="Pass 3 rewrites for human-like cadence and strips AI-tells. Turn off for faster/cheaper drafts.">
            <button
              onClick={() => set('runHumanization', !form.runHumanization)}
              className={`w-12 h-6 rounded-full relative transition-colors ${form.runHumanization ? '' : 'bg-[#2a2a2a]'}`}
              style={form.runHumanization ? { background: accentColor } : {}}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.runHumanization ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </Field>

          <Field label="Use Context & Feedback Folder" note="Inject your brand docs, style examples, and accumulated feedback into every generation.">
            <button
              onClick={() => set('useContextFolder', !form.useContextFolder)}
              className={`w-12 h-6 rounded-full relative transition-colors ${form.useContextFolder ? '' : 'bg-[#2a2a2a]'}`}
              style={form.useContextFolder ? { background: accentColor } : {}}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.useContextFolder ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </Field>

          <Field label={`Temperature: ${Number(form.temperature).toFixed(2)}`} note="Lower = more focused & consistent. Higher = more varied & creative.">
            <input
              type="range" min={0} max={1} step={0.05}
              value={form.temperature}
              onChange={e => set('temperature', Number(e.target.value))}
              className="w-full" style={{ accentColor }}
            />
          </Field>

          <Field label="Max Output Length (tokens)" note="Higher allows longer articles. 8000 ≈ 2500+ words.">
            <select className={inputCls} value={form.maxTokens} onChange={e => set('maxTokens', Number(e.target.value))}>
              <option value={4000}>4000 — short</option>
              <option value={6000}>6000 — medium</option>
              <option value={8000}>8000 — long (default)</option>
              <option value={12000}>12000 — very long</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Reading Level">
              <select className={inputCls} value={form.readingLevel} onChange={e => set('readingLevel', e.target.value)}>
                <option value="">Default (B2B professional)</option>
                <option value="general business (grade 8-9)">General business</option>
                <option value="executive / C-suite">Executive / C-suite</option>
                <option value="technical / expert">Technical / expert</option>
              </select>
            </Field>
            <Field label="Tone">
              <select className={inputCls} value={form.tone} onChange={e => set('tone', e.target.value)}>
                <option value="">Default</option>
                <option value="confident and direct">Confident & direct</option>
                <option value="consultative and helpful">Consultative</option>
                <option value="data-driven and analytical">Data-driven</option>
                <option value="bold and contrarian">Bold & contrarian</option>
              </select>
            </Field>
          </div>

          <Field label="Standing Instructions" note="Always-applied rules for every article. Edit this yourself between tuning sessions — it's the fastest way to steer output.">
            <textarea
              rows={4}
              className={inputCls + ' resize-none font-mono text-xs'}
              placeholder="e.g. Always mention POSH compliance for India transport articles. Never use the word 'solution' in titles. Open listicles with a surprising stat."
              value={form.customInstructions}
              onChange={e => set('customInstructions', e.target.value)}
            />
          </Field>
        </Section>

        {/* Presets */}
        {presets.length > 0 && (
          <Section title="Saved Presets">
            <div className="space-y-2">
              {presets.map((preset, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                  <div>
                    <div className="text-sm font-medium text-[#f5f5f5]">{preset.name}</div>
                    <div className="text-xs text-[#9ca3af]">
                      {preset.brand} · {preset.geo} · {preset.persona} · {preset.format} · {preset.wordCount}w
                    </div>
                  </div>
                  <button
                    onClick={() => deletePreset(i)}
                    className="text-[#6b7280] hover:text-[#ef4444] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Save */}
        <div className="flex items-center gap-4 pb-8">
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ background: accentColor }}
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
          {saved && <span className="text-sm text-[#22c55e]">✓ Saved</span>}
          {config?.anthropicApiKey && (
            <button
              onClick={() => navigate('/new')}
              className="text-sm text-[#9ca3af] hover:text-[#f5f5f5] transition-colors"
            >
              Back to Generator →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
