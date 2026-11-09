import { env } from '../../config/env.js';

export async function generateVoiceover({ script, voice = 'nova', speed = 1.05 }) {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

  const chunks = [];
  const sentences = script.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [script];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > 3800 && current) {
      chunks.push(current.trim());
      current = '';
    }
    current += `${sentence} `;
  }
  if (current.trim()) chunks.push(current.trim());

  const buffers = [];
  for (const input of chunks) {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        speed,
        input,
        response_format: 'mp3',
      }),
    });
    if (!response.ok) {
      let err = {};
      try {
        err = await response.json();
      } catch {}
      throw new Error(err.error?.message || 'OpenAI voice generation failed');
    }
    buffers.push(Buffer.from(await response.arrayBuffer()));
  }

  if (buffers.length === 1) return buffers[0];
  // MP3 frame streams are concatenated; ffmpeg can decode the resulting stream.
  return Buffer.concat(buffers);
}

export const estimateTtsCost = (chars = 4000) => (chars / 1000) * 0.015;