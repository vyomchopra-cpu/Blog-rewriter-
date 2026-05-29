import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Inlined keyword data (renderer can't require() node modules)
const keywords = {
  MIS: {
    US: {
      target: ['company shuttle','corporate shuttle service','employee shuttles','staff shuttle service','employee shuttle service','employee transportation services','transportation for employees','employee transportation solutions','employee transport management system'],
      lost: ['vehicle fleet management','employee transportation solution','employee transportation services','employee transportation software','operations management','what is fleet management system']
    },
    India: {
      target: ['sustainable transportation','employee transportation services','employee transport services','commute to office','commuting to office','corporate employee transportation','employee transport management system','employee transport solution','employee transportation solutions','transport management solution','drop cabs','metro feeder bus','metro feeder bus service','business car rental','corporate car rental services','employee shuttle services','fleet management software','transport management software','transportation management system software','route optimization software','vehicle tracking software','employee transport management software'],
      lost: ['transport services','ets meaning','employee transport solution']
    }
  },
  WIS: {
    US: {
      target: ['hot desking','visitor management system','integrated workplace management system','meeting room booking software','parking management software','visitor management software','space management software','desk booking software','desk booking system','iwms software','workplace experience platform'],
      lost: ['intelligent workplace','hybrid schedule meaning','paperless office solutions','staff booking system','visitor management solution','visitor management system','workplace management solutions','desk sharing','space management tools','space management software','visitor management solutions','visitor management software','office hoteling software']
    },
    India: {
      target: ['workplace management system','workplace management software','hot desking','meeting room booking software','visitor management system','hybrid workplace','workplace experience'],
      lost: ['office space management','work efficiency','hot desking software','visitor management system','space management','flexible workspace','work automation','collaborative workspace','office space standards and guidelines','increase efficiency']
    }
  }
}

const builtinPersonas = [
  { id: 'transport-manager', name: 'Transport Manager', icon: '🚌' },
  { id: 'ehs-director', name: 'EHS Director', icon: '🛡️' },
  { id: 'workplace-director', name: 'Workplace Director', icon: '🏢' },
  { id: 'hr-director', name: 'HR Director', icon: '👥' },
  { id: 'procurement', name: 'Procurement', icon: '📋' },
  { id: 'cfo', name: 'CFO', icon: '💰' },
  { id: 'cto-it', name: 'CTO/IT Director', icon: '💻' },
  { id: 'coo-vp-ops', name: 'COO/VP Ops', icon: '⚙️' }
]

const formats = ['Informational', 'Listicle', 'How-To Guide', 'Definitive Guide', 'Comparison', 'Newsletter', 'One-Pager']

// Content-size tiers (mirror api.js LENGTH_TIERS)
const TIERS = [
  { key: 'small',  label: 'Small',   words: 350 },
  { key: 'medium', label: 'Medium',  words: 900 },
  { key: 'large',  label: 'Large',   words: 1500 },
  { key: 'xlarge', label: 'X-Large', words: 2600 }
]

function isLost(kw, brand, geo) {
  return keywords[brand]?.[geo]?.lost?.some(k => k.toLowerCase() === kw.toLowerCase()) ?? false
}

function getKeywords(brand, geo, custom = []) {
  const data = keywords[brand]?.[geo]
  const base = data ? (() => {
    const lostSet = new Set(data.lost.map(k => k.toLowerCase()))
    return [
      ...data.lost.map(k => ({ keyword: k, lost: true })),
      ...data.target.filter(k => !lostSet.has(k.toLowerCase())).map(k => ({ keyword: k, lost: false }))
    ]
  })() : []
  const mine = (custom || [])
    .filter(c => c.brand === brand && c.geo === geo)
    .map(c => ({ keyword: c.keyword, lost: !!c.lost, custom: true }))
  return [...mine, ...base]
}

export default function KeywordSelect({ onBrandChange, accentColor, onGenerate, articleState, config }) {
  const navigate = useNavigate()

  const [brand, setBrand] = useState(articleState.inputs?.brand || 'MIS')
  const [geo, setGeo] = useState(articleState.inputs?.geo || 'India')
  const [selectedKw, setSelectedKw] = useState(articleState.inputs?.keyword || '')
  const [customKw, setCustomKw] = useState('')
  const [persona, setPersona] = useState(articleState.inputs?.personaId || 'transport-manager')
  const [format, setFormat] = useState(articleState.inputs?.format || 'Informational')
  const [wordCount, setWordCount] = useState(articleState.inputs?.wordCount || 1500)
  const [lostMode, setLostMode] = useState(articleState.inputs?.lostKeywordMode || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Custom (user-extensible) data
  const [customKeywords, setCustomKeywords] = useState([])
  const [customPersonas, setCustomPersonas] = useState([])
  const [customStyles, setCustomStyles] = useState([])
  const [styleId, setStyleId] = useState('')

  useEffect(() => {
    window.electron.invoke('state-get', { key: 'customKeywords', def: [] }).then(v => setCustomKeywords(v || []))
    window.electron.invoke('state-get', { key: 'customPersonas', def: [] }).then(v => setCustomPersonas(v || []))
    window.electron.invoke('state-get', { key: 'customStyles', def: [] }).then(v => setCustomStyles(v || []))
  }, [])

  const allPersonas = [...builtinPersonas, ...customPersonas.map(p => ({ id: p.id, name: p.name, icon: p.icon || '✨', custom: true }))]
  const kwList = getKeywords(brand, geo, customKeywords)

  const activeKw = customKw.trim() || selectedKw
  const activeIsLost = activeKw ? isLost(activeKw, brand, geo) : false

  useEffect(() => {
    onBrandChange(brand)
    setSelectedKw('')
    setCustomKw('')
    const defaultPersona = brand === 'MIS' ? 'transport-manager' : 'workplace-director'
    setPersona(defaultPersona)
  }, [brand])

  useEffect(() => {
    if (activeIsLost) setLostMode(true)
  }, [activeIsLost])

  // Newsletters / one-pagers are shorter by nature — nudge the default down once.
  useEffect(() => {
    if ((format === 'Newsletter' || format === 'One-Pager') && wordCount > 900) setWordCount(700)
  }, [format])

  async function handleGenerate() {
    if (!activeKw) return setError('Please select or enter a keyword.')
    if (!persona) return setError('Please select a persona.')
    setError('')
    setLoading(true)

    const customPersona = customPersonas.find(p => p.id === persona) || null
    const style = customStyles.find(s => s.id === styleId) || null

    const inputs = {
      keyword: activeKw, brand, geo, personaId: persona, format, wordCount,
      lostKeywordMode: lostMode,
      customPersona,
      styleInstructions: style ? style.instructions : ''
    }

    try {
      // Persist a custom keyword the writer typed so it joins their list next time.
      if (customKw.trim() && !kwList.some(k => k.keyword.toLowerCase() === customKw.trim().toLowerCase())) {
        const next = [...customKeywords, { keyword: customKw.trim(), brand, geo, lost: false }]
        setCustomKeywords(next)
        window.electron.invoke('state-set', { key: 'customKeywords', value: next })
      }
      const result = await window.electron.invoke('generate-outline', inputs)
      onGenerate(inputs, result, result)
      navigate('/outline')
    } catch (e) {
      setError(e.message || 'Generation failed. Check your API key in Settings.')
    } finally {
      setLoading(false)
    }
  }

  const pillBase = 'px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer select-none'
  const pillActive = `border-transparent text-white`
  const pillInactive = `border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5] hover:border-[#3a3a3a]`

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8 space-y-7">
        <div>
          <h1 className="text-xl font-semibold text-[#f5f5f5]">New Article</h1>
          <p className="text-sm text-[#9ca3af] mt-1">Configure your article and generate an outline.</p>
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#d1d5db]">Brand</label>
          <div className="flex gap-3">
            {['MIS', 'WIS'].map(b => (
              <button key={b} onClick={() => setBrand(b)} className={`${pillBase} ${brand === b ? pillActive : pillInactive}`} style={brand === b ? { background: accentColor, borderColor: accentColor } : {}}>
                {b === 'MIS' ? 'MoveInSync' : 'WorkInSync'}
              </button>
            ))}
          </div>
        </div>

        {/* Geo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#d1d5db]">Target Market</label>
          <div className="flex gap-3">
            {['India', 'US'].map(g => (
              <button key={g} onClick={() => setGeo(g)} className={`${pillBase} ${geo === g ? pillActive : pillInactive}`} style={geo === g ? { background: accentColor, borderColor: accentColor } : {}}>
                {g === 'India' ? '🇮🇳 India' : '🇺🇸 United States'}
              </button>
            ))}
          </div>
        </div>

        {/* Keyword */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#d1d5db]">Keyword</label>
          <select className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#4b5563]" value={selectedKw} onChange={e => { setSelectedKw(e.target.value); setCustomKw('') }}>
            <option value="">Select a keyword...</option>
            {kwList.map(({ keyword, lost, custom }) => (
              <option key={keyword} value={keyword}>
                {lost ? '🔴 [LOST] ' : ''}{custom ? '⭐ ' : ''}{keyword}
              </option>
            ))}
          </select>
          {selectedKw && activeIsLost && (
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-[#ef4444] text-white px-2 py-0.5 rounded font-medium">LOST</span>
              <span className="text-[#9ca3af]">This keyword has lost ranking — recovery mode auto-enabled.</span>
            </div>
          )}
          <div className="relative">
            <input type="text" className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#4b5563] focus:outline-none focus:border-[#4b5563]" placeholder="Or type a custom keyword (saved to your list)..." value={customKw} onChange={e => { setCustomKw(e.target.value); setSelectedKw('') }} />
          </div>
        </div>

        {/* Persona */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#d1d5db]">Target Persona</label>
          <div className="grid grid-cols-4 gap-2">
            {allPersonas.map(p => (
              <button key={p.id} onClick={() => setPersona(p.id)} className={`p-3 rounded-lg border text-left transition-colors ${persona === p.id ? 'border-transparent' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'}`} style={persona === p.id ? { background: `${accentColor}22`, borderColor: accentColor } : { background: '#1a1a1a' }}>
                <div className="text-lg mb-1">{p.icon}</div>
                <div className={`text-xs font-medium leading-tight ${persona === p.id ? 'text-[#f5f5f5]' : 'text-[#9ca3af]'}`}>{p.name}{p.custom ? '' : ''}</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#6b7280]">Add your own personas in Settings → Custom personas.</p>
        </div>

        {/* Writing style (custom) */}
        {customStyles.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#d1d5db]">Writing Style</label>
            <select value={styleId} onChange={e => setStyleId(e.target.value)} className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5]">
              <option value="">Default</option>
              {customStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#d1d5db]">Article Format</label>
          <div className="flex flex-wrap gap-2">
            {formats.map(f => (
              <button key={f} onClick={() => setFormat(f)} className={`${pillBase} ${format === f ? pillActive : pillInactive} inline-flex items-center gap-1.5`} style={format === f ? { background: accentColor, borderColor: accentColor } : {}}>
                {f}
                {(f === 'Newsletter' || f === 'One-Pager') && <span title="Nascent format — early build" className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Length tier + word count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#d1d5db]">Length: <span className="font-semibold text-[#f5f5f5]">{wordCount.toLocaleString()} words</span></label>
            <div className="flex gap-1.5">
              {TIERS.map(t => (
                <button key={t.key} onClick={() => setWordCount(t.words)} className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${Math.abs(wordCount - t.words) < 80 ? 'text-white border-transparent' : 'text-[#9ca3af] border-[#2a2a2a] hover:text-[#f5f5f5]'}`} style={Math.abs(wordCount - t.words) < 80 ? { background: accentColor } : {}}>{t.label}</button>
              ))}
            </div>
          </div>
          <input type="range" min={300} max={3500} step={50} value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="w-full" style={{ accentColor }} />
          <div className="flex justify-between text-xs text-[#6b7280]"><span>300</span><span>3,500</span></div>
          <p className="text-[11px] text-[#6b7280]">This is now a hard target — the generator enforces ±10% (was overshooting before).</p>
        </div>

        {/* Lost Keyword Mode */}
        <div className="flex items-start gap-3 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <button onClick={() => !activeIsLost && setLostMode(v => !v)} className={`mt-0.5 w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${lostMode ? 'bg-[#ef4444]' : 'bg-[#2a2a2a]'} ${activeIsLost ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${lostMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <div>
            <div className="text-sm font-medium text-[#f5f5f5]">Lost Keyword Recovery Mode</div>
            <div className="text-xs text-[#9ca3af] mt-0.5">Generate deeper than current SERP leaders. Covers angles top results miss.</div>
          </div>
        </div>

        {error && <div className="p-3 bg-[#450a0a] border border-[#ef4444] rounded-lg text-sm text-[#ef4444]">{error}</div>}

        <button onClick={handleGenerate} disabled={loading || !activeKw} className="w-full py-3.5 text-sm font-semibold rounded-xl text-white transition-opacity disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: accentColor }}>
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Researching keyword...
            </>
          ) : 'Generate Outline'}
        </button>
      </div>
    </div>
  )
}
