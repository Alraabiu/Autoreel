import { env } from '../../config/env.js';

export async function generateScriptAndTitle({
  niche,
  style,
  language,
  avoidTopics = [],
  exampleChannel = '',
  channelSeed,
}) {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

  const prompt = `Create a fresh faceless YouTube short. Niche: ${niche}; visual style: ${style}; language: ${language}; avoid these topics: ${
    avoidTopics.join(', ') || 'none'
  }; example channel for broad inspiration only: ${
    exampleChannel || 'none'
  }; unique channel seed: ${channelSeed}. The seed must influence the specific angle and wording so scripts differ by channel. Return JSON only with title (short, compelling), script (spoken narration for about 35-55 seconds), description (YouTube description with a few relevant hashtags). Do not imitate or copy an example channel.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-nano',
      temperature: 0.9,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an original short-form video writer. Follow the user constraints, avoid prohibited topics, and produce original content in the requested language. Never claim factual certainty when unsure.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'OpenAI text generation failed');

  const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  if (!result.title || !result.script || !result.description) {
    throw new Error('Text provider returned incomplete video content');
  }
  return result;
}

export const estimateTextCost = () => 0.0002;