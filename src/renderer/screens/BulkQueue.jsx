import React, { useState, useCallback } from 'react'
import StatusBadge from '../components/StatusBadge.jsx'

const keywords = {
  MIS: {
    US: { target: ['company shuttle','corporate shuttle service','employee shuttles','staff shuttle service','employee shuttle service','employee transportation services','transportation for employees','employee transportation solutions','employee transport management system'], lost: ['vehicle fleet management','employee transportation solution','employee transportation services','employee transportation software','operations management','what is fleet management system'] },
    India: { target: ['sustainable transportation','employee transportation services','employee transport services','commute to office','commuting to office','corporate employee transportation','employee transport management system','employee transport solution','employee transportation solutions','transport management solution','drop cabs','metro feeder bus','metro feeder bus service','business car rental','corporate car rental services','employee shuttle services','fleet management software','transport management software','transportation management system software','route optimization software','vehicle tracking software','employee transport management software'], lost: ['transport services','ets meaning','employee transport solution'] }
  },
  WIS: {
    US: { target: ['hot desking','visitor management system','integrated workplace management system','meeting room booking software','parking management software','visitor management software','space management software','desk booking software','desk booking system','iwms software','workplace experience platform'], lost: ['intelligent workplace','hybrid schedule meaning','paperless office solutions','staff booking system','visitor management solution','visitor management system','workplace management solutions','desk sharing','space management tools','space management software','visitor management solutions','visitor management software','office hoteling software'] },
    India: { target: ['workplace management system','workplace management software','hot desking','meeting room booking software','visitor management system','hybrid workplace','workplace experience'], lost: ['office space management','work efficiency','hot desking software','visitor management system','space management','flexible workspace','work automation','collaborative workspace','office space standards and guidelines','increase efficiency'] }
  }
}

const formats = ['Informational', 'Listicle', 'How-To Guide', 'Definitive Guide', 'Comparison']

const personas = [
  { id: 'transport-manager', name: 'Transport Manager' },
  { id: 'ehs-director', name: 'EHS Director' },
  { id: 'workplace-director', name: 'Workplace Director' },
  { id: 'hr-director', name: 'HR Director' },
  { id: 'procurement', name: 'Procurement' },
  { id: 'cfo', name: 'CFO' },
  { id: 'cto-it', name: 'CTO/IT Director' },
  { id: 'coo-vp-ops', name: 'COO/VP Ops' }
]

function isLost(kw, brand, geo) {
  return keywords[brand]?.[geo]?.lost?.some(k => k.toLowerCase() === kw.toLowerCase()) ?? false
}

function getSmartDefaults(keyword, brand, geo) {
  const kl = keyword.toLowerCase()
  let format = 'Informational'
  let wordCount = 1800
  if (/what is|guide|meaning|definition/.test(kl)) { format = 'Informational'; wordCount = 1800 }
  else if (/software|system|platform|tool/.test(kl)) { format = 'Comparison'; wordCount = 2000 }
  else if (/benefits|ways|tips|how to/.test(kl)) { format = kl.includes('how to') ? 'How-To Guide' : 'Listicle'; wordCount = 1800 }
  else if (/services|solution/.test(kl)) { format = 'Definitive Guide'; wordCount = 2200 }
  const personaId = brand === 'MIS' ? 'transport-manager' : 'workplace-director'
  return { format, wordCount, personaId }
}

