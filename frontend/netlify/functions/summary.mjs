import Anthropic from '@anthropic-ai/sdk';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.DASHBOARD_AI_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AI key not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { text, projectName } = body;

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a helpful assistant summarizing a developer's project.
Project: ${projectName || 'Unknown'}
Description: ${text || 'No description provided'}

Give a brief 2-3 sentence summary of what this project is about and suggest one specific thing to work on next. Be concise and practical.`
      }]
    });

    return Response.json({ summary: message.content[0].text });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: '/api/summary' };
