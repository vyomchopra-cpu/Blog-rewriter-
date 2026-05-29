import React, { useEffect, useState } from 'react'
import FeatureFeedback from '../components/FeatureFeedback.jsx'

const TABS = [
  { key: 'keywords', label: 'Keywords' },
  { key: 'personas', label: 'Personas' },
  { key: 'styles', label: 'Writing styles' }
]

const uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

export default function Customize({ accentColor = '#6366f1', config }) {
  const role = config?.currentRole || 'admin'
  const [tab, setTab] = useState('keywords')
  const [keywords, setKeywords] = useState([])
  const [personas, setPersonas] = useState([])
  const [styles, setStyles] = useState([])

  useEffect(() => {
    window.electron.invoke('state-get', { key: 'customKeywords', def: [] }).then(v => setKeywords(v || []))
    window.electron.invoke('state-get', { key: 'customPersonas', def: [] }).then(v => setPersonas(v || []))
    window.electron.invoke('state-get', { key: 'customStyles', def: [] }).then(v => setStyles(v || []))
  }, [])

  const save = (key, value, setter) => { setter(value); window.electron.invoke('state-set', { key, value }) }

  // ── Keywords ──
  const [nkw, setNkw] = useState(''); const [nbrand, setNbrand] = useState('MIS'); const [ngeo, setNgeo] = useState('India')
  function addKw() {
    if (!nkw.trim()) return
    save('customKeywords', [...keywords, { keyword: nkw.trim(), brand: nbrand, geo: ngeo, lost: false }], setKeywords)
    setNkw('')
  }

  // ── Persona draft ──
  const blankPersona = { id: '', name: '', icon: '✨', primaryPain: '', keyConcerns: '', vocabulary: '', ctaAngle: '' }
  const [pd, setPd] = useState(blankPersona)
  function addPersona() {
    if (!pd.name.trim()) return
    const item = { ...pd, id: pd.id || uid() }
    const exists = personas.some(p => p.id === item.id)
    save('customPersonas', exists ? personas.map(p => p.id === item.id ? item : p) : [...personas, item], setPersonas)
    setPd(blankPersona)
  }

  // ── Style draft ──
  const [sd, setSd] = useState({ id: '', name: '', instructions: '' })
  function addStyle() {
    if (!sd.name.trim()) return
    const item = { ...sd, id: sd.id || uid() }
    const exists = styles.some(s => s.id === item.id)
    save('customStyles', exists ? styles.map(s => s.id === item.id ? item : s) : [...styles, item], setStyles)
    setSd({ id: '', name: '', instructions: '' })
  }

  const input = 'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5]'

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">Customize</h1>
        <FeatureFeedback feature="Customize (keywords/personas/styles)" accentColor={accentColor} />
      </div>
      <p className="text-sm text-[#9ca3af] mb-5">Add your own keywords, personas, and writing styles. They plug straight into the generator.</p>

      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${tab === t.key ? 'text-white border-transparent' : 'text-[#9ca3af] border-[#2a2a2a] hover:text-[#f5f5f5]'}`} style={tab === t.key ? { background: accentColor } : {}}>{t.label}</button>
        ))}
      </div>

      <div className="max-w-2xl">
        {tab === 'keywords' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input value={nkw} onChange={e => setNkw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKw()} placeholder="New keyword…" className={input} />
              <select value={nbrand} onChange={e => setNbrand(e.target.value)} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-2 text-sm text-[#f5f5f5]"><option value="MIS">MIS</option><option value="WIS">WIS</option></select>
              <select value={ngeo} onChange={e => setNgeo(e.target.value)} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-2 text-sm text-[#f5f5f5]"><option value="India">India</option><option value="US">US</option></select>
              <button onClick={addKw} className="text-sm px-4 rounded-lg text-white" style={{ background: accentColor }}>Add</button>
            </div>
            <div className="space-y-1.5">
              {keywords.length === 0 && <div className="text-xs text-[#6b7280]">No custom keywords yet. They’ll appear in the New Article dropdown marked ⭐.</div>}
              {keywords.map((k, i) => (
                <div key={i} className="flex items-center justify-between bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2">
                  <span className="text-sm text-[#f5f5f5]">⭐ {k.keyword} <span className="text-xs text-[#6b7280]">· {k.brand} · {k.geo}</span></span>
                  <button onClick={() => save('customKeywords', keywords.filter((_, j) => j !== i), setKeywords)} className="text-[#6b7280] hover:text-[#ef4444] text-xs">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'personas' && (
          <div className="space-y-4">
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 space-y-2">
              <div className="text-sm font-medium text-[#f5f5f5]">{pd.id ? 'Edit persona' : 'New persona'}</div>
              <div className="flex gap-2">
                <input value={pd.icon} onChange={e => setPd({ ...pd, icon: e.target.value })} placeholder="emoji" className="w-16 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] text-center" />
                <input value={pd.name} onChange={e => setPd({ ...pd, name: e.target.value })} placeholder="Persona name (e.g. Facilities Head)" className={input} />
              </div>
              <input value={pd.primaryPain} onChange={e => setPd({ ...pd, primaryPain: e.target.value })} placeholder="Primary pain (what keeps them up at night)" className={input} />
              <input value={pd.keyConcerns} onChange={e => setPd({ ...pd, keyConcerns: e.target.value })} placeholder="Key concerns (comma separated)" className={input} />
              <input value={pd.vocabulary} onChange={e => setPd({ ...pd, vocabulary: e.target.value })} placeholder="Vocabulary they use (comma separated)" className={input} />
              <input value={pd.ctaAngle} onChange={e => setPd({ ...pd, ctaAngle: e.target.value })} placeholder="CTA angle" className={input} />
              <div className="flex gap-2">
                <button onClick={addPersona} className="text-sm px-4 py-1.5 rounded-lg text-white" style={{ background: accentColor }}>{pd.id ? 'Save' : 'Add persona'}</button>
                {pd.id && <button onClick={() => setPd(blankPersona)} className="text-sm px-4 py-1.5 rounded-lg border border-[#2a2a2a] text-[#9ca3af]">Cancel</button>}
              </div>
            </div>
            <div className="space-y-1.5">
              {personas.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2">
                  <span className="text-sm text-[#f5f5f5]">{p.icon} {p.name} <span className="text-xs text-[#6b7280]">· {p.primaryPain?.slice(0, 50)}</span></span>
                  <div className="flex gap-2">
                    <button onClick={() => setPd({ ...p, keyConcerns: Array.isArray(p.keyConcerns) ? p.keyConcerns.join(', ') : p.keyConcerns, vocabulary: Array.isArray(p.vocabulary) ? p.vocabulary.join(', ') : p.vocabulary })} className="text-[#9ca3af] hover:text-[#f5f5f5] text-xs">Edit</button>
                    <button onClick={() => save('customPersonas', personas.filter(x => x.id !== p.id), setPersonas)} className="text-[#6b7280] hover:text-[#ef4444] text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'styles' && (
          <div className="space-y-4">
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 space-y-2">
              <div className="text-sm font-medium text-[#f5f5f5]">{sd.id ? 'Edit style' : 'New writing style'}</div>
              <input value={sd.name} onChange={e => setSd({ ...sd, name: e.target.value })} placeholder="Style name (e.g. Punchy LinkedIn)" className={input} />
              <textarea rows={4} value={sd.instructions} onChange={e => setSd({ ...sd, instructions: e.target.value })} placeholder="Describe the style: sentence rhythm, vocabulary, do/don't, examples…" className={`${input} resize-none`} />
              <div className="flex gap-2">
                <button onClick={addStyle} className="text-sm px-4 py-1.5 rounded-lg text-white" style={{ background: accentColor }}>{sd.id ? 'Save' : 'Add style'}</button>
                {sd.id && <button onClick={() => setSd({ id: '', name: '', instructions: '' })} className="text-sm px-4 py-1.5 rounded-lg border border-[#2a2a2a] text-[#9ca3af]">Cancel</button>}
              </div>
            </div>
            <div className="space-y-1.5">
              {styles.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2">
                  <span className="text-sm text-[#f5f5f5]">{s.name} <span className="text-xs text-[#6b7280]">· {s.instructions?.slice(0, 60)}</span></span>
                  <div className="flex gap-2">
                    <button onClick={() => setSd(s)} className="text-[#9ca3af] hover:text-[#f5f5f5] text-xs">Edit</button>
                    <button onClick={() => save('customStyles', styles.filter(x => x.id !== s.id), setStyles)} className="text-[#6b7280] hover:text-[#ef4444] text-xs">Delete</button>
                  </div>
                </div>
              ))}
              {styles.length > 0 && <p className="text-[11px] text-[#6b7280] mt-2">Pick a style in New Article → Writing Style.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
