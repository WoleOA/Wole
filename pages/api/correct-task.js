export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { correction, allTasks } = req.body

  const system = `You are an AI chief of staff for Wole, CEO of Fincra. He has just corrected a task classification. Your job:
1. Understand what the correction reveals about his judgment
2. Look through his backlog and find tasks that are similar enough that they might need the same correction
3. Return only tasks where the similarity is meaningful — same type of work, same delegate candidate, same urgency pattern

Return ONLY valid JSON, no markdown:
{
  "pattern": "one sentence describing what this correction reveals about Wole's judgment",
  "similar_task_ids": ["id1", "id2"],
  "similar_reason": "one sentence explaining why these tasks might need the same correction"
}`

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
        max_tokens: 800,
        system,
        messages: [{
          role: 'user',
          content: `Correction made:
Task: "${correction.task_text}"
Was classified as: ${correction.original_quadrant} / ${correction.original_priority} / ${correction.original_action} → ${correction.original_delegate_to || 'no delegate'}
Corrected to: ${correction.corrected_quadrant} / ${correction.corrected_priority} / ${correction.corrected_action} → ${correction.corrected_delegate_to || 'no delegate'}
${correction.correction_note ? `Wole's note: "${correction.correction_note}"` : ''}

Full backlog (excluding corrected task):
${allTasks.filter(t => t.id !== correction.task_id && !t.done).map(t => `[${t.id}] ${t.quadrant}/${t.priority}/${t.action}→${t.delegate_to||'none'} — ${t.text}`).join('\n')}`
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    res.status(200).json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Analysis failed' })
  }
}
