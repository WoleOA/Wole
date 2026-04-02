import { FINCRA_CONTEXT } from '../../lib/constants'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { tasks } = req.body
  if (!tasks || !tasks.length) return res.status(400).json({ error: 'No tasks provided' })

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
        system: FINCRA_CONTEXT,
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
