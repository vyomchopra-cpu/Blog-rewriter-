import React, { useState } from 'react'
import FeatureFeedback from '../components/FeatureFeedback.jsx'
import { GEO_ASSET_TYPES, GEO_COMPETITORS, MIS_PROMPT_CORPUS, WIS_PROMPT_CORPUS, GEO_SEED_TEXT } from '../../data/geo-corpus.js'

export default function GeoHacker({ accentColor = '#6366f1', config }) {
  const [brand, setBrand] = useState('MIS')
  const [assetType, setAssetType] = useState('canonical')
  const [competitor, setCompetitor] = useState('')
  const [notes, setNotes] = useState('')
  const [topics, setTopics] = useState([])           // selected topics (multi)
  const [customTopic, setCustomTopic] = useState('')
  const [results, setResults] = useState([])         // { topic, html, status, error }
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [seedMsg, setSeedMsg] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(-1)

  const corpus = brand === 'MIS' ? MIS_PROMPT_CORPUS : WIS_PROMPT_CORPUS
  const competitors = GEO_COMPETITORS[brand] || []
  const needsCompetitor = assetType === 'comparison' || assetType === 'alternatives'

  const toggleTopic = t => setTopics(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])
  const addCustom = () => {
    const t = customTopic.trim()
    if (t && !topics.includes(t)) setTopics(p => [...p, t])
    setCustomTopic('')
  }

  async function generate() {
    if (topics.length === 0) return
    setBusy(true); setProgress('')
    const init = topics.map(t => ({ topic: t, html: '', status: 'queued', error: '' }))
    setResults(init)
    for (let i = 0; i < topics.length; i++) {
      setProgress(`Generating ${i + 1} / ${topics.length}…`)
      setResults(r => r.map((x, j) => j === i ? { ...x, status: 'running' } : x))
      try {
        const html = await window.electron.invoke('geo-generate', {
          topic: topics[i], brand, assetType, competitor: needsCompetitor ? competitor : '', notes: notes.trim()
        })
        setResults(r => r.map((x, j) => j === i ? { ...x, html, status: 'done' } : x))
      } catch (e) {
        setResults(r => r.map((x, j) => j === i ? { ...x, status: 'failed', error: e?.message || 'failed' } : x))
      }
    }
    setProgress(''); setBusy(false)
  }

  async function seedPlaybook() {
    setSeedMsg('Seeding…')
    try {
      await window.electron.invoke('context-add-text', { sub: 'context', name: 'GEO-PLAYBOOK-RULES', content: GEO_SEED_TEXT })
      setSeedMsg('✓ Added to Context — now applied to every generation')
    } catch (e) { setSeedMsg('Failed: ' + (e?.message || 'error')) }
    setTimeout(() => setSeedMsg(''), 4000)
  }

  function copy(html, idx) {
    const tmp = document.createElement('div'); tmp.innerHTML = html
    navigator.clipboard.writeText(tmp.innerText || '')
    setCopiedIdx(idx); setTimeout(() => setCopiedIdx(-1), 1400)
  }

  return (
    <div className="h-full flex">
      {/* Left: controls */}
      <div className="w-[26rem] flex-shrink-0 border-r border-[#2a2a2a] overflow-y-auto px-6 py-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-[#f5f5f5]">GEO Hacker</h1>
          <FeatureFeedback feature="GEO Hacker screen" accentColor={accentColor} />
        </div>
        <p className="text-sm text-[#9ca3af] mb-4">Citation-ready collateral for AI answer engines. Pick multiple topics and batch-generate. Tuned to your GEO playbook.</p>

        <button onClick={seedPlaybook} className="w-full mb-3 text-xs py-2 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5] hover:border-[#3a3a3a]">
          ＋ Load GEO playbook rules into Context (applies to all content)
        </button>
        {seedMsg && <div className="text-xs text-[#22c55e] mb-3 -mt-1">{seedMsg}</div>}

        {/* Brand */}
        <div className="flex gap-2 mb-4">
          {['MIS', 'WIS'].map(b => (
            <button key={b} onClick={() => { setBrand(b); setCompetitor('') }} className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${brand === b ? 'text-white border-transparent' : 'text-[#9ca3af] border-[#2a2a2a]'}`} style={brand === b ? { background: b === 'WIS' ? '#10b981' : '#6366f1' } : {}}>{b === 'MIS' ? 'MoveInSync' : 'WorkInSync'}</button>
          ))}
        </div>

        {/* Selected topics */}
        <label className="block text-xs text-[#9ca3af] mb-1">Topics ({topics.length} selected)</label>
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {topics.map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-2 py-1 text-[#d1d5db]">
                {t.length > 28 ? t.slice(0, 28) + '…' : t}
                <button onClick={() => toggleTopic(t)} className="text-[#6b7280] hover:text-[#ef4444]">✕</button>
              </span>
            ))}
            <button onClick={() => setTopics([])} className="text-xs text-[#6b7280] hover:text-[#ef4444] px-1">clear all</button>
          </div>
        )}
        <div className="flex gap-2 mb-3">
          <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()} placeholder="Type a custom topic + Enter" className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5]" />
          <button onClick={addCustom} className="text-sm px-3 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5]">Add</button>
        </div>

        {/* Corpus multi-select */}
        <div className="border border-[#2a2a2a] rounded-lg max-h-56 overflow-y-auto p-2 mb-4">
          {corpus.map(g => (
            <div key={g.group} className="mb-2">
              <div className="text-[10px] uppercase tracking-wide text-[#6b7280] px-1 mb-1">{g.group}</div>
              {g.prompts.map(p => (
                <label key={p} className="flex items-start gap-2 py-1 px-1 cursor-pointer hover:bg-[#161616] rounded">
                  <input type="checkbox" checked={topics.includes(p)} onChange={() => toggleTopic(p)} className="mt-0.5 w-3.5 h-3.5" style={{ accentColor }} />
                  <span className="text-xs text-[#d1d5db]">{p}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {/* Asset type */}
        <label className="block text-xs text-[#9ca3af] mb-1">Asset type (applied to all selected topics)</label>
        <div className="space-y-1.5 mb-4">
          {GEO_ASSET_TYPES.map(a => (
            <button key={a.key} onClick={() => setAssetType(a.key)} className="w-full text-left rounded-lg border px-3 py-2 transition-colors" style={{ borderColor: assetType === a.key ? accentColor : '#2a2a2a', background: assetType === a.key ? `${accentColor}15` : 'transparent' }}>
              <div className="text-sm text-[#f5f5f5]">{a.label}</div>
              <div className="text-[11px] text-[#6b7280]">{a.hint}</div>
            </button>
          ))}
        </div>

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
        <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="angle, must-include facts…" className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] resize-none mb-4" />

        <button onClick={generate} disabled={busy || topics.length === 0} className="w-full text-sm py-2.5 rounded-lg text-white disabled:opacity-40" style={{ background: accentColor }}>
          {busy ? (progress || 'Generating…') : `Generate ${topics.length || ''} ${topics.length === 1 ? 'asset' : 'assets'}`.trim()}
        </button>
      </div>

      {/* Right: results */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {results.length === 0 && !busy && <div className="text-sm text-[#6b7280]">Select one or more topics on the left, choose an asset type, and batch-generate. Each result appears here ready to paste.</div>}
        {results.map((r, i) => (
          <div key={i} className="border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#141414] border-b border-[#2a2a2a]">
              <div className="text-sm text-[#f5f5f5] truncate">{r.topic}</div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: r.status === 'done' ? '#22c55e' : r.status === 'failed' ? '#ef4444' : '#9ca3af' }}>
                  {r.status === 'running' ? 'writing…' : r.status === 'queued' ? 'queued' : r.status}
                </span>
                {r.status === 'done' && <button onClick={() => copy(r.html, i)} className="text-xs px-2 py-1 rounded border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5]">{copiedIdx === i ? '✓' : 'Copy'}</button>}
              </div>
            </div>
            {r.error && <div className="px-4 py-2 text-xs text-[#ef4444]">{r.error}</div>}
            {r.html && <div className="article-preview bg-[#161616] p-5" dangerouslySetInnerHTML={{ __html: r.html }} />}
          </div>
        ))}
      </div>
    </div>
  )
}
