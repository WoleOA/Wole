import { FINCRA_CONTEXT } from '../../lib/constants'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { tasks } = req.body
  if (!tasks || !tasks.length) return res.status(400).json({ error: 'No tasks provided' })

  const system = `You are an AI chief of staff for Wole, CEO of Fincra. Given his full task backlog, select the tasks he should focus on TODAY.

Rules:
- Select 3-7 tasks maximum for today's list
- Prioritise all Q1/P1 tasks first — these are non-negotiable
- Then select the highest-leverage Q2/P1 tasks that move the most important workstreams forward
- Do not include Q4 tasks
- Do not include tasks already marked done
- Consider that Wole should spend ~60% of today on Q1 and ~40% on Q2
- For each suggested task, give a one-line reason WHY today specifically

Respond ONLY with valid JSON, no markdown:
{"suggested_ids":["id1","id2"],"reasons":{"id1":"why today","id2":"why today"}}`

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
        max_tokens: 1000,
        system,
        messages: [{
          role: 'user',
          content: `Today is ${new Date().toDateString()}. Here is the full backlog:\n${tasks.map(t => `[${t.id}] Q:${t.quadrant} P:${t.priority} Action:${t.action} Done:${t.done} — ${t.text}`).join('\n')}`
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    res.status(200).json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Suggestion failed' })
  }
}
