import React, { useState } from 'react'
import FeatureFeedback from '../components/FeatureFeedback.jsx'
import { GEO_ASSET_TYPES, GEO_COMPETITORS, MIS_PROMPT_CORPUS, WIS_PROMPT_CORPUS, GEO_SEED_TEXT } from '../../data/geo-corpus.js'

export default function GeoHacker({ accentColor = '#6366f1', config }) {
  const [brand, setBrand] = useState('MIS')
  const [topic, setTopic] = useState('')
  const [assetType, setAssetType] = useState('canonical')
  const [competitor, setCompetitor] = useState('')
  const [notes, setNotes] = useState('')
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  const corpus = brand === 'MIS' ? MIS_PROMPT_CORPUS : WIS_PROMPT_CORPUS
  const competitors = GEO_COMPETITORS[brand] || []
  const needsCompetitor = assetType === 'comparison' || assetType === 'alternatives'

  async function generate() {
    if (!topic.trim()) return
    setBusy(true); setErr(''); setOut('')
    try {
      const html = await window.electron.invoke('geo-generate', {
        topic: topic.trim(), brand, assetType, competitor: needsCompetitor ? competitor : '', notes: notes.trim()
      })
      setOut(html)
    } catch (e) {
      setErr(e?.message || 'Generation failed')
    }
    setBusy(false)
  }

  async function seedPlaybook() {
    setSeedMsg('Seeding…')
    try {
      await window.electron.invoke('context-add-text', { sub: 'context', name: 'GEO-PLAYBOOK-RULES', content: GEO_SEED_TEXT })
      setSeedMsg('✓ Added to Context — now applied to every generation')
    } catch (e) {
      setSeedMsg('Failed: ' + (e?.message || 'error'))
    }
    setTimeout(() => setSeedMsg(''), 4000)
  }

  function copy() {
    const tmp = document.createElement('div'); tmp.innerHTML = out
    navigator.clipboard.writeText(tmp.innerText || '')
    setCopied(true); setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="h-full flex">
      {/* Left: controls */}
      <div className="w-96 flex-shrink-0 border-r border-[#2a2a2a] overflow-y-auto px-6 py-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-[#f5f5f5]">GEO Hacker</h1>
          <FeatureFeedback feature="GEO Hacker screen" accentColor={accentColor} />
        </div>
        <p className="text-sm text-[#9ca3af] mb-4">Generative Engine Optimization. Citation-ready collateral that ChatGPT, Perplexity, Gemini, Google AIO and Copilot surface and quote. Tuned to your GEO playbook.</p>

        <button onClick={seedPlaybook} className="w-full mb-4 text-xs py-2 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5] hover:border-[#3a3a3a]">
          ＋ Load GEO playbook rules into Context (applies to all content)
        </button>
        {seedMsg && <div className="text-xs text-[#22c55e] mb-3 -mt-2">{seedMsg}</div>}

        {/* Brand */}
        <div className="flex gap-2 mb-4">
          {['MIS', 'WIS'].map(b => (
            <button key={b} onClick={() => { setBrand(b); setCompetitor('') }} className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${brand === b ? 'text-white border-transparent' : 'text-[#9ca3af] border-[#2a2a2a]'}`} style={brand === b ? { background: b === 'WIS' ? '#10b981' : '#6366f1' } : {}}>{b === 'MIS' ? 'MoveInSync' : 'WorkInSync'}</button>
          ))}
        </div>

        {/* Topic + corpus picker */}
        <label className="block text-xs text-[#9ca3af] mb-1">Topic / focus</label>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. employee transport safety compliance" className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] mb-2" />
        <select value="" onChange={e => e.target.value && setTopic(e.target.value)} className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#9ca3af] mb-4">
          <option value="">…or pick a real buyer prompt from the corpus</option>
          {corpus.map(g => (
            <optgroup key={g.group} label={g.group}>
              {g.prompts.map(p => <option key={p} value={p}>{p}</option>)}
            </optgroup>
          ))}
        </select>

        {/* Asset type */}
        <label className="block text-xs text-[#9ca3af] mb-1">Asset type</label>
        <div className="space-y-1.5 mb-4">
          {GEO_ASSET_TYPES.map(a => (
            <button key={a.key} onClick={() => setAssetType(a.key)} className="w-full text-left rounded-lg border px-3 py-2 transition-colors" style={{ borderColor: assetType === a.key ? accentColor : '#2a2a2a', background: assetType === a.key ? `${accentColor}15` : 'transparent' }}>
              <div className="text-sm text-[#f5f5f5]">{a.label}</div>
              <div className="text-[11px] text-[#6b7280]">{a.hint}</div>
            </button>
          ))}
        </div>

        {/* Competitor (for comparison / alternatives) */}
        {needsCompetitor && (
          <div className="mb-4">
            <label className="block text-xs text-[#9ca3af] mb-1">Competitor</label>
            <select value={competitor} onChange={e => setCompetitor(e.target.value)} className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5]">
              <option value="">Select a competitor…</option>
              {competitors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        <label className="block text-xs text-[#9ca3af] mb-1">Extra instructions (optional)</label>
        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="angle, must-include facts, audience…" className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] resize-none mb-4" />

        <button onClick={generate} disabled={busy || !topic.trim()} className="w-full text-sm py-2.5 rounded-lg text-white disabled:opacity-40" style={{ background: accentColor }}>
          {busy ? 'Generating…' : 'Generate collateral'}
        </button>
        {err && <div className="mt-3 text-xs text-[#ef4444]">{err}</div>}
      </div>

      {/* Right: output */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {!out && !busy && <div className="text-sm text-[#6b7280]">Output appears here. Paste it onto your site, blog, G2 profile, or a public page so AI engines can cite it.</div>}
        {busy && <div className="text-sm text-[#9ca3af]">Working…</div>}
        {out && (
          <div>
            <div className="flex items-center justify-end mb-3">
              <button onClick={copy} className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5]">{copied ? '✓ Copied' : 'Copy text'}</button>
            </div>
            <div className="article-preview bg-[#161616] border border-[#2a2a2a] rounded-xl p-6" dangerouslySetInnerHTML={{ __html: out }} />
          </div>
        )}
      </div>
    </div>
  )
}
