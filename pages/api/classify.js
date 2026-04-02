import { FINCRA_CONTEXT } from '../../lib/constants'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { tasks } = req.body
  if (!tasks || !tasks.length) return res.status(400).json({ error: 'No tasks provided' })

  const [correctionsRes, decisionsRes] = await Promise.all([
    supabase.from('corrections').select('*').order('created_at', { ascending: false }).limit(25),
    supabase.from('decision_log').select('*').order('created_at', { ascending: false }).limit(30)
  ])

  const corrections = correctionsRes.data || []
  const decisions = decisionsRes.data || []

  let memoryBlock = ''

  if (corrections.length) {
    memoryBlock += `\n\nWOLE'S CORRECTION HISTORY — learn from these, they show where AI got it wrong:\n`
    corrections.forEach(c => {
      memoryBlock += `- "${c.task_text}" was ${c.original_quadrant}/${c.original_priority}/${c.original_action}→${c.original_delegate_to || 'none'}, corrected to ${c.corrected_quadrant}/${c.corrected_priority}/${c.corrected_action}→${c.corrected_delegate_to || 'none'}${c.correction_note ? ` (note: "${c.correction_note}")` : ''}\n`
    })
  }

  if (decisions.length) {
    memoryBlock += `\nWOLE'S RECENT DECISIONS — his actual behaviour, weight this heavily:\n`
    decisions.forEach(d => {
      if (d.decision_type === 'reprioritise') memoryBlock += `- Reprioritised "${d.task_text}" from ${d.from_value} to ${d.to_value}\n`
      else if (d.decision_type === 'today_confirm') memoryBlock += `- Chose "${d.task_text}" (${d.quadrant}/${d.from_value}) for today's focus\n`
      else if (d.decision_type === 'delegate_override') memoryBlock += `- Changed delegate for "${d.task_text}" from ${d.from_value} to ${d.to_value}\n`
    })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        system: FINCRA_CONTEXT + memoryBlock,
        messages: [{
          role: 'user',
          content: `Classify these tasks:\n${tasks.map(t => `[${t.id}] ${t.text}`).join('\n')}`
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    res.status(200).json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Classification failed' })
  }
}
