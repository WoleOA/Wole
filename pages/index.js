import { useState, useRef, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const Q_CONFIG = {
  Q1: { label: 'Q1 — Necessity', sub: 'Important + Urgent', color: '#E84040', bg: '#1a0a0a', border: '#E84040' },
  Q2: { label: 'Q2 — Quality', sub: 'Important + Not Urgent', color: '#00D4AA', bg: '#091a16', border: '#00D4AA' },
  Q3: { label: 'Q3 — Deception', sub: 'Not Important + Urgent', color: '#F5A623', bg: '#1a1205', border: '#F5A623' },
  Q4: { label: 'Q4 — Waste', sub: 'Not Important + Not Urgent', color: '#555', bg: '#111', border: '#333' },
}
const ACTION_COLORS = { 'CEO-only': '#E84040', Delegate: '#F5A623', Schedule: '#00D4AA', Drop: '#444' }
const QUADRANTS = ['Q1','Q2','Q3','Q4']
const PRIORITIES = ['P1','P2','P3']
const ACTIONS = ['CEO-only','Delegate','Schedule','Drop']
const TEAM = ['Babz','Jemima','Nenye','Tochukwu','Gideon','Wukeh','Osahen','Funmi','Tobi','Bayo','Eze','Malaika','Omojo','Abayomi','Ose','Kene','Anita','Segho','Ajah','Chulo','Yaks','Idowu']

const fd = d => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
const ft = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

function LockScreen({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)
  const submit = async () => {
    setLoading(true)
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    const d = await r.json()
    if (d.ok) onUnlock(); else { setErr(true); setLoading(false) }
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, background: '#00D4AA', color: '#000', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 1 }}>F/CEO</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#fff', textTransform: 'uppercase' }}>Command Matrix</div>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: 1 }}>Wole · Fincra</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="password" placeholder="Password" value={pw} onChange={e => { setPw(e.target.value); setErr(false) }} onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ background: '#111', border: `1px solid ${err ? '#E84040' : '#222'}`, color: '#ddd', padding: '10px 14px', fontSize: 13, outline: 'none', width: 220 }} />
        <button onClick={submit} disabled={loading} style={{ background: '#00D4AA', color: '#000', border: 'none', padding: '10px 20px', fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: loading ? 0.6 : 1, cursor: 'pointer' }}>
          {loading ? '...' : 'Enter'}
        </button>
      </div>
      {err && <div style={{ fontSize: 11, color: '#E84040', letterSpacing: 1 }}>Wrong password</div>}
    </div>
  )
}

