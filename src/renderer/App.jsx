import React, { useState, useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import KeywordSelect from './screens/KeywordSelect.jsx'
import OutlineEditor from './screens/OutlineEditor.jsx'
import ArticleView from './screens/ArticleView.jsx'
import BulkQueue from './screens/BulkQueue.jsx'
import KnowledgeBase from './screens/KnowledgeBase.jsx'
import Settings from './screens/Settings.jsx'
import Recents from './screens/Recents.jsx'
import Workflow from './screens/Workflow.jsx'
import Usage from './screens/Usage.jsx'
import GeoHacker from './screens/GeoHacker.jsx'
import Changelog from './screens/Changelog.jsx'
import Revise from './screens/Revise.jsx'
import Customize from './screens/Customize.jsx'

export default function App() {
  const [config, setConfig] = useState(null)
  const [accentColor, setAccentColor] = useState('#6366f1')

  // Article generation state shared across screens
  const [articleState, setArticleState] = useState({
    inputs: null,
    research: null,
    outline: null,
    draft: null,
    finalHTML: null,
    metadata: null,
    schemaHTML: null,
    linkCount: 0,
    links: [],
    wordCount: 0
  })

  function refreshConfig() {
    return window.electron.invoke('get-config').then(cfg => { setConfig(cfg); return cfg })
  }

  useEffect(() => { refreshConfig() }, [])

  function onBrandChange(brand) {
    setAccentColor(brand === 'MIS' ? '#6366f1' : '#10b981')
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0f0f0f]">
        <div className="text-[#9ca3af] text-sm">Loading...</div>
      </div>
    )
  }

  const needsSetup = !config.anthropicApiKey

  return (
    <MemoryRouter initialEntries={[needsSetup ? '/settings' : '/new']}>
      <div className="flex h-screen overflow-hidden bg-[#0f0f0f]">
        <Sidebar config={config} accentColor={accentColor} onRoleChange={refreshConfig} />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route
              path="/new"
              element={
                <KeywordSelect
                  onBrandChange={onBrandChange}
                  accentColor={accentColor}
                  config={config}
                  onGenerate={(inputs, research, outline) => {
                    setArticleState(s => ({ ...s, inputs, research, outline }))
                  }}
                  articleState={articleState}
                />
              }
            />
            <Route
              path="/outline"
              element={
                <OutlineEditor
                  articleState={articleState}
                  setArticleState={setArticleState}
                  accentColor={accentColor}
                />
              }
            />
            <Route
              path="/article"
              element={
                <ArticleView
                  articleState={articleState}
                  setArticleState={setArticleState}
                  accentColor={accentColor}
                  config={config}
                />
              }
            />
            <Route path="/revise" element={<Revise articleState={articleState} setArticleState={setArticleState} accentColor={accentColor} config={config} />} />
            <Route path="/bulk" element={<BulkQueue accentColor={accentColor} config={config} />} />
            <Route path="/recents" element={<Recents accentColor={accentColor} config={config} />} />
            <Route path="/workflow" element={<Workflow accentColor={accentColor} config={config} />} />
            <Route path="/usage" element={<Usage accentColor={accentColor} config={config} />} />
            <Route path="/geo" element={<GeoHacker accentColor={accentColor} config={config} />} />
            <Route path="/knowledge" element={<KnowledgeBase accentColor={accentColor} config={config} />} />
            <Route path="/customize" element={<Customize accentColor={accentColor} config={config} />} />
            <Route path="/changelog" element={<Changelog accentColor={accentColor} />} />
            <Route
              path="/settings"
              element={<Settings config={config} setConfig={setConfig} accentColor={accentColor} onRoleChange={refreshConfig} />}
            />
            <Route path="*" element={<Navigate to={needsSetup ? '/settings' : '/new'} replace />} />
          </Routes>
        </main>
      </div>
    </MemoryRouter>
  )
}
