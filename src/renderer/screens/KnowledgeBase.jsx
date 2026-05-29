import React, { useState, useEffect } from 'react'
import FeatureFeedback from '../components/FeatureFeedback.jsx'

function FileList({ title, hint, files, sub, onToggle, onDelete, onImport, accentColor }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[#f5f5f5]">{title}</h3>
        <button
          onClick={() => onImport(sub)}
          className="text-xs px-2.5 py-1 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] transition-colors"
        >
          + Import files
        </button>
      </div>
      <p className="text-xs text-[#6b7280] mb-3">{hint}</p>
      {files.length === 0 ? (
        <div className="text-xs text-[#4b5563] py-3 text-center border border-dashed border-[#2a2a2a] rounded-lg">
          Empty — drop files in the folder or click Import.
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map(f => (
            <div key={f.rel} className="flex items-center gap-3 py-1.5 group">
              <button
                onClick={() => onToggle(f.rel, !f.active)}
                title={f.active ? 'Active — click to disable' : 'Disabled — click to enable'}
                className={`w-8 h-4 rounded-full flex-shrink-0 relative transition-colors ${f.active ? '' : 'bg-[#2a2a2a]'}`}
                style={f.active ? { background: accentColor } : {}}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${f.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${f.active ? 'text-[#d1d5db]' : 'text-[#6b7280] line-through'}`}>{f.name}</div>
                <div className="text-xs text-[#6b7280]">
                  {f.sizeKB} KB {!f.supported && <span className="text-[#f59e0b]">· unsupported (install extractor)</span>}
                </div>
              </div>
              <button
                onClick={() => onDelete(f.rel)}
                className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#ef4444] transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function KnowledgeBase({ accentColor }) {
  const [data, setData] = useState({ context: [], examples: [], collaterals: [], specs: [], feedback: [], dataDir: '' })
  const [status, setStatus] = useState({ extractors: { pdf: false, docx: false } })
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteSub, setNoteSub] = useState('context')
  const [exportMsg, setExportMsg] = useState('')

  async function exportWeekly() {
    setExportMsg('Exporting…')
    const res = await window.electron.invoke('feedback-export')
    setExportMsg(res?.success
      ? `✓ Created ${res.file} (${res.count} entries). An Explorer window opened with it selected — this is the file to send each week.`
      : 'Export failed')
  }

  async function refresh() {
    const [files, st] = await Promise.all([
      window.electron.invoke('context-list'),
      window.electron.invoke('context-status')
    ])
    setData(files)
    setStatus(st)
  }

  useEffect(() => { refresh() }, [])

  async function toggle(rel, active) {
    await window.electron.invoke('context-toggle', { rel, active })
    refresh()
  }
  async function del(rel) {
    await window.electron.invoke('context-delete', { rel })
    refresh()
  }
  async function importFiles(sub) {
    await window.electron.invoke('context-import-files', { sub })
    refresh()
  }
  async function saveNote() {
    if (!noteBody.trim()) return
    await window.electron.invoke('context-add-text', {
      sub: noteSub,
      name: noteTitle.trim() || `note-${Date.now()}`,
      content: noteBody
    })
    setNoteOpen(false); setNoteTitle(''); setNoteBody('')
    refresh()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#f5f5f5]">Context & Feedback</h1>
            <p className="text-sm text-[#9ca3af] mt-1">
              Everything here is read live on every generation. This is how the generator learns MIS/WIS context and improves from feedback.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportWeekly} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: accentColor }}>Export weekly feedback file</button>
            <FeatureFeedback feature="Knowledge base (categories)" accentColor={accentColor} />
          </div>
        </div>
        {exportMsg && <div className="text-xs text-[#22c55e]">{exportMsg}</div>}

        {/* Folder bar */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[#6b7280] uppercase tracking-wide">Data Folder</div>
            <div className="text-sm text-[#d1d5db] font-mono truncate">{data.dataDir}</div>
            <div className="text-xs text-[#6b7280] mt-1">
              PDF extractor: <span className={status.extractors?.pdf ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>{status.extractors?.pdf ? 'on' : 'off'}</span>
              {'  ·  '}DOCX extractor: <span className={status.extractors?.docx ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>{status.extractors?.docx ? 'on' : 'off'}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => window.electron.invoke('context-open-folder').then(refresh)}
              className="text-xs px-3 py-1.5 rounded-lg text-white transition-opacity"
              style={{ background: accentColor }}
            >
              Open Folder
            </button>
            <button
              onClick={() => window.electron.invoke('context-set-dir').then(refresh)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] transition-colors"
            >
              Change…
            </button>
          </div>
        </div>

        {/* Quick note */}
        {noteOpen ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <select
                value={noteSub}
                onChange={e => setNoteSub(e.target.value)}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-[#d1d5db]"
              >
                <option value="context">context</option>
                <option value="examples">examples</option>
                <option value="examples/blogs">examples/blogs</option>
                <option value="examples/newsletters">examples/newsletters</option>
                <option value="examples/one-pagers">examples/one-pagers</option>
                <option value="collaterals">collaterals</option>
                <option value="specs">specs</option>
                <option value="feedback">feedback</option>
              </select>
              <input
                placeholder="Title (optional)"
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-[#f5f5f5]"
              />
            </div>
            <textarea
              rows={5}
              placeholder="Paste brand notes, dos & donts, terminology, a great past intro, a correction…"
              value={noteBody}
              onChange={e => setNoteBody(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] resize-none"
            />
            <div className="flex gap-2">
              <button onClick={saveNote} className="text-sm px-4 py-1.5 rounded-lg text-white" style={{ background: accentColor }}>Save</button>
              <button onClick={() => setNoteOpen(false)} className="text-sm px-4 py-1.5 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5]">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setNoteOpen(true)}
            className="w-full py-2.5 border border-dashed border-[#2a2a2a] rounded-xl text-sm text-[#6b7280] hover:text-[#9ca3af] hover:border-[#3a3a3a] transition-colors"
          >
            + Add a quick context note
          </button>
        )}

        <FileList
          title="Context"
          hint="Brand voice, product facts, terminology, dos & donts. Injected as authoritative brand knowledge."
          files={data.context} sub="context"
          onToggle={toggle} onDelete={del} onImport={importFiles} accentColor={accentColor}
        />
        <FileList
          title="Style Examples"
          hint="Gold-standard past work. Per-format folders (blogs, newsletters, one-pagers…) are read too — use Open Folder to drop files per format. The generator mirrors their depth and voice."
          files={data.examples} sub="examples"
          onToggle={toggle} onDelete={del} onImport={importFiles} accentColor={accentColor}
        />
        <FileList
          title="Collaterals"
          hint="Sales decks, brochures, one-pagers, campaign assets. Injected as authoritative brand material."
          files={data.collaterals} sub="collaterals"
          onToggle={toggle} onDelete={del} onImport={importFiles} accentColor={accentColor}
        />
        <FileList
          title="Specs"
          hint="Product and technical specifications, fact sheets. Keeps claims accurate."
          files={data.specs} sub="specs"
          onToggle={toggle} onDelete={del} onImport={importFiles} accentColor={accentColor}
        />
        <div className="pb-8">
          <FileList
            title="Feedback"
            hint="Auto-filled when writers rate articles. Past corrections the generator must not repeat."
            files={data.feedback} sub="feedback"
            onToggle={toggle} onDelete={del} onImport={importFiles} accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  )
}
