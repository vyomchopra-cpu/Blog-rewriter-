import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const FLAG_COLORS = {
  'GEO DATA':       'bg-[#78350f] text-[#fbbf24]',
  'STAT NEEDED':    'bg-[#1e3a5f] text-[#60a5fa]',
  'PRODUCT MENTION':'bg-[#2e1e4a] text-[#c084fc]',
  'COMPETITOR GAP': 'bg-[#064e3b] text-[#34d399]'
}

function FlagBadge({ flag }) {
  const cls = FLAG_COLORS[flag] || 'bg-[#2a2a2a] text-[#9ca3af]'
  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>{flag}</span>
}

function OutlineItem({ item, onUpdate, onDelete, onAddChild, accentColor, depth = 0 }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(item.text)
  const [expanded, setExpanded] = useState(true)
  const inputRef = useRef()

  function commitEdit() {
    setEditing(false)
    if (text.trim()) onUpdate({ ...item, text: text.trim() })
    else setText(item.text)
  }

  return (
    <div className={depth > 0 ? 'ml-6' : ''}>
      <div className="flex items-start gap-2 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg mb-1.5 group">
        {/* Expand toggle (H2 only) */}
        {depth === 0 && item.children?.length > 0 && (
          <button onClick={() => setExpanded(v => !v)} className="mt-0.5 text-[#6b7280] hover:text-[#9ca3af] flex-shrink-0">
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Level badge */}
        <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${depth === 0 ? 'bg-[#2a2a2a] text-[#a78bfa]' : 'bg-[#1f2937] text-[#60a5fa]'}`}>
          {item.level.toUpperCase()}
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              autoFocus
              className="w-full bg-[#0f0f0f] border border-[#4b5563] rounded px-2 py-0.5 text-sm text-[#f5f5f5] focus:outline-none"
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setEditing(false); setText(item.text) } }}
            />
          ) : (
            <div
              className={`text-sm cursor-pointer hover:text-[#f5f5f5] ${depth === 0 ? 'font-semibold text-[#f5f5f5]' : 'text-[#d1d5db]'}`}
              onClick={() => setEditing(true)}
            >
              {item.text}
            </div>
          )}
          {item.flags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.flags.map(f => <FlagBadge key={f} flag={f} />)}
            </div>
          )}
          {item.contentBrief && (
            <p className="text-xs text-[#6b7280] mt-1 italic">{item.contentBrief}</p>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(item)}
          className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#ef4444] transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Children */}
      {depth === 0 && expanded && item.children?.map((child, ci) => (
        <OutlineItem
          key={ci}
          item={child}
          depth={1}
          accentColor={accentColor}
          onUpdate={updated => {
            const newChildren = [...(item.children || [])]
            newChildren[ci] = updated
            onUpdate({ ...item, children: newChildren })
          }}
          onDelete={() => {
            const newChildren = item.children.filter((_, i) => i !== ci)
            onUpdate({ ...item, children: newChildren })
          }}
          onAddChild={() => {}}
        />
      ))}

      {/* Add H3 button */}
      {depth === 0 && (
        <button
          onClick={() => onAddChild(item)}
          className="ml-6 mb-2 text-xs text-[#6b7280] hover:text-[#9ca3af] flex items-center gap-1 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add H3
        </button>
      )}
    </div>
  )
}

