import { useState, useRef, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const Q_CONFIG = {
  Q1: { label: 'Q1 — Necessity', sub: 'Important + Urgent', color: '#E84040', bg: '#1a0a0a', border: '#E84040' },
  Q2: { label: 'Q2 — Quality', sub: 'Important + Not Urgent', color: '#00D4AA', bg: '#091a16', border: '#00D4AA' },
  Q3: { label: 'Q3 — Deception', sub: 'Not Important + Urgent', color: '#F5A623', bg: '#1a1205', border: '#F5A623' },
  Q4: { label: 'Q4 — Waste', sub: 'Not Important + Not Urgent', color: '#555', bg: '#111', border: '#333' },
}

const ACTION_COLORS = {
  'CEO-only': '#E84040',
  Delegate: '#F5A623',
  Schedule: '#00D4AA',
  Drop: '#444',
}

const fd = d => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
const ft = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// ── Lock screen ──────────────────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    const d = await r.json()
    if (d.ok) { onUnlock() } else { setErr(true); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{ width: 48, height: 48, background: '#00D4AA', color: '#000', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 1 }}>F/CEO</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#fff', textTransform: 'uppercase' }}>Command Matrix</div>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: 1 }}>Wole · Fincra</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ background: '#111', border: `1px solid ${err ? '#E84040' : '#222'}`, color: '#ddd', padding: '10px 14px', fontSize: 13, outline: 'none', width: 220 }}
        />
        <button onClick={submit} disabled={loading} style={{ background: '#00D4AA', color: '#000', border: 'none', padding: '10px 20px', fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: loading ? 0.6 : 1 }}>
          {loading ? '...' : 'Enter'}
        </button>
      </div>
      {err && <div style={{ fontSize: 11, color: '#E84040', letterSpacing: 1 }}>Wrong password</div>}
    </div>
  )
}

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, quadrant, onToggleDone, onRemove }) {
  const cfg = Q_CONFIG[quadrant]
  return (
    <div style={{ background: '#ffffff04', padding: '10px 12px', borderLeft: `2px solid ${task.done ? '#1e1e1e' : cfg.border + '55'}`, opacity: task.done ? 0.35 : 1, transition: 'opacity 0.3s', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onToggleDone(task.id)} style={{ width: 14, height: 14, border: `1px solid ${task.done ? cfg.color : '#2a2a2a'}`, background: task.done ? cfg.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, transition: 'all 0.2s' }}>
            {task.done && <span style={{ color: '#000', fontSize: 8, fontWeight: 900 }}>✓</span>}
          </button>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#555', border: '1px solid #252525', padding: '1px 4px', letterSpacing: 1 }}>{task.priority}</span>
          <span style={{ fontSize: 9, fontWeight: 700, border: `1px solid ${ACTION_COLORS[task.action]}55`, color: ACTION_COLORS[task.action], padding: '1px 4px', letterSpacing: 1, textTransform: 'uppercase' }}>{task.action}</span>
          {task.delegate_to && <span style={{ fontSize: 9, color: '#F5A623' }}>→ {task.delegate_to}</span>}
        </div>
        <button onClick={() => onRemove(task.id)} style={{ background: 'transparent', border: 'none', color: '#252525', fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 3, color: task.done ? '#2a2a2a' : '#ccc', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</div>
      <div style={{ fontSize: 10, color: '#333', lineHeight: 1.4, fontStyle: 'italic' }}>{task.reason}</div>
    </div>
  )
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [tasks, setTasks] = useState([])
  const [insight, setInsight] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState(null)
  const [activeQ, setActiveQ] = useState(null)
  const [view, setView] = useState('matrix')
  const [showDone, setShowDone] = useState(false)
  const [drag, setDrag] = useState(false)
  const [dbReady, setDbReady] = useState(false)
  const taRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (taRef.current) { taRef.current.style.height = 'auto'; taRef.current.style.height = taRef.current.scrollHeight + 'px' }
  }, [input])

  // Load persisted data on auth
  const loadData = useCallback(async () => {
    const [tasksRes, historyRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(10)
    ])
    if (tasksRes.data) setTasks(tasksRes.data)
    if (historyRes.data) {
      setHistory(historyRes.data.map(s => ({ ...s, tasks: JSON.parse(s.tasks_json || '[]') })))
    }
    // Get latest insight
    const latest = historyRes.data?.[0]
    if (latest?.insight) setInsight(latest.insight)
    setDbReady(true)
  }, [])

  useEffect(() => { if (authed) loadData() }, [authed, loadData])

  const parseInput = raw => raw.split('\n').map(l => l.replace(/^[-•*\d.)\]]+\s*/, '').trim()).filter(l => l.length > 2)

  const classify = async () => {
    if (!input.trim()) return
    setLoading(true); setError(null)
    const newTexts = parseInput(input)
    if (!newTexts.length) { setError('No valid tasks found.'); setLoading(false); return }

    // Insert new tasks as pending
    const newTaskRows = newTexts.map(text => ({ text, quadrant: null, priority: null, action: null, delegate_to: null, reason: null, done: false }))
    const { data: inserted } = await supabase.from('tasks').insert(newTaskRows).select()

    const allTasks = [...tasks, ...(inserted || [])]

    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: allTasks.map(t => ({ id: t.id, text: t.text })) })
      })
      const data = await res.json()

      // Update each task in DB with classification
      await Promise.all(data.tasks.map(ct =>
        supabase.from('tasks').update({
          quadrant: ct.quadrant,
          priority: ct.priority,
          action: ct.action,
          delegate_to: ct.delegate_to,
          reason: ct.reason,
        }).eq('id', ct.id)
      ))

      // Save session
      const sessionData = { tasks_json: JSON.stringify(data.tasks), insight: data.insight || null, task_count: newTexts.length }
      await supabase.from('sessions').insert(sessionData)

      setTasks(data.tasks.map(ct => ({ ...allTasks.find(t => t.id === ct.id), ...ct })))
      setInsight(data.insight || null)
      setInput('')
      loadData()
    } catch {
      setError('Classification failed. Try again.')
      // Remove inserted pending tasks on failure
      if (inserted) await supabase.from('tasks').delete().in('id', inserted.map(t => t.id))
    }
    setLoading(false)
  }

  const toggleDone = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newDone = !task.done
    await supabase.from('tasks').update({ done: newDone }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t))
  }

  const removeTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const clearAll = async () => {
    await supabase.from('tasks').delete().neq('id', 0)
    setTasks([]); setInsight(null); setInput('')
  }

  const extractImage = async (file) => {
    setExtracting(true); setError(null)
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file) })
      const resp = await fetch('/api/extract-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: b64, mediaType: file.type || 'image/jpeg' })
      })
      const data = await resp.json()
      if (data.tasks?.length) setInput(v => v ? v + '\n' + data.tasks.join('\n') : data.tasks.join('\n'))
      else setError('No tasks found in image.')
    } catch { setError('Could not read image.') }
    setExtracting(false)
  }

  const classified = tasks.filter(t => t.quadrant)
  const grouped = ['Q1','Q2','Q3','Q4'].reduce((a, q) => { a[q] = classified.filter(t => t.quadrant === q); return a }, {})
  const filtered = activeQ ? { [activeQ]: grouped[activeQ] } : grouped
  const counts = ['Q1','Q2','Q3','Q4'].reduce((a, q) => { a[q] = grouped[q]?.length || 0; return a }, {})
  const doneCount = classified.filter(t => t.done).length

  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />

  return (
    <>
      <Head>
        <title>Command Matrix — Fincra</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '20px 16px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: '#00D4AA', color: '#000', fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 1, flexShrink: 0 }}>F/CEO</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#fff', textTransform: 'uppercase' }}>Command Matrix</div>
              <div style={{ fontSize: 10, color: '#444', letterSpacing: 1, marginTop: 2 }}>Wole · Fincra · {fd(new Date())}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Q1','Q2','Q3','Q4'].map(q => (
                <button key={q} onClick={() => setActiveQ(activeQ === q ? null : q)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 10px', border: `1px solid ${activeQ === q ? Q_CONFIG[q].color : '#1e1e1e'}`, background: activeQ === q ? Q_CONFIG[q].bg : 'transparent', color: counts[q] > 0 ? Q_CONFIG[q].color : '#333', fontFamily: 'inherit', minWidth: 40 }}>
                  <span style={{ fontSize: 9, fontWeight: 700 }}>{q}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{counts[q]}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
              {['matrix','history'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${view === v ? '#00D4AA' : 'transparent'}`, color: view === v ? '#fff' : '#444', fontFamily: 'inherit', fontSize: 11, letterSpacing: 1, padding: '6px 14px', textTransform: 'capitalize' }}>
                  {v}{v === 'history' && history.length > 0 && <span style={{ background: '#1a1a1a', color: '#555', fontSize: 9, padding: '1px 5px', marginLeft: 5 }}>{history.length}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === 'matrix' && <>
          {/* INPUT */}
          <div style={{ marginBottom: 14, border: `1px solid ${drag ? '#00D4AA' : '#1e1e1e'}`, background: '#0d0d0d', position: 'relative', transition: 'border-color 0.2s' }}
            onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) extractImage(f) }}>
            {drag && <div style={{ position: 'absolute', inset: 0, background: '#0d1a1a', border: '1px dashed #00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#00D4AA', letterSpacing: 2, zIndex: 10 }}>Drop image to extract tasks</div>}
            <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) classify() }}
              placeholder={'Dump tasks — one per line. Or drag a photo of your notes.\n\nE.g.\nReview MI trader PIP framework\nFollow up Babz on commission plan\nApprove Q2 budget variance'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderTop: '1px solid #141414', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => fileRef.current?.click()} disabled={extracting}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid #1e1e1e', color: '#444', fontSize: 10, padding: '5px 10px' }}>
                  {extracting ? <span style={{ color: '#F5A623' }}>Extracting...</span> : <><span style={{ color: '#00D4AA', fontSize: 13 }}>⊕</span> Upload image</>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) extractImage(f); e.target.value = '' }} />
                <span style={{ fontSize: 9, color: '#2a2a2a' }}>⌘+Enter · drag image to drop</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {classified.length > 0 && <button onClick={clearAll} style={{ background: 'transparent', color: '#333', border: '1px solid #1a1a1a', padding: '8px 14px', fontSize: 10 }}>Clear all</button>}
                <button onClick={classify} disabled={loading || !input.trim()}
                  style={{ background: '#00D4AA', color: '#000', border: 'none', padding: '8px 18px', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: loading || !input.trim() ? 0.5 : 1 }}>
                  {loading ? 'Classifying...' : 'Classify'}
                </button>
              </div>
            </div>
          </div>

          {error && <div style={{ color: '#E84040', fontSize: 11, padding: '4px 0', letterSpacing: 1 }}>{error}</div>}

          {insight && <div style={{ background: '#0d1a1a', border: '1px solid #00D4AA18', padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10 }}>
            <span style={{ color: '#00D4AA', flexShrink: 0 }}>◈</span>
            <span style={{ fontSize: 11, color: '#7ac9bb', lineHeight: 1.6 }}>{insight}</span>
          </div>}

          {classified.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 2, background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: '#00D4AA', transition: 'width 0.4s', width: `${classified.length ? (doneCount / classified.length) * 100 : 0}%` }} />
            </div>
            <span style={{ fontSize: 10, color: '#383838', letterSpacing: 1, whiteSpace: 'nowrap' }}>{doneCount}/{classified.length} done</span>
            <button onClick={() => setShowDone(v => !v)} style={{ background: 'transparent', border: 'none', color: '#2e2e2e', fontSize: 10, whiteSpace: 'nowrap' }}>{showDone ? 'Hide done' : 'Show done'}</button>
          </div>}

          {classified.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
            {Object.entries(filtered).map(([q, items]) => {
              if (!items.length) return null
              const cfg = Q_CONFIG[q]
              const visible = showDone ? items : items.filter(t => !t.done)
              return (
                <div key={q} style={{ border: `1px solid ${cfg.border}`, background: cfg.bg, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #ffffff05' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: cfg.color, textTransform: 'uppercase' }}>{cfg.label}</div>
                      <div style={{ fontSize: 9, color: '#2e2e2e', marginTop: 2 }}>{cfg.sub}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{visible.length}</div>
                      {items.some(t => t.done) && <div style={{ fontSize: 9, color: '#333', marginTop: 1 }}>{items.filter(t => t.done).length} done</div>}
                    </div>
                  </div>
                  {visible.sort((a, b) => (a.priority || '').localeCompare(b.priority || '')).map(task => (
                    <TaskCard key={task.id} task={task} quadrant={q} onToggleDone={toggleDone} onRemove={removeTask} />
                  ))}
                </div>
              )
            })}
          </div>}

          {classified.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 13, color: '#242424', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{dbReady ? 'Nothing classified yet' : 'Loading...'}</div>
            <div style={{ fontSize: 10, color: '#1c1c1c' }}>{dbReady ? 'Type tasks, paste a list, or drop a photo of your notes.' : ''}</div>
          </div>}
        </>}

        {view === 'history' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {history.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 0' }}><div style={{ fontSize: 13, color: '#242424', letterSpacing: 2, textTransform: 'uppercase' }}>No history yet</div></div>
            : history.map(s => {
              const qc = ['Q1','Q2','Q3','Q4'].reduce((a, q) => { a[q] = (s.tasks || []).filter(t => t.quadrant === q).length; return a }, {})
              const dels = (s.tasks || []).filter(t => t.action === 'Delegate')
              return (
                <div key={s.id} style={{ border: '1px solid #1a1a1a', background: '#0d0d0d', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{ft(s.created_at)}</span>
                      <span style={{ fontSize: 10, color: '#3a3a3a', letterSpacing: 1 }}>{fd(s.created_at)}</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#2e2e2e', letterSpacing: 1 }}>{s.task_count} tasks</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {['Q1','Q2','Q3','Q4'].map(q => (
                      <div key={q} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${qc[q] > 0 ? Q_CONFIG[q].color + '33' : '#1a1a1a'}`, color: qc[q] > 0 ? Q_CONFIG[q].color : '#222', padding: '4px 10px', minWidth: 36 }}>
                        <span style={{ fontSize: 9 }}>{q}</span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{qc[q]}</span>
                      </div>
                    ))}
                  </div>
                  {s.insight && <div style={{ fontSize: 11, color: '#365450', lineHeight: 1.6, marginBottom: 12, padding: '8px 10px', background: '#0a1410', borderLeft: '2px solid #00D4AA22' }}>
                    <span style={{ color: '#00D4AA', marginRight: 8 }}>◈</span>{s.insight}
                  </div>}
                  {dels.length > 0 && <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: '#2e2e2e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Delegated</div>
                    {dels.map((t, i) => (
                      <div key={i} style={{ fontSize: 11, display: 'flex', marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ color: '#F5A623', minWidth: 60 }}>{t.delegate_to || 'TBD'}</span>
                        <span style={{ color: '#333', margin: '0 6px' }}>—</span>
                        <span style={{ color: '#555' }}>{t.text}</span>
                      </div>
                    ))}
                  </div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #111', paddingTop: 10 }}>
                    {(s.tasks || []).map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10 }}>
                        <span style={{ color: Q_CONFIG[t.quadrant]?.color || '#555', fontSize: 9, minWidth: 22, fontWeight: 700 }}>{t.quadrant}</span>
                        <span style={{ color: '#333', fontSize: 9, minWidth: 18 }}>{t.priority}</span>
                        <span style={{ color: '#555', fontSize: 11 }}>{t.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          }
        </div>}
      </div>
    </>
  )
}
