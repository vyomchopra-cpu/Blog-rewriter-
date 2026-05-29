import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureFeedback from '../components/FeatureFeedback.jsx'

// Post-publish revise page: edit the HTML, re-clean it, re-check, and push an
// updated draft to WordPress. Nascent: edits the in-memory article.
export default function Revise({ articleState, setArticleState, accentColor = '#6366f1', config }) {
  const navigate = useNavigate()
  const inputs = articleState?.inputs
  const [html, setHtml] = useState(articleState?.finalHTML || '')
  const [lint, setLint] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => { setHtml(articleState?.finalHTML || '') }, [articleState?.finalHTML])

  if (!inputs || !articleState?.finalHTML) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <p className="text-sm text-[#9ca3af] mb-3">No article loaded to revise. Generate or open one first.</p>
        <button onClick={() => navigate('/new')} className="text-sm px-4 py-2 rounded-lg text-white" style={{ background: accentColor }}>New Article</button>
      </div>
    )
  }

  async function recheck() {
    setStatus('Cleaning + linting…')
    const cleaned = await window.electron.invoke('replace-links', { html, brand: inputs.brand })
    setHtml(cleaned)
    const res = await window.electron.invoke('lint-article', { html: cleaned, keyword: inputs.keyword })
    setLint(res)
    setArticleState(s => ({ ...s, finalHTML: cleaned }))
    setStatus('')
  }

  async function repush() {
    setStatus('Pushing updated draft to WordPress…')
    try {
      const res = await window.electron.invoke('push-to-wp', {
        articleData: {
          title: articleState.metadata?.titleTag || inputs.keyword,
          content: html + (articleState.schemaHTML || ''),
          slug: articleState.metadata?.slug,
          metaDescription: articleState.metadata?.metaDescription,
          tags: articleState.metadata?.suggestedTags || [],
          brand: inputs.brand
        }
      })
      setStatus(res?.success ? '✓ Updated draft pushed' : `Failed: ${res?.error || 'unknown'}`)
    } catch (e) {
      setStatus(`Failed: ${e?.message || 'error'}`)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f5f5f5]">Revise</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">{inputs.keyword}</p>
        </div>
        <div className="flex items-center gap-2">
          <FeatureFeedback feature="Revise page" accentColor={accentColor} />
          <button onClick={recheck} className="text-sm px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5]">Re-clean & lint</button>
          <button onClick={repush} className="text-sm px-4 py-1.5 rounded-lg text-white" style={{ background: accentColor }}>Push update to WP</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="w-1/2 border-r border-[#2a2a2a] flex flex-col">
          <div className="px-4 py-2 text-xs text-[#6b7280] border-b border-[#2a2a2a]">HTML (editable)</div>
          <textarea value={html} onChange={e => setHtml(e.target.value)} className="flex-1 bg-[#0f0f0f] text-[#d1d5db] text-xs font-mono p-4 resize-none outline-none" />
        </div>
        <div className="w-1/2 overflow-y-auto">
          <div className="px-4 py-2 text-xs text-[#6b7280] border-b border-[#2a2a2a]">Preview</div>
          <div className="article-preview p-6" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      <div className="px-8 py-2 border-t border-[#2a2a2a] flex items-center gap-4 text-xs">
        {status && <span className="text-[#9ca3af]">{status}</span>}
        {lint && <span className="text-[#9ca3af]">Lint score: <span style={{ color: lint.score >= 80 ? '#22c55e' : lint.score >= 60 ? '#f59e0b' : '#ef4444' }}>{lint.score}</span> · {lint.issues.length} issue(s) · {lint.stats.emDashes} dashes</span>}
      </div>
    </div>
  )
}