function CorrectionForm({ task, onSave, onCancel }) {
  const [form, setForm] = useState({
    corrected_quadrant: task.quadrant,
    corrected_priority: task.priority,
    corrected_action: task.action,
    corrected_delegate_to: task.delegate_to || '',
    correction_note: ''
  })
  const sel = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const selStyle = { background: '#111', border: '1px solid #222', color: '#ccc', fontSize: 10, padding: '4px 6px', fontFamily: 'inherit', width: '100%' }

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', padding: 12, marginTop: 8 }}>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>Correct this classification</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 3 }}>Quadrant</div>
          <select value={form.corrected_quadrant} onChange={e => sel('corrected_quadrant', e.target.value)} style={selStyle}>
            {QUADRANTS.map(q => <option key={q}>{q}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 3 }}>Priority</div>
          <select value={form.corrected_priority} onChange={e => sel('corrected_priority', e.target.value)} style={selStyle}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 3 }}>Action</div>
          <select value={form.corrected_action} onChange={e => sel('corrected_action', e.target.value)} style={selStyle}>
            {ACTIONS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 3 }}>Delegate to</div>
          <select value={form.corrected_delegate_to} onChange={e => sel('corrected_delegate_to', e.target.value)} style={selStyle}>
            <option value="">— none —</option>
            {TEAM.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <input value={form.correction_note} onChange={e => sel('correction_note', e.target.value)} placeholder="Optional note — why is this wrong? (helps train future suggestions)"
        style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#aaa', fontSize: 10, padding: '6px 8px', fontFamily: 'inherit', marginBottom: 8, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onSave(form)} style={{ background: '#00D4AA', color: '#000', border: 'none', padding: '6px 14px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}>Save correction</button>
        <button onClick={onCancel} style={{ background: 'transparent', color: '#444', border: '1px solid #222', padding: '6px 10px', fontFamily: 'inherit', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

function SimilarTasksModal({ similar, reason, allTasks, onApply, onDismiss, correction }) {
  const [selected, setSelected] = useState(new Set(similar))
  const tasks = allTasks.filter(t => similar.includes(t.id))
  if (!tasks.length) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000bb', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', padding: 20, maxWidth: 540, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ fontSize: 12, color: '#00D4AA', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>SIMILAR TASKS FOUND</div>
        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 14 }}>{reason}</div>
        {tasks.map(t => {
          const on = selected.has(t.id)
          return (
            <div key={t.id} onClick={() => setSelected(prev => { const n = new Set(prev); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n })}
              style={{ display: 'flex', gap: 10, padding: '8px 10px', marginBottom: 6, border: `1px solid ${on ? '#00D4AA44' : '#1e1e1e'}`, background: on ? '#0d1a14' : 'transparent', cursor: 'pointer' }}>
              <div style={{ width: 14, height: 14, border: `1px solid ${on ? '#00D4AA' : '#333'}`, background: on ? '#00D4AA' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {on && <span style={{ color: '#000', fontSize: 8, fontWeight: 900 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#ccc', marginBottom: 2 }}>{t.text}</div>
                <div style={{ fontSize: 10, color: '#444' }}>{t.quadrant} / {t.priority} / {t.action} {t.delegate_to ? `→ ${t.delegate_to}` : ''}</div>
              </div>
            </div>
          )
        })}
        <div style={{ fontSize: 10, color: '#333', margin: '10px 0 12px' }}>Selected tasks will be updated to match your correction.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onApply([...selected], correction)} style={{ background: '#00D4AA', color: '#000', border: 'none', padding: '8px 16px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}>
            Apply to selected ({selected.size})
          </button>
          <button onClick={onDismiss} style={{ background: 'transparent', color: '#444', border: '1px solid #222', padding: '8px 12px', fontFamily: 'inherit', fontSize: 10, cursor: 'pointer' }}>Dismiss</button>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, onToggleDone, onRemove, onReprioritise, onRequadrant, onCorrect, showReprioritise }) {
  const [showCorrection, setShowCorrection] = useState(false)
  const cfg = Q_CONFIG[task.quadrant] || Q_CONFIG.Q4
  return (
    <div style={{ background: '#ffffff04', padding: '10px 12px', borderLeft: `2px solid ${task.done ? '#1e1e1e' : cfg.border + '55'}`, opacity: task.done ? 0.35 : 1, transition: 'opacity 0.3s', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onToggleDone(task.id)}
            style={{ width: 14, height: 14, border: `1px solid ${task.done ? cfg.color : '#2a2a2a'}`, background: task.done ? cfg.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, transition: 'all 0.2s', cursor: 'pointer' }}>
            {task.done && <span style={{ color: '#000', fontSize: 8, fontWeight: 900 }}>✓</span>}
          </button>
          <span style={{ fontSize: 9, color: cfg.color, border: `1px solid ${cfg.border}44`, padding: '1px 4px', letterSpacing: 1, fontWeight: 700 }}>{task.quadrant}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#555', border: '1px solid #252525', padding: '1px 4px', letterSpacing: 1 }}>{task.priority}</span>
          <span style={{ fontSize: 9, fontWeight: 700, border: `1px solid ${ACTION_COLORS[task.action]}55`, color: ACTION_COLORS[task.action], padding: '1px 4px', letterSpacing: 1, textTransform: 'uppercase' }}>{task.action}</span>
          {task.delegate_to && <span style={{ fontSize: 9, color: '#F5A623' }}>→ {task.delegate_to}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {showReprioritise && (<>
            <select value={task.quadrant || 'Q1'} onChange={e => onRequadrant(task.id, e.target.value)}
              style={{ background: '#111', border: '1px solid #1a1a1a', color: Q_CONFIG[task.quadrant]?.color || '#444', fontSize: 9, padding: '1px 3px', fontFamily: 'inherit', cursor: 'pointer' }}>
              {QUADRANTS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <select value={task.priority || 'P1'} onChange={e => onReprioritise(task.id, e.target.value)}
              style={{ background: '#111', border: '1px solid #1a1a1a', color: '#444', fontSize: 9, padding: '1px 3px', fontFamily: 'inherit', cursor: 'pointer' }}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </>)}
          <button onClick={() => setShowCorrection(v => !v)} title="Correct this classification"
            style={{ background: 'transparent', border: 'none', color: showCorrection ? '#F5A623' : '#252525', fontSize: 12, padding: 0, cursor: 'pointer', lineHeight: 1 }}>↺</button>
          <button onClick={() => onRemove(task.id)} style={{ background: 'transparent', border: 'none', color: '#252525', fontSize: 15, padding: 0, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 3, color: task.done ? '#2a2a2a' : '#ccc', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</div>
      <div style={{ fontSize: 10, color: '#333', lineHeight: 1.4, fontStyle: 'italic' }}>{task.reason}</div>
      {showCorrection && (
        <CorrectionForm task={task} onSave={form => { onCorrect(task, form); setShowCorrection(false) }} onCancel={() => setShowCorrection(false)} />
      )}
    </div>
  )
}

export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [tasks, setTasks] = useState([])
  const [insight, setInsight] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('today')
  const [activeQ, setActiveQ] = useState(null)
  const [showDone, setShowDone] = useState(false)
  const [drag, setDrag] = useState(false)
  const [dbReady, setDbReady] = useState(false)
  const [todayIds, setTodayIds] = useState(new Set())
  const [suggestedIds, setSuggestedIds] = useState([])
  const [suggestReasons, setSuggestReasons] = useState({})
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [similarModal, setSimilarModal] = useState(null)
  const taRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (taRef.current) { taRef.current.style.height = 'auto'; taRef.current.style.height = taRef.current.scrollHeight + 'px' }
  }, [input])

  const loadData = useCallback(async () => {
    const [tasksRes, historyRes, todayRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('today_tasks').select('task_id').eq('date', new Date().toISOString().split('T')[0])
    ])
    if (tasksRes.data) setTasks(tasksRes.data)
    if (historyRes.data) setHistory(historyRes.data.map(s => ({ ...s, tasks: JSON.parse(s.tasks_json || '[]') })))
    if (todayRes.data) setTodayIds(new Set(todayRes.data.map(r => r.task_id)))
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
    const newTaskRows = newTexts.map(text => ({ text, quadrant: null, priority: null, action: null, delegate_to: null, reason: null, done: false }))
    const { data: inserted } = await supabase.from('tasks').insert(newTaskRows).select()
    const allTasks = [...tasks, ...(inserted || [])]
    try {
      const res = await fetch('/api/classify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks: allTasks.map(t => ({ id: t.id, text: t.text })) }) })
      const data = await res.json()
      await Promise.all(data.tasks.map(ct => supabase.from('tasks').update({ quadrant: ct.quadrant, priority: ct.priority, action: ct.action, delegate_to: ct.delegate_to, reason: ct.reason }).eq('id', ct.id)))
      await supabase.from('sessions').insert({ tasks_json: JSON.stringify(data.tasks), insight: data.insight || null, task_count: newTexts.length })
      setTasks(data.tasks.map(ct => ({ ...allTasks.find(t => t.id === ct.id), ...ct })))
      setInsight(data.insight || null)
      setInput('')
      loadData()
    } catch {
      setError('Classification failed. Try again.')
      if (inserted) await supabase.from('tasks').delete().in('id', inserted.map(t => t.id))
    }
    setLoading(false)
  }

  const handleCorrect = async (task, form) => {
    // Save correction to DB
    const correction = {
      task_id: task.id,
      task_text: task.text,
      original_quadrant: task.quadrant,
      original_priority: task.priority,
      original_action: task.action,
      original_delegate_to: task.delegate_to,
      corrected_quadrant: form.corrected_quadrant,
      corrected_priority: form.corrected_priority,
      corrected_action: form.corrected_action,
      corrected_delegate_to: form.corrected_delegate_to || null,
      correction_note: form.correction_note || null,
    }
    await supabase.from('corrections').insert(correction)

    // Log delegate override if changed
    if (form.corrected_delegate_to !== (task.delegate_to || '')) {
      await supabase.from('decision_log').insert({ decision_type: 'delegate_override', task_id: task.id, task_text: task.text, quadrant: task.quadrant, from_value: task.delegate_to || 'none', to_value: form.corrected_delegate_to || 'none' })
    }

    // Apply correction to task in DB and state
    await supabase.from('tasks').update({ quadrant: form.corrected_quadrant, priority: form.corrected_priority, action: form.corrected_action, delegate_to: form.corrected_delegate_to || null }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...form, delegate_to: form.corrected_delegate_to || null } : t))

    // Find similar tasks
    const activeTasks = tasks.filter(t => t.id !== task.id && t.quadrant && !t.done)
    if (activeTasks.length) {
      try {
        const res = await fetch('/api/correct-task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correction, allTasks: activeTasks }) })
        const data = await res.json()
        if (data.similar_task_ids?.length) {
          setSimilarModal({ ids: data.similar_task_ids, reason: data.similar_reason, correction: form })
        }
      } catch { /* silent fail on similar task analysis */ }
    }
  }

  const applyToSimilar = async (ids, correction) => {
    await Promise.all(ids.map(id => supabase.from('tasks').update({ quadrant: correction.corrected_quadrant, priority: correction.corrected_priority, action: correction.corrected_action, delegate_to: correction.corrected_delegate_to || null }).eq('id', id)))
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, quadrant: correction.corrected_quadrant, priority: correction.corrected_priority, action: correction.corrected_action, delegate_to: correction.corrected_delegate_to || null } : t))
    setSimilarModal(null)
  }

  const suggestToday = async () => {
    setSuggesting(true); setError(null)
    const activeTasks = tasks.filter(t => t.quadrant && !t.done)
    try {
      const res = await fetch('/api/suggest-today', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks: activeTasks }) })
      const data = await res.json()
      setSuggestedIds(data.suggested_ids || [])
      setSuggestReasons(data.reasons || {})
      setShowSuggestions(true)
    } catch { setError('Could not generate suggestions.') }
    setSuggesting(false)
  }

  const confirmToday = async (ids) => {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('today_tasks').delete().eq('date', today)
    if (ids.length) {
      await supabase.from('today_tasks').insert(ids.map(id => ({ task_id: id, date: today })))
      const confirmedTasks = tasks.filter(t => ids.includes(t.id))
      await Promise.all(confirmedTasks.map(t => supabase.from('decision_log').insert({ decision_type: 'today_confirm', task_id: t.id, task_text: t.text, quadrant: t.quadrant, from_value: t.priority })))
    }
    setTodayIds(new Set(ids))
    setShowSuggestions(false)
    setSuggestedIds([])
    setView('today')
  }

  const toggleTodayTask = id => setSuggestedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleDone = async id => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newDone = !task.done
    await supabase.from('tasks').update({ done: newDone }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t))
    if (newDone) {
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('today_tasks').delete().eq('task_id', id).eq('date', today)
      setTodayIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const removeTask = async id => {
    await supabase.from('tasks').delete().eq('id', id)
    await supabase.from('today_tasks').delete().eq('task_id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    setTodayIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const reprioritise = async (id, newPriority) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    await supabase.from('tasks').update({ priority: newPriority }).eq('id', id)
    await supabase.from('decision_log').insert({ decision_type: 'reprioritise', task_id: id, task_text: task.text, quadrant: task.quadrant, from_value: task.priority, to_value: newPriority })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, priority: newPriority } : t))
  }

  const requadrant = async (id, newQuadrant) => {
    const task = tasks.find(t => t.id === id)
    if (!task || task.quadrant === newQuadrant) return
    await supabase.from('tasks').update({ quadrant: newQuadrant }).eq('id', id)
    await supabase.from('decision_log').insert({ decision_type: 'requadrant', task_id: id, task_text: task.text, quadrant: task.quadrant, from_value: task.quadrant, to_value: newQuadrant })
    await supabase.from('corrections').insert({ task_id: id, task_text: task.text, original_quadrant: task.quadrant, original_priority: task.priority, original_action: task.action, original_delegate_to: task.delegate_to, corrected_quadrant: newQuadrant, corrected_priority: task.priority, corrected_action: task.action, corrected_delegate_to: task.delegate_to, correction_note: 'Moved via quadrant dropdown' })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, quadrant: newQuadrant } : t))
  }

  const clearAll = async () => {
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('today_tasks').delete().eq('date', new Date().toISOString().split('T')[0])
    setTasks([]); setInsight(null); setInput(''); setTodayIds(new Set())
  }

  const extractImage = async file => {
    setExtracting(true); setError(null)
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file) })
      const resp = await fetch('/api/extract-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageData: b64, mediaType: file.type || 'image/jpeg' }) })
      const data = await resp.json()
      if (data.tasks?.length) setInput(v => v ? v + '\n' + data.tasks.join('\n') : data.tasks.join('\n'))
      else setError('No tasks found in image.')
    } catch { setError('Could not read image.') }
    setExtracting(false)
  }

  const classified = tasks.filter(t => t.quadrant)
  const todayTasks = classified.filter(t => todayIds.has(t.id))
  const backlog = classified.filter(t => !todayIds.has(t.id))
  const grouped = QUADRANTS.reduce((a, q) => { a[q] = backlog.filter(t => t.quadrant === q); return a }, {})
  const filteredBacklog = activeQ ? { [activeQ]: grouped[activeQ] } : grouped
  const counts = QUADRANTS.reduce((a, q) => { a[q] = classified.filter(t => t.quadrant === q).length; return a }, {})
  const todayDone = todayTasks.filter(t => t.done).length
  const backlogActive = classified.filter(t => !t.done).length

  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />

  return (
    <>
      <Head>
        <title>Command Matrix — Fincra</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      {similarModal && (
        <SimilarTasksModal
          similar={similarModal.ids} reason={similarModal.reason} allTasks={tasks}
          correction={similarModal.correction}
          onApply={applyToSimilar}
          onDismiss={() => setSimilarModal(null)} />
      )}

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 16px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: '#00D4AA', color: '#000', fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 1, flexShrink: 0 }}>F/CEO</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#fff', textTransform: 'uppercase' }}>Command Matrix</div>
              <div style={{ fontSize: 10, color: '#444', letterSpacing: 1, marginTop: 2 }}>Wole · Fincra · {fd(new Date())}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUADRANTS.map(q => (
              <div key={q} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 10px', border: `1px solid ${counts[q] > 0 ? Q_CONFIG[q].color + '44' : '#1e1e1e'}`, color: counts[q] > 0 ? Q_CONFIG[q].color : '#333', minWidth: 40 }}>
                <span style={{ fontSize: 9, fontWeight: 700 }}>{q}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{counts[q]}</span>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 10px', border: '1px solid #1e1e1e', color: '#444', minWidth: 44 }}>
              <span style={{ fontSize: 9, fontWeight: 700 }}>TODO</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{backlogActive}</span>
            </div>
          </div>
        </div>

        {/* NAV */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', marginBottom: 20 }}>
          {[
            { key: 'today', label: `Today (${todayTasks.length})` },
            { key: 'backlog', label: `Backlog (${backlogActive})` },
            { key: 'add', label: '+ Add Tasks' },
            { key: 'history', label: `History (${history.length})` },
          ].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${view === v.key ? '#00D4AA' : 'transparent'}`, color: view === v.key ? '#fff' : '#444', fontFamily: 'inherit', fontSize: 11, letterSpacing: 1, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* TODAY */}
        {view === 'today' && <>
          {showSuggestions && (
            <div style={{ border: '1px solid #00D4AA33', background: '#091a16', padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#00D4AA', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>AI SUGGESTED FOR TODAY — confirm or adjust</div>
              {classified.filter(t => !t.done && suggestedIds.includes(t.id)).map(task => {
                const on = suggestedIds.includes(task.id)
                return (
                  <div key={task.id} onClick={() => toggleTodayTask(task.id)}
                    style={{ display: 'flex', gap: 10, padding: '8px 10px', marginBottom: 6, border: `1px solid ${on ? '#00D4AA44' : '#1e1e1e'}`, background: on ? '#0d2018' : 'transparent', cursor: 'pointer' }}>
                    <div style={{ width: 14, height: 14, border: `1px solid ${on ? '#00D4AA' : '#333'}`, background: on ? '#00D4AA' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      {on && <span style={{ color: '#000', fontSize: 8, fontWeight: 900 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#ccc', marginBottom: 2 }}>{task.text}</div>
                      {suggestReasons[task.id] && <div style={{ fontSize: 10, color: '#00D4AA88', fontStyle: 'italic' }}>{suggestReasons[task.id]}</div>}
                    </div>
                    <span style={{ fontSize: 9, color: Q_CONFIG[task.quadrant]?.color, alignSelf: 'flex-start', marginTop: 2 }}>{task.quadrant}/{task.priority}</span>
                  </div>
                )
              })}
              <div style={{ fontSize: 10, color: '#333', margin: '8px 0 12px' }}>Tick/untick to adjust, then confirm.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => confirmToday(suggestedIds)} style={{ background: '#00D4AA', color: '#000', border: 'none', padding: '8px 18px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: 2, cursor: 'pointer' }}>Confirm today</button>
                <button onClick={() => setShowSuggestions(false)} style={{ background: 'transparent', color: '#444', border: '1px solid #222', padding: '8px 14px', fontFamily: 'inherit', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, letterSpacing: 1 }}>Today</div>
              {todayTasks.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div style={{ width: 120, height: 2, background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: '#00D4AA', transition: 'width 0.4s', width: `${todayTasks.length ? (todayDone / todayTasks.length) * 100 : 0}%` }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#383838' }}>{todayDone}/{todayTasks.length} done</span>
                </div>
              )}
            </div>
            <button onClick={suggestToday} disabled={suggesting || !classified.length}
              style={{ background: 'transparent', border: '1px solid #00D4AA44', color: '#00D4AA', fontFamily: 'inherit', fontSize: 10, padding: '7px 14px', cursor: 'pointer', letterSpacing: 1, opacity: suggesting ? 0.6 : 1 }}>
              {suggesting ? 'Thinking...' : '◈ Suggest today'}
            </button>
          </div>

          {todayTasks.length === 0 && !showSuggestions && (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div style={{ fontSize: 12, color: '#242424', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>No tasks for today yet</div>
              <div style={{ fontSize: 10, color: '#1c1c1c', marginBottom: 16 }}>Hit Suggest today to let AI pick your list, or go to Backlog to pick manually.</div>
              <button onClick={suggestToday} disabled={suggesting || !classified.length}
                style={{ background: '#00D4AA', color: '#000', border: 'none', padding: '10px 20px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: 2, cursor: 'pointer', opacity: !classified.length ? 0.4 : 1 }}>
                {suggesting ? 'Thinking...' : '◈ Suggest today'}
              </button>
            </div>
          )}

          {todayTasks.sort((a, b) => {
            const qo = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 }
            const po = { P1: 0, P2: 1, P3: 2 }
            return (qo[a.quadrant] - qo[b.quadrant]) || (po[a.priority] - po[b.priority])
          }).map(task => (
            <TaskCard key={task.id} task={task} onToggleDone={toggleDone} onRemove={removeTask} onReprioritise={reprioritise} onRequadrant={requadrant} onCorrect={handleCorrect} showReprioritise={true} />
          ))}
        </>}

        {/* BACKLOG */}
        {view === 'backlog' && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUADRANTS.map(q => (
                <button key={q} onClick={() => setActiveQ(activeQ === q ? null : q)}
                  style={{ padding: '4px 8px', border: `1px solid ${activeQ === q ? Q_CONFIG[q].color : '#1e1e1e'}`, background: activeQ === q ? Q_CONFIG[q].bg : 'transparent', color: activeQ === q ? Q_CONFIG[q].color : '#444', fontFamily: 'inherit', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                  {q} ({(grouped[q] || []).filter(t => showDone || !t.done).length})
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowDone(v => !v)} style={{ background: 'transparent', border: 'none', color: '#2e2e2e', fontFamily: 'inherit', fontSize: 10, cursor: 'pointer' }}>{showDone ? 'Hide done' : 'Show done'}</button>
              {classified.length > 0 && <button onClick={clearAll} style={{ background: 'transparent', color: '#2a2a2a', border: '1px solid #1a1a1a', padding: '5px 10px', fontFamily: 'inherit', fontSize: 9, cursor: 'pointer' }}>Clear all</button>}
            </div>
          </div>

          {insight && <div style={{ background: '#0d1a1a', border: '1px solid #00D4AA18', padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10 }}>
            <span style={{ color: '#00D4AA', flexShrink: 0 }}>◈</span>
            <span style={{ fontSize: 11, color: '#7ac9bb', lineHeight: 1.6 }}>{insight}</span>
          </div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
            {Object.entries(filteredBacklog).map(([q, items]) => {
              const cfg = Q_CONFIG[q]
              const visible = showDone ? items : items.filter(t => !t.done)
              if (!visible.length) return null
              return (
                <div key={q} style={{ border: `1px solid ${cfg.border}`, background: cfg.bg, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #ffffff05' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: cfg.color, textTransform: 'uppercase' }}>{cfg.label}</div>
                      <div style={{ fontSize: 9, color: '#2e2e2e', marginTop: 2 }}>{cfg.sub}</div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{visible.length}</div>
                  </div>
                  {visible.sort((a, b) => (a.priority || '').localeCompare(b.priority || '')).map(task => (
                    <TaskCard key={task.id} task={task} onToggleDone={toggleDone} onRemove={removeTask} onReprioritise={reprioritise} onRequadrant={requadrant} onCorrect={handleCorrect} showReprioritise={true} />
                  ))}
                </div>
              )
            })}
          </div>

          {backlogActive === 0 && !showDone && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 13, color: '#242424', letterSpacing: 2, textTransform: 'uppercase' }}>{dbReady ? 'Backlog clear' : 'Loading...'}</div>
            </div>
          )}
        </>}

        {/* ADD TASKS */}
        {view === 'add' && <>
          <div style={{ marginBottom: 14, border: `1px solid ${drag ? '#00D4AA' : '#1e1e1e'}`, background: '#0d0d0d', position: 'relative', transition: 'border-color 0.2s' }}
            onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) extractImage(f) }}>
            {drag && <div style={{ position: 'absolute', inset: 0, background: '#0d1a1a', border: '1px dashed #00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#00D4AA', letterSpacing: 2, zIndex: 10 }}>Drop image to extract tasks</div>}
            <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) classify() }}
              placeholder={'Dump tasks — one per line. Or drag a photo of your notes.\n\nE.g.\nReview MI trader PIP framework\nFollow up Babz on commission plan\nApprove Q2 budget variance'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderTop: '1px solid #141414', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => fileRef.current?.click()} disabled={extracting}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid #1e1e1e', color: '#444', fontSize: 10, padding: '5px 10px', cursor: 'pointer' }}>
                  {extracting ? <span style={{ color: '#F5A623' }}>Extracting...</span> : <><span style={{ color: '#00D4AA', fontSize: 13 }}>⊕</span> Upload image</>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) extractImage(f); e.target.value = '' }} />
                <span style={{ fontSize: 9, color: '#2a2a2a' }}>⌘+Enter · drag image to drop</span>
              </div>
              <button onClick={classify} disabled={loading || !input.trim()}
                style={{ background: '#00D4AA', color: '#000', border: 'none', padding: '8px 18px', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
                {loading ? 'Classifying...' : 'Classify & Add'}
              </button>
            </div>
          </div>
          {error && <div style={{ color: '#E84040', fontSize: 11, padding: '4px 0', letterSpacing: 1 }}>{error}</div>}
          {loading && <div style={{ fontSize: 11, color: '#444', padding: '8px 0', letterSpacing: 1 }}>Classifying with your team context and decision history...</div>}
        </>}

        {/* HISTORY */}
        {view === 'history' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {history.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 0' }}><div style={{ fontSize: 13, color: '#242424', letterSpacing: 2, textTransform: 'uppercase' }}>No history yet</div></div>
            : history.map(s => {
              const qc = QUADRANTS.reduce((a, q) => { a[q] = (s.tasks || []).filter(t => t.quadrant === q).length; return a }, {})
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
                    {QUADRANTS.map(q => (
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
                        <span style={{ color: '#F5A623', minWidth: 80 }}>{t.delegate_to || 'TBD'}</span>
                        <span style={{ color: '#333', margin: '0 6px' }}>—</span>
                        <span style={{ color: '#555' }}>{t.text}</span>
                      </div>
                    ))}
                  </div>}
                </div>
              )
            })
          }
        </div>}
      </div>
    </>
  )
}