export default function OutlineEditor({ articleState, setArticleState, accentColor }) {
  const navigate = useNavigate()
  const { inputs, research, outline } = articleState
  const [sections, setSections] = useState(outline?.outline || [])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [pass, setPass] = useState('')
  const [excluded, setExcluded] = useState(() => new Set())
  function toggleExcl(text) {
    setExcluded(prev => { const n = new Set(prev); n.has(text) ? n.delete(text) : n.add(text); return n })
  }
  const isExcl = t => excluded.has(t)

  function updateSection(idx, updated) {
    setSections(s => s.map((sec, i) => i === idx ? updated : sec))
  }

  function deleteSection(idx) {
    setSections(s => s.filter((_, i) => i !== idx))
  }

  function addChildToSection(idx) {
    setSections(s => s.map((sec, i) => {
      if (i !== idx) return sec
      return {
        ...sec,
        children: [...(sec.children || []), { level: 'h3', text: 'New subheading', contentBrief: '', flags: [] }]
      }
    }))
  }

  function addH2() {
    setSections(s => [...s, { level: 'h2', text: 'New section', contentBrief: '', flags: [], children: [] }])
  }

  async function handleGenerate() {
    setError('')
    setGenerating(true)
    const updatedOutline = { ...outline, outline: sections }
    const excludeData = [...excluded]
    const filteredResearch = research ? {
      ...research,
      entitiesCommonly: (research.entitiesCommonly || []).filter(e => !excluded.has(e)),
      competitorGaps: (research.competitorGaps || []).filter(e => !excluded.has(e)),
      geoSignals: (research.geoSignals || []).filter(e => !excluded.has(e))
    } : research

    try {
      setPass('Pass 2: Writing article...')
      const draft = await window.electron.invoke('generate-draft', {
        inputs: { ...inputs, excludeData },
        outlineJSON: updatedOutline,
        researchJSON: filteredResearch
      })

      const shouldHumanize = await window.electron.invoke('should-humanize')
      let humanized = draft
      if (shouldHumanize) {
        setPass('Pass 3: Humanizing...')
        humanized = await window.electron.invoke('humanize-draft', {
          draftHTML: draft,
          keyword: inputs.keyword,
          brand: inputs.brand
        })
      }

      setPass('Processing links & metadata...')
      const withLinks = await window.electron.invoke('replace-links', { html: humanized, brand: inputs.brand })
      const metadata = await window.electron.invoke('generate-metadata', { inputs, finalHTML: withLinks })
      const schemaHTML = await window.electron.invoke('generate-schema', {
        metadata,
        keyword: inputs.keyword,
        brand: inputs.brand
      })
      const finalHTML = withLinks + schemaHTML
      const { count, links } = await window.electron.invoke('count-links', { html: finalHTML })
      const wordCount = await window.electron.invoke('count-words', { html: finalHTML })

      setArticleState(s => ({
        ...s,
        outline: updatedOutline,
        draft,
        finalHTML,
        metadata,
        schemaHTML,
        linkCount: count,
        links,
        wordCount
      }))
      navigate('/article')
    } catch (e) {
      setError(e.message || 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
      setPass('')
    }
  }

  if (!inputs) return (
    <div className="flex items-center justify-center h-full text-[#9ca3af] text-sm">
      No article in progress. <button onClick={() => navigate('/new')} className="ml-2 underline">Start new article</button>
    </div>
  )

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Outline editor */}
      <div className="flex-[6] flex flex-col overflow-hidden border-r border-[#2a2a2a]">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#f5f5f5]">Outline Editor</h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">{inputs.keyword} · {inputs.brand} · {inputs.geo}</p>
          </div>
          <span className="text-xs text-[#6b7280]">{sections.length} sections</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0">
          {sections.map((sec, idx) => (
            <OutlineItem
              key={idx}
              item={sec}
              accentColor={accentColor}
              onUpdate={updated => updateSection(idx, updated)}
              onDelete={() => deleteSection(idx)}
              onAddChild={() => addChildToSection(idx)}
            />
          ))}
          <button
            onClick={addH2}
            className="w-full py-2 border border-dashed border-[#2a2a2a] rounded-lg text-sm text-[#6b7280] hover:text-[#9ca3af] hover:border-[#3a3a3a] transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Add H2 Section
          </button>
        </div>

        <div className="px-6 py-4 border-t border-[#2a2a2a] space-y-3">
          {error && (
            <div className="p-3 bg-[#450a0a] border border-[#ef4444] rounded-lg text-sm text-[#ef4444]">{error}</div>
          )}
          {generating && pass && (
            <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
              <svg className="w-4 h-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {pass}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || sections.length === 0}
            className="w-full py-3 text-sm font-semibold rounded-xl text-white transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: accentColor }}
          >
            {generating ? 'Generating...' : 'Generate Article'}
          </button>
        </div>
      </div>

      {/* Right: Research summary */}
      <div className="flex-[4] overflow-y-auto px-6 py-4">
        <h3 className="text-sm font-semibold text-[#f5f5f5] mb-1">Research Summary</h3>
        <p className="text-[11px] text-[#6b7280] mb-4">Click any data point below to <span className="line-through">cross it out</span> — crossed-out points are removed from the article.</p>
        {research ? (
          <div className="space-y-4 text-sm">
            <Row label="Search Intent" value={research.searchIntent} />
            <Row label="Avg Competitor Words" value={research.avgCompetitorWordCount?.toLocaleString()} />
            <Row label="Recommended Words" value={research.recommendedWordCount?.toLocaleString()} />

            {research.entitiesCommonly?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide mb-2">Entities Mentioned</div>
                <div className="flex flex-wrap gap-1.5">
                  {research.entitiesCommonly.map(e => (
                    <span key={e} onClick={() => toggleExcl(e)} title="Click to cross out" className={`px-2 py-0.5 border rounded text-xs cursor-pointer ${isExcl(e) ? 'line-through text-[#6b7280] bg-[#1a1010] border-[#3a1a1a]' : 'text-[#d1d5db] bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]'}`}>{e}</span>
                  ))}
                </div>
              </div>
            )}

            {research.competitorGaps?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide mb-2">What Top Results Miss</div>
                <ul className="space-y-1">
                  {research.competitorGaps.map((g, i) => (
                    <li key={i} onClick={() => toggleExcl(g)} title="Click to cross out" className={`flex items-start gap-2 text-xs cursor-pointer ${isExcl(g) ? 'line-through text-[#6b7280]' : 'text-[#d1d5db]'}`}>
                      <span className="text-[#22c55e] flex-shrink-0 mt-0.5">✓</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {research.geoSignals?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide mb-2">Geo Signals</div>
                <ul className="space-y-1">
                  {research.geoSignals.map((g, i) => (
                    <li key={i} onClick={() => toggleExcl(g)} title="Click to cross out" className={`flex items-start gap-2 text-xs cursor-pointer ${isExcl(g) ? 'line-through text-[#6b7280]' : 'text-[#d1d5db]'}`}>
                      <span className="text-[#f59e0b] flex-shrink-0 mt-0.5">◆</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Researching SERP for {inputs.keyword}...
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
      <span className="text-xs text-[#9ca3af]">{label}</span>
      <span className="text-xs font-medium text-[#f5f5f5] capitalize">{value || '—'}</span>
    </div>
  )
}