export default function BulkQueue({ accentColor, config }) {
  const [brand, setBrand] = useState('MIS')
  const [geo, setGeo] = useState('India')
  const [selected, setSelected] = useState(new Set())
  const [rows, setRows] = useState([])
  const [running, setRunning] = useState(false)

  const allKeywords = [
    ...(keywords[brand]?.[geo]?.lost || []).map(k => ({ keyword: k, lost: true })),
    ...(keywords[brand]?.[geo]?.target || []).filter(k => !(keywords[brand]?.[geo]?.lost || []).map(x => x.toLowerCase()).includes(k.toLowerCase())).map(k => ({ keyword: k, lost: false }))
  ]

  function toggleKw(kw) {
    setSelected(s => {
      const n = new Set(s)
      n.has(kw) ? n.delete(kw) : n.add(kw)
      return n
    })
  }

  function buildRows() {
    const kwArr = [...selected]
    const newRows = kwArr.map(kw => {
      const defaults = getSmartDefaults(kw, brand, geo)
      const lost = isLost(kw, brand, geo)
      return {
        keyword: kw,
        lost,
        personaId: defaults.personaId,
        format: defaults.format,
        wordCount: defaults.wordCount,
        status: 'Queued',
        article: null,
        wpUrl: null,
        error: null
      }
    })
    setRows(newRows)
  }

  function updateRow(idx, patch) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, ...patch } : row))
  }

  async function runAll() {
    if (running || rows.length === 0) return
    setRunning(true)

    const shouldHumanize = await window.electron.invoke('should-humanize')

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.status === 'Done') continue
      const inputs = { keyword: row.keyword, brand, geo, personaId: row.personaId, format: row.format, wordCount: row.wordCount, lostKeywordMode: row.lost }

      try {
        updateRow(i, { status: 'Researching', error: null })
        const research = await window.electron.invoke('generate-outline', inputs)

        updateRow(i, { status: 'Writing' })
        const draft = await window.electron.invoke('generate-draft', { inputs, outlineJSON: research, researchJSON: research })

        let humanized = draft
        if (shouldHumanize) {
          updateRow(i, { status: 'Humanizing' })
          humanized = await window.electron.invoke('humanize-draft', { draftHTML: draft, keyword: row.keyword, brand })
        }

        const withLinks = await window.electron.invoke('replace-links', { html: humanized, brand })
        const metadata = await window.electron.invoke('generate-metadata', { inputs, finalHTML: withLinks })
        const schemaHTML = await window.electron.invoke('generate-schema', { metadata, keyword: row.keyword, brand })
        const finalHTML = withLinks + schemaHTML

        updateRow(i, { status: 'Done', article: { finalHTML, metadata, inputs, draft } })
      } catch (e) {
        updateRow(i, { status: 'Failed', error: e.message })
      }
    }

    setRunning(false)
  }

  async function sendAllToWp() {
    const doneRows = rows.filter(r => r.status === 'Done' && r.article && !r.wpUrl)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.status !== 'Done' || !row.article || row.wpUrl) continue
      try {
        const result = await window.electron.invoke('push-to-wp', {
          articleData: {
            title: row.article.metadata?.titleTag || row.keyword,
            contentHTML: row.article.finalHTML,
            slug: row.article.metadata?.slug || '',
            metaDescription: row.article.metadata?.metaDescription || '',
            focusKeyword: row.keyword,
            tags: row.article.metadata?.suggestedTags || [],
            brand
          }
        })
        if (result.success) updateRow(i, { wpUrl: result.draftUrl })
      } catch (e) {}
    }
  }

  const pillBase = 'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors'
  const pillActive = 'border-transparent text-white'
  const pillInactive = 'border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5]'

  const doneCount = rows.filter(r => r.status === 'Done').length

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#f5f5f5]">Bulk Article Queue</h1>
          <p className="text-sm text-[#9ca3af] mt-1">Select keywords, configure, generate all as WordPress drafts.</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {['MIS', 'WIS'].map(b => (
              <button key={b} onClick={() => { setBrand(b); setSelected(new Set()); setRows([]) }}
                className={`${pillBase} ${brand === b ? pillActive : pillInactive}`}
                style={brand === b ? { background: accentColor } : {}}>
                {b === 'MIS' ? 'MoveInSync' : 'WorkInSync'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['India', 'US'].map(g => (
              <button key={g} onClick={() => { setGeo(g); setSelected(new Set()); setRows([]) }}
                className={`${pillBase} ${geo === g ? pillActive : pillInactive}`}
                style={geo === g ? { background: accentColor } : {}}>
                {g === 'India' ? '🇮🇳 India' : '🇺🇸 US'}
              </button>
            ))}
          </div>
        </div>

        {/* Keyword selection */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#f5f5f5]">{selected.size} selected</span>
            <div className="flex gap-3">
              <button onClick={() => setSelected(new Set(allKeywords.map(k => k.keyword)))}
                className="text-xs text-[#9ca3af] hover:text-[#f5f5f5] transition-colors">Select All</button>
              <button onClick={() => setSelected(new Set())}
                className="text-xs text-[#9ca3af] hover:text-[#f5f5f5] transition-colors">Clear All</button>
            </div>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {allKeywords.map(({ keyword, lost }) => (
              <label key={keyword} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.has(keyword)}
                  onChange={() => toggleKw(keyword)}
                  className="w-4 h-4 rounded border-[#3a3a3a] bg-[#0f0f0f]"
                  style={{ accentColor }}
                />
                <span className="text-sm text-[#d1d5db] group-hover:text-[#f5f5f5] transition-colors">{keyword}</span>
                {lost && <span className="bg-[#ef4444] text-white text-xs px-1.5 py-0.5 rounded font-medium">LOST</span>}
              </label>
            ))}
          </div>
          {selected.size > 0 && rows.length === 0 && (
            <button
              onClick={buildRows}
              className="mt-3 w-full py-2 text-sm font-medium rounded-lg border border-dashed border-[#3a3a3a] text-[#9ca3af] hover:text-[#f5f5f5] hover:border-[#4b5563] transition-colors"
            >
              Configure {selected.size} keywords →
            </button>
          )}
        </div>

        {/* Queue table */}
        {rows.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  {['Keyword', 'Persona', 'Format', 'Words', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[#f5f5f5] font-medium truncate max-w-[200px]">{row.keyword}</span>
                        {row.lost && <span className="bg-[#ef4444] text-white text-xs px-1.5 py-0.5 rounded font-medium">LOST</span>}
                      </div>
                      {row.error && <div className="text-xs text-[#ef4444] mt-0.5 truncate">{row.error}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-[#d1d5db] focus:outline-none"
                        value={row.personaId}
                        disabled={running}
                        onChange={e => updateRow(i, { personaId: e.target.value })}
                      >
                        {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-[#d1d5db] focus:outline-none"
                        value={row.format}
                        disabled={running}
                        onChange={e => updateRow(i, { format: e.target.value })}
                      >
                        {formats.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-[#d1d5db] focus:outline-none"
                        value={row.wordCount}
                        disabled={running}
                        onChange={e => updateRow(i, { wordCount: Number(e.target.value) })}
                      >
                        {[1200,1400,1600,1800,2000,2200,2500].map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={row.status} />
                        {row.status === 'Done' && row.wpUrl && (
                          <button
                            onClick={() => window.electron.invoke('open-external', row.wpUrl)}
                            className="text-xs text-[#818cf8] hover:underline"
                          >
                            WP Draft
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action buttons */}
        {rows.length > 0 && (
          <div className="flex gap-3 pb-8">
            <button
              onClick={runAll}
              disabled={running}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity disabled:opacity-40 flex items-center gap-2"
              style={{ background: accentColor }}
            >
              {running ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Generating...
                </>
              ) : `Generate All Queued (${rows.length})`}
            </button>

            {doneCount > 0 && config?.wpSiteUrl && (
              <button
                onClick={sendAllToWp}
                disabled={running}
                className="px-6 py-2.5 text-sm font-medium rounded-xl border border-[#2a2a2a] text-[#d1d5db] hover:bg-[#1f1f1f] disabled:opacity-40 transition-colors"
              >
                Send All to WordPress ({doneCount})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
